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
      household_members: {
        Row: {
          household_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          household_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          household_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      household_settings: {
        Row: {
          home_postcode: string | null
          home_store_id: string | null
          household_id: string
          preferred_chain: string | null
          updated_at: string
        }
        Insert: {
          home_postcode?: string | null
          home_store_id?: string | null
          household_id: string
          preferred_chain?: string | null
          updated_at?: string
        }
        Update: {
          home_postcode?: string | null
          home_store_id?: string | null
          household_id?: string
          preferred_chain?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_settings_home_store_id_fkey"
            columns: ["home_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "household_settings_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: true
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          created_at: string
          id: string
          invite_code: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          invite_code?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          invite_code?: string | null
          name?: string
        }
        Relationships: []
      }
      list_items: {
        Row: {
          added_by: string | null
          category: string
          checked: boolean
          checked_at: string | null
          checked_by: string | null
          created_at: string
          estimated_price: number | null
          id: string
          list_id: string
          name: string
          product_id: string | null
          quantity: number
          sort_order: number
          unit: string | null
        }
        Insert: {
          added_by?: string | null
          category?: string
          checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          estimated_price?: number | null
          id?: string
          list_id: string
          name: string
          product_id?: string | null
          quantity?: number
          sort_order?: number
          unit?: string | null
        }
        Update: {
          added_by?: string | null
          category?: string
          checked?: boolean
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          estimated_price?: number | null
          id?: string
          list_id?: string
          name?: string
          product_id?: string | null
          quantity?: number
          sort_order?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      market_prices: {
        Row: {
          fetched_at: string
          id: string
          is_special: boolean
          price: number
          product_name: string
          store_chain: string
          store_id: string | null
          store_name: string
          unit: string | null
          unit_price: number | null
          unit_type: string | null
          was_price: number | null
        }
        Insert: {
          fetched_at?: string
          id?: string
          is_special?: boolean
          price: number
          product_name: string
          store_chain: string
          store_id?: string | null
          store_name: string
          unit?: string | null
          unit_price?: number | null
          unit_type?: string | null
          was_price?: number | null
        }
        Update: {
          fetched_at?: string
          id?: string
          is_special?: boolean
          price?: number
          product_name?: string
          store_chain?: string
          store_id?: string | null
          store_name?: string
          unit?: string | null
          unit_price?: number | null
          unit_type?: string | null
          was_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_prices_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          canonical_name: string
          created_at: string
          default_category: string
          default_unit: string | null
          household_id: string
          id: string
          name: string
        }
        Insert: {
          barcode?: string | null
          canonical_name: string
          created_at?: string
          default_category?: string
          default_unit?: string | null
          household_id: string
          id?: string
          name: string
        }
        Update: {
          barcode?: string | null
          canonical_name?: string
          created_at?: string
          default_category?: string
          default_unit?: string | null
          household_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_history: {
        Row: {
          household_id: string
          id: string
          price: number | null
          product_id: string | null
          product_name: string
          purchased_at: string
          quantity: number | null
          receipt_id: string | null
          store_id: string | null
          unit: string | null
        }
        Insert: {
          household_id: string
          id?: string
          price?: number | null
          product_id?: string | null
          product_name: string
          purchased_at?: string
          quantity?: number | null
          receipt_id?: string | null
          store_id?: string | null
          unit?: string | null
        }
        Update: {
          household_id?: string
          id?: string
          price?: number | null
          product_id?: string | null
          product_name?: string
          purchased_at?: string
          quantity?: number | null
          receipt_id?: string | null
          store_id?: string | null
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_history_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_history_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_history_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          created_at: string
          household_id: string
          id: string
          image_url: string | null
          parsed_json: Json | null
          purchase_date: string | null
          raw_text: string | null
          store_chain: string | null
          store_id: string | null
          store_name: string | null
          total: number | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          household_id: string
          id?: string
          image_url?: string | null
          parsed_json?: Json | null
          purchase_date?: string | null
          raw_text?: string | null
          store_chain?: string | null
          store_id?: string | null
          store_name?: string | null
          total?: number | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          household_id?: string
          id?: string
          image_url?: string | null
          parsed_json?: Json | null
          purchase_date?: string | null
          raw_text?: string | null
          store_chain?: string | null
          store_id?: string | null
          store_name?: string | null
          total?: number | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "receipts_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          completed_at: string | null
          created_at: string
          household_id: string
          id: string
          name: string
          store_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          household_id: string
          id?: string
          name?: string
          store_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          household_id?: string
          id?: string
          name?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_lists_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          chain: string
          created_at: string
          external_id: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          postcode: string
          state: string
          suburb: string
        }
        Insert: {
          address?: string | null
          chain: string
          created_at?: string
          external_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          postcode: string
          state: string
          suburb: string
        }
        Update: {
          address?: string | null
          chain?: string
          created_at?: string
          external_id?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          postcode?: string
          state?: string
          suburb?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_household_id: string | null
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_household_id?: string | null
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_household_id?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_default_household_id_fkey"
            columns: ["default_household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_household_member: { Args: { hid: string }; Returns: boolean }
      is_household_owner: { Args: { hid: string }; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
