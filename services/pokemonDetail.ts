import { cache } from 'react';
import {
  getArtworkUrl,
  getIdFromResourceUrl,
  getShinyArtworkUrl,
} from '@/services/pokeapi';
import moveNamesEs from '@/lib/move-names-es.json';
import {
  getGenerationFromId,
  getLegendaryCategory,
} from '@/lib/pokemon';
import type { LegendaryCategory, PokemonStat } from '@/types/pokemon';

const MOVE_NAMES_ES = moveNamesEs as Record<string, string>;
const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const REVALIDATE_SECONDS = 60 * 60 * 24 * 7;
const TIMEOUT_MS = 20_000;

interface NamedResource {
  name: string;
  url: string;
}

interface PokemonDetailResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: Array<{ slot: number; type: NamedResource }>;
  stats: Array<{ base_stat: number; stat: NamedResource }>;
  abilities: Array<{
    ability: NamedResource;
    is_hidden: boolean;
    slot: number;
  }>;
}

interface SpeciesResponse {
  id: number;
  name: string;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: NamedResource;
  }>;
  genera: Array<{ genus: string; language: NamedResource }>;
  evolution_chain: { url: string } | null;
  is_legendary: boolean;
  is_mythical: boolean;
}

interface EvolutionDetail {
  min_level: number | null;
  trigger: NamedResource;
  item: NamedResource | null;
  held_item: NamedResource | null;
  time_of_day: string;
  known_move: NamedResource | null;
  location: NamedResource | null;
}

interface EvolutionChainLink {
  species: NamedResource;
  evolution_details: EvolutionDetail[];
  evolves_to: EvolutionChainLink[];
}

interface EvolutionChainResponse {
  chain: EvolutionChainLink;
}

export interface PokemonAbility {
  name: string;
  isHidden: boolean;
}

export interface EvolutionNode {
  id: number;
  name: string;
  artworkUrl: string;
  shinyArtworkUrl: string;
  method: string | null;
  children: EvolutionNode[];
}

export interface PokemonDetail {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: string[];
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  artworkUrl: string;
  shinyArtworkUrl: string;
  generation: number;
  legendaryCategory: LegendaryCategory;
  flavorText: string;
  genus: string;
  evolutionTree: EvolutionNode | null;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`PokeAPI respondió ${response.status} para ${url}`);
  }

  return (await response.json()) as T;
}

function cleanFlavorText(text: string): string {
  return text
    .replace(/\f|\n|\r/g, ' ')
    .replace(/\u00ad/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickLocalizedText(
  entries: Array<{ text: string; language: NamedResource }>
): string {
  const spanish = entries.find((entry) => entry.language.name === 'es');
  const english = entries.find((entry) => entry.language.name === 'en');
  return cleanFlavorText(spanish?.text ?? english?.text ?? '');
}

function getEvolutionMethod(details: EvolutionDetail[]): string | null {
  if (details.length === 0) return null;
  const detail = details[0];

  if (detail.min_level) return `Nivel ${detail.min_level}`;
  if (detail.item) return `Usar ${detail.item.name.replace(/-/g, ' ')}`;
  if (detail.held_item) return `Con ${detail.held_item.name.replace(/-/g, ' ')}`;
  if (detail.trigger.name === 'trade') return 'Intercambio';
  if (detail.trigger.name === 'use-item') return 'Usar objeto';
  if (detail.known_move) {
    const moveName =
      MOVE_NAMES_ES[detail.known_move.name] ??
      detail.known_move.name.replace(/-/g, ' ');
    return `Conocer ${moveName}`;
  }
  if (detail.location) return `En ${detail.location.name.replace(/-/g, ' ')}`;
  if (detail.trigger.name === 'level-up') return 'Subir de nivel';
  if (detail.trigger.name !== 'level-up') {
    return detail.trigger.name.replace(/-/g, ' ');
  }

  return null;
}

function buildEvolutionTree(link: EvolutionChainLink): EvolutionNode | null {
  const id = getIdFromResourceUrl(link.species.url);
  if (id === null) return null;

  return {
    id,
    name: link.species.name,
    artworkUrl: getArtworkUrl(id),
    shinyArtworkUrl: getShinyArtworkUrl(id),
    method: getEvolutionMethod(link.evolution_details),
    children: link.evolves_to
      .map((child) => buildEvolutionTree(child))
      .filter((child): child is EvolutionNode => child !== null),
  };
}

export const getPokemonDetail = cache(
  async (id: number): Promise<PokemonDetail | null> => {
  if (!Number.isInteger(id) || id < 1 || id > 1025) return null;

  try {
    const [pokemon, species] = await Promise.all([
      fetchJson<PokemonDetailResponse>(`${POKEAPI_BASE}/pokemon/${id}`),
      fetchJson<SpeciesResponse>(`${POKEAPI_BASE}/pokemon-species/${id}`),
    ]);

    let evolutionTree: EvolutionNode | null = null;

    if (species.evolution_chain) {
      try {
        const evolution = await fetchJson<EvolutionChainResponse>(
          species.evolution_chain.url
        );
        evolutionTree = buildEvolutionTree(evolution.chain);
      } catch (error) {
        console.error('No se pudo cargar la cadena de evolución:', error);
      }
    }

    const flavorText = pickLocalizedText(
      species.flavor_text_entries.map((entry) => ({
        text: entry.flavor_text,
        language: entry.language,
      }))
    );

    const genus =
      species.genera.find((entry) => entry.language.name === 'es')?.genus ??
      species.genera.find((entry) => entry.language.name === 'en')?.genus ??
      '';

    return {
      id: pokemon.id,
      name: pokemon.name,
      height: pokemon.height,
      weight: pokemon.weight,
      types: pokemon.types
        .sort((a, b) => a.slot - b.slot)
        .map((entry) => entry.type.name),
      stats: pokemon.stats.map((stat) => ({
        name: stat.stat.name,
        value: stat.base_stat,
      })),
      abilities: pokemon.abilities
        .sort((a, b) => a.slot - b.slot)
        .map((entry) => ({
          name: entry.ability.name,
          isHidden: entry.is_hidden,
        })),
      artworkUrl: getArtworkUrl(pokemon.id),
      shinyArtworkUrl: getShinyArtworkUrl(pokemon.id),
      generation: getGenerationFromId(pokemon.id),
      legendaryCategory: getLegendaryCategory(pokemon.id),
      flavorText,
      genus,
      evolutionTree,
    };
  } catch (error) {
    console.error(`No se pudo cargar el detalle de Pokémon ${id}:`, error);
    return null;
  }
  }
);

export function flattenEvolutionTree(node: EvolutionNode | null): EvolutionNode[] {
  if (!node) return [];
  return [
    node,
    ...node.children.flatMap((child) => flattenEvolutionTree(child)),
  ];
}
