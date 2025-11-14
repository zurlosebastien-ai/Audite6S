import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Database {
  public: {
    Tables: {
      location_groups: {
        Row: {
          id: string
          name: string
          created_at: string | null
        }
        Insert: {
          id: string
          name: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string | null
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          group_id: string
          created_at: string | null
        }
        Insert: {
          id: string
          name: string
          group_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          group_id?: string
          created_at?: string | null
        }
      }
      pillars: {
        Row: {
          id: string
          name: string
          description: string
          created_at: string | null
        }
        Insert: {
          id: string
          name: string
          description: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string
          created_at?: string | null
        }
      }
      pillar_questions: {
        Row: {
          id: string
          pillar_id: string
          text: string
          order_index: number
          created_at: string | null
        }
        Insert: {
          id: string
          pillar_id: string
          text: string
          order_index?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          pillar_id?: string
          text?: string
          order_index?: number
          created_at?: string | null
        }
      }
      monthly_audits: {
        Row: {
          id: string
          month: string
          year: number
          completed: boolean | null
          overall_score: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          month: string
          year: number
          completed?: boolean | null
          overall_score?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          month?: string
          year?: number
          completed?: boolean | null
          overall_score?: number | null
          created_at?: string | null
        }
      }
      location_audits: {
        Row: {
          id: string
          monthly_audit_id: string
          location_id: string
          date: string
          completed: boolean | null
          overall_score: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          monthly_audit_id: string
          location_id: string
          date: string
          completed?: boolean | null
          overall_score?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          monthly_audit_id?: string
          location_id?: string
          date?: string
          completed?: boolean | null
          overall_score?: number | null
          created_at?: string | null
        }
      }
      pillar_evaluations: {
        Row: {
          id: string
          location_audit_id: string
          pillar_id: string
          score: number
          comment: string | null
          question_answers: any | null
          created_at: string | null
        }
        Insert: {
          id?: string
          location_audit_id: string
          pillar_id: string
          score?: number
          comment?: string | null
          question_answers?: any | null
          created_at?: string | null
        }
        Update: {
          id?: string
          location_audit_id?: string
          pillar_id?: string
          score?: number
          comment?: string | null
          question_answers?: any | null
          created_at?: string | null
        }
      }
      corrective_actions: {
        Row: {
          id: string
          pillar_evaluation_id: string
          description: string
          status: string | null
          completed_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          pillar_evaluation_id: string
          description: string
          status?: string | null
          completed_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          pillar_evaluation_id?: string
          description?: string
          status?: string | null
          completed_at?: string | null
          created_at?: string | null
        }
      }
      group_scores: {
        Row: {
          id: string
          monthly_audit_id: string
          group_id: string
          score: number
          created_at: string | null
        }
        Insert: {
          id?: string
          monthly_audit_id: string
          group_id: string
          score?: number
          created_at?: string | null
        }
        Update: {
          id?: string
          monthly_audit_id?: string
          group_id?: string
          score?: number
          created_at?: string | null
        }
      }
    }
  }
}