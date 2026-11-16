// node en/l/cap.mjs : captures 844 × 390 DPR 2 (clair et cave) de la base et de l1 à l5, dans en/cap/ ; contrôles de l'en-tête :
// hauteur (haut de la frise), texte sur texte ou sur objet, bord, coupe, taille < 14 px, débord sur la frise ;
// frise et + identiques à la base (code après <div class="cd-frw"> et boîtes relatives). Témoin en/cap/l-temoin.html : doit échouer.
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const EN = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), CAP = path.join(EN, 'cap');
const BASEF = path.join(EN, '..', 'cd', 'cd1-paysage.html');
const B = fs.readFileSync(BASEF, 'utf8'), TAILB = B.slice(B.indexOf('<div class="cd-frw">'));
const J = [['base', BASEF], ...['l1', 'l2', 'l3', 'l4', 'l5'].map((n) => [n, path.join(EN, n + '.html')]), ['l-temoin', path.join(CAP, 'l-temoin.html')]];
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const url = (f) => 'file:///' + f.split(path.sep).join('/');
const log = []; let bad = 0, ref = null;
for (const [n, f] of J) {
  for (const th of n === 'l-temoin' ? ['clair'] : ['clair', 'cave']) {
    const p = await nav.newPage();
    await p.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await p.goto(url(f)); if (th === 'cave') await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'cave'));
    await p.evaluate(() => document.fonts.ready);
    if (n !== 'l-temoin') await p.screenshot({ path: path.join(CAP, `${n === 'base' ? 'l-base' : n}${th === 'cave' ? '-cave' : ''}.png`) });
    if (th === 'cave') { await p.close(); continue; }
    const r = await p.evaluate(() => {
      const W = innerWidth;
      const vis = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0; };
      const R = (e) => e.getBoundingClientRect();
      const frw = document.querySelector('.cd-frw'), tete = Math.round(R(frw).top), hd = document.querySelector('.en-h');
      const inHd = (e) => (hd ? hd.contains(e) : R(e).bottom <= tete + 1);
      const tx = []; const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      while (tw.nextNode()) { const t = tw.currentNode, e = t.parentElement; if (!t.textContent.trim() || !e || !vis(e) || e.closest('svg') || !inHd(e)) continue;
        const rg = document.createRange(); rg.selectNodeContents(t); for (const b of rg.getClientRects()) if (b.width > 0) tx.push({ e, b, t: t.textContent.trim().slice(0, 28) }); }
      const ov = (a, b, m) => a.left < b.right - m && b.left < a.right - m && a.top < b.bottom - m && b.top < a.bottom - m;
      const out = [];
      for (let i = 0; i < tx.length; i++) for (let j = i + 1; j < tx.length; j++) if (tx[i].e !== tx[j].e && ov(tx[i].b, tx[j].b, 2.5)) out.push('TEXTE×TEXTE ' + tx[i].t + ' / ' + tx[j].t);
      const cls = (e) => (e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className) || e.tagName;
      const objs = hd ? [...hd.querySelectorAll('button,.en-dip,.l4-p,.en-win')].filter(vis).map((e) => ({ e, b: R(e) })) : [];
      for (const t of tx) for (const o of objs) if (!o.e.contains(t.e) && !o.e.matches('.en-win') && ov(t.b, o.b, 1)) out.push('TEXTE×OBJET ' + t.t + ' / ' + cls(o.e));
      for (let i = 0; i < objs.length; i++) for (let j = i + 1; j < objs.length; j++) { const a = objs[i], b = objs[j];
        if (a.e.contains(b.e) || b.e.contains(a.e) || a.e.matches('.en-win') || b.e.matches('.en-win')) continue; if (ov(a.b, b.b, 1)) out.push('OBJET×OBJET ' + cls(a.e) + ' / ' + cls(b.e)); }
      for (const t of tx) if (t.b.right > W - 2 || t.b.left < 2 || t.b.top < -4) out.push('BORD ' + t.t + ' ' + Math.round(t.b.left) + '-' + Math.round(t.b.right));
      if (hd) for (const e of hd.querySelectorAll('*')) { if (!vis(e) || e.closest('svg')) continue; if (e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0 && getComputedStyle(e).overflowX !== 'visible') out.push('COUPE ' + cls(e)); }
      if (hd) for (const t of new Set(tx.filter((t) => parseFloat(getComputedStyle(t.e).fontSize) < 14).map((t) => t.t))) out.push('SOUS 14 PX ' + t);
      if (hd) for (const t of tx) if (t.b.bottom > tete + 3) out.push('DEBORDE SUR LA FRISE ' + t.t);
      if (hd) for (const o of objs) if (!o.e.matches('.en-win') && (o.b.width < 22 && o.b.height < 22) && !o.e.matches('.en-dip')) out.push('CIBLE < 22 ' + cls(o.e));
      const sizes = [...new Set(tx.map((t) => Math.round(parseFloat(getComputedStyle(t.e).fontSize))))].sort((a, b) => a - b);
      const frise = [...frw.querySelectorAll('*')].map((e) => { const b = R(e); return [Math.round(b.left), Math.round(b.top - tete), Math.round(b.width), Math.round(b.height)].join(','); }).join(';');
      const fab = R(document.querySelector('.cd-fab'));
      const svgH = [...document.querySelectorAll('.en-svg,.cd-svg')].map((s) => Math.round(R(s).height));
      const mots = tx.map((t) => t.t).join(' ').split(/\s+/).filter((w) => /[a-zà-ü]/i.test(w)).length;
      return { out: [...new Set(out)], tete, sizes, frise, fab: [Math.round(fab.left), Math.round(fab.top)].join(','), svgH, mots };
    });
    if (n === 'base') ref = r;
    const code = n === 'base' ? true : fs.readFileSync(f, 'utf8').endsWith(TAILB);
    const ident = n === 'base' ? '' : ` ; frise ${r.frise === ref.frise ? 'identique' : 'DIFFERENTE'} ; + ${r.fab === ref.fab ? 'identique' : 'DIFFERENT'} ; code frise ${code ? 'identique' : 'DIFFERENT'}`;
    log.push(`## ${n} : en-tête ${r.tete} px (${(r.tete / 390 * 100).toFixed(1)} %) ; courbe(s) ${r.svgH.join('/')} px ; tailles ${r.sizes.join('/')} px ; mots ${r.mots}${ident}`);
    const err = n === 'base' ? [] : r.out; log.push(err.length ? err.map((x) => '  ' + x).join('\n') : '  aucun défaut');
    if (n === 'l-temoin') log.push(err.length ? '  TEMOIN ECHOUE comme attendu' : '  TEMOIN PASSE : contrôle aveugle');
    else if (n !== 'base') { bad += err.length; if (r.frise !== ref.frise || r.fab !== ref.fab || !code) bad++; if (r.tete >= ref.tete) { bad++; log.push('  EN-TETE PAS PLUS BAS QUE LA BASE'); } }
    await p.close();
  }
}
log.push(bad ? `CONTROLE ECHEC (${bad})` : 'CONTROLE OK');
fs.writeFileSync(path.join(CAP, 'l-controle.txt'), log.join('\n') + '\n'); console.log(log.join('\n'));
await nav.close();
