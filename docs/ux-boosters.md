# Boosters UX de L'Affinée — catalogue de travail

> **Catalogue non exhaustif : un booster qui n'y est pas est bienvenu s'il sert le brasseur.**

Version du 18.10.2026. Preuves, sources et raisonnement : rapport de recherche
`work/refonte-frontend/v4/recherche/F-ux-boosters.md` (dossier de travail local, non
versionné). Ce catalogue
complète [ui-compacte.md](ui-compacte.md) (choix du contrôle) et la section « Deux régimes »
de [DESIGN.md](../DESIGN.md) (plan 1 : 7 éléments et 60 mots au plus ; 80 pour le lot 2
de l'écran houblons). Il se donne tel quel à un auteur de maquette : chaque booster a un
identifiant (L1, C1…) à citer dans la `NOTE.md` de la maquette, avec le récit qu'il sert.

## Ce qu'est un booster

Un contrôle, une représentation ou une micro-interaction qui rend une relation, une
conséquence ou un choix immédiat, sans texte : **on agit, on voit**. Le brasseur l'a
demandé (« visuelement parlant et frappant », « plus de petits tag pratique », « basculer
d'un affichage à un autre », SPEC-BRASSEUR § 4).

**Test d'admission, quatre questions.** Une réponse « non » écarte le booster.

1. Quelle relation, conséquence ou quel choix devient immédiat ? (Si on le retire, le
   brasseur perd-il quelque chose ?)
2. Remplace-t-il du texte, un écran ou des gestes ? Il n'en ajoute pas.
3. Un indice visible dit-il qu'on peut agir (chevron, poignée, bord, curseur) ?
4. A-t-il son alternative : toucher simple, clavier, mouvement réduit, lecteur d'écran ?

**Règles communes.**

- **Durées** : 100 ms pour un retour simple, 200–300 ms pour un changement de vue, jamais
  plus de 400 ms ; plus un geste est fréquent, plus l'animation est courte (NN/g 2020).
  Tout bouge ensemble, sans échelonnement.
- **Mouvement réduit** : `MotionConfig reducedMotion="user"` à la racine. La valeur par
  défaut de Motion est `"never"` : sans ce réglage, la préférence est ignorée. En CSS,
  `@media (prefers-reduced-motion: reduce)` remplace le déplacement par un fondu ou rien.
- **Glisser** n'est jamais le seul chemin (WCAG 2.2, 2.5.7). Toucher la piste place la
  poignée, et des boutons − / + ou ↑ / ↓ font la même chose.
- **Activation au relâchement** (2.5.2) ; la rangée entière est la cible (DESIGN).
- **Défilement** : `touch-action: pan-y` sur les rangées, `none` seulement sur une poignée.
- **Annonce** : une valeur recalculée est un `<output>` ou une zone `aria-live="polite"`.
- **Haptique** : un complément, jamais l'unique retour. Android accepte
  `navigator.vibrate?.(8)`. Safari iOS n'a pas l'API Vibration, et l'astuce `switch` n'est
  pas fiable : le retour visuel doit suffire.
- **Couleur** toujours doublée d'une forme ou d'un mot ; pas de légende au plan 1.
- **Outils déjà là** : `motion` 13.2 (`motion/react`), `recharts` 3.10, composants de
  `src/ui`. React installé : 19.2.8. `<ViewTransition>` est stable depuis React 19.3
  (09.09.2026) : il faut une montée de version, à décider. `document.startViewTransition`
  est Baseline (Chrome 111, Safari 18, Firefox 144).

## Lire — voir où il en est

| ID | Booster | Quand (oui / non) | Exemple réel | Alternative accessible | Mise en œuvre |
|---|---|---|---|---|---|
| L1 | **Piste au style** (bullet graph) : bande de la norme nette, plage de la bière floue, repère creux ; on lit par position | Oui : valeur face à une norme (famille d'arôme, OG, IBU, ion). Non : aucune référence → nombre seul | [Apple Météo, 10 jours](https://iphonelife.com/content/what-do-iphone-weather-symbols-and-color-bars-mean) ; [Few, spécification](http://www.perceptualedge.com/articles/misc/Bullet_Graph_Design_Spec.pdf) | `role="img"` et `aria-label` avec les valeurs (« Floral 7, style 0–55 ») ; bande à 3:1 (1.4.11) ; chiffres au plan 2 | SVG inline ; [HopRangePlot](../src/ui/hopIndex/HopRangePlot.tsx) |
| L2 | **Seule l'exception est marquée** : le conforme reste neutre ; l'écart reçoit couleur, forme et mot (« trop », « peu », « ≈ ») | Oui : liste majoritairement conforme. Non : comparaison complète demandée explicitement | [Apple Signes vitaux](https://www.tomsguide.com/wellness/smartwatches/watchos-11-public-beta-i-tried-the-new-apple-watch-vitals-health-app-heres-how-it-works-and-first-impressions) ; [YNAB](https://support.ynab.com/en_us/colors-and-icons-in-your-plan-HJQv_XHko.md) | Mot et forme, jamais la couleur seule (1.4.1) ; le nombre d'écarts est annoncé | Classes CSS ; une seule couleur d'alerte (DESIGN) |
| L3 | **Mini-profil dans la ligne** (sparkline) : un graphique de la taille d'un mot | Oui : repérer une forme en parcourant une liste. Non : quand la valeur exacte décide ; plus d'une série | [Apple Bourse](https://support.apple.com/guide/iphone/check-stocks-iph1ac0b1bc/ios) (liste de suivi) ; [Tufte](https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/) | `aria-label` résumé (« floral et herbacé hauts ») ; chiffres au toucher | SVG de 48 × 12 px sans bibliothèque ; pas de recharts dans une rangée |
| L4 | **Jauge à bande compacte** : une valeur dans sa plage, avec ses zones, sur une ligne | Oui : la valeur clé de l'en-tête (IBU, ABV, stock). Non : plusieurs valeurs à comparer → L1 | [Whoop](https://www.whoop.com/thelocker/how-does-whoop-recovery-work-101) ; [Oura](https://support.ouraring.com/hc/en-us/articles/360057791533-Readiness-Contributors) | `<meter min max low high optimum>` natif avec la valeur en texte | [LevelGauge](../src/ui/LevelGauge.tsx) ou `<meter>` stylé |
| L5 | **Chiffre qui roule et delta** : la valeur recalculée roule dans le sens du changement ; un « +4 » éphémère donne l'écart | Oui : résultat d'un réglage en cours (IBU, OG, EBC, ppm). Non : flux continu, colonnes de tableau | [Robinhood](https://www.bloomberg.com/features/2021-robinhood-stock-trading-design) (cours qui flashent) ; [NumberFlow](https://number-flow.barvian.me) | `<output aria-live="polite">` ; en mouvement réduit, remplacement direct et delta gardé 2 s | `@number-flow/react` (dépendance à évaluer) ou `AnimatePresence` sur la clé ; `tabular-nums` |
| L6 | **Compteur-déclencheur** : la réponse tient en comptes touchables (« 3 au style · 9 non situées › ») ; chaque compte ouvre son groupe | Oui : résumé d'une liste classée par état. Non : compte sans action derrière | [Function Health](https://apps.apple.com/app/id6471280307) (compteurs dans / hors plage) ; Stocks de l'app (« À commander ») | `<button aria-expanded>` avec un nom complet (« 9 familles non situées, afficher ») | Disclosure ; le compte vit dans le libellé |

## Comparer

| ID | Booster | Quand (oui / non) | Exemple réel | Alternative accessible | Mise en œuvre |
|---|---|---|---|---|---|
| C1 | **Bascule de lentille** (Barres ↔ Radar, Liste ↔ Carte, Courbe ↔ Tableau) : mêmes données, autre forme ; la transition garde sélection, couleurs et ordre | Oui : deux questions sur les mêmes données (exactitude ou silhouette). Non : une vue porte une information absente de l'autre ; plus de 3 lentilles | [Our World in Data](https://ourworldindata.org/redesigning-our-interactive-data-visualizations) (Chart / Map / Table) ; [ECharts, universalTransition](https://echarts.apache.org/handbook/en/basics/release-note/5-2-0) | `SegmentedControl` (groupe radio, flèches) ; en mouvement réduit, fondu de 150 ms au plus ou bascule instantanée | Voir « Bascule de lentille » plus bas |
| C2 | **Superposition avec bascule** : un calque de référence (style, recette actuelle, brassin précédent, seconde voie) s'allume sur la même vue | Oui : 2 profils sur la même échelle. Non : plus de 2 couches ; échelles différentes | [Sofascore](https://www.sofascore.com/news/sofascores-attribute-overview-the-ultimate-tool-for-player-analysis) (deux joueurs sur le graphique radial) | Bouton `aria-pressed` « Comparer à … » ; la référence est en pointillé, pas seulement d'une autre couleur | Couches SVG, opacité animée |
| C3 | **Haltère avant → après** : deux points reliés, où l'on est et où l'on irait ; la longueur et le sens disent l'effet | Oui : effet d'une option sur plusieurs grandeurs. Non : plus de 2 états ; écart plus petit que l'incertitude → « ≈ » | [Datawrapper, flèches et plages](https://www.datawrapper.de/blog/new-arrow-and-range-plots) ; [Apple Bourse](https://support.apple.com/guide/iphone/check-stocks-iph1ac0b1bc/ios) (deux doigts : écart entre deux dates) | Nom « Floral 7 → 22 (+15) » ; flèche statique en mouvement réduit | SVG `line` et deux `circle` ; l'extrémité s'anime |
| C4 | **Petits multiples** : une mini-vue par option, même échelle, mêmes axes, alignées | Oui : comparer 2 à 4 options à fond ; remplace une animation. Non : plus de 6 vues sur téléphone | [Datawrapper Multiple Lines](https://www.datawrapper.de/blog/small-multiple-line-charts) (la valeur pointée apparaît dans chaque panneau) | Tableau équivalent au plan 2 ; un titre par panneau | Grille CSS ; même composant avec une prop `scale` partagée |
| C5 | **Panier de comparaison** : on marque 2 ou 3 candidats, puis « Comparer (2) » ouvre la comparaison | Oui : résultats nombreux (voies, levures). Non : 3 résultats ou moins (comparer d'emblée) | [Apple, comparer les iPhone](https://www.apple.com/iphone/compare/) ; [Sofascore](https://www.sofascore.com/news/sofascores-attribute-overview-the-ultimate-tool-for-player-analysis) | Cases à cocher natives ; compteur en `role="status"` | `Set` d'identifiants ; barre basse qui apparaît (`AnimatePresence`) |
| C6 | **Focus et contexte** : toucher un élément le met en avant dans toutes les vues et atténue le reste | Oui : plusieurs vues des mêmes objets. Non : si l'atténuation cache une donnée décisive | [Datawrapper Multiple Lines](https://www.datawrapper.de/blog/small-multiple-line-charts) | Sélection au toucher et au clavier, jamais au survol seul (1.4.13) ; `aria-current` | `selectedId` partagé par un contexte React ; `opacity` CSS |
| C7 | **Carrousel à crans** : balayer d'une option à l'autre, une à la fois, avec des points de pagination | Oui : 3 à 8 options de même forme, examinées une à une sur téléphone. Non : comparaison côte à côte → C4 | [Apple Météo](https://support.apple.com/guide/iphone/check-the-weather-iph1ac0b35f/ios) (balayer entre les villes) | Points qui sont des boutons, précédent / suivant, clavier ; jamais de défilement automatique (2.2.2) | `scroll-snap-type: x mandatory`, `overscroll-behavior-x: contain` |

## Choisir

| ID | Booster | Quand (oui / non) | Exemple réel | Alternative accessible | Mise en œuvre |
|---|---|---|---|---|---|
| H1 | **Contrôle segmenté** : 2 à 5 options visibles, effet immédiat | Oui : vues proches ou valeur courte. Non : plus de 5 options ; libellés longs → select | [Apple Santé](https://support.apple.com/en-ca/guide/iphone/iphe3d379c32/ios) (jour / semaine / mois / année) | Groupe radio, un seul arrêt de tabulation, flèches | [SegmentedControl](../src/ui/SegmentedControl.tsx) |
| H2 | **Pastille qui tourne** : la valeur est la commande ; un toucher passe à la suivante avec une rotation visible | Oui : 5 valeurs familières au plus, réversibles (moment, unité, statut). Non : choix coûteux ou à découvrir | [Apple Musique](https://support.apple.com/guide/iphone/shuffle-or-repeat-songs-iphe22408524/ios) (Répéter : un toucher pour tout, deux pour un morceau) | Nom « Moment : 60′ — appuyer pour passer à 10′ » ; appui long ou clic droit pour la liste complète | [CycleTag](../src/ui/CycleTag.tsx) ; à ajouter : roulement de l'étiquette et rotation du chevron (150 ms), coupés en mouvement réduit |
| H3 | **Puces de suggestion** : l'app propose les choix probables, générés par la situation ; un toucher lance | Oui : direction à demander (« + floral »). Non : options fixes → H1 ; plus de 5 puces visibles | [Google Maps](https://support.google.com/maps/answer/4610185) (catégories sous la recherche, selon le mode de déplacement) ; [Material 3](https://m3.material.io/components/chips/guidelines) | Boutons natifs dans un groupe nommé ; libellés de 20 caractères au plus | Rangée `overflow-x-auto` ; préréglage connu : [PresetChips](../src/ui/PresetChips.tsx) |
| H4 | **Puces de filtre avec compteur** | Oui : réduire une liste. Non : filtres cachés qui expliqueraient une liste vide | [Google Maps](https://support.google.com/maps/answer/4610185) ; [Material 3](https://m3.material.io/components/chips/guidelines) | `aria-pressed` ; filtres actifs visibles ; nombre de résultats annoncé | [CatalogToolbar](../src/ui/production/CatalogToolbar.tsx), [EntityList](../src/ui/EntityList.tsx) |
| H5 | **Verrou et relance** : épingler ce qu'on garde (un houblon, une famille), relancer pour le reste | Oui : moteur de proposition à contraintes. Non : si le verrou n'a pas d'effet calculé | [Coolors](https://coolors.co) (cadenas sur une couleur, la barre d'espace régénère les autres) | Bouton bascule `aria-pressed` ; la relance a un bouton visible | `CycleTag` à trois états (· / garder / exclure), reliés aux préférences et exclusions du solveur ([hop-solver.md](hop-solver.md)) ; à vérifier sur le moteur v4 |
| H6 | **Toucher la donnée** : on choisit en touchant la marque (piste, sommet du radar), pas un menu à côté | Oui : chaque marque est un objet actionnable. Non : marques de moins de 24 px sans zone élargie | [Google Maps](https://support.google.com/maps/answer/4610185) (toucher un lieu) ; [Sofascore](https://www.sofascore.com/news/sofascores-attribute-overview-the-ultimate-tool-for-player-analysis) (toucher une catégorie) | Rangée entière en `<button>` ; focus le long de l'axe ([HIG Charts](https://developer.apple.com/design/human-interface-guidelines/charts)) | Boutons HTML superposés au SVG ; cible invisible par sommet du radar |

## Ajuster

| ID | Booster | Quand (oui / non) | Exemple réel | Alternative accessible | Mise en œuvre |
|---|---|---|---|---|---|
| J1 | **Glisser une cible sur une piste** : on pose ce qu'on veut sur l'échelle ; l'écart se lit pendant le geste | Oui : viser une intensité relative au style. Non : valeur exacte imposée → J3, J5 | [Google Home, thermostat Nest](https://support.google.com/googlehome/answer/10178773) (glisser le cadran ou + / −) | Toucher la piste place la cible ; − / + ; flèches ([APG slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/)) | `input type="range"` transparent sur le SVG, ou pointer events avec `touch-action: none` sur la poignée seule ; [SliderField](../src/ui/SliderField.tsx) |
| J2 | **Curseur à crans** : la poignée s'aimante aux valeurs utiles ; toucher un cran y saute | Oui : peu de valeurs signifiantes (bornes du style, doses usuelles). Non : grandeur continue fine | [iPhone Appareil photo](https://support.apple.com/guide/iphone/camera-basics-iph263472f78/ios) (0,5× / 1× / 2× au toucher, molette en maintenant) | Les crans sont des boutons ; `step` et `datalist` ; haptique jamais seule | [RatioSlider](../src/ui/RatioSlider.tsx) / SliderField et `<datalist>` ; `vibrate` sur Android seulement |
| J3 | **Stepper en ligne avec paliers** : valeur, unité et − / + sur la même ligne | Oui : quantité ajustée souvent. Non : grandeur bornée à explorer → J1 | [Google Home](https://support.google.com/googlehome/answer/10178773) (+ / − d'un degré) | Champ saisissable `inputmode="decimal"` ([APG spinbutton](https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/)) | [QuantityStepper](../src/ui/QuantityStepper.tsx) `compact` |
| J4 | **Nombre à glisser** (scrubbing d'une valeur) : glisser sur un nombre ou son libellé le fait varier | Oui : ordinateur, exploration rapide. Non : téléphone dans une liste qui défile ; seule voie de saisie | [Figma](https://help.figma.com/hc/en-us/articles/360039956914-Adjust-alignment-rotation-position-and-dimensions) ; [Bret Victor, Tangle](https://worrydream.com/Tangle) | Le nombre reste un champ (toucher pour saisir) ; ↑ / ↓ | Pointer events et `setPointerCapture` ; actif à la souris par défaut |
| J5 | **Édition sur place** : toucher la valeur l'ouvre en saisie à sa place | Oui : valeur rarement modifiée, déjà affichée. Non : formulaire de création | [Figma](https://help.figma.com/hc/en-us/articles/360039956914-Adjust-alignment-rotation-position-and-dimensions) (champs de propriétés) ; Prix et marges de l'app | Indice d'éditabilité ; Entrée valide, Échap annule | [NumericField](../src/ui/NumericField.tsx) ; pas de bouton « Modifier » |
| J6 | **Aperçu fantôme** (avant / après) : l'effet d'un choix s'affiche en fantôme avant d'être appliqué ; maintenir montre l'origine | Oui : effet calculable (voie, sel, dose). Non : effet non modélisé : ne rien inventer | [Lightroom mobile](https://www.adobe.com/learn/lightroom-cc/web/compare-photo-edits-lightroom-mobile) ; [Google Photos](https://support.google.com/photos/answer/6128850) (maintenir pour comparer) | Bascule visible « Avant / Après » (`aria-pressed`) ; le maintien n'est qu'un raccourci | Couche SVG à 40 % d'opacité, contour pointillé ; état d'aperçu séparé de l'état enregistré |
| J7 | **Curseur sur distribution** : un histogramme sous la piste montre les valeurs habituelles | Oui : choisir une dose parmi des usages réels. Non : distribution inconnue ou trop maigre | Airbnb, filtre de prix ([description, source secondaire](https://babich.biz/blog/slider-concepts/)) | Champs min / max ; résumé (« la plupart entre 4 et 8 g/L ») | Barres SVG derrière SliderField |

## Explorer en profondeur

| ID | Booster | Quand (oui / non) | Exemple réel | Alternative accessible | Mise en œuvre |
|---|---|---|---|---|---|
| X1 | **Dépliage en place** : la rangée s'ouvre sous elle-même ; le reste ne saute pas | Oui : détail court d'une rangée (plan 2). Non : contenu long → X2 ; imbrication | [NN/g, accordéons mobiles](https://www.nngroup.com/articles/mobile-accordions/) ; Clients de l'app | `<details>` ou `aria-expanded` ; une erreur ouvre la section | `<details name>` (exclusif) ou grille `0fr → 1fr` |
| X2 | **Feuille à crans** : détente moyenne, puis pleine ; la vue reste visible derrière | Oui : détail riche (plan 3). Non : parcours de pages dans la feuille ; feuilles empilées | [Apple HIG Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets) ; [Google Maps](https://support.google.com/maps/answer/4610185) (fiche de lieu) | Poignée et bouton Fermer ; Retour ferme ; focus contenu | [Sheet](../src/ui/Sheet.tsx) (repose sur `vaul`, que PRODUCT.md déclare refusé : écart à trancher) |
| X3 | **Appui long pour prévisualiser** : maintenir montre un aperçu ; relâcher le referme | Oui : raccourci d'usage fréquent. Non : seul accès ; action destructrice | [Menus contextuels iOS](https://developer.apple.com/design/human-interface-guidelines/context-menus) ; [Google Photos](https://support.google.com/photos/answer/6128850) | Même contenu par un chevron visible ; clic droit ou touche menu sur ordinateur | Minuteur de 450 ms annulé au-delà de 8 px ; `-webkit-touch-callout: none` |
| X4 | **Scrubbing sur graphique** : glisser le doigt, la valeur se lit à l'endroit | Oui : courbe dense (température, densité, dépenses). Non : 3 valeurs → les écrire | [Apple Bourse](https://support.apple.com/guide/iphone/check-stocks-iph1ac0b1bc/ios) ; [Robinhood](https://robinhood.com/us/en/support/articles/using-advanced-charts) (appui long pour démarrer) | Flèches clavier ; tableau ; points touchables | Calque SVG à pointer events ; `touch-action: pan-y` ; démarrage après appui long sur téléphone |
| X5 | **Valeur exacte au toucher** : toucher une marque montre sa valeur près d'elle | Oui : valeur secondaire. Non : donnée décisive (« ne pas exiger l'interaction pour l'essentiel », HIG) | [Apple Santé](https://support.apple.com/en-ca/guide/iphone/iphe3d379c32/ios) ; [HIG Charts](https://developer.apple.com/design/human-interface-guidelines/charts) | Reste ouverte jusqu'à fermeture, Échap ferme (1.4.13) | [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) |
| X6 | **La réponse, puis le pourquoi** : un verdict se déplie en ses contributeurs, en petites barres | Oui : verdict calculé à partir de causes connues. Non : causes non modélisées → le dire | [Oura, contributeurs](https://support.ouraring.com/hc/en-us/articles/360057791533-Readiness-Contributors) | Liste de contributeurs avec leurs valeurs | Barres horizontales en SVG ou en `div` ; plan 2 |

## Agir et annuler

| ID | Booster | Quand (oui / non) | Exemple réel | Alternative accessible | Mise en œuvre |
|---|---|---|---|---|---|
| A1 | **Balayer pour marquer** : un geste sur la ligne épingle, signale ou archive | Oui : action répétée sur une liste. Non : action unique ou rare ; deux sens différents selon l'écran | [Apple Mail](https://support.apple.com/guide/iphone/flag-or-block-emails-iph3caefa61/ios) | Même action dans le menu de ligne et au clavier ; indice visible (bord coloré) | [SwipeRow](../src/ui/SwipeRow.tsx) ; réversible = immédiat, destructif = confirmé |
| A2 | **Annuler en un geste** : l'action s'applique ; « Annuler » reste disponible jusqu'à l'action suivante | Oui : action réversible (poser une voie, marquer, supprimer un relevé). Non : action externe irréversible → confirmer | [Material 3 Snackbar](https://m3.material.io/components/snackbar/guidelines) ; [iPhone](https://support.apple.com/en-sg/guide/iphone/iph3c50f96e/ios) (trois doigts pour annuler) | `role="status"` ; pas d'auto-fermeture sur le web sans retour en ligne ; Ctrl+Z ; jamais posée sur des éléments focusables | Étendre le toast d'[App](../src/App.tsx) (4 s, sans action) ; modèle : annulation de [BrewJournal](../src/ui/BrewJournal.tsx) |
| A3 | **Glisser pour placer** : déposer un objet à sa place (un houblon sur 60′, 10′ ou DH) | Oui : placement dans une structure visible. Non : liste sans structure | [Things 3, Magic Plus](https://www.culturedcode.com/things/support/articles/2803582) | Toucher l'objet, puis la destination ; menu « Placer à… » | Pointer events et `setPointerCapture` ; zones de dépôt surlignées |
| A4 | **Ranger par glisser, avec ↑ / ↓** | Oui : ordre choisi par le brasseur. Non : ordre calculé (tri) | [Apple Bourse](https://support.apple.com/guide/iphone/check-stocks-iph1ac0b1bc/ios) (maintenir et glisser un titre) | ↑ / ↓ dans la rangée active (exemple donné par WCAG 2.5.7) | `Reorder` de `motion/react`, et les boutons |
| A5 | **État vide qui propose l'action** : dire pourquoi c'est vide et offrir le geste qui remplit | Oui : liste, résultat ou voie vide. Non : une illustration seule | [NN/g, états vides](https://www.nngroup.com/articles/empty-state-interface-design/) | Le geste proposé est un vrai bouton ou lien | Composant local ; jamais un vide muet |

## Bascule de lentille : la spécification

Exigence du brasseur (R45) : « Pouvoir passer de l'un à l'autre, pas avoir les deux à la
fois forcément. »

1. **Même contenu.** Chaque lentille montre les mêmes familles, la même bande du style, la
   même plage de la bière et la même sélection. Aucune information n'est propre à une seule
   lentille. Barres par défaut ; le choix est mémorisé localement.
2. **Même ordre.** Les familles sont dans un ordre fixe : de haut en bas en barres, dans le
   sens horaire depuis midi en radar. Les familles voisines restent voisines. L'ordre ne
   change ni avec le tri ni avec la bière.
3. **Mêmes couleurs, même échelle.** Une voie garde sa couleur partout ; la référence est
   en pointillé. L'échelle relative au style est la même dans les deux lentilles, et le
   radar reste zoomé sur le style.
4. **Le radar n'accepte que 2 profils superposés** (ma bière et une voie, ou ma bière et le
   style). Au-delà, petits multiples de radars ou barres. Le radar sert la silhouette ;
   l'écart précis se juge en barres.
5. **Le morphing.** Chaque famille est un même objet à clé stable. Sa position est
   interpolée par un paramètre `t`, de la rangée (barres) au sommet (radar) : 250 à
   300 ms, sortie douce, tout ensemble.
   - Si le passage est confus, il se fait en deux temps : les axes, puis les marques.
   - La sélection reste allumée pendant le passage et après.
6. **Mouvement réduit** : fondu de 150 ms au plus, ou bascule instantanée. Rien d'autre ne
   change.
7. **Contrôle** : `SegmentedControl` de 2 segments, texte seul, près du graphique. Le
   lecteur d'écran a la même description dans les deux lentilles.
8. **Mise en œuvre** : un seul composant SVG maison, qui calcule les positions selon `t`
   (`animate` de `motion`). Recharts ne fait pas de morphing entre `BarChart` et
   `RadarChart`. `<ViewTransition>` demande React 19.3 et procède par captures d'image :
   le fondu fonctionne, le morphing des formes SVG internes reste à prouver.

## Écran houblons

Écran 1 de la v4 ([PRIORITE.md](../work/refonte-frontend/v4/ecran-1/PRIORITE.md)). État A :
lecture au style ; état B : après « + floral, − résineux ».

| Booster | Ici |
|---|---|
| L1 Piste au style | 12 familles : les 3 attendues en grand, les 9 autres en compact ; bande du style nette, plage de la bière floue, ma bière en point |
| L2 Exception | Seules « trop », « peu » et « ≈ » sont marquées ; une famille au style reste neutre |
| L3 Mini-profil | Dans chaque ligne de « Mes houblons » (A) et de voie (B) : 12 cellules à l'échelle du style |
| L4 Jauge à bande | En-tête : « 60 IBU » dans la bande 50–70 du style |
| L5 Chiffre qui roule | IBU et intensité visée quand on tourne moment ou dose, ou qu'on prévisualise une voie (« +3 IBU ») |
| L6 Compteur-déclencheur | A : « 3 au style · 9 non situées › ». B : « Plus floral : 14 voies › · Moins résineux : aucune voie › » |
| C1 Lentille | Barres ↔ Radar sur la lecture au style ; Liste ↔ Carte pour « Mes houblons » |
| C2 Superposition | Le calque du style est allumé par défaut ; toucher une voie la superpose (une seule en radar) |
| C3 Haltère | Effet d'une voie : actuel → prévu sur chaque piste touchée |
| C4 Petits multiples | Voies marquées : mêmes pistes alignées, une colonne par voie (ordinateur), points groupés (téléphone) |
| C5 Panier | Case par voie ; « Comparer (2) » n'apparaît qu'à partir de 2 |
| C6 Focus et contexte | Toucher « floral » l'allume dans la piste, le radar et les mini-profils des voies |
| H1 Segmenté | Barres / Radar ; Liste / Carte |
| H2 Pastille qui tourne | Moment (60′ → 10′ → 0′ → DH) et dose (paliers) des houblons de la recette |
| H3 Suggestions | « + floral », « − résineux », générées par l'écart au style : l'action principale de l'état A |
| H4 Filtres | Voies : « en stock », « à acheter », avec compteurs |
| H5 Verrou | Pastille à trois états sur un houblon (· / garder / exclure), puis relance du moteur |
| H6 Toucher la donnée | Toucher une famille (rangée ou sommet) la sélectionne et ouvre son dépliage |
| J1 Glisser la cible | Poser la cible florale sur sa piste ; toucher la piste fait de même ; − / + d'un cran |
| J2 Crans | La cible s'aimante aux crans du style (bas, milieu, haut de la bande) |
| J6 Fantôme | Toucher une voie montre son effet en fantôme sur toutes les pistes ; maintenir la lecture montre l'origine |
| X1 Dépliage | Rangée famille : bande en chiffres, plage, repère, cran, verdict |
| X2 Feuille | Source BJCP, calcul IBU, fiches des houblons (plan 3) |
| X3 Appui long | Maintenir une voie : fantôme provisoire (raccourci de J6) |
| X5 Valeur au toucher | Valeur exacte d'un sommet du radar |
| X6 Le pourquoi | « trop résineux » se déplie en contributeurs (Nugget 60′…) si le modèle les calcule, sinon « cause possible hors houblon » |
| A2 Annuler | Après « Poser la voie » : « Voie posée · Annuler » |
| A5 État vide | « Moins résineux : aucune voie » ouvre les causes hors houblon, jamais un vide muet |

**Les dix à mettre en avant** (chaque maquette du lot 2 en fait fonctionner au moins
quatre, dont C1) :

1. **L1 Piste au style** : la réponse se lit par position, sans chiffre.
2. **C1 Barres ↔ Radar en morphing** : sélection, couleurs et ordre conservés.
3. **H3 Puces « + floral » / « − résineux »** : la demande en un toucher.
4. **J1 et J2 Glisser la cible sur la piste**, à crans, avec toucher-pour-placer et − / +.
5. **J6 et C3 Fantôme de voie** : l'haltère actuel → prévu sur toutes les pistes.
6. **H2 et L5 Pastilles qui tournent** (moment, dose), avec l'IBU qui roule et son delta.
7. **L6 et L2 Compteurs-déclencheurs**, avec l'exception seule marquée.
8. **C5 puis C4 Panier « Comparer (2) »**, puis petits multiples des voies.
9. **L3 Mini-profils** de 12 cellules dans chaque ligne de houblon et de voie.
10. **H5 Verrou** garder / exclure, puis relance du moteur.

## Ailleurs dans l'app

| Écran | Boosters | Ici |
|---|---|---|
| Recettes | L1, L5 | Pistes au style pour OG, FG, IBU, EBC et ABV ; chiffres qui roulent et nuancier EBC qui suit les malts |
| Stock | J6, A1, A2 | Fantôme de la consommation des brassins planifiés sur la jauge ; balayer pour épingler, puis « Annuler » |
| Brassage (jour J) | X4, J3, A2 | Frise des paliers avec repère « maintenant » et scrubbing ; relevés au stepper ; annuler un relevé |
| Eau | C1, J2, J6 | Radar ionique ↔ barres de plage (même spécification que C1) ; crans du style sur le curseur SO₄/Cl ; avant / après traitement en fantôme. Garder radar, curseur et sels visibles ensemble à 390 × 844 (ui-compacte) |
| Levure | C4, C5, J1 | Petits multiples des souches sur les mêmes échelles ; panier de 2 ou 3 ; plage de fermentation glissée sur la bande de la souche (deux poignées, [APG multi-thumb](https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/)) |
| Fermentation | J1, A4, X4 | Glisser une borne de palier sur la frise, avec − / + ; courbe de température explorée au doigt |

## Pièges

- **Le gadget.** Appliquer le test d'admission : si l'on retire le booster et que le
  brasseur ne perd ni relation, ni conséquence, ni choix, il part.
  - Pas de radar décoratif, pas d'animation au repos.
  - Pas de confettis (`canvas-confetti` est installé) pour un geste courant.
  - Le nombre de widgets n'est pas un critère (ui-compacte).
- **Le geste caché.** Chaque geste a un indice visible (chevron, poignée, bord) et un
  équivalent visible : bouton, menu, toucher simple.
  - Un geste garde le même sens dans toute l'app.
  - L'appui long et le balayage restent des raccourcis.
  - Selon NN/g, les actions cachées derrière un balayage ne sont pas découvertes.
- **Trop d'animation.**
  - Une seule chose bouge par action ; 100 à 300 ms ; aucune boucle.
  - L'animation sert à suivre un changement, pas à comparer : les petits multiples
    statiques sont plus rapides et plus exacts que l'animation pour analyser.
  - Mouvement réduit respecté : le piège est le `"never"` par défaut de Motion.
- **Le conflit avec le défilement.**
  - Un geste horizontal dans une page verticale prend `touch-action: pan-y`.
  - Le scrubbing démarre après un appui long sur téléphone.
  - Aucun geste ne part du bord de l'écran, que le système réserve au retour en arrière.
  - Un carrousel prend `overscroll-behavior-x: contain` ; le défilement interne d'une
    feuille se distingue de son glissement pour fermer.
- **L'information enfermée.** Une donnée décisive ne vit jamais seulement dans une lentille,
  un survol, un popover ou un appui long (Datawrapper, HIG Charts).
- **Le retour promis mais absent.** Pas d'haptique sur iPhone en web ; le toast actuel
  disparaît en 4 s, ce qui est trop court pour annuler et inaccessible selon Material 3.
- **La couleur seule.** Toujours doublée d'une forme, d'un motif ou d'un mot ; une marque
  qui exige une légende au plan 1 est mal choisie.
