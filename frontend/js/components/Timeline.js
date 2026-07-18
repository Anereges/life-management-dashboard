// js/components/Timeline.js
export class Timeline {
    constructor() {
        this.container = null;
        this.currentFilter = 'all';
        this.currentYear = 'all';
        this.currentSort = 'newest';
        this.searchQuery = '';
        this.editingEventId = null;
        this.viewingEventId = null;
        this.events = [];
        this.apiBase = 'https://life-management-api.onrender.com/api/timeline';
        this.token = localStorage.getItem('access_token');
        this.deleteTargetId = null;
        this.formData = {};
    }

    async loadEvents() {
        try {
            const response = await fetch(`${this.apiBase}/events`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.events = data.map(e => this.transformEvent(e));
                console.log('? Timeline events loaded:', this.events);
            } else if (response.status === 401) {
                window.location.href = '/login.html';
            } else {
                console.error('Failed to load events:', await response.text());
                this.events = [];
            }
        } catch (error) {
            console.error('Error loading events:', error);
            this.events = [];
        }
    }

    transformEvent(backendEvent) {
        const date = new Date(backendEvent.date);
        const month = date.toLocaleDateString('en-US', { month: 'long' });
        const year = date.getFullYear().toString();
        
        return {
            id: backendEvent.id,
            title: backendEvent.title,
            date: `${month} ${year}`,
            description: backendEvent.description || '',
            type: backendEvent.event_type || 'personal',
            icon: this.getIconForType(backendEvent.event_type || 'personal'),
            year: year,
            month: month,
            isHighlight: backendEvent.is_highlight || false,
            createdAt: backendEvent.created_at || new Date().toISOString(),
            location: backendEvent.location || '',
            media_url: backendEvent.media_url || null,
            media_type: backendEvent.media_type || null
        };
    }

    transformToBackend(event) {
        // Parse date from month year format
        const dateStr = `${event.month} 1, ${event.year}`;
        const date = new Date(dateStr);
        
        return {
            title: event.title,
            description: event.description || '',
            date: date.toISOString().split('T')[0],
            event_type: event.type || 'personal',
            location: event.location || '',
            is_highlight: event.isHighlight || false,
            media_url: event.media_url || null,
            media_type: event.media_type || null
        };
    }

    getIconForType(type) {
        const icons = {
            'career': '??',
            'achievement': '??',
            'education': '??',
            'personal': '??',
            'life_event': '??'
        };
        return icons[type] || '??';
    }

    getColor(type) {
        const colors = {
            'career': '#6C5CE7',
            'achievement': '#FFD700',
            'education': '#00CEC9',
            'personal': '#FF6B6B',
            'life_event': '#A29BFE'
        };
        return colors[type] || '#6C5CE7';
    }

    getTimeAgo(date) {
        if (!date) return 'Recently';
        const diff = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 7) return `${diff} days ago`;
        if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
        if (diff < 365) return `${Math.floor(diff / 30)} months ago`;
        return `${Math.floor(diff / 365)} years ago`;
    }

    async render() {
        await this.loadEvents();
        
        this.container = document.getElementById('page-content');
        this.container.innerHTML = `
            <div class="timeline-container">
                <!-- Animated Background -->
                <div class="timeline-bg-animation">
                    <div class="timeline-orb timeline-orb-1"></div>
                    <div class="timeline-orb timeline-orb-2"></div>
                    <div class="timeline-orb timeline-orb-3"></div>
                    <div class="timeline-particles" id="timelineParticles"></div>
                </div>

                <!-- Header -->
                <div class="timeline-header glass-card fade-in-up">
                    <div class="timeline-header-content">
                        <div>
                            <div class="timeline-badge">
                                <span class="timeline-badge-icon">??</span>
                                <span class="timeline-badge-text">Life Timeline</span>
                            </div>
                            <h1 class="timeline-title">Your <span class="timeline-title-highlight">Journey</span> So Far</h1>
                            <p class="timeline-subtitle">Every milestone tells a story. Every memory shapes your future.</p>
                        </div>
                        <div class="timeline-header-actions">
                            <button class="btn btn-primary btn-glow" id="timelineAddEventBtn">
                                <i class="fas fa-plus-circle"></i>
                                <span>Add Milestone</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Stats -->
                    <div class="timeline-stats">
                        <div class="timeline-stat">
                            <span class="timeline-stat-number">${this.events.length}</span>
                            <span class="timeline-stat-label">Total Milestones</span>
                        </div>
                        <div class="timeline-stat-divider"></div>
                        <div class="timeline-stat">
                            <span class="timeline-stat-number" style="color: var(--success);">${this.events.filter(e => e.isHighlight).length}</span>
                            <span class="timeline-stat-label">?? Highlights</span>
                        </div>
                        <div class="timeline-stat-divider"></div>
                        <div class="timeline-stat">
                            <span class="timeline-stat-number" style="color: var(--primary-light);">${[...new Set(this.events.map(e => e.year))].length}</span>
                            <span class="timeline-stat-label">Years</span>
                        </div>
                        <div class="timeline-stat-divider"></div>
                        <div class="timeline-stat">
                            <span class="timeline-stat-number" style="color: var(--warning);">${[...new Set(this.events.map(e => e.type))].length}</span>
                            <span class="timeline-stat-label">Categories</span>
                        </div>
                    </div>
                </div>

                <!-- Search & Filters -->
                <div class="timeline-controls glass-card" style="animation-delay: 0.15s;">
                    <div class="search-bar">
                        <i class="fas fa-search"></i>
                        <input type="text" id="timelineSearchInput" placeholder="Search milestones, descriptions, or categories..." class="search-input">
                    </div>
                    <div class="timeline-filters">
                        <div class="filter-group">
                            <label>Category</label>
                            <div class="filter-buttons" id="timelineCategoryFilters">
                                <button class="filter-btn active" data-category="all">All</button>
                                ${[...new Set(this.events.map(e => e.type))].map(type => `
                                    <button class="filter-btn" data-category="${type}">${type.charAt(0).toUpperCase() + type.slice(1)}</button>
                                `).join('')}
                            </div>
                        </div>
                        <div class="filter-group">
                            <label>Year</label>
                            <div class="filter-buttons" id="timelineYearFilters">
                                <button class="filter-btn active" data-year="all">All</button>
                                ${[...new Set(this.events.map(e => e.year))].sort().reverse().map(year => `
                                    <button class="filter-btn" data-year="${year}">${year}</button>
                                `).join('')}
                            </div>
                        </div>
                        <div class="filter-group">
                            <label>Sort</label>
                            <div class="filter-buttons" id="timelineSortFilters">
                                <button class="filter-btn active" data-sort="newest">Newest</button>
                                <button class="filter-btn" data-sort="oldest">Oldest</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Timeline -->
                <div id="timelineContainer" class="timeline">
                    ${this.renderTimeline(this.getFilteredEvents())}
                </div>

                <!-- Add/Edit Event Modal -->
                <div id="timelineModal" class="modal" style="display:none;">
                    <div class="modal-content glass-card">
                        <div class="modal-header">
                            <h3 class="modal-title" id="timelineModalTitle">
                                <i class="fas fa-plus-circle" style="color: var(--primary);"></i>
                                New Milestone
                            </h3>
                            <button class="modal-close-btn" id="timelineModalClose">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label>Milestone Title *</label>
                                <input type="text" id="timelineTitleInput" class="form-control" placeholder="What milestone did you achieve?">
                            </div>
                            <div class="form-group">
                                <label>Description</label>
                                <textarea id="timelineDescriptionInput" class="form-control" rows="3" placeholder="Tell the story behind this milestone..."></textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group" style="flex: 1;">
                                    <label>Category</label>
                                    <select id="timelineTypeInput" class="form-control">
                                        <option value="career">?? Career</option>
                                        <option value="achievement">?? Achievement</option>
                                        <option value="education">?? Education</option>
                                        <option value="personal">?? Personal</option>
                                        <option value="life_event">?? Life Event</option>
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label>Icon (emoji)</label>
                                    <input type="text" id="timelineIconInput" class="form-control" value="??" placeholder="??">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group" style="flex: 1;">
                                    <label>Month</label>
                                    <select id="timelineMonthInput" class="form-control">
                                        ${['January','February','March','April','May','June','July','August','September','October','November','December'].map(month => `
                                            <option value="${month}" ${month === new Date().toLocaleDateString('en-US', { month: 'long' }) ? 'selected' : ''}>${month}</option>
                                        `).join('')}
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label>Year</label>
                                    <input type="number" id="timelineYearInput" class="form-control" value="${new Date().getFullYear()}" min="2000" max="${new Date().getFullYear() + 1}">
                                </div>
                            </div>
                            <div class="form-group">
                                <label style="display: flex; align-items: center; gap: 8px;">
                                    <input type="checkbox" id="timelineHighlightInput">
                                    <span>?? Mark as Highlight</span>
                                </label>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-ghost" id="timelineModalCancelBtn">Cancel</button>
                            <button class="btn btn-primary" id="timelineModalSaveBtn">
                                <i class="fas fa-save"></i> <span id="timelineModalSaveText">Add Milestone</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- View Details Modal -->
                <div id="timelineDetailsModal" class="modal" style="display:none;">
                    <div class="modal-content glass-card modal-details">
                        <div class="modal-header">
                            <h3 class="modal-title" id="timelineDetailsTitle">
                                <i class="fas fa-info-circle" style="color: var(--primary);"></i>
                                Milestone Details
                            </h3>
                            <button class="modal-close-btn" id="timelineDetailsClose">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body" id="timelineDetailsBody">
                            <!-- Details will be rendered here -->
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" id="timelineDetailsCloseBtn">Close</button>
                        </div>
                    </div>
                </div>

                <!-- Delete Confirmation Modal -->
                <div id="timelineDeleteModal" class="modal" style="display:none;">
                    <div class="modal-content glass-card" style="max-width: 450px;">
                        <div class="modal-header" style="border-bottom: none; padding-bottom: 0;">
                            <h3 class="modal-title" style="color: var(--danger);">
                                <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
                                Delete Milestone
                            </h3>
                            <button class="modal-close-btn" id="timelineDeleteClose">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body" style="text-align: center; padding: 30px 20px;">
                            <div style="font-size: 4rem; margin-bottom: 16px;">???</div>
                            <h4 style="margin-bottom: 8px; color: var(--dark);">Are you sure?</h4>
                            <p style="color: var(--gray); margin-bottom: 20px;">
                                This action cannot be undone. This will permanently delete this milestone.
                            </p>
                            <div id="timelineDeletePreview" style="background: rgba(0,0,0,0.03); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                                <p style="margin: 0; font-weight: 500;" id="timelineDeleteTitle">Loading...</p>
                            </div>
                            <div style="display: flex; gap: 12px; justify-content: center;">
                                <button class="btn btn-ghost" id="timelineDeleteCancelBtn">Cancel</button>
                                <button class="btn btn-danger" id="timelineDeleteConfirmBtn">
                                    <i class="fas fa-trash"></i> Delete Permanently
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Toast Notification -->
                <div id="timelineToast" class="timeline-toast">
                    <i class="fas fa-check-circle" style="color: var(--success);"></i>
                    <span id="timelineToastMessage">Milestone added!</span>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.animateCards();
        this.createParticles();
        return this.container;
    }

    renderTimeline(events) {
        if (events.length === 0) {
            return `
                <div class="empty-state glass-card" style="grid-column: 1 / -1; text-align: center; padding: 80px 40px;">
                    <div class="empty-state-icon">??</div>
                    <h3 class="empty-state-title">No Milestones Found</h3>
                    <p class="empty-state-subtitle">Start documenting your journey by adding your first milestone!</p>
                    <button class="btn btn-primary btn-glow" id="timelineEmptyAddBtn">
                        <i class="fas fa-plus-circle"></i>
                        Add Your First Milestone
                    </button>
                </div>
            `;
        }

        const groupedEvents = events.reduce((acc, event) => {
            if (!acc[event.year]) acc[event.year] = [];
            acc[event.year].push(event);
            return acc;
        }, {});

        const sortedYears = Object.keys(groupedEvents).sort((a, b) => {
            return this.currentSort === 'newest' ? b.localeCompare(a) : a.localeCompare(b);
        });

        return sortedYears.map((year, yearIndex) => `
            <div class="timeline-year-group stagger-item" style="animation-delay: ${yearIndex * 0.1}s">
                <div class="timeline-year-label">
                    <span class="year-badge">${year}</span>
                    <span class="year-line"></span>
                </div>
                <div class="timeline-events">
                    ${groupedEvents[year].map((event, index) => `
                        <div class="timeline-event-card glass-card" data-id="${event.id}" style="--event-color: ${this.getColor(event.type)}; animation-delay: ${(yearIndex * 0.1 + index * 0.05)}s;">
                            <div class="timeline-event-dot" style="background: ${this.getColor(event.type)};">
                                <span class="event-icon">${event.icon}</span>
                            </div>
                            <div class="timeline-event-content">
                                <div class="timeline-event-header">
                                    <div class="timeline-event-title-section">
                                        <h3 class="timeline-event-title">${event.title}</h3>
                                        ${event.isHighlight ? '<span class="highlight-badge">?? Highlight</span>' : ''}
                                    </div>
                                    <div class="timeline-event-actions">
                                        <button class="btn btn-ghost btn-sm timeline-toggle-highlight" data-id="${event.id}" title="Toggle Highlight">
                                            <i class="fas ${event.isHighlight ? 'fa-star' : 'fa-star-o'}" style="${event.isHighlight ? 'color: #FFD700;' : ''}"></i>
                                        </button>
                                        <button class="btn btn-ghost btn-sm timeline-edit-event" data-id="${event.id}" title="Edit Event">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn btn-ghost btn-sm timeline-delete-event" data-id="${event.id}" title="Delete Event">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </div>
                                <p class="timeline-event-description">${event.description}</p>
                                <div class="timeline-event-meta">
                                    <span class="event-date">
                                        <i class="fas fa-calendar-alt"></i> ${event.month} ${event.year}
                                    </span>
                                    <span class="event-type" style="background: ${this.getColor(event.type)}20; color: ${this.getColor(event.type)};">
                                        <i class="fas fa-tag"></i> ${event.type}
                                    </span>
                                    <span class="event-time-ago">
                                        <i class="fas fa-clock"></i> ${this.getTimeAgo(event.createdAt)}
                                    </span>
                                </div>
                                <div class="timeline-event-footer">
                                    <button class="btn btn-outline btn-sm timeline-view-details" data-id="${event.id}">
                                        <i class="fas fa-eye"></i> Details
                                    </button>
                                    <button class="btn btn-ghost btn-sm timeline-share-event" data-id="${event.id}">
                                        <i class="fas fa-share-alt"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    getFilteredEvents() {
        let filtered = [...this.events];
        
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(e => e.type === this.currentFilter);
        }
        
        if (this.currentYear !== 'all') {
            filtered = filtered.filter(e => e.year === this.currentYear);
        }
        
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(e => 
                e.title.toLowerCase().includes(query) ||
                e.description.toLowerCase().includes(query) ||
                e.type.toLowerCase().includes(query) ||
                e.month.toLowerCase().includes(query)
            );
        }
        
        filtered.sort((a, b) => {
            if (this.currentSort === 'newest') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            } else {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }
        });
        
        return filtered;
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
                window.location.href = '/login.html';
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

    // ============ SAVE FORM DATA ============

    saveFormData() {
        this.formData = {
            title: document.getElementById('timelineTitleInput')?.value || '',
            description: document.getElementById('timelineDescriptionInput')?.value || '',
            type: document.getElementById('timelineTypeInput')?.value || 'career',
            icon: document.getElementById('timelineIconInput')?.value || '??',
            month: document.getElementById('timelineMonthInput')?.value || '',
            year: document.getElementById('timelineYearInput')?.value || '',
            highlight: document.getElementById('timelineHighlightInput')?.checked || false
        };
    }

    // ============ EVENT MODAL FUNCTIONS ============

    showAddEventModal() {
        this.editingEventId = null;
        this.formData = {};
        document.getElementById('timelineModalTitle').innerHTML = `
            <i class="fas fa-plus-circle" style="color: var(--primary);"></i>
            New Milestone
        `;
        document.getElementById('timelineModalSaveText').textContent = 'Add Milestone';
        
        document.getElementById('timelineTitleInput').value = '';
        document.getElementById('timelineDescriptionInput').value = '';
        document.getElementById('timelineTypeInput').value = 'career';
        document.getElementById('timelineIconInput').value = '??';
        document.getElementById('timelineMonthInput').value = new Date().toLocaleDateString('en-US', { month: 'long' });
        document.getElementById('timelineYearInput').value = new Date().getFullYear();
        document.getElementById('timelineHighlightInput').checked = false;
        
        document.getElementById('timelineModal').style.display = 'block';
        setTimeout(() => {
            document.getElementById('timelineTitleInput').focus();
        }, 300);
    }

    showEditEventModal(id) {
        const event = this.events.find(e => e.id === id);
        if (!event) return;
        
        this.editingEventId = id;
        this.formData = {};
        document.getElementById('timelineModalTitle').innerHTML = `
            <i class="fas fa-edit" style="color: var(--primary);"></i>
            Edit Milestone
        `;
        document.getElementById('timelineModalSaveText').textContent = 'Update Milestone';
        
        document.getElementById('timelineTitleInput').value = event.title;
        document.getElementById('timelineDescriptionInput').value = event.description;
        document.getElementById('timelineTypeInput').value = event.type;
        document.getElementById('timelineIconInput').value = event.icon;
        document.getElementById('timelineMonthInput').value = event.month;
        document.getElementById('timelineYearInput').value = parseInt(event.year);
        document.getElementById('timelineHighlightInput').checked = event.isHighlight;
        
        document.getElementById('timelineModal').style.display = 'block';
        setTimeout(() => {
            document.getElementById('timelineTitleInput').focus();
        }, 300);
    }

    closeEventModal() {
        document.getElementById('timelineModal').style.display = 'none';
        this.editingEventId = null;
        this.formData = {};
    }

    closeDetailsModal() {
        document.getElementById('timelineDetailsModal').style.display = 'none';
        this.viewingEventId = null;
    }

    closeDeleteModal() {
        document.getElementById('timelineDeleteModal').style.display = 'none';
        this.deleteTargetId = null;
    }

    showDeleteModal(id) {
        const event = this.events.find(e => e.id === id);
        if (!event) return;
        
        this.deleteTargetId = id;
        document.getElementById('timelineDeleteTitle').textContent = event.title;
        document.getElementById('timelineDeleteModal').style.display = 'block';
    }

    async confirmDelete() {
        if (!this.deleteTargetId) return;
        
        const result = await this.apiRequest(`/events/${this.deleteTargetId}`, 'DELETE');
        if (result) {
            this.closeDeleteModal();
            await this.loadEvents();
            this.applyFilters();
            this.showToast('??? Milestone deleted', 'warning');
        }
    }

    async saveEvent() {
        this.saveFormData();
        
        const title = document.getElementById('timelineTitleInput').value.trim();
        const description = document.getElementById('timelineDescriptionInput').value.trim();
        const type = document.getElementById('timelineTypeInput').value;
        const icon = document.getElementById('timelineIconInput').value.trim() || '??';
        const month = document.getElementById('timelineMonthInput').value;
        const year = document.getElementById('timelineYearInput').value;
        const isHighlight = document.getElementById('timelineHighlightInput').checked;

        if (!title) {
            document.getElementById('timelineTitleInput').style.borderColor = 'var(--danger)';
            this.showToast('?? Please enter a milestone title', 'error');
            setTimeout(() => {
                document.getElementById('timelineTitleInput').style.borderColor = '';
            }, 2000);
            return;
        }

        const dateStr = `${month} 1, ${year}`;
        const date = new Date(dateStr);
        const formattedDate = date.toISOString().split('T')[0];

        const eventData = {
            title: title,
            description: description || '',
            event_type: type,
            date: formattedDate,
            is_highlight: isHighlight,
            location: ''
        };

        let result;
        if (this.editingEventId) {
            result = await this.apiRequest(`/events/${this.editingEventId}`, 'PUT', eventData);
            if (result) {
                this.showToast('? Milestone updated successfully!', 'success');
            }
        } else {
            result = await this.apiRequest('/events', 'POST', eventData);
            if (result) {
                this.showToast('?? New milestone added to your timeline!', 'success');
            }
        }

        if (result) {
            this.closeEventModal();
            await this.loadEvents();
            this.applyFilters();
        }
    }

    // ============ EVENT ACTIONS ============

    async deleteEvent(id) {
        this.showDeleteModal(id);
    }

    async toggleHighlight(id) {
        const event = this.events.find(e => e.id === id);
        if (!event) return;
        
        const newHighlight = !event.isHighlight;
        const result = await this.apiRequest(`/events/${id}`, 'PUT', {
            is_highlight: newHighlight
        });
        
        if (result) {
            await this.loadEvents();
            this.applyFilters();
            this.showToast(newHighlight ? '?? Marked as highlight!' : '? Removed from highlights');
        }
    }

    async shareEvent(id) {
        const event = this.events.find(e => e.id === id);
        if (!event) return;

        const shareText = `?? ${event.title}\n\n${event.description}\n\n?? ${event.month} ${event.year}\n??? ${event.type}\n${event.isHighlight ? '?? Highlight Event!' : ''}\n\n#Timeline #Milestone #Journey`;

        if (navigator.share) {
            navigator.share({
                title: event.title,
                text: shareText,
            }).catch(() => {});
        } else {
            navigator.clipboard?.writeText(shareText).then(() => {
                this.showToast('?? Milestone copied to clipboard!');
            }).catch(() => {
                prompt('Copy this milestone:', shareText);
            });
        }
    }

    // ============ VIEW DETAILS MODAL ============

    viewDetails(id) {
        const event = this.events.find(e => e.id === id);
        if (!event) return;
        
        this.viewingEventId = id;

        const body = document.getElementById('timelineDetailsBody');
        body.innerHTML = `
            <div class="event-details-content">
                <div class="event-details-header">
                    <div class="event-details-icon" style="font-size: 3rem; text-align: center; margin-bottom: 8px;">
                        ${event.icon}
                    </div>
                    <h2 class="event-details-title">${event.title}</h2>
                    <div class="event-details-badges">
                        <span class="event-details-type" style="background: ${this.getColor(event.type)}20; color: ${this.getColor(event.type)};">
                            <i class="fas fa-tag"></i> ${event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                        </span>
                        ${event.isHighlight ? '<span class="event-details-highlight">?? Highlight</span>' : ''}
                    </div>
                </div>

                <div class="event-details-description">
                    <p>${event.description}</p>
                </div>

                <div class="event-details-grid">
                    <div class="event-details-item">
                        <span class="event-details-label"><i class="fas fa-calendar-alt"></i> Date</span>
                        <span class="event-details-value">${event.month} ${event.year}</span>
                    </div>
                    <div class="event-details-item">
                        <span class="event-details-label"><i class="fas fa-clock"></i> Time Ago</span>
                        <span class="event-details-value">${this.getTimeAgo(event.createdAt)}</span>
                    </div>
                </div>

                <div class="event-details-actions">
                    <button class="btn btn-outline btn-sm timeline-toggle-highlight" data-id="${event.id}">
                        <i class="fas ${event.isHighlight ? 'fa-star' : 'fa-star-o'}"></i>
                        ${event.isHighlight ? 'Remove Highlight' : 'Mark as Highlight'}
                    </button>
                    <button class="btn btn-primary btn-sm timeline-edit-event" data-id="${event.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-outline btn-sm timeline-share-event" data-id="${event.id}">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                </div>
            </div>
        `;

        // Add event listeners for actions inside details modal
        body.querySelector('.timeline-toggle-highlight')?.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            this.closeDetailsModal();
            this.toggleHighlight(id);
        });

        body.querySelector('.timeline-edit-event')?.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            this.closeDetailsModal();
            this.showEditEventModal(id);
        });

        body.querySelector('.timeline-share-event')?.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            this.closeDetailsModal();
            this.shareEvent(id);
        });

        document.getElementById('timelineDetailsModal').style.display = 'block';
    }

    // ============ UI HELPERS ============

    setupEventListeners() {
        // Add Event button
        const addBtn = document.getElementById('timelineAddEventBtn');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showAddEventModal();
            });
        }

        const emptyAddBtn = document.getElementById('timelineEmptyAddBtn');
        if (emptyAddBtn) {
            emptyAddBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showAddEventModal();
            });
        }

        // Auto-save form data on any input change
        document.addEventListener('input', (e) => {
            if (e.target.closest('#timelineModal')) {
                this.saveFormData();
            }
        });

        // Search
        document.getElementById('timelineSearchInput')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.applyFilters();
        });

        // Category filter buttons
        document.querySelectorAll('#timelineCategoryFilters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#timelineCategoryFilters .filter-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                this.currentFilter = btn.dataset.category;
                this.applyFilters();
            });
        });

        // Year filter buttons
        document.querySelectorAll('#timelineYearFilters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#timelineYearFilters .filter-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                this.currentYear = btn.dataset.year;
                this.applyFilters();
            });
        });

        // Sort filter buttons
        document.querySelectorAll('#timelineSortFilters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#timelineSortFilters .filter-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                this.currentSort = btn.dataset.sort;
                this.applyFilters();
            });
        });

        // Modal close buttons
        document.getElementById('timelineModalClose')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeEventModal();
        });

        document.getElementById('timelineModalCancelBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeEventModal();
        });

        document.getElementById('timelineDetailsClose')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDetailsModal();
        });

        document.getElementById('timelineDetailsCloseBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDetailsModal();
        });

        // Delete modal close buttons
        document.getElementById('timelineDeleteClose')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDeleteModal();
        });

        document.getElementById('timelineDeleteCancelBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDeleteModal();
        });

        document.getElementById('timelineDeleteConfirmBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.confirmDelete();
        });

        // Click outside modals
        document.getElementById('timelineModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeEventModal();
            }
        });

        document.getElementById('timelineDetailsModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeDetailsModal();
            }
        });

        document.getElementById('timelineDeleteModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeDeleteModal();
            }
        });

        // Save event button
        document.getElementById('timelineModalSaveBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.saveEvent();
        });

        // Enter key to save
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('timelineModal');
            if (e.key === 'Enter' && modal && modal.style.display !== 'none') {
                e.preventDefault();
                this.saveEvent();
            }
            if (e.key === 'Escape') {
                if (document.getElementById('timelineDetailsModal').style.display !== 'none') {
                    this.closeDetailsModal();
                }
                if (document.getElementById('timelineModal').style.display !== 'none') {
                    this.closeEventModal();
                }
                if (document.getElementById('timelineDeleteModal').style.display !== 'none') {
                    this.closeDeleteModal();
                }
            }
        });

        // Event actions (event delegation)
        document.querySelector('#timelineContainer')?.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.timeline-edit-event');
            const deleteBtn = e.target.closest('.timeline-delete-event');
            const highlightBtn = e.target.closest('.timeline-toggle-highlight');
            const viewBtn = e.target.closest('.timeline-view-details');
            const shareBtn = e.target.closest('.timeline-share-event');
            
            if (editBtn) {
                e.preventDefault();
                const id = parseInt(editBtn.dataset.id);
                this.showEditEventModal(id);
            }
            
            if (deleteBtn) {
                e.preventDefault();
                const id = parseInt(deleteBtn.dataset.id);
                this.deleteEvent(id);
            }
            
            if (highlightBtn) {
                e.preventDefault();
                const id = parseInt(highlightBtn.dataset.id);
                this.toggleHighlight(id);
            }
            
            if (viewBtn) {
                e.preventDefault();
                const id = parseInt(viewBtn.dataset.id);
                this.viewDetails(id);
            }
            
            if (shareBtn) {
                e.preventDefault();
                const id = parseInt(shareBtn.dataset.id);
                this.shareEvent(id);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'm' || e.key === 'M') {
                if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault();
                    this.showAddEventModal();
                }
            }
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                document.getElementById('timelineSearchInput')?.focus();
            }
        });
    }

    applyFilters() {
        const container = document.getElementById('timelineContainer');
        const filtered = this.getFilteredEvents();
        container.innerHTML = this.renderTimeline(filtered);
        this.animateCards();
    }

    createParticles() {
        const container = document.getElementById('timelineParticles');
        if (!container) return;
        
        const particleCount = 20;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'timeline-particle';
            const size = 2 + Math.random() * 4;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.animationDuration = `${10 + Math.random() * 20}s`;
            particle.style.animationDelay = `${Math.random() * 10}s`;
            particle.style.opacity = 0.1 + Math.random() * 0.2;
            container.appendChild(particle);
        }
    }

    animateCards() {
        const cards = document.querySelectorAll('.stagger-item');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, 100 + index * 100);
        });

        const eventCards = document.querySelectorAll('.timeline-event-card');
        eventCards.forEach((card, index) => {
            const delay = parseFloat(card.style.animationDelay) || 0;
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateX(0)';
            }, 200 + index * 50);
        });
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('timelineToast');
        const toastMessage = document.getElementById('timelineToastMessage');
        
        if (toast && toastMessage) {
            toastMessage.textContent = message;
            toast.className = 'timeline-toast show';
            toast.style.borderLeftColor = type === 'error' ? 'var(--danger)' : type === 'warning' ? 'var(--warning)' : 'var(--success)';
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        } else if (window.showToast) {
            window.showToast('Timeline', message, type, 2500);
        } else {
            alert(message);
        }
    }
}

export default Timeline;
