// Banc r3 de l'assistant (recette d'identité de démonstration, `?dev-local&etape=houblons&recette=identite`, port 3122 via with_server).
// Usage : node banc-barre.mjs <largeur> <theme> <avant|apres> [étape1,étape2…]
// Pour chaque étape (clic sur le rail) : capture au repos (scrollTop 0), et mesure
//  - BK3-3 : la barre « Retour / Suivant » [data-page-end-actions] coupe-t-elle un bloc du contenu au repos ?
//  - B1-NOTE-3 : « Abandonner » présent dès l'ouverture ; TE-13 : la ligne data-role="ecart-og" ; BR-91 : le titre de l'étape.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const [largeur = '1280', theme = 'clair', tag = 'avant', etapes = 'Identité'] = process.argv.slice(2);
const port = (process.env.WITH_SERVER_PORTS ?? '3122').split(',')[0];
const mobile = Number(largeur) < 700;
const hauteur = Number(process.env.HAUTEUR ?? (mobile ? 844 : 800));
const { browser, page } = await ouvrir({ largeur: Number(largeur), hauteur, mobile });
await page.evaluateOnNewDocument((t) => { try { localStorage.setItem('laffinee.theme', t); } catch { /* */ } }, theme);
await page.goto(`http://localhost:${port}/?dev-local&etape=houblons&recette=identite`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('[data-page-end-actions]', { timeout: 90000 }).catch(() => console.log('pas de barre au chargement'));
await calme(page, 1500);
fs.mkdirSync(path.join(dir, 'captures'), { recursive: true });

for (const etape of etapes.split(',')) {
  // Le rail : le bouton dont le nom accessible est l'étape (jamais le texte d'un titre).
  const clic = await page.evaluate((n) => {
    const b = [...(document.querySelector('[data-page-shell]') ?? document).querySelectorAll('button')].find((x) => (x.getAttribute('aria-label') ?? x.textContent ?? '').trim().replace(/\s+/g, ' ') === n || (x.textContent ?? '').trim() === n);
    if (b) { b.click(); return true; } return false;
  }, etape);
  if (!clic) console.log('étape introuvable', etape);
  await calme(page, 1200);
  const base = `assistant-${etape.replace(/[^a-z0-9]+/gi, '').toLowerCase()}-${largeur}-${theme}-${tag}`;
  const mesure = await page.evaluate(() => {
    const barre = document.querySelector('[data-page-end-actions]');
    const coque = barre?.closest('[data-page-shell]') ?? document.querySelector('[data-page-shell]');
    const main = coque?.querySelector('main') ?? document.querySelector('main');
    if (main) main.scrollTop = 0;
    const abandonner = !!document.querySelector('[data-role="abandonner-brouillon"]');
    const ecart = document.querySelector('[data-role="ecart-og"]');
    const titre = [...document.querySelectorAll('header *')].map((e) => (e.children.length ? '' : (e.textContent ?? '').trim())).filter((t) => /\d\/7/.test(t)).slice(0, 2);
    const base = { abandonner, ecartOg: ecart ? `${ecart.textContent} | title=${ecart.getAttribute('title')}` : null, titre };
    if (!barre || !main) return { ...base, barre: null };
    const b = barre.getBoundingClientRect(), m = main.getBoundingClientRect();
    const racine = main.firstElementChild;
    const blocs = [...racine.children, ...[...racine.children].flatMap((c) => [...c.children])].filter((e) => e !== barre && !barre.contains(e) && !e.contains(barre));
    const coupes = [];
    for (const e of blocs) {
      const r = e.getBoundingClientRect();
      if (r.height < 8 || r.width < 8) continue;
      // Coupé par la barre : le bloc commence au-dessus du haut de la barre et finit sous ce haut (sa fin est cachée) ; la barre posée à plat dans le flux ne coupe rien.
      if (r.top < b.top - 1 && r.bottom > b.top + 1 && r.top < m.bottom) coupes.push(`${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} : ${Math.round(r.bottom - b.top)} px sous la barre`);
    }
    const horsZone = !main.contains(barre);
    const chevauche = Math.max(0, Math.round(m.bottom - b.top));
    return { ...base, horsZone, chevauche, position: getComputedStyle(barre).position, barre: [Math.round(b.top), Math.round(b.height)], mainBas: Math.round(m.bottom),
      defilable: main.scrollHeight > main.clientHeight + 2, reste: Math.round(main.scrollHeight - main.clientHeight), coupes };
  });
  console.log(base, JSON.stringify(mesure));
  await page.screenshot({ path: path.join(dir, 'captures', `${base}.png`) });
}
await browser.close();
