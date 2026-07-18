// Import router and auth
import { Router } from './router.js';
import { auth } from './services/auth.js';

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Life Dashboard starting...');
    
    const loadingScreen = document.getElementById('loadingScreen');
    const navbar = document.getElementById('navbar');
    const mainContent = document.getElementById('main-content');
    const pageContent = document.getElementById('page-content');
    
    if (!pageContent) {
        console.error('❌ Page content element not found!');
        return;
    }

    // Check authentication
    const isAuthenticated = auth.isAuthenticated();
    console.log('🔐 Authenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
        showLoginScreen(pageContent);
        if (loadingScreen) loadingScreen.style.display = 'none';
        return;
    }

    // Update username
    const user = auth.getUser();
    const usernameElement = document.getElementById('username');
    if (user && usernameElement) {
        usernameElement.textContent = user.full_name || user.username;
    }

    // Initialize router
    try {
        const router = new Router();
        // router.init() returns undefined, not a Promise
        router.init();
        console.log('🎉 Router initialized!');
        
        // Show app
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (navbar) navbar.style.display = 'block';
        if (mainContent) mainContent.style.display = 'block';
        
        const app = document.getElementById('app');
        if (app) app.classList.add('loaded');
        
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        if (loadingScreen) loadingScreen.style.display = 'none';
        pageContent.innerHTML = `
            <div class="error-state card" style="max-width: 500px; margin: 100px auto; text-align: center; padding: 40px;">
                <h2>❌ Failed to Load Dashboard</h2>
                <p style="margin: 20px 0; color: var(--gray);">${error.message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Retry</button>
            </div>
        `;
    }
});

// Show login screen
function showLoginScreen(container) {
    if (!container) return;
    
    container.innerHTML = `
        <div class="login-prompt card" style="max-width: 400px; margin: 100px auto; text-align: center; padding: 40px; background: white; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.08);">
            <h2 style="margin-bottom: 20px;">🔐 Welcome to Life Dashboard</h2>
            <p style="margin: 20px 0; color: #636E72;">Please login to continue</p>
            <div style="display: flex; flex-direction: column; gap: 10px; max-width: 300px; margin: 0 auto;">
                <input type="text" id="loginUsername" placeholder="Username" style="padding: 12px; border-radius: 8px; border: 1px solid #DFE6E9; font-size: 1rem;">
                <input type="password" id="loginPassword" placeholder="Password" style="padding: 12px; border-radius: 8px; border: 1px solid #DFE6E9; font-size: 1rem;">
                <button class="btn btn-primary" id="loginBtn" style="width: 100%; padding: 12px; font-size: 1rem;">Login</button>
            </div>
            <p style="margin-top: 20px; font-size: 0.8rem; color: #636E72;">
                Demo: username: "aman", password: "password123"
            </p>
            <div id="loginError" style="color: #E17055; margin-top: 10px; display: none;"></div>
        </div>
    `;
    
    // Setup login
    const loginBtn = document.getElementById('loginBtn');
    const loginUsername = document.getElementById('loginUsername');
    const loginPassword = document.getElementById('loginPassword');
    const loginError = document.getElementById('loginError');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const username = loginUsername?.value || '';
            const password = loginPassword?.value || '';
            
            if (!username || !password) {
                if (loginError) {
                    loginError.textContent = '⚠️ Please enter username and password';
                    loginError.style.display = 'block';
                }
                return;
            }
            
            try {
                if (loginError) loginError.style.display = 'none';
                loginBtn.textContent = 'Logging in...';
                loginBtn.disabled = true;
                
                const result = await auth.login(username, password);
                if (result && result.access_token) {
                    console.log('✅ Login successful!');
                    window.location.reload();
                }
            } catch (error) {
                console.error('❌ Login failed:', error);
                if (loginError) {
                    loginError.textContent = '❌ ' + (error.message || 'Login failed. Please try again.');
                    loginError.style.display = 'block';
                }
                loginBtn.textContent = 'Login';
                loginBtn.disabled = false;
            }
        });
        
        loginPassword?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') loginBtn.click();
        });
        loginUsername?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') loginBtn.click();
        });
    }
}

// Expose for debugging
window.__app = { auth };
console.log('💡 Type window.__app to access app services');
