import { api } from './api.js';

// Cache management
const cache = {
    data: new Map(),
    timestamps: new Map(),
    TTL: 60000, // 1 minute cache TTL
};

// Utility to check if cache is valid
const isCacheValid = (key) => {
    if (!cache.timestamps.has(key)) return false;
    const age = Date.now() - cache.timestamps.get(key);
    return age < cache.TTL;
};

// Utility to get from cache or fetch
const getCachedOrFetch = async (key, fetchFn) => {
    if (isCacheValid(key)) {
        return cache.data.get(key);
    }
    
    const data = await fetchFn();
    cache.data.set(key, data);
    cache.timestamps.set(key, Date.now());
    return data;
};

// Utility to invalidate cache
const invalidateCache = (key) => {
    if (key) {
        cache.data.delete(key);
        cache.timestamps.delete(key);
    } else {
        cache.data.clear();
        cache.timestamps.clear();
    }
};

export const dashboardService = {
    // ============================================
    // SUMMARY & OVERVIEW
    // ============================================
    
    async getSummary() {
        try {
            return await getCachedOrFetch('summary', async () => {
                const response = await api.get('/dashboard/summary');
                return response.data || response;
            });
        } catch (error) {
            console.error('Error fetching dashboard summary:', error);
            throw this.handleError(error);
        }
    },

    async getStats() {
        try {
            return await getCachedOrFetch('stats', async () => {
                const response = await api.get('/dashboard/stats');
                return {
                    totalTasks: response.totalTasks || 0,
                    completedTasks: response.completedTasks || 0,
                    completionRate: response.completionRate || 0,
                    streak: response.streak || 0,
                    goalsProgress: response.goalsProgress || 0,
                    achievements: response.achievements || [],
                    xp: response.xp || 0,
                    level: response.level || 1
                };
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
            throw this.handleError(error);
        }
    },

    // ============================================
    // TASKS MANAGEMENT
    // ============================================
    
    async getTasks(filters = {}) {
        try {
            const queryParams = new URLSearchParams(filters).toString();
            const cacheKey = `tasks_${queryParams}`;
            
            return await getCachedOrFetch(cacheKey, async () => {
                const response = await api.get(`/tasks?${queryParams}`);
                return response.data || response || [];
            });
        } catch (error) {
            console.error('Error fetching tasks:', error);
            throw this.handleError(error);
        }
    },

    async getTodayFocus() {
        try {
            return await getCachedOrFetch('todayFocus', async () => {
                const response = await api.get('/tasks/today');
                return {
                    tasks: response.tasks || [],
                    completed: response.completed || 0,
                    total: response.total || 0,
                    progress: response.progress || 0
                };
            });
        } catch (error) {
            console.error('Error fetching today\'s focus:', error);
            throw this.handleError(error);
        }
    },

    async createTask(taskData) {
        try {
            const response = await api.post('/tasks', taskData);
            invalidateCache('todayFocus');
            invalidateCache('summary');
            return response.data || response;
        } catch (error) {
            console.error('Error creating task:', error);
            throw this.handleError(error);
        }
    },

    async updateTask(taskId, taskData) {
        try {
            const response = await api.put(`/tasks/${taskId}`, taskData);
            invalidateCache(); // Clear all cache
            return response.data || response;
        } catch (error) {
            console.error('Error updating task:', error);
            throw this.handleError(error);
        }
    },

    async deleteTask(taskId) {
        try {
            const response = await api.delete(`/tasks/${taskId}`);
            invalidateCache();
            return response.data || response;
        } catch (error) {
            console.error('Error deleting task:', error);
            throw this.handleError(error);
        }
    },

    async completeTask(taskId) {
        try {
            const response = await api.patch(`/tasks/${taskId}/complete`);
            invalidateCache();
            return response.data || response;
        } catch (error) {
            console.error('Error completing task:', error);
            throw this.handleError(error);
        }
    },

    // ============================================
    // GOALS MANAGEMENT
    // ============================================
    
    async getGoals() {
        try {
            return await getCachedOrFetch('goals', async () => {
                const response = await api.get('/goals');
                return response.data || response || [];
            });
        } catch (error) {
            console.error('Error fetching goals:', error);
            throw this.handleError(error);
        }
    },

    async createGoal(goalData) {
        try {
            const response = await api.post('/goals', goalData);
            invalidateCache('goals');
            invalidateCache('summary');
            return response.data || response;
        } catch (error) {
            console.error('Error creating goal:', error);
            throw this.handleError(error);
        }
    },

    async updateGoalProgress(goalId, progress) {
        try {
            const response = await api.patch(`/goals/${goalId}/progress`, { progress });
            invalidateCache();
            return response.data || response;
        } catch (error) {
            console.error('Error updating goal progress:', error);
            throw this.handleError(error);
        }
    },

    // ============================================
    // ACHIEVEMENTS
    // ============================================
    
    async getAchievements() {
        try {
            return await getCachedOrFetch('achievements', async () => {
                const response = await api.get('/achievements');
                return response.data || response || [];
            });
        } catch (error) {
            console.error('Error fetching achievements:', error);
            throw this.handleError(error);
        }
    },

    async getRecentAchievements(limit = 3) {
        try {
            const achievements = await this.getAchievements();
            return achievements
                .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
                .slice(0, limit);
        } catch (error) {
            console.error('Error fetching recent achievements:', error);
            throw this.handleError(error);
        }
    },

    // ============================================
    // JOURNAL
    // ============================================
    
    async getJournalEntries(date) {
        try {
            const query = date ? `?date=${date}` : '';
            const response = await api.get(`/journal${query}`);
            return response.data || response || [];
        } catch (error) {
            console.error('Error fetching journal entries:', error);
            throw this.handleError(error);
        }
    },

    async createJournalEntry(entry) {
        try {
            const response = await api.post('/journal', entry);
            invalidateCache();
            return response.data || response;
        } catch (error) {
            console.error('Error creating journal entry:', error);
            throw this.handleError(error);
        }
    },

    // ============================================
    // ANALYTICS
    // ============================================
    
    async getAnalytics(timeframe = 'week') {
        try {
            const cacheKey = `analytics_${timeframe}`;
            return await getCachedOrFetch(cacheKey, async () => {
                const response = await api.get(`/analytics/${timeframe}`);
                return {
                    tasks: response.tasks || [],
                    productivity: response.productivity || {},
                    trends: response.trends || [],
                    summary: response.summary || {}
                };
            });
        } catch (error) {
            console.error('Error fetching analytics:', error);
            throw this.handleError(error);
        }
    },

    async getProductivityHeatmap() {
        try {
            return await getCachedOrFetch('heatmap', async () => {
                const response = await api.get('/analytics/heatmap');
                return response.data || response || [];
            });
        } catch (error) {
            console.error('Error fetching productivity heatmap:', error);
            throw this.handleError(error);
        }
    },

    // ============================================
    // TIMELINE
    // ============================================
    
    async getTimeline(period = 'month') {
        try {
            const cacheKey = `timeline_${period}`;
            return await getCachedOrFetch(cacheKey, async () => {
                const response = await api.get(`/timeline/${period}`);
                return response.data || response || [];
            });
        } catch (error) {
            console.error('Error fetching timeline:', error);
            throw this.handleError(error);
        }
    },

    // ============================================
    // INSPIRATION
    // ============================================
    
    async getInspirations() {
        try {
            return await getCachedOrFetch('inspirations', async () => {
                const response = await api.get('/inspirations');
                return response.data || response || [];
            });
        } catch (error) {
            console.error('Error fetching inspirations:', error);
            throw this.handleError(error);
        }
    },

    async getDailyQuote() {
        try {
            const response = await api.get('/inspirations/daily');
            return {
                quote: response.quote || "You don't build the future tomorrow. You build it today.",
                author: response.author || "Aman",
                date: response.date || new Date().toISOString()
            };
        } catch (error) {
            console.error('Error fetching daily quote:', error);
            // Return fallback quote
            return {
                quote: "You don't build the future tomorrow. You build it today.",
                author: "Aman",
                date: new Date().toISOString()
            };
        }
    },

    // ============================================
    // STREAK & PROGRESS
    // ============================================
    
    async getStreak() {
        try {
            return await getCachedOrFetch('streak', async () => {
                const response = await api.get('/streak');
                return {
                    current: response.current || 0,
                    best: response.best || 0,
                    lastUpdated: response.lastUpdated || new Date().toISOString()
                };
            });
        } catch (error) {
            console.error('Error fetching streak:', error);
            throw this.handleError(error);
        }
    },

    async getProgress() {
        try {
            return await getCachedOrFetch('progress', async () => {
                const response = await api.get('/progress');
                return {
                    overall: response.overall || 0,
                    monthly: response.monthly || 0,
                    weekly: response.weekly || 0,
                    categories: response.categories || {}
                };
            });
        } catch (error) {
            console.error('Error fetching progress:', error);
            throw this.handleError(error);
        }
    },

    // ============================================
    // DREAM TREE
    // ============================================
    
    async getDreamTree() {
        try {
            return await getCachedOrFetch('dreamtree', async () => {
                const response = await api.get('/dreamtree');
                return response.data || response || { nodes: [], connections: [] };
            });
        } catch (error) {
            console.error('Error fetching dream tree:', error);
            throw this.handleError(error);
        }
    },

    async addDreamNode(nodeData) {
        try {
            const response = await api.post('/dreamtree', nodeData);
            invalidateCache('dreamtree');
            return response.data || response;
        } catch (error) {
            console.error('Error adding dream node:', error);
            throw this.handleError(error);
        }
    },

    // ============================================
    // LEGACY BOT
    // ============================================
    
    async sendLegacyBotMessage(message) {
        try {
            const response = await api.post('/legacybot/chat', { message });
            return {
                response: response.reply || "I'm here to help you build your legacy!",
                context: response.context || null
            };
        } catch (error) {
            console.error('Error sending message to Legacy Bot:', error);
            throw this.handleError(error);
        }
    },

    async getLegacyBotInsights() {
        try {
            return await getCachedOrFetch('legacybot', async () => {
                const response = await api.get('/legacybot/insights');
                return response.data || response || {};
            });
        } catch (error) {
            console.error('Error fetching Legacy Bot insights:', error);
            throw this.handleError(error);
        }
    },

    // ============================================
    // FAMILY
    // ============================================
    
    async getFamilyMembers() {
        try {
            return await getCachedOrFetch('family', async () => {
                const response = await api.get('/family');
                return response.data || response || [];
            });
        } catch (error) {
            console.error('Error fetching family members:', error);
            throw this.handleError(error);
        }
    },

    async addFamilyMember(memberData) {
        try {
            const response = await api.post('/family', memberData);
            invalidateCache('family');
            return response.data || response;
        } catch (error) {
            console.error('Error adding family member:', error);
            throw this.handleError(error);
        }
    },

    // ============================================
    // USER MANAGEMENT
    // ============================================
    
    async getUserProfile() {
        try {
            return await getCachedOrFetch('profile', async () => {
                const response = await api.get('/user/profile');
                return response.data || response || {};
            });
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw this.handleError(error);
        }
    },

    async updateUserProfile(profileData) {
        try {
            const response = await api.put('/user/profile', profileData);
            invalidateCache('profile');
            return response.data || response;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw this.handleError(error);
        }
    },

    // ============================================
    // NOTIFICATIONS
    // ============================================
    
    async getNotifications() {
        try {
            return await getCachedOrFetch('notifications', async () => {
                const response = await api.get('/notifications');
                return response.data || response || [];
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw this.handleError(error);
        }
    },

    async markNotificationRead(notificationId) {
        try {
            const response = await api.patch(`/notifications/${notificationId}/read`);
            invalidateCache('notifications');
            return response.data || response;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw this.handleError(error);
        }
    },

    // ============================================
    // CACHE MANAGEMENT
    // ============================================
    
    clearCache() {
        invalidateCache();
        console.log('Cache cleared successfully');
    },

    getCacheStats() {
        return {
            size: cache.data.size,
            keys: Array.from(cache.data.keys()),
            timestamps: Array.from(cache.timestamps.entries())
        };
    },

    // ============================================
    // ERROR HANDLING
    // ============================================
    
    handleError(error) {
        if (error.response) {
            // Server responded with error
            const status = error.response.status;
            const message = error.response.data?.message || error.response.statusText;
            
            if (status === 401) {
                return new Error('Session expired. Please login again.');
            } else if (status === 403) {
                return new Error('You don\'t have permission to perform this action.');
            } else if (status === 404) {
                return new Error('Resource not found.');
            } else if (status === 429) {
                return new Error('Too many requests. Please try again later.');
            } else if (status >= 500) {
                return new Error('Server error. Please try again later.');
            }
            
            return new Error(message || 'An error occurred.');
        } else if (error.request) {
            // No response received
            return new Error('Network error. Please check your connection.');
        } else {
            // Other errors
            return new Error(error.message || 'An unexpected error occurred.');
        }
    }
};

// Export individual functions for convenience
export const {
    getSummary,
    getStats,
    getTasks,
    getTodayFocus,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    getGoals,
    createGoal,
    updateGoalProgress,
    getAchievements,
    getRecentAchievements,
    getJournalEntries,
    createJournalEntry,
    getAnalytics,
    getProductivityHeatmap,
    getTimeline,
    getInspirations,
    getDailyQuote,
    getStreak,
    getProgress,
    getDreamTree,
    addDreamNode,
    sendLegacyBotMessage,
    getLegacyBotInsights,
    getFamilyMembers,
    addFamilyMember,
    getUserProfile,
    updateUserProfile,
    getNotifications,
    markNotificationRead,
    clearCache,
    getCacheStats
} = dashboardService;
