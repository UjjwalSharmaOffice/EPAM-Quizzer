/* ==========================================
   THEME TOGGLE SYSTEM
   ========================================== */

class ThemeToggle {
    constructor() {
        this.STORAGE_KEY = 'epam-quiz-theme';
        this.LIGHT_THEME = 'light';
        this.DARK_THEME = 'dark';
        this.init();
    }

    init() {
        // Add disable transitions class on load
        document.documentElement.classList.add('preload');

        // Initialize theme from storage or system preference
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (systemPrefersDark ? this.DARK_THEME : this.LIGHT_THEME);

        this.setTheme(initialTheme, true);

        // Create toggle button
        this.createToggleButton();

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
            if (!localStorage.getItem(this.STORAGE_KEY)) {
                const newTheme = e.matches ? this.DARK_THEME : this.LIGHT_THEME;
                this.setTheme(newTheme);
            }
        });

        // Remove preload class after initial render
        setTimeout(() => {
            document.documentElement.classList.remove('preload');
        }, 100);
    }

    createToggleButton() {
        // Check if button already exists
        if (document.querySelector('.theme-toggle-container')) {
            const btn = document.querySelector('.theme-toggle-btn');
            if (btn) {
                btn.addEventListener('click', () => this.toggle());
            }
            return;
        }

        // Create container
        const container = document.createElement('div');
        container.className = 'theme-toggle-container';

        // Create button
        const button = document.createElement('button');
        button.className = 'theme-toggle-btn';
        button.setAttribute('aria-label', 'Toggle theme');
        button.setAttribute('title', 'Toggle between light and dark theme');
        this.updateButtonIcon(button);

        button.addEventListener('click', () => this.toggle());

        // Create label
        const label = document.createElement('span');
        label.className = 'theme-label';
        label.textContent = this.getCurrentTheme() === this.DARK_THEME ? 'Dark' : 'Light';

        container.appendChild(button);
        container.appendChild(label);
        document.body.appendChild(container);
    }

    updateButtonIcon(button) {
        const currentTheme = this.getCurrentTheme();
        button.textContent = currentTheme === this.DARK_THEME ? '☀️' : '🌙';
        
        // Update label if it exists
        const label = document.querySelector('.theme-label');
        if (label) {
            label.textContent = currentTheme === this.DARK_THEME ? 'Light' : 'Dark';
        }
    }

    setTheme(theme, skipAnimation = false) {
        const html = document.documentElement;
        
        if (theme === this.DARK_THEME) {
            html.setAttribute('data-theme', this.DARK_THEME);
        } else {
            html.removeAttribute('data-theme');
        }

        // Update button icon
        const button = document.querySelector('.theme-toggle-btn');
        if (button) {
            if (!skipAnimation) {
                button.classList.add('switching');
                setTimeout(() => button.classList.remove('switching'), 600);
            }
            this.updateButtonIcon(button);
        }

        // Save preference
        localStorage.setItem(this.STORAGE_KEY, theme);

        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('themechange', {
            detail: { theme }
        }));
    }

    toggle() {
        const currentTheme = this.getCurrentTheme();
        const newTheme = currentTheme === this.DARK_THEME ? this.LIGHT_THEME : this.DARK_THEME;
        this.setTheme(newTheme);
    }

    getCurrentTheme() {
        return document.documentElement.getAttribute('data-theme') || this.LIGHT_THEME;
    }

    isDarkMode() {
        return this.getCurrentTheme() === this.DARK_THEME;
    }
}

// Initialize theme toggle when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ThemeToggle();
    });
} else {
    new ThemeToggle();
}
