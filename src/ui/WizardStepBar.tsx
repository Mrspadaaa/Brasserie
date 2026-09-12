import React, { useEffect, useRef } from 'react';

/**
 * Fil des étapes d'un assistant, en deux pièces.
 *
 * ⚠️ TROIS CONTRAINTES QUI SE CONTREDISENT, ET COMMENT ELLES TIENNENT ENSEMBLE.
 *
 * 1. **On change d'étape en UN appui.** Demande explicite de Gaëtan. Une
 *    version intermédiaire ouvrait une feuille listant les sept étapes : le nom
 *    devenait lisible, mais il fallait deux gestes au lieu d'un. En cuverie,
 *    avec une minuterie qui tourne, c'est un geste de trop.
 * 2. **On doit savoir où on est.** Le fil d'origine était fait de sept barres de
 *    `30 × 6 px` dont le nom vivait dans un `sr-only` rendu en 1 × 1 px :
 *    présent pour un lecteur d'écran, invisible pour tout le monde d'autre.
 * 3. **Une cible fait 48 px** (`DESIGN.md`), 44 pour un contrôle répété.
 *
 * D'où la séparation en deux pièces, posées sur deux rangs :
 *
 *   · `WizardStepName` — le nom et la position, en clair, dans la rangée de
 *     l'en-tête, à côté du retour et des actions ;
 *   · `WizardStepRail` — les sept barres, seules sur leur rang, donc sur TOUTE
 *     la largeur. C'est ce qui règle la cible : serré contre le bouton retour et
 *     deux icônes, chaque segment ne mesurait que 30 px de large ; sur un rang à
 *     lui, il en fait une cinquantaine.
 *
 * La hauteur, elle, vient de `h-11` ramené par `-my-3.5` : 44 px d'attrape pour
 * 16 px de place réelle. Le dessin reste fin, le doigt ne rate plus.
 *
 * La barre ne prend PAS la couleur de la bière : l'avancement d'un formulaire
 * est un état d'interface, pas un moût. `ebc-straw` reste à l'action principale
 * (`DESIGN.md`, « L'échelle EBC — réservée »).
 */

export interface WizardStep {
  id: string;
  label: string;
}

interface CommunProps {
  steps: WizardStep[];
  /** Index de l'étape en cours, base 0. */
  currentIndex: number;
}

/** Le nom de l'étape et sa position. Se pose dans la rangée de l'en-tête. */
export const WizardStepName: React.FC<CommunProps> = ({ steps, currentIndex }) => {
  const total = steps.length;
  const position = Math.min(Math.max(currentIndex + 1, 1), total);
  const current = steps[currentIndex];
  const vif = useRef<HTMLParagraphElement>(null);

  /*
   * Le changement d'étape est instantané et ne déplace pas le focus : sans
   * annonce, un lecteur d'écran ne dirait rien. `aria-live="polite"` le signale
   * sans interrompre une frappe en cours.
   */
  useEffect(() => {
    if (vif.current) vif.current.textContent = `${current?.label} — étape ${position} sur ${total}`;
  }, [current?.label, position, total]);

  return (
    <p className="flex min-w-0 flex-1 items-baseline gap-1.5">
      <span className="min-w-0 truncate text-base font-semibold text-cave-50">{current?.label}</span>
      <span className="shrink-0 font-mono text-sm text-cave-400">
        {position}/{total}
      </span>
      <span ref={vif} aria-live="polite" className="sr-only" />
    </p>
  );
};

/** Les sept barres, directement tapables. À poser seules sur leur rang. */
export const WizardStepRail: React.FC<
  CommunProps & { onSelect: (id: string) => void; disabled?: boolean }
> = ({ steps, currentIndex, onSelect, disabled = false }) => (
  <nav aria-label="Étapes" className="flex w-full gap-1">
    {steps.map((s, i) => (
      <button
        key={s.id}
        type="button"
        disabled={disabled}
        onClick={() => onSelect(s.id)}
        aria-current={i === currentIndex ? 'step' : undefined}
        aria-label={s.label}
        // La cible reste dans sa rangée pour ne pas recouvrir les actions du titre.
        className="group flex h-11 min-w-0 flex-1 items-center
                   disabled:opacity-40 disabled:pointer-events-none"
      >
        <span
          className={`h-1.5 w-full rounded-full transition-colors ${
            i === currentIndex
              ? 'bg-cave-50'
              : i < currentIndex
                ? 'bg-cave-400'
                : 'bg-cave-800 group-hover:bg-cave-700'
          }`}
        />
      </button>
    ))}
  </nav>
);
