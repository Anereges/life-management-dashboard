export function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

export function formatTime(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

export function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning 🌅';
    if (hour < 17) return 'Good Afternoon ☀️';
    return 'Good Evening 🌙';
}

export function getQuote() {
    const quotes = [
        '"The best time to start was yesterday. The next best time is now."',
        '"Success is not final, failure is not fatal: it is the courage to continue that counts."',
        '"You don\'t build the future tomorrow. You build it today."',
        '"Small steps lead to big changes."'
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
}

export function getInitials(name) {
    if (!name) return '?';
    return name.split(' ')
        .map(word => word.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2);
}

export function truncate(text, maxLength = 100) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
}

export function debounce(func, delay = 300) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

export function getPriorityLabel(priority) {
    const labels = {
        1: 'Low',
        2: 'Medium Low',
        3: 'Medium',
        4: 'High',
        5: 'Critical'
    };
    return labels[priority] || 'Medium';
}

export function getDifficultyLabel(difficulty) {
    const labels = {
        1: 'Easy',
        2: 'Moderate',
        3: 'Medium',
        4: 'Hard',
        5: 'Expert'
    };
    return labels[difficulty] || 'Medium';
}

export function getStatusBadge(status) {
    const badges = {
        'pending': 'badge-warning',
        'in_progress': 'badge-info',
        'completed': 'badge-success'
    };
    return badges[status] || 'badge-secondary';
}

export function getStatusLabel(status) {
    const labels = {
        'pending': 'Pending',
        'in_progress': 'In Progress',
        'completed': 'Completed'
    };
    return labels[status] || status;
}