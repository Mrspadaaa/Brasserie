// Uses a real Firestore emulator, browser IndexedDB and the application's repository.
// Start Vite with VITE_FIREBASE_PROJECT_ID=demo-backend-audit on port 3017.
import puppeteer from 'puppeteer-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const output = resolve('.codex-remote-attachments/backend-persistence');
await mkdir(output, { recursive: true });
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--mute-audio'] });
const report = { checks: [], screenshots: [], errors: [] };
try {
  const cleared = await fetch('http://127.0.0.1:8080/emulator/v1/projects/demo-backend-audit/databases/(default)/documents', { method: 'DELETE' });
  assert.equal(cleared.ok, true, 'Only the isolated emulator database may be reset');
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  page.on('pageerror', e => report.errors.push(e.message));
  const load = async () => {
    await page.goto('http://127.0.0.1:3017/?preview=brew&hardware=1&view=materiel');
    await page.evaluate(async () => { window.probe = await import('/scripts/fixtures/persistenceProbe.ts'); window.probe.initialize(); });
    await page.waitForFunction(() => window.probe.ready());
  };
  await load();
  await page.evaluate(async () => {
    const p = window.probe;
    p.put('stockItems', 'TEST-M', { ref: 'TEST-M', currentStock: 20, unit: 'kg' });
    p.put('auditLogs', 'TEST-LOG', { id: 'TEST-LOG', summary: 'Initial' });
    await p.wait();
  });
  assert.equal(await page.evaluate(async () => (await window.probe.serverRead('stockItems', 'TEST-M')).currentStock), 20);
  report.checks.push('Related documents acknowledged on the emulator');
  const failed = await page.evaluate(async () => {
    const p = window.probe;
    p.put('stockItems', 'TEST-M', { ref: 'TEST-M', currentStock: 1, unit: 'kg' });
    p.put('auditLogs', 'TEST-LOG', { id: 'TEST-LOG', summary: 'Forbidden rewrite' });
    try { await p.wait(); return false; } catch { return true; }
  });
  assert.equal(failed, true);
  assert.equal(await page.evaluate(async () => (await window.probe.serverRead('stockItems', 'TEST-M')).currentStock), 20);
  report.checks.push('One rejected audit write rolls back the entire stock action');
  await page.evaluate(async () => {
    const p = window.probe;
    await p.offline();
    p.put('config', 'offline-probe', { note: 'Conservé après rechargement', value: 36.9 });
  });
  await page.waitForFunction(() => window.probe.read('config', 'offline-probe')?.value === 36.9);
  assert.equal(await page.evaluate(() => window.probe.status().pending), true);
  let blockEmulator = true;
  await page.setRequestInterception(true);
  page.on('request', request => blockEmulator && request.url().startsWith('http://127.0.0.1:8080/') ? request.abort() : request.continue());
  await load();
  assert.equal(await page.evaluate(() => window.probe.read('config', 'offline-probe')?.value), 36.9);
  assert.equal(await page.evaluate(() => window.probe.status().pending), true);
  report.checks.push('Pending write survives page reload in real IndexedDB');
  blockEmulator = false;
  await page.evaluate(async () => { await window.probe.offline(); await window.probe.online(); await window.probe.wait(); });
  assert.equal(await page.evaluate(async () => (await window.probe.serverRead('config', 'offline-probe')).value), 36.9);
  report.checks.push('Reconnect acknowledges the persisted offline write');
  const gated = await page.evaluate(async () => {
    const p = window.probe; await p.offline();
    p.put('batches', 'NEW-LOT', { id: 'NEW-LOT', volumeL: 24 });
    let arrived = false; const done = p.waitLot('NEW-LOT').then(() => { arrived = true; });
    await new Promise(r => setTimeout(r, 100));
    const beforeReconnect = arrived;
    await p.online(); await done;
    return { beforeReconnect, arrived };
  });
  assert.deepEqual(gated, { beforeReconnect: false, arrived: true });
  report.checks.push('A new lot waits for server creation before loading its journal');
  await page.evaluate(async () => {
    const p = window.probe; await p.seedManaged();
    p.put('batches', 'PROTECTED', { id: 'PROTECTED', volumeL: 24, og: undefined, recipeSnapshot: { name: 'Corrigé' }, brewDay: { revision: 1 } });
    await p.wait();
  });
  const protectedLot = await page.evaluate(() => window.probe.serverRead('batches', 'PROTECTED'));
  assert.equal(protectedLot.og, undefined);
  assert.deepEqual(protectedLot.recipeSnapshot, { name: 'Corrigé' });
  assert.equal(protectedLot.brewDay.revision, 8);
  report.checks.push('Clearing ordinary fields preserves the canonical journal without leaving stale nested data');
  await page.evaluate(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes('Backup'))?.click());
  await page.waitForFunction(() => document.body.textContent.includes('Copie confirmée par le serveur'));
  await page.screenshot({ path: resolve(output, 'backup-390.png') });
  report.screenshots.push(resolve(output, 'backup-390.png'));
  await page.setViewport({ width: 320, height: 720, isMobile: true, hasTouch: true });
  await page.screenshot({ path: resolve(output, 'backup-320.png') });
  report.screenshots.push(resolve(output, 'backup-320.png'));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  assert.deepEqual(report.errors, []);
} finally {
  await writeFile(resolve(output, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
console.log(JSON.stringify(report, null, 2));
