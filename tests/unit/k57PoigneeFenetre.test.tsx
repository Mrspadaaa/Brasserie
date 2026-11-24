// @vitest-environment jsdom
/**
 * Voie k57 (test en ligne du tour 57, 24.11), écrite avant le correctif et lancée rouge (tests-rouge.log).
 * K57-1 : la poignée de fin du cadre de l'en-tête tenue à 4 px du bord ne s'arrête plus (8 → 144 semaines en 2 s, 305 au lâcher) ; les barres plafonnent à 8 colonnes/s.
 *   Règle : tout défilement au bord du Calendrier (barres, cadre de l'en-tête, durée) a la même vitesse plafonnée (8 colonnes/s) et une borne ; rien ne continue après le lâcher.
 * K57-2 : prise un peu à l'intérieur (15, 30, 60 px du bout), la fin d'une barre saute de 2 à 3 jours dès le premier mouvement.
 *   Règle : saisir une poignée ne change rien ; le bord suit le DÉPLACEMENT du doigt depuis le point de prise, jamais sa position absolue.
 */
import React, { useRef } from 'react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePointeur } from '../../src/ui/calendrier/frise/usePointeur';
import { Cadre, vueDeFenetre } from '../../src/ui/calendrier/entete/Fenetre';
import { ajouterJours } from '../../src/domain/calendrier';

const src = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const P = { clientY: 10, pointerId: 3, button: 0, pointerType: 'touch' };

/** Une boîte à l'écran, sans mise en page (jsdom) : `data-boite="gauche,droite"` ; la frise : `data-frise`, 0 → 390. */
function boites() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const b = this.getAttribute('data-boite');
    const [l, r] = b ? b.split(',').map(Number) : this.hasAttribute('data-frise') ? [0, 390] : [0, 0];
    return { left: l, right: r, top: 0, bottom: 24, width: r - l, height: 24, x: l, y: 0, toJSON: () => ({}) } as DOMRect;
  });
}

/** Une image d'animation à la main : chaque appel rejoue les rappels en attente, 16 ms plus loin. */
let file: Array<{ id: number; cb: FrameRequestCallback }> = [];
let horloge = 0, compteur = 0;
const image = () => { const f = file; file = []; horloge += 16; act(() => { f.forEach(x => x.cb(horloge)); }); };

beforeEach(() => {
  file = []; horloge = 1000; compteur = 0;
  boites();
  vi.stubGlobal('innerWidth', 390);
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { compteur += 1; file.push({ id: compteur, cb }); return compteur; });
  vi.stubGlobal('cancelAnimationFrame', (id: number) => { file = file.filter(x => x.id !== id); });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

/* ---------- K57-2 : la fin suit le déplacement du doigt ---------- */
const colonnes = Array.from({ length: 6 }, (_, i) => ({ debut: ajouterJours('2026-11-23', 7 * i), fin: ajouterJours('2026-11-23', 7 * i + 6), etiquette: '' }));
const PX_JOUR = 65 / 7;

function Barre({ boite, debut, fin, onBord }: { boite: string; debut: string; fin: string; onBord: (k: number, dx: number, c: string) => void }) {
  const g = usePointeur({ largeurColonne: 65, colonnes, zoneBord: 22, zoneBordDebut: 22, bout: c => (c === 'debut' ? debut : fin), onBord });
  return <div data-frise=""><div data-testid="barre" data-boite={boite} {...g}>b</div></div>;
}
/** Pose le doigt en `x0`, le déplace de `dx` px (au moins 6), rend le dernier `k` (jours depuis le bout tenu). */
function tirer(boite: string, debut: string, fin: string, x0: number, dx: number): number | undefined {
  const onBord = vi.fn();
  const { getByTestId, unmount } = render(<Barre boite={boite} debut={debut} fin={fin} onBord={onBord} />);
  const b = getByTestId('barre');
  fireEvent.pointerDown(b, { ...P, clientX: x0 });
  expect(onBord, 'poser le doigt ne change rien').not.toHaveBeenCalled();
  fireEvent.pointerMove(b, { ...P, clientX: x0 + dx });
  const k = onBord.mock.calls.length ? onBord.mock.calls[onBord.mock.calls.length - 1][0] as number : undefined;
  fireEvent.pointerUp(b, { ...P, clientX: x0 + dx });
  unmount();
  return k;
}

describe('K57-2 : la fin d’une barre au bord droit ne saute pas sous le doigt', () => {
  // barre « Fruty » : finit au bord droit (dimanche 3 janv., 6 semaines à 65 px), 177 px
  const B = '213.57,390', DEB = '2026-12-16', FIN = '2027-01-03';
  for (const dedans of [4, 15, 30, 60]) {
    for (const dx of [-8, -7, 7, 8]) {
      it(`doigt posé à ${dedans} px du bord, ${dx} px de mouvement : au plus un jour d’écart (pas 2 ou 3)`, () => {
        const k = tirer(B, DEB, FIN, 390 - dedans, dx);
        expect(k, 'le bord a bougé après 6 px').toBeDefined();
        expect(Math.abs(k as number), `k=${k}`).toBeLessThanOrEqual(1);
      });
    }
  }
  it('le déplacement se lit depuis la prise : 20 px de glisser = 2 jours à 1 jour près, d’où que le doigt soit pris', () => {
    for (const dedans of [15, 30, 60]) {
      const k = tirer(B, DEB, FIN, 390 - dedans, -20) as number;
      expect(Math.abs(k - (-20 / PX_JOUR)), `prise à ${dedans} px : k=${k}`).toBeLessThanOrEqual(1);
    }
  });
});

describe('K57-2 : le début d’une barre au bord gauche ne saute pas non plus', () => {
  // barre qui commence au bord gauche (lundi 23 nov.) et finit le mercredi 23 déc.
  const B = '0,288', DEB = '2026-11-23', FIN = '2026-12-23';
  for (const dedans of [4, 15, 30, 60]) {
    for (const dx of [-8, -7, 7, 8]) {
      it(`doigt posé à ${dedans} px du bord, ${dx} px de mouvement : au plus un jour d’écart`, () => {
        const k = tirer(B, DEB, FIN, dedans, dx);
        expect(k, 'le bord a bougé après 6 px').toBeDefined();
        expect(Math.abs(k as number), `k=${k}`).toBeLessThanOrEqual(1);
      });
    }
  }
});

describe('K57-2 : le bout est lu à son jour, avec ou sans correction de prise', () => {
  it('un toucher bref dans la part rentrée ouvre encore la fiche (rien tiré)', () => {
    const onToucher = vi.fn(), onBord = vi.fn();
    function Banc() {
      const g = usePointeur({ largeurColonne: 65, colonnes, zoneBord: 22, zoneBordDebut: 22, bout: c => (c === 'debut' ? '2026-12-16' : '2027-01-03'), onBord, onToucher });
      return <div data-frise=""><div data-testid="barre" data-boite="213.57,390" {...g}>b</div></div>;
    }
    const { getByTestId } = render(<Banc />);
    const b = getByTestId('barre');
    fireEvent.pointerDown(b, { ...P, clientX: 340 });
    fireEvent.pointerUp(b, { ...P, clientX: 340 });
    expect(onBord).not.toHaveBeenCalled();
    expect(onToucher).toHaveBeenCalledTimes(1);
  });
});

/* ---------- K57-1 : un défilement au bord plafonné, borné, qui s'arrête au lâcher ---------- */
const TOTAL = 52 + 261; // le passé et l'horizon de l'app (HORIZON_SEMAINES)
const numeros = Array.from({ length: TOTAL }, (_, i) => (i % 52) + 1);
const lundis = Array.from({ length: TOTAL }, (_, i) => ajouterJours('2025-11-24', 7 * i));
const INDEX = 52, NOMBRE = 8;

function BancCadre({ onChange, onVue }: { onChange: (f: { index: number; nombre: number }) => void; onVue: (v: unknown) => void }) {
  const surface = useRef<HTMLDivElement>(null);
  return (
    <div ref={surface} data-testid="surface" data-boite="0,390">
      <Cadre numeros={numeros} lundis={lundis} aujourdhui="2026-11-23" index={INDEX} nombre={NOMBRE} largeur={390} annee={false} surface={surface}
        vue={vueDeFenetre(INDEX, NOMBRE, 390)} onChange={onChange} onAnnee={() => undefined} onVue={v => onVue(v)} />
    </div>
  );
}

/** Tient la poignée de fin (prise sur son bord) à `dedans` px du bord droit pendant `secondes`, lâche ; rend la fenêtre posée et le nombre d'images après le lâcher. */
function tenirLaFin(dedans: number, secondes: number) {
  const onChange = vi.fn(), onVue = vi.fn();
  const { getByTestId } = render(<BancCadre onChange={onChange} onVue={onVue} />);
  const s = getByTestId('surface');
  const v = vueDeFenetre(INDEX, NOMBRE, 390);
  const xb = Math.round(((INDEX + NOMBRE - v.v0) / v.span) * 390);
  fireEvent.pointerDown(s, { ...P, clientX: xb });
  fireEvent.pointerMove(s, { ...P, clientX: 390 - dedans });
  for (let i = 0; i < Math.round(secondes * 62.5); i++) image();
  fireEvent.pointerUp(s, { ...P, clientX: 390 - dedans });
  const pose = onChange.mock.calls.length ? onChange.mock.calls[onChange.mock.calls.length - 1][0] as { index: number; nombre: number } : null;
  /* après le lâcher : une seconde d'images (le recalage de 200 ms de la vue, R10, finit) ; rien ne grandit plus, la vue revient au repos (null) */
  const appelsAvant = onChange.mock.calls.length;
  for (let i = 0; i < 63; i++) image();
  const apres = { onChange: onChange.mock.calls.length - appelsAvant, enAttente: file.length, derniereVue: onVue.mock.calls.length ? onVue.mock.calls[onVue.mock.calls.length - 1][0] : undefined };
  return { pose, apres, onVue };
}

describe('K57-1 : la fenêtre de l’en-tête tenue au bord grandit à vitesse plafonnée', () => {
  it('à 4 px du bord, 2 s : au plus 8 colonnes/s (une colonne = le sixième de l’échelle prise), pas 144 semaines', () => {
    const { pose } = tenirLaFin(4, 2);
    expect(pose, 'la fenêtre a changé').not.toBeNull();
    const span0 = vueDeFenetre(INDEX, NOMBRE, 390).span;
    // + 4 : le premier déplacement (de la prise au bord) et l'arrondi à la semaine de la pose
    const plafond = NOMBRE + 8 * Math.max(1, span0 / 6) * 2 + 4;
    expect(pose!.nombre, `${pose!.nombre} semaines`).toBeGreaterThan(NOMBRE + 8);
    expect(pose!.nombre, `${pose!.nombre} semaines, plafond ${plafond}`).toBeLessThanOrEqual(plafond);
  });
  it('à 30 px du bord (haut de la bande de défilement), 2 s : bornée de même', () => {
    const { pose } = tenirLaFin(30, 2);
    const span0 = vueDeFenetre(INDEX, NOMBRE, 390).span;
    expect(pose?.nombre ?? NOMBRE).toBeLessThanOrEqual(NOMBRE + 8 * Math.max(1, span0 / 6) * 2 + 4);
  });
  it('tenue 10 s : jamais au-delà de la plage de l’app', () => {
    const { pose } = tenirLaFin(4, 10);
    expect(pose!.index + pose!.nombre).toBeLessThanOrEqual(TOTAL);
  });
  it('la croissance est linéaire, non exponentielle : la 2e seconde ajoute autant que la 1re (à 25 % près)', () => {
    const a = tenirLaFin(4, 1).pose!.nombre - NOMBRE;
    cleanup(); file = [];
    const b = tenirLaFin(4, 2).pose!.nombre - NOMBRE;
    expect(b - a, `1 s : +${a}, 2 s : +${b}`).toBeLessThanOrEqual(a * 1.25);
  });
  it('rien ne continue après le lâcher : aucune pose de plus, plus d’image en attente, la vue revient au repos', () => {
    const { apres } = tenirLaFin(4, 1);
    expect(apres.onChange).toBe(0);
    expect(apres.enAttente).toBe(0);
    expect(apres.derniereVue).toBeNull();
  });
});

describe('K57-1 : la même vitesse plafonnée partout (cadre, durée, barres)', () => {
  it('defileBord.ts porte le plafond : plafondFenetre(span, dt), 8 colonnes/s', async () => {
    const m = await import('../../src/ui/calendrier/frise/defileBord') as Record<string, unknown>;
    expect(m.COLONNES_MAX_PAR_S).toBe(8);
    const plafond = m.plafondFenetre as (span0: number, dt: number) => number;
    expect(typeof plafond).toBe('function');
    expect(plafond(12, 1)).toBeCloseTo(16, 9);
    expect(plafond(3, 1), 'une colonne fait au moins une unité').toBeCloseTo(8, 9);
    expect(plafond(12, 0.016)).toBeCloseTo(16 * 0.016, 9);
  });
  it('les barres et le module partagent la même constante (usePointeur la réexporte)', async () => {
    const u = await import('../../src/ui/calendrier/frise/usePointeur');
    const d = await import('../../src/ui/calendrier/frise/defileBord') as Record<string, unknown>;
    expect(u.COLONNES_MAX_PAR_S).toBe(d.COLONNES_MAX_PAR_S);
  });
  it('le cadre de l’en-tête (grandir et corps) et la durée de la fiche passent par plafondFenetre', () => {
    expect(src('src/ui/calendrier/entete/Fenetre.tsx').match(/plafondFenetre\(s\.vue0\.span, dt\)/g)?.length, 'corps et bout tiré').toBe(2);
    expect(src('src/ui/calendrier/frise/DureeFenetre.tsx').match(/plafondFenetre\(s\.vue0\.span, dt\)/g)?.length).toBe(1);
  });
});
