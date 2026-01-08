import { getPokemon } from '@/services/pokeapi';

export default async function PokemonGrid() {
  const data = await getPokemon();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 text-center">
          <span className="inline-block rounded-full bg-red-100 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-red-600">
            Pokédex Oficial
          </span>
          <h1 className="mt-4 text-4xl font-black text-gray-900 sm:text-5xl">
            Descubre todos los Pokémon
          </h1>
          <p className="mt-3 text-lg text-gray-600">
            Explora la colección completa del primer Pokédex
          </p>
        </div>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data.results.map((pokemon: any) => {
            const id = pokemon.url.split('/').filter(Boolean).pop();
            const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

            return (
              <article
                key={pokemon.name}
                className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg shadow-gray-200/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-200/50"
              >
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-blue-400/20 via-red-400/20 to-yellow-400/20">
                  <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 to-transparent" />
                  </div>
                  <img
                    src={spriteUrl}
                    alt={pokemon.name}
                    className="h-full w-full object-contain p-4 drop-shadow-lg"
                    loading="lazy"
                  />
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase text-red-600">
                      #{id}
                    </span>
                    <span className="inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                      Gen I
                    </span>
                  </div>

                  <h2 className="text-2xl font-black capitalize text-gray-900">
                    {pokemon.name}
                  </h2>
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] text-gray-500">
                    Pokémon
                  </p>

                  <div className="mt-auto pt-4">
                    <button className="w-full rounded-lg bg-gradient-to-r from-red-500 to-red-600 py-2 text-sm font-bold text-white transition-all hover:from-red-600 hover:to-red-700 active:scale-95">
                      Ver Detalles
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
