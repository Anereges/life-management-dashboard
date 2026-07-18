// js/components/DreamTree.js
export class DreamTree {
    constructor() {
        this.container = null;
        this.currentStatusFilter = 'all';
        this.currentProgressFilter = 'all';
        this.editingNodeId = null;
        this.treeData = [];
        this.apiBase = 'http://localhost:5000/api/goals';
        this.token = localStorage.getItem('access_token');
        this.deleteTargetId = null;
        this.formData = {};
    }

    async loadTreeData() {
        try {
            // Get all goals with is_legacy=true for the dream tree
            const response = await fetch(`${this.apiBase}/dream-tree`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.treeData = this.transformTreeData(data);
                console.log('✅ Dream tree loaded:', this.treeData);
            } else if (response.status === 401) {
                window.location.href = '/login.html';
            } else {
                console.error('Failed to load dream tree:', await response.text());
                // Fallback to sample data if API fails
                this.loadSampleData();
            }
        } catch (error) {
            console.error('Error loading dream tree:', error);
            this.loadSampleData();
        }
    }

    loadSampleData() {
        // Sample data for when API is not available
        this.treeData = [
            {
                id: 1,
                title: '🌳 Become Cybersecurity Engineer',
                status: 'in_progress',
                progress: 65,
                description: 'Build a successful career in cybersecurity and protect the digital world',
                children: [
                    { 
                        id: 2, 
                        title: 'Learn Python', 
                        status: 'completed',
                        progress: 100,
                        description: 'Master Python programming for security automation'
                    },
                    { 
                        id: 3, 
                        title: 'Learn Networking', 
                        status: 'completed',
                        progress: 100,
                        description: 'Understand network protocols and infrastructure'
                    },
                    { 
                        id: 4, 
                        title: 'Build Portfolio', 
                        status: 'in_progress',
                        progress: 75,
                        description: 'Create projects to showcase cybersecurity skills',
                        children: [
                            { id: 8, title: 'Password Generator', status: 'completed', progress: 100 },
                            { id: 9, title: 'Security Scanner', status: 'in_progress', progress: 60 },
                            { id: 10, title: 'Encryption Tool', status: 'pending', progress: 0 }
                        ]
                    },
                    { 
                        id: 5, 
                        title: 'Internship', 
                        status: 'completed',
                        progress: 100,
                        description: 'Gain real-world experience in cybersecurity'
                    },
                    { 
                        id: 6, 
                        title: 'Remote Job', 
                        status: 'pending',
                        progress: 20,
                        description: 'Secure a remote cybersecurity position'
                    },
                    { 
                        id: 7, 
                        title: 'Continuous Learning', 
                        status: 'in_progress',
                        progress: 50,
                        description: 'Stay updated with latest security trends and technologies'
                    }
                ]
            },
            {
                id: 11,
                title: '💪 Health & Wellness',
                status: 'in_progress',
                progress: 40,
                description: 'Build a healthy lifestyle and maintain fitness',
                children: [
                    { id: 12, title: 'Exercise Routine', status: 'in_progress', progress: 60 },
                    { id: 13, title: 'Healthy Eating', status: 'pending', progress: 20 },
                    { id: 14, title: 'Mental Health', status: 'completed', progress: 100 },
                    { id: 15, title: 'Sleep Schedule', status: 'pending', progress: 10 }
                ]
            },
            {
                id: 16,
                title: '📚 Continuous Learning',
                status: 'in_progress',
                progress: 55,
                description: 'Never stop learning and growing',
                children: [
                    { id: 17, title: 'Read 50 Books', status: 'in_progress', progress: 40 },
                    { id: 18, title: 'Online Courses', status: 'completed', progress: 100 },
                    { id: 19, title: 'Learn AI/ML', status: 'pending', progress: 15 }
                ]
            }
        ];
    }

    transformTreeData(data) {
        if (!data || !Array.isArray(data)) return [];
        
        const transformNode = (node) => {
            return {
                id: node.id,
                title: this.getEmojiForStatus(node.status) + ' ' + node.title,
                status: node.status || 'pending',
                progress: node.progress || 0,
                description: node.description || '',
                children: node.children ? node.children.map(child => transformNode(child)) : []
            };
        };
        
        return data.map(node => transformNode(node));
    }

    getEmojiForStatus(status) {
        const emojis = {
            'completed': '✅',
            'in_progress': '🌱',
            'pending': '🌰'
        };
        return emojis[status] || '🌱';
    }

    async render() {
        await this.loadTreeData();
        
        this.container = document.getElementById('page-content');
        this.container.innerHTML = `
            <div class="dreamtree-container">
                <!-- Animated Background -->
                <div class="dreamtree-bg-animation">
                    <div class="dreamtree-orb dreamtree-orb-1"></div>
                    <div class="dreamtree-orb dreamtree-orb-2"></div>
                    <div class="dreamtree-orb dreamtree-orb-3"></div>
                    <div class="dreamtree-leaves">
                        <div class="leaf leaf-1">🌿</div>
                        <div class="leaf leaf-2">🌱</div>
                        <div class="leaf leaf-3">🍃</div>
                        <div class="leaf leaf-4">🌿</div>
                        <div class="leaf leaf-5">🍂</div>
                    </div>
                </div>

                <!-- Header -->
                <div class="dreamtree-header glass-card fade-in-up">
                    <div class="dreamtree-header-content">
                        <div>
                            <div class="dreamtree-badge">
                                <span class="dreamtree-badge-icon">🌳</span>
                                <span class="dreamtree-badge-text">Dream Tree</span>
                            </div>
                            <h1 class="dreamtree-title">Grow Your <span class="dreamtree-title-highlight">Dreams</span></h1>
                            <p class="dreamtree-subtitle">Watch your goals blossom into achievements</p>
                        </div>
                        <div class="dreamtree-header-actions">
                            <button class="btn btn-primary btn-glow" id="dreamAddGoalBtn">
                                <i class="fas fa-plus-circle"></i>
                                <span>Add Dream</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Stats -->
                    <div class="dreamtree-stats">
                        <div class="dreamtree-stat">
                            <span class="dreamtree-stat-number">${this.getTotalGoals()}</span>
                            <span class="dreamtree-stat-label">Total Dreams</span>
                        </div>
                        <div class="dreamtree-stat-divider"></div>
                        <div class="dreamtree-stat">
                            <span class="dreamtree-stat-number" style="color: var(--success);">${this.getCompletedCount()}</span>
                            <span class="dreamtree-stat-label">✅ Bloomed</span>
                        </div>
                        <div class="dreamtree-stat-divider"></div>
                        <div class="dreamtree-stat">
                            <span class="dreamtree-stat-number" style="color: var(--warning);">${this.getInProgressCount()}</span>
                            <span class="dreamtree-stat-label">🌱 Growing</span>
                        </div>
                        <div class="dreamtree-stat-divider"></div>
                        <div class="dreamtree-stat">
                            <span class="dreamtree-stat-number" style="color: var(--gray);">${this.getPendingCount()}</span>
                            <span class="dreamtree-stat-label">🌰 Seeds</span>
                        </div>
                        <div class="dreamtree-stat-divider"></div>
                        <div class="dreamtree-stat">
                            <span class="dreamtree-stat-number">${Math.round(this.getOverallProgress())}%</span>
                            <span class="dreamtree-stat-label">Forest Progress</span>
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="dreamtree-controls glass-card" style="animation-delay: 0.15s;">
                    <div class="dreamtree-filters">
                        <div class="filter-group">
                            <label>Status</label>
                            <div class="filter-buttons" id="dreamStatusFilters">
                                <button class="filter-btn active" data-filter="all">🌳 All</button>
                                <button class="filter-btn" data-filter="completed">✅ Bloomed</button>
                                <button class="filter-btn" data-filter="in_progress">🌱 Growing</button>
                                <button class="filter-btn" data-filter="pending">🌰 Seeds</button>
                            </div>
                        </div>
                        <div class="filter-group">
                            <label>Progress</label>
                            <div class="filter-buttons" id="dreamProgressFilters">
                                <button class="filter-btn active" data-progress="all">All</button>
                                <button class="filter-btn" data-progress="high">🚀 High (70%+)</button>
                                <button class="filter-btn" data-progress="medium">⚡ Medium (30-69%)</button>
                                <button class="filter-btn" data-progress="low">🐢 Low (&lt;30%)</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tree Visualization -->
                <div class="dreamtree-viz glass-card" style="animation-delay: 0.2s;">
                    <div class="dreamtree-viz-header">
                        <h3 class="dreamtree-viz-title">
                            <i class="fas fa-tree" style="color: var(--primary);"></i>
                            Your Dream Forest
                        </h3>
                        <div class="dreamtree-viz-actions">
                            <button class="btn btn-ghost btn-sm" id="dreamExpandAllBtn">
                                <i class="fas fa-expand"></i> Expand All
                            </button>
                            <button class="btn btn-ghost btn-sm" id="dreamCollapseAllBtn">
                                <i class="fas fa-compress"></i> Collapse All
                            </button>
                        </div>
                    </div>
                    <div id="dreamTreeContainer" class="tree-container">
                        ${this.renderTree(this.getFilteredData())}
                    </div>
                </div>

                <!-- Add/Edit Dream Modal -->
                <div id="dreamModal" class="modal" style="display:none;">
                    <div class="modal-content glass-card">
                        <div class="modal-header">
                            <h3 class="modal-title" id="dreamModalTitle">
                                <i class="fas fa-plus-circle" style="color: var(--primary);"></i>
                                New Dream
                            </h3>
                            <button class="modal-close-btn" id="dreamModalClose">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="form-group">
                                <label>Dream Title *</label>
                                <input type="text" id="dreamTitleInput" class="form-control" placeholder="What dream do you want to grow?">
                            </div>
                            <div class="form-group">
                                <label>Description</label>
                                <textarea id="dreamDescriptionInput" class="form-control" rows="2" placeholder="Describe your dream..."></textarea>
                            </div>
                            <div class="form-row">
                                <div class="form-group" style="flex: 1;">
                                    <label>Status</label>
                                    <select id="dreamStatusInput" class="form-control">
                                        <option value="pending">🌰 Seed</option>
                                        <option value="in_progress" selected>🌱 Growing</option>
                                        <option value="completed">✅ Bloomed</option>
                                    </select>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label>Progress (%)</label>
                                    <input type="number" id="dreamProgressInput" class="form-control" value="0" min="0" max="100">
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Parent Dream (optional)</label>
                                <select id="dreamParentInput" class="form-control">
                                    <option value="none">None (Root Dream)</option>
                                    ${this.getFlatTreeOptions()}
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button class="btn btn-ghost" id="dreamModalCancelBtn">Cancel</button>
                            <button class="btn btn-primary" id="dreamModalSaveBtn">
                                <i class="fas fa-save"></i> <span id="dreamModalSaveText">Plant Dream</span>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Delete Confirmation Modal -->
                <div id="dreamDeleteModal" class="modal" style="display:none;">
                    <div class="modal-content glass-card" style="max-width: 450px;">
                        <div class="modal-header" style="border-bottom: none; padding-bottom: 0;">
                            <h3 class="modal-title" style="color: var(--danger);">
                                <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
                                Delete Dream
                            </h3>
                            <button class="modal-close-btn" id="dreamDeleteClose">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body" style="text-align: center; padding: 30px 20px;">
                            <div style="font-size: 4rem; margin-bottom: 16px;">🗑️</div>
                            <h4 style="margin-bottom: 8px; color: var(--dark);">Are you sure?</h4>
                            <p style="color: var(--gray); margin-bottom: 20px;">
                                This action cannot be undone. This will permanently delete this dream and all its branches.
                            </p>
                            <div id="dreamDeletePreview" style="background: rgba(0,0,0,0.03); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                                <p style="margin: 0; font-weight: 500;" id="dreamDeleteTitle">Loading...</p>
                            </div>
                            <div style="display: flex; gap: 12px; justify-content: center;">
                                <button class="btn btn-ghost" id="dreamDeleteCancelBtn">Cancel</button>
                                <button class="btn btn-danger" id="dreamDeleteConfirmBtn">
                                    <i class="fas fa-trash"></i> Delete Permanently
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Toast Notification -->
                <div id="dreamToast" class="dream-toast">
                    <i class="fas fa-check-circle" style="color: var(--success);"></i>
                    <span id="dreamToastMessage">Dream planted!</span>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.animateLeaves();
        this.addInteractions();
        return this.container;
    }

    getFlatTreeOptions() {
        let options = '';
        const flatten = (nodes, prefix = '') => {
            nodes.forEach(node => {
                options += `<option value="${node.id}">${prefix}${node.title}</option>`;
                if (node.children) {
                    flatten(node.children, prefix + '— ');
                }
            });
        };
        flatten(this.treeData);
        return options;
    }

    renderTree(nodes, level = 0, parentId = null) {
        if (!nodes || nodes.length === 0) return '';

        return nodes.map((node, index) => `
            <div class="tree-node-wrapper" style="--level: ${level}; --index: ${index};">
                <div class="tree-node" data-id="${node.id}" data-status="${node.status}" data-progress="${node.progress || 0}">
                    <div class="tree-node-connector ${level > 0 ? 'show' : ''}"></div>
                    <div class="tree-node-content ${node.status === 'completed' ? 'completed' : node.status === 'in_progress' ? 'in-progress' : 'pending'}" 
                         style="--node-color: ${this.getStatusColor(node.status)};">
                        <div class="tree-node-icon">
                            ${this.getStatusIcon(node.status)}
                        </div>
                        <div class="tree-node-info">
                            <div class="tree-node-header">
                                <span class="tree-node-title">${node.title}</span>
                                <span class="tree-node-status" style="background: ${this.getStatusColor(node.status)}20; color: ${this.getStatusColor(node.status)};">
                                    ${this.getStatusLabel(node.status)}
                                </span>
                            </div>
                            ${node.description ? `<p class="tree-node-description">${node.description}</p>` : ''}
                            <div class="tree-node-progress">
                                <div class="tree-node-progress-bar">
                                    <div class="tree-node-progress-fill" style="width: ${node.progress || 0}%; background: ${this.getStatusColor(node.status)};"></div>
                                </div>
                                <span class="tree-node-progress-text">${node.progress || 0}%</span>
                            </div>
                            ${node.children && node.children.length > 0 ? `
                                <div class="tree-node-children-count">
                                    <i class="fas fa-branch"></i> ${node.children.length} branches
                                </div>
                            ` : ''}
                        </div>
                        <div class="tree-node-actions">
                            <button class="btn btn-ghost btn-sm dream-toggle-node" data-id="${node.id}" title="Toggle children">
                                <i class="fas ${node.children && node.children.length > 0 ? 'fa-chevron-down' : 'fa-circle'}"></i>
                            </button>
                            <button class="btn btn-ghost btn-sm dream-edit-node" data-id="${node.id}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-ghost btn-sm dream-delete-node" data-id="${node.id}" title="Delete">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
                ${node.children && node.children.length > 0 ? `
                    <div class="tree-children" id="dreamChildren-${node.id}">
                        ${this.renderTree(node.children, level + 1, node.id)}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    getFilteredData() {
        if (this.currentStatusFilter === 'all' && this.currentProgressFilter === 'all') {
            return this.treeData;
        }

        const filterNodes = (nodes) => {
            return nodes.map(node => {
                const filteredChildren = node.children ? filterNodes(node.children) : [];
                const matchesStatus = this.currentStatusFilter === 'all' || node.status === this.currentStatusFilter;
                const matchesProgress = this.currentProgressFilter === 'all' || 
                    (this.currentProgressFilter === 'high' && node.progress >= 70) ||
                    (this.currentProgressFilter === 'medium' && node.progress >= 30 && node.progress < 70) ||
                    (this.currentProgressFilter === 'low' && node.progress < 30);
                
                const hasMatchingChildren = filteredChildren.length > 0;
                
                if (matchesStatus && matchesProgress) {
                    return { ...node, children: filteredChildren };
                } else if (hasMatchingChildren) {
                    return { ...node, children: filteredChildren };
                }
                return null;
            }).filter(Boolean);
        };

        return filterNodes(this.treeData);
    }

    getStatusColor(status) {
        const colors = {
            'completed': '#00B894',
            'in_progress': '#FDCB6E',
            'pending': '#636E72'
        };
        return colors[status] || '#636E72';
    }

    getStatusIcon(status) {
        const icons = {
            'completed': '✅',
            'in_progress': '🌱',
            'pending': '🌰'
        };
        return icons[status] || '🌱';
    }

    getStatusLabel(status) {
        const labels = {
            'completed': 'Bloomed',
            'in_progress': 'Growing',
            'pending': 'Seed'
        };
        return labels[status] || status;
    }

    getTotalGoals() {
        let count = 0;
        const countNodes = (nodes) => {
            nodes.forEach(node => {
                count++;
                if (node.children) countNodes(node.children);
            });
        };
        countNodes(this.treeData);
        return count;
    }

    getCompletedCount() {
        let count = 0;
        const countNodes = (nodes) => {
            nodes.forEach(node => {
                if (node.status === 'completed') count++;
                if (node.children) countNodes(node.children);
            });
        };
        countNodes(this.treeData);
        return count;
    }

    getInProgressCount() {
        let count = 0;
        const countNodes = (nodes) => {
            nodes.forEach(node => {
                if (node.status === 'in_progress') count++;
                if (node.children) countNodes(node.children);
            });
        };
        countNodes(this.treeData);
        return count;
    }

    getPendingCount() {
        let count = 0;
        const countNodes = (nodes) => {
            nodes.forEach(node => {
                if (node.status === 'pending') count++;
                if (node.children) countNodes(node.children);
            });
        };
        countNodes(this.treeData);
        return count;
    }

    getOverallProgress() {
        const total = this.getTotalGoals();
        if (total === 0) return 0;
        let sum = 0;
        const sumProgress = (nodes) => {
            nodes.forEach(node => {
                sum += node.progress || 0;
                if (node.children) sumProgress(node.children);
            });
        };
        sumProgress(this.treeData);
        return sum / total;
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

    // ============ DREAM MODAL FUNCTIONS ============

    showAddDreamModal() {
        this.editingNodeId = null;
        this.formData = {};
        document.getElementById('dreamModalTitle').innerHTML = `
            <i class="fas fa-plus-circle" style="color: var(--primary);"></i>
            Plant a New Dream
        `;
        document.getElementById('dreamModalSaveText').textContent = 'Plant Dream';
        
        document.getElementById('dreamTitleInput').value = '';
        document.getElementById('dreamDescriptionInput').value = '';
        document.getElementById('dreamStatusInput').value = 'pending';
        document.getElementById('dreamProgressInput').value = '0';
        document.getElementById('dreamParentInput').value = 'none';
        
        // Refresh parent options
        document.getElementById('dreamParentInput').innerHTML = `
            <option value="none">None (Root Dream)</option>
            ${this.getFlatTreeOptions()}
        `;
        
        document.getElementById('dreamModal').style.display = 'block';
        setTimeout(() => {
            document.getElementById('dreamTitleInput').focus();
        }, 300);
    }

    showEditDreamModal(id) {
        const findNode = (nodes) => {
            for (let node of nodes) {
                if (node.id === id) return node;
                if (node.children) {
                    const found = findNode(node.children);
                    if (found) return found;
                }
            }
            return null;
        };

        const node = findNode(this.treeData);
        if (!node) return;
        
        this.editingNodeId = id;
        this.formData = {};
        document.getElementById('dreamModalTitle').innerHTML = `
            <i class="fas fa-edit" style="color: var(--primary);"></i>
            Edit Dream
        `;
        document.getElementById('dreamModalSaveText').textContent = 'Update Dream';
        
        document.getElementById('dreamTitleInput').value = node.title.replace(/^[^\s]+\s/, '');
        document.getElementById('dreamDescriptionInput').value = node.description || '';
        document.getElementById('dreamStatusInput').value = node.status;
        document.getElementById('dreamProgressInput').value = node.progress || 0;
        document.getElementById('dreamParentInput').value = 'none';
        
        document.getElementById('dreamModal').style.display = 'block';
        setTimeout(() => {
            document.getElementById('dreamTitleInput').focus();
        }, 300);
    }

    closeDreamModal() {
        document.getElementById('dreamModal').style.display = 'none';
        this.editingNodeId = null;
        this.formData = {};
    }

    closeDeleteModal() {
        document.getElementById('dreamDeleteModal').style.display = 'none';
        this.deleteTargetId = null;
    }

    showDeleteModal(id) {
        const findNode = (nodes) => {
            for (let node of nodes) {
                if (node.id === id) return node;
                if (node.children) {
                    const found = findNode(node.children);
                    if (found) return found;
                }
            }
            return null;
        };

        const node = findNode(this.treeData);
        if (!node) return;
        
        this.deleteTargetId = id;
        document.getElementById('dreamDeleteTitle').textContent = node.title;
        document.getElementById('dreamDeleteModal').style.display = 'block';
    }

    async confirmDelete() {
        if (!this.deleteTargetId) return;
        
        // Delete the goal from backend
        const result = await this.apiRequest(`/${this.deleteTargetId}`, 'DELETE');
        if (result) {
            this.closeDeleteModal();
            await this.loadTreeData();
            this.applyFilters();
            this.showToast('🗑️ Dream removed from your forest', 'warning');
        }
    }

    async saveDream() {
        this.formData = {
            title: document.getElementById('dreamTitleInput').value.trim(),
            description: document.getElementById('dreamDescriptionInput').value.trim(),
            status: document.getElementById('dreamStatusInput').value,
            progress: parseInt(document.getElementById('dreamProgressInput').value) || 0,
            parentId: document.getElementById('dreamParentInput').value
        };

        const title = this.formData.title;
        const description = this.formData.description;
        const status = this.formData.status;
        const progress = this.formData.progress;
        const parentId = this.formData.parentId;

        if (!title) {
            document.getElementById('dreamTitleInput').style.borderColor = 'var(--danger)';
            this.showToast('⚠️ Please enter a dream title', 'error');
            setTimeout(() => {
                document.getElementById('dreamTitleInput').style.borderColor = '';
            }, 2000);
            return;
        }

        const goalData = {
            title: title,
            description: description || '',
            status: status,
            progress: Math.min(100, Math.max(0, progress)),
            is_legacy: true,
            parent_goal_id: parentId !== 'none' ? parseInt(parentId) : null
        };

        let result;
        if (this.editingNodeId) {
            result = await this.apiRequest(`/${this.editingNodeId}`, 'PUT', goalData);
            if (result) {
                this.showToast('✅ Dream updated successfully!', 'success');
            }
        } else {
            result = await this.apiRequest('/', 'POST', goalData);
            if (result) {
                this.showToast('🌱 New dream planted! Watch it grow!', 'success');
            }
        }

        if (result) {
            this.closeDreamModal();
            await this.loadTreeData();
            this.applyFilters();
        }
    }

    // ============ NODE ACTIONS ============

    async deleteNode(id) {
        this.showDeleteModal(id);
    }

    toggleNode(id) {
        const children = document.getElementById(`dreamChildren-${id}`);
        const icon = document.querySelector(`.dream-toggle-node[data-id="${id}"] i`);
        if (children) {
            children.classList.toggle('expanded');
            if (icon) {
                icon.className = children.classList.contains('expanded') ? 'fas fa-chevron-down' : 'fas fa-chevron-right';
            }
        }
    }

    // ============ UTILITY FUNCTIONS ============

    setupEventListeners() {
        // Add Dream button
        const addBtn = document.getElementById('dreamAddGoalBtn');
        if (addBtn) {
            addBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.showAddDreamModal();
            });
        }

        // Status filter buttons
        document.querySelectorAll('#dreamStatusFilters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#dreamStatusFilters .filter-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                this.currentStatusFilter = btn.dataset.filter;
                this.applyFilters();
            });
        });

        // Progress filter buttons
        document.querySelectorAll('#dreamProgressFilters .filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#dreamProgressFilters .filter-btn').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                this.currentProgressFilter = btn.dataset.progress;
                this.applyFilters();
            });
        });

        // Modal close buttons
        document.getElementById('dreamModalClose')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDreamModal();
        });

        document.getElementById('dreamModalCancelBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDreamModal();
        });

        // Delete modal close buttons
        document.getElementById('dreamDeleteClose')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDeleteModal();
        });

        document.getElementById('dreamDeleteCancelBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeDeleteModal();
        });

        document.getElementById('dreamDeleteConfirmBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.confirmDelete();
        });

        // Click outside modals
        document.getElementById('dreamModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeDreamModal();
            }
        });

        document.getElementById('dreamDeleteModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.closeDeleteModal();
            }
        });

        // Save dream button
        document.getElementById('dreamModalSaveBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.saveDream();
        });

        // Enter key to save
        document.addEventListener('keydown', (e) => {
            const modal = document.getElementById('dreamModal');
            if (e.key === 'Enter' && modal && modal.style.display !== 'none') {
                e.preventDefault();
                this.saveDream();
            }
            if (e.key === 'Escape') {
                if (document.getElementById('dreamModal').style.display !== 'none') {
                    this.closeDreamModal();
                }
                if (document.getElementById('dreamDeleteModal').style.display !== 'none') {
                    this.closeDeleteModal();
                }
            }
        });

        // Tree actions (event delegation)
        document.querySelector('#dreamTreeContainer')?.addEventListener('click', (e) => {
            const toggleBtn = e.target.closest('.dream-toggle-node');
            const editBtn = e.target.closest('.dream-edit-node');
            const deleteBtn = e.target.closest('.dream-delete-node');
            const nodeContent = e.target.closest('.tree-node-content');
            
            if (toggleBtn) {
                e.preventDefault();
                const id = parseInt(toggleBtn.dataset.id);
                this.toggleNode(id);
            }
            
            if (editBtn) {
                e.preventDefault();
                const id = parseInt(editBtn.dataset.id);
                this.showEditDreamModal(id);
            }
            
            if (deleteBtn) {
                e.preventDefault();
                const id = parseInt(deleteBtn.dataset.id);
                this.deleteNode(id);
            }
            
            if (nodeContent && !e.target.closest('.tree-node-actions')) {
                const node = nodeContent.closest('.tree-node');
                if (node) {
                    const id = parseInt(node.dataset.id);
                    this.toggleNode(id);
                }
            }
        });

        // Expand all
        document.getElementById('dreamExpandAllBtn')?.addEventListener('click', () => {
            document.querySelectorAll('.tree-children').forEach(el => {
                el.classList.add('expanded');
            });
            document.querySelectorAll('.dream-toggle-node i').forEach(el => {
                el.className = 'fas fa-chevron-down';
            });
        });

        // Collapse all
        document.getElementById('dreamCollapseAllBtn')?.addEventListener('click', () => {
            document.querySelectorAll('.tree-children').forEach(el => {
                el.classList.remove('expanded');
            });
            document.querySelectorAll('.dream-toggle-node i').forEach(el => {
                el.className = 'fas fa-chevron-right';
            });
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                this.showAddDreamModal();
            }
        });
    }

    applyFilters() {
        const container = document.getElementById('dreamTreeContainer');
        const filtered = this.getFilteredData();
        container.innerHTML = this.renderTree(filtered);
        this.addInteractions();
        this.animateLeaves();
    }

    animateLeaves() {
        const leaves = document.querySelectorAll('.leaf');
        leaves.forEach((leaf, index) => {
            leaf.style.animationDelay = `${index * 2}s`;
            leaf.style.animationDuration = `${8 + Math.random() * 4}s`;
        });
    }

    addInteractions() {
        document.querySelectorAll('.tree-node-content').forEach(node => {
            node.addEventListener('mouseenter', function() {
                this.style.transform = 'translateX(4px)';
                this.style.boxShadow = 'var(--shadow-hover)';
            });
            node.addEventListener('mouseleave', function() {
                this.style.transform = 'translateX(0)';
                this.style.boxShadow = 'var(--shadow)';
            });
        });

        document.querySelectorAll('.tree-children').forEach((el, index) => {
            if (index < 3) {
                el.classList.add('expanded');
            }
        });
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('dreamToast');
        const toastMessage = document.getElementById('dreamToastMessage');
        
        if (toast && toastMessage) {
            toastMessage.textContent = message;
            toast.className = 'dream-toast show';
            toast.style.borderLeftColor = type === 'error' ? 'var(--danger)' : type === 'warning' ? 'var(--warning)' : 'var(--success)';
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        } else if (window.showToast) {
            window.showToast('Dream Tree', message, type, 2500);
        } else {
            alert(message);
        }
    }
}

export default DreamTree;