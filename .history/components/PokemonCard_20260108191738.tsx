import { getPokemon } from '@/services/pokeapi';

export default async function PokemonGrid() {
  const data = await getPokemon();

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-red-500">Kanto Pokédex</p>
          <h1 className="text-3xl font-black text-slate-900">Elige tu próximo Pokémon</h1>
          <p className="text-sm text-slate-600">Explora la Pokédex con tarjetas más vistosas y con efecto hover.</p>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {data.results.map((pokemon: any) => {
            const id = pokemon.url.split('/').filter(Boolean).pop();
            const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

            return (
              <article
                key={pokemon.name}
                className="group relative overflow-hidden rounded-2xl border border-red-100 bg-white/85 px-4 py-5 shadow-[0_12px_40px_-18px_rgba(239,68,68,0.55)] backdrop-blur transition duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_18px_50px_-15px_rgba(239,68,68,0.65)]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-100/50 via-white to-amber-100/50 opacity-0 transition duration-500 group-hover:opacity-100" aria-hidden />

                <div className="relative flex items-start justify-between">
                  <span className="rounded-full bg-red-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-red-700">#{id}</span>
                  <span className="rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">Sprite</span>
                </div>

                <div className="relative mt-3 flex flex-col items-center text-center">
                  <div className="relative mb-3 h-28 w-28">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-200/70 via-red-200/70 to-white blur-2xl transition duration-500 group-hover:scale-110" aria-hidden />
                    <img
                      src={spriteUrl}
                      alt={pokemon.name}
                      className="relative h-full w-full object-contain drop-shadow-[0_12px_18px_rgba(0,0,0,0.08)]"
                      loading="lazy"
                    />
                  </div>
                  <h2 className="text-xl font-extrabold capitalize text-slate-900">{pokemon.name}</h2>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-red-500">Pokémon</p>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Base</span>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-[11px] font-semibold uppercase text-orange-700">Gen I</span>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </main>
  );
}
