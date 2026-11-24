import { ouvrir, sleep } from './outil.mjs';
const { browser, lacher } = await ouvrir();
const p = await browser.newPage();
await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
for (const [f, n] of [['gi2/r2-c.html', 'REF-r2-c'], ['en2/r6b.html', 'REF-r6b']]) {
  await p.goto('file:///C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-16-calendrier/' + f); await sleep(1500);
  await p.screenshot({ path: 'cap/' + n + '.png' });
}
await p.close(); lacher();
