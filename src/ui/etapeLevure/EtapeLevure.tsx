// La coque de l'étape « Levure 4/7 » (mission 2026-11-09-levure-port, voie u1) : le segment « Ma levure · Chercher · Comparer · Suggérer »
// (maquette s7a), et dessous la vue choisie. Ma levure est l5b ; Chercher, Comparer et Suggérer sont les trois vues de la voie u2, qui
// reçoivent les `PropsVue` du contrat. Le branchement de la recette reste celui du wizard : la coque appelle ses fonctions (choisir,
// écrire la conduite, annuler), elle n'en recopie aucune.
//
// RIEN NE SE PERD. Chaque fonction de l'ancienne étape (YeastRecipeChoice) garde sa place :
//  stock et saisie libre ......... puces de Ma levure + repli « Mon stock ou saisie libre » (YeastIngredientPicker)
//  offres, produit exact ......... repli « Produit exact et offres » (YeastPitchingPanel part="supply", « Corriger la fiche produit » compris)
//  Corriger la fiche ............. repli « Fiche » (YeastRecipeDossier), ouvert par un « ⌕ non documenté » touché
//  recherche IA de la fiche ...... même repli (RecipeAutoComplete) ; jamais lancée seule ; pour une autre levure : l'atelier
//  ensemencement et starter ...... repli « Dose, ensemencement et starter » (YeastPitchingPanel part="pitching" + quantité)
//  objectifs (cible de la bière).. repli « Objectifs » (YeastBeerTargetPanel)
//  dossier et sources ............ repli « Repères et sources » (YeastStrainDetails)
//  annuler le changement ......... barre « Annuler » sous le segment
//  essai de conduite, profil de fermentation, comparaison d'offres, corriger la fiche catalogue partagée, écarts du brouillon :
//                                  repli « Atelier complet » (YeastRecipeChoice, inchangé, monté à l'ouverture)
//  mode NOLO ..................... inchangé : le wizard garde YeastRecipeChoice (NoloPanel) quand NOLO est actif.
import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Undo2 } from 'lucide-react';
import type { StockItem } from '../../types';
import type { TrialRecipe } from '../../domain/hopIndex/trials';
import type { YeastReference } from '../../domain/yeastReferences';
import { yeastReferences } from '../../domain/yeastReferences';
import { createYeastRecipeDraft, evaluateYeastRecipeDesign, inferYeastRecipeStyle } from '../../domain/yeastRecipeDesign';
import { yeastStrainInformation } from '../../domain/yeastStrainInformation';
import { keepIndependentPitchingWort } from '../../domain/yeastPitching';
import { useStorageValue } from '../../hooks/useLiveData';
import { useYeastSupply } from '../../hooks/useYeastSupply';
import { StorageService } from '../../services/storage';
import type { YeastChoiceChange, YeastChoiceFields, YeastChoiceIntent } from '../YeastRecipeChoice';
import { YeastPitchingPanel } from '../YeastPitchingPanel';
import { NomLibreInitial } from '../nomLibreLevure';
import { YeastStrainDetails } from '../YeastStrainDetails';
import { YeastBeerTargetPanel } from '../YeastBeerTargetPanel';
import { MaLevure } from './MaLevure';
import { apiLevure } from './domaine';
import { FournisseurRecherche, specDeLevure, useRechercheDonnee, type Recherche } from './useRechercheDonnee';
import type { YeastTechnicalFact } from '../../../functions/src/yeastTechnicalFacts';
import { Chercher } from './Chercher';
import { Comparer } from './Comparer';
import { Suggerer } from './Suggerer';
import type { PropsVue, VueLevure } from './props';
import './etapeLevure.css';

const VUES: ReadonlyArray<{ id: VueLevure; libelle: string }> = [
  { id: 'ma-levure', libelle: 'Ma levure' }, { id: 'chercher', libelle: 'Chercher' },
  { id: 'comparer', libelle: 'Comparer' }, { id: 'suggerer', libelle: 'Suggérer' },
];
type RepliId = 'stock' | 'produit' | 'fiche' | 'dose' | 'objectifs' | 'sources' | 'atelier';
const identite = (y: TrialRecipe['yeast']) => JSON.stringify([y.name ?? '', y.hopIndexId ?? '', y.stockItemRef ?? '']);
const champsDuChoix = (r: TrialRecipe): YeastChoiceFields => structuredClone({
  yeast: r.yeast, yeastDesign: r.yeastDesign, yeastGuide: r.yeastGuide, hopPredictionIds: r.hopPredictionIds, hopMatrixId: r.hopMatrixId, hopTrialId: r.hopTrialId,
});

/** Un repli : son contenu n'est monté qu'à l'ouverture (les composants d'origine sont lourds), l'ouverture est pilotée par la coque. */
function Repli({ id, titre, resume, ouvert, onOuvre, children }: {
  id: RepliId; titre: string; resume?: string; ouvert: boolean; onOuvre: (o: boolean) => void; children: ReactNode;
}) {
  return <details className="lv-repli" data-repli={id} open={ouvert} onToggle={e => onOuvre(e.currentTarget.open)}>
    <summary><span><b>{titre}</b>{resume && <small>{resume}</small>}</span><ChevronDown size={14} aria-hidden="true" /></summary>
    {ouvert && <div className="lv-repli-corps">{children}</div>}
  </details>;
}

export interface PropsEtapeLevure {
  recipe: TrialRecipe;
  vue: VueLevure; onVue: (vue: VueLevure) => void;
  comparees: string[]; onComparees: (ids: string[]) => void;
  /** Choisir une levure du catalogue : le wizard applique (applyCatalogueYeast, dose recalculée, annulation) et la coque revient sur Ma levure. */
  onChoisir: (levure: YeastReference) => void;
  /** Écrit la recette (applyYeastChoice du wizard). */
  onChange: (next: TrialRecipe, intent?: YeastChoiceIntent) => TrialRecipe | void;
  onNavigate?: (destination: 'identite' | 'fermentescibles' | 'houblons' | 'paliers' | 'eau') => void;
  stockItems: StockItem[]; onStock: (item: StockItem) => void; onRetirer: () => void;
  yeastChange?: YeastChoiceChange; onYeastChange: (change?: YeastChoiceChange) => void;
  /** La quantité est refusée (zéro, négative, unité) : le wizard ramène ici, le repli « Dose » s'ouvre sur le champ à corriger. */
  doseInvalide?: boolean;
  /** Les éditeurs du wizard (identité : stock et saisie libre ; fiche ; recherche IA ; quantité), montés dans les replis. */
  identityEditor: ReactNode; factsEditor: ReactNode; aiEditor: ReactNode; quantityEditor: ReactNode;
  /** L'ancienne étape entière, pour l'essai de conduite et le reste (monté à l'ouverture ; `cible` : une levure à examiner). */
  atelier: (cible?: string) => ReactNode;
  /** Retenir dans la recette un fait trouvé par la recherche (« à confirmer » → retenu) : sa levure seule ; faux : refusé. */
  onRetenir?: (fait: YeastTechnicalFact) => boolean | void;
  /** La recherche IA d'une fiche (`lookupYeastSheet` par défaut) ; les tests injectent la leur : Gemini n'est jamais appelé en test. */
  recherche?: Recherche;
}

/**
 * L'alcool visé, repère de Chercher (« ≈ 7 % · ta bière ») : la cible de la recette quand elle est saisie ; sinon l'alcool que la
 * recette annonce avec sa levure, le milieu de la plage de Ma levure (OG et atténuation, `evaluateYeastRecipeDesign`, la même
 * lecture que « ≈ 6,9–7,2 % vol »). Jamais 0 : sans l'un ni l'autre, rien.
 */
export function abvViseDe(recipe: TrialRecipe, refs: YeastReference[]): number | undefined {
  if (typeof recipe.abvTarget === 'number' && Number.isFinite(recipe.abvTarget) && recipe.abvTarget > 0) return recipe.abvTarget;
  try {
    const range = evaluateYeastRecipeDesign(recipe, createYeastRecipeDraft(recipe, refs), refs).abv.range;
    return range ? Math.round(((range.min + range.max) / 2) * 10) / 10 : undefined;
  } catch { return undefined; }
}

export function EtapeLevure(p: PropsEtapeLevure) {
  const { recipe, vue, onVue } = p;
  const supply = useYeastSupply();
  const saved = useStorageValue(StorageService.getHopKnowledge);
  const refs = useMemo(() => yeastReferences(saved), [saved]);
  const levure = useMemo(() => recipe.yeast.hopIndexId ? refs.find(r => r.id === recipe.yeast.hopIndexId) : undefined, [refs, recipe.yeast.hopIndexId]);
  const choisie = !!recipe.yeast.name?.trim();
  const [ouverts, setOuverts] = useState<Partial<Record<RepliId, boolean>>>({});
  const ouvre = (id: RepliId, o = true) => setOuverts(s => ({ ...s, [id]: o }));
  // Le texte tapé sans résultat : « Mon stock ou saisie libre » s'ouvre sur la saisie hors catalogue, ce nom dedans.
  const [nomLibre, setNomLibre] = useState<string>();
  /** Un lien de la conduite de base (« Corriger la fiche », « Objectifs ») : le repli s'ouvre et vient dans l'écran. */
  const vaAu = (id: RepliId) => { ouvre(id); requestAnimationFrame(() => racine.current?.querySelector(`[data-repli="${id}"]`)?.scrollIntoView?.({ block: 'start' })); };
  const cible: string | undefined = undefined;
  const racine = useRef<HTMLDivElement>(null);
  // « ⌕ » LANCE la recherche, sur la vue en cours (maquette l5b : « recherche… · 3/20 » dans la cellule) ; le résultat reste « à confirmer ».
  const crochet = useRechercheDonnee({ lookup: p.recherche ?? (import.meta.env.DEV ? (window as unknown as { __lvRechercheSimulee?: Recherche }).__lvRechercheSimulee : undefined), onRetenir: (id, fait) => id === (levure?.id ?? 'recette') ? p.onRetenir?.(fait) : false });
  useEffect(() => { if (p.doseInvalide) ouvre('dose'); }, [p.doseInvalide]);

  // Le dernier changement de levure (annulable) : le wizard le démarre avant le choix ; la coque le complète une fois la levure rendue.
  const change = p.yeastChange;
  useEffect(() => {
    if (!change || change.to) return;
    if (identite(recipe.yeast) !== identite(change.from.yeast)) p.onYeastChange({ ...change, to: champsDuChoix(recipe) });
    else if (Date.now() - (change.startedAt ?? 0) > 3000) p.onYeastChange(undefined);
  }, [change, recipe]);
  const annulable = !!change?.to && identite(recipe.yeast) === identite(change.to.yeast);
  const annuler = () => {
    if (!change?.to || !annulable) return;
    const maintenant = champsDuChoix(recipe);
    const retablie = { ...recipe, ...structuredClone(change.from), yeast: keepIndependentPitchingWort(structuredClone(change.from.yeast), recipe.yeast) };
    p.onChange(retablie, 'restore-selection');
    p.onYeastChange({ source: 'undo', from: maintenant, to: champsDuChoix(retablie) });
  };

  // « En stock chez moi » (Chercher) : les levures du stock, reliées au catalogue par leur fiche (s6) ou par le produit de leur lot.
  const stockIds = useMemo(() => p.stockItems
    .filter(i => i.category.toLocaleLowerCase('fr') === 'levure' && i.currentStock > 0)
    .map(i => i.fiche?.id ?? supply.products.find(x => x.id === i.yeastLot?.productId)?.referenceId)
    .filter((id): id is string => !!id), [p.stockItems, supply]);
  const abvVise = useMemo(() => abvViseDe(recipe, refs), [recipe, refs]);
  const primaire = (recipe.fermentation ?? []).find(f => f.kind === 'primaire') ?? (recipe.fermentation ?? [])[0];
  const style = inferYeastRecipeStyle(recipe);
  const props: PropsVue = {
    base: levure,
    reperes: { temperatureC: Number.isFinite(primaire?.tempC) ? primaire!.tempC : undefined, volumeL: recipe.volumeL, abvVise, ogVisee: recipe.ogTarget ?? undefined, styleId: style === 'unknown' ? undefined : style },
    onChoisir: l => { p.onChoisir(l); onVue('ma-levure'); },
    comparees: p.comparees, onComparees: p.onComparees, onVue,
    // Toucher « ⌕ » : la recherche IA existante part, comptée au plafond du jour ; la vue en cours reste à l'écran.
    onChercherDonnee: (l, axe) => crochet.chercher(l, axe, levure && l.id === levure.id ? recipe.yeast : undefined),
  };
  // Une levure du stock ou une saisie libre n'a pas de fiche du catalogue : la recherche part de la levure de la recette.
  const maLevureRef = levure ?? ({ id: 'recette', name: recipe.yeast.name, form: recipe.yeast.form } as YeastReference);
  const chercherDeMaLevure = (axe: string) => crochet.chercher(maLevureRef, axe, recipe.yeast);

  const onStock = (item: StockItem) => { p.onStock(item); onVue('ma-levure'); };
  // Les levures proposées sous « Changer de levure » : vendues en CH · FR · DE, les plus proches de la recette (API de d1, jamais un filtre imposé).
  const proposees = useMemo(() => {
    if (!apiLevure) return [];
    try {
      return apiLevure.chercher('', {}, props.reperes).liste.filter(l => l.id !== levure?.id && l.id !== (change?.from.yeast.hopIndexId) && apiLevure!.disponibilite(l).rang === 'ici').slice(0, 2);
    } catch { return []; }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levure?.id, props.reperes.temperatureC, props.reperes.abvVise, props.reperes.styleId, change?.from.yeast.hopIndexId]);
  return <FournisseurRecherche crochet={crochet}><div className="lv-etape" ref={racine} data-lv="etape" data-vue={vue}>
    <div className="lv-seg" role="tablist" aria-label="Vues de l’étape Levure">
      {VUES.map(v => <button key={v.id} type="button" role="tab" id={`lv-tab-${v.id}`} aria-selected={vue === v.id} aria-controls={`lv-vue-${v.id}`}
        data-vue-id={v.id} className="lv-seg-bt" onClick={() => onVue(v.id)}>{v.libelle}{v.id === 'comparer' && p.comparees.length > 0 && <span className="lv-seg-n"> ({p.comparees.length})</span>}</button>)}
    </div>
    {annulable && !ouverts.atelier && <p className="lv-annule" role="status" data-lv="annuler">
      <span>{change!.source === 'undo' ? `${change!.to!.yeast.name || 'Brouillon sans levure'} rétablie` : change!.from.yeast.name ? `Depuis ${change!.from.yeast.name}` : 'Levure choisie'} · non enregistré</span>
      <button type="button" className="lv-lien" onClick={annuler}><Undo2 size={13} aria-hidden="true" /> {change!.source === 'undo' ? `Rétablir ${change!.from.yeast.name || 'sans levure'}` : 'Annuler le changement'}</button></p>}

    <div role="tabpanel" id={`lv-vue-${vue}`} aria-labelledby={`lv-tab-${vue}`}>
      {vue === 'ma-levure' && <>
        <MaLevure recipe={recipe} refs={refs} supply={supply} levure={levure} onConduite={next => p.onChange(next, 'conduct')}
          onChercherDonnee={chercherDeMaLevure} onRetirer={p.onRetirer}
          stock={p.stockItems} onStock={onStock} onHorsCatalogue={texte => { setNomLibre(texte?.trim() || undefined); ouvre('stock'); }} proposees={proposees} onProposee={l => props.onChoisir(l)}
          reperes={props.reperes} stockIds={stockIds} conduiteCachee={!!ouverts.atelier}
          onComparer={() => onVue('comparer')} onFiche={() => vaAu('fiche')} onObjectifs={() => vaAu('objectifs')} onNavigate={p.onNavigate}
          precedente={change?.from.yeast.name && change.from.yeast.name !== recipe.yeast.name ? change.from.yeast.name : undefined}
          onPrecedente={() => { const avant = refs.find(r => r.id === change?.from.yeast.hopIndexId); if (avant) props.onChoisir!(avant); }} />
        <div className="lv-replis" data-lv="replis">
          <Repli id="stock" titre="Mon stock ou saisie libre" resume="une levure de l’atelier, ou hors catalogue" ouvert={!!ouverts.stock} onOuvre={o => ouvre('stock', o)}>
            <NomLibreInitial.Provider key={nomLibre ?? ''} value={nomLibre}>{p.identityEditor}</NomLibreInitial.Provider></Repli>
          {choisie && <Repli id="produit" titre="Produit exact et offres" resume="facultatif · vendeurs, « Corriger la fiche produit »" ouvert={!!ouverts.produit} onOuvre={o => ouvre('produit', o)}>
            <YeastPitchingPanel part="supply" recipe={recipe} onChange={next => p.onChange(next, 'pitching')} /></Repli>}
          {choisie && <Repli id="fiche" titre="Fiche : compléter, corriger, chercher avec l’IA" resume="valeurs typées, sources" ouvert={!!ouverts.fiche} onOuvre={o => ouvre('fiche', o)}>
            {p.aiEditor}{p.factsEditor}</Repli>}
          {choisie && <Repli id="dose" titre="Dose, ensemencement et starter" resume="quantité prévue, moût à ensemencer, préparation" ouvert={!!ouverts.dose} onOuvre={o => ouvre('dose', o)}>
            <YeastPitchingPanel part="pitching" recipe={recipe} onChange={next => p.onChange(next, 'pitching')} quantityEditor={p.quantityEditor} /></Repli>}
          {choisie && <Repli id="objectifs" titre="Objectifs" resume="cible de la bière" ouvert={!!ouverts.objectifs} onOuvre={o => ouvre('objectifs', o)}>
            <YeastBeerTargetPanel recipe={recipe} refs={refs} onChange={next => p.onChange(next, 'conduct')} onNavigate={p.onNavigate} /></Repli>}
          {choisie && <Repli id="sources" titre="Repères et sources" resume="ce que la fiche du catalogue dit" ouvert={!!ouverts.sources} onOuvre={o => ouvre('sources', o)}>
            <YeastStrainDetails information={yeastStrainInformation(levure, recipe.yeast.form)} /></Repli>}
          <Repli id="atelier" titre="Atelier complet" resume="essai de conduite, profil, comparaison des offres, fiche partagée" ouvert={!!ouverts.atelier} onOuvre={o => ouvre('atelier', o)}>
            <Suspense fallback={<p role="status" className="lv-note">Chargement de l’atelier…</p>}>{p.atelier(cible)}</Suspense></Repli>
        </div>
      </>}
      {vue === 'chercher' && <Chercher {...props} stockIds={stockIds} />}
      {vue === 'comparer' && <Comparer {...props} recette={recipe} supply={supply} />}
      {vue === 'suggerer' && <Suggerer {...props} />}
    </div>
  </div></FournisseurRecherche>;
}
