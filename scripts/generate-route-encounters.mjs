#!/usr/bin/env node
/**
 * Genera un índice de encuentros por ruta y juego a partir de los CSV de
 * PokeAPI. El resultado se carga bajo demanda desde /encounters/<juego>.json.
 *
 * Uso: npm run data:encounters
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const CSV_BASE =
  'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';
const USER_AGENT =
  'PokedexGuias/1.0 (+https://pokedex-guias.vercel.app)';
const OUT_DIR = 'public/encounters';

const FAMILIES = {
  'sword-shield': ['sword-shield', 'the-isle-of-armor', 'the-crown-tundra'],
  'scarlet-violet': ['scarlet-violet', 'the-teal-mask', 'the-indigo-disk'],
  'legends-za': ['legends-za', 'mega-dimension'],
};

const FAMILY_OF = new Map();
for (const [family, groups] of Object.entries(FAMILIES)) {
  for (const group of groups) FAMILY_OF.set(group, family);
}

function parseCsv(text) {
  const lines = text.replace(/^\uFEFF/, '').trim().split('\n');
  const [header, ...rows] = lines;
  const columns = header.split(',');
  return rows.map((line) => {
    const values = line.split(',');
    return Object.fromEntries(
      columns.map((column, index) => [column, values[index] ?? ''])
    );
  });
}

async function fetchCsv(name) {
  const response = await fetch(`${CSV_BASE}/${name}.csv`, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(90_000),
  });
  if (!response.ok) {
    throw new Error(`${name}.csv respondió ${response.status}`);
  }
  return parseCsv(await response.text());
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function humanize(value) {
  return value
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace(/'S\b/g, "'s");
}

function formatLevels(min, max) {
  return min === max ? `${min}` : `${min}-${max}`;
}

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function main() {
  return Promise.all([
    fetchCsv('encounters'),
    fetchCsv('encounter_slots'),
    fetchCsv('encounter_methods'),
    fetchCsv('versions'),
    fetchCsv('version_groups'),
    fetchCsv('location_areas'),
    fetchCsv('locations'),
    readJson('lib/location-areas.json'),
    readJson('lib/location-names-es.json'),
    readJson('lib/version-names-es.json'),
    readJson('lib/encounter-methods-es.json'),
  ]).then(
    ([
      encounters,
      slots,
      methods,
      versions,
      versionGroups,
      locationAreas,
      locations,
      areaToBase,
      locationNames,
      versionNames,
      methodNames,
    ]) => {
      const slotById = new Map(
        slots.map((row) => [
          Number(row.id),
          {
            methodId: Number(row.encounter_method_id),
            rarity: Number(row.rarity),
          },
        ])
      );
      const methodById = new Map(
        methods.map((row) => [Number(row.id), row.identifier])
      );
      const versionById = new Map(
        versions.map((row) => [
          Number(row.id),
          {
            identifier: row.identifier,
            versionGroupId: Number(row.version_group_id),
          },
        ])
      );
      const groupById = new Map(
        versionGroups.map((row) => [Number(row.id), row.identifier])
      );
      const locationById = new Map(
        locations.map((row) => [Number(row.id), row.identifier])
      );
      const areaById = new Map(
        locationAreas.map((row) => [
          Number(row.id),
          {
            locationId: Number(row.location_id),
            suffix: row.identifier,
          },
        ])
      );

      const groups = new Map();

      const getGroup = (family) => {
        if (!groups.has(family)) {
          groups.set(family, {
            versionGroup: family,
            versions: new Map(),
            locations: new Map(),
          });
        }
        return groups.get(family);
      };

      for (const row of encounters) {
        const pokemonId = Number(row.pokemon_id);
        if (!Number.isInteger(pokemonId) || pokemonId < 1 || pokemonId > 1025) {
          continue;
        }

        const version = versionById.get(Number(row.version_id));
        if (!version) continue;

        const rawGroup = groupById.get(version.versionGroupId);
        if (!rawGroup) continue;

        const family = FAMILY_OF.get(rawGroup) ?? rawGroup;
        const slot = slotById.get(Number(row.encounter_slot_id));
        if (!slot) continue;

        const area = areaById.get(Number(row.location_area_id));
        if (!area) continue;

        const base = locationById.get(area.locationId);
        if (!base) continue;

        const areaSlug = area.suffix ? `${base}-${area.suffix}` : `${base}-area`;
        const baseSlug = areaToBase[areaSlug] ?? base;
        const locationName = locationNames[baseSlug] ?? humanize(base);
        const locationId = slugify(locationName);
        const method = methodById.get(slot.methodId) ?? 'walk';
        const methodName = methodNames[method] ?? humanize(method);

        const minLevel = Number(row.min_level);
        const maxLevel = Number(row.max_level);

        const group = getGroup(family);
        group.versions.set(version.identifier, {
          id: version.identifier,
          name: versionNames[version.identifier] ?? humanize(version.identifier),
          order: Number(row.version_id),
        });

        // Los pisos y subzonas de una misma localización se agrupan bajo el
        // nombre visible (por ejemplo, "Calle Victoria").
        if (!group.locations.has(locationName)) {
          group.locations.set(locationName, {
            id: locationId,
            name: locationName,
            pokemon: new Map(),
          });
        }

        const location = group.locations.get(locationName);
        if (!location.pokemon.has(pokemonId)) {
          location.pokemon.set(pokemonId, { id: pokemonId, versions: new Map() });
        }

        const pokemon = location.pokemon.get(pokemonId);
        if (!pokemon.versions.has(version.identifier)) {
          pokemon.versions.set(version.identifier, {
            version: version.identifier,
            methods: new Set(),
            levels: new Set(),
            minLevel,
            maxLevel,
            chance: slot.rarity,
          });
        }

        const entry = pokemon.versions.get(version.identifier);
        entry.methods.add(methodName);
        entry.levels.add(formatLevels(minLevel, maxLevel));
        entry.minLevel = Math.min(entry.minLevel, minLevel);
        entry.maxLevel = Math.max(entry.maxLevel, maxLevel);
        entry.chance = Math.max(entry.chance, slot.rarity);
      }

      const index = { groups: {} };
      const files = [];

      for (const [family, group] of groups) {
        if (group.locations.size === 0) continue;

        const versionList = Array.from(group.versions.values()).sort(
          (a, b) => a.order - b.order
        );
        const versionOrder = new Map(
          versionList.map((version, index) => [version.id, index])
        );

        const locations = Array.from(group.locations.values())
          .map((location) => ({
            id: location.id,
            name: location.name,
            pokemon: Array.from(location.pokemon.values())
              .map((pokemon) => ({
                id: pokemon.id,
                encounters: Array.from(pokemon.versions.values())
                  .sort(
                    (a, b) =>
                      (versionOrder.get(a.version) ?? 0) -
                      (versionOrder.get(b.version) ?? 0)
                  )
                  .map((entry) => ({
                    version: entry.version,
                    methods: Array.from(entry.methods),
                    levels: Array.from(entry.levels)
                      .sort((a, b) => Number.parseInt(a, 10) - Number.parseInt(b, 10))
                      .join(', '),
                    minLevel: entry.minLevel,
                    maxLevel: entry.maxLevel,
                    chance: entry.chance,
                  })),
              }))
              .sort((a, b) => a.id - b.id),
          }))
          .sort((a, b) => a.name.localeCompare(b.name, 'es'));

        const uniquePokemon = new Set();
        for (const location of locations) {
          for (const pokemon of location.pokemon) {
            uniquePokemon.add(pokemon.id);
          }
        }

        const payload = {
          source: 'PokeAPI',
          versionGroup: family,
          versions: versionList.map(({ id, name }) => ({ id, name })),
          locations,
        };

        files.push({
          family,
          payload,
        });
        index.groups[family] = {
          locations: locations.length,
          pokemon: uniquePokemon.size,
        };
      }

      return { files, index };
    }
  );
}

main()
  .then(async ({ files, index }) => {
    await mkdir(OUT_DIR, { recursive: true });

    await Promise.all(
      files.map(({ family, payload }) =>
        writeFile(
          `${OUT_DIR}/${family}.json`,
          `${JSON.stringify(payload)}\n`
        )
      )
    );

    await writeFile(
      `${OUT_DIR}/index.json`,
      `${JSON.stringify(index)}\n`
    );

    const summary = files
      .map(
        ({ family, payload }) =>
          `${family}: ${payload.locations.length} rutas, ${payload.versions.length} versiones`
      )
      .join('\n');
    console.log(`Generados ${files.length} juegos:\n${summary}`);
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
