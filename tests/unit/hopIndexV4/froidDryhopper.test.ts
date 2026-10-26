// Voie p5-dryhopper-froid (26.10) : ce que les trois mini graphes de Dryhopper lisent dans froid.ts (son choix D, page m5).
// La fonction pure froidVue range les valeurs de x1 pour le dessin : aucune n'est inventée, l'inconnu reste « ? ».
import { describe, expect, it } from 'vitest';
import { bitternessScience } from '../../../src/domain/hopBitterness';
import { froidVue, plagePubliee } from '../../../src/ui/hopIndex/dryhopper/froidVue';
import type { AjoutParcours, RecetteParcours } from '../../../src/ui/hopIndex/parcours/types';

// La recette de sa capture : Nugget 20 g à 60′ (27,9 IBU à chaud), Cascade 80 g dans 20 L (4 g/L), dry hop après, 3 j, 21C, US-05.
const r21 = (extra: Partial<AjoutParcours> = {}, chaud: Partial<AjoutParcours> = {}): { recette: RecetteParcours; ajout: AjoutParcours } => {
  const ajout: AjoutParcours = { id: 'dry', hopKey: 'beermaverick-cascade', moment: 'dryPost', grams: 80, day: 7, jours: 3, ...extra };
  const recette: RecetteParcours = { name: 'Hazy du jeudi', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05',
    additions: [{ id: 'a60', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20, minutes: 60, ...chaud }, ajout] };
  return { recette, ajout };
};

describe('amertume au dry hop', () => {
  const { recette, ajout } = r21();
  const v = froidVue(recette, ajout);
  it('les trois nombres de la cellule : 22, 28, 34 ; le signe n’est pas établi (« ? »)', () => {
    expect(v.amer.calcule).toBe(true);
    expect(v.amer.chaud!).toBeCloseTo(27.9, 1);
    expect(v.amer.tous![0]).toBeCloseTo(22.3, 1);
    expect(v.amer.tous![1]).toBeCloseTo(34.0, 1);
    expect(v.amer.signe).toBe('?');
  });
  it('les essais Cascade seuls (22,3 à 26,3) en plein ; Centennial dans les autres essais', () => {
    expect(v.amer.variete!.nom).toBe('Cascade');
    expect(v.amer.variete!.plage[0]).toBeCloseTo(22.3, 1);
    expect(v.amer.variete!.plage[1]).toBeCloseTo(26.3, 1);
    expect(v.amer.deltaVariete![0]).toBeCloseTo(-5.6, 1);
    expect(v.amer.deltaVariete![1]).toBeCloseTo(-1.6, 1);
    expect(v.amer.autres).toEqual(['Centennial']);
    expect(v.amer.essais).toBe(5);
    expect(v.amer.source).toBe('Maye 2016');
  });
  it('le jour tenu hors des essais (1 à 5 j) est dit ; 3 j non', () => {
    expect(v.amer.horsEssais).toEqual([]);
    const sept = r21({ jours: 7 });
    expect(froidVue(sept.recette, sept.ajout).amer.horsEssais[0]).toMatch(/Contact de 7 j/);
  });
  it('une variété que les essais n’ont pas (Nugget) : aucune plage « de la variété », jamais celle d’un autre houblon', () => {
    const n = r21({ hopKey: 'beermaverick-nugget' });
    const w = froidVue(n.recette, n.ajout);
    expect(w.amer.variete).toBeNull();
    expect(w.amer.autres.sort()).toEqual(['Cascade', 'Centennial']);
  });
  it('dose au-delà des essais : aucune valeur, la raison du modèle ; l’inconnu n’est pas 0', () => {
    const g = r21({ grams: 300 });
    const w = froidVue(g.recette, g.ajout);
    expect(w.amer.calcule).toBe(false);
    expect(w.amer.chaud).toBeNull();
    expect(w.amer.tous).toBeNull();
    expect(w.amer.raisons.join(' ')).toMatch(/au-delà des essais/);
  });
  it('un α du lot inconnu à chaud ou une densité inconnue : l’IBU à chaud n’est pas supposé', () => {
    const l = r21({}, { alphaLot: null });
    expect(froidVue(l.recette, l.ajout).amer.calcule).toBe(false);
    const d = r21();
    d.recette.ibuInconnu = 'densité inconnue';
    expect(froidVue(d.recette, d.ajout).amer.raisons).toEqual(['densité inconnue']);
  });
  it('la science désactivée par le brasseur : « incomplète », aucune valeur', () => {
    const science = bitternessScience([{ ...bitternessScience()!, enabled: false }]);
    expect(science).toBeUndefined();
    const w = froidVue(recette, ajout, { science });
    expect(w.amer.calcule).toBe(false);
    expect(w.amer.raisons.join(' ')).toMatch(/absente, désactivée ou invalide/);
  });
  it('quand les IBU de froid.ts (α du catalogue) diffèrent du bandeau (α du lot) de plus de 0,5, la feuille le dit', () => {
    expect(froidVue(recette, ajout, { ibuBandeau: 28 }).amer.ecartBandeau).toBe(false);
    expect(froidVue(recette, ajout, { ibuBandeau: 31 }).amer.ecartBandeau).toBe(true);
  });
});

describe('hop creep', () => {
  it('moyen sur 2 crans à 3 j (après fermentation 1 + Cascade 1), 2 points ; l’ampleur n’est pas chiffrée', () => {
    const { recette, ajout } = r21();
    const c = froidVue(recette, ajout).creep;
    expect(c.risque).toBe('moyen');
    expect(c.crans).toBe(2);
    expect(c.points).toBe(2);
    expect(c.pourquoi).toBe('Après fermentation, et Cascade est cité parmi les plus actifs (H68).');
    expect(c.effets).toEqual(['atténuation en plus', 'CO₂', 'diacétyle possible']);
    expect(c.inconnus).toEqual(['levure encore viable', 'température']);
    expect(c.sources).toEqual(['H68', 'H84']);
  });
  it('le jour tenu compte : 7 j ajoute un point (H68)', () => {
    const a = r21({ jours: 7 });
    expect(froidVue(a.recette, a.ajout).creep.points).toBe(3);
  });
  it('le publié : +0,6 à +1,3 % vol. à 10 g/L (H68, H84), sans le +0,39 de H35 (2 j)', () => {
    const { recette, ajout } = r21();
    const p = froidVue(recette, ajout).creep.publie!;
    expect(p[0]).toBeCloseTo(0.57, 2);
    expect(p[1]).toBeCloseTo(1.3, 2);
    expect(plagePubliee(['10 g/L : +0,92 % vol., +0,57 (cônes) ; 20 g/L : +0,90', 'Cascade : +1,3 % vol.'])).toEqual([0.57, 1.3]);
    expect(plagePubliee(['aucun nombre'])).toBeNull();
  });
  it('une variété non citée par l’étude (Nugget) : sa variété est inconnue, jamais « faible »', () => {
    const n = r21({ hopKey: 'beermaverick-nugget' });
    const c = froidVue(n.recette, n.ajout).creep;
    expect(c.risque).toBe('faible');
    expect(c.pourquoi).toMatch(/activité non documentée/);
  });
});

describe('familles près de leur limite', () => {
  it('Cascade en 21C : végétal et herbacé dépassent leur borne de 5, résineux et floral s’en approchent (30)', () => {
    const { recette, ajout } = r21();
    const l = froidVue(recette, ajout).limite;
    expect(l.statut).toBe('évalué');
    const par = Object.fromEntries(l.lignes.map((x) => [x.famille, x]));
    expect(par.green).toMatchObject({ depasse: true, borne: 5, statut: 'indésirable' });
    expect(par.herbal).toMatchObject({ depasse: true, borne: 5 });
    expect(par.resin).toMatchObject({ depasse: false, borne: 30, statut: 'neutre' });
    expect(par.floral).toMatchObject({ depasse: false, borne: 30 });
    expect(par.green.valeur).toBeCloseTo(20.6, 1);
    expect(par.resin.valeur).toBeCloseTo(27.5, 1);
    expect(par.green.bande).toEqual([0, 5]);
    // Du plus loin au-dessus de la borne au plus proche d'elle : les colonnes de la cellule dans cet ordre.
    expect(l.lignes.map((x) => x.famille)).toEqual(['green', 'herbal', 'resin', 'floral']);
  });
  it('au moment tenu : un ajout à chaud n’a ni amertume à cru ni hop creep (sans objet), jamais une valeur', () => {
    const { recette, ajout } = r21({ moment: 'b10', minutes: 10 });
    const w = froidVue(recette, ajout);
    expect(w.amer.calcule).toBe(false);
    expect(w.creep.statut).toBe('sans objet');
    expect(w.creep.risque).toBeNull();
  });
});
