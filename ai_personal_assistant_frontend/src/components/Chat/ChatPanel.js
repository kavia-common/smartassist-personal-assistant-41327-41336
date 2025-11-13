import React, { useCallback, useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import './ChatPanel.css';
import useWebSocket from '../../hooks/useWebSocket';
import { useChat } from '../../state/store';
import chatApi from '../../api/chatApi';

/**
 * PUBLIC_INTERFACE
 * ChatPanel renders a chat transcript and a message composer.
 * - Enter sends; Shift+Enter inserts a newline.
 * - Basic markdown-like formatting is supported by the MessageBubble.
 * - Includes accessibility roles and live region updates.
 *
 * Behavior:
 * - Uses global chat store for messages.
 * - If REACT_APP_WS_URL is present, connects via WebSocket and streams assistant messages.
 * - Falls back to HTTP chatApi.sendMessage for assistant reply when WS is disabled/unavailable.
 *
 * Props:
 * - initialMessages?: Array<{ id: string, role: 'user'|'assistant'|'system', content: string, status?: 'normal'|'success'|'error', timestamp?: string }>
 * - onSend?: (text: string) => void   // optional external handler
 */
function ChatPanel({ initialMessages = [], onSend }) {
  // Global chat state and actions
  const { state: chat, sendMessage, receiveMessage, setLoading } = useChat();

  // Local boot messages for initial render if state empty
  const [bootInjected, setBootInjected] = useState(false);

  const [input, setInput] = useState('');
  const transcriptRef = useRef(null);
  const liveRegionRef = useRef(null);

  // On first mount, if there are no messages in global state, inject initialMessages
  useEffect(() => {
    if (!bootInjected && chat.messages.length === 0 && initialMessages.length > 0) {
      initialMessages.forEach((m) => {
        receiveMessage(m);
      });
      setBootInjected(true);
    }
  }, [bootInjected, chat.messages.length, initialMessages, receiveMessage]);

  // WebSocket: stream assistant updates into chat slice
  const ws = useWebSocket({
    onMessage: (payload) => {
      // Expected payloads:
      // - JSON object like: { type: "chat_token"|"chat_message", id?, role?, content, done? }
      // - Or a plain string: treated as assistant content
      try {
        if (payload == null) return;

        if (typeof payload === 'string') {
          // Plain text message from server
          receiveMessage({
            role: 'assistant',
            content: payload,
            status: 'normal',
          });
          return;
        }

        // JSON object
        const type = payload.type || 'chat_message';
        if (type === 'chat_token') {
          // token-level streaming
          receiveMessage({
            id: payload.id || `a-${Date.now()}`,
            role: payload.role || 'assistant',
            content: String(payload.content ?? ''),
            status: 'normal',
            timestamp: payload.timestamp,
          });
        } else if (type === 'chat_message' || type === 'message') {
          receiveMessage({
            id: payload.id || `a-${Date.now()}`,
            role: payload.role || 'assistant',
            content: String(payload.content ?? ''),
            status: payload.error ? 'error' : 'success',
            timestamp: payload.timestamp,
          });
        } else {
          // Unknown type -> fallback as assistant message
          receiveMessage({
            id: payload.id || `a-${Date.now()}`,
            role: payload.role || 'assistant',
            content: String(payload.content ?? ''),
            status: 'normal',
            timestamp: payload.timestamp,
          });
        }
      } catch {
        // Swallow malformed payload
      }
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = transcriptRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [chat.messages]);

  // Announce latest message to screen readers
  useEffect(() => {
    if (!liveRegionRef.current || chat.messages.length === 0) return;
    const last = chat.messages[chat.messages.length - 1];
    liveRegionRef.current.textContent = `${last.role} says: ${last.content}`;
  }, [chat.messages]);

  const sendViaApiIfNoWs = useCallback(
    async (text) => {
      // If WS is not enabled or not connected, trigger HTTP send
      if (!ws.enabled || !ws.connected) {
        setLoading(true);
        try {
          const resp = await chatApi.sendMessage(text);
          if (resp && resp.ok && resp.data) {
            receiveMessage({
              id: resp.data.id,
              role: resp.data.role || 'assistant',
              content: resp.data.content,
              status: 'success',
              timestamp: resp.data.timestamp,
            });
          } else {
            receiveMessage({
              role: 'assistant',
              content: (resp && resp.error && (resp.error.message || String(resp.error))) || 'Failed to send message',
              status: 'error',
            });
          }
        } catch (e) {
          receiveMessage({
            role: 'assistant',
            content: e?.message || 'Failed to send message',
            status: 'error',
          });
        } finally {
          setLoading(false);
        }
      }
    },
    [receiveMessage, setLoading, ws.connected, ws.enabled]
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    // Add user message to global state
    sendMessage(text);
    setInput('');

    // If websocket enabled and connected, try to send over WS
    if (ws.enabled && ws.connected) {
      try {
        ws.send({ type: 'user_message', content: text });
      } catch {
        // If WS send fails, fallback to API
        sendViaApiIfNoWs(text);
      }
    } else {
      // Fallback to API when WS disabled/unavailable
      sendViaApiIfNoWs(text);
    }

    // External callback if provided
    if (onSend) {
      try {
        onSend(text);
      } catch {
        // swallow for now
      }
    }
  }, [input, onSend, sendMessage, ws, sendViaApiIfNoWs]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        if (e.shiftKey) {
          // Insert newline
          return;
        }
        e.preventDefault(); // prevent newline
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <section className="panel chat-panel card-surface" aria-label="Chat panel">
      <div className="panel-header">
        <h2>Chat</h2>
        <p className="muted">
          {ws.enabled ? (ws.connected ? 'Connected to assistant.' : 'Connecting…') : 'Type your message and press Enter to send.'}
        </p>
      </div>

      <div className="chat-body">
        <div
          className="chat-transcript"
          ref={transcriptRef}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
          aria-label="Conversation transcript"
        >
          {chat.messages.map((m) => (
            <MessageBubble
              key={m.id}
              role={m.role}
              content={m.content}
              status={m.status}
              timestamp={m.timestamp}
            />
          ))}
        </div>

        {/* Live region for announcing latest message to SR users */}
        <div
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
          ref={liveRegionRef}
        />

        <form
          className="chat-composer"
          role="form"
          aria-label="Message composer"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <label htmlFor="chat-input" className="sr-only">
            Message input
          </label>
          <textarea
            id="chat-input"
            className="composer-input"
            placeholder="Write a message... (Shift+Enter for newline)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            aria-multiline="true"
          />
          <div className="composer-actions">
            <button
              type="submit"
              className="btn-send"
              aria-label="Send message"
              title="Send (Enter)"
              disabled={!input.trim()}
            >
              ➤
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

export default ChatPanel;
