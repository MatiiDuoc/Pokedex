/**
 * Cobbleverse spawn data generator.
 *
 * Source: Cobblemon 1.8.4 (https://gitlab.com/cable-mc/cobblemon), downloaded
 * from the official Modrinth release. Cobblemon is licensed under the Mozilla
 * Public License 2.0 (MPL-2.0). See the generated meta.json for attribution.
 *
 * Pokémon and related names are trademarks of Nintendo, Game Freak and
 * The Pokémon Company. This is an unofficial fan project.
 *
 * Usage:
 *   npm run data:cobbleverse
 *
 * Optional cache override:
 *   COBBLEMON_CACHE_DIR=C:\path\to\cache npm run data:cobbleverse
 */

import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { access, mkdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';
import AdmZip from 'adm-zip';

const COBBLEMON_VERSION = '1.8.4';
const COBBLEMON_COMMIT = 'b79dbcca802e10fb7eda89c568a874f7891a2d28';
const MODPACK = 'Cobbleverse 1.8.0';
const MODRINTH_API = 'https://api.modrinth.com/v2';
const FALLBACK_JAR_URL =
  'https://cdn.modrinth.com/data/MdwFAVRL/versions/PdOzYHKU/Cobblemon-fabric-1.8.4%2B1.21.1.jar';
const FALLBACK_JAR_NAME = 'Cobblemon-fabric-1.8.4+1.21.1.jar';
const USER_AGENT = 'pokedex-cobbleverse-data/1.0';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_DIR =
  process.env.COBBLEMON_CACHE_DIR ?? path.join(tmpdir(), 'opencode', 'cobblemon');
const OUTPUT_DIR = path.join(ROOT, 'public', 'cobbleverse');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'spawns.json');
const META_FILE = path.join(OUTPUT_DIR, 'meta.json');

const SPECIES_PREFIX = 'data/cobblemon/species/';
const SPAWN_PREFIX = 'data/cobblemon/spawn_pool_world/';

const EXPECTED = {
  speciesFiles: 1025,
  implementedSpecies: 905,
  spawnFiles: 1591,
  rootSpawnFiles: 874,
  herdSpawnFiles: 717,
  spawnEntries: 5176,
  emptySpawnEntries: 2,
};

const BUCKETS = new Set(['common', 'uncommon', 'rare', 'ultra-rare', 'boss']);
const POSITIONS = new Set([
  'grounded',
  'submerged',
  'surface',
  'fishing',
  'seafloor',
]);
const TIMES = new Set(['day', 'night', 'dusk']);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function sha1File(file) {
  const hash = createHash('sha1');
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest('hex');
}

async function fetchWithRetry(url, { attempts = 3, timeout = 60_000 } = {}) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': USER_AGENT },
        signal: AbortSignal.timeout(timeout),
      });
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status} en ${url}`);
      if (![408, 429, 500, 502, 503, 504].includes(response.status)) break;
    } catch (error) {
      lastError = error;
    }

    if (attempt < attempts) {
      const delay = 1000 * 2 ** (attempt - 1);
      console.warn(
        `[retry] ${lastError?.message ?? 'error de red'}; reintento en ${delay} ms`
      );
      await sleep(delay);
    }
  }
  throw lastError ?? new Error(`No se pudo descargar ${url}`);
}

async function resolveJarArtifact() {
  try {
    const response = await fetchWithRetry(
      `${MODRINTH_API}/project/cobblemon/version`,
      { attempts: 3 }
    );
    const versions = await response.json();
    const version = versions.find(
      (candidate) =>
        candidate.loaders.includes('fabric') &&
        (candidate.version_number === COBBLEMON_VERSION ||
          candidate.version_number === `${COBBLEMON_VERSION}F` ||
          candidate.name.includes(`v${COBBLEMON_VERSION}`))
    );

    if (!version) throw new Error(`No hay release ${COBBLEMON_VERSION} Fabric`);

    const file =
      version.files.find((candidate) => candidate.primary) ?? version.files[0];
    if (!file?.url) throw new Error('El release no tiene archivo descargable');

    return {
      url: file.url,
      filename: file.filename ?? FALLBACK_JAR_NAME,
      sha1: file.hashes?.sha1 ?? null,
      size: file.size ?? null,
    };
  } catch (error) {
    console.warn(`[warn] No se pudo consultar Modrinth: ${error.message}`);
    console.warn(`[warn] Se usará la URL fija de Cobblemon ${COBBLEMON_VERSION}.`);
    return {
      url: FALLBACK_JAR_URL,
      filename: FALLBACK_JAR_NAME,
      sha1: null,
      size: null,
    };
  }
}

async function isValidJar(file, artifact) {
  try {
    const info = await stat(file);
    if (artifact.size && info.size !== artifact.size) return false;
    if (artifact.sha1) {
      const actual = await sha1File(file);
      if (actual !== artifact.sha1) return false;
    }

    const zip = new AdmZip(file);
    const mod = JSON.parse(zip.readAsText('fabric.mod.json'));
    return String(mod.version).startsWith(`${COBBLEMON_VERSION}+`);
  } catch {
    return false;
  }
}

async function downloadFile(url, destination, expectedSha1) {
  const partial = `${destination}.part`;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'user-agent': USER_AGENT },
        signal: AbortSignal.timeout(300_000),
      });
      if (!response.ok || !response.body) {
        throw new Error(`HTTP ${response.status} al descargar el JAR`);
      }

      await pipeline(
        Readable.fromWeb(response.body),
        createWriteStream(partial)
      );

      if (expectedSha1) {
        const actual = await sha1File(partial);
        if (actual !== expectedSha1) {
          throw new Error(
            `SHA-1 inválido (${actual.slice(0, 12)}…, esperaba ${expectedSha1.slice(0, 12)}…)`
          );
        }
      }

      await rename(partial, destination);
      const info = await stat(destination);
      console.log(
        `[download] OK ${(info.size / 1024 / 1024).toFixed(1)} MiB en ${destination}`
      );
      return;
    } catch (error) {
      await rm(partial, { force: true });
      if (attempt === 4) {
        throw new Error(`No se pudo descargar el JAR: ${error.message}`);
      }
      const delay = 1000 * 2 ** (attempt - 1);
      console.warn(
        `[retry] ${error.message}; reintento en ${delay} ms`
      );
      await sleep(delay);
    }
  }
}

async function ensureJar() {
  await mkdir(CACHE_DIR, { recursive: true });
  const artifact = await resolveJarArtifact();
  const jarPath = path.join(CACHE_DIR, artifact.filename);

  if (await isValidJar(jarPath, artifact)) {
    console.log(`[cache] Reutilizando ${jarPath}`);
    return { jarPath, artifact };
  }

  if (await exists(jarPath)) {
    console.warn(`[cache] JAR inválido; se descarta ${jarPath}`);
    await rm(jarPath, { force: true });
  }

  console.log(`[download] ${artifact.url}`);
  await downloadFile(artifact.url, jarPath, artifact.sha1);

  if (!(await isValidJar(jarPath, artifact))) {
    throw new Error('El JAR descargado no contiene Cobblemon 1.8.4 válido');
  }

  return { jarPath, artifact };
}

function parseSpecies(zip) {
  const entries = zip
    .getEntries()
    .filter(
      (entry) =>
        !entry.isDirectory &&
        entry.entryName.startsWith(SPECIES_PREFIX) &&
        entry.entryName.endsWith('.json')
    )
    .sort((a, b) => a.entryName.localeCompare(b.entryName));

  const implemented = new Map();
  let speciesFiles = 0;

  for (const entry of entries) {
    let data;
    try {
      data = JSON.parse(entry.getData().toString('utf8'));
    } catch (error) {
      throw new Error(`JSON inválido en ${entry.entryName}: ${error.message}`);
    }

    speciesFiles += 1;
    const dex = data.nationalPokedexNumber;
    if (!Number.isInteger(dex) || dex < 1 || dex > 1025) {
      throw new Error(`Dex inválido en ${entry.entryName}: ${dex}`);
    }

    if (data.implemented === true) {
      if (implemented.has(dex)) {
        throw new Error(
          `Dex duplicado ${dex}: ${implemented.get(dex)} y ${entry.entryName}`
        );
      }
      implemented.set(dex, data.name ?? entry.entryName);
    }
  }

  return { speciesFiles, implemented };
}

function parseLevel(value) {
  const match = /^(\d+)(?:\s*-\s*(\d+))?$/.exec(String(value ?? '').trim());
  if (!match) return null;
  const min = Number(match[1]);
  const max = match[2] ? Number(match[2]) : min;
  if (!Number.isInteger(min) || !Number.isInteger(max) || min > max) return null;
  return [min, max];
}

function compactMultipliers(spawn) {
  const source =
    Array.isArray(spawn.weightMultipliers) && spawn.weightMultipliers.length > 0
      ? spawn.weightMultipliers
      : spawn.weightMultiplier
        ? [spawn.weightMultiplier]
        : [];

  return source.flatMap((entry) => {
    const x = Number(entry?.multiplier);
    if (!Number.isFinite(x) || x === 1) return [];

    const multiplier = { x };
    if (entry.condition && Object.keys(entry.condition).length > 0) {
      multiplier.when = entry.condition;
    }
    return [multiplier];
  });
}

function compactSpawn(spawn, sourceFile) {
  if (!BUCKETS.has(spawn.bucket)) {
    throw new Error(`Bucket desconocido "${spawn.bucket}" en ${sourceFile}`);
  }

  const level = parseLevel(spawn.level ?? spawn.levelRange);
  if (!level) {
    throw new Error(
      `Nivel inválido "${spawn.level ?? spawn.levelRange}" en ${sourceFile}`
    );
  }
  if (!Number.isFinite(spawn.weight)) {
    throw new Error(`Peso inválido en ${sourceFile}`);
  }

  const compact = {
    bucket: spawn.bucket,
    level,
    weight: spawn.weight,
  };

  if (typeof spawn.spawnablePositionType === 'string') {
    if (!POSITIONS.has(spawn.spawnablePositionType)) {
      throw new Error(
        `Posición desconocida "${spawn.spawnablePositionType}" en ${sourceFile}`
      );
    }
    compact.position = spawn.spawnablePositionType;
  }

  const condition = spawn.condition ?? {};

  if (Array.isArray(condition.biomes) && condition.biomes.length > 0) {
    compact.biomes = condition.biomes;
  }

  if (condition.timeRange != null) {
    if (!TIMES.has(condition.timeRange)) {
      throw new Error(
        `timeRange desconocido "${condition.timeRange}" en ${sourceFile}`
      );
    }
    compact.time = condition.timeRange;
  }

  const weather = {};
  if (typeof condition.isRaining === 'boolean') weather.rain = condition.isRaining;
  if (typeof condition.isThundering === 'boolean') {
    weather.thunder = condition.isThundering;
  }
  if (Object.keys(weather).length > 0) compact.weather = weather;

  if (Array.isArray(condition.structures) && condition.structures.length > 0) {
    compact.structures = condition.structures;
  }

  const multipliers = compactMultipliers(spawn);
  if (multipliers.length > 0) compact.multipliers = multipliers;

  if (typeof spawn.pokemon === 'string') {
    const form = spawn.pokemon.trim().match(/^\S+\s+(.+)$/)?.[1]?.trim();
    if (form) compact.form = form;
  }

  if (spawn.type === 'pokemon-herd') {
    const herd = {};
    if (Number.isFinite(spawn.maxHerdSize)) herd.maxSize = spawn.maxHerdSize;
    herd.members = (spawn.herdablePokemon ?? []).map((member) => {
      const compactMember = {};
      if (typeof member.pokemon === 'string') {
        compactMember.pokemon = member.pokemon;
      }
      const memberLevel = parseLevel(member.levelRange ?? member.level);
      compactMember.level = memberLevel;
      if (Number.isFinite(member.weight)) compactMember.weight = member.weight;
      return compactMember;
    });
    compact.herd = herd;
  }

  return compact;
}

function parseSpawns(zip, implemented) {
  const entries = zip
    .getEntries()
    .filter(
      (entry) =>
        !entry.isDirectory &&
        entry.entryName.startsWith(SPAWN_PREFIX) &&
        entry.entryName.endsWith('.json')
    )
    .sort((a, b) => a.entryName.localeCompare(b.entryName));

  const byDex = new Map();
  let rootSpawnFiles = 0;
  let herdSpawnFiles = 0;
  let spawnEntries = 0;
  let emptySpawnEntries = 0;

  for (const entry of entries) {
    const isHerd = entry.entryName.includes('/spawn_pool_world/herds/');
    if (isHerd) herdSpawnFiles += 1;
    else rootSpawnFiles += 1;

    const basename = path.posix.basename(entry.entryName);
    const match = /^(\d{4})_/.exec(basename);
    if (!match) {
      throw new Error(`Nombre de spawn sin prefijo de dex: ${entry.entryName}`);
    }

    const dex = Number(match[1]);
    if (dex !== 0 && !implemented.has(dex)) {
      throw new Error(
        `Spawn ${entry.entryName} apunta a dex ${dex}, que no está implementado`
      );
    }

    let data;
    try {
      data = JSON.parse(entry.getData().toString('utf8'));
    } catch (error) {
      throw new Error(`JSON inválido en ${entry.entryName}: ${error.message}`);
    }

    for (const spawn of data.spawns ?? []) {
      if (spawn.type === 'empty') {
        emptySpawnEntries += 1;
        continue;
      }
      if (dex === 0) {
        throw new Error(`Spawn no vacío en ${entry.entryName}, que es plantilla`);
      }

      const compact = compactSpawn(spawn, entry.entryName);
      const list = byDex.get(dex) ?? [];
      list.push(compact);
      byDex.set(dex, list);
      spawnEntries += 1;
    }
  }

  return {
    byDex,
    rootSpawnFiles,
    herdSpawnFiles,
    spawnFiles: rootSpawnFiles + herdSpawnFiles,
    spawnEntries,
    emptySpawnEntries,
  };
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: ${actual}, esperaba ${expected}`);
  }
}

async function main() {
  const { jarPath, artifact } = await ensureJar();
  const zip = new AdmZip(jarPath);

  const { speciesFiles, implemented } = parseSpecies(zip);
  const {
    byDex,
    rootSpawnFiles,
    herdSpawnFiles,
    spawnFiles,
    spawnEntries,
    emptySpawnEntries,
  } = parseSpawns(zip, implemented);

  assertEqual(speciesFiles, EXPECTED.speciesFiles, 'Archivos de especie');
  assertEqual(
    implemented.size,
    EXPECTED.implementedSpecies,
    'Especies implementadas'
  );
  assertEqual(spawnFiles, EXPECTED.spawnFiles, 'Archivos de spawn');
  assertEqual(rootSpawnFiles, EXPECTED.rootSpawnFiles, 'Archivos de spawn raíz');
  assertEqual(herdSpawnFiles, EXPECTED.herdSpawnFiles, 'Archivos de spawn herd');
  assertEqual(spawnEntries, EXPECTED.spawnEntries, 'Entradas de spawn');
  assertEqual(
    emptySpawnEntries,
    EXPECTED.emptySpawnEntries,
    'Entradas de spawn vacías'
  );

  const generatedAt = new Date().toISOString();
  const sortedSpawns = [...byDex.entries()]
    .sort(([a], [b]) => a - b)
    .map(([dex, list]) => [String(dex), list]);

  const payload = {
    meta: {
      source: 'https://gitlab.com/cable-mc/cobblemon',
      modpack: MODPACK,
      cobblemonVersion: COBBLEMON_VERSION,
      generatedAt,
      implementedSpecies: implemented.size,
      spawnEntries,
      license: 'MPL-2.0',
    },
    spawns: Object.fromEntries(sortedSpawns),
  };

  const json = JSON.stringify(payload);
  const gzipBytes = gzipSync(json).byteLength;
  const jarInfo = await stat(jarPath);

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(OUTPUT_FILE, json);

  const meta = {
    source: 'https://gitlab.com/cable-mc/cobblemon',
    modpack: MODPACK,
    cobblemonVersion: COBBLEMON_VERSION,
    cobblemonCommit: COBBLEMON_COMMIT,
    generatedAt,
    license: 'MPL-2.0',
    attribution:
      'Data derived from Cobblemon (https://gitlab.com/cable-mc/cobblemon), licensed under MPL-2.0. Pokémon and related marks belong to Nintendo, Game Freak and The Pokémon Company. This is an unofficial fan project.',
    jar: {
      filename: path.basename(jarPath),
      bytes: jarInfo.size,
      sha1: artifact.sha1,
    },
    counts: {
      speciesFiles,
      implementedSpecies: implemented.size,
      speciesWithSpawns: byDex.size,
      spawnFiles,
      rootSpawnFiles,
      herdSpawnFiles,
      spawnEntries,
      emptySpawnEntries,
      rawSpawnEntries: spawnEntries + emptySpawnEntries,
      spawnsJsonBytes: Buffer.byteLength(json),
      spawnsJsonGzipBytes: gzipBytes,
    },
  };

  await writeFile(META_FILE, `${JSON.stringify(meta, null, 2)}\n`);

  console.log('');
  console.log(`[ok] Especies implementadas: ${implemented.size}`);
  console.log(
    `[ok] Archivos de spawn: ${spawnFiles} (${rootSpawnFiles} raíz + ${herdSpawnFiles} herds)`
  );
  console.log(
    `[ok] Entradas: ${spawnEntries} (+${emptySpawnEntries} empty ignoradas)`
  );
  console.log(
    `[ok] spawns.json: ${Buffer.byteLength(json)} bytes (${gzipBytes} bytes gzip)`
  );
  console.log(`[ok] Escrito: ${OUTPUT_FILE}`);
  console.log(`[ok] Escrito: ${META_FILE}`);
}

main().catch((error) => {
  console.error(`[error] ${error.stack ?? error.message}`);
  process.exitCode = 1;
});
