import { useEffect, useMemo, useRef, useState } from 'react';
import { ENV } from '../utils/constants';

/**
 * PUBLIC_INTERFACE
 * useWebSocket provides optional WebSocket connectivity driven by REACT_APP_WS_URL.
 * - If ENV.WS_URL is not set, the hook returns { enabled: false, connected: false, send: noop }.
 * - If set, it connects on mount and exposes:
 *   - enabled: boolean - true if WS feature is enabled via env
 *   - connected: boolean - WebSocket ready state
 *   - error: Error|null - last connection error (if any)
 *   - send: (data: string | object) => void - send a string or object (auto-JSON)
 *   - lastMessage: raw last message string (for debugging)
 *   - close: () => void - force close the socket
 *
 * Params:
 * - options?: {
 *     onMessage?: (jsonOrText: any) => void, // callback for parsed or raw text
 *     protocols?: string | string[],
 *     reconnect?: boolean,                   // default true
 *     maxRetries?: number,                   // default 5
 *     backoffMs?: (attempt:number)=>number,  // default exponential backoff
 *     log?: boolean,                         // default true
 *   }
 */
export default function useWebSocket(options = {}) {
  const {
    onMessage,
    protocols,
    reconnect = true,
    maxRetries = 5,
    backoffMs,
    log = true,
  } = options || {};

  const url = (ENV.WS_URL || '').trim();
  const enabled = !!url;

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const retriesRef = useRef(0);
  const timeoutRef = useRef(null);
  const unmountedRef = useRef(false);

  const computeBackoff = useMemo(() => {
    if (typeof backoffMs === 'function') return backoffMs;
    return (attempt) => Math.min(30000, 500 * Math.pow(2, Math.max(0, attempt - 1)));
  }, [backoffMs]);

  useEffect(() => {
    unmountedRef.current = false;

    if (!enabled) {
      if (log) console.info('[useWebSocket] Disabled: REACT_APP_WS_URL is not set.');
      return () => { /* noop */ };
    }

    const connect = () => {
      if (unmountedRef.current) return;
      try {
        if (log) console.info('[useWebSocket] Connecting to', url);
        const ws = new WebSocket(url, protocols);
        wsRef.current = ws;

        ws.onopen = () => {
          if (unmountedRef.current) return;
          setConnected(true);
          setError(null);
          retriesRef.current = 0;
          if (log) console.info('[useWebSocket] Connected');
        };

        ws.onmessage = (evt) => {
          if (unmountedRef.current) return;
          const data = evt && (evt.data ?? null);
          setLastMessage(typeof data === 'string' ? data : null);

          // Try JSON parse, fallback to raw text
          let parsed = data;
          if (typeof data === 'string') {
            try {
              parsed = JSON.parse(data);
            } catch {
              // not JSON
            }
          }

          // Invoke callback if provided
          try {
            if (onMessage) onMessage(parsed);
          } catch (cbErr) {
            if (log) console.warn('[useWebSocket] onMessage error:', cbErr);
          }
        };

        ws.onerror = (evt) => {
          if (unmountedRef.current) return;
          const err = new Error('WebSocket error');
          setError(err);
          if (log) console.warn('[useWebSocket] Error event', evt);
        };

        ws.onclose = (evt) => {
          if (unmountedRef.current) return;
          setConnected(false);
          if (log) console.info('[useWebSocket] Closed', evt && evt.code);

          if (reconnect) {
            const attempt = (retriesRef.current || 0) + 1;
            if (attempt <= maxRetries) {
              retriesRef.current = attempt;
              const wait = computeBackoff(attempt);
              if (log) console.info(`[useWebSocket] Reconnecting in ${wait}ms (attempt ${attempt}/${maxRetries})`);
              timeoutRef.current = setTimeout(connect, Math.max(50, wait));
            } else if (log) {
              console.warn('[useWebSocket] Max retries reached, giving up.');
            }
          }
        };
      } catch (e) {
        if (log) console.error('[useWebSocket] Failed to create WebSocket:', e);
        setError(e instanceof Error ? e : new Error(String(e)));
      }
    };

    connect();

    return () => {
      unmountedRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      try {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close(1000, 'component-unmount');
        } else if (wsRef.current) {
          wsRef.current.close();
        }
      } catch {
        // ignore
      }
      wsRef.current = null;
      setConnected(false);
    };
  }, [enabled, url, protocols, reconnect, maxRetries, computeBackoff, onMessage, log]);

  const api = useMemo(() => {
    const send = (payload) => {
      if (!enabled) return;
      const ws = wsRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) {
        if (log) console.warn('[useWebSocket] send(): socket not open');
        return;
      }
      try {
        if (typeof payload === 'string') {
          ws.send(payload);
        } else {
          ws.send(JSON.stringify(payload));
        }
      } catch (e) {
        if (log) console.warn('[useWebSocket] send() failed:', e);
      }
    };

    const close = () => {
      try {
        if (wsRef.current) wsRef.current.close(1000, 'manual-close');
      } catch {
        // ignore
      }
    };

    return {
      // State
      enabled,
      connected,
      error,
      lastMessage,
      // Controls
      send,
      close,
    };
  }, [enabled, connected, error, lastMessage, log]);

  return api;
}
