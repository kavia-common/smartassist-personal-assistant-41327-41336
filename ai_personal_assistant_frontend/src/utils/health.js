//
// Non-blocking healthcheck helper.
// - Respects REACT_APP_NEXT_TELEMETRY_DISABLED (skip when "true")
// - Uses REACT_APP_LOG_LEVEL for console verbosity (debug/info/warn/error)
// - Pings REACT_APP_HEALTHCHECK_PATH or '/health' (same-origin) via navigator.sendBeacon if available, else fetch()
// - Never throws; safe no-op on any error.
//
// Usage: import { scheduleHealthPing } from '../utils/health'; scheduleHealthPing();
//

import { ENV } from './constants';
import { getBaseUrl } from '../api/client';

// PUBLIC_INTERFACE
export function getLogLevel() {
  /** Return normalized log level from ENV.LOG_LEVEL */
  const lv = String(ENV.LOG_LEVEL || 'info').toLowerCase();
  if (['debug', 'info', 'warn', 'error'].includes(lv)) return lv;
  return 'info';
}

function logAt(level, ...args) {
  const levels = ['debug', 'info', 'warn', 'error'];
  const current = getLogLevel();
  const shouldLog = levels.indexOf(level) >= levels.indexOf(current);
  if (!shouldLog) return;
  const fn = (level === 'debug' && console.debug) ||
             (level === 'info' && console.info) ||
             (level === 'warn' && console.warn) ||
             (level === 'error' && console.error) ||
             console.log;
  try {
    fn.call(console, ...args);
  } catch {
    // ignore
  }
}

function telemetryDisabled() {
  const raw = String(process?.env?.REACT_APP_NEXT_TELEMETRY_DISABLED || '').trim().toLowerCase();
  // consider '1', 'true', 'yes' as disabled
  return raw === 'true' || raw === '1' || raw === 'yes';
}

function resolveHealthUrl() {
  // Prefer explicit env path if provided in constants (ENV var is read there)
  const configured = process?.env?.REACT_APP_HEALTHCHECK_PATH;
  const path = (configured && configured.trim()) || '/health';
  // If absolute URL provided, return as is; else join with same-origin base
  if (/^https?:\/\//i.test(path)) return path;
  const base = getBaseUrl() || (typeof window !== 'undefined' ? window.location.origin : '');
  // Ensure no double slashes
  const b = (base || '').replace(/\/+$/, '');
  const p = String(path).replace(/^\/+/, '');
  return `${b}/${p}`;
}

/**
 * Fire-and-forget ping using sendBeacon if available, otherwise fetch with timeout.
 * Never rejects or throws.
 */
async function fireAndForget(url) {
  try {
    // Try sendBeacon for true non-blocking delivery
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([JSON.stringify({ t: Date.now() })], { type: 'application/json' });
      const ok = navigator.sendBeacon(url, blob);
      logAt('debug', '[health] sendBeacon dispatched:', ok, '->', url);
      return;
    }
  } catch {
    // ignore and fallback to fetch
  }

  // Fallback: short-timeout fetch, ignore response
  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeout = setTimeout(() => {
    try { controller && controller.abort(); } catch {}
  }, 2500); // very small timeout

  try {
    await fetch(url, {
      method: 'POST',
      keepalive: true, // hint for background delivery
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ t: Date.now() }),
      signal: controller ? controller.signal : undefined,
    }).catch(() => undefined);
  } catch {
    // ignore
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * PUBLIC_INTERFACE
 * Schedule a non-blocking healthcheck ping shortly after app mounts.
 * Safe to call multiple times; it will only schedule one ping per page session.
 */
export function scheduleHealthPing() {
  try {
    if (telemetryDisabled()) {
      logAt('info', '[health] Telemetry disabled via REACT_APP_NEXT_TELEMETRY_DISABLED; skipping health ping.');
      return;
    }

    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // SSR/Tests or non-browser environment
      return;
    }

    // Ensure only once per session
    const FLAG = '__app_health_ping_scheduled__';
    if (window[FLAG]) return;
    window[FLAG] = true;

    const url = resolveHealthUrl();
    logAt('debug', '[health] Scheduling ping to:', url);

    // Use requestIdleCallback or a short timer to avoid blocking initial render
    const schedule = (fn) => {
      if (typeof window.requestIdleCallback === 'function') {
        try {
          return window.requestIdleCallback(fn, { timeout: 3000 });
        } catch {
          // fallback below
        }
      }
      return setTimeout(fn, 0);
    };

    schedule(() => {
      // Additional micro-delay so it definitely doesn't contend with synchronous render work
      setTimeout(() => {
        fireAndForget(url)
          .then(() => logAt('debug', '[health] Ping dispatched.'))
          .catch(() => { /* swallowed by fireAndForget */ });
      }, 1);
    });
  } catch (e) {
    // Swallow any unexpected issues
    logAt('debug', '[health] schedule error ignored:', e);
  }
}
