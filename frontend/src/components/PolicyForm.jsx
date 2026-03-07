import React, { useState } from 'react'

const TYPE_BADGE = {
  compensation: { className: 'bg-indigo-500/15 text-indigo-400', label: 'Compensation' },
  board:        { className: 'bg-blue-500/15 text-blue-400',    label: 'Board' },
  shareholder:  { className: 'bg-green-500/15 text-green-400',  label: 'Shareholder' },
  auditor:      { className: 'bg-gray-500/15 text-gray-400',    label: 'Auditor' },
}

const PLACEHOLDER = `Vote against executive pay raises above 10%.
Vote against board members serving on more than 4 boards.
Support shareholder proposals related to climate disclosure.`

function PulseDot() {
  return (
    <span className="inline-flex gap-1 items-center mr-2">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-1.5 h-1.5 rounded-full bg-white/80 inline-block animate-pulse"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  )
}

function TypeBadge({ type }) {
  const cfg = TYPE_BADGE[type] || TYPE_BADGE.auditor
  return (
    <span className={`text-[11px] font-mono font-medium tracking-wider uppercase px-2 py-0.5 rounded shrink-0 ${cfg.className}`}>
      {cfg.label}
    </span>
  )
}

function RuleCard({ rule, index }) {
  return (
    <div
      className="bg-gray-900 border border-gray-800 rounded-lg p-4 flex items-start gap-3.5 animate-[fadeslide_350ms_ease_both]"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <span className="text-green-500 text-base leading-none mt-0.5 shrink-0 font-bold">✓</span>
      <div className="flex-1 min-w-0">
        <div className="text-gray-50 text-sm font-medium leading-relaxed mb-1.5">
          {rule.description}
        </div>
        <div className="font-mono text-xs text-gray-500 bg-white/[0.03] border border-white/[0.05] rounded px-2 py-1 inline-block tracking-wide">
          {rule.condition}
        </div>
      </div>
      <div className="pt-0.5">
        <TypeBadge type={rule.type} />
      </div>
    </div>
  )
}

export default function PolicyForm({ onCompile, compiledRules, isLoading }) {
  const [text, setText] = useState('')

  function handleCompile() {
    if (!text.trim() || isLoading) return
    onCompile(text)
  }

  const ruleCount = compiledRules?.length ?? 0
  const showRules = compiledRules !== null && compiledRules !== undefined && !isLoading

  const statusDot = isLoading
    ? 'bg-yellow-400 shadow-[0_0_6px_#eab30888]'
    : compiledRules
    ? 'bg-green-500 shadow-[0_0_6px_#22c55e88]'
    : 'bg-gray-700'

  return (
    <div className="max-w-2xl font-mono">
      {/* Header */}
      <div className="mb-7">
        <div className="text-[11px] tracking-[0.12em] uppercase text-indigo-500 mb-2.5">
          Step 1 of 3
        </div>
        <h1 className="font-['Anta',sans-serif] text-[28px] font-normal text-gray-50 tracking-wide leading-tight mb-2.5">
          Governance Policy
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed max-w-lg">
          Write your voting principles in plain English. Our AI will compile
          them into enforceable rules applied to every proxy ballot.
        </p>
      </div>

      {/* Editor card */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden mb-4">
        <div className="px-4 py-2.5 border-b border-gray-800 flex items-center gap-2 bg-black/20">
          <span className="text-[11px] text-gray-600 tracking-wider">impose your policy</span>
          <span className={`ml-auto w-1.5 h-1.5 rounded-full transition-all duration-300 ${statusDot}`} />
        </div>
        <textarea
          rows={9}
          disabled={isLoading}
          placeholder={PLACEHOLDER}
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-transparent border-none border-b border-gray-800 text-gray-50 font-sans text-sm leading-[1.7] px-5 py-4 resize-y transition-colors duration-150 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 placeholder-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="px-4 py-2 flex justify-end">
          <span className={`text-[11px] ${text.length > 0 ? 'text-gray-600' : 'text-gray-800'}`}>
            {text.length} chars
          </span>
        </div>
      </div>

      {/* Compile button */}
      <button
        disabled={isLoading || !text.trim()}
        onClick={handleCompile}
        className={`w-full py-3.5 rounded font-bold text-sm flex items-center justify-center tracking-wide mb-7 transition-all duration-150 active:translate-y-px ${
          isLoading || !text.trim()
            ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
            : 'bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer'
        }`}
      >
        {isLoading ? <><PulseDot />Compiling…</> : 'Compile Policy →'}
      </button>

      {/* Success banner + rules */}
      {showRules && (
        <div className="animate-[fadeslide_400ms_ease_both]">
          <div className="bg-green-500/[0.08] border border-green-500/25 rounded-md px-4 py-3 flex items-center gap-2.5 mb-4">
            <span className="text-green-500 text-base font-bold">✓</span>
            <span className="text-green-400 text-sm font-semibold">
              Policy Compiled —{' '}
              <span className="text-gray-50">{ruleCount} rule{ruleCount !== 1 ? 's' : ''}</span>{' '}
              active
            </span>
            <span className="ml-auto text-[11px] text-green-500 bg-green-500/10 px-2 py-0.5 rounded tracking-wider">
              LIVE
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {compiledRules.map((rule, i) => (
              <RuleCard key={rule.rule_id} rule={rule} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
