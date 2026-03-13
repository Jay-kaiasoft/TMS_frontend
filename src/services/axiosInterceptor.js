import axios from 'axios';
import { baseURL } from '../config/config.js';
import { setLoading } from "../redux/commonReducers/commonReducers";
import store from "../redux/store";

const axiosInterceptor = axios.create({
    baseURL: baseURL,
});

// Request interceptor to attach token
axiosInterceptor.interceptors.request.use(
    (config) => {
        store.dispatch(setLoading(true));
        const token = localStorage.getItem('tms_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to format response and handle errors
axiosInterceptor.interceptors.response.use(
    (response) => {
        store.dispatch(setLoading(false));
        // Return standard response directly to allow services to handle data abstraction gracefully
        return response;
    },
    (error) => {
        store.dispatch(setLoading(false));
        // Handle 401 Unauthorized globally
        if (error.response && error.response.status === 401) {
            console.warn("Unauthorized access: redirecting to login");
            localStorage.removeItem('tms_token');
            // Optionally handle redirection to login here, or trigger an event/state
        }
        return Promise.reject(error);
    }
);

export default axiosInterceptor;
