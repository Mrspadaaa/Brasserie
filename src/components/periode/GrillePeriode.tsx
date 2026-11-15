import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CalendarDays } from 'lucide-react';
import './periode.css';
import {
  INITIALES, MOIS_LONGS, bornes, comptesAnnee, compter, enPeriode, jourSaisi, memePeriode, moisDe, titre,
  type Periode, type PeriodeEntree
} from './periode';

interface GrilleProps {
  periode: PeriodeEntree;
  onChoisir: (p: Periode) => void;
  /** Dates des écritures de l'app : les comptes de la grille viennent d'elles, jamais d'un exemple. */
  dates: ReadonlyArray<string | undefined>;
  maintenant?: Date;
  /** Le titre « Période · Novembre 2026 » : absent quand la feuille le porte déjà. */
  enTete?: boolean;
}

const jj = (iso: string) => `${iso.slice(8)}.${iso.slice(5, 7)}`;
const pluriel = (n: number) => `${n} écriture${n > 1 ? 's' : ''}`;

/**
 * La grille de la période (m3r-a) : quatre raccourcis, les quatre trimestres avec leurs douze mois comptés, des dates libres.
 * Même composant dans la feuille de la pastille et dans la page Plus : une seule grille, une seule période.
 * Les chiffres sont les écritures de l'app ; un mois sans écriture dit « – », jamais 0 inventé.
 */
export const GrillePeriode: React.FC<GrilleProps> = ({ periode, onChoisir, dates, maintenant = new Date(), enTete = true }) => {
  const p = enPeriode(periode, maintenant);
  const annee = p.genre === 'tout' ? maintenant.getFullYear() : Number(bornes(p).du!.slice(0, 4));
  const { mois: parMois, trimestres } = useMemo(() => comptesAnnee(dates, annee), [dates, annee]);
  const nombre = useMemo(() => compter(dates, p, maintenant), [dates, p, maintenant]);

  const aujourdhui = moisDe(maintenant);
  const precedent = moisDe(new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1));
  const raccourcis: Array<{ cle: string; texte: string; valeur: Periode }> = [
    { cle: 'ce', texte: 'Ce mois', valeur: aujourdhui },
    { cle: 'dernier', texte: 'Mois dernier', valeur: precedent },
    { cle: 'exercice', texte: `Exercice ${maintenant.getFullYear()}`, valeur: { genre: 'annee', annee: maintenant.getFullYear() } },
    { cle: 'tout', texte: 'Tout', valeur: { genre: 'tout' } }
  ];

  /* Dates libres : deux jours « jj.mm » (l'année est celle de la période affichée), appliqués quand les deux se lisent. */
  const [du, setDu] = useState(''), [au, setAu] = useState('');
  useEffect(() => {
    if (p.genre === 'dates') { setDu(jj(p.du)); setAu(jj(p.au)); } else { setDu(''); setAu(''); }
  }, [p.genre === 'dates' ? p.du : '', p.genre === 'dates' ? p.au : '', p.genre]);
  const jourDu = du ? jourSaisi(du, annee) : null, jourAu = au ? jourSaisi(au, annee) : null;
  const inverse = !!jourDu && !!jourAu && jourDu > jourAu;
  const invalide = (du !== '' && !jourDu) || (au !== '' && !jourAu) || inverse;
  const appliquer = (a: string, b: string) => {
    const x = jourSaisi(a, annee), y = jourSaisi(b, annee);
    if (x && y && x <= y) onChoisir({ genre: 'dates', du: x, au: y });
  };

  return (
    <div className="pr pr-g">
      {enTete && <div className="pr-gt"><span>Période</span><b>{titre(p)}</b></div>}
      <div className="pr-rac" role="group" aria-label="Raccourcis de période">
        {raccourcis.map(r => (
          <button key={r.cle} type="button" aria-pressed={memePeriode(p, r.valeur)} onClick={() => onChoisir(r.valeur)}>{r.texte}</button>
        ))}
      </div>
      <div className="pr-tri" role="group" aria-label={`Trimestres ${annee}`}>
        {([1, 2, 3, 4] as const).map(t => {
          const choisi: Periode = { genre: 'trimestre', annee, trimestre: t };
          const dansTrimestre = p.genre === 'trimestre' && p.annee === annee && p.trimestre === t;
          return (
            <div key={t} className="pr-t" data-on={dansTrimestre}>
              <button type="button" className="pr-th" aria-pressed={dansTrimestre}
                aria-label={`${t === 1 ? '1er' : `${t}e`} trimestre ${annee}, ${pluriel(trimestres[t - 1])}`} onClick={() => onChoisir(choisi)}>
                <span>T{t}</span><small className="pr-m">{trimestres[t - 1] || '–'}</small>
              </button>
              <div className="pr-ms">
                {[0, 1, 2].map(i => {
                  const mois = (t - 1) * 3 + i + 1, n = parMois[mois - 1];
                  const choisiMois = p.genre === 'mois' && p.annee === annee && p.mois === mois;
                  return (
                    <button key={mois} type="button" aria-pressed={choisiMois} data-vide={n === 0}
                      aria-label={`${MOIS_LONGS[mois - 1]} ${annee}, ${n === 0 ? 'aucune écriture' : pluriel(n)}`}
                      onClick={() => onChoisir({ genre: 'mois', annee, mois })}>
                      <span>{INITIALES[mois - 1]}</span><small className="pr-m">{n || '–'}</small>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="pr-lib">
        <span className="pr-lbl"><CalendarDays size={18} aria-hidden="true" />Dates libres</span>
        <input aria-label="Du (jj.mm)" inputMode="numeric" autoComplete="off" placeholder="jj.mm" value={du} aria-invalid={invalide && !jourDu && du !== '' ? true : undefined}
          onChange={e => { setDu(e.target.value); appliquer(e.target.value, au); }} />
        <ArrowRight size={16} aria-hidden="true" />
        <input aria-label="Au (jj.mm)" inputMode="numeric" autoComplete="off" placeholder="jj.mm" value={au} aria-invalid={invalide && !jourAu && au !== '' ? true : undefined}
          onChange={e => { setAu(e.target.value); appliquer(du, e.target.value); }} />
        <span className="pr-n pr-m" role="status">{pluriel(nombre)}</span>
      </div>
      {inverse && <p className="pr-err" role="alert">La fin vient avant le début.</p>}
    </div>
  );
};
