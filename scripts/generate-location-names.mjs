#!/usr/bin/env node
/**
 * Genera los nombres en español de las zonas de encuentro.
 *
 * Fuentes:
 * - PokeAPI (CSV de localizaciones y áreas) para relacionar cada área con su
 *   localización base.
 * - WikiDex ("Lista de localizaciones en todos los idiomas") para el nombre
 *   oficial en español.
 *
 * Uso: npm run data:locations
 */
import { writeFile } from 'node:fs/promises';

const POKEAPI_CSV =
  'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';
const WIKIDEX_LIST =
  'https://wikidex.net/api.php?action=parse&format=json&prop=wikitext&page=' +
  encodeURIComponent('Lista de localizaciones en todos los idiomas');
const USER_AGENT =
  'PokedexGuias/1.0 (+https://pokedex-guias.vercel.app)';

const MANUAL_NAMES = {
  'area-zero': 'Área Cero',
  'area-zero-gate': 'Puerta del Área Cero',
  'mt-coronet': 'Monte Corona',
  'lost-tower': 'Torre Perdida',
  'slowpoke-well': 'Pozo Slowpoke',
  'team-rocket-hq': 'Cuartel General del Equipo Rocket',
  'sinnoh-pokemon-league': 'Liga Pokémon de Sinnoh',
  'kanto-pokemon-league': 'Liga Pokémon de Kanto',
  'johto-pokemon-league': 'Liga Pokémon de Johto',
  'hoenn-pokemon-league': 'Liga Pokémon de Hoenn',
  'unova-pokemon-league': 'Liga Pokémon de Teselia',
  'kalos-pokemon-league': 'Liga Pokémon de Kalos',
  'alola-pokemon-league': 'Liga Pokémon de Alola',
  'galar-pokemon-league': 'Liga Pokémon de Galar',
  'paldea-pokemon-league': 'Liga Pokémon de Paldea',
  'victory-road': 'Calle Victoria',
  'kanto-victory-road-1': 'Calle Victoria (Kanto)',
  'kanto-victory-road-2': 'Calle Victoria (Kanto)',
  'sinnoh-victory-road': 'Calle Victoria (Sinnoh)',
  'unova-victory-road': 'Calle Victoria (Teselia)',
  'unova-victory-road-2': 'Calle Victoria (Teselia)',
  'kalos-victory-road': 'Calle Victoria (Kalos)',
  'alola-victory-road': 'Calle Victoria (Alola)',
  'galar-victory-road': 'Calle Victoria (Galar)',
  'paldea-victory-road': 'Calle Victoria (Paldea)',
  'giants-bed': 'Cama del Gigante',
  'giants-cap': 'Gorro del Gigante',
  'giants-foot': 'Pie del Gigante',
  'giants-mirror': 'Espejo del Gigante',
  'giants-seat': 'Asiento del Gigante',
  'bridge-field': 'Campo del Puente',
  'kitakami-road': 'Camino de Kitakami',
  'blueberry-academy': 'Academia Arándano',
  terarium: 'Terrario',
  'roaming-kanto': 'Kanto (errante)',
  'roaming-johto': 'Johto (errante)',
  'roaming-hoenn': 'Hoenn (errante)',
  'roaming-sinnoh': 'Sinnoh (errante)',
  'roaming-unova': 'Teselia (errante)',
  'roaming-kalos': 'Kalos (errante)',
  'roaming-galar-wild-area': 'Área Silvestre de Galar (errante)',
  'roaming-isle-of-armor': 'Isla de la Armadura (errante)',
  'roaming-crown-tundra': 'Nieves de la Corona (errante)',
  'pokemon-mansion': 'Mansión Pokémon',
  'ss-anne': 'S. S. Anne',
  'mt-moon': 'Monte Luna',
  'mt-silver': 'Monte Plateado',
  'mt-silver-cave': 'Cueva Monte Plateado',
  'mt-ember': 'Monte Ascuas',
  'mt-mortar': 'Monte Mortero',
  'mt-pyro': 'Monte Pyro',
  'mt-hokulani': 'Monte Hokulani',
  'mt-lanakila': 'Monte Lanakila',
  'digletts-cave': 'Cueva Diglett',
  'digletts-tunnel': 'Túnel Diglett',
  'ruins-of-alph': 'Ruinas Alfa',
  'sprout-tower': 'Torre Bellsprout',
  'bell-tower': 'Torre Campana',
  'burned-tower': 'Torre Quemada',
  'whirl-islands': 'Islas Remolino',
  'dragons-den': 'Guarida Dragón',
  'lake-of-rage': 'Lago de la Furia',
  'saffron-city': 'Ciudad Azafrán',
  'celadon-city': 'Ciudad Azulona',
  'fuchsia-city': 'Ciudad Fucsia',
  'cinnabar-island': 'Isla Canela',
  'viridian-city': 'Ciudad Verde',
  'pewter-city': 'Ciudad Plateada',
  'cerulean-city': 'Ciudad Celeste',
  'vermilion-city': 'Ciudad Carmín',
  'lavender-town': 'Pueblo Lavanda',
  'pallet-town': 'Pueblo Paleta',
  'twinleaf-town': 'Pueblo Hojasgemelas',
  'sandgem-town': 'Pueblo Arena',
  'jubilife-city': 'Ciudad Jubileo',
  'oreburgh-city': 'Ciudad Pirita',
  'floaroma-town': 'Pueblo Floaroma',
  'eterna-city': 'Ciudad Vetusta',
  'hearthome-city': 'Ciudad Corazón',
  'solaceon-town': 'Pueblo Sosiego',
  'veilstone-city': 'Ciudad Rocavelo',
  'pastoria-city': 'Ciudad Pastoria',
  'celestic-town': 'Pueblo Caelestis',
  'canalave-city': 'Ciudad Canal',
  'snowpoint-city': 'Ciudad Puntaneva',
  'sunyshore-city': 'Ciudad Marina',
  'driftveil-city': 'Ciudad Gres',
  'hauoli-city': 'Ciudad Hauoli',
  'kalae-bay': 'Bahía Kalae',
  'hoenn-route-120': 'Ruta 120',
  'hoenn-route-132': 'Ruta 132',
  'hoenn-route-134': 'Ruta 134',
  'sinnoh-route-210': 'Ruta 210',
  'johto-route-33': 'Ruta 33',
  'unknown-all-bugs': 'Zona de bichos',
  'unknown-all-poliwag': 'Zona de Poliwag',
  'unknown-all-rattata': 'Zona de Rattata',
  'abandoned-ship': 'Barco Abandonado',
  'artisan-cave': 'Cueva Artesano',
  'challengers-cave': 'Gruta Superación',
  'cold-storage': 'Almacén Frío',
  'faraway-island': 'Isla Extravagante',
  'magma-hideout': 'Guarida Magma',
  'mirage-tower': 'Torre Espejismo',
  'nature-sanctuary': 'Santuario Natural',
  'sinjoh-ruins': 'Ruinas Sinjoh',
  'terra-cave': 'Caverna Terra',
  'valor-lakefront': 'Orilla Valor',
  'space-time-distortion': 'Distorsión espaciotemporal',
  'sea-spirits-den': 'Guarida de los Espíritus Marinos',
  'team-rockets-castle': 'Castillo del Team Rocket',
  'sinnoh-hall-of-origin-1': 'Salón del Origen',
  'arenas-approach': 'Acceso a las Arenas',
  'avaluggs-legacy': 'Legado de Avalugg',
  'axews-eye': 'Ojo de Axew',
  'coastlands-camp': 'Campamento de las Costas',
  'crescent-isle': 'Isla Creciente',
  'dilford-chamber': 'Cámara Dilford',
  'galar-wild-area-max-dens': 'Guaridas Max del Área Silvestre',
  'glacier-room': 'Sala Glaciar',
  'hauoli-cemetery': 'Cementerio de Hauoli',
  'hearts-crag': 'Peñasco del Corazón',
  'heights-camp': 'Campamento de las Alturas',
  'hoenn-pokecenter': 'Centro Pokémon de Hoenn',
  'hoenn-pokemart': 'Tienda Pokémon de Hoenn',
  'ice-column-chamber': 'Cámara de la Columna de Hielo',
  'iron-room': 'Sala de Hierro',
  'isle-of-armor-caves': 'Cuevas de la Isla de la Armadura',
  'johto-pokemart': 'Tienda Pokémon de Johto',
  'kanto-pokecenter': 'Centro Pokémon de Kanto',
  'kanto-pokemart': 'Tienda Pokémon de Kanto',
  'liptoo-chamber': 'Cámara Liptoo',
  'lunkers-lair': 'Guarida de Lunker',
  'mirage-spot-cave': 'Cueva Espejismo',
  'mirage-spot-forest': 'Bosque Espejismo',
  'mirage-spot-island': 'Isla Espejismo',
  'mirage-spot-mountain': 'Monte Espejismo',
  'monean-chamber': 'Cámara Monean',
  'natures-pantry': 'Despensa de la Naturaleza',
  'ns-castle': 'Castillo de N',
  onbs: 'ONBS',
  pokespot: 'Pokéspot',
  'pyrite-bldg': 'Edificio Pirita',
  'rixy-chamber': 'Cámara Rixy',
  'rocky-mountain-room': 'Sala de la Montaña Rocosa',
  'ruin-maniac-cave': 'Cueva del Ruinamaníaco',
  'safari-zone-gate': 'Puerta de la Zona Safari',
  'sands-reach': 'Alcance de las Arenas',
  'scufib-chamber': 'Cámara Scufib',
  'shadow-pokemon-lab': 'Laboratorio de Pokémon Oscuros',
  'sinnoh-pokemart': 'Tienda Pokémon de Sinnoh',
  'snagem-hideout': 'Guarida del Team Snagem',
  'soaring-in-the-sky': 'Sobrevuelo',
  'ulaula-beach': 'Playa de Ula-Ula',
  'ulaula-meadow': 'Prado de Ula-Ula',
  'ursas-ring': 'Anillo de Ursa',
  'verdant-cavern--trial-site': 'Cueva Sotobosque (prueba)',
  'viapos-chamber': 'Cámara Viapos',
  'weepth-chamber': 'Cámara Weepth',
};

const PROVINCE_NUMBERS = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
};
const PROVINCE_NAMES = {
  north: 'norte',
  south: 'sur',
  east: 'este',
  west: 'oeste',
};
const REGIONS = [
  'kanto',
  'johto',
  'hoenn',
  'sinnoh',
  'unova',
  'kalos',
  'alola',
  'galar',
  'paldea',
  'hisui',
  'sevii',
  'orange',
  'orre',
  'fiore',
  'almia',
  'oblivia',
  'ransei',
  'lental',
  'kitakami',
  'blueberry',
];

function stripAccents(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalize(value) {
  return stripAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripRegion(value) {
  const region = REGIONS.find((name) => value.startsWith(`${name} `));
  return region ? value.slice(region.length + 1) : value;
}

function cleanCell(cell) {
  let value = cell;
  value = value.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, ' ');
  value = value.replace(/<ref[^>]*\/>/gi, ' ');
  value = value.replace(/\{\{[^{}]*\}\}/g, ' ');
  value = value.replace(/'''?/g, '');
  const link = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/.exec(value);
  if (link) return (link[2] ?? link[1]).trim();
  return value.replace(/\[\[|\]\]/g, '').trim();
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    throw new Error(`${url} respondió ${response.status}`);
  }
  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    throw new Error(`${url} respondió ${response.status}`);
  }
  return response.json();
}

function parseCsv(text) {
  const [header, ...lines] = text.trim().split('\n');
  const columns = header.split(',');
  return lines.map((line) => {
    const values = line.split(',');
    return Object.fromEntries(
      columns.map((column, index) => [column, values[index] ?? ''])
    );
  });
}

function buildAreaMap(locationsCsv, areasCsv) {
  const locations = new Map();
  for (const row of parseCsv(locationsCsv)) {
    locations.set(Number(row.id), row.identifier);
  }

  const areas = {};
  for (const row of parseCsv(areasCsv)) {
    const base = locations.get(Number(row.location_id));
    if (!base) continue;
    const suffix = row.identifier;

    if (suffix) {
      areas[`${base}-${suffix}`] = base;
    } else {
      areas[base] = base;
      areas[`${base}-area`] = base;
    }
  }

  return areas;
}

function buildEnglishMap(wikitext) {
  const map = new Map();

  for (const line of wikitext.split('\n')) {
    const trimmed = line.trim();
    if (
      !trimmed.startsWith('|') ||
      trimmed.startsWith('|-') ||
      trimmed.startsWith('|}')
    ) {
      continue;
    }

    const cells = trimmed.slice(1).split('||').map(cleanCell);
    if (cells.length < 4) continue;

    const [spanish, , , english] = cells;
    if (!spanish || !english) continue;

    const raw = normalize(english);
    const variants = new Set([
      raw,
      stripRegion(raw),
      raw.replace(/\btown\b/g, 'city'),
      raw.replace(/\bcity\b/g, 'town'),
      raw.replace(/\bmt\b/g, 'mount'),
      raw.replace(/\bmount\b/g, 'mt'),
    ]);

    for (const variant of variants) {
      if (!map.has(variant)) map.set(variant, spanish);
    }
  }

  return map;
}

function translateBase(base, englishMap) {
  if (MANUAL_NAMES[base]) return MANUAL_NAMES[base];

  const humanized = base
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/'S\b/g, "'s")
    .replace(/’S\b/g, '’s');

  const raw = normalize(humanized);
  const translated =
    englishMap.get(raw) ?? englishMap.get(stripRegion(raw));
  if (translated) return translated;

  const province =
    /^(north|south|east|west)-province-area-(one|two|three|four|five|six)$/.exec(
      base
    );
  if (province) {
    return `Área ${PROVINCE_NUMBERS[province[2]]} del ${
      PROVINCE_NAMES[province[1]]
    }`;
  }

  const route = /(?:^|-)(?:sea-)?route-(\d+)$/.exec(base);
  if (route) return `Ruta ${route[1]}`;

  return undefined;
}

async function main() {
  const [locationsCsv, areasCsv, wikidex] = await Promise.all([
    fetchText(`${POKEAPI_CSV}/locations.csv`),
    fetchText(`${POKEAPI_CSV}/location_areas.csv`),
    fetchJson(WIKIDEX_LIST),
  ]);

  const wikitext = wikidex.parse?.wikitext?.['*'];
  if (!wikitext) {
    throw new Error('WikiDex no devolvió la lista de localizaciones');
  }

  const areas = buildAreaMap(locationsCsv, areasCsv);
  const englishMap = buildEnglishMap(wikitext);
  const names = {};

  for (const base of new Set(Object.values(areas))) {
    const translated = translateBase(base, englishMap);
    if (translated) names[base] = translated;
  }

  for (const [slug, name] of Object.entries(MANUAL_NAMES)) {
    names[slug] = name;
  }

  await Promise.all([
    writeFile(
      'lib/location-areas.json',
      `${JSON.stringify(areas, null, 0)}\n`
    ),
    writeFile(
      'lib/location-names-es.json',
      `${JSON.stringify(names, null, 0)}\n`
    ),
  ]);

  console.log(
    `Generadas ${Object.keys(areas).length} áreas y ${
      Object.keys(names).length
    } localizaciones en español.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
