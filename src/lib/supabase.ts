import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, anonKey)

export function getServerClient() {
  return createClient(url, anonKey)
}

export type KnowledgeType = 'pattern' | 'hook' | 'cta' | 'trigger'

export interface KnowledgeItem {
  id?: string
  type: KnowledgeType
  content: string
  category: string
  score: number
  created_at?: string
}

export interface ScriptRecord {
  id?: string
  user_id?: string
  script_text: string
  category: string
  performance: string
  analysis: Record<string, unknown>
  created_at?: string
}
