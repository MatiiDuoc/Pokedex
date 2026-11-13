const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const REVALIDATE_SECONDS = 60 * 60 * 24 * 7;
const TIMEOUT_MS = 20_000;

interface NamedResource {
  name: string;
  url: string;
}

interface EncounterResponse {
  location_area: NamedResource;
  version_details: Array<{
    version: NamedResource;
    max_chance: number;
    encounter_details: Array<{
      chance: number;
      method: NamedResource;
      min_level: number;
      max_level: number;
    }>;
  }>;
}

export interface EncounterLocation {
  location: string;
  methods: string[];
  levels: string;
  chance: number;
}

export interface VersionEncounters {
  version: string;
  locations: EncounterLocation[];
}

const cache = new Map<number, Promise<VersionEncounters[]>>();
const versionGroupCache = new Map<string, Promise<string[]>>();

interface VersionGroupResponse {
  versions: NamedResource[];
}

async function fetchEncounters(id: number): Promise<EncounterResponse[]> {
  const response = await fetch(`${POKEAPI_BASE}/pokemon/${id}/encounters`, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`PokeAPI respondió ${response.status}`);
  }

  return (await response.json()) as EncounterResponse[];
}

function formatLevels(min: number, max: number): string {
  return min === max ? `${min}` : `${min}-${max}`;
}

export async function getPokemonEncounters(
  id: number
): Promise<VersionEncounters[]> {
  const cached = cache.get(id);
  if (cached) return cached;

  const promise = (async () => {
    let data: EncounterResponse[] = [];

    try {
      data = await fetchEncounters(id);
    } catch (error) {
      console.error(`No se pudieron cargar los encuentros de ${id}:`, error);
      return [];
    }

    const versions = new Map<string, Map<string, EncounterLocation>>();

    for (const entry of data) {
      for (const versionDetail of entry.version_details) {
        const version = versionDetail.version.name;
        const location = entry.location_area.name;

        if (!versions.has(version)) versions.set(version, new Map());
        const locations = versions.get(version)!;

        const existing = locations.get(location);
        const methods = Array.from(
          new Set(
            versionDetail.encounter_details.map((detail) =>
              detail.method.name.replace(/-/g, ' ')
            )
          )
        );

        const levels = Array.from(
          new Set(
            versionDetail.encounter_details.map((detail) =>
              formatLevels(detail.min_level, detail.max_level)
            )
          )
        ).join(', ');

        const chance = Math.max(
          existing?.chance ?? 0,
          versionDetail.max_chance
        );

        if (existing) {
          existing.methods = Array.from(
            new Set([...existing.methods, ...methods])
          );
          existing.levels = Array.from(
            new Set([...existing.levels.split(', '), ...levels.split(', ')])
          ).join(', ');
          existing.chance = chance;
        } else {
          locations.set(location, {
            location,
            methods,
            levels,
            chance,
          });
        }
      }
    }

    return Array.from(versions.entries())
      .map(([version, locations]) => ({
        version,
        locations: Array.from(locations.values()).sort((a, b) =>
          a.location.localeCompare(b.location)
        ),
      }))
      .sort((a, b) => a.version.localeCompare(b.version));
  })();

  cache.set(id, promise);
  promise.catch(() => cache.delete(id));
  return promise;
}

export async function getVersionGroupVersions(
  versionGroup: string
): Promise<string[]> {
  const cached = versionGroupCache.get(versionGroup);
  if (cached) return cached;

  const promise = (async () => {
    try {
      const response = await fetch(
        `${POKEAPI_BASE}/version-group/${versionGroup}`,
        {
          next: { revalidate: REVALIDATE_SECONDS },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        }
      );

      if (!response.ok) return [];

      const data = (await response.json()) as VersionGroupResponse;
      return data.versions.map((version) => version.name);
    } catch {
      return [];
    }
  })();

  versionGroupCache.set(versionGroup, promise);
  promise.catch(() => versionGroupCache.delete(versionGroup));
  return promise;
}
