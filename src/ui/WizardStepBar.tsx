import React, { useEffect, useRef } from 'react';

/**
 * Navigation directe en un appui, avec nom et position de l’étape.
 * Les libellés courts restent visibles sur téléphone, dans un rail de 28 px
 * défilant localement si nécessaire. La densité suit l’échelle de DESIGN.md.
 * L’avancement garde une couleur d’interface indépendante de celle de la bière.
 */

export interface WizardStep {
  id: string;
  label: string;
  shortLabel?: string;
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
  CommunProps & { onSelect: (id: string) => void; disabled?: boolean; showLabels?: boolean; compactLabels?: boolean }
> = ({ steps, currentIndex, onSelect, disabled = false, showLabels = false, compactLabels = false }) => {
  const rail = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = rail.current;
    if (!compactLabels || !element) return;
    const revealCurrent = () => element.querySelector('[aria-current="step"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    revealCurrent();
    const observer = new ResizeObserver(revealCurrent);
    observer.observe(element);
    return () => observer.disconnect();
  }, [currentIndex, compactLabels]);
  return <nav ref={rail} aria-label="Étapes" className={`wizard-step-rail flex w-full gap-1 ${compactLabels ? 'overflow-x-auto overscroll-x-contain' : ''}`}>
    {steps.map((s, i) => (
      <button
        key={s.id}
        type="button"
        disabled={disabled}
        onClick={() => onSelect(s.id)}
        aria-current={i === currentIndex ? 'step' : undefined}
        aria-label={s.label}
        // La cible reste dans sa rangée pour ne pas recouvrir les actions du titre.
        title={s.label}
        className={`group flex min-h-touch min-w-0 ${compactLabels ? 'shrink-0 px-1' : 'flex-1'} items-center rounded-control focus-visible:outline focus-visible:outline-2 focus-visible:outline-water
                   disabled:opacity-40 disabled:pointer-events-none ${showLabels ? 'flex-col justify-center gap-1' : ''}`}
      >
        {showLabels && <span className={`max-w-full ${compactLabels ? 'whitespace-nowrap' : 'truncate'} text-xs ${i === currentIndex ? 'text-cave-50 font-semibold' : 'text-cave-400'}`}>{compactLabels ? s.shortLabel ?? s.label : s.label}</span>}
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
  </nav>;
};
