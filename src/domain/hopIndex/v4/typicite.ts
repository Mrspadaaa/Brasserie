// Typicité d'un houblon pour le style visé (voie f9, D191, D120) : la part des recettes du style (et de ses voisins) qui contiennent ce houblon, et la part des recettes DU houblon qui sont de la famille
// du style, lues chez Beer Analytics (src/data/hopV4/typicite-styles.json, générée par scripts/collecte-hop/typicite-styles.mjs ; CC BY-SA 4.0). Un terme du classement de Suggérer (option `typicite`),
// jamais un filtre : un houblon sans donnée reste proposé, après ceux dont la typicité est connue ; l'inconnu n'est jamais 0.
// Ce module et la table sont chargés à la demande (`chargerTypicite`, typicite-acces.ts) : ils ne sont pas dans le chunk du moteur (budget B5). Il s'enregistre dans le registre à son évaluation.
import { enregistrerTypicite, type TableTypicite, type Typicite } from './typicite-acces';

export { chargerTypicite, type TableTypicite, type Typicite } from './typicite-acces';
export { type FacteurIntensite, PENTE_INTENSITE, RADAR_NEUTRE, facteurIntensite } from './intensite';

let table: TableTypicite | null = null;
const abonnes: (() => void)[] = [];
/** La table si elle est arrivée, sinon null : sans elle la typicité est inconnue pour tous (neutre). */
export const typiciteChargee = (): TableTypicite | null => table;
/** Pose la table (tests, scripts, chargement) et prévient les abonnés. `null` l'oublie. */
export function poserTypicite(t: TableTypicite | null): void { table = t; enregistrerTypicite(MOTEUR); if (t) for (const f of abonnes.splice(0)) { try { f(); } catch (e) { console.error('typicité : un abonné a échoué', e); } } }
/** Appelle `f` une fois à l'arrivée de la table (tout de suite si elle est là) ; rend le désabonnement. */
export function siTypiciteArrive(f: () => void): () => void {
  if (table) { f(); return () => {}; }
  abonnes.push(f);
  return () => { const i = abonnes.indexOf(f); if (i >= 0) abonnes.splice(i, 1); };
}

/** Paliers de la part (fraction des recettes du style qui contiennent le houblon). Hypothèse du pilote [H] : des paliers, pas la part brute, pour qu'un houblon présent dans un tiers des recettes
 * (Citra, Simcoe) ne passe pas devant un houblon présent dans 5 % : ils sont « typés » tous deux. 3 : au moins 5 % ; 2 : au moins 1 % ; 1 : moins de 1 % mais publiée. */
export const PALIERS_TYPICITE: { min: number; palier: 1 | 2 | 3; libelle: string }[] = [
  { min: 0.05, palier: 3, libelle: 'typé' }, { min: 0.01, palier: 2, libelle: 'courant' }, { min: 0, palier: 1, libelle: 'rare' },
];
/** Concentration : une famille compte pour au moins `min` de ses recettes. Hypothèses du pilote [H] : un tiers des recettes (≈ 0,30) = « typé », un sixième (0,15) = « courant ». */
export const PALIERS_CONCENTRATION: { min: number; palier: 1 | 2 | 3 }[] = [{ min: 0.3, palier: 3 }, { min: 0.15, palier: 2 }, { min: 0, palier: 1 }];
/** En dessous de ce nombre de recettes, la concentration est trop fragile pour classer (Ahhhroma : 11 recettes, 55 % d'IPA) : inconnue. */
export const MIN_RECETTES = 1000;
const INCONNUE = (raison: string, auPlus: number | null = null): Typicite => ({ palier: null, part: null, origine: null, code: null, concentration: null, auPlus, raison });
export const palierDePart = (part: number): 1 | 2 | 3 => PALIERS_TYPICITE.find((p) => part >= p.min)!.palier;

/** La typicité d'une variété pour un code de style : le plus haut palier de deux lectures.
 *  - la PART : la plus grande entre la part du style visé et celle d'un voisin × `poidsVoisin` (la part des recettes du style qui contiennent le houblon) ;
 *  - la CONCENTRATION : la part des recettes du houblon qui sont de la famille du style (un houblon utilisé surtout en IPA est « typé IPA » même si peu de recettes IPA le contiennent).
 * Un style absent de la liste d'un houblon est inconnu, jamais 0. */
export function typiciteDe(varietyId: string, styleCode: string, t: TableTypicite | null = table): Typicite {
  if (!t) return INCONNUE('table de typicité non chargée');
  const id = varietyId.replace(/^beermaverick-/, '');
  const famille = Object.entries(t.familles ?? {}).find(([, f]) => f.codes.includes(styleCode))?.[0] ?? null;
  if (!(styleCode in t.styles) && !(styleCode in t.parts) && !famille) return INCONNUE('style sans donnée de typicité');
  const candidats: { part: number; origine: 'style' | 'voisin'; code: string }[] = [];
  const propre = t.parts[styleCode]?.[id];
  if (propre !== undefined) candidats.push({ part: propre, origine: 'style', code: styleCode });
  for (const v of t.voisins[styleCode] ?? []) { const p = t.parts[v]?.[id]; if (p !== undefined) candidats.push({ part: p * t.poidsVoisin, origine: 'voisin', code: v }); }
  const c = famille ? t.concentration?.[famille]?.[id] : undefined;
  const concentration = c !== undefined && (t.recettes?.[id] ?? 0) >= MIN_RECETTES ? c : null;
  if (!candidats.length && concentration === null) {
    const plafond = t.p16[id];
    return plafond === undefined ? INCONNUE('houblon absent de Beer Analytics') : INCONNUE(c !== undefined ? 'échantillon trop mince et style hors des 16 premiers du houblon' : 'style hors des 16 premiers du houblon', plafond);
  }
  const m = candidats.length ? candidats.reduce((x, y) => (y.part > x.part ? y : x)) : null;
  const paliers = [m ? palierDePart(m.part) : null, concentration === null ? null : PALIERS_CONCENTRATION.find((x) => concentration >= x.min)!.palier].filter((x): x is 1 | 2 | 3 => x !== null);
  return { palier: Math.max(...paliers) as 1 | 2 | 3, part: m ? Math.round(m.part * 1e4) / 1e4 : null, origine: m ? m.origine : null, code: m ? m.code : null, concentration, auPlus: null, raison: null };
}

/** Typicité d'une voie : moyenne des paliers des ajouts qui montent, pondérée par la part de dose ; un ajout inconnu rend la voie inconnue (jamais 0). Aucun ajout qui monte : null (neutre). */
export function typiciteDeVoie(positifs: { varietyId: string; poids: number }[], styleCode: string): Typicite | null {
  if (!positifs.length) return null;
  const ts = positifs.map((p) => ({ w: p.poids, t: typiciteDe(p.varietyId, styleCode) }));
  if (ts.some((x) => x.t.palier === null)) return ts.length === 1 ? ts[0].t : INCONNUE(ts.find((x) => x.t.palier === null)!.t.raison!);
  if (ts.length === 1) return ts[0].t;
  const total = ts.reduce((s, x) => s + x.w, 0);
  const palier = ts.reduce((s, x) => s + x.w * (x.t.palier as number), 0) / total;
  const part = ts.every((x) => x.t.part !== null) ? Math.round((ts.reduce((s, x) => s + x.w * (x.t.part as number), 0) / total) * 1e4) / 1e4 : null; // une part inconnue rend la part inconnue (jamais 0)
  return { palier: palier as Typicite['palier'], part, origine: 'style', code: styleCode, concentration: null, auPlus: null, raison: null };
}

// Pas d'effet à l'évaluation du module (D120, t2) : le worker de l'app l'importe pour `poserTypicite`, et la page ne doit pas l'embarquer par un import qu'elle n'appelle pas. Le registre est posé par `poserTypicite`.
const MOTEUR = { typiciteDe: (v: string, s: string) => typiciteDe(v, s), typiciteDeVoie, table: () => table };
