// js/components/Inspiration.js
export class Inspiration {
    constructor() {
        this.container = null;
        this.currentCategory = 'all';
        this.currentSort = 'newest';
        this.searchQuery = '';
        this.editingImageId = null;
        this.viewingImageId = null;
        this.images = [];
        this.apiBase = 'https://life-management-api.onrender.com/api/inspiration';
        this.token = localStorage.getItem('access_token');
        this.deleteTargetId = null;
        this.formData = {};
        this.currentQuoteIndex = 0;
        this.isLoading = false;
        this.quoteRotationInterval = null;
        
        // Enhanced quotes collection
        this.quotes = [
            {
                text: "The only way to do great work is to love what you do.",
                author: "Steve Jobs",
                category: "Career"
            },
            {
                text: "Believe you can and you're halfway there.",
                author: "Theodore Roosevelt",
                category: "Motivation"
            },
            {
                text: "Your limitation—it's only your imagination.",
                author: "Anonymous",
                category: "Mindset"
            },
            {
                text: "Push yourself, because no one else is going to do it for you.",
                author: "Anonymous",
                category: "Motivation"
            },
            {
                text: "Great things never come from comfort zones.",
                author: "Anonymous",
                category: "Growth"
            },
            {
                text: "Dream it. Wish it. Do it.",
                author: "Anonymous",
                category: "Dreams"
            },
            {
                text: "Success doesn't just find you. You have to go out and get it.",
                author: "Anonymous",
                category: "Success"
            },
            {
                text: "The harder you work for something, the greater you'll feel when you achieve it.",
                author: "Anonymous",
                category: "Success"
            },
            {
                text: "Don't watch the clock; do what it does. Keep going.",
                author: "Sam Levenson",
                category: "Persistence"
            },
            {
                text: "The future belongs to those who believe in the beauty of their dreams.",
                author: "Eleanor Roosevelt",
                category: "Dreams"
            },
            {
                text: "It does not matter how slowly you go as long as you do not stop.",
                author: "Confucius",
                category: "Persistence"
            },
            {
                text: "The only impossible journey is the one you never begin.",
                author: "Tony Robbins",
                category: "Action"
            },
            {
                text: "What you get by achieving your goals is not as important as what you become.",
                author: "Zig Ziglar",
                category: "Growth"
            },
            {
                text: "The best time to plant a tree was 20 years ago. The second best time is now.",
                author: "Chinese Proverb",
                category: "Action"
            },
            {
                text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
                author: "Winston Churchill",
                category: "Resilience"
            }
        ];

        // Category colors mapping
        this.categoryColors = {
            'Dreams': '#6C5CE7',
            'Travel': '#00B894',
            'Career': '#0984E3',
            'Family': '#FD79A8',
            'Learning': '#FDCB6E',
            'Adventure': '#E17055',
            'Growth': '#00CEC9',
            'Wellness': '#00B894',
            'Creativity': '#A29BFE',
            'Other': '#636E72',
            'Motivation': '#FF6B6B',
            'Mindset': '#6C5CE7',
            'Success': '#FFD93D',
            'Persistence': '#E17055',
            'Action': '#00B894',
            'Resilience': '#FD79A8'
        };

        // Category icons mapping
        this.categoryIcons = {
            'Dreams': 'fa-star',
            'Travel': 'fa-globe',
            'Career': 'fa-rocket',
            'Family': 'fa-heart',
            'Learning': 'fa-graduation-cap',
            'Adventure': 'fa-mountain',
            'Growth': 'fa-seedling',
            'Wellness': 'fa-spa',
            'Creativity': 'fa-palette',
            'Other': 'fa-plus-circle',
            'Motivation': 'fa-bolt',
            'Mindset': 'fa-brain',
            'Success': 'fa-trophy',
            'Persistence': 'fa-infinity',
            'Action': 'fa-play',
            'Resilience': 'fa-shield-alt'
        };
    }

    // ============ API METHODS ============

    async loadImages() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const response = await fetch(`${this.apiBase}/images`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.images = data.map(i => this.transformImage(i));
                console.log('? Inspiration images loaded:', this.images.length);
            } else if (response.status === 401) {
                this.showToast('Session expired. Please login again.', 'error');
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 1500);
            } else {
                const error = await response.text();
                console.error('Failed to load images:', error);
                this.showToast('Failed to load inspiration images', 'error');
                this.images = [];
            }
        } catch (error) {
            console.error('Error loading images:', error);
            this.showToast('Network error loading inspiration', 'error');
            this.images = [];
        } finally {
            this.isLoading = false;
        }
    }

    transformImage(backendImage) {
        const category = backendImage.category || 'Other';
        const icon = backendImage.icon || this.categoryIcons[category] || 'fa-star';
        const color = backendImage.color || this.categoryColors[category] || '#6C5CE7';
        
        return {
            id: backendImage.id,
            icon: icon,
            title: backendImage.title || 'Untitled Vision',
            description: backendImage.description || 'A beautiful vision',
            color: color,
            category: category,
            isFavorite: backendImage.is_favorite || false,
            createdAt: backendImage.created_at || new Date().toISOString(),
            image_url: backendImage.image_url || null,
            updatedAt: backendImage.updated_at || null,
            tags: backendImage.tags || []
        };
    }

    transformToBackend(image) {
        return {
            title: image.title,
            description: image.description || '',
            category: image.category || 'Other',
            color: image.color || '#6C5CE7',
            icon: image.icon || 'fa-star',
            is_favorite: image.isFavorite || false,
            image_url: image.image_url || null,
            tags: image.tags || []
        };
    }

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
            this.showToast('?? Network error. Please try again.', 'error');
            return null;
        }
    }

    // ============ RENDER ============

    async render() {
        // Show loading state
        this.container = document.getElementById('page-content');
        this.container.innerHTML = this.renderLoadingState();
        
        await this.loadImages();
        
        this.container.innerHTML = `
            <div class="inspiration-container">
                <!-- Animated Background -->
                ${this.renderBackground()}

                <!-- Header -->
                ${this.renderHeader()}
                
                <!-- Stats -->
                ${this.renderStats()}
                
                <!-- Daily Inspiration -->
                ${this.renderDailyInspiration()}

                <!-- Search & Filters -->
                ${this.renderControls()}

                <!-- Inspiration Grid -->
                <div id="inspirationGrid" class="inspiration-grid">
                    ${this.renderImages(this.getFilteredImages())}
                </div>

                <!-- All Modals -->
                ${this.renderAddEditModal()}
                ${this.renderDetailsModal()}
                ${this.renderDeleteModal()}
                ${this.renderToast()}

                <!-- Floating Action Button -->
                <button class="fab-btn" id="inspirationFabBtn" aria-label="Add Vision">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        `;

        this.setupEventListeners();
        this.animateCards();
        this.startQuoteRotation();
        this.addFloatingEffects();
        
        // Store instance for global access
        window.inspirationInstance = this;
        
        return this.container;
    }

    // ============ RENDER HELPERS ============

    renderLoadingState() {
        return `
            <div class="inspiration-loading">
                <div class="loading-spinner"></div>
                <p>Loading your inspiration board...</p>
            </div>
        `;
    }

    renderBackground() {
        return `
            <div class="inspiration-bg-animation">
                <div class="inspiration-orb inspiration-orb-1"></div>
                <div class="inspiration-orb inspiration-orb-2"></div>
                <div class="inspiration-orb inspiration-orb-3"></div>
                <div class="floating-shapes">
                    <div class="shape shape-1">?</div>
                    <div class="shape shape-2">?</div>
                    <div class="shape shape-3">?</div>
                    <div class="shape shape-4">?</div>
                    <div class="shape shape-5">?</div>
                    <div class="shape shape-6">?</div>
                    <div class="shape shape-7">?</div>
                </div>
            </div>
        `;
    }

    renderHeader() {
        return `
            <header class="inspiration-header glass-card fade-in-up">
                <div class="inspiration-header-content">
                    <div>
                        <div class="inspiration-badge">
                            <span class="inspiration-badge-icon">?</span>
                            <span class="inspiration-badge-text">Vision Board</span>
                        </div>
                        <h1 class="inspiration-title">
                            Your <span class="inspiration-title-highlight">Inspiration</span> Hub
                        </h1>
                        <p class="inspiration-subtitle">Visualize your dreams, stay motivated, and manifest your future</p>
                    </div>
                    <div class="inspiration-header-actions">
                        <button class="btn btn-primary btn-glow" id="inspirationAddBtn">
                            <i class="fas fa-plus-circle"></i>
                            <span>Add Vision</span>
                        </button>
                    </div>
                </div>
            </header>
        `;
    }

    renderStats() {
        const total = this.images.length;
        const favorites = this.images.filter(i => i.isFavorite).length;
        const categories = [...new Set(this.images.map(i => i.category))].length;
        const favoriteRate = total > 0 ? Math.round((favorites / total) * 100) : 0;

        return `
            <div class="inspiration-stats-wrapper glass-card" style="animation-delay: 0.1s;">
                <div class="inspiration-stats-grid">
                    <div class="inspiration-stat">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #6C5CE7, #A29BFE);">
                            <i class="fas fa-star"></i>
                        </div>
                        <div class="stat-content">
                            <span class="inspiration-stat-number">${total}</span>
                            <span class="inspiration-stat-label">Total Visions</span>
                        </div>
                    </div>
                    <div class="inspiration-stat">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #FFD700, #F4A460);">
                            <i class="fas fa-star"></i>
                        </div>
                        <div class="stat-content">
                            <span class="inspiration-stat-number" style="color: #FFD700;">${favorites}</span>
                            <span class="inspiration-stat-label">? Favorites</span>
                        </div>
                    </div>
                    <div class="inspiration-stat">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #00B894, #00CEC9);">
                            <i class="fas fa-tags"></i>
                        </div>
                        <div class="stat-content">
                            <span class="inspiration-stat-number" style="color: #00B894;">${categories}</span>
                            <span class="inspiration-stat-label">Categories</span>
                        </div>
                    </div>
                    <div class="inspiration-stat">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #FD79A8, #E17055);">
                            <i class="fas fa-percentage"></i>
                        </div>
                        <div class="stat-content">
                            <span class="inspiration-stat-number" style="color: #FD79A8;">${favoriteRate}%</span>
                            <span class="inspiration-stat-label">Favorite Rate</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderDailyInspiration() {
        const quote = this.quotes[this.currentQuoteIndex] || this.quotes[0];
        return `
            <div class="daily-inspiration glass-card fade-in-up" style="animation-delay: 0.15s;">
                <div class="daily-inspiration-content">
                    <div class="daily-inspiration-icon">
                        <i class="fas fa-lightbulb"></i>
                    </div>
                    <div class="daily-inspiration-text">
                        <span class="daily-label">? Daily Inspiration</span>
                        <p class="daily-quote" id="inspirationDailyQuote">"${quote.text}"</p>
                        <p class="daily-author">— ${quote.author}</p>
                        ${quote.category ? `<span class="daily-category">${quote.category}</span>` : ''}
                    </div>
                    <div class="daily-inspiration-controls">
                        <button class="btn btn-ghost btn-sm" id="inspirationPrevQuote" title="Previous Quote">
                            <i class="fas fa-chevron-left"></i>
                        </button>
                        <button class="btn btn-ghost btn-sm" id="inspirationNextQuote" title="Next Quote">
                            <i class="fas fa-chevron-right"></i>
                        </button>
                        <button class="btn btn-ghost btn-sm" id="inspirationRefreshQuote" title="Random Quote">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderControls() {
        const categories = ['all', ...new Set(this.images.map(i => i.category))];
        const sortOptions = [
            { value: 'newest', label: 'Newest' },
            { value: 'oldest', label: 'Oldest' },
            { value: 'favorites', label: '? Favorites' },
            { value: 'alphabetical', label: 'A-Z' },
            { value: 'category', label: 'By Category' }
        ];

        return `
            <div class="inspiration-controls glass-card" style="animation-delay: 0.2s;">
                <div class="search-bar">
                    <i class="fas fa-search search-icon"></i>
                    <input 
                        type="text" 
                        id="inspirationSearchInput" 
                        placeholder="Search visions, categories, or keywords..." 
                        class="search-input"
                        value="${this.searchQuery}"
                    >
                    <button class="search-clear-btn" id="searchClearBtn" style="display: ${this.searchQuery ? 'flex' : 'none'}">
                        <i class="fas fa-times"></i>
                    </button>
                    <span class="search-shortcut">Ctrl+K</span>
                </div>
                
                <div class="inspiration-filters">
                    <div class="filter-group">
                        <label><i class="fas fa-tag"></i> Category</label>
                        <div class="filter-buttons" id="inspirationCategoryFilters">
                            ${categories.map(cat => `
                                <button class="filter-btn ${this.currentCategory === cat ? 'active' : ''}" 
                                        data-category="${cat}">
                                    ${cat === 'all' ? 'All' : `${this.getCategoryIcon(cat)} ${cat}`}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="filter-group">
                        <label><i class="fas fa-sort"></i> Sort By</label>
                        <select id="inspirationSortSelect" class="sort-select">
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
                
                <div class="inspiration-filter-stats">
                    <span id="filterCount">${this.getFilteredImages().length} visions</span>
                    ${this.searchQuery ? `<span class="filter-tag"><i class="fas fa-search"></i> "${this.searchQuery}"</span>` : ''}
                    ${this.currentCategory !== 'all' ? `<span class="filter-tag">${this.getCategoryIcon(this.currentCategory)} ${this.currentCategory}</span>` : ''}
                    ${this.currentSort !== 'newest' ? `<span class="filter-tag">Sort: ${this.getSortLabel(this.currentSort)}</span>` : ''}
                </div>
            </div>
        `;
    }

    renderImages(images) {
        if (this.isLoading) {
            return `
                <div class="loading-container" style="grid-column: 1 / -1; text-align: center; padding: 60px;">
                    <div class="loading-spinner"></div>
                    <p>Loading visions...</p>
                </div>
            `;
        }

        if (images.length === 0) {
            return this.renderEmptyState();
        }

        return images.map((image, index) => 
            this.renderImageCard(image, index)
        ).join('');
    }

    renderImageCard(image, index) {
        const color = image.color || '#6C5CE7';
        const icon = image.icon || 'fa-star';
        
        return `
            <div class="inspiration-card glass-card fade-in-up stagger-item" 
                 style="animation-delay: ${index * 0.06}s; --card-color: ${color};" 
                 data-id="${image.id}">
                <div class="inspiration-card-glow" style="background: ${color}30;"></div>
                
                <div class="inspiration-card-header">
                    <div class="inspiration-icon-wrapper" style="background: ${color}20;">
                        <div class="inspiration-icon" style="color: ${color};">
                            <i class="fas ${icon}"></i>
                        </div>
                    </div>
                    <div class="inspiration-card-actions">
                        <button class="btn btn-ghost btn-sm inspiration-toggle-favorite" 
                                data-id="${image.id}" 
                                title="${image.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                            <i class="fas ${image.isFavorite ? 'fa-star' : 'fa-star-o'}" 
                               style="${image.isFavorite ? 'color: #FFD700; text-shadow: 0 0 20px rgba(255, 215, 0, 0.4);' : ''}"></i>
                        </button>
                        <button class="btn btn-ghost btn-sm inspiration-edit" data-id="${image.id}" title="Edit Vision">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button class="btn btn-ghost btn-sm inspiration-delete" data-id="${image.id}" title="Delete Vision">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                
                <h3 class="inspiration-title-text">${image.title}</h3>
                <p class="inspiration-description">${image.description || 'No description provided'}</p>
                
                <div class="inspiration-meta">
                    <span class="inspiration-category" style="background: ${color}20; color: ${color};">
                        <i class="fas ${this.getCategoryIcon(image.category)}"></i> ${image.category}
                    </span>
                    <span class="inspiration-date">
                        <i class="fas fa-calendar-alt"></i> ${this.formatDate(image.createdAt)}
                    </span>
                    ${image.isFavorite ? '<span class="inspiration-favorite-badge">? Favorite</span>' : ''}
                </div>
                
                <div class="inspiration-card-footer">
                    <button class="btn btn-outline btn-sm inspiration-view-details" data-id="${image.id}">
                        <i class="fas fa-eye"></i> Details
                    </button>
                    <button class="btn btn-ghost btn-sm inspiration-share" data-id="${image.id}" title="Share Vision">
                        <i class="fas fa-share-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state glass-card" style="grid-column: 1 / -1; text-align: center; padding: 80px 40px;">
                <div class="empty-state-icon">??</div>
                <h3 class="empty-state-title">No Visions Found</h3>
                <p class="empty-state-subtitle">Start creating your vision board by adding your dreams!</p>
                <button class="btn btn-primary btn-glow" id="inspirationEmptyAddBtn">
                    <i class="fas fa-plus-circle"></i>
                    Add Your First Vision
                </button>
            </div>
        `;
    }

    renderAddEditModal() {
        return `
            <div id="inspirationModal" class="modal" style="display:none;">
                <div class="modal-overlay"></div>
                <div class="modal-content glass-card modal-achievement">
                    <div class="modal-header">
                        <h3 class="modal-title" id="inspirationModalTitle">
                            <i class="fas fa-plus-circle" style="color: var(--primary);"></i>
                            New Vision
                        </h3>
                        <button class="modal-close-btn" id="inspirationModalClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="inspirationForm" class="inspiration-form">
                            <div class="form-group">
                                <label for="inspirationTitleInput">
                                    Vision Title <span class="required">*</span>
                                </label>
                                <input type="text" id="inspirationTitleInput" class="form-control" 
                                       placeholder="What is your vision?" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="inspirationDescriptionInput">Description</label>
                                <textarea id="inspirationDescriptionInput" class="form-control" rows="2" 
                                          placeholder="Describe your vision..."></textarea>
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group" style="flex: 1;">
                                    <label for="inspirationCategoryInput">Category</label>
                                    <select id="inspirationCategoryInput" class="form-control">
                                        ${Object.keys(this.categoryIcons).map(cat => `
                                            <option value="${cat}">${this.getCategoryIcon(cat)} ${cat}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label for="inspirationColorInput">Color</label>
                                    <input type="color" id="inspirationColorInput" class="form-control" 
                                           value="#6C5CE7" style="padding: 2px; height: 42px;">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="inspirationIconInput">Font Awesome Icon</label>
                                <div class="icon-input-wrapper">
                                    <span class="icon-preview" id="iconPreview">
                                        <i class="fas fa-star"></i>
                                    </span>
                                    <input type="text" id="inspirationIconInput" class="form-control" 
                                           value="fa-star" placeholder="fa-star, fa-heart, fa-rocket...">
                                </div>
                                <small class="form-hint">Enter a Font Awesome icon class (e.g., fa-star, fa-heart)</small>
                            </div>
                            
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="inspirationFavoriteInput">
                                    <span>? Mark as Favorite</span>
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost" id="inspirationModalCancelBtn">Cancel</button>
                        <button class="btn btn-primary" id="inspirationModalSaveBtn">
                            <i class="fas fa-save"></i> 
                            <span id="inspirationModalSaveText">Add Vision</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderDetailsModal() {
        return `
            <div id="inspirationDetailsModal" class="modal" style="display:none;">
                <div class="modal-overlay"></div>
                <div class="modal-content glass-card modal-details">
                    <div class="modal-header">
                        <h3 class="modal-title" id="inspirationDetailsTitle">
                            <i class="fas fa-info-circle" style="color: var(--primary);"></i>
                            Vision Details
                        </h3>
                        <button class="modal-close-btn" id="inspirationDetailsClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" id="inspirationDetailsBody">
                        <!-- Details will be rendered here -->
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost" id="inspirationDetailsCloseBtn">Close</button>
                    </div>
                </div>
            </div>
        `;
    }

    renderDeleteModal() {
        return `
            <div id="inspirationDeleteModal" class="modal" style="display:none;">
                <div class="modal-overlay"></div>
                <div class="modal-content glass-card" style="max-width: 450px;">
                    <div class="modal-header" style="border-bottom: none; padding-bottom: 0;">
                        <h3 class="modal-title" style="color: var(--danger);">
                            <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
                            Delete Vision
                        </h3>
                        <button class="modal-close-btn" id="inspirationDeleteClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" style="text-align: center; padding: 30px 20px;">
                        <div style="font-size: 4rem; margin-bottom: 16px;">???</div>
                        <h4 style="margin-bottom: 8px; color: var(--dark);">Are you sure?</h4>
                        <p style="color: var(--gray); margin-bottom: 20px;">
                            This action cannot be undone. This will permanently delete this vision.
                        </p>
                        <div id="inspirationDeletePreview" style="background: rgba(0,0,0,0.03); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                            <p style="margin: 0; font-weight: 500;" id="inspirationDeleteTitle">Loading...</p>
                        </div>
                        <div style="display: flex; gap: 12px; justify-content: center;">
                            <button class="btn btn-ghost" id="inspirationDeleteCancelBtn">Cancel</button>
                            <button class="btn btn-danger" id="inspirationDeleteConfirmBtn">
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
            <div id="inspirationToast" class="vision-toast">
                <div class="toast-icon">
                    <i class="fas fa-check-circle"></i>
                </div>
                <div class="toast-content">
                    <span class="toast-title">Success</span>
                    <span class="toast-message" id="inspirationToastMessage">Vision added!</span>
                </div>
                <button class="toast-close-btn" id="toastCloseBtn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }

    // ============ UTILITY METHODS ============

    getCategoryIcon(category) {
        return this.categoryIcons[category] || 'fa-star';
    }

    getCategoryColor(category) {
        return this.categoryColors[category] || '#6C5CE7';
    }

    getSortLabel(sort) {
        const labels = {
            'newest': 'Newest',
            'oldest': 'Oldest',
            'favorites': 'Favorites',
            'alphabetical': 'A-Z',
            'category': 'Category'
        };
        return labels[sort] || sort;
    }

    formatDate(dateString) {
        if (!dateString) return 'Recent';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Recent';
            return date.toLocaleDateString('en-US', { 
                year: 'numeric',
                month: 'short', 
                day: 'numeric'
            });
        } catch (e) {
            return 'Recent';
        }
    }

    // ============ FILTERING ============

    getFilteredImages() {
        let filtered = [...this.images];
        
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(i => i.category === this.currentCategory);
        }
        
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(i => 
                i.title.toLowerCase().includes(query) ||
                i.description.toLowerCase().includes(query) ||
                i.category.toLowerCase().includes(query) ||
                (i.tags && i.tags.some(t => t.toLowerCase().includes(query)))
            );
        }
        
        switch (this.currentSort) {
            case 'newest':
                filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'favorites':
                filtered.sort((a, b) => (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0));
                break;
            case 'alphabetical':
                filtered.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'category':
                filtered.sort((a, b) => a.category.localeCompare(b.category));
                break;
            default:
                break;
        }
        
        return filtered;
    }

    applyFilters() {
        const container = document.getElementById('inspirationGrid');
        const filtered = this.getFilteredImages();
        container.innerHTML = this.renderImages(filtered);
        this.updateFilterStats(filtered.length);
        this.animateCards();
        this.addFloatingEffects();
    }

    updateFilterStats(count) {
        const statsEl = document.querySelector('.inspiration-filter-stats');
        if (statsEl) {
            const tags = [];
            if (this.searchQuery) {
                tags.push(`<span class="filter-tag"><i class="fas fa-search"></i> "${this.searchQuery}"</span>`);
            }
            if (this.currentCategory !== 'all') {
                tags.push(`<span class="filter-tag">${this.getCategoryIcon(this.currentCategory)} ${this.currentCategory}</span>`);
            }
            if (this.currentSort !== 'newest') {
                tags.push(`<span class="filter-tag">Sort: ${this.getSortLabel(this.currentSort)}</span>`);
            }
            
            statsEl.innerHTML = `
                <span id="filterCount">${count} vision${count !== 1 ? 's' : ''}</span>
                ${tags.join(' ')}
            `;
        }
    }

    // ============ QUOTE ROTATION ============

    changeQuote(direction) {
        if (direction === 0) {
            // Random quote
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * this.quotes.length);
            } while (newIndex === this.currentQuoteIndex && this.quotes.length > 1);
            this.currentQuoteIndex = newIndex;
        } else {
            this.currentQuoteIndex = (this.currentQuoteIndex + direction + this.quotes.length) % this.quotes.length;
        }
        
        this.updateQuoteDisplay();
    }

    updateQuoteDisplay() {
        const quoteElement = document.getElementById('inspirationDailyQuote');
        const authorElement = document.querySelector('.daily-author');
        const categoryElement = document.querySelector('.daily-category');
        const quote = this.quotes[this.currentQuoteIndex];
        
        if (quoteElement && authorElement) {
            // Animate out
            quoteElement.style.opacity = '0';
            authorElement.style.opacity = '0';
            if (categoryElement) categoryElement.style.opacity = '0';
            
            setTimeout(() => {
                quoteElement.textContent = `"${quote.text}"`;
                authorElement.textContent = `— ${quote.author}`;
                if (categoryElement && quote.category) {
                    categoryElement.textContent = quote.category;
                    categoryElement.style.display = 'inline-block';
                } else if (categoryElement) {
                    categoryElement.style.display = 'none';
                }
                
                // Animate in
                quoteElement.style.opacity = '1';
                authorElement.style.opacity = '1';
                if (categoryElement) categoryElement.style.opacity = '1';
            }, 300);
        }
    }

    startQuoteRotation() {
        // Clear existing interval
        if (this.quoteRotationInterval) {
            clearInterval(this.quoteRotationInterval);
        }
        
        // Start new interval
        this.quoteRotationInterval = setInterval(() => {
            this.changeQuote(1);
        }, 15000);
    }

    // ============ MODAL OPERATIONS ============

    showAddVisionModal() {
        this.editingImageId = null;
        document.getElementById('inspirationModalTitle').innerHTML = `
            <i class="fas fa-plus-circle" style="color: var(--success);"></i>
            Add New Vision
        `;
        document.getElementById('inspirationModalSaveText').textContent = 'Add Vision';
        
        document.getElementById('inspirationTitleInput').value = '';
        document.getElementById('inspirationDescriptionInput').value = '';
        document.getElementById('inspirationCategoryInput').value = 'Dreams';
        document.getElementById('inspirationColorInput').value = '#6C5CE7';
        document.getElementById('inspirationIconInput').value = 'fa-star';
        document.getElementById('inspirationFavoriteInput').checked = false;
        
        this.updateIconPreview('fa-star');
        
        this.openModal('inspirationModal');
        setTimeout(() => {
            document.getElementById('inspirationTitleInput').focus();
        }, 300);
    }

    showEditVisionModal(id) {
        const image = this.images.find(i => i.id === id);
        if (!image) return;
        
        this.editingImageId = id;
        document.getElementById('inspirationModalTitle').innerHTML = `
            <i class="fas fa-pencil-alt" style="color: var(--primary);"></i>
            Edit Vision
        `;
        document.getElementById('inspirationModalSaveText').textContent = 'Update Vision';
        
        document.getElementById('inspirationTitleInput').value = image.title;
        document.getElementById('inspirationDescriptionInput').value = image.description || '';
        document.getElementById('inspirationCategoryInput').value = image.category;
        document.getElementById('inspirationColorInput').value = image.color;
        document.getElementById('inspirationIconInput').value = image.icon;
        document.getElementById('inspirationFavoriteInput').checked = image.isFavorite;
        
        this.updateIconPreview(image.icon);
        
        this.openModal('inspirationModal');
        setTimeout(() => {
            document.getElementById('inspirationTitleInput').focus();
        }, 300);
    }

    closeVisionModal() {
        this.closeModal('inspirationModal');
        this.editingImageId = null;
    }

    closeDetailsModal() {
        this.closeModal('inspirationDetailsModal');
        this.viewingImageId = null;
    }

    closeDeleteModal() {
        this.closeModal('inspirationDeleteModal');
        this.deleteTargetId = null;
    }

    openModal(id) {
        const modal = document.getElementById(id);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
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
        const image = this.images.find(i => i.id === id);
        if (!image) return;
        
        this.deleteTargetId = id;
        document.getElementById('inspirationDeleteTitle').textContent = `"${image.title}"`;
        this.openModal('inspirationDeleteModal');
    }

    async confirmDelete() {
        if (!this.deleteTargetId) return;
        
        const result = await this.apiRequest(`/images/${this.deleteTargetId}`, 'DELETE');
        if (result) {
            this.closeDeleteModal();
            await this.loadImages();
            this.applyFilters();
            this.showToast('??? Vision deleted successfully', 'warning');
        }
    }

    // ============ SAVE VISION ============

    async saveVision() {
        const title = document.getElementById('inspirationTitleInput').value.trim();
        const description = document.getElementById('inspirationDescriptionInput').value.trim();
        const category = document.getElementById('inspirationCategoryInput').value;
        const color = document.getElementById('inspirationColorInput').value;
        const icon = document.getElementById('inspirationIconInput').value.trim() || 'fa-star';
        const isFavorite = document.getElementById('inspirationFavoriteInput').checked;

        if (!title) {
            const input = document.getElementById('inspirationTitleInput');
            input.style.borderColor = 'var(--danger)';
            input.classList.add('shake');
            this.showToast('?? Please enter a vision title', 'error');
            setTimeout(() => {
                input.style.borderColor = '';
                input.classList.remove('shake');
            }, 2000);
            return;
        }

        // Validate icon format
        if (!icon.startsWith('fa-')) {
            const input = document.getElementById('inspirationIconInput');
            input.style.borderColor = 'var(--danger)';
            input.classList.add('shake');
            this.showToast('?? Please enter a valid Font Awesome icon (e.g., fa-star)', 'error');
            setTimeout(() => {
                input.style.borderColor = '';
                input.classList.remove('shake');
            }, 2000);
            return;
        }

        const visionData = {
            title: title,
            description: description || 'A beautiful dream worth pursuing',
            category: category,
            color: color,
            icon: icon,
            is_favorite: isFavorite
        };

        let result;
        if (this.editingImageId) {
            result = await this.apiRequest(`/images/${this.editingImageId}`, 'PUT', visionData);
            if (result) {
                this.showToast('? Vision updated successfully!', 'success');
            }
        } else {
            result = await this.apiRequest('/images', 'POST', visionData);
            if (result) {
                this.showToast('? New vision added to your inspiration board!', 'success');
                this.celebrate();
            }
        }

        if (result) {
            this.closeVisionModal();
            await this.loadImages();
            this.applyFilters();
        }
    }

    updateIconPreview(icon) {
        const preview = document.getElementById('iconPreview');
        if (preview) {
            preview.innerHTML = `<i class="fas ${icon}"></i>`;
        }
    }

    // ============ VISION ACTIONS ============

    async deleteVision(id) {
        this.showDeleteModal(id);
    }

    async toggleFavorite(id) {
        const image = this.images.find(i => i.id === id);
        if (!image) return;
        
        const newFavorite = !image.isFavorite;
        const result = await this.apiRequest(`/images/${id}`, 'PUT', {
            is_favorite: newFavorite
        });
        
        if (result) {
            await this.loadImages();
            this.applyFilters();
            this.showToast(newFavorite ? '? Added to favorites!' : '? Removed from favorites', 'info');
        }
    }

    async shareVision(id) {
        const image = this.images.find(i => i.id === id);
        if (!image) return;

        const shareText = `?? ${image.title}\n\n${image.description || 'No description'}\n\n?? ${image.category}\n${image.isFavorite ? '? Favorite Vision' : ''}\n\n? My vision for the future! #Inspiration #Dreams #Goals`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: image.title,
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
                this.showToast('?? Vision copied to clipboard!', 'success');
            } catch (err) {
                // Fallback
                const textarea = document.createElement('textarea');
                textarea.value = shareText;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                this.showToast('?? Vision copied to clipboard!', 'success');
            }
        }
    }

    // ============ VIEW DETAILS ============

    viewDetails(id) {
        const image = this.images.find(i => i.id === id);
        if (!image) return;
        
        this.viewingImageId = id;
        const color = image.color || '#6C5CE7';
        const icon = image.icon || 'fa-star';

        const body = document.getElementById('inspirationDetailsBody');
        body.innerHTML = `
            <div class="vision-details-content">
                <div class="vision-details-header">
                    <div class="vision-details-icon" style="background: ${color}20; color: ${color};">
                        <i class="fas ${icon}"></i>
                    </div>
                    <h2 class="vision-details-title">${image.title}</h2>
                    <div class="vision-details-badges">
                        <span class="vision-details-category" style="background: ${color}20; color: ${color};">
                            <i class="fas ${this.getCategoryIcon(image.category)}"></i> ${image.category}
                        </span>
                        ${image.isFavorite ? '<span class="vision-details-favorite">? Favorite</span>' : ''}
                    </div>
                </div>

                <div class="vision-details-description">
                    <p>${image.description || 'No description provided.'}</p>
                </div>

                <div class="vision-details-grid">
                    <div class="vision-details-item">
                        <span class="vision-details-label"><i class="fas fa-palette"></i> Color</span>
                        <span class="vision-details-value">
                            <span style="display: inline-block; width: 20px; height: 20px; border-radius: 50%; background: ${color}; vertical-align: middle; margin-right: 8px;"></span>
                            ${color}
                        </span>
                    </div>
                    <div class="vision-details-item">
                        <span class="vision-details-label"><i class="fas fa-icon"></i> Icon</span>
                        <span class="vision-details-value">
                            <i class="fas ${icon}" style="color: ${color};"></i> ${icon}
                        </span>
                    </div>
                    <div class="vision-details-item">
                        <span class="vision-details-label"><i class="fas fa-calendar-plus"></i> Added</span>
                        <span class="vision-details-value">${this.formatDate(image.createdAt)}</span>
                    </div>
                    ${image.updatedAt ? `
                        <div class="vision-details-item">
                            <span class="vision-details-label"><i class="fas fa-calendar-edit"></i> Updated</span>
                            <span class="vision-details-value">${this.formatDate(image.updatedAt)}</span>
                        </div>
                    ` : ''}
                    ${image.tags && image.tags.length > 0 ? `
                        <div class="vision-details-item" style="grid-column: 1 / -1;">
                            <span class="vision-details-label"><i class="fas fa-tags"></i> Tags</span>
                            <span class="vision-details-value">
                                ${image.tags.map(tag => 
                                    `<span class="vision-tag" style="background: ${color}20; color: ${color};">#${tag}</span>`
                                ).join(' ')}
                            </span>
                        </div>
                    ` : ''}
                </div>

                <div class="vision-details-actions">
                    <button class="btn btn-outline btn-sm inspiration-toggle-favorite" data-id="${image.id}">
                        <i class="fas ${image.isFavorite ? 'fa-star' : 'fa-star-o'}"></i>
                        ${image.isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                    </button>
                    <button class="btn btn-primary btn-sm inspiration-edit" data-id="${image.id}">
                        <i class="fas fa-pencil-alt"></i> Edit
                    </button>
                    <button class="btn btn-outline btn-sm inspiration-share" data-id="${image.id}">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                </div>
            </div>
        `;

        // Add event listeners for actions inside details modal
        body.querySelector('.inspiration-toggle-favorite')?.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            this.closeDetailsModal();
            this.toggleFavorite(id);
        });

        body.querySelector('.inspiration-edit')?.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            this.closeDetailsModal();
            this.showEditVisionModal(id);
        });

        body.querySelector('.inspiration-share')?.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            this.closeDetailsModal();
            this.shareVision(id);
        });

        this.openModal('inspirationDetailsModal');
    }

    // ============ CELEBRATION ============

    celebrate() {
        const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#A29BFE', '#FD79A8', '#6C5CE7', '#00B894'];
        
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
    }

    // ============ UI HELPERS ============

    animateCards() {
        const cards = document.querySelectorAll('.stagger-item');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, 100 + index * 60);
        });
    }

    addFloatingEffects() {
        document.querySelectorAll('.inspiration-icon-wrapper').forEach((wrapper, index) => {
            const delay = index * 0.15;
            wrapper.style.animationDelay = `${delay}s`;
        });
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('inspirationToast');
        const toastMessage = document.getElementById('inspirationToastMessage');
        const toastIcon = toast?.querySelector('.toast-icon i');
        const toastTitle = toast?.querySelector('.toast-title');

        if (toast && toastMessage) {
            const configs = {
                'success': { icon: 'fa-check-circle', color: '#00B894', title: 'Success' },
                'error': { icon: 'fa-exclamation-circle', color: '#FF6B6B', title: 'Error' },
                'warning': { icon: 'fa-exclamation-triangle', color: '#FDCB6E', title: 'Warning' },
                'info': { icon: 'fa-info-circle', color: '#6C5CE7', title: 'Info' }
            };

            const config = configs[type] || configs.success;
            
            if (toastIcon) {
                toastIcon.className = `fas ${config.icon}`;
                toastIcon.style.color = config.color;
            }
            
            if (toastTitle) {
                toastTitle.textContent = config.title;
                toastTitle.style.color = config.color;
            }

            toastMessage.textContent = message;
            toast.className = 'vision-toast show';
            toast.style.borderLeftColor = config.color;

            clearTimeout(this.toastTimeout);
            this.toastTimeout = setTimeout(() => {
                toast.classList.remove('show');
            }, 3500);
        } else if (window.showToast) {
            window.showToast('Inspiration', message, type, 2500);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }

    // ============ EVENT LISTENERS ============

    setupEventListeners() {
        // Add Vision button
        document.getElementById('inspirationAddBtn')?.addEventListener('click', () => {
            this.showAddVisionModal();
        });

        document.getElementById('inspirationEmptyAddBtn')?.addEventListener('click', () => {
            this.showAddVisionModal();
        });

        document.getElementById('inspirationFabBtn')?.addEventListener('click', () => {
            this.showAddVisionModal();
        });

        // Search
        const searchInput = document.getElementById('inspirationSearchInput');
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
        document.querySelectorAll('#inspirationCategoryFilters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#inspirationCategoryFilters .filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentCategory = btn.dataset.category;
                this.applyFilters();
            });
        });

        // Sort select
        document.getElementById('inspirationSortSelect')?.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.applyFilters();
        });

        // Clear filters
        document.getElementById('clearFiltersBtn')?.addEventListener('click', () => {
            this.currentCategory = 'all';
            this.currentSort = 'newest';
            this.searchQuery = '';
            
            if (searchInput) searchInput.value = '';
            if (clearBtn) clearBtn.style.display = 'none';
            
            document.querySelectorAll('#inspirationCategoryFilters .filter-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('#inspirationCategoryFilters .filter-btn[data-category="all"]')?.classList.add('active');
            document.getElementById('inspirationSortSelect').value = 'newest';
            
            this.applyFilters();
            this.showToast('Filters reset', 'info');
        });

        // Quote controls
        document.getElementById('inspirationPrevQuote')?.addEventListener('click', () => this.changeQuote(-1));
        document.getElementById('inspirationNextQuote')?.addEventListener('click', () => this.changeQuote(1));
        document.getElementById('inspirationRefreshQuote')?.addEventListener('click', () => this.changeQuote(0));

        // Modal close buttons
        document.getElementById('inspirationModalClose')?.addEventListener('click', () => this.closeVisionModal());
        document.getElementById('inspirationModalCancelBtn')?.addEventListener('click', () => this.closeVisionModal());
        document.getElementById('inspirationDetailsClose')?.addEventListener('click', () => this.closeDetailsModal());
        document.getElementById('inspirationDetailsCloseBtn')?.addEventListener('click', () => this.closeDetailsModal());
        document.getElementById('inspirationDeleteClose')?.addEventListener('click', () => this.closeDeleteModal());
        document.getElementById('inspirationDeleteCancelBtn')?.addEventListener('click', () => this.closeDeleteModal());

        // Delete confirm
        document.getElementById('inspirationDeleteConfirmBtn')?.addEventListener('click', () => this.confirmDelete());

        // Save vision
        document.getElementById('inspirationModalSaveBtn')?.addEventListener('click', () => this.saveVision());

        // Toast close
        document.getElementById('toastCloseBtn')?.addEventListener('click', () => {
            const toast = document.getElementById('inspirationToast');
            if (toast) toast.classList.remove('show');
        });

        // Icon preview update
        document.getElementById('inspirationIconInput')?.addEventListener('input', (e) => {
            this.updateIconPreview(e.target.value.trim());
        });

        // Click outside modals
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    const id = modal.id;
                    if (id === 'inspirationModal') this.closeVisionModal();
                    else if (id === 'inspirationDetailsModal') this.closeDetailsModal();
                    else if (id === 'inspirationDeleteModal') this.closeDeleteModal();
                }
            });
        });

        // Vision actions (event delegation)
        document.querySelector('#inspirationGrid')?.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.inspiration-edit');
            const deleteBtn = e.target.closest('.inspiration-delete');
            const favoriteBtn = e.target.closest('.inspiration-toggle-favorite');
            const viewBtn = e.target.closest('.inspiration-view-details');
            const shareBtn = e.target.closest('.inspiration-share');
            
            if (editBtn) {
                const id = parseInt(editBtn.dataset.id);
                this.showEditVisionModal(id);
            }
            
            if (deleteBtn) {
                const id = parseInt(deleteBtn.dataset.id);
                this.deleteVision(id);
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
                this.shareVision(id);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+K or / to focus search
            if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && !e.ctrlKey && !e.metaKey)) {
                e.preventDefault();
                const searchInput = document.getElementById('inspirationSearchInput');
                if (searchInput) searchInput.focus();
            }
            
            // 'I' to add new vision
            if (e.key === 'i' || e.key === 'I') {
                if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                    const modal = document.getElementById('inspirationModal');
                    if (modal && modal.style.display === 'none') {
                        e.preventDefault();
                        this.showAddVisionModal();
                    }
                }
            }
            
            // Arrow keys for quotes
            if (e.key === 'ArrowRight') {
                const modal = document.getElementById('inspirationModal');
                if (modal && modal.style.display === 'none') {
                    e.preventDefault();
                    document.getElementById('inspirationNextQuote')?.click();
                }
            }
            if (e.key === 'ArrowLeft') {
                const modal = document.getElementById('inspirationModal');
                if (modal && modal.style.display === 'none') {
                    e.preventDefault();
                    document.getElementById('inspirationPrevQuote')?.click();
                }
            }
            
            // Escape to close modals
            if (e.key === 'Escape') {
                const modals = ['inspirationModal', 'inspirationDetailsModal', 'inspirationDeleteModal'];
                for (const id of modals) {
                    const modal = document.getElementById(id);
                    if (modal && modal.style.display !== 'none') {
                        if (id === 'inspirationModal') this.closeVisionModal();
                        else if (id === 'inspirationDetailsModal') this.closeDetailsModal();
                        else if (id === 'inspirationDeleteModal') this.closeDeleteModal();
                        break;
                    }
                }
            }
        });

        // Make instance available globally
        window.inspirationInstance = this;
    }
}

export default Inspiration;
