import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string || 'ерөнхий'

    if (!file) return NextResponse.json({ error: 'File required' }, { status: 400 })

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ELEVENLABS_API_KEY not set' }, { status: 500 })

    const elevenForm = new FormData()
    elevenForm.append('file', file)
    elevenForm.append('model_id', 'scribe_v1')

    const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: elevenForm
    })

    const data = await res.json()
    const transcript = data.text || ''

    if (!transcript) return NextResponse.json({ error: 'Transcript хоосон байна' }, { status: 400 })

    return NextResponse.json({ transcript, category })
  } catch (e) {
    console.error('Transcribe error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
