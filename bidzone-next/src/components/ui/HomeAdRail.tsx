'use client'

type HomeAdRailProps = {
  side: 'left' | 'right'
  imageUrl?: string
  href?: string
}

export function HomeAdRail({ side, imageUrl, href }: HomeAdRailProps) {
  const slotContent = imageUrl ? (
    <img src={imageUrl} alt="" className="home-ad-rail__img" loading="lazy" decoding="async" />
  ) : (
    <div className="home-ad-rail__placeholder-inner">
      <div className="home-ad-rail__placeholder-icon" aria-hidden>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      </div>
      <p className="home-ad-rail__placeholder-text">Your ad here</p>
      <p className="home-ad-rail__placeholder-sub">Reach premium bidders</p>
    </div>
  )

  return (
    <div className={`home-ad-rail home-ad-rail--${side}`} role="complementary" aria-label="Advertisement">
      <div className="home-ad-rail__label">Sponsored</div>
      <div className="home-ad-rail__slot">
        {href ? (
          <a href={href} className="home-ad-rail__link" target="_blank" rel="noopener noreferrer sponsored">
            {slotContent}
          </a>
        ) : (
          slotContent
        )}
      </div>

      {/* Second smaller slot */}
      <div className="home-ad-rail__slot home-ad-rail__slot--sm">
        <div className="home-ad-rail__placeholder-inner">
          <div className="home-ad-rail__placeholder-icon" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <p className="home-ad-rail__placeholder-text">Promote listing</p>
        </div>
      </div>
    </div>
  )
}
