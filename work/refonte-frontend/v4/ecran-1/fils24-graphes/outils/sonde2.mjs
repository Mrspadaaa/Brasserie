import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';
const R='C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/prototypes/houblons-v4/maquettes/';
const [u, js] = process.argv.slice(2);
const b=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const p=await b.newPage(); await p.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
await p.goto(pathToFileURL(R+u).href,{waitUntil:'networkidle0'}); await new Promise(r=>setTimeout(r,800));
console.log(await p.evaluate(js));
await b.close();
