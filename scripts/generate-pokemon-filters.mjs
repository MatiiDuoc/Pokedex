import { writeFile } from 'node:fs/promises';

const BASE =
  'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';

async function fetchCsv(name) {
  const response = await fetch(`${BASE}/${name}`);
  if (!response.ok) throw new Error(`No se pudo descargar ${name}`);
  return (await response.text()).trim().split('\n').slice(1);
}

const [pokemonStats, pokemonTypes, pokemonAbilities, stats, types, abilities] =
  await Promise.all([
    fetchCsv('pokemon_stats.csv'),
    fetchCsv('pokemon_types.csv'),
    fetchCsv('pokemon_abilities.csv'),
    fetchCsv('stats.csv'),
    fetchCsv('types.csv'),
    fetchCsv('abilities.csv'),
  ]);

const statNames = new Map(
  stats.map((line) => {
    const [id, , identifier] = line.split(',');
    return [id, identifier];
  })
);
const typeNames = new Map(
  types.map((line) => {
    const [id, identifier] = line.split(',');
    return [id, identifier];
  })
);
const abilityNames = new Map(
  abilities.map((line) => {
    const [id, identifier] = line.split(',');
    return [id, identifier];
  })
);

const statsByPokemon = new Map();
for (const line of pokemonStats) {
  const [pokemonId, statId, baseStat] = line.split(',');
  const id = Number.parseInt(pokemonId, 10);
  if (!Number.isInteger(id) || id < 1 || id > 1025) continue;
  const statName = statNames.get(statId);
  if (!statName) continue;
  if (!statsByPokemon.has(id)) statsByPokemon.set(id, {});
  statsByPokemon.get(id)[statName] = Number.parseInt(baseStat, 10);
}

const typesByPokemon = new Map();
for (const line of pokemonTypes) {
  const [pokemonId, typeId, slot] = line.split(',');
  const id = Number.parseInt(pokemonId, 10);
  if (!Number.isInteger(id) || id < 1 || id > 1025) continue;
  const typeName = typeNames.get(typeId);
  if (!typeName) continue;
  if (!typesByPokemon.has(id)) typesByPokemon.set(id, []);
  typesByPokemon.get(id).push({ type: typeName, slot: Number(slot) });
}

const abilitiesByPokemon = new Map();
for (const line of pokemonAbilities) {
  const [pokemonId, abilityId, , slot] = line.split(',');
  const id = Number.parseInt(pokemonId, 10);
  if (!Number.isInteger(id) || id < 1 || id > 1025) continue;
  const abilityName = abilityNames.get(abilityId);
  if (!abilityName) continue;
  if (!abilitiesByPokemon.has(id)) abilitiesByPokemon.set(id, []);
  abilitiesByPokemon.get(id).push({
    ability: abilityName,
    slot: Number(slot),
  });
}

const entries = [];

for (let id = 1; id <= 1025; id += 1) {
  const stats = statsByPokemon.get(id);
  const typeEntries = typesByPokemon.get(id);
  if (!stats || !typeEntries) continue;

  entries.push({
    id,
    types: typeEntries
      .sort((a, b) => a.slot - b.slot)
      .map((entry) => entry.type),
    stats: {
      hp: stats.hp ?? 0,
      attack: stats.attack ?? 0,
      defense: stats.defense ?? 0,
      'special-attack': stats['special-attack'] ?? 0,
      'special-defense': stats['special-defense'] ?? 0,
      speed: stats.speed ?? 0,
    },
    abilities: Array.from(
      new Set(
        (abilitiesByPokemon.get(id) ?? [])
          .sort((a, b) => a.slot - b.slot)
          .map((entry) => entry.ability)
      )
    ),
  });
}

await writeFile(
  'public/pokemon-filters.json',
  JSON.stringify(entries),
  'utf8'
);

console.log(`Generados ${entries.length} Pokémon en public/pokemon-filters.json`);
