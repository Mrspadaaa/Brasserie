/**
 * La recherche avancée, forme c6b (choisie le 09.11 pour la levure) : le champ, une ligne de résumé, les puces des filtres, la
 * carte de la fiche tapée et la liste rangée par rayons de disponibilité, une piste par mesure ; les filtres dans une feuille à
 * index. Aucune règle de catalogue ici : fiches, comptes, ordre, disponibilité, pistes et pièces de ligne viennent du catalogue
 * (`types.ts`). Instances : la levure (etapeLevure/Chercher.tsx), les houblons (hopIndex/rechercheAvancee).
 *
 * 09.11 (« clicker sur une levure n'importe où pas que son nom ouvre son sous menu ») : toute la ligne s'ouvre au toucher. Le nom
 * reste le bouton de la ligne (focus, Entrée, Espace, `aria-expanded`), son clic remonte à la ligne ; les autres commandes de la
 * ligne gardent leur geste.
 * Classes `ra-` (L26), jetons du thème `--cave-*` (clair et cave).
 */
import { useMemo, useState, type MouseEvent } from 'react';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { Sheet } from '../Sheet';
import type { ComptesFacette } from '../../domain/rechercheAvancee/facettes';
import type { CatalogueRA, DefFiltreRA, EtatFiltresRA, PisteRA, Plage, RayonRA, ResultatRA } from './types';
import './rechercheAvancee.css';

export const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(' ');
/** Milliers à l'espace insécable : « 1 339 ». */
export const mil = (n: number) => new Intl.NumberFormat('fr-FR').format(n).replace(/[  ]/g, ' ');
const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const premiereMinuscule = (s: string) => (s ? s[0].toLowerCase() + s.slice(1) : s);
/** Un nombre écrit à la suisse : « 7,5 ». */
export const nb = (x: number) => String(Math.round(x * 10) / 10).replace('.', ',');
export const textePlage = (p: Plage) => (p.min === p.max ? nb(p.min) : `${nb(p.min)}–${nb(p.max)}`);
export const pct = (v: number, lo: number, hi: number) => `${(Math.max(0, Math.min(1, (v - lo) / (hi - lo))) * 100).toFixed(1)}%`;
/** La bande d'une plage sur une échelle : gauche et largeur en %, au moins 2,5 % pour rester visible. */
export const barre = (p: Plage, lo: number, hi: number) => ({
  left: pct(p.min, lo, hi),
  width: `${Math.max(2.5, (Math.min(1, (p.max - lo) / (hi - lo)) - Math.max(0, (p.min - lo) / (hi - lo))) * 100).toFixed(1)}%`,
});

/** Un toucher n'importe où sur la ligne l'ouvre ou la ferme ; une autre commande de la ligne (« ⌕ », Comparer) garde son geste. */
export const toucherLigne = (basculer: () => void) => (e: MouseEvent<HTMLElement>) => {
  const commande = (e.target as Element).closest('button, a, input, select, textarea, [role="switch"], [role="checkbox"]');
  if (commande && !commande.hasAttribute('data-ligne-nom')) return;
  basculer();
};

/** L'en-tête d'une piste : ses bornes aux deux bouts, et le repère de la recette À SA PLACE sur la piste (sinon l'unité au milieu). */
export function EnteteAxe({ lo, hi, repere, unite }: { lo: number; hi: number; repere?: number; unite: string }) {
  const x = repere !== undefined ? Math.max(0, Math.min(1, (repere - lo) / (hi - lo))) : 0.5;
  return (
    <span className="ra-ax">
      <span className={cx(repere !== undefined && x < 0.3 && 'ra-ax-cache')}>{nb(lo)}</span>
      <b className={cx('ra-ax-m', repere !== undefined && 'ra-ax-rep')} style={{ left: `${(x * 100).toFixed(1)}%` }}>{repere !== undefined ? nb(repere) : unite}</b>
      <span className={cx(repere !== undefined && x > 0.7 && 'ra-ax-cache')}>{nb(hi)}</span>
    </span>
  );
}

/** Une piste : la bande de la fiche, la bande « fantôme » de la fiche tapée, le repère de la recette. */
export function PisteLigne<T>({ piste, item, ref }: { piste: PisteRA<T>; item: T; ref?: T }) {
  const p = piste.plage(item);
  const f = ref !== undefined ? piste.plage(ref) : undefined;
  return (
    <span className={cx('ra-tr', `ra-tr-${piste.teinte}`)} data-piste={piste.id} aria-hidden="true">
      {f && <i className="ra-g" style={barre(f, piste.lo, piste.hi)} />}
      {p && <i className="ra-b" style={barre(p, piste.lo, piste.hi)} />}
      {piste.repere !== undefined && <i className="ra-cd" style={{ left: pct(piste.repere, piste.lo, piste.hi) }} />}
    </span>
  );
}

/* ───────────── filtres : bornes, phrase ───────────── */

type Bornes = Plage;
const estPlage = (v: unknown): v is Bornes => !!v && typeof v === 'object' && !Array.isArray(v) && 'min' in (v as object);
const estPose = (f: EtatFiltresRA, id: string) => {
  const v = f[id];
  return Array.isArray(v) ? v.length > 0 : estPlage(v) ? true : v === true;
};
/** Une option de plage : « 8:10 », « 8-10 », « 8–10 », « <8 », « ≥12 », lue avec tolérance. */
export function bornesDe(valeur: string): Bornes | null {
  const s = valeur.replace(/,/g, '.').replace(/\s/g, '');
  const n = '(-?\\d+(?:\\.\\d+)?)';
  let m = new RegExp(`^<=?${n}$`).exec(s);
  if (m) return { min: -Infinity, max: Number(m[1]) };
  m = new RegExp(`^(?:>=?|≥)${n}$`).exec(s);
  if (m) return { min: Number(m[1]), max: Infinity };
  m = new RegExp(`^${n}?[:–—-]${n}?$`).exec(s);
  if (m && (m[1] !== undefined || m[2] !== undefined)) return { min: m[1] === undefined ? -Infinity : Number(m[1]), max: m[2] === undefined ? Infinity : Number(m[2]) };
  m = new RegExp(`^${n}$`).exec(s);
  return m ? { min: Number(m[1]), max: Number(m[1]) } : null;
}
const texteBornes = (b: Bornes, unite = '') => {
  const u = unite ? ` ${unite}` : '';
  if (!Number.isFinite(b.min)) return `< ${nb(b.max)}${u}`;
  if (!Number.isFinite(b.max)) return `≥ ${nb(b.min)}${u}`;
  return `${textePlage(b)}${u}`;
};
const libIndex = (d: DefFiltreRA) => d.court ?? d.libelle;
const courtFiltre = (libelle: string) => libelle.replace(/^sans\s+/i, '');

interface ChipPose { id: string; valeur?: string; texte: string }
function chipsPoses(defs: readonly DefFiltreRA[], f: EtatFiltresRA, res: ResultatRA<unknown>): ChipPose[] {
  const sortie: ChipPose[] = [];
  for (const d of defs) {
    const v = f[d.id];
    if (v === undefined || v === false) continue;
    if (Array.isArray(v)) {
      for (const val of v) sortie.push({ id: d.id, valeur: val, texte: res.comptes[d.id]?.options.find((o) => o.valeur === val)?.libelle ?? val });
    } else if (estPlage(v)) {
      sortie.push({ id: d.id, texte: texteBornes(v, d.unite) });
    } else if (v === true) {
      sortie.push({ id: d.id, texte: premiereMinuscule(d.libelle) });
    }
  }
  return sortie;
}
function maxNonDoc(ids: string[], res: ResultatRA<unknown>): { id: string; n: number } | undefined {
  let best: { id: string; n: number } | undefined;
  for (const id of ids) { const n = res.comptes[id]?.nonDocumentees ?? 0; if (n > 0 && (!best || n > best.n)) best = { id, n }; }
  return best;
}

/* ───────────── le composant ───────────── */

export function RechercheAvancee<T>({ catalogue: c }: { catalogue: CatalogueRA<T> }) {
  const PAS = useMemo(() => Object.fromEntries(c.rayons.map((r) => [r.id, r.pas])) as Record<string, number>, [c.rayons]);
  const [requete, setRequete] = useState('');
  const [filtres, setFiltres] = useState<EtatFiltresRA>({});
  const [tri, setTri] = useState<string>(c.tris[0]?.[0] ?? 'proche');
  const [ouverte, setOuverte] = useState(false);
  const [courant, setCourant] = useState<string>(c.filtres[0]?.id ?? '');
  const [visibles, setVisibles] = useState<Record<string, number>>(PAS);
  const [deplie, setDeplie] = useState<string | null>(null);

  const res = useMemo(() => c.chercher(requete, filtres), [c, requete, filtres]);
  const ref = res.tapee;
  const libelleFiltre = (id: string) => courtFiltre(c.filtres.find((d) => d.id === id)?.libelle ?? id);
  const nonDocDe = (id: string) => c.filtres.find((d) => d.id === id)?.nonDoc ?? 'non documentée';

  const poses = c.filtres.filter((d) => (d.deBase ? filtres[d.id] !== undefined && estPose(filtres, d.id) : estPose(filtres, d.id)));
  const manquants = poses.length ? maxNonDoc(poses.map((d) => d.id), res) : undefined;
  // Les fiches du rayon « à vérifier » qui ne passent pas parce que leur fiche ne dit rien du filtre le plus muet : en pâle,
  // « ⌕ STA1 ? » (cadre 3 de c6b). Elles ne comptent pas dans le total : l'inconnu n'est jamais un accord.
  const verifier = useMemo(() => {
    if (!manquants || !c.rayonVerifier) return [] as T[];
    const sans = { ...filtres };
    delete sans[manquants.id];
    return c.chercher(requete, sans).liste.filter((l) => c.rayonDe(l) === c.rayonVerifier && !c.documente(l, manquants.id));
  }, [c, requete, filtres, manquants?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const lignes = useMemo(() => {
    const groupes: Record<string, T[]> = Object.fromEntries(c.rayons.map((r) => [r.id, [] as T[]]));
    const dernier = c.rayons[c.rayons.length - 1]?.id;
    for (const l of res.liste) (groupes[c.rayonDe(l)] ?? groupes[dernier]).push(l);
    if (tri !== c.tris[0]?.[0]) {
      const decroit = c.triDecroissant?.includes(tri);
      for (const r of Object.keys(groupes)) {
        groupes[r] = groupes[r].map((l, i) => ({ l, i, k: c.cleTri(l, tri) }))
          .sort((x, y) => (x.k === undefined ? 1 : y.k === undefined ? -1 : decroit ? y.k - x.k : x.k - y.k) || x.i - y.i).map((o) => o.l);
      }
    }
    return groupes;
  }, [c, res.liste, tri]);
  const idsVerifier = new Set(verifier.map((l) => c.idDe(l)));
  const rv = c.rayonVerifier;
  const listeDe = (r: RayonRA) => (r.id === rv ? [...lignes[r.id], ...verifier.filter((l) => !lignes[r.id].some((x) => c.idDe(x) === c.idDe(l)))] : lignes[r.id]);

  const parts = res.resume.split(' · ');
  const nomListe = parts[0] ?? '';
  const total = res.total;
  const chips = chipsPoses(c.filtres, filtres, res as ResultatRA<unknown>);
  const retire = (id: string, valeur?: string) => setFiltres((f) => {
    const n = { ...f };
    const v = n[id];
    if (valeur !== undefined && Array.isArray(v)) { const reste = v.filter((x) => x !== valeur); if (reste.length) n[id] = reste; else delete n[id]; } else delete n[id];
    return n;
  });
  const ouvrirFeuille = (id?: string) => { if (id) setCourant(id); setOuverte(true); };
  const premierRayon = c.rayons.findIndex((r) => listeDe(r).length > 0);
  const tous = c.rayons.flatMap((r) => listeDe(r));

  return (
    <div className="ra ra-chercher" data-vue={c.vue} style={{ ['--ra-n' as string]: c.pistes.length }}>
      <label className="ra-champ">
        <Search size={16} strokeWidth={2} aria-hidden="true" className="ra-i" />
        <input type="text" inputMode="search" enterKeyHint="search" autoComplete="off" value={requete} placeholder={c.libelleChamp} aria-label={c.libelleChamp}
          onChange={(e) => { setRequete(e.target.value); setVisibles(PAS); }} />
        {requete && <button type="button" className="ra-eff" aria-label="Effacer la recherche" onClick={() => setRequete('')}><X size={16} aria-hidden="true" /></button>}
      </label>

      {chips.length === 0 ? (
        <button type="button" className="ra-res" data-booster="resume-une-ligne" onClick={() => ouvrirFeuille()} aria-label={`Filtres : ${res.resume}`}>
          <SlidersHorizontal size={16} strokeWidth={2} aria-hidden="true" className="ra-i" />
          <Resume parts={parts} />
        </button>
      ) : (
        <div className="ra-phr" data-booster="phrase-filtres">
          <b className="ra-m">{mil(total)}</b>
          {chips.map((ch, i) => (
            <span key={`${ch.id}-${ch.valeur ?? ''}`} className="ra-phr-pas">
              <span className="ra-mot">
                <button type="button" className="ra-mot-t" onClick={() => ouvrirFeuille(ch.id)}>{ch.texte}</button>
                <button type="button" className="ra-mot-x" aria-label={`Retirer ${ch.texte}`} onClick={() => retire(ch.id, ch.valeur)}><X size={11} aria-hidden="true" /></button>
              </span>
              {i < chips.length - 1 && <span className="ra-et" aria-hidden="true">·</span>}
            </span>
          ))}
        </div>
      )}

      {chips.length === 0 && (
        <div className="ra-puc" data-booster="puces-defilantes" role="group" aria-label="Filtres">
          {c.filtres.filter((d) => d.enPuce).map((d) => (
            <button key={d.id} type="button" className={cx('ra-pu', estPose(filtres, d.id) && 'ra-on')} onClick={() => ouvrirFeuille(d.id)}>
              {libIndex(d)}{d.rang === 'premier' && (d.genre === 'choix' || d.genre === 'plage') ? <ChevronDown size={12} aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      )}

      {chips.length > 0 && (
        <>
          <span className="ra-rep" role="img" aria-label={c.rayons.map((r) => `${r.legende} ${lignes[r.id].length}`).join(', ')} data-booster="compte-rayons">
            {c.rayons.map((r) => <i key={r.id} className={`ra-rep-${r.teinte}`} style={{ flex: Math.max(lignes[r.id].length, 0.0001) }} />)}
          </span>
          <span className="ra-leg">{c.rayons.map((r) => <span key={r.id}><i className={`ra-lg-${r.teinte}`} />{r.legende} {lignes[r.id].length}</span>)}</span>
        </>
      )}

      {manquants && !c.chercherDonnee && (
        // Sans recherche de donnée pour ce catalogue : le constat seul, sans « chercher » (aucun geste promis qui ne fait rien).
        <p className="ra-verif" role="status">
          <Search size={12} strokeWidth={2} aria-hidden="true" className="ra-i" />
          <span>{libelleFiltre(manquants.id)} {nonDocDe(manquants.id)} <b className="ra-m">{mil(manquants.n)}</b></span>
        </p>
      )}
      {manquants && c.chercherDonnee && (
        <button type="button" className="ra-verif" data-booster="chercher-ia"
          onClick={() => { const l = verifier[0] ?? tous.find((x) => !c.documente(x, manquants.id)); if (l) c.chercherDonnee?.(l, manquants.id); }}>
          <Search size={12} strokeWidth={2} aria-hidden="true" className="ra-i" />
          <span>{libelleFiltre(manquants.id)} {nonDocDe(manquants.id)} <b className="ra-m">{mil(manquants.n)}</b>{verifier.length > 0 && <> · dont <b className="ra-m">{verifier.length}</b> {c.rayons.find((r) => r.id === rv)?.reste}</>}</span>
          <span className="ra-verif-a">chercher</span>
        </button>
      )}

      {ref !== undefined && c.Carte && <c.Carte item={ref} ouverte={deplie === c.idDe(ref)} basculer={() => setDeplie(deplie === c.idDe(ref) ? null : c.idDe(ref))} />}

      {total === 0 && verifier.length === 0 ? (
        <p className="ra-vide" role="status">{c.aucun}{chips.length > 0 && <> <button type="button" className="ra-lien" onClick={() => setFiltres({})}>Retirer les filtres</button></>}</p>
      ) : (
        <div className="ra-tab" data-booster="pont">
          {c.rayons.map((rayon, k) => {
            const liste = listeDe(rayon);
            if (!liste.length) return null;
            const montres = liste.slice(0, Math.max(visibles[rayon.id] ?? rayon.pas, rayon.id === rv ? lignes[rayon.id].length + verifier.length : 0));
            const reste = liste.length - montres.length;
            const Icone = rayon.icone;
            return (
              <section key={rayon.id} className={cx('ra-rayon', `ra-rayon-${rayon.id}`, `ra-t-${rayon.teinte}`)} aria-label={rayon.titre}>
                <div className="ra-th">
                  <h3 title={rayon.titre}><Icone size={14} strokeWidth={2} aria-hidden="true" className="ra-i" /><span className="ra-th-t" data-court={rayon.court}><span className="ra-t-long">{rayon.titre}</span><span className="ra-m ra-th-n">{mil(liste.length)}</span></span>{rayon.id === rv && verifier.length > 0 && <span className="ra-badge">à vérifier</span>}</h3>
                  {k === premierRayon && c.pistes.map((p) => <EnteteAxe key={p.id} lo={p.lo} hi={p.hi} repere={p.repere} unite={p.unite} />)}
                </div>
                {montres.map((l) => {
                  const id = c.idDe(l);
                  return (
                    <Ligne key={id} c={c} item={l} ref={ref} deplie={deplie === id} onBasculer={() => setDeplie(deplie === id ? null : id)}
                      manques={idsVerifier.has(id) && manquants ? [{ id: manquants.id, libelle: libelleFiltre(manquants.id) }] : []}
                      posesBascule={poses.filter((d) => d.genre === 'bascule')} filtres={filtres} />
                  );
                })}
                {reste > 0 && (
                  <button type="button" className="ra-sous" onClick={() => setVisibles((v) => ({ ...v, [rayon.id]: (v[rayon.id] ?? rayon.pas) + 20 }))}>
                    <span>+ <b className="ra-m">{mil(reste)}</b> {rayon.reste}</span><span aria-hidden="true">›</span>
                  </button>
                )}
              </section>
            );
          })}
        </div>
      )}

      <Feuille
        c={c} ouverte={ouverte} onFermer={() => setOuverte(false)} courant={courant} onCourant={setCourant} filtres={filtres} onFiltres={setFiltres}
        res={res} tri={tri} onTri={setTri} nomListe={nomListe}
        echelle={c.echelle ? (lignes[c.echelle.rayon] ?? []).slice(0, 5) : []}
        premierNonDoc={(id) => tous.find((l) => !c.documente(l, id))}
      />
    </div>
  );
}

/** La ligne de résumé, mise en forme : le premier mot en gras, les repères en rouge, le compte à droite. */
function Resume({ parts }: { parts: string[] }) {
  const aCompte = parts.length > 1 && /^[\d  \s.,]+$/.test(parts[parts.length - 1]);
  const compte = aCompte ? parts[parts.length - 1] : '';
  const mots = aCompte ? parts.slice(0, -1) : parts;
  let dansRepere = false;
  return (
    <span className="ra-res-t">
      {mots.map((m, i) => {
        if (/^repères/i.test(m)) dansRepere = true;
        else if (dansRepere && !/^[\d.,]+\s?(°C|%|%\s?vol|g\/L)?$/.test(m)) dansRepere = false;
        return (
          <span key={i} className="ra-res-p">
            {i > 0 && <span className="ra-sep" aria-hidden="true">·</span>}
            {i === 0 ? <b>{m}</b> : <span className={dansRepere ? 'ra-rp' : undefined}>{m}</span>}
          </span>
        );
      })}
      {compte && <span className="ra-n ra-m">{compte}</span>}
    </span>
  );
}

function Ligne<T>({ c, item, ref, deplie, onBasculer, manques, posesBascule, filtres }: {
  c: CatalogueRA<T>; item: T; ref?: T; deplie: boolean; onBasculer: () => void;
  manques: Array<{ id: string; libelle: string }>; posesBascule: readonly DefFiltreRA[]; filtres: EtatFiltresRA;
}) {
  const pale = manques.length > 0;
  return (
    <div className={cx('ra-row', pale && 'ra-une ra-row-pale', deplie && 'ra-row-ouverte')} {...c.attrsLigne?.(item)} onClick={toucherLigne(onBasculer)}>
      <span className="ra-nmw">
        <button type="button" className="ra-nm" aria-expanded={deplie} data-ligne-nom="">
          <span className={cx('ra-nm-t', pale && 'ra-pale')}>{c.nomLigne(item)}</span>
          <c.ApresNom item={item} pale={pale} />
        </button>
        {pale && manques.map((m) => <c.NonDoc key={m.id} item={item} filtre={m.id} texte={`${courtFiltre(m.libelle)} ?`} />)}
        {c.SousNom && <c.SousNom item={item} />}
      </span>
      {c.pistes.map((p) => <PisteLigne key={p.id} piste={p} item={item} ref={ref} />)}
      {!pale && <span className="ra-pas-l"><c.Pastilles item={item} ref={ref} poses={posesBascule} filtres={filtres} /></span>}
      {deplie && <span className="ra-actions"><c.Actions item={item} /></span>}
    </div>
  );
}

/* ───────────── la feuille : l'index des filtres à gauche, le filtre touché à droite ───────────── */

interface PropsFeuille<T> {
  c: CatalogueRA<T>; ouverte: boolean; onFermer: () => void; courant: string; onCourant: (id: string) => void; filtres: EtatFiltresRA; onFiltres: (f: EtatFiltresRA) => void;
  res: ResultatRA<T>; tri: string; onTri: (t: string) => void; nomListe: string; echelle: T[]; premierNonDoc: (id: string) => T | undefined;
}
type Regle = (id: string, v: EtatFiltresRA[string] | undefined) => void;

function Feuille<T>({ c, ouverte, onFermer, courant, onCourant, filtres, onFiltres, res, tri, onTri, nomListe, echelle, premierNonDoc }: PropsFeuille<T>) {
  const def = c.filtres.find((d) => d.id === courant);
  const premierPlus = c.filtres.findIndex((d) => d.rang === 'plus');
  const regle: Regle = (id, v) => {
    const n = { ...filtres };
    if (v === undefined || v === false || (Array.isArray(v) && v.length === 0)) delete n[id]; else n[id] = v;
    onFiltres(n);
  };
  const nbPoses = c.filtres.filter((d) => !d.deBase && estPose(filtres, d.id)).length;
  return (
    <Sheet open={ouverte} onClose={onFermer} title="Filtres" subtitle="● posé · ○ repère · ⌕ non documentées" className="ra-feuille lg:max-w-xl lg:mx-auto"
      footer={
        <div className="ra-ff">
          <div className="ra-tri" data-booster="trier" role="group" aria-label="Trier">
            <span>Trier</span>
            {c.tris.map(([id, nom]) => <button key={id} type="button" className={cx(tri === id && 'ra-on')} aria-pressed={tri === id} onClick={() => onTri(id)}>{nom}</button>)}
          </div>
          <div className="ra-act">
            <span>{nbPoses === 0 ? `${nomListe} · aucun autre filtre` : `${nomListe} · ${nbPoses} filtre${nbPoses > 1 ? 's' : ''} posé${nbPoses > 1 ? 's' : ''}`}</span>
            <button type="button" className="ra-prim" onClick={onFermer}>Voir <span className="ra-m">{mil(res.total)}</span></button>
          </div>
        </div>
      }>
      <div className="ra-fc">
        <nav className="ra-idx" aria-label="Les filtres" data-booster="index-non-documentees">
          {c.filtres.map((d, i) => {
            const k = res.comptes[d.id];
            const pose = d.deBase ? true : estPose(filtres, d.id);
            const rep = d.repere !== undefined;
            return (
              <span key={d.id} className="ra-idx-l">
                {i === premierPlus && premierPlus > 0 && <small>Plus de filtres</small>}
                <button type="button" data-filtre={d.id} aria-current={d.id === courant ? 'true' : undefined}
                  className={cx(d.id === courant && 'ra-cur', k && k.nonDocumentees > 0 && k.options.length <= 2 && k.nonDocumentees > 1000 && 'ra-peu')}
                  onClick={() => onCourant(d.id)}>
                  <span className="ra-idx-nom">{libIndex(d)}</span>
                  {pose && <i className="ra-pt" role="img" aria-label="posé" />}
                  {rep && <i className="ra-irp" role="img" aria-label="repère" />}
                  {d.indisponible ? <em title={d.indisponible}>—</em> : d.estime ? <em>estimé</em> : k && k.nonDocumentees > 0 ? <em><Search size={11} aria-hidden="true" />{mil(k.nonDocumentees)}</em> : <em title="rien à documenter ici">—</em>}
                </button>
              </span>
            );
          })}
        </nav>
        <div className="ra-pan">
          {def?.indisponible && <p className="ra-vide">{def.indisponible}</p>}
          {def && !def.indisponible && <PanneauFiltre c={c} def={def} res={res} filtres={filtres} regle={regle} echelle={echelle} nomListe={nomListe} premierNonDoc={premierNonDoc} />}
        </div>
      </div>
    </Sheet>
  );
}

function PanneauFiltre<T>({ c, def, res, filtres, regle, echelle, nomListe, premierNonDoc }: {
  c: CatalogueRA<T>; def: DefFiltreRA; res: ResultatRA<T>; filtres: EtatFiltresRA; regle: Regle; echelle: T[]; nomListe: string; premierNonDoc: (id: string) => T | undefined;
}) {
  const k = res.comptes[def.id];
  const valeur = filtres[def.id];
  const cibleNd = k && k.nonDocumentees > 0 ? premierNonDoc(def.id) : undefined;
  return (
    <div className="ra-pan-c" data-panneau={def.id}>
      <h3>{def.libelle}<small>fiches {nomListe}</small></h3>
      {def.genre === 'choix' && k && (
        <ul className="ra-opts">
          {k.options.map((o) => {
            const choisies = Array.isArray(valeur) ? valeur : [];
            const parDefaut = !!def.deBase && valeur === undefined && norm(o.libelle) === norm(nomListe);
            const sur = choisies.includes(o.valeur) || parDefaut;
            return (
              <li key={o.valeur}>
                <button type="button" role="checkbox" aria-checked={sur} className={cx('ra-opt', sur && 'ra-on')}
                  onClick={() => regle(def.id, parDefaut ? [o.valeur] : sur ? choisies.filter((x) => x !== o.valeur) : [...choisies, o.valeur])}>
                  <span className="ra-case" aria-hidden="true">{sur ? '✓' : ''}</span><span>{o.libelle}</span><b className="ra-m">{mil(o.n)}</b>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {def.genre === 'plage' && k && <Histogramme c={c} def={def} k={k} valeur={valeur} regle={regle} echelle={echelle} />}
      {def.genre === 'bascule' && (
        <button type="button" role="switch" aria-checked={valeur === true} className="ra-lig ra-lig-b" onClick={() => regle(def.id, valeur === true ? undefined : true)}>
          <span>{def.libelle}{k?.options[0] ? <b className="ra-m ra-lig-n"> {mil(k.options.find((o) => o.valeur === 'oui' || o.valeur === 'true')?.n ?? k.options[0].n)}</b> : null}</span><span className={cx('ra-tog', valeur === true && 'ra-tog-on')} aria-hidden="true" />
        </button>
      )}
      {k && k.nonDocumentees > 0 && (
        <button type="button" className="ra-ndl" data-booster="chercher-ia" disabled={!cibleNd || !c.chercherDonnee}
          onClick={() => cibleNd && c.chercherDonnee?.(cibleNd, def.id)}>
          <Search size={12} strokeWidth={2} aria-hidden="true" className="ra-i" /><span className="ra-ndl-t">{def.nonDoc ?? 'non documentée'} <b className="ra-m">{mil(k.nonDocumentees)}</b></span>{cibleNd && c.chercherDonnee && <span className="ra-ndl-a">chercher</span>}
        </button>
      )}
    </div>
  );
}

function Histogramme<T>({ c, def, k, valeur, regle, echelle: fiches }: {
  c: CatalogueRA<T>; def: DefFiltreRA; k: ComptesFacette; valeur: EtatFiltresRA[string] | undefined; regle: Regle; echelle: T[];
}) {
  const rep = def.repere, unite = def.unite;
  const cols = useMemo(() => k.options.map((o) => ({ ...o, b: bornesDe(o.valeur) })), [k.options]);
  const nmax = Math.max(1, ...cols.map((o) => o.n));
  const posee = estPlage(valeur) ? valeur : undefined;
  const dans = (b: Bornes | null) => !!posee && !!b && b.min >= posee.min && b.max <= posee.max;
  const choisir = (i: number) => {
    const b = cols[i].b;
    if (!b) return;
    const sel = cols.map((o, j) => (j === i ? !dans(o.b) : dans(o.b)));
    const retenues = cols.filter((o, j) => sel[j] && o.b);
    if (!retenues.length) return regle(def.id, undefined);
    regle(def.id, { min: Math.min(...retenues.map((o) => o.b!.min)), max: Math.max(...retenues.map((o) => o.b!.max)) });
  };
  // Le repère de la recette sur les colonnes : dans la colonne qui le contient, au prorata.
  let xRep: number | undefined;
  if (rep !== undefined) {
    cols.forEach((o, i) => {
      const b = o.b;
      if (!b || xRep !== undefined) return;
      const voisinLo = cols[i + 1]?.b, voisinHi = cols[i - 1]?.b;
      const lo = Number.isFinite(b.min) ? b.min : b.max - (voisinLo ? voisinLo.max - voisinLo.min : 2);
      const hi = Number.isFinite(b.max) ? b.max : b.min + (voisinHi ? voisinHi.max - voisinHi.min : 2);
      if (rep >= lo && rep < hi) xRep = ((i + (rep - lo) / (hi - lo)) / cols.length) * 100;
    });
  }
  const basc = rep === undefined ? undefined : def.repereGarde === 'min' ? { min: rep, max: Infinity } : { min: rep, max: rep };
  const bascOn = !!posee && !!basc && posee.min === basc.min && posee.max === basc.max;
  const e = c.echelle;
  const echelle = useMemo(() => {
    if (!e) return null;
    const vals = fiches.map((l) => ({ l, p: e.plage(l, def.id) })).filter((x): x is { l: T; p: Bornes } => !!x.p);
    const nombres = [...vals.flatMap((x) => [x.p.min, x.p.max]), ...cols.flatMap((o) => (o.b ? [o.b.min, o.b.max] : [])), ...(rep !== undefined ? [rep] : [])].filter(Number.isFinite);
    if (!vals.length || !nombres.length) return null;
    const lo = Math.min(...nombres), hi = Math.max(...nombres), marge = Math.max(1, (hi - lo) * 0.12);
    return { vals, lo: lo - marge, hi: hi + marge };
  }, [fiches, cols, rep, e, def.id]);
  const u = unite ? ` ${unite}` : '';
  return (
    <>
      <div className="ra-hist" data-booster="tolerance-histogramme" role="group" aria-label={`${def.libelle} : répartition des fiches`}>
        {cols.map((o, i) => (
          <button key={o.valeur} type="button" className={cx('ra-col', dans(o.b) && 'ra-on')} aria-pressed={dans(o.b)} disabled={!o.b}
            aria-label={`${o.libelle} : ${o.n} fiches`} onClick={() => choisir(i)}>
            <span className="ra-col-b" style={{ height: `${Math.max(3, (o.n / nmax) * 100)}%` }}><small className="ra-m">{mil(o.n)}</small></span>
          </button>
        ))}
        {xRep !== undefined && <i className="ra-reperl" style={{ left: `${xRep}%` }}><i>≈ {nb(rep!)}{u} · ta bière</i></i>}
      </div>
      <div className="ra-hax">{cols.map((o) => <span key={o.valeur} className="ra-m">{o.libelle}</span>)}</div>
      {basc && (
        <button type="button" role="switch" aria-checked={bascOn} className="ra-lig ra-lig-b" onClick={() => regle(def.id, bascOn ? undefined : basc)}>
          <span>{def.repereGarde === 'min' ? <>ne garder que ≥ {nb(rep!)}{u}</> : <>ne garder que ce qui couvre {nb(rep!)}{u}</>}</span>
          <span className={cx('ra-tog', bascOn && 'ra-tog-on')} aria-hidden="true" />
        </button>
      )}
      {echelle && e && (
        <div className="ra-vi" data-booster="vendues-sur-echelle">
          <small>{e.titre}</small>
          {echelle.vals.map(({ l, p }) => (
            <span key={c.idDe(l)}>
              <span className="ra-vi-n">{e.nomCourt(l)}</span><b className="ra-m">{textePlage(p)}</b>
              <i>
                {rep !== undefined && <em style={{ left: pct(rep, echelle.lo, echelle.hi) }} />}
                <u style={{ left: pct(p.min, echelle.lo, echelle.hi), width: `${Math.max(3, ((p.max - p.min) / (echelle.hi - echelle.lo)) * 100)}%` }} />
              </i>
            </span>
          ))}
        </div>
      )}
    </>
  );
}
