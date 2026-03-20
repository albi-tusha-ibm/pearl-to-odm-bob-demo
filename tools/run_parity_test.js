#!/usr/bin/env node

/**
 * Parity Validation Test Harness
 * 
 * Validates the JavaScript DecisionSimulator against expected results from the legacy Perl system.
 * Loads all 60 test cases, executes decisions, and generates detailed parity reports.
 * 
 * Usage: node tools/run_parity_test.js
 */

const fs = require('fs');
const path = require('path');

// Import DecisionSimulator - handle both ES6 and CommonJS
let DecisionSimulator;
try {
    // Try ES6 import first
    const module = require('../web_dashboard/services/DecisionSimulator.js');
    DecisionSimulator = module.DecisionSimulator || module.default;
} catch (e) {
    console.error('Error loading DecisionSimulator:', e.message);
    process.exit(1);
}

// Configuration
const CONFIG = {
    samplesDir: path.join(__dirname, '../legacy_perl/samples'),
    expectedCsvPath: path.join(__dirname, '../legacy_perl/samples/expected_decisions.csv'),
    outputDir: path.join(__dirname, '../odm_target/export'),
    resultsJsonPath: path.join(__dirname, '../odm_target/export/parity_validation_results.json'),
    summaryCsvPath: path.join(__dirname, '../odm_target/export/parity_summary.csv')
};

/**
 * Parse CSV file into array of objects
 * Handles comma-separated values properly, including empty fields
 */
function parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = [];
        let currentValue = '';
        let inQuotes = false;
        
        // Parse CSV line handling quotes and commas
        for (let j = 0; j < line.length; j++) {
            const char = line[j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue);
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue); // Add last value
        
        const row = {};
        headers.forEach((header, index) => {
            row[header] = (values[index] !== undefined ? values[index] : '');
        });
        data.push(row);
    }
    
    return data;
}

/**
 * Load expected decisions from CSV
 */
function loadExpectedDecisions() {
    console.log('Loading expected decisions from CSV...');
    const csvContent = fs.readFileSync(CONFIG.expectedCsvPath, 'utf8');
    const expectedData = parseCSV(csvContent);
    
    const expectedMap = {};
    expectedData.forEach((row, index) => {
        // Safety check for required fields
        if (!row.file) {
            console.warn(`Warning: Row ${index + 1} missing file field, skipping`);
            return;
        }
        
        expectedMap[row.file] = {
            eligibilityResult: (row['eligibility.result'] || '').trim(),
            reason: (row.reason || '').trim(),
            miRateBps: (row.miRateBps || '').trim(),
            flags: (row.flags || '').trim(),
            requiredDocs: (row.requiredDocs || '').trim()
        };
    });
    
    console.log(`✓ Loaded ${Object.keys(expectedMap).length} expected decisions`);
    return expectedMap;
}

/**
 * Load all loan application JSON files
 */
function loadLoanApplications() {
    console.log('Loading loan application test cases...');
    const files = fs.readdirSync(CONFIG.samplesDir)
        .filter(f => f.startsWith('loan_app_') && f.endsWith('.json'))
        .sort();
    
    const loanApps = [];
    files.forEach(file => {
        const filePath = path.join(CONFIG.samplesDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const loanData = JSON.parse(content);
        loanApps.push({ file, data: loanData });
    });
    
    console.log(`✓ Loaded ${loanApps.length} loan applications`);
    return loanApps;
}

/**
 * Normalize field values for comparison
 */
function normalizeValue(value) {
    if (value === null || value === undefined) return '';
    return String(value).trim().toLowerCase();
}

/**
 * Normalize and sort pipe-delimited lists
 */
function normalizePipeList(value) {
    if (!value) return [];
    return value.split('|')
        .map(v => v.trim())
        .filter(v => v.length > 0)
        .sort();
}

/**
 * Compare two values with normalization
 */
function compareValues(actual, expected, fieldName) {
    const normalizedActual = normalizeValue(actual);
    const normalizedExpected = normalizeValue(expected);
    
    // Handle numeric comparisons
    if (fieldName === 'miRateBps') {
        if (!normalizedExpected) return { match: true, type: 'empty' };
        const actualNum = parseFloat(normalizedActual);
        const expectedNum = parseFloat(normalizedExpected);
        if (isNaN(actualNum) && isNaN(expectedNum)) return { match: true, type: 'both-empty' };
        if (isNaN(actualNum) || isNaN(expectedNum)) return { match: false, type: 'numeric-mismatch' };
        return { match: actualNum === expectedNum, type: 'numeric' };
    }
    
    // Handle pipe-delimited lists (flags, docs)
    if (fieldName === 'flags' || fieldName === 'requiredDocs') {
        const actualList = normalizePipeList(actual);
        const expectedList = normalizePipeList(expected);
        
        if (actualList.length === 0 && expectedList.length === 0) {
            return { match: true, type: 'both-empty' };
        }
        
        const exactMatch = JSON.stringify(actualList) === JSON.stringify(expectedList);
        if (exactMatch) {
            return { match: true, type: 'exact' };
        }
        
        // Check semantic match (same items, different order)
        const semanticMatch = actualList.length === expectedList.length &&
            actualList.every(item => expectedList.includes(item));
        
        return {
            match: semanticMatch,
            type: semanticMatch ? 'semantic' : 'mismatch',
            actualList,
            expectedList
        };
    }
    
    // String comparison
    return {
        match: normalizedActual === normalizedExpected,
        type: 'string'
    };
}

/**
 * Execute decision for a single loan application
 */
function executeDecision(loanData, simulator) {
    const startTime = Date.now();
    const decision = simulator.simulate(loanData);
    const executionTime = Date.now() - startTime;
    
    return {
        decision,
        executionTime
    };
}

/**
 * Compare actual vs expected decision
 */
function compareDecision(actual, expected, fileName) {
    const comparison = {
        file: fileName,
        match: true,
        fields: {}
    };
    
    // Compare eligibility result
    const eligibilityComp = compareValues(actual.eligibility.result, expected.eligibilityResult, 'eligibilityResult');
    comparison.fields.eligibilityResult = {
        actual: actual.eligibility.result,
        expected: expected.eligibilityResult,
        match: eligibilityComp.match,
        type: eligibilityComp.type
    };
    if (!eligibilityComp.match) comparison.match = false;
    
    // Compare reason
    const reasonComp = compareValues(actual.eligibility.reason, expected.reason, 'reason');
    comparison.fields.reason = {
        actual: actual.eligibility.reason,
        expected: expected.reason,
        match: reasonComp.match,
        type: reasonComp.type
    };
    if (!reasonComp.match) comparison.match = false;
    
    // Compare MI rate
    const miRateComp = compareValues(actual.pricing.miRateBps, expected.miRateBps, 'miRateBps');
    comparison.fields.miRateBps = {
        actual: actual.pricing.miRateBps,
        expected: expected.miRateBps,
        match: miRateComp.match,
        type: miRateComp.type
    };
    if (!miRateComp.match) comparison.match = false;
    
    // Compare flags
    const actualFlags = actual.eligibility.flags.join('|');
    const flagsComp = compareValues(actualFlags, expected.flags, 'flags');
    comparison.fields.flags = {
        actual: actualFlags,
        expected: expected.flags,
        match: flagsComp.match,
        type: flagsComp.type,
        actualList: flagsComp.actualList,
        expectedList: flagsComp.expectedList
    };
    if (!flagsComp.match) comparison.match = false;
    
    // Compare required docs
    const actualDocs = actual.documentation.requiredDocs.join('|');
    const docsComp = compareValues(actualDocs, expected.requiredDocs, 'requiredDocs');
    comparison.fields.requiredDocs = {
        actual: actualDocs,
        expected: expected.requiredDocs,
        match: docsComp.match,
        type: docsComp.type,
        actualList: docsComp.actualList,
        expectedList: docsComp.expectedList
    };
    if (!docsComp.match) comparison.match = false;
    
    return comparison;
}

/**
 * Generate detailed parity report
 */
function generateParityReport(results) {
    const totalTests = results.length;
    const matches = results.filter(r => r.comparison.match).length;
    const mismatches = results.filter(r => !r.comparison.match);
    const overallParity = (matches / totalTests * 100).toFixed(2);
    
    // Calculate per-field match rates
    const fieldStats = {
        eligibilityResult: { matches: 0, total: totalTests },
        reason: { matches: 0, total: totalTests },
        miRateBps: { matches: 0, total: totalTests },
        flags: { matches: 0, total: totalTests },
        requiredDocs: { matches: 0, total: totalTests }
    };
    
    results.forEach(result => {
        Object.keys(fieldStats).forEach(field => {
            if (result.comparison.fields[field].match) {
                fieldStats[field].matches++;
            }
        });
    });
    
    // Calculate average execution time
    const avgExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0) / totalTests;
    
    const report = {
        summary: {
            totalTests,
            matches,
            mismatches: mismatches.length,
            overallParityPercentage: parseFloat(overallParity),
            averageExecutionTimeMs: Math.round(avgExecutionTime * 100) / 100
        },
        fieldMatchRates: {},
        mismatchedCases: [],
        allResults: results
    };
    
    // Add field match rates
    Object.keys(fieldStats).forEach(field => {
        const stats = fieldStats[field];
        report.fieldMatchRates[field] = {
            matches: stats.matches,
            total: stats.total,
            percentage: (stats.matches / stats.total * 100).toFixed(2)
        };
    });
    
    // Add mismatched cases with details
    mismatches.forEach(result => {
        const mismatch = {
            file: result.file,
            mismatchedFields: []
        };
        
        Object.keys(result.comparison.fields).forEach(field => {
            const fieldData = result.comparison.fields[field];
            if (!fieldData.match) {
                mismatch.mismatchedFields.push({
                    field,
                    actual: fieldData.actual,
                    expected: fieldData.expected,
                    type: fieldData.type
                });
            }
        });
        
        report.mismatchedCases.push(mismatch);
    });
    
    return report;
}

/**
 * Generate CSV summary
 */
function generateCSVSummary(results) {
    const lines = ['file,match,eligibility_match,reason_match,miRate_match,flags_match,docs_match,execution_time_ms'];
    
    results.forEach(result => {
        const fields = result.comparison.fields;
        const line = [
            result.file,
            result.comparison.match ? 'PASS' : 'FAIL',
            fields.eligibilityResult.match ? 'Y' : 'N',
            fields.reason.match ? 'Y' : 'N',
            fields.miRateBps.match ? 'Y' : 'N',
            fields.flags.match ? 'Y' : 'N',
            fields.requiredDocs.match ? 'Y' : 'N',
            result.executionTime.toFixed(2)
        ].join(',');
        lines.push(line);
    });
    
    return lines.join('\n');
}

/**
 * Print console summary
 */
function printConsoleSummary(report) {
    console.log('\n' + '='.repeat(80));
    console.log('PARITY VALIDATION RESULTS');
    console.log('='.repeat(80));
    console.log(`\nTotal Test Cases: ${report.summary.totalTests}`);
    console.log(`Matches: ${report.summary.matches}`);
    console.log(`Mismatches: ${report.summary.mismatches}`);
    console.log(`Overall Parity: ${report.summary.overallParityPercentage}%`);
    console.log(`Average Execution Time: ${report.summary.averageExecutionTimeMs}ms`);
    
    console.log('\n' + '-'.repeat(80));
    console.log('PER-FIELD MATCH RATES');
    console.log('-'.repeat(80));
    Object.keys(report.fieldMatchRates).forEach(field => {
        const stats = report.fieldMatchRates[field];
        console.log(`${field.padEnd(20)}: ${stats.matches}/${stats.total} (${stats.percentage}%)`);
    });
    
    if (report.mismatchedCases.length > 0) {
        console.log('\n' + '-'.repeat(80));
        console.log('MISMATCHED CASES');
        console.log('-'.repeat(80));
        report.mismatchedCases.forEach((mismatch, index) => {
            console.log(`\n${index + 1}. ${mismatch.file}`);
            mismatch.mismatchedFields.forEach(field => {
                console.log(`   ${field.field}:`);
                console.log(`     Expected: ${field.expected || '(empty)'}`);
                console.log(`     Actual:   ${field.actual || '(empty)'}`);
            });
        });
    }
    
    console.log('\n' + '='.repeat(80));
}

/**
 * Main execution
 */
async function main() {
    console.log('Starting Parity Validation Test Harness...\n');
    
    try {
        // Ensure output directory exists
        if (!fs.existsSync(CONFIG.outputDir)) {
            fs.mkdirSync(CONFIG.outputDir, { recursive: true });
        }
        
        // Load expected decisions and test cases
        const expectedDecisions = loadExpectedDecisions();
        const loanApplications = loadLoanApplications();
        
        // Initialize simulator
        console.log('\nInitializing DecisionSimulator...');
        const simulator = new DecisionSimulator();
        console.log('✓ DecisionSimulator initialized');
        
        // Execute decisions for all test cases
        console.log('\nExecuting decisions for all test cases...');
        const results = [];
        
        loanApplications.forEach((loanApp, index) => {
            process.stdout.write(`\rProcessing: ${index + 1}/${loanApplications.length} (${loanApp.file})`);
            
            const { decision, executionTime } = executeDecision(loanApp.data, simulator);
            const expected = expectedDecisions[loanApp.file];
            
            if (!expected) {
                console.warn(`\nWarning: No expected decision found for ${loanApp.file}`);
                return;
            }
            
            const comparison = compareDecision(decision, expected, loanApp.file);
            
            results.push({
                file: loanApp.file,
                decision,
                expected,
                comparison,
                executionTime
            });
        });
        
        console.log('\n✓ All decisions executed');
        
        // Generate reports
        console.log('\nGenerating parity reports...');
        const report = generateParityReport(results);
        const csvSummary = generateCSVSummary(results);
        
        // Write JSON report
        fs.writeFileSync(CONFIG.resultsJsonPath, JSON.stringify(report, null, 2));
        console.log(`✓ JSON report written to: ${CONFIG.resultsJsonPath}`);
        
        // Write CSV summary
        fs.writeFileSync(CONFIG.summaryCsvPath, csvSummary);
        console.log(`✓ CSV summary written to: ${CONFIG.summaryCsvPath}`);
        
        // Print console summary
        printConsoleSummary(report);
        
        // Exit with appropriate code
        process.exit(report.summary.mismatches > 0 ? 1 : 0);
        
    } catch (error) {
        console.error('\n❌ Error during parity validation:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run main function
main();

// Made with Bob
