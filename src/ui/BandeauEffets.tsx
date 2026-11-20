import React, { useEffect, useState } from 'react';
import { StorageService } from '../services/storage';
import { EffetsGeste, useEffetsGeste } from '../services/effetsGeste';
import { Units } from '../services/units';
import { nombreFr } from '../domain/nombreAffiche';
import { GESTES_CONNUS, type ParBase, type RegleConsommation } from '../domain/consommation/gestes';

/**
 * L'onglet du bas après un geste (pe1, forme « lignes serrées » v6a) : chaque article usé, avant → après, et Annuler.
 * Une dose inconnue se demande ici, une seule fois, au curseur (pe4) ; elle n'est jamais inventée.
 */

const curseur = (unite: string, par: ParBase) =>
  par === 'litre' ? { max: 10, step: 0.1 } : /^(g|ml)$/i.test(unite) ? { max: 500, step: 5 } : { max: 20, step: 1 };

/**
 * L'Annuler d'un geste, le seul : le stock rendu ET ce que le geste avait écrit ailleurs (le fût remis à laver).
 * Refus entier, rien de rendu, si l'un des deux a bougé depuis (article compté, fût touché).
 */
export function annulerToutLeGeste(gesteId: string): { success: boolean; message: string } {
  const aussi = EffetsGeste.defaireDe(gesteId);
  const refus = aussi?.refus?.();
  if (refus) return { success: false, message: refus };
  const r = StorageService.annulerGeste(gesteId);
  if (!r.success) return r;
  if (aussi) { aussi.defaire(); EffetsGeste.oublierDefaire(gesteId); return { success: true, message: `Annulé : le stock est rendu et ${aussi.dit}.` }; }
  return r;
}

export function annulerGesteDepuisTrace(gesteId: string) {
  const libelle = StorageService.getMouvementsGestes().find(m => m.gesteId === gesteId)?.libelle ?? 'Geste';
  const r = annulerToutLeGeste(gesteId);
  EffetsGeste.annoncer({ geste: { type: '', objet: '', cycle: '', libelle }, gesteId: `${gesteId}-annule`, effets: [], manquantes: [], alertes: [], issue: r.message, annule: r.success });
}

function Question({ regle, type, onFini }: { regle: RegleConsommation; type: string; onFini: (dose: number | null) => void }) {
  const [valeur, setValeur] = useState<number | null>(null);
  useEffect(() => setValeur(null), [regle.id]);
  const nom = [...StorageService.getStocks().rawMaterials, ...StorageService.getStocks().cleaning].find(s => s.ref === regle.stockItemRef)?.name ?? regle.stockItemRef;
  const { max, step } = curseur(regle.unite, regle.par);
  const pos = valeur == null ? 0 : valeur;
  return <div data-effet-question className="rounded-control border border-attention/50 bg-cave-950 px-2 py-1.5">
    <p className="text-sm text-cave-50"><b>{nom}</b> : combien {GESTES_CONNUS[type]?.question ?? 'par geste'}, d'habitude ?</p>
    <input type="range" min={0} max={max} step={step} value={pos} aria-label={`Dose de ${nom} en ${regle.unite}`}
      onChange={e => setValeur(Number(e.target.value))} className="mt-1.5 w-full accent-ebc-straw" />
    <div className="flex items-center justify-between gap-2">
      <span className="font-mono text-sm tabular-nums text-cave-50">{valeur == null ? '—' : valeur === 0 ? '0 · pas utilisé' : nombreFr(valeur)} {valeur ? regle.unite : valeur == null ? regle.unite : ''}</span>
      <span className="flex gap-1.5">
        <button type="button" onClick={() => onFini(null)} className="rounded-control px-2 py-1 text-xs text-cave-400 hover:bg-cave-850">Pas maintenant</button>
        <button type="button" disabled={valeur == null} onClick={() => valeur != null && onFini(valeur)}
          className="rounded-control bg-ebc-straw px-2.5 py-1 text-xs font-semibold text-cave-950 disabled:opacity-40">Retenir</button>
      </span>
    </div>
    <p className="text-2xs text-cave-400">Une seule fois. Ensuite, décompté seul.</p>
  </div>;
}

export function BandeauEffets() {
  const etat = useEffetsGeste();
  const [passees, setPassees] = useState<string[]>([]);
  useEffect(() => setPassees([]), [etat?.gesteId]);
  if (!etat) return null;
  const question = etat.annule ? undefined : etat.manquantes.find(r => !passees.includes(r.id));
  const fini = (dose: number | null) => {
    if (!question) return;
    if (dose == null) { setPassees(p => [...p, question.id]); return; }
    StorageService.retenirDose(question, dose);
    const plan = StorageService.enregistrerGeste(etat.geste);
    EffetsGeste.modifier({ manquantes: plan.manquantes });
  };
  const annuler = () => {
    const r = annulerToutLeGeste(etat.gesteId);
    EffetsGeste.modifier({ issue: r.message, annule: r.success });
  };
  return <div role="status" data-bandeau-effets
    className="fixed inset-x-2 bottom-[calc(var(--main-navigation-height,3rem)+0.5rem)] z-[60] mx-auto max-w-xl space-y-1.5 rounded-panel border border-cave-700 bg-cave-900 p-2 shadow-2xl">
    <p className="text-sm font-semibold text-cave-50">{etat.geste.libelle}{etat.effets.length ? ', avant → après' : ''}</p>
    {etat.effets.length > 0 && <ul className={`space-y-1 ${etat.annule ? 'opacity-50 line-through' : ''}`}>
      {etat.effets.map(e => <li key={e.regleId} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-2">
        <span className="min-w-0 truncate text-sm text-cave-200">{e.nom}</span>
        <span className="font-mono text-sm tabular-nums text-cave-400">{Units.format(e.avant, e.unite)} → <b className="text-cave-50">{Units.format(e.apres, e.unite)}</b></span>
        <span aria-hidden="true" className="relative col-span-2 h-1 overflow-hidden rounded-sm bg-cave-800">
          <i className="absolute inset-y-0 left-0 bg-cave-600" style={{ width: `${Math.min(100, e.avant / e.repere * 100)}%` }} />
          <i className="absolute inset-y-0 left-0 bg-hop" style={{ width: `${Math.min(100, e.apres / e.repere * 100)}%` }} />
        </span>
      </li>)}
    </ul>}
    {etat.alertes.map(a => <p key={a} className="text-xs text-attention">{a}</p>)}
    {question && <Question regle={question} type={etat.geste.type} onFini={fini} />}
    {etat.issue && <p className="text-xs text-water">{etat.issue}</p>}
    <div className="flex justify-end gap-1.5">
      {etat.effets.length > 0 && !etat.annule && <button type="button" onClick={annuler} className="rounded-control border border-cave-600 px-3 py-1 text-xs text-cave-50 hover:bg-cave-850">Annuler</button>}
      <button type="button" onClick={() => EffetsGeste.fermer()} className="rounded-control bg-ebc-straw px-3 py-1 text-xs font-semibold text-cave-950">OK</button>
    </div>
  </div>;
}
