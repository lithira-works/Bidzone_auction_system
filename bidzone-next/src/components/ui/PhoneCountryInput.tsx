'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Phone, Search } from 'lucide-react'
import {
  DEFAULT_COUNTRY_CODE,
  FALLBACK_COUNTRIES,
  fetchCountryDialCodes,
  findCountryByCode,
  type CountryDialOption,
} from '@/lib/countries'
import { toE164 } from '@/lib/phoneFormat'

type Props = {
  countryCode: string
  onCountryCodeChange: (code: string) => void
  nationalNumber: string
  onNationalNumberChange: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
  placeholder?: string
  label?: string
}

export function PhoneCountryInput({
  countryCode,
  onCountryCodeChange,
  nationalNumber,
  onNationalNumberChange,
  disabled,
  autoFocus,
  placeholder = '712345678',
  label = 'Mobile phone',
}: Props) {
  const [countries, setCountries] = useState<CountryDialOption[]>(FALLBACK_COUNTRIES)
  const [loadingCountries, setLoadingCountries] = useState(true)
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    void fetchCountryDialCodes().then((list) => {
      if (!cancelled) {
        setCountries(list)
        setLoadingCountries(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
        setFilter('')
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        setFilter('')
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const selected = useMemo(
    () => findCountryByCode(countryCode, countries) ?? countries[0],
    [countryCode, countries],
  )

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return countries
    return countries.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dial.includes(q.replace(/\D/g, '')),
    )
  }, [countries, filter])

  const e164Preview = useMemo(() => {
    if (!selected) return null
    return toE164(nationalNumber, selected.dial)
  }, [nationalNumber, selected])

  function pickCountry(code: string) {
    onCountryCodeChange(code)
    setOpen(false)
    setFilter('')
  }

  return (
    <div className="phone-cc">
      <span className="phone-cc__label">{label}</span>

      <div className={`phone-cc__row${disabled ? ' phone-cc__row--disabled' : ''}`}>
        <div className="phone-cc__country-wrap" ref={wrapRef}>
          <button
            type="button"
            className={`phone-cc__country-btn${open ? ' phone-cc__country-btn--open' : ''}`}
            disabled={disabled || loadingCountries}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-label={`Country code, currently ${selected?.name ?? 'Sri Lanka'} +${selected?.dial ?? '94'}`}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="phone-cc__country-flag" aria-hidden>
              {selected?.flag ?? '🇱🇰'}
            </span>
            <span className="phone-cc__dial">+{selected?.dial ?? '94'}</span>
            <ChevronDown size={14} className={`phone-cc__chevron${open ? ' phone-cc__chevron--open' : ''}`} aria-hidden />
          </button>

          {open && (
            <div className="phone-cc__dropdown" role="presentation">
              <div className="phone-cc__search">
                <Search size={14} aria-hidden />
                <input
                  type="search"
                  className="phone-cc__search-input"
                  placeholder="Search country…"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  autoFocus
                />
              </div>
              <ul className="phone-cc__list" role="listbox">
                {filtered.length === 0 ? (
                  <li className="phone-cc__empty">No countries match your search.</li>
                ) : (
                  filtered.map((c) => {
                    const active = c.code === selected?.code
                    return (
                      <li key={c.code} role="option" aria-selected={active}>
                        <button
                          type="button"
                          className={`phone-cc__option${active ? ' phone-cc__option--active' : ''}`}
                          onClick={() => pickCountry(c.code)}
                        >
                          <span className="phone-cc__option-flag" aria-hidden>{c.flag}</span>
                          <span className="phone-cc__option-name">{c.name}</span>
                          <span className="phone-cc__option-dial">+{c.dial}</span>
                        </button>
                      </li>
                    )
                  })
                )}
              </ul>
            </div>
          )}
        </div>

        <div className="phone-cc__number-wrap">
          <Phone size={16} className="phone-cc__icon" aria-hidden />
          <input
            className="phone-cc__input"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            autoFocus={autoFocus}
            disabled={disabled}
            placeholder={placeholder}
            value={nationalNumber}
            onChange={(e) => onNationalNumberChange(e.target.value.replace(/[^\d\s-]/g, ''))}
          />
        </div>
      </div>

      {e164Preview && (
        <p className="phone-cc__preview">
          SMS will be sent to <strong>{e164Preview}</strong>
        </p>
      )}
    </div>
  )
}

/** Build E.164 from ISO country code + national digits. */
export function buildPhoneE164(
  countryCode: string,
  nationalNumber: string,
  countries: CountryDialOption[],
): string | null {
  const country = findCountryByCode(countryCode, countries) ?? FALLBACK_COUNTRIES[0]
  return toE164(nationalNumber, country.dial)
}
