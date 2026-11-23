// CAL-LACHER-OU-DESSINE (23.11, grave, données) : « Parcontre bien plus grave, là j'ai mon événement au dessus de septembre, mais il est noté en
// avril ??? » (51 sem., barre Hefe tirée sous « sept. », écrite « prête le 18 avr. »). Règle : à chaque échelle (1, 3, 6, 14, 51 sem.), fenêtre
// locale déplacée, pendant le geste la date annoncée = la date de l'axe sous le bout dessiné de la barre ; au lâcher, la date écrite = la date
// annoncée, et la barre reste où elle était dessinée (± 1 colonne). Le glisser d'une barre et son bord tiré. Données : la fixture simulée.
import { expect, test, type Page } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import { CLE_CACHE, CLE_FIXTURE, ajouter, aujourdhuiZurich, fenetreDe, fixtureFrise, ouvrirCalendrier, semainesDuLibelle } from '../outils/calendrier';

const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const DUREES = [1, 3, 6, 14, 51];
const jour = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 864e5;
const iso = (j: number | null) => (j === null ? '—' : new Date(Math.floor(j) * 864e5).toISOString().slice(0, 10));
const COURTS = Array.from({ length: 50 }, (_, k) => `P-ZZ-C${k}`);

/** La fixture du banc ; des travaux de deux jours chaque semaine (une barre entière dans toute fenêtre courte) ; des travaux de 12 semaines (une
 *  barre qui se tire à 51 semaines, comme Hefe chez lui). */
async function poser(page: Page) {
  const auj = aujourdhuiZurich(), e = fixtureFrise(auj);
  const plan = (id: string, du: string, au: string) => e.push({ name: 'financialPlans', id, data: { id, title: id.replace('P-ZZ-', 'ZZ TEST '), date: du, amountCents: 1000, direction: 'out', category: 'renovation', source: 'manual', status: 'active', createdAt: `${ajouter(auj, -30)}T08:00:00.000Z`, fenetre: { du, au, joursActifs: 2 } } });
  const lundi = ajouter(auj, -((new Date(`${auj}T12:00:00Z`).getUTCDay() + 6) % 7));
  COURTS.forEach((id, k) => plan(id, ajouter(lundi, 7 * (k - 10) + 1), ajouter(lundi, 7 * (k - 10) + 3))); // D441 : trois jours (au jour près, deux jours à 3 sem. font une marque)
  plan('P-ZZ-LONG', ajouter(auj, 21), ajouter(auj, 105));
  plan('P-ZZ-MOYEN', ajouter(lundi, 15), ajouter(lundi, 43));
  await page.addInitScript(([kf, j]) => { if (!localStorage.getItem(kf)) localStorage.setItem(kf, j); localStorage.setItem('laffinee.theme', 'clair'); }, [CLE_FIXTURE, JSON.stringify(e)] as const);
}

type Axe = { cols: string[][]; w: number; gauche: number; droite: number };
/** L'axe dessiné : colonnes (début, fin), largeur, bords de la frise. */
const axe = (page: Page): Promise<Axe> => page.evaluate(() => {
  const f = document.querySelector('[data-frise]') as HTMLElement, r = f.getBoundingClientRect();
  const cols = (f.getAttribute('data-colonnes') ?? '').split(' ').filter(Boolean).map((c) => c.split('/'));
  return { cols, w: Number(f.getAttribute('data-largeur-colonne')), gauche: r.left, droite: r.right };
});
/** Le jour (réel) de l'axe sous l'abscisse x de l'écran, comme une règle posée sur les colonnes. */
function sous(a: Axe, x: number): number {
  const xr = x - a.gauche, i = Math.max(0, Math.min(a.cols.length - 1, Math.floor(xr / a.w))), [d, f] = a.cols[i];
  return jour(d) + ((xr - i * a.w) / a.w) * (jour(f) - jour(d) + 1);
}
/** La largeur en jours de la colonne sous x : la tolérance (une colonne). */
const colonneSous = (a: Axe, x: number) => { const i = Math.max(0, Math.min(a.cols.length - 1, Math.floor((x - a.gauche) / a.w))); return jour(a.cols[i][1]) - jour(a.cols[i][0]) + 1; };
/** La première ou la dernière date d'un texte (« 3 nov. → 3 juil. », « S52 · 22 déc. · lâcher ici »), l'année au plus près de `pres`. */
function dateDe(t: string | null, pres: number, derniere: boolean): number | null {
  const m = [...(t ?? '').matchAll(/(\d{1,2}) (janv\.|févr\.|mars|avr\.|mai|juin|juil\.|août|sept\.|oct\.|nov\.|déc\.)(?: (\d{4}))?/g)];
  const x = derniere ? m[m.length - 1] : m[0];
  if (!x) return null;
  const an = new Date(pres * 864e5).getUTCFullYear(), mo = MOIS.indexOf(x[2]);
  const choix = (x[3] ? [Number(x[3])] : [an - 1, an, an + 1]).map((a) => Date.UTC(a, mo, Number(x[1])) / 864e5);
  return choix.sort((p, q) => Math.abs(p - pres) - Math.abs(q - pres))[0];
}
/** Ce que l'app annonce, doigt posé : « … · lâcher ici » (glisser) ; la durée que dit la barre tirée (« 20 août → 19 nov. »). */
const texteGeste = (page: Page, mode: 'glisse' | 'bord', id: string) => page.evaluate(([m, id]) => {
  const court = (l: Element[], re: RegExp) => l.map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim()).filter((x) => re.test(x) && x.length < 60).sort((a, b) => a.length - b.length)[0] ?? null;
  const tout = [...document.querySelectorAll('[data-frise] *')];
  if (m === 'glisse') return court(tout, /lâcher ici/);
  const b = document.querySelector(`[data-frise] [data-chose$="${id}"]`);
  return court([...(b?.querySelectorAll('*') ?? [])], /→/) ?? court(tout, /\d \S+ → \d/);
}, [mode, id] as const);
/** La date écrite : le début (glisser) ou la fin (bord) de la plage du plan, lue dans le cache de l'app. */
const ecrite = (page: Page, id: string, mode: 'glisse' | 'bord') => page.evaluate(([k, id, m]) => {
  const d = JSON.parse(localStorage.getItem(k) ?? '[]').find((x: { id: string }) => x.id === id)?.data;
  const v = m === 'bord' ? d?.fenetre?.au : d?.fenetre?.du ?? d?.date;
  return v ? Date.parse(`${v}T00:00:00Z`) / 864e5 : null;
}, [CLE_CACHE, id, mode] as const);
type Boite = { l: number; r: number; y: number; w: number };
const boite = (page: Page, id: string): Promise<Boite> => page.locator(`[data-frise] [data-chose$="${id}"]`).first().evaluate((e) => { const r = e.getBoundingClientRect(); return { l: r.left, r: r.right, y: r.top + r.height * 0.3, w: r.width }; });

test('CAL-LACHER-OU-DESSINE : date écrite = date annoncée = date sous le doigt, à chaque échelle, fenêtre déplacée', async ({ page }, info) => {
  test.skip((page.viewportSize()?.width ?? 0) > 500, 'sa plainte : téléphone en portrait (390)');
  await poser(page);
  await ouvrirCalendrier(page);
  const doigt = await Doigt.sur(page);
  const fautes: string[] = [], joues: string[] = [];
  for (const n of DUREES) {
    const vue = await fenetreDe(page, doigt, n);
    if (semainesDuLibelle(vue) !== n) fautes.push(`fenêtre de ${n} semaines voulue, « ${vue} » obtenue`);
    for (const mode of ['glisse', 'bord'] as const) {
      const a0 = await axe(page);
      /* une barre entière dans la frise, assez large pour être prise (au corps ou au bord), avec de la place à droite */
      let id: string | null = null, r0: Boite | null = null;
      const vus: string[] = [];
      for (const k of ['P-ZZ-LONG', 'P-ZZ-MOYEN', ...COURTS]) {
        const l = page.locator(`[data-frise] [data-chose$="${k}"]`).first();
        if (!(await l.count())) continue;
        const r = await boite(page, k);
        vus.push(`${k} ${Math.round(r.l)}-${Math.round(r.r)}`);
        /* de la place à droite ; sinon (1 sem. : une colonne, la barre la remplit) une barre entière, tirée vers la gauche */
        const entiere = r.w >= 30 && r.l >= a0.gauche - 1 && r.r <= a0.droite + 1;
        if (entiere && !id && !r0 && r.r > a0.droite - 100 && a0.cols.length > 1) continue;
        if (entiere) { await l.evaluate((e) => e.scrollIntoView({ block: 'center' })); await page.waitForTimeout(150); id = k; r0 = await boite(page, k); break; }
      }
      if (!id || !r0) { if (process.env.LOTCAL_DEBUG) await page.screenshot({ path: `${process.env.LOTCAL_DEBUG}/${n}-${mode}-rien.png`, fullPage: true }); fautes.push(`${vue} ${mode} : aucune barre à jouer (${vus.slice(0, 8).join(', ')})`); continue; }
      const a = await axe(page);
      const x0 = mode === 'bord' ? r0.r - 2 : r0.l + r0.w / 2; // le corps : hors des zones des deux bords
      const dx = Math.min(a.droite - 70 - x0, Math.max(2.5 * a.w, 0.45 * (a.droite - a.gauche)));
      let pendant: { t: string | null; r: Boite; a: Axe } | null = null;
      await doigt.glisser({ x: x0, y: r0.y }, { x: x0 + dx, y: r0.y }, { dureeMs: 800, avantLeve: async () => { if (process.env.LOTCAL_DEBUG) await page.screenshot({ path: `${process.env.LOTCAL_DEBUG}/${n}-${mode}-pendant.png` }); pendant = { t: await texteGeste(page, mode, id!), r: await boite(page, id!), a: await axe(page) }; } });
      await page.waitForTimeout(700);
      const p = pendant as unknown as { t: string | null; r: Boite; a: Axe };
      await info.attach(`${n}sem-${mode}`, { body: await page.screenshot(), contentType: 'image/png' });
      const bout = mode === 'bord' ? p.r.r - 2 : p.r.l + 2;
      const dessine = sous(p.a, bout), tol = colonneSous(p.a, bout);
      const annonce = dateDe(p.t, dessine, mode === 'bord');
      const ecrit = await ecrite(page, id, mode);
      const ou = `${vue} (${p.a.cols.length} col.) ${mode} « ${id} »`;
      joues.push(`${ou} : dessiné ${iso(dessine)}, annoncé ${iso(annonce)} (« ${p.t} »), écrit ${iso(ecrit)}`);
      if (annonce === null) fautes.push(`${ou} : aucune date annoncée`);
      else if (Math.abs(annonce - dessine) > tol + 1) fautes.push(`${ou} : annonce ${iso(annonce)} ≠ axe sous le bout dessiné ${iso(dessine)} (« ${p.t} »)`);
      if (ecrit === null) fautes.push(`${ou} : rien d'écrit`);
      else if (annonce !== null && ecrit !== annonce) fautes.push(`${ou} : écrit ${iso(ecrit)} ≠ annoncé ${iso(annonce)}`);
      const a2 = await axe(page), apres = await boite(page, id);
      const pose = sous(a2, mode === 'bord' ? apres.r - 2 : apres.l + 2);
      if (Math.abs(pose - dessine) > tol + 1) fautes.push(`${ou} : posée au ${iso(pose)}, dessinée au ${iso(dessine)}`);
      /* Annuler : la fixture revient pour le geste suivant */
      const annuler = page.locator('[data-message]').getByRole('button', { name: /Annuler/ });
      if (await annuler.count()) { await annuler.first().tap(); await page.waitForTimeout(400); }
    }
  }
  console.log(joues.join('\n'));
  expect(fautes).toEqual([]);
});
