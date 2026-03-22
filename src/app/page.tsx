'use client'

import { useState, useEffect, useCallback } from 'react'
import { HORMOZI_HOOKS, DEGEE_HOOKS, NOTION_PATTERNS } from '@/lib/knowledge'

interface KnowledgeItem { id: string; type: string; content: string; category: string; score: number }
interface ScriptRecord { id: string; category: string; performance: string; analysis: Record<string, unknown>; created_at: string }
interface KnowledgeCounts { patterns: number; hooks: number; ctas: number; scripts: number }
interface KnowledgeData {
  patterns: KnowledgeItem[]; hooks: KnowledgeItem[]; ctas: KnowledgeItem[]
  triggers: KnowledgeItem[]; scripts: ScriptRecord[]; counts: KnowledgeCounts
}
interface Analysis {
  hook?: string; hook_type?: string; structure?: string; emotional_trigger?: string
  cta_type?: string; why_works?: string; key_lesson?: string; patterns?: string[]
}

const TONE_OPTS = [
  { v: 'emotional', l: 'Сэтгэл хөдлөлтэй' },
  { v: 'story', l: 'Хувийн түүх' },
  { v: 'shock', l: 'Шок / гайхмаар' },
  { v: 'urgency', l: 'Яаралтай' },
  { v: 'trust', l: 'Итгэл үнэмшил' },
  { v: 'funny', l: 'Хошин / casual' },
  { v: 'compare', l: 'Өмнө / Дараа' },
  { v: 'pain', l: 'Өвдөлтийн цэг' },
]

const PERF = {
  high: { cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', l: 'Сайн' },
  medium: { cls: 'bg-amber-500/10 text-amber-400 border border-amber-500/20', l: 'Дундаж' },
  low: { cls: 'bg-red-500/10 text-red-400 border border-red-500/20', l: 'Муу' },
  unknown: { cls: 'bg-slate-500/10 text-slate-400 border border-slate-500/20', l: '?' },
}

function NavDot({ active }: { active: boolean }) {
  return (
    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${active ? 'bg-teal-400' : 'bg-slate-700'}`} />
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-5 pt-4 pb-1.5 text-[10px] font-semibold text-slate-600 uppercase tracking-[0.1em]">{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide">{label}</label>
      {children}
    </div>
  )
}

const inp = 'w-full bg-white/[0.03] border border-white/[0.08] rounded-lg text-sm text-slate-200 px-3.5 py-2.5 outline-none focus:border-teal-500/40 focus:ring-2 focus:ring-teal-500/[0.06] transition-all placeholder:text-slate-600 font-["DM_Sans"]'

export default function Home() {
  const [tab, setTab] = useState('train')
  const [toast, setToast] = useState('')
  const [kbData, setKbData] = useState<KnowledgeData | null>(null)

  const [tScript, setTScript] = useState('')
  const [tCat, setTCat] = useState('')
  const [tPerf, setTPerf] = useState('high')
  const [tNote, setTNote] = useState('')
  const [tLoading, setTLoading] = useState(false)
  const [tAnalysis, setTAnalysis] = useState<Analysis | null>(null)

  const [gProd, setGProd] = useState('')
  const [gAud, setGAud] = useState('')
  const [gBen, setGBen] = useState('')
  const [gTone, setGTone] = useState('emotional')
  const [gLen, setGLen] = useState('30')
  const [gVar, setGVar] = useState('3')
  const [gStr, setGStr] = useState('std')
  const [gLoading, setGLoading] = useState(false)
  const [gResult, setGResult] = useState('')

  const [hookSearch, setHookSearch] = useState('')
  const [hookCat, setHookCat] = useState('all')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const fetchKB = useCallback(async () => {
    try { const r = await fetch('/api/knowledge'); const d = await r.json(); if (!d.error) setKbData(d) } catch {}
  }, [])

  useEffect(() => { fetchKB() }, [fetchKB])
  useEffect(() => { if (tab === 'knowledge' || tab === 'history') fetchKB() }, [tab, fetchKB])

  async function trainScript() {
    if (!tScript.trim()) return
    setTLoading(true); setTAnalysis(null)
    try {
      const r = await fetch('/api/train', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ script: tScript, category: tCat, performance: tPerf, note: tNote }) })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setTAnalysis(d.analysis); setTScript(''); setTNote('')
      showToast('Script сурлаа — Supabase-д хадгаллаа ✓'); fetchKB()
    } catch (e) { showToast('Алдаа: ' + (e as Error).message) }
    setTLoading(false)
  }

  async function generateScript() {
    if (!gProd.trim()) return
    setGLoading(true); setGResult('')
    try {
      const r = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product: gProd, audience: gAud, benefit: gBen, tone: gTone, length: gLen, variants: parseInt(gVar), structure: gStr }) })
      const d = await r.json()
      if (d.error) throw new Error(d.error)
      setGResult(d.script)
    } catch (e) { showToast('Алдаа: ' + (e as Error).message) }
    setGLoading(false)
  }

  const allHooks = [
    ...HORMOZI_HOOKS.map(h => ({ ...h, src: 'Hormozi' })),
    ...DEGEE_HOOKS.map(h => ({ ...h, src: 'Дэгээ' })),
    ...NOTION_PATTERNS.map(p => ({ cat: p.cat, text: p.text, src: 'Notion' })),
  ]
  const hookCats = ['all', ...Array.from(new Set(allHooks.map(h => h.cat)))]
  const filteredHooks = allHooks.filter(h => (hookCat === 'all' || h.cat === hookCat) && (!hookSearch || h.text.toLowerCase().includes(hookSearch.toLowerCase()))).slice(0, 60)
  const srcColor: Record<string, string> = { Hormozi: 'border-l-amber-500/50', Дэгээ: 'border-l-teal-500/50', Notion: 'border-l-violet-500/50' }
  const srcText: Record<string, string> = { Hormozi: 'text-amber-400', Дэгээ: 'text-teal-400', Notion: 'text-violet-400' }

  const navs = [
    { id: 'train', label: 'Script сургах', group: 'АЖИЛ' },
    { id: 'generate', label: 'Script үүсгэх', group: '' },
    { id: 'knowledge', label: 'Мэдлэгийн сан', group: 'МЭДЛЭГ' },
    { id: 'hooks', label: 'Hook санал', group: '' },
    { id: 'history', label: 'Script түүх', group: '' },
  ]

  return (
    <div className="flex min-h-screen relative">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 sticky top-0 h-screen flex flex-col" style={{ background: 'rgba(8,11,15,0.95)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Logo */}
        <div className="px-5 py-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #2dd4bf, #0d9488)' }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M3 8h7M3 12h5" stroke="#042f2e" strokeWidth="1.8" strokeLinecap="round"/></svg>
            </div>
            <span className="text-sm font-semibold text-white tracking-tight">Mongul Script</span>
          </div>
          <div className="text-[10px] text-slate-600 ml-8">Hormozi · Дэгээ · Notion</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navs.map((n, i) => (
            <div key={n.id}>
              {n.group && <SectionLabel>{n.group}</SectionLabel>}
              <button onClick={() => setTab(n.id)} className={`nav-item w-full text-left ${tab === n.id ? 'active' : ''}`}>
                <NavDot active={tab === n.id} />
                {n.label}
              </button>
            </div>
          ))}
        </nav>

        {/* Stats */}
        <div className="p-5" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest mb-3">Мэдлэгийн сан</div>
          {[
            { l: 'Script сурсан', v: kbData?.counts.scripts || 0, c: 'text-teal-400' },
            { l: 'Pattern', v: kbData?.counts.patterns || 0, c: 'text-teal-400' },
            { l: 'Hook', v: kbData?.counts.hooks || 0, c: 'text-teal-400' },
            { l: 'Hormozi hook', v: 30, c: 'text-amber-400' },
            { l: 'Дэгээ hook', v: 25, c: 'text-teal-400' },
          ].map(({ l, v, c }) => (
            <div key={l} className="stat-row">
              <span className="text-xs text-slate-600">{l}</span>
              <span className={`text-xs font-semibold font-mono ${c}`}>{v}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto relative">
        <div className="max-w-2xl mx-auto px-8 py-8">

          {/* ── TRAIN ── */}
          {tab === 'train' && (
            <div>
              <div className="mb-7">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl font-semibold text-white">Script сургах</h1>
                  <span className="badge-teal">AI Training</span>
                </div>
                <p className="text-sm text-slate-500">Ажилласан script оруулна → AI задлаад pattern сурна → Supabase-д хадгална</p>
              </div>

              <div className="glass-card p-5 mb-4">
                <Field label="Ажилласан script">
                  <textarea rows={7} className={inp + ' resize-y leading-relaxed'} value={tScript} onChange={e => setTScript(e.target.value)}
                    placeholder="жнь: Өвдөгний өвдөлтөөсөө одоо ямар ч асуудалгүй салах боломжтой болсон гээд боддоо..." />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Ангилал"><input className={inp} value={tCat} onChange={e => setTCat(e.target.value)} placeholder="жнь: гоо сайхан, фитнесс" /></Field>
                  <Field label="Үр дүн">
                    <select className={inp} value={tPerf} onChange={e => setTPerf(e.target.value)}>
                      <option value="high">Маш сайн ажилласан</option>
                      <option value="medium">Дундаж</option>
                      <option value="low">Муу ажилласан</option>
                      <option value="unknown">Мэдэхгүй</option>
                    </select>
                  </Field>
                </div>
                <Field label="Яагаад ажилласан гэж боддог вэ? (заавал биш)">
                  <input className={inp} value={tNote} onChange={e => setTNote(e.target.value)} placeholder="жнь: urgency нэмсэн, хувийн туршлага байсан" />
                </Field>
              </div>

              <button onClick={trainScript} disabled={tLoading || !tScript.trim()} className="btn-primary">
                {tLoading ? <span className="dots"><span/><span/><span/></span> : 'Analyze хийж Supabase-д хадгалах →'}
              </button>

              {tAnalysis && (
                <div className="glass-card p-5 mt-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
                      <span className="text-xs font-medium text-teal-400 uppercase tracking-wider">Шинжилгээ — Supabase-д нэмэгдлээ</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { k: `Hook · ${tAnalysis.hook_type || '?'}`, v: tAnalysis.hook },
                      { k: 'Сэтгэл зүйн арга', v: tAnalysis.emotional_trigger },
                      { k: 'CTA төрөл', v: tAnalysis.cta_type },
                      { k: 'Бүтэц', v: tAnalysis.structure },
                      { k: 'Яагаад ажиллаж байна', v: tAnalysis.why_works, full: true },
                      { k: 'Гол сургамж', v: tAnalysis.key_lesson, full: true, accent: true },
                    ].filter(x => x.v).map(({ k, v, full, accent }) => (
                      <div key={k} className={`analysis-card ${full ? 'col-span-2' : ''}`}>
                        <div className="text-[10px] text-slate-600 uppercase tracking-wider font-medium mb-1.5">{k}</div>
                        <div className={`text-sm leading-relaxed ${accent ? 'text-teal-400 font-medium' : 'text-slate-300'}`}>{v}</div>
                      </div>
                    ))}
                    {tAnalysis.patterns?.length ? (
                      <div className="col-span-2 analysis-card">
                        <div className="text-[10px] text-slate-600 uppercase tracking-wider font-medium mb-2">Сурсан pattern-ууд</div>
                        <div className="flex flex-wrap gap-1.5">{tAnalysis.patterns.map(p => <span key={p} className="tag">{p}</span>)}</div>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── GENERATE ── */}
          {tab === 'generate' && (
            <div>
              <div className="mb-7">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl font-semibold text-white">Script үүсгэх</h1>
                  <span className="badge-teal">AI Generate</span>
                </div>
                <p className="text-sm text-slate-500">Supabase + Hormozi + Дэгээ мэдлэгээр шинэ script үүсгэнэ</p>
              </div>

              {kbData && kbData.counts.scripts > 0 && (
                <div className="glass-card p-4 mb-5">
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-sm font-medium text-slate-300">Мэдлэгийн сан</span>
                    <span className="text-xs text-slate-500 font-mono">{kbData.counts.scripts} script · {kbData.counts.patterns} pattern</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: Math.min(100, kbData.counts.scripts / 20 * 100) + '%', background: 'linear-gradient(90deg, #2dd4bf, #0d9488)' }} />
                  </div>
                </div>
              )}

              <div className="glass-card p-5 mb-3">
                <div className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mb-4">Бүтээгдэхүүн</div>
                <div className="grid grid-cols-2 gap-3 mb-0">
                  <Field label="Бүтээгдэхүүн / үйлчилгээ"><input className={inp} value={gProd} onChange={e => setGProd(e.target.value)} placeholder="жнь: LED гэрэл маск" /></Field>
                  <Field label="Target audience"><input className={inp} value={gAud} onChange={e => setGAud(e.target.value)} placeholder="жнь: 25-40 насны эмэгтэй" /></Field>
                </div>
                <Field label="Давуу тал"><input className={inp} value={gBen} onChange={e => setGBen(e.target.value)} placeholder="жнь: 7 хоногт үр дүн, гэртээ ашиглах" /></Field>
              </div>

              <div className="glass-card p-5 mb-3">
                <div className="text-[10px] text-slate-600 uppercase tracking-widest font-semibold mb-3">Tone</div>
                <div className="flex flex-wrap gap-2">
                  {TONE_OPTS.map(({ v, l }) => (
                    <button key={v} onClick={() => setGTone(v)} className={`chip ${gTone === v ? 'sel' : ''}`}>{l}</button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                <Field label="Урт">
                  <select className={inp} value={gLen} onChange={e => setGLen(e.target.value)}>
                    <option value="15">15сек (~35 үг)</option>
                    <option value="30">30сек (~70 үг)</option>
                    <option value="60">60сек (~130 үг)</option>
                  </select>
                </Field>
                <Field label="Хувилбар">
                  <select className={inp} value={gVar} onChange={e => setGVar(e.target.value)}>
                    <option value="1">1</option>
                    <option value="3">3</option>
                    <option value="5">5</option>
                  </select>
                </Field>
                <Field label="Бүтэц">
                  <select className={inp} value={gStr} onChange={e => setGStr(e.target.value)}>
                    <option value="std">HOOK→АСУУДАЛ→CTA</option>
                    <option value="story">Түүх→Эргэлт→CTA</option>
                    <option value="before">Өмнө→Одоо→CTA</option>
                    <option value="notion">Notion бүрэн бүтэц</option>
                  </select>
                </Field>
              </div>

              <button onClick={generateScript} disabled={gLoading || !gProd.trim()} className="btn-primary">
                {gLoading ? <span className="dots"><span/><span/><span/></span> : 'Сурсан мэдлэгээр script үүсгэх →'}
              </button>

              {gResult && (
                <div className="glass-card p-5 mt-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                      <span className="text-xs font-medium text-teal-400 uppercase tracking-wider">Үүсгэсэн script</span>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(gResult); showToast('Хуулагдлаа ✓') }} className="btn-ghost">Хуулах</button>
                  </div>
                  <pre className="result-output">{gResult}</pre>
                </div>
              )}
            </div>
          )}

          {/* ── KNOWLEDGE ── */}
          {tab === 'knowledge' && (
            <div>
              <div className="mb-7">
                <h1 className="text-xl font-semibold text-white mb-2">Мэдлэгийн сан</h1>
                <p className="text-sm text-slate-500">Supabase-д хадгалагдсан бүх pattern, hook, CTA. Score өндөр = generate-д илүү нөлөөлнө.</p>
              </div>
              {!kbData || kbData.counts.scripts === 0 ? (
                <div className="glass-card p-12 text-center">
                  <div className="w-10 h-10 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(45,212,191,0.1)' }}>
                    <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M3 4h10M3 8h7M3 12h5" stroke="#2dd4bf" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </div>
                  <p className="text-slate-500 text-sm">Одоохондоо сурсан зүйл алга</p>
                  <p className="text-slate-600 text-xs mt-1">Script сургах таб дээр script оруулж эхлэ</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {[
                    { title: 'Pattern', items: kbData.patterns, accent: 'border-l-teal-500/50' },
                    { title: 'Hook хэлбэрүүд', items: kbData.hooks, accent: 'border-l-amber-500/50' },
                    { title: 'CTA хэлбэрүүд', items: kbData.ctas, accent: 'border-l-emerald-500/50' },
                    { title: 'Сэтгэл зүйн аргууд', items: kbData.triggers, accent: 'border-l-violet-500/50' },
                  ].filter(s => s.items?.length).map(({ title, items, accent }) => (
                    <div key={title}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{title}</span>
                        <span className="badge-teal">{items.length}</span>
                      </div>
                      {items.map(item => (
                        <div key={item.id} className={`text-sm text-slate-300 px-3.5 py-2.5 rounded-lg mb-1.5 border-l-2 ${accent} leading-relaxed flex justify-between gap-3 transition-colors cursor-default`}
                          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                          onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(45,212,191,0.12)')}
                          onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)')}>
                          <span>{item.content}</span>
                          {item.score > 1 && <span className="text-[10px] text-teal-500 font-mono shrink-0">×{item.score}</span>}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── HOOKS ── */}
          {tab === 'hooks' && (
            <div>
              <div className="mb-7">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-xl font-semibold text-white">Hook санал</h1>
                  <span className="badge-teal">{allHooks.length} hook</span>
                </div>
                <p className="text-sm text-slate-500">Дарахад clipboard-руу хуулна. Generate хийхэд автоматаар ашиглагдана.</p>
              </div>
              <input className={inp + ' mb-4'} placeholder="Хайх..." value={hookSearch} onChange={e => setHookSearch(e.target.value)} />
              <div className="flex flex-wrap gap-1.5 mb-5">
                {hookCats.slice(0, 14).map(c => (
                  <button key={c} onClick={() => setHookCat(c)} className={`chip ${hookCat === c ? 'sel' : ''}`}>{c === 'all' ? 'Бүгд' : c}</button>
                ))}
              </div>
              <div className="space-y-1.5">
                {filteredHooks.map((h, i) => (
                  <div key={i} onClick={() => { navigator.clipboard.writeText(h.text); showToast('Хуулагдлаа ✓') }}
                    className={`text-sm text-slate-300 px-3.5 py-2.5 rounded-lg border-l-2 ${srcColor[h.src]} leading-relaxed cursor-pointer transition-all group`}
                    style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(45,212,191,0.12)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}>
                    {h.text}
                    <div className={`text-[10px] mt-1 font-medium ${srcText[h.src]}`}>{h.src} · {h.cat}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── HISTORY ── */}
          {tab === 'history' && (
            <div>
              <div className="mb-7">
                <h1 className="text-xl font-semibold text-white mb-2">Script түүх</h1>
                <p className="text-sm text-slate-500">Supabase-д хадгалагдсан бүх script-үүд</p>
              </div>
              {!kbData?.scripts?.length ? (
                <div className="glass-card p-12 text-center text-slate-500 text-sm">Одоохондоо түүх алга.</div>
              ) : (
                <div className="space-y-3">
                  {kbData.scripts.map(s => {
                    const p = PERF[s.performance as keyof typeof PERF] || PERF.unknown
                    const lesson = s.analysis?.key_lesson as string
                    return (
                      <div key={s.id} className="glass-card p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex gap-2 items-center">
                            <span className="text-sm font-semibold text-slate-200">{s.category}</span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${p.cls}`}>{p.l}</span>
                          </div>
                          <span className="text-xs text-slate-600 font-mono">{new Date(s.created_at).toLocaleDateString('mn-MN')}</span>
                        </div>
                        {lesson && <div className="text-sm text-teal-400 font-medium">→ {lesson}</div>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 text-sm px-4 py-2.5 rounded-lg font-medium" style={{ background: 'rgba(13,17,23,0.95)', border: '1px solid rgba(45,212,191,0.25)', color: '#2dd4bf', backdropFilter: 'blur(10px)' }}>
          {toast}
        </div>
      )}
    </div>
  )
}

