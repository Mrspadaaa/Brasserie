// @vitest-environment jsdom
// Carnet, tour 3 du 19.11, voie f13 : PCN-37 (clavier ouvert, CARNET-CLAV) et PCN-27 (Créer · après, g5:v04-4). L13 : rouge avant, vert après.
// La hauteur réelle se mesure dans Chrome (voies/f13/mesure.mjs, clavier simulé `?keyboard=300`) ; ici, la structure qui la produit.
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ChampCarnet } from '../../src/ui/carnets/ChampCarnet';
import { CarnetOuvert, type CarnetV } from '../../src/ui/carnets/CarnetOuvert';
import { AIDES_ETEINTES } from '../../src/ui/carnets/EtatIA';

afterEach(cleanup);
const rien = () => undefined;
const texte = (e: Element) => (e.textContent ?? '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
const css = (f: string) => fs.readFileSync(path.resolve(__dirname, `../../src/ui/carnets/${f}`), 'utf8').replace(/\r\n/g, '\n');
/** Les règles CSS (sélecteur → déclarations) d'une feuille, à plat. */
const regles = (f: string) => [...css(f).replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ sel: m[1].trim(), decl: m[2] }));
const regle = (f: string, sel: RegExp, decl: RegExp) => regles(f).some(r => sel.test(r.sel) && decl.test(r.decl));

const SUGG = { critere: 'pas trop de bruit', a: 'Hotte inox + extracteur', b: 'Extracteur mural seul' };

describe('PCN-37 (CARNET-CLAV) : clavier ouvert, bulle G8, puce et champ compactés ; rendus à la fermeture', () => {
  beforeEach(() => { window.history.replaceState(null, '', '/'); });
  /* la zone posée dans un hôte dont le bas laisse 40 px à la barre d'onglets (fixe, sous le clavier quand il est ouvert) */
  const monter = (clavier: number) => {
    window.history.replaceState(null, '', clavier ? `/?keyboard=${clavier}` : '/');
    const hote = document.createElement('div');
    document.body.appendChild(hote);
    hote.getBoundingClientRect = () => ({ top: 70, bottom: window.innerHeight - 40, left: 0, right: 390, width: 390, height: window.innerHeight - 110, x: 0, y: 70, toJSON: () => ({}) });
    const r = render(<ChampCarnet valeur="" onChange={rien} onEnvoyer={rien} titreCarnet="ZZ TEST — Ventilation de la salle de brassage" suggestion={SUGG} coller="https://exemple.invalid/hotte-140" onColler={rien} />, { container: hote });
    act(() => { r.container.querySelector('textarea')!.focus(); });
    return r.container.querySelector<HTMLElement>('.cn-champ-zone')!;
  };

  it('clavier ouvert : la barre d’onglets est sous le clavier, la zone ne lui garde pas sa place (marge = clavier − 40 px)', () => {
    const z = monter(300);
    expect(z.hasAttribute('data-clavier')).toBe(true);
    expect(z.style.bottom).toBe('300px');
    expect(z.style.marginBottom).toBe('260px');
  });

  it('clavier fermé : rien ne change (marge 0, pas de data-clavier)', () => {
    const z = monter(0);
    expect(z.hasAttribute('data-clavier')).toBe(false);
    expect(z.style.marginBottom).toBe('0px');
  });

  /* f13 tour 2 (critique n° 3) : la ligne tronquée « Hotte in… » est retirée ; deux lignes serrées (carnetsTour3F13b.test.tsx, n° 3) */
  it('clavier ouvert : la bulle G8 garde le texte entier au survol et au lecteur', () => {
    const z = monter(300);
    expect(z.querySelector('.cn-bulle')!.getAttribute('title')).toContain('tranche entre Hotte inox + extracteur et Extracteur mural seul');
  });

  it('clavier ouvert : le + volant est sous le clavier, la zone reprend sa colonne (padding droit 12 px, « Va dans » sans marge négative)', () => {
    expect(regle('carnets-fil.css', /^\.cn-champ-zone\[data-clavier\]$/, /padding-right:\s*12px/)).toBe(true);
    expect(regle('carnets-fil.css', /\.cn-champ-zone\[data-clavier\]\s*>\s*\.cn-vadans/, /margin-right:\s*0/)).toBe(true);
  });

  it('au repos (sans clavier), la bulle garde ses deux lignes : aucune règle d’une ligne hors de [data-clavier]', () => {
    const horsClavier = regles('carnets-fil.css').filter(r => /\.cn-bulle/.test(r.sel) && !/data-clavier/.test(r.sel));
    expect(horsClavier.some(r => /white-space:\s*nowrap/.test(r.decl))).toBe(false);
  });
});

describe('PCN-27 (R11, g5:v04-4) : Créer · après, porté de sa maquette', () => {
  const neuf: CarnetV = { id: 'n', title: 'Embouteillage', status: 'idea', carnet: { creeLe: '2026-11-17T08:00:00.000Z', phrase: 'embouteillage', criteres: [], facons: [], articles: [], notes: [], photos: [] } };
  const monter = (vient: boolean, iaIndisponible: 'echec' | 'hors-ligne' | 'eteinte' | null = null) => render(<CarnetOuvert carnet={neuf} aides={AIDES_ETEINTES} liens={[]} tableau={null} vientDEtreCree={vient}
    iaIndisponible={iaIndisponible} bandeau={<div className="cn-bandeau">✓ Carnet créé, en tête des Carnets · Annuler</div>} onRetour={rien} onRenommer={rien} onSupprimer={rien} onNote={rien} onOuvrirArticle={rien} onComparer={rien} />).container;

  it('en-tête « ‹ Carnets ●○○○ idée ··· » : les points d’étape, une seule allumée, au lieu de la pastille', () => {
    const c = monter(true);
    const e = c.querySelector('.cn-tete .cn-etapes')!;
    expect(e).not.toBeNull();
    expect(e.querySelectorAll('.cn-etape-on')).toHaveLength(1);
    expect(e.querySelectorAll('span:not(.cn-lien-texte)')).toHaveLength(4);
    expect(texte(e)).toBe('idée');
    expect(c.querySelector('.cn-tete .cn-pastille')).toBeNull();
  });

  it('l’encadré « Idée · 17 nov. / Ensuite : l’IA cherche les façons », entre le titre et le bandeau', () => {
    const c = monter(true);
    const enc = c.querySelector('.cn-encadre-idee')!;
    expect(enc).not.toBeNull();
    expect([...enc.children].map(texte)).toEqual(['Idée · 17 nov.', "Ensuite : l'IA cherche les façons"]);
    const ordre = [...c.querySelectorAll('.cn-titre-ligne, .cn-encadre-idee, .cn-bandeau')].map(x => x.className.split(' ')[0]);
    expect(ordre).toEqual(['cn-titre-ligne', 'cn-encadre-idee', 'cn-bandeau']);
    expect(css('carnets.css')).toMatch(/\.cn-encadre-idee\s*\{[^}]*background:[^;]*var\(--c-attbg\)/); /* f13 tour 3 (n° 2) : la teinte posée sur le fond de la page */
  });

  it('les rubriques de la maquette, Photos · aucune comprise', () => {
    const t = texte(monter(true));
    expect(t).toContain('collez un lien');
    for (const m of ["Ce qui compte · rien encore", 'Façons · aucune', 'Photos · aucune', 'Notes · aucune']) expect(t).not.toContain(m); /* V4 (21.11, CRB-7) : plus de rubrique vide */
  });

  it('IA indisponible : l’encadré ne promet rien de l’IA (« Ensuite : collez un lien »)', () => {
    for (const s of ['echec', 'eteinte'] as const) {
      const enc = monter(true, s).querySelector('.cn-encadre-idee')!;
      expect([...enc.children].map(texte)).toEqual(['Idée · 17 nov.', 'Ensuite : collez un lien']);
      cleanup();
    }
  });

  it('ailleurs (pas tout juste créé) : la pastille, ni points ni encadré', () => {
    const c = monter(false);
    expect(c.querySelector('.cn-encadre-idee')).toBeNull();
    expect(c.querySelector('.cn-etapes')).toBeNull();
    expect(texte(c.querySelector('.cn-tete .cn-pastille')!)).toBe('Idée · 17 nov.');
  });
});
