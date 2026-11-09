import React from 'react';
import { Sheet } from '../../Sheet';
import { formatCHF } from '../../../domain/finance/ledger';
import { nombreFr } from '../../../domain/nombreAffiche';
import { explication, type PeriodeSynthese } from '../../../domain/finance/periodeSynthese';
import { couleur, libelleCategorie, texteSur } from './libelles';

/** Titre et phrase par gabarit : les chiffres viennent du domaine, aucune IA, aucune projection. */
export function texteExplication(p: PeriodeSynthese): { titre: string; phrases: string[] } {
  const e = explication(p);
  if (e.signe === 'perte') {
    return { titre: 'Pourquoi une perte ?', phrases: [p.entreCents > 0
      ? `Tu as dépensé ${formatCHF(p.depenseCents)} pour ${formatCHF(p.entreCents)} entré : ${formatCHF(-p.gainCents)} de plus que ce qui est entré.`
      : `Rien n’est entré sur cette période, et ${formatCHF(p.depenseCents)} sont dépensés.`] };
  }
  if (e.signe === 'nul' || !e.dominant) return { titre: 'Où va ce qui est entré ?', phrases: [`Ce qui est entré (${formatCHF(p.entreCents)}) couvre exactement ce qui est dépensé : ni gain ni perte.`] };
  const phrases = [`Ce qui est entré (${formatCHF(p.entreCents)}) est parti surtout dans « ${libelleCategorie(e.dominant.categorie)} » : ${formatCHF(e.dominant.cents)}, soit ${nombreFr(e.dominant.partPct, 0)} % de l’entré.`];
  if (e.second) phrases.push(`« ${libelleCategorie(e.second.categorie)} » en prend ${nombreFr(e.second.partPct, 0)} %.`);
  phrases.push(`Il en reste ${formatCHF(p.gainCents)}.`);
  const peu = p.gainCents * 4 < p.entreCents;
  return { titre: peu ? 'Pourquoi si peu ?' : 'Où va ce qui est entré ?', phrases };
}

/** E8 : la feuille « Pourquoi ? » : la phrase, la barre des parts de l'entré, la source. */
export function Pourquoi({ periode: p, nomPeriode, onClose }: { periode: PeriodeSynthese; nomPeriode: string; onClose: () => void }) {
  const { titre, phrases } = texteExplication(p);
  const e = explication(p);
  return <Sheet open title={titre} onClose={onClose} className="finance-sheet">
    <div className="syn-sheet">
      {phrases.map(t => <p key={t}>{t}</p>)}
      {e.parts.length > 0 && <div className="syn-bar" role="img" aria-label={`Parts de l’entré : ${e.parts.map(x => `${x.cle === 'gain' ? 'gain' : libelleCategorie(x.cle)} ${nombreFr(x.pct, 0)} %`).join(', ')}`}>
        {e.parts.map(x => <i key={x.cle} style={{ flex: x.cents, background: x.cle === 'gain' ? couleur('recettes') : couleur(x.cle), color: x.cle === 'gain' ? texteSur('recettes') : texteSur(x.cle) }}>{x.pct >= 12 ? `${x.cle === 'gain' ? 'Gain' : libelleCategorie(x.cle)} ${nombreFr(x.pct, 0)} %` : ''}</i>)}
      </div>}
      <p className="syn-src">Source : Opérations de {nomPeriode} ({p.lignes} ligne{p.lignes > 1 ? 's' : ''}). Calcul fait ici, sans IA.</p>
    </div>
  </Sheet>;
}
