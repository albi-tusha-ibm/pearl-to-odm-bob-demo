#!/usr/bin/env python3
"""
Perl Modernization - Parity Validation Script

This script compares legacy PERL-DSL expected decisions against ODM actual decisions
and produces a detailed parity report.

Purpose:
    - Validate that ODM decisions match legacy PERL decisions
    - Calculate match rates for eligibility, pricing, documentation, and flags
    - Generate a detailed parity report for analysis

Usage:
    python tools/parity_check.py

Exit Codes:
    0 - Parity check passed (≥95% match rate)
    1 - Parity check failed (<95% match rate) or ODM results not found
"""

import csv
import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any


class ParityChecker:
    """Validates parity between legacy and ODM decisions."""
    
    def __init__(self, base_dir: Path):
        """Initialize the parity checker.
        
        Args:
            base_dir: Base directory of the project
        """
        self.base_dir = base_dir
        self.legacy_file = base_dir / "legacy_perl" / "samples" / "expected_decisions.csv"
        self.odm_file = base_dir / "odm_results" / "odm_decisions.csv"
        self.report_file = base_dir / "tools" / "parity_summary.txt"
        
        self.legacy_data: List[Dict[str, str]] = []
        self.odm_data: List[Dict[str, str]] = []
        self.mismatches: List[Dict[str, Any]] = []
        
        # Statistics
        self.total_cases = 0
        self.eligibility_matches = 0
        self.eligibility_total = 0
        self.pricing_matches = 0
        self.pricing_total = 0
        self.docs_matches = 0
        self.docs_total = 0
        self.flags_matches = 0
        self.flags_total = 0
    
    def load_csv(self, filepath: Path) -> List[Dict[str, str]]:
        """Load CSV file into a list of dictionaries.
        
        Args:
            filepath: Path to the CSV file
            
        Returns:
            List of dictionaries, one per row
        """
        data = []
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                data.append(row)
        return data
    
    def normalize_value(self, value: str) -> str:
        """Normalize a value for comparison (strip whitespace, handle empty)."""
        if value is None:
            return ""
        return value.strip()
    
    def compare_field(self, field: str, expected: str, actual: str) -> bool:
        """Compare two field values.
        
        Args:
            field: Field name
            expected: Expected value
            actual: Actual value
            
        Returns:
            True if values match, False otherwise
        """
        exp_norm = self.normalize_value(expected)
        act_norm = self.normalize_value(actual)
        return exp_norm == act_norm
    
    def validate_parity(self) -> Tuple[int, int]:
        """Validate parity between legacy and ODM decisions.
        
        Returns:
            Tuple of (matches, total_cases)
        """
        # Create lookup dictionary for ODM data by filename
        odm_lookup = {row['file']: row for row in self.odm_data}
        
        overall_matches = 0
        
        for legacy_row in self.legacy_data:
            filename = legacy_row['file']
            self.total_cases += 1
            
            if filename not in odm_lookup:
                self.mismatches.append({
                    'file': filename,
                    'field': 'MISSING',
                    'expected': 'Present in legacy',
                    'actual': 'Not found in ODM results',
                    'reason': 'ODM result missing for this test case'
                })
                continue
            
            odm_row = odm_lookup[filename]
            case_matches = True
            
            # Compare eligibility result
            self.eligibility_total += 1
            if self.compare_field('eligibility.result', 
                                 legacy_row['eligibility.result'], 
                                 odm_row['eligibility.result']):
                self.eligibility_matches += 1
            else:
                case_matches = False
                self.mismatches.append({
                    'file': filename,
                    'field': 'eligibility.result',
                    'expected': legacy_row['eligibility.result'],
                    'actual': odm_row['eligibility.result'],
                    'reason': 'Eligibility decision mismatch'
                })
            
            # Compare pricing (only for approve cases)
            if legacy_row['eligibility.result'] == 'approve':
                self.pricing_total += 1
                if self.compare_field('miRateBps', 
                                     legacy_row['miRateBps'], 
                                     odm_row['miRateBps']):
                    self.pricing_matches += 1
                else:
                    case_matches = False
                    self.mismatches.append({
                        'file': filename,
                        'field': 'miRateBps',
                        'expected': legacy_row['miRateBps'],
                        'actual': odm_row['miRateBps'],
                        'reason': 'Pricing mismatch (possible decision table vs. fallback rule difference)'
                    })
            
            # Compare documentation (only for non-decline cases)
            if legacy_row['eligibility.result'] != 'decline':
                self.docs_total += 1
                if self.compare_field('requiredDocs', 
                                     legacy_row['requiredDocs'], 
                                     odm_row['requiredDocs']):
                    self.docs_matches += 1
                else:
                    case_matches = False
                    self.mismatches.append({
                        'file': filename,
                        'field': 'requiredDocs',
                        'expected': legacy_row['requiredDocs'],
                        'actual': odm_row['requiredDocs'],
                        'reason': 'Documentation requirements mismatch'
                    })
            
            # Compare flags (only if either has flags)
            legacy_flags = self.normalize_value(legacy_row['flags'])
            odm_flags = self.normalize_value(odm_row['flags'])
            if legacy_flags or odm_flags:
                self.flags_total += 1
                if self.compare_field('flags', legacy_flags, odm_flags):
                    self.flags_matches += 1
                else:
                    case_matches = False
                    self.mismatches.append({
                        'file': filename,
                        'field': 'flags',
                        'expected': legacy_flags,
                        'actual': odm_flags,
                        'reason': 'Flags mismatch'
                    })
            
            if case_matches:
                overall_matches += 1
        
        return overall_matches, self.total_cases
    
    def calculate_percentage(self, matches: int, total: int) -> float:
        """Calculate percentage with safe division."""
        if total == 0:
            return 100.0
        return (matches / total) * 100.0
    
    def print_report(self, overall_matches: int) -> bool:
        """Print the parity report to console and file.
        
        Args:
            overall_matches: Number of cases that matched completely
            
        Returns:
            True if parity check passed (≥95%), False otherwise
        """
        overall_pct = self.calculate_percentage(overall_matches, self.total_cases)
        eligibility_pct = self.calculate_percentage(self.eligibility_matches, self.eligibility_total)
        pricing_pct = self.calculate_percentage(self.pricing_matches, self.pricing_total)
        docs_pct = self.calculate_percentage(self.docs_matches, self.docs_total)
        flags_pct = self.calculate_percentage(self.flags_matches, self.flags_total)
        
        passed = overall_pct >= 95.0
        
        # Build report content
        report_lines = []
        report_lines.append("=" * 60)
        report_lines.append("PARITY VALIDATION REPORT")
        report_lines.append("=" * 60)
        report_lines.append(f"Legacy Ground Truth: {len(self.legacy_data)} cases")
        report_lines.append(f"ODM Results: {len(self.odm_data)} cases")
        report_lines.append("")
        report_lines.append(f"Overall Match Rate: {overall_matches}/{self.total_cases} ({overall_pct:.1f}%)")
        
        # Detailed breakdowns
        status_symbol = "✓" if eligibility_pct >= 95.0 else "✗"
        report_lines.append(f"  {status_symbol} Eligibility: {self.eligibility_matches}/{self.eligibility_total} ({eligibility_pct:.1f}%)")
        
        if self.pricing_total > 0:
            status_symbol = "✓" if pricing_pct >= 95.0 else "✗"
            report_lines.append(f"  {status_symbol} Pricing: {self.pricing_matches}/{self.pricing_total} ({pricing_pct:.1f}%)")
        
        if self.docs_total > 0:
            status_symbol = "✓" if docs_pct >= 95.0 else "✗"
            report_lines.append(f"  {status_symbol} Documentation: {self.docs_matches}/{self.docs_total} ({docs_pct:.1f}%)")
        
        if self.flags_total > 0:
            status_symbol = "✓" if flags_pct >= 95.0 else "✗"
            report_lines.append(f"  {status_symbol} Flags: {self.flags_matches}/{self.flags_total} ({flags_pct:.1f}%)")
        
        # Mismatches section
        if self.mismatches:
            report_lines.append("")
            report_lines.append("MISMATCHES:")
            
            # Group mismatches by file
            mismatches_by_file: Dict[str, List[Dict]] = {}
            for mismatch in self.mismatches:
                filename = mismatch['file']
                if filename not in mismatches_by_file:
                    mismatches_by_file[filename] = []
                mismatches_by_file[filename].append(mismatch)
            
            for filename, file_mismatches in sorted(mismatches_by_file.items()):
                report_lines.append(f"  {filename}:")
                for mismatch in file_mismatches:
                    if mismatch['field'] == 'MISSING':
                        report_lines.append(f"    - {mismatch['reason']}")
                    else:
                        report_lines.append(f"    - {mismatch['field']}: expected={mismatch['expected']}, actual={mismatch['actual']}")
                        if mismatch.get('reason'):
                            report_lines.append(f"      Reason: {mismatch['reason']}")
        else:
            report_lines.append("")
            report_lines.append("✓ No mismatches found - Perfect parity!")
        
        # Acceptance criteria
        report_lines.append("")
        report_lines.append("Acceptance Criteria: ≥95% parity")
        status_symbol = "✓" if passed else "✗"
        status_text = "PASSED" if passed else "FAILED"
        report_lines.append(f"Status: {status_symbol} {status_text} ({overall_pct:.1f}% {'≥' if passed else '<'} 95%)")
        report_lines.append("")
        report_lines.append(f"Detailed report written to: {self.report_file}")
        report_lines.append("=" * 60)
        
        # Print to console
        report_text = "\n".join(report_lines)
        print(report_text)
        
        # Write to file
        with open(self.report_file, 'w', encoding='utf-8') as f:
            f.write(report_text)
            f.write("\n")
        
        return passed
    
    def run(self) -> int:
        """Run the parity check.
        
        Returns:
            Exit code (0 for success, 1 for failure)
        """
        print("=" * 60)
        print("Pearl Modernization - Parity Validation")
        print("=" * 60)
        print()
        
        # Check if legacy file exists
        if not self.legacy_file.exists():
            print(f"ERROR: Legacy expected decisions file not found:")
            print(f"  {self.legacy_file}")
            return 1
        
        # Load legacy data
        print(f"Loading legacy ground truth from:")
        print(f"  {self.legacy_file}")
        self.legacy_data = self.load_csv(self.legacy_file)
        print(f"  Loaded {len(self.legacy_data)} test cases")
        print()
        
        # Check if ODM results exist
        if not self.odm_file.exists():
            print(f"WARNING: ODM results file not found:")
            print(f"  {self.odm_file}")
            print()
            print("To generate ODM results:")
            print("  1. Deploy the MI_Underwriting Decision Service to IBM ODM RES")
            print("  2. Run the decision service against all test cases in legacy_perl/samples/")
            print("  3. Save results to odm_results/odm_decisions.csv (same schema as expected_decisions.csv)")
            print()
            print("Parity validation cannot proceed without ODM results.")
            return 1
        
        # Load ODM data
        print(f"Loading ODM results from:")
        print(f"  {self.odm_file}")
        self.odm_data = self.load_csv(self.odm_file)
        print(f"  Loaded {len(self.odm_data)} results")
        print()
        
        # Validate parity
        print("Validating parity...")
        overall_matches, total_cases = self.validate_parity()
        print()
        
        # Print report
        passed = self.print_report(overall_matches)
        
        return 0 if passed else 1


def main():
    """Main entry point."""
    # Determine base directory (parent of tools/)
    script_dir = Path(__file__).parent
    base_dir = script_dir.parent
    
    # Run parity check
    checker = ParityChecker(base_dir)
    exit_code = checker.run()
    
    sys.exit(exit_code)


if __name__ == "__main__":
    main()

# Made with Bob
