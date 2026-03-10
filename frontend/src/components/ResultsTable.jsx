import React, { useState } from 'react'

const DECISION_CONFIG = {
  FOR:     { borderColor: 'border-l-green-500',  rowBg: '',                        pillClass: 'bg-green-500/15 text-green-400 border-green-500/30' },
  AGAINST: { borderColor: 'border-l-red-500',    rowBg: 'bg-red-500/[0.05]',       pillClass: 'bg-red-500/20 text-red-300 border-red-500/30' },
  FLAGGED: { borderColor: 'border-l-yellow-400', rowBg: 'bg-yellow-400/[0.04]',    pillClass: 'bg-yellow-400/15 text-yellow-300 border-yellow-400/30' },
}

const TYPE_LABELS = {
  say_on_pay:           'Say on Pay',
  director_election:    'Director',
  shareholder_proposal: 'Shareholder',
  auditor_ratification: 'Auditor',
}

function DecisionPill({ decision }) {
  const cfg = DECISION_CONFIG[decision] || DECISION_CONFIG.FLAGGED
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono tracking-wider border whitespace-nowrap ${cfg.pillClass}`}>
      {decision}
    </span>
  )
}

function ConfidenceBar({ confidence, decision }) {
  const pct = Math.round((confidence ?? 0) * 100)
  const color =
    decision === 'AGAINST' ? 'bg-red-500' :
    decision === 'FLAGGED' ? 'bg-yellow-400' :
    'bg-green-500'
  const textColor =
    decision === 'AGAINST' ? 'text-red-500' :
    decision === 'FLAGGED' ? 'text-yellow-400' :
    'text-green-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-[5px] bg-white/[0.06] rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`font-mono text-[11px] min-w-[32px] text-right ${textColor}`}>{pct}%</span>
    </div>
  )
}

function ExpandedNotes({ notes }) {
  return (
    <tr className="animate-[expand_200ms_ease_both]">
      <td colSpan={6} className="px-4 pb-3 bg-yellow-400/[0.04] border-b border-white/[0.04]">
        <div className="bg-yellow-400/[0.06] border border-yellow-400/20 rounded-md px-4 py-3 flex items-start gap-2.5">
          <span className="text-sm shrink-0">⚠</span>
          <div>
            <div className="text-[11px] font-mono text-yellow-400 tracking-widest uppercase mb-1">Requires human review</div>
            <div className="text-sm text-gray-300 leading-relaxed">{notes}</div>
          </div>
        </div>
      </td>
    </tr>
  )
}

export default function ResultsTable({ votes = [], company, ticker, onDownloadCSV }) {
  const [expandedRows, setExpandedRows] = useState(new Set())

  function toggleRow(id) {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const forCount     = votes.filter(v => v.decision === 'FOR').length
  const againstCount = votes.filter(v => v.decision === 'AGAINST').length
  const flaggedCount = votes.filter(v => v.decision === 'FLAGGED').length

  if (votes.length === 0) {
    return (
      <div className="max-w-3xl">
        <div className="bg-gray-900 border border-gray-800 rounded-lg py-16 px-8 text-center">
          <div className="text-4xl mb-4 opacity-30">📋</div>
          <div className="text-gray-50 text-[15px] font-semibold mb-2">No proposals analyzed yet</div>
          <div className="text-gray-500 text-sm">Run an analysis from the Upload page to see results here.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-2.5 flex-1">
          <h1 className="text-[22px] font-bold text-gray-50 tracking-tight">{company}</h1>
          <span className="font-mono text-[11px] font-semibold tracking-wider text-indigo-400 bg-indigo-500/15 border border-indigo-500/30 px-2 py-0.5 rounded">
            {ticker}
          </span>
        </div>

        <div className="flex items-center gap-3.5 bg-gray-900 border border-gray-800 rounded-md px-3.5 py-1.5">
          <span className="inline-flex items-center gap-1.5">
            <span className="font-mono text-[13px] font-bold text-green-500">{forCount}</span>
            <span className="text-xs text-gray-500">FOR</span>
          </span>
          <span className="text-gray-800">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="font-mono text-[13px] font-bold text-red-500">{againstCount}</span>
            <span className="text-xs text-gray-500">AGAINST</span>
          </span>
          <span className="text-gray-800">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="font-mono text-[13px] font-bold text-yellow-400">{flaggedCount}</span>
            <span className="text-xs text-gray-500">FLAGGED</span>
          </span>
        </div>

        <button
          onClick={onDownloadCSV}
          className="text-xs font-semibold text-gray-500 bg-transparent border border-gray-800 rounded px-3.5 py-1.5 cursor-pointer whitespace-nowrap hover:bg-indigo-500/15 hover:border-indigo-500 hover:text-indigo-400 transition-all duration-150"
        >
          ↓ Download CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full border-collapse" style={{ tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '28%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '20%' }} />
          </colgroup>
          <thead>
            <tr className="bg-black/30">
              {['Proposal', 'Type', 'Key Fact', 'Rule Applied', 'Decision', 'Confidence'].map((label) => (
                <th key={label} className="px-3.5 py-2.5 text-left text-[10px] font-mono font-semibold tracking-[0.1em] uppercase text-gray-600 border-b border-gray-800 whitespace-nowrap">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {votes.map((vote, idx) => {
              const cfg       = DECISION_CONFIG[vote.decision] || DECISION_CONFIG.FLAGGED
              const isFlagged = vote.decision === 'FLAGGED'
              const isExpanded = expandedRows.has(vote.proposal_id)
              const isLast    = idx === votes.length - 1

              return (
                <React.Fragment key={vote.proposal_id}>
                  <tr
                    className={`border-l-[3px] animate-[rowin_320ms_ease_both] ${cfg.borderColor} ${cfg.rowBg} ${isFlagged ? 'cursor-pointer' : ''}`}
                    style={{ animationDelay: `${idx * 50}ms` }}
                    onClick={isFlagged ? () => toggleRow(vote.proposal_id) : undefined}
                  >
                    <td className={`pl-4 pr-3.5 py-3 text-sm align-middle ${isLast && !isExpanded ? '' : 'border-b border-white/[0.04]'} ${cfg.rowBg}`}>
                      <div className="font-medium text-gray-50 leading-snug">{vote.proposal_label}</div>
                      {isFlagged && (
                        <div className="text-[10px] font-mono text-yellow-400 mt-0.5 opacity-70">
                          {isExpanded ? '▲ collapse' : '▼ expand notes'}
                        </div>
                      )}
                    </td>
                    <td className={`px-3.5 py-3 text-sm align-middle ${isLast && !isExpanded ? '' : 'border-b border-white/[0.04]'} ${cfg.rowBg}`}>
                      <span className="font-mono text-[11px] text-gray-500 tracking-wide">
                        {TYPE_LABELS[vote.type] || vote.type}
                      </span>
                    </td>
                    <td className={`px-3.5 py-3 text-sm align-middle ${isLast && !isExpanded ? '' : 'border-b border-white/[0.04]'} ${cfg.rowBg}`}>
                      <span className="font-mono text-[11.5px] text-gray-400 bg-white/[0.04] px-1.5 py-0.5 rounded inline-block">
                        {vote.extracted_fact}
                      </span>
                    </td>
                    <td className={`px-3.5 py-3 text-sm align-middle ${isLast && !isExpanded ? '' : 'border-b border-white/[0.04]'} ${cfg.rowBg}`}>
                      <span className={`font-mono text-[11px] ${vote.rule_matched ? 'text-indigo-400' : 'text-gray-700'}`}>
                        {vote.rule_matched || '—'}
                      </span>
                    </td>
                    <td className={`px-3.5 py-3 text-sm align-middle ${isLast && !isExpanded ? '' : 'border-b border-white/[0.04]'} ${cfg.rowBg}`}>
                      <DecisionPill decision={vote.decision} />
                    </td>
                    <td className={`pl-3.5 pr-4 py-3 text-sm align-middle ${isLast && !isExpanded ? '' : 'border-b border-white/[0.04]'} ${cfg.rowBg}`}>
                      <ConfidenceBar confidence={vote.confidence} decision={vote.decision} />
                    </td>
                  </tr>
                  {isFlagged && isExpanded && <ExpandedNotes notes={vote.notes} />}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="mt-2.5 flex justify-between items-center px-1">
        <span className="font-mono text-[11px] text-gray-700">{votes.length} proposal{votes.length !== 1 ? 's' : ''} analyzed</span>
        <span className="font-mono text-[11px] text-gray-700">Powered by VetoProxy</span>
      </div>
    </div>
  )
}
