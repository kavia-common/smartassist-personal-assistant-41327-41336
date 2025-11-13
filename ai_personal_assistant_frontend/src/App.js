import React, { useCallback, useEffect, useState } from 'react';
import './App.css';
import './index.css';
import MainLayout from './components/Layout/MainLayout';
import SettingsModal from './components/Settings/SettingsModal';
import { useUI } from './state/store';
import { scheduleHealthPing } from './utils/health';

// PUBLIC_INTERFACE
function App() {
  // Use global UI state for theme and preferences
  const {
    state: ui,
    toggleTheme,
  } = useUI();

  // Local-only settings modal visibility
  const [settingsOpen, setSettingsOpen] = useState(false);
  const handleOpenSettings = useCallback(() => setSettingsOpen(true), []);
  const handleCloseSettings = useCallback(() => setSettingsOpen(false), []);

  // Non-blocking health ping after mount
  useEffect(() => {
    // Schedule once per session; helper is idempotent and no-ops in tests/SSR
    scheduleHealthPing();
  }, []);

  return (
    <div className="App">
      <MainLayout
        theme={ui.theme}
        onToggleTheme={toggleTheme}
        onOpenSettings={handleOpenSettings}
      />
      <SettingsModal
        isOpen={settingsOpen}
        onClose={handleCloseSettings}
        theme={ui.theme}
        onToggleTheme={toggleTheme}
      />
    </div>
  );
}

export default App;
