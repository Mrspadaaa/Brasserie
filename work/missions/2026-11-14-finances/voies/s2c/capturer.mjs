// Voie s2c : captures de m3pr-c (prévision), m3im-c (bien amorti), m4pf-c (profil), ouvertes puis après leur geste. Rien n'est enregistré (jamais « Enregistrer »).
// Usage (racine du dépôt) : node work/missions/2026-11-14-finances/voies/s2c/capturer.mjs [390|1280|tout] [clair|cave|tout]
// Banc : http://localhost:3000/?dev-local&finance-demo (déjà lancé). Sortie : cap/<vue>-<etat>-<largeur>-<theme>.png
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const RACINE = process.cwd();
const CAP = path.join(RACINE, 'work/missions/2026-11-14-finances/voies/s2c/cap');
fs.mkdirSync(CAP, { recursive: true });
const L = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const URL_BANC = 'http://localhost:3000/?dev-local&finance-demo';
const largeurs = process.argv[2] && process.argv[2] !== 'tout' ? [Number(process.argv[2])] : [390, 1280];
const themes = process.argv[3] && process.argv[3] !== 'tout' ? [process.argv[3]] : ['clair', 'cave'];
const sortie = [];

for (const largeur of largeurs) for (const theme of themes) {
  const mobile = largeur < 700;
  const { browser, page, journal } = await L.ouvrir({ largeur, hauteur: mobile ? 844 : 900, mobile, echelle: 2 });
  const cliquer = (texte, { mode = 'exact', aria = false, nth = 0 } = {}) => page.evaluate((texte, mode, aria, nth) => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const els = [...document.querySelectorAll('button,[role="button"],[role="tab"],a,[role="menuitem"]')].filter((x) => x.getClientRects().length > 0);
    const hits = els.filter((x) => { const v = norm(aria ? x.getAttribute('aria-label') : x.innerText); return mode === 'exact' ? v === texte : v.includes(texte); });
    const e = hits[nth]; if (!e) return 'absent'; if (e.disabled) return 'desactive'; e.click(); return 'ok';
  }, texte, mode, aria, nth);
  const etape = async (t, o) => { const r = await cliquer(t, o); if (r !== 'ok') throw new Error(`« ${t} » ${r}`); await L.calme(page, 900); };
  const shot = async (nom) => { await L.calme(page, 600); const f = `${nom}-${largeur}-${theme}.png`; await page.screenshot({ path: path.join(CAP, f) }); sortie.push(f); };
  const aller = async (vue, url = URL_BANC) => {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme);
    await page.reload({ waitUntil: 'domcontentloaded' }); await L.calme(page, 1500);
    await etape('Finances'); if (vue) await etape(vue);
  };
  const champ = async (sel, valeur) => { await page.click(sel, { clickCount: 3 }); await page.keyboard.type(valeur); await page.keyboard.press('Tab'); };
  const essai = async (nom, fn) => { try { await fn(); } catch (e) { sortie.push(`ECHEC ${nom} ${largeur} ${theme} : ${e.message}`); await shot(`${nom}-echec`).catch(() => {}); } };

  // m4pf-c : Solde et paramètres
  await essai('pf', async () => {
    await aller('Synthèse', URL_BANC + '=reel'); await etape('Solde et paramètres financiers', { aria: true });
    await shot('pf-ouvert');
    await page.evaluate(() => { const r = document.querySelector('input.pfc-range'); const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; set.call(r, '2500'); r.dispatchEvent(new Event('input', { bubbles: true })); r.dispatchEvent(new Event('change', { bubbles: true })); });
    await cliquer('Tout est noté depuis août', { mode: 'contains', aria: true }); await L.calme(page, 500);
    await page.evaluate(() => document.querySelector('.pfc-eff')?.scrollIntoView({ block: 'center' }));
    await shot('pf-apres');
  });
  // m3pr-c : Ajouter une prévision
  await essai('pr', async () => {
    await aller('Prévisions');
    const a = await cliquer('+'); if (a !== 'ok') await etape('prévision', { mode: 'contains', aria: true }); else await L.calme(page, 900);
    await shot('pr-ouvert');
    await champ('input[placeholder^="Loyer"]', 'Loyer'); await champ('input[aria-label="Montant (CHF)"]', '500,50');
    await cliquer('Chaque mois'); await L.calme(page, 600);
    await shot('pr-apres');
  });
  // m3im-c : Bien amorti
  await essai('im', async () => {
    await aller('Annuel'); await etape('4. Matériel et usure', { aria: true });
    const noms = await page.evaluate(() => [...document.querySelectorAll('button')].filter((b) => b.getClientRects().length).map((b) => (b.innerText || b.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim()).filter(Boolean).slice(0, 40));
    sortie.push(`boutons étape 4 : ${noms.join(' | ').slice(0, 600)}`);
    let ok = false;
    for (const c of ['Cuve', 'Modifier', 'Ajouter un matériel', 'Ajouter un bien', 'Immobilisation', 'amortir']) if (!ok && (await cliquer(c, { mode: 'contains' })) === 'ok') { ok = true; sortie.push(`bien ouvert par « ${c} »`); }
    if (!ok) throw new Error('aucun bouton de bien');
    await L.calme(page, 900); await shot('im-ouvert');
    await cliquer('10 % du prix', { mode: 'contains' }); await L.calme(page, 500);
    await shot('im-apres');
  });
  sortie.push(`erreurs page ${largeur} ${theme} : ${journal.erreurs.slice(0, 3).join(' | ') || 'aucune'}`);
  await browser.close();
}
console.log(sortie.join('\n'));
