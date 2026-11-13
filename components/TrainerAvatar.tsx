import { getTrainerSprites } from '@/lib/trainer-sprites';

type TrainerAvatarSize = 'xs' | 'sm' | 'md' | 'lg';

interface TrainerAvatarProps {
  name: string;
  size?: TrainerAvatarSize;
  className?: string;
}

const SIZES: Record<
  TrainerAvatarSize,
  { single: string; multiple: string }
> = {
  xs: { single: 'h-8 w-8', multiple: 'h-7 w-7' },
  sm: { single: 'h-10 w-10', multiple: 'h-9 w-9' },
  md: { single: 'h-14 w-14', multiple: 'h-10 w-10' },
  lg: { single: 'h-20 w-20', multiple: 'h-14 w-14' },
};

/**
 * Muestra el sprite del entrenador (o entrenadores) de un gimnasio, Alto Mando
 * o campeón. Devuelve `null` si el desafío no es un entrenador con sprite.
 */
export default function TrainerAvatar({
  name,
  size = 'md',
  className = '',
}: TrainerAvatarProps) {
  const sprites = getTrainerSprites(name);
  if (sprites.length === 0) return null;

  const classes = sprites.length > 1 ? SIZES[size].multiple : SIZES[size].single;

  return (
    <span
      className={`inline-flex flex-none items-end justify-center gap-0.5 ${className}`}
    >
      {sprites.map((sprite) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${sprite.id}-${sprite.label}`}
          src={sprite.src}
          alt={`Sprite de ${sprite.label}`}
          title={sprite.label}
          loading="lazy"
          className={`${classes} object-contain [image-rendering:pixelated] drop-shadow-sm`}
        />
      ))}
    </span>
  );
}
