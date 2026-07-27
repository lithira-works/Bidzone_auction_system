/** Country dial-code entry used by the phone input selector. */
export type CountryDialOption = {
  code: string
  name: string
  dial: string
  flag: string
}

/** Curated fallback list (used when the REST Countries API is unreachable). */
export const FALLBACK_COUNTRIES: CountryDialOption[] = [
  { code: 'LK', name: 'Sri Lanka', dial: '94', flag: '🇱🇰' },
  { code: 'IN', name: 'India', dial: '91', flag: '🇮🇳' },
  { code: 'US', name: 'United States', dial: '1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dial: '44', flag: '🇬🇧' },
  { code: 'AU', name: 'Australia', dial: '61', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', dial: '1', flag: '🇨🇦' },
  { code: 'SG', name: 'Singapore', dial: '65', flag: '🇸🇬' },
  { code: 'MY', name: 'Malaysia', dial: '60', flag: '🇲🇾' },
  { code: 'AE', name: 'United Arab Emirates', dial: '971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dial: '966', flag: '🇸🇦' },
  { code: 'QA', name: 'Qatar', dial: '974', flag: '🇶🇦' },
  { code: 'PK', name: 'Pakistan', dial: '92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dial: '880', flag: '🇧🇩' },
  { code: 'NP', name: 'Nepal', dial: '977', flag: '🇳🇵' },
  { code: 'DE', name: 'Germany', dial: '49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '33', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', dial: '81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dial: '86', flag: '🇨🇳' },
]

let cachedCountries: CountryDialOption[] | null = null

function parseDial(idd?: { root?: string; suffixes?: string[] }): string | null {
  if (!idd?.root) return null
  const root = idd.root.replace(/\D/g, '')
  const suffix = idd.suffixes?.[0]?.replace(/\D/g, '') ?? ''
  const dial = `${root}${suffix}`
  return dial.length > 0 ? dial : null
}

/** Flag emoji from ISO 3166-1 alpha-2 code. */
export function flagEmoji(code: string): string {
  if (code.length !== 2) return '🏳️'
  const upper = code.toUpperCase()
  return String.fromCodePoint(...[...upper].map((c) => 127397 + c.charCodeAt(0)))
}

/**
 * Loads countries with dial codes from the REST Countries API.
 * Falls back to a curated static list on network / parse errors.
 */
export async function fetchCountryDialCodes(): Promise<CountryDialOption[]> {
  if (cachedCountries) return cachedCountries

  try {
    const res = await fetch(
      'https://restcountries.com/v3.1/all?fields=name,cca2,idd',
      { cache: 'force-cache' },
    )
    if (!res.ok) throw new Error('countries_api_failed')

    const rows = (await res.json()) as Array<{
      name?: { common?: string }
      cca2?: string
      idd?: { root?: string; suffixes?: string[] }
    }>

    const parsed: CountryDialOption[] = []
    for (const row of rows) {
      const code = row.cca2?.toUpperCase()
      const name = row.name?.common?.trim()
      const dial = parseDial(row.idd)
      if (!code || !name || !dial) continue
      parsed.push({ code, name, dial, flag: flagEmoji(code) })
    }

    parsed.sort((a, b) => a.name.localeCompare(b.name))

    /* Ensure Sri Lanka is easy to find at top after sort — pin common markets */
    const pinned = ['LK', 'IN', 'US', 'GB', 'AU']
    const pinSet = new Set(pinned)
    const pinnedRows = pinned
      .map((c) => parsed.find((p) => p.code === c))
      .filter((p): p is CountryDialOption => Boolean(p))
    const rest = parsed.filter((p) => !pinSet.has(p.code))

    cachedCountries = [...pinnedRows, ...rest]
    return cachedCountries
  } catch {
    cachedCountries = FALLBACK_COUNTRIES
    return cachedCountries
  }
}

export function findCountryByCode(code: string, list: CountryDialOption[]): CountryDialOption | undefined {
  return list.find((c) => c.code === code.toUpperCase())
}

export const DEFAULT_COUNTRY_CODE = 'LK'
