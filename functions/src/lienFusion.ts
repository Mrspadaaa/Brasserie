/**
 * Une seule vérité des caractéristiques d'un lien (C50-1, C50-3, C50-4, C50-6 ; 24.11). Module pur, sans dépendance : la lecture
 * (`lienLibelles.ts`) et l'affichage du carnet (`src/domain/carnets/caracteristiques.ts`) s'en servent, pour qu'une valeur « lue » le soit
 * partout (fiche, Comparer, feuille Articles) et que deux pages du même genre disent leurs caractéristiques dans le même ordre.
 *
 * État de l'art (MISSION) : problème d'école = rapprochement de noms (entity resolution à vocabulaire fermé). Méthode standard : une table
 * de familles de synonymes, clés normalisées (sans accents, minuscules), comparées en entier ; jamais une distance d'édition, qui
 * confondrait « Température de stockage » et « Température ». Deux membres d'une famille ne fusionnent que s'ils disent la même chose
 * (même valeur, même unité) : sinon rien ne se perd. Le tri de décision est un tri stable par rang fixe, puis par nom pour les noms connus
 * (indépendant de l'ordre de la page), puis par ordre de la page pour les noms inconnus.
 */

export interface Carac { nom: string; valeur: string | number | boolean; unite?: string }

/** Clé de comparaison : sans accents ni casse ni espaces doubles (« Température de » → « temperature de »). */
export const cleDeNom = (t: string): string => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/ß/g, 'ss')
  .replace(/[‎‏  \s]+/g, ' ').trim();

/* ---------------------------------------------------------------- unités */

const LITRE = new Set(['l', 'litre', 'litres', 'liter', 'liters', 'ltr']);
/** L'écriture unique d'une unité : « l », « litres », « Liter » deviennent « L » ; « m3 » devient « m³ » ; « °c » devient « °C ». Le reste est gardé. */
export function uniteCanonique(u: string): string {
  const k = cleDeNom(u).replace(/\s/g, '');
  if (LITRE.has(k)) return 'L';
  if (k === 'm3' || k === 'm³') return 'm³';
  if (k === '°c' || k === 'c' || k === 'degc') return '°C';
  return u.trim();
}

const MESURE_EN_LITRES = /^\s*(\d+(?:[.,]\d+)?)\s*(l|litres?|liters?|ltr)\s*$/i;
/**
 * Une valeur lue en texte (« 242 l ») dit son unité à part (« 242 » + « L »), l'unité s'écrit d'une façon : jamais « 242 l L » ni « l ».
 * À l'AFFICHAGE seulement (`valeursLuesDe`) : la lecture garde ce que la page a dit (« 242 l »), les acquis de T25-8 et T28-13 aussi.
 */
export function mesureNormalisee<T extends Carac>(c: T): T {
  if (typeof c.valeur === 'string' && !c.unite) {
    const m = MESURE_EN_LITRES.exec(c.valeur);
    if (m) return { ...c, valeur: m[1], unite: 'L' };
  }
  return c.unite && uniteCanonique(c.unite) !== c.unite ? { ...c, unite: uniteCanonique(c.unite) } : c;
}

/* ---------------------------------------------------------------- familles de synonymes */

interface Famille { canon: string; noms: ReadonlySet<string> }
const famille = (canon: string, noms: string[]): Famille => ({ canon, noms: new Set(noms) });
/** Un fait, plusieurs écritures (observées sur les chambres froides, les marmites, les fermenteurs). */
const FAMILLES: readonly Famille[] = [
  famille('Température', ['temperature', 'plage de temperature', 'temperature de service', 'temperature de fonctionnement']),
  famille('Volume', ['volume', 'capacite', 'contenance', 'contenu', 'volume utile', 'volume total', 'volume utile total']),
  famille('Tension', ['tension', 'branchement electrique', 'raccordement electrique']),
  famille('Type de refroidissement', ['type de refroidissement', 'refroidissement', 'refrigeration']),
  famille('Fluide frigorigène', ['fluide frigorigene', 'type de refrigerant', 'refrigerant'])
];
const familleDe = (nom: string): Famille | undefined => { const k = cleDeNom(nom); return FAMILLES.find(f => f.noms.has(k)); };

/** Deux noms disent-ils la même caractéristique ? Même nom, ou deux écritures de la même famille (« Capacité » et « Volume »). */
export function memeCaracteristique(a: string, b: string): boolean {
  if (cleDeNom(a) === cleDeNom(b)) return true;
  const f = familleDe(a);
  return !!f && f === familleDe(b);
}

/* ---------------------------------------------------------------- plage de température */

const BORNE_BASSE = /^temperature (?:de|von|ab)$/;
const BORNE_HAUTE = /^temperature (?:a|jusqu'a|jusqu’a|bis)$/;
const DEGRES = /^([+−-]?\d+(?:[.,]\d+)?)\s*(?:°\s?c|c)?$/i;
const borne = (c: Carac): string | null => {
  if (typeof c.valeur === 'boolean') return null;
  const texte = `${c.valeur}${c.unite ? ` ${c.unite}` : ''}`.trim();
  if (c.unite && uniteCanonique(c.unite) !== '°C') return null;
  return DEGRES.exec(texte)?.[1] ?? null;
};

/** « Température de 0 °C » + « Température jusqu'à 8 °C » : une seule caractéristique, « 0 à 8 °C », à la place de la première. */
function plageDeTemperature<T extends Carac>(liste: T[]): T[] {
  const bas = liste.findIndex(c => BORNE_BASSE.test(cleDeNom(c.nom)));
  const haut = liste.findIndex(c => BORNE_HAUTE.test(cleDeNom(c.nom)));
  if (bas < 0 || haut < 0) return liste;
  const a = borne(liste[bas]), b = borne(liste[haut]);
  if (a === null || b === null) return liste;
  const plage: T = { ...liste[bas], nom: 'Température', valeur: `${a} à ${b} °C` };
  delete plage.unite;
  return liste.flatMap((c, i) => (i === bas ? [plage] : i === haut ? [] : [c]));
}

/* ---------------------------------------------------------------- fusion */

const memeDit = (a: Carac, b: Carac) => cleDeNom(`${a.valeur} ${a.unite ?? ''}`) === cleDeNom(`${b.valeur} ${b.unite ?? ''}`);

/**
 * Les caractéristiques d'une page, sans doublon : plage de température, synonymes qui disent la même
 * chose réunis sous un seul nom (« Type de refroidissement » et « Refroidissement : Air pulsé »). Deux synonymes de valeurs différentes
 * (« Tension 230 V », « Branchement électrique 400 V ») restent deux, sous leur nom : rien ne se perd. Idempotent, l'ordre est gardé.
 */
export function fusionnerCaracteristiques<T extends Carac>(liste: readonly T[]): T[] {
  const sortie = plageDeTemperature([...liste]);
  const retirer = new Set<number>();
  const renommer = new Map<number, string>();
  for (const f of FAMILLES) {
    const membres = sortie.map((c, i) => ({ c, i })).filter(x => familleDe(x.c.nom) === f && !retirer.has(x.i));
    const gardes: Array<{ c: T; i: number }> = [];
    for (const m of membres) {
      const meme = gardes.find(g => memeDit(g.c, m.c));
      if (meme) { retirer.add(m.i); renommer.set(meme.i, f.canon); } else gardes.push(m);
    }
  }
  return sortie.flatMap((c, i) => (retirer.has(i) ? [] : renommer.has(i) ? [{ ...c, nom: renommer.get(i)! }] : [c]));
}

/* ---------------------------------------------------------------- ordre de la décision */

/** Les numéros, références et le secondaire (marque, emballage, expédition) : toujours en dernier. */
const IDENTIFIANT_NOM = /(?:^|[\s(])(?:r[ée]f(?:[ée]rence)?s?\b|num[ée]ro|n°|no\.|nr\.?|artikel(?:nummer)?|sku|ean|gtin|upc|mpn|code[- ]barres?|code article)(?=$|[\s.)])/i;
export const estIdentifiant = (nom: string): boolean => IDENTIFIANT_NOM.test(nom.normalize('NFC'));
const SECONDAIRE = /(?:adaptateur|^point fort|^marque$|^fabricant$|^cat[eé]gorie$|emballage|^d[eé]lai de livraison|^stock du vendeur|mode d.exp[eé]dition|poids d.exp[eé]dition)/i;
export const estSecondaire = (nom: string): boolean => estIdentifiant(nom) || SECONDAIRE.test(nom);

/**
 * L'ordre de la décision d'un achat (C50-4) : ce qui décide d'abord (température, volume, matière, énergie, tension, froid), puis les
 * dimensions, la performance, la porte, la couleur. Clés normalisées. Un nom absent de la liste vient après les dimensions, dans l'ordre
 * de la page.
 */
/*
 * C53 (R16) : l'ordre est PAR GROUPES, jamais alphabétique à l'intérieur d'un groupe de mesures. Houblon : les acides ensemble (alpha, bêta,
 * cohumulone), la récolte, puis les huiles totales et chaque huile par part décroissante. Appareil : ce qui décide (température, volume,
 * matière, induction), l'énergie ensemble (puissance, performance, consommation, tension), le froid, puis les dimensions ensemble
 * (extérieures, intérieures, porte : hauteur et largeur côte à côte), la construction (isolation, tôle), la couleur en dernier.
 * Les noms d'avant la traduction (« Erntejahr », « Total oil ») passent aussi : les articles déjà rangés gardent ceux de leur lecture.
 */
const HUILE_DE_HOUBLON = /^(?:myrcen|humulen|caryophyll|farnes)/;
const ORDRE: readonly RegExp[] = [
  /^alpha\b/,
  /^beta(?! ?glucan)\b/,
  /^cohumulone\b/,
  /^(?:recolte|erntejahr|annee de recolte|harvest(?: year)?|crop year)\b/,
  /^(?:huiles? totales?|total oils?|gesamtol)\b/,
  HUILE_DE_HOUBLON,
  /^(?:temperature|plage de temperature)(?! (?:ambiante|de stockage|de congelation))/,
  /^(?:volume|capacite|contenance|contenu)(?! utile (?:refrig|cong))/,
  /^(?:matiere|materiau)(?! du produit)/,
  /^(?:induction|compatib)/,
  /^(?:puissance|performance|consommation|classe d.effic|energie|moteur)/,
  /^(?:tension|branchement|raccordement|etape\b|phases?\b)/,
  /^(?:type de refroidissement|refroidissement|refrigeration$)/,
  /^(?:fluide|refrigerant|type de refrigerant)/,
  /^mode de fonctionnement/,
  /^materiau du produit/,
  /^temperature/,
  /^(?:dimensions(?! int)|(?:hauteur|largeur|profondeur|longueur)(?! de (?:la )?porte))/,
  /^dimensions int/,
  /^(?:(?:hauteur|largeur) de (?:la )?porte|porte)/,
  /^(?:epaisseur|densite)/,
  /^couleur/
];
const RANG_DE_PORTE = ORDRE.findIndex(r => r.test('hauteur de la porte'));
/** Un nom que la liste ne connaît pas vient après la porte (les dimensions restent ensemble), avant la construction et la couleur. */
export const RANG_INCONNU = RANG_DE_PORTE + 0.5;
const INCONNU = RANG_INCONNU, DERNIER = 90;

/*
 * C54-2 (R21, 24.11) : les groupes se reconnaissent par MOTS-CLÉS, pas par une liste de noms exacts. Un nom que la liste ci-dessus ne connaît pas
 * (« Phases d'alimentation », « Charge de réfrigérant », « Régime nominal 400 W ») va dans le groupe de son mot-clé, dans le nom ou, pour
 * l'énergie, dans l'UNITÉ de sa valeur (W, kW, kWh, V) ; sans mot-clé, il vient après les groupes (RANG_INCONNU). Le rang d'un nom connu ne bouge pas.
 *  - énergie (rang de « Tension ») : puissance, tension, branchement, étape, phase, consommation, courant, alimentation, kWh, W, V ;
 *  - froid (rang de « Fluide ») : fluide, frigorigène, réfrigérant, refroidissement, quantité/charge de frigorigène ;
 *  - dimensions (rang de « Dimensions ») : dimension, hauteur, largeur, profondeur, longueur, porte.
 */
const MOT_ENERGIE = /\b(?:puissance|performance|consommation|tension|branchement|raccordement|etapes?|phases?|alimentation|courant|kwh|watts?|volts?)\b/;
const MOT_FROID = /(?:frigorigene|refrigerant|refroidissement|fluide|frigorifique)/;
const MOT_DIMENSIONS = /\b(?:dimensions?|hauteur|largeur|profondeur|longueur|porte)\b/;
const UNITE_ENERGIE = /^[\s\d.,'’·]*(?:k?w(?:att)?s?|kwh(?:\/an|\/a)?|v(?:olts?)?)\b/i;
const RANG_ENERGIE = ORDRE.findIndex(r => r.test('tension'));
const RANG_FROID = ORDRE.findIndex(r => r.test('fluide frigorigene'));
const RANG_DIMENSIONS = ORDRE.findIndex(r => r.test('dimensions du produit'));
/** Le rang d'un nom que la liste ne connaît pas : celui du groupe de son mot-clé (ou de l'unité de sa valeur), sinon `INCONNU`. */
function rangParMotCle(k: string, valeur?: string): number {
  if (MOT_FROID.test(k)) return RANG_FROID;
  if (MOT_ENERGIE.test(k)) return RANG_ENERGIE;
  if (MOT_DIMENSIONS.test(k)) return RANG_DIMENSIONS;
  if (valeur && UNITE_ENERGIE.test(valeur.normalize('NFC'))) return RANG_ENERGIE;
  return INCONNU;
}
/**
 * Le rang de décision d'un nom (plus petit = plus tôt) ; le secondaire est rejeté en dernier. `valeur` (texte de la valeur, unité comprise) :
 * pour un nom inconnu, son unité peut dire le groupe (« 400 W » : l'énergie).
 */
export function rangDeDecision(nom: string, valeur?: string): number {
  if (estSecondaire(nom)) return DERNIER;
  const k = cleDeNom(nom);
  const i = ORDRE.findIndex(r => r.test(k));
  return i < 0 ? rangParMotCle(k, valeur) : i;
}
/** Le texte d'une valeur avec son unité (« 400 W »), pour `rangDeDecision` ; vide quand rien n'est lisible. */
export function texteDeValeur(valeur: unknown, unite?: unknown): string {
  if (typeof valeur !== 'string' && typeof valeur !== 'number') return '';
  const v = String(valeur).trim();
  return typeof unite === 'string' && unite && !v.includes(unite) ? `${v} ${unite}` : v;
}

/** Une huile essentielle de houblon (myrcène, humulène, caryophyllène, farnésène) : elle se range par sa part, la plus lourde d'abord. */
export const estHuileDeHoublon = (nom: string): boolean => HUILE_DE_HOUBLON.test(cleDeNom(nom));
/** « 59,8 % », « 59.8 », 59,8 : le nombre d'une valeur ; `null` si elle n'en dit pas (jamais 0). */
export function partNumerique(valeur: unknown): number | null {
  if (typeof valeur === 'number') return Number.isFinite(valeur) ? valeur : null;
  if (typeof valeur !== 'string') return null;
  const m = /-?\d+(?:[.,]\d+)?/.exec(valeur);
  return m ? Number(m[0].replace(',', '.')) : null;
}
/** Deux huiles de houblon : la part la plus lourde d'abord (0 si l'une des deux n'en dit pas : le nom départage alors). */
export function parPartDHuile(nomX: string, vx: unknown, nomY: string, vy: unknown): number {
  if (!estHuileDeHoublon(nomX) || !estHuileDeHoublon(nomY)) return 0;
  const px = partNumerique(vx), py = partNumerique(vy);
  return px === null || py === null ? 0 : py - px;
}

/**
 * Trie par ordre de décision, stable. Les noms à rang égal, connus ou non, se départagent par leur nom (jamais par l'ordre de la page : deux
 * pages du même vendeur donnent le même ordre, même pour un nom que la liste ne connaît pas : tour 52). `premiers` : les noms que le critère du carnet désigne,
 * toujours en tête (le critère, puis ce qui décide). `valeurDe` : la valeur d'une entrée, pour ranger les huiles d'un houblon par part (C53-1).
 */
export function trierParDecision<T extends { nom: string }>(liste: readonly T[], premiers: readonly string[] = [], rang: (nom: string, valeur?: string) => number = rangDeDecision, valeurDe?: (c: T) => unknown, uniteDe?: (c: T) => unknown): T[] {
  /* R21 : sans accesseur, la valeur et l'unité se lisent sur l'entrée même quand elle les porte (« valeur », « unite ») */
  const valeur = valeurDe ?? ((c: T) => (c as { valeur?: unknown }).valeur), unite = uniteDe ?? ((c: T) => (c as { unite?: unknown }).unite);
  const cle = (c: T) => (premiers.some(p => memeCaracteristique(p, c.nom)) ? -1 : rang(c.nom, texteDeValeur(valeur(c), unite(c))));
  return liste.map((c, i) => ({ c, i, r: cle(c) })).sort((x, y) => {
    if (x.r !== y.r) return x.r - y.r;
    const p = parPartDHuile(x.c.nom, valeur(x.c), y.c.nom, valeur(y.c)); if (p) return p;
    /* C52 (R12) : à rang égal, connu OU NON, le nom départage ; l'ordre de la page ne sert qu'à deux noms identiques */
    const kx = cleDeNom(x.c.nom), ky = cleDeNom(y.c.nom);
    return kx < ky ? -1 : kx > ky ? 1 : x.i - y.i;
  }).map(x => x.c);
}
