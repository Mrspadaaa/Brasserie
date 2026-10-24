// La légende sous les pastilles, choisie par le brasseur le 24.10 au soir (lot fils24-legendes, leg3-v2f) : « Tu peux
// intégrer légende type leg3-v2a · Les barres n/N mais barre leg3-v2e · Les spéciaux repliés » ; « Légende vraiment
// bien, avec icône sans full text, bonne infos ciblé mais barre comme leg3-v2e ».
// - La bande s'ouvre case à case : chaque carré s'élargit, son picto dessous (gris si la famille n'est pas décrite),
//   puis la petite barre de v2e (part des fiches qui la disent, n/N) et un point si la famille est en tête d'une fiche.
// - Les spéciaux repliés : « ◇ 2 hors des 12 · 3 mots précis · huiles › » ; au toucher, les mots précis de chaque famille
//   (D131 ter), les mots hors des 12 avec leurs sources (D130), ce que les fiches disent en propre (Hopsteiner : linalol,
//   thiols, huiles ; géraniol non publié : « ? »).
// Données : describeFamilies et familyWords du moteur, catalogue du houblon ; rien d'inventé. Classes pq-mb-lg- (L26).
import { useEffect, useState } from 'react';
import { COULEURS, COURT } from '../../commun';
import { describeFamilies, familyWords, hopRef, FAMILY_NAMES, type FamilyId } from '../../../../src/engine';
import type { HoublonLu } from '../../moteur';

// Les mots qui ne font que redire la famille ne sont pas des mots précis.
const GENERIQUES = new Set(['agrumes', 'citrus', 'citrique', 'floral', 'florale', 'fleuri', 'herbacé', 'herbal', 'herbaceous', 'terreux', 'earthy',
  'épicé', 'épices', 'spicy', 'spice', 'fruits tropicaux', 'tropical', 'résineux', 'resinous', 'resin', 'résine', 'végétal', 'vegetal', 'baies',
  'berry', 'berries', 'melon', 'noyau', 'fruits à noyau', 'stone fruit', 'pépins', 'fruits à pépins', 'fruité', 'fruity']);

export interface Speciaux {
  premier: Set<FamilyId>;
  precis: Partial<Record<FamilyId, string[]>>;
  sans: { mot: string; sources: string[] }[];
  fiches: { nom: string; valeur: string | null }[];
  source: string | null;
}
const virgule = (x: number) => String(x).replace('.', ',');
const plage = (r: [number, number] | number[] | undefined | null) => (r && r.length === 2 ? (r[0] === r[1] ? virgule(r[0]) : `${virgule(r[0])}–${virgule(r[1])}`) : null);

const memo = new Map<string, Speciaux>();
export function speciauxDe(cle: string): Speciaux {
  if (memo.has(cle)) return memo.get(cle)!;
  const h = hopRef(cle);
  const vide: Speciaux = { premier: new Set(), precis: {}, sans: [], fiches: ['linalol', 'thiols', 'géraniol', 'huiles'].map((nom) => ({ nom, valeur: null })), source: null };
  if (!h) { memo.set(cle, vide); return vide; }
  const d = describeFamilies(h.varietyId) as Record<FamilyId, { first?: boolean }>;
  const w = familyWords(h.varietyId, h.catalogue) as { mots: Record<FamilyId, { source: string; mots: string[] }[]>; sansFamille: { source: string; mot: string }[] };
  const premier = new Set((Object.keys(d) as FamilyId[]).filter((f) => d[f].first));
  const precis: Speciaux['precis'] = {};
  for (const f of Object.keys(w.mots) as FamilyId[]) {
    const vus = new Map<string, string>();
    const generiques = new Set([...GENERIQUES, FAMILY_NAMES[f].toLowerCase(), COURT[f].toLowerCase()]);
    for (const s of w.mots[f]) for (const m of s.mots) { const k = m.trim().toLowerCase(); if (k && !generiques.has(k) && !vus.has(k)) vus.set(k, m.trim()); }
    if (vus.size) precis[f] = [...vus.values()];
  }
  const sans = new Map<string, Set<string>>();
  for (const x of w.sansFamille) { const k = x.mot.trim().toLowerCase(); if (!sans.has(k)) sans.set(k, new Set()); sans.get(k)!.add(x.source); }
  const cat = h.catalogue as { hs?: { totalOil?: number[]; year?: number }; hsLinalool?: { range?: number[] }; hsThiol?: { class?: string } };
  const fiches = [
    { nom: 'linalol', valeur: plage(cat.hsLinalool?.range) ? `${plage(cat.hsLinalool?.range)} %` : null },
    { nom: 'thiols', valeur: cat.hsThiol?.class ?? null },
    { nom: 'géraniol', valeur: null },
    { nom: 'huiles', valeur: plage(cat.hs?.totalOil) ? `${plage(cat.hs?.totalOil)} mL/100 g` : null },
  ];
  const r: Speciaux = { premier, precis, sans: [...sans].map(([mot, s]) => ({ mot, sources: [...s] })), fiches, source: cat.hs?.year ? `Hopsteiner ${cat.hs.year}` : cat.hs ? 'Hopsteiner' : null };
  memo.set(cle, r);
  return r;
}

/** Les pictos gris des familles non décrites : le même dessin que la planche, au trait gris (pas de filtre, D88). */
function useSpriteGris() {
  useEffect(() => {
    if (document.getElementById('pq-mb-lg-g-floral')) return;
    const src = document.getElementById('p-floral')?.parentElement;
    if (!src) return;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.style.position = 'absolute';
    for (const f of Object.keys(COULEURS)) {
      const s = document.getElementById(`p-${f}`)?.cloneNode(true) as SVGElement | undefined;
      if (!s) continue;
      s.id = `pq-mb-lg-g-${f}`; s.setAttribute('stroke', '#8a8a8a');
      svg.append(s);
    }
    document.body.append(svg);
  }, []);
}

/** La bande ouverte, case à case. `effet` : le trait de ce que l'ajout fait bouger dans ma bière (carte du rail). */
export function BandeOuverte({ h, ordre, effet, onFermer }: {
  h: HoublonLu; ordre: readonly FamilyId[]; effet?: Partial<Record<FamilyId, { crans: number; hors: boolean }>>; onFermer: () => void;
}) {
  useSpriteGris();
  const sp = speciauxDe(h.cle);
  return (
    <div data-role="bande-ouverte" role="group" aria-label={`Arômes de ${h.nom}, famille par famille`} className="pq-mb-lg-grille"
      onClick={(e) => { e.stopPropagation(); onFermer(); }}>
      {ordre.map((f) => {
        const fam = h.familles[f];
        const n = fam.niveau;
        const e = effet?.[f];
        return (
          <span key={f} className="pq-mb-lg-col" title={`${COURT[f]} : ${fam.fiches}/${fam.sur} fiches${sp.premier.has(f) ? ', en tête d’une fiche' : ''}`}>
            <i className="pq-mb-lg-sq" style={{ background: n === 'non décrit' ? 'rgb(var(--cave-800))' : COULEURS[f].base, opacity: n === 'cité' ? 0.55 : 1 }} />
            <svg width="18" height="18" viewBox="0 0 24 24" data-famille={f} role="img" aria-label={COURT[f]}><use href={`#${n === 'non décrit' ? 'pq-mb-lg-g-' : 'p-'}${f}`} /></svg>
            <span className="pq-mb-lg-trk" data-fiches={`${fam.fiches}/${fam.sur}`}><i style={{ width: `${fam.sur ? Math.round((100 * fam.fiches) / fam.sur) : 0}%`, background: COULEURS[f].base }} /></span>
            <i className={sp.premier.has(f) ? 'pq-mb-lg-tete' : 'pq-mb-lg-tete pq-mb-lg-vide'} />
            {e && <><i className="pq-mb-lg-tr" style={{ width: `${Math.min(22, 5 * Math.max(1, Math.round(e.crans)))}px`, background: e.hors ? '#c2410c' : COULEURS[f].base }} />
              <b className="pq-mb-lg-eff" style={{ color: e.hors ? '#c2410c' : undefined }}>+{Math.round(e.crans)}</b></>}
          </span>
        );
      })}
    </div>
  );
}

/** Les spéciaux, repliés en une pastille ; au toucher : mots précis, ◇ hors des 12 et leurs sources, ce que disent les fiches. */
export function SpeciauxRepli({ h }: { h: HoublonLu }) {
  const [ouvert, setOuvert] = useState(false);
  const sp = speciauxDe(h.cle);
  const familles = Object.keys(sp.precis) as FamilyId[];
  const nMots = familles.length;
  return (
    <div className="pq-mb-lg-spec" onPointerDown={(e) => e.stopPropagation()} onClick={(e) => e.stopPropagation()}>
      <button type="button" data-role="speciaux" aria-expanded={ouvert} onClick={() => setOuvert((o) => !o)} className="pq-mb-lg-pastille">
        <span aria-hidden="true">◇</span> {sp.sans.length} hors des 12 · {nMots} mot{nMots > 1 ? 's' : ''} précis · huiles <span aria-hidden="true">›</span>
      </button>
      {ouvert && (
        <div data-role="speciaux-ouverts" className="pq-mb-lg-ouverts">
          {familles.length > 0 && <span className="pq-mb-lg-ligne">{familles.map((f) => (
            <span key={f} className="pq-mb-lg-precis"><svg width="15" height="15" viewBox="0 0 24 24" data-famille={f} role="img" aria-label={COURT[f]}><use href={`#p-${f}`} /></svg>
              <i style={{ color: f === 'citrus' ? COULEURS[f].texte : undefined }}>{sp.precis[f]!.join(' · ')}</i></span>))}</span>}
          <span className="pq-mb-lg-ligne">{sp.sans.length ? <><b aria-label="hors des 12 familles">◇</b>{sp.sans.map((x, k) => (
            <span key={x.mot}>{k > 0 && <i className="pq-mb-lg-sep">·</i>}{x.mot}<small> {x.sources.join(', ')}</small></span>))}</> : <span className="pq-mb-lg-gris">◇ aucun mot hors des 12</span>}</span>
          <span className="pq-mb-lg-ligne">{sp.fiches.map((x) => (
            <span key={x.nom}>{x.nom} {x.valeur ? <b>{x.valeur}</b> : <b className="pq-mb-lg-inc" aria-label="inconnu">?</b>}</span>))}
            <small>{sp.source ?? 'non publié'}</small></span>
        </div>
      )}
    </div>
  );
}

/** La clé, en icônes : la petite barre, le point en tête, les trois tons. */
export function CleBande() {
  return (
    <span className="pq-mb-lg-cle">
      <span className="pq-mb-lg-trk pq-mb-lg-trk-cle"><i style={{ width: '50%', background: '#888' }} /></span> fiches qui la disent (n/N)
      <i className="pq-mb-lg-tete pq-mb-lg-tete-cle" /> en tête d’une fiche
      <i className="pq-mb-lg-mini" style={{ background: COULEURS.tropical.base }} />marquée
      <i className="pq-mb-lg-mini" style={{ background: COULEURS.tropical.base, opacity: 0.55 }} />citée
      <i className="pq-mb-lg-mini" style={{ background: 'rgb(var(--cave-800))' }} />non décrite
    </span>
  );
}
