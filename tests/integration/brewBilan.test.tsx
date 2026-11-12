import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import {
  BrewBilan,
  BrewHeuresTenues,
  BrewJournalExtrait,
  compteurReleves,
  separerPasReleves,
  valeurTuile,
  type HeureTenue,
  type TuileBilan
} from '../../src/ui/BrewBilan';

/**
 * Voie port-E (12.11) : le bilan de p2c, mots exacts de `voies/p2/p2c/build.mjs` (états E1, E2, E3, E4).
 * Règles : « ? » jamais 0 ; « ≈ » seulement pour un calcul ; quatre états de bord ; « Pas relevés » à la clôture ; porte « Aide ».
 */
afterEach(cleanup);

const h = (hh: number, mm: number) => new Date(2026, 10, 11, hh, mm).getTime();

// E1 : palier sans relevé, 13 h 05.
const E1: TuileBilan[] = [
  { id: 'eau', nom: 'Eau d’empâtage', valeur: '18,5 L · ? °C', quand: 'température non relevée', etat: 'manque', court: 'eau d’empâtage °C' },
  { id: 'maische', nom: 'Empâtage', valeur: '? °C · pH ?', cible: 'cible 67 °C · pH 5,2–5,5', quand: 'maintenant · pH 13 h 15', etat: 'afaire' },
  { id: 'preboil', nom: 'Avant ébullition', valeur: '? L · ?', cible: 'cible 28,5 L · 1,052', quand: 'vers 15 h 05', etat: 'afaire' },
  { id: 'coupure', nom: 'Densité à la coupure', valeur: '?', cible: 'pour agir avant le refroidissement', quand: 'vers 16 h 20', etat: 'afaire', court: 'coupure' },
  { id: 'og', nom: 'OG · densité initiale', valeur: '?', cible: 'cible 1,061', quand: 'au fermenteur ~17 h 10', etat: 'afaire' },
  { id: 'ferm', nom: 'Au fermenteur', valeur: '? L', cible: 'cible 22 L', quand: 'ensemencement ~17 h 15', etat: 'afaire' },
  { id: 'rendement', nom: 'Rendement d’empâtage', valeur: null, cible: 'visé ≈ 57 %', quand: 'calculé au relevé avant ébullition', etat: 'afaire', calcul: true },
  { id: 'ensem', nom: 'Ensemencement', valeur: '? °C', cible: 'cible 18 °C · 1 sachet', quand: '~17 h 15', etat: 'afaire', court: 'moût à l’ajout °C' }
];

// E3 : relevé hors cible à 15 h 05.
const E3: TuileBilan[] = [
  { id: 'preboil', nom: 'Avant ébullition', valeur: '27,9 L · 1,048', cible: 'cible 28,5 L · 1,052', quand: 'OG projetée ≈ 1,057 sans correction', etat: 'ecart', grand: true },
  { id: 'maische', nom: 'Empâtage', valeur: '66,4 °C · pH 5,35', cible: 'cible 67 °C · pH 5,2–5,5', quand: '✓ dans la cible', etat: 'ok' },
  { id: 'rendement', nom: 'Rendement d’empâtage', valeur: '≈ 52 %', cible: 'visé ≈ 57 %', quand: 'calculé sur 27,9 L à 1,048', etat: 'ecart', calcul: true },
  { id: 'coupure', nom: 'Densité à la coupure', valeur: '?', cible: 'à 16 h 20', quand: 'dans 1 min', etat: 'du', court: 'coupure' }
];

// E4 : clôture, 17 h 20.
const E4: TuileBilan[] = [
  { id: 'og', nom: 'OG · densité initiale', valeur: '1,059', cible: 'cible 1,061', quand: '−2 points', etat: 'ecart' },
  { id: 'ferm', nom: 'Au fermenteur', valeur: '21,5 L', cible: 'cible 22 L', quand: '−0,5 L', etat: 'ecart' },
  { id: 'preboil', nom: 'Avant ébullition', valeur: '27,9 L · 1,048', cible: 'cible 28,5 L · 1,052', quand: 'relevé à 15 h 05', etat: 'ecart' },
  { id: 'rendement', nom: 'Rendement d’empâtage', valeur: '≈ 52 %', cible: 'visé ≈ 57 %', quand: 'pour le prochain : ≈ +0,9 kg de grain', etat: 'ecart', calcul: true },
  { id: 'maische', nom: 'Empâtage', valeur: '66,4 °C · pH 5,35', cible: 'cible 67 °C · pH 5,2–5,5', quand: '✓ dans la cible', etat: 'ok' },
  { id: 'eau', nom: 'Eau d’empâtage', valeur: '18,5 L · ? °C', quand: 'température non relevée', etat: 'manque', court: 'eau d’empâtage °C' },
  { id: 'coupure', nom: 'Densité à la coupure', valeur: undefined, quand: 'à 16 h 20', etat: 'manque', court: 'coupure' },
  { id: 'ensem', nom: 'Ensemencement', valeur: '? °C', quand: '~17 h 15', etat: 'afaire', court: 'moût à l’ajout °C' }
];

const tuile = (id: string) => document.querySelector(`[data-tuile="${id}"]`) as HTMLElement;

describe('BrewBilan · mots exacts de p2c', () => {
  it('E1 : titre « bilan visé », « 0 relevé sur 9 · fin ~17 h 30 estimé », huit tuiles', () => {
    render(<BrewBilan tuiles={E1} faits={0} fin={h(17, 30)} />);
    expect(screen.getByRole('heading', { name: 'Relevés du jour · bilan visé' })).toBeInTheDocument();
    expect(screen.getByText('0 relevé sur 9 · fin ~17 h 30 estimé')).toBeInTheDocument();
    expect(document.querySelectorAll('[data-tuile]')).toHaveLength(8);
    expect(within(tuile('eau')).getByText('Eau d’empâtage')).toBeInTheDocument();
    expect(within(tuile('eau')).getByText('température non relevée')).toBeInTheDocument();
    expect(within(tuile('maische')).getByText('cible 67 °C · pH 5,2–5,5')).toBeInTheDocument();
    expect(within(tuile('coupure')).getByText('pour agir avant le refroidissement')).toBeInTheDocument();
    expect(within(tuile('rendement')).getByText('visé ≈ 57 %')).toBeInTheDocument();
  });

  it('E2 / E3 : « 4 relevés sur 9 · fin ~17 h 30 » sans « estimé » ; « OG projetée ≈ 1,057 sans correction »', () => {
    render(<BrewBilan tuiles={E3} faits={4} fin={h(17, 30)} />);
    expect(screen.getByText('4 relevés sur 9 · fin ~17 h 30')).toBeInTheDocument();
    expect(within(tuile('preboil')).getByText(/OG projetée ≈ 1,057 sans correction/)).toBeInTheDocument();
    expect(tuile('preboil')).toHaveClass('is-grand');
  });

  it('une fin inconnue se lit « fin ? », jamais une heure inventée', () => {
    render(<BrewBilan tuiles={E1} faits={0} fin={null} />);
    expect(screen.getByText('0 relevé sur 9 · fin ?')).toBeInTheDocument();
  });

  it('E4 : « bilan contre la cible », « 6 relevés sur 9 », pas de « fin » ni de rangée « Au jour J »', () => {
    render(<BrewBilan mode="reel" tuiles={E4} faits={6} fin={h(17, 30)} onDuree={() => {}} />);
    expect(screen.getByRole('heading', { name: 'Relevés du jour · bilan contre la cible' })).toBeInTheDocument();
    expect(screen.getByText('6 relevés sur 9')).toBeInTheDocument();
    expect(screen.queryByText(/fin ~/)).toBeNull();
    expect(screen.queryByText('Au jour J')).toBeNull();
    expect(within(tuile('og')).getByText('−2 points')).toBeInTheDocument();
    expect(within(tuile('ferm')).getByText('−0,5 L')).toBeInTheDocument();
    expect(within(tuile('rendement')).getByText('pour le prochain : ≈ +0,9 kg de grain')).toBeInTheDocument();
    expect(within(tuile('maische')).getByText('✓ dans la cible')).toBeInTheDocument();
  });
});

describe('BrewBilan · règles', () => {
  it('un relevé absent se lit « ? », jamais 0', () => {
    render(<BrewBilan tuiles={[{ id: 'og', nom: 'OG · densité initiale', quand: 'au fermenteur ~17 h 10', etat: 'afaire' }]} faits={0} fin={null} />);
    const og = tuile('og');
    expect(within(og).getByText('?')).toBeInTheDocument();
    expect(og.textContent).not.toMatch(/(^|[^\d,.])0([^\d]|$)/);
    expect(valeurTuile({ valeur: undefined })).toBe('?');
    expect(valeurTuile({ valeur: null })).toBe('?');
    expect(valeurTuile({ valeur: '   ' })).toBe('?');
    expect(valeurTuile({ valeur: '0,0 °C' })).toBe('0,0 °C'); // un vrai zéro lu reste un zéro
  });

  it('« ≈ » : seule une tuile de calcul le garde dans sa valeur ; un relevé le perd', () => {
    expect(valeurTuile({ valeur: '≈ 52 %', calcul: true })).toBe('≈ 52 %');
    expect(valeurTuile({ valeur: '≈ 1,059' })).toBe('1,059');
    render(<BrewBilan tuiles={[
      { id: 'og', nom: 'OG', valeur: '≈ 1,059', quand: 'q', etat: 'ecart' },
      { id: 'rendement', nom: 'Rendement', valeur: '≈ 52 %', quand: 'q', etat: 'ecart', calcul: true }
    ]} faits={1} />);
    expect(tuile('og').querySelector('.bz-bilan-v')!.textContent).toBe('1,059');
    expect(tuile('rendement').querySelector('.bz-bilan-v')!.textContent).toBe('≈ 52 %');
  });

  it('les quatre états de bord : ok, écart, dû, non relevé ; chaque état se dit aussi en texte', () => {
    render(<BrewBilan tuiles={[...E3, E1[0]]} faits={4} fin={h(17, 30)} />);
    expect(tuile('maische')).toHaveAttribute('data-etat', 'ok');
    expect(tuile('maische')).toHaveClass('is-ok');
    expect(tuile('rendement')).toHaveClass('is-ecart');
    expect(tuile('coupure')).toHaveClass('is-du');
    expect(tuile('eau')).toHaveClass('is-manque');
    expect(tuile('maische').textContent).toContain('Dans la cible.');
    expect(tuile('coupure').textContent).toContain('Relevé dû.');
    expect(tuile('eau').textContent).toContain('Non relevé.');
  });

  it('les nombres et les « ? » sont en gras, l’unité en clair', () => {
    render(<BrewBilan tuiles={[E3[1]]} faits={1} />);
    const gras = [...tuile('maische').querySelectorAll('.bz-bilan-v b')].map((b) => b.textContent);
    expect(gras).toEqual(['66,4', '5,35']);
  });

  it('le compteur : 0 et 1 au singulier', () => {
    expect(compteurReleves(0, 9)).toBe('0 relevé sur 9');
    expect(compteurReleves(1, 9)).toBe('1 relevé sur 9');
    expect(compteurReleves(6, 9)).toBe('6 relevés sur 9');
  });
});

describe('BrewBilan · clôture : Pas relevés, Heures tenues, Au journal', () => {
  it('les relevés non pris tiennent dans une tuile « Pas relevés · ? ? ? »', () => {
    const { prises, pasReleves } = separerPasReleves(E4);
    expect(prises.map((t) => t.id)).toEqual(['og', 'ferm', 'preboil', 'rendement', 'maische']);
    expect(pasReleves).toMatchObject({
      nom: 'Pas relevés',
      valeur: '? ? ?',
      cible: 'eau d’empâtage °C · coupure · moût à l’ajout °C',
      quand: 'restent « ? » au journal',
      etat: 'manque'
    });
    render(<BrewBilan mode="reel" tuiles={E4} faits={6} />);
    const pas = tuile('pas-releves');
    expect(pas).toHaveClass('is-manque');
    expect(within(pas).getByText('eau d’empâtage °C · coupure · moût à l’ajout °C')).toBeInTheDocument();
    expect(within(pas).getByText('restent « ? » au journal')).toBeInTheDocument();
    expect(pas.querySelectorAll('.bz-bilan-v b.is-q')).toHaveLength(3);
    expect(document.querySelectorAll('[data-tuile]')).toHaveLength(6);
  });

  it('rien de manquant : pas de tuile « Pas relevés »', () => {
    expect(separerPasReleves(E4.filter((t) => t.etat === 'ok' || t.etat === 'ecart')).pasReleves).toBeNull();
  });

  const heures: HeureTenue[] = [
    { id: 'sacch', nom: 'Saccharification', de: h(13, 5), a: h(14, 5), verdict: '60 min ✓', ton: 'ok' },
    { id: 'ebu', nom: 'Ébullition', de: h(15, 20), a: h(16, 20), verdict: '60 min ✓', ton: 'ok' },
    { id: 'ajouts', nom: 'Ajouts', detail: '4 sur 4', verdict: 'Citra 4 min en retard', ton: 'ecart' },
    { id: 'whirl', nom: 'Whirlpool 80 °C', de: h(16, 25), a: h(16, 45), verdict: '20 min ✓', ton: 'ok' },
    { id: 'ensem', nom: 'Ensemencement', de: h(17, 12), verdict: '✓', ton: 'ok' }
  ];

  it('« Heures tenues » : plages, « 4 sur 4 », ocre pour le retard', () => {
    render(<BrewBilan mode="reel" tuiles={E4} faits={6} heures={heures} />);
    expect(screen.getByText('Heures tenues')).toBeInTheDocument();
    expect(screen.getByText('13 h 05–14 h 05')).toBeInTheDocument();
    expect(screen.getByText('15 h 20–16 h 20')).toBeInTheDocument();
    expect(screen.getByText('16 h 25–16 h 45')).toBeInTheDocument();
    expect(screen.getByText('4 sur 4')).toBeInTheDocument();
    expect(screen.getByText('Citra 4 min en retard')).toHaveClass('is-ecart');
    expect(screen.getByText('17 h 12')).toBeInTheDocument();
    expect(screen.getAllByText('60 min ✓')).toHaveLength(2);
  });

  it('« Heures tenues » : une heure inconnue se lit « ? »', () => {
    render(<BrewHeuresTenues lignes={[{ id: 'x', nom: 'Whirlpool', de: null, verdict: '?' }]} />);
    expect(screen.getByText('Whirlpool').parentElement!.textContent).toBe('Whirlpool??');
  });

  it('« Au journal · tout est daté » avec l’heure de chaque fait ; vide : rien', () => {
    const { container, rerender } = render(<BrewJournalExtrait entrees={[
      { at: h(15, 5), texte: 'avant ébullition hors cible · accepté : OG ≈ 1,057' },
      { at: h(16, 19), texte: 'Citra 25 g ajouté, 4 min en retard' },
      { at: h(17, 12), texte: 'levure, 1 sachet 11,5 g' }
    ]} />);
    expect(screen.getByRole('heading', { name: 'Au journal' })).toBeInTheDocument();
    expect(screen.getByText('tout est daté')).toBeInTheDocument();
    expect(screen.getByText('15 h 05')).toBeInTheDocument();
    expect(screen.getByText(/Citra 25 g ajouté, 4 min en retard/)).toBeInTheDocument();
    rerender(<BrewJournalExtrait entrees={[]} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('BrewBilan · Au jour J et porte « Aide »', () => {
  it('« Au jour J · durée ± · dose · houblon manquant » : chaque porte appelle son éditeur', () => {
    const duree = vi.fn(), dose = vi.fn(), manquant = vi.fn();
    render(<BrewBilan tuiles={E1} faits={0} fin={null} onDuree={duree} onDose={dose} onHoublonManquant={manquant} />);
    const rangee = screen.getByRole('group', { name: 'Au jour J' });
    expect(within(rangee).getByText('Au jour J')).toBeInTheDocument();
    fireEvent.click(within(rangee).getByRole('button', { name: 'durée ±' }));
    fireEvent.click(within(rangee).getByRole('button', { name: 'dose' }));
    fireEvent.click(within(rangee).getByRole('button', { name: 'houblon manquant' }));
    expect(duree).toHaveBeenCalledTimes(1);
    expect(dose).toHaveBeenCalledTimes(1);
    expect(manquant).toHaveBeenCalledTimes(1);
  });

  it('une porte sans éditeur branché n’est pas affichée (pas de bouton mort)', () => {
    render(<BrewBilan tuiles={E1} faits={0} fin={null} onDuree={() => {}} />);
    expect(screen.getByRole('button', { name: 'durée ±' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'dose' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'houblon manquant' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Aide' })).toBeNull();
  });

  it('« Aide » : un toucher ouvre le Compagnon et les aides, un second les referme', () => {
    render(<BrewBilan tuiles={E1} faits={0} fin={null} aide={<button type="button">Compagnon brasseur</button>} />);
    const porte = screen.getByRole('button', { name: 'Aide' });
    expect(porte).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Compagnon brasseur' })).toBeNull();
    fireEvent.click(porte);
    expect(porte).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region', { name: 'Aide du jour J' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Compagnon brasseur' })).toBeInTheDocument();
    fireEvent.click(porte);
    expect(porte).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('button', { name: 'Compagnon brasseur' })).toBeNull();
  });

  it('aucun champ numérique natif', () => {
    render(<BrewBilan tuiles={E1} faits={0} fin={null} onDuree={() => {}} aide={<span>x</span>} />);
    expect(document.querySelector('input[type="number"]')).toBeNull();
  });
});
