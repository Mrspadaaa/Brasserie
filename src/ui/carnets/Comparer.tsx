/**
 * Comparer sur le critère, écartés visibles (R06, figé p2:g01-8 et ses compagnons v03-4, g05-8, h04-7, h06-7 ; R26, G20).
 * Le tableau est reçu en props : il est calculé par `comparer.ts` (lot A, `tableau(carnet)`) et passé par `CarnetsVue.tsx`.
 * À 0 ou 1 article, il vaut `null` : l'écran le dit (« le tableau naît au 2e article »), sans geste à faire.
 * Les articles sont en colonnes, les caractéristiques en lignes ; la meilleure valeur de chaque ligne est surlignée ;
 * « moins bien partout » marque un article dominé ; les écartés restent à la fin, grisés, avec leur raison (D-52).
 * Une valeur inconnue est une cellule vide (« – » discret), jamais 0. Choisir s'atteint d'ici seulement (MISSION « Rangé derrière »).
 */
import React from 'react';
import { ChevronLeft, Scale } from 'lucide-react';
import type { Tableau } from '../../domain/carnets/comparer';
import { montant, Provenance, rangTexte, STATUT_LIBELLE, valeurTexte, type CritereV, type Sens, type StatutCarnet, type ValeurV } from './EtatIA';

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
  if (typeof v.valeur === 'number') return Number.isFinite(v.valeur) ? v.valeur : null;
  if (typeof v.valeur === 'boolean') return v.valeur ? 1 : 0;
  return null;
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

export interface ComparerProps {
  titre: string;
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

export function Comparer(p: ComparerProps) {
  const t = p.tableau;
  const actifs = t ? t.lignes.filter(l => !l.ecarte) : [];
  const ecartes = t ? t.lignes.filter(l => l.ecarte) : [];
  const ordre = [...actifs, ...ecartes];
  const cols = t ? colonnesVue(t) : [];
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
          <div className="cn-tableau-zone">
            <table className="cn-tableau">
              <thead>
                <tr>
                  <th scope="col"><span className="cn-cache">Caractéristique</span></th>
                  {ordre.map(l => (
                    <th key={l.articleId} scope="col" className={l.ecarte ? 'cn-ecarte' : undefined}>
                      <button type="button" className="cn-col-tete" onClick={() => p.onOuvrirArticle?.(l.articleId)} disabled={!p.onOuvrirArticle}>
                        {p.photos?.[l.articleId] ? <img src={p.photos[l.articleId]} alt="" className="cn-vignette" /> : null}
                        <b>{l.ecarte ? 'écarté' : l.rang ? rangTexte(l.rang) : ''}</b>
                        <span>{l.nom}</span>
                        {l.moinsBienPartout && <span className="cn-pastille cn-pastille-att">moins bien partout</span>}
                      </button>
                    </th>
                  ))}
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
                {ecartes.length > 0 && (
                  <tr>
                    <th scope="row">Écarté</th>
                    {ordre.map(l => <td key={l.articleId} className="cn-ecarte">{l.ecarte ? l.ecarte.raison : ''}</td>)}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {p.compromis && <p className="cn-encart"><Scale size={18} aria-hidden /> <span><Provenance origine="ia" /> {p.compromis}</span></p>}
          {p.exemple && <p className="cn-mut">Valeurs annoncées par les vendeurs · <Provenance origine="exemple" /></p>}
          {p.onChoisir && p.statut !== 'validated' && <button type="button" className="cn-action" onClick={p.onChoisir}>Choisir</button>}
        </>
      )}
    </article>
  );
}
