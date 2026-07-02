import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { UserDataModel } from '@/models/UserData'
import { requireAuth } from '@/lib/auth'

async function getUserData(userId: string) {
  return UserDataModel.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId, cartIds: [], wishlistIds: [] } },
    { upsert: true, returnDocument: 'after' },
  )
}

export async function GET(req: NextRequest) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()
    const data = await getUserData(claims.userId)

    return NextResponse.json({ ids: data.cartIds })
  } catch (err) {
    console.error('[/api/cart GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as { auctionId?: string }
    if (!body.auctionId) {
      return NextResponse.json({ error: 'Missing auctionId' }, { status: 400 })
    }

    await connectToDatabase()

    const data = await UserDataModel.findOneAndUpdate(
      { userId: claims.userId },
      { $addToSet: { cartIds: body.auctionId } },
      { upsert: true, returnDocument: 'after' },
    )

    return NextResponse.json({ ids: data.cartIds })
  } catch (err) {
    console.error('[/api/cart POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as { auctionId?: string; clear?: boolean }

    await connectToDatabase()

    let data
    if (body.clear || !body.auctionId) {
      data = await UserDataModel.findOneAndUpdate(
        { userId: claims.userId },
        { $set: { cartIds: [] } },
        { upsert: true, returnDocument: 'after' },
      )
    } else {
      data = await UserDataModel.findOneAndUpdate(
        { userId: claims.userId },
        { $pull: { cartIds: body.auctionId } },
        { upsert: true, returnDocument: 'after' },
      )
    }

    return NextResponse.json({ ids: data.cartIds })
  } catch (err) {
    console.error('[/api/cart DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
