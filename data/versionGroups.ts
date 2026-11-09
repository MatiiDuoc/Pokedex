export interface VersionGroupInfo {
  versionGroup: string;
  pokedexLabel: string;
}

/**
 * Relación entre el slug de la guía y el version-group de PokeAPI. PokeAPI
 * expone el Pokédex regional oficial de cada juego, incluyendo DLC cuando
 * corresponde. Esto permite mostrar listas exactas en lugar de rangos
 * nacionales aproximados.
 */
export const versionGroupBySlug: Record<string, VersionGroupInfo> = {
  'red-blue-green': { versionGroup: 'red-blue', pokedexLabel: 'Pokédex de Kanto' },
  yellow: { versionGroup: 'yellow', pokedexLabel: 'Pokédex de Kanto' },
  'gold-silver': { versionGroup: 'gold-silver', pokedexLabel: 'Pokédex de Johto' },
  crystal: { versionGroup: 'crystal', pokedexLabel: 'Pokédex de Johto' },
  'ruby-sapphire': { versionGroup: 'ruby-sapphire', pokedexLabel: 'Pokédex de Hoenn' },
  emerald: { versionGroup: 'emerald', pokedexLabel: 'Pokédex de Hoenn' },
  'firered-leafgreen': {
    versionGroup: 'firered-leafgreen',
    pokedexLabel: 'Pokédex de Kanto',
  },
  'diamond-pearl': {
    versionGroup: 'diamond-pearl',
    pokedexLabel: 'Pokédex de Sinnoh',
  },
  platinum: { versionGroup: 'platinum', pokedexLabel: 'Pokédex de Sinnoh' },
  'heartgold-soulsilver': {
    versionGroup: 'heartgold-soulsilver',
    pokedexLabel: 'Pokédex de Johto',
  },
  'black-white': { versionGroup: 'black-white', pokedexLabel: 'Pokédex de Unova' },
  'black2-white2': {
    versionGroup: 'black-2-white-2',
    pokedexLabel: 'Pokédex de Unova (B2W2)',
  },
  xy: { versionGroup: 'x-y', pokedexLabel: 'Pokédex de Kalos' },
  'omega-ruby-alpha-sapphire': {
    versionGroup: 'omega-ruby-alpha-sapphire',
    pokedexLabel: 'Pokédex de Hoenn',
  },
  'sun-moon': { versionGroup: 'sun-moon', pokedexLabel: 'Pokédex de Alola' },
  'ultra-sun-ultra-moon': {
    versionGroup: 'ultra-sun-ultra-moon',
    pokedexLabel: 'Pokédex de Alola (USUM)',
  },
  'lets-go-pikachu-eevee': {
    versionGroup: 'lets-go-pikachu-lets-go-eevee',
    pokedexLabel: 'Pokédex de Kanto',
  },
  'sword-shield': {
    versionGroup: 'sword-shield',
    pokedexLabel: 'Pokédex de Galar + DLC',
  },
  'brilliant-diamond-shining-pearl': {
    versionGroup: 'brilliant-diamond-shining-pearl',
    pokedexLabel: 'Pokédex de Sinnoh',
  },
  'legends-arceus': {
    versionGroup: 'legends-arceus',
    pokedexLabel: 'Pokédex de Hisui',
  },
  'scarlet-violet': {
    versionGroup: 'scarlet-violet',
    pokedexLabel: 'Pokédex de Paldea + DLC',
  },
  'legends-z-a': {
    versionGroup: 'legends-za',
    pokedexLabel: 'Pokédex de Lumiose + Hiperspacial',
  },
};

export function getVersionGroupInfo(slug: string): VersionGroupInfo | null {
  return versionGroupBySlug[slug] ?? null;
}
