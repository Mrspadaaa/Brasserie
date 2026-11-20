// « Ma levure » (maquette l5b, choisie le 09.11) : la ligne de la levure et sa dose en plage de sachets, la bande FG · °C · floculation,
// les effets de fermentation en jauges (là où la source donne un niveau, « ⌕ non documenté » sinon), le champ « Changer de levure » et
// ses puces, puis la conduite de base de l'app (YeastRecipePlan : « Conduite · température × jours », paliers, poignées ↕ et ↔, essai).
// Les données viennent de la recette, de la fiche du catalogue et de yeastPitching.ts ; rien n'est inventé : l'inconnu se dit « ? ».
//
// Retour du brasseur (09.11) : (1) « la recherche de base doit se faire sur le premier écran, comme pour malt et sucre, pas de renvoi » :
// « Changer de levure » est un vrai champ (modèle : `fermentescibles/Ajout.tsx`), ses résultats en tuiles juste dessous ; la recherche
// avancée reste l'onglet « Chercher », que le brasseur ouvre lui-même ; (2) « la conduite de palier fonctionne infiniment mieux sur celle
// de base » : la nouvelle conduite (`Conduite.tsx`, non montée, conservée) cède la place à la station de l'app.
import { memo, useDeferredValue, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { FlaskConical, History, Package, Search, Sparkles, Undo2, X } from 'lucide-react';
import type { StockItem } from '../../types';
import type { YeastSupply } from '../../../functions/src/yeastSupplySchema';
import type { TrialRecipe } from '../../domain/hopIndex/trials';
import type { YeastReference } from '../../domain/yeastReferences';
import type { ReperesRecette, ResultatRecherche } from '../../domain/levure/contrat';
import { normalizedYeastText, yeastSearchIndex, yeastSearchScore, type YeastSearchIndex } from '../../domain/yeastCatalogue';
import { relierAuCatalogue } from '../../domain/levure/relier';
import { createYeastRecipeDraft, evaluateYeastRecipeDesign } from '../../domain/yeastRecipeDesign';
import { Units } from '../../services/units';
import { Input } from '../Input';
import { YeastRecipePlan } from '../YeastRecipePlan';
import { CelluleRecherche, useEtatRecherche } from './useRechercheDonnee';
import { apiLevure } from './domaine';
import { besoinDeLaLevure, doseDuFabricantSeule } from './dose';
import { BandeDose, LigneConduite, motUnite, type EtatDose, type StockDose } from './CarteDose';
import './maLevure.css';
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
/** Les laboratoires dont la levure est revendue sous son nom par un autre fabricant (19.11 : Lallemand Brewing vend « White Labs Munich Lager Yeast 500g »). */
const LABOS = ['White Labs', 'Wyeast', 'Imperial', 'Omega', 'Fermentis', 'Lallemand', 'Mangrove Jack', 'Escarpment', 'Bootleg Biology', 'Brewing Science Institute', 'Lutra'];
/** Le conditionnement en fin de nom : « 500g », « Sachet 11g », « (Box of 25) ». Il appartient au produit exact, pas à la souche. */
const CONDITIONNEMENT = /\s*(?:\((?:box|pack|carton|lot)\b[^)]*\)|\b(?:sachet|pack|brick|brique|pouch)?\s*\d+(?:[.,]\d+)?\s?(?:g|kg|ml|l)\b)\s*$/i;
/**
 * Le nom à montrer et qui le fait (19.11, « Lallemand Brewing · White Labs Munich… », marque Lallemand) : le nom du catalogue est « Fabricant · Produit » ;
 * le fabricant n'est pas répété dans le nom, le conditionnement non plus (`sansConditionnement`), et quand le produit porte le nom d'un autre laboratoire,
 * c'est sa marque, le fabricant du catalogue n'en est que le vendeur. Rien n'est inventé : tout est lu dans le nom et le fabricant du catalogue.
 */
export function identiteLevure(nomComplet: string, fabricant?: string, { sansConditionnement = true } = {}): { nom: string; marque?: string; vendeur?: string } {
  let nom = nomComplet.trim();
  const point = nom.indexOf(' · ');
  let maker = fabricant?.trim();
  if (point > 0) {
    const avant = nom.slice(0, point);
    // « Brewing Science Institute · Andechs Lager » : le préfixe est le fabricant (dit ou non par la recette).
    if (!maker || nu(avant) === nu(maker) || nu(maker).startsWith(nu(avant)) || nu(avant).startsWith(nu(maker))) { maker = maker || avant; nom = nom.slice(point + 3).trim(); }
  }
  if (sansConditionnement) for (let i = 0; i < 2 && CONDITIONNEMENT.test(nom); i++) nom = nom.replace(CONDITIONNEMENT, '').trim();
  const labo = LABOS.find(l => nu(nom).startsWith(nu(l)) && (!maker || !nu(maker).startsWith(nu(l).split(' ')[0])));
  return labo && maker ? { nom: nom || nomComplet, marque: labo, vendeur: fabricantCourt(maker) } : { nom: nom || nomComplet, marque: maker ? fabricantCourt(maker) : undefined };
}
/** Le nom court d'une levure pour une phrase (bandeau, puce) : « Brewing Science Institute · Andechs Lager » → « Andechs Lager ». */
export const nomCourtLevure = (nom: string, fabricant?: string) => identiteLevure(nom, fabricant).nom;
/** L'index de recherche de chaque fiche, construit une fois (19.11 : refait à chaque frappe pour tout le catalogue, 2,7 s par mot au téléphone). */
const INDEX = new WeakMap<YeastReference, YeastSearchIndex>();
const indexDe = (l: YeastReference) => { let i = INDEX.get(l); if (!i) { i = yeastSearchIndex(l); INDEX.set(l, i); } return i; };
/** Le score du texte pour une fiche (celui de `catalogueMatches` et de `chercher` du domaine) ; un texte sans lettre ni chiffre garde tout. */
const scoreDe = (l: YeastReference, texte: string) => normalizedYeastText(texte) ? yeastSearchScore(indexDe(l), texte) : 1;
/** Construit les index pendant les temps morts, par lots : la première lettre tapée ne les attend plus. */
const inactif = globalThis as unknown as { requestIdleCallback?: (fn: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
const ric = (fn: () => void): number => inactif.requestIdleCallback ? inactif.requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 30) as unknown as number;
const cic = (id: number) => { if (inactif.cancelIdleCallback) inactif.cancelIdleCallback(id); else clearTimeout(id); };

/** La dose du fabricant au volume de la recette (lue sur sa fiche) : dans dose.ts, gardée ici pour ses lecteurs. */
export { doseDuFabricant } from './dose';
/** Combien de tuiles au plus sous le champ (un téléphone ne fait pas défiler mille levures) ; le total est dit. */
const MAX_TUILES = 8;

function Jauge({ niveau, couleur }: { niveau: 'faible' | 'moyen' | 'eleve'; couleur: string }) {
  const rang = NIVEAUX.findIndex(n => n.id === niveau);
  return <span className="lv-jo" role="img" aria-label={`niveau ${NIVEAUX[rang].mot}`} data-niveau={niveau}>
    {[0, 1, 2].map(i => <b key={i} style={i <= rang ? { background: couleur } : undefined} />)}</span>;
}

function Effet({ ligne, levureId, onChercher }: { ligne: LigneEffet; levureId: string; onChercher: (axe: string | string[]) => void }) {
  const { etat } = useEtatRecherche(levureId, ligne.id);
  // r3 v05 : une colonne par effet, le point et le nom dessus, les crans et le mot dessous.
  return <div className="ml-trait">
    <span className="lv-el"><i style={{ background: ligne.couleur }} aria-hidden="true" />{ligne.libelle}</span>
    <span className="lv-ev" data-genre={ligne.genre} data-axe={ligne.id}>
      {ligne.genre === 'jauge' && <><Jauge niveau={ligne.niveau} couleur={ligne.couleur} /><b title={ligne.source}>{NIVEAUX.find(n => n.id === ligne.niveau)!.mot}</b></>}
      {ligne.genre === 'mot' && <span title={ligne.source}>{ligne.texte}{ligne.estime && <em> · estimé</em>}</span>}
      {ligne.genre === 'nombre' && <span title={ligne.source}><b className="lv-m">{ligne.texte}</b> <em>· {ligne.nature}</em></span>}
      {etat && ligne.genre === 'inconnu' && <CelluleRecherche levureId={levureId} axe={ligne.id} />}
      {!etat && ligne.genre === 'inconnu' && <button type="button" className="lv-ch" onClick={() => onChercher(ligne.id)}
        aria-label={`${ligne.libelle} non documenté : chercher la donnée`}><Search size={12} aria-hidden="true" /> non documenté</button>}
    </span>
  </div>;
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
function ChampLevure({ choisie, classement, stock, stockIds, fiches, enStock, proposees, precedente, precedenteId, onPrecedente, onProposee, onStock, onHorsCatalogue, libre }: {
  choisie: boolean; stock: StockItem[]; stockIds: ReadonlySet<string>; enStock: StockItem[];
  /** Le catalogue dans l'ordre du domaine pour cette recette (vendue ici, puis Europe, puis rare), calculé une fois hors de la frappe. */
  classement: readonly YeastReference[];
  /** La fiche du catalogue de chaque article du stock (par sa référence) : celle de l'article, sinon celle à laquelle son nom se relie de façon sûre. Une levure, une tuile. */
  fiches: ReadonlyMap<string, string>;
  proposees: YeastReference[]; precedente?: string; precedenteId?: string; onPrecedente?: () => void;
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
  useEffect(() => {
    let i = 0, id = 0;
    const lot = () => { const fin = i + 60; for (; i < classement.length && i < fin; i++) indexDe(classement[i]); if (i < classement.length) id = ric(lot); };
    id = ric(lot);
    return () => cic(id);
  }, [classement]);

  // Les levures du stock dont le nom ou le fabricant contient le texte, puis le catalogue (API du domaine, sans filtre imposé).
  const { tuiles, total } = useMemo<{ tuiles: Tuile[]; total: number }>(() => {
    if (!t) return { tuiles: [], total: 0 };
    const q = nu(t);
    const duStock = stock.filter(i => i.category.toLocaleLowerCase('fr') === 'levure' && i.currentStock > 0 && nu(`${i.name} ${i.supplier ?? ''}`).includes(q))
      .sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite) || a.name.localeCompare(b.name, 'fr'));
    const dejaVues = new Set(duStock.map(i => fiches.get(i.ref)).filter((id): id is string => !!id));
    let catalogue: YeastReference[] = [];
    let total = 0;
    // Ce qui correspond au texte (nom, fabricant, code, arôme : l'index du domaine), le meilleur score devant (une levure désignée en tête), puis l'ordre
    // du domaine. 19.11 : `chercher` du domaine refaisait ses 18 facettes sur tout le catalogue à chaque lettre (2 s au téléphone) ; elles ne servent pas ici.
    // Critique du 20.11 (n° 4) : un code tapé (« W-34/70 ») ne garde que les levures qui le portent dans leur nom, leur code ou un alias (score
    // d'identité ≥ 400 ; un code lu seulement dans le texte descriptif d'une autre fiche, « Banana Split », est coupé) ; le code écrit tel quel,
    // tiret compris, passe devant, puis la fiche documentée devant l'homonyme sans fiche.
    const code = /\d/.test(t);
    // Tirets typographiques (« SafLager™ W‑34/70 » s'écrit avec U+2011) et marques ™ ® ramenés au clavier du téléphone.
    const clavier = (n: string) => n.toLocaleLowerCase('fr').replace(/[‐-―−]/g, '-').replace(/[™®]/g, '').replace(/\s+/g, ' ');
    const brut = clavier(t);
    const notees = classement.map((l, i) => ({ l, i, s: scoreDe(l, t),
      exact: code && [l.name, l.catalogue?.productCode ?? ''].some(n => clavier(n).includes(brut)),
      doc: (l.catalogue?.facts?.length ?? 0) > 0 }))
      .filter(x => x.s >= (code ? 400 : 1) && !dejaVues.has(x.l.id));
    notees.sort((a, b) => Number(b.exact) - Number(a.exact) || b.s - a.s || Number(b.doc) - Number(a.doc) || a.i - b.i);
    catalogue = notees.map(x => x.l);
    total = catalogue.length + duStock.length;
    // Les levures de mon stock devant, l'ordre de l'API derrière (tri stable).
    const rang = (l: YeastReference) => (stockIds.has(l.id) ? 0 : 1);
    catalogue = catalogue.map((l, i) => ({ l, i })).sort((a, b) => rang(a.l) - rang(b.l) || a.i - b.i).map(x => x.l);
    const liste: Tuile[] = [
      ...duStock.map((item): Tuile => ({ genre: 'stock', cle: `s-${item.ref}`, nom: item.name, item, sous: `${Units.format(item.currentStock, item.unit)} en stock` })),
      ...catalogue.map((levure): Tuile => ({
        genre: 'catalogue', cle: `c-${levure.id}`, nom: nomDeTuile(levure), levure, enStock: stockIds.has(levure.id),
        sous: (() => { const id = identiteLevure(levure.name, levure.catalogue?.manufacturer);
          return [id.vendeur ? `${id.marque} · par ${id.vendeur}` : levure.catalogue?.manufacturer, levure.form, stockIds.has(levure.id) ? 'en stock' : ''].filter(Boolean).join(' · '); })(),
      })),
    ].slice(0, MAX_TUILES);
    if (!liste.length && t.length >= 2) return { tuiles: [{ genre: 'libre', cle: 'libre', nom: `Mon stock ou saisie libre : « ${t} »`, sous: 'rien dans le catalogue ni le stock · saisie libre' }], total: 0 };
    return { tuiles: liste, total };
  }, [t, stock, stockIds, fiches, classement]);
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
  }, [enSaisie, proposees.map(l => l.id).join('|'), enStock.map(i => i.ref).join('|'), precedente]); // eslint-disable-line react-hooks/exhaustive-deps

  // Une seule puce par levure (critique-2 du 20.11, n° 3 : US-05 en cube et en ↺) : quand la levure d'avant a sa puce ↺, la récente l'emporte sur
  // celle du stock ou des proposées (même fiche, ou même nom court : « SafAle US-05 » = « SafAle US-05 (Fermentis) »).
  const cleNom = (n: string) => nu(nomCourt(n)).replace(/[^a-z0-9]/g, '');
  const avant = precedente && onPrecedente ? { id: precedenteId, cle: cleNom(precedente) } : undefined;
  const estAvant = (id: string | undefined, nom: string) => !!avant && ((!!id && id === avant.id) || (!!avant.cle && cleNom(nom) === avant.cle));
  const pucesProposees = proposees.filter(l => !estAvant(l.id, l.name));
  const pucesStock = enStock.filter(item => !pucesProposees.some(l => l.id === fiches.get(item.ref)) && !estAvant(fiches.get(item.ref), item.name));

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
        {pucesProposees.map(l => <button key={l.id} type="button" className="lv-puce" data-propose={l.id} onClick={() => onProposee?.(l)}><Package size={14} aria-hidden="true" /><span>{nomCourt(l.name)}</span></button>)}
        {pucesStock.map(item => <button key={item.ref} type="button" className="lv-puce" onClick={() => onStock(item)}><Package size={14} aria-hidden="true" /><span>{item.name}</span></button>)}
        {precedente && onPrecedente && <button type="button" className="lv-puce lv-hab" title={precedente} onClick={onPrecedente}><History size={14} aria-hidden="true" /><span>{nomCourtLevure(precedente)}</span></button>}
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

/** Plusieurs données non documentées se disent en une rangée, une seule recherche (19.11 : cinq « ⌕ non documenté » empilés). */
function EffetsInconnus({ lignes, levureId, onChercher }: { lignes: LigneEffet[]; levureId: string; onChercher: (axes: string[]) => void }) {
  // Une seule rangée sur toute la largeur (les noms vont à la ligne, le bouton reste à droite) : à 390, la colonne des noms ne pousse plus le bouton dessus.
  return <div className="lv-groupe" data-lv="effets-inconnus">
    <span className="lv-el lv-el-groupe">{lignes.map(l => <span key={l.id} className="lv-el-n" data-axe-inconnu={l.id}><i style={{ background: l.couleur }} aria-hidden="true" />{l.libelle}</span>)}</span>
    <span className="lv-ev" data-genre="inconnu-groupe">
      <button type="button" className="lv-ch" data-levure={levureId} onClick={() => onChercher(lignes.map(l => l.id))}
        aria-label={`${lignes.map(l => l.libelle).join(', ')} non documentés : chercher ces données (une recherche)`}><Search size={12} aria-hidden="true" /> non documentés</button>
    </span>
  </div>;
}

/** Une ligne d'effet dont la recherche est lancée ou finie : elle reprend sa rangée. */
function EffetsDeLaLevure({ lignes, levureId, onChercher }: { lignes: LigneEffet[]; levureId: string; onChercher: (axe: string | string[]) => void }) {
  const { crochet } = useEtatRecherche(levureId, '');
  const libres = lignes.filter(l => l.genre === 'inconnu' && !crochet?.etat(levureId, l.id));
  const groupe = libres.length >= 2 ? new Set(libres.map(l => l.id)) : new Set<string>();
  return <div className="lv-eff2 ml-traits" aria-label="Effets de fermentation">
    {lignes.filter(l => !groupe.has(l.id)).map(l => <Effet key={l.id} ligne={l} levureId={levureId} onChercher={onChercher} />)}
    {groupe.size > 0 && <EffetsInconnus lignes={libres} levureId={levureId} onChercher={onChercher} />}
  </div>;
}

function MaLevureVue({ recipe, refs, supply, levure, classement, onConduite, onChercherDonnee, onRetirer, stock, onStock, onHorsCatalogue, libre, precedente, precedenteId, onPrecedente, proposees = [], onProposee,
  stockIds, conduiteCachee, onComparer, onFiche, onObjectifs, onNavigate, onDose, onDoseChange, onVolet }: {
  /** − / +, « Mettre N sachets », « → N sachets » : écrit la quantité (et son unité) dans la recette, sans ouvrir de volet. */
  onDoseChange?: (qty: number, unit: string) => void;
  /** La rangée d’actions de la carte : un volet de l’étape s’ouvre et vient dans l’écran. */
  onVolet?: (id: 'fiche' | 'produit' | 'sources' | 'atelier') => void;
  /** Toucher la dose : le volet « Dose, ensemencement et starter » s'ouvre (19.11 : « ? dose à saisir » ne menait nulle part). */
  onDose?: () => void;
  /** Levures proposées (vendues en CH · FR · DE, API de d1, la plus proche de la recette d'abord) : puces « ⬚ Nottingham » de la maquette. */
  proposees?: YeastReference[]; onProposee?: (levure: YeastReference) => void;
  /** La levure d'avant le dernier changement (puce ↺ : la précédente), quand il y en a une. */
  precedente?: string; precedenteId?: string; onPrecedente?: () => void;
  recipe: TrialRecipe; refs: YeastReference[]; supply: YeastSupply;
  /** La fiche du catalogue de la levure de la recette ; absente pour une levure du stock ou une saisie libre. */
  levure?: YeastReference;
  /** Écrit la recette (intention « conduct » du wizard) ; peut lever une erreur lisible. */
  onConduite: (next: TrialRecipe) => TrialRecipe | void;
  onChercherDonnee: (axe: string | string[]) => void;
  onRetirer: () => void;
  stock: StockItem[]; onStock: (item: StockItem) => void;
  /** « Hors catalogue » ou une saisie sans résultat : ouvre « Mon stock ou saisie libre » (le texte tapé est donné quand il y en a un). */
  onHorsCatalogue: (texte?: string) => void;
  /** La saisie libre ouverte, rendue sous le champ de recherche. */
  libre?: ReactNode;
  /** Repères de la recette pour classer les résultats (jamais un filtre). */
  reperes?: ReperesRecette;
  /** Le catalogue rangé pour cette recette (`chercher('')` du domaine, calculé par l'étape) ; à défaut, les fiches telles quelles. */
  classement?: readonly YeastReference[];
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

  // La dose (20.11, r3 v05 / r4 v02) : la quantité écrite, le besoin de la recette (moteur : taux × volume × °P) et le stock, sur la carte.
  const besoin = useMemo(() => besoinDeLaLevure(recipe, supply, evaluation.projection.og, levure), [recipe, supply, evaluation, levure]);
  // T4-2 : sans densité de moût, pas de besoin ; la dose du fabricant et le sachet se disent quand même.
  const seul = useMemo(() => besoin ? undefined : doseDuFabricantSeule(recipe, supply, evaluation.projection.og, levure), [besoin, recipe, supply, evaluation, levure]);
  const prevu = Number.isFinite(recipe.yeast.qty) && (recipe.yeast.qty ?? 0) > 0 ? recipe.yeast : undefined;
  const uniteEcrite = prevu?.unit?.toLocaleLowerCase('fr');
  const compte = uniteEcrite ? /^(sachet|pack)s?$/.test(uniteEcrite) : !!(besoin?.sachet ?? seul?.sachet);
  const unite = compte ? (uniteEcrite?.replace(/s$/, '') ?? besoin?.sachet?.unite ?? seul?.sachet?.unite ?? 'sachet') : (uniteEcrite ?? 'g');
  const qty = prevu?.qty;
  const [touche, setTouche] = useState(false);
  useEffect(() => { setTouche(false); }, [recipe.yeast.name]);
  const etatDose: EtatDose = !compte ? 'libre' : qty === undefined ? 'a-choisir' : touche && besoin?.sachets !== undefined ? 'apres' : 'repos';
  // Le stock de cette levure : l'article de la recette, ou ceux reliés à sa fiche ; compté en sachets (un stock en grammes, au poids du sachet).
  const stockDose = useMemo<StockDose>(() => {
    const articles = stock.filter(i => i.category.toLocaleLowerCase('fr') === 'levure' && (i.ref === recipe.yeast.stockItemRef || (!!levure && fiches.get(i.ref) === levure.id)));
    const g = (besoin?.sachet ?? seul?.sachet)?.grammes;
    const n = articles.reduce((s, i) => { const u = (i.unit ?? '').toLocaleLowerCase('fr');
      return s + (/^(sachet|pack|unit|pi[eè]ce|pc)/.test(u) ? i.currentStock : u === 'g' && g ? Math.floor(i.currentStock / g + 1e-9) : u === 'kg' && g ? Math.floor(i.currentStock * 1000 / g + 1e-9) : 0); }, 0);
    return { n, trouve: articles.length > 0 };
  }, [stock, recipe.yeast.stockItemRef, levure, fiches, besoin, seul]);
  const ecrireDose = (n: number, apres: boolean) => { setTouche(apres); onDoseChange?.(n, unite); };
  const doseTitre = qty !== undefined ? `${dec(qty, Number.isInteger(qty) ? 0 : 1)} ${motUnite(unite, qty)} : régler la dose, l’ensemencement et le starter` : 'Dose à choisir : régler la dose, l’ensemencement et le starter';
  // La conduite hors de la plage de la levure (19.11 : fiche 9–11 °C, conduite 19 °C) : un toucher cale la fermentation principale sur le bord le plus proche
  // de la plage ; « Rétablir » rend les paliers d'avant. Les autres paliers (repos, garde) gardent leur consigne.
  const horsPlage = tFiche && tConduite !== undefined && (tConduite < tFiche.min || tConduite > tFiche.max) ? (tConduite > tFiche.max ? tFiche.max : tFiche.min) : undefined;
  const [avantCalage, setAvantCalage] = useState<{ nom: string; paliers: NonNullable<TrialRecipe['fermentation']>; t: number }>();
  useEffect(() => { setAvantCalage(a => a && a.nom !== recipe.yeast.name ? undefined : a); }, [recipe.yeast.name]);
  const caler = () => {
    if (horsPlage === undefined || !recipe.fermentation) return;
    const avant = recipe.fermentation;
    const paliers = avant.map(p => p.kind === 'primaire' && Number.isFinite(p.tempC) && (p.tempC! < tFiche!.min || p.tempC! > tFiche!.max) ? { ...p, tempC: horsPlage } : p);
    // Sans palier « primaire » nommé, le premier palier porte la fermentation principale (comme \`primaire\` plus haut).
    const ecrits = paliers.some((p, i) => p !== avant[i]) ? paliers : avant.map((p, i) => i === 0 ? { ...p, tempC: horsPlage } : p);
    onConduite({ ...recipe, fermentation: ecrits });
    setAvantCalage({ nom: recipe.yeast.name, paliers: avant, t: tConduite! });
  };
  const retablir = () => { if (avantCalage) { onConduite({ ...recipe, fermentation: avantCalage.paliers }); setAvantCalage(undefined); } };

  // La conduite de base : montée comme dans YeastRecipeChoice (même clé : un autre choix de levure la remonte à neuf), sans objectifs (`goalSlot={null}` :
  // ils ont leur repli). Comme là-bas, elle existe dès qu'une levure est choisie ou que des paliers sont déjà dans la recette.
  const avecConduite = choisie || !!recipe.fermentation?.length;
  const conduite = useRef<HTMLDivElement>(null);
  // Ma levure montre la station ouverte (maquette l5b) ; elle se remonte à neuf, ouverte, après un autre choix de levure (clé).
  const labo = recipe.yeast.lab || levure?.catalogue?.manufacturer;
  const ident = identiteLevure(recipe.yeast.name, labo);
  const nomAffiche = nomDeCarte(ident.nom, !!(ident.marque || labo));
  // 19.11, fluidité : la conduite suit la recette en différé ; choisir une levure peint d'abord sa carte, la station se remonte juste après.
  const recetteConduite = useDeferredValue(recipe);
  const clePlan = `${recetteConduite.yeast.hopIndexId || recetteConduite.yeast.name}||`;

  return <div className="lv-ma" data-lv="ma-levure" data-yeast-state={choisie ? 'chosen' : 'empty'}>
    {choisie && <div className="lv-bloc ml-carte" data-booster="ligne-levure">
      <div className="lv-row ml-hd">
        <span className="lv-pic ml-pastille" data-hors-catalogue={!levure || undefined} aria-hidden="true"><FlaskConical size={22} /></span>
        <span className={`lv-nom${nomAffiche.length > 22 ? ' lv-long' : ''}`} title={nomAffiche !== recipe.yeast.name ? recipe.yeast.name : undefined}>{nomAffiche}</span>
        <button type="button" className="lv-dose ml-qte" data-lv="dose" data-dose={qty !== undefined ? 'prevue' : 'a-choisir'} data-touche={touche || undefined} title={doseTitre} aria-label={doseTitre} onClick={onDose}>
          {qty !== undefined ? <><b>{dec(qty, Number.isInteger(qty) ? 0 : 1)}</b><span>{motUnite(unite, qty)}</span></> : <span className="ml-achoisir">à choisir</span>}</button>
        <button type="button" className="lv-x" aria-label={`Retirer ${recipe.yeast.name} de la recette`} onClick={onRetirer}><X size={18} aria-hidden="true" /></button>
        <span className="lv-sub"><span className="lv-sub-t">{(ident.vendeur ? `${ident.marque} · vendue par ${ident.vendeur}` : ident.marque ?? (labo && fabricantCourt(labo))) || (levure ? 'laboratoire ?' : 'Hors catalogue · saisie libre')}</span></span>
      </div>
      <BandeDose etat={etatDose} qty={qty} unite={unite} besoin={besoin} seul={seul} stock={stockDose}
        onPas={n => ecrireDose(n, true)} onEcrire={n => ecrireDose(n, etatDose === 'apres')} onDose={onDose} onOffre={() => onVolet?.('produit')} />
      <div className="lv-bande ml-cases">
        <div className="lv-cel" data-cel="fg">
          <span className="lv-ct">FG</span>
          <span className="lv-cv" data-inconnu={!fg || undefined}>{plage(fg, 3) ?? 'à saisir'}</span>
          <span className="lv-ab">{abv ? `≈ ${plage(abv, 1)} % vol` : 'atténuation ?'}</span>
          <span className={`ml-jauge${fg ? '' : ' ml-vide'}`} role={fg ? 'img' : undefined} aria-label={fg ? `FG ${plage(fg, 3)} sur une échelle de 1,000 à 1,030` : undefined}>
            {fg && <i style={{ left: `${pct(fg.min, 1, 1.03)}%`, width: `${Math.max(2, pct(fg.max, 1, 1.03) - pct(fg.min, 1, 1.03))}%` }} />}</span>
          {fg && <span className="ml-ech lv-m" aria-hidden="true"><span>1,000</span><span>1,030</span></span>}
        </div>
        <div className="lv-cel" data-cel="temperature" data-hors-plage={horsPlage !== undefined || undefined}>
          <span className="lv-ct">fiche · conduite</span>
          <span className="lv-cv">{tFiche ? plage(tFiche, 0) : '?'}{tConduite !== undefined && <> · <span className="ml-tc" data-hors={horsPlage !== undefined || undefined}>{dec(tConduite)} °C</span></>}</span>
          <span className="ml-plage" role="img" aria-label={`${tFiche ? `Plage de la fiche ${plage(tFiche, 0)} °C` : 'Plage inconnue'}${tConduite !== undefined ? `, conduite ${dec(tConduite)} °C${horsPlage !== undefined ? ' hors plage' : ''}` : ''}`}>
            {tFiche && <i className="ml-fiche" style={{ left: `${pct(tFiche.min, 0, 25)}%`, width: `${Math.max(3, pct(tFiche.max, 0, 25) - pct(tFiche.min, 0, 25))}%` }} />}
            {tConduite !== undefined && <i className="ml-ici" data-hors={horsPlage !== undefined || undefined} style={{ left: `${pct(tConduite, 0, 25)}%` }} />}
          </span>
          {horsPlage !== undefined ? <button type="button" className="lv-caler ml-caler" data-lv="caler" onClick={caler}
            aria-label={`Conduite à ${dec(tConduite!)} °C, hors de la plage de la levure : caler la fermentation principale à ${dec(horsPlage)} °C`}>→ Caler à {dec(horsPlage)} °C</button>
            : avantCalage ? <button type="button" className="lv-lien lv-retablir" data-lv="retablir" onClick={retablir}><Undo2 size={12} aria-hidden="true" /> {dec(avantCalage.t)} °C</button>
            : !tFiche ? <span className="lv-ab">plage inconnue</span> : null}
        </div>
        <div className="lv-cel" data-cel="floculation">
          <span className="lv-ct">floculation</span>
          {floc?.genre === 'jauge' && <><span className="lv-cv ml-fin">{NIVEAUX.find(n => n.id === floc.niveau)!.mot}</span><Jauge niveau={floc.niveau} couleur="#8C8C8C" /></>}
          {floc?.genre === 'mot' && <span className="lv-cv ml-fin">{floc.texte}</span>}
          {(!floc || floc.genre === 'inconnu') && !floculationEtat && <button type="button" className="ml-floc-inc" onClick={() => onChercherDonnee('clarte')}
            aria-label="Floculation non documentée : chercher la donnée"><span className="lv-cv ml-fin">inconnue</span><span className="ml-crans-vides" aria-hidden="true"><i /><i /><i /></span></button>}
        </div>
      </div>
      {(!floc || floc.genre === 'inconnu') && floculationEtat && <div className="lv-cel-pleine" data-cel="floculation-recherche"><CelluleRecherche levureId={levure?.id ?? 'recette'} axe="clarte" libelle="floculation" /></div>}
      <LigneConduite paliers={(recipe.fermentation ?? []).filter(f => f.kind !== 'ajout')} mot={etatDose === 'apres'}
        onToucher={() => conduite.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })} />
      <EffetsDeLaLevure lignes={effets.length ? effets : EFFETS_INCONNUS} levureId={levure?.id ?? 'recette'} onChercher={onChercherDonnee} />
      <div className="ml-toucher" data-lv="actions" aria-label="Le reste de l’étape, à un toucher">
        <button type="button" className="ml-tch ml-ia" data-lv="act-ia" onClick={() => onVolet?.('fiche')} aria-label="Compléter la fiche avec l’IA"><Sparkles size={18} aria-hidden="true" />Compléter · IA</button>
        <button type="button" className="ml-tch" data-lv="act-offres" onClick={() => onVolet?.('produit')}>Offres</button>
        <button type="button" className="ml-tch" data-lv="act-reperes" onClick={() => onVolet?.('sources')}>Repères</button>
        <button type="button" className="ml-tch" data-lv="act-atelier" onClick={() => onVolet?.('atelier')}>Atelier</button>
      </div>
    </div>}

    {!choisie && <div className="lv-vide" data-lv="sans-levure">
      <p><b>Levure · choisir</b></p>
      <p className="lv-note">Aucune levure dans la recette : cherche-la par son nom, son code, son fabricant ou son arôme, ou prends-en une de ton stock.</p>
    </div>}

    <ChampLevure choisie={choisie} classement={classement ?? refs} stock={stock} stockIds={idsStock} fiches={fiches} enStock={enStock} proposees={proposees} precedente={precedente} precedenteId={precedenteId} onPrecedente={onPrecedente}
      onProposee={onProposee} onStock={onStock} onHorsCatalogue={onHorsCatalogue} libre={libre} />

    {avecConduite && <div className="yeast-workbench yeast-choice lv-base" data-lv="conduite-base" ref={conduite} hidden={conduiteCachee}>
      <YeastRecipePlan key={clePlan} recipe={recetteConduite} refs={refs} onChange={onConduite}
        onCompare={onComparer ?? (() => undefined)} onGoal={() => undefined} onNavigate={onNavigate} onEditFacts={onFiche} onEditObjectives={onObjectifs}
        goalSlot={null} conductStep={1} initialConductOpen />
    </div>}
  </div>;
}
/** Mémorisée (19.11, fluidité) : ouvrir un volet de l'étape ne refait ni la carte ni la conduite quand rien de ce qu'elles montrent n'a changé. */
export const MaLevure = memo(MaLevureVue);
