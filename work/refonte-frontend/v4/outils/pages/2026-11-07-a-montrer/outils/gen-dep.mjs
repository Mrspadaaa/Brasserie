// Mini maquettes « à lui montrer » de la Dépense (B2 n° 3, 6, 7, 10, 11, 13, 18, 19, 20), 07.11.
// Chaque vignette part du vrai écran (build figé %TEMP%/depense-b2-apres, états SIMULÉS d'apercuDev.ts, aucune vraie pièce), à 390 tactile :
// « aujourd'hui » est capturé tel quel ; une option ne change qu'un facteur, posé en HTML sur le DOM de l'app (mêmes classes Tailwind de
// l'écran, mêmes tailles), puis recadré sur la rangée concernée. Aucune écriture hors de ce dossier.
// Usage (racine du dépôt) : node work/refonte-frontend/v4/outils/pages/2026-11-07-a-montrer/outils/gen-dep.mjs [id…]
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { ouvrirEtat, dormir } from '../../../../../../missions/2026-10-31-ecran-depense/banc-b2/scenes.mjs';
import { ouvrirLigne, numeroLigne, saisir, uniteChoisir } from '../../../../../../missions/2026-10-31-ecran-depense/banc-b2/aide-b2.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire(path.resolve(ICI, '../../../../../../../package.json'))('puppeteer-core');
const IMG = path.resolve(ICI, '..', 'img');
const BUILD = path.join(process.env.TEMP, 'depense-b2-apres');

/** Recadre sur l'union des sélecteurs (marges en px), toute la largeur de l'écran. */
async function cadrer(p, sels, { haut = 8, bas = 8 } = {}) {
  return p.evaluate((sels, haut, bas) => {
    const els = sels.flatMap((s) => [...document.querySelectorAll(s)]).filter((e) => e.getClientRects().length);
    if (!els.length) throw new Error('rien à cadrer : ' + sels.join(', '));
    els[0].scrollIntoView({ block: 'start' });
    let n = els[0].parentElement; while (n && !(n.scrollHeight > n.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(n).overflowY))) n = n.parentElement;
    if (n) n.scrollTop -= haut + 70; // sous l'en-tête collant de la bande
    const rs = els.map((e) => e.getBoundingClientRect());
    const t = Math.max(0, Math.min(...rs.map((r) => r.top)) - haut), b = Math.max(...rs.map((r) => r.bottom)) + bas;
    return { x: 0, y: t, width: innerWidth, height: b - t };
  }, sels, haut, bas);
}

// ---- Gestes de préparation (vrais gestes dans l'app) ----
const marquer = (p, nom, id) => p.evaluate((nom, id) => { const a = [...document.querySelectorAll('[data-dp-ligne]')].find((a) => a.querySelector('summary')?.innerText.includes(nom)); a?.setAttribute('data-am', id); }, nom, id);
const quantite = async (p, nom, v) => { const n = await numeroLigne(p, nom); return saisir(p, `[aria-label="Quantité ligne ${n}"]`, v); };
const montant = async (p, nom, v) => { const n = await numeroLigne(p, nom); return saisir(p, `[aria-label="Montant ligne ${n}"]`, v); };

// ---- Options : fonctions jouées dans la page (autonomes), avec leur argument ----
/** n° 6 : le prix calculé, au champ et à la rangée. */
function prix(v) {
  const a = document.querySelector('[data-am="w"]'); const px = a.querySelector('[aria-label^="Prix ligne"]'); px.value = v; px.style.width = (v.length + 3.2) + 'ch';
  const sm = a.querySelector('summary'); sm.querySelector('[data-dp-prix]').textContent = v;
}
/** n° 3, b : convertir 2 Kg en 2000 g (le prix passe au gramme). */
function convertir() {
  const a = document.querySelector('[data-am="w"]');
  const q = a.querySelector('[aria-label^="Quantité ligne"]'), px = a.querySelector('[aria-label^="Prix ligne"]');
  for (const t of [q, px]) t.className = t.className.replace(/!border-dashed|!border-alert/g, '');
  q.value = '2000'; q.style.width = '5.4rem'; px.value = '0,00155'; px.style.width = '6.6rem';
  for (const e of [...a.querySelectorAll('[data-dp-corps] *')]) if (e.children.length === 0 && /^(quantité|prix) à remplir$/.test(e.innerText.trim())) e.remove();
  for (const d of [...a.querySelectorAll('[data-dp-corps] div')]) if (/^\+1\s/.test(d.innerText.trim()) && d.querySelectorAll('button').length >= 4) d.remove();
  for (const d of [...a.querySelectorAll('[data-dp-corps] div')]) if (d.children.length === 0 && !d.innerText.trim()) d.remove();
  const sm = a.querySelector('summary');
  sm.querySelector('.dp-p3c-dq').innerHTML = '<span data-dp-qte="true" class="font-semibold">2000 g</span><i>×</i><span data-dp-prix="true">0,00155</span>';
  for (const s of a.querySelectorAll('[data-dp-duel] span')) {
    const t = s.innerText.trim();
    if (t === 'au stock') s.textContent = 'après réception';
    if (/^1 Kg$/.test(t)) s.textContent = '1 → 3 Kg';
    if (/^compté en/.test(t)) s.textContent = 'compté en Kg';
  }
  const f = a.querySelector('[data-dp-duel] > div'); const der = f?.lastElementChild; if (der) { der.className = 'text-xs text-cave-400'; der.textContent = '2 Kg = 2000 g'; }
}
/** n° 3, c : la question posée sur la ligne, deux boutons. */
function demander() {
  const a = document.querySelector('[data-am="w"]');
  for (const e of [...a.querySelectorAll('[data-dp-corps] *')]) if (e.children.length === 0 && /^(quantité|prix) à remplir$/.test(e.innerText.trim())) e.remove();
  for (const d of [...a.querySelectorAll('[data-dp-corps] div')]) if (/^\+1\s/.test(d.innerText.trim()) && d.querySelectorAll('button').length >= 4) d.remove();
  for (const d of [...a.querySelectorAll('[data-dp-corps] div')]) if (d.children.length === 0 && !d.innerText.trim()) d.remove();
  const q = a.querySelector('[aria-label^="Quantité ligne"]'), px = a.querySelector('[aria-label^="Prix ligne"]');
  for (const t of [px]) t.className = t.className.replace(/!border-dashed|!border-alert/g, '');
  q.value = '2'; px.value = '1,55';
  const d = document.createElement('div'); d.className = 'flex flex-wrap items-center gap-1.5 rounded-control border border-dashed border-attention px-2 py-1.5 text-sm text-attention';
  d.innerHTML = '<span class="min-w-0 flex-1">2 Kg, en grammes ?</span><button type="button" class="min-h-7 rounded-control border border-ebc-straw bg-ebc-straw px-2.5 text-sm font-semibold text-cave-950">Convertir : 2000 g</button><button type="button" class="min-h-7 rounded-control border border-cave-600 px-2.5 text-sm text-cave-200">Vider</button>';
  a.querySelector('[data-dp-calcul]').insertAdjacentElement('afterend', d);
  a.querySelector('summary .dp-p3c-dq').innerHTML = '<span data-dp-qte="true" class="font-semibold rounded-control border border-dashed border-attention px-0.5 text-attention">2 ?</span><i>×</i><span data-dp-prix="true">1,55</span>';
}
/** n° 7 : la puce de mouture et la sous-ligne de prix au kilo, reprises de la rangée Pilsner Malz rattachée (mêmes classes). */
function mouture({ puce, classePuce, sous, classeSous }) {
  const sm = document.querySelector('[data-am="w"] summary');
  const pil = [...document.querySelectorAll('[data-dp-ligne]')].find((l) => l.querySelector('summary')?.innerText.includes('Pilsner')).querySelector('summary');
  const c = pil.querySelector('[data-dp-mouture]').cloneNode(true);
  c.className = c.className.split(/\s+/).filter((k) => !/^border|^text-cave/.test(k)).join(' ') + ' ' + classePuce; c.textContent = puce;
  sm.querySelector('.dp-p3c-dq').insertAdjacentElement('beforebegin', c);
  const s = document.createElement('span'); s.className = classeSous; s.textContent = sous;
  sm.querySelector('[data-dp-nom]').parentElement.insertAdjacentElement('afterend', s);
}
/** n° 10 : le segment « Plié » allumé, rien d'autre. */
function plieAllume() { const b = document.querySelector('[data-dp-plier-bouton="plie"]'); b.className = b.className.replace('text-cave-200', 'bg-ebc-straw text-cave-950'); b.setAttribute('aria-pressed', 'true'); }
/** n° 11 : la ligne retirée reste à sa place, grisée, avec son geste de retour. */
function retiree({ bouton, mot, barree }) {
  const w = document.querySelector('[data-am="w"]'); const r = document.createElement('div');
  r.className = 'dp-p3c-r flex items-center gap-1.5 px-2.5 min-h-7 py-1.5 text-sm text-cave-400 border-t border-cave-800';
  r.innerHTML = '<span class="min-w-0 flex-1 ' + (barree ? 'line-through' : '') + '">Haferflocken <span class="font-mono">2 Kg × 2,50</span></span><span class="text-sm">' + mot + '</span>' + bouton;
  w.insertAdjacentElement('afterend', r);
}
/** n° 13, a : « -1 » refusé, lisible en rouge, la quantité d'avant gardée et dite. */
function refus() {
  const a = document.querySelector('[data-am="w"]'); const q = a.querySelector('[aria-label^="Quantité ligne"]'); q.value = '-1'; q.setAttribute('aria-invalid', 'true'); q.className += ' !text-alert';
  a.querySelector('[aria-label^="Montant ligne"]').value = '3,10';
  const sm = a.querySelector('summary'); const qt = sm.querySelector('[data-dp-qte]'); qt.className = 'font-semibold'; qt.textContent = '2 Kg'; sm.querySelector('[data-dp-montant]').textContent = '3,10';
  const m = document.createElement('p'); m.setAttribute('role', 'alert'); m.className = 'text-sm text-alert'; m.textContent = 'Pas de quantité négative : 2 Kg gardés.';
  a.querySelector('[data-dp-calcul]').insertAdjacentElement('afterend', m);
}
/** n° 13, b : « -1 » vide la quantité, marquée « à remplir ». */
function vide() {
  const a = document.querySelector('[data-am="w"]'); a.querySelector('[aria-label^="Quantité ligne"]').value = ''; a.querySelector('[aria-label^="Montant ligne"]').value = '';
  const sm = a.querySelector('summary'); sm.querySelector('[data-dp-qte]').textContent = '?'; sm.querySelector('[data-dp-montant]').textContent = '—';
  const m = document.createElement('p'); m.className = 'flex flex-wrap gap-1'; m.innerHTML = '<span class="rounded-control border border-dashed border-alert px-1.5 text-sm text-alert">quantité à remplir</span>';
  a.querySelector('[data-dp-calcul]').insertAdjacentElement('afterend', m);
}
/** n° 18 : les quatre puces « … à remplir » retirées (et remplacées par une phrase en b). */
function puces(phrase) {
  const a = document.querySelector('[data-am="n"]');
  const ps = [...a.querySelectorAll('*')].filter((e) => e.children.length === 0 && /^(libellé|quantité|prix|montant) à remplir$/.test(e.innerText.trim()));
  const boite = ps[0]?.parentElement; for (const e of ps) e.remove();
  if (boite) { if (phrase) boite.insertAdjacentHTML('afterend', phrase); if (!boite.children.length) boite.remove(); }
}
/** n° 19 : le menu « Famille » quitte le pied ; un lien le remplace (« plus » ou le nom de la bande), ouvert ou non. */
function pied({ lien, ouvert }) {
  const pd = document.querySelector('[data-am-pied]'); const s = pd.querySelector('select');
  let n = s; while (n.parentElement && n.parentElement !== pd) n = n.parentElement;
  const etiquette = [...pd.querySelectorAll('*')].find((e) => e.children.length === 0 && e.innerText.trim() === 'Famille');
  const garde = s.cloneNode(true); garde.value = s.value;
  if (etiquette && etiquette !== n && !n.contains(etiquette)) etiquette.remove();
  n.insertAdjacentHTML('beforebegin', lien); n.remove();
  if (ouvert === 'menu') {
    const d = document.createElement('div'); d.className = 'flex items-center gap-2 border-t border-cave-800 pt-1.5 text-sm text-cave-400'; d.setAttribute('data-am-pied', '2');
    const l = document.createElement('span'); l.textContent = 'Famille'; d.append(l, garde); garde.style.flex = '1'; pd.insertAdjacentElement('afterend', d);
  }
  if (ouvert === 'pastilles') {
    const d = document.createElement('div'); d.className = 'flex flex-wrap gap-1.5 pt-1'; d.setAttribute('data-am-pied', '2');
    d.innerHTML = ['Malts', 'Houblons', 'Levures', 'Sucres', 'Autres'].map((t) => '<button type="button" class="min-h-7 rounded-control border px-2.5 text-sm ' + (t === 'Malts' ? 'border-ebc-straw bg-ebc-straw font-semibold text-cave-950' : 'border-cave-600 text-cave-200') + '">' + t + '</button>').join('');
    pd.insertAdjacentElement('afterend', d);
  }
}
/** n° 20 : les mots du message et du bouton. */
function relire({ message, bouton }) {
  document.querySelector('[data-dp="alertes"] [role="alert"]').textContent = message;
  [...document.querySelectorAll('[data-dp="erreur-lecture"] button')].find((x) => /^Relire$/.test(x.innerText.trim())).textContent = bouton;
}

const BTN_ANNULER = '<button type="button" class="min-h-7 shrink-0 rounded-control border border-ebc-straw bg-ebc-straw px-2.5 text-sm font-semibold text-cave-950">Annuler</button>';
const BTN_RETABLIR = '<button type="button" class="min-h-7 shrink-0 rounded-control border border-cave-600 px-2.5 text-sm text-cave-200">↶ Rétablir</button>';
const MSG = "Lecture en morceaux incomplète : la partie 2 sur 3 n'a pas été lue.";
const FIN = ' Pièce peu lisible ? Reprends une photo plus nette, ou saisis les valeurs à la main.';

const RANGEES = {
  // n° 6 : 10,00 posés sur 3 Kg : le prix calculé s'écrit 3,3333 (4 décimales), « = 10,00 » passe à la ligne.
  prix: {
    etat: '3', themes: ['clair'],
    prep: async (p) => { await ouvrirLigne(p, 'Weizenmalz'); await quantite(p, 'Weizenmalz', '3'); await montant(p, 'Weizenmalz', '10'); await marquer(p, 'Weizenmalz', 'w'); },
    cadre: ['[data-am="w"] summary', '[data-am="w"] [data-dp-calcul]'],
    options: { 'a-trois': [prix, '3,333'], 'b-deux': [prix, '3,33'] },
  },
  // n° 3 : Kg → g : la quantité est vidée et marquée « à remplir » (garde-fou) ; convertir ou vider reste à lui.
  unite: {
    etat: '3', themes: ['clair'],
    prep: async (p) => { await ouvrirLigne(p, 'Weizenmalz'); await uniteChoisir(p, 'Weizenmalz', 'g'); await marquer(p, 'Weizenmalz', 'w'); },
    cadre: ['[data-am="w"] summary', '[data-am="w"] [data-dp-duel]'],
    options: { 'b-convertir': [convertir], 'c-demander': [demander] },
  },
  // n° 7 : mouture rattachée, quantité du malt changée (2 → 3) : la mouture quitte la rangée en silence et part dans « Services ».
  mouture: {
    etat: '3', themes: ['clair', 'cave'],
    prep: async (p) => {
      await p.evaluate(() => document.querySelector('[data-dp-mouture-tous]')?.click()); await dormir(500);
      await ouvrirLigne(p, 'Weizenmalz'); await quantite(p, 'Weizenmalz', '3'); await marquer(p, 'Weizenmalz', 'w');
      await p.evaluate(() => { const d = document.querySelector('[data-am="w"] details'); if (d) d.open = false;
        const sv = [...document.querySelectorAll('[data-dp-bande]')].find((b) => /Services/.test(b.querySelector('[data-dp-bande-entete]')?.innerText || '')); sv?.setAttribute('data-am-services', '1'); });
      await dormir(300);
    },
    cadre: ['[data-am="w"] summary'], marges: { haut: 62, bas: 62 },
    options: {
      'a-marque': [mouture, { puce: '✓ 0,20', classePuce: 'border-[1.5px] border-dashed border-attention text-attention', sous: 'mouture : 2 Kg ≠ 3 Kg', classeSous: 'rounded-control border border-dashed border-attention px-1.5 text-xs leading-[18px] text-attention' }],
      'b-suit': [mouture, { puce: '✓ 0,30', classePuce: 'border border-cave-600 text-cave-200', sous: '✓ 1,65/Kg', classeSous: 'rounded-control bg-cave-800 px-1.5 text-xs leading-[18px] text-hop' }],
    },
    second: { nom: 'services', cadre: ['[data-am-services]'], seulement: ['auj'] },
  },
  // n° 10 : `renovation` à l'arrivée : les sous-familles de Rénovation repliées (sa maquette D), aucun des deux boutons allumé.
  renovation: {
    etat: 'renovation', themes: ['clair'], ecran: true,
    options: { 'a-plie': [plieAllume], 'b-deplie': [() => new Promise((fin) => { document.querySelector('[data-dp-plier-bouton="deplie"]').click(); setTimeout(fin, 700); })] },
  },
  // n° 11 : « supprimer » retire la ligne au premier toucher, sans retour.
  supprimer: {
    etat: '3', themes: ['clair', 'cave'],
    prep: async (p) => {
      await ouvrirLigne(p, 'Haferflocken');
      await p.evaluate(() => { const a = [...document.querySelectorAll('[data-dp-ligne]')].find((a) => a.querySelector('summary')?.innerText.includes('Haferflocken')); [...a.querySelectorAll('button')].find((b) => /Retirer la ligne|supprimer/i.test(b.getAttribute('aria-label') || b.innerText))?.click(); });
      await dormir(600); await marquer(p, 'Weizenmalz', 'w');
    },
    cadre: ['[data-am="w"] summary'], marges: { haut: 62, bas: 80 },
    options: { 'a-annuler': [retiree, { bouton: BTN_ANNULER, mot: 'retirée', barree: false }], 'b-retablir': [retiree, { bouton: BTN_RETABLIR, mot: 'jusqu’à Confirmer', barree: true }] },
  },
  // n° 13 : « -1 » tapé en quantité devient 0.
  bornes: {
    etat: '3', themes: ['clair', 'cave'],
    prep: async (p) => { await ouvrirLigne(p, 'Weizenmalz'); await quantite(p, 'Weizenmalz', '-1'); await marquer(p, 'Weizenmalz', 'w'); },
    cadre: ['[data-am="w"] summary', '[data-am="w"] [data-dp-calcul]'], marges: { haut: 8, bas: 40 },
    options: { 'a-refus': [refus], 'b-vide': [vide] },
  },
  // n° 18 : la ligne ajoutée porte neuf marques rouges.
  ajout: {
    etat: '3', themes: ['clair', 'cave'],
    prep: async (p) => { await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => /Ajouter une ligne/.test(b.innerText))?.click()); await dormir(700);
      await p.evaluate(() => { const ls = [...document.querySelectorAll('[data-dp-ligne]')]; (ls.find((l) => l.querySelector('details[open]')) || ls[ls.length - 1]).setAttribute('data-am', 'n'); }); },
    cadre: ['[data-am="n"]'],
    options: { 'a-champs': [puces, ''], 'b-phrase': [puces, '<p class="text-sm text-alert">À remplir : libellé, quantité, prix, montant.</p>'] },
  },
  // n° 19 : « Famille » est un menu natif visible dans le pied du plateau (D364 : sous « plus »).
  famille: {
    etat: '3', themes: ['clair'],
    prep: async (p) => { await ouvrirLigne(p, 'Weizenmalz'); await marquer(p, 'Weizenmalz', 'w'); await p.evaluate(() => { const s = document.querySelector('[data-am="w"] select'); let n = s; while (n && !(n.innerText || '').includes('supprimer')) n = n.parentElement; n?.setAttribute('data-am-pied', '1'); }); },
    cadre: ['[data-am="w"] [data-dp-stock]', '[data-am-pied]'], marges: { haut: 8, bas: 10 },
    options: {
      'a-plus': [pied, { lien: '<button type="button" class="inline-flex min-h-7 items-center gap-1 px-1 text-sm text-cave-400">plus <span aria-hidden="true">›</span></button>' }],
      'a-plus-ouvert': [pied, { lien: '<button type="button" aria-expanded="true" class="inline-flex min-h-7 items-center gap-1 px-1 text-sm font-semibold text-cave-200">plus <span aria-hidden="true">⌄</span></button>', ouvert: 'menu' }],
      'b-lien': [pied, { lien: '<button type="button" class="inline-flex min-h-7 items-center gap-1 px-1 text-sm text-cave-400">famille : <b class="font-medium text-cave-50">Malts</b> <span aria-hidden="true">›</span></button>' }],
      'b-lien-ouvert': [pied, { lien: '<button type="button" aria-expanded="true" class="inline-flex min-h-7 items-center gap-1 px-1 text-sm text-cave-200">famille : <b class="font-semibold text-cave-50">Malts</b> <span aria-hidden="true">⌄</span></button>', ouvert: 'pastilles' }],
    },
  },
  // n° 20 : `difficile` : le message dit « Réessaie », le bouton dit « Relire », sans dire ce qu'il relit.
  relire: {
    etat: 'difficile', themes: ['clair'],
    cadre: ['[data-dp="alertes"]', '[data-dp="erreur-lecture"]'], marges: { haut: 8, bas: 8 },
    options: {
      'a-partie': [relire, { message: MSG + FIN, bouton: 'Relire la partie 2' }],
      'b-dit': [relire, { message: MSG + ' « Relire » reprend les 3 parties.' + FIN, bouton: 'Relire' }],
    },
  },
};

const choisis = process.argv.slice(2);
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
for (const [id, R] of Object.entries(RANGEES)) {
  if (choisis.length && !choisis.includes(id)) continue;
  for (const theme of R.themes) {
    const suffixe = theme === 'cave' ? '-cave' : '';
    for (const opt of ['auj', ...Object.keys(R.options)]) {
      let p;
      try {
        p = await ouvrirEtat(nav, BUILD, R.etat, 't390', theme);
        if (!R.ecran) { await p.setViewport({ width: 390, height: 1400, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); await dormir(400); }
        if (R.prep) await R.prep(p);
        if (opt !== 'auj') { const [fn, arg] = R.options[opt]; await p.evaluate(fn, arg); await dormir(300); }
        const nom = path.join(IMG, `d-${id}-${opt}${suffixe}.png`);
        if (R.ecran) await p.screenshot({ path: nom });
        else {
          await p.screenshot({ path: nom, clip: await cadrer(p, R.cadre, R.marges) });
          if (R.second && (!R.second.seulement || R.second.seulement.includes(opt))) await p.screenshot({ path: nom.replace('.png', `-${R.second.nom}.png`), clip: await cadrer(p, R.second.cadre, { haut: 4, bas: 4 }) });
        }
        console.log('écrit', path.basename(nom));
      } catch (e) { console.log('ECHEC', id, opt, theme, e.message.slice(0, 300)); }
      await p?.close();
    }
  }
}
await nav.close();
