/**
 * Le champ unique du carnet (R24, R27, R37 ; gestes 1, 4, 5, 7) : il écrit ou colle, un geste envoie, l'IA range.
 * - En bas, au-dessus du clavier : `useKeyboardInset` (visualViewport) retranche le clavier (CARNET-CLAV).
 * - Sur la liste : « Une idée, un besoin… » et ↑ ; dans un carnet : « Ajouter à <titre>… » (G7) et « Ajouter »
 *   (§ Points ouverts 6). Pendant une modification : « Enregistrer ».
 * - 📷 (photo, § Points ouverts 8) et un petit 🎤 seulement si le navigateur sait dicter (CR-VOIX, R37).
 * - Puce « Coller : … » au-dessus quand le presse-papier tient un lien (R15).
 * - Bulle G8 au focus (R44) : calcul local, picto local, jamais le ✻ ; un toucher remplit « <critère> : ».
 * - Puces « Va dans » (R13) : correction seulement, préchoisies ; rangées derrière le champ.
 */
import React, { useId, useRef, useState } from 'react';
import { ArrowUp, Camera, Mic } from 'lucide-react';
import { useDictee } from '../atelier/dictee';
import { useKeyboardInset } from '../useViewport';
import { PictoLocal } from './EtatIA';

export interface SuggestionCritere { critere: string; a: string; b: string }
export interface VaDans { options: { id: string; libelle: string }[]; choisi: string; onChoisir: (id: string) => void }

export interface ChampCarnetProps {
  valeur: string;
  onChange: (texte: string) => void;
  onEnvoyer: () => void;
  /** Titre du carnet ouvert : le champ dit où ça va (G7). Absent : on est sur la liste. */
  titreCarnet?: string;
  /** « Enregistrer » pendant une modification de note (R20), « Renommer » ne passe pas ici (R21 a son cadre). */
  libelleEnvoi?: string;
  onPhoto?: (fichier: File) => void;
  /** Lien lu dans le presse-papier, proposé d'un toucher (R15). */
  coller?: string;
  onColler?: () => void;
  /** Le champ prend le focus : la vue lit alors le presse-papier (R15, G14). */
  onFocusChamp?: () => void;
  suggestion?: SuggestionCritere | null;
  vaDans?: VaDans | null;
  /** Grisé pendant la confirmation de suppression d'une idée (G34). */
  desactive?: boolean;
  inputRef?: React.Ref<HTMLTextAreaElement>;
}

/** « plaque-froid.ch/echan… » : le lien en clair, raccourci pour tenir sur la puce. */
export function lienCourt(url: string, max = 22): string {
  const sans = url.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
  return sans.length > max ? `${sans.slice(0, max)}…` : sans;
}

export function ChampCarnet(p: ChampCarnetProps) {
  const inset = useKeyboardInset();
  const [focus, setFocus] = useState(false);
  const fichier = useRef<HTMLInputElement>(null);
  const id = useId();
  const dictee = useDictee(t => p.onChange(p.valeur ? `${p.valeur} ${t}` : t));
  const dansCarnet = !!p.titreCarnet;
  const placeholder = dansCarnet ? `Ajouter à ${p.titreCarnet}…` : 'Une idée, un besoin…';
  const envoi = p.libelleEnvoi ?? (dansCarnet ? 'Ajouter' : null);
  const plein = p.valeur.trim().length > 0;
  const montrerBulle = !!p.suggestion && focus && !plein;

  return (
    <div className="cn-champ-zone" style={{ bottom: inset, marginBottom: inset }} aria-disabled={p.desactive || undefined} data-clavier={inset || undefined}>
      {montrerBulle && p.suggestion && (
        <button
          type="button"
          className="cn-bulle"
          onMouseDown={e => e.preventDefault()}
          onClick={() => p.onChange(`${p.suggestion!.critere} : `)}
        >
          <PictoLocal />
          <span>Le critère « {p.suggestion.critere} » peut trancher entre {p.suggestion.a} et {p.suggestion.b}</span>
        </button>
      )}
      {p.coller && !plein && (
        <button type="button" className="cn-puce cn-coller" onMouseDown={e => e.preventDefault()} onClick={p.onColler}>
          Coller : <span className="cn-mono">{lienCourt(p.coller)}</span>
        </button>
      )}
      {p.vaDans && plein && (
        <div className="cn-vadans" role="group" aria-label="Va dans">
          <span className="cn-mut">Va dans</span>
          {p.vaDans.options.map(o => (
            <button key={o.id} type="button" className="cn-puce" aria-pressed={o.id === p.vaDans!.choisi} onClick={() => p.vaDans!.onChoisir(o.id)}>
              {o.libelle}
            </button>
          ))}
        </div>
      )}
      <form
        className={`cn-champ${focus ? ' cn-champ-focus' : ''}${plein ? ' cn-champ-plein' : ''}`}
        onSubmit={e => { e.preventDefault(); if (plein && !p.desactive) p.onEnvoyer(); }}
      >
        <label htmlFor={id} className="cn-cache">{placeholder}</label>
        <textarea
          id={id}
          ref={p.inputRef}
          rows={1}
          value={p.valeur}
          placeholder={placeholder}
          disabled={p.desactive}
          onFocus={() => { setFocus(true); p.onFocusChamp?.(); }}
          onBlur={() => setFocus(false)}
          onChange={e => p.onChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              if (plein && !p.desactive) p.onEnvoyer();
            }
          }}
          enterKeyHint="send"
          autoCapitalize="sentences"
        />
        {p.onPhoto && !plein && (
          <>
            <button type="button" className="cn-ico" aria-label="Photo" disabled={p.desactive} onClick={() => fichier.current?.click()}>
              <Camera size={20} aria-hidden />
            </button>
            <input
              ref={fichier}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={e => { const f = e.target.files?.[0]; if (f) p.onPhoto!(f); e.target.value = ''; }}
            />
          </>
        )}
        {dictee.disponible && !plein && (
          <button type="button" className="cn-ico" aria-label={dictee.ecoute ? 'Arrêter la dictée' : 'Dicter'} aria-pressed={dictee.ecoute} disabled={p.desactive} onClick={dictee.basculer}>
            <Mic size={20} aria-hidden />
          </button>
        )}
        {plein && (envoi
          ? <button type="submit" className="cn-envoi-mot" disabled={p.desactive}>{envoi}</button>
          : <button type="submit" className="cn-envoi" aria-label="Envoyer" disabled={p.desactive}><ArrowUp size={22} aria-hidden /></button>)}
      </form>
    </div>
  );
}
