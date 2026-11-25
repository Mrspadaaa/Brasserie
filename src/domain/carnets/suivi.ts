/**
 * D451 (port du suivi d'un problème, de l'idée à la résolution) : l'état d'un carnet, ses options, et les intentions qui les changent.
 *
 * État de l'art (PLAN § État de l'art, L29) : machine à états à graphe complet (aucune garde : les 4 états sont libres dans les deux sens,
 * CADRAGE, K4), journal d'événements en ajout seul (`ajouterEvenement`, plafond 200), changement parallèle + lecteur tolérant (tout champ neuf
 * est facultatif ; un carnet sans `suivi` se **dérive** à la lecture, rien n'est réécrit en masse). Aucune bibliothèque neuve.
 *
 * Chaque intention est `(etat, args) => Resultat` (patron de operations.ts) : écritures document par document et leur inverse ; appliquer puis
 * l'inverse redonne l'état d'avant. Un refus n'écrit rien ; un geste sans effet rend `ok` sans écriture. `veille.releveLe` n'est jamais écrit.
 */
import { ecartJours } from '../calendrier/dates';
import { Brouillon, refus, type Etat, type Resultat } from './operations';
import {
  ajouterEvenement, nouvelIdCarnet, sansIndefinis, ETATS_OPTION, ETATS_SUIVI, GENRES_CARNET,
  type CarnetDoc, type CategoriePosee, type Etiquette, type EtatOption, type EtatSuivi, type Facon, type GenreCarnet, type MessageDoc, type Origine, type OrigineVousIA, type Photo,
  type SorteEtiquette, type SuiviCarnet, type SuiviFacon
} from './modele';

export const LIBELLE_ETAT: Record<EtatSuivi, string> = { note: 'Noté', cherche: 'Je cherche', decide: 'Décidé', resolu: 'Résolu' };
export const LIBELLE_OPTION: Record<EtatOption, string> = { piste: 'piste', veille: 'veille', ecartee: 'écartée', retenue: 'retenue' };

/** Le jour (AAAA-MM-JJ) d'une date ISO, à l'heure locale pour un instant (23 h 30 d'ici n'est pas la veille) ; une date seule reste telle quelle. */
export function jourLocal(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ---------- dérivations (un carnet sans `suivi` se lit, il ne s'écrit pas) ---------- */

/** L'état de l'option : `facon.etat` (ancien, que les vieux clients écrivent aussi) prime pour retenue et écartée ; la veille vit dans `suivi`. */
export function etatOption(f: Facon): EtatOption {
  if (f.etat === 'retenue') return 'retenue';
  if (f.etat === 'ecartee') return 'ecartee';
  return f.suivi && (f.suivi.etat === 'piste' || f.suivi.etat === 'veille') ? f.suivi.etat : 'piste';
}

/** Le suivi d'une option tel qu'on le lit : l'état courant, et l'historique (sans date pour un état d'avant le suivi : jamais inventée). */
export function suiviFacon(f: Facon): SuiviFacon {
  const etat = etatOption(f);
  const historique = f.suivi?.historique ?? (etat === 'piste' ? [] : [sansIndefinis({ etat, raison: f.raison, origine: f.origine })]);
  return { etat, historique };
}

/** « écartée, 2e fois » : combien de fois l'option a été écartée (compté dans l'historique, jamais stocké). */
export const foisEcartee = (f: Facon): number => suiviFacon(f).historique.filter(p => p.etat === 'ecartee').length;

/** L'option retenue : celle dont l'état est retenue, sinon celle du choix posé. */
export function optionRetenue(c: CarnetDoc): Facon | undefined {
  const d = c.carnet;
  return d.facons.find(f => etatOption(f) === 'retenue') ?? (d.choix?.faconId ? d.facons.find(f => f.id === d.choix!.faconId) : undefined);
}

/** L'état que dit le contenu : choix ou option retenue → décidé ; façon ou article → je cherche ; sinon noté. */
export function etatContenu(c: CarnetDoc): EtatSuivi {
  const d = c.carnet;
  if (d.choix || d.facons.some(f => etatOption(f) === 'retenue')) return 'decide';
  if (d.facons.length || d.articles.length) return 'cherche';
  return 'note';
}

/** L'état du carnet : archivé → résolu ; sinon l'état écrit ; sinon celui du contenu. */
export const etatDe = (c: CarnetDoc): EtatSuivi => (c.carnet.archive ? 'resolu' : c.carnet.suivi?.etat ?? etatContenu(c));

/** Le genre : posé, sinon achat (un article ou un choix), sinon idée (les carnets du Planning compris). */
export function genreDe(c: CarnetDoc): GenreCarnet {
  const d = c.carnet;
  return d.genre?.valeur ?? (d.articles.length || d.choix ? 'achat' : 'idee');
}

/** La catégorie posée (chemin sous le domaine) ; `null` si aucune : le carnet reste sous son domaine, ou « À ranger ». */
export const categorieDe = (c: CarnetDoc): CategoriePosee | null => c.carnet.categorie ?? null;

/** Le suivi tel qu'on le lit : état dérivé comprise, résolution déduite de l'archive. Aucune écriture. */
export function suiviDe(c: CarnetDoc): SuiviCarnet {
  const s = c.carnet.suivi;
  const etat = etatDe(c);
  const resolu = etat === 'resolu' ? s?.resolu ?? (c.carnet.archive ? { le: c.carnet.archive.le } : undefined) : undefined;
  return sansIndefinis({ etat, evenements: s?.evenements ?? [], resolu, avantApres: s?.avantApres, relu: s?.relu });
}

/** Le jour de la décision : le plus ancien repère (événement décidé ou résolu, choix posé, résolution) ; `undefined` si rien n'est décidé. */
function dateDecision(c: CarnetDoc): string | undefined {
  const s = suiviDe(c);
  const reperes = [...s.evenements.filter(e => e.vers === 'decide' || e.vers === 'resolu').map(e => e.le), c.carnet.choix?.le, s.resolu?.le].filter((x): x is string => !!x);
  return reperes.sort()[0];
}

/** Jours entre la création et la résolution ; `null` tant que ce n'est pas résolu (ou si les dates se contredisent). */
export function dureeDe(c: CarnetDoc): number | null {
  const r = suiviDe(c).resolu;
  if (!r) return null;
  const n = ecartJours(jourLocal(c.carnet.creeLe), jourLocal(r.le));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export interface AvantApresVu { avant?: Photo; apres?: Photo }

/**
 * L'avant et l'après : ce qu'il a posé, sinon la 1re photo du fil, et la dernière photo prise après la décision (la date d'une photo est celle de
 * son message). Une photo dont la date est inconnue n'est jamais « après ». `null` : aucune photo, le picto de la catégorie la remplace.
 */
export function avantApresDe(c: CarnetDoc, messages: readonly MessageDoc[] = []): AvantApresVu | null {
  const photos = c.carnet.photos;
  const posee = c.carnet.suivi?.avantApres;
  const parId = (id?: string): Photo | undefined => (id ? photos.find(p => p.id === id) : undefined);
  const avant = parId(posee?.avantPhotoId) ?? photos[0];
  let apres = parId(posee?.apresPhotoId);
  if (!apres) {
    const decision = dateDecision(c);
    if (decision) {
      const dates = new Map(messages.map(m => [m.id, m.carnetMessage.le] as const));
      const apresDecision = photos.filter(p => p.id !== avant?.id && p.messageId !== undefined && (dates.get(p.messageId) ?? '') >= decision);
      apres = apresDecision[apresDecision.length - 1];
    }
  }
  if (apres && avant && apres.id === avant.id) apres = undefined;
  return avant || apres ? sansIndefinis({ avant, apres }) : null;
}

export interface Citation { texte: string; sorte: SorteEtiquette | 'choix'; messageId?: string; le?: string }

const RANG_POURQUOI: Partial<Record<SorteEtiquette | 'choix', number>> = { choix: 0, retenu: 1, pourquoi: 2, achat: 3, veille: 4 };
/** La première phrase d'un message (sous-chaîne exacte) : la citation quand l'étiquette ne dit pas laquelle. */
const premierePhrase = (t: string): string => {
  const s = t.trim();
  const m = /^[\s\S]*?[.!?](?=\s|$)/.exec(s); /* sans lookbehind : un Safari d'avant 16.4 refuserait tout le module */
  return (m ? m[0] : s).trim();
};

/**
 * « Pourquoi j'ai pris ça » : ses propres mots, mot pour mot (jamais réécrits) : le « pourquoi » du choix posé, et les messages liés à l'option
 * retenue (étiquettes retenu, pourquoi, achat, veille). Une étiquette cite sa phrase si elle est dans le message, sinon c'est la 1re phrase du
 * message. Deux citations au plus, rendues dans l'ordre du temps ; aucune : `null` (la question honnête s'affiche, rien n'est inventé).
 */
export function pourquoiDe(c: CarnetDoc, messages: readonly MessageDoc[]): Citation[] | null {
  const retenue = optionRetenue(c);
  const trouvees: (Citation & { rang: number })[] = [];
  const pourquoiChoix = c.carnet.choix?.pourquoi.trim();
  if (pourquoiChoix) trouvees.push({ texte: pourquoiChoix, sorte: 'choix', le: c.carnet.choix!.le, rang: 0 });
  for (const m of messages) {
    for (const e of m.carnetMessage.etiquettes ?? []) {
      const rang = RANG_POURQUOI[e.sorte];
      if (rang === undefined || e.carnetId !== c.id) continue;
      if (e.optionId && retenue && e.optionId !== retenue.id) continue;
      const mot = e.texte && m.carnetMessage.texte.includes(e.texte) ? e.texte : premierePhrase(m.carnetMessage.texte);
      if (!mot || trouvees.some(t => t.texte === mot)) continue;
      trouvees.push({ texte: mot, sorte: e.sorte, messageId: m.id, le: m.carnetMessage.le, rang });
    }
  }
  const choisies = [...trouvees].sort((a, b) => a.rang - b.rang || (b.le ?? '').localeCompare(a.le ?? '')).slice(0, 2);
  if (!choisies.length) return null;
  return choisies.sort((a, b) => (a.le ?? '').localeCompare(b.le ?? '')).map(({ rang: _r, ...citation }) => citation);
}

/* ---------- intentions ---------- */

const idEvenement = (): string => nouvelIdCarnet('EVT');

/**
 * Le suivi écrit du carnet (copie de brouillon), créé au premier geste avec l'état d'AVANT (dérivé) : à appeler avant de toucher au contenu.
 * Un carnet archivé garde l'archive : son état est résolu, la résolution se déduit de l'archive.
 */
export function assurerSuivi(c: CarnetDoc): SuiviCarnet {
  const d = c.carnet;
  const avant = etatDe(c);
  if (!d.suivi) d.suivi = { etat: avant, evenements: [] };
  else d.suivi.etat = avant;
  if (avant === 'resolu' && !d.suivi.resolu && d.archive) d.suivi.resolu = { le: d.archive.le };
  return d.suivi;
}

interface PasEtat { le: string; origine: Origine; raison?: string; optionId?: string; id?: string }

/** Change l'état (sans garde), écrit l'événement ; quitter Résolu rouvre (et lève l'archive). Rend faux si l'état est déjà celui-là. */
function poserEtat(c: CarnetDoc, s: SuiviCarnet, vers: EtatSuivi, a: PasEtat): boolean {
  const avant = s.etat;
  if (avant === vers) return false;
  const sorte = avant === 'resolu' ? 'rouvert' : vers === 'resolu' ? 'resolu' : 'etat';
  ajouterEvenement(s, sansIndefinis({ id: a.id ?? idEvenement(), le: a.le, sorte, de: avant, vers, optionId: a.optionId, raison: a.raison, origine: a.origine }));
  s.etat = vers;
  if (vers === 'resolu') s.resolu = { le: a.le };
  else if (avant === 'resolu') delete s.resolu;
  if (avant === 'resolu') delete c.carnet.archive;
  return true;
}

const ecrire = (b: Brouillon, c: CarnetDoc, avis: string): Resultat => { b.ecrire(c); return b.resultat(avis); };

/** « Je cherche », « Décidé »… : la barre d'état. Les 16 couples sont permis ; vers le même état : sans effet, sans événement. */
export function changerEtat(etat: Etat, args: { carnetId: string; vers: EtatSuivi; le: string; origine?: Origine; raison?: string; id?: string }): Resultat {
  if (!ETATS_SUIVI.includes(args.vers)) return refus('État inconnu.');
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  const s = assurerSuivi(c);
  if (!poserEtat(c, s, args.vers, { le: args.le, origine: args.origine ?? 'vous', raison: args.raison, id: args.id })) return b.resultat(`Déjà ${LIBELLE_ETAT[args.vers].toLowerCase()}`);
  return ecrire(b, c, `✓ ${LIBELLE_ETAT[args.vers]}`);
}

/** Rouvrir un résolu (le geste « Rouvrir ») : retour à `vers`, sinon à l'état que dit le contenu (hors archive). */
export function rouvrir(etat: Etat, args: { carnetId: string; le: string; vers?: Exclude<EtatSuivi, 'resolu'>; origine?: Origine }): Resultat {
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  if (etatDe(c) !== 'resolu') return refus('Ce carnet n’est pas résolu.');
  const cible = args.vers ?? etatContenu(c);
  const s = assurerSuivi(c);
  poserEtat(c, s, cible, { le: args.le, origine: args.origine ?? 'vous' });
  return ecrire(b, c, '✓ Rouvert');
}

interface PasOptionArgs { le: string; raison?: string; origine: Origine; demoter?: boolean }

/**
 * Change l'état d'une option (libre : piste, veille, écartée, retenue, dans tous les sens) : historique daté, événement, et `facon.etat` écrit
 * comme avant (veille → ouverte) pour les vieux clients. Une seule option retenue à la fois : retenir B remet A en piste et le dit.
 */
function appliquerOption(c: CarnetDoc, s: SuiviCarnet, f: Facon, vers: EtatOption, a: PasOptionArgs): boolean {
  const avant = etatOption(f);
  if (avant === vers) return false;
  if (f.suivi) f.suivi.etat = avant;
  else f.suivi = { etat: avant, historique: avant === 'piste' ? [] : [sansIndefinis({ etat: avant, raison: f.raison, origine: f.origine })] };
  if (vers === 'retenue' && a.demoter !== false) {
    for (const g of c.carnet.facons) if (g.id !== f.id && etatOption(g) === 'retenue') appliquerOption(c, s, g, 'piste', { le: a.le, raison: `remplacée par ${f.nom}`, origine: a.origine });
  }
  f.suivi.historique.push(sansIndefinis({ etat: vers, le: a.le, raison: a.raison, origine: a.origine }));
  f.suivi.etat = vers;
  f.etat = vers === 'retenue' ? 'retenue' : vers === 'ecartee' ? 'ecartee' : 'ouverte';
  if (vers === 'ecartee' && a.raison) f.raison = a.raison;
  /* C67-7 : la raison d'un écart se dit avec l'écart seulement ; l'option reprise (retenue, piste, veille) ne la garde pas (elle reste dans son historique) */
  if (vers !== 'ecartee' && avant === 'ecartee') delete f.raison;
  ajouterEvenement(s, sansIndefinis({ id: idEvenement(), le: a.le, sorte: vers === 'veille' || avant === 'veille' ? 'veille' : 'option', optionId: f.id, de: avant, vers, raison: a.raison, origine: a.origine }));
  return true;
}

/** Une option change d'état : piste, veille, écartée (avec sa raison), retenue. Libre dans tous les sens. */
export function changerOption(etat: Etat, args: { carnetId: string; faconId: string; vers: EtatOption; le: string; raison?: string; origine?: Origine }): Resultat {
  if (!ETATS_OPTION.includes(args.vers)) return refus('État d’option inconnu.');
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  const f = c?.carnet.facons.find(x => x.id === args.faconId);
  if (!c || !f) return refus('Option introuvable.');
  const s = assurerSuivi(c);
  if (!appliquerOption(c, s, f, args.vers, { le: args.le, raison: args.raison?.trim() || undefined, origine: args.origine ?? 'vous' })) return b.resultat(`Déjà ${LIBELLE_OPTION[args.vers]}`);
  return ecrire(b, c, `✓ ${f.nom} : ${LIBELLE_OPTION[args.vers]}`);
}

/** Retenir une option : elle passe en retenue (les autres retenues repassent en piste) et le carnet en Décidé s'il cherchait ou n'était que noté. */
export function retenirOption(etat: Etat, args: { carnetId: string; faconId: string; le: string; raison?: string; origine?: Origine }): Resultat {
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  const f = c?.carnet.facons.find(x => x.id === args.faconId);
  if (!c || !f) return refus('Option introuvable.');
  const origine = args.origine ?? 'vous';
  const s = assurerSuivi(c);
  const option = appliquerOption(c, s, f, 'retenue', { le: args.le, raison: args.raison?.trim() || undefined, origine });
  const etatCarnet = s.etat === 'note' || s.etat === 'cherche' ? poserEtat(c, s, 'decide', { le: args.le, origine, optionId: f.id }) : false;
  if (!option && !etatCarnet) return b.resultat('Déjà retenue');
  return ecrire(b, c, `✓ ${f.nom} retenue`);
}

/**
 * « Fermer grâce à l'achat ? Oui » : résolu, fermé par l'achat (`resolu.par`) ; l'option retenue reste ; chaque autre option passe en écartée avec sa
 * raison gardée, sinon « pas pris ». L'inverse rend exactement le carnet d'avant, options comprises.
 */
export function fermerParAchat(etat: Etat, args: { carnetId: string; le: string; optionId?: string; articleId?: string; planId?: string; origine?: Origine }): Resultat {
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  if (etatDe(c) === 'resolu') return refus('Déjà résolu.');
  const choisie = args.optionId ? c.carnet.facons.find(f => f.id === args.optionId) : optionRetenue(c);
  if (args.optionId && !choisie) return refus('Option introuvable.');
  if (args.articleId && !c.carnet.articles.some(a => a.id === args.articleId)) return refus('Article introuvable.');
  const origine = args.origine ?? 'vous';
  const s = assurerSuivi(c);
  if (choisie) appliquerOption(c, s, choisie, 'retenue', { le: args.le, origine, demoter: false });
  for (const f of c.carnet.facons) if (f !== choisie && etatOption(f) !== 'ecartee') appliquerOption(c, s, f, 'ecartee', { le: args.le, raison: f.raison?.trim() || 'pas pris', origine });
  poserEtat(c, s, 'resolu', { le: args.le, origine, optionId: choisie?.id });
  s.resolu = { le: args.le, par: sansIndefinis({ sorte: 'achat' as const, optionId: choisie?.id, articleId: args.articleId ?? c.carnet.choix?.articleId, planId: args.planId ?? c.carnet.sortie?.planId }) };
  return ecrire(b, c, '✓ Résolu · fermé par l’achat');
}

/** Résolu sans achat (« plus de fuite », réparé) : l'état passe à Résolu, la façon dont il l'est tient en une phrase à lui (jamais inventée). */
export function resoudre(etat: Etat, args: { carnetId: string; le: string; sorte?: 'reparation' | 'texte'; texte?: string; origine?: Origine }): Resultat {
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  if (etatDe(c) === 'resolu') return refus('Déjà résolu.');
  const s = assurerSuivi(c);
  poserEtat(c, s, 'resolu', { le: args.le, origine: args.origine ?? 'vous', raison: args.texte?.trim() || undefined });
  const texte = args.texte?.trim();
  s.resolu = { le: args.le, ...(texte || args.sorte ? { par: sansIndefinis({ sorte: args.sorte ?? ('texte' as const), texte: texte || undefined }) } : {}) };
  return ecrire(b, c, '✓ Résolu');
}

/**
 * La veille d'une option : allumée seulement par un geste de lui (`origine: 'vous'`, jamais l'IA seule). Sur une option à article, elle pose la
 * `veille` existante de l'article ; sans article : « veille demandée, sans lien à relever ». La relève réelle n'existe pas (`releveLe` jamais écrit).
 */
export function poserVeille(etat: Etat, args: { carnetId: string; faconId: string; active: boolean; le: string; origine?: Origine }): Resultat {
  const origine = args.origine ?? 'vous';
  if (args.active && origine !== 'vous') return refus('Une veille ne s’allume que par un geste de votre part.');
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  const f = c?.carnet.facons.find(x => x.id === args.faconId);
  if (!c || !f) return refus('Option introuvable.');
  const s = assurerSuivi(c);
  const articles = c.carnet.articles.filter(a => a.faconId === f.id);
  const change = appliquerOption(c, s, f, args.active ? 'veille' : 'piste', { le: args.le, origine, raison: args.active && !articles.length ? 'sans lien à relever' : undefined });
  let touche = false;
  for (const a of articles) {
    if (args.active && !a.veille?.active) { a.veille = { active: true, depuis: args.le }; touche = true; }
    if (!args.active && a.veille) { delete a.veille; touche = true; }
  }
  if (!change && !touche) return b.resultat(args.active ? 'Veille déjà demandée' : 'Veille déjà arrêtée');
  return ecrire(b, c, args.active ? (articles.length ? '✓ Veille demandée' : '✓ Veille demandée, sans lien à relever') : '✓ Veille arrêtée');
}

/** « Toujours le bon choix ? » : sa réponse, datée. */
export function repondreRelu(etat: Etat, args: { carnetId: string; reponse: 'oui' | 'pas-sur'; le: string }): Resultat {
  if (args.reponse !== 'oui' && args.reponse !== 'pas-sur') return refus('Réponse inconnue.');
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  const s = assurerSuivi(c);
  s.relu = { le: args.le, reponse: args.reponse };
  ajouterEvenement(s, { id: idEvenement(), le: args.le, sorte: 'relu', vers: args.reponse, origine: 'vous' });
  return ecrire(b, c, args.reponse === 'oui' ? '✓ Toujours le bon choix' : '✓ Pas sûr, noté');
}

/** L'avant et l'après d'un résolu, choisis dans les photos du carnet ; `null` retire le choix (retour à la déduction). */
export function poserAvantApres(etat: Etat, args: { carnetId: string; avantPhotoId?: string | null; apresPhotoId?: string | null }): Resultat {
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  for (const id of [args.avantPhotoId, args.apresPhotoId]) if (id && !c.carnet.photos.some(p => p.id === id)) return refus('Photo introuvable.');
  const s = assurerSuivi(c);
  const aa = { ...(s.avantApres ?? {}) };
  if (args.avantPhotoId === null) delete aa.avantPhotoId; else if (args.avantPhotoId) aa.avantPhotoId = args.avantPhotoId;
  if (args.apresPhotoId === null) delete aa.apresPhotoId; else if (args.apresPhotoId) aa.apresPhotoId = args.apresPhotoId;
  if (Object.keys(aa).length) s.avantApres = aa; else delete s.avantApres;
  return ecrire(b, c, '✓ Avant et après posés');
}

/** Le genre (menu ⋯, ou l'IA au rangement) ; celui qu'il a posé ne se laisse pas écraser par l'IA. Même valeur : sans effet. */
export function poserGenre(etat: Etat, args: { carnetId: string; genre: GenreCarnet; origine: OrigineVousIA }): Resultat {
  if (!GENRES_CARNET.includes(args.genre)) return refus('Genre inconnu.');
  const b = new Brouillon(etat);
  const c = b.carnet(args.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  const pose = c.carnet.genre;
  if (pose?.origine === 'vous' && args.origine === 'ia') return refus('Genre posé par vous : l’IA n’y touche pas.');
  if (pose?.valeur === args.genre && pose.origine === args.origine) return b.resultat('Genre inchangé');
  c.carnet.genre = { valeur: args.genre, origine: args.origine };
  return ecrire(b, c, '✓ Genre posé');
}

/* ---------- étiquettes d'un message ---------- */

/** Pose un jeton sous une bulle (par l'IA, le repli local ou lui) ; un jeton identique n'est pas redoublé. Annulable (inverse = message d'avant). */
export function etiqueter(etat: Etat, args: { messageId: string; etiquette: Etiquette }): Resultat {
  const b = new Brouillon(etat);
  const m = b.messages().find(x => x.id === args.messageId);
  if (!m) return refus('Message introuvable.');
  const e = args.etiquette;
  const c = b.carnet(e.carnetId);
  if (!c) return refus('Ce carnet n’existe plus.');
  if (e.optionId && !c.carnet.facons.some(f => f.id === e.optionId)) return refus('Option introuvable.');
  const deja = m.carnetMessage.etiquettes ?? [];
  const cle = (x: Etiquette) => JSON.stringify([x.carnetId, x.sorte, x.texte ?? null, x.montantCentimes ?? null, x.optionId ?? null]);
  if (deja.some(x => cle(x) === cle(e))) return b.resultat('Déjà étiqueté');
  b.ecrire({ ...m, carnetMessage: { ...m.carnetMessage, etiquettes: [...deja, sansIndefinis({ ...e })] } });
  return b.resultat('✓ Étiqueté');
}

/** Retire un jeton (le Non d'un toucher). */
export function retirerEtiquette(etat: Etat, args: { messageId: string; index: number }): Resultat {
  const b = new Brouillon(etat);
  const m = b.messages().find(x => x.id === args.messageId);
  const l = m?.carnetMessage.etiquettes;
  if (!m || !l || !l[args.index]) return refus('Étiquette introuvable.');
  const reste = l.filter((_, i) => i !== args.index);
  b.ecrire({ ...m, carnetMessage: sansIndefinis({ ...m.carnetMessage, etiquettes: reste.length ? reste : undefined }) });
  return b.resultat('Étiquette retirée');
}
