import React, { useRef } from 'react';
import { Clock, Lightbulb } from 'lucide-react';
import { dateDeSemaine } from '../../../domain/calendrier';
import { sg, variation, type SoldeSemaine } from './Courbe';

/**
 * La bande des semaines (E04, E05, E36) : au repos, la semaine seule (S47…), sans solde, sans mouvement, sans icône (D-184). Un toucher donne
 * sa date (« S50, 7 – 13 déc. », i3). Le bouton ± affiche, sous chaque semaine, son + ou son − et les petites icônes (idée datée du carnet,
 * retard), puis les masque (D-185, D-186). Un appui long de 500 ms sur une semaine note une idée à cette date (L1 b, D-122).
 */
export interface SemaineBande { debut: string; numero: number }

export interface BandeSemainesProps {
  /** Les semaines de la fenêtre, de la première à la dernière colonne. */
  semaines: readonly SemaineBande[];
  /** La courbe entière et l'index de la première colonne dans cette courbe : pour la variation de chaque semaine. */
  courbe: readonly SoldeSemaine[] | null;
  decalage: number;
  mouvements: boolean;
  /** Lundis ISO qui portent une idée datée, et lundis qui portent un retard. */
  idees: ReadonlySet<string>;
  retards: ReadonlySet<string>;
  onDate: (lundi: string, colonne: number) => void;
  onIdeeSemaine?: (lundi: string) => void;
}

const DELAI = 500;

export function BandeSemaines({ semaines, courbe, decalage, mouvements, idees, retards, onDate, onIdeeSemaine }: BandeSemainesProps) {
  const appui = useRef<{ id: number; x: number; y: number; timer: ReturnType<typeof setTimeout>; long: boolean } | null>(null);
  const annule = () => { if (appui.current) { clearTimeout(appui.current.timer); appui.current = null; } };
  return (
    <div className="ent-bd" data-bande-semaines role="group" aria-label="Semaines ; ± affiche les mouvements et les icônes" style={{ ['--n' as string]: semaines.length }}>
      {semaines.map((s, k) => {
        const v = courbe ? variation(courbe, decalage + k) : null;
        const idee = idees.has(s.debut), retard = retards.has(s.debut);
        return (
          <button key={s.debut} type="button" className="ent-bd-c" data-semaine={s.numero} data-lundi={s.debut} data-courant={decalage + k === 0 ? 'oui' : undefined}
            aria-label={`${dateDeSemaine(s.debut)}${mouvements && v !== null ? ` ; mouvement ${sg(v)}` : ''}${mouvements && idee ? ' ; idée du carnet' : ''}${mouvements && retard ? ' ; en retard' : ''}`}
            onPointerDown={e => {
              if (e.button > 0 || !onIdeeSemaine) return;
              annule();
              const timer = setTimeout(() => { if (appui.current) { appui.current.long = true; onIdeeSemaine(s.debut); } }, DELAI);
              appui.current = { id: e.pointerId, x: e.clientX, y: e.clientY, timer, long: false };
            }}
            onPointerMove={e => { const a = appui.current; if (a && !a.long && Math.hypot(e.clientX - a.x, e.clientY - a.y) > 8) annule(); }}
            onPointerUp={() => { if (appui.current && !appui.current.long) annule(); }}
            onPointerCancel={annule}
            onContextMenu={e => e.preventDefault()}
            onClick={() => {
              // L'appui long a déjà ouvert l'idée : le toucher qui suit ne donne pas la date.
              if (appui.current?.long) { appui.current = null; return; }
              onDate(s.debut, k);
            }}>
            <span className="ent-sem">{`S${s.numero}`}</span>
            {mouvements && (
              <span className="ent-bd-m">
                {v !== null && <span className={v < 0 ? 'ent-m' : 'ent-p'}>{sg(v)}</span>}
                {(idee || retard) && (
                  <span className="ent-ic">
                    {retard && <Clock size={14} strokeWidth={2.4} aria-hidden="true" />}
                    {idee && <Lightbulb size={14} strokeWidth={2.4} aria-hidden="true" />}
                  </span>
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
