# ODM Governance and Release Management

## Overview

This document defines the governance framework, change management processes, and release procedures for the MI_Underwriting ODM decision service. It establishes roles, responsibilities, and workflows to ensure rule changes are properly reviewed, tested, and deployed while maintaining regulatory compliance and operational stability.

---

## Roles & Responsibilities

### Rule Author (Underwriting Team)

**Primary Responsibility**: Create and modify business rules in ODM Rule Designer

**Key Activities**:
- Author new rules or modify existing rules based on business requirements
- Document business justification for all changes
- Create test cases to validate rule behavior
- Run regression test suite before submitting for review
- Update rule descriptions and inline comments

**Required Skills**:
- Understanding of underwriting business logic
- Proficiency in ODM Rule Designer
- Basic understanding of BOM/XOM concepts

**Access Level**:
- Read/Write access to DEV Rule Designer
- Read-only access to UAT and PROD

**Tools**:
- IBM Rule Designer
- Decision Center (DEV environment)
- Test data repository

---

### Rule Reviewer (Senior Underwriter)

**Primary Responsibility**: Validate business logic accuracy and completeness

**Key Activities**:
- Review rule changes for business logic correctness
- Verify alignment with underwriting guidelines
- Validate test coverage and expected outcomes
- Approve or reject rule changes with detailed feedback
- Escalate complex changes to Underwriting Leadership

**Required Skills**:
- Deep underwriting domain expertise
- Understanding of risk assessment principles
- Ability to read and interpret ODM rules

**Access Level**:
- Read access to all environments
- Approval authority in Decision Center

**Review Criteria**:
- ✅ Business logic is correct and complete
- ✅ Rule aligns with underwriting guidelines
- ✅ Test cases cover all scenarios
- ✅ Documentation is clear and accurate
- ✅ No unintended side effects

---

### Compliance Approver (Risk & Compliance Team)

**Primary Responsibility**: Ensure regulatory alignment and audit readiness

**Key Activities**:
- Review rule changes for regulatory compliance
- Validate adherence to fair lending practices
- Ensure proper documentation for audit trail
- Approve or reject changes with compliance rationale
- Maintain compliance documentation repository

**Required Skills**:
- Knowledge of mortgage insurance regulations
- Understanding of fair lending laws (ECOA, FHA, etc.)
- Familiarity with audit requirements

**Access Level**:
- Read access to all environments
- Approval authority in Decision Center
- Access to decision execution logs

**Review Criteria**:
- ✅ Complies with federal and state regulations
- ✅ No discriminatory impact (fair lending)
- ✅ Proper audit trail maintained
- ✅ Documentation sufficient for regulatory review
- ✅ Risk assessment appropriate

---

### Release Manager (IT Operations)

**Primary Responsibility**: Deploy rulesets to RES and manage environments

**Key Activities**:
- Deploy approved rulesets to UAT and PROD
- Manage environment configurations
- Monitor deployment health and performance
- Execute rollback procedures if needed
- Maintain deployment documentation

**Required Skills**:
- IBM ODM administration
- Rule Execution Server (RES) management
- CI/CD pipeline configuration
- Incident response procedures

**Access Level**:
- Full administrative access to all environments
- Deployment authority for UAT and PROD
- Access to monitoring and logging systems

**Deployment Checklist**:
- ✅ All approvals obtained (Author, Reviewer, Compliance)
- ✅ Regression tests passed (≥95% parity)
- ✅ Performance tests passed (<100ms p95 latency)
- ✅ Rollback plan documented
- ✅ Stakeholders notified of deployment window
- ✅ Monitoring alerts configured

---

## Versioning Strategy

### Semantic Versioning

ODM rulesets follow semantic versioning: **MAJOR.MINOR.PATCH**

#### MAJOR Version (X.0.0)

**When to Increment**:
- Breaking changes to decision logic
- Changes to input/output API schema
- Removal of rules or decision outcomes
- Changes that require downstream system updates

**Examples**:
- Adding new required input field
- Removing a decision outcome (e.g., eliminating "REFER")
- Changing eligibility criteria that affect >10% of decisions

**Approval Required**: Executive Leadership + Compliance

---

#### MINOR Version (1.X.0)

**When to Increment**:
- New rules or decision logic added
- Non-breaking enhancements to existing rules
- New optional input fields
- Performance improvements

**Examples**:
- Adding new pricing tier
- Adding new documentation requirement
- Enhancing exception handling logic

**Approval Required**: Underwriting Leadership + Compliance

---

#### PATCH Version (1.0.X)

**When to Increment**:
- Bug fixes
- Rule clarifications (no logic change)
- Documentation updates
- Performance optimizations (no logic change)

**Examples**:
- Fixing typo in rule description
- Correcting edge case handling
- Optimizing decision table structure

**Approval Required**: Senior Underwriter + Compliance

---

### Version Naming Convention

**Format**: `MAJOR.MINOR.PATCH-YYYYMMDD`

**Examples**:
- `1.0.0-20260302`: Initial production release
- `1.0.1-20260315`: Bug fix for LTV calculation
- `1.1.0-20260401`: New pricing tier added
- `2.0.0-20260701`: API schema change (breaking)

**Rationale**:
- Semantic version indicates change impact
- Date stamp provides chronological reference
- Easy to identify latest version

---

## Change Management Process

### Process Flow

```
┌─────────────────────────────────────────────────┐
│  1. Author Creates Change in DEV                │
│     - Modify rules in Rule Designer             │
│     - Document business justification           │
│     - Create/update test cases                  │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  2. Author Runs Regression Tests                │
│     - Execute 60 baseline test cases            │
│     - Verify ≥95% parity                        │
│     - Document any deviations                   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  3. Reviewer Validates Business Logic           │
│     - Review rule changes                       │
│     - Validate test coverage                    │
│     - Approve or request changes                │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  4. Compliance Reviews Regulatory Impact        │
│     - Assess regulatory compliance              │
│     - Validate fair lending alignment           │
│     - Approve or request changes                │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  5. Release Manager Deploys to UAT              │
│     - Export RuleApp from DEV                   │
│     - Deploy to UAT RES                         │
│     - Verify deployment health                  │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  6. Business Users Perform UAT Testing          │
│     - Execute business test scenarios           │
│     - Validate decision outcomes                │
│     - Sign off on UAT results                   │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│  7. Release Manager Deploys to PROD             │
│     - Schedule deployment window                │
│     - Deploy to PROD RES                        │
│     - Monitor for 24 hours                      │
│     - Execute rollback if needed                │
└─────────────────────────────────────────────────┘
```

---

### Change Request Template

All rule changes must include the following information:

```markdown
## Change Request: [Brief Description]

**Request ID**: CR-YYYY-NNNN  
**Requested By**: [Name, Role]  
**Date**: YYYY-MM-DD  
**Priority**: [Critical / High / Medium / Low]  
**Target Version**: X.Y.Z

### Business Justification
[Explain why this change is needed]

### Affected Rules
- [List of rule IDs and names]

### Change Description
[Detailed description of what is changing]

### Expected Impact
- **Decision Changes**: [Estimated % of decisions affected]
- **Performance Impact**: [Expected latency/throughput change]
- **Downstream Systems**: [Any systems that need updates]

### Test Plan
- [List of test scenarios]
- [Expected outcomes]

### Rollback Plan
[How to revert if issues arise]

### Approvals
- [ ] Rule Author: [Name, Date]
- [ ] Rule Reviewer: [Name, Date]
- [ ] Compliance Approver: [Name, Date]
- [ ] Release Manager: [Name, Date]
```

---

## Test Suites

### Regression Test Suite

**Purpose**: Validate that changes don't break existing functionality

**Test Cases**: 60 baseline loan applications (from legacy ground truth)

**Coverage**:
- 18 DECLINE cases (30%)
- 22 REFER cases (37%)
- 20 APPROVE cases (33%)

**Execution**:
- Automated via Python script: `validate_parity.py`
- Run before every deployment
- Results logged in Decision Center

**Acceptance Criteria**:
- ≥95% parity with expected outcomes
- All exception flags match expected
- No unintended declines or approvals

**Execution Time**: ~5 minutes (60 cases × 5 seconds each)

---

### Performance Test Suite

**Purpose**: Ensure decision execution meets latency and throughput targets

**Test Scenarios**:
- Single decision execution (latency test)
- Concurrent decision execution (throughput test)
- Sustained load test (stability test)

**Targets**:
- **Latency**: <100ms p95
- **Throughput**: >500 decisions/second per RES instance
- **Stability**: No degradation over 1-hour sustained load

**Execution**:
- Automated via JMeter or Gatling
- Run before UAT deployment
- Results logged in performance dashboard

**Acceptance Criteria**:
- All targets met
- No memory leaks detected
- No error rate increase

---

### UAT Test Suite

**Purpose**: Business user validation of rule changes

**Test Scenarios**:
- Happy path scenarios (typical loan applications)
- Edge cases (boundary conditions)
- Error scenarios (invalid input)

**Execution**:
- Manual testing by business users
- Test cases documented in UAT test plan
- Results recorded in UAT sign-off document

**Acceptance Criteria**:
- All test scenarios pass
- Business users sign off on results
- No critical issues identified

---

## Promotion Flow

### Environment Strategy

```
┌─────────────────────────────────────────────────┐
│  DEV (Development)                              │
│  - Rule authoring and testing                   │
│  - Frequent changes                             │
│  - No SLA                                       │
│  URL: http://res-dev.example.com:9080/res         │
└─────────────────┬───────────────────────────────┘
                  │
                  │ (After regression tests pass)
                  ▼
┌─────────────────────────────────────────────────┐
│  UAT (User Acceptance Testing)                  │
│  - Business user validation                     │
│  - Stable environment                           │
│  - 99% uptime SLA                               │
│  URL: http://res-uat.example.com:9080/res         │
└─────────────────┬───────────────────────────────┘
                  │
                  │ (After UAT sign-off)
                  ▼
┌─────────────────────────────────────────────────┐
│  PROD (Production)                              │
│  - Live decision execution                      │
│  - High availability (3+ instances)             │
│  - 99.9% uptime SLA                             │
│  URL: http://res-prod.example.com:9080/res        │
└─────────────────────────────────────────────────┘
```

### Promotion Criteria

#### DEV → UAT

**Prerequisites**:
- ✅ Regression tests passed (≥95% parity)
- ✅ Performance tests passed
- ✅ Rule Reviewer approval
- ✅ Compliance approval
- ✅ Change documentation complete

**Process**:
1. Export RuleApp from DEV Rule Designer
2. Upload to Decision Center UAT
3. Deploy to UAT RES
4. Verify deployment health
5. Notify business users for UAT testing

**Rollback**: Redeploy previous UAT version

---

#### UAT → PROD

**Prerequisites**:
- ✅ UAT testing complete
- ✅ Business user sign-off
- ✅ No critical issues identified
- ✅ Deployment window scheduled
- ✅ Rollback plan documented

**Process**:
1. Schedule deployment window (off-peak hours)
2. Notify stakeholders of deployment
3. Export RuleApp from UAT
4. Deploy to PROD RES (blue-green deployment)
5. Smoke test PROD deployment
6. Monitor for 24 hours
7. Decommission old version after 30 days

**Rollback**: Redeploy previous PROD version (see Rollback Procedure)

---

### Deployment Windows

**Standard Deployment Windows**:
- **Tuesday/Thursday**: 10:00 PM - 12:00 AM CT (off-peak)
- **Emergency Deployments**: Any time (with executive approval)

**Blackout Periods** (No deployments):
- Month-end (last 3 business days)
- Quarter-end (last 5 business days)
- Major holidays
- Peak underwriting season (March-June)

---

## Auditability

### Decision Center Audit Trail

**Captured Information**:
- Rule change author and timestamp
- Business justification for change
- Approval chain (Reviewer, Compliance)
- Version history (before/after comparison)
- Deployment history (who, when, where)

**Retention**: 7 years (regulatory requirement)

**Access**: Read-only access for auditors and compliance team

---

### Decision Execution Logs

**Captured Information**:
- Input data (loan application)
- Output data (decision, pricing, documentation)
- Fired rules (execution trace)
- Execution time (performance metrics)
- Ruleset version used
- Timestamp and request ID

**Log Format** (JSON):
```json
{
  "requestId": "req-20260302-123456",
  "timestamp": "2026-03-02T18:30:45.123Z",
  "rulesetVersion": "1.0.0-20260302",
  "input": { ... },
  "output": { ... },
  "firedRules": [
    "ELG-001: LTV Check",
    "PRICE-002: Standard Pricing",
    "DOC-001: Standard Documentation"
  ],
  "executionTimeMs": 87
}
```

**Retention**: 3 years (operational requirement)

**Access**: IT Operations, Compliance, Auditors

---

### Quarterly Audit Reports

**Generated Automatically**:
- Decision outcome distribution (APPROVE/REFER/DECLINE)
- Pricing tier distribution
- Exception flag frequency
- Performance metrics (latency, throughput)
- Rule change summary

**Review Process**:
- Generated first week of each quarter
- Reviewed by Compliance team
- Presented to Risk Committee
- Archived for regulatory review

---

## Rollback Procedure

### When to Rollback

**Triggers**:
- Parity drops below 95% in production
- Critical bug discovered (incorrect decisions)
- Performance degradation >20%
- Regulatory compliance issue identified
- Unacceptable business impact

**Authority**:
- **Technical Issues**: IT Operations Manager
- **Business Logic Issues**: Underwriting Leadership
- **Compliance Issues**: Risk & Compliance Officer

---

### Rollback Steps

#### Immediate Rollback (< 1 hour)

1. **Identify Previous Version**
   - Access Decision Center PROD
   - Identify last known good version (e.g., 1.0.0-20260301)

2. **Redeploy Previous Version**
   - Navigate to RES Console
   - Select previous RuleApp version
   - Click "Activate"
   - Verify activation successful

3. **Verify Rollback**
   - Execute smoke tests (5 sample decisions)
   - Verify expected outcomes
   - Monitor for 15 minutes

4. **Notify Stakeholders**
   - Send rollback notification email
   - Include reason for rollback
   - Provide timeline for resolution

**Rollback Time**: <15 minutes

---

#### Post-Rollback Actions

1. **Root Cause Analysis**
   - Investigate issue that triggered rollback
   - Document findings
   - Identify corrective actions

2. **Fix and Retest**
   - Apply fix in DEV environment
   - Re-run full test suite
   - Obtain new approvals

3. **Redeploy**
   - Follow standard promotion flow
   - Include additional validation steps
   - Monitor closely for 48 hours

---

### Rollback Limitations

**Maximum Rollback Window**: 30 days

**Rationale**:
- Previous versions retained for 30 days
- After 30 days, archived to cold storage
- Restoring from archive requires 24-48 hours

**Mitigation**:
- Maintain comprehensive test coverage
- Perform thorough UAT testing
- Monitor closely after deployment

---

## Documentation Requirements

### Rule Documentation

**Required for All Rules**:
- **Business Description**: Plain-language explanation of rule purpose
- **Conditions**: Clear description of when rule fires
- **Actions**: Clear description of what rule does
- **Examples**: Sample inputs and expected outputs
- **Regulatory Justification**: Why rule is needed (if applicable)

**Example**:
```
Rule: ELG-001 "LTV Threshold Check"

Business Description:
Decline loans with loan-to-value ratio exceeding 97% to manage risk exposure.

Conditions:
- Loan-to-value ratio > 97%

Actions:
- Set eligibility outcome to DECLINE
- Add reason: "LTV exceeds 97% maximum"

Examples:
- LTV = 98% → DECLINE
- LTV = 96% → No action (other rules evaluate)

Regulatory Justification:
Aligns with prudent lending standards and capital reserve requirements.
```

---

### Decision Table Documentation

**Required for All Decision Tables**:
- **Table Purpose**: What decisions does this table make?
- **Column Descriptions**: What does each column represent?
- **Row Priority**: How are rows evaluated (first match, all matches)?
- **Default Behavior**: What happens if no rows match?

**Example**:
```
Table: Pricing Decision Table

Purpose:
Determine premium rate based on loan risk profile (LTV, credit score, occupancy).

Columns:
- LTV Range: Loan-to-value ratio bands
- Credit Score Range: FICO score bands
- Occupancy: Property occupancy type
- Premium Rate: Annual premium rate (decimal)
- Basis Points: Premium in basis points (for display)
- Tier: Pricing tier classification

Row Priority:
First match wins (rows evaluated top to bottom).

Default Behavior:
If no rows match, default to 135 bps (high-risk tier).
```

---

### Change Documentation

**Required for All Changes**:
- Change request form (see template above)
- Business justification
- Test results (regression, performance, UAT)
- Approval signatures
- Deployment notes

**Storage**: Decision Center + SharePoint document library

---

## Continuous Improvement

### Metrics to Track

1. **Rule Change Velocity**
   - Number of rule changes per quarter
   - Average time from request to deployment
   - Percentage of changes requiring rollback

2. **Decision Quality**
   - Parity with expected outcomes
   - Exception rate trends
   - Pricing accuracy

3. **Process Efficiency**
   - Average approval cycle time
   - Test execution time
   - Deployment success rate

### Quarterly Review

**Agenda**:
1. Review metrics and trends
2. Identify process bottlenecks
3. Discuss improvement opportunities
4. Update governance procedures as needed

**Participants**:
- Underwriting Leadership
- Risk & Compliance
- IT Operations
- Business Analysts

---

## Training and Onboarding

### New Rule Author Training

**Duration**: 2 days

**Topics**:
- ODM Rule Designer basics
- BOM/XOM concepts
- Rule authoring best practices
- Testing and validation procedures
- Change management process

**Certification**: Hands-on exercise (create and deploy a simple rule)

---

### New Reviewer Training

**Duration**: 1 day

**Topics**:
- Understanding ODM rules
- Review criteria and checklists
- Decision Center approval workflow
- Escalation procedures

**Certification**: Shadow experienced reviewer for 3 reviews

---

## Contact Information

### Support Contacts

| Role | Contact | Email | Phone |
|------|---------|-------|-------|
| **ODM Support** | IT Helpdesk | odm-support@example.com | x5555 |
| **Rule Authoring Questions** | Business Analysis Team | ba-team@example.com | x5556 |
| **Compliance Questions** | Risk & Compliance | compliance@example.com | x5557 |
| **Deployment Issues** | IT Operations | itops@example.com | x5558 |

### Escalation Path

1. **Level 1**: IT Helpdesk (response time: 1 hour)
2. **Level 2**: ODM Technical Lead (response time: 4 hours)
3. **Level 3**: IT Operations Manager (response time: 8 hours)
4. **Level 4**: CTO (critical issues only)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-03-02 | Initial governance framework | Governance Team |

---

**Document Owner**: Governance & Compliance Team  
**Last Updated**: 2026-03-02  
**Review Cycle**: Quarterly  
**Next Review**: 2026-06-01