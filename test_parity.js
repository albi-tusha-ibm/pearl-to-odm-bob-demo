// Quick test to verify parity improvements
import { DecisionSimulator } from './web_dashboard/services/DecisionSimulator.js';

const simulator = new DecisionSimulator();

// Test case 1: Should decline (credit score too low)
const test1 = {
    loanId: "TEST-001",
    loan: { ltv: 80, dti: 35, loanAmount: 200000, productType: "fixed", occupancy: "primary" },
    borrower: { creditScore: 600, firstTimeHomebuyer: false },
    property: { type: "sfh", state: "TX", estimatedValue: 250000 },
    aus: { finding: "du_approve" }
};

// Test case 2: Should refer (low credit with high LTV)
const test2 = {
    loanId: "TEST-002",
    loan: { ltv: 93, dti: 38, loanAmount: 279000, productType: "fixed", occupancy: "primary" },
    borrower: { creditScore: 625, firstTimeHomebuyer: false },
    property: { type: "sfh", state: "WI", estimatedValue: 300000 },
    aus: { finding: "du_approve" }
};

// Test case 3: Should approve
const test3 = {
    loanId: "TEST-003",
    loan: { ltv: 80, dti: 32, loanAmount: 320000, productType: "fixed", occupancy: "primary" },
    borrower: { creditScore: 760, firstTimeHomebuyer: false },
    property: { type: "sfh", state: "WI", estimatedValue: 400000 },
    aus: { finding: "du_approve" }
};

// Test case 4: Should decline (ARM > 95% LTV)
const test4 = {
    loanId: "TEST-004",
    loan: { ltv: 96, dti: 38, loanAmount: 240000, productType: "arm", occupancy: "primary" },
    borrower: { creditScore: 700, firstTimeHomebuyer: false },
    property: { type: "sfh", state: "TX", estimatedValue: 250000 },
    aus: { finding: "du_approve" }
};

console.log("Test 1 (Decline):", simulator.simulate(test1).eligibility.result);
console.log("Test 2 (Refer):", simulator.simulate(test2).eligibility.result);
console.log("Test 3 (Approve):", simulator.simulate(test3).eligibility.result);
console.log("Test 4 (Decline ARM):", simulator.simulate(test4).eligibility.result);

// Made with Bob
