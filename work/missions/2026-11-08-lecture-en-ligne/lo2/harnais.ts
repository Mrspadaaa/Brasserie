// LO-2, banc : le fil principal pendant la préparation d'une photo (découpe + QR), dans un vrai Chrome.
// Il appelle les API publiques de l'app, `decouperPiece` et `lireQrDuFichier`, exactement comme `geminiScanner` et `ExpenseSheet`. Il ne règle rien :
// il mesure. Piloté par `mesurer.mjs` (Chrome servi par interception, CSP de production).
import { analyser, planifierImage, planifierImageDetaille, trouverPapier } from '../../../../src/services/decoupe';
import { planifierHorsFil } from '../../../../src/services/decoupeTravail';
import { decouperPiece } from '../../../../src/services/decoupeHorsFil';
import { lireQrDuFichier } from '../../../../src/services/qrLecture';

interface Mesure { taches: number[]; max: number; total: number; battementMax: number; duree: number }

/** Suit le fil principal : tâches longues (> 50 ms, PerformanceObserver) et plus grand retard d'un battement de 10 ms. */
function suivre(): () => Promise<Mesure> {
  const taches: number[] = [];
  const observeur = new PerformanceObserver(liste => { for (const e of liste.getEntries()) taches.push(Math.round(e.duration)); });
  observeur.observe({ type: 'longtask', buffered: false });
  let dernier = performance.now(), battementMax = 0;
  const minuterie = setInterval(() => { const t = performance.now(); battementMax = Math.max(battementMax, t - dernier - 10); dernier = t; }, 10);
  const debut = performance.now();
  return async () => {
    // Une chaîne de promesses sans pause ne laisse jamais passer un battement : sans ce rendez-vous, un calcul synchrone qui finit la chaîne ne serait
    // vu ni du battement ni de l'observateur (première mesure, doc5 : 590 ms de découpe « mesurés » à 0). On rend la main avant d'arrêter.
    const duree = performance.now() - debut;
    await new Promise(r => setTimeout(r, 40));
    clearInterval(minuterie);
    const reste = observeur.takeRecords(); for (const e of reste) taches.push(Math.round(e.duration));
    observeur.disconnect();
    return { taches, max: taches.length ? Math.max(...taches) : 0, total: taches.reduce((s, d) => s + d, 0), battementMax: Math.round(battementMax), duree: Math.round(duree) };
  };
}

const fichier = (b64: string, nom: string, type: string) => new File([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], nom, { type });
const pause = (ms: number) => new Promise(r => setTimeout(r, ms));
const hachage = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };

(window as any).__mesurer = async (b64: string, nom: string, type: string, phases: string[]) => {
  const f = fichier(b64, nom, type), sortie: Record<string, unknown> = { nom };
  const image = await createImageBitmap(f);
  sortie.taille = `${image.width}x${image.height}`; image.close();
  if (phases.includes('decoupe')) {
    const arret = suivre();
    const d = await decouperPiece(f).catch(e => ({ erreur: String(e) }));
    sortie.decoupe = { ...(await arret()), morceaux: d && 'parties' in d ? d.parties.length : 0, jpeg: d && 'parties' in d ? d.parties.map(p => hachage(p.file.data)) : [] };
    await pause(100);
  }
  if (phases.includes('qr')) {
    const arret = suivre();
    const r = await lireQrDuFichier(f);
    sortie.qr = { ...(await arret()), statut: r.statut, bulletins: (r as any).bulletins ?? null, montant: r.statut === 'lu' ? `${r.qr.montant} ${r.qr.devise}` : null };
    await pause(100);
  }
  if (phases.includes('les-deux')) {
    // Ce que fait l'écran : le QR part à côté de la lecture, la découpe tourne dans `scanDocument`, au même moment.
    const arret = suivre();
    const [d, r] = await Promise.all([decouperPiece(f).catch(() => null), lireQrDuFichier(f)]);
    sortie.lesDeux = { ...(await arret()), morceaux: d?.parties.length ?? 0, statut: r.statut };
    await pause(100);
  }
  // L'empreinte du plan de découpe : le résultat doit être identique avant et après, sur la page comme dans le Worker.
  const empreinte = (plan: any) => {
    if (!plan) return null;
    const { finale, g, haute } = plan;
    return { haute, angle: finale.angle, crop: finale.crop, g, papier: finale.papier, pas: finale.pas, colonnes: finale.colonnes, morceaux: finale.morceaux, nbRangees: finale.rangees.length, rangees: hachage(finale.rangees.join(',')) };
  };
  if (phases.includes('plan')) {
    const img = await createImageBitmap(f);
    sortie.plan = empreinte(await planifierImageDetaille(img, true, { mesurerHaute: true }));
    img.close();
  }
  for (const force of [true, false]) {
    if (phases.includes(force ? 'pm' : 'pm0')) { const img = await createImageBitmap(f); sortie[force ? 'pm' : 'pm0'] = empreinte(await planifierImage(img, force)); img.close(); }
    if (phases.includes(force ? 'pw' : 'pw0')) { const p = await planifierHorsFil(f, force); sortie[force ? 'pw' : 'pw0'] = p === undefined ? 'SANS-WORKER' : empreinte(p); }
  }
  return sortie;
};
// Pour sonder à la main (diagnostic) : chaque étape chronométrée, et le plus long retard du fil principal pendant `decouperPiece`.
(window as any).__sonde = async (b64: string, type: string) => {
  const f = fichier(b64, 'x', type), journal: string[] = [];
  const t = (n: string, t0: number) => journal.push(`${n} ${Math.round(performance.now() - t0)}ms`);
  let t0 = performance.now(); const img = await createImageBitmap(f); t('createImageBitmap', t0);
  t0 = performance.now(); const p = await planifierImageDetaille(img, false); t('planifierImageDetaille(false)', t0);
  // Ventilation de `planifierImageDetaille` : la réduction par canvas, puis l'analyse pure du coup d'œil (papier + angle + encre), refaites ici à l'identique.
  const W = img.width, H = img.height, s = Math.min(1, 1200 / Math.min(W, H)), pw = Math.max(1, Math.round(W * s)), ph = Math.max(1, Math.round(H * s));
  t0 = performance.now();
  const petit = document.createElement('canvas'); petit.width = pw; petit.height = ph;
  const cx = petit.getContext('2d', { willReadFrequently: true })!; cx.drawImage(img, 0, 0, pw, ph);
  const px = cx.getImageData(0, 0, pw, ph).data, gris = new Uint8Array(pw * ph);
  for (let i = 0, j = 0; i < gris.length; i++, j += 4) gris[i] = (px[j] * 77 + px[j + 1] * 150 + px[j + 2] * 29) >> 8;
  t(`reduction canvas ${pw}x${ph}`, t0);
  t0 = performance.now(); trouverPapier({ width: pw, height: ph, gray: gris }); t('trouverPapier', t0);
  t0 = performance.now(); const coup = analyser({ width: pw, height: ph, gray: gris }, { maxLines: 25 }); t('analyser(coup d\'oeil)', t0);
  journal.push(`coup d'oeil : angle ${coup.angle}, ${coup.morceaux.length} morceaux`);
  t0 = performance.now(); const d = await decouperPiece(f); t('decouperPiece', t0);
  journal.push(`plan ${p ? 'oui' : 'non'}, decoupe ${d ? d.parties.length : 'null'}`);
  return journal;
};
(window as any).__pret = true;
