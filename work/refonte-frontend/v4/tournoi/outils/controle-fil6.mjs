// D57 à D60 (18.10, soir) : les remarques du brasseur sur les planches du lot 5, en contrôles
// sur des fils de fer statiques (pNN/comparer.html, comparer-radar.html, etat-b.html).
// Comparer, sur p03 : « ça manque d'intervalle de confiance, pourquoi il y a pas la partie arôme
// saveur aussi en comparaison ? » (D57, D58) ; « il manque quelque info, notamment la relation
// avec le style » (D59) ; « Pourquoi il y a parfois le truc noir pas toujours ?? » (D57 : le
// trait de mon lot pris pour le centre). Suggestions, sur p06 : « C'est vraiment difficile à
// lire » (D60).
// Usage : node work/refonte-frontend/v4/tournoi/outils/controle-fil6.mjs <dossier> [ids…]
//   --objet=comparer|suggestions (par défaut : d'après le nom du dossier)
// Imprime FIL6 OK, ou FIL6 ECHEC et la liste.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../../../../..');
const FICHES = JSON.parse(fs.readFileSync(path.join(root, 'prototypes/houblons-v4/data/pack-fiches.json'), 'utf8')).fichesHoublons;
const PACK = JSON.parse(fs.readFileSync(path.join(root, 'prototypes/houblons-v4/data/pack-mini-protos.json'), 'utf8'));
const STYLE = PACK.styles['16D'];
const FAMILLES = Object.keys(STYLE.families);

const dir = path.resolve(process.argv[2] || '.');
// --objet=libre : une page vue.html (ou --pages=a.html,b.html), contrôles communs seulement
// (texte de 12 px au moins, radars fermés D62) ; utile aux lots de vues nouvelles (radars par
// objet, échelles, classements, substitution).
const objet = (process.argv.find((a) => a.startsWith('--objet=')) || '').slice(8) || (/sugg/.test(dir) ? 'suggestions' : /comparer/.test(dir) ? 'comparer' : 'libre');
const only = process.argv.slice(3).filter((a) => !a.startsWith('--'));
const pagesArg = (process.argv.find((a) => a.startsWith('--pages=')) || '').slice(8);
const PAGES = pagesArg ? pagesArg.split(',') : objet === 'comparer' ? ['comparer.html', 'comparer-radar.html'] : objet === 'suggestions' ? ['etat-b.html', 'suggestions-radar.html'] : ['vue.html'];
const ids = (only.length ? only : fs.readdirSync(dir).filter((d) => /^[a-z]\d+$/.test(d)))
  .filter((d) => fs.existsSync(path.join(dir, d, PAGES[0]))).sort();

const fiche = (nom) => FICHES.find((f) => f.name === nom);
const milieu = (x) => (x && x.sources && x.sources.length ? x.sources.reduce((s, y) => s + (y.min + y.max) / 2, 0) / x.sources.length : null);
const centreAttendu = (nom, mesure) => {
  const f = fiche(nom); if (!f) return null;
  if (mesure === 'alpha') return milieu(f.alpha);
  if (mesure === 'beta') return milieu(f.beta);
  if (mesure === 'huiles') return milieu(f.huiles && f.huiles.totale);
  return null; // ratio et composants : non vérifiés ici
};

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const pb = [];
const p = (id, page, msg) => pb.push(id + ' ' + page + ' : ' + msg);

for (const id of ids) {
  for (const nomPage of PAGES) {
    const f = path.join(dir, id, nomPage);
    if (!fs.existsSync(f)) { p(id, nomPage, 'page absente'); continue; }
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(f).href, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 200));
    const m = await page.evaluate(() => {
      const vis = (e) => !!e && e.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true }) && e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().height > 0;
      const box = (e) => { const r = e.getBoundingClientRect(); return { top: r.top + scrollY, h: r.height, w: r.width }; };
      const sig = (e) => { const s = getComputedStyle(e); const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), s.backgroundColor, s.borderRadius, s.borderTopWidth].join('|'); };
      // Plus petit texte visible du premier écran.
      let mini = 99, miniTxt = '';
      const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let n = tw.nextNode(); n; n = tw.nextNode()) {
        if (!n.textContent.trim()) continue;
        const e = n.parentElement; if (!vis(e)) continue;
        const r = e.getBoundingClientRect(); if (r.top > 844 || r.bottom < 0) continue;
        const fs = parseFloat(getComputedStyle(e).fontSize);
        if (fs < mini) { mini = fs; miniTxt = n.textContent.trim().slice(0, 30); }
      }
      const plages = [...document.querySelectorAll('[data-plage]')].filter(vis).map((e) => {
        const c = e.querySelector('[data-role="central"]'); const l = e.querySelector('[data-role="lot"]');
        const rangee = e.closest('tr, li, [data-rangee]') || e.parentElement;
        const court = (e.dataset.houblon || '').split(' ')[0];
        return { h: e.dataset.houblon, mesure: e.dataset.mesure, min: +e.dataset.min, max: +e.dataset.max,
          // Le nom sur la barre, dans sa rangée, ou en tête de la colonne du houblon qui la contient.
          nomme: !!court && (((e.innerText || '') + ' ' + (rangee ? rangee.innerText : '')).includes(court)
            || [...document.querySelectorAll('[data-houblon-compare]')].some((c) => {
              if (!(c.innerText || '').includes(court)) return false;
              if (c.contains(e)) return true;
              // En-tête de colonne : au-dessus de la barre, et la barre dans sa largeur.
              const a = c.getBoundingClientRect(), b = e.getBoundingClientRect(), x = b.left + b.width / 2;
              return a.bottom <= b.top + 1 && x >= a.left && x <= a.right;
            })),
          central: c && vis(c) ? +c.dataset.valeur : null, sigC: c && vis(c) ? sig(c) : null,
          lot: l ? { v: +l.dataset.valeur, origine: l.dataset.origine || '', vis: vis(l), sig: vis(l) ? sig(l) : null,
            nomme: /\b(lot|article)\b/i.test((l.innerText || '') + ' ' + (rangee ? rangee.innerText : '')) } : null };
      });
      const chiffres = ['ibu-recette', 'dose-equivalente'].flatMap((r) => [...document.querySelectorAll('[data-role="' + r + '"]')].map((e) => ({
        role: r, h: e.dataset.houblon, min: e.dataset.min, max: e.dataset.max, vis: vis(e), txt: e.innerText })));
      const aromes = [...document.querySelectorAll('[data-role="arome"]')].map((e) => ({
        h: e.dataset.houblon, fam: e.dataset.famille, niveau: e.dataset.niveau, sources: e.dataset.sources, de: e.dataset.de,
        statut: (e.closest('[data-statut-style]') || e.querySelector('[data-statut-style]') || {}).dataset?.statutStyle || '',
        vis: vis(e), top: box(e).top }));
      const houblons = [...document.querySelectorAll('[data-houblon-compare]')].map((e) => e.dataset.houblonCompare);
      const desc = [...document.querySelectorAll('[data-role="descripteurs"]')].filter(vis).map((e) => ({ h: e.dataset.houblon, txt: e.innerText.toLowerCase() }));
      const usage = [...document.querySelectorAll('[data-role="styles-usage"]')].filter(vis).map((e) => ({ h: e.dataset.houblon, txt: e.innerText }));
      const style = [...document.querySelectorAll('[data-role="style"][data-code="16D"]')].some(vis);
      const bande = [...document.querySelectorAll('[data-role="bande-style"][data-mesure="ibu"]')].filter(vis).map((e) => [+e.dataset.min, +e.dataset.max]);
      const objectifs = [...document.querySelectorAll('[data-role="objectif"]')].map((e) => e.dataset.famille);
      // Toutes les pistes visibles du premier écran, rattachées à leur famille (la leur ou celle
      // d'un parent), mesurées dans leur plus grande dimension (une piste peut être verticale).
      const pistes = [...document.querySelectorAll('[data-role="piste"]')].filter(vis).map((e) => {
        const r = e.getBoundingClientRect();
        return { fam: e.dataset.famille || e.closest('[data-famille]')?.dataset.famille || '', top: r.top + scrollY, long: Math.max(r.width, r.height) };
      });
      const reponses = [...document.querySelectorAll('[data-role="reponse"]')].filter(vis).map((e) => ({
        fam: e.dataset.famille, verdict: e.dataset.verdict, top: box(e).top, h: box(e).h, fs: parseFloat(getComputedStyle(e).fontSize), txt: e.innerText }));
      const effets = [...document.querySelectorAll('[data-role="effet"]')].filter(vis).map((e) => {
        const pi = e.querySelector('[data-role="piste"]');
        return { fam: e.dataset.famille, top: box(e).top, piste: pi && vis(pi) ? pi.getBoundingClientRect().width : 0,
          ea: e.dataset.ecartAvant, ep: e.dataset.ecartApres, txt: (e.innerText || '') + ' ' + ((e.closest('[data-voie]') || {}).innerText || '') };
      });
      // D62 : chaque série d'un radar (hors zone) est un polygone fermé sur tous ses axes.
      const radars = [...document.querySelectorAll('svg[data-radar]')].filter(vis).map((r) => {
        const axes = (r.getAttribute('data-axes') || '').split(',').filter(Boolean);
        return { axes: axes.length, series: [...r.querySelectorAll('[data-serie]')].filter((e) => e.getAttribute('data-serie') !== 'zone').map((e) => {
          const formes = (e.matches('path,polygon') ? [e] : [...e.querySelectorAll('path,polygon')]).map((x) => {
            if (x.tagName.toLowerCase() === 'polygon') return { n: x.points.numberOfItems, ferme: true };
            const d = x.getAttribute('d') || '';
            return { n: (d.match(/[ML]/gi) || []).length, ferme: /z\s*$/i.test(d.trim()) };
          });
          const v = (e.getAttribute('data-valeurs') || '').split(',');
          const traces = e.matches('path,polygon,polyline') ? [e] : [...e.querySelectorAll('path,polygon,polyline')];
          const tirets = traces.some((x) => { const d = getComputedStyle(x).strokeDasharray; return d && d !== 'none'; });
          const couleurs = traces.map((x) => getComputedStyle(x).stroke).filter((c) => c && c !== 'none');
          return { nom: e.getAttribute('data-serie'), tirets, couleurs, vides: v.filter((x) => x.trim() === '').length, n: v.length, formes, inconnues: (e.getAttribute('data-inconnues') || '').split(',').filter(Boolean), valeurs: v.map((x) => (x.trim() === '' ? null : Number(x))) };
        }),
        // D65, D66 : libellés du radar (familles et noms d'échelle), familles sans donnée.
        familles: axes,
        textes: [...r.querySelectorAll('text')].filter((t) => t.textContent.trim() && vis(t)).map((t) => {
          const b = t.getBoundingClientRect(), cs = getComputedStyle(t);
          return { t: t.textContent.trim(), x0: b.left, x1: b.right, y0: b.top, y1: b.bottom, couleur: cs.fill + '|' + cs.color, opacite: Number(cs.opacity) * Number(cs.fillOpacity || 1) };
        }),
        marquesInconnues: [...r.querySelectorAll('[data-inconnu]')].map((e) => e.getAttribute('data-inconnu')) };
      });
      const legendeInconnu = /inconnu|non situ|non décrit|pas de donnée|aucune fiche|n'en parle/i.test(document.body.innerText);
      return { radars, legendeInconnu, pistes, mini, miniTxt, plages, chiffres, aromes, houblons: [...new Set(houblons)], desc, usage, style, bande, objectifs, reponses, effets, hauteur: document.documentElement.scrollHeight };
    });
    await page.close();
    const q = (msg) => p(id, nomPage, msg);
    if (m.mini < 12) q('texte de ' + m.mini + ' px au premier écran (« ' + m.miniTxt + ' »), 12 au moins (D60)');
    if (/radar/.test(nomPage) && !m.radars.length) q('aucun radar visible (svg[data-radar]) (D62)');
    for (const r of m.radars) for (const s of r.series) {
      if (s.vides) q('radar, série « ' + s.nom + ' » : ' + s.vides + ' valeur(s) vide(s), le tracé saute des axes (D62)');
      if (!s.formes.some((f) => f.ferme && f.n >= r.axes)) q('radar, série « ' + s.nom + ' » sans polygone fermé sur les ' + r.axes + ' axes (D62)');
      // D39 (« Je m'attendais plus à qqch du genre mais plus cohérent ») : aucune série distinguée
      // par un trait en tirets ou pointillés ; on distingue par le remplissage et la couleur.
      if (s.tirets) q('radar, série « ' + s.nom + ' » en tirets ou pointillés (D39)');
      // D40 bis : l'orangé d'alerte (#c2410c, teinte 21°) n'appartient qu'à ma bière hors du style ;
      // aucune série ne prend une couleur saturée à 25° de teinte ou moins.
      for (const c of s.couleurs) {
        const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); if (!m) continue;
        const [r, g, b] = m.slice(1, 4).map((x) => x / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
        const sat = mx === 0 ? 0 : d / mx; if (sat < 0.35 || d === 0) continue;
        let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360;
        if (Math.abs(h - 21) <= 25 && !/bière|goût|dégust|alerte/i.test(s.nom)) { q('radar, série « ' + s.nom + ' » en ' + c + ', trop proche de l\'orangé d\'alerte (D40 bis)'); break; }
      }
    }
    // D66 (« Pourquoi il y a cité ? ») : un nom d'échelle n'est jamais collé au libellé d'une
    // famille, où il se lit comme sa valeur ; 24 px au moins entre les deux.
    // D65 (« souvent les spidergraph ne montre pas que certaines données sont inconnus et du coup
    // ont les traitements comme connue mais valeur à 0 ») : une famille sans donnée (data-inconnu,
    // data-inconnues d'une série, ou nulle dans toutes les séries) a un libellé distinct des
    // familles connues (couleur, opacité ou « ? »), et la page dit « inconnu », « non situé » ou
    // « non décrit ».
    const RE = { citrus: /agrume/i, tropical: /tropica/i, melon: /melon/i, stoneFruit: /noyau/i, pomeFruit: /pomme|pépin/i, berries: /baie|petits fruits/i, floral: /floral/i, herbal: /herbac/i, resin: /résin|boisé/i, spice: /épic/i, green: /végétal/i, earthy: /terreux/i };
    const ECHELLE = /^(à peine|faible|moyen|marqué|cité|non décrit|style|[+−-]?\s*\d+\s*(cran|crans|T)?|\d+)$/i;
    const gap = (a, b) => Math.max(0, Math.max(a.x0, b.x0) - Math.min(a.x1, b.x1), Math.max(a.y0, b.y0) - Math.min(a.y1, b.y1));
    for (const r of m.radars) {
      const axeTextes = r.textes.filter((x) => Object.values(RE).some((re) => re.test(x.t)));
      for (const e of r.textes.filter((x) => ECHELLE.test(x.t))) {
        const proche = axeTextes.map((a) => [a, gap(a, e)]).sort((u, v) => u[1] - v[1])[0];
        if (proche && proche[1] < 24) q('radar : le nom d\'échelle « ' + e.t + ' » est à ' + Math.round(proche[1]) + ' px du libellé « ' + proche[0].t + ' », il s\'y lit comme sa valeur (D66)');
      }
      const series = r.series.filter((s) => s.nom !== 'zone' && s.nom !== 'bande');
      const inconnues = new Set([...r.marquesInconnues, ...series.flatMap((s) => s.inconnues)]);
      // Sans marquage explicite, une famille nulle partout est réputée inconnue (citations « non
      // décrit ») ; si la page marque elle-même ses inconnus, un zéro est une donnée connue
      // (« pas senti » dans une grille de dégustation).
      if (series.length && !inconnues.size) r.familles.forEach((f, k) => { if (series.every((s) => !s.valeurs[k])) inconnues.add(f); });
      if (!inconnues.size) continue;
      if (!m.legendeInconnu) q('radar : ' + inconnues.size + ' famille(s) sans donnée et aucune légende « inconnu », « non situé » ou « non décrit » (D65)');
      const style = (f) => { const t = axeTextes.find((x) => RE[f] && RE[f].test(x.t)); return t ? t.couleur + '|' + Math.round(t.opacite * 10) + (/\?/.test(t.t) ? '|?' : '') : null; };
      const connus = r.familles.filter((f) => !inconnues.has(f)).map(style).filter(Boolean);
      for (const f of inconnues) {
        const s = style(f);
        if (s && connus.includes(s)) q('radar : la famille sans donnée « ' + f + ' » a le même libellé qu\'une famille connue, elle se lit comme un zéro (D65)');
      }
    }

    if (objet === 'comparer') {
      // D57 : un centre sur chaque barre, mon lot distinct et nommé, IBU et dose en plage.
      if (!m.plages.length) q('aucune barre-plage');
      for (const b of m.plages) {
        const lib = b.h + ' ' + b.mesure;
        if (!b.nomme) q(lib + ' : le nom du houblon n\'est pas sur sa barre (D51, point 1 : mieux que Beer Maverick)');
        if (b.central === null) { q(lib + ' : pas de trait de centre visible (D57)'); continue; }
        if (b.central < b.min - 0.05 || b.central > b.max + 0.05) q(lib + ' : centre ' + b.central + ' hors de la plage (D57)');
        const c = centreAttendu(b.h, b.mesure);
        if (c !== null && Math.abs(b.central - c) > Math.max(0.1, 0.05 * c)) q(lib + ' : centre ' + b.central + ' ≠ milieu moyen des sources ' + c.toFixed(2) + ' (D57)');
        if (b.lot && b.lot.vis) {
          if (b.lot.sig === b.sigC) q(lib + ' : mon lot et le centre ont la même marque (D57)');
          if (!/^(stock|article)$/.test(b.lot.origine)) q(lib + ' : data-origine du lot manquant (stock ou article) (D57)');
          if (!b.lot.nomme) q(lib + ' : la marque du lot n\'est pas nommée sur place (« lot », « article ») (D57)');
        }
      }
      if (nomPage === 'comparer.html') {
        const ch = m.chiffres.filter((c) => c.vis);
        if (!ch.some((c) => c.role === 'ibu-recette')) q('IBU dans ma recette absent');
        for (const c of ch) {
          if (!(c.min && c.max && +c.min < +c.max)) q(c.role + ' ' + c.h + ' : data-min / data-max manquants (D57)');
          else if (!/\d+(?:,\d+)?\s*[–-]\s*\d+/.test(c.txt)) q(c.role + ' ' + c.h + ' : plage non écrite (« ' + c.txt.replace(/\s+/g, ' ').slice(0, 30) + ' ») (D57)');
        }
        // D58 : arômes et saveur en Barres, 12 familles par houblon, honnêtes.
        const hs = m.houblons.length ? m.houblons : ['Nugget', 'East Kent Goldings', 'Fuggle'];
        for (const h of hs) {
          const fi = fiche(h); const a = m.aromes.filter((x) => x.h === h && x.vis);
          if (a.length < 12) { q(h + ' : ' + a.length + ' familles d\'arôme visibles en Barres, 12 attendues (D58)'); continue; }
          for (const fam of FAMILLES) {
            const x = a.find((y) => y.fam === fam); const ref = fi && fi.aromes.find((y) => y.family === fam);
            if (!x) { q(h + ' ' + fam + ' : famille absente (D58)'); continue; }
            if (ref && (+x.niveau !== ref.level || +x.sources !== ref.sources || +x.de !== ref.of)) q(h + ' ' + fam + ' : ' + x.niveau + ' (' + x.sources + '/' + x.de + ') ≠ fiche ' + ref.level + ' (' + ref.sources + '/' + ref.of + ') (D58)');
            const st = STYLE.families[fam].status;
            if (x.statut !== st) q(h + ' ' + fam + ' : statut de style « ' + (x.statut || 'absent') + ' », attendu « ' + st + ' » (D59)');
          }
          if (a.length && Math.min(...a.map((x) => x.top)) > 1688) q(h + ' : arômes au-delà de deux écrans (D58)');
          const d = m.desc.find((x) => x.h === h); const ref = (fi && fi.descripteurs && fi.descripteurs.beerMaverick) || [];
          if (!d) q(h + ' : descripteurs absents (D58)');
          else if (ref.length && ref.filter((w) => d.txt.includes(w.toLowerCase())).length < Math.min(2, ref.length)) q(h + ' : descripteurs différents de la fiche (D58)');
          const u = m.usage.find((x) => x.h === h); const us = fi ? fi.usage.flatMap((x) => x.styles) : [];
          if (!u) q(h + ' : styles d\'emploi absents (D59)');
          else if (us.length && !us.some((s) => u.txt.includes(s))) q(h + ' : styles d\'emploi différents de la fiche (D59)');
        }
        // D59 : le style nommé et la bande d'IBU.
        if (!m.style) q('style 16D non repéré ([data-role="style"][data-code="16D"]) (D59)');
        if (!m.bande.some(([a, b]) => a === STYLE.ibu[0] && b === STYLE.ibu[1])) q('bande d\'IBU du style ' + STYLE.ibu.join('–') + ' absente (D59)');
        if (m.hauteur > 1688 + 4) q('hauteur ' + m.hauteur + ' px, deux écrans au plus (1688)');
      }
    } else if (nomPage === 'etat-b.html') {
      // D60 : la réponse écrite d'abord, une piste longue, l'écart écrit quand l'effet est minuscule.
      for (const fam of new Set(m.objectifs)) {
        const r = m.reponses.find((x) => x.fam === fam);
        if (!r) { q('objectif ' + fam + ' : pas de réponse écrite ([data-role="reponse"]) (D60)'); continue; }
        if (!/^(atteint|approche|aucune)$/.test(r.verdict || '')) q('réponse ' + fam + ' : data-verdict « ' + r.verdict + ' » (D60)');
        if (r.top + r.h > 844) q('réponse ' + fam + ' hors du premier écran (D60)');
        if (r.fs < 13) q('réponse ' + fam + ' en ' + r.fs + ' px, 13 au moins (D60)');
      }
      // Au moins une piste longue par objectif au premier écran (les petits multiples restent permis).
      for (const fam of new Set(m.objectifs)) {
        const l = Math.max(0, ...m.pistes.filter((x) => x.fam === fam && x.top < 844).map((x) => x.long));
        if (l < 240) q('objectif ' + fam + ' : piste la plus longue au premier écran ' + Math.round(l) + ' px, 240 au moins (D60)');
      }
      for (const e of m.effets.filter((x) => x.top < 844)) {
        if (e.ea !== '' && e.ep !== '' && Math.abs(+e.ea - +e.ep) < 0.5 && +e.ea > 0 && !/\d(?:,\d)?\s*(?:T|→)/.test(e.txt)) q('effet ' + e.fam + ' minuscule (' + e.ea + ' → ' + e.ep + ' T) sans écart écrit (D60)');
      }
    }
  }
}
await browser.close();
const n = ids.length;
if (!n) { console.log('FIL6 ECHEC\n- aucune variante trouvée dans ' + dir); process.exit(1); }
if (pb.length) { console.log('FIL6 ECHEC (' + n + ' variante(s), ' + pb.length + ' problème(s))'); for (const x of pb) console.log('- ' + x); process.exit(1); }
console.log('FIL6 OK ' + n + '/' + n + ' (' + objet + ')');
