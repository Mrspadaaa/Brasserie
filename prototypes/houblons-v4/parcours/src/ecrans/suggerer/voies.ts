// Les voies de Suggérer (q2b, D105), lues du moteur en direct et rangées comme q2b : groupes « même effet sur tes
// objectifs », puis les gestes (Assembler 5 + 5 g, Remplacer Nugget, Dry hop). Pur : aucune vue ici.
// Sources :
// - `proposer(recette, direction)` (proposeVoies du moteur v4) : ajouter à 10′, assembler, remplacer à IBU égal ;
//   effets en points 0–100 (apports V5.5 des familles citées, `established`), débordements de style ;
// - `suggerer(recette, famille)` (simulateur, dégustation comprise) : le dry hop du stock à 4 g/L après 3 j, le
//   geste « Dry hop » de q2b ; Idaho 7 n'est que là.
// Inconnu ≠ 0 : un effet non établi ou non simulé est `null`.
import type { FamilyId } from '../../../../src/engine';
import { CONDITIONS } from '../../donnees/cas';
import type { BiereLue, Candidat, HoublonLu } from '../../moteur';
import { houblon, proposer, style, suggerer } from '../../moteur';
import type { RecetteParcours } from '../../etat/types';

export type Geste = 'meme' | 'assembler' | 'remplacer' | 'dryhop';
export interface Ligne {
  /** Numéro de la voie à l'écran (data-voie), 1 pour la première. */
  n: number;
  id: string;
  geste: Geste;
  houblons: HoublonLu[];
  /** Dose écrite sur la ligne (« 5+5 g », « 74 g ») ; null quand l'en-tête du groupe la dit. */
  dose: string | null;
  /** Effet par famille, en points 0–100 ; null : non établi ou non simulé (inconnu). */
  effets: Record<FamilyId, number | null>;
  /** Familles hors du style après la voie. */
  hors: FamilyId[];
  stock: 'suffisant' | 'manque' | 'à acheter';
  estime: boolean;
  /** Le moteur rend 0 exact partout alors que les fiches citent des familles : inconnu (Citra cryo en dry hop). */
  muet: string | null;
}
export interface Groupe { id: string; geste: Geste; titre: string; dose: string | null; moment: string; estime: boolean; lignes: Ligne[] }
export interface Objectif { f: FamilyId; sens: 1 | -1; nom: string; cran: number; requis: number; avant: number | null; visee: number | null }

const fam = <T>(fams: readonly FamilyId[], fn: (f: FamilyId) => T) => Object.fromEntries(fams.map((f) => [f, fn(f)])) as Record<FamilyId, T>;

export type Visee = Partial<Record<FamilyId, number | 'banni'>>;
/** Objectifs de la visée commune (état du parcours, réglée dans l'onglet Ma bière : + floral, − résineux au départ),
 * en crans du style. Visées « plus » d'abord. Situés sur Ma bière lue (la dégustation prime). */
export function objectifsDe(recette: RecetteParcours, biere: BiereLue, visee: Visee): Objectif[] {
  const sc = style(recette.styleCode);
  return (Object.entries(visee) as [FamilyId, number | 'banni'][])
    .filter((e): e is [FamilyId, number] => typeof e[1] === 'number' && e[1] !== 0)
    .sort((a, b) => b[1] - a[1])
    .map(([f, k]) => {
      const sens = (k > 0 ? 1 : -1) as 1 | -1;
      const cran = sc.families[f].cran, avant = biere.profil[f].valeur?.centre ?? null;
      return { f, sens, nom: biere.profil[f].nom, cran, requis: k * cran, avant, visee: avant == null ? null : Math.max(0, avant + k * cran) };
    });
}
/** Familles bannies de la visée commune. */
export const bannisDe = (visee: Visee): FamilyId[] => (Object.entries(visee) as [FamilyId, number | 'banni'][]).filter(([, v]) => v === 'banni').map(([f]) => f);
/** Règle V5.5 des exclusions (« famille citée par le houblon ajouté ») : une voie dont un houblon cite une famille
 * bannie n'est pas proposée. */
export const exclue = (houblons: HoublonLu[], bannis: FamilyId[]) => houblons.some((h) => bannis.some((f) => h.familles[f].niveau !== 'non décrit'));

/** Les voies du moteur, rangées en groupes comme q2b. `familles` : l'ordre des familles du moteur. */
export function voiesDe(recette: RecetteParcours, objectifs: Objectif[], familles: readonly FamilyId[], bannis: FamilyId[] = [], dryhopMax = 4): Groupe[] {
  const direction = Object.fromEntries(objectifs.map((o) => [o.f, o.requis / o.cran]));
  const res = proposer(recette, direction);
  const lignes = res.voies.filter((v) => v.type === 'ajouter' || v.type === 'assemblage' || v.type === 'remplacer à IBU égal')
    .filter((v) => !exclue([...new Set(v.actions.map((a) => a.hopKey))].map((c) => houblon(c)), bannis)).map((v) => {
    const cles = [...new Set(v.actions.filter((a) => a.op !== 'retirer').map((a) => a.hopKey))];
    const geste: Geste = v.type === 'assemblage' ? 'assembler' : v.type === 'ajouter' ? 'meme' : 'remplacer';
    return {
      v, cles,
      ligne: {
        n: 0, id: v.id, geste, houblons: cles.map((c) => houblon(c)),
        dose: v.type === 'assemblage' ? v.actions.map((a) => a.grams).join('+') + ' g' : geste === 'remplacer' ? `${v.actions[0].grams} g` : null,
        effets: fam(familles, (f) => (v.effect[f].established && v.effect[f].central != null ? v.effect[f].central : null)),
        hors: [...new Set(v.styleOverflow.map((o) => o.family))],
        stock: v.stock.status, estime: v.estimated, muet: null,
      } as Ligne,
      moment: v.actions[0].momentLabel, grams: v.actions[0].grams,
    };
  });
  // « Même effet sur tes objectifs » (q2b) : ajouts et assemblages au même moment, à la même dose totale, au même effet
  // sur les objectifs. Les autres assemblages vont au geste « Assembler 5 + 5 g ».
  const cle = (x: (typeof lignes)[number]) => JSON.stringify([x.moment, x.v.actions.reduce((s, a) => s + a.grams, 0), objectifs.map((o) => x.ligne.effets[o.f])]);
  const groupes: Groupe[] = [];
  const ajouts = lignes.filter((x) => x.ligne.geste !== 'remplacer');
  const parCle = new Map<string, typeof lignes>();
  for (const x of ajouts) parCle.set(cle(x), [...(parCle.get(cle(x)) ?? []), x]);
  const seuls: typeof lignes = [];
  let i = 0;
  for (const [, xs] of parCle) {
    if (xs.length < 2) { seuls.push(...xs); continue; }
    const tot = xs[0].v.actions.reduce((s, a) => s + a.grams, 0);
    groupes.push({ id: `meme-${i++}`, geste: 'meme', titre: i === 1 ? 'même effet sur tes objectifs' : 'même effet', dose: `${tot} g`, moment: xs[0].moment, estime: false,
      lignes: xs.map((x) => ({ ...x.ligne, geste: 'meme' as const, dose: x.ligne.geste === 'assembler' ? x.ligne.dose : null })) });
  }
  const assembler = seuls.filter((x) => x.ligne.geste === 'assembler');
  const ajoutSeul = seuls.filter((x) => x.ligne.geste !== 'assembler');
  if (ajoutSeul.length) groupes.push({ id: 'ajouter', geste: 'meme', titre: 'Ajouter', dose: null, moment: ajoutSeul[0].moment, estime: false, lignes: ajoutSeul.map((x) => ({ ...x.ligne, dose: `${x.grams} g` })) });
  if (assembler.length) groupes.push({ id: 'assembler', geste: 'assembler', titre: 'Assembler 5+5 g', dose: null, moment: assembler[0].moment, estime: true, lignes: assembler.map((x) => x.ligne) });
  const remp = lignes.filter((x) => x.ligne.geste === 'remplacer');
  if (remp.length) {
    const avant = remp[0].v.actions[0].previousHopKey;
    groupes.push({ id: 'remplacer', geste: 'remplacer', titre: `Remplacer ${avant ? houblon(avant).nom : ''}`.trim(), dose: null, moment: remp[0].moment, estime: false, lignes: remp.map((x) => x.ligne) });
  }
  // Dry hop (q2b : le geste « Dry hop ») : les meilleurs du stock sur la visée, au simulateur.
  const fv = objectifs.find((o) => o.sens > 0)?.f ?? objectifs[0]?.f;
  const dh = fv ? suggerer(recette, fv).filter((c) => !estMuet(c) && !exclue([c.houblon], bannis) && (c.visee?.centre ?? 0) > 0).slice(0, dryhopMax) : [];
  if (dh.length) groupes.push({ id: 'dryhop', geste: 'dryhop', titre: 'Dry hop', dose: `${CONDITIONS.doseGL} g/L`, moment: `après ${CONDITIONS.jours} j`, estime: true,
    lignes: dh.map((c) => ({
      n: 0, id: `dryhop-${c.cle}`, geste: 'dryhop', houblons: [c.houblon], dose: null,
      effets: fam(familles, (f) => c.lu.ecart[f]?.centre ?? null),
      hors: familles.filter((f) => c.lu.apres.profil[f].horsStyle != null),
      stock: c.stockSuffisant ? 'suffisant' : 'manque', estime: true, muet: null,
    })) });
  let n = 0;
  for (const g of groupes) for (const l of g.lignes) l.n = ++n;
  return groupes;
}

/** Le simulateur rend 0 exact partout alors que les fiches citent des familles : un inconnu, pas un zéro. */
export function estMuet(c: Candidat): boolean {
  const connus = Object.values(c.lu.ecart).filter((e) => e != null);
  return connus.length > 0 && connus.every((e) => e!.bas === 0 && e!.haut === 0)
    && Object.values(c.houblon.familles).some((x) => x.niveau !== 'non décrit');
}

/** Verdict d'un objectif, en un mot (q2b) : l'effet de la meilleure voie face au cran voulu. Atteint : le cran entier ;
 * Approche : la moitié au moins ; Aucune : moins. */
export function verdict(o: Objectif, groupes: Groupe[]): { mot: 'Atteint' | 'Approche' | 'Aucune'; meilleure: Ligne | null; effet: number | null } {
  const ls = groupes.flatMap((g) => g.lignes).filter((l) => l.effets[o.f] != null);
  if (!ls.length) return { mot: 'Aucune', meilleure: null, effet: null };
  const m = ls.reduce((b, l) => (o.sens * l.effets[o.f]! > o.sens * b.effets[o.f]! ? l : b));
  const e = m.effets[o.f]!, k = (o.sens * e) / Math.abs(o.requis);
  return { mot: k >= 1 ? 'Atteint' : k >= 0.5 ? 'Approche' : 'Aucune', meilleure: k > 0 ? m : null, effet: e };
}
