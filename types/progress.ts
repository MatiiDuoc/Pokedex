export interface GameProgress {
  caught: number[];
  checklist: string[];
  /** Notas personales por paso, con claves como `step:0`. */
  notes?: Record<string, string>;
}
