// « Ma levure » (maquette l5b, choisie le 09.11) : la ligne de la levure et sa dose en plage de sachets, la bande FG · °C · floculation,
// les effets de fermentation en jauges (là où la source donne un niveau, « ⌕ non documenté » sinon), le champ « Changer de levure » et
// ses puces, puis la conduite de base de l'app (YeastRecipePlan : « Conduite · température × jours », paliers, poignées ↕ et ↔, essai).
// Les données viennent de la recette, de la fiche du catalogue et de yeastPitching.ts ; rien n'est inventé : l'inconnu se dit « ? ».
//
// Retour du brasseur (09.11) : (1) « la recherche de base doit se faire sur le premier écran, comme pour malt et sucre, pas de renvoi » :
// « Changer de levure » est un vrai champ (modèle : `fermentescibles/Ajout.tsx`), ses résultats en tuiles juste dessous ; la recherche
// avancée reste l'onglet « Chercher », que le brasseur ouvre lui-même ; (2) « la conduite de palier fonctionne infiniment mieux sur celle
// de base » : la nouvelle conduite (`Conduite.tsx`, non montée, conservée) cède la place à la station de l'app.
import { useDeferredValue, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FlaskConical, History, Package, Search, X } from 'lucide-react';
import type { StockItem } from '../../types';
import type { YeastSupply } from '../../../functions/src/yeastSupplySchema';
import type { TrialRecipe } from '../../domain/hopIndex/trials';
import type { YeastReference } from '../../domain/yeastReferences';
import type { ReperesRecette, ResultatRecherche } from '../../domain/levure/contrat';
import { catalogueMatches } from '../../domain/yeastCatalogue';
import { relierAuCatalogue } from '../../domain/levure/relier';
import { createYeastRecipeDraft, evaluateYeastRecipeDesign } from '../../domain/yeastRecipeDesign';
import { Units } from '../../services/units';
import { Input } from '../Input';
import { YeastRecipePlan } from '../YeastRecipePlan';
import { CelluleRecherche, useEtatRecherche } from './useRechercheDonnee';
import { apiLevure } from './domaine';
import { doseDeLaLevure } from './dose';
import { AXES_EFFETS, NIVEAUX, couleurDeLAxe, lignesEffets, ligneFloculation, type LigneEffet } from './effets';
import '../yeast-choice.css';
import './etapeLevure.css';

/** Sans fiche du catalogue (stock, saisie libre) : chaque effet est non documenté, et le dit. */
const EFFETS_INCONNUS: LigneEffet[] = AXES_EFFETS.map(({ id, libelle }) => ({ id, libelle, couleur: couleurDeLAxe(id), genre: 'inconnu' as const }));
const dec = (n: number, d = 0) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });
const plage = (r: { min: number; max: number } | null | undefined, d: number) => r ? (r.min === r.max ? dec(r.min, d) : `${dec(r.min, d)}–${dec(r.max, d)}`) : null;
/** Position (0–100 %) d'une valeur sur une piste. */
const pct = (v: number, min: number, max: number) => Math.max(0, Math.min(100, (v - min) / (max - min) * 100));
/** Minuscules sans accents : « Saflager » et « safläger » se retrouvent. */
const nu = (t: string) => t.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim();
/** Le nom court d'une puce : sans la parenthèse ni la marque en tête. */
const nomCourt = (nom: string) => nom.replace(/\s*\(.*\)\s*$/, '').replace(/^(SafAle|SafLager|LalBrew|Wyeast|WLP|Lallemand Brewing ·)\s+/i, '');
/**
 * Le nom de la carte : sans la marque de gamme en tête quand le fabricant est dit dessous et que le nom serait long (« LalBrew Verdant IPA » → « Verdant IPA » ;
 * « SafAle US-05 » reste entier, c'est son nom d'usage). Le nom complet reste dans le titre et le libellé du bouton ×.
 */
export const nomDeCarte = (nom: string, fabricantDit: boolean): string => {
  if (!fabricantDit || nom.length <= 18) return nom;
  const court = nom.replace(/^(LalBrew|SafAle|SafLager|SafSpirit|Wyeast|White Labs)\s+/i, '').trim();
  return court || nom;
};
/** Le fabricant, dit dessous : « Lallemand Brewing » → « Lallemand » (une ligne à 390 px, la dose et la jauge sont à droite). */
const fabricantCourt = (f: string): string => f.replace(/\s+Brewing$/i, '');
/** Le nom d'une tuile : sans le fabricant en tête (il est dit dessous) ni la parenthèse finale. */
const nomDeTuile = (l: YeastReference) => {
  const f = l.catalogue?.manufacturer;
  let nom = l.name.replace(/\s*\([^)]*\)\s*$/, '');
  if (f && nu(nom).startsWith(nu(f))) nom = nom.slice(f.length).replace(/^\s*[·:-]\s*/, '') || nom;
  return nom;
};
/** Combien de tuiles au plus sous le champ (un téléphone ne fait pas défiler mille levures) ; le total est dit. */
const MAX_TUILES = 8;

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

/** Une tuile de résultat : une levure du stock (article) ou du catalogue, ou la saisie libre quand rien ne correspond. */
type Tuile =
  | { genre: 'stock'; cle: string; nom: string; sous: string; item: StockItem }
  | { genre: 'catalogue'; cle: string; nom: string; sous: string; levure: YeastReference; enStock: boolean }
  | { genre: 'libre'; cle: string; nom: string; sous: string };

/**
 * Le champ « Changer de levure » : on tape, les levures qui correspondent (nom, fabricant, code) remplacent les puces, juste dessous ; celles du
 * stock d'abord. Flèches, Entrée choisit, Échap vide (comme le champ d'ajout de Malts/sucres). Rien ne renvoie ailleurs : la recherche avancée est
 * l'onglet « Chercher » du segment. Sans résultat, « Mon stock ou saisie libre » s'offre avec le texte tapé.
 */
function ChampLevure({ choisie, reperes, stock, stockIds, fiches, enStock, proposees, precedente, onPrecedente, onProposee, onStock, onHorsCatalogue, libre }: {
  choisie: boolean; reperes: ReperesRecette; stock: StockItem[]; stockIds: ReadonlySet<string>; enStock: StockItem[];
  /** La fiche du catalogue de chaque article du stock (par sa référence) : celle de l'article, sinon celle à laquelle son nom se relie de façon sûre. Une levure, une tuile. */
  fiches: ReadonlyMap<string, string>;
  proposees: YeastReference[]; precedente?: string; onPrecedente?: () => void;
  onProposee?: (levure: YeastReference) => void; onStock: (item: StockItem) => void; onHorsCatalogue: (texte?: string) => void;
  /** La saisie libre ouverte (« Mon stock ou saisie libre »), posée juste sous le champ : le geste n° 1 du 09.11 aboutit sous les yeux. */
  libre?: ReactNode;
}) {
  const [valeur, setValeur] = useState('');
  const [cible, setCible] = useState(0);
  const [flechee, setFlechee] = useState(false);
  const texte = valeur.trim();
  const t = useDeferredValue(texte);
  const rangee = useRef<HTMLDivElement>(null);
  const dernierClic = useRef(0);

  // Les levures du stock dont le nom ou le fabricant contient le texte, puis le catalogue (API du domaine, sans filtre imposé).
  const { tuiles, total } = useMemo<{ tuiles: Tuile[]; total: number }>(() => {
    if (!t) return { tuiles: [], total: 0 };
    const q = nu(t);
    const duStock = stock.filter(i => i.category.toLocaleLowerCase('fr') === 'levure' && i.currentStock > 0 && nu(`${i.name} ${i.supplier ?? ''}`).includes(q))
      .sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || a.name.localeCompare(b.name, 'fr'));
    const dejaVues = new Set(duStock.map(i => fiches.get(i.ref)).filter((id): id is string => !!id));
    let catalogue: YeastReference[] = [];
    let total = 0;
    try {
      // Quand le texte désigne une levure (`tapee`), l'API rend tout le catalogue rangé par proximité de celle-ci : ici, on ne garde que ce qui correspond au texte
      // (nom, fabricant, code, arôme), la levure désignée en tête.
      const r = apiLevure?.chercher(t, {}, reperes) as (ResultatRecherche & { tapee?: YeastReference }) | undefined;
      catalogue = [...(r?.tapee ? [r.tapee] : []), ...(r?.liste ?? [])].filter(l => !dejaVues.has(l.id) && catalogueMatches(l, t));
      total = catalogue.length + duStock.length;
    } catch { /* le domaine absent : seul le stock répond */ }
    // Les levures de mon stock devant, l'ordre de l'API derrière (tri stable).
    const rang = (l: YeastReference) => (stockIds.has(l.id) ? 0 : 1);
    catalogue = catalogue.map((l, i) => ({ l, i })).sort((a, b) => rang(a.l) - rang(b.l) || a.i - b.i).map(x => x.l);
    const liste: Tuile[] = [
      ...duStock.map((item): Tuile => ({ genre: 'stock', cle: `s-${item.ref}`, nom: item.name, item, sous: `${Units.format(item.currentStock, item.unit)} en stock` })),
      ...catalogue.map((levure): Tuile => ({
        genre: 'catalogue', cle: `c-${levure.id}`, nom: nomDeTuile(levure), levure, enStock: stockIds.has(levure.id),
        sous: [levure.catalogue?.manufacturer, levure.form, stockIds.has(levure.id) ? 'en stock' : ''].filter(Boolean).join(' · '),
      })),
    ].slice(0, MAX_TUILES);
    if (!liste.length && t.length >= 2) return { tuiles: [{ genre: 'libre', cle: 'libre', nom: `Mon stock ou saisie libre : « ${t} »`, sous: 'rien dans le catalogue ni le stock · saisie libre' }], total: 0 };
    return { tuiles: liste, total };
  }, [t, stock, stockIds, fiches, reperes]);
  const iCible = Math.min(cible, Math.max(0, tuiles.length - 1));
  const enSaisie = !!texte;

  // Les puces du repos : une seule rangée, des puces entières (jamais une puce coupée au bord). Celles qui ne tiennent pas passent à la ligne,
  // hors de la rangée (masquée), et ne prennent plus le focus ; « Hors catalogue » reste toujours visible, à droite.
  useLayoutEffect(() => {
    const r = rangee.current;
    if (!r) return;
    const mesurer = () => {
      const puces = [...r.querySelectorAll<HTMLElement>('.lv-puce')];
      const haut = puces[0]?.getBoundingClientRect().top ?? 0;
      for (const p of puces) {
        const hors = p.getBoundingClientRect().top > haut + 2;
        if (hors) p.setAttribute('data-hors', '1'); else p.removeAttribute('data-hors');
        p.tabIndex = hors ? -1 : 0;
      }
    };
    mesurer();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(mesurer);
    ro.observe(r);
    return () => ro.disconnect();
  }, [enSaisie, proposees, enStock, precedente]);

  const reinit = () => { setValeur(''); setCible(0); setFlechee(false); };
  const choisir = (tu: Tuile) => {
    if (tu.genre === 'stock') onStock(tu.item);
    else if (tu.genre === 'catalogue') onProposee?.(tu.levure);
    else onHorsCatalogue(t);
    reinit();
  };
  // Un double toucher sur une tuile choisirait deux fois : un 2e clic dans les 400 ms est ignoré (le clavier n'est pas concerné).
  const cliquer = (tu: Tuile) => {
    const maintenant = Date.now();
    if (maintenant - dernierClic.current < 400) return;
    dernierClic.current = maintenant;
    choisir(tu);
  };
  const libelle = choisie ? 'Changer de levure' : 'Chercher une levure';

  return <div className="lv-ajout" data-lv="ajout">
    <label className="lv-champ" data-lv="changer">
      <Search size={16} aria-hidden="true" />
      <Input type="text" className="lv-in" placeholder={libelle} enterKeyHint="enter" role="combobox" aria-expanded={enSaisie} aria-controls="lv-resultats" aria-autocomplete="list"
        aria-label={`${libelle} : nom, fabricant ou code`} data-booster="ajout-levure" value={valeur}
        onChange={e => { setValeur(e.target.value); setCible(0); setFlechee(false); }}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); if (tuiles[iCible]) choisir(tuiles[iCible]); }
          else if (e.key === 'Escape') { if (valeur) { e.preventDefault(); e.stopPropagation(); reinit(); } }
          else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const n = tuiles.length;
            if (n) { setFlechee(true); setCible(c => (Math.min(c, n - 1) + (e.key === 'ArrowDown' ? 1 : n - 1)) % n); }
          }
        }} />
      {valeur && <button type="button" className="lv-eff" aria-label="Effacer la recherche" onMouseDown={e => e.preventDefault()} onClick={reinit}><X size={16} aria-hidden="true" /></button>}
    </label>

    {!enSaisie && <div className="lv-puces" ref={rangee} data-role="puces">
      <div className="lv-puces-l">
        {proposees.map(l => <button key={l.id} type="button" className="lv-puce" data-propose={l.id} onClick={() => onProposee?.(l)}><Package size={14} aria-hidden="true" /><span>{nomCourt(l.name)}</span></button>)}
        {enStock.filter(item => !proposees.some(l => l.id === fiches.get(item.ref))).map(item => <button key={item.ref} type="button" className="lv-puce" onClick={() => onStock(item)}><Package size={14} aria-hidden="true" /><span>{item.name}</span></button>)}
        {precedente && onPrecedente && <button type="button" className="lv-puce lv-hab" onClick={onPrecedente}><History size={14} aria-hidden="true" /><span>{precedente}</span></button>}
      </div>
      <button type="button" className="lv-puce lv-hc" onClick={() => onHorsCatalogue()}>Hors catalogue</button>
    </div>}

    {enSaisie && <div className="lv-res" id="lv-resultats" role="listbox" aria-label="Résultats de la recherche" data-lv="resultats" onMouseDown={e => e.preventDefault()}>
      {tuiles.map((tu, k) => {
        const pr = k === iCible && (t.length >= 2 || flechee);
        return <button key={tu.cle} type="button" role="option" aria-selected={pr} className={`lv-tu${pr ? ' lv-prem' : ''}${tu.genre === 'libre' ? ' lv-libre' : ''}`}
          data-resultat={tu.genre === 'catalogue' ? tu.levure.id : tu.genre} data-nom={tu.nom} onClick={() => cliquer(tu)}>
          <span className="lv-tu1">{(tu.genre === 'stock' || (tu.genre === 'catalogue' && tu.enStock)) && <Package size={13} aria-label="en stock" className="lv-st" />}<span className="lv-tun">{tu.nom}</span></span>
          {tu.sous && <span className="lv-tu2">{tu.sous}</span>}
        </button>;
      })}
      {total > tuiles.length && tuiles[0]?.genre !== 'libre' && <p className="lv-plus-n" role="status">{tuiles.length} sur {total.toLocaleString('fr-FR')} · précise la saisie</p>}
    </div>}
    {libre}
  </div>;
}

export function MaLevure({ recipe, refs, supply, levure, onConduite, onChercherDonnee, onRetirer, stock, onStock, onHorsCatalogue, libre, precedente, onPrecedente, proposees = [], onProposee,
  reperes = {}, stockIds, conduiteCachee, onComparer, onFiche, onObjectifs, onNavigate }: {
  /** Levures proposées (vendues en CH · FR · DE, API de d1, la plus proche de la recette d'abord) : puces « ⬚ Nottingham » de la maquette. */
  proposees?: YeastReference[]; onProposee?: (levure: YeastReference) => void;
  /** La levure d'avant le dernier changement (puce ↺ : la précédente), quand il y en a une. */
  precedente?: string; onPrecedente?: () => void;
  recipe: TrialRecipe; refs: YeastReference[]; supply: YeastSupply;
  /** La fiche du catalogue de la levure de la recette ; absente pour une levure du stock ou une saisie libre. */
  levure?: YeastReference;
  /** Écrit la recette (intention « conduct » du wizard) ; peut lever une erreur lisible. */
  onConduite: (next: TrialRecipe) => TrialRecipe | void;
  onChercherDonnee: (axe: string) => void;
  onRetirer: () => void;
  stock: StockItem[]; onStock: (item: StockItem) => void;
  /** « Hors catalogue » ou une saisie sans résultat : ouvre « Mon stock ou saisie libre » (le texte tapé est donné quand il y en a un). */
  onHorsCatalogue: (texte?: string) => void;
  /** La saisie libre ouverte, rendue sous le champ de recherche. */
  libre?: ReactNode;
  /** Repères de la recette pour classer les résultats (jamais un filtre). */
  reperes?: ReperesRecette;
  /** Les levures du stock, reliées au catalogue (ids) : elles passent devant et portent l'icône du stock. */
  stockIds?: readonly string[];
  /** L'atelier complet est ouvert : il porte sa propre conduite, la conduite de base se masque (même état, jamais deux à la fois). */
  conduiteCachee?: boolean;
  /** Les liens de la conduite de base : comparer des souches, corriger la fiche, objectifs, autre étape. */
  onComparer?: () => void; onFiche?: () => void; onObjectifs?: () => void;
  onNavigate?: (destination: 'identite' | 'fermentescibles' | 'houblons' | 'paliers' | 'eau') => void;
}) {
  const choisie = !!recipe.yeast.name?.trim();
  const draft = useMemo(() => createYeastRecipeDraft(recipe, refs), [recipe, refs]);
  const evaluation = useMemo(() => evaluateYeastRecipeDesign(recipe, draft, refs), [recipe, draft, refs]);
  const { conseil, yeast: yeastPrete } = useMemo(() => doseDeLaLevure(recipe, supply, evaluation.projection.og), [recipe, supply, evaluation]);
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
  const idsStock = useMemo(() => new Set(stockIds ?? []), [stockIds]);
  // La fiche du catalogue de chaque levure du stock : sa fiche posée, sinon la correspondance unique et sûre de son nom (voie r4, 09.11).
  const fiches = useMemo(() => new Map(stock.filter(i => i.category.toLocaleLowerCase('fr') === 'levure')
    .flatMap((i): [string, string][] => { const id = i.fiche?.id ?? relierAuCatalogue({ name: i.name, lab: i.yeastLab, strain: i.yeastStrain }, refs)?.id; return id ? [[i.ref, id]] : []; })), [stock, refs]);

  // La dose : celle qui est prévue, sinon la plage de sachets du fabricant au volume de la recette (jamais son milieu, jamais 0).
  const prevu = Number.isFinite(recipe.yeast.qty) && (recipe.yeast.qty ?? 0) > 0 ? recipe.yeast : undefined;
  const sachets = conseil.packs;
  const doseTexte = prevu ? `${dec(prevu.qty!, 1)}` : sachets ? plage(sachets, 0)! : '?';
  const doseUnite = prevu ? prevu.unit ?? 'unité ?' : sachets ? (sachets.max > 1 ? 'sachets' : 'sachet') : 'dose à saisir';
  const grammes = conseil.range && conseil.unit === 'g' ? `${plage(conseil.range, 0)} g` : undefined;

  // La conduite de base : montée comme dans YeastRecipeChoice (même clé : un autre choix de levure la remonte à neuf), sans objectifs (`goalSlot={null}` :
  // ils ont leur repli). Comme là-bas, elle existe dès qu'une levure est choisie ou que des paliers sont déjà dans la recette.
  const avecConduite = choisie || !!recipe.fermentation?.length;
  const conduite = useRef<HTMLDivElement>(null);
  // Ma levure montre la station ouverte (maquette l5b) ; elle se remonte à neuf, ouverte, après un autre choix de levure (clé).
  const labo = recipe.yeast.lab || levure?.catalogue?.manufacturer;
  const nomAffiche = nomDeCarte(recipe.yeast.name, !!labo);
  const clePlan = `${draft.yeastId || recipe.yeast.name}||`;

  return <div className="lv-ma" data-lv="ma-levure" data-yeast-state={choisie ? 'chosen' : 'empty'}>
    {choisie && <div className="lv-bloc" data-booster="ligne-levure">
      <div className="lv-row">
        <span className="lv-pic" aria-hidden="true"><FlaskConical size={20} /></span>
        <span className={`lv-nom${nomAffiche.length > 22 ? ' lv-long' : ''}`} title={nomAffiche !== recipe.yeast.name ? recipe.yeast.name : undefined}>{nomAffiche}</span>
        <span className="lv-dose" data-lv="dose" title={sachets && !prevu ? 'Plage fabricant au volume de la recette, à choisir dans « Dose, ensemencement et starter »' : undefined}>
          <b>{doseTexte}</b><span>{doseUnite}</span></span>
        <button type="button" className="lv-x" aria-label={`Retirer ${recipe.yeast.name} de la recette`} onClick={onRetirer}><X size={16} aria-hidden="true" /></button>
        <span className="lv-sub">
          <span className="lv-sub-t">{[recipe.yeast.form ?? yeastPrete.form, labo && fabricantCourt(labo)].filter(Boolean).join(' · ') || 'forme et laboratoire ?'}</span>
          {(grammes || sachets) && <span className="lv-sub-d">
            {grammes && <span className="lv-m">{grammes}</span>}
            {sachets && <span className="lv-mini" aria-hidden="true"><i style={{ left: '8%', right: '8%' }} /></span>}
          </span>}
        </span>
      </div>
      <div className="lv-bande">
        <div className="lv-cel" data-cel="fg">
          <span className="lv-ct">FG</span>
          <span className="lv-cv">{plage(fg, 3) ?? '?'}</span>
          <span className="lv-ab">{abv ? `≈ ${plage(abv, 1)} % vol` : ' '}</span>
          {fg && <span className="lv-tr" aria-hidden="true"><i className="lv-hach" style={{ left: `${pct(fg.min, 1.004, 1.026)}%`, width: `${Math.max(4, pct(fg.max, 1.004, 1.026) - pct(fg.min, 1.004, 1.026))}%` }} /></span>}
        </div>
        <div className="lv-cel" data-cel="temperature">
          <span className="lv-ct">fiche · conduite</span>
          <span className="lv-cv">{tFiche ? plage(tFiche, 0) : '?'}{tConduite !== undefined && <small> · {dec(tConduite)} °C</small>}</span>
          <span className="lv-ab"> </span>
          <span className="lv-tr lv-tgr" aria-hidden="true">
            {tFiche && <i className="lv-hach" style={{ left: `${pct(tFiche.min, 5, 35)}%`, width: `${pct(tFiche.max, 5, 35) - pct(tFiche.min, 5, 35)}%` }} />}
            {tConduite !== undefined && <u className="lv-tk" style={{ left: `${pct(tConduite, 5, 35)}%` }} />}
          </span>
        </div>
        <div className="lv-cel" data-cel="floculation">
          <span className="lv-ct">floculation</span>
          {floc?.genre === 'jauge' && <><span className="lv-cv"><small>{NIVEAUX.find(n => n.id === floc.niveau)!.mot}</small></span><span className="lv-ab"> </span><Jauge niveau={floc.niveau} couleur="#8C8C8C" /></>}
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

    <ChampLevure choisie={choisie} reperes={reperes} stock={stock} stockIds={idsStock} fiches={fiches} enStock={enStock} proposees={proposees} precedente={precedente} onPrecedente={onPrecedente}
      onProposee={onProposee} onStock={onStock} onHorsCatalogue={onHorsCatalogue} libre={libre} />

    {avecConduite && <div className="yeast-workbench yeast-choice lv-base" data-lv="conduite-base" ref={conduite} hidden={conduiteCachee}>
      <YeastRecipePlan key={clePlan} recipe={recipe} refs={refs} onChange={onConduite}
        onCompare={onComparer ?? (() => undefined)} onGoal={() => undefined} onNavigate={onNavigate} onEditFacts={onFiche} onEditObjectives={onObjectifs}
        goalSlot={null} conductStep={1} initialConductOpen />
    </div>}
  </div>;
}
