import { MapPin } from 'lucide-react';
import versionNamesEs from '@/lib/version-names-es.json';
import { formatPokemonName } from '@/lib/pokemon';
import type { VersionEncounters } from '@/services/pokemonEncounters';

const VERSION_NAMES_ES = versionNamesEs as Record<string, string>;

interface EncounterListProps {
  encounters: VersionEncounters[];
}

function getVersionLabel(version: string): string {
  const label = VERSION_NAMES_ES[version] ?? formatPokemonName(version);
  return version.endsWith('-japan') ? `${label} (Japón)` : label;
}

export default function EncounterList({ encounters }: EncounterListProps) {
  if (encounters.length === 0) {
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
                key={`${group.version}-${location.location}`}
                className="rounded-lg bg-white px-2.5 py-2"
              >
                <p className="text-xs font-bold text-gray-900">
                  {formatPokemonName(location.location)}
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
