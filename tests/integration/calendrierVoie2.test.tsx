import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ajouterJours, etiquetteS, lundiDe, type ChoseCalendrier } from '../../src/domain/calendrier';
import { disposer, type Colonne } from '../../src/ui/calendrier/frise/Rangee';
import { Barre, dureeDansBarre, formesDuree, largeurDuree, montantBarre } from '../../src/ui/calendrier/frise/Barre';
import { Marque, couperNom, largeurTexte } from '../../src/ui/calendrier/frise/Marque';
import { VueListe } from '../../src/ui/calendrier/frise/VueListe';

/**
 * Voie 2 des défauts Calendrier (20.11) : PC-150 (nom tronqué d'une vente liée), PC-151 (la bière pas brassée se dit en retard sur la frise),
 * PC-160 (la Liste dit « pas payé », pas « en retard » sous « En retard »). PC-153, PC-156 et PC-158 restent à une autre voie ; T3B-3 est écarté (mesure dans le harnais) ; PC-156 et PC-158 sont des
 * mesures de mise en page : états V2a à V2d du harnais `scripts/agents/vision-calendrier.mjs` (`--etats v2`).
 */
afterEach(() => cleanup());

const JOUR = '2026-11-16';
const L = lundiDe(JOUR);
const semainesDe = (n: number): Colonne[] => Array.from({ length: n }, (_, i) => ({ debut: ajouterJours(L, i * 7), fin: ajouterJours(L, i * 7 + 6), etiquette: etiquetteS(ajouterJours(L, i * 7)) }));
const rien = () => undefined;
const gestes = { onToucher: rien, onAppuiLong: rien, onGlisse: rien, onLacheGlisse: rien, onBord: rien, onLacheBord: rien, onRefus: rien };

const saison = {
  id: 'brassin-SAISON', rangee: 'brassins', titre: 'Saison de ferme', debut: ajouterJours(L, 4), fin: ajouterJours(L, 32), centimes: -13700,
  pasBrassee: true, brassagePrevu: ajouterJours(L, -6), duree: 'pas brassée · prête le 18 déc.',
  source: { genre: 'batch', id: 'SAISON', statut: 'planifie' }, ouvre: { ecran: 'brassin', id: 'SAISON' }, deplacable: true
} as unknown as ChoseCalendrier;

describe('PC-151 : la bière pas brassée se dit « pas brassée » sur la frise, à 390 comme ailleurs', () => {
  it('formes de durée : « pas brassée » passe avant la date « prête … » seule (la date reste dans la phrase entière, l’aria et le détail)', () => {
    expect(formesDuree('pas brassée · prête le 24 nov.')).toEqual(['pas brassée · prête le 24 nov.', 'pas brassée · prête 24 nov.', 'pas brassée']);
    /* une durée en jours n'est pas touchée */
    expect(formesDuree('J0 / 28 · prête 21 déc.')).toEqual(['J0 / 28 · prête 21 déc.', 'prête 21 déc.', 'J0 / 28']);
  });

  it('la barre étroite (le nom ne laisse que la place d’une forme courte) écrit « pas brassée », jamais « prête 18 déc. » seule', () => {
    const nom = largeurTexte('Saison de ferme', 600) + largeurTexte(montantBarre(saison)!, 700) + 6 + 12;
    const w = Math.ceil(nom + 16 + Math.max(largeurDuree('prête 18 déc.'), largeurDuree('pas brassée')) + 2);
    expect(dureeDansBarre(saison, w, true)).toBe('pas brassée');
    render(<div style={{ position: 'relative' }}><Barre chose={saison} gauche={2} largeur={w} haut={0} hauteur={26} cote="dedans" placeEtiquette={w} largeurColonne={60} bornes={[0, 1]} {...gestes} /></div>);
    const duree = document.querySelector('[data-duree]')!;
    expect(duree.textContent).toBe('pas brassée');
    /* la marque de retard : le mot est en couleur d'alerte, comme « en retard » de la Liste */
    expect(duree.querySelector('.cal-retard-t')?.textContent).toBe('pas brassée');
  });

  it('une facture en retard (Hopfen) a sa marque sur la frise : un point d’alerte et « en retard » au nom lu', () => {
    const hopfen = {
      id: 'facture-hopfen', rangee: 'achats', titre: 'Hopfen · Hallertau Blanc', debut: JOUR, fin: JOUR, centimes: -26000, echeance: ajouterJours(JOUR, -6), enRetard: true,
      source: { genre: 'facture', id: 'F-1' }, ouvre: { ecran: 'piece', id: 'F-1' }, deplacable: { raison: 'Une facture se règle dans Finances.' }
    } as unknown as ChoseCalendrier;
    render(<Marque chose={hopfen} centre={20} haut={0} largeurColonne={60} onToucher={rien} />);
    const m = document.querySelector('[data-marque]')!;
    expect(m.querySelector('[data-point-retard]')).not.toBeNull();
    expect(m.getAttribute('aria-label')).toMatch(/en retard/);
    cleanup();
    render(<Marque chose={{ ...hopfen, echeance: undefined, enRetard: undefined } as unknown as ChoseCalendrier} centre={20} haut={0} largeurColonne={60} onToucher={rien} />);
    expect(document.querySelector('[data-point-retard]')).toBeNull();
  });
});

describe('PC-160 : sous « En retard », la ligne dit ce qui manque (« pas payé », « pas reçu »), pas « en retard » encore', () => {
  const facture = (extra: Record<string, unknown>) => ({
    id: 'facture-hopfen', rangee: 'achats', titre: 'Hopfen · Hallertau Blanc', debut: '2026-11-17', fin: '2026-11-17', centimes: -26000,
    source: { genre: 'facture', id: 'F-1' }, ouvre: { ecran: 'piece', id: 'F-1' }, deplacable: true, echeance: '2026-11-10', enRetard: true, ...extra
  } as unknown as ChoseCalendrier);

  it('une facture à payer : « pas payé » en couleur d’alerte, date d’échéance gardée', () => {
    render(<VueListe choses={[facture({})]} sansDate={[]} aujourdhui="2026-11-17" onChose={() => {}} />);
    const ligne = document.querySelector('[data-liste-chose="facture-hopfen"]')!;
    expect(screen.getByRole('region', { name: 'En retard' })).toContainElement(ligne as HTMLElement);
    expect(ligne.textContent).toMatch(/10 nov\. · S46/);
    expect(ligne.textContent).toMatch(/pas payé/);
    expect(ligne.textContent).not.toMatch(/en retard/);
    expect(ligne.querySelector('.cal-li-retard')?.textContent).toBe('pas payé');
  });

  it('une facture de vente que le client n’a pas réglée : « pas reçu »', () => {
    render(<VueListe choses={[facture({ rangee: 'ventes', centimes: 120000 })]} sansDate={[]} aujourdhui="2026-11-17" onChose={() => {}} />);
    const ligne = document.querySelector('[data-liste-chose="facture-hopfen"]')!;
    expect(ligne.textContent).toMatch(/pas reçu/);
    expect(ligne.textContent).not.toMatch(/en retard/);
  });
});

describe('PC-150 : une vente liée dont le nom n’a pas la place d’un côté garde son nom entier (deux lignes), jamais « 3 fûts L… »', () => {
  const cigogne = {
    id: 'plan-cigogne', rangee: 'ventes', titre: '3 fûts La Cigogne', debut: ajouterJours(L, 5 * 7 + 2), fin: ajouterJours(L, 5 * 7 + 2), centimes: 90000,
    liens: { batchId: 'LOT-BLONDE' }, lie: { texte: 'lié à Blonde d’automne', apercu: 'La Cigogne · client ; Blonde d’automne · prête 21 déc.' },
    source: { genre: 'plan', id: 'P-CIG', origine: 'manual', statut: 'active' }, ouvre: { ecran: 'finances' }, deplacable: true
  } as unknown as ChoseCalendrier;

  it('3 mois à 390 (13 semaines de 27,7 px, 76 px sous le +) : le nom et son montant sur deux lignes, la pastille cède', () => {
    const d = disposer([cigogne], semainesDe(13), 27.7, 366, { reserveDroite: 76, lieCourt: true, vueLarge: true }).items[0];
    expect(d.marque).toBe(true);
    const coupe = couperNom(cigogne.titre, montantBarre(cigogne))!;
    expect(coupe).not.toBeNull();
    expect(d.deuxLignes).toBe('coupe');
    expect(d.sansLie).toBe(true);
    expect(d.place).toBeGreaterThanOrEqual(coupe.largeur);
    expect(`${coupe.l1} ${coupe.l2}`).toBe('3 fûts La Cigogne');
  });

  it('avec la place d’une ligne entière (pastille comprise), rien ne change : une ligne, pastille posée', () => {
    const d = disposer([cigogne], semainesDe(13), 27.7, 900, { reserveDroite: 0, lieCourt: true, vueLarge: true }).items[0];
    expect(d.deuxLignes).not.toBe('coupe');
    expect(d.sansLie).toBeUndefined();
  });

  it('la marque sans pastille garde le lien au lecteur d’écran', () => {
    render(<Marque chose={cigogne} centre={20} haut={0} largeurColonne={60} onToucher={rien} libelle={{ cote: 'gauche', place: 133, deux: 'coupe', sansLie: true }} />);
    expect(document.querySelector('[data-lie]')).toBeNull();
    expect(document.querySelector('[data-marque]')!.getAttribute('aria-label')).toMatch(/lié à Blonde d’automne/);
  });
});
