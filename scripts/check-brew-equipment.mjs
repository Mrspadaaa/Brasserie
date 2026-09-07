import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const output=resolve('.codex-remote-attachments/brew-equipment');
await mkdir(output,{recursive:true});
const browser=await puppeteer.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--mute-audio']});
const report={screenshots:[],layouts:[],errors:[]};
try{
  const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  const settle=()=>page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  const click=async text=>{const h=await page.evaluateHandle(t=>[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===t&&b.getClientRects().length),text);assert(h.asElement(),text);await h.asElement().click();await h.dispose();await settle();};
  const shot=async name=>{
    await settle();const layout=await page.evaluate(()=>{
      const visible=e=>e.getClientRects().length&&(!e.closest('details:not([open])')||e.closest('summary'));
      const nodes=[...document.querySelectorAll('.equipment-settings,.equipment-settings input,.equipment-summary,.equipment-field')].filter(visible);
      return {overflow:nodes.filter(e=>e.getBoundingClientRect().left<-.5||e.getBoundingClientRect().right>innerWidth+.5).map(e=>e.className),small:[...document.querySelectorAll('.equipment-field input,.equipment-button,.equipment-settings summary,.equipment-summary summary')].filter(visible).filter(e=>e.getBoundingClientRect().height<43.5).map(e=>e.getAttribute('aria-label')||e.textContent)};
    });report.layouts.push({name,...layout});assert.deepEqual(layout.overflow,[],name);assert.deepEqual(layout.small,[],name);
    const path=resolve(output,name+'.png');await page.screenshot({path});report.screenshots.push(path);
  };
  for(const width of [390,320]){
    await page.setViewport({width,height:844,isMobile:true,hasTouch:true,deviceScaleFactor:1});
    await page.goto('http://127.0.0.1:3007/?preview=brew&hardware=1&view=materiel');
    await click('⚙️ Brasserie');await page.waitForSelector('.equipment-settings');
    assert.equal(await page.$eval('.equipment-settings',e=>e.open),false);
    await shot(`settings-${width}-closed`);
    await page.click('.equipment-settings>summary');await shot(`settings-${width}-open`);
    await page.$eval('.equipment-calibration',e=>e.scrollIntoView({block:'end'}));
    await page.click('.equipment-calibration>summary');await page.$eval('.equipment-calibration',e=>e.scrollIntoView({block:'start'}));
    await shot(`calibration-${width}`);
  }
  for(const [width,height] of [[390,844],[844,390],[1440,1000]]){
    await page.setViewport({width,height,isMobile:width<900,hasTouch:width<900,deviceScaleFactor:1});
    await page.goto('http://127.0.0.1:3007/?preview=brew&hardware=1&view=brassage');
    await page.waitForSelector('.brew-assist');await page.click('.brew-assist>summary');await page.click('.equipment-summary>summary');
    await page.$eval('.equipment-summary',e=>e.scrollIntoView({block:'start'}));await shot(`brew-day-${width}`);
    assert.match(await page.$eval('.equipment-summary',e=>e.textContent),/pack/);
  }
  await page.setViewport({width:390,height:844,isMobile:true,hasTouch:true});
  await page.goto('http://127.0.0.1:3007/?preview=brew&hardware=1&view=assistant');
  await page.waitForSelector('.equipment-summary');await page.click('.equipment-summary>summary');
  await page.$eval('.equipment-summary',e=>e.scrollIntoView({block:'start'}));await shot('wizard-material');
  assert.deepEqual(report.errors,[]);
  await writeFile(resolve(output,'report.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify({screenshots:report.screenshots.length,layouts:report.layouts.length,errors:report.errors}));
}finally{await browser.close();}
