import React from 'react';
import { Sheet } from '../../Sheet';
import { formatCHF } from '../../../domain/finance/ledger';
import { nombreFr } from '../../../domain/nombreAffiche';
import { explication, type PeriodeSynthese } from '../../../domain/finance/periodeSynthese';
import { couleur, libelleCategorie, texteSur } from './libelles';

interface Unite { cle: string; categorie: string; libelle: string; cents: number }
/**
 * Les morceaux de la colonne « Dépensé » tels que le brasseur les lit : le payé de chaque catégorie, puis chaque pièce à payer sous son nom (le loyer 400,00, pas
 * « Charges fixes 468,00 » alors que la colonne écrit 68,00). `null` si les pièces à payer ne tombent pas juste sur les postes : on garde alors le domaine tel quel.
 */
function unitesDeLaColonne(p: PeriodeSynthese): Unite[] | null {
  if (p.aPayer.reduce((n, r) => n + r.cents, 0) !== p.postes.reduce((n, x) => n + x.aPayerCents, 0)) return null;
  return [...p.postes.filter(x => x.payeCents > 0).map(x => ({ cle: x.categorie, categorie: x.categorie, libelle: libelleCategorie(x.categorie), cents: x.payeCents })),
    ...p.aPayer.map(r => ({ cle: `reste:${r.id}`, categorie: r.categorie, libelle: r.libelle, cents: r.cents }))];
}
const partDe = (cents: number, base: number) => base > 0 ? Math.max(1, Math.round(cents * 100 / base)) : 0;
function partsDeLEntre(p: PeriodeSynthese, unites: Unite[]) {
  const parts = unites.map(u => ({ cle: u.cle, libelle: u.libelle, categorie: u.categorie, cents: u.cents, pct: partDe(u.cents, p.entreCents) }));
  if (p.gainCents > 0) parts.push({ cle: 'gain', libelle: 'Gain', categorie: 'recettes', cents: p.gainCents, pct: partDe(p.gainCents, p.entreCents) });
  const ecart = 100 - parts.reduce((n, x) => n + x.pct, 0);
  if (ecart !== 0 && parts.length) { const gros = parts.reduce((a, b) => b.cents > a.cents ? b : a); gros.pct = Math.max(1, gros.pct + ecart); }
  return parts;
}

/** Titre et phrase par gabarit : les chiffres viennent du domaine, aucune IA, aucune projection. */
export function texteExplication(p: PeriodeSynthese): { titre: string; phrases: string[] } {
  const e = explication(p);
  const unites = e.signe === 'gain' && p.entreCents > 0 ? unitesDeLaColonne(p) : null;
  if (unites && unites.length) {
    const tri = [...unites].sort((a, b) => b.cents - a.cents || a.libelle.localeCompare(b.libelle));
    const phrases = [`Ce qui est entré (${formatCHF(p.entreCents)}) est parti surtout dans « ${tri[0].libelle} » : ${formatCHF(tri[0].cents)}, soit ${nombreFr(partDe(tri[0].cents, p.entreCents), 0)} % de l’entré.`];
    if (tri[1]) phrases.push(`« ${tri[1].libelle} » en prend ${nombreFr(partDe(tri[1].cents, p.entreCents), 0)} %.`);
    phrases.push(`Il en reste ${formatCHF(p.gainCents)}.`);
    return { titre: p.gainCents * 4 < p.entreCents ? 'Pourquoi si peu ?' : 'Où va ce qui est entré ?', phrases };
  }
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
  const unites = e.signe === 'gain' && p.entreCents > 0 ? unitesDeLaColonne(p) : null;
  // Les parts suivent le même découpage que la phrase : le loyer à payer est son propre morceau, séparé du payé de sa catégorie.
  const parts = unites ? partsDeLEntre(p, unites) : e.parts.map(x => ({ ...x, libelle: x.cle === 'gain' ? 'Gain' : libelleCategorie(x.cle), categorie: x.cle === 'gain' ? 'recettes' : x.cle }));
  return <Sheet open title={titre} onClose={onClose} className="finance-sheet">
    <div className="syn-sheet">
      {phrases.map(t => <p key={t}>{t}</p>)}
      {parts.length > 0 && <div className="syn-bar" role="img" aria-label={`Parts de l’entré : ${parts.map(x => `${x.cle === 'gain' ? 'gain' : x.libelle} ${nombreFr(x.pct, 0)} %`).join(', ')}`}>
        {parts.map(x => <i key={x.cle} style={{ flex: x.cents, background: couleur(x.categorie), color: texteSur(x.categorie), ...(x.cle.startsWith('reste:') ? { boxShadow: 'inset 2px 0 0 rgba(255,255,255,.75)' } : {}) }}>{x.pct >= 12 ? `${x.libelle} ${nombreFr(x.pct, 0)} %` : ''}</i>)}
      </div>}
      <p className="syn-src">Source : Opérations de {nomPeriode} ({p.lignes} ligne{p.lignes > 1 ? 's' : ''}). Calcul fait ici, sans IA.</p>
    </div>
  </Sheet>;
}
