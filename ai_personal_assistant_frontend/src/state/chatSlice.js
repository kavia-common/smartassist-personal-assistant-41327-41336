export const chatInitialState = {
  messages: [],
  loading: false,
};

/**
 * Chat reducer for sending/receiving messages and loading indicator.
 */
export function chatReducer(state = chatInitialState, action) {
  switch (action.type) {
    case 'chat/sendMessage': {
      const content = (action.payload && action.payload.content) || '';
      if (!content.trim()) return state;
      const msg = {
        id: `u-${Date.now()}`,
        role: 'user',
        content,
        status: 'normal',
        timestamp: new Date().toISOString(),
      };
      return { ...state, messages: [...state.messages, msg] };
    }
    case 'chat/receiveMessage': {
      const m = action.payload || {};
      const msg = {
        id: m.id || `a-${Date.now()}`,
        role: m.role || 'assistant',
        content: m.content || '',
        status: m.status || 'normal',
        timestamp: m.timestamp || new Date().toISOString(),
      };
      return { ...state, messages: [...state.messages, msg] };
    }
    case 'chat/setLoading':
      return { ...state, loading: !!action.payload };
    case 'chat/clear':
      return { ...state, messages: [] };
    default:
      return state;
  }
}
