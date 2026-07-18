// js/components/Analytics.js
export class Analytics {
    constructor() {
        this.container = null;
        this.chartInstances = [];
        this.apiBase = 'http://localhost:5000/api/analytics';
        this.token = localStorage.getItem('access_token');
        this.stats = {
            coding: { hours: 0, label: 'Coding Time', icon: 'fa-code', trend: '+0%', color: '#6C5CE7' },
            books: { count: 0, label: 'Books Read', icon: 'fa-book', trend: '+0%', color: '#00B894' },
            workouts: { count: 0, label: 'Workouts', icon: 'fa-dumbbell', trend: '+0%', color: '#FDCB6E' },
            tasks: { count: 0, label: 'Tasks Completed', icon: 'fa-check-circle', trend: '+0%', color: '#E17055' },
            goals: { count: 0, label: 'Goals Achieved', icon: 'fa-bullseye', trend: '+0%', color: '#A29BFE' },
            streak: { days: 0, label: 'Day Streak', icon: 'fa-fire', trend: '🔥', color: '#FF6B6B' }
        };
        
        this.weeklyData = {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            tasks: [0, 0, 0, 0, 0, 0, 0],
            productivity: [0, 0, 0, 0, 0, 0, 0],
            focus: [0, 0, 0, 0, 0, 0, 0]
        };

        this.monthlyData = {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            tasks: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            goals: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            hours: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        };

        this.categoryData = {
            labels: ['Career', 'Learning', 'Health', 'Family', 'Personal'],
            values: [0, 0, 0, 0, 0],
            colors: ['#6C5CE7', '#00B894', '#FDCB6E', '#E17055', '#A29BFE']
        };
        
        this.overviewData = null;
        this.insights = [];
    }

    async loadData() {
        try {
            // Load overview data
            const overviewResponse = await fetch(`${this.apiBase}/overview`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (overviewResponse.ok) {
                this.overviewData = await overviewResponse.json();
                this.updateStatsFromOverview();
            }

            // Load productivity data
            const productivityResponse = await fetch(`${this.apiBase}/productivity?period=weekly`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (productivityResponse.ok) {
                const data = await productivityResponse.json();
                this.updateWeeklyData(data);
            }

            // Load coding stats
            const codingResponse = await fetch(`${this.apiBase}/coding`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (codingResponse.ok) {
                const data = await codingResponse.json();
                this.stats.coding.hours = data.total_coding_activities || 0;
            }

            // Load reading stats
            const readingResponse = await fetch(`${this.apiBase}/reading`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (readingResponse.ok) {
                const data = await readingResponse.json();
                this.stats.books.count = data.total_reading_activities || 0;
            }

            // Load fitness stats
            const fitnessResponse = await fetch(`${this.apiBase}/fitness`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });
            
            if (fitnessResponse.ok) {
                const data = await fitnessResponse.json();
                this.stats.workouts.count = data.total_fitness_activities || 0;
            }

            // Generate insights
            this.generateInsights();
            
        } catch (error) {
            console.error('Error loading analytics data:', error);
            this.showToast('⚠️ Error loading analytics data');
        }
    }

    updateStatsFromOverview() {
        if (!this.overviewData) return;
        
        const totals = this.overviewData.totals || {};
        const today = this.overviewData.today || {};
        
        this.stats.tasks.count = totals.completed_tasks || 0;
        this.stats.goals.count = totals.completed_goals || 0;
        this.stats.streak.days = this.calculateStreak();
        
        // Update trends based on data
        if (this.overviewData.task_completion_rate > 50) {
            this.stats.tasks.trend = `+${Math.round(this.overviewData.task_completion_rate)}%`;
        }
        if (this.overviewData.goal_completion_rate > 50) {
            this.stats.goals.trend = `+${Math.round(this.overviewData.goal_completion_rate)}%`;
        }
    }

    updateWeeklyData(data) {
        if (!data || !data.daily_data) return;
        
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const dateMap = {};
        
        // Get the day of week for each date
        data.daily_data.forEach(day => {
            const date = new Date(day.date);
            const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1];
            dateMap[dayName] = day.completed || 0;
        });
        
        // Update weekly data
        this.weeklyData.labels = days;
        this.weeklyData.tasks = days.map(day => dateMap[day] || 0);
        this.weeklyData.productivity = days.map(day => {
            const count = dateMap[day] || 0;
            const max = Math.max(...Object.values(dateMap), 1);
            return Math.round((count / max) * 100);
        });
    }

    calculateStreak() {
        // Simple streak calculation based on tasks completed
        if (!this.overviewData) return 0;
        const today = this.overviewData.today || {};
        return today.completion_rate > 0 ? Math.floor(today.completion_rate / 10) + 5 : 0;
    }

    generateInsights() {
        this.insights = [
            {
                icon: 'fa-rocket',
                color: 'var(--success)',
                title: '🚀 Peak Performance',
                description: this.weeklyData.productivity.length > 0 ? 
                    `Your productivity peaks on ${this.weeklyData.labels[this.weeklyData.productivity.indexOf(Math.max(...this.weeklyData.productivity))] || 'Thursday'} (${Math.max(...this.weeklyData.productivity)}%). Schedule important tasks on this day.` :
                    'Track your productivity to discover your peak performance days.'
            },
            {
                icon: 'fa-chart-line',
                color: 'var(--warning)',
                title: '📈 Growth Trend',
                description: this.stats.goals.count > 0 ? 
                    `You've achieved ${this.stats.goals.count} goals! Keep building on this momentum.` :
                    'Start setting goals to track your growth journey.'
            },
            {
                icon: 'fa-heart',
                color: 'var(--primary-light)',
                title: '💪 Consistency',
                description: this.stats.streak.days > 0 ? 
                    `${this.stats.streak.days}-day streak! You're building powerful habits. Consistency is your superpower.` :
                    'Start building a daily streak by completing tasks consistently.'
            },
            {
                icon: 'fa-bullseye',
                color: 'var(--danger)',
                title: '🎯 Focus Areas',
                description: this.overviewData ? 
                    `You have ${this.overviewData.totals?.tasks || 0} tasks and ${this.overviewData.totals?.goals || 0} goals. Keep pushing forward!` :
                    'Track your tasks and goals to see your focus areas.'
            }
        ];
    }

    async render() {
        await this.loadData();
        
        this.container = document.getElementById('page-content');
        this.container.innerHTML = `
            <div class="analytics-container">
                <!-- Animated Background -->
                <div class="analytics-bg-animation">
                    <div class="analytics-orb analytics-orb-1"></div>
                    <div class="analytics-orb analytics-orb-2"></div>
                    <div class="analytics-orb analytics-orb-3"></div>
                </div>

                <!-- Header -->
                <div class="analytics-header glass-card fade-in-up">
                    <div class="analytics-header-content">
                        <div>
                            <div class="analytics-badge">
                                <span class="analytics-badge-icon">📊</span>
                                <span class="analytics-badge-text">Performance Analytics</span>
                            </div>
                            <h1 class="analytics-title">Your <span class="analytics-title-highlight">Progress</span> Dashboard</h1>
                            <p class="analytics-subtitle">Track, measure, and celebrate your growth journey</p>
                        </div>
                        <div class="analytics-header-actions">
                            <button class="btn btn-ghost btn-sm" id="analyticsRefreshBtn">
                                <i class="fas fa-sync-alt"></i> Refresh
                            </button>
                            <button class="btn btn-primary btn-glow" id="analyticsExportBtn">
                                <i class="fas fa-download"></i> Export Report
                            </button>
                        </div>
                    </div>
                    
                    <!-- Overall Stats -->
                    <div class="analytics-stats">
                        <div class="analytics-stat">
                            <span class="analytics-stat-number">${this.stats.tasks.count + this.stats.goals.count + this.stats.books.count}</span>
                            <span class="analytics-stat-label">Total Achievements</span>
                        </div>
                        <div class="analytics-stat-divider"></div>
                        <div class="analytics-stat">
                            <span class="analytics-stat-number" style="color: var(--success);">${this.overviewData ? Math.round(this.overviewData.task_completion_rate || 0) : 0}%</span>
                            <span class="analytics-stat-label">Task Completion</span>
                        </div>
                        <div class="analytics-stat-divider"></div>
                        <div class="analytics-stat">
                            <span class="analytics-stat-number" style="color: var(--warning);">${this.stats.streak.days} days</span>
                            <span class="analytics-stat-label">🔥 Current Streak</span>
                        </div>
                        <div class="analytics-stat-divider"></div>
                        <div class="analytics-stat">
                            <span class="analytics-stat-number" style="color: var(--primary-light);">${this.stats.coding.hours}</span>
                            <span class="analytics-stat-label">Coding Activities</span>
                        </div>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div class="analytics-stats-grid">
                    ${Object.entries(this.stats).map(([key, stat], index) => `
                        <div class="stat-card glass-card fade-in-up stagger-item" style="animation-delay: ${index * 0.08}s;">
                            <div class="stat-icon-wrapper">
                                <div class="stat-icon" style="background: ${stat.color}20; color: ${stat.color};">
                                    <i class="fas ${stat.icon}"></i>
                                </div>
                                <span class="stat-trend up">
                                    <i class="fas fa-arrow-up"></i> ${stat.trend || '0%'}
                                </span>
                            </div>
                            <div class="stat-info">
                                <h3 class="stat-number">${stat.hours || stat.count || stat.days || 0}</h3>
                                <p>${stat.label}</p>
                                <span class="stat-sub">${stat.trend ? '↑ ' + stat.trend : ''}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- Charts Grid -->
                <div class="analytics-charts-grid">
                    <!-- Weekly Performance -->
                    <div class="chart-card glass-card fade-in-up" style="animation-delay: 0.3s;">
                        <div class="chart-card-header">
                            <h3 class="chart-card-title">
                                <i class="fas fa-calendar-week" style="color: var(--primary);"></i>
                                Weekly Performance
                            </h3>
                            <div class="chart-card-actions">
                                <button class="btn btn-ghost btn-sm active" data-chart="weekly">Week</button>
                                <button class="btn btn-ghost btn-sm" data-chart="monthly">Month</button>
                            </div>
                        </div>
                        <div class="chart-wrapper">
                            <canvas id="analyticsWeeklyChart"></canvas>
                        </div>
                    </div>

                    <!-- Monthly Trends -->
                    <div class="chart-card glass-card fade-in-up" style="animation-delay: 0.4s;">
                        <div class="chart-card-header">
                            <h3 class="chart-card-title">
                                <i class="fas fa-chart-line" style="color: var(--success);"></i>
                                Monthly Trends
                            </h3>
                            <span class="chart-subtitle">2026</span>
                        </div>
                        <div class="chart-wrapper">
                            <canvas id="analyticsMonthlyChart"></canvas>
                        </div>
                    </div>

                    <!-- Category Distribution -->
                    <div class="chart-card glass-card fade-in-up" style="animation-delay: 0.5s;">
                        <div class="chart-card-header">
                            <h3 class="chart-card-title">
                                <i class="fas fa-pie-chart" style="color: var(--warning);"></i>
                                Category Distribution
                            </h3>
                            <span class="chart-subtitle">By Focus Area</span>
                        </div>
                        <div class="chart-wrapper">
                            <canvas id="analyticsCategoryChart"></canvas>
                        </div>
                    </div>

                    <!-- Productivity Heatmap -->
                    <div class="chart-card glass-card fade-in-up" style="animation-delay: 0.6s;">
                        <div class="chart-card-header">
                            <h3 class="chart-card-title">
                                <i class="fas fa-fire" style="color: var(--danger);"></i>
                                Productivity Heatmap
                            </h3>
                            <span class="chart-subtitle">Daily Activity</span>
                        </div>
                        <div class="heatmap-container" id="analyticsHeatmap">
                            ${this.renderHeatmap()}
                        </div>
                    </div>
                </div>

                <!-- Insights Section -->
                <div class="analytics-insights glass-card fade-in-up" style="animation-delay: 0.7s;">
                    <div class="insights-header">
                        <h3 class="insights-title">
                            <i class="fas fa-lightbulb" style="color: var(--warning);"></i>
                            AI Insights
                        </h3>
                        <span class="insights-date">Updated just now</span>
                    </div>
                    <div class="insights-grid">
                        ${this.insights.map((insight, index) => `
                            <div class="insight-card" style="animation-delay: ${0.8 + index * 0.1}s;">
                                <div class="insight-icon" style="background: ${insight.color}20; color: ${insight.color};">
                                    <i class="fas ${insight.icon}"></i>
                                </div>
                                <div class="insight-content">
                                    <h4>${insight.title}</h4>
                                    <p>${insight.description}</p>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.animateCards();
        setTimeout(() => this.initCharts(), 300);
        return this.container;
    }

    renderHeatmap() {
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const hours = ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm'];
        const intensities = [0.2, 0.8, 1.0, 0.6, 0.9, 0.7, 0.3, 0.5];
        
        let html = '<table class="heatmap-table">';
        html += '<thead><tr><th></th>';
        days.forEach(day => {
            html += `<th>${day}</th>`;
        });
        html += '</tr></thead><tbody>';
        
        hours.forEach((hour, hourIndex) => {
            html += `<tr><td class="hour-label">${hour}</td>`;
            days.forEach((day, dayIndex) => {
                const intensity = intensities[(hourIndex + dayIndex) % intensities.length];
                const color = this.getHeatmapColor(intensity);
                const value = Math.round(intensity * 100);
                html += `<td style="background: ${color}; color: ${intensity > 0.6 ? 'white' : '#333'};" title="${day} ${hour}: ${value}% activity">
                    ${value}%
                </td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';
        return html;
    }

    getHeatmapColor(intensity) {
        const r = Math.round(108 + (255 - 108) * intensity);
        const g = Math.round(92 - 92 * intensity);
        const b = Math.round(231 - 231 * intensity);
        return `rgb(${r}, ${g}, ${b})`;
    }

    initCharts() {
        this.createWeeklyChart();
        this.createMonthlyChart();
        this.createCategoryChart();
    }

    createWeeklyChart() {
        const canvas = document.getElementById('analyticsWeeklyChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: this.weeklyData.labels,
                datasets: [
                    {
                        label: 'Tasks Completed',
                        data: this.weeklyData.tasks,
                        backgroundColor: 'rgba(108, 92, 231, 0.6)',
                        borderColor: '#6C5CE7',
                        borderWidth: 2,
                        borderRadius: 6
                    },
                    {
                        label: 'Productivity %',
                        data: this.weeklyData.productivity,
                        backgroundColor: 'rgba(0, 184, 148, 0.4)',
                        borderColor: '#00B894',
                        borderWidth: 2,
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            usePointStyle: true,
                            padding: 16,
                            font: { size: 11 }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { display: true, drawBorder: false }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
        this.chartInstances.push(chart);
    }

    createMonthlyChart() {
        const canvas = document.getElementById('analyticsMonthlyChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.monthlyData.labels,
                datasets: [
                    {
                        label: 'Tasks Completed',
                        data: this.monthlyData.tasks,
                        borderColor: '#6C5CE7',
                        backgroundColor: 'rgba(108, 92, 231, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#6C5CE7',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    },
                    {
                        label: 'Goals Achieved',
                        data: this.monthlyData.goals,
                        borderColor: '#00B894',
                        backgroundColor: 'rgba(0, 184, 148, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#00B894',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    },
                    {
                        label: 'Coding Hours',
                        data: this.monthlyData.hours,
                        borderColor: '#FDCB6E',
                        backgroundColor: 'rgba(253, 203, 110, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#FDCB6E',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            usePointStyle: true,
                            padding: 16,
                            font: { size: 11 }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { display: true, drawBorder: false }
                    },
                    x: {
                        grid: { display: false }
                    }
                }
            }
        });
        this.chartInstances.push(chart);
    }

    createCategoryChart() {
        const canvas = document.getElementById('analyticsCategoryChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: this.categoryData.labels,
                datasets: [{
                    data: this.categoryData.values,
                    backgroundColor: this.categoryData.colors.map(c => c + 'CC'),
                    borderColor: this.categoryData.colors,
                    borderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            usePointStyle: true,
                            padding: 16,
                            font: { size: 12 }
                        }
                    }
                },
                cutout: '65%'
            }
        });
        this.chartInstances.push(chart);
    }

    setupEventListeners() {
        // Refresh button
        document.getElementById('analyticsRefreshBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showToast('🔄 Analytics refreshed!');
            this.loadData();
            this.render();
        });

        // Export report
        document.getElementById('analyticsExportBtn')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.exportReport();
        });

        // Chart toggle buttons
        document.querySelectorAll('[data-chart]').forEach(btn => {
            btn.addEventListener('click', () => {
                const parent = btn.closest('.chart-card');
                parent.querySelectorAll('[data-chart]').forEach(b => {
                    b.classList.remove('active');
                });
                btn.classList.add('active');
                this.showToast(`📊 Showing ${btn.dataset.chart} view`);
            });
        });
    }

    exportReport() {
        const report = `
📊 Performance Report - ${new Date().toLocaleDateString()}
${'='.repeat(50)}

📈 OVERALL STATISTICS
• Total Achievements: ${this.stats.tasks.count + this.stats.goals.count + this.stats.books.count}
• Task Completion: ${this.overviewData ? Math.round(this.overviewData.task_completion_rate || 0) : 0}%
• Goal Completion: ${this.overviewData ? Math.round(this.overviewData.goal_completion_rate || 0) : 0}%
• Current Streak: ${this.stats.streak.days} days
• Coding Activities: ${this.stats.coding.hours}

📚 LEARNING
• Books/Reading: ${this.stats.books.count}
• Coding Activities: ${this.stats.coding.hours}

💪 HEALTH & FITNESS
• Fitness Activities: ${this.stats.workouts.count}

🎯 GOALS
• Achieved: ${this.stats.goals.count}
• Total Tasks: ${this.overviewData?.totals?.tasks || 0}

📊 WEEKLY PERFORMANCE
• Best Day: ${this.weeklyData.labels[this.weeklyData.productivity.indexOf(Math.max(...this.weeklyData.productivity))] || 'N/A'}
• Tasks Completed: ${this.weeklyData.tasks.reduce((a, b) => a + b, 0)}

💡 INSIGHTS
${this.insights.map(i => `• ${i.title}: ${i.description}`).join('\n')}

${'='.repeat(50)}
Generated by Life Management Dashboard
        `;

        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('📥 Report exported successfully!');
    }

    animateCards() {
        const cards = document.querySelectorAll('.stagger-item');
        cards.forEach((card, index) => {
            setTimeout(() => {
                card.classList.add('animate-in');
            }, 100 + index * 80);
        });
    }

    showToast(message) {
        if (window.showToast) {
            window.showToast('Analytics', message, 'success', 2500);
        } else {
            alert(message);
        }
    }

    destroy() {
        this.chartInstances.forEach(chart => {
            if (chart) chart.destroy();
        });
        this.chartInstances = [];
    }
}

export default Analytics;