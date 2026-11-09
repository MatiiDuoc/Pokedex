import type { Metadata } from 'next';
import Link from 'next/link';
import ContinueAdventure from '@/components/ContinueAdventure';
import HomeFeaturedPokemon from '@/components/HomeFeaturedPokemon';
import HomeGuides from '@/components/HomeGuides';
import HomeHero from '@/components/HomeHero';
import HomeLegendaryStrip, {
  type LegendaryPreview,
} from '@/components/HomeLegendaryStrip';
import HomeTeamCard from '@/components/HomeTeamCard';
import { games, getGameBySlug } from '@/data/games';
import { formatPokemonName } from '@/lib/pokemon';
import { getSiteUrl } from '@/lib/site';
import { getPokemonByIds } from '@/services/pokeapi';
import { getPokemonIndex } from '@/services/pokedexIndex';
import type { GameGuide } from '@/types/game';

// ISR: los datos cambian poco; regeneramos cada 24 horas.
export const revalidate = 86400;

const FEATURED_IDS = [
  25, 6, 150, 448, 133, 94, 149, 445, 778, 887, 1007, 1008, 1024, 1025,
];

const LEGENDARY_IDS = [
  150, 249, 250, 384, 483, 484, 487, 493, 643, 644, 716, 717, 718, 791, 792,
  800, 888, 889, 890, 1007, 1008, 1024,
];

const FEATURED_GUIDE_SLUGS = [
  'scarlet-violet',
  'legends-z-a',
  'legends-arceus',
  'sword-shield',
  'mystery-dungeon-explorers-of-sky',
  'pokemon-colosseum',
];

const SUGGESTED_GUIDE_SLUGS = [
  'scarlet-violet',
  'legends-z-a',
  'legends-arceus',
];

export const metadata: Metadata = {
  title: 'Pokédex + Guías | Completa todos los juegos Pokémon',
  description:
    'Busca entre 1025 Pokémon, sigue guías de juegos principales y spin-offs, marca tu progreso, monta tu equipo y explora legendarios, míticos, ultraentes y shinies.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    siteName: 'Pokédex + Guías',
    title: 'Pokédex + Guías | Completa todos los juegos Pokémon',
    description:
      'Pokédex completa, guías paso a paso y progreso por usuario para completar todos los juegos Pokémon.',
  },
};

export default async function Home() {
  const [index, featured] = await Promise.all([
    getPokemonIndex(),
    getPokemonByIds(FEATURED_IDS),
  ]);

  const heroPokemon = index.find((entry) => entry.id === 150) ?? index[0];
  const legendaryPreviews: LegendaryPreview[] = LEGENDARY_IDS.map((id) =>
    index.find((entry) => entry.id === id)
  )
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry))
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      artworkUrl: entry.artworkUrl,
      shinyArtworkUrl: entry.shinyArtworkUrl,
      legendaryCategory: entry.legendaryCategory,
    }));

  const mainGuides = games.filter(
    (game) => (game.category ?? 'main') === 'main'
  ).length;
  const spinOffGuides = games.filter(
    (game) => game.category === 'spin-off'
  ).length;

  const featuredGuides = FEATURED_GUIDE_SLUGS.map((slug) =>
    getGameBySlug(slug)
  ).filter((game): game is GameGuide => Boolean(game));

  const suggestedGuides = SUGGESTED_GUIDE_SLUGS.map((slug) =>
    getGameBySlug(slug)
  )
    .filter((game): game is GameGuide => Boolean(game))
    .map((game) => ({
      slug: game.slug,
      title: game.shortTitle,
      region: game.region,
      accent: game.accent,
    }));

  const selectorGames = games.map((game) => ({
    slug: game.slug,
    title: game.title,
    region: game.region,
    generation: game.generation,
    category: game.category ?? ('main' as const),
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Pokédex + Guías',
    url: getSiteUrl(),
    description:
      'Pokédex Nacional y guías paso a paso para completar todos los juegos Pokémon.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${getSiteUrl()}/buscar?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <div className="bg-gradient-to-b from-white to-slate-50">
      <HomeHero
        featuredId={heroPokemon?.id ?? null}
        featuredName={
          heroPokemon ? `${formatPokemonName(heroPokemon.name)} shiny` : 'Pokémon'
        }
        featuredArtwork={
          heroPokemon?.shinyArtworkUrl ?? heroPokemon?.artworkUrl ?? ''
        }
        totalPokemon={index.length}
        totalGuides={games.length}
        mainGuides={mainGuides}
        spinOffGuides={spinOffGuides}
      />

      <div className="space-y-10 py-10">
        <ContinueAdventure suggestedGuides={suggestedGuides} />
        <HomeFeaturedPokemon pokemon={featured} />
        <HomeGuides
          featuredGuides={featuredGuides}
          selectorGames={selectorGames}
        />
        <HomeLegendaryStrip pokemon={legendaryPreviews} />
        <HomeTeamCard />

        <section className="mx-auto max-w-7xl px-4">
          <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-900 p-8 text-center text-white shadow-xl">
            <p className="text-xs font-black uppercase tracking-widest text-white/60">
              Siguiente parada
            </p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">
              ¿Listo para completar tu próximo juego?
            </h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm text-white/75">
              Elige una guía, crea tu cuenta y marca cada gimnasio, legendario y
              Pokémon capturado. Tu progreso queda separado del de cualquier otra
              persona.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href="/guias"
                className="rounded-xl bg-white px-5 py-3 text-sm font-black text-gray-900 transition hover:bg-red-50"
              >
                Explorar guías
              </Link>
              <Link
                href="/registro"
                className="rounded-xl border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white transition hover:bg-white/20"
              >
                Crear cuenta gratis
              </Link>
            </div>
          </div>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
