import React, { useRef, useState } from 'react';
import { Input } from '../Input';
import { lit } from './modele';

/**
 * Un nombre qui se tape sur sa ligne (masse, jour d'ajout, masse du plateau) : au repos le nombre, au toucher le curseur y entre et la
 * valeur d'avant reste lisible en gris (placeholder) ; la frappe la remplace et la recette suit à chaque lettre ; Échap, un champ vidé ou
 * un texte illisible rendent la valeur d'avant. ↑ ↓ ajoutent un cran, Entrée valide.
 *
 * Jamais `type="number"` (saisie-mobile) : le composant protégé `Input` (un `input` à la souris, un `textarea` d'une ligne au toucher).
 */
export interface ChampLigneProps {
  /** La valeur de la recette. 0 ou `null` : le champ est vide au repos (le zéro est dit par le repère, jamais écrit comme un résultat). */
  valeur: number | null;
  onValeur: (v: number) => void;
  format: (v: number) => string;
  arrondi: (v: number) => number;
  /** Le cran de ↑ ↓. */
  cran: (v: number, dir: 1 | -1) => number;
  libelle: string;
  id?: string;
  className?: string;
  invalide?: boolean;
  decrit?: string;
  /** 0 est une valeur (le jour J+0) et non un champ vide. */
  zeroValide?: boolean;
  /** Un champ vidé (effacé à la frappe) puis quitté vaut 0 : la masse devient « à compléter », rien n'est masqué (D228). */
  videVaut0?: boolean;
  /** 0 s'écrit « 0 » en teinte d'attention (la masse d'une ligne à poser). */
  zeroAttention?: boolean;
  /** Texte du repère quand la valeur est vide au repos. */
  repos?: string;
  entier?: boolean;
  /** Entrée : retourne vrai si le parent a pris le focus ailleurs (sinon le champ se ferme). */
  onEntree?: () => boolean;
  /** Tab : retourne vrai si le parent a déplacé le focus. */
  onTab?: (decalage: 1 | -1) => boolean;
  /** Les marques de la maquette (`data-role`, `data-kl`…). */
  marques?: Record<string, string | number | undefined>;
  /** Le champ prend sa largeur au contenu (la masse de la ligne). */
  auContenu?: boolean;
}

export const ChampLigne: React.FC<ChampLigneProps> = ({
  valeur, onValeur, format, arrondi, cran, libelle, id, className = '', invalide, decrit, repos = '0', zeroValide: zeroValideProp, videVaut0, zeroAttention, entier, onEntree, onTab, marques = {}, auContenu,
}) => {
  const [texte, setTexte] = useState<string | null>(null);
  const avant = useRef<number | null>(null);
  const echap = useRef(false);
  const touche = useRef(false);
  // « frais » : la valeur d'avant, lisible en gris et sélectionnée (invisiblement) : la frappe la remplace, un champ vidé puis quitté vaut 0 (D228).
  const [frais, setFrais] = useState(false);
  const [negatif, setNegatif] = useState(false);
  const zeroValide = zeroValideProp || zeroAttention;
  const connu = valeur !== null && (zeroValide || valeur !== 0);
  const vide = !connu || (zeroAttention && valeur === 0);
  const affiche = texte ?? (connu ? format(valeur as number) : '');
  // VI-2 : le repère d'un champ effacé en cours de frappe est la valeur qui compte encore dans la recette (elle ne change qu'à la frappe d'un nombre ou
  // à la sortie), pas le « 0 » de repos : la ligne disait « 0 kg » à côté de « 63 % du grain » et d'un total qui n'avait pas bougé. Jamais un chiffre inventé.
  const repere = connu ? format(valeur as number) : repos;
  const largeur = auContenu ? { width: `${Math.max(1, (affiche || repere).length) + 0.4}ch` } : undefined;

  const garder = (v: number) => {
    if (v !== valeur) onValeur(v);
  };
  const fin = () => {
    if (echap.current) { echap.current = false; if (avant.current !== null) garder(avant.current); }
    else if (texte !== null) {
      const v = /^\s*[-−–]/.test(texte) ? null : lit(texte);
      if (v === null) {
        if (videVaut0 && touche.current && texte.trim() === '') garder(0);
        else if (avant.current !== null) garder(avant.current);
      }
    }
    setTexte(null);
    setNegatif(false);
  };

  return (
    <Input
      {...(marques as Record<string, string>)}
      id={id}
      type="text"
      inputMode={entier ? 'numeric' : 'decimal'}
      enterKeyHint="done"
      aria-label={libelle}
      aria-invalid={invalide || negatif || undefined}
      title={negatif ? 'Pas de valeur négative' : undefined}
      aria-describedby={decrit}
      placeholder={repere}
      className={`${className}${vide && (texte === null || frais) && (!connu || zeroAttention) ? ' fer-zero' : ''}${texte !== null && frais ? ' fer-frais' : ''}${negatif ? ' fer-ko' : ''}`}
      style={largeur}
      value={affiche}
      onFocus={(e) => { avant.current = valeur ?? null; echap.current = false; touche.current = false; setFrais(true); setTexte(connu ? format(valeur as number) : ''); e.currentTarget.select(); }}
      onChange={(e) => {
        const t = e.target.value;
        touche.current = true;
        setFrais(false);
        setTexte(t);
        // Un nombre négatif n'existe pas ici (masse, jour) : « -1 » n'est plus lu « 1 » (banc d'actionneurs N4). Refus visible, rien de retenu ; la valeur d'avant revient en quittant le champ.
        const negatif = /^\s*[-−–]/.test(t);
        setNegatif(negatif);
        const v = lit(t);
        if (v !== null && !negatif) garder(arrondi(entier ? Math.round(v) : v));
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault(); e.stopPropagation();
          if (!onEntree || !onEntree()) e.currentTarget.blur();
        } else if (e.key === 'Escape') {
          e.preventDefault(); e.stopPropagation();
          echap.current = true; e.currentTarget.blur();
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const lu = texte ? lit(texte) : null;
          const v = cran(lu ?? valeur ?? 0, e.key === 'ArrowUp' ? 1 : -1);
          setFrais(false); setTexte(format(v)); garder(v);
        } else if (e.key === 'Tab' && onTab) {
          if (onTab(e.shiftKey ? -1 : 1)) e.preventDefault();
        }
      }}
      onBlur={fin}
    />
  );
};
