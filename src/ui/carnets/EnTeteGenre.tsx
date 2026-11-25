/**
 * D451 (maquettes2/v01, greffe 1 « en-tête du genre seulement ») : l'en-tête d'un carnet selon son genre.
 * - La pastille de catégorie de la barre de titre : « Vapeur », « Écoulement » (le dernier niveau du chemin posé), sinon le domaine ; un toucher ouvre
 *   les cinq domaines (D437 : son choix passe avant celui de l'IA).
 * - La puce du genre sous la barre : « mémo · fait le 21 déc. 2025 », « récolte », « idée · vers S10 ». Un problème n'a pas de puce : sa barre d'état la remplace.
 * Rien n'est inventé : « fait le » seulement si le carnet est résolu, « vers S10 » seulement si une date est posée.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Leaf, Lightbulb, NotebookPen } from 'lucide-react';
import type { CarnetDoc, GenreCarnet } from '../../domain/carnets/modele';
import { DOMAINES, DOMAINE_LIBELLE, domaineDe, type DomaineCarnet } from '../../domain/carnets/domaines';
import { categorieDe, genreDe, jourLocal, suiviDe } from '../../domain/carnets/suivi';
import { domaineParMots } from './domaineMots';
import { PictoDomaine } from './Domaines';
import { libelleJour } from './filRegles';

/** Le numéro de semaine ISO (S10) d'un jour AAAA-MM-JJ ; jour illisible : `null`. */
export function semaineIso(jour: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(jour);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  const jourSemaine = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - jourSemaine);
  const debut = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - debut) / 86400000 + 1) / 7);
}

const MOIS_LONGS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** « vers S10 » (une semaine), « vers mars » (un mois) ; sans date posée : `null`. */
export function versQuand(date?: string, precision?: 'semaine' | 'mois'): string | null {
  if (!date) return null;
  if (precision === 'mois') { const m = Number(date.slice(5, 7)); return MOIS_LONGS[m - 1] ? `vers ${MOIS_LONGS[m - 1]}` : null; }
  const s = semaineIso(date);
  return s ? `vers S${s}` : null;
}

/** Le texte de la puce du genre ; `null` pour un problème (sa barre d'état) et pour un achat (son en-tête reste celui du carnet). */
export function texteGenre(c: CarnetDoc, annee?: number): string | null {
  const g = genreDe(c);
  if (g === 'memo') {
    const r = suiviDe(c).resolu;
    return r ? `mémo · fait le ${libelleJour(jourLocal(r.le), annee)}` : 'mémo';
  }
  if (g === 'recolte') return 'récolte';
  if (g === 'idee') { const v = versQuand(c.date, c.precision); return v ? `idée · ${v}` : 'idée'; }
  return null;
}

const PICTO: Partial<Record<GenreCarnet, React.ReactNode>> = {
  memo: <NotebookPen size={16} aria-hidden />, recolte: <Leaf size={16} aria-hidden />, idee: <Lightbulb size={16} aria-hidden />
};

export function ChipGenre({ c, annee }: { c: CarnetDoc; annee?: number }) {
  const t = texteGenre(c, annee);
  if (!t) return null;
  return <div className="cnp-genre" data-genre={genreDe(c)}><span className="cnp-genre-chip">{PICTO[genreDe(c)]}<span>{t}</span></span></div>;
}

/** Le libellé court de la pastille : le dernier niveau du chemin posé, sinon le domaine, sinon « À ranger ». */
export function libelleCategorie(c: CarnetDoc): string {
  const chemin = categorieDe(c)?.chemin ?? [];
  if (chemin.length) return chemin[chemin.length - 1];
  const d = domaineDe(c, domaineParMots);
  return d ? DOMAINE_LIBELLE[d] : 'À ranger';
}

/**
 * `sousDomaines` (C67-12, D451) : les sous-domaines déjà employés, sous chacun son domaine ; un toucher sur l'un pose le domaine ET la catégorie (`onRanger`).
 * Sans `onRanger`, seul le domaine se pose (`onDomaine`), comme avant.
 */
export function PastilleCategorie({ c, onDomaine, onRanger, sousDomaines }: { c: CarnetDoc; onDomaine?: (d: DomaineCarnet) => void; onRanger?: (d: DomaineCarnet, chemin?: string[]) => void; sousDomaines?: Partial<Record<DomaineCarnet, string[]>> }) {
  const poser = onRanger ?? (onDomaine ? (d: DomaineCarnet) => onDomaine(d) : undefined);
  const sd = categorieDe(c)?.chemin[0];
  const [ouvert, setOuvert] = useState(false);
  const boite = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!ouvert) return;
    const hors = (e: PointerEvent) => { if (!boite.current?.contains(e.target as Node)) setOuvert(false); };
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape') setOuvert(false); };
    document.addEventListener('pointerdown', hors); document.addEventListener('keydown', echap);
    return () => { document.removeEventListener('pointerdown', hors); document.removeEventListener('keydown', echap); };
  }, [ouvert]);
  const d = domaineDe(c, domaineParMots);
  if (!d && !poser) return null;
  return (
    <span className="cnd-pastille-boite" ref={boite}>
      <button type="button" className="cnd-pastille" data-domaine-carnet={d ?? ''} aria-haspopup="menu" aria-expanded={ouvert} disabled={!poser}
        aria-label={`Catégorie : ${libelleCategorie(c)}${d ? `, domaine ${DOMAINE_LIBELLE[d]}` : ''}, changer le domaine`} onClick={() => setOuvert(v => !v)}>
        {d && <PictoDomaine d={d} />}<span>{libelleCategorie(c)}</span>{poser && <span className="cnd-fleche" aria-hidden>▾</span>}
      </button>
      {ouvert && poser && (
        <span className="cnd-menu" role="menu" aria-label="Domaine du carnet">
          {DOMAINES.map(x => {
            /* les sous-domaines employés sous ce domaine ; celui du carnet y est toujours, même si lui seul le dit */
            const sous = [...new Set([...(sousDomaines?.[x] ?? []), ...(x === d && sd ? [sd] : [])])];
            return (
              <React.Fragment key={x}>
                <button type="button" role="menuitemradio" aria-checked={x === d && !sd} className="cnd-menu-item" onClick={() => { setOuvert(false); if (x !== d) poser(x); }}>
                  <PictoDomaine d={x} taille={20} /><span className="cn-sp">{DOMAINE_LIBELLE[x]}</span>
                </button>
                {onRanger && sous.map(s => (
                  <button key={s} type="button" role="menuitemradio" aria-checked={x === d && s === sd} className="cnd-menu-item cnd-menu-sous" onClick={() => { setOuvert(false); if (!(x === d && s === sd)) onRanger(x, [s]); }}>
                    <span aria-hidden className="cnd-sous-fleche">›</span><span className="cn-sp">{s}</span>
                  </button>
                ))}
              </React.Fragment>
            );
          })}
        </span>
      )}
    </span>
  );
}
