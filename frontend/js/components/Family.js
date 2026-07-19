// js/components/Family.js
export class Family {
    constructor() {
        this.container = null;
        this.currentMemberId = null;
        this.apiBase = 'https://life-management-api.onrender.com/api/family';
        this.members = [];
        this.availableColors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#A29BFE', '#6C5CE7', '#00B894', '#E17055', '#FDCB6E', '#00CEC9', '#FD79A8'];
        this.token = localStorage.getItem('access_token');
        this.isLoading = false;
        this.uploadedPhotos = [];
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'];
        this.maxPhotosPerUpload = 10;
        this.deleteTargetId = null;
        
        // Image optimization settings
        this.imageSettings = {
            maxWidth: 1200,
            maxHeight: 1200,
            quality: 0.85,
            thumbnailWidth: 200,
            thumbnailHeight: 200
        };
    }

    // ============ IMAGE UTILITIES ============

    validateImage(file) {
        if (!this.allowedTypes.includes(file.type)) {
            this.showToast(`📁 Unsupported file type: ${file.type}. Please upload JPEG, PNG, GIF, or WebP.`, 'error');
            return false;
        }

        if (file.size > this.maxFileSize) {
            this.showToast(`📁 File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum size is 5MB.`, 'error');
            return false;
        }

        return true;
    }

    async optimizeImage(file, options = {}) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        const optimized = this.processImage(img, options);
                        resolve(optimized);
                    } catch (error) {
                        reject(error);
                    }
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    processImage(img, options = {}) {
        const {
            maxWidth = this.imageSettings.maxWidth,
            maxHeight = this.imageSettings.maxHeight,
            quality = this.imageSettings.quality,
            maintainAspectRatio = true,
            targetFormat = 'image/jpeg'
        } = options;

        let width = img.width;
        let height = img.height;

        if (maintainAspectRatio) {
            const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
        } else {
            width = Math.min(width, maxWidth);
            height = Math.min(height, maxHeight);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL(targetFormat, quality);

        return {
            dataUrl: dataUrl,
            width: width,
            height: height,
            originalWidth: img.width,
            originalHeight: img.height,
            format: targetFormat,
            quality: quality,
            aspectRatio: width / height
        };
    }

    async createThumbnail(file, options = {}) {
        const {
            width = this.imageSettings.thumbnailWidth,
            height = this.imageSettings.thumbnailHeight,
            quality = 0.7
        } = options;

        const optimized = await this.optimizeImage(file, {
            maxWidth: width,
            maxHeight: height,
            quality: quality,
            maintainAspectRatio: true
        });

        return optimized;
    }

    getImageDimensions(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    resolve({
                        width: img.width,
                        height: img.height,
                        aspectRatio: img.width / img.height,
                        fileSize: file.size,
                        fileType: file.type
                    });
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    isValidAspectRatio(width, height, minRatio = 0.1, maxRatio = 10) {
        const ratio = width / height;
        return ratio >= minRatio && ratio <= maxRatio;
    }

    // ============ API METHODS ============

    async loadMembers() {
        if (this.isLoading) return;
        this.isLoading = true;

        try {
            const response = await fetch(`${this.apiBase}/members`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.members = data.map(member => ({
                    ...member,
                    gallery: [],
                    memories: []
                }));
                
                // Load gallery for each member
                for (let member of this.members) {
                    try {
                        const galleryResponse = await fetch(`${this.apiBase}/members/${member.id}/gallery`, {
                            headers: { 'Authorization': `Bearer ${this.token}` }
                        });
                        if (galleryResponse.ok) {
                            const galleryData = await galleryResponse.json();
                            member.gallery = galleryData.map(item => ({
                                id: item.id,
                                title: item.title || item.photo_title || 'Untitled',
                                description: item.description || item.photo_description || '',
                                photo: item.media_url || item.photo_url || item.photo || null,
                                date: item.date || item.photo_date || new Date().toISOString().split('T')[0],
                                story: item.description || item.story || '',
                                width: item.width || null,
                                height: item.height || null,
                                memberId: member.id,
                                created_at: item.created_at
                            }));
                            // Log successful load
                            console.log(`📷 Loaded ${member.gallery.length} photos for ${member.name}`);
                        }
                    } catch (error) {
                        console.error(`Error loading gallery for ${member.name}:`, error);
                    }
                }
            } else if (response.status === 401) {
                this.showToast('Session expired. Please login again.', 'error');
                setTimeout(() => window.location.href = '/login.html', 1500);
            } else {
                this.members = [];
            }
        } catch (error) {
            console.error('Error loading members:', error);
            this.showToast('Network error loading family members', 'error');
            this.members = [];
        } finally {
            this.isLoading = false;
        }
    }

    async loadMemberGallery(memberId) {
        try {
            const response = await fetch(`${this.apiBase}/members/${memberId}/gallery`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.map(item => ({
                    id: item.id,
                    title: item.title || item.photo_title || 'Untitled',
                    description: item.description || item.photo_description || '',
                    photo: item.media_url || item.photo_url || item.photo || null,
                    date: item.date || item.photo_date || new Date().toISOString().split('T')[0],
                    story: item.description || item.story || '',
                    width: item.width || null,
                    height: item.height || null,
                    memberId: memberId,
                    created_at: item.created_at
                }));
            }
            return [];
        } catch (error) {
            console.error('Error loading gallery:', error);
            return [];
        }
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
                setTimeout(() => window.location.href = '/login.html', 1500);
                return null;
            }
            
            const result = await response.json();
            
            if (!response.ok) {
                this.showToast(result.error || 'API request failed', 'error');
                return null;
            }
            
            console.log('✅ API Response:', result);
            return result;
        } catch (error) {
            console.error('API Error:', error);
            this.showToast('🌐 Network error. Please try again.', 'error');
            return null;
        }
    }

    // ============ GALLERY ACTIONS ============

    async deleteGalleryPhoto(photoId, memberId) {
        if (!confirm('Are you sure you want to delete this photo?')) return;
        
        try {
            const response = await fetch(`${this.apiBase}/memories/${photoId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                this.showToast('🗑️ Photo deleted successfully', 'success');
                // Reload gallery
                const member = this.members.find(m => m.id === memberId);
                if (member) {
                    const galleryData = await this.loadMemberGallery(memberId);
                    member.gallery = galleryData;
                    // Refresh the gallery view
                    this.showGallery(memberId);
                    // Update the member card count
                    this.updateMemberCardCount(memberId);
                }
            } else {
                const error = await response.json();
                this.showToast(error.error || 'Failed to delete photo', 'error');
            }
        } catch (error) {
            console.error('Error deleting photo:', error);
            this.showToast('🌐 Network error. Please try again.', 'error');
        }
    }

    async downloadPhoto(photoData, title) {
        try {
            // Create a temporary link
            const link = document.createElement('a');
            link.href = photoData;
            link.download = `${title || 'family-photo'}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            this.showToast('📥 Photo downloaded successfully!', 'success');
        } catch (error) {
            console.error('Error downloading photo:', error);
            this.showToast('❌ Error downloading photo', 'error');
        }
    }

    updateMemberCardCount(memberId) {
        const member = this.members.find(m => m.id === memberId);
        if (member) {
            const card = document.querySelector(`.family-card[data-id="${memberId}"]`);
            if (card) {
                const countBadge = card.querySelector('.family-card-gallery-count');
                if (countBadge) {
                    countBadge.innerHTML = `<i class="fas fa-images"></i> ${member.gallery ? member.gallery.length : 0}`;
                }
                const galleryBtn = card.querySelector('.view-gallery');
                if (galleryBtn) {
                    galleryBtn.innerHTML = `<i class="fas fa-images"></i> Gallery (${member.gallery ? member.gallery.length : 0})`;
                }
            }
        }
    }

    // ============ RENDER ============

    async render() {
        await this.loadMembers();
        
        this.container = document.getElementById('page-content');
        this.container.innerHTML = `
            <div class="family-container">
                <!-- Background Animation -->
                <div class="family-bg-animation">
                    <div class="family-orb family-orb-1"></div>
                    <div class="family-orb family-orb-2"></div>
                    <div class="family-orb family-orb-3"></div>
                    <div class="family-orb family-orb-4"></div>
                </div>

                <!-- Header -->
                ${this.renderHeader()}
                
                <!-- Stats -->
                ${this.renderStats()}
                
                <!-- Family Grid -->
                <div class="family-grid">
                    ${this.members.length > 0 ? 
                        this.members.map((member, index) => this.renderMemberCard(member, index)).join('') :
                        this.renderEmptyState()
                    }
                </div>

                <!-- All Modals -->
                ${this.renderAddMemberModal()}
                ${this.renderEditMemberModal()}
                ${this.renderPhotoUploadModal()}
                ${this.renderProfileModal()}
                ${this.renderGalleryModal()}
                ${this.renderDeleteConfirmModal()}
                ${this.renderToast()}

                <!-- Floating Action Button -->
                <button class="fab-btn" id="familyFabBtn" aria-label="Add Family Member">
                    <i class="fas fa-user-plus"></i>
                </button>
            </div>
        `;

        this.setupEventListeners();
        this.animateCards();
        this.setupPhotoUpload();
        this.setupMemberPhotoUpload();
        this.setupColorSelectors();
        this.setupAgeCalculation();
        
        return this.container;
    }

    // ============ RENDER HELPERS ============

    renderHeader() {
        return `
            <header class="family-header glass-card fade-in-up">
                <div class="family-header-content">
                    <div>
                        <div class="family-badge">
                            <span class="family-badge-icon">👨‍👩‍👧‍👦</span>
                            <span class="family-badge-text">Family Legacy</span>
                        </div>
                        <h1 class="family-title">Our Family <span class="family-title-highlight">Story</span></h1>
                        <p class="family-subtitle">Preserving memories, celebrating love, and building our legacy together</p>
                    </div>
                    <div class="family-header-actions">
                        <button class="btn btn-primary btn-glow" id="addMemberBtn">
                            <i class="fas fa-user-plus"></i> <span>Add Member</span>
                        </button>
                        <button class="btn btn-outline" id="uploadPhotoBtn">
                            <i class="fas fa-camera"></i> <span>Upload Photo</span>
                        </button>
                    </div>
                </div>
            </header>
        `;
    }

    renderStats() {
        const totalMembers = this.members.length;
        const totalPhotos = this.members.reduce((acc, m) => acc + (m.gallery ? m.gallery.length : 0), 0);
        const totalMemories = this.members.reduce((acc, m) => acc + (m.memories ? m.memories.length : 0), 0);
        const withPhotos = this.members.filter(m => m.profile_photo).length;

        return `
            <div class="family-stats-wrapper glass-card" style="animation-delay: 0.1s;">
                <div class="family-stats-grid">
                    <div class="family-stat">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #6C5CE7, #A29BFE);">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <span class="family-stat-number">${totalMembers}</span>
                            <span class="family-stat-label">Family Members</span>
                        </div>
                    </div>
                    <div class="family-stat">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #00B894, #00CEC9);">
                            <i class="fas fa-images"></i>
                        </div>
                        <div class="stat-content">
                            <span class="family-stat-number" style="color: #00B894;">${totalPhotos}</span>
                            <span class="family-stat-label">📷 Photos</span>
                        </div>
                    </div>
                    <div class="family-stat">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #FD79A8, #E17055);">
                            <i class="fas fa-star"></i>
                        </div>
                        <div class="stat-content">
                            <span class="family-stat-number" style="color: #FD79A8;">${totalMemories}</span>
                            <span class="family-stat-label">Memories</span>
                        </div>
                    </div>
                    <div class="family-stat">
                        <div class="stat-icon" style="background: linear-gradient(135deg, #FFD700, #F4A460);">
                            <i class="fas fa-camera"></i>
                        </div>
                        <div class="stat-content">
                            <span class="family-stat-number" style="color: #FFD700;">${withPhotos}</span>
                            <span class="family-stat-label">With Photos</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderMemberCard(member, index) {
        const hasPhoto = member.profile_photo;
        const photoCount = member.gallery ? member.gallery.length : 0;
        
        return `
            <div class="family-card glass-card stagger-item" 
                 style="animation-delay: ${index * 0.08}s" 
                 data-id="${member.id}">
                <div class="family-card-glow" style="background: ${member.color || '#6C5CE7'}40;"></div>
                
                <div class="family-card-image" style="background: linear-gradient(135deg, ${member.color || '#6C5CE7'}20, ${member.color || '#6C5CE7'}05);">
                    <div class="family-avatar-wrapper">
                        <div class="family-avatar-ring" style="border-color: ${member.color || '#6C5CE7'};">
                            ${hasPhoto ? 
                                `<img src="${member.profile_photo}" alt="${member.name}" class="family-avatar-img">` :
                                `<div class="family-avatar-placeholder" style="background: ${member.color || '#6C5CE7'}30; color: ${member.color || '#6C5CE7'};">
                                    ${member.name.charAt(0).toUpperCase()}
                                </div>`
                            }
                        </div>
                        <div class="family-status-dot" style="background: ${member.color || '#6C5CE7'};"></div>
                    </div>
                    <div class="family-card-gallery-count">
                        <i class="fas fa-images"></i> ${photoCount}
                    </div>
                </div>
                
                <div class="family-card-body">
                    <h3 class="family-member-name">${member.name}</h3>
                    <p class="family-member-relationship">${member.relationship || 'Family Member'}</p>
                    
                    <div class="family-member-details">
                        <span class="family-detail">
                            <i class="fas fa-birthday-cake"></i> 
                            ${member.age ? `${member.age} years` : '?'}
                        </span>
                        <span class="family-detail">
                            <i class="fas fa-calendar-alt"></i> 
                            ${member.birthday ? new Date(member.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'Unknown'}
                        </span>
                    </div>
                    
                    <p class="family-member-quote">"${member.favorite_quote || 'Family is everything.'}"</p>
                    
                    <div class="family-card-actions">
                        <button class="btn btn-primary btn-sm view-profile" data-id="${member.id}">
                            <i class="fas fa-user"></i> View Story
                        </button>
                        <button class="btn btn-success btn-sm view-gallery" data-id="${member.id}">
                            <i class="fas fa-images"></i> Gallery (${photoCount})
                        </button>
                        <button class="btn btn-ghost btn-sm family-heart" data-id="${member.id}">
                            <i class="fas fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state glass-card" style="grid-column: 1 / -1; text-align: center; padding: 80px 40px;">
                <div class="empty-state-icon">👨‍👩‍👧‍👦</div>
                <h3 class="empty-state-title">No Family Members Yet</h3>
                <p class="empty-state-subtitle">Start building your family legacy by adding your first family member!</p>
                <button class="btn btn-primary btn-glow" id="emptyAddBtn">
                    <i class="fas fa-user-plus"></i> Add Your First Family Member
                </button>
            </div>
        `;
    }

    // ============ MODAL RENDERING ============

    renderDeleteConfirmModal() {
        return `
            <div id="familyDeleteConfirmModal" class="modal" style="display:none;">
                <div class="modal-overlay"></div>
                <div class="modal-content glass-card" style="max-width: 450px;">
                    <div class="modal-header" style="border-bottom: none; padding-bottom: 0;">
                        <h3 class="modal-title" style="color: var(--danger);">
                            <i class="fas fa-exclamation-triangle" style="color: var(--danger);"></i>
                            Delete Photo
                        </h3>
                        <button class="modal-close-btn" id="familyDeleteConfirmClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" style="text-align: center; padding: 30px 20px;">
                        <div style="font-size: 4rem; margin-bottom: 16px;">🗑️</div>
                        <h4 style="margin-bottom: 8px; color: var(--dark);">Are you sure?</h4>
                        <p style="color: var(--gray); margin-bottom: 20px;">
                            This action cannot be undone. This will permanently delete this photo.
                        </p>
                        <div id="familyDeletePreview" style="background: rgba(0,0,0,0.03); padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                            <p style="margin: 0; font-weight: 500;" id="familyDeleteTitle">Loading...</p>
                        </div>
                        <div style="display: flex; gap: 12px; justify-content: center;">
                            <button class="btn btn-ghost" id="familyDeleteCancelBtn">Cancel</button>
                            <button class="btn btn-danger" id="familyDeleteConfirmBtn">
                                <i class="fas fa-trash"></i> Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAddMemberModal() {
        return `
            <div id="familyAddMemberModal" class="modal" style="display:none;">
                <div class="modal-overlay"></div>
                <div class="modal-content glass-card modal-achievement">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class="fas fa-user-plus" style="color: var(--primary);"></i> 
                            Add Family Member
                        </h3>
                        <button class="modal-close-btn" id="familyAddMemberClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="familyAddMemberForm" class="family-form">
                            <div class="form-group">
                                <label>Member Name <span class="required">*</span></label>
                                <input type="text" id="familyMemberNameInput" class="form-control" 
                                       placeholder="Enter member name..." required>
                            </div>
                            
                            <div class="form-group">
                                <label>Relationship</label>
                                <input type="text" id="familyMemberRelationshipInput" class="form-control" 
                                       placeholder="e.g., Brother, Sister, Grandmother...">
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group" style="flex: 1;">
                                    <label>Birthday</label>
                                    <input type="date" id="familyMemberBirthdayInput" class="form-control">
                                    <small class="form-hint">Age will be calculated automatically</small>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label>Age</label>
                                    <input type="text" id="familyMemberAgeInput" class="form-control" 
                                           readonly placeholder="Auto-calculated">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Profile Photo</label>
                                <div class="photo-upload-area" id="familyMemberPhotoUpload">
                                    <div class="photo-preview-circle" id="familyMemberPhotoPreview">
                                        <i class="fas fa-camera" style="font-size: 2rem; color: var(--gray);"></i>
                                        <p style="font-size: 0.75rem; color: var(--gray); margin: 4px 0 0 0;">Upload Photo</p>
                                    </div>
                                    <input type="file" id="familyMemberPhotoInput" accept="image/*" style="display: none;">
                                    <div class="photo-upload-info">
                                        <small>Recommended: Square image, max 5MB</small>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Favorite Quote</label>
                                <input type="text" id="familyMemberQuoteInput" class="form-control" 
                                       placeholder="Enter a meaningful quote...">
                            </div>
                            
                            <div class="form-group">
                                <label>Story / Bio</label>
                                <textarea id="familyMemberStoryInput" class="form-control" rows="3" 
                                          placeholder="Tell their story..."></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label>Choose Color</label>
                                <div class="color-selector" id="familyColorSelector">
                                    ${this.availableColors.map(color => `
                                        <span class="color-option ${color === '#FF6B6B' ? 'selected' : ''}" 
                                              data-color="${color}" 
                                              style="background: ${color};"></span>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Life Lessons <small>(comma separated)</small></label>
                                <input type="text" id="familyMemberLessonsInput" class="form-control" 
                                       placeholder="e.g., Be kind, Work hard, Stay humble">
                            </div>
                            
                            <div class="form-group">
                                <label>Promise</label>
                                <input type="text" id="familyMemberPromiseInput" class="form-control" 
                                       placeholder="A promise to this family member...">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost" id="familyAddMemberCancelBtn">Cancel</button>
                        <button class="btn btn-primary" id="familyAddMemberSaveBtn">
                            <i class="fas fa-save"></i> Add Member
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderEditMemberModal() {
        return `
            <div id="familyEditMemberModal" class="modal" style="display:none;">
                <div class="modal-overlay"></div>
                <div class="modal-content glass-card modal-achievement">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class="fas fa-edit" style="color: var(--primary);"></i> 
                            Edit Member
                        </h3>
                        <button class="modal-close-btn" id="familyEditMemberClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="familyEditMemberForm" class="family-form">
                            <div class="form-group">
                                <label>Member Name <span class="required">*</span></label>
                                <input type="text" id="familyEditMemberNameInput" class="form-control" 
                                       placeholder="Enter member name..." required>
                            </div>
                            
                            <div class="form-group">
                                <label>Relationship</label>
                                <input type="text" id="familyEditMemberRelationshipInput" class="form-control" 
                                       placeholder="e.g., Brother, Sister, Grandmother...">
                            </div>
                            
                            <div class="form-row">
                                <div class="form-group" style="flex: 1;">
                                    <label>Birthday</label>
                                    <input type="date" id="familyEditMemberBirthdayInput" class="form-control">
                                    <small class="form-hint">Age will be calculated automatically</small>
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label>Age</label>
                                    <input type="text" id="familyEditMemberAgeInput" class="form-control" 
                                           readonly placeholder="Auto-calculated">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Profile Photo</label>
                                <div class="photo-upload-area" id="familyEditMemberPhotoUpload">
                                    <div class="photo-preview-circle" id="familyEditMemberPhotoPreview">
                                        <i class="fas fa-camera" style="font-size: 2rem; color: var(--gray);"></i>
                                        <p style="font-size: 0.75rem; color: var(--gray); margin: 4px 0 0 0;">Update Photo</p>
                                    </div>
                                    <input type="file" id="familyEditMemberPhotoInput" accept="image/*" style="display: none;">
                                    <div class="photo-upload-info">
                                        <small>Recommended: Square image, max 5MB</small>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Favorite Quote</label>
                                <input type="text" id="familyEditMemberQuoteInput" class="form-control" 
                                       placeholder="Enter a meaningful quote...">
                            </div>
                            
                            <div class="form-group">
                                <label>Story / Bio</label>
                                <textarea id="familyEditMemberStoryInput" class="form-control" rows="3" 
                                          placeholder="Tell their story..."></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label>Choose Color</label>
                                <div class="color-selector" id="familyEditColorSelector">
                                    ${this.availableColors.map(color => `
                                        <span class="color-option ${color === '#FF6B6B' ? 'selected' : ''}" 
                                              data-color="${color}" 
                                              style="background: ${color};"></span>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Life Lessons <small>(comma separated)</small></label>
                                <input type="text" id="familyEditMemberLessonsInput" class="form-control" 
                                       placeholder="e.g., Be kind, Work hard, Stay humble">
                            </div>
                            
                            <div class="form-group">
                                <label>Promise</label>
                                <input type="text" id="familyEditMemberPromiseInput" class="form-control" 
                                       placeholder="A promise to this family member...">
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost" id="familyEditMemberCancelBtn">Cancel</button>
                        <button class="btn btn-primary" id="familyEditMemberSaveBtn">
                            <i class="fas fa-save"></i> Save Changes
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderPhotoUploadModal() {
        return `
            <div id="familyPhotoUploadModal" class="modal" style="display:none;">
                <div class="modal-overlay"></div>
                <div class="modal-content glass-card modal-achievement">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class="fas fa-camera" style="color: var(--primary);"></i> 
                            Upload Family Photo
                        </h3>
                        <button class="modal-close-btn" id="familyPhotoUploadClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="familyPhotoUploadForm" class="family-form">
                            <div class="form-group">
                                <label>Select Family Member <span class="required">*</span></label>
                                <select id="familyUploadMemberSelect" class="form-control" required>
                                    <option value="">Select a family member...</option>
                                    ${this.members.map(m => 
                                        `<option value="${m.id}">${m.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label>Photo Title <span class="required">*</span></label>
                                <input type="text" id="familyPhotoTitle" class="form-control" 
                                       placeholder="Enter photo title..." required>
                            </div>
                            
                            <div class="form-group">
                                <label>Description / Story</label>
                                <textarea id="familyPhotoDescription" class="form-control" rows="3" 
                                          placeholder="Share the story behind this photo..."></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label>Date</label>
                                <input type="date" id="familyPhotoDate" class="form-control">
                            </div>
                            
                            <div class="form-group">
                                <label>Upload Photos <span class="required">*</span></label>
                                <div class="photo-drop-zone" id="familyPhotoDropZone">
                                    <i class="fas fa-cloud-upload-alt" style="font-size: 3rem; color: var(--primary);"></i>
                                    <p><strong>Drag & drop your photos here</strong></p>
                                    <p style="font-size: 0.85rem; color: var(--gray);">or click to browse</p>
                                    <p style="font-size: 0.75rem; color: var(--gray); margin-top: 8px;">
                                        <i class="fas fa-info-circle"></i> 
                                        Max ${this.maxPhotosPerUpload} photos, 5MB each. JPEG, PNG, GIF, WebP supported
                                    </p>
                                    <input type="file" id="familyPhotoFile" accept="image/*" multiple>
                                </div>
                                
                                <!-- Photo Preview Grid -->
                                <div id="familyPhotoPreviewContainer" class="photo-preview-grid">
                                    <!-- Dynamic previews will appear here -->
                                </div>
                                
                                <!-- Upload Progress -->
                                <div id="familyPhotoUploadProgress" class="upload-progress" style="display: none;">
                                    <div class="progress-bar">
                                        <div class="progress-fill" id="uploadProgressFill" style="width: 0%;"></div>
                                    </div>
                                    <span class="progress-text" id="uploadProgressText">0%</span>
                                </div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-ghost" id="familyPhotoUploadCancelBtn">Cancel</button>
                        <button class="btn btn-primary" id="familySavePhotoBtn">
                            <i class="fas fa-save"></i> <span id="familySavePhotoText">Upload Photos</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderProfileModal() {
        return `
            <div id="familyMemberModal" class="modal" style="display:none;">
                <div class="modal-overlay"></div>
                <div class="modal-content glass-card modal-large">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class="fas fa-user" style="color: var(--primary);"></i> 
                            Member Profile
                        </h3>
                        <button class="modal-close-btn" id="familyModalClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" id="familyModalBody">
                        <!-- Dynamic content -->
                    </div>
                </div>
            </div>
        `;
    }

    renderGalleryModal() {
        return `
            <div id="familyGalleryModal" class="modal" style="display:none;">
                <div class="modal-overlay"></div>
                <div class="modal-content glass-card modal-large">
                    <div class="modal-header">
                        <h3 class="modal-title">
                            <i class="fas fa-images" style="color: var(--primary);"></i> 
                            Photo Gallery
                        </h3>
                        <button class="modal-close-btn" id="familyGalleryModalClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body" id="familyGalleryBody">
                        <!-- Dynamic content -->
                    </div>
                </div>
            </div>
        `;
    }

    renderToast() {
        return `
            <div id="familyToast" class="family-toast">
                <div class="toast-icon">
                    <i class="fas fa-heart" style="color: #FF6B6B;"></i>
                </div>
                <div class="toast-content">
                    <span class="toast-title">Family</span>
                    <span class="toast-message" id="familyToastMessage">Family member added!</span>
                </div>
                <button class="toast-close-btn" id="familyToastClose">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }

    // ============ AGE CALCULATION ============

    setupAgeCalculation() {
        const birthdayInput = document.getElementById('familyMemberBirthdayInput');
        const ageInput = document.getElementById('familyMemberAgeInput');
        
        if (birthdayInput && ageInput) {
            birthdayInput.addEventListener('change', function() {
                ageInput.value = this.value ? calculateAge(this.value) : '';
            });
        }
        
        const editBirthdayInput = document.getElementById('familyEditMemberBirthdayInput');
        const editAgeInput = document.getElementById('familyEditMemberAgeInput');
        
        if (editBirthdayInput && editAgeInput) {
            editBirthdayInput.addEventListener('change', function() {
                editAgeInput.value = this.value ? calculateAge(this.value) : '';
            });
        }

        function calculateAge(birthDate) {
            const birth = new Date(birthDate);
            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const monthDiff = today.getMonth() - birth.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            return age > 0 ? age : '';
        }
    }

    // ============ PHOTO UPLOAD SETUP ============

    setupPhotoUpload() {
        const dropZone = document.getElementById('familyPhotoDropZone');
        const fileInput = document.getElementById('familyPhotoFile');

        if (!dropZone || !fileInput) return;

        this.uploadedPhotos = [];

        dropZone.addEventListener('click', () => fileInput.click());

        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            if (e.dataTransfer.files.length) {
                fileInput.files = e.dataTransfer.files;
                this.handlePhotoSelection(fileInput.files);
            }
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files.length) {
                this.handlePhotoSelection(fileInput.files);
            }
        });
    }

    async handlePhotoSelection(files) {
        const previewContainer = document.getElementById('familyPhotoPreviewContainer');
        if (!previewContainer) return;

        previewContainer.innerHTML = '';
        this.uploadedPhotos = [];

        if (files.length > this.maxPhotosPerUpload) {
            this.showToast(`📁 Maximum ${this.maxPhotosPerUpload} photos allowed`, 'error');
            return;
        }

        let validFiles = [];
        let invalidFiles = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (this.validateImage(file)) {
                validFiles.push(file);
            } else {
                invalidFiles.push(file.name);
            }
        }

        if (invalidFiles.length > 0) {
            this.showToast(`⚠️ ${invalidFiles.length} file(s) skipped: ${invalidFiles.join(', ')}`, 'warning');
        }

        if (validFiles.length === 0) {
            this.showToast('❌ No valid files to upload', 'error');
            return;
        }

        const progressBar = document.getElementById('familyPhotoUploadProgress');
        if (progressBar) progressBar.style.display = 'block';

        for (let i = 0; i < validFiles.length; i++) {
            try {
                const file = validFiles[i];
                
                const progress = ((i + 1) / validFiles.length) * 100;
                this.updateUploadProgress(progress, `Processing ${i + 1}/${validFiles.length}`);

                const dimensions = await this.getImageDimensions(file);
                
                if (!this.isValidAspectRatio(dimensions.width, dimensions.height)) {
                    this.showToast(`⚠️ Image ${file.name} has unusual aspect ratio. Using as-is.`, 'warning');
                }

                const optimized = await this.optimizeImage(file, {
                    maxWidth: this.imageSettings.maxWidth,
                    maxHeight: this.imageSettings.maxHeight,
                    quality: this.imageSettings.quality
                });

                const thumbnail = await this.createThumbnail(file);

                this.uploadedPhotos.push({
                    file: file,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    dataUrl: optimized.dataUrl,
                    thumbnail: thumbnail.dataUrl,
                    width: optimized.width,
                    height: optimized.height,
                    aspectRatio: optimized.aspectRatio,
                    originalWidth: dimensions.width,
                    originalHeight: dimensions.height
                });

                this.createPhotoPreview(optimized.dataUrl, file.name, i);

            } catch (error) {
                console.error('Error processing photo:', error);
                this.showToast(`❌ Error processing ${file.name}`, 'error');
            }
        }

        if (progressBar) {
            setTimeout(() => {
                progressBar.style.display = 'none';
                this.updateUploadProgress(0, '');
            }, 500);
        }

        const saveBtn = document.getElementById('familySavePhotoText');
        if (saveBtn) {
            saveBtn.textContent = `Upload ${this.uploadedPhotos.length} Photo${this.uploadedPhotos.length > 1 ? 's' : ''}`;
        }

        if (this.uploadedPhotos.length > 0) {
            this.showToast(`✅ ${this.uploadedPhotos.length} photo(s) ready to upload`, 'success');
        }
    }

    createPhotoPreview(dataUrl, fileName, index) {
        const container = document.getElementById('familyPhotoPreviewContainer');
        if (!container) return;

        const preview = document.createElement('div');
        preview.className = 'photo-preview-item';
        preview.style.animationDelay = `${index * 0.1}s`;
        preview.innerHTML = `
            <div class="photo-preview-image">
                <img src="${dataUrl}" alt="${fileName}">
                <div class="photo-preview-overlay">
                    <span class="photo-preview-name">${fileName}</span>
                    <button class="photo-preview-remove" data-index="${index}" title="Remove">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;

        preview.querySelector('.photo-preview-remove').addEventListener('click', (e) => {
            e.stopPropagation();
            this.removePhoto(index);
        });

        container.appendChild(preview);
    }

    removePhoto(index) {
        this.uploadedPhotos.splice(index, 1);
        this.renderPhotoPreviews();

        const saveBtn = document.getElementById('familySavePhotoText');
        if (saveBtn) {
            saveBtn.textContent = this.uploadedPhotos.length > 0 
                ? `Upload ${this.uploadedPhotos.length} Photo${this.uploadedPhotos.length > 1 ? 's' : ''}`
                : 'Upload Photos';
        }

        if (this.uploadedPhotos.length === 0) {
            this.showToast('📷 All photos removed', 'info');
        }
    }

    renderPhotoPreviews() {
        const container = document.getElementById('familyPhotoPreviewContainer');
        if (!container) return;

        container.innerHTML = '';
        this.uploadedPhotos.forEach((photo, index) => {
            this.createPhotoPreview(photo.dataUrl, photo.name, index);
        });
    }

    updateUploadProgress(percentage, text) {
        const fill = document.getElementById('uploadProgressFill');
        const textEl = document.getElementById('uploadProgressText');
        
        if (fill) fill.style.width = `${percentage}%`;
        if (textEl) textEl.textContent = text || `${Math.round(percentage)}%`;
    }

    // ============ MEMBER PHOTO UPLOAD ============

    setupMemberPhotoUpload() {
        const uploadArea = document.getElementById('familyMemberPhotoUpload');
        const fileInput = document.getElementById('familyMemberPhotoInput');
        const preview = document.getElementById('familyMemberPhotoPreview');

        if (uploadArea && fileInput && preview) {
            uploadArea.addEventListener('click', () => fileInput.click());
            
            fileInput.addEventListener('change', async (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    
                    if (!this.validateImage(file)) {
                        fileInput.value = '';
                        return;
                    }

                    try {
                        const optimized = await this.optimizeImage(file, {
                            maxWidth: 400,
                            maxHeight: 400,
                            quality: 0.8
                        });
                        
                        preview.innerHTML = `
                            <img src="${optimized.dataUrl}" alt="Profile" 
                                 style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                        `;
                        preview.dataset.photo = optimized.dataUrl;
                        
                        this.showToast('✅ Photo uploaded successfully', 'success');
                    } catch (error) {
                        console.error('Error processing profile photo:', error);
                        this.showToast('❌ Error processing photo', 'error');
                        fileInput.value = '';
                    }
                }
            });
        }

        const editUploadArea = document.getElementById('familyEditMemberPhotoUpload');
        const editFileInput = document.getElementById('familyEditMemberPhotoInput');
        const editPreview = document.getElementById('familyEditMemberPhotoPreview');

        if (editUploadArea && editFileInput && editPreview) {
            editUploadArea.addEventListener('click', () => editFileInput.click());
            
            editFileInput.addEventListener('change', async (e) => {
                if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    
                    if (!this.validateImage(file)) {
                        editFileInput.value = '';
                        return;
                    }

                    try {
                        const optimized = await this.optimizeImage(file, {
                            maxWidth: 400,
                            maxHeight: 400,
                            quality: 0.8
                        });
                        
                        editPreview.innerHTML = `
                            <img src="${optimized.dataUrl}" alt="Profile" 
                                 style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                        `;
                        editPreview.dataset.photo = optimized.dataUrl;
                        
                        this.showToast('✅ Photo updated successfully', 'success');
                    } catch (error) {
                        console.error('Error processing profile photo:', error);
                        this.showToast('❌ Error processing photo', 'error');
                        editFileInput.value = '';
                    }
                }
            });
        }
    }

    // ============ COLOR SELECTORS ============

    setupColorSelectors() {
        document.querySelectorAll('#familyColorSelector .color-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('#familyColorSelector .color-option').forEach(o => 
                    o.classList.remove('selected')
                );
                this.classList.add('selected');
            });
        });

        document.querySelectorAll('#familyEditColorSelector .color-option').forEach(option => {
            option.addEventListener('click', function() {
                document.querySelectorAll('#familyEditColorSelector .color-option').forEach(o => 
                    o.classList.remove('selected')
                );
                this.classList.add('selected');
            });
        });
    }

    // ============ MEMBER CRUD ============

    showAddMemberModal() {
        document.getElementById('familyMemberNameInput').value = '';
        document.getElementById('familyMemberRelationshipInput').value = '';
        document.getElementById('familyMemberBirthdayInput').value = '';
        document.getElementById('familyMemberAgeInput').value = '';
        document.getElementById('familyMemberQuoteInput').value = '';
        document.getElementById('familyMemberStoryInput').value = '';
        document.getElementById('familyMemberLessonsInput').value = '';
        document.getElementById('familyMemberPromiseInput').value = '';

        const preview = document.getElementById('familyMemberPhotoPreview');
        if (preview) {
            preview.innerHTML = `
                <i class="fas fa-camera" style="font-size: 2rem; color: var(--gray);"></i>
                <p style="font-size: 0.75rem; color: var(--gray); margin: 4px 0 0 0;">Upload Photo</p>
            `;
            delete preview.dataset.photo;
        }
        document.getElementById('familyMemberPhotoInput').value = '';

        document.querySelectorAll('#familyColorSelector .color-option').forEach((el, index) => {
            el.classList.toggle('selected', index === 0);
        });

        this.openModal('familyAddMemberModal');
        setTimeout(() => document.getElementById('familyMemberNameInput').focus(), 300);
    }

    async saveNewMember() {
        const name = document.getElementById('familyMemberNameInput').value.trim();
        const relationship = document.getElementById('familyMemberRelationshipInput').value.trim() || 'Family Member';
        const birthday = document.getElementById('familyMemberBirthdayInput').value || null;
        const favorite_quote = document.getElementById('familyMemberQuoteInput').value.trim() || 'Family is everything.';
        const story = document.getElementById('familyMemberStoryInput').value.trim() || '';
        const lessonsInput = document.getElementById('familyMemberLessonsInput').value.trim();
        const promise = document.getElementById('familyMemberPromiseInput').value.trim() || 'I promise to always be there for you.';

        if (!name) {
            const input = document.getElementById('familyMemberNameInput');
            input.style.borderColor = 'var(--danger)';
            input.classList.add('shake');
            this.showToast('❌ Please enter a member name', 'error');
            setTimeout(() => {
                input.style.borderColor = '';
                input.classList.remove('shake');
            }, 2000);
            return;
        }

        const selectedColor = document.querySelector('#familyColorSelector .color-option.selected');
        const color = selectedColor ? selectedColor.dataset.color : '#6C5CE7';

        const preview = document.getElementById('familyMemberPhotoPreview');
        const profile_photo = preview && preview.dataset.photo ? preview.dataset.photo : null;

        const life_lessons = lessonsInput ? lessonsInput.split(',').map(l => l.trim()).filter(l => l) : [];

        const data = {
            name,
            relationship,
            birthday,
            favorite_quote,
            story,
            life_lessons,
            promise,
            profile_photo,
            color
        };

        Object.keys(data).forEach(key => {
            if (data[key] === undefined || data[key] === null || data[key] === '') {
                delete data[key];
            }
        });

        const result = await this.apiRequest('/members', 'POST', data);
        
        if (result && result.id) {
            this.closeModal('familyAddMemberModal');
            await this.loadMembers();
            await this.render();
            this.showToast(`🎉 Welcome to the family, ${name}!`, 'success');
            this.celebrate();
        }
    }

    showEditMemberModal(id) {
        const member = this.members.find(m => m.id === id);
        if (!member) return;

        document.getElementById('familyEditMemberNameInput').value = member.name || '';
        document.getElementById('familyEditMemberRelationshipInput').value = member.relationship || '';
        document.getElementById('familyEditMemberBirthdayInput').value = member.birthday || '';
        document.getElementById('familyEditMemberAgeInput').value = member.age || '';
        document.getElementById('familyEditMemberQuoteInput').value = member.favorite_quote || '';
        document.getElementById('familyEditMemberStoryInput').value = member.story || '';
        document.getElementById('familyEditMemberLessonsInput').value = (member.life_lessons || []).join(', ');
        document.getElementById('familyEditMemberPromiseInput').value = member.promise || '';

        const preview = document.getElementById('familyEditMemberPhotoPreview');
        if (preview) {
            if (member.profile_photo) {
                preview.innerHTML = `
                    <img src="${member.profile_photo}" alt="Profile" 
                         style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">
                `;
                preview.dataset.photo = member.profile_photo;
            } else {
                preview.innerHTML = `
                    <i class="fas fa-camera" style="font-size: 2rem; color: var(--gray);"></i>
                    <p style="font-size: 0.75rem; color: var(--gray); margin: 4px 0 0 0;">Update Photo</p>
                `;
                delete preview.dataset.photo;
            }
        }
        document.getElementById('familyEditMemberPhotoInput').value = '';

        document.querySelectorAll('#familyEditColorSelector .color-option').forEach(el => {
            el.classList.toggle('selected', el.dataset.color === member.color);
        });

        document.getElementById('familyEditMemberModal').dataset.id = id;
        this.openModal('familyEditMemberModal');
        setTimeout(() => document.getElementById('familyEditMemberNameInput').focus(), 300);
    }

    async saveEditMember() {
        const id = parseInt(document.getElementById('familyEditMemberModal').dataset.id);
        
        const name = document.getElementById('familyEditMemberNameInput').value.trim();
        const relationship = document.getElementById('familyEditMemberRelationshipInput').value.trim() || 'Family Member';
        const birthday = document.getElementById('familyEditMemberBirthdayInput').value || null;
        const favorite_quote = document.getElementById('familyEditMemberQuoteInput').value.trim() || 'Family is everything.';
        const story = document.getElementById('familyEditMemberStoryInput').value.trim() || '';
        const lessonsInput = document.getElementById('familyEditMemberLessonsInput').value.trim();
        const promise = document.getElementById('familyEditMemberPromiseInput').value.trim() || 'I promise to always be there for you.';

        if (!name) {
            const input = document.getElementById('familyEditMemberNameInput');
            input.style.borderColor = 'var(--danger)';
            input.classList.add('shake');
            this.showToast('❌ Please enter a member name', 'error');
            setTimeout(() => {
                input.style.borderColor = '';
                input.classList.remove('shake');
            }, 2000);
            return;
        }

        const selectedColor = document.querySelector('#familyEditColorSelector .color-option.selected');
        const color = selectedColor ? selectedColor.dataset.color : '#6C5CE7';

        const preview = document.getElementById('familyEditMemberPhotoPreview');
        const profile_photo = preview && preview.dataset.photo ? preview.dataset.photo : null;

        const life_lessons = lessonsInput ? lessonsInput.split(',').map(l => l.trim()).filter(l => l) : [];

        const data = {
            name,
            relationship,
            birthday,
            favorite_quote,
            story,
            life_lessons,
            promise,
            profile_photo,
            color
        };

        Object.keys(data).forEach(key => {
            if (data[key] === undefined || data[key] === null || data[key] === '') {
                delete data[key];
            }
        });

        const result = await this.apiRequest(`/members/${id}`, 'PUT', data);
        
        if (result && result.id) {
            this.closeModal('familyEditMemberModal');
            await this.loadMembers();
            await this.render();
            this.showToast(`✅ ${name}'s profile updated!`, 'success');
        }
    }

    async deleteMember(id) {
        const member = this.members.find(m => m.id === id);
        if (!member) return;
        
        if (!confirm(`Are you sure you want to delete ${member.name}? This cannot be undone.`)) return;
        
        const result = await this.apiRequest(`/members/${id}`, 'DELETE');
        if (result) {
            await this.loadMembers();
            await this.render();
            this.showToast(`🗑️ ${member.name} removed from family`, 'warning');
        }
    }

    // ============ PHOTO SAVE ============

    async savePhotos() {
        const memberId = parseInt(document.getElementById('familyUploadMemberSelect').value);
        const title = document.getElementById('familyPhotoTitle').value.trim();
        const description = document.getElementById('familyPhotoDescription').value.trim();
        const date = document.getElementById('familyPhotoDate').value;

        if (!memberId) {
            this.showToast('❌ Please select a family member', 'error');
            document.getElementById('familyUploadMemberSelect').style.borderColor = 'var(--danger)';
            setTimeout(() => document.getElementById('familyUploadMemberSelect').style.borderColor = '', 2000);
            return;
        }

        if (!title) {
            this.showToast('❌ Please enter a photo title', 'error');
            document.getElementById('familyPhotoTitle').style.borderColor = 'var(--danger)';
            setTimeout(() => document.getElementById('familyPhotoTitle').style.borderColor = '', 2000);
            return;
        }

        if (this.uploadedPhotos.length === 0) {
            this.showToast('❌ Please select photos to upload', 'error');
            return;
        }

        const progressBar = document.getElementById('familyPhotoUploadProgress');
        if (progressBar) progressBar.style.display = 'block';

        let uploaded = 0;
        let failed = 0;

        for (let i = 0; i < this.uploadedPhotos.length; i++) {
            const photo = this.uploadedPhotos[i];
            
            try {
                this.updateUploadProgress(
                    ((i + 1) / this.uploadedPhotos.length) * 100,
                    `Uploading ${i + 1}/${this.uploadedPhotos.length}`
                );

                const data = {
                    title: title + (this.uploadedPhotos.length > 1 ? ` ${i + 1}` : ''),
                    description: description || 'A beautiful family memory',
                    date: date || new Date().toISOString().split('T')[0],
                    photo: photo.dataUrl,
                    story: description || 'A cherished family moment captured forever.',
                    width: photo.width,
                    height: photo.height,
                    aspectRatio: photo.aspectRatio,
                    originalWidth: photo.originalWidth,
                    originalHeight: photo.originalHeight
                };

                const result = await this.apiRequest(`/members/${memberId}/gallery`, 'POST', data);
                
                if (result && result.id) {
                    uploaded++;
                } else {
                    failed++;
                }
            } catch (error) {
                console.error('Error uploading photo:', error);
                failed++;
            }
        }

        if (progressBar) {
            setTimeout(() => {
                progressBar.style.display = 'none';
                this.updateUploadProgress(0, '');
            }, 500);
        }

        if (uploaded > 0) {
            this.closeModal('familyPhotoUploadModal');
            document.getElementById('familyPhotoTitle').value = '';
            document.getElementById('familyPhotoDescription').value = '';
            document.getElementById('familyPhotoFile').value = '';
            document.getElementById('familyPhotoPreviewContainer').innerHTML = '';
            this.uploadedPhotos = [];
            
            // Reload members to refresh gallery data
            await this.loadMembers();
            await this.render();
            
            const member = this.members.find(m => m.id === memberId);
            this.showToast(`📷 ${uploaded} photo(s) added to ${member ? member.name : 'gallery'}!`, 'success');
            
            if (failed > 0) {
                this.showToast(`⚠️ ${failed} photo(s) failed to upload`, 'warning');
            }
            
            this.celebrate();
        } else {
            this.showToast('❌ Failed to upload photos. Please try again.', 'error');
        }
    }

    // ============ VIEW FUNCTIONS ============

    showMemberProfile(id) {
        const member = this.members.find(m => m.id === id);
        if (!member) return;

        const body = document.getElementById('familyModalBody');
        body.innerHTML = `
            <div class="member-profile">
                <div class="profile-hero" style="background: linear-gradient(135deg, ${member.color || '#6C5CE7'}30, ${member.color || '#6C5CE7'}10);">
                    <div class="profile-avatar-large" style="border-color: ${member.color || '#6C5CE7'};">
                        ${member.profile_photo ? 
                            `<img src="${member.profile_photo}" alt="${member.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">` :
                            `<div style="font-size: 3.5rem; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: ${member.color || '#6C5CE7'}30; border-radius: 50%; color: ${member.color || '#6C5CE7'};">
                                ${member.name.charAt(0).toUpperCase()}
                            </div>`
                        }
                    </div>
                    <h2 class="profile-name">${member.name}</h2>
                    <p class="profile-relationship">${member.relationship || 'Family Member'}</p>
                    <div class="profile-details-grid">
                        <div class="profile-detail">
                            <i class="fas fa-birthday-cake" style="color: ${member.color || '#6C5CE7'};"></i> 
                            ${member.age || '?'} years
                        </div>
                        <div class="profile-detail">
                            <i class="fas fa-calendar-alt" style="color: ${member.color || '#6C5CE7'};"></i> 
                            ${member.birthday ? new Date(member.birthday).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown'}
                        </div>
                    </div>
                    <div class="profile-actions">
                        <button class="btn btn-outline btn-sm edit-member-btn" data-id="${member.id}">
                            <i class="fas fa-edit"></i> Edit Profile
                        </button>
                        <button class="btn btn-danger btn-sm delete-member-btn" data-id="${member.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>

                <div class="profile-sections">
                    <div class="profile-section">
                        <h3><i class="fas fa-quote-left" style="color: ${member.color || '#6C5CE7'};"></i> Favorite Quote</h3>
                        <blockquote class="profile-quote">"${member.favorite_quote || 'Family is everything.'}"</blockquote>
                    </div>
                    
                    <div class="profile-section">
                        <h3><i class="fas fa-book-open" style="color: ${member.color || '#6C5CE7'};"></i> Their Story</h3>
                        <p class="profile-story">${member.story || 'A wonderful family member who brings joy to our lives.'}</p>
                    </div>
                    
                    <div class="profile-section">
                        <h3><i class="fas fa-graduation-cap" style="color: ${member.color || '#6C5CE7'};"></i> Life Lessons</h3>
                        <div class="profile-lessons">
                            ${(member.life_lessons || []).map(lesson => `
                                <span class="profile-lesson-tag" style="background: ${member.color || '#6C5CE7'}20; color: ${member.color || '#6C5CE7'};">
                                    <i class="fas fa-check-circle"></i> ${lesson}
                                </span>
                            `).join('') || '<span style="color: var(--gray);">No life lessons shared yet.</span>'}
                        </div>
                    </div>
                    
                    <div class="profile-section">
                        <h3><i class="fas fa-handshake" style="color: ${member.color || '#6C5CE7'};"></i> Promise</h3>
                        <div class="profile-promise" style="border-left-color: ${member.color || '#6C5CE7'};">
                            <p>${member.promise || 'I promise to always be there for you.'}</p>
                        </div>
                    </div>
                    
                    <div class="profile-section">
                        <h3><i class="fas fa-images" style="color: ${member.color || '#6C5CE7'};"></i> Gallery</h3>
                        <div class="profile-gallery-grid">
                            ${member.gallery && member.gallery.length > 0 ? 
                                member.gallery.slice(0, 6).map(photo => `
                                    <div class="profile-gallery-item" onclick="window.familyInstance?.showGallery(${member.id})">
                                        ${photo.photo ? 
                                            `<img src="${photo.photo}" alt="${photo.title}" loading="lazy">` : 
                                            `<div class="profile-gallery-placeholder" style="background: ${member.color || '#6C5CE7'}30;">
                                                <i class="fas fa-image" style="color: ${member.color || '#6C5CE7'};"></i>
                                            </div>`
                                        }
                                        <div class="profile-gallery-overlay">
                                            <p>${photo.title}</p>
                                        </div>
                                    </div>
                                `).join('') :
                                `<p class="profile-no-gallery">No photos yet. Upload some memories! 📷</p>`
                            }
                            ${member.gallery && member.gallery.length > 6 ? 
                                `<div class="profile-gallery-item profile-gallery-more" onclick="window.familyInstance?.showGallery(${member.id})">
                                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: ${member.color || '#6C5CE7'};">
                                        <span style="font-size: 2rem;">+${member.gallery.length - 6}</span>
                                        <span style="font-size: 0.8rem;">more</span>
                                    </div>
                                </div>` : ''
                            }
                        </div>
                        <button class="btn btn-primary btn-sm" onclick="document.getElementById('familyPhotoUploadModal').style.display='block'; document.getElementById('familyMemberModal').style.display='none';">
                            <i class="fas fa-plus"></i> Add Photo
                        </button>
                    </div>
                    
                    <div class="profile-section">
                        <h3><i class="fas fa-star" style="color: ${member.color || '#6C5CE7'};"></i> Memories</h3>
                        <div class="profile-memories">
                            ${member.memories && member.memories.length > 0 ? 
                                member.memories.map(memory => `
                                    <div class="profile-memory-card" style="border-left-color: ${member.color || '#6C5CE7'};">
                                        ${memory.photo ? `<img src="${memory.photo}" alt="${memory.title}" class="memory-thumb" loading="lazy">` : ''}
                                        <div class="memory-content">
                                            <h4><i class="fas fa-star" style="color: ${member.color || '#6C5CE7'};"></i> ${memory.title}</h4>
                                            <p>${memory.description}</p>
                                            <small><i class="far fa-calendar-alt"></i> ${memory.date || ''}</small>
                                            ${memory.location ? `<small><i class="fas fa-map-marker-alt"></i> ${memory.location}</small>` : ''}
                                        </div>
                                    </div>
                                `).join('') :
                                `<p style="color: var(--gray);">No memories shared yet.</p>`
                            }
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.openModal('familyMemberModal');
    }

    showGallery(id) {
        const member = this.members.find(m => m.id === id);
        if (!member) return;

        const body = document.getElementById('familyGalleryBody');
        body.innerHTML = `
            <div class="gallery-container">
                <div class="gallery-header">
                    <h2><i class="fas fa-images" style="color: ${member.color || '#6C5CE7'};"></i> ${member.name}'s Gallery</h2>
                    <div class="gallery-header-actions">
                        <button class="btn btn-primary btn-sm" onclick="document.getElementById('familyPhotoUploadModal').style.display='block'; document.getElementById('familyGalleryModal').style.display='none';">
                            <i class="fas fa-plus"></i> Add Photo
                        </button>
                        <button class="btn btn-ghost btn-sm" onclick="document.getElementById('familyGalleryModal').style.display='none';">Close</button>
                    </div>
                </div>
                
                <div class="gallery-grid">
                    ${member.gallery && member.gallery.length > 0 ?
                        member.gallery.map((photo, index) => `
                            <div class="gallery-item" style="animation-delay: ${index * 0.05}s">
                                ${photo.photo ? 
                                    `<img src="${photo.photo}" alt="${photo.title}" class="gallery-photo" loading="lazy">` : 
                                    `<div class="gallery-placeholder" style="background: ${member.color || '#6C5CE7'}30;">
                                        <i class="fas fa-image" style="color: ${member.color || '#6C5CE7'}; font-size: 3rem;"></i>
                                    </div>`
                                }
                                <div class="gallery-item-overlay">
                                    <h4>${photo.title}</h4>
                                    ${photo.description ? `<p>${photo.description}</p>` : ''}
                                    <small><i class="far fa-calendar-alt"></i> ${photo.date || 'No date'}</small>
                                    ${photo.width && photo.height ? 
                                        `<small><i class="fas fa-arrows-alt"></i> ${photo.width} × ${photo.height}</small>` : ''
                                    }
                                    ${photo.story ? `<p class="gallery-story"><i class="fas fa-quote-left"></i> ${photo.story}</p>` : ''}
                                    <div class="gallery-item-actions">
                                        <button class="btn btn-primary btn-sm gallery-download" data-photo="${photo.photo}" data-title="${photo.title}">
                                            <i class="fas fa-download"></i>
                                        </button>
                                        <button class="btn btn-danger btn-sm gallery-delete" data-id="${photo.id}" data-member="${member.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        `).join('') :
                        `<div class="gallery-empty">
                            <i class="fas fa-camera" style="font-size: 4rem; color: var(--gray);"></i>
                            <h3>No Photos Yet</h3>
                            <p>Start building your family photo gallery by uploading memories!</p>
                            <button class="btn btn-primary" onclick="document.getElementById('familyPhotoUploadModal').style.display='block'; document.getElementById('familyGalleryModal').style.display='none';">
                                <i class="fas fa-plus"></i> Upload First Photo
                            </button>
                        </div>`
                    }
                </div>
                
                <div class="gallery-stats">
                    <span>📷 ${member.gallery ? member.gallery.length : 0} Photos</span>
                    <span>📖 ${member.gallery ? member.gallery.filter(p => p.story).length : 0} Stories</span>
                    ${member.gallery && member.gallery.length > 0 ? 
                        `<span>🖼️ ${member.gallery.reduce((acc, p) => acc + (p.width || 0), 0)}px total</span>` : ''
                    }
                </div>
            </div>
        `;

        // Add event listeners for gallery actions
        setTimeout(() => {
            // Download buttons
            body.querySelectorAll('.gallery-download').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const photoData = btn.dataset.photo;
                    const title = btn.dataset.title;
                    this.downloadPhoto(photoData, title);
                });
            });

            // Delete buttons
            body.querySelectorAll('.gallery-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const photoId = parseInt(btn.dataset.id);
                    const memberId = parseInt(btn.dataset.member);
                    this.deleteGalleryPhoto(photoId, memberId);
                });
            });
        }, 100);

        this.openModal('familyGalleryModal');
    }

    // ============ UI HELPERS ============

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

    setupEventListeners() {
        // Add Member
        document.getElementById('addMemberBtn')?.addEventListener('click', () => this.showAddMemberModal());
        document.getElementById('emptyAddBtn')?.addEventListener('click', () => this.showAddMemberModal());
        document.getElementById('familyFabBtn')?.addEventListener('click', () => this.showAddMemberModal());

        // Add Member Modal
        document.getElementById('familyAddMemberClose')?.addEventListener('click', () => this.closeModal('familyAddMemberModal'));
        document.getElementById('familyAddMemberCancelBtn')?.addEventListener('click', () => this.closeModal('familyAddMemberModal'));
        document.getElementById('familyAddMemberSaveBtn')?.addEventListener('click', () => this.saveNewMember());

        // Edit Member Modal
        document.getElementById('familyEditMemberClose')?.addEventListener('click', () => this.closeModal('familyEditMemberModal'));
        document.getElementById('familyEditMemberCancelBtn')?.addEventListener('click', () => this.closeModal('familyEditMemberModal'));
        document.getElementById('familyEditMemberSaveBtn')?.addEventListener('click', () => this.saveEditMember());

        // Photo Upload Modal
        document.getElementById('uploadPhotoBtn')?.addEventListener('click', () => {
            document.getElementById('familyUploadMemberSelect').value = '';
            document.getElementById('familyPhotoTitle').value = '';
            document.getElementById('familyPhotoDescription').value = '';
            document.getElementById('familyPhotoDate').value = '';
            document.getElementById('familyPhotoFile').value = '';
            document.getElementById('familyPhotoPreviewContainer').innerHTML = '';
            this.uploadedPhotos = [];
            document.getElementById('familySavePhotoText').textContent = 'Upload Photos';
            this.openModal('familyPhotoUploadModal');
        });

        document.getElementById('familyPhotoUploadClose')?.addEventListener('click', () => this.closeModal('familyPhotoUploadModal'));
        document.getElementById('familyPhotoUploadCancelBtn')?.addEventListener('click', () => this.closeModal('familyPhotoUploadModal'));
        document.getElementById('familySavePhotoBtn')?.addEventListener('click', () => this.savePhotos());

        // Profile Modal
        document.getElementById('familyModalClose')?.addEventListener('click', () => this.closeModal('familyMemberModal'));

        // Gallery Modal
        document.getElementById('familyGalleryModalClose')?.addEventListener('click', () => this.closeModal('familyGalleryModal'));

        // Toast Close
        document.getElementById('familyToastClose')?.addEventListener('click', () => {
            const toast = document.getElementById('familyToast');
            if (toast) toast.classList.remove('show');
        });

        // Click outside modals
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    const id = modal.id;
                    if (id === 'familyAddMemberModal') this.closeModal(id);
                    else if (id === 'familyEditMemberModal') this.closeModal(id);
                    else if (id === 'familyPhotoUploadModal') this.closeModal(id);
                    else if (id === 'familyMemberModal') this.closeModal(id);
                    else if (id === 'familyGalleryModal') this.closeModal(id);
                    else if (id === 'familyDeleteConfirmModal') this.closeModal(id);
                }
            });
        });

        // View Profile
        document.querySelectorAll('.view-profile').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showMemberProfile(parseInt(btn.dataset.id));
            });
        });

        // View Gallery
        document.querySelectorAll('.view-gallery').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = parseInt(btn.dataset.id);
                const member = this.members.find(m => m.id === id);
                
                if (member) {
                    const galleryData = await this.loadMemberGallery(id);
                    member.gallery = galleryData;
                    console.log(`📷 Opening gallery for ${member.name}:`, member.gallery);
                }
                
                this.showGallery(id);
            });
        });

        // Heart buttons
        document.querySelectorAll('.family-heart').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const icon = btn.querySelector('i');
                icon.style.color = '#FF6B6B';
                icon.style.transform = 'scale(1.5)';
                icon.style.transition = 'transform 0.3s ease';
                setTimeout(() => { icon.style.transform = 'scale(1)'; }, 300);
                const member = this.members.find(m => m.id === parseInt(btn.dataset.id));
                this.showToast(`💖 Sending love to ${member ? member.name : 'your family member'}!`, 'success');
            });
        });

        // Card click
        document.querySelectorAll('.family-card').forEach(card => {
            card.addEventListener('click', () => {
                this.showMemberProfile(parseInt(card.dataset.id));
            });
        });

        // Edit/Delete in profile (event delegation)
        document.getElementById('familyMemberModal')?.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-member-btn');
            if (editBtn) {
                const id = parseInt(editBtn.dataset.id);
                this.closeModal('familyMemberModal');
                setTimeout(() => this.showEditMemberModal(id), 300);
            }
            const deleteBtn = e.target.closest('.delete-member-btn');
            if (deleteBtn) {
                const id = parseInt(deleteBtn.dataset.id);
                this.closeModal('familyMemberModal');
                setTimeout(() => this.deleteMember(id), 300);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (document.getElementById('familyAddMemberModal').style.display !== 'none') {
                    this.saveNewMember();
                }
                if (document.getElementById('familyEditMemberModal').style.display !== 'none') {
                    this.saveEditMember();
                }
            }
            
            if (e.key === 'Escape') {
                ['familyAddMemberModal', 'familyEditMemberModal', 'familyPhotoUploadModal', 
                 'familyMemberModal', 'familyGalleryModal', 'familyDeleteConfirmModal'].forEach(id => {
                    if (document.getElementById(id).style.display !== 'none') {
                        this.closeModal(id);
                    }
                });
            }
        });

        window.familyInstance = this;
    }

    animateCards() {
        document.querySelectorAll('.stagger-item').forEach((card, index) => {
            setTimeout(() => card.classList.add('animate-in'), 100 + index * 80);
        });
    }

    celebrate() {
        const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#A29BFE', '#6C5CE7', '#00B894', '#E17055', '#FDCB6E'];
        
        for (let i = 0; i < 40; i++) {
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
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('familyToast');
        const toastMessage = document.getElementById('familyToastMessage');
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
            toast.className = 'family-toast show';
            toast.style.borderLeftColor = config.color;

            clearTimeout(this.toastTimeout);
            this.toastTimeout = setTimeout(() => {
                toast.classList.remove('show');
            }, 3500);
        } else if (window.showToast) {
            window.showToast('Family', message, type, 2500);
        } else {
            console.log(`[${type}] ${message}`);
        }
    }
}

export default Family;