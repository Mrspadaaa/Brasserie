// Étape « Paliers 5/7 », maquette r2 reprise (courbe d'empâtage + fermentation en lecture). Les données, les setters et les conseils restent ceux de
// l'assistant (BrewWizard) : ce composant ne garde que l'état d'affichage (palier touché, ligne dépliée).
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Thermometer } from 'lucide-react';
import type { FermentationStep, Recipe, RecipeSnapshot } from '../../types';
import type { MashProgram } from '../../domain/brewPrograms';
import { recipeThermalPlan } from '../../domain/recipeThermalPlan';
import { pitchingPlan } from '../../domain/pitchingPlan';
import { formatDecimal } from '../numericInput';
import { SegmentedControl } from '../SegmentedControl';
import { CourbeEmpatage } from './CourbeEmpatage';
import { colonnesDe, courbeFermentation, type EtatEmpatage } from './modele';
import './paliers.css';

export interface EtapePaliersProps {
  /** `build()` : la recette telle que l'assistant la compose (mêmes lignes que le plan thermique du récapitulatif). */
  recipe: Recipe | RecipeSnapshot;
  etat: EtatEmpatage;
  onEmpatage: (suivant: EtatEmpatage) => void;
  programmes: readonly MashProgram[];
  programmeActif: string | null;
  onProgramme: (programme: MashProgram) => void;
  onRetirer: (rangReel: number) => void;
  verrou?: boolean;
  avisRetrait?: React.ReactNode;
  erreur: (champ: string) => string | undefined;
  spargeType: 'fly' | 'batch' | 'none';
  onSparge: (type: 'fly' | 'batch' | 'none') => void;
  ferment: FermentationStep[];
  onOuvrirLevure: () => void;
  conseilsEmpatage?: React.ReactNode;
  conseilsFermentation?: React.ReactNode;
  /** Ce que la ligne « Ensemencement » déplie en plus du refroidissement : programme de fermentation, repères, repère de levure. */
  fermentationDetail?: React.ReactNode;
  /** Premier message de validation d'une phase de fermentation (ses champs se règlent dans Levure). */
  erreurFermentation?: string;
  /** Le repère de levure liée à la recette (et son avis « Des réglages ont changé ») : un avis d'état, il reste visible sous la carte Fermentation. */
  contexteLevure?: React.ReactNode;
}

export function EtapePaliers(p: EtapePaliersProps) {
  const [ensemencement, setEnsemencement] = useState(false);
  const plan = recipeThermalPlan(p.recipe);
  const colonnes = colonnesDe(plan.rows, p.etat.steps.length);
  const pitch = pitchingPlan(p.recipe as RecipeSnapshot);
  const cible = pitch.targetC != null && Number.isFinite(pitch.targetC) ? pitch.targetC : undefined;
  const fer = courbeFermentation(p.ferment);
  const joursTexte = fer.jours === undefined ? '? j' : `${formatDecimal(fer.jours)} j`;

  return <div className="pal-etape" data-paliers="etape">
    <CourbeEmpatage colonnes={colonnes} etat={p.etat} onChange={p.onEmpatage} programmes={p.programmes} programmeActif={p.programmeActif}
      onProgramme={p.onProgramme} onRetirer={p.onRetirer} erreur={p.erreur} verrou={p.verrou} avis={p.avisRetrait}
      cadence={plan.rate}
      comparaison={{ possible: plan.canConsiderSkipping, gainMin: plan.beforeFiltrationSavedMin, sans: p.etat.mash?.mashoutEnabled === false }} />

    <div className="pal-rin"><span>Rinçage</span>
      <SegmentedControl label="Type de rinçage" value={p.spargeType} onChange={p.onSparge} className="pal-seg"
        options={[{ value: 'batch', label: 'Par bacs' }, { value: 'fly', label: 'Continu' }, { value: 'none', label: 'Aucun' }]} />
    </div>
    {p.conseilsEmpatage}

    <button type="button" className="pal-ens" aria-expanded={ensemencement} aria-controls="pal-ens-corps" onClick={() => setEnsemencement(o => !o)}>
      <Thermometer size={18} aria-hidden="true" className="pal-ens-ico" />Ensemencement <b>{cible === undefined ? 'à renseigner' : `${formatDecimal(cible)} °C`}</b>
      <span>refroidir{p.fermentationDetail ? ' · programme' : ''}<ChevronDown size={16} aria-hidden="true" data-ouvert={ensemencement} className="pal-chev" /></span>
    </button>
    {ensemencement && <div id="pal-ens-corps" className="pal-ens-corps">
      <p>Le temps dépend de la température de départ et de tes relevés. Le suivi du jour estimera chaque méthode séparément.</p>
      <ul>{pitch.choices.map(choice => <li key={choice.id}><strong>{choice.label}</strong><span>{choice.reason}</span></li>)}</ul>
      {plan.rate != null && <p className="pal-note">Repère de chauffe : {Number(plan.rate.toFixed(2)).toLocaleString('fr-CH')} °C/min, à confirmer pour ce volume et cette plage. Les maintiens commencent à température atteinte ; chauffe initiale et refroidissement en plus.</p>}
      {p.fermentationDetail}
    </div>}

    <button type="button" className="pal-fer" data-booster="fermentation-courbe" onClick={p.onOuvrirLevure} aria-invalid={!!p.erreurFermentation}
      aria-label={`Fermentation, ${joursTexte.replace(' j', ' jours')}, en lecture : se règle dans Levure`}>
      <b>Fermentation</b>
      <svg viewBox="0 0 160 36" width="100%" height="36" role="img" aria-hidden="true">
        {fer.segments.length === 0
          ? <path d="M2 18H158" stroke="var(--pal-trait)" strokeWidth="2" strokeDasharray="3 4" fill="none" />
          : <>
            <path d={fer.chemin} fill="none" stroke="var(--pal-tempere)" strokeWidth="4" />
            {fer.segments.filter(s => s.froid).map((s, i) => <path key={i} d={`M${s.x1} ${s.y}H${s.x2}`} stroke="var(--pal-froid)" strokeWidth="6" />)}
            {fer.etiquettes.map((e, i) => <text key={i} x={e.x} y={e.y} style={e.froid ? { fill: 'var(--pal-froidt)' } : undefined}>{e.texte}</text>)}
          </>}
      </svg>
      <span className="pal-fer-j"><b>{joursTexte}</b><ChevronRight size={16} aria-hidden="true" /></span>
    </button>
    {p.erreurFermentation && <p className="pal-err" role="alert">{p.erreurFermentation}</p>}
    {p.contexteLevure}
    {p.conseilsFermentation}
  </div>;
}
