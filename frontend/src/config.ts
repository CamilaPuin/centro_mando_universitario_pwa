const defaultApiBaseUrl = import.meta.env.PROD
  ? 'https://centro-mando-api.onrender.com/api/v1'
  : '/api/v1';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || defaultApiBaseUrl;
