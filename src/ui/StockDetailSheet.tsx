import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NumberInput } from './NumberInput';
import { ArrowLeft, ChevronDown, ChevronRight, Package, MoreHorizontal, Star, Trash2, X, ArrowLeftRight, ShoppingCart, CalendarDays, PenLine, Pencil } from 'lucide-react';
import { Batch, Recipe, StockItem } from '../types';
import { DateField, toIsoDate, toSwissDate } from './DateField';
import { todayISO } from '../domain/finance/ledger';
import { libelleDurabilite, liensArticle, motifNonSuppression, nombreFr, quantiteLue, statutDurabilite, verifierCorrection, verifierSeuil } from '../domain/stock/regles';
import { disponibilites, libelleSource, type SourceBesoin } from '../domain/stock/disponibilite';
import { type RecipeStockComparison, allocatedBatches } from '../domain/stockLevel';
import { Suggestions } from '../services/suggestions';
import { ConfirmSheet } from './Sheet';
import { FormNav, Field, TextInput, inputClass } from './FormNav';
import { Combobox } from './Combobox';
import { useSyncedDraft } from '../hooks/useLiveData';
import { canonicalStockCategory, memeNom } from '../services/stockLineMatching';
import { changerUniteArticle } from '../domain/stock/changerUnite';
import { estVide, ficheDe } from '../domain/stock/ficheValeurs';
import { champsASaisir, MOT_A_SAISIR, subscribeEnrichissement } from '../services/enrichissement';
import type { ChampEcrit } from '../services/enrichissementStore';
import { bandForEbc } from '../domain/beerColor';
import { familleDe, jourCourt, lotsDe, nombreSuisse, prixLu, quantiteArticle, variation, type Lot } from '../domain/stock/ficheArticle';
import type { MouvementBrut } from '../domain/stock/mouvementsArticle';
import { StockFicheBouge } from './StockFicheBouge';
import type { InventoryReason } from '../services/storage';
import './stocks.css';
import './stockFichePage.css';

interface StockDetailSheetProps {
  item: StockItem | null;
  batches: Batch[];
  stockItems?: StockItem[];
  recipeCheck?: { recipeName: string; comparison: RecipeStockComparison } | null;
  onClose: () => void;
  /** `base` : l'article tel que la fiche l'a lu (sert à n'appliquer que les champs que le brasseur a changés, AM-53). */
  onSave: (item: StockItem, base: StockItem) => void;
  onDelete: (item: StockItem) => void;
  onToggleFavorite: (item: StockItem) => void;
  /** Les recettes enregistrées : un article qu'une recette cite ne se supprime pas (AM-55). */
  recipes?: Recipe[];
  /** Les mouvements de stock (achats, brassages, inventaires) : « Ce qui a bougé ». Absents : la carte dit qu'aucun mouvement n'est enregistré. */
  movements?: MouvementBrut[];
  /** « Corriger le stock » : écrit un mouvement d'inventaire (R4). Absent : le bloc n'est pas montré. */
  onCorrect?: (item: StockItem, compte: number, motif: InventoryReason, note?: string) => void;
  /** « voir la facture » d'un achat. Absent : la ligne n'est pas cliquable. */
  onOpenTransaction?: (id: string) => void;
  /** « voir le bilan » d'un brassin. Absent : la ligne n'est pas cliquable. */
  onOpenBatch?: (id: string) => void;
  /** « Commander » : mène aux courses. Absent : le bouton n'est pas montré. */
  onCommander?: () => void;
  /** « Remplaçants possibles » d'un houblon : ouvre l'outil houblons. Absent : le bloc n'est pas montré. */
  onOpenHops?: () => void;
}

/** EN-2, EN-3 : le mot que la fiche écrit près d'un champ utile que personne n'a pu remplir ; petit, couleur d'attente, jamais un paragraphe. */
const ASaisir: React.FC<{ champ: ChampEcrit; indication?: string }> = ({ champ, indication }) =>
  <p data-a-saisir={champ} className="text-xs text-attention leading-snug">{MOT_A_SAISIR}{indication && <span className="text-cave-400"> · {indication}</span>}</p>;

/** L'atténuation publiée en plage (« 78–82 % publié ») : une indication à côté du champ vide, jamais un point inventé. */
function attenuationPubliee(item: StockItem): string | undefined {
  const f = (item.yeastTechnicalFacts ?? []).find(x => x.key === 'attenuation' && x.range && x.range.min !== x.range.max);
  return f?.range ? `${nombreFr(f.range.min)}–${nombreFr(f.range.max)} % publié` : undefined;
}

const PLURIEL: Record<string, string> = { Houblon: 'Houblons', Malt: 'Malts', Levure: 'Levures', Sel: 'Sels' };

/** Les pas de la correction (k2) : g ±100/10/1, kg ±1/0,1/0,01, sachet ±1. */
function pasDe(unite: string): number[] {
  const k = unite.trim().toLowerCase();
  const montee = k === 'g' ? [1, 10, 100] : k === 'kg' ? [0.01, 0.1, 1] : k === 'l' ? [0.1, 1] : [1];
  return [...[...montee].reverse().map(v => -v), ...montee];
}
const arrondi = (v: number) => Math.round(v * 1e6) / 1e6;

type Motif = 'comptage' | 'perte' | 'autre';
const AUTRES: { code: InventoryReason; label: string }[] = [{ code: 'casse', label: 'Casse' }, { code: 'saisie', label: 'Erreur de saisie' }, { code: 'don', label: 'Don ou dégustation' }];

/** Une source de besoin : l'icône dit si le brassin est planifié (calendrier) ou la recette seulement écrite (plume). */
function SourceLigne({ s, unite }: { s: SourceBesoin; unite: string }) {
  const lib = libelleSource(s);
  const sous = (lib.startsWith(s.nom) ? lib.slice(s.nom.length) : lib).replace(/^\s*:?\s*/, '');
  return <div className="sfp-src" data-source={s.genre}>
    {s.genre === 'recette' ? <PenLine size={18} aria-hidden="true"/> : <CalendarDays size={18} aria-hidden="true"/>}
    <span>{s.nom}<small>{sous}</small></span>
    <span className="sfp-m">{s.quantite === null ? '?' : quantiteArticle(s.quantite, unite)}</span>
  </div>;
}

/** La fiche d'un article, en page entière (k2) : quantité et besoin d'abord, ce qui a bougé, corriger, seuil ; le formulaire derrière « Modifier la fiche ». */
export const StockDetailSheet: React.FC<StockDetailSheetProps> = props =>
  props.item ? <FichePage key={props.item.ref} {...props} item={props.item}/> : null;

const FichePage: React.FC<StockDetailSheetProps & { item: StockItem }> = ({
  item, batches, stockItems, recipeCheck, onClose, onSave, onDelete, onToggleFavorite, recipes = [],
  movements = [], onCorrect, onOpenTransaction, onOpenBatch, onCommander, onOpenHops
}) => {
  const [draft, setDraft] = useSyncedDraft(item, item.ref);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menu, setMenu] = useState(false);
  const [edition, setEdition] = useState(false);
  const [uniteRefus, setUniteRefus] = useState('');
  const [uniteNote, setUniteNote] = useState('');
  // Corriger le stock : le lot, le compté (null = pas touché), le motif.
  const [lotRef, setLotRef] = useState(item.ref);
  const [compte, setCompte] = useState<number | undefined | null>(null);
  const [motif, setMotif] = useState<Motif>('comptage');
  const [autre, setAutre] = useState<InventoryReason>('casse');
  // Les champs que le travail de fiche a laissés vides faute de source (lu à l'ouverture, relu quand le travail change).
  const [manque, setManque] = useState<ChampEcrit[]>([]);
  const ref = item.ref;
  const racine = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let vivant = true;
    const lire = () => { champsASaisir(ref).then(c => { if (vivant) setManque(c); }, () => { if (vivant) setManque([]); }); };
    lire();
    const arreter = subscribeEnrichissement(lire);
    return () => { vivant = false; arreter(); };
  }, [ref]);
  // La page prend le focus à l'ouverture et le rend à ce qui l'a ouverte.
  useEffect(() => {
    const ouvreur = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    racine.current?.focus({ preventScroll: true });
    return () => { if (ouvreur?.isConnected) ouvreur.focus({ preventScroll: true }); };
  }, []);

  const aujourdhui = todayISO();
  const tous = stockItems ?? [item];
  const famille = useMemo(() => familleDe(item, tous), [item, tous]);
  const lots = useMemo(() => lotsDe(famille, movements), [famille, movements]);
  const plusieursLots = famille.length > 1;
  const unite = item.unit;
  const categorie = canonicalStockCategory(draft.category);
  const houblon = categorie === 'Houblon';
  const malt = categorie === 'Malt' || /c[ée]r[ée]ale|sucre/i.test(categorie);
  const levure = categorie === 'Levure';
  const technical = malt || houblon || levure;

  // Quantité, besoin et manque de la FAMILLE (l'article et ses lots « bis ») : une valeur inconnue reste inconnue, jamais 0.
  const dispos = useMemo(() => { const m = disponibilites(tous, batches, recipes).parArticle; return famille.map(a => m.get(a.ref)); }, [tous, batches, recipes, famille]);
  const stocks = famille.map(a => Number.isFinite(a.currentStock) && a.currentStock >= 0 ? a.currentStock : null);
  const total = stocks.some(v => v === null) ? null : arrondi(stocks.reduce<number>((s, v) => s + (v as number), 0));
  const besoin = dispos.some(d => d && d.besoin === null) ? null : arrondi(dispos.reduce((s, d) => s + (d?.besoin ?? 0), 0));
  const besoinConnu = arrondi(dispos.reduce((s, d) => s + (d?.besoinConnu ?? 0), 0));
  const manqueNet = besoin !== null && total !== null ? Math.max(0, arrondi(besoin - total)) : null;
  const manqueAuMoins = besoin === null && total !== null && besoinConnu > total ? arrondi(besoinConnu - total) : null;
  const sources = useMemo(() => {
    const fusion = new Map<string, SourceBesoin>();
    for (const d of dispos) for (const s of d?.sources ?? []) {
      const cle = `${s.genre}:${s.id}`; const deja = fusion.get(cle);
      fusion.set(cle, deja ? { ...deja, quantite: deja.quantite === null || s.quantite === null ? null : arrondi(deja.quantite + s.quantite) } : s);
    }
    return [...fusion.values()];
  }, [dispos]);
  const raisons = [...new Set(dispos.flatMap(d => d?.raisons ?? []))];
  const sommeSources = sources.some(s => s.quantite === null) ? null : arrondi(sources.reduce((s, x) => s + (x.quantite ?? 0), 0));

  // MV-43, BR-76 : un seuil de 999 999 kg est une faute de frappe, pas un seuil.
  const seuil = verifierSeuil(draft.minStock, draft.unit);
  const seuilErreur = 'refus' in seuil ? seuil.refus : undefined;
  const seuilFixe = typeof draft.minStock === 'number' && draft.minStock > 0 ? draft.minStock : null;
  const canSave = !!draft.name.trim() && seuil.ok;

  // Corriger le stock : le lot choisi, le compté, le motif, et ce que les règles (AM-54) en disent avant d'écrire.
  const lotItem = famille.find(a => a.ref === lotRef) ?? item;
  const motifCode: InventoryReason = motif === 'autre' ? autre : motif;
  const valeur = compte === null ? lotItem.currentStock : compte;
  const verdict = valeur === undefined ? null : verifierCorrection(lotItem, valeur, motifCode);
  const correctionTouchee = compte !== null;
  const correctionOk = !correctionTouchee || (verdict !== null && verdict.ok);
  const pas = pasDe(lotItem.unit);
  const poser = (v: number) => setCompte(Math.max(0, arrondi(v)));

  const save = () => {
    if (!canSave || !correctionOk) return;
    onSave({ ...draft, name: draft.name.trim(), favorite: item.favorite, reorder: draft.minStock !== undefined && draft.currentStock <= draft.minStock }, item);
    if (correctionTouchee && onCorrect && valeur !== undefined) onCorrect(lotItem, valeur, motifCode);
    onClose();
  };
  // AM-55 : ce qui retient l'article (brassin qui le réserve, recette qui le cite).
  const nonSuppression = motifNonSuppression(liensArticle(item, batches, recipes, tous));
  // AM-56 : date de durabilité d'une levure (AAAA-MM-JJ dans le lot, JJ.MM.AAAA à l'écran).
  const durabilite = statutDurabilite(draft.yeastLot?.expiresOn, aujourdhui);
  const dur = libelleDurabilite(item.yeastLot?.expiresOn, aujourdhui);
  const allocated = allocatedBatches(item, batches, tous);
  /* AM n° 8 : l'unité ne se change pas sans convertir le stock, le seuil et le maximum ; d'une famille à l'autre, le changement est refusé et dit pourquoi. */
  const changeUnit = (u: string) => {
    const changement = changerUniteArticle(draft, u, allocated.length > 0);
    if ('refus' in changement) { setUniteRefus(changement.refus); setUniteNote(''); return; }
    setUniteRefus(''); setUniteNote(changement.note ? `${changement.note} Enregistre pour l’appliquer.` : '');
    setDraft(changement.item);
  };
  const unitOptions = Suggestions.knownUnits().map(value => ({ value, label: value }));
  const categoryOptions = Suggestions.knownCategories().map(value => ({ value, label: value }));
  const vendorOptions = Suggestions.vendors().map(v => ({ value: v.name, label: v.name }));
  const category = categorie;
  // Un champ tapé depuis n'est plus « à saisir » (le brouillon fait foi). Sans fiche liée, le produit n'a pas été reconnu : un mot près du nom.
  const aSaisir = (champ: ChampEcrit) => manque.includes(champ) && estVide(draft, champ as keyof StockItem);
  const nonReconnu = manque.length > 0 && !ficheDe(item);
  const attPubliee = attenuationPubliee(draft);
  // Choix B (voie n1-nom-fr) : les noms imprimés de l'article sur les factures, en petit sous « Nom » ; jamais le nom de l'article lui-même ; lecture seule.
  const nomsFacture = (draft.nomsFacture ?? []).filter(nom => nom.trim() && !memeNom(nom, draft.name)); // la même égalité que l'écriture (N2, N4) : `memeNom`
  const ouvrirEdition = () => { setMenu(false); setEdition(true); window.setTimeout(() => document.getElementById('stock-edit')?.scrollIntoView({ block: 'start' }), 0); };

  // ---- l'en-tête de la page : nom, repères, quantité, barre ----
  const alphas = lots.map(l => l.alpha).filter((a): a is number => a !== null);
  const repere = houblon
    ? (alphas.length === 0 ? 'α ?' : Math.min(...alphas) === Math.max(...alphas) ? `α ${nombreFr(alphas[0], 2)} %` : `α ${nombreFr(Math.min(...alphas), 2)} – ${nombreFr(Math.max(...alphas), 2)} %`)
    : malt ? (typeof item.colorEbc === 'number' ? `EBC ${nombreFr(item.colorEbc, 1)}` : 'EBC ?') : null;
  const nomAffiche = item.name.replace(/\s+bis\b.*$/i, '').trim() || item.name;
  const uniteLue = unite === 'sachet' && (total ?? 0) > 1 ? 'sachets' : unite;
  const etat: { txt: string; ton: 'att' | 'rouge' | 'neutre' } | null =
    total === 0 ? { txt: 'épuisé', ton: 'rouge' }
      : manqueNet !== null && manqueNet > 0 ? { txt: `manque ${quantiteArticle(manqueNet, unite)}`, ton: 'att' }
        : manqueAuMoins !== null ? { txt: `manque au moins ${quantiteArticle(manqueAuMoins, unite)}`, ton: 'att' }
          : besoin === null ? { txt: 'besoin inconnu', ton: 'neutre' }
            : total !== null && seuilFixe !== null && total <= seuilFixe ? { txt: total === seuilFixe ? 'au seuil' : 'sous le seuil', ton: 'att' } : null;
  const hautBarre = Math.max(total ?? 0, seuilFixe ?? 0, besoin ?? 0) * 1.12;
  const pc = (v: number) => `${(100 * v / (hautBarre || 1)).toFixed(2)}%`;
  const sachets = unite === 'sachet' && total !== null && Number.isInteger(total) && Math.max(total, seuilFixe ?? 0, besoin ?? 0) <= 24;
  const ariaBarre = `${quantiteArticle(total, unite)} en stock${seuilFixe !== null ? `, seuil ${quantiteArticle(seuilFixe, unite)}` : ', sans seuil'}${besoin ? `, besoin ${quantiteArticle(besoin, unite)}` : ''}`;

  const barre = total === null
    ? <p className="sfp-vide-m" data-stock-inconnu>Quantité à compter : le stock de cet article est illisible.</p>
    : sachets
      ? <div className="sfp-sacs" data-barre="sachets" role="img" aria-label={ariaBarre}>
        {Array.from({ length: Math.max(total, seuilFixe ?? 0, besoin ?? 0) }, (_, i) => i + 1).map(i => <React.Fragment key={i}>
          <svg className={`sfp-sac ${i <= total ? 'sfp-plein' : 'sfp-vide'}`} viewBox="0 0 22 28" aria-hidden="true"><path d="M3 4h16l-1 21H4z"/><path d="M3 4l2-2h12l2 2" fill="none"/></svg>
          {seuilFixe !== null && i === seuilFixe && <span className="sfp-stick" title="seuil"/>}</React.Fragment>)}
        <span className="sfp-saclab">{seuilFixe !== null ? <>seuil {quantiteArticle(seuilFixe, unite)}</> : 'sans seuil'}</span>
      </div>
      : <>
        <div className={`sfp-bar${plusieursLots ? ' sfp-blots' : ''}`} data-barre="stock" role="img" aria-label={ariaBarre}>
          {plusieursLots
            ? (() => { let x = 0; return lots.map((l, i) => { const debut = x; x += Number.isFinite(l.stock) ? l.stock : 0; return <React.Fragment key={l.ref}>
              <span className={`sfp-seg${i ? ' sfp-sb' : ''}`} style={{ left: pc(debut), width: pc(Number.isFinite(l.stock) ? l.stock : 0) }}><b>{nombreSuisse(l.stock)}</b></span>
              {i < lots.length - 1 && <span className="sfp-cut" style={{ left: pc(x) }}/>}</React.Fragment>; }); })()
            : <span className="sfp-seg" style={{ left: 0, width: pc(total) }}/>}
          {manqueNet !== null && manqueNet > 0 && <span className="sfp-hole" style={{ left: pc(total), width: pc(manqueNet) }}/>}
          {seuilFixe !== null && <span className="sfp-tick" style={{ left: pc(seuilFixe) }}/>}
        </div>
        <div className="sfp-axe">
          {seuilFixe !== null ? <span style={{ left: pc(seuilFixe), transform: 'translateX(-50%)' }}>seuil {quantiteArticle(seuilFixe, unite)}</span> : <span style={{ left: 0 }}>sans seuil</span>}
          {besoin ? <span style={{ right: 0 }}>besoin {quantiteArticle(besoin, unite)}</span> : plusieursLots ? <span style={{ right: 0 }}>{famille.length} lots</span> : null}
        </div>
      </>;

  const supplier = item.supplier?.trim();
  const entrees = lots.map(l => l.entree).filter((d): d is string => d !== null);
  const infoEntree = entrees.length === 0 ? 'inconnue'
    : plusieursLots ? `${entrees.map(d => jourCourt(d, aujourdhui)).join(' et ')} · ${famille.length} lots`
      : `${jourCourt(entrees[0], aujourdhui)}${supplier ? ` · ${supplier}` : ''}`;
  const prix = prixLu(item.pricePerUnit, unite);
  const libelleLot = (l: Lot, i: number) => l.entree ? `Entré le ${jourCourt(l.entree, aujourdhui)}` : `Lot ${i + 1} · entrée inconnue`;
  const retourLibelle = `Stock · ${PLURIEL[categorie] ?? categorie}`;

  return <>
    <div ref={racine} role="dialog" aria-label={`Fiche ${nomAffiche}`} tabIndex={-1} className="sfp" data-fiche-page
      onKeyDown={e => { if (e.key === 'Escape' && !e.defaultPrevented && !(e.target as HTMLElement).closest('[role="combobox"],[aria-expanded="true"]')) { e.stopPropagation(); onClose(); } }}>
      <header className="sfp-entete">
        <button type="button" className="sfp-back" onClick={onClose} aria-label={`Retour au stock : ${retourLibelle}`}>
          <ArrowLeft size={20} aria-hidden="true"/><span className="sfp-rep"><Package size={18} aria-hidden="true"/></span>{retourLibelle}
        </button>
        <button type="button" className="sfp-ico sfp-plus" aria-label="Plus" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu(m => !m)}><MoreHorizontal size={20} aria-hidden="true"/></button>
        <button type="button" className="sfp-ico sfp-x" aria-label="Fermer la fiche" onClick={onClose}><X size={20} aria-hidden="true"/></button>
        {menu && <div className="sfp-menu" role="menu" aria-label="Plus">
          <button type="button" role="menuitem" aria-pressed={!!item.favorite} onClick={() => { onToggleFavorite(item); setMenu(false); }}>
            <Star size={16} aria-hidden="true" className={item.favorite ? 'fill-ebc-straw text-ebc-straw' : ''}/>{item.favorite ? 'Épinglé' : 'Épingler'}</button>
          <button type="button" role="menuitem" onClick={ouvrirEdition}><Pencil size={16} aria-hidden="true"/>Modifier la fiche</button>
          <button type="button" role="menuitem" data-danger disabled={Boolean(nonSuppression)} aria-describedby={nonSuppression ? 'stock-delete-blocked' : undefined}
            onClick={() => { setMenu(false); setConfirmDelete(true); }}><Trash2 size={16} aria-hidden="true"/>Supprimer</button>
          {nonSuppression && <p id="stock-delete-blocked" role="status" data-stock-suppression-bloquee>{nonSuppression}</p>}
        </div>}
      </header>

      <div className="sfp-defile"><main className="sfp-page">
        <div className="sfp-head">
          <div className="sfp-nomrow">
            <h1 className="sfp-nom">{nomAffiche}</h1>
            {repere && <span className="sfp-pas" data-repere>{malt && typeof item.colorEbc === 'number' && <span className="sfp-ebc" style={{ background: bandForEbc(item.colorEbc).swatch }}/>}{repere}</span>}
            {levure && <span className={`sfp-pas${dur ? (dur.perime ? ' sfp-rouge' : ' sfp-att') : ''}`} data-stock-durabilite={dur ? '' : undefined}>
              {item.yeastLot?.expiresOn ? <>DDM {toSwissDate(item.yeastLot.expiresOn)}{dur && <> · {dur.texte}</>}</> : 'DDM ?'}</span>}
          </div>
          <div className="sfp-sous">{categorie} · <button type="button" className="sfp-four" onClick={ouvrirEdition}>{supplier || 'fournisseur ?'}<ChevronRight size={14} aria-hidden="true"/></button></div>
          <div className="sfp-qrow">
            <span className="sfp-q">{total === null ? '?' : nombreSuisse(total)}</span><span className="sfp-t2">{uniteLue} en stock</span>
            {etat && <span className={`sfp-etat${etat.ton === 'att' ? ' sfp-att' : etat.ton === 'rouge' ? ' sfp-rouge' : ''}`} data-etat>{etat.txt}</span>}
          </div>
          {barre}
        </div>

        <div className="sfp-cols"><div>
          {plusieursLots && <div className="sfp-card"><section className="sfp-sec" aria-label="Lots">
            <h2 className="sfp-lab">Lots · le plus ancien d’abord <span>total {quantiteArticle(total, unite)}</span></h2>
            {lots.map((l, i) => <details key={l.ref} className="sfp-lot" open={i === 0} data-lot={l.ref}>
              <summary><span className={`sfp-dot${i ? ' sfp-d2' : ''}`}/><span><b>{libelleLot(l, i)}</b> <span className="sfp-t2">· {l.alpha === null ? 'α ?' : `α ${nombreFr(l.alpha, 2)} %`}</span></span>
                <span className="sfp-lotq">{quantiteArticle(l.stock, l.unite)}</span><ChevronDown size={18} aria-hidden="true"/></summary>
              <dl className="sfp-lotd">
                <dt>Article</dt><dd>{l.nom}</dd>
                {prixLu(famille.find(a => a.ref === l.ref)?.pricePerUnit, l.unite) && <><dt>Prix</dt><dd>{prixLu(famille.find(a => a.ref === l.ref)?.pricePerUnit, l.unite)}</dd></>}
                {l.factureId && onOpenTransaction && <><dt>Pièce</dt><dd><button type="button" onClick={() => onOpenTransaction(l.factureId as string)}>voir la facture du {jourCourt(l.entree, aujourdhui)}</button></dd></>}
              </dl></details>)}
          </section></div>}

          <div className="sfp-card"><section className="sfp-sec" aria-label="Besoin" data-stock-besoin>
            <h2 className="sfp-lab">Besoin <span>{sources.length === 0 ? 'aucun' : `${sommeSources === null ? 'inconnu' : quantiteArticle(sommeSources, unite)} · ${sources.length} ${sources.length === 1 ? 'source' : 'sources'}`}</span></h2>
            {sources.length > 0
              ? sources.map(s => <SourceLigne key={`${s.genre}:${s.id}`} s={s} unite={unite}/>)
              : <div className="sfp-vide-b"><CalendarDays size={18} aria-hidden="true"/><span>Aucun brassin planifié ni recette écrite n’en demande.</span></div>}
            {raisons.map(r => <p key={r} className="sfp-raison">{r}</p>)}
            {manqueNet !== null && manqueNet > 0 && <p data-stock-manque className="sfp-raison sfp-rouge">Manque {quantiteArticle(manqueNet, unite)}</p>}
            {recipeCheck && recipeCheck.comparison.stockItem?.ref === item.ref && <div className="sfp-raison" style={{ color: 'var(--sfp-t1)' }}>
              <p>Recette ouverte · {recipeCheck.recipeName} : besoin {recipeCheck.comparison.quantity === null || !recipeCheck.comparison.unit ? 'inconnu' : quantiteLue(recipeCheck.comparison.quantity, recipeCheck.comparison.unit)}
                {recipeCheck.comparison.shortage !== null && recipeCheck.comparison.unit ? ` · manque ${quantiteLue(recipeCheck.comparison.shortage, recipeCheck.comparison.unit)}` : ''}.</p>
              {recipeCheck.comparison.issue && <p>{recipeCheck.comparison.issue}</p>}
              <p className="sfp-t2">Cette prévision ne réserve pas le stock.</p>
            </div>}
            {houblon && onOpenHops && <button type="button" className="sfp-rempl" onClick={onOpenHops} data-remplacant><ArrowLeftRight size={18} aria-hidden="true"/><span><b>Remplaçants possibles</b> · dans l’outil houblons</span><ChevronRight size={16} aria-hidden="true"/></button>}
          </section></div>

          <StockFicheBouge nom={nomAffiche} famille={famille.map(a => ({ ref: a.ref, currentStock: a.currentStock, supplier: a.supplier }))} unite={unite}
            movements={movements} batches={batches} besoin={besoin} seuil={draft.minStock} aujourdhui={aujourdhui}
            onOpenTransaction={onOpenTransaction} onOpenBatch={onOpenBatch}/>
        </div><div>
          {onCorrect && <div className="sfp-card"><details className="sfp-sec sfp-cord" open data-corriger>
            <summary className="sfp-lab sfp-cors">Corriger le stock · il en reste <span>écrit un mouvement <ChevronDown size={16} aria-hidden="true"/></span></summary>
            <section aria-label="Corriger le stock">
              {plusieursLots && <div className="sfp-seg2" role="group" aria-label="Lot à corriger">{lots.map((l, i) => <button type="button" key={l.ref} aria-pressed={l.ref === lotRef}
                onClick={() => { setLotRef(l.ref); setCompte(null); }}>{l.entree ? `Lot du ${jourCourt(l.entree, aujourdhui)}` : `Lot ${i + 1}`}</button>)}</div>}
              <div className="sfp-cpt" style={{ marginTop: plusieursLots ? 8 : 0 }}>
                <label className="sfp-inp" data-invalide={verdict && !verdict.ok ? '' : undefined}>
                  <NumberInput id="stock-compte" aria-label="Il en reste" value={valeur} min={0} emptyValue={undefined} onValue={v => setCompte(v)} className=""/>
                  <i>{lotItem.unit}</i></label>
                <span className="sfp-delta" aria-live="polite">avant <b>{quantiteArticle(lotItem.currentStock, lotItem.unit)}</b> · <span data-delta>
                  {valeur === undefined ? 'à saisir' : arrondi(valeur - lotItem.currentStock) === 0 ? 'sans changement' : variation(arrondi(valeur - lotItem.currentStock))}</span></span>
              </div>
              <div className="sfp-pasr">{pas.map(d => <button type="button" key={d} onClick={() => poser((valeur ?? lotItem.currentStock) + d)}>{variation(d)}</button>)}</div>
              <div className="sfp-seg2" role="group" aria-label="Motif" style={{ marginTop: 8 }}>
                {([['comptage', 'Compté'], ['perte', 'Perte'], ['autre', 'Autre']] as [Motif, string][]).map(([code, label]) =>
                  <button type="button" key={code} aria-pressed={motif === code} onClick={() => setMotif(code)}>{label}</button>)}
              </div>
              {motif === 'autre' && <div className="sfp-seg2" role="group" aria-label="Autre motif" style={{ marginTop: 6 }}>
                {AUTRES.map(a => <button type="button" key={a.code} aria-pressed={autre === a.code} onClick={() => setAutre(a.code)}>{a.label}</button>)}</div>}
              {verdict && 'refus' in verdict && correctionTouchee && <p className="sfp-err" role="alert">{verdict.refus}</p>}
              <p className="sfp-note">{correctionTouchee ? 'Enregistre pour écrire le mouvement dans « Ce qui a bougé ».' : 'Aucune correction en cours.'}</p>
            </section></details></div>}

          <div className="sfp-card">
            <section className="sfp-sec" aria-label="Seuil">
              <h2 className="sfp-lab">Seuil · facultatif</h2>
              <div className="sfp-seuil"><label className="sfp-inp" data-invalide={seuilErreur ? '' : undefined}>
                <NumberInput id="stock-min" aria-label={`Seuil minimum (${draft.unit})`} value={draft.minStock} min={0} emptyValue={undefined} placeholder="aucun" aria-invalid={!seuil.ok}
                  onValue={minStock => setDraft({ ...draft, minStock })} className=""/><i>{draft.unit}</i></label>
                <p>{seuilFixe !== null ? 'alerte « bas » sous ce niveau' : 'sans seuil : aucune alerte inventée'}</p></div>
              {seuilErreur && <p className="sfp-err" role="alert">{seuilErreur}</p>}
            </section>
            <section className="sfp-sec" aria-label="Fiche">
              <h2 className="sfp-lab">Fiche</h2>
              <dl>
                <div className="sfp-info"><dt>Fournisseur</dt><dd>{supplier ? <button type="button" onClick={ouvrirEdition}>{supplier}<ChevronRight size={14} aria-hidden="true"/></button> : <span>inconnu</span>} <span className="sfp-t2">· <button type="button" onClick={ouvrirEdition} style={{ fontWeight: 400 }}>changer</button></span></dd></div>
                {levure && <div className="sfp-info"><dt>DDM</dt><dd>{item.yeastLot?.expiresOn ? toSwissDate(item.yeastLot.expiresOn) : 'inconnue'}</dd></div>}
                <div className="sfp-info"><dt>Dernier prix</dt><dd>{prix ?? 'inconnu'}</dd></div>
                <div className="sfp-info"><dt>Entrée</dt><dd>{infoEntree}</dd></div>
              </dl>
            </section>
          </div>

          <div className="sfp-card"><details id="stock-edit" className="sfp-sec sfp-edit" open={edition} onToggle={e => setEdition((e.currentTarget as HTMLDetailsElement).open)}>
            <summary>Modifier la fiche<ChevronDown size={18} aria-hidden="true"/></summary>
        <FormNav className="stock-form space-y-2" onSubmit={save}>
          <Field label="Nom" htmlFor="stock-label" error={draft.name.trim() ? undefined : 'Indiquez le nom de l’article.'}>
            <TextInput id="stock-label" name="stock_sheet_item_label" required aria-invalid={!draft.name.trim()} value={draft.name} onChange={name => setDraft({ ...draft, name })}/>
          </Field>
          {nonReconnu && <p data-stock-non-reconnu className="-mt-1 text-xs text-attention">non reconnu</p>}
          {nomsFacture.length > 0 && <p data-stock-noms-facture className="-mt-1 text-xs text-cave-400">Sur la facture : {nomsFacture.join(' · ')}</p>}
          <div className="grid grid-cols-2 gap-2">
            <Field label="Catégorie" htmlFor="stock-category">
              <Combobox id="stock-category" ariaLabel="Catégorie" value={draft.category} onChange={category => setDraft({ ...draft, category })}
                options={categoryOptions} placeholder="Malt, Houblon…" allowCreate onCreate={category => setDraft({ ...draft, category })}/>
            </Field>
            <Field label="Unité" htmlFor="stock-unit" error={uniteRefus || undefined}>
              <Combobox id="stock-unit" ariaLabel="Unité" value={draft.unit} onChange={changeUnit}
                options={unitOptions} placeholder="kg, g…" allowCreate onCreate={changeUnit}/>
              {uniteNote && !uniteRefus && <p data-stock-unite-note className="mt-1 text-xs text-cave-400">{uniteNote}</p>}
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label={`Seuil minimum (${draft.unit})`} htmlFor="stock-min" error={seuilErreur}>
              <NumberInput id="stock-min" value={draft.minStock} min={0} emptyValue={undefined} placeholder="Inconnu" aria-invalid={!seuil.ok} onValue={minStock => setDraft({ ...draft, minStock })} className={inputClass}/>
            </Field>
            <Field label="Fournisseur" htmlFor="stock-vendor">
              <Combobox id="stock-vendor" ariaLabel="Fournisseur" value={draft.supplier || ''} onChange={supplier => setDraft({ ...draft, supplier })}
                options={vendorOptions} placeholder="Choisir…" allowCreate onCreate={supplier => setDraft({ ...draft, supplier })}/>
            </Field>
          </div>

          {technical && <details className="border-y border-cave-800 py-1">
            <summary className="text-cave-200">Caractéristiques techniques
              {category === 'Houblon' && draft.alphaPct != null && <span className="text-cave-400"> · α {nombreFr(draft.alphaPct, 2)} %</span>}
              {malt && draft.colorEbc != null && <span className="text-cave-400"> · {nombreFr(draft.colorEbc, 1)} EBC</span>}
              {manque.some(c => aSaisir(c)) && <span data-a-saisir="resume" className="text-attention"> · {MOT_A_SAISIR}</span>}
            </summary>
            <div className="space-y-2 pt-1 pb-2">
              {category === 'Houblon' && <Field label="Acide alpha (%)" htmlFor="stock-alpha">
                <NumberInput id="stock-alpha" value={draft.alphaPct} min={0} max={100} emptyValue={undefined}
                  onValue={alphaPct => setDraft({ ...draft, alphaPct })} className={inputClass}/>
                {aSaisir('alphaPct') && <ASaisir champ="alphaPct"/>}
              </Field>}
              {malt && <div className="grid grid-cols-2 gap-2">
                <Field label="Couleur (EBC)" htmlFor="stock-ebc">
                  <NumberInput id="stock-ebc" value={draft.colorEbc} min={0} emptyValue={undefined}
                    onValue={colorEbc => setDraft({ ...draft, colorEbc })} className={inputClass}/>
                  {aSaisir('colorEbc') && <ASaisir champ="colorEbc"/>}
                </Field>
                <Field label="Potentiel (PPG)" htmlFor="stock-ppg">
                  <NumberInput id="stock-ppg" value={draft.potentialPpg} min={0} emptyValue={undefined}
                    onValue={potentialPpg => setDraft({ ...draft, potentialPpg })} className={inputClass}/>
                  {aSaisir('potentialPpg') && <ASaisir champ="potentialPpg"/>}
                </Field>
              </div>}
              {category === 'Levure' && <>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Laboratoire" htmlFor="stock-lab"><TextInput id="stock-lab" name="stock_sheet_yeast_lab" value={draft.yeastLab ?? ''} onChange={yeastLab => setDraft({ ...draft, yeastLab })}/>{aSaisir('yeastLab') && <ASaisir champ="yeastLab"/>}</Field>
                  <Field label="Souche" htmlFor="stock-strain"><TextInput id="stock-strain" name="stock_sheet_yeast_strain" value={draft.yeastStrain ?? ''} onChange={yeastStrain => setDraft({ ...draft, yeastStrain })}/></Field>
                </div>
                <DateField label="À utiliser avant (DDM)" shortcuts={[]} value={toSwissDate(draft.yeastLot?.expiresOn ?? '')}
                  hint={durabilite.statut === 'perime' ? undefined : 'Sans date, aucune alerte de péremption.'}
                  error={durabilite.statut === 'perime' ? 'Sachet périmé : ne le brasse pas sans l’avoir testé.' : undefined}
                  onChange={swiss => { const expiresOn = toIsoDate(swiss) || undefined; setDraft({ ...draft, yeastLot: { ...(draft.yeastLot ?? {}), expiresOn } }); }}/>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Atténuation (%)" htmlFor="stock-att"><NumberInput id="stock-att" value={draft.yeastAttenuationPct} min={0} max={100} emptyValue={undefined} onValue={yeastAttenuationPct => setDraft({ ...draft, yeastAttenuationPct })} className={inputClass}/>{aSaisir('yeastAttenuationPct') && <ASaisir champ="yeastAttenuationPct" indication={attPubliee}/>}</Field>
                  <Field label="Temp. mini (°C)" htmlFor="stock-tmin"><NumberInput id="stock-tmin" value={draft.yeastTempMinC} emptyValue={undefined} onValue={yeastTempMinC => setDraft({ ...draft, yeastTempMinC })} className={inputClass}/>{aSaisir('yeastTempMinC') && <ASaisir champ="yeastTempMinC"/>}</Field>
                  <Field label="Temp. maxi (°C)" htmlFor="stock-tmax"><NumberInput id="stock-tmax" value={draft.yeastTempMaxC} emptyValue={undefined} onValue={yeastTempMaxC => setDraft({ ...draft, yeastTempMaxC })} className={inputClass}/>{aSaisir('yeastTempMaxC') && <ASaisir champ="yeastTempMaxC"/>}</Field>
                </div>
              </>}
            </div>
          </details>}
        </FormNav>
          </details></div>
        </div></div>
      </main></div>

      <div className="sfp-pied">
        {onCommander && <button type="button" className="sfp-b2" onClick={onCommander}><ShoppingCart size={18} aria-hidden="true"/>Commander</button>}
        <button type="button" className="sfp-b1" disabled={!canSave || !correctionOk} onClick={save}>Enregistrer</button>
      </div>
    </div>
    <ConfirmSheet open={confirmDelete} onClose={() => setConfirmDelete(false)}
      onConfirm={() => { onDelete(item); setConfirmDelete(false); onClose(); }} title="Supprimer cet article ?"
      what={`${item.name} — ${quantiteArticle(item.currentStock, item.unit)} en stock`}
      consequence="L’article disparaît du catalogue. Les écritures d’achat qui le mentionnent sont conservées, mais elles ne pourront plus être annulées avec restauration du stock."
      confirmLabel="Supprimer l’article"/>
  </>;
};
