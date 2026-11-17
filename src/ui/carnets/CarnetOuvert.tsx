/**
 * Le carnet ouvert (R03, figés p2:h05-3 et p2:i06-4, **sans** la rangée « Ajouter à … : quoi ? », D-114 ; R12 base g5:v03-6 :
 * ✎ près du titre, ··· par note, un seul champ en bas).
 * De haut en bas : « ‹ Carnets », l'état (« Idée · 15 nov. », « À comparer », « Choisi le … »), ···, le titre et son ✎ (G28),
 * sa phrase citée (R25), les pastilles « lié à » (R33, R47 : 3 au plus puis « +n », aperçu sur place, aucun montant), le bandeau
 * et le cadre du geste en cours (slots), Ce qui compte (G5 : rempli d'emblée quand la phrase porte un critère), les façons
 * (« A ou B ? », prix de leurs articles, raison en pastille), « Le critère sépare … · Retenir … », les articles (tableau rangé par
 * le critère dès le 2e article, R26 ; cartes avant), les photos (masquées vides), les notes (··· et G33 « ✻ doublon ? »), la ligne
 * G6 « Le champ en bas range tout ici » sur un carnet neuf. Ce qui vient d'être rangé est encadré à sa place (LigneRangee, R14,
 * R17 avec G19 : l'article dans sa façon). Rubriques vides : qui agit (« l'IA le proposera », « collez un lien »).
 */
import React, { useState } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight, Ellipsis, FileText, GitFork, Pencil, Tag, Target } from 'lucide-react';
import { Bandeau } from './Bandeau';
import { CarteArticle } from './CarteArticle';
import { colonnesVue, meilleursDe, texteCellule, type TableauV } from './Comparer';
import { dateCourte, GENRE_LIBELLE, montant, Provenance, STATUT_LIBELLE, type AidesV, type CarnetV, type CritereV, type NoteV } from './EtatIA';
import { LigneRangee } from './LigneRangee';
import { Photos } from './Photos';

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
  /** « Le critère sépare les deux façons : … · Retenir … » : texte de l'IA, cité s'il existe. */
  separe?: { texte: string; retenir: string; onRetenir: () => void } | null;
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

export function CarnetOuvert(p: CarnetOuvertProps) {
  const c = p.carnet, k = c.carnet;
  const [menu, setMenu] = useState(false);
  const [apercu, setApercu] = useState<string | null>(null);
  const r = p.rangee;
  const critere = k.criteres[0];
  const lus = k.articles.filter(a => a.lecture === 'lue').length;
  const sansApercu = k.articles.filter(a => a.lecture === 'illisible').length;
  const enDouble = new Set(p.aides.doublon ? p.doublons ?? [] : []);
  const question = k.facons.length === 2 ? `${k.facons[0].nom} ou ${k.facons[1].nom} ?` : null;

  const encadre = (cible: RangeeV['cible'], id: string, noeud: React.ReactNode) =>
    r && r.cible === cible && r.id === id
      ? <LigneRangee key={id} phrase={r.phrase} rangeSur={r.rangeSur} onAnnuler={r.onAnnuler} onVotreTexte={r.onVotreTexte} onDeplacer={r.onDeplacer} onChangerEnNote={r.onChangerEnNote}>{noeud}</LigneRangee>
      : <React.Fragment key={id}>{noeud}</React.Fragment>;

  const ligneCritere = (cr: CritereV) => (
    <p className="cn-critere">
      <Target size={18} aria-hidden className="cn-vert" />
      <span>{cr.origine === 'ia' ? "Ce qui compte, proposé par l'IA" : 'Ce qui compte, tiré de votre phrase'} : <b>{cr.texte}</b>{cr.raison ? <span className="cn-mut"> · {cr.raison}</span> : null}</span>
    </p>
  );

  const articleRange = r?.cible === 'article' ? k.articles.find(a => a.id === r.id) : undefined;
  const faconRange = articleRange?.faconId ? k.facons.find(f => f.id === articleRange.faconId) : undefined;

  return (
    <article className={`cn-page cn-ouvert${p.grise ? ' cn-grise' : ''}`} aria-label={c.title}>
      <div className="cn-tete">
        <button type="button" className="cn-retour" onClick={p.onRetour}><ChevronLeft size={20} aria-hidden /> Carnets</button>
        <span className="cn-sp" />
        <span className={`cn-pastille cn-statut-${c.status}`}>{etiquetteStatut(c)}</span>
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
      {k.phrase && k.phrase.trim() !== c.title.trim() && <p className="cn-cite">« {k.phrase} »</p>}

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
            <span className="cn-sp"><b>Choisi : {k.articles.find(a => a.id === k.choix!.articleId)?.nom ?? 'article'}</b><span className="cn-mut">{k.choix.pourquoi}</span></span>
            <span className="cn-lien">Pourquoi <ChevronRight size={16} aria-hidden /></span>
          </button>
          {k.sortie
            ? <p className="cn-avenir-ligne"><CalendarCheck size={18} aria-hidden /> Dans À venir{dateCourte(k.sortie.le) ? ` depuis le ${dateCourte(k.sortie.le)}` : ''}</p>
            : p.onEnvoyerAVenir && <button type="button" className="cn-action" onClick={p.onEnvoyerAVenir}><CalendarCheck size={18} aria-hidden /> Envoyer dans À venir</button>}
        </div>
      )}

      <section className="cn-rubrique" aria-label="Ce qui compte">
        {k.criteres.length === 0
          ? <p className="cn-rubrique-tete"><Target size={18} aria-hidden /> <b>Ce qui compte</b> <span className="cn-mut">· rien encore : l'IA le proposera</span></p>
          : <div className="cn-encart-critere">{k.criteres.map(cr => encadre('critere', cr.id, ligneCritere(cr)))}</div>}
      </section>

      <section className="cn-rubrique" aria-label="Façons">
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
            {p.separe && (
              <div className="cn-encart cn-separe">
                <span className="cn-sp"><Provenance origine="ia" /> {p.separe.texte}</span>
                <button type="button" className="cn-action" onClick={p.separe.onRetenir}>Retenir {p.separe.retenir}</button>
              </div>
            )}
          </>
        )}
      </section>

      <section className="cn-rubrique" aria-label="Articles">
        {k.articles.length === 0 ? (
          <p className="cn-rubrique-tete"><Tag size={18} aria-hidden /> <b>Articles</b> <span className="cn-mut">· aucun : collez un lien</span></p>
        ) : (
          <>
            <div className="cn-rubrique-tete">
              <Tag size={18} aria-hidden /><b>Articles</b>
              <span className="cn-mut cn-sp cn-nowrap">{lus} lu{lus > 1 ? 's' : ''}{sansApercu ? `, ${sansApercu} sans aperçu` : ''}</span>
              {p.tableau && <button type="button" className="cn-lien" onClick={p.onComparer}>Comparer côte à côte <ChevronRight size={16} aria-hidden /></button>}
            </div>
            {articleRange && r && (
              <LigneRangee sorte="article" faconNom={faconRange?.nom} phrase={r.phrase} onAnnuler={r.onAnnuler} onDeplacer={r.onDeplacer}>
                <CarteArticle article={articleRange} critere={critere} variante="complete" luSurPage={r.luSurPage} verdict={r.verdict} onVeille={v => p.onVeille?.(articleRange.id, v)} />
              </LigneRangee>
            )}
            {p.tableau ? (
              <TableauArticles tableau={p.tableau} facons={k.facons.map(f => ({ id: f.id, nom: f.nom }))} faconDe={id => k.articles.find(a => a.id === id)?.faconId} sauf={articleRange?.id} onOuvrir={p.onOuvrirArticle} />
            ) : (
              <div className="cn-cartes">
                {k.articles.filter(a => a.id !== articleRange?.id).map(a => (
                  <CarteArticle key={a.id} article={a} critere={critere} faconNom={k.facons.find(f => f.id === a.faconId)?.nom} onOuvrir={() => p.onOuvrirArticle(a.id)} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <Photos photos={k.photos} />

      <section className="cn-rubrique" aria-label="Notes">
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
    </article>
  );
}

function LigneNote({ note, doublon, onNote }: { note: NoteV; doublon: boolean; onNote: (id: string) => void }) {
  const d = dateCourte(note.modifieeLe ?? note.le);
  return (
    <div className="cn-note">
      <span className="cn-note-picto" aria-hidden><FileText size={18} /></span>
      <span className="cn-sp cn-note-tx">
        <span>{note.texte}</span>
        <span className="cn-mut">
          {GENRE_LIBELLE[note.genre]}{note.modifieeLe ? ' · modifiée' : ''}{d ? ` · ${d}` : ''}{note.groupe ? ` · ${note.groupe.libelle}` : ''}
          {doublon && <span className="cn-doublon"> · <Provenance origine="ia" /> doublon ?</span>}
        </span>
      </span>
      <button type="button" className="cn-ico" aria-label={`Note : ${note.texte}, actions`} onClick={() => onNote(note.id)}><Ellipsis size={22} aria-hidden /></button>
    </div>
  );
}

/** Le tableau dans le carnet (i06-4) : groupé par façon, rang, nom, valeurs du critère, prix ; la meilleure valeur surlignée. */
function TableauArticles({ tableau, facons, faconDe, sauf, onOuvrir }: { tableau: TableauV; facons: { id: string; nom: string }[]; faconDe: (articleId: string) => string | undefined; sauf?: string; onOuvrir: (id: string) => void }) {
  const toutes = colonnesVue(tableau);
  const cols = toutes.length > 3 ? [...toutes.slice(0, 2), toutes[toutes.length - 1]] : toutes;
  const meilleurs = new Map(cols.map(c => [c.cle, meilleursDe(tableau, c)]));
  const lignes = tableau.lignes.filter(l => l.articleId !== sauf);
  const groupes = [...facons.map(f => ({ id: f.id, nom: f.nom })), { id: '', nom: '' }]
    .map(g => ({ ...g, lignes: lignes.filter(l => (faconDe(l.articleId) ?? '') === g.id) }))
    .filter(g => g.lignes.length);
  return (
    <table className="cn-tableau cn-tableau-carnet">
      <thead><tr><th scope="col" className="cn-mut">rang</th>{cols.map(c => <th key={c.cle} scope="col" className="cn-mut">{c.nom}{c.unite ? <><br />{c.unite}</> : null}</th>)}</tr></thead>
      {groupes.map(g => (
        <tbody key={g.id || 'sans'}>
          {g.nom && <tr className="cn-tableau-groupe"><th colSpan={cols.length + 1} scope="rowgroup">{g.nom}</th></tr>}
          {g.lignes.map(l => (
            <tr key={l.articleId} className={l.ecarte ? 'cn-ecarte' : undefined} onClick={() => onOuvrir(l.articleId)}>
              <th scope="row">
                <button type="button" className="cn-tableau-nom" onClick={e => { e.stopPropagation(); onOuvrir(l.articleId); }}>
                  {l.rang && !l.ecarte ? <span className={`cn-rang${l.rang === 1 ? ' cn-rang-1' : ''}`}>{l.rang}</span> : <span className="cn-rang cn-rang-vide">–</span>}
                  <span><span>{l.nom}</span>{l.ecarte ? <span className="cn-mut">écarté : {l.ecarte.raison}</span> : l.moinsBienPartout ? <span className="cn-att">moins bien partout</span> : null}</span>
                </button>
              </th>
              {cols.map(c => {
                const v = texteCellule(l, c);
                return <td key={c.cle} className={meilleurs.get(c.cle)?.has(l.articleId) ? 'cn-meilleur' : undefined}>{v ? <span className="cn-mono">{v}</span> : <span className="cn-inconnu" aria-label="inconnu">–</span>}</td>;
              })}
            </tr>
          ))}
        </tbody>
      ))}
    </table>
  );
}
