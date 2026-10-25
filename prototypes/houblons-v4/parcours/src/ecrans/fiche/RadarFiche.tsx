// Le radar de la fiche g1, sur le radar commun (commun/RadarBase.tsx, porté de cmc2h : « utiliser ce radar graph comme
// Baseline et l'utiliser partout dans les vue où il y en a », voie rb-radar-commun). Ses valeurs restent celles de g1 :
// le nombre de fiches qui citent chaque famille. Un houblon seul, sans bascule Au style / Absolu : l'échelle est fixe,
// de 0 à toutes ses fiches (2 au moins : une famille citée par la seule fiche d'un houblon n'atteint pas le bord),
// anneaux chiffrés en fiches. Une famille que ses fiches ne décrivent pas est inconnue (D65, jamais 0) : elle rejoint le
// secteur « sans donnée ». La demande garde sa flèche (« plus floral » vers l'extérieur, « moins résineux » vers le
// centre). Toucher un secteur (ou le survoler, à l'ordinateur) ouvre la bulle de g1 ; un toucher hors du radar la referme.
import { useEffect, useRef, useState } from 'react';
import { COURT, ROUE } from '../../commun';
import { RadarBase } from '../../commun/RadarBase';
import type { HoublonLu } from '../../moteur';
import type { FamilyId } from '../../../../../../src/domain/hopIndex/v4';

const ENCRE = '#3d3d47';

export function RadarFiche({ h, demande }: { h: HoublonLu; demande: Partial<Record<FamilyId, number | 'banni'>> }) {
  const [bulle, setBulle] = useState<FamilyId | null>(null);
  const boite = useRef<HTMLDivElement | null>(null);
  // Un toucher ailleurs referme la bulle (g1 : « Un toucher hors d'un radar referme sa bulle »).
  useEffect(() => {
    if (!bulle) return;
    const hors = (e: PointerEvent) => { if (!boite.current?.contains(e.target as Node)) setBulle(null); };
    document.addEventListener('pointerdown', hors, true);
    return () => document.removeEventListener('pointerdown', hors, true);
  }, [bulle]);
  const inconnue = (f: FamilyId) => h.familles[f].niveau === 'non décrit' || h.familles[f].fiches === 0;
  const sur = Math.max(2, ...ROUE.map((f) => h.familles[f].sur ?? 0), ...ROUE.map((f) => (inconnue(f) ? 0 : h.familles[f].fiches)));
  const valeurs = Object.fromEntries(ROUE.map((f) => [f, inconnue(f) ? null : h.familles[f].fiches])) as Record<FamilyId, number | null>;
  const motsBulle = (f: FamilyId) => {
    const x = h.familles[f], v = demande[f];
    const base = inconnue(f) ? 'ses fiches ne le décrivent pas, inconnu (ce n’est pas zéro), sans donnée'
      : x.sur === 1 ? 'une seule fiche' : `${x.fiches}/${x.sur} fiches`;
    return v === 1 || v === -1 ? `${base} ; tu en veux ${v === 1 ? 'plus' : 'moins'}` : base;
  };
  const montrer = (f: FamilyId) => setBulle((b) => (b === f ? b : f));
  return (
    <div ref={boite} className="relative w-full max-w-[22.5rem] mx-auto">
      <RadarBase familles={ROUE} mode="absolu" objet="fiche"
        series={[{ cle: h.cle, nom: h.nom, couleur: ENCRE, role: 'retenu', valeurs }]}
        echelleAbsolue={{ pas: 1, nb: sur }}
        label={`Silhouette de ${h.nom} selon ses ${sur} fiches ; les familles non décrites sont inconnues, pas à zéro`}
        fleches={demande}
        cibles={{ toucher: montrer, survol: (f) => (f ? montrer(f) : setBulle(null)), etats: { melon: 'etat-fiche-radar-sommet' } }}
        bulle={bulle ? {
          famille: bulle,
          rendu: (ancre) => (
            <p role="status" data-role="fiche-bulle"
              className="pq-fiche-bulle absolute z-10 max-w-[92%] w-max px-2 py-1 rounded-lg border border-cave-700 bg-cave-900 text-sm leading-snug text-cave-50 pointer-events-none"
              style={{ left: `${(ancre.x * 100).toFixed(1)}%`, top: `${(ancre.y * 100).toFixed(1)}%`,
                transform: `translate(${ancre.x < 0.36 ? '-16px' : ancre.x > 0.64 ? 'calc(-100% + 16px)' : '-50%'}, ${ancre.y < 0.28 ? '14px' : 'calc(-100% - 12px)'})` }}>
              <b className="font-semibold">{COURT[bulle]}</b> : {motsBulle(bulle)}
            </p>
          ),
        } : undefined} />
    </div>
  );
}
