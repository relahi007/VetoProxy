"""
Deterministic Rules Engine — ZERO AI.
Takes structured JSON proposals + compiled ruleset → returns voting decisions.
All decisions are made by pure Python logic.
"""


def apply_rules(proposals, rules):
    """
    proposals : list of dicts extracted from proxy filing
    rules     : list of dicts from policy compiler
    returns   : list of voting decisions
    """
    return [_evaluate(proposal, rules) for proposal in proposals]


def _evaluate(proposal, rules):
    p_type  = proposal.get("type", "").lower().strip()
    p_title = proposal.get("title", "").lower()
    p_desc  = proposal.get("description", "").lower()
    p_value = proposal.get("value", None)        # numeric, e.g. pay raise %
    p_indep = proposal.get("independent", None)  # bool for board elections

    vote         = None
    matched_rule = None
    confidence   = "LOW"

    for rule in rules:
        r_type      = rule.get("type", "").lower().strip()
        r_condition = rule.get("condition", "").lower()
        r_action    = rule.get("action", "").lower()
        r_threshold = rule.get("threshold", None)
        r_original  = rule.get("original", r_condition)

        # ── Executive compensation ──────────────────────────
        if r_type in ("executive_pay", "compensation") and \
           p_type in ("executive_pay", "compensation"):
            if r_threshold is not None and p_value is not None:
                vote         = "NO" if p_value > r_threshold else "YES"
                matched_rule = r_original
                confidence   = "HIGH"
                break
            elif r_threshold is None:
                # No threshold defined — apply action unconditionally
                vote         = "YES" if r_action in ("yes", "support", "for") else "NO"
                matched_rule = r_original
                confidence   = "MEDIUM"
                break
            # p_value missing but threshold exists — fall through to keyword check

        # ── Board / director elections ──────────────────────
        if r_type in ("board", "director") and \
           p_type in ("board_election", "director", "board"):
            if p_indep is True and "independent" in r_condition:
                vote         = "YES" if r_action in ("yes", "support", "for") else "NO"
                matched_rule = r_original
                confidence   = "HIGH"
                break
            if p_indep is False and "independent" in r_condition:
                # Non-independent candidate when rule says support independent
                vote         = "NO"
                matched_rule = r_original
                confidence   = "HIGH"
                break

        # ── ESG / Climate ───────────────────────────────────
        if r_type in ("esg", "climate", "environment") and \
           p_type in ("esg", "climate", "environmental", "environment"):
            vote         = "YES" if r_action in ("yes", "support", "for") else "NO"
            matched_rule = r_original
            confidence   = "HIGH"
            break

        # ── Mergers & Acquisitions ──────────────────────────
        if r_type in ("merger", "acquisition", "m&a") and \
           p_type in ("merger", "acquisition", "m&a"):
            vote         = "YES" if r_action in ("yes", "support", "for") else "NO"
            matched_rule = r_original
            confidence   = "HIGH"
            break

        # ── Auditor ratification ────────────────────────────
        if r_type in ("auditor",) and p_type in ("auditor", "auditor_ratification"):
            vote         = "YES" if r_action in ("yes", "support", "for") else "NO"
            matched_rule = r_original
            confidence   = "HIGH"
            break

        # ── Keyword fallback (MEDIUM confidence) ───────────
        keywords = [w for w in r_condition.split() if len(w) > 3]
        if any(kw in p_title or kw in p_desc for kw in keywords):
            vote         = "YES" if r_action in ("yes", "support", "for") else "NO"
            matched_rule = r_original
            confidence   = "MEDIUM"
            break  # Don't keep looking — keyword match is good enough

        # ── Catch-all: rule type is "other" or unrecognised ─
        # If we reach here, no type-specific branch matched this rule.
        # Apply it universally so broad rules like "vote against everything"
        # are honoured rather than silently dropped.
        if r_type in ("other", "general") or not any([
            r_type in ("executive_pay", "compensation"),
            r_type in ("board", "director"),
            r_type in ("esg", "climate", "environment"),
            r_type in ("merger", "acquisition", "m&a"),
            r_type in ("auditor",),
        ]):
            vote         = "YES" if r_action in ("yes", "support", "for") else "NO"
            matched_rule = r_original
            confidence   = "MEDIUM"
            break

    # ── No rule matched → human review ─────────────────────
    if vote is None:
        return {
            "proposal"     : proposal.get("title", "Unknown Proposal"),
            "type"         : proposal.get("type", "unknown"),
            "vote"         : "REVIEW",
            "rule_triggered": "No matching rule — requires human review",
            "confidence"   : "REQUIRES_HUMAN_REVIEW",
            "description"  : proposal.get("description", "")
        }

    return {
        "proposal"     : proposal.get("title", "Unknown Proposal"),
        "type"         : proposal.get("type", "unknown"),
        "vote"         : vote,
        "rule_triggered": matched_rule,
        "confidence"   : confidence,
        "description"  : proposal.get("description", "")
    }


# ─────────────────────────────────────────
# TEST — run with: python rules_engine.py
# ─────────────────────────────────────────

if __name__ == "__main__":
    import json

    # Simulated compiled ruleset
    rules = [
        {
            "original" : "Vote NO on executive pay raises above 10%",
            "type"     : "executive_pay",
            "condition": "executive pay raise above threshold",
            "action"   : "no",
            "threshold": 10
        },
        {
            "original" : "Always support independent board members",
            "type"     : "board",
            "condition": "independent board director",
            "action"   : "yes",
            "threshold": None
        },
        {
            "original" : "Always vote yes on climate disclosure",
            "type"     : "climate",
            "condition": "climate disclosure report",
            "action"   : "yes",
            "threshold": None
        },
        {
            "original" : "Vote against all mergers",
            "type"     : "merger",
            "condition": "merger acquisition",
            "action"   : "no",
            "threshold": None
        }
    ]

    # Simulated AI-extracted proposals
    proposals = [
        {
            "title"      : "Approve CEO Compensation Package (15% raise)",
            "type"       : "executive_pay",
            "description": "Proposal to increase CEO base salary by 15%",
            "value"      : 15,
            "independent": None
        },
        {
            "title"      : "Approve CFO Compensation Package (8% raise)",
            "type"       : "executive_pay",
            "description": "Proposal to increase CFO base salary by 8%",
            "value"      : 8,
            "independent": None
        },
        {
            "title"      : "Elect Jane Smith as Independent Director",
            "type"       : "board_election",
            "description": "Election of independent board member",
            "value"      : None,
            "independent": True
        },
        {
            "title"      : "Elect John Doe (Executive Director)",
            "type"       : "board_election",
            "description": "Election of non-independent executive director",
            "value"      : None,
            "independent": False
        },
        {
            "title"      : "Climate Disclosure Report 2026",
            "type"       : "climate",
            "description": "Proposal to publish annual climate disclosure",
            "value"      : None,
            "independent": None
        },
        {
            "title"      : "Proposed Merger with TechCorp",
            "type"       : "merger",
            "description": "Approve acquisition of TechCorp for $2.4B",
            "value"      : None,
            "independent": None
        },
        {
            "title"      : "Amendment to Employee Stock Option Plan",
            "type"       : "other",
            "description": "Modify existing stock option vesting schedule",
            "value"      : None,
            "independent": None
        }
    ]

    print("=== Rules Engine Test ===\n")
    decisions = apply_rules(proposals, rules)

    for d in decisions:
        icon = "✅" if d["vote"] == "YES" else ("❌" if d["vote"] == "NO" else "⚠️")
        print(f"{icon} [{d['vote']:6}] {d['proposal']}")
        print(f"         Rule     : {d['rule_triggered']}")
        print(f"         Confidence: {d['confidence']}\n")