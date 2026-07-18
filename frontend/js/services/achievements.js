import { api } from './api.js';

export const achievementsService = {
    async getAll() {
        return api.get('/achievements/');
    },

    async create(achievement) {
        return api.post('/achievements/', achievement);
    },

    async update(id, achievement) {
        return api.put(`/achievements/${id}`, achievement);
    },

    async delete(id) {
        return api.delete(`/achievements/${id}`);
    },

    async getStats() {
        return api.get('/achievements/stats');
    }
};