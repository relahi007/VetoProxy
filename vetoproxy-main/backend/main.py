from flask import Flask, request, jsonify
from flask_cors import CORS
from groq import Groq
import PyPDF2
import json
import io
import os
import re
from dotenv import load_dotenv

from vetochain import VetoChain
from rules_engine import apply_rules
from edgar import fetch_proxy_filing, FilingNotFoundError

load_dotenv()

app = Flask(__name__)
CORS(app)

client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))
veto_chain = VetoChain()


def strip_html(text):
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'&nbsp;', ' ', text)
    text = re.sub(r'&amp;', '&', text)
    text = re.sub(r'&lt;', '<', text)
    text = re.sub(r'&gt;', '>', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def call_groq_json(prompt):
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {
                "role": "system",
                "content": "You are a helpful assistant. Always respond with valid JSON only. No markdown, no backticks, no explanation."
            },
            {
                "role": "user",
                "content": prompt
            }
        ],
        temperature=0.1,
        max_tokens=4000,
    )
    raw = response.choices[0].message.content.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "VetoProxy backend running (Groq/Llama Engine) ✓",
        "chain_valid": veto_chain.is_valid(),
        "chain_length": len(veto_chain.chain)
    })


@app.route("/api/compile-policy", methods=["POST"])
def compile_policy():
    data = request.get_json()
    raw_rules = (data.get("rules") or data.get("raw_policy") or "").strip()
    if not raw_rules:
        return jsonify({"error": "No rules provided"}), 400

    prompt = f"""Convert these voting rules into a JSON array.
Return ONLY a JSON array. No explanation. No markdown.

Each object must have exactly:
- "original": the original rule text
- "type": one of EXACTLY: executive_pay, board, esg, climate, merger, auditor, other
- "condition": when this rule applies
- "action": exactly "yes" or "no"
- "threshold": number if rule has a percentage/numeric limit, else null

IMPORTANT:
Use "executive_pay" for any compensation or pay related rule.
Use "board" for any director election rule.
Use "climate" or "esg" for environmental/sustainability rules.
Use "auditor" for any auditor ratification rule.

Rules:
{raw_rules}"""

    try:
        compiled_rules = call_groq_json(prompt)
        return jsonify({"compiled_rules": compiled_rules, "raw_input": raw_rules})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def make_proposal_prompt(filing_text):
    return f"""Extract ALL voting proposals from this SEC DEF 14A proxy filing.
Return ONLY a JSON array. No explanation. No markdown.

Each object must have EXACTLY:
- "title": short name of the proposal
- "type": you MUST use one of these exact values:
  * "executive_pay" — for ANY compensation, salary, bonus, pay, incentive proposal
  * "board_election" — for ANY director election or re-election
  * "climate" — for climate, environment, emissions proposals
  * "esg" — for ESG, sustainability, diversity proposals
  * "merger" — for mergers, acquisitions, buyouts
  * "auditor" — for auditor ratification or selection
  * "other" — only if none of the above apply
- "description": one sentence summary
- "value": percentage increase as a NUMBER if executive pay (e.g. 12.5), else null
- "independent": true/false if board election, else null

DO NOT use "other" if the proposal fits any of the above categories.
Most proxy filings have: executive pay, board elections, and auditor ratification. Always classify those correctly.

Filing text:
{filing_text}"""


@app.route("/api/fetch-proxy", methods=["POST"])
def fetch_proxy():
    data = request.get_json()
    ticker = data.get("ticker", "").upper()
    if not ticker:
        return jsonify({"error": "No ticker provided"}), 400

    try:
        filing_text = fetch_proxy_filing(ticker)
        filing_text = strip_html(filing_text)      # strip first
        filing_text = filing_text[:25000]          # then slice clean text
        proposals = call_groq_json(make_proposal_prompt(filing_text))
        return jsonify({"proposals": proposals, "company": ticker, "source": "SEC EDGAR"})

    except FilingNotFoundError:
        return jsonify({"error": f"Could not find SEC filing for {ticker}"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/extract-proposals", methods=["POST"])
def extract_proposals():
    if request.is_json:
        filing_text = request.get_json().get("filing_text", "").strip()
        company = "Pasted Filing"
        source = "Pasted Text"
    else:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        file = request.files["file"]
        try:
            reader = PyPDF2.PdfReader(io.BytesIO(file.read()))
            filing_text = ""
            for page in reader.pages[:30]:
                extracted = page.extract_text()
                if extracted:
                    filing_text += extracted
        except Exception as e:
            return jsonify({"error": f"PDF read failed: {str(e)}"}), 500
        company = "PDF Uploaded Corp"
        source = "PDF Document"

    if not filing_text.strip():
        return jsonify({"error": "No readable text found"}), 500

    filing_text = strip_html(filing_text)
    filing_text = filing_text[:25000]

    try:
        proposals = call_groq_json(make_proposal_prompt(filing_text))
        return jsonify({"proposals": proposals, "company": company, "source": source})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/vote", methods=["POST"])
def vote():
    data = request.get_json()
    proposals = data.get("proposals", [])
    rules = data.get("rules", [])
    company = data.get("company", "Unknown Company")

    if not proposals:
        return jsonify({"error": "No proposals provided"}), 400
    if not rules:
        return jsonify({"error": "No rules provided"}), 400

    decisions = apply_rules(proposals, rules)

    for decision in decisions:
        veto_chain.add_vote({
            "company": company,
            "proposal": decision["proposal"],
            "vote": decision["vote"],
            "rule_triggered": decision["rule_triggered"],
            "confidence": decision["confidence"]
        })

    return jsonify({
        "decisions": decisions,
        "summary": {
            "total": len(decisions),
            "yes": sum(1 for d in decisions if d["vote"] == "YES"),
            "no": sum(1 for d in decisions if d["vote"] == "NO"),
            "requires_review": sum(1 for d in decisions if d["vote"] == "REVIEW")
        },
        "chain_length": len(veto_chain.chain),
        "chain_valid": veto_chain.is_valid()
    })


@app.route("/api/chain", methods=["GET"])
def get_chain():
    return jsonify({
        "chain": veto_chain.to_dict(),
        "length": len(veto_chain.chain),
        "valid": veto_chain.is_valid(),
        "stats": veto_chain.get_stats()
    })


@app.route("/api/audit-log", methods=["GET"])
def audit_log():
    chain = veto_chain.to_dict()
    return jsonify({"blocks": chain, "total": len(chain)})


@app.route("/api/verify-chain", methods=["GET"])
def verify_chain():
    valid = veto_chain.is_valid()
    return jsonify({
        "valid": valid,
        "total_blocks": len(veto_chain.chain),
        "corrupted_blocks": [],
        "message": "All blocks verified" if valid else "Chain integrity compromised"
    })


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=int(os.environ.get("PORT", 5001)))
