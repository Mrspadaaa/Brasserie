// Capture l'état « NOLO touché » de chaque concept (B1 : avant / après) et mesure les paires de ressemblance.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const puppeteer = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json')('puppeteer-core');
const V = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-10-31-ecran-identite/v0';
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
const cibles = { z1: '.z1-seg button:nth-child(2)', z2: '#z2-nolo', z3: '#z3-nolo', z4: '#z4-nolo', z5: '#z5-nolo', z6: '#z6-nolo' };
for (const [z, sel] of Object.entries(cibles)) {
  await p.goto(pathToFileURL(path.join(V, z, 'etat.html')).href, { waitUntil: 'networkidle0' });
  await p.evaluate(() => document.fonts.ready);
  await p.click(sel);
  await new Promise((r) => setTimeout(r, 150));
  await p.screenshot({ path: path.join(V, z, `${z}-nolo.png`) });
  const t = await p.evaluate((s) => document.querySelector(s).textContent.trim(), sel);
  console.log(z, 'NOLO touché →', t);
}
await nav.close();
