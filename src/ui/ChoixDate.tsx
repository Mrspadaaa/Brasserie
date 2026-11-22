import React, { useEffect, useRef, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { DureeFenetre } from './calendrier/frise/DureeFenetre';
import { jourLisible, type Rangee } from '../domain/calendrier';

/**
 * GESTE-DATE-PARTOUT (22.11) : le choix d'un jour, partout dans l'app, au geste de la frise partagée du Calendrier (`DureeFenetre seule pas="jour"`,
 * celle de la fiche v02 : un repère par jour, R1 à R10). Ce composant n'invente aucun geste : une pastille (le jour lu, « 8 déc. ») et, dessous,
 * la frise ; il remplace le `<input type="date">` natif, la réglette maison et les ‹ › de jour.
 *
 * Valeur : `AAAA-MM-JJ`, ou `''` (« à poser » : un toucher ne pose rien, R1). `onChange` n'est appelé qu'au lâcher d'un geste (ou à Entrée au clavier) :
 * un champ qui s'enregistre ailleurs (Enregistrer, Valider…) garde sa validation. `min` / `max` (AAAA-MM-JJ) bornent ce qui s'écrit : la frise
 * revient sur la borne au lâcher, comme le natif la refusait. Échap rend le jour d'avant.
 * `ouvert` : la frise est toujours visible (feuille déjà dédiée à la date) ; sinon elle s'ouvre au toucher de la pastille.
 * Limite connue : la frise couvre du 6 janv. 2025 à fin 2029 (R8) ; un jour hors de cette plage se lit mais se tire dans la plage.
 */
export interface ChoixDateProps {
  /** `AAAA-MM-JJ` ou `''`. */
  valeur: string;
  onChange: (iso: string) => void;
  /** Ce que lit un lecteur d'écran et la pastille : « Date de l'achat ». */
  label: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  /** Le jour montré quand la valeur est vide (le jour de départ de la frise) ; défaut : aujourd'hui. */
  depart?: string;
  /** La teinte de la frise (rangée du Calendrier) ; défaut : brassins. */
  rangee?: Rangee;
  /** Frise toujours visible, sans pastille à toucher. */
  ouvert?: boolean;
  /** Ce que dit la pastille quand rien n'est posé. */
  vide?: string;
  /** Le jour à chaque mouvement du doigt (aperçu en direct) ; l'écriture, elle, reste au lâcher. */
  onBrouillon?: (iso: string) => void;
  className?: string;
  /** L'id de la pastille (un `<label for>` qui la désigne). */
  id?: string;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const aujourdhuiIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

export const ChoixDate: React.FC<ChoixDateProps> = ({ valeur, onChange, label, min, max, disabled = false, depart, rangee = 'brassins', ouvert = false, vide = 'À poser', onBrouillon, className, id }) => {
  const valide = ISO.test(valeur) ? valeur : '';
  const [ouverte, setOuverte] = useState(false);
  const [brouillon, setBrouillon] = useState(valide || depart || aujourdhuiIso());
  /* les rappels du geste sont lus à son début : le jour tiré et la valeur écrite se tiennent en refs */
  const brouillonRef = useRef(brouillon);
  const ecritRef = useRef(valide);
  const racine = useRef<HTMLDivElement | null>(null);
  const poser = (d: string) => { brouillonRef.current = d; setBrouillon(d); onBrouillon?.(d); };
  useEffect(() => { ecritRef.current = valide; if (valide) { brouillonRef.current = valide; setBrouillon(valide); } }, [valide]);
  const borne = (d: string) => (min && d < min ? min : max && d > max ? max : d);
  const ecrire = () => {
    const d = borne(brouillonRef.current);
    if (d !== brouillonRef.current) poser(d);
    if (d !== ecritRef.current) { ecritRef.current = d; onChange(d); }
  };
  const afficher = ouvert || ouverte;
  useEffect(() => { if (ouverte && !ouvert) racine.current?.querySelector<HTMLElement>('[data-date-point]')?.focus({ preventScroll: true }); }, [ouverte, ouvert]);
  const fermer = (avecEcriture: boolean) => {
    if (avecEcriture) ecrire(); else { poser(ecritRef.current || valide || brouillonRef.current); }
    if (!ouvert) setOuverte(false);
  };
  return (
    <div ref={racine} className={`choix-date${className ? ` ${className}` : ''}`} data-choix-date data-valeur={valide || undefined}>
      {!ouvert && (
        <button type="button" id={id} disabled={disabled} aria-expanded={ouverte} aria-label={`${label} : ${valide ? jourLisible(valide) : vide}`} data-choix-date-pastille
          onClick={() => setOuverte(o => !o)}
          className="inline-flex min-h-touch items-center gap-1.5 rounded-control border border-cave-700 bg-cave-900 px-2.5 text-sm text-cave-50">
          <CalendarDays size={16} aria-hidden="true" />
          <span className={valide ? 'font-semibold' : 'text-cave-400'}>{valide ? `${jourLisible(valide)} ${valide.slice(0, 4)}` : vide}</span>
        </button>
      )}
      {afficher && (
        <div className="mt-1" data-choix-date-frise
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); fermer(true); }
            else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fermer(false); }
          }}>
          <DureeFenetre seule pas="jour" rangee={rangee} debut={brouillon} fin={null} onFin={() => undefined}
            onPlage={d => poser(d)} onLacher={ecrire} />
        </div>
      )}
    </div>
  );
};
