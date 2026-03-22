import { NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'

export async function GET() {
  try {
    const db = getServerClient()

    const [patterns, hooks, ctas, triggers, scripts] = await Promise.all([
      db.from('knowledge_base').select('*').eq('type', 'pattern').order('score', { ascending: false }).limit(40),
      db.from('knowledge_base').select('*').eq('type', 'hook').order('score', { ascending: false }).limit(30),
      db.from('knowledge_base').select('*').eq('type', 'cta').order('score', { ascending: false }).limit(25),
      db.from('knowledge_base').select('*').eq('type', 'trigger').order('score', { ascending: false }).limit(25),
      db.from('scripts').select('id, category, performance, analysis, created_at').order('created_at', { ascending: false }).limit(50),
    ])

    return NextResponse.json({
      patterns: patterns.data || [],
      hooks: hooks.data || [],
      ctas: ctas.data || [],
      triggers: triggers.data || [],
      scripts: scripts.data || [],
      counts: {
        patterns: patterns.data?.length || 0,
        hooks: hooks.data?.length || 0,
        ctas: ctas.data?.length || 0,
        scripts: scripts.data?.length || 0,
      },
    })
  } catch (e) {
    console.error('Knowledge error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
