import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { ajouterJours, etiquetteS, lundiDe, preparerChoses, type ChoseCalendrier } from '../../src/domain/calendrier';
import { courbeCaisse } from '../../src/domain/calendrierCaisse';
import { deplacer } from '../../src/domain/calendrierGestes';
import { MESURES_PORTRAIT, Rangee, disposer, type Colonne } from '../../src/ui/calendrier/frise/Rangee';
import { Barre } from '../../src/ui/calendrier/frise/Barre';
import { motEtiquette } from '../../src/ui/finance/previsions/escalier';
import { texteEtiquette } from '../../src/ui/finance/previsions/EscalierSvg';
import type { ForecastItem } from '../../src/domain/finance/forecast';
import type { FinancialPlan } from '../../src/domain/finance/types';

/*
 * Test en ligne du calendrier 1 (en-ligne/2026-11-18-calendrier-3, RAPPORT.md de en-ligne-1) et deux plaintes du brasseur au téléphone
 * (CAL-PERIODE-LIBRE, dans calendrierEntete.test.tsx ; CAL-POINTS-MUETS, ici). Chaque cas reproduit la donnée réelle vue en ligne.
 */

const JOUR = '2026-11-16';
const L = lundiDe(JOUR);
const COLS = (n: number): Colonne[] => Array.from({ length: n }, (_, i) => ({ debut: ajouterJours(L, i * 7), fin: ajouterJours(L, i * 7 + 6), etiquette: etiquetteS(ajouterJours(L, i * 7)) }));
const rien = () => {};
const gestes = { onToucher: rien, onAppuiLong: rien, onGlisse: rien, onLacheGlisse: rien, onBord: rien, onLacheBord: rien, onRefus: rien };
afterEach(() => cleanup());

/** Une sortie dérivée d'un brassin, sans montant, comme la prévision en ligne (« Emballage · Jhhh », impôt sur la bière). */
const sortie = (id: string, titre: string, batchId: string, jour: string, rangee: ChoseCalendrier['rangee'], poste: 'frais' | 'courses' | 'impot'): ChoseCalendrier => ({
  id, rangee, titre, debut: jour, fin: jour, posteBrassin: poste,
  source: { genre: 'prevision-brassin', id: batchId }, ouvre: { ecran: 'brassin', id: batchId },
  deplacable: { raison: 'Cette sortie suit la date de son brassin : à régler dans Brassins.' }
} as ChoseCalendrier);

describe('n° 1 : chaque picto de la frise porte son nom à côté (« C’est quoi ces deux paniers ? »)', () => {
  const S48 = ajouterJours(L, 9);
  const choses = preparerChoses([
    sortie('E-JHHH', 'Emballage · Jhhh', 'JHHH', S48, 'achats', 'frais'),
    sortie('E-NEIPA', 'Emballage · neipa v3', 'NEIPA', S48, 'achats', 'frais'),
    ...['A', 'B', 'C', 'D'].map(k => sortie(`I-${k}`, `Impôt sur la bière · Lot ${k}`, `LOT-${k}`, ajouterJours(L, 30), 'papiers', 'impot'))
  ]);
  const caddies = choses.filter(c => c.brassinLie);
  const impot = choses.find(c => c.posteBrassin === 'impot')!;

  it('les données reproduisent le cas réel : deux caddies sans montant, un impôt groupé sans montant', () => {
    expect(caddies.map(c => c.titre).sort()).toEqual(['Emballage · Jhhh', 'Emballage · neipa v3']);
    expect(caddies.every(c => c.centimes === undefined)).toBe(true);
    expect(impot.titre).toBe('Impôt sur la bière · 4 brassins');
    expect(impot.centimes).toBeUndefined();
  });

  for (const [vue, n, vueLarge] of [['6 sem.', 6, false], ['3 mois', 13, true], ['An (en semaines)', 52, true]] as const) {
    it(`${vue} : chaque marque a une étiquette visible avec son nom`, () => {
      for (const c of [...caddies, impot]) {
        const d = disposer([c], COLS(n), 390 / n, 390, { vueLarge, reserveDroite: 76 }).items[0];
        expect(d.marque).toBe(true);
        expect(d.avecLibelle).toBe(true);
      }
      const props = { colonnes: COLS(n), largeurColonne: 390 / n, largeur: 390, mesures: MESURES_PORTRAIT, vueLarge, reserveDroite: 76, masquee: false, cause: null, epingles: [], etoiles: [], partMax: 0, drag: null, onAjouter: rien, onBasculerMasque: rien, barre: gestes } as const;
      render(<><Rangee id="brassins" choses={caddies} {...props} /><Rangee id="papiers" choses={[impot]} {...props} /></>);
      /* un nom long passe sur deux lignes (deux éléments) : on rejoint ses lignes par une espace */
      const texteVu = (e: Element) => {
        const morceaux: string[] = [];
        const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT);
        for (let n = w.nextNode(); n; n = w.nextNode()) morceaux.push(n.textContent ?? '');
        return morceaux.join(' ').replace(/\s+/g, ' ').trim();
      };
      const textes = [...document.querySelectorAll('.cal-lbl')].map(texteVu);
      expect(textes).toEqual(expect.arrayContaining(['Emballage · Jhhh', 'Emballage · neipa v3', 'Impôt sur la bière · 4 brassins']));
    });
  }
});

describe('n° 2 : « Ouvrir dans Finances » d’un achat prévu ouvre Prévisions, là où il est', () => {
  it('sur le banc, l’achat « Commande groupée de malt » demande Finances › Prévisions ; personne ne répond : Finances seul', () => {
    const demandes: unknown[] = [];
    const ecoute = (e: Event) => { demandes.push((e as CustomEvent).detail); e.preventDefault(); };
    window.addEventListener('affinee:ouvrir-finances', ecoute);
    const onOpenFinances = vi.fn();
    render(<BancCalendrier aujourdhui={JOUR} sansChrome callbacks={{ onOpenFinances }} />);
    const malt = screen.getAllByRole('button', { name: /^Commande groupée de malt/ })[0];
    fireEvent.pointerDown(malt, { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
    fireEvent.pointerUp(malt, { clientX: 10, clientY: 10, pointerId: 1 });
    const det = within(screen.getByRole('region', { name: /^Détail : Commande groupée de malt/ }));
    fireEvent.click(det.getByRole('button', { name: /Ouvrir dans Finances/ }));
    window.removeEventListener('affinee:ouvrir-finances', ecoute);
    expect(demandes).toEqual([{ onglet: 'previsions' }]);
    expect(onOpenFinances).not.toHaveBeenCalled();
  });
});

describe('n° 4 : le bandeau du glissé dit l’effet vrai sur le chiffre clé', () => {
  it('« ZZ TEST — achat calendrier » −12 glissé de S48 en S50 : le chiffre clé reste −672, son creux passe de S48 à S50 ; jamais « −672 → −660 »', () => {
    const plan: FinancialPlan = { id: 'ZZ', title: 'ZZ TEST — achat calendrier', date: ajouterJours(L, 9), amountCents: 1200, direction: 'out', category: 'divers', source: 'manual', status: 'active', createdAt: 'x' };
    const chose: ChoseCalendrier = {
      id: 'ZZ:x', rangee: 'achats', titre: plan.title, debut: plan.date, fin: plan.date, centimes: -1200,
      source: { genre: 'plan', id: 'ZZ', origine: 'manual', statut: 'active' }, ouvre: { ecran: 'plan', id: 'ZZ' }, deplacable: true
    } as ChoseCalendrier;
    /* le départ réel : −660 CHF à dépenser dès S47 */
    const courbe = courbeCaisse({ depart: -66000, lundi0: L, mouvements: [{ id: 'm', jour: plan.date, centimes: -1200, nom: plan.title, choseId: chose.id }] })!;
    const r = deplacer(chose, 2, { aujourdhui: JOUR, batches: [], plans: [plan], courbe });
    if (!r.ok) throw new Error(r.raison);
    expect(r.message.texte).toBe('À dépenser −672 : creux S48 → S50');
    expect(r.message.texte).not.toContain('−660');
  });
});

describe('n° 5 : Prévisions nomme l’achat par son nom entier', () => {
  const item: ForecastItem = { id: 'ZZ:2026-12-07', date: '2026-12-07', label: 'ZZ TEST — achat calendrier', amountCents: 1200, direction: 'out', source: 'plan', category: 'divers', planId: 'ZZ' } as ForecastItem;
  it('l’étiquette de l’escalier dit « ZZ TEST — achat calendrier −12, 07.12 », jamais « TEST »', () => {
    expect(motEtiquette(item)).toBe('ZZ TEST — achat calendrier');
    expect(texteEtiquette(item)).toBe('ZZ TEST — achat calendrier −12, 07.12');
  });
  it('les sorties d’un brassin et les charges gardent leur mot-clé (P5B, constat 1)', () => {
    expect(motEtiquette({ source: 'recurring', label: 'Loyer de l’atelier' })).toBe('loyer');
    expect(motEtiquette({ source: 'brew', label: 'Pale Ale d’hiver · emballage' })).toBe('emballage');
  });
});

describe('CAL-POINTS-MUETS (« Les petits points là donne pas d’info ») : chaque point d’étape dit son étape et sa date', () => {
  const debut = ajouterJours(L, 14);
  const ttt = {
    id: 'brassin-TTT', rangee: 'brassins', titre: 'Ttt', debut, fin: ajouterJours(debut, 14), centimes: -400, partiel: true,
    source: { genre: 'batch', id: 'TTT', statut: 'planifie' }, ouvre: { ecran: 'brassin', id: 'TTT' }, deplacable: true,
    jalons: [
      { id: 'brassage', libelle: 'Brassage', jour: debut, ecart: 0, glissable: 'barre' },
      { id: 'fermentation', libelle: 'Fermentation', jour: ajouterJours(debut, 1), ecart: 1, glissable: false, raison: 'suit la recette' },
      { id: 'dry-hop', libelle: 'Dry hop', jour: ajouterJours(debut, 5), ecart: 5, glissable: false, raison: 'suit la recette' },
      { id: 'garde', libelle: 'Garde', jour: ajouterJours(debut, 10), ecart: 10, glissable: false, raison: 'suit la recette' },
      { id: 'conditionnement', libelle: 'Conditionnement', jour: ajouterJours(debut, 14), ecart: 14, glissable: 'fin' }
    ]
  } as unknown as ChoseCalendrier;
  const toucher = (el: Element) => {
    fireEvent.pointerDown(el, { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
    fireEvent.pointerUp(el, { clientX: 10, clientY: 10, pointerId: 1 });
  };

  it('toucher un point montre « étape · date » sous la barre, sans ouvrir le détail ; toucher la barre ailleurs le retire et ouvre le détail', () => {
    const onToucher = vi.fn();
    render(<Barre chose={ttt} gauche={0} largeur={300} haut={0} hauteur={26} cote="dedans" placeEtiquette={0} largeurColonne={65} bornes={[0, 3]} {...gestes} onToucher={onToucher} />);
    const points = [...document.querySelectorAll('[data-jalon]')];
    expect(points).toHaveLength(5);
    /* chaque point porte son étape et sa date, sans geste (titre) */
    expect(points.map(p => p.getAttribute('data-point-texte'))).toEqual(['Brassage · 30 nov.', 'Fermentation · 1 déc.', 'Dry hop · 5 déc.', 'Garde · 10 déc.', 'Conditionnement · 14 déc.']);
    /* 18.11 : « plutot utiliser des mini icone. et une couleur pour le type de procédé » : chaque point est le picto de son étape (celui du
       détail), dans la couleur de son procédé, une couleur par étape */
    const pictos = points.map(p => p.querySelector('svg')?.getAttribute('class') ?? '');
    expect(pictos.map(c => c.match(/lucide-([a-z-]+)/g)?.find(n => n !== 'lucide-icon') ?? '')).toEqual(['lucide-wheat', 'lucide-flask-conical', 'lucide-leaf', 'lucide-snowflake', 'lucide-package']);
    const couleurs = points.map(p => (p as HTMLElement).style.getPropertyValue('--e'));
    /* D384 (jeu C « Par cuve, phases visibles ») : les jetons des étapes, clair et cave */
    expect(couleurs).toEqual(['rgb(var(--etape-brassage))', 'rgb(var(--etape-fermentation))', 'rgb(var(--etape-dry-hop))', 'rgb(var(--etape-garde))', 'rgb(var(--etape-conditionnement))']);
    expect(new Set(couleurs).size).toBe(5);
    toucher(document.querySelector('[data-jalon="dry-hop"]')!);
    expect(screen.getByRole('status').querySelector('svg')?.getAttribute('class')).toMatch(/lucide-leaf/);
    expect(screen.getByRole('status').textContent).toBe('Dry hop · 5 déc.');
    expect(onToucher).not.toHaveBeenCalled();
    toucher(document.querySelector('[data-jalon="garde"]')!);
    expect(screen.getByRole('status').textContent).toBe('Garde · 10 déc.');
    toucher(document.querySelector('[data-barre]')!);
    expect(screen.queryByRole('status')).toBeNull();
    expect(onToucher).toHaveBeenCalledTimes(1);
  });

  it('D384 : au repos, aucune bulle de date ; le pied de la barre est coloré par phase, chaque phase de la couleur de son étape', () => {
    render(<Barre chose={ttt} gauche={0} largeur={300} haut={0} hauteur={26} cote="dedans" placeEtiquette={0} largeurColonne={65} bornes={[0, 3]} {...gestes} />);
    /* « oui si on clic on a l'info mais elle doit pas être visible de base » */
    expect(document.querySelector('[data-point-bulle]')).toBeNull();
    expect(screen.queryByRole('status')).toBeNull();
    expect(document.querySelector('.cal-jalon-vu')).toBeNull();
    const phases = [...document.querySelectorAll<HTMLElement>('.cal-piste [data-phase]')];
    expect(phases.map(p => p.getAttribute('data-phase'))).toEqual(['brassage', 'fermentation', 'dry-hop', 'garde', 'conditionnement']);
    expect(phases.map(p => p.style.getPropertyValue('--p'))).toEqual(['brassage', 'fermentation', 'dry-hop', 'garde', 'conditionnement'].map(id => `rgb(var(--etape-${id}))`));
    /* d'un bord à l'autre, sans espace : la première part du bord gauche, chaque phase finit où la suivante commence, la dernière au bord droit */
    const v = (p: HTMLElement, k: string) => p.style.getPropertyValue(k);
    expect(v(phases[0], '--a')).toBe('0px');
    for (let i = 0; i < phases.length - 1; i++) expect(v(phases[i], '--b')).toBe(v(phases[i + 1], '--a'));
    expect(v(phases[phases.length - 1], '--b')).toBe('100%');
    expect(v(phases[2], '--a')).toMatch(/^\(var\(--cal-bg\) \+ \(100% - var\(--cal-bg\) - var\(--cal-bd\)\) \* 0\.3571\)$/);
    /* chaque picto prend l'encre de son étape (blanc en clair ; sombre en cave, sauf la garde) */
    expect([...document.querySelectorAll<HTMLElement>('[data-jalon]')].map(p => p.style.getPropertyValue('--ei'))).toEqual(
      ['brassage', 'fermentation', 'dry-hop', 'garde', 'conditionnement'].map(id => `rgb(var(--etape-${id}-encre))`));
  });

  it('D384 : un brassin pas brassé (brassage seul) n’a de pied coloré que le jour du brassage ; le reste, inconnu, reste nu', () => {
    const seul = { ...ttt, id: 'brassin-PB', pasBrassee: true, jalons: [ttt.jalons![0]] } as unknown as ChoseCalendrier;
    render(<Barre chose={seul} gauche={0} largeur={300} haut={0} hauteur={26} cote="dedans" placeEtiquette={0} largeurColonne={65} bornes={[0, 3]} {...gestes} />);
    const phases = [...document.querySelectorAll<HTMLElement>('.cal-piste [data-phase]')];
    expect(phases).toHaveLength(1);
    expect(phases[0].getAttribute('data-phase')).toBe('brassage');
    /* 1 jour sur 14 : la phase finit à 1/14 de la largeur, jamais au bord droit */
    expect(phases[0].style.getPropertyValue('--b')).toMatch(/\* 0\.0714\)$/);
  });

  it('D384 : chaque jeton d’étape existe dans les deux thèmes, aucune couleur en dur dans la frise', async () => {
    const fs = await import('node:fs');
    const chemin = await import('node:path');
    const themes = fs.readFileSync(chemin.resolve(process.cwd(), 'src/theme/themes.css'), 'utf8');
    const bloc = (sel: string) => themes.slice(themes.indexOf(`${sel} {`), themes.indexOf('}', themes.indexOf(`${sel} {`)));
    for (const sel of ["[data-theme='clair']", "[data-theme='cave']"]) {
      for (const id of ['brassage', 'fermentation', 'dry-hop', 'garde', 'conditionnement']) {
        expect(bloc(sel)).toMatch(new RegExp(`--etape-${id}: \\d+ \\d+ \\d+;`));
        expect(bloc(sel)).toMatch(new RegExp(`--etape-${id}-encre: \\d+ \\d+ \\d+;`));
      }
    }
    for (const f of ['frise.css', 'Barre.tsx', 'etapes.ts']) {
      const src = fs.readFileSync(chemin.resolve(process.cwd(), 'src/ui/calendrier/frise', f), 'utf8');
      expect(src).not.toMatch(/#[0-9a-fA-F]{6}\b/);
    }
  });

  it('les icônes ne masquent pas la barre : à moins de 16 px l’une de l’autre, la plus utile reste ; une barre de 30 px (An) ne garde que sa fin', () => {
    /* 120 px pour 14 j : brassage 0 px et fermentation 8,6 px se touchent : la fermentation reste ; dry hop 43, garde 86, fin 120 */
    render(<Barre chose={ttt} gauche={0} largeur={120} haut={0} hauteur={26} cote="dedans" placeEtiquette={0} largeurColonne={65} bornes={[0, 3]} {...gestes} />);
    expect([...document.querySelectorAll('[data-jalon]')].map(p => p.getAttribute('data-jalon'))).toEqual(['fermentation', 'dry-hop', 'garde', 'conditionnement']);
    cleanup();
    render(<Barre chose={ttt} gauche={0} largeur={30} haut={0} hauteur={26} cote="dedans" placeEtiquette={0} largeurColonne={7.5} bornes={[0, 3]} {...gestes} />);
    expect([...document.querySelectorAll('[data-jalon]')].map(p => p.getAttribute('data-jalon'))).toEqual(['conditionnement']);
  });
});
