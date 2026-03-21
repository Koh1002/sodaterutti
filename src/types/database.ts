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
          last_walked_at: string | null;
          mini_game_cooldowns: Json;
          walk_count: number;
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
          last_walked_at?: string | null;
          mini_game_cooldowns?: Json;
          walk_count?: number;
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
          last_walked_at?: string | null;
          mini_game_cooldowns?: Json;
          walk_count?: number;
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
          },
          {
            foreignKeyName: "characters_parent_character_id_fkey";
            columns: ["parent_character_id"];
            isOneToOne: false;
            referencedRelation: "character_history";
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
          cause_of_departure: 'marriage' | 'death_age' | 'death_sick' | 'evolution';
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
          cause_of_departure: 'marriage' | 'death_age' | 'death_sick' | 'evolution';
          age_at_departure?: number;
          born_at: string;
          departed_at?: string;
        };
        Update: {
          partner_species_id?: string | null;
          cause_of_departure?: 'marriage' | 'death_age' | 'death_sick' | 'evolution';
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
          },
          {
            foreignKeyName: "character_history_parent_character_id_fkey";
            columns: ["parent_character_id"];
            isOneToOne: false;
            referencedRelation: "character_history";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "character_history_partner_species_id_fkey";
            columns: ["partner_species_id"];
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
      daily_missions: {
        Row: {
          id: string;
          user_id: string;
          mission_type: string;
          mission_label: string;
          target_count: number;
          current_count: number;
          is_completed: boolean;
          reward_type: string;
          reward_amount: number;
          mission_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          mission_type: string;
          mission_label: string;
          target_count?: number;
          current_count?: number;
          is_completed?: boolean;
          reward_type?: string;
          reward_amount?: number;
          mission_date?: string;
        };
        Update: {
          current_count?: number;
          is_completed?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "daily_missions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      achievements: {
        Row: {
          id: string;
          key: string;
          name: string;
          description: string;
          icon: string;
          category: string;
          condition_type: string;
          condition_value: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          key: string;
          name: string;
          description: string;
          icon?: string;
          category?: string;
          condition_type: string;
          condition_value?: number;
        };
        Update: {
          name?: string;
          description?: string;
          icon?: string;
        };
        Relationships: [];
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: {
          unlocked_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_achievements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_achievements_achievement_id_fkey";
            columns: ["achievement_id"];
            isOneToOne: false;
            referencedRelation: "achievements";
            referencedColumns: ["id"];
          }
        ];
      };
      battle_challenges: {
        Row: {
          id: string;
          challenger_id: string;
          opponent_id: string;
          challenger_snapshot: Json;
          opponent_snapshot: Json | null;
          status: 'pending' | 'accepted' | 'resolved' | 'declined' | 'expired';
          winner_id: string | null;
          battle_log: Json | null;
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          challenger_id: string;
          opponent_id: string;
          challenger_snapshot: Json;
          status?: string;
        };
        Update: {
          status?: string;
          opponent_snapshot?: Json;
          winner_id?: string;
          battle_log?: Json;
          resolved_at?: string;
        };
        Relationships: [];
      };
      coop_rooms: {
        Row: {
          id: string;
          host_id: string;
          guest_id: string | null;
          room_code: string;
          status: 'waiting' | 'playing' | 'finished';
          game_type: string;
          host_score: number;
          guest_score: number;
          target_score: number;
          started_at: string | null;
          finished_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          host_id: string;
          room_code: string;
          game_type?: string;
          target_score?: number;
        };
        Update: {
          guest_id?: string;
          status?: string;
          host_score?: number;
          guest_score?: number;
          started_at?: string;
          finished_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      search_user_by_friend_code: {
        Args: { fc: string };
        Returns: { uid: string; uname: string }[];
      };
      get_friend_battle_character: {
        Args: { friend_user_id: string };
        Returns: {
          cid: string;
          cname: string;
          cspecies_id: string;
          cdiscipline: number;
          ccare_miss_count: number;
          cweight: number;
          cmini_game_total_score: number;
          cmini_game_play_count: number;
          chunger: number;
          chappiness: number;
          cgene: Json;
        }[];
      };
      send_battle_challenge: {
        Args: { opponent_friend_code: string; snapshot: Json };
        Returns: string;
      };
      get_pending_challenges: {
        Args: Record<string, never>;
        Returns: {
          challenge_id: string;
          challenger_user_id: string;
          challenger_name: string;
          challenger_snapshot: Json;
          challenge_created_at: string;
        }[];
      };
      join_coop_room: {
        Args: { code: string };
        Returns: {
          room_id: string;
          room_host_id: string;
          room_status: string;
          room_game_type: string;
          room_target_score: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
