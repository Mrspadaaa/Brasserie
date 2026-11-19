// @vitest-environment jsdom
// Port du carnet, correction 5, lot C : Décider (R06, R07, R23) et Stocks › Matériel (R08, R28, R29). Problèmes de CRITIQUE-5 :
// 9, 10, 12, 22, 23, 25, 27, 33, 35, 37, 38, 40, 41. Un `describe` par correction (1 à 7) du brief. Calcul local, aucune IA.
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VirtuosoMockContext } from 'react-virtuoso';
import { tableau } from '../../src/domain/carnets/comparer';
import { fixtureCarnets, fixturePlanRealise, fixturePlans, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnet, type CarnetDoc, type DonneesCarnet } from '../../src/domain/carnets/modele';
import { Comparer, moinsBienQueDe, premierSansValeur } from '../../src/ui/carnets/Comparer';
import { Choisir } from '../../src/ui/carnets/Choisir';
import { SupprimerCarnet } from '../../src/ui/carnets/SupprimerCarnet';
import type { ArticleV, ChoixV, ContenuCarnetV } from '../../src/ui/carnets/EtatIA';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StorageService } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { seedQa } from '../qa/hop-recipe/repo';
import { BARRE_BASE, BARRE_COLONNE, BARRE_MATERIEL, COLONNE_MATERIEL } from '../../src/ui/finance/UpgradeWorkspace';

vi.mock('../../src/services/firestoreRepo', async () => {
  const qa = await import('../qa/hop-recipe/repo');
  return { ...qa, FirestoreRepo: { ...qa.FirestoreRepo, all: (name: string) => name === 'movements' ? [] : qa.FirestoreRepo.all(name) } };
});
vi.mock('../../src/ui/hopIndex/HopIndexWorkspace', () => ({ HopIndexWorkspace: () => null }));

afterEach(cleanup);
const rien = () => undefined;
const F = fixtureCarnets();
const V: CarnetDoc = lireCarnet(F.find(i => i.id === ID_VENTILATION))!;
const avec = (c: CarnetDoc, d: Partial<DonneesCarnet>): CarnetDoc => ({ ...c, carnet: { ...c.carnet, ...d } });
const articleV = (id: string) => V.carnet.articles.find(a => a.id === id) as unknown as ArticleV;
const CSS = fs.readFileSync(path.resolve(__dirname, '../../src/ui/carnets/carnets-decider.css'), 'utf8');
const TITRE = 'ZZ TEST — Ventilation de la salle de brassage';

describe('(1) Comparer, n° 9, 22, 23 : colonnes de g01-8, critère qui range nommé, « moins bien que la 3e sur tout », écartés à la fin', () => {
  const vue = () => render(<Comparer titre={TITRE} statut="research" critere={V.carnet.criteres[0] as never} tableau={tableau(V)} onRetour={rien} />);
  it('n° 9 : colonnes de 70 à 78 px de contenu à 390 (3 visibles avec la colonne des noms), aucune pastille dans l\'en-tête', () => {
    expect(CSS).toMatch(/\.cn-comparer \.cn-tableau-comparer \.cn-col-tete \{ min-width: 70px; max-width: 78px;/);
    const { container } = vue();
    expect(container.querySelectorAll('thead .cn-pastille').length).toBe(0);
    /* 3 colonnes de ≤ 78 + 12 px et la colonne des noms tiennent dans 366 px : 3 × 90 + 91 = 361 */
    expect(3 * (78 + 12) + 91).toBeLessThanOrEqual(366);
  });
  it('n° 22 : « rangé par » nomme le critère qui range ; le premier critère, sans valeur, est dit sans valeur', () => {
    const { container } = vue();
    expect(container.querySelector('.cn-cmp-critere')!.textContent).toBe("Ce qui compte tient 80 °C · proposé par l'IA, puis le débit · proposé par l'IA"); /* tour 3, PCN-118 : tous les critères qui classent ; critique 6, point 16 : sa source, lue sur la colonne */
    /* critique 6, n° 4 (g01-8) : « classées par … » */
    expect(container.textContent).toContain('classées par tient 80 °C d\'abord, puis le débit, puis le prix');
    expect(container.querySelector('.cn-cmp-sans-valeur')!.textContent).toBe('« Moins de condensation au plafond : capter la buée » : sans valeur à comparer, il ne range pas');
    /* un premier critère qui range n'est pas dit sans valeur */
    expect(premierSansValeur(tableau(V), V.carnet.criteres[1] as never)).toBeNull();
  });
  it('n° 23 : la 4e (690 CHF, « tient 80 °C » inconnu) est « moins bien que la 3e sur tout », jamais « partout »', () => {
    const t = tableau(V)!;
    const quatrieme = t.lignes.find(l => l.rang === 4)!;
    expect(moinsBienQueDe(t, quatrieme)).toBe(3);
    expect(moinsBienQueDe(t, t.lignes.find(l => l.rang === 1)!)).toBeNull();
    const { container } = vue();
    expect(container.querySelector('.cn-cmp-domines')!.textContent).toBe('la 4e, Extracteur centrifuge en ligne : moins bien que la 3e sur tout');
    expect(container.textContent).not.toMatch(/partout/);
  });
  it('D-52 : l\'écarté reste à la fin (dernière colonne) et sous le tableau avec sa raison', () => {
    const { container } = vue();
    const tetes = [...container.querySelectorAll('table.cn-tableau-comparer thead th')];
    expect(tetes[tetes.length - 1].classList.contains('cn-ecarte')).toBe(true);
    expect(container.querySelector('.cn-ecartes')!.textContent).toContain('Ventilateur de plafond 130 cm');
    expect(container.querySelector('.cn-ecartes')!.textContent).toContain('écarté : brasse la buée sans la sortir');
  });
});

describe('(2) Choisir avant le choix, n° 10, 33 (g05-11, g05-9) : réglettes avec rang, photo, ✕ des écartés, bouton vert', () => {
  const autres = ['ZZ-V-A2', 'ZZ-V-A3', 'ZZ-V-A4'].map((id, i) => ({ article: articleV(id), rang: i + 2 }));
  const vue = (photo?: string) => render(<Choisir etape="choisir" titre={TITRE} carnet={V.carnet} picto={<svg data-test-picto />}
    article={{ ...articleV('ZZ-V-A1'), ...(photo ? { photo } : {}) }} sur={4} valeurs={[]} autres={autres} onRetour={rien} onChoisir={rien} onEcarter={rien} />);
  it('réglettes « débit : 1 800 m³/h, 1er sur 4 » et « prix : 2 600 CHF, 4e sur 4 », dans le tableau « Ses autres valeurs »', () => {
    vue();
    const cadre = screen.getByRole('region', { name: 'Choisir' });
    const reglettes = within(cadre).getAllByRole('img', { name: /sur 4/ }).map(r => r.getAttribute('aria-label'));
    expect(reglettes).toEqual(['débit : 1 800 m³/h, 1er sur 4', 'prix : 2 600 CHF, 4e sur 4']);
    expect(cadre.querySelector('table.cn-place')!.textContent).toContain('1er sur 4');
  });
  it('✕ de l\'écarté avec sa raison ; photo du choisi, ou son picto en grand ; « Choisir chez Inox Broye » vert avec ✓', () => {
    const { container, unmount } = vue('data:image/png;base64,AA');
    const cadre = screen.getByRole('region', { name: 'Choisir' });
    const x = within(cadre).getAllByRole('img', { name: 'écarté' });
    expect(x.map(i => i.closest('li')!.textContent)).toEqual(['Ventilateur de plafond 130 cm : brasse la buée sans la sortir']);
    expect(container.querySelector('img.cn-offre-photo')).not.toBeNull();
    const bouton = within(cadre).getByRole('button', { name: 'Choisir chez Inox Broye' });
    expect(bouton.classList.contains('cn-action-vert')).toBe(true);
    expect(bouton.querySelector('svg')).not.toBeNull();
    unmount();
    const sans = vue();
    expect(sans.container.querySelector('.cn-offre-photo.cn-vignette-vide [data-test-picto]')).not.toBeNull();
  });
});

describe('(3) Choisi · pourquoi, n° 25 et 37 : réglettes à plat, picto à la taille du cadre, « 2 600 CHF »', () => {
  it('les réglettes n\'ont ni fond, ni arrondi, ni croissance (carnets.css les posait sur une pastille grise)', () => {
    expect(CSS).toMatch(/\.cn-pourquoi \.cn-reglette, \.cn-choisir \.cn-reglette \{ position: static; flex: none; height: auto; border-radius: 0; background: none; \}/);
    expect(CSS).toMatch(/\.cn-vignette-vide\.cn-choisi-photo svg \{ width: 64px; height: 64px; \}/);
  });
  it('le prix s\'écrit « 2 600 CHF » dans le choisi et dans « Part dans À venir »', () => {
    const choix: ChoixV = { articleId: 'ZZ-V-A1', pourquoi: 'la seule qui sort la buée', ecartes: [], le: '2026-11-17T10:00:00.000Z', remplaces: [] };
    const { container, unmount } = render(<Choisir etape="choisi" titre={TITRE} carnet={avec(V, { choix: choix as never }).carnet} choix={choix} article={articleV('ZZ-V-A1')} ecartes={[]} onRetour={rien} />);
    expect(container.querySelector('.cn-choisi-carte')!.textContent).toContain('2 600 CHF');
    expect(container.textContent).not.toMatch(/2600/);
    unmount();
    const c = render(<Choisir etape="choisir" titre={TITRE} carnet={V.carnet} article={articleV('ZZ-V-A1')} sur={4} valeurs={[]} autres={[]} onRetour={rien} onChoisir={rien} onEcarter={rien} />);
    expect(c.container.textContent).toContain('Part dans À venir : 2 600 CHF, en stock, Inox Broye');
  });
});

describe('(4) Supprimer, n° 27 et 38 : G35 seulement de même catégorie, picto local neutre', () => {
  const contenu = { articles: [{ id: 'a', valeurs: {}, lecture: 'lue', veille: { active: true, depuis: '2026-11-01' } }], photos: [], facons: [], notes: [] } as unknown as ContenuCarnetV;
  const vue = (proche: { titre: string; onDeplacer: () => void; memeCategorie?: boolean } | null) =>
    render(<SupprimerCarnet titre="Hotte" contenu={contenu} liens={[]} proche={proche} onDetacher={rien} onArchiver={rien} onSupprimer={rien} onGarder={rien} />);
  it('carnet d\'une autre catégorie, ou aucun : pas de G35', () => {
    vue({ titre: 'Extracteur pour la salle de fermentation', onDeplacer: rien, memeCategorie: false });
    expect(document.querySelector('.cn-g35')).toBeNull();
    cleanup();
    vue(null);
    expect(document.querySelector('.cn-g35')).toBeNull();
  });
  it('carnet de même catégorie : G35, picto local (calculette), ni ✻ ni habit violet de l\'IA', () => {
    vue({ titre: 'Ventilation de la salle de brassage', onDeplacer: rien, memeCategorie: true });
    const aide = document.querySelector('.cn-g35')!;
    /* critique 6, n° 31 (SupprimerCarnet, autre lot) : un seul article se dit au singulier, « le déplacer » */
    expect(aide.textContent).toContain('1 article en veille : le déplacer dans Ventilation de la salle de brassage');
    expect(aide.classList.contains('cn-aide')).toBe(false);
    expect(aide.querySelector('[data-picto="local"]')).not.toBeNull();
    expect(aide.textContent).not.toContain('✻');
    const regle = CSS.slice(CSS.indexOf('.cn-g35 {'), CSS.indexOf('.cn-g35 .cn-sp'));
    expect(regle).not.toMatch(/--c-ia/);
    expect(CSS).toMatch(/\.cn-g35 \.cn-prov-local, \.cn-supprimer \.cn-g36 \.cn-prov-local \{ color: var\(--c-ink2\); \}/);
  });
});

describe('(5) Titre, n° 40 : le titre reçu, « ZZ TEST — » compris, partout (comme CarnetOuvert)', () => {
  it('Comparer, Choisir et le choisi rendent le titre tel quel', () => {
    const a = render(<Comparer titre={TITRE} statut="research" tableau={tableau(V)} onRetour={rien} />);
    expect(a.container.querySelector('h2.cn-titre')!.textContent).toBe(TITRE);
    a.unmount();
    const b = render(<Choisir etape="choisir" titre={TITRE} carnet={V.carnet} article={articleV('ZZ-V-A1')} sur={4} valeurs={[]} autres={[]} onRetour={rien} onChoisir={rien} onEcarter={rien} />);
    expect(b.container.querySelector('.cn-retour')!.textContent).toContain(TITRE);
    b.unmount();
    const choix: ChoixV = { articleId: 'ZZ-V-A1', pourquoi: '', ecartes: [], le: '2026-11-17T10:00:00.000Z', remplaces: [] };
    const c = render(<Choisir etape="choisi" titre={TITRE} choix={choix} article={articleV('ZZ-V-A1')} ecartes={[]} onRetour={rien} />);
    expect(c.container.querySelector('h2.cn-titre')!.textContent).toBe(TITRE);
  });
});

/* (6) et (7) : Stocks › Matériel monté pour de vrai (StocksTab, magasin de QA, fixture « ZZ TEST — … »). */
const readStocks = () => StorageService.getStocks();
function Catalogue() {
  const stocks = useStorageValue(readStocks);
  return <VirtuosoMockContext.Provider value={{ viewportHeight: 1000, itemHeight: 54 }}><StocksTab stocks={stocks} batches={[]} /></VirtuosoMockContext.Provider>;
}
const monter = async (segment: string) => {
  const { items, plans, transactions, payments } = fixturePlanRealise();
  seedQa({ creativeItems: items, financialPlans: plans, transactions, financialPayments: payments });
  StorageService.setUiState('stocks_subtab', 'materiel');
  StorageService.setUiState('stocks_materiel', segment);
  const r = render(<Catalogue />);
  await act(async () => { await new Promise(res => setTimeout(res, 30)); });
  return r;
};

describe('(6) À venir et Réalisés dans Stocks › Matériel, n° 12 et 35 (h05-9 ; R32, D-2, D-3, D-8)', () => {
  beforeEach(() => { localStorage.clear(); StorageService.clearMemoryCache(); });
  it('À venir : la carte de h05-9 (vignette, « Froid Léman », Fixer la date, Ouvrir le carnet), le titre une fois, crayon discret, sans « + mois » ni caisse', async () => {
    await monter('avenir');
    const carte = document.querySelector('[data-prochain-carnet]') as HTMLElement;
    expect(carte).not.toBeNull();
    const titre = fixturePlans()[0].title;
    expect(carte.textContent!.split(titre).length - 1).toBe(1);
    expect(carte.textContent).toContain('Ajouté le 16 nov. · depuis son carnet');
    expect(carte.textContent).toContain('4 900 CHF TTC · Froid Léman');
    expect(carte.querySelector('.cn-vignette')).not.toBeNull();
    expect(within(carte).getByRole('button', { name: /Fixer la date/ })).toBeInTheDocument();
    expect(within(carte).getByRole('button', { name: 'Ouvrir le carnet' })).toBeInTheDocument();
    const crayon = within(carte).getByRole('button', { name: `Modifier ${titre}` });
    expect(crayon.textContent).toBe('');
    const colonne = document.querySelector('[data-colonne-materiel]') as HTMLElement;
    expect(colonne.textContent).not.toContain('+ mois');
    expect(colonne.textContent).not.toContain('Caisse fin de mois');
    expect(colonne.textContent).toContain('Il passe seul dans Réalisés quand sa dépense liée est payée');
    /* le Densimètre, choisi sans plan, attend « Envoyer dans À venir » : rappelé, rien d'inventé */
    expect(within(colonne).getByRole('region', { name: 'Choisis, pas encore dans À venir' }).textContent).toContain('Densimètre');
  });
  it('Réalisés vide : la facture payée solde le projet, sans geste ; vouvoiement', async () => {
    const { items } = fixturePlanRealise();
    seedQa({ creativeItems: items, financialPlans: fixturePlans(), transactions: [], financialPayments: [] });
    StorageService.setUiState('stocks_subtab', 'materiel');
    StorageService.setUiState('stocks_materiel', 'realises');
    render(<Catalogue />);
    await act(async () => { await new Promise(res => setTimeout(res, 30)); });
    const vide = document.querySelector('[data-realises-vide]') as HTMLElement;
    expect(vide.textContent).toContain('quand sa dépense liée est payée');
    expect(vide.textContent).not.toMatch(/Tes |Marque un projet/);
  });
});

describe('(7) Stocks › Matériel à 1280, n° 41 (R28) : segment à la largeur de la colonne, + volant au bord de la colonne', () => {
  beforeEach(() => { localStorage.clear(); StorageService.clearMemoryCache(); });
  it('la barre a la largeur de la colonne (736 px dès 900 px) et sert d\'ancre ; le Parc garde la sienne', async () => {
    expect(BARRE_MATERIEL).toBe(`${BARRE_BASE} ${BARRE_COLONNE}`);
    expect(BARRE_COLONNE.split(' ').sort()).toEqual(['cn-barre-materiel', 'min-[900px]:max-w-[736px]', 'min-[900px]:mx-auto', 'min-[900px]:w-full'].sort());
    /* 760 de colonne moins 2 × 12 de marge = 736 : la barre et le contenu ont les mêmes bords */
    expect(COLONNE_MATERIEL).toContain('min-[900px]:max-w-[760px]');
    expect(COLONNE_MATERIEL).toContain('px-3');
    await monter('avenir');
    const barre = screen.getByRole('navigation', { name: 'Vue du matériel' });
    expect(barre.classList.contains('cn-barre-materiel')).toBe(true);
  });
  it('le + volant s\'ancre au bord droit de la barre (8 px), seulement sans case des onglets, et garde sa place sans ancrage CSS', () => {
    expect(CSS).toMatch(/\.cn-barre-materiel \{ anchor-name: --cn-barre-materiel; \}/);
    const bloc = CSS.slice(CSS.indexOf('@media (min-width: 900px) {\n  @supports (anchor-name: --a)'));
    expect(bloc).toMatch(/body:has\(\.cn-barre-materiel\) \.floating-actions\[data-floating-actions-docked="false"\] \{/);
    expect(bloc).toMatch(/position-anchor: --cn-barre-materiel;\s*left: calc\(anchor\(right\) \+ 8px\);\s*right: auto;/);
    const stocks = fs.readFileSync(path.resolve(__dirname, '../../src/components/tabs/StocksTab.tsx'), 'utf8');
    expect(stocks).toContain("import '../../ui/carnets/carnets-decider.css';");
    expect(stocks).toContain("className={segMateriel === 'parc' ? BARRE_BASE : ");
  });
});
