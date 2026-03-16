/**
 * DataLoader Service
 * Handles loading and caching of PERL rules, test cases, and expected decisions
 */

export class DataLoader {
    constructor() {
        this.cache = {
            rules: null,
            testCases: null,
            expectedDecisions: null,
            tables: {}
        };
        
        // Base paths relative to the web_dashboard directory
        this.paths = {
            rules: '../legacy_perl/rules/',
            samples: '../legacy_perl/samples/',
            tables: '../legacy_perl/tables/',
            design: '../odm_target/design/'
        };

        // Known rule files
        this.ruleFiles = [
            'ruleflow.perl',
            'underwriting.perl',
            'pricing.perl',
            'docs_required.perl',
            'exceptions.perl'
        ];
    }

    /**
     * Load all PERL rule files
     * @returns {Promise<Array>} Array of rule objects
     */
    async loadRules() {
        // Return cached data if available
        if (this.cache.rules) {
            console.log('Returning cached rules');
            return this.cache.rules;
        }

        try {
            console.log('Loading PERL rules...');
            
            const rules = await Promise.all(
                this.ruleFiles.map(async (filename) => {
                    try {
                        const content = await this.fetchFile(this.paths.rules + filename);
                        return {
                            filename,
                            name: this.getRuleName(filename),
                            content,
                            type: 'perl',
                            loaded: true,
                            error: null
                        };
                    } catch (error) {
                        console.warn(`Failed to load rule file ${filename}:`, error.message);
                        return {
                            filename,
                            name: this.getRuleName(filename),
                            content: null,
                            type: 'perl',
                            loaded: false,
                            error: error.message
                        };
                    }
                })
            );

            // Cache the results
            this.cache.rules = rules;
            
            const loadedCount = rules.filter(r => r.loaded).length;
            console.log(`Loaded ${loadedCount}/${rules.length} rule files`);
            
            return rules;

        } catch (error) {
            console.error('Error loading rules:', error);
            throw new Error(`Failed to load rules: ${error.message}`);
        }
    }

    /**
     * Load all test case JSON files
     * @returns {Promise<Array>} Array of test case objects
     */
    async loadTestCases() {
        // Return cached data if available
        if (this.cache.testCases) {
            console.log('Returning cached test cases');
            return this.cache.testCases;
        }

        try {
            console.log('Loading test cases...');
            
            // Generate test case file names (loan_app_001.json to loan_app_060.json)
            const testCaseFiles = Array.from({ length: 60 }, (_, i) => {
                const num = String(i + 1).padStart(3, '0');
                return `loan_app_${num}.json`;
            });

            const testCases = await Promise.all(
                testCaseFiles.map(async (filename) => {
                    try {
                        const content = await this.fetchFile(this.paths.samples + filename);
                        const data = JSON.parse(content);
                        return {
                            filename,
                            id: data.application_id || filename.replace('.json', ''),
                            data,
                            loaded: true,
                            error: null
                        };
                    } catch (error) {
                        console.warn(`Failed to load test case ${filename}:`, error.message);
                        return {
                            filename,
                            id: filename.replace('.json', ''),
                            data: null,
                            loaded: false,
                            error: error.message
                        };
                    }
                })
            );

            // Cache the results
            this.cache.testCases = testCases;
            
            const loadedCount = testCases.filter(tc => tc.loaded).length;
            console.log(`Loaded ${loadedCount}/${testCases.length} test cases`);
            
            return testCases;

        } catch (error) {
            console.error('Error loading test cases:', error);
            throw new Error(`Failed to load test cases: ${error.message}`);
        }
    }

    /**
     * Load expected decisions CSV file
     * @returns {Promise<Array>} Array of expected decision objects
     */
    async loadExpectedDecisions() {
        // Return cached data if available
        if (this.cache.expectedDecisions) {
            console.log('Returning cached expected decisions');
            return this.cache.expectedDecisions;
        }

        try {
            console.log('Loading expected decisions...');
            
            const csvContent = await this.fetchFile(this.paths.samples + 'expected_decisions.csv');
            const decisions = this.parseCSV(csvContent);
            
            // Cache the results
            this.cache.expectedDecisions = decisions;
            
            console.log(`Loaded ${decisions.length} expected decisions`);
            
            return decisions;

        } catch (error) {
            console.error('Error loading expected decisions:', error);
            throw new Error(`Failed to load expected decisions: ${error.message}`);
        }
    }

    /**
     * Load a specific table CSV file
     * @param {string} tableName - Name of the table file (e.g., 'ltv_thresholds.csv')
     * @returns {Promise<Array>} Parsed CSV data
     */
    async loadTable(tableName) {
        // Return cached data if available
        if (this.cache.tables[tableName]) {
            console.log(`Returning cached table: ${tableName}`);
            return this.cache.tables[tableName];
        }

        try {
            console.log(`Loading table: ${tableName}`);
            
            const csvContent = await this.fetchFile(this.paths.tables + tableName);
            const data = this.parseCSV(csvContent);
            
            // Cache the results
            this.cache.tables[tableName] = data;
            
            console.log(`Loaded table ${tableName} with ${data.length} rows`);
            
            return data;

        } catch (error) {
            console.error(`Error loading table ${tableName}:`, error);
            throw new Error(`Failed to load table ${tableName}: ${error.message}`);
        }
    }

    /**
     * Load ODM design documentation
     * @param {string} docName - Name of the design document
     * @returns {Promise<string>} Document content
     */
    async loadDesignDoc(docName) {
        try {
            console.log(`Loading design document: ${docName}`);
            
            const content = await this.fetchFile(this.paths.design + docName);
            
            console.log(`Loaded design document: ${docName}`);
            
            return content;

        } catch (error) {
            console.error(`Error loading design document ${docName}:`, error);
            throw new Error(`Failed to load design document ${docName}: ${error.message}`);
        }
    }

    /**
     * Fetch a file from the server
     * @param {string} path - File path
     * @returns {Promise<string>} File content
     */
    async fetchFile(path) {
        try {
            const response = await fetch(path);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.text();

        } catch (error) {
            if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                throw new Error(`Network error: Unable to fetch ${path}. Make sure the file exists and the server is running.`);
            }
            throw error;
        }
    }

    /**
     * Parse CSV content into array of objects
     * @param {string} csvContent - CSV file content
     * @returns {Array<Object>} Parsed data
     */
    parseCSV(csvContent) {
        const lines = csvContent.trim().split('\n');
        
        if (lines.length === 0) {
            return [];
        }

        // Parse header row
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Parse data rows
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const values = this.parseCSVLine(line);
            const row = {};
            
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            
            data.push(row);
        }
        
        return data;
    }

    /**
     * Parse a single CSV line, handling quoted values
     * @param {string} line - CSV line
     * @returns {Array<string>} Parsed values
     */
    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        // Add the last value
        values.push(current.trim());
        
        return values;
    }

    /**
     * Get a human-readable name from a rule filename
     * @param {string} filename - Rule filename
     * @returns {string} Human-readable name
     */
    getRuleName(filename) {
        const nameMap = {
            'ruleflow.perl': 'Rule Flow',
            'underwriting.perl': 'Underwriting Rules',
            'pricing.perl': 'Pricing Rules',
            'docs_required.perl': 'Document Requirements',
            'exceptions.perl': 'Exception Handling'
        };
        
        return nameMap[filename] || filename.replace('.perl', '').replace(/_/g, ' ');
    }

    /**
     * Clear all cached data
     */
    clearCache() {
        console.log('Clearing data cache');
        this.cache = {
            rules: null,
            testCases: null,
            expectedDecisions: null,
            tables: {}
        };
    }

    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getCacheStats() {
        return {
            rules: this.cache.rules ? this.cache.rules.length : 0,
            testCases: this.cache.testCases ? this.cache.testCases.length : 0,
            expectedDecisions: this.cache.expectedDecisions ? this.cache.expectedDecisions.length : 0,
            tables: Object.keys(this.cache.tables).length
        };
    }
}

export default DataLoader;

// Made with Bob
