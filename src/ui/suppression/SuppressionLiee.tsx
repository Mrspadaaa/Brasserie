/**
 * Supprimer une chose liée : maquette suppression/v2 (« les liens, un par un »), reprise telle quelle.
 *
 * Un grand compteur « 3 liens le retiennent », une barre de segments, chaque lien sur sa branche avec son geste (Rentré, Vidé) ; le compteur
 * descend et « Supprimer » s'allume en rouge à zéro. Un lien qui ne se règle pas porte un cadenas : la chose ne peut qu'être archivée.
 * Sans lien, la suppression est directe et le bandeau « Annuler » dure 6 s. Rien ne part en cascade.
 *
 * Correction de la critique (page des choix) : « Vidé » passe par un écran de sortie (motif), il n'écrit pas un mouvement de stock pour supprimer.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive, ArrowLeft, Beer, Boxes, Check, Cylinder, Lock, Receipt, Trash2, Undo2, Users, X
} from 'lucide-react';
import type { KegItem } from '../../types';
import {
  MOTIFS_SORTIE, futApresGeste, lignesDesLiens, resumeLiens, type GenreLien, type LienSuppression, type MotifSortie, type SorteChose
} from '../../domain/suppressionLiee';
import { nombreFr } from '../../domain/nombreAffiche';
import { Sheet } from '../Sheet';
import { swissToday } from '../DateField';
import { montrerBandeau } from './bandeau';
import './suppression-liee.css';

/** Ce que l'hôte (fiche d'un fût, d'un brassin, d'un client) sait faire de la chose ; le composant ne touche à rien d'autre. */
export interface ChoseASupprimer {
  sorte: SorteChose;
  id: string;
  /** Le nom long de l'en-tête : « F-07 · 30 L », « L-014 · Blanche d’hiver ». */
  nom: string;
  /** Le nom court des boutons et du bandeau : « F-07 ». */
  court: string;
  /** Les liens d'après les données du moment ; `surcharge` porte les fûts écrits pendant la feuille (le cache d'écriture peut lire un instant en retard). */
  liens: (surcharge: ReadonlyMap<string, KegItem>) => LienSuppression[];
  lireFut: (id: string) => KegItem | undefined;
  /** Le jour des gestes `JJ.MM.AAAA` ; absent = aujourd'hui (le banc des fûts fige le sien). */
  jour?: string;
  ecrireFut: (keg: KegItem) => void;
  /** Dit ce que la suppression ne rend pas (ingrédients déjà déstockés d'un brassin) : la feuille s'ouvre même sans lien. */
  avertissement?: string;
  supprimer: () => void;
  /** Remet la chose supprimée (bandeau « Annuler ») ; `surcharge` : les fûts tels que les gestes de la feuille les ont laissés. */
  retablir: (surcharge: ReadonlyMap<string, KegItem>) => void;
  archiver: () => void;
  ressortir: () => void;
}

const GENRE: Record<GenreLien, { Icon: typeof Beer; teinte: string }> = {
  fut: { Icon: Cylinder, teinte: 'stocks' },
  client: { Icon: Users, teinte: 'agenda' },
  brassin: { Icon: Beer, teinte: 'production' },
  facture: { Icon: Receipt, teinte: 'finances' },
  stock: { Icon: Boxes, teinte: 'stocks' }
};
const SORTE: Record<SorteChose, { mot: string; Icon: typeof Beer; teinte: string }> = {
  fut: { mot: 'fût', Icon: Cylinder, teinte: 'stocks' },
  brassin: { mot: 'brassin', Icon: Beer, teinte: 'production' },
  client: { mot: 'client', Icon: Users, teinte: 'agenda' }
};

const Tuile: React.FC<{ Icon: typeof Beer; teinte: string }> = ({ Icon, teinte }) => (
  <span className="su-tuile" data-teinte={teinte} aria-hidden="true"><Icon size={22} /></span>
);

interface Ouverture { cle: string; initiaux: LienSuppression[] }

export const SuppressionLiee: React.FC<{ chose: ChoseASupprimer | null; onClose: () => void }> = ({ chose, onClose }) => {
  const [ouverture, setOuverture] = useState<Ouverture | null>(null);
  const [surcharge, setSurcharge] = useState<ReadonlyMap<string, KegItem>>(new Map());
  /** Le fût d'avant chaque geste, par lien : « Annuler » le rétablit. */
  const [avant, setAvant] = useState<Record<string, KegItem>>({});
  const [sortie, setSortie] = useState<{ lien: LienSuppression; motif: MotifSortie | null } | null>(null);
  const derniere = useRef(chose);
  derniere.current = chose;
  const cle = chose ? `${chose.sorte}:${chose.id}` : '';

  // À l'ouverture : les liens du moment ; aucun lien et rien à dire → suppression directe, bandeau « Annuler ».
  useEffect(() => {
    const c = derniere.current;
    setSurcharge(new Map()); setAvant({}); setSortie(null);
    if (!c) { setOuverture(null); return; }
    const initiaux = c.liens(new Map());
    if (initiaux.length === 0 && !c.avertissement) {
      setOuverture(null);
      c.supprimer();
      montrerBandeau(`${c.court} supprimé`, 'Annuler', () => c.retablir(new Map()));
      onClose();
      return;
    }
    setOuverture({ cle, initiaux });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);

  const ouvert = !!chose && ouverture?.cle === cle;
  const courants = useMemo(() => (chose && ouvert ? chose.liens(surcharge) : []), [chose, ouvert, surcharge]);
  const lignes = useMemo(() => (ouvert ? lignesDesLiens(ouverture!.initiaux, courants) : []), [ouvert, ouverture, courants]);
  const resume = resumeLiens(lignes);

  if (!chose || !ouvert || !ouverture) return null;
  const { restants, verrous, libre } = resume;
  const sorte = SORTE[chose.sorte];
  const jour = chose.jour ?? swissToday();

  const ecrire = (lien: LienSuppression, motif?: MotifSortie) => {
    const g = lien.geste;
    if (!g) return;
    const keg = surcharge.get(g.futId) ?? chose.lireFut(g.futId);
    if (!keg) return;
    const apres = futApresGeste(keg, g.type, jour, motif);
    chose.ecrireFut(apres);
    setAvant((a) => ({ ...a, [lien.id]: keg }));
    setSurcharge((s) => new Map(s).set(g.futId, apres));
  };
  const regler = (lien: LienSuppression) => {
    if (lien.geste?.type === 'vide') { setSortie({ lien, motif: null }); return; }
    ecrire(lien);
  };
  const annuler = (lien: LienSuppression) => {
    const keg = avant[lien.id];
    if (!keg || !lien.geste) return;
    chose.ecrireFut(keg);
    setSurcharge((s) => new Map(s).set(lien.geste!.futId, keg));
    setAvant((a) => { const { [lien.id]: _, ...reste } = a; return reste; });
  };
  const supprimer = () => { chose.supprimer(); montrerBandeau(`${chose.court} supprimé`, 'Annuler', () => chose.retablir(surcharge)); onClose(); };
  const archiver = () => { chose.archiver(); montrerBandeau(`${chose.court} archivé, liens gardés`, 'Ressortir', chose.ressortir); onClose(); };

  /* ── Écran de sortie : où est partie la bière d'un fût qu'on vide ── */
  if (sortie) {
    const keg = surcharge.get(sortie.lien.geste!.futId) ?? chose.lireFut(sortie.lien.geste!.futId);
    const retour = () => setSortie(null);
    return (
      <Sheet open onClose={onClose} title={`Sortie du fût ${keg?.id ?? ''}`} bare className="lg:max-w-xl lg:mx-auto"
        footer={
          <div className="su su-pied">
            <button type="button" className="su-btn su-pri" disabled={!sortie.motif}
              onClick={() => { ecrire(sortie.lien, sortie.motif!); retour(); }}><Check size={20} aria-hidden="true" />Enregistrer la sortie</button>
            <button type="button" className="su-btn su-sec" onClick={retour}>Retour aux liens</button>
          </div>
        }>
        <div className="su">
          <div className="su-haut">
            <button type="button" className="su-ret" onClick={retour}><ArrowLeft size={22} aria-hidden="true" />Liens de {chose.court}</button>
          </div>
          <h2 className="su-h2">Sortie du fût</h2>
          <p className="su-s">Aujourd’hui {jour} · le fût passe à laver, la sortie est notée dans son historique.</p>
          <div className="su-carte">
            <div><span>Fût</span><b>{keg ? `${keg.id} · ${nombreFr(keg.capacityL, 1)} L` : sortie.lien.nom}</b></div>
            <div><span>Bière</span><b>{keg ? ([keg.batchRef, keg.beerName].filter(Boolean).join(' · ') || 'non renseignée') : '—'}</b></div>
          </div>
          <p className="su-q">Où est partie cette bière ?</p>
          <div className="su-motifs" role="group" aria-label="Où est partie la bière">
            {MOTIFS_SORTIE.map((m) => (
              <button key={m} type="button" aria-pressed={sortie.motif === m} onClick={() => setSortie({ ...sortie, motif: m })}>{m}</button>
            ))}
          </div>
        </div>
      </Sheet>
    );
  }

  const nPlus = restants > 1;
  return (
    <Sheet open onClose={onClose} title={`Supprimer ${chose.court}`} bare className="lg:max-w-xl lg:mx-auto"
      footer={
        <div className="su su-pied">
          {verrous.length > 0
            ? <button type="button" className="su-btn su-pri" onClick={archiver}><Archive size={20} aria-hidden="true" />Archiver {chose.court}</button>
            : <>
                <button type="button" className="su-btn su-mal" disabled={!libre} onClick={supprimer}>
                  <Trash2 size={20} aria-hidden="true" /><span>{libre ? `Supprimer ${chose.court}` : `Supprimer · encore ${restants} lien${nPlus ? 's' : ''}`}</span>
                </button>
                <button type="button" className="su-btn su-sec" onClick={archiver}><Archive size={20} aria-hidden="true" />Archiver plutôt</button>
              </>}
        </div>
      }>
      <div className="su">
        <div className="su-tete">
          <Tuile Icon={sorte.Icon} teinte={sorte.teinte} />
          <div className="su-tx"><b>{chose.nom}</b><span>{sorte.mot} · suppression demandée</span></div>
          <button type="button" className="su-x" onClick={onClose} aria-label="Fermer"><X size={22} aria-hidden="true" /></button>
        </div>

        <div className={`su-cpt${libre ? ' su-zero' : ''}`} role="status" aria-live="polite">
          <span className="su-n">{restants}</span>
          <span className="su-cpt-t">{libre ? 'plus rien ne le retient' : nPlus ? 'liens le retiennent' : 'lien le retient'}
            <small>{libre ? 'tu peux le supprimer' : 'rien ne part en cascade'}</small></span>
        </div>
        <div className="su-barre" aria-hidden="true">
          {lignes.map(({ lien, regle }) => <i key={lien.id} className={regle ? 'su-ok' : lien.geste ? '' : 'su-pm'} />)}
        </div>

        {lignes.length > 0 && (
          <ol className="su-liens">
            {lignes.map(({ lien, regle }) => {
              const g = GENRE[lien.genre];
              return (
                <li key={lien.id} className={`su-lien${regle ? ' su-regle' : ''}`}>
                  {regle ? <span className="su-tuile" data-teinte="ok" aria-hidden="true"><Check size={22} /></span> : <Tuile Icon={g.Icon} teinte={g.teinte} />}
                  <div className="su-tx"><b>{lien.nom}</b><span>{regle ? lien.geste?.fait : lien.detail}</span></div>
                  {regle
                    ? (avant[lien.id] ? <button type="button" className="su-und" onClick={() => annuler(lien)}><Undo2 size={18} aria-hidden="true" />Annuler</button> : null)
                    : lien.geste
                      ? <button type="button" className="su-fix" onClick={() => regler(lien)}><Check size={18} aria-hidden="true" />{lien.geste.libelle}</button>
                      : <span className="su-cad"><Lock size={19} aria-hidden="true" />{lien.garde}</span>}
                </li>
              );
            })}
          </ol>
        )}

        {verrous.length > 0 && (
          <p className="su-note"><Lock size={20} aria-hidden="true" />
            <span>{verrous.map((l) => <React.Fragment key={l.id}><b>{l.nom}</b> {l.garde}</React.Fragment>).reduce<React.ReactNode[]>((a, x, i) => (i ? [...a, ' ; ', x] : [x]), [])}. {chose.court} ne peut qu’être archivé.</span>
          </p>
        )}
        {chose.avertissement && verrous.length === 0 && <p className="su-note su-avert"><span>{chose.avertissement}</span></p>}
      </div>
    </Sheet>
  );
};
