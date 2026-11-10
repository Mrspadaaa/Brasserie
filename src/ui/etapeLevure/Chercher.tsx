/**
 * Chercher (c6b, choisie le 09.11) : la recherche avancée commune (`src/ui/rechercheAvancee`), instanciée pour la levure. Le
 * champ, une ligne de résumé, les puces des filtres, la carte de la levure tapée et la liste rangée « vendue CH · FR · DE »,
 * « fabricant présent en Europe », « rare en Europe » ; les 18 filtres dans une feuille à index. Aucune règle ici : les comptes,
 * l'ordre, la disponibilité, les repères et les « non documentées » viennent de l'API du domaine (`src/domain/levure`, sur le
 * moteur de facettes commun). Ce fichier porte le catalogue de la levure (`catalogueLevure`) et les pièces que Comparer et
 * Suggérer reprennent (pastilles, disponibilité, « ⌕ chercher », pistes), une seule copie.
 * Classes `lvv-` (L26) pour les pièces de la levure, `ra-` pour la vue commune ; jetons du thème `--cave-*` (clair et cave).
 */
import { useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { Factory, Globe, Plus, Search, Store, X } from 'lucide-react';
import type { YeastReference } from '../../domain/yeastReferences';
import type {
  ApiLevure, Disponibilite, EtatFiltres, IdAxe, IdFiltre, Niveau, RangDisponibilite, ReperesRecette, ResultatRecherche, ValeurAxe,
} from '../../domain/levure/contrat';
import { jetonArome, jetonDeAxe } from '../../domain/levure/couleurs';
import supplyProduits from '../../data/yeastSupplyBootstrap.json';
import { RechercheAvancee, barre, cx, mil, nb, pct, textePlage, toucherLigne } from '../rechercheAvancee/RechercheAvancee';
import type { CatalogueRA, DefFiltreRA, EtatFiltresRA, RayonRA } from '../rechercheAvancee/types';
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

// Les outils d'écriture et de piste de la vue commune, repris ici pour Comparer et Suggérer (une seule copie).
export { barre, cx, mil, pct, textePlage };
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

/* ───────────── le catalogue de la levure pour la recherche avancée commune ───────────── */

/** Les filtres dont le champ n'est pas normalisé : leurs comptes se lisent « estimé » (c6b, retouche 2). */
const FILTRES_ESTIMES: IdFiltre[] = ['famille', 'effets', 'sansAlcool'];
/** Le libellé court d'un filtre pour l'index et les puces (« Tolérance à l'alcool » → « Tolérance »). */
const COURT_FILTRE: Partial<Record<IdFiltre, string>> = { tolerance: 'Tolérance', temperature: '°C', stock: 'En stock' };
const TRIS = [['proche', 'proche'], ['prix', 'prix'], ['attenuation', 'atténuation'], ['temperature', '°C'], ['tolerance', 'tolérance']] as const;
const RAYONS: RayonRA[] = [
  { id: 'ici', titre: TITRE_RANG.ici, court: TITRE_COURT.ici, icone: Store, pas: 4, reste: 'vendues ici', legende: 'vendue ici', teinte: 'vert' },
  { id: 'europe', titre: TITRE_RANG.europe, court: TITRE_COURT.europe, icone: Factory, pas: 3, reste: 'du fabricant européen', legende: 'Europe', teinte: 'neutre' },
  { id: 'rare', titre: TITRE_RANG.rare, court: TITRE_COURT.rare, icone: Globe, pas: 2, reste: 'rares', legende: 'rare', teinte: 'violet' },
];

type PropsCatalogue = Pick<PropsAvecApi, 'reperes' | 'comparees' | 'onChoisir' | 'onComparees' | 'onChercherDonnee' | 'stockIds'>;

/**
 * La levure, instance de la recherche avancée : les 18 filtres de l'API, ses comptes, ses trois rayons, ses deux pistes (°C et
 * atténuation), ses pièces de ligne. `props()` rend les props du moment (Comparer, callbacks) sans refaire la recherche.
 */
export function catalogueLevure(api: ApiVue, reperes: ReperesRecette, stockIds: readonly string[] | undefined, props: () => PropsCatalogue): CatalogueRA<YeastReference> {
  const contexte = stockIds ? { stockIds } : undefined;
  const dispos = new Map<string, Disponibilite>();
  const disp = (l: YeastReference) => { let d = dispos.get(l.id); if (!d) { d = api.disponibilite(l); dispos.set(l.id, d); } return d; };
  const plusEnPuce = new Set(api.FILTRES.filter((d) => d.rang === 'plus').slice(0, 2).map((d) => d.id));
  const filtres: DefFiltreRA[] = api.FILTRES.map((d) => ({
    id: d.id, libelle: d.libelle, rang: d.rang, genre: d.genre, court: COURT_FILTRE[d.id],
    enPuce: (d.rang === 'premier' && d.id !== 'boisson' && d.id !== 'disponibilite' && d.id !== 'stock') || plusEnPuce.has(d.id),
    estime: FILTRES_ESTIMES.includes(d.id),
    unite: api.AXES.find((a) => a.id === d.id)?.unite,
    repere: d.id === 'temperature' ? reperes.temperatureC : d.id === 'tolerance' ? reperes.abvVise : undefined,
    repereGarde: d.id === 'tolerance' ? 'min' : 'couvre',
    indisponible: d.id === 'stock' && !stockIds ? "Le stock de levures n'est pas relié à cette vue : ce filtre n'est pas disponible ici." : undefined,
    deBase: d.id === 'boisson',
  }));
  const chercherDonnee = (l: YeastReference, filtre: string) => props().onChercherDonnee?.(l, filtre);
  return {
    vue: 'chercher', libelleChamp: 'Nom, fabricant ou code', aucun: 'Aucune levure ne correspond.',
    filtres,
    idDe: (l) => l.id,
    nomLigne: nomCourt,
    attrsLigne: (l) => ({ 'data-levure': l.id }),
    chercher: (requete, f) => api.chercher(requete, f as EtatFiltres, reperes, contexte),
    rayons: RAYONS,
    rayonDe: (l) => disp(l).rang,
    rayonVerifier: 'ici',
    pistes: [
      { id: 'temperature', lo: T_LO, hi: T_HI, unite: '°C', repere: reperes.temperatureC, teinte: 'chaud', plage: (l) => plageDe(api, l, 'temperature') },
      { id: 'attenuation', lo: A_LO, hi: A_HI, unite: '%', teinte: 'vert', plage: (l) => plageDe(api, l, 'attenuation') },
    ],
    tris: TRIS,
    cleTri: (l, tri) => {
      if (tri === 'prix') return disp(l).prixMin?.montant;
      const p = plageDe(api, l, tri as IdAxe);
      return p ? (p.min + p.max) / 2 : undefined;
    },
    triDecroissant: ['tolerance'],
    documente: (l, id) => api.documente(l, id as IdFiltre),
    chercherDonnee,
    echelle: { rayon: 'ici', titre: <><Store size={12} aria-hidden="true" /> vendues ici · fiche</>, plage: (l, id) => plageDe(api, l, id as IdAxe), nomCourt },

    ApresNom: ({ item, pale }) => {
      const fab = fabricantUtile(item);
      const d = disp(item);
      return <>{fab && !pale && <small>{fab.replace(/ Brewing$/, '')}</small>}{d.rang === 'ici' && !pale ? <Dispo d={d} /> : null}</>;
    },
    SousNom: ({ item }) => { const t = texteEpuisee(disp(item)); return t ? <span className="lvv-ep lvv-ep-l">{t}</span> : null; },
    Pastilles: ({ item, ref, poses }) => (
      <>
        <PastillesAromes api={api} levure={item} ref={ref} compact onChercherDonnee={props().onChercherDonnee} />
        {poses.map((b) => api.documente(item, b.id as IdFiltre) ? <span key={b.id} className="lvv-p lvv-ok"><i aria-hidden="true" />{premiereMajuscule(b.libelle)} · fiche</span> : null)}
      </>
    ),
    Actions: ({ item }) => { const p = props(); return <ActionsLigne levure={item} comparees={p.comparees} onChoisir={p.onChoisir} onComparees={p.onComparees} />; },
    NonDoc: ({ item, filtre, texte }) => <NonDoc levure={item} axe={filtre} texte={texte} onChercherDonnee={props().onChercherDonnee} />,
    Carte: ({ item, ouverte, basculer }) => {
      const p = props();
      const d = disp(item);
      return (
        <section className="lvv-us ra-carte" data-booster="effets-us" aria-label={`Levure tapée : ${nomLong(item)}`} onClick={toucherLigne(basculer)}>
          <button type="button" className="lvv-us-t" aria-expanded={ouverte} data-ligne-nom="">
            <h2>{nomLong(item)}</h2>
          </button>
          <div className="lvv-ligne">
            {formeDe(api, item) && <span>{formeDe(api, item)}</span>}
            {fabricantUtile(item) && <span>{fabricantUtile(item)}</span>}
            <Dispo d={d} court={false} />
            <OffreTexte d={d} />
          </div>
          <PastillesAromes api={api} levure={item} onChercherDonnee={p.onChercherDonnee} />
          <div className="lvv-mes">
            <Mesure api={api} levure={item} axe="temperature" libelle="°C" lo={T_LO} hi={T_HI} repere={reperes.temperatureC} kind="t" onChercherDonnee={p.onChercherDonnee} />
            <Mesure api={api} levure={item} axe="attenuation" libelle="atténuation" unite="%" lo={A_LO} hi={A_HI} kind="a" onChercherDonnee={p.onChercherDonnee} />
          </div>
          {ouverte && <ActionsLigne levure={item} comparees={p.comparees} onChoisir={p.onChoisir} onComparees={p.onComparees} />}
        </section>
      );
    },
  };
}

/** Chercher (c6b) : la recherche avancée commune sur le catalogue de la levure. Mêmes props qu'avant (EtapeLevure.tsx). */
export function Chercher(props: PropsAvecApi) {
  const api = apiDe(props.api);
  const { reperes, stockIds } = props;
  const courant = useRef(props);
  courant.current = props;
  // Les repères et le stock se comparent par valeur : un parent qui les recrée à chaque rendu ne relance pas la recherche.
  const cleReperes = [reperes.temperatureC, reperes.abvVise, reperes.styleId, reperes.ogVisee].join('|');
  const cleStock = stockIds ? stockIds.join(',') : '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const catalogue = useMemo(() => catalogueLevure(api, reperes, stockIds, () => courant.current), [api, cleReperes, cleStock]);
  return <RechercheAvancee catalogue={catalogue} />;
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
      <span className="lvv-me-t">{libelle} {p ? <b className="lvv-m">{textePlage(p)}{unite ? ` ${unite}` : ''}</b> : <NonDoc levure={levure} axe={axe} texte="?" onChercherDonnee={onChercherDonnee} />}</span>
      <Piste plage={p} lo={lo} hi={hi} repere={repere} kind={kind} fantome={p} />
    </div>
  );
}

export type { ValeurAxe, ResultatRecherche, EtatFiltresRA };

