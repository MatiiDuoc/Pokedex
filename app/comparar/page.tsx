import type { Metadata } from 'next';
import Link from 'next/link';
import { GitCompare } from 'lucide-react';
import {
  TYPE_COLORS,
  TYPE_GRADIENTS,
  formatPokemonName,
  getLegendaryLabel,
  getStatLabel,
  getTypeLabel,
} from '@/lib/pokemon';
import { getPokemonIndex } from '@/services/pokedexIndex';
import { getPokemonDetail, type PokemonDetail } from '@/services/pokemonDetail';

export const metadata: Metadata = {
  title: 'Comparar Pokémon',
  description:
    'Compara estadísticas, tipos, habilidades y totals de dos Pokémon lado a lado.',
  alternates: {
    canonical: '/comparar',
  },
};

interface ComparePageProps {
  searchParams: Promise<{ a?: string; b?: string }>;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function resolveId(
  index: Awaited<ReturnType<typeof getPokemonIndex>>,
  value: string | undefined
): number | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) {
    const id = Number.parseInt(trimmed, 10);
    return index.some((entry) => entry.id === id) ? id : null;
  }

  const target = normalize(trimmed);
  const exact = index.find((entry) => normalize(entry.name) === target);
  if (exact) return exact.id;

  const partial = index.find((entry) => normalize(entry.name).includes(target));
  return partial?.id ?? null;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const [{ a, b }, index] = await Promise.all([searchParams, getPokemonIndex()]);
  const idA = resolveId(index, a);
  const idB = resolveId(index, b);

  const [first, second] = await Promise.all([
    idA ? getPokemonDetail(idA) : Promise.resolve(null),
    idB ? getPokemonDetail(idB) : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="text-center">
          <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-600">
            <GitCompare className="h-4 w-4" />
            Comparador
          </p>
          <h1 className="mt-2 text-4xl font-black text-gray-900">
            Compara dos Pokémon
          </h1>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-gray-600">
            Estadísticas base, tipos, habilidades, altura, peso y total. Escribe
            el nombre o el número de Pokédex.
          </p>
        </div>

        <form
          action="/comparar"
          className="mx-auto mt-6 grid max-w-3xl gap-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <div>
            <label htmlFor="compare-a" className="sr-only">
              Primer Pokémon
            </label>
            <input
              id="compare-a"
              name="a"
              list="pokemon-options"
              defaultValue={a ?? ''}
              placeholder="Pokémon 1..."
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label htmlFor="compare-b" className="sr-only">
              Segundo Pokémon
            </label>
            <input
              id="compare-b"
              name="b"
              list="pokemon-options"
              defaultValue={b ?? ''}
              placeholder="Pokémon 2..."
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-indigo-700"
          >
            Comparar
          </button>
        </form>

        <datalist id="pokemon-options">
          {index.map((entry) => (
            <option key={entry.id} value={entry.name}>
              {`#${entry.id.toString().padStart(4, '0')} ${formatPokemonName(entry.name)}`}
            </option>
          ))}
        </datalist>

        {!first && !second ? (
          <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-4xl" aria-hidden="true">
              ⚖️
            </p>
            <p className="mt-3 font-bold text-gray-900">
              Elige dos Pokémon para empezar
            </p>
            <p className="mt-1 text-sm text-gray-600">
              Prueba con “pikachu” y “charizard”, o con “25” y “6”.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {first ? (
              <ComparisonCard detail={first} other={second} />
            ) : (
              <EmptySlot label="Primer Pokémon no encontrado" />
            )}
            {second ? (
              <ComparisonCard detail={second} other={first} />
            ) : (
              <EmptySlot label="Segundo Pokémon no encontrado" />
            )}
          </div>
        )}

        {first && second && (
          <div className="mt-6 rounded-2xl border border-indigo-200 bg-indigo-50 p-5 text-sm text-indigo-900">
            <strong>Resumen:</strong> {formatPokemonName(first.name)} suma{' '}
            {first.stats.reduce((total, stat) => total + stat.value, 0)} puntos de
            estadísticas base frente a{' '}
            {second.stats.reduce((total, stat) => total + stat.value, 0)} de{' '}
            {formatPokemonName(second.name)}.
          </div>
        )}
      </div>
    </div>
  );
}

function ComparisonCard({
  detail,
  other,
}: {
  detail: PokemonDetail;
  other: PokemonDetail | null;
}) {
  const gradient =
    TYPE_GRADIENTS[detail.types[0] ?? 'normal'] ?? 'from-indigo-500 to-purple-600';
  const total = detail.stats.reduce((sum, stat) => sum + stat.value, 0);
  const otherTotal = other
    ? other.stats.reduce((sum, stat) => sum + stat.value, 0)
    : null;
  const legendaryLabel = getLegendaryLabel(detail.legendaryCategory);

  const otherStats = new Map(
    (other?.stats ?? []).map((stat) => [stat.name, stat.value])
  );

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className={`bg-gradient-to-br ${gradient} p-5 text-white`}>
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={detail.artworkUrl}
            alt={formatPokemonName(detail.name)}
            className="h-28 w-28 object-contain drop-shadow-xl"
          />
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-white/70">
              #{detail.id.toString().padStart(4, '0')}
            </p>
            <h2 className="text-2xl font-black">{formatPokemonName(detail.name)}</h2>
            <div className="mt-2 flex flex-wrap gap-1">
              {detail.types.map((type) => (
                <span
                  key={type}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase text-white ${
                    TYPE_COLORS[type] ?? 'bg-gray-400'
                  }`}
                >
                  {getTypeLabel(type)}
                </span>
              ))}
            </div>
            {legendaryLabel && (
              <span className="mt-2 inline-block rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold">
                {legendaryLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-5">
        <dl className="space-y-3">
          {detail.stats.map((stat) => {
            const otherValue = otherStats.get(stat.name);
            const better =
              otherValue !== undefined && stat.value > otherValue
                ? 'text-green-600'
                : otherValue !== undefined && stat.value < otherValue
                  ? 'text-red-500'
                  : 'text-gray-900';
            return (
              <div key={stat.name}>
                <div className="flex justify-between text-xs font-semibold text-gray-600">
                  <span>{getStatLabel(stat.name)}</span>
                  <span className={`font-black ${better}`}>
                    {stat.value}
                    {otherValue !== undefined && (
                      <span className="ml-1 font-semibold text-gray-400">
                        / {otherValue}
                      </span>
                    )}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${Math.min(100, (stat.value / 255) * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </dl>

        <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-sm">
          <span className="font-semibold text-gray-600">Total</span>
          <span className="font-black text-gray-900">
            {total}
            {otherTotal !== null && (
              <span className="ml-1 font-semibold text-gray-400">/ {otherTotal}</span>
            )}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-gray-50 p-2">
            <p className="text-gray-500">Altura</p>
            <p className="font-bold text-gray-900">
              {(detail.height / 10).toFixed(1)} m
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-2">
            <p className="text-gray-500">Peso</p>
            <p className="font-bold text-gray-900">
              {(detail.weight / 10).toFixed(1)} kg
            </p>
          </div>
        </div>

        <div className="mt-3">
          <p className="text-xs font-bold text-gray-500">Habilidades</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {detail.abilities.map((ability) => (
              <span
                key={ability.name}
                className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-700"
              >
                {formatPokemonName(ability.name)}
                {ability.isHidden ? ' (oculta)' : ''}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <Link
            href={`/pokedex/${detail.id}`}
            className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-center text-xs font-bold text-gray-800 transition hover:bg-gray-200"
          >
            Ver ficha
          </Link>
          <Link
            href={`/comparar?a=${detail.name}`}
            className="flex-1 rounded-lg bg-indigo-50 px-3 py-2 text-center text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
          >
            Comparar otro
          </Link>
        </div>
      </div>
    </article>
  );
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white p-6 text-center text-sm font-semibold text-gray-400">
      {label}
    </div>
  );
}
