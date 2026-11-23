import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Pencil, Plus } from 'lucide-react';
import type { BrewhouseProfile, Recipe } from '../../../types';
import { isCurrent } from '../../../domain/catalogOrganization';
import { useLiveSelection } from '../../../hooks/useLiveData';
import { scaleBrewRecipeScenario } from '../../../domain/finance/brewBudgetScaling';
import { BORNES_PROCEDE } from '../../../domain/bornesProcede';
import { nombreFr } from '../../../domain/nombreAffiche';
import { parseDecimal } from '../../numericInput';
import { COULEURS } from '../../hopIndex/familyTokens';
import { etapesDe, ecartAffiche, totauxDe, type Etape, type LigneEtape } from './etapes';
import { famillesDe, type FamillesDuHoublon } from './familles';
import './volumes.css';
import { refCurseurNatif } from '../../geste';

/** La règle du curseur (e10c : 5 à 60 L). Une valeur tapée peut aller au-delà, jusqu'aux bornes du procédé. */
export const CURSEUR = { min: 5, max: 60, pas: 0.5 } as const;
const pc = (v: number) => Math.min(100, Math.max(0, ((v - CURSEUR.min) / (CURSEUR.max - CURSEUR.min)) * 100));
const lit = (n: number, d: number) => nombreFr(n, d);
/** Chiffres à décimales fixes (« 5,00 kg », « 24,0 L ») : les quantités d'une liste de pesée s'alignent comme dans la maquette. */
const fixe = (n: number, d: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });

export type VolumeEtat =
  | { genre: 'ok' }
  | { genre: 'refuse'; tete: string; message: string };

/** Le volume cible est-il acceptable ? Les bornes sont celles du procédé (0,5 à 2 000 L) ; le refus se dit, il ne change rien en silence. */
export function etatVolume(volumeL: number, saisieIllisible?: string): VolumeEtat {
  const { min, max } = BORNES_PROCEDE.volumeBrassinL;
  if (saisieIllisible) return { genre: 'refuse', tete: `« ${saisieIllisible} » ?`, message: `Volume non reconnu. Indique un volume cible de ${lit(min, 1)} L ou plus.` };
  if (!Number.isFinite(volumeL) || volumeL < min) return { genre: 'refuse', tete: `${Number.isFinite(volumeL) ? `${lit(volumeL, 2)} L` : '—'} ?`, message: `Indique un volume cible de ${lit(min, 1)} L ou plus.` };
  if (volumeL > max) return { genre: 'refuse', tete: `${lit(volumeL, 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} L ?`, message: `Au plus ${lit(max, 0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} L (la plus grande cuve d’une micro-brasserie). Erreur de saisie probable.` };
  return { genre: 'ok' };
}

function Bande({ familles }: { familles: FamillesDuHoublon }) {
  return (
    <svg className="pv-fam" viewBox="0 0 22 14" aria-hidden="true">
      {familles.map((f, i) => <rect key={f} x={i * 5.5} width="4.5" height="14" rx="1.5" fill={COULEURS[f].base} />)}
    </svg>
  );
}

function Ligne({ ligne, familles, fait, onBascule, refuse }: { ligne: LigneEtape; familles?: FamillesDuHoublon; fait: boolean; onBascule: () => void; refuse: boolean }) {
  const ecart = ecartAffiche(ligne.ecart, ligne.decimales);
  return (
    <div className="pv-row" data-fait={fait ? '' : undefined} data-ligne={ligne.cle}>
      <button type="button" role="checkbox" aria-checked={fait} aria-label={`Pesé : ${ligne.nom}`} className="pv-ck" onClick={onBascule} />
      <span className="pv-n2">{familles && <Bande familles={familles} />}<span>{ligne.nom}</span></span>
      <span className="pv-q">
        {refuse || ligne.valeur == null
          ? <span className="pv-reading" aria-label="inconnu">—</span>
          : <><span className="pv-reading">{fixe(ligne.valeur, ligne.decimales)}</span> <span className="pv-unite">{ligne.unite}</span>{ecart && <span className="pv-pastille" data-ton="attention" aria-label={`écart de ${ecart} ${ligne.unite}`}>{ecart}</span>}</>}
      </span>
    </div>
  );
}

function Etapes({ etapes, familles, faits, onBascule, refuse }: { etapes: Etape[]; familles: Record<string, FamillesDuHoublon>; faits: Set<string>; onBascule: (cle: string) => void; refuse: boolean }) {
  return (
    <div className="pv-list" data-role="etapes">
      <div className="pv-rail" />
      {etapes.map(e => (
        <section key={e.id} className="pv-st" data-etape={e.id} aria-label={e.titre}>
          <div className="pv-dot" style={{ background: `rgb(${e.couleur})` }} />
          <h3><span className="pv-section">{e.titre}</span>{e.detail && <span className="pv-label pv-mono">{e.detail}</span>}</h3>
          {e.lignes.map(l => (
            <Ligne key={l.cle} ligne={l} refuse={refuse} familles={l.houblon ? familles[l.houblon] : undefined}
              fait={faits.has(`${e.id}:${l.cle}`)} onBascule={() => onBascule(`${e.id}:${l.cle}`)} />
          ))}
        </section>
      ))}
    </div>
  );
}

export interface AdapterVolumesProps {
  recettes: Recipe[];
  brewhouses: BrewhouseProfile[];
  activeBrewhouseId: string;
  /** « Créer une recette » du carnet vide : l'assistant de recette. */
  onNouvelleRecette: () => void;
}

/** e10c : la pesée du jour de brassage. Recette source, volume cible au curseur, quantités rangées par moment. */
export function AdapterVolumes({ recettes, brewhouses, activeBrewhouseId, onNouvelleRecette }: AdapterVolumesProps) {
  const courantes = useMemo(() => recettes.filter(isCurrent), [recettes]);
  const [recette, setRecette] = useLiveSelection(courantes, 'id');
  useEffect(() => { if (!recette && courantes.length) setRecette(courantes[0]); }, [courantes, recette, setRecette]);

  const [volumeL, setVolumeL] = useState<number>(Number.NaN);
  const [illisible, setIllisible] = useState<string | undefined>();
  const [saisie, setSaisie] = useState<string | null>(null);
  const [faits, setFaits] = useState<Set<string>>(new Set());
  const champ = useRef<HTMLInputElement>(null);
  // Le volume de départ est celui de la recette : « À peser pour 24 L », × 1,00.
  useEffect(() => { if (recette?.volumeL > 0) { setVolumeL(recette.volumeL); setIllisible(undefined); setFaits(new Set()); } }, [recette?.id]);
  useEffect(() => { if (saisie !== null) champ.current?.select(); }, [saisie === null]);

  const [familles, setFamilles] = useState<Record<string, FamillesDuHoublon>>({});
  const noms = useMemo(() => (recette?.hops ?? []).map(h => h.name).join('|'), [recette]);
  useEffect(() => {
    let actif = true;
    if (noms) famillesDe(noms.split('|')).then(f => { if (actif) setFamilles(f); }).catch(() => { if (actif) setFamilles({}); });
    return () => { actif = false; };
  }, [noms]);

  if (!recette) {
    return (
      <section aria-label="Adapter une recette au volume" data-etat="vide">
        <div className="pv-hd"><div className="pv-l1"><span className="pv-section">Volumes</span></div><p className="pv-display">Rien à peser :<br />carnet vide</p></div>
        <div className="pv-vide"><button type="button" className="pv-bouton" onClick={onNouvelleRecette}><Plus aria-hidden="true" />Créer une recette</button></div>
      </section>
    );
  }

  const etat = etatVolume(volumeL, illisible);
  const refuse = etat.genre === 'refuse';
  const base = recette.brewhouse ?? brewhouses.find(b => b.id === activeBrewhouseId) ?? brewhouses[0];
  const cibleBh = volumeL >= 250 ? (brewhouses.find(b => b.volumeL >= 250) || base) : base;
  const calculable = !refuse && recette.volumeL > 0 && Number.isFinite(recette.volumeL) && !!base;
  const mise = calculable ? scaleBrewRecipeScenario(recette, volumeL, base, cibleBh) : null;
  // La recette à son propre volume : référence des écarts, et squelette des moments quand le volume cible est refusé.
  const miseSource = recette.volumeL > 0 && Number.isFinite(recette.volumeL) && base ? scaleBrewRecipeScenario(recette, recette.volumeL, base, base) : null;
  const etapes = mise ? etapesDe(recette, mise, Math.abs(volumeL - recette.volumeL) < 0.005 ? null : miseSource) : miseSource && refuse ? etapesDe(recette, miseSource, null) : [];
  const totaux = mise ? totauxDe(mise) : null;
  // La cuve : celle de l'installation qui reçoit le volume. Inconnue : ni bande, ni alerte (jamais 0).
  const cuveL = cibleBh?.volumeL > 0 ? cibleBh.volumeL : undefined;
  const trop = !refuse && cuveL !== undefined && volumeL > cuveL;
  const plafonne = mise?.waterPlan.mashLimitedByKettleL;
  const facteur = calculable ? fixe(volumeL / recette.volumeL, 2) : '—';
  const hors = refuse || trop || volumeL > CURSEUR.max || volumeL < CURSEUR.min;
  const pouce = refuse ? CURSEUR.max : Math.min(CURSEUR.max, Math.max(CURSEUR.min, volumeL));

  const valider = (texte: string) => {
    setSaisie(null);
    const lu = parseDecimal(texte);
    if (lu === null) { setIllisible(texte.trim() || undefined); setVolumeL(Number.NaN); return; }
    setIllisible(undefined);
    setVolumeL(lu);
  };
  const bascule = (cle: string) => setFaits(prev => { const n = new Set(prev); if (!n.delete(cle)) n.add(cle); return n; });

  return (
    <section aria-label="Adapter une recette au volume" data-etat={refuse ? 'refuse' : trop ? 'trop' : 'repos'}>
      <div className="pv-top">
        <div className="pv-hd">
          <div className="pv-l1">
            <label className="pv-src">
              <span className="sr-only">Recette source</span>
              <select name="production_scale_recipe_select" value={recette.id}
                onChange={e => { const trouvee = courantes.find(r => r.id === e.target.value); if (trouvee) setRecette(trouvee); }}>
                {courantes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
              <ChevronDown aria-hidden="true" />
            </label>
            <output className="pv-label" aria-live="polite">recette {lit(recette.volumeL, 2)} L · ×&nbsp;{facteur}</output>
          </div>
          {refuse
            ? <p className="pv-display"><em className="pv-al">{etat.tete}</em></p>
            : <p className="pv-display">{trop ? <><em className="pv-al">{lit(volumeL, 1)} L</em> ne tiennent pas dans {cibleBh.name}</> : <>À peser pour <em>{lit(volumeL, 1)} L</em></>}</p>}
          {refuse && <p className="pv-why" role="alert" id="production-target-volume-error">{etat.message}</p>}
          {trop && <p className="pv-why" role="status">{cibleBh.name} prend {lit(cuveL!, 1)} L au plus.</p>}
          {plafonne != null && !trop && !refuse && <p className="pv-label" role="status">Empâtage plafonné par la cuve ({lit(plafonne, 1)} L utiles).</p>}
          <div className="pv-tot" aria-label="Totaux">
            <div><span className="pv-label" style={{ color: 'rgb(var(--water-texte))' }}>eau</span><span className="pv-reading">{totaux && totaux.eauL != null ? `${fixe(totaux.eauL, 1)} L` : '—'}</span></div>
            <div><span className="pv-label" style={{ color: 'rgb(var(--ebc-amber-texte))' }}>grain</span><span className="pv-reading">{totaux ? `${fixe(totaux.grainKg, 2)} kg` : '—'}</span></div>
            <div><span className="pv-label" style={{ color: 'rgb(var(--hop-texte))' }}>houblon</span><span className="pv-reading">{totaux ? `${fixe(totaux.houblonG, 0)} g` : '—'}</span></div>
          </div>
        </div>

        <div className="pv-bot" data-role="volume-cible">
          <div className="pv-b1">
            <span className="pv-section">Volume cible</span>
            {saisie === null
              ? <button type="button" className="pv-val" aria-label="Taper le volume" data-invalide={refuse ? '' : undefined} onClick={() => setSaisie(Number.isFinite(volumeL) ? lit(volumeL, 2) : (illisible ?? ''))}>
                  <span className="pv-reading pv-reading-grand">{refuse ? (Number.isFinite(volumeL) ? fixe(volumeL, 1) : '—') : fixe(volumeL, 1)}</span><span className="pv-unite">L</span><Pencil aria-hidden="true" />
                </button>
              : <span className="pv-val" data-edit="">
                  <input ref={champ} type="text" inputMode="decimal" autoComplete="off" name="production_target_volume" aria-label="Volume cible" aria-invalid={refuse || undefined}
                    aria-describedby={refuse ? 'production-target-volume-error' : undefined} value={saisie} onChange={e => setSaisie(e.target.value)}
                    onBlur={e => valider(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); valider((e.target as HTMLInputElement).value); } else if (e.key === 'Escape') setSaisie(null); }} />
                  <span className="pv-unite">L</span>
                </span>}
          </div>
          <div className="pv-curseur">
            <div className="pv-grads">
              <span data-bout="g" style={{ left: 0 }}>{lit(CURSEUR.min, 1)} L</span>
              {recette.volumeL >= CURSEUR.min && recette.volumeL <= CURSEUR.max && <span style={{ left: `${pc(recette.volumeL)}%` }}>recette</span>}
              {cuveL !== undefined && cuveL <= CURSEUR.max && <span data-cible="" style={{ left: `${Math.min(pc(cuveL) + 5, 92)}%` }}>cuve {lit(cuveL, 0)}</span>}
              <span data-bout="d" style={{ left: '100%' }}>{lit(CURSEUR.max, 1)} L</span>
            </div>
            <div className="pv-zone">
              <div className="pv-rail-c" />
              {(trop || refuse || volumeL > CURSEUR.max) && cuveL !== undefined && cuveL < CURSEUR.max && <div className="pv-over" style={{ left: `${pc(cuveL)}%` }} />}
              {[10, 20, 30, 40, 50].map(x => <span key={x} className="pv-tic" style={{ left: `${pc(x)}%` }} />)}
              {cuveL !== undefined && <div className="pv-cible" style={{ left: 0, width: `${pc(Math.min(cuveL, CURSEUR.max))}%` }} />}
              <input ref={refCurseurNatif} className="pv-range" type="range" name="production_target_volume_range" min={CURSEUR.min} max={CURSEUR.max} step={CURSEUR.pas} aria-label="Volume cible, curseur"
                aria-valuetext={refuse ? 'refusé' : `${lit(volumeL, 1)} L`} value={pouce}
                onChange={e => { setIllisible(undefined); setVolumeL(Number(e.target.value)); }} />
              <span className="pv-pouce" data-hors={hors ? '' : undefined} style={{ left: `${pc(pouce)}%` }} aria-hidden="true"><i /><b /></span>
            </div>
          </div>
        </div>
      </div>
      {etapes.length > 0 && <Etapes etapes={etapes} familles={familles} faits={faits} onBascule={bascule} refuse={refuse} />}
      {!mise && !refuse && <p role="alert" className="pv-why">{!base ? 'Configure une cuverie dans les réglages pour adapter cette recette.' : 'Le volume de la recette source doit être renseigné et positif.'}</p>}
    </section>
  );
}
