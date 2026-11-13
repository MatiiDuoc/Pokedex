export const GUIDE_TABS = [
  'resumen',
  'pasos',
  'desafios',
  'rutas',
  'equipo',
  'pokedex',
  'consejos',
] as const;

export type GuideTabId = (typeof GUIDE_TABS)[number];

export interface LastGuideData {
  slug: string;
  title: string;
  region: string;
  accent: string;
  tab: GuideTabId;
  checklistTotal: number;
  stepsTotal: number;
  challengesTotal: number;
  nextStep: number;
  nextStepTitle: string | null;
  updatedAt: number;
}
