import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { connectToDatabase } from '@/lib/mongodb'
import { CoinPackageModel, CoinSettingsModel, PaymentGatewayModel, CoinTransactionModel } from '@/models/Coin'
import { ensureCoinDefaults, toCoinPackage, toCoinSettings, toPaymentGateway, toCoinTransaction } from '@/lib/coins'

/** Full coin-store management payload for the admin console. */
export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await connectToDatabase()
    await ensureCoinDefaults()

    const [packages, settings, gateways, recentTx, revenueAgg] = await Promise.all([
      CoinPackageModel.find().sort({ sortOrder: 1 }),
      CoinSettingsModel.findOne({ key: 'global' }),
      PaymentGatewayModel.find().sort({ sortOrder: 1 }),
      CoinTransactionModel.find({ type: 'purchase' }).sort({ createdAt: -1 }).limit(25),
      CoinTransactionModel.aggregate([
        { $match: { type: 'purchase', status: 'completed' } },
        {
          $group: {
            _id: null,
            totalRevenueUSD: { $sum: '$priceUSD' },
            totalBcSold: { $sum: '$bcAmount' },
            purchases: { $sum: 1 },
          },
        },
      ]),
    ])

    return NextResponse.json({
      packages: packages.map(toCoinPackage),
      settings: settings ? toCoinSettings(settings) : null,
      gateways: gateways.map(toPaymentGateway),
      recentTransactions: recentTx.map(toCoinTransaction),
      stats: {
        totalRevenueUSD: revenueAgg[0]?.totalRevenueUSD ?? 0,
        totalBcSold: revenueAgg[0]?.totalBcSold ?? 0,
        purchases: revenueAgg[0]?.purchases ?? 0,
      },
    })
  } catch (err) {
    console.error('[/api/admin/coins GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

type CreatePackageBody = {
  name?: string
  bcAmount?: number
  bonusBc?: number
  priceUSD?: number
  badge?: string
  tier?: string
  active?: boolean
  sortOrder?: number
}

const TIERS = ['starter', 'bronze', 'silver', 'gold', 'platinum', 'diamond']

/** Create a new coin package. */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await req.json()) as CreatePackageBody

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Package name is required' }, { status: 400 })
    }
    if (!Number.isFinite(body.bcAmount) || (body.bcAmount ?? 0) < 1) {
      return NextResponse.json({ error: 'BC amount must be at least 1' }, { status: 400 })
    }
    if (!Number.isFinite(body.priceUSD) || (body.priceUSD ?? 0) <= 0) {
      return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 })
    }

    await connectToDatabase()

    const pkg = await CoinPackageModel.create({
      name: body.name.trim(),
      bcAmount: Math.floor(body.bcAmount!),
      bonusBc: Math.max(0, Math.floor(body.bonusBc ?? 0)),
      priceUSD: Math.round(body.priceUSD! * 100) / 100,
      badge: (body.badge ?? '').trim(),
      tier: (TIERS.includes(body.tier ?? '') ? body.tier : 'starter') as
        'starter' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond',
      active: body.active ?? true,
      sortOrder: Number.isFinite(body.sortOrder) ? body.sortOrder : 99,
    })

    return NextResponse.json({ package: toCoinPackage(pkg) }, { status: 201 })
  } catch (err) {
    console.error('[/api/admin/coins POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

type SettingsBody = {
  customEnabled?: boolean
  customMinBc?: number
  customMaxBc?: number
  usdPerBc?: number
  dailyPurchaseCapBc?: number
  maxWalletBc?: number
}

/** Update global coin settings (custom amount rules, caps, rate). */
export async function PATCH(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await req.json()) as SettingsBody

    await connectToDatabase()
    await ensureCoinDefaults()

    const updates: Record<string, unknown> = { updatedBy: admin.email }

    if (typeof body.customEnabled === 'boolean') updates.customEnabled = body.customEnabled
    if (Number.isFinite(body.customMinBc) && body.customMinBc! >= 1) updates.customMinBc = Math.floor(body.customMinBc!)
    if (Number.isFinite(body.customMaxBc) && body.customMaxBc! >= 1) updates.customMaxBc = Math.floor(body.customMaxBc!)
    if (Number.isFinite(body.usdPerBc) && body.usdPerBc! > 0) updates.usdPerBc = body.usdPerBc
    if (Number.isFinite(body.dailyPurchaseCapBc) && body.dailyPurchaseCapBc! >= 0) updates.dailyPurchaseCapBc = Math.floor(body.dailyPurchaseCapBc!)
    if (Number.isFinite(body.maxWalletBc) && body.maxWalletBc! >= 0) updates.maxWalletBc = Math.floor(body.maxWalletBc!)

    /* Cross-field sanity: min must not exceed max */
    const current = await CoinSettingsModel.findOne({ key: 'global' })
    const nextMin = (updates.customMinBc as number) ?? current?.customMinBc ?? 100
    const nextMax = (updates.customMaxBc as number) ?? current?.customMaxBc ?? 50000
    if (nextMin > nextMax) {
      return NextResponse.json({ error: 'Custom minimum cannot exceed maximum' }, { status: 400 })
    }

    const settings = await CoinSettingsModel.findOneAndUpdate(
      { key: 'global' },
      { $set: updates },
      { new: true, upsert: true },
    )

    return NextResponse.json({ settings: toCoinSettings(settings) })
  } catch (err) {
    console.error('[/api/admin/coins PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
