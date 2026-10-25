// La légende sous les pastilles : leg3-v2a telle quelle, avec seulement la petite barre de v2e (D140, règle n° 1).
// Le brasseur, sur sa capture de la carte ouverte de Nugget dans v2a : « Je veux qqch comme ça moi ???? » ; avant :
// « Légende vraiment bien, avec icône sans full text, bonne infos ciblé mais barre comme leg3-v2e ».
// Référence : work/refonte-frontend/v4/ecran-1/fils24-legendes/leg3/v2a.html (captures/leg3-v2a.png), barre de v2e.
// - Toucher la bande l'ouvre case à case : carré, picto (gris si la famille n'est pas décrite), point « en tête d'une
//   fiche », la petite barre de v2e (part des fiches qui la disent, n/N), le trait de ce que l'ajout fait bouger.
// - Dessous, les lignes de v2a, ouvertes : mots précis avec leur picto (D131 ter) ; ◇ et les mots hors des 12 avec
//   leurs sources (D130) ; linalol, thiols, géraniol « ? » ; huiles et leur source ; (ajout proposé) « si ajouté à 10′ :
//   … » ; la clé ; puis la rangée des tons (marquée, citée, non décrite) avec « ? » et « Sans X › ».
// - Le « ? » ouvre la bande et, en plus, la ligne des autres icônes (comme v2a.html).
// Données : describeFamilies, familyWords, additionEffect du moteur, catalogue Hopsteiner ; rien d'inventé. Classes
// pq-mb-lg- (L26). Contrôle : controle-legende-v2a.mjs.
import { useEffect } from 'react';
import { COULEURS, COURT } from '../../commun';
import { additionEffect, describeFamilies, familyWords, hopRef, FAMILY_NAMES, type FamilyId } from '../../../../../../src/domain/hopIndex/v4';
import { style, type HoublonLu } from '../../moteur';
import type { AjoutParcours, RecetteParcours } from '../../etat/types';

// Les mots qui ne font que redire la famille ne sont pas des mots précis.
const GENERIQUES = new Set(['agrumes', 'citrus', 'citrique', 'floral', 'florale', 'fleuri', 'herbacé', 'herbal', 'herbaceous', 'terreux', 'earthy',
  'épicé', 'épices', 'spicy', 'spice', 'fruits tropicaux', 'tropical', 'résineux', 'resinous', 'resin', 'résine', 'végétal', 'vegetal', 'baies',
  'berry', 'berries', 'melon', 'noyau', 'fruits à noyau', 'stone fruit', 'pépins', 'fruits à pépins', 'fruité', 'fruity']);

// Les mots tels que v2a les montre (règle n° 1 ; « Fais ce que v2a fait », 25.10). La table vient de v2a, rien d'autre :
// - un mot anglais dont l'équivalent français est déjà là disparaît (Pineapple / ananas, Fresh lime / citron vert) ; un mot
//   anglais seul que v2a traduit se traduit (lemon zest → zeste de citron) ; les autres restent tels quels (woody, resiny) ;
// - un mot contenu dans un autre mot gardé disparaît (citron, dans citron vert) ;
// - les sources et les thiols s'écrivent comme dans v2a (Hopsteiner US ; thiols moyens).
const EQUIVALENTS: Record<string, string> = { pineapple: 'ananas', 'fresh lime': 'citron vert', 'lemon zest': 'zeste de citron' };
const SOURCES: Record<string, string> = { 'Hopsteiner (boutique US)': 'Hopsteiner US' };
const THIOLS: Record<string, string> = { moyenne: 'moyens' };

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
    for (const s of w.mots[f]) for (const m of s.mots) {
      const brut = m.trim(), fr = EQUIVALENTS[brut.toLowerCase()] ?? brut, k = fr.toLowerCase();
      if (k && !generiques.has(k) && !vus.has(k)) vus.set(k, fr);
    }
    const mots = [...vus.values()];
    const gardes = mots.filter((m) => !mots.some((x) => x !== m && ` ${x.toLowerCase()} `.includes(` ${m.toLowerCase()} `)));
    if (gardes.length) precis[f] = gardes;
  }
  const sans = new Map<string, Set<string>>();
  for (const x of w.sansFamille) { const k = x.mot.trim().toLowerCase(); if (!sans.has(k)) sans.set(k, new Set()); sans.get(k)!.add(SOURCES[x.source] ?? x.source); }
  const cat = h.catalogue as { hs?: { totalOil?: number[]; year?: number }; hsLinalool?: { range?: number[] }; hsThiol?: { class?: string } };
  const fiches = [
    { nom: 'linalol', valeur: plage(cat.hsLinalool?.range) ? `${plage(cat.hsLinalool?.range)} %` : null },
    { nom: 'thiols', valeur: cat.hsThiol?.class ? (THIOLS[cat.hsThiol.class] ?? cat.hsThiol.class) : null },
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
            <i className={sp.premier.has(f) ? 'pq-mb-lg-tete' : 'pq-mb-lg-tete pq-mb-lg-vide'} />
            <span className="pq-mb-lg-trk" data-fiches={`${fam.fiches}/${fam.sur}`}><i style={{ width: `${fam.sur ? Math.round((100 * fam.fiches) / fam.sur) : 0}%`, background: COULEURS[f].base }} /></span>
            {e && <><i className="pq-mb-lg-tr" style={{ width: `${Math.min(22, 5 * Math.max(1, Math.round(e.crans)))}px`, background: e.hors ? '#c2410c' : COULEURS[f].base }} />
              <b className="pq-mb-lg-eff" style={{ color: e.hors ? '#c2410c' : undefined }}>+{Math.round(e.crans)}</b></>}
          </span>
        );
      })}
    </div>
  );
}

/** « si ajouté à 10′ : floral +1 cran » : l'effet établi du moteur pour l'ajout proposé (additionEffect sur la recette, en crans
 * du style arrondis ; la famille attendue qui bouge d'abord), comme l'effet de la carte (Carte.tsx, effetTag). */
export function effetSiAjoute(ajout: AjoutParcours, recette: RecetteParcours): string {
  try {
    const sc = style(recette.styleCode);
    const eff = additionEffect(ajout as never, recette as never) as unknown as Record<string, { established: boolean; central: number | null }> | null;
    if (!eff) return 'effet non établi';
    const crans = (f: FamilyId) => { const e = eff[f]; return e && e.established && e.central != null ? Math.round(Math.round((e.central / sc.families[f].cran) * 100) / 100) : 0; };
    const fs = sc.order.filter((f) => crans(f) !== 0);
    const f = fs.find((x) => sc.families[x].status === 'attendue') ?? fs[0];
    if (!f) return '≈ inchangé';
    const d = crans(f);
    return `${COURT[f].toLowerCase()} ${d > 0 ? '+' : '−'}${Math.abs(d)} cran${Math.abs(d) > 1 ? 's' : ''}`;
  } catch { return 'effet non établi'; }
}

/** Les lignes de v2a sous la bande ouverte, dans son ordre : mots précis, ◇, fiches, huiles, (si ajouté), clé. */
export function LignesV2a({ h, siAjoute }: { h: HoublonLu; siAjoute?: { moment: string; effet: string } }) {
  const sp = speciauxDe(h.cle);
  const familles = Object.keys(sp.precis) as FamilyId[];
  const fiches = sp.fiches.filter((x) => x.nom !== 'huiles'), huiles = sp.fiches.find((x) => x.nom === 'huiles');
  const val = (v: string | null | undefined) => (v ? <b>{v}</b> : <b className="pq-mb-lg-inc" aria-label="inconnu">?</b>);
  return (
    <div data-role="legende-bande" className="pq-mb-lg-lignes" onClick={(e) => e.stopPropagation()}>
      {familles.length > 0 && <span className="pq-mb-lg-ligne">{familles.map((f) => (
        <span key={f} className="pq-mb-lg-precis"><svg width="15" height="15" viewBox="0 0 24 24" data-famille={f} role="img" aria-label={COURT[f]}><use href={`#p-${f}`} /></svg>
          <i style={{ color: f === 'citrus' ? COULEURS[f].texte : undefined }}>{sp.precis[f]!.join(' · ')}</i></span>))}</span>}
      {sp.sans.length > 0 && <span className="pq-mb-lg-ligne"><b className="pq-mb-lg-los" aria-label="hors des 12 familles">◇</b>{sp.sans.map((x, k) => (
        <span key={x.mot}>{k > 0 && <i className="pq-mb-lg-sep">·</i>}{x.mot}<small> {x.sources.join(', ')}</small></span>))}</span>}
      <span className="pq-mb-lg-ligne">{fiches.map((x) => <span key={x.nom}>{x.nom} {val(x.valeur)}</span>)}</span>
      <span className="pq-mb-lg-ligne"><span>huiles {val(huiles?.valeur)}</span><small>{sp.source ?? 'non publié'}</small></span>
      {siAjoute && <span className="pq-mb-lg-ligne"><span className="pq-mb-lg-gris">si ajouté</span>{' '}<b className="pq-mb-lg-si">à {siAjoute.moment} : {siAjoute.effet}</b></span>}
      <span className="pq-mb-lg-cle">
        <span className="pq-mb-lg-trk pq-mb-lg-trk-cle"><i style={{ width: '50%', background: '#888' }} /></span> fiches qui la disent ·
        <i className="pq-mb-lg-tete pq-mb-lg-tete-cle" /> en tête d’une fiche
      </span>
    </div>
  );
}

/** La rangée des tons de v2a : marquée, citée, non décrite (montrés, pas décrits). */
export function TonsV2a() {
  return (
    <span data-role="tons" className="pq-mb-lg-tons">
      <span><i className="pq-mb-lg-mini" style={{ background: COULEURS.tropical.base }} />marquée</span>
      <span><i className="pq-mb-lg-mini" style={{ background: COULEURS.tropical.base, opacity: 0.55 }} />citée</span>
      <span><i className="pq-mb-lg-mini" style={{ background: 'rgb(var(--cave-800))' }} />non décrite</span>
    </span>
  );
}
