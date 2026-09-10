import axios from 'axios';

let API_URL = 'http://localhost:5000/api'

if (window.location.hostname === 'admins.myspiritualassistant.com') {
    API_URL = 'https://api.myspiritualassistant.com/api';
}


const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to attach JWT token to outgoing requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('super_admin_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
