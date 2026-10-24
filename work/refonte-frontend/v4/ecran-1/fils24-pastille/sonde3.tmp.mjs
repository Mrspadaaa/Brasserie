import path from 'node:path'; import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await b.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await p.goto(pathToFileURL(path.resolve(process.argv[2])).href, { waitUntil: 'networkidle0' }); await new Promise(r=>setTimeout(r,500));
console.log(await p.evaluate(()=>{
  const o={};
  const heads=[...document.querySelectorAll('.pq-comparer-tetes > *')];
  o.heads=heads.map(h=>({cls:h.className, html:h.outerHTML.slice(0,700), r:JSON.stringify(h.getBoundingClientRect()), bt:getComputedStyle(h).borderTopColor, st:h.getAttribute('style')}));
  const sec=document.querySelector('.pq-comparer-rad'); o.rad=JSON.stringify(sec.getBoundingClientRect()); const svg=sec.querySelector('svg'); o.svg=svg && (JSON.stringify(svg.getBoundingClientRect())+' vb '+svg.getAttribute('viewBox')+' cls '+svg.getAttribute('class'));
  o.dock=JSON.stringify(document.querySelector('.pq-comparer-dock').getBoundingClientRect());
  o.vars=['--cave-50','--cave-950','--cave-850','--cave-600','--cave-texte-400'].map(v=>v+'='+getComputedStyle(document.documentElement).getPropertyValue(v));
  o.font=getComputedStyle(document.querySelector('.pq-comparer-puce')).fontFamily;
  o.radh=getComputedStyle(document.querySelector('.pq-comparer-rad-h')).cssText?.slice(0,10);
  o.radhpos=[getComputedStyle(document.querySelector('.pq-comparer-rad-h')).position, getComputedStyle(sec).position];
  return JSON.stringify(o,null,1);
}));
await b.close();
