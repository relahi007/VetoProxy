import { useEffect, useState } from "react";
import { useAppState } from "../state";
import { getAuditLog, verifyChain } from "../api";
import AuditLog from "../components/AuditLog";

// Backend (vetochain.py) returns: { index, timestamp (unix), previous_hash, hash, data }
// data contains: { company, proposal, vote, rule_triggered, confidence }
// AuditLog.jsx expects: { block_number, timestamp (ISO), previous_hash, hash, data }
// data must contain: { ticker, decision (FOR/AGAINST/FLAGGED), rule_matched }
function normalizeBlock(b) {
  const isGenesis = b.index === 0;
  return {
    block_number:  b.index,
    timestamp:     new Date(b.timestamp * 1000).toISOString(),
    previous_hash: b.previous_hash,
    hash:          b.hash,
    data: isGenesis ? b.data : {
      ticker:       b.data.company       ?? b.data.ticker       ?? "—",
      decision:     b.data.vote === "YES"    ? "FOR"
                  : b.data.vote === "NO"     ? "AGAINST"
                  : b.data.vote === "REVIEW" ? "FLAGGED"
                  :                            (b.data.decision ?? "—"),
      rule_matched: b.data.rule_triggered ?? b.data.rule_matched ?? null,
      proposal:     b.data.proposal      ?? null,
    },
  };
}

export default function Audit() {
  const { auditBlocks, setAuditBlocks, verifyResult, setVerifyResult } = useAppState();
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState(null);

  async function loadBlocks() {
    try {
      const data = await getAuditLog();
      setAuditBlocks((data.blocks ?? []).map(normalizeBlock));
    } catch (err) {
      console.error("Failed to load audit log:", err);
    }
  }

  useEffect(() => {
    loadBlocks();
    const timer = setInterval(loadBlocks, 10000);
    return () => clearInterval(timer);
  }, []);

  async function handleVerify() {
    setIsVerifying(true);
    setError(null);
    try {
      const result = await verifyChain();
      setVerifyResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div style={{ padding: "40px 48px" }}>
      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "14px 18px", marginBottom: 24, color: "#fca5a5", fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}
      <AuditLog
        blocks={auditBlocks}
        verifyResult={verifyResult}
        onVerify={handleVerify}
        isVerifying={isVerifying}
      />
    </div>
  );
}
