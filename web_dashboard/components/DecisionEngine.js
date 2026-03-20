/**
 * DecisionEngine Component
 * Interactive decision engine interface for executing and analyzing decision logic
 */

import { BaseComponent } from './BaseComponent.js';
import { DataLoader } from '../services/DataLoader.js';

export class DecisionEngine extends BaseComponent {
    constructor(container, props = {}) {
        super(container, props);
        
        this.dataLoader = props.dataLoader || new DataLoader();
        this.decisionSimulator = props.decisionSimulator;
        
        this.state = {
            testCases: [],
            expectedDecisions: [],
            selectedTestCase: null,
            selectedTestCaseData: null,
            expectedResult: null,
            actualResult: null,
            isExecuting: false,
            isBatchExecuting: false,
            batchResults: [],
            batchProgress: 0,
            executionTime: 0,
            showComparison: false,
            error: null,
            showAboutSection: false
        };
    }

    /**
     * Fisher-Yates shuffle algorithm
     * Randomizes array order while keeping original data intact
     */
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Initialize component - load test cases and expected decisions
     */
    async init() {
        try {
            // Load test cases if not provided
            if (!this.props.testCases) {
                const testCaseWrappers = await this.dataLoader.loadTestCases();
                // Keep the wrapper objects to preserve filename information
                this.state.testCases = testCaseWrappers
                    .filter(tc => tc.loaded && tc.data)
                    .map(tc => ({
                        ...tc.data,
                        _filename: tc.filename // Store filename for expected result lookup
                    }));
                
                // Randomize the order of test cases for more realistic demo
                this.state.testCases = this.shuffleArray(this.state.testCases);
            } else {
                this.state.testCases = this.props.testCases;
            }

            // Load expected decisions if not provided
            if (!this.props.expectedDecisions) {
                const expectedDecisions = await this.dataLoader.loadExpectedDecisions();
                this.state.expectedDecisions = expectedDecisions;
                
                // Create a lookup map for faster access
                this.expectedResultsMap = {};
                expectedDecisions.forEach(ed => {
                    this.expectedResultsMap[ed.file] = ed;
                });
            } else {
                this.state.expectedDecisions = this.props.expectedDecisions;
                // Create lookup map
                this.expectedResultsMap = {};
                this.props.expectedDecisions.forEach(ed => {
                    this.expectedResultsMap[ed.file] = ed;
                });
            }

        } catch (error) {
            console.error('Failed to initialize DecisionEngine:', error);
            this.state.error = error.message;
        }
    }

    /**
     * Render the component
     */
    render() {
        if (this.state.error) {
            return this.renderError();
        }

        if (this.state.testCases.length === 0) {
            return this.renderLoading();
        }

        return `
            <div class="decision-engine">
                ${this.renderAboutSection()}
                ${this.renderControls()}
                ${this.renderTestCaseSelector()}
                ${this.state.selectedTestCaseData ? this.renderTestCaseDetails() : ''}
                ${this.state.actualResult ? this.renderResults() : ''}
            </div>
        `;
    }

    /**
     * Render error state
     */
    renderError() {
        return `
            <div class="placeholder-message error">
                <p>❌ Error loading Decision Engine: ${this.escapeHtml(this.state.error)}</p>
            </div>
        `;
    }

    /**
     * Render loading state
     */
    renderLoading() {
        return `
            <div class="placeholder-message">
                <p>⏳ Loading test cases...</p>
            </div>
        `;
    }

    /**
     * Render About section
     */
    renderAboutSection() {
        const { showAboutSection } = this.state;
        
        return `
            <div class="info-section" style="margin-bottom: 1.5rem; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; background: white;">
                <div class="info-header" id="about-toggle" style="padding: 1rem 1.5rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; cursor: pointer; display: flex; justify-content: space-between; align-items: center; user-select: none;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <span style="font-size: 1.5rem;">ℹ️</span>
                        <span style="font-weight: 600; font-size: 1.1rem;">About Decision Engine</span>
                    </div>
                    <span class="toggle-icon" style="font-size: 1.2rem; transition: transform 0.3s; ${showAboutSection ? 'transform: rotate(180deg);' : ''}">▼</span>
                </div>
                <div class="info-content" style="display: ${showAboutSection ? 'block' : 'none'}; padding: 1.5rem; background: #f8f9fa; border-top: 1px solid #e0e0e0;">
                    <div style="display: grid; gap: 1.25rem;">
                        <div>
                            <h4 style="margin: 0 0 0.5rem 0; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.2rem;">🎯</span>
                                <span>Purpose</span>
                            </h4>
                            <p style="margin: 0; color: #555; line-height: 1.6;">
                                The Decision Engine is an <strong>interactive testing tool</strong> that allows you to execute loan decisions in real-time
                                and see detailed results. It simulates the complete decision-making process including eligibility determination,
                                pricing calculations, flag assignments, and documentation requirements.
                            </p>
                        </div>
                        
                        <div>
                            <h4 style="margin: 0 0 0.5rem 0; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.2rem;">🔧</span>
                                <span>Single Test Execution</span>
                            </h4>
                            <ol style="margin: 0.5rem 0 0 0; padding-left: 1.5rem; color: #555; line-height: 1.8;">
                                <li><strong>Select a test case</strong> from the dropdown menu (60 pre-configured loan scenarios)</li>
                                <li>Review the <strong>test case details</strong> including borrower info, loan parameters, and property data</li>
                                <li>Click <strong>"▶️ Execute Decision"</strong> to run the decision engine</li>
                                <li>View the <strong>actual decision result</strong> with eligibility, pricing, flags, and required docs</li>
                                <li>Compare against the <strong>expected result</strong> from the legacy Perl system (if available)</li>
                                <li>Examine the <strong>rules fired</strong> to understand which business rules were triggered</li>
                            </ol>
                        </div>
                        
                        <div>
                            <h4 style="margin: 0 0 0.5rem 0; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.2rem;">🔄</span>
                                <span>Batch Execution</span>
                            </h4>
                            <p style="margin: 0 0 0.75rem 0; color: #555; line-height: 1.6;">
                                Click <strong>"🔄 Run All 60 Test Cases"</strong> to execute the entire test suite at once. This feature:
                            </p>
                            <ul style="margin: 0; padding-left: 1.5rem; color: #555; line-height: 1.8;">
                                <li>Runs all 60 test cases sequentially with a progress indicator</li>
                                <li>Compares each result against expected outcomes from the legacy system</li>
                                <li>Displays a comprehensive summary with pass/fail statistics</li>
                                <li>Shows a detailed table of all results for quick scanning</li>
                                <li>Helps identify patterns in test failures or edge cases</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 style="margin: 0 0 0.5rem 0; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.2rem;">📊</span>
                                <span>Understanding the Results</span>
                            </h4>
                            <div style="display: grid; gap: 0.75rem; margin-top: 0.5rem;">
                                <div style="padding: 0.75rem; background: #e8f5e9; border-left: 4px solid #4CAF50; border-radius: 4px;">
                                    <strong style="color: #2e7d32;">✅ Eligibility Result:</strong>
                                    <span style="color: #555; margin-left: 0.5rem;">
                                        <strong>Approve</strong> (green), <strong>Refer</strong> (orange), or <strong>Decline</strong> (red) - the core decision outcome
                                    </span>
                                </div>
                                <div style="padding: 0.75rem; background: #e3f2fd; border-left: 4px solid #2196F3; border-radius: 4px;">
                                    <strong style="color: #1565c0;">💰 Pricing (MI Rate):</strong>
                                    <span style="color: #555; margin-left: 0.5rem;">
                                        Mortgage insurance rate in basis points (bps) - calculated based on LTV, FICO, and loan characteristics
                                    </span>
                                </div>
                                <div style="padding: 0.75rem; background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 4px;">
                                    <strong style="color: #e65100;">🚩 Flags:</strong>
                                    <span style="color: #555; margin-left: 0.5rem;">
                                        Special conditions or warnings (e.g., "High DTI", "Self-Employed") that require attention
                                    </span>
                                </div>
                                <div style="padding: 0.75rem; background: #f3e5f5; border-left: 4px solid #9c27b0; border-radius: 4px;">
                                    <strong style="color: #6a1b9a;">📄 Documentation:</strong>
                                    <span style="color: #555; margin-left: 0.5rem;">
                                        Required documents for loan processing (e.g., tax returns, bank statements, employment verification)
                                    </span>
                                </div>
                                <div style="padding: 0.75rem; background: #fce4ec; border-left: 4px solid #e91e63; border-radius: 4px;">
                                    <strong style="color: #880e4f;">🔬 Rules Fired:</strong>
                                    <span style="color: #555; margin-left: 0.5rem;">
                                        Complete trace of all business rules that were evaluated and triggered during execution
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h4 style="margin: 0 0 0.5rem 0; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.2rem;">💡</span>
                                <span>Tips for Effective Testing</span>
                            </h4>
                            <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem; color: #555; line-height: 1.8;">
                                <li>Start with single test execution to understand individual scenarios</li>
                                <li>Use batch execution to validate overall system behavior</li>
                                <li>Pay attention to execution times - they should be consistently fast (<10ms)</li>
                                <li>When results don't match expected outcomes, review the rules fired to understand why</li>
                                <li>Test edge cases like high LTV, low FICO, or unusual property types</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render control buttons
     */
    renderControls() {
        const hasSelection = this.state.selectedTestCase !== null;
        const isExecuting = this.state.isExecuting || this.state.isBatchExecuting;

        return `
            <div class="decision-controls" style="margin-bottom: 1.5rem; display: flex; gap: 1rem; align-items: center;">
                <button 
                    id="execute-decision-btn" 
                    class="btn-primary"
                    ${!hasSelection || isExecuting ? 'disabled' : ''}>
                    ${this.state.isExecuting ? '⏳ Executing...' : '▶️ Execute Decision'}
                </button>
                <button 
                    id="batch-execute-btn" 
                    class="btn-secondary"
                    ${isExecuting ? 'disabled' : ''}>
                    ${this.state.isBatchExecuting ? '⏳ Running Batch...' : '🔄 Run All 60 Test Cases'}
                </button>
                ${this.state.isBatchExecuting ? `
                    <div class="batch-progress" style="flex: 1;">
                        <div class="progress-bar" style="background: #e0e0e0; height: 24px; border-radius: 4px; overflow: hidden; position: relative;">
                            <div style="background: linear-gradient(90deg, #4CAF50, #45a049); height: 100%; width: ${this.state.batchProgress}%; transition: width 0.3s;"></div>
                            <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-weight: bold; color: #333;">
                                ${Math.round(this.state.batchProgress)}%
                            </span>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render test case selector
     */
    renderTestCaseSelector() {
        return `
            <div class="test-case-selector" style="margin-bottom: 1.5rem;">
                <label for="test-case-select" style="display: block; margin-bottom: 0.5rem; font-weight: bold;">
                    Select Test Case:
                </label>
                <select
                    id="test-case-select"
                    class="form-select"
                    style="width: 100%; max-width: 400px; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem;">
                    <option value="">-- Select a test case --</option>
                    ${this.state.testCases.map((tc, idx) => {
                        const loanId = tc.loanId || `loan_app_${String(idx + 1).padStart(3, '0')}`;
                        const fico = tc.borrower?.creditScore || 'N/A';
                        const ltv = tc.loan?.ltv || 'N/A';
                        const dti = tc.loan?.dti || 'N/A';
                        return `
                            <option value="${idx}" ${this.state.selectedTestCase === idx ? 'selected' : ''}>
                                ${loanId} - FICO: ${fico}, LTV: ${ltv}%, DTI: ${dti}%
                            </option>
                        `;
                    }).join('')}
                </select>
            </div>
        `;
    }

    /**
     * Render test case details
     */
    renderTestCaseDetails() {
        const tc = this.state.selectedTestCaseData;
        const borrower = tc.borrower || {};
        const loan = tc.loan || {};
        const property = tc.property || {};
        const aus = tc.aus || {};

        return `
            <div class="test-case-details card" style="margin-bottom: 1.5rem; padding: 1.5rem; background: #f9f9f9; border-radius: 8px;">
                <h3 style="margin-top: 0; margin-bottom: 1rem; color: #333;">📋 Test Case Details: ${tc.loanId || 'N/A'}</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                    <div>
                        <h4 style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.9rem;">Borrower</h4>
                        <p style="margin: 0.25rem 0;"><strong>FICO:</strong> ${borrower.creditScore || 'N/A'}</p>
                        <p style="margin: 0.25rem 0;"><strong>First Time Buyer:</strong> ${borrower.firstTimeHomebuyer ? 'Yes' : 'No'}</p>
                        ${borrower.selfEmployed !== undefined ? `<p style="margin: 0.25rem 0;"><strong>Self-Employed:</strong> ${borrower.selfEmployed ? 'Yes' : 'No'}</p>` : ''}
                    </div>
                    <div>
                        <h4 style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.9rem;">Loan</h4>
                        <p style="margin: 0.25rem 0;"><strong>Amount:</strong> $${this.formatNumber(loan.loanAmount)}</p>
                        <p style="margin: 0.25rem 0;"><strong>LTV:</strong> ${loan.ltv}%</p>
                        <p style="margin: 0.25rem 0;"><strong>DTI:</strong> ${loan.dti}%</p>
                        <p style="margin: 0.25rem 0;"><strong>Product:</strong> ${loan.productType || 'N/A'}</p>
                        <p style="margin: 0.25rem 0;"><strong>Occupancy:</strong> ${loan.occupancy || 'N/A'}</p>
                        ${loan.purpose ? `<p style="margin: 0.25rem 0;"><strong>Purpose:</strong> ${loan.purpose}</p>` : ''}
                    </div>
                    <div>
                        <h4 style="margin: 0 0 0.5rem 0; color: #666; font-size: 0.9rem;">Property</h4>
                        <p style="margin: 0.25rem 0;"><strong>Type:</strong> ${property.type || 'N/A'}</p>
                        <p style="margin: 0.25rem 0;"><strong>State:</strong> ${property.state || 'N/A'}</p>
                        <p style="margin: 0.25rem 0;"><strong>Value:</strong> $${this.formatNumber(property.estimatedValue)}</p>
                        ${aus.finding ? `<p style="margin: 0.25rem 0;"><strong>AUS Finding:</strong> ${aus.finding}</p>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render decision results
     */
    renderResults() {
        const actual = this.state.actualResult;
        const expected = this.state.expectedResult;
        const hasExpected = expected !== null;

        return `
            <div class="decision-results">
                <div style="display: grid; grid-template-columns: ${hasExpected ? '1fr 1fr' : '1fr'}; gap: 1.5rem; margin-bottom: 1.5rem;">
                    ${this.renderActualResult(actual)}
                    ${hasExpected ? this.renderExpectedResult(expected) : ''}
                </div>
                ${hasExpected ? this.renderComparison(actual, expected) : ''}
                ${this.renderExecutionTrace(actual)}
            </div>
        `;
    }

    /**
     * Render actual decision result
     */
    renderActualResult(result) {
        const eligibilityClass = this.getEligibilityClass(result.eligibility.result);
        const eligibilityColor = this.getEligibilityColor(result.eligibility.result);

        return `
            <div class="result-card card" style="padding: 1.5rem; background: white; border-radius: 8px; border: 2px solid ${eligibilityColor};">
                <h3 style="margin-top: 0; margin-bottom: 1rem; color: #333;">
                    ⚙️ Actual Decision Result
                    <span style="float: right; font-size: 0.8rem; color: #666;">
                        ⏱️ ${result.executionTime.toFixed(2)}ms
                    </span>
                </h3>
                
                <div class="eligibility-result" style="margin-bottom: 1rem;">
                    <div class="result-badge ${eligibilityClass}" style="display: inline-block; padding: 0.5rem 1rem; border-radius: 4px; font-weight: bold; font-size: 1.1rem; background: ${eligibilityColor}; color: white;">
                        ${result.eligibility.result.toUpperCase()}
                    </div>
                </div>

                <div class="result-details">
                    <p style="margin: 0.5rem 0;"><strong>Reason:</strong> ${result.eligibility.reason || 'N/A'}</p>
                    
                    ${result.pricing.miRateBps !== null ? `
                        <p style="margin: 0.5rem 0;"><strong>MI Rate:</strong> ${result.pricing.miRateBps} bps</p>
                    ` : ''}
                    
                    ${result.eligibility.flags.length > 0 ? `
                        <p style="margin: 0.5rem 0;"><strong>Flags:</strong></p>
                        <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                            ${result.eligibility.flags.map(flag => `
                                <span class="flag-badge" style="padding: 0.25rem 0.75rem; background: #ff9800; color: white; border-radius: 12px; font-size: 0.85rem;">
                                    ${flag}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    ${result.documentation.requiredDocs.length > 0 ? `
                        <p style="margin: 1rem 0 0.5rem 0;"><strong>Required Documentation:</strong></p>
                        <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                            ${result.documentation.requiredDocs.map(doc => `
                                <li style="margin: 0.25rem 0;">${doc}</li>
                            `).join('')}
                        </ul>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render expected decision result
     */
    renderExpectedResult(expected) {
        const eligibilityClass = this.getEligibilityClass(expected.eligibility.result);
        const eligibilityColor = this.getEligibilityColor(expected.eligibility.result);

        return `
            <div class="result-card card" style="padding: 1.5rem; background: white; border-radius: 8px; border: 2px solid ${eligibilityColor};">
                <h3 style="margin-top: 0; margin-bottom: 1rem; color: #333;">📊 Expected Result</h3>
                
                <div class="eligibility-result" style="margin-bottom: 1rem;">
                    <div class="result-badge ${eligibilityClass}" style="display: inline-block; padding: 0.5rem 1rem; border-radius: 4px; font-weight: bold; font-size: 1.1rem; background: ${eligibilityColor}; color: white;">
                        ${expected.eligibility.result.toUpperCase()}
                    </div>
                </div>

                <div class="result-details">
                    <p style="margin: 0.5rem 0;"><strong>Reason:</strong> ${expected.reason || 'N/A'}</p>
                    
                    ${expected.miRateBps ? `
                        <p style="margin: 0.5rem 0;"><strong>MI Rate:</strong> ${expected.miRateBps} bps</p>
                    ` : ''}
                    
                    ${expected.flags ? `
                        <p style="margin: 0.5rem 0;"><strong>Flags:</strong> ${expected.flags}</p>
                    ` : ''}
                    
                    ${expected.requiredDocs ? `
                        <p style="margin: 0.5rem 0;"><strong>Required Docs:</strong> ${expected.requiredDocs}</p>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render comparison between actual and expected
     */
    renderComparison(actual, expected) {
        const eligibilityMatch = actual.eligibility.result === expected.eligibility.result;
        const miRateMatch = actual.pricing.miRateBps === expected.miRateBps;
        
        return `
            <div class="comparison-summary card" style="padding: 1.5rem; background: ${eligibilityMatch ? '#e8f5e9' : '#ffebee'}; border-radius: 8px; margin-bottom: 1.5rem;">
                <h3 style="margin-top: 0; margin-bottom: 1rem; color: #333;">🔍 Comparison Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    <div>
                        <strong>Eligibility:</strong>
                        <span style="margin-left: 0.5rem;">
                            ${eligibilityMatch ? '✅ Match' : '❌ Mismatch'}
                        </span>
                    </div>
                    ${actual.pricing.miRateBps !== null && expected.miRateBps ? `
                        <div>
                            <strong>MI Rate:</strong>
                            <span style="margin-left: 0.5rem;">
                                ${miRateMatch ? '✅ Match' : '❌ Mismatch'}
                            </span>
                        </div>
                    ` : ''}
                    <div>
                        <strong>Overall:</strong>
                        <span style="margin-left: 0.5rem; font-weight: bold; color: ${eligibilityMatch && miRateMatch ? '#2e7d32' : '#c62828'};">
                            ${eligibilityMatch && miRateMatch ? '✅ PASS' : '❌ FAIL'}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render execution trace
     */
    renderExecutionTrace(result) {
        return `
            <div class="execution-trace card" style="padding: 1.5rem; background: white; border-radius: 8px;">
                <h3 style="margin-top: 0; margin-bottom: 1rem; color: #333;">
                    🔬 Rules Fired (${result.rulesFired.length})
                </h3>
                <div style="max-height: 400px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f5f5f5; border-bottom: 2px solid #ddd;">
                                <th style="padding: 0.75rem; text-align: left;">Rule ID</th>
                                <th style="padding: 0.75rem; text-align: left;">Rule Name</th>
                                <th style="padding: 0.75rem; text-align: center;">Priority</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${result.rulesFired.map((rule, idx) => `
                                <tr style="border-bottom: 1px solid #eee; ${idx % 2 === 0 ? 'background: #fafafa;' : ''}">
                                    <td style="padding: 0.75rem; font-family: monospace;">${rule.ruleId}</td>
                                    <td style="padding: 0.75rem;">${rule.ruleName}</td>
                                    <td style="padding: 0.75rem; text-align: center; font-weight: bold;">${rule.priority}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    /**
     * Render batch execution results
     */
    renderBatchResults() {
        if (this.state.batchResults.length === 0) {
            return '';
        }

        const totalTests = this.state.batchResults.length;
        const passed = this.state.batchResults.filter(r => r.match).length;
        const failed = totalTests - passed;
        const passRate = ((passed / totalTests) * 100).toFixed(1);

        return `
            <div class="batch-results card" style="padding: 1.5rem; background: white; border-radius: 8px; margin-top: 1.5rem;">
                <h3 style="margin-top: 0; margin-bottom: 1rem; color: #333;">📊 Batch Execution Results</h3>
                
                <div class="batch-summary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="text-align: center; padding: 1rem; background: #e3f2fd; border-radius: 4px;">
                        <div style="font-size: 2rem; font-weight: bold; color: #1976d2;">${totalTests}</div>
                        <div style="color: #666;">Total Tests</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: #e8f5e9; border-radius: 4px;">
                        <div style="font-size: 2rem; font-weight: bold; color: #2e7d32;">${passed}</div>
                        <div style="color: #666;">Passed</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: #ffebee; border-radius: 4px;">
                        <div style="font-size: 2rem; font-weight: bold; color: #c62828;">${failed}</div>
                        <div style="color: #666;">Failed</div>
                    </div>
                    <div style="text-align: center; padding: 1rem; background: #f3e5f5; border-radius: 4px;">
                        <div style="font-size: 2rem; font-weight: bold; color: #7b1fa2;">${passRate}%</div>
                        <div style="color: #666;">Pass Rate</div>
                    </div>
                </div>

                <div style="max-height: 400px; overflow-y: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f5f5f5; border-bottom: 2px solid #ddd;">
                                <th style="padding: 0.75rem; text-align: left;">Test Case</th>
                                <th style="padding: 0.75rem; text-align: center;">Expected</th>
                                <th style="padding: 0.75rem; text-align: center;">Actual</th>
                                <th style="padding: 0.75rem; text-align: center;">Result</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.state.batchResults.map((result, idx) => `
                                <tr style="border-bottom: 1px solid #eee; ${idx % 2 === 0 ? 'background: #fafafa;' : ''}">
                                    <td style="padding: 0.75rem; font-family: monospace;">${result.loanId}</td>
                                    <td style="padding: 0.75rem; text-align: center;">
                                        <span style="padding: 0.25rem 0.5rem; background: ${this.getEligibilityColor(result.expected)}; color: white; border-radius: 4px; font-size: 0.85rem;">
                                            ${result.expected}
                                        </span>
                                    </td>
                                    <td style="padding: 0.75rem; text-align: center;">
                                        <span style="padding: 0.25rem 0.5rem; background: ${this.getEligibilityColor(result.actual)}; color: white; border-radius: 4px; font-size: 0.85rem;">
                                            ${result.actual}
                                        </span>
                                    </td>
                                    <td style="padding: 0.75rem; text-align: center;">
                                        ${result.match ? '✅' : '❌'}
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
     * Get CSS class for eligibility result
     */
    getEligibilityClass(result) {
        const classes = {
            'approve': 'result-approve',
            'decline': 'result-decline',
            'refer': 'result-refer'
        };
        return classes[result] || 'result-unknown';
    }

    /**
     * Get color for eligibility result
     */
    getEligibilityColor(result) {
        const colors = {
            'approve': '#4CAF50',
            'decline': '#f44336',
            'refer': '#ff9800'
        };
        return colors[result] || '#9e9e9e';
    }

    /**
     * After mount - set up event listeners
     */
    afterMount() {
        // Test case selector
        const selector = this.$('#test-case-select');
        if (selector) {
            this.addEventListener(selector, 'change', (e) => {
                this.handleTestCaseSelect(e.target.value);
            });
        }

        // Execute decision button
        const executeBtn = this.$('#execute-decision-btn');
        if (executeBtn) {
            this.addEventListener(executeBtn, 'click', () => {
                this.handleExecuteDecision();
            });
        }

        // Batch execute button
        const batchBtn = this.$('#batch-execute-btn');
        if (batchBtn) {
            this.addEventListener(batchBtn, 'click', () => {
                this.handleBatchExecute();
            });
        }

        // About section toggle
        const aboutToggle = this.$('#about-toggle');
        if (aboutToggle) {
            this.addEventListener(aboutToggle, 'click', () => {
                this.setState({ showAboutSection: !this.state.showAboutSection });
            });
        }
    }

    /**
     * Handle test case selection
     */
    handleTestCaseSelect(index) {
        if (index === '') {
            this.setState({
                selectedTestCase: null,
                selectedTestCaseData: null,
                expectedResult: null,
                actualResult: null
            });
            return;
        }

        const idx = parseInt(index);
        const testCase = this.state.testCases[idx];
        
        // Find expected result using the filename stored in _filename
        const filename = testCase._filename || `loan_app_${String(idx + 1).padStart(3, '0')}.json`;
        const expectedDecision = this.expectedResultsMap[filename];

        const expectedResult = expectedDecision ? {
            eligibility: {
                result: expectedDecision['eligibility.result']
            },
            reason: expectedDecision.reason,
            miRateBps: expectedDecision.miRateBps ? parseInt(expectedDecision.miRateBps) : null,
            flags: expectedDecision.flags || '',
            requiredDocs: expectedDecision.requiredDocs || ''
        } : null;

        this.setState({
            selectedTestCase: idx,
            selectedTestCaseData: testCase,
            expectedResult: expectedResult,
            actualResult: null
        });
    }

    /**
     * Handle execute decision
     */
    async handleExecuteDecision() {
        if (!this.state.selectedTestCaseData || !this.decisionSimulator) {
            return;
        }

        this.setState({ isExecuting: true });

        // Small delay to show loading state
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            const result = this.decisionSimulator.simulate(this.state.selectedTestCaseData);
            this.setState({
                actualResult: result,
                isExecuting: false,
                executionTime: result.executionTime
            });
        } catch (error) {
            console.error('Error executing decision:', error);
            this.setState({
                isExecuting: false,
                error: error.message
            });
        }
    }

    /**
     * Handle batch execution
     */
    async handleBatchExecute() {
        if (!this.decisionSimulator || this.state.testCases.length === 0) {
            return;
        }

        this.setState({
            isBatchExecuting: true,
            batchProgress: 0,
            batchResults: []
        });

        const results = [];
        const total = this.state.testCases.length;

        for (let i = 0; i < total; i++) {
            const testCase = this.state.testCases[i];
            
            // Execute decision
            const actualResult = this.decisionSimulator.simulate(testCase);
            
            // Find expected result using the filename stored in _filename
            const filename = testCase._filename || `loan_app_${String(i + 1).padStart(3, '0')}.json`;
            const expectedDecision = this.expectedResultsMap[filename];

            const expected = expectedDecision ? expectedDecision['eligibility.result'] : null;
            const actual = actualResult.eligibility.result;
            const match = expected === actual;

            results.push({
                loanId: testCase.loanId,
                expected: expected || 'N/A',
                actual: actual,
                match: match
            });

            // Update progress
            const progress = ((i + 1) / total) * 100;
            this.setState({
                batchProgress: progress,
                batchResults: results
            }, false);

            // Small delay to allow UI to update
            if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
        }

        this.setState({
            isBatchExecuting: false,
            batchProgress: 100
        });

        // Re-render to show batch results
        this.update();
    }

    /**
     * Override render to include batch results
     */
    render() {
        if (this.state.error) {
            return this.renderError();
        }

        if (this.state.testCases.length === 0) {
            return this.renderLoading();
        }

        return `
            <div class="decision-engine">
                ${this.renderAboutSection()}
                ${this.renderControls()}
                ${this.renderTestCaseSelector()}
                ${this.state.selectedTestCaseData ? this.renderTestCaseDetails() : ''}
                ${this.state.actualResult ? this.renderResults() : ''}
                ${this.renderBatchResults()}
            </div>
        `;
    }
}

export default DecisionEngine;

// Made with Bob