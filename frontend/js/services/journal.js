import { api } from './api.js';

export const journalService = {
    async getEntries() {
        return api.get('/journal/entries');
    },

    async createEntry(entry) {
        return api.post('/journal/entries', entry);
    },

    async updateEntry(id, entry) {
        return api.put(`/journal/entries/${id}`, entry);
    },

    async deleteEntry(id) {
        return api.delete(`/journal/entries/${id}`);
    },

    async getStats() {
        return api.get('/journal/stats');
    }
};