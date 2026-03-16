/**
 * RuleViewer Component
 * Displays side-by-side comparison of PERL rules and ODM design documentation
 * Updated: 2026-03-16 - Info panel repositioned to top
 */

import { BaseComponent } from './BaseComponent.js';
import { RuleParser } from '../utils/RuleParser.js';

export class RuleViewer extends BaseComponent {
    /**
     * Initialize the RuleViewer component
     * @param {HTMLElement} container - Container element
     * @param {Object} props - Component properties
     * @param {Array} props.rules - Array of rule objects from DataLoader
     * @param {Object} props.dataLoader - DataLoader instance
     */
    constructor(container, props = {}) {
        super(container, props);
        
        this.state = {
            selectedRuleFile: null,
            parsedRules: null,
            odmDesignDoc: null,
            loading: false,
            error: null,
            viewMode: 'side-by-side' // 'side-by-side' or 'stacked'
        };
    }

    /**
     * Initialize component
     */
    init() {
        // Set initial state if rules are provided
        if (this.props.rules && this.props.rules.length > 0) {
            // Select first loaded rule by default
            const firstLoadedRule = this.props.rules.find(r => r.loaded);
            if (firstLoadedRule) {
                this.state.selectedRuleFile = firstLoadedRule.filename;
            }
        }

        // Set initial view mode based on screen size (don't use setState to avoid re-render)
        const isMobile = window.innerWidth < 768;
        this.state.viewMode = isMobile ? 'stacked' : 'side-by-side';
    }

    /**
     * Update view mode based on screen size
     */
    updateViewMode() {
        const isMobile = window.innerWidth < 768;
        const newMode = isMobile ? 'stacked' : 'side-by-side';
        
        if (newMode !== this.state.viewMode) {
            this.state.viewMode = newMode;
            // Manually update the class on the content element
            const content = this.$('.rule-viewer-content');
            if (content) {
                content.className = `rule-viewer-content ${newMode}`;
            }
        }
    }

    /**
     * Render the component
     */
    render() {
        const { rules } = this.props;
        const { selectedRuleFile, parsedRules, odmDesignDoc, loading, error, viewMode } = this.state;

        if (!rules || rules.length === 0) {
            return this.renderEmptyState();
        }

        return `
            <div class="rule-viewer">
                ${this.renderHeader()}
                ${error ? this.renderError(error) : ''}
                ${loading ? this.renderLoading() : ''}
                ${this.renderInfoPanel()}
                <div class="rule-viewer-content ${viewMode}">
                    ${this.renderPerlPanel()}
                    ${this.renderOdmPanel()}
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
                    <h4>About Rule Comparison</h4>
                    <p>
                        This view shows the <strong>legacy PERL rules</strong> (left) alongside the corresponding
                        <strong>ODM design documentation</strong> (right). Select a rule category to see how
                        business logic is being migrated from the old PERL-DSL format to modern ODM decision tables
                        and action rules.
                    </p>
                    <ul class="info-tips">
                        <li><strong>💡 Tip:</strong> The ODM documentation shows only the relevant section for the selected rule category</li>
                        <li><strong>📊 Migration:</strong> 34 legacy PERL rules → 3 decision tables + 17 action rules</li>
                        <li><strong>🎯 Goal:</strong> Maintain 100% functional parity while improving maintainability</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Render header with rule selector
     */
    renderHeader() {
        const { rules } = this.props;
        const { selectedRuleFile } = this.state;

        return `
            <div class="rule-viewer-header">
                <div class="rule-selector-container">
                    <label for="rule-selector" class="rule-selector-label">
                        <span class="label-icon">📋</span>
                        Select Rule Category:
                    </label>
                    <select id="rule-selector" class="rule-selector">
                        <option value="">-- Choose a rule file --</option>
                        ${rules.map(rule => `
                            <option 
                                value="${rule.filename}" 
                                ${selectedRuleFile === rule.filename ? 'selected' : ''}
                                ${!rule.loaded ? 'disabled' : ''}
                            >
                                ${rule.name}${!rule.loaded ? ' (Failed to load)' : ''}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="view-mode-toggle">
                    <button 
                        id="toggle-view-mode" 
                        class="btn-secondary"
                        title="Toggle layout"
                    >
                        <span class="toggle-icon">${this.state.viewMode === 'side-by-side' ? '⬍' : '⬌'}</span>
                        ${this.state.viewMode === 'side-by-side' ? 'Stack' : 'Side-by-Side'}
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render PERL rules panel
     */
    renderPerlPanel() {
        const { selectedRuleFile, parsedRules } = this.state;

        if (!selectedRuleFile) {
            return `
                <div class="rule-panel perl-panel">
                    <div class="panel-header">
                        <h3>📄 PERL Rules (Legacy)</h3>
                    </div>
                    <div class="panel-content">
                        <div class="placeholder-message">
                            <p>👈 Select a rule category from the dropdown above to view PERL rules</p>
                        </div>
                    </div>
                </div>
            `;
        }

        const selectedRule = this.props.rules.find(r => r.filename === selectedRuleFile);
        
        if (!selectedRule || !selectedRule.loaded) {
            return `
                <div class="rule-panel perl-panel">
                    <div class="panel-header">
                        <h3>📄 PERL Rules (Legacy)</h3>
                    </div>
                    <div class="panel-content">
                        <div class="error-message">
                            <p>⚠️ Failed to load rule file: ${selectedRule?.error || 'Unknown error'}</p>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="rule-panel perl-panel">
                <div class="panel-header">
                    <h3>📄 PERL Rules (Legacy)</h3>
                    <span class="panel-badge">${selectedRule.name}</span>
                </div>
                <div class="panel-content">
                    ${parsedRules ? this.renderParsedRules(parsedRules) : ''}
                    ${this.renderPerlCode(selectedRule.content)}
                </div>
            </div>
        `;
    }

    /**
     * Render parsed rules summary
     */
    renderParsedRules(parsedData) {
        if (!parsedData || parsedData.rules.length === 0) {
            return '';
        }

        const stats = RuleParser.getRuleStats(parsedData.rules);

        return `
            <div class="rules-summary">
                <div class="summary-header">
                    <h4>📊 Rule Summary</h4>
                    <button id="toggle-summary" class="btn-link">Hide</button>
                </div>
                <div id="summary-content" class="summary-content">
                    <div class="summary-stats">
                        <div class="stat-item">
                            <span class="stat-label">Total Rules:</span>
                            <span class="stat-value">${stats.total}</span>
                        </div>
                        ${Object.entries(stats.byEffect).map(([effect, count]) => `
                            <div class="stat-item">
                                <span class="stat-label">${effect}:</span>
                                <span class="stat-value">${count}</span>
                            </div>
                        `).join('')}
                    </div>
                    <div class="rules-list">
                        <h5>Rules in this file:</h5>
                        <ul>
                            ${parsedData.rules.map(rule => `
                                <li class="rule-item">
                                    <strong>${rule.id}</strong>
                                    ${rule.name ? ` - ${rule.name}` : ''}
                                    <span class="rule-effect ${rule.effect}">${rule.effect}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                    ${parsedData.metadata.warnings.length > 0 ? `
                        <div class="metadata-section warnings">
                            <h5>⚠️ Warnings:</h5>
                            <ul>
                                ${parsedData.metadata.warnings.map(w => `<li>${this.escapeHtml(w)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    ${parsedData.metadata.todos.length > 0 ? `
                        <div class="metadata-section todos">
                            <h5>📝 TODOs:</h5>
                            <ul>
                                ${parsedData.metadata.todos.map(t => `<li>${this.escapeHtml(t)}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render PERL code with syntax highlighting
     */
    renderPerlCode(content) {
        return `
            <div class="code-section">
                <div class="code-header">
                    <h4>💻 Source Code</h4>
                    <button id="copy-perl-code" class="btn-link" title="Copy to clipboard">
                        📋 Copy
                    </button>
                </div>
                <pre class="code-block"><code class="language-perl">${this.escapeHtml(content)}</code></pre>
            </div>
        `;
    }

    /**
     * Render ODM design panel
     */
    renderOdmPanel() {
        const { selectedRuleFile, odmDesignDoc } = this.state;

        if (!selectedRuleFile) {
            return `
                <div class="rule-panel odm-panel">
                    <div class="panel-header">
                        <h3>🎯 ODM Design (Target)</h3>
                    </div>
                    <div class="panel-content">
                        <div class="placeholder-message">
                            <p>Select a rule category to view the corresponding ODM design documentation</p>
                        </div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="rule-panel odm-panel">
                <div class="panel-header">
                    <h3>🎯 ODM Design (Target)</h3>
                    <span class="panel-badge">Migration Design</span>
                </div>
                <div class="panel-content">
                    ${odmDesignDoc ? this.renderOdmDesign(odmDesignDoc) : this.renderOdmPlaceholder()}
                </div>
            </div>
        `;
    }

    /**
     * Render ODM design documentation
     */
    renderOdmDesign(content) {
        // Convert markdown to HTML (basic conversion)
        const htmlContent = this.markdownToHtml(content);
        
        return `
            <div class="odm-design-content">
                <div class="design-header">
                    <h4>📖 Design Documentation</h4>
                    <button id="copy-odm-doc" class="btn-link" title="Copy to clipboard">
                        📋 Copy
                    </button>
                </div>
                <div class="markdown-content">
                    ${htmlContent}
                </div>
            </div>
        `;
    }

    /**
     * Render ODM placeholder
     */
    renderOdmPlaceholder() {
        return `
            <div class="odm-placeholder">
                <div class="placeholder-content">
                    <h4>📚 ODM Design Documentation</h4>
                    <p>The ODM design documentation provides:</p>
                    <ul>
                        <li>Rule mapping from PERL to ODM</li>
                        <li>Decision table structures</li>
                        <li>Action rule definitions</li>
                        <li>Transformation patterns</li>
                        <li>Migration notes and considerations</li>
                    </ul>
                    <p class="mt-md">
                        <strong>Available Documentation:</strong>
                    </p>
                    <ul>
                        <li><a href="#" data-doc="mappings_perl_to_odm.md">PERL to ODM Mappings</a></li>
                        <li><a href="#" data-doc="domain_model.md">Domain Model</a></li>
                        <li><a href="#" data-doc="decision_service_arch.md">Decision Service Architecture</a></li>
                        <li><a href="#" data-doc="parity_report.md">Parity Report</a></li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Render empty state
     */
    renderEmptyState() {
        return `
            <div class="rule-viewer-empty">
                <div class="empty-state">
                    <h3>📋 No Rules Available</h3>
                    <p>No PERL rule files could be loaded. Please check:</p>
                    <ul>
                        <li>The <code>legacy_perl/rules/</code> directory exists</li>
                        <li>Rule files are present in the directory</li>
                        <li>The web server is running correctly</li>
                    </ul>
                </div>
            </div>
        `;
    }

    /**
     * Render loading state
     */
    renderLoading() {
        return `
            <div class="loading-overlay">
                <div class="spinner"></div>
                <p>Loading documentation...</p>
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
     * After mount lifecycle - set up event listeners
     */
    afterMount() {
        // Clear existing event listeners to prevent duplicates
        this.removeAllEventListeners();
        
        // Rule selector change
        const selector = this.$('#rule-selector');
        if (selector) {
            this.addEventListener(selector, 'change', (e) => {
                this.handleRuleSelection(e.target.value);
            });
        }

        // View mode toggle
        const toggleBtn = this.$('#toggle-view-mode');
        if (toggleBtn) {
            this.addEventListener(toggleBtn, 'click', () => {
                this.toggleViewMode();
            });
        }

        // Summary toggle
        const summaryToggle = this.$('#toggle-summary');
        if (summaryToggle) {
            this.addEventListener(summaryToggle, 'click', () => {
                this.toggleSummary();
            });
        }

        // Copy buttons
        const copyPerlBtn = this.$('#copy-perl-code');
        if (copyPerlBtn) {
            this.addEventListener(copyPerlBtn, 'click', () => {
                this.copyPerlCode();
            });
        }

        const copyOdmBtn = this.$('#copy-odm-doc');
        if (copyOdmBtn) {
            this.addEventListener(copyOdmBtn, 'click', () => {
                this.copyOdmDoc();
            });
        }

        // Error dismiss
        const dismissBtn = this.$('#dismiss-error');
        if (dismissBtn) {
            this.addEventListener(dismissBtn, 'click', () => {
                this.setState({ error: null });
            });
        }

        // ODM doc links
        const docLinks = this.$$('[data-doc]');
        docLinks.forEach(link => {
            this.addEventListener(link, 'click', (e) => {
                e.preventDefault();
                this.loadOdmDoc(link.getAttribute('data-doc'));
            });
        });

        // Apply syntax highlighting if Prism is available
        if (window.Prism) {
            window.Prism.highlightAllUnder(this.container);
        }

        // Load initial rule if selected (only on first mount, not on updates)
        if (this.state.selectedRuleFile && !this.state.parsedRules) {
            this.handleRuleSelection(this.state.selectedRuleFile);
        }
    }

    /**
     * Handle rule selection
     */
    async handleRuleSelection(filename) {
        if (!filename) {
            this.setState({
                selectedRuleFile: null,
                parsedRules: null,
                odmDesignDoc: null
            });
            return;
        }

        // Update state without triggering re-render during async operation
        this.state.selectedRuleFile = filename;
        this.state.loading = true;
        this.state.error = null;
        
        // Manually update loading indicator
        const loadingOverlay = this.$('.loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }

        try {
            // Find the selected rule
            const selectedRule = this.props.rules.find(r => r.filename === filename);
            
            if (!selectedRule || !selectedRule.loaded) {
                throw new Error('Rule file not loaded');
            }

            // Parse the PERL rules
            const parsedRules = RuleParser.parseRuleFile(selectedRule.content);

            // Load ODM design documentation
            await this.loadOdmDoc('mappings_perl_to_odm.md');

            // Update state and trigger single re-render
            this.setState({ parsedRules, loading: false });

        } catch (error) {
            console.error('Error loading rule:', error);
            this.setState({
                error: `Failed to load rule: ${error.message}`,
                loading: false
            });
        }
    }

    /**
     * Load ODM design documentation
     */
    async loadOdmDoc(docName) {
        if (!this.props.dataLoader) {
            console.warn('DataLoader not available');
            return;
        }

        // Don't trigger re-render for loading state during async operation
        this.state.loading = true;
        this.state.error = null;

        try {
            const content = await this.props.dataLoader.loadDesignDoc(docName);
            
            // Extract relevant section based on selected rule file
            const relevantSection = this.extractRelevantSection(content, this.state.selectedRuleFile);
            
            // Only update state once with final result (no re-render for loading)
            this.state.odmDesignDoc = relevantSection;
            this.state.loading = false;
        } catch (error) {
            console.error('Error loading ODM doc:', error);
            this.setState({
                error: `Failed to load documentation: ${error.message}`,
                loading: false
            });
        }
    }

    /**
     * Extract relevant section from ODM documentation based on rule file
     */
    extractRelevantSection(fullDoc, ruleFilename) {
        if (!ruleFilename || !fullDoc) {
            return fullDoc;
        }

        // Map rule filenames to documentation sections
        const sectionMap = {
            'exceptions.perl': {
                title: 'Exception Rules',
                startMarker: '## Exception Rules (ExceptionRules Project)',
                endMarker: '## Eligibility Rules'
            },
            'underwriting.perl': {
                title: 'Eligibility Rules',
                startMarker: '## Eligibility Rules (EligibilityRules Project)',
                endMarker: '## Pricing Rules'
            },
            'pricing.perl': {
                title: 'Pricing Rules',
                startMarker: '## Pricing Rules (PricingRules Project)',
                endMarker: '## Documentation Rules'
            },
            'docs_required.perl': {
                title: 'Documentation Rules',
                startMarker: '## Documentation Rules (DocumentationRules Project)',
                endMarker: '## Migration Notes'
            },
            'ruleflow.perl': {
                title: 'Ruleflow and Execution Order',
                startMarker: '## Ruleflow',
                endMarker: '## Migration Notes'
            }
        };

        const section = sectionMap[ruleFilename];
        if (!section) {
            return fullDoc; // Return full doc if no specific section found
        }

        // Extract section between markers
        const startIdx = fullDoc.indexOf(section.startMarker);
        if (startIdx === -1) {
            return fullDoc;
        }

        let endIdx = fullDoc.indexOf(section.endMarker, startIdx);
        if (endIdx === -1) {
            endIdx = fullDoc.length; // Use rest of document if no end marker
        }

        // Include the overview section at the top
        const overviewEnd = fullDoc.indexOf('---', 0);
        const overview = overviewEnd > 0 ? fullDoc.substring(0, overviewEnd + 3) : '';
        
        const sectionContent = fullDoc.substring(startIdx, endIdx);
        
        return `${overview}\n\n${sectionContent}`;
    }

    /**
     * Toggle view mode
     */
    toggleViewMode() {
        const newMode = this.state.viewMode === 'side-by-side' ? 'stacked' : 'side-by-side';
        this.state.viewMode = newMode;
        
        // Manually update the class without full re-render
        const content = this.$('.rule-viewer-content');
        if (content) {
            content.className = `rule-viewer-content ${newMode}`;
        }
    }

    /**
     * Toggle summary visibility
     */
    toggleSummary() {
        const summaryContent = this.$('#summary-content');
        const toggleBtn = this.$('#toggle-summary');
        
        if (summaryContent && toggleBtn) {
            const isHidden = summaryContent.style.display === 'none';
            summaryContent.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = isHidden ? 'Hide' : 'Show';
        }
    }

    /**
     * Copy PERL code to clipboard
     */
    async copyPerlCode() {
        const selectedRule = this.props.rules.find(r => r.filename === this.state.selectedRuleFile);
        if (!selectedRule || !selectedRule.content) return;

        try {
            await navigator.clipboard.writeText(selectedRule.content);
            this.showCopyFeedback('#copy-perl-code');
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    }

    /**
     * Copy ODM documentation to clipboard
     */
    async copyOdmDoc() {
        if (!this.state.odmDesignDoc) return;

        try {
            await navigator.clipboard.writeText(this.state.odmDesignDoc);
            this.showCopyFeedback('#copy-odm-doc');
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    }

    /**
     * Show copy feedback
     */
    showCopyFeedback(selector) {
        const btn = this.$(selector);
        if (!btn) return;

        const originalText = btn.textContent;
        btn.textContent = '✓ Copied!';
        btn.classList.add('success');

        setTimeout(() => {
            btn.textContent = originalText;
            btn.classList.remove('success');
        }, 2000);
    }

    /**
     * Basic markdown to HTML conversion
     */
    markdownToHtml(markdown) {
        let html = markdown;

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // Code blocks
        html = html.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');

        // Inline code
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');

        // Links
        html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');

        // Line breaks
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';

        return html;
    }
}

export default RuleViewer;

// Made with Bob