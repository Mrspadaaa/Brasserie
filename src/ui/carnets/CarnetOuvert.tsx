/**
 * Le carnet ouvert (R03, figés p2:h05-3 et p2:i06-4, **sans** la rangée « Ajouter à … : quoi ? », D-114 ; R12 base g5:v03-6 :
 * ✎ près du titre, ··· par note, un seul champ en bas).
 * De haut en bas : « ‹ Carnets », l'état (« Idée · 15 nov. », « À comparer », « Choisi le … »), ···, le titre et son ✎ (G28),
 * sa phrase citée (R25), les pastilles « lié à » (R33, R47), le bandeau et le cadre du geste en cours (slots), Ce qui compte (G5).
 * Tout juste créé (R11, g5:v04-4) : en tête « ●○○○ idée », l'encadré « Idée · 17 nov. / Ensuite : l'IA cherche les façons », et
 * chaque rubrique dit qui agit, Photos comprise (« Photos · aucune », seulement dans cet état).
 * Façons et articles (P5, P38 ; figé h05-3) : dès le 2e article, le tableau du carnet range les articles **dans leur façon** : chaque
 * façon a son nom, ses prix et sa pastille sur le critère (« capte la buée » / « ne capte pas la buée ») ; chaque ligne a son rang, sa
 * vignette (photo ou picto), son nom sur 2 lignes au plus, son origine et son délai (« CH · sur commande »), l'œil de la veille ; les
 * colonnes sont la valeur qui classe et le prix, en-têtes courts avec l'unité. Un lien dont la page n'est pas lue n'est jamais classé :
 * ligne « ? Lien sans aperçu · à relire · Ouvrir ↗ » sous le tableau (P6, `Tableau.aRelire`). Puis la conclusion « Le critère sépare
 * les deux façons : … · Retenir la hotte », de l'IA si elle l'a dite (`separe`), sinon calculée sur place avec `passe()` (picto local).
 * Toucher « Articles » ouvre la feuille des cartes (P12, figé h03-5) : photo, valeur du critère en gros, réglette, « Veiller ».
 * Avant le 2e article : les façons en cartes et l'article en carte. Notes : chaque note porte son genre et son picto (G22).
 */
import React, { useEffect, useState } from 'react';
import { CalendarCheck, ChevronDown, ChevronLeft, ChevronRight, Ellipsis, ExternalLink, Eye, FileText, GitFork, Image as ImageIcon, Lightbulb, Link2, ListTodo, Pencil, ShoppingBasket, Tag, Target, X } from 'lucide-react';
import { Bandeau } from './Bandeau';
import { CarteArticle, CarteClassee, estExemple, nombreValeur } from './CarteArticle';
import { colonnesVue, meilleursDe, sansApercu, texteCellule, type ColonneVue, type TableauV } from './Comparer';
import { avecArticle, domaineEtChemin, libelleEcarte, passe } from '../../domain/carnets/comparer';
import { uniquesParTexte } from '../../domain/carnets/doublons';
import { dateCourte, GENRE_LIBELLE, montant, Provenance, STATUT_LIBELLE, type AidesV, type ArticleV, type CarnetV, type ContenuCarnetV, type CritereV, type FaconV, type GenreNote, type NoteV } from './EtatIA';
import { LigneRangee } from './LigneRangee';
import { phraseEnTitre } from './ListeCarnets';
import { Photos } from './Photos';
import { VignetteObjet } from './pictos';

/** Lien « lié à » (R47), calculé par `liensDe` (lot A) : jamais de montant. */
export interface LienV { sorte: 'a-venir' | 'realise'; id: string; libelle: string; etat: 'present' | 'supprime'; le?: string }

export interface RangeeV {
  cible: 'critere' | 'facon' | 'article' | 'note';
  id: string;
  phrase?: string;
  rangeSur?: string;
  luSurPage?: string[];
  verdict?: string;
  onAnnuler: () => void;
  onVotreTexte?: () => void;
  onDeplacer?: () => void;
  onChangerEnNote?: () => void;
}

export interface CarnetOuvertProps {
  carnet: CarnetV;
  aides: AidesV;
  liens: LienV[];
  /** Le tableau de `comparer.ts` : `null` à 0 ou 1 article (R26). */
  tableau: TableauV | null;
  bandeau?: React.ReactNode;
  cadre?: React.ReactNode;
  rangee?: RangeeV | null;
  /** G6 et G5 : le carnet vient d'être créé. */
  vientDEtreCree?: boolean;
  /** G33 : notes que `notesEnDouble` (lot A) marque, si `aides.doublon`. */
  doublons?: string[];
  /** G32 : la note supprimée, à sa place. */
  noteSupprimee?: { id: string; apres?: string; onAnnuler: () => void } | null;
  /** La feuille ··· ouverte sous sa note (FeuilleNote). */
  feuille?: { noteId: string; contenu: React.ReactNode } | null;
  /** « Le critère sépare les deux façons : … · Retenir … » : texte de l'IA, cité s'il existe ; sinon calculé sur place. */
  separe?: { texte: string; retenir: string; onRetenir: () => void } | null;
  /** Retenir la façon que le critère sépare (conclusion calculée). Sans lui, « Retenir … » ouvre Comparer, où l'on choisit. */
  onRetenirFacon?: (faconId: string) => void;
  /** Page grisée pendant la confirmation de suppression (G34). */
  grise?: boolean;
  onRetour: () => void;
  onRenommer: () => void;
  onSupprimer: () => void;
  onNote: (noteId: string) => void;
  onOuvrirArticle: (articleId: string) => void;
  onComparer: () => void;
  onVeille?: (articleId: string, active: boolean) => void;
  onVoirChoix?: () => void;
  onEnvoyerAVenir?: () => void;
  onOuvrirLien?: (lien: LienV) => void;
}

function etiquetteStatut(c: CarnetV): string {
  if (c.status === 'idea') { const d = dateCourte(c.carnet.creeLe); return d ? `Idée · ${d}` : 'Idée'; }
  if (c.status === 'validated') { const d = dateCourte(c.carnet.choix?.le); return d ? `Choisi le ${d}` : 'Choisi'; }
  return STATUT_LIBELLE.research;
}

function etendue(centimes: number[]): string | null {
  if (!centimes.length) return null;
  const min = montant(Math.min(...centimes)), max = montant(Math.max(...centimes));
  return min === max ? `${min} CHF` : `${min} à ${max} CHF`;
}

/* ---------- la conclusion sur place (P5, h05-3) ---------- */

/** « la hotte », « l'extracteur », « le frigo » : le premier mot du nom d'une façon, avec son article. */
export function nomCourt(nom: string): { texte: string; feminin: boolean } {
  const mot = nom.trim().split(/\s+/)[0] ?? nom;
  const bas = mot.charAt(0).toLowerCase() + mot.slice(1);
  if (/^h/i.test(mot)) { const f = /e$/i.test(mot); return { texte: `${f ? 'la' : 'le'} ${bas}`, feminin: f }; }
  const t = avecArticle(bas);
  const feminin = t.startsWith('la ') || (t.startsWith("l'") && /(tion|sion|ure|ence|ance|ite|ette|elle|ise|ade|ude|iere|ine|ille)$/i.test(mot));
  return { texte: t, feminin };
}

/** « tient 80 °C » → « ne tient pas 80 °C » ; « aspire … » → « n'aspire pas … » (un critère oui-non se dit par un verbe). */
export function nier(texte: string): string {
  const t = texte.trim();
  const m = /^(\S+)(\s.*)?$/.exec(t);
  if (!m) return `pas : ${t}`;
  return `${/^[aeiouyéèêàâîôû]/i.test(m[1]) ? "n'" : 'ne '}${m[1]} pas${m[2] ?? ''}`;
}

export interface Separation { critere: CritereV; retenue: FaconV; texte: string; retenir: string; verdicts: Record<string, boolean | null> }

/** Le verdict d'une façon sur un critère : vrai si l'un de ses articles lus le passe ; faux si tous ceux qu'on connaît échouent. */
function verdictFacon(k: ContenuCarnetV, f: FaconV, cr: CritereV): boolean | null {
  const v = k.articles.filter(a => a.faconId === f.id && a.lecture === 'lue').map(a => passe(a as never, cr as never));
  if (v.some(x => x === true)) return true;
  return v.some(x => x === false) ? false : null;
}

/**
 * Le premier critère (dans leur ordre) qui sépare les façons en lice : une seule le passe, toutes les autres échouent. `null` sinon.
 * Calcul local, sans IA : chaque mot vient du carnet (noms, critère).
 */
export function separationDe(k: ContenuCarnetV): Separation | null {
  const facons = k.facons.filter(f => f.etat !== 'ecartee');
  if (facons.length < 2) return null;
  for (const cr of k.criteres) {
    if (!cr.caracteristique) continue;
    const verdicts = Object.fromEntries(facons.map(f => [f.id, verdictFacon(k, f, cr)]));
    const vals = Object.values(verdicts);
    if (vals.filter(x => x === true).length !== 1 || vals.some(x => x === null)) continue;
    const retenue = facons.find(f => verdicts[f.id] === true)!;
    const court = nomCourt(retenue.nom);
    const positif = cr.caracteristique.sens === 'oui-non' ? cr.texte : `passe : ${cr.texte}`;
    const texte = `Le critère sépare ${facons.length === 2 ? 'les deux façons' : 'les façons'} : ${court.feminin ? 'seule' : 'seul'} ${court.texte} ${positif}.`;
    return { critere: cr, retenue, texte, retenir: court.texte, verdicts };
  }
  return null;
}

/** La pastille d'une façon sur le critère qui sépare (ou le 1er critère oui-non connu) : « capte la buée » / « ne capte pas la buée ». */
function pastilleFacon(k: ContenuCarnetV, f: FaconV, sep: Separation | null): { texte: string; passe: boolean | null } | null {
  if (f.etat === 'ecartee') return f.raison ? { texte: f.raison, passe: false } : null;
  const cr = sep?.critere ?? k.criteres.find(c => c.caracteristique?.sens === 'oui-non');
  const v = cr ? (sep ? sep.verdicts[f.id] ?? null : verdictFacon(k, f, cr)) : null;
  if (cr && v !== null) {
    const oui = cr.caracteristique?.sens === 'oui-non';
    return { texte: v ? cr.texte : oui ? nier(cr.texte) : 'hors critère', passe: v };
  }
  return f.raison ? { texte: f.raison, passe: f.etat === 'retenue' ? true : null } : null;
}

/* ---------- le carnet ---------- */

export function CarnetOuvert(p: CarnetOuvertProps) {
  const c = p.carnet, k = c.carnet;
  const [menu, setMenu] = useState(false);
  const [cartes, setCartes] = useState(false);
  const [apercu, setApercu] = useState<string | null>(null);
  const r = p.rangee;
  const critere = k.criteres.find(x => x.caracteristique) ?? k.criteres[0];
  const lus = k.articles.filter(a => a.lecture === 'lue').length;
  const enDouble = new Set(p.aides.doublon ? p.doublons ?? [] : []);
  const question = k.facons.length === 2 ? `${k.facons[0].nom} ou ${k.facons[1].nom} ?` : null;
  const neuf = !!p.vientDEtreCree && c.status === 'idea';

  /* P6 : les liens non lus, jamais classés ; le contrat de comparer.ts (`aRelire`), sinon lus sur le carnet */
  const aRelire: ArticleV[] = p.tableau
    ? ((p.tableau as { aRelire?: ArticleV[] }).aRelire ?? k.articles.filter(a => sansApercu(a) && !a.prixCentimes && !Object.keys(a.valeurs).length))
    : [];
  const sansApercuN = k.articles.filter(a => sansApercu(a)).length;

  const encadre = (cible: RangeeV['cible'], id: string, noeud: React.ReactNode) =>
    r && r.cible === cible && r.id === id
      ? <LigneRangee key={id} phrase={r.phrase} rangeSur={r.rangeSur} onAnnuler={r.onAnnuler} onVotreTexte={r.onVotreTexte} onDeplacer={r.onDeplacer} onChangerEnNote={r.onChangerEnNote}>{noeud}</LigneRangee>
      : <React.Fragment key={id}>{noeud}</React.Fragment>;

  /* P11 : un critère par texte normalisé (les doublons d'avant la fusion ne s'affichent pas deux fois). « Ce qui compte » et sa
     provenance s'écrivent une fois : sur la ligne même quand il n'y a qu'un critère (figé i06-4), en tête de l'encart sinon ; une
     ligne d'une autre provenance que la tête le dit en court, à sa fin. */
  const criteres = uniquesParTexte(k.criteres);
  const provenance = (cr: CritereV) => (cr.origine === 'ia' ? "proposé par l'IA" : 'tiré de votre phrase');
  const deLIA = criteres.filter(u => u.el.origine === 'ia').length;
  const provTete = deLIA * 2 > criteres.length ? "proposé par l'IA" : 'tiré de votre phrase';
  const encadreCritere = (ids: string[], noeud: React.ReactNode) =>
    r && r.cible === 'critere' && ids.includes(r.id) ? encadre('critere', r.id, noeud) : <React.Fragment key={ids[0]}>{noeud}</React.Fragment>;
  const ligneCritere = (cr: CritereV) => (
    <p className="cn-critere">
      <Target size={18} aria-hidden className="cn-vert" />
      <span>Ce qui compte, {provenance(cr)} : <b>{cr.texte}</b>{cr.raison ? <span className="cn-mut"> · {cr.raison}</span> : null}</span>
    </p>
  );
  const ligneCritereCourte = (cr: CritereV) => (
    <p className="cn-critere cn-critere-court">
      <b>{cr.texte}</b>
      {provenance(cr) !== provTete && <span className="cn-mut"> · {provenance(cr)}</span>}
      {cr.raison ? <span className="cn-mut"> · {cr.raison}</span> : null}
    </p>
  );

  const articleRange = r?.cible === 'article' ? k.articles.find(a => a.id === r.id) : undefined;
  const faconRange = articleRange?.faconId ? k.facons.find(f => f.id === articleRange.faconId) : undefined;

  const sep = p.tableau ? separationDe(k) : null;
  const conclusion = p.separe
    ? { texte: p.separe.texte, retenir: p.separe.retenir, onRetenir: p.separe.onRetenir, ia: true }
    : sep ? { texte: sep.texte, retenir: sep.retenir, onRetenir: () => (p.onRetenirFacon ? p.onRetenirFacon(sep.retenue.id) : p.onComparer()), ia: false } : null;

  return (
    <article className={`cn-page cn-ouvert${p.grise ? ' cn-grise' : ''}`} aria-label={c.title}>
      <div className="cn-tete">
        <button type="button" className="cn-retour" onClick={p.onRetour}><ChevronLeft size={20} aria-hidden /> Carnets</button>
        <span className="cn-sp" />
        {neuf
          ? <span className="cn-etapes" aria-label="idée"><span className="cn-etape-on" /><span /><span /><span /><span className="cn-lien-texte">idée</span></span>
          : <span className={`cn-pastille cn-statut-${c.status}`}>{etiquetteStatut(c)}</span>}
        <button type="button" className="cn-ico" aria-label="Plus" aria-expanded={menu} onClick={() => setMenu(m => !m)}><Ellipsis size={22} aria-hidden /></button>
      </div>
      {menu && (
        <div className="cn-feuille cn-menu" role="menu">
          <button type="button" role="menuitem" className="cn-feuille-item" onClick={() => { setMenu(false); p.onRenommer(); }}><Pencil size={18} aria-hidden /> Renommer</button>
          <button type="button" role="menuitem" className="cn-feuille-item cn-rouge" onClick={() => { setMenu(false); p.onSupprimer(); }}>Supprimer l'idée</button>
        </div>
      )}
      <div className="cn-titre-ligne">
        <h2 className="cn-titre">{c.title}</h2>
        <button type="button" className="cn-ico" aria-label="Renommer" onClick={p.onRenommer}><Pencil size={20} aria-hidden /></button>
      </div>
      {/* P27 (g5:v04-4) : l'encadré d'état du carnet tout juste créé, en entier */}
      {neuf && (
        <div className="cn-encadre-idee">
          <b className="cn-att">{etiquetteStatut(c)}</b>
          <b>Ensuite : {k.facons.length === 0 ? "l'IA cherche les façons" : k.articles.length === 0 ? 'collez un lien' : "l'IA compare"}</b>
        </div>
      )}
      {/* L4-5 : titre = phrase (normalisé) → « votre phrase en titre », une fois, jamais la phrase répétée ; tout juste créé, le
          bandeau « Carnet créé » le dit déjà (g5:v04-4). Sinon la phrase citée (R25). */}
      {k.phrase && (phraseEnTitre(c.title, k.phrase)
        ? !p.vientDEtreCree && <p className="cn-cite">votre phrase en titre</p>
        : <p className="cn-cite">« {k.phrase} »</p>)}

      {p.liens.length > 0 && (
        <div className="cn-liens">
          {p.liens.slice(0, 3).map(l => (
            <button key={`${l.sorte}:${l.id}`} type="button" className="cn-pastille cn-pastille-lien" aria-expanded={apercu === l.id} onClick={() => setApercu(a => (a === l.id ? null : l.id))}>
              {l.sorte === 'a-venir' ? 'À venir' : 'Réalisés'} · {l.etat === 'supprime' ? 'supprimé' : l.libelle}
            </button>
          ))}
          {p.liens.length > 3 && <span className="cn-pastille">+{p.liens.length - 3}</span>}
          {apercu && (() => {
            const l = p.liens.find(x => x.id === apercu);
            if (!l) return null;
            return (
              <div className="cn-apercu" role="region" aria-label="Aperçu du lien">
                <b>{l.libelle}</b>
                <span className="cn-mut">{l.etat === 'supprime' ? 'supprimé côté À venir' : l.sorte === 'a-venir' ? 'dans À venir' : 'réalisé'}{dateCourte(l.le) ? ` · depuis le ${dateCourte(l.le)}` : ''}</span>
                {l.etat === 'present' && p.onOuvrirLien && <button type="button" className="cn-second" onClick={() => p.onOuvrirLien!(l)}>Ouvrir dans {l.sorte === 'a-venir' ? 'À venir' : 'Réalisés'}</button>}
              </div>
            );
          })()}
        </div>
      )}

      {p.bandeau}
      {p.cadre}

      {c.status === 'validated' && k.choix && (
        <div className="cn-choisi-resume">
          <button type="button" className="cn-carte cn-choisi-ligne" onClick={p.onVoirChoix}>
            {(() => { const ch = k.articles.find(a => a.id === k.choix!.articleId); return <VignetteObjet photo={ch?.photo} mots={[ch?.nom, c.title]} classe="cn-vignette-petite" taille={22} />; })()}
            <span className="cn-sp"><b>Choisi : {k.articles.find(a => a.id === k.choix!.articleId)?.nom ?? 'article'}</b><span className="cn-mut">{k.choix.pourquoi}</span></span>
            <span className="cn-lien">Pourquoi <ChevronRight size={16} aria-hidden /></span>
          </button>
          {k.sortie
            ? <p className="cn-avenir-ligne"><CalendarCheck size={18} aria-hidden /> Dans À venir{dateCourte(k.sortie.le) ? ` depuis le ${dateCourte(k.sortie.le)}` : ''}</p>
            : p.onEnvoyerAVenir && <button type="button" className="cn-action" onClick={p.onEnvoyerAVenir}><CalendarCheck size={18} aria-hidden /> Envoyer dans À venir</button>}
        </div>
      )}

      <section className={`cn-rubrique${neuf ? ' cn-rubrique-ligne' : ''}`} aria-label="Ce qui compte">
        {k.criteres.length === 0
          ? <p className="cn-rubrique-tete"><Target size={18} aria-hidden /> <b>Ce qui compte</b> <span className="cn-mut">· rien encore : l'IA le proposera</span></p>
          : criteres.length === 1
            ? <div className="cn-encart-critere">{encadreCritere(criteres[0].ids, ligneCritere(criteres[0].el))}</div>
            : (
              <div className="cn-encart-critere">
                <p className="cn-critere"><Target size={18} aria-hidden className="cn-vert" /><span>Ce qui compte, {provTete} :</span></p>
                <div className="cn-criteres">{criteres.map(u => encadreCritere(u.ids, ligneCritereCourte(u.el)))}</div>
              </div>
            )}
      </section>

      {/* Sans tableau : les façons en cartes (i06-4). Avec tableau : elles sont dans le tableau, avec leur pastille (h05-3). */}
      {(!p.tableau || k.facons.length === 0) && (
        <section className={`cn-rubrique${neuf ? ' cn-rubrique-ligne' : ''}`} aria-label="Façons">
          {k.facons.length === 0 ? (
            <p className="cn-rubrique-tete"><GitFork size={18} aria-hidden /> <b>Façons</b> <span className="cn-mut">· aucune : l'IA les cherche</span></p>
          ) : (
            <>
              <h3 className="cn-rubrique-tete">{question ?? <><GitFork size={18} aria-hidden /> Façons</>} <span className="cn-mut cn-nowrap">{k.facons.length} façons</span></h3>
              <div className="cn-facons">
                {k.facons.map(f => {
                  const sesArticles = k.articles.filter(a => a.faconId === f.id);
                  const prix = etendue(sesArticles.map(a => a.prixCentimes).filter((x): x is number => typeof x === 'number'));
                  const carte = (
                    <div className={`cn-facon cn-facon-${f.etat}`}>
                      <b>{f.nom}</b>
                      {prix ? <span className="cn-mono">{prix}</span> : <span className="cn-mut">aucun article encore</span>}
                      {f.raison && f.etat === 'ouverte' && <span className="cn-mut">{f.raison}</span>}
                      {f.etat === 'retenue' && f.raison && <span className="cn-pastille cn-pastille-plein">{f.raison}</span>}
                      {f.etat === 'ecartee' && f.raison && <span className="cn-pastille">{f.raison}</span>}
                      {f.etat === 'ouverte' && !sesArticles.length && <span className="cn-pastille">à chercher</span>}
                    </div>
                  );
                  return encadre('facon', f.id, carte);
                })}
              </div>
            </>
          )}
        </section>
      )}

      <section className={`cn-rubrique${neuf ? ' cn-rubrique-ligne' : ''}`} aria-label="Articles">
        {k.articles.length === 0 ? (
          <p className="cn-rubrique-tete"><Tag size={18} aria-hidden /> <b>Articles</b> <span className="cn-mut">· aucun : collez un lien</span></p>
        ) : (
          <>
            {/* P10 : le compte garde sa largeur ; faute de place (390), « Comparer côte à côte › » passe à la ligne, calé à droite.
                P12 (h03-5) : toucher « Articles » ouvre la feuille des cartes. */}
            <div className="cn-rubrique-tete cn-tete-articles">
              {p.tableau ? (
                <button type="button" className="cn-tete-bouton" aria-haspopup="dialog" aria-expanded={cartes} onClick={() => setCartes(true)}>
                  <Tag size={18} aria-hidden /><b>Articles</b>
                  <span className="cn-mut cn-nowrap cn-compte">{lus} lu{lus > 1 ? 's' : ''}{sansApercuN ? `, ${sansApercuN} sans aperçu` : ''}</span>
                  <ChevronDown size={16} aria-hidden className="cn-mut" />
                </button>
              ) : (
                <><Tag size={18} aria-hidden /><b>Articles</b><span className="cn-mut cn-nowrap cn-compte">{lus} lu{lus > 1 ? 's' : ''}{sansApercuN ? `, ${sansApercuN} sans aperçu` : ''}</span></>
              )}
              {p.tableau && <button type="button" className="cn-lien cn-comparer-lien" onClick={p.onComparer}>Comparer côte à côte <ChevronRight size={16} aria-hidden /></button>}
            </div>
            {articleRange && r && (
              <LigneRangee sorte="article" faconNom={faconRange?.nom} phrase={r.phrase} onAnnuler={r.onAnnuler} onDeplacer={r.onDeplacer}>
                <CarteArticle article={articleRange} critere={critere} faconNom={faconRange?.nom} carnetTitre={c.title} variante="complete" luSurPage={r.luSurPage} verdict={r.verdict} onVeille={v => p.onVeille?.(articleRange.id, v)} />
              </LigneRangee>
            )}
            {p.tableau ? (
              <>
                <TableauCarnet carnet={k} titre={c.title} tableau={p.tableau} aRelire={aRelire} sep={sep} sauf={articleRange?.id} onOuvrir={p.onOuvrirArticle} />
                {conclusion && (
                  <div className="cn-encart cn-separe">
                    <span className="cn-sp"><Provenance origine={conclusion.ia ? 'ia' : 'locale'} /> {conclusion.texte}</span>
                    <button type="button" className="cn-action cn-action-vert" onClick={conclusion.onRetenir}>Retenir {conclusion.retenir}</button>
                  </div>
                )}
              </>
            ) : (
              <div className="cn-cartes">
                {k.articles.filter(a => a.id !== articleRange?.id).map(a => (
                  <CarteArticle key={a.id} article={a} critere={critere} carnetTitre={c.title} faconNom={k.facons.find(f => f.id === a.faconId)?.nom} onOuvrir={() => p.onOuvrirArticle(a.id)} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {neuf && k.photos.length === 0
        ? <section className="cn-rubrique cn-rubrique-ligne" aria-label="Photos"><p className="cn-rubrique-tete"><ImageIcon size={18} aria-hidden /> <b>Photos</b> <span className="cn-mut">· aucune</span></p></section>
        : <Photos photos={k.photos} />}

      <section className={`cn-rubrique${neuf ? ' cn-rubrique-ligne' : ''}`} aria-label="Notes">
        {k.notes.length === 0 && !p.noteSupprimee ? (
          <p className="cn-rubrique-tete"><FileText size={18} aria-hidden /> <b>Notes</b> <span className="cn-mut">· aucune</span></p>
        ) : (
          <>
            <h3 className="cn-rubrique-tete"><FileText size={18} aria-hidden /> Notes <span className="cn-mut cn-mono">{k.notes.length}</span></h3>
            <div className="cn-notes">
              {k.notes.map((n, i) => (
                <React.Fragment key={n.id}>
                  {p.noteSupprimee && i === 0 && !p.noteSupprimee.apres && <Bandeau enLigne bandeau={{ sorte: 'note-supprimee' }} onAnnuler={p.noteSupprimee.onAnnuler} />}
                  {encadre('note', n.id, <LigneNote note={n} doublon={enDouble.has(n.id)} onNote={p.onNote} />)}
                  {p.feuille?.noteId === n.id && p.feuille.contenu}
                  {p.noteSupprimee?.apres === n.id && <Bandeau enLigne bandeau={{ sorte: 'note-supprimee' }} onAnnuler={p.noteSupprimee.onAnnuler} />}
                </React.Fragment>
              ))}
              {p.noteSupprimee && k.notes.length === 0 && <Bandeau enLigne bandeau={{ sorte: 'note-supprimee' }} onAnnuler={p.noteSupprimee.onAnnuler} />}
            </div>
          </>
        )}
      </section>

      {p.vientDEtreCree && <p className="cn-mut cn-g6">Le champ en bas range tout ici : une phrase, un lien collé, une photo.</p>}

      {cartes && p.tableau && (
        <FeuilleCartes carnet={k} titre={c.title} tableau={p.tableau} aRelire={aRelire} onFermer={() => setCartes(false)}
          onOuvrir={id => { setCartes(false); p.onOuvrirArticle(id); }} onVeille={p.onVeille} />
      )}
    </article>
  );
}

/* ---------- notes : chaque note porte son genre (G22, P11) ---------- */

const PICTO_GENRE: Record<GenreNote, React.ReactNode> = {
  'a-acheter': <ShoppingBasket size={18} />,
  'a-faire': <ListTodo size={18} />,
  question: <span className="cn-picto-question">?</span>,
  conseil: <Lightbulb size={18} />,
  note: <FileText size={18} />
};

function LigneNote({ note, doublon, onNote }: { note: NoteV; doublon: boolean; onNote: (id: string) => void }) {
  const d = dateCourte(note.modifieeLe ?? note.le);
  return (
    <div className="cn-note" data-genre={note.genre}>
      <span className={`cn-note-picto cn-genre-${note.genre}`} aria-hidden>{PICTO_GENRE[note.genre] ?? PICTO_GENRE.note}</span>
      <span className="cn-sp cn-note-tx">
        <span>{note.texte}</span>
        <span className="cn-mut">
          <b className={`cn-genre-mot cn-genre-${note.genre}`}>{GENRE_LIBELLE[note.genre]}</b>{note.modifieeLe ? ' · modifiée' : ''}{d ? ` · ${d}` : ''}{note.groupe ? ` · ${note.groupe.libelle}` : ''}
          {doublon && <span className="cn-doublon"> · <Provenance origine="ia" /> doublon ?</span>}
        </span>
      </span>
      <button type="button" className="cn-ico" aria-label={`Note : ${note.texte}, actions`} onClick={() => onNote(note.id)}><Ellipsis size={22} aria-hidden /></button>
    </div>
  );
}

/* ---------- le tableau du carnet (h05-3) ---------- */

type Ligne = TableauV['lignes'][number];

/** Les colonnes du tableau du carnet : la 1re valeur qui classe (plus ou moins), puis le prix ; le reste vit dans Comparer. */
function colonnesCarnet(t: TableauV): ColonneVue[] {
  const toutes = colonnesVue(t);
  const prix = toutes.find(c => c.cle === '__prix');
  const valeur = toutes.find(c => c.cle !== '__prix' && (c.sens === 'plus' || c.sens === 'moins'))
    ?? toutes.find(c => c.cle !== '__prix' && c.sens !== 'oui-non');
  return [valeur, prix].filter((x): x is ColonneVue => !!x);
}

/** En-tête court, sur une ligne : l'unité si elle existe (« m³/h », « CHF »), sinon le premier mot du nom. */
function enteteCourt(c: ColonneVue): string {
  if (c.unite) return c.unite;
  const mot = c.nom.split(/\s+/)[0] ?? c.nom;
  return mot.length > 9 ? `${mot.slice(0, 8)}.` : mot;
}

/** Les lignes classées sans les liens à relire, rangs recomptés (1, 2, 3… parmi les articles en lice). */
function lignesClassees(t: TableauV, aRelire: ArticleV[], sauf?: string): Ligne[] {
  const relire = new Set(aRelire.map(a => a.id));
  let n = 0;
  return t.lignes.filter(l => !relire.has(l.articleId)).map(l => (l.rang !== null && !l.ecarte ? { ...l, rang: ++n } : l)).filter(l => l.articleId !== sauf);
}

function TableauCarnet({ carnet: k, titre, tableau, aRelire, sep, sauf, onOuvrir }: { carnet: ContenuCarnetV; titre: string; tableau: TableauV; aRelire: ArticleV[]; sep: Separation | null; sauf?: string; onOuvrir: (id: string) => void }) {
  const cols = colonnesCarnet(tableau);
  const meilleurs = new Map(cols.map(c => [c.cle, meilleursDe(tableau, c)]));
  const lignes = lignesClassees(tableau, aRelire, sauf);
  const art = (id: string) => k.articles.find(a => a.id === id);
  const ordreFacons = [...k.facons.filter(f => f.etat !== 'ecartee'), ...k.facons.filter(f => f.etat === 'ecartee')];
  const blocs = [...ordreFacons.map(f => ({ facon: f as FaconV | null, lignes: lignes.filter(l => art(l.articleId)?.faconId === f.id) })),
    { facon: null, lignes: lignes.filter(l => { const f = art(l.articleId)?.faconId; return !f || !k.facons.some(x => x.id === f); }) }]
    .filter(b => b.lignes.length || (b.facon && b.facon.etat !== 'ecartee'));
  const gabarit = { gridTemplateColumns: `32px 34px minmax(0, 1fr) ${cols.map(() => 'var(--cn-col, 54px)').join(' ')}` } as React.CSSProperties;

  return (
    <div className="cn-tab" role="table" aria-label="Articles, rangés dans leur façon">
      {blocs.map((b, i) => {
        const prix = etendue(b.lignes.map(l => l.prixCentimes).filter((x): x is number => typeof x === 'number'));
        const pastille = b.facon ? pastilleFacon(k, b.facon, sep) : null;
        return (
          <div key={b.facon?.id ?? 'sans'} className={`cn-tab-bloc${b.facon?.etat === 'ecartee' ? ' cn-tab-ecartee' : ''}${sep?.retenue.id === b.facon?.id ? ' cn-tab-retenue' : ''}`} role="rowgroup">
            {b.facon && (
              <div className="cn-tab-facon" role="row">
                <span className="cn-sp" role="rowheader">
                  <b>{b.facon.nom}</b>
                  {prix ? <span className="cn-mono cn-mut cn-tab-etendue">{prix}</span> : <span className="cn-mut">aucun article encore</span>}
                </span>
                {pastille && <span className={`cn-pastille ${pastille.passe ? 'cn-pastille-plein' : 'cn-pastille-neutre'}`}>{pastille.texte}</span>}
              </div>
            )}
            {i === 0 && (
              <div className="cn-tab-ligne cn-tab-cols" style={gabarit} role="row">
                <span className="cn-mut cn-tab-rangart" role="columnheader">rang · article</span>
                {cols.map(c => <span key={c.cle} className="cn-mut cn-tab-num" role="columnheader" title={c.nom} aria-label={c.unite ? `${c.nom}, ${c.unite}` : c.nom}>{enteteCourt(c)}</span>)}
              </div>
            )}
            {b.lignes.map(l => {
              const a = art(l.articleId);
              const sous = l.ecarte ? libelleEcarte(l.ecarte.raison) : [a?.pays, a?.dispo].filter(Boolean).join(' · ');
              return (
                <button key={l.articleId} type="button" className={`cn-tab-ligne${l.ecarte ? ' cn-ecarte' : ''}`} style={gabarit} role="row" onClick={() => onOuvrir(l.articleId)}>
                  {l.rang && !l.ecarte ? <span className={`cn-rang${l.rang === 1 ? ' cn-rang-1' : ''}`}>{l.rang}</span> : <span className="cn-rang cn-rang-vide" aria-label="écarté">–</span>}
                  <VignetteObjet photo={a?.photo} mots={[a?.nom ?? l.nom, b.facon?.nom, titre]} classe="cn-vignette-petite" taille={22} />
                  <span className="cn-tab-nom" role="cell">
                    <span className="cn-deux-lignes">{l.nom}</span>
                    <span className="cn-mut">
                      {sous}
                      {a?.veille?.active && <span className="cn-nowrap">{sous ? ' · ' : ''}<Eye size={15} aria-hidden className="cn-inline" /> veille demandée</span>}
                      {!l.ecarte && l.moinsBienPartout && <span className="cn-att">{sous || a?.veille?.active ? ' · ' : ''}moins bien partout</span>}
                    </span>
                  </span>
                  {cols.map(c => {
                    const v = texteCellule(l, c);
                    return <span key={c.cle} role="cell" className={`cn-tab-num${meilleurs.get(c.cle)?.has(l.articleId) && !l.ecarte ? ' cn-meilleur' : ''}`}>{v ? <span className="cn-mono">{v}</span> : <span className="cn-inconnu" aria-label="inconnu">–</span>}</span>;
                  })}
                </button>
              );
            })}
          </div>
        );
      })}
      {aRelire.length > 0 && (
        <div className="cn-tab-bloc cn-tab-relire" role="rowgroup" aria-label="À relire, hors classement">
          {aRelire.map(a => <LigneARelire key={a.id} article={a} />)}
        </div>
      )}
    </div>
  );
}

/** « ? · Lien sans aperçu · ventil-express.ch · à relire · Ouvrir ↗ » : jamais classé (P6). */
function LigneARelire({ article: a }: { article: ArticleV }) {
  const ap = sansApercu(a);
  const ou = domaineEtChemin(a as never) ?? a.domaine;
  return (
    <div className="cn-tab-ligne cn-tab-relire-ligne" role="row" data-lecture={a.lecture}>
      <span className="cn-rang cn-rang-vide" aria-label="sans rang">?</span>
      <span className="cn-vignette cn-vignette-petite cn-vignette-lien" aria-hidden><Link2 size={20} /></span>
      <span className="cn-tab-nom" role="cell">
        <span>{ap?.enCours ? ap.titre : 'Lien sans aperçu'}</span>
        <span className="cn-mut">{ou ? `${ou} · ` : ''}{ap?.enCours ? 'lecture…' : 'à relire'}</span>
      </span>
      {a.url && <a className="cn-lien cn-tab-ouvrir" href={a.url} target="_blank" rel="noreferrer noopener">Ouvrir <ExternalLink size={16} aria-hidden /></a>}
    </div>
  );
}

/* ---------- la feuille des cartes (R04, h03-5) ---------- */

function FeuilleCartes({ carnet: k, titre, tableau, aRelire, onFermer, onOuvrir, onVeille }: { carnet: ContenuCarnetV; titre: string; tableau: TableauV; aRelire: ArticleV[]; onFermer: () => void; onOuvrir: (id: string) => void; onVeille?: (id: string, active: boolean) => void }) {
  useEffect(() => {
    const touche = (e: KeyboardEvent) => { if (e.key === 'Escape') onFermer(); };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [onFermer]);
  const lignes = lignesClassees(tableau, aRelire);
  const col = colonnesCarnet(tableau).find(c => c.cle !== '__prix');
  const carac = col ? { nom: col.nom, ...(col.unite ? { unite: col.unite } : {}), sens: col.sens } : undefined;
  const art = (id: string) => k.articles.find(a => a.id === id);
  const connues = col ? lignes.filter(l => !l.ecarte).map(l => nombreValeur(art(l.articleId)?.valeurs[col.nom])).filter((x): x is number => x !== null) : [];
  const bornes = connues.length > 1 ? { min: Math.min(...connues), max: Math.max(...connues) } : null;
  const critere = col ? k.criteres.find(cr => cr.caracteristique?.nom === col.nom) : undefined;
  return (
    <div className="cn-voile" onClick={onFermer}>
      <section className="cn-feuille-cartes" role="dialog" aria-modal="true" aria-label={`Articles · ${k.articles.length}`} onClick={e => e.stopPropagation()}>
        <span className="cn-poignee" aria-hidden />
        <div className="cn-feuille-cartes-tete">
          <h3 className="cn-sp"><b>Articles · {k.articles.length}</b> {k.facons.length > 0 && <span className="cn-mut">{k.facons.filter(f => f.etat !== 'ecartee').length} façon{k.facons.filter(f => f.etat !== 'ecartee').length > 1 ? 's' : ''}</span>}</h3>
          <button type="button" className="cn-lien cn-fermer" onClick={onFermer}><X size={18} aria-hidden /> Fermer</button>
        </div>
        {carac && <p className="cn-mut">Classés par ce qui compte : <b className="cn-encre">{critere?.texte ?? carac.nom}</b></p>}
        <div className="cn-classees">
          {lignes.map(l => {
            const a = art(l.articleId);
            if (!a) return null;
            return <CarteClassee key={a.id} article={a} rang={l.ecarte ? null : l.rang} carac={carac} bornes={bornes} faconNom={k.facons.find(f => f.id === a.faconId)?.nom} carnetTitre={titre}
              {...(l.ecarte ? { ecarte: l.ecarte } : {})} onOuvrir={() => onOuvrir(a.id)} onVeille={v => onVeille?.(a.id, v)} />;
          })}
          {aRelire.map(a => <div key={a.id} className="cn-classee cn-classee-relire"><LigneARelire article={a} /></div>)}
        </div>
        {k.articles.some(estExemple) && <p className="cn-mut">Vendeurs, prix et valeurs : <Provenance origine="exemple" /></p>}
      </section>
    </div>
  );
}
