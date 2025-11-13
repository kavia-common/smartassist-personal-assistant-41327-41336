import React, { useState } from 'react';
import Header from './Header';
import './MainLayout.css';

/**
 * PUBLIC_INTERFACE
 * MainLayout renders Header and a two-panel main section:
 * - Left: ChatPanel placeholder
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
        <section className="panel chat-panel card-surface" aria-label="Chat panel">
          <div className="panel-header">
            <h2>Chat</h2>
            <p className="muted">Conversational assistant will appear here.</p>
          </div>
          <div className="panel-body">
            <div className="chat-placeholder">
              <div className="bubble assistant">Hello! How can I help you today?</div>
              <div className="bubble user">Schedule a meeting with Sarah next Tuesday at 2pm.</div>
              <div className="bubble assistant success">Got it. I’ll add that to your calendar.</div>
            </div>
          </div>
        </section>

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
