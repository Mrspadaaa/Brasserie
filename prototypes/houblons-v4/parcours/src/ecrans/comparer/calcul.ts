// Comparer (r6a) : ce que l'écran lit du moteur, recalculé à chaque changement de houblons. Aucune grille figée :
// tout part de `comparer` (src/moteur), qui simule chaque houblon à 4 g/L, après fermentation, 3 j, levure de la
// recette (simulerCas). Les règles de lecture sont celles de r6a (fils22-comparer/r6a/generer.mjs), recopiées
// ici comme règles et non comme nombres :
//  - échelle au style : valeur / haut du domaine de la famille ; absolu : valeur / 125 (rien n'est rogné) ;
//  - inconnu : rien de simulé, ou une famille que ses fiches ne décrivent pas et que le moteur ne bouge pas ;
//  - écart en crans : (après − ta stout) / cran du style ;
//  - « sort de ta 16D » : au-dessus du haut de la bande alors que ta stout était dedans ;
//  - mis en avant au départ : le plus floral qui reste dans ta 16D.
import type { FamilyId } from '../../../../src/engine';
import { comparer, style, type Colonne, type HoublonLu } from '../../moteur';
import type { RecetteParcours } from '../../etat/types';

export const ABSOLU = 125;
/** Orangé « au-dessus du style » (D83 : la seule couleur hors famille admise sur un élément de famille). */
export const ORANGE = '#c2410c';

/** Une couleur par houblon, la même que dans les lots 20 à 22 (fils20-dryhop/donnees-h.json ; Nelson Sauvin
 * comme r6c et r6n2). Les autres, choisies à plus de 25 ΔE des trois du cas (D77). */
const COULEURS_HOUBLON: Record<string, string> = {
  'beermaverick-cascade': '#781838',
  'beermaverick-idaho-7': '#e80030',
  'beermaverick-galaxy': '#681878',
  'beermaverick-citra': '#184078',
  'beermaverick-citra:cryo': '#184078',
  'beermaverick-nelson-sauvin': '#0b6e63',
  'beermaverick-motueka': '#8a5a00',
  'beermaverick-sabro': '#1f5fa8',
  'beermaverick-hallertau-blanc': '#4f6b00',
  'beermaverick-target': '#3d3d47',
  'beermaverick-nugget': '#0072b2',
};
export const couleurHoublon = (cle: string) => COULEURS_HOUBLON[cle] ?? '#3d3d47';

export interface CelluleLue {
  famille: FamilyId;
  inconnu: boolean;
  raison: string | null;
  bas: number; centre: number; haut: number;
  /** Ta stout aujourd'hui (le trait noir) ; null si inconnue. */
  avant: number | null;
  /** Haut de la bande de ta 16D (0–100) ; null si le style ne la documente pas. */
  bandeHaut: number | null;
  /** Haut du domaine de la piste au style. */
  domaine: number;
  cran: number;
  /** Écart simulé en crans du style ; null si inconnu. */
  dCran: number | null;
  hors: boolean;
}
export interface ColonneLue {
  cle: string;
  houblon: HoublonLu;
  couleur: string;
  colonne: Colonne;
  cellules: Record<FamilyId, CelluleLue>;
  /** Familles qui sortent de ta 16D. */
  sorties: FamilyId[];
}

const r2 = (x: number) => Math.round(x * 100) / 100;

export function lireColonnes(recette: RecetteParcours, cles: string[], doseGL?: number): ColonneLue[] {
  const sc = style(recette.styleCode);
  return comparer(recette, cles, doseGL ? { doseGL } : {}).map((c) => {
    const cellules = {} as Record<FamilyId, CelluleLue>;
    for (const f of sc.order) {
      const fs = sc.families[f];
      const v = c.lu.apres.profil[f].valeur;
      const av = c.lu.avant.profil[f].valeur;
      const nonDecrit = c.houblon.familles[f].niveau === 'non décrit';
      const zero = !v || (v.bas === 0 && v.centre === 0 && v.haut === 0);
      const centre = v?.centre ?? 0;
      // Écart à ta stout. Ta stout inconnue sur la famille (rien de simulé ni dégusté) : l'apport se lit depuis 0,
      // comme r6a, mais le trait de ta stout n'est pas dessiné (inconnu ≠ 0).
      const delta = v ? centre - (av?.centre ?? 0) : null;
      const immobile = delta == null || Math.abs(delta) < 0.005;
      const inconnu = zero || (immobile && nonDecrit);
      const bandeHaut = fs.band ? fs.band[1] : null;
      cellules[f] = {
        famille: f, inconnu,
        raison: inconnu ? (zero ? c.lu.apres.profil[f].raison ?? 'rien de simulé' : 'famille absente de ses fiches, que le moteur ne bouge pas') : null,
        bas: v?.bas ?? 0, centre, haut: v?.haut ?? 0,
        avant: av?.centre ?? null,
        bandeHaut, domaine: fs.domain[1], cran: fs.cran,
        dCran: inconnu || delta == null ? null : r2(delta / fs.cran),
        hors: !inconnu && bandeHaut != null && centre > bandeHaut && (av?.centre ?? 0) <= bandeHaut,
      };
    }
    return { cle: c.cle, houblon: c.houblon, couleur: couleurHoublon(c.cle), colonne: c, cellules, sorties: sc.order.filter((f) => cellules[f].hors) };
  });
}

/** Mis en avant au départ (règle de r6a, écrite dans la légende) : le plus de la famille visée sans sortir de ta
 * 16D ; à défaut, le plus de la famille visée. */
export function depart(cols: ColonneLue[], visee: FamilyId): string | null {
  const parVisee = (a: ColonneLue, b: ColonneLue) => (b.cellules[visee].dCran ?? -Infinity) - (a.cellules[visee].dCran ?? -Infinity);
  const dans = cols.filter((c) => !c.sorties.length).sort(parVisee);
  return (dans[0] ?? [...cols].sort(parVisee)[0])?.cle ?? null;
}

/** La réponse face à ta stout (y1b, r6n2) et « contre ★ » chiffré (r6p2) : sur la famille visée, le meilleur
 * houblon (★, même règle que le départ) et l'écart en crans du houblon retenu contre lui, ou du suivant. */
export interface Reponse { etoile: ColonneLue; autre: ColonneLue | null; ecart: number | null; retenuEstEtoile: boolean }
export function reponse(cols: ColonneLue[], retenu: string, visee: FamilyId): Reponse | null {
  const cleEtoile = depart(cols, visee);
  const etoile = cols.find((c) => c.cle === cleEtoile);
  if (!etoile) return null;
  const v = (c: ColonneLue) => c.cellules[visee].dCran;
  if (retenu !== etoile.cle) {
    const r = cols.find((c) => c.cle === retenu) ?? null;
    const a = r ? v(r) : null, b = v(etoile);
    return { etoile, autre: r, ecart: a != null && b != null ? r2(a - b) : null, retenuEstEtoile: false };
  }
  const suivants = cols.filter((c) => c.cle !== etoile.cle && v(c) != null).sort((a, b) => (v(b) ?? 0) - (v(a) ?? 0));
  const s = suivants[0] ?? null;
  const a = v(etoile), b = s ? v(s) : null;
  return { etoile, autre: s, ecart: a != null && b != null ? r2(a - b) : null, retenuEstEtoile: true };
}

/** « Égaler » (y3) : la dose de chaque autre houblon qui donne, sur la famille visée, l'écart que le retenu donne
 * à 4 g/L. Recherche par dichotomie sur 0,5–16 g/L (le moteur, à chaque pas ; l'effet croît avec la dose).
 * null : jamais atteint à 16 g/L (le moteur ne l'atteint pas sur cette plage : écrit, jamais un nombre). */
export function egaler(recette: RecetteParcours, cible: ColonneLue, autres: ColonneLue[], visee: FamilyId): { cle: string; doseGL: number | null }[] {
  const sc = style(recette.styleCode);
  const but = cible.cellules[visee].dCran;
  if (but == null) return autres.map((a) => ({ cle: a.cle, doseGL: null }));
  const effet = (cle: string, d: number) => {
    const e = comparer(recette, [cle], { doseGL: d })[0].lu.ecart[visee];
    return e ? e.centre / sc.families[visee].cran : null;
  };
  return autres.map((a) => {
    let bas = 0.5, haut = 16;
    const h = effet(a.cle, haut);
    if (h == null || h < but) return { cle: a.cle, doseGL: null };
    for (let i = 0; i < 7; i++) {
      const m = (bas + haut) / 2;
      const x = effet(a.cle, m);
      if (x != null && x >= but) haut = m; else bas = m;
    }
    return { cle: a.cle, doseGL: Math.round(haut * 2) / 2 };
  });
}
