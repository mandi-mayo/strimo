import axios from 'axios';

let baseUrl = import.meta.env.VITE_API_URL || '/api';

// If it's an absolute URL and doesn't end with /api, append it
if (baseUrl.startsWith('http') && !baseUrl.endsWith('/api') && !baseUrl.endsWith('/api/')) {
  baseUrl = baseUrl.endsWith('/') ? `${baseUrl}api` : `${baseUrl}/api`;
}

const API_BASE_URL = baseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;
export { API_BASE_URL };
