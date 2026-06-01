'use client'
import React from 'react'
import { MagnifyingGlass, Trophy, Package, Gift } from '@phosphor-icons/react'
import { ChevronRight } from 'lucide-react'
import { useI18n } from '@/context/I18nContext'

const FLOW_ICONS = [MagnifyingGlass, Trophy, Package, Gift] as const
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
            <React.Fragment key={FLOW_TITLE_KEYS[i]}>
              {i > 0 && (
                <li className="home-service-guide__arrow-item" aria-hidden role="presentation">
                  <ChevronRight size={20} strokeWidth={2.5} />
                </li>
              )}
              <li className="home-service-guide__step">
                <div className="home-service-guide__step-inner">
                  <div className="home-service-guide__icon-wrap">
                    <Icon size={28} weight="duotone" className="home-service-guide__icon" aria-hidden />
                  </div>
                  <h3 className="home-service-guide__step-title">{t(FLOW_TITLE_KEYS[i])}</h3>
                  <p className="home-service-guide__step-desc">{t(FLOW_DESC_KEYS[i])}</p>
                </div>
              </li>
            </React.Fragment>
          ))}
        </ol>
      </section>
    </div>
  )
}
