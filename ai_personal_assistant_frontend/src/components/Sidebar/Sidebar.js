import React, { useEffect, useId, useMemo, useState } from 'react';
import './Sidebar.css';
import TaskItem from './TaskItem';
import EventItem from './EventItem';

/**
 * PUBLIC_INTERFACE
 * Sidebar component providing "Tasks" and "Events" tabs with accessibility roles
 * and responsive behavior (overlay drawer on small screens, persistent on large).
 *
 * Props:
 * - onAddTask?: () => void
 * - onUpdateTask?: (taskId: string, patch: Partial<{ title: string; due: string; status: string }>) => void
 * - onAddEvent?: () => void
 * - onUpdateEvent?: (eventId: string, patch: Partial<{ title: string; datetime: string; location: string }>) => void
 *
 * Notes:
 * - Includes local mock data so UI renders before wiring to app state.
 * - Uses theme CSS variables from theme.css for consistent styling.
 */
function Sidebar({
  onAddTask,
  onUpdateTask,
  onAddEvent,
  onUpdateEvent,
}) {
  // Local responsive state for mobile overlay
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');

  // Temporary mock data
  const [tasks, setTasks] = useState(() => ([
    { id: 't-1', title: 'Prepare weekly report', due: 'Fri 4:00 PM', status: 'pending' },
    { id: 't-2', title: 'Pay credit card', due: 'Tomorrow', status: 'pending' },
    { id: 't-3', title: 'Refactor assistant prompt', due: 'Next Mon', status: 'done' },
  ]));
  const [events, setEvents] = useState(() => ([
    { id: 'e-1', title: '1:1 with Alex', datetime: 'Tue 2:30 PM', location: 'Room 3A' },
    { id: 'e-2', title: 'Demo: Sprint Review', datetime: 'Fri 10:00 AM', location: 'Zoom' },
  ]));

  // Wire-through handlers that call props if provided and update local mock for demo
  const handleAddTask = () => {
    const newTask = { id: `t-${Date.now()}`, title: 'New task', due: 'Later', status: 'pending' };
    setTasks(prev => [newTask, ...prev]);
    if (onAddTask) {
      try { onAddTask(); } catch { /* noop */ }
    }
  };
  const handleUpdateTask = (id, patch) => {
    setTasks(prev => prev.map(t => (t.id === id ? { ...t, ...patch } : t)));
    if (onUpdateTask) {
      try { onUpdateTask(id, patch); } catch { /* noop */ }
    }
  };
  const handleAddEvent = () => {
    const newEvent = { id: `e-${Date.now()}`, title: 'New event', datetime: 'TBD', location: '' };
    setEvents(prev => [newEvent, ...prev]);
    if (onAddEvent) {
      try { onAddEvent(); } catch { /* noop */ }
    }
  };
  const handleUpdateEvent = (id, patch) => {
    setEvents(prev => prev.map(e => (e.id === id ? { ...e, ...patch } : e)));
    if (onUpdateEvent) {
      try { onUpdateEvent(id, patch); } catch { /* noop */ }
    }
  };

  const tabListId = useId();
  const tasksPanelId = useId();
  const eventsPanelId = useId();

  // Close drawer when viewport switches to desktop (avoid stuck overlay)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1025px)');
    const handler = (e) => {
      if (e.matches) setDrawerOpen(false);
    };
    if (mq.addEventListener) {
      mq.addEventListener('change', handler);
    } else {
      mq.addListener(handler);
    }
    return () => {
      if (mq.removeEventListener) {
        mq.removeEventListener('change', handler);
      } else {
        mq.removeListener(handler);
      }
    };
  }, []);

  const tabs = useMemo(() => ([
    { key: 'tasks', label: 'Tasks', panelId: tasksPanelId },
    { key: 'events', label: 'Events', panelId: eventsPanelId },
  ]), [tasksPanelId, eventsPanelId]);

  const renderTabButtons = () => (
    <div
      className="sidebar-tabs"
      role="tablist"
      aria-label="Tasks and events"
      id={tabListId}
    >
      {tabs.map(t => (
        <button
          key={t.key}
          type="button"
          className="tab-btn"
          role="tab"
          aria-selected={activeTab === t.key}
          aria-controls={t.panelId}
          id={`${t.key}-tab`}
          onClick={() => setActiveTab(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );

  const renderTasksPanel = () => (
    <div
      id={tasksPanelId}
      role="tabpanel"
      aria-labelledby="tasks-tab"
      hidden={activeTab !== 'tasks'}
      className="sidebar-scroller"
    >
      {tasks.length === 0 ? (
        <div className="empty">No tasks yet.</div>
      ) : (
        <ul className="item-list" role="list">
          {tasks.map(task => (
            <TaskItem key={task.id} task={task} onUpdate={handleUpdateTask} />
          ))}
        </ul>
      )}
      <button
        type="button"
        className="add-btn"
        onClick={handleAddTask}
        aria-label="Add new task"
        title="Add task"
      >
        ➕ Add Task
      </button>
    </div>
  );

  const renderEventsPanel = () => (
    <div
      id={eventsPanelId}
      role="tabpanel"
      aria-labelledby="events-tab"
      hidden={activeTab !== 'events'}
      className="sidebar-scroller"
    >
      {events.length === 0 ? (
        <div className="empty">No events yet.</div>
      ) : (
        <ul className="item-list" role="list">
          {events.map(event => (
            <EventItem key={event.id} event={event} onUpdate={handleUpdateEvent} />
          ))}
        </ul>
      )}
      <button
        type="button"
        className="add-btn"
        onClick={handleAddEvent}
        aria-label="Add new event"
        title="Add event"
      >
        ➕ Add Event
      </button>
    </div>
  );

  return (
    <div className="sidebar-root" aria-label="Sidebar">
      {/* Mobile topbar trigger */}
      <div className="sidebar-topbar">
        <h2 className="sidebar-title">Tasks & Events</h2>
        <button
          type="button"
          className="sidebar-openbtn"
          onClick={() => setDrawerOpen(true)}
          aria-expanded={drawerOpen}
          aria-controls="sidebar-drawer-panel"
          aria-label="Open sidebar"
          title="Open sidebar"
        >
          ☰
        </button>
      </div>

      {/* Drawer for mobile, persistent panel for desktop */}
      <div className={`sidebar-drawer ${drawerOpen ? 'drawer-open' : ''}`}>
        <div
          className="drawer-backdrop"
          aria-hidden={!drawerOpen}
          onClick={() => setDrawerOpen(false)}
        />
        <section
          id="sidebar-drawer-panel"
          className="drawer-panel"
          aria-label="Tasks and events drawer"
        >
          <div className="sidebar-content">
            {renderTabButtons()}
            {renderTasksPanel()}
            {renderEventsPanel()}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Sidebar;
