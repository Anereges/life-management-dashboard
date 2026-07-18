// js/components/Journal.js
export class Journal {
    constructor() {
        this.container = null;
        this.currentFilter = 'all';
        this.currentMood = 'all';
        this.currentTag = 'all';
        this.currentSort = 'newest';
        this.searchQuery = '';
        this.editingEntryId = null;
        this.viewingEntryId = null;
        this.entries = [];
        this.apiBase = 'http://localhost:5000/api/journal';
        this.token = localStorage.getItem('access_token');
        this.deleteTargetId = null;
        this.formData = {};
    }

    async loadEntries() {
        try {
            const response = await fetch(`${this.apiBase}/entries`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.entries = data.map(e => this.transformEntry(e));
                console.log('✅ Journal entries loaded:', this.entries);
            } else if (response.status === 401) {
                window.location.href = '/login.html';
            } else {
                console.error('Failed to load entries:', await response.text());
                this.entries = [];
            }
        } catch (error) {
            console.error('Error loading entries:', error);
            this.entries = [];
        }
    }

    transformEntry(backendEntry) {
        // Parse tags if present
        let tags = [];
        if (backendEntry.tags) {
            try {
                if (Array.isArray(backendEntry.tags)) {
                    tags = backendEntry.tags;
                } else if (typeof backendEntry.tags === 'string') {
                    try {
                        const parsed = JSON.parse(backendEntry.tags);
                        if (Array.isArray(parsed)) {
                            tags = parsed;
                        }
                    } catch {
                        tags = [backendEntry.tags];
                    }
                }
            } catch (e) {
                console.warn('Error parsing tags:', e);
                tags = [];
            }
        }

        return {
            id: backendEntry.id,
            title: this.generateTitle(backendEntry.content),
            date: backendEntry.date ? new Date(backendEntry.date).toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
            }) : 'Unknown',
            content: backendEntry.content,
            mood: backendEntry.mood || 5,
            energy: backendEntry.energy_level || 5,
            tags: tags,
            isFavorite: backendEntry.is_favorite || false,
            createdAt: backendEntry.created_at || new Date().toISOString(),
            photo_url: backendEntry.photo_url || null,
            ai_insight: backendEntry.ai_insight || null
        };
    }

    transformToBackend(entry) {
        return {
            date: entry.createdAt ? entry.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            content: entry.content,
            photo_url: entry.photo_url || null,
            mood: entry.mood || 5,
            energy_level: entry.energy || 5,
            tags: entry.tags && entry.tags.length > 0 ? JSON.stringify(entry.tags) : null,
            is_favorite: entry.isFavorite || false,
            ai_insight: entry.ai_insight || null
        };
    }

    generateTitle(content) {
        // Generate a title from the first few words of content
        const words = content.split(' ');
        if (words.length <= 5) return content;
        return words.slice(0, 5).join(' ') + '...';
    }

    getEmojiForMood(mood) {
        const emojis = {
            1: '😔',
            2: '😟',
            3: '😕',
            4: '😐',
            5: '🙂',
            6: '😊',
            7: '😄',
            8: '😃',
            9: '😍',
            10: '🥰'
        };
        return emojis[mood] || '😊';
    }

    getEmojiForEnergy(energy) {
        const emojis = {
            1: '😴',
            2: '😪',
            3: '😫',
            4: '😩',
            5: '😣',
            6: '😌',
            7: '💪',
            8: '⚡',
            9: '🔥',
            10: '🌟'
        };
        return emojis[energy] || '⚡';
    }

    async render() {
        await this.loadEntries();
        
        this.container = document.getElementById('page-content');
        this.container.innerHTML = `
            <div class="journal-container">
                <!-- Animated Background -->
                <div class="journal-bg-animation">
                    <div class="journal-orb journal-orb-1"></div>
                    <div class="journal-orb journal-orb-2"></div>
                    <div class="journal-orb journal-orb-3"></div>
                </div>

                <!-- Header -->
                <div class="journal-header glass-card fade-in-up">
                    <div class="journal-header-content">
                        <div>
                            <div class="journal-badge">
                                <span class="journal-badge-icon">📝</span>
                                <span class="journal-badge-text">Memory Journal</span>
                            </div>
                            <h1 class="journal-title">Your <span class="journal-title-highlight">Story</span> Matters</h1>
                            <p class="journal-subtitle">Capture moments, track moods, and reflect on your journey</p>
                        </div>
                        <div class="journal-header-actions">
                            <button class="btn btn-primary btn-glow" id="journalAddEntryBtn">
                                <i class="fas fa-feather-alt"></i>
                                <span>Write Entry</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Stats -->
                    <div class="journal-stats">
                        <div class="journal-stat">
                            <span class="journal-stat-number">${this.entries.length}</span>
                            <span class="journal-stat-label">Total Entries</span>
                        </div>
                        <div class="journal-stat-divider"></div>
                        <div class="journal-stat">
                            <span class="journal-stat-number">${this.entries.filter(e => e.isFavorite).length}</span>
                            <span class="journal-stat-label">⭐ Favorites</span>
                        </div>
                        <div class="journal-stat-divider"></div>
                        <div class="journal-stat">
                            <span class="journal-stat-number" style="color: var(--success);">${this.entries.length > 0 ? Math.round(this.entries.reduce((sum, e) => sum + e.mood, 0) / this.entries.length) : 0}/10</span>
                            <span class="journal-stat-label">😊 Average Mood</span>
                        </div>
                        <div class="journal-stat-divider"></div>
                        <div class="journal-stat">
                            <span class="journal-stat-number" style="color: var(--warning);">${this.entries.length > 0 ? Math.round(this.entries.reduce((sum, e) => sum + e.energy, 0) / this.entries.length) : 0}/10</span>
                            <span class="journal-stat-label">⚡ Average Energy</span>
                        </div>
                        <div class="journal-stat-divider"></div>
                        <div class="journal-stat">
                            <span class="journal-stat-number">${this.entries.length} 🔥</span>
                            <span class="journal-stat-label">Day Streak</span>
                        </div>
                    </div>
                </div>

                <!-- Search & Filters -->
                <div class="journal-controls glass-card">
                    <div class="search-bar">
                        <i class="fas fa-search"></i>
                        <input type="text" id="journalSearchInput" placeholder="Search memories, tags, or content..." class="search-input">
                    </div>
                    <div class="journal-filters">
                        <div class="filter-group">
                            <label>Mood</label>
                            <div class="filter-buttons" id="journalMoodFilters">
                                <button class="filter-btn active" data-mood="all">All</button>
                                <button class="filter-btn" data-mood="high">😊 Happy (7-10)</button>
                                <button class="filter-btn" data-mood="medium">😐 Neutral (4-6)</button>
                                <button class="filter-btn" data-mood="low">😔 Low (1-3)</button>
                            </div>
                        </div>
                        <div class="filter-group">
                            <label>Tags</label>
                            <div class="filter-buttons" id="journalTagFilters">
                                <button class="filter-btn active" data-tag="all">All</button>
                                ${[...new Set(this.entries.flatMap(e => e.tags))].map(tag => `
                                    <button class="filter-btn" data-tag="${tag}">#${tag}</button>
                                `).join('')}
                            </div>
                        </div>
                        <div class="filter-group">
                            <label>Sort</label>
                            <div class="filter-buttons" id="journalSortFilters">
                                <button class="filter-btn active" data-sort="newest">Newest</button>
                                <button class="filter-btn" data-sort="oldest">Oldest</button>
                                <button class="filter-btn" data-sort="mood">Mood</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Entries Grid -->
                <div id="journalEntriesGrid" class="entries-grid">
                    ${this.renderEntries(this.getFilteredEntries())}
                </div>

                <!-- Add/Edit Entry Modal -->
                <div id="journalModal" class="modal" style="display:none;">
                    <div class="modal-content glass-card">
                        <div class="modal-header">
                            <h3 class="modal-title" id="journalModalTitle">
                                <i class="fas fa-feather-alt" style="color: var(--primary);"></i>
                                New Journal Entry
                            </h3>
                            <button class="modal-close-btn" id="journalModalClose">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label>Entry Title *</label>
                                <input type="text" id="journalTitleInput" class="form-control" placeholder="Give your entry a title...">
                            </div>
                            <div class="form-group">
                                <label>Content *</label>
                                <textarea id="journalContentInput" class="form-control" rows="5" placeholder="Write your thoughts..."></textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group" style="flex: 1;">
                                    <label>Mood (1-10)</label>
                                    <input type="number" id="journalMoodInput" class="form-control" value="7" min="1" max="10">
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label>Energy (1-10)</label>
                                    <input type="number" id="journalEnergyInput" class="form-control" value="7" min="1" max="10">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Tags (comma separated)</label>
                                <input type="text" id="journalTagsInput" class="form-control" placeholder="e.g., Family, Career, Growth">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-ghost" id="journalModalCancelBtn">Cancel</button>
                            <button class="btn btn-primary" id="journalModalSaveBtn">
                                <i class="fas fa-save"></i> <span id="journalModalSaveText">Save Entry</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- View Entry Modal -->
                <div id="journalDetailsModal" class="modal" style="display:none;">
                    <div class="modal-content glass-card modal-details">
                        <div class="modal-header">
                            <h3 class="modal-title" id="journalDetailsTitle">
                                <i class="fas fa-book-open" style="color: var(--primary);"></i>
                                Journal Entry
                            </h3>
                            <button class="modal-close-btn" id="journalDetailsClose">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body" id="journalDetailsBody">
                            <!-- Details will be rendered here -->
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" id="journalDetailsCloseBtn">Close</button>
                        </div>
                    </div>
                </div>

                <!-- Delete Confirmation Modal -->
                <div id="journalDeleteModal" class="modal" style="display:none;">
                    <div class="modal-content glass-card" style="max-width: 450px;">
                        <div class="modal-header" style="border-bottom: none; padding-bottom: 0;">
                            <h3 class="modal-title" style="color: var(--danger);">
                                <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
                                Delete Entry
                            </h3>
                            <button class="modal-close-btn" id="journalDeleteClose">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body" style="text-align: center; padding: 30px 20px;">
                            <div style="font-size: 4rem; margin-bottom: 16px;">🗑️</div>
                            <h4 style="margin-bottom: 8px; color: var(--dark);">Are you sure?</h4>
                            <p style="color: var(--gray); margin-bottom: 20px;">
                                This action cannot be undone. This will permanently delete this journal entry.
                            </p>
                            <div id="journalDeletePreview" style="background: rgba(0,0,0,0.03); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                                <p style="margin: 0; font-weight: 500;" id="journalDeleteTitle">Loading...</p>
                            </div>
                            <div style="display: flex; gap: 12px; justify-content: center;">
                                <button class="btn btn-ghost" id="journalDeleteCancelBtn">Cancel</button>
                                <button class="btn btn-danger" id="journalDeleteConfirmBtn">
                                    <i class="fas fa-trash"></i> Delete Permanently
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Toast Notification -->
                <div id="journalToast" class="journal-toast">
                    <i class="fas fa-check-circle" style="color: var(--success);"></i>
                    <span id="journalToastMessage">Entry saved!</span>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.animateCards();
        return this.container;
    }

    renderEntries(entries) {
        if (entries.length === 0) {
            return `
                <div class="empty-state glass-card" style="grid-column: 1 / -1; text-align: center; padding: 80px 40px;">
                    <div class="empty-state-icon">📖</div>
                    <h3 class="empty-state-title">No Journal Entries</h3>
                    <p class="empty-state-subtitle">Start capturing your memories and thoughts today!</p>
                    <button class="btn btn-primary btn-glow" id="journalEmptyAddBtn">
                        <i class="fas fa-feather-alt"></i>
                        Write Your First Entry
                    </button>
                </div>
            `;
        }

        return entries.map((entry, index) => `
            <div class="entry-card glass-card fade-in-up stagger-item" style="animation-delay: ${index * 0.06}s" data-id="${entry.id}">
                <div class="entry-card-header">
                    <div class="entry-title-section">
                        <h3 class="entry-title">${entry.title}</h3>
                        <div class="entry-badges">
                            ${entry.isFavorite ? `<span class="entry-favorite"><i class="fas fa-star"></i> Favorite</span>` : ''}
                            <span class="entry-mood">${this.getEmojiForMood(entry.mood)} ${entry.mood}/10</span>
                            <span class="entry-energy">${this.getEmojiForEnergy(entry.energy)} ${entry.energy}/10</span>
                        </div>
                    </div>
                    <div class="entry-card-actions">
                        <button class="btn btn-ghost btn-sm journal-toggle-favorite" data-id="${entry.id}" title="Toggle Favorite">
                            <i class="fas ${entry.isFavorite ? 'fa-star' : 'fa-star-o'}"></i>
                        </button>
                        <button class="btn btn-ghost btn-sm journal-edit-entry" data-id="${entry.id}" title="Edit Entry">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-ghost btn-sm journal-delete-entry" data-id="${entry.id}" title="Delete Entry">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                
                <p class="entry-content">${entry.content}</p>
                
                <div class="entry-meta">
                    <span class="entry-meta-item">
                        <i class="fas fa-calendar-alt" style="color: var(--primary);"></i>
                        ${entry.date}
                    </span>
                    <span class="entry-meta-item">
                        <i class="fas fa-clock" style="color: var(--gray);"></i>
                        ${this.getTimeAgo(entry.createdAt)}
                    </span>
                </div>

                <div class="entry-tags">
                    ${entry.tags.map(tag => `
                        <span class="entry-tag">#${tag}</span>
                    `).join('')}
                </div>

                <div class="entry-card-footer">
                    <button class="btn btn-outline btn-sm journal-view-entry" data-id="${entry.id}">
                        <i class="fas fa-eye"></i>
                        Read More
                    </button>
                    <button class="btn btn-ghost btn-sm journal-share-entry" data-id="${entry.id}">
                        <i class="fas fa-share-alt"></i>
                        Share
                    </button>
                </div>
            </div>
        `).join('');
    }

    getFilteredEntries() {
        let filtered = [...this.entries];
        
        if (this.currentMood && this.currentMood !== 'all') {
            filtered = filtered.filter(e => {
                if (this.currentMood === 'high') return e.mood >= 7;
                if (this.currentMood === 'medium') return e.mood >= 4 && e.mood <= 6;
                if (this.currentMood === 'low') return e.mood <= 3;
                return true;
            });
        }
        
        if (this.currentTag && this.currentTag !== 'all') {
            filtered = filtered.filter(e => e.tags.includes(this.currentTag));
        }
        
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(e => 
                e.title.toLowerCase().includes(query) ||
                e.content.toLowerCase().includes(query) ||
                e.tags.some(tag => tag.toLowerCase().includes(query))
            );
        }
        
        if (this.currentSort === 'newest') {
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else if (this.currentSort === 'oldest') {
            filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } else if (this.currentSort === 'mood') {
            filtered.sort((a, b) => b.mood - a.mood);
        }
        
        return filtered;
    }

    getTimeAgo(date) {
        if (!date) return 'Recently';
        const diff = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Yesterday';
        if (diff < 7) return `${diff} days ago`;
        if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`;
        return `${Math.floor(diff / 30)} months ago`;
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
            this.showToast('⚠️ Network error. Please try again.', 'error');
            return null;
        }
    }

    // ============ SAVE FORM DATA ============

    saveFormData() {
        this.formData = {
            title: document.getElementById('journalTitleInput')?.value || '',
            content: document.getElementById('journalContentInput')?.value || '',
            mood: document.getElementById('journalMoodInput')?.value || '7',
            energy: document.getElementById('journalEnergyInput')?.value || '7',
            tags: document.getElementById('journalTagsInput')?.value || ''
        };
    }

    // ============ ENTRY MODAL FUNCTIONS ============

    showAddEntryModal() {
        this.editingEntryId = null;
        this.formData = {};
        document.getElementById('journalModalTitle').innerHTML = `
            <i class="fas fa-feather-alt" style="color: var(--primary);"></i>
            New Journal Entry
        `;
        document.getElementById('journalModalSaveText').textContent = 'Save Entry';
        
        document.getElementById('journalTitleInput').value = '';
        document.getElementById('journalContentInput').value = '';
        document.getElementById('journalMoodInput').value = '7';
        document.getElementById('journalEnergyInput').value = '7';
        document.getElementById('journalTagsInput').value = '';
        
        document.getElementById('journalModal').style.display = 'block';
        setTimeout(() => {
            document.getElementById('journalTitleInput').focus();
        }, 300);
    }

    showEditEntryModal(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;
        
        this.editingEntryId = id;
        this.formData = {};
        document.getElementById('journalModalTitle').innerHTML = `
            <i class="fas fa-edit" style="color: var(--primary);"></i>
            Edit Journal Entry
        `;
        document.getElementById('journalModalSaveText').textContent = 'Update Entry';
        
        document.getElementById('journalTitleInput').value = entry.title;
        document.getElementById('journalContentInput').value = entry.content;
        document.getElementById('journalMoodInput').value = entry.mood;
        document.getElementById('journalEnergyInput').value = entry.energy;
        document.getElementById('journalTagsInput').value = entry.tags.join(', ');
        
        document.getElementById('journalModal').style.display = 'block';
        setTimeout(() => {
            document.getElementById('journalTitleInput').focus();
        }, 300);
    }

    closeEntryModal() {
        document.getElementById('journalModal').style.display = 'none';
        this.editingEntryId = null;
        this.formData = {};
    }

    closeDetailsModal() {
        document.getElementById('journalDetailsModal').style.display = 'none';
        this.viewingEntryId = null;
    }

    closeDeleteModal() {
        document.getElementById('journalDeleteModal').style.display = 'none';
        this.deleteTargetId = null;
    }

    showDeleteModal(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;
        
        this.deleteTargetId = id;
        document.getElementById('journalDeleteTitle').textContent = entry.title;
        document.getElementById('journalDeleteModal').style.display = 'block';
    }

    async confirmDelete() {
        if (!this.deleteTargetId) return;
        
        const result = await this.apiRequest(`/entries/${this.deleteTargetId}`, 'DELETE');
        if (result) {
            this.closeDeleteModal();
            await this.loadEntries();
            this.applyFilters();
            this.showToast('🗑️ Entry deleted', 'warning');
        }
    }

    async saveEntry() {
        this.saveFormData();
        
        const title = document.getElementById('journalTitleInput').value.trim();
        const content = document.getElementById('journalContentInput').value.trim();
        const mood = parseInt(document.getElementById('journalMoodInput').value) || 5;
        const energy = parseInt(document.getElementById('journalEnergyInput').value) || 5;
        const tagsInput = document.getElementById('journalTagsInput').value.trim();
        const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : ['Journal'];

        if (!title) {
            document.getElementById('journalTitleInput').style.borderColor = 'var(--danger)';
            this.showToast('⚠️ Please enter a title', 'error');
            setTimeout(() => {
                document.getElementById('journalTitleInput').style.borderColor = '';
            }, 2000);
            return;
        }

        if (!content) {
            document.getElementById('journalContentInput').style.borderColor = 'var(--danger)';
            this.showToast('⚠️ Please write some content', 'error');
            setTimeout(() => {
                document.getElementById('journalContentInput').style.borderColor = '';
            }, 2000);
            return;
        }

        const entryData = {
            date: new Date().toISOString().split('T')[0],
            content: content,
            mood: Math.min(10, Math.max(1, mood)),
            energy_level: Math.min(10, Math.max(1, energy)),
            tags: tags.length > 0 ? JSON.stringify(tags) : null,
            is_favorite: false
        };

        let result;
        if (this.editingEntryId) {
            result = await this.apiRequest(`/entries/${this.editingEntryId}`, 'PUT', entryData);
            if (result) {
                this.showToast('✅ Entry updated successfully!', 'success');
            }
        } else {
            result = await this.apiRequest('/entries', 'POST', entryData);
            if (result) {
                this.showToast('📝 Journal entry created successfully!', 'success');
            }
        }

        if (result) {
            this.closeEntryModal();
            await this.loadEntries();
            this.applyFilters();
        }
    }

    // ============ ENTRY ACTIONS ============

    async deleteEntry(id) {
        this.showDeleteModal(id);
    }

    async toggleFavorite(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;
        
        const newFavorite = !entry.isFavorite;
        const result = await this.apiRequest(`/entries/${id}`, 'PUT', {
            is_favorite: newFavorite
        });
        
        if (result) {
            await this.loadEntries();
            this.applyFilters();
            this.showToast(newFavorite ? '⭐ Added to favorites!' : '⭐ Removed from favorites');
        }
    }

    async shareEntry(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;
        
        const shareText = `${entry.title}\n\n${entry.content}\n\n📅 ${entry.date}\n😊 Mood: ${entry.mood}/10\n⚡ Energy: ${entry.energy}/10\n🏷️ Tags: ${entry.tags.join(', ')}`;
        
        if (navigator.share) {
            navigator.share({
                title: entry.title,
                text: shareText,
            }).catch(() => {});
        } else {
            navigator.clipboard?.writeText(shareText).then(() => {
                this.showToast('📋 Entry copied to clipboard!');
            }).catch(() => {
                prompt('Copy this entry:', shareText);
            });
        }
    }

    // ============ VIEW ENTRY MODAL ============

    viewEntry(id) {
        const entry = this.entries.find(e => e.id === id);
        if (!entry) return;
        
        this.viewingEntryId = id;
        
        const moodEmoji = this.getEmojiForMood(entry.mood);
        const energyEmoji = this.getEmojiForEnergy(entry.energy);

        const body = document.getElementById('journalDetailsBody');
        body.innerHTML = `
            <div class="entry-details-content">
                <div class="entry-details-header">
                    <h2 class="entry-details-title">${entry.title}</h2>
                    <div class="entry-details-badges">
                        ${entry.isFavorite ? `<span class="entry-favorite"><i class="fas fa-star"></i> Favorite</span>` : ''}
                        <span class="entry-mood">${moodEmoji} Mood: ${entry.mood}/10</span>
                        <span class="entry-energy">${energyEmoji} Energy: ${entry.energy}/10</span>
                    </div>
                </div>

                <div class="entry-details-content-text">
                    <p>${entry.content}</p>
                </div>

                <div class="entry-details-meta">
                    <span class="entry-meta-item">
                        <i class="fas fa-calendar-alt" style="color: var(--primary);"></i>
                        ${entry.date}
                    </span>
                    <span class="entry-meta-item">
                        <i class="fas fa-clock" style="color: var(--gray);"></i>
                        ${this.getTimeAgo(entry.createdAt)}
                    </span>
                </div>

                <div class="entry-details-tags">
                    ${entry.tags.map(tag => `
                        <span class="entry-tag">#${tag}</span>
                    `).join('')}
                </div>

                <div class="entry-details-actions">
                    <button class="btn btn-outline btn-sm journal-toggle-favorite" data-id="${entry.id}">
                        <i class="fas ${entry.isFavorite ? 'fa-star' : 'fa-star-o'}"></i>
                        ${entry.isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                    </button>
                    <button class="btn btn-primary btn-sm journal-edit-entry" data-id="${entry.id}">
                        <i class="fas fa-edit"></i> Edit Entry
                    </button>
                    <button class="btn btn-outline btn-sm journal-share-entry" data-id="${entry.id}">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                </div>
            </div>
        `;

        // Add event listeners for actions inside details modal
        body.querySelector('.journal-toggle-favorite')?.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            this.closeDetailsModal();
            this.toggleFavorite(id);
        });

        body.querySelector('.journal-edit-entry')?.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            this.closeDetailsModal();
            this.showEditEntryModal(id);
        });

        body.querySelector('.journal-share-entry')?.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            this.closeDetailsModal();
            this.shareEntry(id);
        });

        document.getElementById('journalDetailsModal').style.display = 'block';
    }

    // ============ UI HELPERS ============

    setupEventListeners() {
        // Add Entry button
        const addBtn = document.getElementById('journalAddEntryBtn');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showAddEntryModal();
            });
        }

        const emptyAddBtn = document.getElementById('journalEmptyAddBtn');
        if (emptyAddBtn) {
            emptyAddBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showAddEntryModal();
            });
        }

        // Auto-save form data on any input change
        document.addEventListener('input', (e) => {
            if (e.target.closest('#journalModal')) {
                this.saveFormData();
            }
        });

        // Search
        document.getElementById('journalSearchInput')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.applyFilters();
        });

        // Mood filter buttons
        document.querySelectorAll('#journalMoodFilters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#journalMoodFilters .filter-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                this.currentMood = btn.dataset.mood;
                this.applyFilters();
            });
        });

        // Tag filter buttons
        document.querySelectorAll('#journalTagFilters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#journalTagFilters .filter-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                this.currentTag = btn.dataset.tag;
                this.applyFilters();
            });
        });

        // Sort filter buttons
        document.querySelectorAll('#journalSortFilters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#journalSortFilters .filter-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                this.currentSort = btn.dataset.sort;
                this.applyFilters();
            });
        });

        // Modal close buttons
        document.getElementById('journalModalClose')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeEntryModal();
        });

        document.getElementById('journalModalCancelBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeEntryModal();
        });

        document.getElementById('journalDetailsClose')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDetailsModal();
        });

        document.getElementById('journalDetailsCloseBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDetailsModal();
        });

        // Delete modal close buttons
        document.getElementById('journalDeleteClose')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDeleteModal();
        });

        document.getElementById('journalDeleteCancelBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDeleteModal();
        });

        document.getElementById('journalDeleteConfirmBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.confirmDelete();
        });

        // Click outside modals
        document.getElementById('journalModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeEntryModal();
            }
        });

        document.getElementById('journalDetailsModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeDetailsModal();
            }
        });

        document.getElementById('journalDeleteModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeDeleteModal();
            }
        });

        // Save entry button
        document.getElementById('journalModalSaveBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.saveEntry();
        });

        // Enter key to save
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('journalModal');
            if (e.key === 'Enter' && modal && modal.style.display !== 'none') {
                e.preventDefault();
                this.saveEntry();
            }
            if (e.key === 'Escape') {
                if (document.getElementById('journalDetailsModal').style.display !== 'none') {
                    this.closeDetailsModal();
                }
                if (document.getElementById('journalModal').style.display !== 'none') {
                    this.closeEntryModal();
                }
                if (document.getElementById('journalDeleteModal').style.display !== 'none') {
                    this.closeDeleteModal();
                }
            }
        });

        // Entry actions (event delegation)
        document.querySelector('#journalEntriesGrid')?.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.journal-edit-entry');
            const deleteBtn = e.target.closest('.journal-delete-entry');
            const favoriteBtn = e.target.closest('.journal-toggle-favorite');
            const viewBtn = e.target.closest('.journal-view-entry');
            const shareBtn = e.target.closest('.journal-share-entry');
            
            if (editBtn) {
                e.preventDefault();
                const id = parseInt(editBtn.dataset.id);
                this.showEditEntryModal(id);
            }
            
            if (deleteBtn) {
                e.preventDefault();
                const id = parseInt(deleteBtn.dataset.id);
                this.deleteEntry(id);
            }
            
            if (favoriteBtn) {
                e.preventDefault();
                const id = parseInt(favoriteBtn.dataset.id);
                this.toggleFavorite(id);
            }
            
            if (viewBtn) {
                e.preventDefault();
                const id = parseInt(viewBtn.dataset.id);
                this.viewEntry(id);
            }
            
            if (shareBtn) {
                e.preventDefault();
                const id = parseInt(shareBtn.dataset.id);
                this.shareEntry(id);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'j' || e.key === 'J') {
                if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault();
                    this.showAddEntryModal();
                }
            }
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                document.getElementById('journalSearchInput')?.focus();
            }
        });
    }

    applyFilters() {
        const container = document.getElementById('journalEntriesGrid');
        const filtered = this.getFilteredEntries();
        container.innerHTML = this.renderEntries(filtered);
        this.animateCards();
    }

    animateCards() {
        const cards = document.querySelectorAll('.stagger-item');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, 100 + index * 60);
        });
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('journalToast');
        const toastMessage = document.getElementById('journalToastMessage');
        
        if (toast && toastMessage) {
            toastMessage.textContent = message;
            toast.className = 'journal-toast show';
            toast.style.borderLeftColor = type === 'error' ? 'var(--danger)' : type === 'warning' ? 'var(--warning)' : 'var(--success)';
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        } else if (window.showToast) {
            window.showToast('Journal', message, type, 2500);
        } else {
            alert(message);
        }
    }
}

export default Journal;