export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      households: {
        Row: {
          id: string
          name: string
          invite_code: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string | null
          created_at?: string
        }
      }
      household_members: {
        Row: {
          id: string
          household_id: string
          user_id: string
          role: 'owner' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          household_id: string
          user_id: string
          role?: 'owner' | 'member'
          joined_at?: string
        }
        Update: {
          role?: 'owner' | 'member'
        }
      }
      household_settings: {
        Row: {
          household_id: string
          home_store_id: string | null
          home_postcode: string | null
          preferred_chain: string | null
          updated_at: string
        }
        Insert: {
          household_id: string
          home_store_id?: string | null
          home_postcode?: string | null
          preferred_chain?: string | null
          updated_at?: string
        }
        Update: {
          home_store_id?: string | null
          home_postcode?: string | null
          preferred_chain?: string | null
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          household_id: string
          name: string
          canonical_name: string
          barcode: string | null
          default_category: string
          default_unit: string | null
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          name: string
          canonical_name: string
          barcode?: string | null
          default_category?: string
          default_unit?: string | null
          created_at?: string
        }
        Update: {
          name?: string
          canonical_name?: string
          barcode?: string | null
          default_category?: string
          default_unit?: string | null
        }
      }
      shopping_lists: {
        Row: {
          id: string
          household_id: string
          name: string
          store_id: string | null
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          household_id: string
          name?: string
          store_id?: string | null
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          name?: string
          store_id?: string | null
          completed_at?: string | null
        }
      }
      list_items: {
        Row: {
          id: string
          list_id: string
          product_id: string | null
          name: string
          category: string
          quantity: number
          unit: string | null
          checked: boolean
          sort_order: number
          added_by: string | null
          checked_by: string | null
          checked_at: string | null
          estimated_price: number | null
          created_at: string
        }
        Insert: {
          id?: string
          list_id: string
          product_id?: string | null
          name: string
          category?: string
          quantity?: number
          unit?: string | null
          checked?: boolean
          sort_order?: number
          added_by?: string | null
          checked_by?: string | null
          checked_at?: string | null
          estimated_price?: number | null
          created_at?: string
        }
        Update: {
          product_id?: string | null
          name?: string
          category?: string
          quantity?: number
          unit?: string | null
          checked?: boolean
          sort_order?: number
          checked_by?: string | null
          checked_at?: string | null
          estimated_price?: number | null
        }
      }
      receipts: {
        Row: {
          id: string
          household_id: string
          store_name: string | null
          store_id: string | null
          store_chain: string | null
          total: number | null
          purchase_date: string | null
          raw_text: string | null
          parsed_json: Json | null
          image_url: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          household_id: string
          store_name?: string | null
          store_id?: string | null
          store_chain?: string | null
          total?: number | null
          purchase_date?: string | null
          raw_text?: string | null
          parsed_json?: Json | null
          image_url?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          store_name?: string | null
          store_id?: string | null
          store_chain?: string | null
          total?: number | null
          purchase_date?: string | null
          raw_text?: string | null
          parsed_json?: Json | null
          image_url?: string | null
        }
      }
      purchase_history: {
        Row: {
          id: string
          household_id: string
          product_id: string | null
          store_id: string | null
          receipt_id: string | null
          product_name: string
          price: number | null
          quantity: number | null
          unit: string | null
          purchased_at: string
        }
        Insert: {
          id?: string
          household_id: string
          product_id?: string | null
          store_id?: string | null
          receipt_id?: string | null
          product_name: string
          price?: number | null
          quantity?: number | null
          unit?: string | null
          purchased_at?: string
        }
        Update: {
          price?: number | null
          quantity?: number | null
        }
      }
      market_prices: {
        Row: {
          id: string
          product_name: string
          store_name: string
          store_chain: string
          store_id: string | null
          price: number
          unit: string | null
          unit_price: number | null
          unit_type: string | null
          is_special: boolean
          was_price: number | null
          fetched_at: string
        }
        Insert: {
          id?: string
          product_name: string
          store_name: string
          store_chain: string
          store_id?: string | null
          price: number
          unit?: string | null
          unit_price?: number | null
          unit_type?: string | null
          is_special?: boolean
          was_price?: number | null
          fetched_at?: string
        }
        Update: {
          price?: number
          unit_price?: number | null
          is_special?: boolean
          was_price?: number | null
          fetched_at?: string
        }
      }
      stores: {
        Row: {
          id: string
          name: string
          chain: 'woolworths' | 'coles' | 'aldi' | 'iga' | 'other'
          postcode: string
          suburb: string
          state: string
          external_id: string | null
          address: string | null
          latitude: number | null
          longitude: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          chain: 'woolworths' | 'coles' | 'aldi' | 'iga' | 'other'
          postcode: string
          suburb: string
          state: string
          external_id?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string
        }
        Update: {
          name?: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
        }
      }
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          default_household_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          default_household_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string | null
          avatar_url?: string | null
          default_household_id?: string | null
          updated_at?: string
        }
      }
    }
    Functions: {
      is_household_member: {
        Args: { hid: string }
        Returns: boolean
      }
      is_household_owner: {
        Args: { hid: string }
        Returns: boolean
      }
    }
  }
}

// Convenience row types
export type Household = Database['public']['Tables']['households']['Row']
export type HouseholdMember = Database['public']['Tables']['household_members']['Row']
export type HouseholdSettings = Database['public']['Tables']['household_settings']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type ShoppingList = Database['public']['Tables']['shopping_lists']['Row']
export type ListItem = Database['public']['Tables']['list_items']['Row']
export type Receipt = Database['public']['Tables']['receipts']['Row']
export type PurchaseHistory = Database['public']['Tables']['purchase_history']['Row']
export type MarketPrice = Database['public']['Tables']['market_prices']['Row']
export type Store = Database['public']['Tables']['stores']['Row']
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
