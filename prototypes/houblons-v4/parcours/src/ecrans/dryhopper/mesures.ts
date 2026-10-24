// La vraie valeur sourcée de Dryhopper, toujours celle du houblon en brouillon (L14 : le 23.10, la valeur d'Idaho 7
// s'affichait avec Nelson Sauvin placé). Deux sources, lues telles quelles :
// - les mesures en bière du moteur (verifications(), composes-houblon.json) ;
// - les comparatifs de dry hop du lot 21 (fils21-choisir/donnees/comparatifs-dryhop.json, E01 à E10), ligne de LA
//   variété seulement.
// Une mesure ne se montre qu'au moment qu'elle documente (dry hop actif ou après fermentation) ; sinon, ou si le
// houblon n'en a pas : null, et l'écran dit « ? », jamais une valeur d'un autre houblon.
// Place future : une table de mesures sourcées de l'app (src/domain/hops/), servie par l'adaptateur (besoin socle).
import { verifications } from '../../../../src/engine';
import comparatifs from '../../../../data/comparatifs-dryhop.json'; // copie de work/…/fils21-choisir/donnees (data/copies-de-work.mjs)
import type { FamilyId } from '../../../../src/engine';
import type { Seg } from './frise';

export interface Mesure {
  compose: string;
  famille: FamilyId | null;
  /** Valeur lisible avec son unité (« 38 µg/L », « 5,8–10,4 ng/L »). */
  texte: string;
  /** Auteur et année, ou référence (« McCabe 2023 », « H12 »). */
  source: string;
  /** Pour data-source : l'étude et la variété. */
  cle: string;
}

interface MesureEtude { variete: string; compose?: string; valeur: number | string; unite: string; famille: string | null }
interface Etude { id: string; ref: string; conditions: { moment: string | null }; mesures: MesureEtude[] }

const norm = (s: string) => s.toLowerCase().replace(/[-\s]+/g, ' ').trim();
const fr = (x: number) => x.toLocaleString('fr-CH', { maximumFractionDigits: x < 10 ? 1 : 0 });
const FAMILLE_COMPOSE: Record<string, FamilyId> = { linalol: 'floral', geraniol: 'floral', myrcene: 'resin', humulene: 'herbal', caryophyllene: 'spice', '4MMP': 'tropical', '3MH': 'citrus', '3M4MP': 'citrus' };
const NOM_COMPOSE: Record<string, string> = { geraniol: 'géraniol', myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène' };

/** Phase(s) documentée(s) par une étude du lot 21 : E03 est au levurage (co-fermentation, le plus proche : actif) ;
 * un dry hop « dans le fût » est après fermentation ; un dry hop sans phase dite vaut pour les deux, et le dit. */
function phases(e: Etude): Seg[] {
  const m = norm(e.conditions.moment ?? '');
  if (/pitch|levurage|mise en levure/.test(m)) return [2];
  if (/fût|fut|garde|maturation|après/.test(m)) return [3];
  if (/dry hop/.test(m)) return [2, 3];
  return [];
}

/** Ordre de préférence : le floral d'abord (sa demande : « plus florale »), puis les autres familles. */
const rang = (f: FamilyId | null) => (f === 'floral' ? 0 : f ? 1 : 2);

/** p4b2f, après fermentation : la durée de contact mesurée au nez (E10, Titus 2021 : « 1 h ≈ 96 h », non distinguables
 * par le panel en bière jeune). L'étude porte sur Cascade, pas sur le houblon en brouillon (L14) : la variété est rendue
 * avec la mesure, jamais tue. Lue dans comparatifs-dryhop.json ; null si l'étude n'y est pas. */
export interface Duree { texte: string; source: string; variete: string; cle: string }
export function dureeDeContact(): Duree | null {
  const e = (comparatifs as unknown as { etudes: (Etude & { varietes?: string[]; conditions: { jours?: unknown } })[] }).etudes.find((x) => x.id === 'E10');
  if (!e) return null;
  const m = /\((\d+\s*h)\s*à\s*(\d+\s*h)\)/.exec(String(e.conditions.jours ?? ''));
  const indistinct = e.mesures.some((x) => /non distinguable/.test(String(x.valeur)));
  if (!m || !indistinct) return null;
  const auteur = e.ref.split(/[\s,]/)[0];
  const annee = (e.ref.match(/(19|20)\d{2}/) ?? [''])[0];
  const variete = e.varietes?.[0] ?? '?';
  return { texte: `${m[1]} ≈ ${m[2]}`, source: `${auteur} ${annee}`.trim(), variete, cle: `E10 ${auteur} ${annee} · ${variete}` };
}

export function mesureDe(nomHoublon: string, seg: Seg): Mesure | null {
  if (seg < 2) return null;
  const n = norm(nomHoublon);
  const cands: (Mesure & { r: number })[] = [];
  for (const v of verifications()) {
    if (norm(v.houblon) !== n || v.mesure.min == null) continue;
    // La note du moteur dit « dry hop en fermentation active » pour un ajout au moût refroidi ; sans note : après.
    const phase: Seg = /fermentation active/.test(v.note ?? '') ? 2 : 3;
    if (phase !== seg) continue;
    const mn = v.mesure.min, mx = v.mesure.max ?? mn;
    const f = FAMILLE_COMPOSE[v.compose] ?? null;
    const s = v.sources[0];
    cands.push({ compose: NOM_COMPOSE[v.compose] ?? v.compose, famille: f, texte: `${mn === mx ? fr(mn) : `${fr(mn)}–${fr(mx)}`} ${v.unite}`,
      source: s ? s.cle : 'moteur', cle: `${s?.cle ?? 'moteur'} · ${v.houblon}`, r: rang(f) });
  }
  for (const e of (comparatifs as unknown as { etudes: Etude[] }).etudes) {
    if (!phases(e).includes(seg)) continue;
    for (const m of e.mesures) {
      if (norm(m.variete) !== n || typeof m.valeur !== 'number' || !m.compose || !/\/\s*L/.test(m.unite)) continue;
      const ug = m.unite === 'mg/L' && m.valeur < 1;
      const auteur = e.ref.split(/[\s,]/)[0];
      const annee = (e.ref.match(/(19|20)\d{2}/) ?? [''])[0];
      const f = (m.famille as FamilyId | null) ?? null;
      cands.push({ compose: m.compose, famille: f, texte: `${fr(ug ? m.valeur * 1000 : m.valeur)} ${ug ? 'µg/L' : m.unite}`,
        source: `${auteur} ${annee}`.trim(), cle: `${e.id} ${auteur} ${annee} · ${m.variete}`, r: rang(f) });
    }
  }
  cands.sort((a, b) => a.r - b.r);
  if (!cands.length) return null;
  const { r: _r, ...m } = cands[0];
  return m;
}
