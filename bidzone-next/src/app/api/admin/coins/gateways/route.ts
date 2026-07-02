import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { connectToDatabase } from '@/lib/mongodb'
import { PaymentGatewayModel } from '@/models/Coin'
import { toPaymentGateway } from '@/lib/coins'

const PROVIDERS = ['card', 'paypal', 'bank_transfer', 'mobile_wallet', 'crypto']

type CreateGatewayBody = {
  name?: string
  provider?: string
  feePercent?: number
  enabled?: boolean
  sortOrder?: number
}

/** Add a payment gateway option. */
export async function POST(req: NextRequest) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = (await req.json()) as CreateGatewayBody

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Gateway name is required' }, { status: 400 })
    }
    if (!PROVIDERS.includes(body.provider ?? '')) {
      return NextResponse.json({ error: 'Invalid provider type' }, { status: 400 })
    }

    await connectToDatabase()

    const gateway = await PaymentGatewayModel.create({
      name: body.name.trim(),
      provider: body.provider as 'card' | 'paypal' | 'bank_transfer' | 'mobile_wallet' | 'crypto',
      feePercent: Math.min(30, Math.max(0, body.feePercent ?? 0)),
      enabled: body.enabled ?? true,
      sortOrder: Number.isFinite(body.sortOrder) ? body.sortOrder : 99,
    })

    return NextResponse.json({ gateway: toPaymentGateway(gateway) }, { status: 201 })
  } catch (err) {
    console.error('[/api/admin/coins/gateways POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
