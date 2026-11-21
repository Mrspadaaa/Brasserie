import type { Client, CreativeItem } from '../../types';

/**
 * Atelier R&D (e9na, « le carnet que l'IA range ») : les règles pures de l'écran.
 * Rien de neuf dans le modèle : un `CreativeItem` garde ses champs ; le genre du carnet en dérive du `type`.
 */

export type Genre = 'biere' | 'contact' | 'faire' | 'tarif';
export type Tiroir = 'tout' | Genre | 'materiel';

export const TYPE_DE_GENRE: Record<Genre, CreativeItem['type']> = {
  biere: 'recipe-idea', contact: 'prospect', faire: 'event', tarif: 'pricing-test'
};
const GENRE_DE_TYPE: Record<CreativeItem['type'], Genre | null> = {
  'recipe-idea': 'biere', prospect: 'contact', event: 'faire', 'pricing-test': 'tarif', equipment: null, carnet: null, 'carnet-message': null
};
export const LIBELLE_GENRE: Record<Genre, string> = { biere: 'Bière', contact: 'Contact', faire: 'À faire', tarif: 'Tarif' };
export const LIBELLE_TIROIR: Record<Tiroir, string> = { tout: 'Tout', biere: 'Bières', tarif: 'Tarifs', contact: 'Contacts', faire: 'À faire', materiel: 'Matériel' };

/** Le genre du carnet ; `null` pour le matériel, qui vit dans Rénovation. */
export const genreDe = (item: CreativeItem): Genre | null => GENRE_DE_TYPE[item.type];

/** Le tiroir qui s'ouvre pour une rubrique demandée (bouton d'action, lien d'une autre vue). */
export const tiroirDe = (type: CreativeItem['type']): Tiroir => GENRE_DE_TYPE[type] ?? 'materiel';

/** Instant de la saisie, lu dans l'identifiant `CR-<ms>` que l'app donne à chaque note. Les identifiants d'ancienne date n'en ont pas : aucune date inventée. */
export function instantNote(item: CreativeItem): number | undefined {
  const m = /^CR-(\d{12,})/.exec(item.id);
  return m ? Number(m[1]) : undefined;
}

const deux = (n: number) => String(n).padStart(2, '0');

export function jourMois(ms: number): string {
  const d = new Date(ms);
  return `${deux(d.getDate())}.${deux(d.getMonth() + 1)}`;
}

/** « 16.11.2026 » → « lun. 16.11 ». Un texte qui n'est pas une date reste tel qu'écrit. */
export function dateEcheance(brut?: string): string | undefined {
  const t = brut?.trim();
  if (!t) return undefined;
  const m = /^(\d{1,2})[./](\d{1,2})[./](\d{4})$/.exec(t);
  if (!m) return t;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  if (d.getMonth() !== Number(m[2]) - 1) return t;
  return `${['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'][d.getDay()]} ${deux(d.getDate())}.${deux(d.getMonth() + 1)}`;
}

/** Les plus récentes d'abord ; les notes sans instant gardent leur ordre, après. */
export function trierNotes(items: CreativeItem[]): CreativeItem[] {
  const avec = items.filter(i => instantNote(i) != null).sort((a, b) => instantNote(b)! - instantNote(a)!);
  const sans = items.filter(i => instantNote(i) == null);
  return [...avec, ...sans];
}

export function compteurs(items: CreativeItem[]): Record<Tiroir, number> {
  const c: Record<Tiroir, number> = { tout: 0, biere: 0, tarif: 0, contact: 0, faire: 0, materiel: 0 };
  for (const i of items) {
    const g = genreDe(i);
    if (g) { c[g] += 1; c.tout += 1; } else c.materiel += 1;
  }
  return c;
}

/** Virgule décimale, deux décimales, espace fine entre les milliers : « 1 250,00 ». */
export function chf(v: number): string {
  const [e, d] = Math.abs(v).toFixed(2).split('.');
  return `${v < 0 ? '−' : ''}${e.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')},${d}`;
}

/** Marge unitaire : prix retiré de la TVA (selon les réglages), moins le coût. Inconnu tant que le prix ou le coût manque : jamais 0. */
export function marge(prix: number | undefined, cout: number | undefined, tva = 0): number | undefined {
  if (prix == null || cout == null || prix <= 0) return undefined;
  return Math.round((prix / (1 + tva)) * 100) / 100 - cout;
}

export interface FormatPrix { id: string; label: string; coutLabel: string; max: number; pas: number; grads: number[] }
export const FORMATS_PRIX: FormatPrix[] = [
  { id: '33cl', label: '33 cl', coutLabel: 'la 33 cl', max: 12, pas: 0.1, grads: [0, 4, 8, 12] },
  { id: 'carton24', label: 'Carton 24', coutLabel: 'du carton de 24', max: 150, pas: 1, grads: [0, 50, 100, 150] },
  { id: 'fut20', label: 'Fût 20 L', coutLabel: 'du fût de 20 L', max: 300, pas: 5, grads: [0, 100, 200, 300] }
];

// ---------------------------------------------------------------------------------------------------------------------
// Ranger une note en vrac. Aucun serveur ne range encore (pas de tâche IA « ranger » dans aiTask) : c'est une lecture locale,
// à indices explicites, que le brasseur valide ligne par ligne. Pas une IA : l'écran ne le prétend pas.

export interface LigneRangee {
  genre: Genre;
  titre: string;
  description?: string;
  date?: string;
  contactName?: string;
  contactPhone?: string;
  targetPrice?: number;
  estimatedCost?: number;
  /** Style corrigé à la main sur la ligne ('' : aucun). Absent : la lecture du texte décide. */
  style?: string;
}

const VERBE_ACTION = /^(demander|appeler|rappeler|téléphoner|commander|acheter|prendre|penser|vérifier|réserver|payer|envoyer|chercher|trouver|préparer|nettoyer|réparer|imprimer|livrer|contacter|relancer|confirmer|prévoir|passer|écrire)\b/i;
// \b ne connaît que l'ASCII (« marché » ne se termine pas sur une frontière) : les bords de mot se disent en (?<!\p{L}) et (?!\p{L}).
const SUITE = /^(la|le|les|lui|y|en)\s+\p{L}+(er|re|ir)(?!\p{L})/iu;
const LIEU = /\b((?:Café|Bar|Bistrot|Restaurant|Épicerie|Hôtel|Magasin|Boulangerie|Cave|Auberge)(?:\s+(?:du|de la|de l'|des|de|d'|au|aux|le|la|les)?\s*[A-ZÉ][\p{L}'’-]*)*)/u;
const MOT_CONTACT = /(?<!\p{L})(veut|voudrait|cherche|intéress\p{L}*|rappeler|appeler|téléphon\p{L}*|contact\p{L}*|client|prospect)(?!\p{L})/iu;
const MOT_BIERE = /(?<!\p{L})(bière|biere|lager|ipa|neipa|stout|porter|saison|blonde|blanche|ambrée|brune|pils|pilsner|houblon\p{L}*|dry hop|malt\p{L}*|recette|variante|brassin|fermentation|levure)(?!\p{L})/iu;
// « à 6 », « 6 CHF » : un prix. « à 5 min », « à 7 % », « à 20 g » : une durée, un degré, un poids.
const PRIX = /(?:(?<![\p{L}\d])à\s+(\d+(?:[.,]\d+)?)(?!\s*(?:%|min|kg|g|l|cl|h|j|jours)(?!\p{L}))|(\d+(?:[.,]\d+)?)\s*(?:chf|fr\.?|francs?)(?!\p{L}))/iu;
const COUT = /\b(?:co[uû]te?|coût de revient)\s*(?:de\s*)?(\d+(?:[.,]\d+)?)/iu;
const FORMAT = /(\d+\s?cl|carton(?:\s+de)?\s*\d*|f[uû]t(?:\s+de)?\s*\d*\s?l?)/iu;
const DATE = /\b(\d{1,2})[./](\d{1,2})(?:[./](\d{2,4}))?\b/;
const TEL = /(\+?\d[\d\s]{7,}\d)/;

const num = (s: string) => Number(s.replace(',', '.'));
const majuscule = (s: string) => s.charAt(0).toLocaleUpperCase('fr') + s.slice(1);
const sansPoint = (s: string) => s.replace(/[.!\s]+$/u, '').trim();

function lire(phrase: string, anneeCourante: number): LigneRangee {
  const texte = phrase.trim();
  const sansFin = sansPoint(texte);
  const date = (() => {
    const m = DATE.exec(texte);
    if (!m) return undefined;
    const an = m[3] ? (m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3])) : anneeCourante;
    return `${deux(Number(m[1]))}.${deux(Number(m[2]))}.${an}`;
  })();
  if (VERBE_ACTION.test(texte)) return { genre: 'faire', titre: majuscule(sansFin), date };
  const prix = PRIX.exec(texte);
  if (prix && (FORMAT.test(texte) || /(?<!\p{L})(prix|marché|vente|vends|vendre|coûte|coute)(?!\p{L})/iu.test(texte))) {
    const cout = COUT.exec(texte);
    return {
      genre: 'tarif', titre: majuscule(sansFin), description: FORMAT.exec(texte)?.[1]?.trim(),
      targetPrice: num(prix[1] ?? prix[2]), estimatedCost: cout ? num(cout[1]) : undefined
    };
  }
  const lieu = LIEU.exec(texte)?.[1];
  if (lieu && MOT_CONTACT.test(texte)) {
    const prenom = /^([A-ZÉ][\p{L}'’-]+)\s+(?:du|de la|de l'|des|de|d'|au|aux)\b/u.exec(texte)?.[1];
    return { genre: 'contact', titre: lieu.trim(), description: texte, contactName: prenom, contactPhone: TEL.exec(texte)?.[1]?.trim() };
  }
  if (MOT_BIERE.test(texte)) {
    const nom = sansFin.split(/\s+(?:du|de la|de l'|des|pour|avec|:|,)\s*|[:,]/u)[0]?.trim() || sansFin;
    return { genre: 'biere', titre: majuscule(nom.slice(0, 48)), description: texte };
  }
  return { genre: 'faire', titre: majuscule(sansFin), date };
}

/** Coupe en phrases, rattache « La rappeler. » à la phrase d'avant, lit chaque phrase. */
export function ranger(note: string, anneeCourante = new Date().getFullYear()): LigneRangee[] {
  const brut = note.split(/(?<=[.!?])\s+|\n+/u).map(s => s.trim()).filter(Boolean);
  const phrases: string[] = [];
  for (const p of brut) {
    if (phrases.length && SUITE.test(p)) phrases[phrases.length - 1] += ` ${p}`;
    else phrases.push(p);
  }
  return phrases.map(p => lire(p, anneeCourante));
}

// ---------------------------------------------------------------------------------------------------------------------
// Ce que la note dit déjà (e9na : pastille de style, « rappeler », fiche de l'idée). Rien n'est ajouté au modèle : tout se lit dans
// le texte tapé, ou dans `notes` quand le brasseur corrige (« Style : IPA »). Le champ vide se dit « non saisi », jamais 0.

/** Les styles que la lecture reconnaît, du plus précis au plus court (« ambrée forte » avant « ambrée »). */
export const STYLES = ['Ambrée forte', 'NEIPA', 'IPA', 'Lager', 'Pilsner', 'Pils', 'Saison', 'Stout', 'Porter', 'Blonde', 'Blanche', 'Brune', 'Ambrée', 'Weizen', 'Witbier', 'Gose', 'Sour', 'Kölsch'] as const;
const MOT_STYLE = new RegExp(`(?<!\\p{L})(${[...STYLES].sort((a, b) => b.length - a.length).map(s => s.toLowerCase()).join('|')})(?!\\p{L})`, 'iu');
const STYLE_NOTE = /(?:^|\n)\s*Style\s*:\s*([^\n]+)/i;

/** Le style d'une bière : « Style : … » dans les notes (corrigé à la main) d'abord, sinon le mot de style du texte. `undefined` : aucun style dit. */
export function styleDe(item: Pick<CreativeItem, 'title' | 'description' | 'notes'>): string | undefined {
  const corrige = STYLE_NOTE.exec(item.notes ?? '')?.[1]?.trim();
  if (corrige) return /^(aucun|non saisi)$/i.test(corrige) ? undefined : corrige;
  const m = MOT_STYLE.exec(`${item.title} ${item.description ?? ''}`);
  if (!m) return undefined;
  const brut = m[1].toLowerCase();
  return STYLES.find(s => s.toLowerCase() === brut) ?? majuscule(brut);
}

/** « rappeler » : la note demande de rappeler ou de relancer quelqu'un. */
export function rappelDe(item: Pick<CreativeItem, 'title' | 'description'>): boolean {
  return /(?<!\p{L})(rappel\p{L}*|relanc\p{L}*)(?!\p{L})/iu.test(`${item.title} ${item.description ?? ''}`);
}

export interface LectureIdee { degre?: string; aromes?: string; pour?: string; format?: string }

const brut = (item: CreativeItem) => [item.title, item.description, item.notes].filter(Boolean).join('. ');

/** « la 33 cl », « le carton de 24 », « le fût de 20 L » : le format que le texte cite pour le prix. */
export function formatVendu(texte: string): string | undefined {
  const cl = /(\d+)\s?cl(?!\p{L})/iu.exec(texte);
  if (cl) return `la ${cl[1]} cl`; // virgule-ok : entier capturé par (\d+)
  const carton = /carton(?:\s+de)?\s*(\d+)?/iu.exec(texte);
  if (carton) return carton[1] ? `le carton de ${carton[1]}` : 'le carton';
  const fut = /f[uû]t(?:\s+de)?\s*(\d+)?\s?l?(?!\p{L})/iu.exec(texte);
  if (fut) return fut[1] ? `le fût de ${fut[1]} L` : 'le fût'; // virgule-ok : entier capturé par (\d+)
  return undefined;
}

/** Ce que l'idée de bière dit d'elle-même : degré, arômes, événement visé, format du prix. Chaque champ absent reste `undefined`. */
export function lireIdee(item: CreativeItem): LectureIdee {
  const texte = brut(item);
  const deg = /(?<![\p{L}α])(\d+(?:[.,]\d+)?)\s*%/u.exec(texte.replace(/(?:α|alpha|AA)\s*\d+(?:[.,]\d+)?\s*%/giu, ''));
  const degre = deg ? `${num(deg[1]).toFixed(1).replace('.', ',')} %` : undefined;

  let aromes: string | undefined;
  const explicite = /ar[ôo]mes?\s*(?:de|d['’]|:)?\s*([^.\n]+)/iu.exec(texte)?.[1];
  const apresDeuxPoints = /^[^:.\n]*:\s*([^.\n]+)/u.exec(item.description ?? '')?.[1];
  const morceaux = (explicite ?? apresDeuxPoints ?? '').split(/,|\bet\b/u).map(s => s.trim())
    .filter(s => s && !/\d/.test(s) && !MOT_STYLE.test(s) && s.split(/\s+/).length <= 4);
  if (morceaux.length) aromes = morceaux.join(', ');

  const pour = /(?<!\p{L})pour\s+(?:le|la|les|l['’]|un|une)?\s*([^:,.;\n]+)/iu.exec(texte)?.[1]?.trim();
  return { degre, aromes, pour: pour ? majuscule(pour) : undefined, format: formatVendu(texte) };
}

const MOTS_VIDES = new Set(['bière', 'biere', 'idée', 'idee', 'pour', 'avec', 'dans', 'autour', 'plus', 'sans', 'cette', 'notre', 'votre']);
const racine = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().slice(0, 5);
const mots = (s: string) => (s.match(/\p{L}{4,}/gu) ?? []).filter(m => !MOTS_VIDES.has(m.toLowerCase())).map(racine);

/**
 * Les notes du carnet qui parlent de cette idée, elle-même comprise : au moins deux mots marquants (titre et arômes) en commun,
 * ou une note de tarif au même prix. C'est une lecture du texte, pas un lien enregistré.
 */
export function notesQuiCitent(idee: CreativeItem, items: CreativeItem[]): CreativeItem[] {
  const cles = [...new Set([...mots(idee.title), ...mots(lireIdee(idee).aromes ?? '')])];
  const seuil = Math.min(2, cles.length);
  return items.filter(n => {
    if (!genreDe(n)) return false;
    if (n.id === idee.id) return true;
    if (genreDe(n) === 'tarif' && n.targetPrice != null && n.targetPrice === idee.targetPrice) return true;
    if (seuil === 0) return false;
    const leurs = new Set(mots(`${n.title} ${n.description ?? ''}`));
    return cles.filter(c => leurs.has(c)).length >= seuil;
  });
}

/** Le prospect devient une fiche client : un contact et un numéro absents restent vides (jamais « Responsable », jamais un faux numéro). */
export function enClient(item: CreativeItem, id: string): Client {
  return { id, name: item.title, type: 'Pro', contact: item.contactName || '', phone: item.contactPhone || '', email: '', notes: item.notes || item.description };
}

/** La ligne rangée devient une entrée du carnet : mêmes champs que partout, aucun champ neuf. */
export function enEntree(l: LigneRangee, id: string): CreativeItem {
  const item: CreativeItem = {
    id, type: TYPE_DE_GENRE[l.genre], title: l.titre,
    status: l.genre === 'faire' ? 'todo' : 'idea'
  };
  if (l.genre === 'biere' && l.style !== undefined) item.notes = `Style : ${l.style || 'aucun'}`;
  if (l.description) item.description = l.description;
  if (l.date) item.date = l.date;
  if (l.contactName) item.contactName = l.contactName;
  if (l.contactPhone) item.contactPhone = l.contactPhone;
  if (l.targetPrice != null) item.targetPrice = l.targetPrice;
  if (l.estimatedCost != null) item.estimatedCost = l.estimatedCost;
  return item;
}
