export interface PokemonType {
  name: string;
  url: string;
}

export interface PokemonTypeSlot {
  slot: number;
  type: PokemonType;
}

export interface PokemonSpritesOther {
  'official-artwork'?: { front_default?: string | null };
  'dream_world'?: { front_default?: string | null };
}

export interface PokemonSprites {
  front_default?: string | null;
  front_shiny?: string | null;
  back_default?: string | null;
  back_shiny?: string | null;
  other?: PokemonSpritesOther;
}

export interface PokemonStat {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: PokemonTypeSlot[];
  sprites: PokemonSprites;
  stats: PokemonStat[];
  base_experience?: number;
}

export interface PokemonListItem {
  name: string;
  url: string;
}

export interface PokemonTypeResponse {
  pokemon: Array<{
    pokemon: PokemonListItem;
    slot: number;
  }>;
}
