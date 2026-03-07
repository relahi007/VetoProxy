import { useState, useEffect } from "react";
import { useAppState } from "../state.jsx";
import AuditLog from "../components/AuditLog.jsx";

export default function Audit() {
  const { auditBlocks, setAuditBlocks } = useAppState();
  const [verifyResult, setVerifyResult] = useState(null);
  const [isVerifying, setIsVerifying]   = useState(false);
  const [error, setError]               = useState(null);

  useEffect(() => {
    async function fetchLog() {
      try {
        const res  = await fetch("/api/audit-log");
        const data = await res.json();
        // Normalize block fields for AuditLog component
        const blocks = (data.blocks || []).map((b) => ({
          block_number:  b.index ?? b.block_number ?? 0,
          timestamp:     b.timestamp ? new Date(b.timestamp * 1000).toISOString() : new Date().toISOString(),
          hash:          b.hash || "",
          previous_hash: b.previous_hash || "",
          data: {
            ticker:       b.data?.company || b.data?.ticker || "",
            decision:     b.data?.vote === "YES" ? "FOR" : b.data?.vote === "NO" ? "AGAINST" : b.data?.vote === "REVIEW" ? "FLAGGED" : null,
            rule_matched: b.data?.rule_triggered || "",
          },
        }));
        setAuditBlocks(blocks);
      } catch (err) {
        setError("Could not load audit log — backend may be offline.");
      }
    }

    fetchLog();
    const interval = setInterval(fetchLog, 10000);
    return () => clearInterval(interval);
  }, []);

  async function handleVerify() {
    setIsVerifying(true);
    try {
      const res  = await fetch("/api/verify-chain");
      const data = await res.json();
      setVerifyResult(data);
    } catch (err) {
      setError("Verification failed — backend may be offline.");
    } finally {
      setIsVerifying(false);
    }
  }

  return (
    <div className="p-8">
      {error && (
        <div className="bg-red-950 border border-red-500 rounded-lg px-4 py-3 mb-5 text-red-400 text-sm">
          {error}
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
