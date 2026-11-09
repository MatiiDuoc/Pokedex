export type LegendaryCategory = 'legendary' | 'mythical' | 'ultra-beast' | 'none';

export interface PokemonStat {
  name: string;
  value: number;
}

export interface PokemonBasic {
  name: string;
  url: string;
  id: number;
  height: number;
  weight: number;
  types: string[];
  stats: PokemonStat[];
  spriteUrl: string;
  shinySpriteUrl: string;
  shinyArtworkUrl: string;
  model3dUrl: string;
  generation: number;
  legendaryCategory: LegendaryCategory;
}

export interface PaginatedResponse {
  pokemon: PokemonBasic[];
  total: number;
  hasMore: boolean;
}

/**
 * Entrada ligera del índice nacional. Se obtiene con una sola llamada a
 * PokeAPI y se usa para listados/checklists sin pedir el detalle de cada Pokémon.
 */
export interface PokemonIndexEntry {
  id: number;
  name: string;
  spriteUrl: string;
  artworkUrl: string;
  shinySpriteUrl: string;
  shinyArtworkUrl: string;
  legendaryCategory: LegendaryCategory;
}
