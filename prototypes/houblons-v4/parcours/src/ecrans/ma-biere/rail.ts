// Le rail des étapes de sa base v4.10 (work/refonte-frontend/v4/ecran-1/base/generateur/etape-consolide.js ;
// BRIEF-RAIL.md ; D27, D28, D34 à D37, D41 à D47, D55, D56, D61, D61 bis, D63, D64, D67 à D69), repris tel quel :
// les valeurs du rail (ébullition par 5′ de sa durée à 0′, whirlpool de 100 à 60 °C par 5, fermentation puis
// post-fermentation de J+0 à J+14), la loupe à plateau ×3 qui suit le doigt (le Dock « sans état »), l'échelle du
// geste qui laisse aller d'un bout à l'autre du rail dans l'écran, et le geste lui-même : carte repliée en puce qui
// suit le doigt, graduations du segment sous le doigt, minutes écrites, rien de recalculé avant le lâcher, geste
// interrompu qui rend tout. Le code de la base est porté ligne à ligne ; seules les commandes de dessin (h()) cèdent
// la place au DOM rendu par React (Frise.tsx), et la fin du geste rend la main à l'état du parcours.
// Classes propres préfixées pq-mb- (L26).

export const J_MAX = 14;
export const SEGMENTS = ['ebullition', 'whirlpool', 'fermentation', 'post'] as const;
export type Segment = (typeof SEGMENTS)[number];
export const TETE_SEG: Record<Segment, string> = { ebullition: 'T-ebu', whirlpool: 'T-wp', fermentation: 'T-dryActive', post: 'T-dryPost' };
/** Les températures du whirlpool, de 100 à 60 °C par 5 (base : D.tables.wp.temperatures). */
export const WP_TEMPERATURES = [100, 95, 90, 85, 80, 75, 70, 65, 60];
/** Les durées du whirlpool réglables sur la carte (base : D.tables.wp.minutes ; moteur : WP_MINUTES, 5 à 60 par 5). */
export const WP_MINUTES = Array.from({ length: 12 }, (_, k) => 5 * (k + 1));

/** Les valeurs du rail, pour une ébullition de `ebu` minutes : « b60 », « wp80 », « f3 », « p10 », « fwh ». */
export function creerRail(ebu: number) {
  const valeursSeg = (s: Segment): string[] => {
    if (s === 'ebullition') return Array.from({ length: Math.floor(ebu / 5) + 1 }, (_, k) => 'b' + (ebu - 5 * k));
    if (s === 'whirlpool') return WP_TEMPERATURES.map((t) => 'wp' + t);
    return Array.from({ length: J_MAX + 1 }, (_, j) => (s === 'fermentation' ? 'f' : 'p') + j);
  };
  const segDe = (v: string): Segment => (v === 'fwh' || /^b\d/.test(v) ? 'ebullition' : /^wp/.test(v) ? 'whirlpool' : /^f\d/.test(v) ? 'fermentation' : 'post');
  const toutesValeurs = () => ['fwh', ...SEGMENTS.flatMap(valeursSeg)];
  /** Ordre d'une ligne dans son segment : premier moût, puis minutes restantes, °C, jours. */
  const rangValeur = (v: string) => (v === 'fwh' ? -1 : /^b/.test(v) ? ebu - Number(v.slice(1)) : /^wp/.test(v) ? 100 - Number(v.slice(2)) : Number(v.slice(1)));
  const majeure = (s: Segment, v: string) => {
    const n = Number(v.replace(/^\D+/, ''));
    return s === 'ebullition' ? n % (ebu > 90 ? 30 : 15) === 0 : s === 'whirlpool' ? n % 10 === 0 : n % 7 === 0;
  };
  /** La valeur écrite d'une graduation : 35′, 80 °C, J+3. */
  const texteGrad = (v: string) => (/^b\d/.test(v) ? v.slice(1) + '′' : /^wp/.test(v) ? v.slice(2) + ' °C' : 'J+' + v.slice(1));
  return { ebu, valeursSeg, segDe, toutesValeurs, rangValeur, majeure, texteGrad };
}
export type Rail = ReturnType<typeof creerRail>;

/* ---------- La loupe et le geste : p02, Dock sans état (D47, D55, D56, D61, D63, D64) ---------- */
// Un cran déplace le plateau de 2 écarts du rail de base : au plus 11,5 px par 5′, soit 23 px (D61 bis).
// La loupe : 11,5 px par graduation au plus, 6 au moins (D69 : moins sur un petit écran) ; au loin,
// un cinquième, entre 1,2 et 3 px. bord : le bas du rail à 16 px du bas de l'écran ; garde : la marge
// de la traversée (D69).
const LOUPE = { poids: 5, max: { focus: 11.5, autre: 3 }, min: { focus: 6, autre: 1.2 }, marge: 120, bord: 16, garde: 8, ouverture: 170, gros: 3, plateau: 1, rampe: 2 };
const KG = LOUPE.gros - 1;
// Écarts fixes de la structure (px) : tête d'ébullition → début, 0′ → whirlpool, whirlpool → 100 °C,
// 60 °C → levure, levure → fermentation, fermentation → J+0, J+14 → post, post → J+0, fin du rail.
const STRUCT = [16, 20, 12, 16, 22, 12, 16, 12, 6];
const COUTURES = [[1, 2], [3, 4, 5], [6, 7]]; // écarts de structure entre deux segments voisins

interface Plan {
  P: Record<string, number>; R: Record<string, number>; haut: number; bas: number;
  seg: Segment; e: Record<Segment, number>; Pl: number; Ra: number; surplus: number; cA: number;
  F0: number; F1: number; Zh: number; Zb: number; O: number; Z: number[];
}
interface Echelle { F: number; haut: number; vHaut: number; vBas: number }

function dock(R: Rail) {
  const { valeursSeg, segDe } = R;
  const EBU = R.ebu;
  const nIntervalles = (s: Segment) => valeursSeg(s).length - 1;
  /* Plan de base du rail (sans grossissement) pour des écarts e (par segment) et des ajouts aux écarts
     de structure x, la tête d'ébullition centrée en h : y de chaque graduation (P), des rangées (R). */
  function planFixe(e: Record<Segment, number>, x: number[], h: number) {
    const g = (i: number) => STRUCT[i] + (x[i] || 0);
    const P: Record<string, number> = {}, Rg: Record<string, number> = { 'T-ebu': h };
    let y = h + g(0);
    const poser = (s: Segment) => { valeursSeg(s).forEach((v, k) => { P[v] = y + k * e[s]; }); y += nIntervalles(s) * e[s]; };
    poser('ebullition');
    Rg['T-fin'] = y; Rg['T-wp'] = y + g(1); y = Rg['T-wp'] + g(2);
    poser('whirlpool');
    Rg['T-levure'] = y + g(3); Rg['T-dryActive'] = Rg['T-levure'] + g(4); y = Rg['T-dryActive'] + g(5);
    poser('fermentation');
    Rg['T-dryPost'] = y + g(6); y = Rg['T-dryPost'] + g(7);
    poser('post');
    return { P, R: Rg, haut: h - 10, bas: y + g(8) };
  }
  const structAvant = (v: string) => ({ ebullition: 1, whirlpool: 3, fermentation: 6, post: 8 })[segDe(v)];
  /* Le Dock : forme du plateau (1 sur ±Pl, rampe jusqu'à 0 sur Ra) et son intégrale M, impaire. */
  const forme = (G: Plan, d: number) => { const a = Math.abs(d); return a <= G.Pl ? 1 : Math.max(0, 1 - (a - G.Pl) / G.Ra); };
  const Mpl = (G: Plan, x: number) => {
    const a = Math.abs(x), r = a - G.Pl;
    const v = a <= G.Pl ? a : r <= G.Ra ? G.Pl + r - (r * r) / (2 * G.Ra) : G.Pl + G.Ra / 2;
    return Math.sign(x) * v;
  };
  const grossi = (G: Plan, z: number, c: number) => 1 + KG * forme(G, z - c);
  /* Hors du segment tenu, le Dock reste garé au bord du segment : le rail y est immobile. Aux deux bouts
     du rail (la durée d'ébullition, J+14 de la post-fermentation), le centre du plateau se tient à une
     graduation du bord, et le doigt y est encore sur le plateau (D45). Entre deux segments, il passe sans
     s'arrêter : le doigt y avance au pas du rail (D69). */
  const borne = (G: Plan, c: number) => Math.max(G.F0, Math.min(G.F1, c));
  const centre = (G: Plan, c: number) => Math.max(G.Zh + G.Pl, Math.min(G.Zb - G.Pl, c));
  /* Position affichée du point z du rail de base, le doigt sur c (haut du rail fixe). */
  const Yd = (G: Plan, z: number, c: number) => { const k = centre(G, c); return G.O + z + KG * (Mpl(G, z - k) + Mpl(G, k - G.haut)); };
  const phi = (G: Plan, c: number) => Yd(G, c, c) - G.O;
  /* Le point c du rail de base sous le doigt : seule la position du doigt compte. */
  function sousDoigt(G: Plan, yF: number) {
    const t = yF - G.O;
    let lo = G.haut - 400, hi = G.bas + 400;
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (phi(G, m) < t) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  /* Les crans : la graduation tenue est la plus proche du doigt ; le rail reste immobile dans sa tranche. */
  function cran(G: Plan, c: number) {
    let b = G.Z[0];
    for (const z of G.Z) if (Math.abs(z - c) < Math.abs(b - c)) b = z;
    return b;
  }
  /* D69 : la traversée (le doigt avance d'un écart de loupe F par graduation ; aux bouts, 2 de plus). */
  function traversee(v: string) {
    const iS = SEGMENTS.indexOf(segDe(v)), V = valeursSeg(SEGMENTS[iS]), i = Math.max(0, V.indexOf(v));
    const premier = iS === 0, dernier = iS === SEGMENTS.length - 1, j = V.length - 1 - i;
    const n = (a: readonly Segment[]) => a.reduce((t, s) => t + nIntervalles(s), 0);
    const demi = (a: number[][]) => a.reduce((t, c) => t + c.reduce((u, k) => u + STRUCT[k], 0) / 2, 0);
    return {
      sB: j + (dernier && j ? 2 : 0), aB: n(SEGMENTS.slice(iS + 1)) + (dernier ? 0 : 2), fixeB: demi(COUTURES.slice(iS)) + STRUCT[8] + LOUPE.garde,
      sH: i + (premier && i ? 2 : 0), aH: n(SEGMENTS.slice(0, iS)) + (premier ? 0 : 2), fixeH: demi(COUTURES.slice(0, iS)) + STRUCT[0] + 10 + LOUPE.garde,
    };
  }
  /* L'échelle du geste, choisie à la prise : la loupe F la plus grande (11,5 px au plus) avec laquelle le doigt va du
     houblon tenu jusqu'à J+14 de la post-fermentation et jusqu'à la durée d'ébullition ; si la loupe y tomberait sous
     6 px, le rail peut monter jusqu'en haut de la zone qui défile (la barre d'IBU s'efface). Coordonnées : depuis le
     haut de la frise ; hautZone et basZone : la zone qui défile, dans le même repère. */
  function echelleGeste(vA: string, yA: number, hautZone: number, basZone: number): Echelle {
    const vHaut = Math.max(0, hautZone), vBas = basZone - LOUPE.bord;
    const t = traversee(vA);
    const pasB = t.sB + t.aB, pasH = t.sH + t.aH;
    const Fb = pasB ? (vBas - yA - t.fixeB) / pasB : Infinity, Fh = (h: number) => (pasH ? (yA - h - t.fixeH) / pasH : Infinity);
    let haut = vHaut, F = Math.min(Fb, Fh(haut));
    if (F < LOUPE.min.focus && Fh(haut) < Fb) { haut = hautZone; F = Math.min(Fb, Fh(haut)); }
    return { F: Math.max(LOUPE.min.focus, Math.min(LOUPE.max.focus, F)), haut, vHaut, vBas };
  }
  /* Le rail de base, la graduation v sous le doigt : le segment de v en loupe, les autres au cinquième de l'échelle du
     geste. D67 : le doigt passé dans un autre segment, le rail se refait autour du doigt. D68 : la tête du rail reste en
     haut. Garde-fou : un rail qui ne tiendrait pas dans l'écran resserre sa loupe ; à la prise, le bas reste aussi dans
     la hauteur du repos + 120 px (D55). */
  function disposerDock(vA: string, yA: number, H0: number, ech: Echelle, prise = false): Plan {
    const plafond = prise ? Math.min(ech.vBas, H0 + LOUPE.marge - 2) : ech.vBas;
    const segA = segDe(vA), t = traversee(vA);
    const loupe = Math.min(LOUPE.max.focus,
      t.sH ? (yA - ech.haut - t.fixeH - ech.F * t.aH) / t.sH : Infinity,
      t.sB ? (ech.vBas - yA - t.fixeB - ech.F * t.aB) / t.sB : Infinity);
    const e = Object.fromEntries(SEGMENTS.map((s) => [s, s === segA ? Math.max(LOUPE.min.autre, loupe) : Math.max(LOUPE.min.autre, Math.min(LOUPE.max.autre, ech.F / LOUPE.poids))])) as Record<Segment, number>;
    const plan = (e: Record<Segment, number>, x: number[]): Plan => {
      const f = planFixe(e, x, 0);
      const G = { ...f, seg: segA, e, Pl: LOUPE.plateau * e[segA], Ra: LOUPE.rampe * e[segA], surplus: 0, cA: 0, F0: 0, F1: 0, Zh: 0, Zb: 0, O: 0, Z: [] as number[] } as Plan;
      G.surplus = KG * (2 * G.Pl + G.Ra);
      G.cA = vA === 'fwh' ? G.P['b' + EBU] - e.ebullition : G.P[vA];
      const Va = valeursSeg(segA);
      G.F0 = G.P[Va[0]]; G.F1 = G.P[Va[Va.length - 1]]; G.Zh = G.P['b' + EBU]; G.Zb = G.P['p' + J_MAX];
      G.O = 0; G.O = yA - phi(G, G.cA); G.Z = Va.map((v) => G.P[v]);
      return G;
    };
    const tient = (G: Plan) => G.O + G.bas + G.surplus <= plafond + 0.5 && G.O + G.haut >= ech.haut - 0.5;
    if (!tient(plan(e, []))) {
      let lo = LOUPE.min.autre, hi = e[segA];
      for (let i = 0; i < 24; i++) { e[segA] = (lo + hi) / 2; if (tient(plan(e, []))) lo = e[segA]; else hi = e[segA]; }
      e[segA] = lo;
    }
    const avant = SEGMENTS.slice(0, SEGMENTS.indexOf(segA)), N = avant.reduce((t, s) => t + nIntervalles(s), 0);
    const G1 = plan(e, []), vide = G1.O + G1.haut - ech.vHaut;
    if (N && vide > 0) for (const s of avant) e[s] = Math.min(e[segA], e[s] + vide / N);
    const x: number[] = [];
    const k = structAvant(vA);
    const G0 = plan(e, x);
    const reste = Math.min(H0 - Yd(G0, G0.bas, G0.cA), ech.vBas - yA - t.fixeB - t.sB * e[segA] - t.aB * ech.F);
    if (reste > 0) { const n = STRUCT.length - 1 - k; for (let i = k; i < STRUCT.length - 1; i++) x[i] = reste / n; }
    if (segA !== 'ebullition') { const libre = G0.O + G0.haut - ech.vHaut - 10; if (libre > 0) for (let i = 0; i < k; i++) x[i] = (x[i] || 0) + libre / k; }
    return plan(e, x);
  }
  return { echelleGeste, disposerDock, sousDoigt, cran, borne, Yd, grossi };
}

/* ---------- Le geste ---------- */
/* Après un glisser, le clic qui suit le lâcher est ignoré (il tomberait sous le doigt). */
let IGNORE_CLIC = 0;
if (typeof document !== 'undefined') {
  document.addEventListener('click', (e) => { if (performance.now() < IGNORE_CLIC) { e.stopPropagation(); e.preventDefault(); } }, true);
}
const REDUIT = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface OptionsGeste {
  rail: Rail;
  /** La frise ([data-rang] pour chaque rangée et chaque ligne, .pq-mb-grad pour les graduations, .pq-mb-axe). */
  frise: HTMLElement;
  /** La ligne tenue ([data-rang="L…"]). */
  carte: HTMLElement;
  /** Valeur du rail de la ligne tenue. */
  v: string;
  /** Le libellé du moment sur la poignée (« 35′ », « 80 °C », « J+3 »), et son type (« ébullition », « à froid »). */
  libelle: (v: string) => string;
  /** La zone qui défile (le haut et le bas que le rail ne dépasse pas), et l'élément qui s'efface quand le rail y monte. */
  zone: () => { haut: number; bas: number };
  estompe: HTMLElement | null;
  /** Le lâcher : la nouvelle valeur (null : rien n'a changé ou le geste est interrompu). */
  fin: (v: string | null) => void;
}
export interface Geste { id: number; suivre: (y: number) => void; lacher: (y: number) => void; annuler: () => void; carte: HTMLElement }
let GESTE: Geste | null = null;
export const gesteEnCours = () => GESTE;

/** La loupe s'ouvre au premier mouvement du doigt, ou après 120 ms de maintien : un toucher bref sur la poignée ne
 * fait rien clignoter. Rend les écouteurs à poser sur la poignée. */
export function brancherGlisser(poignee: HTMLElement, options: () => OptionsGeste) {
  let attente: { clientY: number; pointerId: number; timer: number } | null = null;
  const demarrer = (cy: number | null) => {
    const a = attente!;
    attente = null;
    clearTimeout(a.timer);
    GESTE = ouvrirLoupe(options(), a);
    if (cy != null) GESTE.suivre(cy);
  };
  const bas = (e: PointerEvent) => {
    if (e.button > 0 || GESTE || attente) return;
    e.preventDefault();
    e.stopPropagation();
    try { poignee.setPointerCapture(e.pointerId); } catch { /* pointeur synthétique */ }
    attente = { clientY: e.clientY, pointerId: e.pointerId, timer: 0 };
    attente.timer = window.setTimeout(() => { if (attente) demarrer(null); }, 120);
  };
  const bouge = (e: PointerEvent) => {
    if (attente && attente.pointerId === e.pointerId) { if (Math.abs(e.clientY - attente.clientY) >= 2) demarrer(e.clientY); }
    else if (GESTE && GESTE.id === e.pointerId) GESTE.suivre(e.clientY);
  };
  const haut = (e: PointerEvent) => {
    if (attente && attente.pointerId === e.pointerId) { clearTimeout(attente.timer); attente = null; return; }
    if (GESTE && GESTE.id === e.pointerId) GESTE.lacher(e.clientY);
  };
  // D42 : un geste interrompu par le téléphone (pointercancel, touchcancel, capture perdue) rend tout.
  const interrompre = () => {
    if (attente) { clearTimeout(attente.timer); attente = null; }
    if (GESTE && GESTE.carte === options().carte) GESTE.annuler();
  };
  const perdue = () => { setTimeout(interrompre, 0); };
  poignee.addEventListener('pointerdown', bas);
  poignee.addEventListener('pointermove', bouge);
  poignee.addEventListener('pointerup', haut);
  poignee.addEventListener('pointercancel', interrompre);
  poignee.addEventListener('touchcancel', interrompre);
  poignee.addEventListener('lostpointercapture', perdue);
  return () => {
    poignee.removeEventListener('pointerdown', bas);
    poignee.removeEventListener('pointermove', bouge);
    poignee.removeEventListener('pointerup', haut);
    poignee.removeEventListener('pointercancel', interrompre);
    poignee.removeEventListener('touchcancel', interrompre);
    poignee.removeEventListener('lostpointercapture', perdue);
  };
}

function ouvrirLoupe(o: OptionsGeste, ev: { clientY: number; pointerId: number }): Geste {
  const { frise: fr, carte, rail } = o;
  const D = dock(rail);
  const reduit = REDUIT();
  const R0 = fr.getBoundingClientRect();
  const lignes = [...fr.children].filter((r): r is HTMLElement => r instanceof HTMLElement && !!r.dataset.rang);
  const repos = new Map(lignes.map((r) => { const b = r.getBoundingClientRect(); return [r, b.top - R0.top] as const; }));
  const q = carte.querySelector<HTMLElement>('[data-role="glisser-moment"]')!;
  const qTexte = q.querySelector<HTMLElement>('[data-role="moment-pouce"]')!;
  const qNoeud = qTexte.firstChild as Text | null;
  const qAvant = qNoeud?.nodeValue ?? '';
  const nAvant = q.getAttribute('aria-valuenow');
  const rangs = rail.toutesValeurs();
  const pq = q.getBoundingClientRect();
  const yA = pq.top + pq.height / 2 - R0.top;
  const topCarte = repos.get(carte)!;
  const vA = o.v;
  const ticks = [...fr.querySelectorAll<HTMLElement>('.pq-mb-grad')].map((el) => ({ el, v: el.dataset.etape!, s: el.dataset.graduation as Segment, etat: '', y: NaN, ecrit: false }));
  const tetes = Object.fromEntries(lignes.filter((r) => /^T-/.test(r.dataset.rang!)).map((r) => [r.dataset.rang!, r]));
  const axe = fr.querySelector<HTMLElement>('.pq-mb-axe');
  // Tout sort du flux sans bouger ; la carte tenue se réduit à une ligne, les autres lignes à leur nom et leur moment,
  // les rangées nommées se compactent ; les hauteurs sont mesurées ensuite.
  fr.style.height = R0.height + 'px';
  fr.setAttribute('data-geste', '');
  for (const [r, top] of repos) r.style.transform = 'translateY(' + top + 'px)';
  carte.setAttribute('data-glisse', '');
  carte.classList.add('pq-mb-leve');
  for (const r of lignes) if (r !== carte && /^L/.test(r.dataset.rang!)) r.classList.add('pq-mb-jeton');
  const avecDe = (el: HTMLElement) => el.querySelector<HTMLElement>('.pq-mb-avec');
  const avecTenu = avecDe(carte);
  // r7 : les hauteurs se lisent sans transition (les boutons de l'app animent leur hauteur) : sinon la carte tenue est
  // mesurée encore dépliée (41 px au lieu de 32) et efface le houblon d'à côté (Cascade à 80 °C, D56 ; sa base le montre).
  fr.classList.add('pq-mb-mesure');
  const hauteur = new Map(lignes.map((r) => [r, r.getBoundingClientRect().height]));
  fr.classList.remove('pq-mb-mesure');
  const hCarte = hauteur.get(carte)!;
  const zone = o.zone();
  const ech = D.echelleGeste(vA, yA, zone.haut - R0.top + 8, zone.bas - R0.top);
  let G = D.disposerDock(vA, yA, R0.height, ech, true);
  const ancre = (v: string) => G.P[v] ?? (v === 'fwh' ? G.P['b' + rail.ebu] - G.e.ebullition : G.P[rail.valeursSeg(rail.segDe(v)).slice(-1)[0]]);
  const rangees = Object.entries(tetes).filter(([k]) => k in G.R).map(([k, el]) => ({ el, k, z: G.R[k], h: hauteur.get(el)!, y: 0 }));
  const jetons = lignes.filter((r) => r !== carte && /^L/.test(r.dataset.rang!)).map((el) => {
    const v = el.dataset.valeur!;
    return { el, v, nom: el.dataset.nom ?? '', quand: o.libelle(v), z: ancre(v), h: hauteur.get(el)!, avec: avecDe(el), fondu: false, txt: '', y: 0, lie: [] as string[] };
  }).sort((a, b) => a.z - b.z);
  const toutes = rail.toutesValeurs().filter((v) => v !== 'fwh');
  const y0 = ev.clientY;
  const g = { id: ev.pointerId, v: vA, seg: rail.segDe(vA), bouge: false, dy: 0, ferme: false };
  const plusProche = (c: number) => { let b = toutes[0], d = Infinity; for (const v of toutes) { const x = Math.abs(G.P[v] - c); if (x < d) { d = x; b = v; } } return b; };
  const croise = (a0: number, a1: number, b0: number, b1: number) => a0 < b1 + 1 && b0 < a1 + 1;
  // L'ouverture : de la place au repos à la place sur le Dock, en 170 ms (aussitôt en mouvement réduit).
  let p = reduit ? 1 : 0, t0 = performance.now(), depart = repos;
  const lisse = (k: number) => 1 - Math.pow(1 - k, 3);
  const placer = (el: HTMLElement & { _t?: string }, y: number) => { const s = 'translateY(' + y.toFixed(1) + 'px)'; if (el._t !== s) { el._t = s; el.style.transform = s; } };
  let yDoigt = yA, txtTenu = '';
  const poserTout = () => {
    const k = p >= 1 ? 1 : lisse(p);
    const vers = (el: HTMLElement, cible: number) => depart.get(el)! + (cible - depart.get(el)!) * k;
    const c = D.cran(G, D.borne(G, D.sousDoigt(G, yDoigt)));
    for (const r of rangees) { r.y = vers(r.el, D.Yd(G, r.z, c) - r.h / 2) + r.h / 2; placer(r.el, r.y - r.h / 2); }
    // Les autres houblons : à leur moment, jamais de côté. Sous la carte tenue, ils s'effacent ; au même moment qu'elle,
    // leur nom rejoint son étiquette ; deux autres qui se touchent, une étiquette.
    const avecT: string[] = [];
    const yC0 = topCarte + g.dy, yC1 = yC0 + hCarte;
    let prec: (typeof jetons)[number] | null = null;
    for (const j of jetons) {
      j.y = D.Yd(G, j.z, c);
      placer(j.el, vers(j.el, j.y - j.h / 2));
      let fondu = false;
      j.lie = [];
      if (croise(j.y - j.h / 2, j.y + j.h / 2, yC0, yC1)) { fondu = true; if (j.v === g.v) avecT.push(j.nom); }
      else if (prec && croise(j.y - j.h / 2, j.y + j.h / 2, prec.y - prec.h / 2, prec.y + prec.h / 2)) { fondu = true; prec.lie.push(j.v === prec.v ? j.nom : j.quand + ' ' + j.nom); }
      else prec = j;
      if (fondu !== j.fondu) { j.fondu = fondu; j.el.classList.toggle('pq-mb-fondu', fondu); }
    }
    for (const j of jetons) { const t = j.lie.length ? '· ' + j.lie.join(' · ') : ''; if (t !== j.txt && j.avec) { j.txt = t; j.avec.textContent = t; } }
    const t = avecT.length ? '· ' + avecT.join(' · ') : '';
    if (t !== txtTenu && avecTenu) { txtTenu = t; avecTenu.textContent = t; }
    // Les graduations du segment sous le doigt : longues et foncées dans la loupe, courtes au loin.
    for (const tk of ticks) {
      const z = G.P[tk.v], y = D.Yd(G, z, c);
      if (tk.y !== y) { tk.y = y; tk.el.style.transform = 'translateY(' + (y - 1).toFixed(1) + 'px)'; }
      const etat = tk.s !== g.seg ? '' : D.grossi(G, z, c) >= 1.6 ? 'vue' : 'vue loin';
      if (etat !== tk.etat) { tk.etat = etat; tk.el.classList.toggle('pq-mb-vue', etat !== ''); tk.el.classList.toggle('pq-mb-courte', etat === 'vue loin'); }
    }
    // Le Dock écrit ses minutes : sur les graduations grossies, à droite du trait, hors de la pastille tenue (20 px au
    // moins du doigt), sans toucher une carte, une étape ni la minute écrite au-dessus.
    const occupe = [[yC0, yC1], ...rangees.map((r) => [r.y - r.h / 2, r.y + r.h / 2]), ...jetons.filter((j) => !j.fondu).map((j) => [j.y - j.h / 2, j.y + j.h / 2])];
    let dernier = -Infinity;
    for (const tk of ticks) {
      const ecrit = k >= 1 && tk.etat === 'vue' && tk.v !== g.v && Math.abs(tk.y - yDoigt) >= 20 && tk.y - dernier >= 16
        && !occupe.some(([a, b]) => tk.y + 7 > a && tk.y - 7 < b);
      if (ecrit) dernier = tk.y;
      if (ecrit !== tk.ecrit) { tk.ecrit = ecrit; tk.el.classList.toggle('pq-mb-ecrit', ecrit); }
    }
    const yTete = D.Yd(G, G.R['T-ebu'], c), yBas = D.Yd(G, G.bas, c);
    if (axe) { axe.style.top = yTete + 'px'; axe.style.height = Math.max(0, yBas - 6 - yTete) + 'px'; axe.style.bottom = 'auto'; }
    fr.style.height = Math.max(R0.height, yBas) + 'px';
    o.estompe?.classList.toggle('pq-mb-rail-haut', D.Yd(G, G.haut, c) < -8);
    return c;
  };
  tetes[TETE_SEG[g.seg]]?.classList.add('pq-mb-focus');
  poserTout();
  const animer = (now: number) => { if (g.ferme) return; p = Math.min(1, (now - t0) / LOUPE.ouverture); poserTout(); if (p < 1) requestAnimationFrame(animer); };
  if (p < 1) requestAnimationFrame(animer);
  /* D67 : le doigt passé dans un autre segment, ce segment devient la loupe ; le rail se refait autour du doigt, en
     170 ms depuis sa place du moment. */
  const refaire = (v: string) => {
    const top = fr.getBoundingClientRect().top;
    depart = new Map(lignes.map((r) => [r, r.getBoundingClientRect().top - top] as const));
    G = D.disposerDock(v, yDoigt, R0.height, ech);
    for (const r of rangees) r.z = G.R[r.k];
    for (const j of jetons) j.z = ancre(j.v);
    p = reduit ? 1 : 0; t0 = performance.now();
    if (p < 1) requestAnimationFrame(animer);
  };
  const ecrireMoment = (v: string) => {
    const t = o.libelle(v);
    if (qNoeud) qNoeud.nodeValue = t;
    q.setAttribute('aria-valuetext', t);
    // r7 : le curseur dit son rang pendant le geste (aria-valuenow), pas seulement son libellé (controle-rail, D27).
    q.setAttribute('aria-valuenow', String(Math.max(0, rangs.indexOf(v))));
  };
  const suivre = (cy: number) => {
    const dy = cy - y0;
    g.dy = dy; yDoigt = yA + dy;
    carte.style.transform = 'translateY(' + (topCarte + dy) + 'px)';
    if (!g.bouge && Math.abs(dy) >= 3) g.bouge = true;
    const pr = plusProche(D.sousDoigt(G, yDoigt));
    const sPr = rail.segDe(pr);
    if (sPr !== G.seg) refaire(pr);
    if (sPr !== g.seg) { tetes[TETE_SEG[g.seg]]?.classList.remove('pq-mb-focus'); g.seg = sPr; tetes[TETE_SEG[g.seg]]?.classList.add('pq-mb-focus'); }
    if (g.bouge && pr !== g.v) { g.v = pr; ecrireMoment(pr); }
    poserTout();
  };
  /* Tout se referme : les styles du geste sont rendus, l'état du parcours reçoit la nouvelle valeur, puis chaque
     rangée revient de sa place sur le Dock à sa place au repos (240 ms). */
  const fermer = (v: string | null) => {
    g.ferme = true;
    GESTE = null;
    const avant = new Map(lignes.map((r) => [r.dataset.rang!, r.getBoundingClientRect().top]));
    o.estompe?.classList.remove('pq-mb-rail-haut');
    if (g.bouge) IGNORE_CLIC = performance.now() + 400;
    fr.removeAttribute('data-geste');
    fr.style.height = '';
    for (const r of lignes) { r.style.transform = ''; (r as HTMLElement & { _t?: string })._t = undefined; r.classList.remove('pq-mb-jeton', 'pq-mb-fondu', 'pq-mb-leve', 'pq-mb-focus'); }
    carte.removeAttribute('data-glisse');
    for (const el of fr.querySelectorAll<HTMLElement>('.pq-mb-avec')) el.textContent = '';
    for (const tk of ticks) { tk.el.style.transform = ''; tk.el.classList.remove('pq-mb-vue', 'pq-mb-courte', 'pq-mb-ecrit'); }
    if (axe) { axe.style.top = ''; axe.style.height = ''; axe.style.bottom = ''; }
    if (qNoeud) qNoeud.nodeValue = qAvant;
    q.setAttribute('aria-valuetext', qAvant);
    if (nAvant != null) q.setAttribute('aria-valuenow', nAvant);
    o.fin(v);
    if (reduit) return;
    requestAnimationFrame(() => {
      for (const r of fr.children) {
        if (!(r instanceof HTMLElement) || !r.dataset.rang) continue;
        const t0b = avant.get(r.dataset.rang);
        if (t0b == null) continue;
        const d = t0b - r.getBoundingClientRect().top;
        if (Math.abs(d) > 0.5) r.animate([{ transform: 'translateY(' + d + 'px)' }, { transform: 'none' }], { duration: 240, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    });
  };
  const lacher = (cy: number) => {
    suivre(cy);
    const v = g.bouge ? plusProche(D.sousDoigt(G, yA + g.dy)) : vA;
    fermer(v !== vA ? v : null);
  };
  return { id: g.id, suivre, lacher, annuler: () => fermer(null), carte };
}
