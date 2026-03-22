import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { script, category, performance, note } = await req.json()
    if (!script?.trim()) return NextResponse.json({ error: 'Script required' }, { status: 400 })

    const db = getServerClient()

    // Fetch existing patterns to avoid duplicates
    const { data: existingPatterns } = await db
      .from('knowledge_base')
      .select('content')
      .eq('type', 'pattern')
      .limit(15)
      .order('score', { ascending: false })
    const existPat = existingPatterns?.map(p => p.content).join('\n') || ''

    // Call Claude API
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })

    const system = `Та Монгол UGC рекламын мэргэжилтэн. Script задлаад ЗӨВХӨН JSON хариул. Backtick хэрэглэхгүй.
{
  "hook": "hook задлал монголоор",
  "hook_type": "story|question|shock|statement|label|urgency",
  "structure": "бүтцийн тайлбар",
  "emotional_trigger": "сэтгэл зүйн арга",
  "cta_type": "CTA төрөл",
  "why_works": "яагаад ажилдаг тайлбар",
  "key_lesson": "гол сургамж нэг өгүүлбэрт",
  "patterns": ["pattern 1", "pattern 2", "pattern 3"],
  "hooks_extracted": ["hook хэлбэр 1", "hook хэлбэр 2"],
  "ctas_extracted": ["CTA хэлбэр"],
  "emotional_triggers_extracted": ["trigger 1"]
}`

    const user = `Script: "${script}"
Ангилал: ${category || 'ерөнхий'}
Үр дүн: ${performance || 'unknown'}
${note ? 'Тайлбар: ' + note : ''}
${existPat ? '\nОдоогийн pattern:\n' + existPat : ''}`

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    })

    const claudeData = await claudeRes.json()
    const raw = claudeData.content?.find((b: { type: string }) => b.type === 'text')?.text || '{}'

    let analysis: Record<string, unknown>
    try {
      analysis = JSON.parse(raw.replace(/```json|```/g, '').trim())
    } catch {
      analysis = { key_lesson: raw, patterns: [], hooks_extracted: [], ctas_extracted: [], emotional_triggers_extracted: [] }
    }

    // Save script to DB
    await db.from('scripts').insert({
      script_text: script,
      category: category || 'ерөнхий',
      performance: performance || 'unknown',
      analysis,
    })

    // Upsert knowledge items — increment score if exists
    const upsert = async (type: string, items: string[]) => {
      if (!items?.length) return
      for (const content of items) {
        if (!content?.trim()) continue
        const { data: existing } = await db
          .from('knowledge_base')
          .select('id, score')
          .eq('type', type)
          .eq('content', content.trim())
          .single()

        if (existing) {
          await db.from('knowledge_base').update({ score: (existing.score || 1) + 1 }).eq('id', existing.id)
        } else {
          await db.from('knowledge_base').insert({ type, content: content.trim(), category: category || 'ерөнхий', score: 1 })
        }
      }
    }

    await Promise.all([
      upsert('pattern', analysis.patterns as string[]),
      upsert('hook', analysis.hooks_extracted as string[]),
      upsert('cta', analysis.ctas_extracted as string[]),
      upsert('trigger', analysis.emotional_triggers_extracted as string[]),
    ])

    return NextResponse.json({ success: true, analysis })
  } catch (e) {
    console.error('Train error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
