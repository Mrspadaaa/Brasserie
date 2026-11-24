/**
 * Voie poignees (24.11, sa plainte : « maintenant tout est au bord, l'actionnable est du coup plus difficile sur mobile. Rentre la zone plus accessible »).
 * La frise va bord à bord ; le bout d'une barre, la poignée du cadre de l'en-tête et les petits boutons tombent dans les ~24 px du bord de l'écran, là
 * où Android place le geste retour. Règle : le dessin ne bouge pas ; la zone de toucher UTILE (hors des 24 px du bord) fait au moins 44 px de large,
 * en s'étendant vers l'INTÉRIEUR. Ces tests sont écrits avant le correctif et lancés rouges (tests-rouge.log).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { surLeBord, surLeBordDebut } from '../../src/ui/calendrier/frise/usePointeur';
import { zonesPoignees } from '../../src/ui/calendrier/entete/Fenetre';

const ECRAN = { gauche: 0, droite: 390 };
const BORD = 24;
const CIBLE = 44;
const boite = (left: number, right: number) => ({ getBoundingClientRect: () => ({ left, right, top: 0, bottom: 24, width: right - left, height: 24, x: left, y: 0 }) }) as unknown as Element;
type Surle = (el: Element, x: number, zone: number, vue?: typeof ECRAN) => boolean;
const fin = surLeBord as unknown as Surle;
const debut = surLeBordDebut as unknown as Surle;
/** Les abscisses (pas de 1 px) où le doigt prend le bord, dans la bande utile [24, 366]. */
const prises = (f: Surle, el: Element) => { const r: number[] = []; for (let x = BORD; x <= ECRAN.droite - BORD; x++) if (f(el, x, 22, ECRAN)) r.push(x); return r; };
const src = (p: string) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

describe('POI-1 barre : le bout droit tenu au bord de l’écran se prend à 24 px du bord ou plus', () => {
  it('barre de 177 px (Fruty) qui finit au bord droit : une zone utile d’au moins 44 px, hors des 24 px du bord', () => {
    const xs = prises(fin, boite(213, 390));
    expect(xs.length).toBeGreaterThanOrEqual(CIBLE);
    expect(xs[xs.length - 1]).toBe(ECRAN.droite - BORD);
  });
  it('la zone d’origine reste prise (22 px dedans, jusqu’au bord)', () => {
    for (const x of [368, 380, 390]) expect(fin(boite(213, 390), x, 22, ECRAN), `x=${x}`).toBe(true);
  });
  it('barre courte (40 px) au bord : le milieu reste au déplacement (R2-1), la zone d’origine seule', () => {
    expect(fin(boite(350, 390), 370, 22, ECRAN)).toBe(false);
    expect(fin(boite(350, 390), 380, 22, ECRAN)).toBe(true);
  });
  it('barre loin du bord : rien ne change (22 px dedans, 22 dehors)', () => {
    const b = boite(100, 250);
    expect(fin(b, 227, 22, ECRAN)).toBe(false);
    expect(fin(b, 228, 22, ECRAN)).toBe(true);
    expect(fin(b, 272, 22, ECRAN)).toBe(true);
    expect(fin(b, 273, 22, ECRAN)).toBe(false);
  });
  it('un doigt pris dans la part rentrée ne fait pas sauter la fin : sa correction rejoint la zone d’origine', async () => {
    const m = await import('../../src/ui/calendrier/frise/prisesBord');
    expect(m.correctionPrise(330, [368, 412])).toBe(38);
    expect(m.correctionPrise(370, [368, 412])).toBe(0);
    expect(m.correctionPrise(40, [10, 40])).toBe(0);
    expect(m.correctionPrise(60, [-34, 10])).toBe(-50);
  });
});

describe('POI-1 barre : le début tenu au bord gauche de l’écran', () => {
  it('barre de 290 px qui commence au bord gauche : une zone utile d’au moins 44 px, hors des 24 px du bord', () => {
    const xs = prises(debut, boite(0, 290));
    expect(xs.length).toBeGreaterThanOrEqual(CIBLE);
    expect(xs[0]).toBe(BORD);
  });
  it('la zone d’origine reste prise (jusqu’au quart dedans)', () => {
    for (const x of [0, 10, 22]) expect(debut(boite(0, 290), x, 22, ECRAN), `x=${x}`).toBe(true);
  });
  it('barre courte (40 px) au bord gauche : le corps garde le déplacement', () => {
    expect(debut(boite(0, 40), 20, 22, ECRAN)).toBe(false);
  });
  it('barre loin du bord : rien ne change', () => {
    const b = boite(100, 250);
    expect(debut(b, 78, 22, ECRAN)).toBe(true);
    expect(debut(b, 122, 22, ECRAN)).toBe(true);
    expect(debut(b, 123, 22, ECRAN)).toBe(false);
  });
});

describe('POI-1 en-tête : les poignées du cadre de la fenêtre (Fenetre.tsx, zonesPoignees)', () => {
  const utile = (z: { l: number; w: number }) => Math.min(z.l + z.w, 390 - BORD) - Math.max(z.l, BORD);
  it('fenêtre posée contre le bord gauche : la poignée de début a une zone utile d’au moins 44 px', () => {
    expect(utile(zonesPoignees(0, 120, 390).debut)).toBeGreaterThanOrEqual(CIBLE);
  });
  it('fenêtre posée contre le bord droit : la poignée de fin a une zone utile d’au moins 44 px', () => {
    expect(utile(zonesPoignees(270, 390, 390).fin)).toBeGreaterThanOrEqual(CIBLE);
  });
  it('fenêtre au milieu : les zones d’origine, 44 px posés 10 px dedans', () => {
    const z = zonesPoignees(150, 250, 390);
    expect(z.debut).toEqual({ l: 116, w: 44 });
    expect(z.fin).toEqual({ l: 240, w: 44 });
  });
  it('le geste suit : roleRentre rend « début » et « fin » sur toute la zone utile, et roleSous ailleurs', async () => {
    const m = await import('../../src/ui/calendrier/entete/Fenetre');
    const { roleSous } = await import('../../src/ui/geste');
    const r = (m as unknown as { roleRentre: (x: number, xa: number, xb: number, vue: typeof ECRAN) => string }).roleRentre;
    for (let x = BORD; x < BORD + CIBLE; x++) expect(r(x, 0, 120, ECRAN), `début x=${x}`).toBe('a');
    for (let x = 390 - BORD - CIBLE; x <= 390 - BORD; x++) expect(r(x, 270, 390, ECRAN), `fin x=${x}`).toBe('b');
    for (let x = 0; x <= 390; x += 5) expect(r(x, 150, 250, ECRAN), `au milieu x=${x}`).toBe(roleSous(x, 150, 250));
  });
  it('Fenetre.tsx décide le rôle avec roleRentre, vu par les bords de l’écran', () => {
    expect(src('src/ui/calendrier/entete/Fenetre.tsx')).toMatch(/roleRentre\(x, xa, xb/);
  });
});

describe('POI-1 petits boutons au bord : la zone de toucher s’étend vers l’intérieur (pseudo-élément, jamais le dessin)', () => {
  it('rentreeElement : un bouton de 24 px à 12 px du bord gauche reçoit de quoi atteindre 44 px utiles', async () => {
    const m = await import('../../src/ui/calendrier/frise/prisesBord');
    expect(m.rentreeElement({ left: 12, right: 36 }, ECRAN)).toEqual({ g: 0, d: 32 });
    expect(m.rentreeElement({ left: 354, right: 378 }, ECRAN)).toEqual({ g: 32, d: 0 });
    expect(m.rentreeElement({ left: 120, right: 148 }, ECRAN)).toEqual({ g: 0, d: 0 });
  });
  it('rentreeElement : jamais sur une autre commande de la ligne (le plein écran, collé à un voisin, garde sa zone d’origine)', async () => {
    const m = await import('../../src/ui/calendrier/frise/prisesBord');
    const pl = { left: 348, right: 372, top: 0, bottom: 28 };
    expect(m.rentreeElement(pl, ECRAN, [{ left: 318, right: 345, top: 0, bottom: 28 }])).toEqual({ g: 1, d: 0 });
    expect(m.rentreeElement(pl, ECRAN, [{ left: 200, right: 240, top: 0, bottom: 28 }]).g).toBe(26);
    expect(m.rentreeElement(pl, ECRAN, [{ left: 318, right: 345, top: 40, bottom: 68 }]).g).toBe(26);
  });
  const regles = ['cal-marque', 'cal-plus', 'cal-oeil', 'cal-cachees', 'cal-caddie', 'cal-renvoi', 'cal-lie'];
  it.each(regles)('frise.css : .%s::before se rallonge par --rentre-g / --rentre-d', nom => {
    const css = src('src/ui/calendrier/frise/frise.css');
    const m = css.match(new RegExp(`[^}\\n]*\\.${nom}[^{\\n]*::before\\s*\\{[^}]*\\}`));
    expect(m, `règle ::before de ${nom}`).not.toBeNull();
    expect(m?.[0]).toMatch(/--rentre-d/);
    expect(m?.[0]).toMatch(/--rentre-g/);
  });
  it('Frise.tsx pose ces variables sur les boutons au bord', () => {
    expect(src('src/ui/calendrier/frise/Frise.tsx')).toMatch(/useRentree\(zone, SELECTEUR_RENTREE\)/);
    expect(src('src/ui/calendrier/entete/EnTete.tsx')).toMatch(/useRentree\(racine,/);
  });
});
