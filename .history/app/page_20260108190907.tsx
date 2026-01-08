import { getPokemon } from '@/services/pokeapi';

export  default  async function Home () {
  const data = await getPokemon();

  return (
    <main className="p-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {data.results.map((pokemon:any) => (
        <div key={pokemon.name} className="border p-4 rounded-lg shadow-md hover:shadow-xl transition-shadow">
          <h2 className="text-xl font-bold capitalize mb-2">{pokemon.name}</h2>
          <img 
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.url.split('/')[6]}.png`}
          />
          <h3 className="text-sm text-gray-600 mt-2">ID: {pokemon.url.split('/')[6]}</h3>
        </div>
      ))}
    </main>
  );
}
