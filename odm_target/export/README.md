# ODM Export Archive - MI Underwriting Decision Service

**Version:** 1.0.0-20260302  
**Export Date:** March 2, 2026  
**Target Platform:** IBM Operational Decision Manager (ODM) 8.11+

## Overview

This directory represents the structure of an ODM Rule Project Archive that would be exported from IBM ODM Rule Designer. The archive contains a complete, importable Decision Service for Mortgage Insurance (MI) underwriting, pricing, and documentation requirements.

**Purpose:** This export enables migration from the legacy Pearl rule engine to IBM ODM by providing a fully-structured Decision Service that can be imported into ODM Rule Designer, tested, and deployed to Rule Execution Server (RES).

**What's Included:**
- Decision Service definition with orchestrated ruleflow
- 4 Rule Projects (Exceptions, Eligibility, Pricing, Documentation)
- Business Object Model (BOM) and Execution Object Model (XOM)
- Decision tables and action rules
- Test data and expected results

## Export Contents

If this were an actual ODM export, the `.zip` archive would contain the following structure:

```
MI_Underwriting_1.0.0.zip
│
├── MI_Underwriting/                    # Decision Service Root
│   ├── decision-service.xml            # Service definition and metadata
│   ├── ruleflow.rf                     # Main orchestration ruleflow
│   ├── .project                        # Eclipse project metadata
│   └── META-INF/
│       └── MANIFEST.MF                 # Archive manifest
│
├── ExceptionRules/                     # Rule Project: High-Risk Exceptions
│   ├── rules/
│   │   ├── high-risk-exception.drl     # EXC-001: High-risk state + high LTV
│   │   ├── arm-high-ltv-exception.drl  # EXC-002: ARM + LTV > 90%
│   │   ├── state-risk-exception.drl    # EXC-003: High-risk state combinations
│   │   └── fthb-high-risk-exception.drl # EXC-004: First-time buyer + high risk
│   ├── bom/
│   │   └── model.xml                   # BOM definitions for exceptions
│   └── .project
│
├── EligibilityRules/                   # Rule Project: Underwriting Eligibility
│   ├── rules/
│   │   └── eligibility-decision-table.dta  # 14-row decision table
│   ├── bom/
│   │   └── model.xml                   # BOM definitions for eligibility
│   └── .project
│
├── PricingRules/                       # Rule Project: Premium Calculation
│   ├── rules/
│   │   └── pricing-decision-table.dta  # 20-row decision table (4 LTV × 5 FICO)
│   ├── bom/
│   │   └── model.xml                   # BOM definitions for pricing
│   └── .project
│
├── DocumentationRules/                 # Rule Project: Required Documents
│   ├── rules/
│   │   └── documentation-decision-table.dta  # 7-row decision table
│   ├── bom/
│   │   └── model.xml                   # BOM definitions for documentation
│   └── .project
│
└── xom/                                # Execution Object Model (Java)
    ├── src/
    │   └── com/mgic/underwriting/
    │       ├── Loan.java               # Main loan application object
    │       ├── Borrower.java           # Borrower information
    │       ├── Property.java           # Property details
    │       ├── UnderwritingDecision.java  # Decision output
    │       ├── PricingResult.java      # Pricing calculation result
    │       └── DocumentRequirement.java   # Required documents list
    ├── lib/                            # External dependencies (if any)
    └── .project
```

### Ruleflow Execution Order

The main ruleflow (`MI_Underwriting/ruleflow.rf`) orchestrates rule execution in this sequence:

1. **Exception Rules** → Check for high-risk scenarios that require manual review
2. **Eligibility Rules** → Determine if loan qualifies for MI coverage
3. **Pricing Rules** → Calculate premium rate based on risk factors
4. **Documentation Rules** → Determine required documentation based on loan characteristics

Each phase can short-circuit the flow (e.g., if an exception is triggered, eligibility may be skipped).

### Decision Tables

#### Eligibility Decision Table (14 rows)
Consolidates rules ELG-001 through ELG-015 (excluding ELG-008, which was identified as dead code):
- LTV thresholds by property type and occupancy
- FICO score minimums
- DTI ratio limits
- Loan amount caps
- Property type restrictions

#### Pricing Decision Table (20 rows)
Matrix-based pricing with:
- **LTV Bands:** ≤80%, 80-85%, 85-90%, 90-95%, >95%
- **FICO Bands:** <620, 620-679, 680-739, 740-799, ≥800
- **Output:** Base premium rate (percentage)

#### Documentation Decision Table (7 rows)
Rules DOC-001 through DOC-007:
- Income verification requirements
- Asset documentation
- Property appraisal requirements
- Title insurance
- Additional documentation for high-risk scenarios

### Business Object Model (BOM)

The BOM defines business-friendly vocabulary for rule authoring:

**Core Entities:**
- `Loan Application` - Main input object
- `Borrower` - Primary and co-borrower information
- `Property` - Subject property details
- `Underwriting Decision` - Output with approve/refer/decline
- `Pricing Result` - Premium rate and calculations
- `Document Requirements` - List of required documents

**Key Attributes:**
- Loan: amount, purpose, term, type (Fixed/ARM)
- Borrower: FICO score, DTI ratio, first-time buyer flag
- Property: value, type, occupancy, state
- Decision: status, reasons, exceptions triggered

### Execution Object Model (XOM)

Java classes that implement the BOM:
- POJOs with getters/setters
- Validation logic
- Calculation methods (e.g., LTV calculation)
- Serialization support for REST API

## How to Import into ODM Rule Designer

### Prerequisites
- IBM ODM Rule Designer 8.11 or later (or ODM on Cloud)
- Java Development Kit (JDK) 8 or 11
- Sufficient workspace memory (recommended: 2GB+)

### Import Steps

1. **Open IBM ODM Rule Designer**
   ```
   Launch Rule Designer from your ODM installation
   ```

2. **Import the Archive**
   - Navigate to: `File → Import → Rule Project Archive`
   - Click `Browse` and select `MI_Underwriting_1.0.0.zip`
   - Review the list of projects to be imported:
     - MI_Underwriting (Decision Service)
     - ExceptionRules
     - EligibilityRules
     - PricingRules
     - DocumentationRules
     - xom (Java project)

3. **Configure Import Options**
   - ☑ Import project dependencies
   - ☑ Resolve workspace references
   - ☐ Overwrite existing projects (uncheck unless updating)

4. **Complete Import**
   - Click `Finish`
   - Wait for workspace build to complete
   - Check `Problems` view for any errors

5. **Verify Import**
   - Expand each project in Project Explorer
   - Open `MI_Underwriting/ruleflow.rf` to view the orchestration
   - Open decision tables to verify rule content
   - Check that XOM classes compile without errors

6. **Build All Projects**
   ```
   Project → Clean... → Clean all projects → OK
   Project → Build All
   ```

7. **Test in Decision Service Console**
   - Right-click `MI_Underwriting` → `Run As → Decision Service`
   - Use sample JSON from `legacy_pearl/samples/` as test input
   - Compare results with `expected_decisions.csv`

### Common Import Issues

| Issue | Solution |
|-------|----------|
| Missing dependencies | Ensure ODM version is 8.11+; check for required libraries |
| Build errors in XOM | Verify JDK version; check Java compiler settings |
| Ruleflow validation errors | Re-import with "Resolve workspace references" enabled |
| Decision table format errors | May require manual adjustment for ODM version differences |

## How to Deploy to Rule Execution Server (RES)

### Export RuleApp from Rule Designer

1. **Generate RuleApp Archive**
   - Right-click `MI_Underwriting` Decision Service
   - Select `Deploy → RuleApp Archive`
   - Choose output location: `MI_Underwriting_1.0.0.jar`
   - Select deployment configuration (production, staging, etc.)

2. **Configure Deployment Properties**
   - Set ruleset version: `1.0.0`
   - Enable/disable rule tracing
   - Configure execution settings (timeout, max iterations)

### Deploy to RES

#### Option 1: RES Console (Manual Deployment)

1. Open RES Console: `http://<res-server>:9080/res`
2. Navigate to: `Explorer → RuleApps`
3. Click `Upload RuleApp Archive`
4. Select `MI_Underwriting_1.0.0.jar`
5. Review deployment summary
6. Click `Deploy`

#### Option 2: REST API (Automated Deployment)

```bash
# Deploy RuleApp via REST API
curl -X POST \
  -u resAdmin:resAdmin \
  -F "file=@MI_Underwriting_1.0.0.jar" \
  http://<res-server>:9080/res/api/v1/ruleapps
```

#### Option 3: CI/CD Pipeline (Recommended)

```yaml
# Example Jenkins/GitLab CI pipeline step
deploy_to_res:
  stage: deploy
  script:
    - curl -X POST -u $RES_USER:$RES_PASSWORD \
      -F "file=@MI_Underwriting_1.0.0.jar" \
      $RES_URL/api/v1/ruleapps
  only:
    - main
```

### Post-Deployment Configuration

1. **Database Connection** (if using persistence)
   ```xml
   <datasource>
     <jndi-name>jdbc/ODMDB</jndi-name>
     <driver>com.ibm.db2.jcc.DB2Driver</driver>
     <url>jdbc:db2://localhost:50000/ODMDB</url>
   </datasource>
   ```

2. **Logging Configuration**
   - Enable execution logging for audit trail
   - Configure log level (INFO, DEBUG, TRACE)
   - Set up log rotation and retention

3. **Performance Tuning**
   - Adjust thread pool size
   - Configure ruleset cache settings
   - Enable/disable rule tracing based on environment

4. **Security Configuration**
   - Configure authentication (LDAP, OAuth, etc.)
   - Set up role-based access control (RBAC)
   - Enable SSL/TLS for REST endpoints

## Testing the Decision Service

### Test Data Location

Use the 60 loan application JSON files from:
```
pearl-to-odm-bob-demo/legacy_pearl/samples/loan_app_001.json
...
pearl-to-odm-bob-demo/legacy_pearl/samples/loan_app_060.json
```

Expected results are documented in:
```
pearl-to-odm-bob-demo/legacy_pearl/samples/expected_decisions.csv
```

### Testing Methods

#### 1. Decision Service Console (Interactive Testing)

**In Rule Designer:**
1. Right-click `MI_Underwriting` → `Run As → Decision Service`
2. In the console, click `Test` tab
3. Load sample JSON: `File → Load → loan_app_001.json`
4. Click `Execute`
5. Review output in `Response` panel
6. Compare with expected decision from CSV

**Example Input:**
```json
{
  "loanAmount": 250000,
  "propertyValue": 300000,
  "loanPurpose": "Purchase",
  "propertyType": "SingleFamily",
  "occupancy": "PrimaryResidence",
  "borrower": {
    "ficoScore": 720,
    "dtiRatio": 38,
    "isFirstTimeBuyer": false
  },
  "property": {
    "state": "WI",
    "zipCode": "53202"
  }
}
```

**Expected Output:**
```json
{
  "decision": "APPROVED",
  "premiumRate": 0.52,
  "reasons": ["Eligible for standard MI coverage"],
  "requiredDocuments": [
    "Income verification (W-2, pay stubs)",
    "Asset documentation",
    "Property appraisal"
  ],
  "exceptionsTriggered": []
}
```

#### 2. REST API Testing

**Endpoint:**
```
POST http://<res-server>:9080/DecisionService/rest/MI_Underwriting/1.0/execute
```

**cURL Example:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -u resExecutor:resExecutor \
  -d @loan_app_001.json \
  http://localhost:9080/DecisionService/rest/MI_Underwriting/1.0/execute
```

**Python Example:**
```python
import requests
import json

# Load test data
with open('loan_app_001.json', 'r') as f:
    loan_data = json.load(f)

# Call ODM Decision Service
response = requests.post(
    'http://localhost:9080/DecisionService/rest/MI_Underwriting/1.0/execute',
    auth=('resExecutor', 'resExecutor'),
    json=loan_data
)

# Print result
print(json.dumps(response.json(), indent=2))
```

#### 3. Batch Testing Script

Use the provided stub script as a template:
```bash
cd pearl-to-odm-bob-demo/tools
python invoke_odm_stub.py --batch ../legacy_pearl/samples/
```

**Script Features:**
- Processes all 60 loan applications
- Compares results with `expected_decisions.csv`
- Generates test report with pass/fail status
- Identifies discrepancies for investigation

### Validation Criteria

For each test case, verify:
- ✅ Decision status matches (APPROVED/REFERRED/DECLINED)
- ✅ Premium rate is within tolerance (±0.01%)
- ✅ Required documents list is complete
- ✅ Exception flags are correctly triggered
- ✅ Execution time is acceptable (<500ms per decision)

### Test Coverage

The 60 sample loan applications provide coverage for:
- **LTV Ranges:** 50% to 97%
- **FICO Scores:** 580 to 820
- **Property Types:** Single Family, Condo, Townhouse, Multi-Family
- **Occupancy:** Primary, Secondary, Investment
- **Loan Purposes:** Purchase, Refinance, Cash-Out Refinance
- **States:** All 50 states (with focus on high-risk states)
- **Edge Cases:** Boundary conditions, exception scenarios

## Customization Guide

### Modifying Decision Tables

#### Add a New Row to Eligibility Table

1. Open `EligibilityRules/rules/eligibility-decision-table.dta`
2. Right-click table → `Insert Row`
3. Define conditions:
   - LTV range
   - FICO score range
   - Property type
   - Occupancy type
4. Set action: `Set decision to "APPROVED"` or `"DECLINED"`
5. Save and rebuild project

#### Change Pricing Thresholds

1. Open `PricingRules/rules/pricing-decision-table.dta`
2. Locate the row for the LTV/FICO combination
3. Update the premium rate value
4. Save and rebuild
5. Re-test affected scenarios

**Example:** Increase premium for LTV 90-95%, FICO 620-679:
```
Before: 0.85%
After:  0.95%
```

### Adding New Rules

#### Create a New Action Rule

1. Right-click `ExceptionRules/rules` → `New → Technical Rule`
2. Name: `new-exception-rule.drl`
3. Write rule in DRL syntax:
   ```drl
   rule "New Exception Rule"
   when
       $loan : Loan(loanAmount > 500000, 
                    borrower.ficoScore < 700)
   then
       $loan.addException("High loan amount with moderate FICO");
       $loan.setDecision("REFERRED");
   end
   ```
4. Save and rebuild
5. Update ruleflow if needed

#### Create a New Decision Table

1. Right-click rule project → `New → Decision Table`
2. Choose template or start blank
3. Define columns:
   - **Condition columns:** Input attributes to evaluate
   - **Action columns:** Outputs to set
4. Add rows with specific value combinations
5. Save and rebuild

### Updating the Business Object Model (BOM)

#### Add a New Attribute

1. Open `xom/src/com/mgic/underwriting/Loan.java`
2. Add new field:
   ```java
   private boolean hasCoSigner;
   
   public boolean isHasCoSigner() {
       return hasCoSigner;
   }
   
   public void setHasCoSigner(boolean hasCoSigner) {
       this.hasCoSigner = hasCoSigner;
   }
   ```
3. Update BOM mapping:
   - Open rule project → `bom/model.xml`
   - Add verbalization: "the loan has a co-signer"
4. Rebuild XOM and rule projects
5. Update rules to use new attribute

#### Add a New Business Entity

1. Create Java class in XOM:
   ```java
   package com.mgic.underwriting;
   
   public class CreditHistory {
       private int bankruptcyCount;
       private int foreclosureCount;
       private boolean hasJudgments;
       
       // Getters and setters...
   }
   ```
2. Add reference in `Borrower.java`:
   ```java
   private CreditHistory creditHistory;
   ```
3. Update BOM to expose new entity
4. Create rules using the new entity

### Modifying the Ruleflow

#### Add a New Phase

1. Open `MI_Underwriting/ruleflow.rf`
2. Drag a new `Rule Task` from palette
3. Configure task:
   - Name: "Credit History Check"
   - Rule project: Select appropriate project
   - Execution mode: Sequential or RetePlus
4. Connect task in flow:
   ```
   Exceptions → Credit History → Eligibility → Pricing → Documentation
   ```
5. Add transition conditions if needed
6. Save and rebuild

#### Add Conditional Branching

1. Add a `Gateway` node to the ruleflow
2. Configure conditions:
   ```
   if (decision == "REFERRED") → Manual Review Path
   else → Continue to Pricing
   ```
3. Connect branches appropriately
4. Test all paths

### Best Practices for Rule Maintenance

1. **Version Control**
   - Commit rule changes to Git with descriptive messages
   - Use branches for major changes
   - Tag releases: `v1.0.0`, `v1.1.0`, etc.

2. **Testing**
   - Run full test suite before committing
   - Add new test cases for new rules
   - Maintain test coverage above 90%

3. **Documentation**
   - Document rule intent in comments
   - Update design documents when rules change
   - Maintain change log (see `design/change_log.md`)

4. **Performance**
   - Monitor rule execution time
   - Optimize complex conditions
   - Use decision tables for matrix-based logic
   - Avoid excessive rule chaining

5. **Governance**
   - Follow approval process for rule changes (see `design/governance_and_release.md`)
   - Conduct peer reviews
   - Validate business logic with stakeholders
   - Maintain audit trail of changes

## Troubleshooting

### Common Import Errors

#### Error: "Project dependencies cannot be resolved"

**Cause:** Missing or incompatible ODM version

**Solution:**
1. Verify ODM version is 8.11 or later
2. Check that all required plugins are installed
3. Re-import with "Import project dependencies" enabled
4. If issue persists, import projects individually in dependency order:
   - xom → ExceptionRules → EligibilityRules → PricingRules → DocumentationRules → MI_Underwriting

#### Error: "Invalid decision table format"

**Cause:** Decision table was created in a different ODM version

**Solution:**
1. Open the decision table in Rule Designer
2. Click `Validate` to see specific errors
3. Manually adjust column definitions if needed
4. Re-save the table

#### Error: "BOM/XOM mapping not found"

**Cause:** XOM classes not compiled or BOM not synchronized

**Solution:**
1. Right-click xom project → `Build Project`
2. Right-click rule project → `Synchronize BOM with XOM`
3. Rebuild all projects

### Build Errors

#### Java Compilation Errors in XOM

**Check:**
- JDK version (must be 8 or 11)
- Java compiler compliance level: `Project → Properties → Java Compiler`
- Missing dependencies in classpath

**Fix:**
```
Project → Properties → Java Build Path → Libraries
Add required JARs if missing
```

#### Rule Validation Errors

**Common Issues:**
- Undefined BOM elements → Synchronize BOM
- Syntax errors in DRL → Check rule syntax
- Circular dependencies → Review rule project references

**Validation:**
```
Right-click rule project → Validate
Review Problems view for details
```

### Runtime Errors

#### Error: "Ruleset not found" (404)

**Cause:** RuleApp not deployed or incorrect URL

**Solution:**
1. Verify deployment in RES Console
2. Check RuleApp name and version in URL
3. Ensure RES is running: `http://<server>:9080/res`

#### Error: "Execution timeout"

**Cause:** Rules taking too long to execute

**Solution:**
1. Check for infinite loops in rules
2. Optimize complex conditions
3. Increase timeout in RES configuration:
   ```xml
   <execution-timeout>30000</execution-timeout> <!-- 30 seconds -->
   ```

#### Error: "Invalid input format"

**Cause:** JSON doesn't match expected XOM structure

**Solution:**
1. Validate JSON against XOM schema
2. Check for missing required fields
3. Verify data types (e.g., numbers vs. strings)
4. Use Decision Service Console to test with sample data

### Performance Tuning

#### Slow Rule Execution

**Optimization Strategies:**
1. **Use Decision Tables** for matrix-based logic (faster than multiple rules)
2. **Optimize Conditions** - Put most selective conditions first
3. **Reduce Rule Chaining** - Minimize rules that trigger other rules
4. **Enable Ruleset Caching** in RES configuration
5. **Use RetePlus Algorithm** for complex rule sets

**Monitoring:**
```bash
# Enable execution tracing
curl -X PUT \
  -u resAdmin:resAdmin \
  -H "Content-Type: application/json" \
  -d '{"traceEnabled": true}' \
  http://localhost:9080/res/api/v1/ruleapps/MI_Underwriting/1.0/config
```

#### High Memory Usage

**Solutions:**
1. Increase JVM heap size: `-Xmx2048m`
2. Enable garbage collection logging
3. Review ruleset for memory leaks
4. Limit concurrent executions in RES

### Debugging Tips

1. **Enable Rule Tracing**
   - In Rule Designer: Run → Debug Configurations → Enable tracing
   - In RES: Configure trace level in RuleApp settings

2. **Use Breakpoints**
   - Set breakpoints in Rule Designer
   - Step through rule execution
   - Inspect variable values

3. **Check Execution Logs**
   ```bash
   tail -f /opt/IBM/ODM/logs/res-execution.log
   ```

4. **Test Incrementally**
   - Test individual rule projects first
   - Then test integrated Decision Service
   - Isolate problematic rules

## Next Steps

### 1. Connect to Actual Data Sources

**Database Integration:**
```java
// Add JDBC connection in XOM
public class LoanDataService {
    public Loan fetchLoan(String loanId) {
        // Query database
        // Map to Loan object
        return loan;
    }
}
```

**REST API Integration:**
```java
// Call external services for credit scores, property values, etc.
public class ExternalDataService {
    public int fetchFicoScore(String ssn) {
        // Call credit bureau API
    }
}
```

### 2. Integrate with Loan Origination System (LOS)

**Integration Patterns:**
- **Synchronous:** REST API calls from LOS to ODM
- **Asynchronous:** Message queue (JMS, Kafka) for batch processing
- **Embedded:** Deploy ODM as library within LOS

**Example Integration:**
```java
// LOS calls ODM Decision Service
UnderwritingDecision decision = odmClient.execute(loanApplication);
if (decision.getStatus().equals("APPROVED")) {
    los.approveLoan(loanApplication);
} else {
    los.referToUnderwriter(loanApplication, decision.getReasons());
}
```

### 3. Set Up Decision Center for Business Users

**Benefits:**
- Business analysts can author and modify rules
- No technical knowledge required
- Built-in governance and approval workflow
- Version control and audit trail

**Setup Steps:**
1. Install Decision Center (if not already installed)
2. Import Decision Service from Rule Designer
3. Configure user roles and permissions
4. Train business users on Decision Center interface
5. Establish rule authoring guidelines

**Access:**
```
http://<server>:9080/decisioncenter
```

### 4. Configure Production Monitoring

**Key Metrics to Monitor:**
- Execution count and rate
- Average execution time
- Error rate and types
- Rule coverage (which rules are firing)
- Business metrics (approval rate, average premium, etc.)

**Monitoring Tools:**
- ODM Insights (built-in analytics)
- Application Performance Monitoring (APM) tools
- Custom dashboards (Grafana, Kibana)

**Example Monitoring Query:**
```sql
SELECT 
    ruleset_name,
    COUNT(*) as execution_count,
    AVG(execution_time_ms) as avg_time,
    SUM(CASE WHEN status = 'ERROR' THEN 1 ELSE 0 END) as error_count
FROM odm_execution_log
WHERE timestamp > NOW() - INTERVAL '1 hour'
GROUP BY ruleset_name;
```

### 5. Implement Governance Framework

Follow the governance process documented in:
```
pearl-to-odm-bob-demo/odm_target/design/governance_and_release.md
```

**Key Governance Activities:**
- Rule change request and approval process
- Impact analysis for rule changes
- Testing and validation requirements
- Deployment approval gates
- Post-deployment monitoring and rollback procedures

**Governance Roles:**
- **Rule Authors:** Business analysts, underwriters
- **Rule Reviewers:** Senior underwriters, compliance officers
- **Rule Approvers:** VP of Underwriting, Risk Management
- **Technical Owners:** ODM administrators, DevOps team

### 6. Plan for Continuous Improvement

**Ongoing Activities:**
1. **Monthly Rule Review**
   - Analyze rule performance
   - Identify optimization opportunities
   - Review business feedback

2. **Quarterly Business Alignment**
   - Validate rules against current business strategy
   - Update rules for market changes
   - Incorporate regulatory updates

3. **Annual Architecture Review**
   - Assess ODM platform performance
   - Plan for upgrades and enhancements
   - Review integration architecture

4. **Continuous Testing**
   - Maintain and expand test suite
   - Add new edge cases as discovered
   - Automate regression testing

## Additional Resources

### Documentation
- [IBM ODM Documentation](https://www.ibm.com/docs/en/odm/8.11.0)
- [ODM Rule Designer User Guide](https://www.ibm.com/docs/en/odm/8.11.0?topic=designer-rule-user-guide)
- [Decision Service Development Guide](https://www.ibm.com/docs/en/odm/8.11.0?topic=services-developing-decision)

### Training
- IBM ODM Essentials (online course)
- Rule Authoring Best Practices (workshop)
- ODM Performance Tuning (advanced course)

### Support
- IBM Support Portal: https://www.ibm.com/mysupport
- ODM Community Forum: https://community.ibm.com/community/user/automation/communities/community-home?CommunityKey=c0005a22-520b-4181-bfad-feffd8bdc022
- Internal ODM Support: Contact your organization's ODM support team

### Related Documentation in This Repository
- `design/decision_service_arch.md` - Architecture overview
- `design/domain_model.md` - Business object model details
- `design/mappings_pearl_to_odm.md` - Pearl to ODM rule mappings
- `design/parity_report.md` - Validation of Pearl-to-ODM parity
- `design/change_log.md` - History of rule changes
- `design/governance_and_release.md` - Governance framework

---

**Questions or Issues?**  
Contact the ODM Migration Team: odm-migration@mgic.com

**Last Updated:** March 2, 2026  
**Document Version:** 1.0