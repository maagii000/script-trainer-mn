import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'ELEVENLABS_API_KEY not set' }, { status: 500 })

    const contentType = req.headers.get('content-type') || ''
    let audioBlob: Blob
    let fileName = 'audio.mp3'

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File
      if (!file) return NextResponse.json({ error: 'File required' }, { status: 400 })
      audioBlob = file
      fileName = file.name
    } else {
      const { url } = await req.json()
      if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })
      const res = await fetch(url)
      if (!res.ok) return NextResponse.json({ error: 'URL-аас файл татаж чадсангүй' }, { status: 400 })
      audioBlob = await res.blob()
      fileName = 'audio.mp3'
    }

    const elevenForm = new FormData()
    elevenForm.append('file', audioBlob, fileName)
    elevenForm.append('model_id', 'scribe_v1')

    const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: { 'xi-api-key': apiKey },
      body: elevenForm
    })

    const data = await res.json()
    const transcript = data.text || ''

    if (!transcript) return NextResponse.json({ error: 'Transcript хоосон байна: ' + JSON.stringify(data) }, { status: 400 })

    return NextResponse.json({ transcript })
  } catch (e) {
    console.error('Transcribe error:', e)
    return NextResponse.json({ error: 'Server error: ' + (e as Error).message }, { status: 500 })
  }
}
