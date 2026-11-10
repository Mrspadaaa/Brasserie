import React from 'react';
import { ChevronRight } from 'lucide-react';
import { graduations, type Cascade, type SourceCle } from '../../../domain/finance/analyse';
import { chf, categorieDeSource, jourMois, nomSource, signe } from './format';
import { Pourquoi, type TextePourquoi } from './Pourquoi';
import type { VueProps } from './Caisse';

interface Rang { cle: string; libelle: string; source: SourceCle | 'caisse' | 'apports' | 'reste' | 'gagne'; de: number; a: number; valeur: string; prevu: number | null; an: number | null; depasse: number; hachure?: boolean; cliquable: boolean }

/** Les rangs de la cascade, dans l'ordre de a1e : caisse au début → ventes → chaque source → apports privés → reste à payer → matériel → caisse à la fin. */
export function rangsCascade(c: Cascade, debutLibelle: string, finLibelle: string): Rang[] {
  const rangs: Rang[] = [];
  let courant = 0;
  if (c.debutCents !== null) { rangs.push({ cle: 'debut', libelle: debutLibelle, source: 'caisse', de: 0, a: c.debutCents, valeur: chf(c.debutCents), prevu: null, an: null, depasse: 0, cliquable: false }); courant = c.debutCents; }
  rangs.push({ cle: 'ventes', libelle: 'Ventes', source: 'ventes', de: courant, a: courant + c.ventesCents, valeur: signe(c.ventesCents), prevu: c.ventesPrevuCents, an: c.ventesAnCents, depasse: 0, cliquable: true });
  courant += c.ventesCents;
  for (const l of c.lignes) {
    rangs.push({ cle: l.source, libelle: nomSource(l.source), source: l.source, de: courant, a: courant - l.reelCents, valeur: signe(-l.reelCents), prevu: l.prevuCents, an: l.anCents, depasse: l.depasseCents, cliquable: true });
    courant -= l.reelCents;
  }
  // fx1 : l'écart qui rattache la caisse de fin à celle du début se dit en deux choses, chacune avec son renvoi : les apports privés (paiements signés) et le reste à payer.
  // Un reste négatif n'est pas « à payer » : ce sont des paiements d'une autre période (ou des ventes pas encore encaissées) ; il se dit autrement.
  if (c.apportsCents) { rangs.push({ cle: 'apports', libelle: 'Apports privés', source: 'apports', de: courant, a: courant + c.apportsCents, valeur: signe(c.apportsCents), prevu: null, an: null, depasse: 0, cliquable: true }); courant += c.apportsCents; }
  if (c.resteCents) { rangs.push({ cle: 'reste', libelle: c.resteCents > 0 ? 'Reste à payer' : 'Payé hors période', source: 'reste', de: courant, a: courant + c.resteCents, valeur: signe(c.resteCents), prevu: null, an: null, depasse: 0, hachure: true, cliquable: true }); courant += c.resteCents; }
  if (c.debutCents === null) rangs.push({ cle: 'gagne', libelle: 'Gagné', source: 'gagne', de: 0, a: courant, valeur: signe(courant), prevu: null, an: null, depasse: 0, cliquable: false });
  if (c.materielCents > 0) { rangs.push({ cle: 'materiel', libelle: 'Matériel', source: 'materiel', de: courant, a: courant - c.materielCents, valeur: signe(-c.materielCents), prevu: null, an: c.materielAnCents, depasse: 0, hachure: true, cliquable: true }); courant -= c.materielCents; }
  if (c.finCents !== null) rangs.push({ cle: 'fin', libelle: finLibelle, source: 'caisse', de: 0, a: c.finCents, valeur: chf(c.finCents), prevu: null, an: null, depasse: 0, cliquable: false });
  return rangs;
}

export interface SourcesProps extends VueProps { c: Cascade; aujourdhui: string; finJour: string; pourquoi: TextePourquoi | null; moisJournal?: string }

/** Figure 2 : la cascade couchée. Une ligne par source ; prévu en cadre pointillé, l'an dernier en encoche, dépassé hachuré, matériel à part. */
export function SourcesVue({ c, finJour, duree, pourquoi, onJournal }: SourcesProps) {
  const debut = c.depuis ?? `${c.plage.du}-01`;
  const rangs = rangsCascade(c, jourMois(debut), jourMois(finJour));
  const bornes = rangs.flatMap(r => [r.de, r.a, r.prevu === null ? r.de : r.de + (r.a >= r.de ? 1 : -1) * r.prevu]);
  const max = Math.max(1, ...bornes), min = Math.min(0, ...bornes);
  const gr = graduations(min, max, 3), bas = Math.min(min, gr.bas), haut = Math.max(max, gr.haut);
  const pct = (v: number) => `${((v - bas) / (haut - bas) * 100).toFixed(2)}%`;
  const larg = (a: number, b: number) => `${(Math.abs(b - a) / (haut - bas) * 100).toFixed(2)}%`;
  const dep = c.plusGrosDepassement;
  return <>
    <p className="ana-dit">
      {c.debutCents !== null && c.finCents !== null
        ? <>D’où vient l’argent, où il va : <b className="ana-fin-c">{chf(c.debutCents)}</b> au {jourMois(debut)} → <b className="ana-fin-c">{chf(c.finCents)}</b> au {jourMois(finJour)} (CHF).</>
        : <>D’où vient l’argent, où il va sur {duree} : <b className={c.gagneCents >= 0 ? 'ana-ok' : 'ana-mal'}>{signe(c.gagneCents)} CHF</b> gagné, matériel à part.</>}
      {dep ? <> Le {nomSource(dep.source).toLowerCase()} dépasse le prévu de <b className="ana-mal">{chf(dep.depasseCents)}</b>.</> : c.aPrevu ? <> Rien ne dépasse le prévu.</> : null}
    </p>
    {c.nombrePieces === 0 && c.ventesCents === 0 ? <p className="ana-vide">Aucune pièce sur cette période.</p> : <div className="ana-cascade" role="list" aria-label="Cascade des sources">
      {rangs.map(r => {
        const sens = r.a >= r.de ? 1 : -1;
        const barre = <span className={`ana-barre ${r.source === 'caisse' ? 'ana-s-caisse' : r.source === 'apports' ? 'ana-s-prive' : r.source === 'reste' ? 'ana-s-autres' : `ana-s-${r.source}`}${r.hachure ? ' ana-hach-mat' : ''}`} style={{ left: pct(Math.min(r.de, r.a)), width: larg(r.de, r.a) }}/>;
        const contenu = <>
          <span className="ana-lib">{r.libelle}</span>
          <span className="ana-piste">
            {r.prevu !== null && <span className="ana-cadre" style={{ left: pct(Math.min(r.de, r.de + sens * r.prevu)), width: larg(r.de, r.de + sens * r.prevu) }} aria-hidden="true"/>}
            {barre}
            {r.depasse > 0 && <span className="ana-depasse" style={{ left: pct(Math.min(r.a, r.a + r.depasse)), width: larg(r.a, r.a + r.depasse) }} aria-label={`dépassé de ${chf(r.depasse)}`}/>}
            {r.an !== null && <span className="ana-encoche" style={{ left: pct(r.de + sens * r.an) }} aria-hidden="true"/>}
          </span>
          <span className="ana-val ana-m">{r.valeur}</span>
        </>;
        const cat = r.source === 'caisse' || r.source === 'gagne' || r.source === 'apports' || r.source === 'reste' ? undefined : categorieDeSource(r.source);
        const renvoi = r.source === 'apports' ? { category: 'apports' } : r.source === 'reste' ? (r.a > r.de ? { filter: 'payable' } : {}) : { category: cat };
        return r.cliquable
          ? <button type="button" role="listitem" key={r.cle} className="ana-rang" aria-label={`${r.libelle} ${r.valeur} CHF${r.prevu !== null ? `, prévu ${chf(r.prevu)}` : ''}${r.depasse > 0 ? `, dépassé de ${chf(r.depasse)}` : ''}, voir ces opérations`} onClick={() => onJournal({ scope: 'all', allDates: true, ...renvoi })}>{contenu}</button>
          : <div role="listitem" key={r.cle} className="ana-rang">{contenu}</div>;
      })}
      <div className="ana-echelle" aria-hidden="true"><span className="ana-lib"/><span className="ana-piste">{gr.valeurs.filter(v => v >= bas && v <= haut).map(v => <span key={v} className="ana-tic ana-m" style={{ left: pct(v) }}>{chf(v).replace(/[,.]00$/, '')}</span>)}</span><span className="ana-val"/></div>
    </div>}
    <div className="ana-leg" aria-label="Légende">
      {c.aPrevu && <span><i className="ana-i-cadre"/>prévu</span>}
      {c.lignes.some(l => l.anCents !== null) && <span><i className="ana-i-encoche"/>même période l’an dernier</span>}
      {dep && <span><i className="ana-i-depasse"/>dépassé</span>}
      {c.materielCents > 0 && <span><i className="ana-i-mat"/>matériel, à part du gagné</span>}
    </div>
    {pourquoi && <Pourquoi texte={pourquoi} ouvert/>}
    {!c.aPrevu && <p className="ana-note">Rien de prévu sur cette période : les cadres pointillés n’apparaissent qu’avec un plan.</p>}
    <div className="ana-pied"><span/><button type="button" className="ana-ops" onClick={() => onJournal({ scope: 'all', allDates: true })}><b className="ana-m">{c.nombrePieces}</b> {c.nombrePieces > 1 ? 'opérations' : 'opération'} <ChevronRight size={14} aria-hidden="true"/></button></div>
  </>;
}
