export interface GameGym {
  /** Nombre del líder, capitán o entrenador. */
  leader: string;
  /** Tipo principal del desafío (en español). */
  type: string;
  /** Insignia, cristal Z, rango o equivalente. */
  badge: string;
  /** Ciudad, isla o zona. */
  location: string;
  /** Consejo breve para superar el desafío. */
  tip: string;
}

export interface GameEliteMember {
  name: string;
  type: string;
}

export interface WalkthroughStep {
  title: string;
  goal: string;
  tips: string[];
}

export interface VersionExclusive {
  version: string;
  pokemon: string[];
}

export interface GameGuide {
  slug: string;
  title: string;
  shortTitle: string;
  generation: number;
  region: string;
  platform: string;
  releaseYear: number;
  versions: string[];
  /** Etiqueta para la sección de desafíos (Gimnasios, Pruebas, Nobles...). */
  challengeLabel: string;
  eliteFourLabel: string;
  /** Rango del Pokédex Nacional cubierto por la guía. */
  dexRange: [number, number];
  dexScope: string;
  dexNote: string;
  starters: string[];
  boxLegendaries: string[];
  mythicals: string[];
  versionExclusives: VersionExclusive[];
  gyms: GameGym[];
  eliteFour: GameEliteMember[];
  champion: string;
  walkthrough: WalkthroughStep[];
  tips: string[];
  completionChecklist: string[];
  accent: string;
}
