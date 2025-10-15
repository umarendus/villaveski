// types/supabase.ts
export type Database = {
  public: {
    Tables: {
      photos: {
        Row: {
          id: number;
          title: string;
          image_url: string;
          created_at: string | null;
        };
        Insert: {
          id?: number;
          title: string;
          image_url: string;
          created_at?: string | null;
        };
        Update: {
          id?: number;
          title?: string;
          image_url?: string;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
  };
};
