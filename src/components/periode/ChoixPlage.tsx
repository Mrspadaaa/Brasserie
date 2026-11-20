import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CalendarDays } from 'lucide-react';
import type { Transaction } from '../../types';
import { Frise } from '../../ui/finance/operations/Frise';
import { jourMaxi } from '../../ui/finance/operations/plage';
import { useDonneesFrise } from './useDonneesFrise';
import {
  aujourdhuiISO, bornes, depuisJours, enPeriode, jourSaisi, memePeriode, moisDe,
  type Periode, type PeriodeEntree
} from './periode';
import '../../ui/finance/operations.css';
import './periode.css';

interface Props {
  periode: PeriodeEntree;
  onChoisir: (p: Periode) => void;
  /** Les opérations de l'app : la frise en dessine les dépenses jour par jour. */
  transactions?: Transaction[];
  maintenant?: Date;
}

const jj = (iso: string) => `${iso.slice(8)}.${iso.slice(5, 7)}`;
const VIDE: Transaction[] = [];

/**
 * Le choix de la période (brasseur, 15.11 : « utiliser une plage comme pour les finances ») : la frise et les poignées d'Opérations (`Frise`,
 * s2ap2), les raccourcis, deux champs « jj.mm » pour taper les jours. Même composant dans la feuille de la pastille et dans la page Plus.
 * Une seule période pour toute l'app : ce que la frise pose, Finances, Brassins et Bord le lisent. Les chiffres viennent des opérations de l'app.
 */
export const ChoixPlage: React.FC<Props> = ({ periode, onChoisir, transactions = VIDE, maintenant = new Date() }) => {
  const p = enPeriode(periode, maintenant);
  const aujourdhui = aujourdhuiISO();
  const { donnees, nombre, etendue } = useDonneesFrise(transactions);
  const { du: debut, au: fin } = bornes(p);
  /* « Tout » n'a pas de jours : la frise montre alors le mois en cours, et les poignées posent une plage. */
  const mois = (debut ?? aujourdhui).slice(0, 7);
  /* v2 (1) : « Tout l'historique » : la frise couvre l'étendue réelle (de la première à la dernière opération), poignées aux deux bouts, jamais un seul mois. */
  const plage = p.genre === 'tout' ? (etendue ?? null) : p.genre === 'mois' ? null : { du: debut as string, au: fin as string };
  const montree = plage ?? { du: `${mois}-01`, au: `${mois}-${String(new Date(Number(mois.slice(0, 4)), Number(mois.slice(5, 7)), 0).getDate()).padStart(2, '0')}` };
  const annee = Number(mois.slice(0, 4));
  /* v1 (33) : « Tout l'historique » se dit comme tel (toutes les opérations, d'où à où), jamais par les « 30 jours » du mois que la frise montre pour poser une plage. */
  const nTout = p.genre === 'tout' ? nombre(null, null) : 0;
  const jjAaaa = (iso: string) => `${iso.slice(8)}.${iso.slice(5, 7)}.${iso.slice(0, 4)}`;

  /* CAL-PASSE (21.11, n° 3) : une période à cheval sur deux années (26.10.2026 → 24.01.2027) : chaque jour se lit dans SON année ; avec l'année de la frise
     pour les deux, « 24.01 » tombait avant « 26.10 » et la feuille disait « La fin vient avant le début. » à tort. Les champs écrivent alors l'année. */
  const croise = !!debut && !!fin && debut.slice(0, 4) !== fin.slice(0, 4);
  const anneeDu = debut ? Number(debut.slice(0, 4)) : annee, anneeAu = fin ? Number(fin.slice(0, 4)) : annee;
  const ecrit = (iso: string) => (croise ? jjAaaa(iso) : jj(iso));

  const courant = moisDe(maintenant);
  const raccourcis: Array<{ cle: string; texte: string; valeur: Periode }> = [
    { cle: 'ce', texte: 'Ce mois', valeur: courant },
    { cle: 'dernier', texte: 'Mois dernier', valeur: moisDe(new Date(maintenant.getFullYear(), maintenant.getMonth() - 1, 1)) },
    { cle: 'exercice', texte: `Exercice ${maintenant.getFullYear()}`, valeur: { genre: 'annee', annee: maintenant.getFullYear() } },
    { cle: 'tout', texte: 'Tout', valeur: { genre: 'tout' } }
  ];

  /* Deux jours « jj.mm » (l'année est celle de la frise), appliqués dès que les deux se lisent. */
  const [du, setDu] = useState(''), [au, setAu] = useState('');
  /* Pendant la frappe, le champ n'est pas réécrit par la période qu'il vient de poser (« 12.1 » lu « 12.01 » effaçait le « 0 » qui suit). */
  const enSaisie = useRef(false);
  useEffect(() => {
    if (enSaisie.current) return;
    if (p.genre === 'dates' || p.genre === 'trimestre' || p.genre === 'annee') { setDu(ecrit(debut as string)); setAu(ecrit(fin as string)); } else { setDu(''); setAu(''); }
  }, [debut, fin, p.genre, croise]);
  const jourDu = du ? jourSaisi(du, anneeDu) : null, jourAu = au ? jourSaisi(au, anneeAu) : null;
  const inverse = !!jourDu && !!jourAu && jourDu > jourAu;
  const invalide = (du !== '' && !jourDu) || (au !== '' && !jourAu) || inverse;
  /* Un jour se pose dès que son mois a deux chiffres (« 12.10 ») ; « 12.1 » attend de quitter le champ. */
  const complet = (t: string) => /^\s*\d{1,2}[./\-\s]\d{2}([./\-\s]\d{4})?\s*$/.test(t);
  const appliquer = (a: string, b: string, force = false) => {
    if (!force && !(complet(a) && complet(b))) return;
    const x = jourSaisi(a, anneeDu), y = jourSaisi(b, anneeAu);
    if (x && y && x <= y) onChoisir(depuisJours(x, y));
  };
  const evSaisie = { onFocus: (e: React.FocusEvent<HTMLInputElement>) => { enSaisie.current = true; e.target.select(); }, onBlur: () => { enSaisie.current = false; appliquer(du, au, true); } };

  return (
    <div className="ops pr pr-g pr-plage">
      <div className="pr-rac" role="group" aria-label="Raccourcis de période">
        {raccourcis.map(r => (
          <button key={r.cle} type="button" aria-pressed={memePeriode(p, r.valeur)} onClick={() => onChoisir(r.valeur)}>{r.texte}</button>
        ))}
      </div>
      <Frise key={p.genre === 'tout' ? 'tout' : 'jours'} mois={mois} plage={plage} aujourdhui={aujourdhui} jourMax={jourMaxi(aujourdhui)} nbOperations={nombre(montree.du, montree.au)} donnees={donnees}
        resume={p.genre === 'tout' ? <span>Tout l’historique · {nTout === 0 ? 'aucune opération' : <><b className="ops-m">{nTout}</b> opération{nTout > 1 ? 's' : ''}</>}</span> : undefined}
        onPlage={(a, b) => onChoisir(depuisJours(a, b))} onMois={() => onChoisir({ genre: 'mois', annee, mois: Number(mois.slice(5, 7)) })} />
      <div className={`pr-lib${p.genre === 'tout' && etendue ? ' pr-tout' : ''}${croise ? ' pr-croise' : ''}`}>
        <span className="pr-lbl"><CalendarDays size={18} aria-hidden="true" />Du … au</span>
        <input aria-label="Du (jj.mm)" inputMode="numeric" autoComplete="off" placeholder={p.genre === 'tout' && etendue ? jjAaaa(etendue.du) : 'jj.mm'} value={du} aria-invalid={invalide && !jourDu && du !== '' ? true : undefined} {...evSaisie}
          onChange={e => { setDu(e.target.value); appliquer(e.target.value, au); }} />
        <ArrowRight size={16} aria-hidden="true" />
        <input aria-label="Au (jj.mm)" inputMode="numeric" autoComplete="off" placeholder={p.genre === 'tout' && etendue ? jjAaaa(etendue.au) : 'jj.mm'} value={au} aria-invalid={invalide && !jourAu && au !== '' ? true : undefined} {...evSaisie}
          onChange={e => { setAu(e.target.value); appliquer(du, e.target.value); }} />
      </div>
      {inverse && <p className="pr-err" role="alert">La fin vient avant le début.</p>}
    </div>
  );
};
