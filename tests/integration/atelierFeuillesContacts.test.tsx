import React from 'react';
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CreativeItem } from '../../src/types';

vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
import { CreativeItemSheet } from '../../src/ui/CreativeItemSheet';
import { ContactsView } from '../../src/ui/atelier/ContactsView';
import { Sheet } from '../../src/ui/Sheet';

afterEach(() => cleanup());

// Données fictives « ZZ ».
const contact = (id: string, title: string, tel?: string): CreativeItem => ({ id, type: 'prospect', status: 'idea', title, contactPhone: tel }) as CreativeItem;

describe('feuille d’édition d’une note : centrée, 560 px au plus dès 768 (constat 14)', () => {
  it('la feuille porte md:max-w-[560px] et md:mx-auto (Tailwind : md = 768 px)', () => {
    render(<CreativeItemSheet item={{ id: 'CR-1', type: 'event', status: 'todo', title: 'ZZ note' } as CreativeItem} onClose={() => {}} onSave={() => {}} onDelete={() => {}} />);
    const feuille = screen.getByRole('dialog');
    expect(feuille.className).toContain('md:max-w-[560px]');
    expect(feuille.className).toContain('md:mx-auto');
  });
});

describe('Contacts : le compteur compte les lignes affichées (constat 15)', () => {
  const items = [contact('A', 'ZZ Bar A', '026 111 11 11'), contact('B', 'ZZ Bar B'), contact('C', 'ZZ Bar C', '026 222 22 22')];
  const vue = () => render(<ContactsView items={items} adding={false} onAdding={() => {}} onCreate={() => {}} onConvert={() => false} onUpdate={() => {}} onRemove={() => {}} />);
  const compteur = () => document.querySelector('.ct-bar h3')?.textContent?.replace(/\s+/g, ' ').trim();
  const lignes = () => document.querySelectorAll('.ct-list .ct-row').length;

  it('non filtré : 3 contacts, 3 lignes, « Contacts 3 »', () => {
    vue();
    expect(compteur()).toBe('Contacts 3');
    expect(lignes()).toBe(3);
  });
  it('filtre « à appeler » : 2 lignes, « Contacts 2 » ; filtre « sans numéro » : 1 ligne, « Contacts 1 »', () => {
    vue();
    fireEvent.click(screen.getByRole('button', { name: /à appeler/ }));
    expect(lignes()).toBe(2);
    expect(compteur()).toBe('Contacts 2');
    fireEvent.click(screen.getByRole('button', { name: /sans numéro/ }));
    expect(lignes()).toBe(1);
    expect(compteur()).toBe('Contacts 1');
  });
});

describe('Contacts : le menu d’un contact n’est pas tronqué (constat 15)', () => {
  const css = readFileSync('src/ui/atelier/atelier.css', 'utf8');
  const regle = (sel: string) => { const a = css.indexOf(`\n${sel} {`); return a < 0 ? '' : css.slice(a, css.indexOf('}', a)); };
  it('.ct-sheet défile dans le panneau (au lieu de couper le bas) ; .ct-sec garde sa hauteur de 44 px au moins', () => {
    const sheet = regle('.ct-sheet');
    expect(sheet).toContain('overflow-y: auto');
    expect(sheet).toContain('min-height: 0');
    const sec = regle('.ct-sec');
    expect(sec).toContain('flex-shrink: 0');
    expect(Number(sec.split('min-height: ')[1]?.split('px')[0])).toBeGreaterThanOrEqual(44);
  });
});

describe('Feuille fermée : le premier toucher n’est pas avalé (constat 16, garde)', () => {
  it('une fois fermée, la feuille ne laisse ni pointer-events:none sur le corps, ni voile qui intercepte', async () => {
    const view = render(<Sheet open onClose={() => {}} title="ZZ feuille"><p>contenu</p></Sheet>);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    view.rerender(<Sheet open={false} onClose={() => {}} title="ZZ feuille"><p>contenu</p></Sheet>);
    await act(async () => { await new Promise((r) => setTimeout(r, 50)); });
    expect(document.body.style.pointerEvents).not.toBe('none');
    const voile = document.querySelector('[data-vaul-overlay]') as HTMLElement | null;
    if (voile) expect(voile.dataset.state === 'closed' || getComputedStyle(voile).pointerEvents === 'none').toBe(true);
  });
});
