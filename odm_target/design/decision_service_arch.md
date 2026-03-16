# ODM Decision Service Architecture

## Overview

The **MI_Underwriting** Decision Service implements the modernized mortgage insurance underwriting logic, migrated from the legacy PEARL-DSL rule engine to IBM Operational Decision Manager (ODM).

## Decision Service Structure

### Service Name
`MI_Underwriting`

### Rule Projects

The decision service is organized into four rule projects, each corresponding to a functional domain:

| Rule Project | Purpose | Rule Count | Artifacts |
|--------------|---------|------------|-----------|
| **ExceptionRules** | High-priority exception handling and risk flags | 4 rules | Action rules (EXC-001 to EXC-004) |
| **EligibilityRules** | Loan eligibility determination | 14 rules | Decision table + action rules (ELG-001 to ELG-015, consolidated) |
| **PricingRules** | Premium rate calculation | 7 rules | Decision table (PRICE-001 to PRICE-007) |
| **DocumentationRules** | Required documentation determination | 7 rules | Decision table (DOC-001 to DOC-007) |

### Execution Order (Ruleflow)

The decision service executes rule projects in a specific sequence to mirror legacy behavior:

```
1. ExceptionRules (Priority: 1000)
   ↓
2. EligibilityRules (Priority: 500)
   ↓
3. PricingRules (Priority: 100)
   ↓
4. DocumentationRules (Priority: 50)
```

**Rationale**: 
- **Exceptions first**: High-risk conditions (fraud flags, bankruptcy) must be evaluated before any other logic
- **Eligibility second**: No need to price or document ineligible loans
- **Pricing third**: Premium rates only calculated for eligible loans
- **Documentation last**: Required documents determined based on final decision

### Short-Circuit Behavior

- If **ExceptionRules** sets `eligibilityDecision.outcome = "DECLINE"`, subsequent rule projects are skipped
- If **EligibilityRules** sets `eligibilityDecision.outcome = "DECLINE"`, pricing and documentation are skipped
- If **EligibilityRules** sets `eligibilityDecision.outcome = "REFER"`, pricing is skipped but documentation rules still execute

## Input/Output Schema

### Input (JSON Request)

```json
{
  "loan": {
    "loanAmount": 250000.00,
    "propertyValue": 300000.00,
    "loanPurpose": "PURCHASE",
    "occupancyType": "PRIMARY",
    "loanType": "CONVENTIONAL"
  },
  "borrower": {
    "creditScore": 720,
    "dti": 38.5,
    "bankruptcyFlag": false,
    "foreclosureFlag": false
  },
  "property": {
    "propertyType": "SFR",
    "state": "TX",
    "ruralAreaFlag": false
  }
}
```

### Output (JSON Response)

```json
{
  "eligibilityDecision": {
    "outcome": "APPROVE",
    "reasons": ["Meets all eligibility criteria"],
    "flags": []
  },
  "pricingDecision": {
    "premiumRate": 0.0055,
    "basisPoints": 55,
    "pricingTier": "STANDARD"
  },
  "documentationDecision": {
    "requiredDocuments": [
      "APPRAISAL",
      "INCOME_VERIFICATION",
      "CREDIT_REPORT"
    ]
  },
  "executionMetadata": {
    "rulesetVersion": "1.0.0",
    "executionTimeMs": 45,
    "firedRules": [
      "ELG-001: LTV Check",
      "PRICE-002: Standard Pricing",
      "DOC-001: Standard Documentation"
    ]
  }
}
```

## Importing into ODM Rule Designer

### Prerequisites
- IBM ODM 8.11+ installed
- Rule Designer workspace configured
- Java 8+ runtime

### Import Steps

1. **Open Rule Designer**
   - Launch IBM Rule Designer
   - Select workspace: `<workspace>/odm_projects`

2. **Import Decision Service Archive**
   - File → Import → Rule Project
   - Select: `pearl-to-odm-bob-demo/odm_target/export/MI_Underwriting.zip`
   - Click "Finish"

3. **Verify Project Structure**
   - Confirm all 4 rule projects are imported:
     - `ExceptionRules`
     - `EligibilityRules`
     - `PricingRules`
     - `DocumentationRules`
   - Verify BOM (Business Object Model) is present in each project

4. **Build Ruleflow**
   - Open `MI_Underwriting_Ruleflow.rfl`
   - Verify task sequence: Exceptions → Eligibility → Pricing → Documentation
   - Build ruleflow: Right-click → Build

5. **Test Locally**
   - Right-click on ruleflow → Run As → Rule Execution
   - Load sample input from `legacy_pearl/samples/loan_app_001.json`
   - Verify output matches expected decision

## Deployment to Rule Execution Server (RES)

### Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│         Rule Designer (Development)             │
│  - Author rules                                 │
│  - Test locally                                 │
│  - Export RuleApp                               │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│      Decision Center (Governance)               │
│  - Version control                              │
│  - Approval workflow                            │
│  - Deployment management                        │
└─────────────────┬───────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────┐
│   Rule Execution Server (Runtime)               │
│  - DEV:  http://res-dev.mgic.com:9080/res       │
│  - UAT:  http://res-uat.mgic.com:9080/res       │
│  - PROD: http://res-prod.mgic.com:9080/res      │
└─────────────────────────────────────────────────┘
```

### Deployment Steps

1. **Export RuleApp from Rule Designer**
   - Right-click on `MI_Underwriting` decision service
   - Select "RuleApp" → "Export RuleApp Archive"
   - Save as: `MI_Underwriting_v1.0.0.jar`

2. **Deploy to Decision Center**
   - Login to Decision Center: `http://dc.mgic.com:9060/decisioncenter`
   - Navigate to "RuleApps" → "Deploy"
   - Upload `MI_Underwriting_v1.0.0.jar`
   - Set deployment target: DEV, UAT, or PROD

3. **Deploy to RES**
   - Decision Center automatically deploys to configured RES instance
   - Alternatively, use RES Console:
     - Login: `http://res-dev.mgic.com:9080/res/console`
     - Navigate to "RuleApps" → "Deploy"
     - Upload JAR and activate

4. **Verify Deployment**
   - RES Console → "RuleApps" → `MI_Underwriting/1.0.0`
   - Status should show "Active"
   - Test endpoint: `POST http://res-dev.mgic.com:9080/res/api/v1/MI_Underwriting/1.0.0/execute`

### REST API Endpoint

**Endpoint**: `POST /res/api/v1/MI_Underwriting/{version}/execute`

**Headers**:
```
Content-Type: application/json
Authorization: Basic <base64_credentials>
```

**Sample cURL**:
```bash
curl -X POST http://res-dev.mgic.com:9080/res/api/v1/MI_Underwriting/1.0.0/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic dXNlcjpwYXNzd29yZA==" \
  -d @loan_app_001.json
```

## Performance Considerations

### Expected Performance
- **Latency**: <100ms p95 for decision execution
- **Throughput**: 500+ decisions/second per RES instance
- **Memory**: ~512MB heap per RES instance

### Optimization Strategies
- **Rule Compilation**: Rules are compiled to Java bytecode for fast execution
- **Caching**: BOM instances cached between executions
- **Connection Pooling**: HTTP client connection pool for REST API
- **Horizontal Scaling**: Deploy multiple RES instances behind load balancer

### Monitoring
- **RES Console**: Real-time execution metrics
- **Application Logs**: `/opt/ibm/odm/logs/res-execution.log`
- **Metrics Endpoint**: `GET /res/api/v1/metrics` (Prometheus format)

## High Availability

### Production Configuration
- **Load Balancer**: HAProxy or F5 in front of RES cluster
- **RES Cluster**: 3+ instances for redundancy
- **Database**: Shared PostgreSQL for Decision Center metadata
- **Failover**: Automatic failover to standby RES instance (<5s)

### Disaster Recovery
- **Backup**: Daily backup of Decision Center database
- **RuleApp Archive**: All versions stored in artifact repository
- **Recovery Time Objective (RTO)**: <1 hour
- **Recovery Point Objective (RPO)**: <24 hours

## Security

### Authentication
- **Basic Auth**: Username/password for development
- **OAuth 2.0**: Token-based auth for production
- **LDAP Integration**: Corporate directory for user management

### Authorization
- **Role-Based Access Control (RBAC)**:
  - `rule_author`: Create/edit rules
  - `rule_reviewer`: Review and approve rules
  - `rule_deployer`: Deploy to RES
  - `rule_executor`: Execute decisions via API

### Encryption
- **TLS 1.2+**: All API traffic encrypted
- **At-Rest Encryption**: Database encryption for Decision Center

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-02 | Initial ODM migration from PEARL-DSL |

---

**Document Owner**: IT Architecture Team  
**Last Updated**: 2026-03-02  
**Review Cycle**: Quarterly