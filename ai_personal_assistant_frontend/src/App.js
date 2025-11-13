import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import './index.css';
import MainLayout from './components/Layout/MainLayout';

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

  // Stub handlers until features are implemented
  const handleOpenSettings = useCallback(() => {
    // This will be wired to a settings modal/page later
    // For now, just log
    // eslint-disable-next-line no-console
    console.log('Open settings clicked');
  }, []);

  return (
    <div className="App">
      <MainLayout
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={handleOpenSettings}
      />
    </div>
  );
}

export default App;
