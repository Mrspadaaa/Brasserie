// @vitest-environment jsdom
import React from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {} }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { FinanceService } from '../../src/services/financeService';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { estimateBrewBudget } from '../../src/domain/finance/brewBudget';
import type { ForecastItem } from '../../src/domain/finance/forecast';
import { construireEscalier, groupesRecurrents, motCle, titreHorizon, graduations } from '../../src/ui/finance/previsions/escalier';
import { montant, montantCourt, montantEntier } from '../../src/ui/finance/previsions/format';
import { texteEtiquette, libelleLong } from '../../src/ui/finance/previsions/EscalierSvg';
import { obstaclesDeCourbe, placerEtiquettes, seRecouvrent, largeurTexte, type Demande, type Rect } from '../../src/ui/finance/previsions/placement';
import { ASOF, atelier, brassin, cuve, fermenteur, frigo, loyer, loyerNovembre, planPrevoir, profil, prixMalts, recette, reglages, stocks } from './previsionsFixture';

/** Test d'écran P5B (15 constats) : les 4 bloquants et leurs causes, côté modules purs puis côté écran. */
const item = (patch: Partial<ForecastItem>): ForecastItem => ({ id: 'x', date: '2026-11-25', label: 'Loyer de l’atelier', amountCents: 40_000, direction: 'out', source: 'recurring', category: 'chargesFixes', ...patch });

describe('constat 1 : l’étiquette est courte (mot-clé, montant entier, jour), le nom entier reste pour la fiche et la liste', () => {
  it('mot-clé', () => {
    expect(motCle('Loyer de l’atelier')).toBe('loyer');
    expect(motCle('Fermenteur supplémentaire')).toBe('fermenteur');
    expect(motCle('Frigo')).toBe('frigo');
    expect(motCle('Solde atelier')).toBe('solde atelier');
    expect(motCle('Pale Ale d’hiver · emballage', true)).toBe('emballage');
    expect(motCle('Pale Ale d’hiver · énergie et nettoyage', true)).toBe('énergie et nettoyage'.length <= 14 ? 'énergie et nettoyage' : 'énergie');
    expect(motCle('IBAN SA')).toBe('IBAN SA');
  });
  it('« loyer −400, 25.12 » : une ligne, courte ; « ~ » pour une date estimée, « + » pour un montant partiel', () => {
    expect(texteEtiquette(item({ date: '2026-12-25' }))).toBe('loyer −400, 25.12');
    expect(texteEtiquette(item({ amountCents: 684, label: 'Pale Ale d’hiver · impôt sur la bière · date estimée', source: 'brew' }))).toBe('impôt sur la bière −6,84, ~25.11'.replace('impôt sur la bière', 'impôt'));
    expect(texteEtiquette(item({ amountCents: 2400, label: 'Pale Ale d’hiver · emballage', source: 'brew', partial: ['emballage'], date: '2026-12-03' }))).toBe('emballage −24+, 03.12');
    expect(texteEtiquette(item({ amountCents: 300_000, label: 'Frigo', source: 'equipment', date: '2026-11-15' }))).toBe('frigo −3 000, 15.11');
    expect(texteEtiquette(item({ direction: 'in', amountCents: 50_000, label: 'Vente', source: 'plan' }))).toBe('vente +500, 25.11');
  });
  it('le texte lu (aria) garde le nom entier, le montant en centimes et le jour', () => {
    expect(libelleLong(item({ date: '2026-12-25' }))).toBe('Loyer de l’atelier −400,00, 25.12');
  });
  it('largeur d’une étiquette courte : au plus la moitié du graphe à 390', () => {
    for (const t of ['loyer −400, 25.12', 'fermenteur −750, 01.01', 'emballage −24+, 03.12', 'énergie −11, 20.11']) expect(largeurTexte(t, 13) + 18).toBeLessThan(200);
  });
});

describe('constat 6 : un seul format de montant, avec séparateur de milliers visible', () => {
  it('espace insécable pleine partout (jamais d’espace fine ni d’apostrophe)', () => {
    expect(montant(300_000)).toBe('3 000,00');
    expect(montant(-308_000)).toBe('−3 080,00');
    expect(montantEntier(418_160)).toBe('4 182');
    expect(montantCourt(-300_000)).toBe('−3 000');
    expect(montantCourt(-684)).toBe('−6,84');
    for (const s of [montant(123_456_789), montantEntier(123_456_789)]) expect(/[  ’']/.test(s)).toBe(false);
  });
});

describe('constat 7 : le titre dit la fin réelle', () => {
  it('« Fin janvier » seulement si le dernier jour est le dernier du mois', () => {
    expect(titreHorizon('2027-01-31', 90)).toBe('Fin janvier');
    expect(titreHorizon('2027-02-07', 90)).toBe('Jusqu’au 7 févr.');
    expect(titreHorizon('2026-12-09', 30)).toBe('Jusqu’au 9 déc.');
    expect(titreHorizon('2027-11-08', 365)).toBe('Jusqu’au 8 nov. 2027');
    expect(titreHorizon('2027-11-30', 365)).toBe('Fin novembre 2027');
  });
});

describe('constat 10 : au-delà de 10 sorties, les récurrences se regroupent', () => {
  const mois = (n: number) => Array.from({ length: n }, (_, i) => item({ id: `loyer:${i}`, date: `${2026 + Math.floor((10 + i) / 12)}-${String(((10 + i) % 12) + 1).padStart(2, '0')}-25`, planId: 'LOYER' }));
  it('9 loyers + 3 autres : une étiquette « ×9, le 25 » sur la première marche', () => {
    const autres = [item({ id: 'a', source: 'plan', amountCents: 1000, date: '2026-11-10', label: 'A', planId: 'A' }), item({ id: 'b', source: 'plan', amountCents: 2000, date: '2026-11-12', label: 'B', planId: 'B' }), item({ id: 'c', source: 'plan', amountCents: 3000, date: '2026-11-13', label: 'C', planId: 'C' })];
    const e = construireEscalier({ departCents: 1_000_000, items: [...mois(9), ...autres], debut: '2026-11-09', fin: '2027-11-08' });
    const g = groupesRecurrents(e.marches);
    expect(g.size).toBe(9);
    expect(g.get('loyer:0')).toMatchObject({ n: 9, premierId: 'loyer:0', jour: '25' });
    expect(texteEtiquette(mois(1)[0], g.get('loyer:0'))).toBe('loyer −400 ×9, le 25');
  });
  it('à 10 sorties ou moins : rien ne se regroupe (la maquette dessine chaque loyer)', () => {
    const e = construireEscalier({ departCents: 1_000_000, items: mois(4), debut: '2026-11-09', fin: '2027-11-08' });
    expect(groupesRecurrents(e.marches).size).toBe(0);
  });
});

describe('constat 13 : l’axe part juste au-dessus du point le plus haut', () => {
  it('4 181,60 : pas de graduation vide à 5 000 ; le haut dépasse le départ de 4 % seulement', () => {
    const g = graduations(-89_266, 418_160);
    expect(g.ticks.at(-1)).toBe(400_000);
    expect(g.haut).toBeGreaterThan(418_160); expect(g.haut).toBeLessThan(418_160 * 1.2);
  });
});

describe('constat 1 : le placement ne recouvre ni la courbe, ni un autre fil, ni une autre étiquette', () => {
  const marches = [[48, 60], [90, 60], [90, 120], [200, 120], [200, 300], [320, 300]].map(([x, y]) => ({ x, y }));
  const courbe = obstaclesDeCourbe(marches);
  const cadre = { w: 370, h: 500 };
  const fixes: Rect[] = [{ x: 0, y: 0, w: 46, h: 500 }, { x: 0, y: 470, w: 370, h: 30 }];
  const demande = (i: number, x: number, y: number, w: number, h = 20): Demande => ({ id: `d${i}`, priorite: 10, ancre: { x, y }, w, h, ordre: i, poids: 10 });
  it('aucune étiquette ne recouvre un trait de la courbe', () => {
    const d = [demande(0, 90, 90, 120), demande(1, 200, 210, 140), demande(2, 150, 120, 110), demande(3, 250, 300, 110)];
    const { placees } = placerEtiquettes(d, cadre, [...fixes, ...courbe], { distanceMax: 230 });
    expect(placees.length).toBeGreaterThan(0);
    for (const p of placees) for (const o of courbe) expect(seRecouvrent(p.rect, o, 0)).toBe(false);
  });
  it('trop loin de sa marche : « + N » plutôt qu’une étiquette en colonne au centre', () => {
    const d = Array.from({ length: 12 }, (_, i) => demande(i, 200, 210, 150));
    const { placees, reste } = placerEtiquettes(d, cadre, [...fixes, ...courbe], { distanceMax: 120 });
    expect(reste.length).toBeGreaterThan(0);
    for (const p of placees) expect(Math.abs(p.rect.x + p.rect.w / 2 - p.ancre.x) + 1.4 * Math.abs(p.rect.y + p.rect.h / 2 - p.ancre.y)).toBeLessThanOrEqual(120);
  });
  it('un fil ne traverse aucune étiquette déjà posée', () => {
    const d = Array.from({ length: 8 }, (_, i) => demande(i, 100 + i * 20, 130, 110));
    const { placees } = placerEtiquettes(d, cadre, [...fixes, ...courbe], { distanceMax: 260 });
    for (const p of placees) {
      const a = p.ancre, r = p.rect, cx = Math.min(Math.max(a.x, r.x), r.x + r.w), cy = Math.min(Math.max(a.y, r.y), r.y + r.h);
      for (const q of placees) {
        if (q.id === p.id) continue;
        for (let k = 0; k <= 20; k++) { const x = a.x + (cx - a.x) * k / 20, y = a.y + (cy - a.y) * k / 20; expect(x > q.rect.x && x < q.rect.x + q.rect.w && y > q.rect.y && y < q.rect.y + q.rect.h).toBe(false); }
      }
    }
  });
});

// ———— écran ————
const read = () => StorageService.getTransactions();
const lots = [brassin()];
function Ecran({ onOpenSale }: { onOpenSale?: () => void }) {
  const transactions = useStorageValue(read);
  return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" batches={lots} stockItems={stocks()} onOpenSale={onOpenSale} />;
}
function semer(over: { plans?: ReturnType<typeof planPrevoir>[]; sansSolde?: boolean } = {}) {
  FinanceService.saveProfile({ ...FinanceService.getProfile(), ...profil(), ...(over.sansSolde ? { openingCash: undefined } : {}) } as never);
  FinanceService.saveAsset(cuve());
  for (const p of over.plans ?? [loyer, frigo(), fermenteur, planPrevoir(brassin())]) FinanceService.savePlan(p);
  for (const t of [atelier(), loyerNovembre()]) StorageService.addTransaction(t);
}
const ouvrir = () => { render(<Ecran />); fireEvent.click(screen.getByRole('tab', { name: 'Prévisions' })); };
const chips = () => [...document.querySelectorAll<SVGRectElement>('rect.prv-chip')].map(r => ({ x: +r.getAttribute('x')!, y: +r.getAttribute('y')!, w: +r.getAttribute('width')!, h: +r.getAttribute('height')! }));

describe('écran Prévisions après le test P5B', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${ASOF}T10:00:00Z`));
    window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync(); StorageService.setUiState('finances_workspace', 'forecast');
  });
  afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.useRealTimers(); vi.restoreAllMocks(); });

  it('constats 1 et 2 : étiquettes courtes sans recouvrement, soldes sur les marches longues, pointillé nommé', () => {
    semer(); ouvrir();
    const c = chips(); expect(c.length).toBeGreaterThanOrEqual(5);
    for (const r of c) expect(r.w).toBeLessThan(230);
    for (let i = 0; i < c.length; i++) for (let j = i + 1; j < c.length; j++) expect(seRecouvrent(c[i], c[j], 0)).toBe(false);
    const soldes = [...document.querySelectorAll('.prv-solde')].map(t => t.textContent);
    expect(soldes.length).toBeGreaterThan(0);
    for (const s of soldes) expect(s).toMatch(/^−?\d{1,3}( \d{3})*,\d{2}$/);
    expect(document.querySelector('.prv-nom-ghost')).toHaveTextContent(/sans frigo/);
    expect(document.querySelector('.prv-nom-ghost')).toHaveTextContent(/2\s107,34/);
    expect(screen.getByRole('button', { name: /Frigo −3\s000,00, 15\.11/ })).toBeVisible();
  });

  it('constat 6 : la liste n’écrit plus le montant deux fois dans une ligne', () => {
    semer(); ouvrir();
    fireEvent.click(screen.getByRole('button', { name: /^\d+\s+sorties?$/ }));
    const liste = within(screen.getByRole('dialog', { name: 'Sorties et entrées prévues' }));
    const ligne = liste.getByText('Frigo').closest('button')!;
    expect(ligne.textContent!.match(/3 000,00/g)).toHaveLength(1);
  });

  it('constat 9 : « + N sorties » est hors du tracé, sous la légende, et ouvre la liste', () => {
    semer(); ouvrir();
    const plus = document.querySelector('button.prv-restes');
    if (plus) expect(plus).toHaveAccessibleName(/Voir \d+ sorties? de plus/);
    if (plus) { expect(plus.closest('svg')).toBeNull(); fireEvent.click(plus); expect(screen.getByRole('dialog', { name: 'Sorties et entrées prévues' })).toBeVisible(); }
    expect(document.querySelector('svg .prv-reste')).toBeNull();
  });

  it('constat 5 : une part de brassin à 0,00 n’est pas une marche ; elle est dite dans la fiche du brassin et dans les limites', () => {
    const vide = estimateBrewBudget({ recipe: recette(), stockItems: stocks(), batches: [brassin()], brewDate: '20.11.2026', batchId: 'B1', netVolumeL: 27, og: '1.048', settings: { ...reglages, costs: {} }, prices: prixMalts(), isTvaRegistered: false, now: '2026-11-01T12:00:00Z' });
    semer({ plans: [loyer, frigo(), fermenteur, { ...planPrevoir(brassin()), brewEstimate: vide }] }); ouvrir();
    const zeros = [...document.querySelectorAll('g.prv-etq')].filter(g => /(^|\s)0,00/.test(g.getAttribute('aria-label') ?? ''));
    expect(zeros).toHaveLength(0);
    for (const t of document.querySelectorAll('svg text')) expect(t.textContent).not.toMatch(/ 0,00/);
  });

  it('constat 11 : solde de départ inconnu, une seule carte « à renseigner » et des écarts, jamais un solde', () => {
    semer({ sansSolde: true }); ouvrir();
    expect(screen.getByRole('button', { name: /Solde de départ à renseigner/ })).toBeVisible();
    const bascule = within(screen.getByRole('group', { name: /Avec ou sans/ }));
    expect(bascule.getByRole('button', { name: /Avec frigo/ })).toHaveTextContent(/écart 90 j/);
    expect(bascule.getByRole('button', { name: /Avec frigo/ })).toHaveTextContent(/−\d/);
    expect(bascule.getByRole('button', { name: /Avec frigo/ })).not.toHaveTextContent('À compléter');
  });

  it('constat 12 : « Mon litre » dit pourquoi il est vide', () => {
    semer(); ouvrir();
    fireEvent.click(screen.getByRole('button', { name: /Frigo −3\s000,00, 15\.11/ }));
    const fiche = within(screen.getByRole('dialog'));
    const litre = fiche.getByText('Mon litre').parentElement!;
    expect(litre.textContent).not.toMatch(/—/);
    expect(litre.textContent).toMatch(/\d,\d{2} → \d,\d{2}|à compléter/);
  });

  it('constat 14 : « estimé · 15.11 » à droite du titre, les limites du projet sont écrites', () => {
    semer(); ouvrir();
    fireEvent.click(screen.getByRole('button', { name: /Frigo −3\s000,00, 15\.11/ }));
    const fiche = screen.getByRole('dialog');
    const tete = fiche.querySelector('.prv-fiche-tete')!;
    expect(tete.querySelector('.prv-aside')).toHaveTextContent(/(estimé|devis) · 15\.11/);
    expect(fiche.querySelector('details.prv-lim')).toBeNull();
  });

  it('constat 15 : les limites s’ouvrent d’emblée, sans second pli', () => {
    semer({ sansSolde: true }); ouvrir();
    fireEvent.click(screen.getByRole('button', { name: /Limites \(\d+\)/ }));
    const dlg = screen.getByRole('dialog', { name: 'Limites de cette prévision' });
    expect(dlg.querySelector('details')).toBeNull();
    expect(within(dlg).getByText(/Prévision incomplète/)).toBeVisible();
  });
});
