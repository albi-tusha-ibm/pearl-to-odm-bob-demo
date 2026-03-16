# =============================================================================
# PEARL Rule File: pricing.perl
# Description:    MI rate pricing rules — sets miRateBps based on LTV/credit
# Author:         Pricing Team / IT
# Created:        2021-06
# Last Modified:  2023-01 (approx — check with IT)
# =============================================================================
# Pricing rules — sourced from rate card v4.2 (2021-06)
# TODO: update for new rate card when approved (rate card v5.0 pending review)
#
# Note: refer cases do not price — handled upstream
#       Decline cases also do not price — this file assumes eligibility.result
#       has already been set by underwriting.perl and exceptions.perl
#
# IMPORTANT: All PRICE rules share PRIORITY 50 (except PRICE-006 and PRICE-007)
#            Only one pricing rule should fire per loan — bands are designed to
#            be mutually exclusive, but this has NOT been formally verified.
#            TODO: add overlap analysis before next rate card update
# =============================================================================


# -----------------------------------------------------------------------------
# PRICE-001 | Low LTV + Excellent Credit
# LTV <= 85, FICO >= 760 — best rate tier
# Rate: 19 bps — sourced from rate card v4.2 row 1
# NOTE: "excellent credit" threshold is 760 here but 740 in some other docs
#       TODO: confirm threshold with underwriting team
# -----------------------------------------------------------------------------
RULE "PRICE-001" PRIORITY 50 EFFECT price
WHEN
    eligibility.result = approve
    AND loan.ltv <= 85
    AND borrower.creditScore >= 760
THEN
    SET pricing.miRateBps = 19
    ACTION "Standard MI rate: 19 bps (low LTV, excellent credit)"
END


# -----------------------------------------------------------------------------
# PRICE-002 | Low LTV + Good Credit
# LTV <= 85, FICO 720-759 — second-best rate tier
# Rate: 25 bps — sourced from rate card v4.2 row 2
# Added 2021-06 per rate card v4.2 rollout
# -----------------------------------------------------------------------------
RULE "PRICE-002" PRIORITY 50 EFFECT price
WHEN
    eligibility.result = approve
    AND loan.ltv <= 85
    AND borrower.creditScore >= 720
    AND borrower.creditScore < 760
THEN
    SET pricing.miRateBps = 25
    ACTION "Standard MI rate: 25 bps"
END


# -----------------------------------------------------------------------------
# PRICE-003 | Mid LTV Band (85-90) + Good Credit
# LTV 85.01-90, FICO >= 720
# Rate: 38 bps — sourced from rate card v4.2 row 5
# NOTE: boundary condition — loan.ltv = 85 is covered by PRICE-001/PRICE-002
#       loan.ltv = 85.001 falls here — floating point edge case not tested
# -----------------------------------------------------------------------------
RULE "PRICE-003" PRIORITY 50 EFFECT price
WHEN
    eligibility.result = approve
    AND loan.ltv > 85
    AND loan.ltv <= 90
    AND borrower.creditScore >= 720
THEN
    SET pricing.miRateBps = 38
    ACTION "MI rate: 38 bps (85-90 LTV band)"
END


# -----------------------------------------------------------------------------
# PRICE-004 | High LTV Band (90-95) + Good Credit
# LTV 90.01-95, FICO >= 720
# Rate: 58 bps — sourced from rate card v4.2 row 8
# Added 2021-06 per rate card v4.2 rollout
# -----------------------------------------------------------------------------
RULE "PRICE-004" PRIORITY 50 EFFECT price
WHEN
    eligibility.result = approve
    AND loan.ltv > 90
    AND loan.ltv <= 95
    AND borrower.creditScore >= 720
THEN
    SET pricing.miRateBps = 58
    ACTION "MI rate: 58 bps (90-95 LTV band)"
END


# -----------------------------------------------------------------------------
# PRICE-005 | Very High LTV Band (95-97) + Good Credit
# LTV 95.01-97, FICO >= 720
# Rate: 87 bps — sourced from rate card v4.2 row 11
# NOTE: this is the highest LTV band — ELG-002 ensures LTV never exceeds 97
# -----------------------------------------------------------------------------
RULE "PRICE-005" PRIORITY 50 EFFECT price
WHEN
    eligibility.result = approve
    AND loan.ltv > 95
    AND loan.ltv <= 97
    AND borrower.creditScore >= 720
THEN
    SET pricing.miRateBps = 87
    ACTION "MI rate: 87 bps (95-97 LTV band)"
END


# -----------------------------------------------------------------------------
# PRICE-006 | High LTV + Moderate Credit
# LTV > 90, FICO 640-719 — elevated risk tier
# Rate: 110 bps — sourced from rate card v4.2 row 14
# NOTE: this rule overlaps with PRICE-004 and PRICE-005 for FICO 640-719
#       PRICE-006 has lower priority (45) so PRICE-004/005 fire first for
#       FICO >= 720. For FICO 640-719, this is the only matching rule.
#       TODO: verify no gap exists for FICO exactly 720 at high LTV
# -----------------------------------------------------------------------------
RULE "PRICE-006" PRIORITY 45 EFFECT price
WHEN
    eligibility.result = approve
    AND loan.ltv > 90
    AND borrower.creditScore >= 640
    AND borrower.creditScore < 720
THEN
    SET pricing.miRateBps = 110
    ACTION "Elevated MI rate: 110 bps (high LTV, moderate credit)"
END


# -----------------------------------------------------------------------------
# PRICE-007 | Default Pricing Fallback
# Catch-all: if approved but no pricing rule matched, apply default rate
# Rate: 135 bps — conservative default, review recommended
# NOTE: this rule should rarely fire — if it does, it indicates a gap in the
#       rate card coverage. FLAG is set to alert operations team.
# TODO: investigate all cases where this fires — may indicate data quality issue
#       or missing rate card row
# Added 2022-04 after ops team reported unpriced approved loans
# -----------------------------------------------------------------------------
RULE "PRICE-007" PRIORITY 40 EFFECT price
WHEN
    eligibility.result = approve
    AND pricing.miRateBps = null
THEN
    SET pricing.miRateBps = 135
    ACTION "Default MI rate applied: 135 bps — review recommended"
    FLAG "PRICING_DEFAULT_APPLIED"
END