import { writeFile } from 'node:fs/promises';

const BASE =
  'https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv';

async function fetchCsv(name) {
  const response = await fetch(`${BASE}/${name}`);
  if (!response.ok) throw new Error(`No se pudo descargar ${name}`);
  return (await response.text()).trim().split('\n').slice(1);
}

const [versions, versionNames, languages] = await Promise.all([
  fetchCsv('versions.csv'),
  fetchCsv('version_names.csv'),
  fetchCsv('languages.csv'),
]);

const spanishLanguageId = languages
  .map((line) => line.split(','))
  .find(([, identifier]) => identifier === 'es')?.[0];

if (!spanishLanguageId) {
  throw new Error('No se encontró el idioma español en languages.csv');
}

const versionSlugs = new Map(
  versions.map((line) => {
    const [id, , identifier] = line.split(',');
    return [id, identifier];
  })
);

const translations = new Map();

for (const line of versionNames) {
  const [versionId, languageId, ...nameParts] = line.split(',');
  if (languageId !== spanishLanguageId) continue;

  const slug = versionSlugs.get(versionId);
  const name = nameParts
    .join(',')
    .trim()
    .replace(/^"|"$/g, '')
    .replace(/""/g, '"');
  if (!slug || !name) continue;

  translations.set(slug, name);
}

const ordered = Object.fromEntries(
  Array.from(translations.entries()).sort(([a], [b]) => a.localeCompare(b))
);

await writeFile(
  'lib/version-names-es.json',
  `${JSON.stringify(ordered, null, 0)}\n`,
  'utf8'
);

console.log(
  `Generadas ${translations.size} versiones en lib/version-names-es.json`
);
