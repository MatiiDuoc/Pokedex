import {
  COBBLEVERSE_TROPHIES,
  getCobbleverseTrophyUrl,
} from '@/lib/cobbleverse-badges';

interface CobbleverseTrophiesProps {
  className?: string;
}

export default function CobbleverseTrophies({
  className = '',
}: CobbleverseTrophiesProps) {
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}
    >
      {COBBLEVERSE_TROPHIES.map((trophy) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={trophy.file}
          src={getCobbleverseTrophyUrl(trophy.file)}
          alt={`Trofeo de la Liga de ${trophy.region}`}
          title={`Trofeo de la Liga de ${trophy.region}`}
          loading="lazy"
          className="h-12 w-12 object-contain drop-shadow-md [image-rendering:pixelated]"
        />
      ))}
    </div>
  );
}
