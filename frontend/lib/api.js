import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle unauthorized errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('token');
            // Redirect to login if on client side
            if (typeof window !== 'undefined') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export const authApi = {
    login: (email, password) => {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);
        return api.post('/api/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
    },
    me: () => api.get('/api/auth/me'),
    registerAdmin: () => api.post('/api/auth/register'),
};

export const sourceApi = {
    list: (workspaceId) => api.get(`/api/sources?workspace_id=${workspaceId}`),
    create: (workspaceId, data) => api.post(`/api/sources?workspace_id=${workspaceId}`, data),
    test: (id) => api.post(`/api/sources/${id}/test-connection`),
    discover: (id) => api.post(`/api/sources/${id}/discover-schema`),
};

export const pipelineApi = {
    list: (workspaceId) => api.get(`/api/pipelines?workspace_id=${workspaceId}`),
    get: (id) => api.get(`/api/pipelines/${id}`),
    save: (workspaceId, data) => api.post(`/api/pipelines?workspace_id=${workspaceId}`, data),
    run: (id, config) => api.post(`/api/pipelines/${id}/run`, config),
};

export default api;
