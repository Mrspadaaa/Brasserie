// Voie c3c (#180) : lecteurs USA Hops (Sensory Finder, avis USDA-ARS) sur HTML et texte synthétiques.
import { describe, expect, it } from 'vitest';
import { lireAvisThora, lireAvisVera, lireSensoryFinder } from '../../../scripts/collecte-hop/usahops.mjs';

describe('Sensory Finder USA Hops', () => {
  const html = `<div class="filter key" data-filter="char_4"><img alt="Citrus"/><p>Citrus</p></div>
  <div class="filter key" data-filter="char_5"><img alt="Floral"/><p>Floral</p></div>
  <div class="varieties"><div id="sync-mix-1-main" class="mix char_4 char_5">
Exemplum®
</div><div id="sync-mix-2-main" class="mix char_5">Autre</div></div>`;
  it('relie chaque variété à ses catégories d’arôme', () => {
    const { varietes } = lireSensoryFinder(html);
    expect(varietes).toEqual([{ nom: 'Exemplum', categories: ['Citrus', 'Floral'] }, { nom: 'Autre', categories: ['Floral'] }]);
  });
});

describe('avis USDA-ARS', () => {
  const vera = `USDA-ARS Exemplum is an aroma hop with low alpha-acids (3.79 in small plot trials, where it was similar, and 5.44% on-farm), moderate beta acids (4.59% in small plot trials, and 4.65% on-farm),
  and produced 0.814 mL/100g oil in small plot trials and 1.31 mL/100g on-farm. It has higher percent co-humulone in the alpha acids (45%), and higher terpene content of linalool (0.85%), farnesene (19.3%),
  and lower caryophyllene (3.98%). Humuluene (10%) and geraniol (0.58%) were similar, and myrcene (42.5%), and b-pinene (0.65%) were similar. Formerly W1108-333 or HRC003 (or HRC 3).`;
  it('distingue l’essai en parcelle et l’essai chez le producteur, et garde le β-pinène et le géraniol', () => {
    const v = lireAvisVera(vera);
    expect(v.champs.alpha).toMatchObject({ valeur: 3.79, contexte: expect.stringContaining('parcelle') });
    expect(v.champs.alphaFerme).toMatchObject({ valeur: 5.44, contexte: expect.stringContaining('producteur') });
    expect(v.champs.huileTotale.valeur).toBe(0.814);
    expect(v.champs.huileTotaleFerme.valeur).toBe(1.31);
    expect(v.champs.linalol.valeur).toBe(0.85);
    expect(v.champs.geraniol.valeur).toBe(0.58);
    expect(v.champs.betaPinene.valeur).toBe(0.65);
    expect(v.champs.farnesene.valeur).toBe(19.3);
    expect(v.alias).toEqual(expect.arrayContaining(['W1108-333', 'HRC003']));
  });
  it('un texte sans chiffres ne produit aucun champ (jamais 0)', () => {
    expect(lireAvisVera('rien de chiffré ici').champs).toEqual({});
  });
  it('lit l’α moyen et les thiols cités de l’avis Thora', () => {
    const t = lireAvisThora('formerly known as HQG4 ... high concentrations of thiols--compounds like 4MMP, 3S4MP, and 3MH--that meet or exceed levels. With alpha acids averaging 8.7%, a smooth bitterness.');
    expect(t.champs.alpha).toMatchObject({ valeur: 8.7 });
    expect(t.alias).toEqual(['HQG4']);
    expect(t.listes.thiols).toEqual(['4MMP', '3S4MP', '3MH']);
  });
});
