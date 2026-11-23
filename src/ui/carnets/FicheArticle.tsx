/**
 * L'article ouvert (R05, figé p2:h01-6 ; critique 5, n° 8, 28, 36, 37) :
 * - le cadre photo : la photo de la page collée (« photo de la page collée ») ; sans photo, l'objet dessiné en grand dans le même cadre ;
 * - le nom entier, la façon et sa raison ;
 * - le héros du critère : la valeur en gros, sa réglette bornée des deux côtés (la meilleure et la pire valeur connues, chiffrées) et
 *   « la plus haute des 4 » sous la borne du meilleur ; sa propre place (« 3e sur 4 ») près de la valeur quand il n'est pas en tête ;
 * - les offres de la même machine (vendeur, prix « 1 450 CHF », Ouvrir ↗) ;
 * - « Caractéristiques » : une grille de 4 cases au moins, chaque valeur avec son rang (« 2e ») ; les colonnes du carnet que l'article
 *   ne publie pas sont dites « non publié » (jamais 0), puis le délai et l'origine, données de l'article ;
 * - la veille, « Choisir » en vert, et la phrase « Part dans À venir ».
 * Places et rangs : `placesDe(tableau(carnet), id)` de comparer.ts, parmi les articles en lice dont la valeur est connue ; rien n'est
 * inventé. Prix barré : seulement si un prix d'avant existe dans le document ; la relève n'existe pas encore (R31), donc aucun.
 * Veille (R31, D-28) : « Veille du prix, tous les 3 jours », éteinte à la naissance ; allumée et sans relève, « demandée · pas encore
 * relevée » : aucune date de relève, aucun prix relevé, aucune baisse.
 */
import React from 'react';
import { Camera, Check, ChevronLeft, ChevronRight, ExternalLink, Eye, Pencil } from 'lucide-react';
import { Bascule, estExemple, mesureCritere, nombreValeur } from './CarteArticle';
import { dispoDe } from '../../domain/carnets/modele';
import { detailPrix, prixTexteArticle } from './PrixPastille';
import { normaliser } from '../../domain/carnets/analyseLocale';
import { nombreTexte, placesDe, tableau as calculerTableau, type Place } from '../../domain/carnets/comparer';
import { parsePrix } from '../../domain/finance/upgradeRing';
import { dateCourte, montant, Provenance, rangTexte, texteSelonNom, valeurTexte, type ArticleV, type ContenuCarnetV, type CritereV, type FaconV, type ValeurV } from './EtatIA';
import './fiche-article.css';
import { marquerCassee, photoCassee, VignetteObjet } from './pictos';

export interface FicheArticleProps {
  article: ArticleV;
  /** D447 : le taux EUR→CHF (facture ou posé) ; sans lui, le cours du jour lu avec la page. */
  taux?: number;
  titreCarnet: string;
  critere?: CritereV;
  facon?: FaconV;
  /** Le carnet entier : les places (héros, rangs) et les offres de la même machine s'en calculent. */
  carnet?: ContenuCarnetV;
  /** Place de l'article et nombre d'articles comparables (« 1re sur 5 »). */
  rang?: number;
  sur?: number;
  /** Sans `carnet` : les valeurs des autres articles sur la caractéristique du critère, pour la piste. */
  autresMesures?: number[];
  /** Sans `carnet` : rang de chaque caractéristique (« 2e »). */
  rangs?: Record<string, number>;
  /** L'idée est-elle déjà choisie ? Alors pas de Choisir ici (R07). */
  choisi?: boolean;
  onRetour: () => void;
  onVeille: (active: boolean) => void;
  onChoisir?: () => void;
  /** Ouvrir une autre offre de la même machine. */
  onOffre?: (articleId: string) => void;
  /** L-9 : poser ou corriger le prix de l'article (centimes, CHF). */
  onPrix?: (centimes: number) => void;
  /** L-16 : l'article suivant ou précédent du carnet (balayer, ou ‹ ›). */
  onSuivant?: () => void;
  onPrecedent?: () => void;
}

/** L-15 : « 2 495,60 CHF », le format de la liste et du carnet (`montant`) ; prix inconnu : null. */
const prixTexte = (centimes: number | undefined, devise: string): string | null => { const m = montant(centimes); return m ? `${m} ${devise}` : null; };
/** L-15 (CA12-M4-8) : le mono est pour ce qui se mesure ; « RAL 9002 », « avec groupe frigorifique » restent en texte. */
const estChiffre = (t: string) => /^[−-]?\d[\d\s\u202f.,']*$/.test(t);
/** L-15 (CA12-M4-9) : « 1.845 » lu sur une page allemande est un millier ; dit par `valeurTexte` (« 1 845 »), jamais « 1,845 ». */
const milliersAPoint = (v: ValeurV) => typeof v.valeur === 'string' && /^\d{1,3}(\.\d{3})+$/.test(v.valeur.trim());

interface Heros { nom: string; libelle: string; texte: string; unite?: string; valeurs: number[] | null; moi: number | null; sens: string; rang?: number; sur: number }

/** Le héros : la 1re place d'un critère qui classe (plus ou moins), sinon la 1re valeur chiffrée ; le prix jamais. */
function herosDe(places: Place[], criteres: CritereV[]): Heros | null {
  const chiffree = (x: Place) => x.nom !== 'prix' && x.valeur !== undefined && (x.sens === 'plus' || x.sens === 'moins');
  const pl = places.find(x => x.critere && chiffree(x)) ?? places.find(chiffree);
  if (!pl) return null;
  const cr = criteres.find(c => c.caracteristique && normaliser(c.caracteristique.nom) === normaliser(pl.nom));
  const suffixe = pl.unite ? ` ${pl.unite}` : '';
  const texte = suffixe && pl.texte.endsWith(suffixe) ? pl.texte.slice(0, -suffixe.length) : pl.texte;
  return { nom: pl.nom, libelle: cr?.texte ?? pl.nom, texte, unite: pl.unite, valeurs: pl.toutes && pl.toutes.length > 1 ? pl.toutes : null, moi: pl.valeur ?? null, sens: pl.sens, rang: pl.rang, sur: pl.toutes?.length ?? pl.sur };
}

/** Les petits mots qu'un titre coupé ne garde pas en dernier (« Ventilation de… » se lit « Ventilation… »). */
const MOTS_VIDES = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'à', 'au', 'aux', 'pour', 'et', 'en', 'sur', 'avec', '—', '-', '·']);

/**
 * Critique 6, n° 33 : le titre du carnet dans le fil d'Ariane, coupé sur un mot (jamais au milieu), sans finir sur un petit mot ni un
 * tiret, suivi de « … » s'il est coupé. `max` en caractères : 22 tient à 390 avec « ‹ Articles · » et la pastille « 2e sur 4 ».
 */
export function filArianeCourt(titre: string, max = 22): string {
  const t = titre.trim();
  if (t.length <= max) return t;
  const garde: string[] = [];
  for (const m of t.split(/\s+/)) {
    if ([...garde, m].join(' ').length > max) break;
    garde.push(m);
  }
  while (garde.length > 1 && MOTS_VIDES.has(garde[garde.length - 1].toLowerCase())) garde.pop();
  return `${garde.length ? garde.join(' ') : t.slice(0, max)}…`;
}

/**
 * T26-2 : une matière qui se pèse ou se compte (houblon, levure, malt, grain, sucre, bouchons, capsules, étiquettes) n'a pas de volume.
 * Le nom de l'article le dit, ou ses valeurs (un taux d'alpha, une année de récolte). Un appareil, une cuve, un fermenteur : volume.
 */
const MATIERE = /houblon|hopfen|\bhops?\b|pellets?|levure|hefe|yeast|\bmalt|malz|\bgrain|getreide|sucre|zucker|bouchon|capsule|kronkorken|[ée]tiquette|etikett|d[ée]sinfectant|sanitizer/i;
const VALEUR_DE_MATIERE = /^(?:alpha|beta|cohumulone|erntejahr|r[ée]colte|hopfentyp|type de houblon)\b/;
const COLONNE_VOLUME = /^(?:volume|volumen|capacit|contenance|fassungsverm|nutzvolumen|nutzinhalt|litres?\b)/;
export function matiereSansVolume(a: Pick<ArticleV, 'nom' | 'valeurs'>): boolean {
  return MATIERE.test(a.nom ?? '') || Object.keys(a.valeurs).some(k => VALEUR_DE_MATIERE.test(normaliser(k)));
}

/**
 * T28-14 (L04, penser-brasseur) : la fiche d'un houblon dit d'abord l'alpha, la récolte, les huiles totales ; le reste garde l'ordre de la
 * page. Sans alpha dans les valeurs, ce n'est pas un houblon : l'ordre de la page ne bouge pas. Les noms d'avant la traduction
 * (« Alpha », « Erntejahr », « Total oil ») passent aussi : les articles déjà rangés gardent ceux de leur lecture.
 */
const ALPHA = /^alpha\b/;
const RECOLTE = /^(?:recolte|erntejahr|annee de recolte|harvest(?: year)?|crop year)\b/;
const HUILES = /^(?:huiles? totales?|total oils?|gesamtol)\b/;
function ordreHoublon(cases: Case[]): Case[] {
  if (!cases.some(c => ALPHA.test(normaliser(c.nom)))) return cases;
  const poids = (c: Case) => { const n = normaliser(c.nom); return ALPHA.test(n) ? 0 : RECOLTE.test(n) ? 1 : HUILES.test(n) ? 2 : 3; };
  return cases.map((c, i) => ({ c, i })).sort((x, y) => poids(x.c) - poids(y.c) || x.i - y.i).map(x => x.c);
}
/** « 0.8ml » ou « 0,8 » + « ml » : les huiles totales d'un houblon se disent pour 100 g (« 0,8 ml/100 g »). */
function huilesDites(v: ValeurV): { texte: string; unite: string } | null {
  const brut = typeof v.valeur === 'string' ? v.valeur : typeof v.valeur === 'number' ? String(v.valeur) : '';
  const m = `${brut} ${v.unite ?? ''}`.trim().match(/^(\d+(?:[.,]\d+)?)\s*(?:ml)?(?:\s*\/\s*100\s*g)?$/i);
  return m && /ml/i.test(`${brut} ${v.unite ?? ''}`) ? { texte: m[1].replace('.', ','), unite: 'ml/100 g' } : null;
}

/** Une case de la grille « Caractéristiques » : son nom, sa valeur dite (ou « non publié »), son rang s'il classe. */
interface Case { nom: string; texte: string | null; unite?: string; rang?: number; exemple?: boolean }

export function FicheArticle(p: FicheArticleProps) {
  const a = p.article;
  const [, redessiner] = React.useState(0);
  const k = p.carnet;
  const devise = a.devise ?? 'CHF';
  /* D447 : hors franc, le prix converti ; l'original, « HT » et le port se disent sous l'offre (`detailPrix`) */
  const t0 = prixTexteArticle(a, p.taux);
  const prix = t0?.approx ? `≈${t0.montant} ${t0.devise}` : prixTexte(a.prixCentimes, devise);
  const veille = !!a.veille?.active;
  const lu = dateCourte(Object.values(a.valeurs).find(v => v.luLe)?.luLe);
  const ajoute = dateCourte(a.ajouteLe);

  /* Les places, d'après le carnet (comparer.ts) ; sinon les props d'avant. */
  const t = k ? calculerTableau(k as never) : null;
  const places = t ? placesDe(t, a.id) : [];
  const enLice = t ? t.lignes.filter(l => l.rang !== null) : [];
  const rangLigne = t?.lignes.find(l => l.articleId === a.id)?.rang ?? undefined;
  const rang = p.rang ?? rangLigne;
  const sur = p.sur ?? (enLice.length || undefined);
  const heros: Heros | null = k ? herosDe(places, k.criteres) : (() => {
    const m = mesureCritere(a, p.critere);
    const carac = p.critere?.caracteristique;
    if (!m || !carac) return null;
    const moi = nombreValeur(a.valeurs[carac.nom]);
    const valeurs = p.autresMesures && p.autresMesures.length > 1 ? p.autresMesures : null;
    const mieux = (x: number, y: number) => (carac.sens === 'moins' ? x < y : x > y);
    const r = valeurs && moi !== null ? 1 + valeurs.filter(x => mieux(x, moi)).length : undefined;
    return { nom: carac.nom, libelle: p.critere!.texte, texte: m.texte, unite: m.unite, valeurs, moi, sens: carac.sens, rang: r, sur: valeurs?.length ?? 1 };
  })();
  const nomHeros = heros ? normaliser(heros.nom) : '';
  const rangDe = (nom: string): number | undefined => {
    if (p.rangs?.[nom]) return p.rangs[nom];
    const pl = places.find(x => normaliser(x.nom) === normaliser(nom));
    /* un rang se dit sur une valeur qui classe (plus ou moins) ; une valeur lue dont le sens est inconnu ne se classe pas */
    return pl?.rang && (pl.sens === 'plus' || pl.sens === 'moins') && (pl.toutes?.length ?? pl.sur) > 1 ? pl.rang : undefined;
  };

  /* La grille (h01-6) : les valeurs de l'article (le héros à part), puis les colonnes du carnet qu'il ne publie pas, puis le délai et
     l'origine ; 4 cases au moins quand il y a de quoi les remplir, jamais une valeur inventée. */
  const cases: Case[] = ordreHoublon(Object.entries(a.valeurs).filter(([nom]) => normaliser(nom) !== nomHeros).map(([nom, v]: [string, ValeurV]) => {
    const huiles = HUILES.test(normaliser(nom)) ? huilesDites(v) : null;
    if (huiles) return { nom, texte: huiles.texte, unite: huiles.unite, rang: rangDe(nom), exemple: v.origine === 'exemple' };
    const n = typeof v.valeur === 'string' && !milliersAPoint(v) ? nombreValeur(v) : null;
    return { nom, texte: texteSelonNom(nom, n !== null ? nombreTexte(n) : valeurTexte(v)), ...(v.unite ? { unite: v.unite } : {}), rang: rangDe(nom), exemple: v.origine === 'exemple' };
  }));
  /* T25-7 : les colonnes du carnet que l'article ne publie pas se disent ensemble, dans UNE phrase sous la grille (« Non publié par le
     vendeur : Malzmenge · Max. Malzmenge · Stromanschluss »), jamais trois cases « non publié » qui font croire à une valeur. L'inconnu
     reste dit (jamais 0), le critère reste nommé. */
  const dits = new Set([nomHeros, ...cases.map(c => normaliser(c.nom))]);
  const manque: string[] = [];
  const sansVolume = matiereSansVolume(a);
  for (const col of t?.colonnes ?? []) {
    if (normaliser(col.nom) === 'prix' || dits.has(normaliser(col.nom))) continue;
    /* T26-2 : « Non publié : Volume » n'a pas de sens pour un houblon, une levure, un malt : la colonne ne se dit que pour un appareil. */
    if (sansVolume && COLONNE_VOLUME.test(normaliser(col.nom))) continue;
    manque.push(col.nom);
    dits.add(normaliser(col.nom));
  }
  if (cases.length < 4 && dispoDe(a)) cases.push({ nom: 'Disponibilité', texte: dispoDe(a)! });
  if (cases.length < 4 && a.pays) cases.push({ nom: 'Origine', texte: a.pays });

  /* Les offres de la même machine : même nom (normalisé), dans le carnet ; la moins chère d'abord. */
  const offres = k && a.nom
    ? k.articles.filter(x => x.nom && normaliser(x.nom) === normaliser(a.nom!)).sort((x, y) => (x.prixCentimes ?? Infinity) - (y.prixCentimes ?? Infinity))
    : [a];
  const qui = a.vendeur ?? a.domaine;
  const [poserPrix, setPoserPrix] = React.useState(false);
  /* D446 : toutes les photos de la page, une à la fois (‹ ›), la première d'abord ; une photo cassée est écartée */
  const photos = (a.photos?.length ? a.photos : a.photo ? [a.photo] : []).filter(u => !photoCassee(u));
  const [iPhoto, setIPhoto] = React.useState(0);
  const iP = Math.min(iPhoto, Math.max(photos.length - 1, 0));
  const photoCourante = photos[iP];
  const photoNonLue = !photoCourante && !!a.url && a.lecture === 'lue';
  /* L-16 (CA12-M4-18) : balayer à gauche, l'article suivant ; à droite, le précédent (un geste franc, surtout horizontal) */
  const depart = React.useRef<{ x: number; y: number } | null>(null);
  const balayer = {
    onTouchStart: (e: React.TouchEvent) => { const t = e.touches[0]; depart.current = t ? { x: t.clientX, y: t.clientY } : null; },
    onTouchEnd: (e: React.TouchEvent) => {
      const d = depart.current, t = e.changedTouches[0];
      depart.current = null;
      if (!d || !t) return;
      const dx = t.clientX - d.x, dy = t.clientY - d.y;
      if (Math.abs(dx) < 64 || Math.abs(dy) > Math.abs(dx) * 0.6) return;
      (dx < 0 ? p.onSuivant : p.onPrecedent)?.();
    }
  };

  return (
    <article className="cn-page cn-fiche" {...(p.onSuivant || p.onPrecedent ? balayer : {})}>
      <div className="cn-tete">
        {/* critique 6, n° 33 (h01-6 « ‹ Articles · Embouteillage ») : le fil d'Ariane tient sur une ligne à 390, le titre coupé sur un
            mot (`filArianeCourt`) ; à 1280, le titre entier. Le nom complet reste lu par le lecteur d'écran. */}
        <button type="button" className="cn-retour cn-fil-ariane" onClick={p.onRetour} aria-label={`Articles · ${p.titreCarnet}`}>
          <ChevronLeft size={20} aria-hidden />
          <span className="cn-fil-court" aria-hidden>Articles · {filArianeCourt(p.titreCarnet)}</span>
          <span className="cn-fil-long" aria-hidden>Articles · {p.titreCarnet}</span>
        </button>
        <span className="cn-sp" />
        {rang !== undefined && sur ? <span className="cn-pastille cn-pastille-vert">{rangTexte(rang)} sur {sur}</span> : null}
        {p.onPrecedent && <button type="button" className="cn-ico cn-fiche-nav" aria-label="Article précédent" onClick={p.onPrecedent}><ChevronLeft size={20} aria-hidden /></button>}
        {p.onSuivant && <button type="button" className="cn-ico cn-fiche-nav" aria-label="Article suivant" onClick={p.onSuivant}><ChevronRight size={20} aria-hidden /></button>}
      </div>
      {/* n° 8 : le cadre photo est toujours là (h01-6) ; sans photo, l'objet dessiné en grand. Critique 6, n° 20 (D-78) : la photo lue
          de la page ; celle du banc est simulée et le dit (« exemple »). */}
      {photoCourante ? (
        <figure className="cn-fiche-photo" data-cadre="photo">
          <img key={photoCourante} onError={() => { marquerCassee(photoCourante); redessiner(n => n + 1); }} src={photoCourante} alt={`photo ${photos.length > 1 ? `${iP + 1} sur ${photos.length} ` : ''}de la page collée : ${a.nom ?? a.domaine ?? 'article'}`} />
          <figcaption><Camera size={16} aria-hidden /> photo{photos.length > 1 ? <> <span className="cn-mono">{iP + 1}/{photos.length}</span></> : null} de la page collée{estExemple(a) ? <> <Provenance origine="exemple" /></> : null}</figcaption>
          {photos.length > 1 && (
            <>
              <button type="button" className="cn-ico cn-fiche-photo-nav cn-fiche-photo-prec" aria-label="Photo précédente" disabled={iP === 0} onClick={() => setIPhoto(iP - 1)}><ChevronLeft size={20} aria-hidden /></button>
              <button type="button" className="cn-ico cn-fiche-photo-nav cn-fiche-photo-suiv" aria-label="Photo suivante" disabled={iP === photos.length - 1} onClick={() => setIPhoto(iP + 1)}><ChevronRight size={20} aria-hidden /></button>
            </>
          )}
        </figure>
      ) : (
        <figure className="cn-fiche-photo cn-fiche-picto" data-cadre="picto" {...(photoNonLue ? {} : { 'aria-hidden': true })}>
          <span aria-hidden><VignetteObjet mots={[a.nom, p.facon?.nom, p.titreCarnet]} classe="cn-vignette-fiche" taille={132} /></span>
          {/* T26-3 : la page est lue mais sa photo ne l'est pas (page bloquée lue par Google, aucune image publiée) : la fiche le dit. */}
          {photoNonLue && <figcaption className="cn-fiche-photo-non-lue"><Camera size={16} aria-hidden /> photo non lue</figcaption>}
        </figure>
      )}
      <h2 className="cn-titre">{a.nom ?? a.domaine ?? 'Lien sans aperçu'}</h2>
      {(p.facon || ajoute) && (
        <p className="cn-mut">
          {p.facon && <><b className="cn-encre">façon {p.facon.nom.toLowerCase()}</b>{p.facon.raison ? ` : ${p.facon.raison}` : ''}</>}
          {p.facon && ajoute ? ' · ' : ''}{ajoute ? `lien collé le ${ajoute}` : ''}
        </p>
      )}
      {heros && (
        <div className="cn-mesure cn-heros">
          <div className="cn-heros-val">
            <span className="cn-mut">{heros.libelle}</span>
            <span className="cn-mesure-val"><span className="cn-mono">{heros.texte}</span>{heros.unite ? <small> {heros.unite}</small> : null}</span>
            {heros.rang && heros.rang > 1 && heros.sur > 1 ? <span className="cn-mut cn-heros-place">{rangTexte(heros.rang)} sur {heros.sur} · {heros.libelle}</span> : null}
          </div>
          {heros.valeurs && heros.moi !== null ? <Piste valeurs={heros.valeurs} moi={heros.moi} sens={heros.sens} /> : null}
        </div>
      )}
      {(prix || qui || p.onPrix) && (
        <>
          <h3 className="cn-sous">{offres.length > 1 ? <>{offres.length} offres <span className="cn-mut">même machine</span></> : 'Offre'}</h3>
          <div className="cn-offres">
            {offres.map(o => {
              const moi = o.id === a.id;
              const t2 = prixTexteArticle(o, p.taux);
              const p2 = t2?.approx ? `≈${t2.montant} ${t2.devise}` : prixTexte(o.prixCentimes, o.devise ?? 'CHF');
              const d2 = detailPrix(o, p.taux);
              const corps = (
                <>
                  {offres.length > 1 && <span className={`cn-radio${moi ? ' cn-radio-on' : ''}`} aria-hidden />}
                  <span className="cn-sp">
                    <b>{[o.vendeur, o.pays].filter(Boolean).join(' · ') || o.domaine}</b>
                    {dispoDe(o) && <span className="cn-mut">{dispoDe(o)}</span>}
                  </span>
                  {p2 && <PrixMono texte={p2} />}
                  {!p2 && moi && <span className="cn-mut">prix ?</span>}
                </>
              );
              return (
                <div key={o.id} className={`cn-offre${moi ? ' cn-offre-moi' : ''}${d2 ? ' cn-offre-avec-detail' : ''}`}>
                  {!moi && p.onOffre ? <button type="button" className="cn-offre-corps" onClick={() => p.onOffre!(o.id)}>{corps}</button> : <span className="cn-offre-corps">{corps}</span>}
                  {moi && p.onPrix && !poserPrix && (p2
                    ? <button type="button" className="cn-ico" aria-label="Modifier le prix" onClick={() => setPoserPrix(true)}><Pencil size={16} aria-hidden /></button>
                    : <button type="button" className="cn-lien cn-poser-prix-ouvrir" onClick={() => setPoserPrix(true)}>Poser le prix</button>)}
                  {o.url && <a className="cn-lien" href={o.url} target="_blank" rel="noreferrer noopener">Ouvrir <ExternalLink size={16} aria-hidden /></a>}
                  {d2 && <span className="cn-mut cn-offre-detail">{d2}</span>}
                </div>
              );
            })}
          </div>
          {poserPrix && p.onPrix && <PoserPrix centimes={a.prixCentimes} onPoser={c => { p.onPrix!(c); setPoserPrix(false); }} onFermer={() => setPoserPrix(false)} />}
        </>
      )}
      {(cases.length > 0 || manque.length > 0) && (
        <>
          <h3 className="cn-sous">Caractéristiques {lu && <span className="cn-mut">lues sur la fiche du vendeur, {lu}</span>}</h3>
          <dl className="cn-carac" aria-label="Caractéristiques">
            {cases.map(c => (
              <div key={c.nom}>
                <dt>{c.nom}</dt>
                <dd>{c.texte === null ? <span className="cn-mut">non publié</span> : <><span className={estChiffre(c.texte) ? 'cn-mono' : undefined}>{c.texte}</span>{c.unite ? <span> {c.unite}</span> : ''}</>}
                  {c.rang ? <span className="cn-vert cn-carac-rang"> {rangTexte(c.rang)}</span> : null}
                  {c.exemple && <> <Provenance origine="exemple" /></>}
                </dd>
              </div>
            ))}
          </dl>
          {manque.length > 0 && <p className="cn-mut cn-carac-manque">Non publié par le vendeur : {manque.join(' · ')}</p>}
        </>
      )}
      <div className="cn-veille-bloc">
        <div className="cn-veille-ligne">
          <Eye size={18} aria-hidden />
          {/* h01-6 : le réglage et son état sur la même ligne (« tous les 3 jours · revu le 13 nov. ») ; sans relève, « demandée · pas
              encore relevée » (R31) */}
          <span className="cn-sp cn-veille-tx">
            <span>Veille du prix, tous les 3 jours</span>
            {veille && !a.veille?.releveLe && <span className="cn-mut cn-veille-etat">demandée · pas encore relevée</span>}
          </span>
          <Bascule active={veille} onChange={p.onVeille} etiquette="Veille du prix, tous les 3 jours" />
        </div>
      </div>
      {!p.choisi && p.onChoisir && (
        <>
          <button type="button" className="cn-action cn-action-vert cn-large" onClick={p.onChoisir}><Check size={18} aria-hidden /> Choisir{a.vendeur ? ` · ${a.vendeur}` : ''}</button>
          <p className="cn-mut">Part dans À venir : {[a.nom, a.vendeur].filter(Boolean).join(', ')}{prix ? <>, <PrixMono texte={prix} /></> : null}{dispoDe(a) ? `, ${dispoDe(a)}` : ''}, avec le pourquoi.</p>
        </>
      )}
    </article>
  );
}

/**
 * L-9 : le prix de l'article, tapé (« 2495.60 », « 2 495,60 », « 2'495 ») ; jamais type="number" (saisie-mobile), clavier décimal ;
 * illisible : dit, la valeur d'avant reste.
 */
function PoserPrix({ centimes, onPoser, onFermer }: { centimes?: number; onPoser: (centimes: number) => void; onFermer: () => void }) {
  const [texte, setTexte] = React.useState(montant(centimes) ?? '');
  const [refus, setRefus] = React.useState(false);
  const valider = () => { const c = parsePrix(texte); if (c === null) { setRefus(true); return; } onPoser(c); };
  return (
    <form className="cn-poser-prix" onSubmit={e => { e.preventDefault(); valider(); }}>
      <input type="text" inputMode="decimal" enterKeyHint="done" autoComplete="off" autoFocus className="cn-poser-prix-champ" aria-label="Prix de l’article, CHF"
        aria-invalid={refus || undefined} value={texte} onChange={e => { setTexte(e.target.value); setRefus(false); }} />
      <span className="cn-mut">CHF</span>
      <button type="submit" className="cn-action">OK</button>
      <button type="button" className="cn-second" onClick={onFermer}>Annuler</button>
      {refus && <p role="alert" className="cn-poser-prix-refus">« {texte.trim()} » : ce n’est pas un prix.</p>}
    </form>
  );
}

/** « 1 450 CHF » : le nombre en chiffres tabulaires (l'espace de groupe s'y voit, n° 37), la devise en clair. */
function PrixMono({ texte }: { texte: string }) {
  const i = texte.lastIndexOf(' ');
  return <span className="cn-nowrap cn-prix-mono"><span className="cn-mono cn-prix">{texte.slice(0, i)}</span> <span className="cn-mut">{texte.slice(i + 1)}</span></span>;
}

/**
 * La réglette (h01-6 ; n° 36) : un rond par article en lice, le sien plein ; le meilleur à gauche. Bornée des deux côtés : la meilleure
 * valeur connue à gauche avec « la plus haute des 4 » (ou « la plus basse »), la pire à droite.
 */
function Piste({ valeurs, moi, sens }: { valeurs: number[]; moi: number; sens: string }) {
  const tri = [...valeurs].sort((x, y) => x - y);
  const min = tri[0], max = tri[tri.length - 1];
  const pos = (v: number) => (max === min ? 0 : sens === 'plus' ? ((max - v) / (max - min)) * 100 : ((v - min) / (max - min)) * 100);
  const meilleure = sens === 'plus' ? max : min;
  const pire = sens === 'plus' ? min : max;
  const dit = `la plus ${sens === 'moins' ? 'basse' : 'haute'} des ${valeurs.length}`;
  return (
    <div className="cn-piste" role="img" aria-label={`${nombreTexte(meilleure)}, ${dit} ; ${nombreTexte(pire)}, la moins bonne`}>
      <span className="cn-piste-trait" />
      {tri.map((v, i) => <span key={i} className={`cn-piste-rond${v === moi ? ' cn-piste-moi' : ''}`} style={{ left: `${pos(v)}%` }} />)}
      <span className="cn-piste-legende">
        <span className="cn-piste-borne"><span className="cn-mono">{nombreTexte(meilleure)}</span> <span className="cn-mut">{dit}</span></span>
        <span className="cn-mono cn-mut cn-piste-borne">{nombreTexte(pire)}</span>
      </span>
    </div>
  );
}
