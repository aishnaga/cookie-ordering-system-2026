import axios from 'axios';

// Use environment variable for API URL, fallback to localhost in development
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;
