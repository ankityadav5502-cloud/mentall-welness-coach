export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          room_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          room_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          patient_id: string
          status: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          patient_id: string
          status?: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string
          status?: string
        }
        Relationships: []
      }
      clinical_records: {
        Row: {
          created_at: string
          doctor_id: string | null
          id: string
          patient_id: string
          source: string | null
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          id?: string
          patient_id: string
          source?: string | null
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          id?: string
          patient_id?: string
          source?: string | null
        }
        Relationships: []
      }
      doctor_patient_assignments: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          patient_id: string
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          patient_id: string
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string
        }
        Relationships: []
      }
      doctor_profiles: {
        Row: {
          available_from: string
          available_until: string
          avatar_url: string | null
          bio: string | null
          consultation_fee: number
          created_at: string
          hospital_name: string | null
          id: string
          is_listed: boolean
          languages: string[] | null
          license_number: string | null
          rating: number | null
          specialization: string | null
          years_of_experience: number | null
        }
        Insert: {
          available_from?: string
          available_until?: string
          avatar_url?: string | null
          bio?: string | null
          consultation_fee?: number
          created_at?: string
          hospital_name?: string | null
          id: string
          is_listed?: boolean
          languages?: string[] | null
          license_number?: string | null
          rating?: number | null
          specialization?: string | null
          years_of_experience?: number | null
        }
        Update: {
          available_from?: string
          available_until?: string
          avatar_url?: string | null
          bio?: string | null
          consultation_fee?: number
          created_at?: string
          hospital_name?: string | null
          id?: string
          is_listed?: boolean
          languages?: string[] | null
          license_number?: string | null
          rating?: number | null
          specialization?: string | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
      dopamine_tasks: {
        Row: {
          day: string
          done: boolean
          id: string
          label: string
          type: string
          user_id: string
        }
        Insert: {
          day?: string
          done?: boolean
          id?: string
          label: string
          type: string
          user_id: string
        }
        Update: {
          day?: string
          done?: boolean
          id?: string
          label?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      game_sessions: {
        Row: {
          created_at: string
          duration_seconds: number
          game: string
          id: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          game: string
          id?: string
          score?: number
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          game?: string
          id?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      guardian_links: {
        Row: {
          created_at: string
          dependent_id: string
          guardian_id: string
          id: string
          relationship: string | null
        }
        Insert: {
          created_at?: string
          dependent_id: string
          guardian_id: string
          id?: string
          relationship?: string | null
        }
        Update: {
          created_at?: string
          dependent_id?: string
          guardian_id?: string
          id?: string
          relationship?: string | null
        }
        Relationships: []
      }
      guardian_profiles: {
        Row: {
          created_at: string
          dependent_age: number | null
          dependent_name: string | null
          dependent_relationship: string | null
          emergency_contact: string | null
          id: string
        }
        Insert: {
          created_at?: string
          dependent_age?: number | null
          dependent_name?: string | null
          dependent_relationship?: string | null
          emergency_contact?: string | null
          id: string
        }
        Update: {
          created_at?: string
          dependent_age?: number | null
          dependent_name?: string | null
          dependent_relationship?: string | null
          emergency_contact?: string | null
          id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          created_at: string
          date: string
          free_text: string | null
          id: string
          prompt_feeling: string | null
          prompt_intention: string | null
          prompt_win: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          free_text?: string | null
          id?: string
          prompt_feeling?: string | null
          prompt_intention?: string | null
          prompt_win?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          free_text?: string | null
          id?: string
          prompt_feeling?: string | null
          prompt_intention?: string | null
          prompt_win?: string | null
          user_id?: string
        }
        Relationships: []
      }
      medication_logs: {
        Row: {
          created_at: string
          day: string
          id: string
          medication_id: string
          skipped: boolean
          taken_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          id?: string
          medication_id: string
          skipped?: boolean
          taken_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          medication_id?: string
          skipped?: boolean
          taken_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medication_logs_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          active: boolean
          created_at: string
          dosage: string
          end_date: string | null
          frequency: string
          id: string
          name: string
          notes: string | null
          prescribed_by: string | null
          start_date: string
          time_of_day: string[] | null
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          dosage: string
          end_date?: string | null
          frequency: string
          id?: string
          name: string
          notes?: string | null
          prescribed_by?: string | null
          start_date?: string
          time_of_day?: string[] | null
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          dosage?: string
          end_date?: string | null
          frequency?: string
          id?: string
          name?: string
          notes?: string | null
          prescribed_by?: string | null
          start_date?: string
          time_of_day?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      moods: {
        Row: {
          created_at: string
          emoji: string
          id: string
          note: string | null
          user_id: string
          value: number
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          note?: string | null
          user_id: string
          value: number
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          note?: string | null
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      patient_privacy_settings: {
        Row: {
          created_at: string
          doctor_id: string
          id: string
          patient_id: string
          share_games: boolean
          share_journal: boolean
          share_medications: boolean
          share_moods: boolean
          share_tasks: boolean
        }
        Insert: {
          created_at?: string
          doctor_id: string
          id?: string
          patient_id: string
          share_games?: boolean
          share_journal?: boolean
          share_medications?: boolean
          share_moods?: boolean
          share_tasks?: boolean
        }
        Update: {
          created_at?: string
          doctor_id?: string
          id?: string
          patient_id?: string
          share_games?: boolean
          share_journal?: boolean
          share_medications?: boolean
          share_moods?: boolean
          share_tasks?: boolean
        }
        Relationships: []
      }
      patient_profiles: {
        Row: {
          conditions: string[] | null
          created_at: string
          current_medications: string | null
          emergency_contact: string | null
          id: string
          therapy_history: string | null
        }
        Insert: {
          conditions?: string[] | null
          created_at?: string
          current_medications?: string | null
          emergency_contact?: string | null
          id: string
          therapy_history?: string | null
        }
        Update: {
          conditions?: string[] | null
          created_at?: string
          current_medications?: string | null
          emergency_contact?: string | null
          id?: string
          therapy_history?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          gender: string | null
          id: string
          onboarding_completed: boolean
          phone: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          gender?: string | null
          id: string
          onboarding_completed?: boolean
          phone?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          gender?: string | null
          id?: string
          onboarding_completed?: boolean
          phone?: string | null
        }
        Relationships: []
      }
      sos_events: {
        Row: {
          id: string
          notes: string | null
          resolved: boolean
          triggered_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notes?: string | null
          resolved?: boolean
          triggered_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notes?: string | null
          resolved?: boolean
          triggered_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "patient" | "doctor" | "guardian"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["patient", "doctor", "guardian"],
    },
  },
} as const

