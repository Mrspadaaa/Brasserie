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
import { ArrowDown, GitFork, Pencil, Trash2, X } from 'lucide-react';
import { lienCourt } from './ChampCarnet';
import { Provenance, type AidesV, type Origine } from './EtatIA';

export interface DoublonV { le: string; onGarderAPart: () => void }
export interface RegrouperV { avec: string; onRegrouper: () => void }

export type CadreV =
  | { sorte: 'creer'; titre: string; proche?: { titre: string; onAjouter: () => void } | null; raisonNeuf?: string; ceQuiCompte?: string }
  | { sorte: 'texte'; rubrique: 'Ce qui compte' | 'Façons' | 'Articles' | 'Notes'; texte: string; origine: Origine; compareSur?: string }
  | { sorte: 'lien'; url: string; phase: 'avant' | 'lecture'; depuisListe?: boolean; apercu?: string; lus?: { nom: boolean; photo: boolean; prix: boolean; stock: boolean; valeurs: boolean }; cherche?: string[] }
  | { sorte: 'modifier'; onSupprimer: () => void };

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
  return <div ref={ref} className="cn-cadre-bloc"><CadreContenu {...p} /></div>;
}

function CadreContenu({ cadre: c, onAnnuler, consequence, aides, doublon, regrouper }: CadreArriveeProps) {
  if (c.sorte === 'creer') {
    return (
      <section className="cn-cadre" aria-label="Arrive ici">
        <div className="cn-cadre-tete"><span className="cn-mut-vert">Nouveau carnet · Idée</span><span className="cn-sp" /><span className="cn-vert"><ArrowDown size={16} aria-hidden /> arrive ici</span></div>
        <p className="cn-cadre-titre">{c.titre}</p>
        {c.ceQuiCompte && <p className="cn-mut">Ce qui compte · <b className="cn-encre">{c.ceQuiCompte}</b></p>}
        {c.proche ? (
          <div className="cn-proche">
            <p><Provenance origine="ia" /> Déjà un carnet proche : <b>{c.proche.titre}</b></p>
            <button type="button" className="cn-puce cn-puce-ia" onClick={c.proche.onAjouter}><GitFork size={16} aria-hidden /> Y ajouter en façon</button>
          </div>
        ) : c.raisonNeuf ? <p className="cn-mut"><Provenance origine="ia" /> {c.raisonNeuf}</p> : null}
      </section>
    );
  }
  if (c.sorte === 'texte') {
    return (
      <>
        <section className="cn-cadre" aria-label="Va atterrir ici">
          <div className="cn-cadre-tete">
            <span className="cn-vert"><ArrowDown size={16} aria-hidden /> va atterrir ici</span><span className="cn-sp" />
            {c.origine === 'ia' && <span className="cn-ia">✻ tiré de votre phrase</span>}
            {c.origine === 'locale' && <span className="cn-mut"><Provenance origine="locale" /> tiré de votre phrase</span>}
            <Croix onAnnuler={onAnnuler} />
          </div>
          <p className="cn-cadre-titre">{c.rubrique} : {c.texte}</p>
          {c.compareSur && <p className="cn-mut">comparé sur {c.compareSur}</p>}
          {aides?.doublon && doublon && (
            <div className="cn-aide">
              <span className="cn-sp"><Provenance origine="ia" /> Même chose que la note du {doublon.le} : elles seront fusionnées</span>
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
      <section className="cn-cadre" aria-label="Arrive ici, dans Articles">
        <div className="cn-cadre-tete">
          <span className="cn-vert"><ArrowDown size={16} aria-hidden /> {c.depuisListe ? 'Va atterrir ici · lien collé' : 'Arrive ici, dans Articles'}</span>
          <span className="cn-sp" /><Croix onAnnuler={onAnnuler} />
        </div>
        <p className="cn-mono cn-lien-clair">{lienCourt(c.url, 40)}</p>
        {c.phase === 'avant' ? (
          <p className="cn-mut">{c.apercu ? <><Provenance origine="ia" /> d'après le lien : {c.apercu}. </> : null}Nom, prix et photo se lisent à l'envoi.</p>
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
      {aides?.regrouper && regrouper && (
        <div className="cn-aide">
          <span className="cn-sp"><Provenance origine="ia" /> Même visite : {regrouper.avec}</span>
          <button type="button" className="cn-puce" onClick={regrouper.onRegrouper}>Regrouper</button>
        </div>
      )}
    </section>
  );
}
