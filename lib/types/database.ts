export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          created_at?: string
        }
      }
      households: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      household_members: {
        Row: {
          id: string
          household_id: string
          user_id: string
          role: 'owner' | 'member'
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          user_id: string
          role?: 'owner' | 'member'
          created_at?: string
        }
        Update: {
          id?: string
          household_id?: string
          user_id?: string
          role?: 'owner' | 'member'
          created_at?: string
        }
      }
      rooms: {
        Row: {
          id: string
          name: string
          type: 'SHARED' | 'PRIVATE'
          split_method: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE'
          split_config: Json | null
          split_by: 'USER' | 'HOUSEHOLD'
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'SHARED' | 'PRIVATE'
          split_method?: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE'
          split_config?: Json | null
          split_by?: 'USER' | 'HOUSEHOLD'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'SHARED' | 'PRIVATE'
          split_method?: 'EQUAL' | 'CUSTOM' | 'PERCENTAGE'
          split_config?: Json | null
          split_by?: 'USER' | 'HOUSEHOLD'
          created_at?: string
        }
      }
      room_members: {
        Row: {
          id: string
          room_id: string
          user_id: string | null
          household_id: string | null
          role: 'owner' | 'viewer'
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          user_id?: string | null
          household_id?: string | null
          role?: 'owner' | 'viewer'
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string | null
          household_id?: string | null
          role?: 'owner' | 'viewer'
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          icon: string
          color: string
          created_by: string | null
          room_id: string | null
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          icon: string
          color: string
          created_by?: string | null
          room_id?: string | null
          is_system?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          icon?: string
          color?: string
          created_by?: string | null
          room_id?: string | null
          is_system?: boolean
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          created_at: string
          date: string
          amount: number
          note: string
          category_id: string
          room_id: string
          paid_by: string
          created_by: string
          is_deleted: boolean
          is_settled: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          date: string
          amount: number
          note: string
          category_id: string
          room_id: string
          paid_by: string
          created_by: string
          is_deleted?: boolean
          is_settled?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          date?: string
          amount?: number
          note?: string
          category_id?: string
          room_id?: string
          paid_by?: string
          created_by?: string
          is_deleted?: boolean
          is_settled?: boolean
        }
      }
      settlements: {
        Row: {
          id: string
          room_id: string
          from_household_id: string
          to_household_id: string
          transaction_ids: string[]
          amount: number
          status: 'pending' | 'confirmed' | 'rejected'
          requested_by: string
          requested_at: string
          confirmed_by: string | null
          confirmed_at: string | null
          rejected_reason: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          from_household_id: string
          to_household_id: string
          transaction_ids: string[]
          amount: number
          status?: 'pending' | 'confirmed' | 'rejected'
          requested_by: string
          requested_at?: string
          confirmed_by?: string | null
          confirmed_at?: string | null
          rejected_reason?: string | null
          note?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          from_household_id?: string
          to_household_id?: string
          transaction_ids?: string[]
          amount?: number
          status?: 'pending' | 'confirmed' | 'rejected'
          requested_by?: string
          requested_at?: string
          confirmed_by?: string | null
          confirmed_at?: string | null
          rejected_reason?: string | null
          note?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error' | 'settlement'
          link: string | null
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error' | 'settlement'
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: 'info' | 'success' | 'warning' | 'error' | 'settlement'
          link?: string | null
          is_read?: boolean
          created_at?: string
        }
      }
    }
  }
}
