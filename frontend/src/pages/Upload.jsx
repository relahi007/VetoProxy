import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppState } from "../state.jsx";
import UploadForm from "../components/UploadForm.jsx";

export default function Upload() {
  const [isLoading, setIsLoading]     = useState(false);
  const [loadingStep, setLoadingStep] = useState(1);
  const [error, setError]             = useState(null);
  const { currentPolicy, setResults } = useAppState();
  const navigate = useNavigate();

  async function handleAnalyze(input) {
    setIsLoading(true);
    setError(null);
    setLoadingStep(1);

    const interval = setInterval(() => {
      setLoadingStep(prev => (prev < 5 ? prev + 1 : prev));
    }, 1200);

    try {
      let proposals, company, source;

      if (input.type === "ticker") {
        // Step 1-2: Fetch from SEC EDGAR
        const res = await fetch("/api/fetch-proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker: input.ticker }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        proposals = data.proposals;
        company   = data.company;
        source    = data.source;

      } else if (input.type === "pdf") {
        // PDF upload
        const formData = new FormData();
        formData.append("file", input.file);
        const res = await fetch("/api/extract-proposals", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        proposals = data.proposals;
        company   = data.company;
        source    = data.source;

      } else {
        // Paste text — send as filing_text
        const res = await fetch("/api/extract-proposals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filing_text: input.text }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        proposals = data.proposals;
        company   = data.company;
        source    = data.source;
      }

      setLoadingStep(4);

      // Step 4: Run rules engine
      const voteRes = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposals,
          rules: currentPolicy.rules,
          company,
        }),
      });
      const voteData = await voteRes.json();
      if (voteData.error) throw new Error(voteData.error);

      setLoadingStep(5);

      // Normalize for ResultsTable
      const votes = voteData.decisions.map((d, i) => ({
        proposal_id:    `p${i}`,
        proposal_label: d.proposal,
        type:           d.type,
        extracted_fact: d.description || "",
        rule_matched:   d.rule_triggered,
        decision:       d.vote === "YES" ? "FOR" : d.vote === "NO" ? "AGAINST" : "FLAGGED",
        confidence:     d.confidence === "HIGH" ? 0.95 : d.confidence === "MEDIUM" ? 0.65 : 0.3,
        notes:          d.confidence === "REQUIRES_HUMAN_REVIEW" ? d.rule_triggered : "",
      }));

      setResults({
        votes,
        company,
        ticker: input.ticker || company,
        source,
      });

      clearInterval(interval);
      navigate("/results");

    } catch (err) {
      clearInterval(interval);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setLoadingStep(1);
    }
  }

  if (!currentPolicy) {
    return (
      <div className="p-8">
        <div className="bg-yellow-950 border border-yellow-500 rounded-lg px-4 py-3 text-yellow-400 mb-4 text-sm">
          ⚠ You need to compile a policy first.
        </div>
        <a href="/policy" className="text-indigo-400 text-sm">→ Go to Policy Compiler</a>
      </div>
    );
  }

  return (
    <div className="p-8">
      {error && (
        <div className="bg-red-950 border border-red-500 rounded-lg px-4 py-3 mb-5 text-red-400 text-sm">
          {error}
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
