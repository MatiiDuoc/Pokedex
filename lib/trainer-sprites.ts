export interface TrainerSprite {
  id: string;
  src: string;
  label: string;
}

/**
 * Sprites estáticos de entrenadores (Pokémon Showdown). Se guardan en
 * `public/trainers` para que la guía funcione también sin conexión.
 */
const TRAINER_SPRITES: Record<string, string[]> = {
  brock: ['brock'],
  misty: ['misty'],
  'lt. surge': ['ltsurge'],
  erika: ['erika'],
  koga: ['koga'],
  sabrina: ['sabrina'],
  blaine: ['blaine'],
  giovanni: ['giovanni'],
  falkner: ['falkner'],
  bugsy: ['bugsy'],
  whitney: ['whitney'],
  morty: ['morty'],
  chuck: ['chuck'],
  jasmine: ['jasmine'],
  pryce: ['pryce'],
  clair: ['clair'],
  roxanne: ['roxanne'],
  brawly: ['brawly'],
  wattson: ['wattson'],
  flannery: ['flannery'],
  norman: ['norman'],
  winona: ['winona'],
  tate: ['tate'],
  liza: ['liza'],
  'tate y liza': ['tate', 'liza'],
  wallace: ['wallace'],
  juan: ['juan'],
  roark: ['roark'],
  gardenia: ['gardenia'],
  maylene: ['maylene'],
  'crasher wake': ['crasherwake'],
  fantina: ['fantina'],
  byron: ['byron'],
  candice: ['candice'],
  volkner: ['volkner'],
  cilan: ['cilan'],
  chili: ['chili'],
  cress: ['cress'],
  'cilan / chili / cress': ['cilan', 'chili', 'cress'],
  lenora: ['lenora'],
  burgh: ['burgh'],
  elesa: ['elesa'],
  clay: ['clay'],
  skyla: ['skyla'],
  brycen: ['brycen'],
  drayden: ['drayden'],
  iris: ['iris'],
  'drayden / iris': ['drayden', 'iris'],
  cheren: ['cheren'],
  roxie: ['roxie'],
  marlon: ['marlon'],
  viola: ['viola'],
  grant: ['grant'],
  korrina: ['korrina'],
  ramos: ['ramos'],
  clemont: ['clemont'],
  valerie: ['valerie'],
  olympia: ['olympia'],
  wulfric: ['wulfric'],
  ilima: ['ilima'],
  lana: ['lana'],
  kiawe: ['kiawe'],
  mallow: ['mallow'],
  sophocles: ['sophocles'],
  acerola: ['acerola'],
  mina: ['mina'],
  milo: ['milo'],
  nessa: ['nessa'],
  kabu: ['kabu'],
  bea: ['bea'],
  allister: ['allister'],
  'bea / allister': ['bea', 'allister'],
  opal: ['opal'],
  gordie: ['gordie'],
  melony: ['melony'],
  'gordie / melony': ['gordie', 'melony'],
  piers: ['piers'],
  raihan: ['raihan'],
  katy: ['katy'],
  brassius: ['brassius'],
  iono: ['iono'],
  kofu: ['kofu'],
  larry: ['larry'],
  ryme: ['ryme'],
  tulip: ['tulip'],
  grusha: ['grusha'],

  // Alto Mando
  lorelei: ['lorelei-gen1'],
  bruno: ['bruno'],
  agatha: ['agatha-gen1'],
  lance: ['lance'],
  will: ['will'],
  karen: ['karen'],
  sidney: ['sidney'],
  phoebe: ['phoebe-gen3'],
  glacia: ['glacia'],
  drake: ['drake-gen3'],
  aaron: ['aaron'],
  bertha: ['bertha'],
  flint: ['flint'],
  lucian: ['lucian'],
  shauntal: ['shauntal'],
  grimsley: ['grimsley'],
  caitlin: ['caitlin'],
  marshal: ['marshal'],
  malva: ['malva'],
  siebold: ['siebold'],
  wikstrom: ['wikstrom'],
  drasna: ['drasna'],
  hala: ['hala'],
  olivia: ['olivia'],
  kahili: ['kahili'],
  marnie: ['marnie'],
  hop: ['hop'],
  bede: ['bede'],
  volo: ['volo'],
  rika: ['rika'],
  poppy: ['poppy'],
  hassel: ['hassel'],

  // Campeones
  azul: ['blue'],
  steven: ['steven'],
  cynthia: ['cynthia'],
  alder: ['alder'],
  diantha: ['diantha'],
  kukui: ['kukui'],
  hau: ['hau'],
  leon: ['leon'],
  geeta: ['geeta'],
};

const SPRITE_LABELS: Record<string, string> = {
  ltsurge: 'Lt. Surge',
  crasherwake: 'Crasher Wake',
  'lorelei-gen1': 'Lorelei',
  'agatha-gen1': 'Agatha',
  'phoebe-gen3': 'Phoebe',
  'drake-gen3': 'Drake',
};

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function labelFor(id: string): string {
  if (SPRITE_LABELS[id]) return SPRITE_LABELS[id];

  return id
    .split('-')[0]
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

function lookup(name: string): string[] {
  const key = normalize(name);
  if (TRAINER_SPRITES[key]) return TRAINER_SPRITES[key];

  // "Azul (rival)" -> "azul"
  const withoutParentheses = key.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  if (withoutParentheses !== key && TRAINER_SPRITES[withoutParentheses]) {
    return TRAINER_SPRITES[withoutParentheses];
  }

  // "Tate y Liza", "Bea / Allister" y similares.
  const parts = key
    .split(/\s*(?:\/| y )\s*/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    const ids = parts.flatMap((part) => TRAINER_SPRITES[part] ?? []);
    if (ids.length > 0) return ids;
  }

  return [];
}

/**
 * Devuelve los sprites disponibles para un líder, miembro del Alto Mando o
 * campeón. Los desafíos que no son entrenadores (nobles, rangos, jefes de
 * spin-offs) devuelven una lista vacía para mantener el visual del tipo.
 */
export function getTrainerSprites(name: string): TrainerSprite[] {
  return lookup(name).map((id) => ({
    id,
    src: `/trainers/${id}.png`,
    label: labelFor(id),
  }));
}

export function hasTrainerSprite(name: string): boolean {
  return lookup(name).length > 0;
}
