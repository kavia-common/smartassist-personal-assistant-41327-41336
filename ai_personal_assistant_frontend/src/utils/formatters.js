//
// Lightweight formatting helpers used across the app.
//

/**
 * PUBLIC_INTERFACE
 * Format a date or timestamp into a readable string.
 * - input: Date | number | string
 * - options: Intl.DateTimeFormat options
 */
export function formatDateTime(input, options) {
  try {
    const d = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(d.getTime())) return '';
    const fmt = new Intl.DateTimeFormat(undefined, options || {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    return fmt.format(d);
  } catch {
    return '';
  }
}

/**
 * PUBLIC_INTERFACE
 * Format a plain date (no time).
 */
export function formatDate(input, options) {
  try {
    const d = input instanceof Date ? input : new Date(input);
    if (Number.isNaN(d.getTime())) return '';
    const fmt = new Intl.DateTimeFormat(undefined, options || {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
    return fmt.format(d);
  } catch {
    return '';
  }
}

/**
 * PUBLIC_INTERFACE
 * Normalize an error to a user-friendly message string.
 */
export function formatError(err, fallback = 'Something went wrong') {
  if (!err) return fallback;
  if (typeof err === 'string') return err;
  if (err.message) return err.message;
  try {
    return JSON.stringify(err);
  } catch {
    return fallback;
  }
}

/**
 * PUBLIC_INTERFACE
 * Truncate a string to a max length with ellipsis.
 */
export function truncate(text, max = 140) {
  if (typeof text !== 'string') return '';
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).trimEnd() + '…';
}

/**
 * PUBLIC_INTERFACE
 * Format a number with locale-aware grouping.
 */
export function formatNumber(n) {
  try {
    const num = typeof n === 'number' ? n : Number(n);
    if (!Number.isFinite(num)) return '';
    return new Intl.NumberFormat().format(num);
  } catch {
    return '';
  }
}
