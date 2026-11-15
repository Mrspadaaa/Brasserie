/* CP-18 (10.11), contrôle commun des renvois, écrit par la voie rvA. Ses mots : « il faudrait un renvoi et une explication » (Prix) ; « Pas de renvoi ??? / Bref il en manque plein... » (Annuel, « Stock au 31 déc. ? »).
   La règle (voies/rv/RENVOIS.md) : tout manque VISIBLE (« ? », « à compléter », « à noter », « à confirmer », « à renseigner », « à indiquer », « à corriger », « à compter », « à estimer », « illisible », un montant hachuré)
   est un renvoi : un `button`, un `a`, un `[role=button]` ou un `summary` actif l'entoure. Exemption écrite dans le code : `data-renvoi="aucun"` (+ la raison en commentaire).
   Un bloc par écran, sur le jeu clairsemé commun (`tests/fixtures/renvoisClairseme.ts`). Chaque bloc liste ses fautes ; le pilote répartit celles des écrans hors de la voie qui les porte.
   Aucun réseau, aucun Gemini. */
import React from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('../../src/services/firebase', () => ({ db: {}, functions: {}, auth: { currentUser: null } }));
vi.mock('../../src/ui/Sheet', () => ({ Sheet: ({ open, title, children, footer }: any) => open ? <div role="dialog" aria-label={title}>{children}{footer}</div> : null }));
vi.mock('../../src/ui/BrewerChat', () => ({ BrewerChat: () => null }));
import { FirestoreRepo } from '../../src/services/firestoreRepo';
import { StorageService, defaultConfig } from '../../src/services/storage';
import { useStorageValue } from '../../src/hooks/useLiveData';
import { FinancesTab } from '../../src/components/tabs/FinancesTab';
import { PrixEcran } from '../../src/ui/prix/PrixEcran';
import { ImpotAnnee } from '../../src/ui/production/impotAnnee/ImpotAnnee';
import { ImpotBiereSheet } from '../../src/ui/production/ImpotBiereSheet';
import { BrewBudgetDialog } from '../../src/ui/finance/BrewBudgetDialog';
import { ChaineArgent } from '../../src/ui/prix/ChaineArgent';
import { clairseme, parCollection, ASOF, type OptionsClairseme } from '../fixtures/renvoisClairseme';
import { Banc } from './annuelSupport';

/** Ce qui annonce un manque visible. « ? » seul compte si c'est une valeur absente, pas une question posée (voir `estQuestion`). */
const MANQUE = /\?|à compléter|à noter|à confirmer|à renseigner|à indiquer|à corriger|à compter|à estimer|illisible/i;
const RENVOI = 'button, a, [role=button], summary, [data-renvoi="aucun"]';
/** Une question posée au brasseur (« Tout est noté ? », « Ta banque dit la même chose aujourd'hui ? », « vraiment rien acheté ni vendu ? ») n'est pas une valeur absente :
    le « ? » ferme une proposition d'au moins 3 mots (depuis le dernier . ; : ( ) =). Un « ? » de valeur (« ? », « 850,00 ? », « stock ? », « = ? ») est seul ou n'a qu'un mot devant lui. */
const sansQuestions = (t: string) => t.replace(/[^.;:()=?]*\?/g, m => m.slice(0, -1).trim().split(/\s+/).filter(Boolean).length >= 3 ? '' : m);

/** Les nœuds texte visibles qui annoncent un manque sans renvoi autour. Retourne « texte [chemin] » pour la liste des fautes. */
export function fautes(racine: ParentNode): string[] {
  const sortie: string[] = [];
  const w = document.createTreeWalker(racine as Node, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) {
    const n = w.currentNode, brut = (n.textContent ?? '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!brut || !MANQUE.test(brut)) continue;
    const el = n.parentElement;
    /* le contexte d'un « ? » : le texte de son parent quand celui-ci n'a que du texte (« Ta banque dit la même chose » + « aujourd'hui » + « ? » sont trois nœuds) */
    const contexte = el && el.children.length === 0 ? (el.textContent ?? '').replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim() : brut;
    if (!MANQUE.test(sansQuestions(contexte))) continue;
    if (!el || el.closest('script, style, [hidden], [aria-hidden="true"]:not(svg *)')) continue;
    const cible = el.closest(RENVOI) as HTMLElement | null;
    if (cible && !(cible as HTMLButtonElement).disabled && cible.getAttribute('aria-disabled') !== 'true') continue;
    const chemin = (() => { const p: string[] = []; for (let e: Element | null = el; e && p.length < 3 && e !== (racine as Element); e = e.parentElement) p.push(e.tagName.toLowerCase() + (e.getAttribute('class') ? '.' + e.getAttribute('class')!.split(' ')[0] : '')); return p.join(' < '); })();
    sortie.push(`« ${brut.slice(0, 70)} » [${chemin}]${cible ? ' (bouton inactif)' : ''}`);
  }
  return [...new Set(sortie)];
}
const verifie = (ecran: string, racine: ParentNode) => {
  const f = fautes(racine);
  expect(f, `${ecran} : ${f.length} manque(s) sans renvoi\n  - ${f.join('\n  - ')}`).toEqual([]);
};
const laisser = () => act(async () => { await new Promise(r => setTimeout(r, 0)); });

const semer = (options: OptionsClairseme = {}) => { for (const e of clairseme(options)) FirestoreRepo.put(e.name as never, e.id, e.data); };
const lots = () => parCollection(clairseme(), 'batches');

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date(`${ASOF}T10:00:00`));
  window.history.replaceState({}, '', '/?dev-local'); FirestoreRepo.startSync();
  StorageService.setUiState('prix_lecture', 'bouteille');
});
afterEach(() => { cleanup(); FirestoreRepo.stopSync(); vi.useRealTimers(); vi.restoreAllMocks(); });

const lire = () => StorageService.getTransactions();
function Finances({ vue }: { vue: 'overview' | 'journal' | 'forecast' | 'annual' }) {
  const transactions = useStorageValue(lire);
  StorageService.setUiState('finances_workspace', vue);
  return <FinancesTab transactions={transactions} config={defaultConfig} budgetLines={[]} globalTimeFilter="all" batches={lots() as never} stockItems={parCollection(clairseme(), 'stockItems') as never} />;
}

describe('CP-18 · chaque manque visible est un renvoi (jeu clairsemé)', () => {
  it('Finances › Synthèse', async () => {
    semer(); const { container } = render(<Finances vue="overview" />); await laisser();
    verifie('Synthèse', container);
  });
  it('Finances › Synthèse › Revoir le mois (outil d’analyse a2a : Caisse, Sources, Budget, Filtrer)', async () => {
    semer(); const { container } = render(<Finances vue="overview" />); await laisser();
    fireEvent.click(screen.getByRole('button', { name: /Revoir le mois/ })); await laisser();
    verifie('Analyse › Caisse', container);
    for (const vue of ['Sources', 'Budget', 'Filtrer']) {
      fireEvent.click(screen.getByRole('tab', { name: new RegExp(`^${vue}`) })); await laisser();
      verifie(`Analyse › ${vue}`, container);
    }
  });
  it('Finances › Opérations', async () => {
    semer(); const { container } = render(<Finances vue="journal" />); await laisser();
    verifie('Opérations', container);
  });
  it('Finances › Prévisions (avec « Limites de cette prévision »)', async () => {
    semer(); const { container } = render(<Finances vue="forecast" />); await laisser();
    const limites = screen.queryByRole('button', { name: /Limites de cette prévision/i });
    if (limites) fireEvent.click(limites);
    verifie('Prévisions + Limites', container);
  });
  it('Finances › Annuel (la tête : « Stock au 31 déc. ? »)', async () => {
    semer(); const { container } = render(<Banc />); await laisser();
    verifie('Annuel', container);
  });
  describe('Finances › Annuel › Clôture, étapes 1 à 9', () => {
    for (const solde of ['absent', 'nonConfirme'] as const) {
      it(`étapes 1 à 9, solde ${solde}`, async () => {
        semer({ solde }); const { container } = render(<Banc />); await laisser();
        const faute: string[] = [];
        for (let n = 1; n <= 9; n++) {
          fireEvent.click(screen.getAllByRole('button', { name: new RegExp(`^${n}\\. `) })[0]); await laisser();
          for (const f of fautes(container)) faute.push(`étape ${n} : ${f}`);
        }
        expect(faute, `Clôture (solde ${solde}) : ${faute.length} manque(s) sans renvoi\n  - ${faute.join('\n  - ')}`).toEqual([]);
      });
    }
  });
  it('Clients › Prix', async () => {
    semer(); const config = StorageService.getConfig();
    const { container } = render(<PrixEcran config={config} tarifs={StorageService.getTarifs()} batches={StorageService.getBatches()} />); await laisser();
    verifie('Prix', container);
  });
  it('Clients › Impôt bière de l’année', async () => {
    semer(); const { container } = render(<ImpotAnnee batches={StorageService.getBatches()} config={StorageService.getConfig()} />); await laisser();
    verifie('Impôt bière de l’année', container);
  });
  it('Brassins › feuille Impôt bière (densité inconnue)', async () => {
    semer(); const lot = StorageService.getBatches().find(b => b.id === 'CLAIR-LOT-4')!;
    const { container } = render(<ImpotBiereSheet batch={lot} onClose={() => {}} onNoteDensity={() => {}} />); await laisser();
    verifie('Feuille Impôt bière', container);
  });
  it('Brassins › coût du brassin', async () => {
    semer(); const lot = StorageService.getBatches().find(b => b.id === 'CLAIR-LOT-4')!;
    const { container } = render(<BrewBudgetDialog batch={lot} onClose={() => {}} />); await laisser();
    verifie('Coût du brassin', container);
  });
  it('Brassins › fiche › Argent', async () => {
    semer(); const lot = StorageService.getBatches().find(b => b.id === 'CLAIR-LOT-4')!;
    const { container } = render(<ChaineArgent batch={lot} config={StorageService.getConfig()} onNoteDensity={() => {}} />); await laisser();
    verifie('Fiche brassin › Argent', container);
  });
});
