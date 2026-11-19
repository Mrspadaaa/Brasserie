import React, { useState } from 'react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { EnTeteCalendrier, type EnTeteCalendrierProps, type ModeleEnTete, type VueCalendrier } from '../../src/ui/calendrier/entete/EnTete';
import { fenetreDePeriode, periodeDeFenetre, zonesPoignees, type FenetreSemaines } from '../../src/ui/calendrier/entete/Fenetre';
import type { Periode } from '../../src/components/periode/periode';
import { ajouterJours, francs, semainesDe, type Retard } from '../../src/domain/calendrier';
import { courbeCaisse, courbeDecalee, creuxDepuis, type MouvementCaisse } from '../../src/domain/calendrierCaisse';
import { HAUTEUR_MOIS, boiteEtiquette, boitesSeCroisent, creuxDe, geometrie, maxNoms, obstaclesCourbe, placerNoms } from '../../src/ui/calendrier/entete/Courbe';
import { useOrientation } from '../../src/ui/calendrier/useOrientation';
import { DELAI_CLIC_AVALE } from '../../src/ui/calendrier/usePointeurCourbe';
import { CLASSE_CAISSE, GrandeCourbe, LIGNE_LEGENDE, PLACE_DETAIL, TITRE_GRANDE, hautLegende, placeEtiquetteCreux, geoGrande } from '../../src/ui/calendrier/entete/GrandeCourbe';
import { LectureDetail, formeTete } from '../../src/ui/calendrier/entete/LectureCourbe';
import { BandeSemaines, pasEtiquettes } from '../../src/ui/calendrier/entete/BandeSemaines';
import { anneeEnMois } from '../../src/domain/calendrier';
import { largeurTexte } from '../../src/ui/calendrier/entete/Courbe';
import { Courbe, causesDuCreux, semaineCourte, RECUL_MAX } from '../../src/ui/calendrier/entete/Courbe';

/** La largeur de la fenêtre (jsdom : 1024) : l'invitation à tourner est pour le téléphone tenu droit (< 700 px). */
function largeurFenetre(px: number) { Object.defineProperty(window, 'innerWidth', { value: px, configurable: true, writable: true }); }
afterEach(() => { largeurFenetre(1024); });

/**
 * L'en-tête du calendrier (lot B, E01 à E13). La courbe vient du domaine (`courbeCaisse`) : 52 semaines depuis le lundi 2026-11-16, des mouvements
 * nommés, une mise de côté pour le frigo. Aucune donnée réelle, aucun appel réseau.
 */
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

const LUNDI0 = '2026-11-16';
const jour = (semaine: number) => ajouterJours(LUNDI0, semaine * 7 + 2);
const mouvements: MouvementCaisse[] = [
  { id: 'm0', jour: jour(0), centimes: -14800, nom: 'Malt' },
  { id: 'm4', jour: jour(4), centimes: 91000, nom: 'Marché de Noël' },
  { id: 'm12', jour: jour(12), centimes: -90000, nom: 'Hotte' },
  { id: 'm17', jour: jour(17), centimes: -108000, nom: 'Six fûts inox' },
  { id: 'm21', jour: jour(21), centimes: -280000, nom: 'Embouteilleuse' },
  { id: 'm25', jour: jour(25), centimes: 214000, nom: 'Fête de village' },
  { id: 'm32', jour: jour(32), centimes: 245000, nom: 'Festival' },
  { id: 'm34', jour: jour(34), centimes: -180000, nom: 'Frigo', choseId: 'c-frigo' }
];
const mises = [{ id: 'mc1', titre: 'Frigo', du: ajouterJours(LUNDI0, 5 * 7), au: ajouterJours(LUNDI0, 34 * 7), centimes: 114000 }];
const courbe = courbeCaisse({ depart: 418000, lundi0: LUNDI0, mouvements, mises })!;

const retardFacture: Retard = { id: 'r1', genre: 'facture', titre: 'Loyer du local', detail: 'échéance le 3 nov. · CHF 400', jour: '2026-11-03', ouvre: { ecran: 'piece', id: 'p1' } };
// Une source qui compte des jours : l'en-tête ne doit pas le répéter.
const retardCompteur: Retard = { id: 'r2', genre: 'tache', titre: 'Ranger la réserve', detail: 'en retard de 7 j', jour: '2026-11-09', ouvre: { ecran: 'agenda', id: 't1' } };

const modele = (extra: Partial<ModeleEnTete> = {}): ModeleEnTete => ({
  semaines: semainesDe(LUNDI0, 52),
  courbe,
  creux: creuxDepuis(courbe),
  retards: [retardFacture, retardCompteur],
  sansDate: [],
  icones: [{ id: 'idee-1', lundi: ajouterJours(LUNDI0, 21), numero: 50, genre: 'idee', titre: 'Bière au sapin' }, { id: 'idee-2', lundi: ajouterJours(LUNDI0, 7), numero: 48, genre: 'retard', titre: 'Ranger' }],
  choses: [
    { id: 'c-frigo', rangee: 'travaux', titre: 'Frigo', mouvements: ['m34'], miseDeCote: true },
    { id: 'c-emb', rangee: 'achats', titre: 'Embouteilleuse', mouvements: ['m21'] },
    { id: 'c-fes', rangee: 'fetes', titre: 'Festival', mouvements: ['m32'] },
    { id: 'c-mar', rangee: 'ventes', titre: 'Marché de Noël', mouvements: ['m4'] }
  ] as unknown as ModeleEnTete['choses'],
  hypotheses: [{ id: 'depart', texte: 'Solde de départ 4 180 CHF', source: 'Finances', ouvre: { ecran: 'solde' } }],
  ...extra
});

type Espions = { onFenetre: ReturnType<typeof vi.fn>; onPeriode: ReturnType<typeof vi.fn>; onVue: ReturnType<typeof vi.fn> };
/** Un banc qui garde l'état comme le fera CalendrierTab : fenêtre, période, vue, ±. Les espions voient chaque appel. */
function Banc(p: Partial<EnTeteCalendrierProps> & Espions & { vueInitiale?: VueCalendrier; periodeInitiale?: Periode }) {
  const { onFenetre, onPeriode, onVue, vueInitiale = 'semaines', periodeInitiale, ...reste } = p;
  const [fen, setFen] = useState<FenetreSemaines>({ du: LUNDI0, semaines: 6 });
  const [per, setPer] = useState<Periode>(periodeInitiale ?? periodeDeFenetre({ du: LUNDI0, semaines: 6 }));
  const [vue, setVue] = useState<VueCalendrier>(vueInitiale);
  const [mv, setMv] = useState(false);
  return (
    <EnTeteCalendrier modele={modele()} fenetre={fen} onFenetre={f => { onFenetre(f); setFen(f); }} periode={per} onPeriode={x => { onPeriode(x); setPer(x); }}
      vue={vue} onVue={(v, a) => { if (a === undefined) onVue(v); else onVue(v, a); setVue(v); }} mouvements={mv} onMouvements={setMv} orientation="portrait" largeurColonne={65} {...reste} />
  );
}
const espions = (): Espions => ({ onFenetre: vi.fn(), onPeriode: vi.fn(), onVue: vi.fn() });
const bande = (c: HTMLElement) => c.querySelector('[data-bande-semaines]') as HTMLElement;

describe('E04, E05 : la bande des semaines et le bouton ±', () => {
  it('B2 : au repos, la bande ne contient que des « S\\d+ » ; après ±, les montants et les icônes y sont ; après un deuxième ±, ils n’y sont plus', () => {
    const { container } = render(<Banc {...espions()} />);
    expect(bande(container).textContent).toMatch(/^(S\d+)+$/);
    expect(bande(container).querySelector('svg')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '±' }));
    expect(bande(container).textContent).toMatch(/[+−]\d/);
    expect(bande(container).textContent).toContain('+910');
    expect(bande(container).textContent).toContain('−148');
    expect(bande(container).querySelector('svg')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '±' }));
    expect(bande(container).textContent).toMatch(/^(S\d+)+$/);
    expect(bande(container).querySelector('svg')).toBeNull();
  });

  it('i3 : un toucher sur une semaine donne sa date', () => {
    const { container } = render(<Banc {...espions()} />);
    fireEvent.click(within(bande(container)).getByText('S48'));
    expect(screen.getByText('S48, 23 – 29 nov.')).toBeInTheDocument();
    // La date est hors de la bande : au repos la bande reste « S\d+ » seul.
    expect(bande(container).textContent).toMatch(/^(S\d+)+$/);
  });

  it('E36 : un appui long de 500 ms sur une semaine note une idée à son lundi, sans donner la date', () => {
    vi.useFakeTimers();
    const onIdeeSemaine = vi.fn();
    const { container } = render(<Banc {...espions()} onIdeeSemaine={onIdeeSemaine} />);
    const s49 = within(bande(container)).getByText('S49').closest('button') as HTMLElement;
    fireEvent.pointerDown(s49, { pointerId: 1, clientX: 10, clientY: 10, button: 0 });
    act(() => { vi.advanceTimersByTime(500); });
    expect(onIdeeSemaine).toHaveBeenCalledWith('2026-11-30');
    fireEvent.pointerUp(s49, { pointerId: 1 });
    fireEvent.click(s49);
    expect(screen.queryByText(/^S49, /)).toBeNull();
  });
});

describe('E02 : la courbe', () => {
  it('B3 : un point par semaine, les noms des mouvements avec leur montant', () => {
    const { container } = render(<Banc {...espions()} />);
    expect(container.querySelectorAll('[data-point-semaine]')).toHaveLength(52);
    const svg = screen.getByRole('img', { name: /Libre et caisse sur 52 semaines/ });
    // CRITIQUE-3 n° 17 : chaque nom sur sa marche, jamais sur le tracé ; celui qui ne tient pas est omis (Embouteilleuse, ici, se lit au doigt).
    const noms = Array.from(container.querySelectorAll('[data-nom-courbe]')).map(t => t.textContent);
    expect(noms.length).toBeGreaterThanOrEqual(3);
    for (const n of noms) expect(n).toMatch(/^.+ [+−][\d ]+$/);
    expect(svg.textContent).toContain('Festival +2 450');
    // La mise de côté se voit : zone hachurée entre la caisse et le libre.
    expect(container.querySelector('.ent-miscote')).not.toBeNull();
    // Les mois sont sous la courbe (dans le SVG, sous le tracé), une courbe d'au moins 80 px de haut.
    expect(container.querySelectorAll('.ent-mois').length).toBeGreaterThan(2);
    expect(Number(container.querySelector('.ent-svg')!.getAttribute('height'))).toBeGreaterThanOrEqual(80);
  });

  it('B3 : sans solde de départ, la phrase et le lien vers Finances ; aucun SVG de courbe', () => {
    const onOuvrirFinances = vi.fn();
    const sans = render(<EnTeteCalendrier modele={modele({ courbe: null, creux: null, icones: [] })} fenetre={{ du: LUNDI0, semaines: 6 }} onFenetre={vi.fn()}
      periode={periodeDeFenetre({ du: LUNDI0, semaines: 6 })} onPeriode={vi.fn()} vue="semaines" onVue={vi.fn()} mouvements={false} onMouvements={vi.fn()}
      orientation="portrait" largeurColonne={65} onOuvrirFinances={onOuvrirFinances} />);
    expect(screen.getByText(/Solde de départ inconnu/)).toBeInTheDocument();
    expect(sans.container.querySelector('.ent-svg')).toBeNull();
    expect(screen.queryByRole('img', { name: /Libre et caisse/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /à dépenser/ })).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: /Finances/ }));
    expect(onOuvrirFinances).toHaveBeenCalledTimes(1);
    // Les semaines restent lisibles : la bande dit toujours S47…
    expect(bande(sans.container).textContent).toMatch(/^(S\d+)+$/);
  });

  it('E02 f1-a : pendant un geste de la frise, la courbe se zoome sur les colonnes visibles (avant, après)', () => {
    const apercu = courbeDecalee(courbe, 'c-frigo', 14);
    const { container } = render(<Banc {...espions()} apercu={apercu} />);
    expect(screen.getByRole('img', { name: /La courbe zoomée/ })).toBeInTheDocument();
    expect(container.querySelector('.ent-avant')).not.toBeNull();
    expect(container.querySelector('.ent-apres')).not.toBeNull();
  });
});

describe('E01 : le chiffre clé et le creux', () => {
  it('dit « à dépenser sans passer sous 0 » avec la semaine du creux, et déplie ses causes avec le lien vers Finances', () => {
    const onOuvrirFinances = vi.fn();
    render(<Banc {...espions()} onOuvrirFinances={onOuvrirFinances} />);
    const creux = creuxDepuis(courbe)!;
    // Le creux tombe en 2027, vu de S47 2026 : sa semaine porte son année (CRITIQUE-5 n° 2).
    const cle = screen.getByRole('button', { name: new RegExp(`CHF à dépenser sans passer sous 0 \\(S${creux.numero} ’27\\)`) });
    fireEvent.click(cle);
    const carte = screen.getByLabelText(`Le creux de S${creux.numero} ’27 : ses causes`);
    expect(within(carte).getByText('Embouteilleuse')).toBeInTheDocument();
    expect(carte.textContent).toContain('Mis de côté');
    expect(carte.textContent).toContain('Solde de départ 4 180 CHF · source : Finances');
    fireEvent.click(within(carte).getByRole('link', { name: 'Solde et réglages ›' }));
    expect(onOuvrirFinances).toHaveBeenCalledTimes(1);
  });
});

describe('E07 : la période, la même que celle de l’app (ET-PER)', () => {
  it('B4 : « 3 mois » écrit la période du lundi au dimanche de la 13e semaine', () => {
    const e = espions();
    render(<Banc {...e} />);
    fireEvent.click(screen.getByRole('button', { name: /6 sem/ }));
    fireEvent.click(screen.getByRole('button', { name: '3 mois' }));
    expect(e.onPeriode).toHaveBeenCalledWith({ genre: 'dates', du: LUNDI0, au: '2027-02-14' });
    expect(e.onFenetre).toHaveBeenCalledWith({ du: LUNDI0, semaines: 13 });
    expect(screen.getByRole('button', { name: /3 mois/ })).toBeInTheDocument();
  });

  it('B4 : une période reçue de Finances règle la fenêtre, et la fenêtre réglée est la période', () => {
    const e = espions();
    render(<Banc {...e} periodeInitiale={{ genre: 'dates', du: '2026-12-07', au: '2027-01-31' }} />);
    expect(e.onFenetre).toHaveBeenCalledWith({ du: '2026-12-07', semaines: 8 });
    expect(screen.getByRole('button', { name: /8 sem/ })).toBeInTheDocument();
    expect(bande(document.body).textContent).toMatch(/^(S\d+){8}$/);
    // Dans l'autre sens : « 6 mois » depuis cette fenêtre.
    fireEvent.click(screen.getByRole('button', { name: /8 sem/ }));
    fireEvent.click(screen.getByRole('button', { name: '6 mois' }));
    expect(e.onPeriode).toHaveBeenLastCalledWith({ genre: 'dates', du: '2026-12-07', au: ajouterJours('2026-12-07', 26 * 7 - 1) });
  });

  it('B10 : avec 3 choses sans date, « Sans date · 3 » ouvre la liste sur la poche ; « Trier » et « Filtrer » appellent leurs rappels', () => {
    const e = espions();
    const onTrier = vi.fn(), onFiltrer = vi.fn();
    const sansDate = [{ id: 'a' }, { id: 'b' }, { id: 'c' }] as unknown as ModeleEnTete['sansDate'];
    render(<EnTeteCalendrier modele={modele({ sansDate })} fenetre={{ du: LUNDI0, semaines: 6 }} onFenetre={e.onFenetre} periode={periodeDeFenetre({ du: LUNDI0, semaines: 6 })}
      onPeriode={e.onPeriode} vue="semaines" onVue={e.onVue} mouvements={false} onMouvements={vi.fn()} orientation="portrait" largeurColonne={65} onTrier={onTrier} onFiltrer={onFiltrer} />);
    fireEvent.click(screen.getByRole('button', { name: /6 sem/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Sans date · 3' }));
    expect(e.onVue).toHaveBeenCalledWith('liste', 'sans-date');
    fireEvent.click(screen.getByRole('button', { name: /6 sem/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Trier les rangées' }));
    expect(onTrier).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /6 sem/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Filtrer par type' }));
    expect(onFiltrer).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: /6 sem/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Liste' }));
    expect(e.onVue).toHaveBeenLastCalledWith('liste');
  });

  it('B10 : sans chose sans date, aucune ligne « Sans date » dans le menu, jamais « Sans date · 0 »', () => {
    render(<Banc {...espions()} />);
    fireEvent.click(screen.getByRole('button', { name: /6 sem/ }));
    const menu = screen.getByRole('dialog', { name: 'Période et vue' });
    expect(menu.textContent).not.toMatch(/Sans date/);
    expect(menu.textContent).toContain('Trier les rangées');
    expect(menu.textContent).toContain('Filtrer par type');
  });
});

describe('E06, E13 : la fenêtre et l’année', () => {
  const poignee = () => screen.getByRole('button', { name: /Poignée de fin/ });

  it('B5 : la poignée tirée au-delà de 80 % donne l’année', () => {
    const e = espions();
    render(<Banc {...e} />);
    fireEvent.pointerDown(poignee(), { pointerId: 1, clientX: 45, button: 0 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 345 });
    // L'étiquette suit le doigt : la fenêtre grandit pendant le geste.
    // Une semaine de l'année suivante porte son année (CRITIQUE-3 n° 24) : « S47 – S40 2027 ».
    expect(screen.getByLabelText(/^Fenêtre : S47 – S\d+ 2027$/).getAttribute('aria-label')).not.toBe('Fenêtre : S47 – S52');
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 345 });
    expect(e.onVue).toHaveBeenCalledWith('annee');
  });

  it('CAL-PERIODE-LIBRE (18.11, « Je peux pas choisir une période donnée ») : lâchée avant 80 %, la fin posée au doigt devient la période ; plus courte aussi', () => {
    const e = espions();
    render(<Banc {...e} />);
    /* 390 px pour 52 semaines : 7,5 px la semaine ; la fin (S52, x 45) posée à x 150 : 20 semaines, S47 – S13 2027 (2026 a 53 semaines ISO) */
    fireEvent.pointerDown(poignee(), { pointerId: 1, clientX: 45, button: 0 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 150 });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 150 });
    expect(e.onVue).not.toHaveBeenCalled();
    expect(e.onFenetre).toHaveBeenLastCalledWith({ du: LUNDI0, semaines: 20 });
    expect(e.onPeriode).toHaveBeenLastCalledWith({ genre: 'dates', du: LUNDI0, au: ajouterJours(LUNDI0, 20 * 7 - 1) });
    /* l'étiquette de la fenêtre dit la même période que la frise (ses colonnes : `onFenetre`) */
    expect(document.querySelector('.ent-cadre')?.getAttribute('aria-label')).toBe('Fenêtre : S47 – S13 2027');
    expect(screen.queryByText('Tire jusqu’au bout : l’année')).toBeNull();
    /* plus courte : la fin ramenée à 3 semaines. Sans mesure (jsdom), la courbe vaut 65 px × 20 colonnes = 1 300 px, 25 px la semaine :
       la fin (500 px) ramenée de 425 px tombe sur 75 px, 3 semaines */
    fireEvent.pointerDown(poignee(), { pointerId: 2, clientX: 500, button: 0 });
    fireEvent.pointerMove(window, { pointerId: 2, clientX: 75 });
    fireEvent.pointerUp(window, { pointerId: 2, clientX: 75 });
    expect(e.onFenetre).toHaveBeenLastCalledWith({ du: LUNDI0, semaines: 3 });
    expect(screen.getByLabelText('Fenêtre : S47 – S49')).toBeInTheDocument();
  });

  it('E13 : dans l’année, la bande passe en 12 mois, le mois du creux est cerclé avec son montant, et la poignée ramène à la fenêtre d’avant', () => {
    const e = espions();
    const { container } = render(<Banc {...e} vueInitiale="annee" />);
    const an = container.querySelector('[data-bande-annee]') as HTMLElement;
    expect(an.querySelectorAll('.ent-an-m')).toHaveLength(13);
    const cerclé = an.querySelector('.ent-an-creux') as HTMLElement;
    expect(cerclé.querySelector('.ent-an-v')!.textContent).toBe(francs(creuxDepuis(courbe)!.centimes));
    expect(container.querySelector('[data-bande-semaines]')).toBeNull();
    const [, fin] = screen.getAllByRole('button', { name: /Revenir à la fenêtre d’avant/ });
    fireEvent.pointerDown(fin, { pointerId: 1, clientX: 390, button: 0 });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 390 });
    expect(e.onVue).toHaveBeenLastCalledWith('semaines');
    expect(e.onFenetre).toHaveBeenLastCalledWith({ du: LUNDI0, semaines: 6 });
  });

  it('la poignée de début glisse la fenêtre, et la période suit', () => {
    const e = espions();
    render(<Banc {...e} />);
    const debut = screen.getByRole('button', { name: /Poignée de début/ });
    fireEvent.pointerDown(debut, { pointerId: 2, clientX: 0, button: 0 });
    // 52 semaines sur 390 px : 7,5 px la semaine ; 30 px = 4 semaines.
    fireEvent.pointerMove(window, { pointerId: 2, clientX: 30 });
    fireEvent.pointerUp(window, { pointerId: 2, clientX: 30 });
    expect(e.onFenetre).toHaveBeenCalledWith({ du: ajouterJours(LUNDI0, 28), semaines: 6 });
    expect(e.onPeriode).toHaveBeenCalledWith({ genre: 'dates', du: ajouterJours(LUNDI0, 28), au: ajouterJours(LUNDI0, 28 + 41) });
  });
});

describe('E08 : « Maintenant : 2 en retard »', () => {
  it('B6 : le détail dit des dates, jamais « depuis N j » ni « de N j »', () => {
    render(<Banc {...espions()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Maintenant : 2 en retard' }));
    const feuille = screen.getByRole('dialog');
    expect(feuille.textContent).toContain('Loyer du local');
    expect(feuille.textContent).toContain('3 nov.');
    expect(feuille.textContent).toContain('9 nov.');
    expect(feuille.textContent).not.toMatch(/depuis \d+ ?j/);
    expect(feuille.textContent).not.toMatch(/de \d+ ?j/);
  });

  it('sans retard, aucune pastille (jamais « 0 en retard »)', () => {
    render(<EnTeteCalendrier modele={modele({ retards: [] })} fenetre={{ du: LUNDI0, semaines: 6 }} onFenetre={vi.fn()} periode={periodeDeFenetre({ du: LUNDI0, semaines: 6 })}
      onPeriode={vi.fn()} vue="semaines" onVue={vi.fn()} mouvements={false} onMouvements={vi.fn()} orientation="portrait" largeurColonne={65} />);
    expect(screen.queryByRole('button', { name: /en retard/ })).toBeNull();
  });
});

describe('E11, E12 : lire la courbe au doigt, et la courbe en grand', () => {
  beforeEach(() => { vi.useFakeTimers(); });

  it('B7 : glisser la lit semaine par semaine ; un toucher ailleurs ramène l’état d’avant', () => {
    const onLectureSemaine = vi.fn();
    const { container } = render(<Banc {...espions()} onLectureSemaine={onLectureSemaine} />);
    const svg = screen.getByRole('img', { name: /Libre et caisse sur 52 semaines/ });
    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 100, clientY: 20, button: 0 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 160, clientY: 22 });
    // 160 px sur 390 : la 22e semaine (index 21), le lundi 12 avril 2027, S15.
    // CRITIQUE-7 n° 5 : la forme la plus longue qui tient (as/cal.html) ; jsdom ne mesure rien : la longue, « CHF » et la date comprises.
    expect(container.querySelector('.ent-lit')!.textContent).toContain('S15 · 12 avr.');
    expect(container.querySelector('.ent-lit')!.textContent).toContain('CHF ·');
    expect(container.querySelector('.ent-lit')!.getAttribute('data-forme')).toBe('longue');
    expect(screen.queryByRole('button', { name: /à dépenser/ })).toBeNull();
    expect(onLectureSemaine).toHaveBeenLastCalledWith(ajouterJours(LUNDI0, 21 * 7));
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 160 });
    // Sous la bande, le détail : « la semaine » et son total.
    expect(container.querySelector('.ent-lu')!.textContent).toContain('la semaine');
    fireEvent.pointerDown(document.body);
    expect(container.querySelector('.ent-lit')).toBeNull();
    expect(container.querySelector('.ent-lu')).toBeNull();
    expect(screen.getByRole('button', { name: /à dépenser/ })).toBeInTheDocument();
    expect(onLectureSemaine).toHaveBeenLastCalledWith(null);
  });

  it('B7 : un appui long de 500 ms ouvre la vue graph ; × ramène la vue d’avant', () => {
    const e = espions();
    const { container } = render(<Banc {...e} />);
    const svg = screen.getByRole('img', { name: /Libre et caisse sur 52 semaines/ });
    fireEvent.pointerDown(svg, { pointerId: 1, clientX: 100, clientY: 20, button: 0 });
    act(() => { vi.advanceTimersByTime(499); });
    expect(e.onVue).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(e.onVue).toHaveBeenCalledWith('graph');
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 100 });
    // Le clic fabriqué au relâcher est avalé 400 ms (CRITIQUE-4 n° 3) ; le × se touche après.
    act(() => { vi.advanceTimersByTime(DELAI_CLIC_AVALE); });
    // La grande courbe a pris la place : la courbe en grand, sa légende une fois, le creux marqué, aucune bande.
    const grande = screen.getByLabelText('La courbe en grand');
    expect(grande.querySelector('.ent-creux-pt')).not.toBeNull();
    expect(container.querySelectorAll('.ent-leg')).toHaveLength(1);
    // Chaque segment a la couleur de la rangée de son plus gros mouvement (Embouteilleuse : Achats ; Festival : Fêtes ; Frigo : Travaux).
    expect(grande.querySelector('.ent-sgm.ent-c-achat')).not.toBeNull();
    expect(grande.querySelector('.ent-sgm.ent-c-fete')).not.toBeNull();
    expect(grande.querySelector('.ent-sgm.ent-c-travaux')).not.toBeNull();
    // La légende, une fois : la caisse (CRITIQUE-5 n° 16), puis les quatre rangées présentes, chacune un seul mot.
    const legende = container.querySelector('.ent-leg')!;
    expect(Array.from(legende.querySelectorAll('li')).map(li => li.textContent).sort()).toEqual(['Achats', 'Fêtes', 'Travaux', 'Ventes', 'caisse', 'sans mouvement']);
    expect(container.querySelector('[data-bande-semaines]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Revenir à la frise' }));
    expect(e.onVue).toHaveBeenLastCalledWith('semaines');
    expect(screen.queryByLabelText('La courbe en grand')).toBeNull();
  });

  it('E12 : dans la grande courbe, le doigt continue de lire la semaine sous lui', () => {
    const { container } = render(<Banc {...espions()} vueInitiale="graph" />);
    const grande = container.querySelector('.ent-gc-w') as HTMLElement;
    fireEvent.pointerDown(grande, { pointerId: 3, clientX: 200, clientY: 100, button: 0 });
    expect(container.querySelector('.ent-gc-d')).not.toBeNull();
    expect(container.querySelector('.ent-curseur')).not.toBeNull();
    fireEvent.pointerMove(window, { pointerId: 3, clientX: 300, clientY: 102 });
    expect(container.querySelector('.ent-gc-d')!.textContent).toMatch(/S\d+, /);
    fireEvent.pointerUp(window, { pointerId: 3, clientX: 300 });
  });
});

describe('E09, E10 : plein écran et paysage', () => {
  it('B8 : le plein écran demande requestFullscreen puis le verrou ; si le verrou échoue, « Tourne le téléphone »', async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    const lock = vi.fn().mockRejectedValue(new Error('NotSupportedError'));
    Object.defineProperty(document.documentElement, 'requestFullscreen', { value: requestFullscreen, configurable: true });
    Object.defineProperty(window.screen, 'orientation', { value: { lock }, configurable: true });
    largeurFenetre(390);
    render(<Banc {...espions()} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Plein écran' })); });
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    expect(lock).toHaveBeenCalledWith('landscape');
    expect(requestFullscreen.mock.invocationCallOrder[0]).toBeLessThan(lock.mock.invocationCallOrder[0]);
    expect(screen.getByText('Tourne le téléphone : 13 semaines')).toBeInTheDocument();
    delete (document.documentElement as unknown as Record<string, unknown>).requestFullscreen;
    delete (window.screen as unknown as Record<string, unknown>).orientation;
  });

  it('B8 : quand le verrou prend et que l’écran tourne, aucune invitation', async () => {
    Object.defineProperty(document.documentElement, 'requestFullscreen', { value: vi.fn().mockResolvedValue(undefined), configurable: true });
    Object.defineProperty(window.screen, 'orientation', { value: { lock: vi.fn().mockResolvedValue(undefined) }, configurable: true });
    const avant = window.matchMedia;
    // L'écran a tourné : la page est couchée et basse (la requête du paysage du calendrier), le verrou a pris.
    window.matchMedia = ((q: string) => ({ matches: q.includes('orientation: landscape'), media: q, addEventListener: () => undefined, removeEventListener: () => undefined, addListener: () => undefined, removeListener: () => undefined })) as unknown as typeof window.matchMedia;
    largeurFenetre(390);
    render(<Banc {...espions()} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Plein écran' })); await new Promise(r => setTimeout(r, 20)); });
    expect(screen.queryByText(/Tourne le téléphone/)).toBeNull();
    window.matchMedia = avant;
    delete (document.documentElement as unknown as Record<string, unknown>).requestFullscreen;
    delete (window.screen as unknown as Record<string, unknown>).orientation;
  });

  it('CRITIQUE-4 n° 19, CRITIQUE-7 (doute E09) : le verrou « pris » sans que l’écran tourne en 1 s (émulateur) : « Tourne le téléphone », par onMessage', async () => {
    vi.useFakeTimers();
    const onMessage = vi.fn();
    Object.defineProperty(document.documentElement, 'requestFullscreen', { value: vi.fn().mockResolvedValue(undefined), configurable: true });
    Object.defineProperty(window.screen, 'orientation', { value: { lock: vi.fn().mockResolvedValue(undefined) }, configurable: true });
    largeurFenetre(390);
    render(<Banc {...espions()} onMessage={onMessage} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Plein écran' })); await vi.advanceTimersByTimeAsync(999); });
    expect(onMessage).not.toHaveBeenCalled();
    await act(async () => { await vi.advanceTimersByTimeAsync(2); });
    expect(onMessage).toHaveBeenCalledWith({ genre: 'invite', texte: 'Tourne le téléphone : 13 semaines' });
    delete (document.documentElement as unknown as Record<string, unknown>).requestFullscreen;
    delete (window.screen as unknown as Record<string, unknown>).orientation;
  });

  it('CRITIQUE-4 n° 19 : orientation.lock absent (iPhone) : l’invitation ; à 1280, rien à tourner, aucune invitation', async () => {
    const onMessage = vi.fn();
    Object.defineProperty(document.documentElement, 'requestFullscreen', { value: vi.fn().mockResolvedValue(undefined), configurable: true });
    largeurFenetre(390);
    const { unmount } = render(<Banc {...espions()} onMessage={onMessage} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Plein écran' })); });
    await vi.waitFor(() => expect(onMessage).toHaveBeenCalledWith({ genre: 'invite', texte: 'Tourne le téléphone : 13 semaines' }));
    unmount();
    onMessage.mockClear();
    largeurFenetre(1280);
    render(<Banc {...espions()} onMessage={onMessage} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Plein écran' })); await new Promise(r => setTimeout(r, 20)); });
    expect(onMessage).not.toHaveBeenCalled();
    delete (document.documentElement as unknown as Record<string, unknown>).requestFullscreen;
  });

  it('E10 : en paysage, 13 semaines, sans écrire la période ; au retour, la fenêtre d’avant', () => {
    const e = espions();
    const props = { modele: modele(), fenetre: { du: LUNDI0, semaines: 6 }, onFenetre: e.onFenetre, periode: periodeDeFenetre({ du: LUNDI0, semaines: 6 }), onPeriode: e.onPeriode, vue: 'semaines' as const,
      onVue: e.onVue, mouvements: false, onMouvements: vi.fn(), largeurColonne: 65 };
    const { rerender, container } = render(<EnTeteCalendrier {...props} orientation="portrait" />);
    expect(e.onFenetre).not.toHaveBeenCalled();
    rerender(<EnTeteCalendrier {...props} orientation="paysage" />);
    expect(e.onFenetre).toHaveBeenLastCalledWith({ du: LUNDI0, semaines: 13 });
    expect(container.querySelector('.ent--paysage')).not.toBeNull();
    expect(e.onPeriode).not.toHaveBeenCalled();
    rerender(<EnTeteCalendrier {...props} orientation="portrait" />);
    expect(e.onFenetre).toHaveBeenLastCalledWith({ du: LUNDI0, semaines: 6 });
  });
});

describe('CRITIQUE-2 n° 7, 8, 10 : la tête lisible, les noms comme z2s', () => {
  // Les 8 mouvements de z2s, à leurs semaines (S13 Hotte … S35 Frigo), et le frigo mis de côté de S6 à S35.
  const z2s: MouvementCaisse[] = [
    { id: 'z13', jour: '2027-03-31', centimes: -90000, nom: 'Hotte' },
    { id: 'z16', jour: '2027-04-21', centimes: 91000, nom: 'Marché de printemps' },
    { id: 'z18', jour: '2027-05-05', centimes: -108000, nom: 'Six fûts inox' },
    { id: 'z22', jour: '2027-06-02', centimes: -280000, nom: 'Embouteilleuse' },
    { id: 'z26', jour: '2027-06-30', centimes: 214000, nom: 'Fête de village' },
    { id: 'z31', jour: '2027-08-04', centimes: 110000, nom: 'Mariage' },
    { id: 'z33', jour: '2027-08-18', centimes: 245000, nom: 'Festival' },
    { id: 'z35', jour: '2027-09-01', centimes: -180000, nom: 'Frigo', choseId: 'c-frigo' }
  ];
  const frigo = [{ id: 'c-frigo', titre: 'Frigo', du: '2027-02-08', au: '2027-08-30', centimes: 180000 }];
  const cz = courbeCaisse({ depart: 420000, lundi0: LUNDI0, mouvements: z2s, mises: frigo })!;
  const g = geometrie(cz.semaines.flatMap(s => [s.libre, s.caisse]), 52, 390, 110, 4, 110 - HAUTEUR_MOIS);
  // La boîte du chiffre clé (sa ligne, au-dessus du tracé) et le cadre de la fenêtre S47 – S52 avec son étiquette.
  const cleBoite = { l: 12, r: 230, t: -28, b: 0 };
  const cadre = { index: 0, nombre: 6, etiquette: 'S47 – S52' };
  const etiquetteBoite = boiteEtiquette(cadre.etiquette, 0, g.x(6), g.bas);

  // CRITIQUE-3 n° 17 : sans trait de rappel et sans jamais toucher le tracé, 4 des 8 noms de z2s tiennent à 390 (largeurs estimées hors
  // navigateur) ; les autres se lisent au doigt (c2-b). Avant, 6 tenaient, mais empilés en liste et reliés par des traits qui barraient la courbe.
  it('placerNoms à 390 sur les 8 mouvements de z2s : au moins 4 noms, une ligne chacun, aucune boîte croisée, ni avec le chiffre clé ni avec l’étiquette de la fenêtre', () => {
    const noms = placerNoms(cz.semaines, g, maxNoms(390), [cleBoite, ...obstaclesCourbe(g, cadre, creuxDe(cz.semaines))]);
    const mouvementsNommes = noms.filter(e => e.genre === 'mouvement');
    expect(mouvementsNommes.length).toBeGreaterThanOrEqual(4);
    for (const e of mouvementsNommes) expect(e.montant).toMatch(/^[+−]\d/);
    for (let a = 0; a < noms.length; a++) {
      // Une ligne : 16 px de haut au plus, dans le tracé.
      expect(noms[a].boite.b - noms[a].boite.t).toBeLessThanOrEqual(16);
      expect(noms[a].boite.l).toBeGreaterThanOrEqual(0);
      expect(noms[a].boite.r).toBeLessThanOrEqual(390);
      expect(boitesSeCroisent(noms[a].boite, cleBoite)).toBe(false);
      expect(boitesSeCroisent(noms[a].boite, etiquetteBoite)).toBe(false);
      for (let b = a + 1; b < noms.length; b++) expect(boitesSeCroisent(noms[a].boite, noms[b].boite)).toBe(false);
    }
  });

  it('un récurrent présent 4 fois (« Loyer du local −400 ») n’est nommé qu’une fois, à sa première semaine', () => {
    const loyers: MouvementCaisse[] = [3, 7, 11, 16].map(k => ({ id: `l${k}`, jour: jour(k), centimes: -40000, nom: 'Loyer du local' }));
    const c = courbeCaisse({ depart: 418000, lundi0: LUNDI0, mouvements: [...mouvements, ...loyers] })!;
    const gg = geometrie(c.semaines.flatMap(s => [s.libre, s.caisse]), 52, 1280, 110, 4, 110 - HAUTEUR_MOIS);
    const noms = placerNoms(c.semaines, gg, maxNoms(1280));
    const loyer = noms.filter(e => e.nom === 'Loyer du local');
    expect(loyer).toHaveLength(1);
    expect(loyer[0].i).toBe(3);
    expect(loyer[0].semaines).toHaveLength(4);
    // Rendu, fenêtre posée après les loyers (S1 – S6) : le SVG ne l'écrit qu'une fois, et son titre dit les 4 fois.
    const { container } = render(<Banc {...espions()} modele={modele({ courbe: c, creux: creuxDepuis(c) })} largeurColonne={1280 / 6}
      periodeInitiale={periodeDeFenetre({ du: ajouterJours(LUNDI0, 7 * 7), semaines: 6 })} />);
    const ecrits = Array.from(container.querySelectorAll('[data-nom-courbe]')).filter(t => /^Loyer du local/.test(t.textContent ?? ''));
    expect(ecrits).toHaveLength(1);
    expect(ecrits[0].textContent).toBe('Loyer du local −400');
    expect(ecrits[0].parentElement!.querySelector('title')!.textContent).toBe('Loyer du local −400, 4 fois, dès S50');
  });

  it('le chiffre clé est un seul élément de ligne : « −2 308 CHF à dépenser · S43 », sans deuxième ligne', async () => {
    const { container } = render(<Banc {...espions()} />);
    const creux = creuxDepuis(courbe)!;
    const cle = container.querySelector('[data-ent-cle]') as HTMLElement;
    expect(cle.children).toHaveLength(3);
    expect(cle.textContent).toBe(`${francs(creux.centimes)}CHF à dépenser· S${creux.numero} ’27`);
    expect(cle.querySelector('.ent-k-s')).toBeNull();
    const fs = await import('node:fs');
    const chemin = await import('node:path');
    const css = fs.readFileSync(chemin.resolve(process.cwd(), 'src/ui/calendrier/entete/entete.css'), 'utf8');
    const regle = css.match(/\n\.ent-k \{([^}]*)\}/)![1];
    expect(regle).toContain('flex-wrap: nowrap');
    expect(regle).toContain('white-space: nowrap');
    expect(regle).toContain('height: 28px');
  });

  it('les noms rendus à 390 : au moins 4 avec la mise de côté, chacun sur une ligne (aucun tspan qui passe à la ligne)', () => {
    const { container } = render(<Banc {...espions()} modele={modele({ courbe: cz, creux: creuxDepuis(cz) })} />);
    const noms = container.querySelectorAll('[data-nom-courbe]');
    // Paquet G n° 1 (CAL-PLACE-GACHEE) : la courbe portrait passe de 110 à 88 px (tracé de 68 px) ; à 390 (largeurs estimées hors navigateur), « Hotte » ne tient plus
    // à côté de la mise de côté : 3 au moins, lus au doigt pour les autres (c2-b). Avant : 4.
    expect(noms.length + container.querySelectorAll('[data-mise-de-cote="etiquette"]').length).toBeGreaterThanOrEqual(3);
    noms.forEach(n => n.querySelectorAll('tspan').forEach(t => { expect(t.getAttribute('dy')).toBeNull(); expect(t.getAttribute('x')).toBeNull(); }));
  });
});

describe('CRITIQUE-2 n° 6 et 36 : la mise de côté sur la courbe', () => {
  it('une courbe avec une mise de côté rend [data-mise-de-cote] et le texte « mis de côté »', () => {
    const { container } = render(<Banc {...espions()} />);
    expect(container.querySelector('[data-mise-de-cote]')).not.toBeNull();
    const etiquette = container.querySelector('[data-mise-de-cote="etiquette"]') as Element;
    expect(etiquette).not.toBeNull();
    expect(etiquette.textContent).toMatch(/^[\d ]+ mis de côté( pour Frigo)?/);
  });

  it('sans mise de côté, ni hachures ni étiquette', () => {
    const c = courbeCaisse({ depart: 418000, lundi0: LUNDI0, mouvements })!;
    const { container } = render(<Banc {...espions()} modele={modele({ courbe: c, creux: creuxDepuis(c) })} />);
    expect(container.querySelector('[data-mise-de-cote]')).toBeNull();
    expect(container.textContent).not.toContain('mis de côté');
  });
});

describe('CRITIQUE-2 n° 21, 22, 34 : le creux, la date d’une semaine, l’idée datée', () => {
  it('un clic sur le chiffre clé fait voir « Le creux de S\\d+ : ses causes » et « Solde et réglages › »', () => {
    render(<Banc {...espions()} />);
    fireEvent.click(screen.getByRole('button', { name: /CHF à dépenser sans passer sous 0/ }));
    expect(screen.getByText(/^Le creux de S\d+( ’\d{2})? : ses causes$/)).toBeVisible();
    expect(screen.getByText('Solde et réglages ›')).toBeVisible();
  });

  it('un toucher sur S50 fait voir « S50, 7 – 13 déc. », un deuxième l’efface ; un appui long appelle onIdeeSemaine avec le lundi de S50', () => {
    vi.useFakeTimers();
    const onIdeeSemaine = vi.fn();
    const { container } = render(<Banc {...espions()} onIdeeSemaine={onIdeeSemaine} />);
    const s50 = within(bande(container)).getByText('S50').closest('button') as HTMLElement;
    fireEvent.click(s50);
    expect(screen.getByText('S50, 7 – 13 déc.')).toBeInTheDocument();
    fireEvent.click(s50);
    expect(screen.queryByText('S50, 7 – 13 déc.')).toBeNull();
    fireEvent.pointerDown(s50, { pointerId: 4, clientX: 200, clientY: 180, button: 0 });
    act(() => { vi.advanceTimersByTime(500); });
    expect(onIdeeSemaine).toHaveBeenCalledWith('2026-12-07');
  });

  it('l’année : le cadre dit les mois (« nov. – oct. »), jamais « S47 – S45 » ; les mois en initiales sur une même ligne', () => {
    const { container } = render(<Banc {...espions()} vueInitiale="annee" />);
    const etiquette = container.querySelector('[data-cadre-etiquette]') as HTMLElement;
    // CRITIQUE-5 n° 2 : la 52e semaine (S45 2027, jeudi 11 nov.) tombe dans un treizième mois ; le cadre le dit, avec son année.
    expect(etiquette.textContent).toBe('nov. – nov. 2027');
    expect(container.textContent).not.toMatch(/S47 – S45/);
    const lettres = Array.from(container.querySelectorAll('[data-bande-annee] .ent-an-l')).map(e => e.textContent);
    expect(lettres).toEqual(['N', 'D', 'J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N']);
    // Chaque initiale est le premier enfant de sa colonne (même ligne de base), avant la valeur et la barre.
    container.querySelectorAll('[data-bande-annee] .ent-an-m').forEach(m => expect(m.firstElementChild!.classList.contains('ent-an-l')).toBe(true));
  });
});

describe('CRITIQUE-2 n° 26 : la rotation garde l’état de l’en-tête', () => {
  it('matchMedia simulé : en tournant, ± reste ouvert, le détail du creux aussi, et l’en-tête n’est pas remonté', () => {
    const ecouteurs = new Set<() => void>();
    const mq = { matches: false, media: '', addEventListener: (_: string, f: () => void) => ecouteurs.add(f), removeEventListener: (_: string, f: () => void) => ecouteurs.delete(f) };
    const avant = window.matchMedia;
    Object.defineProperty(window, 'matchMedia', { value: () => mq, configurable: true, writable: true });
    function Tournant() {
      const orientation = useOrientation();
      return <Banc {...espions()} orientation={orientation} />;
    }
    const { container } = render(<Tournant />);
    const racine = container.querySelector('[data-calendrier-entete]');
    fireEvent.click(screen.getByRole('button', { name: '±' }));
    fireEvent.click(screen.getByRole('button', { name: /CHF à dépenser sans passer sous 0/ }));
    expect(container.querySelector('.ent--portrait')).not.toBeNull();
    act(() => { mq.matches = true; ecouteurs.forEach(f => f()); });
    expect(container.querySelector('.ent--paysage')).not.toBeNull();
    expect(container.querySelector('[data-calendrier-entete]')).toBe(racine);
    expect(screen.getByRole('button', { name: '±' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/^Le creux de S\d+( ’\d{2})? : ses causes$/)).toBeInTheDocument();
    // En paysage, 13 semaines dans la bande, ± toujours ouvert : les montants y sont.
    expect(bande(container).textContent).toMatch(/[+−]\d/);
    act(() => { mq.matches = false; ecouteurs.forEach(f => f()); });
    expect(container.querySelector('.ent--portrait')).not.toBeNull();
    expect(screen.getByRole('button', { name: '±' })).toHaveAttribute('aria-pressed', 'true');
    Object.defineProperty(window, 'matchMedia', { value: avant, configurable: true, writable: true });
  });
});

describe('CRITIQUE-2 n° 14 : le menu de la période, borné à l’écran et au-dessus du + volant', () => {
  it('posé dans document.body, en position fixe, au-dessus du + volant (z-index 60 > 51) ; « Filtrer par type » y est', async () => {
    const { container } = render(<Banc {...espions()} />);
    fireEvent.click(screen.getByRole('button', { name: /6 sem/ }));
    const menu = screen.getByRole('dialog', { name: 'Période et vue' });
    expect(container.contains(menu)).toBe(false);
    expect(menu.classList.contains('ent-menu--fixe')).toBe(true);
    expect(menu.style.maxHeight).toMatch(/px$/);
    expect(within(menu).getByRole('button', { name: 'Filtrer par type' })).toBeInTheDocument();
    const fs = await import('node:fs');
    const chemin = await import('node:path');
    const css = fs.readFileSync(chemin.resolve(process.cwd(), 'src/ui/calendrier/entete/entete.css'), 'utf8');
    expect(Number(css.match(/\.ent-menu\.ent-menu--fixe \{[^}]*z-index: (\d+)/)![1])).toBeGreaterThan(51);
  });
});

describe('B9 : les règles de l’interface', () => {
  it('aucun type="number", aucune taille de texte sous 14 px, aucune couleur en dur dans le CSS', async () => {
    const { container } = render(<Banc {...espions()} />);
    expect(container.querySelector('input[type="number"]')).toBeNull();
    const fs = await import('node:fs');
    const chemin = await import('node:path');
    const sources = ['entete.css', 'EnTete.tsx', 'Courbe.tsx', 'Fenetre.tsx', 'BandeSemaines.tsx', 'BandeAnnee.tsx', 'MenuPeriode.tsx', 'DetailCreux.tsx', 'Retards.tsx', 'LectureCourbe.tsx', 'GrandeCourbe.tsx']
      .map(f => fs.readFileSync(chemin.resolve(process.cwd(), 'src/ui/calendrier/entete', f), 'utf8'));
    const css = sources[0];
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(css).not.toMatch(/rgba?\(\s*\d/);
    /* D385 : la bande en jours et la ligne Échelle reprennent leur maquette choisie (règle n° 1 ; DESIGN.md, décision du 12.09 : le plancher
       de 14 px n'est plus général) : lettre du jour 10,5 px, numéro et titres 13 px, semaines voisines 12 px. Le reste de l'en-tête garde 14 px. */
    const regles = css.split('\n');
    const d385 = (l: string) => /^\.ent-(bj|ech)/.test(l.trim());
    const tailles = regles.filter(l => !d385(l)).flatMap(l => [...l.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map(m => Number(m[1])));
    expect(tailles.length).toBeGreaterThan(10);
    expect(Math.min(...tailles)).toBeGreaterThanOrEqual(14);
    const taillesD385 = regles.filter(d385).flatMap(l => [...l.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map(m => Number(m[1])));
    expect(taillesD385.length).toBeGreaterThan(4);
    expect(Math.min(...taillesD385)).toBeGreaterThanOrEqual(10.5);
    for (const s of sources.slice(1)) expect(s).not.toContain('type="number"');
  });
});

/* ---------- CRITIQUE-3 (17.11) : chaque test échoue sur 40d11da1 ---------- */

const courbeSvg = (c: HTMLElement) => c.querySelector('.ent-cb svg') as SVGSVGElement;
const nomsCourbe = (c: HTMLElement) => Array.from(courbeSvg(c).querySelectorAll('[data-nom-courbe]'));

describe('CRITIQUE-3 n° 6 (c2-b) et n° 25 (c3-a) : le doigt sur la courbe', () => {
  it('b1 : glisser le long de la courbe hors des poignées lit la semaine ; la fenêtre ne bouge pas ; seules les zones de 44 px tirent', () => {
    const e = espions();
    const { container } = render(<Banc {...e} />);
    // 52 semaines sur 390 px : 7,5 px la semaine ; la fenêtre S47 – S52 va de 0 à 45 px. Le doigt de la critique s'est posé à x = 30, dans le
    // cadre : aucune zone de prise ne l'y prend (avant, la poignée de fin couvrait 29 à 57 px, et l'ajustement tactile l'y rabattait).
    const z = zonesPoignees(0, 45, 390);
    expect([z.debut.w, z.fin.w]).toEqual([44, 44]);
    const dans = (x: number, zz: { l: number; w: number }) => x >= Math.max(0, zz.l) && x <= zz.l + zz.w;
    expect(dans(30, z.fin) || dans(30, z.debut)).toBe(false);
    expect(parseFloat((screen.getByRole('button', { name: /Poignée de fin/ }) as HTMLElement).style.width)).toBe(44);

    const cb = container.querySelector('.ent-cb') as HTMLElement;
    fireEvent.pointerDown(cb, { pointerId: 1, clientX: 30, clientY: 50, button: 0 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 90, clientY: 52 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 160, clientY: 52 });
    // Pendant : la tête lit la semaine sous le doigt (160 px : S15), ses boutons restent, le cadre n'a pas bougé.
    expect(container.querySelector('.ent-t')!.textContent).toMatch(/CHF · S15 · 12 avr\. [+−]/);
    expect(screen.getByRole('button', { name: '±' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /6 sem/ })).toBeInTheDocument();
    expect(screen.getByLabelText('Fenêtre : S47 – S52')).toBeInTheDocument();
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 160 });
    expect(e.onFenetre).not.toHaveBeenCalled();
    expect(container.querySelector('.ent-t')!.textContent).toContain('CHF · S15');
    expect(container.querySelector('.ent-lu')!.textContent).toContain('la semaine');
    expect(screen.getByLabelText('Fenêtre : S47 – S52')).toBeInTheDocument();
    // Le curseur est tracé avant les noms : leur halo le coupe, il passe dessous.
    const enfants = Array.from(courbeSvg(container).children);
    const iCurseur = enfants.findIndex(n => n.hasAttribute('data-curseur'));
    const iNom = enfants.findIndex(n => !!n.querySelector('[data-nom-courbe]'));
    expect(iCurseur).toBeGreaterThan(-1);
    expect(iCurseur).toBeLessThan(iNom);
  });

  it('b1 bis : un doigt posé dans la zone de prise de la poignée de fin (hors du bouton) tire la fenêtre', () => {
    const e = espions();
    const { container } = render(<Banc {...e} />);
    const cb = container.querySelector('.ent-cb') as HTMLElement;
    fireEvent.pointerDown(cb, { pointerId: 1, clientX: 70, clientY: 50, button: 0 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 160, clientY: 50 });
    expect(screen.getByLabelText(/^Fenêtre : S47 – S\d+ 2027$/)).toBeInTheDocument();
    expect(container.querySelector('.ent-lu')).toBeNull();
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 160 });
  });

  it('b2 : la courbe en grand reste après le relâcher ; le doigt la relit ; × la ferme ; un toucher hors de la courbe aussi', () => {
    vi.useFakeTimers();
    const e = espions();
    const { container } = render(<Banc {...e} />);
    const appuiLong = () => {
      fireEvent.pointerDown(container.querySelector('.ent-cb') as HTMLElement, { pointerId: 1, clientX: 200, clientY: 50, button: 0 });
      act(() => { vi.advanceTimersByTime(500); });
      fireEvent.pointerUp(window, { pointerId: 1, clientX: 200 });
      act(() => { vi.advanceTimersByTime(1000); });
    };
    appuiLong();
    expect(e.onVue).toHaveBeenLastCalledWith('graph');
    expect(screen.getByLabelText('La courbe en grand')).toBeInTheDocument();
    const w = container.querySelector('.ent-gc-w') as HTMLElement;
    fireEvent.pointerDown(w, { pointerId: 2, clientX: 300, clientY: 100, button: 0 });
    fireEvent.pointerUp(window, { pointerId: 2, clientX: 300 });
    expect(screen.getByLabelText('La courbe en grand')).toBeInTheDocument();
    // S32 n'a ni mouvement nommé ni tendance : « rien cette semaine », sans « la semaine 0 » (CRITIQUE-5 n° 15).
    expect(container.querySelector('.ent-gc-d')!.textContent).toMatch(/^S32, .*rien cette semaine$/);
    fireEvent.click(screen.getByRole('button', { name: 'Revenir à la frise' }));
    expect(screen.queryByLabelText('La courbe en grand')).toBeNull();
    // Un toucher hors de la courbe (le bouton ± de la tête) la ferme aussi.
    appuiLong();
    expect(screen.getByLabelText('La courbe en grand')).toBeInTheDocument();
    fireEvent.pointerDown(screen.getByRole('button', { name: '±' }));
    expect(screen.queryByLabelText('La courbe en grand')).toBeNull();
    expect(e.onVue).toHaveBeenLastCalledWith('semaines');
  });
});

describe('CRITIQUE-3 n° 11 et 33 : une seule échelle de mois dans l’An, des mois réguliers ailleurs', () => {
  it('b3 : vue annee, aucun libellé de mois dans le SVG de la courbe ; la bande des mois est là (13 : la 52e semaine tombe en nov. 2027)', () => {
    const { container } = render(<Banc {...espions()} vueInitiale="annee" />);
    expect(courbeSvg(container).querySelectorAll('.ent-mois')).toHaveLength(0);
    expect(container.querySelectorAll('[data-bande-annee] .ent-an-m')).toHaveLength(13);
  });

  it('hors An, un mois sur n, toujours au même pas, chacun au lundi de sa première semaine, et 24 px au moins entre deux', () => {
    const { container } = render(<Banc {...espions()} />);
    const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
    const mois = Array.from(courbeSvg(container).querySelectorAll('.ent-mois')).map(t => ({ m: MOIS.indexOf(t.textContent ?? ''), x: Number(t.getAttribute('x')) }));
    expect(mois.length).toBeGreaterThanOrEqual(3);
    const pas = mois.slice(1).map((v, k) => (v.m - mois[k].m + 12) % 12);
    expect(new Set(pas).size).toBe(1);
    // Au lundi de la semaine dont le jeudi ouvre le mois : x = index × 7,5 + 3.
    for (const v of mois) expect(((v.x - 3) / 7.5) % 1).toBeCloseTo(0, 5);
    mois.slice(1).forEach((v, k) => expect(v.x - mois[k].x).toBeGreaterThanOrEqual(24 + 30));
  });
});

describe('CRITIQUE-3 n° 7 : les messages de l’en-tête passent par le canal unique, la date part au toucher suivant', () => {
  it('b4 : « Tire jusqu’au bout » par onMessage, seulement au toucher sans glisser (CAL-PERIODE-LIBRE : lâchée avant 80 %, la fin est posée) ; jamais pendant le tirage ; jamais à 90 % ; retiré à l’arrivée dans l’An', () => {
    const e = espions();
    const onMessage = vi.fn();
    render(<Banc {...e} onMessage={onMessage} />);
    const fin = () => screen.getByRole('button', { name: /Poignée de fin/ });
    fireEvent.pointerDown(fin(), { pointerId: 1, clientX: 45, button: 0 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 46 });
    expect(onMessage).not.toHaveBeenCalled();
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 46 });
    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onMessage).toHaveBeenCalledWith({ genre: 'annee', texte: 'Tire jusqu’au bout : l’année' });
    // Le canal l'affiche : l'en-tête ne le rend pas lui-même (un seul message à la fois).
    expect(screen.queryByText('Tire jusqu’au bout : l’année')).toBeNull();
    onMessage.mockClear();
    fireEvent.pointerDown(fin(), { pointerId: 2, clientX: 45, button: 0 });
    fireEvent.pointerMove(window, { pointerId: 2, clientX: 351 });
    expect(onMessage).not.toHaveBeenCalled();
    fireEvent.pointerUp(window, { pointerId: 2, clientX: 351 });
    expect(e.onVue).toHaveBeenCalledWith('annee');
    expect(onMessage).not.toHaveBeenCalledWith(expect.objectContaining({ genre: 'annee' }));
    expect(onMessage).toHaveBeenLastCalledWith(null);
  });

  it('« Tourne le téléphone » passe aussi par onMessage', async () => {
    const onMessage = vi.fn();
    Object.defineProperty(document.documentElement, 'requestFullscreen', { value: vi.fn().mockResolvedValue(undefined), configurable: true });
    Object.defineProperty(window.screen, 'orientation', { value: { lock: vi.fn().mockRejectedValue(new Error('NotSupportedError')) }, configurable: true });
    largeurFenetre(390);
    render(<Banc {...espions()} onMessage={onMessage} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Plein écran' })); });
    expect(onMessage).toHaveBeenCalledWith({ genre: 'invite', texte: 'Tourne le téléphone : 13 semaines' });
    expect(screen.queryByText(/Tourne le téléphone/)).toBeNull();
    delete (document.documentElement as unknown as Record<string, unknown>).requestFullscreen;
  });

  it('la date d’une semaine se pose au-dessus de la bande ; elle part au toucher suivant hors d’elle (frise comprise) et au défilement de 24 px', () => {
    const { container } = render(<><Banc {...espions()} /><div data-testid="frise">frise</div></>);
    const s50 = () => within(bande(container)).getByText('S50').closest('button') as HTMLElement;
    fireEvent.click(s50());
    const bulle = screen.getByText('S50, 7 – 13 déc.');
    expect(bulle.closest('.ent-bz')).not.toBeNull();
    expect(bulle.closest('.ent-live-date')).not.toBeNull();
    fireEvent.pointerDown(screen.getByTestId('frise'));
    expect(screen.queryByText('S50, 7 – 13 déc.')).toBeNull();
    // Le toucher sur la même semaine la chasse, et le clic qui suit ne la rouvre pas.
    fireEvent.click(s50());
    fireEvent.pointerDown(s50());
    fireEvent.click(s50());
    expect(screen.queryByText('S50, 7 – 13 déc.')).toBeNull();
    fireEvent.click(s50());
    expect(screen.getByText('S50, 7 – 13 déc.')).toBeInTheDocument();
    Object.defineProperty(window, 'scrollY', { value: 30, configurable: true });
    fireEvent.scroll(window);
    expect(screen.queryByText('S50, 7 – 13 déc.')).toBeNull();
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });
});

describe('CRITIQUE-3 n° 17 et 24 : les noms sur leur marche, l’étiquette du tirage', () => {
  const verifierNoms = (container: HTMLElement) => {
    const svg = courbeSvg(container);
    // Aucun trait de rappel : les seules lignes sont le zéro et les marches colorées.
    // Paquet G n° 2 : le trait « |déc. » des mois en haut (w3s, et le portrait) n'est pas un trait de rappel.
    for (const l of Array.from(svg.querySelectorAll('line'))) expect(l.classList.contains('ent-zero') || l.classList.contains('ent-mk') || l.classList.contains('ent-mois-t')).toBe(true);
    const n = svg.querySelectorAll('[data-point-semaine]').length, u = Number(svg.getAttribute('width')) / n;
    const noms = nomsCourbe(container);
    expect(noms.length).toBeGreaterThan(0);
    for (const t of noms) {
      const i = Number(t.closest('g')!.getAttribute('data-nom-index'));
      expect(Math.abs(Number(t.getAttribute('x')) - i * u)).toBeLessThanOrEqual(u);
    }
  };

  it('b5 : à 390 et à 1280, aucun trait de rappel ; chaque nom a un x à ±1 colonne de sa semaine', () => {
    verifierNoms(render(<Banc {...espions()} />).container);
    cleanup();
    verifierNoms(render(<Banc {...espions()} largeurColonne={1280 / 6} />).container);
  });

  it('b5 : le tracé (libre, caisse et leurs marches) ne touche aucun nom posé', () => {
    const g = geometrie(courbe.semaines.flatMap(s => [s.libre, s.caisse]), 52, 390, 110, 4, 110 - HAUTEUR_MOIS);
    const noms = placerNoms(courbe.semaines, g, maxNoms(390), obstaclesCourbe(g, { index: 0, nombre: 6, etiquette: 'S47 – S52' }, creuxDe(courbe.semaines)));
    expect(noms.length).toBeGreaterThanOrEqual(3);
    for (const e of noms) {
      const j0 = Math.floor(e.boite.l / g.unit), j1 = Math.min(51, Math.floor(e.boite.r / g.unit));
      for (let j = j0; j <= j1; j++) for (const v of [courbe.semaines[j].libre, courbe.semaines[j].caisse]) {
        const y = g.y(v);
        expect(y < e.boite.t || y > e.boite.b).toBe(true);
      }
    }
  });

  it('n° 24 : pendant le tirage, l’étiquette suit le doigt en haut de la courbe, avec l’année ; plus rien en bas du cadre', () => {
    const { container } = render(<Banc {...espions()} />);
    fireEvent.pointerDown(screen.getByRole('button', { name: /Poignée de fin/ }), { pointerId: 1, clientX: 45, button: 0 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 300 });
    const tir = container.querySelector('[data-cadre-tirage]') as HTMLElement;
    expect(tir.textContent).toMatch(/^S47 – S\d+ 2027$/);
    expect(container.querySelector('.ent-cadre [data-cadre-etiquette]')).toBeNull();
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 300 });
    expect(container.querySelector('[data-cadre-tirage]')).toBeNull();
  });
});

describe('CRITIQUE-3 n° 23 et 34 : l’étoile sur la courbe, l’espace de « dans Finances »', () => {
  it('b6 : une chose étoilée se voit sur sa marche, « ★ » dans le groupe de son nom ; aucune ★ hors de la courbe', () => {
    const { container } = render(<Banc {...espions()} etoiles={['c-fes']} />);
    const svg = courbeSvg(container);
    const etoile = svg.querySelector('[data-etoile="oui"]') as SVGGElement;
    expect(etoile).not.toBeNull();
    expect(etoile.querySelector('[data-nom-courbe]')!.textContent).toBe('★ Festival +2 450');
    expect(etoile.querySelector('.ent-etoile')!.textContent).toBe('★ ');
    expect((container.textContent!.match(/★/g) ?? []).length).toBe((svg.textContent!.match(/★/g) ?? []).length);
  });

  it('b6 : une chose étoilée sans montant sur la courbe garde son libellé à sa semaine (« ★ Brassage », jamais une ★ seule)', () => {
    const choses = [...(modele().choses ?? []), { id: 'c-br', rangee: 'brassins', titre: 'Brassage', debut: ajouterJours(LUNDI0, 9 * 7 + 1), mouvements: [] }] as unknown as ModeleEnTete['choses'];
    const { container } = render(<Banc {...espions()} modele={modele({ choses })} etoiles={['c-br']} />);
    const t = courbeSvg(container).querySelector('[data-etoile="oui"] [data-nom-courbe]') as SVGTextElement;
    expect(t.textContent).toBe('★ Brassage');
    expect(t.closest('g')!.getAttribute('data-nom-index')).toBe('9');
  });

  it('b7 : solde inconnu, « à régler dans Finances › Solde » avec son espace', () => {
    render(<EnTeteCalendrier modele={modele({ courbe: null, creux: null, icones: [] })} fenetre={{ du: LUNDI0, semaines: 6 }} onFenetre={vi.fn()}
      periode={periodeDeFenetre({ du: LUNDI0, semaines: 6 })} onPeriode={vi.fn()} vue="semaines" onVue={vi.fn()} mouvements={false} onMouvements={vi.fn()}
      orientation="portrait" largeurColonne={65} />);
    expect(screen.getByText(/Solde de départ inconnu/).textContent).toContain('dans Finances › Solde');
  });
});

describe('CRITIQUE-4 (lot q1-entete) : le doigt à 390, le paysage, le menu, le creux, la grande courbe', () => {
  it('n° 3 : appui long de 500 ms puis doigt levé : la vue graph, et le clic fabriqué au relâcher n’ouvre AUCUN menu période', () => {
    vi.useFakeTimers();
    const e = espions();
    const { container } = render(<Banc {...e} />);
    fireEvent.pointerDown(container.querySelector('.ent-cb') as HTMLElement, { pointerId: 1, clientX: 200, clientY: 50, button: 0, pointerType: 'touch' });
    act(() => { vi.advanceTimersByTime(500); });
    expect(e.onVue).toHaveBeenLastCalledWith('graph');
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 200, pointerType: 'touch' });
    // Le navigateur fabrique un clic au doigt levé ; l'ajustement tactile peut le poser sur le bouton de la période, juste au-dessus.
    const clic = fireEvent.click(container.querySelector('[data-ent-periode]') as HTMLElement);
    expect(clic).toBe(false);
    expect(document.querySelector('[data-menu-periode]')).toBeNull();
    expect(screen.queryByRole('dialog', { name: 'Période et vue' })).toBeNull();
    expect(screen.getByLabelText('La courbe en grand')).toBeInTheDocument();
    // Le menu contextuel de l'appui long est empêché.
    expect(fireEvent.contextMenu(container.querySelector('.ent-gc-w') as HTMLElement)).toBe(false);
    // Un vrai toucher ensuite (un nouveau doigt) ouvre bien le menu : rien n'est perdu.
    fireEvent.pointerDown(container.querySelector('[data-ent-periode]') as HTMLElement);
    fireEvent.click(container.querySelector('[data-ent-periode]') as HTMLElement);
    expect(document.querySelector('[data-menu-periode]')).not.toBeNull();
  });

  it('n° 3 : pendant la lecture et après l’appui long, le défilement est bloqué (touchmove annulé) ; au repos il ne l’est pas', () => {
    vi.useFakeTimers();
    const { container } = render(<Banc {...espions()} />);
    const cb = container.querySelector('.ent-cb') as HTMLElement;
    const glisse = () => { const ev = new Event('touchmove', { bubbles: true, cancelable: true }); cb.dispatchEvent(ev); return ev.defaultPrevented; };
    expect(glisse()).toBe(false);
    fireEvent.pointerDown(cb, { pointerId: 1, clientX: 200, clientY: 50, button: 0 });
    act(() => { vi.advanceTimersByTime(500); });
    expect(glisse()).toBe(true);
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 200 });
    act(() => { vi.advanceTimersByTime(DELAI_CLIC_AVALE); });
    const w = container.querySelector('.ent-gc-w') as HTMLElement;
    const ev = new Event('touchmove', { bubbles: true, cancelable: true });
    w.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });

  it('n° 18 : glisser sur la courbe hors des poignées appelle onLectureSemaine avec la semaine ; la tête dit « … CHF · S.. · <date> ±… »', () => {
    const onLectureSemaine = vi.fn();
    const { container } = render(<Banc {...espions()} onLectureSemaine={onLectureSemaine} />);
    const cb = container.querySelector('.ent-cb') as HTMLElement;
    // Les zones de prise (cadre S47 – S52 de 0 à 45 px) : 300 px en est loin.
    fireEvent.pointerDown(cb, { pointerId: 4, clientX: 300, clientY: 50, button: 0 });
    fireEvent.pointerMove(window, { pointerId: 4, clientX: 320, clientY: 51 });
    fireEvent.pointerMove(window, { pointerId: 4, clientX: 160, clientY: 51 });
    expect(onLectureSemaine).toHaveBeenLastCalledWith(ajouterJours(LUNDI0, 21 * 7));
    expect(container.querySelector('.ent-t')!.textContent).toMatch(/CHF · S15 · 12 avr\. [+−]\d/);
    expect(container.querySelector('.ent-lu')!.textContent).toContain('la semaine');
    fireEvent.pointerUp(window, { pointerId: 4, clientX: 160 });
  });

  it('n° 26 : dans l’An, la plage du menu porte les deux années (« 16 nov. 2026 → … 2027 ») ; 6 semaines dans la même année, sans année', () => {
    const { container } = render(<Banc {...espions()} />);
    fireEvent.click(container.querySelector('[data-ent-periode]') as HTMLElement);
    expect(document.querySelector('.ent-menu-plage')!.textContent).toBe('16 nov. → 27 déc.');
    fireEvent.click(within(document.querySelector('[data-menu-periode]') as HTMLElement).getByRole('button', { name: 'An' }));
    fireEvent.click(container.querySelector('[data-ent-periode]') as HTMLElement);
    const plage = document.querySelector('.ent-menu-plage')!.textContent!;
    expect(plage).toMatch(/^16 nov\. 2026 → \d+ \S+ 2027$/);
    expect(plage.match(/20\d\d/g)).toHaveLength(2);
  });

  it('n° 25 : les points de la courbe sont dans un groupe coupé à la zone de tracé (clip-path)', () => {
    const { container } = render(<Banc {...espions()} />);
    const svg = courbeSvg(container);
    const groupe = svg.querySelector('g.ent-pts')!;
    expect(groupe.querySelectorAll('[data-point-semaine]')).toHaveLength(52);
    const clip = groupe.getAttribute('clip-path')!;
    expect(clip).toMatch(/^url\(#z\w+\)$/);
    const rect = svg.querySelector(`clipPath${clip.slice(4, -1)} rect`)!;
    expect([rect.getAttribute('width'), rect.getAttribute('height')]).toEqual([svg.getAttribute('width'), svg.getAttribute('height')]);
  });

  it('n° 11 : en paysage, la courbe fait 90 px, les mois en haut avec leur trait (w3s), le tracé dessous de 18 à 88 px (70 px)', () => {
    const props = { modele: modele(), fenetre: { du: LUNDI0, semaines: 13 }, onFenetre: vi.fn(), periode: periodeDeFenetre({ du: LUNDI0, semaines: 13 }), onPeriode: vi.fn(), vue: 'semaines' as const,
      onVue: vi.fn(), mouvements: false, onMouvements: vi.fn(), largeurColonne: 48 };
    const { container } = render(<EnTeteCalendrier {...props} orientation="paysage" />);
    const svg = courbeSvg(container);
    expect(Number(svg.getAttribute('height'))).toBe(90);
    const mois = Array.from(svg.querySelectorAll('.ent-mois'));
    expect(mois.length).toBeGreaterThan(0);
    mois.forEach(m => expect(Number(m.getAttribute('y'))).toBe(13));
    expect(svg.querySelectorAll('.ent-mois-t')).toHaveLength(mois.length);
    const ys = Array.from(svg.querySelectorAll('[data-point-semaine]')).map(p => Number(p.getAttribute('cy')));
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(18);
    expect(Math.max(...ys)).toBeLessThanOrEqual(88);
    // L'étendue du tracé : le plus haut et le plus bas de la courbe sont à 60 px au moins l'un de l'autre (l'échelle ajoute 4 % en haut).
    expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThanOrEqual(60);
  });

  it('n° 23 : le détail du creux reprend z2s (S.. → S.. · n à dépenser, ses sorties, la mise de côté) et dit la tendance de Finances avec sa source', () => {
    const hypotheses = [
      { id: 'depart' as const, texte: 'Solde de départ : 4 180 CHF', source: 'Finances › Solde', ouvre: { ecran: 'solde' as const } },
      { id: 'tendance' as const, texte: 'Tendance de Finances : +120 CHF/mois', source: 'Finances › Prévision (moyenne des mois passés)', ouvre: { ecran: 'finances' as const } }
    ];
    render(<Banc {...espions()} modele={modele({ hypotheses } as Partial<ModeleEnTete>)} />);
    fireEvent.click(screen.getByRole('button', { name: /à dépenser sans passer sous 0/ }));
    const carte = screen.getByRole('region', { name: /Le creux de S\d+( ’\d{2})? : ses causes/ });
    expect(carte.textContent).toMatch(/S\d+( ’\d{2})? → S\d+( ’\d{2})? · −?[\d\s]+ à dépenser/);
    expect(carte.textContent).toContain('Embouteilleuse');
    expect(carte.textContent).toContain('Mis de côté pour Frigo');
    expect(carte.textContent).toContain('Tendance de Finances : +120 CHF/mois · source : Finances › Prévision');
    expect(carte.textContent).toContain('Solde et réglages ›');
  });

  it('n° 27, CRITIQUE-5 n° 16 : la grande courbe prend la hauteur disponible, sur écran large comme au téléphone, jamais moins que sa maquette (250)', () => {
    largeurFenetre(1280);
    const { container, unmount } = render(<Banc {...espions()} vueInitiale="graph" />);
    const grand = Number(container.querySelector('.ent-gs')!.getAttribute('height'));
    expect(grand).toBeGreaterThan(250);
    // CRITIQUE-12 n° 5 : sans + affiché (jsdom), le haut de la légende laisse deux lignes au-dessus des onglets ; puis le titre et la place fixe du détail
    expect(grand).toBe(hautLegende(window.innerHeight, null) - TITRE_GRANDE - PLACE_DETAIL);
    unmount();
    largeurFenetre(390);
    const { container: c2 } = render(<Banc {...espions()} vueInitiale="graph" />);
    expect(Number(c2.querySelector('.ent-gs')!.getAttribute('height'))).toBe(hautLegende(window.innerHeight, null) - TITRE_GRANDE - PLACE_DETAIL);
    // Un écran bas : jamais sous les 250 px de sa maquette.
    Object.defineProperty(window, 'innerHeight', { value: 300, configurable: true, writable: true });
    const { container: c3 } = render(<Banc {...espions()} vueInitiale="graph" />);
    expect(Number(c3.querySelector('.ent-gs')!.getAttribute('height'))).toBe(250);
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true, writable: true });
  });

  it('n° 27 : l’étiquette « creux S.. · … » n’est jamais barrée : hors du tracé quand une place contre le point le permet, sinon sur son fond, au-dessus du tracé', async () => {
    // CRITIQUE-9 n° 5 : l'étiquette reste contre le point du creux (48 px au plus de sa ligne, à 14 px de côté). Quand le creux est un V (la
    // courbe du banc : le libre et la caisse l'encadrent à moins de 25 px), aucune place contre le point n'est libre : elle se pose sur son fond,
    // tracé APRÈS la courbe, opaque à 92 %, et le tracé passe dessous (vérifié plus bas). Quand une place contre le point est libre (un creux en
    // palier : le libre tombe en S5 ’27 puis reste plat), c'est elle qui est prise : ni le libre ni la caisse ne traversent l'étiquette.
    const palier = courbeCaisse({ depart: 300000, lundi0: LUNDI0, mouvements: [{ id: 'p', jour: jour(10), centimes: -400000, nom: 'Cuve' }] })!;
    for (const [l, h] of [[1100, 560], [390, 250]]) {
      const g = geoGrande(palier.semaines, l, h);
      const c = creuxDe(palier.semaines)!;
      const w = largeurTexte(`creux S${c.numero} · `) + largeurTexte(francs(c.centimes), true);
      const p = placeEtiquetteCreux(palier.semaines, g, l, c.index, c.centimes, w);
      expect(Math.abs(p.y - g.y(c.centimes))).toBeLessThanOrEqual(48);
      const courbe = palier;
      const traverse = (vals: number[]) => vals.some((v, j) => {
        const x0 = g.x(j), x1 = g.x(j + 1), y = g.y(v);
        if (x1 >= p.boite.l && x0 <= p.boite.r && y >= p.boite.t && y <= p.boite.b) return true;
        if (j === 0 || x0 < p.boite.l || x0 > p.boite.r) return false;
        const a = g.y(vals[j - 1]);
        return Math.min(a, y) <= p.boite.b && Math.max(a, y) >= p.boite.t;
      });
      expect(traverse(courbe.semaines.map(s => s.libre))).toBe(false);
      expect(traverse(courbe.semaines.map(s => s.caisse))).toBe(false);
    }
    const { container } = render(<Banc {...espions()} vueInitiale="graph" />);
    expect(container.querySelector('[data-creux-fond]')).not.toBeNull();
    expect(container.querySelector('[data-creux-etiquette]')!.textContent).toMatch(/^creux S\d+( ’\d{2})? · /);
    // Le fond est tracé après le libre (segments) et la caisse : la courbe passe dessous, jamais à travers le texte. Il est presque opaque.
    const svg = container.querySelector('.ent-gs')!;
    const tous = Array.from(svg.querySelectorAll('*'));
    const iFond = tous.indexOf(container.querySelector('[data-creux-fond]')!);
    const iDernierTrace = Math.max(...Array.from(svg.querySelectorAll('.ent-sgm, [data-caisse]')).map(n => tous.indexOf(n)));
    expect(iFond).toBeGreaterThan(iDernierTrace);
    const fs = await import('node:fs');
    const op = /\.ent-gc-fond \{[^}]*opacity: ([\d.]+)/.exec(fs.readFileSync('src/ui/calendrier/entete/entete.css', 'utf8'));
    expect(Number(op?.[1])).toBeGreaterThanOrEqual(0.9);
  });
});

describe('CRITIQUE-5 (lot 1) : le creux et son année, l’An, la lecture, la grande courbe, la période, la pastille', () => {
  /* Le creux en S44 2027 (lundi 1er nov. 2027, index 50) : une cuve achetée, puis une vente la semaine d'après. */
  const courbeS44 = courbeCaisse({ depart: 418000, lundi0: LUNDI0, mouvements: [
    { id: 'cuve', jour: jour(50), centimes: -1000000, nom: 'Cuve' },
    { id: 'vente', jour: jour(51), centimes: 900000, nom: 'Vente de fûts' }
  ] })!;
  const modeleS44 = (): ModeleEnTete => ({ ...modele(), courbe: courbeS44, creux: creuxDepuis(courbeS44), mois: anneeEnMois(LUNDI0), choses: [] as unknown as ModeleEnTete['choses'] });

  it('n° 2 : l’en-tête dit « S44 2027 », le détail « Le creux de S44 2027 » ; l’An a 13 mois et cercle nov. 2027 avec le même montant', () => {
    const creux = creuxDepuis(courbeS44)!;
    expect(creux.lundi).toBe('2027-11-01');
    const { container, unmount } = render(<Banc {...espions()} modele={modeleS44()} />);
    const cle = container.querySelector('[data-ent-cle]') as HTMLElement;
    expect(cle.textContent).toBe(`${francs(creux.centimes)}CHF à dépenser· S44 ’27`);
    fireEvent.click(cle);
    expect(screen.getByText('Le creux de S44 ’27 : ses causes')).toBeInTheDocument();
    unmount();
    const { container: c2 } = render(<Banc {...espions()} modele={modeleS44()} vueInitiale="annee" />);
    const an = c2.querySelector('[data-bande-annee]') as HTMLElement;
    expect(an.querySelectorAll('.ent-an-m')).toHaveLength(13);
    const cercle = an.querySelector('.ent-an-creux') as HTMLElement;
    expect(cercle.dataset.mois).toBe('2027-11');
    expect(cercle.getAttribute('title')).toMatch(/^nov\. 2027 : /);
    expect(cercle.querySelector('.ent-an-v')!.textContent).toBe(francs(creux.centimes));
    expect(an.getAttribute('aria-label')).toContain(`nov 2027, ${francs(creux.centimes)} CHF`);
  });

  /* Une semaine à tendance seule (S50, index 3) et une semaine de Papiers (S52, index 5). */
  const courbeTendance = courbeCaisse({ depart: 418000, lundi0: LUNDI0, mouvements: [
    { id: 't3', jour: jour(3), centimes: -25000, nom: 'Tendance', tendance: true },
    { id: 'loyer', jour: jour(5), centimes: -40000, nom: 'Loyer', choseId: 'c-loyer' },
    { id: 'malt', jour: jour(6), centimes: -54000, nom: 'Malt', choseId: 'c-malt' }
  ] })!;
  const rangeeDe = (m: { choseId?: string }) => (m.choseId === 'c-loyer' ? 'papiers' : m.choseId === 'c-malt' ? 'achats' : undefined);

  it('n° 15 : une semaine à tendance seule dit « tendance −250 », jamais « rien cette semaine » ni « la semaine −250 »', () => {
    const { container } = render(<LectureDetail courbe={courbeTendance} index={3} rangeeDe={rangeeDe} />);
    const texte = container.textContent ?? '';
    expect(texte).toContain('tendance −250');
    expect(texte).not.toContain('rien cette semaine');
    expect(texte).not.toContain('la semaine');
    // Une semaine avec un mouvement nommé garde « la semaine », sur la ligne du titre (as p-c2b-pendant).
    const { container: c2 } = render(<LectureDetail courbe={courbeTendance} index={5} rangeeDe={rangeeDe} />);
    expect(c2.querySelector('.ent-det-t')!.textContent).toMatch(/la semaine −400$/);
  });

  it('n° 15 : le détail de la lecture vit dans l’en-tête (dans le flux), il ne se pose plus sur la frise', async () => {
    const fs = await import('node:fs');
    const chemin = await import('node:path');
    const css = fs.readFileSync(chemin.resolve(process.cwd(), 'src/ui/calendrier/entete/entete.css'), 'utf8');
    const regle = css.match(/\n\.ent-lu \{([^}]*)\}/)![1];
    expect(regle).toContain('position: static');
    expect(regle).not.toMatch(/top: 100%|absolute/);
  });

  it('n° 16 : la caisse a sa classe, sans couleur de rangée ni le gris de Papiers ; une semaine à tendance seule est neutre ; la légende ne liste que le présent', async () => {
    const { container } = render(<GrandeCourbe courbe={courbeTendance} rangeeDe={rangeeDe} largeur={390} hauteur={400} paysage={false} lecture={null} onFermer={() => undefined} />);
    const caisse = container.querySelector('[data-caisse]') as SVGPathElement;
    expect(caisse.getAttribute('class')).toBe(CLASSE_CAISSE);
    expect(caisse.getAttribute('class')).not.toMatch(/ent-c-/);
    const segments = Array.from(container.querySelectorAll('.ent-sgm'));
    const classesRangee = /ent-c-(brassin|fete|vente|achat|travaux|activite|papier)\b/;
    expect(segments[3].getAttribute('class')).not.toMatch(classesRangee);
    expect(segments[5].getAttribute('class')).toMatch(/ent-c-papier/);
    expect(segments[6].getAttribute('class')).toMatch(/ent-c-achat/);
    expect(Array.from(container.querySelectorAll('.ent-leg li')).map(li => li.textContent)).toEqual(['caisse', 'Achats', 'Papiers', 'rien de nommé (tendance)']);
    expect(container.textContent).not.toContain('caisse en gris');
    // Le jeton du trait de la caisse n'est celui d'aucune rangée, ni le gris de Papiers.
    const fs = await import('node:fs');
    const chemin = await import('node:path');
    const css = fs.readFileSync(chemin.resolve(process.cwd(), 'src/ui/calendrier/entete/entete.css'), 'utf8');
    const trait = css.match(/\.ent-gs \.ent-gc-caisse \{([^}]*)\}/)![1];
    const jeton = trait.match(/stroke: rgb\(var\(--([a-z0-9-]+)\)\)/)![1];
    const jetonsRangees = Array.from(css.matchAll(/\.ent-r-(?!autre)[a-z]+, \.ent-c-[a-z]+ \{ --c: rgb\(var\(--([a-z0-9-]+)\)\); \}/g)).map(m => m[1]);
    expect(jetonsRangees).toHaveLength(7);
    expect(jetonsRangees).not.toContain(jeton);
    expect(['cave-400', 'cave-600', 'cave-200', 'marque']).not.toContain(jeton);
    expect(trait).toContain('stroke-dasharray');
  });

  it('n° 18 : une période mois de l’app règle la fenêtre sur ses semaines, et le bouton dit le même libellé que la barre (« Nov. », « Déc. ») ; « 3 mois » écrit des dates', () => {
    const e = espions();
    const { unmount } = render(<Banc {...e} periodeInitiale={{ genre: 'mois', annee: 2026, mois: 12 }} />);
    // Décembre 2026 : du mardi 1er au jeudi 31 : de S49 (lundi 30 nov.) à S53 (lundi 28 déc.).
    expect(e.onFenetre).toHaveBeenLastCalledWith({ du: '2026-11-30', semaines: 5 });
    expect((document.querySelector('[data-ent-periode]') as HTMLElement).textContent).toBe('Déc.');
    expect(bande(document.body).textContent).toBe('S49S50S51S52S53');
    fireEvent.click(document.querySelector('[data-ent-periode]') as HTMLElement);
    fireEvent.click(screen.getByRole('button', { name: '3 mois' }));
    expect(e.onPeriode).toHaveBeenLastCalledWith(expect.objectContaining({ genre: 'dates' }));
    unmount();
    // Novembre 2026, vu du 16 nov. : la courbe commence en S47 ; décision pilote (c) : 4 semaines au moins, dès aujourd'hui (S47 – S50).
    const e2 = espions();
    render(<Banc {...e2} periodeInitiale={{ genre: 'mois', annee: 2026, mois: 11 }} />);
    expect(e2.onFenetre).toHaveBeenLastCalledWith({ du: LUNDI0, semaines: 4 });
    expect((document.querySelector('[data-ent-periode]') as HTMLElement).textContent).toBe('Nov.');
  });

  it('n° 24 : un modèle vide n’a aucune pastille ⏰ ; « à régler dans Finances › Solde » garde son espace dans un seul élément en ligne', () => {
    const { container } = render(<Banc {...espions()} modele={{ ...modele(), courbe: null, creux: null, retards: [], icones: [] }} />);
    expect(container.querySelector('.ent-ret-b')).toBeNull();
    expect(screen.queryByRole('button', { name: /en retard/ })).toBeNull();
    const phrase = container.querySelector('.ent-inconnu') as HTMLElement;
    expect(phrase.children).toHaveLength(1);
    expect(phrase.children[0].tagName).toBe('SPAN');
    expect(phrase.textContent!.replace(/\s+/g, ' ').trim()).toBe('Solde de départ inconnu : à régler dans Finances › Solde');
  });

  it('n° 30 : le détail du creux porte « ensuite » et ses paliers (« 1 782 dès S26 » de cd1) ; la date seulement en paysage', () => {
    const { container, unmount } = render(<Banc {...espions()} />);
    fireEvent.click(container.querySelector('[data-ent-cle]') as HTMLElement);
    const ensuite = container.querySelector('[data-ensuite]') as HTMLElement;
    expect(ensuite).not.toBeNull();
    expect(ensuite.textContent).toMatch(/^ensuite[−\d ]+ dès S\d+( ’\d{2})?/);
    expect(ensuite.textContent).not.toMatch(/ · \d+ \p{L}/u);
    unmount();
    const { container: c2 } = render(<Banc {...espions()} orientation="paysage" />);
    fireEvent.click(c2.querySelector('[data-ent-cle]') as HTMLElement);
    expect(c2.querySelector('[data-ensuite]')!.textContent).toMatch(/dès S\d+( ’\d{2})? · \d+ \p{L}/u);
  });
});

describe('CRITIQUE-5 n° 20 : la lecture au doigt et l’appui long marchent à 844 × 390 et à 1280', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  const largeurs: Array<[string, number, 'portrait' | 'paysage', number]> = [['844 × 390', 844, 'paysage', 1], ['1280', 1280, 'portrait', 0]];
  for (const [nom, l, orientation, tactile] of largeurs) {
    it(`${nom} : glisser hors des poignées lit la semaine ; un appui long ouvre la courbe en grand, le doigt y lit encore`, () => {
      largeurFenetre(l);
      const larg = orientation === 'paysage' ? l - 214 - 8 : l;
      vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ left: 0, top: 0, right: larg, bottom: 110, width: larg, height: 110, x: 0, y: 0, toJSON: () => ({}) } as DOMRect);
      const e = espions();
      const onLectureSemaine = vi.fn();
      const { container } = render(<Banc {...e} orientation={orientation} onLectureSemaine={onLectureSemaine} largeurColonne={larg / 13} />);
      const cb = container.querySelector('.ent-cb') as HTMLElement;
      const pointer = tactile ? 'touch' : 'mouse';
      // À 60 % de la courbe : loin du cadre de la fenêtre (13 semaines au plus, 25 %) et de ses zones de prise.
      const x0 = larg * 0.6;
      fireEvent.pointerDown(cb, { pointerId: 1, pointerType: pointer, clientX: x0, clientY: 50, button: 0 });
      fireEvent.pointerMove(window, { pointerId: 1, pointerType: pointer, clientX: x0 + 30, clientY: 51 });
      const attendu = Math.floor(((x0 + 30) / larg) * 52);
      expect(onLectureSemaine).toHaveBeenLastCalledWith(ajouterJours(LUNDI0, attendu * 7));
      expect(e.onFenetre).not.toHaveBeenCalledWith(expect.objectContaining({ du: ajouterJours(LUNDI0, attendu * 7) }));
      fireEvent.pointerUp(window, { pointerId: 1, clientX: x0 + 30 });
      expect(container.querySelector('.ent-lu')!.textContent).toMatch(/S\d+/);
      fireEvent.pointerDown(document.body);
      // Appui long de 500 ms : la courbe en grand.
      fireEvent.pointerDown(container.querySelector('.ent-cb') as HTMLElement, { pointerId: 2, pointerType: pointer, clientX: x0, clientY: 50, button: 0 });
      act(() => { vi.advanceTimersByTime(520); });
      expect(e.onVue).toHaveBeenLastCalledWith('graph');
      expect(screen.getByLabelText('La courbe en grand')).toBeInTheDocument();
      fireEvent.pointerMove(window, { pointerId: 2, pointerType: pointer, clientX: x0 - 60, clientY: 52 });
      fireEvent.pointerUp(window, { pointerId: 2, clientX: x0 - 60 });
      expect(container.querySelector('.ent-gc-d')!.textContent).toMatch(/^S\d+, /);
    });
  }
});

describe('CRITIQUE-6 (lot B-entete) : le chiffre clé entier, le creux et ses causes, l’étoile, c3-a, la période', () => {
  /* Une courbe qui ne fait que descendre sur 52 semaines (tendance −250 chaque semaine) : de gros achats au début de l'horizon, un loyer tous
     les quatre semaines, et le creux à la dernière semaine (S45 2027, lundi 8 nov. 2027, vu du 16 nov. 2026). */
  const descente = courbeCaisse({ depart: 900000, lundi0: LUNDI0, mouvements: [
    { id: 'd1', jour: jour(1), centimes: -180000, nom: 'Frigo' },
    { id: 'd2', jour: jour(2), centimes: -90000, nom: 'Hotte' },
    { id: 'd3', jour: jour(3), centimes: -54000, nom: 'Commande groupée de malt' },
    ...Array.from({ length: 13 }, (_, k) => ({ id: `loyer${k}`, jour: jour(k * 4 + 3), centimes: -40000, nom: 'Loyer du local' })),
    { id: 'd49', jour: jour(49), centimes: -42000, nom: 'Brouwland · malt' },
    { id: 'd51', jour: jour(51), centimes: -26000, nom: 'Hopfen · Hallertau' },
    ...Array.from({ length: 52 }, (_, k) => ({ id: `t${k}`, jour: jour(k), centimes: -25000, nom: 'Tendance', tendance: true }))
  ] })!;

  it('n° 1 : « à dépenser » entier dans le bouton, sans rognure ; creux en 2027 vu en 2026 → « S.. ’27 » ; dans l’année, la semaine seule', async () => {
    const { container, unmount } = render(<Banc {...espions()} modele={modele({ courbe: descente, creux: creuxDepuis(descente) })} />);
    const cle = container.querySelector('[data-ent-cle]') as HTMLElement;
    expect(cle.textContent).toContain('CHF à dépenser');
    expect(cle.textContent).toMatch(/à dépenser· S45 ’27$/);
    expect(cle.textContent).not.toMatch(/2027|…/);
    unmount();
    // Un creux dans l'année en cours : « S50 », sans année.
    const court = courbeCaisse({ depart: 300000, lundi0: LUNDI0, mouvements: [{ id: 'x', jour: jour(3), centimes: -250000, nom: 'Cuve' }, { id: 'y', jour: jour(8), centimes: 400000, nom: 'Vente' }] })!;
    const { container: c2 } = render(<Banc {...espions()} modele={modele({ courbe: court, creux: creuxDepuis(court) })} />);
    expect((c2.querySelector('[data-ent-cle]') as HTMLElement).textContent).toMatch(/à dépenser· S50$/);
    expect(semaineCourte('2027-11-01', LUNDI0)).toBe('S44 ’27');
    expect(semaineCourte('2026-12-07', LUNDI0)).toBe('S50');
    // Aucune ellipse sur le libellé : il ne se rogne jamais (D-114, E33).
    const fs = await import('node:fs');
    const chemin = await import('node:path');
    const css = fs.readFileSync(chemin.resolve(process.cwd(), 'src/ui/calendrier/entete/entete.css'), 'utf8');
    const regle = css.match(/\.ent-k \.ent-k-u \{([^}]*)\}/)![1];
    expect(regle).not.toMatch(/ellipsis|overflow: hidden/);
    expect(regle).toContain('flex: none');
  });

  it('n° 1 et 14 : quand la ligne ne tient pas (390, paysage), la semaine passe sous « CHF à dépenser » (data-empile), sans rien rogner', () => {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.tagName === 'B' ? 70 : this.classList.contains('ent-k-u') ? 104 : this.tagName === 'EM' ? 56 : 0;
    });
    const large = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) { return this.hasAttribute('data-ent-cle') ? 190 : 0; });
    const { container, unmount } = render(<Banc {...espions()} modele={modele({ courbe: descente, creux: creuxDepuis(descente) })} />);
    const cle = container.querySelector('[data-ent-cle]') as HTMLElement;
    expect(cle.hasAttribute('data-empile')).toBe(true);
    expect(cle.textContent).toContain('CHF à dépenser');
    unmount();
    // Assez de place (z2s : « 113 CHF à dépenser · S24 ») : une ligne.
    large.mockImplementation(function (this: HTMLElement) { return this.hasAttribute('data-ent-cle') ? 260 : 0; });
    const { container: c2 } = render(<Banc {...espions()} modele={modele({ courbe: descente, creux: creuxDepuis(descente) })} orientation="paysage" />);
    expect((c2.querySelector('[data-ent-cle]') as HTMLElement).hasAttribute('data-empile')).toBe(false);
  });

  it('paquet D n° 5 : empilé sans 4 px de marge au ± (montant long, vue Jour à 390), le chiffre se resserre (data-serre) ; avec la marge, non', () => {
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function (this: HTMLElement) {
      return this.tagName === 'B' ? 70 : this.classList.contains('ent-k-u') ? 104 : this.tagName === 'EM' ? 56 : 0;
    });
    const large = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) { return this.hasAttribute('data-ent-cle') ? 178 : 0; });
    const { container, unmount } = render(<Banc {...espions()} modele={modele({ courbe: descente, creux: creuxDepuis(descente) })} />);
    const cle = container.querySelector('[data-ent-cle]') as HTMLElement;
    expect(cle.hasAttribute('data-empile')).toBe(true);
    expect(cle.hasAttribute('data-serre')).toBe(true);
    unmount();
    large.mockImplementation(function (this: HTMLElement) { return this.hasAttribute('data-ent-cle') ? 190 : 0; });
    const { container: c2 } = render(<Banc {...espions()} modele={modele({ courbe: descente, creux: creuxDepuis(descente) })} />);
    expect((c2.querySelector('[data-ent-cle]') as HTMLElement).hasAttribute('data-serre')).toBe(false);
    const css = readFileSync(resolve(process.cwd(), 'src/ui/calendrier/entete/entete.css'), 'utf8');
    expect(css).toMatch(/\.ent-k\[data-serre\] b \{ font-size: 17px;/);
  });

  it('paquet D n° 4 : « 2 sem. · j » a la même marge interne des deux côtés, et sa zone de toucher ne déborde pas sur les côtés', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/ui/calendrier/entete/entete.css'), 'utf8');
    for (const m of css.matchAll(/\.ent-per \{[^}]*padding: ([^;]+);/g)) {
      const v = m[1].trim().split(/\s+/);
      expect(v.length === 2 || v[1] === v[3], m[0]).toBe(true);
    }
    expect(css).toMatch(/\.ent \.ent-t \.ent-per::after \{ left: 0; right: 0; \}/);
  });

  it('n° 8 : courbe qui descend sur 52 semaines, creux à la dernière : les causes sont de la semaine du creux ou des précédentes immédiates, triées ; « ensuite » dit la fin de l’horizon', () => {
    const creux = creuxDepuis(descente)!;
    expect(creux.index).toBe(51);
    const { causes } = causesDuCreux(descente.semaines, creux.index);
    expect(causes.length).toBeGreaterThan(0);
    expect(causes.every(c => c.index <= 51 && c.index > 51 - RECUL_MAX)).toBe(true);
    expect(causes.map(c => c.index)).toEqual([...causes.map(c => c.index)].sort((a, b) => a - b));
    expect(causes.some(c => c.index === 51)).toBe(true);
    expect(causes.map(c => c.nom)).not.toContain('Frigo');
    const { container } = render(<Banc {...espions()} modele={modele({ courbe: descente, creux, choses: [] as unknown as ModeleEnTete['choses'] })} />);
    fireEvent.click(container.querySelector('[data-ent-cle]') as HTMLElement);
    const carte = screen.getByRole('region', { name: 'Le creux de S45 ’27 : ses causes' });
    const lignes = Array.from(carte.querySelectorAll('[data-cause-index]')).map(l => Number((l as HTMLElement).dataset.causeIndex));
    expect(lignes.length).toBeGreaterThan(0);
    expect(lignes).toEqual([...lignes].sort((a, b) => a - b));
    expect(lignes.every(i => i > 51 - RECUL_MAX)).toBe(true);
    expect(carte.textContent).toContain('S45 ’27Hopfen · Hallertau');
    expect(carte.textContent).not.toContain('Frigo');
    const ensuite = carte.querySelector('[data-ensuite]') as HTMLElement;
    expect(ensuite).not.toBeNull();
    // Le dimanche de la 52e semaine : 14 nov. 2027 ; aucun palier inventé.
    expect(ensuite.textContent).toBe('ensuite · fin de l’horizon, le 14 nov. 2027');
    expect(ensuite.textContent).not.toMatch(/dès S/);
  });

  it('n° 9 : une chose étoilée en S52 a sa ★ sur la courbe, à l’abscisse de S52, posée au-dessus du cadre de la fenêtre', async () => {
    // Fenêtre S47 – S52 sur 52 semaines, à 120 px : le nom ne tient nulle part, la ★ seule se pose sur sa marche.
    const sem = courbe.semaines;
    const { container } = render(<Courbe courbe={sem} largeur={120} hauteur={110} cadre={{ index: 0, nombre: 6, etiquette: 'S47 – S52' }} etoiles={[{ nom: 'Marché de Noël', i: 5 }]}>
      <div className="ent-cadre" />
    </Courbe>);
    const marque = container.querySelector('[data-etoile-marque]') as SVGTextElement;
    expect(marque).not.toBeNull();
    expect(marque.textContent).toContain('★');
    expect(marque.getAttribute('data-semaine')).toBe('52');
    expect(Number(marque.getAttribute('x'))).toBeCloseTo((120 / 52) * 5.5, 1);
    // Au-dessus du cadre : un calque posé après le dessin, avec un z-index, dans la courbe.
    const calque = marque.closest('svg') as SVGSVGElement;
    expect(calque.hasAttribute('data-etoiles-dessus')).toBe(true);
    expect(calque.parentElement!.classList.contains('ent-cb')).toBe(true);
    const fs = await import('node:fs');
    const chemin = await import('node:path');
    const css = fs.readFileSync(chemin.resolve(process.cwd(), 'src/ui/calendrier/entete/entete.css'), 'utf8');
    expect(css.match(/\.ent-etoiles-dessus \{([^}]*)\}/)![1]).toMatch(/z-index: [1-9]/);
    expect(css.match(/\.ent-cadre \{([^}]*)\}/)![1]).not.toMatch(/z-index/);
    // Dans l'en-tête, à 390 : la chose étoilée en S52 se voit (★ seule ou son nom étoilé, à sa semaine).
    const choses = [...(modele().choses ?? []), { id: 'c-noel', rangee: 'fetes', titre: 'Marché de Noël', mouvements: ['n52'] }] as unknown as ModeleEnTete['choses'];
    const avecNoel = courbeCaisse({ depart: 418000, lundi0: LUNDI0, mouvements: [...mouvements, { id: 'n52', jour: jour(5), centimes: 118000, nom: 'Marché de Noël' }], mises })!;
    const { container: c2 } = render(<Banc {...espions()} modele={modele({ courbe: avecNoel, creux: creuxDepuis(avecNoel), choses })} etoiles={['c-noel']} />);
    const cb = c2.querySelector('.ent-cb') as HTMLElement;
    const seule = cb.querySelector('[data-etoile-marque]');
    const nommee = cb.querySelector('[data-etoile="oui"]');
    expect(seule ? seule.getAttribute('data-semaine') : nommee!.getAttribute('data-nom-index')).toBe(seule ? '52' : '5');
  });

  const courbeTendance6 = courbeCaisse({ depart: 418000, lundi0: LUNDI0, mouvements: [
    { id: 't3', jour: jour(3), centimes: -25000, nom: 'Tendance', tendance: true },
    { id: 'loyer', jour: jour(5), centimes: -40000, nom: 'Loyer', choseId: 'c-loyer' },
    { id: 'malt', jour: jour(6), centimes: -54000, nom: 'Malt', choseId: 'c-malt' }
  ] })!;
  const rangeeDe6 = (m: { choseId?: string }) => (m.choseId === 'c-loyer' ? 'papiers' : m.choseId === 'c-malt' ? 'achats' : undefined);

  for (const paysage of [false, true]) {
    it(`n° 12 : c3-a ${paysage ? 'en paysage' : 'en portrait'} : chaque couleur du tracé a sa ligne de légende, le neutre compris`, () => {
      const { container } = render(<GrandeCourbe courbe={courbeTendance6} rangeeDe={rangeeDe6} largeur={paysage ? 622 : 390} hauteur={paysage ? 240 : 400} paysage={paysage} lecture={null} onFermer={() => undefined} />);
      const classes = new Set(Array.from(container.querySelectorAll('.ent-sgm')).map(s => /ent-c-([a-z]+)/.exec(s.getAttribute('class')!)![1]));
      expect(classes.size).toBeGreaterThan(1);
      for (const c of classes) expect(container.querySelector(`[data-legende="${c}"]`)).not.toBeNull();
      expect(container.querySelector('[data-legende="autre"]')!.textContent).toBe('rien de nommé (tendance)');
      if (paysage) expect(container.querySelector('.ent-gc-cote .ent-leg')).not.toBeNull();
    });
  }

  it('n° 18 : c3-a dit « creux S44 ’27 · … », la même forme que l’en-tête', () => {
    const s44 = courbeCaisse({ depart: 418000, lundi0: LUNDI0, mouvements: [
      { id: 'cuve', jour: jour(50), centimes: -1000000, nom: 'Cuve' },
      { id: 'vente', jour: jour(51), centimes: 900000, nom: 'Vente de fûts' }
    ] })!;
    const { container } = render(<GrandeCourbe courbe={s44} largeur={390} hauteur={400} paysage={false} lecture={null} onFermer={() => undefined} />);
    expect(container.querySelector('[data-creux-etiquette]')!.textContent).toBe(`creux S44 ’27 · ${francs(creuxDepuis(s44)!.centimes)}`);
  });

  it('n° 11 (demande du lot D) : à 390, la période reçue au montage (novembre) règle la bande, et le menu dit la même période que la barre', () => {
    largeurFenetre(390);
    const e = espions();
    const { container } = render(<Banc {...e} periodeInitiale={{ genre: 'mois', annee: 2026, mois: 11 }} largeurColonne={61} />);
    // Décision pilote (c), CRITIQUE-7 : le mois se lit dès aujourd'hui sur 4 semaines au moins (S47 – S50), jamais 3 ni 1.
    expect(bande(container).textContent).toBe('S47S48S49S50');
    const bouton = container.querySelector('[data-ent-periode]') as HTMLElement;
    expect(bouton.textContent).toBe('Nov.');
    // Aucune fenêtre locale de 6 semaines n'a été écrite en période par-dessus.
    expect(e.onPeriode).not.toHaveBeenCalled();
    fireEvent.click(bouton);
    // La plage dit les vraies semaines : « Nov. » ne veut pas dire du 1er au 30.
    const plage = document.querySelector('.ent-menu-plage') as HTMLElement;
    expect(plage.textContent).toMatch(/^Nov\. · S47 – S50 · 16 nov\. → 13 déc\.$/);
  });

  describe('CRITIQUE-7 n° 1 (E04, E07, E43) : la bande se lit à toute largeur de colonne', () => {
    const S53 = 23; // « S53 » à 14 px, 600, Source Sans 3 (repli hors navigateur de largeurEtiquetteMax)
    it('le pas des étiquettes se choisit à la largeur de colonne : 390 en 6 sem., 3 mois, 6 mois ; 1280 en 6 mois', () => {
      // Largeurs de colonne de la frise mesurées au banc (390 : 374 px utiles ; 1280 : vue centrée de 1180 px).
      expect(pasEtiquettes(374 / 6, S53)).toBe(1);
      expect(pasEtiquettes(374 / 13, S53)).toBe(1);
      expect(pasEtiquettes(374 / 26, S53)).toBe(2);
      expect(pasEtiquettes(1180 / 26, S53)).toBe(1);
      expect(pasEtiquettes(11, S53)).toBe(4);
      expect(pasEtiquettes(6, S53)).toBe('mois');
      expect(pasEtiquettes(0, S53)).toBe(1);
      // La règle elle-même : « S53 » et 4 px d'écart dans 1, 2 ou 4 colonnes.
      expect(pasEtiquettes(S53 + 4, S53)).toBe(1);
      expect(pasEtiquettes(S53 + 3.9, S53)).toBe(2);
      expect(pasEtiquettes((S53 + 4) / 4 - 0.01, S53)).toBe('mois');
    });

    const vingtSix = semainesDe(LUNDI0, 26).map(s => ({ debut: s.debut, numero: s.numero }));
    const rendreBande = (largeurColonne: number) => render(
      <div style={{ width: largeurColonne * 26 }}>
        <BandeSemaines semaines={vingtSix} courbe={null} decalage={0} mouvements={false} idees={new Set()} retards={new Set()} onDate={vi.fn()} largeurColonne={largeurColonne} />
      </div>
    );

    it('6 mois, colonne de 11 px : au plus 13 étiquettes, sur les semaines rondes, aucune trop près d’une autre ; chaque colonne garde son nom', () => {
      const { container } = rendreBande(11);
      const visibles = Array.from(container.querySelectorAll('.ent-sem'));
      expect(visibles.length).toBeGreaterThan(0);
      expect(visibles.length).toBeLessThanOrEqual(13);
      for (const v of visibles) expect(Number(v.textContent!.slice(1)) % 4).toBe(0);
      const cols = Array.from(container.querySelectorAll('[data-bande-semaines] > button'));
      expect(cols).toHaveLength(26);
      const idx = visibles.map(v => cols.indexOf(v.closest('button')!));
      for (let k = 1; k < idx.length; k++) expect((idx[k] - idx[k - 1]) * 11).toBeGreaterThanOrEqual(S53 + 4);
      // Toutes touchables, chacune avec sa date (« S50, 7 – 13 déc. »).
      expect(screen.getByRole('button', { name: 'S50, 7 – 13 déc.' })).toBeInTheDocument();
      cols.forEach(c => expect(c.getAttribute('aria-label')).toMatch(/^S\d+, \d/));
    });

    it('colonne de 14 px (6 mois à 390) : une semaine sur deux, les paires ; la fin d’année (S52, S53, S1, S2) ne colle pas', () => {
      const { container } = rendreBande(14.4);
      const textes = Array.from(container.querySelectorAll('.ent-sem')).map(v => v.textContent);
      expect(textes.length).toBeLessThanOrEqual(13);
      expect(textes.slice(0, 5)).toEqual(['S48', 'S50', 'S52', 'S2', 'S4']);
      expect(container.querySelector('[data-bande-semaines]')!.getAttribute('data-pas')).toBe('2');
    });

    it('colonne trop étroite pour une semaine sur quatre : les mois, comme l’An (N D J F…)', () => {
      const { container } = rendreBande(6);
      const textes = Array.from(container.querySelectorAll('.ent-sem')).map(v => v.textContent).join(' ');
      expect(textes).toMatch(/^(N )?D J F M A/);
    });

    it('6 semaines et 3 mois gardent une étiquette par semaine (rendu d’avant)', () => {
      const six = render(<BandeSemaines semaines={vingtSix.slice(0, 6)} courbe={null} decalage={0} mouvements={false} idees={new Set()} retards={new Set()} onDate={vi.fn()} largeurColonne={62} />);
      expect(bande(six.container).textContent).toBe('S47S48S49S50S51S52');
      six.unmount();
      const trois = render(<BandeSemaines semaines={vingtSix.slice(0, 13)} courbe={null} decalage={0} mouvements={false} idees={new Set()} retards={new Set()} onDate={vi.fn()} largeurColonne={28.7} />);
      expect(trois.container.querySelectorAll('.ent-sem')).toHaveLength(13);
    });
  });

  describe('CRITIQUE-7 n° 5 (E11) : la tête de c2-b prend la forme la plus longue qui tient', () => {
    it('formeTete : la longue quand la place mesurée suffit ; sinon sans CHF, puis sans date ; place inconnue : la longue', () => {
      const largeurs = [214, 176, 128];
      expect(formeTete(largeurs, 250)).toBe(0);
      expect(formeTete(largeurs, 214)).toBe(0);
      expect(formeTete(largeurs, 200)).toBe(1);
      expect(formeTete(largeurs, 150)).toBe(2);
      expect(formeTete(largeurs, 90)).toBe(2);
      expect(formeTete(largeurs, null)).toBe(0);
    });
  });
});

describe('CRITIQUE-9 (lot corr9-B) : le creux ancré sur son point, le glissé à 390, le focus au clavier seul, le mois de 4 semaines', () => {
  /* Le libre descend chaque semaine jusqu'au creux de S44 ’27 (index 50, lundi 1er nov. 2027), puis remonte : la forme de paysage-cave-21. */
  const courbeDescente = courbeCaisse({ depart: 300000, lundi0: LUNDI0, mouvements: [
    ...Array.from({ length: 51 }, (_, j) => ({ id: `d${j}`, jour: jour(j), centimes: -18000, nom: `Sortie ${j}` })),
    { id: 'r51', jour: jour(51), centimes: 50000, nom: 'Vente' }
  ] })!;
  const S20 = 26; // lundi 17 mai 2027

  it('n° 5 (E12) : en paysage, curseur en S20, l’étiquette du creux S44 ’27 est contre le point du creux, jamais près du curseur', () => {
    const c = creuxDe(courbeDescente.semaines)!;
    expect([c.index, c.numero]).toEqual([50, 44]);
    expect(courbeDescente.semaines[S20].numero).toBe(20);
    // Les géométries : paysage 844 × 390 (courbe à 62 % de 796 px, 240 px de haut), portrait 390, ordinateur 1280.
    for (const [largeur, hauteur, paysage] of [[796, 240, true], [390, 250, false], [1232, 560, false]] as const) {
      const { container, unmount } = render(<GrandeCourbe courbe={courbeDescente} largeur={largeur} hauteur={hauteur} paysage={paysage} lecture={S20} onFermer={vi.fn()} />);
      const fond = container.querySelector('[data-creux-fond]')!;
      const l = Number(fond.getAttribute('x')), w = Number(fond.getAttribute('width')), t = Number(fond.getAttribute('y')), h = Number(fond.getAttribute('height'));
      const pt = container.querySelector('.ent-creux-pt')!, cur = container.querySelector('.ent-cur-pt')!;
      const xC = Number(pt.getAttribute('cx')), yC = Number(pt.getAttribute('cy'));
      const xS = Number(cur.getAttribute('cx')), yS = Number(cur.getAttribute('cy'));
      const texte = w - 6;
      const msg = `${largeur}×${hauteur} : boîte ${l.toFixed(0)}–${(l + w).toFixed(0)} × ${t.toFixed(0)}–${(t + h).toFixed(0)}, creux (${xC.toFixed(0)}, ${yC.toFixed(0)}), curseur (${xS.toFixed(0)}, ${yS.toFixed(0)})`;
      // À côté du point, en x : la boîte le touche à 1 largeur de texte au plus ; en y : à 48 px au plus de sa ligne.
      const dx = Math.max(0, l - xC, xC - (l + w)), dy = Math.max(0, t - yC, yC - (t + h));
      expect(dx, msg).toBeLessThan(texte);
      expect(dy, msg).toBeLessThanOrEqual(48);
      // Le fond s'arrête à 4 px du cercle du point (r 6,5), jamais dessus.
      expect(dx, msg).toBeLessThanOrEqual(11);
      expect(dx, msg).toBeGreaterThanOrEqual(10);
      // Loin du curseur : en paysage et à 1280, le milieu de la boîte à plus de 100 px du x du curseur (à 390, S20 et S44 ne sont qu'à 154 px
      // l'une de l'autre, pour une étiquette de 160 px) ; partout, la boîte à plus de 60 px du point du curseur.
      if (paysage || largeur > 1000) expect(Math.abs(l + w / 2 - xS), msg).toBeGreaterThan(100);
      expect(Math.hypot(Math.max(0, l - xS, xS - (l + w)), Math.max(0, t - yS, yS - (t + h))), msg).toBeGreaterThan(60);
      unmount();
    }
  });

  it('n° 5 : la règle de placement elle-même — à droite du point s’il tient, sinon à gauche, jamais à plus de 48 px de sa ligne', () => {
    for (const [l, h, paysage] of [[796, 240, true], [390, 250, false], [1232, 560, false]] as const) {
      const larg = paysage ? Math.round(l * 0.62) : l;
      const g = geoGrande(courbe.semaines, larg, h);
      for (const index of [0, 10, 26, 40, 51]) {
        const v = courbe.semaines[index].libre;
        const p = placeEtiquetteCreux(courbe.semaines, g, larg, index, v, 140);
        const cx = g.x(index) + g.unit / 2;
        if (p.ancre === 'start') expect(p.boite.l).toBeCloseTo(cx + 11, 0); else expect(p.boite.r).toBeCloseTo(cx - 11, 0);
        // Elle tient à droite : elle y est.
        if (cx + 14 + 140 + 3 <= larg - 6) expect(p.ancre).toBe('start');
        expect(Math.abs(p.y - g.y(v))).toBeLessThanOrEqual(48);
      }
    }
  });

  it('n° 9 (E11, D-195) : à 390 en 6 sem., un glissé parti sur la courbe hors du cadre lit la semaine ; la fenêtre ne bouge pas', () => {
    const e = espions();
    const onLectureSemaine = vi.fn();
    const { container } = render(<Banc {...e} onLectureSemaine={onLectureSemaine} />);
    // Les zones mesurées à 390 (52 semaines de 7,5 px ; la fenêtre S47 – S52 de 0 à 45 px) : début 0 à 10 px, fin 35 à 79 px.
    const z = zonesPoignees(0, 45, 390);
    expect([Math.max(0, z.debut.l), z.debut.l + z.debut.w, z.fin.l, z.fin.l + z.fin.w]).toEqual([0, 10, 35, 79]);
    const cb = container.querySelector('.ent-cb') as HTMLElement;
    // Départ à 30 % de la courbe (117 px), hors du cadre et de ses prises.
    fireEvent.pointerDown(cb, { pointerId: 7, clientX: 117, clientY: 50, button: 0 });
    fireEvent.pointerMove(window, { pointerId: 7, clientX: 124, clientY: 51 });
    // 130 px : la semaine des six fûts inox (index 17), qui a un mouvement : le détail dit « la semaine ».
    fireEvent.pointerMove(window, { pointerId: 7, clientX: 130, clientY: 52 });
    expect(container.querySelector('.ent-t')!.textContent).toMatch(/CHF · S\d+ · \d+ \p{L}+/u);
    fireEvent.pointerUp(window, { pointerId: 7, clientX: 130 });
    expect(onLectureSemaine).toHaveBeenCalled();
    expect(onLectureSemaine.mock.calls.at(-1)![0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(e.onFenetre).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Fenêtre : S47 – S52')).toBeInTheDocument();
    expect(container.querySelector('.ent-t')!.textContent).toMatch(/CHF · S\d+ · \d+ \p{L}+/u);
    expect(container.querySelector('.ent-lu')!.textContent).toContain('la semaine');
    expect(container.querySelector('[data-cadre-tirage]')).toBeNull();
  });

  it('n° 9 : un départ dans le corps du cadre, entre les poignées, lit aussi ; un départ sur la poignée de début tire la fenêtre', () => {
    const e = espions();
    const { container } = render(<Banc {...e} onLectureSemaine={vi.fn()} />);
    const cb = container.querySelector('.ent-cb') as HTMLElement;
    fireEvent.pointerDown(cb, { pointerId: 8, clientX: 22, clientY: 50, button: 0 });
    fireEvent.pointerMove(window, { pointerId: 8, clientX: 120, clientY: 50 });
    fireEvent.pointerUp(window, { pointerId: 8, clientX: 120 });
    expect(container.querySelector('.ent-t')!.textContent).toMatch(/CHF · S\d+ · \d+ \p{L}+/u);
    expect(e.onFenetre).not.toHaveBeenCalled();
    // La poignée de début (0 à 10 px) : la fenêtre glisse de 8 semaines.
    fireEvent.pointerDown(cb, { pointerId: 9, clientX: 5, clientY: 50, button: 0 });
    fireEvent.pointerMove(window, { pointerId: 9, clientX: 65, clientY: 50 });
    fireEvent.pointerUp(window, { pointerId: 9, clientX: 65 });
    expect(e.onFenetre).toHaveBeenCalled();
    expect(e.onFenetre.mock.calls.at(-1)![0].du).not.toBe(LUNDI0);
  });

  it('doute « cadre noir sur S48 » : après un toucher, la bande se dit au doigt et son anneau de focus est retiré ; une touche du clavier le rend', async () => {
    const { container } = render(<Banc {...espions()} />);
    const col = bande(container).querySelector('[data-semaine="48"]') as HTMLButtonElement;
    fireEvent.pointerDown(col, { pointerId: 3, button: 0 });
    fireEvent.pointerUp(col, { pointerId: 3 });
    fireEvent.click(col);
    col.focus();
    expect(bande(container).getAttribute('data-doigt')).toBe('oui');
    expect(col.className).not.toMatch(/focus/);
    expect(col.getAttribute('style') ?? '').not.toMatch(/outline/);
    const fs = await import('node:fs');
    const css = fs.readFileSync('src/ui/calendrier/entete/entete.css', 'utf8');
    expect(css).toMatch(/\.ent-bd\[data-doigt\] \.ent-bd-c:focus-visible \{ outline: none; \}/);
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(bande(container).getAttribute('data-doigt')).toBeNull();
  });

  it('décision (c) : un mois montre au moins 4 semaines ; le 18 nov. 2026, S47 à S50 ; le 2 nov., tout novembre ; jamais une semaine seule', () => {
    const nov: Periode = { genre: 'mois', annee: 2026, mois: 11 };
    const f18 = fenetreDePeriode(nov, '2026-11-16', 52)!;
    expect(f18).toEqual({ du: '2026-11-16', semaines: 4 });
    expect(semainesDe(f18.du, f18.semaines).map(s => s.numero)).toEqual([47, 48, 49, 50]);
    expect(ajouterJours(f18.du, f18.semaines * 7 - 1) > '2026-11-30').toBe(true);
    const f2 = fenetreDePeriode(nov, '2026-11-02', 52)!;
    expect(f2).toEqual({ du: '2026-11-02', semaines: 5 });
    expect(semainesDe(f2.du, f2.semaines).map(s => s.numero)).toEqual([45, 46, 47, 48, 49]);
    expect(fenetreDePeriode(nov, '2026-11-30', 52)!.semaines).toBe(4);
    // Le 18 nov., par l'en-tête : la fenêtre écrite va de S47 à S50.
    const e = espions();
    render(<Banc {...e} periodeInitiale={nov} />);
    expect(e.onFenetre).toHaveBeenCalledWith({ du: '2026-11-16', semaines: 4 });
    expect(screen.getByLabelText('Fenêtre : S47 – S50')).toBeInTheDocument();
  });
});

describe('CRITIQUE-10 (lot corr10-B) : c2-b au doigt à 390 ne touche jamais ±, le focus au clavier seul', () => {
  /* La semaine d'index 22 (S17 ’27) a quatre mouvements : le détail dit le plus gros, « +3 autres » et « la semaine ». */
  const courbeChargee = courbeCaisse({ depart: 418000, lundi0: LUNDI0, mises, mouvements: [
    ...mouvements,
    { id: 'n1', jour: jour(22), centimes: -60000, nom: 'Houblons' },
    { id: 'n2', jour: jour(22), centimes: -12000, nom: 'Étiquettes' },
    { id: 'n3', jour: jour(22), centimes: -8000, nom: 'Capsules' },
    { id: 'n4', jour: jour(22), centimes: 30000, nom: 'Ventes du marché' }
  ] })!;
  const modeleCharge = (): ModeleEnTete => ({ ...modele(), courbe: courbeChargee, creux: creuxDepuis(courbeChargee) });
  const plusMoins = () => screen.getByTitle('Afficher les + et − et les icônes de chaque semaine');

  it('n° 6 (E11, D-195) : un glissé tactile de 80 px parti de la courbe hors du cadre lit la semaine ; ± ne change pas ; au lâcher, 3 lignes', () => {
    const e = espions();
    const onMouvements = vi.fn();
    const { container } = render(<Banc {...e} modele={modeleCharge()} onMouvements={onMouvements} onLectureSemaine={vi.fn()} />);
    const cb = container.querySelector('.ent-cb') as HTMLElement;
    expect(plusMoins().getAttribute('aria-pressed')).toBe('false');
    // 390 en 6 sem. : prises 0 à 10 et 35 à 79 px. Départ à 88 px (22,6 % de la courbe), hors du cadre ; 80 px à droite : 168 px, l'index 22.
    fireEvent.pointerDown(cb, { pointerId: 21, pointerType: 'touch', clientX: 88, clientY: 30, button: 0 });
    for (let x = 96; x <= 168; x += 8) fireEvent.pointerMove(window, { pointerId: 21, pointerType: 'touch', clientX: x, clientY: 31 });
    // Doigt tenu : la tête de sa maquette (« 3 801 CHF · S12 · 22 mars −487 »), les boutons de tête restent, ± fermé.
    const tete = container.querySelector('.ent-t')!;
    expect(tete.textContent).toMatch(/CHF · S\d+ · \d+ \S+/);
    expect(tete.querySelector('.ent-lit em')!.textContent).toBe(`S${courbeChargee.semaines[22].numero}`);
    for (const s of ['.ent-mb', '.ent-per', '.ent-pl']) expect(tete.querySelector(s)).not.toBeNull();
    expect(plusMoins().getAttribute('aria-pressed')).toBe('false');
    // Au lâcher, le clic fabriqué tombe sur la courbe ; le détail de 3 lignes reste sous la bande.
    fireEvent.pointerUp(window, { pointerId: 21, pointerType: 'touch', clientX: 168 });
    fireEvent.click(cb, { detail: 1 });
    const lu = container.querySelector('.ent-lu')!.textContent!;
    expect(lu).toContain('Houblons');
    expect(lu).toContain('+3 autres');
    expect(lu).toContain('la semaine');
    expect(plusMoins().getAttribute('aria-pressed')).toBe('false');
    expect(onMouvements).not.toHaveBeenCalled();
    expect(e.onFenetre).not.toHaveBeenCalled();
  });

  it('n° 6 : un toucher bref sur le haut de la courbe dont Chrome rabat le clic sur ± ne bascule pas ± ; un vrai toucher sur ± le bascule', () => {
    const { container } = render(<Banc {...espions()} />);
    const cb = container.querySelector('.ent-cb') as HTMLElement;
    // Mesuré à 390 (mesures.txt, avant) : un doigt de 16 px posé 6 à 10 px sous ± le basculait ; pointerdown sur la courbe, clic sur ±.
    fireEvent.pointerDown(cb, { pointerId: 22, pointerType: 'touch', clientX: 229, clientY: 8, button: 0 });
    fireEvent.pointerUp(window, { pointerId: 22, pointerType: 'touch', clientX: 229 });
    fireEvent.click(plusMoins(), { detail: 1 });
    expect(plusMoins().getAttribute('aria-pressed')).toBe('false');
    // De même pour la période (son menu ne s'ouvre pas).
    fireEvent.pointerDown(cb, { pointerId: 23, pointerType: 'touch', clientX: 278, clientY: 8, button: 0 });
    fireEvent.pointerUp(window, { pointerId: 23, pointerType: 'touch', clientX: 278 });
    const per = container.querySelector('[data-ent-periode]') as HTMLElement;
    fireEvent.click(per, { detail: 1 });
    expect(per.getAttribute('aria-expanded')).toBe('false');
    // Un vrai toucher sur ± juste après : son pointerdown met fin à l'attente, son clic passe.
    fireEvent.pointerDown(plusMoins(), { pointerId: 24, pointerType: 'touch', button: 0 });
    fireEvent.click(plusMoins());
    expect(plusMoins().getAttribute('aria-pressed')).toBe('true');
  });

  it('n° 6 : un doigt posé dans la courbe que Chrome rabat sur ⛶ (pointerdown sur le bouton, coordonnées brutes dans la courbe) reste un geste de la courbe', () => {
    largeurFenetre(390);
    const { container } = render(<Banc {...espions()} />);
    const cb = container.querySelector('.ent-cb') as HTMLElement;
    // Les boîtes de Chrome à 390 (mesures.txt) : la courbe 12–378 × 64–174 ; ⛶ 350–374 × 36–64.
    const rect = { left: 12, top: 64, right: 378, bottom: 174, width: 366, height: 110, x: 12, y: 64 };
    vi.spyOn(cb, 'getBoundingClientRect').mockReturnValue({ ...rect, toJSON: () => rect } as DOMRect);
    const pl = screen.getByRole('button', { name: 'Plein écran' });
    // Toucher bref à (362, 66) : mesuré dans Chrome, pointerdown, mousedown et click vont à ⛶. Rien ne se passe : ni plein écran, ni invitation.
    const pd = fireEvent.pointerDown(pl, { pointerId: 31, pointerType: 'touch', clientX: 362, clientY: 66, button: 0 });
    expect(pd, 'le pointerdown est empêché (ni focus ni souris sur ⛶)').toBe(false);
    fireEvent.pointerUp(window, { pointerId: 31, pointerType: 'touch', clientX: 362 });
    fireEvent.click(pl, { detail: 1 });
    expect(container.querySelector('[data-info="invite"]')).toBeNull();
    expect(screen.getByRole('button', { name: 'Plein écran' })).toBeInTheDocument();
    // Glissé parti au même endroit : la tête lit la semaine, ± reste fermé.
    fireEvent.pointerDown(pl, { pointerId: 32, pointerType: 'touch', clientX: 362, clientY: 66, button: 0 });
    for (let x = 354; x >= 282; x -= 8) fireEvent.pointerMove(window, { pointerId: 32, pointerType: 'touch', clientX: x, clientY: 67 });
    expect(container.querySelector('.ent-t')!.textContent).toMatch(/CHF · S\d+ · \d+ \S+/);
    fireEvent.pointerUp(window, { pointerId: 32, pointerType: 'touch', clientX: 282 });
    fireEvent.click(pl, { detail: 1 });
    expect(plusMoins().getAttribute('aria-pressed')).toBe('false');
    expect(container.querySelector('[data-info="invite"]')).toBeNull();
    // Un vrai toucher sur ⛶ (au-dessus de la courbe) n'est pas détourné.
    const vrai = fireEvent.pointerDown(pl, { pointerId: 33, pointerType: 'touch', clientX: 362, clientY: 50, button: 0 });
    expect(vrai).toBe(true);
  });

  it('n° 6 : la courbe répond elle-même au toucher (écouteur click sur son nœud), pour que l’ajustement tactile ne cherche pas ± à côté', () => {
    const espion = vi.spyOn(HTMLElement.prototype, 'addEventListener');
    const { container } = render(<Banc {...espions()} />);
    const cb = container.querySelector('.ent-cb');
    expect(espion.mock.contexts.some((ctx, i) => ctx === cb && espion.mock.calls[i][0] === 'click')).toBe(true);
  });

  it('n° 6 : en portrait, la zone de toucher de ± (et des boutons de tête) a 44 px de haut et s’arrête au haut de la courbe : le point de départ du glissé n’y est jamais', async () => {
    const fs = await import('node:fs');
    const css = fs.readFileSync('src/ui/calendrier/entete/entete.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    // La règle `::after` de ± qui vaut en portrait : la dernière dont un sélecteur finit par `.ent-mb::after` hors paysage.
    const regles = Array.from(css.matchAll(/([^{}]+)\{([^{}]*)\}/g)).filter(([, sel]) => sel.split(',').some(s => /\.ent-mb::after\s*$/.test(s.trim()) && !s.includes('ent--paysage')));
    expect(regles.length).toBeGreaterThan(0);
    const inset = regles.at(-1)![2].match(/inset:\s*([^;]+);/)![1].trim().split(/\s+/).map(v => parseFloat(v));
    const [haut, droite, bas, gauche] = inset.length === 1 ? [inset[0], inset[0], inset[0], inset[0]] : inset.length === 2 ? [inset[0], inset[1], inset[0], inset[1]] : inset.length === 3 ? [inset[0], inset[1], inset[2], inset[1]] : inset;
    // Les boîtes mesurées à 390 × 844 dans Chrome (mesures.txt) : ± 215–243 × 36–64, la courbe 12–378 × 64–174 (la tête la touche).
    const pm = { l: 215, t: 36, r: 243, b: 64 }, courbe390 = { l: 12, t: 64, w: 366, h: 110 };
    const zone = { l: pm.l + gauche, t: pm.t + haut, r: pm.r - droite, b: pm.b - bas };
    const dans = (x: number, y: number) => x >= zone.l && x < zone.r && y >= zone.t && y < zone.b;
    expect(zone.b - zone.t, 'hauteur de la zone de ±').toBeGreaterThanOrEqual(44);
    expect(zone.b, 'bas de la zone de ± contre le haut de la courbe').toBeLessThanOrEqual(courbe390.t);
    // Le point de départ donné au lot D (50 % de la courbe, 25 % de sa hauteur) et chaque point de la courbe sous ± : hors de la zone.
    expect(dans(courbe390.l + courbe390.w * 0.5, courbe390.t + courbe390.h * 0.25)).toBe(false);
    for (let x = zone.l; x <= zone.r; x += 2) for (let y = courbe390.t; y < courbe390.t + courbe390.h; y += 2) expect(dans(x, y), `(${x}, ${y})`).toBe(false);
  });

  it('doute m27 : après un toucher sur ±, l’en-tête se dit au doigt et l’anneau de focus des boutons de tête est retiré ; une touche du clavier le rend', async () => {
    const { container } = render(<Banc {...espions()} />);
    const racine = container.querySelector('[data-calendrier-entete]') as HTMLElement;
    fireEvent.pointerDown(plusMoins(), { pointerId: 25, pointerType: 'touch', button: 0 });
    fireEvent.click(plusMoins());
    plusMoins().focus();
    expect(racine.getAttribute('data-doigt')).toBe('oui');
    const fs = await import('node:fs');
    const css = fs.readFileSync('src/ui/calendrier/entete/entete.css', 'utf8');
    expect(css).toMatch(/\.ent\[data-doigt\] \.ent-t button:focus-visible \{ outline: none; \}/);
    // Jamais `:focus` seul sur les boutons de tête : le cadre reste au clavier (`:focus-visible`).
    expect(css).not.toMatch(/\.ent-(mb|per|pl|ret-b|k)[^,{]*:focus(?!-visible)/);
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(racine.getAttribute('data-doigt')).toBeNull();
  });
});

describe('CRITIQUE-11 (lot corr11-C) : la Liste porte l’en-tête de la frise ; ni chiffre d’axe ni nom barré', () => {
  const zoneBande = (c: HTMLElement) => c.querySelector('.ent-bz') as HTMLElement;
  const cadreDe = (c: HTMLElement) => (c.querySelector('.ent-cadre') as HTMLElement).getAttribute('aria-label');
  const fen = (semaines: number): FenetreSemaines => ({ du: LUNDI0, semaines });
  const menu = () => within(screen.getByRole('dialog', { name: 'Période et vue' }));
  const vu = (vue: VueCalendrier, semaines: number, e = espions()) => render(<Banc {...e} vueInitiale={vue} periodeInitiale={periodeDeFenetre(fen(semaines))} />);

  it('n° 1 (E13, E40) : Liste en An = la bande de l’An (12 mois, creux cerclé), aucun « S\\d+ » dans la bande, cadre « nov. – nov. 2027 »', () => {
    const an = vu('annee', 52);
    const bandeAn = zoneBande(an.container).textContent;
    const cadreAn = cadreDe(an.container);
    an.unmount();
    const e = espions();
    const li = vu('liste', 52, e);
    expect(li.container.querySelector('[data-bande-annee]')).not.toBeNull();
    expect(li.container.querySelector('[data-bande-semaines]')).toBeNull();
    expect(zoneBande(li.container).textContent).toBe(bandeAn);
    expect(zoneBande(li.container).textContent).not.toMatch(/S\d+/);
    expect(cadreAn).toBe('Fenêtre : nov. – nov. 2027');
    expect(cadreDe(li.container)).toBe(cadreAn);
    expect(li.container.querySelector('.ent-an-creux')).not.toBeNull();
    // Le menu le dit : « An » actif ; « Calendrier » ramène à la frise de l'An, jamais à 52 colonnes de semaines.
    fireEvent.click(li.container.querySelector('[data-ent-periode]') as HTMLElement);
    expect(menu().getByRole('button', { name: 'An' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(menu().getByRole('button', { name: 'Calendrier' }));
    expect(e.onVue).toHaveBeenLastCalledWith('annee');
  });

  it('n° 1 : en Liste, choisir une durée garde la Liste ; la poignée de l’An ramène à la fenêtre d’avant, toujours en Liste', () => {
    const e = espions();
    const li = vu('liste', 52, e);
    fireEvent.click(li.container.querySelector('[data-ent-periode]') as HTMLElement);
    fireEvent.click(menu().getByRole('button', { name: '6 mois' }));
    expect(e.onVue).not.toHaveBeenCalled();
    expect(e.onFenetre).toHaveBeenLastCalledWith({ du: LUNDI0, semaines: 26 });
    expect(li.container.querySelector('[data-bande-semaines]')).not.toBeNull();
    fireEvent.click(li.container.querySelector('[data-ent-periode]') as HTMLElement);
    fireEvent.click(menu().getByRole('button', { name: 'An' }));
    expect(e.onVue).not.toHaveBeenCalled();
    expect(li.container.querySelector('[data-bande-annee]')).not.toBeNull();
    const [, fin] = screen.getAllByRole('button', { name: /Revenir à la fenêtre d’avant/ });
    fireEvent.pointerDown(fin, { pointerId: 1, clientX: 390, button: 0 });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 390 });
    expect(e.onVue).not.toHaveBeenCalled();
    expect(e.onFenetre).toHaveBeenLastCalledWith({ du: LUNDI0, semaines: 26 });
  });

  it.each([13, 26])('n° 1 : Liste en %i semaines = la bande et le cadre de la frise', semaines => {
    const fr = vu('semaines', semaines);
    const bandeFr = zoneBande(fr.container).textContent;
    const cadreFr = cadreDe(fr.container);
    fr.unmount();
    const li = vu('liste', semaines);
    expect(zoneBande(li.container).textContent).toBe(bandeFr);
    expect(cadreDe(li.container)).toBe(cadreFr);
    expect(cadreFr).toMatch(/^Fenêtre : S47 – S\d+/);
  });

  /** Les traits d'un chemin `M x y H x V y` (escalier, curseur), en boîtes de `demi` px de part et d'autre. */
  const traits = (d: string, demi: number) => {
    const out: { l: number; r: number; t: number; b: number }[] = [];
    let x = 0, y = 0;
    for (const m of d.matchAll(/([MHVL])\s*(-?[\d.]+)(?:[\s,]+(-?[\d.]+))?/g)) {
      const a = Number(m[2]);
      if (m[1] === 'M') { x = a; y = Number(m[3]); continue; }
      if (m[1] === 'H') { out.push({ l: Math.min(x, a), r: Math.max(x, a), t: y - demi, b: y + demi }); x = a; }
      if (m[1] === 'V') { out.push({ l: x - demi, r: x + demi, t: Math.min(y, a), b: Math.max(y, a) }); y = a; }
    }
    return out;
  };
  const coupe = (a: { l: number; r: number; t: number; b: number }, b: { l: number; r: number; t: number; b: number }) => a.l < b.r && b.l < a.r && a.t < b.b && b.t < a.b;

  it('n° 6 (E02, f1-a) : aucune ligne de la courbe zoomée ne traverse un chiffre d’axe ; chacun a son fond', async () => {
    const { CourbeZoom } = await import('../../src/ui/calendrier/entete/Courbe');
    // Comme m390-clair-09 : l'avant et l'après partent juste au-dessus d'une graduation (2 000), à gauche, là où l'axe écrit son chiffre.
    const avant = [205000, 205000, 160000, 165000, 150000, 240000, 240000, 236000, 230000, 230000, 225000, 210000, 205000, 200000, 198000, 195000, 190000, 185000, 180000, 170000, 160000, 150000, 140000, 130000, 120000, 110000];
    const apres = avant.map((v, i) => (i >= 3 && i < 9 ? v - 30000 : v));
    const { container } = render(<CourbeZoom avant={avant} apres={apres} largeur={390} hauteur={100} />);
    const lignes = ['.ent-avant', '.ent-apres'].flatMap(s => traits(container.querySelector(s)!.getAttribute('d')!, 1.75));
    const textes = Array.from(container.querySelectorAll('text.ent-axe'));
    expect(textes.length).toBeGreaterThan(0);
    for (const t of textes) {
      const x = Number(t.getAttribute('x')), y = Number(t.getAttribute('y'));
      const boite = { l: x, r: x + largeurTexte(t.textContent ?? ''), t: y - 11, b: y + 3 };
      const barre = lignes.find(l => coupe(boite, l));
      expect(barre, `« ${t.textContent} » (${x}, ${y}) barré par ${JSON.stringify(barre)}`).toBeUndefined();
      expect(t.previousElementSibling?.classList.contains('ent-axe-fond'), `« ${t.textContent} » sans fond`).toBe(true);
    }
  });

  it('doute c2-b (E11) : le curseur est peint avant les noms, et son trait ne traverse aucun nom', () => {
    let croisements = 0;
    for (let i = 0; i < courbe.semaines.length; i++) {
      const { container, unmount } = render(<Courbe courbe={courbe.semaines} largeur={390} hauteur={110} curseur={i} />);
      const svg = container.querySelector('svg.ent-svg') as SVGSVGElement;
      const enfants = Array.from(svg.children);
      const iCurseur = enfants.findIndex(n => n.hasAttribute('data-curseur'));
      const iNom = enfants.findIndex(n => !!n.querySelector('[data-nom-courbe]') || n.getAttribute('data-mise-de-cote') === 'etiquette');
      expect(iCurseur).toBeGreaterThan(-1);
      if (iNom > -1) expect(iCurseur).toBeLessThan(iNom);
      const g = svg.querySelector('[data-curseur]')!;
      const ligne = g.querySelector('line');
      const d = ligne ? `M${ligne.getAttribute('x1')} ${ligne.getAttribute('y1')}V${ligne.getAttribute('y2')}` : g.querySelector('path')!.getAttribute('d')!;
      const trait = traits(d, 0.75);
      const xC = trait[0]?.l ?? 0;
      for (const t of Array.from(svg.querySelectorAll('text.ent-nom'))) {
        const x = Number(t.getAttribute('x')), y = Number(t.getAttribute('y'));
        const w = largeurTexte(t.textContent ?? '');
        const ancre = t.getAttribute('text-anchor') ?? 'start';
        const l = ancre === 'end' ? x - w : ancre === 'middle' ? x - w / 2 : x;
        // Le cœur du texte (4 px de marge de chaque côté : l'estimation de largeur est approchée) ; de haut des capitales à la ligne de base.
        const boite = { l: l + 4, r: l + w - 4, t: y - 10, b: y };
        if (xC < boite.l || xC > boite.r) continue;
        croisements++;
        expect(trait.some(s => coupe(s, boite)), `S${courbe.semaines[i].numero} : le curseur barre « ${t.textContent} »`).toBe(false);
      }
      unmount();
    }
    expect(croisements).toBeGreaterThan(0);
  });
});

describe('CRITIQUE-12 n° 5 (lot corr12-C) : en mode graph, la légende ne passe jamais sous le + volant (E12, E35)', () => {
  // Une semaine à tendance seule (le neutre « rien de nommé (tendance) ») et deux mouvements nommés de deux rangées.
  const courbeLeg = courbeCaisse({ depart: 418000, lundi0: LUNDI0, mouvements: [
    { id: 't3', jour: jour(3), centimes: -25000, nom: 'Tendance', tendance: true },
    { id: 'loyer', jour: jour(5), centimes: -40000, nom: 'Loyer', choseId: 'c-loyer' },
    { id: 'malt', jour: jour(6), centimes: -54000, nom: 'Malt', choseId: 'c-malt' }
  ] })!;
  const rangeeLeg = (m: { choseId?: string }) => (m.choseId === 'c-loyer' ? 'papiers' : m.choseId === 'c-malt' ? 'achats' : undefined);

  it('en portrait : « rien de nommé (tendance) » entier, et la légende porte la réserve du + (sa ligne basse finit à sa gauche)', () => {
    const { container } = render(<GrandeCourbe courbe={courbeLeg} rangeeDe={rangeeLeg} largeur={390} hauteur={400} paysage={false} lecture={null} onFermer={() => undefined} />);
    const leg = container.querySelector('[data-vue="graph"] .ent-leg')!;
    expect(leg.querySelector('[data-legende="autre"]')!.textContent).toBe('rien de nommé (tendance)');
    expect(leg.classList.contains('ent-leg--plus')).toBe(true);
    expect(leg.getAttribute('data-reserve-plus')).toBe('oui');
  });

  it('en paysage : la légende vit dans la colonne du détail, sans la réserve du portrait', () => {
    const { container } = render(<GrandeCourbe courbe={courbeLeg} rangeeDe={rangeeLeg} largeur={622} hauteur={240} paysage lecture={null} onFermer={() => undefined} />);
    const leg = container.querySelector('.ent-gc-cote .ent-leg')!;
    expect(leg.querySelector('[data-legende="autre"]')!.textContent).toBe('rien de nommé (tendance)');
    expect(leg.classList.contains('ent-leg--plus')).toBe(false);
  });

  it('la réserve vaut la largeur du + (`--plus-cote`), posée en fin de légende : la dernière ligne s’arrête 12 px à gauche du +', async () => {
    const fs = await import('node:fs');
    const css = fs.readFileSync('src/ui/calendrier/entete/entete.css', 'utf8');
    // la légende va jusqu'au bord droit du + (padding-right 0) ; réserve = + + 4 px, écart 8 px : 12 px libres à gauche du +
    expect(css).toMatch(/\.ent-leg--plus \{[^}]*column-gap: 8px;[^}]*padding-right: 0/);
    expect(css).toMatch(/\.ent-leg--plus::after \{[^}]*content: '';[^}]*flex: 0 0 calc\(var\(--plus-cote, 56px\) \+ 4px\)/);
    expect(css).toMatch(/\.ent-gc-dp \{[^}]*min-height: 94px/);
    // aucun terme coupé : chaque terme reste sur une ligne, la légende passe à la ligne entre les termes
    expect(css).toMatch(/\.ent-leg li \{[^}]*white-space: nowrap/);
  });

  it('la place du détail ne bouge pas avec la semaine lue : la légende reste à la même hauteur (S17 la poussait sous les onglets)', () => {
    const { container, rerender } = render(<GrandeCourbe courbe={courbeLeg} rangeeDe={rangeeLeg} largeur={390} hauteur={400} paysage={false} lecture={null} onFermer={() => undefined} />);
    expect(container.querySelector('[data-detail-place]')).not.toBeNull();
    rerender(<GrandeCourbe courbe={courbeLeg} rangeeDe={rangeeLeg} largeur={390} hauteur={400} paysage={false} lecture={5} onFermer={() => undefined} />);
    expect(container.querySelector('[data-detail-place] .ent-gc-d')!.textContent).toMatch(/^S\d+, /);
  });

  it('le haut de la légende : sa première ligne finit au-dessus du +, la dernière seule est à sa hauteur ; sans +, deux lignes au-dessus des onglets', () => {
    // 390 × 844 : onglets à 804, + de 736 à 792 (mesurés au banc)
    expect(hautLegende(804, 736)).toBe(736 - LIGNE_LEGENDE);
    expect(hautLegende(804, 736) + LIGNE_LEGENDE).toBeLessThanOrEqual(736);
    expect(hautLegende(804, null) + 2 * LIGNE_LEGENDE).toBeLessThanOrEqual(804);
    // un + plus bas que les onglets (caché, hors de l'écran) ne compte pas plus que les onglets
    expect(hautLegende(804, 900)).toBe(hautLegende(804, null));
  });

  it('doute c2-b (E11) : l’anneau du curseur passe sous chaque nom placé (masque à 2 px de sa boîte), le point de lecture reste entier', () => {
    const courbeC2b = courbeCaisse({ depart: 418000, lundi0: LUNDI0, mouvements })!;
    for (const i of [4, 12, 21, 34]) {
      const { container, unmount } = render(<Courbe courbe={courbeC2b.semaines} largeur={390} hauteur={110} curseur={i} />);
      const g = container.querySelector('[data-curseur]')!;
      const anneau = g.querySelector('[data-curseur-anneau]')!;
      const id = /url\(#(.+)\)/.exec(anneau.getAttribute('mask') ?? '')?.[1];
      expect(id, `S${i} : l'anneau sans masque`).toBeTruthy();
      const masque = g.querySelector(`mask[id="${id}"]`)!;
      const visibles = Array.from(container.querySelectorAll('.ent-nom-g:not(.ent-nom-cache) [data-nom-courbe]'));
      expect(masque.querySelectorAll('[data-curseur-trou]').length).toBeGreaterThanOrEqual(visibles.length);
      expect(g.querySelector('.ent-cur-pt')!.hasAttribute('mask')).toBe(false);
      unmount();
    }
  });
});
