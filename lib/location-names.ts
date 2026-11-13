import locationAreas from '@/lib/location-areas.json';
import locationNamesEs from '@/lib/location-names-es.json';
import encounterMethodsEs from '@/lib/encounter-methods-es.json';
import { formatPokemonName } from '@/lib/pokemon';

const AREA_TO_BASE = locationAreas as Record<string, string>;
const LOCATION_NAMES = locationNamesEs as Record<string, string>;
const METHOD_NAMES_ES = encounterMethodsEs as Record<string, string>;

const PROVINCE_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
};

const PROVINCE_NAMES: Record<string, string> = {
  north: 'norte',
  south: 'sur',
  east: 'este',
  west: 'oeste',
};

const LOCATION_WORDS: Record<string, string> = {
  mt: 'Monte',
  mount: 'Monte',
  route: 'Ruta',
  sea: 'Mar',
  cave: 'Cueva',
  forest: 'Bosque',
  tower: 'Torre',
  lake: 'Lago',
  mountain: 'Montaña',
  island: 'Isla',
  islands: 'Islas',
  ruins: 'Ruinas',
  tunnel: 'Túnel',
  city: 'Ciudad',
  town: 'Pueblo',
  park: 'Parque',
  bridge: 'Puente',
  desert: 'Desierto',
  river: 'Río',
  valley: 'Valle',
  meadow: 'Pradera',
  woods: 'Bosque',
  path: 'Senda',
  gate: 'Puerta',
  chamber: 'Cámara',
  room: 'Sala',
  floor: 'Piso',
  entrance: 'Entrada',
  inside: 'Interior',
  outside: 'Exterior',
  area: 'Área',
  north: 'Norte',
  south: 'Sur',
  east: 'Este',
  west: 'Oeste',
  great: 'Gran',
  lakefront: 'Orilla del Lago',
  fields: 'Campos',
  field: 'Campo',
  hill: 'Colina',
  hills: 'Colinas',
  shore: 'Costa',
  coast: 'Costa',
  plains: 'Llanura',
  swamp: 'Pantano',
  marsh: 'Pantano',
  quarry: 'Cantera',
  mine: 'Mina',
  factory: 'Fábrica',
  warehouse: 'Almacén',
  lab: 'Laboratorio',
  laboratory: 'Laboratorio',
  mansion: 'Mansión',
  temple: 'Templo',
  shrine: 'Santuario',
  garden: 'Jardín',
  gardens: 'Jardines',
  grove: 'Arboleda',
  beach: 'Playa',
  bay: 'Bahía',
  cape: 'Cabo',
  cliff: 'Acantilado',
  cliffs: 'Acantilados',
  waterfall: 'Cascada',
  spring: 'Manantial',
  springs: 'Manantiales',
  well: 'Pozo',
  den: 'Guarida',
  nest: 'Nido',
  peak: 'Cumbre',
  summit: 'Cumbre',
  pass: 'Paso',
  trail: 'Sendero',
  road: 'Camino',
  street: 'Calle',
  square: 'Plaza',
  station: 'Estación',
  port: 'Puerto',
  harbor: 'Puerto',
  airport: 'Aeropuerto',
  school: 'Escuela',
  academy: 'Academia',
  castle: 'Castillo',
  palace: 'Palacio',
  hotel: 'Hotel',
  restaurant: 'Restaurante',
  cafe: 'Cafetería',
  shop: 'Tienda',
  market: 'Mercado',
  museum: 'Museo',
  gallery: 'Galería',
  hall: 'Salón',
  house: 'Casa',
  farm: 'Granja',
  ranch: 'Rancho',
  reserve: 'Reserva',
  sanctuary: 'Santuario',
  relic: 'Reliquia',
  crypt: 'Cripta',
  tomb: 'Tumba',
  graveyard: 'Cementerio',
  cemetery: 'Cementerio',
  lighthouse: 'Faro',
  ship: 'Barco',
  boat: 'Barco',
  train: 'Tren',
  subway: 'Metro',
  sewer: 'Alcantarilla',
  power: 'Energía',
  plant: 'Central',
  generator: 'Generador',
  reactor: 'Reactor',
  observatory: 'Observatorio',
  library: 'Biblioteca',
  university: 'Universidad',
  league: 'Liga',
  gym: 'Gimnasio',
  stadium: 'Estadio',
  arena: 'Arena',
  colosseum: 'Coliseo',
};

/**
 * Traduce el nombre técnico de una zona de PokeAPI. Primero busca la base de
 * la zona (por ejemplo, `viridian-forest-area` → `viridian-forest`) y después
 * el nombre español generado desde WikiDex.
 */
export function translateLocationName(slug: string): string {
  const base = AREA_TO_BASE[slug] ?? slug;
  const direct = LOCATION_NAMES[slug] ?? LOCATION_NAMES[base];
  if (direct) return direct;

  const province = /^(north|south|east|west)-province-area-(one|two|three|four|five|six)$/.exec(
    slug
  );
  if (province) {
    const number = PROVINCE_NUMBERS[province[2]];
    const region = PROVINCE_NAMES[province[1]];
    return `Área ${number} del ${region}`;
  }

  if (slug === 'area-zero' || slug === 'area-zero-gate') {
    return slug === 'area-zero' ? 'Área Cero' : 'Puerta del Área Cero';
  }

  const route = /(?:^|-)(?:sea-)?route-(\d+)$/.exec(base);
  if (route) return `Ruta ${route[1]}`;

  if (base === 'safari-zone' || base.startsWith('safari-zone-')) {
    return 'Zona Safari';
  }

  const words = base
    .replace(/-area$/, '')
    .split('-')
    .filter(Boolean)
    .map((word) => LOCATION_WORDS[word] ?? formatPokemonName(word));

  return words.join(' ');
}

export function translateEncounterMethod(method: string): string {
  return METHOD_NAMES_ES[method] ?? formatPokemonName(method);
}
