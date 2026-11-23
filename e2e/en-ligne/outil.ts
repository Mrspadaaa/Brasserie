// L'app EN LIGNE jouée au doigt (L11, D440) : connexion au Chrome de débogage du poste (port 9222, session du brasseur déjà ouverte), MON onglet
// seul, ouvert dans sa propre fenêtre (un onglet caché ne reçoit pas les touchers), téléphone émulé 390 × 844. On ne ferme jamais Chrome :
// seulement son onglet, puis on se déconnecte. Données : lecture, et choses « ZZ TEST » seulement.
import { chromium, expect, type Browser, type Locator, type Page } from '@playwright/test';

export const APP = process.env.APP_EN_LIGNE || 'https://brasserie-l-affinee.web.app/';
const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Mobile Safari/537.36';

export type EnLigne = { browser: Browser; page: Page; fermer: () => Promise<void> };

/** Ouvre mon onglet dans sa fenêtre, au téléphone (390 × 844, tactile), CPU ralenti si `cpu` > 1. */
export async function ouvrirEnLigne({ largeur = 390, hauteur = 844, cpu = 1 } = {}): Promise<EnLigne> {
  const browser = await chromium.connectOverCDP('http://127.0.0.1:9222');
  const ctx = browser.contexts()[0];
  const nouvelle = ctx.waitForEvent('page');
  const cdpB = await browser.newBrowserCDPSession();
  await cdpB.send('Target.createTarget', { url: 'about:blank', newWindow: true });
  const page = await nouvelle;
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: largeur, height: hauteur, deviceScaleFactor: 3, mobile: true });
  await cdp.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await cdp.send('Emulation.setUserAgentOverride', { userAgent: UA, platform: 'Android' });
  if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  /* Le contexte du Chrome connecté n'a pas `hasTouch` : `locator.tap()` de Playwright y est refusé. Ici, un toucher est un vrai toucher CDP
     (touchStart, 60 ms, touchEnd) au centre de l'élément, comme le doigt (e2e/outils/doigt.ts). */
  const proto = Object.getPrototypeOf(page.locator('body')) as { tap: (this: Locator) => Promise<void> };
  proto.tap = async function (this: Locator) {
    await this.scrollIntoViewIfNeeded();
    const b = await this.boundingBox();
    if (!b) throw new Error('toucher : élément sans boîte');
    const p = { x: Math.round(b.x + b.width / 2), y: Math.round(b.y + b.height / 2), id: 1, radiusX: 4, radiusY: 4, force: 1 };
    const c = await this.page().context().newCDPSession(this.page());
    await c.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [p] });
    await new Promise((r) => setTimeout(r, 60));
    await c.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await c.detach();
  };
  return { browser, page, fermer: async () => { await page.close().catch(() => undefined); /* jamais browser.close() */ } };
}

/** Le paquet servi (`assets/index-….js`) ; recharge jusqu'à `attendu` (le service worker passe à la nouvelle version en ~60 s). */
export async function paquetEnLigne(page: Page, attendu?: string, delaiMs = 180_000): Promise<string> {
  const lire = () => page.evaluate(() => [...document.scripts].map((s) => s.src).find((s) => /assets\/index-[\w-]+\.js/.test(s))?.replace(/^.*assets\//, '') ?? '');
  const t0 = Date.now();
  await page.goto(APP, { waitUntil: 'domcontentloaded' });
  let p = await lire();
  while (attendu && !p.includes(attendu) && Date.now() - t0 < delaiMs) {
    await page.waitForTimeout(10_000);
    await page.reload({ waitUntil: 'domcontentloaded' });
    p = await lire();
  }
  if (attendu) expect(p, 'le paquet servi est celui mis en ligne').toContain(attendu);
  return p;
}

/** Aujourd'hui dans la vue de la courbe (D442 : sa colonne bleue), le cadre ne commençant pas avant lui : l'état laissé au brasseur et
 *  celui d'où partent les preuves. À « 3 mois », le doigt posé hors du cadre, à droite, glisse vers la gauche (D436 : vers l'avenir), ou
 *  à gauche vers la droite, jusqu'à ce que le cadre commence dans la semaine d'aujourd'hui (10 gestes au plus). */
export async function ramenerAujourdhui(page: Page, choisir: (p: Page, nom: string) => Promise<void>, glisser: (a: { x: number; y: number }, b: { x: number; y: number }) => Promise<void>) {
  await choisir(page, '3 mois');
  for (let i = 0; i < 10; i++) {
    const e = await page.evaluate(() => {
      const c = document.querySelector('[data-cadre-etiquette]')?.closest('.ent-cadre')?.getBoundingClientRect();
      const a = document.querySelector('.ent-cb [data-aujourdhui]');
      const ab = a?.getBoundingClientRect();
      const cb = document.querySelector('.ent-cb')?.getBoundingClientRect();
      return { cote: a?.getAttribute('data-aujourdhui') ?? null, aL: ab ? ab.left : null, aR: ab ? ab.right : null, l: c?.left ?? 0, r: c?.right ?? 0, t: c ? c.top + c.height / 2 : 0, cl: cb?.left ?? 0, cr: cb?.right ?? 390 };
    });
    if (e.cote === 'dans' && e.aL !== null && Math.abs(e.l - e.aL) < 8) return;
    const versAvenir = e.cote === 'droite' || (e.cote === 'dans' && e.aL! > e.l);
    const pas = Math.max(20, Math.min(110, e.cote === 'dans' ? Math.abs(e.aL! - e.l) : 110));
    if (versAvenir) { const x = Math.min(e.cr - 4, e.r + 30); await glisser({ x, y: e.t }, { x: x - pas, y: e.t }); }
    else { const x = Math.max(e.cl + 4, e.l - 30); await glisser({ x, y: e.t }, { x: x + pas, y: e.t }); }
    await page.waitForTimeout(700);
  }
}

/** L'onglet Calendrier de l'app en ligne. */
export async function calendrierEnLigne(page: Page) {
  await expect(page.locator('nav button').first()).toBeVisible({ timeout: 90_000 });
  if (!(await page.locator('[data-calendrier]').count())) await page.getByRole('button', { name: 'Calendrier', exact: true }).first().tap();
  await expect(page.locator('[data-calendrier]')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.ent-cadre')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(500);
}
