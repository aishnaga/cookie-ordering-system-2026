import axios from 'axios';

// Use relative URL in production (same origin), localhost in development
const baseURL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

export default api;
