/**
 * D451, voie « afaire » : le corps de l'écran « À faire » (maquettes3/v01, écran `afaire`) : les tâches ouvertes de tous les problèmes, en
 * trois groupes (Cette semaine, Fin du mois, Un jour ; « Plus loin » pour les mois suivants). Chaque ligne : case, texte, sous-ligne
 * (picto du problème, son nom, · devis, · « dans À venir »), jeton de coût à droite (« ≈ 35 CHF », « 540 CHF »).
 *
 * Contrôlé par props : aucun magasin lu, aucune écriture. La rangée de filtres (Arbre · À faire n · cloche) est celle de la liste.
 * Gestes : la case coche (retour optimiste, la liste suit les props) ; toucher la ligne ouvre son problème ; appui long (ou clic droit)
 * ouvre « Quand ? » pour changer l'échéance. Rien ne reproche une tâche en retard : elle reste dans « Cette semaine », sans rouge.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';
import type { CarnetDoc, MessageDoc, PrecisionTache } from '../../domain/carnets/modele';
import { aFaireDe, type TacheVue } from '../../domain/carnets/taches';
import type { FinancialPlan } from '../../domain/finance/types';
import { pictoDe, PictoObjet } from './pictos';
import { choixActuel, choixEcheances, coutDeTache, dansAVenir, libelleGroupe, montantDUnDevis, type Maintenant } from './afaireRegles';
import './afaire.css';

export interface QuandTache { date: string | null; precision: PrecisionTache }

export interface AFaireProps {
  carnets: readonly CarnetDoc[];
  maintenant: Maintenant;
  /** Les plans d'À venir existants (pour « dans À venir ») ; absents : aucun lien n'est dit. */
  plans?: readonly Pick<FinancialPlan, 'id' | 'status'>[];
  /** Les messages des carnets (pour reconnaître un montant de devis) ; absents : tout coût est un jeton. */
  messages?: readonly MessageDoc[];
  /** Cocher (`faite: true`) ou décocher une tâche : `cocherTache` du domaine. */
  onCocher: (carnetId: string, tacheId: string, faite: boolean) => void;
  /** Toucher une ligne : ouvrir le problème d'origine. */
  onOuvrir: (carnetId: string, tacheId: string) => void;
  /** Changer l'échéance (`poserEcheance`) ; absent : pas d'appui long. */
  onEcheance?: (carnetId: string, tacheId: string, quand: QuandTache) => void;
  /** Le picto du problème (la liste injecte celui de sa catégorie) ; par défaut, l'objet dessiné d'après ses mots. */
  picto?: (c: CarnetDoc) => React.ReactNode;
}

const APPUI_LONG_MS = 500;

const pictoParDefaut = (c: CarnetDoc): React.ReactNode => (
  <PictoObjet nom={pictoDe(c.title, c.carnet.categorie?.chemin.join(' '), c.carnet.phrase)} taille={16} />
);

export function AFaire({ carnets, maintenant, plans = [], messages = [], onCocher, onOuvrir, onEcheance, picto = pictoParDefaut }: AFaireProps) {
  const liste = useMemo(() => aFaireDe(carnets, typeof maintenant === 'function' ? maintenant() : maintenant), [carnets, maintenant]);
  const parId = useMemo(() => new Map(carnets.map(c => [c.id, c])), [carnets]);
  const [cochees, setCochees] = useState<ReadonlySet<string>>(new Set());
  const [quand, setQuand] = useState<TacheVue | null>(null);
  const appui = useRef<{ minuteur: number | undefined; long: boolean; x: number; y: number }>({ minuteur: undefined, long: false, x: 0, y: 0 });

  /* une case cochée ici disparaît avec la tâche (la liste suit les props) ; si la tâche revient (Annuler), elle revient décochée */
  useEffect(() => {
    const presentes = new Set(liste.groupes.flatMap(g => g.taches.map(t => t.id)));
    setCochees(avant => {
      const reste = [...avant].filter(id => presentes.has(id));
      return reste.length === avant.size ? avant : new Set(reste);
    });
  }, [liste]);

  const exemple = liste.groupes.some(g => g.taches.some(t => t.origine === 'exemple'));

  if (liste.total === 0) {
    return (
      <div className="cn-page af-vue" data-vue="afaire">
        <p className="cn-vide af-vide">Rien à faire. Une tâche posée dans un problème (« À faire », « Plus tard ») paraît ici.</p>
      </div>
    );
  }

  const cocher = (t: TacheVue) => {
    const faite = !cochees.has(t.id);
    setCochees(avant => { const n = new Set(avant); if (faite) n.add(t.id); else n.delete(t.id); return n; });
    onCocher(t.carnetId, t.id, faite);
  };
  const debutAppui = (t: TacheVue) => {
    if (!onEcheance || t.derivee) return;
    appui.current.long = false;
    window.clearTimeout(appui.current.minuteur);
    appui.current.minuteur = window.setTimeout(() => { appui.current.long = true; setQuand(t); }, APPUI_LONG_MS);
  };
  const finAppui = () => window.clearTimeout(appui.current.minuteur);
  /* C68-9 (H8 : 1,6 s au toucher, rien) : au doigt, le navigateur envoie `pointercancel` dès qu'il croit à un défilement, ce qui coupait le minuteur avant les 500 ms.
     Au toucher, l'appui long suit donc les événements tactiles : il part au `touchstart`, ne s'arrête qu'au relevé, à l'annulation tactile ou à un vrai déplacement du
     doigt (plus de 10 px) ; le pointeur tactile (pointerdown, pointercancel) ne le touche plus. La souris garde les événements pointeur. */
  const doigtBouge = (e: React.TouchEvent) => { const p = e.touches[0]; if (p && Math.hypot(p.clientX - appui.current.x, p.clientY - appui.current.y) > 10) finAppui(); };

  return (
    <div className="cn-page af-vue" data-vue="afaire">
      {exemple && <div className="af-exemple"><span className="cn-exemple">exemple</span></div>}
      {liste.groupes.map(g => (
        <section key={g.cle} className="af-groupe" data-groupe={g.cle} aria-label={`${libelleGroupe(g.cle)}, ${g.taches.length}`}>
          <h3 className="af-tete">{libelleGroupe(g.cle)} <span className="af-n">{g.taches.length}</span></h3>
          <ul className="af-liste">
            {g.taches.map(t => {
              const c = parId.get(t.carnetId);
              const faite = cochees.has(t.id);
              const cout = coutDeTache(t);
              const devis = cout && montantDUnDevis(t, messages);
              const avenir = dansAVenir(t, c, plans);
              return (
                <li key={t.id} className="af-ligne" data-faite={faite ? '' : undefined} data-derivee={t.derivee ? '' : undefined}>
                  <button
                    type="button" role="checkbox" aria-checked={faite} className="af-case" disabled={!!t.derivee}
                    aria-label={t.derivee ? `${t.texte} : se coche au Planning` : `${faite ? 'Décocher' : 'Cocher'} : ${t.texte}`}
                    onClick={() => cocher(t)}
                  >
                    <span className="af-rond" aria-hidden>{faite && <Check size={14} strokeWidth={3} />}</span>
                  </button>
                  <button
                    type="button" className="af-corps"
                    onTouchStart={e => { appui.current.x = e.touches[0]?.clientX ?? 0; appui.current.y = e.touches[0]?.clientY ?? 0; debutAppui(t); }} onTouchMove={doigtBouge} onTouchEnd={finAppui} onTouchCancel={finAppui}
                    onPointerDown={e => { if (e.pointerType !== 'touch') debutAppui(t); }} onPointerUp={e => { if (e.pointerType !== 'touch') finAppui(); }} onPointerLeave={e => { if (e.pointerType !== 'touch') finAppui(); }} onPointerCancel={e => { if (e.pointerType !== 'touch') finAppui(); }}
                    onContextMenu={e => { if (onEcheance && !t.derivee) { e.preventDefault(); finAppui(); setQuand(t); } }}
                    onClick={() => { if (appui.current.long) { appui.current.long = false; return; } onOuvrir(t.carnetId, t.id); }}
                  >
                    <span className="af-texte">{t.texte}</span>
                    <span className="af-sous">
                      {c && <span className="af-picto" aria-hidden>{picto(c)}</span>}
                      {(!t.derivee || t.texte !== t.carnetTitre) && <span className="af-nom">{t.carnetTitre}</span>}
                      {devis && cout && <span className="af-plus">· {cout.texte}</span>}
                      {t.derivee && <span className="af-plus">{t.texte === t.carnetTitre ? 'au Planning' : '· au Planning'}</span>}
                      {avenir && <span className="af-plus af-avenir">· dans À venir</span>}
                    </span>
                  </button>
                  {cout && !devis && <span className="af-jeton" data-estime={cout.estime ? '' : undefined}>{cout.texte}</span>}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
      {quand && onEcheance && <FeuilleQuand tache={quand} maintenant={maintenant} onFermer={() => setQuand(null)} onChoisir={q => { onEcheance(quand.carnetId, quand.id, q); setQuand(null); }} />}
    </div>
  );
}

/** « Quand ? » : l'échéance d'une tâche, d'un toucher (cette semaine, la suivante, fin du mois, le mois prochain, un jour). */
function FeuilleQuand({ tache, maintenant, onFermer, onChoisir }: { tache: TacheVue; maintenant: Maintenant; onFermer: () => void; onChoisir: (q: QuandTache) => void }) {
  useEffect(() => {
    const touche = (e: KeyboardEvent) => { if (e.key === 'Escape') onFermer(); };
    window.addEventListener('keydown', touche);
    return () => window.removeEventListener('keydown', touche);
  }, [onFermer]);
  const choix = choixEcheances(maintenant);
  const actuel = choixActuel(tache, choix);
  return (
    <div className="cn-voile" onClick={onFermer}>
      <section className="af-feuille" role="dialog" aria-modal="true" aria-label={`Quand : ${tache.texte}`} onClick={e => e.stopPropagation()}>
        <span className="cn-poignee" aria-hidden />
        <div className="af-feuille-tete">
          <h3><b>Quand ?</b> <span className="cn-mut af-ell">{tache.texte}</span></h3>
          <button type="button" className="cn-lien" onClick={onFermer} aria-label="Fermer"><X size={18} aria-hidden /></button>
        </div>
        <div className="af-quand">
          {choix.map(c => (
            <button key={c.cle} type="button" className="cn-puce" aria-pressed={actuel?.cle === c.cle} onClick={() => onChoisir({ date: c.date, precision: c.precision })}>{c.libelle}</button>
          ))}
        </div>
      </section>
    </div>
  );
}
