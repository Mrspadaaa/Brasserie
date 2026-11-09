/**
 * Chercher (c6b, choisie le 09.11) : le champ, une ligne de résumé, les puces des filtres, la carte de la levure tapée
 * et la liste rangée « vendue CH · FR · DE », « fabricant présent en Europe », « rare en Europe » ; les 18 filtres dans
 * une feuille à index. Aucune règle ici : les comptes, l'ordre, la disponibilité, les repères et les « non documentées »
 * viennent de l'API du domaine (`src/domain/levure`). Ce fichier porte aussi les pièces que Comparer et Suggérer
 * reprennent (pastilles, disponibilité, « ⌕ chercher », pistes), une seule copie.
 * Classes `lvv-` (L26), jetons du thème `--cave-*` (clair et cave).
 */
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronDown, Factory, Globe, Plus, Search, SlidersHorizontal, Store, X } from 'lucide-react';
import type { YeastReference } from '../../domain/yeastReferences';
import type {
  ApiLevure, Disponibilite, EtatFiltres, IdAxe, IdFiltre, Niveau, RangDisponibilite, ReperesRecette, ResultatRecherche, ValeurAxe,
} from '../../domain/levure/contrat';
import { jetonArome, jetonDeAxe } from '../../domain/levure/couleurs';
import supplyProduits from '../../data/yeastSupplyBootstrap.json';
import { Sheet } from '../Sheet';
import type { PropsVue } from './props';
import { CelluleRecherche, useEtatRecherche } from './useRechercheDonnee';
import './vues.css';

/* ───────────── pièces communes aux trois vues ───────────── */

/** L'API se passe en prop pour les tests et le banc ; sinon, celle du domaine (d1). `stockIds` : les levures en stock, pour le filtre « En stock chez moi ». */
export type PropsAvecApi = PropsVue & { api?: ApiVue; stockIds?: readonly string[] };
/** L'API du contrat (`documente` et `trouver` y sont) ; `chercher` rend aussi `tapee`, la levure tapée, et prend les ids du stock. */
export type ApiVue = Omit<ApiLevure, 'chercher'> & {
  chercher(requete: string, filtres: EtatFiltres, reperes?: ReperesRecette, contexte?: { stockIds?: readonly string[] }): ResultatRecherche & { tapee?: YeastReference };
};
// L'API de d1 est trouvée à la compilation (comme dans domaine.ts) : aucun import d'un fichier qui pourrait manquer.
const modulesDomaine = import.meta.glob('../../domain/levure/index.ts', { eager: true }) as Record<string, Record<string, unknown>>;
const estApi = (v: unknown): v is ApiVue => !!v && typeof v === 'object' && typeof (v as ApiVue).chercher === 'function' && typeof (v as ApiVue).suggerer === 'function';
const apiReelle: ApiVue | undefined = Object.values(modulesDomaine).flatMap((m) => Object.values(m)).find(estApi);
export const apiDe = (api?: ApiVue): ApiVue => {
  const a = api ?? apiReelle;
  if (!a) throw new Error("Domaine levure absent : src/domain/levure/index.ts n'est pas livré.");
  return a;
};

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');
/** Milliers à l'espace insécable : « 1 339 ». */
export const mil = (n: number) => new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const premiereMajuscule = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);

/** Le stock au relevé, dit tel quel : « relevé du 27.09 · stock ? », « en stock au relevé du 27.09 » ; jamais une rupture datée. */
export function texteStock(d: Disponibilite): string {
  const m = /^\d{4}-(\d{2})-(\d{2})/.exec(d.stock?.releveLe ?? '');
  const date = m ? `${m[2]}.${m[1]}` : undefined;
  if (d.stock?.statut === 'en-stock') return date ? `en stock au relevé du ${date}` : 'en stock';
  if (d.stock?.statut === 'epuise') return date ? `épuisée au relevé du ${date}` : 'épuisée au dernier relevé';
  return date ? `relevé du ${date} · stock ?` : 'stock ?';
}

/** « épuisée au relevé du 27.09 » : le stock au dernier relevé des offres (`Disponibilite.stock`, d1) ; jamais une rupture datée ni « indisponible ». */
export function texteEpuisee(d: Disponibilite): string | undefined {
  if (d.rang !== 'ici' || d.stock?.statut !== 'epuise') return undefined;
  const m = /^\d{4}-(\d{2})-(\d{2})/.exec(d.stock.releveLe);
  return m ? `épuisée au relevé du ${m[2]}.${m[1]}` : 'épuisée au dernier relevé';
}

/** « sèche » ou « liquide » : la forme de la référence, sinon celle de la fiche de travail de d1 quand l'API la porte. */
const produitsParRef = new Map<string, string[]>();
for (const p of (supplyProduits as { products: Array<{ referenceId: string; form?: string }> }).products) if (p.form) produitsParRef.set(p.referenceId, [...(produitsParRef.get(p.referenceId) ?? []), p.form]);
export const formeDe = (api: ApiVue, l: YeastReference): string | undefined => {
  if (l.form) return l.form === 'levain' ? undefined : l.form;
  const f = (api as unknown as { contexte?: { fiche(x: YeastReference): { forme: string | null } } }).contexte?.fiche(l).forme;
  if (f === 'seche') return 'sèche';
  if (f === 'liquide') return 'liquide';
  // Sans forme sur la fiche : celle du produit vendu (offres du dépôt, `yeastSupplyBootstrap`), seulement s'il n'y en a qu'une.
  const formes = new Set(produitsParRef.get(l.id) ?? []);
  return formes.size === 1 ? [...formes][0] : undefined;
};

export const fabricantDe = (l: YeastReference): string | undefined => l.catalogue?.manufacturer || undefined;
/** Le nom propre : sans ®, ™, sans le « (Fabricant) » final, « Fabricant · Produit » écrit « Fabricant Produit ». */
export const nomLong = (l: YeastReference): string => l.name.replace(/[®™]/g, '').replace(/\s*\([^)]*\)\s*$/, '').replace(/\s·\s/g, ' ').trim();
/** Le nom sans le préfixe de marque : « SafAle US-05 » → « US-05 », « Wyeast · 1056 American Ale » → « 1056 American Ale ». */
export const nomCourt = (l: YeastReference): string => nomLong(l).replace(/^(SafAle|SafLager|SafSpirit|LalBrew|Lallemand Brewing|Lallemand|Wyeast|Fermentis|White Labs|WLP|Imperial|Omega|Mangrove Jack's|BSI)\s+/i, '');
/** Le fabricant s'ajoute au nom seulement quand le nom ne le dit pas déjà. */
export const fabricantUtile = (l: YeastReference): string | undefined => {
  const f = fabricantDe(l);
  return f && !norm(l.name).includes(norm(f)) ? f : undefined;
};

const NIVEAU_MOT: Record<Niveau, string> = { faible: 'faibles', moyen: 'moyens', eleve: 'élevés' };
export const ORDRE_NIVEAU: Record<Niveau, number> = { faible: 0, moyen: 1, eleve: 2 };
export const AROMES: IdAxe[] = ['esters', 'phenols', 'thiols', 'terpenes'];
/** La couleur d'un effet : la famille d'arôme du descripteur lu (les jetons des houblons, une seule table), sinon celle de l'axe. */
export function styleArome(id: IdAxe, v: ValeurAxe | null): CSSProperties | undefined {
  const jeton = v?.mots?.map(jetonArome).find((j) => !!j) ?? jetonDeAxe(id);
  return jeton ? ({ ['--c' as string]: jeton.base } as CSSProperties) : undefined;
}

/** Une plage lue, écrite « 16–22 » (la virgule suisse, jamais « . »). */
const nb = (x: number) => String(Math.round(x * 10) / 10).replace('.', ',');
export const textePlage = (p: { min: number; max: number }) => (p.min === p.max ? nb(p.min) : `${nb(p.min)}–${nb(p.max)}`);
export const pct = (v: number, lo: number, hi: number) => `${(Math.max(0, Math.min(1, (v - lo) / (hi - lo))) * 100).toFixed(1)}%`;

export const Ico = ({ de: De, t = 14, className }: { de: typeof Search; t?: number; className?: string }) => (
  <De size={t} strokeWidth={2} aria-hidden="true" className={cx('lvv-i', className)} />
);

/** Disponibilité : l'API la rend, la pastille la dit. « vendue en CH · FR · DE », « fabricant présent en Europe », « rare en Europe ». */
/** Les titres de rayon à 390 (CSS : `data-court`) ; le titre long reste dans `title` et à partir de 641 px. */
export const TITRE_COURT: Record<RangDisponibilite, string> = { ici: 'Ici · CH FR DE', europe: 'Europe', rare: 'Rare' };
export const TITRE_RANG: Record<RangDisponibilite, string> = { ici: 'Vendue CH · FR · DE', europe: 'Fabricant présent en Europe', rare: 'Rare en Europe' };
export function Dispo({ d, court = true }: { d: Disponibilite; court?: boolean }) {
  const icone = d.rang === 'ici' ? Store : d.rang === 'europe' ? Factory : Globe;
  const texte = d.rang === 'ici'
    ? (d.pays?.length ? d.pays.join(' ') : 'CH · FR · DE')
    : d.rang === 'europe' ? (court ? 'Europe' : 'fabricant présent en Europe') : (court ? 'rare' : 'rare en Europe');
  return <span className={cx('lvv-dispo', `lvv-dispo-${d.rang}`)}><Ico de={icone} t={12} />{texte}</span>;
}

/** « ⌕ chercher » : une donnée non documentée. Un toucher appelle onChercherDonnee, rien d'autre (jamais de recherche seule). */
export function NonDoc({ levure, axe, texte, onChercherDonnee, className }: {
  levure: YeastReference; axe: string; texte: string; onChercherDonnee?: PropsVue['onChercherDonnee']; className?: string;
}) {
  const { etat } = useEtatRecherche(levure.id, axe);
  if (etat) return <span className="lvv-nd-etat"><CelluleRecherche levureId={levure.id} axe={axe} /></span>;
  return (
    <button type="button" className={cx('lvv-nd', className)} aria-label={`${texte} : chercher`}
      onClick={(e) => { e.stopPropagation(); onChercherDonnee?.(levure, axe); }}>
      <Ico de={Search} t={11} />{texte}
    </button>
  );
}

/** Les descripteurs d'une levure : un par axe d'arôme documenté, un « ⌕ … ? » pour ce qui manque. `ref` donne le « + » / « = » / « − ». */
export function PastillesAromes({ api, levure, ref, onChercherDonnee, compact = false }: {
  api: ApiVue; levure: YeastReference; ref?: YeastReference; onChercherDonnee?: PropsVue['onChercherDonnee']; compact?: boolean;
}) {
  const connus: ReactNode[] = [];
  const manques: IdAxe[] = [];
  for (const id of AROMES) {
    const v = api.valeurAxe(levure, id);
    if (!v || (!v.niveau && !v.mots?.length && !v.plage)) { manques.push(id); continue; }
    const libelle = (api.AXES.find((a) => a.id === id)?.libelle ?? id).split(' · ')[0].toLowerCase();
    // Une ligne garde le premier descripteur ; la carte de la levure tapée en garde deux.
    const texte = v.mots?.length ? v.mots.slice(0, compact ? 1 : 2).join(' · ') : v.niveau ? `${libelle} ${NIVEAU_MOT[v.niveau]}` : `${libelle} ${textePlage(v.plage!)}`;
    let signe = '';
    if (ref && ref.id !== levure.id) {
      const r = api.valeurAxe(ref, id);
      if (r?.niveau && v.niveau) signe = ORDRE_NIVEAU[v.niveau] > ORDRE_NIVEAU[r.niveau] ? '+' : ORDRE_NIVEAU[v.niveau] < ORDRE_NIVEAU[r.niveau] ? '−' : '=';
    }
    connus.push(
      <span key={id} className={cx('lvv-p', `lvv-ax-${id}`, v.estime && 'lvv-estime')} style={styleArome(id, v)} title={v.estime ? `${texte} (estimé)` : v.source?.libelle}>
        <i aria-hidden="true" />{signe && <b className="lvv-signe">{signe}</b>}{texte}
      </span>,
    );
  }
  const dashed: ReactNode[] = [];
  const houblon = manques.filter((m) => m === 'thiols' || m === 'terpenes');
  if (houblon.length === 2) dashed.push(<NonDoc key="h" levure={levure} axe="thiols" texte="houblon ?" onChercherDonnee={onChercherDonnee} />);
  else if (houblon.length === 1) dashed.push(<NonDoc key="h" levure={levure} axe={houblon[0]} texte={`${houblon[0] === 'thiols' ? 'thiols' : 'terpènes'} ?`} onChercherDonnee={onChercherDonnee} />);
  if (manques.includes('phenols')) dashed.push(<NonDoc key="p" levure={levure} axe="phenols" texte="épicé ?" onChercherDonnee={onChercherDonnee} />);
  if (manques.includes('esters') && !dashed.length) dashed.push(<NonDoc key="e" levure={levure} axe="esters" texte="arômes ?" onChercherDonnee={onChercherDonnee} />);
  const tout = compact ? [...connus.slice(0, 3), ...dashed.slice(0, 1)] : [...connus.slice(0, 4), ...dashed.slice(0, 2)];
  return tout.length ? <span className="lvv-pas">{tout}</span> : null;
}

/** La bande d'une plage sur une échelle : gauche et largeur en %, au moins 2,5 % pour rester visible. */
export const barre = (p: { min: number; max: number }, lo: number, hi: number) => ({
  left: pct(p.min, lo, hi),
  width: `${Math.max(2.5, (Math.min(1, (p.max - lo) / (hi - lo)) - Math.max(0, (p.min - lo) / (hi - lo))) * 100).toFixed(1)}%`,
});

/** Une piste : la bande de la levure, la bande « fantôme » de la levure de référence, le repère de la recette. */
export function Piste({ plage, fantome, repere, lo, hi, kind }: {
  plage?: { min: number; max: number }; fantome?: { min: number; max: number }; repere?: number; lo: number; hi: number; kind: 't' | 'a';
}) {
  return (
    <span className={cx('lvv-tr', kind === 't' ? 'lvv-tr-t' : 'lvv-tr-a')} aria-hidden="true">
      {fantome && <i className="lvv-g" style={barre(fantome, lo, hi)} />}
      {plage && <i className="lvv-b" style={barre(plage, lo, hi)} />}
      {repere !== undefined && <i className="lvv-cd" style={{ left: pct(repere, lo, hi) }} />}
    </span>
  );
}
export const T_LO = 10, T_HI = 30, A_LO = 65, A_HI = 90;
export const plageDe = (api: ApiVue, l: YeastReference, axe: IdAxe) => api.valeurAxe(l, axe)?.plage;

/** L'action d'une ligne déroulée : choisir pour la recette, poser dans Comparer. */
export function ActionsLigne({ levure, comparees, onChoisir, onComparees, desactiverComparer }: {
  levure: YeastReference; comparees: string[]; onChoisir: PropsVue['onChoisir']; onComparees: PropsVue['onComparees']; desactiverComparer?: boolean;
}) {
  const dedans = comparees.includes(levure.id);
  return (
    <span className="lvv-actions">
      <button type="button" className="lvv-btn lvv-btn-primaire" onClick={() => onChoisir(levure)}>Choisir pour ma recette</button>
      <button type="button" className="lvv-btn" aria-pressed={dedans} disabled={desactiverComparer && !dedans}
        onClick={() => onComparees(dedans ? comparees.filter((c) => c !== levure.id) : [...comparees, levure.id])}>
        {dedans ? <>Dans Comparer <X size={12} aria-hidden="true" /></> : <><Plus size={12} aria-hidden="true" /> Comparer</>}
      </button>
    </span>
  );
}

/* ───────────── filtres : libellés, bornes, phrase ───────────── */

/** Les filtres dont le champ n'est pas normalisé : leurs comptes se lisent « estimé » (c6b, retouche 2). */
const FILTRES_ESTIMES: IdFiltre[] = ['famille', 'effets', 'sansAlcool'];
type Bornes = { min: number; max: number };
const estPlage = (v: unknown): v is Bornes => !!v && typeof v === 'object' && !Array.isArray(v) && 'min' in (v as object);
const estPose = (f: EtatFiltres, id: IdFiltre) => {
  const v = f[id];
  return Array.isArray(v) ? v.length > 0 : estPlage(v) ? true : v === true;
};
/** Une option de plage : « 8:10 », « 8-10 », « 8–10 », « <8 », « ≥12 » (le format que d1 publie, lu avec tolérance). */
export function bornesDe(valeur: string): Bornes | null {
  const s = valeur.replace(/,/g, '.').replace(/\s/g, '');
  const n = '(-?\\d+(?:\\.\\d+)?)';
  let m = new RegExp(`^<=?${n}$`).exec(s);
  if (m) return { min: -Infinity, max: Number(m[1]) };
  m = new RegExp(`^(?:>=?|≥)${n}$`).exec(s);
  if (m) return { min: Number(m[1]), max: Infinity };
  m = new RegExp(`^${n}?[:–—-]${n}?$`).exec(s);
  if (m && (m[1] !== undefined || m[2] !== undefined)) return { min: m[1] === undefined ? -Infinity : Number(m[1]), max: m[2] === undefined ? Infinity : Number(m[2]) };
  m = new RegExp(`^${n}$`).exec(s);
  return m ? { min: Number(m[1]), max: Number(m[1]) } : null;
}
const texteBornes = (b: Bornes, unite = '') => {
  const u = unite ? ` ${unite}` : '';
  if (!Number.isFinite(b.min)) return `< ${nb(b.max)}${u}`;
  if (!Number.isFinite(b.max)) return `≥ ${nb(b.min)}${u}`;
  return `${textePlage(b)}${u}`;
};

/* ───────────── le composant ───────────── */

type Tri = 'proche' | 'prix' | 'attenuation' | 'temperature' | 'tolerance';
const TRIS: Array<[Tri, string]> = [['proche', 'proche'], ['prix', 'prix'], ['attenuation', 'atténuation'], ['temperature', '°C'], ['tolerance', 'tolérance']];
const PAS_DEPLIE: Record<RangDisponibilite, number> = { ici: 4, europe: 3, rare: 2 };

export function Chercher(props: PropsAvecApi) {
  const { reperes, comparees, onChoisir, onComparees, onChercherDonnee, stockIds } = props;
  const api = apiDe(props.api);
  const [requete, setRequete] = useState('');
  const [filtres, setFiltres] = useState<EtatFiltres>({});
  const [tri, setTri] = useState<Tri>('proche');
  const [ouverte, setOuverte] = useState(false);
  const [courant, setCourant] = useState<IdFiltre>(api.FILTRES[0]?.id ?? 'boisson');
  const [visibles, setVisibles] = useState<Record<RangDisponibilite, number>>(PAS_DEPLIE);
  const [deplie, setDeplie] = useState<string | null>(null);

  // Les repères se comparent par valeur : un parent qui les recrée à chaque rendu ne relance pas la recherche.
  const cleReperes = [reperes.temperatureC, reperes.abvVise, reperes.styleId, reperes.ogVisee].join('|');
  const cleStock = stockIds ? stockIds.join(',') : '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const contexte = useMemo(() => (stockIds ? { stockIds } : undefined), [cleStock]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const res = useMemo(() => api.chercher(requete, filtres, reperes, contexte), [api, requete, filtres, cleReperes, contexte]);
  const ref = res.tapee;
  const disp = useMemo(() => new Map(res.liste.map((l) => [l.id, api.disponibilite(l)] as const)), [api, res.liste]);

  const poses = api.FILTRES.filter((d) => (d.id === 'boisson' ? filtres.boisson !== undefined && estPose(filtres, 'boisson') : estPose(filtres, d.id)));
  const manquants = poses.length ? maxNonDoc(poses.map((d) => d.id), res) : undefined;
  const documente = (l: YeastReference, id: IdFiltre): boolean => api.documente(l, id);
  // Les vendues ici qui ne passent pas parce que la fiche ne dit rien du filtre le plus muet : en pâle, « ⌕ STA1 ? » (cadre 3 de c6b).
  // Elles ne comptent pas dans le total : l'inconnu n'est jamais un accord.
  const verifier = useMemo(() => {
    if (!manquants) return [] as YeastReference[];
    const sans = { ...filtres };
    delete sans[manquants.id];
    return api.chercher(requete, sans, reperes, contexte).liste.filter((l) => api.disponibilite(l).rang === 'ici' && documente(l, manquants.id) === false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, requete, filtres, manquants?.id, cleReperes, contexte]);

  const lignes = useMemo(() => {
    const groupes: Record<RangDisponibilite, YeastReference[]> = { ici: [], europe: [], rare: [] };
    for (const l of res.liste) groupes[disp.get(l.id)?.rang ?? 'rare'].push(l);
    if (tri !== 'proche') {
      const cle = (l: YeastReference): number | undefined => {
        if (tri === 'prix') return disp.get(l.id)?.prixMin?.montant;
        const p = plageDe(api, l, tri);
        return p ? (p.min + p.max) / 2 : undefined;
      };
      for (const r of Object.keys(groupes) as RangDisponibilite[]) {
        groupes[r] = groupes[r].map((l, i) => ({ l, i, k: cle(l) })).sort((x, y) => (x.k === undefined ? 1 : y.k === undefined ? -1 : tri === 'tolerance' ? y.k - x.k : x.k - y.k) || x.i - y.i).map((o) => o.l);
      }
    }
    return groupes;
  }, [res.liste, disp, tri, api]);
  const idsVerifier = new Set(verifier.map((l) => l.id));
  const ligneIci = [...lignes.ici, ...verifier.filter((l) => !lignes.ici.some((x) => x.id === l.id))];

  const parts = res.resume.split(' · ');
  const nomBoisson = parts[0] ?? 'bière';
  const total = res.total;
  const chips = chipsPoses(api, filtres, res);
  const retire = (id: IdFiltre, valeur?: string) => setFiltres((f) => {
    const n = { ...f };
    const v = n[id];
    if (valeur !== undefined && Array.isArray(v)) { const reste = v.filter((x) => x !== valeur); if (reste.length) n[id] = reste; else delete n[id]; } else delete n[id];
    return n;
  });

  const ouvrirFeuille = (id?: IdFiltre) => { if (id) setCourant(id); setOuverte(true); };
  const tr = reperes.temperatureC;
  const nPremier = (['ici', 'europe', 'rare'] as RangDisponibilite[]).map((r) => (r === 'ici' ? ligneIci.length : lignes[r].length));
  const premierRayon = nPremier.findIndex((n) => n > 0);

  return (
    <div className="lvv lvv-chercher" data-vue="chercher">
      <label className="lvv-champ">
        <Ico de={Search} t={16} />
        <input type="text" inputMode="search" enterKeyHint="search" autoComplete="off" value={requete} placeholder="Nom, fabricant ou code" aria-label="Nom, fabricant ou code"
          onChange={(e) => { setRequete(e.target.value); setVisibles(PAS_DEPLIE); }} />
        {requete && <button type="button" className="lvv-eff" aria-label="Effacer la recherche" onClick={() => setRequete('')}><X size={16} aria-hidden="true" /></button>}
      </label>

      {chips.length === 0 ? (
        <button type="button" className="lvv-res" data-booster="resume-une-ligne" onClick={() => ouvrirFeuille()} aria-label={`Filtres : ${res.resume}`}>
          <Ico de={SlidersHorizontal} t={16} />
          <Resume parts={parts} />
        </button>
      ) : (
        <div className="lvv-phr" data-booster="phrase-filtres">
          <b className="lvv-m">{mil(total)}</b>
          {chips.map((c, i) => (
            <span key={`${c.id}-${c.valeur ?? ''}`} className="lvv-phr-pas">
              <span className="lvv-mot">
                <button type="button" className="lvv-mot-t" onClick={() => ouvrirFeuille(c.id)}>{c.texte}</button>
                <button type="button" className="lvv-mot-x" aria-label={`Retirer ${c.texte}`} onClick={() => retire(c.id, c.valeur)}><X size={11} aria-hidden="true" /></button>
              </span>
              {i < chips.length - 1 && <span className="lvv-et" aria-hidden="true">·</span>}
            </span>
          ))}
        </div>
      )}

      {chips.length === 0 && (
        <div className="lvv-puc" data-booster="puces-defilantes" role="group" aria-label="Filtres">
          {api.FILTRES.filter((d) => d.rang === 'premier' && d.id !== 'boisson' && d.id !== 'disponibilite' && d.id !== 'stock').map((d) => (
            <button key={d.id} type="button" className={cx('lvv-pu', estPose(filtres, d.id) && 'lvv-on')} onClick={() => ouvrirFeuille(d.id)}>
              {libIndex(d)}{d.genre === 'choix' || d.genre === 'plage' ? <ChevronDown size={12} aria-hidden="true" /> : null}
            </button>
          ))}
          {api.FILTRES.filter((d) => d.rang === 'plus').slice(0, 2).map((d) => (
            <button key={d.id} type="button" className={cx('lvv-pu', estPose(filtres, d.id) && 'lvv-on')} onClick={() => ouvrirFeuille(d.id)}>{libIndex(d)}</button>
          ))}
        </div>
      )}

      {chips.length > 0 && (
        <>
          <span className="lvv-rep" role="img" aria-label={`vendue ici ${lignes.ici.length}, Europe ${lignes.europe.length}, rare ${lignes.rare.length}`} data-booster="compte-rayons">
            <i className="lvv-rep-ici" style={{ flex: Math.max(lignes.ici.length, 0.0001) }} /><i className="lvv-rep-eu" style={{ flex: Math.max(lignes.europe.length, 0.0001) }} /><i className="lvv-rep-rare" style={{ flex: Math.max(lignes.rare.length, 0.0001) }} />
          </span>
          <span className="lvv-leg"><span><i className="lvv-lg-ici" />vendue ici {lignes.ici.length}</span><span><i className="lvv-lg-eu" />Europe {lignes.europe.length}</span><span><i className="lvv-lg-rare" />rare {lignes.rare.length}</span></span>
        </>
      )}

      {manquants && (
        <button type="button" className="lvv-verif" data-booster="chercher-ia"
          onClick={() => { const l = verifier[0] ?? lignes.europe[0] ?? lignes.rare[0]; if (l) onChercherDonnee?.(l, manquants.id); }}>
          <Ico de={Search} t={12} />
          <span>{libelleFiltre(api, manquants.id)} non documentée <b className="lvv-m">{mil(manquants.n)}</b>{verifier.length > 0 && <> · dont <b className="lvv-m">{verifier.length}</b> vendues ici</>}</span>
          <span className="lvv-verif-a">chercher</span>
        </button>
      )}

      {ref && (
        <section className="lvv-us" data-booster="effets-us" aria-label={`Levure tapée : ${nomLong(ref)}`}>
          <button type="button" className="lvv-us-t" aria-expanded={deplie === ref.id} onClick={() => setDeplie(deplie === ref.id ? null : ref.id)}>
            <h2>{nomLong(ref)}</h2>
          </button>
          <div className="lvv-ligne">
            {formeDe(api, ref) && <span>{formeDe(api, ref)}</span>}
            {fabricantUtile(ref) && <span>{fabricantUtile(ref)}</span>}
            <Dispo d={api.disponibilite(ref)} court={false} />
            <OffreTexte d={api.disponibilite(ref)} />
          </div>
          <PastillesAromes api={api} levure={ref} onChercherDonnee={onChercherDonnee} />
          <div className="lvv-mes">
            <Mesure api={api} levure={ref} axe="temperature" libelle="°C" lo={T_LO} hi={T_HI} repere={tr} kind="t" onChercherDonnee={onChercherDonnee} />
            <Mesure api={api} levure={ref} axe="attenuation" libelle="atténuation" unite="%" lo={A_LO} hi={A_HI} kind="a" onChercherDonnee={onChercherDonnee} />
          </div>
          {deplie === ref.id && <ActionsLigne levure={ref} comparees={props.comparees} onChoisir={onChoisir} onComparees={onComparees} />}
        </section>
      )}

      {total === 0 && verifier.length === 0 ? (
        <p className="lvv-vide" role="status">Aucune levure ne correspond.{chips.length > 0 && <> <button type="button" className="lvv-lien" onClick={() => setFiltres({})}>Retirer les filtres</button></>}</p>
      ) : (
        <div className="lvv-tab" data-booster="pont">
          {(['ici', 'europe', 'rare'] as RangDisponibilite[]).map((rang, k) => {
            const liste = rang === 'ici' ? ligneIci : lignes[rang];
            if (!liste.length) return null;
            const montres = liste.slice(0, Math.max(visibles[rang], rang === 'ici' ? lignes.ici.length + verifier.length : 0));
            const reste = liste.length - montres.length;
            const titre = TITRE_RANG[rang];
            return (
              <section key={rang} className={cx('lvv-rayon', `lvv-rayon-${rang}`)} aria-label={titre}>
                <div className="lvv-th">
                  <h3 title={titre}>{rang === 'ici' ? <Ico de={Store} t={14} /> : rang === 'europe' ? <Ico de={Factory} t={14} /> : <Ico de={Globe} t={14} />}<span className="lvv-th-t" data-court={TITRE_COURT[rang]}><span className="lvv-t-long">{titre}</span><span className="lvv-m lvv-th-n">{mil(liste.length)}</span></span>{rang === 'ici' && verifier.length > 0 && <span className="lvv-badge">à vérifier</span>}</h3>
                  {k === premierRayon && <>
                    <span className="lvv-ax"><span>{T_LO}</span>{tr !== undefined ? <b className="lvv-r19">{nb(tr)}</b> : <b>°C</b>}<span>{T_HI}</span></span>
                    <span className="lvv-ax"><span>{A_LO}</span><b>%</b><span>{A_HI}</span></span>
                  </>}
                </div>
                {montres.map((l) => (
                  <LigneLevure key={l.id} api={api} levure={l} d={disp.get(l.id) ?? api.disponibilite(l)} ref={ref} reperes={reperes}
                    manques={idsVerifier.has(l.id) && manquants ? [{ id: manquants.id, libelle: libelleFiltre(api, manquants.id) }] : []}
                    posesBascule={poses.filter((d) => d.genre === 'bascule').map((d) => ({ id: d.id, libelle: d.libelle }))} deplie={deplie === l.id}
                    onBasculer={() => setDeplie(deplie === l.id ? null : l.id)} comparees={comparees}
                    onChoisir={onChoisir} onComparees={onComparees} onChercherDonnee={onChercherDonnee} />
                ))}
                {reste > 0 && (
                  <button type="button" className="lvv-sous" onClick={() => setVisibles((v) => ({ ...v, [rang]: v[rang] + 20 }))}>
                    <span>+ <b className="lvv-m">{mil(reste)}</b> {rang === 'rare' ? 'rares' : rang === 'europe' ? 'du fabricant européen' : 'vendues ici'}</span><span aria-hidden="true">›</span>
                  </button>
                )}
              </section>
            );
          })}
        </div>
      )}

      <Feuille
        api={api} ouverte={ouverte} onFermer={() => setOuverte(false)} courant={courant} onCourant={setCourant} filtres={filtres} onFiltres={setFiltres}
        res={res} reperes={reperes} tri={tri} onTri={setTri} vendues={lignes.ici.slice(0, 5)} nomBoisson={nomBoisson} onChercherDonnee={onChercherDonnee}
        avecStock={!!stockIds}
        premierNonDoc={(id) => [...ligneIci, ...lignes.europe, ...lignes.rare].find((l) => documente(l, id) === false)}
      />
    </div>
  );
}

/** La ligne de résumé de l'API, mise en forme : le premier mot en gras, les repères en rouge, le compte à droite. */
function Resume({ parts }: { parts: string[] }) {
  const aCompte = parts.length > 1 && /^[\d  \s.,]+$/.test(parts[parts.length - 1]);
  const compte = aCompte ? parts[parts.length - 1] : '';
  const mots = aCompte ? parts.slice(0, -1) : parts;
  let dansRepere = false;
  return (
    <span className="lvv-res-t">
      {mots.map((m, i) => {
        if (/^repères/i.test(m)) dansRepere = true;
        else if (dansRepere && !/^[\d.,]+\s?(°C|%|%\s?vol|g\/L)?$/.test(m)) dansRepere = false;
        return (
          <span key={i} className="lvv-res-p">
            {i > 0 && <span className="lvv-sep" aria-hidden="true">·</span>}
            {i === 0 ? <b>{m}</b> : <span className={dansRepere ? 'lvv-rp' : undefined}>{m}</span>}
          </span>
        );
      })}
      {compte && <span className="lvv-n lvv-m">{compte}</span>}
    </span>
  );
}

const OffreTexte = ({ d }: { d: Disponibilite }) => {
  if (d.rang !== 'ici') return d.stock ? <span className="lvv-offres">{texteStock(d)}</span> : null;
  const prix = d.prixMin ? ` · dès ${nb(d.prixMin.montant)} ${d.prixMin.devise}` : '';
  return <span className="lvv-offres">{d.offres} offre{d.offres > 1 ? 's' : ''}{prix}</span>;
};

function Mesure({ api, levure, axe, libelle, unite, lo, hi, repere, kind, onChercherDonnee }: {
  api: ApiVue; levure: YeastReference; axe: IdAxe; libelle: string; unite?: string; lo: number; hi: number; repere?: number; kind: 't' | 'a'; onChercherDonnee?: PropsVue['onChercherDonnee'];
}) {
  const p = plageDe(api, levure, axe);
  return (
    <div className="lvv-me">
      <span className="lvv-me-t">{libelle} {p ? <b className="lvv-m">{textePlage(p)}{unite ? ` ${unite}` : ''}</b> : <NonDoc levure={levure} axe={axe} texte="?" onChercherDonnee={onChercherDonnee} />}</span>
      <Piste plage={p} lo={lo} hi={hi} repere={repere} kind={kind} fantome={p} />
    </div>
  );
}

interface PropsLigne {
  api: ApiVue; levure: YeastReference; d: Disponibilite; ref?: YeastReference; reperes: ReperesRecette;
  manques: Array<{ id: IdFiltre; libelle: string }>; posesBascule: Array<{ id: IdFiltre; libelle: string }>; deplie: boolean; onBasculer: () => void;
  comparees: string[]; onChoisir: PropsVue['onChoisir']; onComparees: PropsVue['onComparees']; onChercherDonnee?: PropsVue['onChercherDonnee'];
}
/** Le libellé court d'un filtre pour l'index et les puces (« Tolérance à l'alcool » → « Tolérance »). */
const COURT_FILTRE: Partial<Record<IdFiltre, string>> = { tolerance: 'Tolérance', temperature: '°C', stock: 'En stock' };
const libIndex = (d: { id: IdFiltre; libelle: string }) => COURT_FILTRE[d.id] ?? d.libelle;
const courtFiltre = (libelle: string) => libelle.replace(/^sans\s+/i, '');
function LigneLevure({ api, levure, d, ref, reperes, manques, posesBascule, deplie, onBasculer, comparees, onChoisir, onComparees, onChercherDonnee }: PropsLigne) {
  const fab = fabricantUtile(levure);
  const pale = manques.length > 0;
  const t = plageDe(api, levure, 'temperature');
  const a = plageDe(api, levure, 'attenuation');
  const ft = ref ? plageDe(api, ref, 'temperature') : undefined;
  const fa = ref ? plageDe(api, ref, 'attenuation') : undefined;
  return (
    <div className={cx('lvv-row', pale && 'lvv-une lvv-row-pale', deplie && 'lvv-row-ouverte')} data-levure={levure.id}>
      <span className="lvv-nmw">
        <button type="button" className="lvv-nm" aria-expanded={deplie} onClick={onBasculer}>
          <span className={cx('lvv-nm-t', pale && 'lvv-pale')}>{nomCourt(levure)}</span>
          {fab && !pale && <small>{fab.replace(/ Brewing$/, '')}</small>}
          {d.rang === 'ici' && !pale ? <Dispo d={d} /> : null}
        </button>
        {pale && manques.map((m) => <NonDoc key={m.id} levure={levure} axe={m.id} texte={`${courtFiltre(m.libelle)} ?`} onChercherDonnee={onChercherDonnee} />)}
        {texteEpuisee(d) && <span className="lvv-ep lvv-ep-l">{texteEpuisee(d)}</span>}
      </span>
      <Piste plage={t} fantome={ft} repere={reperes.temperatureC} lo={T_LO} hi={T_HI} kind="t" />
      <Piste plage={a} fantome={fa} lo={A_LO} hi={A_HI} kind="a" />
      {!pale && (
        <span className="lvv-pas-l">
          <PastillesAromes api={api} levure={levure} ref={ref} compact onChercherDonnee={onChercherDonnee} />
          {posesBascule.map((b) => api.documente(levure, b.id) ? <span key={b.id} className="lvv-p lvv-ok"><i aria-hidden="true" />{premiereMajuscule(b.libelle)} · fiche</span> : null)}
        </span>
      )}
      {deplie && <ActionsLigne levure={levure} comparees={comparees} onChoisir={onChoisir} onComparees={onComparees} />}
    </div>
  );
}

/* ───────────── la phrase des filtres posés ───────────── */

interface ChipPose { id: IdFiltre; valeur?: string; texte: string }
function libelleFiltre(api: ApiVue, id: IdFiltre) { return courtFiltre(api.FILTRES.find((d) => d.id === id)?.libelle ?? id); }
function maxNonDoc(ids: IdFiltre[], res: ResultatRecherche): { id: IdFiltre; n: number } | undefined {
  let best: { id: IdFiltre; n: number } | undefined;
  for (const id of ids) { const n = res.comptes[id]?.nonDocumentees ?? 0; if (n > 0 && (!best || n > best.n)) best = { id, n }; }
  return best;
}
function chipsPoses(api: ApiVue, f: EtatFiltres, res: ResultatRecherche): ChipPose[] {
  const sortie: ChipPose[] = [];
  for (const d of api.FILTRES) {
    const v = f[d.id];
    if (v === undefined || v === false) continue;
    if (Array.isArray(v)) {
      for (const val of v) sortie.push({ id: d.id, valeur: val, texte: res.comptes[d.id]?.options.find((o) => o.valeur === val)?.libelle ?? val });
    } else if (estPlage(v)) {
      sortie.push({ id: d.id, texte: texteBornes(v, api.AXES.find((a) => a.id === d.id)?.unite) });
    } else if (v === true) {
      sortie.push({ id: d.id, texte: premiereMajuscule(d.libelle) });
    }
  }
  return sortie;
}

/* ───────────── la feuille : l'index des 18 filtres à gauche, le filtre touché à droite ───────────── */

interface PropsFeuille {
  api: ApiVue; ouverte: boolean; onFermer: () => void; courant: IdFiltre; onCourant: (id: IdFiltre) => void; filtres: EtatFiltres; onFiltres: (f: EtatFiltres) => void;
  res: ResultatRecherche; reperes: ReperesRecette; tri: Tri; onTri: (t: Tri) => void; vendues: YeastReference[]; nomBoisson: string;
  onChercherDonnee?: PropsVue['onChercherDonnee']; premierNonDoc: (id: IdFiltre) => YeastReference | undefined; avecStock: boolean;
}
const repereDe = (id: IdFiltre, r: ReperesRecette): number | undefined => id === 'temperature' ? r.temperatureC : id === 'tolerance' ? r.abvVise : undefined;

function Feuille({ api, ouverte, onFermer, courant, onCourant, filtres, onFiltres, res, reperes, tri, onTri, vendues, nomBoisson, onChercherDonnee, premierNonDoc, avecStock }: PropsFeuille) {
  const def = api.FILTRES.find((d) => d.id === courant);
  const premierPlus = api.FILTRES.findIndex((d) => d.rang === 'plus');
  const regle = (id: IdFiltre, v: EtatFiltres[IdFiltre] | undefined) => {
    const n = { ...filtres };
    if (v === undefined || v === false || (Array.isArray(v) && v.length === 0)) delete n[id]; else n[id] = v;
    onFiltres(n);
  };
  const nbPoses = api.FILTRES.filter((d) => d.id !== 'boisson' && estPose(filtres, d.id)).length;
  return (
    <Sheet open={ouverte} onClose={onFermer} title="Filtres" subtitle="● posé · ○ repère · ⌕ non documentées" className="lvv-feuille lg:max-w-xl lg:mx-auto"
      footer={
        <div className="lvv-ff">
          <div className="lvv-tri" data-booster="trier" role="group" aria-label="Trier">
            <span>Trier</span>
            {TRIS.map(([id, nom]) => <button key={id} type="button" className={cx(tri === id && 'lvv-on')} aria-pressed={tri === id} onClick={() => onTri(id)}>{nom}</button>)}
          </div>
          <div className="lvv-act">
            <span>{nbPoses === 0 ? `${nomBoisson} · aucun autre filtre` : `${nomBoisson} · ${nbPoses} filtre${nbPoses > 1 ? 's' : ''} posé${nbPoses > 1 ? 's' : ''}`}</span>
            <button type="button" className="lvv-prim" onClick={onFermer}>Voir <span className="lvv-m">{mil(res.total)}</span></button>
          </div>
        </div>
      }>
      <div className="lvv-fc">
        <nav className="lvv-idx" aria-label="Les filtres" data-booster="index-non-documentees">
          {api.FILTRES.map((d, i) => {
            const c = res.comptes[d.id];
            const pose = d.id === 'boisson' ? true : estPose(filtres, d.id);
            const rep = repereDe(d.id, reperes) !== undefined;
            const estime = FILTRES_ESTIMES.includes(d.id);
            return (
              <span key={d.id} className="lvv-idx-l">
                {i === premierPlus && premierPlus > 0 && <small>Plus de filtres</small>}
                <button type="button" data-filtre={d.id} aria-current={d.id === courant ? 'true' : undefined}
                  className={cx(d.id === courant && 'lvv-cur', c && c.nonDocumentees > 0 && c.options.length <= 2 && c.nonDocumentees > 1000 && 'lvv-peu')}
                  onClick={() => onCourant(d.id)}>
                  <span className="lvv-idx-nom">{libIndex(d)}</span>
                  {pose && <i className="lvv-pt" role="img" aria-label="posé" />}
                  {rep && !pose && <i className="lvv-irp" role="img" aria-label="repère" />}
                  {rep && pose && <i className="lvv-irp" role="img" aria-label="repère" />}
                  {d.id === 'stock' && !avecStock ? <em title="Le stock n'est pas relié à cette vue">—</em> : estime ? <em>estimé</em> : c && c.nonDocumentees > 0 ? <em><Search size={11} aria-hidden="true" />{mil(c.nonDocumentees)}</em> : <em title="rien à documenter ici">—</em>}
                </button>
              </span>
            );
          })}
        </nav>
        <div className="lvv-pan">
          {def && def.id === 'stock' && !avecStock && <p className="lvv-vide">Le stock de levures n'est pas relié à cette vue : ce filtre n'est pas disponible ici.</p>}
          {def && !(def.id === 'stock' && !avecStock) && <PanneauFiltre api={api} def={def} res={res} filtres={filtres} regle={regle} reperes={reperes} vendues={vendues} nomBoisson={nomBoisson}
            onChercherDonnee={onChercherDonnee} premierNonDoc={premierNonDoc} />}
        </div>
      </div>
    </Sheet>
  );
}

function PanneauFiltre({ api, def, res, filtres, regle, reperes, vendues, nomBoisson, onChercherDonnee, premierNonDoc }: {
  api: ApiVue; def: { id: IdFiltre; libelle: string; genre: 'choix' | 'plage' | 'bascule' }; res: ResultatRecherche; filtres: EtatFiltres; regle: (id: IdFiltre, v: EtatFiltres[IdFiltre] | undefined) => void;
  reperes: ReperesRecette; vendues: YeastReference[]; nomBoisson: string; onChercherDonnee?: PropsVue['onChercherDonnee']; premierNonDoc: (id: IdFiltre) => YeastReference | undefined;
}) {
  const c = res.comptes[def.id];
  const valeur = filtres[def.id];
  const axe = api.AXES.find((a) => a.id === def.id);
  const rep = repereDe(def.id, reperes);
  const cibleNd = c && c.nonDocumentees > 0 ? premierNonDoc(def.id) : undefined;
  return (
    <div className="lvv-pan-c" data-panneau={def.id}>
      <h3>{def.libelle}<small>fiches {nomBoisson}</small></h3>
      {def.genre === 'choix' && c && (
        <ul className="lvv-opts">
          {c.options.map((o) => {
            const choisies = Array.isArray(valeur) ? valeur : [];
            const parDefaut = def.id === 'boisson' && valeur === undefined && norm(o.libelle) === norm(nomBoisson);
            const sur = choisies.includes(o.valeur) || parDefaut;
            return (
              <li key={o.valeur}>
                <button type="button" role="checkbox" aria-checked={sur} className={cx('lvv-opt', sur && 'lvv-on')}
                  onClick={() => regle(def.id, parDefaut ? [o.valeur] : sur ? choisies.filter((x) => x !== o.valeur) : [...choisies, o.valeur])}>
                  <span className="lvv-case" aria-hidden="true">{sur ? '✓' : ''}</span><span>{o.libelle}</span><b className="lvv-m">{mil(o.n)}</b>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {def.genre === 'plage' && c && <Histogramme api={api} def={def} c={c} valeur={valeur} regle={regle} rep={rep} unite={axe?.unite} vendues={vendues} />}
      {def.genre === 'bascule' && (
        <button type="button" role="switch" aria-checked={valeur === true} className="lvv-lig lvv-lig-b" onClick={() => regle(def.id, valeur === true ? undefined : true)}>
          <span>{def.libelle}{c?.options[0] ? <b className="lvv-m lvv-lig-n"> {mil(c.options.find((o) => o.valeur === 'oui' || o.valeur === 'true')?.n ?? c.options[0].n)}</b> : null}</span><span className={cx('lvv-tog', valeur === true && 'lvv-tog-on')} aria-hidden="true" />
        </button>
      )}
      {c && c.nonDocumentees > 0 && (
        <button type="button" className="lvv-ndl" data-booster="chercher-ia" disabled={!cibleNd}
          onClick={() => cibleNd && onChercherDonnee?.(cibleNd, def.id)}>
          <Ico de={Search} t={12} /><span className="lvv-ndl-t">non documentée <b className="lvv-m">{mil(c.nonDocumentees)}</b></span>{cibleNd && <span className="lvv-ndl-a">chercher</span>}
        </button>
      )}
    </div>
  );
}

function Histogramme({ def, c, valeur, regle, rep, unite, vendues, api }: {
  api: ApiVue; def: { id: IdFiltre; libelle: string }; c: NonNullable<ResultatRecherche['comptes'][IdFiltre]>; valeur: EtatFiltres[IdFiltre] | undefined;
  regle: (id: IdFiltre, v: EtatFiltres[IdFiltre] | undefined) => void; rep?: number; unite?: string; vendues: YeastReference[];
}) {
  const cols = c.options.map((o) => ({ ...o, b: bornesDe(o.valeur) }));
  const nmax = Math.max(1, ...cols.map((o) => o.n));
  const posee = estPlage(valeur) ? valeur : undefined;
  const dans = (b: Bornes | null) => !!posee && !!b && b.min >= posee.min && b.max <= posee.max;
  const choisir = (i: number) => {
    const b = cols[i].b;
    if (!b) return;
    const sel = cols.map((o, j) => (j === i ? !dans(o.b) : dans(o.b)));
    const retenues = cols.filter((o, j) => sel[j] && o.b);
    if (!retenues.length) return regle(def.id, undefined);
    regle(def.id, { min: Math.min(...retenues.map((o) => o.b!.min)), max: Math.max(...retenues.map((o) => o.b!.max)) });
  };
  // Le repère de la recette sur les colonnes : dans la colonne qui le contient, au prorata.
  let xRep: number | undefined;
  if (rep !== undefined) {
    cols.forEach((o, i) => {
      const b = o.b;
      if (!b || xRep !== undefined) return;
      const voisinLo = cols[i + 1]?.b, voisinHi = cols[i - 1]?.b;
      const lo = Number.isFinite(b.min) ? b.min : b.max - (voisinLo ? voisinLo.max - voisinLo.min : 2);
      const hi = Number.isFinite(b.max) ? b.max : b.min + (voisinHi ? voisinHi.max - voisinHi.min : 2);
      if (rep >= lo && rep < hi) xRep = ((i + (rep - lo) / (hi - lo)) / cols.length) * 100;
    });
  }
  const basc = rep === undefined ? undefined
    : def.id === 'tolerance' ? { min: rep, max: Infinity } : { min: rep, max: rep };
  const bascOn = !!posee && !!basc && posee.min === basc.min && posee.max === basc.max;
  const echelle = useMemo(() => {
    const vals = vendues.map((l) => ({ l, p: plageDe(api, l, def.id as IdAxe) })).filter((x): x is { l: YeastReference; p: Bornes } => !!x.p);
    const nombres = [...vals.flatMap((x) => [x.p.min, x.p.max]), ...cols.flatMap((o) => (o.b ? [o.b.min, o.b.max] : [])), ...(rep !== undefined ? [rep] : [])].filter(Number.isFinite);
    if (!vals.length || !nombres.length) return null;
    const lo = Math.min(...nombres), hi = Math.max(...nombres), marge = Math.max(1, (hi - lo) * 0.12);
    return { vals, lo: lo - marge, hi: hi + marge };
  }, [vendues, cols, rep, api, def.id]);
  return (
    <>
      <div className="lvv-hist" data-booster="tolerance-histogramme" role="group" aria-label={`${def.libelle} : répartition des fiches`}>
        {cols.map((o, i) => (
          <button key={o.valeur} type="button" className={cx('lvv-col', dans(o.b) && 'lvv-on')} aria-pressed={dans(o.b)} disabled={!o.b}
            aria-label={`${o.libelle} : ${o.n} fiches`} onClick={() => choisir(i)}>
            <span className="lvv-col-b" style={{ height: `${Math.max(3, (o.n / nmax) * 100)}%` }}><small className="lvv-m">{mil(o.n)}</small></span>
          </button>
        ))}
        {xRep !== undefined && <i className="lvv-reperl" style={{ left: `${xRep}%` }}><i>≈ {nb(rep!)}{unite ? ` ${unite}` : ''} · ta bière</i></i>}
      </div>
      <div className="lvv-hax">{cols.map((o) => <span key={o.valeur} className="lvv-m">{o.libelle}</span>)}</div>
      {basc && (
        <button type="button" role="switch" aria-checked={bascOn} className="lvv-lig lvv-lig-b" onClick={() => regle(def.id, bascOn ? undefined : basc)}>
          <span>{def.id === 'tolerance' ? <>ne garder que ≥ {nb(rep!)}{unite ? ` ${unite}` : ''}</> : <>ne garder que ce qui couvre {nb(rep!)}{unite ? ` ${unite}` : ''}</>}</span>
          <span className={cx('lvv-tog', bascOn && 'lvv-tog-on')} aria-hidden="true" />
        </button>
      )}
      {echelle && (
        <div className="lvv-vi" data-booster="vendues-sur-echelle">
          <small><Store size={12} aria-hidden="true" /> vendues ici · fiche</small>
          {echelle.vals.map(({ l, p }) => (
            <span key={l.id}>
              <span className="lvv-vi-n">{nomCourt(l)}</span><b className="lvv-m">{textePlage(p)}</b>
              <i>
                {rep !== undefined && <em style={{ left: pct(rep, echelle.lo, echelle.hi) }} />}
                <u style={{ left: pct(p.min, echelle.lo, echelle.hi), width: `${Math.max(3, ((p.max - p.min) / (echelle.hi - echelle.lo)) * 100)}%` }} />
              </i>
            </span>
          ))}
        </div>
      )}
    </>
  );
}

export type { ValeurAxe };
