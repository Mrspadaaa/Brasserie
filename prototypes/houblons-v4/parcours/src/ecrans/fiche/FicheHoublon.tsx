// La fiche d'un houblon, reprise de g1, la fiche de la base qu'il a choisie (« la v1 est la meilleure » ; capture
// base/captures/consolide-fiche-390.png ; inventaire base/donnees/inventaire-fiche.json), et la fiche courte de Citra
// cryo (« Ça c'est très bien ») : une feuille presque pleine, le nom et son repère ⊙ (α d'un lot) ; l'α de la fiche la
// plus récente en gros (« α 11–14 % », Hopsteiner 2025), le lot à côté et la réglette de toutes les fiches ; l'usage en
// mots ; la note d'honnêteté de l'α (« α : plages de Citra en pellets ; la fiche du cryo manque. ») ; puis, avant la
// liste (D115, « Mettre le radargraph avant »), le grand radar légendé, ses flèches sur sa demande et sa bulle au toucher,
// et « + Floral 2/4  − Résineux 2/4 » ; ensuite le bloc des familles : la bande des 12 (« 1 seule fiche : Beer Maverick »
// à côté), chaque famille citée dans l'ordre de la bande, son picto au trait (D93), « 2/4 », « nommé en premier » quand
// une seule fiche la cite, ses mots ; « sans famille : … » (et sa part dessinée, D100) ; « n non décrites : … » ; enfin
// Styles › · Huiles › · Sources › · Substituts › repliés (Replis.tsx). En pied, ♡ ⊘ et « Comparer ».
// Fermée par une seule croix ronde en haut à droite (Feuille, la tête de g1 et D109), le fond assombri, Échap et le
// retour du téléphone. Emploi depuis un autre écran : export par défaut de index.tsx (<Fiche houblon={cle} />, fermée
// par le retour), ou useFiche() (état local). Chaque état de g1 porte data-etat (controle-etats.mjs, D124).
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
import { Replis } from './Replis';
import { nomSource, sourcesFiche, type SourcesFiche } from './sources';
import './fiche.css';

/** Goûts du brasseur, en mémoire (maquette) : « j'aime » ou « pas pour moi » par houblon (D20). */
const GOUTS = new Map<string, 'aime' | 'non'>();

/** Mots des fiches par famille (dédoublonnés), et les familles nommées en premier par une fiche. */
function motsDe(h: HoublonLu) {
  const ref = hopRef(h.cle);
  const vide = { mots: {} as Record<string, string[]>, premier: new Set<FamilyId>() };
  if (!ref) return vide;
  const w = familyWords(ref.varietyId, ref.catalogue);
  const mots = Object.fromEntries(FAMILIES.map((f) => {
    const vus = new Map<string, string>();
    for (const m of w.mots[f].flatMap((x) => x.mots)) { const k = m.toLowerCase(); if (!vus.has(k)) vus.set(k, k); }
    return [f, [...vus.values()]];
  }));
  return { mots, premier: new Set(FAMILIES.filter((f) => w.premier[f].length > 0)) };
}

function Gout({ cle, nom }: { cle: string; nom: string }) {
  const [g, setG] = useState(() => GOUTS.get(cle) ?? null);
  const poser = (v: 'aime' | 'non') => { const n = g === v ? null : v; if (n) GOUTS.set(cle, n); else GOUTS.delete(cle); setG(n); };
  // Les mots de g1 : « Aimer Nugget », et « Remettre neutre : Aimer Nugget » une fois posé (retoucher revient à neutre).
  const bouton = (v: 'aime' | 'non', icone: React.ReactNode, mot: string, etat: string) => (
    <button type="button" aria-pressed={g === v} aria-label={`${g === v ? 'Remettre neutre : ' : ''}${mot} ${nom}`}
      onClick={() => poser(v)} data-gout={v} data-etat={etat}
      className={`inline-flex items-center justify-center w-11 h-10 rounded-full ${g === v ? 'bg-ebc-straw text-cave-950' : 'text-cave-200'}`}>
      {icone}
    </button>
  );
  return (
    <div data-role="gout" role="group" aria-label={`Mon goût pour ${nom}`} className="inline-flex items-center gap-0.5 p-0.5 rounded-full bg-cave-850">
      {bouton('aime', <Heart className="w-4 h-4" aria-hidden="true" fill={g === 'aime' ? 'currentColor' : 'none'} />, 'Aimer', 'etat-fiche-aimer')}
      {bouton('non', <Ban className="w-4 h-4" aria-hidden="true" />, 'Exclure', 'etat-fiche-exclure')}
    </div>
  );
}

/** La réglette de g1 : la plage de chaque fiche sur 0 à 25 %, la plus récente foncée, mon lot en trait. */
function Reglette({ s, lot }: { s: SourcesFiche; lot: number | null }) {
  const x = (v: number) => `${(Math.max(0, Math.min(1, v / 25)) * 100).toFixed(1)}%`;
  return (
    <span role="img" aria-label={`plages des fiches${lot != null ? ` et mon lot ${nombre(lot, 1)} %` : ''}, sur 0 à 25 %`}
      className="relative self-center w-16 h-3 shrink-0">
      <i className="absolute inset-x-0 top-1 h-1 rounded-full bg-cave-800" />
      {s.alpha.map((a) => (
        <i key={a.source} className={`absolute top-0.5 h-2 rounded-sm ${a === s.alphaRecente ? 'bg-cave-200' : 'bg-cave-600'}`}
          style={{ left: x(a.min), width: `max(3px, calc(${x(a.max)} - ${x(a.min)}))` }} />
      ))}
      {lot != null && <i className="absolute -top-0.5 -bottom-0.5 w-[3px] -ml-[1.5px] rounded-sm bg-cave-50 ring-1 ring-cave-950" style={{ left: x(lot) }} />}
    </span>
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
  // La feuille passe par un portail qui peut s'attacher après ce rendu : ses marques (D25, inventaire g1, états de
  // controle-etats.mjs), sa largeur (dans le cadre de 768 px de la page à l'ordinateur, D10) et le focus (sur la fiche,
  // pas d'anneau sur « × » sans clavier) sont posés dès qu'elle existe.
  useEffect(() => {
    let n = 0, id = 0, obs: MutationObserver | null = null;
    const poser = () => {
      const d = racine?.closest('[role="dialog"]') as HTMLElement | null;
      const croix = d?.querySelector<HTMLElement>(':scope > header > button[aria-label="Fermer"]');
      if (d && croix) {
        d.setAttribute('data-role', 'fiche');
        d.setAttribute('data-houblon-fiche', cle);
        d.setAttribute('data-element', 'g1-feuille');
        d.setAttribute('data-etat', 'etat-fiche-ouverte');
        d.style.maxWidth = '48rem';
        d.style.marginInline = 'auto';
        d.querySelector('h2')?.setAttribute('data-element', 'g1-titre');
        croix.setAttribute('data-etat', 'etat-fiche-fermer-croix');
        // Une seule épaisseur de trait pour les icônes de la page (D83, S4) : 1,33 px rendu, comme les icônes de 16 px.
        const x = croix.querySelector('svg');
        if (x) { x.setAttribute('stroke-width', '1.6'); x.style.strokeWidth = '1.6'; }
        // Le fond assombri de la feuille (vaul) : le toucher qui la referme (g1 : « haut de la page assombri »).
        const voile = [...document.querySelectorAll<HTMLElement>('[data-vaul-overlay]')].pop();
        // Sous la feuille, la page est inerte (pointer-events: none hérité du corps, inert posé par la pile des modales de
        // l'app sur les enfants du corps, voile compris) : le toucher tombait sur <html>. Le voile reprend le toucher, pour que
        // le doigt touche ce qu'il voit ; il reste aria-hidden (rien à lire), et vaul le traite comme un toucher hors de la
        // feuille : elle se referme, comme avant.
        if (voile) {
          voile.setAttribute('data-etat', 'etat-fiche-fermer-fond');
          voile.style.pointerEvents = 'auto';
          voile.removeAttribute('inert');
          // La pile pose inert une fois, après l'ouverture : on le retire quand il arrive (elle ne le repose pas).
          obs = new MutationObserver(() => { if (voile.hasAttribute('inert')) voile.removeAttribute('inert'); });
          obs.observe(voile, { attributes: true, attributeFilter: ['inert'] });
        }
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
    return () => { cancelAnimationFrame(id); window.clearTimeout(t); obs?.disconnect(); };
  }, [cle, racine]);
  useEffect(() => () => noterFermeture(), [cle]);

  const { mots, premier } = motsDe(h);
  const s = sourcesFiche(cle);
  // g1 : les familles que cite au moins une fiche, dans l'ordre de la bande (le style : attendues d'abord).
  const cite = (f: FamilyId) => h.familles[f].niveau !== 'non décrit' && h.familles[f].fiches > 0;
  const citees = sc.order.filter(cite);
  const nonDecrites = sc.order.filter((f) => !cite(f));
  const nbAttendues = sc.order.filter((f) => sc.families[f].status === 'attendue').length;
  const sansMots = h.motsSansFamille.filter((m, i, t) => t.findIndex((x) => x.toLowerCase() === m.toLowerCase()) === i);
  const src = sourceAlpha(h);
  const recente = s?.alphaRecente ?? null;
  const p: [number, number] | null = recente ? [recente.min, recente.max] : h.alpha?.plage ?? null;
  const lot = src === 'lot' && h.alpha ? h.alpha.valeur : null;
  const texteAlpha = p ? `${plage(p[0], p[1])} %` : h.alpha ? `${nombre(h.alpha.valeur, 1)} %` : '?';
  // La note d'honnêteté de l'α (#131) : un cryo porte les plages de sa variété en pellets ; mon lot hors de toutes les
  // plages de ses fiches se dit.
  const noteAlpha = s?.cryo ? `α : plages de ${h.nom.replace(/\s*cryo$/i, '')} en pellets ; la fiche du cryo manque.`
    : lot != null && s && s.alpha.length && s.alpha.every((a) => lot < a.min || lot > a.max) ? `Mon lot ${nombre(lot, 1)} % : hors des plages de ses fiches.` : null;
  const compte = (f: FamilyId) => (h.familles[f].sur === 1 ? '' : `${h.familles[f].fiches}/${h.familles[f].sur}`);
  // Sa demande : la visée posée dans Ma bière face à ma bière, ou, sans visée, la demande dégustée (etat/visee.ts, D108).
  const sens = sensDe(visee, (f) => biere.profil[f].valeur?.centre ?? null);
  const demande = Object.entries(sens) as [FamilyId, Sens][];
  const comparer = () => {
    const liste = aComparer.includes(cle) ? aComparer : [...aComparer, cle];
    if (!aComparer.includes(cle)) gestes.basculerComparaison(cle);
    aller({ ecran: 'comparer', houblons: liste });
  };
  const dansRecette = recette.additions.some((a) => a.hopKey === cle);
  const pied = (
    <div data-element="g1-actions" className="flex items-center gap-2 py-1">
      <Gout cle={cle} nom={h.nom} />
      <button type="button" data-role="pont-comparer-fiche" data-outil="Comparer" data-etat="etat-fiche-comparer" onClick={comparer}
        aria-label={`Comparer ${h.nom} à d’autres houblons`}
        className="ml-auto h-11 px-5 rounded-full border border-cave-700 text-base font-semibold text-cave-50">Comparer</button>
    </div>
  );
  return (
    <Feuille ouverte titre={`${h.nom}${lot != null ? ' ⊙' : ''}`} onFermer={onFermer} pied={pied}>
      <div ref={refRacine} tabIndex={-1} data-ecran="fiche" data-houblon-ouvert={cle} className="pq-fiche space-y-3 outline-none">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span data-element="g1-alpha" role="group"
              aria-label={`Acides alpha ${texteAlpha}${recente ? ` (${nomSource(recente)})` : ''}${lot != null ? `, mon lot ${nombre(lot, 1)} %` : ''}`}
              className="inline-flex items-baseline gap-2 min-w-0">
              <span data-role="fiche-alpha" className="font-mono text-xl font-semibold text-cave-50 whitespace-nowrap">
                <span {...(lot == null ? { 'data-role': 'alpha', 'data-houblon': cle, 'data-source': 'fiches' } : {})}>
                  <span className="text-cave-400 font-sans font-normal">α</span>{' '}{texteAlpha}
                </span>
              </span>
              {lot != null && (
                <span data-role="alpha" data-houblon={cle} data-source="lot" className="text-sm text-cave-400 whitespace-nowrap">lot {nombre(lot, 1)}{' '}%</span>
              )}
              {s && s.alpha.length > 0 && <Reglette s={s} lot={lot} />}
            </span>
            <span data-element="g1-usage" className="ml-auto shrink-0"><Usage h={h} long /></span>
          </div>
          {noteAlpha && <p data-role="fiche-note-alpha" className="text-sm text-cave-400 leading-snug">{noteAlpha}</p>}
        </div>

        {/* D115 : « Mettre le radargraph avant » : le radar et sa demande ouvrent la fiche, la liste des familles suit. */}
        <div data-element="g1-radar"><RadarFiche h={h} demande={sens} /></div>

        {demande.length > 0 && (
          <p data-element="g1-demande" className="flex items-center justify-center gap-5 text-base text-cave-50">
            {demande.map(([f, v]) => (
              <span key={f} className="whitespace-nowrap">
                <b>{v === 'banni' ? 'banni' : v > 0 ? '+' : '−'} {COURT[f]}</b>{' '}
                <span className="text-cave-200">{!cite(f) ? 'inconnu' : h.familles[f].sur === 1 ? '1 seule fiche' : `${h.familles[f].fiches}/${h.familles[f].sur}`}</span>
              </span>
            ))}
          </p>
        )}

        <div data-element="g1-familles" className="rounded-lg bg-cave-900 border border-cave-800 p-2.5 space-y-2">
          <div className="flex items-center gap-2">
            <div data-element="g1-bande" role="img" aria-label={`Les familles citées par les fiches de ${h.nom}`} className="flex items-center gap-[3px]">
              {sc.order.map((f, i) => {
                const n = cite(f) ? h.familles[f].fiches : 0;
                return <i key={f} className={`block w-[13px] h-[18px] rounded-sm ${i === nbAttendues ? 'ml-1.5' : ''}`}
                  style={{ background: n === 0 ? 'rgb(var(--cave-800))' : COULEURS[f].base, opacity: n === 1 ? 0.45 : 1 }} />;
              })}
            </div>
            {s?.seuleFiche && <span data-role="fiche-seule" className="ml-auto text-xs text-cave-400 text-right whitespace-nowrap">1 seule fiche : {s.seuleFiche}</span>}
          </div>
          <ul data-role="fiche-arome" aria-label="Arômes et sources" className="space-y-1.5">
            {citees.map((f) => {
              const c = compte(f);
              const prem = h.familles[f].fiches === 1 && premier.has(f);
              return (
                <li key={f} data-famille={f} className="min-w-0">
                  <span className="flex items-center gap-1.5 text-base leading-tight">
                    <Picto famille={f} taille={18} />
                    <b className="font-semibold text-cave-50">{COURT[f]}</b>
                    {c && <span className="text-sm text-cave-200">{c}</span>}
                    {prem && <span data-element="g1-premier" className="text-sm text-cave-400">{c ? '· ' : ''}nommé en premier</span>}
                  </span>
                  {mots[f]?.length > 0 && <span className="block pl-[1.625rem] text-sm text-cave-200">{mots[f].join(', ')}</span>}
                </li>
              );
            })}
          </ul>
          {sansMots.length > 0 && (
            <p data-element="g1-sans-famille" className="flex items-center gap-2 pl-[1.625rem] text-sm text-cave-400 min-w-0">
              <span className="min-w-0">sans famille : {sansMots.join(', ')}</span>
              {h.partSansFamille != null && h.partSansFamille > 0 && <Autres h={h} largeur={48} petit />}
            </p>
          )}
          {nonDecrites.length > 0 && (
            <p data-element="g1-non-decrites" className="pl-[1.625rem] text-sm text-cave-400">
              {nonDecrites.length} non décrite{nonDecrites.length > 1 ? 's' : ''} : {nonDecrites.map((f) => COURT[f]).join(', ')}
            </p>
          )}
        </div>

        {s && <Replis h={h} cle={cle} s={s} recette={recette} onRemplacer={dansRecette ? () => aller({ ecran: 'substituer', houblon: cle }) : null} />}
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
