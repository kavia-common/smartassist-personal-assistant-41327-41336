import React from 'react';
import './Header.css';

/**
 * PUBLIC_INTERFACE
 * Header component for the app.
 * Shows title, search/quick action placeholder, settings/profile button, and theme toggle.
 *
 * Props:
 * - theme: 'light' | 'dark'
 * - onToggleTheme: () => void
 * - onOpenSettings: () => void
 */
function Header({ theme, onToggleTheme, onOpenSettings }) {
  return (
    <header className="app-header" role="banner">
      <div className="header-inner container">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">✨</div>
          <h1 className="brand-title">SmartAssist</h1>
        </div>

        <div className="header-center">
          <div className="search-quick" role="search">
            <input
              className="search-input"
              type="text"
              placeholder="Quick action or search…"
              aria-label="Quick action or search"
            />
            <button className="search-btn" type="button" aria-label="Run quick action">
              ⏎
            </button>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="btn-ghost"
            onClick={onOpenSettings}
            aria-label="Open settings"
            title="Settings"
          >
            ⚙️
          </button>
          <button
            type="button"
            className="btn-theme"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title="Toggle theme"
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
