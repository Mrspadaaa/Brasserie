/** Les données du Carnet : magasin, finances, mode et aides de l'IA, réseau, carnets lus, anciennes notes, taux EUR→CHF ; sorties de CarnetsVue.tsx. */
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FinanceTransaction } from '../../domain/finance/types';
import { FinanceService } from '../../services/financeService';
import { tauxDeLaDerniereFactureEur } from '../../domain/carnets/prixRendu';
import { StorageService } from '../../services/storage';
import type { CreativeItem } from '../../types';
import { useStorageValue } from '../../hooks/useLiveData';
import { magasinFirestore } from '../../services/carnetsStore';
import { lireCarnets, lireMessages } from '../../domain/carnets/modele';
import { aidesCourantes, modeCarnet } from '../../config/carnetIA';
import { anciennesNotes, faitsDuPlanning } from '../../domain/carnets/anciens';
import type { AchatPasse } from '../../domain/horizons';
import type { CarnetsVueProps, FinancesCarnet } from './carnetsTypes';

const lireFinances = (): FinancesCarnet => ({
  plans: FinanceService.getPlans(), transactions: StorageService.getTransactions() as unknown as FinanceTransaction[], payments: FinanceService.getPayments()
});
/** h1, tour 2 (D2) : l'ancien carnet de l'Atelier, lu en entier (lecture seule). */
const lireCreatifs = (): CreativeItem[] => StorageService.getCreativeItems();

export function useDonneesCarnets(p: CarnetsVueProps) {
  const magasin = useMemo(() => p.magasin ?? magasinFirestore(), [p.magasin]);
  const [items, setItems] = useState(() => magasin.lire());
  useEffect(() => { setItems(magasin.lire()); return magasin.ecouter(() => setItems(magasin.lire())); }, [magasin]);
  const financesApp = useStorageValue(lireFinances);
  const finances = p.finances ?? financesApp;
  /* D2 : les lignes des factures passées (sortie), pour le prix du dernier achat semblable */
  const achatsPasses = useMemo<AchatPasse[]>(() => (finances.transactions ?? []).flatMap(t => (t.finance?.lines ?? [])
    .filter(l => l.amountCents > 0 && t.finance?.kind !== 'income')
    .map(l => ({ libelle: l.description, centimes: l.amountCents, date: String(t.date).slice(0, 10), ref: (l as { stockItemRef?: string }).stockItemRef }))), [finances.transactions]);
  const mode = p.mode ?? modeCarnet();
  const aides = p.aides ?? aidesCourantes();
  const maintenant = useCallback(() => (p.maintenant ? p.maintenant() : new Date()), [p.maintenant]);
  const [enLigneNav, setEnLigneNav] = useState(() => typeof navigator === 'undefined' || navigator.onLine !== false);
  useEffect(() => {
    const maj = () => setEnLigneNav(navigator.onLine !== false);
    window.addEventListener('online', maj); window.addEventListener('offline', maj);
    return () => { window.removeEventListener('online', maj); window.removeEventListener('offline', maj); };
  }, []);
  const enLigne = !p.horsLigne && enLigneNav;

  const carnets = useMemo(() => lireCarnets(items), [items]);
  const tous = useMemo(() => lireCarnets(items, { archives: true }), [items]);
  const messages = useMemo(() => lireMessages(items), [items]);
  /* h1, tour 2 : D3 les projets du Planning faits restent dans Tout ; D2 les anciennes notes de l'Atelier, en repli (lecture seule) */
  const faitsPlanning = useMemo(() => faitsDuPlanning(tous), [tous]);
  const creatifsApp = useStorageValue(lireCreatifs);
  const sourceAnciens = p.anciens ?? (p.magasin ? null : creatifsApp);
  const anciennes = useMemo(() => anciennesNotes(sourceAnciens ?? []), [sourceAnciens]);
  /* D421 : le taux EUR→CHF posé une fois (gardé), sinon celui de la dernière facture en EUR de Finances ; sinon aucun (jamais inventé) */
  const [tauxPose, setTauxPose] = useState<number | undefined>(() => { try { const v = Number(localStorage.getItem('affinee.tauxEurChf')); return v > 0 ? v : undefined; } catch { return undefined; } });
  const tauxEur = tauxPose ?? tauxDeLaDerniereFactureEur(finances.transactions ?? []);
  const poserTaux = (t: number) => { setTauxPose(t); try { localStorage.setItem('affinee.tauxEurChf', String(t)); } catch { /* sans stockage : le taux vaut pour la session */ } };
  return { magasin, items, finances, achatsPasses, mode, aides, maintenant, enLigne, carnets, tous, messages, faitsPlanning, anciennes, tauxEur, poserTaux };
}
