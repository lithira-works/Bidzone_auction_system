import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { connectToDatabase } from '@/lib/mongodb'
import { CoinPackageModel } from '@/models/Coin'
import { toCoinPackage } from '@/lib/coins'

type Params = { params: Promise<{ id: string }> }

const TIERS = ['starter', 'bronze', 'silver', 'gold', 'platinum', 'diamond']

type UpdateBody = {
  name?: string
  bcAmount?: number
  bonusBc?: number
  priceUSD?: number
  badge?: string
  tier?: string
  active?: boolean
  sortOrder?: number
}

/** Update a coin package. */
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = (await req.json()) as UpdateBody

    await connectToDatabase()

    const updates: Record<string, unknown> = {}
    if (body.name !== undefined) {
      if (!body.name.trim()) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
      updates.name = body.name.trim()
    }
    if (body.bcAmount !== undefined) {
      if (!Number.isFinite(body.bcAmount) || body.bcAmount < 1) {
        return NextResponse.json({ error: 'BC amount must be at least 1' }, { status: 400 })
      }
      updates.bcAmount = Math.floor(body.bcAmount)
    }
    if (body.bonusBc !== undefined) updates.bonusBc = Math.max(0, Math.floor(body.bonusBc))
    if (body.priceUSD !== undefined) {
      if (!Number.isFinite(body.priceUSD) || body.priceUSD <= 0) {
        return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 })
      }
      updates.priceUSD = Math.round(body.priceUSD * 100) / 100
    }
    if (body.badge !== undefined) updates.badge = body.badge.trim()
    if (body.tier !== undefined && TIERS.includes(body.tier)) updates.tier = body.tier
    if (typeof body.active === 'boolean') updates.active = body.active
    if (body.sortOrder !== undefined && Number.isFinite(body.sortOrder)) updates.sortOrder = body.sortOrder

    const pkg = await CoinPackageModel.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true })
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    return NextResponse.json({ package: toCoinPackage(pkg) })
  } catch (err) {
    console.error('[/api/admin/coins/packages/[id] PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** Delete a coin package. Historical transactions keep their snapshot fields. */
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const admin = await requireAdmin(req)
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    await connectToDatabase()

    const pkg = await CoinPackageModel.findByIdAndDelete(id)
    if (!pkg) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[/api/admin/coins/packages/[id] DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
