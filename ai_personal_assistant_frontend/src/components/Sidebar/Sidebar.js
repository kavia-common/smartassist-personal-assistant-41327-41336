import React, { useEffect, useId, useMemo, useState } from 'react';
import './Sidebar.css';
import TaskItem from './TaskItem';
import EventItem from './EventItem';
import { useTasks, useEvents } from '../../state/store';
import tasksApi from '../../api/tasksApi';
import eventsApi from '../../api/eventsApi';

/**
 * PUBLIC_INTERFACE
 * Sidebar component providing "Tasks" and "Events" tabs with accessibility roles
 * and responsive behavior (overlay drawer on small screens, persistent on large).
 *
 * Notes:
 * - Loads tasks and events from APIs on mount with graceful mock fallback when env not configured.
 * - Dispatches to global store and uses optimistic updates for add/update operations.
 */
function Sidebar() {
  // Local responsive state for mobile overlay
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');

  // Global tasks/events state
  const { state: tasksState, addTask, updateTask, removeTask, setLoading: setTasksLoading } = useTasks();
  const { state: eventsState, addEvent, updateEvent, removeEvent, setLoading: setEventsLoading } = useEvents();

  // Initial load of tasks and events
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setTasksLoading(true);
      setEventsLoading(true);
      try {
        const [tResp, eResp] = await Promise.all([tasksApi.getTasks(), eventsApi.getEvents()]);
        if (!cancelled) {
          if (tResp?.ok && tResp.data?.items) {
            // replace list by removing all then adding; since we only have add action, just add in order
            const items = Array.isArray(tResp.data.items) ? tResp.data.items : [];
            items.forEach((it) => addTask(it));
          }
          if (eResp?.ok && eResp.data?.items) {
            const items = Array.isArray(eResp.data.items) ? eResp.data.items : [];
            items.forEach((it) => addEvent(it));
          }
        }
      } finally {
        if (!cancelled) {
          setTasksLoading(false);
          setEventsLoading(false);
        }
      }
    };
    load();

    return () => { cancelled = true; };
  }, [addEvent, addTask, setEventsLoading, setTasksLoading]);

  // Optimistic handlers
  const handleAddTask = async () => {
    const tempId = `t-${Date.now()}`;
    const optimistic = { id: tempId, title: 'New task', due: 'Later', status: 'pending' };
    addTask(optimistic);
    const resp = await tasksApi.createTask({ title: optimistic.title, due: optimistic.due, status: optimistic.status });
    if (resp?.ok && resp.data) {
      // Replace temp by real if id differs
      if (resp.data.id && resp.data.id !== tempId) {
        removeTask(tempId);
        addTask(resp.data);
      }
    }
  };

  const handleUpdateTask = async (id, patch) => {
    // Optimistic update
    updateTask(id, patch);
    const resp = await tasksApi.updateTask(id, patch);
    if (!resp?.ok) {
      // If failed, we could refetch; for simplicity, leave optimistic state.
      // In a real app, we might also enqueue a retry or show a toast.
    }
  };

  const handleAddEvent = async () => {
    const tempId = `e-${Date.now()}`;
    const optimistic = { id: tempId, title: 'New event', datetime: 'TBD', location: '' };
    addEvent(optimistic);
    const resp = await eventsApi.createEvent({ title: optimistic.title, datetime: optimistic.datetime, location: optimistic.location });
    if (resp?.ok && resp.data) {
      if (resp.data.id && resp.data.id !== tempId) {
        removeEvent(tempId);
        addEvent(resp.data);
      }
    }
  };

  const handleUpdateEvent = async (id, patch) => {
    updateEvent(id, patch);
    const resp = await eventsApi.updateEvent(id, patch);
    if (!resp?.ok) {
      // same note as tasks
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
      {tasksState.items.length === 0 ? (
        <div className="empty">{tasksState.loading ? 'Loading tasks…' : 'No tasks yet.'}</div>
      ) : (
        <ul className="item-list" role="list">
          {tasksState.items.map(task => (
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
      {eventsState.items.length === 0 ? (
        <div className="empty">{eventsState.loading ? 'Loading events…' : 'No events yet.'}</div>
      ) : (
        <ul className="item-list" role="list">
          {eventsState.items.map(event => (
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
