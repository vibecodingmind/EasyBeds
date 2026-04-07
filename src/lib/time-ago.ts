import { formatDistanceToNow } from 'date-fns'

/**
 * Returns a human-readable relative time string from a date.
 * Uses date-fns formatDistanceToNow under the hood.
 *
 * @example
 * timeAgo(new Date())           // "just now"
 * timeAgo('2025-01-01T...')     // "5 minutes ago"
 * timeAgo('2024-12-30T...')     // "2 days ago"
 */
export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

/**
 * Returns a short relative time string.
 *
 * @example
 * timeAgoShort(new Date())        // "just now"
 * timeAgoShort('2025-01-01T...')  // "5m ago"
 * timeAgoShort('2024-12-30T...')  // "2d ago"
 */
export function timeAgoShort(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = Date.now()
  const diffMs = now - d.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay === 1) return 'Yesterday'
  if (diffDay < 30) return `${diffDay}d ago`

  return formatDistanceToNow(d, { addSuffix: true })
}
