// js/components/LegacyBot.js
export class LegacyBot {
    constructor() {
        this.container = null;
        this.isTyping = false;
        this.isBotThinking = false;
        this.messages = [
            {
                id: 1,
                sender: 'bot',
                text: '?? Hello! I\'m your Legacy Bot, your personal guide and mentor.',
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                sender: 'bot',
                text: 'I\'m here to help you reflect, grow, and build the legacy you dream of. Ask me anything about your journey, goals, or life!',
                timestamp: new Date().toISOString()
            }
        ];
        
        this.apiBase = 'https://life-management-api.onrender.com/api/legacy_bot';
        this.token = localStorage.getItem('access_token');
        this.userName = 'Aman';
        this.conversationContext = [];
        this.botStatus = 'online';
        this.typingSpeed = 50;
    }

    async render() {
        this.container = document.getElementById('page-content');
        this.container.innerHTML = `
            <div class="legacybot-container">
                <!-- Animated Background -->
                <div class="legacybot-bg-animation">
                    <div class="legacybot-orb legacybot-orb-1"></div>
                    <div class="legacybot-orb legacybot-orb-2"></div>
                    <div class="legacybot-orb legacybot-orb-3"></div>
                    <div class="legacybot-particles" id="legacyParticles"></div>
                </div>

                <!-- Header -->
                <div class="legacybot-header glass-card fade-in-up">
                    <div class="legacybot-header-content">
                        <div>
                            <div class="legacybot-badge">
                                <span class="legacybot-badge-icon">??</span>
                                <span class="legacybot-badge-text">AI Legacy Guide</span>
                            </div>
                            <h1 class="legacybot-title">Your <span class="legacybot-title-highlight">Legacy</span> Bot</h1>
                            <p class="legacybot-subtitle">Your personal mentor for building a meaningful life</p>
                        </div>
                        <div class="legacybot-header-actions">
                            <button class="btn btn-ghost btn-sm" id="legacyClearChatBtn" title="Clear Chat">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                            <button class="btn btn-ghost btn-sm" id="legacyExportChatBtn" title="Export Chat">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="btn btn-primary btn-glow" id="legacyResetBotBtn">
                                <i class="fas fa-sync-alt"></i>
                                <span>Reset</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Stats -->
                    <div class="legacybot-stats">
                        <div class="legacybot-stat">
                            <span class="legacybot-stat-number">${this.messages.filter(m => m.sender === 'bot').length}</span>
                            <span class="legacybot-stat-label">?? Messages</span>
                        </div>
                        <div class="legacybot-stat-divider"></div>
                        <div class="legacybot-stat">
                            <span class="legacybot-stat-number">${this.messages.filter(m => m.sender === 'user').length}</span>
                            <span class="legacybot-stat-label">?? Questions</span>
                        </div>
                        <div class="legacybot-stat-divider"></div>
                        <div class="legacybot-stat">
                            <span class="legacybot-stat-number" style="color: var(--success);">Active</span>
                            <span class="legacybot-stat-label">?? Status</span>
                        </div>
                    </div>
                </div>

                <!-- Chat Interface -->
                <div class="legacybot-chat glass-card fade-in-up" style="animation-delay: 0.15s;">
                    <div class="chat-header">
                        <div class="chat-header-info">
                            <div class="chat-avatar">
                                <i class="fas fa-robot"></i>
                            </div>
                            <div>
                                <h4 class="chat-bot-name">Legacy Bot</h4>
                                <span class="chat-status online">
                                    <span class="status-dot"></span>
                                    Online
                                </span>
                            </div>
                        </div>
                        <div class="chat-header-actions">
                            <span class="chat-time">${new Date().toLocaleTimeString()}</span>
                        </div>
                    </div>
                    
                    <div class="chat-messages" id="legacyChatMessages">
                        ${this.getMessagesHTML()}
                    </div>
                    
                    <div class="chat-input-area">
                        <div class="quick-suggestions" id="legacyQuickSuggestions">
                            <button class="suggestion-btn" data-question="Give me some motivation">?? Motivation</button>
                            <button class="suggestion-btn" data-question="What advice do you have for me?">?? Advice</button>
                            <button class="suggestion-btn" data-question="How can I achieve my goals?">?? Goals</button>
                            <button class="suggestion-btn" data-question="What should I be grateful for?">?? Gratitude</button>
                            <button class="suggestion-btn" data-question="How do I build my legacy?">??? Legacy</button>
                            <button class="suggestion-btn" data-question="I'm struggling, can you help?">?? Support</button>
                            <button class="suggestion-btn" data-question="How can I grow and improve?">?? Growth</button>
                        </div>
                        <div class="chat-input-wrapper">
                            <div class="chat-input-container">
                                <input type="text" id="legacyChatInput" placeholder="Ask me anything about your journey..." class="chat-input">
                                <button class="btn-send" id="legacySendBtn" title="Send message">
                                    <i class="fas fa-paper-plane"></i>
                                </button>
                            </div>
                            <div class="chat-input-footer">
                                <span class="input-hint">Press <kbd>Enter</kbd> to send · <kbd>/</kbd> to focus</span>
                                <span class="input-char-count" id="legacyCharCount">0/500</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Toast Notification -->
                <div id="legacyToast" class="legacy-toast">
                    <i class="fas fa-check-circle" style="color: var(--success);"></i>
                    <span id="legacyToastMessage">Chat updated!</span>
                </div>
            </div>
        `;

        this.setupEventListeners();
        this.createParticles();
        this.scrollToBottom();
        this.updateBotStatus();
        return this.container;
    }

    getMessagesHTML() {
        return this.messages.map(msg => `
            <div class="message-wrapper ${msg.sender === 'user' ? 'user' : 'bot'}">
                <div class="message-avatar">
                    ${msg.sender === 'user' ? '<i class="fas fa-user"></i>' : '<i class="fas fa-robot"></i>'}
                </div>
                <div class="message-content-wrapper">
                    <div class="message-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}">
                        <p class="message-text">${this.formatMessageText(msg.text)}</p>
                    </div>
                    <span class="message-time">${this.formatTime(msg.timestamp)}</span>
                </div>
            </div>
        `).join('');
    }

    updateMessages() {
        const container = document.getElementById('legacyChatMessages');
        if (container) {
            this.removeTypingIndicator();
            container.innerHTML = this.getMessagesHTML();
            this.scrollToBottom();
        }
    }

    formatMessageText(text) {
        let formatted = text;
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
        formatted = formatted.replace(/\n/g, '<br>');
        return formatted;
    }

    formatTime(timestamp) {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    updateBotStatus() {
        const statusElement = document.querySelector('.chat-status');
        if (statusElement) {
            statusElement.className = 'chat-status online';
            statusElement.innerHTML = `<span class="status-dot"></span> Online`;
        }
    }

    // ============ API METHODS ============

    async askBot(question) {
        try {
            const response = await fetch(`${this.apiBase}/ask`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ question: question })
            });
            
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login.html';
                    return null;
                }
                const errorText = await response.text();
                console.error('API Error:', errorText);
                return null;
            }
            
            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Network Error:', error);
            return null;
        }
    }

    // ============ EVENT LISTENERS ============

    setupEventListeners() {
        const input = document.getElementById('legacyChatInput');
        const sendBtn = document.getElementById('legacySendBtn');
        const clearBtn = document.getElementById('legacyClearChatBtn');
        const exportBtn = document.getElementById('legacyExportChatBtn');
        const resetBtn = document.getElementById('legacyResetBotBtn');

        sendBtn?.addEventListener('click', () => {
            this.sendMessage();
        });

        input?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        input?.addEventListener('input', (e) => {
            const count = e.target.value.length;
            const charCount = document.getElementById('legacyCharCount');
            if (charCount) {
                charCount.textContent = `${count}/500`;
                if (count > 450) {
                    charCount.style.color = count > 480 ? 'var(--danger)' : 'var(--warning)';
                } else {
                    charCount.style.color = 'var(--gray)';
                }
            }
        });

        document.querySelectorAll('#legacyQuickSuggestions .suggestion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const question = btn.dataset.question;
                const input = document.getElementById('legacyChatInput');
                if (input) {
                    input.value = question;
                    input.focus();
                    setTimeout(() => this.sendMessage(), 300);
                }
            });
        });

        clearBtn?.addEventListener('click', () => {
            if (confirm('Clear all chat messages?')) {
                this.messages = [
                    {
                        id: Date.now(),
                        sender: 'bot',
                        text: '?? Chat cleared. How can I help you today?',
                        timestamp: new Date().toISOString()
                    }
                ];
                this.updateMessages();
                this.showToast('?? Chat cleared', 'info');
            }
        });

        exportBtn?.addEventListener('click', () => {
            this.exportChat();
        });

        resetBtn?.addEventListener('click', () => {
            if (confirm('Reset the bot to its original state?')) {
                this.messages = [
                    {
                        id: Date.now(),
                        sender: 'bot',
                        text: '?? Hello! I\'m your Legacy Bot, your personal guide and mentor.',
                        timestamp: new Date().toISOString()
                    },
                    {
                        id: Date.now() + 1,
                        sender: 'bot',
                        text: 'I\'m here to help you reflect, grow, and build the legacy you dream of. Ask me anything about your journey, goals, or life!',
                        timestamp: new Date().toISOString()
                    }
                ];
                this.updateMessages();
                this.showToast('?? Bot reset successfully', 'success');
            }
        });

        input?.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
                const input = document.getElementById('legacyChatInput');
                if (input && document.activeElement !== input) {
                    e.preventDefault();
                    input.focus();
                }
            }
        });
    }

    // ============ MESSAGE HANDLING ============

    async sendMessage() {
        const input = document.getElementById('legacyChatInput');
        const question = input.value.trim();
        if (!question || this.isTyping) return;

        // Add user message
        this.messages.push({
            id: Date.now(),
            sender: 'user',
            text: question,
            timestamp: new Date().toISOString()
        });

        input.value = '';
        input.style.height = 'auto';
        document.getElementById('legacyCharCount').textContent = '0/500';
        this.updateMessages();

        this.isTyping = true;
        this.showTypingIndicator();
        this.setBotStatus('thinking');

        // Get response from backend
        const response = await this.askBot(question);
        
        this.isTyping = false;
        this.removeTypingIndicator();
        this.setBotStatus('online');

        if (response) {
            this.messages.push({
                id: Date.now() + 1,
                sender: 'bot',
                text: response,
                timestamp: new Date().toISOString()
            });
            this.updateMessages();
            
            if (question.toLowerCase().includes('thank') || question.toLowerCase().includes('grateful')) {
                this.showToast('?? Gratitude is beautiful!', 'success');
            }
            if (question.toLowerCase().includes('complete') || question.toLowerCase().includes('done')) {
                this.showToast('?? Celebration time!', 'success');
            }
        } else {
            // Fallback response if API fails
            const fallbackResponse = this.generateFallbackResponse(question);
            this.messages.push({
                id: Date.now() + 1,
                sender: 'bot',
                text: fallbackResponse,
                timestamp: new Date().toISOString()
            });
            this.updateMessages();
        }
    }

    generateFallbackResponse(question) {
        const lowerQuestion = question.toLowerCase();
        
        const responses = [
            "?? That's a great question! Let me think about it...",
            "?? I appreciate your curiosity! Every question brings you closer to understanding yourself better.",
            "?? Interesting question! Here's my perspective on that...",
            "?? Your questions show deep reflection. Keep exploring!",
            "?? Life is a beautiful journey of discovery. Thank you for asking!"
        ];
        
        if (lowerQuestion.includes('motivation') || lowerQuestion.includes('inspire')) {
            return "?? You're capable of amazing things! Every small step today builds your tomorrow. Keep pushing forward!";
        } else if (lowerQuestion.includes('advice')) {
            return "?? My advice: Trust the process. Be patient with yourself. Growth takes time, but you're on the right path.";
        } else if (lowerQuestion.includes('goal')) {
            return "?? Break your goals into small, daily actions. Consistency compounds. You've got this!";
        } else if (lowerQuestion.includes('grateful')) {
            return "?? Gratitude transforms perspective. Start each day with three things you're thankful for.";
        } else if (lowerQuestion.includes('legacy')) {
            return "??? Your legacy is built through daily choices. Live with purpose, and your impact will outlast you.";
        } else if (lowerQuestion.includes('struggle') || lowerQuestion.includes('hard')) {
            return "?? You're not alone in this. Every challenge is an opportunity to grow. Keep going, you're stronger than you think!";
        } else if (lowerQuestion.includes('grow') || lowerQuestion.includes('improve')) {
            return "?? Growth happens outside your comfort zone. Embrace the journey, learn from every experience, and keep evolving.";
        }
        
        return responses[Math.floor(Math.random() * responses.length)];
    }

    setBotStatus(status) {
        const statusElement = document.querySelector('.chat-status');
        if (statusElement) {
            if (status === 'thinking') {
                statusElement.className = 'chat-status thinking';
                statusElement.innerHTML = `<span class="status-dot thinking"></span> Thinking...`;
            } else {
                statusElement.className = 'chat-status online';
                statusElement.innerHTML = `<span class="status-dot"></span> Online`;
            }
        }
    }

    // ============ TYPING INDICATOR ============

    showTypingIndicator() {
        const container = document.getElementById('legacyChatMessages');
        if (!container) return;

        this.removeTypingIndicator();

        const typingDiv = document.createElement('div');
        typingDiv.id = 'legacyTypingIndicator';
        typingDiv.className = 'message-wrapper bot typing-indicator-wrapper';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i class="fas fa-robot"></i>
            </div>
            <div class="message-content-wrapper">
                <div class="message-bubble typing-bubble">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(typingDiv);
        this.scrollToBottom();
    }

    removeTypingIndicator() {
        const indicator = document.getElementById('legacyTypingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    scrollToBottom() {
        const container = document.getElementById('legacyChatMessages');
        if (container) {
            setTimeout(() => {
                container.scrollTo({
                    top: container.scrollHeight,
                    behavior: 'smooth'
                });
            }, 100);
        }
    }

    // ============ EXPORT CHAT ============

    exportChat() {
        const chatText = this.messages.map(msg => {
            const sender = msg.sender === 'user' ? 'You' : 'Legacy Bot';
            const time = this.formatTime(msg.timestamp);
            return `[${time}] ${sender}: ${msg.text}`;
        }).join('\n\n');

        const header = `?? Legacy Bot Chat Export\n${new Date().toLocaleString()}\n${'='.repeat(50)}\n\n`;
        const fullText = header + chatText;

        const blob = new Blob([fullText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `legacy-bot-chat-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('?? Chat exported successfully!', 'success');
    }

    // ============ PARTICLES ============

    createParticles() {
        const container = document.getElementById('legacyParticles');
        if (!container) return;
        
        const particleCount = 20;
        const colors = ['#6C5CE7', '#A29BFE', '#00CEC9', '#FDCB6E', '#FF6B6B'];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'legacybot-particle';
            const size = 2 + Math.random() * 4;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.top = `${Math.random() * 100}%`;
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.animationDuration = `${15 + Math.random() * 25}s`;
            particle.style.animationDelay = `${Math.random() * 15}s`;
            particle.style.opacity = 0.1 + Math.random() * 0.2;
            container.appendChild(particle);
        }
    }

    // ============ TOAST ============

    showToast(message, type = 'success') {
        const toast = document.getElementById('legacyToast');
        const toastMessage = document.getElementById('legacyToastMessage');
        
        if (toast && toastMessage) {
            toastMessage.textContent = message;
            toast.className = 'legacy-toast show';
            const colors = {
                'success': 'var(--success)',
                'error': 'var(--danger)',
                'warning': 'var(--warning)',
                'info': 'var(--primary)'
            };
            toast.style.borderLeftColor = colors[type] || 'var(--success)';
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        } else if (window.showToast) {
            window.showToast('Legacy Bot', message, type, 2500);
        }
    }
}

export default LegacyBot;
