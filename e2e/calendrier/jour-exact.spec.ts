// CAL-JOUR-EXACT (23.11, 1036-3sem-jour) : « le choix d'un jour tombe pas exactement sur le jour » (3 sem. : bout posé entre 25 et 27, annonce
// 27 nov.). Au grain jour : le jour annoncé pendant le geste et le jour écrit au lâcher = le jour dont la colonne contient le doigt, sans tolérance,
// quel que soit l'endroit du doigt dans sa colonne (début, milieu, fin) et l'endroit où il a pris le bord ; le bout de la barre est dessiné sur ce
// jour. Chaque point d'étape d'un brassin se pose dans la colonne de son jour. Données : la fixture simulée. Rouge sur le tour 21.
import { expect, test, type Page } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import { CLE_CACHE, CLE_FIXTURE, ajouter, aujourdhuiZurich, fenetreDe, fixtureFrise, ouvrirCalendrier } from '../outils/calendrier';

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const jour = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 864e5;
const iso = (j: number | null) => (j === null ? '—' : new Date(Math.round(j) * 864e5).toISOString().slice(0, 10));
const COURTS = Array.from({ length: 16 }, (_, k) => `P-ZZ-C${k}`);

async function poser(page: Page) {
  const auj = aujourdhuiZurich(), e = fixtureFrise(auj);
  const plan = (id: string, du: string, au: string) => e.push({ name: 'financialPlans', id, data: { id, title: id.replace('P-ZZ-', 'ZZ TEST '), date: du, amountCents: 1000, direction: 'out', category: 'renovation', source: 'manual', status: 'active', createdAt: `${ajouter(auj, -30)}T08:00:00.000Z`, fenetre: { du, au, joursActifs: 2 } } });
  const lundi = ajouter(auj, -((new Date(`${auj}T12:00:00Z`).getUTCDay() + 6) % 7));
  COURTS.forEach((id, k) => plan(id, ajouter(lundi, 7 * (k - 6) + 1), ajouter(lundi, 7 * (k - 6) + 9))); // neuf jours : une barre (pas une marque) au grain jour
  await page.addInitScript(([kf, j]) => { if (!localStorage.getItem(kf)) localStorage.setItem(kf, j); localStorage.setItem('laffinee.theme', 'clair'); }, [CLE_FIXTURE, JSON.stringify(e)] as const);
}

type Axe = { cols: string[][]; w: number; gauche: number; droite: number };
const axe = (page: Page): Promise<Axe> => page.evaluate(() => {
  const f = document.querySelector('[data-frise]') as HTMLElement, r = f.getBoundingClientRect();
  return { cols: (f.getAttribute('data-colonnes') ?? '').split(' ').filter(Boolean).map((c) => c.split('/')), w: Number(f.getAttribute('data-largeur-colonne')), gauche: r.left, droite: r.right };
});
/** Le jour dont la colonne dessinée contient x (colonnes d'un jour au grain jour). */
const jourSous = (a: Axe, x: number) => { const i = Math.floor((x - a.gauche) / a.w); const [d, f] = a.cols[i]; return jour(d) + Math.floor(((x - a.gauche - i * a.w) / a.w) * (jour(f) - jour(d) + 1)); };
const xJour = (a: Axe, j: number) => { const i = a.cols.findIndex(([d, f]) => j >= jour(d) && j <= jour(f)); return i < 0 ? null : a.gauche + i * a.w; };
function dateDe(t: string | null, pres: number): number | null {
  const m = [...(t ?? '').matchAll(/(\d{1,2}) (janv\.|févr\.|mars|avr\.|mai|juin|juil\.|août|sept\.|oct\.|nov\.|déc\.)(?: (\d{4}))?/g)].pop();
  if (!m) return null;
  const an = new Date(pres * 864e5).getUTCFullYear(), mo = MOIS.indexOf(m[2]);
  return (m[3] ? [Number(m[3])] : [an - 1, an, an + 1]).map((a) => Date.UTC(a, mo, Number(m[1])) / 864e5).sort((p, q) => Math.abs(p - pres) - Math.abs(q - pres))[0];
}
const annonce = (page: Page, id: string) => page.evaluate((id) => {
  const court = (l: Element[], re: RegExp) => l.map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim()).filter((x) => re.test(x) && x.length < 60).sort((a, b) => a.length - b.length)[0] ?? null;
  const b = document.querySelector(`[data-frise] [data-chose$="${id}"]`);
  return court([...(b?.querySelectorAll('*') ?? [])], /→/) ?? court([...document.querySelectorAll('[data-frise] *')], /\d \S+ → \d/) ?? court([...document.querySelectorAll('body *')], /\d{1,2} \S+\.? → \d{1,2} \S+/);
}, id);
const ecrit = (page: Page, id: string) => page.evaluate(([k, id]) => { const v = JSON.parse(localStorage.getItem(k) ?? '[]').find((x: { id: string }) => x.id === id)?.data?.fenetre?.au; return v ? Date.parse(`${v}T00:00:00Z`) / 864e5 : null; }, [CLE_CACHE, id] as const);
const boite = (page: Page, id: string) => page.locator(`[data-frise] [data-chose$="${id}"]:not([data-marque])`).first().evaluate((e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, y: r.top + r.height * 0.3, w: r.width }; });

test('CAL-JOUR-EXACT : au grain jour, jour annoncé = jour écrit = colonne sous le doigt ; bout et points d\'étape sur leur jour', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 500, 'sa plainte : téléphone en portrait (390)');
  await poser(page);
  await ouvrirCalendrier(page);
  const doigt = await Doigt.sur(page);
  const vue = await fenetreDe(page, doigt, 3, false);
  await page.waitForTimeout(600);
  const fautes: string[] = [], joues: string[] = [];
  const a0 = await axe(page);
  expect(a0.cols.every(([d, f]) => d === f), `${vue} : colonnes d'un jour (grain jour)`).toBe(true);
  /* les points d'étape des brassins : chacun dans la colonne de son jour */
  const points = await page.locator('[data-frise] [data-jalon][data-point-texte]').evaluateAll((l) => l.map((e) => { const r = e.getBoundingClientRect(); return { t: e.getAttribute('data-point-texte') ?? '', c: r.left + r.width / 2, w: r.width }; }).filter((p) => p.w > 0));
  for (const p of points) {
    const j = dateDe(p.t, jour(a0.cols[0][0]) + 10), x = j === null ? null : xJour(a0, j);
    if (x === null || x < a0.gauche + 1 || x + a0.w > a0.droite - 1) continue;
    if (p.c < x - 0.5 || p.c > x + a0.w + 0.5) fautes.push(`point « ${p.t} » centré à ${p.c.toFixed(1)}, son jour ${iso(j)} va de ${x.toFixed(1)} à ${(x + a0.w).toFixed(1)}`);
  }
  /* le bord tiré : pris au bord même ou 8 px en dedans, lâché au début, au milieu ou à la fin d'une colonne */
  const cas = [{ prise: -2, pos: 0.12, jours: 3 }, { prise: -2, pos: 0.5, jours: 5 }, { prise: -2, pos: 0.9, jours: 4 }, { prise: -8, pos: 0.2, jours: 6 }, { prise: -8, pos: 0.85, jours: 2 }];
  for (const c of cas) {
    const a = await axe(page);
    let id: string | null = null;
    for (const k of COURTS) {
      const l = page.locator(`[data-frise] [data-chose$="${k}"]:not([data-marque])`).first();
      if (!(await l.count())) continue;
      const r = await boite(page, k);
      if (r.w >= 20 && r.l >= a.gauche && r.r + (c.jours + 1) * a.w < a.droite - 4) { id = k; await l.evaluate((e) => e.scrollIntoView({ block: 'center' })); await page.waitForTimeout(150); break; }
    }
    if (!id) { fautes.push(`${JSON.stringify(c)} : aucune barre à tirer`); continue; }
    const r0 = await boite(page, id), a1 = await axe(page);
    const x0 = r0.r + c.prise, col = Math.floor((r0.r - 1 - a1.gauche) / a1.w) + c.jours, x = a1.gauche + (col + c.pos) * a1.w;
    const voulu = jourSous(a1, x);
    let dit: string | null = null;
    await doigt.glisser({ x: x0, y: r0.y }, { x, y: r0.y }, { dureeMs: 600, avantLeve: async () => { dit = await annonce(page, id!); if (process.env.LOTCAL_DEBUG) await page.screenshot({ path: `${process.env.LOTCAL_DEBUG}/jour-exact-${cas.indexOf(c)}.png` }); } });
    await page.waitForTimeout(700);
    const an = dateDe(dit, voulu), ec = await ecrit(page, id), apres = await boite(page, id), a2 = await axe(page);
    const ou = `${vue} « ${id} » pris à ${c.prise} px du bord, lâché à ${Math.round(c.pos * 100)} % de la colonne du ${iso(voulu)}`;
    joues.push(`${ou} : annoncé ${iso(an)} (« ${dit} »), écrit ${iso(ec)}, bout dessiné à ${apres.r.toFixed(1)}`);
    if (an !== voulu) fautes.push(`${ou} : annoncé ${iso(an)} (« ${dit} »)`);
    if (ec !== voulu) fautes.push(`${ou} : écrit ${iso(ec)}`);
    const xv = xJour(a2, voulu);
    if (xv === null || Math.abs(apres.r - (xv + a2.w)) > 1.5) fautes.push(`${ou} : bout dessiné à ${apres.r.toFixed(1)}, la fin du ${iso(voulu)} est à ${xv === null ? '—' : (xv + a2.w).toFixed(1)}`);
    const annuler = page.locator('[data-message]').getByRole('button', { name: /Annuler/ });
    if (await annuler.count()) { await annuler.first().tap(); await page.waitForTimeout(400); }
  }
  console.log(joues.join('\n'));
  expect(fautes).toEqual([]);
});
