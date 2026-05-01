'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
      <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center flex-shrink-0">
        <span className="text-white font-mono font-bold text-xs">S</span>
      </div>
      <span className="font-mono font-semibold text-white text-base tracking-tight">stackr</span>
    </Link>
  )
}

function Badge({ children, color = 'accent' }) {
  const colors = {
    accent: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    red: 'bg-red-500/10 text-red-400 border-red-500/20',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${colors[color] || colors.accent}`}>
      {children}
    </span>
  )
}

function SettingsPanel({ settings, onChange }) {
  const btn = (field, value, label) => (
    <button
      onClick={() => onChange({ ...settings, [field]: value })}
      className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all border ${
        settings[field] === value
          ? 'bg-accent text-white border-accent'
          : 'bg-transparent text-white/40 border-white/10 hover:border-white/20 hover:text-white/70'
      }`}
    >
      {label}
    </button>
  )
  return (
    <div className="bg-navy-2 border border-white/5 rounded-xl p-5 mb-6">
      <p className="text-xs font-mono text-white/30 tracking-widest mb-4">ANALYSIS SETTINGS</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <p className="text-xs text-white/40 font-mono mb-2">Dimensioning Standard</p>
          <div className="flex gap-2">
            {btn('standard', 'ANSI', 'ANSI / ASME')}
            {btn('standard', 'ISO', 'ISO')}
          </div>
        </div>
        <div>
          <p className="text-xs text-white/40 font-mono mb-2">Analysis Method</p>
          <div className="flex flex-wrap gap-2">
            {btn('method', 'AUTO', 'Auto (AI)')}
            {btn('method', 'RSS', 'RSS')}
            {btn('method', 'WORST_CASE', 'Worst Case')}
            {btn('method', 'VECTOR', 'Vector')}
          </div>
        </div>
        <div>
          <p className="text-xs text-white/40 font-mono mb-2">Units</p>
          <div className="flex gap-2">
            {btn('units', 'mm', 'mm')}
            {btn('units', 'inch', 'inch')}
          </div>
        </div>
      </div>
    </div>
  )
}

function UploadZone({ onFiles, dragging, setDragging }) {
  const inputRef = useRef()
  const isImage = f => f.type.startsWith('image/') || f.name.match(/\.(png|jpg|jpeg|webp|gif)$/i)
  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const newFiles = Array.from(e.dataTransfer.files).filter(f => isImage(f) || f.type === 'application/pdf')
    if (newFiles.length) onFiles(newFiles)
  }, [onFiles, setDragging])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current.click()}
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
        dragging ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'
      }`}
    >
      <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a7aff" strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
        </svg>
      </div>
      <p className="font-mono font-medium text-white mb-2">Drop files here</p>
      <p className="text-sm text-white/30 max-w-sm mx-auto mb-3">PNG · JPG · PDF · multiple sheets supported</p>
      <div className="flex justify-center gap-2 flex-wrap">
        {['Image', 'PDF', 'Multi-sheet', 'Multiple files'].map(t => (
          <span key={t} className="text-xs font-mono bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white/30">{t}</span>
        ))}
      </div>
      <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,.webp,.gif,.pdf" multiple className="hidden"
        onChange={e => { const fs = Array.from(e.target.files); if (fs.length) onFiles(fs) }} />
    </div>
  )
}

function AnnotatedImage({ imageUrl, annotations = [] }) {
  const canvasRef = useRef()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!imageUrl || !canvasRef.current || !annotations.length) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      annotations.forEach(ann => {
        if (ann.x == null || ann.y == null) return
        const x = (ann.x / 100) * img.width
        const y = (ann.y / 100) * img.height
        const r = Math.max(16, img.width / 50)
        ctx.beginPath()
        ctx.arc(x, y, r, 0, 2 * Math.PI)
        ctx.fillStyle = ann.type === 'critical' ? 'rgba(239,68,68,0.85)' : 'rgba(26,122,255,0.85)'
        ctx.fill()
        ctx.strokeStyle = '#fff'
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.fillStyle = '#fff'
        ctx.font = `bold ${Math.max(13, img.width / 45)}px monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(ann.index), x, y)
      })
      setReady(true)
    }
    img.src = imageUrl
  }, [imageUrl, annotations])

  const download = () => {
    const link = document.createElement('a')
    link.download = 'stackr-annotated.png'
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  return (
    <div className="bg-navy-2 border border-white/5 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <p className="text-xs font-mono text-white/30 tracking-widest">ANNOTATED DRAWING — SUGGESTED CHANGES</p>
        {ready && (
          <button onClick={download} className="text-xs font-mono bg-accent hover:bg-accent/90 text-white px-3 py-1.5 rounded-lg transition-colors">
            ↓ Download annotated image
          </button>
        )}
      </div>
      <div className="p-4 bg-black/20">
        <canvas ref={canvasRef} className="w-full rounded-lg" style={{ maxHeight: 500, objectFit: 'contain' }} />
      </div>
    </div>
  )
}

function ResultSection({ analysis, imageUrl }) {
  if (!analysis) return null
  const { method, methodRationale, dimensions = [], gdtControls = [], stackupChain = [], result = {}, assemblySummary, annotations = [] } = analysis
  const isGood = result.gapMin !== undefined && result.gapMin >= 0
  const methodColors = { RSS: 'accent', 'WORST CASE': 'amber', VECTOR: 'purple', WORST_CASE: 'amber' }

  return (
    <div className="space-y-4 fade-up">
      {assemblySummary && (
        <div className="bg-navy-2 border-l-2 border-accent border border-white/5 rounded-lg p-4">
          <p className="text-sm text-white/60 leading-relaxed">
            <span className="text-accent font-mono font-medium">Assembly: </span>{assemblySummary}
          </p>
          {analysis.standard && (
            <span className="mt-2 inline-block text-xs font-mono bg-accent/10 text-accent border border-accent/20 rounded px-2 py-0.5">{analysis.standard} Standard</span>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-navy-2 border border-white/5 rounded-xl p-5">
          <p className="text-xs font-mono text-white/30 tracking-widest mb-3">METHOD SELECTED</p>
          <div className="flex items-start gap-3">
            <Badge color={methodColors[method?.toUpperCase()] || 'accent'}>{method}</Badge>
            <p className="text-sm text-white/50 leading-relaxed">{methodRationale}</p>
          </div>
        </div>
        <div className={`rounded-xl p-5 border ${isGood ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
          <p className="text-xs font-mono text-white/30 tracking-widest mb-3">FINAL STACKUP RESULT</p>
          <div className="flex items-baseline gap-2 mb-3">
            <span className={`text-4xl font-mono font-bold ${isGood ? 'text-green' : 'text-amber'}`}>{result.nominal}</span>
            <span className="text-white/30 text-sm font-mono">{analysis.units || 'mm'} nominal</span>
          </div>
          <div className="flex gap-4 text-sm font-mono mb-2">
            <div><span className="text-white/30">Min: </span><span className="text-white/70">{result.gapMin}</span></div>
            <div><span className="text-white/30">Max: </span><span className="text-white/70">{result.gapMax}</span></div>
            {result.sigma && <div><span className="text-white/30">σ: </span><span className="text-accent">{result.sigma}</span></div>}
          </div>
          <div className={`text-xs font-mono px-3 py-2 rounded-lg ${isGood ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
            {isGood ? '✓ Assembly meets closure requirements' : '⚠ Potential interference — review tolerances'}
          </div>
        </div>
      </div>

      {dimensions.length > 0 && (
        <div className="bg-navy-2 border border-white/5 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
            <p className="text-xs font-mono text-white/30 tracking-widest">DIMENSIONS & TOLERANCES</p>
            <span className="text-xs font-mono text-white/20">{dimensions.length} features</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {['#', 'Feature', 'Nominal', '+Tol', '−Tol', 'Condition', 'GD&T', 'Suggested change'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-mono text-white/25 tracking-wide font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dimensions.map((d, i) => (
                  <tr key={i} className={`border-b border-white/[0.03] ${i % 2 === 1 ? 'bg-white/[0.015]' : ''}`}>
                    <td className="px-4 py-3 text-white/20 font-mono text-xs">{i + 1}</td>
                    <td className="px-4 py-3 text-white/70 font-mono">{d.feature}</td>
                    <td className="px-4 py-3 text-accent font-mono font-medium">{d.nominal}</td>
                    <td className="px-4 py-3 text-emerald-400 font-mono">+{d.upperTol}</td>
                    <td className="px-4 py-3 text-red-400 font-mono">−{d.lowerTol}</td>
                    <td className="px-4 py-3">{d.condition && <Badge color={d.condition === 'MMC' ? 'accent' : d.condition === 'LMC' ? 'green' : 'purple'}>{d.condition}</Badge>}</td>
                    <td className="px-4 py-3 text-white/30 font-mono text-xs">{d.gdtControl || '—'}</td>
                    <td className="px-4 py-3">
                      {d.suggestedChange && (
                        <span className="text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-2 py-0.5 whitespace-nowrap">→ {d.suggestedChange}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {gdtControls.length > 0 && (
        <div className="bg-navy-2 border border-white/5 rounded-xl p-5">
          <p className="text-xs font-mono text-white/30 tracking-widest mb-4">GD&T CONTROLS</p>
          <div className="flex flex-wrap gap-3">
            {gdtControls.map((g, i) => (
              <div key={i} className="bg-navy-3 border border-white/5 rounded-lg px-4 py-3">
                <p className="text-xs font-mono text-white/30 uppercase tracking-wide mb-1">{g.type}</p>
                <p className="text-lg font-mono font-semibold text-accent">{g.value} <span className="text-sm font-normal">{analysis.units || 'mm'}</span></p>
                {g.feature && <p className="text-xs text-white/30 mt-1">{g.feature}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {stackupChain.length > 0 && (
        <div className="bg-navy-2 border border-white/5 rounded-xl p-5">
          <p className="text-xs font-mono text-white/30 tracking-widest mb-4">STACKUP CHAIN</p>
          <div className="flex flex-wrap items-center gap-2">
            {stackupChain.map((item, i) => (
              <span key={i} className="flex items-center gap-2">
                <span className="bg-navy-3 border border-white/5 rounded-md px-3 py-1.5 text-sm font-mono text-white/70">{item}</span>
                {i < stackupChain.length - 1 && <span className="text-white/20 font-mono">→</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          ['WC Tolerance', result.totalWCTolerance !== undefined ? `±${result.totalWCTolerance}` : '—'],
          ['RSS Tolerance', result.totalRSSTolerance !== undefined ? `±${result.totalRSSTolerance}` : '—'],
          ['Sigma level', result.sigma ? `${result.sigma}σ` : '—'],
          ['Contributors', dimensions.length || '—'],
        ].map(([label, val]) => (
          <div key={label} className="bg-navy-3 rounded-lg p-4">
            <p className="text-xs font-mono text-white/25 mb-2">{label}</p>
            <p className="text-lg font-mono font-semibold text-white/80">{val}</p>
          </div>
        ))}
      </div>

      {result.recommendations?.length > 0 && (
        <div className="bg-navy-2 border border-white/5 rounded-xl p-5">
          <p className="text-xs font-mono text-white/30 tracking-widest mb-4">ENGINEERING RECOMMENDATIONS</p>
          <ul className="space-y-2">
            {result.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/50">
                <span className="text-accent mt-0.5 flex-shrink-0">→</span>{r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {imageUrl && annotations.length > 0 && (
        <>
          <AnnotatedImage imageUrl={imageUrl} annotations={annotations} />
          <div className="bg-navy-2 border border-white/5 rounded-xl p-5">
            <p className="text-xs font-mono text-white/30 tracking-widest mb-4">ANNOTATION LEGEND</p>
            <div className="space-y-2">
              {annotations.map((ann, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-mono font-bold ${ann.type === 'critical' ? 'bg-red-500' : 'bg-accent'}`}>
                    {ann.index}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-mono text-white/70">{ann.feature}</p>
                    <p className="text-xs text-white/40">{ann.description}</p>
                  </div>
                  <Badge color={ann.type === 'critical' ? 'red' : 'accent'}>{ann.type}</Badge>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <p className="text-xs text-white/20 leading-relaxed pt-2 border-t border-white/5 font-mono">
        AI-generated analysis. Verify against original drawings. Validate safety-critical assemblies per {analysis.standard === 'ISO' ? 'ISO 2768' : 'ASME Y14.5'}.
      </p>
    </div>
  )
}

export default function AnalyzePage() {
  const [files, setFiles] = useState([])
  const [previews, setPreviews] = useState([])
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState(null)
  const [activePreview, setActivePreview] = useState(0)
  const [settings, setSettings] = useState({ standard: 'ANSI', method: 'AUTO', units: 'mm' })

  const isImage = f => f.type.startsWith('image/') || f.name.match(/\.(png|jpg|jpeg|webp|gif)$/i)

  const handleFiles = (newFiles) => {
    setFiles(prev => [...prev, ...newFiles])
    newFiles.forEach(f => {
      if (isImage(f)) {
        setPreviews(prev => [...prev, { url: URL.createObjectURL(f), name: f.name, type: 'image' }])
      } else {
        setPreviews(prev => [...prev, { url: null, name: f.name, type: 'pdf' }])
      }
    })
    setAnalysis(null)
    setError(null)
  }

  const handleAnalyze = async () => {
    if (!files.length) return
    setLoading(true)
    setError(null)
    setAnalysis(null)
    const imageFile = files.find(f => isImage(f))
    if (!imageFile) {
      setError('Please include at least one image file (PNG/JPG) for analysis.')
      setLoading(false)
      return
    }
    const reader = new FileReader()
    reader.onload = async (e) => {
      const b64 = e.target.result.split(',')[1]
      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageB64: b64, imageMime: imageFile.type || 'image/jpeg', settings, fileCount: files.length }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Analysis failed')
        setAnalysis(data)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    reader.readAsDataURL(imageFile)
  }

  const reset = () => { setFiles([]); setPreviews([]); setAnalysis(null); setError(null); setActivePreview(0) }
  const firstImagePreview = previews.find(p => p.type === 'image')

  return (
    <div className="min-h-screen bg-navy">
      <header className="border-b border-white/5 bg-navy-2/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-white/20 bg-white/5 border border-white/10 rounded px-2 py-1">{settings.standard} · {settings.method} · {settings.units}</span>
            <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="font-mono font-bold text-2xl text-white mb-1">Tolerance Stackup Analyzer</h1>
          <p className="text-sm text-white/30 font-mono">GD&T · MMC/LMC · RSS · Worst Case · Vector · Multi-file</p>
        </div>

        <SettingsPanel settings={settings} onChange={setSettings} />

        {files.length === 0 ? (
          <UploadZone onFiles={handleFiles} dragging={dragging} setDragging={setDragging} />
        ) : (
          <div className="space-y-4 mb-8">
            {previews.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {previews.map((p, i) => (
                  <button key={i} onClick={() => setActivePreview(i)}
                    className={`flex-shrink-0 text-xs font-mono px-3 py-1.5 rounded-md border transition-all ${
                      activePreview === i ? 'border-accent text-accent bg-accent/10' : 'border-white/10 text-white/30 hover:border-white/20'
                    }`}>
                    {p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name}
                  </button>
                ))}
              </div>
            )}
            {previews[activePreview]?.url ? (
              <div className="relative rounded-xl overflow-hidden border border-white/10 bg-navy-2">
                <img src={previews[activePreview].url} alt="Drawing" className="w-full max-h-80 object-contain block" />
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-navy-2 p-10 text-center">
                <p className="text-4xl mb-3">📄</p>
                <p className="font-mono text-white/50">{previews[activePreview]?.name}</p>
              </div>
            )}
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleAnalyze} disabled={loading}
                className="flex items-center gap-2 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono font-medium px-6 py-2.5 rounded-lg transition-colors text-sm">
                {loading ? <><span className="spinner" /> Analyzing...</> : 'Run analysis →'}
              </button>
              <button onClick={() => { const inp = document.createElement('input'); inp.type='file'; inp.multiple=true; inp.accept='.png,.jpg,.jpeg,.webp,.gif,.pdf'; inp.onchange=e=>handleFiles(Array.from(e.target.files)); inp.click() }}
                className="text-white/30 hover:text-white/60 font-mono text-sm px-4 py-2.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                + Add files
              </button>
              <button onClick={reset} className="text-white/30 hover:text-white/60 font-mono text-sm px-4 py-2.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">Clear all</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-navy-2 border border-white/5 rounded-lg px-3 py-1.5 text-xs font-mono text-white/40">
                  <div className="w-1.5 h-1.5 rounded-full bg-green" />
                  {f.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-400 font-mono">{error}</p>
          </div>
        )}

        {analysis && <ResultSection analysis={analysis} imageUrl={firstImagePreview?.url} />}
      </main>
    </div>
  )
}
