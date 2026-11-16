// Voie m0 : capture chaque sous-vue de Finances telle qu'elle est aujourd'hui (local, ?dev-local, données du banc).
// Usage (racine du dépôt) : node work/missions/2026-11-14-finances/voies/m0/capturer.mjs --reporter=dot > tests.txt
// Rien n'est enregistré : chaque feuille est laissée ouverte puis la page est rechargée. Aucun clic sur Enregistrer.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = process.cwd();
const VOIE = path.join(RACINE, 'work/missions/2026-11-14-finances/voies/m0');
const CAP = path.join(VOIE, 'cap');
fs.mkdirSync(CAP, { recursive: true });

const L = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const URL_BANC = 'http://localhost:3000/?dev-local&finance-demo=reel';

const { browser, page, journal } = await L.ouvrir(); // 390 × 844, échelle 2, tactile
const notes = [];

async function cliquer(texte, { mode = 'exact', aria = false, nth = 0 } = {}) {
  return page.evaluate((texte, mode, aria, nth) => {
    const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
    const els = [...document.querySelectorAll('button,[role="button"],[role="tab"],a,[role="menuitem"]')]
      .filter((x) => x.getClientRects().length > 0);
    const hits = els.filter((x) => {
      const v = norm(aria ? x.getAttribute('aria-label') : x.innerText);
      return mode === 'exact' ? v === texte : v.includes(texte);
    });
    const e = hits[nth];
    if (!e) return 'absent';
    if (e.disabled || e.getAttribute('aria-disabled') === 'true') return 'desactive';
    e.click();
    return 'ok';
  }, texte, mode, aria, nth);
}

async function etape(texte, opts = {}) {
  const r = await cliquer(texte, opts);
  if (r !== 'ok') throw new Error(`« ${texte} » ${r}`);
  await L.calme(page, 900);
  return 'ok';
}

async function aller(vue) {
  await page.goto(URL_BANC, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => localStorage.setItem('laffinee.theme', 'clair'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await L.calme(page, 1200);
  await etape('Finances');
  if (vue) await etape(vue);
}

async function shot(cle) {
  await page.screenshot({ path: path.join(CAP, cle + '.png') });
}

async function faire(cle, fn, auto = true) {
  let note;
  try {
    note = (await fn()) ?? 'ok';
  } catch (e) {
    note = 'ECHEC : ' + e.message;
  }
  if (auto) {
    try { await shot(cle); } catch (e) { note += ' ; capture impossible : ' + e.message; }
  }
  notes.push(`${cle} : ${note}`);
  console.log(`${cle} : ${note}`);
}

await faire('fi', async () => { await aller('Opérations'); await etape('Filtres'); });

await faire('do', async () => {
  await aller('Opérations');
  const r = await cliquer('Doublons');
  return r === 'desactive' ? 'bouton désactivé (Doublons, attribut disabled) ; écran capturé avec le bouton visible' : r;
});

await faire('ar', async () => {
  await aller('Opérations');
  try {
    await etape('Archives');
  } finally {
    await shot('ar');
  }
  const g = await cliquer('Gérer les archives', { mode: 'contains' });
  if (g !== 'ok') return `ar2 : « Gérer les archives » ${g}`;
  await L.calme(page, 900);
  await shot('ar2');
  return 'ok ; ar2 capturé (Gérer les archives)';
}, false);

await faire('ap', async () => { await aller('Opérations'); await etape('Apport ou prélèvement privé'); });

await faire('fo', async () => {
  await aller('Opérations');
  await etape('Achats divers', { mode: 'contains' });
  return 'ok (rangée « Achats divers · Quincaillerie », toucher)';
});

await faire('pa', async () => {
  await aller('Opérations');
  const r = await cliquer('à payer', { mode: 'contains' });
  if (r !== 'ok') throw new Error(`aucune rangée « à payer » en novembre (« à payer » ${r}) ; toutes les rangées sont « ✓ payé »`);
  await L.calme(page, 900);
  const p = await cliquer('Payer');
  return p === 'ok' ? 'ok (fiche puis bouton Payer)' : `ok (fiche ouverte ; bouton Payer ${p})`;
});

await faire('mo', async () => {
  await aller('Opérations');
  await etape('Joindre une pièce', { aria: true });
  return 'ok (« + pièce » = Joindre une pièce, première rangée)';
});

await faire('pr', async () => {
  await aller('Prévisions');
  const a = await cliquer('+', { mode: 'exact' });
  if (a === 'ok') { await L.calme(page, 900); return 'ok (bouton « + »)'; }
  const b = await cliquer('prévision', { mode: 'contains', aria: true });
  if (b === 'ok') { await L.calme(page, 900); return 'ok (aria « prévision »)'; }
  throw new Error('aucun bouton « + » ni « prévision » dans Prévisions (« + » ' + a + ')');
});

await faire('pm', async () => {
  await aller('Synthèse');
  await etape('Fournisseurs, matériel', { mode: 'contains' });
  return 'ok (lecture provisoire : ligne « Fournisseurs, matériel » de Synthèse ; projet matériel non confirmé)';
});

await faire('im', async () => {
  await aller('Annuel');
  await etape('4. Matériel et usure', { aria: true });
  for (const c of ['Ajouter un matériel', 'Ajouter un bien', 'Immobilisation', 'bien amorti', 'biens']) {
    if ((await cliquer(c, { mode: 'contains' })) === 'ok') { await L.calme(page, 900); return `ok (« ${c} »)`; }
  }
  throw new Error('étape 4 ouverte ; aucun bouton « bien » ou « Immobilisation » trouvé (écran de l’étape capturé)');
});

await faire('bb', async () => {
  await aller('Synthèse');
  await etape('Estimer un brassin', { aria: true });
  return 'ok (« + Estimer un brassin » : choix du brassin, budget non ouvert)';
});

await faire('pf', async () => {
  await aller('Synthèse');
  await etape('Solde et paramètres financiers', { aria: true });
  return 'ok (« Solde et paramètres financiers », En caisse)';
});

await faire('ia', async () => {
  await aller('Synthèse');
  await etape('Comprendre mes dépenses', { mode: 'contains' });
  return 'ok (Comprendre mes dépenses, Compagnon brasseur)';
});

await browser.close();
console.log(`erreurs de page : ${journal.erreurs.length} ; requêtes bloquées : ${journal.bloquees.length}`);
console.log(`captures : ${fs.readdirSync(CAP).filter((f) => f.endsWith('.png')).length} png`);
