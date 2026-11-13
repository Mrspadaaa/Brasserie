// Mur du stock (maquette sy/fA) : l'adaptateur pur « articles du stock → rayons, colonnes, marques ». Aucune lecture de fichier ici : les catalogues
// arrivent par `SourcesMur` (voir murSources.ts), donc le calcul se teste sur des fixtures. Un inconnu reste un inconnu : α absent = marque hachurée,
// EBC absent = marque grise, atténuation absente = colonne « Autres » en gris. Jamais 0.
import type { StockItem, EquipmentItem, KegItem } from '../../types';
import {
  ALPHA_MIN, ALPHA_MAX, COLONNES_STYLE, SOMMET, bornesAttenuation, classerHoublons, couleurALaClarte, couleurHoublon, couleurLevure, couleurMalt, couleurSocle,
  formeCereale, ordreColonne, pastillesVides, traceCereale, traceHoublon, type FamilleBrasseur, type FormeCereale, type SommetHoublon,
} from './mur';

export type TypeMalt = 'base' | 'caramel' | 'torrefies' | 'speciaux';
export type ColonneLevure = 'ipa' | 'anglaise' | 'ble' | 'lager' | 'autres';
export interface InfosHoublon { id: string | null; role: 'aroma' | 'bittering' | 'dual' | null; origine: string | null; arome: number[] | null }
export interface SourcesMur {
  houblon(i: StockItem): InfosHoublon | null;
  parts(id: string): Record<string, number> | null;
  auFrais(id: string): number | null;
  typeMalt(i: StockItem): TypeMalt | null;
  colonneLevure(i: StockItem): ColonneLevure | null;
  attenuation(i: StockItem): number | null;
}

// ---------- chiffres ----------
const nf = (n: number): string => (Math.round(n * 10) / 10).toLocaleString('fr-FR');
export const enKg = (i: StockItem): number | null => { const u = i.unit.toLowerCase(); return u === 'kg' ? i.currentStock : u === 'g' ? i.currentStock / 1000 : null; };
export const enG = (i: StockItem): number | null => { const k = enKg(i); return k == null ? null : k * 1000; };
const qMalt = (kg: number) => (kg >= 1 ? `${nf(kg)} kg` : `${nf(kg * 1000)} g`);
const qHop = (g: number) => (g >= 1000 ? `${nf(g / 1000)} kg` : `${nf(g)} g`);

/** Hauteur d'une marque : linéaire jusqu'au coude C, puis logarithmique jusqu'à QM (deux régimes, comme la maquette). */
export function hauteurLog(q: number, C: number, QM: number, Hc: number, Hm: number): number {
  return Math.max(3, q <= C ? (Hc * q) / C : Hc + ((Hm - Hc) * Math.log(q / C)) / Math.log(QM / C));
}
/** Une marque en stock fait 8 px au moins (contrôle de la maquette, controle-distincts) : sous le coude, la droite de la maquette donne 6,6 px à 150 g, trop peu pour être distinguée. */
const HMIN_MARQUE = 8;
const arrondi = (x: number) => Math.round(x * 10) / 10;

// ---------- sorties ----------
export interface MarqueMur {
  ref: string; nom: string; titre: string; rayon: 'Malts' | 'Houblons' | 'Levures'; k: string;
  /** compter : quantité inconnue ; epuise : 0 ; vide : en stock. */
  etat: 'compter' | 'epuise' | null;
  hauteur: number; trace: string; fill: string; hachure: string | null;
  cereale?: string; forme?: FormeCereale; sommet?: SommetHoublon; teinte?: string; alpha?: number | null; parDefaut?: boolean;
  /** Levures : n briques (sachets) ou fioles, initiale de la souche, atténuation, forme, rang de bord. */
  n?: number; liquide?: boolean; ini?: string; att?: number | null; bord?: number; ddmDepassee?: boolean; inconnue?: boolean;
}
export interface GroupeMur {
  id: string; mot: string; court?: string; titre: string; ink: string; fill: string; total: string; marques: MarqueMur[]; socle: Record<string, string> | null;
  /** Malts : groupes à 1 kg (Caramel…) ; le premier porte l'étiquette « 1 kg ». */
  r2?: boolean; r2a?: boolean;
  /** Levures : comptes séparés (sachets, fioles) pour les icônes du total. */
  sachets?: number; fioles?: number;
}
export interface RayonMur { id: 'f0' | 'f1' | 'f2'; nom: 'Malts' | 'Houblons' | 'Levures'; systeme: 'M1' | 'HA' | 'L6'; total: number; sousTitre: string; echelle: string | null; hc: number; hm: number; groupes: GroupeMur[]; vides: string[]; hachures: string[] }
export interface CarteAutre { id: string; nom: string; total: number; lignes: Array<{ n: number; texte: string; alerte?: boolean }> }
export interface MurDonnees { rayons: RayonMur[]; autres: CarteAutre[] }

// ---------- houblons ----------
const EUROPE = new Set(['DE', 'CZ', 'SI', 'UK', 'GB', 'FR', 'PL', 'BE', 'AT', 'ES', 'PT']);
const AMERIQUES = new Set(['US', 'CA']);
const FR_MODERNE = 0.55;
/** Le catalogue Beer Maverick écrit l'origine en toutes lettres (« États-Unis »), l'article du stock en code (« US ») : un seul code pour les deux. Origine inconnue : null. */
const PAYS_VERS_CODE: Record<string, string> = { 'etats-unis': 'US', usa: 'US', 'royaume-uni': 'UK', angleterre: 'UK', allemagne: 'DE', tchequie: 'CZ', 'republique tcheque': 'CZ', slovenie: 'SI', france: 'FR', pologne: 'PL', belgique: 'BE', autriche: 'AT', espagne: 'ES', portugal: 'PT', canada: 'CA' };
export function codePays(o: string | null | undefined): string | null {
  const t = (o ?? '').trim(); if (!t) return null;
  if (/^[A-Za-z]{2}$/.test(t)) return t.toUpperCase();
  return PAYS_VERS_CODE[t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')] ?? t;
}
/** H1 : l'école du houblon (règles de gen-taxo, voie sk). Un houblon sans donnée assez nette : `autre` (colonne Pale, dit « par défaut »). */
export function familleBrasseur(info: InfosHoublon | null, alpha: number | null, frais: number | null): FamilleBrasseur {
  if (!info) return 'autre';
  const o = codePays(info.origine) ?? '';
  if (info.role === 'bittering' && (frais == null || frais < 0.25)) return 'amerisants';
  if (EUROPE.has(o) && (alpha == null || alpha <= 6)) return 'nobles';
  if (frais == null) return 'autre';
  if (frais >= FR_MODERNE) return 'modernes';
  if (AMERIQUES.has(o)) return 'classiques';
  return 'autre';
}
/** Teinte d'arôme d'un houblon : le descripteur le plus fort (≥ 3 sur 5, strictement devant le suivant) parmi les 9 axes de Beer Maverick ; sinon « non classé ». */
const AXE_VERS_TEINTE = ['agrumes', 'tropical', 'tropical', 'fruitsrouges', 'floral', 'epice', 'epice', 'epice', 'resine'] as const; // BM_AXES : citrus, tropicalFruit, stoneFruit, berry, floral, grassy, herbal, spice, resinPine
/** Les sept teintes de la légende de sa maquette (fA, c25 point 7), dans son ordre : couleurs de `gen-ha.mjs` (jetons-familles, #8FB43A du vin blanc ajouté au point 2 de c21). Le floral n'a pas de teinte : il est « non classé ». */
export const TEINTES_LEGENDE: ReadonlyArray<{ id: string; mot: string; couleur: string }> = [
  { id: 'agrumes', mot: 'agrumes', couleur: '#d9b414' }, { id: 'tropical', mot: 'tropical', couleur: '#ee9b2f' }, { id: 'vinblanc', mot: 'vin blanc, groseille', couleur: '#8FB43A' },
  { id: 'fruitsrouges', mot: 'fruits rouges', couleur: '#9b3f74' }, { id: 'resine', mot: 'résine, pin', couleur: '#2f6b5f' }, { id: 'epice', mot: 'épicé, herbes', couleur: '#7a4e3a' },
  { id: 'nonclasse', mot: 'arôme non classé', couleur: '#8C8279' },
];
export const BASE_TEINTE: Record<string, string> = Object.fromEntries(TEINTES_LEGENDE.map((t) => [t.id, t.couleur]));
/** L14 (D100), maquette fA point 2 : trois houblons phares dont la réputation contredit le seul descripteur Beer Maverick. Nelson Sauvin : vin blanc, groseille à maquereau (BM le range en fruits rouges) ; Galaxy : le tropical type (passion, pêche) ; Sabro : mandarine, agrumes. */
const TEINTE_CONFRONTEE: Record<string, string> = { 'nelson-sauvin': 'vinblanc', galaxy: 'tropical', sabro: 'agrumes' };
export function teinteArome(arome: number[] | null, idVariete?: string | null): string {
  const c = idVariete ? TEINTE_CONFRONTEE[idVariete.replace(/^beermaverick-/, '')] : undefined;
  if (c) return c;
  if (!arome || arome.length < 9) return 'nonclasse';
  const t = new Map<string, number>();
  arome.slice(0, 9).forEach((v, i) => t.set(AXE_VERS_TEINTE[i], Math.max(t.get(AXE_VERS_TEINTE[i]) ?? 0, v)));
  const tri = [...t.entries()].sort((a, b) => b[1] - a[1]);
  const dominante = tri[0][1] >= 3 && (tri.length < 2 || tri[0][1] > tri[1][1]) ? tri[0][0] : 'nonclasse';
  return dominante in BASE_TEINTE ? dominante : 'nonclasse'; // floral : pas de teinte dans sa légende
}
const COULEURS_COLONNE_HOUBLON: Array<[string, string]> = [['#2E5420', '#2E5420'], ['#3A6029', '#3A6029'], ['#466D37', '#466D37'], ['#527343', '#5F854E'], ['#567548', '#6B915A'], ['#5A7B4E', '#77A068']];

// ---------- malts ----------
const GROUPES_MALT: Array<{ id: TypeMalt; mot: string; ink: string; fill: string }> = [
  { id: 'base', mot: 'Base', ink: '#7e6429', fill: '#F2C14E' }, { id: 'caramel', mot: 'Caramel', ink: '#965b21', fill: '#C87A2C' },
  { id: 'torrefies', mot: 'Torréfiés', ink: '#3B1F14', fill: '#3B1F14' }, { id: 'speciaux', mot: 'Spéciaux', ink: '#A0522D', fill: '#A0522D' },
];
const sansAccent = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
/**
 * Le type d'un malt d'après son NOM, puis son EBC (c25 point 1) : les articles du stock portent des noms ordinaires (« Munich Malz », « Caramel 120 », « Malt chocolat »)
 * que le catalogue Beer Analytics ne reconnaît pas. Ordre : adjuvant cru, fumé ou acide (Spéciaux) ; torréfié (Carafa avant « cara » : il est torréfié) ; caramel ; base.
 * Sans nom reconnu, l'EBC tranche aux deux bouts seulement (≤ 30 : base ; ≥ 500 : torréfié) ; entre les deux, ou sans EBC : null, jamais un 0 qui ferait un malt de base.
 */
export function typeMaltParNom(nom: string, ebc: number | null | undefined): TypeMalt | null {
  const n = sansAccent(nom);
  if (/flocon|flak|\bcru\b|\braw\b|unmalted|non malte|torrefied|rauch|fume|smoke|tourbe|peat|sauer|acidul|\bacid/.test(n)) return 'speciaux';
  if (/choco|carafa|black|noir|roast|torrefie|patent/.test(n)) return 'torrefies';
  if (/\bcara\w*|caramel|crystal|cristal|special b\b/.test(n)) return 'caramel';
  if (/\bpils\w*|\bpale\b|munich|munchner|muenchner|vienna|viennois|wiener|weizen\w*|\bble\b|wheat|\blager\b|maris otter|golden promise|\bbase\b/.test(n)) return 'base';
  if (typeof ebc === 'number' && Number.isFinite(ebc) && ebc >= 0) return ebc <= 30 ? 'base' : ebc >= 500 ? 'torrefies' : null;
  return null;
}
/** Un sucre est un fermentescible : il se range dans le rayon Malts (forme « creux » de sa légende), pas dans Additifs. */
const EST_SUCRE = /sucre|sugar|candi|dextrose|saccharose|glucose|sirop|\bmiel\b|honey/;
const estSucre = (i: StockItem): boolean => !/^(houblon|levure)/i.test(i.category) && (/^sucre/i.test(sansAccent(i.category)) || EST_SUCRE.test(sansAccent(i.name)));
const cerealeDe = (nom: string): string => { const f = formeCereale(nom); return f === 'pointe' ? 'ble' : f === 'biseau' ? 'seigle' : f === 'dome' ? 'avoine' : f === 'creux' ? 'autre' : 'orge'; };
const NOM_CEREALE: Record<string, string> = { ble: 'blé', seigle: 'seigle', avoine: 'avoine', autre: 'autre céréale', orge: 'orge' };

// ---------- levures ----------
const GROUPES_LEVURE: Array<{ id: ColonneLevure; mot: string; ink: string; fill: string }> = [
  { id: 'ipa', mot: 'IPA', ink: '#7A5C22', fill: '#7A5C22' }, { id: 'anglaise', mot: 'Anglaise', ink: '#7e693b', fill: '#9D8249' },
  { id: 'ble', mot: 'Blé', ink: '#746644', fill: '#C1A971' }, { id: 'lager', mot: 'Lager', ink: '#6e644a', fill: '#E4CF98' }, { id: 'autres', mot: 'Autres', ink: '#5E5E5E', fill: '#9E9E9E' },
];
const MOTS_LABO = /^(saf(ale|lager)?|lalbrew|lallemand|fermentis|wyeast|white|labs|wlp\d*|\d{3,4}|brew|yeast|levure|dry)$/i;
/** L'initiale qui nomme la souche : « US-05 » U, « WB-06 » B6, « Nottingham » N, « WLP002 English Ale » E. */
export function initialeSouche(nom: string): string {
  const mots = nom.replace(/[™®]/g, '').split(/[\s·]+/).filter((m) => m && !MOTS_LABO.test(m));
  const m = mots[0] ?? nom;
  const wb = /^WB-?(\d)(\d)/i.exec(m);
  if (wb) return 'B' + wb[2];
  return (m.match(/[A-Za-zÀ-ÿ]/)?.[0] ?? '?').toUpperCase();
}

// ---------- la construction ----------
export function construireMur(items: StockItem[], src: SourcesMur, equipements: EquipmentItem[] = [], futs: KegItem[] = [], aujourdhui = new Date()): MurDonnees {
  const cat = (i: StockItem) => i.category.toLowerCase();
  const malts = items.filter((i) => /^malt/.test(cat(i)) || estSucre(i));
  const houblons = items.filter((i) => /^houblon/.test(cat(i)));
  const levures = items.filter((i) => /^levure/.test(cat(i)));
  const rayons: RayonMur[] = [];

  // ---- Malts ----
  {
    const par = new Map<TypeMalt, StockItem[]>();
    // La source d'abord (Beer Analytics) ; son « Spéciaux » ou son silence cèdent au nom puis à l'EBC. Un sucre est un spécial (forme creux).
    for (const i of malts) {
      const s = src.typeMalt(i);
      const t: TypeMalt = estSucre(i) && !/^malt/.test(cat(i)) ? 'speciaux' : s && s !== 'speciaux' ? s : typeMaltParNom(i.name, i.colorEbc) ?? s ?? 'speciaux';
      par.set(t, [...(par.get(t) ?? []), i]);
    }
    const groupes: GroupeMur[] = [];
    let premierR2 = true;
    for (const g of GROUPES_MALT) {
      const li = par.get(g.id); if (!li?.length) continue;
      const R = g.id === 'base' ? 5 : 1;
      const tri = ordreColonne(li, (i) => (i.colorEbc != null ? -i.colorEbc : null), (i) => enKg(i));
      const marques = tri.map((i): MarqueMur => {
        const kg = enKg(i); const cer = cerealeDe(i.name); const forme = formeCereale(i.name);
        const inconnu = !Number.isFinite(i.currentStock) || kg == null;
        const h = arrondi(inconnu ? 12 + (forme === 'droite' ? 0 : 2) : kg! <= 0 ? 8 : Math.max(HMIN_MARQUE, hauteurLog(kg!, R, R * 40, 11, 28)));
        const fill = i.colorEbc != null ? couleurMalt(i.colorEbc) : '#9a9a9a';
        const q = inconnu ? 'à compter' : kg! <= 0 ? 'épuisé' : qMalt(kg!);
        return {
          ref: i.ref, nom: i.name, rayon: 'Malts', k: i.ref, etat: inconnu ? 'compter' : kg! <= 0 ? 'epuise' : null, hauteur: h, trace: traceCereale(forme, h), fill, hachure: null, cereale: cer, forme,
          titre: [i.name, q, i.colorEbc != null ? `EBC ${i.colorEbc.toLocaleString('fr-FR')}` : 'EBC non connu', NOM_CEREALE[cer]].join(' · '),
        };
      });
      const somme = tri.reduce((s, i) => s + (enKg(i) ?? 0), 0);
      groupes.push({ id: g.id, mot: g.mot, titre: g.mot, ink: g.ink, fill: g.fill, total: qMalt(somme), marques, socle: null, r2: g.id !== 'base', r2a: g.id !== 'base' && premierR2 && !(premierR2 = false) });
    }
    // Pastilles « rien en stock » (maquette fA, SXV) : les colonnes sans article, puis « Fumé » et « Sucres » (absents du rayon ; masqués quand l'article existe).
    const fume = malts.some((i) => /rauch|fume|smoke|tourbe|peat/.test(sansAccent(i.name))); const sucre = malts.some(estSucre);
    const videsMalts = [...GROUPES_MALT.map((g) => g.mot), ...(fume ? [] : ['Fumé']), ...(sucre ? [] : ['Sucres'])];
    rayons.push({ id: 'f0', nom: 'Malts', systeme: 'M1', total: malts.length, sousTitre: 'rangés par type', echelle: groupes.length ? '5 kg' : null, hc: 11, hm: 28, groupes, vides: pastillesVides(videsMalts, groupes.map((g) => g.mot)), hachures: [] });
  }

  // ---- Houblons ----
  {
    const infos = new Map<string, InfosHoublon | null>(); const alphaDe = new Map<string, number | null>(); const fraisDe = new Map<string, number | null>();
    for (const i of houblons) {
      const inf = src.houblon(i); infos.set(i.ref, inf);
      alphaDe.set(i.ref, Number.isFinite(i.alphaPct) ? i.alphaPct! : null);
      fraisDe.set(i.ref, inf?.id ? src.auFrais(inf.id) : null);
    }
    const famille = (i: StockItem) => familleBrasseur(infos.get(i.ref) ?? null, alphaDe.get(i.ref) ?? null, fraisDe.get(i.ref) ?? null);
    const classes = classerHoublons(houblons.map((i) => ({ id: i.ref, parts: infos.get(i.ref)?.id ? src.parts(infos.get(i.ref)!.id!) : null, famille: famille(i) })));
    const groupes: GroupeMur[] = []; const hachures = new Set<string>(); const remplies: string[] = [];
    COLONNES_STYLE.forEach((col, ci) => {
      const li = houblons.filter((i) => classes[i.ref]?.colonne === col.id); if (!li.length) return;
      const [ink, fill] = COULEURS_COLONNE_HOUBLON[ci]; remplies.push(col.court);
      const tri = ordreColonne(li, (i) => alphaDe.get(i.ref), (i) => enG(i));
      const marques = tri.map((i): MarqueMur => {
        const g = enG(i); const a = alphaDe.get(i.ref) ?? null; const inf = infos.get(i.ref) ?? null; const f = fraisDe.get(i.ref);
        const inconnu = !Number.isFinite(i.currentStock) || g == null;
        const sommet = SOMMET[famille(i)]; const teinte = teinteArome(inf?.arome ?? null, inf?.id);
        const h = arrondi(inconnu ? 12 : g! <= 0 ? 8 : Math.max(HMIN_MARQUE, hauteurLog(g!, 250, 4000, 11, 28)));
        const base = BASE_TEINTE[teinte];
        let fillM: string; let hach: string | null = null;
        if (a == null) { const bord = couleurALaClarte(base, 38); hach = bord; fillM = `url(#syh-${bord.slice(1)})`; hachures.add(bord.slice(1)); } else fillM = couleurHoublon(base, a);
        const q = inconnu ? 'à compter' : g! <= 0 ? 'épuisé' : qHop(g!);
        return {
          ref: i.ref, nom: i.name, rayon: 'Houblons', k: i.ref, etat: inconnu ? 'compter' : g! <= 0 ? 'epuise' : null, hauteur: h, trace: traceHoublon(sommet, h), fill: fillM, hachure: hach, sommet, teinte, alpha: a,
          parDefaut: classes[i.ref]?.parDefaut,
          titre: [i.name, q, a != null ? `α ${nf(a)} %` : 'α non connu', f != null ? `${Math.round(f * 100)} % au frais` : null].filter(Boolean).join(' · '),
        };
      });
      const alphas = tri.map((i) => alphaDe.get(i.ref)).filter((x): x is number => x != null);
      const lo = alphas.length ? Math.min(...alphas) : 0; const hi = alphas.length ? Math.max(...alphas) : 0;
      const socle: Record<string, string> = {};
      for (const i of tri) { const c = couleurSocle(ink, alphaDe.get(i.ref), lo, hi); if (c) socle[i.name] = c; }
      groupes.push({ id: col.id, mot: col.court, court: col.court, titre: col.nom, ink, fill, total: qHop(tri.reduce((s, i) => s + (enG(i) ?? 0), 0)), marques, socle });
    });
    rayons.push({ id: 'f1', nom: 'Houblons', systeme: 'HA', total: houblons.length, sousTitre: 'rangés par style de bière', echelle: groupes.length ? '250 g' : null, hc: 11, hm: 28, groupes, vides: pastillesVides(COLONNES_STYLE.map((c) => c.court), remplies), hachures: [...hachures] });
  }

  // ---- Levures ----
  {
    const bornes = bornesAttenuation(levures.map((i) => src.attenuation(i)));
    const par = new Map<ColonneLevure, StockItem[]>();
    for (const i of levures) { const c = src.colonneLevure(i) ?? 'autres'; par.set(c, [...(par.get(c) ?? []), i]); }
    const groupes: GroupeMur[] = []; const remplies: string[] = []; let rang = 0;
    for (const g of GROUPES_LEVURE) {
      const li = par.get(g.id); if (!li?.length) continue; remplies.push(g.mot);
      const tri = ordreColonne(li, (i) => src.attenuation(i), (i) => i.currentStock);
      const marques = tri.map((i): MarqueMur => {
        const att = src.attenuation(i); const liquide = i.yeastForm === 'liquide';
        const n = Number.isFinite(i.currentStock) ? Math.max(0, Math.round(i.currentStock)) : 0;
        const inconnu = !Number.isFinite(i.currentStock);
        const fill = g.id === 'autres' ? couleurLevure(g.fill, att, bornes) : couleurLevure(g.fill, att, bornes);
        const ddm = i.yeastLot && (i.yeastLot as { bestBefore?: string }).bestBefore ? String((i.yeastLot as { bestBefore?: string }).bestBefore) : null;
        const depassee = !!ddm && !Number.isNaN(Date.parse(ddm)) && Date.parse(ddm) < aujourdhui.getTime();
        const unite = liquide ? (n > 1 ? 'fioles' : 'fiole') : n > 1 ? 'sachets' : 'sachet';
        return {
          ref: i.ref, nom: i.name, rayon: 'Levures', k: i.ref, etat: inconnu ? 'compter' : n === 0 ? 'epuise' : null, hauteur: 0, trace: '', fill, hachure: null, n, liquide, ini: initialeSouche(i.yeastStrain ?? i.name), att, bord: rang++ % 3, ddmDepassee: depassee, inconnue: g.id === 'autres',
          titre: [i.name, inconnu ? 'à compter' : n === 0 ? 'épuisé' : `${n} ${unite}`, liquide ? 'liquide' : 'sèche', ddm ? `DDM ${ddm}${depassee ? ' dépassée' : ''}` : 'DDM non connue'].join(' · '),
        };
      });
      const sech = tri.filter((i) => i.yeastForm !== 'liquide').reduce((s, i) => s + (Number.isFinite(i.currentStock) ? i.currentStock : 0), 0);
      const liq = tri.filter((i) => i.yeastForm === 'liquide').reduce((s, i) => s + (Number.isFinite(i.currentStock) ? i.currentStock : 0), 0);
      const socle: Record<string, string> = {};
      const atts = tri.map((i) => src.attenuation(i)).filter((x): x is number => x != null);
      for (const i of tri) { const a = src.attenuation(i); if (a != null && atts.length) { const c = couleurSocle(g.ink, a, Math.min(...atts), Math.max(...atts)); if (c) socle[i.name] = c; } }
      groupes.push({ id: g.id, mot: g.mot, titre: g.mot, ink: g.ink, fill: g.fill, total: [sech ? `${sech} sachet${sech > 1 ? 's' : ''}` : '', liq ? `${liq} fiole${liq > 1 ? 's' : ''}` : ''].filter(Boolean).join(' · ') || '0', marques, socle, sachets: sech, fioles: liq });
    }
    rayons.push({ id: 'f2', nom: 'Levures', systeme: 'L6', total: levures.length, sousTitre: 'rangées par bière', echelle: null, hc: 0, hm: 32, groupes, vides: pastillesVides(['IPA', 'Anglaise', 'Blé', 'Lager', 'Saison', 'Sour'], remplies), hachures: [] });
  }

  return { rayons, autres: cartesAutres(items, equipements, futs) };
}

// ---------- Autres stocks ----------
const bas = (i: StockItem) => (i.minStock != null && Number.isFinite(i.currentStock) && i.currentStock <= i.minStock) || i.reorder === true;
export function cartesAutres(items: StockItem[], equipements: EquipmentItem[], futs: KegItem[]): CarteAutre[] {
  const autres = items.filter((i) => !/^(malt|houblon|levure)/i.test(i.category) && !estSucre(i)); // le sucre est au rayon Malts
  const groupe = (i: StockItem): 'Additifs' | 'Emballage' | 'Nettoyage' => /emballage/i.test(i.category) ? 'Emballage' : /cip|d[ée]sinfect|d[ée]tergent|sols|epi|nettoy/i.test(i.category) ? 'Nettoyage' : 'Additifs';
  const cartes: CarteAutre[] = [];
  for (const nom of ['Additifs', 'Emballage', 'Nettoyage'] as const) {
    const li = autres.filter((i) => groupe(i) === nom); if (!li.length) continue;
    const nBas = li.filter(bas).length; const nCompter = li.filter((i) => !Number.isFinite(i.currentStock)).length;
    const lignes: CarteAutre['lignes'] = [];
    if (nBas) lignes.push({ n: nBas, texte: 'bas', alerte: false });
    if (nCompter) lignes.push({ n: nCompter, texte: 'à compter' });
    cartes.push({ id: nom, nom, total: li.length, lignes });
  }
  if (futs.length) { const p = futs.filter((f) => f.state === 'plein').length; cartes.push({ id: 'Fûts', nom: 'Fûts', total: futs.length, lignes: p ? [{ n: p, texte: p > 1 ? 'pleins' : 'plein' }] : [] }); }
  if (equipements.length) { const r = equipements.filter((e) => e.state === 'À réparer').length; cartes.push({ id: 'Matériel', nom: 'Matériel', total: equipements.length, lignes: r ? [{ n: r, texte: 'à réparer', alerte: true }] : [] }); }
  return cartes;
}

export { ALPHA_MIN, ALPHA_MAX };
