'use client'

import { useState, useEffect, useCallback } from 'react'
import { HORMOZI_HOOKS, DEGEE_HOOKS, NOTION_PATTERNS } from '@/lib/knowledge'

// ─── Types ────────────────────────────────────────────────────────────────

interface KnowledgeItem { id: string; type: string; content: string; category: string; score: number }
interface ScriptRecord { id: string; category: string; performance: string; analysis: Record<string, unknown>; created_at: string }
interface KnowledgeCounts { patterns: number; hooks: number; ctas: number; scripts: number }
interface KnowledgeData {
  patterns: KnowledgeItem[]; hooks: KnowledgeItem[]; ctas: KnowledgeItem[]
  triggers: KnowledgeItem[]; scripts: ScriptRecord[]; counts: KnowledgeCounts
}
interface Analysis {
  hook?: string; hook_type?: string; structure?: string; emotional_trigger?: string
  cta_type?: string; why_works?: string; key_lesson?: string
  patterns?: string[]; hooks_extracted?: string[]; ctas_extracted?: string[]
}

const TONE_OPTS = [
  { v: 'emotional', l: 'Сэтгэл хөдлөлтэй' },
  { v: 'story', l: 'Хувийн түүх' },
  { v: 'shock', l: 'Шок / гайхмаар' },
  { v: 'urgency', l: 'Яаралтай' },
  { v: 'trust', l: 'Итгэл үнэмшил' },
  { v: 'funny', l: 'Хошин / casual' },
  { v: 'compare', l: 'Өмнө/Дараа' },
  { v: 'pain', l: 'Өвдөлтийн цэг' },
]

const PERF_MAP: Record<string, { cls: string; l: string; color: string; bg: string }> = {
  high: { cls: 'text-emerald-400 bg-emerald-400/10', l: 'Сайн', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
  medium: { cls: 'text-amber-400 bg-amber-400/10', l: 'Дундаж', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
  low: { cls: 'text-red-400 bg-red-400/10', l: 'Муу', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' },
  unknown: { cls: 'text-zinc-400 bg-zinc-400/10', l: '?', color: '#9ca3af', bg: 'rgba(156, 163, 175, 0.1)' },
}

const ICONS: Record<string, React.ReactNode> = {
  train: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  generate: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1-1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg>,
  knowledge: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
  hooks: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
  reel: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"/></svg>,
  history: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
};

// ─── Components ──────────────────────────────────────────────────────────

function Sidebar({ active, setActive, counts }: {
  active: string; setActive: (s: string) => void; counts: KnowledgeCounts | null
}) {
  const nav = (id: string, label: string) => (
    <button
      key={id}
      onClick={() => setActive(id)}
      className={`nav-item ${active === id ? 'active' : ''}`}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', borderRadius: '6px',
        color: active === id ? '#F1F0EF' : '#6B7280',
        backgroundColor: active === id ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
        borderLeft: active === id ? '2px solid #7C3AED' : '2px solid transparent',
        transition: 'all 0.2s ease', cursor: 'pointer', fontSize: '14px', fontWeight: 500, width: '100%', textAlign: 'left'
      }}
    >
      <div style={{ color: active === id ? '#7C3AED' : '#6B7280', display: 'flex' }}>
        {ICONS[id]}
      </div>
      {label}
    </button>
  )
  return (
    <aside className="sidebar" style={{
      position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column',
      borderRight: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-sidebar)'
    }}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', letterSpacing: '2px', color: '#7C3AED', textTransform: 'uppercase' }}>Mongol Script AI</div>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>SaaS Edition</div>
      </div>
      <div style={{ padding: '16px 12px' }}>
        <div style={{ padding: '8px 16px', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600 }}>Ажил</div>
        {nav('train', 'Script сургах')}
        {nav('generate', 'Script үүсгэх')}
        <div style={{ padding: '8px 16px', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '16px', fontWeight: 600 }}>Мэдлэг</div>
        {nav('knowledge', 'Мэдлэгийн сан')}
        {nav('hooks', 'Hook санал')}
        {nav('reel', 'Reel оруулах')}
        {nav('history', 'Script түүх')}
      </div>
      <div style={{ marginTop: 'auto', padding: '24px 20px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontWeight: 600 }}>Мэдлэгийн сан</div>
        {[
          { l: 'Script сурсан', v: counts?.scripts || 0, c: '#10b981' },
          { l: 'Pattern', v: counts?.patterns || 0, c: '#10b981' },
          { l: 'Hook хэлбэр', v: counts?.hooks || 0, c: '#10b981' },
          { l: 'Hormozi hook', v: 30, c: '#f59e0b' },
          { l: 'Дэгээ hook', v: 25, c: '#6366f1' },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{l}</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: c }}>{v}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 500 }}>{label}</label>
      {children}
    </div>
  )
}

function Toast({ msg }: { msg: string }) {
  return msg ? (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', backgroundColor: 'var(--bg-card)',
      border: '1px solid rgba(124, 58, 237, 0.3)', borderRadius: '8px', padding: '12px 20px',
      fontSize: '14px', color: 'var(--text-primary)', zIndex: 50, boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
    }}>
      {msg}
    </div>
  ) : null
}

// ─── Main page ─────────────────────────────────────────────────────────────

export default function Home() {
  const [active, setActive] = useState('train')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const [toast, setToast] = useState('')
  const [kbData, setKbData] = useState<KnowledgeData | null>(null)

  // Train state
  const [tScript, setTScript] = useState('')
  const [tCat, setTCat] = useState('')
  const [tPerf, setTPerf] = useState('high')
  const [tNote, setTNote] = useState('')
  const [tLoading, setTLoading] = useState(false)
  const [tAnalysis, setTAnalysis] = useState<Analysis | null>(null)

  // Generate state
  const [gProd, setGProd] = useState('')
  const [gAud, setGAud] = useState('')
  const [gBen, setGBen] = useState('')
  const [gTone, setGTone] = useState('emotional')
  const [gLen, setGLen] = useState('30')
  const [gVar, setGVar] = useState('3')
  const [gStr, setGStr] = useState('std')
  const [gLoading, setGLoading] = useState(false)
  const [gResult, setGResult] = useState('')

  // Hooks filter
  const [hookSearch, setHookSearch] = useState('')
  const [hookCat, setHookCat] = useState('all')

  // Reel State
  const [reelFile, setReelFile] = useState<File | null>(null)
  const [reelCat, setReelCat] = useState('')
  const [reelLoading, setReelLoading] = useState(false)
  const [reelTranscript, setReelTranscript] = useState('')
  const [reelTrained, setReelTrained] = useState(false)

  async function handleReelUpload() {
    if (!reelFile) return
    setReelLoading(true)
    setReelTranscript('')
    setReelTrained(false)
    try {
      const form = new FormData()
      form.append('file', reelFile)
      form.append('category', reelCat)
      const res = await fetch('/api/transcribe', { method: 'POST', body: form })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setReelTranscript(data.transcript)
      showToast('Transcript бэлэн боллоо, сургаж байна...')

      const tRes = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: data.transcript, category: data.category || 'ерөнхий', performance: 'unknown', note: 'Reel-ээс хөрвүүлсэн' })
      })
      const tData = await tRes.json()
      if (tData.error) throw new Error(tData.error)
      
      setReelTrained(true)
      showToast('Амжилттай сурлаа ✓')
      fetchKB()
    } catch (e) {
      showToast('Алдаа: ' + (e as Error).message)
    }
    setReelLoading(false)
  }

  const inputStyle = {
    backgroundColor: 'var(--bg-input)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    padding: '12px 14px',
    fontSize: '14px',
    width: '100%',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box' as const
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const fetchKB = useCallback(async () => {
    try {
      const r = await fetch('/api/knowledge')
      const d = await r.json()
      if (!d.error) setKbData(d)
    } catch {}
  }, [])

  useEffect(() => { fetchKB() }, [fetchKB])
  useEffect(() => {
    if (active === 'knowledge' || active === 'history') fetchKB()
  }, [active, fetchKB])

  // ── Train ──
  async function trainScript() {
    if (!tScript.trim()) return
    setTLoading(true); setTAnalysis(null)
    try {
      const r = await fetch('/api/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: tScript, category: tCat, performance: tPerf, note: tNote }),
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setTAnalysis(d.analysis)
      setTScript(''); setTNote('')
      showToast('Script сурлаа ✓')
      fetchKB()
    } catch (e) {
      showToast('Алдаа: ' + (e as Error).message)
    }
    setTLoading(false)
  }

  // ── Generate ──
  async function generateScript() {
    if (!gProd.trim()) return
    setGLoading(true); setGResult('')
    try {
      const r = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: gProd, audience: gAud, benefit: gBen, tone: gTone, length: gLen, variants: parseInt(gVar), structure: gStr }),
      })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setGResult(d.script)
    } catch (e) {
      showToast('Алдаа: ' + (e as Error).message)
    }
    setGLoading(false)
  }

  // ── Hook list ──
  const allHooks = [
    ...HORMOZI_HOOKS.map(h => ({ ...h, src: 'Hormozi' })),
    ...DEGEE_HOOKS.map(h => ({ ...h, src: 'Дэгээ' })),
    ...NOTION_PATTERNS.map(p => ({ cat: p.cat, text: p.text, src: 'Notion' })),
  ]
  const hookCats = ['all', ...Array.from(new Set(allHooks.map(h => h.cat)))]
  const filteredHooks = allHooks.filter(h => {
    const matchCat = hookCat === 'all' || h.cat === hookCat
    const matchQ = !hookSearch || h.text.toLowerCase().includes(hookSearch.toLowerCase())
    return matchCat && matchQ
  }).slice(0, 60)

  const srcColor: Record<string, string> = { Hormozi: '#f59e0b', Дэгээ: '#6366f1', Notion: '#7C3AED' }

  // ── Render ──
  return (
    <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: isMobile ? '1fr' : '220px 1fr', minHeight: '100vh', backgroundColor: 'var(--bg-dark)', color: 'var(--text-primary)', paddingBottom: isMobile ? '80px' : '0' }}>
      <div className="sidebar" style={{ display: isMobile ? 'none' : 'block' }}>
        <Sidebar active={active} setActive={setActive} counts={kbData?.counts || null} />
      </div>
      <main className="main-content" style={{ overflowY: 'auto', padding: isMobile ? '16px' : '40px', width: '100%' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>

          {/* ── TRAIN ── */}
          {active === 'train' && (
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.02em' }}>Script сургах</h1>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '32px' }}>Ажилласан script оруулна. AI задлаад pattern сурна.</p>
              
              <Field label="Ажилласан script оруул">
                <textarea rows={7} style={inputStyle} value={tScript} onChange={e => setTScript(e.target.value)}
                  placeholder="жнь: Өвдөгний өвдөлтөөсөө одоо ямар ч асуудалгүй салах боломжтой болсон гээд боддоо..." />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <Field label="Ангилал"><input style={inputStyle} value={tCat} onChange={e => setTCat(e.target.value)} placeholder="жнь: гоо сайхан" /></Field>
                <Field label="Үр дүн">
                  <select style={inputStyle} value={tPerf} onChange={e => setTPerf(e.target.value)}>
                    <option value="high">Маш сайн ажилласан</option>
                    <option value="medium">Дундаж</option>
                    <option value="low">Муу ажилласан</option>
                    <option value="unknown">Мэдэхгүй</option>
                  </select>
                </Field>
              </div>
              <Field label="Яагаад ажилласан гэж боддог вэ? (заавал биш)">
                <input style={inputStyle} value={tNote} onChange={e => setTNote(e.target.value)} placeholder="жнь: хувийн туршлага байсан, urgency нэмсэн" />
              </Field>
              <button onClick={trainScript} disabled={tLoading || !tScript.trim()}
                className="btn-primary"
                style={{ marginTop: '24px' }}>
                {tLoading ? 'Уншиж байна...' : 'Analyze хийж хадгалах →'}
              </button>
              
              {tAnalysis && (
                <div className="minimal-card" style={{ marginTop: '40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>Шинжилгээ — Хадгалагдлаа ✓</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {[
                      { k: `Hook (${tAnalysis.hook_type || '?'})`, v: tAnalysis.hook },
                      { k: 'Сэтгэл зүйн арга', v: tAnalysis.emotional_trigger },
                      { k: 'CTA', v: tAnalysis.cta_type },
                      { k: 'Бүтэц', v: tAnalysis.structure },
                      { k: 'Яагаад ажиллаж байна', v: tAnalysis.why_works, full: true },
                      { k: 'Гол сургамж', v: tAnalysis.key_lesson, full: true, accent: true },
                    ].map(({ k, v, full, accent }) => v ? (
                      <div key={k} style={{ backgroundColor: 'var(--bg-input)', borderRadius: '8px', padding: '16px', gridColumn: full ? 'span 2' : 'span 1' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 500 }}>{k}</div>
                        <div style={{ fontSize: '14px', lineHeight: '1.6', color: accent ? 'var(--accent-purple)' : 'var(--text-primary)' }}>{v}</div>
                      </div>
                    ) : null)}
                    {tAnalysis.patterns?.length ? (
                      <div style={{ backgroundColor: 'var(--bg-input)', borderRadius: '8px', padding: '16px', gridColumn: 'span 2' }}>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', fontWeight: 500 }}>Сурсан pattern-ууд</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {tAnalysis.patterns.map(p => <span key={p} className="badge-purple">{p}</span>)}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── GENERATE ── */}
          {active === 'generate' && (
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.02em' }}>Script үүсгэх</h1>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '32px' }}>Мэдлэгийн сан + Hormozi + Дэгээ ашиглана.</p>
              
              {kbData?.counts && kbData.counts.scripts > 0 && (
                <div className="minimal-card" style={{ marginBottom: '24px', padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>Мэдлэгийн сан</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{kbData.counts.scripts} script сурсан</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--border-subtle)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: Math.min(100, kbData.counts.scripts / 20 * 100) + '%', background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-purple-hover))' }} />
                  </div>
                </div>
              )}
              
              <div className="minimal-card" style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', fontWeight: 600 }}>Бүтээгдэхүүн</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <Field label="Бүтээгдэхүүн / үйлчилгээ"><input style={inputStyle} value={gProd} onChange={e => setGProd(e.target.value)} placeholder="жнь: LED гэрэл" /></Field>
                  <Field label="Target audience"><input style={inputStyle} value={gAud} onChange={e => setGAud(e.target.value)} placeholder="жнь: 25-40 нас" /></Field>
                </div>
                <Field label="Давуу тал"><input style={inputStyle} value={gBen} onChange={e => setGBen(e.target.value)} placeholder="жнь: 7 хоногт үр дүн" /></Field>
              </div>
              
              <div className="minimal-card" style={{ marginBottom: '24px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px', fontWeight: 600 }}>Tone</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {TONE_OPTS.map(({ v, l }) => (
                    <button key={v} onClick={() => setGTone(v)} className={`tag ${gTone === v ? 'active' : ''}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                <Field label="Урт">
                  <select style={inputStyle} value={gLen} onChange={e => setGLen(e.target.value)}>
                    <option value="15">15сек (~35 үг)</option>
                    <option value="30">30сек (~70 үг)</option>
                    <option value="60">60сек (~130 үг)</option>
                  </select>
                </Field>
                <Field label="Хувилбар тоо">
                  <select style={inputStyle} value={gVar} onChange={e => setGVar(e.target.value)}>
                    <option value="1">1</option>
                    <option value="3">3</option>
                    <option value="5">5</option>
                  </select>
                </Field>
                <Field label="Бүтэц">
                  <select style={inputStyle} value={gStr} onChange={e => setGStr(e.target.value)}>
                    <option value="std">HOOK→АСУУДАЛ→CTA</option>
                    <option value="story">Түүх→Эргэлт→CTA</option>
                    <option value="before">Өмнө→Одоо→CTA</option>
                    <option value="notion">Notion бүрэн бүтэц</option>
                  </select>
                </Field>
              </div>
              
              <button onClick={generateScript} disabled={gLoading || !gProd.trim()} className="btn-primary">
                {gLoading ? 'Үүсгэж байна...' : 'Script үүсгэх →'}
              </button>
              
              {gResult && (
                <div className="minimal-card" style={{ marginTop: '40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>Үүсгэсэн script</span>
                    <button onClick={() => { navigator.clipboard.writeText(gResult); showToast('Хуулагдлаа ✓') }} className="btn-ghost" style={{ fontSize: '12px' }}>
                      Хуулах
                    </button>
                  </div>
                  <pre style={{ fontSize: '15px', lineHeight: '1.7', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{gResult}</pre>
                </div>
              )}
            </div>
          )}

          {/* ── KNOWLEDGE ── */}
          {active === 'knowledge' && (
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.02em' }}>Мэдлэгийн сан</h1>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '32px' }}>AI-ийн сурсан бүх мэдлэг pattern-ууд.</p>
              
              {!kbData || kbData.counts.scripts === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>Одоохондоо сурсан зүйл алга. Script сургах таб дээр эхлэ.</div>
              ) : (
                <>
                  {[
                    { title: 'Pattern-ууд', items: kbData.patterns, color: '#7C3AED' },
                    { title: 'Hook хэлбэрүүд', items: kbData.hooks, color: '#f59e0b' },
                    { title: 'CTA хэлбэрүүд', items: kbData.ctas, color: '#10b981' },
                    { title: 'Сэтгэл зүйн аргууд', items: kbData.triggers, color: '#6366f1' },
                  ].map(({ title, items, color }) => items?.length ? (
                    <div key={title} style={{ marginBottom: '40px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                         <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</span>
                         <span className="badge-purple" style={{ color: color, borderColor: color, backgroundColor: `${color}15` }}>{items.length}</span>
                      </div>
                      {items.map(item => (
                        <div key={item.id} style={{ 
                          fontSize: '14px', color: 'var(--text-primary)', padding: '16px 20px', borderRadius: '10px', 
                          backgroundColor: 'var(--bg-card)', marginBottom: '12px', borderLeft: `3px solid ${color}`,
                          lineHeight: '1.6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                        }}>
                          <span>{item.content}</span>
                          {item.score > 1 && <span style={{ fontSize: '12px', color: color, flexShrink: 0, fontWeight: 600 }}>×{item.score}</span>}
                        </div>
                      ))}
                    </div>
                  ) : null)}
                </>
              )}
            </div>
          )}

          {/* ── HOOKS ── */}
          {active === 'hooks' && (
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.02em' }}>Hook санал</h1>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '32px' }}>Hormozi, Дэгээ, Notion загварууд.</p>
              
              <input style={{...inputStyle, marginBottom: '24px'}} placeholder="Хайх..." value={hookSearch} onChange={e => setHookSearch(e.target.value)} />
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '32px' }}>
                {hookCats.slice(0, 12).map(c => (
                  <button key={c} onClick={() => setHookCat(c)} className={`tag ${hookCat === c ? 'active' : ''}`}>
                    {c === 'all' ? 'Бүгд' : c}
                  </button>
                ))}
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filteredHooks.map((h, i) => (
                  <div key={i} onClick={() => { navigator.clipboard.writeText(h.text); showToast('Хуулагдлаа ✓') }}
                    style={{ 
                      fontSize: '15px', color: 'var(--text-primary)', padding: '20px', borderRadius: '10px', 
                      backgroundColor: 'var(--bg-card)', borderLeft: `3px solid ${srcColor[h.src] || '#7C3AED'}`,
                      lineHeight: '1.6', cursor: 'pointer', transition: 'all 0.2s ease',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-input)')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-card)')}
                  >
                    {h.text}
                    <div style={{ fontSize: '12px', marginTop: '12px', color: srcColor[h.src] || '#7C3AED', fontWeight: 500 }}>
                      {h.src} · {h.cat}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── REEL ── */}
          {active === 'reel' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 600, letterSpacing: '-0.02em', margin: 0 }}>Reel оруулах</h1>
                <span className="badge-purple">ElevenLabs Scribe</span>
              </div>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '32px' }}>Монгол Reel-ийн аудио оруулна → Transcript гарна → Script болгон сургана</p>
              
              <Field label="Аудио / Видео файл">
                <input 
                  type="file" 
                  accept="audio/*,video/*"
                  onChange={e => setReelFile(e.target.files?.[0] || null)}
                  style={{...inputStyle, padding: '10px'}} 
                />
              </Field>
              
              <Field label="Ангилал">
                <input 
                  style={inputStyle} 
                  value={reelCat} 
                  onChange={e => setReelCat(e.target.value)} 
                  placeholder="жнь: подкаст, фитнесс" 
                />
              </Field>
              
              <button onClick={handleReelUpload} disabled={reelLoading || !reelFile} className="btn-primary" style={{ marginTop: '24px' }}>
                {reelLoading ? 'Уншиж байна...' : 'Transcript гаргаж сургах →'}
              </button>

              {(reelTranscript || reelTrained) && (
                <div className="minimal-card" style={{ marginTop: '40px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 500 }}>
                      Хөрвүүлэлт & Сургалт {reelTrained && '✓'}
                    </span>
                  </div>
                  <pre style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, padding: '16px', backgroundColor: 'var(--bg-input)', borderRadius: '8px' }}>
                    {reelTranscript}
                  </pre>
                  {reelTrained && (
                     <div style={{ marginTop: '16px', fontSize: '14px', color: 'var(--accent-purple)' }}>
                       Амжилттай AI model-д суралцлаа! (Script түүх рүү орж шалгана уу)
                     </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── HISTORY ── */}
          {active === 'history' && (
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: 600, marginBottom: '8px', letterSpacing: '-0.02em' }}>Script түүх</h1>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '32px' }}>Боловсруулсан сүүлийн хувилбарууд.</p>
              
              {!kbData?.scripts?.length ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>Одоохондоо түүх алга.</div>
              ) : (
                kbData.scripts.map(s => {
                  const p = PERF_MAP[s.performance] || PERF_MAP.unknown
                  const lesson = s.analysis?.key_lesson as string
                  return (
                    <div key={s.id} className="minimal-card" style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '16px', fontWeight: 600 }}>{s.category}</span>
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '99px', color: p.color, backgroundColor: p.bg }}>{p.l}</span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(s.created_at).toLocaleDateString('mn-MN')}</span>
                      </div>
                      {lesson && <div style={{ fontSize: '14px', color: 'var(--accent-purple)', lineHeight: '1.6' }}>→ {lesson}</div>}
                    </div>
                  )
                })
              )}
            </div>
          )}

        </div>
      </main>

      {isMobile && (
        <div className="mobile-nav" style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: '70px',
          backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-subtle)',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 50
        }}>
          {[
            { id: 'train', label: 'Сургах' },
            { id: 'generate', label: 'Үүсгэх' },
            { id: 'knowledge', label: 'Мэдлэг' },
            { id: 'hooks', label: 'Hook' },
            { id: 'reel', label: 'Reel' },
            { id: 'history', label: 'Түүх' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActive(tab.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px',
              color: active === tab.id ? 'var(--accent-purple)' : 'var(--text-secondary)',
              fontSize: '11px', fontWeight: 500, background: 'none', border: 'none', padding: '8px', flex: 1
            }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {ICONS[tab.id]}
              </span>
              <span style={{ textAlign: 'center' }}>{tab.label}</span>
            </button>
          ))}
        </div>
      )}
      <Toast msg={toast} />
    </div>
  )
}