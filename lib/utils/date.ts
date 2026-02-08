/**
 * Date utility functions for consistent date handling across the application
 */

/**
 * Gets the current date in YYYY-MM-DD format using the local timezone
 * This avoids timezone offset issues that occur with toISOString()
 */
export function getTodayLocalDate(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Converts a Date object to YYYY-MM-DD format in local timezone
 */
export function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Adds days to a date and returns in YYYY-MM-DD format (local timezone)
 */
export function addDaysLocal(date: Date, days: number): string {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return formatDateLocal(result)
}
