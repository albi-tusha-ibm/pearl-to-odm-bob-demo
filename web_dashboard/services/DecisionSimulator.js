/**
 * DecisionSimulator Service
 * Simulates ODM decision engine behavior by executing rule logic in JavaScript
 * Implements the same rule execution order as the legacy PERL system
 */

export class DecisionSimulator {
    constructor() {
        this.rulesFired = [];
    }

    /**
     * Simulate a decision for a loan application
     * @param {Object} loanData - Loan application data
     * @returns {Object} Decision result with eligibility, pricing, documentation, and trace
     */
    simulate(loanData) {
        const startTime = performance.now();
        
        // Initialize decision object
        const decision = {
            loanId: loanData.loanId || 'unknown',
            eligibility: {
                result: null,
                reason: null,
                flags: []
            },
            pricing: {
                miRateBps: null
            },
            documentation: {
                requiredDocs: []
            },
            rulesFired: [],
            executionTime: 0
        };

        this.rulesFired = [];

        try {
            // Execute rules in priority order (highest to lowest)
            
            // 1. Exception Rules (Priority 1000)
            this.executeExceptionRules(loanData, decision);
            if (decision.eligibility.result === 'decline') {
                decision.executionTime = performance.now() - startTime;
                decision.rulesFired = this.rulesFired;
                return decision;
            }

            // 2. Eligibility Rules (Priority 100-50)
            this.executeEligibilityRules(loanData, decision);
            if (decision.eligibility.result === 'decline') {
                decision.executionTime = performance.now() - startTime;
                decision.rulesFired = this.rulesFired;
                return decision;
            }

            // 3. If no decline, set to approve
            if (!decision.eligibility.result) {
                decision.eligibility.result = 'approve';
                decision.eligibility.reason = 'All eligibility criteria met';
            }

            // 4. Pricing Rules (only if approved)
            if (decision.eligibility.result === 'approve') {
                this.executePricingRules(loanData, decision);
            }

            // 5. Documentation Rules
            this.executeDocumentationRules(loanData, decision);

        } catch (error) {
            console.error('Error during simulation:', error);
            decision.eligibility.result = 'error';
            decision.eligibility.reason = `Simulation error: ${error.message}`;
        }

        decision.executionTime = performance.now() - startTime;
        decision.rulesFired = this.rulesFired;
        return decision;
    }

    /**
     * Execute exception rules (Priority 1000)
     */
    executeExceptionRules(loanData, decision) {
        const borrower = loanData.borrower || {};
        const loan = loanData.loan || {};

        // EXC-001: Bankruptcy Exception
        if (borrower.bankruptcyFlag === true) {
            this.fireRule('EXC-001', 'Bankruptcy Exception Rule', 1000);
            decision.eligibility.result = 'decline';
            decision.eligibility.reason = 'Recent bankruptcy within 7 years';
            decision.eligibility.flags.push('HIGH_RISK');
            return;
        }

        // EXC-002: Foreclosure Exception
        if (borrower.foreclosureFlag === true) {
            this.fireRule('EXC-002', 'Foreclosure Exception Rule', 1000);
            decision.eligibility.result = 'decline';
            decision.eligibility.reason = 'Recent foreclosure within 7 years';
            decision.eligibility.flags.push('HIGH_RISK');
            return;
        }

        // EXC-003: Fraud Flag Exception
        if (borrower.fraudFlag === true) {
            this.fireRule('EXC-003', 'Fraud Flag Exception Rule', 1000);
            decision.eligibility.result = 'decline';
            decision.eligibility.reason = 'Fraud indicator detected';
            decision.eligibility.flags.push('FRAUD_SUSPECTED');
            return;
        }

        // EXC-004: Manual Review Flag
        if (loan.manualReviewRequired === true) {
            this.fireRule('EXC-004', 'Manual Review Flag Rule', 1000);
            decision.eligibility.flags.push('MANUAL_REVIEW');
        }
    }

    /**
     * Execute eligibility rules (Priority 100-50)
     */
    executeEligibilityRules(loanData, decision) {
        const borrower = loanData.borrower || {};
        const loan = loanData.loan || {};
        const property = loanData.property || {};

        // ELG-001: Credit Score Minimum (Priority 100)
        if (borrower.creditScore < 620) {
            this.fireRule('ELG-001', 'Credit Score Minimum', 100);
            decision.eligibility.result = 'decline';
            decision.eligibility.reason = 'Credit score below minimum threshold';
            decision.eligibility.flags.push('CREDIT_DECLINE');
            return;
        }

        // ELG-002: Maximum LTV (Priority 99)
        if (loan.ltv > 97) {
            this.fireRule('ELG-002', 'Maximum LTV', 99);
            decision.eligibility.result = 'decline';
            decision.eligibility.reason = 'LTV exceeds maximum allowable 97%';
            decision.eligibility.flags.push('LTV_DECLINE');
            return;
        }

        // ELG-003: Maximum DTI (Priority 98)
        if (loan.dti > 50) {
            this.fireRule('ELG-003', 'Maximum DTI', 98);
            decision.eligibility.result = 'decline';
            decision.eligibility.reason = 'DTI exceeds maximum 50%';
            decision.eligibility.flags.push('DTI_DECLINE');
            return;
        }

        // ELG-004: Investment Property LTV (Priority 95)
        if (loan.occupancy === 'investment' && loan.ltv > 85) {
            this.fireRule('ELG-004', 'Investment Property LTV', 95);
            decision.eligibility.result = 'decline';
            decision.eligibility.reason = 'Investment property LTV exceeds 85%';
            decision.eligibility.flags.push('INVESTMENT_LTV_DECLINE');
            return;
        }

        // ELG-005: 2-4 Unit Property LTV (Priority 90)
        if (property.type === '2to4' && loan.ltv > 80) {
            this.fireRule('ELG-005', '2-4 Unit Property LTV', 90);
            decision.eligibility.result = 'decline';
            decision.eligibility.reason = '2-4 unit property LTV exceeds 80%';
            decision.eligibility.flags.push('MULTI_UNIT_LTV_DECLINE');
            return;
        }

        // ELG-006: ARM Product LTV Cap (Priority 85)
        if (loan.productType === 'arm' && loan.ltv > 95) {
            this.fireRule('ELG-006', 'ARM Product LTV Cap', 85);
            decision.eligibility.result = 'decline';
            decision.eligibility.reason = 'ARM product LTV exceeds 95%';
            decision.eligibility.flags.push('ARM_LTV_DECLINE');
            return;
        }

        // ELG-007: Condo LTV Cap (Priority 80)
        if (property.type === 'condo' && loan.ltv > 95) {
            this.fireRule('ELG-007', 'Condo LTV Cap', 80);
            decision.eligibility.result = 'decline';
            decision.eligibility.reason = 'Condo LTV exceeds 95%';
            decision.eligibility.flags.push('CONDO_LTV_DECLINE');
            return;
        }

        // ELG-008: Cash-Out Refinance LTV (Priority 75)
        if (loan.purpose === 'cashout' && loan.ltv > 80) {
            this.fireRule('ELG-008', 'Cash-Out Refinance LTV', 75);
            decision.eligibility.result = 'decline';
            decision.eligibility.reason = 'Cash-out refinance LTV exceeds 80%';
            decision.eligibility.flags.push('CASHOUT_LTV_DECLINE');
            return;
        }

        // ELG-009: Second Home LTV (Priority 70)
        if (loan.occupancy === 'second' && loan.ltv > 90) {
            this.fireRule('ELG-009', 'Second Home LTV', 70);
            decision.eligibility.result = 'decline';
            decision.eligibility.reason = 'Second home LTV exceeds 90%';
            decision.eligibility.flags.push('SECOND_HOME_LTV_DECLINE');
            return;
        }

        // ELG-010: High Balance Loan LTV (Priority 65)
        if (loan.loanAmount > 647200 && loan.ltv > 95) {
            this.fireRule('ELG-010', 'High Balance Loan LTV', 65);
            decision.eligibility.result = 'decline';
            decision.eligibility.reason = 'High balance loan LTV exceeds 95%';
            decision.eligibility.flags.push('HIGH_BALANCE_LTV_DECLINE');
            return;
        }

        // ELG-011: Manufactured Home LTV (Priority 60)
        if (property.type === 'manufactured' && loan.ltv > 90) {
            this.fireRule('ELG-011', 'Manufactured Home LTV', 60);
            decision.eligibility.result = 'decline';
            decision.eligibility.reason = 'Manufactured home LTV exceeds 90%';
            decision.eligibility.flags.push('MANUFACTURED_LTV_DECLINE');
            return;
        }

        // ELG-012: Non-Occupant Co-Borrower (Priority 55)
        if (borrower.nonOccupantCoBorrower === true && loan.ltv > 95) {
            this.fireRule('ELG-012', 'Non-Occupant Co-Borrower', 55);
            decision.eligibility.result = 'decline';
            decision.eligibility.reason = 'Non-occupant co-borrower with LTV > 95%';
            decision.eligibility.flags.push('NON_OCCUPANT_DECLINE');
            return;
        }

        // ELG-013: Duplicate of ELG-002 (skipped in ODM migration)

        // ELG-014: Low Credit Score with High LTV (Priority 52)
        if (borrower.creditScore < 680 && loan.ltv > 95) {
            this.fireRule('ELG-014', 'Low Credit Score with High LTV', 52);
            decision.eligibility.result = 'decline';
            decision.eligibility.reason = 'Credit score below 680 with LTV > 95%';
            decision.eligibility.flags.push('CREDIT_LTV_DECLINE');
            return;
        }

        // ELG-015: High DTI with High LTV (Priority 51)
        if (loan.dti > 45 && loan.ltv > 95) {
            this.fireRule('ELG-015', 'High DTI with High LTV', 51);
            decision.eligibility.result = 'decline';
            decision.eligibility.reason = 'DTI > 45% with LTV > 95%';
            decision.eligibility.flags.push('DTI_LTV_DECLINE');
            return;
        }
    }

    /**
     * Execute pricing rules (Priority 100)
     */
    executePricingRules(loanData, decision) {
        const borrower = loanData.borrower || {};
        const loan = loanData.loan || {};
        const property = loanData.property || {};

        // Base rate calculation using simplified pricing matrix
        let miRate = 0;

        // Determine base rate by LTV and credit score
        if (loan.ltv <= 80) {
            miRate = borrower.creditScore >= 740 ? 25 : 35;
        } else if (loan.ltv <= 85) {
            miRate = borrower.creditScore >= 740 ? 45 : 60;
        } else if (loan.ltv <= 90) {
            miRate = borrower.creditScore >= 740 ? 70 : 90;
        } else if (loan.ltv <= 95) {
            miRate = borrower.creditScore >= 740 ? 95 : 120;
        } else {
            miRate = borrower.creditScore >= 740 ? 120 : 150;
        }

        this.fireRule('PRICE-BASE', 'Base MI Rate Calculation', 100);

        // Adjustments
        
        // PRICE-001: Investment property adjustment
        if (loan.occupancy === 'investment') {
            miRate += 50;
            this.fireRule('PRICE-001', 'Investment Property Adjustment', 95);
        }

        // PRICE-002: ARM product adjustment
        if (loan.productType === 'arm') {
            miRate += 15;
            this.fireRule('PRICE-002', 'ARM Product Adjustment', 90);
        }

        // PRICE-003: Condo adjustment
        if (property.type === 'condo') {
            miRate += 10;
            this.fireRule('PRICE-003', 'Condo Adjustment', 85);
        }

        // PRICE-004: Cash-out refinance adjustment
        if (loan.purpose === 'cashout') {
            miRate += 25;
            this.fireRule('PRICE-004', 'Cash-Out Refinance Adjustment', 80);
        }

        // PRICE-005: First-time homebuyer discount
        if (borrower.firstTimeHomebuyer === true && loan.ltv <= 95) {
            miRate -= 10;
            this.fireRule('PRICE-005', 'First-Time Homebuyer Discount', 75);
        }

        // PRICE-006: High balance loan adjustment
        if (loan.loanAmount > 647200) {
            miRate += 20;
            this.fireRule('PRICE-006', 'High Balance Loan Adjustment', 70);
        }

        // PRICE-007: Manufactured home adjustment
        if (property.type === 'manufactured') {
            miRate += 30;
            this.fireRule('PRICE-007', 'Manufactured Home Adjustment', 65);
        }

        decision.pricing.miRateBps = Math.max(miRate, 0); // Ensure non-negative
    }

    /**
     * Execute documentation rules
     */
    executeDocumentationRules(loanData, decision) {
        const borrower = loanData.borrower || {};
        const loan = loanData.loan || {};
        const property = loanData.property || {};
        const aus = loanData.aus || {};

        const docs = [];

        // DOC-001: Standard documentation
        docs.push('Credit Report', 'Income Verification', 'Asset Verification');
        this.fireRule('DOC-001', 'Standard Documentation', 50);

        // DOC-002: Appraisal required for all loans
        docs.push('Property Appraisal');
        this.fireRule('DOC-002', 'Property Appraisal', 49);

        // DOC-003: Self-employed borrower
        if (borrower.selfEmployed === true) {
            docs.push('2 Years Tax Returns', 'Profit & Loss Statement');
            this.fireRule('DOC-003', 'Self-Employed Documentation', 48);
        }

        // DOC-004: High LTV documentation
        if (loan.ltv > 90) {
            docs.push('Mortgage Insurance Certificate');
            this.fireRule('DOC-004', 'High LTV Documentation', 47);
        }

        // DOC-005: Investment property
        if (loan.occupancy === 'investment') {
            docs.push('Rental Income Documentation', 'Property Management Agreement');
            this.fireRule('DOC-005', 'Investment Property Documentation', 46);
        }

        // DOC-006: Condo documentation
        if (property.type === 'condo') {
            docs.push('Condo Questionnaire', 'HOA Documents');
            this.fireRule('DOC-006', 'Condo Documentation', 45);
        }

        // DOC-007: Manual underwriting
        if (aus.finding === 'manual' || aus.finding === 'refer') {
            docs.push('Full Underwriting Package', 'Explanation Letters');
            this.fireRule('DOC-007', 'Manual Underwriting Documentation', 44);
        }

        decision.documentation.requiredDocs = [...new Set(docs)]; // Remove duplicates
    }

    /**
     * Record a rule firing
     */
    fireRule(ruleId, ruleName, priority) {
        this.rulesFired.push({
            ruleId,
            ruleName,
            priority,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Batch simulate multiple loan applications
     * @param {Array} loanDataArray - Array of loan application data
     * @returns {Array} Array of decision results
     */
    batchSimulate(loanDataArray) {
        return loanDataArray.map(loanData => this.simulate(loanData));
    }
}

export default DecisionSimulator;

// Made with Bob