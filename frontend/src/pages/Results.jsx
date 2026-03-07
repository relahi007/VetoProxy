import { useAppState } from "../state.jsx";
import ResultsTable from "../components/ResultsTable.jsx";

export default function Results() {
  const { currentResults } = useAppState();

  function handleDownloadCSV() {
    if (!currentResults) return;
    const headers = ["Proposal,Type,Key Fact,Rule Applied,Decision,Confidence"];
    const rows = currentResults.votes.map((v) =>
      `"${v.proposal_label}","${v.type}","${v.extracted_fact}","${v.rule_matched}","${v.decision}","${Math.round((v.confidence || 0) * 100)}%"`
    );
    const csv = [...headers, ...rows].join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv," + encodeURIComponent(csv);
    a.download = `${currentResults.ticker || "votes"}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="p-8">
      <ResultsTable
        votes={currentResults?.votes || []}
        company={currentResults?.company || ""}
        ticker={currentResults?.ticker || ""}
        onDownloadCSV={handleDownloadCSV}
      />
    </div>
  );
}
