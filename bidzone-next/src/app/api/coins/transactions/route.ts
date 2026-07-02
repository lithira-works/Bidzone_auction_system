import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth'
import { UserModel } from '@/models/User'
import { CoinTransactionModel } from '@/models/Coin'
import { toCoinTransaction } from '@/lib/coins'

/** The authenticated user's wallet ledger (most recent first). */
export async function GET(req: NextRequest) {
  try {
    const claims = requireAuth(req)
    if (!claims) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectToDatabase()

    const [transactions, user] = await Promise.all([
      CoinTransactionModel.find({ userId: claims.userId }).sort({ createdAt: -1 }).limit(100),
      UserModel.findById(claims.userId).select('bcBalance'),
    ])

    return NextResponse.json({
      transactions: transactions.map(toCoinTransaction),
      balance: user?.bcBalance ?? 0,
    })
  } catch (err) {
    console.error('[/api/coins/transactions GET]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
