import { getPokemon } from '@/services/pokeapi';

export default async function PokemonGrid() {
  const data = await getPokemon();

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-red-50 px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-black text-gray-900">Pokédex Oficial</h1>
          <p className="mt-2 text-gray-600">Descubre todos los Pokémon</p>
        </div>

        <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data.results.map((pokemon: any) => {
            const id = pokemon.url.split('/').filter(Boolean).pop();
            const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

            return (
              <div
                key={pokemon.name}
                className="group flex flex-col rounded-2xl bg-white shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-red-200/50 overflow-hidden"
              >
                <div className="relative h-40 bg-gradient-to-br from-red-400/30 via-yellow-400/30 to-red-500/30 flex items-center justify-center">
                  <img
                    src={spriteUrl}
                    alt={pokemon.name}
                    className="h-32 w-32 object-contain drop-shadow-lg"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="mb-2 flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-red-600 bg-red-100 px-3 py-1 rounded-full">#{id}</span>
                    <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">Gen I</span>
                  </div>
                  <h2 className="text-2xl font-bold capitalize text-gray-900">{pokemon.name}</h2>
                  <p className="mt-2 text-sm text-gray-500">Pokémon</p>
                  <button className="mt-auto pt-4 w-full bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-2 rounded-lg hover:from-red-600 hover:to-red-700 transition-all active:scale-95">
                    Ver Detalles
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
