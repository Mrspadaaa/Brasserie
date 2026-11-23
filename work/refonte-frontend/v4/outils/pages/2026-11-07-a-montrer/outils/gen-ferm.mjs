// Mini maquettes « à lui montrer » de l'étape Fermentescibles (B1 n° 1, 10, 11, 13, 15 ; N3, N4 le reste), 07.11.
// Chaque vignette part du vrai écran (build figé %TEMP%/ferm-apres, états SIMULÉS `?malts=`, aucune donnée réelle), à 390 tactile (ou 1280) :
// « aujourd'hui » est capturé tel quel ; une option ne change qu'un facteur, posé en HTML sur le DOM de l'app (mêmes classes `fer-*`, mêmes
// tailles), puis recadré sur la rangée concernée. Aucune écriture hors de ce dossier.
// Usage (racine du dépôt) : node work/refonte-frontend/v4/outils/pages/2026-11-07-a-montrer/outils/gen-ferm.mjs [id…]
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ouvrir, toucher, dormir, taper } from '../../../../../../missions/2026-10-31-ecran-fermentescibles/banc-critique/banc.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const IMG = path.resolve(ICI, '..', 'img');
const BUILD = path.join(process.env.TEMP, 'ferm-apres');

/** Recadre sur l'union des sélecteurs (marges en px), toute la largeur de l'écran ; rend le rectangle. */
async function cadrer(p, sels, { haut = 10, bas = 10, x0, x1 } = {}) {
  return p.evaluate((sels, haut, bas, x0, x1) => {
    const els = sels.flatMap((s) => [...document.querySelectorAll(s)]).filter((e) => e.getClientRects().length);
    if (!els.length) throw new Error('rien à cadrer : ' + sels.join(', '));
    els[0].scrollIntoView({ block: 'start' });
    const sc = document.scrollingElement; // le main du PageShell défile : on remonte de la marge haute
    let n = els[0].parentElement; while (n && !(n.scrollHeight > n.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(n).overflowY))) n = n.parentElement;
    (n || sc).scrollTop -= haut + 60;
    const rs = els.map((e) => e.getBoundingClientRect());
    const t = Math.max(0, Math.min(...rs.map((r) => r.top)) - haut), b = Math.max(...rs.map((r) => r.bottom)) + bas;
    return { x: x0 ?? 0, y: t, width: (x1 ?? innerWidth) - (x0 ?? 0), height: b - t };
  }, sels, haut, bas, x0, x1);
}

const TOUR = '<svg class="fer-tour" viewBox="0 0 24 24" width="12" height="12" stroke-width="2.33" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 2l4 4-4 4"></path><path d="M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4"></path><path d="M21 13v2a3 3 0 0 1-3 3H3"></path></svg>';
const COCHE = '<svg viewBox="0 0 24 24" width="16" height="16" stroke-width="2.4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"></path></svg>';

// Couleurs prises à l'écran même (clair ou cave), pour qu'un élément posé parle la langue de la base.
const TEINTES = `(() => { const cs = (s, k) => { const e = document.querySelector(s); return e ? getComputedStyle(e)[k] : ''; };
  return { encre: cs('.fer-bh b', 'color') || cs('.fer-nom b', 'color'), fond: cs('.fer-bal', 'backgroundColor'), page: getComputedStyle(document.body).backgroundColor,
    trait: cs('.fer-bmo', 'borderTopColor'), doux: cs('.fer-mo', 'color'), alerte: cs('.fer-alerte', 'color'), alerteFond: cs('.fer-alerte', 'backgroundColor') }; })()`;

// Une liste ouverte sous un bouton (menu), aux couleurs de la base.
const MENU = (ancre, items, actif) => `(() => { const T = ${TEINTES}; const a = document.querySelector(${JSON.stringify(ancre)});
  const fond = T.fond && T.fond !== 'rgba(0, 0, 0, 0)' ? T.fond : T.page;
  const m = document.createElement('div'); m.setAttribute('role', 'menu');
  m.style.cssText = 'position:absolute;z-index:30;min-width:180px;padding:4px;border-radius:12px;border:1px solid ' + T.trait + ';background:' + (document.documentElement.classList.contains('dark') || /cave/.test(localStorage.getItem('laffinee.theme')) ? '#1f1d1a' : '#fff') + ';box-shadow:0 8px 24px rgb(0 0 0 / 22%);color:' + T.encre;
  m.innerHTML = ${JSON.stringify(items)}.map((t) => '<div role="menuitemradio" style="display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:40px;padding:0 12px;border-radius:8px;font-size:15px;' + (t === ${JSON.stringify(actif)} ? 'font-weight:700;background:rgb(127 127 127 / 14%)' : '') + '">' + t + (t === ${JSON.stringify(actif)} ? ${JSON.stringify(COCHE)} : '') + '</div>').join('');
  const r = a.getBoundingClientRect(), host = a.offsetParent || document.body, hr = host.getBoundingClientRect();
  host.appendChild(m); m.style.top = (r.bottom - hr.top + 4 + host.scrollTop) + 'px';
  m.style.left = Math.max(4, Math.min(r.left - hr.left, hr.width - 188)) + 'px'; })()`;

// Pastilles d'un toucher (segment), copiées du style de la pastille de moment de la base.
const SEGMENT = (modele, items, actif) => `(() => { const T = ${TEINTES}; const ref = document.querySelector(${JSON.stringify(modele)});
  const d = document.createElement('div'); d.setAttribute('role', 'radiogroup'); d.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px';
  for (const t of ${JSON.stringify(items)}) { const b = ref.cloneNode(false); b.removeAttribute('data-mom'); b.removeAttribute('data-role'); b.removeAttribute('aria-label'); b.textContent = t;
    b.setAttribute('role', 'radio'); b.style.margin = '0'; b.setAttribute('aria-checked', String(t === ${JSON.stringify(actif)}));
    if (t === ${JSON.stringify(actif)}) { b.style.background = T.encre; b.style.color = T.fond && T.fond !== 'rgba(0, 0, 0, 0)' ? T.fond : T.page; b.style.borderColor = T.encre; b.style.fontWeight = '700'; }
    d.appendChild(b); }
  return d; })()`;

const RANGEES = {
  // n° 1 : la pastille de moment du plateau écrit au premier toucher, son chevron promet un menu.
  moment: {
    etat: 'maquette', themes: ['clair'],
    cadre: ['#fer-bal'], marges: { haut: 12, bas: 12 },
    options: {
      'a-tour': `document.querySelector('.fer-bmo svg').outerHTML = ${JSON.stringify(TOUR)};`,
      'b-trois': `(() => { const bh = document.querySelector('.fer-bh'); const seg = ${SEGMENT('.fer-bmo', ['empâtage', 'ébullition', 'fermentation'], 'empâtage')};
        seg.style.margin = '2px 0 4px'; document.querySelector('.fer-bh .fer-del').style.marginLeft = 'auto'; document.querySelector('.fer-bh .fer-bmo').remove(); bh.insertAdjacentElement('afterend', seg); })()`,
      'c-menu': MENU('.fer-bh .fer-bmo', ['empâtage', 'ébullition', 'fermentation'], 'empâtage') + `; document.querySelector('.fer-bal').style.overflow = 'visible';`,
    },
    cadreOption: { 'c-menu': ['#fer-bal', '[role="menu"]'] },
  },
  // n° 13 : « Grain ⇄ » fait tourner cinq familles sans les montrer.
  famille: {
    etat: 'maquette', themes: ['clair'],
    cadre: ['.fer-aj'], marges: { haut: 10, bas: 10 },
    options: {
      'a-cinq': `(() => { const seg = ${SEGMENT('.fer-fam', ['Grain', 'Sucre', 'Lactose', 'Fruit', 'Extrait'], 'Grain')};
        seg.style.margin = '0 0 8px'; seg.style.gap = '5px'; for (const b of seg.children) { b.style.paddingInline = '10px'; }
        document.querySelector('.fer-fam').remove(); document.querySelector('.fer-aj').insertAdjacentElement('afterbegin', seg); })()`,
      'b-menu': MENU('.fer-fam', ['Grain', 'Sucre', 'Lactose', 'Fruit', 'Extrait'], 'Grain') + `; document.querySelector('.fer-aj').style.overflow = 'visible';`,
    },
    cadreOption: { 'b-menu': ['.fer-aj', '[role="menu"]'] },
  },
  // n° 11 : la famille « Lactose » répète le nom de la ligne Lactose.
  lactose: {
    etat: 'huit', themes: ['clair'],
    cadre: ['[data-sel="6"]', '[data-sel="7"]'], marges: { haut: 0, bas: 6 },
    options: {
      'a-sans': `document.querySelector('[data-sel="7"] .fer-tag').remove();`,
      'b-sucre-de-lait': `document.querySelector('[data-sel="7"] .fer-tag').textContent = 'Sucre de lait';`,
    },
  },
  // N3 : un nom de 70 lettres passe sous la masse et sort de l'écran.
  long: {
    etat: 'maquette', themes: ['clair'],
    prep: async (p) => { await taper(p, 'Château Pilsen 2RS malt de base belge pour lager claire, lot automne'); await dormir(400); await p.keyboard.press('Escape').catch(() => {}); await dormir(300); },
    cadre: ['[data-sel="2"]', '[data-sel="3"]'], marges: { haut: 6, bas: 8 }, second: { nom: 'plateau', cadre: ['.fer-bal'] },
    options: {
      'a-coupe': `(() => { const b = document.querySelector('[data-sel="3"] .fer-nom b'), nm = document.querySelector('[data-sel="3"] .fer-nm'), bt = document.querySelector('[data-sel="3"] .fer-nom');
        for (const e of [nm, bt]) { e.style.minWidth = '0'; e.style.overflow = 'hidden'; e.style.maxWidth = '100%'; }
        b.style.cssText += ';display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%';
        const h = document.querySelector('.fer-bh b'); h.style.cssText += ';white-space:normal;overflow-wrap:anywhere;min-width:0;flex:1 1 0;line-height:1.2'; })()`,
      'b-deux': `(() => { const b = document.querySelector('[data-sel="3"] .fer-nom b'), nm = document.querySelector('[data-sel="3"] .fer-nm'), bt = document.querySelector('[data-sel="3"] .fer-nom');
        for (const e of [nm, bt]) { e.style.minWidth = '0'; e.style.maxWidth = '100%'; }
        b.style.cssText += ';display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;white-space:normal;overflow:hidden;line-height:1.2;text-align:left';
        bt.style.whiteSpace = 'normal'; bt.style.textAlign = 'left'; bt.style.height = 'auto'; bt.style.margin = '0';
        const h = document.querySelector('.fer-bh b'); h.style.cssText += ';white-space:normal;overflow-wrap:anywhere;min-width:0;flex:1 1 0;line-height:1.2'; })()`,
    },
  },
  // N4, le reste : « -1 » est refusé en rouge ; seule une infobulle dit pourquoi.
  negatif: {
    etat: 'couleurs', themes: ['clair', 'cave'],
    prep: async (p) => {
      await toucher(p, '[data-role="kg-ligne"][data-kl="0"]');
      await p.keyboard.down('Control'); await p.keyboard.press('KeyA'); await p.keyboard.up('Control'); await p.keyboard.press('Backspace');
      await p.keyboard.type('-1', { delay: 15 }); await dormir(300);
    },
    cadre: ['[data-sel="0"]', '[data-sel="1"]'], marges: { haut: 8, bas: 8 },
    options: {
      'a-bulle': `(() => { const T = ${TEINTES}; const kg = document.querySelector('[data-sel="0"] .fer-kg'); const r = kg.getBoundingClientRect();
        const li = document.querySelector('[data-sel="0"]'); li.style.position = 'relative'; li.style.overflow = 'visible'; const lr = li.getBoundingClientRect();
        const b = document.createElement('p'); b.setAttribute('role', 'alert'); b.textContent = 'Pas de masse négative : 5,0 kg gardé';
        b.style.cssText = 'position:absolute;z-index:20;right:' + (lr.right - r.right) + 'px;top:' + (r.bottom - lr.top + 4) + 'px;margin:0;padding:5px 10px;border-radius:8px;font-size:14px;font-weight:600;white-space:nowrap;background:' + T.encre + ';color:' + (T.page) + ';box-shadow:0 4px 12px rgb(0 0 0 / 20%)';
        li.appendChild(b); })()`,
      'b-zero': `new Promise((fin) => { document.activeElement && document.activeElement.blur(); setTimeout(() => {
        const t = document.querySelector('[data-role="kg-ligne"][data-kl="0"]'); t.value = '0'; t.removeAttribute('aria-invalid'); t.style.width = '1.6ch';
        const z = document.querySelector('.fer-bal [data-role="bin"]'); if (z) z.value = '0';
        t.style.color = /cave/.test(localStorage.getItem('laffinee.theme')) ? '#e3b552' : '#8a6100'; // l'or « à compléter » de la base (0 kg d'une ligne neuve)
        const pn = document.querySelector('[data-sel="0"] .fer-pn'); if (pn) pn.textContent = '0';
        const bar = document.querySelector('[data-bar="0"]'); if (bar) bar.style.width = '0%'; const po = document.querySelector('[data-po="0"]'); if (po) po.style.left = '0%'; fin(); }, 500); })`,
    },
  },
  // n° 10 : à 1280, le titre devient « Nouvelle recette » et le fil prend les noms longs ; à 390, « Fermentescibles 2/7 » et « Malts/sucres ».
  noms: {
    etat: 'maquette', themes: ['clair'], largeur: 1280, hauteur: 800,
    cadre: ['h1', 'nav[aria-label="Étapes"]'], marges: { haut: 12, bas: 76 }, x0: 250, x1: 1030,
    options: {
      'a-comme-390': `(() => { const h = [...document.querySelectorAll('h1')].pop(); h.innerHTML = 'Fermentescibles <span style="font-weight:400;opacity:.65">2/7</span>';
        const court = { 'Fermentescibles': 'Malts/sucres', 'Eau et sels': 'Eau', 'Récapitulatif': 'Récap.' };
        for (const s of document.querySelectorAll('nav[aria-label="Étapes"] button > span:first-child')) if (court[s.textContent.trim()]) s.textContent = court[s.textContent.trim()]; })()`,
      'b-un-mot': `(() => { const h = [...document.querySelectorAll('h1')].pop(); h.innerHTML = 'Fermentescibles <span style="font-weight:400;opacity:.65">2/7</span>'; })()`,
      'c-recette': `(() => { const h = [...document.querySelectorAll('h1')].pop(); h.innerHTML = 'Nouvelle recette <span style="font-weight:400;opacity:.65">· Malts/sucres 2/7</span>';
        const court = { 'Fermentescibles': 'Malts/sucres', 'Eau et sels': 'Eau', 'Récapitulatif': 'Récap.' };
        for (const s of document.querySelectorAll('nav[aria-label="Étapes"] button > span:first-child')) if (court[s.textContent.trim()]) s.textContent = court[s.textContent.trim()]; })()`,
    },
  },
  // n° 15 : à 1280 (800 de haut), huit lignes et le plateau : « Retour » et « Suivant » sont sous le bas de l'écran.
  pied: {
    etat: 'huit', themes: ['clair'], largeur: 1280, hauteur: 800, ecran: true,
    options: {
      'a-colle': `(() => { const T = ${TEINTES}; const d = document.querySelector('[data-page-end-actions]'); const r = d.getBoundingClientRect();
        const c = d.cloneNode(true); c.style.cssText = 'position:fixed;z-index:99999;bottom:0;left:' + r.left + 'px;width:' + r.width + 'px;margin:0;padding:8px 64px 4px 0;background:' + T.page + ';box-shadow:0 -1px 0 ' + T.trait;
        document.body.appendChild(c); })()`,
      'b-en-haut': `(() => { const s = [...document.querySelectorAll('button')].find((b) => /^Suivant — Houblons$/.test(b.textContent.trim()));
        const h = [...document.querySelectorAll('h1')].pop(); const r = h.getBoundingClientRect(); const ab = [...document.querySelectorAll('button, a')].find((b) => /Abandonner/.test(b.textContent));
        const c = s.cloneNode(true); c.style.cssText = 'position:fixed;z-index:99999;top:' + (r.top - 6) + 'px;left:' + ((ab ? ab.getBoundingClientRect().left : 900) - 190) + 'px';
        document.body.appendChild(c); })()`,
    },
  },
};

const choisis = process.argv.slice(2);
for (const [id, R] of Object.entries(RANGEES)) {
  if (choisis.length && !choisis.includes(id)) continue;
  for (const theme of R.themes) {
    const suffixe = theme === 'cave' ? '-cave' : '';
    for (const opt of ['auj', ...Object.keys(R.options)]) {
      const largeur = R.largeur ?? 390;
      const { nav, p } = await ouvrir(BUILD, { etat: R.etat, theme, largeur, hauteur: R.hauteur ?? (largeur < 700 ? 1400 : 800) });
      try {
        if (largeur >= 700 && !R.ecran) { await p.setViewport({ width: largeur, height: R.hauteur ?? 800, deviceScaleFactor: 2 }); await dormir(300); }
        if (R.prep) await R.prep(p);
        if (opt !== 'auj') { await p.evaluate(R.options[opt]); await dormir(250); }
        const nom = path.join(IMG, `f-${id}-${opt}${suffixe}.png`);
        if (R.ecran) await p.screenshot({ path: nom });
        else {
          const c = await cadrer(p, (R.cadreOption?.[opt]) ?? R.cadre, { ...R.marges, x0: R.x0, x1: R.x1 });
          await p.screenshot({ path: nom, clip: c });
          if (R.second) {
            const c2 = await cadrer(p, R.second.cadre, { haut: 8, bas: 8 });
            await p.screenshot({ path: nom.replace('.png', `-${R.second.nom}.png`), clip: c2 });
          }
        }
        console.log('écrit', path.basename(nom));
      } catch (e) { console.log('ECHEC', id, opt, theme, e.message.slice(0, 200)); }
      await nav.close();
    }
  }
}
