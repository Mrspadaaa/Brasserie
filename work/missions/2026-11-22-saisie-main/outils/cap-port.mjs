// Captures du PORT de v01s (saisie à la main) dans l'app, état par état, pour la comparaison côte à côte avec captures/v01s/.
//   node outils/cap-port.mjs --build <dossier du build de test> [--etats repos,achat,…] [--tailles 844,660]
// Build : celui du parcours (`PARCOURS_GARDER=1 node scripts/parcours/saisie-main.mjs …` dans port-carnet). Fixture « ZZ TEST » (chaînes)
// + un historique simulé (loyer récurrent, apport, malt, vente, abonnement) pour les habituels, les derniers noms et les pièces.
// Clavier : headless n'en a pas ; un état « clavier ouvert » est capturé dans une fenêtre réduite de 300 px (Gboard ≈ 300 px, estimé,
// comme la maquette). Sortie : captures/port/etats/<état>-<hauteur>.png ; mesures : 0 type=number, débordement horizontal, erreurs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const PORT = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/scripts/parcours';
const { lancerBanc, pageNeuve, sleep } = await import(pathToFileURL(`${PORT}/chaines-outils.mjs`).href);
const { fixtureChaines } = await import(pathToFileURL(`${PORT}/fixtures/chaines.mjs`).href);
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : null; };
const SORTIE = path.join(ICI, '..', 'captures', 'port', 'etats');
fs.mkdirSync(SORTIE, { recursive: true });
const KB = 300;
const iso = (d) => d.toISOString().slice(0, 10);
const jour = (n) => iso(new Date(Date.now() + n * 86400000));
const moisAvant = () => { const d = new Date(); d.setUTCMonth(d.getUTCMonth() - 1); return iso(d); };

function historique() {
  const at = `${jour(-60)}T08:00:00.000Z`, e = [];
  const tx = (id, date, description, kind, cents, category, subcategory, fin = {}) => e.push({ name: 'transactions', id, data: { id, date, description, category, subcategory, amountHT: cents / 100, amountTTC: cents / 100, tvaRate: 0, tvaAmount: 0, finance: { version: 1, kind, amountCents: cents, lines: [], paymentStatus: 'paid', recordedAt: at, ...fin } } });
  const d0 = moisAvant();
  e.push({ name: 'financialPlans', id: 'P-ZZ-LOYER', data: { id: 'P-ZZ-LOYER', title: 'ZZ TEST Loyer de l’atelier', date: d0, amountCents: 40000, direction: 'out', category: 'chargesFixes', source: 'recurring', status: 'active', recurrence: { frequency: 'monthly' }, vendor: 'ZZ TEST Régie du Lac', createdAt: at } });
  tx('T-ZZ-LOY1', d0, 'ZZ TEST Loyer de l’atelier', 'expense', 40000, 'chargesFixes', 'Loyer', { vendor: 'ZZ TEST Régie du Lac', planId: 'P-ZZ-LOYER', occurrenceId: `P-ZZ-LOYER:${d0}` });
  tx('T-ZZ-APP', jour(-50), 'ZZ TEST De ma poche', 'contribution', 150000, 'apports', 'Apport privé');
  tx('T-ZZ-MALT', jour(-8), 'ZZ TEST Malt Pilsner', 'expense', 18640, 'brassage', 'Achat', { vendor: 'ZZ TEST Malterie' });
  tx('T-ZZ-QUIN', jour(-19), 'ZZ TEST Vis inox', 'expense', 4200, 'materiel', 'Achat', { vendor: 'ZZ TEST Quincaillerie' });
  tx('T-ZZ-VENTE', jour(-14), 'ZZ TEST Marché de Noël', 'income', 32000, 'recettes', 'Vente', { vendor: 'ZZ TEST Bar du Port' });
  tx('T-ZZ-ABO', jour(-31), 'ZZ TEST Logiciel de compta', 'expense', 2990, 'chargesFixes', 'Abonnement', { vendor: 'ZZ TEST Logiciel de compta' });
  return e;
}

/* chaque état : les gestes depuis le repos ; `kb` : clavier ouvert (fenêtre réduite de 300 px) */
const ETATS = {
  repos: { kb: false, g: [] },
  achat: { kb: true, g: [['genre', 'achat'], ['tape', '40']] },
  vente: { kb: true, g: [['genre', 'vente'], ['tape', '250']] },
  loyer: { kb: true, g: [['genre', 'loyer'], ['tape', '400']] },
  apport: { kb: true, g: [['genre', 'apport'], ['tape', '2000']] },
  abo: { kb: true, g: [['genre', 'abo'], ['tape', '29,9'], ['sel', '[data-saisie-fin="1an"]']] },
  fin: { kb: false, g: [['genre', 'abo'], ['tape', '29,9'], ['sel', '[data-saisie-fin="date"]']] },
  rpiece: { kb: false, g: [['genre', 'rembt']] },
  rembt: { kb: true, g: [['genre', 'rembt'], ['sel', '[data-saisie-piece="T-ZZ-MALT"]']] },
  hab: { kb: true, g: [['sel', '[data-saisie-habituel="plan:P-ZZ-LOYER"]']] },
  prel: { kb: true, g: [['genre', 'prel'], ['tape', '300']] },
  impot: { kb: true, g: [['genre', 'impot'], ['tape', '1240']] },
  apayer: { kb: true, g: [['genre', 'achat'], ['tape', '186,40'], ['sel', '[data-saisie-reglement="apayer"]'], ['sel', '[data-saisie-nom-puce="ZZ TEST Malterie"]']] },
  ok: { kb: false, g: [['genre', 'loyer'], ['tape', '400'], ['sel', '[data-saisie-enregistrer]'], ['ok']] },
  okb: { kb: false, g: [['genre', 'apport'], ['tape', '2000'], ['entree'], ['ok']] },
  okr: { kb: false, g: [['genre', 'rembt'], ['sel', '[data-saisie-piece="T-ZZ-MALT"]'], ['efface'], ['tape', '18,40'], ['sel', '[data-saisie-enregistrer]'], ['ok']] }
};
const etats = (opt('etats') ?? Object.keys(ETATS).join(',')).split(',');
const L = Number(opt('largeur') ?? 390);
const tailles = (opt('tailles') ?? '844').split(',').map(Number);

async function tap(s, sel) {
  const c = await s.p.evaluate((q) => { const e = [...document.querySelectorAll(q)].find((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0; }); if (!e) return null; let r = e.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) { e.scrollIntoView({ block: 'center' }); r = e.getBoundingClientRect(); } return [r.x + r.width / 2, r.y + r.height / 2]; }, sel);
  if (!c) throw new Error(`introuvable : ${sel}`);
  await s.p.touchscreen.tap(c[0], c[1]); await sleep(450);
}

const banc = await lancerBanc(path.resolve(opt('build')));
const bilan = [];
try {
  const entrees = [...(fixtureChaines(jour(0), { cuve: true, rayons: true }).entrees ?? []), ...historique()];
  for (const H of tailles) for (const nom of etats) {
    const et = ETATS[nom]; const s = await pageNeuve(banc, entrees, SORTIE);
    try {
      await s.p.setViewport({ width: L, height: H, isMobile: L < 800, hasTouch: L < 800, deviceScaleFactor: L < 800 ? 2 : 1 });
      await s.demarrer();
      await s.toucher('Actions rapides', { dans: 'button[aria-label^="Actions rapides"]', prefixe: true }); await sleep(400);
      await s.toucher('Écriture', { dans: '[role=menu] [role=menuitem]', prefixe: true, att: 1200 });
      await s.p.waitForSelector('[data-saisie-main]', { timeout: 8000 });
      for (const [k, v] of et.g) {
        if (k === 'genre') await tap(s, `[data-saisie-genre="${v}"]`);
        else if (k === 'sel') await tap(s, v);
        else if (k === 'tape') { await s.p.keyboard.type(v, { delay: 25 }); await sleep(250); }
        else if (k === 'efface') { await s.p.focus('[data-saisie-montant]'); await s.p.keyboard.down('Control'); await s.p.keyboard.press('KeyA'); await s.p.keyboard.up('Control'); await s.p.keyboard.press('Backspace'); }
        else if (k === 'entree') { await s.p.keyboard.press('Enter'); await sleep(400); }
        else if (k === 'ok') await s.p.waitForSelector('[data-saisie-ok]', { timeout: 10000 });
      }
      if (et.kb) { await s.p.setViewport({ width: 390, height: H - KB, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await sleep(500); }
      const m = await s.p.evaluate(() => {
        const r = document.querySelector('[data-saisie-main]');
        const deborde = [...r.querySelectorAll('*')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.right > innerWidth + 1 || b.left < -1) && !e.closest('.sai-qui,.choix-date'); }).map((e) => e.className || e.tagName).slice(0, 4);
        const pied = document.querySelector('[data-saisie-enregistrer]')?.getBoundingClientRect();
        return { number: r.querySelectorAll('input[type=number]').length, deborde, piedVisible: !!pied && pied.bottom <= innerHeight + 1 && pied.top >= 0, focus: document.activeElement?.getAttribute('aria-label') ?? '' };
      });
      await s.cap(L === 390 ? `${nom}-${H}` : `${nom}-${L}x${H}`);
      bilan.push(`${nom}-${H} : number ${m.number}, débordement ${m.deborde.length ? m.deborde.join('|') : 0}, pied ${m.piedVisible ? 'visible' : 'CACHÉ'}, focus « ${m.focus} »${s.erreurs.length ? `, erreurs ${s.erreurs.slice(0, 2).join(' | ')}` : ''}`);
    } catch (e) { bilan.push(`${nom}-${H} : ECHEC ${String(e.message ?? e).slice(0, 200)}`); await s.cap(`${nom}-${H}-erreur`).catch(() => {}); }
    finally { await s.fermer(); }
  }
} finally { await banc.fermer(); }
console.log(bilan.join('\n'));
console.log(bilan.some((l) => /ECHEC|CACHÉ|number [1-9]|erreurs/.test(l) || !/débordement 0/.test(l)) ? 'CAP-PORT A REVOIR' : 'CAP-PORT OK');
