/**
 * Le cadre « ↓ arrive ici », pendant la frappe et pendant la lecture : on voit avant, on annule pendant (✕), rien ne bouge
 * dans son dos. Une sorte par geste :
 * - `creer` (R10, g5:v08-3) : « Nouveau carnet · Idée · ↓ arrive ici · <titre> » ; « ✻ Déjà un carnet proche : … · Y ajouter en
 *   façon » ; G3 « Ce qui compte · … » tiré de la phrase ; G4 la raison quand rien n'est proche ;
 * - `texte` (R13, g5:v02-10) : « ↓ va atterrir ici · ✻ tiré de votre phrase · <Rubrique> : … · comparé sur … » ; G9 la
 *   conséquence (R45, calcul local, prop `consequence`) ; G10 ✕ ; G11 doublon (si `aides.doublon`) ;
 * - `lien` (R15, R16 ; g5:v03-9, v03-10) : avant l'envoi G14, pendant la lecture « ✻ lecture de la page… », le lien en clair,
 *   squelette de la carte (G15), puces de progression (G17), ce que l'IA cherche (G18) ; collé depuis la liste (G16) ;
 * - `modifier` (R20, g4:v01-11) : « ✎ Se modifie ici · ✕ Supprimer » (G31) ; G27 « Même visite : … · Regrouper » (si
 *   `aides.regrouper`).
 */
import React, { useEffect, useRef } from 'react';
import { ArrowDown, ArrowRight, GitFork, Pencil, Trash2, X } from 'lucide-react';
import { lienCourt } from './ChampCarnet';
import { sourceDuCritere } from '../../domain/carnets/modele';
import { Provenance, type AidesV, type Origine } from './EtatIA';

/** G11 : la note répétée ; `le` vide quand sa date est inconnue (rien d'inventé : son texte la nomme alors). */
export interface DoublonV { le: string; texte?: string; onGarderAPart: () => void }
export interface RegrouperV { avec: string; onRegrouper: () => void }

export type CadreV =
  /* P28 (R09) : Créer · avant, g5:v03-2 ; G1 (g5:v04-1) les exemples touchables ; G2 (g5:v07-2) « Une note en vrac marche aussi. » */
  | { sorte: 'avant'; exemples: string[]; onExemple: (texte: string) => void }
  /* tour 3, f5b n° 3 : `ouvrir`, la phrase nomme le carnet proche lui-même (« Ventilation de la salle ») : « Ouvrir ce carnet », pas une façon */
  | { sorte: 'creer'; titre: string; proche?: { titre: string; onAjouter: () => void; ouvrir?: boolean } | null; raisonNeuf?: string; ceQuiCompte?: string }
  /* Critique 5, n° 3 (G4) : `vers`, le carnet visé quand ce n'est pas l'ouvert (« ↓ va dans Évier inox ») ; même calcul qu'à l'envoi */
  /* `source` (décision du pilote, critique 6) : d'où vient le critère annoncé, lu par `sourceDuCritere` */
  | { sorte: 'texte'; rubrique: 'Ce qui compte' | 'Façons' | 'Articles' | 'Notes'; texte: string; origine: Origine; compareSur?: string; vers?: string; source?: 'phrase' | 'ia' }
  /* `lecturePossible` (critique 6, n° 11) : faux si l'IA est éteinte ou hors ligne ; la promesse « se lisent à l'envoi » se tait */
  /* tour 3, f5b n° 12 : `vers`, collé depuis la liste, le carnet qui parle déjà de l'objet : l'article y va (« va dans Ventilation… ») */
  | { sorte: 'lien'; url: string; phase: 'avant' | 'lecture'; depuisListe?: boolean; vers?: string; lecturePossible?: boolean; apercu?: string; lus?: { nom: boolean; photo: boolean; prix: boolean; stock: boolean; valeurs: boolean }; cherche?: string[] }
  | { sorte: 'modifier'; texte?: string; onSupprimer: () => void };

export interface CadreArriveeProps {
  cadre: CadreV;
  onAnnuler: () => void;
  /** G9 (R45) : « les articles seront rangés sur … » ; calcul local, picto local. */
  consequence?: string | null;
  aides?: AidesV;
  doublon?: DoublonV | null;
  regrouper?: RegrouperV | null;
}

const PROGRESSION: { cle: 'nom' | 'photo' | 'prix' | 'stock' | 'valeurs'; libelle: string }[] = [
  { cle: 'nom', libelle: 'nom' }, { cle: 'photo', libelle: 'photo' }, { cle: 'prix', libelle: 'prix' }, { cle: 'stock', libelle: 'stock' }, { cle: 'valeurs', libelle: 'valeurs' },
];

function Croix({ onAnnuler }: { onAnnuler: () => void }) {
  return <button type="button" className="cn-x" aria-label="Annuler" onClick={onAnnuler}><X size={18} aria-hidden /></button>;
}

/**
 * Le cadre se rend visible à son arrivée (et quand la conséquence G9 paraît) : `scrollIntoView` 'nearest', comme SupprimerCarnet. Il ne
 * passe ni sous la barre du haut ni sous le champ et le clavier : `scroll-margin` (carnets.css) lit `--cn-champ-h` et `--cn-clavier`, que
 * ChampCarnet publie. Une seule fois par apparition : la frappe suivante ne fait plus défiler.
 */
function useVisibleALArrivee<T extends HTMLElement>(cle: string): React.RefObject<T | null> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* après la peinture : le champ a déjà sa hauteur, ses puces « Va dans » comprises */
    if (typeof requestAnimationFrame !== 'function') { el.scrollIntoView?.({ block: 'nearest' }); return; }
    const id = requestAnimationFrame(() => el.scrollIntoView?.({ block: 'nearest' }));
    return () => cancelAnimationFrame(id);
  }, [cle]);
  return ref;
}

export function CadreArrivee(p: CadreArriveeProps) {
  const cle = `${p.cadre.sorte}${p.cadre.sorte === 'lien' ? `:${p.cadre.phase}` : ''}${p.consequence ? ':g9' : ''}`;
  const ref = useVisibleALArrivee<HTMLDivElement>(cle);
  return <div ref={ref} className={`cn-cadre-bloc cnf-cadre-${p.cadre.sorte}`} data-cadre={p.cadre.sorte}><CadreContenu {...p} /></div>;
}

function CadreContenu({ cadre: c, onAnnuler, consequence, aides, doublon, regrouper }: CadreArriveeProps) {
  if (c.sorte === 'avant') {
    /* le doigt sur une puce ne retire pas le focus du champ (le cadre resterait sinon le temps du toucher seulement) */
    const garder = (e: React.SyntheticEvent) => e.preventDefault();
    return (
      <section className="cn-cadre cnf-avant" aria-label="Créer un carnet">
        <p className="cnf-avant-phrase">Collez le lien d'un objet ou notez un besoin : on garde sa photo et son prix, pour comparer.</p>
        <div className="cnf-fantome" aria-hidden>
          <span className="cnf-fantome-photo" />
          <span className="cn-sp"><b>Évier inox, 2 bacs</b><span className="cn-mut"> · exemple</span></span>
          <span className="cn-vert"><ArrowDown size={16} aria-hidden /> arrive ici</span>
        </div>
        <div className="cnf-exemples" role="group" aria-label="Exemples">
          {c.exemples.map(t => <button key={t} type="button" className="cn-puce" onMouseDown={garder} onClick={() => c.onExemple(t)}>{t}</button>)}
        </div>
        <p className="cn-mut">Une note en vrac marche aussi.</p>
      </section>
    );
  }
  if (c.sorte === 'creer') {
    return (
      <section className="cn-cadre" aria-label="Arrive ici">
        <div className="cn-cadre-tete"><span className="cn-mut-vert">Nouveau carnet · Idée</span><span className="cn-sp" /><span className="cn-vert"><ArrowDown size={16} aria-hidden /> arrive ici</span></div>
        <p className="cn-cadre-titre">{c.titre}</p>
        {c.ceQuiCompte && <p className="cn-mut">Ce qui compte · <b className="cn-encre">{c.ceQuiCompte}</b></p>}
        {c.proche ? (
          <div className="cn-proche">
            <p><Provenance origine="ia" /> Déjà un carnet proche : <b>{c.proche.titre}</b></p>
            {c.proche.ouvrir
              ? <button type="button" className="cn-puce cn-puce-ia" onClick={c.proche.onAjouter}><ArrowRight size={16} aria-hidden /> Ouvrir ce carnet</button>
              : <button type="button" className="cn-puce cn-puce-ia" onClick={c.proche.onAjouter}><GitFork size={16} aria-hidden /> Y ajouter en façon</button>}
          </div>
        ) : c.raisonNeuf ? <p className="cn-mut"><Provenance origine="ia" /> {c.raisonNeuf}</p> : null}
      </section>
    );
  }
  if (c.sorte === 'texte') {
    return (
      <>
        <section className="cn-cadre" aria-label={c.vers ? `Va dans ${c.vers}` : 'Va atterrir ici'} data-vers={c.vers ?? 'ici'}>
          <div className="cn-cadre-tete">
            <span className="cn-vert"><ArrowDown size={16} aria-hidden /> {c.vers ? <>va dans <b>{c.vers}</b></> : 'va atterrir ici'}</span><span className="cn-sp" />
            {c.origine === 'ia' && <span className="cn-ia">✻ {sourceDuCritere({ origine: 'vous', ...(c.source ? { source: c.source } : {}) }) === 'ia' ? 'proposé par l’IA' : 'tiré de votre phrase'}</span>}
            {c.origine === 'locale' && <span className="cn-mut"><Provenance origine="locale" /> tiré de votre phrase</span>}
            <Croix onAnnuler={onAnnuler} />
          </div>
          <p className="cn-cadre-titre">{c.rubrique} : {c.texte}</p>
          {c.compareSur && <p className="cn-mut">comparé sur {c.compareSur}</p>}
          {aides?.doublon && doublon && (
            <div className="cn-aide">
              <span className="cn-sp"><Provenance origine="ia" /> Même chose que la note {doublon.le ? `du ${doublon.le}` : `« ${doublon.texte ?? ''} »`} : elles seront fusionnées</span>
              <button type="button" className="cn-puce" onClick={doublon.onGarderAPart}>Garder à part</button>
            </div>
          )}
        </section>
        {consequence && <p className="cn-consequence-sous"><Provenance origine="locale" /> {consequence}</p>}
      </>
    );
  }
  if (c.sorte === 'lien') {
    const lus = c.lus;
    return (
      <section className="cn-cadre" aria-label={c.vers ? `Va dans ${c.vers}, dans Articles` : 'Arrive ici, dans Articles'} data-vers={c.vers ? 'carnet' : undefined}>
        <div className="cn-cadre-tete">
          <span className="cn-vert"><ArrowDown size={16} aria-hidden /> {c.vers ? <>va dans <b>{c.vers}</b> · Articles</> : c.depuisListe ? 'Va atterrir ici · lien collé' : 'Arrive ici, dans Articles'}</span>
          <span className="cn-sp" /><Croix onAnnuler={onAnnuler} />
        </div>
        <p className="cn-mono cn-lien-clair">{lienCourt(c.url, 40)}</p>
        {c.phase === 'avant' ? (
          /* critique 6, n° 11 (D-137) : la promesse seulement si la lecture peut la tenir (IA allumée, en ligne) ; sinon, ce qui arrivera */
          <p className="cn-mut">{c.apercu ? <><Provenance origine="ia" /> d'après le lien : {c.apercu}. </> : null}{c.lecturePossible === false
            ? 'Sans lecture ici : le lien est gardé tel quel, page non lue.'
            : 'Nom, prix et photo se lisent à l\'envoi.'}</p>
        ) : (
          <>
            <p className="cn-ia">✻ lecture de la page…</p>
            <div className="cn-squelette" aria-hidden>
              <span className="cn-sq-photo" /><span className="cn-sq-lignes"><i /><i /><i /></span>
            </div>
            {lus && (
              <p className="cn-progression" aria-label="Lu">
                {PROGRESSION.map((x, i) => (
                  <React.Fragment key={x.cle}>{i > 0 && ' · '}<span className={lus[x.cle] ? 'cn-vert' : 'cn-mut'}>{x.libelle}{lus[x.cle] ? ' ✓' : ''}</span></React.Fragment>
                ))}
              </p>
            )}
            {c.cherche && c.cherche.length > 0 && <p className="cn-mut">l'IA cherche : {c.cherche.join(', ')}</p>}
            {c.depuisListe
              ? <p className="cn-mut">L'IA lit la photo, le nom, le prix et le vendeur. Ce qu'elle ne lit pas reste vide.</p>
              : <p className="cn-mut">nom, prix, photo, cotes : rien d'affiché avant d'être lu</p>}
          </>
        )}
      </section>
    );
  }
  return (
    <section className="cn-cadre" aria-label="Se modifie ici">
      <div className="cn-cadre-tete">
        <span className="cn-vert"><Pencil size={16} aria-hidden /> Se modifie ici</span><span className="cn-sp" />
        <button type="button" className="cn-lien cn-rouge" onClick={c.onSupprimer}><Trash2 size={16} aria-hidden /> Supprimer</button>
        <Croix onAnnuler={onAnnuler} />
      </div>
      {c.texte && <p className="cn-cadre-titre cnf-modifie-texte">{c.texte}</p>}
      <p className="cn-mut">Le texte est dans le champ du bas : modifiez, puis Enregistrer.</p>
      {aides?.regrouper && regrouper && (
        <div className="cn-aide">
          <span className="cn-sp"><Provenance origine="ia" /> Même visite : {regrouper.avec}</span>
          <button type="button" className="cn-puce" onClick={regrouper.onRegrouper}>Regrouper</button>
        </div>
      )}
    </section>
  );
}
