import React, { useState } from 'react'

function formatTimestamp(iso) {
  try {
    const d = new Date(iso)
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const time = d.toISOString().slice(11, 16)
    return `${date} · ${time} UTC`
  } catch {
    return iso
  }
}

const DECISION_STYLES = {
  FOR:     'bg-green-500/15 text-green-400 border-green-500/30',
  AGAINST: 'bg-red-500/15 text-red-300 border-red-500/30',
  FLAGGED: 'bg-yellow-400/15 text-yellow-300 border-yellow-400/30',
}

function DecisionBadge({ decision }) {
  const cls = DECISION_STYLES[decision] || DECISION_STYLES.FLAGGED
  return (
    <span className={`font-mono text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border whitespace-nowrap ${cls}`}>
      {decision}
    </span>
  )
}

function TickerBadge({ ticker }) {
  return (
    <span className="font-mono text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded border bg-indigo-500/15 text-indigo-400 border-indigo-500/25 whitespace-nowrap">
      {ticker}
    </span>
  )
}

function CopyHash({ fullHash }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(fullHash).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="flex items-center gap-1.5 relative">
      <span className="font-mono text-xs text-gray-600 tracking-wider">{fullHash?.slice(0, 16)}…</span>
      <button
        onClick={handleCopy}
        title="Copy full hash"
        className="bg-transparent border-none cursor-pointer text-gray-700 hover:text-indigo-400 hover:bg-indigo-500/15 text-[13px] px-1.5 py-0.5 rounded leading-none shrink-0 transition-all duration-150"
      >
        📋
      </button>
      {copied && (
        <span className="absolute right-0 -top-6 font-mono text-[10px] text-green-500 bg-green-500/10 border border-green-500/20 px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none animate-[fadeout_1.5s_ease_forwards]">
          Copied!
        </span>
      )}
    </div>
  )
}

function BlockCard({ block, index, isFlashing }) {
  const isGenesis = block.block_number === 0
  return (
    <div
      className={`grid gap-4 items-center px-5 py-4 rounded-lg border animate-[blockin_350ms_ease_both] transition-all duration-300 ${
        isGenesis
          ? 'bg-[#0d1117] border-indigo-500/20 opacity-60'
          : 'bg-gray-900 border-gray-800'
      } ${isFlashing ? 'border-green-500/70 shadow-[0_0_0_2px_rgba(34,197,94,0.25),0_0_12px_rgba(34,197,94,0.15)]' : ''}`}
      style={{ gridTemplateColumns: '120px 1fr 1fr', animationDelay: `${index * 50}ms` }}
    >
      {/* Left: block number + timestamp */}
      <div>
        {isGenesis ? (
          <div className="font-mono text-[13px] font-bold tracking-widest text-indigo-500 uppercase mb-1">GENESIS</div>
        ) : (
          <div className="font-mono text-[22px] font-medium text-gray-700 tracking-tight leading-none mb-1">
            #{String(block.block_number).padStart(3, '0')}
          </div>
        )}
        <div className="font-mono text-[10px] text-gray-600 tracking-wide leading-relaxed">
          {formatTimestamp(block.timestamp)}
        </div>
      </div>

      {/* Middle: ticker + decision + rule */}
      <div>
        {isGenesis ? (
          <div className="text-[13px] text-gray-600 italic">Chain Initialized</div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              <TickerBadge ticker={block.data.ticker} />
              {block.data.decision && <DecisionBadge decision={block.data.decision} />}
            </div>
            <div className="font-mono text-[10px] text-gray-700 tracking-wider">
              {block.data.rule_matched ? `rule: ${block.data.rule_matched}` : 'no rule matched'}
            </div>
          </>
        )}
      </div>

      {/* Right: hash */}
      <div className="text-right">
        <div className="flex justify-end mb-1.5">
          <CopyHash fullHash={block.hash} />
        </div>
        <div className="font-mono text-[10px] text-gray-800 tracking-wide">
          prev: {block.previous_hash?.slice(0, 12)}…
        </div>
      </div>
    </div>
  )
}

export default function AuditLog({ blocks = [], verifyResult, onVerify, isVerifying }) {
  const sorted = [...blocks].reverse()
  const [flashingBlocks, setFlashingBlocks] = React.useState(new Set())
  const prevValidRef = React.useRef(null)

  React.useEffect(() => {
    if (verifyResult?.valid === true && prevValidRef.current !== true) {
      sorted.forEach((block, i) => {
        setTimeout(() => {
          setFlashingBlocks(prev => new Set([...prev, block.block_number]))
          setTimeout(() => {
            setFlashingBlocks(prev => {
              const next = new Set(prev)
              next.delete(block.block_number)
              return next
            })
          }, 650)
        }, i * 100)
      })
    }
    prevValidRef.current = verifyResult?.valid ?? null
  }, [verifyResult])

  return (
    <div className="max-w-3xl">
      {/* Top bar */}
      <div className="flex items-start justify-between gap-6 mb-6 flex-wrap">
        <div>
          <h1 className="font-['Anta',sans-serif] text-[28px] font-normal text-gray-50 tracking-wide leading-tight mb-2">
            Audit Ledger
          </h1>
          <p className="text-gray-500 text-sm leading-relaxed max-w-md">
            Every vote decision is permanently recorded as a tamper-evident block.
          </p>
        </div>
        <button
          onClick={onVerify}
          disabled={isVerifying || blocks.length === 0}
          className={`flex items-center gap-2 px-4 py-2.5 rounded font-bold text-sm font-mono tracking-wide whitespace-nowrap shrink-0 mt-1 transition-colors duration-150 ${
            isVerifying || blocks.length === 0
              ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
              : 'bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer'
          }`}
        >
          {isVerifying && (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          {isVerifying ? 'Verifying…' : 'Verify Chain Integrity'}
        </button>
      </div>

      {/* Verify result banner */}
      {verifyResult && (
        <div className={`mb-5 px-4 py-3.5 rounded-md flex items-center gap-3 animate-[fadein_400ms_ease_both] ${
          verifyResult.valid
            ? 'bg-green-500/[0.08] border border-green-500/25'
            : 'bg-red-500/[0.08] border border-red-500/25'
        }`}>
          <span className={`text-base font-bold shrink-0 ${verifyResult.valid ? 'text-green-500' : 'text-red-500'}`}>
            {verifyResult.valid ? '✓' : '✗'}
          </span>
          <span className={`text-sm font-semibold ${verifyResult.valid ? 'text-green-400' : 'text-red-300'}`}>
            {verifyResult.valid
              ? `Chain Verified — ${verifyResult.total_blocks} block${verifyResult.total_blocks !== 1 ? 's' : ''}, no tampering detected`
              : `INTEGRITY VIOLATION — tampering detected in block ${verifyResult.corrupted_blocks?.[0] ?? '?'}`
            }
          </span>
          <span className={`ml-auto font-mono text-[10px] px-2 py-0.5 rounded tracking-wider ${
            verifyResult.valid
              ? 'text-green-500 bg-green-500/10'
              : 'text-red-500 bg-red-500/10'
          }`}>
            {verifyResult.valid ? 'VALID' : 'INVALID'}
          </span>
        </div>
      )}

      {/* Block list */}
      {blocks.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg py-16 px-8 text-center">
          <div className="text-4xl mb-4 opacity-30">🔗</div>
          <div className="text-gray-50 text-[15px] font-semibold mb-2">No votes recorded yet</div>
          <div className="text-gray-500 text-sm">Run an analysis to generate audit blocks.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center px-1 mb-1">
            <span className="font-mono text-[11px] text-gray-700 tracking-wider uppercase">
              {blocks.length} block{blocks.length !== 1 ? 's' : ''} · newest first
            </span>
            <span className="font-mono text-[11px] text-gray-800">SHA-256</span>
          </div>
          {sorted.map((block, i) => (
            <BlockCard
              key={block.block_number}
              block={block}
              index={i}
              isFlashing={flashingBlocks.has(block.block_number)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
