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

    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })

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

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1600,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    })

    const claudeData = await claudeRes.json()
    const text = claudeData.content?.find((b: { type: string }) => b.type === 'text')?.text || 'Алдаа гарлаа.'

    return NextResponse.json({ script: text })
  } catch (e) {
    console.error('Generate error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
