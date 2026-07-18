import { api } from './api.js';

export const auth = {
    async register(username, email, password, fullName) {
        return api.post('/auth/register', {
            username,
            email,
            password,
            full_name: fullName
        });
    },

    async login(username, password) {
        const response = await api.post('/auth/login', {
            username,
            password
        });
        if (response.access_token) {
            api.setToken(response.access_token);
            localStorage.setItem('user', JSON.stringify(response.user));
        }
        return response;
    },

    logout() {
        api.setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        window.location.href = '/login.html';
    },

    getUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    isAuthenticated() {
        return !!api.token;
    },

    getToken() {
        return api.token;
    }
};