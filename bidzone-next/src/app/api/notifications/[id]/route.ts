import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { NotificationModel } from '@/models/Notification'
import { requireAuth } from '@/lib/auth'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await connectToDatabase()

    const notification = await NotificationModel.findOneAndUpdate(
      { _id: id, userId: claims.userId },
      { $set: { read: true } },
      { returnDocument: 'after' },
    )

    if (!notification) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({
      notification: {
        id: notification._id.toString(),
        kind: notification.kind,
        read: notification.read,
        createdAt: new Date(notification.createdAt).getTime(),
        meta: notification.meta ?? {},
      },
    })
  } catch (err) {
    console.error('[/api/notifications/[id] PATCH]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
