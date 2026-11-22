// Étapes CH-N3, CH-N3-PASTILLE, CH-N13, CH-N9 du PARCOURS CHAINES (voie V12 de la chasse Calendrier, 21.11) : « menu de période ».
// Fixture : `fixtures/calendrier.mjs` (données simulées « ZZ TEST ») ; jamais seedData.ts, aucun Gemini. Rouge sur le tag en-ligne/2026-11-21-tour8,
// vert sur l'arbre. 390 tactile (le doigt : touchscreen.tap). Bloc distinct de chaines.mjs : le pilote fusionne.
//   node scripts/parcours/chaines.mjs <dossier> --etape CH-N3,CH-N13,CH-N9 [--ref en-ligne/2026-11-21-tour8]
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const { fixtureCalendrier } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'calendrier.mjs')).href);
const calendrier = (aujourdhui) => fixtureCalendrier(aujourdhui).entrees;

const MENU = '[data-menu-periode] button';

/** CAL-PERIODE-APP-FIXE (22.11, « Cette période là reste fixe, le reste peut être mobile ») : la barre de l'app (`app`, « Novembre 2026 »)
 *  ne suit plus le menu du Calendrier ; la fenêtre du Calendrier (du, au : ISO) se lit sur les graduations visibles de sa bande (data-lundi,
 *  lundi de chaque semaine). Rend aussi le cadre, le libellé de la pastille ▾ et les coches du menu. */
const lire = (s) => s.p.evaluate(() => {
  const pr = document.querySelector('[data-periode-pastille]');
  const app = [pr?.querySelector('.pr-court')?.textContent?.trim() ?? '', pr?.querySelector('.pr-ce')?.getAttribute('aria-label') ?? ''].join(' | ');
  const vus = (q, a) => [...document.querySelectorAll(q)].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > 0 && r.left < innerWidth; }).map((e) => e.getAttribute(a)).sort();
  /* en « 2 sem. » et « Jour », la bande est en colonnes de jours (BandeColonnes, data-jour) ; sinon en semaines (BandeSemaines, data-lundi) */
  const jours = vus('[data-jour]', 'data-jour');
  const gl = jours.length ? jours : vus('[data-bande-semaines] [data-lundi], [data-semaine-bande]', 'data-lundi');
  const dimanche = (iso) => (jours.length ? iso : new Date(Date.parse(`${iso}T12:00:00Z`) + 6 * 86400000).toISOString().slice(0, 10));
  const cadre = document.querySelector('.ent-cadre')?.getAttribute('aria-label')?.replace(/^Fenêtre : /, '') ?? '';
  const bouton = document.querySelector('button[aria-label$="période, liste, tri et filtre"]');
  const coches = [...document.querySelectorAll('[data-menu-periode] button[aria-pressed="true"]')].map((b) => b.textContent.trim());
  return { app, du: gl[0] ?? null, au: gl.length ? dimanche(gl[gl.length - 1]) : null, cadre, pastille: (bouton?.textContent ?? '').replace(/\s+/g, ' ').trim(), coches };
});

export function etapesV12({ echec, ok, sleep }) {
  const versCalendrier = async (s) => { await s.onglet('Calendrier'); await sleep(1800); };
  const ouvrirMenu = async (s) => { await s.toucher('période, liste, tri et filtre', { dans: '[aria-label$="période, liste, tri et filtre"]', contient: true }); await sleep(650); };
  /** Choisit une ligne du menu (le menu se ferme) puis rend ce que l'écran dit. */
  const choisir = async (s, nom) => { await ouvrirMenu(s); await s.toucher(nom, { dans: MENU }); await sleep(1400); await s.p.keyboard.press('Escape').catch(() => {}); await sleep(400); return lire(s); };
  /** Le menu rouvert : les lignes cochées. */
  const cochees = async (s) => { await ouvrirMenu(s); const l = await lire(s); await s.p.keyboard.press('Escape').catch(() => {}); await sleep(400); return l.coches; };
  const contient = (l, aujourdhui) => !!l.du && !!l.au && l.du <= aujourdhui && aujourdhui <= l.au;

  return [
    {
      id: 'CH-N3', titre: 'Menu de période : « 2 sem. » depuis Nov. puis depuis An (par « Jour ») pose une fenêtre qui contient aujourd’hui (CHN-3)',
      entrees: calendrier,
      async joue(s) {
        const aujourdhui = new Date().toISOString().slice(0, 10);
        await versCalendrier(s);
        const fautes = [];
        const l0 = await lire(s);
        const a = await choisir(s, '2 sem.');
        await s.cap('CH-N3-1-nov-2sem');
        if (!contient(a, aujourdhui)) fautes.push(`depuis « ${l0.pastille} », « 2 sem. » pose ${a.du} → ${a.au} (cadre « ${a.cadre} »), aujourd'hui (${aujourdhui}) hors champ`);
        await choisir(s, 'An');
        const b = await choisir(s, 'Jour');
        await s.cap('CH-N3-2-an-jour');
        if (!contient(b, aujourdhui)) fautes.push(`depuis An, « Jour » pose ${b.du} → ${b.au} (cadre « ${b.cadre} »), aujourd'hui (${aujourdhui}) hors champ`);
        if (a.du && b.du && a.du !== b.du) fautes.push(`deux règles : « 2 sem. » pose ${a.du}, « Jour » pose ${b.du}`);
        for (const [quand, l] of [['« 2 sem. »', a], ['« Jour »', b]]) if (l.app !== l0.app) fautes.push(`${quand} a bougé la période de l'app : « ${l0.app} » → « ${l.app} » (elle est fixe, CAL-PERIODE-APP-FIXE)`);
        if (fautes.length) return echec('CH-N3', fautes.slice(0, 3).join(' ; '));
        ok('CH-N3', `« 2 sem. » depuis Nov. : ${a.du} → ${a.au} ; « Jour » depuis An : ${b.du} → ${b.au} ; aujourd'hui (${aujourdhui}) dedans, même règle`);
      }
    },
    {
      id: 'CH-N3-PASTILLE', titre: 'La pastille de période ne dit pas « · j » : « 2 sem. » seul (CHN-13)',
      entrees: calendrier,
      async joue(s) {
        await versCalendrier(s);
        const a = await choisir(s, '2 sem.');
        await s.cap('CH-N3-PASTILLE');
        if (/·\s*j\b/.test(a.pastille)) return echec('CH-N3-PASTILLE', `la pastille dit « ${a.pastille} » (le « j » n'est pas un mot du brasseur)`);
        ok('CH-N3-PASTILLE', `la pastille dit « ${a.pastille} »`);
      }
    },
    {
      id: 'CH-N13', titre: 'Menu de période : une seule ligne coche une durée à la fois ; « Jour » et « 2 sem. » (idem 6 sem./Semaine, 6 mois/Mois) jamais cochés ensemble (CHN-13)',
      entrees: calendrier,
      async joue(s) {
        await versCalendrier(s);
        const fautes = [];
        const juge = (quand, coches) => { if (coches.length !== 1) fautes.push(`${quand} : ${coches.length} coche(s) (${coches.join(' + ') || 'aucune'})`); };
        juge('au repos (6 sem.)', await cochees(s));
        await s.cap('CH-N13-1-repos');
        for (const [nom, quand] of [['2 sem.', '« 2 sem. »'], ['Jour', '« Jour »'], ['Mois', '« Mois »'], ['6 mois', '« 6 mois »'], ['3 mois', '« 3 mois »'], ['An', '« An »'], ['6 sem.', '« 6 sem. »'], ['Semaine', '« Semaine »']]) {
          await choisir(s, nom);
          juge(`après ${quand}`, await cochees(s));
          if (nom === 'Jour') await s.cap('CH-N13-2-jour');
        }
        if (fautes.length) return echec('CH-N13', fautes.slice(0, 4).join(' ; '));
        ok('CH-N13', 'repos, 2 sem., Jour, Mois, 6 mois, 3 mois, An, 6 sem., Semaine : une seule ligne cochée à chaque fois');
      }
    },
    {
      id: 'CH-N9', titre: 'Réglage ± : allumé, la page rechargée, il reste allumé (aria-pressed=true), comme la courbe cachée et la rangée masquée (CHN-9)',
      entrees: calendrier,
      async joue(s) {
        await versCalendrier(s);
        const etat = () => s.p.evaluate(() => [...document.querySelectorAll('button.ent-mb')].find((b) => b.textContent.trim() === '±')?.getAttribute('aria-pressed') ?? null);
        if (await etat() !== 'false') return echec('CH-N9', `au départ ± n'est pas éteint (aria-pressed=${await etat()})`);
        await s.toucher('±', { dans: 'button.ent-mb' }); await sleep(600);
        const allume = await etat();
        if (allume !== 'true') return echec('CH-N9', `le toucher n'allume pas ± (aria-pressed=${allume})`);
        await s.cap('CH-N9-1-allume');
        await s.p.goto(s.banc.url, { waitUntil: 'load' });
        await s.p.waitForSelector('nav button', { timeout: 90000 });
        await sleep(1200);
        await versCalendrier(s);
        const relu = await etat();
        await s.cap('CH-N9-2-recharge');
        if (relu !== 'true') return echec('CH-N9', `± allumé, page rechargée : aria-pressed=${relu} (il retombe à éteint)`);
        await s.toucher('±', { dans: 'button.ent-mb' }); await sleep(600);
        const eteint = await etat();
        if (eteint !== 'false') return echec('CH-N9', `après rechargement, un toucher n'éteint pas ± (aria-pressed=${eteint})`);
        ok('CH-N9', '± allumé reste allumé au rechargement ; un toucher l’éteint');
      }
    }
  ];
}
