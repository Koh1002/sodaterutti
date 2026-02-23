export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      characters: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          species_id: string;
          stage: 'baby' | 'kids' | 'young' | 'adult';
          gender: 'male' | 'female';
          hunger: number;
          happiness: number;
          stamina: number;
          cleanliness: number;
          weight: number;
          discipline: number;
          is_sick: boolean;
          age_days: number;
          generation: number;
          gene: Json;
          parent_character_id: string | null;
          care_miss_count: number;
          mini_game_total_score: number;
          mini_game_play_count: number;
          poop_count: number;
          born_at: string;
          last_fed_at: string | null;
          last_played_at: string | null;
          last_cleaned_at: string | null;
          last_disciplined_at: string | null;
          last_calculated_at: string;
          is_sleeping: boolean;
          stage_started_at: string;
          is_alive: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name?: string;
          species_id: string;
          stage?: 'baby' | 'kids' | 'young' | 'adult';
          gender: 'male' | 'female';
          hunger?: number;
          happiness?: number;
          stamina?: number;
          cleanliness?: number;
          weight?: number;
          discipline?: number;
          is_sick?: boolean;
          age_days?: number;
          generation?: number;
          gene?: Json;
          parent_character_id?: string | null;
          care_miss_count?: number;
          mini_game_total_score?: number;
          mini_game_play_count?: number;
          poop_count?: number;
          born_at?: string;
          last_fed_at?: string | null;
          last_played_at?: string | null;
          last_cleaned_at?: string | null;
          last_disciplined_at?: string | null;
          last_calculated_at?: string;
          is_sleeping?: boolean;
          stage_started_at?: string;
          is_alive?: boolean;
        };
        Update: {
          name?: string;
          species_id?: string;
          stage?: 'baby' | 'kids' | 'young' | 'adult';
          hunger?: number;
          happiness?: number;
          stamina?: number;
          cleanliness?: number;
          weight?: number;
          discipline?: number;
          is_sick?: boolean;
          age_days?: number;
          generation?: number;
          gene?: Json;
          care_miss_count?: number;
          mini_game_total_score?: number;
          mini_game_play_count?: number;
          poop_count?: number;
          last_fed_at?: string | null;
          last_played_at?: string | null;
          last_cleaned_at?: string | null;
          last_disciplined_at?: string | null;
          last_calculated_at?: string;
          is_sleeping?: boolean;
          stage_started_at?: string;
          is_alive?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "characters_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "characters_species_id_fkey";
            columns: ["species_id"];
            isOneToOne: false;
            referencedRelation: "species";
            referencedColumns: ["id"];
          }
        ];
      };
      character_history: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          species_id: string;
          final_stage: string;
          gender: 'male' | 'female';
          generation: number;
          gene: Json;
          parent_character_id: string | null;
          partner_species_id: string | null;
          cause_of_departure: 'marriage' | 'death_age' | 'death_sick';
          age_at_departure: number;
          born_at: string;
          departed_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          species_id: string;
          final_stage: string;
          gender: 'male' | 'female';
          generation?: number;
          gene?: Json;
          parent_character_id?: string | null;
          partner_species_id?: string | null;
          cause_of_departure: 'marriage' | 'death_age' | 'death_sick';
          age_at_departure?: number;
          born_at: string;
          departed_at?: string;
        };
        Update: {
          partner_species_id?: string | null;
          cause_of_departure?: 'marriage' | 'death_age' | 'death_sick';
          departed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "character_history_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "character_history_species_id_fkey";
            columns: ["species_id"];
            isOneToOne: false;
            referencedRelation: "species";
            referencedColumns: ["id"];
          }
        ];
      };
      species: {
        Row: {
          id: string;
          name: string;
          stage: 'baby' | 'kids' | 'young' | 'adult';
          description: string;
          image_key: string;
          base_weight: number;
          rarity: 'common' | 'rare' | 'legendary';
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          stage: 'baby' | 'kids' | 'young' | 'adult';
          description?: string;
          image_key: string;
          base_weight?: number;
          rarity?: 'common' | 'rare' | 'legendary';
        };
        Update: {
          name?: string;
          stage?: 'baby' | 'kids' | 'young' | 'adult';
          description?: string;
          image_key?: string;
          base_weight?: number;
          rarity?: 'common' | 'rare' | 'legendary';
        };
        Relationships: [];
      };
      evolution_rules: {
        Row: {
          id: string;
          from_species_id: string;
          to_species_id: string;
          condition: Json;
          priority: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_species_id: string;
          to_species_id: string;
          condition?: Json;
          priority?: number;
        };
        Update: {
          condition?: Json;
          priority?: number;
        };
        Relationships: [
          {
            foreignKeyName: "evolution_rules_from_species_id_fkey";
            columns: ["from_species_id"];
            isOneToOne: false;
            referencedRelation: "species";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "evolution_rules_to_species_id_fkey";
            columns: ["to_species_id"];
            isOneToOne: false;
            referencedRelation: "species";
            referencedColumns: ["id"];
          }
        ];
      };
      marriage_candidates: {
        Row: {
          id: string;
          name: string;
          species_id: string;
          personality: Json;
          gene: Json;
          image_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          species_id: string;
          personality?: Json;
          gene?: Json;
          image_key: string;
        };
        Update: {
          personality?: Json;
          gene?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "marriage_candidates_species_id_fkey";
            columns: ["species_id"];
            isOneToOne: false;
            referencedRelation: "species";
            referencedColumns: ["id"];
          }
        ];
      };
      game_settings: {
        Row: {
          id: string;
          user_id: string;
          sound_enabled: boolean;
          notification_enabled: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          sound_enabled?: boolean;
          notification_enabled?: boolean;
        };
        Update: {
          sound_enabled?: boolean;
          notification_enabled?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "game_settings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
