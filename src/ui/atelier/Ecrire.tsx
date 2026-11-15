import React, { useEffect, useRef, useState } from 'react';
import { Check, Mic, Sparkle, X } from 'lucide-react';
import { LIBELLE_GENRE, STYLES, ranger, styleDe, type Genre, type LigneRangee } from './atelierModel';
import { Tiroir } from './NoteCarte';
import { PastilleStyle, aplatDuStyle } from './PastilleStyle';
import { useDictee } from './dictee';

const ORDRE: Genre[] = ['biere', 'tarif', 'contact', 'faire'];
const BOUTON_PRIM = 'relative inline-flex min-h-9 items-center justify-center rounded-control bg-ebc-straw px-[18px] text-sm font-semibold text-cave-950 disabled:opacity-50 after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[\'\']';
const BOUTON_SEC = 'relative inline-flex min-h-9 items-center justify-center rounded-control border border-cave-700 bg-cave-850 px-4 text-sm font-semibold text-cave-50 after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-[\'\']';

/**
 * « Noter en vrac » (e9na) : on écrit comme ça vient, le rangement se propose, on valide.
 * Le rangement est une lecture locale (aucune tâche IA « ranger » côté serveur) : l'écran le dit, ligne par ligne corrigeable.
 */
export const Ecrire: React.FC<{
  primaire: boolean; amorce?: { texte: string; at: number } | null; onReflechir: () => void;
  onRanger: (lignes: LigneRangee[]) => void;
}> = ({ primaire, amorce, onReflechir, onRanger }) => {
  const [texte, setTexte] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [lignes, setLignes] = useState<LigneRangee[]>([]);
  const [corriger, setCorriger] = useState(false);
  const champ = useRef<HTMLTextAreaElement>(null);
  const dictee = useDictee(t => setTexte(v => (v ? `${v} ${t}` : t)));

  useEffect(() => { if (amorce) { setTexte(amorce.texte); champ.current?.focus(); } }, [amorce?.at]);

  const noter = () => {
    const t = texte.trim();
    if (!t) { champ.current?.focus(); return; }
    setNote(t); setLignes(ranger(t)); setCorriger(false); setTexte('');
  };
  const fermer = () => { setNote(null); setLignes([]); setCorriger(false); };
  const valider = () => { if (lignes.length) onRanger(lignes); fermer(); };
  const retirer = (i: number) => { const l = lignes.filter((_, k) => k !== i); setLignes(l); if (!l.length) fermer(); };
  const modifier = (i: number, p: Partial<LigneRangee>) => setLignes(l => l.map((x, k) => (k === i ? { ...x, ...p } : x)));
  const suivant = (g: Genre) => ORDRE[(ORDRE.indexOf(g) + 1) % ORDRE.length];
  /** Le style d'une ligne de bière : celui qu'on a corrigé, sinon celui que le texte dit. */
  const styleLigne = (l: LigneRangee) => (l.style !== undefined ? l.style || undefined : styleDe({ title: l.titre, description: l.description }));
  /** Toucher fait défiler les styles, puis « aucun » (chaîne vide), puis revient au premier. */
  const styleSuivant = (s?: string) => {
    if (!s) return STYLES[0] as string;
    const k = STYLES.findIndex(x => x === s);
    return k < 0 || k === STYLES.length - 1 ? '' : STYLES[k + 1];
  };

  return (
    <>
      <section className="flex flex-col gap-2 rounded-2xl border border-cave-800 bg-cave-900 px-3 pb-3 pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-cave-50">Noter en vrac</h2>
          <button type="button" onClick={onReflechir} className="relative inline-flex min-h-8 items-center gap-1 text-sm font-semibold text-cave-50 after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']">
            <Sparkle className="h-4 w-4" aria-hidden="true" />Réfléchir
          </button>
        </div>
        <label className="flex items-end gap-2 rounded-control border border-cave-700 bg-cave-950 py-2 pl-3 pr-2">
          <textarea ref={champ} aria-label="Ta note" rows={2} value={texte} onChange={e => setTexte(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); noter(); } }}
            autoComplete="off" autoCorrect="off" spellCheck={false} data-lpignore="true" data-1p-ignore="true"
            className="min-h-[52px] flex-1 resize-none border-0 bg-transparent p-0 text-base leading-snug text-cave-50 outline-none" />
          {dictee.disponible && (
            <button type="button" aria-label={dictee.ecoute ? 'Arrêter la dictée' : 'Dicter'} aria-pressed={dictee.ecoute} onClick={dictee.basculer}
              className={`relative flex h-8 w-8 items-center justify-center rounded-full after:absolute after:left-1/2 after:top-1/2 after:h-11 after:w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-[''] ${dictee.ecoute ? 'bg-alert/20 text-alert' : 'text-cave-200'}`}>
              <Mic className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </label>
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-sm text-cave-400"><Sparkle className="h-3.5 w-3.5 text-ebc-gold" aria-hidden="true" />Le rangement se propose, tu valides</span>
          <button type="button" onClick={noter} className={primaire ? BOUTON_PRIM : BOUTON_SEC}>Noter</button>
        </div>
      </section>

      {note != null && (
        <section aria-label="Note à ranger" className="rounded-2xl border-2 border-ebc-gold bg-cave-950 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-ebc-gold"><Sparkle className="h-3.5 w-3.5" aria-hidden="true" />
            Rangement proposé : ta note en {lignes.length === 1 ? 'une ligne' : `${lignes.length} lignes`}</p>
          <p className="my-1.5 text-[15px] leading-snug text-cave-200">« {note} »</p>
          <div className="flex flex-col gap-1.5">
            {lignes.map((l, i) => (
              <div key={i} className="flex items-center gap-2 rounded-control bg-cave-900 py-1.5 pl-2.5 pr-1">
                {corriger
                  ? <button type="button" onClick={() => modifier(i, { genre: suivant(l.genre) })} aria-label={`Tiroir : ${LIBELLE_GENRE[l.genre]}, toucher pour changer`}>
                      <Tiroir genre={l.genre}>{LIBELLE_GENRE[l.genre]} ↻</Tiroir></button>
                  : <Tiroir genre={l.genre}>{l.genre === 'faire' && <Check className="h-3.5 w-3.5" aria-hidden="true" />}{LIBELLE_GENRE[l.genre]}</Tiroir>}
                {corriger
                  ? <input aria-label="Texte de la ligne" value={l.titre} onChange={e => modifier(i, { titre: e.target.value })} className="min-h-8 min-w-0 flex-1 rounded border border-cave-700 bg-cave-950 px-2 text-[15px] text-cave-50" />
                  : <span className={`min-w-0 text-[15px] text-cave-50 ${l.genre === 'biere' ? '' : 'flex-1'}`}>{l.titre}{l.contactName ? ` · ${l.contactName}` : ''}</span>}
                {l.genre === 'biere' && (() => {
                  const s = styleLigne(l);
                  if (corriger) return (
                    <button type="button" aria-label={`Style : ${s ?? 'aucun'}, toucher pour changer`} onClick={() => modifier(i, { style: styleSuivant(s) })}
                      className={`relative inline-flex min-h-6 shrink-0 items-center rounded-full border border-dashed border-cave-600 ${s ? aplatDuStyle(s) : 'bg-cave-850'} px-2.5 text-sm font-semibold text-cave-50 after:absolute after:inset-x-0 after:top-1/2 after:h-11 after:-translate-y-1/2 after:content-['']`}>
                      {s ?? 'style ?'} ↻</button>);
                  return s ? <PastilleStyle style={s} /> : null;
                })()}
                <button type="button" aria-label="Retirer" onClick={() => retirer(i)}
                  className="relative ml-auto flex h-8 w-8 items-center justify-center text-cave-400 after:absolute after:left-1/2 after:top-1/2 after:h-11 after:w-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
          <div className="mt-2.5 flex gap-2">
            <button type="button" onClick={() => setCorriger(c => !c)} aria-pressed={corriger} className={`${BOUTON_SEC} flex-1`}>{corriger ? 'Corrigé' : 'Corriger'}</button>
            <button type="button" onClick={valider} className={`${BOUTON_PRIM} flex-1`}>Ranger ainsi</button>
          </div>
        </section>
      )}
    </>
  );
};
