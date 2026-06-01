'use client'
import { useI18n } from '@/context/I18nContext'

type HomeAdRailProps = {
  side: 'left' | 'right'
  imageUrl?: string
  href?: string
}

export function HomeAdRail({ side, imageUrl, href }: HomeAdRailProps) {
  const { t } = useI18n()
  const label = t('home.ad.label')
  const placeholder = t('home.ad.placeholder')

  const slotContent = imageUrl ? (
    <img src={imageUrl} alt="" className="home-ad-rail__img" loading="lazy" decoding="async" />
  ) : (
    <p className="home-ad-rail__placeholder">{placeholder}</p>
  )

  return (
    <div className={`home-ad-rail home-ad-rail--${side}`} role="complementary" aria-label={label}>
      <p className="home-ad-rail__eyebrow">{label}</p>
      <div className="home-ad-rail__slot">
        {href ? (
          <a href={href} className="home-ad-rail__link" target="_blank" rel="noopener noreferrer sponsored">
            {slotContent}
          </a>
        ) : (
          slotContent
        )}
      </div>
    </div>
  )
}
