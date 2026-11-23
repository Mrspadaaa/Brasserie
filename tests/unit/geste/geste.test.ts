// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { aBouge, arrondir, cadrerDeuxBouts, palierApres, poserPlage, roleSous, vitesseBord, zonesBords, attacherGlisse, attacherCurseurNatif } from '../../../src/ui/geste';

const ev = (type: string, o: Record<string, unknown>) => Object.assign(new Event(type, { bubbles: true, cancelable: true }), { button: 0, pointerId: 1, ...o });

describe('moteur de la frise (R1 à R10)', () => {
  it('R1 : 6 px avant que la valeur bouge', () => { expect(aBouge(5.9)).toBe(false); expect(aBouge(-6)).toBe(true); });
  it('R8 : arrondi au pas, sans queue binaire', () => { expect(arrondir(0.1 + 0.2, 0.05)).toBe(0.3); expect(arrondir(13, 7)).toBe(14); expect(arrondir(3.3)).toBe(3.3); });
  it('R7 : bande de 40 px, armée seulement vers le bord, 0,15 à 1,35 vue/s', () => {
    expect(vitesseBord(20, 390, 1).sens).toBe(0);
    expect(vitesseBord(20, 390, -1)).toEqual({ sens: -1, vitesse: expect.any(Number) });
    expect(vitesseBord(389.9, 390, 1).vitesse).toBeGreaterThan(1.3);
    expect(vitesseBord(350.1, 390, 1).vitesse).toBeCloseTo(0.15, 2);
    expect(vitesseBord(200, 390, 1).sens).toBe(0);
  });
  it('R4 : les deux bouts à 56 px des bords, toute durée', () => {
    for (const [a, b] of [[0, 7], [0, 182], [-300, 1500]]) {
      const { span, v0 } = cadrerDeuxBouts(a, b, 390), px = (u: number) => (u - v0) * 390 / span;
      expect(px(a)).toBeCloseTo(56); expect(px(b)).toBeCloseTo(390 - 56);
    }
  });
  it('R3 : zones de 44 px, sans recouvrement, un tiers de la plage au plus dedans', () => {
    const z = zonesBords(100, 130);
    expect(z.a[1] - z.a[0]).toBe(32); expect(z.a[1]).toBeLessThanOrEqual(z.b[0]);
    expect(roleSous(60, 100, 300)).toBe('a'); expect(roleSous(200, 100, 300)).toBe('corps'); expect(roleSous(330, 100, 300)).toBe('b');
  });
  it('R5 / R6 : durée minimale, un bord ne passe pas l\'autre, le corps garde la durée', () => {
    const o = { min: 0, max: 1000, minLarg: 7, pas: 7 };
    expect(poserPlage('b', 70, 140, -200, o)).toEqual({ a: 70, b: 77 });
    expect(poserPlage('a', 70, 140, 200, o)).toEqual({ a: 133, b: 140 });
    expect(poserPlage('corps', 70, 140, -500, o)).toEqual({ a: 0, b: 70 });
  });
  it('R10 : palier utile après le lâcher', () => {
    const P = [160, 200, 240, 320, 400];
    expect(palierApres(84, 320, P, 160)).toBe(160);
    expect(palierApres(250, 300, P, 160)).toBe(320);
  });
});

describe('geste (attacherGlisse)', () => {
  const monte = () => { const el = document.createElement('div'); document.body.appendChild(el); el.getBoundingClientRect = () => ({ left: 0, width: 300, top: 0, height: 40, right: 300, bottom: 40, x: 0, y: 0, toJSON: () => ({}) }); el.setPointerCapture = () => {}; return el; };
  it('R1 R2 R10 : rien sous 6 px, suit le déplacement, Échap annule', () => {
    const el = monte(), suivre = vi.fn(), annuler = vi.fn(), lacher = vi.fn();
    attacherGlisse(el, () => ({ saisir: () => ({}), suivre, annuler, lacher }));
    el.dispatchEvent(ev('pointerdown', { clientX: 100 }));
    el.dispatchEvent(ev('pointermove', { clientX: 104 }));
    expect(suivre).not.toHaveBeenCalled();
    el.dispatchEvent(ev('pointermove', { clientX: 130 }));
    expect(suivre).toHaveBeenLastCalledWith(30, {}, 130);
    window.dispatchEvent(Object.assign(new Event('keydown', { cancelable: true }), { key: 'Escape' }));
    expect(annuler).toHaveBeenCalledTimes(1); expect(lacher).not.toHaveBeenCalled();
  });
  it('R1 : un toucher sans glisser lâche sans bouger, et son clic passe', () => {
    const el = monte(), lacher = vi.fn(), clic = vi.fn();
    el.addEventListener('click', clic);
    attacherGlisse(el, () => ({ saisir: () => ({}), suivre: () => {}, lacher }));
    el.dispatchEvent(ev('pointerdown', { clientX: 100 })); el.dispatchEvent(ev('pointerup', { clientX: 100 })); el.click();
    expect(lacher).toHaveBeenCalledWith({}, false); expect(clic).toHaveBeenCalled();
  });
  it('le clic qui suit un glisser est avalé', () => {
    const el = monte(), clic = vi.fn();
    el.addEventListener('click', clic);
    attacherGlisse(el, () => ({ saisir: () => ({}), suivre: () => {} }));
    el.dispatchEvent(ev('pointerdown', { clientX: 100 })); el.dispatchEvent(ev('pointermove', { clientX: 150 })); el.dispatchEvent(ev('pointerup', { clientX: 150 })); el.click();
    expect(clic).not.toHaveBeenCalled();
  });
  it('curseur natif : relatif, au pas, pointercancel rend la valeur', () => {
    const el = document.createElement('input'); el.type = 'range'; el.min = '0'; el.max = '30'; el.step = '0.5'; el.value = '10';
    document.body.appendChild(el);
    el.getBoundingClientRect = () => ({ left: 0, width: 300, top: 0, height: 40, right: 300, bottom: 40, x: 0, y: 0, toJSON: () => ({}) }); el.setPointerCapture = () => {};
    const vu: string[] = []; el.addEventListener('input', () => vu.push(el.value));
    attacherCurseurNatif(el);
    el.dispatchEvent(ev('pointerdown', { clientX: 280 }));                 // loin du pouce : rien ne saute
    el.dispatchEvent(ev('pointermove', { clientX: 283 }));
    expect(el.value).toBe('10');
    el.dispatchEvent(ev('pointermove', { clientX: 300 }));                 // +20 px = +2
    expect(el.value).toBe('12');
    el.dispatchEvent(ev('pointercancel', { clientX: 300 }));
    expect(el.value).toBe('10'); expect(vu).toEqual(['12', '10']);
  });
});
