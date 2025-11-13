export const tasksInitialState = {
  items: [],
  loading: false,
};

/**
 * Tasks reducer supporting add/update/remove and loading state.
 */
export function tasksReducer(state = tasksInitialState, action) {
  switch (action.type) {
    case 'tasks/add': {
      const item = action.payload;
      if (!item || !item.id) return state;
      return { ...state, items: [item, ...state.items] };
    }
    case 'tasks/update': {
      const { id, patch } = action.payload || {};
      if (!id) return state;
      return {
        ...state,
        items: state.items.map((t) => (t.id === id ? { ...t, ...(patch || {}) } : t)),
      };
    }
    case 'tasks/remove': {
      const id = action.payload;
      if (!id) return state;
      return { ...state, items: state.items.filter((t) => t.id !== id) };
    }
    case 'tasks/setLoading':
      return { ...state, loading: !!action.payload };
    default:
      return state;
  }
}
