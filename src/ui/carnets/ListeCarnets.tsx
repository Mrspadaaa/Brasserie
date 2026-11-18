/**
 * La liste des carnets (R01, figés p2:g05-1 et p2:i06-1 ; D-25 : une vue sans détails d'abord) et la liste vide (R02, figé p2:i02-2 ;
 * geste 1 « Créer · avant » : G1 puces exemples touchables, G2 « Une note en vrac marche aussi. »).
 * Groupes par état : À comparer, Idée, Choisi, En veille, pastilles vertes (g05-1). Une carte : photo ou picto de l'objet (pictos.tsx),
 * titre, ce qui vient ensuite, « 3 façons · 6 articles · 1 en veille » sur une ligne (rien de compté à 0), le prix : « dès » = le plus
 * bas des articles encore en lice (ni façon écartée, ni écarté au choix), toujours avec sa devise. Choisi : la phrase du pourquoi, la
 * date et le fournisseur ; envoyé : « Dans À venir depuis le 16 nov. · Voir » (R32). En veille : les articles dont il a demandé la
 * veille ; tant que la relève n'existe pas (R31), « demandée · pas encore relevée », aucune baisse ni prix barré.
 * Gestes : R11 le carnet créé paraît en tête ; G13 la ligne du carnet visé s'éclaire quand il écrit depuis la liste ; G37
 * « Carnet supprimé · <titre> · Annuler » à la place du carnet ; R19 les lignes ajoutées « +2 · question, à acheter », d'après le
 * genre des notes rangées (`ajouts`, ou `messageRecent` : les notes nées de ce message).
 * Le segment « À venir · Carnets · Réalisés » et le + volant appartiennent au conteneur (lot D) ; le champ est ChampCarnet.
 */
import React from 'react';
import { CalendarCheck, ChevronRight, Eye, Link2 } from 'lucide-react';
import { Bandeau } from './Bandeau';
import { normaliser } from '../../domain/carnets/analyseLocale';
import { tableau as calculerTableau } from '../../domain/carnets/comparer';
import { titreDePhrase } from '../../domain/carnets/modele';
import { dateCourte, GENRE_LIBELLE, montant, pluriel, Provenance, STATUT_LIBELLE, type ArticleV, type CarnetV, type GenreNote, type StatutCarnet } from './EtatIA';
import { VignetteObjet } from './pictos';

export interface EclaireV { carnetId: string; quoi: string; tireDe: string; onDeplacer: () => void; onAnnuler: () => void }

export interface ListeCarnetsProps {
  carnets: CarnetV[];
  /** R11 : le carnet tout juste créé, montré en tête. */
  enTete?: string;
  /** G13 : écrit depuis la liste, la ligne du carnet visé s'éclaire. */
  eclaire?: EclaireV | null;
  /** G37 : le carnet supprimé, à sa place, avec Annuler. */
  supprime?: { titre: string; statut: StatutCarnet; onAnnuler: () => void } | null;
  /** R19 : les lignes de note en vrac tout juste rangées, par carnet (leur genre). */
  ajouts?: Record<string, GenreNote[]>;
  /** R19 : sans `ajouts`, le message tout juste rangé ; ses notes, par carnet, donnent « +n · genres ». */
  messageRecent?: string | null;
  /** Contenu posé au-dessus des groupes : bandeau R19 (NoteEnVrac), cadre R10 ou R16 (CadreArrivee). */
  enHaut?: React.ReactNode;
  onOuvrir: (id: string) => void;
  onCollerLien?: (id: string) => void;
  onVoirAVenir?: (id: string) => void;
  /** G1 : un toucher sur un exemple remplit le champ. */
  onExemple?: (texte: string) => void;
}

const EXEMPLES = ['Frigo de garde', 'Ventilation de la salle', 'Évier pour les fûts'];
const ORDRE: StatutCarnet[] = ['research', 'idea', 'validated'];
/** Ordre des genres dans « +2 · question, à acheter » (g5:v01-16) ; « note » n'est pas un genre à dire. */
const ORDRE_GENRES: GenreNote[] = ['question', 'a-acheter', 'a-faire', 'conseil'];

/**
 * Le titre est-il sa phrase (comparaison normalisée, préfixe du banc et rognage de `titreDePhrase` compris) ? Alors la phrase ne se
 * cite pas une seconde fois sous le titre : « votre phrase en titre », une fois (g5:v04-4).
 */
export function phraseEnTitre(titre: string, phrase: string | undefined): boolean {
  if (!phrase?.trim()) return false;
  const t = normaliser(titre.replace(/^ZZ TEST — /, ''));
  const p = phrase.replace(/^ZZ TEST — /, '');
  return t !== '' && (normaliser(p) === t || normaliser(titreDePhrase(p)) === t || normaliser(titreDePhrase(phrase)) === normaliser(titre));
}

/**
 * Les articles encore en lice : ni façon écartée, ni écarté au choix (D-52), page lue ou au moins nommée. D'après `tableau()` de
 * comparer.ts dès 2 articles (ses lignes écartées portent `ecarte`) ; à 1 article, la même règle sur l'article seul.
 */
export function articlesEnLice(c: CarnetV): ArticleV[] {
  const k = c.carnet;
  const lisible = (a: ArticleV) => a.lecture === 'lue' || !!a.nom?.trim();
  const t = calculerTableau(k as never);
  if (t) {
    const ecartes = new Set(t.lignes.filter(l => l.ecarte).map(l => l.articleId));
    return k.articles.filter(a => !ecartes.has(a.id) && lisible(a));
  }
  const ecartes = new Set(k.choix?.ecartes.map(e => e.articleId) ?? []);
  return k.articles.filter(a => {
    const f = a.faconId ? k.facons.find(x => x.id === a.faconId) : undefined;
    return f?.etat !== 'ecartee' && !ecartes.has(a.id) && lisible(a);
  });
}

/** Le prix de la carte : le choisi ; sinon « dès » le plus bas des articles en lice d'une même devise (CHF d'abord). */
export function prixDe(c: CarnetV): { des: boolean; texte: string; devise: string } | null {
  if (c.status === 'validated' && c.carnet.choix) {
    const a = c.carnet.articles.find(x => x.id === c.carnet.choix!.articleId);
    const m = montant(a?.prixCentimes);
    return m ? { des: false, texte: m, devise: a?.devise ?? 'CHF' } : null;
  }
  const prix = articlesEnLice(c).filter(a => typeof a.prixCentimes === 'number' && Number.isFinite(a.prixCentimes));
  if (!prix.length) return null;
  const devises = [...new Set(prix.map(a => a.devise ?? 'CHF'))];
  const devise = devises.includes('CHF') ? 'CHF' : devises[0];
  const memes = prix.filter(a => (a.devise ?? 'CHF') === devise).map(a => a.prixCentimes!);
  const m = montant(Math.min(...memes));
  return m ? { des: prix.length > 1, texte: m, devise } : null;
}

/** R19 : par carnet, les genres des notes nées du message `messageId` (« note » compris, dit seulement s'il est seul). */
export function ajoutsDuMessage(carnets: CarnetV[], messageId: string | null | undefined): Record<string, GenreNote[]> {
  const sortie: Record<string, GenreNote[]> = {};
  if (!messageId) return sortie;
  for (const c of carnets) {
    const genres = c.carnet.notes.filter(n => n.messageId === messageId).map(n => n.genre);
    if (genres.length) sortie[c.id] = genres;
  }
  return sortie;
}

/** « +2 · question, à acheter » : le compte, puis les genres dits une fois, dans l'ordre de g5:v01-16. */
export function texteAjouts(genres: GenreNote[]): string {
  const dits = ORDRE_GENRES.filter(g => genres.includes(g)).map(g => GENRE_LIBELLE[g]);
  return `+${genres.length} · ${(dits.length ? dits : [GENRE_LIBELLE.note]).join(', ')}`;
}

/** « 3 façons · 6 articles · 1 en veille » : rien de ce qui vaut 0 n'est écrit. */
function compte(c: CarnetV): { parts: string[]; veilles: number } {
  const k = c.carnet;
  const parts: string[] = [];
  if (k.facons.length) parts.push(pluriel(k.facons.length, 'façon', 'façons'));
  if (k.articles.length) parts.push(pluriel(k.articles.length, 'article', 'articles'));
  return { parts, veilles: k.articles.filter(a => a.veille?.active).length };
}

function Vignette({ c }: { c: CarnetV }) {
  const k = c.carnet;
  const choisi = k.choix ? k.articles.find(a => a.id === k.choix!.articleId) : undefined;
  const photo = choisi?.photo ?? k.articles.find(a => a.photo)?.photo ?? k.photos[0]?.jpeg;
  return <VignetteObjet photo={photo} mots={[c.title, k.phrase, choisi?.nom, ...k.facons.map(f => f.nom), ...k.articles.map(a => a.nom)]} />;
}

function CarteCarnet({ c, ajouts, onOuvrir, onCollerLien, onVoirAVenir }: { c: CarnetV; ajouts?: GenreNote[] } & Pick<ListeCarnetsProps, 'onOuvrir' | 'onCollerLien' | 'onVoirAVenir'>) {
  const k = c.carnet;
  const prix = prixDe(c);
  const { parts, veilles } = compte(c);
  const ensuite = k.notes.find(n => n.genre === 'a-faire')?.texte;
  const choisi = c.status === 'validated' && k.choix ? k.articles.find(a => a.id === k.choix!.articleId) : undefined;
  const vide = c.status === 'idea' && k.articles.length === 0;
  const sortieLe = dateCourte(k.sortie?.le);
  return (
    <div className="cn-carnet-bloc">
      <div className={`cn-carnet${vide && onCollerLien ? ' cn-carnet-coller' : ''}`}>
        <button type="button" className="cn-carnet-corps" onClick={() => onOuvrir(c.id)}>
          <Vignette c={c} />
          <span className="cn-carnet-tx">
            <b className="cn-carnet-titre">{c.title}</b>
            {choisi ? (
              <>
                {k.choix?.pourquoi && <span className="cn-encre-2">{k.choix.pourquoi}</span>}
                <span className="cn-mut">{[dateCourte(k.choix?.le) ? `le ${dateCourte(k.choix?.le)}` : null, choisi.vendeur].filter(Boolean).join(' · ')}</span>
              </>
            ) : vide ? (
              /* L4-5 : le titre est sa phrase → rien dessous (le carnet ouvert le dit, une fois) ; sinon la phrase citée, 2 lignes au plus */
              phraseEnTitre(c.title, k.phrase) ? null : <span className="cn-cite cn-deux-lignes">« {k.phrase} »</span>
            ) : (
              <>
                {ensuite && <span><b className="cn-vert">Ensuite :</b> {ensuite}</span>}
                {(parts.length > 0 || veilles > 0) && (
                  <span className="cn-mut cn-compte-ligne">
                    {parts.join(' · ')}
                    {veilles ? <>{parts.length ? ' ·' : ''}<Eye size={15} aria-hidden className="cn-inline cn-oeil" />{` ${veilles} en veille`}</> : null}
                  </span>
                )}
              </>
            )}
            {ajouts && ajouts.length > 0 && <span className="cn-pastille cn-pastille-ajout">{texteAjouts(ajouts)}</span>}
          </span>
          {prix && (
            <span className="cn-carnet-prix">
              {prix.des && <span className="cn-mut">dès</span>}
              <span className="cn-mono cn-prix">{prix.texte}</span>
              <span className="cn-mut">{prix.devise}</span>
            </span>
          )}
        </button>
        {vide && onCollerLien && (
          <button type="button" className="cn-second cn-coller-lien" onClick={() => onCollerLien(c.id)}><Link2 size={18} aria-hidden /> Coller un lien</button>
        )}
      </div>
      {k.sortie && (
        <button type="button" className="cn-avenir" onClick={() => onVoirAVenir?.(c.id)}>
          <CalendarCheck size={18} aria-hidden /><span className="cn-sp">Dans À venir{sortieLe ? ` depuis le ${sortieLe}` : ''}</span><span>Voir</span><ChevronRight size={18} aria-hidden />
        </button>
      )}
    </div>
  );
}

export function ListeCarnets(p: ListeCarnetsProps) {
  const visibles = p.carnets.filter(c => !c.carnet.archive);
  if (!visibles.length && !p.supprime) return <ListeVide enHaut={p.enHaut} onExemple={p.onExemple} />;

  const ajouts = p.ajouts ?? ajoutsDuMessage(visibles, p.messageRecent);
  const enTete = p.enTete ? visibles.find(c => c.id === p.enTete) : undefined;
  const groupes = ORDRE.map(s => ({ s, carnets: visibles.filter(c => c.status === s && c.id !== enTete?.id) }));
  const enVeille = visibles.flatMap(c => c.carnet.articles.filter(a => a.veille?.active).map(a => ({ c, a })));
  const exemple = visibles.some(c => c.carnet.articles.some(a => a.origine === 'exemple'));

  const rendre = (c: CarnetV) => {
    const carte = <CarteCarnet key={c.id} c={c} ajouts={ajouts[c.id]} onOuvrir={p.onOuvrir} onCollerLien={p.onCollerLien} onVoirAVenir={p.onVoirAVenir} />;
    if (p.eclaire?.carnetId !== c.id) return carte;
    const e = p.eclaire;
    return (
      <div key={c.id} className="cn-eclaire" role="status">
        {carte}
        <div className="cn-eclaire-pied">
          <span className="cn-sp"><b>{e.quoi}</b> <span className="cn-cite">· tiré de « {e.tireDe} »</span></span>
          <button type="button" className="cn-puce" onClick={e.onDeplacer}>Déplacer</button>
          <button type="button" className="cn-lien" onClick={e.onAnnuler}>Annuler</button>
        </div>
      </div>
    );
  };

  return (
    <div className="cn-page cn-liste">
      {p.enHaut}
      {enTete && <section className="cn-groupe-bloc" aria-label="Carnet créé">{rendre(enTete)}</section>}
      {groupes.map(({ s, carnets }) => {
        const supp = p.supprime?.statut === s ? p.supprime : null;
        if (!carnets.length && !supp) return null;
        const droite = s === 'idea' && carnets.every(c => c.carnet.articles.length === 0) ? "pas encore d'article"
          : s === 'validated' && exemple ? <>fournisseurs et prix : <Provenance origine="exemple" /></> : null;
        return (
          <section key={s} className="cn-groupe-bloc" aria-label={STATUT_LIBELLE[s]}>
            <div className="cn-entete-groupe">
              <span className={`cn-groupe cn-statut-${s}`}>{STATUT_LIBELLE[s]} <span className="cn-mono">{carnets.length}</span></span>
              <span className="cn-sp" />{droite && <span className="cn-mut">{droite}</span>}
            </div>
            {supp && <Bandeau enLigne bandeau={{ sorte: 'carnet-supprime', titre: supp.titre }} onAnnuler={supp.onAnnuler} />}
            {carnets.length > 0 && <div className="cn-cartes">{carnets.map(rendre)}</div>}
          </section>
        );
      })}
      {enVeille.length > 0 && (
        <section className="cn-groupe-bloc" aria-label="En veille">
          <div className="cn-entete-groupe">
            <span className="cn-groupe"><Eye size={16} aria-hidden /> En veille <span className="cn-mono">{enVeille.length}</span></span>
            <span className="cn-sp" /><span className="cn-mut">demandée · pas encore relevée</span>
          </div>
          <div className="cn-cartes">
            {enVeille.map(({ c, a }) => (
              <button key={a.id} type="button" className="cn-veille-rangee" onClick={() => p.onOuvrir(c.id)}>
                <VignetteObjet photo={a.photo} mots={[a.nom, c.carnet.facons.find(f => f.id === a.faconId)?.nom, c.title]} classe="cn-vignette-petite" taille={22} />
                <span className="cn-sp"><b>{a.nom ?? a.domaine}</b> <span className="cn-mut">· {c.title.replace(/^ZZ TEST — /, '')}</span></span>
                {montant(a.prixCentimes) && <span className="cn-nowrap"><span className="cn-mono">{montant(a.prixCentimes)}</span> <span className="cn-mut">{a.devise ?? 'CHF'}</span></span>}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/**
 * Premier usage (R02, figé p2:i02-2) : le cadre pointillé « Votre premier carnet s'affichera ici », « Un carnet garde » et ses trois
 * lignes (les objets, le prix, le choix), la bulle verte « Écrivez ici un besoin » qui pointe le champ. Dans la bulle, G1 : les
 * exemples touchables remplissent le champ ; G2 : « Une note en vrac marche aussi. ». Pendant la frappe, le cadre du geste (`enHaut`)
 * prend la place du cadre pointillé et la bulle se retire.
 */
function ListeVide({ enHaut, onExemple }: { enHaut?: React.ReactNode; onExemple?: (t: string) => void }) {
  const cadreGeste = React.isValidElement(enHaut) ? hasContenu(enHaut) : Boolean(enHaut);
  return (
    <div className="cn-page cn-liste cn-vide-page">
      {cadreGeste ? enHaut : (
        <div className="cn-premier" aria-label="Votre premier carnet s'affichera ici">
          <span className="cn-premier-titre">Votre premier carnet</span>
          <span className="cn-premier-ici">s'affichera ici</span>
          <span className="cn-premier-sous cn-mut">Nouveau carnet · <b className="cn-vert">Idée</b></span>
        </div>
      )}
      <section className="cn-garde" aria-label="Un carnet garde">
        <h3 className="cn-garde-titre">Un carnet garde</h3>
        <ul>
          <li><span className="cn-garde-ico" aria-hidden><Link2 size={20} /></span><span><b>Les objets</b> : un lien collé montre l'objet, une photo aussi</span></li>
          <li><span className="cn-garde-ico" aria-hidden><Eye size={20} /></span><span><b>Le prix</b>, surveillé tous les 3 jours</span></li>
          <li><span className="cn-garde-ico" aria-hidden><CalendarCheck size={20} /></span><span><b>Le choix</b>, qui part dans À venir</span></li>
        </ul>
      </section>
      {!cadreGeste && (
        <div className="cn-bulle-champ" role="note">
          <p><b>Écrivez ici un besoin</b> : un frigo, une ventilation, un évier…</p>
          <div className="cn-exemples">
            {EXEMPLES.map(e => <button key={e} type="button" className="cn-puce cn-puce-bulle" onClick={() => onExemple?.(e)}>{e}</button>)}
          </div>
          <p className="cn-bulle-petit">Entrée crée le carnet. Une note en vrac marche aussi.</p>
        </div>
      )}
    </div>
  );
}

/** Un fragment `<>{a}{b}</>` dont les deux enfants sont vides (null, false) ne compte pas comme un cadre. */
function hasContenu(el: React.ReactElement): boolean {
  const enfants = (el.props as { children?: React.ReactNode }).children;
  if (el.type !== React.Fragment) return true;
  return React.Children.toArray(enfants).some(x => (React.isValidElement(x) ? hasContenu(x) : Boolean(x)));
}
