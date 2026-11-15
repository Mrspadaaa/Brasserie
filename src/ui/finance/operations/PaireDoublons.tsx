import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Transaction } from '../../../types';
import { compte } from '../../../services/plural';
import { shortDate } from '../financeFormat';
import { todayISO } from '../../../domain/finance/ledger';
import { GROUPES, type GroupeId } from './groupes';
import './paire.css';
import { ContextePaire, DELAI_RETABLIR_MS, annulerEcriture, saisiesLe, type GestePaire } from './doublons';

/**
 * Doublons = m1do-a (choix du brasseur, 15.11) : la paire dans la liste. Un avis court (×n), puis un cadre par groupe : la raison en tête
 * (« Même référence QR » · « finit par 04471 »), les lignes complètes (celles de la liste, `renderRow`) avec « Annuler celle-ci » sur chacune,
 * puis « saisies le 14 et le 15 oct. » et « Ce n’est pas un doublon ». Rien n’est supprimé.
 */
export interface GroupeDoublon { cle: string; titre: string; detail: string; groupe: GroupeId; transactions: Transaction[]; lignes: React.ReactNode[] }

export function PaireDoublons({ groupes, nombre, onEcarter }: { groupes: GroupeDoublon[]; nombre: number; onEcarter: (cle: string) => void }) {
  const [enAttente, setEnAttente] = useState<Set<string>>(() => new Set());
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const minuteurs = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const transactions = useRef(new Map<string, Transaction>());
  transactions.current = useMemo(() => new Map(groupes.flatMap(g => g.transactions.map(t => [t.id, t] as const))), [groupes]);
  const jour = useMemo(() => shortDate(todayISO()), []);

  /** L'écriture part ici : après le délai, au départ de l'écran, ou à la fermeture de la page. Un refus remet la ligne et dit pourquoi. */
  const ecrire = useCallback(async (id: string) => {
    clearTimeout(minuteurs.current.get(id)); minuteurs.current.delete(id);
    const tx = transactions.current.get(id);
    if (!tx) return;
    try { await annulerEcriture(tx, new Date().toISOString()); }
    catch (e) {
      setErreurs(avant => ({ ...avant, [id]: e instanceof Error ? e.message : 'Annulation impossible.' }));
      setEnAttente(avant => { const suite = new Set(avant); suite.delete(id); return suite; });
    }
  }, []);
  const vider = useCallback(() => { for (const id of [...minuteurs.current.keys()]) void ecrire(id); }, [ecrire]);
  useEffect(() => {
    window.addEventListener('pagehide', vider);
    return () => { window.removeEventListener('pagehide', vider); vider(); };
  }, [vider]);

  const geste = useMemo<GestePaire>(() => ({
    jour,
    enAttente: id => enAttente.has(id),
    erreur: id => erreurs[id] ?? '',
    annuler: id => {
      setErreurs(avant => ({ ...avant, [id]: '' }));
      setEnAttente(avant => new Set(avant).add(id));
      minuteurs.current.set(id, setTimeout(() => void ecrire(id), DELAI_RETABLIR_MS));
    },
    retablir: id => {
      clearTimeout(minuteurs.current.get(id)); minuteurs.current.delete(id);
      setEnAttente(avant => { const suite = new Set(avant); suite.delete(id); return suite; });
    },
  }), [enAttente, erreurs, jour, ecrire]);

  return <ContextePaire.Provider value={geste}>
    <div className="ops-doublons" role="note" data-testid="journal-duplicates">
      <div className="ops-dbl-avis">
        <span className="ops-dbl-x" aria-hidden="true">×{nombre}</span>
        <div><b>{compte(nombre, 'pièce')} peut-être en double</b><p>Rien n’est supprimé. Annule celle en trop, ou écarte l’avertissement.</p></div>
      </div>
      {groupes.map(g => {
        const meta = GROUPES[g.groupe];
        const coupe = g.detail.lastIndexOf(' ');
        return <section key={g.cle} className="ops-paire" aria-label={`${g.titre}${g.detail ? `, ${g.detail}` : ''} · ${compte(g.transactions.length, 'écriture')}`}>
          <div className="ops-pq">
            <span className="ops-sq" aria-hidden="true" style={{ background: meta.fond, color: meta.trait }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8"><path d={meta.chemin}/></svg></span>
            <b>{g.titre}</b>
            {g.detail && <span className="ops-pd">{g.detail.slice(0, coupe + 1)}<b className="ops-m">{g.detail.slice(coupe + 1)}</b></span>}
          </div>
          {g.lignes}
          <div className="ops-pf"><span>{saisiesLe(g.transactions)}</span>
            <button type="button" className="ops-sortir" onClick={() => onEcarter(g.cle)}>Ce n’est pas un doublon</button></div>
        </section>;
      })}
    </div>
  </ContextePaire.Provider>;
}
