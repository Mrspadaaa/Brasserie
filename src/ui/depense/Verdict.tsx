// Les mots du statut de la lecture et les chips numérotées des points qui pèsent. Le bandeau, la preuve et les comptes vivent dans `Recap.tsx` (p3c-3).
// Les classes de couleur sont celles de l'app : le thème suit.
import React from 'react';
import type { StatutLecture } from '../../domain/finance/invoicePoints';
import type { Chip } from './etat';

export const TITRES: Record<StatutLecture, { title: string; detail: string }> = {
  checked: { title: 'Lecture vérifiée', detail: 'Les lectures du justificatif concordent. Relis les champs avant d’enregistrer.' },
  corrected: { title: 'Corrections proposées', detail: 'Une relecture du document a corrigé des écarts. Confirme ces propositions sur l’original.' },
  disputed: { title: 'Lecture à confirmer', detail: 'Certains points restent à confirmer. Vérifie les points signalés sur l’original.' },
  unavailable: { title: 'Vérification incomplète', detail: 'La lecture reste une proposition. Vérifie les montants et les articles sur l’original.' },
};

/** Les points qui pèsent, numérotés par risque ; un point réglé est barré (jamais par défaut ni par le temps). `numeros` : le rang de chaque chip dans la liste complète. */
/** `enTuiles` : les chips se posent dans la rangée des tuiles (z2 : « ① Total » est une tuile de cette rangée, même pointillé ambre, pas un chip isolé au-dessus). */
export function ChipsBar({ chips, reglees, onAller, tout, cacher, enTuiles }: { chips: readonly Chip[]; reglees: ReadonlySet<string>; onAller: (chip: Chip) => void; tout: boolean; cacher?: (chip: Chip) => boolean; enTuiles?: boolean }) {
  if (!chips.length) return null;
  return <div data-dp="chips" aria-label="Points à régler" className={enTuiles ? 'contents' : 'flex flex-wrap gap-1.5'}>
    {chips.map((chip, i) => { const fait = reglees.has(chip.id); if (cacher?.(chip)) return null;
      return <button key={chip.id} type="button" data-dp-chip={chip.id} aria-label={`${i + 1} ${chip.nom}${fait ? ' réglé' : ''}`} onClick={() => onAller(chip)}
        className={`inline-flex items-center gap-1 px-2 text-sm border ${enTuiles ? 'min-h-[42px] shrink-0 rounded-panel' : 'min-h-7 rounded-control'} ${fait ? 'border-cave-700 text-cave-400 line-through' : 'border-dashed border-attention bg-attention/5 text-cave-50'}`}>
        <span className={`inline-flex size-[18px] items-center justify-center rounded-full font-mono text-xs ${fait ? 'bg-hop text-cave-950' : 'border border-dashed border-attention text-attention'}`}>{i + 1}</span>{chip.nom}</button>; })}
    {tout ? <span className="min-h-7 inline-flex items-center rounded-control border border-hop px-2 text-sm text-hop">✓ points revus</span> : null}
  </div>;
}
