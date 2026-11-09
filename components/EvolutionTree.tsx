import Link from 'next/link';
import { formatPokemonName } from '@/lib/pokemon';
import type { EvolutionNode } from '@/services/pokemonDetail';

interface EvolutionTreeProps {
  node: EvolutionNode;
  currentId: number;
}

export default function EvolutionTree({ node, currentId }: EvolutionTreeProps) {
  return <EvolutionBranch node={node} currentId={currentId} isRoot />;
}

function EvolutionBranch({
  node,
  currentId,
  isRoot = false,
}: {
  node: EvolutionNode;
  currentId: number;
  isRoot?: boolean;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/pokedex/${node.id}`}
          className={`group flex items-center gap-3 rounded-xl border p-2 pr-4 transition hover:border-red-200 hover:bg-red-50 ${
            node.id === currentId
              ? 'border-red-300 bg-red-50 shadow-sm'
              : 'border-gray-200 bg-white'
          }`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={node.artworkUrl}
            alt={formatPokemonName(node.name)}
            loading="lazy"
            className="h-14 w-14 object-contain"
          />
          <span>
            <span className="block text-sm font-bold text-gray-900 group-hover:text-red-600">
              {formatPokemonName(node.name)}
            </span>
            <span className="block text-[10px] font-semibold text-gray-400">
              #{node.id.toString().padStart(4, '0')}
            </span>
          </span>
        </Link>
        {node.method && (
          <span className="text-xs font-semibold text-gray-500">
            {isRoot ? '' : '→ '}
            {node.method}
          </span>
        )}
      </div>

      {node.children.length > 0 && (
        <div className="ml-5 mt-2 space-y-2 border-l border-gray-200 pl-5">
          {node.children.map((child) => (
            <EvolutionBranch
              key={child.id}
              node={child}
              currentId={currentId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
