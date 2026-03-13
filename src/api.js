import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('tms_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Centralized Response Interceptor
api.interceptors.response.use(
    (response) => {
        // If the backend returned a unified APIResponse struct, the real payload is in response.data
        // We return response.data completely so components can destructure { status, message, result } from it
        return response.data;
    },
    (error) => {
        // Uniform error structuring
        const customError = {
            status: error.response?.status || 500,
            message: error.response?.data?.message || error.message || "An unexpected error occurred",
            result: error.response?.data?.result || null
        };
        return Promise.reject(customError);
    }
);

export default api;
