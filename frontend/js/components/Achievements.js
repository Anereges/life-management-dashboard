// js/components/Achievements.js
export class Achievements {
    constructor() {
        this.container = null;
        this.currentFilter = 'all';
        this.currentCategory = 'all';
        this.currentBadge = 'all';
        this.currentSort = 'newest';
        this.searchQuery = '';
        this.editingAchievementId = null;
        this.viewingAchievementId = null;
        this.achievements = [];
        this.apiBase = 'https://life-management-api.onrender.com/api/achievements';
        this.token = localStorage.getItem('access_token');
        this.deleteTargetId = null;
        this.isLoading = false;
        this.selectedCategory = null;
        this.viewMode = 'grid'; // 'grid' | 'list'

        // Enhanced badge configuration
        this.badgeConfig = {
            'platinum': {
                color: '#E5E4E2',
                gradient: 'linear-gradient(135deg, #E5E4E2, #B8B8B8)',
                icon: '??',
                label: 'Platinum',
                shadow: '0 4px 20px rgba(229, 228, 226, 0.4)'
            },
            'gold': {
                color: '#FFD700',
                gradient: 'linear-gradient(135deg, #FFD700, #F4A460)',
                icon: '??',
                label: 'Gold',
                shadow: '0 4px 20px rgba(255, 215, 0, 0.4)'
            },
            'silver': {
                color: '#C0C0C0',
                gradient: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)',
                icon: '??',
                label: 'Silver',
                shadow: '0 4px 20px rgba(192, 192, 192, 0.4)'
            },
            'bronze': {
                color: '#CD7F32',
                gradient: 'linear-gradient(135deg, #CD7F32, #B8860B)',
                icon: '??',
                label: 'Bronze',
                shadow: '0 4px 20px rgba(205, 127, 50, 0.4)'
            }
        };

        this.categoryIcons = {
            'Coding': '??',
            'Career': '??',
            'Learning': '??',
            'Competition': '??',
            'Personal': '??',
            'General': '??',
            'Other': '??',
            'Health': '??',
            'Finance': '??',
            'Education': '??',
            'Social': '??',
            'Creative': '??',
            'Leadership': '??',
            'Technical': '?'
        };

        this.categoryColors = {
            'Coding': '#6C5CE7',
            'Career': '#00B894',
            'Learning': '#0984E3',
            'Competition': '#FDCB6E',
            'Personal': '#E17055',
            'General': '#636E72',
            'Other': '#A29BFE',
            'Health': '#00CEC9',
            'Finance': '#FDCB6E',
            'Education': '#74B9FF',
            'Social': '#FD79A8',
            'Creative': '#A29BFE',
            'Leadership': '#FDCB6E',
            'Technical': '#00B894'
        };
    }

    // ============ API METHODS ============

    async apiRequest(endpoint, method = 'GET', data = null) {
        const options = {
            method: method,
            headers: {
                'Authorization': `Bearer ${this.token}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, options);
            
            if (response.status === 401) {
                this.showToast('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1500);
                return null;
            }
            
            const result = await response.json();
            
            if (!response.ok) {
                this.showToast(result.error || 'An error occurred', 'error');
                return null;
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            this.showToast('?? Network error. Please check your connection.', 'error');
            return null;
        }
    }

    async loadAchievements() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const response = await fetch(`${this.apiBase}/`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.achievements = data.map(a => this.transformAchievement(a));
                console.log('? Achievements loaded:', this.achievements.length);
            } else if (response.status === 401) {
                this.showToast('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1500);
            } else {
                const error = await response.text();
                console.error('Failed to load achievements:', error);
                this.showToast('Failed to load achievements', 'error');
                this.achievements = [];
            }
        } catch (error) {
            console.error('Error loading achievements:', error);
            this.showToast('Network error loading achievements', 'error');
            this.achievements = [];
        } finally {
            this.isLoading = false;
        }
    }

    transformAchievement(backendAchievement) {
        const date = backendAchievement.date_earned ? new Date(backendAchievement.date_earned) : new Date();
        const category = backendAchievement.category || 'General';
        
        return {
            id: backendAchievement.id,
            title: backendAchievement.title,
            description: backendAchievement.description || '',
            date: date.toLocaleDateString('en-US', { 
                year: 'numeric',
                month: 'long', 
                day: 'numeric'
            }),
            dateRaw: backendAchievement.date_earned || date.toISOString().split('T')[0],
            icon: this.getIconForCategory(category),
            category: category,
            points: backendAchievement.points || 10,
            isFavorite: backendAchievement.is_favorite || false,
            badge: backendAchievement.badge || 'bronze',
            progress: 100,
            createdAt: backendAchievement.created_at || new Date().toISOString(),
            notes: backendAchievement.notes || '',
            media_url: backendAchievement.media_url || null,
            media_type: backendAchievement.media_type || null,
            importance: backendAchievement.importance || 1,
            is_hall_of_fame: backendAchievement.is_hall_of_fame || false,
            badgeConfig: this.badgeConfig[backendAchievement.badge] || this.badgeConfig.bronze
        };
    }

    transformToBackend(achievement) {
        return {
            title: achievement.title,
            description: achievement.description || '',
            date_earned: achievement.dateRaw || new Date().toISOString().split('T')[0],
            category: achievement.category || 'General',
            points: parseInt(achievement.points) || 10,
            badge: achievement.badge || 'bronze',
            is_favorite: achievement.isFavorite || false,
            notes: achievement.notes || '',
            importance: achievement.importance || 1,
            is_hall_of_fame: achievement.is_hall_of_fame || false,
            media_url: achievement.media_url || null,
            media_type: achievement.media_type || null
        };
    }

    getIconForCategory(category) {
        return this.categoryIcons[category] || '??';
    }

    getCategoryColor(category) {
        return this.categoryColors[category] || '#636E72';
    }

    getBadgeConfig(badge) {
        return this.badgeConfig[badge] || this.badgeConfig.bronze;
    }

    // ============ RENDER ============

    async render() {
        // Show loading state
        this.container = document.getElementById('page-content');
        this.container.innerHTML = this.renderLoadingState();
        
        await this.loadAchievements();
        
        this.container.innerHTML = `
            <div class="achievements-container">
                <!-- Animated Background -->
                <div class="achievements-bg-animation">
                    <div class="achievements-orb achievements-orb-1"></div>
                    <div class="achievements-orb achievements-orb-2"></div>
                    <div class="achievements-orb achievements-orb-3"></div>
                    <div class="achievements-orb achievements-orb-4"></div>
                </div>

                <!-- Header -->
                ${this.renderHeader()}

                <!-- Stats -->
                ${this.renderStats()}

                <!-- Controls -->
                ${this.renderControls()}

                <!-- Achievements Grid -->
                <div id="achievementsGrid" class="achievements-grid ${this.viewMode === 'list' ? 'list-view' : ''}">
                    ${this.renderAchievements(this.getFilteredAchievements())}
                </div>

                <!-- All Modals -->
                ${this.renderAddEditModal()}
                ${this.renderDetailsModal()}
                ${this.renderDeleteModal()}
                ${this.renderToast()}

                <!-- Floating Action Button (Mobile) -->
                <button class="fab-btn" id="achievementsFabBtn" aria-label="Add Achievement">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;

        this.setupEventListeners();
        this.animateCards();
        this.setupIntersectionObserver();
        
        return this.container;
    }

    renderLoadingState() {
        return `
            <div class="achievements-loading">
                <div class="loading-spinner"></div>
                <p>Loading your achievements...</p>
            </div>
        `;
    }

    renderHeader() {
        return `
            <header class="achievements-header glass-card fade-in-up">
                <div class="achievements-header-content">
                    <div>
                        <div class="achievements-badge">
                            <span class="achievements-badge-icon">??</span>
                            <span class="achievements-badge-text">Hall of Fame</span>
                        </div>
                        <h1 class="achievements-title">
                            Your <span class="achievements-title-highlight">Achievements</span>
                        </h1>
                        <p class="achievements-subtitle">Celebrate every milestone in your journey</p>
                    </div>
                    <div class="achievements-header-actions">
                        <div class="view-toggle">
                            <button class="view-toggle-btn active" data-view="grid" title="Grid View">
                                <i class="fas fa-th"></i>
                            </button>
                            <button class="view-toggle-btn" data-view="list" title="List View">
                                <i class="fas fa-list"></i>
                            </button>
                        </div>
                        <button class="btn btn-primary btn-glow" id="achievementsAddBtn">
                            <i class="fas fa-plus-circle"></i>
                            <span>Add Achievement</span>
                        </button>
                    </div>
                </div>
            </header>
        `;
    }

    renderStats() {
        const total = this.achievements.length;
        const favorites = this.achievements.filter(a => a.isFavorite).length;
        const categories = new Set(this.achievements.map(a => a.category)).size;
        const totalXp = this.achievements.reduce((sum, a) => sum + a.points, 0);
        const hallOfFame = this.achievements.filter(a => a.is_hall_of_fame).length;

        return `
            <div class="achievements-stats-wrapper glass-card" style="animation-delay: 0.1s;">
                <div class="achievements-stats-grid">
                    <div class="achievement-stat">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #6C5CE7, #A29BFE);">
                            <i class="fas fa-trophy"></i>
                        </div>
                        <div class="stat-content">
                            <span class="achievement-stat-number">${total}</span>
                            <span class="achievement-stat-label">Total Achievements</span>
                        </div>
                    </div>
                    <div class="achievement-stat">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #FFD700, #F4A460);">
                            <i class="fas fa-star"></i>
                        </div>
                        <div class="stat-content">
                            <span class="achievement-stat-number" style="color: #FFD700;">${favorites}</span>
                            <span class="achievement-stat-label">? Favorites</span>
                        </div>
                    </div>
                    <div class="achievement-stat">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #00B894, #00CEC9);">
                            <i class="fas fa-tags"></i>
                        </div>
                        <div class="stat-content">
                            <span class="achievement-stat-number" style="color: #00B894;">${categories}</span>
                            <span class="achievement-stat-label">Categories</span>
                        </div>
                    </div>
                    <div class="achievement-stat">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #FD79A8, #E17055);">
                            <i class="fas fa-star-half-alt"></i>
                        </div>
                        <div class="stat-content">
                            <span class="achievement-stat-number" style="color: #FD79A8;">${totalXp}</span>
                            <span class="achievement-stat-label">Total XP</span>
                        </div>
                    </div>
                    <div class="achievement-stat">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #FFD700, #FF6B6B);">
                            <i class="fas fa-crown"></i>
                        </div>
                        <div class="stat-content">
                            <span class="achievement-stat-number" style="color: #FFD700;">${hallOfFame}</span>
                            <span class="achievement-stat-label">Hall of Fame</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderControls() {
        const categories = ['all', ...new Set(this.achievements.map(a => a.category))];
        const badges = ['all', 'platinum', 'gold', 'silver', 'bronze'];
        const sortOptions = [
            { value: 'newest', label: 'Newest' },
            { value: 'oldest', label: 'Oldest' },
            { value: 'points', label: 'Highest XP' },
            { value: 'title', label: 'A-Z' },
            { value: 'importance', label: 'Importance' }
        ];

        return `
            <div class="achievements-controls glass-card" style="animation-delay: 0.2s;">
                <div class="search-bar">
                    <i class="fas fa-search search-icon"></i>
                    <input 
                        type="text" 
                        id="achievementsSearchInput" 
                        placeholder="Search achievements, categories, or keywords..." 
                        class="search-input"
                        value="${this.searchQuery}"
                    >
                    <button class="search-clear-btn" id="searchClearBtn" style="display: ${this.searchQuery ? 'flex' : 'none'}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="achievements-filters">
                    <div class="filter-group">
                        <label><i class="fas fa-tag"></i> Category</label>
                        <div class="filter-buttons" id="achievementsCategoryFilters">
                            ${categories.map(cat => `
                                <button class="filter-btn ${this.currentCategory === cat ? 'active' : ''}" 
                                        data-category="${cat}">
                                    ${cat === 'all' ? 'All' : `${this.getIconForCategory(cat)} ${cat}`}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="filter-group">
                        <label><i class="fas fa-medal"></i> Badge</label>
                        <div class="filter-buttons" id="achievementsBadgeFilters">
                            ${badges.map(badge => `
                                <button class="filter-btn ${this.currentBadge === badge ? 'active' : ''}" 
                                        data-badge="${badge}">
                                    ${badge === 'all' ? 'All' : `${this.badgeConfig[badge]?.icon || '??'} ${badge.charAt(0).toUpperCase() + badge.slice(1)}`}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="filter-group">
                        <label><i class="fas fa-sort"></i> Sort</label>
                        <select id="achievementsSortSelect" class="sort-select">
                            ${sortOptions.map(opt => `
                                <option value="${opt.value}" ${this.currentSort === opt.value ? 'selected' : ''}>
                                    ${opt.label}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    
                    <div class="filter-group filter-actions">
                        <button class="btn btn-ghost btn-sm" id="clearFiltersBtn">
                            <i class="fas fa-undo"></i> Reset
                        </button>
                    </div>
                </div>
                
                <div class="achievements-filter-stats">
                    <span id="filterCount">${this.getFilteredAchievements().length} achievements</span>
                    ${this.searchQuery ? `<span class="filter-tag"><i class="fas fa-search"></i> "${this.searchQuery}"</span>` : ''}
                    ${this.currentCategory !== 'all' ? `<span class="filter-tag">${this.getIconForCategory(this.currentCategory)} ${this.currentCategory}</span>` : ''}
                    ${this.currentBadge !== 'all' ? `<span class="filter-tag">${this.badgeConfig[this.currentBadge]?.icon || '??'} ${this.currentBadge}</span>` : ''}
                </div>
            </div>
        `;
    }

    renderAchievements(achievements) {
        if (this.isLoading) {
            return `
                <div class="loading-container" style="grid-column: 1 / -1; text-align: center; padding: 60px;">
                    <div class="loading-spinner"></div>
                    <p>Loading achievements...</p>
                </div>
            `;
        }

        if (achievements.length === 0) {
            return this.renderEmptyState();
        }

        if (this.viewMode === 'list') {
            return achievements.map((achievement, index) => 
                this.renderListItem(achievement, index)
            ).join('');
        }

        return achievements.map((achievement, index) => 
            this.renderGridItem(achievement, index)
        ).join('');
    }

    renderGridItem(achievement, index) {
        const badgeConfig = this.getBadgeConfig(achievement.badge);
        const categoryColor = this.getCategoryColor(achievement.category);
        
        return `
            <div class="achievement-card glass-card fade-in-up stagger-item" 
                 style="animation-delay: ${index * 0.05}s; 
                        --badge-color: ${badgeConfig.color};" 
                 data-id="${achievement.id}">
                <div class="achievement-card-glow" style="background: ${badgeConfig.color}30;"></div>
                
                <div class="achievement-card-header">
                    <div class="achievement-icon-wrapper" style="background: ${badgeConfig.color}20;">
                        <div class="achievement-icon">${achievement.icon}</div>
                        <div class="achievement-badge-icon" style="color: ${badgeConfig.color};">
                            ${badgeConfig.icon}
                        </div>
                    </div>
                    <div class="achievement-card-actions">
                        <button class="btn btn-ghost btn-sm achievements-toggle-favorite" 
                                data-id="${achievement.id}" 
                                title="${achievement.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                            <i class="fas ${achievement.isFavorite ? 'fa-star' : 'fa-star-o'}" 
                               style="${achievement.isFavorite ? 'color: #FFD700; text-shadow: 0 0 20px rgba(255, 215, 0, 0.4);' : ''}"></i>
                        </button>
                        <button class="btn btn-ghost btn-sm achievements-edit" data-id="${achievement.id}" title="Edit">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="btn btn-ghost btn-sm achievements-delete" data-id="${achievement.id}" title="Delete">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                
                <h3 class="achievement-title">${achievement.title}</h3>
                <p class="achievement-description">${achievement.description || 'No description provided'}</p>
                
                <div class="achievement-meta">
                    <span class="achievement-category" style="background: ${categoryColor}20; color: ${categoryColor};">
                        <i class="fas fa-tag"></i> ${achievement.icon} ${achievement.category}
                    </span>
                    <span class="achievement-date">
                        <i class="fas fa-calendar-alt"></i> ${achievement.date}
                    </span>
                    <span class="achievement-points" style="color: ${badgeConfig.color};">
                        <i class="fas fa-star"></i> ${achievement.points} XP
                    </span>
                </div>
                
                <div class="achievement-badge-display" style="background: ${badgeConfig.color}15; border-color: ${badgeConfig.color};">
                    <span>${badgeConfig.icon}</span>
                    <span>${badgeConfig.label} Badge</span>
                </div>
                
                <div class="achievement-card-footer">
                    <button class="btn btn-outline btn-sm achievements-view-details" data-id="${achievement.id}">
                        <i class="fas fa-eye"></i> Details
                    </button>
                    <button class="btn btn-ghost btn-sm achievements-share" data-id="${achievement.id}" title="Share">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderListItem(achievement, index) {
        const badgeConfig = this.getBadgeConfig(achievement.badge);
        const categoryColor = this.getCategoryColor(achievement.category);
        
        return `
            <div class="achievement-list-item glass-card fade-in-up stagger-item" 
                 style="animation-delay: ${index * 0.05}s;"
                 data-id="${achievement.id}">
                <div class="list-item-left">
                    <div class="list-item-icon" style="background: ${badgeConfig.color}20; color: ${badgeConfig.color};">
                        ${achievement.icon}
                    </div>
                    <div class="list-item-content">
                        <h4 class="list-item-title">${achievement.title}</h4>
                        <p class="list-item-description">${achievement.description || 'No description'}</p>
                        <div class="list-item-meta">
                            <span class="list-item-category" style="color: ${categoryColor};">${achievement.icon} ${achievement.category}</span>
                            <span class="list-item-date"><i class="fas fa-calendar-alt"></i> ${achievement.date}</span>
                            <span class="list-item-badge" style="color: ${badgeConfig.color};">${badgeConfig.icon} ${badgeConfig.label}</span>
                            <span class="list-item-points" style="color: ${badgeConfig.color};">? ${achievement.points} XP</span>
                        </div>
                    </div>
                </div>
                <div class="list-item-actions">
                    <button class="btn btn-ghost btn-sm achievements-toggle-favorite" data-id="${achievement.id}">
                        <i class="fas ${achievement.isFavorite ? 'fa-star' : 'fa-star-o'}" 
                           style="${achievement.isFavorite ? 'color: #FFD700;' : ''}"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm achievements-view-details" data-id="${achievement.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm achievements-edit" data-id="${achievement.id}">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button class="btn btn-ghost btn-sm achievements-delete" data-id="${achievement.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state glass-card" style="grid-column: 1 / -1; text-align: center; padding: 80px 40px;">
                <div class="empty-state-icon">??</div>
                <h3 class="empty-state-title">No Achievements Yet</h3>
                <p class="empty-state-subtitle">Start celebrating your wins by adding your first achievement!</p>
                <button class="btn btn-primary btn-glow" id="achievementsEmptyAddBtn">
                    <i class="fas fa-plus-circle"></i>
                    Add Your First Achievement
                </button>
            </div>
        `;
    }

    renderAddEditModal() {
        return `
            <div id="achievementsModal" class="modal" style="display:none;">
                <div class="modal-overlay"></div>
                <div class="modal-content glass-card modal-achievement">
                    <div class="modal-header">
                        <h3 class="modal-title" id="achievementsModalTitle">
                            <i class="fas fa-trophy" style="color: var(--primary);"></i>
                            New Achievement
                        </h3>
                        <button class="modal-close-btn" id="achievementsModalClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="achievementForm" class="achievement-form">
                            <div class="form-group">
                                <label for="achievementsTitleInput">
                                    Achievement Title <span class="required">*</span>
                                </label>
                                <input type="text" id="achievementsTitleInput" class="form-control" 
                                       placeholder="What did you achieve?" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="achievementsDescriptionInput">Description</label>
                                <textarea id="achievementsDescriptionInput" class="form-control" rows="2" 
                                          placeholder="Describe your achievement..."></textarea>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group" style="flex: 1;">
                                    <label for="achievementsCategoryInput">Category</label>
                                    <select id="achievementsCategoryInput" class="form-control">
                                        ${Object.entries(this.categoryIcons).map(([cat, icon]) => `
                                            <option value="${cat}">${icon} ${cat}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label for="achievementsBadgeInput">Badge</label>
                                    <select id="achievementsBadgeInput" class="form-control">
                                        ${Object.entries(this.badgeConfig).map(([key, config]) => `
                                            <option value="${key}">${config.icon} ${config.label}</option>
                                        `).join('')}
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group" style="flex: 1;">
                                    <label for="achievementsPointsInput">XP Points</label>
                                    <input type="number" id="achievementsPointsInput" class="form-control" 
                                           value="50" min="0" step="5">
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label for="achievementsDateInput">Date Earned</label>
                                    <input type="date" id="achievementsDateInput" class="form-control">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="achievementsNotesInput">Notes (Optional)</label>
                                <textarea id="achievementsNotesInput" class="form-control" rows="2" 
                                          placeholder="Any additional notes about this achievement..."></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="achievementsHallOfFameInput">
                                    <span>?? Add to Hall of Fame</span>
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost" id="achievementsModalCancelBtn">Cancel</button>
                        <button class="btn btn-primary" id="achievementsModalSaveBtn">
                            <i class="fas fa-save"></i> 
                            <span id="achievementsModalSaveText">Add Achievement</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderDetailsModal() {
        return `
            <div id="achievementsDetailsModal" class="modal" style="display:none;">
                <div class="modal-overlay"></div>
                <div class="modal-content glass-card modal-details">
                    <div class="modal-header">
                        <h3 class="modal-title" id="achievementsDetailsTitle">
                            <i class="fas fa-info-circle" style="color: var(--primary);"></i>
                            Achievement Details
                        </h3>
                        <button class="modal-close-btn" id="achievementsDetailsClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" id="achievementsDetailsBody">
                        <!-- Details will be rendered here -->
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost" id="achievementsDetailsCloseBtn">Close</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderDeleteModal() {
        return `
            <div id="achievementsDeleteModal" class="modal" style="display:none;">
                <div class="modal-overlay"></div>
                <div class="modal-content glass-card" style="max-width: 450px;">
                    <div class="modal-header" style="border-bottom: none; padding-bottom: 0;">
                        <h3 class="modal-title" style="color: var(--danger);">
                            <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
                            Delete Achievement
                        </h3>
                        <button class="modal-close-btn" id="achievementsDeleteClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" style="text-align: center; padding: 30px 20px;">
                        <div style="font-size: 4rem; margin-bottom: 16px;">???</div>
                        <h4 style="margin-bottom: 8px; color: var(--dark);">Are you sure?</h4>
                        <p style="color: var(--gray); margin-bottom: 20px;">
                            This action cannot be undone. This will permanently delete this achievement.
                        </p>
                        <div id="achievementsDeletePreview" style="background: rgba(0,0,0,0.03); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                            <p style="margin: 0; font-weight: 500;" id="achievementsDeleteTitle">Loading...</p>
                        </div>
                        <div style="display: flex; gap: 12px; justify-content: center;">
                            <button class="btn btn-ghost" id="achievementsDeleteCancelBtn">Cancel</button>
                            <button class="btn btn-danger" id="achievementsDeleteConfirmBtn">
                                <i class="fas fa-trash"></i> Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderToast() {
        return `
            <div id="achievementsToast" class="achievement-toast">
                <div class="toast-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="toast-content">
                    <span class="toast-title">Success</span>
                    <span class="toast-message" id="achievementsToastMessage">Achievement added!</span>
                </div>
                <button class="toast-close-btn" id="toastCloseBtn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }

    // ============ VIEW DETAILS ============

    viewDetails(id) {
        const achievement = this.achievements.find(a => a.id === id);
        if (!achievement) return;
        
        this.viewingAchievementId = id;
        const badgeConfig = this.getBadgeConfig(achievement.badge);
        const categoryColor = this.getCategoryColor(achievement.category);

        const body = document.getElementById('achievementsDetailsBody');
        body.innerHTML = `
            <div class="achievement-details-content">
                <div class="achievement-details-header">
                    <div class="achievement-details-icon" style="font-size: 3.5rem; text-align: center; margin-bottom: 12px;">
                        ${achievement.icon}
                    </div>
                    <h2 class="achievement-details-title">${achievement.title}</h2>
                    <div class="achievement-details-badges">
                        <span class="achievement-details-badge" style="background: ${badgeConfig.color}20; color: ${badgeConfig.color}; border-color: ${badgeConfig.color};">
                            ${badgeConfig.icon} ${badgeConfig.label}
                        </span>
                        ${achievement.isFavorite ? '<span class="achievement-details-favorite">? Favorite</span>' : ''}
                        ${achievement.is_hall_of_fame ? '<span class="achievement-details-hall">?? Hall of Fame</span>' : ''}
                    </div>
                </div>

                <div class="achievement-details-description">
                    <p>${achievement.description || 'No description provided.'}</p>
                </div>

                <div class="achievement-details-grid">
                    <div class="achievement-details-item">
                        <span class="achievement-details-label"><i class="fas fa-tag"></i> Category</span>
                        <span class="achievement-details-value" style="color: ${categoryColor};">${achievement.icon} ${achievement.category}</span>
                    </div>
                    <div class="achievement-details-item">
                        <span class="achievement-details-label"><i class="fas fa-calendar-alt"></i> Date</span>
                        <span class="achievement-details-value">${achievement.date}</span>
                    </div>
                    <div class="achievement-details-item">
                        <span class="achievement-details-label"><i class="fas fa-star"></i> XP Points</span>
                        <span class="achievement-details-value" style="color: ${badgeConfig.color}; font-weight: 700;">${achievement.points} XP</span>
                    </div>
                    <div class="achievement-details-item">
                        <span class="achievement-details-label"><i class="fas fa-medal"></i> Badge</span>
                        <span class="achievement-details-value">${badgeConfig.icon} ${badgeConfig.label}</span>
                    </div>
                    ${achievement.notes ? `
                        <div class="achievement-details-item" style="grid-column: 1 / -1;">
                            <span class="achievement-details-label"><i class="fas fa-sticky-note"></i> Notes</span>
                            <span class="achievement-details-value">${achievement.notes}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="achievement-details-actions">
                    <button class="btn btn-outline btn-sm achievements-toggle-favorite" data-id="${achievement.id}">
                        <i class="fas ${achievement.isFavorite ? 'fa-star' : 'fa-star-o'}"></i>
                        ${achievement.isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                    </button>
                    <button class="btn btn-primary btn-sm achievements-edit" data-id="${achievement.id}">
                        <i class="fas fa-pencil-alt"></i> Edit
                    </button>
                    <button class="btn btn-outline btn-sm achievements-share" data-id="${achievement.id}">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                </div>
            </div>
        `;

        // Add event listeners for actions inside details modal
        body.querySelector('.achievements-toggle-favorite')?.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            this.closeDetailsModal();
            this.toggleFavorite(id);
        });

        body.querySelector('.achievements-edit')?.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            this.closeDetailsModal();
            this.showEditAchievementModal(id);
        });

        body.querySelector('.achievements-share')?.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            this.closeDetailsModal();
            this.shareAchievement(id);
        });

        document.getElementById('achievementsDetailsModal').style.display = 'block';
    }

    // ============ FILTERING ============

    getFilteredAchievements() {
        let filtered = [...this.achievements];
        
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(a => a.category === this.currentCategory);
        }
        
        if (this.currentBadge !== 'all') {
            filtered = filtered.filter(a => a.badge === this.currentBadge);
        }
        
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(a => 
                a.title.toLowerCase().includes(query) ||
                a.description.toLowerCase().includes(query) ||
                a.category.toLowerCase().includes(query) ||
                (a.notes && a.notes.toLowerCase().includes(query))
            );
        }
        
        switch (this.currentSort) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'points':
                filtered.sort((a, b) => b.points - a.points);
                break;
            case 'title':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'importance':
                filtered.sort((a, b) => b.importance - a.importance);
                break;
            default:
                break;
        }
        
        return filtered;
    }

    applyFilters() {
        const container = document.getElementById('achievementsGrid');
        const filtered = this.getFilteredAchievements();
        container.innerHTML = this.renderAchievements(filtered);
        this.updateFilterStats(filtered.length);
        this.animateCards();
    }

    updateFilterStats(count) {
        const statsEl = document.querySelector('.achievements-filter-stats');
        if (statsEl) {
            const tags = [];
            if (this.searchQuery) {
                tags.push(`<span class="filter-tag"><i class="fas fa-search"></i> "${this.searchQuery}"</span>`);
            }
            if (this.currentCategory !== 'all') {
                tags.push(`<span class="filter-tag">${this.getIconForCategory(this.currentCategory)} ${this.currentCategory}</span>`);
            }
            if (this.currentBadge !== 'all') {
                const config = this.getBadgeConfig(this.currentBadge);
                tags.push(`<span class="filter-tag">${config.icon} ${config.label}</span>`);
            }
            
            statsEl.innerHTML = `
                <span id="filterCount">${count} achievement${count !== 1 ? 's' : ''}</span>
                ${tags.join(' ')}
            `;
        }
    }

    // ============ MODAL OPERATIONS ============

    showAddAchievementModal() {
        this.editingAchievementId = null;
        document.getElementById('achievementsModalTitle').innerHTML = `
            <i class="fas fa-plus-circle" style="color: var(--success);"></i>
            New Achievement
        `;
        document.getElementById('achievementsModalSaveText').textContent = 'Add Achievement';
        
        document.getElementById('achievementsTitleInput').value = '';
        document.getElementById('achievementsDescriptionInput').value = '';
        document.getElementById('achievementsCategoryInput').value = 'Coding';
        document.getElementById('achievementsBadgeInput').value = 'gold';
        document.getElementById('achievementsPointsInput').value = '50';
        document.getElementById('achievementsDateInput').value = new Date().toISOString().split('T')[0];
        document.getElementById('achievementsNotesInput').value = '';
        document.getElementById('achievementsHallOfFameInput').checked = false;
        
        this.openModal('achievementsModal');
        setTimeout(() => {
            document.getElementById('achievementsTitleInput').focus();
        }, 300);
    }

    showEditAchievementModal(id) {
        const achievement = this.achievements.find(a => a.id === id);
        if (!achievement) return;
        
        this.editingAchievementId = id;
        document.getElementById('achievementsModalTitle').innerHTML = `
            <i class="fas fa-pencil-alt" style="color: var(--primary);"></i>
            Edit Achievement
        `;
        document.getElementById('achievementsModalSaveText').textContent = 'Update Achievement';
        
        document.getElementById('achievementsTitleInput').value = achievement.title;
        document.getElementById('achievementsDescriptionInput').value = achievement.description || '';
        document.getElementById('achievementsCategoryInput').value = achievement.category;
        document.getElementById('achievementsBadgeInput').value = achievement.badge;
        document.getElementById('achievementsPointsInput').value = achievement.points;
        document.getElementById('achievementsDateInput').value = achievement.dateRaw || new Date().toISOString().split('T')[0];
        document.getElementById('achievementsNotesInput').value = achievement.notes || '';
        document.getElementById('achievementsHallOfFameInput').checked = achievement.is_hall_of_fame || false;
        
        this.openModal('achievementsModal');
        setTimeout(() => {
            document.getElementById('achievementsTitleInput').focus();
        }, 300);
    }

    closeAchievementModal() {
        this.closeModal('achievementsModal');
        this.editingAchievementId = null;
    }

    closeDetailsModal() {
        this.closeModal('achievementsDetailsModal');
        this.viewingAchievementId = null;
    }

    closeDeleteModal() {
        this.closeModal('achievementsDeleteModal');
        this.deleteTargetId = null;
    }

    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            // Trigger animation
            const content = modal.querySelector('.modal-content');
            if (content) {
                content.style.animation = 'none';
                requestAnimationFrame(() => {
                    content.style.animation = 'modalSlideIn 0.3s ease-out';
                });
            }
        }
    }

    closeModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    showDeleteModal(id) {
        const achievement = this.achievements.find(a => a.id === id);
        if (!achievement) return;
        
        this.deleteTargetId = id;
        document.getElementById('achievementsDeleteTitle').textContent = `"${achievement.title}"`;
        this.openModal('achievementsDeleteModal');
    }

    async confirmDelete() {
        if (!this.deleteTargetId) return;
        
        const result = await this.apiRequest(`/${this.deleteTargetId}`, 'DELETE');
        if (result) {
            this.closeDeleteModal();
            await this.loadAchievements();
            this.applyFilters();
            this.showToast('??? Achievement deleted successfully', 'warning');
        }
    }

    // ============ SAVE ACHIEVEMENT ============

    async saveAchievement() {
        const title = document.getElementById('achievementsTitleInput').value.trim();
        const description = document.getElementById('achievementsDescriptionInput').value.trim();
        const category = document.getElementById('achievementsCategoryInput').value;
        const badge = document.getElementById('achievementsBadgeInput').value;
        const points = parseInt(document.getElementById('achievementsPointsInput').value) || 10;
        const date = document.getElementById('achievementsDateInput').value || new Date().toISOString().split('T')[0];
        const notes = document.getElementById('achievementsNotesInput').value.trim();
        const isHallOfFame = document.getElementById('achievementsHallOfFameInput').checked;

        if (!title) {
            const input = document.getElementById('achievementsTitleInput');
            input.style.borderColor = 'var(--danger)';
            input.classList.add('shake');
            this.showToast('?? Please enter an achievement title', 'error');
            setTimeout(() => {
                input.style.borderColor = '';
                input.classList.remove('shake');
            }, 2000);
            return;
        }

        const achievementData = {
            title: title,
            description: description || '',
            category: category,
            badge: badge,
            points: points,
            date_earned: date,
            notes: notes || '',
            is_hall_of_fame: isHallOfFame,
            is_favorite: false
        };

        let result;
        if (this.editingAchievementId) {
            result = await this.apiRequest(`/${this.editingAchievementId}`, 'PUT', achievementData);
            if (result) {
                this.showToast('? Achievement updated successfully!', 'success');
            }
        } else {
            result = await this.apiRequest('/', 'POST', achievementData);
            if (result) {
                this.showToast('?? New achievement added! Celebrate your win!', 'success');
                this.celebrateAchievement();
            }
        }

        if (result) {
            this.closeAchievementModal();
            await this.loadAchievements();
            this.applyFilters();
        }
    }

    // ============ ACHIEVEMENT ACTIONS ============

    async toggleFavorite(id) {
        const achievement = this.achievements.find(a => a.id === id);
        if (!achievement) return;
        
        const newFavorite = !achievement.isFavorite;
        const result = await this.apiRequest(`/${id}`, 'PUT', {
            is_favorite: newFavorite
        });
        
        if (result) {
            await this.loadAchievements();
            this.applyFilters();
            this.showToast(newFavorite ? '? Added to favorites!' : '? Removed from favorites', 'info');
        }
    }

    async shareAchievement(id) {
        const achievement = this.achievements.find(a => a.id === id);
        if (!achievement) return;

        const shareText = `?? Achievement Unlocked!\n\n${achievement.icon} ${achievement.title}\n${achievement.description || 'No description'}\n\n?? ${achievement.date}\n?? ${achievement.category}\n? ${achievement.points} XP\n?? ${achievement.badge.charAt(0).toUpperCase() + achievement.badge.slice(1)} Badge\n\n#AchievementUnlocked #LegacyJourney`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: achievement.title,
                    text: shareText,
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Share error:', err);
                }
            }
        } else {
            try {
                await navigator.clipboard.writeText(shareText);
                this.showToast('?? Achievement copied to clipboard!', 'success');
            } catch (err) {
                // Fallback
                const textarea = document.createElement('textarea');
                textarea.value = shareText;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                this.showToast('?? Achievement copied to clipboard!', 'success');
            }
        }
    }

    // ============ CELEBRATION ============

    celebrateAchievement() {
        const container = document.querySelector('.achievements-container');
        if (!container) return;

        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#A29BFE', '#FD79A8'];
        
        // Create confetti
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'celebration-confetti';
            const size = 6 + Math.random() * 10;
            const color = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.cssText = `
                position: fixed;
                width: ${size}px;
                height: ${size * (0.5 + Math.random() * 0.5)}px;
                background: ${color};
                left: ${Math.random() * 100}%;
                top: -20px;
                border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
                animation: confettiFall ${2 + Math.random() * 3}s ease-in forwards;
                animation-delay: ${Math.random() * 0.5}s;
                transform: rotate(${Math.random() * 360}deg);
                z-index: 9999;
                pointer-events: none;
                box-shadow: 0 2px 10px ${color}40;
            `;
            document.body.appendChild(confetti);
            setTimeout(() => confetti.remove(), 5000);
        }

        // Add celebration styles if not exists
        if (!document.getElementById('celebrationStyles')) {
            const styles = document.createElement('style');
            styles.id = 'celebrationStyles';
            styles.textContent = `
                @keyframes confettiFall {
                    0% { 
                        transform: translateY(0) rotate(0deg) scale(1); 
                        opacity: 1; 
                    }
                    100% { 
                        transform: translateY(100vh) rotate(720deg) scale(0.5); 
                        opacity: 0; 
                    }
                }
                .shake {
                    animation: shake 0.5s ease-in-out;
                }
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-10px); }
                    75% { transform: translateX(10px); }
                }
            `;
            document.head.appendChild(styles);
        }

        // Fire confetti effect
        if (typeof confetti !== 'undefined') {
            try {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            } catch (e) {}
        }
    }

    // ============ UI HELPERS ============

    animateCards() {
        const cards = document.querySelectorAll('.stagger-item');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, 100 + index * 50);
        });
    }

    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            }, { threshold: 0.1 });

            document.querySelectorAll('.achievement-card, .achievement-list-item').forEach(el => {
                observer.observe(el);
            });
        }
    }

    // ============ EVENT LISTENERS ============

    setupEventListeners() {
        // Add Achievement button
        document.getElementById('achievementsAddBtn')?.addEventListener('click', () => {
            this.showAddAchievementModal();
        });

        document.getElementById('achievementsEmptyAddBtn')?.addEventListener('click', () => {
            this.showAddAchievementModal();
        });

        // FAB button
        document.getElementById('achievementsFabBtn')?.addEventListener('click', () => {
            this.showAddAchievementModal();
        });

        // View toggle
        document.querySelectorAll('.view-toggle-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.view-toggle-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.viewMode = btn.dataset.view;
                const grid = document.getElementById('achievementsGrid');
                if (grid) {
                    grid.className = `achievements-grid ${this.viewMode === 'list' ? 'list-view' : ''}`;
                    this.applyFilters();
                }
            });
        });

        // Search
        const searchInput = document.getElementById('achievementsSearchInput');
        const clearBtn = document.getElementById('searchClearBtn');
        
        searchInput?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            if (clearBtn) {
                clearBtn.style.display = this.searchQuery ? 'flex' : 'none';
            }
            this.applyFilters();
        });

        clearBtn?.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                this.searchQuery = '';
                clearBtn.style.display = 'none';
                this.applyFilters();
                searchInput.focus();
            }
        });

        // Category filters
        document.querySelectorAll('#achievementsCategoryFilters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#achievementsCategoryFilters .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCategory = btn.dataset.category;
                this.applyFilters();
            });
        });

        // Badge filters
        document.querySelectorAll('#achievementsBadgeFilters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#achievementsBadgeFilters .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentBadge = btn.dataset.badge;
                this.applyFilters();
            });
        });

        // Sort select
        document.getElementById('achievementsSortSelect')?.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.applyFilters();
        });

        // Clear filters
        document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
            this.currentCategory = 'all';
            this.currentBadge = 'all';
            this.currentSort = 'newest';
            this.searchQuery = '';
            
            if (searchInput) searchInput.value = '';
            if (clearBtn) clearBtn.style.display = 'none';
            
            document.querySelectorAll('#achievementsCategoryFilters .filter-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('#achievementsCategoryFilters .filter-btn[data-category="all"]')?.classList.add('active');
            
            document.querySelectorAll('#achievementsBadgeFilters .filter-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('#achievementsBadgeFilters .filter-btn[data-badge="all"]')?.classList.add('active');
            
            document.getElementById('achievementsSortSelect').value = 'newest';
            
            this.applyFilters();
            this.showToast('Filters reset', 'info');
        });

        // Modal close buttons
        document.getElementById('achievementsModalClose')?.addEventListener('click', () => this.closeAchievementModal());
        document.getElementById('achievementsModalCancelBtn')?.addEventListener('click', () => this.closeAchievementModal());
        document.getElementById('achievementsDetailsClose')?.addEventListener('click', () => this.closeDetailsModal());
        document.getElementById('achievementsDetailsCloseBtn')?.addEventListener('click', () => this.closeDetailsModal());
        document.getElementById('achievementsDeleteClose')?.addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('achievementsDeleteCancelBtn')?.addEventListener('click', () => this.closeDeleteModal());

        // Delete confirm
        document.getElementById('achievementsDeleteConfirmBtn')?.addEventListener('click', () => this.confirmDelete());

        // Save achievement
        document.getElementById('achievementsModalSaveBtn')?.addEventListener('click', () => this.saveAchievement());

        // Toast close
        document.getElementById('toastCloseBtn')?.addEventListener('click', () => {
            const toast = document.getElementById('achievementsToast');
            if (toast) toast.classList.remove('show');
        });

        // Click outside modals
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    const id = modal.id;
                    if (id === 'achievementsModal') this.closeAchievementModal();
                    else if (id === 'achievementsDetailsModal') this.closeDetailsModal();
                    else if (id === 'achievementsDeleteModal') this.closeDeleteModal();
                }
            });
        });

        // Achievement action delegation
        document.querySelector('#achievementsGrid')?.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.achievements-edit');
            const deleteBtn = e.target.closest('.achievements-delete');
            const favoriteBtn = e.target.closest('.achievements-toggle-favorite');
            const viewBtn = e.target.closest('.achievements-view-details');
            const shareBtn = e.target.closest('.achievements-share');
            
            if (editBtn) {
                const id = parseInt(editBtn.dataset.id);
                this.showEditAchievementModal(id);
            }
            
            if (deleteBtn) {
                const id = parseInt(deleteBtn.dataset.id);
                this.showDeleteModal(id);
            }
            
            if (favoriteBtn) {
                const id = parseInt(favoriteBtn.dataset.id);
                this.toggleFavorite(id);
            }
            
            if (viewBtn) {
                const id = parseInt(viewBtn.dataset.id);
                this.viewDetails(id);
            }
            
            if (shareBtn) {
                const id = parseInt(shareBtn.dataset.id);
                this.shareAchievement(id);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+K or / to focus search
            if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !e.ctrlKey && !e.metaKey)) {
                e.preventDefault();
                const searchInput = document.getElementById('achievementsSearchInput');
                if (searchInput) searchInput.focus();
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                const modals = ['achievementsModal', 'achievementsDetailsModal', 'achievementsDeleteModal'];
                for (const id of modals) {
                    const modal = document.getElementById(id);
                    if (modal && modal.style.display !== 'none') {
                        if (id === 'achievementsModal') this.closeAchievementModal();
                        else if (id === 'achievementsDetailsModal') this.closeDetailsModal();
                        else if (id === 'achievementsDeleteModal') this.closeDeleteModal();
                        break;
                    }
                }
            }
            
            // 'a' to add new achievement
            if (e.key === 'a' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const modal = document.getElementById('achievementsModal');
                if (modal && modal.style.display === 'none') {
                    e.preventDefault();
                    this.showAddAchievementModal();
                }
            }
        });
    }

    // ============ TOAST NOTIFICATION ============

    showToast(message, type = 'success') {
        const toast = document.getElementById('achievementsToast');
        const toastMessage = document.getElementById('achievementsToastMessage');
        const toastIcon = toast?.querySelector('.toast-icon i');
        const toastTitle = toast?.querySelector('.toast-title');
        
        if (toast && toastMessage) {
            // Update icon and title based on type
            const configs = {
                'success': { icon: 'fa-check-circle', title: 'Success' },
                'error': { icon: 'fa-exclamation-circle', title: 'Error' },
                'warning': { icon: 'fa-exclamation-triangle', title: 'Warning' },
                'info': { icon: 'fa-info-circle', title: 'Info' }
            };
            
            const config = configs[type] || configs.success;
            
            if (toastIcon) {
                toastIcon.className = `fas ${config.icon}`;
                toastIcon.style.color = type === 'error' ? 'var(--danger)' : 
                                        type === 'warning' ? 'var(--warning)' : 
                                        type === 'info' ? 'var(--primary)' : 'var(--success)';
            }
            
            if (toastTitle) {
                toastTitle.textContent = config.title;
            }
            
            toastMessage.textContent = message;
            toast.className = 'achievement-toast show';
            toast.style.borderLeftColor = type === 'error' ? 'var(--danger)' : 
                                          type === 'warning' ? 'var(--warning)' : 
                                          type === 'info' ? 'var(--primary)' : 'var(--success)';
            
            // Auto hide after 3.5 seconds
            clearTimeout(this.toastTimeout);
            this.toastTimeout = setTimeout(() => {
                toast.classList.remove('show');
            }, 3500);
        } else {
            // Fallback
            if (window.showToast) {
                window.showToast('Achievements', message, type, 2500);
            } else {
                console.log(`[${type}] ${message}`);
            }
        }
    }
}

export default Achievements;
