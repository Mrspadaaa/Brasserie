import { ouvrir, calme } from '../../../../../.claude/skills/webapp-testing/examples/_lanceur.mjs';
const { browser, page } = await ouvrir({ largeur: 1280, hauteur: 900, mobile: false, echelle: 1 });
await page.goto('http://localhost:3000/?dev-local&finance-demo'); await calme(page, 1500);
await page.evaluate(() => [...document.querySelectorAll('nav button, nav a, [role=tab]')].find((e) => /^Finances$/.test(e.textContent.trim()))?.click()); await calme(page, 1200);
await page.click('button[aria-label="Actions rapides"]'); await calme(page, 800);
const lire = () => page.evaluate(() => [...document.querySelectorAll('button,[role=menuitem],a')].filter((e) => e.offsetParent && /facture|écriture|saisir|dépense|apport|sans/i.test(e.textContent)).map((e) => e.tagName + ':' + e.textContent.replace(/\s+/g, ' ').trim().slice(0, 60)).join(' | '));
await page.evaluate(() => [...document.querySelectorAll("button")].find((e) => e.textContent.startsWith("Nouvelle écriture")).click()); await calme(page, 900);
console.log(await page.evaluate(() => [...document.querySelectorAll("button,a")].filter((e) => e.offsetParent).map((e) => e.textContent.replace(/s+/g, " ").trim().slice(0, 40)).slice(-14).join(" | ")));
await browser.close();
