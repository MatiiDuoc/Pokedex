import { Award, Lock } from 'lucide-react';
import type { GymBadgeVisual } from '@/lib/gym-badges';
import { getTypeColorByLabel } from '@/lib/pokemon';

interface GymBadgeProps {
  visual: GymBadgeVisual;
  obtained?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLock?: boolean;
}

const CONTAINER_SIZES = {
  sm: 'h-9 w-9',
  md: 'h-14 w-14',
  lg: 'h-20 w-20',
};

const IMAGE_SIZES = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

export default function GymBadge({
  visual,
  obtained = false,
  size = 'md',
  showLock = false,
}: GymBadgeProps) {
  const hasImage = visual.imageUrls.length > 0;
  const hasSplitImages = visual.imageUrls.length > 1;
  const isItemSprite = visual.imageUrls.some((url) =>
    url.includes('/sprites/items/')
  );

  return (
    <span
      title={visual.label}
      className={`relative inline-flex flex-none items-center justify-center transition duration-300 ${
        CONTAINER_SIZES[size]
      } ${
        hasSplitImages
          ? size === 'sm'
            ? 'w-14'
            : size === 'md'
              ? 'w-20'
              : 'w-28'
          : ''
      } ${obtained ? 'drop-shadow-[0_0_10px_rgba(251,191,36,0.45)]' : 'opacity-45 grayscale'}`}
    >
      {hasImage ? (
        <span className="flex items-center justify-center gap-0.5">
          {visual.imageUrls.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt={visual.label}
              loading="lazy"
              className={`${IMAGE_SIZES[size]} object-contain ${
                hasSplitImages ? 'max-w-[47%]' : ''
              } ${
                isItemSprite
                  ? 'scale-125 [image-rendering:pixelated]'
                  : ''
              }`}
            />
          ))}
        </span>
      ) : (
        <span
          className={`flex h-full w-full items-center justify-center rounded-full ${getTypeColorByLabel(
            visual.type
          )} text-white shadow-inner`}
        >
          {visual.fallbackText ? (
            <span className="text-sm font-black">{visual.fallbackText}</span>
          ) : (
            <Award className={size === 'sm' ? 'h-4 w-4' : 'h-6 w-6'} />
          )}
        </span>
      )}

      {showLock && !obtained && (
        <span className="absolute -bottom-1 -right-1 rounded-full bg-gray-700 p-0.5 text-white shadow-sm">
          <Lock className="h-3 w-3" />
        </span>
      )}
    </span>
  );
}
