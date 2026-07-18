// Direct imports - NO dynamic imports
import { Dashboard } from './components/Dashboard.js';
import { Family } from './components/Family.js';
import { Goals } from './components/Goals.js';
import { Tasks } from './components/Tasks.js';
import { Journal } from './components/Journal.js';
import { Achievements } from './components/Achievements.js';
import { Analytics } from './components/Analytics.js';
import { Timeline } from './components/Timeline.js';
import { DreamTree } from './components/DreamTree.js';
import { Inspiration } from './components/Inspiration.js';
import { LegacyBot } from './components/LegacyBot.js';

console.log('📦 Importing components...');

// All components mapped
const components = {
    dashboard: Dashboard,
    family: Family,
    goals: Goals,
    tasks: Tasks,
    journal: Journal,
    achievements: Achievements,
    analytics: Analytics,
    timeline: Timeline,
    dreamtree: DreamTree,
    inspiration: Inspiration,
    legacybot: LegacyBot
};

console.log('✅ Components registered:', Object.keys(components));

export class Router {
    constructor() {
        this.currentPage = null;
        this.currentInstance = null;
    }

    init() {
        console.log('🔄 Router initializing...');
        
        // Handle hash changes
        window.addEventListener('hashchange', () => {
            const page = window.location.hash.replace('#', '') || 'dashboard';
            this.navigate(page);
        });

        // Handle navigation clicks
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                window.location.hash = page;
                this.navigate(page);
                
                // Close mobile menu
                const navMenu = document.getElementById('navMenu');
                if (navMenu) {
                    navMenu.classList.remove('open');
                }
            });
        });

        // Mobile toggle
        const navToggle = document.getElementById('navToggle');
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                const navMenu = document.getElementById('navMenu');
                if (navMenu) {
                    navMenu.classList.toggle('open');
                }
            });
        }

        // Logout
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
                window.location.reload();
            });
        }

        // Load initial page
        const initialPage = window.location.hash.replace('#', '') || 'dashboard';
        this.navigate(initialPage);
        console.log('✅ Router initialized!');
    }

    navigate(page) {
        console.log(`📄 Navigating to: ${page}`);
        
        if (this.currentPage === page) {
            console.log(`⏭️ Already on ${page}`);
            return;
        }
        
        this.currentPage = page;

        // Update navigation
        document.querySelectorAll('.nav-menu a').forEach(link => {
            const isActive = link.dataset.page === page;
            link.classList.toggle('active', isActive);
        });

        // Get component
        const Component = components[page];
        
        if (!Component) {
            console.warn(`⚠️ Component "${page}" not found`);
            document.getElementById('page-content').innerHTML = `
                <div class="card" style="max-width: 500px; margin: 100px auto; padding: 40px; text-align: center;">
                    <h1>📄 ${page}</h1>
                    <p style="color: #636E72;">Component "${page}" not found</p>
                    <button class="btn btn-primary" onclick="window.location.hash='dashboard'">Go to Dashboard</button>
                </div>
            `;
            return;
        }

        try {
            console.log(`🔨 Creating instance of ${page}...`);
            const instance = new Component();
            const result = instance.render();
            
            if (result && typeof result.then === 'function') {
                result.then(() => {
                    this.currentInstance = instance;
                    console.log(`✅ Page loaded: ${page}`);
                }).catch(error => {
                    console.error(`❌ Render error:`, error);
                    this.showError(error.message);
                });
            } else {
                this.currentInstance = instance;
                console.log(`✅ Page loaded: ${page}`);
            }
        } catch (error) {
            console.error(`❌ Failed to load page ${page}:`, error);
            this.showError(error.message);
        }
    }

    showError(message) {
        document.getElementById('page-content').innerHTML = `
            <div class="error-state card" style="max-width: 500px; margin: 100px auto; text-align: center; padding: 40px;">
                <h2>❌ Error Loading Page</h2>
                <p style="margin: 20px 0; color: var(--gray);">${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
}
