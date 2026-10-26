// Voie c3c (#180) : lecteur Indie Hops sur du HTML synthétique (structure imitée, rien copié).
import { describe, expect, it } from 'vitest';
import { lireVarieteIndie } from '../../../scripts/collecte-hop/indiehops.mjs';

const page = (bloc: string[]) => `<html><head><title>Indie Hops Exemplum</title></head><body><div>Exemplum</div><div>BREWING PROFILE</div><div>Texte.</div>
<div>FORMS</div><div>T90s</div><div>Chemistry</div>${bloc.map(x => `<div>${x}</div>`).join('')}<div>Origins</div><div>Exemplum is our second hop release (2018). Prose.</div></body></html>`;

describe('lecteur Indie Hops', () => {
  it('lit le bloc Chemistry et l’année de sortie', () => {
    const v = lireVarieteIndie(page(['Alpha Acid', '12 - 15%', 'Cohumulone', '21%', 'Total Oil', '2.3 - 3.5mls/100g', 'Myrcene', '52 - 65%']))!;
    expect(v.nom).toBe('Exemplum');
    expect(v.publie).toBe(2018);
    expect(v.champs.alpha).toMatchObject({ min: 12, max: 15 });
    expect(v.champs.cohumulone).toMatchObject({ valeur: 21, min: null });
    expect(v.champs.huileTotale).toMatchObject({ min: 2.3, max: 3.5, unite: 'mL/100 g' });
  });
  it('un libellé sans valeur (Farnesene vide) reste null, jamais 0', () => {
    const v = lireVarieteIndie(page(['Alpha Acid', '12 - 15%', 'Farnesene']))!;
    expect(v.champs.farnesene).toMatchObject({ valeur: null, min: null, max: null });
  });
  it('lit les valeurs en % m/m et les bornes ouvertes d’un extrait', () => {
    const v = lireVarieteIndie(page(['Alpha Acid', '15 – 40% (w/w)', 'Total Oil', '> 40% (w/w)']))!;
    expect(v.champs.alpha).toMatchObject({ min: 15, max: 40, unite: '%' });
    expect(v.champs.huileTotale).toMatchObject({ min: 40, operateur: '>' });
    expect(v.champs.huileTotale.baseImplicite).toBeUndefined();
  });
  it('lit « mls/100grams », « ml/100gr » et « 8.% » (voie c3g)', () => {
    const v = lireVarieteIndie(page(['Alpha Acid', '5 – 6.5%', 'Total Oil', '1.1 – 1.6mls/100grams', 'Caryophyllene', '4 – 8.%', 'Humulene', '1.8-2.2 ml/100gr']))!;
    expect(v.champs.huileTotale).toMatchObject({ min: 1.1, max: 1.6, unite: 'mL/100 g' });
    expect(v.champs.caryophyllene).toMatchObject({ min: 4, max: 8, unite: '%' });
  });
  it('une page sans Chemistry rend null', () => {
    expect(lireVarieteIndie('<html><body><div>Accueil</div></body></html>')).toBeNull();
  });
});
