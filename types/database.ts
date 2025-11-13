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
          email: string
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      lunch_events: {
        Row: {
          id: string
          created_by: string | null
          creator_name: string | null
          creator_email: string | null
          creator_password_hash: string | null
          group_id: string | null
          token: string | null
          title: string | null
          date: string
          start_time: string | null
          end_time: string | null
          location_type: 'freeroom' | 'restaurant' | 'undecided'
          restaurant_id: string | null
          restaurant_name: string | null
          restaurant_address: string | null
          creator_latitude: number | null
          creator_longitude: number | null
          description: string | null
          auto_daily_update: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          created_by?: string | null
          creator_name?: string | null
          creator_email?: string | null
          group_id?: string | null
          token?: string | null
          title?: string | null
          date: string
          start_time?: string | null
          end_time?: string | null
          location_type: 'freeroom' | 'restaurant' | 'undecided'
          restaurant_id?: string | null
          restaurant_name?: string | null
          restaurant_address?: string | null
          creator_latitude?: number | null
          creator_longitude?: number | null
          description?: string | null
          auto_daily_update?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          created_by?: string | null
          creator_name?: string | null
          creator_email?: string | null
          group_id?: string | null
          token?: string | null
          title?: string | null
          date?: string
          start_time?: string | null
          end_time?: string | null
          location_type?: 'freeroom' | 'restaurant' | 'undecided'
          restaurant_id?: string | null
          restaurant_name?: string | null
          restaurant_address?: string | null
          creator_latitude?: number | null
          creator_longitude?: number | null
          description?: string | null
          auto_daily_update?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      event_participants: {
        Row: {
          id: string
          event_id: string
          user_id: string | null
          name: string | null
          email: string | null
          password_hash: string | null
          status: 'going' | 'not_going' | 'maybe'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id?: string | null
          name?: string | null
          email?: string | null
          password_hash?: string | null
          status: 'going' | 'not_going' | 'maybe'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string | null
          name?: string | null
          email?: string | null
          password_hash?: string | null
          status?: 'going' | 'not_going' | 'maybe'
          created_at?: string
          updated_at?: string
        }
      }
      restaurants: {
        Row: {
          id: string
          name: string
          address: string
          latitude: number
          longitude: number
          place_id: string | null
          rating: number | null
          price_level: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          latitude: number
          longitude: number
          place_id?: string | null
          rating?: number | null
          price_level?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          latitude?: number
          longitude?: number
          place_id?: string | null
          rating?: number | null
          price_level?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: 'owner' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: 'owner' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: 'owner' | 'member'
          joined_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'event_created' | 'event_updated' | 'member_invited' | 'member_joined'
          title: string
          message: string | null
          related_event_id: string | null
          related_group_id: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'event_created' | 'event_updated' | 'member_invited' | 'member_joined'
          title: string
          message?: string | null
          related_event_id?: string | null
          related_group_id?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'event_created' | 'event_updated' | 'member_invited' | 'member_joined'
          title?: string
          message?: string | null
          related_event_id?: string | null
          related_group_id?: string | null
          read?: boolean
          created_at?: string
        }
      }
      group_invitations: {
        Row: {
          id: string
          group_id: string
          email: string
          invited_by: string
          token: string
          status: 'pending' | 'accepted' | 'declined'
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          group_id: string
          email: string
          invited_by: string
          token: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          group_id?: string
          email?: string
          invited_by?: string
          token?: string
          status?: 'pending' | 'accepted' | 'declined'
          created_at?: string
          expires_at?: string
        }
      }
      restaurant_votes: {
        Row: {
          id: string
          event_id: string
          restaurant_id: string
          user_id: string | null
          name: string | null
          email: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          restaurant_id: string
          user_id?: string | null
          name?: string | null
          email?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          restaurant_id?: string
          user_id?: string | null
          name?: string | null
          email?: string | null
          created_at?: string
        }
      }
      location_votes: {
        Row: {
          id: string
          event_id: string
          candidate_id: string
          user_id: string | null
          name: string | null
          email: string | null
          password_hash: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          candidate_id: string
          user_id?: string | null
          name?: string | null
          email?: string | null
          password_hash?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          candidate_id?: string
          user_id?: string | null
          name?: string | null
          email?: string | null
          password_hash?: string | null
          created_at?: string
        }
      }
      location_candidates: {
        Row: {
          id: string
          event_id: string
          name: string
          type: 'text' | 'restaurant'
          restaurant_id: string | null
          restaurant_name: string | null
          restaurant_address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          type: 'text' | 'restaurant'
          restaurant_id?: string | null
          restaurant_name?: string | null
          restaurant_address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          type?: 'text' | 'restaurant'
          restaurant_id?: string | null
          restaurant_name?: string | null
          restaurant_address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

