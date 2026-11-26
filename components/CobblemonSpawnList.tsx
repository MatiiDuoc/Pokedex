import { Clock3, CloudRain, Layers, MapPin, Mountain, Users } from 'lucide-react';
import {
  cobblemonBucketClass,
  describeCobblemonWeather,
  formatCobblemonBiome,
  formatCobblemonBucket,
  formatCobblemonForm,
  formatCobblemonHerdPokemon,
  formatCobblemonLevel,
  formatCobblemonPosition,
  formatCobblemonStructure,
  formatCobblemonTime,
} from '@/lib/cobblemon-spawns';
import type { CobblemonSpawn } from '@/types/cobblemon';

interface CobblemonSpawnListProps {
  spawns: CobblemonSpawn[];
}

export default function CobblemonSpawnList({
  spawns,
}: CobblemonSpawnListProps) {
  const seen = new Set<string>();
  const uniqueSpawns = spawns.filter((spawn) => {
    const key = JSON.stringify(spawn);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (uniqueSpawns.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        Cobblemon 1.8.4 no registra spawns naturales para esta especie en sus
        datos base. Puede aparecer con los addons de Cobbleverse, por
        evolución/intercambio/raid o en hábitats construidos por el jugador.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {uniqueSpawns.map((spawn, index) => {
        const level = formatCobblemonLevel(spawn.level);
        const time = formatCobblemonTime(spawn.time);
        const weather = describeCobblemonWeather(spawn.weather);
        const structures = (spawn.structures ?? []).map(
          formatCobblemonStructure
        );

        return (
          <article
            key={`${spawn.bucket}-${spawn.level?.join('-') ?? 'any'}-${index}`}
            className="rounded-xl border border-gray-200 bg-gray-50 p-3"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${cobblemonBucketClass(
                  spawn.bucket
                )}`}
              >
                {formatCobblemonBucket(spawn.bucket)}
              </span>
              {level && <SpawnBadge>{level}</SpawnBadge>}
              {spawn.position && (
                <SpawnBadge>
                  <Mountain className="h-3 w-3" />
                  {formatCobblemonPosition(spawn.position)}
                </SpawnBadge>
              )}
              {spawn.form && (
                <SpawnBadge>
                  Forma {formatCobblemonForm(spawn.form)}
                </SpawnBadge>
              )}
            </div>

            {spawn.biomes && spawn.biomes.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {spawn.biomes.map((biome) => (
                  <span
                    key={biome}
                    className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-700 shadow-sm"
                  >
                    <MapPin className="h-3 w-3 text-red-500" />
                    {formatCobblemonBiome(biome)}
                  </span>
                ))}
              </div>
            )}

            {(time || weather || structures.length > 0) && (
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-gray-500">
                {time && (
                  <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    {time}
                  </span>
                )}
                {weather && (
                  <span className="inline-flex items-center gap-1">
                    <CloudRain className="h-3 w-3" />
                    {weather}
                  </span>
                )}
                {structures.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    Estructuras: {structures.join(', ')}
                  </span>
                )}
              </p>
            )}

            {spawn.herd && (
              <p className="mt-1 flex items-start gap-1 text-[10px] text-gray-500">
                <Users className="mt-0.5 h-3 w-3 flex-none" />
                <span>
                  Manada de hasta {spawn.herd.maxSize ?? '?'}:{' '}
                  {spawn.herd.members
                    .map((member) =>
                      [
                        formatCobblemonHerdPokemon(member.pokemon),
                        formatCobblemonLevel(member.level),
                      ]
                        .filter(Boolean)
                        .join(' ')
                    )
                    .join(', ')}
                </span>
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}

function SpawnBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-gray-600 shadow-sm">
      {children}
    </span>
  );
}
