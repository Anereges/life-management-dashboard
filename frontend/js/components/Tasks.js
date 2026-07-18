// js/components/Tasks.js
export class Tasks {
    constructor() {
        this.container = null;
        this.currentFilter = 'all';
        this.currentCategory = 'all';
        this.currentPriority = 'all';
        this.searchQuery = '';
        this.editingTaskId = null;
        this.viewingTaskId = null;
        this.tasks = [];
        this.apiBase = 'https://life-management-api.onrender.com/api/tasks';
        this.token = localStorage.getItem('access_token');
        this.formData = {};
        this.deleteTargetId = null;
    }

    async loadTasks() {
        try {
            const response = await fetch(`${this.apiBase}/`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.tasks = data.map(t => this.transformTask(t));
                console.log('? Tasks loaded:', this.tasks);
            } else if (response.status === 401) {
                window.location.href = '/login.html';
            } else {
                console.error('Failed to load tasks:', await response.text());
                this.tasks = [];
            }
        } catch (error) {
            console.error('Error loading tasks:', error);
            this.tasks = [];
        }
    }

    transformTask(backendTask) {
        // Parse subtasks
        let subtasks = [];
        if (backendTask.subtasks) {
            try {
                if (Array.isArray(backendTask.subtasks)) {
                    subtasks = backendTask.subtasks;
                } else if (typeof backendTask.subtasks === 'string') {
                    try {
                        const parsed = JSON.parse(backendTask.subtasks);
                        if (Array.isArray(parsed)) {
                            subtasks = parsed;
                        }
                    } catch {
                        // If not valid JSON, treat as empty
                    }
                }
            } catch (e) {
                console.warn('Error parsing subtasks:', e);
            }
        }

        return {
            id: backendTask.id,
            title: this.getEmojiForCategory(backendTask.category) + ' ' + backendTask.title,
            description: backendTask.description || '',
            priority: this.getPriorityLabel(backendTask.priority || 1),
            category: backendTask.category || 'General',
            status: backendTask.status || 'pending',
            deadline: backendTask.deadline ? new Date(backendTask.deadline).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Ongoing',
            progress: backendTask.progress || 0,
            subtasks: subtasks,
            createdAt: backendTask.created_at ? backendTask.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            reminder: backendTask.reminder || null,
            reward: backendTask.reward || null,
            estimated_time: backendTask.estimated_time || null,
            difficulty: backendTask.difficulty || 1,
            goal_id: backendTask.goal_id || null
        };
    }

    transformToBackend(task) {
        return {
            title: task.title.replace(/^[^\s]+\s/, ''),
            description: task.description || '',
            priority: this.getPriorityValue(task.priority),
            category: task.category,
            status: task.status,
            deadline: task.deadline !== 'Ongoing' ? task.deadline : null,
            progress: task.progress || 0,
            subtasks: task.subtasks && task.subtasks.length > 0 ? JSON.stringify(task.subtasks) : null,
            reminder: task.reminder || null,
            reward: task.reward || null,
            estimated_time: task.estimated_time || null,
            difficulty: task.difficulty || 1,
            goal_id: task.goal_id || null
        };
    }

    getEmojiForCategory(category) {
        const emojis = {
            'Learning': '??',
            'Health': '???',
            'Career': '??',
            'Reading': '??',
            'Personal': '??',
            'Other': '??',
            'General': '??',
            'Work': '??'
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
            title: document.getElementById('tasksTitleInput')?.value || '',
            description: document.getElementById('tasksDescriptionInput')?.value || '',
            category: document.getElementById('tasksCategoryInput')?.value || 'Learning',
            priority: document.getElementById('tasksPriorityInput')?.value || 'medium',
            status: document.getElementById('tasksStatusInput')?.value || 'pending',
            progress: document.getElementById('tasksProgressInput')?.value || '0',
            deadline: document.getElementById('tasksDeadlineInput')?.value || '',
            reminder: document.getElementById('tasksReminderInput')?.value || '',
            subtasks: document.getElementById('tasksSubtasksInput')?.value || ''
        };
    }

    async render() {
        await this.loadTasks();
        
        this.container = document.getElementById('page-content');
        this.container.innerHTML = `
            <div class="tasks-container">
                <!-- Animated Background -->
                <div class="tasks-bg-animation">
                    <div class="tasks-orb tasks-orb-1"></div>
                    <div class="tasks-orb tasks-orb-2"></div>
                    <div class="tasks-orb tasks-orb-3"></div>
                </div>

                <!-- Header -->
                <div class="tasks-header glass-card fade-in-up">
                    <div class="tasks-header-content">
                        <div>
                            <div class="tasks-badge">
                                <span class="tasks-badge-icon">?</span>
                                <span class="tasks-badge-text">Task Manager</span>
                            </div>
                            <h1 class="tasks-title">Your <span class="tasks-title-highlight">Tasks</span> Hub</h1>
                            <p class="tasks-subtitle">Organize, track, and conquer your daily goals</p>
                        </div>
                        <div class="tasks-header-actions">
                            <button class="btn btn-primary btn-glow" id="tasksAddTaskBtn">
                                <i class="fas fa-plus-circle"></i>
                                <span>New Task</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Stats -->
                    <div class="tasks-stats">
                        <div class="task-stat">
                            <span class="task-stat-number">${this.tasks.length}</span>
                            <span class="task-stat-label">Total Tasks</span>
                        </div>
                        <div class="task-stat-divider"></div>
                        <div class="task-stat">
                            <span class="task-stat-number" style="color: var(--success);">${this.tasks.filter(t => t.status === 'completed').length}</span>
                            <span class="task-stat-label">Completed ?</span>
                        </div>
                        <div class="task-stat-divider"></div>
                        <div class="task-stat">
                            <span class="task-stat-number" style="color: var(--warning);">${this.tasks.filter(t => t.status === 'in_progress').length}</span>
                            <span class="task-stat-label">In Progress ??</span>
                        </div>
                        <div class="task-stat-divider"></div>
                        <div class="task-stat">
                            <span class="task-stat-number" style="color: var(--gray);">${this.tasks.filter(t => t.status === 'pending').length}</span>
                            <span class="task-stat-label">Pending ?</span>
                        </div>
                        <div class="task-stat-divider"></div>
                        <div class="task-stat">
                            <span class="task-stat-number">${this.tasks.length > 0 ? Math.round(this.tasks.reduce((acc, t) => acc + t.progress, 0) / this.tasks.length) : 0}%</span>
                            <span class="task-stat-label">Overall Progress</span>
                        </div>
                    </div>
                </div>

                <!-- Search & Filters -->
                <div class="tasks-controls glass-card">
                    <div class="search-bar">
                        <i class="fas fa-search"></i>
                        <input type="text" id="tasksSearchInput" placeholder="Search tasks..." class="search-input">
                    </div>
                    <div class="tasks-filters">
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
                            <div class="filter-buttons" id="tasksCategoryFilters">
                                <button class="filter-btn active" data-category="all">All</button>
                                ${[...new Set(this.tasks.map(t => t.category))].map(cat => `
                                    <button class="filter-btn" data-category="${cat}">${cat}</button>
                                `).join('')}
                            </div>
                        </div>
                        <div class="filter-group">
                            <label>Priority</label>
                            <div class="filter-buttons" id="tasksPriorityFilters">
                                <button class="filter-btn active" data-priority="all">All</button>
                                <button class="filter-btn" data-priority="high">?? High</button>
                                <button class="filter-btn" data-priority="medium">? Medium</button>
                                <button class="filter-btn" data-priority="low">?? Low</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tasks Board -->
                <div id="tasksBoard" class="tasks-board">
                    ${this.renderTasks(this.getFilteredTasks())}
                </div>

                <!-- Add/Edit Task Modal -->
                <div id="tasksModal" class="modal" style="display:none;">
                    <div class="modal-content glass-card">
                        <div class="modal-header">
                            <h3 class="modal-title" id="tasksModalTitle">
                                <i class="fas fa-plus-circle" style="color: var(--primary);"></i>
                                New Task
                            </h3>
                            <button class="modal-close-btn" id="tasksModalClose">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label>Task Title *</label>
                                <input type="text" id="tasksTitleInput" class="form-control" placeholder="Enter task title...">
                            </div>
                            <div class="form-group">
                                <label>Description</label>
                                <textarea id="tasksDescriptionInput" class="form-control" rows="2" placeholder="Describe your task..."></textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group" style="flex: 1;">
                                    <label>Category</label>
                                    <select id="tasksCategoryInput" class="form-control">
                                        <option value="Learning">?? Learning</option>
                                        <option value="Health">??? Health</option>
                                        <option value="Career">?? Career</option>
                                        <option value="Reading">?? Reading</option>
                                        <option value="Personal">?? Personal</option>
                                        <option value="Other">?? Other</option>
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label>Priority</label>
                                    <select id="tasksPriorityInput" class="form-control">
                                        <option value="high">?? High</option>
                                        <option value="medium" selected>? Medium</option>
                                        <option value="low">?? Low</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group" style="flex: 1;">
                                    <label>Status</label>
                                    <select id="tasksStatusInput" class="form-control">
                                        <option value="pending">? Pending</option>
                                        <option value="in_progress">?? In Progress</option>
                                        <option value="completed">? Completed</option>
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label>Progress (%)</label>
                                    <input type="number" id="tasksProgressInput" class="form-control" value="0" min="0" max="100">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Deadline</label>
                                <input type="text" id="tasksDeadlineInput" class="form-control" placeholder="e.g., July 2026">
                            </div>
                            <div class="form-group">
                                <label>Reminder</label>
                                <input type="text" id="tasksReminderInput" class="form-control" placeholder="e.g., 2026-07-15">
                            </div>
                            <div class="form-group">
                                <label>Subtasks (comma separated)</label>
                                <input type="text" id="tasksSubtasksInput" class="form-control" placeholder="e.g., Research, Design, Build, Test">
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-ghost" id="tasksModalCancelBtn">Cancel</button>
                            <button class="btn btn-primary" id="tasksModalSaveBtn">
                                <i class="fas fa-save"></i> <span id="tasksModalSaveText">Save Task</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- View Details Modal -->
                <div id="tasksDetailsModal" class="modal" style="display:none;">
                    <div class="modal-content glass-card modal-details">
                        <div class="modal-header">
                            <h3 class="modal-title" id="tasksDetailsTitle">
                                <i class="fas fa-info-circle" style="color: var(--primary);"></i>
                                Task Details
                            </h3>
                            <button class="modal-close-btn" id="tasksDetailsClose">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body" id="tasksDetailsBody">
                            <!-- Details will be rendered here -->
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-primary" id="tasksDetailsCloseBtn">Close</button>
                        </div>
                    </div>
                </div>

                <!-- Delete Confirmation Modal -->
                <div id="tasksDeleteModal" class="modal" style="display:none;">
                    <div class="modal-content glass-card" style="max-width: 450px;">
                        <div class="modal-header" style="border-bottom: none; padding-bottom: 0;">
                            <h3 class="modal-title" style="color: var(--danger);">
                                <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
                                Delete Task
                            </h3>
                            <button class="modal-close-btn" id="tasksDeleteClose">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body" style="text-align: center; padding: 30px 20px;">
                            <div style="font-size: 4rem; margin-bottom: 16px;">???</div>
                            <h4 style="margin-bottom: 8px; color: var(--dark);">Are you sure?</h4>
                            <p style="color: var(--gray); margin-bottom: 20px;">
                                This action cannot be undone. This will permanently delete the task and all its data.
                            </p>
                            <div id="tasksDeletePreview" style="background: rgba(0,0,0,0.03); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                                <p style="margin: 0; font-weight: 500;" id="tasksDeleteTitle">Loading...</p>
                            </div>
                            <div style="display: flex; gap: 12px; justify-content: center;">
                                <button class="btn btn-ghost" id="tasksDeleteCancelBtn">Cancel</button>
                                <button class="btn btn-danger" id="tasksDeleteConfirmBtn">
                                    <i class="fas fa-trash"></i> Delete Permanently
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Toast Notification -->
                <div id="tasksToast" class="task-toast">
                    <i class="fas fa-check-circle" style="color: var(--success);"></i>
                    <span id="tasksToastMessage">Task updated!</span>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.animateCards();
        return this.container;
    }

    renderTasks(tasks) {
        if (tasks.length === 0) {
            return `
                <div class="empty-state glass-card" style="grid-column: 1 / -1; text-align: center; padding: 80px 40px;">
                    <div class="empty-state-icon">??</div>
                    <h3 class="empty-state-title">No Tasks Found</h3>
                    <p class="empty-state-subtitle">Start organizing your day by creating your first task!</p>
                    <button class="btn btn-primary btn-glow" id="tasksEmptyAddBtn">
                        <i class="fas fa-plus-circle"></i>
                        Create Your First Task
                    </button>
                </div>
            `;
        }

        return tasks.map((task, index) => `
            <div class="task-card glass-card fade-in-up stagger-item" style="animation-delay: ${index * 0.06}s" data-id="${task.id}">
                <div class="task-card-header">
                    <div class="task-title-section">
                        <div class="task-title-wrapper">
                            <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.status === 'completed' ? 'checked' : ''}>
                            <h3 class="task-title ${task.status === 'completed' ? 'completed' : ''}">${task.title}</h3>
                        </div>
                        <div class="task-badges">
                            <span class="task-status ${task.status}">${this.getStatusLabel(task.status)}</span>
                            <span class="task-priority ${task.priority}">${this.getPriorityLabelDisplay(task.priority)}</span>
                            ${task.reminder ? `<span class="task-reminder"><i class="fas fa-bell"></i> ${task.reminder}</span>` : ''}
                        </div>
                    </div>
                    <div class="task-card-actions">
                        <button class="btn btn-ghost btn-sm tasks-edit-task" data-id="${task.id}" title="Edit Task">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-ghost btn-sm tasks-duplicate-task" data-id="${task.id}" title="Duplicate Task">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="btn btn-ghost btn-sm tasks-delete-task" data-id="${task.id}" title="Delete Task">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </div>
                
                <p class="task-description">${task.description}</p>
                
                <div class="task-meta">
                    <span class="task-meta-item">
                        <i class="fas fa-tag" style="color: var(--primary);"></i>
                        ${task.category}
                    </span>
                    <span class="task-meta-item">
                        <i class="fas fa-calendar-alt" style="color: var(--warning);"></i>
                        ${task.deadline}
                    </span>
                    <span class="task-meta-item">
                        <i class="fas fa-clock" style="color: var(--gray);"></i>
                        ${this.getTimeAgo(task.createdAt)}
                    </span>
                </div>

                <div class="task-progress-section">
                    <div class="task-progress-header">
                        <span class="task-progress-label">Progress</span>
                        <span class="task-progress-percentage">${task.progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="fill ${task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : ''}" 
                             style="width: ${task.progress}%;">
                        </div>
                    </div>
                </div>

                ${task.subtasks && task.subtasks.length > 0 ? `
                    <div class="task-subtasks">
                        <div class="subtasks-header">
                            <i class="fas fa-list-ul" style="color: var(--primary);"></i>
                            <span>Subtasks</span>
                            <span class="subtask-count">${task.subtasks.filter(s => s.completed).length}/${task.subtasks.length}</span>
                        </div>
                        <div class="subtask-list">
                            ${task.subtasks.map(subtask => `
                                <div class="subtask-item ${subtask.completed ? 'completed' : ''}" data-subtask-id="${subtask.id}" data-task-id="${task.id}">
                                    <input type="checkbox" class="subtask-checkbox" ${subtask.completed ? 'checked' : ''}>
                                    <span>${subtask.title}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="task-card-footer">
                    <button class="btn btn-outline btn-sm tasks-update-status" data-id="${task.id}">
                        <i class="fas fa-sync-alt"></i>
                        Update Status
                    </button>
                    <button class="btn btn-primary btn-sm tasks-view-details" data-id="${task.id}">
                        <i class="fas fa-eye"></i>
                        Details
                    </button>
                </div>
            </div>
        `).join('');
    }

    getFilteredTasks() {
        let filtered = this.tasks;
        
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(t => t.status === this.currentFilter);
        }
        
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(t => t.category === this.currentCategory);
        }
        
        if (this.currentPriority && this.currentPriority !== 'all') {
            filtered = filtered.filter(t => t.priority === this.currentPriority);
        }
        
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(t => 
                t.title.toLowerCase().includes(query) ||
                t.description.toLowerCase().includes(query) ||
                t.category.toLowerCase().includes(query)
            );
        }
        
        return filtered;
    }

    // ============ TASK MODAL FUNCTIONS ============

    showAddTaskModal() {
        this.editingTaskId = null;
        this.formData = {};
        document.getElementById('tasksModalTitle').innerHTML = `
            <i class="fas fa-plus-circle" style="color: var(--primary);"></i>
            New Task
        `;
        document.getElementById('tasksModalSaveText').textContent = 'Create Task';
        
        document.getElementById('tasksTitleInput').value = '';
        document.getElementById('tasksDescriptionInput').value = '';
        document.getElementById('tasksCategoryInput').value = 'Learning';
        document.getElementById('tasksPriorityInput').value = 'medium';
        document.getElementById('tasksStatusInput').value = 'pending';
        document.getElementById('tasksProgressInput').value = '0';
        document.getElementById('tasksDeadlineInput').value = '';
        document.getElementById('tasksReminderInput').value = '';
        document.getElementById('tasksSubtasksInput').value = '';
        
        document.getElementById('tasksModal').style.display = 'block';
        setTimeout(() => {
            document.getElementById('tasksTitleInput').focus();
        }, 300);
    }

    showEditTaskModal(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;
        
        this.editingTaskId = id;
        this.formData = {};
        document.getElementById('tasksModalTitle').innerHTML = `
            <i class="fas fa-edit" style="color: var(--primary);"></i>
            Edit Task
        `;
        document.getElementById('tasksModalSaveText').textContent = 'Update Task';
        
        document.getElementById('tasksTitleInput').value = task.title.replace(/^[^\s]+\s/, '');
        document.getElementById('tasksDescriptionInput').value = task.description;
        document.getElementById('tasksCategoryInput').value = task.category;
        document.getElementById('tasksPriorityInput').value = task.priority;
        document.getElementById('tasksStatusInput').value = task.status;
        document.getElementById('tasksProgressInput').value = task.progress;
        document.getElementById('tasksDeadlineInput').value = task.deadline !== 'Ongoing' ? task.deadline : '';
        document.getElementById('tasksReminderInput').value = task.reminder || '';
        document.getElementById('tasksSubtasksInput').value = task.subtasks ? 
            task.subtasks.map(s => s.title).join(', ') : '';
        
        document.getElementById('tasksModal').style.display = 'block';
        setTimeout(() => {
            document.getElementById('tasksTitleInput').focus();
        }, 300);
    }

    closeTaskModal() {
        document.getElementById('tasksModal').style.display = 'none';
        this.editingTaskId = null;
        this.formData = {};
    }

    closeDetailsModal() {
        document.getElementById('tasksDetailsModal').style.display = 'none';
        this.viewingTaskId = null;
    }

    closeDeleteModal() {
        document.getElementById('tasksDeleteModal').style.display = 'none';
        this.deleteTargetId = null;
    }

    showDeleteModal(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;
        
        this.deleteTargetId = id;
        document.getElementById('tasksDeleteTitle').textContent = task.title;
        document.getElementById('tasksDeleteModal').style.display = 'block';
    }

    async confirmDelete() {
        if (!this.deleteTargetId) return;
        
        const result = await this.apiRequest(`/${this.deleteTargetId}`, 'DELETE');
        if (result) {
            this.closeDeleteModal();
            await this.loadTasks();
            this.applyFilters();
            this.showToast('??? Task deleted successfully', 'warning');
        }
    }

    async saveTask() {
        this.saveFormData();
        
        const title = document.getElementById('tasksTitleInput').value.trim();
        const description = document.getElementById('tasksDescriptionInput').value.trim();
        const category = document.getElementById('tasksCategoryInput').value;
        const priority = document.getElementById('tasksPriorityInput').value;
        const status = document.getElementById('tasksStatusInput').value;
        const progress = parseInt(document.getElementById('tasksProgressInput').value) || 0;
        const deadline = document.getElementById('tasksDeadlineInput').value.trim() || 'Ongoing';
        const reminder = document.getElementById('tasksReminderInput').value.trim() || null;
        const subtasksInput = document.getElementById('tasksSubtasksInput').value.trim();

        if (!title) {
            document.getElementById('tasksTitleInput').style.borderColor = 'var(--danger)';
            this.showToast('?? Please enter a task title', 'error');
            setTimeout(() => {
                document.getElementById('tasksTitleInput').style.borderColor = '';
            }, 2000);
            return;
        }

        let subtasks = [];
        if (subtasksInput) {
            subtasks = subtasksInput.split(',').map(s => s.trim()).filter(s => s);
            subtasks = subtasks.map((s, index) => ({
                id: Date.now() + index,
                title: s,
                completed: false
            }));
        }

        const taskData = {
            title: title,
            description: description || '',
            category: category,
            priority: priority,
            status: status,
            progress: Math.min(100, Math.max(0, progress)),
            deadline: deadline !== 'Ongoing' ? deadline : null,
            reminder: reminder,
            subtasks: subtasks.length > 0 ? JSON.stringify(subtasks) : null
        };

        let result;
        if (this.editingTaskId) {
            result = await this.apiRequest(`/${this.editingTaskId}`, 'PUT', taskData);
            if (result) {
                this.showToast('? Task updated successfully!', 'success');
            }
        } else {
            result = await this.apiRequest('/', 'POST', taskData);
            if (result) {
                this.showToast('? New task created successfully!', 'success');
            }
        }

        if (result) {
            this.closeTaskModal();
            await this.loadTasks();
            this.applyFilters();
        }
    }

    // ============ TASK ACTIONS ============

    async toggleTaskStatus(id, completed) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            const result = await this.apiRequest(`/${id}`, 'PUT', {
                status: completed ? 'completed' : 'pending',
                progress: completed ? 100 : task.progress || 0
            });
            if (result) {
                await this.loadTasks();
                this.applyFilters();
                this.showToast(completed ? '?? Task completed!' : '? Task reopened');
            }
        }
    }

    async toggleSubtask(taskId, subtaskId, completed) {
        const task = this.tasks.find(t => t.id === taskId);
        if (task) {
            const subtask = task.subtasks.find(s => s.id === subtaskId);
            if (subtask) {
                subtask.completed = completed;
                const completedCount = task.subtasks.filter(s => s.completed).length;
                const newProgress = Math.round((completedCount / task.subtasks.length) * 100);
                
                const result = await this.apiRequest(`/${taskId}`, 'PUT', {
                    progress: newProgress,
                    subtasks: JSON.stringify(task.subtasks)
                });
                if (result) {
                    await this.loadTasks();
                    this.applyFilters();
                }
            }
        }
    }

    async deleteTask(id) {
        this.showDeleteModal(id);
    }

    async duplicateTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;
        
        const taskData = {
            title: task.title.replace(/^[^\s]+\s/, '') + ' (Copy)',
            description: task.description,
            category: task.category,
            priority: this.getPriorityValue(task.priority),
            status: 'pending',
            progress: 0,
            deadline: task.deadline !== 'Ongoing' ? task.deadline : null,
            subtasks: task.subtasks && task.subtasks.length > 0 ? JSON.stringify(task.subtasks.map(s => ({ ...s, completed: false }))) : null
        };
        
        const result = await this.apiRequest('/', 'POST', taskData);
        if (result) {
            await this.loadTasks();
            this.applyFilters();
            this.showToast('?? Task duplicated successfully!');
        }
    }

    async updateTaskStatus(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;
        
        const statuses = ['pending', 'in_progress', 'completed'];
        const currentIndex = statuses.indexOf(task.status);
        const nextIndex = (currentIndex + 1) % statuses.length;
        const newStatus = statuses[nextIndex];
        
        const result = await this.apiRequest(`/${id}`, 'PUT', {
            status: newStatus,
            progress: newStatus === 'completed' ? 100 : task.progress
        });
        
        if (result) {
            await this.loadTasks();
            this.applyFilters();
            
            const messages = {
                'pending': '? Task marked as pending',
                'in_progress': '?? Task marked as in progress',
                'completed': '?? Task completed! Congratulations!'
            };
            this.showToast(messages[newStatus] || 'Status updated', 'success');
        }
    }

    // ============ VIEW DETAILS MODAL ============

    showTaskDetails(id) {
        const task = this.tasks.find(t => t.id === id);
        if (!task) return;
        
        this.viewingTaskId = id;
        
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

        const body = document.getElementById('tasksDetailsBody');
        body.innerHTML = `
            <div class="task-details-content">
                <div class="task-details-header">
                    <h2 class="task-details-title">${task.title}</h2>
                    <div class="task-details-badges">
                        <span class="task-status ${task.status}" style="background: ${statusColors[task.status]}20; color: ${statusColors[task.status]};">
                            ${statusEmoji[task.status]} ${this.getStatusLabel(task.status)}
                        </span>
                        <span class="task-priority ${task.priority}">
                            ${priorityEmojis[task.priority]} ${this.getPriorityLabelDisplay(task.priority)}
                        </span>
                        ${task.reminder ? `<span class="task-reminder"><i class="fas fa-bell"></i> ${task.reminder}</span>` : ''}
                    </div>
                </div>

                <div class="task-details-description">
                    <p>${task.description || 'No description provided.'}</p>
                </div>

                <div class="task-details-grid">
                    <div class="task-details-item">
                        <span class="task-details-label"><i class="fas fa-tag"></i> Category</span>
                        <span class="task-details-value">${task.category}</span>
                    </div>
                    <div class="task-details-item">
                        <span class="task-details-label"><i class="fas fa-calendar-alt"></i> Deadline</span>
                        <span class="task-details-value">${task.deadline}</span>
                    </div>
                    <div class="task-details-item">
                        <span class="task-details-label"><i class="fas fa-clock"></i> Created</span>
                        <span class="task-details-value">${task.createdAt || 'Unknown'} (${this.getTimeAgo(task.createdAt)})</span>
                    </div>
                    <div class="task-details-item">
                        <span class="task-details-label"><i class="fas fa-chart-line"></i> Progress</span>
                        <span class="task-details-value">${task.progress}%</span>
                    </div>
                </div>

                <div class="task-details-progress">
                    <div class="task-progress-header">
                        <span>Progress</span>
                        <span>${task.progress}%</span>
                    </div>
                    <div class="progress-bar">
                        <div class="fill ${task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : ''}" 
                             style="width: ${task.progress}%;">
                        </div>
                    </div>
                </div>

                ${task.subtasks && task.subtasks.length > 0 ? `
                    <div class="task-details-subtasks">
                        <h4><i class="fas fa-list-ul" style="color: var(--primary);"></i> Subtasks</h4>
                        <div class="task-details-subtask-list">
                            ${task.subtasks.map(subtask => `
                                <div class="task-details-subtask ${subtask.completed ? 'completed' : ''}">
                                    <span class="subtask-status">${subtask.completed ? '?' : '?'}</span>
                                    <span>${subtask.title}</span>
                                </div>
                            `).join('')}
                        </div>
                        <div class="task-details-subtask-stats">
                            ${task.subtasks.filter(s => s.completed).length} of ${task.subtasks.length} completed
                        </div>
                    </div>
                ` : `
                    <div class="task-details-subtasks">
                        <h4><i class="fas fa-list-ul" style="color: var(--gray);"></i> Subtasks</h4>
                        <p style="color: var(--gray);">No subtasks for this task.</p>
                    </div>
                `}

                <div class="task-details-actions">
                    <button class="btn btn-outline btn-sm tasks-update-status" data-id="${task.id}">
                        <i class="fas fa-sync-alt"></i> Update Status
                    </button>
                    <button class="btn btn-primary btn-sm tasks-edit-task" data-id="${task.id}">
                        <i class="fas fa-edit"></i> Edit Task
                    </button>
                    <button class="btn btn-outline btn-sm tasks-duplicate-task" data-id="${task.id}">
                        <i class="fas fa-copy"></i> Duplicate
                    </button>
                </div>
            </div>
        `;

        // Add event listeners for actions inside details modal
        body.querySelector('.tasks-update-status')?.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            this.closeDetailsModal();
            this.updateTaskStatus(id);
        });

        body.querySelector('.tasks-edit-task')?.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            this.closeDetailsModal();
            this.showEditTaskModal(id);
        });

        body.querySelector('.tasks-duplicate-task')?.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            this.closeDetailsModal();
            this.duplicateTask(id);
        });

        document.getElementById('tasksDetailsModal').style.display = 'block';
    }

    // ============ UI HELPERS ============

    setupEventListeners() {
        // Add Task button
        const addBtn = document.getElementById('tasksAddTaskBtn');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showAddTaskModal();
            });
        }

        const emptyAddBtn = document.getElementById('tasksEmptyAddBtn');
        if (emptyAddBtn) {
            emptyAddBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showAddTaskModal();
            });
        }

        // Auto-save form data on any input change
        document.addEventListener('input', (e) => {
            if (e.target.closest('#tasksModal')) {
                this.saveFormData();
            }
        });

        // Search
        document.getElementById('tasksSearchInput')?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.applyFilters();
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
        document.querySelectorAll('#tasksCategoryFilters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#tasksCategoryFilters .filter-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                this.currentCategory = btn.dataset.category;
                this.applyFilters();
            });
        });

        // Priority filter buttons
        document.querySelectorAll('#tasksPriorityFilters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#tasksPriorityFilters .filter-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                this.currentPriority = btn.dataset.priority;
                this.applyFilters();
            });
        });

        // Modal close buttons
        document.getElementById('tasksModalClose')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeTaskModal();
        });

        document.getElementById('tasksModalCancelBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeTaskModal();
        });

        document.getElementById('tasksDetailsClose')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDetailsModal();
        });

        document.getElementById('tasksDetailsCloseBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDetailsModal();
        });

        // Delete modal close buttons
        document.getElementById('tasksDeleteClose')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDeleteModal();
        });

        document.getElementById('tasksDeleteCancelBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDeleteModal();
        });

        document.getElementById('tasksDeleteConfirmBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.confirmDelete();
        });

        // Click outside modals
        document.getElementById('tasksModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeTaskModal();
            }
        });

        document.getElementById('tasksDetailsModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeDetailsModal();
            }
        });

        document.getElementById('tasksDeleteModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeDeleteModal();
            }
        });

        // Save task button
        document.getElementById('tasksModalSaveBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.saveTask();
        });

        // Enter key to save
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('tasksModal');
            if (e.key === 'Enter' && modal && modal.style.display !== 'none') {
                e.preventDefault();
                this.saveTask();
            }
            if (e.key === 'Escape') {
                if (document.getElementById('tasksDetailsModal').style.display !== 'none') {
                    this.closeDetailsModal();
                }
                if (document.getElementById('tasksModal').style.display !== 'none') {
                    this.closeTaskModal();
                }
                if (document.getElementById('tasksDeleteModal').style.display !== 'none') {
                    this.closeDeleteModal();
                }
            }
        });

        // Task actions (event delegation)
        document.querySelector('#tasksBoard')?.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.tasks-edit-task');
            const deleteBtn = e.target.closest('.tasks-delete-task');
            const duplicateBtn = e.target.closest('.tasks-duplicate-task');
            const updateStatusBtn = e.target.closest('.tasks-update-status');
            const viewDetailsBtn = e.target.closest('.tasks-view-details');
            
            if (editBtn) {
                e.preventDefault();
                const id = parseInt(editBtn.dataset.id);
                this.showEditTaskModal(id);
            }
            
            if (deleteBtn) {
                e.preventDefault();
                const id = parseInt(deleteBtn.dataset.id);
                this.deleteTask(id);
            }
            
            if (duplicateBtn) {
                e.preventDefault();
                const id = parseInt(duplicateBtn.dataset.id);
                this.duplicateTask(id);
            }
            
            if (updateStatusBtn) {
                e.preventDefault();
                const id = parseInt(updateStatusBtn.dataset.id);
                this.updateTaskStatus(id);
            }
            
            if (viewDetailsBtn) {
                e.preventDefault();
                const id = parseInt(viewDetailsBtn.dataset.id);
                this.showTaskDetails(id);
            }
        });

        // Task checkbox
        document.querySelector('#tasksBoard')?.addEventListener('change', (e) => {
            if (e.target.classList.contains('task-checkbox')) {
                const id = parseInt(e.target.dataset.id);
                this.toggleTaskStatus(id, e.target.checked);
            }
            
            if (e.target.classList.contains('subtask-checkbox')) {
                const taskId = parseInt(e.target.closest('.subtask-item').dataset.taskId);
                const subtaskId = parseInt(e.target.closest('.subtask-item').dataset.subtaskId);
                this.toggleSubtask(taskId, subtaskId, e.target.checked);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 't' || e.key === 'T') {
                if (!e.ctrlKey && !e.metaKey && !e.altKey) {
                    e.preventDefault();
                    this.showAddTaskModal();
                }
            }
            if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                document.getElementById('tasksSearchInput')?.focus();
            }
        });
    }

    applyFilters() {
        const container = document.getElementById('tasksBoard');
        const filtered = this.getFilteredTasks();
        container.innerHTML = this.renderTasks(filtered);
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
        const toast = document.getElementById('tasksToast');
        const toastMessage = document.getElementById('tasksToastMessage');
        
        if (toast && toastMessage) {
            toastMessage.textContent = message;
            toast.className = 'task-toast show';
            toast.style.borderLeftColor = type === 'error' ? 'var(--danger)' : type === 'warning' ? 'var(--warning)' : 'var(--success)';
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        } else if (window.showToast) {
            window.showToast('Tasks', message, type, 2500);
        } else {
            alert(message);
        }
    }
}

export default Tasks;
