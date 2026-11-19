/**
 * Comparer sur le critère, écartés visibles (R06, figé p2:g01-8 et ses compagnons v03-4, g05-8, h04-7, h06-7 ; R26, G20).
 * Le tableau est reçu en props : il est calculé par `comparer.ts` (lot A, `tableau(carnet)`) et passé par `CarnetsVue.tsx`.
 * À 0 ou 1 article, il vaut `null` : l'écran le dit (« le tableau naît au 2e article »), sans geste à faire.
 * Les articles sont en colonnes, les caractéristiques en lignes ; la meilleure valeur de chaque ligne est surlignée ;
 * « moins bien partout » marque un article dominé ; les écartés restent à la fin, grisés, avec leur raison (D-52).
 * Une valeur inconnue est une cellule vide (« – » discret), jamais 0. Choisir s'atteint d'ici seulement (MISSION « Rangé derrière »).
 * Correction 3 : à 390, une ombre de bord et « → n de plus » disent la suite à droite ; les écartés se lisent sous le tableau, nom et
 * raison (« Écartés · n », p2:h04-7), jamais une case vide ; un lien dont la page n'est pas lue s'écrit « Lien sans aperçu » (R04).
 */
import React from 'react';
import { ChevronLeft, ExternalLink, Scale } from 'lucide-react';
import { sourceDuCritere } from '../../domain/carnets/modele';
import { compromisDe, libelleCaracteristique, libelleEcarte, nombreDe, type Tableau } from '../../domain/carnets/comparer';
import { montant, Provenance, rangTexte, STATUT_LIBELLE, valeurTexte, type ArticleV, type CritereV, type Sens, type StatutCarnet, type ValeurV } from './EtatIA';
import { Photo } from './pictos';
import './carnets-decider.css';

/** Le tableau tel que `tableau(carnet)` de `comparer.ts` le rend (lot A, critère A9). */
export type TableauV = Tableau;
type LigneT = Tableau['lignes'][number];

/** Une colonne affichée : les caractéristiques des critères, puis le prix (sens moins, même devise). */
export interface ColonneVue { cle: string; nom: string; unite?: string; sens: Sens; critere: boolean }

/**
 * Les colonnes dans l'ordre de g01-8 : les caractéristiques des critères (la 1re, celle qui classe d'abord, est `critere`), puis le prix,
 * puis les valeurs lues sur au moins 2 articles (débit, °C : P10), montrées sans être classées.
 */
export function colonnesVue(t: Tableau): ColonneVue[] {
  const vue = (c: Tableau['colonnes'][number], critere: boolean): ColonneVue => ({ cle: c.nom, nom: c.nom, unite: c.unite, sens: c.sens, critere });
  const deCriteres = t.colonnes.filter(c => c.critereId);
  const cols: ColonneVue[] = deCriteres.map((c, i) => vue(c, i === 0));
  if (t.lignes.some(l => l.prixCentimes !== undefined)) cols.push({ cle: '__prix', nom: 'prix', unite: t.lignes.find(l => l.devise)?.devise ?? 'CHF', sens: 'moins', critere: false });
  for (const c of t.colonnes.filter(x => !x.critereId)) cols.push(vue(c, false));
  return cols;
}

function nombre(v?: ValeurV): number | null {
  if (!v) return null;
  if (typeof v.valeur === 'boolean') return v.valeur ? 1 : 0;
  return nombreDe(v.valeur);
}
/** Texte d'une cellule ; `null` si inconnue (cellule vide, jamais 0). */
export function texteCellule(l: LigneT, c: ColonneVue): string | null {
  if (c.cle === '__prix') return montant(l.prixCentimes);
  return valeurTexte(l.cellules[c.cle]);
}
/** Les articles en lice qui tiennent la meilleure valeur connue de la colonne (surlignés) ; aucun si moins de 2 valeurs connues. */
export function meilleursDe(t: Tableau, c: ColonneVue): Set<string> {
  if (c.sens === 'texte') return new Set();
  const connus = t.lignes.filter(l => !l.ecarte).map(l => ({ id: l.articleId, n: c.cle === '__prix' ? (l.prixCentimes ?? null) : nombre(l.cellules[c.cle]) })).filter((x): x is { id: string; n: number } => x.n !== null);
  if (connus.length < 2) return new Set();
  const cible = c.sens === 'moins' ? Math.min(...connus.map(x => x.n)) : Math.max(...connus.map(x => x.n));
  return new Set(connus.filter(x => x.n === cible).map(x => x.id));
}

/** Le domaine d'un lien : `domaine` lu, sinon l'hôte de l'adresse (sans « www. ») ; `undefined` si rien ne le dit. */
export function domaineDe(a: Pick<ArticleV, 'domaine' | 'url'>): string | undefined {
  if (a.domaine?.trim()) return a.domaine.trim();
  if (!a.url) return undefined;
  try { return new URL(a.url).hostname.replace(/^www\./, '') || undefined; } catch { return undefined; }
}

/**
 * Un lien sans aperçu (même libellé que la carte R04) : sa page n'est pas lue et rien n'en est connu ; `null` s'il se nomme.
 * « Lien sans aperçu · <domaine> · page non lue » ; pendant la lecture, « <domaine> · lecture… ».
 */
export function sansApercu(a: Pick<ArticleV, 'lecture' | 'nom' | 'domaine' | 'url'>): { titre: string; sous: string; enCours: boolean } | null {
  /* test en ligne 2 (bloquant 6) : un article nommé garde son nom, sa page lue ou non (comme sa carte) ; seul un lien sans nom est « sans aperçu » */
  if (a.lecture === 'lue' || a.nom?.trim()) return null;
  const domaine = domaineDe(a);
  const enCours = a.lecture === 'en-cours' || a.lecture === 'a-lire';
  return { titre: enCours ? (domaine ?? 'Lien') : 'Lien sans aperçu', sous: `${domaine ? `${domaine} · ` : ''}${enCours ? 'lecture…' : 'page non lue'}`, enCours };
}

/**
 * Paquet 1, PCN-162 (test en ligne 1, n° 7) : un article ne se choisit pas tant que rien n'en est connu ; un prix connu (écrit dans sa
 * phrase) suffit, même si sa page n'a pas été lue. Le message dit « ni nom, ni prix connus » : il ne ment plus quand le prix s'affiche.
 */
export function choixBloque(a: Pick<ArticleV, 'lecture' | 'nom' | 'domaine' | 'url' | 'prixCentimes'>): ReturnType<typeof sansApercu> {
  return a.prixCentimes !== undefined ? null : sansApercu(a);
}

/** Pour `nonLus` : les articles dont la page n'est pas lue, par id, avec leur domaine (à passer par le conteneur). */
export type LienNonLu = Pick<ArticleV, 'lecture' | 'nom' | 'domaine' | 'url'>;
export function nonLusDe(articles: (LienNonLu & { id: string })[]): Record<string, LienNonLu> {
  const sortie: Record<string, LienNonLu> = {};
  for (const a of articles) if (sansApercu(a)) sortie[a.id] = { lecture: a.lecture, nom: a.nom, domaine: a.domaine, url: a.url };
  return sortie;
}

const HOTE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
/**
 * Le libellé d'une colonne sans aperçu. Par `nonLus` quand le conteneur le donne ; sinon, une ligne qui ne porte que son domaine
 * pour nom (`nomArticle` retombe sur le domaine), sans aucune valeur ni prix, est un lien dont la page n'a pas été lue.
 */
export function apercuLigne(l: LigneT, nonLus?: Record<string, Pick<ArticleV, 'lecture' | 'nom' | 'domaine' | 'url'>>): { titre: string; sous: string } | null {
  const a = nonLus?.[l.articleId];
  if (a) return sansApercu(a);
  const rien = l.prixCentimes === undefined && !Object.values(l.cellules).some(Boolean);
  if (rien && HOTE.test(l.nom.trim())) return { titre: 'Lien sans aperçu', sous: `${l.nom.trim()} · page non lue` };
  return null;
}

export interface ComparerProps {
  titre: string;
  /** Les articles dont la page n'est pas lue (`nonLusDe(carnet.articles)`) : « Lien sans aperçu », jamais le domaine seul. */
  nonLus?: Record<string, Pick<ArticleV, 'lecture' | 'nom' | 'domaine' | 'url'>>;
  statut: StatutCarnet;
  critere?: CritereV;
  tableau: TableauV | null;
  /** Photo de chaque article, par id (en-têtes de colonne). */
  photos?: Record<string, string | undefined>;
  /** Vendeurs et prix de la fixture : « exemple » (le simulé est marqué). */
  exemple?: boolean;
  /** « Compromis : … » de l'IA ; sans elle, `compromisDe(tableau)` le calcule sur place (picto local, Q19). */
  compromis?: string;
  /** Le picto de chaque article (lot B), par id, quand il n'a pas de photo : jamais un picto générique. */
  pictos?: Record<string, React.ReactNode>;
  onRetour: () => void;
  onOuvrirArticle?: (articleId: string) => void;
  onChoisir?: () => void;
  /** Tour 3, PCN-164 : d'où viennent les valeurs (`mentionValeurs`) ; absent : les vendeurs. */
  mention?: string;
}

/**
 * « Il y a une suite à droite » : vrai tant que la zone défile encore vers la droite (fondu, 390). Mesuré au rendu, au défilement et
 * au redimensionnement ; sans ResizeObserver (jsdom), seulement au défilement.
 */
function useSuiteADroite(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = React.useRef<HTMLDivElement>(null);
  const [suite, setSuite] = React.useState(0);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* « → n de plus » : les colonnes d'article pas entièrement visibles à droite (la colonne des noms, collée, n'en est pas). */
    const mesurer = () => {
      /* tour 3, f5c n° 7 : à 390, les colonnes d'articles se partagent la place en entier (3 de 85 px plutôt qu'une 4e coupée au bord) ;
         la suite se dit par l'ombre et « → n de plus ». Rien à 1280, où tout tient. */
      const tetes0 = el.querySelectorAll<HTMLElement>('thead th');
      const nCols = tetes0.length - 1;
      if (nCols > 0) {
        const dispo = el.clientWidth - tetes0[0].offsetWidth;
        const n = Math.max(1, Math.floor(dispo / LARGEUR_COLONNE));
        if (nCols > n && dispo > 0) el.style.setProperty('--cn-col', `${Math.floor(dispo / n)}px`); else el.style.removeProperty('--cn-col');
      }
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) { setSuite(0); return; }
      const bord = el.getBoundingClientRect().right;
      const tetes = [...el.querySelectorAll('thead th')].slice(1);
      setSuite(Math.max(1, tetes.filter(th => th.getBoundingClientRect().right > bord + 1).length));
    };
    mesurer();
    el.addEventListener('scroll', mesurer, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(mesurer) : null;
    ro?.observe(el);
    if (el.firstElementChild) ro?.observe(el.firstElementChild);
    return () => { el.removeEventListener('scroll', mesurer); ro?.disconnect(); };
  }, []);
  return [ref, suite];
}

/**
 * Le critère qui classe d'abord (P32) : la 1re colonne de critère du tableau ; le critère passé en props s'il est celui-là (avec son
 * origine), sinon le texte du critère de la colonne. Aucun critère ne classe : `null` (l'en-tête dit alors « rangé par : le prix »).
 */
/** Tour 3, PCN-118 : tous les critères qui classent, dans l'ordre des colonnes ; le 1er comme `critereQuiClasse`. */
export function criteresQuiClassent(t: Tableau | null, critere?: CritereV): Array<{ texte: string; source?: 'phrase' | 'ia' }> {
  return (t?.colonnes ?? []).filter(c => c.critereId && c.sens !== 'texte').map(col => (critere && critere.id === col.critereId
    ? { texte: critere.texte, source: sourceDuCritere(critere) }
    : { texte: col.critereTexte ?? col.nom, ...(col.critereSource ? { source: col.critereSource } : {}) }));
}

/**
 * Tour 3, f5c n° 6 : « classées par … » ne redit pas « Ce qui compte » (déjà au-dessus, critère par critère) ; il ne garde que ce qui
 * s'ajoute : le prix qui départage les ex aequo (« à égalité, le moins cher »). Sans critère qui classe, la règle entière (g01-8).
 */
export function texteClassees(t: Tableau, nCriteres: number): string | null {
  if (!t.rangePar) return null;
  if (!nCriteres) return `classées par ${t.rangePar}`;
  return /le prix$/.test(t.rangePar) ? 'à égalité, le moins cher' : null;
}

/** Tour 3, f5c n° 7 : « sous votre minimum de 1 500 m³/h » dit court dans sa cellule (« < min. 1 500 », l'unité est sur la ligne). */
export function horsSeuilCourt(h: string): string {
  const m = /^(sous votre minimum|au-dessus de votre maximum) de (.+?)(\s+[^\d\s].*)?$/.exec(h.trim());
  return m ? `${m[1].startsWith('sous') ? '< min.' : '> max.'} ${m[2].trim()}` : h;
}

/** f5c n° 7 : la largeur d'une colonne d'article (nom replié 70 à 78 px, et ses marges). */
const LARGEUR_COLONNE = 82;

export function critereQuiClasse(t: Tableau | null, critere?: CritereV): { texte: string; origine?: CritereV['origine']; source?: 'phrase' | 'ia' } | null {
  const col = t?.colonnes.find(c => c.critereId && c.sens !== 'texte');
  if (!col) return null;
  if (critere && critere.id === col.critereId) return { texte: critere.texte, origine: critere.origine, source: sourceDuCritere(critere) };
  /* critique 6, point 16 : la source du critère qui classe vient de sa colonne (`sourceDuCritere` dans comparer.ts), même quand le critère
     passé en props est un autre (le 1er du carnet, sans valeur) */
  return { texte: col.critereTexte ?? col.nom, ...(col.critereSource ? { source: col.critereSource } : {}) };
}

/**
 * Critique 5, n° 22 : le premier critère du carnet (`critere`, « capter la buée ») ne range rien quand il n'a pas de valeur (aucune
 * caractéristique, ou aucune colonne du tableau ne la porte). L'écran le dit au lieu de laisser croire qu'il classe. `null` s'il range,
 * ou si la règle du tableau (`rangePar`, lot A) le nomme déjà.
 */
export function premierSansValeur(t: Tableau | null, critere?: CritereV): string | null {
  if (!t || !critere?.texte?.trim()) return null;
  const range = t.colonnes.some(c => c.critereId === critere.id && c.sens !== 'texte');
  if (range) return null;
  if (t.rangePar && t.rangePar.includes(critere.texte.trim())) return null;
  return critere.texte.trim();
}

/**
 * Critique 5, n° 23 : « moins bien que la 3e sur tout » au lieu de « moins bien partout ». Le rang du meilleur article en lice qui
 * domine `l` au sens de Pareto, sur les mêmes colonnes que `domine` (lot A, `comparer.ts`) : les critères qui classent (plus, moins,
 * oui-non) et le prix de même devise, comparés seulement où les deux valeurs sont connues (au moins 2), au moins aussi bon partout et
 * meilleur sur une. Le champ `moinsBienQue` du tableau (lot A) prime s'il existe. `null` si personne ne le domine.
 */
export function moinsBienQueDe(t: Tableau, l: LigneT): number | null {
  const duLotA = (l as LigneT & { moinsBienQue?: number | null }).moinsBienQue;
  if (typeof duLotA === 'number') return duLotA;
  if (l.rang === null) return null;
  const cols = t.colonnes.filter(c => c.critereId && c.sens !== 'texte');
  const num = (x: LigneT, c: Tableau['colonnes'][number]): number | null => {
    const v = x.cellules[c.nom];
    if (c.sens === 'oui-non' && typeof v?.valeur === 'string') { const s = v.valeur.trim().toLowerCase(); return s === 'oui' ? 1 : s === 'non' ? 0 : null; }
    return nombre(v);
  };
  const domine = (b: LigneT): boolean => {
    const ecarts: number[] = [];
    for (const c of cols) {
      const va = num(l, c), vb = num(b, c);
      if (va === null || vb === null) continue;
      ecarts.push(c.sens === 'moins' ? vb - va : va - vb); /* < 0 : b meilleur */
    }
    if (l.prixCentimes !== undefined && b.prixCentimes !== undefined && (l.devise ?? 'CHF') === (b.devise ?? 'CHF')) ecarts.push(b.prixCentimes - l.prixCentimes);
    return ecarts.length >= 2 && ecarts.every(e => e <= 0) && ecarts.some(e => e < 0);
  };
  const par = t.lignes.filter(b => b.rang !== null && b.articleId !== l.articleId && domine(b)).sort((a, b) => a.rang! - b.rang!)[0];
  return par?.rang ?? null;
}
const rangF = (n: number) => (n === 1 ? 'la 1re' : `la ${n}e`);

/** Les valeurs du tableau sont-elles celles de l'exemple (fixture) ? Une seule cellule « exemple » suffit à le dire. */
function deLExemple(t: Tableau): boolean {
  return t.lignes.some(l => Object.values(l.cellules).some(v => v?.origine === 'exemple'));
}

/** La vignette d'une colonne (g01-8) : la photo, sinon le picto de l'objet (lot B) ; sinon rien, jamais un cube générique. */
function Vignette({ photo, picto }: { photo?: string; picto?: React.ReactNode }) {
  if (photo) return <Photo src={photo} className="cn-vignette cn-cmp-vignette" repli={<Vignette picto={picto} />} />;
  if (picto) return <span className="cn-vignette cn-cmp-vignette cn-vignette-vide" aria-hidden>{picto}</span>;
  /* critique 6 (1280, 22) : sans photo ni picto, la place reste vide et réservée, pour que rangs et noms s'alignent d'une colonne à l'autre */
  return <span className="cn-cmp-vignette cn-cmp-vignette-place" aria-hidden />;
}

export function Comparer(p: ComparerProps) {
  const t = p.tableau;
  const actifs = t ? t.lignes.filter(l => !l.ecarte) : [];
  const ecartes = t ? t.lignes.filter(l => l.ecarte) : [];
  const ordre = [...actifs, ...ecartes];
  const cols = t ? colonnesVue(t) : [];
  const aRelire = t?.aRelire ?? [];
  const [zone, suite] = useSuiteADroite();
  const classe = critereQuiClasse(t, p.critere);
  /* tour 3, f5c n° 6 : la source se dit une fois quand tous les critères ont la même (« · proposé par l'IA ») */
  const cqc = criteresQuiClassent(t, p.critere);
  const sourceUnique = cqc.length > 0 && cqc.every(x => x.source === cqc[0].source) ? cqc[0].source : undefined;
  const classees = t ? texteClassees(t, classe ? cqc.length : 0) : null;
  const compromisLocal = p.compromis ? null : compromisDe(t);
  /* le tableau naît au 2e article LU : un lien non lu n'en tient pas lieu (P6) */
  const naissant = !t || ordre.length < 2;
  const sansValeur = premierSansValeur(t, p.critere);
  /* n° 23 : la phrase dite sous le tableau, pas une pastille dans l'en-tête (elle creusait ~100 px de vide sous les noms, n° 9) */
  const domines = t ? actifs.map(l => ({ l, par: moinsBienQueDe(t, l) })).filter((x): x is { l: LigneT; par: number } => x.par !== null) : [];
  /* n° 17 : une caractéristique dont personne n'a la valeur n'a pas de ligne (une rangée de « – » ne compare rien) ; elle se nomme dessous */
  const lignesVues = t ? cols.filter(c => c.cle === '__prix' || t.lignes.some(l => l.cellules[c.cle] !== undefined)) : [];
  const sansValeurLue = t ? cols.filter(c => !lignesVues.includes(c)) : [];
  return (
    <article className="cn-page cn-comparer">
      <div className="cn-tete">
        <button type="button" className="cn-retour" onClick={p.onRetour}><ChevronLeft size={20} aria-hidden /> {p.titre}</button>
        <span className="cn-sp" />
        <span className={`cn-pastille cn-statut-${p.statut}`}>{STATUT_LIBELLE[p.statut]}</span>
      </div>
      <h2 className="cn-titre">{p.titre}</h2>
      {classe && (
        <p className="cn-mut cn-cmp-critere">Ce qui compte {cqc.map((x, i) => <React.Fragment key={i}>{i ? ', puis ' : ''}<b className="cn-encre">{x.texte}</b>{!sourceUnique && x.source === 'ia' ? ' (proposé par l\'IA)' : ''}</React.Fragment>)}{sourceUnique === 'ia' ? ' · proposé par l\'IA' : ''}</p>
      )}
      {classe && sansValeur && <p className="cn-mut cn-cmp-sans-valeur">« {sansValeur} » : sans valeur à comparer, il ne range pas</p>}
      {naissant ? (
        <>
          <p className="cn-vide">Le tableau naît au 2e article lu : collez un 2e lien dans le champ.</p>
          <ARelire articles={aRelire} />
        </>
      ) : (
        <>
          <div className="cn-entete-groupe">
            <span className="cn-groupe">Côte à côte <span className="cn-mono">{actifs.length}</span></span>
            <span className="cn-sp" />
            {/* g01-8 : « classées par l'oxygène » ; la règle même du tri (P32) */}
            {classees && <span className="cn-mut cn-cmp-classees">{classees}</span>}
          </div>
          {/* À 1280, tout tient (noms et raisons repliés) ; à 390, la colonne des noms reste fixe et un fondu dit la suite à droite. */}
          <div className="cn-tableau-cadre" data-suite={suite ? true : undefined}>
          <div className="cn-tableau-zone" ref={zone}>
            <table className="cn-tableau cn-tableau-comparer">
              <thead>
                <tr>
                  <th scope="col"><span className="cn-cache">Caractéristique</span></th>
                  {ordre.map(l => {
                    const sa = apercuLigne(l, p.nonLus);
                    return (
                      <th key={l.articleId} scope="col" className={l.ecarte ? 'cn-ecarte' : undefined} data-apercu={sa ? 'aucun' : undefined}>
                        <button type="button" className="cn-col-tete" onClick={() => p.onOuvrirArticle?.(l.articleId)} disabled={!p.onOuvrirArticle} title={sa ? undefined : l.nom}>
                          <Vignette photo={p.photos?.[l.articleId]} picto={p.pictos?.[l.articleId]} />
                          <b>{l.ecarte ? 'écarté' : l.rang ? rangTexte(l.rang) : ''}</b>
                          <span className="cn-cmp-nom">{sa ? sa.titre : l.nom}</span>
                          {sa && <span className="cn-mut cn-sans-apercu">{sa.sous}</span>}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {lignesVues.map(c => {
                  const meilleurs = meilleursDe(t, c);
                  /* n° 7 (L14) : la ligne porte le nom de sa caractéristique (« ambiance max °C »), jamais l'unité seule */
                  const libelle = c.cle === '__prix' ? c.nom : libelleCaracteristique(c.nom);
                  return (
                    <tr key={c.cle} className={c.critere ? 'cn-ligne-critere' : undefined}>
                      <th scope="row" title={libelle !== c.nom ? c.nom : undefined}>{libelle}{c.unite ? <span className="cn-mut"> {c.unite}</span> : null}</th>
                      {ordre.map(l => {
                        const txt = texteCellule(l, c);
                        const v = c.cle === '__prix' ? undefined : l.cellules[c.cle];
                        /* n° 18 : « non » lu sur sa façon (« ne tient pas 80 °C ») ; doute D-122 : « sous votre minimum » */
                        const deFacon = v?.origine === 'locale' && typeof v.valeur === 'boolean';
                        const hors = l.horsSeuil?.[c.cle];
                        return (
                          <td key={l.articleId} className={`${meilleurs.has(l.articleId) ? 'cn-meilleur' : ''}${l.ecarte ? ' cn-ecarte' : ''}`} title={deFacon ? 'd’après sa façon' : undefined}>
                            {txt ? <span className="cn-mono">{txt}</span> : <span className="cn-inconnu" aria-label="inconnu">–</span>}
                            {hors && <span className="cn-hors-seuil" title={hors}><span aria-hidden>{horsSeuilCourt(hors)}</span><span className="cn-cache">{hors}</span></span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
          {suite > 0 && <p className="cn-suite-indice" aria-hidden>→ {suite} de plus</p>}
          {sansValeurLue.length > 0 && <p className="cn-mut cn-cmp-sans-lue">Aucune valeur lue pour : {sansValeurLue.map(c => libelleCaracteristique(c.nom)).join(', ')}</p>}
          {domines.length > 0 && (
            <ul className="cn-cmp-domines" aria-label="Moins bien sur tout">
              {domines.map(({ l, par }) => <li key={l.articleId}><b className="cn-encre">{rangF(l.rang!)}, {l.nom}</b> : moins bien que {rangF(par)} sur tout</li>)}
            </ul>
          )}
          {/* g01-8 : « Compromis : la 1re, … », de l'IA, sinon calculé sur place avec les valeurs du tableau (picto local, pas le ✻ : Q19). */}
          {(p.compromis || compromisLocal) && (
            <p className="cn-encart cn-compromis" data-source={p.compromis ? 'ia' : 'locale'}>
              <Scale size={20} role="img" aria-label="Compromis" className="cn-ok" />
              <span><b>Compromis :</b> {p.compromis ?? compromisLocal} <Provenance origine={p.compromis ? 'ia' : 'locale'} /></span>
            </p>
          )}
          <p className="cn-mut cn-annonce">{p.mention ?? 'Valeurs annoncées par les vendeurs'}{p.exemple || (t && deLExemple(t)) ? <> · <Provenance origine="exemple" /></> : null}</p>
          {/* La ligne « Écarté » (D-52) : chaque écarté, son nom et sa raison, lisibles sans défiler (p2:h04-7) ; aucun écarté, aucune ligne. */}
          {ecartes.length > 0 && (
            <table className="cn-ecartes" aria-label={`Écartés, ${ecartes.length}`}>
              <caption>Écartés · <span className="cn-mono">{ecartes.length}</span></caption>
              <tbody>
                {ecartes.map(l => {
                  const sa = apercuLigne(l, p.nonLus);
                  return (
                    <tr key={l.articleId}>
                      <th scope="row">{sa ? `${sa.titre} · ${sa.sous}` : l.nom}</th>
                      <td className="cn-ecarte cn-ecarte-raison">{libelleEcarte(l.ecarte!.raison)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          <ARelire articles={aRelire} />
          {p.onChoisir && p.statut !== 'validated' && <button type="button" className="cn-action" onClick={p.onChoisir}>Choisir</button>}
        </>
      )}
    </article>
  );
}

/**
 * Les liens à relire (P6, h05-3) : « ? Lien sans aperçu · <domaine> · à relire · Ouvrir ↗ ». Jamais classés, jamais une colonne
 * « – – – ». Aucun : rien.
 */
export function ARelire({ articles }: { articles: readonly { id: string; url?: string; domaine?: string; lecture?: string; nom?: string }[] }) {
  if (!articles.length) return null;
  return (
    <ul className="cn-a-relire" aria-label={`À relire, ${articles.length}`}>
      {articles.map(a => {
        const domaine = domaineDe(a);
        return (
          <li key={a.id}>
            <span className="cn-a-relire-q" aria-hidden>?</span>
            {/* test en ligne 2 (bloquant 6) : un lien que l'IA a nommé garde son nom */}
            <span className="cn-sp"><b>{a.nom?.trim() || 'Lien sans aperçu'}</b><span className="cn-mut">{domaine ? `${domaine} · ` : ''}{a.lecture === 'en-cours' || a.lecture === 'a-lire' ? 'lecture…' : 'à relire'}</span></span>
            {a.url && <a className="cn-lien" href={a.url} target="_blank" rel="noreferrer noopener" aria-label={`Ouvrir ${domaine ?? 'le lien'}, nouvel onglet`}>Ouvrir <ExternalLink size={16} aria-hidden /></a>}
          </li>
        );
      })}
    </ul>
  );
}
