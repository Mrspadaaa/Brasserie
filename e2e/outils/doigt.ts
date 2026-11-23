// Le doigt : gestes tactiles MINUTÉS, par le protocole de Chrome (CDP `Input.dispatchTouchEvent`), seule voie qui règle le temps entre deux
// événements tactiles. `locator.tap()` de Playwright suffit pour un toucher ; ici : glisser lent ou rapide, doigt tenu immobile (aucun
// touchMove, comme un vrai doigt posé), doigt tenu qui frotte (un pas par 100 ms), tremblement (±1 px à 60-120 Hz), appui long.
// Chaque geste lève le doigt là où il est (jamais ramené), comme le testeur.
import type { CDPSession, Page } from '@playwright/test';

export type Point = { x: number; y: number };
const attendre = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export class Doigt {
  private constructor(private readonly page: Page, private readonly cdp: CDPSession) {}

  static async sur(page: Page): Promise<Doigt> {
    return new Doigt(page, await page.context().newCDPSession(page));
  }

  private envoyer(type: 'touchStart' | 'touchMove' | 'touchEnd', p?: Point) {
    return this.cdp.send('Input.dispatchTouchEvent', {
      type,
      touchPoints: p ? [{ x: Math.round(p.x), y: Math.round(p.y), id: 1, radiusX: 4, radiusY: 4, force: 1 }] : []
    });
  }

  /** Pose le doigt, attend `tenirMs` (appui long si > 400), mène le doigt à `b` en `dureeMs` (un pas toutes les 16 ms), lève (`avantLeve` : une lecture, doigt encore posé). */
  async glisser(a: Point, b: Point, { dureeMs = 200, tenirMs = 50, avantLever = 60, avantLeve }: { dureeMs?: number; tenirMs?: number; avantLever?: number; avantLeve?: () => Promise<void> } = {}) {
    await this.envoyer('touchStart', a); await attendre(tenirMs);
    await this.mener(a, b, dureeMs);
    await attendre(avantLever); if (avantLeve) await avantLeve(); await this.envoyer('touchEnd');
  }

  /** Glisser lent (≈ 0,8 s) : le doigt qui cherche sa date. */
  glisserLent(a: Point, b: Point) { return this.glisser(a, b, { dureeMs: 800 }); }
  /** Glisser rapide (≈ 80 ms) : le coup de pouce. */
  glisserRapide(a: Point, b: Point) { return this.glisser(a, b, { dureeMs: 80, avantLever: 0 }); }

  /**
   * Mène le doigt à `b`, le tient `tenirMs` puis le lève AU BORD.
   *  - `immobile` : aucun touchMove pendant la tenue (le vrai doigt posé ; T9-2 immobile) ;
   *  - `frotte`   : un touchMove par 100 ms, 0 ou +1 px (l'ancien `tenirAuBord` des bancs) ;
   *  - `tremblant`: ±1 px (0, −1, 0, +1) toutes les `periodeMs` ms (T9-1 : le sens change sans cesse).
   */
  async tenirAuBord(a: Point, b: Point, tenirMs: number, { mode = 'immobile', periodeMs = 16, dureeMs = 320 }: { mode?: 'immobile' | 'frotte' | 'tremblant'; periodeMs?: number; dureeMs?: number } = {}) {
    await this.envoyer('touchStart', a); await attendre(50);
    await this.mener(a, b, dureeMs);
    const fin = Date.now() + tenirMs;
    if (mode === 'immobile') await attendre(tenirMs);
    else if (mode === 'frotte') for (let i = 0; Date.now() < fin; i++) { await attendre(100); await this.envoyer('touchMove', { x: b.x + (i % 2), y: b.y }); }
    else { const bruit = [0, -1, 0, 1]; for (let i = 0; Date.now() < fin; i++) { await attendre(periodeMs); await this.envoyer('touchMove', { x: b.x + bruit[i % 4], y: b.y }); } }
    await this.envoyer('touchEnd');
  }

  /** Appui long sans bouger. */
  async appuiLong(p: Point, ms = 600) { await this.envoyer('touchStart', p); await attendre(ms); await this.envoyer('touchEnd'); }

  /** Toucher bref (pour les points calculés ; pour un élément nommé, `locator.tap()`). */
  toucher(p: Point) { return this.page.touchscreen.tap(Math.round(p.x), Math.round(p.y)); }

  private async mener(a: Point, b: Point, dureeMs: number) {
    const n = Math.max(2, Math.round(dureeMs / 16));
    for (let k = 1; k <= n; k++) {
      await this.envoyer('touchMove', { x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
      await attendre(16);
    }
  }
}
