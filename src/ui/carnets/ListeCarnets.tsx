/**
 * La liste des carnets (R01, figés p2:g05-1 et p2:i06-1 ; D-25 : une vue sans détails d'abord) et la liste vide (R02, figés
 * p2:i02-2 et p2:i06-2 ; geste 1 « Créer · avant » : base g5:v03-2, G1 puces exemples, G2 brouillon dit en second).
 * Groupes par état : À comparer, Idée, Choisi, En veille. Une carte : vignette, titre, ce qui vient ensuite, « 2 façons · 5 articles »
 * (garde C1), la veille, le prix (« dès » si plusieurs). Choisi : la phrase du pourquoi, la date et le fournisseur ; envoyé :
 * « Dans À venir depuis le 16 nov. · Voir » (R32). En veille : les articles dont il a demandé la veille ; tant que la relève
 * n'existe pas (R31), « demandée · pas encore relevée », aucune baisse ni prix barré.
 * Gestes : R11 le carnet créé paraît en tête ; G13 la ligne du carnet visé s'éclaire quand il écrit depuis la liste ; G37
 * « Carnet supprimé · <titre> · Annuler » à la place du carnet ; R19 les lignes ajoutées « +2 · question, à acheter ».
 * Le segment « À venir · Carnets · Réalisés » et le + volant appartiennent au conteneur (lot D) ; le champ est ChampCarnet.
 */
import React from 'react';
import { ArrowDown, CalendarCheck, ChevronRight, Eye, Link2, Package } from 'lucide-react';
import { Bandeau } from './Bandeau';
import { dateCourte, GENRE_LIBELLE, montant, pluriel, Provenance, STATUT_LIBELLE, type CarnetV, type GenreNote, type StatutCarnet } from './EtatIA';

export interface EclaireV { carnetId: string; quoi: string; tireDe: string; onDeplacer: () => void; onAnnuler: () => void }

export interface ListeCarnetsProps {
  carnets: CarnetV[];
  /** R11 : le carnet tout juste créé, montré en tête. */
  enTete?: string;
  /** G13 : écrit depuis la liste, la ligne du carnet visé s'éclaire. */
  eclaire?: EclaireV | null;
  /** G37 : le carnet supprimé, à sa place, avec Annuler. */
  supprime?: { titre: string; statut: StatutCarnet; onAnnuler: () => void } | null;
  /** R19 : les lignes de note en vrac tout juste rangées, par carnet. */
  ajouts?: Record<string, GenreNote[]>;
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

function vignette(c: CarnetV): string | undefined {
  return c.carnet.articles.find(a => a.photo)?.photo ?? c.carnet.photos[0]?.jpeg;
}

function prixDe(c: CarnetV): { des: boolean; texte: string } | null {
  if (c.status === 'validated' && c.carnet.choix) {
    const a = c.carnet.articles.find(x => x.id === c.carnet.choix!.articleId);
    const m = montant(a?.prixCentimes);
    return m ? { des: false, texte: m } : null;
  }
  const connus = c.carnet.articles.map(a => a.prixCentimes).filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
  if (!connus.length) return null;
  const m = montant(Math.min(...connus));
  return m ? { des: connus.length > 1, texte: m } : null;
}

function Vignette({ c }: { c: CarnetV }) {
  const src = vignette(c);
  return src ? <img className="cn-vignette" src={src} alt="" loading="lazy" /> : <span className="cn-vignette cn-vignette-vide" aria-hidden><Package size={24} /></span>;
}

function CarteCarnet({ c, ajouts, onOuvrir, onCollerLien, onVoirAVenir }: { c: CarnetV; ajouts?: GenreNote[] } & Pick<ListeCarnetsProps, 'onOuvrir' | 'onCollerLien' | 'onVoirAVenir'>) {
  const k = c.carnet;
  const prix = prixDe(c);
  const veilles = k.articles.filter(a => a.veille?.active).length;
  const ensuite = k.notes.find(n => n.genre === 'a-faire')?.texte;
  const choisi = c.status === 'validated' && k.choix ? k.articles.find(a => a.id === k.choix!.articleId) : undefined;
  const vide = c.status === 'idea' && k.articles.length === 0;
  const sortieLe = dateCourte(k.sortie?.le);
  return (
    <div className="cn-carnet-bloc">
      <div className="cn-carnet">
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
              <span className="cn-cite">« {k.phrase} »</span>
            ) : (
              <>
                {ensuite && <span><b className="cn-vert">Ensuite :</b> {ensuite}</span>}
                <span className="cn-mut">
                  {pluriel(k.facons.length, 'façon', 'façons')} · {pluriel(k.articles.length, 'article', 'articles')}
                  {veilles ? <> · <span className="cn-nowrap"><Eye size={16} aria-hidden className="cn-inline" /> {veilles} en veille</span></> : null}
                </span>
              </>
            )}
            {ajouts && ajouts.length > 0 && (
              <span className="cn-pastille cn-pastille-ajout">+{ajouts.length} · {[...new Set(ajouts.map(g => GENRE_LIBELLE[g]))].join(', ')}</span>
            )}
          </span>
          {prix && (
            <span className="cn-carnet-prix">
              {prix.des && <span className="cn-mut">dès</span>}
              <span className="cn-mono cn-prix">{prix.texte}</span>
              <span className="cn-mut">CHF</span>
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

  const enTete = p.enTete ? visibles.find(c => c.id === p.enTete) : undefined;
  const groupes = ORDRE.map(s => ({ s, carnets: visibles.filter(c => c.status === s && c.id !== enTete?.id) }));
  const enVeille = visibles.flatMap(c => c.carnet.articles.filter(a => a.veille?.active).map(a => ({ c, a })));
  const exemple = visibles.some(c => c.carnet.articles.some(a => a.origine === 'exemple'));

  const rendre = (c: CarnetV) => {
    const carte = <CarteCarnet key={c.id} c={c} ajouts={p.ajouts?.[c.id]} onOuvrir={p.onOuvrir} onCollerLien={p.onCollerLien} onVoirAVenir={p.onVoirAVenir} />;
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
                <span className="cn-sp"><b>{a.nom ?? a.domaine}</b> <span className="cn-mut">· {c.title}</span></span>
                {montant(a.prixCentimes) && <span className="cn-mono">{montant(a.prixCentimes)}</span>}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Premier usage (R02, geste 1) : la phrase dit l'achat d'abord, la carte fantôme « ↓ arrive ici », les exemples touchables. */
function ListeVide({ enHaut, onExemple }: { enHaut?: React.ReactNode; onExemple?: (t: string) => void }) {
  return (
    <div className="cn-page cn-liste cn-vide-page">
      {enHaut ?? (
        <>
          <h2 className="cn-titre-grand">Carnets</h2>
          <p className="cn-accroche">Collez le lien d'un objet ou notez un besoin : on garde sa photo, son prix, et on le surveille.</p>
          <div className="cn-fantome" aria-hidden>
            <span className="cn-vignette cn-vignette-vide"><Package size={24} /></span>
            <span className="cn-sp"><b>Évier inox, 2 bacs</b><span className="cn-mut"><span className="cn-exemple">exemple</span> votre premier carnet</span></span>
            <span className="cn-vert"><ArrowDown size={16} /> arrive ici</span>
          </div>
        </>
      )}
      <p><b>Aucun carnet encore.</b> <span className="cn-mut">Par exemple :</span></p>
      <div className="cn-exemples">
        {EXEMPLES.map(e => <button key={e} type="button" className="cn-puce" onClick={() => onExemple?.(e)}>{e}</button>)}
      </div>
      <p className="cn-mut">Une note en vrac marche aussi.</p>
    </div>
  );
}
