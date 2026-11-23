// Voie c3c (#180) : lecteur HPA et outils communs de la voie, sur du HTML et du texte synthétiques (structure imitée, rien copié).
import { describe, expect, it } from 'vitest';
import { lireFichePdfHpa, lireListeHpa, lireVarieteHpa } from '../../../scripts/collecte-hop/hpa.mjs';
import { champ, lireValeur, variantesDeNom } from '../../../scripts/collecte-hop/c3c-commun.mjs';

const page = `<html><head><title>Exemplum &#8211; HPA</title></head><body><p>BEER SENSORY</p><p>Ancestry</p><p>Souche A, Souche B</p>
<p>Recommended beer styles</p><p>IPA, Lager</p><p>ANALYTICAL DATA</p>
<p>Alpha Acids (%)</p><p>10.0 – 12.5</p><p>Cohumulone (% of alpha acids)</p><p>30.0 – 35.0</p>
<p>Total Oils (ml/100g)</p><p>1.1 – 1.6</p><p>Linalool (% of whole oil)</p><p>0.5 – 1.0</p><p>Farnesene (% of whole oil)</p><p>Unknown</p>
<p>BACK TO ALL HOPS</p></body></html>`;

describe('lecteur HPA', () => {
  it('lit les champs analytiques d’une page de variété avec unité et base', () => {
    const v = lireVarieteHpa(page)!;
    expect(v.nom).toBe('Exemplum');
    expect(v.champs.alpha).toMatchObject({ champ: 'Alpha Acids (%)', min: 10, max: 12.5, unite: '%' });
    expect(v.champs.cohumulone).toMatchObject({ min: 30, max: 35, base: '% des α' });
    expect(v.champs.huileTotale).toMatchObject({ min: 1.1, max: 1.6, unite: 'mL/100 g' });
    expect(v.champs.linalol).toMatchObject({ min: 0.5, max: 1, base: "% de l'huile" });
    expect(v.listes.ascendance).toEqual(['Souche A', 'Souche B']);
    expect(v.listes.styles).toEqual(['IPA', 'Lager']);
  });
  it('un « Unknown » reste null, jamais 0', () => {
    const f = lireVarieteHpa(page)!.champs.farnesene;
    expect(f).toMatchObject({ valeur: null, min: null, max: null });
  });
  it('une page sans bloc analytique rend null', () => {
    expect(lireVarieteHpa('<html><title>Citra – HPA</title><body><p>rien</p></body></html>')).toBeNull();
  });
  it('lit la liste : région, descripteurs, α et huile par fiche PDF', () => {
    const html = `<div><p>Australia</p><p>Mango, berry</p><p>Alpha Acid: 13.2 – 16.6%</p><p>Total Oils: 1.9 – 2.5 ml/100g</p><a href="https://hops.test/x/HPA-Exemplum-Data-Sheet.pdf">Download</a></div>`;
    const [e] = lireListeHpa(html);
    expect(e).toMatchObject({ nom: 'Exemplum', region: 'Australia', descripteurs: ['Mango', 'berry'], alpha: '13.2 – 16.6%' });
  });
  it('lit le tableau d’une fiche PDF (texte en colonnes) et sa ligne d’arômes isolée', () => {
    const texte = ['UNITED STATES   EXEMPLUM', '', 'Un paragraphe, avec une virgule, qui continue sur la ligne.', 'Alpha (%)        8.0-11.0', 'Beta (%)         6.0-7.0',
      'Humulene (% of Total Oil)', 'Linalool (% of Total Oil)    2-4', 'Total Polyphenols (%)   --'].join('\n');
    const avecAromes = ['', 'Mandarine, citron, melon.', '', texte].join('\n');
    const f = lireFichePdfHpa(avecAromes);
    expect(f.champs.alpha).toMatchObject({ min: 8, max: 11 });
    expect(f.champs.humulene).toMatchObject({ min: null, max: null, valeur: null });
    expect(f.champs.linalol).toMatchObject({ min: 2, max: 4 });
    expect(f.descripteurs).toEqual(['Mandarine', 'citron', 'melon']);
  });
  it('voie c3g : une cellule « — » décale les colonnes (-layout) ; l’ordre de lecture (-raw) garde chaque valeur avec son libellé', () => {
    const colonnes = ['Alpha (%)      11.5-13.5', 'Total Oil (ml/100g)', 'Myrcene (% of Total Oil)    1-1.5', 'Humulene (% of Total Oil)   47-53', 'Linalool (% of Total Oil)'].join('\n');
    const brut = ['Alpha (%) 11.5-13.5', 'Total Oil (ml/100g) 1-1.5', 'Myrcene (% of Total Oil) 47-53', 'Humulene (% of Total Oil) 13-16', 'Linalool (% of Total Oil) —'].join('\n');
    const f = lireFichePdfHpa(colonnes, brut);
    expect(f.champs.huileTotale).toMatchObject({ min: 1, max: 1.5, unite: 'mL/100 g' });
    expect(f.champs.myrcene).toMatchObject({ min: 47, max: 53 });
    expect(f.champs.humulene).toMatchObject({ min: 13, max: 16 });
    expect(f.champs.linalol).toMatchObject({ min: null, max: null, valeur: null });
  });
  it('voie c3g : fiche à blocs (libellés, puis valeurs dans le même ordre)', () => {
    const f = lireFichePdfHpa(['Alpha Acids*', 'Beta Acids', 'Total Oil', '13.0 – 15.0%', '8.0 – 10.0%', '1.5 – 2.0 ml/100g', 'Myrcene', 'Humulene', '50 – 55%', '7 – 8%'].join('\n'));
    expect(f.champs.alpha).toMatchObject({ min: 13, max: 15 });
    expect(f.champs.beta).toMatchObject({ min: 8, max: 10 });
    expect(f.champs.huileTotale).toMatchObject({ min: 1.5, max: 2 });
    expect(f.champs.myrcene).toMatchObject({ min: 50, max: 55 });
    expect(f.champs.humulene).toMatchObject({ min: 7, max: 8 });
  });
});

describe('outils communs de la voie c3c', () => {
  it('lit plages, valeur seule, bornes et vide', () => {
    expect(lireValeur('6.5-9.4%')).toMatchObject({ min: 6.5, max: 9.4, unite: '%' });
    expect(lireValeur('21%')).toMatchObject({ valeur: 21, min: null, max: null });
    expect(lireValeur('<1.0 %')).toMatchObject({ max: 1, operateur: '<', min: null });
    expect(lireValeur('> 40% (w/w)')).toMatchObject({ min: 40, operateur: '>' });
    expect(lireValeur('1.5 - 2.3mls/100g')).toMatchObject({ min: 1.5, max: 2.3, unite: 'mL/100 g' });
    for (const vide of ['Unknown', '-', '0-0', '0 – 0 %', '']) expect(lireValeur(vide)).toMatchObject({ valeur: null, min: null, max: null });
  });
  it('donne une clé stable au nom de champ publié et garde le nom tel qu’écrit', () => {
    const c = champ('Caryophyline', '4.0 - 8.0 %');
    expect(c.cle).toBe('caryophyllene');
    expect(c.valeur.champ).toBe('Caryophyline');
    expect(champ('Beta-Pinene (% of total oil)', '0.65').cle).toBe('betaPinene');
  });
  it('propose des variantes de nom sans code d’obtenteur, marque ni préfixe de pays', () => {
    expect(variantesDeNom('GR Perle')).toContain('Perle');
    expect(variantesDeNom('Citra HBC 394')).toContain('Citra');
    expect(variantesDeNom('Hop Revolution Motueka')).toContain('Motueka');
    expect(variantesDeNom('Thora - Estate Grown')).toContain('Thora');
  });
});
