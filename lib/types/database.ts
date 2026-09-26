export type UserRole = "admin" | "writer" | "viewer";
export type UserStatus = "active" | "inactive";
export type ItemCategory = "생산품" | "소스류";

// 주의: 아래 타입들은 반드시 `type`(object literal alias)로 선언해야 한다.
// `interface`는 TypeScript가 열린(확장 가능한) 타입으로 취급해 Supabase의
// `Record<string, unknown>` 기반 GenericSchema 제약을 만족하지 못하고,
// 그 결과 supabase-js의 모든 쿼리 결과 타입이 `never`로 무너진다.
export type Profile = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created_at: string;
};

export type Item = {
  id: string;
  name: string;
  category: ItemCategory;
  spec_weight_g: number;
  is_active: boolean;
  min_stock_qty: number;
  warning_stock_qty: number;
  created_at: string;
  created_by: string | null;
};

export type DailyStockEntry = {
  id: string;
  item_id: string;
  entry_date: string;
  produced_qty: number;
  shipped_qty: number;
  spec_weight_g: number;
  prev_stock_qty: number;
  stock_qty: number;
  produced_amount_g: number;
  shipped_amount_g: number;
  stock_amount_g: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type MonthlySummary = {
  id: string;
  item_id: string;
  year_month: string;
  prev_month_stock_qty: number;
  month_end_stock_qty: number;
  month_end_stock_amount_g: number;
  updated_at: string;
};

export type CurrentItemStock = {
  item_id: string;
  entry_date: string;
  stock_qty: number;
  stock_amount_g: number;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; name: string; email: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      items: {
        Row: Item;
        Insert: Partial<Item> & {
          name: string;
          category: ItemCategory;
          spec_weight_g: number;
        };
        Update: Partial<Item>;
        Relationships: [];
      };
      daily_stock_entries: {
        Row: DailyStockEntry;
        Insert: Partial<DailyStockEntry> & {
          item_id: string;
          entry_date: string;
        };
        Update: Partial<DailyStockEntry>;
        Relationships: [];
      };
      monthly_summaries: {
        Row: MonthlySummary;
        Insert: Partial<MonthlySummary> & { item_id: string; year_month: string };
        Update: Partial<MonthlySummary>;
        Relationships: [];
      };
    };
    Views: {
      current_item_stock: {
        Row: CurrentItemStock;
        Relationships: [];
      };
    };
    Functions: {
      upsert_daily_stock_entry: {
        Args: {
          p_item_id: string;
          p_entry_date: string;
          p_produced_qty: number;
          p_shipped_qty: number;
          p_actor: string;
        };
        Returns: undefined;
      };
    };
  };
};
