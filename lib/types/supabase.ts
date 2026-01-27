export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          created_at?: string;
        };
      };
      agents: {
        Row: {
          id: string;
          full_name: string;
          phone_number: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          phone_number: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone_number?: string;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      tracked_numbers: {
        Row: {
          id: string;
          friendly_name: string;
          twilio_phone_number: string;
          twilio_sid: string | null;
          active: boolean;
          created_at: string;
          updated_at: string;
          greeting_text?: string | null;
          voicemail_enabled?: boolean | null;
          voicemail_prompt?: string | null;
        };
        Insert: {
          id?: string;
          friendly_name: string;
          twilio_phone_number: string;
          twilio_sid?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
          greeting_text?: string | null;
          voicemail_enabled?: boolean | null;
          voicemail_prompt?: string | null;
        };
        Update: {
          id?: string;
          friendly_name?: string;
          twilio_phone_number?: string;
          twilio_sid?: string | null;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
          greeting_text?: string | null;
          voicemail_enabled?: boolean | null;
          voicemail_prompt?: string | null;
        };
      };
      tracked_number_routes: {
        Row: {
          id: string;
          tracked_number_id: string;
          agent_id: string;
          sort_order: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tracked_number_id: string;
          agent_id: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          tracked_number_id?: string;
          agent_id?: string;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
        };
      };
      calls: {
        Row: {
          id: string;
          tracked_number_id: string | null;
          twilio_call_sid: string;
          from_number: string | null;
          to_number: string | null;
          started_at: string;
          ended_at: string | null;
          status: string;
          connected_agent_id: string | null;
          created_at: string;
          voicemail_url?: string | null;
          voicemail_sid?: string | null;
          recording_url?: string | null;
          recording_sid?: string | null;
          recording_duration_seconds?: number | null;
        };
        Insert: {
          id?: string;
          tracked_number_id?: string | null;
          twilio_call_sid: string;
          from_number?: string | null;
          to_number?: string | null;
          started_at?: string;
          ended_at?: string | null;
          status?: string;
          connected_agent_id?: string | null;
          created_at?: string;
          voicemail_url?: string | null;
          voicemail_sid?: string | null;
          recording_url?: string | null;
          recording_sid?: string | null;
          recording_duration_seconds?: number | null;
        };
        Update: {
          id?: string;
          tracked_number_id?: string | null;
          twilio_call_sid?: string;
          from_number?: string | null;
          to_number?: string | null;
          started_at?: string;
          ended_at?: string | null;
          status?: string;
          connected_agent_id?: string | null;
          created_at?: string;
          voicemail_url?: string | null;
          voicemail_sid?: string | null;
          recording_url?: string | null;
          recording_sid?: string | null;
          recording_duration_seconds?: number | null;
        };
      };
      call_attempts: {
        Row: {
          id: string;
          call_id: string;
          agent_id: string;
          attempt_call_sid: string | null;
          status: string;
          started_at: string;
          ended_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          agent_id: string;
          attempt_call_sid?: string | null;
          status?: string;
          started_at?: string;
          ended_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          call_id?: string;
          agent_id?: string;
          attempt_call_sid?: string | null;
          status?: string;
          started_at?: string;
          ended_at?: string | null;
          created_at?: string;
        };
      };
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
  };
};
