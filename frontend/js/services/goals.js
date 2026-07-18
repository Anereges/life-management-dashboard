import { api } from './api.js';

export const goalsService = {
    async getAll() {
        return api.get('/goals/');
    },

    async create(goal) {
        return api.post('/goals/', goal);
    },

    async update(id, goal) {
        return api.put(`/goals/${id}`, goal);
    },

    async delete(id) {
        return api.delete(`/goals/${id}`);
    },

    async getDreamTree() {
        return api.get('/goals/dream-tree');
    }
};
