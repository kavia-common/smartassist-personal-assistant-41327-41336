import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import './index.css';
import MainLayout from './components/Layout/MainLayout';
import SettingsModal from './components/Settings/SettingsModal';

// PUBLIC_INTERFACE
function App() {
  /**
   * Store theme in localStorage to persist across reloads.
   * Defaults to light.
   */
  const [theme, setTheme] = useState(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('theme') : null;
    return saved || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      window.localStorage.setItem('theme', theme);
    } catch {
      // Ignore storage errors (private mode, etc.)
    }
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = useCallback(() => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  // Settings modal state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const handleOpenSettings = useCallback(() => setSettingsOpen(true), []);
  const handleCloseSettings = useCallback(() => setSettingsOpen(false), []);

  return (
    <div className="App">
      <MainLayout
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={handleOpenSettings}
      />
      <SettingsModal
        isOpen={settingsOpen}
        onClose={handleCloseSettings}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}

export default App;
