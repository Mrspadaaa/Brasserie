// CAL-UN-SEUL-AXE (D441, 3e plainte, 23.11) : « Toujours un gros problème entrer l'axe du graph et l'axe du calendrier, 3 ème fois que je le
// dis... » (10sem-0947, 3sem-0947 : la bande suit la fenêtre de la courbe, les rangées étiraient le cadre : « prête 29 déc. » sous S1).
// CAL-GRILLE-SUR-GRADUATIONS (23.11) : « le découpage en section … c'est pas corrélé à l'échelle ça donne aucune information ??? » (grille-0951).
// À chaque durée (menu, ses deux gestes 10 et 3 sem., pendant le tirage) : chaque barre posée commence et finit au x de ses dates sur la bande
// (± 2,5 px) ; chaque ligne des rangées tombe sur une graduation de la bande (± 1 px) et chaque graduation a sa ligne. Rouge sur le tour 18.
import { expect, test, type Page } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import { CLE_CACHE, CLE_FIXTURE, ajouter, aujourdhuiZurich, choisirPeriode, fenetreDe, fixtureFrise, ouvrirCalendrier } from '../outils/calendrier';

async function poser(page: Page) {
  const auj = aujourdhuiZurich(), e = fixtureFrise(auj);
  const plan = (id: string, du: string, au: string) => e.push({ name: 'financialPlans', id, data: { id, title: id.replace('P-ZZ-', 'ZZ TEST '), date: du, amountCents: 1000, direction: 'out', category: 'renovation', source: 'manual', status: 'active', createdAt: `${ajouter(auj, -30)}T08:00:00.000Z`, fenetre: { du, au, joursActifs: 2 } } });
  const lundi = ajouter(auj, -((new Date(`${auj}T12:00:00Z`).getUTCDay() + 6) % 7));
  plan('P-ZZ-COURT', ajouter(lundi, 2), ajouter(lundi, 4));
  plan('P-ZZ-MOYEN', ajouter(lundi, 15), ajouter(lundi, 43));
  plan('P-ZZ-LONG', ajouter(auj, 21), ajouter(auj, 105));
  plan('P-ZZ-LOIN', ajouter(lundi, 120), ajouter(lundi, 200));
  await page.addInitScript(([kf, j]) => { if (!localStorage.getItem(kf)) localStorage.setItem(kf, j); localStorage.setItem('laffinee.theme', 'clair'); }, [CLE_FIXTURE, JSON.stringify(e)] as const);
}

/** Les fautes d'axe et de grille, lues à l'écran. */
export const fautesAxe = (page: Page, ou: string) => page.evaluate(([cle, ou]) => {
  const f: string[] = [];
  const jour = (iso: string) => Date.parse(`${iso}T00:00:00Z`) / 864e5;
  const cells = [...document.querySelectorAll('[data-bande-semaines] [data-lundi]')].map((e) => ({ l: e.getAttribute('data-lundi')!, r: e.getBoundingClientRect() }));
  const wMax = Math.max(0, ...cells.map((c) => c.r.width));
  const pleines = cells.filter((c) => c.r.width > wMax - 0.6);
  if (pleines.length < 1) return [`${ou} : bande illisible`];
  const ref = pleines[Math.floor(pleines.length / 2)], pj = ref.r.width / 7;
  const X = (iso: string) => ref.r.left + (jour(iso) - jour(ref.l)) * pj;
  const courbe = document.querySelector('.ent-cb')?.getBoundingClientRect();
  const frise = document.querySelector('[data-frise]')!.getBoundingClientRect();
  const g = Math.max(courbe?.left ?? 0, frise.left), d = Math.min(courbe?.right ?? 1e9, frise.right);
  const donnees = JSON.parse(localStorage.getItem(cle) ?? '[]') as Array<{ id: string; data: { fenetre?: { du: string; au: string } } }>;
  let vues = 0;
  for (const x of donnees.filter((x) => x.id.startsWith('P-ZZ-'))) {
    const el = document.querySelector(`[data-frise] [data-chose$="${x.id}"]`), b = el?.getBoundingClientRect();
    if (!el || !b || b.width < 1 || !x.data.fenetre) continue;
    const a = X(x.data.fenetre.du), z = X(new Date((jour(x.data.fenetre.au) + 1) * 864e5).toISOString().slice(0, 10));
    /* une chose trop courte pour sa barre est une marque de taille fixe : elle se juge par son centre */
    if (el.hasAttribute('data-marque')) { const c = (a + z) / 2; if (c > g + 3 && c < d - 3) { vues++; if (Math.abs((b.left + b.right) / 2 - c) > 2.5) f.push(`${ou} : marque ${x.id} centrée à ${((b.left + b.right) / 2).toFixed(1)}, ses dates au ${c.toFixed(1)} sur la bande`); } continue; }
    if (a > g + 3 && a < d - 3) { vues++; if (Math.abs(b.left - a) > 2.5) f.push(`${ou} : ${x.id} commence à ${b.left.toFixed(1)}, son ${x.data.fenetre.du} est à ${a.toFixed(1)} sur la bande`); }
    if (z > g + 3 && z < d - 3) { vues++; if (Math.abs(b.right - z) > 2.5) f.push(`${ou} : ${x.id} finit à ${b.right.toFixed(1)}, la fin du ${x.data.fenetre.au} est à ${z.toFixed(1)} sur la bande`); }
  }
  if (!vues) f.push(`${ou} : aucun bout de barre à juger`);
  /* CAL-GRILLE-SUR-GRADUATIONS : les graduations = les centres des noms posés (S.., initiale de mois, chiffre de jour) */
  const grads = [...document.querySelectorAll('[data-bande-semaines] .ent-sem, [data-bande-semaines] .ent-bd-j')].map((e) => e.getBoundingClientRect()).filter((r) => r.width > 0).map((r) => r.left + r.width / 2);
  const lignes = [...document.querySelectorAll('[data-frise] .cal-axe-l')].map((e) => e.getBoundingClientRect().left).filter((x) => x >= frise.left - 0.5 && x <= frise.right + 0.5);
  if (!lignes.length) f.push(`${ou} : aucune ligne de colonne posée sur les graduations (${grads.length} graduations)`);
  else {
    for (const x of grads) if (!lignes.some((l) => Math.abs(l - x) <= 1)) f.push(`${ou} : la graduation à ${x.toFixed(1)} n'a pas sa ligne`);
    for (const l of lignes) if (!grads.some((x) => Math.abs(l - x) <= 1)) f.push(`${ou} : la ligne à ${l.toFixed(1)} n'est sur aucune graduation`);
  }
  return f;
}, [CLE_CACHE, ou] as const);

test('CAL-UN-SEUL-AXE et CAL-GRILLE-SUR-GRADUATIONS : une même date, un même x ; les lignes sur les graduations', async ({ page }) => {
  test.skip((page.viewportSize()?.width ?? 0) > 500, 'sa plainte : téléphone en portrait (390)');
  await poser(page);
  await ouvrirCalendrier(page);
  const doigt = await Doigt.sur(page);
  const fautes: string[] = [];
  for (const nom of ['2 sem.', '6 sem.', '3 mois', '6 mois', 'An']) {
    await choisirPeriode(page, nom); await page.waitForTimeout(500);
    fautes.push(...await fautesAxe(page, nom));
  }
  for (const n of [10, 3]) {
    const vue = await fenetreDe(page, doigt, n, false); await page.waitForTimeout(600);
    fautes.push(...await fautesAxe(page, `geste ${vue}`));
    const h = (await page.locator('[data-poignee="fin"]').first().boundingBox())!, y = h.y + h.height / 2, x = h.x + h.width / 2;
    await doigt.glisser({ x, y }, { x: x - 30, y }, { dureeMs: 500, avantLeve: async () => { await page.waitForTimeout(150); fautes.push(...await fautesAxe(page, `${vue}, poignée tirée, doigt posé`)); } });
    await page.waitForTimeout(600);
    fautes.push(...await fautesAxe(page, `${vue}, poignée lâchée`));
  }
  expect(fautes).toEqual([]);
});
