export interface PokemonFilterStats {
  hp: number;
  attack: number;
  defense: number;
  'special-attack': number;
  'special-defense': number;
  speed: number;
}

export interface PokemonFilterEntry {
  id: number;
  types: string[];
  stats: PokemonFilterStats;
  abilities: string[];
}
