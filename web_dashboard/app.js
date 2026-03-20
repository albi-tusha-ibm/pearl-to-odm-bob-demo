/**
 * Main Application Controller
 * Handles initialization, tab navigation, state management, and routing
 */

import { DataLoader } from './services/DataLoader.js';
import { DecisionSimulator } from './services/DecisionSimulator.js';
import { RuleViewer } from './components/RuleViewer.js';
import { TestCaseExplorer } from './components/TestCaseExplorer.js';
import { ParityReport } from './components/ParityReport.js';
import { DecisionComparison } from './components/DecisionComparison.js';
import { DecisionEngine } from './components/DecisionEngine.js';

/**
 * AppState - Observable state management using observer pattern
 */
class AppState {
    constructor() {
        this.state = {
            currentTab: 'rule-viewer',
            rules: null,
            testCases: null,
            expectedDecisions: null,
            selectedRule: null,
            selectedTestCase: null,
            loading: false,
            error: null
        };
        this.observers = [];
    }

    /**
     * Subscribe to state changes
     * @param {Function} callback - Function to call when state changes
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.observers.push(callback);
        return () => {
            this.observers = this.observers.filter(obs => obs !== callback);
        };
    }

    /**
     * Update state and notify observers
     * @param {Object} updates - Partial state updates
     */
    setState(updates) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...updates };
        
        // Notify all observers
        this.observers.forEach(callback => {
            callback(this.state, prevState);
        });
    }

    /**
     * Get current state
     * @returns {Object} Current state
     */
    getState() {
        return { ...this.state };
    }
}

/**
 * App - Main application controller
 */
class App {
    constructor() {
        this.state = new AppState();
        this.dataLoader = new DataLoader();
        this.decisionSimulator = new DecisionSimulator();
        this.initialized = false;
        this.components = {
            ruleViewer: null,
            testExplorer: null,
            parityReport: null,
            decisionComparison: null,
            decisionEngine: null
        };
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing dashboard...');
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadInitialData();
            
            // Hide loading indicator and show app
            this.hideLoading();
            
            // Initialize the first tab
            this.initializeCurrentTab();
            
            this.initialized = true;
            console.log('Dashboard initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            this.showError('Failed to initialize dashboard: ' + error.message);
        }
    }

    /**
     * Set up event listeners for navigation and interactions
     */
    setupEventListeners() {
        // Tab navigation
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.currentTarget.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });

        // Error dismiss button
        const errorDismiss = document.getElementById('error-dismiss');
        if (errorDismiss) {
            errorDismiss.addEventListener('click', () => {
                this.hideError();
            });
        }

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.tab) {
                this.switchTab(e.state.tab, false);
            }
        });

        // Subscribe to state changes
        this.state.subscribe((newState, prevState) => {
            this.handleStateChange(newState, prevState);
        });
    }

    /**
     * Load initial data from files
     */
    async loadInitialData() {
        this.state.setState({ loading: true });

        try {
            console.log('Loading initial data...');
            
            // Only load rules initially (test cases and decisions loaded on demand)
            const rules = await this.dataLoader.loadRules();

            this.state.setState({
                rules,
                testCases: null,  // Load on demand when Test Explorer tab is opened
                expectedDecisions: null,  // Load on demand
                loading: false
            });

            console.log(`Loaded ${rules.length} rules`);
            
        } catch (error) {
            this.state.setState({ loading: false, error: error.message });
            throw error;
        }
    }

    /**
     * Switch to a different tab
     * @param {string} tabId - ID of the tab to switch to
     * @param {boolean} updateHistory - Whether to update browser history
     */
    switchTab(tabId, updateHistory = true) {
        console.log(`Switching to tab: ${tabId}`);

        // Update active tab button
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            const isActive = button.getAttribute('data-tab') === tabId;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-selected', isActive);
        });

        // Update active content panel
        const contentPanels = document.querySelectorAll('.content-panel');
        contentPanels.forEach(panel => {
            const isActive = panel.id === `${tabId}-panel`;
            panel.classList.toggle('active', isActive);
            
            if (isActive) {
                panel.removeAttribute('hidden');
            } else {
                panel.setAttribute('hidden', '');
            }
        });

        // Update state
        this.state.setState({ currentTab: tabId });

        // Update browser history
        if (updateHistory) {
            const url = new URL(window.location);
            url.searchParams.set('tab', tabId);
            window.history.pushState({ tab: tabId }, '', url);
        }

        // Initialize tab content if needed
        this.initializeCurrentTab();
    }

    /**
     * Initialize content for the current tab
     */
    initializeCurrentTab() {
        const currentTab = this.state.getState().currentTab;
        console.log(`Initializing tab: ${currentTab}`);

        // Tab-specific initialization will be handled by components
        // For now, just log the action
        switch (currentTab) {
            case 'rule-viewer':
                this.initRuleViewer();
                break;
            case 'test-explorer':
                this.initTestExplorer();
                break;
            case 'decision-engine':
                this.initDecisionEngine();
                break;
            case 'parity-report':
                this.initParityReport();
                break;
            case 'decision-comparison':
                this.initDecisionComparison();
                break;
        }
    }

    /**
     * Initialize Rule Viewer tab
     */
    initRuleViewer() {
        const content = document.getElementById('rule-viewer-content');
        const state = this.state.getState();
        
        if (!state.rules || state.rules.length === 0) {
            content.innerHTML = `
                <div class="placeholder-message">
                    <p>No rules loaded. Please check the data directory.</p>
                </div>
            `;
            return;
        }

        // Initialize RuleViewer component if not already created
        if (!this.components.ruleViewer) {
            this.components.ruleViewer = new RuleViewer(content, {
                rules: state.rules,
                dataLoader: this.dataLoader
            });
            this.components.ruleViewer.mount();
        } else {
            // Update existing component with latest data
            this.components.ruleViewer.update({
                rules: state.rules,
                dataLoader: this.dataLoader
            });
        }
    }

    /**
     * Initialize Test Explorer tab
     */
    async initTestExplorer() {
        const content = document.getElementById('test-explorer-content');
        const state = this.state.getState();
        
        // Load test cases and expected decisions if not already loaded
        if (!state.testCases || !state.expectedDecisions) {
            content.innerHTML = `
                <div class="placeholder-message">
                    <p>⏳ Loading test cases...</p>
                </div>
            `;
            
            try {
                const testCases = await this.dataLoader.loadTestCases();
                const expectedDecisions = await this.dataLoader.loadExpectedDecisions();
                
                this.state.setState({
                    testCases,
                    expectedDecisions
                });
                
                console.log(`Loaded ${testCases.length} test cases and ${expectedDecisions.length} expected decisions`);
            } catch (error) {
                console.error('Failed to load test data:', error);
                content.innerHTML = `
                    <div class="placeholder-message error">
                        <p>❌ Failed to load test cases: ${error.message}</p>
                    </div>
                `;
                return;
            }
        }
        
        const currentState = this.state.getState();
        
        if (!currentState.testCases || currentState.testCases.length === 0) {
            content.innerHTML = `
                <div class="placeholder-message">
                    <p>No test cases loaded. Please check the data directory.</p>
                </div>
            `;
            return;
        }

        // Initialize TestCaseExplorer component if not already created
        if (!this.components.testExplorer) {
            this.components.testExplorer = new TestCaseExplorer(content, {
                testCases: currentState.testCases,
                expectedDecisions: currentState.expectedDecisions
            });
            this.components.testExplorer.mount();
        } else {
            // Update existing component with latest data
            this.components.testExplorer.update({
                testCases: currentState.testCases,
                expectedDecisions: currentState.expectedDecisions
            });
        }
    }

    /**
     * Initialize Decision Engine tab
     */
    async initDecisionEngine() {
        const content = document.getElementById('decision-engine-content');
        const state = this.state.getState();
        
        // Load test cases and expected decisions if not already loaded
        if (!state.testCases || !state.expectedDecisions) {
            content.innerHTML = `
                <div class="placeholder-message">
                    <p>⏳ Loading test data for decision engine...</p>
                </div>
            `;
            
            try {
                const testCases = await this.dataLoader.loadTestCases();
                const expectedDecisions = await this.dataLoader.loadExpectedDecisions();
                
                this.state.setState({
                    testCases,
                    expectedDecisions
                });
                
                console.log(`Loaded ${testCases.length} test cases for decision engine`);
            } catch (error) {
                console.error('Failed to load test data:', error);
                content.innerHTML = `
                    <div class="placeholder-message error">
                        <p>❌ Failed to load test data: ${error.message}</p>
                    </div>
                `;
                return;
            }
        }
        
        const currentState = this.state.getState();
        
        if (!currentState.testCases || currentState.testCases.length === 0) {
            content.innerHTML = `
                <div class="placeholder-message">
                    <p>No test cases available for decision engine.</p>
                </div>
            `;
            return;
        }

        // Initialize DecisionEngine component if not already created
        if (!this.components.decisionEngine) {
            this.components.decisionEngine = new DecisionEngine(content, {
                decisionSimulator: this.decisionSimulator,
                dataLoader: this.dataLoader
                // Don't pass testCases/expectedDecisions as props - let init() load them
            });
            await this.components.decisionEngine.init();
            this.components.decisionEngine.mount();
        } else {
            // Update existing component with latest data
            this.components.decisionEngine.update({
                decisionSimulator: this.decisionSimulator,
                dataLoader: this.dataLoader
            });
        }
    }

    /**
     * Initialize Parity Report tab
     */
    async initParityReport() {
        const content = document.getElementById('parity-report-content');
        const state = this.state.getState();
        
        // Load test cases and expected decisions if not already loaded
        if (!state.testCases || !state.expectedDecisions) {
            content.innerHTML = `
                <div class="placeholder-message">
                    <p>⏳ Loading test data for parity analysis...</p>
                </div>
            `;
            
            try {
                const testCases = await this.dataLoader.loadTestCases();
                const expectedDecisions = await this.dataLoader.loadExpectedDecisions();
                
                this.state.setState({
                    testCases,
                    expectedDecisions
                });
                
                console.log(`Loaded ${testCases.length} test cases for parity analysis`);
            } catch (error) {
                console.error('Failed to load test data:', error);
                content.innerHTML = `
                    <div class="placeholder-message error">
                        <p>❌ Failed to load test data: ${error.message}</p>
                    </div>
                `;
                return;
            }
        }
        
        const currentState = this.state.getState();
        
        if (!currentState.testCases || currentState.testCases.length === 0) {
            content.innerHTML = `
                <div class="placeholder-message">
                    <p>No test cases available for parity analysis.</p>
                </div>
            `;
            return;
        }

        // Initialize ParityReport component if not already created
        if (!this.components.parityReport) {
            this.components.parityReport = new ParityReport(content, {
                decisionSimulator: this.decisionSimulator,
                testCases: currentState.testCases,
                expectedDecisions: currentState.expectedDecisions
            });
            this.components.parityReport.mount();
        } else {
            // Update existing component with latest data
            this.components.parityReport.update({
                decisionSimulator: this.decisionSimulator,
                testCases: currentState.testCases,
                expectedDecisions: currentState.expectedDecisions
            });
        }
    }

    /**
     * Initialize Decision Comparison tab
     */
    async initDecisionComparison() {
        const content = document.getElementById('decision-comparison-content');
        
        // Initialize DecisionComparison component if not already created
        if (!this.components.decisionComparison) {
            this.components.decisionComparison = new DecisionComparison(content, {
                decisionSimulator: this.decisionSimulator
            });
            // Initialize the component (loads parity data)
            await this.components.decisionComparison.init();
            // Mount the component to render it
            this.components.decisionComparison.mount();
        } else {
            // Update existing component
            this.components.decisionComparison.update({
                decisionSimulator: this.decisionSimulator
            });
        }
    }

    /**
     * Handle state changes
     * @param {Object} newState - New state
     * @param {Object} prevState - Previous state
     */
    handleStateChange(newState, prevState) {
        // Handle loading state
        if (newState.loading !== prevState.loading) {
            if (newState.loading) {
                this.showLoading();
            } else {
                this.hideLoading();
            }
        }

        // Handle error state
        if (newState.error !== prevState.error && newState.error) {
            this.showError(newState.error);
        }
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'flex';
        }
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        const loadingIndicator = document.getElementById('loading-indicator');
        const appContainer = document.getElementById('app');
        
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
        if (appContainer) {
            appContainer.style.display = 'block';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     */
    showError(message) {
        const errorDisplay = document.getElementById('error-display');
        const errorMessage = document.getElementById('error-message');
        
        if (errorDisplay && errorMessage) {
            errorMessage.textContent = message;
            errorDisplay.style.display = 'flex';
        }
    }

    /**
     * Hide error message
     */
    hideError() {
        const errorDisplay = document.getElementById('error-display');
        if (errorDisplay) {
            errorDisplay.style.display = 'none';
        }
        this.state.setState({ error: null });
    }
}

/**
 * Initialize app when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    
    // Make app instance globally available for debugging
    window.dashboardApp = app;
    
    // Initialize the application
    app.init().catch(error => {
        console.error('Fatal error during initialization:', error);
    });
});

// Export for use in other modules
export { App, AppState };

// Made with Bob
