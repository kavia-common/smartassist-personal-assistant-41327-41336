import React, { createContext, useContext, useEffect, useMemo, useReducer } from 'react';
import { uiInitialState, uiReducer, persistUIPrefsToStorage, readUIPrefsFromStorage } from './uiSlice';
import { chatInitialState, chatReducer } from './chatSlice';
import { tasksInitialState, tasksReducer } from './tasksSlice';
import { eventsInitialState, eventsReducer } from './eventsSlice';

/**
 * Combine slice reducers into one root reducer.
 */
function rootReducer(state, action) {
  return {
    ui: uiReducer(state.ui, action),
    chat: chatReducer(state.chat, action),
    tasks: tasksReducer(state.tasks, action),
    events: eventsReducer(state.events, action),
  };
}

/**
 * Build initial state, hydrating UI prefs from localStorage safely.
 */
function getInitialState() {
  const persistedUIPrefs = readUIPrefsFromStorage();
  return {
    ui: { ...uiInitialState, ...persistedUIPrefs },
    chat: { ...chatInitialState },
    tasks: { ...tasksInitialState },
    events: { ...eventsInitialState },
  };
}

const AppStateContext = createContext(null);

/**
 * PUBLIC_INTERFACE
 * AppProvider composes all slices into a single context store for the app.
 * - Persists UI preferences to localStorage on change.
 */
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(rootReducer, undefined, getInitialState);

  // Persist UI preferences whenever they change
  useEffect(() => {
    persistUIPrefsToStorage(state.ui);
    // Also reflect theme to <html data-theme="">
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', state.ui.theme);
    }
  }, [state.ui]);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

/**
 * INTERNAL: base hook to access context.
 */
function useAppStateBase() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error('useAppStateBase must be used within <AppProvider>');
  }
  return ctx;
}

/**
 * PUBLIC_INTERFACE
 * useUI returns UI state and bound action dispatchers.
 */
export function useUI() {
  const { state, dispatch } = useAppStateBase();
  return {
    state: state.ui,
    // Actions
    setTheme: (theme) => dispatch({ type: 'ui/setTheme', payload: theme }),
    toggleTheme: () => dispatch({ type: 'ui/toggleTheme' }),
    setCompactMode: (enabled) => dispatch({ type: 'ui/setCompactMode', payload: enabled }),
    setNotifications: (enabled) => dispatch({ type: 'ui/setNotifications', payload: enabled }),
    setSidebarOpen: (open) => dispatch({ type: 'ui/setSidebarOpen', payload: open }),
    setFeatureFlags: (flags) => dispatch({ type: 'ui/setFeatureFlags', payload: flags }),
  };
}

/**
 * PUBLIC_INTERFACE
 * useChat returns Chat state and actions.
 */
export function useChat() {
  const { state, dispatch } = useAppStateBase();
  return {
    state: state.chat,
    sendMessage: (content) => dispatch({ type: 'chat/sendMessage', payload: { content } }),
    receiveMessage: (message) => dispatch({ type: 'chat/receiveMessage', payload: message }),
    setLoading: (loading) => dispatch({ type: 'chat/setLoading', payload: loading }),
    clear: () => dispatch({ type: 'chat/clear' }),
  };
}

/**
 * PUBLIC_INTERFACE
 * useTasks returns Tasks state and actions.
 */
export function useTasks() {
  const { state, dispatch } = useAppStateBase();
  return {
    state: state.tasks,
    addTask: (task) => dispatch({ type: 'tasks/add', payload: task }),
    updateTask: (id, patch) => dispatch({ type: 'tasks/update', payload: { id, patch } }),
    removeTask: (id) => dispatch({ type: 'tasks/remove', payload: id }),
    setLoading: (loading) => dispatch({ type: 'tasks/setLoading', payload: loading }),
  };
}

/**
 * PUBLIC_INTERFACE
 * useEvents returns Events state and actions.
 */
export function useEvents() {
  const { state, dispatch } = useAppStateBase();
  return {
    state: state.events,
    addEvent: (event) => dispatch({ type: 'events/add', payload: event }),
    updateEvent: (id, patch) => dispatch({ type: 'events/update', payload: { id, patch } }),
    removeEvent: (id) => dispatch({ type: 'events/remove', payload: id }),
    setLoading: (loading) => dispatch({ type: 'events/setLoading', payload: loading }),
  };
}
