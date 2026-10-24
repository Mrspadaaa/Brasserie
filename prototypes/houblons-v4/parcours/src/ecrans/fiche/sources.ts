// Ce que les fiches du dépôt disent d'un houblon, source par source, pour la fiche g1 (« la v1 est la meilleure ») :
// l'α et le β de chaque fiche (Beer Maverick, Hopsteiner) avec leur année, l'huile totale et ses composants, les styles
// d'emploi d'un fournisseur, l'origine, et les auteurs de chaque famille. Lu en direct dans le catalogue du moteur
// (hopRef(cle).catalogue, describeFamilies), comme hopSheet (src/engine/fiches.ts) : aucune valeur recopiée ni inventée ;
// une donnée absente reste absente, avec sa raison (D14, D65).
import { FAMILIES, describeFamilies, hopRef, type FamilyId } from '../../../../src/engine';

export interface PlageSource { source: string; annee: number | null; min: number; max: number }
export interface ComposantHuile { nom: string; plage: PlageSource | null; raison: string | null }
export interface SourcesFiche {
  alpha: PlageSource[];
  /** La fiche la plus récente (g1 : « α 11–14 % », Hopsteiner 2025 pour Nugget) ; la première à année égale. */
  alphaRecente: PlageSource | null;
  beta: PlageSource[];
  huileTotale: PlageSource[];
  composants: ComposantHuile[];
  styles: string[]; stylesSources: string[]; stylesRaison: string | null;
  origine: string | null;
  /** Les fiches qui citent chaque famille (auteurs), dans l'ordre du moteur. */
  auteurs: { famille: FamilyId; fiches: number; sur: number; auteurs: string[] }[];
  /** Une seule fiche décrit ce houblon : son auteur (« 1 seule fiche : Beer Maverick »), sinon null. */
  seuleFiche: string | null;
  /** Descripteurs de Beer Maverick, en français. */
  descripteurs: string[];
  /** Un produit cryo porte les plages de sa variété en pellets : sa propre fiche manque (#131). */
  cryo: boolean;
}

const lignes = (bm: [number, number] | null, an: number | null, hs: [number, number] | null, anHs: number | null): PlageSource[] => [
  ...(bm ? [{ source: 'Beer Maverick', annee: an, min: bm[0], max: bm[1] }] : []),
  ...(hs ? [{ source: 'Hopsteiner', annee: anHs, min: hs[0], max: hs[1] }] : []),
];

const CACHE = new Map<string, SourcesFiche>();
export function sourcesFiche(cle: string): SourcesFiche | null {
  const vu = CACHE.get(cle);
  if (vu) return vu;
  const h = hopRef(cle);
  if (!h) return null;
  const c = h.catalogue, hs = c.hs;
  const alpha = lignes(c.alpha, c.bmYear, hs?.alpha ?? null, hs?.year ?? null);
  const alphaRecente = alpha.reduce<PlageSource | null>((a, s) => (!a || (s.annee ?? 0) > (a.annee ?? 0) ? s : a), null);
  const comp = (nom: string, r: [number, number] | null): ComposantHuile =>
    ({ nom, plage: r ? { source: 'Beer Maverick', annee: c.bmYear, min: r[0], max: r[1] } : null, raison: r ? null : 'non renseigné' });
  const d = describeFamilies(h.varietyId);
  const auteurs = FAMILIES.filter((f) => d[f].sources > 0).map((f) => ({ famille: f, fiches: d[f].sources, sur: d[f].of, auteurs: d[f].authors }));
  const sur = FAMILIES.map((f) => d[f].of).find((n) => n > 0) ?? 0;
  const r: SourcesFiche = {
    alpha, alphaRecente,
    beta: lignes(c.beta, c.bmYear, hs?.beta ?? null, hs?.year ?? null),
    huileTotale: lignes(c.oil, c.bmYear, hs?.totalOil ?? null, hs?.year ?? null),
    composants: [
      comp('myrcène', c.oils.myrcene), comp('humulène', c.oils.humulene), comp('caryophyllène', c.oils.caryophyllene),
      { nom: 'farnésène', plage: null, raison: 'Publié par Beer Maverick, non importé dans le dépôt.' },
      c.hsLinalool
        ? { nom: 'linalol', plage: { source: 'Hopsteiner', annee: c.hsLinalool.year, min: c.hsLinalool.range[0], max: c.hsLinalool.range[1] }, raison: null }
        : { nom: 'linalol', plage: null, raison: 'non renseigné' },
    ],
    styles: (c.usage ?? []).flatMap((u) => u.styles),
    stylesSources: (c.usage ?? []).map((u) => u.source).filter((s): s is string => !!s),
    stylesRaison: c.usage?.length ? null : 'Aucun usage attesté dans le dépôt (usages fournisseurs connus pour les IPA seulement).',
    origine: c.origin,
    auteurs,
    seuleFiche: sur === 1 ? auteurs.find((a) => a.auteurs.length)?.auteurs[0] ?? null : null,
    descripteurs: c.tagsFr ?? [],
    cryo: h.stock?.form === 'cryo' || /:cryo$/.test(cle),
  };
  CACHE.set(cle, r);
  return r;
}

/** « Beer Maverick 2023 ». */
export const nomSource = (s: PlageSource) => s.source + (s.annee ? ` ${s.annee}` : '');
