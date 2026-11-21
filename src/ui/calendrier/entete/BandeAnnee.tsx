import React from 'react';
import type { MoisCalendrier } from '../../../domain/calendrier';
import { chf, MOIS_MIN, type SoldeSemaine } from './Courbe';

/**
 * L'année (E13, c1-d) : la bande passe en mois ; le mois du creux est cerclé avec son montant. Chaque mois pèse son point le plus bas de la
 * courbe libre (la barre) : c'est le « jusqu'où ça descend » du mois, pas un total. Les rangées de l'année et leurs marques sont à la frise.
 * CRITIQUE-5 n° 2 : la bande couvre TOUTES les semaines de la courbe (13 mois quand la 52e semaine tombe dans un treizième), chaque semaine dans
 * le mois de son jeudi (ISO 8601) ; le mois cerclé est celui qui contient la semaine du creux, et son montant est celui du creux, le même chiffre
 * que l'en-tête.
 */
export interface MoisAnnee { mois: number; annee: number; plusBas: number; semaines: number; lundis: string[] }
/** Les initiales des mois, comme l'année du jouable (as c1-d) : douze colonnes de 30 px à 390 ne tiennent pas « janv. » ni « sept. ». */
export const INITIALES = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'] as const;

/** Le mois (0 à 11) et l'année du jeudi d'une semaine (ISO 8601). */
function moisDuJeudi(lundi: string): { mois: number; annee: number } {
  const jeudi = new Date(Date.parse(`${lundi}T00:00:00Z`) + 3 * 86400000);
  return { mois: jeudi.getUTCMonth(), annee: jeudi.getUTCFullYear() };
}

/** Les mois des semaines de la courbe, dans l'ordre, tous : le plus bas de la courbe libre de chacun. */
export function moisDeLAnnee(courbe: readonly SoldeSemaine[]): MoisAnnee[] {
  const sortie: MoisAnnee[] = [];
  let cle = '';
  for (const s of courbe) {
    const { mois, annee } = moisDuJeudi(s.lundi);
    const k = `${annee}-${mois}`;
    if (k !== cle) { cle = k; sortie.push({ mois, annee, plusBas: s.libre, semaines: 0, lundis: [] }); }
    const dernier = sortie[sortie.length - 1];
    dernier.plusBas = Math.min(dernier.plusBas, s.libre);
    dernier.semaines += 1;
    dernier.lundis.push(s.lundi);
  }
  return sortie;
}

export interface BandeAnneeProps {
  courbe: readonly SoldeSemaine[];
  /** Les mois du modèle (`ModeleCalendrier.mois`) : s'ils sont là, ce sont eux qui nomment la bande. */
  mois?: readonly MoisCalendrier[];
  /** Le creux de l'en-tête (`lundi`, `centimes`) : son mois est cerclé, avec ce montant exactement. */
  creux?: { lundi: string; centimes: number } | null;
}

/** Les mois du modèle, chacun avec le plus bas du libre des semaines dont le jeudi tombe dans ce mois ; un mois sans semaine de la courbe est retiré. */
function moisDuModele(courbe: readonly SoldeSemaine[], mois: readonly MoisCalendrier[]): MoisAnnee[] {
  return mois.map(m => {
    const dedans = courbe.filter(s => { const j = moisDuJeudi(s.lundi); return j.annee === m.annee && j.mois + 1 === m.mois; });
    return { mois: m.mois - 1, annee: m.annee, plusBas: dedans.length ? Math.min(...dedans.map(s => s.libre)) : Number.NaN, semaines: dedans.length, lundis: dedans.map(s => s.lundi) };
  }).filter(m => m.semaines > 0);
}

export function BandeAnnee({ courbe, mois: moisModele, creux: creuxEnTete }: BandeAnneeProps) {
  const mois = moisModele && moisModele.length ? moisDuModele(courbe, moisModele) : moisDeLAnnee(courbe);
  if (!mois.length) return null;
  // Le mois cerclé : celui qui contient la semaine du creux de l'en-tête ; à défaut, le plus bas.
  let creux = creuxEnTete ? mois.findIndex(m => m.lundis.includes(creuxEnTete.lundi)) : -1;
  if (creux < 0) { creux = 0; mois.forEach((m, k) => { if (m.plusBas < mois[creux].plusBas) creux = k; }); }
  const montantCreux = creuxEnTete && mois[creux].lundis.includes(creuxEnTete.lundi) ? creuxEnTete.centimes : mois[creux].plusBas;
  const anneeDe = (m: MoisAnnee) => (m.annee !== mois[0].annee ? ` ${m.annee}` : '');
  return (
    <div className="ent-an" data-bande-annee role="img"
      aria-label={`L’année en ${mois.length} mois ; le creux : ${MOIS_MIN[mois[creux].mois].replace('.', '')}${anneeDe(mois[creux])}, ${chf(montantCreux)} CHF`}
      style={{ ['--n' as string]: mois.length }}>
      {mois.map((m, k) => (
        // Les initiales sur une même ligne de base, en haut (as c1-d : « N D J F… ») ; dessous, la barre posée au sol ; le creux est cerclé, son
        // montant juste au-dessus du cercle (jamais collé au mois voisin).
        <div key={`${m.annee}-${m.mois}`} className={`ent-an-m${k === creux ? ' ent-an-creux' : ''}${m.mois === 0 ? ' ent-an-janv' : ''}`} data-mois={`${m.annee}-${String(m.mois + 1).padStart(2, '0')}`}
          title={`${MOIS_MIN[m.mois]}${anneeDe(m)} : au plus bas ${chf(k === creux ? montantCreux : m.plusBas)} CHF`}>
          {/* CAL-ENTETE (21.11, « l'info ont l'a déjà sur le graph ») : la rangée des barres et du montant du creux, sous les initiales, redisait
              la courbe ; retirée. Le creux reste dans le titre du mois et l'aria-label. */}
          <span className="ent-an-l" aria-hidden="true">{INITIALES[m.mois]}</span>
          {/* CHV-13 : « N D J F M… » portait deux O, deux J, deux M sans dire où l'année change. Chaque janvier écrit son année (’27) à côté de sa lettre. */}
          {m.mois === 0 && <span className="ent-an-a" aria-hidden="true">{`’${String(m.annee).slice(-2)}`}</span>}
        </div>
      ))}
    </div>
  );
}
