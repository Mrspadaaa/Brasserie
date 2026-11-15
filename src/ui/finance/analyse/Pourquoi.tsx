import React, { useState } from 'react';
import type { LigneBrassin, Pourquoi as PourquoiCalcul } from '../../../domain/finance/analyse';
import { chf, jjmm, nomSource, signe } from './format';

/** Un texte de « ✦ Pourquoi ? » : un titre, des phrases (les nombres sont déjà écrits), la source. Gabarit sourcé : aucune IA. */
export interface TextePourquoi { titre: string; phrases: React.ReactNode[]; source: string }

/** La phrase d'un dépassement : les pièces hors prévu, les plus grosses d'abord, puis les brassins dépassés. */
export function textePourquoiDepasse(p: PourquoiCalcul, brassins: LigneBrassin[] = p.brassinsDepasses): TextePourquoi {
  const nom = nomSource(p.source).toLowerCase();
  const phrases: React.ReactNode[] = [];
  if (p.horsPrevu.length) phrases.push(<>{p.horsPrevu.length > 1 ? 'Hors du prévu' : 'Hors du prévu'} : {p.horsPrevu.map((x, i) => <React.Fragment key={x.id}>{i > 0 && ', '}{x.libelle} <b className="ana-m">{signe(-x.cents)}</b> ({jjmm(x.date)})</React.Fragment>)}. Au total <b className="ana-m">{chf(p.horsPrevuCents)}</b> CHF sans plan.</>);
  for (const b of brassins.slice(0, 2)) phrases.push(<>{b.nom} ({b.mois.slice(5, 7)}.{b.mois.slice(0, 4)}) a coûté <b className="ana-m">{chf(b.reelCents ?? 0)}</b> au lieu de <b className="ana-m">{chf(b.prevuCents ?? 0)}</b> CHF.</>);
  if (!phrases.length) phrases.push(<>Le {nom} dépasse son prévu, sans pièce hors plan : le prévu est plus bas que les pièces rattachées.</>);
  return { titre: `Pourquoi le ${nom} dépasse de ${chf(p.depasseCents)} CHF ?`, phrases, source: `Sources : ${p.nombrePieces} ${p.nombrePieces > 1 ? 'pièces' : 'pièce'} ${nomSource(p.source)}, journal des opérations` };
}

/** Le bouton « ✦ Pourquoi ? » ; il ouvre le panneau violet de la maquette, sous le bouton. `ouvert` : ouvert d'emblée (vue Sources, figure 2). */
export function Pourquoi({ texte, ouvert = false }: { texte: TextePourquoi | null; ouvert?: boolean }) {
  const [vu, setVu] = useState(ouvert);
  if (!texte) return <span/>;
  return <>
    {!ouvert && <button type="button" className="ana-ia" aria-expanded={vu} onClick={() => setVu(!vu)}><span aria-hidden="true">✦ </span>Pourquoi ?</button>}
    {vu && <div className="ana-rep" role="region" aria-label={texte.titre}>
      <span className="ana-rep-t"><span aria-hidden="true">✦ </span>{texte.titre}</span>
      {texte.phrases.map((p, i) => <span key={i}>{p}</span>)}
      <small>{texte.source}. Calcul fait ici, sans IA.</small>
    </div>}
  </>;
}
