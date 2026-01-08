// services/pokeapi.ts
export async function getPokemon(){
    const response = await fetch (
        'https://pokeapi.co/api/v2/pokemon?limit=151'
    );
    return response.json();
}