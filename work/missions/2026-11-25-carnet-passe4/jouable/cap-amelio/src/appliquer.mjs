// Applique l'amélioration du 26.11 à la référence (p4 du 26.11 matin, commit 8277769ac) et écrit jouable/p4.html.
// node work/missions/2026-11-25-carnet-passe4/jouable/cap-amelio/src/appliquer.mjs <reference.html>
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ICI = path.dirname(fileURLToPath(import.meta.url)), SORTIE = path.join(ICI, '../../p4.html');
let s = fs.readFileSync(process.argv[2], 'utf8');
const un = (avant, apres) => { const n = s.split(avant).length - 1; if (n !== 1) throw new Error(n + ' fois : ' + avant.slice(0, 80)); s = s.split(avant).join(apres); };
un('<title>Carnets · jouable passe 4</title>', '<title>Carnets · jouable passe 4 (amélioré 26.11)</title>');
un('var arts = cp.articles.slice(0, 4)', 'var arts = cp.articles.slice(0, 8)'); /* point 4 : la vue Comparer tient 6 offres ou plus */
un('</style>', fs.readFileSync(path.join(ICI, 'amelio.css'), 'utf8') + '</style>');
// liste : en-tête L'Affinée + onglets Carnets / À faire, coup d'œil en haut, barre du pouce, onglets de l'app
un(`    <div class="p4-tete" role="tablist">
      <button type="button" role="tab" class="p4-tab on" id="tab-carnets">Carnets <span id="liste-n"></span></button>
      <button type="button" role="tab" class="p4-tab" id="tab-afaire">À faire <span id="n-afaire"></span></button>
    </div>
    <div class="m4j-liste" id="liste"></div>
    <div class="p4-bas-liste">
      <div class="p4-oeil" id="oeil"></div>
      <div class="p4-saisie"><input id="noter" type="text" placeholder="Noter, coller un lien…" enterkeyhint="send" autocomplete="off" aria-label="Noter dans un nouveau carnet"><button class="p4-plus" id="nouveau" type="button" aria-label="Nouveau carnet">+</button></div>
    </div>`, `    <div class="a-app"><span class="a-logo" id="a-logo" aria-label="L'Affinée"></span>
    <div class="p4-tete" role="tablist">
      <button type="button" role="tab" class="p4-tab on" id="tab-carnets">Carnets <span id="liste-n"></span></button>
      <button type="button" role="tab" class="p4-tab" id="tab-afaire">À faire <span id="n-afaire"></span></button>
    </div></div>
    <div class="p4-oeil" id="oeil"></div>
    <div class="m4j-liste" id="liste"></div>
    <div class="a-pouce"><div class="a-champ"><input id="noter" type="text" placeholder="Noter dans un nouveau carnet…" enterkeyhint="send" autocomplete="off" aria-label="Noter dans un nouveau carnet"><button class="a-ic" id="l-photo" type="button" aria-label="Photo dans un nouveau carnet"></button></div><button class="a-sg" id="l-sugg" type="button" aria-label="Ce que l’IA propose">✦</button><button class="a-plus" id="nouveau" type="button" aria-label="Nouveau carnet">+</button></div>
    <nav class="a-onglets" aria-label="L'Affinée"></nav>`);
// carnet : puce de catégorie dans l'en-tête ; Mes notes | Organisé + ✦ heure sous l'en-tête ; onglets de l'app
un(`      <button class="m4b-ic hors-edition" id="k-menu"`, `      <button class="a-catc hors-edition" id="a-catc" type="button"></button>
      <button class="m4b-ic hors-edition" id="k-menu"`);
const bascAvant = `    <div class="p4-bascule" role="tablist">
      <button type="button" role="tab" id="t-notes">✏️ Mes notes <span class="n" id="n-file" hidden>1</span></button>
      <button type="button" role="tab" id="t-org" class="on">▦ Organisé <i id="point-org" hidden></i></button>
    </div>
`;
un(bascAvant, '');
un(`    <div id="defil">
      <div id="p-notes">`, `    <div class="p4-bascule"><div class="a-seg" role="tablist">
      <button type="button" role="tab" id="t-notes">Mes notes <span class="a-l" id="a-nl"></span><span class="n" id="n-file" hidden>1</span></button>
      <button type="button" role="tab" id="t-org" class="on">✦ Organisé <i id="point-org" hidden></i></button></div>
      <button type="button" id="a-chg"><span id="a-chg-t"></span></button>
    </div>
    <div id="defil">
      <div id="p-notes">`);
un(`    <input type="file" accept="image/*" capture="environment" id="f-photo" hidden>
  </section>
</div>`, `    <input type="file" accept="image/*" capture="environment" id="f-photo" hidden>
    <nav class="a-onglets" aria-label="L'Affinée"></nav>
  </section>
  <!-- ===== Comparer : vue dédiée (son choix figé du 17.11 : h04-7, v03-4, g05-8, g01-8, h06-7) ===== -->
  <section class="vue" id="v-cmp" aria-label="Comparer">
    <div class="a-app a-app-cmp"><span class="a-logo" id="a-logo2" aria-hidden="true"></span><b class="a-marque">L'Affinée</b></div>
    <div class="m4b-top"><button class="m4b-ic" id="cmp-retour" type="button" aria-label="Retour au carnet"><svg><use href="#i-ret"/></svg></button><div class="p4-titre" id="cmp-titre"></div></div>
    <div id="cmp-defil" class="a-cmp"></div>
    <div id="cmp-pied"></div>
    <nav class="a-onglets" aria-label="L'Affinée"></nav>
  </section>
</div>`);
un('/* ====================================================================== démarrage */', fs.readFileSync(path.join(ICI, 'amelio.js'), 'utf8') + '\n/* ====================================================================== démarrage */');
fs.writeFileSync(SORTIE, s);
const js = s.slice(s.indexOf('<script>') + 8, s.lastIndexOf('</script>'));
new Function(js); console.log('ÉCRIT', SORTIE, s.length, 'octets · syntaxe OK');
