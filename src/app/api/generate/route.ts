import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase'
import { buildKnowledgeContext } from '@/lib/knowledge'

const TONE_MAP: Record<string, string> = {
  emotional: 'сэтгэл хөдлөлтэй',
  story: 'хувийн түүхтэй',
  shock: 'шок, гайхмаар',
  urgency: 'яаралтай, хязгаарлагдмал санал',
  trust: 'итгэл үнэмшил',
  funny: 'хошин, casual',
  compare: 'харьцуулсан өмнө/дараа',
  pain: 'өвдөлтийн цэгт хандсан',
}

const STR_MAP: Record<string, string> = {
  std: 'HOOK → АСУУДАЛ → ШИЙДЭЛ → НОТЛОХ → CTA',
  story: 'Түүх эхлэл → Эргэлт → Бүтээгдэхүүн → CTA',
  before: 'Өмнөх байдал → Одоогийн байдал → CTA',
  notion: 'HOOK → Асуудал → Агитация → Шийдэл → Feature/Benefits → Муу альтернатив → Үр дүн → CTA',
}

const LEN_MAP: Record<string, string> = {
  '15': '15сек (~35 үг)',
  '30': '30сек (~70 үг)',
  '60': '60сек (~130 үг)',
}

export async function POST(req: NextRequest) {
  try {
    const { product, audience, benefit, tone, length, variants, structure } = await req.json()
    if (!product?.trim()) return NextResponse.json({ error: 'Product required' }, { status: 400 })

    const apiKey = process.env.FIREWORKS_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'FIREWORKS_API_KEY not set' }, { status: 500 })

    // Fetch user's knowledge from DB
    const db = getServerClient()
    const [{ data: patterns }, { data: hooks }, { data: ctas }] = await Promise.all([
      db.from('knowledge_base').select('content').eq('type', 'pattern').order('score', { ascending: false }).limit(15),
      db.from('knowledge_base').select('content').eq('type', 'hook').order('score', { ascending: false }).limit(10),
      db.from('knowledge_base').select('content').eq('type', 'cta').order('score', { ascending: false }).limit(8),
    ])

    const knowledgeCtx = buildKnowledgeContext(
      patterns?.map(p => p.content) || [],
      hooks?.map(h => h.content) || [],
      ctas?.map(c => c.content) || []
    )

    const system = `Та Монгол UGC видео рекламын script бичигч. Монгол ярианы хэлээр, байгалийн, амьд байдлаар бич.
Script бүрийг "══════ ХУВИЛБАР X ══════" гэж тусгаарла.
Хэсэг бүрийг [HOOK] [АСУУДАЛ] [ШИЙДЭЛ] [НОТЛОХ] [CTA] гэж тэмдэглэ.`

    const user = `${knowledgeCtx}

ШИНЭ SCRIPT:
Бүтээгдэхүүн: ${product}
Target: ${audience || 'Монгол Facebook/Instagram хэрэглэгч'}
${benefit ? 'Давуу тал: ' + benefit : ''}
Tone: ${TONE_MAP[tone] || TONE_MAP.emotional}
Бүтэц: ${STR_MAP[structure] || STR_MAP.std}
Урт: ${LEN_MAP[length] || LEN_MAP['30']}
Хувилбар: ${variants || 3} ширхэг

ЧУХАЛ:
- Hook нь Hormozi болон Дэгээ-ийн style-ийг загвар болгон Монгол соёлд тохируулах
- Монгол ярианы хэлэнд тохирсон, байгалийн, амьд байдлаар
- Facebook/Instagram-д шууд ажиллах`

    const claudeRes = await fetch('https://api.fireworks.ai/inference/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'accounts/fireworks/models/qwen3-30b-a3b',
        max_tokens: 1600,
        temperature: 0.7,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      })
    })

    const claudeData = await claudeRes.json()
    const text = claudeData.choices?.[0]?.message?.content || 'Алдаа гарлаа.'

    return NextResponse.json({ script: text })
  } catch (e) {
    console.error('Generate error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
