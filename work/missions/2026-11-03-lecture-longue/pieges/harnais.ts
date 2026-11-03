// D381, banc hors ligne : le VRAI plan de découpe de l'app (`planifierImage`) sur une pièce piégée, et la même transformation jouée sur son masque
// (plus proche voisin). Une ligne visuelle (couleur du masque) ne doit jamais être sur deux morceaux sans que la coupe soit signalée (`coupeForcee`),
// et aucune ligne ne doit disparaître du recadrage. Servi par Vite (copie de banc) ; piloté par `controler.mjs`.
import { coupeBasseForcee, dessinerNormalise, planifierImage } from '../../../../src/services/decoupe';
import { planJonctions } from '../../../../functions/src/invoiceMorceaux';

const decoder = async (b64: string, type: string) => createImageBitmap(new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type }));
const etiquettes = (data: Uint8ClampedArray) => { const e = new Uint32Array(data.length / 4); for (let i = 0, j = 0; i < e.length; i++, j += 4) e[i] = data[j] + data[j + 1] * 256; return e; };

(window as any).__controler = async (photo64: string, masque64: string) => {
  const t0 = performance.now();
  const photo = await decoder(photo64, 'image/jpeg'), masque = await decoder(masque64, 'image/png');
  const plan = planifierImage(photo, true), msPlan = Math.round(performance.now() - t0);
  // Les lignes du masque d'origine et leur aire.
  const c0 = document.createElement('canvas'); c0.width = masque.width; c0.height = masque.height;
  const x0 = c0.getContext('2d', { willReadFrequently: true })!; x0.drawImage(masque, 0, 0);
  const aire0 = new Map<number, number>();
  for (const id of etiquettes(x0.getImageData(0, 0, c0.width, c0.height).data)) if (id) aire0.set(id, (aire0.get(id) ?? 0) + 1);
  if (!plan) return { morceaux: 1, lignes: aire0.size, msPlan, rien: true };
  const { g, finale } = plan;
  // Le masque normalisé (même géométrie), rangée par rangée : quelles lignes, sur quelles rangées.
  const c = document.createElement('canvas'); c.width = g.largeur; c.height = g.hauteur;
  dessinerNormalise(c, masque, g, 0, false, '#000');
  const e = etiquettes(c.getContext('2d', { willReadFrequently: true })!.getImageData(0, 0, g.largeur, g.hauteur).data);
  const rangs = new Map<number, number[]>(), aire = new Map<number, number>();
  for (let y = 0; y < g.hauteur; y++) {
    const vus = new Set<number>();
    for (let x = 0; x < g.largeur; x++) { const id = e[y * g.largeur + x]; if (id) { vus.add(id); aire.set(id, (aire.get(id) ?? 0) + 1); } }
    for (const id of vus) { const l = rangs.get(id) ?? []; l.push(y); rangs.set(id, l); }
  }
  const m = finale.morceaux, coupes = m.slice(0, -1).map(b => b.bottom);
  const forcees = m.map((b, i) => coupeBasseForcee(b, finale.rangees, i === m.length - 1));
  // Une ligne coupée : des rangées des deux côtés d'une coupe, au moins 25 % de sa hauteur de chaque côté (un bord d'un pixel ne compte pas).
  const coupees: Array<{ ligne: number; coupe: number; signalee: boolean }> = [];
  for (const [id, ys] of rangs) coupes.forEach((cut, i) => {
    const haut = ys.filter(y => y < cut).length, bas = ys.length - haut;
    if (Math.min(haut, bas) >= Math.max(1, 0.25 * ys.length)) coupees.push({ ligne: id - 1, coupe: i + 1, signalee: forcees[i] });
  });
  // Une ligne perdue ou rognée : absente du masque normalisé, ou moins de 80 % de son aire (à l'échelle près).
  const e2 = g.echelle * g.echelle, perdues: number[] = [], rognees: number[] = [];
  for (const [id, a] of aire0) { const b = aire.get(id) ?? 0; if (!b) perdues.push(id - 1); else if (b < 0.8 * a * e2) rognees.push(id - 1); }
  return {
    morceaux: m.length, lignes: aire0.size, msPlan, angle: finale.angle ?? g.angle, angleGeo: g.angle, echelle: g.echelle, largeur: g.largeur, hauteur: g.hauteur,
    forcees: forcees.filter(Boolean).length, jonctions: planJonctions(m, finale.rangees).length,
    coupeesSilencieuses: coupees.filter(x => !x.signalee), coupeesSignalees: coupees.filter(x => x.signalee).length, perdues, rognees,
  };
};
(window as any).__pret = true;
