/** Les lignes d'un envoi et leurs retours (avis de l'IA, puces proposées, découpe, rang, détail, lignes à ranger), sortis de CarnetsVue.tsx ; purs. */
import { lireCarnets, lireMessages, nomArticle, type CarnetDoc } from '../../domain/carnets/modele';
import type { Destination, LigneARanger } from '../../domain/carnets/operations';
import { avecArticleTypo, placesDe, tableau as tableauDe } from '../../domain/carnets/comparer';
import { analyserLigne, extraireCriteres, normaliser, type LigneLocale, type RubriqueVaDans } from '../../domain/carnets/analyseLocale';
import type { CarnetPourIA, LigneCarnet } from '../../domain/carnets/ia';
import type { PlanVrac } from './rangement';
import type { LigneVracV } from './NoteEnVrac';
import { GENRE_LIBELLE } from './EtatIA';
import { majusculeFr, memeTexte } from './envoiRegles';
import type { AvisIA, Proposee } from './carnetsTypes';

/**
 * Critique 5, n° 43 : la formule vraie selon le code. Rien ne se rerange au retour du réseau (MISSION, § IA, « Déroulé d'un envoi » :
 * aucun rerangement automatique) : l'avis le dit sans ambiguïté, au lieu de « rien ne bougera », qu'on lisait « l'IA rangera-t-elle ? ».
 */
export const AVIS_IA: Record<AvisIA['sorte'], string> = {
  eteint: 'IA éteinte : rangé sur l’appareil, tel quel',
  /* critique 6, n° 24 : court ; au retour du réseau, « Ranger maintenant » d'un toucher (`repriseNode`) */
  'hors-ligne': 'Hors ligne : rangé sur l’appareil, tel quel',
  echec: 'L’IA n’a pas répondu : rangé sur l’appareil, tel quel ; rien n’est perdu'
};
import { douteDePage } from '../../domain/carnets/manques';

/** PX : ce que la page dit de la quantité de son prix, au format de l'article (offres en centimes). */
function conditionnementDePage(p: NonNullable<LigneCarnet['page']>): Record<string, unknown> {
  return {
    ...(p.conditionnement ? { conditionnement: { ...p.conditionnement } } : {}),
    ...(p.prixUnite ? { prixUnite: { prix: p.prixUnite.prix, unite: p.prixUnite.unite, ...(p.prixUnite.paliers?.length ? { paliers: p.prixUnite.paliers.map(x => ({ ...x })) } : {}) } } : {}),
    ...(p.offres?.length ? { offres: p.offres.map(o => ({ valeur: o.valeur, unite: o.unite, prixCentimes: Math.round(o.prix * 100) })) } : {})
  };
}
export function libelleProposee(l: Proposee['ligne']): string {
  const k = l.caracteristique;
  /* tour 3, f11 (v7-1) : l'article suit le genre de la caractéristique (avecArticle), jamais « le température mini » */
  return k ? `Comparer sur ${avecArticleTypo(k.nom)}${k.unite ? ` (${k.unite})` : ''}` : l.texte;
}
/**
 * Tour 3, PCN-133 : les puces proposées du carnet ouvert, une par caractéristique (libellé normalisé), sans celles qui sont déjà un
 * critère du carnet, 3 au plus (la plus ancienne d'abord).
 */
export function pucesDuCarnet(messages: ReturnType<typeof lireMessages>, carnet: ReturnType<typeof lireCarnets>[number], ecartees: ReadonlySet<string>): Proposee[] {
  const cle = (k: { nom?: string } | undefined, texte: string) => normaliser(k?.nom ?? texte);
  const deja = new Set(carnet.carnet.criteres.map(k => cle(k.caracteristique, k.texte)));
  const vus = new Set<string>();
  const sortie: Proposee[] = [];
  for (const m of messages) (m.carnetMessage.propositions ?? []).forEach((pp, index) => {
    const c = `${m.id}:${index}:${pp.texte}`;
    const n = cle(pp.caracteristique, pp.texte);
    if (pp.carnetId !== carnet.id || ecartees.has(c) || deja.has(n) || vus.has(n)) return;
    vus.add(n);
    sortie.push({ cle: c, messageId: m.id, index, carnetId: pp.carnetId, ligne: pp });
  });
  return sortie.slice(0, 3);
}
/** La découpe d'une note en vrac telle que NoteEnVrac la montre (pendant la frappe, puis pendant que l'IA découpe) : même plan. */
export function vuesVrac(plan: PlanVrac<LigneLocale>): LigneVracV[] {
  /* critique 8, n° 3 : une exigence (« tient 80 °C », « 1 200 m³/h au moins ») s'annonce critère pendant, comme elle se range après */
  return plan.lignes.map((x, i) => ({ id: String(i), texte: x.ligne.texte,
    genre: (x.ligne.sorte === 'critere' ? 'critere' : x.ligne.genre) as LigneVracV['genre'],
    ...(x.carnetId ? { carnetId: x.carnetId, carnetTitre: x.titre } : { carnetTitre: x.titre, neuf: true }) }));
}

/**
 * Critique 6, n° 12 (R26, G20, g5:v06-11) : le rang d'un article qui vient d'être rangé, dit dans son bandeau. Dans sa façon : « 1re de sa
 * façon, devant <la suivante> », ou « 2e de sa façon, après <la précédente> » ; sans façon, « 1er sur 3 ». Lu sur `tableau` (comparer.ts,
 * tri par les critères, le premier = rang 1) et `placesDe` (la valeur qui le place, quand elle classe) ; `null` hors du tableau ou écarté.
 */
export function rangDuLien(t: NonNullable<ReturnType<typeof tableauDe>>, articleId: string, articles: readonly { id: string; faconId?: string; nom?: string }[]): string | null {
  const ligne = t.lignes.find(l => l.articleId === articleId);
  if (!ligne || ligne.rang === null) return null;
  const facon = articles.find(a => a.id === articleId)?.faconId;
  const enLice = t.lignes.filter(l => l.rang !== null).sort((x, y) => (x.rang ?? 0) - (y.rang ?? 0));
  const memes = facon ? enLice.filter(l => articles.find(a => a.id === l.articleId)?.faconId === facon) : enLice;
  const i = memes.findIndex(l => l.articleId === articleId);
  const n = i + 1;
  const ordinal = n === 1 ? '1re' : `${n}e`;
  const place = placesDe(t, articleId).find(p => p.rang !== undefined);
  /* tour 3, f7 n° 4 : un critère oui/non se dit par son nom (« tient 80 °C »), sans « oui » qui restait seul sur sa ligne à 1280 */
  const par = place && place.rang === 1 ? ` · ${place.texte === 'oui' ? place.nom : `${place.nom} ${place.texte}`}` : '';
  if (facon && memes.length > 1) return n === 1 ? `${ordinal} de sa façon, devant ${memes[1].nom}${par}` : `${ordinal} de sa façon, après ${memes[i - 1].nom}`;
  if (enLice.length > 1) return `${n === 1 ? '1er' : `${n}e`} sur ${enLice.length}${n === 1 ? par : ''}`;
  return null;
}

/** Test en ligne 2 (bloquant 8) : le délai avant de replier « Créer » quand le champ de la liste perd le focus. */
export const PLIER_APRES_MS = 300;
/** G1 (g5:v04-1) : les exemples de Créer · avant, touchables ; un toucher remplit le champ. */
export const EXEMPLES_CREER = ['Frigo de garde', 'Ventilation de la salle', 'Évier pour les fûts'];
/** CRN-12 : l'aide « avant » apprend le geste ; passé ce nombre de carnets, il le connaît, et elle poussait la liste de 280 px. */
export const AIDE_AVANT_JUSQU_A = 4;
const motCle = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/^zz test\s*[—-]\s*/, '').split(/[^a-z0-9]+/).find(m => m.length > 2) ?? '';
/** CRN-12 : un exemple qui existe déjà en carnet n'est pas reproposé (« Pourquoi il me repropose Ventilation, je l'ai déjà ? »). */
export function exemplesNeufs(exemples: readonly string[], titres: readonly string[]): string[] {
  const pris = new Set(titres.map(motCle).filter(Boolean));
  return exemples.filter(e => !pris.has(motCle(e)));
}
const RUBRIQUE_DE: Record<string, string> = { critere: 'Ce qui compte', facon: 'Façons', article: 'Articles', note: 'Notes', photo: 'Photos' };
/**
 * P22 : ce qu'un message a rangé, et où, en une ligne (« Notes : « filtre à air G4 » · dans Frigo de garde »), lu sur ses effets tels
 * qu'ils sont. Trois éléments au plus, puis « +n ».
 */
export function detailDe(etat: Parameters<typeof lireCarnets>[0], effets: readonly { carnetId: string; cible: string; id?: string }[]): string | undefined {
  const cs = lireCarnets(etat, { archives: true });
  const parties = effets.filter(e => e.cible !== 'carnet').map(e => {
    const c = cs.find(x => x.id === e.carnetId);
    if (!c) return null;
    const d = c.carnet;
    const quoi = e.cible === 'note' ? d.notes.find(x => x.id === e.id)?.texte
      : e.cible === 'critere' ? d.criteres.find(x => x.id === e.id)?.texte
        : e.cible === 'facon' ? d.facons.find(x => x.id === e.id)?.nom
          : e.cible === 'article' ? (() => { const a = d.articles.find(x => x.id === e.id); return a ? nomArticle(a) : undefined; })()
            : e.cible === 'photo' ? 'une photo' : undefined;
    if (!quoi) return null;
    const cite = e.cible === 'photo' ? quoi : `« ${quoi.length > 48 ? `${quoi.slice(0, 47)}…` : quoi} »`;
    /* tour 3, f4a (PCN-22) : une note typée (achat, à faire…) se dit par son genre (« À acheter : « filtre à air G4, 2 pièces » ») */
    const genre = e.cible === 'note' ? d.notes.find(x => x.id === e.id)?.genre : undefined;
    const rubrique = genre && genre !== 'note' ? majusculeFr(GENRE_LIBELLE[genre]) : RUBRIQUE_DE[e.cible] ?? e.cible;
    return `${rubrique} : ${cite} · dans ${c.title}`;
  }).filter((x): x is string => !!x);
  if (!parties.length) return undefined;
  return parties.length > 3 ? `${parties.slice(0, 3).join(' ; ')} ; +${parties.length - 3}` : parties.join(' ; ');
}

/** Une ligne de l'analyse locale, rangée vers sa destination (picto local, Q19). */
export function depuisLocale(l: LigneLocale, dest: Destination): LigneARanger {
  if (l.sorte === 'article') {
    return { ...dest, sorte: 'article', origine: 'locale', lecture: l.url ? 'a-lire' : 'lue',
      ...(l.url ? { url: l.url, domaine: l.domaine } : { nom: l.texte }), ...(l.prixCentimes !== undefined ? { prixCentimes: l.prixCentimes, devise: l.devise } : {}) } as LigneARanger;
  }
  /* C58-5 (R33) : la mesure que l'aperçu a promise (« Marmite de brassage 50 L ») est créée AVEC sa caractéristique (le volume) : le critère classe */
  if (l.sorte === 'critere') {
    const q = l.quantites[0];
    const car = q ? extraireCriteres(l.phrase).criteres.find(k => k.quantite && k.quantite.valeur === q.valeur && k.quantite.unite === q.unite)?.caracteristique : undefined;
    return { ...dest, sorte: 'critere', texte: l.texte, origine: 'locale', ...(car ? { caracteristique: car } : {}) } as LigneARanger;
  }
  return { ...dest, sorte: 'note', texte: l.texte, genre: l.genre } as LigneARanger;
}

/** Une ligne validée de l'IA (ou de la simulation, « exemple »), rangée vers sa destination. Ce qu'elle ne lit pas reste absent. */
/**
 * Critique 7, n° 3 (R13, R14 ; D-134, D-135) : ce que le cadre a annoncé est ce qui se fait. Une ligne de l'IA (note, critère, façon) d'un
 * message d'une ligne passe dans la rubrique annoncée ; son texte mis en forme et sa caractéristique sont gardés. Un article reste un article.
 */
/**
 * Critique 8, n° 3 (R13, R18, D-139) : en note en vrac, le type annoncé pendant s'applique. Une ligne annoncée critère (« doit tenir 80 °C »,
 * « 1 200 m³/h au moins ») que l'IA rend en note reste un critère ; une note garde le genre annoncé.
 */
export function typerVrac(l: LigneCarnet, sorteAnnoncee: LigneLocale['sorte'] | undefined, genreAnnonce?: string): LigneCarnet {
  if (l.sorte === 'note' && (sorteAnnoncee === 'critere' || genreAnnonce === 'critere')) return versRubrique(l, 'critere', l.texte);
  return l.sorte === 'note' && genreAnnonce && genreAnnonce !== 'critere' && genreAnnonce !== 'facon' ? { ...l, genre: genreAnnonce as LigneCarnet['genre'] } : l;
}

export function versRubrique(l: LigneCarnet, rubrique: RubriqueVaDans, phrase: string): LigneCarnet {
  /* une proposition de l'IA (« ✻ Comparer sur le débit · Ajouter ») n'est pas sa phrase : elle reste proposée */
  if (l.propose || l.sorte === rubrique || !['note', 'critere', 'facon'].includes(l.sorte)) return l;
  if (rubrique === 'critere') {
    const texte = l.sorte === 'note' && memeTexte(l.texte, phrase) ? analyserLigne(phrase).texte : l.texte;
    return { ...l, sorte: 'critere', texte, source: 'phrase', genre: undefined };
  }
  if (rubrique === 'facon') return { ...l, sorte: 'facon', titre: l.titre ?? l.texte, genre: undefined };
  return { ...l, sorte: 'note', genre: l.genre ?? 'note' };
}

export function depuisIA(l: LigneCarnet, dest: Destination): LigneARanger {
  const origine = l.origine;
  switch (l.sorte) {
    case 'idee': return { ...dest, sorte: 'idee' } as LigneARanger;
    /* P23 : `propose` (lot A) suit la ligne : `ranger` la garde sur le message, la puce la range d'un toucher */
    case 'critere': return { ...dest, sorte: 'critere', texte: l.texte, origine, ...(l.caracteristique ? { caracteristique: l.caracteristique } : {}), ...(l.propose ? { propose: true } : {}), ...(l.source ? { source: l.source } : {}) } as LigneARanger;
    case 'facon': return { ...dest, sorte: 'facon', nom: l.titre ?? l.texte, origine } as LigneARanger;
    case 'article': {
      const p = l.page;
      const lue = p ? p.statut === 'lue' : !l.url;
      const introuvable = p?.statut === 'introuvable';
      /* tour 3, f11 (PCN-110) : une valeur lue sur la page porte la date de sa lecture ; la fiche dit « lues sur la fiche du vendeur, <date> » (h01-6) */
      const luLe = p?.statut === 'lue' && p.luLe > 0 ? new Date(p.luLe).toISOString() : undefined;
      const valeurs: Record<string, { valeur: string; unite?: string; origine: 'page'; luLe?: string }> = {};
      for (const v of p?.valeurs ?? []) valeurs[v.nom] = { valeur: v.valeur, ...(v.unite ? { unite: v.unite } : {}), origine: 'page', ...(luLe ? { luLe } : {}) };
      /* D447 : le prix, la taxe, le TTC et le cours vont ensemble, et ne s'attachent qu'au prix lu SUR LA PAGE ; un prix écrit par le brasseur
         (« 3 000 euros ») garde le sien. Le port, lui, est celui de la page lue. */
      const prixCentimes = l.prixCentimes ?? (p?.statut === 'lue' && typeof p.prix === 'number' && p.prix > 0 && p.devise ? Math.round(p.prix * 100) : undefined);
      const devise = l.prixCentimes !== undefined ? (l.devise ?? 'CHF') : p?.devise;
      const duPage = lue && p?.prix !== undefined && prixCentimes === Math.round(p.prix * 100) && (devise ?? 'CHF') === (p.devise ?? 'CHF');
      const taxeLue = duPage && p?.taxe ? { taxe: p.taxe, ...(p.taxe === 'ht' && p.prixTTC !== undefined && p.prixTTC > 0 ? { prixTTCCentimes: Math.round(p.prixTTC * 100) } : {}) } : {};
      const change = duPage && p?.change && (p.devise ?? 'CHF') !== 'CHF' && p.change.taux > 0 ? { change: { taux: p.change.taux, date: p.change.date, source: p.change.source } } : {};
      const lv = lue ? p?.livraison : undefined;
      const livraison = lv && (lv.gratuite || lv.refusee || (typeof lv.prix === 'number' && lv.prix >= 0))
        ? { livraison: { ...(typeof lv.prix === 'number' && lv.prix >= 0 && !lv.gratuite && !lv.refusee ? { prixCentimes: Math.round(lv.prix * 100), devise: lv.devise ?? p?.devise ?? 'CHF' } : {}), ...(lv.gratuite ? { gratuite: true as const } : {}), ...(lv.refusee ? { refusee: true as const } : {}) } } : {};
      /* D446 : toutes les photos de la page, la première en tête (c'est celle des cartes) */
      const toutes = lue ? [...new Set([...(p?.photo ? [p.photo] : []), ...(p?.photos ?? [])])] : [];
      return {
        /* test en ligne 2 (bloquant 6) : l'IA passée, les pages ont été lues ; un lien sans page n'attend plus rien (jamais « lecture… » sans fin) */
        ...dest, sorte: 'article', origine, lecture: l.url ? (lue ? 'lue' : introuvable ? 'introuvable' : 'illisible') : 'lue',
        ...(l.url ? { url: l.url } : {}), ...(p?.domaine ? { domaine: p.domaine } : {}),
        ...(p?.nom ?? l.titre ? { nom: p?.nom ?? l.titre } : !l.url ? { nom: l.texte } : {}),
        ...(l.prixCentimes !== undefined ? { prixCentimes: l.prixCentimes, devise: l.devise ?? 'CHF', ...(l.prixDes ? { prixDes: true } : {}) }
          /* CRP-1, maillon 3 : le prix de la page lue de CETTE ligne, si ia.ts ne l'a pas posé */
          : prixCentimes !== undefined ? { prixCentimes, devise: p!.devise, ...(p!.prixDes ? { prixDes: true } : {}) } : {}),
        ...taxeLue, ...change, ...livraison,
        /* PX (R39 à R41) : le prix de la page porte sa quantité, son unité et ses conditionnements ; jamais rattachés à un prix écrit par le brasseur */
        ...(duPage ? conditionnementDePage(p!) : {}),
        ...(lue && douteDePage(p?.etapes) ? { doute: douteDePage(p?.etapes) } : {}),
        ...(l.vendeur ? { vendeur: l.vendeur } : {}), ...(toutes.length ? { photo: toutes[0], photos: toutes } : {}),
        /* BL-15 : « plus disponible » est dit par la page (Discontinued, « retiré du catalogue ») ; jamais confondu avec une rupture */
        ...(p?.dispo ? { dispo: p.dispo === 'en-stock' ? 'en stock' : p.dispo === 'retire' ? 'plus disponible' : p.dispo === 'sur-commande' ? ['sur commande', p.dispoDelai].filter(Boolean).join(' · ') : 'rupture' } : {}), /* E47-1 : « sur commande » (et son délai, s'il est écrit) n'est jamais dit « rupture » */
        ...(Object.keys(valeurs).length ? { valeurs } : {})
      } as LigneARanger;
    }
    default: return { ...dest, sorte: 'note', texte: l.texte, ...(l.genre ? { genre: l.genre } : {}) } as LigneARanger;
  }
}

/** La forme compacte d'un carnet pour l'IA (au plus 30, les plus récents). */
export function pourIA(carnets: readonly CarnetDoc[]): CarnetPourIA[] {
  return carnets.slice(0, 30).map(c => ({
    id: c.id, titre: c.title, criteres: c.carnet.criteres, facons: c.carnet.facons,
    /* N1 : l'id, le domaine, le vendeur et le pays de chaque article : de quoi désigner celui qu'une note concerne */
    articles: c.carnet.articles.map(a => ({ id: a.id, nom: a.nom, domaine: a.domaine, vendeur: a.vendeur, pays: a.pays, valeurs: a.valeurs })), notes: c.carnet.notes.map(n => ({ id: n.id, texte: n.texte }))
  }));
}

export const jourIso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const lundiIso = (iso: string) => { const d = new Date(`${iso}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
