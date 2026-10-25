// Reconnaissance avant action : où est-on, que voit-on, quels contrôles existent, que dit la console ?
// Usage : node .claude/skills/webapp-testing/examples/reconnaissance.mjs <url> [dossier-de-sortie] [largeur] [hauteur]
// Écrit reconnaissance.png (page entière), dom.html, controles.json, console.json dans le dossier (défaut : os.tmpdir()).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ouvrir, calme } from './_lanceur.mjs';

const [url, sortie = path.join(os.tmpdir(), 'webapp-testing'), largeur = '390', hauteur = '844'] = process.argv.slice(2);
if (!url) { console.error('Usage : reconnaissance.mjs <url> [dossier] [largeur] [hauteur]'); process.exit(2); }
fs.mkdirSync(sortie, { recursive: true });

const { browser, page, journal } = await ouvrir({ largeur: Number(largeur), hauteur: Number(hauteur) });
try {
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 }); // CRITIQUE : réseau calme avant d'inspecter le DOM
  await calme(page);
  await page.screenshot({ path: path.join(sortie, 'reconnaissance.png'), fullPage: true });
  fs.writeFileSync(path.join(sortie, 'dom.html'), await page.content());

  const controles = await page.evaluate(() => {
    const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    const nom = (el) => (el.getAttribute('aria-label') || el.innerText || el.value || el.title || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    const data = (el) => Object.fromEntries([...el.attributes].filter((a) => a.name.startsWith('data-')).map((a) => [a.name, a.value]));
    return {
      titre: document.title,
      url: location.href,
      titres: [...document.querySelectorAll('h1,h2,h3')].filter(visible).map((h) => `${h.tagName} ${nom(h)}`),
      boutons: [...document.querySelectorAll('button,[role=button],[role=tab]')].filter(visible).map((b) => ({ role: b.getAttribute('role') || 'button', texte: nom(b), data: data(b) })),
      liens: [...document.querySelectorAll('a[href]')].filter(visible).map((a) => ({ texte: nom(a), href: a.getAttribute('href') })),
      champs: [...document.querySelectorAll('input,textarea,select')].filter(visible).map((i) => ({ type: i.type, nom: i.name || i.id || nom(i) || '[sans nom]' })),
      debordementHorizontal: document.documentElement.scrollWidth > innerWidth
    };
  });
  fs.writeFileSync(path.join(sortie, 'controles.json'), JSON.stringify(controles, null, 2));
  fs.writeFileSync(path.join(sortie, 'console.json'), JSON.stringify(journal, null, 2));

  console.log(`Page : ${controles.titre} (${controles.url})`);
  console.log(`${controles.titres.length} titres, ${controles.boutons.length} boutons, ${controles.liens.length} liens, ${controles.champs.length} champs`);
  for (const b of controles.boutons.slice(0, 25)) console.log(`  [${b.role}] ${b.texte || '(sans texte)'}`);
  console.log(`Console : ${journal.console.length} messages, ${journal.erreurs.length} erreurs de page, ${journal.echecsReseau.length} requêtes échouées`);
  console.log(`Fichiers dans ${sortie} — ouvrir reconnaissance.png en image avant toute conclusion.`);
} finally {
  await browser.close();
}
