// CAL-BANDE-SEMAINE (17.11) : courbe complète de z2 / w3 ; bande = la semaine seule ; ± affiche mouvements et icônes.
import fs from 'fs';
const CSS = `<style id="se">
.mt-x{position:absolute;opacity:0;width:1px;height:1px;pointer-events:none}
.mt-b{display:inline-flex;align-items:center;justify-content:center;min-width:30px;height:28px;padding:0 6px;border:1.5px solid var(--line2);border-radius:8px;font-weight:700;font-size:16px;line-height:1;color:var(--ink);background:var(--sheet);cursor:pointer;margin-right:6px}
.mt-b:has(.mt-x:checked){background:var(--ink);color:var(--sheet);border-color:var(--ink)}
#fh{height:auto!important;min-height:26px}
#fh .rb-c .s,#fh .rb-c .m{display:none}
body:has(.mt-x:checked) #fh .rb-c .m,body:has(.mt-x:checked) #fh .rb-c .s{display:inline-flex}
#fh .rb-c{flex-direction:column;align-items:center;justify-content:center;gap:0}
#fh .rb-c .sem{font-weight:600;font-size:14px;color:var(--mut);line-height:20px}
#fh .rb-c:first-child .sem{color:var(--ink);font-weight:700}
.leg .se-on{display:none}
body:has(.mt-x:checked) .leg .se-on{display:inline}
body:has(.mt-x:checked) .leg .se-off{display:none}
</style>`;
function port(src, dst) {
  let t = fs.readFileSync(src, 'utf8');
  t = t.split('</head>').join(CSS + '</head>');
  // cellule : la semaine d'abord ; le solde disparaît (ses icônes restent dans .s)
  t = t.replace(/<button type="button" class="rb-c" data-libre-sem="(\d+)" aria-label="S\d+ : libre en fin de semaine [^;"]*; ([^"]*)">/g,
    (m, s, reste) => `<button type="button" class="rb-c" data-libre-sem="${s}" aria-label="S${s} ; ${reste}"><span class="sem">S${s}</span>`);
  t = t.replace(/<span class="s">[\d\u202f\u00a0 ]+/g, '<span class="s">');
  t = t.split('aria-label="Bande des semaines').join('aria-label="Semaines ; ± affiche les mouvements. Bande des semaines');
  t = t.split('<b>libre en fin de semaine</b>').join('<b><span class="se-off">semaines</span><span class="se-on">mouvement de la semaine</span></b>');
  const btn = '<label class="mt-b" aria-label="Afficher les + et − et les icônes de chaque semaine"><input type="checkbox" class="mt-x">±</label>';
  t = t.split('<span class="d"><button type="button" class="q-per"').join('<span class="d">' + btn + '<button type="button" class="q-per"');
  fs.writeFileSync(dst, t);
  console.log(dst, 'sem', (t.match(/class="sem"/g) || []).length, 'btn', (t.match(/class="mt-b"/g) || []).length);
}
port('v8/z2.html', 'se/z2s.html');
port('v8/w3.html', 'se/w3s.html');
