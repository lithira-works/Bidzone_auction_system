/** Build E.164 from a national number and numeric country dial code (no +). */
export function toE164(nationalNumber: string, dialCode: string): string | null {
  const dial = dialCode.replace(/\D/g, '')
  if (!dial) return null

  let digits = nationalNumber.replace(/\D/g, '')
  if (!digits) return null

  /* Strip leading 0 common in local formats (e.g. 0702093945 → 702093945) */
  if (digits.startsWith('0')) digits = digits.slice(1)

  /* Already includes country code prefix */
  if (digits.startsWith(dial) && digits.length > dial.length + 5) {
    return `+${digits}`
  }

  if (digits.length < 6 || digits.length > 14) return null
  return `+${dial}${digits}`
}

/** Normalize free-form input to E.164 (default country: Sri Lanka +94). */
export function normalizePhoneE164(raw: string, defaultCountryCode = '94'): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const digits = trimmed.replace(/\D/g, '')
  if (digits.length < 9) return null

  if (trimmed.startsWith('+')) {
    return `+${digits}`
  }
  if (digits.startsWith('0')) {
    return toE164(digits, defaultCountryCode)
  }
  if (digits.startsWith(defaultCountryCode)) {
    return `+${digits}`
  }
  return toE164(digits, defaultCountryCode)
}

export function phonesMatch(a: string, b: string): boolean {
  const na = normalizePhoneE164(a)
  const nb = normalizePhoneE164(b)
  if (na && nb) return na === nb
  return a.replace(/\D/g, '') === b.replace(/\D/g, '')
}

export function formatE164Preview(e164: string | null): string {
  return e164 ?? ''
}
