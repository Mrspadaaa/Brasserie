// La fiche d'un houblon (g1, fiche courte type Citra cryo), dans le langage de la page : mêmes pictos, α écrit
// comme sur les lignes (lot d'abord), usage en mot, familles et leurs sources (« 2/4 »), mots du brasseur,
// silhouette (radar), part « autres », et le geste « goût ». Feuille de l'app (Sheet, via Feuille du socle).
// Fermée par « × » (Sheet), par Échap (Sheet) et par « ‹ ».
// Emploi depuis un autre écran : const f = useFiche(); <span {...f.appui(cle)} {...f.nom(cle)}>…</span>; {f.rendu}
import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, Heart, Ban } from 'lucide-react';
import { COURT, Feuille, FAMILIES, Picto, nombre } from '../../commun';
import { useRecette } from '../../etat/EtatParcours';
import { quandDe } from '../../etat/operations';
import { houblon, ibuAjout, nomMoment, type HoublonLu } from '../../moteur';
import { familyWords, hopRef } from '../../../../src/engine';
import { AlphaLu, Autres, Usage } from './briques';
import { noterFermeture, useGestesFiche } from './gestes';
import { Silhouette } from './Silhouette';
import './fiche.css';

/** Goûts du brasseur, en mémoire (maquette) : « j'aime » ou « pas pour moi » par houblon (D20). */
const GOUTS = new Map<string, 'aime' | 'non'>();

/** Mots des fiches d'une famille, dédoublonnés, les plus courts d'abord (3 au plus). */
function motsDe(h: HoublonLu) {
  const ref = hopRef(h.cle);
  if (!ref) return {} as Record<string, string[]>;
  const w = familyWords(ref.varietyId, ref.catalogue);
  return Object.fromEntries(FAMILIES.map((f) => {
    const vus = new Map<string, string>();
    for (const m of w.mots[f].flatMap((x) => x.mots)) { const k = m.toLowerCase(); if (!vus.has(k) && k !== COURT[f].toLowerCase()) vus.set(k, k); }
    return [f, [...vus.values()].slice(0, 3)];
  }));
}

function Gout({ cle }: { cle: string }) {
  const [g, setG] = useState(() => GOUTS.get(cle) ?? null);
  const poser = (v: 'aime' | 'non') => { const n = g === v ? null : v; if (n) GOUTS.set(cle, n); else GOUTS.delete(cle); setG(n); };
  const bouton = (v: 'aime' | 'non', icone: React.ReactNode, mot: string) => (
    <button type="button" aria-pressed={g === v} onClick={() => poser(v)} data-gout={v}
      className={`inline-flex items-center gap-1 h-8 px-2.5 rounded-full border text-sm ${g === v ? 'border-transparent bg-ebc-straw text-cave-950 font-semibold' : 'border-cave-700 text-cave-200'}`}>
      {icone}{mot}
    </button>
  );
  return (
    <div data-role="gout" role="group" aria-label="Mon goût" className="flex items-center gap-1.5">
      {bouton('aime', <Heart className="w-3.5 h-3.5" aria-hidden="true" />, 'j’aime')}
      {bouton('non', <Ban className="w-3.5 h-3.5" aria-hidden="true" />, 'pas pour moi')}
    </div>
  );
}

/** La fiche, ouverte sur un houblon. */
export function FicheHoublon({ cle, onFermer }: { cle: string; onFermer: () => void }) {
  const h = houblon(cle);
  const recette = useRecette();
  // Balisage des contrôles (D25) sur la feuille entière : data-role="fiche" (posé quand la feuille s'attache).
  const racine = useCallback((n: HTMLDivElement | null) => {
    const d = n?.closest('[role="dialog"]');
    d?.setAttribute('data-role', 'fiche');
    d?.setAttribute('data-houblon-fiche', cle);
  }, [cle]);
  // Hors de sa route (useFiche), la feuille passe par un portail qui peut s'attacher après ce rendu : la marque
  // est reposée à chaque image jusqu'à ce que la feuille existe (une demi-seconde au plus).
  useEffect(() => {
    let n = 0, id = 0;
    const poser = () => {
      const d = document.querySelector(`[data-houblon-ouvert="${CSS.escape(cle)}"]`)?.closest('[role="dialog"]');
      if (d) { d.setAttribute('data-role', 'fiche'); d.setAttribute('data-houblon-fiche', cle); return; }
      if (++n < 30) id = requestAnimationFrame(poser);
    };
    poser();
    return () => { cancelAnimationFrame(id); noterFermeture(); };
  }, [cle]);
  const mots = motsDe(h);
  const citees = FAMILIES.filter((f) => h.familles[f].niveau !== 'non décrit')
    .sort((a, b) => (h.familles[b].niveau === 'marqué' ? 1 : 0) - (h.familles[a].niveau === 'marqué' ? 1 : 0) || h.familles[b].fiches - h.familles[a].fiches);
  const dansRecette = recette.additions.filter((a) => a.hopKey === cle);
  const sansMots = h.motsSansFamille.filter((m, i, t) => t.findIndex((x) => x.toLowerCase() === m.toLowerCase()) === i).slice(0, 3);
  return (
    <Feuille ouverte titre={h.nom} onFermer={onFermer}>
      <div ref={racine} data-ecran="fiche" data-houblon-ouvert={cle} className="pq-fiche space-y-2">
        <div className="flex items-center gap-2">
          <button type="button" data-role="fermer-fiche" aria-label="Retour" onClick={onFermer}
            className="touch-target -ml-1 w-8 h-8 inline-flex items-center justify-center rounded-full text-cave-200">
            <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
          <span data-role="fiche-alpha" className="inline-flex items-baseline min-w-0">
            <AlphaLu h={h} mode="fiche" />
          </span>
          <span className="ml-auto inline-flex items-center gap-1.5">
            <Usage h={h} />
            {h.stock != null && h.stock > 0 && <span className="font-mono text-xs text-cave-400 whitespace-nowrap">{nombre(h.stock)} g</span>}
          </span>
        </div>

        <div className="grid grid-cols-[9.5rem_1fr] gap-2 items-start">
          <Silhouette h={h} taille={150} />
          <ul data-role="fiche-arome" aria-label="Arômes et sources" className="space-y-1 min-w-0">
            {citees.map((f) => (
              <li key={f} data-famille={f} className="min-w-0">
                <span className="flex items-center gap-1 text-sm leading-tight">
                  <Picto famille={f} taille={14} />
                  <span className={h.familles[f].niveau === 'marqué' ? 'font-semibold text-cave-50' : 'text-cave-200'}>{COURT[f]}</span>
                  <span className="font-mono text-xs text-cave-400" title="fiches qui la citent">{h.familles[f].fiches}/{h.familles[f].sur}</span>
                </span>
                {mots[f]?.length > 0 && <span className="block pl-[1.125rem] text-xs text-cave-400 truncate">{mots[f].join(', ')}</span>}
              </li>
            ))}
            {!citees.length && <li className="text-sm text-cave-400">aucune famille décrite</li>}
          </ul>
        </div>

        {h.partSansFamille != null && h.partSansFamille > 0 && (
          <p className="flex items-center gap-2 min-w-0">
            <Autres h={h} largeur={80} />
            <span className="text-xs text-cave-400 truncate">{sansMots.join(', ')}</span>
          </p>
        )}

        {dansRecette.map((a) => {
          const ibu = ibuAjout(a, recette).ibu;
          return (
            <p key={a.id} data-role="fiche-recette" className="flex items-center gap-1.5 text-sm text-cave-200">
              <span className="text-cave-400">ma bière</span>
              <span className="font-mono text-cave-50">{nombre(a.grams, 1)}<span className="font-sans"> g</span> · {nomMoment(quandDe(a, recette))}{ibu ? <> · {nombre(ibu.valeur)}<span className="font-sans text-cave-400"> IBU</span></> : null}</span>
            </p>
          );
        })}

        <Gout cle={cle} />
      </div>
    </Feuille>
  );
}

/** La fiche pour un écran qui n'a pas de route de fiche (Suggérer, Comparer…) : état local. */
export function useFiche() {
  const [cle, setCle] = useState<string | null>(null);
  const g = useGestesFiche(setCle);
  return { ...g, ouverte: cle, fermer: () => setCle(null), rendu: cle ? <FicheHoublon key={cle} cle={cle} onFermer={() => setCle(null)} /> : null };
}
