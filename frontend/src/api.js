const BASE_URL = "http://localhost:5001";

const handleResponse = async (res) => {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed with status ${res.status}`);
  }
  return res.json();
};

export async function compilePolicy(rawPolicyText) {
  const res = await fetch(`${BASE_URL}/api/compile-policy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw_policy: rawPolicyText }),
  });
  return handleResponse(res);
}

export async function fetchProxy(ticker, policyId) {
  const res = await fetch(`${BASE_URL}/api/fetch-proxy`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker, policy_id: policyId }),
  });
  return handleResponse(res);
}

export async function getResults(sessionId) {
  const res = await fetch(`${BASE_URL}/api/results/${sessionId}`);
  return handleResponse(res);
}

export async function getAuditLog() {
  const res = await fetch(`${BASE_URL}/api/audit-log`);
  return handleResponse(res);
}

export async function verifyChain() {
  const res = await fetch(`${BASE_URL}/api/verify-chain`);
  return handleResponse(res);
}