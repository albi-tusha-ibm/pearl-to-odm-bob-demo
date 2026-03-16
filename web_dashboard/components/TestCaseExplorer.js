/**
 * TestCaseExplorer Component
 * Interactive test case selector with decision simulation
 */

import { BaseComponent } from './BaseComponent.js';
import { DecisionSimulator } from '../services/DecisionSimulator.js';

export class TestCaseExplorer extends BaseComponent {
    /**
     * Initialize the TestCaseExplorer component
     * @param {HTMLElement} container - Container element
     * @param {Object} props - Component properties
     * @param {Array} props.testCases - Array of test case objects
     * @param {Array} props.expectedDecisions - Array of expected decisions from CSV
     */
    constructor(container, props = {}) {
        super(container, props);
        
        this.simulator = new DecisionSimulator();
        
        this.state = {
            selectedTestCase: null,
            selectedTestCaseData: null,
            expectedDecision: null,
            simulatedDecision: null,
            isSimulating: false,
            error: null,
            showRuleTrace: false
        };
    }

    /**
     * Initialize component
     */
    init() {
        // Select first test case by default
        if (this.props.testCases && this.props.testCases.length > 0) {
            const firstCase = this.props.testCases[0];
            this.state.selectedTestCase = firstCase.filename;
            this.state.selectedTestCaseData = firstCase.data;
            this.loadExpectedDecision(firstCase.filename);
        }
    }

    /**
     * Render the component
     */
    render() {
        const { testCases } = this.props;
        const { selectedTestCase, selectedTestCaseData, expectedDecision, simulatedDecision, isSimulating, error, showRuleTrace } = this.state;

        if (!testCases || testCases.length === 0) {
            return this.renderEmptyState();
        }

        return `
            <div class="test-case-explorer">
                ${this.renderHeader()}
                ${this.renderInfoPanel()}
                ${error ? this.renderError(error) : ''}
                
                <div class="explorer-content">
                    <div class="explorer-sidebar">
                        ${this.renderTestCaseSelector()}
                        ${this.renderNavigationButtons()}
                    </div>
                    
                    <div class="explorer-main">
                        <div class="test-case-panels">
                            ${this.renderInputPanel()}
                            ${this.renderExpectedPanel()}
                        </div>
                        
                        ${this.renderSimulationControls()}
                        
                        ${simulatedDecision ? this.renderSimulatedPanel() : ''}
                        ${simulatedDecision ? this.renderComparisonPanel() : ''}
                        ${simulatedDecision && showRuleTrace ? this.renderRuleTrace() : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render header
     */
    renderHeader() {
        const { testCases } = this.props;
        const { selectedTestCase } = this.state;
        
        const currentIndex = testCases.findIndex(tc => tc.filename === selectedTestCase);
        const caseNumber = currentIndex >= 0 ? currentIndex + 1 : 0;
        
        return `
            <div class="explorer-header">
                <h2>🧪 Test Case Explorer</h2>
                <div class="header-info">
                    <span class="case-counter">Case ${caseNumber} of ${testCases.length}</span>
                    <span class="case-name">${selectedTestCase || 'No case selected'}</span>
                </div>
            </div>
        `;
    }

    /**
     * Render info panel with helpful context
     */
    renderInfoPanel() {
        return `
            <div class="info-panel">
                <div class="info-icon">ℹ️</div>
                <div class="info-content">
                    <h4>About Test Case Explorer</h4>
                    <p>
                        This interactive tool lets you test the <strong>simulated ODM decision engine</strong>
                        against real loan application data. Select a test case, view the input data and expected
                        decision, then click <strong>"Run Simulation"</strong> to see how the ODM rules execute.
                    </p>
                    <ul class="info-tips">
                        <li><strong>📋 60 Test Cases:</strong> Real-world loan scenarios covering various eligibility, pricing, and documentation rules</li>
                        <li><strong>🤖 Browser Simulation:</strong> Decision logic runs entirely in your browser - no backend needed!</li>
                        <li><strong>✓ Parity Check:</strong> Compare simulated results against expected decisions to verify accuracy</li>
                        <li><strong>🔍 Rule Trace:</strong> See exactly which rules fired and in what order during execution</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Render test case selector dropdown
     */
    renderTestCaseSelector() {
        const { testCases } = this.props;
        const { selectedTestCase } = this.state;

        return `
            <div class="test-case-selector">
                <label for="test-case-dropdown">
                    <span class="label-icon">📋</span>
                    Select Test Case
                </label>
                <select id="test-case-dropdown" class="form-select">
                    ${testCases.map(tc => `
                        <option value="${tc.filename}" ${tc.filename === selectedTestCase ? 'selected' : ''}>
                            ${tc.filename}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;
    }

    /**
     * Render navigation buttons
     */
    renderNavigationButtons() {
        const { testCases } = this.props;
        const { selectedTestCase } = this.state;
        
        const currentIndex = testCases.findIndex(tc => tc.filename === selectedTestCase);
        const hasPrevious = currentIndex > 0;
        const hasNext = currentIndex < testCases.length - 1;

        return `
            <div class="navigation-buttons">
                <button id="prev-case" class="btn btn-secondary" ${!hasPrevious ? 'disabled' : ''}>
                    ← Previous
                </button>
                <button id="next-case" class="btn btn-secondary" ${!hasNext ? 'disabled' : ''}>
                    Next →
                </button>
            </div>
        `;
    }

    /**
     * Render input data panel
     */
    renderInputPanel() {
        const { selectedTestCaseData } = this.state;

        if (!selectedTestCaseData) {
            return '<div class="panel">No test case data available</div>';
        }

        return `
            <div class="panel input-panel">
                <div class="panel-header">
                    <h3>📄 Loan Application Input</h3>
                    <button id="copy-input" class="btn-icon" title="Copy JSON">📋</button>
                </div>
                <div class="panel-content">
                    <pre><code class="language-json">${this.escapeHtml(JSON.stringify(selectedTestCaseData, null, 2))}</code></pre>
                </div>
            </div>
        `;
    }

    /**
     * Render expected decision panel
     */
    renderExpectedPanel() {
        const { expectedDecision } = this.state;

        if (!expectedDecision) {
            return `
                <div class="panel expected-panel">
                    <div class="panel-header">
                        <h3>✓ Expected Decision</h3>
                    </div>
                    <div class="panel-content">
                        <p class="text-muted">No expected decision found for this test case</p>
                    </div>
                </div>
            `;
        }

        return `
            <div class="panel expected-panel">
                <div class="panel-header">
                    <h3>✓ Expected Decision</h3>
                </div>
                <div class="panel-content">
                    <div class="decision-summary">
                        <div class="decision-field">
                            <label>Eligibility Result:</label>
                            <span class="badge badge-${expectedDecision.result === 'approve' ? 'success' : 'danger'}">
                                ${expectedDecision.result || 'N/A'}
                            </span>
                        </div>
                        <div class="decision-field">
                            <label>Reason:</label>
                            <span>${expectedDecision.reason || 'N/A'}</span>
                        </div>
                        <div class="decision-field">
                            <label>MI Rate (bps):</label>
                            <span>${expectedDecision.miRateBps || 'N/A'}</span>
                        </div>
                        <div class="decision-field">
                            <label>Flags:</label>
                            <span>${expectedDecision.flags || 'None'}</span>
                        </div>
                        <div class="decision-field">
                            <label>Required Docs:</label>
                            <span>${expectedDecision.requiredDocs || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render simulation controls
     */
    renderSimulationControls() {
        const { isSimulating, simulatedDecision } = this.state;

        return `
            <div class="simulation-controls">
                <button id="run-simulation" class="btn btn-primary" ${isSimulating ? 'disabled' : ''}>
                    ${isSimulating ? '⏳ Simulating...' : '▶️ Run Simulation'}
                </button>
                ${simulatedDecision ? `
                    <button id="clear-simulation" class="btn btn-secondary">
                        🗑️ Clear Results
                    </button>
                    <button id="toggle-trace" class="btn btn-secondary">
                        ${this.state.showRuleTrace ? '👁️ Hide' : '👁️ Show'} Rule Trace
                    </button>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render simulated decision panel
     */
    renderSimulatedPanel() {
        const { simulatedDecision } = this.state;

        if (!simulatedDecision) return '';

        return `
            <div class="panel simulated-panel">
                <div class="panel-header">
                    <h3>🤖 Simulated Decision</h3>
                    <span class="execution-time">${simulatedDecision.executionTime.toFixed(2)}ms</span>
                </div>
                <div class="panel-content">
                    <div class="decision-summary">
                        <div class="decision-field">
                            <label>Eligibility Result:</label>
                            <span class="badge badge-${simulatedDecision.eligibility.result === 'approve' ? 'success' : 'danger'}">
                                ${simulatedDecision.eligibility.result || 'N/A'}
                            </span>
                        </div>
                        <div class="decision-field">
                            <label>Reason:</label>
                            <span>${simulatedDecision.eligibility.reason || 'N/A'}</span>
                        </div>
                        <div class="decision-field">
                            <label>MI Rate (bps):</label>
                            <span>${simulatedDecision.pricing.miRateBps !== null ? simulatedDecision.pricing.miRateBps : 'N/A'}</span>
                        </div>
                        <div class="decision-field">
                            <label>Flags:</label>
                            <span>${simulatedDecision.eligibility.flags.length > 0 ? simulatedDecision.eligibility.flags.join(', ') : 'None'}</span>
                        </div>
                        <div class="decision-field">
                            <label>Required Docs:</label>
                            <span>${simulatedDecision.documentation.requiredDocs.length > 0 ? simulatedDecision.documentation.requiredDocs.join(', ') : 'N/A'}</span>
                        </div>
                        <div class="decision-field">
                            <label>Rules Fired:</label>
                            <span>${simulatedDecision.rulesFired.length} rules</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render comparison panel
     */
    renderComparisonPanel() {
        const { expectedDecision, simulatedDecision } = this.state;

        if (!expectedDecision || !simulatedDecision) return '';

        const comparison = this.compareDecisions(expectedDecision, simulatedDecision);

        return `
            <div class="panel comparison-panel">
                <div class="panel-header">
                    <h3>📊 Comparison Results</h3>
                    <span class="match-indicator ${comparison.overallMatch ? 'match' : 'mismatch'}">
                        ${comparison.overallMatch ? '✓ Match' : '✗ Mismatch'}
                    </span>
                </div>
                <div class="panel-content">
                    <table class="comparison-table">
                        <thead>
                            <tr>
                                <th>Field</th>
                                <th>Expected</th>
                                <th>Simulated</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${comparison.fields.map(field => `
                                <tr class="${field.match ? 'match' : 'mismatch'}">
                                    <td>${field.name}</td>
                                    <td>${field.expected}</td>
                                    <td>${field.simulated}</td>
                                    <td>
                                        <span class="status-icon">${field.match ? '✓' : '✗'}</span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * Render rule trace
     */
    renderRuleTrace() {
        const { simulatedDecision } = this.state;

        if (!simulatedDecision || !simulatedDecision.rulesFired) return '';

        return `
            <div class="panel rule-trace-panel">
                <div class="panel-header">
                    <h3>🔍 Rule Execution Trace</h3>
                </div>
                <div class="panel-content">
                    <div class="rule-trace">
                        ${simulatedDecision.rulesFired.map((rule, index) => `
                            <div class="trace-item">
                                <span class="trace-number">${index + 1}</span>
                                <span class="trace-rule-id">${rule.ruleId}</span>
                                <span class="trace-rule-name">${rule.ruleName}</span>
                                <span class="trace-priority">Priority: ${rule.priority}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        return `
            <div class="test-case-explorer-empty">
                <div class="empty-state">
                    <h3>📋 No Test Cases Available</h3>
                    <p>No test case files could be loaded. Please check:</p>
                    <ul>
                        <li>The <code>legacy_perl/samples/</code> directory exists</li>
                        <li>Test case JSON files are present</li>
                        <li>The web server is running correctly</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Render error message
     */
    renderError(message) {
        return `
            <div class="error-banner">
                <span class="error-icon">⚠️</span>
                <span class="error-text">${this.escapeHtml(message)}</span>
                <button id="dismiss-error" class="btn-link">✕</button>
            </div>
        `;
    }

    /**
     * After mount - set up event listeners
     */
    afterMount() {
        // Clear existing event listeners
        this.removeAllEventListeners();

        // Test case selector
        const selector = this.$('#test-case-dropdown');
        if (selector) {
            this.addEventListener(selector, 'change', (e) => {
                this.handleTestCaseSelection(e.target.value);
            });
        }

        // Navigation buttons
        const prevBtn = this.$('#prev-case');
        if (prevBtn) {
            this.addEventListener(prevBtn, 'click', () => {
                this.navigateTestCase(-1);
            });
        }

        const nextBtn = this.$('#next-case');
        if (nextBtn) {
            this.addEventListener(nextBtn, 'click', () => {
                this.navigateTestCase(1);
            });
        }

        // Simulation controls
        const runBtn = this.$('#run-simulation');
        if (runBtn) {
            this.addEventListener(runBtn, 'click', () => {
                this.runSimulation();
            });
        }

        const clearBtn = this.$('#clear-simulation');
        if (clearBtn) {
            this.addEventListener(clearBtn, 'click', () => {
                this.clearSimulation();
            });
        }

        const traceBtn = this.$('#toggle-trace');
        if (traceBtn) {
            this.addEventListener(traceBtn, 'click', () => {
                this.toggleRuleTrace();
            });
        }

        // Copy button
        const copyBtn = this.$('#copy-input');
        if (copyBtn) {
            this.addEventListener(copyBtn, 'click', () => {
                this.copyInputData();
            });
        }

        // Error dismiss
        const dismissBtn = this.$('#dismiss-error');
        if (dismissBtn) {
            this.addEventListener(dismissBtn, 'click', () => {
                this.setState({ error: null });
            });
        }

        // Apply syntax highlighting
        if (window.Prism) {
            window.Prism.highlightAllUnder(this.container);
        }
    }

    /**
     * Handle test case selection
     */
    handleTestCaseSelection(filename) {
        const testCase = this.props.testCases.find(tc => tc.filename === filename);
        
        if (testCase) {
            this.state.selectedTestCase = filename;
            this.state.selectedTestCaseData = testCase.data;
            this.state.simulatedDecision = null;
            this.state.showRuleTrace = false;
            this.loadExpectedDecision(filename);
            this.setState({}, true); // Trigger re-render
        }
    }

    /**
     * Navigate to previous/next test case
     */
    navigateTestCase(direction) {
        const { testCases } = this.props;
        const { selectedTestCase } = this.state;
        
        const currentIndex = testCases.findIndex(tc => tc.filename === selectedTestCase);
        const newIndex = currentIndex + direction;
        
        if (newIndex >= 0 && newIndex < testCases.length) {
            this.handleTestCaseSelection(testCases[newIndex].filename);
        }
    }

    /**
     * Load expected decision for a test case
     */
    loadExpectedDecision(filename) {
        const { expectedDecisions } = this.props;
        
        if (!expectedDecisions) {
            this.state.expectedDecision = null;
            return;
        }

        const expected = expectedDecisions.find(ed => ed.file === filename);
        
        if (expected) {
            this.state.expectedDecision = {
                result: expected['eligibility.result'],
                reason: expected.reason,
                miRateBps: expected.miRateBps,
                flags: expected.flags,
                requiredDocs: expected.requiredDocs
            };
        } else {
            this.state.expectedDecision = null;
        }
    }

    /**
     * Run simulation
     */
    runSimulation() {
        const { selectedTestCaseData } = this.state;
        
        if (!selectedTestCaseData) {
            this.setState({ error: 'No test case data available' });
            return;
        }

        this.state.isSimulating = true;
        this.setState({}, true); // Show loading state

        // Simulate async operation
        setTimeout(() => {
            try {
                const decision = this.simulator.simulate(selectedTestCaseData);
                this.setState({
                    simulatedDecision: decision,
                    isSimulating: false,
                    error: null
                });
            } catch (error) {
                console.error('Simulation error:', error);
                this.setState({
                    error: `Simulation failed: ${error.message}`,
                    isSimulating: false
                });
            }
        }, 100);
    }

    /**
     * Clear simulation results
     */
    clearSimulation() {
        this.setState({
            simulatedDecision: null,
            showRuleTrace: false
        });
    }

    /**
     * Toggle rule trace visibility
     */
    toggleRuleTrace() {
        this.setState({
            showRuleTrace: !this.state.showRuleTrace
        });
    }

    /**
     * Copy input data to clipboard
     */
    copyInputData() {
        const { selectedTestCaseData } = this.state;
        
        if (selectedTestCaseData) {
            const json = JSON.stringify(selectedTestCaseData, null, 2);
            navigator.clipboard.writeText(json).then(() => {
                // Could show a toast notification here
                console.log('Input data copied to clipboard');
            });
        }
    }

    /**
     * Compare expected and simulated decisions
     */
    compareDecisions(expected, simulated) {
        const fields = [];
        let overallMatch = true;

        // Compare eligibility result
        const resultMatch = expected.result === simulated.eligibility.result;
        fields.push({
            name: 'Eligibility Result',
            expected: expected.result || 'N/A',
            simulated: simulated.eligibility.result || 'N/A',
            match: resultMatch
        });
        if (!resultMatch) overallMatch = false;

        // Compare reason (only if both have values)
        if (expected.reason && simulated.eligibility.reason) {
            const reasonMatch = expected.reason === simulated.eligibility.reason;
            fields.push({
                name: 'Reason',
                expected: expected.reason,
                simulated: simulated.eligibility.reason,
                match: reasonMatch
            });
            if (!reasonMatch) overallMatch = false;
        }

        // Compare MI rate (only for approved cases)
        if (expected.miRateBps && simulated.pricing.miRateBps !== null) {
            const rateMatch = parseInt(expected.miRateBps) === parseInt(simulated.pricing.miRateBps);
            fields.push({
                name: 'MI Rate (bps)',
                expected: expected.miRateBps,
                simulated: simulated.pricing.miRateBps,
                match: rateMatch
            });
            if (!rateMatch) overallMatch = false;
        }

        return { overallMatch, fields };
    }
}

export default TestCaseExplorer;

// Made with Bob