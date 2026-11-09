interface GymVisual {
  id: number;
  name: string;
}

const GYM_TYPE_VISUALS: Record<string, GymVisual> = {
  roca: { id: 95, name: 'Onix' },
  agua: { id: 130, name: 'Gyarados' },
  electrico: { id: 26, name: 'Raichu' },
  planta: { id: 3, name: 'Venusaur' },
  fuego: { id: 6, name: 'Charizard' },
  lucha: { id: 68, name: 'Machamp' },
  combate: { id: 68, name: 'Machamp' },
  veneno: { id: 94, name: 'Gengar' },
  psiquico: { id: 65, name: 'Alakazam' },
  fantasma: { id: 92, name: 'Gastly' },
  acero: { id: 208, name: 'Steelix' },
  hielo: { id: 131, name: 'Lapras' },
  dragon: { id: 149, name: 'Dragonite' },
  volador: { id: 18, name: 'Pidgeot' },
  normal: { id: 143, name: 'Snorlax' },
  siniestro: { id: 197, name: 'Umbreon' },
  hada: { id: 282, name: 'Gardevoir' },
  tierra: { id: 51, name: 'Dugtrio' },
  bicho: { id: 123, name: 'Scyther' },
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export interface GymTypeVisual extends GymVisual {
  artworkUrl: string;
}

/**
 * Devuelve un Pokémon representativo del tipo del gimnasio para dar color
 * visual a las guías sin necesidad de mantener un sprite por líder.
 */
export function getGymTypeVisual(typeLabel: string): GymTypeVisual | null {
  const firstType = typeLabel.split('/')[0] ?? '';
  const visual = GYM_TYPE_VISUALS[normalize(firstType)];
  if (!visual) return null;

  return {
    ...visual,
    artworkUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${visual.id}.png`,
  };
}
