// Voie f10, demande executant : captures v3-5 suite (pied), doc2 (Lectures), LR1-7 (title du prix), saisie a la main 3,00.
// Banc v3 (PORT_BANC=5198), reponses Gemini enregistrees seulement. Ecrit seulement dans ./captures.
import { lancer, ouvrir, feuilleDepense, capture, log, toucher, saisir, dormir } from './outil.mjs';

const COMBOS = [[390, 'clair'], [390, 'cave'], [1280, 'clair'], [1280, 'cave']];
const nav = await lancer();

const pied = (p) => p.evaluate(() => [...document.querySelectorAll('button')]
  .filter((b) => b.getClientRects().length && /lecture|Confirmer|Enregistrer/i.test(b.innerText))
  .map((b) => { const r = b.getBoundingClientRect(); return `${b.innerText.trim().replace(/\n+/g, ' ')}${b.disabled ? ' (inactif)' : ''} [droite ${Math.round(r.right)} / largeur fenetre ${document.documentElement.clientWidth}]`; })
  .join(' | '));

const cliqueVisible = (p, sel) => p.evaluate((s) => { const e = [...document.querySelectorAll(s)].filter((x) => x.getClientRects().length).at(-1); if (!e) return false; e.click(); return true; }, sel);

const saisirDernier = async (p, label, v) => {
  const e = (await p.$$(`[aria-label="${label}"]`)).at(-1); if (!e) { log(`  champ introuvable ${label}`); return false; }
  await e.evaluate((x) => x.scrollIntoView({ block: 'center' })); await e.click({ clickCount: 3 }); await p.keyboard.press('Backspace');
  if (v !== '') await p.keyboard.type(String(v), { delay: 5 }); await p.keyboard.press('Tab'); await dormir(500); return true;
};

const essai = async (nom, f) => { try { await f(); } catch (e) { log(`ERREUR ${nom} : ${e.message.slice(0, 300)}`); } };

async function v35(L, th) {
  const p = await ouvrir(nav, '?dev-local&depense=v3-lent', L, th);
  await p.waitForSelector('[aria-label="Actions rapides"]', { timeout: 90000 });
  await p.click('[aria-label="Actions rapides"]'); await dormir(800);
  const t0 = Date.now(); let avant = ''; let k = 0;
  await cliqueVisible(p, '[aria-label="Facture, photo ou PDF"]');
  while (Date.now() - t0 < 30000) {
    const pd = await pied(p);
    if (pd !== avant) { log(`f10-v35 ${L} ${th} t=${Date.now() - t0}ms pied : ${pd}`); if (k < 3) log('  ' + await capture(p, `f10-v35-${k++}`)); avant = pd; }
    if (await p.evaluate(() => document.body.dataset.apercu === 'v3-lent')) break;
    await dormir(150);
  }
  log(`f10-v35 ${L} ${th} pied final : ${await pied(p)}`);
  await p.close();
}

async function doc2(L, th) {
  const q = await feuilleDepense(nav, 'reel-doc2', L, th);
  const info = await q.evaluate(() => {
    const t = (document.querySelector('[role=dialog]')?.innerText ?? document.body.innerText).replace(/[  ]/g, ' ');
    return {
      entete: t.slice(0, 200).replace(/\n+/g, ' ¦ '),
      lectures: (t.match(/Lectures[^\n]*(\n[^\n]*){0,4}/) ?? ['—'])[0].replace(/\n+/g, ' ¦ ').slice(0, 300),
      accord: (t.match(/Lectures[^\n]*3\/3[^\n]*/g) ?? []).slice(0, 2),
      valeurEnDesaccord: (t.match(/valeur en désaccord/g) ?? []).length,
      desaccord: (t.match(/[^\n]*désaccord[^\n]*/g) ?? []).slice(0, 4),
    };
  });
  log(`f10-doc2 ${L} ${th} : ${JSON.stringify(info)}`);
  log('  ' + await capture(q, 'f10-doc2-entete'));
  await q.evaluate(() => { const e = [...document.querySelectorAll('[role=dialog] *, body *')].filter((x) => x.getClientRects().length && x.children.length < 4 && (x.innerText ?? '').includes('Lectures')).at(-1); e?.scrollIntoView({ block: 'center' }); });
  await dormir(300);
  log('  ' + await capture(q, 'f10-doc2-lectures'));
  await q.close();
}

async function lr17(L, th) {
  const r = await feuilleDepense(nav, 'medicament', L, th);
  await toucher(r, 'MEFENACIDE', { ms: 900 });
  await saisirDernier(r, 'Prix ligne 1', '');
  await saisirDernier(r, 'Quantité ligne 1', '4');
  const champ = await r.evaluate(() => [...document.querySelectorAll('[aria-label="Prix ligne 1"]')].filter((e) => e.getClientRects().length).map((e) => {
    const ids = (e.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
    return { valeur: e.value, title: e.title, describedby: e.getAttribute('aria-describedby'), texteLie: ids.map((i) => document.getElementById(i)?.textContent ?? '∅').join(' | ') };
  }));
  log(`f10-lr17 ${L} ${th} champ Prix ligne 1 : ${JSON.stringify(champ)}`);
  await r.evaluate(() => { const l = [...document.querySelectorAll('[aria-label="Prix ligne 1"]')].at(-1); l?.scrollIntoView({ block: 'center' }); });
  log('  ' + await capture(r, 'f10-lr17'));
  await r.close();
}

async function e12(L, th) {
  const p = await ouvrir(nav, '?dev-local', L, th);
  await p.waitForSelector('[aria-label="Actions rapides"]', { timeout: 90000 });
  await p.click('[aria-label="Actions rapides"]'); await dormir(800);
  await toucher(p, 'Facture, photo ou PDF', { label: true, ms: 1200 });
  await toucher(p, 'Saisir sans justificatif', { ms: 1200 });
  await saisir(p, '#purchase-total', '3');
  await toucher(p, 'Articles, stock et matériel', { ms: 1000 });
  const rangees = await p.evaluate(() => [...document.querySelectorAll('article[data-purchase-line]')].map((e) => ({ visible: e.getClientRects().length > 0, texte: e.innerText.replace(/\n+/g, ' ¦ ').slice(0, 80) })));
  log(`f10-e12 ${L} ${th} article[data-purchase-line] : total ${rangees.length}, visibles ${rangees.filter((x) => x.visible).length} ${JSON.stringify(rangees.map((x) => x.texte))}`);
  log('  ' + await capture(p, 'f10-e12', { plein: L > 600 }));
  await p.close();
}

try {
  for (const [L, th] of COMBOS) {
    log(`===== ${L} ${th}`);
    await essai('v35', () => v35(L, th));
    await essai('doc2', () => doc2(L, th));
    await essai('lr17', () => lr17(L, th));
    await essai('e12', () => e12(L, th));
  }
} finally { await nav.close(); log('FIN'); }
