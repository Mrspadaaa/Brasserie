import React from 'react';
import type { PeriodeSynthese } from '../../../domain/finance/periodeSynthese';
import { amountOnly } from '../financeFormat';
import { GROUPES, type GroupeId } from './groupes';

/**
 * Les piles du mois (v6b) : une colonne par catégorie, la partie payée pleine, la partie à payer hachurée.
 * Tous les nombres viennent de `periodeSynthese` (voie us) : cet écran ne recalcule ni « dépensé » ni « matériel à part ».
 * Les hauteurs sont une règle de trois sur les centimes (affichage seulement), la valeur écrite est exacte.
 * Limite : le domaine ne donne pas le reste à payer du matériel : sa pile est pleine.
 */
interface Colonne { cle: string; libelle: string; cents: number; hachureCents: number; couleur: string; signe?: '+' | '−' }

const COURT: Record<string, string> = { chargesFixes: 'Fixes', divers: 'Autres', brassage: 'Brassage', nettoyage: 'Nettoyage', recettes: 'Ventes', materiel: 'Matériel', renovation: 'Travaux', apports: 'Apports' };
const ORDRE_CHARGES = ['chargesFixes', 'brassage', 'nettoyage', 'divers'];
const couleurDe = (categorie: string): string => (GROUPES[categorie as GroupeId] ?? GROUPES.divers).liseré;

export function colonnesDe(p: PeriodeSynthese): { ventes: Colonne | null; charges: Colonne[]; materiel: Colonne | null } {
  const ventes = p.entreCents > 0 ? { cle: 'recettes', libelle: 'Ventes', cents: p.entreCents, hachureCents: p.entreAEncaisserCents, couleur: couleurDe('recettes'), signe: '+' as const } : null;
  const rang = (c: string) => { const i = ORDRE_CHARGES.indexOf(c); return i < 0 ? ORDRE_CHARGES.length : i; };
  const charges = [...p.postes].sort((a, b) => rang(a.categorie) - rang(b.categorie) || b.cents - a.cents).map(poste => ({
    cle: poste.categorie, libelle: COURT[poste.categorie] ?? poste.categorie, cents: poste.cents, hachureCents: poste.aPayerCents, couleur: couleurDe(poste.categorie),
  }));
  const materiel = p.materielCents > 0 ? { cle: 'materiel', libelle: 'Matériel', cents: p.materielCents, hachureCents: 0, couleur: couleurDe('part') } : null;
  return { ventes, charges, materiel };
}

function Pile({ c, max }: { c: Colonne; max: number }) {
  const ratio = max > 0 ? Math.max(c.cents / max, 0.04) : 0;
  const plein = Math.max(c.cents - c.hachureCents, 0);
  return <div className="ops-pile" data-pile={c.cle}>
    <b className="ops-m" data-signe={c.signe}>{c.signe ?? ''}{amountOnly(c.cents)}</b>
    <span className="ops-st" style={{ height: `calc(var(--ops-haut) * ${ratio.toFixed(4)})` }}>
      {c.hachureCents > 0 && <i className="ops-hach" style={{ flex: c.hachureCents }}/>}
      {plein > 0 && <i style={{ flex: plein, background: c.couleur }}/>}
    </span>
    <span className="ops-nom-pile">{c.libelle}</span>
  </div>;
}

/** `nom` : ce que les piles couvrent (« le mois », « la période », « tout l'historique ») ; il ne sert qu'aux noms accessibles. */
export function Piles({ periode, nom = 'le mois', apports = null }: { periode: PeriodeSynthese; nom?: string; apports?: number | null }) {
  const { ventes, charges, materiel } = colonnesDe(periode);
  const apport: Colonne | null = apports ? { cle: 'apports', libelle: 'Apports', cents: Math.abs(apports), hachureCents: 0, couleur: couleurDe('apports'), signe: apports > 0 ? '+' : '−' } : null;
  const toutes = [ventes, ...charges, materiel, apport].filter((c): c is Colonne => !!c);
  // « Pas de graph ? » (10.11) : une période sans vente ni dépense garde sa bande et le dit.
  if (!toutes.length) return <p className="ops-vide">Ni vente ni dépense sur {nom}.</p>;
  const max = Math.max(...toutes.map(c => c.cents));
  const sep = (cle: string) => <span key={cle} className="ops-sep" aria-hidden="true"/>;
  const nuancier = `linear-gradient(90deg, ${charges.map((c, i) => `${c.couleur} ${(i / Math.max(charges.length, 1)) * 100}% ${((i + 1) / Math.max(charges.length, 1)) * 100}%`).join(', ') || 'transparent 0 100%'})`;
  return <>
    <div className="ops-piles" role="group" aria-label={`${nom[0].toLocaleUpperCase('fr')}${nom.slice(1)} par catégorie`}>
      {ventes && <Pile c={ventes} max={max}/>}
      {ventes && (charges.length > 0 || materiel) && sep('s1')}
      {charges.map(c => <Pile key={c.cle} c={c} max={max}/>)}
      {materiel && charges.length > 0 && sep('s2')}
      {materiel && <Pile c={materiel} max={max}/>}
      {apport && (ventes || charges.length > 0 || materiel) && sep('s3')}
      {apport && <Pile c={apport} max={max}/>}
    </div>
    <p className="ops-legende" aria-label={`Payé, à payer et dépensé ${nom === 'le mois' ? 'du mois' : nom.replace(/^la /, 'de la ').replace(/^tout /, 'sur tout ')}`}>
      <span><i className="ops-sw" style={{ background: nuancier }}/>payé <b className="ops-m">{amountOnly(periode.payeCents)}</b></span>
      <span><i className="ops-sw ops-hach"/>à payer <b className="ops-m">{amountOnly(periode.aPayerCents)}</b></span>
      <span>dépensé <b className="ops-m">{amountOnly(periode.depenseCents)}</b></span>
    </p>
  </>;
}
