import { getBaseUrl, safeFetch } from './client';
import { API_PATHS } from '../utils/constants';

/**
 * Determine if we should use mock fallback mode.
 * When neither REACT_APP_API_BASE nor REACT_APP_BACKEND_URL is configured,
 * getBaseUrl() will return window.location.origin; if that origin has no backend,
 * we still allow graceful mock to keep UI functioning.
 */
function isMockMode() {
  const envBase = process?.env?.REACT_APP_API_BASE;
  const envBackend = process?.env?.REACT_APP_BACKEND_URL;
  return !(envBase || envBackend);
}

/**
 * PUBLIC_INTERFACE
 * Send a chat message to the backend. Falls back to a mocked echo response when
 * no API base URL is configured.
 *
 * Params:
 * - content: string
 * - options?: { metadata?: object }
 *
 * Returns:
 * - Promise<{ ok: boolean, data?: any, error?: Error }>
 */
async function sendMessage(content, options = {}) {
  const text = String(content || '').trim();
  if (!text) {
    return { ok: false, error: new Error('Message content is empty') };
  }

  if (isMockMode()) {
    console.info('[chatApi] Mock mode active (no REACT_APP_API_BASE/REACT_APP_BACKEND_URL). Returning fake response.');
    const now = new Date().toISOString();
    return {
      ok: true,
      data: {
        id: `mock-${Date.now()}`,
        role: 'assistant',
        content: `Echo: ${text}\n\n(Mock response — configure REACT_APP_API_BASE to call real API)`,
        timestamp: now,
        meta: { mocked: true },
      },
    };
  }

  const resp = await safeFetch(API_PATHS.chat, {
    method: 'POST',
    body: { message: text, ...(options?.metadata ? { metadata: options.metadata } : {}) },
  });
  return resp.ok ? { ok: true, data: resp.data } : { ok: false, error: resp.error || new Error('Failed to send message') };
}

const chatApi = { sendMessage };
export default chatApi;
export { sendMessage };
