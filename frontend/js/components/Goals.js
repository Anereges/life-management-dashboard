// js/components/Goals.js
export class Goals {
    constructor() {
        this.container = null;
        this.currentFilter = 'all';
        this.currentCategory = 'all';
        this.editingGoalId = null;
        this.viewingGoalId = null;
        this.goals = [];
        this.apiBase = 'https://life-management-api.onrender.com/api/goals';
        this.token = localStorage.getItem('access_token');
        this.deleteTargetId = null;
        this.isModalOpen = false;
        this.formData = {}; // Store form data to prevent loss
    }

    async loadGoals() {
        try {
            const response = await fetch(`${this.apiBase}/`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.goals = data.map(g => this.transformGoal(g));
                console.log('? Goals loaded:', this.goals);
            } else if (response.status === 401) {
                window.location.href = '/login.html';
            } else {
                console.error('Failed to load goals:', await response.text());
                this.goals = [];
            }
        } catch (error) {
            console.error('Error loading goals:', error);
            this.goals = [];
        }
    }

    transformGoal(backendGoal) {
        let milestones = [];
        if (backendGoal.milestones) {
            try {
                if (Array.isArray(backendGoal.milestones)) {
                    milestones = backendGoal.milestones;
                } else if (typeof backendGoal.milestones === 'string') {
                    try {
                        const parsed = JSON.parse(backendGoal.milestones);
                        if (Array.isArray(parsed)) {
                            milestones = parsed;
                        } else {
                            milestones = [backendGoal.milestones];
                        }
                    } catch {
                        milestones = [backendGoal.milestones];
                    }
                }
            } catch (e) {
                console.warn('Error parsing milestones:', e);
                milestones = [];
            }
        }

        return {
            id: backendGoal.id,
            title: this.getEmojiForCategory(backendGoal.category) + ' ' + backendGoal.title,
            description: backendGoal.description || '',
            status: backendGoal.status || 'pending',
            priority: this.getPriorityLabel(backendGoal.priority || 1),
            category: backendGoal.category || 'General',
            deadline: backendGoal.deadline ? new Date(backendGoal.deadline).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Ongoing',
            progress: backendGoal.progress || 0,
            milestones: milestones,
            createdAt: backendGoal.created_at ? backendGoal.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            parent_goal_id: backendGoal.parent_goal_id,
            is_legacy: backendGoal.is_legacy || false
        };
    }

    transformToBackend(goal) {
        return {
            title: goal.title.replace(/^[^\s]+\s/, ''),
            description: goal.description || '',
            category: goal.category,
            priority: this.getPriorityValue(goal.priority),
            status: goal.status,
            deadline: goal.deadline !== 'Ongoing' ? goal.deadline : null,
            progress: goal.progress || 0,
            milestones: goal.milestones && goal.milestones.length > 0 ? JSON.stringify(goal.milestones) : null,
            parent_goal_id: goal.parent_goal_id || null,
            is_legacy: goal.is_legacy || false
        };
    }

    getEmojiForCategory(category) {
        const emojis = {
            'Career': '??',
            'Learning': '??',
            'Health': '???',
            'Personal': '??',
            'Finance': '??',
            'Other': '??',
            'General': '??'
        };
        return emojis[category] || '??';
    }

    getPriorityLabel(priority) {
        if (priority >= 3) return 'high';
        if (priority >= 2) return 'medium';
        return 'low';
    }

    getPriorityValue(priority) {
        const values = {
            'high': 3,
            'medium': 2,
            'low': 1
        };
        return values[priority] || 2;
    }

    getStatusLabel(status) {
        const labels = {
            'pending': 'Pending',
            'in_progress': 'In Progress',
            'completed': 'Completed'
        };
        return labels[status] || status;
    }

    getPriorityLabelDisplay(priority) {
        const labels = {
            'high': '?? High',
            'medium': '? Medium',
            'low': '?? Low'
        };
        return labels[priority] || priority;
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

    async render() {
        await this.loadGoals();
        
        this.container = document.getElementById('page-content');
        this.container.innerHTML = `
            <div class="goals-container">
                <!-- Animated Background -->
                <div class="goals-bg-animation">
                    <div class="goals-orb goals-orb-1"></div>
                    <div class="goals-orb goals-orb-2"></div>
                    <div class="goals-orb goals-orb-3"></div>
                </div>

                <!-- Header -->
                <div class="goals-header glass-card fade-in-up">
                    <div class="goals-header-content">
                        <div>
                            <div class="goals-badge">
                                <span class="goals-badge-icon">??</span>
                                <span class="goals-badge-text">Goal Tracker</span>
                            </div>
                            <h1 class="goals-title">Your <span class="goals-title-highlight">Goals</span> Journey</h1>
                            <p class="goals-subtitle">Track, achieve, and celebrate your milestones</p>
                        </div>
                        <button class="btn btn-primary btn-glow" id="goalsAddGoalBtn">
                            <i class="fas fa-plus-circle"></i>
                            <span>New Goal</span>
                        </button>
                    </div>
                    
                    <!-- Stats -->
                    <div class="goals-stats">
                        <div class="goal-stat">
                            <span class="goal-stat-number">${this.goals.length}</span>
                            <span class="goal-stat-label">Total Goals</span>
                        </div>
                        <div class="goal-stat-divider"></div>
                        <div class="goal-stat">
                            <span class="goal-stat-number" style="color: var(--success);">${this.goals.filter(g => g.status === 'completed').length}</span>
                            <span class="goal-stat-label">Completed ?</span>
                        </div>
                        <div class="goal-stat-divider"></div>
                        <div class="goal-stat">
                            <span class="goal-stat-number" style="color: var(--warning);">${this.goals.filter(g => g.status === 'in_progress').length}</span>
                            <span class="goal-stat-label">In Progress ??</span>
                        </div>
                        <div class="goal-stat-divider"></div>
                        <div class="goal-stat">
                            <span class="goal-stat-number" style="color: var(--gray);">${this.goals.filter(g => g.status === 'pending').length}</span>
                            <span class="goal-stat-label">Pending ?</span>
                        </div>
                        <div class="goal-stat-divider"></div>
                        <div class="goal-stat">
                            <span class="goal-stat-number">${this.goals.length > 0 ? Math.round(this.goals.reduce((acc, g) => acc + g.progress, 0) / this.goals.length) : 0}%</span>
                            <span class="goal-stat-label">Overall Progress</span>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="goals-filters glass-card">
                    <div class="filter-group">
                        <label>Status</label>
                        <div class="filter-buttons">
                            <button class="filter-btn active" data-filter="all">All</button>
                            <button class="filter-btn" data-filter="in_progress">In Progress</button>
                            <button class="filter-btn" data-filter="completed">Completed</button>
                            <button class="filter-btn" data-filter="pending">Pending</button>
                        </div>
                    </div>
                    <div class="filter-group">
                        <label>Category</label>
                        <div class="filter-buttons" id="goalsCategoryFilters">
                            <button class="filter-btn active" data-category="all">All</button>
                            ${[...new Set(this.goals.map(g => g.category))].map(cat => `
                                <button class="filter-btn" data-category="${cat}">${cat}</button>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- Goals Grid -->
                <div id="goalsGrid" class="goals-grid">
                    ${this.renderGoals(this.getFilteredGoals())}
                </div>

                <!-- Add/Edit Goal Modal -->
                <div id="goalsModal" class="modal" style="display:none;">
                    <div class="modal-content glass-card">
                        <div class="modal-header">
                            <h3 class="modal-title" id="goalsModalTitle">
                                <i class="fas fa-plus-circle" style="color: var(--primary);"></i>
                                New Goal
                            </h3>
                            <button class="modal-close-btn" id="goalsModalClose">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label>Goal Title *</label>
                                <input type="text" id="goalsTitleInput" class="form-control" placeholder="Enter goal title...">
                            </div>
                            <div class="form-group">
                                <label>Description</label>
                                <textarea id="goalsDescriptionInput" class="form-control" rows="2" placeholder="Describe your goal..."></textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group" style="flex: 1;">
                                    <label>Category</label>
                                    <select id="goalsCategoryInput" class="form-control">
                                        <option value="Career">?? Career</option>
                                        <option value="Learning">?? Learning</option>
                                        <option value="Health">??? Health</option>
                                        <option value="Personal">?? Personal</option>
                                        <option value="Finance">?? Finance</option>
                                        <option value="Other">?? Other</option>
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label>Priority</label>
                                    <select id="goalsPriorityInput" class="form-control">
                                        <option value="high">?? High</option>
                                        <option value="medium" selected>? Medium</option>
                                        <option value="low">?? Low</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group" style="flex: 1;">
                                    <label>Status</label>
                                    <select id="goalsStatusInput" class="form-control">
                                        <option value="pending">? Pending</option>
                                        <option value="in_progress">?? In Progress</option>
                                        <option value="completed">? Completed</option>
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label>Progress (%)</label>
                                    <input type="number" id="goalsProgressInput" class="form-control" value="0" min="0" max="100">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Deadline</label>
                                <input type="text" id="goalsDeadlineInput" class="form-control" placeholder="e.g., December 2026">
                            </div>
                            <div class="form-group">
                                <label>Milestones (comma separated)</label>
                                <input type="text" id="goalsMilestonesInput" class="form-control" placeholder="e.g., Research, Design, Build, Test">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-ghost" id="goalsModalCancelBtn">Cancel</button>
                            <button class="btn btn-primary" id="goalsModalSaveBtn">
                                <i class="fas fa-save"></i> <span id="goalsModalSaveText">Save Goal</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- View Details Modal -->
                <div id="goalsDetailsModal" class="modal" style="display:none;">
                    <div class="modal-content glass-card modal-details">
                        <div class="modal-header">
                            <h3 class="modal-title" id="goalsDetailsTitle">
                                <i class="fas fa-info-circle" style="color: var(--primary);"></i>
                                Goal Details
                            </h3>
                            <button class="modal-close-btn" id="goalsDetailsClose">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body" id="goalsDetailsBody">
                            <!-- Details will be rendered here -->
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" id="goalsDetailsCloseBtn">Close</button>
                        </div>
                    </div>
                </div>

                <!-- Delete Confirmation Modal -->
                <div id="goalsDeleteModal" class="modal" style="display:none;">
                    <div class="modal-content glass-card" style="max-width: 450px;">
                        <div class="modal-header" style="border-bottom: none; padding-bottom: 0;">
                            <h3 class="modal-title" style="color: var(--danger);">
                                <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
                                Delete Goal
                            </h3>
                            <button class="modal-close-btn" id="goalsDeleteClose">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body" style="text-align: center; padding: 30px 20px;">
                            <div style="font-size: 4rem; margin-bottom: 16px;">???</div>
                            <h4 style="margin-bottom: 8px; color: var(--dark);">Are you sure?</h4>
                            <p style="color: var(--gray); margin-bottom: 20px;">
                                This action cannot be undone. This will permanently delete the goal and all its data.
                            </p>
                            <div id="goalsDeletePreview" style="background: rgba(0,0,0,0.03); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                                <p style="margin: 0; font-weight: 500;" id="goalsDeleteTitle">Loading...</p>
                            </div>
                            <div style="display: flex; gap: 12px; justify-content: center;">
                                <button class="btn btn-ghost" id="goalsDeleteCancelBtn">Cancel</button>
                                <button class="btn btn-danger" id="goalsDeleteConfirmBtn">
                                    <i class="fas fa-trash"></i> Delete Permanently
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Toast Notification -->
                <div id="goalsToast" class="goal-toast">
                    <i class="fas fa-check-circle" style="color: var(--success);"></i>
                    <span id="goalsToastMessage">Goal updated!</span>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.animateCards();
        return this.container;
    }

    renderGoals(goals) {
        if (goals.length === 0) {
            return `
                <div class="empty-state glass-card" style="grid-column: 1 / -1; text-align: center; padding: 80px 40px;">
                    <div class="empty-state-icon">??</div>
                    <h3 class="empty-state-title">No Goals Found</h3>
                    <p class="empty-state-subtitle">Start your journey by creating your first goal!</p>
                    <button class="btn btn-primary btn-glow" id="goalsEmptyAddBtn">
                        <i class="fas fa-plus-circle"></i>
                        Create Your First Goal
                    </button>
                </div>
            `;
        }

        return goals.map((goal, index) => `
            <div class="goal-card glass-card fade-in-up stagger-item" style="animation-delay: ${index * 0.08}s" data-id="${goal.id}">
                <div class="goal-card-header">
                    <div class="goal-title-section">
                        <h3 class="goal-title">${goal.title}</h3>
                        <div class="goal-badges">
                            <span class="goal-status ${goal.status}">${this.getStatusLabel(goal.status)}</span>
                            <span class="goal-priority ${goal.priority}">${this.getPriorityLabelDisplay(goal.priority)}</span>
                        </div>
                    </div>
                    <div class="goal-card-actions">
                        <button class="btn btn-ghost btn-sm goals-edit-goal" data-id="${goal.id}" title="Edit Goal">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-ghost btn-sm goals-delete-goal" data-id="${goal.id}" title="Delete Goal">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                
                <p class="goal-description">${goal.description}</p>
                
                <div class="goal-meta">
                    <span class="goal-meta-item">
                        <i class="fas fa-tag" style="color: var(--primary);"></i>
                        ${goal.category}
                    </span>
                    <span class="goal-meta-item">
                        <i class="fas fa-calendar-alt" style="color: var(--warning);"></i>
                        ${goal.deadline}
                    </span>
                    <span class="goal-meta-item">
                        <i class="fas fa-clock" style="color: var(--gray);"></i>
                        ${this.getTimeAgo(goal.createdAt)}
                    </span>
                </div>

                <div class="goal-progress-section">
                    <div class="goal-progress-header">
                        <span class="goal-progress-label">Progress</span>
                        <span class="goal-progress-percentage">${goal.progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="fill ${goal.status === 'completed' ? 'success' : goal.status === 'in_progress' ? 'warning' : ''}" 
                             style="width: ${goal.progress}%;">
                        </div>
                    </div>
                </div>

                ${goal.milestones && goal.milestones.length > 0 ? `
                    <div class="goal-milestones">
                        <div class="goal-milestones-header">
                            <i class="fas fa-tasks" style="color: var(--primary);"></i>
                            <span>Milestones</span>
                            <span class="milestone-count">${goal.milestones.filter(m => m.includes('?')).length}/${goal.milestones.length}</span>
                        </div>
                        <div class="milestone-list">
                            ${goal.milestones.map(milestone => `
                                <div class="milestone-item ${milestone.includes('?') ? 'completed' : ''}">
                                    <span class="milestone-icon">${milestone.includes('?') ? '?' : '?'}</span>
                                    <span>${milestone.replace('?', '').replace('?', '').trim()}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="goal-card-footer">
                    <button class="btn btn-outline btn-sm goals-update-status" data-id="${goal.id}">
                        <i class="fas fa-sync-alt"></i>
                        Update Status
                    </button>
                    <button class="btn btn-primary btn-sm goals-view-details" data-id="${goal.id}">
                        <i class="fas fa-eye"></i>
                        Details
                    </button>
                </div>
            </div>
        `).join('');
    }

    getFilteredGoals() {
        let filtered = this.goals;
        
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(g => g.status === this.currentFilter);
        }
        
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(g => g.category === this.currentCategory);
        }
        
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
            title: document.getElementById('goalsTitleInput')?.value || '',
            description: document.getElementById('goalsDescriptionInput')?.value || '',
            category: document.getElementById('goalsCategoryInput')?.value || 'Career',
            priority: document.getElementById('goalsPriorityInput')?.value || 'medium',
            status: document.getElementById('goalsStatusInput')?.value || 'pending',
            progress: document.getElementById('goalsProgressInput')?.value || '0',
            deadline: document.getElementById('goalsDeadlineInput')?.value || '',
            milestones: document.getElementById('goalsMilestonesInput')?.value || ''
        };
    }

    restoreFormData() {
        if (this.formData) {
            if (document.getElementById('goalsTitleInput')) 
                document.getElementById('goalsTitleInput').value = this.formData.title || '';
            if (document.getElementById('goalsDescriptionInput')) 
                document.getElementById('goalsDescriptionInput').value = this.formData.description || '';
            if (document.getElementById('goalsCategoryInput')) 
                document.getElementById('goalsCategoryInput').value = this.formData.category || 'Career';
            if (document.getElementById('goalsPriorityInput')) 
                document.getElementById('goalsPriorityInput').value = this.formData.priority || 'medium';
            if (document.getElementById('goalsStatusInput')) 
                document.getElementById('goalsStatusInput').value = this.formData.status || 'pending';
            if (document.getElementById('goalsProgressInput')) 
                document.getElementById('goalsProgressInput').value = this.formData.progress || '0';
            if (document.getElementById('goalsDeadlineInput')) 
                document.getElementById('goalsDeadlineInput').value = this.formData.deadline || '';
            if (document.getElementById('goalsMilestonesInput')) 
                document.getElementById('goalsMilestonesInput').value = this.formData.milestones || '';
        }
    }

    // ============ GOAL CRUD OPERATIONS ============

    showAddGoalModal() {
        this.editingGoalId = null;
        this.formData = {}; // Reset form data
        document.getElementById('goalsModalTitle').innerHTML = `
            <i class="fas fa-plus-circle" style="color: var(--primary);"></i>
            New Goal
        `;
        document.getElementById('goalsModalSaveText').textContent = 'Create Goal';
        
        // Set empty values
        document.getElementById('goalsTitleInput').value = '';
        document.getElementById('goalsDescriptionInput').value = '';
        document.getElementById('goalsCategoryInput').value = 'Career';
        document.getElementById('goalsPriorityInput').value = 'medium';
        document.getElementById('goalsStatusInput').value = 'pending';
        document.getElementById('goalsProgressInput').value = '0';
        document.getElementById('goalsDeadlineInput').value = '';
        document.getElementById('goalsMilestonesInput').value = '';
        
        this.isModalOpen = true;
        const modal = document.getElementById('goalsModal');
        modal.style.display = 'block';
        
        setTimeout(() => {
            document.getElementById('goalsTitleInput').focus();
        }, 300);
    }

    showEditGoalModal(id) {
        const goal = this.goals.find(g => g.id === id);
        if (!goal) return;
        
        this.editingGoalId = id;
        this.formData = {}; // Reset form data
        document.getElementById('goalsModalTitle').innerHTML = `
            <i class="fas fa-edit" style="color: var(--primary);"></i>
            Edit Goal
        `;
        document.getElementById('goalsModalSaveText').textContent = 'Update Goal';
        
        document.getElementById('goalsTitleInput').value = goal.title.replace(/^[^\s]+\s/, '');
        document.getElementById('goalsDescriptionInput').value = goal.description;
        document.getElementById('goalsCategoryInput').value = goal.category;
        document.getElementById('goalsPriorityInput').value = goal.priority;
        document.getElementById('goalsStatusInput').value = goal.status;
        document.getElementById('goalsProgressInput').value = goal.progress;
        document.getElementById('goalsDeadlineInput').value = goal.deadline !== 'Ongoing' ? goal.deadline : '';
        document.getElementById('goalsMilestonesInput').value = goal.milestones ? 
            goal.milestones.map(m => m.replace('?', '').replace('?', '').trim()).join(', ') : '';
        
        this.isModalOpen = true;
        const modal = document.getElementById('goalsModal');
        modal.style.display = 'block';
        
        setTimeout(() => {
            document.getElementById('goalsTitleInput').focus();
        }, 300);
    }

    closeGoalModal() {
        this.isModalOpen = false;
        this.formData = {};
        document.getElementById('goalsModal').style.display = 'none';
        this.editingGoalId = null;
    }

    closeDetailsModal() {
        document.getElementById('goalsDetailsModal').style.display = 'none';
        this.viewingGoalId = null;
    }

    closeDeleteModal() {
        document.getElementById('goalsDeleteModal').style.display = 'none';
        this.deleteTargetId = null;
    }

    async saveGoal() {
        // Save current form data before validation
        this.saveFormData();
        
        const title = document.getElementById('goalsTitleInput').value.trim();
        const description = document.getElementById('goalsDescriptionInput').value.trim();
        const category = document.getElementById('goalsCategoryInput').value;
        const priority = document.getElementById('goalsPriorityInput').value;
        const status = document.getElementById('goalsStatusInput').value;
        const progress = parseInt(document.getElementById('goalsProgressInput').value) || 0;
        const deadline = document.getElementById('goalsDeadlineInput').value.trim() || 'Ongoing';
        const milestonesInput = document.getElementById('goalsMilestonesInput').value.trim();

        if (!title) {
            document.getElementById('goalsTitleInput').style.borderColor = 'var(--danger)';
            this.showToast('?? Please enter a goal title', 'error');
            setTimeout(() => {
                document.getElementById('goalsTitleInput').style.borderColor = '';
            }, 2000);
            return;
        }

        // Parse milestones
        let milestones = [];
        if (milestonesInput) {
            milestones = milestonesInput.split(',').map(m => m.trim()).filter(m => m);
            const completedCount = Math.round((progress / 100) * milestones.length);
            milestones = milestones.map((m, index) => {
                if (index < completedCount) return `${m} - ?`;
                return `${m} - ?`;
            });
        }

        const goalData = {
            title: title,
            description: description || '',
            category: category,
            priority: priority,
            status: status,
            progress: Math.min(100, Math.max(0, progress)),
            deadline: deadline !== 'Ongoing' ? deadline : null,
            milestones: milestones.length > 0 ? JSON.stringify(milestones) : null
        };

        let result;
        if (this.editingGoalId) {
            result = await this.apiRequest(`/${this.editingGoalId}`, 'PUT', goalData);
            if (result) {
                this.showToast('? Goal updated successfully!', 'success');
            }
        } else {
            result = await this.apiRequest('/', 'POST', goalData);
            if (result) {
                this.showToast('?? New goal created successfully!', 'success');
            }
        }

        if (result) {
            this.closeGoalModal();
            await this.loadGoals();
            this.applyFilters();
        }
    }

    showDeleteModal(id) {
        const goal = this.goals.find(g => g.id === id);
        if (!goal) return;
        
        this.deleteTargetId = id;
        document.getElementById('goalsDeleteTitle').textContent = goal.title;
        document.getElementById('goalsDeleteModal').style.display = 'block';
    }

    async confirmDelete() {
        if (!this.deleteTargetId) return;
        
        const result = await this.apiRequest(`/${this.deleteTargetId}`, 'DELETE');
        if (result) {
            this.closeDeleteModal();
            await this.loadGoals();
            this.applyFilters();
            this.showToast('??? Goal deleted successfully', 'warning');
        }
    }

    async deleteGoal(id) {
        this.showDeleteModal(id);
    }

    async updateGoalStatus(id) {
        const goal = this.goals.find(g => g.id === id);
        if (!goal) return;
        
        const statuses = ['pending', 'in_progress', 'completed'];
        const currentIndex = statuses.indexOf(goal.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        const newStatus = statuses[nextIndex];
        
        const result = await this.apiRequest(`/${id}`, 'PUT', {
            status: newStatus,
            progress: newStatus === 'completed' ? 100 : goal.progress
        });
        
        if (result) {
            await this.loadGoals();
            this.applyFilters();
            
            const messages = {
                'pending': '? Goal marked as pending',
                'in_progress': '?? Goal marked as in progress',
                'completed': '?? Goal completed! Congratulations!'
            };
            this.showToast(messages[newStatus] || 'Status updated', 'success');
        }
    }

    showGoalDetails(id) {
        const goal = this.goals.find(g => g.id === id);
        if (!goal) return;
        
        this.viewingGoalId = id;
        
        const statusEmoji = {
            'pending': '?',
            'in_progress': '??',
            'completed': '?'
        };

        const statusColors = {
            'pending': 'var(--gray)',
            'in_progress': 'var(--warning)',
            'completed': 'var(--success)'
        };

        const priorityEmojis = {
            'high': '??',
            'medium': '?',
            'low': '??'
        };

        const body = document.getElementById('goalsDetailsBody');
        body.innerHTML = `
            <div class="goal-details-content">
                <div class="goal-details-header">
                    <h2 class="goal-details-title">${goal.title}</h2>
                    <div class="goal-details-badges">
                        <span class="goal-status ${goal.status}" style="background: ${statusColors[goal.status]}20; color: ${statusColors[goal.status]};">
                            ${statusEmoji[goal.status]} ${this.getStatusLabel(goal.status)}
                        </span>
                        <span class="goal-priority ${goal.priority}">
                            ${priorityEmojis[goal.priority]} ${this.getPriorityLabelDisplay(goal.priority)}
                        </span>
                    </div>
                </div>

                <div class="goal-details-description">
                    <p>${goal.description || 'No description provided.'}</p>
                </div>

                <div class="goal-details-grid">
                    <div class="goal-details-item">
                        <span class="goal-details-label"><i class="fas fa-tag"></i> Category</span>
                        <span class="goal-details-value">${goal.category}</span>
                    </div>
                    <div class="goal-details-item">
                        <span class="goal-details-label"><i class="fas fa-calendar-alt"></i> Deadline</span>
                        <span class="goal-details-value">${goal.deadline}</span>
                    </div>
                    <div class="goal-details-item">
                        <span class="goal-details-label"><i class="fas fa-clock"></i> Created</span>
                        <span class="goal-details-value">${goal.createdAt || 'Unknown'} (${this.getTimeAgo(goal.createdAt)})</span>
                    </div>
                    <div class="goal-details-item">
                        <span class="goal-details-label"><i class="fas fa-chart-line"></i> Progress</span>
                        <span class="goal-details-value">${goal.progress}%</span>
                    </div>
                </div>

                <div class="goal-details-progress">
                    <div class="goal-progress-header">
                        <span>Progress</span>
                        <span>${goal.progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="fill ${goal.status === 'completed' ? 'success' : goal.status === 'in_progress' ? 'warning' : ''}" 
                             style="width: ${goal.progress}%;">
                        </div>
                    </div>
                </div>

                ${goal.milestones && goal.milestones.length > 0 ? `
                    <div class="goal-details-milestones">
                        <h4><i class="fas fa-tasks" style="color: var(--primary);"></i> Milestones</h4>
                        <div class="goal-details-milestone-list">
                            ${goal.milestones.map(milestone => `
                                <div class="goal-details-milestone ${milestone.includes('?') ? 'completed' : ''}">
                                    <span class="milestone-status">${milestone.includes('?') ? '?' : '?'}</span>
                                    <span>${milestone.replace('?', '').replace('?', '').trim()}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="goal-details-milestone-stats">
                            ${goal.milestones.filter(m => m.includes('?')).length} of ${goal.milestones.length} completed
                        </div>
                    </div>
                ` : `
                    <div class="goal-details-milestones">
                        <h4><i class="fas fa-tasks" style="color: var(--gray);"></i> Milestones</h4>
                        <p style="color: var(--gray);">No milestones set for this goal.</p>
                    </div>
                `}

                <div class="goal-details-actions">
                    <button class="btn btn-outline btn-sm goals-update-status" data-id="${goal.id}">
                        <i class="fas fa-sync-alt"></i> Update Status
                    </button>
                    <button class="btn btn-primary btn-sm goals-edit-goal" data-id="${goal.id}">
                        <i class="fas fa-edit"></i> Edit Goal
                    </button>
                </div>
            </div>
        `;

        // Add event listeners for actions inside details modal
        body.querySelector('.goals-update-status')?.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            this.closeDetailsModal();
            this.updateGoalStatus(id);
        });

        body.querySelector('.goals-edit-goal')?.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            this.closeDetailsModal();
            this.showEditGoalModal(id);
        });

        document.getElementById('goalsDetailsModal').style.display = 'block';
    }

    // ============ UI HELPERS ============

    setupEventListeners() {
        // Add Goal button
        const addBtn = document.getElementById('goalsAddGoalBtn');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showAddGoalModal();
            });
        }

        const emptyAddBtn = document.getElementById('goalsEmptyAddBtn');
        if (emptyAddBtn) {
            emptyAddBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showAddGoalModal();
            });
        }

        // Auto-save form data on any input change
        document.addEventListener('input', (e) => {
            if (e.target.closest('#goalsModal')) {
                this.saveFormData();
            }
        });

        // Status filter buttons
        document.querySelectorAll('.filter-btn[data-filter]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn[data-filter]').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                this.currentFilter = btn.dataset.filter;
                this.applyFilters();
            });
        });

        // Category filter buttons
        document.querySelectorAll('#goalsCategoryFilters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#goalsCategoryFilters .filter-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                this.currentCategory = btn.dataset.category;
                this.applyFilters();
            });
        });

        // Modal close buttons
        document.getElementById('goalsModalClose')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeGoalModal();
        });

        document.getElementById('goalsModalCancelBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeGoalModal();
        });

        document.getElementById('goalsDetailsClose')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDetailsModal();
        });

        document.getElementById('goalsDetailsCloseBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDetailsModal();
        });

        // Delete modal close buttons
        document.getElementById('goalsDeleteClose')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDeleteModal();
        });

        document.getElementById('goalsDeleteCancelBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDeleteModal();
        });

        document.getElementById('goalsDeleteConfirmBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.confirmDelete();
        });

        // Click outside modals
        document.getElementById('goalsModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeGoalModal();
            }
        });

        document.getElementById('goalsDetailsModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeDetailsModal();
            }
        });

        document.getElementById('goalsDeleteModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeDeleteModal();
            }
        });

        // Save goal button
        document.getElementById('goalsModalSaveBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.saveGoal();
        });

        // Enter key to save
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('goalsModal');
            if (e.key === 'Enter' && modal && modal.style.display !== 'none') {
                e.preventDefault();
                this.saveGoal();
            }
            if (e.key === 'Escape') {
                if (document.getElementById('goalsDetailsModal').style.display !== 'none') {
                    this.closeDetailsModal();
                }
                if (document.getElementById('goalsModal').style.display !== 'none') {
                    this.closeGoalModal();
                }
                if (document.getElementById('goalsDeleteModal').style.display !== 'none') {
                    this.closeDeleteModal();
                }
            }
        });

        // Goal actions (event delegation)
        document.querySelector('#goalsGrid')?.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.goals-edit-goal');
            const deleteBtn = e.target.closest('.goals-delete-goal');
            const updateStatusBtn = e.target.closest('.goals-update-status');
            const viewDetailsBtn = e.target.closest('.goals-view-details');
            
            if (editBtn) {
                e.preventDefault();
                const id = parseInt(editBtn.dataset.id);
                this.showEditGoalModal(id);
            }
            
            if (deleteBtn) {
                e.preventDefault();
                const id = parseInt(deleteBtn.dataset.id);
                this.deleteGoal(id);
            }
            
            if (updateStatusBtn) {
                e.preventDefault();
                const id = parseInt(updateStatusBtn.dataset.id);
                this.updateGoalStatus(id);
            }
            
            if (viewDetailsBtn) {
                e.preventDefault();
                const id = parseInt(viewDetailsBtn.dataset.id);
                this.showGoalDetails(id);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'g' || e.key === 'G') && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                this.showAddGoalModal();
            }
        });
    }

    applyFilters() {
        const container = document.getElementById('goalsGrid');
        const filtered = this.getFilteredGoals();
        container.innerHTML = this.renderGoals(filtered);
        this.animateCards();
    }

    animateCards() {
        const cards = document.querySelectorAll('.stagger-item');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, 100 + index * 80);
        });
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('goalsToast');
        const toastMessage = document.getElementById('goalsToastMessage');
        
        if (toast && toastMessage) {
            toastMessage.textContent = message;
            toast.className = 'goal-toast show';
            toast.style.borderLeftColor = type === 'error' ? 'var(--danger)' : type === 'warning' ? 'var(--warning)' : 'var(--success)';
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        } else if (window.showToast) {
            window.showToast('Goals', message, type, 2500);
        } else {
            alert(message);
        }
    }
}

export default Goals;
