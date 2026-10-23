// La fiche d'un houblon, reprise de g1, la fiche de la base qu'il a choisie (« la v1 est la meilleure » ; capture
// base/captures/consolide-fiche-390.png ; inventaire base/donnees/inventaire-fiche.json) : une feuille presque pleine,
// le nom et son repère ⊙ (α d'un lot), l'α en plage des fiches en gros, le lot à côté et sa jauge, l'usage en mots ;
// puis, avant la liste (D115, « Mettre le radargraph avant »), le grand radar légendé et ses flèches sur sa demande,
// et « + Floral 2/4  − Résineux 2/4 » ; ensuite le bloc gris des familles : la bande des 12, chaque famille citée avec
// son picto au trait (D93), « 2/4 », ses mots, « nommé en premier » ; « sans famille : … » (et sa part dessinée,
// D100) ; « n non décrites : … » ; en pied, ♡ ⊘ et « Comparer ».
// Fermée par une seule croix ronde en haut à droite (Feuille, la tête de g1 et D109), Échap et le retour du téléphone. Emploi depuis un autre écran : export par défaut de index.tsx
// (<Fiche houblon={cle} />, fermée par le retour), ou useFiche() (état local).
import { useCallback, useEffect, useState } from 'react';
import { Ban, Heart } from 'lucide-react';
import { COULEURS, COURT, FAMILIES, Feuille, Picto, nombre, plage } from '../../commun';
import { useNavigation } from '../../coquille/navigation';
import { useBiere, useComparaison, useGestes, useRecette, useVisee } from '../../etat/EtatParcours';
import { sensDe, type Sens } from '../../etat/visee';
import { houblon, style, type HoublonLu } from '../../moteur';
import { familyWords, hopRef, type FamilyId } from '../../../../src/engine';
import { Autres, sourceAlpha, Usage } from './briques';
import { noterFermeture, useGestesFiche } from './gestes';
import { RadarFiche } from './RadarFiche';
import './fiche.css';

/** Goûts du brasseur, en mémoire (maquette) : « j'aime » ou « pas pour moi » par houblon (D20). */
const GOUTS = new Map<string, 'aime' | 'non'>();

/** Mots des fiches par famille (dédoublonnés, 3 au plus), et les familles nommées en premier. */
function motsDe(h: HoublonLu) {
  const ref = hopRef(h.cle);
  const vide = { mots: {} as Record<string, string[]>, premier: new Set<FamilyId>() };
  if (!ref) return vide;
  const w = familyWords(ref.varietyId, ref.catalogue);
  const mots = Object.fromEntries(FAMILIES.map((f) => {
    const vus = new Map<string, string>();
    for (const m of w.mots[f].flatMap((x) => x.mots)) { const k = m.toLowerCase(); if (!vus.has(k)) vus.set(k, k); }
    return [f, [...vus.values()].slice(0, 4)];
  }));
  return { mots, premier: new Set(FAMILIES.filter((f) => w.premier[f].length > 0)) };
}

function Gout({ cle }: { cle: string }) {
  const [g, setG] = useState(() => GOUTS.get(cle) ?? null);
  const poser = (v: 'aime' | 'non') => { const n = g === v ? null : v; if (n) GOUTS.set(cle, n); else GOUTS.delete(cle); setG(n); };
  const bouton = (v: 'aime' | 'non', icone: React.ReactNode, mot: string) => (
    <button type="button" aria-pressed={g === v} aria-label={mot} onClick={() => poser(v)} data-gout={v}
      className={`inline-flex items-center justify-center w-10 h-9 rounded-full ${g === v ? 'bg-ebc-straw text-cave-950' : 'text-cave-200'}`}>
      {icone}
    </button>
  );
  return (
    <div data-role="gout" role="group" aria-label="Mon goût" className="inline-flex items-center gap-0.5 p-0.5 rounded-full bg-cave-850">
      {bouton('aime', <Heart className="w-4 h-4" aria-hidden="true" />, 'J’aime')}
      {bouton('non', <Ban className="w-4 h-4" aria-hidden="true" />, 'Pas pour moi')}
    </div>
  );
}

/** La fiche, ouverte sur un houblon. */
export function FicheHoublon({ cle, onFermer }: { cle: string; onFermer: () => void }) {
  const h = houblon(cle);
  const recette = useRecette();
  const visee = useVisee();
  const biere = useBiere();
  const sc = style(recette.styleCode);
  const aComparer = useComparaison();
  const gestes = useGestes();
  const { aller } = useNavigation();
  const [racine, setRacine] = useState<HTMLDivElement | null>(null);
  const refRacine = useCallback((n: HTMLDivElement | null) => setRacine(n), []);
  // La feuille passe par un portail qui peut s'attacher après ce rendu : ses marques (D25, inventaire g1), sa largeur
  // (dans le cadre de 768 px de la page à l'ordinateur, D10) et le focus (sur la fiche, pas d'anneau sur « × » sans
  // clavier) sont posés dès qu'elle existe.
  useEffect(() => {
    let n = 0, id = 0;
    const poser = () => {
      const d = racine?.closest('[role="dialog"]') as HTMLElement | null;
      if (d) {
        d.setAttribute('data-role', 'fiche');
        d.setAttribute('data-houblon-fiche', cle);
        d.setAttribute('data-element', 'g1-feuille');
        d.style.maxWidth = '48rem';
        d.style.marginInline = 'auto';
        d.querySelector('h2')?.setAttribute('data-element', 'g1-titre');
        const f = document.activeElement as HTMLElement | null;
        if (f && d.contains(f) && f.getAttribute('aria-label') === 'Fermer') racine?.focus({ preventScroll: true });
        return;
      }
      if (++n < 30) id = requestAnimationFrame(poser);
    };
    poser();
    // vaul pose le focus sur « × » après l'ouverture : on le reprend une fois, un instant plus tard.
    const t = window.setTimeout(() => {
      const f = document.activeElement as HTMLElement | null;
      if (f && racine && f.getAttribute('aria-label') === 'Fermer' && racine.closest('[role="dialog"]')?.contains(f)) racine.focus({ preventScroll: true });
    }, 400);
    return () => { cancelAnimationFrame(id); window.clearTimeout(t); };
  }, [cle, racine]);
  useEffect(() => () => noterFermeture(), [cle]);

  const { mots, premier } = motsDe(h);
  const citees = sc.order.filter((f) => h.familles[f].niveau !== 'non décrit')
    .sort((a, b) => (h.familles[b].niveau === 'marqué' ? 1 : 0) - (h.familles[a].niveau === 'marqué' ? 1 : 0) || h.familles[b].fiches - h.familles[a].fiches);
  const nonDecrites = sc.order.filter((f) => h.familles[f].niveau === 'non décrit');
  const sansMots = h.motsSansFamille.filter((m, i, t) => t.findIndex((x) => x.toLowerCase() === m.toLowerCase()) === i).slice(0, 4);
  const src = sourceAlpha(h);
  const p = h.alpha?.plage ?? null;
  const lot = src === 'lot' && h.alpha ? h.alpha.valeur : null;
  // Sa demande : la visée posée dans Ma bière face à ma bière, ou, sans visée, la demande dégustée (etat/visee.ts, D108).
  const sens = sensDe(visee, (f) => biere.profil[f].valeur?.centre ?? null);
  const demande = Object.entries(sens) as [FamilyId, Sens][];
  const comparer = () => {
    const liste = aComparer.includes(cle) ? aComparer : [...aComparer, cle];
    if (!aComparer.includes(cle)) gestes.basculerComparaison(cle);
    aller({ ecran: 'comparer', houblons: liste });
  };
  const pied = (
    <div data-element="g1-actions" className="flex items-center gap-2 py-1">
      <Gout cle={cle} />
      <button type="button" data-role="pont-comparer-fiche" data-outil="Comparer" onClick={comparer}
        className="ml-auto h-10 px-5 rounded-full border border-cave-700 text-base font-semibold text-cave-50">Comparer</button>
    </div>
  );
  return (
    <Feuille ouverte titre={`${h.nom}${lot != null ? ' ⊙' : ''}`} onFermer={onFermer} pied={pied}>
      <div ref={refRacine} tabIndex={-1} data-ecran="fiche" data-houblon-ouvert={cle} className="pq-fiche space-y-3 outline-none">
        <div className="flex items-center gap-2">
          <span data-element="g1-alpha" className="inline-flex items-baseline gap-2 min-w-0 flex-wrap">
            <span data-role="fiche-alpha" className="font-mono text-2xl font-semibold text-cave-50 whitespace-nowrap">
              <span {...(lot == null ? { 'data-role': 'alpha', 'data-houblon': cle, 'data-source': 'fiches' } : {})}>α{' '}{p ? plage(p[0], p[1]) : h.alpha ? nombre(h.alpha.valeur, 1) : '?'}{' '}%</span>
            </span>
            {lot != null && (
              <span data-role="alpha" data-houblon={cle} data-source="lot" className="text-sm text-cave-400 whitespace-nowrap">lot {nombre(lot, 1)}{' '}%</span>
            )}
            {lot != null && p && (
              <span role="img" aria-label={`lot dans la plage ${plage(p[0], p[1])} %`} className="relative self-center w-16 h-2 rounded-full bg-cave-800">
                <i className="absolute inset-y-0 rounded-full bg-cave-600" style={{ left: '15%', width: '70%' }} />
                <i className="absolute -top-1 -bottom-1 w-1 rounded-sm bg-cave-50" style={{ left: `${Math.max(0, Math.min(100, 15 + ((lot - p[0]) / Math.max(0.1, p[1] - p[0])) * 70)).toFixed(0)}%` }} />
              </span>
            )}
          </span>
          <span data-element="g1-usage" className="ml-auto shrink-0"><Usage h={h} long /></span>
        </div>

        {/* D115 : « Mettre le radargraph avant » : le radar et sa demande ouvrent la fiche, la liste des familles suit. */}
        <div data-element="g1-radar"><RadarFiche h={h} demande={sens} /></div>

        {demande.length > 0 && (
          <p data-element="g1-demande" className="flex items-center justify-center gap-5 text-base text-cave-50">
            {demande.map(([f, v]) => (
              <span key={f} className="whitespace-nowrap">
                <b>{v === 'banni' ? 'banni' : v > 0 ? '+' : '−'} {COURT[f]}</b>{' '}
                <span className="text-cave-200">{h.familles[f].niveau === 'non décrit' ? '?' : `${h.familles[f].fiches}/${h.familles[f].sur}`}</span>
              </span>
            ))}
          </p>
        )}

        <div data-element="g1-familles" className="rounded-lg bg-cave-900 border border-cave-800 p-2.5 space-y-2">
          <div data-element="g1-bande" role="img" aria-label="Les 12 familles" className="flex gap-0.5">
            {sc.order.map((f) => {
              const n = h.familles[f].niveau;
              return <i key={f} className="block flex-1 max-w-[1.5rem] h-5 rounded-sm" style={{ background: n === 'non décrit' ? 'rgb(var(--cave-800))' : COULEURS[f].base, opacity: n === 'cité' ? 0.6 : 1 }} />;
            })}
          </div>
          <ul data-role="fiche-arome" aria-label="Arômes et sources" className="space-y-1.5">
            {citees.map((f) => (
              <li key={f} data-famille={f} className="min-w-0">
                <span className="flex items-center gap-1.5 text-base leading-tight">
                  <Picto famille={f} taille={18} />
                  <b className="font-semibold text-cave-50">{COURT[f]}</b>
                  <span className="text-sm text-cave-200">{h.familles[f].fiches}/{h.familles[f].sur}</span>
                  {premier.has(f) && <span data-element="g1-premier" className="text-sm text-cave-400">· nommé en premier</span>}
                </span>
                {mots[f]?.length > 0 && <span className="block pl-[1.625rem] text-sm text-cave-200 truncate">{mots[f].join(', ')}</span>}
              </li>
            ))}
          </ul>
          {sansMots.length > 0 && (
            <p data-element="g1-sans-famille" className="flex items-center gap-2 pl-[1.625rem] text-sm text-cave-400 min-w-0">
              <span className="truncate">sans famille : {sansMots.join(', ')}</span>
              {h.partSansFamille != null && h.partSansFamille > 0 && <Autres h={h} largeur={48} petit />}
            </p>
          )}
          {nonDecrites.length > 0 && (
            <p data-element="g1-non-decrites" className="pl-[1.625rem] text-sm text-cave-400">
              {nonDecrites.length} non décrite{nonDecrites.length > 1 ? 's' : ''} : {nonDecrites.map((f) => COURT[f]).join(', ')}
            </p>
          )}
        </div>
      </div>
    </Feuille>
  );
}

/** La fiche pour un écran qui n'a pas de route de fiche : état local. */
export function useFiche() {
  const [cle, setCle] = useState<string | null>(null);
  const g = useGestesFiche(setCle);
  return { ...g, ouverte: cle, fermer: () => setCle(null), rendu: cle ? <FicheHoublon key={cle} cle={cle} onFermer={() => setCle(null)} /> : null };
}
