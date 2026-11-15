// Voie r3 : captures de « Autre montant » (avis « Payé » -> Payer m5pa-d) et de m3pr-c / m3im-c, chaque essai borné à 60 s (le script de s2c se figeait).
// Usage (racine du dépôt) : node work/missions/2026-11-14-finances/voies/r3/capturer.mjs <autre|pr|im> <390|1280> <clair|cave>
// Banc : http://localhost:3000/?dev-local&finance-demo (déjà lancé). Rien n'est enregistré : « Payer » et « Enregistrer » ne sont jamais touchés.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const RACINE = process.cwd();
const CAP = path.join(RACINE, 'work/missions/2026-11-14-finances/voies/r3/cap');
fs.mkdirSync(CAP, { recursive: true });
const L = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const URL_BANC = 'http://localhost:3000/?dev-local&finance-demo';
const [vue, l, theme] = [process.argv[2], Number(process.argv[3]), process.argv[4]];
const mobile = l < 700;
// L.calme attend 30 s un réseau jamais calme sur Prévisions (le « gel » du script de s2c) : ici, un simple repos.
const calme = (_page, ms = 400) => new Promise((r) => setTimeout(r, ms + 300));
const sortie = [];
const garde = setTimeout(() => { console.log(sortie.join('\n') + '\nDELAI 90 s dépassé'); process.exit(2); }, 90000);

const { browser, page, journal } = await L.ouvrir({ largeur: l, hauteur: mobile ? 844 : 900, mobile, echelle: 2 });
const cliquer = (texte, { mode = 'exact', aria = false, nth = 0, dans = '' } = {}) => page.evaluate((texte, mode, aria, nth, dans) => {
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const racine = dans ? document.querySelector(dans) : document;
  const els = [...racine.querySelectorAll('button,[role="button"],[role="tab"],a,[role="menuitem"]')].filter((x) => x.getClientRects().length > 0);
  const hits = els.filter((x) => { const v = norm(aria ? x.getAttribute('aria-label') : x.innerText); return mode === 'exact' ? v === texte : v.includes(texte); });
  const e = hits[nth]; if (!e) return 'absent'; if (e.disabled) return 'desactive'; e.click(); return 'ok';
}, texte, mode, aria, nth, dans);
const etape = async (t, o) => { sortie.push(`étape « ${t} »`); const r = await cliquer(t, o); if (r !== 'ok') throw new Error(`« ${t} » ${r}`); await calme(page, 900); };
const shot = async (nom) => { await calme(page, 600); const f = `${nom}-${l}-${theme}.png`; await page.screenshot({ path: path.join(CAP, f) }); sortie.push(f); };
const aller = async (onglet) => {
  await page.goto(URL_BANC, { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => localStorage.setItem('laffinee.theme', t), theme);
  await page.reload({ waitUntil: 'domcontentloaded' }); await calme(page, 1500);
  await etape('Finances'); if (onglet) await etape(onglet);
};
const champ = async (sel, valeur) => { await page.click(sel, { clickCount: 3 }); await page.keyboard.type(valeur); await page.keyboard.press('Tab'); };

const essais = {
  // « Autre montant » : « ✓ Payé » écrit un paiement rapide (banc local de démonstration), l'avis l'annonce, « Autre montant » ouvre Payer sur la pièce.
  async autre() {
    await aller('Opérations');
    await shot('autre-0-avant');
    await etape('✓ Payé', { nth: 0 });
    await shot('autre-1-avis');
    await etape('Autre montant : ouvrir la feuille Payer', { aria: true });
    await shot('autre-2-payer');
  },
  async pr() {
    await aller('Prévisions');
    await etape('Voir 1 sortie de plus dans la liste', { mode: 'contains', aria: true }); await etape('Ajouter une prévision', { mode: 'contains' });
    await shot('pr-ouvert');
    await champ('input[placeholder^="Loyer"]', 'Loyer'); await champ("[aria-label=\"Montant (CHF)\"]", "500,50");
    await cliquer('Chaque mois'); await calme(page, 600);
    await shot('pr-apres');
  },
  async im() {
    await aller('Annuel'); await etape('4. Matériel et usure', { mode: 'contains', aria: true });
    let ok = false;
    for (const c of ['Modifier Cuve']) if (!ok && (await cliquer(c, { mode: 'contains' })) === 'ok') { ok = true; sortie.push(`bien ouvert par « ${c} »`); }
    if (!ok) throw new Error('aucun bouton de bien');
    await calme(page, 900); await shot('im-ouvert');
    await cliquer('10 % du prix', { mode: 'contains' }); await calme(page, 500);
    await shot('im-apres');
  },
};
try { await essais[vue](); } catch (e) { sortie.push(`ECHEC ${vue} ${l} ${theme} : ${e.message}`); await shot(`${vue}-echec`).catch(() => {}); }
sortie.push(`erreurs page : ${journal.erreurs.slice(0, 3).join(' | ') || 'aucune'}`);
await browser.close(); clearTimeout(garde);
console.log(sortie.join('\n'));
