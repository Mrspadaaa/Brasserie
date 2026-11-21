// Étapes CH-E1 et CH-V19 du PARCOURS CHAINES (voie V13 de la chasse Calendrier, 21.11) : « ajout et feuille ».
// Fixture : `fixtures/calendrier.mjs` (données simulées « ZZ TEST ») ; jamais seedData.ts, aucun Gemini. Rouge sur le tag en-ligne/2026-11-21-tour8,
// vert sur l'arbre. 390 tactile (le doigt : touchscreen.tap). Bloc distinct de chaines.mjs : le pilote fusionne.
//   node scripts/parcours/chaines.mjs <dossier> --etape CH-E1,CH-V19 [--ref en-ligne/2026-11-21-tour8]
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const { fixtureCalendrier } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'calendrier.mjs')).href);
const calendrier = (aujourdhui) => fixtureCalendrier(aujourdhui).entrees;

const MENU = '[data-menu-periode] button';
const CHF = 'textarea[aria-label="Montant en CHF"]';
const NOM = '[data-feuille-nom]';

export function etapesV13({ echec, ok, sleep }) {
  const versCalendrier = async (s) => { await s.onglet('Calendrier'); await sleep(1800); };
  const pastille = (s) => s.p.evaluate(() => {
    const b = document.querySelector('button[aria-label$="période, liste, tri et filtre"]');
    return (b?.textContent ?? '').replace(/\s+/g, ' ').trim();
  });
  const choisirDuree = async (s, nom) => {
    await s.toucher('période, liste, tri et filtre', { dans: '[aria-label$="période, liste, tri et filtre"]', contient: true }); await sleep(650);
    await s.toucher(nom, { dans: MENU }); await sleep(1400);
    await s.p.keyboard.press('Escape').catch(() => {}); await sleep(400);
  };
  /** La chose nommée, vue dans la fenêtre : un élément portant son nom, dans l'écran (pas la liste ni la feuille). */
  const choseVisible = (s, nom) => s.p.evaluate((n) => [...document.querySelectorAll('[aria-label],[data-chose]')]
    .filter((e) => (e.getAttribute('aria-label') || '').includes(n) && !e.closest('[role=dialog]'))
    .some((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; }), nom);

  return [
    {
      id: 'CH-E1', titre: 'Ajout par le + de Ventes à « 1 an » : la vue garde « 3 mois », la chose se voit ou le message dit où elle est posée, et le + suivant s’ouvre sur aujourd’hui (CHE-1)',
      entrees: calendrier,
      async joue(s) {
        await versCalendrier(s);
        await choisirDuree(s, '3 mois');
        const avant = await pastille(s);
        if (!/3 mois/.test(avant)) return echec('CH-E1', `départ : la pastille dit « ${avant} », pas « 3 mois »`);
        await s.toucher('Ajouter dans Ventes'); await sleep(900);
        await s.ecrire(CHF, '12,5');
        await s.toucher('1 an', { dans: '.cal-f-horizons button' }); await sleep(500);
        await s.ecrire(NOM, 'ZZ TEST vente 1:1');
        await s.cap('CH-E1-1-feuille');
        await s.p.keyboard.press('Enter'); await sleep(1800);
        await s.cap('CH-E1-2-apres');
        const apres = await pastille(s);
        const message = await s.p.evaluate(() => [...document.querySelectorAll('[role=status],[role=alert]')].map((e) => e.textContent).join(' | ').replace(/\s+/g, ' '));
        const visible = await choseVisible(s, 'ZZ TEST vente 1:1');
        const dit = /posée en\s+\S+\.?\s*2027/.test(message);
        const fautes = [];
        if (!/3 mois/.test(apres)) fautes.push(`la vue passe de « ${avant} » à « ${apres} »`);
        if (!visible && !dit) fautes.push(`la chose n'est pas dans la fenêtre et le message ne dit pas où elle est posée (écran : « ${message.replace(/\s+/g, ' ').slice(0, 160)} »)`);
        if (fautes.length) return echec('CH-E1', fautes.join(' ; '));
        // le + suivant : la feuille s'ouvre sur aujourd'hui (« cette semaine »), jamais sur la fenêtre déplacée
        await s.toucher('Ajouter dans Achats'); await sleep(900);
        const intention = await s.p.evaluate(() => document.querySelector('[data-intention]')?.textContent?.trim() ?? '');
        await s.cap('CH-E1-3-plus-suivant');
        if (intention !== 'cette semaine') return echec('CH-E1', `le + suivant s'ouvre sur « ${intention || 'rien de lisible'} », pas sur aujourd'hui (« cette semaine »)`);
        ok('CH-E1', `vue « ${apres} », chose ${visible ? 'visible' : 'dite par le message'}, + suivant sur « ${intention} »`);
      }
    },
    {
      id: 'CH-V19', titre: 'Feuille d’ajout, frise Durée : les graduations (« nov. déc. janv. ») ont un corps ≥ 12 px et un contraste ≥ 4,5:1 sur le fond de la piste, en cave et en clair (CHV-19)',
      entrees: calendrier,
      async joue(s) {
        const fautes = [];
        const lus = [];
        for (const theme of ['cave', 'clair']) {
          await s.p.evaluate((t) => { localStorage.setItem('laffinee.theme', t); }, theme);
          await s.p.goto(s.banc.url, { waitUntil: 'load' });
          await s.p.waitForSelector('nav button', { timeout: 90000 });
          await sleep(1200);
          await versCalendrier(s);
          await s.toucher('Ajouter dans Fêtes'); await sleep(900);
          await s.p.waitForSelector('.cal-f-duree-rep small', { timeout: 8000 }).catch(() => {});
          const l = await s.p.evaluate(() => {
            const rgb = (c) => (c.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
            const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
            const piste = document.querySelector('.cal-f-duree-piste');
            const fond = piste ? rgb(getComputedStyle(piste).backgroundColor) : [];
            const marques = [...document.querySelectorAll('.cal-f-duree-rep small')].map((e) => {
              const cs = getComputedStyle(e);
              const c = rgb(cs.color);
              const a = lum(c), b = lum(fond);
              return { texte: e.textContent.trim(), px: parseFloat(cs.fontSize), contraste: Math.round(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)) * 100) / 100 };
            });
            return { piste: !!piste, marques };
          });
          await s.cap(`CH-V19-${theme}`);
          if (!l.piste || !l.marques.length) { fautes.push(`${theme} : pas de frise Durée ou aucune graduation lue`); continue; }
          lus.push(`${theme} ${l.marques[0].px} px, ${l.marques[0].contraste}:1`);
          const pire = l.marques.reduce((m, x) => (x.contraste < m.contraste ? x : m), l.marques[0]);
          const petit = l.marques.find((x) => x.px < 12);
          if (petit) fautes.push(`${theme} : « ${petit.texte} » en ${petit.px} px (< 12)`);
          if (pire.contraste < 4.5) fautes.push(`${theme} : « ${pire.texte} » contraste ${pire.contraste}:1 (< 4,5)`);
        }
        if (fautes.length) return echec('CH-V19', fautes.slice(0, 4).join(' ; '));
        ok('CH-V19', lus.join(' ; '));
      }
    }
  ];
}
