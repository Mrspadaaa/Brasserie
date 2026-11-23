/**
 * Comparer (s5a, choisie le 09.11) : les colonnes du Comparer houblons (« colonnes comme Comparer houblons ça j'aime bien »),
 * la référence teintée, les effets de fermentation EN TÊTE (esters, phénols, houblon, sucres restants), puis la fiche
 * (atténuation, température avec la visée, floculation) et « Ma bière » (FG, alcool). Une donnée manquante est une cellule
 * « ⌕ chercher » : un toucher appelle `onChercherDonnee`, rien d'autre. Les valeurs viennent de l'API du domaine.
 * Classes `lvv-` (L26) ; icônes lucide comme le reste de l'app.
 */
import { useMemo, useState } from 'react';
import { ArrowLeftRight, Droplet, Package, Plus, Search, X } from 'lucide-react';
import { abvFromGravities } from '../../domain/gravityBounds';
import type { YeastReference } from '../../domain/yeastReferences';
import type { IdAxe, Niveau, ValeurAxe } from '../../domain/levure/contrat';
import type { YeastSpec } from '../../types';
import type { YeastSupply } from '../../../functions/src/yeastSupplySchema';
import type { TrialRecipe } from '../../domain/hopIndex/trials';
import { Sheet } from '../Sheet';
import { doseDeLaLevure } from './dose';
import { CelluleRecherche, useEtatRecherche } from './useRechercheDonnee';
import {
  A_HI, A_LO, AROMES, Dispo, Ico, ORDRE_NIVEAU, T_HI, apiDe, barre, cx, fabricantDe, fabricantUtile, mil, nomCourt, pct, plageDe, styleArome, textePlage,
  type ApiVue, type PropsAvecApi,
} from './Chercher';
import './vues.css';

const MAX_COLONNES = 3;
const NIVEAU_FLOC: Record<Niveau, string> = { faible: 'faible', moyen: 'moyenne', eleve: 'haute' };
const NIVEAU_MOT: Record<Niveau, string> = { faible: 'faibles', moyen: 'moyens', eleve: 'élevés' };
const nb = (x: number, d = 1) => String(Math.round(x * 10 ** d) / 10 ** d).replace('.', ',');

/** Une colonne : la fiche, et si c'est la référence (la levure de la recette). */
interface Colonne { levure: YeastReference; ref: boolean; indice: number }

/** Une cellule sans donnée : « ⌕ » qui lance la recherche (la coque) ; pendant et après, la cellule dit « recherche… n/20 » puis la valeur « à confirmer ». */
function CelluleInconnue({ c, axe, texte, touche, onToucher }: { c: Colonne; axe: string; texte: string; touche: boolean; onToucher: () => void }) {
  const { etat } = useEtatRecherche(c.levure.id, axe);
  if (etat) return <div className={cx('lvv-cell lvv-inc lvv-touche lvv-inc-etat', `lvv-c${c.indice + 1}`)}><CelluleRecherche levureId={c.levure.id} axe={axe} /></div>;
  return (
    <button type="button" className={cx('lvv-cell lvv-inc', `lvv-c${c.indice + 1}`, touche && 'lvv-touche')} aria-label={`${texte} : ${nomCourt(c.levure)}, chercher`} onClick={onToucher}>
      <Ico de={Search} t={12} />{texte}
    </button>
  );
}

/** Le titre d'une colonne : le code quand le nom en porte un (« 1056 American Ale » → « 1056 »), le fabricant dessous ; sinon le nom court. */
const codeColonne = (l: YeastReference): string => {
  const nom = nomCourt(l);
  const premier = nom.split(' ')[0];
  return /\d/.test(premier) ? premier : nom;
};

/** Ce que Comparer ajoute à `PropsAvecApi` pour la ligne Dose : la recette et le produit/offres (la coque les a ; la règle est `dose.ts`). */
export type PropsComparer = PropsAvecApi & { recette?: TrialRecipe; supply?: YeastSupply };

export function Comparer(props: PropsComparer) {
  const { recette, supply, base, reperes, comparees, onComparees, onVue, onChercherDonnee } = props;
  const api = apiDe(props.api);
  const cle = comparees.join(',');
  const colonnes: Colonne[] = useMemo(() => {
    const ids = [...new Set([...(base ? [base.id] : []), ...comparees])];
    const sortie: Colonne[] = [];
    ids.forEach((id) => {
      const l = (base && base.id === id ? base : undefined) ?? api.trouver(id);
      if (l && sortie.length < MAX_COLONNES) sortie.push({ levure: l, ref: sortie.length === 0 && (!base || base.id === l.id), indice: sortie.length });
    });
    return sortie;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, base, cle]);
  const [touche, setTouche] = useState<string | null>(null);
  const [picker, setPicker] = useState<null | { remplace?: string }>(null);
  const ref = colonnes[0]?.levure;

  const retirer = (id: string) => onComparees(comparees.filter((c) => c !== id));
  const ajouter = (l: YeastReference, remplace?: string) => {
    const reste = remplace ? comparees.map((c) => (c === remplace ? l.id : c)) : [...comparees, l.id];
    onComparees([...new Set(reste)]);
    setPicker(null);
  };

  if (!colonnes.length) {
    return (
      <div className="lvv lvv-comparer lvv-vide-vue" data-vue="comparer">
        <p className="lvv-q">Comparer des levures</p>
        <p className="lvv-vide">Aucune levure posée. Ajoute-en depuis Chercher ou Suggérer, avec « Comparer ».</p>
        <button type="button" className="lvv-btn lvv-btn-primaire" onClick={() => onVue('chercher')}><Ico de={Search} t={14} /> Chercher une levure</button>
      </div>
    );
  }

  const titre = (() => {
    const n = colonnes.map((c) => nomCourt(c.levure));
    return n.length === 1 ? `${n[0]} pour ma bière ?` : `${n.slice(0, -1).join(', ')} ou ${n[n.length - 1]} pour ma bière ?`;
  })();
  const og = reperes.ogVisee;
  const plus = colonnes.length < MAX_COLONNES;
  const nCol = colonnes.length + (plus ? 1 : 0);
  const cellule = (c: Colonne, axe: IdAxe | 'houblon' | 'chercher', texte: string, contenu: React.ReactNode | null, cle: string) => {
    if (contenu) return <div key={c.levure.id} className={cx('lvv-cell', `lvv-c${c.indice + 1}`)}>{contenu}</div>;
    const k = `${c.levure.id}:${cle}`;
    return <CelluleInconnue key={c.levure.id} c={c} axe={axe === 'houblon' ? 'thiols' : axe} texte={texte} touche={touche === k}
      onToucher={() => { setTouche(k); onChercherDonnee?.(c.levure, axe === 'houblon' ? 'thiols' : axe); }} />;
  };
  const ligne = (cle: string, libelle: string, sous: string | undefined, rendu: (c: Colonne) => React.ReactNode) => (
    <div className="lvv-lg" key={cle} role="row" data-ligne={cle}>
      <div className="lvv-lab" role="rowheader">{libelle}{sous && <small>{sous}</small>}</div>
      {colonnes.map((c) => rendu(c))}
      {plus && <span aria-hidden="true" />}
    </div>
  );

  const pastille = (id: IdAxe, v: ValeurAxe, mots?: string) => {
    const libelle = (api.AXES.find((a) => a.id === id)?.libelle ?? id).split(' · ')[0].toLowerCase();
    const texte = v.mots?.length ? v.mots.join(' · ') : v.niveau ? `${libelle} ${NIVEAU_MOT[v.niveau]}` : v.plage ? `${libelle} ${textePlage(v.plage)}` : libelle;
    return (
      <>
        <span className={cx('lvv-p', `lvv-ax-${id}`, v.estime && 'lvv-estime')} style={styleArome(id, v)} title={v.estime ? 'estimé' : undefined}><i aria-hidden="true" />{texte}</span>
        {(mots || v.source) && <span className="lvv-mots">{mots ?? v.source?.libelle}</span>}
      </>
    );
  };
  const ecartEsters = (c: Colonne, v: ValeurAxe) => {
    const r = ref ? api.valeurAxe(ref, 'esters') : null;
    if (c.ref || !r?.niveau || !v.niveau) return null;
    const d = ORDRE_NIVEAU[v.niveau] - ORDRE_NIVEAU[r.niveau];
    return <span className={cx('lvv-ec', d === 0 && 'lvv-eg')}>{d > 0 ? '+ fruité' : d < 0 ? '− fruité' : '= fruité'}</span>;
  };

  /** Le conseil de dose de `dose.ts` pour la levure d'une colonne, au volume de la recette : la levure de la recette garde sa dose, une autre part sans dose ni produit choisis. */
  const conseilDe = (c: Colonne) => {
    if (!recette || !supply) return undefined;
    const propre = recette.yeast.hopIndexId === c.levure.id;
    const yeast = (propre ? recette.yeast : { name: c.levure.name, hopIndexId: c.levure.id, form: c.levure.form }) as YeastSpec;
    try { return doseDeLaLevure({ ...recette, yeast }, supply).conseil; } catch { return undefined; }
  };
  const attMoy = (l: YeastReference) => { const p = plageDe(api, l, 'attenuation'); return p; };
  const fgAbv = (l: YeastReference) => {
    const a = attMoy(l);
    if (og === undefined || !a) return null;
    const fg = (att: number) => Math.round((1 + (og - 1) * (1 - att / 100)) * 1000) / 1000;
    const fgs = [fg(a.max), fg(a.min)];
    const abvs = [abvFromGravities(og, fgs[0]), abvFromGravities(og, fgs[1])];
    return { fgs, abvs };
  };

  return (
    <div className="lvv lvv-comparer" data-vue="comparer">
      <h2 className="lvv-q">{titre}</h2>
      <div className="lvv-ctx">{reperes.volumeL !== undefined && <span>{nb(reperes.volumeL)} L</span>}{og !== undefined && <span>{nb(og, 3)}</span>}{reperes.temperatureC !== undefined && <span>{nb(reperes.temperatureC)} °C</span>}{reperes.abvVise !== undefined && <span>{nb(reperes.abvVise)} %</span>}</div>

      <div className="lvv-grille" role="table" aria-label="Comparer les levures" style={{ ['--n' as string]: nCol }} data-booster="effets-en-tete">
        {colonnes[0].ref && <i className="lvv-tint" aria-hidden="true" />}
        <div className="lvv-lg lvv-tetes" role="row">
          <span />
          {colonnes.map((c) => (
            <div key={c.levure.id} className={cx('lvv-head', `lvv-c${c.indice + 1}`)} role="columnheader">
              <span className="lvv-nom"><Ico de={c.levure.form === 'liquide' ? Droplet : Package} t={14} /><span className="lvv-nom-t">{codeColonne(c.levure)}</span>{c.ref && <em>réf.</em>}</span>
              {fabricantDe(c.levure) && <span className="lvv-fab2">{fabricantDe(c.levure)!.replace(/ Brewing$/, '')}</span>}
              <Dispo d={api.disponibilite(c.levure)} />
            </div>
          ))}
          {plus && (
            <div className="lvv-plus">
              <button type="button" aria-label="Ajouter une levure à comparer" onClick={() => setPicker({})}><Plus size={18} aria-hidden="true" /></button>
            </div>
          )}
        </div>

        {ligne('esters', 'Esters', 'banane · fruit', (c) => {
          const v = api.valeurAxe(c.levure, 'esters');
          return cellule(c, 'esters', 'non déclarés', v ? <>{pastille('esters', v)}{ecartEsters(c, v)}</> : null, 'esters');
        })}
        {ligne('phenols', 'Phénols', 'clou · épicé', (c) => {
          const v = api.valeurAxe(c.levure, 'phenols');
          return cellule(c, 'phenols', 'non déclarés', v ? pastille('phenols', v) : null, 'phenols');
        })}
        {ligne('houblon', 'Houblon', 'thiols · terpènes', (c) => {
          const th = api.valeurAxe(c.levure, 'thiols'), te = api.valeurAxe(c.levure, 'terpenes');
          return cellule(c, 'houblon', 'non documenté', th || te ? (
            <>{th && pastille('thiols', th)}{te && pastille('terpenes', te)}</>
          ) : null, 'houblon');
        })}
        {ligne('sucres', 'Sucres rest.', '0–25 g/L · fab.', (c) => {
          const p = plageDe(api, c.levure, 'rondeur');
          return cellule(c, 'rondeur', 'chercher', p ? (
            <><span className="lvv-val lvv-m">{textePlage(p)} <i>g/L</i></span><span className="lvv-trk"><b style={{ left: 0, width: pct(p.max, 0, 25) }} /></span></>
          ) : null, 'sucres');
        })}

        <div className="lvv-sec" role="row"><span role="rowheader">Fiche</span></div>
        {ligne('attenuation', 'Atténuation', '70–90 %', (c) => {
          const p = plageDe(api, c.levure, 'attenuation');
          return cellule(c, 'attenuation', 'chercher', p ? (
            <><span className="lvv-val lvv-m">{textePlage(p)} <i>%</i></span><span className="lvv-trk"><b style={barre(p, A_LO + 5, A_HI)} /></span></>
          ) : null, 'attenuation');
        })}
        {ligne('temperature', 'Température', '5–30 °C', (c) => {
          const p = plageDe(api, c.levure, 'temperature');
          const rep = reperes.temperatureC;
          const hors = !!p && rep !== undefined && (rep < p.min || rep > p.max);
          const lo = 5, hi = T_HI;
          return cellule(c, 'temperature', 'chercher', p ? (
            <>
              <span className="lvv-val lvv-m">{textePlage(p)} <i>°C</i>{hors && <span className="lvv-alerte"> {nb(rep!)} hors</span>}</span>
              <span className="lvv-trk">
                <b style={barre(p, lo, hi)} />
                {rep !== undefined && <em className={cx(hors && 'lvv-hors')} style={{ left: pct(rep, lo, hi) }} />}
              </span>
            </>
          ) : null, 'temperature');
        })}
        {ligne('floculation', 'Floculation', undefined, (c) => {
          const v = api.valeurAxe(c.levure, 'clarte');
          const n = v?.niveau ? ORDRE_NIVEAU[v.niveau] : -1;
          return cellule(c, 'clarte', 'chercher', v && (v.niveau || v.mots?.length) ? (
            <><span className="lvv-val lvv-val-w"><i>{v.mots?.length ? v.mots.join(' · ') : NIVEAU_FLOC[v.niveau!]}</i></span>
              {n >= 0 && <span className="lvv-ord" aria-hidden="true">{[0, 1, 2].map((k) => <i key={k} className={cx(k <= n && 'lvv-on')} />)}</span>}</>
          ) : null, 'floculation');
        })}

        {og !== undefined && (
          <>
            <div className="lvv-sec" role="row"><span role="rowheader">Ma bière <span className="lvv-m">{reperes.volumeL !== undefined ? `${nb(reperes.volumeL)} L · ` : ''}{nb(og, 3)}</span></span></div>
            {ligne('fg', 'FG · alcool', undefined, (c) => {
              const r = fgAbv(c.levure);
              return cellule(c, 'attenuation', 'chercher', r ? (
                <>
                  <span className="lvv-val lvv-m">{nb(r.fgs[0], 3)}–{nb(r.fgs[1], 3)}</span>
                  {r.abvs[0] !== null && r.abvs[1] !== null && <span className="lvv-val lvv-m">{nb(r.abvs[1]!)}–{nb(r.abvs[0]!)} <i>%</i></span>}
                </>
              ) : null, 'fg');
            })}
            {recette && supply && ligne('dose', 'Dose', undefined, (c) => {
              const a = conseilDe(c);
              const p = a?.packs;
              const g = a?.range;
              return (
                <div key={c.levure.id} className={cx('lvv-cell lvv-dose', `lvv-c${c.indice + 1}`)}>
                  {p ? (
                    <><span className="lvv-sach" aria-hidden="true">{Array.from({ length: p.max }, (_, k) => <i key={k} className={cx(k >= p.min && 'lvv-h')} />)}</span>
                      <span className="lvv-val lvv-m">{p.min === p.max ? p.min : `${p.min}–${p.max}`} <i>{p.max > 1 ? 'sachets' : 'sachet'}</i></span></>
                  ) : g ? <span className="lvv-val lvv-m">{nb(g.min, 0)}–{nb(g.max, 0)} <i>g</i></span>
                    : <span className="lvv-mots" title={a?.reasons[0]}>à renseigner</span>}
                </div>
              );
            })}
          </>
        )}

        <div className="lvv-lg lvv-actions-l" role="row">
          <span />
          {colonnes.map((c) => (
            <div key={c.levure.id} className="lvv-act-c" role="cell">
              {!(base && base.id === c.levure.id) && (
                <>
                  <button type="button" aria-label={`Remplacer ${nomCourt(c.levure)}`} onClick={() => setPicker({ remplace: c.levure.id })}><ArrowLeftRight size={14} aria-hidden="true" /></button>
                  <button type="button" aria-label={`Retirer ${nomCourt(c.levure)}`} onClick={() => retirer(c.levure.id)}><X size={14} aria-hidden="true" /></button>
                </>
              )}
            </div>
          ))}
          {plus && <span aria-hidden="true" />}
        </div>
      </div>
      <Ajouter api={api} ouvert={picker !== null} onFermer={() => setPicker(null)} reperes={reperes} exclus={colonnes.map((c) => c.levure.id)}
        onChoix={(l) => ajouter(l, picker?.remplace)} remplace={!!picker?.remplace} />
    </div>
  );
}

/** Choisir la levure à poser en colonne : un champ, les premières de la liste de l'API (le même ordre que Chercher). */
function Ajouter({ api, ouvert, onFermer, reperes, exclus, onChoix, remplace }: {
  api: ApiVue; ouvert: boolean; onFermer: () => void; reperes: PropsAvecApi['reperes']; exclus: string[]; onChoix: (l: YeastReference) => void; remplace: boolean;
}) {
  const [q, setQ] = useState('');
  // La levure tapée (`tapee` de l'API, absente de `liste`) vient en tête, puis les plus proches.
  const liste = useMemo(() => {
    if (!ouvert) return [];
    const r = api.chercher(q, {}, reperes);
    return [...(r.tapee ? [r.tapee] : []), ...r.liste].filter((l) => !exclus.includes(l.id)).slice(0, 12);
  }, [api, ouvert, q, reperes, exclus]);
  return (
    <Sheet open={ouvert} onClose={onFermer} title={remplace ? 'Remplacer par…' : 'Ajouter à Comparer'} subtitle="Les levures vendues en CH · FR · DE d'abord" className="lg:max-w-xl lg:mx-auto">
      <label className="lvv-champ">
        <Ico de={Search} t={16} />
        <input type="text" inputMode="search" autoComplete="off" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, fabricant ou code" aria-label="Nom, fabricant ou code" />
      </label>
      <ul className="lvv-pick">
        {liste.map((l) => (
          <li key={l.id}>
            <button type="button" onClick={() => onChoix(l)}>
              <span className="lvv-nom-l">{nomCourt(l)}</span>{fabricantUtile(l) && <small>{fabricantUtile(l)}</small>}<Dispo d={api.disponibilite(l)} />
            </button>
          </li>
        ))}
        {!liste.length && <li className="lvv-vide">Aucune levure ne correspond ({mil(0)}).</li>}
      </ul>
    </Sheet>
  );
}

/** Ordre des axes d'arôme, pour qui veut les lister de la même façon qu'ici. */
export const AXES_AROMES = AROMES;
