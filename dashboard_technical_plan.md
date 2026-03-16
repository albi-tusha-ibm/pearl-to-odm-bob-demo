# Interactive Web Dashboard - Technical Design Document
## Perl-to-ODM Migration Demo

**Version:** 1.0  
**Date:** 2026-03-16  
**Project:** perl-to-odm-bob-demo  
**Estimated Implementation:** 2-3 days

---

## Executive Summary

This document provides a comprehensive technical design for transforming the perl-to-odm-bob-demo from a file-based exploration project into an interactive web dashboard. The dashboard will enable stakeholders to visually explore the migration from legacy PERL rules to ODM, compare rule implementations side-by-side, test loan scenarios interactively, and view parity metrics—all through a lightweight, zero-deployment web interface.

**Key Design Principles:**
- **Simplicity First**: Minimal dependencies, static file serving
- **Zero Backend**: All logic runs in the browser
- **Maintainability**: Clear separation of concerns, modular architecture
- **Performance**: Lazy loading, efficient data structures
- **Accessibility**: Responsive design, keyboard navigation

---

## 1. Technology Stack Decision

### 1.1 Recommended Stack

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| **Frontend Framework** | Vanilla JavaScript (ES6+) | Zero build step, no framework lock-in, perfect for static hosting, immediate browser compatibility |
| **UI Components** | Custom Web Components | Native browser support, reusable, encapsulated, no library needed |
| **Styling** | CSS3 with CSS Variables | Modern, maintainable, theme-able, no preprocessor needed |
| **Syntax Highlighting** | Prism.js (CDN) | Lightweight (2KB gzipped), supports PERL and JSON, CDN-hosted |
| **Data Visualization** | Chart.js (CDN) | Simple API, responsive, 11KB gzipped, perfect for metrics |
| **Module System** | ES6 Modules | Native browser support, no bundler required |
| **Local Server** | Python http.server | Already available (Python 3.8+ required), one-line command |
| **Build Tools** | None | Static files only, no build process |

### 1.2 Alternative Considered (Not Recommended)

**React/Vue/Svelte**: While these frameworks offer excellent developer experience, they introduce:
- Build complexity (webpack/vite configuration)
- Node.js dependency
- Larger bundle sizes
- Deployment complexity
- Overkill for this use case

**Verdict**: Vanilla JS with Web Components provides the perfect balance of simplicity and capability for this project.

### 1.3 Dependencies (CDN-Hosted)

```html
<!-- Syntax Highlighting -->
<link href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/prism.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-perl.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-json.min.js"></script>

<!-- Data Visualization -->
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

**Total External Dependencies**: 2 libraries, ~50KB total (gzipped), CDN-cached

---

## 2. Architecture Design

### 2.1 Directory Structure

```
perl-to-odm-bob-demo/
├── dashboard/                          # New dashboard directory
│   ├── index.html                      # Main entry point
│   ├── assets/
│   │   ├── css/
│   │   │   ├── main.css               # Global styles
│   │   │   ├── components.css         # Component-specific styles
│   │   │   ├── syntax-theme.css       # Code highlighting theme
│   │   │   └── responsive.css         # Media queries
│   │   ├── js/
│   │   │   ├── app.js                 # Application entry point
│   │   │   ├── components/
│   │   │   │   ├── RuleViewer.js      # Side-by-side rule comparison
│   │   │   │   ├── TestCaseExplorer.js # Test case selector & viewer
│   │   │   │   ├── ParityReport.js    # Parity metrics dashboard
│   │   │   │   ├── DecisionEngine.js  # Simulated ODM engine
│   │   │   │   └── Navigation.js      # Tab navigation component
│   │   │   ├── services/
│   │   │   │   ├── DataLoader.js      # Loads JSON/CSV/PERL files
│   │   │   │   ├── RuleParser.js      # Parses PERL rules
│   │   │   │   ├── DecisionSimulator.js # Executes decision logic
│   │   │   │   └── ParityCalculator.js # Computes parity metrics
│   │   │   └── utils/
│   │   │       ├── csvParser.js       # CSV parsing utility
│   │   │       ├── formatters.js      # Data formatting helpers
│   │   │       └── constants.js       # App-wide constants
│   │   └── images/
│   │       ├── logo.svg               # IBM Bob logo
│   │       └── icons/                 # UI icons
│   ├── data/                          # Symlinks or copies of project data
│   │   ├── rules/                     # -> ../../legacy_perl/rules/
│   │   ├── samples/                   # -> ../../legacy_perl/samples/
│   │   ├── tables/                    # -> ../../legacy_perl/tables/
│   │   └── design/                    # -> ../../odm_target/design/
│   └── README.md                      # Dashboard documentation
├── start_dashboard.sh                 # Quick-start script (Unix)
├── start_dashboard.bat                # Quick-start script (Windows)
└── [existing project files...]
```

### 2.2 Component Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        index.html                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Navigation Component                      │  │
│  │  [Overview] [Rules] [Test Cases] [Parity] [About]    │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Active View Container                 │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  RuleViewer Component (Rules Tab)               │  │  │
│  │  │  ┌──────────────┐  ┌──────────────┐            │  │  │
│  │  │  │ PERL Rules   │  │ ODM Design   │            │  │  │
│  │  │  │ (Syntax HL)  │  │ (Markdown)   │            │  │  │
│  │  │  └──────────────┘  └──────────────┘            │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  TestCaseExplorer Component (Test Cases Tab)   │  │  │
│  │  │  ┌──────────────────────────────────────────┐  │  │  │
│  │  │  │ Dropdown: loan_app_001.json ▼           │  │  │  │
│  │  │  └──────────────────────────────────────────┘  │  │  │
│  │  │  ┌──────────────┐  ┌──────────────┐          │  │  │
│  │  │  │ Input Data   │  │ Expected     │          │  │  │
│  │  │  │ (JSON)       │  │ Decision     │          │  │  │
│  │  │  └──────────────┘  └──────────────┘          │  │  │
│  │  │  ┌──────────────────────────────────────────┐  │  │  │
│  │  │  │ [Run Simulation] Button                  │  │  │  │
│  │  │  └──────────────────────────────────────────┘  │  │  │
│  │  │  ┌──────────────────────────────────────────┐  │  │  │
│  │  │  │ Simulated ODM Decision Output            │  │  │  │
│  │  │  └──────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  ParityReport Component (Parity Tab)           │  │  │
│  │  │  - Overall match rate with progress bar        │  │  │
│  │  │  - Category breakdown chart                    │  │  │
│  │  │  - Mismatch details table                      │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Data Flow

```
Application Startup
        ↓
┌─────────────────────────────────────┐
│      DataLoader Service             │
│  - Load expected_decisions.csv      │
│  - Load loan_app_*.json (60 files)  │
│  - Load PERL rules (5 files)        │
│  - Load ODM design docs (6 files)   │
│  - Load pricing/LTV tables          │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│      RuleParser Service             │
│  - Parse PERL rules                 │
│  - Extract rule metadata            │
│  - Build execution graph            │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│   State Management (Plain JS)       │
│  {                                  │
│    rules: {...},                    │
│    testCases: {...},                │
│    expectedDecisions: [...],        │
│    currentView: "overview",         │
│    selectedTestCase: null,          │
│    simulationResults: null          │
│  }                                  │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│    Component Rendering              │
│  - Subscribe to state changes       │
│  - Re-render on updates             │
│  - Handle user interactions         │
└─────────────────────────────────────┘

User Interaction Flow:
User Action → State Update → Component Re-render → UI Update
```

### 2.4 State Management Strategy

**Approach**: Simple observer pattern with plain JavaScript

```javascript
// state.js
class AppState {
  constructor() {
    this.state = {
      rules: {},
      testCases: {},
      expectedDecisions: [],
      odmDesign: {},
      currentView: 'overview',
      selectedTestCase: null,
      simulationResults: null,
      parityMetrics: null
    };
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach(listener => listener(this.state));
  }

  getState() {
    return this.state;
  }
}

export const appState = new AppState();
```

---

## 3. Core Features Specification

### 3.1 Feature 1: Side-by-Side Rule Comparison Viewer

**Purpose**: Compare legacy PERL rules with ODM design documentation

**UI Components**:
- Rule category dropdown (Underwriting, Pricing, Exceptions, Documentation)
- Split-pane layout with synchronized scrolling
- Syntax-highlighted PERL code (left pane)
- Markdown-rendered ODM design (right pane)
- Search/filter functionality
- Copy-to-clipboard buttons

**Data Sources**:
- `legacy_perl/rules/*.perl`
- `odm_target/design/mappings_perl_to_odm.md`
- `odm_target/design/decision_service_arch.md`

**Key Features**:
- Line numbers for easy reference
- Collapsible rule sections
- Highlight matching rules between PERL and ODM
- Export comparison as PDF/HTML

### 3.2 Feature 2: Interactive Test Case Explorer

**Purpose**: Select test cases, view input data, and simulate ODM decisions

**UI Components**:
- Test case dropdown selector (loan_app_001 through loan_app_060)
- Previous/Next navigation buttons
- JSON viewer with syntax highlighting
- Expected decision display
- "Run Simulation" button
- Simulated decision output panel
- Match/mismatch indicator
- Rules fired trace

**Workflow**:
1. User selects test case from dropdown
2. System displays loan input data (JSON)
3. System displays expected decision from CSV
4. User clicks "Run Simulation"
5. DecisionSimulator executes rules
6. System displays simulated decision
7. System compares simulated vs expected
8. System shows match/mismatch status

**Data Sources**:
- `legacy_perl/samples/loan_app_*.json` (60 files)
- `legacy_perl/samples/expected_decisions.csv`
- `legacy_perl/tables/pricing_matrix.csv`
- `legacy_perl/tables/ltv_thresholds.csv`

### 3.3 Feature 3: Simulated ODM Decision Engine

**Purpose**: Execute decision logic in browser to simulate ODM behavior

**Implementation Strategy**:

The decision simulator implements rule logic in JavaScript, following the execution order:

1. **Exception Rules** (Priority 1000)
2. **Eligibility Rules** (Priority 500)
3. **Pricing Rules** (Priority 100)
4. **Documentation Rules** (Priority 50)

**Rule Execution Algorithm**:

```javascript
class DecisionSimulator {
  simulate(loanData) {
    const decision = {
      eligibility: { result: null, reason: null, flags: [] },
      pricing: { miRateBps: null },
      documentation: { requiredDocs: [] },
      rulesFired: [],
      executionTime: 0
    };

    const startTime = performance.now();

    // 1. Exception Rules
    this.executeExceptionRules(loanData, decision);
    if (decision.eligibility.result === 'decline') {
      decision.executionTime = performance.now() - startTime;
      return decision;
    }

    // 2. Eligibility Rules
    this.executeEligibilityRules(loanData, decision);
    if (decision.eligibility.result === 'decline') {
      decision.executionTime = performance.now() - startTime;
      return decision;
    }

    // 3. Pricing Rules (only if approved)
    if (decision.eligibility.result === 'approve') {
      this.executePricingRules(loanData, decision);
    }

    // 4. Documentation Rules
    if (decision.eligibility.result !== 'decline') {
      this.executeDocumentationRules(loanData, decision);
    }

    decision.executionTime = performance.now() - startTime;
    return decision;
  }
}
```

**Key Implementation Details**:
- Rules execute in priority order (highest first)
- Short-circuit on decline/refer
- Pricing tables loaded from CSV
- Documentation logic based on conditions
- Flags accumulated throughout execution

### 3.4 Feature 4: Visual Parity Report

**Purpose**: Display parity metrics comparing simulated vs expected decisions

**UI Components**:
- Overall match rate with progress bar
- Pass/fail indicator (≥95% threshold)
- Category breakdown chart (Chart.js)
- Detailed mismatch table
- Export functionality (CSV download)

**Metrics Calculated**:
- Overall match rate (complete case matches)
- Eligibility match rate (60/60 cases)
- Pricing match rate (approved cases only)
- Documentation match rate (non-declined cases)
- Flags match rate (when flags present)

**Visual Elements**:
- Horizontal bar chart for category breakdown
- Color-coded indicators (green=pass, red=fail)
- Sortable/filterable mismatch table
- Drill-down to specific test case

**Data Sources**:
- Simulated decisions (from DecisionSimulator)
- Expected decisions (from expected_decisions.csv)

### 3.5 Feature 5: Navigation and User Flow

**Tab Structure**:

1. **Overview Tab** (Default)
   - Project introduction
   - Quick stats (60 test cases, 33 rules, 95% parity)
   - Getting started guide
   - Architecture diagram

2. **Rules Tab**
   - Side-by-side rule comparison
   - Rule category selector
   - Search/filter functionality

3. **Test Cases Tab**
   - Interactive test case explorer
   - Decision simulation
   - Match/mismatch indicators

4. **Parity Tab**
   - Visual parity report
   - Metrics dashboard
   - Mismatch analysis

5. **About Tab**
   - Project background
   - Technology stack
   - Links to documentation
   - IBM Bob information

**Navigation Features**:
- Tab-based navigation (keyboard accessible)
- URL hash routing (e.g., `#/rules`, `#/test-cases`)
- Breadcrumb navigation
- Back/forward browser button support
- Responsive mobile menu

---

## 4. Implementation Approach

### 4.1 Parsing PERL Rules

**Challenge**: PERL rules are in a custom DSL format

**Solution**: Custom parser that extracts rule metadata

```javascript
class RuleParser {
  parseRuleFile(perlContent) {
    const rules = [];
    const ruleRegex = /RULE\s+"([^"]+)"\s+PRIORITY\s+(\d+)\s+EFFECT\s+(\w+)\s+WHEN\s+([\s\S]+?)\s+THEN\s+([\s\S]+?)\s+END/g;
    
    let match;
    while ((match = ruleRegex.exec(perlContent)) !== null) {
      rules.push({
        id: match[1],
        priority: parseInt(match[2]),
        effect: match[3],
        conditions: this.parseConditions(match[4]),
        actions: this.parseActions(match[5]),
        rawWhen: match[4].trim(),
        rawThen: match[5].trim()
      });
    }
    
    return rules;
  }
}
```

**Display Strategy**:
- Prism.js for syntax highlighting
- Custom CSS for PERL-DSL keywords
- Line numbers for easy reference
- Collapsible rule sections

### 4.2 Simulating ODM Decisions

**Approach**: Implement rule logic in JavaScript following priority order

**Key Implementation**:
- Rule priority execution (highest first)
- Short-circuit on decline/refer
- Pricing table lookups from CSV
- Documentation conditional logic
- Flag accumulation

**Example Eligibility Rule**:

```javascript
executeEligibilityRules(loanData, decision) {
  // ELG-001: Credit Score Minimum
  if (loanData.borrower.creditScore < 620) {
    decision.eligibility.result = 'decline';
    decision.eligibility.reason = 'Credit score below minimum threshold';
    decision.eligibility.flags.push('CREDIT_DECLINE');
    decision.rulesFired.push('ELG-001');
    return;
  }

  // ELG-002: Maximum LTV
  if (loanData.loan.ltv > 97) {
    decision.eligibility.result = 'decline';
    decision.eligibility.reason = 'LTV exceeds maximum allowable 97%';
    decision.eligibility.flags.push('LTV_DECLINE');
    decision.rulesFired.push('ELG-002');
    return;
  }

  // ... continue for all eligibility rules
}
```

### 4.3 Generating Parity Metrics

**Approach**: Compare simulated decisions field-by-field against expected

```javascript
class ParityCalculator {
  calculateParity(simulatedDecisions, expectedDecisions) {
    const metrics = {
      overall: { matches: 0, total: 0 },
      eligibility: { matches: 0, total: 0 },
      pricing: { matches: 0, total: 0 },
      documentation: { matches: 0, total: 0 },
      flags: { matches: 0, total: 0 },
      mismatches: []
    };

    for (const expected of expectedDecisions) {
      const simulated = simulatedDecisions.find(s => s.file === expected.file);
      if (!simulated) continue;

      metrics.overall.total++;
      let caseMatches = true;

      // Compare eligibility
      metrics.eligibility.total++;
      if (simulated.eligibility.result === expected['eligibility.result']) {
        metrics.eligibility.matches++;
      } else {
        caseMatches = false;
        metrics.mismatches.push({
          file: expected.file,
          field: 'eligibility.result',
          expected: expected['eligibility.result'],
          actual: simulated.eligibility.result
        });
      }

      // Compare pricing, documentation, flags...

      if (caseMatches) {
        metrics.overall.matches++;
      }
    }

    return metrics;
  }
}
```

### 4.4 Syntax Highlighting Strategy

**Approach**: Prism.js with custom PERL-DSL grammar

```javascript
// Custom Prism.js language definition
Prism.languages['perl-dsl'] = {
  'comment': /#.*/,
  'keyword': /\b(RULE|WHEN|THEN|END|ACTION|SET|FLAG|PRIORITY|EFFECT|AND|OR|IN)\b/,
  'string': /"(?:\\.|[^\\"])*"/,
  'number': /\b\d+(?:\.\d+)?\b/,
  'operator': /[<>=!]+|=/,
  'punctuation': /[{}[\];(),.:]/,
  'property': /\b\w+\.\w+\b/
};
```

### 4.5 Responsive Design

**Breakpoints**:
- Mobile: < 768px (single column, stacked views)
- Tablet: 768px - 1024px (side-by-side with scroll)
- Desktop: > 1024px (full side-by-side layout)

**Mobile Optimizations**:
- Hamburger menu for navigation
- Collapsible sections
- Touch-friendly buttons (min 44px)
- Horizontal scroll for code blocks
- Simplified charts

**CSS Strategy**:
```css
/* Mobile-first approach */
.rule-viewer {
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .rule-viewer {
    flex-direction: row;
  }
  
  .rule-panel {
    width: 50%;
  }
}
```

---

## 5. Integration Points

### 5.1 Leveraging Existing Python Tools

**Strategy**: Python tools remain CLI-only; dashboard is independent

**Integration Options**:

1. **Option A: No Integration** (Recommended)
   - Dashboard is fully self-contained
   - Python tools remain CLI-only
   - No backend required
   - Perfect for demo purposes

2. **Option B: Optional Backend** (Future Enhancement)
   - Add Flask/FastAPI server
   - Expose parity_check.py as REST endpoint
   - Requires Python backend deployment

**Recommendation**: Start with Option A (no integration)

### 5.2 Data File Structure

**Current Structure**: Files are already web-friendly (JSON, CSV, Markdown)

**Required Changes**: None! Files can be loaded directly via `fetch()` API

**Data Loading Strategy**:

```javascript
class DataLoader {
  async loadAllData() {
    const [rules, testCases, expectedDecisions, odmDesign, tables] = 
      await Promise.all([
        this.loadRules(),
        this.loadTestCases(),
        this.loadExpectedDecisions(),
        this.loadODMDesign(),
        this.loadTables()
      ]);

    return { rules, testCases, expectedDecisions, odmDesign, tables };
  }

  async loadRules() {
    const ruleFiles = [
      'underwriting.perl',
      'pricing.perl',
      'exceptions.perl',
      'docs_required.perl',
      'ruleflow.perl'
    ];

    const rules = {};
    for (const file of ruleFiles) {
      const response = await fetch(`data/rules/${file}`);
      const content = await response.text();
      const category = file.replace('.perl', '');
      rules[category] = content;
    }

    return rules;
  }

  async loadTestCases() {
    const testCases = {};
    for (let i = 1; i <= 60; i++) {
      const filename = `loan_app_${String(i).padStart(3, '0')}.json`;
      const response = await fetch(`data/samples/${filename}`);
      const data = await response.json();
      testCases[filename] = data;
    }

    return testCases;
  }
}
```

**CORS Considerations**:
- Files must be served via HTTP (not `file://`)
- Use Python's `http.server`
- No CORS issues when serving from same origin

### 5.3 Quick-Start Scripts

**Unix/Linux/macOS** (`start_dashboard.sh`):

```bash
#!/bin/bash
echo "=========================================="
echo "Perl-to-ODM Interactive Dashboard"
echo "=========================================="

# Check Python availability
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is required but not found."
    exit 1
fi

# Create symlinks if needed
if [ ! -d "dashboard/data" ]; then
    echo "Creating data symlinks..."
    mkdir -p dashboard/data
    ln -s ../../legacy_perl/rules dashboard/data/rules
    ln -s ../../legacy_perl/samples dashboard/data/samples
    ln -s ../../legacy_perl/tables dashboard/data/tables
    ln -s ../../odm_target/design dashboard/data/design
    echo "✓ Data symlinks created"
fi

# Start server
echo ""
echo "Starting local web server..."
echo "Dashboard: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd dashboard && python3 -m http.server 8000
```

**Windows** (`start_dashboard.bat`):

```batch
@echo off
echo ==========================================
echo Perl-to-ODM Interactive Dashboard
echo ==========================================
echo.

REM Check Python availability
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python 3 is required but not found.
    exit /b 1
)

REM Create data directory if needed
if not exist "dashboard\data" (
    echo Creating data directory...
    mkdir dashboard\data
    mklink /D dashboard\data\rules ..\..\legacy_perl\rules
    mklink /D dashboard\data\samples ..\..\legacy_perl\samples
    mklink /D dashboard\data\tables ..\..\legacy_perl\tables
    mklink /D dashboard\data\design ..\..\odm_target\design
    echo Data links created
)

echo.
echo Starting local web server...
echo Dashboard: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.

cd dashboard
python -m http.server 8000
```

---

## 6. Implementation Phases and Milestones

### Phase 1: Foundation (Day 1, Morning - 4 hours)

**Milestone**: Basic dashboard structure with navigation

**Tasks**:
- [ ] Create directory structure
- [ ] Set up `index.html` with basic layout
- [ ] Implement Navigation component
- [ ] Create CSS framework (main.css, components.css)
- [ ] Set up state management (AppState class)
- [ ] Create DataLoader service skeleton
- [ ] Implement quick-start scripts

**Deliverables**:
- Working dashboard skeleton
- Tab navigation functional
- Basic styling in place
- Server can be started with script

**Estimated Effort**: 4 hours

---

### Phase 2: Data Loading and Parsing (Day 1, Afternoon - 4 hours)

**Milestone**: All project data loaded and parsed

**Tasks**:
- [ ] Implement DataLoader.loadRules()
- [ ] Implement DataLoader.loadTestCases()
- [ ] Implement DataLoader.loadExpectedDecisions()
- [ ] Implement DataLoader.loadODMDesign()
- [ ] Implement DataLoader.loadTables()
- [ ] Create RuleParser service
- [ ] Implement PERL rule parsing logic
- [ ] Create CSV parser utility
- [ ] Test data loading with all 60 test cases

**Deliverables**:
- All data files loaded successfully
- PERL rules parsed into structured format
- CSV data accessible
- Console logs confirm data integrity

**Estimated Effort**: 4 hours

---

### Phase 3: Rule Viewer Component (Day 2, Morning - 4 hours)

**Milestone**: Side-by-side rule comparison working

**Tasks**:
- [ ] Create RuleViewer component
- [ ] Implement rule category selector
- [ ] Set up split-pane layout
- [ ] Integrate Prism.js for syntax highlighting
- [ ] Implement markdown rendering for ODM docs
- [ ] Add synchronized scrolling
- [ ] Style code panels
- [ ] Add copy-to-clipboard functionality

**Deliverables**:
- Rules tab fully functional
- PERL rules displayed with syntax highlighting
- ODM design docs rendered
- Category switching works
- Responsive layout

**Estimated Effort**: 4 hours

---

### Phase 4: Decision Simulator (Day 2, Afternoon - 4 hours)

**Milestone**: ODM decision logic executing in browser

**Tasks**:
- [ ] Create DecisionSimulator service
- [ ] Implement executeEligibilityRules()
- [ ] Implement executePricingRules()
- [ ] Implement executeDocumentationRules()
- [ ] Implement executeExceptionRules()
- [ ] Create pricing table lookup logic
- [ ] Add rule execution tracing
- [ ] Test against all 60 test cases
- [ ] Validate accuracy against expected_decisions.csv

**Deliverables**:
- Decision simulator fully functional
- All rule categories implemented
- Execution trace available
- Initial parity validation complete

**Estimated Effort**: 4 hours

---

### Phase 5: Test Case Explorer (Day 3, Morning - 3 hours)

**Milestone**: Interactive test case exploration working

**Tasks**:
- [ ] Create TestCaseExplorer component
- [ ] Implement test case dropdown selector
- [ ] Add Previous/Next navigation
- [ ] Display loan input data (JSON viewer)
- [ ] Display expected decision
- [ ] Add "Run Simulation" button
- [ ] Display simulated decision output
- [ ] Show match/mismatch indicator
- [ ] Display rules fired trace
- [ ] Style all panels

**Deliverables**:
- Test Cases tab fully functional
- Users can select and simulate any test case
- Match/mismatch clearly indicated
- Rules fired visible

**Estimated Effort**: 3 hours

---

### Phase 6: Parity Report (Day 3, Afternoon - 3 hours)

**Milestone**: Visual parity metrics dashboard complete

**Tasks**:
- [ ] Create ParityReport component
- [ ] Implement ParityCalculator service
- [ ] Calculate overall match rate
- [ ] Calculate category breakdowns
- [ ] Integrate Chart.js for visualizations
- [ ] Create mismatch details table
- [ ] Add export functionality (CSV download)
- [ ] Style metrics dashboard
- [ ] Add drill-down to test cases

**Deliverables**:
- Parity tab fully functional
- Metrics calculated and displayed
- Charts rendering correctly
- Mismatch table sortable/filterable
- Export working

**Estimated Effort**: 3 hours

---

### Phase 7: Polish and Documentation (Day 3, Evening - 2 hours)

**Milestone**: Production-ready dashboard

**Tasks**:
- [ ] Create Overview tab content
- [ ] Create About tab content
- [ ] Add loading indicators
- [ ] Implement error handling
- [ ] Add keyboard shortcuts
- [ ] Test responsive design (mobile/tablet)
- [ ] Write dashboard README.md
- [ ] Add inline help/tooltips
- [ ] Performance optimization
- [ ] Cross-browser testing

**Deliverables**:
- All tabs complete
- Documentation written
- Error handling robust
- Mobile-friendly
- Performance optimized

**Estimated Effort**: 2 hours

---

### Total Estimated Effort: 24 hours (3 days)

**Breakdown by Day**:
- **Day 1**: Foundation + Data Loading (8 hours)
- **Day 2**: Rule Viewer + Decision Simulator (8 hours)
- **Day 3**: Test Explorer + Parity Report + Polish (8 hours)

---

## 7. Risk Assessment and Mitigation

### Risk 1: PERL Parsing Complexity

**Risk**: PERL-DSL syntax may have edge cases not covered by regex parser

**Likelihood**: Medium  
**Impact**: Medium

**Mitigation**:
- Start with simple regex patterns
- Test against all 5 rule files
- Add special case handling as needed
- Fall back to displaying raw text if parsing fails

---

### Risk 2: Decision Logic Accuracy

**Risk**: JavaScript simulation may not perfectly match legacy PERL behavior

**Likelihood**: Medium  
**Impact**: High

**Mitigation**:
- Implement rules exactly as documented
- Test against all 60 test cases
- Compare results with expected_decisions.csv
- Document any intentional differences
- Target ≥95% parity (acceptable threshold)

---

### Risk 3: Browser Compatibility

**Risk**: ES6 modules and modern JavaScript may not work in older browsers

**Likelihood**: Low  
**Impact**: Medium

**Mitigation**:
- Target modern browsers (Chrome, Firefox, Safari, Edge)
- Add browser compatibility notice
- Test in multiple browsers
- Provide fallback for older browsers (graceful degradation)

---

### Risk 4: Performance with 60 Test Cases

**Risk**: Loading and processing 60 JSON files may be slow

**Likelihood**: Low  
**Impact**: Low

**Mitigation**:
- Use Promise.all() for parallel loading
- Implement lazy loading for test cases
- Cache parsed data in memory
- Add loading indicators
- Optimize data structures

---

## 8. Success Criteria

### Functional Requirements

- [ ] All 5 PERL rule files displayed with syntax highlighting
- [ ] All 6 ODM design documents rendered
- [ ] All 60 test cases loadable and viewable
- [ ] Decision simulator executes all rule categories
- [ ] Parity metrics calculated and displayed
- [ ] ≥95% parity achieved between simulated and expected decisions
- [ ] All navigation tabs functional
- [ ] Responsive design works on mobile/tablet/desktop

### Non-Functional Requirements

- [ ] Dashboard loads in < 3 seconds
- [ ] Decision simulation completes in < 100ms per case
- [ ] No build step required
- [ ] Works with Python http.server only
- [ ] Zero backend dependencies
- [ ] Total external dependencies < 100KB (gzipped)
- [ ] Works offline after initial load (CDN cached)

### User Experience Requirements

- [ ] Intuitive navigation
- [ ] Clear visual feedback
- [ ] Helpful error messages
- [ ] Keyboard accessible
- [ ] Mobile-friendly
- [ ] Professional appearance

---

## 9. Future Enhancements (Out of Scope)

### Phase 2 Enhancements (Post-MVP)

1. **Advanced Search**
   - Full-text search across rules
   - Filter by rule ID, priority, effect
   - Search within test cases

2. **Rule Editing**
   - In-browser rule editor
   - Syntax validation
   - Live preview of changes

3. **Batch Simulation**
   - Run all 60 test cases at once
   - Progress indicator
   - Bulk export results

4. **Custom Test Cases**
   - User can create new test cases
   - Form-based loan data entry
   - Save custom scenarios

5. **Export Functionality**
   - Export parity report as PDF
   - Export rule comparison as HTML
   - Download simulation results as JSON

6. **Backend Integration**
   - Optional Flask/FastAPI server
   - Real-time parity validation
   - Integration with actual ODM instance

7. **Visualization Enhancements**
   - Rule dependency graph
   - Decision tree visualization
   - Interactive flow diagrams

8. **Collaboration Features**
   - Share specific test cases via URL
   - Annotate rules with comments
   - Export findings for review

---

## 10. Deployment Strategy

### Local Development

```bash
# Clone repository
git clone <repository-url>
cd perl-to-odm-bob-demo

# Start dashboard
./start_dashboard.sh

# Open browser
open http://localhost:8000
```

### Static Hosting Options

1. **GitHub Pages**
   - Push dashboard/ to gh-pages branch
   - Enable GitHub Pages in repository settings
   - Access at: `https://username.github.io/perl-to-odm-bob-demo/`

2. **Netlify**
   - Connect repository to Netlify
   - Set publish directory to `dashboard/`
   - Automatic deployments on push

3. **AWS S3 + CloudFront**
   - Upload dashboard/ to S3 bucket
   - Enable static website hosting
   - Configure CloudFront for CDN

4. **Azure Static Web Apps**
   - Deploy via Azure portal
   - Set root directory to `dashboard/`
   - Automatic CI/CD

### Recommended: GitHub Pages

**Advantages**:
- Free hosting
- Automatic HTTPS
- Easy setup
- Version control integrated
- Perfect for demos

**Setup Steps**:
```bash
# Create gh-pages branch
git checkout -b gh-pages

# Copy dashboard to root
cp -r dashboard/* .

# Commit and push
git add .
git commit -m "Deploy dashboard to GitHub Pages"
git push origin gh-pages

# Enable in repository settings
```

---

## 11. Maintenance and Support

### Code Maintenance

**Estimated Maintenance**: 1-2 hours/month

**Tasks**:
- Update CDN dependencies (Prism.js, Chart.js)
- Fix browser compatibility issues
- Update documentation
- Address user feedback

### Documentation

**Required Documentation**:
- [ ] Dashboard README.md (user guide)
- [ ] Developer guide (code structure)
- [ ] API documentation (services/components)
- [ ] Deployment guide
- [ ] Troubleshooting guide

### Support Channels

- GitHub Issues for bug reports
- GitHub Discussions for questions
- README.md for common issues
- Inline help/tooltips in dashboard

---

## 12. Conclusion

This technical design provides a comprehensive blueprint for implementing an interactive web dashboard for the perl-to-odm-bob-demo project. The design prioritizes:

✅ **Simplicity**: Vanilla JavaScript, no build tools, minimal dependencies  
✅ **Functionality**: All core features specified and designed  
✅ **Maintainability**: Clear architecture, modular components  
✅ **Feasibility**: 2-3 day implementation timeline  
✅ **Scalability**: Foundation for future enhancements  

### Key Deliverables

1. **Interactive Dashboard** with 5 tabs (Overview, Rules, Test Cases, Parity, About)
2. **Side-by-Side Rule Comparison** with syntax highlighting
3. **Test Case Explorer** with decision simulation
4. **Visual Parity Report** with metrics and charts
5. **Quick-Start Scripts** for easy deployment
6. **Comprehensive Documentation** for users and developers

### Next Steps

1. **Review and Approval**: Stakeholder review of this technical plan
2. **Implementation**: Follow the 3-day implementation schedule
3. **Testing**: Validate against all 60 test cases
4. **Deployment**: Deploy to GitHub Pages or similar
5. **Feedback**: Gather user feedback and iterate

---

**Document Status**: ✅ Complete and Ready for Review  
**Prepared By**: IBM Bob (AI-Powered Modernization Assistant)  
**Date**: 2026-03-16  
**Version**: 1.0
