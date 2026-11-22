OK — f9 : n° 1 à 3 corrigés (critère du choix, liste Choisir 390, glissé Comparer), commit bd7e2a0f2

n° | verdict | commit | test | rouge→vert | capture
1 | corrige | bd7e2a0f2 | tests/unit/carnetsTour3F9.test.tsx (n° 1) | « expected 'Critère : Moins de condensation au pl…' to contain 'tient 80 °C, puis le débit' » → vert | ap-choisi-390-clair, ap-choisi-390-sombre, ap-choisi-1280-clair, ap-choisi-1280-sombre
2 | corrige | bd7e2a0f2 | tests/unit/carnetsTour3F9.test.tsx (n° 2) | « Cannot read properties of null » (pas de forme courte) → vert | ap-choisir-390-clair-liste, ap-choisir-390-sombre-liste
3 | corrige | bd7e2a0f2 | tests/unit/carnetsTour3F9.test.tsx (n° 3) | « '.cn-tableau-zone { overflow-x: auto; …' to match /position: relative/ » → vert | ap-comparer-390-clair-glisse, ap-comparer-390-sombre-glisse

## Causes et correctifs
1. `ChoisiVue` (Choisir.tsx) ne gardait les critères qui classent que si le critère reçu (`criteres[0]` du carnet, « capter la buée »)
   était le 1er d'entre eux ; sinon il affichait ce critère sans valeur. Désormais : les critères qui classent (« tient 80 °C, puis le
   débit »), et le critère reçu seulement si aucun ne classe.
2. La colonne de droite prenait sa largeur max-content (190 px, la phrase du seuil) et laissait 2 px au nom. Désormais : seuil court
   « < min. 1 500 » sous le prix (même forme que la cellule de Comparer, `horsSeuilCourt`), phrase entière en `.cn-cache` et `title`,
   `.cn-choisir .cn-article .cn-droite { flex: 0 0 auto; max-width: 40% }`. Mesure 390 : nom 2 px → 125 px (Hotte murale), 70 → 193 px.
3. Les `.cn-cache` (absolus) du tableau avaient pour bloc conteneur `.cn-tableau-cadre`, pas la zone qui défile : ils débordaient dans
   la DIV de défilement de l'app (sw 433 / cw 366). `.cn-tableau-zone { position: relative }` les garde dans la zone.

## Mesures (journal-av.txt → journal-ap.txt, captures/)
- n° 3 après glissé du doigt sur le titre, 390 clair et sombre : avant « décalés hors tableau : DIV:67 ; débords : DIV sw433 cw366 » ;
  après « [] ; [] ». `document.scrollingElement.scrollWidth <= innerWidth` : true avant comme après (390/390) — ce critère ne voyait pas le
  défaut : c'est la DIV de défilement de l'app (`.cn min-h-0 flex-1` > DIV) qui glissait ; mesure ajoutée au banc.
- n° 1 : « Critère : Moins de condensation au plafond : capter la buée » → « Critères : tient 80 °C, puis le débit, proposé par l'IA »
  (390 et 1280, deux thèmes).

## Tests
- tests-rouge.txt : 3 failed (3) ; tests-vert.txt : 3 passed (3).
- tests-final.txt : Test Files 49 passed (49), Tests 720 passed | 1 todo. `npx tsc --noEmit -p tsconfig.json` : code 0, 0 erreur.
- `git show --stat HEAD` : Choisir.tsx, carnets-decider.css, carnets.css, tests/unit/carnetsTour3F9.test.tsx, rien d'autre.
- Serveur 5196 arrêté, port libre (vérifié). Banc : `PORT_BANC=5196 node banc.mjs <prefixe>` (reprend `../v6/outil.mjs`).

## Écrans touchés (vision du pilote, `?dev-local`, Stocks › Matériel › Ventilation)
- Comparer 390 : glisser le titre du doigt, la page ne bouge pas, seul le tableau défile.
- Choisir 390 : liste sous le cadre pointillé, « < min. 1 500 » sous 1 450 et 690, noms sur 2 lignes.
- Choisi (après « Choisir chez Inox Broye ») 390 et 1280 : « Critères : tient 80 °C, puis le débit, proposé par l'IA ».

Prédiction : il ne dira rien de ces trois écrans, ce qui est le but.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : un `.cn-cache` (position absolute) dans une zone `overflow-x: auto` non positionnée échappe à son défilement et fait
déborder l'ancêtre défilant ; `scrollingElement.scrollWidth` ne le voit pas quand l'app défile dans une DIV.
LEÇON PROPOSÉE : aucune.
