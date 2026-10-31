/**
 * Voie s1-stock (mission 2026-10-31-ecran-depense) — la chasse du 17.10 rejouée : 27 cas, un `it` par cas.
 *
 * Source : work/finalisation-tickets-2026-10-08/REV-JUS1/probe/v3d.hunt.test.ts (V3 n° 3 de JUS : 18 fausses propositions sur 27).
 * Données synthétiques. Règle du pilote : une proposition perdue (« manquée ») est permise, une FAUSSE ne l'est pas.
 * - juste    : la proposition attendue, ou aucune quand aucune n'était attendue ;
 * - manquée  : aucune proposition alors qu'un article juste existait (permis, compté à part) ;
 * - fausse   : une proposition qui n'est pas la bonne (interdit).
 * Un seul cas change d'attendu depuis le 17.10 : D5 (« Cascade · 2024 »), voir son commentaire.
 */
import { describe, expect, it } from 'vitest';
import { proposeStockItem } from '../../../../src/services/stockLineMatching';
import type { StockItem } from '../../../../src/types';

const item = (ref: string, name: string, category = 'Malt', unit = 'kg', supplier?: string): StockItem =>
  ({ id: ref, ref, name, category, unit, currentStock: 1, minStock: 0, reorder: false, supplier });
const hop = (ref: string, name: string) => item(ref, name, 'Houblon', 'g');
const yeast = (ref: string, name: string, unit = 'g') => item(ref, name, 'Levure', unit);

type Verdict = 'juste' | 'manquée' | 'fausse';
interface Cas { id: string; libelle: string; unite: string; quantite: number; stock: StockItem[]; fournisseur?: string;
  /** Référence de l'article attendu ; `undefined` = aucune proposition attendue. `refusee` = références qu'il ne faut JAMAIS proposer. */
  attendu?: string; refusee?: string[] }
const cas = (id: string, libelle: string, unite: string, quantite: number, stock: StockItem[], attendu?: string, fournisseur = '', refusee?: string[]): Cas =>
  ({ id, libelle, unite, quantite, stock, attendu, fournisseur, refusee });

const verdict = (k: Cas): Verdict => {
  const ref = proposeStockItem({ description: k.libelle, unit: k.unite, quantity: k.quantite, vendor: k.fournisseur }, k.stock)?.ref;
  if (ref === k.attendu) return 'juste';
  if (ref === undefined) return 'manquée';
  return 'fausse';
};

const CAS: Cas[] = [
  // A. un nombre d'identité juste avant l'unité (B-V3-4)
  cas('A1', 'Munich Type 2 Kg', 'kg', 25, [item('M', 'Malt Munich')]),
  cas('A2', 'Munich Type 2 Kg', 'kg', 25, [item('M', 'Malt Munich'), item('MT2', 'Malt Munich Type 2')], 'MT2'),
  cas('A3', 'Caramunich Type 3 Kg', 'kg', 25, [item('CM', 'Malt Caramunich')]),
  cas('A4', 'Carafa Special Type 2 kg', 'kg', 25, [item('CS', 'Malt Carafa Special')]),
  cas('A5', 'Crystal 150 Kg', 'kg', 25, [item('K', 'Malt Crystal')]),
  cas('A6', 'Carafa 2 Kg', 'kg', 25, [item('C1', 'Malt Carafa 1'), item('C', 'Malt Carafa')]),
  cas('A7 (témoin)', 'Munich · Type 2 · 25 kg', 'kg', 25, [item('M', 'Malt Munich')]),
  cas('A8 (témoin)', 'Munich Typ 2 Kg', 'kg', 25, [item('M', 'Malt Munich')]),
  // A9 : « proposé » le 17.10. Sous la règle du séparateur (un conditionnement collé au nom est de l'identité incertaine), il devient
  // une manquée permise ; la variante à virgule (« Malt Blond, 25 kg ») reste proposée (chasse-etendue.test.ts, E27).
  cas('A9 (témoin)', 'Malt Blond 25 kg', 'kg', 25, [item('P', 'Malt Blond')], 'P'),
  // B. homonymes entre catégories (B-V3-5)
  cas('B1', 'Crystal T90 Pellets', 'g', 100, [item('K', 'Malt Crystal')]),
  cas('B2', 'Houblon Crystal', 'g', 100, [item('K', 'Malt Crystal')]),
  cas('B3', 'Malt Crystal 25 kg', 'kg', 25, [hop('HC', 'Houblon Crystal')]),
  cas('B4', 'Levure Abbaye', 'g', 500, [item('A', 'Malt Abbaye')]),
  cas('B5', 'Levure Kölsch', 'g', 500, [item('KM', 'Kölschmalz')]),
  cas('B6', 'Hefe Weizen', 'g', 500, [item('W', 'Weizenmalz')]),
  cas('B7 (témoin)', 'Crystal T90 Pellets', 'g', 100, [item('K', 'Malt Crystal'), hop('HC', 'Houblon Crystal')], 'HC'),
  // C. mots du fournisseur du justificatif qui sont aussi une variante
  cas('C1', 'Munich Rauch', 'kg', 25, [item('M', 'Malt Munich')], undefined, 'Rauch AG'),
  cas('C2', 'Hallertau Blanc', 'g', 100, [hop('H', 'Houblon Hallertau')], undefined, 'Blanc SA'),
  cas('C3', 'Sucre candi roux', 'kg', 5, [item('S', 'Sucre candi', 'Sucre')], undefined, 'Roux & Fils SA'),
  cas('C4', 'Pilsner bio', 'kg', 25, [item('P', 'Malt Pilsner')], undefined, 'Bio Malz AG'),
  cas('C5 (témoin)', 'Cascade du Banc', 'g', 100, [hop('H', 'Houblon Cascade')], 'H', 'Malterie du Banc SA'),
  // D. divers
  cas('D1 (témoin)', 'Crystal 60L', 'kg', 25, [item('K', 'Malt Crystal 60 EBC')]),
  cas('D2', 'Crystal 60L', 'kg', 25, [item('K', 'Malt Crystal 60')]),
  cas('D3 (témoin)', 'Bouteille CO₂ 10 kg', 'pièce', 1, [item('N', 'Bouteille N₂ 10 kg', 'Consommable', 'pièce')]),
  cas('D4', 'Malt d’avoine', 'kg', 25, [item('O', 'Avoine')]),
  // D5 : « rien (année, perte assumée) » le 17.10. La consigne de cette voie (la récolte sort de l'identité) le rend « proposé,
  // récolte 2024 rendue à part » : même houblon, aucun article de récolte différente. Ce n'est pas une fausse proposition.
  // Une manquée y reste permise.
  cas('D5 (récolte)', 'Cascade · 2024', 'g', 100, [hop('H', 'Houblon Cascade')], 'H'),
  cas('D6 (témoin)', 'Wyeast 1056 · 125 ml', 'ml', 125, [yeast('Y', 'Wyeast 1056', 'ml')], 'Y')
];

describe('chasse du 17.10 rejouée : aucune fausse proposition', () => {
  it('compte 27 cas', () => expect(CAS).toHaveLength(27));
  for (const k of CAS) {
    it(`${k.id} : « ${k.libelle} »${k.fournisseur ? ` chez ${k.fournisseur}` : ''} → ${k.attendu ?? 'rien'} (jamais une fausse)`, () => {
      expect(verdict(k)).not.toBe('fausse');
    });
  }
  it('bilan : 0 fausse proposition ; les manquées sont comptées à part', () => {
    const bilan = CAS.map(k => [k.id, verdict(k)] as const);
    const fausses = bilan.filter(([, v]) => v === 'fausse').map(([id]) => id);
    const manquees = bilan.filter(([, v]) => v === 'manquée').map(([id]) => id);
    // eslint-disable-next-line no-console
    console.log(`CHASSE 17.10 : ${bilan.length} cas, ${fausses.length} fausse(s) [${fausses.join(' ')}], ${manquees.length} manquée(s) [${manquees.join(' ')}]`);
    expect(fausses).toEqual([]);
  });
});
