import type { FamilyId } from './families';
import type { Direction } from './voies';

/** Pistes hors houblon : liste fixe, sourcée, sans chiffres, marquée « hors modèle ».
 * Source de synthèse : work/refonte-frontend/v4/recherche/E-donnees-houblon.md, section 3. */
export interface OffModelLead {
  id: string; title: string; why: string; action: string;
  evidence: 'publié' | 'publié, mécanisme seulement' | 'hypothèse';
  sources: { title: string; url: string }[];
  horsModele: true;
}
const LEADS: Record<string, OffModelLead[]> = {
  resin: [
    { id: 'amertume', title: 'Amertume dans le haut de la bande du style',
      why: 'L’arôme de houblon rend l’amertume plus âpre et plus persistante ; en brasserie, « résineux » désigne aussi la sensation des résines amères.',
      action: 'Viser le bas de la bande d’IBU du style, à arôme égal.', evidence: 'publié, mécanisme seulement',
      sources: [{ title: 'Oladokun et al., Food Research International, 2016 ; Food Chemistry, 2017 (résumés relayés)', url: 'https://eprints.nottingham.ac.uk/35018/' }], horsModele: true },
    { id: 'torrefie', title: 'Malt torréfié',
      why: 'Le gaïacol et un méthylphénol, aux notes fumées, sont plus concentrés dans les bières brunes et les malts chocolat et noir ; aucune étude trouvée sur une confusion avec le résineux.',
      action: 'Revoir la part et le type de malts torréfiés avant de changer le houblon.', evidence: 'publié, mécanisme seulement',
      sources: [{ title: 'UCLouvain, Special beer aging: contribution of oxidation related compounds and roasted-like phenols (relayé)', url: 'https://research.dial.uclouvain.be/handle/2078.5/79821' }], horsModele: true },
    { id: 'oxydation', title: 'Oxydation du houblon ou de la bière',
      why: 'Un houblon âgé ou une bière vieillie peut porter des notes boisées ; le gaïacol des bières brunes augmente encore au vieillissement.',
      action: 'Vérifier l’âge et l’indice de stockage du houblon, et l’âge de la bière dégustée.', evidence: 'hypothèse',
      sources: [{ title: 'UCLouvain, Special beer aging (relayé)', url: 'https://research.dial.uclouvain.be/handle/2078.5/79821' }], horsModele: true },
    { id: 'dose-ebullition', title: 'Forte dose de houblon à l’ébullition',
      why: 'Après une longue ébullition le myrcène a disparu ; les produits d’oxydation de l’humulène et du caryophyllène orientent la bière vers le boisé, le foin et l’épicé.',
      action: 'Réduire la masse à l’ébullition à IBU égal, avec un houblon d’amertume plus riche en alpha et plus pauvre en huile.', evidence: 'publié, mécanisme seulement',
      sources: [
        { title: 'Praet, Van Opstaele, Aerts, De Cooman, J. Am. Soc. Brew. Chem. (relayé)', url: 'https://www.asbcnet.org/publications/journal/vol/2016/Pages/ASBCJ-2016-3257-01.aspx' },
        { title: 'Janish, Survivables: unpacking hot-side hop flavor (synthèse)', url: 'https://scottjanish.com/survivables-unpacking-hot-side-hop-flavor/' },
      ], horsModele: true },
  ],
};
/** Pistes hors modèle pour les familles que la direction veut baisser. */
export function offModelLeads(direction: Direction): { family: FamilyId; leads: OffModelLead[] }[] {
  return (Object.entries(direction) as [FamilyId, number][]).filter(([f, k]) => k < 0 && LEADS[f]).map(([family]) => ({ family, leads: LEADS[family] }));
}
