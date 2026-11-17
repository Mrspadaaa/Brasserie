import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { Batch, Client, CreativeItem, Recipe, StockItem, Transaction } from '../types';
import type { FinancialPlan, FinancialProfile, FinanceTransaction } from '../domain/finance/types';
import { todayISO } from '../domain/finance/ledger';
import { REGLAGES_VIDES } from '../domain/fournisseurs';
import { plusMenuFor } from '../domain/plusEcran';
import { ajouterJours, lundiDe } from '../domain/calendrier';
import { BottomNav } from '../components/BottomNav';
import { CalendrierTab } from '../components/tabs/CalendrierTab';
import { FloatingActions } from '../ui/FloatingActions';
import { construireModele, type DonneesCalendrier } from '../ui/calendrier/useDonneesCalendrier';
import type { Document, PortEcritures } from '../ui/calendrier/ecritures';
import type { Collection } from '../domain/calendrierGestes';

/**
 * Banc du calendrier : `?preview=calendrier`. **Banc — données simulées** : aucune donnée de l'app, aucune écriture Firestore. Il rejoue
 * l'onglet Calendrier sur une fixture (brassins, fêtes, ventes, achats, travaux, activités, papiers, une promesse, un brassin habituel,
 * une échéance), avec un port d'écriture en mémoire : un geste écrit dans cette mémoire, la frise se recalcule, Annuler défait.
 * Il sert aux gestes (glisser, tirer, appui long, ajouter) et au contrôle `controle-calendrier-app.mjs`.
 */

export interface EtatBanc {
  batches: Batch[];
  plans: FinancialPlan[];
  items: CreativeItem[];
  recettes: Recipe[];
  clients: Client[];
  transactions: Transaction[];
}

/** « 23.11.2026 » : le format des dates de brassin de l'app. */
const suisse = (iso: string) => `${iso.slice(8, 10)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

const profil = (centimes: number | null): FinancialProfile => ({
  id: 'current', canton: 'FR', legalForm: 'sole-proprietor', accounting: 'simplified', vatRegistered: false, historyCompleteFrom: '2026-01-01',
  ...(centimes === null ? {} : { openingCash: { date: '2026-01-01', amountCents: centimes, confirmed: true } })
});

const plan = (p: Partial<FinancialPlan> & Pick<FinancialPlan, 'id' | 'title' | 'date' | 'amountCents'>): FinancialPlan => ({
  direction: 'out', category: 'divers', source: 'manual', status: 'active', createdAt: '2026-01-02T08:00:00.000Z', ...p
} as FinancialPlan);

const facture = (id: string, dueDate: string, cents: number, kind: 'expense' | 'income', date: string): FinanceTransaction => ({
  id, date, description: id, category: kind === 'income' ? 'recettes' : 'brassage', subcategory: 'x', amountHT: cents / 100, amountTTC: cents / 100, tvaAmount: 0, tvaRate: 0,
  finance: { version: 1, kind, amountCents: cents, lines: [], paymentStatus: 'unpaid', dueDate }
}) as unknown as FinanceTransaction;

const recette = (id: string, name: string, style: string): Recipe => ({ id, name, style, volumeL: 100, ingredients: [] } as unknown as Recipe);

const brassin = (id: string, name: string, plannedBrewDate: string, jours: { primaire: number; garde: number }, extra: Partial<Batch> = {}): Batch => ({
  id, name, style: name, volumeL: 100, brewDate: '', plannedBrewDate: suisse(plannedBrewDate), status: 'planifie', gravityLog: [],
  recipeSnapshot: { fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 19, days: jours.primaire }, { kind: 'garde', name: 'Garde', tempC: 4, days: jours.garde }] },
  ...extra
} as unknown as Batch);

/** La fixture du banc, posée par rapport au jour. Rien ici ne vient de l'app. */
export function etatBanc(aujourdhui: string): EtatBanc {
  const L = lundiDe(aujourdhui);
  const s = (n: number, j = 0) => ajouterJours(L, n * 7 + j);
  const blonde = brassin('LOT-BLONDE', 'Blonde d’automne', s(1), { primaire: 14, garde: 14 }, { recipeRef: 'R-BLONDE' });
  const porter = brassin('LOT-PORTER', 'Porter d’hiver', s(3), { primaire: 14, garde: 21 }, { recipeRef: 'R-PORTER' });
  const ipa = brassin('LOT-IPA', 'IPA de printemps', s(-1), { primaire: 14, garde: 14 }, {
    status: 'fermentation', brewDate: suisse(s(-1)), actualBrewDate: suisse(s(-1))
  } as Partial<Batch>);
  /* trois brassages d'une même recette à 56 jours d'écart, le dernier il y a 20 jours : le brassin habituel est proposé 36 jours plus tard */
  const dernier = ajouterJours(aujourdhui, -20);
  const stout = (n: number, jour: string): Batch => ({
    id: `LOT-STOUT-${n}`, name: 'Stout maison', style: 'Stout', volumeL: 100, brewDate: suisse(jour), plannedBrewDate: suisse(jour), status: 'conditionne', bottlingDate: suisse(ajouterJours(jour, 28)),
    recipeRef: 'R-STOUT', gravityLog: []
  } as unknown as Batch);
  const batches = [blonde, porter, ipa, stout(1, ajouterJours(dernier, -112)), stout(2, ajouterJours(dernier, -56)), stout(3, dernier)];

  const items: CreativeItem[] = [
    { id: 'CR-NOEL', type: 'event', title: 'Marché de Noël', status: 'todo', date: s(5) },
    { id: 'CR-FETE', type: 'event', title: 'Fête de village', status: 'todo', date: s(28) },
    { id: 'CR-RANGER', type: 'event', title: 'Ranger la réserve', status: 'todo', date: s(7), activite: true, fenetre: { du: s(7), au: ajouterJours(s(8), 6), joursActifs: 3 } },
    { id: 'CR-INV', type: 'event', title: 'Inventaire du stock', status: 'todo', date: s(2), activite: true },
    { id: 'CR-IDEE', type: 'recipe-idea', title: 'IPA brume', status: 'idea', date: s(3) },
    { id: 'CR-SANS', type: 'event', title: 'Appeler l’assurance', status: 'todo', activite: true }
  ];
  const plans: FinancialPlan[] = [
    plan({ id: 'P-HOTTE', title: 'Hotte', date: s(2), amountCents: 90000 }),
    plan({ id: 'P-FRIGO', title: 'Frigo', date: s(20), amountCents: 180000, category: 'materiel' }),
    plan({ id: 'P-SOLS', title: 'Sols : colle et joints', date: s(14), amountCents: 32000, category: 'renovation', fenetre: { du: s(14), au: ajouterJours(s(16), 6), joursActifs: 5 } }),
    plan({ id: 'P-MALT', title: 'Commande groupée de malt', date: s(4), amountCents: 54000 }),
    plan({ id: 'P-LOYER', title: 'Loyer du local', date: s(1, 3), amountCents: 40000, category: 'chargesFixes', source: 'recurring', recurrence: { frequency: 'monthly' } } as Partial<FinancialPlan> as never),
    plan({ id: 'P-TVA', title: 'TVA T4', date: s(10), amountCents: 30000, category: 'chargesFixes', source: 'tax' }),
    plan({ id: 'P-NOEL-PRIVES', title: 'Noël privés', date: s(5), amountCents: 64000, direction: 'in', category: 'recettes' }),
    plan({ id: 'P-CIGOGNE', title: '3 fûts La Cigogne', date: ajouterJours(s(1), 30), amountCents: 90000, direction: 'in', category: 'recettes', batchId: 'LOT-BLONDE', clientId: 'CL-CIGOGNE' } as Partial<FinancialPlan> as never),
    plan({ id: 'P-CAFE', title: 'Café du Pont, 1 fût', date: s(3), amountCents: 13000, direction: 'in', category: 'recettes', status: 'draft' })
  ];
  const transactions = [facture('F-BROUWLAND', s(2, 2), 42000, 'expense', ajouterJours(L, -9)), facture('F-LAC', s(6), 120000, 'income', ajouterJours(L, -5))] as unknown as Transaction[];
  const recettes = [recette('R-BLONDE', 'Blonde d’automne', 'Blonde'), recette('R-PORTER', 'Porter d’hiver', 'Porter'), recette('R-STOUT', 'Stout maison', 'Stout')];
  const clients = [{ id: 'CL-CIGOGNE', name: 'La Cigogne', type: 'Pro', contact: '' }, { id: 'CL-PONT', name: 'Café du Pont', type: 'Pro', contact: '' }] as unknown as Client[];
  return { batches, plans, items, recettes, clients, transactions };
}

type Appel = { op: 'patch' | 'creer' | 'supprimer'; collection: Collection; id: string; patch?: Document };

/** Un port d'écriture en mémoire : les gestes écrivent ici, jamais dans l'app. `onAppel` rend la trace (les tests, le banc). */
export function creerPortMemoire(lire: () => EtatBanc, ecrire: (suivant: EtatBanc) => void, onAppel?: (a: Appel) => void): PortEcritures {
  const cle = (c: Collection) => (c === 'batches' ? 'batches' : c === 'creativeItems' ? 'items' : 'plans') as 'batches' | 'items' | 'plans';
  return {
    lire: (collection, id) => (lire()[cle(collection)] as unknown as Array<Document & { id: string }>).find(d => d.id === id),
    patcher: (collection, id, patch) => {
      onAppel?.({ op: 'patch', collection, id, patch });
      const e = lire();
      const liste = (e[cle(collection)] as unknown as Array<Document & { id: string }>).map(d => {
        if (d.id !== id) return d;
        const suivant: Document = { ...d, ...patch };
        for (const [k, v] of Object.entries(patch)) if (v === undefined) delete suivant[k];
        return suivant as Document & { id: string };
      });
      ecrire({ ...e, [cle(collection)]: liste });
    },
    creer: (collection, document) => {
      onAppel?.({ op: 'creer', collection, id: document.id, patch: document });
      const e = lire();
      ecrire({ ...e, [cle(collection)]: [...(e[cle(collection)] as unknown as unknown[]), document] });
    },
    supprimer: (collection, id) => {
      onAppel?.({ op: 'supprimer', collection, id });
      const e = lire();
      ecrire({ ...e, [cle(collection)]: (e[cle(collection)] as unknown as Array<{ id: string }>).filter(d => d.id !== id) });
    }
  };
}

export interface BancProps {
  /** Le jour du banc (les tests le fixent) ; par défaut aujourd'hui. */
  aujourdhui?: string;
  /** La fixture (les tests passent la leur) ; par défaut celle du banc. */
  etat?: EtatBanc;
  /** Solde de départ en centimes ; `null` : inconnu (pas de courbe). */
  solde?: number | null;
  onAppel?: (a: Appel) => void;
  callbacks?: Partial<React.ComponentProps<typeof CalendrierTab>>;
  /** Sans la barre d'onglets ni le + volant (les tests de la frise seule). */
  sansChrome?: boolean;
}

/** L'onglet Calendrier sur la fixture, avec la barre d'onglets et le + volant de l'app. */
export const BancCalendrier: React.FC<BancProps> = ({ aujourdhui: jour, etat, solde = 403200, onAppel, callbacks, sansChrome }) => {
  const aujourdhui = jour ?? todayISO();
  const [e, setE] = useState<EtatBanc>(() => etat ?? etatBanc(aujourdhui));
  const ref = useRef(e);
  ref.current = e;
  const ecrire = useCallback((suivant: EtatBanc) => { ref.current = suivant; setE(suivant); }, []);
  const port = useMemo(() => creerPortMemoire(() => ref.current, ecrire, onAppel), [ecrire, onAppel]);
  const donnees: DonneesCalendrier = useMemo(() => {
    const modele = construireModele({
      aujourdhui, transactions: e.transactions, payments: [], plans: e.plans, profile: profil(solde), assets: [], batches: e.batches, stockItems: [] as StockItem[],
      items: e.items, recettes: e.recettes, reglages: REGLAGES_VIDES
    });
    return { modele, plans: e.plans, batches: e.batches, recettes: e.recettes, clients: e.clients, items: e.items, aujourdhui };
  }, [aujourdhui, e, solde]);
  const rien = () => undefined;
  return (
    <div className="min-h-screen bg-cave-950 text-cave-50" data-banc-calendrier>
      <p className="px-3 pt-1 text-sm text-cave-200" data-banc>banc — données simulées</p>
      <main className="mx-auto w-full max-w-[1280px] px-2">
        <CalendrierTab
          transactions={e.transactions} batches={e.batches} stockItems={[]}
          onOpenBatch={rien} onOpenFinances={rien} onOpenAgenda={rien} onOpenCourses={rien} onPoserBrassin={rien} onPoserFete={rien} onPoserDepense={rien}
          donnees={donnees} port={port} aujourdhui={aujourdhui}
          {...callbacks}
        />
      </main>
      {!sansChrome && (
        <>
          <div className="app-bottom-dock">
            <BottomNav activeTab="calendrier" onChangeTab={rien} criticalStockCount={0} horsConnexion={false} />
          </div>
          <FloatingActions action={null} onAction={rien} companionLabel="Calendrier" menu={plusMenuFor('calendrier')} onPlus={rien} horsConnexion={false} anchor="nav" />
        </>
      )}
    </div>
  );
};

export const CalendrierPreview: React.FC = () => <BancCalendrier />;
