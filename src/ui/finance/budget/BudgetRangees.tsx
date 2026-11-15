import React from 'react';
import type { NoeudId } from '../CoutBrassinFlux';
import { fr } from '../CoutBrassinFlux';
import type { EtatRangee, GroupeBudget, RangeeBudget } from './piles';
import '../operations.css';
import './budget.css';

/** Pastille, classe et mot de chaque état d'une rangée (m4bb-a) : la hachure dit « à payer », le pointillé « inconnu ». */
const PASTILLE: Record<EtatRangee, { classe: string; mot: string }> = {
  stock: { classe: 'ops-tg ops-tg-ok', mot: '✓ stock' },
  mixte: { classe: 'ops-tg ops-tg-pay', mot: 'stock + achat' },
  acheter: { classe: 'ops-tg ops-tg-pay', mot: 'à acheter' },
  inconnu: { classe: 'ops-tg bbx-unk', mot: '? prix' },
  payer: { classe: 'ops-tg ops-tg-pay', mot: 'à payer' },
  compris: { classe: 'ops-tg ops-tg-ok', mot: 'compris' },
  annee: { classe: 'ops-tg bbx-yr', mot: 'réparti' }
};
const COULEUR_GROUPE: Record<GroupeBudget['id'], string> = { malt: 'rgb(var(--c-d2b356))', q: '#8DBF5A', autres: '#8A8A8A', frais: 'rgb(var(--c-56c1d2))', annee: 'rgb(var(--c-9856d2))' };
const CARRE: Record<GroupeBudget['id'], { fond: string; trait: string; d: string }> = {
  malt: { fond: 'rgb(var(--c-564925))', trait: 'rgb(var(--ct-f4e5b9))', d: 'M12 21V8M12 8c-3 0-4-3-4-5 2 0 4 1 4 5z' },
  q: { fond: 'rgb(var(--c-255633))', trait: 'rgb(var(--ct-b9f4ca))', d: 'M12 3c4 3 5 7 3 11-1 2-2 3-3 7-1-4-2-5-3-7-2-4-1-8 3-11z' },
  autres: { fond: 'rgb(var(--cave-700))', trait: 'rgb(var(--cave-texte-50))', d: 'M9 3h6M10 3v6l-5 10h14L14 9V3' },
  frais: { fond: 'rgb(var(--c-254f56))', trait: 'rgb(var(--ct-b9ecf4))', d: 'M13 2L5 14h6l-1 8 8-12h-6z' },
  annee: { fond: 'rgb(var(--c-3f2556))', trait: 'rgb(var(--ct-d8b9f4))', d: 'M4 11l8-6 8 6v9H4z' }
};

/** Le liseré : plein (stock, année), hachuré (à payer, à acheter), mi-plein mi-hachuré (stock + achat), pointillé gris (inconnu). */
function liseré(r: RangeeBudget, couleur: string): React.CSSProperties {
  if (r.etat === 'inconnu') return { background: 'repeating-linear-gradient(180deg, rgb(var(--cave-texte-400)) 0 3px, transparent 3px 6px)' };
  if (r.etat === 'mixte') { const part = Math.round(r.partStock / Math.max(r.partStock + r.partPayer, 0.01) * 100); return { background: `linear-gradient(180deg, ${couleur} 0 ${part}%, transparent ${part}%)`, boxShadow: 'inset 0 0 0 1px rgb(var(--attention))' }; }
  if (r.etat === 'acheter' || r.etat === 'payer') return {};
  return { background: couleur, opacity: r.etat === 'compris' ? 0.55 : 1 };
}

function Rangee({ r, groupe, onOuvrir }: { r: RangeeBudget; groupe: GroupeBudget['id']; onOuvrir: (n: NoeudId) => void }) {
  const p = PASTILLE[r.etat];
  const couleur = groupe === 'annee' ? (r.noeud === 'mat' ? 'rgb(var(--c-567bd2))' : 'rgb(var(--c-9856d2))') : COULEUR_GROUPE[groupe];
  const montant = r.montant === null ? '?' : fr(r.montant);
  return <button type="button" className="bbx-op" data-etat={r.etat} data-noeud={r.noeud} data-cle={r.cle} aria-label={`${r.nom}${r.detail ? ` · ${r.detail}` : ''} : ${r.montant === null ? 'à compléter' : `${r.estime ? 'estimé ' : ''}${montant} CHF`}, ${p.mot.replace('✓ ', '')}`} onClick={() => onOuvrir(r.noeud)}>
    <span className={`bbx-bar${r.etat === 'acheter' || r.etat === 'payer' ? ' ops-hach' : ''}`} style={liseré(r, couleur)} aria-hidden="true" />
    <span className="bbx-q">{r.nom}{r.detail && <small> · {r.detail}</small>}</span>
    <span className={`${p.classe} bbx-pa`}>{p.mot}</span>
    <span className={`bbx-a ops-m${r.estime && r.montant !== null ? ' bbx-est' : ''}`}>{montant}</span>
  </button>;
}

/** m4bb-a, la liste : un groupe (carré, nom, total) puis ses rangées. Le toucher d'une rangée ouvre le détail déjà existant (lot minimum, TVA, origine du prix). */
export function BudgetRangees({ groupes, onOuvrir }: { groupes: GroupeBudget[]; onOuvrir: (n: NoeudId) => void }) {
  return <div className="bbx-liste">
    {groupes.map(g => <section key={g.id} className="bbx-groupe" data-groupe={g.id} aria-label={g.titre}>
      {(() => {
        // CP-18 : un total de groupe inconnu (« ? ») renvoie au détail du groupe, jamais un « ? » nu.
        const entete = <>
          <span className="ops-sq" style={{ background: CARRE[g.id].fond }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={CARRE[g.id].trait} strokeWidth="2.6" aria-hidden="true"><path d={CARRE[g.id].d} /></svg></span>
          <b>{g.titre}</b>
          <span className="ops-m bbx-tot">{g.horsRecette ? '—' : g.total === null ? '?' : fr(g.total)}</span>
        </>;
        const noeud = g.id === 'malt' || g.id === 'q' || g.id === 'autres' ? g.id : g.rangees[0]?.noeud;
        return !g.horsRecette && g.total === null && noeud
          ? <button type="button" className="bbx-g bbx-g-renvoi" aria-label={`${g.titre} : à compléter`} onClick={() => onOuvrir(noeud)}>{entete}</button>
          : <div className="bbx-g">{entete}</div>;
      })()}
      {g.horsRecette
        ? <button type="button" className="bbx-hors" onClick={() => onOuvrir(g.id === 'q' ? 'q' : 'malt')}><span className="ops-tg bbx-unk">hors recette</span><span>aucun houblon ni levure : le litre ne les compte pas</span></button>
        : g.rangees.map(r => <Rangee key={r.cle} r={r} groupe={g.id} onOuvrir={onOuvrir} />)}
    </section>)}
  </div>;
}
