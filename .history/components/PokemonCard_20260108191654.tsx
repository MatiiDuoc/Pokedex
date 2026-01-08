import { getPokemon } from '@/services/pokeapi';

interface Pokemon {
    name: string;
    url: string;
}

const getPokemonId = (url: string): string => url.split('/')[6];

export default async function PokemonCard() {
    const data = await getPokemon();

    return (
        <main className="p-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {data.results.map((pokemon: Pokemon) => {
                const pokemonId = getPokemonId(pokemon.url);
                
                return (
                    <div 
                        key={pokemon.name} 
                        className="border p-5 rounded-lg shadow-md hover:shadow-xl transition-shadow bg-red-400"
                    >
                        <h2 className="text-xl font-bold capitalize mb-2 text-center">
                            {pokemon.name}
                        </h2>
                        <img 
                            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`}
                            alt={pokemon.name}
                            className="mx-auto"
                            loading="lazy"
                        />
                        <h3 className="text-sm text-gray-600 mt-2">ID: {pokemonId}</h3>
                    </div>
                );
            })}
        </main>
    );
}
