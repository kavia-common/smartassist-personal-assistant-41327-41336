import React, { useCallback, useEffect, useRef, useState } from 'react';
import MessageBubble from './MessageBubble';
import './ChatPanel.css';

/**
 * PUBLIC_INTERFACE
 * ChatPanel renders a chat transcript and a message composer.
 * - Enter sends; Shift+Enter inserts a newline.
 * - Basic markdown-like formatting is supported by the MessageBubble.
 * - Includes accessibility roles and live region updates.
 *
 * Props:
 * - initialMessages?: Array<{ id: string, role: 'user'|'assistant'|'system', content: string, status?: 'normal'|'success'|'error', timestamp?: string }>
 * - onSend?: (text: string) => void   // called when user sends a message
 */
function ChatPanel({ initialMessages = [], onSend }) {
  const [messages, setMessages] = useState(() =>
    initialMessages.length
      ? initialMessages
      : [
          {
            id: 'm1',
            role: 'assistant',
            content: 'Hello! How can I help you today?',
            status: 'normal',
          },
        ]
  );
  const [input, setInput] = useState('');
  const transcriptRef = useRef(null);
  const liveRegionRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = transcriptRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Announce latest message to screen readers
  useEffect(() => {
    if (!liveRegionRef.current || messages.length === 0) return;
    const last = messages[messages.length - 1];
    liveRegionRef.current.textContent = `${last.role} says: ${last.content}`;
  }, [messages]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Callback for parent to handle API or WS send in future wiring
    if (onSend) {
      try {
        onSend(text);
      } catch {
        // swallow for now
      }
    }

    // Placeholder assistant echo to show the flow (can be removed when wired)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content:
            "I heard: " +
            text +
            "\n\nYou can use *italic*, **bold**, and `inline code` here.",
          status: 'success',
        },
      ]);
    }, 400);
  }, [input, onSend]);

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
        <p className="muted">Type your message and press Enter to send.</p>
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
          {messages.map((m) => (
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
