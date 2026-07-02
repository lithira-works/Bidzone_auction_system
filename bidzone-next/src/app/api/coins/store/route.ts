import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth'
import { UserModel } from '@/models/User'
import { CoinPackageModel, CoinSettingsModel, PaymentGatewayModel } from '@/models/Coin'
import { ensureCoinDefaults, toCoinPackage, toCoinSettings, toPaymentGateway } from '@/lib/coins'

/** Public store data: active packages, purchase rules, enabled gateways, wallet balance. */
export async function GET(req: NextRequest) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()
    await ensureCoinDefaults()

    const [packages, settings, gateways, user] = await Promise.all([
      CoinPackageModel.find({ active: true }).sort({ sortOrder: 1 }),
      CoinSettingsModel.findOne({ key: 'global' }),
      PaymentGatewayModel.find({ enabled: true }).sort({ sortOrder: 1 }),
      UserModel.findById(claims.userId).select('bcBalance'),
    ])

    return NextResponse.json({
      packages: packages.map(toCoinPackage),
      settings: settings ? toCoinSettings(settings) : null,
      gateways: gateways.map(toPaymentGateway),
      balance: user?.bcBalance ?? 0,
    })
  } catch (err) {
    console.error('[/api/coins/store GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
