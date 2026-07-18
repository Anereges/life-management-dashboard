import { api } from './api.js';

export const tasksService = {
    async getAll() {
        return api.get('/tasks/');
    },

    async create(task) {
        return api.post('/tasks/', task);
    },

    async update(id, task) {
        return api.put(`/tasks/${id}`, task);
    },

    async delete(id) {
        return api.delete(`/tasks/${id}`);
    },

    async batchUpdateStatus(taskIds, status) {
        return api.post('/tasks/batch-status', { task_ids: taskIds, status });
    },

    async getStats() {
        return api.get('/tasks/stats');
    }
};