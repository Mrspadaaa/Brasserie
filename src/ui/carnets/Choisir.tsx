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
import { CalendarCheck, Check, ChevronLeft, ChevronRight, ExternalLink, Target, X } from 'lucide-react';
import { libelleEcarte, nombreTexte, placesDe, placesParmiTous, pourquoiDe, prixTexte, tableau, type Place } from '../../domain/carnets/comparer';
import { normaliser } from '../../domain/carnets/analyseLocale';
import { dispoDe, sourceDuCritere, type Article, type DonneesCarnet } from '../../domain/carnets/modele';
import { detailPrix, prixUnique } from './PrixPastille';
import { dateCourte, montant, PictoLocal, Provenance, rangTexte, texteSortie, type SortieV, type ArticleV, type ChoixV, type CritereV, type FaconV } from './EtatIA';
import { choixBloque, horsSeuilCourt, sansApercu } from './Comparer';
import { Photo } from './pictos';
import { Input, Textarea } from '../Input';
import './carnets-decider.css';
import { liesParNbsp } from './insecable';

export interface ValeurPlaceeV { nom: string; texte: string; rang?: number; exAequo?: boolean }

/** Ce que Choisir lit du carnet pour calculer places, pourquoi et écartés (P16, P17) : `ouvert.carnet`. */
export type CarnetPourChoisir = Pick<DonneesCarnet, 'criteres' | 'facons' | 'articles' | 'choix'>;

/** D447 : « ≈1 360 CHF » pour un prix hors franc converti, « 690 CHF » sinon (`prixTexte` de comparer.ts). */
function prixChoix(a: ArticleV, taux?: number): string | null {
  /* R63 (C67B-8) : UN prix du sachet partout : le rendu arrondi (≈4 CHF), celui de la liste, de la fiche et de Comparer ; jamais le converti nu (≈3) */
  const t = prixUnique(a, taux);
  /* seul le prix converti change de forme ; en francs, le format d'avant (`prixTexte`) */
  return t?.approx ? `≈${t.montant} ${t.devise}` : prixTexte(a.prixCentimes, a.devise);
}

export type ChoisirProps = {
  /** D447 : le taux EUR→CHF (facture ou posé) ; sans lui, le cours du jour lu avec la page. */
  taux?: number;
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
    /** R54 : la quantité cochée sur la fiche (1 kg) et son prix en francs : ils font le prix annoncé et celui qui part dans À venir. */
    quantite?: { kg: number; libelle: string; centimes: number };
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
    sortie?: SortieV | null;
    onEnvoyerAVenir?: () => void;
    onVoirAVenir?: () => void;
    /** D419 : ouvre le Calendrier sur l'achat prévu du choix. */
    onPlacer?: () => void;
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

/**
 * « 1er sur 5 » (g05-11) : la place, au masculin comme la maquette. Critique 6, n° 6 : un ex aequo se compte sur les seuls articles qui
 * partagent la valeur (« 1er sur 2 ex aequo » quand deux tiennent 80 °C), jamais sur tous les connus.
 */
const placeTexte = (pl: Place) => (pl.rang ? `${pl.rang === 1 ? '1er' : `${pl.rang}e`} sur ${pl.exAequo && pl.partage ? `${pl.partage} ex aequo` : pl.sur}` : null);
/** Le nom d'une place, par sa caractéristique (n° 7 : « Ambiance max », jamais « °C » seul), avec une majuscule. */
const nomPlace = (pl: Place) => { const n = pl.libelle ?? pl.nom; return n.charAt(0).toUpperCase() + n.slice(1); };

/**
 * g05-11 : ce qui a été retenu, une ligne chacun : le critère (◎, avec sa source : « proposé par l'IA » ou de votre phrase), la façon (✓)
 * et le fournisseur (✓). Rien d'inventé : chaque mot vient du carnet.
 */
function Retenus({ criteres, facon, vendeur, dispo }: { criteres: readonly CritereV[]; facon?: FaconV; vendeur?: string; dispo?: string }) {
  /* tour 3, f5c n° 8 : tous les critères qui classent, dans l'ordre (« tient 80 °C, puis le débit ») ; la source une fois si commune */
  const sources = criteres.map(k => sourceDuCritere(k));
  const une = sources.every(s => s === sources[0]);
  return <>
    {criteres.length > 0 && <li><Target size={18} role="img" aria-label="critère" className="cn-ok" /><span><b>{criteres.length > 1 ? 'Critères' : 'Critère'}</b> : {criteres.map((k, i) => `${i ? ', puis ' : ''}${k.texte}${!une && sources[i] === 'ia' ? " (proposé par l'IA)" : ''}`).join('')}{une && sources[0] === 'ia' ? ", proposé par l'IA" : ''}</span></li>}
    {facon && <li><Check size={18} role="img" aria-label="retenu" className="cn-ok" /><span><b>Façon {facon.nom.toLowerCase()}</b>{facon.raison ? ` : ${facon.raison}` : ''}</span></li>}
    {vendeur && <li><Check size={18} role="img" aria-label="retenu" className="cn-ok" /><span><b>{vendeur}</b>{dispo ? ` : ${dispo}` : ''}</span></li>}
  </>;
}
/** Tour 3, f5c n° 8 : les critères du carnet qui classent, dans l'ordre des colonnes du tableau (celui de Comparer). */
function criteresQuiRangent(c: CarnetPourChoisir | null | undefined, t: ReturnType<typeof tableau> | null): CritereV[] {
  if (!c || !t) return [];
  return t.colonnes.filter(x => x.critereId && x.sens !== 'texte')
    .map(x => c.criteres.find(k => k.id === x.critereId))
    .filter((k): k is NonNullable<typeof k> => !!k && !!k.caracteristique && k.caracteristique.sens !== 'texte') as unknown as CritereV[];
}
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
  /* R65 (C67B-3) : l'unité se dit aux DEUX bornes (« ‹ moins cher · 67 CHF/kg » … « 68 CHF/kg »), jamais un « 67 » nu */
  const unite = place.unite ? ` ${place.unite}` : '';
  return (
    <div className={`cn-reglette${sansTete ? ' cn-reglette-seule' : ''}`} role="img" aria-label={`${place.libelle ?? place.nom} : ${place.texte}, ${placeTexte(place) ?? ''}`}>
      {!sansTete && <div className="cn-reglette-tete"><b>{nomPlace(place)}</b><span className="cn-sp" /><span><b className="cn-mono">{place.texte}</b>{placeTexte(place) ? <span className="cn-mut"> · {placeTexte(place)}</span> : null}</span></div>}
      <div className="cn-reglette-piste" aria-hidden>
        {place.toutes.map((v, i) => <i key={i} style={{ left: `${pos(v) * 100}%` }} />)}
        <i className="cn-reglette-moi" style={{ left: `${pos(place.valeur) * 100}%` }} />
      </div>
      <div className="cn-reglette-bornes cn-mut" aria-hidden><span>‹ {prix ? 'moins cher' : 'mieux'} · {borne(place.meilleure)}{unite}</span><span>{borne(place.pire)}{unite}</span></div>
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
  const haut = useRef<HTMLElement>(null);
  useEffect(() => { haut.current?.scrollIntoView?.({ block: 'start' }); }, []);
  /* n° 37 : « 2 600 CHF », espace avant les milliers, comme partout (prixTexte) */
  /* R63 (C67B-1) : un choix fait avec une quantité (1 kg cochée) dit CETTE quantité et son prix (≈40 CHF · 1 kg), jamais le sachet de 50 g de l'article */
  const qte = p.choix.quantite && typeof p.choix.prixCentimes === 'number' && p.choix.prixCentimes > 0 ? { libelle: p.choix.quantite.libelle, centimes: p.choix.prixCentimes } : null;
  const prix = qte ? `${(a.devise ?? 'CHF') === 'CHF' ? '' : '≈'}${prixTexte(qte.centimes, 'CHF') ?? ''}` : prixChoix(a, p.taux);
  const detail = qte ? qte.libelle : detailPrix(a, p.taux);
  /* P17 : la phrase avec ses valeurs (calcul local sur le tableau), ses réglettes (le critère chiffré qui classe, puis le prix), les ✕ */
  const calc = useMemo(() => {
    const c = p.carnet ?? null;
    const t = c ? tableau(c) : null;
    /* g05-11 : « 1er sur 5 », parmi tout ce qu'il a vu, écartés compris (le choix revu du frigo n'a plus qu'un article en lice) */
    const places = t ? placesParmiTous(t, a.id) : [];
    const premierChiffre = places.find(pl => pl.critere && pl.rang && (pl.sens === 'plus' || pl.sens === 'moins'));
    const prixPl = places.find(pl => pl.nom === 'prix' && pl.rang);
    return {
      phrase: c ? pourquoiDe(c, a.id) : null,
      /* f5c n° 8, f9 n° 1 : les critères qui ont classé le choix, dans l'ordre (« tient 80 °C, puis le débit ») ; le critère reçu
         (le 1er du carnet) seulement si aucun ne classe : sans valeur à comparer (« capter la buée »), il n'a pas fait le choix */
      criteres: ((r: CritereV[]) => (r.length ? r : p.critere ? [p.critere] : []))(criteresQuiRangent(c, t)),
      /* R63 : la place « Prix » est celle du sachet ; un choix à la quantité (1 kg) ne la redit pas sous son prix du kilo (comme ChoisirArticle) */
      reglettes: [premierChiffre, qte ? undefined : prixPl].filter((x): x is Place => !!x && x.sur > 1),
      ecartes: ecartesDe(p, c)
    };
  }, [p.carnet, a.id, p.ecartes, qte?.centimes]);
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
        <Photo src={a.photo} className="cn-vignette cn-choisi-photo" repli={p.picto ? <span className="cn-vignette cn-choisi-photo cn-vignette-vide" aria-hidden>{p.picto}</span> : null} />
        <div className="cn-sp">
          <b>{liesParNbsp(a.nom)}</b>
          <span className="cn-mut">{[a.vendeur, a.pays].filter(Boolean).join(' · ')}</span>
          {(prix || dispoDe(a)) && <span><b className="cn-mono">{prix ?? ''}</b>{prix && dispoDe(a) ? <span className="cn-mut"> · </span> : null}{dispoDe(a) ? <span className="cn-mut">{dispoDe(a)}</span> : null}</span>}
          {detail && <span className="cn-mut">{detail}</span>}
        </div>
      </div>
      <section className="cn-pourquoi" aria-label="Pourquoi ce choix">
        <h3 className="cn-sous">Pourquoi ce choix</h3>
        {calc.phrase && <p className="cn-pourquoi-phrase"><PictoLocal /> {calc.phrase}</p>}
        {sienne && sienne !== calc.phrase && <p className="cn-pourquoi-sienne">« {sienne} »</p>}
        {calc.reglettes.map(pl => <Reglette key={pl.nom} place={pl} />)}
        <ul className="cn-raisons">
          <Retenus criteres={calc.criteres} facon={p.facon} vendeur={a.vendeur} dispo={dispoDe(a)} />
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
          <CalendarCheck size={18} aria-hidden /><span className="cn-sp">{texteSortie(p.sortie)}</span><span>Voir</span><ChevronRight size={18} aria-hidden />
        </button>
      ) : p.onEnvoyerAVenir ? (
        <button type="button" className="cn-action" onClick={p.onEnvoyerAVenir}><CalendarCheck size={18} aria-hidden /> Envoyer dans À venir</button>
      ) : null}
      {p.sortie && p.onPlacer && p.sortie.etat !== 'realise' ? (
        <button type="button" className="cn-action cn-placer" onClick={p.onPlacer}><CalendarCheck size={18} aria-hidden /> Placer</button>
      ) : null}
    </article>
  );
}

/**
 * L-44 : le budget max écrit par le brasseur (« Budget max 400 CHF » dans un critère ou une note), en centimes et sa devise ; `null` si
 * rien ne le dit. Le nombre vient de son texte (« 1 200 », « 1'200 », « 399,5 »), jamais d'ailleurs.
 */
export function budgetMaxDuCarnet(c: { criteres?: readonly { texte: string }[]; notes?: unknown } | null | undefined): { centimes: number; devise: string } | null {
  const textes = [...(c?.criteres ?? []).map(k => k.texte), ...(Array.isArray(c?.notes) ? (c!.notes as { texte?: unknown }[]).map(n => (typeof n?.texte === 'string' ? n.texte : '')) : [])];
  for (const t of textes) {
    const m = /budget(?:\s+(?:max(?:imum)?|plafond))?\s*:?\s*(\d[\d\s'’.,]*\d|\d)\s*(chf|eur|€|francs?|fr\.?)?/i.exec(t);
    if (!m || !/max|plafond|au plus/i.test(t)) continue;
    const brut = m[1].replace(/[\s'’]/g, '');
    const n = Number(/,\d{1,2}$/.test(brut) ? brut.replace(/\./g, '').replace(',', '.') : brut.replace(/[.,](?=\d{3}\b)/g, ''));
    if (!Number.isFinite(n) || n <= 0) continue;
    const d = (m[2] ?? 'chf').toLowerCase();
    return { centimes: Math.round(n * 100), devise: d === '€' || d === 'eur' ? 'EUR' : 'CHF' };
  }
  return null;
}

function ChoisirArticle(p: Extract<ChoisirProps, { etape: 'choisir' }>) {
  const a = p.article;
  /* n° 37 : « 2 600 CHF » (prixTexte), jamais « 2600 » ; R54 : avec une quantité cochée, son prix (1 kg : 62,20 CHF), jamais celui d'un autre sachet */
  const prix = p.quantite ? prixTexte(p.quantite.centimes, 'CHF') : prixChoix(a, p.taux);
  const detail = p.quantite ? p.quantite.libelle : detailPrix(a, p.taux);
  /* P16 : places et pourquoi calculés sur le carnet (valeurs et rangs), jamais un champ vide à taper ; l'IA, si elle a dit, prime.
     n° 10 (g05-11) : chaque valeur chiffrée porte sa réglette ; les écartés du tableau sont dits avec leur ✕ et leur raison. */
  const calc = useMemo(() => {
    const c = carnetDeCalcul(p, [a, ...p.autres.map(o => o.article)]);
    /* n° 6 : le même tableau que Comparer (`tableau(carnet)`), donc le même rang ; places par `placesDe` */
    const t = tableau(c);
    const places = t ? placesDe(t, a.id) : [];
    /* g05-11 : le critère qui range d'abord (sa caractéristique a une colonne), la façon de l'article */
    const criteres = criteresQuiRangent(p.carnet, t);
    const facon = p.carnet?.facons.find(f => f.id === a.faconId);
    const hors = new Map((t?.lignes ?? []).map(l => [l.articleId, Object.values(l.horsSeuil ?? {})[0]]));
    return {
      pourquoi: pourquoiDe(c, a.id),
      valeurs: places.filter(pl => pl.texte).map(pl => ({ nom: nomPlace(pl), texte: pl.texte, ...(pl.rang ? { rang: pl.rang } : {}), ...(pl.exAequo ? { exAequo: true } : {}), place: pl })),
      ecartes: p.carnet ? ecartesDe({ ecartes: [] }, p.carnet) : [],
      criteres, facon, hors
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.carnet, a.id]);
  /* R54 : avec une quantité cochée (1 kg), la place « Prix » du sachet de l'article dirait 6,70 sous le 62,20 du haut : elle se tait, le classement au kilo se lit dans Comparer */
  const valeursToutes: (ValeurPlaceeV & { place?: Place })[] = p.valeurs.length ? p.valeurs : calc.valeurs;
  const valeurs = p.quantite ? valeursToutes.filter(v => v.place?.nom !== 'prix') : valeursToutes;
  const propose = p.pourquoiPropose ?? calc.pourquoi ?? '';
  const [pourquoi, setPourquoi] = useState(propose);
  const [raison, setRaison] = useState<string | null>(null);
  /* Une page non lue ne se choisit pas : rien n'en est connu (ni nom, ni prix, ni valeurs) ; l'inconnu n'est jamais 0. */
  const sa = choixBloque(a);
  /* L-44 : le dépassement du budget max se voit avant le choix (même devise seulement : jamais de conversion inventée) */
  const budget = budgetMaxDuCarnet(p.carnet);
  const horsBudget = budget && a.prixCentimes !== undefined && (a.devise ?? 'CHF') === budget.devise && a.prixCentimes > budget.centimes ? budget : null;
  /* n° 5 : touchée au bas de Comparer, la feuille s'ouvre en haut de l'écran (sinon on reste face au bas de la page d'avant) */
  const haut = useRef<HTMLElement>(null);
  useEffect(() => { haut.current?.scrollIntoView?.({ block: 'start' }); }, []);
  return (
    <article ref={haut} className="cn-page cn-choisir">
      <div className="cn-tete">
        <button type="button" className="cn-retour" onClick={p.onRetour}><ChevronLeft size={20} aria-hidden /> {p.titre}</button>
        <span className="cn-sp" />
        <span className="cn-pastille cn-statut-research">À comparer</span>
      </div>
      <section className="cn-choisir-cadre" aria-label="Choisir">
        {/* n° 10 : la photo du choisi, ou à défaut son picto en grand dans le cadre photo (R05, D-102) ; jamais un cube générique */}
        <div className="cn-offre cn-offre-choisir" data-apercu={sa ? 'aucun' : undefined}>
          <Photo src={a.photo} className="cn-vignette cn-offre-photo" repli={p.picto ? <span className="cn-vignette cn-offre-photo cn-vignette-vide" aria-hidden>{p.picto}</span> : null} />
          {sa
            ? <div className="cn-sp"><b>{sa.titre}</b><span className="cn-mut">{sa.sous}</span></div>
            : <div className="cn-sp cn-offre-nom"><b>{liesParNbsp(a.nom ?? a.vendeur)}</b><span className="cn-mut">{[a.nom ? a.vendeur : null, a.pays].filter(Boolean).join(' · ')}{dispoDe(a) ? `${a.vendeur || a.pays ? ' · ' : ''}${dispoDe(a)}` : ''}</span>
              {detail && <span className="cn-mut">{detail}</span>}
              {/* n° 39 : le prix seul, sans rond vide devant (il n'avait aucun rôle) */}
              {prix && <span className="cn-offre-prix"><span className="cn-mono cn-prix-grand">{prix}</span></span>}</div>}
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
                    <tr className={chiffree ? 'cn-place-avec-reglette' : undefined}><th scope="row">{v.nom}</th><td className={`cn-mono${v.texte.length > 14 ? ' cn-place-long' : ''}`}>{v.texte}</td><td className={`${v.rang === 1 ? 'cn-vert' : 'cn-mut'}${(rang ?? '').length > 14 ? ' cn-place-long' : ''}`}>{rang}</td></tr>
                    {chiffree && <tr className="cn-place-reglette"><td colSpan={3}><Reglette place={pl!} sansTete /></td></tr>}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
        {/* g05-11 : critère, façon, fournisseur (◎ ✓ ✓), puis chaque écarté avec son ✕ et sa raison */}
        {!sa && (calc.criteres.length > 0 || calc.facon || a.vendeur) && (
          <ul className="cn-raisons cn-choisir-retenus" aria-label="Retenu">
            <Retenus criteres={calc.criteres} facon={calc.facon} vendeur={a.vendeur} dispo={dispoDe(a)} />
          </ul>
        )}
        {calc.ecartes.length > 0 && (
          <ul className="cn-raisons cn-choisir-ecartes" aria-label={`Écartés, ${calc.ecartes.length}`}>
            {calc.ecartes.map(e => <li key={e.nom}><X size={18} role="img" aria-label="écarté" /><span><b>{e.nom}</b> : {e.raison}</span></li>)}
          </ul>
        )}
        {horsBudget && <p className="cn-rouge" role="note" style={{ fontWeight: 600 }}>Au-dessus de ton budget max : {prix} pour {prixTexte(horsBudget.centimes, horsBudget.devise)} (+{prixTexte(a.prixCentimes! - horsBudget.centimes, horsBudget.devise)}).</p>}
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
          : <p className="cn-mut">Part dans À venir : {[prix, dispoDe(a), a.vendeur].filter(Boolean).join(', ')}, avec le pourquoi.</p>}
      </section>
      {p.autres.map(o => {
        const so = sansApercu(o.article);
        return (
          <div key={o.article.id} className="cn-carte cn-article" data-apercu={so ? 'aucun' : undefined}>
            <span className="cn-rang">{o.rang}</span>
            <Photo src={o.article.photo} className="cn-vignette" />
            {so
              ? <div className="cn-article-tx"><b>{so.titre}</b><span className="cn-mut">{so.sous}</span></div>
              : <div className="cn-article-tx"><b>{liesParNbsp(o.article.nom)}</b><span className="cn-mut">{[o.article.vendeur, o.article.pays].filter(Boolean).join(' · ')}</span></div>}
            <div className="cn-droite">{montant(o.article.prixCentimes) && <span className="cn-mono cn-prix">{montant(o.article.prixCentimes)}</span>}{o.mesure && <span className="cn-mut">{o.mesure}</span>}{calc.hors.get(o.article.id) && <span className="cn-hors-seuil" title={calc.hors.get(o.article.id)}><span aria-hidden>{horsSeuilCourt(calc.hors.get(o.article.id)!)}</span><span className="cn-cache">{calc.hors.get(o.article.id)}</span></span>}</div>
          </div>
        );
      })}
    </article>
  );
}
