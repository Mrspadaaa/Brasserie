import { createRequire } from 'node:module';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const [f, ...sels] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const p = await b.newPage(); await p.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await p.goto('file:///' + f); await p.evaluate(() => document.fonts.ready);
for (const s of sels) console.log(s, JSON.stringify(await p.evaluate((s) => [...document.querySelectorAll(s)].map((e) => { const r = e.getBoundingClientRect(); return [Math.round(r.top), Math.round(r.height), Math.round(r.left), Math.round(r.width), getComputedStyle(e).display]; }), s)));
await b.close();
