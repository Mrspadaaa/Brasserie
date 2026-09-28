// Paste in DevTools AFTER normal authentication. No SDK, server call or storage read.
(() => {
  const key = '__laffineeRecipeTimings';
  if (window[key]) { window[key].show(); return; }
  if (!document.querySelector('button[aria-label^="Ouvrir la recette"], .recipe-reference, .recipe-wizard')) {
    alert('Connecte-toi normalement à L’Affinée et affiche les recettes avant de lancer le diagnostic.');
    return;
  }
  const startedAt = new Date().toISOString(), start = performance.now();
  const records = [], tasks = [], resources = [], observers = [];
  let active = false, pending, stopped = false, editorFocusSeen = false, editorInputSeen = false, pointerTime, keyTime;
  let recipeSurfaceSeen = !!document.querySelector('.recipe-reference,.recipe-wizard');
  const inflight = new Set();
  const panel = document.createElement('aside');
  panel.setAttribute('data-page-overlay', '');
  panel.setAttribute('aria-label', 'Diagnostic de performance');
  panel.style.cssText = 'position:fixed;right:6px;bottom:42px;z-index:2147483647;max-width:calc(100vw - 12px)';
  const ui = panel.attachShadow({ mode: 'open' });
  ui.innerHTML = `<style>:host{font:13px system-ui;color:#fff}section{background:#221d19;border:1px solid #9a8a7e;border-radius:8px;padding:8px;max-width:290px}button,select{font:inherit;margin:3px;min-height:28px}p{margin:4px 0}small{color:#d8cec5}</style>
    <section><strong>Mesure des recettes</strong><p><small>Local, sans contenu métier ni transmission.</small></p>
    <label>Cache déclaré <select><option value="unknown">Inconnu</option><option value="first-in-session">Premier passage</option><option value="warm">Réouverture à chaud</option></select></label>
    <p><button data-action="toggle">Démarrer</button><button data-action="mark">Contenu utilisable</button><button data-action="export">Exporter JSON</button><button data-action="stop">Fermer</button></p><p data-status>Prêt. Aucun parcours lancé automatiquement.</p></section>`;
  document.body.append(panel);
  const status = message => { ui.querySelector('[data-status]').textContent = message; };
  const visible = element => !!element?.getClientRects().length;
  const recipeReady = () => {
    const page = document.querySelector('.recipe-reference');
    return visible(page) && !!page.querySelector('button[aria-label="Modifier la recette"]') &&
      !!page.querySelector('main .panel') && !!page.querySelector('main .reading, main dd');
  };
  const editorReady = () => {
    const page = document.querySelector('.recipe-wizard'), field = page?.querySelector('#wz-title');
    return visible(field) && !field.disabled && !field.readOnly &&
      !!page.querySelector('main .panel') && page.querySelectorAll('nav[aria-label="Étapes"] button').length >= 7;
  };
  const ready = action => action === 'open' ? recipeReady() : action === 'edit' ? editorReady()
    : action === 'return' || action === 'browser-return-from-popstate' ? !document.querySelector('.recipe-reference, .recipe-wizard')
    : action === 'details' ? !!document.querySelector('.catalog-card details[open]') : true;
  const time = () => Number((performance.now() - start).toFixed(1));
  const finish = (record, outcome) => {
    if (!inflight.delete(record)) return;
    record.endMs = time(); record.durationMs = Number((record.endMs - record.startMs).toFixed(1)); record.outcome = outcome;
    records.push(record);
    if(pending===record) pending=undefined;
    if(record.action==='return'||record.action==='browser-return-from-popstate') recipeSurfaceSeen=false;
    status(`${record.action} : ${record.durationMs} ms (${outcome}) · ${records.length} mesure(s)`);
  };
  const begin = (action, eventTime, startSource = 'event', checkReady = () => ready(action)) => {
    if (!active || stopped) return;
    const navigation = ['open','edit','return','browser-return-from-popstate'].includes(action);
    if (navigation && pending) finish(pending, 'interrupted');
    const record = { action, startSource, startMs: Number(((Number.isFinite(eventTime) && Math.abs(performance.now()-eventTime)<60000 ? eventTime : performance.now())-start).toFixed(1)), cache: ui.querySelector('select').value };
    inflight.add(record);
    if(navigation) pending=record;
    if(action==='open'||action==='edit') recipeSurfaceSeen=true;
    const deadline = performance.now() + 30000;
    const poll = () => {
      if (!inflight.has(record) || stopped) return;
      if (performance.now() > deadline) { finish(record, 'timeout'); return; }
      if (!checkReady()) { requestAnimationFrame(poll); return; }
      record.contentMs = time();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (checkReady()) finish(record, 'content-and-two-frames');
        else requestAnimationFrame(poll);
      }));
    };
    requestAnimationFrame(poll);
  };
  const onClick = event => {
    if (!active || panel.contains(event.target)) return;
    const target = event.target instanceof Element ? event.target.closest('button,summary') : null;
    if (!target) return;
    const label = target.getAttribute('aria-label') || '';
    const candidates=[pointerTime,keyTime].filter(time=>time!=null&&event.timeStamp-time>=0&&event.timeStamp-time<30000);
    const gestureTime=candidates.length?Math.max(...candidates):event.timeStamp;
    // Classify known controls, but NEVER retain their recipe-dependent labels.
    const source=gestureTime===pointerTime?'pointer':gestureTime===keyTime?'key':'click';
    const beginClick = action => begin(action,gestureTime,source);
    if (label.startsWith('Ouvrir la recette ')) { editorFocusSeen = editorInputSeen = false; beginClick('open'); }
    else if (label === 'Modifier la recette' || label.startsWith('Modifier la recette ')) { editorFocusSeen = editorInputSeen = false; beginClick('edit'); }
    else if (label === 'Fermer' && target.closest('.recipe-reference,.recipe-wizard')) beginClick('return');
    else if (target.matches('summary') && target.closest('.catalog-card')) {
      const details = target.closest('details'), expectedOpen = !details.open;
      // Scope readiness to the actual disclosure and its requested open/closed
      // state. Keep the DOM reference in this closure, never in exported data.
      begin(expectedOpen?'details-open':'details-close',gestureTime,source,()=>details.isConnected && details.open===expectedOpen);
    }
    else if (target.closest('.recipe-reference') && !target.closest('.recipe-wizard')) beginClick('recipe-gesture');
  };
  const onEditorGesture = event => {
    if (!active || !event.target.closest?.('.recipe-wizard')) return;
    if (event.type === 'focusin' && !event.target.matches('input,textarea,select')) return;
    if (event.type === 'input') { if(editorInputSeen) return; editorInputSeen=true; }
    else { if(editorFocusSeen) return; editorFocusSeen=true; }
    const candidates = (event.type === 'input' ? [keyTime] : [pointerTime,keyTime]).filter(time => time != null && event.timeStamp-time >= 0 && event.timeStamp-time < 30000);
    const preceding = candidates.length ? Math.max(...candidates) : undefined;
    const gestureTime = preceding ?? event.timeStamp;
    begin(event.type === 'input' ? 'first-editor-input' : 'first-editor-focus',gestureTime,gestureTime===preceding?'preceding-gesture':event.type);
    if(event.type==='input') keyTime=undefined;
  };
  const onPointer = event => { if(active && !panel.contains(event.target)) { pointerTime=event.timeStamp; keyTime=undefined; } };
  const onKey = event => { if(active && !panel.contains(event.target)) { keyTime=event.timeStamp; pointerTime=undefined; } };
  const onReturn = () => {
    // A close button already measures its own history transition from the tap.
    if(active && pending?.action!=='return' && (recipeSurfaceSeen||document.querySelector('.recipe-reference,.recipe-wizard'))) begin('browser-return-from-popstate',undefined,'popstate');
  };
  document.addEventListener('pointerdown',onPointer,true);
  document.addEventListener('keydown',onKey,true);
  document.addEventListener('click', onClick, true);
  document.addEventListener('focusin', onEditorGesture, true);
  document.addEventListener('input', onEditorGesture, true);
  window.addEventListener('popstate', onReturn);
  const observe = (type, callback) => {
    if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return false;
    const observer = new PerformanceObserver(list => { if(active) list.getEntries().forEach(callback); });
    observer.observe({ type }); observers.push(observer); return true;
  };
  const longTasksSupported = observe('longtask', entry => tasks.push({ startMs:Number((entry.startTime-start).toFixed(1)),durationMs:Number(entry.duration.toFixed(1)) }));
  observe('resource', entry => {
    let category = 'other';
    try { const url = new URL(entry.name); category = url.origin === location.origin && url.pathname.startsWith('/assets/') ? 'module-or-style' : url.origin === location.origin ? 'same-origin-other' : 'external'; } catch { /* No URL is exported. */ }
    resources.push({ category, initiator:['script','link','fetch','xmlhttprequest','css'].includes(entry.initiatorType)?entry.initiatorType:'other',startMs:Number((entry.startTime-start).toFixed(1)),durationMs:Number(entry.duration.toFixed(1)),transferBytes:entry.transferSize,bodyBytes:entry.encodedBodySize });
  });
  const fingerprint = () => [...document.querySelectorAll('script[src],link[rel="modulepreload"][href]')].flatMap(element => {
    try {
      const url = new URL(element.getAttribute('src') || element.getAttribute('href'), location.origin);
      return url.origin === location.origin && /^\/assets\/[\w.-]+-[\w-]{8,}\.(js|css)$/.test(url.pathname) ? [url.pathname] : [];
    } catch { return []; }
  });
  const data = () => ({ schema:1,startedAt,exportedAt:new Date().toISOString(),
    method:'DOM event/preceding gesture → expected content/controls + two animation frames; optional human usability marker. Not INP or an Android CPU profile.',
    environment:{ browserVersion:navigator.userAgent.match(/(?:Chrome|Chromium)\/([\d.]+)/)?.[1] || 'unknown',platform:/Android/.test(navigator.userAgent)?'Android':/Windows/.test(navigator.userAgent)?'Windows':'other',viewport:{width:innerWidth,height:innerHeight},online:navigator.onLine,serviceWorkerControlled:!!navigator.serviceWorker?.controller,entryAssets:fingerprint(),networkType:navigator.connection?.effectiveType || 'unknown',longTasksSupported },
    records:records.map(record=>({...record})),longTasks:tasks.map(task=>({...task})),resources:resources.map(resource=>({...resource})),
    privacy:'No labels, DOM content, values, URLs with queries, recipe IDs, cookies, tokens or storage contents. No network transmission.' });
  const stop = () => {
    for(const record of [...inflight]) finish(record,'stopped'); active=false; stopped=true;
    observers.forEach(observer=>observer.disconnect());
    document.removeEventListener('pointerdown',onPointer,true); document.removeEventListener('keydown',onKey,true); document.removeEventListener('click',onClick,true); document.removeEventListener('focusin',onEditorGesture,true); document.removeEventListener('input',onEditorGesture,true); window.removeEventListener('popstate',onReturn);
    panel.remove(); delete window[key];
  };
  ui.addEventListener('click', event => {
    const action = event.target.getAttribute?.('data-action');
    if(action==='toggle') { active=!active; event.target.textContent=active?'Pause':'Démarrer'; status(active?'Ouvre une fiche, puis son éditeur sans modifier ni enregistrer.':'En pause.'); }
    if(action==='mark' && active) { records.push({action:'human-usable-marker',startMs:time(),cache:ui.querySelector('select').value}); status('Repère humain enregistré.'); }
    if(action==='export') {
      const url=URL.createObjectURL(new Blob([JSON.stringify(data(),null,2)],{type:'application/json'}));
      const link=document.createElement('a'); link.href=url; link.download='laffinee-recettes-performances.json'; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
    }
    if(action==='stop') stop();
  });
  window[key] = { exportData:data,stop,show:()=>panel.scrollIntoView({block:'nearest'}) };
})();
