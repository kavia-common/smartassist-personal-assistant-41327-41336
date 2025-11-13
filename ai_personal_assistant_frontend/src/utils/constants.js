//
// Common constants and configuration accessors for the app.
// Note: Do not read .env directly here; CRA exposes process.env.REACT_APP_*
//

// PUBLIC_INTERFACE
export const APP_NAME = 'SmartAssist';

// PUBLIC_INTERFACE
export const HEALTHCHECK_PATH = process?.env?.REACT_APP_HEALTHCHECK_PATH || '/healthz';

// PUBLIC_INTERFACE
export const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

// PUBLIC_INTERFACE
export const API_PATHS = {
  chat: '/api/chat',
  tasks: '/api/tasks',
  events: '/api/events',
  health: HEALTHCHECK_PATH,
};

// PUBLIC_INTERFACE
export const ENV = {
  NODE_ENV: process?.env?.NODE_ENV,
  // CRA standard exposure
  REACT_APP_NODE_ENV: process?.env?.REACT_APP_NODE_ENV,
  FRONTEND_URL: process?.env?.REACT_APP_FRONTEND_URL,
  API_BASE: process?.env?.REACT_APP_API_BASE,
  BACKEND_URL: process?.env?.REACT_APP_BACKEND_URL,
  WS_URL: process?.env?.REACT_APP_WS_URL,
  LOG_LEVEL: process?.env?.REACT_APP_LOG_LEVEL || 'info',
};
