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
      bills: {
        Row: {
          id: string
          vendor_id: string
          fund_id: string
          expense_account_id: string
          liability_account_id: string
          journal_entry_id: string | null
          bill_number: string | null
          description: string
          invoice_date: string
          due_date: string
          amount: number
          amount_paid: number
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          fund_id: string
          expense_account_id: string
          liability_account_id: string
          journal_entry_id?: string | null
          bill_number?: string | null
          description: string
          invoice_date: string
          due_date: string
          amount: number
          amount_paid?: number
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          fund_id?: string
          expense_account_id?: string
          liability_account_id?: string
          journal_entry_id?: string | null
          bill_number?: string | null
          description?: string
          invoice_date?: string
          due_date?: string
          amount?: number
          amount_paid?: number
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_expense_account_id_fkey"
            columns: ["expense_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_liability_account_id_fkey"
            columns: ["liability_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      bill_payments: {
        Row: {
          id: string
          bill_id: string
          journal_entry_id: string
          payment_date: string
          amount: number
          payment_method: string | null
          reference_number: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          bill_id: string
          journal_entry_id: string
          payment_date: string
          amount: number
          payment_method?: string | null
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          bill_id?: string
          journal_entry_id?: string
          payment_date?: string
          amount?: number
          payment_method?: string | null
          reference_number?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_payments_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bill_payments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_number: number
          account_type: Database["public"]["Enums"]["account_type"]
          created_at: string
          default_liability_account_id: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          account_number: number
          account_type: Database["public"]["Enums"]["account_type"]
          created_at?: string
          default_liability_account_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          account_number?: number
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          default_liability_account_id?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chart_of_accounts_default_liability_account_id_fkey"
            columns: ["default_liability_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      funds: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_restricted: boolean
          name: string
          net_asset_account_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_restricted?: boolean
          name: string
          net_asset_account_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_restricted?: boolean
          name?: string
          net_asset_account_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funds_net_asset_account_id_fkey"
            columns: ["net_asset_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          description: string
          donor_id: string | null
          entry_date: string
          id: string
          is_in_kind: boolean
          is_voided: boolean
          reference_number: string | null
          updated_at: string
          voided_at: string | null
          voided_reason: string | null
        }
        Insert: {
          created_at?: string
          description: string
          donor_id?: string | null
          entry_date: string
          id?: string
          is_in_kind?: boolean
          is_voided?: boolean
          reference_number?: string | null
          updated_at?: string
          voided_at?: string | null
          voided_reason?: string | null
        }
        Update: {
          created_at?: string
          description?: string
          donor_id?: string | null
          entry_date?: string
          id?: string
          is_in_kind?: boolean
          is_voided?: boolean
          reference_number?: string | null
          updated_at?: string
          voided_at?: string | null
          voided_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "donors"
            referencedColumns: ["id"]
          },
        ]
      }
      ledger_lines: {
        Row: {
          account_id: string
          created_at: string
          credit: number
          debit: number
          fund_id: string
          id: string
          journal_entry_id: string
          memo: string | null
          updated_at: string
          is_cleared: boolean
          cleared_at: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          credit?: number
          debit?: number
          fund_id: string
          id?: string
          journal_entry_id: string
          memo?: string | null
          updated_at?: string
          is_cleared?: boolean
          cleared_at?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          credit?: number
          debit?: number
          fund_id?: string
          id?: string
          journal_entry_id?: string
          memo?: string | null
          updated_at?: string
          is_cleared?: boolean
          cleared_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_lines_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      recurring_templates: {
        Row: {
          id: string
          template_name: string
          description: string
          frequency: Database["public"]["Enums"]["recurring_frequency"]
          start_date: string
          end_date: string | null
          last_run_date: string | null
          next_run_date: string
          fund_id: string
          amount: number
          reference_number_prefix: string | null
          is_active: boolean
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          template_name: string
          description: string
          frequency: Database["public"]["Enums"]["recurring_frequency"]
          start_date: string
          end_date?: string | null
          last_run_date?: string | null
          next_run_date: string
          fund_id: string
          amount: number
          reference_number_prefix?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          template_name?: string
          description?: string
          frequency?: Database["public"]["Enums"]["recurring_frequency"]
          start_date?: string
          end_date?: string | null
          last_run_date?: string | null
          next_run_date?: string
          fund_id?: string
          amount?: number
          reference_number_prefix?: string | null
          is_active?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_templates_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_template_lines: {
        Row: {
          id: string
          template_id: string
          account_id: string
          debit: number
          credit: number
          memo: string | null
          line_order: number
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          account_id: string
          debit?: number
          credit?: number
          memo?: string | null
          line_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          account_id?: string
          debit?: number
          credit?: number
          memo?: string | null
          line_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_template_lines_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "recurring_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_template_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_history: {
        Row: {
          id: string
          template_id: string
          journal_entry_id: string
          executed_date: string
          amount: number
          status: string
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          template_id: string
          journal_entry_id: string
          executed_date: string
          amount: number
          status?: string
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string
          journal_entry_id?: string
          executed_date?: string
          amount?: number
          status?: string
          error_message?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_history_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "recurring_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_history_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliations: {
        Row: {
          id: string
          account_id: string
          statement_date: string
          statement_balance: number
          reconciled_balance: number
          status: string
          notes: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          account_id: string
          statement_date: string
          statement_balance: number
          reconciled_balance?: number
          status?: string
          notes?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          account_id?: string
          statement_date?: string
          statement_balance?: number
          reconciled_balance?: number
          status?: string
          notes?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: 'admin' | 'bookkeeper' | 'viewer'
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role: 'admin' | 'bookkeeper' | 'viewer'
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'admin' | 'bookkeeper' | 'viewer'
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Relationships: []
      }
      vendors: {
        Row: {
          id: string
          name: string
          contact_name: string | null
          email: string | null
          phone: string | null
          address: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          contact_name?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      journal_entry_balances: {
        Row: {
          balance: number | null
          is_balanced: boolean | null
          journal_entry_id: string | null
          total_credits: number | null
          total_debits: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_type: "Asset" | "Liability" | "Equity" | "Income" | "Expense"
      recurring_frequency: "weekly" | "biweekly" | "monthly" | "quarterly" | "semiannually" | "yearly"
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
      account_type: ["Asset", "Liability", "Equity", "Income", "Expense"],
      recurring_frequency: ["weekly", "biweekly", "monthly", "quarterly", "semiannually", "yearly"],
    },
  },
} as const
