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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      answers: {
        Row: {
          answered_at: string
          auto_score: number | null
          bet: number
          final_score: number | null
          graded_by_host: boolean
          id: string
          payload: Json
          player_id: string
          question_id: string
          room_id: string
        }
        Insert: {
          answered_at?: string
          auto_score?: number | null
          bet?: number
          final_score?: number | null
          graded_by_host?: boolean
          id?: string
          payload?: Json
          player_id: string
          question_id: string
          room_id: string
        }
        Update: {
          answered_at?: string
          auto_score?: number | null
          bet?: number
          final_score?: number | null
          graded_by_host?: boolean
          id?: string
          payload?: Json
          player_id?: string
          question_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      clips: {
        Row: {
          anime_title: string | null
          created_at: string
          created_by: string | null
          duration_sec: number
          expires_at: string | null
          height: number | null
          id: string
          peaks: Json | null
          source: string
          storage_path: string
          thumb_path: string | null
          title: string
          width: number | null
        }
        Insert: {
          anime_title?: string | null
          created_at?: string
          created_by?: string | null
          duration_sec: number
          expires_at?: string | null
          height?: number | null
          id?: string
          peaks?: Json | null
          source: string
          storage_path: string
          thumb_path?: string | null
          title: string
          width?: number | null
        }
        Update: {
          anime_title?: string | null
          created_at?: string
          created_by?: string | null
          duration_sec?: number
          expires_at?: string | null
          height?: number | null
          id?: string
          peaks?: Json | null
          source?: string
          storage_path?: string
          thumb_path?: string | null
          title?: string
          width?: number | null
        }
        Relationships: []
      }
      players: {
        Row: {
          id: string
          is_host: boolean
          last_seen_at: string
          nickname: string
          room_id: string
          slot: number
        }
        Insert: {
          id?: string
          is_host?: boolean
          last_seen_at?: string
          nickname: string
          room_id: string
          slot: number
        }
        Update: {
          id?: string
          is_host?: boolean
          last_seen_at?: string
          nickname?: string
          room_id?: string
          slot?: number
        }
        Relationships: [
          {
            foreignKeyName: "players_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer: Json | null
          hint: string | null
          id: string
          idx: number
          kind: string
          media_path: string | null
          payload: Json
          points: number
          prompt: string
          quiz_id: string
        }
        Insert: {
          answer?: Json | null
          hint?: string | null
          id?: string
          idx: number
          kind: string
          media_path?: string | null
          payload?: Json
          points?: number
          prompt: string
          quiz_id: string
        }
        Update: {
          answer?: Json | null
          hint?: string | null
          id?: string
          idx?: number
          kind?: string
          media_path?: string | null
          payload?: Json
          points?: number
          prompt?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          author_nickname: string | null
          created_at: string
          id: string
          is_public: boolean
          theme: string | null
          title: string
        }
        Insert: {
          author_nickname?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          theme?: string | null
          title: string
        }
        Update: {
          author_nickname?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          theme?: string | null
          title?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          breakpoints: Json
          clip_id: string | null
          code: string
          created_at: string
          current_step: number
          expires_at: string
          game: string
          host_player_id: string | null
          id: string
          options: Json
          quiz_id: string | null
          recording_by: string | null
          recording_since: string | null
          status: string
          step_started_at: string | null
        }
        Insert: {
          breakpoints?: Json
          clip_id?: string | null
          code: string
          created_at?: string
          current_step?: number
          expires_at?: string
          game?: string
          host_player_id?: string | null
          id?: string
          options?: Json
          quiz_id?: string | null
          recording_by?: string | null
          recording_since?: string | null
          status?: string
          step_started_at?: string | null
        }
        Update: {
          breakpoints?: Json
          clip_id?: string | null
          code?: string
          created_at?: string
          current_step?: number
          expires_at?: string
          game?: string
          host_player_id?: string | null
          id?: string
          options?: Json
          quiz_id?: string | null
          recording_by?: string | null
          recording_since?: string | null
          status?: string
          step_started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rooms_clip_id_fkey"
            columns: ["clip_id"]
            isOneToOne: false
            referencedRelation: "clips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_host_player_id_fkey"
            columns: ["host_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rooms_recording_by_fkey"
            columns: ["recording_by"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      takes: {
        Row: {
          created_at: string
          duration_ms: number
          id: string
          is_selected: boolean
          mime_type: string
          offset_ms: number
          peaks: Json | null
          player_id: string | null
          room_id: string
          start_sec: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          duration_ms: number
          id?: string
          is_selected?: boolean
          mime_type: string
          offset_ms?: number
          peaks?: Json | null
          player_id?: string | null
          room_id: string
          start_sec?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          duration_ms?: number
          id?: string
          is_selected?: boolean
          mime_type?: string
          offset_ms?: number
          peaks?: Json | null
          player_id?: string | null
          room_id?: string
          start_sec?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "takes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "takes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
