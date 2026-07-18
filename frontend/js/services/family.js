import { api } from './api.js';

export const familyService = {
    async getAllMembers() {
        return api.get('/family/members');
    },

    async getMember(id) {
        return api.get(`/family/members/${id}`);
    },

    async createMember(member) {
        return api.post('/family/members', member);
    },

    async updateMember(id, member) {
        return api.put(`/family/members/${id}`, member);
    },

    async deleteMember(id) {
        return api.delete(`/family/members/${id}`);
    },

    async addMemory(memory) {
        return api.post('/family/memories', memory);
    },

    async deleteMemory(id) {
        return api.delete(`/family/memories/${id}`);
    }
};