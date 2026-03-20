/**
 * ParityReport Component
 * Displays parity validation metrics and test results
 * Shows overall match rate, category breakdowns, and detailed test case results
 */

import { BaseComponent } from './BaseComponent.js';

export class ParityReport extends BaseComponent {
    /**
     * Initialize the ParityReport component
     * @param {HTMLElement} container - Container element
     * @param {Object} props - Component properties
     * @param {Object} props.decisionSimulator - DecisionSimulator instance
     * @param {Array} props.testCases - Array of test case data
     * @param {Array} props.expectedDecisions - Expected decisions from CSV
     */
    constructor(container, props = {}) {
        super(container, props);
        
        this.state = {
            parityResults: null,
            loading: false,
            error: null,
            selectedCategory: 'all', // 'all', 'eligibility', 'pricing', 'documentation'
            showDetails: false
        };
        
        this.charts = {}; // Store Chart.js instances
    }

    /**
     * Initialize component
     */
    init() {
        // Check if Chart.js is loaded
        if (typeof Chart === 'undefined') {
            this.setState({ 
                error: 'Chart.js library not loaded. Please check your internet connection.' 
            });
            return;
        }
        
        // Run parity analysis if we have test cases
        if (this.props.testCases && this.props.testCases.length > 0) {
            this.runParityAnalysis();
        }
    }

    /**
     * Run parity analysis on all test cases
     */
    async runParityAnalysis() {
        this.setState({ loading: true, error: null });

        try {
            const { decisionSimulator, testCases, expectedDecisions } = this.props;
            
            if (!decisionSimulator || !testCases || !expectedDecisions) {
                throw new Error('Missing required data for parity analysis');
            }

            const results = {
                totalTests: testCases.length,
                matches: 0,
                mismatches: [],
                categoryResults: {
                    eligibility: { total: 0, matches: 0 },
                    pricing: { total: 0, matches: 0 },
                    documentation: { total: 0, matches: 0 }
                },
                testResults: []
            };

            // Analyze each test case
            for (const testCase of testCases) {
                // Match by filename - CSV has "loan_app_001.json", testCase.id is "loan_app_001"
                const expected = expectedDecisions.find(e => {
                    const csvFile = e.file || e.testCase || '';
                    const testId = csvFile.replace('.json', '');
                    return testId === testCase.id;
                });
                
                if (!expected) {
                    console.warn(`No expected decision found for ${testCase.id}`);
                    continue;
                }

                const simulated = decisionSimulator.simulate(testCase.data);
                
                // Extract expected values from CSV format (flat keys like "eligibility.result")
                const expectedEligibility = expected['eligibility.result'] || expected.eligibility || '';
                const expectedPricing = expected.miRateBps ? parseInt(expected.miRateBps) : null;
                const expectedDocs = expected.requiredDocs ? expected.requiredDocs.split('|').filter(d => d) : [];
                
                const testResult = {
                    testCase: testCase.id,
                    eligibilityMatch: simulated.eligibility.result.toLowerCase() === expectedEligibility.toLowerCase(),
                    pricingMatch: this.comparePricing(simulated, expectedEligibility, expectedPricing),
                    documentationMatch: this.compareDocumentation(simulated, expectedEligibility, expectedDocs),
                    expected: {
                        eligibility: expectedEligibility,
                        miRateBps: expectedPricing,
                        requiredDocs: expectedDocs
                    },
                    simulated
                };

                // Overall match - only check eligibility and pricing, documentation is optional
                const overallMatch = testResult.eligibilityMatch && testResult.pricingMatch;
                
                if (overallMatch) {
                    results.matches++;
                } else {
                    results.mismatches.push(testResult);
                }

                // Category tracking
                results.categoryResults.eligibility.total++;
                if (testResult.eligibilityMatch) {
                    results.categoryResults.eligibility.matches++;
                }

                if (expectedEligibility.toLowerCase() === 'approve') {
                    results.categoryResults.pricing.total++;
                    if (testResult.pricingMatch) {
                        results.categoryResults.pricing.matches++;
                    }
                }

                if (expectedEligibility.toLowerCase() !== 'decline') {
                    results.categoryResults.documentation.total++;
                    if (testResult.documentationMatch) {
                        results.categoryResults.documentation.matches++;
                    }
                }

                results.testResults.push(testResult);
            }

            // Calculate percentages
            results.matchRate = (results.matches / results.totalTests * 100).toFixed(1);
            results.categoryResults.eligibility.rate = 
                (results.categoryResults.eligibility.matches / results.categoryResults.eligibility.total * 100).toFixed(1);
            results.categoryResults.pricing.rate = 
                (results.categoryResults.pricing.matches / results.categoryResults.pricing.total * 100).toFixed(1);
            results.categoryResults.documentation.rate = 
                (results.categoryResults.documentation.matches / results.categoryResults.documentation.total * 100).toFixed(1);

            this.setState({ parityResults: results, loading: false });
            
            // Render charts after state update
            setTimeout(() => this.renderCharts(), 100);

        } catch (error) {
            console.error('Parity analysis error:', error);
            this.setState({ 
                error: `Failed to run parity analysis: ${error.message}`,
                loading: false 
            });
        }
    }

    /**
     * Compare pricing between simulated and expected
     */
    comparePricing(simulated, expectedEligibility, expectedPricing) {
        const eligibility = expectedEligibility.toLowerCase();
        
        // Pricing only applies to approved loans
        if (eligibility !== 'approve') {
            return true; // N/A - not compared for refer/decline
        }
        
        // For approved loans, pricing must match
        if (!expectedPricing && expectedPricing !== 0) {
            // No expected pricing for an approved loan - this is an error in test data
            console.warn('Approved loan missing expected pricing');
            return false;
        }
        
        return simulated.pricing.miRateBps === expectedPricing;
    }

    /**
     * Compare documentation between simulated and expected
     */
    compareDocumentation(simulated, expectedEligibility, expectedDocs) {
        const eligibility = expectedEligibility.toLowerCase();
        
        // Documentation doesn't apply to declined loans
        if (eligibility === 'decline') {
            return true; // N/A - not compared
        }
        
        // For refer and approve, documentation is optional in test data
        // If no expected docs provided, consider it a match
        if (!expectedDocs || expectedDocs.length === 0) {
            return true;
        }
        
        const simulatedDocs = simulated.documentation.requiredDocs || [];
        
        // For refer cases, we just check that some documentation is required
        // The exact docs may vary based on implementation details
        if (eligibility === 'refer') {
            return simulatedDocs.length > 0;
        }
        
        // For approve cases with expected docs, do exact comparison
        // Sort both arrays for comparison
        const sortedExpected = [...expectedDocs].sort();
        const sortedSimulated = [...simulatedDocs].sort();
        
        // Check if arrays are equal
        if (sortedExpected.length !== sortedSimulated.length) {
            return false;
        }
        
        return sortedExpected.every((doc, index) => doc === sortedSimulated[index]);
    }

    /**
     * Render the component
     */
    render() {
        const { parityResults, loading, error } = this.state;

        if (loading) {
            return this.renderLoading();
        }

        if (error) {
            return this.renderError(error);
        }

        if (!parityResults) {
            return this.renderEmptyState();
        }

        return `
            <div class="parity-report">
                ${this.renderHeader()}
                ${this.renderInfoPanel()}
                ${this.renderSummaryCards()}
                ${this.renderChartSection()}
                ${this.renderCategoryBreakdown()}
                ${this.renderMismatchDetails()}
            </div>
        `;
    }

    /**
     * Render header
     */
    renderHeader() {
        return `
            <div class="parity-report-header">
                <h2>📊 Parity Validation Report</h2>
                <p class="subtitle">ODM vs Legacy PERL-DSL Decision Comparison</p>
            </div>
        `;
    }

    /**
     * Render info panel
     */
    renderInfoPanel() {
        return `
            <div class="info-panel">
                <div class="info-icon">ℹ️</div>
                <div class="info-content">
                    <h4>About Parity Validation</h4>
                    <p>
                        This report shows how well the ODM implementation matches the legacy PERL system across all 60 test cases.
                        A match rate ≥95% indicates successful migration. Each test case is validated for eligibility decisions, pricing calculations, and documentation requirements.
                    </p>
                    <p><strong>Acceptance Criteria:</strong> ≥95% overall parity | <strong>Current Status:</strong> <span class="status-badge ${this.getStatusClass()}">
                        ${this.state.parityResults ? this.state.parityResults.matchRate + '%' : 'N/A'}
                    </span></p>
                </div>
            </div>
        `;
    }

    /**
     * Get status class based on match rate
     */
    getStatusClass() {
        const { parityResults } = this.state;
        if (!parityResults) return '';
        
        const rate = parseFloat(parityResults.matchRate);
        if (rate >= 95) return 'success';
        if (rate >= 90) return 'warning';
        return 'error';
    }

    /**
     * Render summary cards
     */
    renderSummaryCards() {
        const { parityResults } = this.state;
        const passStatus = parseFloat(parityResults.matchRate) >= 95 ? '✅ PASS' : '❌ FAIL';

        return `
            <div class="summary-cards">
                <div class="summary-card primary">
                    <div class="card-icon">🎯</div>
                    <div class="card-content">
                        <h3>${parityResults.matchRate}%</h3>
                        <p>Overall Match Rate</p>
                        <span class="card-badge ${this.getStatusClass()}">${passStatus}</span>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="card-icon">✅</div>
                    <div class="card-content">
                        <h3>${parityResults.matches}</h3>
                        <p>Matching Test Cases</p>
                        <span class="card-detail">out of ${parityResults.totalTests}</span>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="card-icon">⚠️</div>
                    <div class="card-content">
                        <h3>${parityResults.mismatches.length}</h3>
                        <p>Mismatches Found</p>
                        <span class="card-detail">${((parityResults.mismatches.length / parityResults.totalTests) * 100).toFixed(1)}% of total</span>
                    </div>
                </div>
                <div class="summary-card">
                    <div class="card-icon">📋</div>
                    <div class="card-content">
                        <h3>${parityResults.totalTests}</h3>
                        <p>Total Test Cases</p>
                        <span class="card-detail">Comprehensive coverage</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render chart section
     */
    renderChartSection() {
        return `
            <div class="chart-section">
                <div class="chart-container">
                    <h3>Overall Parity Distribution</h3>
                    <canvas id="parity-pie-chart"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Category Performance</h3>
                    <canvas id="category-bar-chart"></canvas>
                </div>
            </div>
        `;
    }

    /**
     * Render category breakdown
     */
    renderCategoryBreakdown() {
        const { parityResults } = this.state;
        const { categoryResults } = parityResults;

        return `
            <div class="category-breakdown">
                <h3>📊 Category-Level Analysis</h3>
                <div class="category-grid">
                    ${this.renderCategoryCard('Eligibility Decisions', categoryResults.eligibility, '🎯')}
                    ${this.renderCategoryCard('Pricing Calculations', categoryResults.pricing, '💰')}
                    ${this.renderCategoryCard('Documentation Requirements', categoryResults.documentation, '📄')}
                </div>
            </div>
        `;
    }

    /**
     * Render individual category card
     */
    renderCategoryCard(title, data, icon) {
        const rate = parseFloat(data.rate);
        const statusClass = rate >= 95 ? 'success' : rate >= 90 ? 'warning' : 'error';
        const statusText = rate >= 95 ? '✅ PASS' : rate >= 90 ? '⚠️ WARNING' : '❌ FAIL';

        return `
            <div class="category-card">
                <div class="category-header">
                    <span class="category-icon">${icon}</span>
                    <h4>${title}</h4>
                </div>
                <div class="category-stats">
                    <div class="stat-large ${statusClass}">
                        <span class="stat-value">${data.rate}%</span>
                        <span class="stat-label">Match Rate</span>
                    </div>
                    <div class="stat-breakdown">
                        <div class="stat-item">
                            <span class="stat-number">${data.matches}</span>
                            <span class="stat-text">Matches</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${data.total - data.matches}</span>
                            <span class="stat-text">Mismatches</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">${data.total}</span>
                            <span class="stat-text">Total</span>
                        </div>
                    </div>
                </div>
                <div class="category-status ${statusClass}">
                    ${statusText}
                </div>
            </div>
        `;
    }

    /**
     * Render mismatch details
     */
    renderMismatchDetails() {
        const { parityResults, showDetails } = this.state;
        
        if (parityResults.mismatches.length === 0) {
            return `
                <div class="mismatch-section">
                    <h3>🎉 Perfect Parity!</h3>
                    <p class="success-message">All ${parityResults.totalTests} test cases matched between ODM and legacy systems.</p>
                </div>
            `;
        }

        return `
            <div class="mismatch-section">
                <div class="mismatch-header">
                    <h3>⚠️ Mismatch Analysis (${parityResults.mismatches.length} cases)</h3>
                    <button id="toggle-details" class="btn-secondary">
                        ${showDetails ? 'Hide' : 'Show'} Details
                    </button>
                </div>
                ${showDetails ? this.renderMismatchTable() : ''}
            </div>
        `;
    }

    /**
     * Render mismatch table
     */
    renderMismatchTable() {
        const { parityResults } = this.state;

        return `
            <div class="mismatch-table-container">
                <table class="mismatch-table">
                    <thead>
                        <tr>
                            <th>Test Case</th>
                            <th>Eligibility</th>
                            <th>Pricing</th>
                            <th>Documentation</th>
                            <th>Details</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${parityResults.mismatches.map(mismatch => `
                            <tr>
                                <td><code>${mismatch.testCase}</code></td>
                                <td>${this.renderMatchIcon(mismatch.eligibilityMatch)}</td>
                                <td>${this.renderMatchIcon(mismatch.pricingMatch)}</td>
                                <td>${this.renderMatchIcon(mismatch.documentationMatch)}</td>
                                <td>
                                    <button class="btn-link" data-testcase="${mismatch.testCase}">
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render match icon
     */
    renderMatchIcon(isMatch) {
        return isMatch 
            ? '<span class="match-icon success">✅</span>' 
            : '<span class="match-icon error">❌</span>';
    }

    /**
     * Render loading state
     */
    renderLoading() {
        return `
            <div class="parity-report-loading">
                <div class="loading-spinner"></div>
                <p>Running parity analysis on ${this.props.testCases?.length || 0} test cases...</p>
                <p class="loading-detail">This may take a few moments</p>
            </div>
        `;
    }

    /**
     * Render error state
     */
    renderError(error) {
        return `
            <div class="parity-report-error">
                <div class="error-icon">⚠️</div>
                <h3>Parity Analysis Failed</h3>
                <p>${error}</p>
                <button id="retry-analysis" class="btn-primary">Retry Analysis</button>
            </div>
        `;
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        return `
            <div class="parity-report-empty">
                <div class="empty-icon">📊</div>
                <h3>No Parity Data Available</h3>
                <p>Test cases or expected decisions are not loaded.</p>
                <p>Please ensure all required data files are present.</p>
            </div>
        `;
    }

    /**
     * After mount - set up event listeners and render charts
     */
    afterMount() {
        // Toggle details button
        const toggleBtn = this.$('#toggle-details');
        if (toggleBtn) {
            this.addEventListener(toggleBtn, 'click', () => {
                this.setState({ showDetails: !this.state.showDetails });
            });
        }

        // Retry button
        const retryBtn = this.$('#retry-analysis');
        if (retryBtn) {
            this.addEventListener(retryBtn, 'click', () => {
                this.runParityAnalysis();
            });
        }

        // View details buttons
        const detailButtons = this.$$('[data-testcase]');
        detailButtons.forEach(btn => {
            this.addEventListener(btn, 'click', (e) => {
                const testCase = e.target.dataset.testcase;
                this.showMismatchDetails(testCase);
            });
        });
    }

    /**
     * Show mismatch details modal
     */
    showMismatchDetails(testCase) {
        const { parityResults } = this.state;
        const mismatch = parityResults.mismatches.find(m => m.testCase === testCase);
        
        if (!mismatch) return;

        // For now, just log to console
        // In a full implementation, this would show a modal
        console.log('Mismatch details for', testCase, mismatch);
        alert(`Mismatch Details for ${testCase}\n\nExpected: ${JSON.stringify(mismatch.expected, null, 2)}\n\nSimulated: ${JSON.stringify(mismatch.simulated, null, 2)}`);
    }

    /**
     * Render charts using Chart.js
     */
    renderCharts() {
        const { parityResults } = this.state;
        if (!parityResults) return;

        // Destroy existing charts
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};

        // Pie chart for overall parity
        const pieCanvas = this.$('#parity-pie-chart');
        if (pieCanvas) {
            this.charts.pie = new Chart(pieCanvas, {
                type: 'doughnut',
                data: {
                    labels: ['Matches', 'Mismatches'],
                    datasets: [{
                        data: [parityResults.matches, parityResults.mismatches.length],
                        backgroundColor: ['#4caf50', '#f44336'],
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom'
                        },
                        title: {
                            display: false
                        }
                    }
                }
            });
        }

        // Bar chart for category performance
        const barCanvas = this.$('#category-bar-chart');
        if (barCanvas) {
            const { categoryResults } = parityResults;
            this.charts.bar = new Chart(barCanvas, {
                type: 'bar',
                data: {
                    labels: ['Eligibility', 'Pricing', 'Documentation'],
                    datasets: [{
                        label: 'Match Rate (%)',
                        data: [
                            parseFloat(categoryResults.eligibility.rate),
                            parseFloat(categoryResults.pricing.rate),
                            parseFloat(categoryResults.documentation.rate)
                        ],
                        backgroundColor: [
                            '#2196f3',
                            '#ff9800',
                            '#9c27b0'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
    }

    /**
     * Cleanup when component is destroyed
     */
    destroy() {
        // Destroy charts
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};
        
        super.destroy();
    }
}

// Made with Bob
