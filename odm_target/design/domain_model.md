# ODM Domain Model

## Overview

The ODM domain model defines the Business Object Model (BOM) and Execution Object Model (XOM) for the MI_Underwriting decision service. This model represents a significant improvement over the legacy PERL-DSL flat structure by introducing proper object-oriented design with normalized entities.

## Business Object Model (BOM)

The BOM represents the business vocabulary used in rules, making them readable and maintainable by business users.

### Core Classes

#### 1. Loan

Represents the mortgage loan application.

**Attributes**:

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `loanAmount` | Double | Loan amount in USD | 250000.00 |
| `propertyValue` | Double | Appraised property value | 300000.00 |
| `loanPurpose` | String | Purpose of loan | "PURCHASE", "REFINANCE", "CASHOUT_REFI" |
| `occupancyType` | String | How property will be used | "PRIMARY", "SECONDARY", "INVESTMENT" |
| `loanType` | String | Type of mortgage | "CONVENTIONAL", "FHA", "VA" |
| `loanToValue` | Double | Calculated LTV ratio (%) | 83.33 |

**Derived Attributes**:
- `loanToValue`: Calculated as `(loanAmount / propertyValue) * 100`

**Verbalization**:
- "the loan amount"
- "the loan to value ratio"
- "the loan purpose"

---

#### 2. Borrower

Represents the primary borrower on the loan application.

**Attributes**:

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `creditScore` | Integer | FICO credit score | 720 |
| `dti` | Double | Debt-to-income ratio (%) | 38.5 |
| `bankruptcyFlag` | Boolean | Recent bankruptcy indicator | false |
| `foreclosureFlag` | Boolean | Recent foreclosure indicator | false |
| `firstTimeHomebuyer` | Boolean | First-time homebuyer status | true |

**Verbalization**:
- "the borrower's credit score"
- "the borrower's debt to income ratio"
- "the borrower has a bankruptcy flag"

**Legacy Mapping**:
- Legacy `FICO` → ODM `borrower.creditScore`
- Legacy `DTI` → ODM `borrower.dti`

---

#### 3. Property

Represents the property being financed.

**Attributes**:

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `propertyType` | String | Type of property | "SFR", "CONDO", "TOWNHOUSE", "MULTI_FAMILY" |
| `state` | String | US state code | "TX", "CA", "NY" |
| `ruralAreaFlag` | Boolean | USDA rural area indicator | false |
| `condoApprovalStatus` | String | Condo project approval | "APPROVED", "PENDING", "NOT_APPROVED" |

**Verbalization**:
- "the property type"
- "the property is in a rural area"
- "the property state"

---

#### 4. EligibilityDecision

Represents the eligibility determination outcome.

**Attributes**:

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `outcome` | String | Final eligibility decision | "APPROVE", "REFER", "DECLINE" |
| `reasons` | List<String> | List of decision reasons | ["LTV exceeds 95%", "DTI too high"] |
| `flags` | List<String> | Risk or exception flags | ["HIGH_RISK", "MANUAL_REVIEW"] |

**Verbalization**:
- "the eligibility outcome"
- "add 'LTV exceeds threshold' to the eligibility reasons"
- "set the eligibility outcome to DECLINE"

---

#### 5. PricingDecision

Represents the premium pricing outcome.

**Attributes**:

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `premiumRate` | Double | Annual premium rate (decimal) | 0.0055 |
| `basisPoints` | Integer | Premium in basis points | 55 |
| `pricingTier` | String | Pricing category | "STANDARD", "PREFERRED", "HIGH_RISK" |

**Derived Attributes**:
- `basisPoints`: Calculated as `premiumRate * 10000`

**Verbalization**:
- "set the premium rate to 0.0055"
- "the pricing tier"

---

#### 6. DocumentationDecision

Represents the required documentation outcome.

**Attributes**:

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `requiredDocuments` | List<String> | List of required documents | ["APPRAISAL", "INCOME_VERIFICATION"] |

**Document Types**:
- `APPRAISAL`: Property appraisal report
- `INCOME_VERIFICATION`: W-2s, pay stubs, tax returns
- `CREDIT_REPORT`: Full credit report
- `TITLE_INSURANCE`: Title insurance policy
- `FLOOD_CERT`: Flood zone certification
- `CONDO_DOCS`: Condo association documents
- `EMPLOYMENT_VERIFICATION`: VOE letter

**Verbalization**:
- "add APPRAISAL to the required documents"
- "the required documents include INCOME_VERIFICATION"

---

## Execution Object Model (XOM)

The XOM represents the Java implementation classes that execute at runtime. The BOM-to-XOM mapping enables business users to author rules using business terminology while the execution engine uses optimized Java objects.

### XOM Classes

#### Java Package Structure
```
com.mgic.underwriting.model
├── Loan.java
├── Borrower.java
├── Property.java
├── EligibilityDecision.java
├── PricingDecision.java
└── DocumentationDecision.java
```

### BOM-to-XOM Mappings

| BOM Class | XOM Class | Mapping Type |
|-----------|-----------|--------------|
| `Loan` | `com.mgic.underwriting.model.Loan` | Direct |
| `Borrower` | `com.mgic.underwriting.model.Borrower` | Direct |
| `Property` | `com.mgic.underwriting.model.Property` | Direct |
| `EligibilityDecision` | `com.mgic.underwriting.model.EligibilityDecision` | Direct |
| `PricingDecision` | `com.mgic.underwriting.model.PricingDecision` | Direct |
| `DocumentationDecision` | `com.mgic.underwriting.model.DocumentationDecision` | Direct |

### Sample XOM Implementation (Loan.java)

```java
package com.mgic.underwriting.model;

public class Loan {
    private Double loanAmount;
    private Double propertyValue;
    private String loanPurpose;
    private String occupancyType;
    private String loanType;
    
    // Derived attribute
    public Double getLoanToValue() {
        if (propertyValue == null || propertyValue == 0) {
            return null;
        }
        return (loanAmount / propertyValue) * 100;
    }
    
    // Getters and setters
    public Double getLoanAmount() { return loanAmount; }
    public void setLoanAmount(Double loanAmount) { this.loanAmount = loanAmount; }
    
    public Double getPropertyValue() { return propertyValue; }
    public void setPropertyValue(Double propertyValue) { this.propertyValue = propertyValue; }
    
    // ... additional getters/setters
}
```

## Verbalization Patterns

Verbalization patterns make rules readable in natural language. ODM automatically generates verbalizations based on BOM definitions.

### Condition Verbalizations

| BOM Expression | Verbalization |
|----------------|---------------|
| `loan.loanToValue > 95` | "the loan to value ratio is more than 95" |
| `borrower.creditScore < 620` | "the borrower's credit score is less than 620" |
| `property.propertyType == "CONDO"` | "the property type is CONDO" |
| `borrower.bankruptcyFlag == true` | "the borrower has a bankruptcy flag" |

### Action Veralization

| BOM Expression | Verbalization |
|----------------|---------------|
| `eligibilityDecision.outcome = "DECLINE"` | "set the eligibility outcome to DECLINE" |
| `eligibilityDecision.reasons.add("LTV too high")` | "add 'LTV too high' to the eligibility reasons" |
| `pricingDecision.premiumRate = 0.0085` | "set the premium rate to 0.0085" |

### Custom Verbalizations

For complex expressions, custom verbalizations can be defined:

```
BOM Expression: loan.loanToValue >= 80 && loan.loanToValue <= 90
Verbalization: "the loan to value ratio is between 80 and 90"
```

## Comparison to Legacy Flat Model

### Legacy PERL-DSL Structure

The legacy system used a flat, denormalized structure:

```json
{
  "loanAmount": 250000,
  "propertyValue": 300000,
  "FICO": 720,
  "DTI": 38.5,
  "propertyType": "SFR",
  "state": "TX",
  "bankruptcyFlag": false,
  "loanPurpose": "PURCHASE"
}
```

**Issues**:
- No logical grouping of related attributes
- Inconsistent naming (FICO vs creditScore)
- Difficult to extend (adding co-borrower requires duplicating all fields)
- No encapsulation of business logic (LTV calculation scattered across rules)

### ODM Normalized Structure

```json
{
  "loan": {
    "loanAmount": 250000,
    "propertyValue": 300000,
    "loanPurpose": "PURCHASE"
  },
  "borrower": {
    "creditScore": 720,
    "dti": 38.5,
    "bankruptcyFlag": false
  },
  "property": {
    "propertyType": "SFR",
    "state": "TX"
  }
}
```

**Benefits**:
- Clear separation of concerns (loan vs borrower vs property)
- Consistent naming conventions
- Extensible (can add co-borrower as separate object)
- Encapsulated logic (LTV calculated in Loan class)
- Better alignment with industry standards

### Migration Mapping

| Legacy Attribute | ODM Attribute | Notes |
|------------------|---------------|-------|
| `loanAmount` | `loan.loanAmount` | Direct mapping |
| `propertyValue` | `loan.propertyValue` | Direct mapping |
| `FICO` | `borrower.creditScore` | Renamed for clarity |
| `DTI` | `borrower.dti` | Moved to borrower context |
| `propertyType` | `property.propertyType` | Moved to property context |
| `state` | `property.state` | Moved to property context |
| `bankruptcyFlag` | `borrower.bankruptcyFlag` | Moved to borrower context |
| `loanPurpose` | `loan.loanPurpose` | Direct mapping |
| `LTV` (calculated) | `loan.loanToValue` | Now a derived attribute |

## Extensibility

The normalized model supports future enhancements:

### Co-Borrower Support
```java
public class LoanApplication {
    private Loan loan;
    private Borrower primaryBorrower;
    private Borrower coBorrower; // New field
    private Property property;
}
```

### Multiple Properties
```java
public class Loan {
    private List<Property> properties; // For multi-unit loans
}
```

### Historical Data
```java
public class Borrower {
    private List<CreditEvent> creditHistory; // Detailed credit events
}
```

## Validation Rules

The XOM includes validation logic to ensure data integrity:

```java
public class Loan {
    public void validate() {
        if (loanAmount <= 0) {
            throw new ValidationException("Loan amount must be positive");
        }
        if (propertyValue <= 0) {
            throw new ValidationException("Property value must be positive");
        }
        if (getLoanToValue() > 100) {
            throw new ValidationException("LTV cannot exceed 100%");
        }
    }
}
```

## Best Practices

### Rule Authoring
1. **Use business terminology**: Write rules using BOM verbalizations, not XOM class names
2. **Leverage derived attributes**: Use `loan.loanToValue` instead of recalculating in rules
3. **Group related conditions**: Use object navigation (e.g., `borrower.creditScore`) for clarity
4. **Avoid magic numbers**: Define constants in BOM (e.g., `MAX_LTV = 97`)

### Model Maintenance
1. **Version BOM changes**: Increment version when adding/removing attributes
2. **Maintain backward compatibility**: Deprecated attributes should remain for one version
3. **Document business meaning**: Add descriptions to all BOM attributes
4. **Test XOM mappings**: Ensure BOM-to-XOM mappings work correctly

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-02 | Initial BOM/XOM definition for ODM migration |

---

**Document Owner**: Business Analysis & IT Architecture Teams  
**Last Updated**: 2026-03-02  
**Review Cycle**: Quarterly