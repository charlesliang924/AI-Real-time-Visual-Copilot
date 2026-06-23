// Frontend API client - handles all communication with the backend

const getToken = () => localStorage.getItem('token');

const fetchApi = async (path: string, options: RequestInit = {}) => {
  const token = getToken();
  const resp = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  
  // Safely parse JSON for both success and error responses
  let data;
  try {
    data = await resp.json();
  } catch {
    throw new Error(`服务器错误 (HTTP ${resp.status})`);
  }
  
  if (!resp.ok) {
    throw new Error(data.error || `HTTP ${resp.status}`);
  }
  
  return data;
};

export const api = {
  // Auth
  auth: {
    login: (username: string, password: string) =>
      fetchApi('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    register: (username: string, password: string) =>
      fetchApi('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
    me: () => fetchApi('/auth/me'),
  },

  // Config (API key)
  config: () => fetchApi('/config'),

  // Memories
  memories: {
    list: () => fetchApi('/memories'),
    create: (fact: string) => fetchApi('/memories', { method: 'POST', body: JSON.stringify({ fact }) }),
    delete: (id: string) => fetchApi(`/memories/${id}`, { method: 'DELETE' }),
  },

  // Conversations
  conversations: {
    list: (limit = 100, offset = 0) => fetchApi(`/conversations?limit=${limit}&offset=${offset}`),
    create: (role: string, content: string) => fetchApi('/conversations', { method: 'POST', body: JSON.stringify({ role, content }) }),
    clear: () => fetchApi('/conversations', { method: 'DELETE' }),
  },

  // Personas
  personas: {
    list: () => fetchApi('/personas'),
    create: (data: { name: string; avatar_icon?: string; system_prompt: string }) =>
      fetchApi('/personas', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: { name: string; avatar_icon?: string; system_prompt: string }) =>
      fetchApi(`/personas/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/personas/${id}`, { method: 'DELETE' }),
  },

  // Skills
  skills: {
    list: () => fetchApi('/skills'),
    create: (data: { name: string; description: string; endpoint: string }) =>
      fetchApi('/skills', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/skills/${id}`, { method: 'DELETE' }),
  },

  // Stats
  stats: {
    log: (event_type: string, metadata?: any) =>
      fetchApi('/stats', { method: 'POST', body: JSON.stringify({ event_type, metadata }) }),
    me: () => fetchApi('/stats/me'),
  },

  // Admin
  admin: {
    users: () => fetchApi('/admin/users'),
    approveUser: (id: string, is_approved: boolean) =>
      fetchApi(`/admin/users/${id}/approve`, { method: 'POST', body: JSON.stringify({ is_approved }) }),
    stats: () => fetchApi('/admin/stats'),
  },
};
