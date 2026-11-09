import Link from 'next/link';
import HomeSearch from '@/components/HomeSearch';

interface HomeHeroProps {
  featuredId: number | null;
  featuredName: string;
  featuredArtwork: string;
  totalPokemon: number;
  totalGuides: number;
  mainGuides: number;
  spinOffGuides: number;
}

export default function HomeHero({
  featuredId,
  featuredName,
  featuredArtwork,
  totalPokemon,
  totalGuides,
  mainGuides,
  spinOffGuides,
}: HomeHeroProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-red-950 to-indigo-950 px-4 pb-16 pt-14 text-white">
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-red-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-0 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white/80">
              <span className="h-2 w-2 rounded-full bg-red-400" />
              Pokédex + Guías
            </p>

            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              Tu centro de mando para{' '}
              <span className="bg-gradient-to-r from-red-300 to-amber-200 bg-clip-text text-transparent">
                completar todos los Pokémon
              </span>
            </h1>

            <p className="mt-4 max-w-2xl text-base text-white/75 sm:text-lg">
              Busca entre {totalPokemon} especies, sigue {totalGuides} guías de
              juegos principales y spin-offs, marca tu progreso y monta tu equipo
              sin perder de vista la Pokédex.
            </p>

            <div className="mt-7">
              <HomeSearch />
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/pokedex"
                className="rounded-xl bg-white px-5 py-3 text-sm font-black text-gray-900 shadow-lg transition hover:bg-red-50"
              >
                Explorar Pokédex
              </Link>
              <Link
                href="/guias"
                className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/20"
              >
                Ver guías
              </Link>
              <Link
                href="/cuenta"
                className="rounded-xl border border-white/25 bg-transparent px-5 py-3 text-sm font-black text-white/90 transition hover:bg-white/10"
              >
                Mi progreso
              </Link>
            </div>
          </div>

          <div className="relative mx-auto hidden w-full max-w-md lg:block">
            <div className="absolute inset-6 rounded-full bg-gradient-to-br from-red-400/30 to-indigo-400/30 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-white/60">
                <span>Pokémon destacado</span>
                <span>{featuredId ? `#${featuredId.toString().padStart(4, '0')}` : '★'}</span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featuredArtwork}
                alt={featuredName}
                loading="eager"
                fetchPriority="high"
                className="mx-auto mt-2 h-64 w-64 object-contain drop-shadow-2xl"
              />
              <p className="text-center text-lg font-black">{featuredName}</p>
              <p className="mt-1 text-center text-xs text-white/60">
                Legendarios, míticos, ultraentes y shinies incluidos
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <HeroStat label="Especies nacionales" value={totalPokemon} />
          <HeroStat label="Guías totales" value={totalGuides} />
          <HeroStat label="Juegos principales" value={mainGuides} />
          <HeroStat label="Spin-offs" value={spinOffGuides} />
        </div>
      </div>
    </section>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-xs font-semibold uppercase tracking-wide text-white/55">
        {label}
      </p>
    </div>
  );
}
