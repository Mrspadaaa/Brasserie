import React, { useLayoutEffect, useRef } from 'react';
import type { PeriodeSynthese } from '../../../domain/finance/periodeSynthese';
import { Sheet } from '../../Sheet';
import { amountOnly } from '../financeFormat';
import { colonnesDe } from '../operations/Piles';
import type { ReglagesContexte } from './contexte';
import '../operations.css';
import './compagnon.css';

/**
 * m4ia-c (choix du 15.11) : « Ce que le compagnon va lire ». La pile visée entourée, la question modifiable, les pastilles du contexte
 * (cochées = lues, grises = à ajouter), « Auto ⌄ » et « Envoyer ». Rien n'est envoyé à Gemini ici : « Envoyer » ouvre le chat avec la question
 * préremplie (le chat ne démarre jamais seul).
 */
export type ModeReponse = 'fast' | 'auto' | 'deep';
export const MODES: Array<{ value: ModeReponse; label: string }> = [
  { value: 'fast', label: 'Rapide' }, { value: 'auto', label: 'Auto' }, { value: 'deep', label: 'Approfondi' },
];

export interface PastilleVue { cle: keyof ReglagesContexte; libelle: string; coche: boolean; hachure?: boolean }

interface Props {
  open: boolean; onClose: () => void;
  /** Les piles de la période de la question ; null : la feuille n'en sait pas la période, elle n'en montre pas (jamais une bande qui contredit la question). */
  periode: PeriodeSynthese | null; nomPeriode: string;
  /** Catégorie de la pile visée ; null : toutes les charges sont lues, aucune n'est entourée. */
  vise: string | null;
  texte: string; onTexte: (t: string) => void;
  pastilles: PastilleVue[]; onBascule: (cle: keyof ReglagesContexte) => void;
  mode: ModeReponse; onMode: (m: ModeReponse) => void;
  onEnvoyer: () => void;
}

function Bande({ periode, nomPeriode, vise }: { periode: PeriodeSynthese; nomPeriode: string; vise: string | null }) {
  const { ventes, charges, materiel } = colonnesDe(periode);
  const toutes = [ventes, ...charges, materiel].filter((c): c is NonNullable<typeof ventes> => !!c);
  if (!toutes.length) return <div className="cpg-band"><div className="cpg-t"><span>Ta question vise</span><span>{nomPeriode}</span></div><p className="cpg-vide">Ni vente ni dépense sur cette période.</p></div>;
  const max = Math.max(...toutes.map(c => c.cents));
  const allumee = (cle: string) => (vise ? cle === vise : cle !== 'recettes' && cle !== 'materiel');
  return <div className="cpg-band" data-bande="">
    <div className="cpg-t"><span>Ta question vise</span><span>{nomPeriode}</span></div>
    <div className="cpg-piles" role="group" aria-label={`Ce que la question vise : ${nomPeriode}`}>
      {toutes.map(c => {
        const plein = Math.max(c.cents - c.hachureCents, 0), on = allumee(c.cle), cible = !!vise && c.cle === vise;
        return <div key={c.cle} className={`cpg-p${on ? ' cpg-on' : ''}`} data-pile={c.cle} data-vise={cible ? '' : undefined}>
          <b className="ops-m" data-signe={c.signe}>{c.signe ?? ''}{amountOnly(c.cents)}</b>
          <span className={`cpg-st${cible ? ' cpg-cible' : ''}`} style={{ height: `calc(var(--cpg-haut) * ${Math.max(c.cents / max, 0.05).toFixed(4)})` }}>
            {c.hachureCents > 0 && <i className="ops-hach" style={{ flex: c.hachureCents }}/>}
            {plein > 0 && <i style={{ flex: plein, background: c.couleur }}/>}
          </span>
          <span className={`cpg-nom${cible ? ' cpg-nom-on' : ''}`}>{c.libelle}</span>
        </div>;
      })}
    </div>
  </div>;
}

export function CompagnonFeuille({ open, onClose, periode, nomPeriode, vise, texte, onTexte, pastilles, onBascule, mode, onMode, onEnvoyer }: Props) {
  // La question grandit avec son texte (2 lignes comme la maquette, plus pour une question longue) : jamais un champ à faire défiler dans une feuille.
  const champ = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => { const c = champ.current; if (c) { c.style.height = 'auto'; c.style.height = `${c.scrollHeight}px`; } });
  return <Sheet open={open} onClose={onClose} title="✦ Compagnon brasseur" className="finance-sheet">
    <div className="ops cpg">
      {periode && <Bande periode={periode} nomPeriode={nomPeriode} vise={vise}/>}
      <label className="cpg-qlab" htmlFor="cpg-question">Ta question</label>
      <textarea id="cpg-question" ref={champ} className="cpg-q" value={texte} rows={2} onChange={e => onTexte(e.target.value)}/>
      <p className="cpg-k">Ce qu’il va lire</p>
      <div className="cpg-pills" role="group" aria-label="Ce que le compagnon va lire">
        {pastilles.map(p => <button key={p.cle} type="button" aria-pressed={p.coche} data-pastille={p.cle}
          className={`cpg-pl ${p.coche ? 'cpg-in' : 'cpg-outp'}${p.hachure ? ' cpg-pay' : ''}`} onClick={() => onBascule(p.cle)}>{p.libelle}</button>)}
      </div>
      <p className="cpg-ex">Il lit aussi le registre : une pastille décochée lui est demandée en consigne, elle n’est pas coupée du registre.</p>
      <div className="cpg-send">
        <span className="cpg-mode"><select aria-label="Mode de réponse" value={mode} onChange={e => onMode(e.target.value as ModeReponse)}>
          {MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select><span aria-hidden="true">⌄</span></span>
        <button type="button" className="cpg-pri" onClick={onEnvoyer}>Envoyer</button>
      </div>
    </div>
  </Sheet>;
}
