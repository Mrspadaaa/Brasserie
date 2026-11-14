import React, { useMemo } from 'react';
import { ChevronDown, Lock, Minus, Plus, Play, RotateCcw, Database } from 'lucide-react';
import type { BrewhouseProfile, Recipe } from '../types';
import { apercuLancement, contenanceCuveL, contenanceFermenteurL, echelleRegleL, facteurVolume, type EtapeLancement, type PastilleLancement } from '../domain/brewLaunch';
import { nombreFr } from '../domain/nombreAffiche';
import './brew-launch.css';

/* Le lancement d'un brassin (uv4, choisie le 14.11) : une règle de volume, puis la journée de brassage pesée pour ce volume.
   Aucun calcul ici : les quantités viennent de la recette adaptée (domain/brewLaunch.ts). Les ronds de la frise sont vides et ne se touchent pas. */

const COULEUR: Record<string, { rond: string; fond: string }> = {
  malt: { rond: 'border-area-production', fond: 'bg-area-production/10' },
  eau: { rond: 'border-area-finances', fond: 'bg-area-finances/10' },
  houblon: { rond: 'border-hop', fond: 'bg-hop/10' },
  froid: { rond: 'border-area-finances', fond: 'bg-area-finances/10' },
  levure: { rond: 'border-attention', fond: 'bg-attention/10' }
};

const L = (n: number) => nombreFr(n, 1);

function Pastille({ p, fond }: { p: PastilleLancement; fond: string }) {
  return (
    <span className={`inline-flex items-baseline gap-[3px] h-[23px] pt-[2px] px-1.5 rounded-control text-2xs text-cave-200 ${fond}`}>
      {p.jour != null && <small className="text-footnote text-cave-400">J+{nombreFr(p.jour, 0)}</small>}
      {p.nom}
      {p.alpha != null && <small className="text-footnote text-cave-400">α {nombreFr(p.alpha, 1)}</small>}
      <b className="tabular-nums font-bold text-cave-50">{nombreFr(p.quantite, p.unite === 'kg' ? 2 : 0)}</b>
      <small className="text-footnote text-cave-400">{p.unite}</small>
    </span>
  );
}

function Etape({ e }: { e: EtapeLancement }) {
  const c = COULEUR[e.id === 'dry-hop' ? 'froid' : e.matiere];
  return (
    <li data-etape={e.id} className="relative py-[3px] pb-1 border-t border-cave-800 first:border-t-0">
      <span aria-hidden="true" className={`absolute -left-[25px] top-[5px] w-5 h-5 rounded-full border-[2.5px] bg-cave-950 ${c.rond}`} />
      <div className="flex items-baseline gap-1.5 min-h-[22px]">
        <b className="text-[15px] font-bold text-cave-50">{e.titre}</b>
        {e.detail && <small className="text-2xs text-cave-400">{e.detail}</small>}
        {e.levure && <small className="text-2xs text-cave-400">{e.levure.nom}</small>}
        {e.levure?.arrondir && <span className="text-footnote font-semibold px-1.5 rounded-full bg-attention/10 text-attention">à arrondir</span>}
        <span className="flex-1" />
        {e.eauL != null && <><small className="text-2xs text-cave-400">eau</small><span className="tabular-nums text-[15px] font-bold text-cave-50">{L(e.eauL)} <u className="no-underline font-normal text-2xs text-cave-400">L</u></span></>}
        {e.levure?.quantite != null && <span className="tabular-nums text-[15px] font-bold text-cave-50">{nombreFr(e.levure.quantite, 2)}{e.levure.unite && <> <u className="no-underline font-normal text-2xs text-cave-400">{e.levure.unite}</u></>}</span>}
      </div>
      {e.pastilles.length > 0 && <div className="flex flex-wrap gap-x-[5px] gap-y-1 mt-[3px]">{e.pastilles.map((p) => <Pastille key={p.cle} p={p} fond={c.fond} />)}</div>}
    </li>
  );
}

export interface BrewLaunchPanelProps {
  recette: Recipe;
  volumeL: number;
  onVolume: (v: number) => void;
  brasseries: BrewhouseProfile[];
  /** Absente si aucune brasserie n'est configurée : la règle reste, la journée dit qu'elle ne peut pas être adaptée. */
  actif?: BrewhouseProfile;
  choisi?: BrewhouseProfile;
  onBrasserie: (id: string) => void;
  onContenance: () => void;
  /** Quand le brasseur a la main (enregistrement en cours : tout est figé). */
  disabled?: boolean;
}

export const BrewLaunchPanel: React.FC<BrewLaunchPanelProps> = ({ recette, volumeL, onVolume, brasseries, actif, choisi, onBrasserie, onContenance, disabled }) => {
  const lancement = choisi ?? actif;
  const brassinL = lancement?.volumeL;
  const maxL = echelleRegleL(recette.volumeL, brassinL);
  const apercu = useMemo(() => {
    if (!actif) return null;
    try { return apercuLancement(recette, volumeL, actif, choisi); } catch { return null; }
  }, [recette, volumeL, actif, choisi]);
  const facteur = facteurVolume(volumeL, recette);
  const cuveL = contenanceCuveL(lancement);
  const fermenteurL = contenanceFermenteurL(lancement);
  const eauL = apercu?.etapes.find((e) => e.id === 'empatage')?.eauL;
  const pct = (l: number) => Math.min(100, Math.max(0, (l / maxL) * 100));
  const x = (l: number) => `calc(10px + (100% - 20px) * ${pct(l) / 100})`;
  const surBrassin = brassinL != null && Math.abs(volumeL - brassinL) < 0.01;
  const pas = (d: number) => onVolume(Math.max(1, Math.round((volumeL + d) * 2) / 2));
  const eauAGauche = eauL != null && pct(eauL) > 78;
  const cap = 'min-h-[44px] min-w-[44px]';

  return (
    <div className="space-y-1.5">
      <section aria-label="Règle de volume" className="rounded-panel border border-cave-800 bg-cave-900 px-2 pt-1.5 pb-0.5">
        <div className="flex items-center gap-1.5 text-sm text-cave-400">
          <button type="button" aria-label="Moins" disabled={disabled} onClick={() => pas(-1)} className={`${cap} grid place-items-center rounded-control border border-cave-700 bg-cave-950 text-cave-50 disabled:opacity-50`}><Minus size={18} aria-hidden="true" /></button>
          <button type="button" aria-label="Plus" disabled={disabled} onClick={() => pas(1)} className={`${cap} grid place-items-center rounded-control border border-cave-700 bg-cave-950 text-cave-50 disabled:opacity-50`}><Plus size={18} aria-hidden="true" /></button>
          {facteur != null && <span aria-label="Facteur de la recette">×&nbsp;<b className="tabular-nums text-[15px] text-cave-50">{nombreFr(facteur, 2)}</b></span>}
          <span className="flex-1" />
          {!lancement ? null : brasseries.length > 1 ? (
            <label className="relative">
              <span className="sr-only">Système de brassage</span>
              <select aria-label="Système de brassage" disabled={disabled} value={lancement.id} onChange={(e) => onBrasserie(e.target.value)} className="min-h-[44px] max-w-[9.5rem] appearance-none rounded-control border border-cave-700 bg-cave-950 pl-2 pr-6 text-sm text-cave-50">
                {brasseries.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-cave-50" />
            </label>
          ) : <span className="min-h-[44px] inline-flex items-center rounded-control border border-cave-700 bg-cave-950 px-2 text-sm text-cave-50">{lancement.name}</span>}
          <button type="button" aria-label={`Volume de la recette, ${L(recette.volumeL)} L`} disabled={disabled} onClick={() => onVolume(recette.volumeL)} className={`${cap} inline-flex items-center gap-1 rounded-control border border-cave-700 bg-cave-950 px-2 text-sm text-cave-50 disabled:opacity-50`}><RotateCcw size={14} aria-hidden="true" /><span className="tabular-nums">{L(recette.volumeL)} L</span></button>
        </div>

        <div className="bl-regle relative h-[92px]" style={{ ['--bl-max' as string]: maxL }}>
          <div className="bl-graduations" aria-hidden="true" />
          <div className="bl-piste" aria-hidden="true" />
          <div className="bl-tire" aria-hidden="true" style={{ width: `calc((100% - 20px) * ${pct(volumeL) / 100})` }} />
          <i className="bl-repere" aria-hidden="true" style={{ left: x(recette.volumeL) }} />
          <span className="bl-etiq text-footnote text-cave-400" style={{ left: x(recette.volumeL), transform: 'translateX(calc(-100% - 4px))' }}><b className="tabular-nums text-cave-50">{L(recette.volumeL)} L</b> recette</span>
          {brassinL != null && <>
            <i className="bl-repere" aria-hidden="true" style={{ left: x(brassinL) }} />
            <span className="bl-etiq text-footnote text-cave-400" style={{ left: x(brassinL), transform: 'translateX(5px)' }}>{!surBrassin && <><b className="tabular-nums text-cave-50">{L(brassinL)} L</b> </>}brassin</span>
          </>}
          <span className="absolute left-[14px] top-[62px] text-footnote text-cave-400">eau d’empâtage</span>
          <div className="bl-eau" aria-hidden="true" style={{ width: `calc((100% - 20px) * ${eauL != null ? pct(eauL) / 100 : 0})`, display: eauL != null ? undefined : 'none' }} />
          {eauL != null && (
            <b className="absolute tabular-nums text-2xs text-water" style={eauAGauche ? { top: 54, right: `calc(100% - ${x(eauL)})`, transform: 'none' } : { top: 69, left: `calc(${x(eauL)} + 7px)` }}>{L(eauL)} L</b>
          )}
          <input type="range" aria-label="Volume du brassin" aria-valuetext={`${L(volumeL)} L`} min={0} max={maxL} step={0.5} value={Math.min(volumeL, maxL)} disabled={disabled} onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) onVolume(Math.max(1, v)); }} className="bl-curseur peer" />
          <span aria-hidden="true" className="bl-bulle tabular-nums" style={{ left: `clamp(28px, ${x(volumeL)}, calc(100% - 28px))` }}>{L(volumeL)} L</span>
          <span aria-hidden="true" className="bl-bouton peer-focus-visible:ring-2 ring-offset-2" style={{ left: x(volumeL) }} />
        </div>
      </section>

      {/* AM-47 sans alerte : la capacité connue se lit, neutre, à côté de la cuve ; aucun rouge, rien n'est refusé. */}
      <div className="flex items-center gap-2">
        {cuveL == null ? (
          <button type="button" onClick={onContenance} aria-label="Renseigner la contenance de la cuve" className="flex-1 min-w-0 min-h-[44px] flex items-center gap-1.5 pl-2 pr-1 rounded-control border border-dashed border-cave-700 text-2xs text-cave-400 text-left">
            <Database size={14} aria-hidden="true" />contenance à renseigner<b className="ml-auto px-1.5 text-[17px] text-cave-50" aria-hidden="true">›</b>
          </button>
        ) : (
          <p className="min-h-[32px] flex items-center gap-1.5 pl-2 text-2xs text-cave-400"><Database size={14} aria-hidden="true" />cuve <b className="tabular-nums text-cave-50">{L(cuveL)} L</b></p>
        )}
        {fermenteurL != null && <p className="min-h-[32px] flex items-center gap-1.5 text-2xs text-cave-400 whitespace-nowrap">fermenteur <b className="tabular-nums text-cave-50">{L(fermenteurL)} L</b></p>}
      </div>

      {apercu ? (
        <>
          <ol aria-label="Journée de brassage" className="bl-frise relative mt-1.5 pl-[26px]">
            {apercu.etapes.map((e, i) => (
              <React.Fragment key={e.id}>
                {(i === 0 || apercu.etapes[i - 1].groupe !== e.groupe) && <p role="presentation" className="mt-1 text-footnote font-bold uppercase tracking-wide text-cave-400">{e.groupe === 'brassage' ? 'Brassage' : 'Fermentation'}</p>}
                <Etape e={e} />
              </React.Fragment>
            ))}
          </ol>
          {(recette.ogTarget != null || recette.ibuTarget != null) && (
            <p className="flex items-center gap-1.5 pt-1.5 border-t border-dashed border-cave-700 text-sm text-cave-400">
              <Lock size={14} aria-hidden="true" />
              {recette.ogTarget != null && <span>OG <b className="tabular-nums text-cave-50">{nombreFr(recette.ogTarget, 3)}</b></span>}
              {recette.ogTarget != null && recette.ibuTarget != null && <span aria-hidden="true">·</span>}
              {recette.ibuTarget != null && <span>IBU <b className="tabular-nums text-cave-50">{nombreFr(recette.ibuTarget, 0)}</b></span>}
              <span>— inchangés</span>
            </p>
          )}
        </>
      ) : <p role="status" className="text-2xs text-cave-400">La recette ne peut pas être adaptée à ce volume.</p>}
    </div>
  );
};

/** Le pied : « Ce qui manque » (secondaire) et « Lancer à N L » (primaire). */
export const BrewLaunchPied: React.FC<{ volumeL: number; disabled?: boolean; saving?: boolean; pending?: boolean; onManque: () => void; onLancer: () => void }> = ({ volumeL, disabled, saving, pending, onManque, onLancer }) => (
  <div className="flex gap-2">
    <button type="button" onClick={onManque} className="flex-[0_0_8.5rem] min-h-[46px] rounded-control border border-cave-700 text-sm leading-tight text-cave-50">Ce qui manque<br /><small className="text-2xs font-normal text-cave-400">pour <span className="tabular-nums">{L(volumeL)} L</span></small></button>
    <button type="button" disabled={disabled} onClick={onLancer} className="flex-1 min-h-[46px] rounded-control bg-ebc-straw text-[rgb(var(--sur-paille))] font-semibold text-base flex items-center justify-center gap-1.5 disabled:opacity-50">
      <Play size={18} aria-hidden="true" />{saving ? 'Enregistrement…' : pending ? 'Confirmer l’enregistrement' : <>Lancer à <span className="tabular-nums">{L(volumeL)} L</span></>}
    </button>
  </div>
);
