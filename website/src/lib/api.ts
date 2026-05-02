const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('aceai_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Something went wrong');
    }

    return data;
  },

  auth: {
    async login(credentials: any) {
      const data = await api.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (data.token) localStorage.setItem('aceai_token', data.token);
      return data;
    },
    async register(credentials: any) {
      const data = await api.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      if (data.token) localStorage.setItem('aceai_token', data.token);
      return data;
    },
    async me() {
      return api.request('/auth/me');
    },
    logout() {
      localStorage.removeItem('aceai_token');
    }
  },

  user: {
    async getCredits() {
      return api.request('/user/credits');
    }
  },

  sessions: {
    async list() {
      return api.request('/sessions');
    },
    async create(sessionData: any) {
      return api.request('/sessions', {
        method: 'POST',
        body: JSON.stringify(sessionData),
      });
    }
  },

  documents: {
    async list() {
      return api.request('/documents');
    }
  }
};
