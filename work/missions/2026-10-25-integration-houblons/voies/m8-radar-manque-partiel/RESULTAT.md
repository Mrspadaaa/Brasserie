OK — page de choix corrigée après critique : 7 variantes du manque partiel, A en référence

## Fichiers écrits (tous dans ce dossier)
- `capturer.mjs` : les captures, dans l'app (Substituer, Lotus contre Solero et Calypso, fixtures `?dev-local`, VITE_HOP_V4=on). Les ajouts sont préfixés `m8r-` et retirés après chaque capture.
- `radar-d.tsx` (neuf) : la variante D, dessinée par le radar commun de l'app (`RadarBase`, tel quel), chargé par Vite dans la page.
- `lire-donnees.mjs` et `donnees-lues.json` : le radar et les niveaux des fiches, lus dans l'app.
- `fidelite.json` : la mesure avant et après chaque variante. `faire-page.mjs` et `page.html` : la page.
- `img/` : 8 captures, 780 px de large. `d-point-creux-tiretes.png` et `f-point-gris.png` sont retirées.

## Les cas, d'après les données de l'app (aucun cas construit)
- **1 sur 3** : floral, chez Calypso (0 fiche sur 4).
- **2 sur 3** :
  - melon, noyau, pépins, herbacé : Lotus et Solero ;
  - baies : Solero et Calypso ;
  - résineux : Lotus et Calypso.
- **3 sur 3** : végétal, épicé, terreux. Le bloc « sans donnée » reste, dans toutes les variantes.

Dans Substituer, chaque point posé à 0 est un « non décrit » : le houblon a 2 à 4 fiches, et aucune ne cite la famille. Les cas 1 et 2 de VOIE.md sont donc le même fait dans les données. Seul le dessin change d'un écran à l'autre.

## Reprise après la critique (`critique.md`)
- **D, bloquant (D180, D181), refaite.** D n'est plus un dessin par-dessus l'app. C'est le radar commun de l'app lui-même (`radar-d.tsx`), qui reçoit le manque partiel comme inconnu de la série (null) au lieu de 0 : la grammaire de Comparer. Ce qu'on voit :
  - pas de point au manque ;
  - les tiretés suivent l'anneau ou le bord, par la règle r2 : plus aucun trait ne passe par le centre ;
  - les points connus restent ceux de l'app (D181) ;
  - une pastille « ? » à la couleur du houblon, au bord.

  Il reste une seule corde droite en tiretés : celle de Lotus, d'agrumes (marqué) à floral (cité). Elle passe à 55 % du rayon, et r2 garde une telle corde ; elle ne traverse pas le centre. Le radar D est rendu en tête de la section, avec une copie de la légende. Celui de l'app reste dessous, intact et visible : la mesure tient, 1048 → 1048 nœuds.
- **F, bloquant (D183) : retirée.** Lotus et Solero au même endroit devenaient le même point gris, si bien que « 1 sur 3 » et « 2 sur 3 » se confondaient. L'idée « sans couleur, ce n'est pas une valeur » reste une greffe possible sur B : un disque « ? » gris cerclé de la couleur du houblon. Le « non décrit » garde deux façons d'être distingué : D (rien du tout, comme dans Comparer) et G.
- **B : refait.** Un disque « ? » par houblon qui manque, à sa couleur. Quand deux manquent, les deux disques sont empilés le long de l'axe : le premier sur le 0, le second un cran vers le bord. Le recadrage montre bien, sur melon, noyau, pépins et herbacé, un « ? » gris et un « ? » bleu, et un « ? » vert seul sur floral.
- **C : corrigée.** Les tranches hachurées étaient déjà dessinées sous la grille et sous les aires (insérées avant la grille). Elles sont maintenant plus fines et plus claires (trait de 1,5 à 50 %, sans fond teinté) : l'aire verte de Calypso et les contours se lisent par-dessus.
- **G, corrigée en passant** (relevé par le critique) : le disque du 0 est un gris uni très clair, sans hachures ni mot. Il ne prend plus l'habit du bloc « sans donnée ».

## Les variantes, telles que montrées
| Variante | Ce qu'elle fait | Capture |
| --- | --- | --- |
| A, l'actuel | le point sur le 0 se lit comme une valeur | `img/a-actuel.png` |
| B, « ? » sur l'axe | un « ? » par houblon qui manque, empilés le long de l'axe | `img/b-point-interrogation.png` |
| C, tiers hachurés | le secteur en trois tranches, une par houblon, hachurées à sa couleur, sous les aires | `img/c-tiers-hachures.png` |
| D, comme dans Comparer | radar de l'app, manque en inconnu de la série, tiretés le long, « ? » au bord | `img/d-inconnu-de-la-serie.png` |
| E, « ? » au picto | un « ? » par houblon qui manque, de part et d'autre du picto | `img/e-au-picto.png` |
| G, le trou du 0 | le disque du 0 teinté, les points qui y tombent sont creux | `img/g-trou-rien-cite.png` |
| H, couronne des fiches (mon idée) | trois arcs par picto | `img/h-couronne-fiches.png` |
| I, « rien sur » (mon idée) | dans la légende, les pictos barrés de ce que chaque houblon ne cite pas | `img/i-legende-rien-sur.png` |

## Sorties décisives
- `controle-capture-fidele.mjs …/capturer.mjs` → `FIDELE OK (capturer.mjs : rien de caché, mesure gardée)`. Chaque variante : 1048 → 1048 nœuds de l'app.
- `verifier-page.mjs …/page.html --page-lot --captures <tmp>/m8/page` → `PAGE OK (8 images chargées, lisible à 390 et 1280 px, sans erreur)`.
- Captures corrigées ouvertes : D en entier, et les recadrages de B, C et G (`%TEMP%/m8/zoom-*.png`). La page à 390 px aussi (`%TEMP%/m8/page-page.png`).
- Les captures ont été prises en un seul essai, sans erreur de page.

## Ma préférence, comme il la jugerait
**C ou B, greffée de I.** Le critique classe C premier : c'est la seule variante où « 1 des 3 » et « 2 des 3 » se comptent en tranches, avec ses hachures (rdg1). Elle est maintenant allégée sous l'aire verte. B, corrigée, répond aussi à sa question : deux « ? » de deux couleurs, c'est « 2 des 3 », et le « ? » est posé à l'endroit qu'il a entouré. I ajoute la liste par houblon sans toucher au radar.

Prédiction : « C on voit vraiment qui manque ; B c'est propre aussi ; avec I en dessous c'est top. »

DÉCISION À PRENDRE : le choix retenu doit valoir dans Substituer (non décrit à 0) comme dans Comparer (null et tiretés), puisque c'est le même fait dans les données. D montre déjà ce que donnerait la grammaire de Comparer dans Substituer. Si B ou C est choisie, faire une capture de Comparer avec la même grammaire avant le port dans `RadarBase.tsx`.

Limite : les captures sont faites sur l'arbre de travail du jour. Il contient des changements d'autres voies, non commités, dans `src/` (dont `adaptateur.ts`).

CONNAISSANCE : dans Substituer, le radar code « non décrit » à 0 (`NIV`), et seule la famille non décrite par les trois houblons devient null (« sans donnée »). Un manque d'un ou deux houblons sur trois s'y dessine donc comme une valeur sur l'anneau du 0. Un module `.tsx` placé dans le dossier d'une voie peut être importé par Vite dans la page de l'app (`import('/work/…/x.tsx')`) pour rendre un composant de l'app avec d'autres données, sans rien toucher dans `src/`.
LEÇON PROPOSÉE : aucune
