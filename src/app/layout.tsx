import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Mongul Script AI',
  description: 'Монгол UGC script AI trainer — Hormozi + Дэгээ + Notion',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
