#!/usr/bin/env node
// Voie r4-port-d (D307, son choix D) : l'écran « Nouvelle dépense » servi sur deux états d'aperçu SIMULÉS, à 390 tactile et à 1280, thème clair et sombre :
//   - `renovation` : « Brico Fictif SA » ; la bande Rénovation avec ses sous-groupes repliés (au repos), un groupe ouvert par un toucher, une ligne à vérifier qui ouvre son groupe d'office ;
//   - `familles`   : la pièce de toutes les familles, qui ne doit pas bouger (aucune bande n'a deux sous-familles : aucune ligne de sous-famille).
// Chaque capture de l'app est écrite côte à côte avec la vue D de sa maquette (`choix-sousfamilles/img/d-*.png`). Mesures : hauteur de la ligne de sous-famille, taille du texte
// (à comparer à la maquette ouverte dans le même Chrome), colonnes de quantité et de montant alignées sur l'en-tête de bande (≤ 2 px), aucune erreur de console, aucune requête hors localhost.
// La ligne à vérifier : l'aperçu `renovation` n'en porte aucune ; elle se fabrique par le geste du brasseur (un libellé renommé qui change de sous-famille, son montant effacé), jamais par une écriture.
// Fixtures seulement, aucun Gemini, aucune écriture. Usage (le serveur tourne dans la copie isolée ; depuis la racine du dépôt) :
//   node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "node scripts/with_server.mjs --server \"npm run dev -- --port 3463 --strictPort\" --port 3463 --env VITE_FIREBASE_API_KEY=fake -- node <chemin absolu de ce script> --sortie=<dossier>"
// Sortie : « PORT-D OK » (code 0) ou « PORT-D ECHEC n » et la liste. Les fichiers vont dans --sortie (défaut : captures/ à côté de ce script).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(process.cwd());
const require = createRequire(path.join(RACINE, 'package.json'));
const puppeteer = require('puppeteer-core');
const argv = process.argv.slice(2);
const valeur = (n) => argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const port = (process.env.WITH_SERVER_PORTS ?? '').split(',')[0];
const ADRESSE = (valeur('url') ?? `http://localhost:${port}`).replace(/\/$/, '');
const SORTIE = path.resolve(valeur('sortie') ?? path.join(import.meta.dirname, 'captures'));
const MAQUETTES = path.resolve(import.meta.dirname, '..', '..', 'choix-sousfamilles');
const PLIER = path.resolve(import.meta.dirname, '..', '..', 'choix-plier'); // D311 : sa maquette E (e-plie, e-deplie, e-mele, e-plie-sombre)
fs.mkdirSync(SORTIE, { recursive: true });
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const MODES = [
  { id: 'tactile390', l: 390, h: 844, tactile: true, echelle: 2 },
  { id: 'pc1280', l: 1280, h: 800, tactile: false, echelle: 1 },
];
const local = (u) => ['http://localhost', 'http://127.0.0.1', 'ws://localhost', 'ws://127.0.0.1', 'data:', 'blob:', 'about:', 'file:'].some((d) => u.startsWith(d));
const POLICES = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const fautes = [], infos = [], horsLocal = [];
const noter = (ok, texte) => { console.error((ok ? 'ok ' : 'ECHEC ') + texte.slice(0, 240)); infos.push(`${ok ? 'OK   ' : 'ECHEC'} ${texte}`); if (!ok) fautes.push(texte); };
const ONZE = ['Malts', 'Houblons', 'Levures', 'Sucres', 'Additifs', 'Matériel de brassage', 'Emballage', 'Nettoyage', 'Consommables', 'Services', 'Autres'];

async function ouvrirApp(nav, mode, etat) {
  const p = await nav.newPage();
  await p.setViewport({ width: mode.l, height: mode.h, isMobile: mode.tactile, hasTouch: mode.tactile, deviceScaleFactor: mode.echelle });
  p.erreurs = [];
  p.on('pageerror', (e) => p.erreurs.push('PAGE ' + e.message.slice(0, 160)));
  p.on('console', (m) => { if (m.type() === 'error' && !/ERR_BLOCKED_BY_CLIENT|favicon|Failed to load resource/.test(m.text())) p.erreurs.push(m.text().slice(0, 160)); });
  await p.setRequestInterception(true);
  p.on('request', (r) => { if (local(r.url())) r.continue(); else { if (!POLICES.test(r.url())) horsLocal.push(r.url().slice(0, 90)); r.abort('blockedbyclient'); } });
  p.setDefaultNavigationTimeout(150000);
  for (let essai = 1; essai <= 3; essai++) {
    try {
      await p.goto(`${ADRESSE}/?dev-local&depense=${etat}`, { waitUntil: 'domcontentloaded' });
      await p.waitForFunction(() => document.querySelectorAll('button').length > 3, { timeout: 150000 });
      await dormir(800);
      await p.click('[aria-label="Actions rapides"]');
      await p.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Entrer une facture/.test(b.textContent)), { timeout: 20000 });
      await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Entrer une facture/.test(b.textContent)).click());
      await p.waitForFunction((e) => document.body.dataset.apercu === e, { timeout: 45000 }, etat);
      break;
    } catch (e) {
      if (essai === 3) { await p.screenshot({ path: path.join(SORTIE, `echec-ouverture-${mode.id}-${etat}.png`) }); throw new Error(`l’écran ne s’est pas ouvert : ${String(e.message).slice(0, 100)} · ${p.erreurs.join(' / ')}`); }
    }
  }
  await dormir(600);
  return p;
}
const theme = (p, t) => p.evaluate((x) => { document.documentElement.dataset.theme = x; }, t).then(() => dormir(250));
const defiler = (p, cle) => p.evaluate((k) => { document.querySelector(`[data-dp-bande="${k}"]`).scrollIntoView({ block: 'start' }); }, cle).then(() => dormir(350));
const debordement = (p) => p.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return Math.max(document.documentElement.scrollWidth - innerWidth, (d?.scrollWidth ?? 0) - (d?.clientWidth ?? 0)); });
const toucher = async (p, mode, selecteur) => { const h = await p.$(selecteur); if (!h) throw new Error(`introuvable : ${selecteur}`); await h.evaluate((e) => e.scrollIntoView({ block: 'center' })); await dormir(200); if (mode.tactile) await h.tap(); else await h.click(); await dormir(350); };

/** Une capture de l'app, écrite côte à côte avec la vue D de sa maquette : `<mode>-<nom>-<theme>.png` (l'app seule) et `cote-…` (app | maquette). */
let pageCote = null;
const uri = (f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
async function capturer(nav, p, mode, nom, th, maquette, legende) {
  await p.bringToFront(); await dormir(150);
  const seule = path.join(SORTIE, `${mode.id}-${nom}-${th}.png`);
  await p.screenshot({ path: seule });
  const maq = maquette.startsWith('plier/') ? path.join(PLIER, 'img', maquette.slice(6)) : path.join(MAQUETTES, 'img', maquette);
  pageCote ??= await nav.newPage();
  await pageCote.setViewport({ width: 2000, height: 900, deviceScaleFactor: 1 });
  const fond = th === 'cave' ? '#1c1a17' : '#ddd';
  await pageCote.setContent(`<body style="margin:0;padding:12px;background:${fond};font:14px sans-serif;color:${th === 'cave' ? '#eee' : '#222'}"><div style="display:flex;gap:16px;align-items:flex-start">
    <figure style="margin:0"><figcaption style="margin-bottom:6px"><b>L’app</b> · ${mode.id} · ${th} · ${nom}</figcaption><img id="a" src="${uri(seule)}" style="display:block;border:1px solid #888"></figure>
    <figure style="margin:0"><figcaption style="margin-bottom:6px"><b>Sa maquette D</b> · img/${maquette} · ${legende}</figcaption><img id="b" src="${uri(maq)}" style="display:block;border:1px solid #888"></figure></div></body>`);
  await pageCote.evaluate(() => Promise.all([...document.images].map((i) => i.decode())));
  // Largeur de l'app à son échelle (1280 : 1 ; 390 : ×2 → 780) ; la maquette, à son échelle native (×2 = 780).
  const dim = await pageCote.evaluate(() => ({ w: document.body.scrollWidth, h: document.body.scrollHeight }));
  await pageCote.setViewport({ width: dim.w, height: dim.h, deviceScaleFactor: 1 });
  await pageCote.screenshot({ path: path.join(SORTIE, `cote-${mode.id}-${nom}-${th}.png`) });
}

// Les mesures d'une bande : lignes de sous-famille, colonnes alignées sur l'en-tête.
const mesurer = (p, cle) => p.evaluate((k) => {
  const b = document.querySelector(`[data-dp-bande="${k}"]`);
  const e = b.querySelector('[data-dp-bande-entete]'), qe = e.querySelector('[data-dp-sous-qte]').getBoundingClientRect(), me = e.querySelector('[data-dp-sous-montant]').getBoundingClientRect();
  const lignes = [...b.querySelectorAll('[data-dp-sg-ligne]')].map((l) => {
    const r = l.getBoundingClientRect(), q = l.querySelector('[data-dp-sg-qte]'), m = l.querySelector('[data-dp-sg-montant]'), n = l.querySelector('span:nth-child(2)'), ch = l.querySelector('[data-dp-sg-compte]');
    const rowh = b.querySelector('article[data-dp-ligne]:not([hidden])')?.getBoundingClientRect().height ?? 0;
    return { nom: n.textContent, h: r.height, rangeeH: rowh, taille: getComputedStyle(n).fontSize, tailleQte: getComputedStyle(q).fontSize, poidsQte: getComputedStyle(q).fontWeight, tailleMontant: getComputedStyle(m).fontSize,
      ecartQte: Math.abs(q.getBoundingClientRect().right - qe.right), ecartMontant: Math.abs(m.getBoundingClientRect().right - me.right), compte: ch.textContent,
      ouvert: l.getAttribute('aria-expanded'), largeur: r.width, ecranL: innerWidth, deborde: r.right > innerWidth + 1, tag: l.tagName, focus: getComputedStyle(l).outlineStyle };
  });
  return { entete: { h: e.getBoundingClientRect().height }, lignes };
}, cle);
const visibles = (p, cle) => p.evaluate((k) => [...document.querySelectorAll(`[data-dp-bande="${k}"] article[data-dp-ligne]`)].filter((a) => !a.closest('[hidden]')).map((a) => a.querySelector('[data-dp-nom]')?.textContent), cle);
const etats = (p, cle) => p.evaluate((k) => [...document.querySelectorAll(`[data-dp-bande="${k}"] [data-dp-sg-ligne]`)].map((l) => `${l.querySelector('span:nth-child(2)').textContent}=${l.getAttribute('aria-expanded')}`), cle);

// La maquette D ouverte dans le même Chrome : ses mesures de référence (hauteur de la ligne de sous-famille, texte).
async function mesurerMaquette(nav) {
  const p = await nav.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await p.setRequestInterception(true);
  p.on('request', (r) => { if (r.url().startsWith('file:')) r.continue(); else r.abort('blockedbyclient'); });
  await p.goto(pathToFileURL(path.join(MAQUETTES, 'maquettes', 'd-renovation.html')).href, { waitUntil: 'load' }).catch(() => {});
  await dormir(300);
  const m = await p.evaluate(() => { const l = [...document.querySelectorAll('[data-sf-sous-groupe]')].at(-1), n = l.children[1], q = l.querySelector('[data-sf-sous-qte]'), mo = l.lastElementChild;
    const e = document.querySelector('[data-dp-bande-entete]'), qe = e.querySelector('[data-dp-sous-qte]').getBoundingClientRect(), me = e.querySelector('[data-dp-sous-montant]').getBoundingClientRect();
    return { h: l.getBoundingClientRect().height, taille: getComputedStyle(n).fontSize, tailleQte: getComputedStyle(q).fontSize, tailleMontant: getComputedStyle(mo).fontSize, ecartQte: Math.abs(q.getBoundingClientRect().right - qe.right), ecartMontant: Math.abs(mo.getBoundingClientRect().right - me.right) }; });
  await p.close();
  return m;
}

const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', protocolTimeout: 240000, args: ['--no-sandbox'] });
try {
  const maq = await mesurerMaquette(nav);
  noter(maq.h > 20, `MAQUETTE D (mesurée dans ce Chrome) : ligne de sous-famille ${maq.h} px, nom ${maq.taille}, quantité ${maq.tailleQte}, montant ${maq.tailleMontant}, écarts de colonnes ${maq.ecartQte.toFixed(1)} / ${maq.ecartMontant.toFixed(1)} px`);
  for (const mode of MODES) {
    const e = (s) => `${mode.id} · ${s}`;
    // ——— `familles` : inchangé ———
    let app = null;
    try {
      app = await ouvrirApp(nav, mode, 'familles');
      await theme(app, 'clair');
      const noms = await app.evaluate(() => [...document.querySelectorAll('[data-dp-bande]')].map((b) => b.querySelector('strong').textContent));
      noter(noms.join('|') === ONZE.join('|'), e(`FAMILLES : les onze bandes, dans l’ordre (${noms.length})`));
      const nSg = await app.evaluate(() => document.querySelectorAll('[data-dp-sg-ligne]').length);
      noter(nSg === 0, e(`FAMILLES : aucune ligne de sous-famille (aucune bande n’a deux sous-familles) : ${nSg}`));
      const masquees = await app.evaluate(() => [...document.querySelectorAll('article[data-dp-ligne]')].filter((a) => a.closest('[hidden]')).length);
      noter(masquees === 0, e(`FAMILLES : toutes les rangées sont visibles, comme avant (${masquees} cachées)`));
      noter((await debordement(app)) <= 1, e(`FAMILLES aucun débordement horizontal (${await debordement(app)} px)`));
      await app.evaluate(() => { document.querySelector('.dp-p3c-corps').scrollTop = 0; }); await dormir(300);
      await capturer(nav, app, mode, 'familles-repos', 'clair', 'd-repos.png', 'au repos (sa pièce n’a pas les mêmes bandes : seule la hauteur des rangées se compare)');
      await theme(app, 'cave');
      await capturer(nav, app, mode, 'familles-repos', 'cave', 'd-renovation-sombre.png', 'sombre (même remarque)');
      noter(app.erreurs.length === 0, e(`FAMILLES aucune erreur de console${app.erreurs.length ? ' (' + app.erreurs.join(' / ') + ')' : ''}`));
    } catch (err) { noter(false, e(`familles : ${String(err.message).slice(0, 200)}`)); }
    finally { await app?.close().catch(() => {}); }

    // ——— `renovation` ———
    app = null;
    try {
      app = await ouvrirApp(nav, mode, 'renovation');
      await theme(app, 'clair');
      const ren = await app.evaluate(() => { const b = document.querySelector('[data-dp-bande="renovation"]'); return { compte: b.querySelector('[data-dp-bande-entete] span').textContent, montant: b.querySelector('[data-dp-sous-montant]').textContent, qte: b.querySelector('[data-dp-sous-qte]').textContent, filet: getComputedStyle(b.querySelector('article')).borderLeftColor }; });
      noter(ren.compte === '16' && /^\d/.test(ren.montant), e(`RENOVATION : l’en-tête de bande est celui d’aujourd’hui (${ren.compte} lignes, ${ren.qte}, ${ren.montant})`));
      // Au repos : une ligne par sous-famille (au moins deux lignes), tout replié, aucune rangée de ces groupes visible.
      const avant = await etats(app, 'renovation');
      noter(avant.length >= 3 && avant.every((x) => x.endsWith('=false')), e(`RENOVATION au repos : ${avant.length} lignes de sous-famille, toutes repliées (${avant.join(', ')})`));
      const vis0 = await visibles(app, 'renovation');
      noter(vis0.length === 3 && vis0.includes('Mitigeur lavabo chromé') && vis0.includes('Gants nitrile M') && vis0.includes('Étagère murale bois 80 cm'),
        e(`RENOVATION au repos : seules les trois rangées de sous-groupes d’une ligne se voient, sans chevron ni ligne (${vis0.join(' | ')})`));
      const m = await mesurer(app, 'renovation');
      for (const l of m.lignes) {
        noter(l.tag === 'BUTTON' && l.h >= 27.5 && l.h <= 29, e(`RENOVATION ${l.nom} : bouton de ${l.h} px de haut (maquette ${maq.h} px ; une rangée ${l.rangeeH} px)`));
        noter(l.taille === maq.taille && l.tailleQte === maq.tailleQte && l.tailleMontant === maq.tailleMontant, e(`RENOVATION ${l.nom} : texte ${l.taille} / quantité ${l.tailleQte} gras ${l.poidsQte} / montant ${l.tailleMontant} (maquette ${maq.taille} / ${maq.tailleQte} / ${maq.tailleMontant})`));
        noter(l.ecartQte <= 2 && l.ecartMontant <= 2, e(`RENOVATION ${l.nom} : colonnes alignées sur l’en-tête de bande (quantité ${l.ecartQte.toFixed(1)} px, montant ${l.ecartMontant.toFixed(1)} px)`));
        noter(!l.deborde, e(`RENOVATION ${l.nom} : la ligne tient dans l’écran (${l.largeur} / ${l.ecranL})`));
      }
      noter((await debordement(app)) <= 1, e(`RENOVATION aucun débordement horizontal (${await debordement(app)} px)`));
      await app.evaluate(() => { document.querySelector('.dp-p3c-corps').scrollTop = 0; }); await dormir(300);
      await defiler(app, 'renovation');
      await capturer(nav, app, mode, 'renovation-repos', 'clair', 'd-repos.png', 'au repos : sous-familles repliées');


      // Un toucher sur « Peinture et sols » ouvre son groupe (comme sa vue d-renovation) ; ses rangées sont celles d’aujourd’hui.
      const peinture = '[data-dp-sg="Peinture et sols"] [data-dp-sg-ligne]';
      await toucher(app, mode, peinture);
      const ouvert = await etats(app, 'renovation');
      noter(ouvert[0] === 'Peinture et sols=true' && ouvert.slice(1).every((x) => x.endsWith('=false')), e(`RENOVATION : un toucher ouvre « Peinture et sols » seul (${ouvert.join(', ')})`));
      const vis1 = await visibles(app, 'renovation');
      noter(['Peinture murale blanche mate 10 L', 'Vitrificateur parquet satiné 2.5 L', 'Pinceau plat 50 mm', 'Fliesenkleber 5 kg', 'Ruban de masquage 50 m'].every((n) => vis1.includes(n)), e(`RENOVATION ouvert : ses cinq rangées apparaissent (${vis1.length} visibles)`));
      const ordreOuvert = await app.evaluate(() => [...document.querySelectorAll('[data-dp-bande="renovation"] > div:last-child > div, [data-dp-bande="renovation"] > div:last-child > article')].map((x) => x.getAttribute('data-dp-sg') ?? x.getAttribute('data-dp-ligne')));
      noter(ordreOuvert.length === 4 + 3 && ordreOuvert[0] === 'Peinture et sols', e(`RENOVATION : l’ordre des sous-groupes est celui de la Rénovation (${ordreOuvert.join(' > ')})`));
      await defiler(app, 'renovation');
      await capturer(nav, app, mode, 'renovation-ouvert', 'clair', 'd-renovation.png', 'Peinture et sols ouvert par un toucher');
      // Une rangée ouverte garde sa vraie rangée : son plateau s’ouvre.
      await toucher(app, mode, '[data-dp-bande="renovation"] [data-dp-sg="Peinture et sols"] article[data-dp-ligne] summary');
      noter(await app.evaluate(() => document.querySelector('[data-dp-bande="renovation"] [data-dp-sg="Peinture et sols"] article details').open), e('RENOVATION : toucher une rangée du groupe ouvert ouvre son plateau (la rangée est celle d’aujourd’hui)'));
      await toucher(app, mode, '[data-dp-bande="renovation"] [data-dp-sg="Peinture et sols"] article[data-dp-ligne] summary');
      // Clavier et lecteur d’écran : un bouton, aria-expanded, focus visible.
      const clavier = await app.evaluate(() => { const l = document.querySelector('[data-dp-sg="Outillage"] [data-dp-sg-ligne]'); l.focus(); return { actif: document.activeElement === l, tag: l.tagName, expanded: l.getAttribute('aria-expanded'), controls: l.getAttribute('aria-controls'), cible: !!document.getElementById(l.getAttribute('aria-controls')) }; });
      await app.keyboard.press('Enter'); await dormir(300);
      const apresEntree = await app.evaluate(() => document.querySelector('[data-dp-sg="Outillage"] [data-dp-sg-ligne]').getAttribute('aria-expanded'));
      await app.keyboard.press('Space'); await dormir(300);
      const apresEspace = await app.evaluate(() => document.querySelector('[data-dp-sg="Outillage"] [data-dp-sg-ligne]').getAttribute('aria-expanded'));
      noter(clavier.actif && clavier.tag === 'BUTTON' && clavier.expanded === 'false' && clavier.cible && apresEntree === 'true' && apresEspace === 'false', e(`RENOVATION clavier : bouton focalisable, aria-expanded ${clavier.expanded} → Entrée ${apresEntree} → Espace ${apresEspace}, aria-controls vers son corps`));
      const foc = await app.evaluate(() => { const l = document.querySelector('[data-dp-sg="Outillage"] [data-dp-sg-ligne]'); const c = getComputedStyle(l); return { style: c.outlineStyle, largeur: c.outlineWidth, couleur: c.outlineColor, visible: l.matches(':focus-visible') }; });
      noter(foc.visible && foc.style !== 'none' && parseFloat(foc.largeur) >= 2, e(`RENOVATION focus visible : contour ${foc.largeur} ${foc.style} ${foc.couleur}`));
      await capturer(nav, app, mode, 'renovation-focus', 'clair', 'd-repos.png', 'focus clavier sur la ligne « Outillage » (la maquette n’a pas d’état focus)');
      await app.evaluate(() => document.activeElement?.blur());
      // Les groupes se referment : retour au repos.
      await toucher(app, mode, peinture);
      noter((await etats(app, 'renovation')).every((x) => x.endsWith('=false')), e('RENOVATION : un second toucher referme le groupe (retour au repos)'));

      // Sombre : repos puis ouvert.
      await theme(app, 'cave');
      await defiler(app, 'renovation');
      await capturer(nav, app, mode, 'renovation-repos', 'cave', 'd-renovation-sombre.png', 'sombre (sa vue a Peinture et sols ouvert)');
      await toucher(app, mode, peinture); await defiler(app, 'renovation');
      await capturer(nav, app, mode, 'renovation-ouvert', 'cave', 'd-renovation-sombre.png', 'sombre, Peinture et sols ouvert');
      await toucher(app, mode, peinture);
      await theme(app, 'clair');

      // La ligne à vérifier ouvre son groupe d’office. Geste du brasseur : un libellé renommé change de sous-famille, son montant est effacé, son plateau refermé.
      const id = 'line-5';
      await toucher(app, mode, peinture);
      await toucher(app, mode, `[data-dp-ligne="${id}"] summary`);
      const champs = await app.evaluate((i) => {
        const a = document.querySelector(`[data-dp-ligne="${i}"]`);
        const pose = (el, v) => { Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
        const nom = a.querySelector('[aria-label^="Libellé ligne"]'), montant = a.querySelector('[aria-label^="Montant ligne"]');
        if (!nom || !montant) return { ok: false };
        pose(nom, 'Interrupteur double blanc'); return { ok: true };
      }, id);
      await dormir(500);
      let monte = false;
      if (champs.ok) {
        monte = await app.evaluate((i) => {
          const a = document.querySelector(`[data-dp-ligne="${i}"]`), montant = a.querySelector('[aria-label^="Montant ligne"]');
          if (!montant) return false;
          Object.getOwnPropertyDescriptor(Object.getPrototypeOf(montant), 'value').set.call(montant, ''); montant.dispatchEvent(new Event('input', { bubbles: true })); montant.dispatchEvent(new Event('change', { bubbles: true })); montant.blur();
          return true;
        }, id);
      }
      await dormir(600);
      noter(champs.ok && monte, e('RENOVATION : le libellé et le montant de la ligne 5 ont été modifiés au geste du brasseur'));
      // Replier le groupe de départ ; la ligne a changé de sous-famille et de groupe.
      const sgDe = await app.evaluate((i) => document.querySelector(`[data-dp-ligne="${i}"]`)?.closest('[data-dp-sg]')?.getAttribute('data-dp-sg') ?? '(aucun)', id);
      noter(sgDe === 'Électricité', e(`RENOVATION : la ligne renommée est passée dans le groupe « ${sgDe} »`));
      if (await app.evaluate((i) => document.querySelector(`[data-dp-ligne="${i}"] details`)?.open, id)) await toucher(app, mode, `[data-dp-ligne="${id}"] summary`);
      await toucher(app, mode, peinture); // referme Peinture et sols
      const av = await etats(app, 'renovation');
      noter(av.find((x) => x.startsWith('Électricité')) === 'Électricité=true' && av.filter((x) => x.endsWith('=true')).length === 1, e(`RENOVATION ligne à vérifier : son groupe s’est ouvert d’office, les autres restent repliés (${av.join(', ')})`));
      const niv = await app.evaluate((i) => { const a = document.querySelector(`[data-dp-ligne="${i}"]`); return { visible: !a.closest('[hidden]'), niveau: a.querySelector('[data-dp-montant]')?.getAttribute('data-dp-niveau'), qteSg: document.querySelector('[data-dp-sg="Électricité"] [data-dp-sg-montant]').textContent }; }, id);
      noter(niv.visible && niv.niveau === 'inconnu', e(`RENOVATION ligne à vérifier : sa rangée est visible, son montant rouge (${niv.niveau}) ; le groupe dit « ${niv.qteSg} » (jamais 0 : inconnu marqué « + ? »)`));
      noter(/\+ \?/.test(niv.qteSg), e(`RENOVATION : le sous-total du groupe marque le montant inconnu (« ${niv.qteSg} »)`));
      // M1 (critique r4) : la colonne des quantités ne bouge pas quand un montant est inconnu (« + ? ») : en-tête et lignes de sous-famille tombent sur la colonne des rangées.
      const col = await app.evaluate(() => {
        const b = document.querySelector('[data-dp-bande="renovation"]');
        const ref = [...b.querySelectorAll('article[data-dp-ligne] [data-dp-qte]')].filter((q) => !q.closest('[hidden]')).at(-1).getBoundingClientRect().right;
        const ecart = (el) => Math.abs(el.getBoundingClientRect().right - ref);
        return { ref, entete: ecart(b.querySelector('[data-dp-bande-entete] [data-dp-sous-qte]')), enteteMontant: b.querySelector('[data-dp-bande-entete] [data-dp-sous-montant]').textContent,
          lignes: [...b.querySelectorAll('[data-dp-sg-ligne]')].map((l) => ({ nom: l.querySelector('span:nth-child(2)').textContent, ecart: ecart(l.querySelector('[data-dp-sg-qte]')), montant: l.querySelector('[data-dp-sg-montant]').textContent })) };
      });
      noter(col.entete <= 2, e(`M1 colonne des quantités, en-tête de bande (« ${col.enteteMontant} ») : écart ${col.entete.toFixed(1)} px à la colonne des rangées`));
      for (const l of col.lignes) noter(l.ecart <= 2, e(`M1 colonne des quantités, ligne « ${l.nom} » (« ${l.montant} ») : écart ${l.ecart.toFixed(1)} px à la colonne des rangées`));
      await defiler(app, 'renovation');
      await capturer(nav, app, mode, 'renovation-averifier', 'clair', 'd-nettoyage.png', 'la ligne à vérifier ouvre son groupe (sa vue : Désinfectant, bande Nettoyage)');
      await theme(app, 'cave'); await defiler(app, 'renovation');
      await capturer(nav, app, mode, 'renovation-averifier', 'cave', 'd-nettoyage.png', 'sa vue existe en clair seulement');
      // D311 : « Plié » laisse ouvert le groupe à vérifier (sa page : « une ligne à vérifier garde son groupe ouvert, même tout plié »).
      await theme(app, 'clair');
      const presses = () => app.evaluate(() => [...document.querySelectorAll('[data-dp-plier] button')].map((b) => b.getAttribute('aria-pressed')).join('|'));
      await toucher(app, mode, '[data-dp-plier-bouton="deplie"]'); await toucher(app, mode, '[data-dp-plier-bouton="plie"]');
      const apresPlie = await etats(app, 'renovation');
      noter(apresPlie.filter((x) => x.endsWith('=true')).join() === 'Électricité=true' && (await presses()) === 'true|false', e(`SEGMENT « Plié » avec une ligne à vérifier : seul son groupe reste ouvert, « Plié » allumé (${apresPlie.join(', ')} ; ${await presses()})`));
      await defiler(app, 'renovation');
      await capturer(nav, app, mode, 'plier-averifier', 'clair', 'plier/e-plie.png', 'tout plié avec une ligne à vérifier : son groupe reste ouvert (sa vue : Désinfectant)');
      // Le brasseur peut le refermer : son choix prime (le segment n'est qu'un raccourci).
      await toucher(app, mode, '[data-dp-sg="Électricité"] [data-dp-sg-ligne]');
      noter((await etats(app, 'renovation')).every((x) => x.endsWith('=false')) && (await presses()) === 'false|false', e('RENOVATION : le brasseur referme le groupe à vérifier (son choix prime), état mêlé : aucun des deux allumé'));
      // « Y aller » : une erreur sur la ligne cachée rouvre son groupe, la cible est visible et a le focus.
      await app.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Confirmer/.test(b.textContent))?.click()); await dormir(900);
      const ya = await app.evaluate(() => {
        const a = document.activeElement, g = document.querySelector('[data-dp-sg="Électricité"]'), r = a?.getBoundingClientRect();
        return { ouvert: g?.querySelector('[data-dp-sg-ligne]').getAttribute('aria-expanded'), etiquette: a?.getAttribute('aria-label') ?? a?.tagName, cache: !!a?.closest('[hidden]'), dansGroupe: !!g?.contains(a), visible: !!r && r.width > 0 && r.top >= 0 && r.bottom <= innerHeight };
      });
      noter(ya.ouvert === 'true' && ya.dansGroupe && !ya.cache && ya.visible && /^Montant ligne/.test(ya.etiquette), e(`Y ALLER : une erreur sur une ligne d’un groupe replié rouvre son groupe (${ya.ouvert}), le focus est dans le champ « ${ya.etiquette} », visible (${ya.visible}), non caché (${!ya.cache})`));
      await defiler(app, 'renovation');
      await capturer(nav, app, mode, 'renovation-yaller', 'clair', 'd-nettoyage.png', 'y aller : le groupe replié s’est rouvert sur la ligne en erreur (pas de vue D pour ce geste)');
      await toucher(app, mode, '[data-dp-sg="Électricité"] [data-dp-sg-ligne]');
      noter((await etats(app, 'renovation')).every((x) => x.endsWith('=false')), e('RENOVATION : le groupe rouvert par « y aller » se referme d’un toucher'));
      noter(app.erreurs.length === 0, e(`RENOVATION aucune erreur de console${app.erreurs.length ? ' (' + app.erreurs.join(' / ') + ')' : ''}`));
      // Papier : aucune ligne de sous-famille.
      await app.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Papier')?.click()); await dormir(400);
      noter(await app.evaluate(() => document.querySelectorAll('[data-dp-sg-ligne]').length === 0 && document.querySelectorAll('[data-dp-bande="papier"] article[data-dp-ligne]').length > 10), e('RENOVATION : la vue « Papier » ne change pas (aucune ligne de sous-famille)'));
    } catch (err) { noter(false, e(`renovation : ${String(err.message).slice(0, 120)} · ${String(err.stack).split(/\r?\n/).slice(1, 4).join(' ').slice(0, 260)}`)); }
    finally { await app?.close().catch(() => {}); }

    // ——— `renovation`, seconde ouverture : le segment « Plié | Déplié » (D311), sans le cas de la ligne à vérifier (un groupe jamais plié à la main) ———
    app = null;
    try {
      app = await ouvrirApp(nav, mode, 'renovation');
      await theme(app, 'clair');
      await app.evaluate(() => { document.querySelector('.dp-p3c-corps').scrollTop = 0; }); await dormir(300);
      await defiler(app, 'renovation');
      // ——— D311, son choix E : le segment « Plié | Déplié » dans l'en-tête de la feuille ———
      const segment = () => app.evaluate(() => {
        const s = document.querySelector('[data-dp-plier]'); if (!s) return null;
        const bs = [...s.querySelectorAll('button')], r = s.getBoundingClientRect(), h = s.closest('header').getBoundingClientRect();
        return { textes: bs.map((b) => b.textContent), presses: bs.map((b) => b.getAttribute('aria-pressed')), hauteurs: bs.map((b) => b.getBoundingClientRect().height), largeurs: bs.map((b) => b.getBoundingClientRect().width), role: s.getAttribute('role'), label: s.getAttribute('aria-label'),
          dansEntete: r.top >= h.top - 0.5 && r.bottom <= h.bottom + 0.5, hautEntete: h.height, tailleTexte: getComputedStyle(bs[0]).fontSize };
      });
      const s0 = await segment();
      noter(!!s0 && s0.textes.join('|') === 'Plié|Déplié' && s0.role === 'group' && s0.label === 'Sous-groupes', e(`SEGMENT : « Plié | Déplié » dans l’en-tête de la feuille (${JSON.stringify(s0?.textes)}, en-tête de ${s0?.hautEntete} px)`));
      noter(!!s0 && s0.presses.join('|') === 'true|false', e(`SEGMENT au repos d’une lecture : « Plié » allumé, « Déplié » éteint (aria-pressed ${s0?.presses.join(' / ')})`));
      noter(!!s0 && s0.hauteurs.every((x) => x >= 27.5 && x <= 29) && s0.dansEntete && s0.tailleTexte === '14px', e(`SEGMENT : boutons de ${s0?.hauteurs.map((x) => x.toFixed(1)).join(' / ')} px (maquette 28), texte ${s0?.tailleTexte}, dans l’en-tête : ${s0?.dansEntete}`));
      // Le titre le plus long que la feuille affiche (« Acheter du matériel »), puis hors ligne (le badge « hors ligne » s'ajoute) : rien ne se chevauche, aucun passage à la ligne.
      const titres = [['Nouvelle dépense', false], ['Acheter du matériel', false], ['Acheter du matériel', true]];
      const original = await app.evaluate(() => document.querySelector('header h2').textContent);
      for (const [titre, hors] of titres) {
        await app.setOfflineMode(hors); await app.evaluate((t) => { document.querySelector('header h2').textContent = t; }, titre); await dormir(500);
        const m = await app.evaluate(() => {
          const hd = document.querySelector('[data-dp-plier]').closest('header'), kids = [...hd.children].filter((c) => c.getBoundingClientRect().width > 0), h2 = hd.querySelector('h2');
          const rs = kids.map((c) => ({ c: c.tagName + (c.dataset.dpPlier !== undefined ? '[segment]' : c.dataset.dp ?? ''), l: c.getBoundingClientRect().left, r: c.getBoundingClientRect().right })).sort((a, b) => a.l - b.l);
          const chevauche = rs.some((x, i) => i > 0 && x.l < rs[i - 1].r - 0.5);
          return { chevauche, titreH: h2.getBoundingClientRect().height, tronque: h2.scrollWidth > h2.clientWidth + 1, titreL: Math.round(h2.getBoundingClientRect().width), badge: !!hd.querySelector('[data-dp="hors-ligne"]'), debord: hd.scrollWidth > hd.clientWidth + 1, ordre: rs.map((x) => x.c).join(' ') };
        });
        noter(!m.chevauche && m.titreH <= 26 && !m.debord, e(`SEGMENT en-tête « ${titre} »${hors ? ' + hors ligne' : ''} : aucun chevauchement, titre sur une ligne (${m.titreH} px de haut, ${m.titreL} px de large), badge ${m.badge}, tronqué ${m.tronque} [${m.ordre}]`));
        if (!hors) noter(!m.tronque, e(`SEGMENT en-tête « ${titre} » : le titre n’est pas tronqué (hors ligne : à part)`));
      }
      await app.setOfflineMode(false); await app.evaluate((t) => { document.querySelector('header h2').textContent = t; }, original); await dormir(300);
      // Les gestes : « Déplié » ouvre tout, « Plié » replie tout, un toucher fait l'état mêlé, rien n'est figé.
      const presses = () => app.evaluate(() => [...document.querySelectorAll('[data-dp-plier] button')].map((b) => b.getAttribute('aria-pressed')).join('|'));
      await toucher(app, mode, '[data-dp-plier-bouton="deplie"]');
      noter((await etats(app, 'renovation')).every((x) => x.endsWith('=true')) && (await presses()) === 'false|true', e(`SEGMENT : « Déplié » ouvre les quatre groupes et s’allume seul (${await presses()})`));
      await defiler(app, 'renovation');
      await capturer(nav, app, mode, 'plier-deplie', 'clair', 'plier/e-deplie.png', 'tout déplié : le segment « Déplié » allumé');
      await toucher(app, mode, '[data-dp-plier-bouton="plie"]');
      noter((await etats(app, 'renovation')).every((x) => x.endsWith('=false')) && (await presses()) === 'true|false', e(`SEGMENT : « Plié » replie tout et s’allume seul (${await presses()})`));
      await toucher(app, mode, '[data-dp-sg="Peinture et sols"] [data-dp-sg-ligne]');
      noter((await presses()) === 'false|false', e(`SEGMENT : un toucher après « Plié » ouvre un groupe et éteint « Plié » : état mêlé (${await presses()})`));
      await defiler(app, 'renovation');
      await capturer(nav, app, mode, 'plier-mele', 'clair', 'plier/e-mele.png', 'état mêlé : un groupe ouvert à la main, aucun des deux allumé');
      await toucher(app, mode, '[data-dp-sg="Peinture et sols"] [data-dp-sg-ligne]');
      noter((await presses()) === 'true|false', e(`SEGMENT : refermé, l’état redevient « Plié » (calculé sur les groupes, jamais gardé : ${await presses()})`));
      await toucher(app, mode, '[data-dp-plier-bouton="deplie"]'); await toucher(app, mode, '[data-dp-sg="Outillage"] [data-dp-sg-ligne]');
      noter((await etats(app, 'renovation')).find((x) => x.startsWith('Outillage')) === 'Outillage=false' && (await presses()) === 'false|false', e(`SEGMENT : « Déplié » puis un toucher replie un groupe : chaque groupe reste libre (${await presses()})`));
      await toucher(app, mode, '[data-dp-plier-bouton="plie"]');
      await defiler(app, 'renovation');
      await theme(app, 'cave');
      await defiler(app, 'renovation');
      await capturer(nav, app, mode, 'plier-repos', 'cave', 'plier/e-plie-sombre.png', 'tout plié, sombre : « Plié » allumé');
      noter(app.erreurs.length === 0, e(`SEGMENT aucune erreur de console${app.erreurs.length ? ' (' + app.erreurs.join(' / ') + ')' : ''}`));
    } catch (err) { noter(false, e(`segment : ${String(err.message).slice(0, 120)} · ${String(err.stack).split(/\r?\n/).slice(1, 3).join(' ').slice(0, 200)}`)); }
    finally { await app?.close().catch(() => {}); }
  }
} finally { await pageCote?.close().catch(() => {}); await nav.close(); }
noter(horsLocal.length === 0, `aucune requête hors localhost${horsLocal.length ? ' : ' + [...new Set(horsLocal)].slice(0, 4).join(', ') : ''}`);
fs.writeFileSync(path.join(SORTIE, 'rapport.txt'), infos.join('\n') + '\n');
console.log(fautes.length ? `PORT-D ECHEC ${fautes.length}\n${fautes.map((f) => '- ' + f).join('\n')}` : 'PORT-D OK');
process.exit(fautes.length ? 1 : 0);
