import { safeFetch } from './client';
import { API_PATHS } from '../utils/constants';

function isMockMode() {
  const envBase = process?.env?.REACT_APP_API_BASE;
  const envBackend = process?.env?.REACT_APP_BACKEND_URL;
  return !(envBase || envBackend);
}

// In-memory mock store (module-scoped) for graceful fallback
const mockEvents = [
  { id: 'e-200', title: 'Mock: 1:1 with Alex', datetime: 'Tue 2:30 PM', location: 'Room 3A' },
  { id: 'e-201', title: 'Mock: Sprint Review', datetime: 'Fri 10:00 AM', location: 'Zoom' },
];

/**
 * PUBLIC_INTERFACE
 * Fetch events list. Mocked when env not set.
 */
async function getEvents() {
  if (isMockMode()) {
    console.info('[eventsApi] Mock mode active (no REACT_APP_API_BASE/REACT_APP_BACKEND_URL). Returning mock events.');
    return { ok: true, data: { items: [...mockEvents], count: mockEvents.length, mocked: true } };
  }
  const resp = await safeFetch(API_PATHS.events, { method: 'GET' });
  return resp.ok ? { ok: true, data: resp.data } : { ok: false, error: resp.error || new Error('Failed to fetch events') };
}

/**
 * PUBLIC_INTERFACE
 * Create a new event.
 */
async function createEvent(event) {
  const payload = event || {};
  if (isMockMode()) {
    console.info('[eventsApi] Mock createEvent');
    const item = { id: `e-${Date.now()}`, ...payload };
    mockEvents.unshift(item);
    return { ok: true, data: item };
  }
  const resp = await safeFetch(API_PATHS.events, { method: 'POST', body: payload });
  return resp.ok ? { ok: true, data: resp.data } : { ok: false, error: resp.error || new Error('Failed to create event') };
}

/**
 * PUBLIC_INTERFACE
 * Update an event by id with a patch object.
 */
async function updateEvent(id, patch) {
  if (!id) return { ok: false, error: new Error('Event id is required') };

  if (isMockMode()) {
    console.info('[eventsApi] Mock updateEvent');
    const idx = mockEvents.findIndex((e) => e.id === id);
    if (idx >= 0) {
      mockEvents[idx] = { ...mockEvents[idx], ...(patch || {}) };
      return { ok: true, data: mockEvents[idx] };
    }
    return { ok: false, error: new Error('Event not found (mock)') };
  }
  const resp = await safeFetch(`${API_PATHS.events}/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch || {} });
  return resp.ok ? { ok: true, data: resp.data } : { ok: false, error: resp.error || new Error('Failed to update event') };
}

/**
 * PUBLIC_INTERFACE
 * Delete an event by id.
 */
async function deleteEvent(id) {
  if (!id) return { ok: false, error: new Error('Event id is required') };

  if (isMockMode()) {
    console.info('[eventsApi] Mock deleteEvent');
    const idx = mockEvents.findIndex((e) => e.id === id);
    if (idx >= 0) {
      const [removed] = mockEvents.splice(idx, 1);
      return { ok: true, data: { removed } };
    }
    return { ok: false, error: new Error('Event not found (mock)') };
  }
  const resp = await safeFetch(`${API_PATHS.events}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return resp.ok ? { ok: true, data: resp.data } : { ok: false, error: resp.error || new Error('Failed to delete event') };
}

const eventsApi = { getEvents, createEvent, updateEvent, deleteEvent };
export default eventsApi;
export { getEvents, createEvent, updateEvent, deleteEvent };
