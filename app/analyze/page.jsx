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
    >{label}</button>
  )
  return (
    <div className="bg-navy-2 border border-white/5 rounded-xl p-5 mb-6">
      <p className="text-xs font-mono text-white/30 tracking-widest mb-4">ANALYSIS SETTINGS</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div>
          <p className="text-xs text-white/40 font-mono mb-2">Dimensioning Standard</p>
          <div className="flex gap-2">{btn('standard','ANSI','ANSI / ASME')}{btn('standard','ISO','ISO')}</div>
        </div>
        <div>
          <p className="text-xs text-white/40 font-mono mb-2">Analysis Method</p>
          <div className="flex flex-wrap gap-2">
            {btn('method','AUTO','Auto (AI)')}{btn('method','RSS','RSS')}{btn('method','WORST_CASE','Worst Case')}{btn('method','VECTOR','Vector')}
          </div>
        </div>
        <div>
          <p className="text-xs text-white/40 font-mono mb-2">Units</p>
          <div className="flex gap-2">{btn('units','mm','mm')}{btn('units','inch','inch')}</div>
        </div>
      </div>
    </div>
  )
}

function STLViewer({ file, onViewsReady }) {
  const mountRef = useRef()
  const [status, setStatus] = useState('Loading 3D viewer...')
  const [views, setViews] = useState([])
  const [activeView, setActiveView] = useState(0)

  useEffect(() => {
    if (!file || !mountRef.current) return
    let renderer

    const loadThree = async () => {
      setStatus('Loading 3D engine...')
      await new Promise((resolve, reject) => {
        if (window.THREE) { resolve(); return }
        const s = document.createElement('script')
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
        s.onload = resolve; s.onerror = reject
        document.head.appendChild(s)
      })
      const THREE = window.THREE
      setStatus('Parsing STL file...')
      const arrayBuffer = await file.arrayBuffer()
      let geometry
      try {
        geometry = parseBinarySTL(THREE, arrayBuffer)
        if (geometry.attributes.position.count === 0) throw new Error('empty')
      } catch {
        geometry = parseASCIISTL(THREE, new TextDecoder().decode(arrayBuffer))
      }
      geometry.computeVertexNormals()
      geometry.center()
      const W = 600, H = 450
      renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
      renderer.setSize(W, H)
      renderer.setClearColor(0x0f1729)
      mountRef.current.appendChild(renderer.domElement)
      const scene = new THREE.Scene()
      scene.add(new THREE.AmbientLight(0xffffff, 0.5))
      const dl = new THREE.DirectionalLight(0xffffff, 0.8)
      dl.position.set(5, 10, 7); scene.add(dl)
      const dl2 = new THREE.DirectionalLight(0x4488ff, 0.3)
      dl2.position.set(-5, -3, -5); scene.add(dl2)
      const mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: 0x1a7aff, specular: 0x333333, shininess: 40 }))
      scene.add(mesh)
      scene.add(new THREE.GridHelper(20, 20, 0x1e2d4d, 0x1e2d4d))
      geometry.computeBoundingBox()
      const size = new THREE.Vector3()
      geometry.boundingBox.getSize(size)
      const maxDim = Math.max(size.x, size.y, size.z)
      const camera = new THREE.PerspectiveCamera(45, W / H, 0.01, 10000)
      setStatus('Capturing views...')
      const viewDefs = [
        { name: 'Isometric', pos: [maxDim, maxDim * 0.8, maxDim] },
        { name: 'Front', pos: [0, 0, maxDim * 2] },
        { name: 'Top', pos: [0, maxDim * 2, 0.001] },
        { name: 'Side', pos: [maxDim * 2, 0, 0] },
      ]
      const captured = []
      for (const v of viewDefs) {
        camera.position.set(...v.pos); camera.lookAt(0, 0, 0)
        renderer.render(scene, camera)
        captured.push({ name: v.name, dataUrl: renderer.domElement.toDataURL('image/png') })
      }
      setViews(captured); setStatus('')
      if (onViewsReady) onViewsReady(captured)
      camera.position.set(maxDim, maxDim * 0.8, maxDim); camera.lookAt(0, 0, 0)
      let frame
      const animate = () => { frame = requestAnimationFrame(animate); mesh.rotation.y += 0.005; renderer.render(scene, camera) }
      animate()
      return () => { cancelAnimationFrame(frame); renderer.dispose() }
    }
    loadThree().catch(e => setStatus('Failed: ' + e.message))
  }, [file])

  return (
    <div className="space-y-3">
      <div className="bg-navy-3 border border-white/5 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-white/30">🔩 STL VIEWER</span>
            {status && <span className="text-xs font-mono text-accent animate-pulse">{status}</span>}
          </div>
          {views.length > 0 && (
            <div className="flex gap-1">
              {views.map((v, i) => (
                <button key={i} onClick={() => setActiveView(i)}
                  className={`text-xs font-mono px-2 py-1 rounded border transition-all ${activeView === i ? 'border-accent text-accent bg-accent/10' : 'border-white/10 text-white/30 hover:border-white/20'}`}>
                  {v.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <div ref={mountRef} className="w-full bg-navy-2" style={{ minHeight: 300 }} />
      </div>
      {views.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {views.map((v, i) => (
            <div key={i} onClick={() => setActiveView(i)}
              className={`rounded-lg overflow-hidden border cursor-pointer transition-all ${activeView === i ? 'border-accent' : 'border-white/5 hover:border-white/20'}`}>
              <img src={v.dataUrl} alt={v.name} className="w-full" />
              <p className="text-xs font-mono text-white/30 text-center py-1 bg-navy-3">{v.name}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function parseBinarySTL(THREE, buffer) {
  const view = new DataView(buffer)
  const numTriangles = view.getUint32(80, true)
  const positions = new Float32Array(numTriangles * 9)
  const normals = new Float32Array(numTriangles * 9)
  let offset = 84
  for (let i = 0; i < numTriangles; i++) {
    const nx = view.getFloat32(offset, true), ny = view.getFloat32(offset+4, true), nz = view.getFloat32(offset+8, true)
    offset += 12
    for (let j = 0; j < 3; j++) {
      const base = i * 9 + j * 3
      positions[base] = view.getFloat32(offset, true)
      positions[base+1] = view.getFloat32(offset+4, true)
      positions[base+2] = view.getFloat32(offset+8, true)
      normals[base] = nx; normals[base+1] = ny; normals[base+2] = nz
      offset += 12
    }
    offset += 2
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  return geo
}

function parseASCIISTL(THREE, text) {
  const positions = []
  for (const line of text.split('\n')) {
    const t = line.trim()
    if (t.startsWith('vertex')) {
      const p = t.split(/\s+/)
      positions.push(parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3]))
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3))
  return geo
}

function getFileType(f) {
  const name = f.name.toLowerCase()
  if (f.type.startsWith('image/') || name.match(/\.(png|jpg|jpeg|webp|gif|bmp|tiff)$/)) return 'image'
  if (f.type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  if (name.endsWith('.stl')) return 'stl'
  if (name.match(/\.(dwg|dxf)$/)) return 'cad'
  if (name.match(/\.(stp|step|iges|igs)$/)) return 'step'
  return 'unknown'
}

function FileTypeIcon({ type }) {
  const labels = { image: 'IMG', pdf: 'PDF', stl: 'STL', cad: 'CAD', step: 'STEP', unknown: 'FILE' }
  return (
    <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center flex-shrink-0">
      <span className="text-accent text-xs font-mono">{labels[type]}</span>
    </div>
  )
}

function UploadZone({ onFiles, dragging, setDragging }) {
  const inputRef = useRef()
  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    const fs = Array.from(e.dataTransfer.files)
    if (fs.length) onFiles(fs)
  }, [onFiles, setDragging])
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current.click()}
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${dragging ? 'border-accent bg-accent/5' : 'border-white/10 hover:border-white/20 hover:bg-white/[0.02]'}`}
    >
      <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-5">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1a7aff" strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
        </svg>
      </div>
      <p className="font-mono font-medium text-white mb-2">Drop any engineering file here</p>
      <p className="text-sm text-white/30 max-w-md mx-auto mb-4">Multiple files, multiple sheets — all supported</p>
      <div className="flex justify-center gap-2 flex-wrap">
        {['PNG / JPG', 'PDF', 'STL', 'DWG / DXF', 'STEP / IGES', 'Multi-sheet'].map(t => (
          <span key={t} className="text-xs font-mono bg-white/5 border border-white/10 rounded px-2 py-0.5 text-white/30">{t}</span>
        ))}
      </div>
      <input ref={inputRef} type="file" accept="*" multiple className="hidden"
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
      canvas.width = img.width; canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      annotations.forEach(ann => {
        if (ann.x == null || ann.y == null) return
        const x = (ann.x / 100) * img.width, y = (ann.y / 100) * img.height
        const r = Math.max(16, img.width / 50)
        ctx.beginPath(); ctx.arc(x, y, r, 0, 2 * Math.PI)
        ctx.fillStyle = ann.type === 'critical' ? 'rgba(239,68,68,0.9)' : 'rgba(26,122,255,0.9)'
        ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke()
        ctx.fillStyle = '#fff'
        ctx.font = `bold ${Math.max(13, img.width / 45)}px monospace`
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
        ctx.fillText(String(ann.index), x, y)
      })
      setReady(true)
    }
    img.src = imageUrl
  }, [imageUrl, annotations])
  const download = () => { const a = document.createElement('a'); a.download = 'stackr-annotated.png'; a.href = canvasRef.current.toDataURL(); a.click() }
  return (
    <div className="bg-navy-2 border border-white/5 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
        <p className="text-xs font-mono text-white/30 tracking-widest">ANNOTATED DRAWING</p>
        {ready && <button onClick={download} className="text-xs font-mono bg-accent hover:bg-accent/90 text-white px-3 py-1.5 rounded-lg">↓ Download annotated</button>}
      </div>
      <div className="p-4 bg-black/20">
        <canvas ref={canvasRef} className="w-full rounded-lg" style={{ maxHeight: 500 }} />
      </div>
    </div>
  )
}

function ResultSection({ analysis, imageUrl }) {
  if (!analysis) return null
  const { method, methodRationale, dimensions = [], gdtControls = [], stackupChain = [], result = {}, assemblySummary, annotations = [] } = analysis
  const isGood = result.gapMin !== undefined && result.gapMin >= 0
  const mc = { RSS: 'accent', 'WORST CASE': 'amber', VECTOR: 'purple', WORST_CASE: 'amber' }
  return (
    <div className="space-y-4 fade-up">
      {assemblySummary && (
        <div className="bg-navy-2 border-l-2 border-accent border border-white/5 rounded-lg p-4">
          <p className="text-sm text-white/60 leading-relaxed"><span className="text-accent font-mono font-medium">Assembly: </span>{assemblySummary}</p>
          {analysis.standard && <span className="mt-2 inline-block text-xs font-mono bg-accent/10 text-accent border border-accent/20 rounded px-2 py-0.5">{analysis.standard} · {analysis.units}</span>}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-navy-2 border border-white/5 rounded-xl p-5">
          <p className="text-xs font-mono text-white/30 tracking-widest mb-3">METHOD SELECTED</p>
          <div className="flex items-start gap-3">
            <Badge color={mc[method?.toUpperCase()] || 'accent'}>{method}</Badge>
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
                  {['#','Feature','Nominal','+Tol','−Tol','Condition','GD&T','Suggested change'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-mono text-white/25 font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dimensions.map((d, i) => (
                  <tr key={i} className={`border-b border-white/[0.03] ${i%2===1?'bg-white/[0.015]':''}`}>
                    <td className="px-4 py-3 text-white/20 font-mono text-xs">{i+1}</td>
                    <td className="px-4 py-3 text-white/70 font-mono">{d.feature}</td>
                    <td className="px-4 py-3 text-accent font-mono font-medium">{d.nominal}</td>
                    <td className="px-4 py-3 text-emerald-400 font-mono">+{d.upperTol}</td>
                    <td className="px-4 py-3 text-red-400 font-mono">−{d.lowerTol}</td>
                    <td className="px-4 py-3">{d.condition && <Badge color={d.condition==='MMC'?'accent':d.condition==='LMC'?'green':'purple'}>{d.condition}</Badge>}</td>
                    <td className="px-4 py-3 text-white/30 font-mono text-xs">{d.gdtControl||'—'}</td>
                    <td className="px-4 py-3">{d.suggestedChange && <span className="text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded px-2 py-0.5 whitespace-nowrap">→ {d.suggestedChange}</span>}</td>
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
                <p className="text-lg font-mono font-semibold text-accent">{g.value} <span className="text-sm font-normal">{analysis.units||'mm'}</span></p>
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
                {i < stackupChain.length-1 && <span className="text-white/20 font-mono">→</span>}
              </span>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[['WC Tolerance',result.totalWCTolerance!=null?`±${result.totalWCTolerance}`:'—'],['RSS Tolerance',result.totalRSSTolerance!=null?`±${result.totalRSSTolerance}`:'—'],['Sigma',result.sigma?`${result.sigma}σ`:'—'],['Contributors',dimensions.length||'—']].map(([l,v])=>(
          <div key={l} className="bg-navy-3 rounded-lg p-4">
            <p className="text-xs font-mono text-white/25 mb-2">{l}</p>
            <p className="text-lg font-mono font-semibold text-white/80">{v}</p>
          </div>
        ))}
      </div>
      {result.recommendations?.length > 0 && (
        <div className="bg-navy-2 border border-white/5 rounded-xl p-5">
          <p className="text-xs font-mono text-white/30 tracking-widest mb-4">ENGINEERING RECOMMENDATIONS</p>
          <ul className="space-y-2">
            {result.recommendations.map((r,i)=>(
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
              {annotations.map((ann,i)=>(
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-mono font-bold ${ann.type==='critical'?'bg-red-500':'bg-accent'}`}>{ann.index}</div>
                  <div className="flex-1"><p className="text-sm font-mono text-white/70">{ann.feature}</p><p className="text-xs text-white/40">{ann.description}</p></div>
                  <Badge color={ann.type==='critical'?'red':'accent'}>{ann.type}</Badge>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      <p className="text-xs text-white/20 leading-relaxed pt-2 border-t border-white/5 font-mono">
        AI-generated analysis. Verify against original drawings per {analysis.standard==='ISO'?'ISO 2768':'ASME Y14.5'}.
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
  const [stlViews, setStlViews] = useState([])

  const handleFiles = (newFiles) => {
    setFiles(prev => [...prev, ...newFiles])
    newFiles.forEach(f => {
      const type = getFileType(f)
      if (type === 'image') {
        setPreviews(prev => [...prev, { url: URL.createObjectURL(f), name: f.name, type }])
      } else {
        setPreviews(prev => [...prev, { url: null, name: f.name, type }])
      }
    })
    setAnalysis(null); setError(null)
  }

  const handleAnalyze = async () => {
    if (!files.length) return
    setLoading(true); setError(null); setAnalysis(null)
    try {
      const imageFile = files.find(f => getFileType(f) === 'image')
      const pdfFile = files.find(f => getFileType(f) === 'pdf')
      const stlFile = files.find(f => getFileType(f) === 'stl')
      let fileB64, fileMime, annotationImageUrl
      if (stlFile && stlViews.length > 0) {
        const isoView = stlViews[0]
        fileB64 = isoView.dataUrl.split(',')[1]; fileMime = 'image/png'
        annotationImageUrl = isoView.dataUrl
      } else if (imageFile) {
        const reader = new FileReader()
        const result = await new Promise((res) => { reader.onload = e => res(e.target.result); reader.readAsDataURL(imageFile) })
        fileB64 = result.split(',')[1]; fileMime = imageFile.type || 'image/jpeg'
        annotationImageUrl = URL.createObjectURL(imageFile)
      } else if (pdfFile) {
        const reader = new FileReader()
        const result = await new Promise((res) => { reader.onload = e => res(e.target.result); reader.readAsDataURL(pdfFile) })
        fileB64 = result.split(',')[1]; fileMime = 'application/pdf'
      } else {
        throw new Error('Please upload an image, PDF, or STL file to analyze.')
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageB64: fileB64, imageMime: fileMime, settings, fileCount: files.length }),
      })

      let data
      try {
        data = await res.json()
      } catch {
        const text = await res.text().catch(() => 'Unknown server error')
        throw new Error('Server error: ' + text.slice(0, 300))
      }

      if (!res.ok) throw new Error(data.error || 'Analysis failed')
      if (annotationImageUrl) data._annotationImageUrl = annotationImageUrl
      setAnalysis(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const reset = () => { setFiles([]); setPreviews([]); setAnalysis(null); setError(null); setActivePreview(0); setStlViews([]) }
  const stlFile = files.find(f => getFileType(f) === 'stl')
  const firstImagePreview = previews.find(p => p.type === 'image')
  const annotationUrl = analysis?._annotationImageUrl || firstImagePreview?.url

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
          <p className="text-sm text-white/30 font-mono">GD&T · MMC/LMC · RSS · Worst Case · Vector · Image · PDF · STL · DWG · STEP</p>
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
                    className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-md border transition-all ${activePreview === i ? 'border-accent text-accent bg-accent/10' : 'border-white/10 text-white/30 hover:border-white/20'}`}>
                    <FileTypeIcon type={p.type} />
                    {p.name.length > 18 ? p.name.slice(0, 18) + '…' : p.name}
                  </button>
                ))}
              </div>
            )}
            {stlFile ? (
              <STLViewer file={stlFile} onViewsReady={setStlViews} />
            ) : previews[activePreview]?.url ? (
              <div className="relative rounded-xl overflow-hidden border border-white/10 bg-navy-2">
                <img src={previews[activePreview].url} alt="Drawing" className="w-full max-h-80 object-contain block" />
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-navy-2 p-10 text-center">
                <p className="text-5xl mb-3">{previews[activePreview]?.type === 'pdf' ? '📄' : previews[activePreview]?.type === 'cad' ? '📐' : '⚙️'}</p>
                <p className="font-mono text-white/50 mb-1">{previews[activePreview]?.name}</p>
                <p className="text-xs text-white/30">{previews[activePreview]?.type?.toUpperCase()} — ready for analysis</p>
              </div>
            )}
            {stlFile && stlViews.length > 0 && (
              <div className="text-xs font-mono text-green bg-green/10 border border-green/20 rounded-lg px-4 py-2">
                ✓ STL rendered — {stlViews.length} views captured, ready for analysis
              </div>
            )}
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleAnalyze} disabled={loading}
                className="flex items-center gap-2 bg-accent hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono font-medium px-6 py-2.5 rounded-lg transition-colors text-sm">
                {loading ? <><span className="spinner" /> Analyzing...</> : 'Run analysis →'}
              </button>
              <button onClick={() => { const i = document.createElement('input'); i.type='file'; i.multiple=true; i.accept='*'; i.onchange=e=>handleFiles(Array.from(e.target.files)); i.click() }}
                className="text-white/30 hover:text-white/60 font-mono text-sm px-4 py-2.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">
                + Add files
              </button>
              <button onClick={reset} className="text-white/30 hover:text-white/60 font-mono text-sm px-4 py-2.5 rounded-lg border border-white/5 hover:border-white/10 transition-colors">Clear all</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-navy-2 border border-white/5 rounded-lg px-3 py-1.5 text-xs font-mono text-white/40">
                  <div className="w-1.5 h-1.5 rounded-full bg-green" />
                  {f.name} <span className="text-white/20">{(f.size/1024).toFixed(0)}KB</span>
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
        {analysis && <ResultSection analysis={analysis} imageUrl={annotationUrl} />}
        {files.length === 0 && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              ['Supported file types', 'PNG, JPG, PDF, STL, DWG, DXF, STEP, IGES — any engineering file format.'],
              ['STL & 3D files', 'STL files are rendered live in 3D. Isometric, front, top, and side views are captured for analysis.'],
              ['Multi-file analysis', 'Upload multiple sheets or files at once. AI analyzes all context together.'],
            ].map(([title, desc]) => (
              <div key={title} className="bg-navy-2/50 border border-white/5 rounded-xl p-5">
                <p className="text-xs font-mono text-white/30 tracking-widest mb-2">{title.toUpperCase()}</p>
                <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
