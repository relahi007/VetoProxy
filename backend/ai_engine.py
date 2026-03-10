"""
ai_engine.py — AI Extraction Engine
Uses Google Gemini API (free tier) for:
1. Compiling plain English policy → structured JSON rules
2. Extracting proposals from raw SEC filing text → structured JSON

AI does NOT vote. AI only reads and structures data.
All voting decisions are made by rules_engine.py.
"""

import json
import os
import uuid
import logging

import google.generativeai as genai
from flask import Blueprint, request, jsonify
from dotenv import load_dotenv

load_dotenv()

# ── Logging ───────────────────────────────────────
logging.basicConfig(
    filename="ai_debug.log",
    level=logging.DEBUG,
    format="%(asctime)s | %(levelname)s | %(message)s"
)

# ── Gemini client ─────────────────────────────────
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash")

ai_bp = Blueprint("ai", __name__)


def strip_json_fences(text: str) -> str:
    """Remove markdown code fences before JSON parsing."""
    text = text.strip()
    if text.startswith("```"):
        parts = text.split("```")
        text = parts[1]
        if text.startswith("json"):
            text = text[4:]
    return text.strip()


def call_gemini(prompt: str) -> str:
    """Call Gemini and return raw text response."""
    response = model.generate_content(prompt)
    raw = response.text.strip()
    logging.debug(f"Gemini response:\n{raw}\n{'='*60}")
    return raw


# ── Route 1: Compile Policy ───────────────────────
@ai_bp.route("/api/ai/compile-policy", methods=["POST"])
def compile_policy():
    data       = request.get_json()
    raw_policy = data.get("raw_policy", "").strip()

    if not raw_policy:
        return jsonify({"error": "No raw_policy provided"}), 400

    prompt = f"""You are a strict JSON compiler for corporate governance policy.
Convert the following plain English voting rules into a JSON object.
Return ONLY valid JSON with no markdown and no explanation.

Output must be a JSON object with a 'rules' array.
Each rule must have exactly these fields:
- rule_id: string like "r1", "r2", "r3"
- type: one of exactly: compensation, board, shareholder, auditor
- condition: a Python boolean expression using ONLY these variable names:
  pay_raise_percent, board_seats_held, total_comp_millions,
  is_climate_related, is_diversity_related
- vote: exactly "FOR" or "AGAINST"
- description: plain English description of the rule

Return ONLY a valid JSON object. No explanation. No markdown. No backticks.

Rules to compile:
{raw_policy}"""

    try:
        raw     = call_gemini(prompt)
        cleaned = strip_json_fences(raw)
        parsed  = json.loads(cleaned)
    except json.JSONDecodeError:
        # Retry with stricter instruction
        try:
            prompt += "\n\nIMPORTANT: Your response must start with { and end with }. Nothing else."
            raw     = call_gemini(prompt)
            cleaned = strip_json_fences(raw)
            if not cleaned.startswith("{"):
                cleaned = "{" + cleaned
            parsed  = json.loads(cleaned)
        except json.JSONDecodeError as e:
            logging.error(f"Policy compile failed: {e}\nRaw: {raw}")
            return jsonify({"error": "Failed to parse AI response", "raw": raw}), 500

    policy_id        = "pol_" + uuid.uuid4().hex[:8]
    parsed["policy_id"] = policy_id
    return jsonify(parsed)


# ── Route 2: Extract Proxy Proposals ─────────────
@ai_bp.route("/api/ai/extract-proxy", methods=["POST"])
def extract_proxy():
    data        = request.get_json()
    filing_text = data.get("filing_text", "").strip()

    if not filing_text:
        return jsonify({"error": "No filing_text provided"}), 400

    filing_text = filing_text[:50000]

    prompt = f"""You are a strict JSON extractor for SEC DEF 14A proxy filings.
Return ONLY a JSON object with no markdown and no explanation.

The JSON object must have exactly these fields:
- company: company full name (string)
- ticker: stock ticker symbol (string)
- filing_date: date of filing (string)
- proposals: array of proposal objects

Each proposal must have:
- proposal_id: string like "p1", "p2", "p3"
- proposal_label: short human-readable name
- type: one of exactly: say_on_pay, director_election, shareholder_proposal, auditor_ratification
- pay_raise_percent: number if executive compensation, else null
- total_comp_millions: total compensation in millions if available, else null
- board_seats_held: number of boards nominee sits on if available, else null
- is_climate_related: true if climate/ESG proposal, else false
- is_diversity_related: true if diversity proposal, else false

IMPORTANT: Never invent data. Use null for any field you cannot find.
Return ONLY a valid JSON object. No explanation. No markdown. No backticks.

Proxy filing text:
{filing_text}"""

    try:
        raw     = call_gemini(prompt)
        cleaned = strip_json_fences(raw)
        parsed  = json.loads(cleaned)
    except json.JSONDecodeError:
        try:
            prompt += "\n\nIMPORTANT: Your response must start with { and end with }. Nothing else."
            raw     = call_gemini(prompt)
            cleaned = strip_json_fences(raw)
            if not cleaned.startswith("{"):
                cleaned = "{" + cleaned
            parsed  = json.loads(cleaned)
        except json.JSONDecodeError as e:
            logging.error(f"Proxy extract failed: {e}\nRaw: {raw}")
            return jsonify({"error": "Failed to parse AI response", "raw": raw}), 500

    if not parsed.get("proposals"):
        return jsonify({"error": "no_proposals_found"}), 400

    return jsonify(parsed)