import { formatPokemonName, getTypeLabel } from '@/lib/pokemon';
import type { PokemonBasic } from '@/types/pokemon';

const TYPE_HEX: Record<string, string> = {
  normal: '#9ca3af',
  fire: '#ef4444',
  water: '#3b82f6',
  grass: '#22c55e',
  electric: '#facc15',
  ice: '#22d3ee',
  fighting: '#b91c1c',
  poison: '#a855f7',
  ground: '#ca8a04',
  flying: '#818cf8',
  psychic: '#ec4899',
  bug: '#84cc16',
  rock: '#a16207',
  ghost: '#7e22ce',
  dragon: '#4338ca',
  dark: '#374151',
  steel: '#64748b',
  fairy: '#f9a8d4',
};

function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = url;
  });
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
}

function drawTypePill(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: string
) {
  const label = getTypeLabel(type);
  context.font = '600 18px Arial, sans-serif';
  const width = context.measureText(label).width + 26;

  context.fillStyle = TYPE_HEX[type] ?? '#6b7280';
  roundedRect(context, x, y, width, 30, 15);
  context.fill();

  context.fillStyle = '#ffffff';
  context.fillText(label, x + 13, y + 21);

  return width;
}

export async function downloadTeamImage(
  team: PokemonBasic[],
  userName?: string
): Promise<void> {
  const width = 1200;
  const height = 630;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('No se pudo crear el lienzo para exportar el equipo.');
  }

  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, '#020617');
  background.addColorStop(0.55, '#1e1b4b');
  background.addColorStop(1, '#4c1d95');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.fillStyle = 'rgba(255,255,255,0.06)';
  context.beginPath();
  context.arc(1040, 60, 180, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(100, 620, 140, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#fca5a5';
  context.font = '700 20px Arial, sans-serif';
  context.fillText('POKÉDEX + GUÍAS', 48, 58);

  context.fillStyle = '#ffffff';
  context.font = '900 42px Arial, sans-serif';
  context.fillText('Mi equipo Pokémon', 48, 114);

  context.fillStyle = 'rgba(255,255,255,0.65)';
  context.font = '500 20px Arial, sans-serif';
  context.fillText(
    userName ? `Entrenador: ${userName}` : 'Equipo guardado en tu cuenta',
    48,
    148
  );

  const images = await Promise.all(team.map((pokemon) => loadImage(pokemon.spriteUrl)));

  const slots = 6;
  const columns = 3;
  const slotWidth = 350;
  const slotHeight = 200;
  const gapX = 24;
  const gapY = 20;
  const startX = 48;
  const startY = 176;

  for (let index = 0; index < slots; index += 1) {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = startX + column * (slotWidth + gapX);
    const y = startY + row * (slotHeight + gapY);
    const pokemon = team[index];

    context.fillStyle = 'rgba(255,255,255,0.07)';
    context.strokeStyle = 'rgba(255,255,255,0.16)';
    context.lineWidth = 2;
    roundedRect(context, x, y, slotWidth, slotHeight, 22);
    context.fill();
    context.stroke();

    if (!pokemon) {
      context.fillStyle = 'rgba(255,255,255,0.35)';
      context.font = '700 20px Arial, sans-serif';
      context.fillText('Hueco libre', x + 24, y + 110);
      continue;
    }

    const image = images[index];
    if (image) {
      context.drawImage(image, x + 18, y + 25, 145, 145);
    } else {
      context.fillStyle = 'rgba(255,255,255,0.12)';
      context.beginPath();
      context.arc(x + 90, y + 98, 58, 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = '#ffffff';
    context.font = '800 24px Arial, sans-serif';
    context.fillText(
      formatPokemonName(pokemon.name).slice(0, 18),
      x + 178,
      y + 52
    );

    context.fillStyle = 'rgba(255,255,255,0.55)';
    context.font = '600 17px Arial, sans-serif';
    context.fillText(
      `#${pokemon.id.toString().padStart(4, '0')}`,
      x + 178,
      y + 82
    );

    let typeX = x + 178;
    const typeY = y + 104;
    for (const type of pokemon.types.slice(0, 2)) {
      const pillWidth = drawTypePill(context, typeX, typeY, type);
      typeX += pillWidth + 8;
    }
  }

  context.fillStyle = 'rgba(255,255,255,0.45)';
  context.font = '500 16px Arial, sans-serif';
  context.fillText('pokedex-guias.vercel.app', 48, 606);

  const date = new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
  context.textAlign = 'right';
  context.fillText(date, width - 48, 606);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/png')
  );

  if (!blob) {
    throw new Error('No se pudo generar la imagen del equipo.');
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `equipo-pokemon-${Date.now()}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
