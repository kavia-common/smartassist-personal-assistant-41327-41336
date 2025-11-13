import React from 'react';
import './MessageBubble.css';

/**
 * PUBLIC_INTERFACE
 * MessageBubble renders a single chat message with role-based styling,
 * basic markdown-like formatting (bold, italic, code), and accessibility attributes.
 *
 * Props:
 * - role: 'user' | 'assistant' | 'system'
 * - content: string
 * - status?: 'normal' | 'success' | 'error' (affects assistant bubble accent)
 * - timestamp?: string (optional, for aria and footer)
 */
function MessageBubble({ role = 'assistant', content, status = 'normal', timestamp }) {
  const isUser = role === 'user';
  const isAssistant = role === 'assistant';
  const isSystem = role === 'system';

  const classes = [
    'msg-bubble',
    isUser ? 'from-user' : '',
    isAssistant ? 'from-assistant' : '',
    isSystem ? 'from-system' : '',
    status !== 'normal' ? `status-${status}` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const ariaLabel = `${role} message${timestamp ? ` at ${timestamp}` : ''}`;

  // Basic formatting via naive markdown-like parsing for <strong>, <em>, and <code>.
  // We avoid external libs and keep it simple. We split and wrap tokens with semantic tags.
  const renderFormatted = (text) => {
    // Process inline code `code`
    const codeSplit = text.split(/(`[^`]+`)/g);

    return codeSplit.map((segment, i) => {
      if (segment.startsWith('`') && segment.endsWith('`')) {
        const inner = segment.slice(1, -1);
        return (
          <code key={`code-${i}`} className="inline-code">
            {inner}
          </code>
        );
      }
      // Process bold **bold** and italic *italic*
      const boldSplit = segment.split(/(\*\*[^*]+\*\*)/g).flatMap((part, j) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const inner = part.slice(2, -2);
          return (
            <strong key={`b-${i}-${j}`} className="fmt-bold">
              {inner}
            </strong>
          );
        }
        const italicSplit = part.split(/(\*[^*]+\*)/g).map((p, k) => {
          if (p.startsWith('*') && p.endsWith('*')) {
            const inner = p.slice(1, -1);
            return (
              <em key={`i-${i}-${j}-${k}`} className="fmt-italic">
                {inner}
              </em>
            );
          }
          return <React.Fragment key={`t-${i}-${j}-${k}`}>{p}</React.Fragment>;
        });
        return italicSplit;
      });
      return boldSplit;
    });
  };

  return (
    <div
      className={classes}
      role="article"
      aria-roledescription="chat message"
      aria-label={ariaLabel}
    >
      <div className="msg-inner">
        <div className="msg-content">{renderFormatted(content)}</div>
        {timestamp && <div className="msg-meta" aria-hidden="true">{timestamp}</div>}
      </div>
    </div>
  );
}

export default MessageBubble;
