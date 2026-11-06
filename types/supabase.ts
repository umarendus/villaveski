// types/supabase.ts
export type WorkshopStatus = "draft" | "published" | "closed";
export type RegistrationStatus = "pending" | "confirmed" | "cancelled" | "waitlist";

export type Workshop = {
  id: string;
  title: string;
  description: string;
  starts_at: string;
  duration_text: string;
  location: string;
  price_eur: number;
  payment_note: string;
  includes: string;
  extras: string;
  capacity: number;
  reserved_offline: number;
  image_url: string | null;
  email_image_url: string | null; // lai JPEG e-kirjade jaoks
  status: WorkshopStatus;
  announced_at: string | null;
  announced_count: number;
  created_at: string;
  updated_at: string;
};

export type WorkshopPublic = Omit<
  Workshop,
  "reserved_offline" | "created_at" | "updated_at" | "announced_at" | "announced_count" | "email_image_url"
> & {
  seats_left: number;
  pending_people: number; // broneeritud, kuid kinnitamata kohad
};

export type ExtraParticipant = { name: string; email: string; phone: string };

export type WorkshopRegistration = {
  id: string;
  workshop_id: string | null;
  name: string;
  email: string;
  phone: string;
  participants: number;
  extra_participants: ExtraParticipant[];
  wants_materials: boolean;
  message: string;
  status: RegistrationStatus;
  ip_hash: string | null;
  created_at: string;
  confirmed_at: string | null;
};

export type WorkshopGalleryItem = {
  id: string;
  workshop_id: string | null;
  image_url: string;
  caption: string;
  created_at: string;
};

export type EmailTemplateRow = {
  key: string;
  subject: string;
  preheader: string;
  heading: string;
  intro: string;
  button_label: string;
  outro: string;
  updated_at: string;
  updated_by: string | null;
};

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
      workshops: {
        Row: Workshop;
        Insert: Partial<Omit<Workshop, "title" | "starts_at" | "capacity">> &
          Pick<Workshop, "title" | "starts_at" | "capacity">;
        Update: Partial<Workshop>;
        Relationships: [];
      };
      workshop_registrations: {
        Row: WorkshopRegistration;
        Insert: Partial<Omit<WorkshopRegistration, "name" | "email">> &
          Pick<WorkshopRegistration, "name" | "email">;
        Update: Partial<WorkshopRegistration>;
        Relationships: [];
      };
      workshop_gallery: {
        Row: WorkshopGalleryItem;
        Insert: Partial<Omit<WorkshopGalleryItem, "image_url">> & Pick<WorkshopGalleryItem, "image_url">;
        Update: Partial<WorkshopGalleryItem>;
        Relationships: [];
      };
      email_templates: {
        Row: EmailTemplateRow;
        Insert: Omit<EmailTemplateRow, "updated_at" | "updated_by"> & Partial<Pick<EmailTemplateRow, "updated_at" | "updated_by">>;
        Update: Partial<EmailTemplateRow>;
        Relationships: [];
      };
      workshop_admins: {
        Row: { email: string };
        Insert: { email: string };
        Update: { email?: string };
        Relationships: [];
      };
    };
    Views: {
      workshops_public: {
        Row: WorkshopPublic;
        Relationships: [];
      };
    };
    Functions: {
      register_for_workshop: {
        Args: {
          p_workshop_id: string | null;
          p_name: string;
          p_email: string;
          p_phone: string;
          p_participants: number;
          p_wants_materials: boolean;
          p_message: string;
          p_ip_hash: string;
          p_extra_participants?: ExtraParticipant[];
        };
        Returns: { registration_id: string; reg_status: RegistrationStatus; seats_left: number }[];
      };
      admin_change_registration: {
        Args: { p_id: string; p_status: string; p_move?: boolean; p_workshop_id?: string | null; p_force?: boolean };
        Returns: WorkshopRegistration;
      };
      admin_delete_workshop: {
        Args: { p_workshop_id: string };
        Returns: number;
      };
      is_workshop_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      workshop_seats_taken: {
        Args: { w_id: string };
        Returns: number;
      };
    };
  };
};
