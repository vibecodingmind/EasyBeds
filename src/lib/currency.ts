// =============================================================================
// EasyBeds Multi-Currency Utility
// Supports TZS, USD, EUR, GBP, KES with formatting and conversion.
// =============================================================================

export interface CurrencyInfo {
  code: string
  name: string
  symbol: string
  locale: string
}

export const CURRENCIES: Record<string, CurrencyInfo> = {
  TZS: { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', locale: 'en-TZ' },
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB' },
  KES: { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', locale: 'en-KE' },
}

// Hardcoded exchange rates (base: USD)
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  TZS: 2650,
  KES: 153.5,
}

/**
 * Format a monetary amount in the given currency.
 * Falls back gracefully for unknown currencies.
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  options?: Intl.NumberFormatOptions,
): string {
  const info = CURRENCIES[currencyCode]
  if (!info) {
    return `${currencyCode} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  try {
    return new Intl.NumberFormat(info.locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: currencyCode === 'TZS' || currencyCode === 'KES' ? 0 : 2,
      maximumFractionDigits: currencyCode === 'TZS' || currencyCode === 'KES' ? 0 : 2,
      ...options,
    }).format(amount)
  } catch {
    return `${info.symbol} ${amount.toLocaleString()}`
  }
}

/**
 * Convert an amount from one currency to another.
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
): number {
  const fromRate = EXCHANGE_RATES[fromCurrency] ?? 1
  const toRate = EXCHANGE_RATES[toCurrency] ?? 1
  return (amount / fromRate) * toRate
}

/**
 * Get the exchange rate between two currencies (1 unit of `from` = X units of `to`).
 */
export function getExchangeRate(fromCurrency: string, toCurrency: string): number {
  const fromRate = EXCHANGE_RATES[fromCurrency] ?? 1
  const toRate = EXCHANGE_RATES[toCurrency] ?? 1
  return toRate / fromRate
}

/**
 * Get all supported currency codes.
 */
export function getSupportedCurrencies(): CurrencyInfo[] {
  return Object.values(CURRENCIES)
}

/**
 * Short format for compact display (e.g. $1.2k).
 */
export function formatCurrencyCompact(
  amount: number,
  currencyCode: string = 'USD',
): string {
  const info = CURRENCIES[currencyCode]
  if (amount >= 1_000_000) {
    return `${info?.symbol ?? currencyCode}${(amount / 1_000_000).toFixed(1)}M`
  }
  if (amount >= 1_000) {
    return `${info?.symbol ?? currencyCode}${(amount / 1_000).toFixed(1)}k`
  }
  return formatCurrency(amount, currencyCode)
}
