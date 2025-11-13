//
// API client utilities and feature flag helpers for the frontend.
// - getBaseUrl(): resolves API base URL from environment
// - safeFetch(): fetch with timeout, JSON handling, and error normalization
// - HTTP helpers: get/post/put/patch/del
// - Feature flags: read from REACT_APP_FEATURE_FLAGS and experiments toggle
//

const DEFAULT_TIMEOUT_MS = 15000;

/**
 * Resolve a base URL for API calls using environment variables.
 * Priority:
 * 1) REACT_APP_API_BASE
 * 2) REACT_APP_BACKEND_URL
 * 3) window.location.origin (fallback)
 */
// PUBLIC_INTERFACE
export function getBaseUrl() {
  /** Resolve base URL considering typical deployment patterns. */
  const envBase = process?.env?.REACT_APP_API_BASE;
  const envBackend = process?.env?.REACT_APP_BACKEND_URL;

  let base = (envBase || envBackend || '').trim();

  // Normalize if provided without protocol (e.g., //host or host)
  if (base && !/^https?:\/\//i.test(base)) {
    if (base.startsWith('//')) {
      base = window?.location?.protocol + base;
    } else if (base.startsWith('/')) {
      // Relative to current origin
      base = (window?.location?.origin || '') + base;
    } else {
      // Hostname or path-like, prefix with current protocol
      const protocol = window?.location?.protocol || 'https:';
      base = `${protocol}//${base}`;
    }
  }

  if (!base) {
    // Safe fallback for local preview; avoids throwing during early boot.
    base = window?.location?.origin || '';
  }

  // Remove trailing slash for consistent join behavior
  return base.replace(/\/+$/, '');
}

/**
 * Join base URL and path safely without duplicating or missing slashes.
 */
function joinUrl(base, path) {
  const b = (base || '').replace(/\/+$/, '');
  const p = String(path || '').replace(/^\/+/, '');
  return `${b}/${p}`;
}

/**
 * Parse JSON safely; returns { ok: boolean, data?: any, error?: any }
 */
async function tryParseJson(resp) {
  const contentType = resp.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return { ok: false, error: new Error('Response is not JSON') };
  }
  try {
    const data = await resp.json();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: e || new Error('Failed to parse JSON') };
  }
}

/**
 * Normalize fetch/network errors to a standard shape.
 */
function toFetchError(input) {
  if (input instanceof Error) return input;
  try {
    return new Error(typeof input === 'string' ? input : JSON.stringify(input));
  } catch {
    return new Error('Unknown error');
  }
}

/**
 * PUBLIC_INTERFACE
 * Safe fetch wrapper with:
 * - Timeout via AbortController
 * - Automatic JSON body/stringification for objects
 * - JSON response parsing when applicable
 * - Error normalization
 *
 * Params:
 * - path: string (appended to base URL unless absolute)
 * - options?: RequestInit & { timeoutMs?: number, baseUrlOverride?: string }
 *
 * Returns:
 * - Resolves to { ok: boolean, status: number, headers: Headers, data?: any, text?: string, error?: Error, response?: Response }
 */
export async function safeFetch(path, options = {}) {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    baseUrlOverride,
    headers: userHeaders,
    body,
    ...rest
  } = options;

  const base = baseUrlOverride || getBaseUrl();
  const url = /^https?:\/\//i.test(path) ? path : joinUrl(base, path);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Math.max(1, timeoutMs));

  // Prepare headers and body
  const headers = new Headers(userHeaders || {});
  let finalBody = body;

  // If body is a plain object and no explicit Content-Type, send as JSON
  const isPlainObject =
    body &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer) &&
    !(ArrayBuffer.isView && ArrayBuffer.isView(body));

  if (isPlainObject && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (isPlainObject && headers.get('Content-Type')?.includes('application/json')) {
    finalBody = JSON.stringify(body);
  }

  try {
    const resp = await fetch(url, {
      ...rest,
      headers,
      body: finalBody,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Try to parse JSON if header suggests so; otherwise return text
    const { ok: jsonOk, data, error: jsonErr } = await tryParseJson(resp);
    if (jsonOk) {
      if (!resp.ok) {
        return { ok: false, status: resp.status, headers: resp.headers, error: new Error((data && (data.message || data.error)) || `HTTP ${resp.status}`), data, response: resp };
      }
      return { ok: true, status: resp.status, headers: resp.headers, data, response: resp };
    }

    // Fallback to text
    let text = '';
    try {
      text = await resp.text();
    } catch {
      // ignore
    }
    if (!resp.ok) {
      return { ok: false, status: resp.status, headers: resp.headers, text, error: new Error(text || `HTTP ${resp.status}`), response: resp };
    }
    return { ok: true, status: resp.status, headers: resp.headers, text, response: resp };
  } catch (err) {
    clearTimeout(timeoutId);
    const isAbort = err && (err.name === 'AbortError' || err.message?.includes('aborted'));
    const wrapped = isAbort ? new Error('Request timed out') : toFetchError(err);
    return { ok: false, status: 0, headers: new Headers(), error: wrapped };
  }
}

/**
 * Convenience HTTP helpers using safeFetch
 */
// PUBLIC_INTERFACE
export function httpGet(path, options = {}) {
  return safeFetch(path, { ...options, method: 'GET' });
}
// PUBLIC_INTERFACE
export function httpPost(path, body, options = {}) {
  return safeFetch(path, { ...options, method: 'POST', body });
}
// PUBLIC_INTERFACE
export function httpPut(path, body, options = {}) {
  return safeFetch(path, { ...options, method: 'PUT', body });
}
// PUBLIC_INTERFACE
export function httpPatch(path, body, options = {}) {
  return safeFetch(path, { ...options, method: 'PATCH', body });
}
// PUBLIC_INTERFACE
export function httpDelete(path, options = {}) {
  return safeFetch(path, { ...options, method: 'DELETE' });
}

/**
 * Feature Flags & Experiments
 * - Flags can be defined via REACT_APP_FEATURE_FLAGS as:
 *   a) JSON: {"newUI": true, "betaFlow": false}
 *   b) Comma list: newUI=true,betaFlow=false
 * - Experiments global toggle via REACT_APP_EXPERIMENTS_ENABLED (true/false).
 */

function readFeatureFlagsFromEnv() {
  const raw = process?.env?.REACT_APP_FEATURE_FLAGS;
  if (!raw) return {};
  try {
    const trimmed = raw.trim();
    if (trimmed.startsWith('{')) {
      const obj = JSON.parse(trimmed);
      return typeof obj === 'object' && obj ? obj : {};
    }
    // Parse key=value,key2=value2
    const obj = {};
    trimmed.split(',').forEach((pair) => {
      const [k, v] = pair.split('=').map((s) => s?.trim());
      if (k) obj[k] = v === 'true';
    });
    return obj;
  } catch {
    return {};
  }
}

const FLAGS_CACHE = readFeatureFlagsFromEnv();
const EXPERIMENTS_ENABLED = String(process?.env?.REACT_APP_EXPERIMENTS_ENABLED || '').toLowerCase() === 'true';

/**
 * PUBLIC_INTERFACE
 * Returns a boolean whether a given feature flag is enabled.
 * If a defaultValue is provided, it is used when the flag is not defined.
 */
export function isFeatureEnabled(flagName, defaultValue = false) {
  if (!flagName) return !!defaultValue;
  if (Object.prototype.hasOwnProperty.call(FLAGS_CACHE, flagName)) {
    return !!FLAGS_CACHE[flagName];
  }
  return !!defaultValue;
}

/**
 * PUBLIC_INTERFACE
 * Convenient accessor to get all known feature flags as an object.
 * Useful for debugging or initial UI wiring.
 */
export function getAllFeatureFlags() {
  return { ...FLAGS_CACHE };
}

/**
 * PUBLIC_INTERFACE
 * Returns whether experiments are globally enabled.
 * Gate experimental UI or flows behind this switch in addition to specific flags.
 */
export function experimentsEnabled() {
  return EXPERIMENTS_ENABLED;
}
