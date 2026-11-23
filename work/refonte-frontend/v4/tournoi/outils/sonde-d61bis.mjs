// Sonde (19.10, D61 bis après D69) : cas-k3, descente de l'ébullition par pas de 10 px ; le moment tenu
// et la place de chaque autre houblon. Usage : node sonde-d61bis.mjs <cas-k3.html>
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const q = await browser.newPage();
await q.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await q.goto(pathToFileURL(path.resolve(process.argv[2])).href, { waitUntil: 'networkidle0' });
await wait(300);
const lignes = () => q.evaluate(() => [...document.querySelectorAll('[data-role="ligne-houblon"]')].map((l) => { const r = l.querySelector('[data-role="glisser-moment"]').getBoundingClientRect(); return { k: l.querySelector('.nom').textContent, y: Math.round(r.top + r.height / 2), quand: l.querySelector('[data-role="quand"]').innerText.trim() }; }));
const a = (await lignes())[0];
const h = await q.evaluate(() => { const r = document.querySelector('[data-role="ligne-houblon"] [data-role="glisser-moment"]').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
const t = await q.touchscreen.touchStart(h.x, h.y);
let y = h.y; await t.move(h.x, y + 3); await wait(200);
for (let i = 0; i < 60; i++) { y += 10; await t.move(h.x, y); await wait(30); const ls = await lignes(); console.log(Math.round(y), ls.map((l) => l.k + ' ' + l.quand + '@' + l.y).join(' | ')); if (!/′/.test(ls[0].quand)) break; }
await t.end(); await browser.close();
