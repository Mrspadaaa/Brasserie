/** Les règles de l'envoi d'une phrase (où elle va, ce que l'IA a perdu, un rappel, une autre chose), sorties de CarnetsVue.tsx ; pures. */
import { estLienSeul, type CarnetDoc } from '../../domain/carnets/modele';
import { analyserTexte, critereMesurable, decouper, genreDEtiquette, genreLocal, jetons, normaliser, objetDe, sansPrefixeBanc } from '../../domain/carnets/analyseLocale';
import { rattacher } from '../../domain/carnets/rattacher';
import { liensDuTexte, nombresDe, type LigneCarnet } from '../../domain/carnets/ia';
import type { GenreNote } from './EtatIA';

export const majusculeFr = (t: string) => t.charAt(0).toLocaleUpperCase('fr-CH') + t.slice(1);
export const memeTexte = (x: string, y: string) => x.trim().localeCompare(y.trim(), 'fr', { sensitivity: 'base' }) === 0;
/**
 * C55-2 (R24) : UNE règle pour ce que l'aperçu promet en « Ce qui compte » et ce que l'envoi range : la ligne locale qui n'est que la phrase
 * elle-même (au préfixe de test près : il reste sur le message, jamais dans une ligne) est déjà le titre, sauf si elle nomme une grandeur
 * mesurable (« Marmite de brassage 50 L ») : alors c'est le critère. L'aperçu, l'écriture locale et la réponse de l'IA la lisent d'ici.
 */
export const estLaPhrase = (ligne: string, phrase: string) => memeTexte(sansPrefixeBanc(ligne), sansPrefixeBanc(phrase)) && !critereMesurable(ligne);

/**
 * Critique 5, n° 3 (G4, D-134) : le carnet où ira ce qu'on tape dans un carnet ouvert. Le même calcul sert au cadre, pendant la frappe,
 * et à l'envoi : ce qui est annoncé est ce qui est fait. Le carnet ouvert garde la phrase s'il en parle, ou si aucun autre n'en parle
 * (`rattacher`, fuse.js, lot A) ; un lien, une note de plusieurs lignes, restent toujours ici (n° 6 : un lien collé dans un carnet est
 * l'article de ce carnet).
 */
/** PCN-186 : la ligne de la note d'origine qui partage le plus de mots avec une ligne de l'IA (−1 : aucune). */
export function ligneBrute(texteIA: string, brutes: readonly string[]): number {
  const js = new Set(jetons(texteIA));
  let best = -1, score = 0;
  brutes.forEach((b, i) => { const s = jetons(b).filter(m => js.has(m)).length; if (s > score) { score = s; best = i; } });
  return best;
}

const LIEN_BRUT = /\b(?:https?:\/\/|www\.)[^\s<>"'«»]+|\b[a-z0-9-]+(?:\.[a-z0-9-]+)*\.(?:ch|com|de|fr|it|at|eu|net|org|shop|store)\/[^\s<>"'«»]*/gi;
const formeLien = (u: string) => u.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/[/#?]+$/, '');
/**
 * PCN-188 (test en ligne 4) : les morceaux d'une note en vrac (ses lignes, coupées aux « , » et « ; ») que la réponse de l'IA ne reprend
 * pas : plus de la moitié de leurs mots absents de toutes ses lignes (texte, titre, carnet neuf, grandeur), ou un de leurs nombres absent.
 * Une reformulation (« voir » → « Vérifier s'il existe avec double paroi ») n'est donc pas une perte.
 */
export function morceauxPerdus(txt: string, lignes: readonly LigneCarnet[]): { brute: number; texte: string }[] {
  const dits = lignes.map(l => [l.texte, l.titre, l.carnetNeuf, l.caracteristique?.nom, l.caracteristique?.unite, l.unite].filter(Boolean).join(' ')).join(' \n ');
  const mots = new Set(jetons(dits));
  const nombres = [...nombresDe(dits), ...lignes.flatMap(l => [l.quantite, l.prixCentimes !== undefined ? l.prixCentimes / 100 : undefined])
    .filter((n): n is number => n !== undefined)];
  const urls = new Set(lignes.flatMap(l => (l.url ? [formeLien(l.url)] : [])));
  const perdus: { brute: number; texte: string }[] = [];
  txt.split(/\r?\n/).map(s => s.trim()).filter(Boolean).forEach((b, brute) => {
    for (const morceau of b.replace(/^\s*ZZ TEST\s*[—–-]\s*/i, '').split(/\s*[,;]\s+/)) {
      /* un lien se juge entier (repris en « url » ou non), jamais par les mots et numéros de son adresse */
      const lienPerdu = liensDuTexte(morceau).some(u => !urls.has(formeLien(u)));
      const sansLien = morceau.replace(LIEN_BRUT, ' ');
      const ms = jetons(sansLien);
      const motsPerdus = ms.filter(x => !mots.has(x)).length;
      const nombrePerdu = nombresDe(sansLien).some(n => !nombres.some(x => Math.abs(x - n) < 0.005));
      if (morceau.trim() && ((ms.length && motsPerdus * 2 > ms.length) || nombrePerdu || lienPerdu)) perdus.push({ brute, texte: morceau.trim() });
    }
  });
  return perdus;
}

/**
 * MESSAGE-RESTE-DANS-SON-CARNET (R47, C64-8 puis C65-1 et C65-2 : données réelles touchées) : une phrase tapée dans un carnet OUVERT reste dans ce carnet.
 * Le cadre et l'envoi lisent ce même calcul : un autre carnet EXISTANT que la phrase nomme n'est plus la destination, il devient `propose` (la carte
 * « Rattacher à … ? », au toucher du brasseur) ; le calcul d'avant l'envoyait écrire chez lui (« Joint torique… » tapé dans la marmite, note écrite dans le
 * joint ; sans IA, critère du carnet voisin). Restent permis : le carnet NEUF qu'un objet nomme (rien d'existant n'est écrit), et la phrase qui le dit
 * elle-même (« autre projet, sans rapport : … »). `{ resterIci: true }` : même le carnet neuf reste ici ; `{ resterIci: false }` : l'ancien calcul brut.
 */
export function destinationDans(texte: string, ouvert: CarnetDoc, carnets: readonly CarnetDoc[], options: { resterIci?: boolean } = {}): { carnetId: string; titre: string; propose?: { carnetId: string; titre: string } } {
  const ici = { carnetId: ouvert.id, titre: ouvert.title };
  const dest = calculerDestination(texte, ouvert, carnets);
  if (options.resterIci === false || dest.carnetId === ouvert.id) return dest;
  if (dest.carnetId === CARNET_NEUF) return options.resterIci ? ici : dest;
  if (sansAutreSujet(texte) !== null) return dest;
  return { ...ici, propose: dest };
}

function calculerDestination(texte: string, ouvert: CarnetDoc, carnets: readonly CarnetDoc[]): { carnetId: string; titre: string } {
  const ici = { carnetId: ouvert.id, titre: ouvert.title };
  const t = texte.trim();
  if (!t || plusieursLignes(t) || analyserTexte(t).some(l => l.url)) return ici;
  const autres = carnets.filter(c => c.id !== ouvert.id && !c.carnet.archive);
  /* critique 8, n° 1 : une phrase qui nomme un autre objet ne devient jamais un critère d'ici : un carnet proche, sinon un neuf */
  const objet = autreObjet(t, ouvert);
  if (objet) {
    const proche = rattacher(objet, autres) ?? rattacher(t, autres);
    return proche ? { carnetId: proche.carnetId, titre: proche.titre } : { carnetId: CARNET_NEUF, titre: `${prefixeDe(t)}${objet}` };
  }
  if (rattacher(t, [ouvert])) return ici;
  const autre = rattacher(t, autres);
  return autre ? { carnetId: autre.carnetId, titre: autre.titre } : ici;
}

/** Critique 8, n° 1 : la destination « nouveau carnet » d'une phrase tapée dans un carnet ouvert (titré par son objet). */
export const CARNET_NEUF = 'NOUVEAU-CARNET';
/* Les mots de tête qui ne nomment pas un objet : une exigence (« doit tenir 80 °C »), un seuil, un nombre */
/**
 * Les objets qui vivent à part dans une brasserie : un équipement entier ou une partie du local, chacun l'objet possible d'un carnet. Le mot
 * de tête d'une phrase doit en être pour qu'elle quitte le carnet ouvert ; une pièce ou un réglage de l'appareil n'en est pas (racines de
 * `jetons`, singulier et pluriel confondus).
 */
const OBJETS_A_PART = new Set(jetons([
  'évier lavabo plonge tuyau tuyaux flexible gaine sol mur plafond porte fenêtre local cave étagère rayonnage établi table chariot',
  'transpalette pompe frigo réfrigérateur congélateur chambre hotte extracteur ventilation moulin fermenteur cuve fût fûts keg tank',
  'densimètre réfractomètre balance embouteilleuse tireuse capsuleuse échangeur refroidisseur serpentin chaudière brûleur plaque',
  'osmoseur adoucisseur laveuse nettoyeur karcher lampe éclairage prise tableau onduleur'
].join(' ')));
/** Une tête qui dit « ce n'est pas d'ici » (« autre projet, sans rapport : », « rien à voir : »). */
const AUTRE_SUJET = /^(?:(?:un |une )?autre (?:projet|sujet|chose|idée)|sans rapport|rien à voir)(?:\s*,\s*(?:sans rapport|rien à voir))?\s*[:—–-]\s*/i;
/** Tour 3, f5 (n° 1) : la phrase sans sa tête de renvoi (« autre projet, sans rapport : un frigo… » → « un frigo… ») ; `null` sans elle. */
export function sansAutreSujet(texte: string): string | null {
  const brut = texte.replace(/^\s*ZZ TEST\s*[—–-]\s*/i, '').trim();
  const m = AUTRE_SUJET.exec(brut);
  const reste = m ? brut.slice(m[0].length).trim() : '';
  return reste ? reste : null;
}
const TETE_SANS_OBJET =/^(?:doit|doivent|tient|tenir|tiennent|faut|faudrait|il|on|au|aux|minimum|maximum|mini|maxi|min|max|moins|plus|pas|entre|supporte|resiste|assez|trop|tres|bien|mieux|avec|sans|pour|si|et|ou)(?:\s|$)|^\d/;
/**
 * L'objet que nomme une phrase quand il n'est pas celui du carnet ouvert (« tuyau silicone 8 mm, 5 m » dans la Ventilation → « Tuyau
 * silicone » ; « évier 2 bacs » dans le Frigo → « Évier »). `null` : la phrase est une exigence sans objet (« doit tenir 80 °C »,
 * « 1 200 m³/h au moins »), un geste, une question, ou son objet partage un mot avec le carnet (titre, phrase, critères, façons, articles,
 * notes : « hotte murale » dans un carnet de hottes, « fût de 30 L couché » dans l'évier pour les fûts).
 */
export function autreObjet(texte: string, ouvert: CarnetDoc): string | null {
  const brut = texte.replace(/^\s*ZZ TEST\s*[—–-]\s*/i, '').trim();
  /* tour 3, f4c (PCN-126) : « autre projet, sans rapport : un frigo de garde… » le dit lui-même : l'objet qui suit quitte le carnet ouvert */
  const horsSujet = AUTRE_SUJET.exec(brut);
  const t = horsSujet ? brut.slice(horsSujet[0].length).trim() : brut;
  const g = genreLocal(t);
  if (g === 'a-faire' || g === 'question' || g === 'conseil') return null;
  const objet = objetDe(t);
  const tete = normaliser(objet).replace(/^(?:l |le |la |les |un |une |des |du )/, '');
  if (!tete || TETE_SANS_OBJET.test(tete)) return null;
  const mots = jetons(objet);
  /* reprise chir8 : seul un objet qui vit à part (un équipement, une pièce du local) quitte le carnet ouvert. Une pièce de l'appareil
     (« compresseur silencieux », « filtre à air G4 » dans le frigo) ou une façon (« système isobarique » dans l'embouteillage) y reste. */
  if (horsSujet && mots.length) return objet.charAt(0).toLocaleUpperCase('fr-CH') + objet.slice(1);
  if (!mots.length || !OBJETS_A_PART.has(mots[0])) return null;
  const d = ouvert.carnet;
  const vocab = new Set(jetons([ouvert.title, d.phrase, ...d.criteres.map(k => `${k.texte} ${k.caracteristique?.nom ?? ''}`), ...d.facons.map(f => f.nom),
    ...d.articles.map(a => a.nom ?? ''), ...d.notes.map(n => n.texte)].join(' ')));
  return mots.some(m => vocab.has(m)) ? null : objet;
}
/** Critique 6, n° 1 : plusieurs lignes au sens de la découpe (retours à la ligne, « ; », phrases étiquetées sur une ligne). */
export const plusieursLignes = (t: string) => decouper(t).length > 1;
/** La marque des données de test du message, reportée sur les carnets neufs qu'il ouvre (L05). */
export const prefixeDe = (t: string) => (/^\s*ZZ TEST\s*[—–-]\s*/i.test(t) ? 'ZZ TEST — ' : '');

/**
 * CRN-2 (vision au doigt, 21.11) : « Va dans : Note » coché, d'avance ou d'un toucher, range une note. La tâche devinée d'un verbe en tête
 * (« prendre un modèle à 2 portes ») cède à ce choix ; une étiquette qu'il a écrite (« À faire : … »), une question ou un achat restent.
 */
export function genreSousNote<L extends { sorte: string; genre?: GenreNote; texte: string }>(l: L, phrase = l.texte): L {
  return l.sorte === 'note' && l.genre === 'a-faire' && !genreDEtiquette(phrase) ? { ...l, genre: 'note' } : l;
}

/**
 * CRN-6 (vision au doigt, 21.11) : écrite dans la liste, une ligne seule qui est un rappel (verbe en tête : « demander au ferblantier le
 * diamètre de l'évier, jeudi ») et dont un carnet parle déjà va en note de ce carnet ; elle n'en ouvre pas un neuf titré de toute la
 * phrase. Même calcul que le cadre (`rattacher`) ; un objet, une question ou un lien gardent leur chemin (« Nouveau carnet » proposé).
 */
const VERBES_RAPPEL = /^(?:demander|redemander|appeler|rappeler|relancer|contacter|ecrire|envoyer|mesurer|verifier|controler|regarder|voir|tester|essayer|nettoyer|reparer|changer|remplacer|prendre|faire|chercher|comparer|attendre|poser|monter|installer|finir|planifier|reserver|prevoir|noter|penser|passer|aller|demonter|deplacer|vider|percer|fixer)\b/;

export function rappelVers(texte: string, carnets: readonly CarnetDoc[]): { carnetId: string; titre: string } | null {
  if (estLienSeul(texte) || decouper(texte).length !== 1 || genreLocal(texte) !== 'a-faire') return null;
  /* le verbe en tête doit en être un : « chambre froide pour 6 fûts » finit en -re, c'est un objet, il garde son carnet neuf */
  if (!VERBES_RAPPEL.test(normaliser(texte.replace(/^\s*ZZ TEST\s*[—–-]\s*/i, '')))) return null;
  return rattacher(texte, carnets);
}
