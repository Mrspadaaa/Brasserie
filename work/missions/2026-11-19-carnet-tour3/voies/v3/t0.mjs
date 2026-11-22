console.log('début');
const o = await import('./outil.mjs'); console.log('importé');
const r = await fetch(o.BASE).then((x) => x.status).catch((e) => 'ERR ' + e.message); console.log('fetch', r);
const n = await o.lancer(); console.log('lancé');
const p = await o.ouvrir(n, '?dev-local', 1280, 'clair'); console.log((await o.texte(p)).slice(0, 200)); await n.close();
