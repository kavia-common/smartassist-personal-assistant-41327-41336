export const eventsInitialState = {
  items: [],
  loading: false,
};

/**
 * Events reducer supporting add/update/remove and loading state.
 */
export function eventsReducer(state = eventsInitialState, action) {
  switch (action.type) {
    case 'events/add': {
      const item = action.payload;
      if (!item || !item.id) return state;
      return { ...state, items: [item, ...state.items] };
    }
    case 'events/update': {
      const { id, patch } = action.payload || {};
      if (!id) return state;
      return {
        ...state,
        items: state.items.map((e) => (e.id === id ? { ...e, ...(patch || {}) } : e)),
      };
    }
    case 'events/remove': {
      const id = action.payload;
      if (!id) return state;
      return { ...state, items: state.items.filter((e) => e.id !== id) };
    }
    case 'events/setLoading':
      return { ...state, loading: !!action.payload };
    default:
      return state;
  }
}
