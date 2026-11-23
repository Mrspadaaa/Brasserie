// Aides des tests du rapprochement (voie l2-rapprochement). Aucune donnée réelle ; Gemini n'est jamais appelé :
// une « lecture » est un objet JSON, ce que le modèle aurait rendu.
import { normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';
import { entete, ligne, lecture372765 } from '../lecture/aide';

export { entete, ligne, lecture372765 };
export const lire = (raw: any) => normalizeInvoiceScan(raw) as any;
export const avec = (raw: any, index: number, patch: Record<string, unknown>) => ({ ...raw, items: raw.items.map((item: any, i: number) => (i === index ? { ...item, ...patch } : item)) });

/** Les trois lectures simulées de 372765 (diagnostic d1, mesures.ts) : mêmes chiffres, autres phrases ; B lit 4,15 comme TVA. */
export const lectureA = () => lecture372765();
export const lectureB = () => ({
  ...lecture372765(), tvaAmount: 4.15,
  fieldWarnings: [
    { field: 'tvaRate', message: "Plusieurs taux de TVA s'appliquent (8.1% et 2.6%), le champ global est fixé à null." },
    { field: 'invoiceNumber', message: "Le document indique 'Pro-Forma Rechnung (Online Payment) 372765', le statut légal peut correspondre à une facture pro-forma acquittée." },
  ],
});
export const lectureC = () => ({ ...lecture372765(), fieldWarnings: [{ field: 'tvaRate', message: 'Deux taux de TVA distincts (8.1 % et 2.6 %) sont présents sur le document.' }] });

/** Une ligne de malt et son en-tête, sans aucun point. */
export const malt = (over: Record<string, unknown> = {}) => ligne({ name: 'Malt fictif', reference: 'MA1', quantity: 2, unit: 'kg', price: 2.5, amountTTC: 5, ...over });
export const simple = (over: Record<string, unknown> = {}, items: any[] = [malt()]) => entete({ amountTTC: 5, items, ...over });
/** Un en-tête propre : une ligne 1 × 1 = 1, total 1, aucun point. */
export const propre = (over: Record<string, unknown> = {}) => entete({ amountTTC: 1, items: [ligne({ price: 1, amountTTC: 1 })], ...over });

const schrot = (raw: any) => raw.items.flatMap((item: any, i: number) => (item.name === 'Zuschlag Schrotung' ? [i] : []));
const permuter = (raw: any) => {
  const [a, b] = schrot(raw);
  return { ...raw, items: raw.items.map((item: any, i: number) => (i === a ? raw.items[b] : i === b ? raw.items[a] : item)) };
};
/** Le jeu de 20 paires : [nom, lecture 1, lecture 2, une troisième lecture doit partir APRÈS l2]. Mesuré avant l2 : 15 sur 20. */
export const corpus = (): Array<[string, any, any, boolean]> => {
  const base = lecture372765(), s = schrot(base);
  return [
    ['identiques', base, lecture372765(), false],
    ['stockCategory seule (ligne 1)', base, avec(base, 0, { stockCategory: 'Malt' }), false],
    ['Malz au lieu de Malt, même référence', avec(base, 0, { name: 'Pilsner Malz, Kg' }), avec(base, 0, { name: 'Pilsner Malt, Kg' }), false],
    ['lignes « Zuschlag Schrotung » dans un autre ordre', base, permuter(base), false],
    ['lignes répétées dont une catégorie de stock diffère', base, avec(permuter(base), s[0], { stockCategory: 'Service' }), false],
    ['prix seul différent', simple(), simple({}, [malt({ price: 2.4 })]), false],
    ['total imprimé 5 centimes au-dessus des lignes', simple({ amountTTC: 5.05 }), simple({ amountTTC: 5.05 }), false],
    ['ligne de 10 centimes hors prix × quantité', simple({ amountTTC: 5.1 }, [malt({ amountTTC: 5.1 })]), simple({ amountTTC: 5.1 }, [malt({ amountTTC: 5.1 })]), false],
    ['bloc TVA incohérent lu deux fois (372765 telle quelle)', base, lecture372765(), false],
    ['quantité 60 lue pour 6 (autre lecture : 6)', avec(base, 0, { quantity: 60 }), base, true],
    ['TVA 2,80 contre 4,15 (P5 : ne déclenche plus)', base, { ...lecture372765(), tvaAmount: 4.15 }, false],
    ['ligne de 3 centimes hors prix × quantité, lue deux fois', simple({ amountTTC: 5.03 }, [malt({ amountTTC: 5.03 })]), simple({ amountTTC: 5.03 }, [malt({ amountTTC: 5.03 })]), false],
    ['quantité 60 lue deux fois pour 6 (124,20 CHF, lectures identiques)', avec(base, 0, { quantity: 60 }), avec(base, 0, { quantity: 60 }), false],
    ["total faux (5 pour 1) lu deux fois à l'identique", propre({ amountTTC: 5 }), propre({ amountTTC: 5 }), false],
    ['prix divergent, seule la lecture 2 tient quantité × prix', simple({}, [malt({ price: 2.4 })]), simple(), false],
    ['autre produit, même référence (Cascade / Hallertau)', simple({}, [malt({ name: 'Cascade 5.5%', reference: 'HO1' })]), simple({}, [malt({ name: 'Hallertau 4.0%', reference: 'HO1' })]), true],
    ["ambiguïté d'une seule lecture (P3)", simple(), simple({}, [malt({ ambiguity: 'Quantité illisible.' })]), true],
    ['date différente', base, { ...lecture372765(), date: '28.04.2026' }, true],
    ['montant de ligne différent', base, avec(base, 2, { amountTTC: 2.5 }), true],
    ['ligne manquante dans une lecture', base, { ...lecture372765(), items: lecture372765().items.slice(1) }, true],
  ];
};
