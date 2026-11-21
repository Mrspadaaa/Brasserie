import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { EffetsGeste, useEffetsGeste } from '../services/effetsGeste';
import { Units } from '../services/units';
import { nombreFr } from '../domain/nombreAffiche';
import { GESTES_CONNUS, type ParBase, type RegleConsommation } from '../domain/consommation/gestes';
import { refCurseurNatif } from './geste';

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
  const decompte = StorageService.getMouvementsGestes().some(m => m.gesteId === gesteId && m.type !== 'consommation-annulee');
  const r = StorageService.annulerGeste(gesteId);
  if (!r.success) return r;
  if (aussi) {
    aussi.defaire(); EffetsGeste.oublierDefaire(gesteId);
    // Un lavage sans dose n'a rien décompté (T4-7) : l'Annuler remet seulement le fût à laver, il ne parle pas d'un stock rendu.
    return { success: true, message: decompte ? `Annulé : le stock est rendu et ${aussi.dit}.` : `Annulé : ${aussi.dit}.` };
  }
  return r;
}

export function annulerGesteDepuisTrace(gesteId: string) {
  const libelle = StorageService.getMouvementsGestes().find(m => m.gesteId === gesteId)?.libelle ?? 'Geste';
  const r = annulerToutLeGeste(gesteId);
  EffetsGeste.annoncer({ geste: { type: '', objet: '', cycle: '', libelle }, gesteId: `${gesteId}-annule`, effets: [], manquantes: [], alertes: [], issue: r.message, annule: r.success });
}

/**
 * T4-7 : UNE feuille pour tout le geste, au lieu d'une question par produit (cinq au lavage d'un fût : « Soude, Acide phosphorique, Désinfectant, Star San, PBW »).
 * Chaque produit a son curseur ; on donne la dose de ceux qu'on a utilisés, « Retenir » écrit celles-là et reporte les autres. « Pas maintenant » reporte tout.
 * Le report est retenu (jamais redemandé tant qu'on n'a pas touché « Régler les doses ») ; une dose non donnée reste inconnue, jamais 0.
 */
function FeuilleDoses({ regles, type, onRetenir, onReporter }: { regles: RegleConsommation[]; type: string; onRetenir: (doses: Map<string, number>) => void; onReporter: () => void }) {
  const [valeurs, setValeurs] = useState<Record<string, number>>({});
  const stocks = StorageService.getStocks();
  const nomDe = (r: RegleConsommation) => [...stocks.rawMaterials, ...stocks.cleaning].find(s => s.ref === r.stockItemRef)?.name ?? r.stockItemRef;
  const donnees = regles.filter(r => valeurs[r.id] != null);
  return <div data-effet-question className="rounded-control border border-attention/50 bg-cave-950 px-2 py-1.5">
    <p className="text-sm text-cave-50">Combien {GESTES_CONNUS[type]?.question ?? 'par geste'}, d'habitude ?</p>
    <ul className="mt-1 max-h-[34vh] space-y-1.5 overflow-y-auto overscroll-contain pr-0.5">
      {regles.map(r => {
        const nom = nomDe(r), { max, step } = curseur(r.unite, r.par), v = valeurs[r.id];
        return <li key={r.id} data-dose-ligne className="min-w-0">
          <div className="flex items-baseline justify-between gap-2">
            <span className="min-w-0 truncate text-sm font-semibold text-cave-50">{nom}</span>
            <span className="shrink-0 font-mono text-sm tabular-nums text-cave-50">{v == null ? '—' : v === 0 ? '0 · pas utilisé' : `${nombreFr(v)} ${r.unite}`}</span>
          </div>
          <input ref={refCurseurNatif} type="range" min={0} max={max} step={step} value={v ?? 0} aria-label={`Dose de ${nom} en ${r.unite}`}
            onChange={e => setValeurs(o => ({ ...o, [r.id]: Number(e.target.value) }))} className="block w-full accent-ebc-straw" />
        </li>;
      })}
    </ul>
    <div className="mt-1 flex items-center justify-between gap-2">
      <span className="text-2xs text-cave-400">Une seule fois. Ensuite, décompté seul.</span>
      <span className="flex shrink-0 gap-1.5">
        <button type="button" onClick={onReporter} className="rounded-control px-2 py-1 text-xs text-cave-400 hover:bg-cave-850">Pas maintenant</button>
        <button type="button" disabled={!donnees.length} onClick={() => onRetenir(new Map(donnees.map(r => [r.id, valeurs[r.id]])))}
          className="rounded-control bg-ebc-straw px-2.5 py-1 text-xs font-semibold text-cave-950 disabled:opacity-40">Retenir</button>
      </span>
    </div>
  </div>;
}

export function BandeauEffets() {
  const etat = useEffetsGeste();
  if (!etat) return null;
  // Les doses inconnues : celles qu'on n'a pas reportées se demandent (une feuille) ; les reportées ne se redemandent pas, un lien les rouvre.
  const aDemander = etat.annule ? [] : etat.manquantes.filter(r => !r.reportee);
  const reportees = etat.annule ? [] : etat.manquantes.filter(r => r.reportee);
  const retenir = (doses: Map<string, number>) => {
    for (const r of aDemander) if (doses.has(r.id)) StorageService.retenirDose(r, doses.get(r.id)!);
    const autres = aDemander.filter(r => !doses.has(r.id));
    if (autres.length) StorageService.reporterDoses(autres);
    const plan = StorageService.enregistrerGeste(etat.geste);
    EffetsGeste.modifier({ manquantes: plan.manquantes.map(r => (autres.some(a => a.id === r.id) ? { ...r, reportee: true } : r)) });
  };
  const reporter = () => {
    StorageService.reporterDoses(aDemander);
    EffetsGeste.modifier({ manquantes: etat.manquantes.map(r => ({ ...r, reportee: true })) });
  };
  const rouvrir = () => {
    StorageService.rouvrirDoses(reportees);
    EffetsGeste.modifier({ manquantes: etat.manquantes.map(r => ({ ...r, reportee: false })) });
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
    {aDemander.length > 0 && <FeuilleDoses key={aDemander.map(r => r.id).join('|')} regles={aDemander} type={etat.geste.type} onRetenir={retenir} onReporter={reporter} />}
    {aDemander.length === 0 && reportees.length > 0 && <p data-doses-reportees className="text-xs text-cave-400">Doses non réglées : rien n'est décompté. <button type="button" onClick={rouvrir} className="underline underline-offset-2 text-cave-200">Régler les doses</button></p>}
    {etat.issue && <p className="text-xs text-water">{etat.issue}</p>}
    <div className="flex justify-end gap-1.5">
      {(etat.effets.length > 0 || EffetsGeste.defaireDe(etat.gesteId)) && !etat.annule && <button type="button" onClick={annuler} className="rounded-control border border-cave-600 px-3 py-1 text-xs text-cave-50 hover:bg-cave-850">Annuler</button>}
      <button type="button" onClick={() => EffetsGeste.fermer()} className="rounded-control bg-ebc-straw px-3 py-1 text-xs font-semibold text-cave-950">OK</button>
    </div>
  </div>;
}
