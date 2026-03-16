/**
 * BaseComponent - Abstract base class for Web Components
 * Provides common functionality for lifecycle management, rendering, and event handling
 */

export class BaseComponent {
    /**
     * Create a new component
     * @param {HTMLElement} container - Container element to render into
     * @param {Object} props - Initial properties
     */
    constructor(container, props = {}) {
        if (new.target === BaseComponent) {
            throw new TypeError('Cannot construct BaseComponent instances directly');
        }

        this.container = container;
        this.props = props;
        this.state = {};
        this.mounted = false;
        this.eventListeners = [];
    }

    /**
     * Initialize the component (called before first render)
     * Override in subclasses for custom initialization
     */
    init() {
        // Override in subclasses
    }

    /**
     * Render the component
     * Must be implemented by subclasses
     * @returns {string} HTML string to render
     */
    render() {
        throw new Error('render() must be implemented by subclass');
    }

    /**
     * Mount the component to the DOM
     * Calls init(), render(), and afterMount() in sequence
     */
    mount() {
        if (this.mounted) {
            console.warn('Component already mounted');
            return;
        }

        try {
            // Initialize component
            this.init();

            // Render to container
            const html = this.render();
            this.container.innerHTML = html;

            // Mark as mounted
            this.mounted = true;

            // Call lifecycle hook
            this.afterMount();

        } catch (error) {
            console.error('Error mounting component:', error);
            this.handleError(error);
        }
    }

    /**
     * Lifecycle hook called after component is mounted
     * Override in subclasses for post-mount setup (e.g., event listeners)
     */
    afterMount() {
        // Override in subclasses
    }

    /**
     * Update component with new props
     * @param {Object} newProps - New properties
     */
    update(newProps = {}) {
        if (!this.mounted) {
            console.warn('Cannot update unmounted component');
            return;
        }

        const prevProps = { ...this.props };
        this.props = { ...this.props, ...newProps };

        // Call lifecycle hook
        this.beforeUpdate(prevProps);

        // Re-render
        try {
            const html = this.render();
            this.container.innerHTML = html;

            // Re-attach event listeners
            this.afterMount();

            // Call lifecycle hook
            this.afterUpdate(prevProps);

        } catch (error) {
            console.error('Error updating component:', error);
            this.handleError(error);
        }
    }

    /**
     * Lifecycle hook called before component updates
     * @param {Object} prevProps - Previous properties
     */
    beforeUpdate(prevProps) {
        // Override in subclasses
    }

    /**
     * Lifecycle hook called after component updates
     * @param {Object} prevProps - Previous properties
     */
    afterUpdate(prevProps) {
        // Override in subclasses
    }

    /**
     * Unmount the component from the DOM
     * Cleans up event listeners and calls beforeUnmount()
     */
    unmount() {
        if (!this.mounted) {
            return;
        }

        // Call lifecycle hook
        this.beforeUnmount();

        // Remove all event listeners
        this.removeAllEventListeners();

        // Clear container
        this.container.innerHTML = '';

        // Mark as unmounted
        this.mounted = false;
    }

    /**
     * Lifecycle hook called before component unmounts
     * Override in subclasses for cleanup
     */
    beforeUnmount() {
        // Override in subclasses
    }

    /**
     * Add an event listener and track it for cleanup
     * @param {HTMLElement} element - Element to attach listener to
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function
     * @param {Object} options - Event listener options
     */
    addEventListener(element, event, handler, options = {}) {
        if (!element) {
            console.warn('Cannot add event listener to null element');
            return;
        }

        element.addEventListener(event, handler, options);
        
        // Track for cleanup
        this.eventListeners.push({
            element,
            event,
            handler,
            options
        });
    }

    /**
     * Remove a specific event listener
     * @param {HTMLElement} element - Element to remove listener from
     * @param {string} event - Event name
     * @param {Function} handler - Event handler function
     */
    removeEventListener(element, event, handler) {
        if (!element) {
            return;
        }

        element.removeEventListener(event, handler);
        
        // Remove from tracking
        this.eventListeners = this.eventListeners.filter(
            listener => !(listener.element === element && 
                         listener.event === event && 
                         listener.handler === handler)
        );
    }

    /**
     * Remove all tracked event listeners
     */
    removeAllEventListeners() {
        this.eventListeners.forEach(({ element, event, handler }) => {
            element.removeEventListener(event, handler);
        });
        this.eventListeners = [];
    }

    /**
     * Query selector within component container
     * @param {string} selector - CSS selector
     * @returns {HTMLElement|null} Found element or null
     */
    $(selector) {
        return this.container.querySelector(selector);
    }

    /**
     * Query selector all within component container
     * @param {string} selector - CSS selector
     * @returns {NodeList} List of found elements
     */
    $$(selector) {
        return this.container.querySelectorAll(selector);
    }

    /**
     * Set component state and optionally re-render
     * @param {Object} updates - State updates
     * @param {boolean} shouldRender - Whether to re-render after state update
     */
    setState(updates, shouldRender = true) {
        this.state = { ...this.state, ...updates };
        
        if (shouldRender && this.mounted) {
            this.update();
        }
    }

    /**
     * Get component state
     * @returns {Object} Current state
     */
    getState() {
        return { ...this.state };
    }

    /**
     * Handle component errors
     * @param {Error} error - Error object
     */
    handleError(error) {
        console.error('Component error:', error);
        
        // Render error state
        this.container.innerHTML = `
            <div class="component-error" style="padding: 1rem; background-color: #fee; border: 1px solid #fcc; border-radius: 4px;">
                <h3 style="color: #c00; margin-bottom: 0.5rem;">⚠️ Component Error</h3>
                <p style="color: #600;">${error.message}</p>
            </div>
        `;
    }

    /**
     * Create an HTML element from a string
     * @param {string} html - HTML string
     * @returns {HTMLElement} Created element
     */
    createElement(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild;
    }

    /**
     * Escape HTML to prevent XSS
     * @param {string} str - String to escape
     * @returns {string} Escaped string
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Format date for display
     * @param {Date|string} date - Date to format
     * @returns {string} Formatted date string
     */
    formatDate(date) {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /**
     * Format number with commas
     * @param {number} num - Number to format
     * @returns {string} Formatted number string
     */
    formatNumber(num) {
        return num.toLocaleString('en-US');
    }

    /**
     * Debounce a function
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 300) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    /**
     * Throttle a function
     * @param {Function} func - Function to throttle
     * @param {number} limit - Time limit in milliseconds
     * @returns {Function} Throttled function
     */
    throttle(func, limit = 300) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

export default BaseComponent;

// Made with Bob
