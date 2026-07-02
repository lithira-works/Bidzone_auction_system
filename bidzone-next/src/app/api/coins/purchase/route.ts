import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth'
import { UserModel } from '@/models/User'
import {
  CoinPackageModel,
  CoinSettingsModel,
  CoinTransactionModel,
  PaymentGatewayModel,
} from '@/models/Coin'
import { ensureCoinDefaults, money, toCoinTransaction } from '@/lib/coins'

type PurchaseBody = {
  /** Either a fixed package… */
  packageId?: string
  /** …or a custom BC amount (mutually exclusive) */
  customBc?: number
  gatewayId?: string
}

/**
 * POST /api/coins/purchase
 * Strict server-authoritative flow:
 *  1. Validate the JWT and load the wallet.
 *  2. Resolve BC amount + USD price FROM THE DATABASE (never trust client price).
 *  3. Enforce caps: custom min/max, rolling 24h purchase cap, max wallet size.
 *  4. Charge through the selected gateway (simulated PSP charge in dev).
 *  5. Credit wallet atomically ($inc) and write an immutable ledger entry.
 */
export async function POST(req: NextRequest) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as PurchaseBody

    if (!body.gatewayId) {
      return NextResponse.json({ error: 'Select a payment method' }, { status: 400 })
    }
    const hasPackage = typeof body.packageId === 'string' && body.packageId.length > 0
    const hasCustom = typeof body.customBc === 'number'
    if (hasPackage === hasCustom) {
      return NextResponse.json({ error: 'Choose a package or a custom amount' }, { status: 400 })
    }

    await connectToDatabase()
    await ensureCoinDefaults()

    const [settings, gateway, user] = await Promise.all([
      CoinSettingsModel.findOne({ key: 'global' }),
      PaymentGatewayModel.findById(body.gatewayId),
      UserModel.findById(claims.userId).select('bcBalance email'),
    ])

    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }
    if (!gateway || !gateway.enabled) {
      return NextResponse.json({ error: 'Payment method unavailable' }, { status: 400 })
    }
    if (!settings) {
      return NextResponse.json({ error: 'Store is not configured' }, { status: 503 })
    }

    /* ── Resolve BC amount + price from DB ── */
    let bcCredit = 0
    let priceUSD = 0
    let packageId: string | null = null
    let packageName = ''

    if (hasPackage) {
      const pkg = await CoinPackageModel.findById(body.packageId)
      if (!pkg || !pkg.active) {
        return NextResponse.json({ error: 'Package unavailable' }, { status: 400 })
      }
      bcCredit = pkg.bcAmount + pkg.bonusBc
      priceUSD = pkg.priceUSD
      packageId = pkg._id.toString()
      packageName = pkg.name
    } else {
      if (!settings.customEnabled) {
        return NextResponse.json({ error: 'Custom amounts are currently disabled' }, { status: 400 })
      }
      const requested = Math.floor(body.customBc!)
      if (!Number.isFinite(requested) || requested < settings.customMinBc || requested > settings.customMaxBc) {
        return NextResponse.json(
          { error: `Custom amount must be between ${settings.customMinBc} and ${settings.customMaxBc} BC` },
          { status: 400 },
        )
      }
      bcCredit = requested
      priceUSD = money(requested * settings.usdPerBc)
      packageName = 'Custom Amount'
    }

    /* ── Enforce rolling 24h purchase cap ── */
    if (settings.dailyPurchaseCapBc > 0) {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
      const agg = await CoinTransactionModel.aggregate([
        { $match: { userId: claims.userId, type: 'purchase', status: 'completed', createdAt: { $gte: since } } },
        { $group: { _id: null, total: { $sum: '$bcAmount' } } },
      ])
      const purchased24h = agg[0]?.total ?? 0
      if (purchased24h + bcCredit > settings.dailyPurchaseCapBc) {
        return NextResponse.json(
          { error: `Daily purchase limit reached (${settings.dailyPurchaseCapBc.toLocaleString()} BC / 24h)` },
          { status: 429 },
        )
      }
    }

    /* ── Enforce max wallet size ── */
    if (settings.maxWalletBc > 0 && user.bcBalance + bcCredit > settings.maxWalletBc) {
      return NextResponse.json(
        { error: `Wallet limit exceeded (max ${settings.maxWalletBc.toLocaleString()} BC)` },
        { status: 400 },
      )
    }

    /* ── Gateway fee + total charge ── */
    const fee = money(priceUSD * (gateway.feePercent / 100))
    const totalCharge = money(priceUSD + fee)

    /*
     * ── Payment charge ──
     * PSP integration point: in production this calls Stripe/PayPal/etc. and only
     * proceeds after the webhook/charge confirmation. Here the charge is simulated
     * as instantly successful so the flow remains fully testable end-to-end.
     */
    const reference = `BC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`

    /* ── Atomic wallet credit ── */
    const updated = await UserModel.findOneAndUpdate(
      { _id: claims.userId },
      { $inc: { bcBalance: bcCredit } },
      { returnDocument: 'after', select: 'bcBalance' },
    )
    if (!updated) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    /* ── Immutable ledger entry ── */
    const tx = await CoinTransactionModel.create({
      userId: claims.userId,
      type: 'purchase',
      bcAmount: bcCredit,
      balanceAfter: updated.bcBalance,
      priceUSD: totalCharge,
      reference,
      packageId,
      packageName,
      gatewayId: gateway._id.toString(),
      gatewayName: gateway.name,
      status: 'completed',
      note: fee > 0 ? `Includes ${gateway.feePercent}% gateway fee ($${fee.toFixed(2)})` : '',
    })

    return NextResponse.json(
      {
        transaction: toCoinTransaction(tx),
        balance: updated.bcBalance,
        charged: totalCharge,
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[/api/coins/purchase POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
