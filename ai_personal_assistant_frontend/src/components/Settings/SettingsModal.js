import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import './SettingsModal.css';

/**
 * PUBLIC_INTERFACE
 * SettingsModal provides an accessible modal dialog for managing:
 * - Profile: display/update user info (stubbed)
 * - Preferences: theme toggle, compact mode, notifications
 * - Integrations: placeholders for connecting services
 *
 * Props:
 * - isOpen: boolean — modal visibility
 * - onClose: () => void — called to close the modal
 * - theme: 'light' | 'dark' — current theme
 * - onToggleTheme: () => void — callback to toggle theme
 */
function SettingsModal({ isOpen, onClose, theme = 'light', onToggleTheme }) {
  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  // Local settings for demo; in future, wire to app/global state
  const [compactMode, setCompactMode] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('compactMode') || 'false');
    } catch {
      return false;
    }
  });
  const [notifications, setNotifications] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('notifications') || 'true');
    } catch {
      return true;
    }
  });

  // Persist local settings
  useEffect(() => {
    try {
      window.localStorage.setItem('compactMode', JSON.stringify(compactMode));
    } catch {}
  }, [compactMode]);
  useEffect(() => {
    try {
      window.localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // Focus management and ESC to close
  useEffect(() => {
    if (!isOpen) return;

    // Save active element to restore on close
    const active = document.activeElement;

    // Delay focus to allow render
    const t = setTimeout(() => {
      if (closeBtnRef.current) {
        closeBtnRef.current.focus();
      } else if (dialogRef.current) {
        dialogRef.current.focus();
      }
    }, 0);

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
      // Basic focus trap for Tab within dialog content
      if (e.key === 'Tab' && dialogRef.current) {
        const focusableSelectors =
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';
        const nodes = dialogRef.current.querySelectorAll(focusableSelectors);
        const focusable = Array.from(nodes).filter(
          (el) => el.offsetParent !== null || el === document.activeElement
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKeyDown, true);
      // Restore focus
      if (active && active.focus) {
        active.focus();
      }
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = useCallback(
    (e) => {
      if (e.target.getAttribute('data-backdrop') === 'true') {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <div
      className="settings-modal-backdrop"
      data-backdrop="true"
      onClick={handleBackdropClick}
      aria-hidden={false}
    >
      <section
        className="settings-modal-panel card-surface"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        ref={dialogRef}
        tabIndex={-1}
      >
        <header className="settings-modal-header">
          <div>
            <h2 id={titleId} className="settings-title">Settings</h2>
            <p id={descId} className="settings-desc">Manage your profile, preferences, and integrations.</p>
          </div>
          <button
            type="button"
            className="icon-close"
            onClick={onClose}
            aria-label="Close settings"
            title="Close"
            ref={closeBtnRef}
          >
            ✕
          </button>
        </header>

        <div className="settings-modal-body">
          <div className="settings-sections">
            {/* Profile */}
            <section className="settings-section">
              <h3 className="section-title">Profile</h3>
              <div className="section-content">
                <div className="profile-row">
                  <div className="avatar" aria-hidden="true">🧑</div>
                  <div className="profile-fields">
                    <label className="field">
                      <span className="label">Display name</span>
                      <input
                        type="text"
                        placeholder="Your name"
                        defaultValue="Alex Johnson"
                        aria-label="Display name"
                      />
                    </label>
                    <label className="field">
                      <span className="label">Email</span>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        defaultValue="alex@example.com"
                        aria-label="Email"
                      />
                    </label>
                  </div>
                </div>
                <div className="actions">
                  <button type="button" className="btn-primary" onClick={() => { /* stub save */ }}>
                    Save Profile
                  </button>
                </div>
              </div>
            </section>

            {/* Preferences */}
            <section className="settings-section">
              <h3 className="section-title">Preferences</h3>
              <div className="section-content">
                <div className="pref-row">
                  <div className="pref-text">
                    <p className="pref-title">Theme</p>
                    <p className="pref-desc">Switch between light and dark mode.</p>
                  </div>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={onToggleTheme}
                    aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    title="Toggle theme"
                  >
                    {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
                  </button>
                </div>

                <div className="pref-row">
                  <div className="pref-text">
                    <p className="pref-title">Compact mode</p>
                    <p className="pref-desc">Reduce spacing for denser layouts.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={compactMode}
                      onChange={(e) => setCompactMode(e.target.checked)}
                      aria-label="Enable compact mode"
                    />
                    <span className="slider" aria-hidden="true" />
                  </label>
                </div>

                <div className="pref-row">
                  <div className="pref-text">
                    <p className="pref-title">Notifications</p>
                    <p className="pref-desc">Receive desktop and email alerts.</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={notifications}
                      onChange={(e) => setNotifications(e.target.checked)}
                      aria-label="Enable notifications"
                    />
                    <span className="slider" aria-hidden="true" />
                  </label>
                </div>
              </div>
            </section>

            {/* Integrations */}
            <section className="settings-section">
              <h3 className="section-title">Integrations</h3>
              <div className="section-content integrations">
                <div className="integration-card">
                  <div className="icon" aria-hidden="true">📧</div>
                  <div className="info">
                    <p className="name">Email</p>
                    <p className="desc">Connect your email to manage messages and scheduling.</p>
                  </div>
                  <button type="button" className="btn-ghost" onClick={() => { /* stub connect */ }}>
                    Connect
                  </button>
                </div>
                <div className="integration-card">
                  <div className="icon" aria-hidden="true">🗓️</div>
                  <div className="info">
                    <p className="name">Calendar</p>
                    <p className="desc">Sync events to create and update schedules.</p>
                  </div>
                  <button type="button" className="btn-ghost" onClick={() => { /* stub connect */ }}>
                    Connect
                  </button>
                </div>
                <div className="integration-card">
                  <div className="icon" aria-hidden="true">📝</div>
                  <div className="info">
                    <p className="name">Tasks</p>
                    <p className="desc">Link your task provider to manage tasks seamlessly.</p>
                  </div>
                  <button type="button" className="btn-ghost" onClick={() => { /* stub connect */ }}>
                    Connect
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>

        <footer className="settings-modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose} aria-label="Close">
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}

export default SettingsModal;
