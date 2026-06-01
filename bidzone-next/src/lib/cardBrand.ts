/** Infer display brand from PAN prefix (client-side only, demo). */
export function detectCardBrand(digits: string): string {
  const d = digits.replace(/\D/g, '')
  if (!d.length) return 'Card'
  if (d.startsWith('4')) return 'Visa'
  if (/^5[1-5]/.test(d) || /^2(22[1-9]|2[3-9]\d|[3-6]\d{2}|7[01]\d|720)/.test(d)) return 'Mastercard'
  if (/^3[47]/.test(d)) return 'American Express'
  if (/^6(?:011|5)/.test(d) || /^64[4-9]|^65/.test(d)) return 'Discover'
  if (/^35/.test(d)) return 'JCB'
  if (/^62/.test(d)) return 'UnionPay'
  if (/^50/.test(d)) return 'Maestro'
  return 'Card'
}

/** Luhn check for card numbers (13–19 digits). */
export function luhnValid(digits: string): boolean {
  const d = digits.replace(/\D/g, '')
  if (d.length < 13 || d.length > 19) return false
  let sum = 0
  let alt = false
  for (let i = d.length - 1; i >= 0; i--) {
    let n = d.charCodeAt(i) - 48
    if (n < 0 || n > 9) return false
    if (alt) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alt = !alt
  }
  return sum % 10 === 0
}

export function formatCardGroups(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 19)
  const isAmex = /^3[47]/.test(d)
  if (isAmex) {
    const a = d.slice(0, 4)
    const b = d.slice(4, 10)
    const c = d.slice(10, 15)
    return [a, b, c].filter(Boolean).join(' ')
  }
  return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim()
}

export function normalizeExpiry(mmYy: string): { month: number; year: number } | null {
  const m = mmYy.replace(/\D/g, '')
  if (m.length !== 4) return null
  const month = Number(m.slice(0, 2))
  const yy = Number(m.slice(2, 4))
  if (month < 1 || month > 12) return null
  const year = 2000 + yy
  return { month, year }
}

export function expiryNotPast(month: number, year: number, now = new Date()): boolean {
  const curY = now.getFullYear()
  const curM = now.getMonth() + 1
  return year > curY || (year === curY && month >= curM)
}
