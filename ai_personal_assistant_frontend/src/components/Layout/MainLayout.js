import React, { useState } from 'react';
import Header from './Header';
import './MainLayout.css';
import ChatPanel from '../Chat/ChatPanel';

/**
 * PUBLIC_INTERFACE
 * MainLayout renders Header and a two-panel main section:
 * - Left: ChatPanel
 * - Right: Sidebar placeholder (collapsible on small screens)
 *
 * Props:
 * - theme: 'light' | 'dark'
 * - onToggleTheme: () => void
 * - onOpenSettings: () => void
 */
function MainLayout({ theme, onToggleTheme, onOpenSettings }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

        <aside
          className={`panel sidebar-panel card-surface ${sidebarOpen ? 'open' : 'closed'}`}
          aria-label="Tasks and events sidebar"
        >
          <div className="panel-header sidebar-header">
            <h2>Tasks & Events</h2>
            <button
              type="button"
              className="btn-ghost small"
              aria-expanded={sidebarOpen}
              aria-controls="sidebar-content"
              onClick={() => setSidebarOpen(s => !s)}
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              {sidebarOpen ? '➖' : '➕'}
            </button>
          </div>
          <div id="sidebar-content" className="panel-body">
            <ul className="placeholder-list">
              <li className="placeholder-item">
                <span className="dot dot-amber" aria-hidden="true"></span>
                Prepare weekly report — Fri 4:00 PM
              </li>
              <li className="placeholder-item">
                <span className="dot dot-blue" aria-hidden="true"></span>
                1:1 with Alex — Tue 2:30 PM
              </li>
              <li className="placeholder-item">
                <span className="dot dot-red" aria-hidden="true"></span>
                Pay credit card — Due tomorrow
              </li>
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default MainLayout;
