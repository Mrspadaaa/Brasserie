// Planche : node planche.mjs <sortie.png> <largeurCss> <img1> <img2> ... (images de ./captures, côte à côte, légende au-dessus)
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath } from 'node:url';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const puppeteer = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet/package.json')('puppeteer-core');
const [sortie, larg, ...imgs] = process.argv.slice(2);
const W = Number(larg);
const cells = imgs.filter((i) => fs.existsSync((i.startsWith('..') ? path.join(ICI, i) : path.join(ICI, 'captures', i)))).map((i) => `<figure><figcaption>${i}</figcaption><img src="data:image/png;base64,${fs.readFileSync((i.startsWith('..') ? path.join(ICI, i) : path.join(ICI, 'captures', i))).toString('base64')}" style="width:${W}px"></figure>`).join('');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await nav.newPage(); await p.setViewport({ width: 400, height: 300 });
await p.setContent(`<body style="margin:0;display:flex;gap:6px;align-items:flex-start;background:#888;font:11px sans-serif">${cells}</body><style>figure{margin:0}figcaption{background:#000;color:#fff;padding:2px}</style>`);
await p.screenshot({ path: path.join(ICI, 'captures', sortie), fullPage: true }); await nav.close();
console.log('planche', sortie, imgs.length);
