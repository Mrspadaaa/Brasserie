// PALIERS-EDITION-MAL (25.11, « L'édition de palier de fait extrêmement mal ») : les règles du palier ajouté, du nom qui suit la température et du total.
import { describe, expect, it } from 'vitest';
import { colonnesDe, tempDepuisY, yDeTemp, dureeTotale, insererAvant, nomAuto, nomSelonTemp, reglerColonne, valeursAjout, type EtatEmpatage } from '../../src/ui/paliers/modele';

const infusion: EtatEmpatage = { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }], mash: { mashoutEnabled: true, mashoutTempC: 76, mashoutDurationMin: 10 } };

describe('valeursAjout : le repos type entre ses voisins, jamais un doublon plat', () => {
  it('entre 52 et 67 °C : la β-amylase (63 °C, 30 min)', () => {
    expect(valeursAjout(52, 67)).toEqual({ name: 'β-amylase', tempC: 63, durationMin: 30 });
  });
  it('entre 67 et le mash-out à 76 °C : l’α-amylase (72 °C, 20 min)', () => {
    expect(valeursAjout(67, 76)).toEqual({ name: 'α-amylase', tempC: 72, durationMin: 20 });
  });
  it('sans repos type entre deux voisins : le milieu s’il fait un vrai pas (6 °C), sinon la température d’avant', () => {
    expect(valeursAjout(52, 60).tempC).toBe(56);
    expect(valeursAjout(72, 76).tempC).toBe(72);
    expect(valeursAjout(72, 75).tempC).toBe(72);
  });
  it('sans place entre deux voisins (moins de 1 °C) : la température d’avant', () => {
    expect(valeursAjout(67, 67.5).tempC).toBe(67);
  });
  it('en tête, devant 67 °C : le repos type juste en dessous (63 °C)', () => {
    expect(valeursAjout(undefined, 67).tempC).toBe(63);
  });
  it('en fin, après 67 °C sans mash-out : 72 °C', () => {
    expect(valeursAjout(67, undefined).tempC).toBe(72);
  });
  it('aucun voisin connu : 67 °C', () => {
    expect(valeursAjout().tempC).toBe(67);
  });
});

describe('insererAvant', () => {
  it('« + » de fin d’une infusion simple : posé avant le mash-out de details.mash, à 72 °C', () => {
    const r = insererAvant(infusion, 1);
    expect(r.rang).toBe(1);
    expect(r.etat.steps.map(s => [s.name, s.tempC, s.durationMin])).toEqual([['Saccharification', 67, 60], ['α-amylase', 72, 20]]);
  });
  it('« + » de tête : un palier plus froid en premier', () => {
    const r = insererAvant(infusion, 0);
    expect(r.rang).toBe(0);
    expect(r.etat.steps[0]).toEqual({ name: 'β-amylase', tempC: 63, durationMin: 30 });
  });
  it('mash-out en place sans température écrite (défaut 76 °C) : après 72 °C, le « + » de fin reprend 72 °C, jamais 75', () => {
    const sansTemp: EtatEmpatage = { steps: [{ name: 'α-amylase', tempC: 72, durationMin: 60 }], mash: {} };
    expect(insererAvant(sansTemp, 1).etat.steps[1].tempC).toBe(72);
    expect(insererAvant({ ...sansTemp, steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }] }, 1).etat.steps[1].tempC).toBe(72);
  });
  it('mash-out coupé : le « + » de fin regarde seulement le dernier palier', () => {
    const r = insererAvant({ ...infusion, mash: { ...infusion.mash, mashoutEnabled: false } }, 1);
    expect(r.etat.steps[1].tempC).toBe(72);
  });
  it('courbe vide : la saccharification de 60 min', () => {
    expect(insererAvant({ steps: [], mash: infusion.mash }, 0).etat.steps).toEqual([{ name: 'Saccharification', tempC: 67, durationMin: 60 }]);
  });
  it('deux ajouts ne donnent jamais « Palier 3 » avant « Palier 2 »', () => {
    const a = insererAvant(infusion, 1).etat;
    const b = insererAvant(a, 1).etat;
    expect(b.steps.map(s => s.name).some(n => /^Palier \d+$/.test(n))).toBe(false);
    // 67 et 72 : pas de repos type entre eux, moins de 6 °C : le palier posé reprend 67 °C (il se glisse) ; la courbe ne redescend jamais.
    expect(b.steps.map(s => s.tempC)).toEqual([67, 67, 72]);
  });
});

describe('le nom suit la température quand l’app l’a posé', () => {
  it('nomSelonTemp', () => {
    expect([45, 52, 63, 67, 72, 75].map(nomSelonTemp)).toEqual(['Repos β-glucanes', 'Repos protéique', 'β-amylase', 'Saccharification', 'α-amylase', 'Palier chaud']);
  });
  it('« Palier 2 » glissé à 52 °C devient « Repos protéique » ; un nom écrit par le brasseur reste', () => {
    const etat: EtatEmpatage = { steps: [{ name: 'Palier 2', tempC: 67, durationMin: 30 }, { name: 'Mon repos', tempC: 67, durationMin: 30 }] };
    const cols = colonnesDe(etat.steps.map(s => ({ name: s.name, tempC: s.tempC, durationMin: s.durationMin })), 2);
    expect(reglerColonne(etat, cols[0], { tempC: 52 }).steps[0].name).toBe('Repos protéique');
    expect(reglerColonne(etat, cols[1], { tempC: 52 }).steps[1].name).toBe('Mon repos');
    expect(reglerColonne(etat, cols[0], { durationMin: 40 }).steps[0].name).toBe('Palier 2');
  });
  it('« Saccharification » suit sa température comme les autres noms posés par l’app', () => {
    const etat: EtatEmpatage = { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }] };
    const col = colonnesDe([{ name: 'Saccharification', tempC: 67, durationMin: 60 }], 1)[0];
    expect(reglerColonne(etat, col, { tempC: 72 }).steps[0].name).toBe('α-amylase');
    expect(reglerColonne(etat, col, { tempC: 68 }).steps[0].name).toBe('Saccharification');
    expect(reglerColonne(etat, col, { tempC: 52 }).steps[0].name).toBe('Repos protéique');
  });
  it('un mash-out écrit comme palier garde son nom', () => {
    expect(nomAuto('Mash-out')).toBe(false);
  });
});

describe('dureeTotale : maintiens + montées ; une montée à mesurer fait un plancher', () => {
  it('montées connues : total exact', () => {
    const cols = colonnesDe([{ name: 'S', tempC: 67, durationMin: 60 }, { name: 'Mash-out', tempC: 76, durationMin: 10, rampMin: 9 / 0.43 }], 1);
    expect(dureeTotale(cols)).toEqual({ minutes: 91, montees: true });
  });
  it('un refroidissement (montée inconnue) : minutes sans la montée, montees faux', () => {
    const cols = colonnesDe([{ name: 'A', tempC: 67, durationMin: 60 }, { name: 'B', tempC: 64, durationMin: 30 }], 2);
    expect(dureeTotale(cols)).toEqual({ minutes: 90, montees: false });
  });
});

describe('tempDepuisY : le doigt règle au degré', () => {
  it('arrondit au degré entier et reste dans l’échelle', () => {
    const e = { min: 50, max: 80 };
    expect(tempDepuisY(yDeTemp(73.4, e), e)).toBe(73);
    expect(tempDepuisY(yDeTemp(73.6, e), e)).toBe(74);
    expect(tempDepuisY(-500, e)).toBe(80);
  });
});
