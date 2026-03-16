# Interactive Dashboard User Guide

## 🎯 Quick Start

This dashboard helps you explore the migration from legacy PERL rules to IBM Operational Decision Manager (ODM). No installation required - everything runs in your browser!

---

## 📋 Tab Overview

### 1. **Rule Comparison** Tab

**What it does:** Shows legacy PERL rules side-by-side with ODM design documentation.

**How to use:**
1. Select a rule category from the dropdown (Underwriting, Pricing, etc.)
2. Left panel shows the original PERL code with syntax highlighting
3. Right panel shows the corresponding ODM design documentation
4. The ODM documentation automatically filters to show only relevant sections

**Key insights:**
- See how 34 legacy PERL rules are being consolidated into 3 decision tables + 17 action rules
- Understand the mapping between old and new rule formats
- Review the modernization strategy for each rule category

---

### 2. **Test Cases** Tab

**What it does:** Interactive testing of the simulated ODM decision engine.

**How to use:**
1. Select a test case from the dropdown (60 real loan applications available)
2. Review the loan input data (JSON format)
3. See the expected decision from the legacy system
4. Click **"▶️ Run Simulation"** to execute the ODM rules
5. Compare simulated vs expected results
6. Click **"👁️ Show Rule Trace"** to see which rules fired

**What you'll see:**
- **Input Panel:** Loan application data (credit score, LTV, DTI, property type, etc.)
- **Expected Decision:** What the legacy PERL system would decide
- **Simulated Decision:** What the new ODM system decides
- **Comparison:** Field-by-field comparison with ✓ (match) or ✗ (mismatch) indicators
- **Rule Trace:** Execution log showing which rules fired and in what order

**Understanding the results:**
- ✅ **Green (Match):** Simulated decision matches expected - parity achieved!
- ❌ **Red (Mismatch):** Difference detected - may need investigation
- **Execution Time:** How fast the decision was made (typically < 5ms)
- **Rules Fired:** Number of rules that executed (varies by scenario)

---

## 🧪 Test Case Examples

### Decline Scenarios
- **loan_app_001.json** - Credit score too low (< 620)
- **loan_app_003.json** - LTV too high (> 97%)
- **loan_app_005.json** - DTI too high (> 50%)

### Approval Scenarios
- **loan_app_020+** - Most cases from 020 onwards are approvals
- These will show pricing calculations (MI rate in basis points)
- Documentation requirements will be listed

### Edge Cases
- Investment properties (different LTV limits)
- ARM products (different pricing)
- High balance loans (> $647,200)
- Manufactured homes, condos, etc.

---

## 🔍 Understanding the Decision Flow

The simulator executes rules in this order:

1. **Exception Rules** (Priority 1000)
   - Bankruptcy, foreclosure, fraud checks
   - If triggered → immediate decline

2. **Eligibility Rules** (Priority 100-50)
   - Credit score, LTV, DTI checks
   - Property type restrictions
   - If any fail → decline with reason

3. **Pricing Rules** (Priority 100-65)
   - Only runs if approved
   - Calculates MI rate based on risk factors
   - Applies adjustments for property type, loan purpose, etc.

4. **Documentation Rules** (Priority 50-44)
   - Determines required documents
   - Based on loan characteristics and borrower profile

---

## 💡 Tips & Tricks

### Rule Comparison Tab
- **Copy Code:** Use the 📋 button to copy PERL code to clipboard
- **Responsive:** On mobile, panels stack vertically for easier reading
- **Category Filtering:** ODM docs automatically show only relevant sections

### Test Cases Tab
- **Navigation:** Use Previous/Next buttons or dropdown to browse cases
- **Quick Testing:** Run simulation on multiple cases to spot patterns
- **Rule Trace:** Essential for debugging - shows exact execution path
- **Copy Input:** Use 📋 button to copy loan data for external testing

---

## 📊 Key Metrics to Watch

- **Parity Rate:** How many test cases match expected results
- **Execution Speed:** Decision time (should be < 10ms)
- **Rules Fired:** Typical range is 5-15 rules per decision
- **MI Rates:** For approved loans, typically 25-150 basis points

---

## 🎓 Understanding the Migration

### Why Migrate from PERL to ODM?

**Legacy PERL System:**
- ❌ Hard to maintain (custom DSL)
- ❌ No visual rule editing
- ❌ Limited testing capabilities
- ❌ Difficult to audit changes

**Modern ODM System:**
- ✅ Industry-standard platform
- ✅ Visual decision tables
- ✅ Built-in testing & simulation
- ✅ Version control & governance
- ✅ Better performance & scalability

### Migration Goals

1. **100% Functional Parity** - All decisions must match
2. **Improved Maintainability** - Easier to update rules
3. **Better Governance** - Track who changed what and when
4. **Enhanced Testing** - Comprehensive test coverage
5. **Simplified Structure** - Consolidate redundant rules

---

## 🚀 Next Steps

After exploring the dashboard:

1. **Review Parity Report** (Coming in Phase 5)
   - See overall match rates
   - Identify any mismatches
   - View detailed analytics

2. **Test Edge Cases**
   - Try different loan scenarios
   - Verify business logic is correct
   - Document any discrepancies

3. **Stakeholder Review**
   - Share dashboard with business users
   - Gather feedback on rule mappings
   - Validate decision logic

---

## ❓ FAQ

**Q: Does this connect to a real ODM server?**
A: No, the decision logic runs entirely in your browser using JavaScript. It simulates ODM behavior for demonstration purposes.

**Q: Can I add my own test cases?**
A: Currently, the dashboard uses the 60 pre-loaded test cases. To add more, place JSON files in `legacy_perl/samples/` and restart the server.

**Q: Why do some simulations show mismatches?**
A: This is expected during development. Mismatches help identify areas where the ODM rules need adjustment to match legacy behavior.

**Q: How accurate is the simulation?**
A: The simulator implements the same rule logic as documented in the PERL files. It's designed to be functionally equivalent to the legacy system.

**Q: Can I export the results?**
A: The Parity Report (Phase 5) will include export functionality for detailed analysis.

---

## 🛠️ Technical Details

**Technology Stack:**
- Vanilla JavaScript (ES6+)
- No build tools required
- Runs on Python's built-in HTTP server
- All processing happens in the browser

**Browser Requirements:**
- Modern browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- No plugins required

**Performance:**
- Initial load: ~1-2 seconds (loads 5 rule files)
- Test case load: ~2-3 seconds (loads 60 JSON files + CSV)
- Decision simulation: < 5ms per case
- Smooth 60fps animations

---

## 📞 Support

For questions or issues:
1. Check the browser console (F12) for error messages
2. Verify the Python server is running on port 8000
3. Try a hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
4. Review the technical documentation in `dashboard_technical_plan.md`

---

**Made with ❤️ by Bob - Your AI Software Engineer**

*Last Updated: 2026-03-16*