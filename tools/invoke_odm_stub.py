#!/usr/bin/env python3
# ============================================================================
# SECURITY NOTICE
# ============================================================================
# WARNING: This script contains demo credentials for illustration purposes only.
# 
# DO NOT use these credentials in production environments!
# 
# For production deployments:
# - Use environment variables to store sensitive credentials
# - Implement proper secret management (e.g., HashiCorp Vault, AWS Secrets Manager)
# - Use OAuth 2.0 or API keys instead of Basic Authentication when possible
# - Enable HTTPS/TLS for all API communications
# - Rotate credentials regularly
# - Follow your organization's security policies
# 
# Example using environment variables:
#   import os
#   username = os.environ.get('ODM_USERNAME')
#   password = os.environ.get('ODM_PASSWORD')
#   odm_host = os.environ.get('ODM_HOST', 'localhost')
# ============================================================================

"""
Perl Modernization - ODM REST API Invocation Demo

This script demonstrates how to call the IBM ODM Decision Service REST endpoint
with sample loan data. This is a STUB implementation that shows the request/response
structure without making actual HTTP calls.

Purpose:
    - Show the ODM REST API request format
    - Demonstrate payload structure
    - Explain expected response format
    - Provide guidance for actual integration

Usage:
    python tools/invoke_odm_stub.py

Note:
    This is a demonstration script. To make actual calls, deploy the MI_Underwriting
    Decision Service to IBM ODM Rule Execution Server (RES) and use the requests
    library or cURL.
"""

import json
import sys
from pathlib import Path
from typing import Dict, Any
import base64


class ODMInvoker:
    """Demonstrates ODM Decision Service REST API invocation."""
    
    def __init__(self, base_dir: Path):
        """Initialize the ODM invoker.
        
        Args:
            base_dir: Base directory of the project
        """
        self.base_dir = base_dir
        self.sample_file = base_dir / "legacy_perl" / "samples" / "loan_app_041.json"
        
        # ODM endpoint configuration
        self.odm_host = "localhost"
        self.odm_port = 9060
        self.decision_service = "MI_Underwriting"
        self.version = "1.0"
        self.endpoint = f"http://{self.odm_host}:{self.odm_port}/DecisionService/rest/{self.decision_service}/{self.version}/execute"
        
        # Authentication (default ODM credentials)
        self.username = "admin"
        self.password = "admin"
    
    def load_sample_loan(self) -> Dict[str, Any]:
        """Load a sample loan application from file.
        
        Returns:
            Dictionary containing loan data
        """
        with open(self.sample_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    def build_odm_request(self, loan_data: Dict[str, Any]) -> Dict[str, Any]:
        """Build the ODM REST API request payload.
        
        The ODM request wraps the loan data in a specific format expected by
        the Decision Service. The exact structure depends on your XOM (Execution
        Object Model) definition in ODM.
        
        Args:
            loan_data: Loan application data
            
        Returns:
            ODM request payload
        """
        # ODM request format - adjust based on your XOM structure
        # This example assumes the loan data is passed directly
        return loan_data
    
    def get_expected_response(self) -> Dict[str, Any]:
        """Get the expected ODM response structure.
        
        Returns:
            Example response structure
        """
        return {
            "eligibilityDecision": {
                "result": "approve",
                "reason": "AUS approved — meets standard eligibility criteria"
            },
            "pricingDecision": {
                "miRateBps": 19,
                "pricingTier": "standard",
                "adjustments": []
            },
            "documentationDecision": {
                "requiredDocs": [],
                "waivers": []
            },
            "flags": [],
            "metadata": {
                "executionTime": 45,
                "rulesFired": ["ELG-015", "PRICE-001", "DOC-001"],
                "decisionId": "DEC-2026-03-02-001",
                "timestamp": "2026-03-02T19:00:00Z"
            }
        }
    
    def get_auth_header(self) -> str:
        """Generate Basic Authentication header value.
        
        Returns:
            Base64-encoded credentials
        """
        credentials = f"{self.username}:{self.password}"
        encoded = base64.b64encode(credentials.encode('utf-8')).decode('utf-8')
        return f"Basic {encoded}"
    
    def generate_curl_command(self, loan_data: Dict[str, Any]) -> str:
        """Generate equivalent cURL command.
        
        Args:
            loan_data: Loan application data
            
        Returns:
            cURL command string
        """
        # For cURL, we'll reference the file directly
        curl_cmd = f"""curl -X POST {self.endpoint} \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -u {self.username}:{self.password} \\
  -d @{self.sample_file.name}"""
        
        return curl_cmd
    
    def print_demo(self):
        """Print the complete demonstration."""
        print("=" * 70)
        print("ODM Decision Service REST API Invocation Demo")
        print("=" * 70)
        print()
        print("This script demonstrates how to call the ODM Decision Service REST endpoint.")
        print("Note: This is a STUB - no actual HTTP call is made since RES is not running.")
        print()
        
        # Load sample loan
        print(f"Loading sample loan application from:")
        print(f"  {self.sample_file}")
        loan_data = self.load_sample_loan()
        print(f"  Loan ID: {loan_data.get('loanId', 'N/A')}")
        print()
        
        # Build request
        request_payload = self.build_odm_request(loan_data)
        
        # Print request details
        print("-" * 70)
        print("REQUEST DETAILS")
        print("-" * 70)
        print()
        print(f"Method: POST")
        print(f"URL: {self.endpoint}")
        print()
        print("Headers:")
        print(f"  Content-Type: application/json")
        print(f"  Accept: application/json")
        print(f"  Authorization: {self.get_auth_header()}")
        print()
        print("Payload:")
        print(json.dumps(request_payload, indent=2))
        print()
        
        # Print expected response
        print("-" * 70)
        print("EXPECTED RESPONSE")
        print("-" * 70)
        print()
        expected_response = self.get_expected_response()
        print(json.dumps(expected_response, indent=2))
        print()
        
        # Print cURL equivalent
        print("-" * 70)
        print("cURL EQUIVALENT")
        print("-" * 70)
        print()
        print(self.generate_curl_command(loan_data))
        print()
        print("Note: Run this command from the legacy_perl/samples/ directory")
        print()
        
        # Print Python requests example
        print("-" * 70)
        print("PYTHON REQUESTS EXAMPLE")
        print("-" * 70)
        print()
        print("```python")
        print("import requests")
        print("import json")
        print()
        print(f"url = '{self.endpoint}'")
        print("headers = {")
        print("    'Content-Type': 'application/json',")
        print("    'Accept': 'application/json'")
        print("}")
        print(f"auth = ('{self.username}', '{self.password}')")
        print()
        print("# Load loan data")
        print(f"with open('{self.sample_file}', 'r') as f:")
        print("    loan_data = json.load(f)")
        print()
        print("# Make the request")
        print("response = requests.post(url, json=loan_data, headers=headers, auth=auth)")
        print()
        print("# Process the response")
        print("if response.status_code == 200:")
        print("    decision = response.json()")
        print("    print(f\"Eligibility: {decision['eligibilityDecision']['result']}\")")
        print("    print(f\"MI Rate: {decision['pricingDecision']['miRateBps']} bps\")")
        print("else:")
        print("    print(f\"Error: {response.status_code} - {response.text}\")")
        print("```")
        print()
        
        # Print next steps
        print("-" * 70)
        print("NEXT STEPS FOR ACTUAL INTEGRATION")
        print("-" * 70)
        print()
        print("1. Deploy the Decision Service to RES:")
        print("   - Export the MI_Underwriting decision service from ODM Decision Center")
        print("   - Deploy to Rule Execution Server (RES)")
        print("   - Verify deployment at: http://localhost:9060/res")
        print()
        print("2. Update Configuration:")
        print("   - Modify endpoint URL to match your RES deployment")
        print("   - Configure authentication (Basic Auth, OAuth, or API Key)")
        print("   - Set appropriate timeouts and retry logic")
        print()
        print("3. Install Required Libraries:")
        print("   pip install requests")
        print()
        print("4. Test with Sample Data:")
        print("   - Use the 60 test cases in legacy_perl/samples/")
        print("   - Compare results against expected_decisions.csv")
        print("   - Run parity_check.py to validate accuracy")
        print()
        print("5. Batch Processing:")
        print("   - Process all test cases in a loop")
        print("   - Save results to odm_results/odm_decisions.csv")
        print("   - Use same schema as expected_decisions.csv")
        print()
        print("6. Error Handling:")
        print("   - Handle network errors and timeouts")
        print("   - Validate response structure")
        print("   - Log all requests and responses for audit")
        print()
        print("7. Performance Optimization:")
        print("   - Use connection pooling for batch requests")
        print("   - Consider async/parallel processing for large volumes")
        print("   - Monitor response times and throughput")
        print()
        
        # Print additional resources
        print("-" * 70)
        print("ADDITIONAL RESOURCES")
        print("-" * 70)
        print()
        print("Test Data:")
        print(f"  - Sample loans: {self.base_dir / 'legacy_perl' / 'samples'}")
        print(f"  - Expected results: {self.base_dir / 'legacy_perl' / 'samples' / 'expected_decisions.csv'}")
        print()
        print("ODM Documentation:")
        print("  - Decision Service REST API: IBM ODM Knowledge Center")
        print("  - RES Console: http://localhost:9060/res")
        print("  - Decision Center: http://localhost:9060/decisioncenter")
        print()
        print("Validation Tools:")
        print(f"  - Parity checker: {self.base_dir / 'tools' / 'parity_check.py'}")
        print()
        print("=" * 70)
    
    def run(self) -> int:
        """Run the demonstration.
        
        Returns:
            Exit code (always 0 for demo)
        """
        try:
            self.print_demo()
            return 0
        except FileNotFoundError as e:
            print(f"ERROR: Sample file not found: {e}")
            return 1
        except Exception as e:
            print(f"ERROR: {e}")
            return 1


def main():
    """Main entry point."""
    # Determine base directory (parent of tools/)
    script_dir = Path(__file__).parent
    base_dir = script_dir.parent
    
    # Run demonstration
    invoker = ODMInvoker(base_dir)
    exit_code = invoker.run()
    
    sys.exit(exit_code)


if __name__ == "__main__":
    main()

# Made with Bob
