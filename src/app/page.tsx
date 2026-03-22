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
  high: { cls: 'text-emerald-400 bg-emerald-400/10', l: 'Сайн', color: '#34d399', bg: 'rgba(52, 211, 153, 0.1)' },
  medium: { cls: 'text-amber-400 bg-amber-400/10', l: 'Дундаж', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.1)' },
  low: { cls: 'text-red-400 bg-red-400/10', l: 'Муу', color: '#f87171', bg: 'rgba(248, 113, 113, 0.1)' },
  unknown: { cls: 'text-zinc-400 bg-zinc-400/10', l: '?', color: '#a1a1aa', bg: 'rgba(161, 161, 170, 0.1)' },
}

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
        color: active === id ? '#ffffff' : '#a1a1aa',
        backgroundColor: active === id ? 'rgba(249, 115, 22, 0.1)' : 'transparent',
        borderLeft: active === id ? '2px solid #F97316' : '2px solid transparent',
        transition: 'all 0.2s ease', cursor: 'pointer', fontSize: '14px', fontWeight: 500, width: '100%', textAlign: 'left'
      }}
    >
      <span style={{
        width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
        backgroundColor: active === id ? '#F97316' : '#3f3f46'
      }} />
      {label}
    </button>
  )
  return (
    <aside style={{
      position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: '#0F0F0F'
    }}>
      <div style={{ padding: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px', color: '#F97316', textTransform: 'uppercase' }}>Mongul Script AI</div>
        <div style={{ fontSize: '11px', color: '#a1a1aa', marginTop: '4px' }}>Notion + Hormozi + Дэгээ</div>
      </div>
      <div style={{ padding: '12px 8px' }}>
        <div style={{ padding: '8px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '2px' }}>Ажил</div>
        {nav('train', 'Script сургах')}
        {nav('generate', 'Script үүсгэх')}
        <div style={{ padding: '8px 16px', fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '12px' }}>Мэдлэг</div>
        {nav('knowledge', 'Мэдлэгийн сан')}
        {nav('hooks', 'Hook санал')}
        {nav('history', 'Script түүх')}
      </div>
      <div style={{ marginTop: 'auto', padding: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
        <div style={{ fontSize: '10px', color: '#71717a', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '12px' }}>Мэдлэгийн сан</div>
        {[
          { l: 'Script сурсан', v: counts?.scripts || 0, c: '#34d399' },
          { l: 'Pattern', v: counts?.patterns || 0, c: '#34d399' },
          { l: 'Hook хэлбэр', v: counts?.hooks || 0, c: '#34d399' },
          { l: 'Hormozi hook', v: 30, c: '#fbbf24' },
          { l: 'Дэгээ hook', v: 25, c: '#2dd4bf' },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '11px', color: '#a1a1aa' }}>{l}</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: c }}>{v}</span>
          </div>
        ))}
      </div>
    </aside>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  )
}

function Toast({ msg }: { msg: string }) {
  return msg ? (
    <div style={{
      position: 'fixed', bottom: '20px', right: '20px', backgroundColor: '#141414',
      border: '1px solid rgba(249, 115, 22, 0.3)', borderRadius: '8px', padding: '10px 16px',
      fontSize: '14px', color: '#ffffff', zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
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

  const inputStyle = {
    backgroundColor: '#1A1A1A',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '14px',
    width: '100%',
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

  const srcColor: Record<string, string> = { Hormozi: '#fbbf24', Дэгээ: '#2dd4bf', Notion: '#F97316' }

  // ── Render ──
  return (
    <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: isMobile ? '1fr' : '250px 1fr', minHeight: '100vh', backgroundColor: '#0A0A0A', color: '#ffffff', paddingBottom: isMobile ? '80px' : '0' }}>
      <div className="sidebar" style={{ display: isMobile ? 'none' : 'block' }}>
        <Sidebar active={active} setActive={setActive} counts={kbData?.counts || null} />
      </div>
      <main className="main-content" style={{ overflowY: 'auto', padding: isMobile ? '16px' : '32px', width: '100%' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>

          {/* ── TRAIN ── */}
          {active === 'train' && (
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Script сургах</h1>
              <p style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '32px' }}>Ажилласан script оруулна → AI задлаад pattern сурна → Supabase-д хадгална</p>
              
              <Field label="Ажилласан script оруул">
                <textarea rows={7} style={{background:'#1A1A1A', color:'#ffffff', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', width:'100%', fontFamily:'DM Sans, sans-serif', outline:'none'}} value={tScript} onChange={e => setTScript(e.target.value)}
                  placeholder="жнь: Өвдөгний өвдөлтөөсөө одоо ямар ч асуудалгүй салах боломжтой болсон гээд боддоо..." />
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <Field label="Ангилал"><input style={{background:'#1A1A1A', color:'#ffffff', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', width:'100%', fontFamily:'DM Sans, sans-serif', outline:'none'}} value={tCat} onChange={e => setTCat(e.target.value)} placeholder="жнь: гоо сайхан, фитнесс" /></Field>
                <Field label="Үр дүн">
                  <select style={{background:'#1A1A1A', color:'#ffffff', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', width:'100%', fontFamily:'DM Sans, sans-serif', outline:'none'}} value={tPerf} onChange={e => setTPerf(e.target.value)}>
                    <option value="high" style={{background: '#1A1A1A', color: '#fff'}}>Маш сайн ажилласан</option>
                    <option value="medium" style={{background: '#1A1A1A', color: '#fff'}}>Дундаж</option>
                    <option value="low" style={{background: '#1A1A1A', color: '#fff'}}>Муу ажилласан</option>
                    <option value="unknown" style={{background: '#1A1A1A', color: '#fff'}}>Мэдэхгүй</option>
                  </select>
                </Field>
              </div>
              <Field label="Яагаад ажилласан гэж боддог вэ? (заавал биш)">
                <input style={{background:'#1A1A1A', color:'#ffffff', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', width:'100%', fontFamily:'DM Sans, sans-serif', outline:'none'}} value={tNote} onChange={e => setTNote(e.target.value)} placeholder="жнь: хувийн туршлага байсан, urgency нэмсэн" />
              </Field>
              <button onClick={trainScript} disabled={tLoading || !tScript.trim()}
                className="btn-primary"
                style={{ width: '100%', marginTop: '16px', opacity: tLoading || !tScript.trim() ? 0.5 : 1 }}>
                {tLoading ? 'Уншиж байна...' : 'Analyze хийж Supabase-д хадгалах →'}
              </button>
              
              {tAnalysis && (
                <div className="minimal-card" style={{ marginTop: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '2px' }}>Шинжилгээ — Supabase-д нэмэгдлээ ✓</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {[
                      { k: `Hook (${tAnalysis.hook_type || '?'})`, v: tAnalysis.hook },
                      { k: 'Сэтгэл зүйн арга', v: tAnalysis.emotional_trigger },
                      { k: 'CTA', v: tAnalysis.cta_type },
                      { k: 'Бүтэц', v: tAnalysis.structure },
                      { k: 'Яагаад ажиллаж байна', v: tAnalysis.why_works, full: true },
                      { k: 'Гол сургамж', v: tAnalysis.key_lesson, full: true, accent: true },
                    ].map(({ k, v, full, accent }) => v ? (
                      <div key={k} style={{ backgroundColor: '#1A1A1A', borderRadius: '8px', padding: '16px', gridColumn: full ? 'span 2' : 'span 1' }}>
                        <div style={{ fontSize: '10px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>{k}</div>
                        <div style={{ fontSize: '14px', lineHeight: '1.5', color: accent ? '#F97316' : '#e4e4e7' }}>{v}</div>
                      </div>
                    ) : null)}
                    {tAnalysis.patterns?.length ? (
                      <div style={{ backgroundColor: '#1A1A1A', borderRadius: '8px', padding: '16px', gridColumn: 'span 2' }}>
                        <div style={{ fontSize: '10px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>Сурсан pattern-ууд</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {tAnalysis.patterns.map(p => <span key={p} className="badge-orange">{p}</span>)}
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
              <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Script үүсгэх</h1>
              <p style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '32px' }}>Supabase + Hormozi + Дэгээ мэдлэгээр шинэ script үүсгэнэ</p>
              
              {kbData?.counts && kbData.counts.scripts > 0 && (
                <div className="minimal-card" style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500 }}>Мэдлэгийн сан</span>
                    <span style={{ fontSize: '12px', color: '#a1a1aa' }}>{kbData.counts.scripts} script сурсан</span>
                  </div>
                  <div style={{ height: '4px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: Math.min(100, kbData.counts.scripts / 20 * 100) + '%', background: 'linear-gradient(90deg, #F97316, #ea580c)' }} />
                  </div>
                </div>
              )}
              
              <div className="minimal-card" style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}>Бүтээгдэхүүн</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <Field label="Бүтээгдэхүүн / үйлчилгээ"><input style={{background:'#1A1A1A', color:'#ffffff', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', width:'100%', fontFamily:'DM Sans, sans-serif', outline:'none'}} value={gProd} onChange={e => setGProd(e.target.value)} placeholder="жнь: LED гэрэл маск" /></Field>
                  <Field label="Target audience"><input style={{background:'#1A1A1A', color:'#ffffff', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', width:'100%', fontFamily:'DM Sans, sans-serif', outline:'none'}} value={gAud} onChange={e => setGAud(e.target.value)} placeholder="жнь: 25-40 насны эмэгтэй" /></Field>
                </div>
                <Field label="Давуу тал"><input style={{background:'#1A1A1A', color:'#ffffff', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', width:'100%', fontFamily:'DM Sans, sans-serif', outline:'none'}} value={gBen} onChange={e => setGBen(e.target.value)} placeholder="жнь: 7 хоногт үр дүн, гэртээ ашиглах" /></Field>
              </div>
              
              <div className="minimal-card" style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '16px' }}>Tone</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {TONE_OPTS.map(({ v, l }) => (
                    <button key={v} onClick={() => setGTone(v)} className={`tag ${gTone === v ? 'active' : ''}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <Field label="Урт">
                  <select style={{background:'#1A1A1A', color:'#ffffff', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', width:'100%', fontFamily:'DM Sans, sans-serif', outline:'none'}} value={gLen} onChange={e => setGLen(e.target.value)}>
                    <option value="15" style={{background: '#1A1A1A', color: '#fff'}}>15сек (~35 үг)</option>
                    <option value="30" style={{background: '#1A1A1A', color: '#fff'}}>30сек (~70 үг)</option>
                    <option value="60" style={{background: '#1A1A1A', color: '#fff'}}>60сек (~130 үг)</option>
                  </select>
                </Field>
                <Field label="Хувилбар тоо">
                  <select style={{background:'#1A1A1A', color:'#ffffff', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', width:'100%', fontFamily:'DM Sans, sans-serif', outline:'none'}} value={gVar} onChange={e => setGVar(e.target.value)}>
                    <option value="1" style={{background: '#1A1A1A', color: '#fff'}}>1</option>
                    <option value="3" style={{background: '#1A1A1A', color: '#fff'}}>3</option>
                    <option value="5" style={{background: '#1A1A1A', color: '#fff'}}>5</option>
                  </select>
                </Field>
                <Field label="Бүтэц">
                  <select style={{background:'#1A1A1A', color:'#ffffff', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', width:'100%', fontFamily:'DM Sans, sans-serif', outline:'none'}} value={gStr} onChange={e => setGStr(e.target.value)}>
                    <option value="std" style={{background: '#1A1A1A', color: '#fff'}}>HOOK→АСУУДАЛ→CTA</option>
                    <option value="story" style={{background: '#1A1A1A', color: '#fff'}}>Түүх→Эргэлт→CTA</option>
                    <option value="before" style={{background: '#1A1A1A', color: '#fff'}}>Өмнө→Одоо→CTA</option>
                    <option value="notion" style={{background: '#1A1A1A', color: '#fff'}}>Notion бүрэн бүтэц</option>
                  </select>
                </Field>
              </div>
              
              <button onClick={generateScript} disabled={gLoading || !gProd.trim()} className="btn-primary" style={{ width: '100%', opacity: gLoading || !gProd.trim() ? 0.5 : 1 }}>
                {gLoading ? 'Үүсгэж байна...' : 'Сурсан мэдлэгээр script үүсгэх →'}
              </button>
              
              {gResult && (
                <div className="minimal-card" style={{ marginTop: '32px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '2px' }}>Үүсгэсэн script</span>
                    <button onClick={() => { navigator.clipboard.writeText(gResult); showToast('Хуулагдлаа ✓') }} className="btn-ghost">
                      Хуулах
                    </button>
                  </div>
                  <pre style={{ fontSize: '14px', lineHeight: '1.6', color: '#e4e4e7', whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{gResult}</pre>
                </div>
              )}
            </div>
          )}

          {/* ── KNOWLEDGE ── */}
          {active === 'knowledge' && (
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Мэдлэгийн сан</h1>
              <p style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '32px' }}>Supabase-д хадгалагдсан бүх мэдлэг. Score өндөр байх тусам generate-д илүү нөлөөлнө.</p>
              
              {!kbData || kbData.counts.scripts === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#71717a' }}>Одоохондоо сурсан зүйл алга. Script сургах таб дээр эхлэ.</div>
              ) : (
                <>
                  {[
                    { title: 'Pattern-ууд', items: kbData.patterns, color: '#F97316' },
                    { title: 'Hook хэлбэрүүд', items: kbData.hooks, color: '#fbbf24' },
                    { title: 'CTA хэлбэрүүд', items: kbData.ctas, color: '#34d399' },
                    { title: 'Сэтгэл зүйн аргууд', items: kbData.triggers, color: '#2dd4bf' },
                  ].map(({ title, items, color }) => items?.length ? (
                    <div key={title} style={{ marginBottom: '32px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '2px' }}>{title}</span>
                        <span className="badge-orange" style={{ color: color, borderColor: color, backgroundColor: `${color}15` }}>{items.length}</span>
                      </div>
                      {items.map(item => (
                        <div key={item.id} style={{ 
                          fontSize: '14px', color: '#e4e4e7', padding: '12px 16px', borderRadius: '8px', 
                          backgroundColor: '#141414', marginBottom: '8px', borderLeft: `2px solid ${color}`,
                          lineHeight: '1.6', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px'
                        }}>
                          <span>{item.content}</span>
                          {item.score > 1 && <span style={{ fontSize: '11px', color: color, flexShrink: 0 }}>×{item.score}</span>}
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
              <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Hook санал</h1>
              <p style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '32px' }}>Hormozi · Дэгээ · Notion — generate хийхэд автоматаар ашиглагдана</p>
              
              <input style={{background:'#1A1A1A', color:'#ffffff', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'10px 14px', width:'100%', fontFamily:'DM Sans, sans-serif', outline:'none'}} placeholder="Хайх..." value={hookSearch} onChange={e => setHookSearch(e.target.value)} />
              
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                {hookCats.slice(0, 12).map(c => (
                  <button key={c} onClick={() => setHookCat(c)} className={`tag ${hookCat === c ? 'active' : ''}`}>
                    {c === 'all' ? 'Бүгд' : c}
                  </button>
                ))}
              </div>
              
              {filteredHooks.map((h, i) => (
                <div key={i} onClick={() => { navigator.clipboard.writeText(h.text); showToast('Хуулагдлаа ✓') }}
                  style={{ 
                    fontSize: '14px', color: '#e4e4e7', padding: '16px', borderRadius: '8px', 
                    backgroundColor: '#141414', marginBottom: '8px', borderLeft: `2px solid ${srcColor[h.src] || '#F97316'}`,
                    lineHeight: '1.6', cursor: 'pointer', transition: 'all 0.2s ease',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#1a1a1a')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#141414')}
                >
                  {h.text}
                  <div style={{ fontSize: '11px', marginTop: '8px', color: srcColor[h.src] || '#F97316' }}>
                    {h.src} · {h.cat}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── HISTORY ── */}
          {active === 'history' && (
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px' }}>Script түүх</h1>
              <p style={{ fontSize: '14px', color: '#a1a1aa', marginBottom: '32px' }}>Supabase-д хадгалагдсан бүх script-үүд</p>
              
              {!kbData?.scripts?.length ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: '#71717a' }}>Одоохондоо түүх алга.</div>
              ) : (
                kbData.scripts.map(s => {
                  const p = PERF_MAP[s.performance] || PERF_MAP.unknown
                  const lesson = s.analysis?.key_lesson as string
                  return (
                    <div key={s.id} className="minimal-card" style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <span style={{ fontSize: '15px', fontWeight: 600 }}>{s.category}</span>
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '20px', color: p.color, backgroundColor: p.bg }}>{p.l}</span>
                        </div>
                        <span style={{ fontSize: '12px', color: '#71717a' }}>{new Date(s.created_at).toLocaleDateString('mn-MN')}</span>
                      </div>
                      {lesson && <div style={{ fontSize: '14px', color: '#F97316', lineHeight: '1.6' }}>→ {lesson}</div>}
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
          backgroundColor: '#0F0F0F', borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 50
        }}>
          {[
            { id: 'train', label: 'Script сургах' },
            { id: 'generate', label: 'Script үүсгэх' },
            { id: 'knowledge', label: 'Мэдлэгийн сан' },
            { id: 'hooks', label: 'Hook санал' },
            { id: 'history', label: 'Script түүх' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActive(tab.id)} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
              color: active === tab.id ? '#F97316' : '#a1a1aa',
              fontSize: '10px', background: 'none', border: 'none', padding: '8px', flex: 1
            }}>
              <span style={{ fontSize: '18px' }}>{
                tab.id === 'train' ? '📝' :
                tab.id === 'generate' ? '✨' :
                tab.id === 'knowledge' ? '🧠' :
                tab.id === 'hooks' ? '🎣' : '📜'
              }</span>
              <span style={{ textAlign: 'center' }}>{tab.label}</span>
            </button>
          ))}
        </div>
      )}
      <Toast msg={toast} />
    </div>
  )
}