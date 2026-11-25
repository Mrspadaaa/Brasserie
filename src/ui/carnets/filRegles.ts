/**
 * D451 (voie probleme) : les règles d'affichage du fil et du suivi, pures et testées (tests/unit/carnetsProbleme*.test.ts).
 * Rien ici n'écrit : tout se lit des projections du domaine (`filDe`, `suiviDe`, `pourquoiDe`, `avantApresDe`, `dureeDe`).
 * Un mot dit vient du carnet ; l'inconnu est absent, jamais 0.
 *
 * Plage de jours : des jours séparés d'un jour au plus se rangent sous une même pastille (« 21 – 22 nov. ») ; un jour isolé garde la sienne.
 * Écart d'un jour : le fil d'un problème avance par à-coups, deux jours de suite sont un même moment.
 */
import { ecartJours } from '../../domain/calendrier/dates';
import { pluriel } from '../../domain/carnets/comptes';
import { DOMAINE_LIBELLE, domaineDe, plier } from '../../domain/carnets/domaines';
import type { EntreeFil, JourFil, Replie } from '../../domain/carnets/fil';
import type { CarnetDoc, Etiquette, EtatOption, Facon, MessageDoc, SorteEtiquette } from '../../domain/carnets/modele';
import { avantApresDe, categorieDe, dureeDe, etatOption, foisEcartee, jourLocal, optionRetenue, pourquoiDe, suiviDe, type Citation } from '../../domain/carnets/suivi';
import { dateCourte, montant } from './EtatIA';
import type { LienV } from './carnetOuvertTypes';

/* ---------- jours, plages, repli ---------- */

/** « 8 nov. » ; avec l'année courante donnée, une autre année se dit (« 21 déc. 2025 ») : jamais deux années confondues. */
export function libelleJour(jour: string, annee?: number): string {
  const d = dateCourte(jour);
  if (!d) return jour;
  const a = Number(jour.slice(0, 4));
  return annee !== undefined && Number.isFinite(a) && a !== annee ? `${d} ${a}` : d;
}

const MOIS_ET_JOUR = (jour: string): { j: string; m: string } => { const d = dateCourte(jour) ?? jour; const i = d.indexOf(' '); return { j: d.slice(0, i), m: d.slice(i + 1) }; };

/** « 21 – 22 nov. » (même mois), « 30 nov. – 2 déc. » (deux mois), « 8 nov. » (un jour). */
export function libellePlage(du: string, au: string, annee?: number): string {
  if (du === au) return libelleJour(du, annee);
  const a = MOIS_ET_JOUR(du), b = MOIS_ET_JOUR(au);
  const fin = annee !== undefined && Number(au.slice(0, 4)) !== annee ? ` ${au.slice(0, 4)}` : '';
  return a.m === b.m ? `${a.j} – ${b.j} ${b.m}${fin}` : `${a.j} ${a.m} – ${b.j} ${b.m}${fin}`;
}

export interface PlageFil { du: string; au: string; entrees: EntreeFil[] }

/** Les jours du fil rangés en plages : des jours séparés d'un jour au plus se joignent ; l'ordre du temps est gardé. */
export function plagesDe(jours: readonly JourFil[]): PlageFil[] {
  const plages: PlageFil[] = [];
  for (const j of jours) {
    const derniere = plages[plages.length - 1];
    if (derniere && ecartJours(derniere.au, j.jour) <= 1) { derniere.au = j.jour; derniere.entrees.push(...j.entrees); }
    else plages.push({ du: j.jour, au: j.jour, entrees: [...j.entrees] });
  }
  return plages;
}

/** « ▴ 4 notes du 3 au 6 nov. » ; un seul jour : « ▴ 4 notes du 3 nov. ». */
export function libelleRepli(r: Replie, annee?: number): string {
  const n = pluriel(r.n, 'note');
  if (r.du === r.au) return `▴ ${n} du ${libelleJour(r.du, annee)}`;
  const a = MOIS_ET_JOUR(r.du), b = MOIS_ET_JOUR(r.au);
  return a.m === b.m ? `▴ ${n} du ${a.j} au ${b.j} ${b.m}` : `▴ ${n} du ${a.j} ${a.m} au ${b.j} ${b.m}`;
}

/** L'heure d'un instant ISO (« 10:42 », heure locale) ; une date sans heure : rien. */
export function heureDe(iso: string): string | null {
  if (!/T\d{2}:\d{2}/.test(iso)) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/* ---------- jetons sous une bulle ---------- */

export type ClasseJeton = 'piste' | 'ecart' | 'veille' | 'retenu' | 'achat' | 'contact' | 'devis' | 'cout' | 'cause' | 'trouve' | 'pas' | 'constat';
const CLASSE: Record<SorteEtiquette, ClasseJeton> = {
  constat: 'constat', piste: 'piste', ecart: 'ecart', retenu: 'retenu', trouve: 'trouve', 'pas-trouve': 'pas', contact: 'contact', devis: 'devis', cout: 'cout',
  achat: 'achat', cause: 'cause', veille: 'veille', pourquoi: 'constat'
};
const MOT: Record<SorteEtiquette, string> = {
  constat: 'constat', piste: 'piste', ecart: 'écarté', retenu: 'retenu', trouve: 'trouvé', 'pas-trouve': 'pas trouvé', contact: 'contact', devis: 'devis', cout: 'coût',
  achat: 'achat', cause: 'cause', veille: 'veille', pourquoi: 'pourquoi'
};
const rangEn = (n: number): string => `${n}${n === 1 ? 'er' : 'e'}`;

/** « 540 CHF », « ≈ 60 CHF » ; devise absente : CHF ; montant absent : `null` (l'inconnu n'est jamais 0). */
export function texteMontant(e: Pick<Etiquette, 'montantCentimes' | 'devise' | 'estime'>): string | null {
  const m = montant(e.montantCentimes);
  return m === null ? null : `${e.estime ? '≈ ' : ''}${m} ${e.devise ?? 'CHF'}`;
}

/**
 * Le jeton d'une étiquette. `rang` : le rang de cet « écarté » parmi ceux de la même option, dans l'ordre du temps (« écarté, 2e fois »).
 * Le texte de l'étiquette, quand il y en a un, est ce qu'il a dit (« gérance », « veille 3 jours ») ; sinon le mot de la sorte, avec le montant écrit.
 */
export function jetonDe(e: Etiquette, options: ReadonlyMap<string, Facon>, rang = 1): { classe: ClasseJeton; texte: string } {
  const classe = CLASSE[e.sorte];
  const somme = texteMontant(e);
  const opt = e.optionId ? options.get(e.optionId) : undefined;
  let texte: string;
  if (e.sorte === 'ecart') texte = `${opt ? `${nomJeton(opt.nom)} ` : ''}écarté${rang >= 2 ? `, ${rangEn(rang)} fois` : ''}`;
  else if (e.sorte === 'retenu') texte = e.texte && !opt ? e.texte : `${opt ? `${nomJeton(opt.nom)} ` : ''}retenu`;
  else if (e.sorte === 'achat') texte = `achat${somme ? ` ${somme}` : ''}${e.texte ? ` · ${e.texte}` : ''}`;
  else if (e.sorte === 'devis' || e.sorte === 'cout') texte = somme ?? e.texte ?? MOT[e.sorte];
  else texte = e.texte ?? MOT[e.sorte];
  return { classe, texte };
}

/** Le nom court d'une option dans un jeton : le dernier mot signifiant n'est pas deviné, on garde le nom entier (limité à 24 car.). */
const nomJeton = (nom: string): string => (nom.length > 24 ? `${nom.slice(0, 23)}…` : nom);

/** Le rang de chaque étiquette « écarté » d'une option, dans l'ordre du temps des messages (clé : `messageId:index`). */
export function rangsEcart(messages: readonly MessageDoc[], carnetId: string): Map<string, number> {
  const vus = new Map<string, number>();
  const rangs = new Map<string, number>();
  const tries = [...messages].sort((a, b) => a.carnetMessage.le.localeCompare(b.carnetMessage.le));
  for (const m of tries) {
    (m.carnetMessage.etiquettes ?? []).forEach((e, i) => {
      if (e.carnetId !== carnetId || e.sorte !== 'ecart' || !e.optionId) return;
      const n = (vus.get(e.optionId) ?? 0) + 1;
      vus.set(e.optionId, n);
      rangs.set(`${m.id}:${i}`, n);
    });
  }
  return rangs;
}

/* ---------- la rangée de jetons « trouvé n · pas trouvé n · devis · ≈ total » ---------- */

export interface ResumeJetons {
  trouve: number; pasTrouve: number;
  /** Les devis : leur nombre ; le montant seulement s'il n'y en a qu'un et qu'il est écrit. */
  devis: { n: number; centimes?: number } | null;
  /** « ≈ total » des coûts connus (devis et coûts écrits, en francs) ; `null` s'il n'y a pas au moins deux montants à additionner. */
  total: { centimes: number; n: number } | null;
  /** C67-4 : des montants de plusieurs options ALTERNATIVES (l'une OU l'autre) ne s'additionnent pas : la fourchette des options, du plus bas au plus haut ; `null` sinon. */
  fourchette?: { min: number; max: number; n: number } | null;
}

/** Ce que le fil a compté : « cause » est un trouvé ; un montant dans une autre devise n'entre pas dans le total (rien n'est converti en silence). */
export function resumeJetons(messages: readonly MessageDoc[], carnetId: string, retenueId?: string): ResumeJetons | null {
  let trouve = 0, pas = 0;
  const devis: Etiquette[] = [];
  const montants: number[] = [];
  /* les montants par option (clé vide : aucune option visée) : deux options sont deux façons de faire la même chose, jamais deux coûts cumulés */
  const parOption = new Map<string, number[]>();
  for (const m of messages) {
    for (const e of m.carnetMessage.etiquettes ?? []) {
      if (e.carnetId !== carnetId) continue;
      if (e.sorte === 'trouve' || e.sorte === 'cause') trouve += 1;
      else if (e.sorte === 'pas-trouve') pas += 1;
      else if (e.sorte === 'devis') devis.push(e);
      if ((e.sorte === 'devis' || e.sorte === 'cout') && e.montantCentimes !== undefined && (e.devise ?? 'CHF') === 'CHF') {
        montants.push(e.montantCentimes);
        parOption.set(e.optionId ?? '', [...(parOption.get(e.optionId ?? '') ?? []), e.montantCentimes]);
      }
    }
  }
  if (!trouve && !pas && !devis.length && !montants.length) return null;
  const somme = (l: readonly number[]) => l.reduce((s, x) => s + x, 0);
  const optionsChiffrees = [...parOption.keys()].filter(k => k !== '');
  let total: ResumeJetons['total'] = montants.length >= 2 ? { centimes: somme(montants), n: montants.length } : null;
  let fourchette: ResumeJetons['fourchette'] = null;
  if (optionsChiffrees.length >= 2) {
    /* l'option retenue dit le coût ; sinon, les pistes ne se cumulent pas : leur fourchette */
    const gardee = retenueId ? parOption.get(retenueId) : undefined;
    if (gardee) total = { centimes: somme([...gardee, ...(parOption.get('') ?? [])]), n: gardee.length + (parOption.get('')?.length ?? 0) };
    else {
      total = null;
      const parPiste = optionsChiffrees.map(k => somme(parOption.get(k)!));
      const min = Math.min(...parPiste), max = Math.max(...parPiste);
      fourchette = { min, max, n: parPiste.length };
    }
  }
  const unSeul = devis.length === 1 && devis[0].montantCentimes !== undefined && (devis[0].devise ?? 'CHF') === 'CHF';
  return {
    trouve, pasTrouve: pas,
    devis: devis.length ? { n: devis.length, ...(unSeul ? { centimes: devis[0].montantCentimes } : {}) } : null,
    total, fourchette
  };
}

/* ---------- options : noms courts, états, raisons ---------- */

/** « Condenseur B » et « Condenseur A » → « B » et « A » : le préfixe commun tombe, s'il reste quelque chose ; sinon les noms entiers. */
export function nomsDistincts(a: string, b: string): [string, string] {
  const ma = a.trim().split(/\s+/), mb = b.trim().split(/\s+/);
  let i = 0;
  while (i < ma.length && i < mb.length && ma[i].toLowerCase() === mb[i].toLowerCase()) i += 1;
  return i > 0 && i < ma.length && i < mb.length ? [ma.slice(i).join(' '), mb.slice(i).join(' ')] : [a.trim(), b.trim()];
}

/**
 * La question honnête (v03) : « Pourquoi B plutôt que A ? Tes notes ne le disent pas. » seulement si une option est retenue et qu'aucune citation
 * de ses notes ne dit pourquoi (`pourquoiDe` rend `null`). Aucune citation inventée. `autre` : l'option qui reste en lice, sinon la dernière écartée.
 */
export function questionPourquoi(c: CarnetDoc, messages: readonly MessageDoc[]): { retenue: Facon; autre?: Facon; titre: string; amorce: string } | null {
  const retenue = optionRetenue(c);
  if (!retenue) return null;
  if (pourquoiDe(c, messages) !== null) return null;
  const autres = c.carnet.facons.filter(f => f.id !== retenue.id);
  const autre = autres.find(f => etatOption(f) !== 'ecartee') ?? autres[0];
  const [r, a] = autre ? nomsDistincts(retenue.nom, autre.nom) : [retenue.nom.trim(), ''];
  const titre = autre ? `Pourquoi ${r} plutôt que ${a} ?` : `Pourquoi ${r} ?`;
  return { retenue, ...(autre ? { autre } : {}), titre, amorce: `${titre.replace(/ \?$/, '')} : ` };
}

/**
 * Le nom d'une option dans une phrase : « de « Condenseur B » ». Jamais d'article deviné (« du », « de la ») : le genre d'un nom ne se devine pas
 * sans se tromper (`avecArticle` lit « condenseur » et « chambre froide » au mauvais genre : « de la condenseur »), et ses mots ne sont jamais réécrits.
 */
export const deNom = (nom: string): string => `de « ${nom.trim()} »`;

/**
 * « Fermer grâce à l'achat ? » : l'option retenue, si le fil ou le plan dit qu'elle est achetée (un jeton « achat » sur elle, ou le plan payé).
 * Rien n'est supposé : sans l'un des deux, `null` ; un carnet déjà résolu ne le propose plus.
 */
export function achatConstate(c: CarnetDoc, messages: readonly MessageDoc[], planPaye = false): Facon | null {
  if (suiviDe(c).etat === 'resolu') return null;
  const r = optionRetenue(c);
  if (!r) return null;
  const achete = (m: MessageDoc) => (m.carnetMessage.etiquettes ?? []).some(e => e.carnetId === c.id && e.sorte === 'achat' && (!e.optionId || e.optionId === r.id));
  return planPaye || messages.some(achete) ? r : null;
}

/* ---------- le plan lié ---------- */

/** « ira dans Réalisés » seulement si un plan est lié (présent dans À venir) ; « est dans Réalisés » s'il y est ; sinon rien. */
export function destinationPlan(liens: readonly LienV[] | undefined): 'ira' | 'est' | null {
  const l = (liens ?? []).find(x => x.etat === 'present');
  return !l ? null : l.sorte === 'realise' ? 'est' : 'ira';
}

/* ---------- Résolu ---------- */

/** « Résolu en 27 jours » ; zéro : « le jour même » ; inconnu : rien (jamais « 0 jour »). */
export function texteDuree(n: number | null): string | null {
  if (n === null) return null;
  return n === 0 ? 'le jour même' : `en ${pluriel(n, 'jour')}`;
}

/** « Fermé grâce à l'achat de « Condenseur B ». » ; réparation ou texte : ses mots ; rien de dit : `null`. */
export function texteFermeture(c: CarnetDoc): string | null {
  const par = suiviDe(c).resolu?.par;
  if (!par) return null;
  if (par.sorte === 'achat') {
    const o = (par.optionId ? c.carnet.facons.find(f => f.id === par.optionId) : undefined) ?? optionRetenue(c);
    return o ? `Fermé grâce à l'achat ${deNom(o.nom)}.` : `Fermé grâce à un achat.`;
  }
  if (par.sorte === 'reparation') return 'Fermé par la réparation.';
  return par.texte ? `Fermé : ${par.texte}` : null;
}

/** `raison` : ce qu'il a dit en l'écartant (C67-5, maquette v01-resolu) ; absente pour « pas pris » (la fermeture n'est pas un « non » de lui) et quand elle répète seulement « non ». */
export interface OptionFermee { id: string; nom: string; texte: string; raison?: string }

/**
 * Les options qui n'ont pas été prises, avec leur raison, en jeton d'état comme la grille (« pas pris », comme « retenu » ou « écarté » : un mot d'état,
 * jamais accordé) : « pas pris » (jamais écartée, ou écartée par la fermeture), « non, 22 nov. » (écartée par lui ce jour-là), « · 2e fois » si besoin.
 */
export function optionsFermees(c: CarnetDoc, annee?: number): OptionFermee[] {
  const retenue = optionRetenue(c);
  return c.carnet.facons.filter(f => f.id !== retenue?.id).map(f => {
    if (etatOption(f) !== 'ecartee') return { id: f.id, nom: f.nom, texte: 'pas pris' };
    const dernier = [...(f.suivi?.historique ?? [])].reverse().find(p => p.etat === 'ecartee');
    /* la fermeture écarte les pistes restantes avec la raison « pas pris » (suivi.ts, fermerParAchat) : ce n'est pas un « non » de lui */
    if ((dernier?.raison ?? f.raison ?? '').trim().toLowerCase() === 'pas pris') return { id: f.id, nom: f.nom, texte: 'pas pris' };
    const jour = dernier?.le ? libelleJour(jourLocal(dernier.le), annee) : null;
    const fois = foisEcartee(f);
    const raison = (dernier?.raison ?? f.raison ?? '').trim();
    return { id: f.id, nom: f.nom, texte: `non${jour ? `, ${jour}` : ''}${fois >= 2 ? ` · ${rangEn(fois)} fois` : ''}`, ...(raison && plier(raison) !== 'non' ? { raison } : {}) };
  });
}

export interface TuileResolu { id: string; titre: string; jpeg?: string; jour: string | null; dernier: boolean }

/** Les résolus d'une année, du plus ancien au plus récent ; le dernier est marqué (en vert). Une tuile sans photo : le picto de sa catégorie (le composant). */
export function resolusDe(carnets: readonly CarnetDoc[], messages: readonly MessageDoc[], annee: number): { carnets: CarnetDoc[]; tuiles: TuileResolu[] } {
  const faits = carnets.filter(c => suiviDe(c).etat === 'resolu' && Number((suiviDe(c).resolu?.le ?? '').slice(0, 4)) === annee)
    .sort((a, b) => (suiviDe(a).resolu?.le ?? '').localeCompare(suiviDe(b).resolu?.le ?? ''));
  const tuiles = faits.map((c, i) => {
    const av = avantApresDe(c, messages.filter(m => m.carnetMessage.depuis === c.id || m.carnetMessage.effets.some(e => e.carnetId === c.id)));
    const photo = av?.apres ?? av?.avant;
    return { id: c.id, titre: c.title, ...(photo ? { jpeg: photo.jpeg } : {}), jour: suiviDe(c).resolu?.le ? jourLocal(suiviDe(c).resolu!.le) : null, dernier: i === faits.length - 1 };
  });
  return { carnets: faits, tuiles };
}

/* ---------- Relecture : la fiche d'un résolu ---------- */

export interface FicheResolu {
  probleme: string | null; essaye: string[]; pris: { nom: string; prix: string | null; jour: string | null } | null;
  pourquoi: Citation[] | null; duree: string | null; chemin: string;
}

const premiere = (t: string, max = 110): string => {
  const s = t.trim();
  const m = /^[\s\S]*?[.!?](?=\s|$)/.exec(s);
  const p = (m ? m[0] : s).trim();
  return p.length > max ? `${p.slice(0, max - 1).trimEnd()}…` : p;
};

/** « Brasserie › Brassage › Vapeur » : le domaine, puis le chemin posé ; sans l'un, l'autre ; sans rien : « À ranger ». */
export function cheminAffiche(c: CarnetDoc): string {
  const d = domaineDe(c);
  const chemin = categorieDe(c)?.chemin ?? [];
  const parts = [...(d ? [DOMAINE_LIBELLE[d]] : []), ...chemin];
  return parts.length ? parts.join(' › ') : 'À ranger';
}

/** La fiche « problème / essayé / pris / pourquoi / durée » : chaque ligne vient de ses notes, mot pour mot ; une ligne sans source est absente. */
export function ficheResolu(c: CarnetDoc, messages: readonly MessageDoc[]): FicheResolu {
  const doc = c.carnet;
  const mes = messages.filter(m => m.carnetMessage.depuis === c.id || m.carnetMessage.effets.some(e => e.carnetId === c.id) || (m.carnetMessage.etiquettes ?? []).some(e => e.carnetId === c.id));
  const tries = [...mes].sort((a, b) => a.carnetMessage.le.localeCompare(b.carnetMessage.le));
  const constat = tries.find(m => (m.carnetMessage.etiquettes ?? []).some(e => e.carnetId === c.id && e.sorte === 'constat')) ?? tries[0];
  const probleme = constat ? premiere(constat.carnetMessage.texte) : doc.notes[0] ? premiere(doc.notes[0].texte) : doc.phrase && doc.phrase !== c.title ? premiere(doc.phrase) : null;
  const retenue = optionRetenue(c);
  const minus = (n: string) => n.charAt(0).toLowerCase() + n.slice(1);
  const essaye = doc.facons.filter(f => f.id !== retenue?.id).map(f => { const n = foisEcartee(f); return n >= 2 ? `${minus(f.nom)} (non, ${n} fois)` : minus(f.nom); });
  const resolu = suiviDe(c).resolu;
  let pris: FicheResolu['pris'] = null;
  if (retenue) {
    const achat = tries.flatMap(m => m.carnetMessage.etiquettes ?? []).find(e => e.carnetId === c.id && e.optionId === retenue.id && e.sorte === 'cout' && e.montantCentimes !== undefined)
      ?? tries.flatMap(m => m.carnetMessage.etiquettes ?? []).find(e => e.carnetId === c.id && e.sorte === 'achat' && e.montantCentimes !== undefined);
    /* la fiche se relit des mois plus tard : le jour dit son année (« 30 nov. 2026 ») */
    const jourPris = resolu ? `${libelleJour(jourLocal(resolu.le))} ${jourLocal(resolu.le).slice(0, 4)}` : null;
    pris = { nom: minus(retenue.nom), prix: achat ? texteMontant(achat) : null, jour: jourPris };
  } else if (resolu?.par?.texte) pris = { nom: resolu.par.texte, prix: null, jour: `${libelleJour(jourLocal(resolu.le))} ${jourLocal(resolu.le).slice(0, 4)}` };
  const n = tries.length + doc.notes.filter(x => !x.messageId || !mes.some(m => m.id === x.messageId)).length;
  const parts = [texteDureeCourte(dureeDe(c)), n ? pluriel(n, 'note') : null, doc.photos.length ? pluriel(doc.photos.length, 'photo') : null].filter((x): x is string => !!x);
  return { probleme, essaye, pris, pourquoi: pourquoiDe(c, mes), duree: parts.length ? parts.join(' · ') : null, chemin: cheminAffiche(c) };
}

const texteDureeCourte = (n: number | null): string | null => (n === null ? null : n === 0 ? 'le jour même' : pluriel(n, 'jour'));

/** La recherche des résolus : un mot plié (sans accent ni casse) dans le titre, les notes, les options ou la catégorie. Vide : tous. */
export function chercherResolus(carnets: readonly CarnetDoc[], messages: readonly MessageDoc[], q: string): CarnetDoc[] {
  const mots = plier(q).split(/\s+/).filter(Boolean);
  if (!mots.length) return [...carnets];
  return carnets.filter(c => {
    const texte = plier([c.title, c.carnet.phrase, ...c.carnet.notes.map(n => n.texte), ...c.carnet.facons.map(f => f.nom), cheminAffiche(c),
      ...messages.filter(m => m.carnetMessage.depuis === c.id).map(m => m.carnetMessage.texte)].join(' '));
    return mots.every(m => texte.includes(m));
  });
}

/** Les autres résolus rangés par catégorie (le chemin affiché), chacun du plus récent au plus ancien dans sa catégorie. */
export function parCategorie(carnets: readonly CarnetDoc[]): { chemin: string; carnets: CarnetDoc[] }[] {
  const g = new Map<string, CarnetDoc[]>();
  for (const c of carnets) { const k = cheminAffiche(c); g.set(k, [...(g.get(k) ?? []), c]); }
  return [...g.entries()].map(([chemin, l]) => ({ chemin, carnets: l.sort((a, b) => (suiviDe(b).resolu?.le ?? '').localeCompare(suiviDe(a).resolu?.le ?? '')) }))
    .sort((a, b) => a.chemin.localeCompare(b.chemin, 'fr'));
}

/** L'état d'une option en mot court, pour son jeton dans la grille (le mot de la maquette : retenu, piste, veille, écarté). */
export const MOT_OPTION: Record<EtatOption, string> = { retenue: 'retenu', piste: 'piste', veille: 'veille', ecartee: 'écarté' };
