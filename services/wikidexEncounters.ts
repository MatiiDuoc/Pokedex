const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const WIKIDEX_API = 'https://wikidex.net/api.php';
const REVALIDATE_SECONDS = 60 * 60 * 24 * 7;
const TIMEOUT_MS = 12_000;
const USER_AGENT =
  'PokedexGuias/1.0 (+https://pokedex-guias.vercel.app)';

interface NamedLanguage {
  name: string;
}

interface SpeciesNamesResponse {
  name: string;
  names: Array<{ name: string; language: NamedLanguage }>;
}

interface WikidexParseResponse {
  parse?: {
    title?: string;
    wikitext?: { '*': string };
  };
  error?: { code: string; info: string };
}

export interface WikidexEncounterEntry {
  method: string;
  details: string;
}

export interface WikidexVersionEncounters {
  version: string;
  entries: WikidexEncounterEntry[];
}

export interface WikidexFallback {
  source: 'WikiDex';
  pageTitle: string;
  pageUrl: string;
  versions: WikidexVersionEncounters[];
}

interface VersionKey {
  version: string;
  key: string;
}

const VERSION_GROUP_KEYS: Record<string, VersionKey[]> = {
  'red-blue': [
    { version: 'red', key: 'rojo' },
    { version: 'blue', key: 'azul' },
    { version: 'green-japan', key: 'verde' },
  ],
  yellow: [{ version: 'yellow', key: 'amarillo' }],
  'gold-silver': [
    { version: 'gold', key: 'oro' },
    { version: 'silver', key: 'plata' },
  ],
  crystal: [{ version: 'crystal', key: 'cristal' }],
  'ruby-sapphire': [
    { version: 'ruby', key: 'rubí' },
    { version: 'sapphire', key: 'zafiro' },
  ],
  emerald: [{ version: 'emerald', key: 'esmeralda' }],
  'firered-leafgreen': [
    { version: 'firered', key: 'rojofuego' },
    { version: 'leafgreen', key: 'verdehoja' },
  ],
  'diamond-pearl': [
    { version: 'diamond', key: 'diamante' },
    { version: 'pearl', key: 'perla' },
  ],
  platinum: [{ version: 'platinum', key: 'platino' }],
  'heartgold-soulsilver': [
    { version: 'heartgold', key: 'oro heartgold' },
    { version: 'soulsilver', key: 'plata soulsilver' },
  ],
  'black-white': [
    { version: 'black', key: 'negro' },
    { version: 'white', key: 'blanco' },
  ],
  'black-2-white-2': [
    { version: 'black-2', key: 'negro 2' },
    { version: 'white-2', key: 'blanco 2' },
  ],
  'x-y': [
    { version: 'x', key: 'x' },
    { version: 'y', key: 'y' },
  ],
  'omega-ruby-alpha-sapphire': [
    { version: 'omega-ruby', key: 'rubí omega' },
    { version: 'alpha-sapphire', key: 'zafiro alfa' },
  ],
  'sun-moon': [
    { version: 'sun', key: 'sol' },
    { version: 'moon', key: 'luna' },
  ],
  'ultra-sun-ultra-moon': [
    { version: 'ultra-sun', key: 'ultrasol' },
    { version: 'ultra-moon', key: 'ultraluna' },
  ],
  'lets-go-pikachu-lets-go-eevee': [
    { version: 'lets-go-pikachu', key: 'lgp' },
    { version: 'lets-go-eevee', key: 'lge' },
  ],
  'sword-shield': [
    { version: 'sword', key: 'espada' },
    { version: 'shield', key: 'escudo' },
  ],
  'brilliant-diamond-shining-pearl': [
    { version: 'brilliant-diamond', key: 'diamante brillante' },
    { version: 'shining-pearl', key: 'perla reluciente' },
  ],
  'legends-arceus': [
    { version: 'legends-arceus', key: 'leyendas Arceus' },
  ],
  'scarlet-violet': [
    { version: 'scarlet', key: 'escarlata' },
    { version: 'violet', key: 'púrpura' },
  ],
  'legends-za': [{ version: 'legends-za', key: 'leyendas ZA' }],
  'the-isle-of-armor': [
    { version: 'the-isle-of-armor-sword', key: 'espada' },
    { version: 'the-isle-of-armor-shield', key: 'escudo' },
  ],
  'the-crown-tundra': [
    { version: 'the-crown-tundra-sword', key: 'espada' },
    { version: 'the-crown-tundra-shield', key: 'escudo' },
  ],
  'the-teal-mask': [
    { version: 'the-teal-mask-scarlet', key: 'escarlata' },
    { version: 'the-teal-mask-violet', key: 'púrpura' },
  ],
  'the-indigo-disk': [
    { version: 'the-indigo-disk-scarlet', key: 'escarlata' },
    { version: 'the-indigo-disk-violet', key: 'púrpura' },
  ],
  'mega-dimension': [{ version: 'mega-dimension', key: 'leyendas ZA' }],
};

const MAIN_VERSION_GROUPS = [
  'red-blue',
  'yellow',
  'gold-silver',
  'crystal',
  'ruby-sapphire',
  'emerald',
  'firered-leafgreen',
  'diamond-pearl',
  'platinum',
  'heartgold-soulsilver',
  'black-white',
  'black-2-white-2',
  'x-y',
  'omega-ruby-alpha-sapphire',
  'sun-moon',
  'ultra-sun-ultra-moon',
  'lets-go-pikachu-lets-go-eevee',
  'sword-shield',
  'brilliant-diamond-shining-pearl',
  'legends-arceus',
  'scarlet-violet',
  'legends-za',
];

const speciesNameCache = new Map<number, Promise<string | null>>();
const fallbackCache = new Map<string, Promise<WikidexFallback | null>>();

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanWikiText(value: string): string {
  let text = value;

  text = text.replace(/<!--[\s\S]*?-->/g, ' ');
  text = text.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, ' ');
  text = text.replace(/<ref[^>]*\/>/gi, ' ');

  for (let index = 0; index < 6; index += 1) {
    const next = text.replace(/\{\{[^{}]*\}\}/g, ' ');
    if (next === text) break;
    text = next;
  }

  text = text.replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2');
  text = text.replace(/\[\[([^\]]*)\]\]/g, '$1');
  text = text.replace(/\[https?:\/\/[^\s\]]+\s*([^\]]*)\]/g, '$1');
  text = text.replace(/'''?/g, '');
  text = text.replace(/<[^>]+>/g, ' ');
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  text = text.replace(/\s+/g, ' ').trim();

  return text.replace(/^[:\-–—\s]+/, '').trim();
}

function extractLocalizacionTemplate(wikitext: string): string | null {
  const match = /\{\{\s*Localizaci[oó]n\b/i.exec(wikitext);
  if (!match) return null;

  const start = match.index;
  let depth = 0;

  for (let index = start; index < wikitext.length - 1; index += 1) {
    if (wikitext[index] === '{' && wikitext[index + 1] === '{') {
      depth += 1;
      index += 1;
      continue;
    }

    if (wikitext[index] === '}' && wikitext[index + 1] === '}') {
      depth -= 1;
      index += 1;

      if (depth === 0) {
        return wikitext.slice(start, index + 1);
      }
    }
  }

  return null;
}

function parseTemplateParams(template: string): Map<string, string> {
  const params = new Map<string, string>();
  const body = template.replace(/^\{\{[^|]*/, '').replace(/\}\}$/, '');
  let currentKey: string | null = null;

  for (const line of body.split('\n')) {
    const match = /^\s*\|\s*([^=|]+?)\s*=(.*)$/.exec(line);

    if (match) {
      currentKey = normalizeKey(match[1]);
      params.set(currentKey, match[2].trim());
      continue;
    }

    if (currentKey) {
      params.set(currentKey, `${params.get(currentKey) ?? ''}\n${line}`.trim());
    }
  }

  return params;
}

function resolveParam(
  params: Map<string, string>,
  key: string,
  seen = new Set<string>()
): string {
  const normalized = normalizeKey(key);
  const value = params.get(normalized);
  if (!value) return '';

  const alias = normalizeKey(value);
  if (
    alias !== normalized &&
    params.has(alias) &&
    !seen.has(alias) &&
    !value.includes('\n') &&
    !value.includes('*')
  ) {
    seen.add(alias);
    return resolveParam(params, alias, seen);
  }

  return value;
}

function parseEntries(value: string): WikidexEncounterEntry[] {
  const entries: WikidexEncounterEntry[] = [];

  for (const rawLine of value.split('\n')) {
    const line = rawLine.trim();
    if (!line.startsWith('*')) continue;

    let body = line.replace(/^\*+\s*/, '');
    let method = 'Encuentro';

    const label =
      /^'''\s*(?:\[\[[^\]|]*\|([^\]]+)\]\]|([^':]+?))\s*:?\s*'''\s*:?/.exec(
        body
      );

    if (label) {
      method = cleanWikiText(label[1] ?? label[2] ?? 'Encuentro');
      body = body.slice(label[0].length);
    } else {
      const colon = body.indexOf(':');
      const prefix = colon > 0 ? body.slice(0, colon) : '';
      if (
        colon > 0 &&
        colon < 70 &&
        prefix !== '' &&
        !prefix.includes('[[') &&
        !prefix.includes(']]')
      ) {
        method = cleanWikiText(prefix);
        body = body.slice(colon + 1);
      }
    }

    const details = cleanWikiText(body);
    if (details === '' && method === 'Encuentro') continue;

    const entry = { method, details };
    if (
      !entries.some(
        (existing) =>
          existing.method === entry.method &&
          existing.details === entry.details
      )
    ) {
      entries.push(entry);
    }
  }

  return entries;
}

async function fetchSpanishName(id: number): Promise<string | null> {
  const cached = speciesNameCache.get(id);
  if (cached) return cached;

  const promise = (async () => {
    try {
      const response = await fetch(`${POKEAPI_BASE}/pokemon-species/${id}`, {
        next: { revalidate: REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });

      if (!response.ok) return null;

      const data = (await response.json()) as SpeciesNamesResponse;
      return (
        data.names.find((entry) => entry.language.name === 'es')?.name ??
        data.name
      );
    } catch {
      return null;
    }
  })();

  speciesNameCache.set(id, promise);
  void promise
    .then((name) => {
      if (!name) speciesNameCache.delete(id);
    })
    .catch(() => {});
  promise.catch(() => speciesNameCache.delete(id));
  return promise;
}

async function fetchWikitext(
  pokemonName: string
): Promise<{ title: string; wikitext: string } | null> {
  try {
    const url = `${WIKIDEX_API}?action=parse&format=json&prop=wikitext&redirects=1&page=${encodeURIComponent(
      pokemonName
    )}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as WikidexParseResponse;
    const wikitext = data.parse?.wikitext?.['*'];
    if (!wikitext) return null;

    return {
      title: data.parse?.title ?? pokemonName,
      wikitext,
    };
  } catch {
    return null;
  }
}

/**
 * Obtiene una alternativa en español desde WikiDex para Pokémon o juegos que
 * PokeAPI no cubre (por ejemplo, Leyendas: Arceus o Escarlata/Púrpura).
 */
export async function getWikidexFallback(
  id: number,
  versionGroup?: string
): Promise<WikidexFallback | null> {
  const cacheKey = `${id}:${versionGroup ?? 'all'}`;
  const cached = fallbackCache.get(cacheKey);
  if (cached) return cached;

  const promise = (async () => {
    const pokemonName = await fetchSpanishName(id);
    if (!pokemonName) return null;

    const page = await fetchWikitext(pokemonName);
    if (!page) return null;

    const template = extractLocalizacionTemplate(page.wikitext);
    if (!template) return null;

    const params = parseTemplateParams(template);
    const groups = versionGroup
      ? [versionGroup]
      : MAIN_VERSION_GROUPS;
    const versions: WikidexVersionEncounters[] = [];
    const seenVersions = new Set<string>();

    for (const group of groups) {
      const versionKeys = VERSION_GROUP_KEYS[group];
      if (!versionKeys) continue;

      for (const { version, key } of versionKeys) {
        if (seenVersions.has(version)) continue;
        seenVersions.add(version);

        const value = resolveParam(params, key);
        const entries = parseEntries(value);
        if (entries.length > 0) {
          versions.push({ version, entries });
        }
      }
    }

    if (versions.length === 0) return null;

    return {
      source: 'WikiDex' as const,
      pageTitle: page.title,
      pageUrl: `https://wikidex.net/wiki/${encodeURIComponent(
        page.title.replace(/ /g, '_')
      )}`,
      versions,
    };
  })();

  fallbackCache.set(cacheKey, promise);
  void promise
    .then((fallback) => {
      if (!fallback) fallbackCache.delete(cacheKey);
    })
    .catch(() => {});
  promise.catch(() => fallbackCache.delete(cacheKey));
  return promise;
}
