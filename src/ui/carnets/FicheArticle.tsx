/**
 * L'article ouvert (R05, figé p2:h01-6) : la photo de la page (ou, sans photo, le picto de l'objet), le nom entier, la façon et sa
 * raison, le héros du critère (la valeur en gros, sa piste et « la plus basse des 5 »), les offres de la même machine (vendeur, prix
 * avec sa devise, Ouvrir ↗), les caractéristiques lues avec leur rang (« 2e »), la veille, « Choisir » en vert.
 * Places et rangs : `placesDe(tableau(carnet), id)` de comparer.ts, parmi les articles en lice dont la valeur est connue ; rien n'est
 * inventé. Prix barré : seulement si un prix d'avant existe dans le document ; la relève n'existe pas encore (R31), donc aucun.
 * Veille (R31, D-28) : libellé et bascule de g5:v06-10, « Veille du prix, tous les 3 jours », éteinte à la naissance ; allumée et
 * sans relève, « demandée · pas encore relevée » : aucune date de relève, aucun prix relevé, aucune baisse.
 */
import React from 'react';
import { Camera, Check, ChevronLeft, ExternalLink, Eye } from 'lucide-react';
import { Bascule, mesureCritere, nombreValeur } from './CarteArticle';
import { normaliser } from '../../domain/carnets/analyseLocale';
import { placesDe, tableau as calculerTableau, type Place } from '../../domain/carnets/comparer';
import { dateCourte, montant, Provenance, rangTexte, valeurTexte, type ArticleV, type ContenuCarnetV, type CritereV, type FaconV } from './EtatIA';
import { VignetteObjet } from './pictos';

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
}

interface Heros { nom: string; libelle: string; texte: string; unite?: string; valeurs: number[] | null; moi: number | null; sens: string; dit: string | null }

/** Le héros : la 1re place d'un critère qui classe (plus ou moins), sinon la 1re valeur chiffrée ; le prix jamais. */
function herosDe(places: Place[], criteres: CritereV[]): Heros | null {
  const chiffree = (x: Place) => x.nom !== 'prix' && x.valeur !== undefined && (x.sens === 'plus' || x.sens === 'moins');
  const pl = places.find(x => x.critere && chiffree(x)) ?? places.find(chiffree);
  if (!pl) return null;
  const cr = criteres.find(c => c.caracteristique && normaliser(c.caracteristique.nom) === normaliser(pl.nom));
  const sur = pl.toutes?.length ?? pl.sur;
  const dit = pl.rang === 1 && !pl.exAequo && sur > 1 ? `la plus ${pl.sens === 'moins' ? 'basse' : 'haute'} des ${sur}` : pl.rang && sur > 1 ? `${rangTexte(pl.rang)} sur ${sur}` : null;
  const suffixe = pl.unite ? ` ${pl.unite}` : '';
  const texte = suffixe && pl.texte.endsWith(suffixe) ? pl.texte.slice(0, -suffixe.length) : pl.texte;
  return { nom: pl.nom, libelle: cr?.texte ?? pl.nom, texte, unite: pl.unite, valeurs: pl.toutes && pl.toutes.length > 1 ? pl.toutes : null, moi: pl.valeur ?? null, sens: pl.sens, dit };
}

export function FicheArticle(p: FicheArticleProps) {
  const a = p.article;
  const k = p.carnet;
  const prix = montant(a.prixCentimes);
  const devise = a.devise ?? 'CHF';
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
  const heros = k ? herosDe(places, k.criteres) : (() => {
    const m = mesureCritere(a, p.critere);
    const carac = p.critere?.caracteristique;
    if (!m || !carac) return null;
    const moi = nombreValeur(a.valeurs[carac.nom]);
    const valeurs = p.autresMesures && p.autresMesures.length > 1 ? p.autresMesures : null;
    const best = valeurs && moi !== null ? (carac.sens === 'moins' ? Math.min(...valeurs) : Math.max(...valeurs)) === moi : false;
    return { nom: carac.nom, libelle: p.critere!.texte, texte: m.texte, unite: m.unite, valeurs, moi, sens: carac.sens, dit: best && valeurs ? `la plus ${carac.sens === 'moins' ? 'basse' : 'haute'} des ${valeurs.length}` : null } as Heros;
  })();
  const nomHeros = heros ? normaliser(heros.nom) : '';
  const rangDe = (nom: string): number | undefined => {
    if (p.rangs?.[nom]) return p.rangs[nom];
    const pl = places.find(x => normaliser(x.nom) === normaliser(nom));
    /* un rang se dit sur une valeur qui classe (plus ou moins) ; une valeur lue dont le sens est inconnu ne se classe pas */
    return pl?.rang && (pl.sens === 'plus' || pl.sens === 'moins') && (pl.toutes?.length ?? pl.sur) > 1 ? pl.rang : undefined;
  };
  const autres = Object.entries(a.valeurs).filter(([nom]) => normaliser(nom) !== nomHeros);

  /* Les offres de la même machine : même nom (normalisé), dans le carnet ; la moins chère d'abord. */
  const offres = k && a.nom
    ? k.articles.filter(x => x.nom && normaliser(x.nom) === normaliser(a.nom!)).sort((x, y) => (x.prixCentimes ?? Infinity) - (y.prixCentimes ?? Infinity))
    : [a];
  const qui = a.vendeur ?? a.domaine;

  return (
    <article className="cn-page cn-fiche">
      <div className="cn-tete">
        <button type="button" className="cn-retour" onClick={p.onRetour}><ChevronLeft size={20} aria-hidden /> Articles · {p.titreCarnet}</button>
        <span className="cn-sp" />
        {rang !== undefined && sur ? <span className="cn-pastille cn-pastille-vert">{rangTexte(rang)} sur {sur}</span> : null}
      </div>
      {a.photo ? (
        <figure className="cn-fiche-photo"><img src={a.photo} alt="" /><figcaption><Camera size={16} aria-hidden /> photo de la page collée</figcaption></figure>
      ) : (
        <figure className="cn-fiche-photo cn-fiche-picto" aria-hidden>
          <VignetteObjet mots={[a.nom, p.facon?.nom, p.titreCarnet]} classe="cn-vignette-fiche" taille={88} />
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
          <div>
            <span className="cn-mut">{heros.libelle}</span>
            <span className="cn-mesure-val"><span className="cn-mono">{heros.texte}</span>{heros.unite ? <small> {heros.unite}</small> : null}</span>
          </div>
          {heros.valeurs && heros.moi !== null
            ? <Piste valeurs={heros.valeurs} moi={heros.moi} sens={heros.sens} dit={heros.dit} />
            : heros.dit ? <span className="cn-mut">{heros.dit}</span> : null}
        </div>
      )}
      {(prix || qui) && (
        <>
          <h3 className="cn-sous">{offres.length > 1 ? <>{offres.length} offres <span className="cn-mut">même machine</span></> : 'Offre'}</h3>
          <div className="cn-offres">
            {offres.map(o => {
              const moi = o.id === a.id;
              const p2 = montant(o.prixCentimes);
              const corps = (
                <>
                  {offres.length > 1 && <span className={`cn-radio${moi ? ' cn-radio-on' : ''}`} aria-hidden />}
                  <span className="cn-sp">
                    <b>{[o.vendeur, o.pays].filter(Boolean).join(' · ') || o.domaine}</b>
                    {o.dispo && <span className="cn-mut">{o.dispo}</span>}
                  </span>
                  {p2 && <span className="cn-nowrap"><span className="cn-mono cn-prix">{p2}</span> <span className="cn-mut">{o.devise ?? 'CHF'}</span></span>}
                </>
              );
              return (
                <div key={o.id} className={`cn-offre${moi ? ' cn-offre-moi' : ''}`}>
                  {!moi && p.onOffre ? <button type="button" className="cn-offre-corps" onClick={() => p.onOffre!(o.id)}>{corps}</button> : <span className="cn-offre-corps">{corps}</span>}
                  {o.url && <a className="cn-lien" href={o.url} target="_blank" rel="noreferrer noopener">Ouvrir <ExternalLink size={16} aria-hidden /></a>}
                </div>
              );
            })}
          </div>
        </>
      )}
      {autres.length > 0 && (
        <>
          <h3 className="cn-sous">Caractéristiques {lu && <span className="cn-mut">lues sur la fiche du vendeur, {lu}</span>}</h3>
          <dl className="cn-carac">
            {autres.map(([nom, v]) => {
              const tx = valeurTexte(v);
              const r = rangDe(nom);
              return (
                <div key={nom}>
                  <dt>{nom}</dt>
                  <dd>{tx === null ? <span className="cn-mut">non publié</span> : <><span className="cn-mono">{tx}</span>{v.unite ? ` ${v.unite}` : ''}</>}
                    {r ? <span className="cn-vert cn-carac-rang"> {rangTexte(r)}</span> : null}
                    {v.origine === 'exemple' && <> <Provenance origine="exemple" /></>}
                  </dd>
                </div>
              );
            })}
          </dl>
        </>
      )}
      <div className="cn-veille-bloc">
        <div className="cn-veille-ligne">
          <Eye size={18} aria-hidden />
          <span className="cn-sp">Veille du prix, tous les 3 jours</span>
          <Bascule active={veille} onChange={p.onVeille} etiquette="Veille du prix, tous les 3 jours" />
        </div>
        {veille && !a.veille?.releveLe && <p className="cn-mut cn-veille-etat">demandée · pas encore relevée</p>}
      </div>
      {!p.choisi && p.onChoisir && (
        <>
          <button type="button" className="cn-action cn-action-vert cn-large" onClick={p.onChoisir}><Check size={18} aria-hidden /> Choisir{a.vendeur ? ` · ${a.vendeur}` : ''}</button>
          <p className="cn-mut">Part dans À venir : {[a.nom, a.vendeur, prix ? `${prix} ${devise}` : null, a.dispo].filter(Boolean).join(', ')}, avec le pourquoi.</p>
        </>
      )}
    </article>
  );
}

/** Piste des valeurs connues (« la plus basse des 5 ») : un rond par article, le sien plein ; la pire valeur au bout. */
function Piste({ valeurs, moi, sens, dit }: { valeurs: number[]; moi: number; sens: string; dit: string | null }) {
  const tri = [...valeurs].sort((x, y) => x - y);
  const min = tri[0], max = tri[tri.length - 1];
  /* le meilleur à gauche, comme h01-6 : sens « plus », l'axe est retourné */
  const pos = (v: number) => (max === min ? 0 : sens === 'plus' ? ((max - v) / (max - min)) * 100 : ((v - min) / (max - min)) * 100);
  const pire = sens === 'plus' ? min : max;
  return (
    <div className="cn-piste" aria-hidden>
      <span className="cn-piste-trait" />
      {tri.map((v, i) => <span key={i} className={`cn-piste-rond${v === moi ? ' cn-piste-moi' : ''}`} style={{ left: `${pos(v)}%` }} />)}
      <span className="cn-piste-legende"><span className="cn-mut">{dit ?? ''}</span><span className="cn-mono cn-mut">{String(pire).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}</span></span>
    </div>
  );
}
