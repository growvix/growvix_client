import axios from 'axios';
import { getCookie } from '@/utils/cookies';

// Set up global axios defaults and interceptors
export const setupAxios = () => {
    // Request interceptor to add authorization header
    axios.interceptors.request.use(
        (config) => {
            const token = getCookie('token');
            if (token && !config.headers.Authorization) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        },
        (error) => {
            return Promise.reject(error);
        }
    );

    // Response interceptor to handle unauthorized errors (401)
    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            if (error.response && error.response.status === 401) {
                // You could add logic here to redirect to login if needed
                // console.log('Unauthorized request - 401');
                // window.location.href = '/login';
            }
            return Promise.reject(error);
        }
    );
};
