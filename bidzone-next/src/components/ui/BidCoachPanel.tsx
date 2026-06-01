'use client'
import { Bot } from 'lucide-react'
import { useI18n } from '@/context/I18nContext'
import { bidCoachAmounts } from '@/lib/bidCoach'

type Props = { category: string; currentHigh: number; minBid: number }

function formatMoney(n: number) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
}

export function BidCoachPanel({ category, currentHigh, minBid }: Props) {
  const { t } = useI18n()
  const { refHigh, suggest } = bidCoachAmounts(currentHigh, minBid)

  return (
    <section className="bid-coach" aria-labelledby="bid-coach-title">
      <div className="bid-coach__head">
        <Bot size={22} className="bid-coach__icon" aria-hidden />
        <div>
          <h2 id="bid-coach-title" className="bid-coach__title">{t('product.aiCoachTitle')}</h2>
          <p className="bid-coach__sub">{t('product.aiCoachSub')}</p>
        </div>
      </div>
      <blockquote className="bid-coach__bubble">
        {t('product.aiCoachBubble', { category, ref: formatMoney(refHigh), suggest: formatMoney(suggest) })}
      </blockquote>
    </section>
  )
}
