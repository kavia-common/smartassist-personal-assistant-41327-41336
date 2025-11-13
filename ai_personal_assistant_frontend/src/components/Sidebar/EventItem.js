import React from 'react';
import '../Sidebar/Sidebar.css';

/**
 * PUBLIC_INTERFACE
 * EventItem renders a single calendar event.
 *
 * Props:
 * - event: { id: string, title: string, datetime?: string, location?: string }
 * - onUpdate?: (eventId: string, patch: Partial<{ title: string; datetime: string; location: string }>) => void
 */
function EventItem({ event, onUpdate }) {
  const { id, title, datetime, location } = event || {};

  const quickEdit = () => {
    if (onUpdate) {
      onUpdate(id, { title: `${title} (updated)` });
    }
  };

  return (
    <li
      className="item-card"
      role="listitem"
      aria-label={`Event ${title}${datetime ? ` at ${datetime}` : ''}${location ? ` in ${location}` : ''}`}
    >
      <div>
        <p className="item-title">📅 {title}</p>
        <div className="item-meta">
          {datetime ? datetime : 'No time set'}
          {location ? ` • ${location}` : ''}
        </div>
      </div>
      <div className="item-actions" role="group" aria-label="Event actions">
        <button
          type="button"
          className="icon-btn"
          onClick={quickEdit}
          aria-label="Quick edit event"
          title="Quick edit"
        >
          ✎
        </button>
      </div>
    </li>
  );
}

export default EventItem;
