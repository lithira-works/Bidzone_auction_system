import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { UserDataModel } from '@/models/UserData'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const data = await UserDataModel.findOneAndUpdate(
      { userId: claims.userId },
      { $setOnInsert: { userId: claims.userId, cartIds: [], wishlistIds: [] } },
      { upsert: true, returnDocument: 'after' },
    )

    return NextResponse.json({ ids: data.wishlistIds })
  } catch (err) {
    console.error('[/api/wishlist GET]', err)
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

    const existing = await UserDataModel.findOne({ userId: claims.userId })
    const isInWishlist = existing?.wishlistIds?.includes(body.auctionId) ?? false

    let data
    if (isInWishlist) {
      data = await UserDataModel.findOneAndUpdate(
        { userId: claims.userId },
        { $pull: { wishlistIds: body.auctionId } },
        { upsert: true, returnDocument: 'after' },
      )
    } else {
      data = await UserDataModel.findOneAndUpdate(
        { userId: claims.userId },
        { $addToSet: { wishlistIds: body.auctionId } },
        { upsert: true, returnDocument: 'after' },
      )
    }

    return NextResponse.json({ ids: data.wishlistIds })
  } catch (err) {
    console.error('[/api/wishlist POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json().catch(() => ({}))) as { auctionId?: string }
    if (!body.auctionId) {
      return NextResponse.json({ error: 'Missing auctionId' }, { status: 400 })
    }

    await connectToDatabase()

    const data = await UserDataModel.findOneAndUpdate(
      { userId: claims.userId },
      { $pull: { wishlistIds: body.auctionId } },
      { upsert: true, returnDocument: 'after' },
    )

    return NextResponse.json({ ids: data.wishlistIds })
  } catch (err) {
    console.error('[/api/wishlist DELETE]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
