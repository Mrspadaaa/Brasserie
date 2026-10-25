// La levure : double impact (arôme propre, expression du houblon), leviers et signaux de
// biotransformation (work/refonte-frontend/v4/ecran-1/MODELE.md, « La levure » ; R43, R44 ;
// rapport E, recommandation 8). Aucun chiffre inventé : le modèle V5.5 ou une source citée.
import factsFile from '../../../data/hopV4/faits-cites.json';
import { catalogue as catalogueDuMoteur, EXTRAPOLATION, YEASTS, hopRef } from './data';
import { FAMILIES, type FamilyId } from './families';
import { MOMENTS, predictTriplet, tripletOf, yeastInfo, type Addition, type Recipe, type YeastInfo } from './recipe';
import type { FamilyEffect } from './voies';

const round1 = (x: number) => Math.round(x * 10) / 10;
const strainOf = (id: string | null) => EXTRAPOLATION.yeasts.find((s) => s.yeastId === id);
export const CHARACTERIZED_YEASTS = EXTRAPOLATION.yeasts.map((s) => s.yeastId);

/** Profil de la seule levure (ajout à dose nulle) : l'arôme propre selon V5.5, sur l'échelle 0–100. */
function yeastOnly(recipe: Recipe, yeastId: string | null) {
  const a: Addition = recipe.additions[0] ?? { id: 'fond', hopKey: catalogueDuMoteur()[0].id, moment: 'b60', grams: 0 };
  return predictTriplet({ ...tripletOf(a, { ...recipe, yeastId }), doseGL: 0 }, {});
}

export interface YeastDoubleImpact extends YeastInfo {
  /** (1) Arôme propre (expression fermentaire) : repère V5.5 à dose de houblon nulle, par famille ;
   * « spécifique » si la souche a un paramètre pour cette famille, sinon enveloppe commune ; « inconnu » si non caractérisée. */
  aromePropre: Record<FamilyId, { min: number; max: number; central?: number; specifique: boolean } | 'inconnu'>;
  /** (2) Effet sur l'expression du houblon : facteur latent du modèle (multiplie l'apport du houblon). */
  expression: { facteur: { min: number; max: number }; central: number; parFamille: boolean; note: string } | 'inconnu';
  sources: string[];
}
export function yeastDoubleImpact(recipe: Recipe): YeastDoubleImpact {
  const info = yeastInfo(recipe.yeastId), strain = strainOf(recipe.yeastId);
  if (!strain) return { ...info, aromePropre: Object.fromEntries(FAMILIES.map((f) => [f, 'inconnu'])) as YeastDoubleImpact['aromePropre'], expression: 'inconnu', sources: [] };
  const p = yeastOnly(recipe, recipe.yeastId);
  const aromePropre = Object.fromEntries(FAMILIES.map((f) => {
    const e = p.profile[f];
    return [f, e?.range ? { min: round1(e.range.min), max: round1(e.range.max), ...(e.central !== undefined ? { central: round1(e.central) } : {}), specifique: !!(strain.aroma as Record<string, unknown>)[f] } : 'inconnu'];
  })) as YeastDoubleImpact['aromePropre'];
  const specific = Object.keys(strain.expression ?? {}).length > 0;
  const ex = strain.otherExpression ?? EXTRAPOLATION.defaultYeast.expression;
  return { ...info, aromePropre, sources: [strain.source.title, ...strain.evidence.map((e) => `${e.author} : ${e.title}`)],
    expression: { facteur: ex.range, central: ex.central, parFamille: specific,
      note: specific ? 'Facteur propre à certaines familles.' : 'Même facteur pour toutes les familles, et le même pour les trois souches caractérisées : le modèle ne distingue pas leur effet sur l’expression du houblon.' } };
}

/** Effet d'un changement de levure : différence des repères V5.5 de la levure seule (arôme propre).
 * Établi seulement pour les familles où l'une des deux souches a un paramètre propre. */
export function yeastChangeEffect(recipe: Recipe, toYeastId: string): Record<FamilyId, FamilyEffect> | null {
  const from = strainOf(recipe.yeastId), to = strainOf(toYeastId);
  if (!from || !to) return null;
  const p0 = yeastOnly(recipe, recipe.yeastId), p1 = yeastOnly(recipe, toYeastId);
  return Object.fromEntries(FAMILIES.map((f) => {
    const c0 = p0.profile[f]?.central, c1 = p1.profile[f]?.central;
    const established = (!!(from.aroma as Record<string, unknown>)[f] || !!(to.aroma as Record<string, unknown>)[f]) && c0 !== undefined && c1 !== undefined;
    return [f, { family: f, central: established ? round1(c1! - c0!) : null, established, partial: false }];
  })) as Record<FamilyId, FamilyEffect>;
}

// ---------- Signaux d'un ajout à froid ----------
export interface YeastSignal {
  id: 'geraniol-citronellol' | 'thiols' | 'hop-creep';
  titre: string; statut: 'possible' | 'non évaluable';
  pourquoi: string; quantifie: false;
  sources: { title: string; url: string }[];
}
const SIGNAL_FACTS = (factsFile as { signaux?: { varietyId: string; signal: string; quote: string; source: { title: string; reference: string } }[] }).signaux ?? [];
export function yeastSignals(a: Addition, recipe: Recipe): { additionId: string; hop: string; moment: string; jour: string | null; levure: YeastInfo; signaux: YeastSignal[] } | null {
  const m = MOMENTS[a.moment];
  if (m.timing !== 'fermentation' && m.timing !== 'postFermentation') return null;
  const ref = hopRef(a.hopKey)!, active = m.timing === 'fermentation';
  const yeast = YEASTS.find((y) => y.id === recipe.yeastId);
  const pred = predictTriplet(tripletOf(a, recipe), {});
  const risk = (code: string) => pred.risks.find((r) => r.code === code);
  const signaux: YeastSignal[] = [];
  // 1. Géraniol → citronellol : le floral peut glisser vers les agrumes (Takoi et al. 2010).
  const lin = ref.catalogue.hsLinalool;
  signaux.push({ id: 'geraniol-citronellol', titre: 'Géraniol → citronellol : le floral peut glisser vers les agrumes',
    statut: active && lin ? 'possible' : 'non évaluable',
    pourquoi: !active ? 'Ajout après fermentation : la levure active n’est plus là pour transformer les terpènes.'
      : lin ? `Linalol documenté (${lin.range[0]}–${lin.range[1]} % de l’huile, Hopsteiner) ; géraniol non renseigné dans le dépôt. Sens possible, ampleur non quantifiée.`
      : 'Aucune fiche ni huile du dépôt ne cite géraniol ou linalol pour ce houblon : signal non évaluable, ce qui ne veut pas dire absent.',
    quantifie: false,
    sources: [{ title: 'Takoi et al., The contribution of geraniol metabolism to the citrus flavour of beer, J. Inst. Brew., 2010 (relayé)', url: 'https://asbcnet.org/publications/journal/vol/abstracts/ASBCJ-2014-0116-01.htm' },
      ...(lin ? [{ title: 'Hopsteiner, fiche variété (linalol)', url: lin.reference }] : [])] });
  // 2. Thiols : libération par la levure (β-lyase), si le houblon est connu pour ses précurseurs.
  const thiolFacts = SIGNAL_FACTS.filter((s) => s.varietyId === ref.varietyId && s.signal === 'thiols');
  const thiolClass = ref.catalogue.hsThiol;
  const known = thiolFacts.length > 0 || (thiolClass && thiolClass.class !== 'faible');
  const prec = risk('precursors');
  signaux.push({ id: 'thiols', titre: 'Libération de thiols : tropical, cassis',
    statut: active && known ? 'possible' : 'non évaluable',
    pourquoi: [!active ? 'Ajout après fermentation : la transformation des précurseurs par la levure est peu probable.' : '',
      thiolFacts.map((s) => `${s.quote} (${s.source.title.split(',')[0]}).`).join(' '),
      thiolClass ? `Classe Hopsteiner « Thiol impact » : ${thiolClass.class} (thiols libres du houblon, pas un rendement).` : '',
      !known ? 'Aucune donnée du dépôt sur les précurseurs de ce houblon.' : '',
      `Levure ${yeast?.name ?? 'inconnue'} : β-lyase ${yeast?.betaLyase === 'positive' ? 'positive documentée' : yeast?.betaLyase === 'negative' ? 'négative documentée' : 'inconnue'}${prec ? ` ; ${prec.message.split('.')[0]}.` : '.'}`].filter(Boolean).join(' '),
    quantifie: false,
    sources: [...thiolFacts.map((s) => ({ title: s.source.title, url: s.source.reference })),
      ...(thiolClass?.reference ? [{ title: 'Hopsteiner, fiche variété (classe thiols)', url: thiolClass.reference }] : []),
      { title: 'Molitor, Shellhammer, Hop biotransformation & yeast, Lallemand Brewing, 2023', url: 'https://www.lallemandbrewing.com/en/asia/resources/whats-new/hop-biotransformation-by-brewing-yeast/' },
      ...(prec ? [{ title: prec.source.title, url: prec.source.reference }] : [])] });
  // 3. Hop creep : refermentation, atténuation, diacétyle (politique de risque V5.5).
  const creep = risk('hopCreep');
  signaux.push({ id: 'hop-creep', titre: 'Hop creep : refermentation, atténuation plus poussée, diacétyle',
    statut: creep ? 'possible' : 'non évaluable',
    pourquoi: creep ? `${creep.message} Ampleur non quantifiée.` : 'Politique de risque V5.5 absente.', quantifie: false,
    sources: creep ? [{ title: creep.source.title, url: creep.source.reference }] : [] });
  return { additionId: a.id, hop: ref.name, moment: m.label, jour: a.day ? `J+${a.day}` : null, levure: yeastInfo(recipe.yeastId), signaux };
}
