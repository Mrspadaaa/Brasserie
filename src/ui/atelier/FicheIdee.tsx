import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { CreativeItem } from '../../types';
import { ConfirmSheet, Sheet } from '../Sheet';
import { PastilleStyle } from './PastilleStyle';
import { chf, dateEcheance, formatVendu, genreDe, instantNote, jourMois, lireIdee, marge, notesQuiCitent, styleDe } from './atelierModel';
import { MARGE_GENRE } from './NoteCarte';

const ETAPES: Record<CreativeItem['status'], { label: string; classe: string }> = {
  idea: { label: 'Idée', classe: 'border-cave-700 bg-cave-850 text-cave-200' },
  research: { label: 'En recherche', classe: 'border-water/50 bg-water/15 text-water' },
  quote: { label: 'Devis', classe: 'border-attention/50 bg-attention/15 text-attention' },
  validated: { label: 'Validée', classe: 'border-hop/50 bg-hop/15 text-hop' },
  todo: { label: 'À faire', classe: 'border-cave-700 bg-cave-850 text-cave-200' },
  done: { label: 'Faite', classe: 'border-hop/50 bg-hop/15 text-hop' }
};
export const BTN = 'relative inline-flex min-h-9 items-center justify-center gap-1 rounded-control px-3 text-sm font-semibold after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[\'\']';

const normaliser = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const NON_SAISI = <span className="text-cave-400">non saisi</span>;

/**
 * La fiche d'une idée de bière (e9na, état idée) : style, étape, puis degré, arômes, événement, tarif et recette, et les notes du carnet qui en parlent.
 * Chaque rangée se lit dans les mots de l'idée ou dans le carnet ; ce qui manque se dit « non saisi ».
 */
export const FicheIdee: React.FC<{
  item: CreativeItem | null; tva: number;
  /** Tout le carnet : les notes qui citent l'idée en sortent. */
  carnet?: CreativeItem[];
  /** Les noms des recettes écrites : « Recette » dit si celle de l'idée existe. */
  recettes?: string[];
  onClose: () => void;
  onEtape: (i: CreativeItem) => void; onModifier: (i: CreativeItem) => void; onEnRecette: (i: CreativeItem) => void; onSupprimer: (i: CreativeItem) => void;
}> = ({ item, tva, carnet = [], recettes = [], onClose, onEtape, onModifier, onEnRecette, onSupprimer }) => {
  const [confirmer, setConfirmer] = useState(false);
  if (!item) return null;
  const instant = instantNote(item);
  const m = marge(item.targetPrice, item.estimatedCost, tva);
  const etape = ETAPES[item.status];
  const style = styleDe(item);
  const lecture = lireIdee(item);
  const titre = normaliser(item.title);
  const recette = recettes.find(r => { const n = normaliser(r); return n.length > 0 && titre.length > 0 && (n === titre || n.includes(titre) || titre.includes(n)); });
  const notes = notesQuiCitent(item, carnet);
  // Le format du prix : celui que l'idée cite, sinon celui d'une note de tarif au même prix.
  const format = lecture.format ?? notes.filter(n => genreDe(n) === 'tarif' && n.targetPrice === item.targetPrice).map(n => formatVendu(`${n.title} ${n.description ?? ''}`)).find(Boolean);
  const notesLibres = item.notes?.replace(/^\s*Style\s*:[^\n]*\n?/im, '').trim();

  const faits: Array<[string, React.ReactNode]> = [
    ['Degré visé', lecture.degre ? <span className="font-mono font-semibold tabular-nums">{lecture.degre}</span> : NON_SAISI],
    ['Arômes', lecture.aromes ?? NON_SAISI],
    ['Pour', lecture.pour ? `${lecture.pour}${item.date ? ` · ${dateEcheance(item.date)}` : ''}` : NON_SAISI],
    ['Tarif', item.targetPrice != null
      ? <span><span className="font-mono font-semibold tabular-nums">{chf(item.targetPrice)}</span> {format ?? 'CHF, format non noté'}{m != null ? ` · marge ${chf(m)}` : ''}</span>
      : NON_SAISI],
    ...(item.estimatedCost != null && m == null ? [['Coût estimé', <span key="c"><span className="font-mono font-semibold tabular-nums">{chf(item.estimatedCost)}</span> CHF</span>] as [string, React.ReactNode]] : []),
    ['Recette', recette ? `écrite : ${recette}` : 'pas encore écrite']
  ];

  return (
    <>
      <Sheet open onClose={onClose} title={item.title} subtitle={`Idée de bière${instant != null ? ` · notée le ${jourMois(instant)}` : ''}`}
        footer={
          <div className="flex gap-2">
            <button type="button" aria-label="Supprimer l’idée" onClick={() => setConfirmer(true)} className={`${BTN} border border-alert/50 text-alert`}><Trash2 className="h-4 w-4" aria-hidden="true" /></button>
            <button type="button" onClick={() => onModifier(item)} className={`${BTN} border border-cave-700 bg-cave-850 text-cave-50`}><Pencil className="h-4 w-4" aria-hidden="true" />Modifier</button>
            <button type="button" onClick={() => onEnRecette(item)} className={`${BTN} flex-1 bg-ebc-straw text-cave-950`}>Passer dans mes recettes</button>
          </div>
        }>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {style && <PastilleStyle style={style} className="min-h-7 px-3" />}
            <span className={`inline-flex min-h-6 items-center rounded-full border px-2 text-xs ${etape.classe}`}>{etape.label}</span>
            {item.status !== 'done' && item.status !== 'todo' && (
              <button type="button" onClick={() => onEtape(item)} className="relative min-h-8 text-sm font-semibold text-cave-50 after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']">Changer l’étape</button>
            )}
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-xl bg-cave-850 px-3 py-3 text-base">
            {faits.map(([t, v]) => <React.Fragment key={t}><dt className="text-cave-400">{t}</dt><dd className="text-cave-50">{v}</dd></React.Fragment>)}
          </dl>
          {notes.length > 0 && (
            <section aria-label="Notes du carnet qui en parlent" className="flex flex-col gap-2">
              <p className="mx-0.5 text-sm text-cave-400">{notes.length === 1 ? '1 note du carnet en parle' : `${notes.length} notes du carnet en parlent`}</p>
              {notes.map(n => {
                const g = genreDe(n)!;
                const t = instantNote(n);
                const texte = g === 'biere' ? n.description?.trim() || n.title : n.title;
                return (
                  <article key={n.id} data-genre={g} className="relative flex items-start gap-3 overflow-hidden rounded-2xl border border-cave-800 bg-cave-900 py-2.5 pl-[18px] pr-3 text-base leading-snug text-cave-50">
                    <span className={`absolute inset-y-0 left-0 w-[5px] ${MARGE_GENRE[g]}`} aria-hidden="true" />
                    <span className="min-w-0 flex-1">{texte}</span>
                    {t != null && <span className="shrink-0 pt-0.5 font-mono text-xs text-cave-400">{jourMois(t)}</span>}
                  </article>
                );
              })}
            </section>
          )}
          {notesLibres && <p className="mx-0.5 text-sm text-cave-200">{notesLibres}</p>}
        </div>
      </Sheet>
      <ConfirmSheet open={confirmer} onClose={() => setConfirmer(false)} title="Supprimer cette idée ?" what={item.title}
        consequence="Elle disparaît de l’Atelier. La suppression est journalisée." confirmLabel="Supprimer"
        onConfirm={() => { setConfirmer(false); onSupprimer(item); }} />
    </>
  );
};
