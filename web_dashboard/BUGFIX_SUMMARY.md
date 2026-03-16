# RuleViewer Infinite Loop Bug Fix

## Problem
The RuleViewer component was causing infinite loops due to the component lifecycle:
1. `afterMount()` called `handleRuleSelection()`
2. `handleRuleSelection()` called `setState()`
3. `setState()` triggered `update()`
4. `update()` called `afterMount()` again
5. Loop repeats infinitely

## Root Cause
The BaseComponent's `setState()` method always triggers a full re-render by calling `update()`, which re-renders the HTML and calls `afterMount()` again. Any `setState()` call in `afterMount()` or in async operations triggered by `afterMount()` creates an infinite loop.

## Solutions Applied

### 1. Prevent Initial Rule Loading Loop (Line 459)
```javascript
// Only load rule if not already loaded
if (this.state.selectedRuleFile && !this.state.parsedRules) {
    this.handleRuleSelection(this.state.selectedRuleFile);
}
```

### 2. Clear Event Listeners on Re-mount (Line 394)
```javascript
afterMount() {
    // Clear existing event listeners to prevent duplicates
    this.removeAllEventListeners();
    // ... rest of setup
}
```

### 3. Avoid setState() During Async Operations (Lines 465-513)
```javascript
async handleRuleSelection(filename) {
    // Update state directly without triggering re-render
    this.state.selectedRuleFile = filename;
    this.state.loading = true;
    this.state.error = null;
    
    // ... async operations ...
    
    // Only trigger re-render once at the end
    this.setState({ parsedRules, loading: false });
}
```

### 4. Avoid setState() in loadOdmDoc (Lines 515-536)
```javascript
async loadOdmDoc(docName) {
    // Update state directly during async operation
    this.state.loading = true;
    this.state.error = null;
    
    // ... load doc ...
    
    // Update state directly (no re-render needed)
    this.state.odmDesignDoc = content;
    this.state.loading = false;
}
```

### 5. Manual DOM Updates for toggleViewMode (Lines 538-548)
```javascript
toggleViewMode() {
    const newMode = this.state.viewMode === 'side-by-side' ? 'stacked' : 'side-by-side';
    this.state.viewMode = newMode;
    
    // Manually update DOM without full re-render
    const content = this.$('.rule-viewer-content');
    if (content) {
        content.className = `rule-viewer-content ${newMode}`;
    }
}
```

## Key Principle
**Minimize `setState()` calls that trigger re-renders.** Only call `setState()` when you actually need to re-render the entire component. For simple state updates or during async operations, update `this.state` directly and manually update specific DOM elements if needed.

## Testing
1. Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
2. Navigate to http://localhost:8000/web_dashboard/index.html
3. Click "Rule Comparison" tab
4. Should load without hanging
5. Select different rules from dropdown
6. Toggle view modes
7. All should work without infinite loops

## Files Modified
- `web_dashboard/components/RuleViewer.js` - All fixes applied
