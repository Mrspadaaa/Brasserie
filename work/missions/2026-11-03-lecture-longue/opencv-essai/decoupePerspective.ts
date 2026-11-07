// D381 : la découpe d'une longue PHOTO par OpenCV.js (worker `decoupePerspective.worker.ts`) : les coins du papier, le redressement 4 points avec une
// marge prise dans la photo (« quelques pixels en plus juste pour être sûr », brasseur, 03.11), puis l'analyse de `decoupe.ts` sur l'image redressée.
// Chargé à la demande par `decoupe.ts`, pour une longue pièce seulement : une pièce courte ne télécharge jamais OpenCV.
// Au moindre doute (pas de papier à 4 coins, papier couché, texte qui déborde du cadre), `planPerspective` rend une raison et `decoupe.ts` garde son
// propre redressement : jamais une ligne perdue pour une coupe plus nette.
import urlOpencv from '../vendor/opencv-5.0.0/opencv.js?url';
import { BAND_MAX_LINES } from '../../functions/src/invoiceMorceaux';
import { analyser, LARGEUR_MAX, papierDuCadre, type Analyse, type Rect } from './decoupe';

/** Où est l'image redressée dans la photo : les coins du papier (haut-gauche, haut-droite, bas-droite, bas-gauche), la sortie et son papier. */
export interface Perspective {
  quad: number[];
  largeur: number;
  hauteur: number;
  interieur: Rect;
  /** Matrice 3 × 3 (lignes) sortie → source, convention d'OpenCV (centres de pixels aux entiers). */
  versSource: number[];
  methode: string;
  msChargement: number;
  msDetection: number;
}

type Reponse = { id: number; ok: boolean; erreur?: string; [k: string]: any };
interface Client { demander(type: string, champs?: Record<string, unknown>, transfert?: Transferable[]): Promise<Reponse>; msChargement: number }
let client: Promise<Client> | null = null;

/** Le worker OpenCV, chargé une fois. Un échec (réseau, CSP, mémoire) le jette : le prochain appel réessaie. */
function ouvrier(): Promise<Client> {
  if (client) return client;
  client = (async () => {
    const worker = new Worker(new URL('./decoupePerspective.worker.ts', import.meta.url));
    let n = 0;
    const attentes = new Map<number, (r: Reponse) => void>();
    const echouer = (raison: string) => { for (const f of attentes.values()) f({ id: -1, ok: false, erreur: raison }); attentes.clear(); client = null; worker.terminate(); };
    worker.onmessage = (e: MessageEvent<Reponse>) => { const f = attentes.get(e.data.id); attentes.delete(e.data.id); f?.(e.data); };
    worker.onerror = e => echouer(`worker OpenCV : ${e.message || 'erreur'}`);
    const demander = (type: string, champs: Record<string, unknown> = {}, transfert: Transferable[] = []) => new Promise<Reponse>((resolve, reject) => {
      const id = ++n;
      attentes.set(id, r => (r.ok ? resolve(r) : reject(new Error(r.erreur ?? 'erreur OpenCV'))));
      worker.postMessage({ id, type, ...champs }, transfert);
    });
    const r = await demander('charger', { url: new URL(urlOpencv, location.href).href }).catch(e => { echouer(String(e)); throw e; });
    return { demander, msChargement: r.ms as number };
  })();
  return client;
}

const longueur = (q: number[], a: number, b: number) => Math.hypot(q[2 * b] - q[2 * a], q[2 * b + 1] - q[2 * a + 1]);

/** Les marges autour du papier, en pixels de la photo : gauche, haut, droite, bas. */
type Marges = [number, number, number, number];
const COTES = ['gauche', 'haut', 'droite', 'bas'] as const;

/**
 * Le plan d'une longue photo par ses coins, ou la raison de s'en passer. La sortie : le papier redressé à sa taille (≤ 1 600 px de large), plus une
 * marge prise dans la photo tout autour (2 % de sa largeur, 12 px au moins). L'analyse finale mesure les rangées blanches sur la largeur du papier
 * (`papierDuCadre`), grandie de tout texte voisin. Si ce texte touche un bord de la sortie, il continue hors du cadre (coin replié, ombre : un côté
 * trouvé à l'intérieur du papier) : la marge de CE côté triple et l'image est refaite, jusqu'à 15 % de la largeur ; au-delà, le plan est refusé.
 */
export async function planPerspective(image: ImageBitmap, maxLines = BAND_MAX_LINES, options: { sansOmbre?: boolean } = {}): Promise<{ p: Perspective; finale: Analyse } | { raison: string }> {
  const refus = async (raison: string) => { await libererPerspective(); return { raison }; };
  const d = await detecterPapier(image);
  if ('raison' in d) return refus(d.raison);
  const base = Math.max(12, Math.round(0.02 * d.largeurPapier)), plafond = Math.max(base, Math.round(0.15 * d.largeurPapier));
  const marges: Marges = [base, base, base, base];
  for (let essai = 1; ; essai++) {
    const { p, gray } = await rendreGris(d, marges, options.sansOmbre === true), { largeur, hauteur } = p;
    const finale = analyser({ width: largeur, height: hauteur, gray }, { papier: papierDuCadre(p.interieur, largeur, hauteur), redresser: false, recadrer: false, maxLines });
    const b = finale.boiteTexte;
    const touches = b ? [b.x <= 0, b.y <= 0, b.x + b.w >= largeur, b.y + b.h >= hauteur] : [false, false, false, false];
    if (!touches.some(Boolean)) return { p: { ...p, methode: essai > 1 ? `${p.methode}, marges ${marges.join('/')} px` : p.methode }, finale };
    const bloques = touches.map((t, i) => t && marges[i] >= plafond);
    if (bloques.some(Boolean)) return refus(`texte au bord du cadre (${COTES.filter((_, i) => bloques[i]).join(', ')})`);
    touches.forEach((t, i) => { if (t) marges[i] = Math.min(plafond, 3 * marges[i]); });
  }
}

interface Detection { quad: number[]; largeurPapier: number; hauteurPapier: number; methode: string; msChargement: number; msDetection: number }

/** Les coins du papier (la photo reste dans le worker), ou la raison de s'en passer. */
async function detecterPapier(image: ImageBitmap): Promise<Detection | { raison: string }> {
  const c = await ouvrier();
  await c.demander('source', { image: await createImageBitmap(image) });
  const t0 = performance.now(), det = await c.demander('detecter'), msDetection = Math.round(performance.now() - t0);
  const quad = det.quad as number[] | null;
  if (!quad) return { raison: det.raison as string };
  const haut = longueur(quad, 0, 1), bas = longueur(quad, 3, 2), gauche = longueur(quad, 0, 3), droite = longueur(quad, 1, 2);
  const largeurPapier = Math.max(haut, bas), hauteurPapier = Math.max(gauche, droite);
  // Un papier couché (plus large que haut) : le texte serait vertical, rien ne se couperait entre ses lignes.
  if (hauteurPapier < largeurPapier) return { raison: 'papier couché' };
  return { quad, largeurPapier, hauteurPapier, methode: det.raison as string, msChargement: c.msChargement, msDetection };
}

/** L'image redressée en gris : le papier `d` à sa taille (≤ 1 600 px de large en tout), entouré des `marges` prises dans la photo. */
/** `sansOmbre` : l'image d'analyse divisée par son fond (worker `sansOmbre`, noyau ≈ largeur / 30, une ligne de texte au moins). */
async function rendreGris(d: Detection, marges: Marges, sansOmbre = false): Promise<{ p: Perspective; gray: Uint8Array }> {
  const c = await ouvrier(), [g, h, dr, b] = marges, echelle = Math.min(1, LARGEUR_MAX / (d.largeurPapier + g + dr));
  const largeur = Math.max(1, Math.round((d.largeurPapier + g + dr) * echelle)), hauteur = Math.max(1, Math.round((d.hauteurPapier + h + b) * echelle));
  const x = Math.round(g * echelle), y = Math.round(h * echelle);
  const interieur = { x, y, w: Math.max(1, Math.round(d.largeurPapier * echelle)), h: Math.max(1, Math.round(d.hauteurPapier * echelle)) };
  const bandes: Array<[number, number]> = [];
  for (let y0 = 0; y0 < hauteur; y0 += 1024) bandes.push([y0, Math.min(hauteur, y0 + 1024)]);
  const r = await c.demander('rendre', { quad: d.quad, largeur, hauteur, interieur, bandes, format: 'gris', ...(sansOmbre ? { fond: 2 * Math.round(largeur / 60) + 1 } : {}) });
  const gray = new Uint8Array(largeur * hauteur);
  (r.bandes as Uint8Array[]).forEach((bande, i) => gray.set(bande, r.bandes.length === 1 ? 0 : bandes[i][0] * largeur));
  return { p: { quad: d.quad, largeur, hauteur, interieur, versSource: r.versSource as number[], methode: d.methode, msChargement: d.msChargement, msDetection: d.msDetection }, gray };
}

/** Les coins du papier et l'image redressée en gris, marges de départ (sans analyse ni garde-fou : le banc D381). La photo reste dans le worker. */
export async function redresser(image: ImageBitmap): Promise<{ p: Perspective; gray: Uint8Array } | { raison: string }> {
  const d = await detecterPapier(image);
  if ('raison' in d) return d;
  const m = Math.max(12, Math.round(0.02 * d.largeurPapier));
  return rendreGris(d, [m, m, m, m]);
}

/** Les zones [top, bottom) de l'image redressée, en JPEG (base64), dans l'ordre. */
export async function zonesPerspective(p: Perspective, zones: Array<[number, number]>, qualite: number): Promise<string[]> {
  if (!zones.length) return [];
  const c = await ouvrier();
  const r = await c.demander('rendre', { quad: p.quad, largeur: p.largeur, hauteur: p.hauteur, interieur: p.interieur, bandes: zones, format: 'jpeg', qualite });
  return r.bandes as string[];
}

/** Libère la photo gardée par le worker (le worker et OpenCV restent chargés pour la pièce suivante). */
export async function libererPerspective(): Promise<void> {
  if (client) await (await client).demander('liberer').catch(() => undefined);
}
