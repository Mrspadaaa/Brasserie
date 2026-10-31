import { describe, expect, it } from 'vitest';
import {
  avantEbullitionDuPlan, barreCuve, conseilVolume, etatVolume, etendreEbullition, etendreVolume, evaporation, graduations, lireNombre, lireSaisie,
  pasClavier, traitsRegle, zonesPiste
} from '../../../src/ui/identite/regles';

describe('la règle d’ébullition s’étend d’une demi-heure au-delà de la valeur', () => {
  it('reste à 0–120 au repos et tant que la valeur tient dans la règle', () => {
    expect(etendreEbullition(60)).toBe(120);
    expect(etendreEbullition(0)).toBe(120);
    expect(etendreEbullition(105)).toBe(120);
  });
  it('s’ouvre au-delà : 120 → 150, 165 → 180, 240 → 270', () => {
    expect(etendreEbullition(110)).toBe(150);
    expect(etendreEbullition(120)).toBe(150);
    expect(etendreEbullition(165)).toBe(180);
    expect(etendreEbullition(240)).toBe(270);
  });
  it('une valeur inconnue ou négative laisse la règle de repos', () => {
    expect(etendreEbullition(Number.NaN)).toBe(120);
    expect(etendreEbullition(undefined)).toBe(120);
    expect(etendreEbullition(-5)).toBe(120);
  });
});

describe('la règle du volume suit le fermenteur, la cuve, la valeur et le moût avant ébullition', () => {
  it('cuve utile 36 L, fermenteur 30 L, 24 L : 0–40', () => {
    expect(etendreVolume({ cuveL: 36, capaciteL: 30, volumeL: 24 })).toBe(40);
  });
  it('cuve 45 L, fermenteur 60 L : 0–65 ; avec 55 L et ~67 L avant ébullition : 0–70', () => {
    expect(etendreVolume({ cuveL: 45, capaciteL: 60, volumeL: 24 })).toBe(65);
    expect(etendreVolume({ cuveL: 45, capaciteL: 60, volumeL: 55, avantEbullitionL: 67 })).toBe(70);
  });
  it('un volume tapé loin au-delà ouvre la règle (par 5 L)', () => {
    expect(etendreVolume({ cuveL: 45, capaciteL: 30, volumeL: 88 })).toBe(95);
  });
  it('sans rien de connu : une règle de repos, jamais 0', () => {
    expect(etendreVolume({})).toBe(20);
    expect(etendreVolume({ volumeL: Number.NaN, capaciteL: undefined })).toBe(20);
  });
});

describe('graduations', () => {
  it('chiffre tous les 10 L ; le dernier ouvre la règle', () => {
    const g = graduations(45, 10);
    expect(g.map((x) => x.valeur)).toEqual([0, 10, 20, 30, 40]);
    expect(g.filter((x) => x.derniere).map((x) => x.valeur)).toEqual([40]);
  });
  it('chiffre tous les 30′ ; à 150 le dernier est au bout de la règle', () => {
    const g = graduations(150, 30);
    expect(g[g.length - 1]).toMatchObject({ valeur: 150, position: 100, derniere: true });
  });
  it('traits fins : un par litre, un par 5′', () => {
    expect(traitsRegle(45, 1)).toBe(45);
    expect(traitsRegle(150, 5)).toBe(30);
    expect(traitsRegle(0, 5)).toBe(0);
  });
});

describe('ce qui se tape', () => {
  it('lit la virgule, le point, les espaces et l’unité', () => {
    expect(lireNombre('24,5')).toBe(24.5);
    expect(lireNombre('24.5')).toBe(24.5);
    expect(lireNombre(' 120 ')).toBe(120);
    expect(lireNombre('24 L')).toBe(24);
    expect(lireNombre('90 min')).toBe(90);
  });
  it('refuse ce qui n’est pas un nombre', () => {
    for (const t of ['', 'abc', '12a', '1 2', '-5', '1,2,3', '1e3']) expect(lireNombre(t)).toBeNull();
  });
  it('accepte une valeur hors de la règle (la règle s’étend)', () => {
    expect(lireSaisie('240', { min: 0, max: 1440, arrondi: 5 })).toEqual({ genre: 'valeur', valeur: 240 });
    expect(lireSaisie('88', { min: 1, max: 2000 })).toEqual({ genre: 'valeur', valeur: 88 });
    expect(lireSaisie('1000', { min: 0, max: 1440, arrondi: 5 })).toEqual({ genre: 'valeur', valeur: 1000 });
  });
  it('ramène l’ébullition à 5′ et le volume à 0,1 L', () => {
    expect(lireSaisie('47', { min: 0, max: 1440, arrondi: 5 })).toEqual({ genre: 'valeur', valeur: 45 });
    expect(lireSaisie('22,46', { min: 1, max: 2000 })).toEqual({ genre: 'valeur', valeur: 22.5 });
  });
  it('refuse sous le minimum et au-delà du garde-fou ; distingue vide et illisible', () => {
    expect(lireSaisie('0', { min: 1, max: 2000 })).toEqual({ genre: 'hors-limites' });
    expect(lireSaisie('99999', { min: 1, max: 2000 })).toEqual({ genre: 'hors-limites' });
    expect(lireSaisie('  ', { min: 1, max: 2000 })).toEqual({ genre: 'vide' });
    expect(lireSaisie('x', { min: 1, max: 2000 })).toEqual({ genre: 'illisible' });
  });
  it('↑ ↓ : ±1 L ou ±5′, sans sortir des bornes ; une valeur inconnue part du minimum', () => {
    expect(pasClavier(24, 1, 1, { min: 1, max: 2000 })).toBe(25);
    expect(pasClavier(120, 5, 1, { min: 0, max: 1440 })).toBe(125);
    expect(pasClavier(2, 5, -1, { min: 0, max: 1440 })).toBe(0);
    expect(pasClavier(Number.NaN, 1, 1, { min: 1, max: 2000 })).toBe(2);
    expect(pasClavier(2000, 1, 1, { min: 1, max: 2000 })).toBe(2000);
  });
});

describe('le fermenteur', () => {
  it('libre, plein, trop', () => {
    expect(etatVolume(24, 30)).toEqual({ genre: 'libre', litres: 6 });
    expect(etatVolume(30, 30)).toEqual({ genre: 'plein', litres: 0 });
    expect(etatVolume(31, 30)).toEqual({ genre: 'trop', litres: 1 });
    expect(etatVolume(55, 60)).toEqual({ genre: 'libre', litres: 5 });
  });
  it('inconnu quand on ne sait pas (jamais 0 litre libre)', () => {
    expect(etatVolume(Number.NaN, 30).genre).toBe('inconnu');
    expect(etatVolume(24, undefined).genre).toBe('inconnu');
    expect(etatVolume(24, 0).genre).toBe('inconnu');
  });
  it('conseil arrondi vers le bas : 30 L à 20 % → 24 ; 60 L → 48', () => {
    expect(conseilVolume(30, 20)).toBe(24);
    expect(conseilVolume(60, 20)).toBe(48);
    expect(conseilVolume(25, 15)).toBe(21.2);
    expect(conseilVolume(30, 100)).toBeUndefined();
    expect(conseilVolume(undefined, 20)).toBeUndefined();
  });
  it('zones de la piste : 31 L dans 30 L, rouge foncé entre 30 et 31', () => {
    const z = zonesPiste(31, 30, 45);
    expect(z.rempli).toEqual([0, 30]);
    expect(z.libre).toBeNull();
    expect(z.trop).toEqual([30, 45]);
    expect(z.depasse).toEqual([30, 31]);
  });
  it('zones : 24 L dans 30 L, du libre jusqu’au fermenteur, rien de foncé', () => {
    const z = zonesPiste(24, 30, 45);
    expect(z.rempli).toEqual([0, 24]);
    expect(z.libre).toEqual([24, 30]);
    expect(z.depasse).toBeNull();
  });
  it('sans fermenteur connu : seulement le rempli', () => {
    expect(zonesPiste(24, undefined, 45)).toEqual({ rempli: [0, 24], libre: null, trop: null, depasse: null });
  });
});

describe('l’évaporation', () => {
  it('le débit du profil, proportionnel à la durée', () => {
    expect(evaporation({ boilOffLPerHour: 3, volumeL: 24, minutes: 60 })).toEqual({ litres: 3, source: 'profil' });
    expect(evaporation({ boilOffLPerHour: 3, volumeL: 24, minutes: 240 })).toEqual({ litres: 12, source: 'profil' });
    expect(evaporation({ boilOffLPerHour: 3, volumeL: 24, minutes: 0 })).toEqual({ litres: 0, source: 'profil' });
  });
  it('sans débit : le taux %/h de la brasserie, puis le repli de 10 %/h dit estimé', () => {
    expect(evaporation({ boilOffRatePct: 8, volumeL: 25, minutes: 60 })).toEqual({ litres: 2, source: 'taux' });
    expect(evaporation({ volumeL: 24, minutes: 60 })).toEqual({ litres: 2.4, source: 'repli' });
  });
  it('durée inconnue : null, jamais 0', () => {
    expect(evaporation({ boilOffLPerHour: 3, volumeL: 24, minutes: Number.NaN })).toBeNull();
    expect(evaporation({ volumeL: Number.NaN, minutes: 60 })).toBeNull();
  });
});

describe('le moût avant ébullition : une seule source, le plan d’eau de la recette', () => {
  it('reprend preBoilHotL tel quel, sans addition ni second calcul', () => {
    expect(avantEbullitionDuPlan(36.6, 3)).toEqual({ litres: 36.6, evapL: 3 });
  });
  it('sans plan d’eau (0 ou absent : pas de malts) : inconnu, jamais un 0 ni un autre nombre', () => {
    expect(avantEbullitionDuPlan(0, 3)).toBeNull();
    expect(avantEbullitionDuPlan(undefined, 3)).toBeNull();
    expect(avantEbullitionDuPlan(Number.NaN, 3)).toBeNull();
  });
  it('une évaporation inconnue reste inconnue', () => {
    expect(avantEbullitionDuPlan(36.6, undefined)).toEqual({ litres: 36.6, evapL: null });
  });
});

describe('la cuve déborde sans le taire', () => {
  it('~67 L dans une cuve de 45 L : +22 L de trop', () => {
    const b = barreCuve(67, 12, 45)!;
    expect(b.deborde).toBe(true);
    expect(b.depasseL).toBe(22);
    expect(b.total).toBe(67);
    expect(b.moutL).toBe(55);
    expect(b.evapL).toBe(12);
  });
  it('contre la limite utile de 36 L : 36,6 L avant ébullition déborde de 0,6 L', () => {
    const b = barreCuve(36.6, 3, 36)!;
    expect(b.deborde).toBe(true);
    expect(b.depasseL).toBe(0.6);
  });
  it('dans la cuve : pas de dépassement, la barre vaut la cuve', () => {
    const b = barreCuve(27, 3, 45)!;
    expect(b).toMatchObject({ deborde: false, depasseL: 0, total: 45, moutL: 24, evapL: 3 });
  });
  it('inconnu : pas de barre (jamais une barre vide à 0)', () => {
    expect(barreCuve(null, 3, 45)).toBeNull();
    expect(barreCuve(27, 3, undefined)).toBeNull();
    expect(barreCuve(0, 3, 45)).toBeNull();
  });
  it('une évaporation inconnue ne colore rien en bleu', () => {
    expect(barreCuve(27, null, 45)).toMatchObject({ evapL: 0, moutL: 27 });
  });
});
