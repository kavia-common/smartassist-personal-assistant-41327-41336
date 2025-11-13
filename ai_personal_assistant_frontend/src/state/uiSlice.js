const STORAGE_KEY = 'app.ui.prefs.v1';

// Preferences we persist
const persistedKeys = ['theme', 'compactMode', 'notifications', 'sidebarOpen', 'featureFlags'];

/**
 * Safely read persisted UI preferences from localStorage.
 */
export function readUIPrefsFromStorage() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return {};
    return parsed;
  } catch {
    return {};
  }
}

/**
 * Persist selected UI preferences to localStorage.
 */
export function persistUIPrefsToStorage(uiState) {
  try {
    const toSave = {};
    for (const k of persistedKeys) {
      if (k in uiState) toSave[k] = uiState[k];
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // ignore persistence errors
  }
}

const envFlags = (() => {
  // Read feature flags from env var if present (JSON or comma-list of flags=true)
  const raw = typeof process !== 'undefined' ? process.env.REACT_APP_FEATURE_FLAGS : undefined;
  if (!raw) return {};
  try {
    if (raw.trim().startsWith('{')) {
      return JSON.parse(raw);
    }
    // Parse key1=true,key2=false
    const obj = {};
    raw.split(',').forEach(pair => {
      const [k, v] = pair.split('=').map(s => s?.trim());
      if (!k) return;
      obj[k] = v === 'true';
    });
    return obj;
  } catch {
    return {};
  }
})();

export const uiInitialState = {
  theme: 'light',
  compactMode: false,
  notifications: true,
  sidebarOpen: true,
  featureFlags: envFlags,
};

/**
 * UI reducer handles preferences and viewport controls.
 */
export function uiReducer(state = uiInitialState, action) {
  switch (action.type) {
    case 'ui/setTheme': {
      const theme = action.payload === 'dark' ? 'dark' : 'light';
      return { ...state, theme };
    }
    case 'ui/toggleTheme': {
      const theme = state.theme === 'light' ? 'dark' : 'light';
      return { ...state, theme };
    }
    case 'ui/setCompactMode':
      return { ...state, compactMode: !!action.payload };
    case 'ui/setNotifications':
      return { ...state, notifications: !!action.payload };
    case 'ui/setSidebarOpen':
      return { ...state, sidebarOpen: !!action.payload };
    case 'ui/setFeatureFlags':
      return { ...state, featureFlags: { ...(state.featureFlags || {}), ...(action.payload || {}) } };
    default:
      return state;
  }
}
