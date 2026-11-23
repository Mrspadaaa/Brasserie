// Étape CH-N7 du PARCOURS CHAINES (voie V6 de la chasse Calendrier, 21.11) : « hors ligne, toucher un retard ouvre le brassin ; recharger rend l'app ».
// Fixture : `fixtures/calendrier.mjs` (données simulées, « Hefe » en retard) ; jamais seedData.ts, aucun Gemini. Rouge sur le tag en-ligne/2026-11-21-tour8
// (aucun service worker d'application : bandeau « Impossible de charger cet écran », puis page « dinosaure », ERR_INTERNET_DISCONNECTED), vert sur l'arbre.
// Le banc sert le BUILD de la voie sur 127.0.0.1 (contexte sûr : le worker s'y installe ; il n'existe pas en `vite dev`). Il ne prouve pas l'hébergement
// (en-têtes de cache de firebase.json) : « à rejouer en ligne » reste dit dans BUGS.md.
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const { fixtureCalendrier } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'calendrier.mjs')).href);

/** Le centre d'un élément visible (sélecteur CSS), défilé dans la vue : on le touche au doigt, jamais element.click(). */
const centre = (s, sel, texte = '') => s.p.evaluate((q, t) => {
  const e = [...document.querySelectorAll(q)].find((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (x.innerText || x.getAttribute('aria-label') || '').includes(t); });
  if (!e) return null;
  e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2];
}, sel, texte);
const toucherSel = async (s, sleep, sel, texte = '') => {
  const c = await centre(s, sel, texte); if (!c) return false;
  await s.p.touchscreen.tap(c[0], c[1]); await sleep(900); return true;
};

export function etapesN7({ echec, ok, sleep }) {
  return [{
    id: 'CH-N7', titre: 'Hors ligne : toucher un retard (« Hefe ») ouvre le brassin, et recharger rend l’app, sans page « dinosaure » (CHN-7)',
    entrees: (aujourdhui) => fixtureCalendrier(aujourdhui).entrees,
    async joue(s) {
      // 1. premier lancement en ligne : le service worker d'application prend la main et le précache se remplit
      const sw = await s.p.waitForFunction(() => (navigator.serviceWorker && navigator.serviceWorker.controller ? navigator.serviceWorker.controller.scriptURL : false), { timeout: 45000 }).then((h) => h.jsonValue(), () => null);
      if (!sw) return echec('CH-N7', 'aucun service worker d’application ne contrôle la page 45 s après le premier lancement en ligne (le build n’en écrit pas)');
      const attendu = await s.p.waitForFunction(async () => { let n = 0; for (const k of await caches.keys()) n += (await (await caches.open(k)).keys()).length; return n >= 100 ? n : false; }, { timeout: 90000, polling: 500 }).then((h) => h.jsonValue(), () => 0);
      if (!attendu) return echec('CH-N7', `le précache n’est pas rempli (moins de 100 entrées) : ${sw}`);

      // 2. hors ligne : le retard « Hefe » s'ouvre
      await s.p.setOfflineMode(true);
      try {
        await s.onglet('Calendrier'); await sleep(1500);
        await s.p.waitForSelector('.ent-ret-b', { timeout: 15000 });
        await toucherSel(s, sleep, '.ent-ret-b');
        if (!(await toucherSel(s, sleep, '.ent-ret-l', 'Hefe'))) return echec('CH-N7', 'le retard « Hefe » n’est pas dans la liste des retards');
        await sleep(1500); await s.cap('CH-N7-1-hors-ligne-brassin');
        const t1 = await s.texte(20000);
        if (/Impossible de charger cet écran/i.test(t1)) return echec('CH-N7', 'hors ligne, le brassin ne s’ouvre pas : « Impossible de charger cet écran »');
        // la fiche du brassin est une feuille (BatchDetailSheet, chargée à la demande) : son titre « B-HEFE · Hefe » n'existe qu'à elle
        if (!/B-HEFE/.test(t1) || !/Commencer le brassage/.test(t1)) return echec('CH-N7', `hors ligne, la fiche du brassin « Hefe » ne s’ouvre pas : ${t1.slice(0, 160)}`);

        // 3. toujours hors ligne : recharger rend l'app (pas de page « dinosaure »)
        let erreur = null;
        try { await s.p.reload({ waitUntil: 'load', timeout: 20000 }); } catch (e) { erreur = String(e.message ?? e).slice(0, 120); }
        if (erreur) { await s.cap('CH-N7-2-recharge-echec').catch(() => {}); return echec('CH-N7', `recharger hors ligne échoue : ${erreur}`); }
        const rendu = await s.p.waitForSelector('nav button', { timeout: 15000 }).then(() => true, () => false);
        if (!rendu) return echec('CH-N7', `recharger hors ligne : l’app ne rend pas (${(await s.texte(160))})`);
        await sleep(3000); await s.cap('CH-N7-2-recharge');
        if (/Impossible de charger cet écran|Chargement de l’écran/.test(await s.texte(20000))) return echec('CH-N7', 'recharger hors ligne : l’écran rendu reste sur le chargement ou le message d’échec');
        ok('CH-N7', `hors ligne : « Hefe » s’ouvre, le rechargement rend l’app (${sw.replace(/^https?:\/\/[^/]+/, '')}, ${attendu} entrées précachées)`);
      } finally { await s.p.setOfflineMode(false).catch(() => {}); }
    }
  }];
}
