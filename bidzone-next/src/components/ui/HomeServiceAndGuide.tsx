'use client'
import { ChevronRight, Gift, Search, Truck, Trophy } from 'lucide-react'
import { useI18n } from '@/context/I18nContext'

const FLOW_ICONS = [Search, Trophy, Truck, Gift] as const
const FLOW_TITLE_KEYS = [
  'home.flow.s1.title',
  'home.flow.s2.title',
  'home.flow.s3.title',
  'home.flow.s4.title',
] as const
const FLOW_DESC_KEYS = [
  'home.flow.s1.desc',
  'home.flow.s2.desc',
  'home.flow.s3.desc',
  'home.flow.s4.desc',
] as const

export function HomeServiceAndGuide() {
  const { t } = useI18n()

  return (
    <div className="home-service-guide">
      <section className="home-service-guide__flow" id="service-flow" aria-labelledby="service-flow-heading">
        <h2 id="service-flow-heading" className="home-service-guide__title">
          {t('home.flow.title')}
        </h2>
        <p className="home-service-guide__intro">{t('home.flow.intro')}</p>

        <ol className="home-service-guide__steps" aria-label={t('home.flow.title')}>
          {FLOW_ICONS.map((Icon, i) => (
            <li key={FLOW_TITLE_KEYS[i]} className="home-service-guide__step">
              {i > 0 && (
                <span className="home-service-guide__arrow" aria-hidden>
                  <ChevronRight size={22} strokeWidth={2} />
                </span>
              )}
              <div className="home-service-guide__step-inner">
                <div className="home-service-guide__icon-wrap">
                  <Icon size={28} strokeWidth={1.75} className="home-service-guide__icon" aria-hidden />
                </div>
                <h3 className="home-service-guide__step-title">{t(FLOW_TITLE_KEYS[i])}</h3>
                <p className="home-service-guide__step-desc">{t(FLOW_DESC_KEYS[i])}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
