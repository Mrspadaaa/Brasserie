import React, { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { Cadre, vueDeFenetre } from '../../src/ui/calendrier/entete/Fenetre';

/**
 * CAL-PASSE (21.11, n° 11) : tirer la poignée de la fenêtre déplace la fenêtre d'autant que le doigt, à l'échelle de la courbe (1 px du doigt =
 * 1 px du cadre), ni plus ni moins. Sur une courbe de 96 semaines dans 366 px (390 px de large, 44 semaines de passé), 183 px de doigt font
 * 48 semaines : ce que la critique a vu comme « un an d'un coup » (S32 ’26 → S27 ’27) est exactement la moitié de la courbe, la distance du doigt.
 */
const TOTAL = 96, LARGEUR = 366;
const numeros = Array.from({ length: TOTAL }, (_, i) => ((i + 43) % 52) + 1);
/* Frise B, R4 : la fenêtre (19 semaines) posée entre 56 px et LARGEUR − 56 px ; la poignée suit le doigt à cette échelle */
const unit = LARGEUR / vueDeFenetre(20, 19, LARGEUR).span;

/* R6 : useGlisse écoute la surface de la courbe ; le Cadre la reçoit, et les moves et le lâcher se jouent sur elle */
function Courbe(p: Omit<React.ComponentProps<typeof Cadre>, 'surface'>) {
  const surface = useRef<HTMLDivElement>(null);
  return <div ref={surface} data-surface><Cadre {...p} surface={surface} /></div>;
}

function tirer(genre: 'debut' | 'fin', dx: number, index = 20, nombre = 19) {
  const onChange = vi.fn(), onAnnee = vi.fn();
  const { container } = render(<Courbe numeros={numeros} index={index} nombre={nombre} largeur={LARGEUR} annee={false} onChange={onChange} onAnnee={onAnnee} vue={vueDeFenetre(index, nombre, LARGEUR)} />);
  const poignee = container.querySelector(`[data-poignee="${genre}"]`)!;
  const surface = container.querySelector('[data-surface]')!;
  const vue = vueDeFenetre(index, nombre, LARGEUR);
  const x0 = ((genre === 'debut' ? index : index + nombre) - vue.v0) * LARGEUR / vue.span;
  /* jsdom n'a pas PointerEvent : un événement de souris où l'on pose pointerId */
  const evt = (type: string, x: number) => { const e = new MouseEvent(type, { clientX: x, clientY: 10, button: 0, bubbles: true }); Object.defineProperty(e, 'pointerId', { value: 1 }); return e; };
  fireEvent(poignee, evt('pointerdown', x0));
  fireEvent(surface, evt('pointermove', x0 + dx));
  fireEvent(surface, evt('pointerup', x0 + dx));
  return { onChange, onAnnee };
}

afterEach(cleanup);

describe('CAL-PASSE n° 11 : la poignée suit le doigt, à l’échelle de la courbe', () => {
  it('début : 183 px de doigt = round(183 / unité) semaines, pas davantage ; 40 px = 11 semaines', () => {
    const { onChange } = tirer('debut', 183);
    expect(onChange).toHaveBeenCalledTimes(1);
    const { index } = onChange.mock.calls[0][0];
    expect(index - 20).toBe(Math.round(183 / unit));
    expect(index - 20).toBe(14);
    const petit = tirer('debut', 40);
    expect(petit.onChange.mock.calls[0][0].index - 20).toBe(Math.round(40 / unit));
  });
  it('un recul de 30 px recule de 8 semaines, jamais d’un an', () => {
    const { onChange } = tirer('debut', -30);
    expect(onChange.mock.calls[0][0].index).toBe(20 - Math.round(30 / unit));
  });
});
