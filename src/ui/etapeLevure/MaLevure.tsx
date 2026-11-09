// « Ma levure » (maquette l5b, choisie le 09.11) : la ligne de la levure et sa dose en plage de sachets, la bande FG · °C · floculation,
// les effets de fermentation en jauges (là où la source donne un niveau, « ⌕ non documenté » sinon), le champ « Changer de levure » et
// ses puces, puis ta conduite (graphe de l'app, plage de la levure en bande, + entre les paliers, × sur le palier touché).
// Les données viennent de la recette, de la fiche du catalogue et de yeastPitching.ts ; rien n'est inventé : l'inconnu se dit « ? ».
import { useMemo } from 'react';
import { FlaskConical, History, Package, Search, X } from 'lucide-react';
import type { StockItem } from '../../types';
import type { YeastSupply } from '../../../functions/src/yeastSupplySchema';
import type { TrialRecipe } from '../../domain/hopIndex/trials';
import type { YeastReference } from '../../domain/yeastReferences';
import { createYeastRecipeDraft, evaluateYeastRecipeDesign } from '../../domain/yeastRecipeDesign';
import { Conduite } from './Conduite';
import { CelluleRecherche, useEtatRecherche } from './useRechercheDonnee';
import { doseDeLaLevure } from './dose';
import { AXES_EFFETS, NIVEAUX, couleurDeLAxe, lignesEffets, ligneFloculation, type LigneEffet } from './effets';
import './etapeLevure.css';

/** Sans fiche du catalogue (stock, saisie libre) : chaque effet est non documenté, et le dit. */
const EFFETS_INCONNUS: LigneEffet[] = AXES_EFFETS.map(({ id, libelle }) => ({ id, libelle, couleur: couleurDeLAxe(id), genre: 'inconnu' as const }));
const dec = (n: number, d = 0) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const plage = (r: { min: number; max: number } | null | undefined, d: number) => r ? (r.min === r.max ? dec(r.min, d) : `${dec(r.min, d)}–${dec(r.max, d)}`) : null;
/** Position (0–100 %) d'une valeur sur une piste. */
const pct = (v: number, min: number, max: number) => Math.max(0, Math.min(100, (v - min) / (max - min) * 100));

function Jauge({ niveau, couleur }: { niveau: 'faible' | 'moyen' | 'eleve'; couleur: string }) {
  const rang = NIVEAUX.findIndex(n => n.id === niveau);
  return <span className="lv-jo" role="img" aria-label={`niveau ${NIVEAUX[rang].mot}`} data-niveau={niveau}>
    {[0, 1, 2].map(i => <b key={i} style={i <= rang ? { background: couleur } : undefined} />)}</span>;
}

function Effet({ ligne, levureId, onChercher }: { ligne: LigneEffet; levureId: string; onChercher: (axe: string) => void }) {
  const { etat } = useEtatRecherche(levureId, ligne.id);
  return <>
    <span className="lv-el"><i style={{ background: ligne.couleur }} aria-hidden="true" />{ligne.libelle}</span>
    <span className="lv-ev" data-genre={ligne.genre} data-axe={ligne.id}>
      {ligne.genre === 'jauge' && <><Jauge niveau={ligne.niveau} couleur={ligne.couleur} /><em title={ligne.source}>{NIVEAUX.find(n => n.id === ligne.niveau)!.mot}</em></>}
      {ligne.genre === 'mot' && <span title={ligne.source}>{ligne.texte}{ligne.estime && <em> · estimé</em>}</span>}
      {ligne.genre === 'nombre' && <span title={ligne.source}><b className="lv-m">{ligne.texte}</b> <em>· {ligne.nature}</em></span>}
      {etat && ligne.genre === 'inconnu' && <CelluleRecherche levureId={levureId} axe={ligne.id} />}
      {!etat && ligne.genre === 'inconnu' && <button type="button" className="lv-ch" onClick={() => onChercher(ligne.id)}
        aria-label={`${ligne.libelle} non documenté : chercher la donnée`}><Search size={12} aria-hidden="true" /> non documenté</button>}
    </span>
  </>;
}

export function MaLevure({ recipe, refs, supply, levure, onConduite, onChercherDonnee, onChanger, onRetirer, stock, onStock, onHorsCatalogue, nomsPlage, precedente, onPrecedente, proposees = [], onProposee }: {
  /** Levures proposées (vendues en CH · FR · DE, API de d1, la plus proche de la recette d'abord) : puces « ⬚ Nottingham » de la maquette. */
  proposees?: YeastReference[]; onProposee?: (levure: YeastReference) => void;
  /** La levure d'avant le dernier changement (puce ↺ : la précédente), quand il y en a une. */
  precedente?: string; onPrecedente?: () => void;
  recipe: TrialRecipe; refs: YeastReference[]; supply: YeastSupply;
  /** La fiche du catalogue de la levure de la recette ; absente pour une levure du stock ou une saisie libre. */
  levure?: YeastReference;
  onConduite: (next: TrialRecipe) => TrialRecipe | void;
  onChercherDonnee: (axe: string) => void;
  onChanger: () => void; onRetirer: () => void;
  stock: StockItem[]; onStock: (item: StockItem) => void; onHorsCatalogue: () => void;
  nomsPlage?: string;
}) {
  const choisie = !!recipe.yeast.name?.trim();
  const draft = useMemo(() => createYeastRecipeDraft(recipe, refs), [recipe, refs]);
  const evaluation = useMemo(() => evaluateYeastRecipeDesign(recipe, draft, refs), [recipe, draft, refs]);
  const { conseil } = useMemo(() => doseDeLaLevure(recipe, supply), [recipe, supply]);
  const effets = useMemo(() => levure ? lignesEffets(levure) : [], [levure]);
  const floc = levure ? ligneFloculation(levure) : undefined;
  const { etat: floculationEtat } = useEtatRecherche(levure?.id ?? 'recette', 'clarte');
  const temperature = evaluation.projection.dossier.temperature;
  const tFiche = temperature?.qualifier === 'range' ? temperature.range : undefined;
  const primaire = (recipe.fermentation ?? []).find(p => p.kind === 'primaire') ?? (recipe.fermentation ?? [])[0];
  const tConduite = Number.isFinite(primaire?.tempC) ? primaire!.tempC! : undefined;
  const fg = evaluation.fg.range, abv = evaluation.abv.range;
  const enStock = stock.filter(i => i.category.toLocaleLowerCase('fr') === 'levure' && i.currentStock > 0)
    .sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || a.name.localeCompare(b.name, 'fr')).slice(0, 3);

  // La dose : celle qui est prévue, sinon la plage de sachets du fabricant au volume de la recette (jamais son milieu, jamais 0).
  const prevu = Number.isFinite(recipe.yeast.qty) && (recipe.yeast.qty ?? 0) > 0 ? recipe.yeast : undefined;
  const sachets = conseil.packs;
  const doseTexte = prevu ? `${dec(prevu.qty!, 1)}` : sachets ? plage(sachets, 0)! : '?';
  const doseUnite = prevu ? prevu.unit ?? 'unité ?' : sachets ? (sachets.max > 1 ? 'sachets' : 'sachet') : 'dose à saisir';
  const grammes = conseil.range && conseil.unit === 'g' ? `${plage(conseil.range, 0)} g` : undefined;

  return <div className="lv-ma" data-lv="ma-levure" data-yeast-state={choisie ? 'chosen' : 'empty'}>
    {choisie && <div className="lv-bloc" data-booster="ligne-levure">
      <div className="lv-row">
        <span className="lv-pic" aria-hidden="true"><FlaskConical size={20} /></span>
        <span className={`lv-nom${recipe.yeast.name.length > 22 ? ' lv-long' : ''}`}>{recipe.yeast.name}</span>
        <span className="lv-dose" data-lv="dose" title={sachets && !prevu ? 'Plage fabricant au volume de la recette, à choisir dans « Dose, ensemencement et starter »' : undefined}>
          <b>{doseTexte}</b><span>{doseUnite}</span></span>
        <button type="button" className="lv-x" aria-label={`Retirer ${recipe.yeast.name} de la recette`} onClick={onRetirer}><X size={16} aria-hidden="true" /></button>
        <span className="lv-sub">
          <span>{[recipe.yeast.form, recipe.yeast.lab || levure?.catalogue?.manufacturer].filter(Boolean).join(' · ') || 'forme et laboratoire ?'}</span>
          {grammes && <span className="lv-m">{grammes}</span>}
          {sachets && <span className="lv-mini" aria-hidden="true"><i style={{ left: '8%', right: '8%' }} /></span>}
        </span>
      </div>
      <div className="lv-bande">
        <div className="lv-cel" data-cel="fg">
          <span className="lv-ct">FG</span>
          <span className="lv-cv">{plage(fg, 3) ?? '?'}</span>
          {abv && <span className="lv-ab">≈ {plage(abv, 1)} % vol</span>}
          {fg && <span className="lv-tr" aria-hidden="true"><i className="lv-hach" style={{ left: `${pct(fg.min, 1.004, 1.026)}%`, width: `${Math.max(4, pct(fg.max, 1.004, 1.026) - pct(fg.min, 1.004, 1.026))}%` }} /></span>}
        </div>
        <div className="lv-cel" data-cel="temperature">
          <span className="lv-ct">fiche · conduite</span>
          <span className="lv-cv">{tFiche ? plage(tFiche, 0) : '?'}{tConduite !== undefined && <small> · {dec(tConduite)} °C</small>}</span>
          <span className="lv-tr lv-tgr" aria-hidden="true">
            {tFiche && <i className="lv-hach" style={{ left: `${pct(tFiche.min, 5, 35)}%`, width: `${pct(tFiche.max, 5, 35) - pct(tFiche.min, 5, 35)}%` }} />}
            {tConduite !== undefined && <u className="lv-tk" style={{ left: `${pct(tConduite, 5, 35)}%` }} />}
          </span>
        </div>
        <div className="lv-cel" data-cel="floculation">
          <span className="lv-ct">floculation</span>
          {floc?.genre === 'jauge' && <><span className="lv-cv"><small>{NIVEAUX.find(n => n.id === floc.niveau)!.mot}</small></span><Jauge niveau={floc.niveau} couleur="#8C8C8C" /></>}
          {floc?.genre === 'mot' && <span className="lv-cv"><small>{floc.texte}</small></span>}
          {(!floc || floc.genre === 'inconnu') && !floculationEtat && <button type="button" className="lv-ch" onClick={() => onChercherDonnee('clarte')}
            aria-label="Floculation non documentée : chercher la donnée"><Search size={12} aria-hidden="true" /> à chercher</button>}
        </div>
      </div>
      {(!floc || floc.genre === 'inconnu') && floculationEtat && <div className="lv-cel-pleine" data-cel="floculation-recherche"><CelluleRecherche levureId={levure?.id ?? 'recette'} axe="clarte" libelle="floculation" /></div>}
      <div className="lv-eff2" aria-label="Effets de fermentation">
        {(effets.length ? effets : EFFETS_INCONNUS).map(l => <Effet key={l.id} ligne={l} levureId={levure?.id ?? 'recette'} onChercher={onChercherDonnee} />)}
      </div>
    </div>}

    {!choisie && <div className="lv-vide" data-lv="sans-levure">
      <p><b>Levure · choisir</b></p>
      <p className="lv-note">Aucune levure dans la recette : cherche-la par son nom, son code, son fabricant ou son arôme, ou prends-en une de ton stock.</p>
    </div>}

    <div className="lv-ajout">
      <button type="button" className="lv-champ" onClick={onChanger} data-lv="changer"><Search size={16} aria-hidden="true" />{choisie ? 'Changer de levure' : 'Chercher une levure'}</button>
      <div className="lv-puces">
        {proposees.map(l => <button key={l.id} type="button" className="lv-puce" data-propose={l.id} onClick={() => onProposee?.(l)}><Package size={14} aria-hidden="true" />{l.name.replace(/\s*\(.*\)\s*$/, '').replace(/^(SafAle|SafLager|LalBrew|Wyeast|WLP|Lallemand Brewing ·)\s+/i, '')}</button>)}
        {enStock.map(item => <button key={item.ref} type="button" className="lv-puce" onClick={() => onStock(item)}><Package size={14} aria-hidden="true" />{item.name}</button>)}
        {precedente && onPrecedente && <button type="button" className="lv-puce lv-hab" onClick={onPrecedente}><History size={14} aria-hidden="true" />{precedente}</button>}
        <button type="button" className="lv-puce lv-hc" onClick={onHorsCatalogue}>Hors catalogue</button>
      </div>
    </div>

    <Conduite recipe={recipe} refs={refs} onChange={onConduite} nomLevure={nomsPlage ?? ((recipe.yeast.name || '').replace(/\s*\(.*\)\s*$/, '').replace(/^(SafAle|SafLager|LalBrew|Wyeast|WLP)\s+/i, '') || undefined)} />
  </div>;
}

