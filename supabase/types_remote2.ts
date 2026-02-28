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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_conversations: {
        Row: {
          content: string
          created_at: string
          id: string
          model: string | null
          role: string
          session_id: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          model?: string | null
          role: string
          session_id?: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          model?: string | null
          role?: string
          session_id?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_suggestions: {
        Row: {
          context_used: Json | null
          created_at: string | null
          date: string | null
          suggestions: Json | null
          user_id: string | null
        }
        Insert: {
          context_used?: Json | null
          created_at?: string | null
          date?: string | null
          suggestions?: Json | null
          user_id?: string | null
        }
        Update: {
          context_used?: Json | null
          created_at?: string | null
          date?: string | null
          suggestions?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      check_ins: {
        Row: {
          ai_analysis: string | null
          ai_suggestions: Json | null
          created_at: string
          cycle_day: number | null
          cycle_phase: string | null
          date: string
          energy_score: number | null
          free_text: string | null
          humor_emoji: string | null
          id: string
          sleep_hours: number | null
          sleep_quality: number | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          ai_suggestions?: Json | null
          created_at?: string
          cycle_day?: number | null
          cycle_phase?: string | null
          date: string
          energy_score?: number | null
          free_text?: string | null
          humor_emoji?: string | null
          id?: string
          sleep_hours?: number | null
          sleep_quality?: number | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          ai_suggestions?: Json | null
          created_at?: string
          cycle_day?: number | null
          cycle_phase?: string | null
          date?: string
          energy_score?: number | null
          free_text?: string | null
          humor_emoji?: string | null
          id?: string
          sleep_hours?: number | null
          sleep_quality?: number | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "check_ins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      cycle_data: {
        Row: {
          created_at: string | null
          cycle_length: number | null
          follicular_start: string | null
          luteal_start: string | null
          next_period_predicted: string | null
          ovulation_date: string | null
          period_end_date: string | null
          period_start_date: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          cycle_length?: number | null
          follicular_start?: string | null
          luteal_start?: string | null
          next_period_predicted?: string | null
          ovulation_date?: string | null
          period_end_date?: string | null
          period_start_date: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          cycle_length?: number | null
          follicular_start?: string | null
          luteal_start?: string | null
          next_period_predicted?: string | null
          ovulation_date?: string | null
          period_end_date?: string | null
          period_start_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cycle_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cycle_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      focus_sessions: {
        Row: {
          completed: boolean
          created_at: string
          cycle_phase: string | null
          duration_minutes: number | null
          ended_at: string | null
          energy_at_start: number | null
          id: string
          started_at: string
          task_id: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          cycle_phase?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          energy_at_start?: number | null
          id?: string
          started_at: string
          task_id?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          cycle_phase?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          energy_at_start?: number | null
          id?: string
          started_at?: string
          task_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_sessions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "focus_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      google_calendar_events: {
        Row: {
          color_id: string | null
          created_at: string
          cycle_phase: string | null
          end_datetime: string | null
          google_event_id: string
          id: string
          last_synced_at: string
          start_datetime: string | null
          synced_from: string | null
          task_id: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          color_id?: string | null
          created_at?: string
          cycle_phase?: string | null
          end_datetime?: string | null
          google_event_id: string
          id?: string
          last_synced_at?: string
          start_datetime?: string | null
          synced_from?: string | null
          task_id?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          color_id?: string | null
          created_at?: string
          cycle_phase?: string | null
          end_datetime?: string | null
          google_event_id?: string
          id?: string
          last_synced_at?: string
          start_datetime?: string | null
          synced_from?: string | null
          task_id?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "google_calendar_events_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "google_calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notification_logs: {
        Row: {
          channel: string | null
          created_at: string | null
          id: string
          sent_at: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          id?: string
          sent_at?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          id?: string
          sent_at?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          data: Json | null
          id: string
          read_at: string | null
          title: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          read_at?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          read_at?: string | null
          title?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_conversations_count_month: number
          ai_conversations_reset_at: string | null
          avatar_url: string | null
          avg_sleep_hours: number | null
          cognitive_preferences: string[] | null
          created_at: string
          current_streak: number | null
          cycle_length: number | null
          email: string | null
          email_cycle_alert: boolean
          fcm_token: string | null
          fcm_token_updated_at: string | null
          full_name: string | null
          goals: string | null
          google_access_token: string | null
          google_calendar_id: string | null
          google_refresh_token: string | null
          google_token_expires_at: string | null
          id: string
          last_period_start: string | null
          luteal_phase_length: number | null
          notification_checkin_reminder: boolean
          notification_cycle_alert: boolean
          notification_focus_suggestion: boolean
          notification_news: boolean
          onboarding_completed: boolean
          plan: string
          privacy_biometric_ai: boolean
          sleep_time: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          timezone: string | null
          updated_at: string
          wake_time: string | null
        }
        Insert: {
          ai_conversations_count_month?: number
          ai_conversations_reset_at?: string | null
          avatar_url?: string | null
          avg_sleep_hours?: number | null
          cognitive_preferences?: string[] | null
          created_at?: string
          current_streak?: number | null
          cycle_length?: number | null
          email?: string | null
          email_cycle_alert?: boolean
          fcm_token?: string | null
          fcm_token_updated_at?: string | null
          full_name?: string | null
          goals?: string | null
          google_access_token?: string | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          id: string
          last_period_start?: string | null
          luteal_phase_length?: number | null
          notification_checkin_reminder?: boolean
          notification_cycle_alert?: boolean
          notification_focus_suggestion?: boolean
          notification_news?: boolean
          onboarding_completed?: boolean
          plan?: string
          privacy_biometric_ai?: boolean
          sleep_time?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          timezone?: string | null
          updated_at?: string
          wake_time?: string | null
        }
        Update: {
          ai_conversations_count_month?: number
          ai_conversations_reset_at?: string | null
          avatar_url?: string | null
          avg_sleep_hours?: number | null
          cognitive_preferences?: string[] | null
          created_at?: string
          current_streak?: number | null
          cycle_length?: number | null
          email?: string | null
          email_cycle_alert?: boolean
          fcm_token?: string | null
          fcm_token_updated_at?: string | null
          full_name?: string | null
          goals?: string | null
          google_access_token?: string | null
          google_calendar_id?: string | null
          google_refresh_token?: string | null
          google_token_expires_at?: string | null
          id?: string
          last_period_start?: string | null
          luteal_phase_length?: number | null
          notification_checkin_reminder?: boolean
          notification_cycle_alert?: boolean
          notification_focus_suggestion?: boolean
          notification_news?: boolean
          onboarding_completed?: boolean
          plan?: string
          privacy_biometric_ai?: boolean
          sleep_time?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          timezone?: string | null
          updated_at?: string
          wake_time?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          created_at: string
          device_id: string | null
          fcm_token: string
          id: string
          is_active: boolean
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id?: string | null
          fcm_token: string
          id?: string
          is_active?: boolean
          platform?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string | null
          fcm_token?: string
          id?: string
          is_active?: boolean
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reminder_logs: {
        Row: {
          ab_variant: string | null
          channel: string | null
          created_at: string | null
          id: string
          sent_at: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          ab_variant?: string | null
          channel?: string | null
          created_at?: string | null
          id?: string
          sent_at?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          ab_variant?: string | null
          channel?: string | null
          created_at?: string | null
          id?: string
          sent_at?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminder_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminder_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id: string
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tasks: {
        Row: {
          ai_insight: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          due_time: string | null
          energy_level: string | null
          google_calendar_event_id: string | null
          id: string
          is_ai_suggested: boolean
          is_completed: boolean
          priority: number | null
          related_objective: string | null
          subtasks: Json | null
          synced_from: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_insight?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          energy_level?: string | null
          google_calendar_event_id?: string | null
          id?: string
          is_ai_suggested?: boolean
          is_completed?: boolean
          priority?: number | null
          related_objective?: string | null
          subtasks?: Json | null
          synced_from?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_insight?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          energy_level?: string | null
          google_calendar_event_id?: string | null
          id?: string
          is_ai_suggested?: boolean
          is_completed?: boolean
          priority?: number | null
          related_objective?: string | null
          subtasks?: Json | null
          synced_from?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      test_connection: {
        Row: {
          id: number | null
        }
        Insert: {
          id?: number | null
        }
        Update: {
          id?: number | null
        }
        Relationships: []
      }
      weekly_learnings: {
        Row: {
          created_at: string
          email_sent: boolean
          fase_predominante: string | null
          id: string
          insights_gerados: Json | null
          padrao_identificado: string | null
          pico_produtividade_horario: string | null
          taxa_sucesso_por_fase: Json | null
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          email_sent?: boolean
          fase_predominante?: string | null
          id?: string
          insights_gerados?: Json | null
          padrao_identificado?: string | null
          pico_produtividade_horario?: string | null
          taxa_sucesso_por_fase?: Json | null
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          email_sent?: boolean
          fase_predominante?: string | null
          id?: string
          insights_gerados?: Json | null
          padrao_identificado?: string | null
          pico_produtividade_horario?: string | null
          taxa_sucesso_por_fase?: Json | null
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_learnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_learnings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      weekly_reports: {
        Row: {
          biggest_win: string | null
          created_at: string | null
          id: string
          key_pattern: string | null
          next_week_strategy: string | null
          report_date: string | null
          user_id: string | null
          week_score: number | null
        }
        Insert: {
          biggest_win?: string | null
          created_at?: string | null
          id?: string
          key_pattern?: string | null
          next_week_strategy?: string | null
          report_date?: string | null
          user_id?: string | null
          week_score?: number | null
        }
        Update: {
          biggest_win?: string | null
          created_at?: string | null
          id?: string
          key_pattern?: string | null
          next_week_strategy?: string | null
          report_date?: string | null
          user_id?: string | null
          week_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "weekly_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_dashboard_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      user_dashboard_stats: {
        Row: {
          ai_conversations_count_month: number | null
          last_checkin_date: string | null
          last_cycle_phase: string | null
          last_energy_score: number | null
          plan: string | null
          tasks_completed_week: number | null
          tasks_today: number | null
          user_id: string | null
        }
        Insert: {
          ai_conversations_count_month?: number | null
          last_checkin_date?: never
          last_cycle_phase?: never
          last_energy_score?: never
          plan?: string | null
          tasks_completed_week?: never
          tasks_today?: never
          user_id?: string | null
        }
        Update: {
          ai_conversations_count_month?: number | null
          last_checkin_date?: never
          last_cycle_phase?: never
          last_energy_score?: never
          plan?: string | null
          tasks_completed_week?: never
          tasks_today?: never
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_cycle_phase:
        | {
            Args: {
              p_cycle_length?: number
              p_cycle_start: string
              p_period_duration?: number
            }
            Returns: Json
          }
        | {
            Args: {
              p_cycle_length?: number
              p_last_period_start: string
              p_luteal_length?: number
              p_reference_date?: string
            }
            Returns: {
              cycle_day: number
              days_until_next_phase: number
              phase: string
            }[]
          }
      delete_all_user_data: { Args: { p_user_id: string }; Returns: boolean }
      get_active_users_weekly_data: {
        Args: { min_checkins?: number }
        Returns: {
          avg_energy: number
          avg_sleep: number
          avg_sleep_quality: number
          checkins_count: number
          user_id: string
        }[]
      }
      get_user_context: { Args: { p_user_id: string }; Returns: Json }
      get_users_near_phase_transition: {
        Args: { days_ahead?: number }
        Returns: {
          fcm_token: string
          next_phase: string
          transition_date: string
          user_id: string
        }[]
      }
      get_users_phase_changing_in_days: {
        Args: { days_ahead?: number }
        Returns: {
          current_phase: string
          days_until_change: number
          email: string
          fcm_token: string
          full_name: string
          next_phase: string
          user_id: string
        }[]
      }
      get_users_weekly_learning_data: {
        Args: { weeks_back?: number }
        Returns: {
          checkins_data: Json
          focus_sessions_data: Json
          tasks_data: Json
          user_id: string
        }[]
      }
      get_users_without_checkin_today:
        | {
            Args: never
            Returns: {
              cycle_day: number
              cycle_phase: string
              email: string
              fcm_token: string
              full_name: string
              user_id: string
            }[]
          }
        | {
            Args: { timezone_offset?: number }
            Returns: {
              cycle_phase: string
              fcm_token: string
              streak: number
              user_id: string
            }[]
          }
      get_weekly_digest_data: {
        Args: never
        Returns: {
          avg_energy: number
          dominant_phase: string
          email: string
          full_name: string
          tasks_done: Json
          user_id: string
          week_checkins: Json
        }[]
      }
      get_weekly_summary: { Args: { p_user_id: string }; Returns: Json }
      increment_ai_usage: { Args: { p_user_id: string }; Returns: boolean }
      reset_monthly_ai_counter: { Args: never; Returns: number }
      reset_monthly_ai_usage: { Args: never; Returns: number }
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
