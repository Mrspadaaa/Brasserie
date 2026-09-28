import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
const script = readFileSync(new URL('../../scripts/recipe-open-diagnostic.js', import.meta.url), 'utf8');
const opened: JSDOM[] = [];
afterEach(() => { opened.splice(0).forEach(dom => dom.window.close()); });

function fixture(body: string) {
  const dom = new JSDOM(body, { url: 'https://fixture.invalid/', runScripts: 'outside-only' });
  opened.push(dom);
  const w = dom.window as any;
  let tick = 0;
  const frames: Function[] = [];
  Object.defineProperty(w.performance, 'now', { value: () => tick });
  w.requestAnimationFrame = (callback: Function) => { frames.push(callback); return frames.length; };
  w.Element.prototype.getClientRects = function () { return this.isConnected ? [{}] : []; };
  w.PerformanceObserver = class { static supportedEntryTypes = []; };
  w.fetch = vi.fn(); w.alert = vi.fn();
  w.eval(script);
  w.document.querySelector('[data-page-overlay]').shadowRoot.querySelector('[data-action="toggle"]').click();
  return {
    w, setTime: (time: number) => { tick = time; },
    flush: () => { for(let i=0;i<3;i++) { tick+=16; const callbacks=frames.splice(0); callbacks.forEach(callback=>callback(tick)); } },
    emit: (node: Element, kind: string, time: number) => {
      tick=time;
      const event = kind==='click' || kind==='pointerdown' ? new w.MouseEvent(kind,{bubbles:true,cancelable:true}) : new w.Event(kind,{bubbles:true});
      Object.defineProperty(event,'timeStamp',{value:time}); node.dispatchEvent(event);
    },
    data: () => w.__laffineeRecipeTimings.exportData()
  };
}
const recipe = `<div class="recipe-reference"><button aria-label="Modifier la recette">Modifier</button><button aria-label="Fermer">Fermer</button><main><section class="panel"><dd class="reading">Valeur privée</dd></section></main></div>`;

it('keeps the recent keyboard gesture when an old pointer precedes the first editor focus', () => {
  const f=fixture('<div class="recipe-wizard"><input id="wz-title" value="PRIVATE_VALUE"></div>');
  const field=f.w.document.querySelector('#wz-title');
  f.emit(field,'pointerdown',-2000); f.emit(field,'keydown',0); f.emit(field,'focusin',150); f.flush();
  const record=f.data().records.find((record:any)=>record.action==='first-editor-focus');
  expect(record.startMs).toBe(0); expect(record.durationMs).toBeGreaterThanOrEqual(150);
});

it('measures closing the actual disclosure and does not accept another already open section', () => {
  const f=fixture('<button aria-label="Ouvrir la recette PRIVATE_NAME"></button><article class="catalog-card"><details open><summary>A</summary></details><details open><summary>B</summary></details></article>');
  const summary=f.w.document.querySelector('summary');
  f.emit(summary,'click',0); f.flush();
  expect(f.data().records[0]).toMatchObject({action:'details-close',outcome:'content-and-two-frames'});
  summary.addEventListener('click',(event:Event)=>event.preventDefault());
  f.emit(summary,'click',100); f.flush();
  expect(f.data().records).toHaveLength(1);
  f.setTime(30200); f.flush();
  expect(f.data().records[1]).toMatchObject({action:'details-open',outcome:'timeout'});
});

it('keeps a close-button gesture through its popstate, and records native return after React has removed the page', () => {
  const f=fixture(recipe);
  f.emit(f.w.document.querySelector('[aria-label="Fermer"]'),'click',0);
  f.w.dispatchEvent(new f.w.PopStateEvent('popstate'));
  f.w.document.querySelector('.recipe-reference').remove(); f.flush();
  expect(f.data().records).toHaveLength(1);
  expect(f.data().records[0]).toMatchObject({action:'return',outcome:'content-and-two-frames'});

  const native=fixture(recipe);
  native.w.document.querySelector('.recipe-reference').remove();
  native.w.dispatchEvent(new native.w.PopStateEvent('popstate')); native.flush();
  expect(native.data().records[0]).toMatchObject({action:'browser-return-from-popstate',startSource:'popstate'});
});

it('does not interrupt editor opening when its field receives focus during that opening', () => {
  const f=fixture(recipe);
  f.emit(f.w.document.querySelector('[aria-label="Modifier la recette"]'),'click',0);
  const wizard=f.w.document.createElement('div');wizard.className='recipe-wizard';
  wizard.innerHTML='<input id="wz-title"><main><section class="panel"></section></main><nav aria-label="Étapes">'+'<button>Étape</button>'.repeat(7)+'</nav>';
  f.w.document.body.append(wizard);
  f.emit(wizard.querySelector('input'),'focusin',20);f.flush();
  const records=f.data().records;
  expect(records.find((record:any)=>record.action==='edit')).toMatchObject({outcome:'content-and-two-frames'});
  expect(records.find((record:any)=>record.action==='first-editor-focus')).toBeDefined();
  expect(records.some((record:any)=>record.outcome==='interrupted')).toBe(false);
});

it('exports timings without content, tokens, cookies, storage reads or network transmission', () => {
  const f=fixture(recipe+'<input value="PRIVATE_VALUE"><p>PRIVATE_INGREDIENT</p><script src="/assets/index-AbCd1234.js?token=PRIVATE_TOKEN"></script>');
  Object.defineProperty(f.w.document,'cookie',{get:()=>{throw Error('Cookie read');}});
  Object.defineProperty(f.w,'localStorage',{get:()=>{throw Error('Storage read');}});
  f.emit(f.w.document.querySelector('[aria-label="Modifier la recette"]'),'click',0);
  const exported=JSON.stringify(f.data());
  for(const sentinel of ['PRIVATE_VALUE','PRIVATE_INGREDIENT','PRIVATE_TOKEN','Valeur privée']) expect(exported).not.toContain(sentinel);
  expect(f.data().environment.entryAssets).toEqual(['/assets/index-AbCd1234.js']);
  expect(f.w.fetch).not.toHaveBeenCalled();
});
