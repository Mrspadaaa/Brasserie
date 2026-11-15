import { describe, expect, it } from 'vitest';
import {
  ajouterJours, construireFil, ecartJours, enSuisse, HAUT_CARTE, joursDepuisY, lireDate, MARGE_HAUT, positionY, relatif, type TacheEntree
} from '../../src/domain/todoTimeline';

// Samedi 14 novembre 2026 (fixture fixe : la fonction ne lit jamais l'horloge).
const AUJ = new Date(2026, 10, 14, 9);
const tache = (id: string, date: string | undefined, status = 'todo'): TacheEntree => ({ id, title: `T-${id}`, date, status });

describe('todoTimeline : échelle', () => {
  it('10 px par jour jusqu’à 6 semaines', () => {
    expect(positionY(0)).toBe(0);
    expect(positionY(7)).toBe(70);
    expect(positionY(42)).toBe(420);
  });
  it('se resserre au-delà de 6 semaines, sans jamais reculer', () => {
    let prev = positionY(42);
    for (let j = 43; j <= 400; j++) {
      const y = positionY(j);
      expect(y).toBeGreaterThan(prev);
      prev = y;
    }
    expect(positionY(183)).toBeLessThan(700); // six mois : reste à l’écran
    expect(positionY(183) - positionY(42)).toBeLessThan(141 * 10 / 3);
  });
  it('joursDepuisY est l’inverse de positionY', () => {
    for (let j = 0; j <= 400; j++) expect(joursDepuisY(positionY(j))).toBe(j);
  });
});

describe('todoTimeline : construireFil', () => {
  it('range retard, faites, sans date et avenir', () => {
    const fil = construireFil([
      tache('a', '10.10.2026'), tache('b', '13.12.2026'), tache('c', undefined), tache('d', '2026-11-20', 'done'), tache('e', '14.11.2026')
    ], AUJ);
    expect(fil.retard.map((r) => r.id)).toEqual(['a']);
    expect(fil.retard[0].relatif).toBe('il y a 35 jours');
    expect(fil.futur.map((f) => f.id)).toEqual(['e', 'b']); // aujourd'hui compris, dans l'ordre
    expect(fil.sansDate.map((s) => s.id)).toEqual(['c']);
    expect(fil.faites.map((f) => f.id)).toEqual(['d']);
    expect(fil.futur[1].relatif).toBe('dans 29 jours');
    expect(fil.vide).toBe(false);
  });
  it('même distance par jour avec ou sans carte sans date', () => {
    const sans = construireFil([tache('x', '21.11.2026'), tache('y', '13.12.2026')], AUJ);
    const avec = construireFil([tache('x', '21.11.2026'), tache('y', '13.12.2026'), tache('z', undefined)], AUJ);
    expect(avec.futur.map((f) => f.y)).toEqual(sans.futur.map((f) => f.y));
    expect(avec.futur[0].y).toBe(MARGE_HAUT + 70); // aujourd'hui → 21 nov. : 7 jours = 70 px
    expect(avec.futur[1].y - avec.futur[0].y).toBe(220); // 22 jours
    expect(avec.hauteur).toBe(sans.hauteur);
  });
  it('un marché à six mois reste dans le fil, avec un repère de rupture', () => {
    const fil = construireFil([tache('m', '14.05.2027')], AUJ);
    expect(fil.futur[0].y).toBeLessThan(700);
    expect(fil.resserre).toBe(true);
    expect(fil.reperes.some((r) => r.rupture)).toBe(true);
    expect(fil.hauteur).toBeLessThan(900);
  });
  it('un fil sans rien est vide, avec une hauteur minimale', () => {
    const fil = construireFil([], AUJ);
    expect(fil.vide).toBe(true);
    expect(fil.yPoser).toBeNull();
    expect(fil.hauteur).toBeGreaterThanOrEqual(300);
    expect(fil.reperes.length).toBeGreaterThanOrEqual(3);
  });
  it('des faites seules : le fil est vide, les faites sont comptées', () => {
    const fil = construireFil([tache('d', '10.10.2026', 'done')], AUJ);
    expect(fil.vide).toBe(true);
    expect(fil.faites).toHaveLength(1);
    expect(fil.retard).toHaveLength(0);
  });
  it('une date illisible reste sans date et garde le texte saisi', () => {
    const fil = construireFil([tache('i', 'juin'), tache('j', '31.02.2027')], AUJ);
    expect(fil.futur).toHaveLength(0);
    expect(fil.sansDate.map((s) => s.brut)).toEqual(['juin', '31.02.2027']);
  });
  it('deux cartes proches se repoussent sans changer d’ordre ni de position vraie', () => {
    const fil = construireFil([tache('p', '15.11.2026'), tache('q', '16.11.2026'), tache('r', '17.11.2026')], AUJ);
    const [p, q, r] = fil.futur;
    expect(q.yCarte - p.yCarte).toBeGreaterThanOrEqual(HAUT_CARTE);
    expect(r.yCarte - q.yCarte).toBeGreaterThanOrEqual(HAUT_CARTE);
    expect(p.y).toBeLessThan(q.y);
    expect(q.decale).toBe(true);
    expect(q.yCarte).toBeGreaterThanOrEqual(q.y);
  });
  it('dit les semaines libres entre deux dates éloignées, pas entre deux dates proches', () => {
    const fil = construireFil([tache('m', '13.12.2026')], AUJ);
    expect(fil.ecarts.map((e) => e.texte)).toEqual(['4 semaines libres']);
    expect(construireFil([tache('m', '20.11.2026')], AUJ).ecarts).toHaveLength(0);
  });
});

describe('todoTimeline : dates', () => {
  it('lit les deux formats et refuse les dates qui n’existent pas', () => {
    expect(lireDate('13.12.2026')?.getMonth()).toBe(11);
    expect(lireDate('2026-12-13')?.getDate()).toBe(13);
    expect(lireDate('31.02.2026')).toBeNull();
    expect(lireDate('')).toBeNull();
    expect(lireDate(undefined)).toBeNull();
  });
  it('ecartJours tient au passage à l’heure d’hiver', () => {
    expect(ecartJours(new Date(2026, 9, 20, 23), new Date(2026, 9, 30, 1))).toBe(10);
    expect(ecartJours(AUJ, ajouterJours(AUJ, 14))).toBe(14);
    expect(enSuisse(ajouterJours(AUJ, 14))).toBe('28.11.2026');
  });
  it('relatif', () => {
    expect([relatif(0), relatif(1), relatif(-1), relatif(14), relatif(-35), relatif(120)]).toEqual([
      'aujourd’hui', 'demain', 'hier', 'dans 14 jours', 'il y a 35 jours', 'dans environ 4 mois'
    ]);
  });
});

// Passe 2 (critique t-kckd n° 4, 11, 12) : aucune étiquette n'en recouvre une autre. Écart minimal ; celle qui ne tient pas se tait.
describe('todoTimeline : étiquettes qui ne se chevauchent pas', () => {
  const ECART_GAUCHE = 18; // texte de 12 px en colonne de gauche
  const ecartsMin = (ys: number[]) => ys.slice().sort((a, b) => a - b).reduce((m, y, i, t) => (i ? Math.min(m, y - t[i - 1]) : m), Infinity);
  const gauche = (fil: ReturnType<typeof construireFil>) => [...fil.reperes.map((r) => r.y), ...fil.futur.map((p) => p.yCarte)];

  it('à six mois, la date de la 6e semaine et « 6 semaines » ne tombent pas au même endroit', () => {
    const fil = construireFil([tache('n', '13.12.2026'), tache('m', '17.05.2027')], AUJ);
    expect(ecartsMin(fil.reperes.map((r) => r.y))).toBeGreaterThanOrEqual(ECART_GAUCHE);
    expect(fil.reperes.filter((r) => r.jours === 42)).toHaveLength(1);
    expect(fil.reperes.find((r) => r.jours === 42)?.rupture).toBe(true);
  });
  it('« échelle resserrée » ne couvre ni une carte ni « n mois libres »', () => {
    const fil = construireFil([tache('n', '13.12.2026'), tache('m', '17.05.2027')], AUJ);
    expect(fil.noteRupture).not.toBeNull();
    for (const g of fil.ecarts) expect(Math.abs(g.y - fil.noteRupture!)).toBeGreaterThanOrEqual(22);
    for (const p of fil.futur) expect(Math.abs(p.yCarte - fil.noteRupture!)).toBeGreaterThanOrEqual(HAUT_CARTE / 2 + 10);
  });
  it('pendant la pose, la perle neuve ne recouvre ni repère ni « n semaines libres »', () => {
    for (const jours of [7, 14, 21, 28, 35, 42, 60]) {
      const fil = construireFil([tache('n', '13.12.2026')], AUJ, jours);
      const y = MARGE_HAUT + positionY(jours);
      for (const r of fil.reperes) expect(Math.abs(r.y - y)).toBeGreaterThanOrEqual(34);
      for (const g of fil.ecarts) expect(Math.abs(g.y - y)).toBeGreaterThanOrEqual(38);
    }
  });
  it('aucun repère ne tombe sur « Poser » (le « 20 déc. » coupé de la critique)', () => {
    const fil = construireFil([tache('n', '13.12.2026')], AUJ); // 13 déc. = jour 29 ; la 5e semaine tomberait à 80 px sous la carte
    expect(fil.yPoser).not.toBeNull();
    for (const r of fil.reperes) expect(Math.abs(r.y - fil.yPoser!)).toBeGreaterThanOrEqual(34);
    expect(fil.reperes.every((r) => r.y < fil.futur[0].yCarte)).toBe(true);
  });
  it('sans pose, les repères d’un fil ordinaire gardent leur écart minimal avec les cartes', () => {
    const fil = construireFil([tache('a', '21.11.2026'), tache('b', '13.12.2026')], AUJ);
    const ys = gauche(fil);
    expect(ecartsMin(ys)).toBeGreaterThanOrEqual(ECART_GAUCHE);
  });
});
