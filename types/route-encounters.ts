export interface RouteEncounter {
  version: string;
  methods: string[];
  levels: string;
  minLevel: number;
  maxLevel: number;
  chance: number;
}

export interface RoutePokemon {
  id: number;
  encounters: RouteEncounter[];
}

export interface RouteLocation {
  id: string;
  name: string;
  pokemon: RoutePokemon[];
}

export interface RouteData {
  source: string;
  versionGroup: string;
  versions: Array<{ id: string; name: string }>;
  locations: RouteLocation[];
}
