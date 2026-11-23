import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FinancialProfile } from '../../src/domain/finance/types';
import { REGLAGES_VIDES } from '../../src/domain/fournisseurs';
import { lundi, semainesEntre } from '../../src/domain/calendrier/temps';
import { semainesDe, type ChoseCalendrier } from '../../src/domain/calendrier';
import { pas, peutPasser, bornes, type Periode } from '../../src/components/periode/periode';
import { construireModele, semainesAvenir, semainesPassees, type EntreesModele } from '../../src/ui/calendrier/useDonneesCalendrier';
import { etatInitial, reduire, type Horizon } from '../../src/ui/calendrier/cadre/etat';
import { libelleDuree } from '../../src/ui/calendrier/entete/Fenetre';
import { periodesBande } from '../../src/ui/calendrier/entete/BandeSemaines';
import { pastille, placerBulle, rangeeVide, type Colonne } from '../../src/ui/calendrier/frise/Rangee';

/* Voie fix29 : constats du test en ligne du Calendrier (23.11 soir). Chaque test a été rouge avant sa correction. */

const AUJ = '2026-11-23';
const profil = { id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, openingCash: { date: '2026-01-01', amountCents: 100_000, confirmed: true } } as FinancialProfile;
const entrees = (plus: Partial<EntreesModele> = {}): EntreesModele => ({ aujourdhui: AUJ, transactions: [], payments: [], plans: [], profile: profil, assets: [], batches: [], stockItems: [], items: [], recettes: [], reglages: REGLAGES_VIDES, ...plus });
const plage = (du: string, au: string): Periode => ({ genre: 'dates', du, au });

describe('T29-1 : la période de l’app est entièrement atteignable sur la frise', () => {
  it('sans période, le passé reste 52 semaines et l’avenir cinq ans', () => {
    expect(semainesPassees()).toBe(52);
    expect(semainesAvenir()).toBe(5 * 52 + 1);
    expect(semainesPassees({ genre: 'tout' }, AUJ)).toBe(52);
    expect(semainesPassees({ genre: 'mois', annee: 2026, mois: 11 }, AUJ)).toBe(52);
  });
  it('01.01.2024 → 31.12.2027 : l’horizon du modèle commence au plus tard le lundi 01.01.2024 et finit après le 31.12.2027', () => {
    const periode = plage('2024-01-01', '2027-12-31');
    const m = construireModele(entrees({ periode }));
    expect(m.semaines[0].debut <= lundi('2024-01-01')).toBe(true);
    const dernier = m.semaines[m.semaines.length - 1].debut;
    expect(dernier >= lundi('2027-12-31')).toBe(true);
    expect(m.passe).toBe(semainesEntre(m.semaines[0].debut, lundi(AUJ)));
  });
  it('un passé démesuré est borné (dix ans) : la butée est dite par le début des données, jamais une frise infinie', () => {
    expect(semainesPassees(plage('1990-01-01', '2027-12-31'), AUJ)).toBe(520);
  });
});

describe('T29-2 : › avance, ‹ recule, y compris sur une plage de quatre ans', () => {
  afterEach(() => { vi.useRealTimers(); });
  it('› depuis 01.01.2024 → 31.12.2027 ne recule pas : le début avance', () => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${AUJ}T12:00:00`));
    const p = plage('2024-01-01', '2027-12-31');
    const q = pas(p, 1);
    expect(bornes(q).du! > bornes(p).du!).toBe(true);
    expect(peutPasser(p, 1)).toBe(true);
    const r = pas(p, -1);
    expect(bornes(r).du! < bornes(p).du!).toBe(true);
  });
});

describe('T29-11 : « ‹ auj. » ramène le cadre à aujourd’hui', () => {
  const H: Horizon = { premier: '2025-11-24', total: 313, lundiAuj: '2026-11-23' };
  it('un cadre de six semaines en déc. 2026 revient sur la semaine d’aujourd’hui, même durée', () => {
    const e0 = etatInitial({ app: undefined, gardee: plage('2026-12-14', '2027-01-24'), echelle: 'semaine', paysage: false }, H);
    const e1 = reduire(e0, { type: 'aujourdhui' }, H);
    expect(e1.periode).toEqual(plage('2026-11-23', '2027-01-03'));
  });
  it('une période d’un an revient aussi, sans sortir de l’horizon', () => {
    const e0 = etatInitial({ app: undefined, gardee: plage('2027-05-10', '2028-05-07'), echelle: 'semaine', paysage: false }, H);
    const e1 = reduire(e0, { type: 'aujourdhui' }, H);
    expect(e1.periode).toEqual(plage('2026-11-23', '2027-11-21'));
  });
});

describe('T29-12 : les durées au-delà de deux ans se disent en années', () => {
  it('31 mois, 46 mois, 63 mois', () => {
    expect(libelleDuree(135, false)).toBe('2 ans ½');
    expect(libelleDuree(200, false)).toBe('4 ans');
    expect(libelleDuree(274, false)).toBe('5 ans');
    expect(libelleDuree(261, false)).toBe('5 ans');
  });
  it('en dessous de deux ans, les mois restent (18 mois), et l’An reste l’An', () => {
    expect(libelleDuree(78, false)).toBe('18 mois');
    expect(libelleDuree(52, false)).toBe('An');
    expect(libelleDuree(104, false)).toBe('2 ans');
  });
});

describe('T29-7 et T29-8 : l’année sur chaque segment de la bande', () => {
  const bande = (debut: string, n: number, l: number, w: number) => {
    const s = semainesDe(debut, n);
    const a = s.map((_, k) => k * l).concat([n * l]);
    return periodesBande(s, a, 'mois', l, w).noms.map((x) => x.texte);
  };
  it('T29-7 : de 25 à 31 mois, la première année a son nom aussi', () => {
    for (const mois of [25, 28, 31]) {
      const noms = bande('2026-03-23', Math.round(mois * 4.348), 2.9, 24);
      const annees = noms.filter((t) => /^\d{4}$/.test(t));
      expect(noms[0], `${mois} mois : ${noms.join(' ')}`).toBe('2026');
      expect(annees).toContain('2027');
      expect(new Set(annees).size).toBe(annees.length);
    }
  });
  it('T29-8 : à l’An, janvier se nomme par son année quand elle tient', () => {
    const noms = bande('2026-10-26', 70, 7.5, 14);
    expect(noms).toContain('2027');
    expect(noms.filter((t) => t.length === 1).length).toBeGreaterThan(8);
  });
});

describe('T29-9 : une rangée sans chose dans le cadre se dit vide', () => {
  const colonnes: Colonne[] = Array.from({ length: 6 }, (_, k) => ({ debut: `2026-11-${String(23 + k * 7).padStart(2, '0')}`, fin: `2026-11-${String(29 + k * 7).padStart(2, '0')}`, etiquette: `S${48 + k}` }));
  const hors = { id: 'x', debut: '2027-03-01', fin: '2027-03-01' } as unknown as ChoseCalendrier;
  it('des choses hors du cadre seulement : « vide », pas une pastille sans somme', () => {
    expect(rangeeVide([hors], colonnes)).toBe(true);
    expect(rangeeVide([], colonnes)).toBe(true);
  });
  it('une chose dans le cadre : pas vide', () => {
    expect(rangeeVide([{ id: 'y', debut: '2026-11-24', fin: '2026-11-24' } as unknown as ChoseCalendrier], colonnes)).toBe(false);
  });
});

describe('T29-10 : les années dès que le cadre passe l’an', () => {
  const cols = (debut: string, n: number): Colonne[] => semainesDe(debut, n).map((s) => ({ debut: s.debut, fin: new Date(Date.parse(`${s.debut}T00:00:00Z`) + 6 * 864e5).toISOString().slice(0, 10), etiquette: `S${s.numero}` }));
  it('4 ans de semaines : « S48 2026–S47 2030 », jamais « S48–S47 »', () => {
    const p = pastille('brassins', [], cols('2026-11-23', 208));
    expect(p.periode).toMatch(/^S48 2026–S4\d 2030$/);
  });
  it('moins d’un an : la forme courte reste (« S48–S5 »)', () => {
    const p = pastille('brassins', [], cols('2026-11-23', 11));
    expect(p.periode).toBe('S48–S5');
  });
});

describe('T29-5 et CALP-5 : la bulle « lâcher ici » ne couvre pas la barre glissée', () => {
  const boite = (b: { left: number; top: number }, w: number, h: number) => ({ left: b.left, top: b.top, right: b.left + w, bottom: b.top + h });
  const croise = (a: { left: number; top: number; right: number; bottom: number }, b: typeof a) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  it('piste d’une ligne (28 px) : la bulle se pose au-dessus ou au-dessous de la barre tenue, dans le cadre de la frise', () => {
    const tenue = { left: 20, top: 202, right: 380, bottom: 226, poids: 3 }; // une barre de six semaines : aucune place de côté
    const place = placerBulle({ w: 120, h: 24, x: 130, haut: 2, bas: 26, largeur: 390, piste: { left: 0, top: 200, height: 28 }, murs: [], obstacles: [tenue], cadre: { top: 150, bottom: 300 } });
    expect(croise(boite({ left: place.left, top: 200 + place.top }, 120, 24), tenue)).toBe(false);
  });
});

describe('T29-6 : le défilement au bord est mesuré', () => {
  it('doigt au fond de la bande, 6 sem. à 390 px (colonne de 65 px) : 2,5 s ajoutent 8 colonnes au plus, jamais 20', async () => {
    const { colonnesParImage, COLONNES_MAX_PAR_S } = await import('../../src/ui/calendrier/frise/usePointeur');
    const { vitesseBord } = await import('../../src/ui/geste');
    const { vitesse } = vitesseBord(388, 390, 1);
    let acc = 0;
    for (let i = 0; i < 150; i++) acc += colonnesParImage(vitesse, 1 / 60, 390, 65);
    expect(acc).toBeLessThanOrEqual(COLONNES_MAX_PAR_S * 2.5 + 1e-6);
    expect(acc).toBeGreaterThan(1);
    /* doigt à peine dans la bande : la vitesse douce reste celle du module */
    expect(colonnesParImage(0.15, 1 / 60, 390, 65)).toBeCloseTo((0.15 * 390) / 65 / 60, 6);
  });
});
