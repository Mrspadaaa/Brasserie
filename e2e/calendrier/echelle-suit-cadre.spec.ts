// CAL-ECHELLE-SUIT-CADRE (23.11) : « pourquoi quand j'agrandis ou rétrécis l'axe du temps, l'échelle des semaines par exemple de met pas à jour
// avec ?? » (14 sem. : cadre S49–S9 plus étroit que la bande S49…S9 ; 3 sem. : « S49 – S46 2027 » ; 1 sem. : « S52 – S4 2027 »). Ses choix :
// D432 (graduations sur la courbe : le cadre couvre exactement ses semaines, les autres en gris dans les marges), D434 (le cadre dit ses dates),
// D433 (la pastille dit le creux du cadre et le suit). Après chaque durée (1, 3, 6, 14 sem.) et chaque poignée tirée (agrandir, rétrécir).
import { expect, test, type Page } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import { fenetreDe, ouvrirCalendrier, poserFixture } from '../outils/calendrier';

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const court = (iso: string) => `${Number(iso.slice(8, 10))} ${MOIS[Number(iso.slice(5, 7)) - 1]}`;
const dimanche = (lundi: string) => new Date(Date.parse(`${lundi}T00:00:00Z`) + 6 * 864e5).toISOString().slice(0, 10);

/** Ce que l'en-tête dit de la fenêtre : graduations (dans le cadre ou grises), bords du cadre, son étiquette, la pastille. */
const lire = (page: Page) => page.evaluate(() => {
  const cadre = document.querySelector('.ent-cadre')!.getBoundingClientRect();
  const grads = [...document.querySelectorAll('[data-bande-semaines] [data-semaine]')].map((e) => {
    const r = e.getBoundingClientRect();
    return { n: Number(e.getAttribute('data-semaine')), lundi: e.getAttribute('data-lundi') ?? '', hors: e.hasAttribute('data-hors'), l: r.left, r: r.right, texte: (e.textContent ?? '').trim() };
  }).filter((g) => g.r - g.l > 0.5);
  return {
    cadre: { l: cadre.left, r: cadre.right }, grads,
    etiquette: (document.querySelector('[data-cadre-etiquette]')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
    pastille: ((document.querySelector('[data-ent-cle]') as HTMLElement | null)?.innerText ?? '').replace(/\s+/g, ' ').trim()
  };
});

function fautes(l: Awaited<ReturnType<typeof lire>>, ou: string): string[] {
  const f: string[] = [], dans = l.grads.filter((g) => !g.hors);
  if (!dans.length) return [`${ou} : aucune graduation dans le cadre`];
  const a = dans[0], b = dans[dans.length - 1];
  if (Math.abs(a.l - l.cadre.l) > 3 || Math.abs(b.r - l.cadre.r) > 3) f.push(`${ou} : cadre ${Math.round(l.cadre.l)}–${Math.round(l.cadre.r)} ≠ graduations S${a.n}–S${b.n} ${Math.round(a.l)}–${Math.round(b.r)}`);
  for (const g of l.grads) if (g.hors && g.l + 1 > l.cadre.l && g.r - 1 < l.cadre.r) f.push(`${ou} : S${g.n} grise dans le cadre`);
  /* D434 : les dates du cadre, du lundi de la première semaine au dimanche de la dernière ; aucun « S<n> » répété */
  const deb = court(a.lundi), fin = court(dimanche(b.lundi));
  if (!l.etiquette.includes(deb.split(' ')[0]) || !l.etiquette.includes(fin.split(' ')[0]) || !l.etiquette.includes(fin.split(' ')[1])) f.push(`${ou} : étiquette « ${l.etiquette} » ≠ ${deb} – ${fin}`);
  if (/\bS\d+/.test(l.etiquette)) f.push(`${ou} : étiquette « ${l.etiquette} » dit des semaines (D434 : des dates)`);
  /* D433 : la semaine du creux est dans le cadre, ou rien à venir dedans : 0 « dans le cadre » */
  const s = /\bS(\d+)/.exec(l.pastille);
  if (/dans le cadre/.test(l.pastille)) { if (!/^0\b/.test(l.pastille)) f.push(`${ou} : pastille « ${l.pastille} » : rien dans le cadre mais pas 0`); }
  else if (!s || !dans.some((g) => g.n === Number(s[1]))) f.push(`${ou} : pastille « ${l.pastille} » hors du cadre S${a.n}–S${b.n}`);
  return f;
}

test('CAL-ECHELLE-SUIT-CADRE : graduations, étiquette et pastille suivent le cadre, à chaque durée et chaque poignée', async ({ page }, info) => {
  test.skip((page.viewportSize()?.width ?? 0) > 500, 'sa plainte : téléphone en portrait (390)');
  await poserFixture(page);
  await ouvrirCalendrier(page);
  const doigt = await Doigt.sur(page);
  const toutes: string[] = [];
  for (const n of [1, 3, 6, 14]) {
    const vue = await fenetreDe(page, doigt, n);
    await expect.poll(async () => fautes(await lire(page), vue), { timeout: 3_000, message: vue }).toEqual([]).catch(() => undefined);
    toutes.push(...fautes(await lire(page), vue));
    await info.attach(`${n}sem`, { body: await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 260 } }), contentType: 'image/png' });
    /* agrandir puis rétrécir par la poignée de fin */
    for (const [nom, dx] of [['agrandie', 60], ['rétrécie', -40]] as const) {
      const h = await page.locator('[data-poignee="fin"]').first().boundingBox();
      const x = h!.x + h!.width / 2, y = h!.y + h!.height / 2;
      await doigt.glisser({ x, y }, { x: Math.max(20, Math.min(380, x + dx)), y }, { dureeMs: 500 });
      await page.waitForTimeout(700);
      toutes.push(...fautes(await lire(page), `${vue} ${nom}`));
      await info.attach(`${n}sem-${nom}`, { body: await page.screenshot({ clip: { x: 0, y: 0, width: 390, height: 260 } }), contentType: 'image/png' });
    }
  }
  expect(toutes).toEqual([]);
});
