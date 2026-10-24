import path from 'node:path'; import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.goto(pathToFileURL(path.resolve(process.argv[2])).href, { waitUntil: 'networkidle0' }); await new Promise(r=>setTimeout(r,500));
console.log(await p.evaluate(()=>{
  const o=[];
  for (const n of ['valeurs','preuve','frise','souche','egaler']) o.push(n+': '+document.querySelector(`[data-dock="${n}"] svg`).outerHTML);
  o.push('sel: '+ [...document.querySelectorAll('.pq-comparer-sel svg')].map(s=>s.getAttribute('aria-label')+' '+s.outerHTML.slice(0,400)).join('\n'));
  o.push('dose: '+document.querySelector('.pq-comparer-dose svg')?.outerHTML);
  o.push('pont: '+document.querySelector('.pq-comparer-placer button')?.outerHTML.slice(0,300) + ' / ' + getComputedStyle(document.querySelector('.pq-comparer-placer button')).borderRadius);
  return o.join('\n');
}));
await b.close();
