/** La rubrique Quand du carnet ouvert (C1, K2, D2 ; 21.11), sortie de CarnetOuvert.tsx. */
import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronRight } from 'lucide-react';
import { Horizons } from '../saisie/Horizons';
import { DureeFenetre } from '../calendrier/frise/DureeFenetre';
import { plageDate } from '../plageDate';
import { lundiDe } from '../../domain/calendrier';
import { ORDRES_DE_GRANDEUR, texteIntention } from '../../domain/horizons';
import { montant } from './EtatIA';
import type { CarnetOuvertProps } from './carnetOuvertTypes';

export const jourLocal = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * « juste, aujourd'hui, dans 1 mois, dans 3 mois… 6m 1 ans » : une rubrique à filet comme les autres (aucun élément neuf : picto, mot,
 * état en gris, puces du carnet). Un toucher date le projet (« vers févr. »), un autre le reporte. Daté, le prix : le dernier achat
 * semblable à garder d'un toucher (« Pompe 2025 : 420 CHF »), sinon les ordres de grandeur ; posé, « estimé » jusqu'à la facture.
 * Q-5 A (D435, q5-a.png) : au repos, repliée en une ligne « Quand · cette semaine · prix ? › » (40 mots au plus pour le carnet) ; un
 * toucher rouvre les puces, la frise, les pastilles et Au calendrier. Q-1b B (q1b-b.png) : en tête des pastilles, le prix que le carnet
 * connaît déjà, « 400 CHF · budget » (son critère) ou le prix lu d'un lien (« · lu »).
 */
export function RubriqueQuand(p: { date?: string; precision?: 'semaine' | 'mois'; aujourdhui: string; neuf: boolean; picto: number; onDater: (lundi: string | null, precision?: 'semaine' | 'mois') => void; onAuCalendrier?: () => void;
  prix?: CarnetOuvertProps['prix']; onPrix?: (centimes: number) => void }) {
  /* D431 (GESTE-DATE-PARTOUT, CA12-PW-2) : sous les puces raccourcis, la frise partagée du Calendrier (`DureeFenetre seule`, rangée achats) ; le repère
     suit le doigt (brouillon), la date s'écrit au lâcher (`onDater(lundi)`), jamais à chaque pas. Sans date, le repère attend sur cette semaine, estompé. */
  const lundiPose = p.date && /^\d{4}-\d{2}-\d{2}/.test(p.date) ? lundiDe(p.date.slice(0, 10)) : null;
  const [tire, setTire] = useState<string | null>(null);
  const tireRef = useRef<string | null>(null);
  useEffect(() => { tireRef.current = null; setTire(null); }, [lundiPose]);
  const quand = tire ? texteIntention(tire, p.aujourdhui, 'semaine') : texteIntention(p.date, p.aujourdhui, p.precision);
  const plage = plageDate(lundiPose ?? p.aujourdhui, p.aujourdhui);
  const [changerPrix, setChangerPrix] = useState(false);
  const pose = p.prix?.centimes;
  const semblable = p.prix?.semblable;
  const garder = (x: number) => { p.onPrix?.(x); setChangerPrix(false); };
  const [ouvert, setOuvert] = useState(false);
  const propose = p.prix?.propose;
  if (!ouvert) {
    const resume = [quand ?? 'pas encore daté', pose !== undefined ? `${montant(pose)} CHF estimé` : quand && p.onPrix ? 'prix ?' : null].filter(Boolean).join(' · ');
    return (
      <section className={`cn-rubrique cn-quand${p.neuf ? ' cn-rubrique-ligne' : ''}`} aria-label="Quand">
        <button type="button" className="cn-rubrique-tete cnq-replie" aria-expanded={false} data-quand-replie="" onClick={() => setOuvert(true)}>
          <CalendarDays size={p.picto} aria-hidden /> <b>Quand</b> <span className="cn-mut cn-sp">· {resume}</span><ChevronRight size={16} aria-hidden className="cnq-chevron" />
        </button>
      </section>
    );
  }
  return (
    <section className={`cn-rubrique cn-quand${p.neuf ? ' cn-rubrique-ligne' : ''}`} aria-label="Quand">
      <p className="cn-rubrique-tete"><button type="button" className="cnq-replier" aria-expanded onClick={() => setOuvert(false)}><CalendarDays size={p.picto} aria-hidden /> <b>Quand</b></button> <span className="cn-mut">· {quand ?? 'pas encore daté'}</span>
        {quand && pose !== undefined && <span className="cn-mut"> · {montant(pose)} CHF estimé</span>}
        {quand && pose !== undefined && p.onPrix && <> <button type="button" className="cn-lien" aria-expanded={changerPrix} onClick={() => setChangerPrix(v => !v)}>Prix</button></>}</p>
      <Horizons date={p.date} aujourdhui={p.aujourdhui} classePuce="cn-puce" className="cn-horizons" onChoisir={(_, lundi) => p.onDater(lundi)} />
      <div className="cn-quand-frise" data-quand-frise data-valeur={lundiPose ?? undefined} data-vide={lundiPose || tire ? undefined : ''}>
        <DureeFenetre seule rangee="achats" debut={tire ?? lundiPose ?? lundiDe(p.aujourdhui)} fin={null} onFin={() => undefined}
          epoque={plage.epoque} dernier={plage.dernier}
          onPlage={d => { tireRef.current = d; setTire(d); }}
          onLacher={() => { const d = tireRef.current; if (d && d !== lundiPose) p.onDater(d, 'semaine'); else { tireRef.current = null; setTire(null); } }} />
      </div>
      {quand && p.onPrix && (pose === undefined || changerPrix) && (
        <div role="group" aria-label="Prix estimé" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginTop: 8 }}>
          {/* les montants seuls ne disaient pas ce qu'ils sont : le mot en gris, comme l'état d'une rubrique */}
          <span className="cn-mut" aria-hidden>Prix estimé ?</span>
          {propose && <button type="button" className="cn-puce" data-prix-propose={propose.source} aria-pressed={pose === propose.centimes} onClick={() => garder(propose.centimes)}>{montant(propose.centimes)} CHF <span className="cn-mut">· {propose.source === 'budget' ? 'budget' : 'lu'}</span></button>}
          {semblable
            ? <button type="button" className="cn-puce" onClick={() => garder(semblable.centimes)}>{semblable.source} : {montant(semblable.centimes)} CHF · garder</button>
            : ORDRES_DE_GRANDEUR.map(x => <button key={x} type="button" className="cn-puce" aria-pressed={pose === x} onClick={() => garder(x)}>{montant(x)} CHF</button>)}
        </div>
      )}
      {p.onAuCalendrier && <button type="button" className="cn-second cn-quand-cal" onClick={p.onAuCalendrier}>Au calendrier <ChevronRight size={16} aria-hidden /></button>}
    </section>
  );
}
