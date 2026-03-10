const BASE_URL = import.meta.env.VITE_API_URL || "";

const handleResponse = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed with status ${res.status}`);
  }
  return res.json();
};

/**
 * Step 1: Compile plain English policy text into structured rules.
 * Returns { compiled_rules: [...], raw_input: "..." }
 */
export async function compilePolicy(rawPolicyText) {
  const res = await fetch(`${BASE_URL}/api/compile-policy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw_policy: rawPolicyText }),
  });
  return handleResponse(res);
}

/**
 * Step 2a: Fetch proposals from SEC EDGAR by ticker.
 * Returns { proposals: [...], company: "...", source: "SEC EDGAR" }
 */
export async function fetchProxyByTicker(ticker) {
  const res = await fetch(`${BASE_URL}/api/fetch-proxy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker }),
  });
  return handleResponse(res);
}

/**
 * Step 2b: Extract proposals from uploaded PDF or pasted text.
 * Returns { proposals: [...], company: "...", source: "..." }
 */
export async function extractProposals(payload) {
  let res;
  if (payload.type === "pdf") {
    const formData = new FormData();
    formData.append("file", payload.file);
    res = await fetch(`${BASE_URL}/api/extract-proposals`, {
      method: "POST",
      body: formData,
    });
  } else {
    res = await fetch(`${BASE_URL}/api/extract-proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filing_text: payload.text }),
    });
  }
  return handleResponse(res);
}

/**
 * Step 3: Run the deterministic rules engine and record to VetoChain.
 * Returns { decisions: [...], summary: {...}, chain_length, chain_valid }
 */
export async function runVote(proposals, rules, company) {
  const res = await fetch(`${BASE_URL}/api/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ proposals, rules, company }),
  });
  return handleResponse(res);
}

/**
 * Audit log — all VetoChain blocks.
 * Returns { blocks: [...], total: N }
 */
export async function getAuditLog() {
  const res = await fetch(`${BASE_URL}/api/audit-log`);
  return handleResponse(res);
}

/**
 * Verify the VetoChain hasn't been tampered with.
 * Returns { valid: bool, total_blocks: N, corrupted_blocks: [], message: "..." }
 */
export async function verifyChain() {
  const res = await fetch(`${BASE_URL}/api/verify-chain`);
  return handleResponse(res);
}
