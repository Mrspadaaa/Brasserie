/**
 * Suggérer (s7a, choisie le 09.11) : « Je veux… », les 12 axes de la fiche en cartes − / + groupées Arômes · Corps · Conduite,
 * depuis la levure de la recette. Chaque moitié dit combien de levures sont de ce côté (l'API compte). Un axe choisi s'ouvre en
 * grand avec son levier ; on peut en combiner deux ; les autres groupes se replient. La liste suit : vendues en CH · FR · DE,
 * fabricant présent en Europe, rares ; au repos, les pistes °C et % de chaque levure ; avec un axe choisi, l'écart sur l'axe.
 * Aucun but nommé (banane, girofle… sont des descripteurs de résultat, jamais une carte) : la liste des axes est celle de l'API
 * (LV-1 : « pas assez générique DU TOUT »). Classes `lvv-` (L26).
 */
import { useMemo, useState, type ReactNode } from 'react';
import { Check, ChevronDown, Factory, FlaskConical, Globe, Plus, Search, Store, Thermometer } from 'lucide-react';
import { nombreFr } from '../../domain/nombreAffiche';
import type { YeastReference } from '../../domain/yeastReferences';
import type { Axe, ChoixAxe, GroupeAxe, IdAxe, LevierDetail, RangDisponibilite, Suggestion, ValeurAxe } from '../../domain/levure/contrat';
import {
  A_HI, A_LO, ActionsLigne, pct, Dispo, Ico, NonDoc, ORDRE_NIVEAU, Piste, texteEpuisee, T_HI, T_LO, TITRE_RANG, apiDe, barre, cx, fabricantUtile, mil, nomCourt, plageDe, styleArome, textePlage,
  type ApiVue, type PropsAvecApi,
} from './Chercher';
import './vues.css';

const GROUPES: Array<{ id: GroupeAxe; titre: string }> = [{ id: 'aromes', titre: 'Arômes' }, { id: 'corps', titre: 'Corps' }, { id: 'conduite', titre: 'Conduite' }];
const NIVEAU_MOT = { faible: 'faible', moyen: 'moyen', eleve: 'élevé' } as const;
const NIVEAU_PL = { faible: 'faibles', moyen: 'moyens', eleve: 'élevés' } as const;
const ICONE_RANG = { ici: Store, europe: Factory, rare: Globe } as const;
/** Les mots du brasseur pour quelques axes (« plus clair ») ; sinon « plus de X », « moins d'X ». */
const PHRASE: Partial<Record<string, string>> = { 'clarte:1': 'plus clair', 'clarte:-1': 'moins clair', 'rondeur:1': 'plus rond', 'rondeur:-1': 'moins rond', 'vitesse:1': 'plus rapide', 'vitesse:-1': 'plus lent' };
const phraseAxe = (a: Axe | undefined, c: ChoixAxe): string => {
  const p = PHRASE[`${c.axe}:${c.sens}`];
  if (p) return p;
  const l = libCourt(a, c.axe).toLowerCase();
  return `${c.sens > 0 ? 'plus' : 'moins'} ${/^[aeiouéèh]/.test(l) ? "d'" : 'de '}${l}`;
};
/** Le libellé court d'un axe, pour une carte de 84 px : « Tolérance à l'alcool » → « Tolérance », « Clarté · floculation » → « Clarté ». */
export const libCourt = (a: Axe | undefined, id?: string): string => (a?.id === 'temperature' ? '°C' : a?.id === 'tolerance' ? 'Tolérance' : (a?.libelle ?? id ?? '').split(' · ')[0]);
/** Le levier de l'API, coupé en deux : ce qu'on fait (« °C : plus chaud ») et sa preuve entre parenthèses (« 3SH +33 à +72 % de 15 à 30 °C, Samia 2026 »). */
const levierEnDeux = (l: string | undefined): { court: string; preuve?: string } | undefined => {
  if (!l) return undefined;
  const i = l.indexOf(' (');
  return i < 0 ? { court: l } : { court: l.slice(0, i), preuve: l.slice(i + 2).replace(/\)\s*$/, '') };
};
const maj = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** La valeur de la levure de base sur un axe, écrite (« 78–82 % », « faible », « 11 g/L ») ; null quand la fiche ne la dit pas. */
export function texteValeur(v: ValeurAxe | null, axe?: Axe): string | null {
  if (!v) return null;
  if (v.plage) return `${textePlage(v.plage)}${axe?.unite ? ` ${axe.unite}` : ''}`;
  if (v.niveau) return NIVEAU_MOT[v.niveau];
  if (v.mots?.length) return v.mots.join(' · ');
  return null;
}
/** Une échelle lisible : de la dizaine en dessous à la dizaine au dessus, un repère toutes les 10 (5 ou 2 si l'étendue est courte). */
function echelle(valeurs: Array<{ min: number; max: number }>): { lo: number; hi: number; reperes: number[] } | null {
  if (!valeurs.length) return null;
  const mn = Math.min(...valeurs.map((v) => v.min)), mx = Math.max(...valeurs.map((v) => v.max));
  const pas = mx - mn > 30 ? 10 : mx - mn > 12 ? 5 : 2;
  const lo = Math.floor(mn / pas) * pas, hi = Math.max(lo + pas, Math.ceil(mx / pas) * pas);
  const reperes: number[] = [];
  for (let x = lo; x <= hi + 1e-9; x += pas) reperes.push(x);
  return { lo, hi, reperes };
}

export function Suggerer(props: PropsAvecApi) {
  const { base, reperes, comparees, onChoisir, onComparees, onVue, onChercherDonnee } = props;
  const api = apiDe(props.api);
  const [choix, setChoix] = useState<ChoixAxe[]>([]);
  const [ouverts, setOuverts] = useState<GroupeAxe[]>([]);
  const [tous, setTous] = useState(false);
  const [deplie, setDeplie] = useState<string | null>(null);
  const [rares, setRares] = useState(false);

  // Les repères se comparent par valeur : un parent qui les recrée à chaque rendu ne relance pas le calcul.
  const cleReperes = [reperes.temperatureC, reperes.abvVise, reperes.styleId, reperes.ogVisee].join('|');
  const comptes = useMemo(() => (base ? api.comptesAxes(base) : undefined), [api, base]);
  const suggestions: Suggestion[] = useMemo(() => {
    if (!base) return [];
    const s = api.suggerer(base, choix, 2000);
    const ligneBase: Suggestion = { levure: base, disponibilite: api.disponibilite(base), ecarts: [], raison: '' };
    // Référence muette sur un axe choisi : l'API ne garde que les niveaux élevés ; on garde aussi les vendues ici documentées sur tous
    // les axes choisis, triées par niveau, et la référence avec ses « ⌕ ? » (cadre 3 de s7a).
    const muette = choix.some((c) => api.valeurAxe(base, c.axe) === null);
    if (choix.length && muette) {
      const deja = new Set(s.map((x) => x.levure.id));
      const rang = (l: YeastReference) => choix.reduce((n, c) => n + c.sens * (ORDRE_NIVEAU[api.valeurAxe(l, c.axe)?.niveau ?? 'faible'] ?? 0), 0);
      const extras: Suggestion[] = api.chercher('', {}, reperes).liste
        .filter((l) => !deja.has(l.id) && l.id !== base.id && api.disponibilite(l).rang === 'ici' && choix.every((c) => api.valeurAxe(l, c.axe) !== null))
        .map((levure) => ({ levure, disponibilite: api.disponibilite(levure), raison: '', ecarts: choix.map((c) => ({ axe: c.axe, ecart: 0, texte: texteValeur(api.valeurAxe(levure, c.axe), api.AXES.find((a) => a.id === c.axe)) ?? '' })) }));
      const tout = [...s, ...extras];
      const ici = tout.filter((x) => x.disponibilite.rang === 'ici').sort((a, b) => rang(b.levure) - rang(a.levure));
      return [ligneBase, ...ici, ...tout.filter((x) => x.disponibilite.rang !== 'ici')];
    }
    if (choix.length) return s;
    if (s.length) return [ligneBase, ...s];
    // Au repos : les plus proches de la levure de la recette (proximité de l'API), vendues ici d'abord.
    const ordre = { ici: 0, europe: 1, rare: 2 } as const;
    const proches = api.chercher('', {}, reperes).liste.filter((l) => l.id !== base.id)
      .map((levure) => ({ levure, disponibilite: api.disponibilite(levure), d: api.proximite(base, levure) }))
      .sort((a, b) => ordre[a.disponibilite.rang] - ordre[b.disponibilite.rang] || a.d - b.d).slice(0, 14)
      .map(({ levure, disponibilite }) => ({ levure, disponibilite, ecarts: [], raison: '' }));
    return [ligneBase, ...proches];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, base, choix, cleReperes]);
  const leviers = useMemo(() => {
    const m: Record<string, LevierDetail | undefined> = {};
    // Le levier structuré de d1 (`levierDetail` : texte, axe, plage, source) ; sans lui, la phrase seule.
    if (base) for (const c of choix) { const s = api.suggerer(base, [c], 1)[0]; m[c.axe] = s?.levierDetail ?? (s?.levier ? { texte: s.levier } : undefined); }
    return m;
  }, [api, base, choix]);
  const lignesPar = useMemo(() => {
    const g: Record<RangDisponibilite, Suggestion[]> = { ici: [], europe: [], rare: [] };
    for (const s of suggestions) g[s.disponibilite.rang].push(s);
    return g;
  }, [suggestions]);

  if (!base || !comptes) {
    return (
      <div className="lvv lvv-suggerer lvv-vide-vue" data-vue="suggerer">
        <p className="lvv-q">Je veux…</p>
        <p className="lvv-vide">Choisis d'abord une levure : Suggérer part d'elle pour aller vers plus ou moins d'un axe de la fiche.</p>
        <button type="button" className="lvv-btn lvv-btn-primaire" onClick={() => onVue('chercher')}><Ico de={Search} t={14} /> Chercher une levure</button>
      </div>
    );
  }

  const axe = (id: IdAxe) => api.AXES.find((a) => a.id === id);
  const choisi = (id: IdAxe) => choix.find((c) => c.axe === id);
  const deux = choix.length >= 2;
  const toucher = (id: IdAxe, sens: -1 | 1) => {
    setDeplie(null);
    const ici = choix.find((c) => c.axe === id);
    const suite: ChoixAxe[] = ici && ici.sens === sens ? choix.filter((c) => c.axe !== id)
      : ici ? choix.map((c) => (c.axe === id ? { axe: id, sens } : c))
      : [...choix.slice(-1), { axe: id, sens }];
    setChoix(suite);
    // Deux axes posés : les groupes se replient en puces (cadre 3 de la maquette) ; un seul : on garde ce que le brasseur a ouvert.
    if (suite.length >= 2 || suite.length === 0) { setTous(false); setOuverts([]); }
  };
  const axesDe = (g: GroupeAxe) => api.AXES.filter((a) => a.groupe === g);
  const sansDonnee = (id: IdAxe) => comptes[id].moins === 0 && comptes[id].plus === 0;
  const aUnChoisi = (g: GroupeAxe) => axesDe(g).some((a) => choisi(a.id));
  const modeGroupe = (g: GroupeAxe): 'tout' | 'choisis' | 'replie' => {
    if (choix.length === 0 || tous || ouverts.includes(g) || (!deux && aUnChoisi(g))) return 'tout';
    return deux && aUnChoisi(g) ? 'choisis' : 'replie';
  };
  const phrase = choix.length ? maj(choix.map((c) => phraseAxe(axe(c.axe), c)).join(' · ')) : 'Je veux…';

  const carte = (a: Axe) => {
    const c = comptes[a.id];
    const t = texteValeur(api.valeurAxe(base, a.id), a);
    const sel = choisi(a.id);
    const lev = leviers[a.id] ? { court: levierEnDeux(leviers[a.id]!.texte)!.court } : undefined;
    const moitie = (sens: -1 | 1, n: number) => (
      <button type="button" className={cx('lvv-pm-b', sel?.sens === sens && 'lvv-sel', n === 0 && 'lvv-zero')} aria-pressed={sel?.sens === sens} disabled={n === 0}
        aria-label={`${sens < 0 ? 'Moins' : 'Plus'} de ${libCourt(a).toLowerCase()} : ${n} levures`} onClick={() => toucher(a.id, sens)}>
        {sens < 0 ? '−' : '+'}<b className="lvv-m">{mil(n)}</b>
      </button>
    );
    return (
      <div key={a.id} className={cx('lvv-axe', `lvv-ax-${a.id}`, sel && 'lvv-choisi lvv-grand', !sel && (c.moins === 0 || c.plus === 0) && 'lvv-peu')} data-axe={a.id}>
        <span className="lvv-gt">
          <span className="lvv-ah"><i aria-hidden="true" />{libCourt(a)}{sel && c.estime && <small className="lvv-est2"> estimé</small>}</span>
          {t ? <span className="lvv-av lvv-m">{sel ? `${nomCourt(base)} ${t}` : t}</span>
            : <NonDoc levure={base} axe={a.id} texte={sel ? `${nomCourt(base)} ? chercher` : '? chercher'} onChercherDonnee={onChercherDonnee} className="lvv-av-nd" />}
          {sel && <span className="lvv-lv"><Ico de={Thermometer} t={12} />{lev ? `levier : ${lev.court}` : 'levier : aucun documenté'}</span>}
        </span>
        <span className="lvv-pm">{moitie(-1, c.moins)}{moitie(1, c.plus)}</span>
      </div>
    );
  };
  const vide = (a: Axe) => (
    <div key={a.id} className={cx('lvv-vide0', `lvv-ax-${a.id}`)} data-axe={a.id} data-sans-donnee="1">
      <i aria-hidden="true" /><b>{libCourt(a)}</b><span>sans donnée</span>
      <NonDoc levure={base} axe={a.id} texte="chercher" onChercherDonnee={onChercherDonnee} />
    </div>
  );

  const unAxe = choix.length === 1 ? choix[0] : undefined;
  const valeursPiste = unAxe ? [plageDe(api, base, unAxe.axe), ...suggestions.slice(0, 40).map((s) => plageDe(api, s.levure, unAxe.axe))].filter((p): p is { min: number; max: number } => !!p) : [];
  const ech = unAxe && axe(unAxe.axe)?.unite ? echelle(valeursPiste) : null;
  const pisteBase = unAxe ? plageDe(api, base, unAxe.axe) : undefined;

  const ligne = (s: Suggestion) => {
    const l = s.levure;
    const ouverte = deplie === l.id;
    const dedans = comparees.includes(l.id);
    const fab = fabricantUtile(l);
    const e1 = s.ecarts[0];
    const estBase = l.id === base.id;
    const ep = texteEpuisee(s.disponibilite);
    const tL = plageDe(api, l, 'temperature');
    const repT = reperes.temperatureC;
    const hors = !!tL && repT !== undefined && (repT < tL.min || repT > tL.max);
    const pa = unAxe ? plageDe(api, l, unAxe.axe) : undefined;
    const chips = deux ? [] : chipsLigne(api, l, choix);
    return (
      <div key={l.id} className="lvv-srow" data-levure={l.id}>
        <div className="lvv-sr-c">
          <button type="button" className="lvv-r1" aria-expanded={ouverte} onClick={() => setDeplie(ouverte ? null : l.id)}>
            <Dispo d={s.disponibilite} /><span className="lvv-snom">{nomCourt(l)}</span>{estBase ? <span className="lvv-fab2">ta levure</span> : fab && <span className="lvv-fab2">{fab}</span>}
            {ep && <span className="lvv-ep">{ep}</span>}
            {estBase ? <span className="lvv-src">la référence</span> : s.source && <span className="lvv-src">{s.source.libelle}</span>}
            {e1 && !estBase && !deux && e1.texte.length <= 12 && <span className="lvv-ecart lvv-m" title={e1.texte}>{e1.texte}</span>}
          </button>
          {e1 && !estBase && !deux && e1.texte.length > 12 && <span className="lvv-raison">{e1.texte}</span>}
          {unAxe && ech && pa && (
            <span className="lvv-piste" aria-hidden="true">
              {pisteBase && <u style={barre(pisteBase, ech.lo, ech.hi)} />}
              <b style={barre(pa, ech.lo, ech.hi)} />
            </span>
          )}
          {choix.length === 0 && (
            <span className="lvv-bars" aria-hidden="true">
              <small>°C</small><Piste plage={plageDe(api, l, 'temperature')} repere={reperes.temperatureC} lo={T_LO} hi={T_HI} kind="t" />
              <small>%</small><Piste plage={plageDe(api, l, 'attenuation')} fantome={plageDe(api, base, 'attenuation')} lo={A_LO} hi={A_HI} kind="a" />
            </span>
          )}
          {deux && <JaugesDeuxAxes api={api} levure={l} choix={choix} libelle={(id) => libCourt(axe(id), id).toLowerCase()} onChercherDonnee={onChercherDonnee} />}
          {estBase && !deux && choix.some((c) => api.valeurAxe(l, c.axe) === null) && <span className="lvv-r2">{choix.filter((c) => api.valeurAxe(l, c.axe) === null).map((c) => <NonDoc key={c.axe} levure={l} axe={c.axe} texte={`${libCourt(axe(c.axe), c.axe).toLowerCase()} ?`} onChercherDonnee={onChercherDonnee} />)}</span>}
          {(chips.length > 0 || (hors && !estBase)) && <span className="lvv-r2">{chips}{hors && !estBase && <i className="lvv-chip lvv-hors">{textePlage(tL!)} °C · {String(repT).replace('.', ',')} hors plage</i>}</span>}
          {ouverte && s.raison && <span className="lvv-raison">{s.raison}</span>}
          {ouverte && <ActionsLigne levure={l} comparees={comparees} onChoisir={onChoisir} onComparees={onComparees} />}
        </div>
        <button type="button" className="lvv-plusr" aria-label={dedans ? `${nomCourt(l)} est dans Comparer` : `Ajouter ${nomCourt(l)} à Comparer`} aria-pressed={dedans}
          disabled={estBase} onClick={() => onComparees(dedans ? comparees.filter((c) => c !== l.id) : [...comparees, l.id])}>
          {dedans ? <Check size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
        </button>
      </div>
    );
  };

  const rang = (r: RangDisponibilite, gris?: boolean): ReactNode => {
    const liste = lignesPar[r];
    if (!liste.length) return null;
    const titre = r === 'europe' ? `${TITRE_RANG.europe} · sans offre vue` : TITRE_RANG[r];
    if (r === 'rare' && !rares) {
      return (
        <button key={r} type="button" className="lvv-vide lvv-vide-rare" onClick={() => setRares(true)} aria-expanded={false}>
          <Ico de={Globe} t={14} /><span>rares en Europe <b className="lvv-m">{mil(liste.length)}</b> · {nomCourt(liste[0].levure)}…</span>
        </button>
      );
    }
    return (
      <section key={r} className="lvv-lg-s" aria-label={titre}>
        <div className={cx('lvv-gh', gris && 'lvv-gris')}>
          <Ico de={ICONE_RANG[r]} t={12} />{titre} <span className="lvv-m">{mil(liste.length)}</span>
          {r === 'ici' && ech && <span className="lvv-echl lvv-m">{ech.reperes.join(' · ')} {axe(unAxe!.axe)?.unite}</span>}
        </div>
        <div className={cx('lvv-liste', gris && 'lvv-gris', unAxe && `lvv-ax-${unAxe.axe}`)}>{liste.slice(0, r === 'ici' ? 12 : 8).map(ligne)}</div>
      </section>
    );
  };

  const replies = GROUPES.filter((x) => modeGroupe(x.id) !== 'tout' && axesDe(x.id).some((a) => !choisi(a.id)));
  return (
    <div className="lvv lvv-suggerer" data-vue="suggerer">
      <div className="lvv-dep">
        <span className="lvv-puce"><Ico de={FlaskConical} t={14} />{nomCourt(base)}</span>
        <b>{phrase}</b>
        {(reperes.temperatureC !== undefined || reperes.volumeL !== undefined) && <span className="lvv-ctx">{reperes.volumeL !== undefined && <span>{String(reperes.volumeL).replace('.', ',')} L</span>}{reperes.temperatureC !== undefined && <span>{String(reperes.temperatureC).replace('.', ',')} °C</span>}</span>}
      </div>

      <div className="lvv-grp" data-booster="axes-plus-moins">
        {GROUPES.map(({ id: g, titre }) => {
          const mode = modeGroupe(g);
          if (mode === 'replie') return null;
          const toutes = axesDe(g);
          const choisies = toutes.filter((a) => choisi(a.id));
          const autres = mode === 'tout' ? toutes.filter((a) => !choisi(a.id)) : [];
          const estime = toutes.some((a) => comptes[a.id]?.estime);
          return (
            <div className="lvv-groupe" key={g} data-groupe={g}>
              <span className="lvv-gl">{titre}{estime ? ' · estimé' : ''}</span>
              {choisies.map(carte)}
              {autres.filter((a) => !sansDonnee(a.id)).map(carte)}
              {autres.filter((a) => sansDonnee(a.id)).map(vide)}
            </div>
          );
        })}
      </div>

      {choix.map((c) => {
        const d = leviers[c.axe];
        const deux = d && levierEnDeux(d.texte);
        const preuve = d && (deux!.preuve ?? d.source?.libelle);
        // Une boîte seulement quand elle apporte une preuve chiffrée ou une plage : sinon elle répète l'en-tête de la carte (S5).
        return d && preuve && (d.plage || /\d/.test(preuve)) ? (
          <div key={c.axe} className="lvv-levier" data-booster="levier-conduite">
            <Ico de={Thermometer} t={14} /><b>Levier · {libCourt(axe(c.axe)).toLowerCase()}</b><span>{preuve}</span>
            {d.axe === 'temperature' && d.plage && <LevierC court={deux!.court} plage={d.plage} conduite={reperes.temperatureC} />}
          </div>
        ) : null;
      })}

      {choix.length > 0 && (
        <div className="lvv-repl" data-booster="groupes-replies">
          {replies.map((x) => (
            <button key={x.id} type="button" aria-expanded={false} onClick={() => setOuverts((o) => [...new Set([...o, x.id])])}>
              {x.titre} <small>{axesDe(x.id).filter((a) => !choisi(a.id)).length}</small><ChevronDown size={12} aria-hidden="true" />
            </button>
          ))}
          {!deux && !tous && <button type="button" className="lvv-aj" onClick={() => setTous(true)}>+ un 2ᵉ axe</button>}
          <button type="button" className="lvv-aj" onClick={() => { setChoix([]); setOuverts([]); setTous(false); }}>Effacer</button>
        </div>
      )}

      {rang('ici')}
      {rang('europe', true)}
      {rang('rare', true)}
      {!suggestions.length && <p className="lvv-vide" role="status">Aucune levure n'est de ce côté de {nomCourt(base)} sur ces axes.</p>}
    </div>
  );
}

/** Les pastilles d'une ligne : la valeur de chaque axe choisi, puis esters, thiols, clarté ou tolérance quand la fiche les donne. */
function chipsLigne(api: ApiVue, l: YeastReference, choix: ChoixAxe[]): ReactNode[] {
  const ids: IdAxe[] = [...choix.map((c) => c.axe), ...(['esters', 'thiols', 'clarte', 'tolerance'] as IdAxe[]).filter((i) => !choix.some((c) => c.axe === i))].slice(0, 3);
  const sortie: ReactNode[] = [];
  for (const id of ids) {
    const v = api.valeurAxe(l, id);
    const a = api.AXES.find((x) => x.id === id);
    if (!v) continue;
    const libelle = libCourt(a, id).toLowerCase();
    const texte = v.mots?.length ? v.mots.slice(0, 2).join(' · ') : v.plage ? `${textePlage(v.plage)}${a?.unite ? ` ${a.unite}` : ''}` : v.niveau ? `${libelle} ${NIVEAU_PL[v.niveau]}` : '';
    if (texte) sortie.push(<i key={id} className={cx('lvv-chip', `lvv-ax-${id}`, v.estime && 'lvv-estime')} style={styleArome(id, v)} title={v.estime ? 'estimé' : v.source?.libelle}>{texte}</i>);
  }
  return sortie;
}

/** Deux axes choisis : une jauge de trois crans par axe, ou « ⌕ axe ? » quand la fiche ne dit rien. */
function JaugesDeuxAxes({ api, levure, choix, libelle, onChercherDonnee }: {
  api: ApiVue; levure: YeastReference; choix: ChoixAxe[]; libelle: (id: IdAxe) => string; onChercherDonnee?: PropsAvecApi['onChercherDonnee'];
}) {
  return (
    <span className="lvv-jg">
      {choix.map((c) => {
        const v = api.valeurAxe(levure, c.axe);
        if (!v) return <NonDoc key={c.axe} levure={levure} axe={c.axe} texte={`${libelle(c.axe)} ?`} onChercherDonnee={onChercherDonnee} />;
        const n = v.niveau ? { faible: 1, moyen: 2, eleve: 3 }[v.niveau] : 0;
        return (
          <span key={c.axe} className={cx('lvv-jg-a', `lvv-ax-${c.axe}`)}>
            <span>{libelle(c.axe)}</span>
            {v.niveau ? <span className="lvv-seg" role="img" aria-label={`${libelle(c.axe)} ${NIVEAU_MOT[v.niveau]}`}>{[0, 1, 2].map((k) => <i key={k} className={cx(k < n && 'lvv-on')} />)}</span>
              : <b className="lvv-m">{v.plage ? textePlage(v.plage) : v.mots?.join(' · ')}</b>}
          </span>
        );
      })}
    </span>
  );
}

/** Le levier °C dessiné (cadre 3 de s7a) : l'axe de la plage où la preuve vaut (`levierDetail.plage`), le repère de ta conduite, la flèche du sens (« plus chaud »). */
function LevierC({ court, plage, conduite }: { court: string; plage: { min: number; max: number }; conduite?: number }) {
  if (conduite === undefined) return null;
  const lo = plage.min, hi = plage.max;
  if (!(hi > lo)) return null;
  const sens = /plus chaud/i.test(court) ? 1 : /plus froid|moins chaud/i.test(court) ? -1 : 0;
  const x = (v: number) => pct(v, lo, hi); // position en % (CSS : le point est la syntaxe, pas un affichage)
  const c = nombreFr(conduite, 1), bas = nombreFr(lo, 1);
  return (
    <span className="lvv-axe-c" aria-label={`Ta conduite ${c} °C sur l'axe ${bas} à ${nombreFr(hi, 1)} °C`}>
      <span className="lvv-axe-tr" />
      {sens !== 0 && <span className="lvv-axe-fl" style={sens > 0 ? { left: x(conduite), right: 0 } : { left: 0, width: x(conduite) }} />}
      <span className="lvv-axe-g" style={{ left: 0 }}>{bas}</span><span className="lvv-axe-g" style={{ right: 0 }}>{nombreFr(hi, 1)} °C</span>
      <span className="lvv-axe-cond lvv-m" style={{ left: x(conduite) }}>{c}</span>
    </span>
  );
}
