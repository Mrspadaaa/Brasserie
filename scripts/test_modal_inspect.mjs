import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ARTIFACT_DIR = 'C:\\Users\\mrspa\\.gemini\\antigravity\\brain\\b4ee6eb4-eb35-4841-86e9-4801dc45b05c';
const BASE_URL = 'http://localhost:5199';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    defaultViewport: { width: 412, height: 915, isMobile: true, hasTouch: true },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/?dev-local`, { waitUntil: 'networkidle2' });
  await sleep(1500);

  // 1. Ouvrir Clients et cliquer sur "Modifier le client"
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, a'));
    const t = tabs.find(el => el.textContent?.includes('Clients'));
    if (t) t.click();
  });
  await sleep(800);

  await page.evaluate(() => {
    const editBtn = document.querySelector('button[title="Modifier le client"]');
    if (editBtn) editBtn.click();
  });
  await sleep(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'btn_test_modal_edit_client_opened.png') });

  await page.keyboard.press('Escape');
  await sleep(400);

  // 2. Ouvrir Stocks et cliquer sur la première carte pour ouvrir StockDetailSheet
  await page.evaluate(() => {
    const tabs = Array.from(document.querySelectorAll('button, a'));
    const t = tabs.find(el => el.textContent?.includes('Stocks'));
    if (t) t.click();
  });
  await sleep(800);

  await page.evaluate(() => {
    const firstRow = document.querySelector('article.panel button');
    if (firstRow) firstRow.click();
  });
  await sleep(600);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'btn_test_sheet_stock_detail_opened.png') });

  // Cliquer sur le stepper +1
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const plusBtn = btns.find(b => b.textContent?.trim() === '+1');
    if (plusBtn) plusBtn.click();
  });
  await sleep(400);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'btn_test_sheet_stock_stepper_plus1.png') });

  await browser.close();
  console.log('✅ Modals Client et StockDetailSheet vérifiés avec succès !');
}

run().catch(console.error);
