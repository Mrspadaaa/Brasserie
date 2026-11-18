/**
 * Choisir, choisi, pourquoi (R07, figés p2:g05-9, p2:g05-11, p2:v03-7, p2:v09-3 ; R34, D-20 ; R32).
 * - `choisir` (g05-9) : l'article en tête, dans un cadre pointillé : prix, vendeur, Ouvrir ↗, « Ses autres valeurs · place
 *   parmi les n », « Choisir chez <vendeur> » et « Écarter », « Part dans À venir : … , avec le pourquoi. » ; le pourquoi est
 *   proposé (IA ou calcul) dans un champ qu'il corrige ; les autres articles dessous.
 * - `choisi` (g05-11) : « Choisi le 14 nov. », l'article, « Pourquoi ce choix » : la phrase, puis critère, façon, fournisseur (✓) et
 *   écartés (✕) ; un choix revu reste lisible (« Choix d'avant », ADR) ; « Envoyer dans À venir » seulement sur l'idée choisie et
 *   pas encore envoyée, sinon « Dans À venir depuis le … · Voir » (R32). Aucune caisse ni trésorerie ici.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarCheck, Check, ChevronLeft, ChevronRight, ExternalLink, X } from 'lucide-react';
import { libelleEcarte, nombreTexte, placesDe, pourquoiDe, prixTexte, tableau, type Place } from '../../domain/carnets/comparer';
import { normaliser } from '../../domain/carnets/analyseLocale';
import { sourceDuCritere, type Article, type DonneesCarnet } from '../../domain/carnets/modele';
import { dateCourte, montant, PictoLocal, Provenance, rangTexte, type ArticleV, type ChoixV, type CritereV, type FaconV } from './EtatIA';
import { sansApercu } from './Comparer';
import { Input, Textarea } from '../Input';
import './carnets-decider.css';

export interface ValeurPlaceeV { nom: string; texte: string; rang?: number; exAequo?: boolean }

/** Ce que Choisir lit du carnet pour calculer places, pourquoi et écartés (P16, P17) : `ouvert.carnet`. */
export type CarnetPourChoisir = Pick<DonneesCarnet, 'criteres' | 'facons' | 'articles' | 'choix'>;

export type ChoisirProps = {
  titre: string;
  onRetour: () => void;
  /** Le carnet (`ouvert.carnet`) : sans lui, les places et le pourquoi se calculent sur les seuls articles reçus. */
  carnet?: CarnetPourChoisir;
  /** Le picto de l'article (lot B), quand il n'a pas de photo. */
  picto?: React.ReactNode;
} & (
  | {
    etape: 'choisir';
    article: ArticleV;
    sur: number;
    valeurs: ValeurPlaceeV[];
    autres: { article: ArticleV; rang: number; mesure?: string }[];
    pourquoiPropose?: string;
    onChoisir: (pourquoi: string) => void;
    onEcarter: (raison: string) => void;
  }
  | {
    etape: 'choisi';
    choix: ChoixV;
    article: ArticleV;
    critere?: CritereV;
    facon?: FaconV;
    /** Les articles écartés au choix, avec leur nom. */
    ecartes: { nom: string; raison: string }[];
    remplaces?: { nom: string; pourquoi: string; le: string }[];
    sortie?: { le: string } | null;
    onEnvoyerAVenir?: () => void;
    onVoirAVenir?: () => void;
  }
);

export function Choisir(p: ChoisirProps) {
  if (p.etape === 'choisir') return <ChoisirArticle {...p} />;
  return <ChoisiVue {...p} />;
}

/** Le carnet de calcul : celui reçu, sinon un carnet fait des seuls articles reçus (sans critère : prix et valeurs lues). */
function carnetDeCalcul(p: { carnet?: CarnetPourChoisir }, articles: readonly ArticleV[]): CarnetPourChoisir {
  if (p.carnet) return p.carnet;
  return { criteres: [], facons: [], articles: articles as unknown as Article[], choix: undefined };
}

/** « 1er sur 5 » (g05-11) : la place, au masculin comme la maquette. */
const placeTexte = (pl: Place) => (pl.rang ? `${pl.rang === 1 ? '1er' : `${pl.rang}e`} sur ${pl.sur}${pl.exAequo ? ' ex aequo' : ''}` : null);
const chiffre = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

/**
 * La réglette de g05-11 : un point par article en lice dont la valeur est connue, le choisi plein ; à gauche le meilleur (« ‹ mieux · 0 »,
 * « ‹ moins cher · 190 »), à droite le pire, avec l'unité. La place se lit en chiffres au-dessus (« 1 800 m³/h · 1er sur 4 »).
 */
export function Reglette({ place, sansTete }: { place: Place; sansTete?: boolean }) {
  if (place.valeur === undefined || place.meilleure === undefined || place.pire === undefined || !place.toutes) return null;
  const prix = place.nom === 'prix';
  const borne = (v: number) => (prix ? chiffre(Math.round(v / 100)) : nombreTexte(v));
  const etendue = place.pire - place.meilleure;
  const pos = (v: number) => (etendue === 0 ? 0 : Math.max(0, Math.min(1, (v - place.meilleure!) / etendue)));
  const unite = place.unite ? ` ${place.unite}` : '';
  return (
    <div className={`cn-reglette${sansTete ? ' cn-reglette-seule' : ''}`} role="img" aria-label={`${place.nom} : ${place.texte}, ${placeTexte(place) ?? ''}`}>
      {!sansTete && <div className="cn-reglette-tete"><b>{place.nom.charAt(0).toUpperCase() + place.nom.slice(1)}</b><span className="cn-sp" /><span><b className="cn-mono">{place.texte}</b>{placeTexte(place) ? <span className="cn-mut"> · {placeTexte(place)}</span> : null}</span></div>}
      <div className="cn-reglette-piste" aria-hidden>
        {place.toutes.map((v, i) => <i key={i} style={{ left: `${pos(v) * 100}%` }} />)}
        <i className="cn-reglette-moi" style={{ left: `${pos(place.valeur) * 100}%` }} />
      </div>
      <div className="cn-reglette-bornes cn-mut" aria-hidden><span>‹ {prix ? 'moins cher' : 'mieux'} · {borne(place.meilleure)}</span><span>{borne(place.pire)}{unite}</span></div>
    </div>
  );
}

/**
 * L'état « choisi » (g05-11). Il remplace l'écran Choisir sur place, au bas duquel on vient de toucher « Choisir » : à son arrivée, la
 * vue défile pour mettre « Choisi le … » et « Pourquoi ce choix » en haut de l'écran (sinon on reste face au bas de la page).
 */
/**
 * Les écartés lisibles sous « Pourquoi ce choix » (P17) : ceux du choix, puis ceux du tableau (façon écartée), chacun une fois, nom et
 * raison (sans « écarté : » : le ✕ le dit).
 */
function ecartesDe(p: { ecartes: { nom: string; raison: string }[] }, c: CarnetPourChoisir | null): { nom: string; raison: string }[] {
  const sortie = [...p.ecartes];
  const vus = new Set(sortie.map(e => normaliser(e.nom)));
  const t = c ? tableau(c) : null;
  for (const l of t?.lignes ?? []) {
    if (!l.ecarte || vus.has(normaliser(l.nom))) continue;
    vus.add(normaliser(l.nom));
    sortie.push({ nom: l.nom, raison: l.ecarte.raison });
  }
  return sortie.map(e => ({ nom: e.nom, raison: libelleEcarte(e.raison).replace(/^écarté : /, '') }));
}

function ChoisiVue(p: Extract<ChoisirProps, { etape: 'choisi' }>) {
  const a = p.article;
  const le = dateCourte(p.choix.le);
  const sortieLe = dateCourte(p.sortie?.le);
  const haut = useRef<HTMLElement>(null);
  useEffect(() => { haut.current?.scrollIntoView?.({ block: 'start' }); }, []);
  /* n° 37 : « 2 600 CHF », espace avant les milliers, comme partout (prixTexte) */
  const prix = prixTexte(a.prixCentimes, a.devise);
  /* P17 : la phrase avec ses valeurs (calcul local sur le tableau), ses réglettes (le critère chiffré qui classe, puis le prix), les ✕ */
  const calc = useMemo(() => {
    const c = p.carnet ?? null;
    const t = c ? tableau(c) : null;
    const places = t ? placesDe(t, a.id) : [];
    const premierChiffre = places.find(pl => pl.critere && pl.rang && (pl.sens === 'plus' || pl.sens === 'moins'));
    const prixPl = places.find(pl => pl.nom === 'prix' && pl.rang);
    return {
      phrase: c ? pourquoiDe(c, a.id) : null,
      reglettes: [premierChiffre, prixPl].filter((x): x is Place => !!x && x.sur > 1),
      ecartes: ecartesDe(p, c)
    };
  }, [p.carnet, a.id, p.ecartes]);
  const sienne = p.choix.pourquoi.trim();
  return (
    <article ref={haut} className="cn-page cn-choisi">
      <div className="cn-tete">
        <button type="button" className="cn-retour" onClick={p.onRetour}><ChevronLeft size={20} aria-hidden /> Carnets</button>
        <span className="cn-sp" />
        <span className="cn-pastille cn-statut-validated">Choisi{le ? ` le ${le}` : ''}</span>
      </div>
      <h2 className="cn-titre">{p.titre}</h2>
      <div className="cn-carte cn-choisi-carte">
        {a.photo ? <img className="cn-vignette cn-choisi-photo" src={a.photo} alt="" /> : p.picto ? <span className="cn-vignette cn-choisi-photo cn-vignette-vide" aria-hidden>{p.picto}</span> : null}
        <div className="cn-sp">
          <b>{a.nom}</b>
          <span className="cn-mut">{[a.vendeur, a.pays].filter(Boolean).join(' · ')}</span>
          {(prix || a.dispo) && <span><b className="cn-mono">{prix ?? ''}</b>{prix && a.dispo ? <span className="cn-mut"> · </span> : null}{a.dispo ? <span className="cn-mut">{a.dispo}</span> : null}</span>}
        </div>
      </div>
      <section className="cn-pourquoi" aria-label="Pourquoi ce choix">
        <h3 className="cn-sous">Pourquoi ce choix</h3>
        {calc.phrase && <p className="cn-pourquoi-phrase"><PictoLocal /> {calc.phrase}</p>}
        {sienne && sienne !== calc.phrase && <p className="cn-pourquoi-sienne">« {sienne} »</p>}
        {calc.reglettes.map(pl => <Reglette key={pl.nom} place={pl} />)}
        <ul className="cn-raisons">
          {p.critere && <li><Check size={18} role="img" aria-label="retenu" className="cn-ok" /><span><b>Critère</b> : {p.critere.texte}{sourceDuCritere(p.critere) === 'ia' ? ", proposé par l'IA" : ''}</span></li>}
          {p.facon && <li><Check size={18} role="img" aria-label="retenu" className="cn-ok" /><span><b>Façon {p.facon.nom.toLowerCase()}</b>{p.facon.raison ? ` : ${p.facon.raison}` : ''}</span></li>}
          {a.vendeur && <li><Check size={18} role="img" aria-label="retenu" className="cn-ok" /><span><b>{a.vendeur}</b>{a.dispo ? ` : ${a.dispo}` : ''}</span></li>}
          {calc.ecartes.map(e => <li key={e.nom}><X size={18} role="img" aria-label="écarté" /><span><b>{e.nom}</b> : {e.raison}</span></li>)}
        </ul>
        {p.choix.aRevoirSi && <p className="cn-mut">À revoir si : {p.choix.aRevoirSi}</p>}
        {p.remplaces && p.remplaces.length > 0 && (
          <details className="cn-avant">
            <summary>Choix d'avant · {p.remplaces.length}</summary>
            {p.remplaces.map((r, i) => <p key={i} className="cn-mut"><b className="cn-encre">{r.nom}</b>{dateCourte(r.le) ? `, le ${dateCourte(r.le)}` : ''} : {r.pourquoi}</p>)}
          </details>
        )}
        {a.origine === 'exemple' && <p className="cn-mut">Valeurs annoncées par les vendeurs, pas mesurées chez nous · <Provenance origine="exemple" /></p>}
      </section>
      {p.sortie ? (
        <button type="button" className="cn-avenir" onClick={p.onVoirAVenir}>
          <CalendarCheck size={18} aria-hidden /><span className="cn-sp">Dans À venir{sortieLe ? ` depuis le ${sortieLe}` : ''}</span><span>Voir</span><ChevronRight size={18} aria-hidden />
        </button>
      ) : p.onEnvoyerAVenir ? (
        <button type="button" className="cn-action" onClick={p.onEnvoyerAVenir}><CalendarCheck size={18} aria-hidden /> Envoyer dans À venir</button>
      ) : null}
    </article>
  );
}

function ChoisirArticle(p: Extract<ChoisirProps, { etape: 'choisir' }>) {
  const a = p.article;
  /* n° 37 : « 2 600 CHF » (prixTexte), jamais « 2600 » */
  const prix = prixTexte(a.prixCentimes, a.devise);
  /* P16 : places et pourquoi calculés sur le carnet (valeurs et rangs), jamais un champ vide à taper ; l'IA, si elle a dit, prime.
     n° 10 (g05-11) : chaque valeur chiffrée porte sa réglette ; les écartés du tableau sont dits avec leur ✕ et leur raison. */
  const calc = useMemo(() => {
    const c = carnetDeCalcul(p, [a, ...p.autres.map(o => o.article)]);
    const t = tableau(c);
    const places = t ? placesDe(t, a.id) : [];
    return {
      pourquoi: pourquoiDe(c, a.id),
      valeurs: places.filter(pl => pl.texte).map(pl => ({ nom: pl.nom.charAt(0).toUpperCase() + pl.nom.slice(1), texte: pl.texte, ...(pl.rang ? { rang: pl.rang } : {}), ...(pl.exAequo ? { exAequo: true } : {}), place: pl })),
      ecartes: p.carnet ? ecartesDe({ ecartes: [] }, p.carnet) : []
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.carnet, a.id]);
  const valeurs: (ValeurPlaceeV & { place?: Place })[] = p.valeurs.length ? p.valeurs : calc.valeurs;
  const propose = p.pourquoiPropose ?? calc.pourquoi ?? '';
  const [pourquoi, setPourquoi] = useState(propose);
  const [raison, setRaison] = useState<string | null>(null);
  /* Une page non lue ne se choisit pas : rien n'en est connu (ni nom, ni prix, ni valeurs) ; l'inconnu n'est jamais 0. */
  const sa = sansApercu(a);
  return (
    <article className="cn-page cn-choisir">
      <div className="cn-tete">
        <button type="button" className="cn-retour" onClick={p.onRetour}><ChevronLeft size={20} aria-hidden /> {p.titre}</button>
        <span className="cn-sp" />
        <span className="cn-pastille cn-statut-research">À comparer</span>
      </div>
      <section className="cn-choisir-cadre" aria-label="Choisir">
        {/* n° 10 : la photo du choisi, ou à défaut son picto en grand dans le cadre photo (R05, D-102) ; jamais un cube générique */}
        <div className="cn-offre cn-offre-choisir" data-apercu={sa ? 'aucun' : undefined}>
          {a.photo ? <img className="cn-vignette cn-offre-photo" src={a.photo} alt="" /> : p.picto ? <span className="cn-vignette cn-offre-photo cn-vignette-vide" aria-hidden>{p.picto}</span> : null}
          {sa
            ? <div className="cn-sp"><b>{sa.titre}</b><span className="cn-mut">{sa.sous}</span></div>
            : <div className="cn-sp cn-offre-nom"><b>{a.nom ?? a.vendeur}</b><span className="cn-mut">{[a.nom ? a.vendeur : null, a.pays].filter(Boolean).join(' · ')}{a.dispo ? `${a.vendeur || a.pays ? ' · ' : ''}${a.dispo}` : ''}</span>
              {prix && <span className="cn-offre-prix"><span className="cn-radio" aria-hidden /><span className="cn-mono cn-prix-grand">{prix}</span></span>}</div>}
          {a.url && <a className="cn-lien" href={a.url} target="_blank" rel="noreferrer noopener" aria-label={`Ouvrir la page${a.vendeur ? ` de ${a.vendeur}` : ''}, nouvel onglet`}>Ouvrir <ExternalLink size={16} aria-hidden /></a>}
        </div>
        {/* g05-9 : « Ses autres valeurs · place parmi les n » ; g05-11 : sous chaque valeur chiffrée, sa réglette (« 1er sur 4 ») */}
        {valeurs.length > 0 && (
          <table className="cn-place">
            <thead><tr><th scope="col" colSpan={2}>Ses autres valeurs</th><th scope="col" className="cn-mut">place parmi les {p.sur}</th></tr></thead>
            <tbody>
              {valeurs.map(v => {
                const pl = v.place;
                const chiffree = !!pl && pl.valeur !== undefined && pl.sur > 1 && (pl.sens === 'plus' || pl.sens === 'moins');
                const rang = pl ? placeTexte(pl) : v.rang ? `${rangTexte(v.rang)}${v.exAequo ? ' ex aequo' : ''}` : '';
                return (
                  <React.Fragment key={v.nom}>
                    <tr className={chiffree ? 'cn-place-avec-reglette' : undefined}><th scope="row">{v.nom}</th><td className="cn-mono">{v.texte}</td><td className={v.rang === 1 ? 'cn-vert' : 'cn-mut'}>{rang}</td></tr>
                    {chiffree && <tr className="cn-place-reglette"><td colSpan={3}><Reglette place={pl!} sansTete /></td></tr>}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
        {calc.ecartes.length > 0 && (
          <ul className="cn-raisons cn-choisir-ecartes" aria-label={`Écartés, ${calc.ecartes.length}`}>
            {calc.ecartes.map(e => <li key={e.nom}><X size={18} role="img" aria-label="écarté" /><span><b>{e.nom}</b> : {e.raison}</span></li>)}
          </ul>
        )}
        <label className="cn-pourquoi-champ">
          <span>Pourquoi {p.pourquoiPropose ? <Provenance origine="ia" /> : propose ? <PictoLocal /> : null}{propose ? <span className="cn-mut"> · proposé, à corriger</span> : null}</span>
          <Textarea rows={3} value={pourquoi} onChange={e => setPourquoi(e.target.value)} placeholder="une phrase suffit" />
        </label>
        <div className="cn-rang-boutons">
          {/* n° 33 : un geste, un habit : vert et ✓, comme « Choisir · <vendeur> » de l'article (FicheArticle) */}
          <button type="button" className="cn-action cn-action-vert cn-sp" disabled={!!sa} aria-describedby={sa ? `cn-non-lue-${a.id}` : undefined} onClick={() => { if (!sa) p.onChoisir(pourquoi.trim()); }}><Check size={18} aria-hidden /> Choisir{a.vendeur && !sa ? ` chez ${a.vendeur}` : ''}</button>
          <button type="button" className="cn-second" onClick={() => setRaison(raison === null ? '' : null)}>Écarter</button>
        </div>
        {raison !== null && (
          <form className="cn-rang-boutons" autoComplete="off" onSubmit={e => { e.preventDefault(); if (raison.trim()) p.onEcarter(raison.trim()); }}>
            <Input className="cn-entree cn-sp" value={raison} onChange={e => setRaison(e.target.value)} placeholder="raison, en quelques mots" aria-label="Raison de l'écart" />
            <button type="submit" className="cn-second" disabled={!raison.trim()}>Écarter</button>
          </form>
        )}
        {sa
          ? <p id={`cn-non-lue-${a.id}`} className="cn-mut">Page non lue : ni nom, ni prix connus. Elle se choisit une fois lue.</p>
          : <p className="cn-mut">Part dans À venir : {[prix, a.dispo, a.vendeur].filter(Boolean).join(', ')}, avec le pourquoi.</p>}
      </section>
      {p.autres.map(o => {
        const so = sansApercu(o.article);
        return (
          <div key={o.article.id} className="cn-carte cn-article" data-apercu={so ? 'aucun' : undefined}>
            <span className="cn-rang">{o.rang}</span>
            {o.article.photo ? <img className="cn-vignette" src={o.article.photo} alt="" /> : null}
            {so
              ? <div className="cn-article-tx"><b>{so.titre}</b><span className="cn-mut">{so.sous}</span></div>
              : <div className="cn-article-tx"><b>{o.article.nom}</b><span className="cn-mut">{[o.article.vendeur, o.article.pays].filter(Boolean).join(' · ')}</span></div>}
            <div className="cn-droite">{montant(o.article.prixCentimes) && <span className="cn-mono cn-prix">{montant(o.article.prixCentimes)}</span>}{o.mesure && <span className="cn-mut">{o.mesure}</span>}</div>
          </div>
        );
      })}
    </article>
  );
}
