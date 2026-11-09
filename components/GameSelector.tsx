'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SelectorGame {
  slug: string;
  title: string;
  region: string;
  generation: number;
  category: 'main' | 'spin-off';
}

interface GameSelectorProps {
  games: SelectorGame[];
}

export default function GameSelector({ games }: GameSelectorProps) {
  const router = useRouter();
  const [selected, setSelected] = useState('');

  const mainGames = games.filter((game) => game.category === 'main');
  const spinOffs = games.filter((game) => game.category === 'spin-off');

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <label htmlFor="home-game-selector" className="sr-only">
        Elige un juego para abrir su guía
      </label>
      <select
        id="home-game-selector"
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
      >
        <option value="">¿Qué estás jugando?</option>
        <optgroup label="Juegos principales">
          {mainGames.map((game) => (
            <option key={game.slug} value={game.slug}>
              {game.title} · {game.region}
            </option>
          ))}
        </optgroup>
        <optgroup label="Spin-offs">
          {spinOffs.map((game) => (
            <option key={game.slug} value={game.slug}>
              {game.title} · {game.region}
            </option>
          ))}
        </optgroup>
      </select>
      <button
        type="button"
        disabled={!selected}
        onClick={() => {
          if (selected) router.push(`/guias/${selected}`);
        }}
        className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        Abrir guía
      </button>
    </div>
  );
}
