import axios from 'axios';

// Get API URL from environment variable or fallback to /api for local proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export default api;
export { API_BASE_URL };
