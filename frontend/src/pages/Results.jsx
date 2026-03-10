import { useNavigate } from "react-router-dom";
import { useAppState } from "../state";
import ResultsTable from "../components/ResultsTable";

export default function Results() {
  const { currentResults } = useAppState();
  const navigate = useNavigate();

  function handleDownloadCSV() {
    if (!currentResults) return;
    const headers = ["Proposal", "Type", "Key Fact", "Rule Applied", "Decision", "Confidence"];
    const rows = currentResults.votes.map(v => [
      `"${(v.proposal_label || "").replace(/"/g, '""')}"`,
      v.type || "",
      `"${(v.extracted_fact || "").replace(/"/g, '""')}"`,
      v.rule_matched || "",
      v.decision || "",
      `${Math.round((v.confidence ?? 0) * 100)}%`,
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentResults.ticker || "results"}_votes_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!currentResults) {
    return (
      <div style={{ padding: "40px 48px" }}>
        <div style={{ background: "#111827", border: "1px solid #1f2937", borderRadius: 8, padding: "64px 32px", textAlign: "center", maxWidth: 600 }}>
          <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>📊</div>
          <div style={{ color: "#f9fafb", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>No analysis run yet</div>
          <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 24 }}>Upload a proxy filing to see voting decisions here.</div>
          <button
            onClick={() => navigate("/upload")}
            style={{ background: "#6366f1", color: "#fff", border: "none", borderRadius: 4, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
          >
            Go to Upload →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 48px" }}>
      <ResultsTable
        votes={currentResults.votes ?? []}
        company={currentResults.company}
        ticker={currentResults.ticker}
        onDownloadCSV={handleDownloadCSV}
      />
    </div>
  );
}
