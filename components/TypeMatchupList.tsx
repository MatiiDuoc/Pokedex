import { TYPE_COLORS } from '@/lib/pokemon';
import {
  formatMultiplier,
  getDefensiveMatchups,
  getTypeName,
  type TypeMultiplier,
} from '@/lib/type-chart';

interface TypeMatchupListProps {
  types: string[];
}

export default function TypeMatchupList({ types }: TypeMatchupListProps) {
  const { weaknesses, resistances, immunities } = getDefensiveMatchups(types);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <MatchupGroup
        title="Débil contra"
        empty="Sin debilidades"
        entries={weaknesses}
      />
      <MatchupGroup
        title="Resiste"
        empty="Sin resistencias"
        entries={resistances}
      />
      <MatchupGroup
        title="Inmune a"
        empty="Sin inmunidades"
        entries={immunities}
      />
    </div>
  );
}

function MatchupGroup({
  title,
  empty,
  entries,
}: {
  title: string;
  empty: string;
  entries: TypeMultiplier[];
}) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <h3 className="text-xs font-black uppercase tracking-widest text-gray-500">
        {title}
      </h3>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-gray-400">{empty}</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {entries.map((entry) => (
            <span
              key={entry.type}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold text-white ${
                TYPE_COLORS[entry.type] ?? 'bg-gray-400'
              }`}
            >
              {getTypeName(entry.type)}
              <span className="rounded-full bg-black/20 px-1 py-0.5 text-[10px]">
                {formatMultiplier(entry.multiplier)}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
