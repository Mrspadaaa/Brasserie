import React, { useRef, useState } from 'react';
import { Input } from '../Input';
import { fr, lireSaisie, pasClavier } from './regles';

/**
 * Un nombre qui se tape sur place (r4-a : « pouvoir modifier aussi les chiffres directement »).
 *
 * Jamais `type="number"` (saisie-mobile) : un champ texte avec `inputmode`, rendu par le composant protégé `Input`
 * (un `input` à la souris ; au toucher, un `textarea` d'une ligne, car Chrome Android ignore autocomplete="off" sur un
 * `input`). `Input` plutôt que `NumberInput` : celui-ci garde son propre brouillon et reformate à la sortie, alors que
 * ce champ tient déjà son texte, ses bornes, Entrée, Échap et ↑ ↓. Au clavier : ↑ ↓ ajoutent un pas, Entrée
 * valide, Échap rend la valeur d'avant. Une valeur tapée hors de la règle est acceptée (la règle s'étend) ; seuls `min`
 * et le garde-fou `max` la refusent. Le nombre suit la frappe ; à la sortie, le texte est ramené à la valeur retenue.
 */
export interface ChampNombreProps {
  /** NaN = effacé : le champ est vide, jamais 0. */
  valeur: number;
  onValeur: (v: number) => void;
  pas: number;
  min: number;
  /** Garde-fou de saisie, pas la fin de la règle. */
  max: number;
  /** Ramène la valeur à un multiple (5′ pour l'ébullition). */
  arrondi?: number;
  decimal?: boolean;
  /** Vider le champ est un état (volume « à renseigner »). Faux pour une capacité de fermenteur. */
  permettreVide?: boolean;
  libelle: string;
  id?: string;
  className?: string;
  invalide?: boolean;
  decrit?: string;
  required?: boolean;
  /** Largeur au contenu (la grande lecture) ou fixe. */
  auContenu?: boolean;
  'data-role'?: string;
  'data-element'?: string;
}

const afficher = (v: number) => (Number.isFinite(v) ? fr(v) : '');

export const ChampNombre: React.FC<ChampNombreProps> = ({
  valeur, onValeur, pas, min, max, arrondi, decimal = true, permettreVide = true, libelle, id, className = '',
  invalide, decrit, required, auContenu, ...marques
}) => {
  const [edition, setEdition] = useState(false);
  const [texte, setTexte] = useState('');
  const avant = useRef(valeur);
  const annule = useRef(false);
  const premier = useRef(false);
  const bornes = { min, max, arrondi };

  const montre = edition ? texte : afficher(valeur);
  const largeur = auContenu ? { width: `${Math.max(1, montre.length) + 0.4}ch` } : undefined;

  const fin = () => {
    if (annule.current) { annule.current = false; setEdition(false); return; }
    const s = lireSaisie(texte, bornes);
    if (s.genre === 'valeur') { if (!Object.is(s.valeur, valeur)) onValeur(s.valeur); }
    else if (s.genre === 'vide' && permettreVide) { if (!Number.isNaN(valeur)) onValeur(Number.NaN); }
    else if (!Object.is(avant.current, valeur)) onValeur(avant.current);
    setEdition(false);
  };

  return (
    <Input
      {...marques}
      id={id}
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      enterKeyHint="done"
      aria-label={libelle}
      aria-invalid={invalide || undefined}
      aria-describedby={decrit}
      required={required}
      placeholder="—"
      className={`idn-champ ${className}`}
      style={largeur}
      value={montre}
      onFocus={(e) => {
        avant.current = valeur;
        annule.current = false;
        premier.current = true;
        setTexte(afficher(valeur));
        setEdition(true);
        e.currentTarget.select();
      }}
      // Le premier appui de souris ne doit pas défaire la sélection qu'on vient de poser.
      onMouseUp={(e) => { if (premier.current) { e.preventDefault(); premier.current = false; } }}
      onChange={(e) => {
        const t = e.target.value;
        setTexte(t);
        const s = lireSaisie(t, bornes);
        if (s.genre === 'valeur') onValeur(s.valeur);
        else if (s.genre === 'vide' && permettreVide) onValeur(Number.NaN);
      }}
      onKeyDown={(e) => {
        // Entrée valide ici même (le formulaire ne passe pas au champ suivant) ; Échap rend la valeur d'avant.
        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); e.currentTarget.blur(); }
        else if (e.key === 'Escape') {
          e.preventDefault();
          e.stopPropagation();
          annule.current = true;
          if (!Object.is(avant.current, valeur)) onValeur(avant.current);
          setTexte(afficher(avant.current));
          e.currentTarget.blur();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const v = pasClavier(valeur, pas, e.key === 'ArrowUp' ? 1 : -1, { min, max });
          setTexte(afficher(v));
          setEdition(true);
          onValeur(v);
        }
      }}
      onBlur={fin}
    />
  );
};
