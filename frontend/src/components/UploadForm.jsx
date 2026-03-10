import React, { useState, useRef } from 'react'

const STEPS_BY_MODE = {
  pdf:    ['Reading proxy document...', 'Parsing PDF structure...', 'Extracting proposals with AI...', 'Running deterministic rules engine...', 'Recording to audit chain...'],
  text:   ['Reading proxy document...', 'Parsing document structure...', 'Extracting proposals with AI...', 'Running deterministic rules engine...', 'Recording to audit chain...'],
  ticker: ['Searching SEC EDGAR...', 'Fetching proxy filing...', 'Extracting proposals with AI...', 'Running deterministic rules engine...', 'Recording to audit chain...'],
}

const CHIPS = ['AAPL', 'MSFT', 'JPM']

function Spinner() {
  return (
    <div className="w-3.5 h-3.5 border-2 border-white/15 border-t-gray-50 rounded-full animate-spin shrink-0" />
  )
}

function TabBtn({ id, label, icon, mode, setMode }) {
  const active = mode === id
  return (
    <button
      onClick={() => setMode(id)}
      className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs tracking-wider font-mono border-b-2 transition-colors duration-150 ${
        active
          ? 'bg-gray-900 border-indigo-500 text-gray-50 font-bold'
          : 'bg-black/15 border-transparent text-gray-600 hover:text-gray-300'
      }`}
    >
      <span>{icon}</span>{label}
    </button>
  )
}

export default function UploadForm({ onAnalyze, isLoading, loadingStep }) {
  const [mode, setMode]     = useState('ticker')
  const [ticker, setTicker] = useState('')
  const [file, setFile]     = useState(null)
  const [text, setText]     = useState('')
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const steps = STEPS_BY_MODE[mode]

  const canSubmit =
    mode === 'ticker' ? ticker.trim().length > 0 :
    mode === 'pdf'    ? !!file :
    text.trim().length > 0

  const inputLabel =
    mode === 'ticker' ? (ticker || '—') :
    mode === 'pdf'    ? (file?.name ?? '—') :
    'pasted text'

  function handleFile(f) {
    if (f && f.type === 'application/pdf') setFile(f)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  function handleAnalyze() {
    if (!canSubmit || isLoading) return
    if (mode === 'ticker') onAnalyze({ type: 'ticker', ticker: ticker.trim().toUpperCase() })
    else if (mode === 'pdf') onAnalyze({ type: 'pdf', file })
    else onAnalyze({ type: 'text', text: text.trim() })
  }

  return (
    <div className="max-w-xl font-sans">
      {/* Header */}
      <div className="mb-9">
        <div className="text-[11px] tracking-[0.12em] uppercase text-green-500 mb-2.5">Step 2 of 3</div>
        <h1 className="font-['Anta',sans-serif] text-[28px] font-normal text-gray-50 leading-tight mb-2.5">
          Proxy Ballot Analysis
        </h1>
        <p className="text-gray-500 text-sm leading-relaxed max-w-lg">
          Enter a ticker to fetch from SEC EDGAR, upload a DEF 14A PDF, or
          paste the filing text — then run it through your compiled policy.
        </p>
      </div>

      {/* Input panel */}
      {!isLoading && (
        <div className="animate-[fadein_300ms_ease_both]">
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden mb-4">
            {/* Tabs */}
            <div className="flex border-b border-gray-800">
              <TabBtn id="ticker" label="Ticker"     icon="🔎" mode={mode} setMode={setMode} />
              <TabBtn id="pdf"    label="PDF Upload" icon="📄" mode={mode} setMode={setMode} />
              <TabBtn id="text"   label="Paste Text" icon="📋" mode={mode} setMode={setMode} />
            </div>

            {/* Ticker tab */}
            {mode === 'ticker' && (
              <div className="px-6 pt-7 pb-5">
                <input
                  type="text"
                  placeholder="AAPL"
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  maxLength={10}
                  className="w-full bg-black/30 border border-gray-800 rounded-md text-gray-50 text-4xl font-mono font-bold tracking-[0.12em] text-center px-4 py-4 mb-5 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 placeholder-gray-800 transition-all duration-150 uppercase"
                />
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] text-gray-600 mr-1">Try:</span>
                  {CHIPS.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => setTicker(chip)}
                      className={`text-xs font-mono font-medium tracking-wider px-3 py-1.5 rounded border transition-all duration-150 ${
                        ticker === chip
                          ? 'bg-indigo-500/15 border-indigo-500 text-indigo-400'
                          : 'bg-white/[0.04] border-gray-800 text-gray-500 hover:bg-indigo-500/15 hover:border-indigo-500 hover:text-indigo-400'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* PDF tab */}
            {mode === 'pdf' && (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                {!file ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current.click()}
                    className={`m-4 p-12 flex flex-col items-center gap-2.5 border border-dashed rounded-md bg-black/15 cursor-pointer transition-all duration-150 ${
                      dragOver ? 'border-indigo-500 bg-indigo-500/[0.07]' : 'border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <span className="text-3xl opacity-40">📄</span>
                    <span className="text-sm text-gray-500 font-medium">Drop PDF here or click to browse</span>
                    <span className="text-[11px] text-gray-700 tracking-wider">DEF 14A proxy filing · PDF only</span>
                  </div>
                ) : (
                  <div className="px-6 py-5 flex items-center gap-3.5 animate-[fadein_200ms_ease_both]">
                    <span className="text-2xl shrink-0">📄</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-50 truncate">{file.name}</div>
                      <div className="text-[11px] text-gray-600 mt-0.5">{(file.size / 1024).toFixed(0)} KB · PDF</div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); inputRef.current.value = '' }}
                      className="text-gray-500 hover:text-red-500 bg-none border-none cursor-pointer text-xl leading-none p-1 transition-colors duration-150 shrink-0"
                      title="Remove file"
                    >×</button>
                  </div>
                )}
              </>
            )}

            {/* Text tab */}
            {mode === 'text' && (
              <div className="p-4">
                <textarea
                  placeholder={"Paste the full DEF 14A proxy filing text here...\n\nYou can copy-paste directly from a browser, PDF reader, or SEC EDGAR."}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={10}
                  className="w-full bg-black/30 border border-gray-800 rounded-md text-gray-50 font-mono text-[13px] leading-relaxed px-4 py-3.5 resize-y focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 placeholder-gray-700 transition-all duration-150"
                />
                <div className={`flex justify-end mt-2 text-[11px] ${text.length > 0 ? 'text-gray-600' : 'text-gray-800'}`}>
                  {text.length.toLocaleString()} chars
                </div>
              </div>
            )}
          </div>

          {/* Submit button */}
          <button
            disabled={!canSubmit}
            onClick={handleAnalyze}
            className={`w-full py-3.5 rounded font-bold text-sm tracking-wide transition-all duration-150 active:translate-y-px ${
              canSubmit
                ? 'bg-indigo-500 hover:bg-indigo-600 text-white cursor-pointer'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            Analyze Proxy Ballot →
          </button>
        </div>
      )}

      {/* Pipeline (loading) */}
      {isLoading && (
        <div className="animate-[fadein_300ms_ease_both]">
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden mb-6">
            <div className="px-4 py-2.5 border-b border-gray-800 bg-black/20">
              <span className="text-[11px] text-gray-600 tracking-wider font-mono">Pipeline</span>
            </div>
            <div className="py-1">
              {steps.map((label, i) => {
                const n       = i + 1
                const done    = n < loadingStep
                const active  = n === loadingStep
                const pending = n > loadingStep
                return (
                  <div
                    key={n}
                    className={`flex items-center gap-3.5 px-5 py-3 transition-opacity duration-300 ${
                      i < steps.length - 1 ? 'border-b border-white/[0.04]' : ''
                    } ${pending ? 'opacity-35' : 'opacity-100'}`}
                  >
                    <div className="w-5 flex justify-center shrink-0">
                      {done    && <span className="text-green-500 text-sm font-bold">✓</span>}
                      {active  && <Spinner />}
                      {pending && <span className="w-1.5 h-1.5 rounded-full bg-gray-700 block mx-auto" />}
                    </div>
                    <span className={`font-mono text-[10px] tracking-wider w-5 shrink-0 ${
                      done ? 'text-green-500' : active ? 'text-indigo-400' : 'text-gray-700'
                    }`}>
                      {String(n).padStart(2, '0')}
                    </span>
                    <span className={`text-[13.5px] ${
                      done ? 'text-gray-500 font-normal' : active ? 'text-gray-50 font-semibold' : 'text-gray-600 font-normal'
                    }`}>
                      {label}
                    </span>
                    {done && <span className="ml-auto text-[10px] text-green-500 opacity-60">done</span>}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="text-center px-2">
            <span className="text-sm text-gray-600 tracking-wider font-mono">Analyzing </span>
            <span className="text-sm text-gray-500 tracking-widest font-semibold font-mono">{inputLabel}</span>
          </div>
        </div>
      )}
    </div>
  )
}
