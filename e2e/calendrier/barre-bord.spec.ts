// La barre de la frise tirée vers un bord et lâchée (BUGS.md T10-1, liste du tour 10 : L-1).
// L-1 (bloquant, tour 10, CDP) : une barre menée au bord GAUCHE restait accrochée après le lever (fantôme « lâcher ici », en-tête figé, la
// fenêtre dézoomait seule jusqu'à 6 mois). Mécanisme vu ici (journal des pointeurs) : la fenêtre grandit sous le doigt, la barre devient trop
// petite et se redessine en marque (un autre composant) ; la capture du pointeur part au document et le lever tombe sur `main` : la barre ne
// l'entend jamais. Règle : frise B R10 (le lâcher pose à la date annoncée, ou rien ne bouge), CAL-BARRE-BORD. Données : la fixture simulée.
import { expect, test, type Page } from '@playwright/test';
import { Doigt } from '../outils/doigt';
import { CLE_FIXTURE, ajouter, aujourdhuiZurich, choisirPeriode, dateChose, fixtureFrise, lundis, ouvrirCalendrier, poserFixture } from '../outils/calendrier';

/* les barres jouées : « lol » (un papier d'un jour en S+2, une marque) et, comme M5, une fête de 4 jours dans la PREMIÈRE colonne, prise par
   son corps (x ≈ 44 à 390) ou par son début : une barre à 6 sem., trop petite (une marque) quand la fenêtre grandit sous le doigt */
const CHOSES = [['lol', 'P-PAPIER', 'corps'], ['fête de 4 jours, par le corps', 'CR-ZZ-M5', 'corps'], ['fête de 4 jours, début tiré', 'CR-ZZ-M5', 'debut']] as const;
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const auj = aujourdhuiZurich;
const lundi = (j: string) => { const d = new Date(`${j}T12:00:00Z`); return ajouter(j, -((d.getUTCDay() + 6) % 7)) as string; };
/** Semaine ISO d'un jour « aaaa-mm-jj ». */
function semaineIso(j: string) {
  const d = new Date(`${j}T12:00:00Z`), jeudi = new Date(d.getTime() + (3 - ((d.getUTCDay() + 6) % 7)) * 864e5);
  return 1 + Math.floor((jeudi.getTime() - Date.UTC(jeudi.getUTCFullYear(), 0, 1)) / (7 * 864e5));
}

async function barre(page: Page, id: string, prise: 'corps' | 'debut') {
  const chose = page.locator(`[data-frise] [data-chose$="${id}"]`).first();
  await chose.scrollIntoViewIfNeeded();
  const r = (await chose.boundingBox())!;
  expect(r, `« ${id} » est dans la frise`).toBeTruthy();
  const y = r.y + r.height / 2;
  if (prise === 'debut') return { x: r.x + 3, y };
  /* le corps est pris là où le doigt tombe VRAIMENT sur la barre (en paysage, l'en-tête de rangée « Fêtes 👁 » recouvre la première colonne :
     pris en son milieu, le doigt touchait l'œil et le geste n'avait jamais lieu, un test vert pour rien) */
  const x = await page.evaluate(([x0, w, y, id]) => {
    const sur = (x: number) => !!document.elementFromPoint(x, y)?.closest(`[data-chose$="${id}"]`);
    const pas = [...Array(41).keys()].map((k) => x0 + (w * (20 + (k % 2 ? 1 : -1) * Math.ceil(k / 2))) / 40);
    return pas.find((x) => x > x0 && x < x0 + w && sur(x)) ?? null;
  }, [r.x, r.width, y, id] as const);
  expect(x, `« ${id} » : un point de la barre est touchable`).not.toBeNull();
  return { x: x!, y };
}

const etiquetteCadre = (page: Page) => page.evaluate(() => (document.querySelector('[data-cadre-etiquette]')?.textContent ?? '').replace(/\s+/g, ' ').trim());
/**
 * Ce que l'app annonce, doigt posé : la bulle de la frise (« S38 · 17 sept. · lâcher ici »), la ligne de la courbe (« si tu lâches en S38 »),
 * ou, bord tiré, la durée (« 20 août → 19 nov. »).
 */
const annonce = (page: Page) => page.evaluate(() => {
  const t = [...document.querySelectorAll('[data-frise] *')].map((e) => (e.textContent ?? '').replace(/\s+/g, ' ').trim()).filter((x) => x.length < 48)
    .concat([...document.querySelectorAll('.ent-zap')].map((e) => e.parentElement?.textContent ?? ''));
  return t.find((x) => /S\d+ · .* lâcher ici/.test(x)) ?? t.find((x) => /si tu lâches en S\d+/.test(x)) ?? t.find((x) => /^\d{1,2} \S+ → /.test(x)) ?? null;
});

/** Après le lever : plus de fantôme, le cadre revenu, la fenêtre immobile, et la chose posée où c'était annoncé (sinon, à sa date d'avant). */
async function frisePosee(page: Page, id: string, d0: string | null, dit: string, ann: string | null) {
  await expect.poll(() => page.getByText(/lâcher ici/).count(), { message: `${dit} : la bulle « lâcher ici » disparaît`, timeout: 1_500 }).toBe(0);
  await expect(page.locator('.ent-cadre'), `${dit} : le cadre est dessiné`).toBeVisible();
  await expect(page.locator('[data-glisse]'), `${dit} : plus aucun glisser en cours`).toHaveCount(0);
  const e1 = await etiquetteCadre(page);
  await page.waitForTimeout(600);
  const e2 = await etiquetteCadre(page);
  expect(e2, `${dit} : la fenêtre ne bouge plus seule (« ${e1} » → « ${e2} »)`).toBe(e1);
  const d1 = await dateChose(page, id), s = ann ? /S(\d+)/.exec(ann) : null, b = ann ? /^(\d{1,2}) (\S+) → /.exec(ann) : null;
  /* doigt tenu au bord, la fenêtre recule encore entre la lecture et le lever : ce qui était annoncé, ou jusqu'à une semaine avant */
  if (b) {
    const vise = (j: string) => Number(j.slice(8, 10)) === Number(b[1]) && MOIS[Number(j.slice(5, 7)) - 1] === b[2];
    expect(!!d1 && [0, 1, 2, 3, 4, 5, 6, 7].some((k) => vise(ajouter(d1, k))), `${dit} : annoncé « ${ann} », posé ${d0} → ${d1}`).toBe(true);
  } else if (s) expect(d1 ? [0, 1].includes((Number(s[1]) - semaineIso(d1) + 53) % 53) : false, `${dit} : annoncé « ${ann} », posé ${d0} → ${d1} (S${d1 ? semaineIso(d1) : '?'})`).toBe(true);
  else expect(d1, `${dit} : rien d'annoncé au lever, rien ne bouge`).toBe(d0);
}

test.describe('Barre de la frise tirée au bord (L-1)', () => {
  const CAS: [string, number, number][] = [['x = 4, levée aussitôt', 4, 0], ['x = 4, tenue 1 s', 4, 1000], ['x = 4, tenue 3 s', 4, 3000], ['x = 20, tenue 3 s', 20, 3000], ['sortie de l\'écran par la gauche', -20, 300]];
  for (const echelle of ['6 sem.', '3 mois']) for (const [quoi, id, prise] of CHOSES) for (const [nom, x, tenue] of CAS) {
    test(`L-1 ${echelle}, bord gauche, ${quoi}, ${nom} : au lever la barre se pose où c'était annoncé et la frise redevient normale`, async ({ page }) => {
      const j = auj(), entrees = [...fixtureFrise(j), { name: 'creativeItems', id: 'CR-ZZ-M5', data: { id: 'CR-ZZ-M5', type: 'event', title: 'ZZ TEST — M5 — barre', date: lundi(j), fenetre: { du: lundi(j), au: ajouter(lundi(j), 3) }, status: 'todo' } }];
      await page.addInitScript(([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, v); }, [CLE_FIXTURE, JSON.stringify(entrees)] as const);
      await poserFixture(page);
      await ouvrirCalendrier(page);
      await choisirPeriode(page, '2 sem.');
      await choisirPeriode(page, echelle);
      const doigt = await Doigt.sur(page);
      const d0 = await dateChose(page, id), a = await barre(page, id, prise);
      let ann: string | null = null;
      await doigt.glisser(a, { x, y: a.y }, { dureeMs: 480, avantLever: tenue, avantLeve: async () => { ann = await annonce(page); } });
      await frisePosee(page, id, d0, `${quoi}, ${nom}`, ann);
      // un toucher ailleurs après coup ne doit rien avoir à libérer : la page répond (le menu de période s'ouvre et se ferme)
      await choisirPeriode(page, '6 mois');
      await expect(page.getByText(/lâcher ici/)).toHaveCount(0);
    });
  }
});

/*
 * L-8 (T10-8, M5-5) : au bord DROIT, une barre tenue 3 s ne faisait rien défiler ; elle se posait sur la dernière semaine visible. Cause lue :
 * la garde « la barre sortirait de la fenêtre » de `usePointeur` (bornes figées à l'appui) refusait tout pas vers le futur pour une barre de
 * la première colonne, même quand la fenêtre GRANDIT (même début : la barre ne sort pas). Attendu (CAL-BARRE-BORD) : comme au bord gauche.
 */
test.describe('Barre de la frise tenue au bord droit (L-8)', () => {
  for (const echelle of ['6 sem.', '3 mois']) for (const [quoi, id, prise] of CHOSES.filter(([, , p]) => p === 'corps')) {
    test(`L-8 ${echelle}, bord droit, ${quoi}, tenue 3 s : la fenêtre gagne au moins une semaine à droite et la barre se pose où c'était annoncé`, async ({ page }) => {
      const j = auj(), entrees = [...fixtureFrise(j), { name: 'creativeItems', id: 'CR-ZZ-M5', data: { id: 'CR-ZZ-M5', type: 'event', title: 'ZZ TEST — M5 — barre', date: lundi(j), fenetre: { du: lundi(j), au: ajouter(lundi(j), 3) }, status: 'todo' } }];
      await page.addInitScript(([k, v]) => { if (!localStorage.getItem(k)) localStorage.setItem(k, v); }, [CLE_FIXTURE, JSON.stringify(entrees)] as const);
      await poserFixture(page);
      await ouvrirCalendrier(page);
      await choisirPeriode(page, '2 sem.');
      await choisirPeriode(page, echelle);
      const largeur = page.viewportSize()!.width;
      const avant = await lundis(page);
      const doigt = await Doigt.sur(page);
      const d0 = await dateChose(page, id), a = await barre(page, id, prise);
      let ann: string | null = null;
      await doigt.glisser(a, { x: largeur - 4, y: a.y }, { dureeMs: 480, avantLever: 3000, avantLeve: async () => { ann = await annonce(page); } });
      await frisePosee(page, id, d0, `${quoi}, bord droit`, ann);
      const apres = await lundis(page);
      expect(apres[apres.length - 1] > avant[avant.length - 1], `${quoi} : la fenêtre a gagné à droite (${avant[avant.length - 1]} → ${apres[apres.length - 1]})`).toBe(true);
      const d1 = await dateChose(page, id);
      expect(!!d1 && !!d0 && d1 > ajouter(d0, 7 * (avant.length - 1)), `${quoi} : posée au-delà de la dernière semaine d'avant (${d0} → ${d1}, annoncé « ${ann} »)`).toBe(true);
    });
  }
});
