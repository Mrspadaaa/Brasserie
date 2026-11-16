// node en2/s/cap.mjs : captures 844 × 390 DPR 2 (clair, cave) de l5 et s1…s4 dans en2/cap/ ; contrôles de l'en-tête :
// hauteur ≤ l5, texte sur texte / objet / TRAIT (lignes, hachure, repères, fils, bords de fenêtre), bord, coupe, < 14 px, débord ;
// frise et + identiques à l5 (code après <div class="cd-frw"> et boîtes). Témoin : s1 avec une étiquette posée sur la courbe → doit échouer.
import path from 'node:path'; import fs from 'node:fs'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const puppeteer = require('puppeteer-core');
const S = path.dirname(fileURLToPath(import.meta.url)), EN2 = path.join(S, '..'), CAP = path.join(EN2, 'cap');
const L5 = path.join(EN2, '..', 'en', 'l5.html');
const B = fs.readFileSync(L5, 'utf8'), TAILB = B.slice(B.indexOf('<div class="cd-frw">'));
const ids = (process.argv[2] || 's1,s2,s3,s4').split(',');
const s1 = fs.readFileSync(path.join(EN2, 's1.html'), 'utf8');
fs.writeFileSync(path.join(CAP, 's-temoin.html'), s1.replace('data-entete="s1">', 'data-entete="s1"><span class="en-lb" style="left:430px;top:75px">sur la courbe</span>'));
const J = [['l5', L5], ...ids.map((n) => [n, path.join(EN2, n + '.html')]), ['s-temoin', path.join(CAP, 's-temoin.html')]];
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const url = (f) => 'file:///' + f.split(path.sep).join('/');
const log = []; let bad = 0, ref = null;
for (const [n, f] of J) {
  for (const th of n === 's-temoin' ? ['clair'] : ['clair', 'cave']) {
    const p = await nav.newPage();
    await p.setViewport({ width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    await p.goto(url(f)); if (th === 'cave') await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'cave'));
    await p.evaluate(() => document.fonts.ready);
    if (n !== 's-temoin' && n !== 'l5') await p.screenshot({ path: path.join(CAP, `${n}${th === 'cave' ? '-cave' : ''}.png`) });
    if (th === 'cave') { await p.close(); continue; }
    const r = await p.evaluate(() => {
      const W = innerWidth, R = (e) => e.getBoundingClientRect();
      const vis = (e) => { const s = getComputedStyle(e); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0; };
      const frw = document.querySelector('.cd-frw'), tete = Math.round(R(frw).top), hd = document.querySelector('.en-h');
      const tx = []; const tw = document.createTreeWalker(hd, NodeFilter.SHOW_TEXT);
      while (tw.nextNode()) { const t = tw.currentNode, e = t.parentElement; if (!t.textContent.trim() || !e || !vis(e) || e.closest('svg')) continue;
        const rg = document.createRange(); rg.selectNodeContents(t); for (const b of rg.getClientRects()) if (b.width > 0) tx.push({ e, b, t: t.textContent.trim().slice(0, 28) }); }
      const ov = (a, b, m) => a.left < b.right - m && b.left < a.right - m && a.top < b.bottom - m && b.top < a.bottom - m;
      const out = [];
      for (let i = 0; i < tx.length; i++) for (let j = i + 1; j < tx.length; j++) if (tx[i].e !== tx[j].e && ov(tx[i].b, tx[j].b, 2.5)) out.push('TEXTE×TEXTE ' + tx[i].t + ' / ' + tx[j].t);
      const cls = (e) => (e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className) || e.tagName;
      const objs = [...hd.querySelectorAll('button,.en-dip,.s2-lg,.s4-kn')].filter(vis).map((e) => ({ e, b: R(e) }));
      for (const t of tx) for (const o of objs) if (!o.e.contains(t.e) && ov(t.b, o.b, 1)) out.push('TEXTE×OBJET ' + t.t + ' / ' + cls(o.e));
      // texte × trait : échantillonne l'intérieur des glyphes (rect resserré de 4 px en haut et en bas)
      const wins = [...hd.querySelectorAll('.en-win')].map(R);
      for (const t of tx) { let hit = '';
        for (let x = t.b.left + 1; x < t.b.right - 1 && !hit; x += 2) for (let y = t.b.top + 4; y < t.b.bottom - 4 && !hit; y += 2) {
          for (const el of document.elementsFromPoint(x, y)) { const c = el.getAttribute && (el.getAttribute('class') || '');
            if (el.closest && el.closest('svg') && /\b(tr|hz|mk|ld)\b/.test(c)) { hit = c; break; } if (el.classList && el.classList.contains('en-tk')) { hit = 'tick'; break; } }
          for (const w of wins) { const nearV = (Math.abs(x - w.left) < 3 || Math.abs(x - w.right) < 3) && y > w.top && y < w.bottom; const nearH = (Math.abs(y - w.top) < 3 || Math.abs(y - w.bottom) < 3) && x > w.left && x < w.right; if (nearV || nearH) hit = 'bord de fenêtre'; } }
        if (hit) out.push('TEXTE×TRAIT ' + t.t + ' / ' + hit); }
      for (const t of tx) if (t.b.right > W - 2 || t.b.left < 2 || t.b.top < -4) out.push('BORD ' + t.t);
      for (const e of hd.querySelectorAll('*')) { if (!vis(e) || e.closest('svg')) continue; if (e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0 && getComputedStyle(e).overflowX !== 'visible') out.push('COUPE ' + cls(e)); }
      for (const t of new Set(tx.filter((t) => parseFloat(getComputedStyle(t.e).fontSize) < 14).map((t) => t.t))) out.push('SOUS 14 PX ' + t);
      for (const t of tx) if (t.b.bottom > tete + 3) out.push('DEBORDE SUR LA FRISE ' + t.t);
      const frise = [...frw.querySelectorAll('*')].map((e) => { const b = R(e); return [Math.round(b.left), Math.round(b.top - tete), Math.round(b.width), Math.round(b.height)].join(','); }).join(';');
      const fab = R(document.querySelector('.cd-fab'));
      const mots = tx.map((t) => t.t).join(' ').split(/\s+/).filter((w) => /[a-zà-ü]/i.test(w)).length;
      return { out: [...new Set(out)], tete, frise, fab: [Math.round(fab.left), Math.round(fab.top)].join(','), mots };
    });
    if (n === 'l5') ref = r;
    const code = n === 'l5' ? true : fs.readFileSync(f, 'utf8').endsWith(TAILB);
    const ident = n === 'l5' ? '' : ` ; frise ${r.frise === ref.frise ? 'identique' : 'DIFFERENTE'} ; + ${r.fab === ref.fab ? 'identique' : 'DIFFERENT'} ; code frise ${code ? 'identique' : 'DIFFERENT'}`;
    log.push(`## ${n} : en-tête ${r.tete} px ; mots ${r.mots}${ident}`);
    const err = n === 'l5' ? [] : r.out; log.push(err.length ? err.map((x) => '  ' + x).join('\n') : '  aucun défaut');
    if (n === 's-temoin') log.push(err.some((x) => x.startsWith('TEXTE×TRAIT')) ? '  TEMOIN ECHOUE comme attendu' : '  TEMOIN PASSE : contrôle aveugle');
    else if (n !== 'l5') { bad += err.length; if (r.frise !== ref.frise || r.fab !== ref.fab || !code) bad++; if (r.tete > ref.tete) { bad++; log.push('  EN-TETE PLUS HAUT QUE l5'); } }
    await p.close();
  }
}
log.push(bad ? `CONTROLE ECHEC (${bad})` : 'CONTROLE OK');
fs.writeFileSync(path.join(CAP, 's-controle.txt'), log.join('\n') + '\n'); console.log(log.join('\n'));
await nav.close();
