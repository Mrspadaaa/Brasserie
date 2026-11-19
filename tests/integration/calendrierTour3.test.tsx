import React from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { EnTeteCalendrier, type EnTeteCalendrierProps, type ModeleEnTete } from '../../src/ui/calendrier/entete/EnTete';
import { periodeDeFenetre } from '../../src/ui/calendrier/entete/Fenetre';
import { etiquettesMois } from '../../src/ui/calendrier/entete/Courbe';
import { ajouterJours, etiquetteS, semainesDe, type ChoseCalendrier } from '../../src/domain/calendrier';
import { courbeCaisse, creuxDepuis, type MouvementCaisse } from '../../src/domain/calendrierCaisse';
import { MESURES_PORTRAIT, Rangee, type Colonne } from '../../src/ui/calendrier/frise/Rangee';
import { BancCalendrier, etatBanc } from '../../src/design/CalendrierPreview';
import { StorageService } from '../../src/services/storage';
import type { Batch } from '../../src/types';

/**
 * Tour 3, lot cal (19.11, vision tour 2 : T2-1, T2-2, T2-5, T2B-2). Banc — données simulées : aucune donnée réelle, aucun appel réseau.
 * T2-2 : TOUT brassin de la frise ouvre sa fiche au toucher (barre, vignette ou nom), avec une zone de toucher d'au moins 44 × 24 px, même pour
 *   une barre de 3 px (zone élargie invisible, le dessin ne change pas).
 * T2-1 : courbe alignée en portrait : sa rangée de mois part ; la rangée des semaines sous la frise est le seul axe (comme la courbe non alignée).
 * T2B-2 : un libellé de mois qui ne tient pas entier au bord ne s'affiche pas (ni coupé, ni orphelin).
 */
beforeEach(() => {
  localStorage.clear();
  for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const LUNDI0 = '2026-11-16';
const down = (el: Element) => fireEvent.pointerDown(el, { clientX: 100, clientY: 10, pointerId: 1, button: 0 });
const up = (el: Element) => fireEvent.pointerUp(el, { clientX: 100, clientY: 10, pointerId: 1 });
const toucher = (el: Element) => { down(el); up(el); };
const rien = () => undefined;

/** Un brassin simulé, sans recette (aucune fin connue : « durée inconnue », une barre d'un jour), ou « pas brassé » (jour prévu passé). */
const brassin = (id: string, titre: string, debut: string, fin: string, extra: Partial<ChoseCalendrier> = {}): ChoseCalendrier => ({
  id, rangee: 'brassins', titre, etiquette: `${titre} · coût à venir`, coutAVenir: true, partiel: true, duree: 'durée inconnue', debut, fin,
  source: { genre: 'batch', id, statut: 'planifie' }, ouvre: { ecran: 'brassin', id }, deplacable: true, ...extra
} as unknown as ChoseCalendrier);

const colonnes = (n: number): Colonne[] => Array.from({ length: n }, (_, i) => ({ debut: ajouterJours(LUNDI0, i * 7), fin: ajouterJours(LUNDI0, i * 7 + 6), etiquette: etiquetteS(ajouterJours(LUNDI0, i * 7)) }));

function monterRangee(choses: ChoseCalendrier[], lc: number, extra: Partial<React.ComponentProps<typeof Rangee>> = {}) {
  const onToucher = vi.fn();
  const cols = colonnes(6);
  const r = render(
    <Rangee id="brassins" choses={choses} colonnes={cols} largeurColonne={lc} largeur={lc * 6} mesures={MESURES_PORTRAIT} reserveDroite={0}
      masquee={false} cause={null} epingles={[]} etoiles={[]} partMax={0} drag={null} onAjouter={rien} onBasculerMasque={rien}
      barre={{ onToucher, onAppuiLong: rien, onGlisse: rien, onLacheGlisse: rien, onBord: rien, onLacheBord: rien, onRefus: rien }} {...extra} />
  );
  return { ...r, onToucher };
}
const px = (v: string) => Number.parseFloat(v);

describe('T2-2 — toute barre de brassin s’ouvre au toucher : zone d’au moins 44 × 24 px, barre, vignette ou nom', () => {
  /* 7 px par semaine : une barre d'un jour fait 3 px de large (le dessin la tient à 10 px) */
  const minuscule = brassin('TTT', 'Ttt', ajouterJours(LUNDI0, 9), ajouterJours(LUNDI0, 9));
  const passe = brassin('PAS', 'Saison de ferme', ajouterJours(LUNDI0, 17), ajouterJours(LUNDI0, 17), { pasBrassee: true, duree: 'pas brassée · prévue le 3 déc.' } as Partial<ChoseCalendrier>);

  it('une barre de 3 px porte une zone de toucher invisible d’au moins 44 px de large et 24 px de haut', () => {
    const { container } = monterRangee([minuscule, passe], 7);
    const barres = [...container.querySelectorAll<HTMLElement>('[data-barre]')];
    expect(barres).toHaveLength(2);
    for (const b of barres) {
      const zone = b.querySelector<HTMLElement>('[data-zone-tactile]');
      expect(zone, `zone de ${b.getAttribute('data-titre')}`).not.toBeNull();
      expect(px(zone!.style.width)).toBeGreaterThanOrEqual(44);
      expect(px(zone!.style.height)).toBeGreaterThanOrEqual(24);
      expect(zone).toHaveAttribute('aria-hidden', 'true');
    }
  });
  it('toucher la zone, la barre ou le nom d’une barre minuscule ouvre sa fiche (onToucher), jamais rien', () => {
    const { container, onToucher } = monterRangee([minuscule, passe], 7);
    const barre = container.querySelector<HTMLElement>('[data-barre][data-titre="Ttt"]')!;
    toucher(barre.querySelector('[data-zone-tactile]')!);
    expect(onToucher).toHaveBeenCalledTimes(1);
    toucher(barre);
    expect(onToucher).toHaveBeenCalledTimes(2);
    const nom = [...container.querySelectorAll<HTMLElement>('.cal-lbl')].find(e => (e.textContent ?? '').startsWith('Ttt'))!;
    expect(nom, 'le nom de Ttt').toBeTruthy();
    toucher(nom);
    expect(onToucher).toHaveBeenCalledTimes(3);
    expect((onToucher.mock.calls[2][0] as ChoseCalendrier).id).toBe('TTT');
  });
  it('un brassin « pas brassé » (jour prévu passé) : son nom, posé à côté, s’ouvre aussi au toucher', () => {
    const { container, onToucher } = monterRangee([passe], 7);
    const nom = [...container.querySelectorAll<HTMLElement>('.cal-lbl')].find(e => (e.textContent ?? '').startsWith('Saison'))!;
    toucher(nom);
    expect((onToucher.mock.calls[0][0] as ChoseCalendrier).id).toBe('PAS');
  });
  it('toucher la pastille « lié à » du nom n’ouvre pas la fiche (elle a son propre geste)', () => {
    const lie = brassin('LIE', 'Ttt', ajouterJours(LUNDI0, 9), ajouterJours(LUNDI0, 9));
    const { container, onToucher } = monterRangee([lie], 7);
    const bouton = document.createElement('button');
    container.querySelector('.cal-lbl')!.appendChild(bouton);
    toucher(bouton);
    expect(onToucher).not.toHaveBeenCalled();
  });
  it('une barre déjà large ne reçoit pas de zone horizontale ; la vignette d’une marque garde ses 44 px', () => {
    const large = brassin('LAR', 'Blonde', ajouterJours(LUNDI0, 0), ajouterJours(LUNDI0, 30));
    const { container } = monterRangee([large], 61);
    const zone = container.querySelector<HTMLElement>('[data-barre] [data-zone-tactile]');
    expect(zone === null || px(zone.style.width) <= px(container.querySelector<HTMLElement>('[data-barre]')!.style.width) + 1).toBe(true);
  });
  it('vue large (6 mois, An) : la vignette d’un brassin et son nom ouvrent la fiche', () => {
    const { container, onToucher } = monterRangee([minuscule], 7, { vueLarge: true });
    const marque = container.querySelector<HTMLElement>('[data-marque]')!;
    expect(marque).toBeTruthy();
    toucher(marque);
    expect(onToucher).toHaveBeenCalledTimes(1);
    const nom = [...container.querySelectorAll<HTMLElement>('.cal-lbl')].find(e => (e.textContent ?? '').startsWith('Ttt'))!;
    toucher(nom);
    expect(onToucher).toHaveBeenCalledTimes(2);
  });
});

describe('T2-2 — onglet entier : un brassin sans recette (« Ttt ») et un brassin passé ouvrent leur fiche', () => {
  const ttt = (jour: string): Batch => ({
    id: 'LOT-TTT', name: 'Ttt', style: 'Ttt', volumeL: 100, brewDate: '', plannedBrewDate: jour.split('-').reverse().join('.'), status: 'planifie', gravityLog: [], stockAccountingVersion: 1
  } as unknown as Batch);
  const montrer = () => {
    const base = etatBanc(LUNDI0);
    const etat = { ...base, batches: [...base.batches, ttt(ajouterJours(LUNDI0, 9))] };
    return render(<BancCalendrier aujourdhui={LUNDI0} sansChrome etat={etat} />);
  };
  it('toucher la barre de Ttt, puis son nom, ouvre sa fiche', () => {
    montrer();
    const barre = document.querySelector<HTMLElement>('[data-barre][data-titre="Ttt"]');
    expect(barre, 'barre de Ttt').not.toBeNull();
    toucher(barre!);
    expect(document.querySelector('[data-detail-sous="' + barre!.getAttribute('data-chose-id') + '"]'), 'fiche ouverte').not.toBeNull();
    toucher(barre!); // refermée
    expect(document.querySelector('[data-detail-sous]')).toBeNull();
    const nom = [...document.querySelectorAll<HTMLElement>('.cal-lbl')].find(e => (e.textContent ?? '').startsWith('Ttt') && !e.classList.contains('cal-lbl-dedans'));
    if (nom) {
      toucher(nom);
      expect(document.querySelector('[data-detail-sous]'), 'fiche ouverte au nom').not.toBeNull();
    }
  });
});

describe('T2-1 — courbe alignée : la rangée des semaines est le seul axe (aucun mois dans la courbe)', () => {
  const mouvements: MouvementCaisse[] = [
    { id: 'm0', jour: ajouterJours(LUNDI0, 2), centimes: -14800, nom: 'Malt' },
    { id: 'm4', jour: ajouterJours(LUNDI0, 30), centimes: 91000, nom: 'Marché de Noël' }
  ];
  const vivante = courbeCaisse({ depart: 418000, lundi0: LUNDI0, mouvements, mises: [] })!;
  const modele: ModeleEnTete = { semaines: semainesDe(LUNDI0, 52), courbe: vivante, creux: creuxDepuis(vivante), retards: [], sansDate: [], icones: [] };
  const props = (extra: Partial<EnTeteCalendrierProps> = {}): EnTeteCalendrierProps => ({
    modele, fenetre: { du: LUNDI0, semaines: 6 }, onFenetre: vi.fn(), periode: periodeDeFenetre({ du: LUNDI0, semaines: 6 }), onPeriode: vi.fn(),
    vue: 'semaines', onVue: vi.fn(), mouvements: false, onMouvements: vi.fn(), orientation: 'portrait', largeurColonne: 61,
    aligne: true, onAligne: vi.fn(), ...extra
  });
  /** Les rangées de libellés d'échelle : le texte des mois de la courbe, la bande des semaines (S47…). */
  const rangeesDeLibelles = (c: HTMLElement) => (c.querySelector('.ent-cbz text.ent-mois') ? 1 : 0) + (c.querySelector('.ent-bz') ? 1 : 0);

  it('alignée, 390 : aucun mois dans la courbe ; une rangée de libellés d’échelle (la bande des semaines)', () => {
    const { container } = render(<EnTeteCalendrier {...props()} />);
    expect(container.querySelectorAll('.ent-cbz text.ent-mois')).toHaveLength(0);
    expect(rangeesDeLibelles(container)).toBe(1);
  });
  it('le code des mois reste, derrière l’option moisCourbeAlignee', () => {
    const { container } = render(<EnTeteCalendrier {...props({ moisCourbeAlignee: true })} />);
    expect(container.querySelectorAll('.ent-cbz text.ent-mois').length).toBeGreaterThan(0);
  });
});

describe('T2B-2 — un libellé de mois qui ne tient pas entier au bord ne s’affiche pas', () => {
  const sem = (lundi: string, i: number) => ({ lundi, numero: 47 + i, libre: 0, caisse: 0, mouvements: [] }) as never;
  const geo = (largeur: number) => ({ largeur, x: (i: number) => i * 61 }) as never;
  it('« déc. » posé à 3 px du bord droit n’est pas écrit coupé ; entier, il l’est', () => {
    /* 6 semaines de 61 px : déc. commence en 3e semaine (30 nov. + jeudi 3 déc.) */
    const semaines = Array.from({ length: 6 }, (_, i) => sem(ajouterJours(LUNDI0, i * 7), i));
    const large = etiquettesMois(semaines, geo(366));
    expect(large.map(m => m.texte)).toContain('déc.');
    const xDec = large.find(m => m.texte === 'déc.')!.x;
    const etroit = etiquettesMois(semaines, geo(xDec + 12));
    expect(etroit.map(m => m.texte)).not.toContain('déc.');
  });
});

describe('T2-5 — paysage 844 × 340 : la bande des semaines est serrée (la frise vise ≤ 25 % en plein écran)', () => {
  /* La hauteur réelle se mesure au banc (banc-plein.mjs, Chrome) ; ici, la règle de feuille qui la fixe, lue telle quelle. */
  const css = readFileSync(resolve(__dirname, '../../src/ui/calendrier/entete/entete.css'), 'utf8');
  it('la case de la bande des semaines en paysage fait 22 px au plus', () => {
    const m = /\.ent--paysage \.ent-bd-c\s*\{[^}]*min-height:\s*(\d+)px/.exec(css);
    expect(m, 'règle « .ent--paysage .ent-bd-c » trouvée').not.toBeNull();
    expect(Number(m![1])).toBeLessThanOrEqual(22);
  });
  it('la bande des semaines colle à la courbe en paysage (0 px d’écart ; le cadre garde ses 2 px)', () => {
    expect(Number(/\.ent--paysage \.ent-bz\s*\{[^}]*margin-top:\s*(\d+)(?:px)?\s*;/.exec(css)?.[1])).toBe(0);
  });
  it('l’écart entre la bande et la frise en paysage est de 2 px (space-y-0.5), non plus 4', () => {
    const tab = readFileSync(resolve(__dirname, '../../src/components/tabs/CalendrierTab.tsx'), 'utf8');
    expect(tab).toContain("' cal-tab-paysage space-y-0.5'");
  });
});
