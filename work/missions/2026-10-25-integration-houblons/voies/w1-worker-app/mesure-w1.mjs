// w1 : la préchauffe de Suggérer dans l'app, fil principal contre worker, dans Chrome, processeur ×4 (méthode de e6/longtask.mjs, étendue).
// Usage (racine) : node scripts/with_server.mjs --server "npm run dev -- --port 5293 --strictPort" --port 5293 --env VITE_HOP_V4=on -- node <ce fichier> --client=worker|immediat [--cpu=4] [--essais=3] [--ouvrir=1]
//   --client=immediat : `?calcul=immediat`, le fil principal (le comportement d'avant w1, même code) ; --client=worker : le worker de l'app (défaut de l'app).
// Mesures, pendant la préchauffe (repos libéré à ×4, comme e6) :
//   - appelMs : durée de l'appel `calcul().prechauffer(...)` rendu au fil principal (bloc d'un seul tenant si le calcul y est fait) ; resoluMs : jusqu'à la réponse gardée ;
//   - tâches longues (> 50 ms) : API « longtask » ET battement (setInterval 4 ms : l'écart maximal entre deux battements = le plus long blocage du fil principal) ;
//   - touchers : délai d'un toucher (heure du gestionnaire − heure de l'événement), un toucher neutre toutes les 25 ms.
// Puis, avec --ouvrir=1 : le toucher sur « Suggérer » après la préchauffe, jusqu'à la première ligne de la liste (data-role="ligne-houblon"), et ses blocages.
// Aucune donnée réelle : requêtes hors de cette machine coupées, stockage du banc local.
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const arg = (n, d) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? d;
const client = arg('client', 'worker');
const cpu = Number(arg('cpu', '4'));
const essais = Number(arg('essais', '3'));
const ouvrir = arg('ouvrir', '1') === '1';
const visee = arg("visee", "0") === "1"; // pose une visée avant d ouvrir Suggérer (calcul réel)
const sansChauffe = arg("sans-chauffe", "0") === "1"; // témoin : la requête de préchauffe n est pas envoyée au worker (ce qui reste de blocage ne vient pas d elle)
const sortie = path.resolve(arg('sortie', path.join(import.meta.dirname, 'mesures')));
fs.mkdirSync(sortie, { recursive: true });
const port = (process.env.WITH_SERVER_PORTS ?? '5293').split(',')[0];
const CHROME = process.env.CHROME_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const mediane = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };

const un = async (n) => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE localhost, EXCLUDE 127.0.0.1'] });
  const page = await browser.newPage();
  const echecs = [];
  const journal = [];
  try {
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    page.setDefaultNavigationTimeout(180000);
    page.on('console', (m) => { const t = m.text(); if (/\[w1\]|worker|Worker/.test(t)) journal.push(t.slice(0, 200)); });
    page.on('pageerror', (e) => journal.push('pageerror: ' + String(e).slice(0, 200)));
    // Aucune interception de requêtes : avec puppeteer, elle bloque le chargement du worker (diagnostic w1, debug-worker.mjs --libre). Les hôtes hors de cette machine sont coupés par Chrome.
    await page.evaluateOnNewDocument((sansChauffe) => {
      const natif = window.requestIdleCallback?.bind(window);
      window.__tenir = true; window.__file = []; window.__lt = []; window.__touchers = []; window.__battements = []; window.__ligne = null;
      window.__durees = []; window.__envoiDans = null; window.__chauffe = null; window.__courant = -1;
      window.requestIdleCallback = (f, o) => { if (window.__tenir) { window.__file.push(f); return window.__file.length; } return natif ? natif(f, o) : window.setTimeout(f, 1); };
      // Chaque rappel du repos est chronométré : celui de la préchauffe est le seul qui envoie « prechauffer » au worker (ou, sur le fil principal, le plus long).
      window.__relacher = () => {
        window.__tenir = false; const q = window.__file.splice(0);
        q.forEach((f, i) => { window.__courant = i; const d = performance.now(); try { f(); } catch { /* un rappel qui échoue ne change pas la mesure */ } window.__durees.push(performance.now() - d); });
        window.__courant = -1; return q.length;
      };
      // Le worker de l'app : l'envoi de la préchauffe et l'arrivée de sa réponse (le même identifiant), horodatés.
      const Natif = window.Worker;
      if (Natif) window.Worker = class extends Natif {
        constructor(...a) {
          super(...a);
          this.addEventListener('message', (e) => { const c = window.__chauffe; if (c && e.data && e.data.id === c.id) { c.resoluMs = performance.now() - c.debut; c.fin = performance.now(); } });
        }
        postMessage(m, ...r) {
          if (sansChauffe && m && m.type === 'prechauffer') { window.__retenues = (window.__retenues ?? 0) + 1; return undefined; }
          if (m && m.type === 'prechauffer' && m.nom === 'proposerRapide' && !window.__chauffe) { window.__chauffe = { id: m.id, debut: performance.now(), dansRappel: window.__courant }; }
          // Le coût d'un envoi sur le fil principal (la copie structurée est faite par l'appelant) : surtout le message « donnees » qui porte le catalogue complet.
          const d = performance.now();
          const rendu = super.postMessage(m, ...r);
          (window.__envois ??= []).push({ type: m && m.type, nom: m && m.nom, t: d, ms: performance.now() - d, catalogue: !!(m && m.donnees && m.donnees.catalogue), inchange: !!(m && m.donnees && m.donnees.catalogueInchange) });
          return rendu;
        }
      };
      try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push({ debut: e.startTime, ms: e.duration }); }).observe({ type: 'longtask', buffered: true }); } catch { /* pas de longtask */ }
      let dernier = performance.now();
      setInterval(() => { const t = performance.now(); window.__battements.push({ t, ecart: t - dernier }); if (window.__battements.length > 20000) window.__battements.splice(0, 10000); dernier = t; }, 4);
      const note = (e) => { window.__touchers.push({ delai: performance.now() - e.timeStamp, t: performance.now() }); e.stopImmediatePropagation(); e.preventDefault(); };
      window.__neutre = true;
      window.addEventListener('pointerdown', (e) => { if (window.__neutre) note(e); }, true);
      for (const t of ['pointerup', 'click', 'touchstart', 'touchend', 'mousedown', 'mouseup']) window.addEventListener(t, (e) => { if (window.__neutre) e.stopImmediatePropagation(); }, true);
      new MutationObserver(() => { if (window.__ligne === null && document.querySelector('[data-role="ligne-houblon"]')) window.__ligne = performance.now(); }).observe(document, { childList: true, subtree: true });
    }, sansChauffe);
    const url = `http://localhost:${port}/?dev-local&etape=houblons${client === 'immediat' ? '&calcul=immediat' : ''}`;
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.waitForSelector('[data-hop-v4-etape="houblons"]', { timeout: 180000 });
    await attendre(1500);
    const enAttente = await page.evaluate(() => window.__file.length);
    const cdp = await page.createCDPSession();
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    const t0 = await page.evaluate(() => { window.__lt.length = 0; window.__touchers.length = 0; window.__battements.length = 0; return performance.now(); });
    let continuer = true;
    const doigt = (async () => { while (continuer) { await page.touchscreen.tap(195, 420).catch(() => {}); await attendre(25); } })();
    await attendre(300);
    const liberees = await page.evaluate(() => window.__relacher());
    // Worker : jusqu'à la réponse de la préchauffe (le worker de la page peut mettre longtemps à démarrer en développement). Fil principal : le calcul est déjà fait au retour de `__relacher`.
    const resolue = client === 'immediat' || sansChauffe ? true : await page.waitForFunction(() => window.__chauffe && window.__chauffe.resoluMs !== undefined, { timeout: 120000 }).then(() => true).catch(() => false);
    if (!resolue) echecs.push('la réponse de la préchauffe n\'est pas revenue du worker en 120 s');
    await attendre(2500); // le reste du repos : chargement des ajouts, compléments (le catalogue plein est renvoyé au worker à son arrivée)
    continuer = false; await doigt;
    const r = await page.evaluate((t) => ({
      chauffe: window.__chauffe ?? null, durees: window.__durees.map((d) => Math.round(d)),
      envois: (window.__envois ?? []).map((e) => ({ type: e.type, nom: e.nom, t: Math.round(e.t - t), ms: Math.round(e.ms * 10) / 10, catalogue: e.catalogue, inchange: e.inchange })),
      lt: window.__lt.map((x) => ({ debut: Math.round(x.debut - t), ms: Math.round(x.ms) })).filter((x) => x.debut >= -5),
      touchers: window.__touchers.map((x) => ({ t: Math.round(x.t - t), delai: Math.round(x.delai) })),
      battements: window.__battements.filter((b) => b.t >= t).map((b) => ({ t: Math.round(b.t - t), ecart: Math.round(b.ecart) })).filter((b) => b.ecart >= 30),
    }), t0);
    const delais = r.touchers.map((x) => x.delai);
    const longues = r.lt.filter((x) => x.ms > 50);
    const blocage = r.battements.reduce((m, b) => Math.max(m, b.ecart), 0);
    // appelMs : le bloc du fil principal que la préchauffe a pris (worker : le rappel qui a envoyé la requête ; fil principal : le plus long rappel du repos, celui du calcul).
    const chauffe = client === 'immediat'
      ? { appelMs: Math.max(0, ...r.durees), resoluMs: null, rappels: r.durees }
      : { debut: r.chauffe ? Math.round(r.chauffe.debut - t0) : null, appelMs: r.chauffe && r.chauffe.dansRappel >= 0 ? r.durees[r.chauffe.dansRappel] : null, resoluMs: r.chauffe && r.chauffe.resoluMs !== undefined ? Math.round(r.chauffe.resoluMs) : null, rappels: r.durees };
    let ouverture = null;
    if (ouvrir) {
      // Le geste du brasseur, processeur toujours à ×4 : « Ouvrir l'analyse » (Ma bière), puis l'onglet « Suggestions » ; de l'événement à la première ligne de la liste (data-role="ligne-houblon").
      await page.evaluate(() => { window.__neutre = false; });
      const ouvertMaBiere = await page.evaluate(() => { const b = document.querySelector('[data-role="pont-biere"]'); if (b) b.click(); return !!b; });
      const vuBiere = ouvertMaBiere && await page.waitForSelector('[data-ecran="biere"]', { timeout: 60000 }).then(() => true, () => false);
      if (!vuBiere) echecs.push('Ma bière ne s\'ouvre pas (bouton pont-biere)');
      else {
        await attendre(1500);
        // --visee=1 : le brasseur pose d'abord une visée (« + tropical » sur la piste), comme controle-ma-biere-app.mjs : Suggérer a alors un vrai calcul à faire (sans visée, il n'a aucun objectif et la liste est presque vide).
        if (visee) {
          await page.evaluate(() => document.querySelector('[data-famille-ligne="tropical"] > button')?.click());
          await attendre(400);
          const pose = await page.evaluate(() => { const b = document.querySelector('[data-famille-ligne="tropical"] [data-visee="plus"]'); b?.click(); return !!b; });
          if (!pose) echecs.push('la visée « + tropical » ne se pose pas');
          await attendre(4000);
        }
        await page.evaluate(() => { window.__ligne = null; window.__battements.length = 0; window.__lt.length = 0; window.__t0 = performance.now(); document.querySelector('[data-onglet="suggerer"]')?.click(); });
        const vu = await page.waitForFunction(() => window.__ligne !== null, { timeout: 90000 }).then(() => true).catch(() => false);
        await attendre(2000);
        const o = await page.evaluate(() => ({ t0: window.__t0, ligne: window.__ligne, lt: window.__lt.map((x) => Math.round(x.ms)), batt: window.__battements.map((b) => b.ecart) }));
        ouverture = { listeVue: vu, versLigneMs: o.ligne == null ? null : Math.round(o.ligne - o.t0), plusLongBlocageMs: Math.round(Math.max(0, ...o.batt)), tachesLongues: o.lt.filter((x) => x > 50) };
        if (!vu) echecs.push('la liste de Suggérer ne s\'est pas affichée');
      }
    }
    return {
      essai: n, client, cpu, enAttente, liberees, resolue, chauffe, tachesLongues: longues, plusLongue: longues.reduce((m, x) => Math.max(m, x.ms), 0), plusLongBlocageMs: blocage,
      touchers: { n: delais.length, mediane: mediane(delais), max: delais.length ? Math.max(...delais) : null, au_dessus_de_50: delais.filter((d) => d > 50).length, au_dessus_de_100: delais.filter((d) => d > 100).length },
      envois: r.envois, blocages: r.battements, ouverture, journal, echecs,
    };
  } finally {
    await browser.close();
  }
};

const rapport = [];
for (let i = 1; i <= essais; i++) {
  const r = await un(i);
  rapport.push(r);
  console.log(`essai ${i} (${client}${sansChauffe ? ", sans préchauffe" : ""}${visee ? ", visée" : ""}, ×${cpu}) : préchauffe ${JSON.stringify(r.chauffe)} · tâches longues (API) ${JSON.stringify(r.tachesLongues.map((x) => `${x.debut}+${x.ms}`))} · plus long blocage (battement) ${r.plusLongBlocageMs} ms ${JSON.stringify(r.blocages)} · envois ${JSON.stringify(r.envois.filter((e) => e.type === "donnees" || e.ms > 2))} · toucher : médiane ${r.touchers.mediane} ms, max ${r.touchers.max} ms, > 50 ms ${r.touchers.au_dessus_de_50}/${r.touchers.n}, > 100 ms ${r.touchers.au_dessus_de_100}/${r.touchers.n}${r.ouverture ? ` · ouverture de Suggérer : ${JSON.stringify(r.ouverture)}` : ''}${r.journal.length ? ` · console ${JSON.stringify(r.journal)}` : ''}${r.echecs.length ? ' · ECHEC ' + r.echecs.join(' ; ') : ''}`);
}
fs.writeFileSync(path.join(sortie, `${client}-x${cpu}.json`), JSON.stringify(rapport, null, 1));
console.log(rapport.some((r) => r.echecs.length) ? 'MESURE ECHEC' : 'MESURE OK');
