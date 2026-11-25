OK — 4 problèmes, 0 bloquants

RESULTAT cal-77 : 4 problèmes (B 0, m 4, D 8) — corrigés rejoués 6/7 — carnet identique oui — BUGS OK

cal-77 : 4 problèmes (B 0) ; bord ~6→~15 col./s à 30 px, pire image 216–274→222–232 ms (images > 200 ms en 2 s : 4→2) ; données identiques oui

Version : index-CC3nR2pp.js. Le serveur le sert (curl ?nocache), comme le DOSSIER. La VOIE cite SSQ_J86L ; le DOSSIER prime. Service worker contourné dans mon onglet (`Network.setBypassServiceWorker`) ; paquet relu dans la page à chaque relevé.
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2437 bugs, 614 ouverts, 202 sources).
Couvert : 390 × 844, deviceScaleFactor 2, au toucher (CDP), clair ; 2 captures à 1280 (G-1280, G-1280-fiche) ; 2 en sombre (G-sombre, G-sombre-fiche), thème posé par l'attribut dans mon onglet seulement. Chrome de débug 9222, mon onglet seulement : `page.close()` puis `disconnect()`, jamais `browser.close()`. Aucun appel IA. Mêmes scripts qu'au tour 73 (copiés de cal-73, cible `k77`).

## Ses données : avant = après (`avant.json`, `apres.json` : 14 champs sur 14 identiques)
- À dépenser −463 (S53). En caisse 1 145,00 (libre 1 145,00). Synthèse 0,00 / 265,40. Opérations 265,40 / 0,00 / 265,40. Solde de départ 1 145,00.
- Période : 6 sem., du 23 nov. 2026 au 3 janv. 2027 ; le localStorage est identique (remis après chaque geste de vue).
- Ses 16 choses de la frise : aria identiques une par une (`cmp.mjs` : 16/16, aucune disparue ni nouvelle). Matériel › À venir identique (11), Carnets 32. Aucune ZZ restante (Calendrier et Opérations).

## Tableau
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| avant-S3-calendrier, A-ouvert | clair | 390 | ouvert, 6 sem. | 0 | 0 |
| D-pendant, D-3sem | clair | 390 | poignée de fin tirée, 3 sem. | 1 (n° 1) | 0 |
| S1-semaine53 | clair | 390 | 1 sem. sur S53 | 0 | 0 |
| E-4ans | clair | 390 | 4 ans | 1 (n° 1) | 0 |
| F-stocks, F-materiel | clair | 390 | Stocks, Matériel | 1 (n° 2) | 0 |
| Z3, Z4-*, Z5-*, Z6-*, Z7, Z8 | clair | 390 | ZZ créée, déplacée, allongée, au bord, vente, fiche | 1 (n° 4) | 0 |
| G-1280, G-1280-fiche | clair | 1280 | ouvert, carte | 1 (n° 1) | 0 |
| G-sombre, G-sombre-fiche | sombre | 390 | ouvert, carte | 0 | 0 |
| (mesures) | clair | 390 | ouvrir, glisser, bord | 1 (n° 3) | 0 |

## Combien et quels problèmes : 4
1. **CALP-6 toujours présent** (m, rouvert). L'aria distingue maintenant « Jhhh · 5 sept. » et « Jhhh · 7 sept. », mais le texte affiché dit encore « Jhhh · coût à venir » sur deux lignes identiques à 4 ans, et « neipa v3 · coût à venir » deux fois (cap/E-4ans.png). À 1280 et à 3 sem., on lit aussi deux fois « neipa v3 · coût à venir ». Elles ne se distinguent que par « J15 / 101 » et « J14 / 25 » à droite (G-1280.png, D-3sem.png). À 390 et 6 sem., la seconde dit bien « neipa v3 · 11 nov. ». Il dirait : « Lequel des deux Jhhh c'est ? » La ligne n'est pas à moi. Texte proposé au pilote : « ouvert — présent (tour 77, 25.11, en ligne index-CC3nR2pp.js : l'aria distingue, l'étiquette affichée non ; Jhhh ×2 à 4 ans, neipa v3 ×2 à 1280 et à 3 sem. ; voies/cal-77/cap/E-4ans.png, G-1280.png) ».
2. **CALP-13 toujours présent** (m). Stocks s'ouvre sur Matériel › Carnets, et Matériel n'a aucun lien vers son calendrier de section : le seul « Calendrier » est l'onglet du bas (cap/F-stocks.png, F-materiel.png). La ligne n'est pas à moi. Texte proposé : « ouvert — présent (tour 77, 25.11, en ligne index-CC3nR2pp.js) ».
3. **K73-3, la lenteur, toujours là hors du bord** (m, en partie corrigé). Chaque ouverture du Calendrier contient encore une tâche longue de 251 à 510 ms. Le relâcher d'une barre gèle encore l'image 196 à 277 ms. Le bord, lui, est 2,6 fois plus rapide, avec deux fois moins d'images gelées (tableau ci-dessous). La ligne n'est pas à moi. Texte proposé : « en cours — bord tenu (≈15 col./s, 2 images > 200 ms en 2 s au lieu de 4) ; ouvrir 355–653 ms (tâche 251–510), relâcher 229–256 ms (tour 77, index-CC3nR2pp.js) ».
4. **K77-1 « F… » à 16 sem.** (m, neuf, versé). Dans la rangée Brassins, la barre courte de Fruty affiche « F… −2,40 + à venir » : le nom est réduit à une lettre, alors que le montant reste entier (cap/Z5-allonger-6-apres.png). C'était déjà le doute D4 du tour 73, à 15 sem. Il dirait : « C'est quoi, F ? »

Doutes (non comptés) :
- D1. **BD-1, bandeau en arrière-plan.** Avec mon onglet au premier plan, l'avis « Enregistrement… » part 313 à 1 073 ms après chaque écriture. Avec l'onglet en arrière-plan (la voie reel-77 avait le sien devant), il est resté 8,5 s, 11 s, 18,8 s, 30 s et 75 s. Chaque fois, il est parti à l'instant où mon onglet est revenu devant : le minuteur est sans doute ralenti par Chrome en arrière-plan. Sur son téléphone, le cas serait l'app reprise après un autre écran. À tester sur l'appareil.
- D2. La fiche d'une vente propose toujours la puce « +1 200 », le montant de l'apport « De ma poche » (cap/Z8-vente-fiche.png). Même doute qu'au tour 73.
- D3. Fruty change de ligne selon l'état : à côté de NEIPA Test au repos, seule sur sa ligne avec l'étiquette à gauche après le déplacement d'un travail ZZ, avec les mêmes données (avant-S3-calendrier contre Z4-deplacer-1-apres). Même doute qu'au tour 73.
- D4. Quand on tient une barre au bord, elle sort de l'écran à droite (« ZZ T »). Seule la bulle « S29 · 19 juil. · lâcher ici » dit où elle tombe (cap/Z6-bord-pendant.png).
- D5. « 3 Javier en S53 ?? » : en ISO, 2026 a 53 semaines (le 1er janvier 2026 est un jeudi), donc la S53 va du 28 déc. au 3 janv. L'app a juste. C'est à lui expliquer, ou à dire sur la frise (« S53 · 28 déc.–3 janv. »), au choix du pilote.
- D6. Ce sont mes scripts qui ont échoué, pas l'app. En allongeant, mon doigt est parti hors de l'écran (x = 431) : la fête ZZ s'est allongée jusqu'en mars et la fenêtre est passée à 16 sem. ; ma condition de fin attendait un changement d'aria et a expiré. La carte d'une vente s'ouvre sur « Facturer », pas « Ouvrir » ; mon premier script attendait « Ouvrir », d'où ses TIMEOUT, puis un second script l'a remplacé. Une série a vu 45 tâches longues d'environ 210 ms en 15 s, que je n'ai pas reproduites au repos, carte ouverte (0 en 8 s). Les tâches longues sont peut-être comptées pour tout le processus partagé avec l'onglet de reel-77 : les chiffres se lisent en tendance.
- D7. Le brassin ZZ n'a pas été rejoué : au tour 73, la feuille Brassins ne prenait qu'une de ses recettes, et le brassin aurait porté le nom de la recette. Le passage libre s'est fait sur une fête ZZ, un travail ZZ et une vente ZZ.
- D8. Après un rechargement, l'écran « Synchronisation des données de la brasserie… Préparation du registre comptable… » reste plus de 4 s (cap/S2-trois-sem-S53.png, prise trop tôt par mon script).

## Corrigés rejoués : 6 sur 7 tenus
- **K73-1, le bouton de durée** : vérifié — en ligne index-CC3nR2pp.js. Pendant le geste, il suit le doigt : 6, 5, 4, puis 3 sem. sur 12 relevés (cap/D-pendant.png : « 5 sem. » sous la bulle « 23 nov. – 27 déc. »).
- **K73-2, « S53 2026 »** : vérifié — en ligne index-CC3nR2pp.js. Le cadre d'une semaine dit « S53 » seul (cap/S1-semaine53.png). À 3 sem., « S48 – S50 2026 ».
- **CALP-6, les homonymes** : rouvert (n° 1).
- **Q4-1, la vitesse au bord** : vérifiée — en ligne index-CC3nR2pp.js. À 30 px, l'axe passe de 8 à 36 colonnes (S47…S1 → S44…S26) en 1,8 s, soit environ 15 col./s, contre environ 6 au tour 73. À 4 px, c'est pareil (avant : 8 à 9). La barre lâchée au bout de 2 s tombe en S29 ou S31, en juillet-août. Pour un pouce, ce n'est plus « trop lent » ; ce serait plutôt vif, mais la bulle dit la semaine.
- **POI-1, la zone atteignable** : vérifiée. Un doigt à 30 px du bord (x = 360), donc bien dans l'écran, déclenche le défilement, et la bande est de 72 px. La poignée de fin, prise à 6 px dans la barre, allonge sans déplacer (Z5-allonger-6 : seul le doigt qui sort de l'écran a poussé la fenêtre, D6).
- **Le geste au bord hors de React (cal-76)** : tenu à ×1. En 2 s, seules 2 images dépassent 200 ms (222 et 232 ms ; 285 et 218 à 4 px), contre 4 au tour 73. À ×4, 5 images dépassent 100 ms, jusqu'à 506.
- **BD-1, le bandeau** (ma ligne) : vérifié — en ligne index-CC3nR2pp.js, onglet au premier plan. L'avis dure de 313 à 1 073 ms et se tient en bas (y = 777) ; voir D1 pour l'arrière-plan.
- Preuves anciennes, toutes vérifiées :
  - « −1 663 » sous ± : −463, −383 et −3 363 restent à gauche de ±.
  - Jour exact à 3 sem. : Hefe (21 nov.) commence à 28 px, et le 23 nov. à 55 px pour 54 attendus.
  - Ventes : une vente ZZ de +5 donne « +5 prévu S48–S53 », et l'à dépenser passe de −463 à −458 (Z7).
  - Vente → fiche : la carte s'ouvre en 13 à 46 ms (Facturer, Modifier, Lier, …) ; Modifier ouvre la fiche en 119 ms, avec le nom et 5 CHF (Z8).

## Lenteur mesurée : avant (cal-73, index-L94x-z-O.js), puis après (cal-77, index-CC3nR2pp.js)
Mêmes scripts, 390, au toucher, poste partagé avec d'autres voies.

| geste | cal-73 | cal-77 |
|---|---|---|
| Ouvrir depuis Bord, à froid | 487, 550, 446 ms (tâche 169–501) | 653, 513, 365 ms (tâche 251–478) |
| Ouvrir, à chaud | 473, 595, 396 ms (tâche 358–577) | 355, 545, 408 ms (tâche 311–510) |
| Ouvrir, processeur ×4 (s53.mjs) | 1 134, 956, 1 505 ms (tâche ≤ 1 385) | 1 885, 2 031, 936 ms (tâche ≤ 1 812) |
| Ouvrir ×4 (vue.mjs, à froid / à chaud) | — | 667–706 / 607–661 ms (tâche 555–653) |
| Carte Milk Stout / De ma poche | 7–19 / 5–11 ms | 16–24 / 4–12 ms |
| Fiche d'une vente (Modifier) | 131 ms | 119 ms |
| Glisser une barre ZZ, relâcher puis mise à jour | 256–278 ms, image ≤ 255–339 | 229–256 ms, image ≤ 196–277 |
| Défiler 3 sem. (corps du cadre) | 6–17 ms, image ≤ 40–55 | 6–18 ms, image ≤ 16 |
| Bord à 30 px, 2 s | ≈6 col./s, 4 images de 216–274 ms | ≈15 col./s, 2 images (222, 232 ms) |
| Bord à 4 px, 2 s | 8–9 col./s, 4 images de 227–272 ms | ≈15 col./s, 2 images (285, 218 ms) |
| Bord à 30 px, ×4 | — | ≈15 col./s, 5 images > 100 ms (≤ 506) |

Lecture : le bord et le défilement ont nettement gagné. L'ouverture et le relâcher n'ont pas bougé, aux écarts du poste près.

## Passage libre comme le brasseur (ZZ seulement)
- Une fête ZZ de 4 sem. a été créée par le curseur Fin de la feuille (« Durée 4 sem. jusqu'à S51, 20 déc. »). Je l'ai déplacée trois fois (S48 → S50 → S49 → S50), et à chaque fois la bulle a dit « S50 · 7 déc. · lâcher ici » et l'avis « … · Annuler ». Je l'ai ensuite allongée, tenue au bord trois fois avec Annuler (remise au 7 déc. à chaque fois), puis retirée.
- Un travail ZZ a été créé, déplacé trois fois (25 nov. → 9 déc. → 2 déc. → 9 déc.), puis retiré.
- Une vente ZZ de +5 a été créée deux fois, ouverte trois fois avec sa fiche, puis retirée.
- Avant chaque relâcher, j'ai vérifié la cible (elementFromPoint, « ZZ TEST — k77 »). Aucun geste n'a été fini sur ses choses. Aucune ZZ ne reste.

## BUGS.md (lignes à moi)
- BD-1 : « vérifié — en ligne index-CC3nR2pp.js (tour 77) », avec le doute de l'arrière-plan.
- K77-1 : versé (n° 4).
- CALP-6, CALP-13, K73-1, K73-2, K73-3, Q4-1 et POI-1 ne sont pas dans mon OWNS : leurs textes sont proposés ci-dessus au pilote. C61-4 a été modifié dans le même temps par une autre voie, pas par moi.

LEÇON PROPOSÉE : une mesure de durée d'affichage (bandeau, minuteur) se prend avec l'onglet au premier plan pendant toute la mesure. En arrière-plan, Chrome ralentit les minuteurs : le 25.11, le bandeau semblait rester 75 s, alors qu'il partait en moins de 1,1 s au premier plan.
