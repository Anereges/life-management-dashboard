// js/components/Dashboard.js
export class Dashboard {
    constructor() {
        this.container = null;
        this.animations = {};
        this.quotes = [
            {
                text: "You don't build the future tomorrow. You build it today.",
                author: "Aman"
            },
            {
                text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
                author: "Winston Churchill"
            },
            {
                text: "The only way to do great work is to love what you do.",
                author: "Steve Jobs"
            },
            {
                text: "Believe you can and you're halfway there.",
                author: "Theodore Roosevelt"
            }
        ];
        this.currentQuoteIndex = 0;
        this.focusItems = [];
        this.achievements = [];
        this.notifications = [];
        this.streakCount = 0;
        this.xpPoints = 0;
        this.level = 1;
        this.completionRate = 0;
        this.totalTasks = 0;
        this.goalsProgress = 0;
        this.timerInterval = null;
        this.notificationInterval = null;
        this.showNotificationPanel = false;
        this.apiBase = 'http://localhost:5000/api/dashboard';
        this.token = localStorage.getItem('access_token');
        this.userName = 'Guest';
        this.greeting = 'Good Evening';
        this.todayDate = '';
    }

    async loadDashboardData() {
        try {
            const response = await fetch(`${this.apiBase}/summary`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.updateDashboardData(data);
                console.log('✅ Dashboard data loaded:', data);
            } else if (response.status === 401) {
                window.location.href = '/login.html';
            } else {
                console.error('Failed to load dashboard data:', await response.text());
                this.loadFallbackData();
            }
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.loadFallbackData();
        }
    }

    updateDashboardData(data) {
        // Update greeting and date
        this.greeting = data.greeting || 'Good Day';
        this.todayDate = data.date || new Date().toISOString().split('T')[0];
        
        // Update statistics
        if (data.statistics) {
            this.totalTasks = data.statistics.total_tasks || 0;
            this.completionRate = data.statistics.completion_rate || 0;
            this.streakCount = data.statistics.streak || 0;
            this.goalsProgress = data.statistics.goals_progress || 0;
        }
        
        // Update today's focus tasks
        this.focusItems = (data.today_focus || []).map(task => ({
            id: task.id,
            title: task.title,
            status: task.status || 'pending',
            time: '1h',
            priority: this.getPriorityLabel(task.priority || 1),
            category: 'Task'
        }));
        
        // If no focus tasks, add sample ones
        if (this.focusItems.length === 0) {
            this.focusItems = [
                {
                    id: 1,
                    title: "Complete your daily goals",
                    status: "pending",
                    time: "1h",
                    priority: "high",
                    category: "Productivity"
                },
                {
                    id: 2,
                    title: "Review your progress",
                    status: "pending",
                    time: "30m",
                    priority: "medium",
                    category: "Reflection"
                }
            ];
        }
        
        // Update achievements
        this.achievements = (data.recent_achievements || []).map(ach => ({
            id: ach.id,
            title: ach.title || 'Achievement',
            date: ach.date ? new Date(ach.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recent',
            xp: 50,
            badge: 'gold',
            icon: 'fa-trophy',
            description: 'Recent achievement'
        }));
        
        // If no achievements, add sample ones
        if (this.achievements.length === 0) {
            this.achievements = [
                {
                    id: 1,
                    title: "Welcome to the Dashboard!",
                    date: "Today",
                    xp: 10,
                    badge: "bronze",
                    icon: "fa-star",
                    description: "Started your journey"
                }
            ];
        }
        
        // Update XP and level (estimate from achievements)
        this.xpPoints = this.achievements.reduce((sum, a) => sum + a.xp, 0);
        this.level = Math.floor(this.xpPoints / 50) + 1;
        
        // Update greeting text
        this.userName = this.getUserName();
    }

    getPriorityLabel(priority) {
        if (priority >= 3) return 'high';
        if (priority >= 2) return 'medium';
        return 'low';
    }

    getUserName() {
        try {
            const userData = JSON.parse(localStorage.getItem('user') || '{}');
            return userData.full_name || userData.username || 'Guest';
        } catch {
            return 'Guest';
        }
    }

    loadFallbackData() {
        // Load sample data if API fails
        this.focusItems = [
            {
                id: 1,
                title: "Build Password Generator",
                status: "completed",
                time: "2h",
                priority: "high",
                category: "Coding"
            },
            {
                id: 2,
                title: "Read Python Documentation",
                status: "completed",
                time: "1.5h",
                priority: "medium",
                category: "Learning"
            },
            {
                id: 3,
                title: "Exercise",
                status: "in-progress",
                time: "45m",
                priority: "high",
                category: "Health"
            },
            {
                id: 4,
                title: "Review Project Proposal",
                status: "pending",
                time: "1h",
                priority: "medium",
                category: "Work"
            }
        ];

        this.achievements = [
            {
                id: 1,
                title: "First GitHub Project",
                date: "July 2026",
                xp: 50,
                badge: "gold",
                icon: "fa-medal",
                description: "Created first open-source project"
            },
            {
                id: 2,
                title: "Internship Completed",
                date: "June 2026",
                xp: 100,
                badge: "silver",
                icon: "fa-award",
                description: "Completed 6-month internship"
            },
            {
                id: 3,
                title: "30-Day Coding Streak",
                date: "May 2026",
                xp: 75,
                badge: "bronze",
                icon: "fa-star",
                description: "30 consecutive days of coding"
            }
        ];

        this.streakCount = 42;
        this.xpPoints = 225;
        this.level = 7;
        this.completionRate = 80;
        this.totalTasks = 12;
        this.goalsProgress = 65;
        this.userName = this.getUserName();
        this.greeting = this.getGreeting();
    }

    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    }

    async render() {
        await this.loadDashboardData();
        
        this.container = document.getElementById('page-content');
        this.container.innerHTML = `
            <div class="dashboard-container">
                <!-- Animated Background -->
                <div class="animated-bg">
                    <div class="gradient-orbs">
                        <div class="orb orb-1"></div>
                        <div class="orb orb-2"></div>
                        <div class="orb orb-3"></div>
                    </div>
                </div>

                <!-- Header with Animation -->
                <div class="dashboard-header card fade-in-up" style="--delay: 0.1s">
                    <div class="greeting-section">
                        <div class="greeting-wrapper">
                            <h1 class="greeting-text">
                                <span class="wave-emoji">👋</span>
                                ${this.greeting}, ${this.userName}
                                <span class="status-dot pulse-dot"></span>
                            </h1>
                            <div class="datetime-wrapper">
                                <p class="date">
                                    <i class="fas fa-calendar-alt"></i>
                                    ${this.getFormattedDate()}
                                </p>
                                <p class="time" id="live-time">
                                    <i class="fas fa-clock"></i>
                                    ${this.getCurrentTime()}
                                </p>
                            </div>
                        </div>
                        <div class="quote-wrapper" id="quoteWrapper">
                            <p class="quote" id="quoteText">
                                <i class="fas fa-quote-left"></i>
                                "${this.quotes[0].text}"
                                <i class="fas fa-quote-right"></i>
                            </p>
                            <div class="quote-controls">
                                <button class="btn btn-ghost btn-sm" id="prevQuoteBtn">
                                    <i class="fas fa-chevron-left"></i>
                                </button>
                                <button class="btn btn-ghost btn-sm" id="nextQuoteBtn">
                                    <i class="fas fa-chevron-right"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-glass notification-btn" title="Notifications" id="notificationBtn">
                            <i class="fas fa-bell"></i>
                            <span class="notification-badge" id="notificationBadge">${this.getUnreadCount()}</span>
                        </button>
                        <button class="btn btn-glass" title="Settings" id="settingsBtn">
                            <i class="fas fa-sliders-h"></i>
                        </button>
                        <button class="btn btn-glass" title="Fullscreen" id="fullscreenBtn">
                            <i class="fas fa-expand"></i>
                        </button>
                    </div>
                </div>

                <!-- Notification Panel -->
                <div class="notification-panel" id="notificationPanel" style="display: none;">
                    <div class="notification-panel-header">
                        <h3><i class="fas fa-bell"></i> Notifications</h3>
                        <button class="btn btn-ghost btn-sm" id="markAllReadBtn">Mark all read</button>
                        <button class="btn btn-ghost btn-sm" id="closeNotificationsBtn">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="notification-list" id="notificationList">
                        ${this.renderNotifications()}
                    </div>
                </div>

                <!-- Stats Grid with Stagger Animation -->
                <div class="stats-grid grid-4">
                    <div class="stat-card stagger-item" style="--delay: 0.15s" id="statTask">
                        <div class="stat-icon-wrapper">
                            <div class="stat-icon primary">
                                <i class="fas fa-tasks"></i>
                            </div>
                            <div class="stat-trend up">
                                <i class="fas fa-arrow-up"></i> ${this.totalTasks > 0 ? Math.round((this.completionRate / 100) * 20) : 0}%
                            </div>
                        </div>
                        <div class="stat-info">
                            <h3 class="counter" data-target="${this.totalTasks}">0</h3>
                            <p>Total Tasks</p>
                            <span class="stat-sub">${this.completionRate}% completed</span>
                        </div>
                        <div class="stat-progress">
                            <div class="progress-bar">
                                <div class="fill" style="width: ${this.completionRate}%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="stat-card stagger-item" style="--delay: 0.25s" id="statCompletion">
                        <div class="stat-icon-wrapper">
                            <div class="stat-icon success">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <div class="stat-trend up">
                                <i class="fas fa-arrow-up"></i> ${this.completionRate > 0 ? Math.round(this.completionRate / 10) : 0}%
                            </div>
                        </div>
                        <div class="stat-info">
                            <h3 class="counter" data-target="${this.completionRate}">0<span>%</span></h3>
                            <p>Completion Rate</p>
                            <span class="stat-sub">${this.completionRate >= 80 ? 'Excellent performance' : this.completionRate >= 50 ? 'Good progress' : 'Keep going!'}</span>
                        </div>
                        <div class="stat-progress">
                            <div class="progress-bar">
                                <div class="fill success" style="width: ${this.completionRate}%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="stat-card stagger-item" style="--delay: 0.35s" id="statStreak">
                        <div class="stat-icon-wrapper">
                            <div class="stat-icon warning">
                                <i class="fas fa-fire"></i>
                            </div>
                            <div class="stat-trend up">
                                <i class="fas fa-arrow-up"></i> ${this.streakCount > 0 ? '🔥' : '0%'}
                            </div>
                        </div>
                        <div class="stat-info">
                            <h3 class="counter" data-target="${this.streakCount}">0</h3>
                            <p>Day Streak 🔥</p>
                            <span class="stat-sub">Best: ${this.streakCount} days</span>
                        </div>
                        <div class="stat-progress">
                            <div class="progress-bar">
                                <div class="fill warning" style="width: ${Math.min((this.streakCount / 50) * 100, 100)}%"></div>
                            </div>
                        </div>
                    </div>

                    <div class="stat-card stagger-item" style="--delay: 0.45s" id="statGoals">
                        <div class="stat-icon-wrapper">
                            <div class="stat-icon secondary">
                                <i class="fas fa-bullseye"></i>
                            </div>
                            <div class="stat-trend up">
                                <i class="fas fa-arrow-up"></i> ${this.goalsProgress > 0 ? Math.round(this.goalsProgress / 10) : 0}%
                            </div>
                        </div>
                        <div class="stat-info">
                            <h3 class="counter" data-target="${this.goalsProgress}">0<span>%</span></h3>
                            <p>Goals Progress</p>
                            <span class="stat-sub">${this.goalsProgress < 100 ? `${Math.round((100 - this.goalsProgress) / 20)} goals remaining` : 'All goals completed! 🎉'}</span>
                        </div>
                        <div class="stat-progress">
                            <div class="progress-bar">
                                <div class="fill secondary" style="width: ${this.goalsProgress}%"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Content Grid -->
                <div class="content-grid grid-2">
                    <!-- Focus Section -->
                    <div class="focus-section card fade-in-up" style="--delay: 0.5s">
                        <div class="card-header">
                            <h2 class="card-title">
                                <i class="fas fa-bullseye" style="color: var(--primary);"></i>
                                Today's Focus
                            </h2>
                            <div class="card-actions">
                                <button class="btn btn-primary btn-sm" id="addTaskBtn">
                                    <i class="fas fa-plus"></i> Add Task
                                </button>
                            </div>
                        </div>
                        <div class="focus-list" id="focusList">
                            <!-- Focus items will be rendered here -->
                        </div>
                        <div class="focus-progress">
                            <div class="focus-stats">
                                <span id="taskProgressText">0/0 Completed</span>
                                <span id="taskProgressPercent">0%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="fill" id="taskProgressBar" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Achievements Section -->
                    <div class="achievements-section card fade-in-up" style="--delay: 0.6s">
                        <div class="card-header">
                            <h2 class="card-title">
                                <i class="fas fa-trophy" style="color: #FFD700;"></i>
                                Recent Achievements
                            </h2>
                            <button class="btn btn-primary btn-sm" id="viewAllAchievementsBtn">View All</button>
                        </div>
                        <div class="achievements-list" id="achievementsList">
                            <!-- Achievements will be rendered here -->
                        </div>
                        <div class="achievements-total" id="achievementsTotal">
                            <span><i class="fas fa-star"></i> Total XP: ${this.xpPoints}</span>
                            <span>Level ${this.level}</span>
                        </div>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="quick-actions card fade-in-up" style="--delay: 0.7s">
                    <button class="action-btn" data-action="newTask">
                        <i class="fas fa-plus-circle"></i>
                        <span>New Task</span>
                    </button>
                    <button class="action-btn" data-action="schedule">
                        <i class="fas fa-calendar-plus"></i>
                        <span>Schedule</span>
                    </button>
                    <button class="action-btn" data-action="analytics">
                        <i class="fas fa-chart-line"></i>
                        <span>Analytics</span>
                    </button>
                    <button class="action-btn" data-action="settings">
                        <i class="fas fa-cog"></i>
                        <span>Settings</span>
                    </button>
                    <button class="action-btn" data-action="export">
                        <i class="fas fa-download"></i>
                        <span>Export</span>
                    </button>
                    <button class="action-btn" data-action="refresh">
                        <i class="fas fa-sync-alt"></i>
                        <span>Refresh</span>
                    </button>
                </div>
            </div>
        `;

        // Initialize data
        this.initializeData();
        
        // Initialize animations and live features
        this.initAnimations();
        this.startLiveClock();
        this.animateCounters();
        this.addInteractiveEffects();
        this.initEventListeners();
        this.startQuoteRotation();
        this.startNotifications();

        return this.container;
    }

    initializeData() {
        this.renderFocusItems();
        this.renderAchievements();
        this.updateTaskProgress();
        this.updateNotificationBadge();
    }

    renderNotifications() {
        if (this.notifications.length === 0) {
            return `
                <div class="notification-empty">
                    <i class="fas fa-bell-slash" style="font-size: 2rem; color: var(--gray-light);"></i>
                    <p style="color: var(--gray);">No notifications yet</p>
                </div>
            `;
        }
        
        return this.notifications.map(notification => `
            <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
                <div class="notification-content">
                    <p>${notification.message}</p>
                    <span class="notification-time">${notification.time}</span>
                </div>
                ${!notification.read ? '<span class="notification-dot"></span>' : ''}
            </div>
        `).join('');
    }

    renderFocusItems() {
        const list = document.getElementById('focusList');
        if (!list) return;

        if (this.focusItems.length === 0) {
            list.innerHTML = `
                <div class="empty-focus">
                    <i class="fas fa-check-circle" style="font-size: 2rem; color: var(--gray-light);"></i>
                    <p style="color: var(--gray); margin-top: 8px;">All caught up! No tasks for today.</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.focusItems.map(item => `
            <div class="focus-item ${item.status}" data-id="${item.id}">
                <div class="focus-check" data-action="toggleTask">
                    ${this.getStatusIcon(item.status)}
                </div>
                <div class="focus-content">
                    <span class="focus-title">${item.title}</span>
                    <div class="focus-tags">
                        <span class="focus-tag ${item.status}">${this.getStatusLabel(item.status)}</span>
                        ${item.category ? `<span class="focus-category">${item.category}</span>` : ''}
                        <span class="focus-priority ${item.priority}">${item.priority}</span>
                    </div>
                </div>
                <div class="focus-time">
                    <i class="far fa-clock"></i> ${item.time || '1h'}
                </div>
                <button class="focus-delete" data-action="deleteTask" title="Delete Task">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }

    getStatusIcon(status) {
        const icons = {
            'completed': '<i class="fas fa-check-circle" style="color: var(--success);"></i>',
            'in-progress': '<i class="fas fa-spinner fa-spin" style="color: var(--warning);"></i>',
            'pending': '<i class="far fa-circle" style="color: var(--gray);"></i>'
        };
        return icons[status] || icons.pending;
    }

    getStatusLabel(status) {
        const labels = {
            'completed': 'Completed',
            'in-progress': 'In Progress',
            'pending': 'Pending'
        };
        return labels[status] || 'Pending';
    }

    renderAchievements() {
        const list = document.getElementById('achievementsList');
        if (!list) return;

        list.innerHTML = this.achievements.map(item => `
            <div class="achievement-item" data-id="${item.id}">
                <div class="achievement-icon ${item.badge || 'bronze'}">
                    <i class="fas ${item.icon || 'fa-trophy'}"></i>
                </div>
                <div class="achievement-info">
                    <div class="achievement-title">${item.title}</div>
                    <div class="achievement-meta">
                        <i class="far fa-calendar-alt"></i> ${item.date || 'Recent'}
                        <span class="achievement-points">+${item.xp || 10} XP</span>
                    </div>
                </div>
                <div class="achievement-badge">
                    <span class="badge ${item.badge || 'bronze'}">${item.badge ? item.badge.charAt(0).toUpperCase() + item.badge.slice(1) : 'Bronze'}</span>
                </div>
            </div>
        `).join('');
    }

    updateTaskProgress() {
        const total = this.focusItems.length;
        const completed = this.focusItems.filter(item => item.status === 'completed').length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

        const progressText = document.getElementById('taskProgressText');
        const progressPercent = document.getElementById('taskProgressPercent');
        const progressBar = document.getElementById('taskProgressBar');

        if (progressText) progressText.textContent = `${completed}/${total} Completed`;
        if (progressPercent) progressPercent.textContent = `${percent}%`;
        if (progressBar) progressBar.style.width = `${percent}%`;
    }

    getUnreadCount() {
        return this.notifications.filter(n => !n.read).length;
    }

    updateNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            const count = this.getUnreadCount();
            badge.textContent = count;
            badge.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    initAnimations() {
        const items = document.querySelectorAll('.stagger-item');
        items.forEach((item, index) => {
            const delay = parseFloat(item.style.getPropertyValue('--delay')) || 0.1;
            item.style.animationDelay = `${delay}s`;
            item.classList.add('animate-in');
        });

        document.querySelectorAll('.stat-icon-wrapper').forEach((wrapper, i) => {
            wrapper.style.animationDelay = `${i * 0.15}s`;
            wrapper.classList.add('float-icon');
        });
    }

    startLiveClock() {
        const updateClock = () => {
            const timeElement = document.getElementById('live-time');
            if (timeElement) {
                timeElement.innerHTML = `<i class="fas fa-clock"></i> ${this.getCurrentTime()}`;
            }
        };

        updateClock();
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(updateClock, 1000);
    }

    getCurrentTime() {
        const now = new Date();
        return now.toTimeString().split(' ')[0];
    }

    getFormattedDate() {
        const now = new Date();
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        return now.toLocaleDateString('en-US', options);
    }

    animateCounters() {
        const counters = document.querySelectorAll('.counter');
        
        counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const isPercentage = counter.querySelector('span') !== null;
            let current = 0;
            const increment = target / 60;
            const duration = 1500;
            const stepTime = duration / 60;

            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    if (isPercentage) {
                        counter.innerHTML = `${Math.round(current)}<span>%</span>`;
                    } else {
                        counter.textContent = Math.round(current);
                    }
                    setTimeout(updateCounter, stepTime);
                } else {
                    if (isPercentage) {
                        counter.innerHTML = `${target}<span>%</span>`;
                    } else {
                        counter.textContent = target;
                    }
                    this.triggerCelebration(counter);
                }
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        updateCounter();
                        observer.unobserve(entry.target);
                    }
                });
            });

            observer.observe(counter);
        });
    }

    triggerCelebration(element) {
        const parent = element.closest('.stat-card');
        if (parent) {
            parent.style.transform = 'scale(1.03)';
            setTimeout(() => {
                parent.style.transform = 'scale(1)';
            }, 300);
        }
    }

    addInteractiveEffects() {
        document.querySelectorAll('.stat-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-6px) scale(1.02)';
                this.style.boxShadow = '0 20px 40px rgba(0,0,0,0.12)';
            });
            
            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
                this.style.boxShadow = 'var(--shadow)';
            });

            card.addEventListener('click', function() {
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = 'translateY(-6px) scale(1.02)';
                }, 150);
            });
        });

        const progressBars = document.querySelectorAll('.progress-bar .fill');
        const progressObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const bar = entry.target;
                    const width = bar.style.width;
                    bar.style.width = '0%';
                    setTimeout(() => {
                        bar.style.width = width;
                    }, 100);
                    progressObserver.unobserve(bar);
                }
            });
        });

        progressBars.forEach(bar => {
            progressObserver.observe(bar);
        });
    }

    initEventListeners() {
        // Quote navigation
        document.getElementById('prevQuoteBtn')?.addEventListener('click', () => this.changeQuote(-1));
        document.getElementById('nextQuoteBtn')?.addEventListener('click', () => this.changeQuote(1));

        // Add Task - Using modal instead of prompt
        document.getElementById('addTaskBtn')?.addEventListener('click', () => this.showAddTaskModal());
        
        // View All Achievements
        document.getElementById('viewAllAchievementsBtn')?.addEventListener('click', () => {
            this.showToast('Achievements', 'Viewing all achievements... 🏆', 'info');
        });

        // Quick Actions
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = btn.dataset.action;
                this.handleQuickAction(action);
                this.addClickEffect(btn);
            });
        });

        // Notification Button - Toggle panel
        document.getElementById('notificationBtn')?.addEventListener('click', () => {
            this.toggleNotificationPanel();
        });

        // Close notification panel
        document.getElementById('closeNotificationsBtn')?.addEventListener('click', () => {
            this.closeNotificationPanel();
        });

        // Mark all as read
        document.getElementById('markAllReadBtn')?.addEventListener('click', () => {
            this.markAllNotificationsRead();
        });

        // Click outside to close notifications
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('notificationPanel');
            const btn = document.getElementById('notificationBtn');
            if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
                this.closeNotificationPanel();
            }
        });

        // Settings Button
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.showToast('Settings', 'Opening settings panel... ⚙️', 'info');
        });

        // Fullscreen Button
        document.getElementById('fullscreenBtn')?.addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Focus item event delegation
        document.getElementById('focusList')?.addEventListener('click', (e) => {
            const toggleBtn = e.target.closest('[data-action="toggleTask"]');
            const deleteBtn = e.target.closest('[data-action="deleteTask"]');
            
            if (toggleBtn) {
                const item = e.target.closest('.focus-item');
                if (item) this.toggleTask(item.dataset.id);
            }
            
            if (deleteBtn) {
                const item = e.target.closest('.focus-item');
                if (item) this.deleteTask(item.dataset.id);
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                this.showAddTaskModal();
            }
            
            if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                this.refreshDashboard();
            }

            if (e.key === 'Escape') {
                this.closeNotificationPanel();
            }
        });
    }

    showAddTaskModal() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal-content task-modal">
                <div class="modal-header">
                    <h3><i class="fas fa-plus-circle" style="color: var(--primary);"></i> Add New Task</h3>
                    <button class="modal-close-btn" id="modalCloseBtn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>Task Title</label>
                        <input type="text" id="taskTitleInput" placeholder="Enter task title..." class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Category</label>
                        <input type="text" id="taskCategoryInput" placeholder="e.g., Coding, Health, Learning..." class="form-control">
                    </div>
                    <div class="form-group">
                        <label>Priority</label>
                        <select id="taskPriorityInput" class="form-control">
                            <option value="high">🔥 High</option>
                            <option value="medium" selected>⚡ Medium</option>
                            <option value="low">📌 Low</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Estimated Time</label>
                        <input type="text" id="taskTimeInput" placeholder="e.g., 1h, 30m..." class="form-control">
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-ghost" id="modalCancelBtn">Cancel</button>
                    <button class="btn btn-primary" id="modalSaveBtn">
                        <i class="fas fa-plus"></i> Add Task
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        overlay.style.display = 'flex';

        const titleInput = document.getElementById('taskTitleInput');
        if (titleInput) setTimeout(() => titleInput.focus(), 100);

        const closeModal = () => {
            overlay.remove();
        };

        document.getElementById('modalCloseBtn')?.addEventListener('click', closeModal);
        document.getElementById('modalCancelBtn')?.addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        document.getElementById('modalSaveBtn')?.addEventListener('click', () => {
            const title = document.getElementById('taskTitleInput').value.trim();
            const category = document.getElementById('taskCategoryInput').value.trim() || 'General';
            const priority = document.getElementById('taskPriorityInput').value;
            const time = document.getElementById('taskTimeInput').value.trim() || '1h';

            if (!title) {
                document.getElementById('taskTitleInput').style.borderColor = 'var(--danger)';
                this.showToast('Error', 'Please enter a task title!', 'error');
                return;
            }

            const newTask = {
                id: Date.now(),
                title: title,
                status: 'pending',
                time: time,
                priority: priority,
                category: category
            };

            this.focusItems.push(newTask);
            this.renderFocusItems();
            this.updateTaskProgress();
            closeModal();
            this.showToast('Success', 'Task added successfully! ✅', 'success');
            
            this.addNotification(`📝 New task added: "${title}"`);
            
            const items = document.querySelectorAll('.focus-item');
            if (items.length > 0) {
                const lastItem = items[items.length - 1];
                lastItem.style.animation = 'fadeInUp 0.5s ease';
                setTimeout(() => {
                    lastItem.style.animation = '';
                }, 500);
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && overlay) {
                document.getElementById('modalSaveBtn')?.click();
            }
        }, { once: true });
    }

    toggleNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            if (panel.style.display === 'none') {
                panel.style.display = 'block';
                panel.style.animation = 'slideDown 0.3s ease';
            } else {
                this.closeNotificationPanel();
            }
        }
    }

    closeNotificationPanel() {
        const panel = document.getElementById('notificationPanel');
        if (panel) {
            panel.style.display = 'none';
        }
    }

    markAllNotificationsRead() {
        this.notifications.forEach(n => n.read = true);
        this.updateNotificationBadge();
        this.renderNotifications();
        this.showToast('Notifications', 'All notifications marked as read ✅', 'success');
    }

    addNotification(message) {
        this.notifications.unshift({
            id: Date.now(),
            message: message,
            read: false,
            time: 'Just now'
        });
        this.updateNotificationBadge();
        this.renderNotifications();
    }

    changeQuote(direction) {
        this.currentQuoteIndex = (this.currentQuoteIndex + direction + this.quotes.length) % this.quotes.length;
        const quoteText = document.getElementById('quoteText');
        if (quoteText) {
            const quote = this.quotes[this.currentQuoteIndex];
            quoteText.innerHTML = `
                <i class="fas fa-quote-left"></i>
                "${quote.text}"
                <i class="fas fa-quote-right"></i>
            `;
            quoteText.style.animation = 'none';
            setTimeout(() => {
                quoteText.style.animation = 'fadeIn 0.5s ease';
            }, 10);
        }
    }

    startQuoteRotation() {
        setInterval(() => {
            this.changeQuote(1);
        }, 15000);
    }

    toggleTask(id) {
        const task = this.focusItems.find(item => item.id == id);
        if (task) {
            const statusCycle = {
                'pending': 'in-progress',
                'in-progress': 'completed',
                'completed': 'pending'
            };
            task.status = statusCycle[task.status] || 'pending';
            this.renderFocusItems();
            this.updateTaskProgress();
            
            const statusMessages = {
                'pending': 'Task marked as pending ⏳',
                'in-progress': 'Task in progress 🔄',
                'completed': 'Task completed! 🎉'
            };
            
            if (task.status === 'completed') {
                this.addNotification(`🎉 Task completed: "${task.title}"`);
                this.xpPoints += 10;
                document.getElementById('achievementsTotal').innerHTML = `
                    <span><i class="fas fa-star"></i> Total XP: ${this.xpPoints}</span>
                    <span>Level ${this.level}</span>
                `;
            }
            
            this.showToast('Task Updated', statusMessages[task.status], 'success');
        }
    }

    deleteTask(id) {
        this.showToast('Confirm', 'Are you sure you want to delete this task?', 'warning');
        setTimeout(() => {
            if (confirm('Delete this task?')) {
                const task = this.focusItems.find(item => item.id == id);
                this.focusItems = this.focusItems.filter(item => item.id != id);
                this.renderFocusItems();
                this.updateTaskProgress();
                if (task) {
                    this.addNotification(`🗑️ Task deleted: "${task.title}"`);
                }
                this.showToast('Deleted', 'Task deleted successfully 🗑️', 'warning');
            }
        }, 100);
    }

    handleQuickAction(action) {
        const actions = {
            'newTask': () => this.showAddTaskModal(),
            'schedule': () => this.showToast('Schedule', 'Opening calendar... 📅', 'info'),
            'analytics': () => this.showToast('Analytics', 'Loading analytics... 📊', 'info'),
            'settings': () => this.showToast('Settings', 'Opening settings... ⚙️', 'info'),
            'export': () => this.exportData(),
            'refresh': () => this.refreshDashboard()
        };

        const handler = actions[action];
        if (handler) handler();
    }

    exportData() {
        const data = {
            tasks: this.focusItems,
            achievements: this.achievements,
            stats: {
                totalTasks: this.totalTasks,
                completionRate: this.completionRate,
                streakCount: this.streakCount,
                goalsProgress: this.goalsProgress,
                xpPoints: this.xpPoints,
                level: this.level
            },
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        this.showToast('Export', 'Data exported successfully! 📥', 'success');
        this.addNotification('📤 Dashboard data exported');
    }

    refreshDashboard() {
        this.showToast('Refresh', 'Refreshing dashboard... 🔄', 'info');
        setTimeout(async () => {
            await this.loadDashboardData();
            this.renderFocusItems();
            this.renderAchievements();
            this.updateTaskProgress();
            this.animateCounters();
            this.showToast('Success', 'Dashboard refreshed! ✨', 'success');
            this.addNotification('🔄 Dashboard refreshed');
        }, 1000);
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                this.showToast('Error', 'Fullscreen not supported', 'error');
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    addClickEffect(element) {
        element.classList.add('clicked');
        setTimeout(() => {
            element.classList.remove('clicked');
        }, 300);
    }

    showToast(title, message, type = 'info') {
        if (window.showToast) {
            window.showToast(title, message, type);
        } else {
            console.log(`${title}: ${message}`);
        }
    }

    startNotifications() {
        this.notificationInterval = setInterval(() => {
            const badge = document.getElementById('notificationBadge');
            if (badge) {
                const count = this.getUnreadCount();
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            }
        }, 5000);
    }

    destroy() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.notificationInterval) clearInterval(this.notificationInterval);
    }
}

export default Dashboard;