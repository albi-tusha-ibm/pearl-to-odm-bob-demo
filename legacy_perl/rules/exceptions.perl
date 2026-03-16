# =============================================================================
# PERL Rule File: exceptions.perl
# Description:    Exception and override rules — highest priority in the flow
# Author:         Risk Policy / Senior Underwriting
# Created:        2021-01
# Last Modified:  2022-10
# =============================================================================
# Exception rules — highest priority, run before standard eligibility
# These rules override standard eligibility outcomes for high-risk combinations
# that require senior underwriter review regardless of AUS finding.
#
# These override standard eligibility outcomes — if an exception rule fires,
# the eligibility.result is set directly and standard rules should not
# overwrite it. (NOTE: PERL does not enforce this — relies on priority order
# and the fact that exception rules run in Phase 1 before underwriting.perl)
#
# Priority range: 185-200
# All exception rules result in REFER — no exception rule declines directly.
# Declines are handled by underwriting.perl after exception review.
#
# WARNING: Adding new exception rules requires sign-off from Chief Risk Officer.
#          Do not add rules to this file without approval.
# =============================================================================


# -----------------------------------------------------------------------------
# EXC-001 | Low FICO + High LTV on Primary Residence
# Borderline credit (620-639) with very high LTV (>95) on primary — escalate
# This combination has historically shown elevated default rates
# Added 2021-01 per risk policy review
# NOTE: primary residence only — investment/second home handled by ELG-004/012
# -----------------------------------------------------------------------------
RULE "EXC-001" PRIORITY 200 EFFECT refer
WHEN
    borrower.creditScore >= 620
    AND borrower.creditScore < 640
    AND loan.ltv > 95
    AND loan.occupancy = primary
THEN
    SET eligibility.result = refer
    ACTION "High-risk combination: low FICO + high LTV on primary — escalate to senior underwriter"
    FLAG "MANUAL_UW_REQUIRED"
    FLAG "HIGH_RISK_COMBO"
END


# -----------------------------------------------------------------------------
# EXC-002 | ARM + High LTV + High DTI
# Adjustable rate mortgage with high LTV AND high DTI — triple risk layering
# ARM payment shock risk combined with high leverage and stretched income
# Added 2021-01 per risk policy review
# NOTE: this rule fires even if AUS approved — AUS does not fully account for
#       ARM payment shock scenarios per our internal risk model
# TODO: revisit DTI threshold — 43 may be too conservative for some ARM products
# -----------------------------------------------------------------------------
RULE "EXC-002" PRIORITY 195 EFFECT refer
WHEN
    loan.productType = arm
    AND loan.ltv > 90
    AND loan.dti > 43
THEN
    SET eligibility.result = refer
    ACTION "ARM with high LTV and DTI — manual review required"
    FLAG "MANUAL_UW_REQUIRED"
END


# -----------------------------------------------------------------------------
# EXC-003 | Condo in Elevated-Risk State + High LTV
# Condos in FL, HI, NV above 85% LTV — elevated market/project risk
# EXC-003 added after FL condo market issues 2022-Q3
# NOTE: state list (FL, HI, NV) based on internal loss analysis 2022-Q3
#       Other states may need to be added — TODO: annual review of state list
# NOTE: HI and NV added 2022-10 based on updated loss data — was FL only before
# -----------------------------------------------------------------------------
RULE "EXC-003" PRIORITY 190 EFFECT refer
WHEN
    property.type = condo
    AND property.state IN (FL, HI, NV)
    AND loan.ltv > 85
THEN
    SET eligibility.result = refer
    ACTION "Condo in elevated-risk state above 85% LTV — manual review"
    FLAG "STATE_RISK_OVERRIDE"
END


# -----------------------------------------------------------------------------
# EXC-004 | First-Time Buyer + High LTV + Marginal Credit
# FTHB with LTV > 95 and FICO < 660 — elevated risk profile
# First-time buyers have no prior homeownership experience — higher default risk
# at high LTV with marginal credit per actuarial analysis 2021-Q4
# Added 2022-01 per updated FTHB risk policy
# NOTE: FTHB programs (e.g., HomeReady, Home Possible) may have different
#       thresholds — this rule applies to standard MI only
#       TODO: add product type check when FTHB program field is available
# -----------------------------------------------------------------------------
RULE "EXC-004" PRIORITY 185 EFFECT refer
WHEN
    borrower.firstTimeHomebuyer = true
    AND loan.ltv > 95
    AND borrower.creditScore < 660
THEN
    SET eligibility.result = refer
    ACTION "First-time buyer with high LTV and marginal credit — manual review"
    FLAG "FTHB_HIGH_RISK"
END