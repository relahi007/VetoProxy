import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../state";
import { fetchProxyByTicker, extractProposals, runVote } from "../api";
import UploadForm from "../components/UploadForm";

export default function Upload() {
  const { currentPolicy, setResults } = useAppState();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState(null);
  const [overlay, setOverlay] = useState(false);
  const [overlayExit, setOverlayExit] = useState(false);
  const [overlayLabel, setOverlayLabel] = useState("");
  const navigate = useNavigate();

  async function handleAnalyze(payload) {
    if (!currentPolicy) return;

    const label =
      payload.type === "ticker" ? payload.ticker :
      payload.type === "pdf"    ? payload.file.name :
      "pasted text";

    setOverlayLabel(label);
    setError(null);
    setIsLoading(true);
    setLoadingStep(1);

    try {
      // ── Step 1-2: Fetch / extract proposals ─────────────────
      setLoadingStep(2);
      let extracted;
      if (payload.type === "ticker") {
        extracted = await fetchProxyByTicker(payload.ticker);
      } else {
        extracted = await extractProposals(payload);
      }
      // extracted = { proposals: [...], company: "...", source: "..." }

      // ── Step 3: Run rules engine + record to VetoChain ──────
      setLoadingStep(3);
      const voteData = await runVote(
        extracted.proposals,
        currentPolicy.rules,
        extracted.company
      );
      // voteData = { decisions: [...], summary: {...} }

      // ── Step 4-5: Store results ──────────────────────────────
      setLoadingStep(4);

      // Normalize into the shape ResultsTable expects
      const results = {
        company: extracted.company,
        ticker: payload.type === "ticker" ? payload.ticker : extracted.company,
        votes: voteData.decisions.map((d) => ({
          proposal_id:    d.proposal,
          proposal_label: d.proposal,
          type:           d.type,
          extracted_fact: d.description || "—",
          rule_matched:   d.rule_triggered,
          decision:       d.vote === "YES" ? "FOR" : d.vote === "NO" ? "AGAINST" : "FLAGGED",
          confidence:     d.confidence === "HIGH" ? 1.0 : d.confidence === "MEDIUM" ? 0.6 : 0.3,
          notes:          d.confidence === "REQUIRES_HUMAN_REVIEW"
                            ? "This proposal could not be matched to a rule and requires manual review."
                            : d.rule_triggered,
        })),
      };

      setLoadingStep(5);
      setResults(results);

      await new Promise((r) => setTimeout(r, 400));
      setIsLoading(false);
      setOverlay(true);

      setTimeout(() => {
        setOverlayExit(true);
        setTimeout(() => navigate("/results"), 300);
      }, 800);

    } catch (err) {
      setIsLoading(false);
      setLoadingStep(0);
      setError(
        err.message.includes("filing")
          ? `No SEC filing found for that ticker.`
          : `Analysis failed: ${err.message}`
      );
    }
  }

  return (
    <div style={{ padding: "40px 48px", maxWidth: 900, position: "relative" }}>

      {/* Completion overlay */}
      {overlay && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(4,7,18,0.97)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 18,
          opacity: overlayExit ? 0 : 1,
          transition: "opacity 280ms ease",
        }}>
          <div style={{ fontSize: 80, color: "#22c55e", lineHeight: 1 }}>✓</div>
          <div style={{ color: "#f9fafb", fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Analysis Complete
          </div>
          <div style={{ color: "#6b7280", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: "0.08em" }}>
            {overlayLabel} · navigating to results…
          </div>
        </div>
      )}

      {/* No policy warning */}
      {!currentPolicy && (
        <div style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.3)", borderRadius: 8, padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 14, maxWidth: 560, marginBottom: 24 }}>
          <span style={{ fontSize: 18, flexShrink: 0 }}>⚠</span>
          <div>
            <div style={{ color: "#fbbf24", fontWeight: 600, fontSize: 14, marginBottom: 6 }}>No policy compiled yet.</div>
            <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>Compile a policy before analyzing a ballot.</div>
            <button
              onClick={() => navigate("/policy")}
              style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 4, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
            >
              Go to Policy Compiler →
            </button>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "14px 18px", marginBottom: 24, color: "#fca5a5", fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      <UploadForm
        onAnalyze={handleAnalyze}
        isLoading={isLoading}
        loadingStep={loadingStep}
      />
    </div>
  );
}
