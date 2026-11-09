// Malts/sucres (PD-2, AM-11, BR-6) puis Récap (BR-20, BR-22, BR-26, BR-25) puis Eau (acide, ratio).
import { ouvrir, etape, texte, taper, valeurChamp, capture, cliquer, dormir } from './banc.mjs';
const largeur = Number(process.argv[2] ?? 1280);
const { browser, page } = await ouvrir({ largeur, hauteur: largeur < 600 ? 844 : 900 });
const lignes = async (re, max = 360) => (await texte(page)).split('\n').filter((l) => re.test(l)).join(' | ').slice(0, max);
const alertes = () => page.evaluate(() => [...document.querySelectorAll('[role=alert]')].map((e) => e.textContent.trim().slice(0, 150)));

await etape(page, 'Malts');
await taper(page, 'Masse de Pale Ale', '9000'); await page.keyboard.press('Tab'); await dormir(600);
console.log('FERM 9000 kg ->', await lignes(/~|Noire|OG|Rendement|EBC|›/), JSON.stringify(await alertes()));
await capture(page, `s4-ferm-9000-${largeur}`, { fullPage: true });
await taper(page, 'Masse de Pale Ale', '4,6'); await page.keyboard.press('Tab'); await dormir(400);

await etape(page, 'Récap');
await taper(page, 'Volume', '2,5'); await page.keyboard.press('Tab'); await dormir(800);
console.log('RECAP volume 2,5 ->', await lignes(/Grain|OG|alert|trop|Volume/), JSON.stringify(await alertes()));
await taper(page, 'Quantité de levure', '99999'); await page.keyboard.press('Tab'); await dormir(600);
console.log('RECAP levure 99999 ->', await valeurChamp(page, 'Quantité de levure'), JSON.stringify(await alertes()));
await taper(page, 'Durée de fermentation', '99999'); await page.keyboard.press('Tab'); await dormir(600);
console.log('RECAP durée 99999 ->', await valeurChamp(page, 'Durée de fermentation'), JSON.stringify(await alertes()));
const champsLevure = await page.evaluate(() => [...document.querySelectorAll('input')].filter((i) => /levure/i.test(i.getAttribute('aria-label') || '')).map((i) => ({ a: i.getAttribute('aria-label'), id: i.id, lab: !!i.labels?.length })));
console.log('RECAP champs levure', JSON.stringify(champsLevure));
await capture(page, `s4-recap-${largeur}`, { fullPage: true });

await etape(page, 'Eau');
const ac = await page.evaluate(() => [...document.querySelectorAll('input')].map((i) => i.getAttribute('aria-label')).filter((a) => /acide/i.test(a || '')));
console.log('EAU champs acide', JSON.stringify(ac));
for (const [aria, v] of [['Dose d’acide lactique 80 % à l’empâtage', '-1'], ['Dose d’acide lactique 80 % à l’empâtage', '99999'], ['Rapport eau grain', '2,5'], ['Rapport eau grain', '-1'], ['Dose de Gypse', '-1'], ['Osmosée disponible au total', '99999']]) {
  const ok = await taper(page, aria, v);
  if (!ok) { console.log('EAU', aria, 'ABSENT'); continue; }
  await page.keyboard.press('Tab'); await dormir(700);
  console.log('EAU', aria, v, '->', await valeurChamp(page, aria), JSON.stringify(await alertes()));
}
await capture(page, `s4-eau-${largeur}`, { fullPage: true });
await browser.close();
