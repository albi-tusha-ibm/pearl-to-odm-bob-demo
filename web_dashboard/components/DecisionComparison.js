/**
 * DecisionComparison Component
 * Visualizes decision engine results and parity analysis
 * Provides comprehensive comparison of expected vs actual decisions
 */

import { BaseComponent } from './BaseComponent.js';
import { DecisionSimulator } from '../services/DecisionSimulator.js';

export class DecisionComparison extends BaseComponent {
    /**
     * Initialize the DecisionComparison component
     * @param {HTMLElement} container - Container element
     * @param {Object} props - Component properties
     * @param {Object} props.parityResults - Parity validation results
     * @param {Array} props.testCases - Array of test case objects
     * @param {DecisionSimulator} props.decisionSimulator - Decision simulator instance
     */
    constructor(container, props = {}) {
        super(container, props);
        
        this.simulator = props.decisionSimulator || new DecisionSimulator();
        
        this.state = {
            parityResults: null,
            selectedTestCase: null,
            selectedResult: null,
            filterStatus: 'all', // all, matches, mismatches
            filterDecision: 'all', // all, approve, refer, decline
            searchQuery: '',
            filteredResults: [],
            isLoading: false,
            error: null,
            showDetailView: false,
            showAboutSection: false
        };
    }

    /**
     * Initialize component
     */
    async init() {
        this.state.isLoading = true;
        
        try {
            // Load parity results (use absolute path from server root)
            const response = await fetch('/odm_target/export/parity_validation_results.json');
            if (!response.ok) {
                throw new Error('Failed to load parity validation results');
            }
            
            const parityResults = await response.json();
            this.state.parityResults = parityResults;
            this.state.filteredResults = parityResults.allResults || [];
            this.state.isLoading = false;
            
        } catch (error) {
            console.error('Error loading parity results:', error);
            this.state.error = error.message;
            this.state.isLoading = false;
        }
    }

    /**
     * Render the component
     */
    render() {
        const { isLoading, error, parityResults, showDetailView, selectedResult } = this.state;

        if (isLoading) {
            return this.renderLoading();
        }

        if (error) {
            return this.renderError(error);
        }

        if (!parityResults) {
            return this.renderEmptyState();
        }

        return `
            <div class="decision-comparison">
                ${this.renderHeader()}
                ${this.renderAboutSection()}
                ${this.renderParitySummary()}
                ${this.renderFieldMatchRates()}
                ${this.renderFilters()}
                ${showDetailView && selectedResult ? this.renderDetailView() : this.renderTestCaseTable()}
            </div>
        `;
    }

    /**
     * Render header
     */
    renderHeader() {
        return `
            <div class="comparison-header">
                <h2>📊 Decision Comparison & Parity Analysis</h2>
                <div class="header-actions">
                    <button id="export-csv" class="btn btn-secondary">
                        📥 Export to CSV
                    </button>
                    <button id="refresh-data" class="btn btn-secondary">
                        🔄 Refresh Data
                    </button>
                </div>
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
                        <span style="font-weight: 600; font-size: 1.1rem;">About Decision Comparison</span>
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
                                This component validates that the JavaScript decision engine produces <strong>identical results</strong> to the legacy Perl system.
                                It compares 60 test cases across all decision fields to ensure 100% parity during the migration process.
                            </p>
                        </div>
                        
                        <div>
                            <h4 style="margin: 0 0 0.5rem 0; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.2rem;">📊</span>
                                <span>Understanding the Metrics</span>
                            </h4>
                            <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem; color: #555; line-height: 1.8;">
                                <li><strong>Overall Parity:</strong> Percentage of test cases where all fields match perfectly</li>
                                <li><strong>Field Match Rates:</strong> Individual accuracy for eligibility, pricing, flags, and documentation</li>
                                <li><strong>Eligibility Result:</strong> Core decision (Approve/Refer/Decline) - must be 100%</li>
                                <li><strong>MI Rate (bps):</strong> Mortgage insurance pricing in basis points - must be 100%</li>
                                <li><strong>Flags & Docs:</strong> Additional requirements - variations are expected and acceptable</li>
                            </ul>
                        </div>
                        
                        <div>
                            <h4 style="margin: 0 0 0.5rem 0; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.2rem;">🔍</span>
                                <span>How to Interpret Results</span>
                            </h4>
                            <div style="display: grid; gap: 0.75rem; margin-top: 0.5rem;">
                                <div style="padding: 0.75rem; background: #e8f5e9; border-left: 4px solid #4CAF50; border-radius: 4px;">
                                    <strong style="color: #2e7d32;">✅ Green (Match):</strong>
                                    <span style="color: #555; margin-left: 0.5rem;">Perfect match - JavaScript engine produces identical results to Perl</span>
                                </div>
                                <div style="padding: 0.75rem; background: #ffebee; border-left: 4px solid #f44336; border-radius: 4px;">
                                    <strong style="color: #c62828;">❌ Red (Mismatch):</strong>
                                    <span style="color: #555; margin-left: 0.5rem;">Difference detected - requires investigation and resolution</span>
                                </div>
                                <div style="padding: 0.75rem; background: #fff3e0; border-left: 4px solid #ff9800; border-radius: 4px;">
                                    <strong style="color: #e65100;">⚠️ Note:</strong>
                                    <span style="color: #555; margin-left: 0.5rem;">Minor differences in flags/documentation order are acceptable as long as core decisions match</span>
                                </div>
                            </div>
                        </div>
                        
                        <div>
                            <h4 style="margin: 0 0 0.5rem 0; color: #333; display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 1.2rem;">⚙️</span>
                                <span>Using This Tool</span>
                            </h4>
                            <ol style="margin: 0.5rem 0 0 0; padding-left: 1.5rem; color: #555; line-height: 1.8;">
                                <li>Review the <strong>Overall Parity</strong> gauge and summary statistics at the top</li>
                                <li>Check <strong>Field Match Rates</strong> to identify which fields have discrepancies</li>
                                <li>Use <strong>filters</strong> to focus on matches, mismatches, or specific decision types</li>
                                <li>Click <strong>🔍 View Details</strong> on any test case for a detailed field-by-field comparison</li>
                                <li>Use <strong>▶️ Re-run Test</strong> to execute a test case again after making changes</li>
                                <li>Export results to CSV for further analysis or reporting</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render parity summary dashboard
     */
    renderParitySummary() {
        const { parityResults } = this.state;
        const summary = parityResults.summary;

        const parityPercentage = summary.overallParityPercentage || 0;
        const gaugeColor = this.getGaugeColor(parityPercentage);

        return `
            <div class="parity-summary">
                <div class="summary-card parity-gauge-card">
                    <h3>Overall Parity</h3>
                    <div class="parity-gauge">
                        <svg viewBox="0 0 200 120" class="gauge-svg">
                            <path d="M 20 100 A 80 80 0 0 1 180 100" 
                                  fill="none" 
                                  stroke="#e0e0e0" 
                                  stroke-width="20" 
                                  stroke-linecap="round"/>
                            <path d="M 20 100 A 80 80 0 0 1 180 100" 
                                  fill="none" 
                                  stroke="${gaugeColor}" 
                                  stroke-width="20" 
                                  stroke-linecap="round"
                                  stroke-dasharray="${(parityPercentage / 100) * 251.2} 251.2"
                                  class="gauge-fill"/>
                            <text x="100" y="90" text-anchor="middle" class="gauge-text">
                                ${parityPercentage}%
                            </text>
                        </svg>
                    </div>
                </div>

                <div class="summary-card">
                    <h3>Test Cases</h3>
                    <div class="stat-value">${summary.totalTests}</div>
                    <div class="stat-breakdown">
                        <span class="stat-item match">✓ ${summary.matches} Matches</span>
                        <span class="stat-item mismatch">✗ ${summary.mismatches} Mismatches</span>
                    </div>
                </div>

                <div class="summary-card">
                    <h3>Performance</h3>
                    <div class="stat-value">${summary.averageExecutionTimeMs.toFixed(2)}ms</div>
                    <div class="stat-label">Avg Execution Time</div>
                </div>

                <div class="summary-card">
                    <h3>Match Rate</h3>
                    <div class="stat-value">${((summary.matches / summary.totalTests) * 100).toFixed(1)}%</div>
                    <div class="stat-label">Cases Matching</div>
                </div>
            </div>
        `;
    }

    /**
     * Render field match rates
     */
    renderFieldMatchRates() {
        const { parityResults } = this.state;
        const fieldRates = parityResults.fieldMatchRates;

        return `
            <div class="field-match-rates">
                <h3>Field-Level Match Rates</h3>
                <div class="field-rates-grid">
                    ${this.renderFieldRate('Eligibility Result', fieldRates.eligibilityResult)}
                    ${this.renderFieldRate('Reason', fieldRates.reason)}
                    ${this.renderFieldRate('MI Rate (bps)', fieldRates.miRateBps)}
                    ${this.renderFieldRate('Flags', fieldRates.flags)}
                    ${this.renderFieldRate('Required Docs', fieldRates.requiredDocs)}
                </div>
            </div>
        `;
    }

    /**
     * Render individual field rate
     */
    renderFieldRate(label, rateData) {
        const percentage = parseFloat(rateData.percentage);
        const statusClass = percentage === 100 ? 'perfect' : percentage >= 80 ? 'good' : percentage >= 50 ? 'fair' : 'poor';
        const icon = percentage === 100 ? '✓' : percentage >= 80 ? '◐' : percentage >= 50 ? '◔' : '✗';

        return `
            <div class="field-rate-card ${statusClass}">
                <div class="field-rate-header">
                    <span class="field-icon">${icon}</span>
                    <span class="field-label">${label}</span>
                </div>
                <div class="field-rate-bar">
                    <div class="field-rate-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="field-rate-stats">
                    <span class="rate-percentage">${percentage.toFixed(1)}%</span>
                    <span class="rate-count">${rateData.matches}/${rateData.total}</span>
                </div>
            </div>
        `;
    }

    /**
     * Render filters
     */
    renderFilters() {
        const { filterStatus, filterDecision, searchQuery } = this.state;

        return `
            <div class="comparison-filters">
                <div class="filter-group">
                    <label for="filter-status">Match Status:</label>
                    <select id="filter-status" class="form-select">
                        <option value="all" ${filterStatus === 'all' ? 'selected' : ''}>All Cases</option>
                        <option value="matches" ${filterStatus === 'matches' ? 'selected' : ''}>Matches Only</option>
                        <option value="mismatches" ${filterStatus === 'mismatches' ? 'selected' : ''}>Mismatches Only</option>
                    </select>
                </div>

                <div class="filter-group">
                    <label for="filter-decision">Decision Type:</label>
                    <select id="filter-decision" class="form-select">
                        <option value="all" ${filterDecision === 'all' ? 'selected' : ''}>All Decisions</option>
                        <option value="approve" ${filterDecision === 'approve' ? 'selected' : ''}>Approve</option>
                        <option value="refer" ${filterDecision === 'refer' ? 'selected' : ''}>Refer</option>
                        <option value="decline" ${filterDecision === 'decline' ? 'selected' : ''}>Decline</option>
                    </select>
                </div>

                <div class="filter-group search-group">
                    <label for="search-cases">Search:</label>
                    <input 
                        type="text" 
                        id="search-cases" 
                        class="form-input" 
                        placeholder="Search by test case ID..."
                        value="${this.escapeHtml(searchQuery)}"
                    />
                </div>

                <div class="filter-results">
                    Showing ${this.state.filteredResults.length} of ${this.state.parityResults.allResults.length} cases
                </div>
            </div>
        `;
    }

    /**
     * Render test case table
     */
    renderTestCaseTable() {
        const { filteredResults } = this.state;

        if (filteredResults.length === 0) {
            return `
                <div class="no-results">
                    <p>No test cases match the current filters.</p>
                </div>
            `;
        }

        return `
            <div class="test-case-table-container">
                <table class="test-case-table">
                    <thead>
                        <tr>
                            <th>Test Case ID</th>
                            <th>Expected Result</th>
                            <th>Actual Result</th>
                            <th>Match Status</th>
                            <th>Mismatched Fields</th>
                            <th>Execution Time</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredResults.map((result, index) => this.renderTableRow(result, index)).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render table row
     */
    renderTableRow(result, index) {
        const match = result.comparison.match;
        const statusClass = match ? 'match' : 'mismatch';
        const statusIcon = match ? '✓' : '✗';
        const expectedResult = result.expected.eligibilityResult;
        const actualResult = result.decision.eligibility.result;
        
        const mismatchedFields = Object.entries(result.comparison.fields)
            .filter(([_, field]) => !field.match)
            .map(([name, _]) => name)
            .join(', ') || 'None';

        return `
            <tr class="table-row ${statusClass}" data-index="${index}">
                <td class="test-case-id">${result.file}</td>
                <td>
                    <span class="badge badge-${this.getDecisionBadgeClass(expectedResult)}">
                        ${expectedResult}
                    </span>
                </td>
                <td>
                    <span class="badge badge-${this.getDecisionBadgeClass(actualResult)}">
                        ${actualResult}
                    </span>
                </td>
                <td class="match-status">
                    <span class="status-indicator ${statusClass}">
                        ${statusIcon} ${match ? 'Match' : 'Mismatch'}
                    </span>
                </td>
                <td class="mismatched-fields">${mismatchedFields}</td>
                <td class="execution-time">${result.executionTime.toFixed(2)}ms</td>
                <td class="actions">
                    <button class="btn-icon view-details" data-index="${index}" title="View Details">
                        🔍
                    </button>
                    <button class="btn-icon rerun-test" data-index="${index}" title="Re-run Test">
                        ▶️
                    </button>
                </td>
            </tr>
        `;
    }

    /**
     * Render detail view
     */
    renderDetailView() {
        const { selectedResult } = this.state;
        
        if (!selectedResult) return '';

        const comparison = selectedResult.comparison;
        const decision = selectedResult.decision;
        const expected = selectedResult.expected;

        return `
            <div class="detail-view">
                <div class="detail-header">
                    <button id="back-to-list" class="btn btn-secondary">
                        ← Back to List
                    </button>
                    <h3>Detailed Comparison: ${selectedResult.file}</h3>
                    <span class="match-indicator ${comparison.match ? 'match' : 'mismatch'}">
                        ${comparison.match ? '✓ Match' : '✗ Mismatch'}
                    </span>
                </div>

                <div class="detail-content">
                    <div class="comparison-panels">
                        ${this.renderExpectedPanel(expected)}
                        ${this.renderActualPanel(decision)}
                    </div>

                    ${this.renderFieldComparison(comparison.fields)}
                    ${this.renderRulesFired(decision.rulesFired)}
                </div>
            </div>
        `;
    }

    /**
     * Render expected panel
     */
    renderExpectedPanel(expected) {
        return `
            <div class="panel expected-panel">
                <div class="panel-header">
                    <h4>📋 Expected Decision</h4>
                </div>
                <div class="panel-content">
                    <div class="decision-fields">
                        <div class="field-item">
                            <label>Eligibility Result:</label>
                            <span class="badge badge-${this.getDecisionBadgeClass(expected.eligibilityResult)}">
                                ${expected.eligibilityResult}
                            </span>
                        </div>
                        <div class="field-item">
                            <label>Reason:</label>
                            <span>${expected.reason || 'N/A'}</span>
                        </div>
                        <div class="field-item">
                            <label>MI Rate (bps):</label>
                            <span>${expected.miRateBps || 'N/A'}</span>
                        </div>
                        <div class="field-item">
                            <label>Flags:</label>
                            <span>${expected.flags || 'None'}</span>
                        </div>
                        <div class="field-item">
                            <label>Required Docs:</label>
                            <span>${expected.requiredDocs || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render actual panel
     */
    renderActualPanel(decision) {
        return `
            <div class="panel actual-panel">
                <div class="panel-header">
                    <h4>🤖 Actual Decision</h4>
                    <span class="execution-time">${decision.executionTime.toFixed(2)}ms</span>
                </div>
                <div class="panel-content">
                    <div class="decision-fields">
                        <div class="field-item">
                            <label>Eligibility Result:</label>
                            <span class="badge badge-${this.getDecisionBadgeClass(decision.eligibility.result)}">
                                ${decision.eligibility.result}
                            </span>
                        </div>
                        <div class="field-item">
                            <label>Reason:</label>
                            <span>${decision.eligibility.reason || 'N/A'}</span>
                        </div>
                        <div class="field-item">
                            <label>MI Rate (bps):</label>
                            <span>${decision.pricing.miRateBps !== null ? decision.pricing.miRateBps : 'N/A'}</span>
                        </div>
                        <div class="field-item">
                            <label>Flags:</label>
                            <span>${decision.eligibility.flags.length > 0 ? decision.eligibility.flags.join(', ') : 'None'}</span>
                        </div>
                        <div class="field-item">
                            <label>Required Docs:</label>
                            <span>${decision.documentation.requiredDocs.length > 0 ? decision.documentation.requiredDocs.join(', ') : 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render field-by-field comparison
     */
    renderFieldComparison(fields) {
        return `
            <div class="panel field-comparison-panel">
                <div class="panel-header">
                    <h4>🔍 Field-by-Field Comparison</h4>
                </div>
                <div class="panel-content">
                    <table class="field-comparison-table">
                        <thead>
                            <tr>
                                <th>Field</th>
                                <th>Expected</th>
                                <th>Actual</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(fields).map(([fieldName, fieldData]) => `
                                <tr class="${fieldData.match ? 'match' : 'mismatch'}">
                                    <td class="field-name">${this.formatFieldName(fieldName)}</td>
                                    <td class="expected-value">${this.formatFieldValue(fieldData.expected)}</td>
                                    <td class="actual-value">${this.formatFieldValue(fieldData.actual)}</td>
                                    <td class="status">
                                        <span class="status-icon ${fieldData.match ? 'match' : 'mismatch'}">
                                            ${fieldData.match ? '✓' : '✗'}
                                        </span>
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
     * Render rules fired
     */
    renderRulesFired(rulesFired) {
        return `
            <div class="panel rules-fired-panel">
                <div class="panel-header">
                    <h4>🔥 Rules Fired (${rulesFired.length})</h4>
                </div>
                <div class="panel-content">
                    <div class="rules-trace">
                        ${rulesFired.map((rule, index) => `
                            <div class="rule-item">
                                <span class="rule-number">${index + 1}</span>
                                <span class="rule-id">${rule.ruleId}</span>
                                <span class="rule-name">${rule.ruleName}</span>
                                <span class="rule-priority">Priority: ${rule.priority}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render loading state
     */
    renderLoading() {
        return `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading parity validation results...</p>
            </div>
        `;
    }

    /**
     * Render error state
     */
    renderError(message) {
        return `
            <div class="error-state">
                <h3>⚠️ Error Loading Data</h3>
                <p>${this.escapeHtml(message)}</p>
                <button id="retry-load" class="btn btn-primary">Retry</button>
            </div>
        `;
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        return `
            <div class="empty-state">
                <h3>📊 No Parity Results Available</h3>
                <p>No parity validation results found. Please ensure the parity validation has been run.</p>
            </div>
        `;
    }

    /**
     * After mount - set up event listeners
     */
    afterMount() {
        this.removeAllEventListeners();

        // Filter controls
        const statusFilter = this.$('#filter-status');
        if (statusFilter) {
            this.addEventListener(statusFilter, 'change', (e) => {
                this.handleFilterChange('status', e.target.value);
            });
        }

        const decisionFilter = this.$('#filter-decision');
        if (decisionFilter) {
            this.addEventListener(decisionFilter, 'change', (e) => {
                this.handleFilterChange('decision', e.target.value);
            });
        }

        const searchInput = this.$('#search-cases');
        if (searchInput) {
            this.addEventListener(searchInput, 'input', this.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
        }

        // Export button
        const exportBtn = this.$('#export-csv');
        if (exportBtn) {
            this.addEventListener(exportBtn, 'click', () => {
                this.exportToCSV();
            });
        }

        // Refresh button
        const refreshBtn = this.$('#refresh-data');
        if (refreshBtn) {
            this.addEventListener(refreshBtn, 'click', () => {
                this.refreshData();
            });
        }

        // View details buttons
        this.$$('.view-details').forEach(btn => {
            this.addEventListener(btn, 'click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.showDetailView(index);
            });
        });

        // Re-run test buttons
        this.$$('.rerun-test').forEach(btn => {
            this.addEventListener(btn, 'click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.rerunTest(index);
            });
        });

        // Back to list button
        const backBtn = this.$('#back-to-list');
        if (backBtn) {
            this.addEventListener(backBtn, 'click', () => {
                this.hideDetailView();
            });
        }

        // Retry button
        const retryBtn = this.$('#retry-load');
        if (retryBtn) {
            this.addEventListener(retryBtn, 'click', () => {
                this.init().then(() => this.update());
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
     * Handle filter change
     */
    handleFilterChange(filterType, value) {
        if (filterType === 'status') {
            this.state.filterStatus = value;
        } else if (filterType === 'decision') {
            this.state.filterDecision = value;
        }
        
        this.applyFilters();
        this.setState({}, true);
    }

    /**
     * Handle search
     */
    handleSearch(query) {
        this.state.searchQuery = query;
        this.applyFilters();
        this.setState({}, true);
    }

    /**
     * Apply filters to results
     */
    applyFilters() {
        const { parityResults, filterStatus, filterDecision, searchQuery } = this.state;
        
        if (!parityResults || !parityResults.allResults) return;

        let filtered = parityResults.allResults;

        // Filter by match status
        if (filterStatus === 'matches') {
            filtered = filtered.filter(r => r.comparison.match);
        } else if (filterStatus === 'mismatches') {
            filtered = filtered.filter(r => !r.comparison.match);
        }

        // Filter by decision type
        if (filterDecision !== 'all') {
            filtered = filtered.filter(r => 
                r.decision.eligibility.result === filterDecision
            );
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(r => 
                r.file.toLowerCase().includes(query)
            );
        }

        this.state.filteredResults = filtered;
    }

    /**
     * Show detail view
     */
    showDetailView(index) {
        const result = this.state.filteredResults[index];
        if (result) {
            this.setState({
                showDetailView: true,
                selectedResult: result
            });
        }
    }

    /**
     * Hide detail view
     */
    hideDetailView() {
        this.setState({
            showDetailView: false,
            selectedResult: null
        });
    }

    /**
     * Re-run test
     */
    async rerunTest(index) {
        const result = this.state.filteredResults[index];
        if (!result) return;

        try {
            // Load the test case data
            const response = await fetch(`legacy_perl/samples/${result.file}`);
            if (!response.ok) {
                throw new Error('Failed to load test case');
            }
            
            const testData = await response.json();
            
            // Run simulation
            const newDecision = this.simulator.simulate(testData);
            
            // Update the result
            result.decision = newDecision;
            result.executionTime = newDecision.executionTime;
            
            // Re-render
            this.setState({}, true);
            
            console.log('Test re-run completed:', result.file);
            
        } catch (error) {
            console.error('Error re-running test:', error);
            alert(`Failed to re-run test: ${error.message}`);
        }
    }

    /**
     * Export to CSV
     */
    exportToCSV() {
        const { filteredResults } = this.state;
        
        if (filteredResults.length === 0) {
            alert('No results to export');
            return;
        }

        // Create CSV content
        const headers = ['Test Case', 'Expected Result', 'Actual Result', 'Match', 'Mismatched Fields', 'Execution Time (ms)'];
        const rows = filteredResults.map(result => {
            const mismatchedFields = Object.entries(result.comparison.fields)
                .filter(([_, field]) => !field.match)
                .map(([name, _]) => name)
                .join('; ');
            
            return [
                result.file,
                result.expected.eligibilityResult,
                result.decision.eligibility.result,
                result.comparison.match ? 'Yes' : 'No',
                mismatchedFields || 'None',
                result.executionTime.toFixed(2)
            ];
        });

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `parity-comparison-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Refresh data
     */
    async refreshData() {
        this.state.isLoading = true;
        this.setState({}, true);
        
        await this.init();
        this.applyFilters();
        this.setState({}, true);
    }

    /**
     * Get gauge color based on percentage
     */
    getGaugeColor(percentage) {
        if (percentage >= 90) return '#10b981'; // green
        if (percentage >= 70) return '#f59e0b'; // yellow
        if (percentage >= 50) return '#f97316'; // orange
        return '#ef4444'; // red
    }

    /**
     * Get decision badge class
     */
    getDecisionBadgeClass(decision) {
        switch (decision?.toLowerCase()) {
            case 'approve': return 'success';
            case 'refer': return 'warning';
            case 'decline': return 'danger';
            default: return 'secondary';
        }
    }

    /**
     * Format field name for display
     */
    formatFieldName(fieldName) {
        return fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Format field value for display
     */
    formatFieldValue(value) {
        if (value === null || value === undefined) return 'N/A';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    }
}

export default DecisionComparison;

// Made with Bob