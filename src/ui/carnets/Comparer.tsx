/**
 * Comparer sur le critère, écartés visibles (R06, figé p2:g01-8 et ses compagnons v03-4, g05-8, h04-7, h06-7 ; R26, G20).
 * Le tableau est reçu en props : il est calculé par `comparer.ts` (lot A, `tableau(carnet)`) et passé par `CarnetsVue.tsx`.
 * À 0 ou 1 article, il vaut `null` : l'écran le dit (« le tableau naît au 2e article »), sans geste à faire.
 * Les articles sont en colonnes, les caractéristiques en lignes ; la meilleure valeur de chaque ligne est surlignée ;
 * « moins bien partout » marque un article dominé ; les écartés restent à la fin, grisés, avec leur raison (D-52).
 * Une valeur inconnue est une cellule vide (« – » discret), jamais 0. Choisir s'atteint d'ici seulement (MISSION « Rangé derrière »).
 * Correction 3 : à 390, une ombre de bord et « → n de plus » disent la suite à droite ; les écartés se lisent sous le tableau, nom et
 * raison (« Écartés · n », p2:h04-7), jamais une case vide ; un lien dont la page n'est pas lue s'écrit « Lien sans aperçu » (R04).
 */
import React from 'react';
import { ChevronLeft, Scale } from 'lucide-react';
import { nombreDe, type Tableau } from '../../domain/carnets/comparer';
import { montant, Provenance, rangTexte, STATUT_LIBELLE, valeurTexte, type ArticleV, type CritereV, type Sens, type StatutCarnet, type ValeurV } from './EtatIA';
import './carnets-decider.css';

/** Le tableau tel que `tableau(carnet)` de `comparer.ts` le rend (lot A, critère A9). */
export type TableauV = Tableau;
type LigneT = Tableau['lignes'][number];

/** Une colonne affichée : les caractéristiques des critères, puis le prix (sens moins, même devise). */
export interface ColonneVue { cle: string; nom: string; unite?: string; sens: Sens; critere: boolean }

export function colonnesVue(t: Tableau): ColonneVue[] {
  const cols: ColonneVue[] = t.colonnes.map((c, i) => ({ cle: c.nom, nom: c.nom, unite: c.unite, sens: c.sens, critere: i === 0 }));
  if (t.lignes.some(l => l.prixCentimes !== undefined)) cols.push({ cle: '__prix', nom: 'prix', unite: t.lignes.find(l => l.devise)?.devise ?? 'CHF', sens: 'moins', critere: false });
  return cols;
}

function nombre(v?: ValeurV): number | null {
  if (!v) return null;
  if (typeof v.valeur === 'boolean') return v.valeur ? 1 : 0;
  return nombreDe(v.valeur);
}
/** Texte d'une cellule ; `null` si inconnue (cellule vide, jamais 0). */
export function texteCellule(l: LigneT, c: ColonneVue): string | null {
  if (c.cle === '__prix') return montant(l.prixCentimes);
  return valeurTexte(l.cellules[c.cle]);
}
/** Les articles en lice qui tiennent la meilleure valeur connue de la colonne (surlignés) ; aucun si moins de 2 valeurs connues. */
export function meilleursDe(t: Tableau, c: ColonneVue): Set<string> {
  if (c.sens === 'texte') return new Set();
  const connus = t.lignes.filter(l => !l.ecarte).map(l => ({ id: l.articleId, n: c.cle === '__prix' ? (l.prixCentimes ?? null) : nombre(l.cellules[c.cle]) })).filter((x): x is { id: string; n: number } => x.n !== null);
  if (connus.length < 2) return new Set();
  const cible = c.sens === 'moins' ? Math.min(...connus.map(x => x.n)) : Math.max(...connus.map(x => x.n));
  return new Set(connus.filter(x => x.n === cible).map(x => x.id));
}

/** Le domaine d'un lien : `domaine` lu, sinon l'hôte de l'adresse (sans « www. ») ; `undefined` si rien ne le dit. */
export function domaineDe(a: Pick<ArticleV, 'domaine' | 'url'>): string | undefined {
  if (a.domaine?.trim()) return a.domaine.trim();
  if (!a.url) return undefined;
  try { return new URL(a.url).hostname.replace(/^www\./, '') || undefined; } catch { return undefined; }
}

/**
 * Un lien sans aperçu (même libellé que la carte R04) : sa page n'est pas lue et rien n'en est connu ; `null` s'il se nomme.
 * « Lien sans aperçu · <domaine> · page non lue » ; pendant la lecture, « <domaine> · lecture… ».
 */
export function sansApercu(a: Pick<ArticleV, 'lecture' | 'nom' | 'domaine' | 'url'>): { titre: string; sous: string; enCours: boolean } | null {
  if (a.lecture !== 'illisible' && (a.lecture === 'lue' || a.nom?.trim())) return null;
  const domaine = domaineDe(a);
  const enCours = a.lecture === 'en-cours' || a.lecture === 'a-lire';
  return { titre: enCours ? (domaine ?? 'Lien') : 'Lien sans aperçu', sous: `${domaine ? `${domaine} · ` : ''}${enCours ? 'lecture…' : 'page non lue'}`, enCours };
}

/** Pour `nonLus` : les articles dont la page n'est pas lue, par id, avec leur domaine (à passer par le conteneur). */
export type LienNonLu = Pick<ArticleV, 'lecture' | 'nom' | 'domaine' | 'url'>;
export function nonLusDe(articles: (LienNonLu & { id: string })[]): Record<string, LienNonLu> {
  const sortie: Record<string, LienNonLu> = {};
  for (const a of articles) if (sansApercu(a)) sortie[a.id] = { lecture: a.lecture, nom: a.nom, domaine: a.domaine, url: a.url };
  return sortie;
}

const HOTE = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
/**
 * Le libellé d'une colonne sans aperçu. Par `nonLus` quand le conteneur le donne ; sinon, une ligne qui ne porte que son domaine
 * pour nom (`nomArticle` retombe sur le domaine), sans aucune valeur ni prix, est un lien dont la page n'a pas été lue.
 */
export function apercuLigne(l: LigneT, nonLus?: Record<string, Pick<ArticleV, 'lecture' | 'nom' | 'domaine' | 'url'>>): { titre: string; sous: string } | null {
  const a = nonLus?.[l.articleId];
  if (a) return sansApercu(a);
  const rien = l.prixCentimes === undefined && !Object.values(l.cellules).some(Boolean);
  if (rien && HOTE.test(l.nom.trim())) return { titre: 'Lien sans aperçu', sous: `${l.nom.trim()} · page non lue` };
  return null;
}

export interface ComparerProps {
  titre: string;
  /** Les articles dont la page n'est pas lue (`nonLusDe(carnet.articles)`) : « Lien sans aperçu », jamais le domaine seul. */
  nonLus?: Record<string, Pick<ArticleV, 'lecture' | 'nom' | 'domaine' | 'url'>>;
  statut: StatutCarnet;
  critere?: CritereV;
  tableau: TableauV | null;
  /** Photo de chaque article, par id (en-têtes de colonne). */
  photos?: Record<string, string | undefined>;
  /** Vendeurs et prix de la fixture : « exemple » (le simulé est marqué). */
  exemple?: boolean;
  /** « Compromis : … » (de l'IA, cité seulement s'il existe ; jamais inventé ici). */
  compromis?: string;
  onRetour: () => void;
  onOuvrirArticle?: (articleId: string) => void;
  onChoisir?: () => void;
}

/**
 * « Il y a une suite à droite » : vrai tant que la zone défile encore vers la droite (fondu, 390). Mesuré au rendu, au défilement et
 * au redimensionnement ; sans ResizeObserver (jsdom), seulement au défilement.
 */
function useSuiteADroite(): [React.RefObject<HTMLDivElement | null>, number] {
  const ref = React.useRef<HTMLDivElement>(null);
  const [suite, setSuite] = React.useState(0);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    /* « → n de plus » : les colonnes d'article pas entièrement visibles à droite (la colonne des noms, collée, n'en est pas). */
    const mesurer = () => {
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 1) { setSuite(0); return; }
      const bord = el.getBoundingClientRect().right;
      const tetes = [...el.querySelectorAll('thead th')].slice(1);
      setSuite(Math.max(1, tetes.filter(th => th.getBoundingClientRect().right > bord + 1).length));
    };
    mesurer();
    el.addEventListener('scroll', mesurer, { passive: true });
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(mesurer) : null;
    ro?.observe(el);
    if (el.firstElementChild) ro?.observe(el.firstElementChild);
    return () => { el.removeEventListener('scroll', mesurer); ro?.disconnect(); };
  }, []);
  return [ref, suite];
}

export function Comparer(p: ComparerProps) {
  const t = p.tableau;
  const actifs = t ? t.lignes.filter(l => !l.ecarte) : [];
  const ecartes = t ? t.lignes.filter(l => l.ecarte) : [];
  const ordre = [...actifs, ...ecartes];
  const cols = t ? colonnesVue(t) : [];
  const [zone, suite] = useSuiteADroite();
  return (
    <article className="cn-page cn-comparer">
      <div className="cn-tete">
        <button type="button" className="cn-retour" onClick={p.onRetour}><ChevronLeft size={20} aria-hidden /> {p.titre}</button>
        <span className="cn-sp" />
        <span className={`cn-pastille cn-statut-${p.statut}`}>{STATUT_LIBELLE[p.statut]}</span>
      </div>
      <h2 className="cn-titre">{p.titre}</h2>
      {p.critere && (
        <p className="cn-mut">Ce qui compte <b className="cn-encre">{p.critere.texte}</b>{p.critere.origine === 'ia' ? ' · proposé par l\'IA' : ''}</p>
      )}
      {!t ? (
        <p className="cn-vide">Le tableau naît au 2e article : collez un 2e lien dans le champ.</p>
      ) : (
        <>
          <div className="cn-entete-groupe">
            <span className="cn-groupe">Côte à côte <span className="cn-mono">{actifs.length}</span></span>
            <span className="cn-sp" />
            {t.rangePar && <span className="cn-mut">rangé par : {t.rangePar}</span>}
          </div>
          {/* À 1280, tout tient (noms et raisons repliés) ; à 390, la colonne des noms reste fixe et un fondu dit la suite à droite. */}
          <div className="cn-tableau-cadre" data-suite={suite ? true : undefined}>
          <div className="cn-tableau-zone" ref={zone}>
            <table className="cn-tableau cn-tableau-comparer">
              <thead>
                <tr>
                  <th scope="col"><span className="cn-cache">Caractéristique</span></th>
                  {ordre.map(l => {
                    const sa = apercuLigne(l, p.nonLus);
                    return (
                      <th key={l.articleId} scope="col" className={l.ecarte ? 'cn-ecarte' : undefined} data-apercu={sa ? 'aucun' : undefined}>
                        <button type="button" className="cn-col-tete" onClick={() => p.onOuvrirArticle?.(l.articleId)} disabled={!p.onOuvrirArticle}>
                          {p.photos?.[l.articleId] ? <img src={p.photos[l.articleId]} alt="" className="cn-vignette" /> : null}
                          <b>{l.ecarte ? 'écarté' : l.rang ? rangTexte(l.rang) : ''}</b>
                          <span>{sa ? sa.titre : l.nom}</span>
                          {sa && <span className="cn-mut cn-sans-apercu">{sa.sous}</span>}
                          {l.moinsBienPartout && <span className="cn-pastille cn-pastille-att">moins bien partout</span>}
                        </button>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {cols.map(c => {
                  const meilleurs = meilleursDe(t, c);
                  return (
                    <tr key={c.cle} className={c.critere ? 'cn-ligne-critere' : undefined}>
                      <th scope="row">{c.nom}{c.unite ? <span className="cn-mut"> {c.unite}</span> : null}</th>
                      {ordre.map(l => {
                        const txt = texteCellule(l, c);
                        return (
                          <td key={l.articleId} className={`${meilleurs.has(l.articleId) ? 'cn-meilleur' : ''}${l.ecarte ? ' cn-ecarte' : ''}`}>
                            {txt ? <span className="cn-mono">{txt}</span> : <span className="cn-inconnu" aria-label="inconnu">–</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>
          {suite > 0 && <p className="cn-suite-indice" aria-hidden>→ {suite} de plus</p>}
          {p.compromis && <p className="cn-encart"><Scale size={18} role="img" aria-label="Compromis" /> <span><Provenance origine="ia" /> {p.compromis}</span></p>}
          {/* La ligne « Écarté » (D-52) : chaque écarté, son nom et sa raison, lisibles sans défiler (p2:h04-7) ; aucun écarté, aucune ligne. */}
          {ecartes.length > 0 && (
            <table className="cn-ecartes" aria-label={`Écartés, ${ecartes.length}`}>
              <caption>Écartés · <span className="cn-mono">{ecartes.length}</span></caption>
              <tbody>
                {ecartes.map(l => {
                  const sa = apercuLigne(l, p.nonLus);
                  return (
                    <tr key={l.articleId}>
                      <th scope="row">{sa ? `${sa.titre} · ${sa.sous}` : l.nom}</th>
                      <td className="cn-ecarte cn-ecarte-raison">{l.ecarte!.raison.trim() || 'sans raison notée'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {p.exemple && <p className="cn-mut">Valeurs annoncées par les vendeurs · <Provenance origine="exemple" /></p>}
          {p.onChoisir && p.statut !== 'validated' && <button type="button" className="cn-action" onClick={p.onChoisir}>Choisir</button>}
        </>
      )}
    </article>
  );
}
