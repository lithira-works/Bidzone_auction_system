import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { connectToDatabase } from '@/lib/mongodb'
import { PaymentGatewayModel } from '@/models/Coin'
import { toPaymentGateway } from '@/lib/coins'

type Params = { params: Promise<{ id: string }> }

type UpdateGatewayBody = {
  name?: string
  feePercent?: number
  enabled?: boolean
  sortOrder?: number
}

/** Update a payment gateway. */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = (await req.json()) as UpdateGatewayBody

    await connectToDatabase()

    const updates: Record<string, unknown> = {}
    if (body.name !== undefined) {
      if (!body.name.trim()) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
      updates.name = body.name.trim()
    }
    if (body.feePercent !== undefined && Number.isFinite(body.feePercent)) {
      updates.feePercent = Math.min(30, Math.max(0, body.feePercent))
    }
    if (typeof body.enabled === 'boolean') updates.enabled = body.enabled
    if (body.sortOrder !== undefined && Number.isFinite(body.sortOrder)) updates.sortOrder = body.sortOrder

    const gateway = await PaymentGatewayModel.findByIdAndUpdate(id, { $set: updates }, { returnDocument: 'after', runValidators: true })
    if (!gateway) {
      return NextResponse.json({ error: 'Gateway not found' }, { status: 404 })
    }

    return NextResponse.json({ gateway: toPaymentGateway(gateway) })
  } catch (err) {
    console.error('[/api/admin/coins/gateways/[id] PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** Remove a payment gateway. */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    await connectToDatabase()

    const gateway = await PaymentGatewayModel.findByIdAndDelete(id)
    if (!gateway) {
      return NextResponse.json({ error: 'Gateway not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/admin/coins/gateways/[id] DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
