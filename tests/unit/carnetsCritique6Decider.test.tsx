// @vitest-environment jsdom
// Port du carnet, correction 6, lot B : Décider (Comparer, Choisir, choix revu) et Stocks › Matériel (À venir, Réalisés). Problèmes de
// CRITIQUE-6 : 4, 5, 6, 7, 17, 18, 19, 21, 23, 27, 36, 37, 38, 39, le doute D-122 et la source des critères. Un test par point du brief
// (1 à 16). Calcul local sur la fixture « ZZ TEST — … », aucune IA.
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { act, cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VirtuosoMockContext } from 'react-virtuoso';
import {
  critereQuiTranche, libelleCaracteristique, placesDe, pourquoiDe, rangGeneral, seuilDuCarnet, tableau, valeurDe
} from '../../src/domain/carnets/comparer';
import { fixtureCarnets, fixturePlanRealise, ID_FRIGO, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnet, type Article, type CarnetDoc, type DonneesCarnet } from '../../src/domain/carnets/modele';
import { Comparer } from '../../src/ui/carnets/Comparer';
import { Choisir } from '../../src/ui/carnets/Choisir';
import type { ArticleV, ChoixV } from '../../src/ui/carnets/EtatIA';
import { StocksTab } from '../../src/components/tabs/StocksTab';
import { StorageService } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { seedQa } from '../qa/hop-recipe/repo';

vi.mock('../../src/services/firestoreRepo', async () => {
  const qa = await import('../qa/hop-recipe/repo');
  return { ...qa, FirestoreRepo: { ...qa.FirestoreRepo, all: (name: string) => name === 'movements' ? [] : qa.FirestoreRepo.all(name) } };
});
vi.mock('../../src/ui/hopIndex/HopIndexWorkspace', () => ({ HopIndexWorkspace: () => null }));

afterEach(cleanup);
const rien = () => undefined;
const lire = (o: Parameters<typeof fixtureCarnets>[0], id: string): CarnetDoc => lireCarnet(fixtureCarnets(o).find(i => i.id === id))!;
const V = lire({}, ID_VENTILATION);
const FRIGO = lire({}, ID_FRIGO);
const avec = (c: CarnetDoc, d: Partial<DonneesCarnet>): CarnetDoc => ({ ...c, carnet: { ...c.carnet, ...d } });
const articleV = (c: CarnetDoc, id: string) => c.carnet.articles.find(a => a.id === id) as unknown as ArticleV;
const CSS = fs.readFileSync(path.resolve(__dirname, '../../src/ui/carnets/carnets-decider.css'), 'utf8');
const CSS_BASE = fs.readFileSync(path.resolve(__dirname, '../../src/ui/carnets/carnets.css'), 'utf8');
const CSS_UPG = fs.readFileSync(path.resolve(__dirname, '../../src/ui/finance/upgrades.css'), 'utf8');
const TITRE = 'ZZ TEST — Ventilation de la salle de brassage';
const autresV = ['ZZ-V-A2', 'ZZ-V-A3', 'ZZ-V-A4'].map((id, i) => ({ article: articleV(V, id), rang: i + 2 }));
const choisirV = () => render(<Choisir etape="choisir" titre={TITRE} carnet={V.carnet} article={articleV(V, 'ZZ-V-A1')} sur={4} valeurs={[]} autres={autresV} onRetour={rien} onChoisir={rien} onEcarter={rien} />);
const comparerV = (o: { critere?: unknown } = {}) => render(<Comparer titre={TITRE} statut="research" critere={(o.critere ?? V.carnet.criteres[0]) as never} tableau={tableau(V)} onRetour={rien} onChoisir={rien} />);
/* le choix revu du frigo, tel que CarnetsVue le monte (critère 1, sortie dans À venir) */
const choisiFrigo = () => {
  const ch = FRIGO.carnet.choix!;
  const nom = (id: string) => FRIGO.carnet.articles.find(a => a.id === id)?.nom ?? 'lien';
  return render(<Choisir etape="choisi" titre={FRIGO.title} choix={ch as unknown as ChoixV} article={articleV(FRIGO, ch.articleId)} critere={FRIGO.carnet.criteres[0] as never}
    carnet={FRIGO.carnet} facon={FRIGO.carnet.facons.find(f => f.id === ch.faconId) as never} ecartes={ch.ecartes.map(e => ({ nom: nom(e.articleId), raison: e.raison }))}
    sortie={{ le: '2026-11-16T10:00:00.000Z' }} onRetour={rien} onVoirAVenir={rien} />);
};

describe('critique 6, lot B (Décider, Stocks › Matériel)', () => {
  it('1 · n° 4 (g01-8) : une colonne par article, la meilleure surlignée, « Compromis », « classées par… », écartés à la fin, « Choisir » sous le tableau, libellé de ligne collé', () => {
    const { container } = comparerV();
    const tetes = [...container.querySelectorAll('table.cn-tableau-comparer thead th')];
    expect(tetes).toHaveLength(1 + 5); /* libellé + 4 en lice + l'écarté */
    expect(tetes[5].className).toContain('cn-ecarte');
    expect(container.querySelectorAll('td.cn-meilleur').length).toBeGreaterThan(0);
    expect(container.textContent).toContain('Compromis :');
    expect(container.querySelector('.cn-cmp-classees')!.textContent).toBe("classées par tient 80 °C d'abord, puis le débit, puis le prix");
    expect(container.querySelector('table.cn-ecartes')!.textContent).toContain('brasse la buée sans la sortir');
    const table = container.querySelector('table.cn-tableau-comparer')!;
    const choisir = screen.getByRole('button', { name: 'Choisir' });
    expect(table.compareDocumentPosition(choisir) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    /* au défilement horizontal (390), la colonne des libellés reste collée */
    expect(CSS_BASE).toMatch(/\.cn-tableau-comparer thead th:first-child, \.cn-tableau-comparer tbody th \{ position: sticky; left: 0;/);
  });

  it('2 · n° 5 (g05-11) : réglettes de la valeur et du prix, critère, façon, fournisseur, écarté et sa raison ; la feuille s\'ouvre en haut', () => {
    const vers = vi.fn();
    const avant = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = vers;
    try { choisirV(); } finally { Element.prototype.scrollIntoView = avant; }
    expect(vers).toHaveBeenCalledWith({ block: 'start' });
    const cadre = screen.getByRole('region', { name: 'Choisir' });
    expect(within(cadre).getAllByRole('img', { name: /sur 4/ }).map(r => r.getAttribute('aria-label'))).toEqual(['débit : 1 800 m³/h, 1er sur 4', 'prix : 2 600 CHF, 4e sur 4']);
    const retenus = within(cadre).getByRole('list', { name: 'Retenu' });
    expect(retenus.textContent).toContain("Critère : tient 80 °C, proposé par l'IA");
    expect(retenus.textContent).toContain('Façon hotte inox + extracteur');
    expect(retenus.textContent).toContain('Inox Broye : en stock');
    expect(within(cadre).getByRole('img', { name: 'critère' })).toBeInTheDocument();
    expect(within(cadre).getByRole('list', { name: 'Écartés, 1' }).textContent).toBe('Ventilateur de plafond 130 cm : brasse la buée sans la sortir');
  });

  it('3 · n° 6 : le rang vient du tableau de Comparer ; un ex aequo se compte sur ceux qui partagent la valeur : « 1er sur 2 ex aequo »', () => {
    const tient = placesDe(tableau(V)!, 'ZZ-V-A1').find(p => p.nom === 'tient 80 °C')!;
    expect(tient).toMatchObject({ rang: 1, exAequo: true, partage: 2, sur: 4 });
    choisirV();
    const place = screen.getByRole('region', { name: 'Choisir' }).querySelector('table.cn-place')!;
    expect(place.textContent).toContain('1er sur 2 ex aequo');
    expect(place.textContent).not.toContain('sur 3 ex aequo');
  });

  it('4 · n° 7 (L14) : une colonne s\'appelle par sa caractéristique, « ambiance max °C », jamais « °C » seul ; le choix revu du frigo le montre', () => {
    expect(libelleCaracteristique('température ambiante max')).toBe('ambiance max');
    expect(libelleCaracteristique('débit')).toBe('débit');
    const { container } = render(<Comparer titre={FRIGO.title} statut="validated" critere={FRIGO.carnet.criteres[0] as never} tableau={tableau(FRIGO)} onRetour={rien} />);
    const libelles = [...container.querySelectorAll('table.cn-tableau-comparer tbody th')].map(th => th.textContent);
    expect(libelles).toContain('ambiance max °C');
    expect(libelles).not.toContain('°C');
    cleanup();
    choisiFrigo();
    const pourquoi = screen.getByRole('region', { name: 'Pourquoi ce choix' });
    const r = within(pourquoi).getByRole('img', { name: /ambiance max/i });
    expect(r.textContent).toContain('Ambiance max');
    expect(r.textContent).toContain('43 °C');
  });

  it('5 · n° 17 (R44, D-133) : critereQuiTranche ne propose pas un critère sans colonne (« pas trop de bruit », personne n\'a le bruit) ; avec une valeur lue ailleurs, il tranche', () => {
    const g8 = lire({ g8: true }, ID_VENTILATION);
    expect(critereQuiTranche(V)).toBeNull();
    /* la fixture `g8` porte le bruit lu sur la 3e et la 4e (valeurs d'exemple) : il tranche ; sans ces valeurs, personne ne l'a */
    const sans = avec(g8, { articles: g8.carnet.articles.map(a => { const { bruit: _b, ...reste } = a.valeurs ?? {}; return { ...a, valeurs: reste }; }) });
    expect(critereQuiTranche(sans)).toBeNull();
    const t = critereQuiTranche(g8)!;
    expect(t.critere.id).toBe('ZZ-V-K4');
    expect(t.entre).toEqual(['Hotte inox + extracteur', 'Extracteur mural seul']);
  });

  it('6 · n° 18 : la 4e prend l\'état de sa façon (« ne tient pas 80 °C ») : « non », pas « – » ; une valeur inconnue reste après les connues, jamais 0', () => {
    const t = tableau(V)!;
    const a4 = t.lignes.find(l => l.articleId === 'ZZ-V-A4')!;
    expect(a4.cellules['tient 80 °C']).toEqual({ valeur: false, origine: 'locale' });
    const a4Art = V.carnet.articles.find(a => a.id === 'ZZ-V-A4')!;
    expect(valeurDe(a4Art, { nom: 'tient 80 °C', sens: 'oui-non' })).toBeUndefined();
    expect(valeurDe(a4Art, { nom: 'tient 80 °C', sens: 'oui-non' }, V)).toEqual({ valeur: false, origine: 'locale' });
    const { container } = comparerV();
    const ligne = [...container.querySelectorAll('table.cn-tableau-comparer tbody tr')].find(tr => tr.querySelector('th')!.textContent === 'tient 80 °C')!;
    const cellules = [...ligne.querySelectorAll('td')].map(td => td.textContent);
    expect(cellules.slice(0, 4)).toEqual(['oui', 'oui', 'non', 'non']);
    /* sans façon qui le dise : inconnu, rangé après les connus, jamais 0 */
    const art = (id: string, valeurs: Article['valeurs']): Article => ({ id, nom: id, valeurs, lecture: 'lue', faconId: 'X' });
    const seul = avec(V, { facons: [{ id: 'X', nom: 'X', etat: 'ouverte', origine: 'vous' }], articles: [art('P', {}), art('Q', { 'tient 80 °C': { valeur: true, origine: 'vous' }, 'débit': { valeur: 900, unite: 'm³/h', origine: 'vous' } }), art('R', { 'tient 80 °C': { valeur: false, origine: 'vous' } })] });
    const ts = tableau(seul)!;
    expect(ts.lignes.find(l => l.articleId === 'P')!.cellules['tient 80 °C']).toBeUndefined();
    expect(ts.lignes.map(l => l.articleId)).toEqual(['Q', 'R', 'P']);
  });

  it('7 · n° 19 : un seul rang général, nommé, « 2e sur 4, rangé par tient 80 °C puis le débit » ; le rang d\'une colonne : « 3e pour le débit » (placesDe)', () => {
    const t = tableau(V)!;
    expect(rangGeneral(t, 'ZZ-V-A2')).toBe('2e sur 4, rangé par tient 80 °C puis le débit');
    expect(rangGeneral(t, 'ZZ-V-A6')).toBeNull();
    const p = placesDe(t, 'ZZ-V-A2');
    expect(p.find(x => x.nom === 'débit')!.rangColonne).toBe('3e pour le débit');
    expect(p.find(x => x.nom === 'prix')!.rangColonne).toBe('3e pour le prix');
    expect(p.find(x => x.nom === 'tient 80 °C')!.rangColonne).toBe('1er ex aequo pour tient 80 °C');
  });

  it('8 · n° 21 (D-13, D-20) : pourquoiDe dit le problème réglé, sans recopier les chiffres', () => {
    const p = pourquoiDe(V, 'ZZ-V-A1')!;
    expect(p).toBe('Le plus gros débit des deux à tenir 80 °C ; en stock, Inox Broye (CH).');
    expect(p.replace('80 °C', '')).not.toMatch(/[0-9]/);
    /* la 2e : parmi celles qui tiennent 80 °C, la moins chère */
    expect(pourquoiDe(V, 'ZZ-V-A2')).toBe('La moins chère qui tient 80 °C ; délai 4 semaines, Gastro Lüftung (DE).');
  });

  it('11 · n° 36 (D-58) : un nom ne se coupe pas quand la place existe (1280 : nom entier, écarté compris ; 390 : 3 lignes)', () => {
    expect(CSS).toMatch(/\.cn-comparer \.cn-cmp-nom \{ -webkit-line-clamp: 3; \}/);
    expect(CSS).toMatch(/@media \(min-width: 900px\) \{\s*\.cn-comparer \.cn-cmp-nom \{ display: block; -webkit-line-clamp: unset; overflow: visible; \}\s*\.cn-comparer \.cn-tableau-comparer thead th\.cn-ecarte \.cn-col-tete \{ max-width: 132px; \}/);
  });

  it('14 · n° 39 : plus de rond vide devant « 2 600 CHF »', () => {
    const { container } = choisirV();
    expect(container.querySelector('.cn-radio')).toBeNull();
    expect(container.querySelector('.cn-offre-prix')!.textContent).toBe('2 600 CHF');
  });

  it('15 · doute D-122 : sous le minimum de sa note (1 200 contre 1 500 m³/h), « sous votre minimum de 1 500 m³/h » (tour 3, PCN-136)', () => {
    const k3 = V.carnet.criteres.find(k => k.id === 'ZZ-V-K3')!;
    expect(seuilDuCarnet(V, k3)).toMatchObject({ valeur: 1500, unite: 'm³/h', source: 'note' });
    const t = tableau(V)!;
    expect(t.lignes.find(l => l.articleId === 'ZZ-V-A2')!.horsSeuil!['débit']).toMatch(/^sous votre minimum de 1\s?500 m³\/h$/);
    expect(t.lignes.find(l => l.articleId === 'ZZ-V-A1')!.horsSeuil).toBeUndefined();
    expect(t.lignes.find(l => l.articleId === 'ZZ-V-A3')!.horsSeuil).toBeUndefined(); /* 1 500 : au minimum, il passe */
    const { container } = comparerV();
    const hs = [...container.querySelectorAll('.cn-hors-seuil')].map(x => x.textContent);
    expect(hs).toHaveLength(2);
    for (const x of hs) expect(x).toMatch(/^sous votre minimum de 1\s?500 m³\/h$/);
    cleanup();
    choisirV();
    const hotte = screen.getAllByText('Hotte murale 100 cm')[0].closest('.cn-article')!;
    expect(hotte.textContent).toMatch(/sous votre minimum de 1\s?500 m³\/h/);
  });

  it('16 · Comparer et Choisir lisent sourceDuCritere : « proposé par l\'IA » pour un critère de l\'IA, rien pour sa phrase', () => {
    const { container } = comparerV();
    expect(container.querySelector('.cn-cmp-critere')!.textContent).toBe("Ce qui compte tient 80 °C · proposé par l'IA, puis le débit · proposé par l'IA"); /* tour 3, PCN-118 */
    cleanup();
    const sienne = avec(V, { criteres: V.carnet.criteres.map(k => (k.id === 'ZZ-V-K2' ? { ...k, origine: 'vous' as const, source: 'phrase' as const } : k)) });
    const c2 = render(<Comparer titre={TITRE} statut="research" critere={sienne.carnet.criteres[0] as never} tableau={tableau(sienne)} onRetour={rien} />);
    expect(c2.container.querySelector('.cn-cmp-critere')!.textContent).toBe("Ce qui compte tient 80 °C, puis le débit · proposé par l'IA"); /* tour 3, PCN-118 : sa phrase sans mention, le 2e critère (de l'IA) avec */
    cleanup();
    choisiFrigo();
    expect(screen.getByRole('region', { name: 'Pourquoi ce choix' }).textContent).toContain('Critère : tenir 2 °C stable en été');
    expect(screen.getByRole('region', { name: 'Pourquoi ce choix' }).textContent).not.toContain("tenir 2 °C stable en été, proposé par l'IA");
  });

  it('10 · n° 27 : le choix revu dit le lien vers À venir une seule fois, « Dans À venir depuis le … · Voir »', () => {
    const { container } = choisiFrigo();
    expect(container.textContent!.split('À venir').length - 1).toBe(1);
    expect(screen.getByRole('button', { name: /Dans À venir depuis le 16 nov\..*Voir/ })).toBeInTheDocument();
  });
});

/* 9, 12, 13 : Stocks › Matériel monté pour de vrai (StocksTab, magasin de QA, fixture « ZZ TEST — … »). */
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

describe('critique 6, lot B : Stocks › Matériel', () => {
  beforeEach(() => { localStorage.clear(); StorageService.clearMemoryCache(); });
  it('9 · n° 23 (D-122, h05-9) : À venir sans mode d\'emploi ; les choisis s\'ouvrent d\'un toucher', async () => {
    await monter('avenir');
    const colonne = document.querySelector('[data-colonne-materiel]') as HTMLElement;
    expect(colonne.textContent).not.toContain('se trouve sous le pourquoi');
    const attente = within(colonne).getByRole('region', { name: 'Choisis, pas encore dans À venir' });
    expect(within(attente).getAllByRole('button', { name: /Ouvrir le carnet/ }).length).toBeGreaterThan(0);
  });
  it('12 · n° 37 : Réalisés au même format (« 11 700 CHF ») ; la ligne dit payé contre prévu, jamais « comme prévu »', async () => {
    await monter('realises');
    const colonne = document.querySelector('[data-colonne-materiel]') as HTMLElement;
    expect(colonne.textContent).not.toContain('11 700,00');
    expect(colonne.textContent).not.toContain('comme prévu');
    expect(colonne.querySelector('[data-paye-prevu]')!.textContent).toBe('Payé 11 700 CHF · prévu 11 700 CHF');
    expect(colonne.querySelector('.upgrade-price')!.textContent).toBe('11 700 CHF');
  });
  it('13 · n° 38 : À venir à la largeur du segment (la règle de 680 px de l\'Atelier levée dans Stocks)', async () => {
    await monter('avenir');
    expect(document.querySelector('.kh.kh-carnet')).not.toBeNull();
    expect(CSS_UPG).toMatch(/\.kh\.kh-carnet \{ max-width:none; \}/);
  });
});
