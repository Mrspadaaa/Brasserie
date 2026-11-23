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
import { normaliser } from '../../domain/carnets/analyseLocale';
import { nombreTexte, placesDe, tableau as calculerTableau, type Place } from '../../domain/carnets/comparer';
import { parsePrix } from '../../domain/finance/upgradeRing';
import { dateCourte, montant, Provenance, rangTexte, valeurTexte, type ArticleV, type ContenuCarnetV, type CritereV, type FaconV, type ValeurV } from './EtatIA';
import './fiche-article.css';
import { marquerCassee, photoCassee, VignetteObjet } from './pictos';

export interface FicheArticleProps {
  article: ArticleV;
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

/** Une case de la grille « Caractéristiques » : son nom, sa valeur dite (ou « non publié »), son rang s'il classe. */
interface Case { nom: string; texte: string | null; unite?: string; rang?: number; exemple?: boolean }

export function FicheArticle(p: FicheArticleProps) {
  const a = p.article;
  const [, redessiner] = React.useState(0);
  const k = p.carnet;
  const devise = a.devise ?? 'CHF';
  const prix = prixTexte(a.prixCentimes, devise);
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
  const cases: Case[] = Object.entries(a.valeurs).filter(([nom]) => normaliser(nom) !== nomHeros).map(([nom, v]: [string, ValeurV]) => {
    const n = typeof v.valeur === 'string' && !milliersAPoint(v) ? nombreValeur(v) : null;
    return { nom, texte: n !== null ? nombreTexte(n) : valeurTexte(v), ...(v.unite ? { unite: v.unite } : {}), rang: rangDe(nom), exemple: v.origine === 'exemple' };
  });
  const dits = new Set([nomHeros, ...cases.map(c => normaliser(c.nom))]);
  for (const col of t?.colonnes ?? []) {
    if (cases.length >= 4) break;
    if (normaliser(col.nom) === 'prix' || dits.has(normaliser(col.nom))) continue;
    cases.push({ nom: col.nom, texte: null, ...(col.unite ? { unite: col.unite } : {}) });
    dits.add(normaliser(col.nom));
  }
  if (cases.length < 4 && a.dispo) cases.push({ nom: 'Disponibilité', texte: a.dispo });
  if (cases.length < 4 && a.pays) cases.push({ nom: 'Origine', texte: a.pays });

  /* Les offres de la même machine : même nom (normalisé), dans le carnet ; la moins chère d'abord. */
  const offres = k && a.nom
    ? k.articles.filter(x => x.nom && normaliser(x.nom) === normaliser(a.nom!)).sort((x, y) => (x.prixCentimes ?? Infinity) - (y.prixCentimes ?? Infinity))
    : [a];
  const qui = a.vendeur ?? a.domaine;
  const [poserPrix, setPoserPrix] = React.useState(false);
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
      {a.photo && !photoCassee(a.photo) ? (
        <figure className="cn-fiche-photo" data-cadre="photo"><img onError={() => { marquerCassee(a.photo!); redessiner(n => n + 1); }} src={a.photo} alt={`photo de la page collée : ${a.nom ?? a.domaine ?? 'article'}`} /><figcaption><Camera size={16} aria-hidden /> photo de la page collée{estExemple(a) ? <> <Provenance origine="exemple" /></> : null}</figcaption></figure>
      ) : (
        <figure className="cn-fiche-photo cn-fiche-picto" data-cadre="picto" aria-hidden>
          <VignetteObjet mots={[a.nom, p.facon?.nom, p.titreCarnet]} classe="cn-vignette-fiche" taille={132} />
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
              const p2 = prixTexte(o.prixCentimes, o.devise ?? 'CHF');
              const corps = (
                <>
                  {offres.length > 1 && <span className={`cn-radio${moi ? ' cn-radio-on' : ''}`} aria-hidden />}
                  <span className="cn-sp">
                    <b>{[o.vendeur, o.pays].filter(Boolean).join(' · ') || o.domaine}</b>
                    {o.dispo && <span className="cn-mut">{o.dispo}</span>}
                  </span>
                  {p2 && <PrixMono texte={p2} />}
                  {!p2 && moi && <span className="cn-mut">prix ?</span>}
                </>
              );
              return (
                <div key={o.id} className={`cn-offre${moi ? ' cn-offre-moi' : ''}`}>
                  {!moi && p.onOffre ? <button type="button" className="cn-offre-corps" onClick={() => p.onOffre!(o.id)}>{corps}</button> : <span className="cn-offre-corps">{corps}</span>}
                  {moi && p.onPrix && !poserPrix && (p2
                    ? <button type="button" className="cn-ico" aria-label="Modifier le prix" onClick={() => setPoserPrix(true)}><Pencil size={16} aria-hidden /></button>
                    : <button type="button" className="cn-lien cn-poser-prix-ouvrir" onClick={() => setPoserPrix(true)}>Poser le prix</button>)}
                  {o.url && <a className="cn-lien" href={o.url} target="_blank" rel="noreferrer noopener">Ouvrir <ExternalLink size={16} aria-hidden /></a>}
                </div>
              );
            })}
          </div>
          {poserPrix && p.onPrix && <PoserPrix centimes={a.prixCentimes} onPoser={c => { p.onPrix!(c); setPoserPrix(false); }} onFermer={() => setPoserPrix(false)} />}
        </>
      )}
      {cases.length > 0 && (
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
          <p className="cn-mut">Part dans À venir : {[a.nom, a.vendeur].filter(Boolean).join(', ')}{prix ? <>, <PrixMono texte={prix} /></> : null}{a.dispo ? `, ${a.dispo}` : ''}, avec le pourquoi.</p>
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
