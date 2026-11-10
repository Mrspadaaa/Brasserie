# Verdict e-t15 — page de choix « « Tout valider », et une à une » (l2b-valider, D313)

OK — accepté : une seule question, une lettre, sur son 2 D repris au pixel hors de la seconde ligne et du bandeau (mesuré et vu) ; « Tout valider » et le un à un se trouvent sans mode d'emploi dans B, C et D ; une seule action noire ; chiffres justes aux trois états ; un majeur à retoucher avant de publier (la double coche de « Tout valider » à côté de la coche de « Garder » dit « garder tout » alors que tout part), aucun bloquant.

Critique Fable, 02.11, agent neuf, calibré sur `fils21-choisir/critique/PORTRAIT.md` (v2). Jugé : `choix-valider/index.html`, ses 10 mini
maquettes (`img/*.png`, 780 × 1720, toutes ouvertes en plein format ; `img/md5.json` : 10 écrans distincts), `controle-haut.png`, `controle-page.png`
(390 × 3112), `controle-ordinateur.png`, contre sa maquette `choix-lignes-38/img/q2-d-arrivee.png` (règle n° 1, son choix 2 D, 780 × 1560), le contrat
`voies/l2b-valider/VOIE.md`, D313, D314, D315, et les verdicts e-t13, e-t14. Rejoué : `controle-page-choix.mjs --min=3` → `tout-valider : OK (3 variantes,
4 par rangée à 1280, 2 à 390)`, `PAGE-CHOIX OK (1 choix)` ; `outils/mesure-2d.mjs` → `MESURE-2D OK` (1 114 620 pixels comparés, 204 différents, une seule
boîte réelle x 298–306 / y 205–213 : « 4 » → « 5 corrigées », quatre points de 1 px de lissage) ; `grep -ci "depense\|dépense" ecrans.json` → 0, `controle-choix`
sans objet. `verifier-page.mjs` non rejoué : ses trois captures ont été ouvertes. La « Réparation » du RESULTAT (maquettes de choix-lignes-38 à 700 px) est
déjà faite et commitée (29e9d07c, « maquettes de choix-lignes-38 réparées à 780 px et page republiée ») : rien ne reste au pilote sur ce point.

## Les cinq questions du pilote

1. **Son 2 D est-il intact hors de la seconde ligne et du bandeau ?** Oui, mesuré et vu. `a-arrivee.png` contre `q2-d-arrivee.png` : en-tête 46,40, « 7 lignes »
   rouge, barre, « Somme = imprimé 46,40 », 7/7, 3/3, « 6 reliés », « 2 à contrôler », « 1 à remplir », puce « ↻ N corrigées » cadrée, TVA –, Payé, Malts 3 ·
   10 Kg · 24,10 avec Pilsner bleu et 10 Kg × 1,45 barré, Carapils jaune, Avoine maltée barrée grise hors des sommes, Sabro et Citra bleus avec « 30 ? » et
   « 50 ? » barrés, Levures, Sucre candi rouge, Catégorie / Papier, Confirmer noir : trait pour trait. Deux écarts, tous deux nommés : « 5 corrigées » (la
   seconde ligne compte, c'est la règle de sa 2 D) et la hauteur 780 → 860 px (un blanc de ~120 px css entre Sucre candi et le bandeau en A et B, ~175 px dans
   `tout.png`). L'auteur le dit : à 780, le bandeau en liste (C) et les rangées à gestes (D) cachaient Sucre candi ; « CACHE UNE RANGÉE » sort pour 0 vue.
   B, C et D gardent ce même écran ; seul le bandeau (B, C, D) et les deux rangées barrées (D) changent. Rien de sa maquette n'est déplacé.
2. **« Tout valider » et le un à un se trouvent-ils sans mode d'emploi ?** Le un à un, oui partout : « ✓ Garder » et « ✕ Retirer », deux boutons avec un mot,
   dans son bandeau (A, B), dans la liste (C), sur la rangée barrée (D). « Tout valider », oui comme mot (c'est le sien) et comme bouton (contour brun, au pouce,
   dans B, C, D). Mais son icône dit le contraire de son effet : une double coche (`TOUT`, `gen.mjs` l. 297) posée à côté de la simple coche de « Garder »
   (`CHECK`) se lit « garder tout », alors que « Tout valider » les fait toutes partir (D313). Dans B, elle est en plus sur la ligne du nom (« Avoine maltée 1,70 ·
   ✓✓ Tout valider »), Garder et Retirer dessous : en trois secondes on lit « valider Avoine maltée ». La page le dit (« elles partent toutes les deux »), l'écran
   non. C'est le majeur n° 1 ; le mot reste, l'icône change.
3. **Une seule action noire ?** Oui dans les 10 vues : Confirmer. Garder / Retirer en contour gris, « Tout valider » en contour brun d'attention, jamais plein.
   Signalé, pas compté : dans B et C, « Tout valider » (brun, gras) est le bouton le plus visible du bandeau, plus que Garder et Retirer (gris) ; comme Confirmer
   sans trancher fait déjà partir les lignes (sa 2 D), un toucher par erreur ne perd rien de plus. En sombre (`b-arrivee-sombre.png`), même ordre : Confirmer
   clair, « Tout valider » jaune, Garder / Retirer sombres ; lisible.
4. **Chiffres justes à chaque état ?** Oui, tous refaits.
   - Arrivée (A, B, C, D) : Avoine 0,5 Kg × 3,40 = 1,70 ; Amarillo 25 g × 0,088 = 2,20 ; toutes deux hors des sommes : Malts 5 + 4 + 1 = 10 Kg, 14,50 + 7,20 +
     2,40 = 24,10 ; Houblons 30 + 50 = 80 g, 2,10 + 4,50 = 6,60 ; total 24,10 + 6,60 + 9,80 + 5,90 = 46,40 = imprimé ; 7 lignes, 7/7, 6 reliés, 2 à contrôler
     (Carapils, sachets), 1 à remplir (Sucre candi), « ↻ 5 corrigées » = 3 + 2.
   - Après « Garder » sur Avoine (A, B, C, D) : Malts 4 · 10,5 Kg · 25,80 ; Somme ≠ imprimé 48,10 en attention, l'en-tête reste 46,40 (le majeur n° 1 d'e-t13
     n'est pas rejoué) ; 8 lignes, 8/8, 7 reliés, « ↻ 4 corrigées » (Amarillo attend) ; Avoine redevient une rangée ordinaire avec le cube relié ; le segment
     Malts de la barre passe à 4 parts ; le bandeau passe à « Amarillo 2,20 · 2/2 » (A, B), « 1 pas retrouvée » (C, D).
   - Après « Tout valider » (`tout.png`) : d-lue, 3 corrigées, 7 lignes, 46,40, 6 reliés ; identique à `q2-a` d'e-t13. Cohérent avec sa 2 D (Retirer = q2-a).
   Aucune valeur ni nom de ses pièces (Brauhaus Ouest, 21.10.2026, Avoine maltée, Amarillo).
5. **La page dit-elle ce qu'on attend de lui, sans code (L24) ?** Oui, et une seule question : « Une lettre : où mettre « Tout valider », et comment trancher
   chaque ligne. », « Mon avis : B. » avec sa raison et sa limite ; une phrase de contexte (« « Tout valider » suit la 3e lecture : elles partent toutes les
   deux ») ; têtes en une ligne, badges « ton 2 D », « mon avis », « à construire » ; aucun nom de fichier, aucun code ; ~45 mots avant la première image.
   Aucun rappel de la question 1 (D314), aucune lettre réclamée pour les cas rares (D315) : il ne redira pas « ?? J'ai déjà donné mon avis ». À 1280 : quatre
   colonnes, la rangée Avoine et le bandeau D visibles dès le premier écran. À 390 : deux par rangée, « Après « Tout valider » » et « B en sombre » ensemble sur
   la dernière rangée, le badge « = ta maquette lue » lisible.

## Les doutes de l'auteur, tranchés
- **B prend deux lignes (95 px) contre une (49 px).** Fondé, mais c'est le prix du mot : il le verra, il dira « ça prend de la place » et gardera B ou C.
  Rien à corriger avant son choix.
- **« Tout valider » en brun, moins fort que Confirmer.** Juste : une seule action noire tenue (voir 3).
- **D réunit deux endroits.** Honnête, la tête le dit (« Ta 2 D avec la rangée de 2 B ») ; c'est la greffe prédite par e-t13 et il mélange volontiers. Le
  bandeau de D n'a plus de question, seulement le compte et « Tout valider » : ce n'est plus son bandeau, mais c'est annoncé.
- **C au-delà de trois lignes : pas dessiné.** Dit dans la tête de C. Suffisant avant son choix.

## Défauts

### Bloquant
Aucun. Sa maquette 2 D est la base, mesurée (D105 sans objet, L03 tenue) ; une seule question, une lettre (D315) ; aucune règle de SPEC ni de DEFAUTS-COURT
n'empêche son choix.

### Majeur
1. **La double coche de « Tout valider » dit « garder tout »** (`b-arrivee.png`, `b-garder.png`, `c-arrivee.png`, `c-garder.png`, `d-arrivee.png`,
   `d-garder.png`, `b-arrivee-sombre.png` ; `gen.mjs` l. 297 `TOUT` = deux coches, l. 102 `CHECK` = la coche de Garder). Dans le même bandeau, « ✓ Garder »
   garde la ligne et « ✓✓ Tout valider » les fait toutes partir : l'icône reprend celle du geste inverse. Règle : DEFAUTS-COURT, icônes pas parlantes (« Les
   icône sont pas parlant du tout ») ; portrait, critère 1 (trois secondes). Dans B c'est aggravé par la place : le bouton est sur la ligne « Avoine maltée
   1,70 », Garder et Retirer dessous, donc « valider » semble porter sur Avoine. Correction, sans changer l'option : l'icône de la lecture, le « ↻ » de sa puce
   « corrigées » (`gen.mjs`, `TOUT` → le chemin de l'icône de la puce, 15 px, brun), ou aucune icône ; le mot « Tout valider » reste, c'est le sien. Régénérer
   les 7 vues, rejouer `mesure-2d.mjs` (le bandeau est exclu, le résultat ne change pas) et `controle-page-choix.mjs --min=3`, rouvrir `b-arrivee.png` et
   `c-arrivee.png`.

### Mineurs
- Écran de 860 px : blanc de ~120 px css sous Sucre candi en A et B, ~175 px dans `tout.png`. Il le prendra pour un téléphone plus haut ; nécessaire pour que C
  et D ne cachent pas Sucre candi, et des vignettes inégales seraient pires. Laisser (même avis qu'e-t13).
- B à « 2/2 », C et D à « 1 pas retrouvée » : « Tout valider » reste pour une seule ligne, où il vaut Retirer. Cohérent (le bouton ne bouge pas), mais le port
  pourra le retirer à la dernière ligne ; rien à dessiner avant son choix.
- Après « Tout valider », « ↻ 5 corrigées » retombe à « 3 » : les deux retraits ne laissent aucune trace dans la puce. C'est la règle de sa 2 D (Retirer = q2-a,
  e-t13) ; je le signale pour le port, pas pour la page.
- Dans B et C, « Tout valider » est plus visible que Garder et Retirer (voir 3). Acceptable, à dire au port : contour brun, jamais plein.
- D : la rangée barrée à gestes prend deux hauteurs, le pointillé commence après le filet de famille (le mineur d'e-t13 est corrigé) ; rien à faire.

## Greffes probables (il mélange)
- B + C : le bandeau en liste de C, mais fermé par défaut sur la ligne en cours (« 1/2 ») avec « Tout valider », ouvert d'un toucher sur « 1/2 ».
- C + D : la liste de C au pouce, et les rangées barrées qui défilent vers elle au toucher.

## Ce que je prédis qu'il dira
« B c'est bien, mon bandeau avec Tout valider dedans. Le C on voit les deux d'un coup, pas mal aussi. Le D ça prend de la place dans la liste. »

Entre B et C, je donne à C une vraie chance : il prend le dense qui sert sa question (portrait, erreur 2), et C montre les deux lignes et leurs gestes sans
défiler. Avis par option, comme lui :
- **A** : « là je fais une par une, c'est pas ce que j'ai demandé » — la référence fait son travail.
- **B** : « très bien, c'est mon bandeau » — probable, avec « la double coche c'est garder tout ? » si le majeur n'est pas levé.
- **C** : « pas mal, on voit tout » — probable-haut.
- **D** : « clair, mais ça prend deux lignes » — mitigé.

## Pour le pilote
Publier après le majeur (l'icône de « Tout valider » dans `choix-valider/outils/gen.mjs`), régénérer, rejouer `mesure-2d.mjs`, `controle-page-choix.mjs --min=3`
et `verifier-page.mjs --page-lot`, rouvrir `b-arrivee.png`, `c-arrivee.png`, `b-arrivee-sombre.png`. La réparation de choix-lignes-38 est déjà commitée.
Si le pilote publie sans retouche, la page reste utilisable : il choisira, et demandera ce que fait la double coche.

Verdicts :
- **a** (ton 2 D, une à la fois) — ACCEPTÉ ; 2 D au pixel hors seconde ligne et bandeau.
- **b** (« Tout valider » dans le bandeau, avis de l'auteur) — ACCEPTÉ ; double coche à changer (majeur n° 1).
- **c** (bandeau en liste) — ACCEPTÉ ; double coche (majeur n° 1) ; au-delà de trois lignes non dessiné (dit).
- **d** (la question sur la rangée) — ACCEPTÉ ; double coche (majeur n° 1) ; le bandeau n'a plus la question (dit).
- **tout** (après « Tout valider ») — ACCEPTÉ ; = q2-a.
- **b-arrivee-sombre** — ACCEPTÉ.
- **page** (`index.html`) — ACCEPTÉ ; une question, une lettre, sans code.

LEÇON PROPOSÉE : l'icône d'un bouton se juge à côté des icônes voisines du même bandeau, pas seule : deux coches à côté de « ✓ Garder » disent « garder
tout », même si le mot dit autre chose ; un bouton qui fait l'inverse d'un voisin ne reprend jamais son icône (vu ici : « ✓✓ Tout valider » fait partir ce que
« ✓ Garder » garde).
