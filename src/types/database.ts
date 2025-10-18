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
          full_name: string | null
          avatar_url: string | null
          company_name: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          company_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          company_name?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      whatsapp_credentials: {
        Row: {
          id: string
          user_id: string
          access_token: string
          phone_number_id: string
          business_account_id: string
          app_id: string
          webhook_verify_token: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          access_token: string
          phone_number_id: string
          business_account_id: string
          app_id: string
          webhook_verify_token?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          access_token?: string
          phone_number_id?: string
          business_account_id?: string
          app_id?: string
          webhook_verify_token?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          phone_number: string
          name: string | null
          email: string | null
          company: string | null
          tags: string[] | null
          notes: string | null
          lead_status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
          last_contacted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          phone_number: string
          name?: string | null
          email?: string | null
          company?: string | null
          tags?: string[] | null
          notes?: string | null
          lead_status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
          last_contacted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          phone_number?: string
          name?: string | null
          email?: string | null
          company?: string | null
          tags?: string[] | null
          notes?: string | null
          lead_status?: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
          last_contacted_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          contact_id: string
          whatsapp_conversation_id: string | null
          status: 'active' | 'closed' | 'archived'
          last_message_at: string | null
          last_message_preview: string | null
          unread_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id: string
          whatsapp_conversation_id?: string | null
          status?: 'active' | 'closed' | 'archived'
          last_message_at?: string | null
          last_message_preview?: string | null
          unread_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string
          whatsapp_conversation_id?: string | null
          status?: 'active' | 'closed' | 'archived'
          last_message_at?: string | null
          last_message_preview?: string | null
          unread_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          whatsapp_message_id: string | null
          type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact' | 'template'
          direction: 'inbound' | 'outbound'
          content: string | null
          media_url: string | null
          media_type: string | null
          template_name: string | null
          template_params: Json | null
          status: string
          delivered_at: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          whatsapp_message_id?: string | null
          type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact' | 'template'
          direction: 'inbound' | 'outbound'
          content?: string | null
          media_url?: string | null
          media_type?: string | null
          template_name?: string | null
          template_params?: Json | null
          status?: string
          delivered_at?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          whatsapp_message_id?: string | null
          type?: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact' | 'template'
          direction?: 'inbound' | 'outbound'
          content?: string | null
          media_url?: string | null
          media_type?: string | null
          template_name?: string | null
          template_params?: Json | null
          status?: string
          delivered_at?: string | null
          read_at?: string | null
          created_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          user_id: string
          name: string
          message: string
          template_name: string | null
          template_params: Json | null
          target_contacts: string[] | null
          status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
          scheduled_at: string | null
          sent_at: string | null
          total_contacts: number
          sent_count: number
          delivered_count: number
          read_count: number
          failed_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          message: string
          template_name?: string | null
          template_params?: Json | null
          target_contacts?: string[] | null
          status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
          scheduled_at?: string | null
          sent_at?: string | null
          total_contacts?: number
          sent_count?: number
          delivered_count?: number
          read_count?: number
          failed_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          message?: string
          template_name?: string | null
          template_params?: Json | null
          target_contacts?: string[] | null
          status?: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
          scheduled_at?: string | null
          sent_at?: string | null
          total_contacts?: number
          sent_count?: number
          delivered_count?: number
          read_count?: number
          failed_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      campaign_messages: {
        Row: {
          id: string
          campaign_id: string
          contact_id: string
          message_id: string | null
          status: string
          sent_at: string | null
          delivered_at: string | null
          read_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          contact_id: string
          message_id?: string | null
          status?: string
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          contact_id?: string
          message_id?: string | null
          status?: string
          sent_at?: string | null
          delivered_at?: string | null
          read_at?: string | null
          error_message?: string | null
          created_at?: string
        }
      }
      webhook_events: {
        Row: {
          id: string
          user_id: string
          event_type: string
          whatsapp_message_id: string | null
          contact_phone: string | null
          payload: Json
          processed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          whatsapp_message_id?: string | null
          contact_phone?: string | null
          payload: Json
          processed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          whatsapp_message_id?: string | null
          contact_phone?: string | null
          payload?: Json
          processed?: boolean
          created_at?: string
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
      message_type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact' | 'template'
      message_direction: 'inbound' | 'outbound'
      conversation_status: 'active' | 'closed' | 'archived'
      lead_status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost'
      campaign_status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
