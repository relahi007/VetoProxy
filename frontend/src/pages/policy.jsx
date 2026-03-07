import { useState } from "react";
import { useAppState } from "../state.jsx";
import PolicyForm from "../components/PolicyForm.jsx";

export default function Policy() {
  const { setPolicy } = useAppState();
  const [compiledRules, setCompiledRules] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleCompile(text) {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/compile-policy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: text }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Normalize compiled_rules into the shape PolicyForm expects
      const normalized = data.compiled_rules.map((r, i) => ({
        rule_id:     r.rule_id || `r${i + 1}`,
        type:        r.type || "auditor",
        description: r.original || r.description || r.condition || "",
        condition:   r.condition || "",
      }));

      setCompiledRules(normalized);
      setPolicy({ rules: data.compiled_rules, policy_id: "pol_" + Date.now() });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-8">
      {error && (
        <div className="bg-red-950 border border-red-500 rounded-lg px-4 py-3 mb-5 text-red-400 text-sm">
          {error}
        </div>
      )}
      <PolicyForm
        onCompile={handleCompile}
        compiledRules={compiledRules}
        isLoading={isLoading}
      />
    </div>
  );
}
