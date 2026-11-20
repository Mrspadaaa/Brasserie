// Voie s2 — captures dev-local (fixtures en mémoire, jamais Firestore). Lancé par scripts/with_server.mjs sur le port 3105.
// Usage : node scripts/with_server.mjs --server "npm run dev -- --port 3105 --strictPort" --port 3105 --timeout 180 -- node work/missions/2026-11-19-bugs-ecrans/voies/s2/capturer-s2.mjs
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const racine = process.cwd();
const dossier = path.join(racine, 'work/missions/2026-11-19-bugs-ecrans/voies/s2/captures');
const { ouvrir, calme } = await import(pathToFileURL(path.join(racine, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const url = 'http://localhost:3105/?dev-local';

// Fixtures : une levure DDM 01.10.2026 (périmée), une à +10 j (30.11.2026 depuis le 20.11), un malt Pilsner sans EBC.
const fixtures = [
  { id: 's2-levure-perimee', ref: 'LEV-S2-1', name: 'Safale US-05 (test s2)', category: 'Levure', unit: 'sachet', currentStock: 2, minStock: 1, reorder: false,
    yeastLot: { productId: 'US-05', lotNumber: 'S2-A', expiresOn: '2026-10-01' } },
  { id: 's2-levure-dix-jours', ref: 'LEV-S2-2', name: 'Lalvin Kveik (test s2)', category: 'Levure', unit: 'sachet', currentStock: 1, minStock: 1, reorder: false,
    yeastLot: { productId: 'KVEIK', lotNumber: 'S2-B', expiresOn: '2026-11-30' } },
  { id: 's2-malt-pilsner', ref: 'MAL-S2-1', name: 'Pilsner Malz', category: 'Malt', unit: 'kg', currentStock: 25, minStock: 10, reorder: false },
];

// Clique le bouton de navigation dont le texte est exactement ce libellé (évite les titres homonymes).
const aller = (page, libelle) => page.evaluate((l) => {
  const el = [...document.querySelectorAll('button,a,[role=tab]')].find((e) => e.textContent.trim() === l && e.offsetParent !== null);
  if (!el) throw new Error(`onglet introuvable : ${l}`);
  el.click();
}, libelle);

const captures = [];
async function prendre(page, nom, largeur) {
  await calme(page, 700);
  const infos = await page.evaluate(() => {
    const texte = document.body.innerText;
    const lignes = texte.split('\n').filter((l) => /Levure|Lalvin|Safale|Kveik|Pilsner|Périm|Périme|EBC/.test(l));
    return { lignes, debordement: document.documentElement.scrollWidth - document.documentElement.clientWidth, dataTheme: document.documentElement.getAttribute('data-theme') };
  });
  await page.screenshot({ path: path.join(dossier, `${nom}.png`), fullPage: true });
  captures.push({ nom, ...infos });
}

async function scenario(page, prefixe, theme) {
  await page.evaluate((t) => { if (t === 'cave') document.documentElement.setAttribute('data-theme', 'cave'); else document.documentElement.removeAttribute('data-theme'); }, theme);
  await aller(page, 'Bord');
  const l = page.viewport().width;
  await prendre(page, `bord-${theme}-${l}`, l);
  await aller(page, 'Stocks');
  await prendre(page, `stocks-malts-${theme}-${l}`, l);
}

const sorties = [];
for (const [largeur, hauteur, mobile, echelle, prefixe] of [[390, 844, true, 2, ''], [1280, 800, false, 1, '']]) {
  const { browser, page, journal } = await ouvrir({ largeur, hauteur, mobile, echelle });
  try {
    await page.goto(url, { waitUntil: 'networkidle0' });
    await calme(page, 1500);
    const seme = await page.evaluate(async (items) => {
      const m = await import('/src/services/firestoreRepo.ts');
      items.forEach((it) => m.FirestoreRepo.put('stockItems', it.id, it));
      return items.length;
    }, fixtures);
    await calme(page, 1000);
    sorties.push({ largeur, seme });
    await scenario(page, prefixe, 'clair');
    await scenario(page, prefixe, 'cave');
    sorties.push({ largeur, erreurs: journal.erreurs.length, bloquees: journal.bloquees.length });
  } finally {
    await browser.close();
  }
}
console.log(JSON.stringify({ sorties, captures }, null, 1));
