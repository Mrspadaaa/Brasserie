import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { EnTeteCalendrier, type EnTeteCalendrierProps, type ModeleEnTete, type VueCalendrier } from '../../src/ui/calendrier/entete/EnTete';
import { periodeDeFenetre, type FenetreSemaines } from '../../src/ui/calendrier/entete/Fenetre';
import type { Periode } from '../../src/components/periode/periode';
import { ajouterJours, francs, semainesDe, type Retard } from '../../src/domain/calendrier';
import { courbeCaisse, courbeDecalee, creuxDepuis, type MouvementCaisse } from '../../src/domain/calendrierCaisse';
import { HAUTEUR_MOIS, boiteEtiquette, boitesSeCroisent, creuxDe, geometrie, maxNoms, obstaclesCourbe, placerNoms } from '../../src/ui/calendrier/entete/Courbe';
import { useOrientation } from '../../src/ui/calendrier/useOrientation';

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
    expect(svg.textContent).toContain('Embouteilleuse −2 800');
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
    const cle = screen.getByRole('button', { name: new RegExp(`CHF à dépenser sans passer sous 0 \\(S${creux.numero}\\)`) });
    fireEvent.click(cle);
    const carte = screen.getByLabelText(`Le creux de S${creux.numero} : ses causes`);
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
    expect(screen.getByLabelText(/^Fenêtre : S47 – S\d+$/).getAttribute('aria-label')).not.toBe('Fenêtre : S47 – S52');
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 345 });
    expect(e.onVue).toHaveBeenCalledWith('annee');
  });

  it('B5 : lâchée avant, la fenêtre revient et le message dit de tirer jusqu’au bout', () => {
    const e = espions();
    render(<Banc {...e} />);
    fireEvent.pointerDown(poignee(), { pointerId: 1, clientX: 45, button: 0 });
    fireEvent.pointerMove(window, { pointerId: 1, clientX: 150 });
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 150 });
    expect(e.onVue).not.toHaveBeenCalled();
    expect(screen.getByText('Tire jusqu’au bout : l’année')).toBeInTheDocument();
    expect(screen.getByLabelText('Fenêtre : S47 – S52')).toBeInTheDocument();
  });

  it('E13 : dans l’année, la bande passe en 12 mois, le mois du creux est cerclé avec son montant, et la poignée ramène à la fenêtre d’avant', () => {
    const e = espions();
    const { container } = render(<Banc {...e} vueInitiale="annee" />);
    const an = container.querySelector('[data-bande-annee]') as HTMLElement;
    expect(an.querySelectorAll('.ent-an-m')).toHaveLength(12);
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
    expect(screen.getByText('S15 · 12 avr.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /à dépenser/ })).toBeNull();
    expect(onLectureSemaine).toHaveBeenLastCalledWith(ajouterJours(LUNDI0, 21 * 7));
    fireEvent.pointerUp(window, { pointerId: 1, clientX: 160 });
    // Sous la bande, le détail : « la semaine » et son total.
    expect(container.querySelector('.ent-lu')!.textContent).toContain('la semaine');
    fireEvent.pointerDown(document.body);
    expect(screen.queryByText('S15 · 12 avr.')).toBeNull();
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
    // La grande courbe a pris la place : la courbe en grand, sa légende une fois, le creux marqué, aucune bande.
    const grande = screen.getByLabelText('La courbe en grand');
    expect(grande.querySelector('.ent-creux-pt')).not.toBeNull();
    expect(container.querySelectorAll('.ent-leg')).toHaveLength(1);
    // Chaque segment a la couleur de la rangée de son plus gros mouvement (Embouteilleuse : Achats ; Festival : Fêtes ; Frigo : Travaux).
    expect(grande.querySelector('.ent-sgm.ent-c-achat')).not.toBeNull();
    expect(grande.querySelector('.ent-sgm.ent-c-fete')).not.toBeNull();
    expect(grande.querySelector('.ent-sgm.ent-c-travaux')).not.toBeNull();
    // La légende, une fois : les quatre rangées présentes, chacune un seul mot.
    const legende = container.querySelector('.ent-leg')!;
    expect(Array.from(legende.querySelectorAll('li')).map(li => li.textContent).sort()).toEqual(['Achats', 'Fêtes', 'Travaux', 'Ventes']);
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
    render(<Banc {...espions()} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Plein écran' })); });
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
    expect(lock).toHaveBeenCalledWith('landscape');
    expect(requestFullscreen.mock.invocationCallOrder[0]).toBeLessThan(lock.mock.invocationCallOrder[0]);
    expect(screen.getByText('Tourne le téléphone : 13 semaines')).toBeInTheDocument();
    delete (document.documentElement as unknown as Record<string, unknown>).requestFullscreen;
    delete (window.screen as unknown as Record<string, unknown>).orientation;
  });

  it('B8 : quand le verrou prend, aucune invitation', async () => {
    Object.defineProperty(document.documentElement, 'requestFullscreen', { value: vi.fn().mockResolvedValue(undefined), configurable: true });
    Object.defineProperty(window.screen, 'orientation', { value: { lock: vi.fn().mockResolvedValue(undefined) }, configurable: true });
    render(<Banc {...espions()} />);
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Plein écran' })); });
    expect(screen.queryByText(/Tourne le téléphone/)).toBeNull();
    delete (document.documentElement as unknown as Record<string, unknown>).requestFullscreen;
    delete (window.screen as unknown as Record<string, unknown>).orientation;
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

  it('placerNoms à 390 sur les 8 mouvements de z2s : au moins 6 noms, une ligne chacun, aucune boîte croisée, ni avec le chiffre clé ni avec l’étiquette de la fenêtre', () => {
    const noms = placerNoms(cz.semaines, g, maxNoms(390), [cleBoite, ...obstaclesCourbe(g, cadre, creuxDe(cz.semaines))]);
    const mouvementsNommes = noms.filter(e => e.genre === 'mouvement');
    expect(mouvementsNommes.length).toBeGreaterThanOrEqual(6);
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
    expect(cle.textContent).toBe(`${francs(creux.centimes)}CHF à dépenser ·S${creux.numero}`);
    expect(cle.querySelector('.ent-k-s')).toBeNull();
    const fs = await import('node:fs');
    const chemin = await import('node:path');
    const css = fs.readFileSync(chemin.resolve(process.cwd(), 'src/ui/calendrier/entete/entete.css'), 'utf8');
    const regle = css.match(/\n\.ent-k \{([^}]*)\}/)![1];
    expect(regle).toContain('flex-wrap: nowrap');
    expect(regle).toContain('white-space: nowrap');
    expect(regle).toContain('height: 28px');
  });

  it('les noms rendus à 390 : au moins 6, chacun sur une ligne (aucun tspan qui passe à la ligne)', () => {
    const { container } = render(<Banc {...espions()} modele={modele({ courbe: cz, creux: creuxDepuis(cz) })} />);
    const noms = container.querySelectorAll('[data-nom-courbe]');
    expect(noms.length).toBeGreaterThanOrEqual(6);
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
    expect(screen.getByText(/^Le creux de S\d+ : ses causes$/)).toBeVisible();
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
    expect(etiquette.textContent).toBe('nov. – oct.');
    expect(container.textContent).not.toMatch(/S47 – S45/);
    const lettres = Array.from(container.querySelectorAll('[data-bande-annee] .ent-an-l')).map(e => e.textContent);
    expect(lettres).toEqual(['N', 'D', 'J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O']);
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
    expect(screen.getByText(/^Le creux de S\d+ : ses causes$/)).toBeInTheDocument();
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
    const tailles = [...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)].map(m => Number(m[1]));
    expect(tailles.length).toBeGreaterThan(10);
    expect(Math.min(...tailles)).toBeGreaterThanOrEqual(14);
    for (const s of sources.slice(1)) expect(s).not.toContain('type="number"');
  });
});
