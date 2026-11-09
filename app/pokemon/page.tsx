import { redirect } from 'next/navigation';

// Ruta heredada: la Pokédex principal vive en la portada.
export default function PokemonPage() {
  redirect('/');
}
