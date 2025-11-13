import React from 'react';
import Header from './Header';
import './MainLayout.css';
import ChatPanel from '../Chat/ChatPanel';
import Sidebar from '../Sidebar/Sidebar';

/**
 * PUBLIC_INTERFACE
 * MainLayout renders Header and a two-panel main section:
 * - Left: ChatPanel
 * - Right: Sidebar with Tasks/Events (responsive)
 *
 * Props:
 * - theme: 'light' | 'dark'
 * - onToggleTheme: () => void
 * - onOpenSettings: () => void
 */
function MainLayout({ theme, onToggleTheme, onOpenSettings }) {
  return (
    <div className="layout-root">
      <Header
        theme={theme}
        onToggleTheme={onToggleTheme}
        onOpenSettings={onOpenSettings}
      />

      <main className="layout-main">
        <ChatPanel
          initialMessages={[
            { id: 'greet-1', role: 'assistant', content: 'Hello! How can I help you today?', status: 'normal' },
            { id: 'user-1', role: 'user', content: 'Schedule a meeting with Sarah next Tuesday at 2pm.' },
            { id: 'asst-1', role: 'assistant', content: 'Got it. I’ll add that to your calendar.', status: 'success' },
          ]}
        />

        <Sidebar
          onAddTask={() => { /* placeholder for future wiring */ }}
          onUpdateTask={() => { /* placeholder for future wiring */ }}
          onAddEvent={() => { /* placeholder for future wiring */ }}
          onUpdateEvent={() => { /* placeholder for future wiring */ }}
        />
      </main>
    </div>
  );
}

export default MainLayout;
