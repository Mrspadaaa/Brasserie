// Usage : node cap.mjs <plan.json>  — plan : { url, w?, h?, steps:[{type|click|wait|shot|eval|clickText}] }
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const plan = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const page = await browser.newPage();
const logs = [];
page.on('console', m => { if (['error','warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text().slice(0, 200)); });
page.on('pageerror', e => logs.push('pageerror: ' + e.message.slice(0, 300)));
try {
  await page.setViewport({ width: plan.w ?? 390, height: plan.h ?? 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  for (const run of plan.runs) {
    if (run.before) await page.evaluateOnNewDocument(run.before);
    await page.goto(run.url, { waitUntil: 'domcontentloaded', timeout: 90000 }); await page.waitForSelector(run.attendre ?? 'textarea', { timeout: 90000 });
    await new Promise(r => setTimeout(r, 800));
    for (const s of run.steps) {
      if (s.wait) await new Promise(r => setTimeout(r, s.wait));
      if (s.type) { const el = await page.waitForSelector(s.sel ?? 'textarea', { timeout: 8000 }); await el.click(); await page.keyboard.type(s.type); }
      if (s.key) await page.keyboard.press(s.key);
      if (s.clickText) {
        const ok = await page.evaluate((t, sel) => { const els = [...document.querySelectorAll(sel || 'button, a, [role=button]')]; const e = els.find(x => (x.textContent || '').trim().includes(t) || x.getAttribute('aria-label') === t); if (e) { e.click(); return true; } return false; }, s.clickText, s.sel);
        if (!ok) logs.push('clickText introuvable : ' + s.clickText);
      }
      if (s.click) { await page.click(s.click); }
      if (s.eval) { const r = await page.evaluate(s.eval); if (r !== undefined) console.log('eval:', JSON.stringify(r).slice(0, 1500)); }
      if (s.scroll) await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: 'center' }), s.scroll);
      if (s.shot) { await page.screenshot({ path: s.shot, fullPage: !!s.full }); console.log('shot', s.shot); }
    }
  }
} finally {
  console.log(logs.slice(0, 15).join('\n'));
  await page.close();
  browser.disconnect();
}
