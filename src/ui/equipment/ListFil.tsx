import React from 'react';
import { Check, ChevronRight, ExternalLink, Package, ShoppingCart, Wrench } from 'lucide-react';
import type { EquipmentItem } from '../../types';
import { addMonthsClamped, calibrationPreset, dateCourte, daysBetween, moisCourt, premierDuMois, type AvenirRow, type FilDuTemps, type StatusRow } from '../../domain/equipment';
import { EquipmentPicto } from './ListPictos';

/** Le fil de la liste (za3) : à traiter en haut, « aujourd'hui », l'avenir à sa vraie distance, puis le sans-échéance et le pied. */

const mono = (texte: string): React.ReactNode =>
  texte.split(/(\d{2}\.\d{2}|\d+)/).map((p, i) => (i % 2 ? <span key={i} className="mt-m">{p}</span> : p));

/** STC-16 : « Fermenteur 120 L » ne se coupe pas entre le nombre et son unité (espace insécable, U+00A0) ; le reste du nom se plie comme avant. */
const UNITE_APRES_NOMBRE = /(\d)\s+(L|l|ml|cl|dl|hl|kg|g|mm|cm|m|W|kW|V|bar|°C|°)(?![\p{L}\d])/gu;
export const nomInsecable = (nom: string): string => nom.replace(UNITE_APRES_NOMBRE, (_t, n: string, u: string) => `${n} ${u}`);

/** « fuit au raccord · depuis le 05.11 » : le verbe en encre, la suite en gris, les dates en chiffres tabulaires. */
export const SousLigne: React.FC<{ line: string }> = ({ line }) => {
  const [verbe, ...reste] = line.split(' · ');
  return <div className="mt-meta"><span className="mt-v3">{verbe}</span>{reste.length > 0 && <span className="mt-q">{mono(reste.join(' · '))}</span>}</div>;
};

export type GesteKind = 'repare' | 'etalonne' | 'fait';
export const gesteDe = (r: StatusRow): GesteKind => r.status.kind === 'panne' ? 'repare' : calibrationPreset(r.item) ? 'etalonne' : 'fait';
const LIBELLE: Record<GesteKind, string> = { repare: 'Réparée', etalonne: 'Étalonner', fait: 'Fait' };

export interface Recent { ref: string; nom: string; jusquau: string | null; /** Rythme au brassin : « à jour pour N brassins » quand il n'y a pas de date. */ brassins?: number | null; index: number; lectures: string | null }

export interface FilProps {
  fil: FilDuTemps;
  mode: 'tout' | 'work';
  /** Appareils ni à traiter ni montrés ailleurs : « N à jour » du filtre À traiter. */
  aJour: number;
  recent: Recent | null;
  selectedRef?: string | null;
  onOpen: (item: EquipmentItem) => void;
  onGeste: (row: StatusRow, geste: GesteKind) => void;
  onToutVoir: () => void;
}

const FilHaut: React.FC<FilProps> = ({ fil, mode, aJour, recent, selectedRef, onOpen, onGeste, onToutVoir }) => {
  const avenirRecent = recent ? fil.avenir.find(a => a.item.ref === recent.ref) : undefined;
  const lignes = mode === 'work' ? (avenirRecent ? [avenirRecent] : []) : fil.avenir;
  // Au filtre À traiter, une ligne au brassin (sans date) se pose juste sous « aujourd'hui » : sa vraie place est loin sous la coupure.
  const posY = (a: AvenirRow): number => mode === 'work' && a.sansDate ? 45 : a.yLigne;
  const dernier = lignes.length ? Math.max(...lignes.map(posY)) : 0;
  const carteY = mode === 'work' ? (avenirRecent ? posY(avenirRecent) + 59 : 14) : 0;
  const hauteurAv = mode === 'work' ? carteY + 64 : lignes.length ? dernier + 18 : 14;
  const coupure = mode === 'tout' ? fil.coupure : null;
  const premierEnPanne = fil.haut[0]?.status.kind === 'panne';
  // Le geste fait sur le dernier appareil du haut : sa note reste à l'ancienne place, après la dernière ligne.
  const noteEnFin = recent && recent.index >= fil.haut.length && !fil.haut.some(h => h.item.ref === recent.ref)
    ? <div key={`note-${recent.ref}`} className="mt-fantome" role="status"><Check size={14} aria-hidden="true" />{recent.nom} à jour{recent.jusquau ? <> jusqu'au <span className="mt-m">{dateCourte(recent.jusquau)}</span></> : recent.brassins ? <> pour <span className="mt-m">{recent.brassins}</span> brassins</> : null}</div> : null;
  return (
    <>
      <div className="mt-haut">
        {fil.haut.length > 0 && <div className={`mt-rail-du${premierEnPanne ? ' mt-rail-panne' : ''}`} />}
        {fil.haut.flatMap((r, i) => {
          const geste = gesteDe(r);
          const note = recent && recent.index === i && !fil.haut.some(h => h.item.ref === recent.ref)
            ? <div key={`note-${recent.ref}`} className="mt-fantome" role="status"><Check size={14} aria-hidden="true" />{recent.nom} à jour{recent.jusquau ? <> jusqu'au <span className="mt-m">{dateCourte(recent.jusquau)}</span></> : recent.brassins ? <> pour <span className="mt-m">{recent.brassins}</span> brassins</> : null}</div> : null;
          const ligne = (
            <div key={r.item.ref} className={`mt-r${selectedRef === r.item.ref ? ' mt-choisi' : ''}`}>
              <span className={`mt-noeud${r.status.kind === 'panne' ? ' mt-al' : r.status.kind === 'jamais' ? ' mt-tir' : ''}`}><EquipmentPicto name={r.item.name} /></span>
              <button type="button" className="mt-txt" aria-label={`Ouvrir ${r.item.name}`} onClick={() => onOpen(r.item)}>
                <span className="mt-nom">{nomInsecable(r.item.name)}</span>
                <SousLigne line={r.status.line} />
              </button>
              <button type="button" className="mt-fait" data-geste={geste} aria-label={`${LIBELLE[geste]} : ${r.item.name}`} onClick={() => onGeste(r, geste)}>
                {geste === 'repare' && <Wrench size={18} aria-hidden="true" />}{geste === 'fait' && <Check size={18} aria-hidden="true" />}{LIBELLE[geste]}
              </button>
            </div>
          );
          return recent && recent.index === i && note ? [note, ligne] : [ligne];
        }).concat(noteEnFin ? [noteEnFin] : [])}
      </div>
      <div className="mt-auj"><b>aujourd'hui</b><span className="mt-m">{dateCourte(fil.aujourdhui)}</span><i /></div>
      {(lignes.length > 0 || mode === 'work') && (
        <div className="mt-av" style={{ height: hauteurAv }}>
          {mode === 'tout' && lignes.length > 0 && <div className="mt-bande" style={{ height: fil.bande.y }}><span>30 j</span></div>}
          <div className="mt-av-rail" style={{ height: coupure ? coupure.fromY + 5 + 14 : dernier + 12 + 14, opacity: mode === 'work' ? .5 : 1 }} />
          {coupure && <><svg className="mt-coupe" style={{ top: coupure.fromY + 5 }} viewBox="0 0 24 20" aria-hidden="true"><path d="M3 9 21 3M3 17 21 11" /></svg>
            <div className="mt-av-rail" style={{ top: coupure.fromY + 25, height: dernier + 12 - (coupure.fromY + 25) }} /></>}
          {avenirRecent && <div className="mt-glisse" style={{ height: posY(avenirRecent) - 13 }} />}
          {fil.reperes.filter(rp => (mode === 'tout' || rp.y < carteY - 10) && rp.y <= hauteurAv - 14).map(rp => (
            <React.Fragment key={rp.date}>{rp.tick && <span className="mt-tick" style={{ top: rp.y }} />}<span className="mt-mo" style={{ top: rp.y }}>{moisCourt(rp.date)}</span></React.Fragment>
          ))}
          {lignes.map(a => {
            const flash = recent?.ref === a.item.ref;
            // Une ligne descendue pour ne pas toucher la précédente garde son nœud de rappel à sa vraie date.
            const decalage = posY(a) - a.y;
            return (
              <React.Fragment key={a.item.ref}>
              {decalage > 2 && <span className="mt-rappel" style={{ top: a.y, height: decalage }} aria-hidden="true" />}
              <button type="button" className={`mt-ar${flash ? ' mt-flash' : ''}${selectedRef === a.item.ref ? ' mt-choisi' : ''}`} style={{ top: posY(a) }} aria-label={`Ouvrir ${a.item.name}`} onClick={() => onOpen(a.item)}>
                <span className={`mt-pn${flash ? ' mt-okn' : ''}`}><EquipmentPicto name={a.item.name} /></span>
                <span className="mt-t"><b>{nomInsecable(a.item.name)}</b><span className={flash && recent?.lectures ? 'mt-m' : undefined}>{flash && recent?.lectures ? recent.lectures : a.sansDate ? a.status.line : a.status.verb}</span></span>
                <span className="mt-j">{a.status.dueDate ? dateCourte(a.status.dueDate) : ''}</span>
              </button>
              </React.Fragment>
            );
          })}
          {mode === 'work' && <button type="button" className="mt-autres" style={{ top: carteY }} onClick={onToutVoir}>{aJour} à jour<span className="mt-sp" /><b>Tout</b><ChevronRight size={16} aria-hidden="true" /></button>}
        </div>
      )}
    </>
  );
};

const FilSans: React.FC<{ rows: StatusRow[]; onOpen: (item: EquipmentItem) => void }> = ({ rows, onOpen }) => (
  rows.length === 0 ? null : (
    <div className="mt-sans">
      <div className="mt-sanst">sans échéance <span className="mt-m">{rows.length}</span></div>
      <div className="mt-grille">
        {rows.map(r => (
          <button key={r.item.ref} type="button" className="mt-c" aria-label={`Ouvrir ${r.item.name}`} onClick={() => onOpen(r.item)}>
            <EquipmentPicto name={r.item.name} />
            <span>{nomInsecable(r.item.name)}</span>
          </button>
        ))}
      </div>
    </div>
  )
);

/** Le total se lit « 1 739 CHF » : l'apostrophe (U+0027) ou le guillemet (U+2019) du séparateur suisse devient une espace insécable (U+00A0, dans le code). */
export const totalParc = (cents: number): string =>
  (cents / 100).toLocaleString('fr-CH', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).replace(/[  ’']/g, ' ');
const FilPied: React.FC<{ wide: boolean; parc: { totalCents: number; known: number }; onAddOwned: () => void; onProjects?: () => void }> = ({ wide, parc, onAddOwned, onProjects }) => (
  <div className="mt-pied">
    <button type="button" className="mt-tuile" onClick={onAddOwned}><Package size={18} aria-hidden="true" />{wide ? 'Matériel déjà possédé' : 'Déjà possédé'}</button>
    {onProjects && <button type="button" className="mt-tuile" onClick={onProjects}><Wrench size={18} aria-hidden="true" />{wide ? "Projets d'équipement" : 'Projets'}<ExternalLink size={14} aria-hidden="true" /></button>}
    {parc.known > 0 && <span className="mt-parc"><b>{totalParc(parc.totalCents)} CHF</b>{parc.known} prix connu{parc.known > 1 ? 's' : ''}</span>}
  </div>
);

/** Parc vide : le fil existe déjà, en pointillé, avec ses mois ; l'inconnu n'est pas un zéro. */
const FilVide: React.FC<{ today: string; onBuy: () => void; onAddOwned: () => void; onProjects?: () => void }> = ({ today, onBuy, onAddOwned, onProjects }) => {
  const mois = [1, 2, 3, 4].map(n => premierDuMois(addMonthsClamped(today, n)));
  return (
    <>
      <div className="mt-auj" style={{ marginTop: 6 }}><b>aujourd'hui</b><span className="mt-m">{dateCourte(today)}</span><i /></div>
      <div className="mt-av" style={{ height: 560 }}>
        <div className="mt-vrail" />
        {mois.map(m => { const y = 3.5 * daysBetween(today, m) - 14; return <React.Fragment key={m}><span className="mt-tick" style={{ top: y }} /><span className="mt-mo" style={{ top: y }}>{moisCourt(m)}</span></React.Fragment>; })}
        <span className="mt-fpn" style={{ top: 300 }} /><span className="mt-fpn" style={{ top: 400 }} />
        <div className="mt-vbloc">
          <h2>Aucun matériel</h2>
          <button type="button" className="mt-pri" onClick={onBuy}><ShoppingCart size={20} aria-hidden="true" />Enregistrer un achat</button>
          <button type="button" className="mt-sec" onClick={onAddOwned}><Package size={20} aria-hidden="true" />Matériel déjà possédé</button>
          {onProjects && <button type="button" className="mt-vlien" onClick={onProjects}><Wrench size={16} aria-hidden="true" />Projets d'équipement<ExternalLink size={16} aria-hidden="true" /></button>}
        </div>
      </div>
    </>
  );
};
