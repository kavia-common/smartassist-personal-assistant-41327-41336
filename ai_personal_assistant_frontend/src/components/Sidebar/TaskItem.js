import React from 'react';
import '../Sidebar/Sidebar.css';

/**
 * PUBLIC_INTERFACE
 * TaskItem renders a single task.
 *
 * Props:
 * - task: { id: string, title: string, due?: string, status?: 'pending'|'done' }
 * - onUpdate?: (taskId: string, patch: Partial<{ title: string; due: string; status: string }>) => void
 */
function TaskItem({ task, onUpdate }) {
  const { id, title, due, status = 'pending' } = task || {};

  // Handlers are placeholders for future wiring
  const toggleStatus = () => {
    if (onUpdate) {
      onUpdate(id, { status: status === 'done' ? 'pending' : 'done' });
    }
  };
  const quickEdit = () => {
    if (onUpdate) {
      onUpdate(id, { title: `${title} (edited)` });
    }
  };

  return (
    <li className="item-card" role="listitem" aria-label={`Task ${title}${due ? ` due ${due}` : ''}`}>
      <div>
        <p className="item-title">
          {status === 'done' ? '✅ ' : '⬜ '} {title}
        </p>
        {due && <div className="item-meta">Due: {due}</div>}
      </div>
      <div className="item-actions" role="group" aria-label="Task actions">
        <button
          type="button"
          className="icon-btn"
          onClick={toggleStatus}
          aria-label={status === 'done' ? 'Mark as pending' : 'Mark as done'}
          title={status === 'done' ? 'Mark as pending' : 'Mark as done'}
        >
          {status === 'done' ? '↩︎' : '✓'}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={quickEdit}
          aria-label="Quick edit task"
          title="Quick edit"
        >
          ✎
        </button>
      </div>
    </li>
  );
}

export default TaskItem;
