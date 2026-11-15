/**
 * ks4 (choisie le 15.11, « Top ») : une note du Carnet rangée par l'IA. Fonctions pures, sans stockage ni réseau.
 *
 * État de l'art (MISSION.md § « État de l'art — ks4 ») : extraction structurée d'un texte court par un LLM à sortie imposée
 * (`responseSchema`, tâche serveur `rangerNote`). Ce module est le garde côté app :
 *   1. `lireReponse` : la réponse du modèle → effets validés, ou `null` (la note reste brute). Une date se revérifie (jour de semaine,
 *      jour du mois présent dans la note, ni passée ni à plus d'un an) ; un nombre (fûts, litres) doit figurer dans la note.
 *   2. `proposer` : effets → une case par chose (À faire, Lier au contact ou Noter le contact, Convertir en client décochée, Idée de bière).
 *      Le prix est deviné depuis Tarifs (prix d'un fût de la même contenance), jamais par l'IA.
 *   3. `ecrire` : seules les cases cochées → écritures existantes (`CreativeItem` event, prospect, recipe-idea ; conversion par le chemin de kc1).
 *
 * Champs : la note est un `CreativeItem` de type `note` (titre = ta phrase ; statut `idea` brute, `todo` en attente du réseau, `done` rangée) ;
 * chaque chose créée porte `noteId`. Ces deux ajouts sont optionnels et rétrocompatibles ; ils vivent ici (`ItemCarnet`) tant que
 * `src/types/index.ts` n'est pas ouvert à la voie (accord groupé). Le prix d'une tâche va dans `targetPrice` (« Prix visé » de la fiche),
 * le contact lié dans `contactName` (le lieu, tel que kc1 le titre) : aucun autre champ neuf. Un moment de houblon n'est jamais créé :
 * « fin d'ébu » reste un texte dans la description de l'idée.
 */
import type { CreativeItem, PricingItem } from '../types';

export type ItemCarnet = Omit<CreativeItem, 'type'> & { type: CreativeItem['type'] | 'note'; noteId?: string };

/** Vers le stockage, qui ne connaît pas encore le type `note` : seul point de passage (voir l'en-tête). */
export const versStockage = (item: ItemCarnet): CreativeItem => item as unknown as CreativeItem;
export const estNote = (item: { type: string }): boolean => item.type === 'note';

export type SorteEffet = 'tache' | 'contact' | 'client' | 'idee-biere';
const SORTES: readonly SorteEffet[] = ['tache', 'contact', 'client', 'idee-biere'];

/** Un effet relu et accepté. `date` au format de l'app (`JJ.MM.AAAA`). */
export interface Effet {
  sorte: SorteEffet;
  titre: string;
  date?: string;
  nombre?: number;
  contenanceL?: number;
  /** Titre exact d'un contact connu (fourni au modèle). */
  contact?: string;
  /** Lieu d'un contact neuf, tel que la note le dit. */
  lieu?: string;
  personne?: string;
  /** Nom exact d'une bière connue. */
  biere?: string;
  /** Détail gardé tel quel (ex. « Nelson Sauvin en fin d'ébullition »). */
  texte?: string;
}

export interface Contexte {
  /** Date de saisie de la note. */
  saisie: Date;
  /** Contacts (prospects) existants. */
  contacts: readonly CreativeItem[];
  tarifs: readonly PricingItem[];
  /** Bières connues (recettes, tarifs). */
  bieres: readonly string[];
}

export const JOURS = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'] as const;
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'] as const;
const JOUR_MS = 86_400_000;
const midi = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
const ecart = (a: Date, b: Date) => Math.round((midi(b).getTime() - midi(a).getTime()) / JOUR_MS);

/** `AAAA-MM-JJ` → Date (midi), ou `null` si la date n'existe pas. */
export function lireIso(v: unknown): Date | null {
  if (typeof v !== 'string') return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const [an, mois, jour] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const d = new Date(an, mois - 1, jour, 12);
  return d.getFullYear() === an && d.getMonth() === mois - 1 && d.getDate() === jour ? d : null;
}
export const enSuisse = (d: Date) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
export function lireSuisse(v?: string): Date | null {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec((v ?? '').trim());
  if (!m) return null;
  return lireIso(`${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`);
}
/** « sam. 12 déc. » */
export const jourComplet = (d: Date) => `${JOURS[d.getDay()]} ${d.getDate()} ${MOIS[d.getMonth()]}`;
/** « 12 déc. » */
export const jourMois = (d: Date) => `${d.getDate()} ${MOIS[d.getMonth()]}`;

const sansAccents = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** Les nombres écrits dans la note (« 2 », « 20 », « 7,5 »). */
export function nombresDe(texte: string): number[] {
  return [...texte.matchAll(/\d+(?:[.,]\d+)?/g)].map((m) => Number(m[0].replace(',', '.')));
}
/** Mots qui fondent une date sans la chiffrer : la date rendue par le modèle se garde alors si elle est cohérente. */
const MOTS_DATE = /\b(aujourd'hui|aujourd’hui|demain|apres-demain|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|semaine|week-end|weekend|mois prochain|fin du mois)\b/;

/**
 * Relit la réponse du modèle. `null` : réponse invalide ou incohérente, la note reste brute (rien n'est proposé).
 * Une réponse valide sans effet rend `[]` (rien à proposer : brute aussi).
 */
export function lireReponse(brut: unknown, note: string, saisie: Date): Effet[] | null {
  if (!brut || typeof brut !== 'object') return null;
  const effets = (brut as { effets?: unknown }).effets;
  if (!Array.isArray(effets) || effets.length > 6) return null;
  const texte = sansAccents(note);
  const nombres = nombresDe(note);
  const sortie: Effet[] = [];
  for (const e of effets) {
    if (!e || typeof e !== 'object') return null;
    const r = e as Record<string, unknown>;
    if (!SORTES.includes(r.sorte as SorteEffet)) return null;
    const titre = typeof r.titre === 'string' ? r.titre.trim() : '';
    if (!titre || titre.length > 120) return null;
    const effet: Effet = { sorte: r.sorte as SorteEffet, titre };
    if (r.date !== undefined && r.date !== null && r.date !== '') {
      const d = lireIso(r.date);
      if (!d) return null;
      const n = ecart(saisie, d);
      if (n < 0 || n > 400) return null;
      if (r.jour !== undefined && r.jour !== null && r.jour !== '' && r.jour !== JOURS[d.getDay()]) return null;
      const fondee = nombres.includes(d.getDate()) || MOTS_DATE.test(texte);
      if (!fondee) return null;
      effet.date = enSuisse(d);
    }
    for (const cle of ['nombre', 'contenanceL'] as const) {
      const v = r[cle];
      if (v === undefined || v === null) continue;
      if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0 || !nombres.includes(v)) return null;
      effet[cle] = v;
    }
    for (const cle of ['contact', 'lieu', 'personne', 'biere', 'texte'] as const) {
      const v = r[cle];
      if (typeof v === 'string' && v.trim()) effet[cle] = v.trim().slice(0, 160);
    }
    sortie.push(effet);
  }
  return sortie;
}

/** Prix deviné d'une livraison en fûts, depuis Tarifs ; `undefined` si Tarifs ne permet pas de le dire sans choisir. */
export function prixDevine(nombre: number | undefined, contenanceL: number | undefined, biere: string | undefined, tarifs: readonly PricingItem[]): number | undefined {
  if (!nombre || !contenanceL) return undefined;
  const futs = tarifs.filter((t) => t.format?.id === 'fut' && t.format.volumeL === contenanceL && Number.isFinite(t.priceHT) && t.priceHT > 0);
  const pour = biere ? futs.filter((t) => t.biere === biere) : futs;
  const prix = [...new Set(pour.map((t) => t.priceHT))];
  return prix.length === 1 ? Math.round(prix[0] * nombre * 100) / 100 : undefined;
}

export type Proposition =
  | { cle: string; sorte: 'tache'; titre: string; date?: string; nombre?: number; contenanceL?: number; biere?: string; coche: boolean }
  | { cle: string; sorte: 'lier'; contactId: string; lieu: string; coche: boolean }
  | { cle: string; sorte: 'noter-contact'; lieu: string; personne?: string; coche: boolean }
  | { cle: string; sorte: 'client'; coche: false | true }
  | { cle: string; sorte: 'idee'; titre: string; texte?: string; coche: boolean };

const norm = (s: string) => sansAccents(s).replace(/\s+/g, ' ').trim();

/** Effets → une case par chose. « Convertir en client » n'est proposé que s'il y a un contact non encore client, toujours décoché. */
export function proposer(effets: readonly Effet[], ctx: Contexte): Proposition[] {
  const out: Proposition[] = [];
  const bieres = new Set(ctx.bieres);
  let contactVu = false;
  let clientPossible = false;
  effets.forEach((e, i) => {
    const cle = `${e.sorte}-${i}`;
    if (e.sorte === 'tache') {
      out.push({ cle, sorte: 'tache', titre: e.titre, date: e.date, nombre: e.nombre, contenanceL: e.contenanceL, biere: e.biere && bieres.has(e.biere) ? e.biere : undefined, coche: true });
    } else if (e.sorte === 'contact' && !contactVu) {
      contactVu = true;
      const connu = e.contact ? ctx.contacts.find((c) => norm(c.title) === norm(e.contact!)) : undefined;
      if (connu) {
        out.push({ cle, sorte: 'lier', contactId: connu.id, lieu: connu.title, coche: true });
        clientPossible = connu.status !== 'validated';
      } else {
        const lieu = (e.lieu ?? e.contact ?? e.titre).trim();
        out.push({ cle, sorte: 'noter-contact', lieu, personne: e.personne, coche: true });
        clientPossible = true;
      }
    } else if (e.sorte === 'idee-biere') {
      out.push({ cle, sorte: 'idee', titre: e.titre, texte: e.texte, coche: true });
    }
  });
  if (clientPossible && effets.some((e) => e.sorte === 'client')) out.push({ cle: 'client', sorte: 'client', coche: false });
  return out;
}

/** Le nombre de choses rangées : chaque case cochée compte, Convertir en client comprise. */
export const nbCochees = (props: readonly Proposition[]) => props.filter((p) => p.coche).length;

/**
 * Annuler défait les écritures ; la proposition revient telle que le brasseur l'avait laissée (date corrigée, bière, cases).
 * Une fiche Clients ne se retire pas d'ici : si elle a été créée, la case « Convertir en client » ne revient pas (elle ne
 * créerait rien de plus : jamais deux fiches).
 */
export const apresAnnuler = (props: readonly Proposition[], converti: boolean): Proposition[] =>
  props.filter((p) => !(converti && p.sorte === 'client')).map((p) => ({ ...p }));

/** Le contact visé par les cases cochées (lié ou noté), ou rien. */
export function contactVise(props: readonly Proposition[]): { lieu: string; contactId?: string } | undefined {
  const p = props.find((x) => x.coche && (x.sorte === 'lier' || x.sorte === 'noter-contact'));
  if (!p) return undefined;
  return p.sorte === 'lier' ? { lieu: p.lieu, contactId: p.contactId } : p.sorte === 'noter-contact' ? { lieu: p.lieu } : undefined;
}

export interface Ecritures {
  creer: ItemCarnet[];
  note: ItemCarnet;
  /** Conversion en client (chemin kc1, « jamais deux ») : l'id du contact lié ou créé. */
  convertir?: string;
  /** Ce qui reste à poser sur la tâche (dans cet ordre). */
  reste: Array<'Bière' | 'Date' | 'Prix'>;
}

/** Seules les cases cochées écrivent. `null` si aucune n'est cochée (la note reste brute). */
export function ecrire(note: ItemCarnet, props: readonly Proposition[], ctx: Pick<Contexte, 'tarifs'>, maintenant: number): Ecritures | null {
  const cochees = props.filter((p) => p.coche);
  if (cochees.length === 0) return null;
  const creer: ItemCarnet[] = [];
  const id = (k: number) => `CR-${maintenant}-${k}`;
  const contact = contactVise(cochees);
  let convertir: string | undefined;
  let reste: Ecritures['reste'] = [];
  cochees.forEach((p, k) => {
    if (p.sorte === 'tache') {
      const prix = prixDevine(p.nombre, p.contenanceL, p.biere, ctx.tarifs);
      creer.push({
        id: id(k), type: 'event', status: 'todo', noteId: note.id,
        title: p.biere ? `${p.titre} de ${p.biere}` : p.titre,
        ...(p.date ? { date: p.date } : {}),
        ...(prix !== undefined ? { targetPrice: prix } : {}),
        ...(contact ? { contactName: contact.lieu } : {})
      });
      reste = [...(p.nombre && !p.biere ? ['Bière' as const] : []), ...(p.date ? [] : ['Date' as const]), ...(p.nombre && prix === undefined ? ['Prix' as const] : [])];
    } else if (p.sorte === 'noter-contact') {
      creer.push({ id: id(k), type: 'prospect', status: 'idea', noteId: note.id, title: p.lieu, ...(p.personne ? { contactName: p.personne } : {}) });
    } else if (p.sorte === 'idee') {
      creer.push({ id: id(k), type: 'recipe-idea', status: 'idea', noteId: note.id, title: p.titre, ...(p.texte ? { description: p.texte } : {}) });
    }
  });
  if (cochees.some((p) => p.sorte === 'client') && contact) {
    convertir = contact.contactId ?? creer.find((c) => c.type === 'prospect')?.id;
  }
  return { creer, note: { ...note, status: 'done' }, convertir, reste };
}

export type ModeIA = 'eteint' | 'simule' | 'production';
/** Une note envoyée : vers l'IA, en attente du réseau, ou gardée brute (IA éteinte). */
export function envoi(mode: ModeIA, enLigne: boolean): 'ia' | 'attente' | 'brute' {
  if (mode === 'eteint') return 'brute';
  return enLigne ? 'ia' : 'attente';
}
/** Statut de la note à l'envoi. */
export const statutEnvoi = (e: ReturnType<typeof envoi>): CreativeItem['status'] => (e === 'attente' ? 'todo' : 'idea');

/** Ce que l'app passe au modèle : la phrase, la date de saisie (et son jour), les contacts et bières connus. */
export function contexteModele(note: string, ctx: Contexte) {
  const s = ctx.saisie;
  const iso = `${s.getFullYear()}-${String(s.getMonth() + 1).padStart(2, '0')}-${String(s.getDate()).padStart(2, '0')}`;
  return { note, saisie: iso, jourSaisie: JOURS[s.getDay()], contacts: ctx.contacts.map((c) => c.title), bieres: [...ctx.bieres] };
}

/** Le moment de la note, lu dans son id (`CR-<ms>`), ou rien. */
export function dateDeNote(id: string): Date | null {
  const m = /^CR-(\d{12,})/.exec(id);
  return m ? new Date(Number(m[1])) : null;
}

/** CHF à deux décimales, à la suisse (« 280,00 »). */
export const chf = (n: number) => n.toFixed(2).replace('.', ',');
