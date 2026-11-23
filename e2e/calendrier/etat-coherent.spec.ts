// CAL-ETAT-COHERENT (23.11, 1204-incoherent.jpg : « Toujours quelque problème avec la gestion des date, timing du graph.... » — « 24 sem. »
// pour un cadre de 4 ans, axe 2029–2030 avec « ‹ auj. » alors qu'aujourd'hui est dans le cadre, rangées vides malgré des brassins).
// État de l'art (L29) : test par modèle (fast-check `fc.commands`, `fc.asyncModelRun`) : des suites aléatoires de gestes sur la fenêtre (durée
// au menu, période de l'app ‹ › et « Tout », poignées, cadre glissé, rechargement) ; après CHAQUE geste, les invariants d'un état unique :
//   I1 le libellé de durée = la durée du cadre (son étiquette datée) ; I2 aujourd'hui dans le cadre ⇒ marqué « dans » sur la courbe, aucun
//   « ‹ auj. » / « auj. › » ; I3 aujourd'hui dans le cadre ⇒ la rangée Brassins n'est pas « vide » (la fixture a des brassins autour d'aujourd'hui).
// Le contre-exemple réduit (shrink) est la suite de gestes à rejouer. Données : la fixture simulée. Rouge sur le tour 22 attendu.
import { expect, test, type Page } from '@playwright/test';
import fc from 'fast-check';
import { Doigt } from '../outils/doigt';
import { aujourdhuiZurich, boutonPeriode, choisirPeriode, ouvrirCalendrier, poserFixture } from '../outils/calendrier';

const MOIS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc'];
const jour = (a: number, m: number, j: number) => Date.UTC(a, m, j) / 864e5;

/** « 26 oct. – 6 déc. », « 26 oct. 2026 – 24 janv. 2027 », « oct. 2026 – oct. 2027 » → [début, fin] en jours depuis 1970 (fin incluse). */
export function lireEtiquette(t: string, an0: number): [number, number] | null {
  /* CAL-ETIQUETTE-GRAIN-AU-DESSUS : en grain jour, « S40 – S42 2026 », « S52 2026 – S1 2027 », « S48 2026 » (semaines ISO) */
  const sem = /^S(\d{1,2})(?: (\d{4}))?(?: – S(\d{1,2}) (\d{4}))?$/.exec(t.replace(/\s+/g, ' ').trim());
  if (sem) {
    const lundiIso = (n: number, an: number) => { const j4 = jour(an, 0, 4), dow = (new Date(j4 * 864e5).getUTCDay() + 6) % 7; return j4 - dow + (n - 1) * 7; };
    const anFin = Number(sem[4] ?? sem[2] ?? an0), anDebut = Number(sem[2] ?? anFin);
    return sem[3] ? [lundiIso(Number(sem[1]), anDebut), lundiIso(Number(sem[3]), anFin) + 6] : [lundiIso(Number(sem[1]), anDebut), lundiIso(Number(sem[1]), anDebut) + 6];
  }
  const bouts = t.replace(/\s+/g, ' ').split(/\s*[–—-]\s*/).filter(Boolean);
  if (bouts.length !== 2) return null;
  const lire = (s: string) => {
    const m = /^(?:(\d{1,2}) )?([a-zéû]+)\.?(?: (\d{4}))?$/i.exec(s.trim());
    if (!m) return null;
    const mois = MOIS.indexOf(m[2].toLowerCase());
    return mois < 0 ? null : { j: m[1] ? Number(m[1]) : null, mois, an: m[3] ? Number(m[3]) : null };
  };
  const a = lire(bouts[0]), b = lire(bouts[1]);
  if (!a || !b) return null;
  const anA = a.an ?? b.an ?? an0, anB = b.an ?? (b.mois < a.mois ? anA + 1 : anA);
  const debut = jour(anA, a.mois, a.j ?? 1);
  const fin = b.j ? jour(anB, b.mois, b.j) : jour(anB, b.mois + 1, 1) - 1;
  return [debut, fin];
}
/** « 6 sem. », « 3 mois », « An », « 2 ans », « 2 ans ½ », « 18 mois » → semaines (l'année : 52,18 semaines, comme `libelleDuree`). */
export function lireDuree(t: string): number | null {
  const s = t.replace(/\s+/g, ' ').trim().replace(/^[^·]+ · /, '');
  let m = /^(\d+) sem/.exec(s); if (m) return Number(m[1]);
  m = /^(\d+) mois/.exec(s); if (m) return Math.round(Number(m[1]) * 52 / 12);
  if (/^An\b/.test(s)) return 52;
  /* T29-12 : « 2 ans ½ » = deux ans et demi ; le libellé arrondit au demi-an près (le quart vers le bas) : il peut s'écarter de ¼ d'an du cadre */
  m = /^(\d+) ans( ½)?$/.exec(s); if (m) return (Number(m[1]) + (m[2] ? 0.5 : 0)) * 52.18;
  return null;
}
/** L'écart permis entre un libellé de durée et le cadre, en semaines : en années, ¼ d'an (14,4 sem. : `libelleDuree` arrondit au demi-an, le quart vers le bas). */
export const jeuLibelle = (libelle: string): number | null => (/ ans( ½)?$/.test(libelle) ? 14.5 : null);

type Reel = { page: Page; doigt: Doigt; journal: string[] };
type Modele = Record<string, never>;

async function etat(page: Page) {
  return page.evaluate(() => {
    const t = (s: string) => (document.querySelector(s)?.textContent ?? '').replace(/\s+/g, ' ').trim();
    const bouton = [...document.querySelectorAll('button')].find((b) => /période, liste, tri et filtre$/.test(b.getAttribute('aria-label') ?? ''));
    const aujs = [...document.querySelectorAll('.ent-cb [data-aujourdhui]')].map((e) => e.getAttribute('data-aujourdhui'));
    const fleches = [...document.querySelectorAll('[data-bande-semaines] *, .ent-cb *')].map((e) => (e.textContent ?? '').trim()).filter((x) => /^‹\s*auj\.|auj\.\s*›$/.test(x));
    const brassins = document.querySelector('section[data-rangee="brassins"]');
    /* I4 (axe ⊇ cadre) : le cadre posé tient dans la courbe (ses deux bouts visibles, R4) ; et, quand l'en-tête les expose, les dates de l'axe
       (`data-axe-du/au`) couvrent celles du cadre (`data-cadre-du/au`) */
    const cb = document.querySelector('.ent-cbz .ent-cb') ?? document.querySelector('.ent-cb'), ca = document.querySelector('.ent-cadre');
    const rb = cb?.getBoundingClientRect(), rc = ca?.getBoundingClientRect();
    const axe = document.querySelector('[data-axe-du]');
    return {
      duree: (bouton?.textContent ?? '').replace(/\s+/g, ' ').trim(), etiquette: t('[data-cadre-etiquette]'), aujs, fleches: [...new Set(fleches)],
      brassinsVide: !!brassins?.querySelector('.cal-vide'), app: t('[data-periode-pastille] .pr-ce'),
      boites: rb && rc && rb.width > 0 ? { cl: rc.left - rb.left, cr: rc.right - rb.left, w: rb.width } : null,
      axe: axe ? { du: axe.getAttribute('data-axe-du'), au: axe.getAttribute('data-axe-au'), cdu: axe.getAttribute('data-cadre-du'), cau: axe.getAttribute('data-cadre-au') } : null
    };
  });
}

async function verifier(r: Reel) {
  await r.page.waitForTimeout(500);
  const e = await etat(r.page);
  const auj = (() => { const [a, m, j] = aujourdhuiZurich().split('-').map(Number); return jour(a, m - 1, j); })();
  const dates = lireEtiquette(e.etiquette, Number(aujourdhuiZurich().slice(0, 4)));
  const ctx = `${r.journal.join(' → ')} | app « ${e.app} », bouton « ${e.duree} », étiquette « ${e.etiquette} »`;
  expect(dates, `étiquette lisible : ${ctx}`).not.toBeNull();
  const [d, f] = dates!;
  const semCadre = (f - d + 1) / 7, semBouton = lireDuree(e.duree);
  /* I0 : un libellé de durée bien formé (« 1 ans » vu au tour 22) */
  expect(/^(?:[^·]+ · )?(\d+ sem\.|\d+ mois|An|(?:[2-9]|10) ans(?: ½)?)$/.test(e.duree), `I0 libellé « ${e.duree} » : ${ctx}`).toBe(true);
  /* une étiquette en mois (sans jour) couvre ses mois entiers : un mois de jeu à chaque bout */
  const jeu = /\d{1,2} [a-zéû]/i.test(e.etiquette) ? Math.max(1, semCadre * 0.1) : 9;
  /* I1 : en années, le libellé arrondit au demi-an (T29-12) : ¼ d'an d'écart permis, mesuré sur le cadre exact (`data-cadre-du/au`) quand
     l'en-tête l'expose, sinon sur l'étiquette (+ le jeu d'un mois à chaque bout) */
  const jourIso = (s: string) => { const [a, m, j] = s.split('-').map(Number); return jour(a, m - 1, j); };
  const exact = e.axe?.cdu && e.axe.cau ? (jourIso(e.axe.cau) - jourIso(e.axe.cdu) + 1) / 7 : null;
  const jeuAns = jeuLibelle(e.duree);
  const ecart = jeuAns !== null && exact !== null ? exact : semCadre;
  const jeuI1 = jeuAns !== null ? jeuAns + (exact !== null ? 0.5 : jeu) : jeu;
  if (semBouton !== null) expect(Math.abs(semBouton - ecart) <= jeuI1, `I1 durée « ${e.duree} » ≠ cadre ${ecart.toFixed(1)} sem. : ${ctx}`).toBe(true);
  /* I4 : axe ⊇ cadre (« axe 2029–2030 » pour un cadre de 4 ans dès 2025, 1204-incoherent.jpg) */
  if (e.boites) expect(e.boites.cl >= -2 && e.boites.cr <= e.boites.w + 2, `I4 cadre hors de l'axe (${Math.round(e.boites.cl)}…${Math.round(e.boites.cr)} sur ${Math.round(e.boites.w)} px) : ${ctx}`).toBe(true);
  if (e.axe?.du && e.axe.au && e.axe.cdu && e.axe.cau) {
    expect(e.axe.du <= e.axe.cdu && e.axe.au >= e.axe.cau, `I4 axe ${e.axe.du}…${e.axe.au} ⊉ cadre ${e.axe.cdu}…${e.axe.cau} : ${ctx}`).toBe(true);
    /* I5 : l'étiquette dit les dates du cadre (au jour près ; en mois : le mois) */
    const [a, m, j] = e.axe.cdu.split('-').map(Number), [a2, m2, j2] = e.axe.cau.split('-').map(Number);
    expect(Math.abs(jour(a, m - 1, j) - d) <= (jeu > 8 ? 31 : 0) && Math.abs(jour(a2, m2 - 1, j2) - f) <= (jeu > 8 ? 31 : 0), `I5 étiquette ≠ cadre ${e.axe.cdu}…${e.axe.cau} : ${ctx}`).toBe(true);
  }
  if (auj >= d && auj <= f) {
    /* I2 */
    expect(e.aujs.includes('dans') && e.fleches.length === 0, `I2 aujourd'hui dans le cadre mais [${e.aujs.join(',')}] ${e.fleches.join(' ')} : ${ctx}`).toBe(true);
    /* I3 */
    expect(e.brassinsVide, `I3 aujourd'hui dans le cadre mais Brassins « vide » : ${ctx}`).toBe(false);
  }
}

const cmd = (nom: string, agir: (r: Reel) => Promise<void>): fc.AsyncCommand<Modele, Reel> => ({
  check: () => true,
  run: async (_m, r) => { r.journal.push(nom); await agir(r); await verifier(r); },
  toString: () => nom
});
const poignee = (page: Page, cote: 'debut' | 'fin') => page.locator(`[data-poignee="${cote}"]`).first().boundingBox();
const commandes = [
  fc.constantFrom('6 sem.', '3 mois', '6 mois', 'An').map((n) => cmd(`durée ${n}`, ({ page }) => choisirPeriode(page, n))),
  fc.constantFrom('Période précédente', 'Période suivante').map((n) => cmd(n, async ({ page }) => {
    const b = page.getByRole('button', { name: n, exact: true }).first();
    if (await b.isEnabled()) await b.tap();
  })),
  fc.constant(cmd('app Tout', async ({ page }) => {
    await page.locator('[data-periode-pastille] .pr-ce').tap();
    const tout = page.getByRole('button', { name: /^Tout$/ }).last();
    if (await tout.count()) await tout.tap(); else await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    if (await page.getByRole('dialog').count()) await page.keyboard.press('Escape');
  })),
  fc.tuple(fc.constantFrom<'debut' | 'fin'>('debut', 'fin'), fc.integer({ min: -150, max: 150 })).map(([c, dx]) => cmd(`poignée ${c} ${dx}`, async ({ page, doigt }) => {
    const h = await poignee(page, c); if (!h) return;
    const a = { x: h.x + h.width / 2, y: h.y + h.height / 2 };
    await doigt.glisser(a, { x: Math.max(2, Math.min(388, a.x + dx)), y: a.y }, { dureeMs: 400 });
  })),
  /* D444 : la plage de l'app sur plusieurs années (saisie « Du … au » de la pastille), le geste qui a fait « 24 sem. » pour 4 ans */
  fc.tuple(fc.integer({ min: -60, max: 60 }), fc.integer({ min: 2, max: 60 })).map(([dm, mois]) => cmd(`app plage ${dm} mois, ${mois} mois`, async ({ page }) => {
    const [a, m] = aujourdhuiZurich().split('-').map(Number);
    const iso = (t: number) => { const an = Math.floor(t / 12), mo = t - an * 12; return `01.${String(mo + 1).padStart(2, '0')}.${an}`; };
    const t0 = a * 12 + (m - 1) + dm;
    await page.locator('[data-periode-pastille] .pr-ce').tap();
    const du = page.getByLabel('Du (jj.mm)'), au = page.getByLabel('Au (jj.mm)');
    if (!(await du.count())) { await page.keyboard.press('Escape'); return; }
    await du.fill(iso(t0)); await au.fill(iso(t0 + mois)); await au.blur();
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    if (await page.getByRole('dialog').count()) await page.keyboard.press('Escape');
  })),
  fc.tuple(fc.constantFrom<'debut' | 'fin'>('debut', 'fin'), fc.integer({ min: 500, max: 9000 })).map(([c, ms]) => cmd(`poignée ${c} tenue au bord ${ms} ms`, async ({ page, doigt }) => {
    const h = await poignee(page, c); if (!h) return;
    const a = { x: h.x + h.width / 2, y: h.y + h.height / 2 };
    await doigt.glisser(a, { x: c === 'fin' ? 386 : 4, y: a.y }, { dureeMs: 400, avantLever: ms });
  })),
  fc.tuple(fc.constantFrom(-1, 1), fc.integer({ min: 500, max: 3000 })).map(([s, ms]) => cmd(`cadre tenu au bord ${s} ${ms} ms`, async ({ page, doigt }) => {
    const c = await page.locator('.ent-cadre').boundingBox(); if (!c) return;
    const a = { x: c.x + c.width / 2, y: c.y + c.height / 2 };
    await doigt.glisser(a, { x: s > 0 ? 386 : 4, y: a.y }, { dureeMs: 400, avantLever: ms });
  })),
  fc.integer({ min: -150, max: 150 }).map((dx) => cmd(`cadre ${dx}`, async ({ page, doigt }) => {
    const c = await page.locator('.ent-cadre').boundingBox(); if (!c) return;
    const a = { x: c.x + c.width / 2, y: c.y + c.height / 2 };
    await doigt.glisser(a, { x: Math.max(2, Math.min(388, a.x + dx)), y: a.y }, { dureeMs: 400 });
  })),
  fc.constant(cmd('recharger', async ({ page }) => { await ouvrirCalendrier(page); await page.waitForTimeout(500); }))
];

test('CAL-ETAT-COHERENT : après chaque geste, durée, étiquette, aujourd\'hui et rangées disent la même fenêtre', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 500, 'sa plainte : téléphone en portrait (390)');
  /* 8 gestes au plus par suite, 1 à 10 s chacun : le temps suit le nombre de suites (ETAT_RUNS=200 ≈ 2 h), réduction comprise */
  test.setTimeout(Math.max(600_000, Number(process.env.ETAT_RUNS ?? 12) * 60_000));
  await poserFixture(page);
  await ouvrirCalendrier(page);
  const doigt = await Doigt.sur(page);
  await fc.assert(fc.asyncProperty(fc.commands(commandes, { maxCommands: 8 }), async (suite) => {
    await page.evaluate(() => { for (const k of Object.keys(localStorage)) if (!/fixture|theme/i.test(k)) localStorage.removeItem(k); });
    await ouvrirCalendrier(page);
    await expect(page.locator('.ent-cadre')).toBeVisible({ timeout: 30_000 });
    if ((await boutonPeriode(page).innerText()).trim() !== '6 sem.') await choisirPeriode(page, '6 sem.');
    const r: Reel = { page, doigt, journal: [] };
    await verifier(r);
    await fc.asyncModelRun(() => ({ model: {} as Modele, real: r }), suite);
  }), { numRuns: Number(process.env.ETAT_RUNS ?? 12), seed: process.env.ETAT_SEED ? Number(process.env.ETAT_SEED) : undefined, endOnFailure: process.env.ETAT_SHRINK !== '1', verbose: 1 });
});
