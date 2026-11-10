// Toucher « ⌕ » sur une donnée non documentée LANCE la recherche (maquette l5b : « recherche… · 3/20 » dans la cellule même ; sa parole du
// 09.11 : « SI on clic dessus, ça fait un appel de recherche ia »). Un seul crochet, partagé : Ma levure, Comparer et Suggérer l'appellent
// par `onChercherDonnee` ; chaque cellule lit son état par `useEtatRecherche`. On reste sur la vue en cours.
//  - la recherche est l'enrichissement IA existant d'une fiche de levure (`lookupYeastSheet`, tâche « lookupIngredient ») ;
//  - elle compte au plafond du jour (D378 : 20 par jour, `PLAFOND_JOUR`), affiché « n/20 » ; au plafond, rien ne part ;
//  - le résultat est « à confirmer » : il n'entre dans la recette que si le brasseur le retient (« Retenir ») ; l'inconnu reste inconnu sinon ;
//  - Gemini n'est jamais appelé par les tests : ils injectent `lookup`.
import { createContext, createElement, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import type { YeastSpec } from '../../types';
import type { YeastReference } from '../../domain/yeastReferences';
import type { YeastTechnicalFact } from '../../../functions/src/yeastTechnicalFacts';
import { PLAFOND_JOUR, jourDeZurich } from '../../services/enrichissementReglages';

export type StatutRecherche = 'cours' | 'a-confirmer' | 'retenu' | 'rien' | 'erreur' | 'plafond';
export interface EtatRecherche { statut: StatutRecherche; n: number; texte?: string; source?: string; message?: string; /** Le texte court de la cellule ; le détail (`message`) va dans le `title`. */ court?: string; fait?: YeastTechnicalFact }
/** Le mot court d'une issue pour la cellule : jamais une phrase, le détail reste dans le `title` (verdict final L-a). */
const courtDe = (statut: StatutRecherche, message = '', n = 0) => statut === 'plafond' ? `${n}/${PLAFOND_JOUR} aujourd’hui` : statut === 'rien' ? 'rien de publié'
  : /indisponible|interrompu|réseau|connexion|délai/i.test(message) ? 'IA indisponible' : 'recherche impossible';
type Reponse = { ok: true; facts: { technicalFacts?: YeastTechnicalFact[] } } | { ok: false; error: string };
export type Recherche = (levure: YeastSpec) => Promise<Reponse>;

/** Les faits de la fiche qui répondent à chaque axe (clés des faits techniques). */
const CLES: Record<string, string[]> = {
  esters: ['esters', 'aroma'], phenols: ['pof', 'aroma'], thiols: ['biotransformation', 'betaLyase'], terpenes: ['biotransformation'],
  rondeur: ['residualSugar', 'glycerol'], clarte: ['flocculation'], attenuation: ['attenuation'], tolerance: ['alcoholTolerance'],
  temperature: ['temperature'], vitesse: ['fermentationRate'], soufre: ['h2s'], nutriments: ['nutrientNeed'],
};
const cleDe = (levureId: string, axe: string) => `${levureId}:${axe}`;
const cleJour = () => `laffinee.rechercheDonnee.${jourDeZurich(Date.now())}`;
const lireCompte = () => { try { return Number(window.localStorage.getItem(cleJour())) || 0; } catch { return 0; } };
const ecrireCompte = (n: number) => { try { window.localStorage.setItem(cleJour(), String(n)); } catch { /* compte de la session seulement */ } };
const rechercheParDefaut: Recherche = async levure => (await import('../RecipeAutoComplete')).lookupYeastSheet(levure);

/** La fiche minimale envoyée à la recherche : identité du catalogue seule, ni dose ni lot. */
export const specDeLevure = (levure: YeastReference): YeastSpec =>
  ({ name: levure.name, hopIndexId: levure.id, form: levure.form, lab: levure.catalogue?.manufacturer } as YeastSpec);

export interface CrochetRecherche {
  etat: (levureId: string, axe: string) => EtatRecherche | undefined;
  chercher: (levure: YeastReference, axe: string, spec?: YeastSpec) => void;
  ecarter: (levureId: string, axe: string) => void;
  retenir: (levureId: string, axe: string) => void;
}

/** Le crochet : l'état de chaque recherche (par levure et par axe) et les gestes. `onRetenir` écrit le fait dans la recette (sa levure seule). */
export function useRechercheDonnee({ lookup = rechercheParDefaut, onRetenir }: { lookup?: Recherche; onRetenir?: (levureId: string, fait: YeastTechnicalFact) => boolean | void } = {}): CrochetRecherche {
  const [etats, setEtats] = useState<Record<string, EtatRecherche>>({});
  const enCours = useRef(new Set<string>());
  const mettre = useCallback((cle: string, etat?: EtatRecherche) => setEtats(s => { const { [cle]: _, ...reste } = s; return etat ? { ...reste, [cle]: etat } : reste; }), []);
  const chercher = useCallback((levure: YeastReference, axe: string, spec?: YeastSpec) => {
    const cle = cleDe(levure.id, axe);
    if (enCours.current.has(cle)) return;
    const deja = lireCompte();
    if (deja >= PLAFOND_JOUR) { mettre(cle, { statut: 'plafond', n: deja, court: courtDe('plafond', '', deja), message: `${deja}/${PLAFOND_JOUR} recherches aujourd’hui : reprends demain, ou saisis la valeur à la main.` }); return; }
    const n = deja + 1;
    ecrireCompte(n); enCours.current.add(cle);
    mettre(cle, { statut: 'cours', n });
    lookup(spec ?? specDeLevure(levure)).then(rep => {
      if (rep.ok === false) { mettre(cle, { statut: 'erreur', n, court: courtDe('erreur', (rep as { error: string }).error), message: (rep as { error: string }).error }); return; }
      const fait = ((rep as { facts: { technicalFacts?: YeastTechnicalFact[] } }).facts.technicalFacts ?? []).find(f => (CLES[axe] ?? []).includes(f.key));
      mettre(cle, fait ? { statut: 'a-confirmer', n, texte: fait.reported, source: fait.source, fait } : { statut: 'rien', n, court: courtDe('rien'), message: 'Rien de publié sur cette donnée.' });
    }, () => mettre(cle, { statut: 'erreur', n, court: courtDe('erreur', 'interrompue'), message: 'Recherche interrompue. Tu peux réessayer.' })).finally(() => enCours.current.delete(cle));
  }, [lookup, mettre]);
  const etat = useCallback((levureId: string, axe: string) => etats[cleDe(levureId, axe)], [etats]);
  const ecarter = useCallback((levureId: string, axe: string) => mettre(cleDe(levureId, axe)), [mettre]);
  const retenir = useCallback((levureId: string, axe: string) => {
    const courant = etats[cleDe(levureId, axe)];
    if (!courant?.fait) return;
    const ok = onRetenir ? onRetenir(levureId, courant.fait) : true;
    if (ok !== false) mettre(cleDe(levureId, axe), { ...courant, statut: 'retenu' });
  }, [etats, onRetenir, mettre]);
  return useMemo(() => ({ etat, chercher, ecarter, retenir }), [etat, chercher, ecarter, retenir]);
}

const Contexte = createContext<CrochetRecherche | undefined>(undefined);
export const FournisseurRecherche = ({ crochet, children }: { crochet: CrochetRecherche; children: ReactNode }) => createElement(Contexte.Provider, { value: crochet }, children);
/** L'état de la recherche d'une cellule (levure, axe) ; `undefined` : rien n'a été lancé. Lu par Ma levure, Comparer et Suggérer. */
export const useEtatRecherche = (levureId: string | undefined, axe: string) => {
  const c = useContext(Contexte);
  return { etat: levureId ? c?.etat(levureId, axe) : undefined, crochet: c };
};

/** Ce que la cellule dit pendant et après la recherche (maquette l5b : « recherche… · 3/20 », puis la valeur « à confirmer »). */
export function CelluleRecherche({ levureId, axe, retenable = true, libelle }: { levureId: string; axe: string; retenable?: boolean; /** Le nom de la donnée devant l'état (« floculation · recherche… 3/20 ») quand la cellule n'est plus sous son étiquette. */ libelle?: string }) {
  const { etat, crochet } = useEtatRecherche(levureId, axe);
  if (!etat) return null;
  const nom = libelle ? <span className="lv-rech-nom">{libelle} ·</span> : null;
  if (etat.statut === 'cours') return <span className="lv-ch lv-rech lv-cours" role="status" data-recherche="cours">{nom}<span className="lv-spin" aria-hidden="true" /><span>recherche…</span> <span className="lv-cpt">{etat.n}/{PLAFOND_JOUR}</span></span>;
  if (etat.statut === 'a-confirmer' || etat.statut === 'retenu') return <span className="lv-rech lv-trouve" data-recherche={etat.statut} title={etat.source}>
    {nom}<b>{etat.texte}</b> <span className="lv-conf">{etat.statut === 'retenu' ? 'retenu' : 'à confirmer'}</span>
    {etat.statut === 'a-confirmer' && <>{retenable && <button type="button" className="lv-lien" onClick={() => crochet?.retenir(levureId, axe)}>Retenir</button>}
      <button type="button" className="lv-lien" onClick={() => crochet?.ecarter(levureId, axe)}>Écarter</button></>}</span>;
  return <span className="lv-ch lv-rech" role="status" data-recherche={etat.statut} title={etat.message}>{nom}<Search size={12} aria-hidden="true" className="lv-rech-ico" /><span>{etat.court ?? etat.message}</span>
    <button type="button" className="lv-lien" onClick={() => crochet?.ecarter(levureId, axe)}>OK</button></span>;
}
