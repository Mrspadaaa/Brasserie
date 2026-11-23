// Étapes CH-G3, CH-G7, CH-V4 (+ CH-D7), CH-N1 du PARCOURS CHAINES (voie V8 de la chasse Calendrier, 21.11) : « période et An cohérents ».
// Fixture : `fixtures/calendrier.mjs` (données simulées) ; jamais seedData.ts, aucun Gemini. Rouge sur le tag en-ligne/2026-11-21-tour8, vert sur
// l'arbre. 390 tactile (CDP Input.dispatchTouchEvent pour les gestes). Bloc distinct de chaines.mjs : le pilote fusionne.
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const { fixtureCalendrier } = await import(pathToFileURL(path.join(ICI, 'fixtures', 'calendrier.mjs')).href);
const calendrier = (aujourdhui) => fixtureCalendrier(aujourdhui).entrees;
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const MOIS_LONGS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** Semaine ISO d'une date ISO. */
function semaineIso(iso) {
  const d = new Date(`${iso}T12:00:00Z`); const j = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - j + 3);
  const a = new Date(Date.UTC(d.getUTCFullYear(), 0, 4)); return 1 + Math.round(((d - a) / 864e5 - 3 + ((a.getUTCDay() + 6) % 7)) / 7);
}
const jeudi = (iso) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7) + 3); return d.toISOString().slice(0, 10); };

/** Ce que l'écran dit de la période : la barre (pastille de l'app), le cadre de la courbe, An actif, les pastilles de rangée, la flèche ›. */
const lire = (s) => s.p.evaluate((MOIS_LONGS) => {
  const an = new Date().getFullYear();
  const pr = document.querySelector('[data-periode-pastille]');
  const court = pr?.querySelector('.pr-court')?.textContent?.trim() ?? '';
  const ce = pr?.querySelector('.pr-ce')?.getAttribute('aria-label') ?? '';
  let du = null, au = null;
  const m = [...court.matchAll(/(\d{1,2})\.(\d{1,2})(?:\.(\d{2,4}))?/g)];
  const iso = (x) => { const y = x[3] ? (x[3].length === 2 ? 2000 + Number(x[3]) : Number(x[3])) : an; return `${y}-${x[2].padStart(2, '0')}-${x[1].padStart(2, '0')}`; };
  if (m.length >= 2) { du = iso(m[0]); au = iso(m[1]); }
  else { const mm = new RegExp(`(${MOIS_LONGS.join('|')}) (\\d{4})`, 'i').exec(ce); if (mm) { const k = MOIS_LONGS.indexOf(mm[1].toLowerCase()); const y = Number(mm[2]); du = `${y}-${String(k + 1).padStart(2, '0')}-01`; au = new Date(Date.UTC(y, k + 1, 0)).toISOString().slice(0, 10); } }
  /* CAL-PERIODE-APP-FIXE (22.11) : la pastille est la période de l'app, fixe ; la fenêtre du Calendrier se lit sur les graduations visibles (data-lundi) */
  const gl = [...document.querySelectorAll('[data-bande-semaines] [data-lundi]')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > 0 && r.left < innerWidth; }).map((e) => e.getAttribute('data-lundi'));
  const cadre = document.querySelector('.ent-cadre');
  const suiv = [...document.querySelectorAll('button[aria-label="Période suivante"]')][0];
  const pastilles = [...document.querySelectorAll('*')].filter((e) => e.children.length === 0 && /^(prévu|confirmé|à encaisser|à payer) \S/.test(e.textContent?.trim() ?? '')).map((e) => {
    const r = e.getBoundingClientRect(); return { t: e.textContent.trim(), rogne: e.scrollWidth > e.clientWidth + 1 || r.right > innerWidth + 1 };
  });
  const msg = document.body.innerText.match(/[^\n]*(borne|bout du calendrier|au-delà|horizon)[^\n]*/i)?.[0] ?? '';
  return { court, ce, du, au, gdu: gl[0] ?? null, gau: gl.length ? new Date(Date.parse(`${gl[gl.length - 1]}T12:00:00Z`) + 6 * 86400000).toISOString().slice(0, 10) : null, cadre: cadre?.getAttribute('aria-label')?.replace(/^Fenêtre : /, '') ?? '', annee: cadre?.getAttribute('data-annee') === 'oui', suivEteinte: !!suiv?.disabled, pastilles, msg };
}, MOIS_LONGS);

const ouvrirMenu = async (s, sleep) => { await s.toucher('période, liste, tri et filtre', { dans: '[aria-label$="période, liste, tri et filtre"]', contient: true }); await sleep(650); };
const choisir = async (s, sleep, nom) => { await ouvrirMenu(s, sleep); await s.toucher(nom); await sleep(1400); await s.p.keyboard.press('Escape').catch(() => {}); await sleep(400); };
const fleche = async (s, sleep, nom) => {
  const c = await s.p.evaluate((n) => { const b = document.querySelector(`button[aria-label="${n}"]`); if (!b || b.disabled) return null; const r = b.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, nom);
  if (!c) return false; await s.p.touchscreen.tap(c[0], c[1]); await sleep(1300); return true;
};
/** Le cadre d'An attendu pour la barre : mois et années des jeudis de la première et de la dernière semaine. */
const anAttendu = (du, au) => { const a = jeudi(du), b = jeudi(au); return { m1: MOIS[Number(a.slice(5, 7)) - 1], y1: a.slice(0, 4), m2: MOIS[Number(b.slice(5, 7)) - 1], y2: b.slice(0, 4) }; };
/** La barre et le cadre disent-ils la même fenêtre ? (An : mois et années ; sinon : semaines ISO). Rend le défaut, ou ''. */
/* CAL-PERIODE-APP-FIXE (22.11, « Cette période là reste fixe, le reste peut être mobile ») : les gestes du Calendrier (cadre, échelle) ne changent
   jamais la période de l'app ; seuls les ‹ › de la barre de l'app la changent (le Calendrier n'a pas de ‹ › à lui), et la fenêtre du Calendrier
   la suit alors (CalendrierTab, effet sur `clePeriode`). Les étapes ci-dessous touchent les ‹ › de l'app : la barre bouge, le Calendrier suit. */
const appDe = (l) => `${l.court}|${l.ce}`;
/** Un geste du Calendrier laisse la période de l'app telle quelle. Rend le défaut, ou ''. */
const fixe = (avant, apres, geste) => (appDe(avant) === appDe(apres) ? '' : `${geste} a bougé la période de l'app : « ${appDe(avant)} » → « ${appDe(apres)} » (elle est fixe)`);
/** La fenêtre d'An lue dans le cadre (« nov. 2026 – oct. 2027 » ou « janv. – déc. 2027 ») : premier et dernier jour (ISO), ou null. */
function anDuCadre(cadre) {
  const m = /^(\S+)(?: (\d{4}))? – (\S+) (\d{4})$/.exec(cadre.trim());
  if (!m) return null;
  const k1 = MOIS.indexOf(m[1]), k2 = MOIS.indexOf(m[3]); if (k1 < 0 || k2 < 0) return null;
  const y2 = Number(m[4]), y1 = m[2] ? Number(m[2]) : y2;
  return { d: `${y1}-${String(k1 + 1).padStart(2, '0')}-01`, f: new Date(Date.UTC(y2, k2 + 1, 0)).toISOString().slice(0, 10) };
}
/** Le cadre et les graduations de la bande disent-ils la même fenêtre ? (semaines ISO ; An : pas de bande). Rend le défaut, ou ''. */
function ecart(l) {
  if (!l.gdu || !l.gau) return l.annee ? '' : `graduations de la bande illisibles (cadre « ${l.cadre} »)`;
  const s1 = semaineIso(l.gdu), s2 = semaineIso(l.gau);
  const n = /^S(\d+)(?: – S(\d+))?/.exec(l.cadre);
  if (!n) return `cadre « ${l.cadre} » illisible`;
  return Number(n[1]) === s1 && Number(n[2] ?? n[1]) === s2 ? '' : `graduations ${l.gdu}→${l.gau} (S${s1}–S${s2}), cadre « ${l.cadre} »`;
}
/** Après un ‹ › de l'app, la fenêtre du Calendrier montre la période de l'app (elle la contient). Rend le défaut, ou ''. */
function suit(l) {
  if (!l.du || !l.au) return `période de l'app illisible (« ${appDe(l)} »)`;
  const f = l.annee ? anDuCadre(l.cadre) : (l.gdu && l.gau ? { d: l.gdu, f: l.gau } : null);
  if (!f) return `fenêtre du Calendrier illisible (cadre « ${l.cadre} »)`;
  if (f.d <= l.du && l.au <= f.f) return '';
  /* la dernière période de l'app (› éteint : la suivante commencerait après l'horizon) peut finir au-delà de l'horizon : le Calendrier en montre
     le début jusqu'à son bout ; il doit alors contenir son premier jour */
  if (l.suivEteinte && f.d <= l.du && l.du <= f.f) return '';
  return `la période de l'app ${l.du}→${l.au} sort de la fenêtre du Calendrier ${f.d}→${f.f} (cadre « ${l.cadre} »)`;
}

async function cdpDe(s) { return s.p.createCDPSession ? s.p.createCDPSession() : s.p.target().createCDPSession(); }
async function doigt(s, sleep, x0, y, xs, pendant) {
  const cdp = await cdpDe(s); const pt = (x) => [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0) }); await sleep(60);
  for (const x of xs) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(x) }); await sleep(20); }
  const vu = pendant ? await pendant() : null;
  await sleep(60); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(900);
  return vu;
}
const poignee = (s, q) => s.p.evaluate((q) => { const b = document.querySelector(`[data-poignee="${q}"]`); if (!b) return null; const r = b.getBoundingClientRect(); const i = b.querySelector('i')?.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, i: i ? { l: i.left, r: i.right, t: i.top, b: i.bottom } : null }; }, q);
const pas = (a, b, n = 8) => Array.from({ length: n }, (_, k) => a + ((b - a) * (k + 1)) / n);

export function etapesV8({ echec, ok, sleep }) {
  const versCalendrier = async (s) => { await s.onglet('Calendrier'); await sleep(1800); };
  return [
    {
      id: 'CH-V4', titre: 'An : la barre, le cadre de la courbe et les pastilles de rangée nomment la même fenêtre, avec l’année ; › puis ‹ : le cadre suit (CHV-4, CHD-7)',
      entrees: calendrier,
      async joue(s) {
        await versCalendrier(s);
        const fautes = [];
        const lAvant = await lire(s);
        await choisir(s, sleep, 'An');
        await s.cap('CH-V4-1-an');
        const verifier = (l, quand) => {
          const e = ecart(l); if (e) fautes.push(`${quand} : ${e}`);
          if (!l.annee) fautes.push(`${quand} : le cadre n'est pas l'An`);
          const f = anDuCadre(l.cadre); // l'An du Calendrier (sa fenêtre locale), plus celle de la barre de l'app
          if (l.annee && !f) fautes.push(`${quand} : cadre d'An « ${l.cadre} » illisible`);
          const y = f ? { y1: f.d.slice(0, 4), y2: f.f.slice(0, 4) } : null;
          for (const p of l.pastilles) {
            const m = /(\S+)(?: (\d{2}))?–(\S+)(?: (\d{2}))?/.exec(p.t.replace(/^(prévu|confirmé|à encaisser|à payer) /, ''));
            if (!/^S\d/.test(p.t.split(' ')[1] ?? '') && y && y.y1 !== y.y2 && (!m || m[2] !== y.y1.slice(2) || m[4] !== y.y2.slice(2))) fautes.push(`${quand} : pastille « ${p.t} » sans les années ${y.y1}–${y.y2}`);
            if (p.rogne) fautes.push(`${quand} : pastille « ${p.t} » rognée`);
          }
        };
        const l0 = await lire(s); verifier(l0, 'An');
        const f0 = fixe(lAvant, l0, '« An »'); if (f0) fautes.push(f0);
        let avance = false; // › de l'app : éteint au bout de l'horizon (CHN-1), alors pas de › ni de ‹ de retour
        if (await fleche(s, sleep, 'Période suivante')) {
          avance = true; const l1 = await lire(s); await s.cap('CH-V4-2-suivante'); verifier(l1, '›');
          if (appDe(l1) === appDe(l0)) fautes.push(`› de l'app : sa période ne bouge pas (« ${appDe(l1)} »)`);
          const e = suit(l1); if (e) fautes.push(`› : ${e}`);
        }
        if (avance && await fleche(s, sleep, 'Période précédente')) {
          const l2 = await lire(s); await s.cap('CH-V4-3-precedente'); verifier(l2, '‹');
          if (appDe(l2) !== appDe(l0)) fautes.push(`‹ de l'app : sa période ne revient pas (« ${appDe(l0)} » → « ${appDe(l2)} »)`);
          const e = suit(l2); if (e) fautes.push(`‹ : ${e}`);
        }
        if (fautes.length) return echec('CH-V4', fautes.slice(0, 4).join(' ; '));
        ok('CH-V4', `An : cadre « ${l0.cadre} », barre de l'app fixe (« ${l0.ce} »), pastilles ${[...new Set(l0.pastilles.map((p) => p.t))].slice(0, 2).join(' / ')} ; › et ‹ de l'app : le Calendrier suit`);
      }
    },
    {
      id: 'CH-N1', titre: 'Flèches ‹ › : la barre et le Calendrier disent la même période à chaque pas ; au bout, la flèche s’éteint ou le Calendrier dit la borne (CHN-1)',
      entrees: calendrier,
      async joue(s) {
        await versCalendrier(s);
        const fautes = [];
        const depart = appDe(await lire(s));
        /* La période de l'app est un mois : en An, › jusqu'au bout de l'horizon (la flèche s'éteint) ; puis en 6 sem., ‹ jusqu'au mois de départ.
           À chaque pas, la barre de l'app bouge et le Calendrier la montre ; changer d'échelle ne la bouge pas. */
        for (const [echelle, signe, nom, n] of [['An', '›', 'Période suivante', 15], ['6 sem.', '‹', 'Période précédente', 15]]) {
          const lEch = await lire(s);
          await choisir(s, sleep, echelle);
          const fx = fixe(lEch, await lire(s), `« ${echelle} »`); if (fx) fautes.push(fx);
          let k = 0, bout = false;
          for (; k < n; k++) {
            const avant = await lire(s);
            if (signe === '‹' && appDe(avant) === depart) { bout = true; break; }
            if (!(await fleche(s, sleep, nom))) { bout = true; break; }
            const l = await lire(s);
            if (appDe(l) === appDe(avant) && !l.suivEteinte && !l.msg) { fautes.push(`${echelle}, ${signe} ×${k + 1} : la barre de l'app ne bouge plus (« ${l.ce} ») et la flèche reste allumée, sans un mot`); break; }
            const e = ecart(l) || suit(l); if (e) { fautes.push(`${echelle}, ${signe} ×${k + 1} : ${e}`); break; }
          }
          await s.cap(`CH-N1-${echelle === 'An' ? 'an' : '6sem'}-bout`);
          const l = await lire(s);
          if (signe === '›' && !bout && !fautes.length && !l.suivEteinte && !l.msg) fautes.push(`${echelle} : après ${n} ›, ni flèche éteinte ni borne dite (barre « ${l.ce} », Calendrier « ${l.cadre} »)`);
          if (signe === '‹' && !fautes.length && appDe(l) !== depart) fautes.push(`${echelle} : après ${k} ‹, la barre de l'app ne revient pas à « ${depart} » (« ${appDe(l)} »)`);
          if (signe === '›' && !fautes.length && k < 2) fautes.push(`${echelle} : › s'éteint dès ${k} pas (barre « ${l.ce} ») : rien n'a été éprouvé`);
        }
        if (fautes.length) return echec('CH-N1', fautes.slice(0, 3).join(' ; '));
        ok('CH-N1', 'échelle choisie : barre de l’app fixe ; An, › de l’app jusqu’au bout (la flèche s’éteint), 6 sem., ‹ jusqu’au départ : à chaque pas le Calendrier montre la période de l’app');
      }
    },
    {
      id: 'CH-G3', titre: 'An : un toucher sur la poignée de début, sans bouger, ne change rien ; la fenêtre reste l’An (CHG-3)',
      entrees: calendrier,
      async joue(s) {
        await versCalendrier(s); await choisir(s, sleep, 'An');
        const l0 = await lire(s); const d = await poignee(s, 'debut');
        if (!d || !l0.annee) return echec('CH-G3', `An introuvable (cadre « ${l0.cadre} », poignée ${d ? 'trouvée' : 'absente'})`);
        await doigt(s, sleep, d.x, d.y, []); await sleep(600);
        const l1 = await lire(s); await s.cap('CH-G3-1-apres-toucher');
        if (!l1.annee || l1.cadre !== l0.cadre) return echec('CH-G3', `un toucher sur la poignée de début : « ${l0.cadre} » → « ${l1.cadre} »${l1.annee ? '' : ' (l’An est perdu)'}`);
        ok('CH-G3', `toucher sur la poignée de début : la fenêtre reste l’An (« ${l1.cadre} »)`);
      }
    },
    {
      id: 'CH-G7', titre: '1 semaine, tirer le début : la bulle dit une semaine (« S40 »), ni sur le coin du début ni sur la poignée ; la barre dit la même semaine (CHG-7)',
      entrees: calendrier,
      async joue(s) {
        await versCalendrier(s); await choisir(s, sleep, '6 sem.');
        const d0 = await poignee(s, 'debut'), f0 = await poignee(s, 'fin');
        if (!d0 || !f0) return echec('CH-G7', 'poignées du cadre introuvables');
        await doigt(s, sleep, f0.x, f0.y, pas(f0.x, d0.x + 6, 12)); await sleep(800);
        const l0 = await lire(s); await s.cap('CH-G7-1-une-semaine');
        if (!/^S\d+(?: \d{4})?$/.test(l0.cadre) && !/^S(\d+) – S\1\b/.test(l0.cadre)) return echec('CH-G7', `la fenêtre n'est pas d'une semaine après avoir tiré la fin (« ${l0.cadre} »)`);
        const d = await poignee(s, 'debut');
        const vu = await doigt(s, sleep, d.x, d.y, pas(d.x, d.x + 40, 8), async () => {
          await s.cap('CH-G7-2-pendant');
          return s.p.evaluate(() => {
            const b = document.querySelector('[data-cadre-tirage]'); const c = document.querySelector('.ent-cadre'); const i = document.querySelector('[data-poignee="debut"] i');
            const r = (e) => { if (!e) return null; const x = e.getBoundingClientRect(); return { l: x.left, r: x.right, t: x.top, b: x.bottom }; };
            return { t: b?.textContent?.trim() ?? '', b: r(b), c: r(c), i: r(i) };
          });
        });
        const l1 = await lire(s);
        const fautes = [];
        if (!vu?.b) fautes.push('aucune bulle pendant le tirage');
        else {
          if (/^S(\d+) – S\1\b/.test(vu.t)) fautes.push(`bulle « ${vu.t} » (une semaine dite deux fois)`);
          const dans = (x, y, q) => x >= q.l - 1 && x <= q.r + 1 && y >= q.t - 1 && y <= q.b + 1;
          if (vu.c && dans(vu.c.l, vu.c.t, vu.b)) fautes.push(`la bulle (${Math.round(vu.b.l)}–${Math.round(vu.b.r)} px) couvre le coin du début (${Math.round(vu.c.l)} px)`);
          if (vu.i && vu.i.l < vu.b.r && vu.i.r > vu.b.l && vu.i.t < vu.b.b && vu.i.b > vu.b.t) fautes.push('la bulle couvre la poignée de début');
          const sb = /^S(\d+)/.exec(vu.t);
          if (sb && l1.gdu && Number(sb[1]) !== semaineIso(l1.gdu) && /^S\d+(?: \d{4})?$/.test(vu.t)) fautes.push(`bulle « ${vu.t} », barre S${semaineIso(l1.gdu)} : deux semaines à l'écran`);
        }
        if (fautes.length) return echec('CH-G7', fautes.join(' ; '));
        ok('CH-G7', `bulle « ${vu.t} » à ${Math.round(vu.b.l)}–${Math.round(vu.b.r)} px, cadre à ${Math.round(vu.c.l)} px : ni coin ni poignée couverts ; barre S${semaineIso(l1.du)}`);
      }
    },
  ];
}
