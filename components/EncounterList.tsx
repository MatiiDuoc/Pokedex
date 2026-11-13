import { ExternalLink, MapPin } from 'lucide-react';
import versionNamesEs from '@/lib/version-names-es.json';
import { formatPokemonName } from '@/lib/pokemon';
import type { VersionEncounters } from '@/services/pokemonEncounters';
import type { WikidexFallback } from '@/services/wikidexEncounters';

const VERSION_NAMES_ES = versionNamesEs as Record<string, string>;

interface EncounterListProps {
  encounters: VersionEncounters[];
  alternative?: WikidexFallback | null;
}

function getVersionLabel(version: string): string {
  const label = VERSION_NAMES_ES[version] ?? formatPokemonName(version);
  return version.endsWith('-japan') ? `${label} (Japón)` : label;
}

function WikidexVersions({ alternative }: { alternative: WikidexFallback }) {
  return (
    <div className="mt-3 space-y-2">
      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
        <p className="text-xs font-black uppercase tracking-wide text-indigo-700">
          Datos alternativos en español
        </p>
        <p className="mt-1 text-xs text-indigo-900">
          PokeAPI no tiene encuentros para estos juegos. La información
          siguiente procede de WikiDex.
        </p>
      </div>

      {alternative.versions.map((group) => (
        <details
          key={group.version}
          className="group rounded-xl border border-gray-200 bg-gray-50 p-3"
          open
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <MapPin className="h-4 w-4 text-red-500" />
              {getVersionLabel(group.version)}
            </span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-gray-500">
              {group.entries.length} dato
              {group.entries.length === 1 ? '' : 's'}
            </span>
          </summary>

          <ul className="mt-3 space-y-1.5">
            {group.entries.map((entry, index) => (
              <li
                key={`${group.version}-${entry.method}-${index}`}
                className="rounded-lg bg-white px-2.5 py-2"
              >
                <p className="text-[10px] font-black uppercase tracking-wide text-indigo-600">
                  {entry.method}
                </p>
                <p className="mt-0.5 text-xs text-gray-700">
                  {entry.details || 'Disponible en este juego.'}
                </p>
              </li>
            ))}
          </ul>
        </details>
      ))}

      <a
        href={alternative.pageUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
      >
        Ver la ficha completa en WikiDex
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

export default function EncounterList({
  encounters,
  alternative,
}: EncounterListProps) {
  if (encounters.length === 0) {
    if (alternative && alternative.versions.length > 0) {
      return <WikidexVersions alternative={alternative} />;
    }

    return (
      <p className="mt-3 rounded-xl bg-gray-50 p-4 text-sm text-gray-600">
        No hay datos de encuentros salvajes para este Pokémon en PokeAPI. Puede
        requerir intercambio, evento, evolución o crianza.
      </p>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      {encounters.map((group) => (
        <details
          key={group.version}
          className="group rounded-xl border border-gray-200 bg-gray-50 p-3"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-bold text-gray-800">
              <MapPin className="h-4 w-4 text-red-500" />
              {getVersionLabel(group.version)}
            </span>
            <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-gray-500">
              {group.locations.length} zona
              {group.locations.length === 1 ? '' : 's'}
            </span>
          </summary>

          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {group.locations.slice(0, 30).map((location) => (
              <li
                key={`${group.version}-${location.locationId}`}
                className="rounded-lg bg-white px-2.5 py-2"
              >
                <p className="text-xs font-bold text-gray-900">
                  {location.location}
                </p>
                <p className="mt-0.5 text-[10px] text-gray-500">
                  {location.methods.join(', ')} · Nv. {location.levels} ·{' '}
                  {location.chance}%
                </p>
              </li>
            ))}
          </ul>

          {group.locations.length > 30 && (
            <p className="mt-2 text-[10px] font-semibold text-gray-400">
              +{group.locations.length - 30} zonas más
            </p>
          )}
        </details>
      ))}
    </div>
  );
}
