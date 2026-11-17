import React from 'react';
import type { MoisCalendrier } from '../../../domain/calendrier';
import { chf, moisDeSemaine, MOIS_MIN, type SoldeSemaine } from './Courbe';

/**
 * L'année (E13, c1-d) : la bande passe en 12 mois ; le mois du creux est cerclé avec son montant. Chaque mois pèse son point le plus bas de la
 * courbe libre (la barre) : c'est le « jusqu'où ça descend » du mois, pas un total. Les rangées de l'année et leurs marques sont à la frise.
 */
export interface MoisAnnee { mois: number; plusBas: number; semaines: number }
/** Les initiales des mois, comme l'année du jouable (as c1-d) : douze colonnes de 30 px à 390 ne tiennent pas « janv. » ni « sept. ». */
export const INITIALES = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] as const;

/** Les mois des semaines de la courbe, dans l'ordre, au plus 12 : le plus bas de la courbe libre de chacun. */
export function moisDeLAnnee(courbe: readonly SoldeSemaine[]): MoisAnnee[] {
  const sortie: MoisAnnee[] = [];
  let cle = '';
  for (const s of courbe) {
    const m = moisDeSemaine(s.lundi);
    const k = `${s.lundi.slice(0, 4)}-${m}`;
    if (k !== cle) { cle = k; sortie.push({ mois: m, plusBas: s.libre, semaines: 0 }); }
    const dernier = sortie[sortie.length - 1];
    dernier.plusBas = Math.min(dernier.plusBas, s.libre);
    dernier.semaines += 1;
  }
  return sortie.slice(0, 12);
}

export interface BandeAnneeProps {
  courbe: readonly SoldeSemaine[];
  /** Les douze mois du modèle (`ModeleCalendrier.mois`) : s'ils sont là, ce sont eux qui nomment la bande. */
  mois?: readonly MoisCalendrier[];
}

/** Les mois du modèle, chacun avec le plus bas du libre des semaines dont le jeudi tombe dans ce mois (`null` : aucune semaine de la courbe n'y est). */
function moisDuModele(courbe: readonly SoldeSemaine[], mois: readonly MoisCalendrier[]): MoisAnnee[] {
  return mois.map(m => {
    const dedans = courbe.filter(s => { const jeudi = new Date(Date.parse(`${s.lundi}T00:00:00Z`) + 3 * 86400000); return jeudi.getUTCFullYear() === m.annee && jeudi.getUTCMonth() + 1 === m.mois; });
    return { mois: m.mois - 1, plusBas: dedans.length ? Math.min(...dedans.map(s => s.libre)) : Number.NaN, semaines: dedans.length };
  }).filter(m => m.semaines > 0);
}

export function BandeAnnee({ courbe, mois: moisModele }: BandeAnneeProps) {
  const mois = moisModele && moisModele.length ? moisDuModele(courbe, moisModele).slice(0, 12) : moisDeLAnnee(courbe);
  if (!mois.length) return null;
  let creux = 0;
  mois.forEach((m, k) => { if (m.plusBas < mois[creux].plusBas) creux = k; });
  const sommet = Math.max(1, ...mois.map(m => m.plusBas));
  return (
    <div className="ent-an" data-bande-annee role="img" aria-label={`L’année en ${mois.length} mois ; le creux : ${MOIS_MIN[mois[creux].mois].replace('.', '')}, ${chf(mois[creux].plusBas)} CHF`}
      style={{ ['--n' as string]: mois.length }}>
      {mois.map((m, k) => (
        // Les initiales sur une même ligne de base, en haut (as c1-d : « N D J F… ») ; dessous, la barre posée au sol ; le creux est cerclé, son
        // montant juste au-dessus du cercle (jamais collé au mois voisin).
        <div key={`${m.mois}-${k}`} className={k === creux ? 'ent-an-m ent-an-creux' : 'ent-an-m'} title={`${MOIS_MIN[m.mois]} : au plus bas ${chf(m.plusBas)} CHF`}>
          <span className="ent-an-l" aria-hidden="true">{INITIALES[m.mois]}</span>
          <span className="ent-an-z">
            {k === creux && <span className="ent-an-v">{chf(m.plusBas)}</span>}
            <span className="ent-an-b"><i style={{ height: k === creux ? 6 : Math.max(4, Math.round((Math.max(0, m.plusBas) / sommet) * 22)) }} /></span>
          </span>
        </div>
      ))}
    </div>
  );
}
