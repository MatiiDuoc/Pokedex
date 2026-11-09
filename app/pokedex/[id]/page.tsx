import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import EvolutionTree from '@/components/EvolutionTree';
import PokemonDetailHero from '@/components/PokemonDetailHero';
import TypeMatchupList from '@/components/TypeMatchupList';
import { getSiteUrl } from '@/lib/site';
import {
  TYPE_COLORS,
  formatPokemonName,
  getLegendaryLabel,
  getStatLabel,
  getTypeLabel,
} from '@/lib/pokemon';
import { getPokemonDetail } from '@/services/pokemonDetail';

export const revalidate = 604800;

interface PokemonPageProps {
  params: Promise<{ id: string }>;
}

function parseId(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id >= 1 && id <= 1025 ? id : null;
}

export async function generateMetadata({
  params,
}: PokemonPageProps): Promise<Metadata> {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (!id) redirect('/pokedex');

  const detail = await getPokemonDetail(id);
  if (!detail) redirect('/pokedex');

  const displayName = formatPokemonName(detail.name);
  const types = detail.types.map(getTypeLabel).join(' / ');
  const description = `${
    detail.flavorText || `${displayName} es un Pokémon de tipo ${types}.`
  } Estadísticas, habilidades, evolución, debilidades y visor 3D.`;

  return {
    title: `${displayName} #${detail.id.toString().padStart(4, '0')}`,
    description,
    alternates: {
      canonical: `/pokedex/${detail.id}`,
    },
    openGraph: {
      title: `${displayName} | Pokédex + Guías`,
      description,
      images: [
        {
          url: detail.artworkUrl,
          width: 475,
          height: 475,
          alt: displayName,
        },
      ],
    },
  };
}

export default async function PokemonDetailPage({ params }: PokemonPageProps) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (!id) redirect('/pokedex');

  const detail = await getPokemonDetail(id);
  if (!detail) redirect('/pokedex');

  const displayName = formatPokemonName(detail.name);
  const legendaryLabel = getLegendaryLabel(detail.legendaryCategory);
  const totalStats = detail.stats.reduce((total, stat) => total + stat.value, 0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Thing',
    name: displayName,
    description: detail.flavorText,
    image: detail.artworkUrl,
    url: `${getSiteUrl()}/pokedex/${detail.id}`,
    additionalType: 'https://schema.org/VideoGame',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <nav aria-label="Migas de pan" className="mb-4 text-sm text-gray-500">
          <Link href="/pokedex" className="font-semibold hover:text-red-600">
            Pokédex
          </Link>
          <span className="mx-2 text-gray-300">/</span>
          <span>
            #{detail.id.toString().padStart(4, '0')}
          </span>
          <span className="mx-2 text-gray-300">/</span>
          <span className="font-semibold text-gray-800">{displayName}</span>
        </nav>

        <PokemonDetailHero
          id={detail.id}
          name={detail.name}
          types={detail.types}
          artworkUrl={detail.artworkUrl}
          shinyArtworkUrl={detail.shinyArtworkUrl}
          height={detail.height}
          weight={detail.weight}
          generation={detail.generation}
          legendaryCategory={detail.legendaryCategory}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-gray-900">
                Entrada de la Pokédex
              </h2>
              {detail.genus && (
                <p className="mt-1 text-sm font-bold text-red-600">
                  {detail.genus}
                </p>
              )}
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {detail.flavorText ||
                  'No hay descripción disponible para este Pokémon.'}
              </p>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-end justify-between gap-3">
                <h2 className="text-xl font-black text-gray-900">
                  Estadísticas base
                </h2>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-black text-gray-800">
                  Total {totalStats}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {detail.stats.map((stat) => {
                  const percentage = Math.min(100, (stat.value / 255) * 100);
                  return (
                    <div key={stat.name} className="rounded-xl bg-gray-50 p-3">
                      <div className="flex justify-between text-xs font-semibold text-gray-600">
                        <span>{getStatLabel(stat.name)}</span>
                        <span className="text-gray-900">{stat.value}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className={`h-full rounded-full ${
                            stat.value >= 100
                              ? 'bg-green-500'
                              : stat.value >= 60
                                ? 'bg-blue-500'
                                : 'bg-red-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-black text-gray-900">
                Debilidades y resistencias
              </h2>
              <p className="mb-4 mt-1 text-sm text-gray-600">
                Calculado con los tipos {detail.types.map(getTypeLabel).join(' / ')}.
              </p>
              <TypeMatchupList types={detail.types} />
            </section>

            {detail.evolutionTree && (
              <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-xl font-black text-gray-900">
                  Línea evolutiva
                </h2>
                <p className="mb-4 mt-1 text-sm text-gray-600">
                  Pulsa cualquier evolución para abrir su ficha.
                </p>
                <EvolutionTree
                  node={detail.evolutionTree}
                  currentId={detail.id}
                />
              </section>
            )}
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-gray-900">Habilidades</h2>
              <ul className="mt-3 space-y-2">
                {detail.abilities.map((ability) => (
                  <li
                    key={ability.name}
                    className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 px-3 py-2"
                  >
                    <span className="text-sm font-semibold text-gray-800">
                      {formatPokemonName(ability.name)}
                    </span>
                    {ability.isHidden && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                        Oculta
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-gray-900">Datos</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <InfoRow label="Número" value={`#${detail.id.toString().padStart(4, '0')}`} />
                <InfoRow label="Generación" value={String(detail.generation)} />
                <InfoRow label="Altura" value={`${(detail.height / 10).toFixed(1)} m`} />
                <InfoRow label="Peso" value={`${(detail.weight / 10).toFixed(1)} kg`} />
                {detail.genus && <InfoRow label="Categoría" value={detail.genus} />}
                {legendaryLabel && (
                  <InfoRow label="Clasificación" value={legendaryLabel} />
                )}
              </dl>
              <div className="mt-4 flex flex-wrap gap-2">
                {detail.types.map((type) => (
                  <span
                    key={type}
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase text-white ${
                      TYPE_COLORS[type] ?? 'bg-gray-400'
                    }`}
                  >
                    {getTypeLabel(type)}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-gray-900">Acciones</h2>
              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href="/equipo"
                  className="rounded-xl bg-red-600 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-red-700"
                >
                  Abrir Team Builder
                </Link>
                <Link
                  href="/pokedex"
                  className="rounded-xl bg-gray-100 px-4 py-3 text-center text-sm font-bold text-gray-800 transition hover:bg-gray-200"
                >
                  Volver a la Pokédex
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="text-right font-semibold text-gray-900">{value}</dd>
    </div>
  );
}
