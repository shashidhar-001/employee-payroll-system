import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:8080' });

api.interceptors.request.use((cfg) => {
    const token = localStorage.getItem('token');
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        // Expired or invalid token: clear it and go back to login
        if (err.response?.status === 401 && !err.config.url.includes('/api/auth/login')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.setItem('loginNotice', 'Your session has ended. Please sign in again.');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export const errorMessage = (err) =>
    err.response?.data?.message ||
    err.response?.data?.error ||
    (err.response ? `Request failed (${err.response.status})` : 'Cannot reach the server');

export default api;