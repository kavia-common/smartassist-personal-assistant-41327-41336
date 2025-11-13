import { safeFetch } from './client';
import { API_PATHS } from '../utils/constants';

function isMockMode() {
  const envBase = process?.env?.REACT_APP_API_BASE;
  const envBackend = process?.env?.REACT_APP_BACKEND_URL;
  return !(envBase || envBackend);
}

// In-memory mock store (module-scoped) for graceful fallback
const mockTasks = [
  { id: 't-100', title: 'Mock: Prepare weekly report', due: 'Fri 4:00 PM', status: 'pending' },
  { id: 't-101', title: 'Mock: Pay bills', due: 'Tomorrow', status: 'pending' },
];

/**
 * PUBLIC_INTERFACE
 * Fetch tasks list. Mocked when env not set.
 */
async function getTasks() {
  if (isMockMode()) {
    console.info('[tasksApi] Mock mode active (no REACT_APP_API_BASE/REACT_APP_BACKEND_URL). Returning mock tasks.');
    return { ok: true, data: { items: [...mockTasks], count: mockTasks.length, mocked: true } };
  }
  const resp = await safeFetch(API_PATHS.tasks, { method: 'GET' });
  return resp.ok ? { ok: true, data: resp.data } : { ok: false, error: resp.error || new Error('Failed to fetch tasks') };
}

/**
 * PUBLIC_INTERFACE
 * Create a new task.
 */
async function createTask(task) {
  const payload = task || {};
  if (isMockMode()) {
    console.info('[tasksApi] Mock createTask');
    const item = { id: `t-${Date.now()}`, ...payload };
    mockTasks.unshift(item);
    return { ok: true, data: item };
  }
  const resp = await safeFetch(API_PATHS.tasks, { method: 'POST', body: payload });
  return resp.ok ? { ok: true, data: resp.data } : { ok: false, error: resp.error || new Error('Failed to create task') };
}

/**
 * PUBLIC_INTERFACE
 * Update a task by id with a patch object.
 */
async function updateTask(id, patch) {
  if (!id) return { ok: false, error: new Error('Task id is required') };

  if (isMockMode()) {
    console.info('[tasksApi] Mock updateTask');
    const idx = mockTasks.findIndex((t) => t.id === id);
    if (idx >= 0) {
      mockTasks[idx] = { ...mockTasks[idx], ...(patch || {}) };
      return { ok: true, data: mockTasks[idx] };
    }
    return { ok: false, error: new Error('Task not found (mock)') };
  }
  const resp = await safeFetch(`${API_PATHS.tasks}/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch || {} });
  return resp.ok ? { ok: true, data: resp.data } : { ok: false, error: resp.error || new Error('Failed to update task') };
}

/**
 * PUBLIC_INTERFACE
 * Delete a task by id.
 */
async function deleteTask(id) {
  if (!id) return { ok: false, error: new Error('Task id is required') };

  if (isMockMode()) {
    console.info('[tasksApi] Mock deleteTask');
    const idx = mockTasks.findIndex((t) => t.id === id);
    if (idx >= 0) {
      const [removed] = mockTasks.splice(idx, 1);
      return { ok: true, data: { removed } };
    }
    return { ok: false, error: new Error('Task not found (mock)') };
  }
  const resp = await safeFetch(`${API_PATHS.tasks}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  return resp.ok ? { ok: true, data: resp.data } : { ok: false, error: resp.error || new Error('Failed to delete task') };
}

const tasksApi = { getTasks, createTask, updateTask, deleteTask };
export default tasksApi;
export { getTasks, createTask, updateTask, deleteTask };
