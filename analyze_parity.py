#!/usr/bin/env python3
import json
import csv
import os

# Load expected decisions
expected = {}
with open('legacy_perl/samples/expected_decisions.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        test_id = row['file'].replace('.json', '')
        expected[test_id] = {
            'eligibility': row['eligibility.result'].lower(),
            'miRateBps': int(row['miRateBps']) if row['miRateBps'] else None
        }

# Correct pricing logic - FICO 760+ means > 760, not >= 760
def get_mi_rate(ltv, fico):
    if ltv >= 80 and ltv <= 85:
        if fico > 760: return 19
        elif fico >= 720: return 25
        elif fico >= 680: return 30
        elif fico >= 640: return 38
        elif fico >= 620: return 52
        else: return 135
    elif ltv > 85 and ltv <= 90:
        if fico > 760: return 32
        elif fico >= 720: return 38
        elif fico >= 680: return 52
        elif fico >= 640: return 65
        elif fico >= 620: return 82
        else: return 135
    elif ltv > 90 and ltv <= 95:
        if fico > 760: return 48
        elif fico >= 720: return 58
        elif fico >= 680: return 87
        elif fico >= 640: return 110
        elif fico >= 620: return 135
        else: return 195
    elif ltv > 95 and ltv <= 97:
        if fico > 760: return 72
        elif fico >= 720: return 87
        elif fico >= 680: return 135
        elif fico >= 640: return 162
        elif fico >= 620: return 195
        else: return 195
    elif ltv < 80:
        if fico > 760: return 19
        elif fico >= 720: return 25
        elif fico >= 680: return 30
        elif fico >= 640: return 38
        elif fico >= 620: return 52
        else: return 135
    return 135

# Analyze each test case
eligibility_mismatches = []
pricing_mismatches = []

for i in range(1, 61):
    test_id = f'loan_app_{i:03d}'
    filepath = f'legacy_perl/samples/{test_id}.json'
    
    if not os.path.exists(filepath):
        continue
        
    with open(filepath, 'r') as f:
        data = json.load(f)
    
    exp = expected.get(test_id, {})
    exp_eligibility = exp.get('eligibility', '')
    
    ltv = data['loan']['ltv']
    fico = data['borrower']['creditScore']
    dti = data['loan']['dti']
    aus = data['aus']['finding']
    occupancy = data['loan'].get('occupancy', 'primary')
    prop_type = data['property'].get('type', 'sfh')
    product_type = data['loan'].get('productType', 'fixed')
    state = data['property'].get('state', '')
    
    simulated_eligibility = 'approve'  # default
    
    # Check decline conditions (in priority order)
    if fico < 620:
        simulated_eligibility = 'decline'
    elif ltv > 97:
        simulated_eligibility = 'decline'
    elif dti > 50:
        simulated_eligibility = 'decline'
    elif occupancy == 'investment' and ltv > 85:
        simulated_eligibility = 'decline'
    elif prop_type == '2to4' and ltv > 80:
        simulated_eligibility = 'decline'
    elif product_type == 'arm' and ltv > 95:
        simulated_eligibility = 'decline'
    elif occupancy == 'second' and ltv > 90:
        simulated_eligibility = 'decline'
    # Check refer conditions
    elif fico >= 620 and fico < 680 and ltv > 90:
        simulated_eligibility = 'refer'
    elif aus in ['du_refer', 'refer']:
        simulated_eligibility = 'refer'
    elif aus in ['none', 'manual']:
        simulated_eligibility = 'refer'
    elif dti > 43 and fico >= 620 and fico < 700:
        simulated_eligibility = 'refer'
    elif prop_type == 'condo' and ltv > 90:
        simulated_eligibility = 'refer'
    elif product_type == 'arm' and ltv > 90 and dti > 43:
        simulated_eligibility = 'refer'
    elif prop_type == 'condo' and ltv > 85 and state in ['FL', 'NV', 'AZ', 'CA']:
        simulated_eligibility = 'refer'
    
    if simulated_eligibility != exp_eligibility:
        eligibility_mismatches.append({
            'id': test_id,
            'expected': exp_eligibility,
            'simulated': simulated_eligibility,
            'ltv': ltv,
            'fico': fico,
            'dti': dti,
            'aus': aus,
            'occupancy': occupancy,
            'prop_type': prop_type,
            'state': state
        })
    
    # Check pricing for approved loans
    if exp_eligibility == 'approve' and exp.get('miRateBps') is not None:
        simulated_pricing = get_mi_rate(ltv, fico)
        if simulated_pricing != exp['miRateBps']:
            pricing_mismatches.append({
                'id': test_id,
                'expected': exp['miRateBps'],
                'simulated': simulated_pricing,
                'ltv': ltv,
                'fico': fico
            })

print(f"Eligibility Mismatches: {len(eligibility_mismatches)}")
for m in eligibility_mismatches:
    print(f"  {m['id']}: expected '{m['expected']}' got '{m['simulated']}' (LTV={m['ltv']}, FICO={m['fico']}, state={m['state']}, type={m['prop_type']})")

print(f"\nPricing Mismatches: {len(pricing_mismatches)}")
for m in pricing_mismatches:
    print(f"  {m['id']}: expected {m['expected']} got {m['simulated']} (LTV={m['ltv']}, FICO={m['fico']})")

total_tests = 60
matches = total_tests - len(eligibility_mismatches) - len(pricing_mismatches)
print(f"\nTotal Match Rate: {matches}/{total_tests} ({matches/total_tests*100:.1f}%)")
print(f"\nIf we reach 95%: {57}/60 = 95.0%")

# Made with Bob
