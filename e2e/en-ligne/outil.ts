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

/** L'onglet Calendrier de l'app en ligne. */
export async function calendrierEnLigne(page: Page) {
  await expect(page.locator('nav button').first()).toBeVisible({ timeout: 90_000 });
  if (!(await page.locator('[data-calendrier]').count())) await page.getByRole('button', { name: 'Calendrier', exact: true }).first().tap();
  await expect(page.locator('[data-calendrier]')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('.ent-cadre')).toBeVisible({ timeout: 30_000 });
  await page.waitForTimeout(500);
}
