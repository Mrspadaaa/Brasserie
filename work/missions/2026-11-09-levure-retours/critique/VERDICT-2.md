OK — 0 problème, 0 bloquant

Version : 763cfa9a (les 8 constats de VERDICT.md corrigés, `voies/r3/RESULTAT.md`).
Bancs : `?dev-local&etape=levure` et `?dev-local&etape=houblons`, Chrome sans écran, 390 tactile (dpr 2) et 1280, clair et cave.
Captures : `critique/captures-2/` (44 Ma levure, 32 Chercher et houblons, 4 sondes), planches `critique/planches-2/` (32, toutes ouvertes, L12).
Mêmes scripts qu'au premier verdict (`capturer-r1.mjs`, `capturer-r2.mjs`, `sonde2.mjs`, `planches.mjs`), sortie `captures-2`, sélecteur de champ étendu à `textarea` (à 390 `Input` rend un textarea : la mesure `input false` du premier passage venait de là, le défaut n° 1 restait vrai par le défilement).

Sa question : « combien et quels problèmes il y a ? » — Aucun.

## Les trois bloquants, vérifiés d'abord

| n° | ce que je vérifie | 390 | 1280 | preuve |
|---|---|---|---|---|
| 1 | tuile « Mon stock ou saisie libre » touchée : le repli s'ouvre sous le champ, pré-rempli, focalisé, à l'écran | oui | oui | `2e-saisie-libre-390-cave/clair`, `-1280-cave/clair` ; `sonde2` : `dansEcran true`, `top 403` (390) / `431` (1280), focus dans le champ ; journal r1 : `preRempli true, dansEcran true, focus true, label "Nom de la levure personnelle"` |
| 2 | poignées ↕ ↔ sous le pied « Retour · Suivant » | oui | oui | `4-sans-levure-390-*`, `4b-sans-levure-tapee-390-*`, `2-champ-lal-390-cave`, `2e-saisie-libre-390-cave` : plus rien ne flotte sur le pied, la poignée est coupée par lui ; `sonde2` : le pied reçoit le toucher (`retourRecoit true`) |
| 3 | filtre Arômes = Tropicaux : chaque ligne porte « Tropicaux », aucun noble en tête | oui | oui | `h3-390-*`, `h3-1280-*` : 19 houblons (29 avant), Talus, Elixir, Relax, Strata, Citra, Mandarina Bavaria, Callista, Cashmere, pastille Tropicaux en premier sur chaque ligne ; Hersbrucker, Fuggle, Cascade sortis ; index `h3f` : Tropicaux 19, Agrumes 53, Floral 44 |

## Les cinq autres

| n° | constat du 1er verdict | état | preuve |
|---|---|---|---|
| 4 | « Arômes non documentée 52 » | « Arômes non documentés 52 », « non documentés 52 » dans la feuille | `h3-*`, `h3f-*` |
| 5 | carte Verdant à quatre lignes à 390 | « Verdant IPA » et « sèche · Lallemand », une ligne chacune ; « SafAle US-05 » inchangé | `2d-verdant-choisie-390-cave/clair` |
| 6 | « avancée » seul à 390 | « Avancée » ; « Recherche avancée » à 1280 | `h1-390-*`, `h1-1280-*` |
| 7 | unité « j » coupée au focus | « j » entier à droite de l'anneau | `3-palier-touche-390-cave/clair`, `3b-palier-graphe-390-*` |
| 8 | repli de saisie libre (étiquette collée, champ sans bord, lien nu) | étiquette au-dessus, champ bordé, bouton « Utiliser cette levure » | `2e-saisie-libre-390-*`, `-1280-*` |

## Table des captures

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| 1-repos | clair · cave | 390 · 1280 | Ma levure au repos | — | 0 |
| 1b-conduite | clair · cave | 390 · 1280 | conduite de base (= sa capture 4) | — | 0 |
| 2-champ-lal | clair · cave | 390 · 1280 | « lal » : 8 tuiles + « 8 sur 35 » | — | 0 |
| 2b-champ-sans-resultat | clair · cave | 390 · 1280 | « zzqxjw » : tuile libre | — | 0 |
| 2c-champ-verdant | clair · cave | 390 · 1280 | « verdant » : une tuile | — | 0 |
| 2d-verdant-choisie | clair · cave | 390 · 1280 | carte Verdant IPA, puces Pomona · NovaLager · US-05 (précédente) | — | 0 |
| 2e-saisie-libre | clair · cave | 390 · 1280 | tuile libre touchée : repli sous le champ, pré-rempli, focus | — | 0 |
| sonde2-apres-tuile-libre | clair | 390 · 1280 | idem, 5 s après, sans défilement du script | — | 0 |
| 3-palier-touche | clair · cave | 390 · 1280 | palier 2 touché, éditeur « Repos diacétyle » | — | 0 |
| 3b-palier-graphe | clair · cave | 390 · 1280 | éditeur défilé, brouillon, paliers | — | 0 |
| 4-sans-levure | clair · cave | 390 · 1280 | recette sans levure | — | 0 |
| 4b-sans-levure-tapee | clair · cave | 390 · 1280 | « nottingham » : une tuile (390-cave reprise : premier passage pris sur « Chargement… », Vite lent) | — | 0 |
| sonde2-poignee-pied | clair | 390 · 1280 | poignée amenée dans la bande du pied | — | 0 |
| l1 | clair · cave | 390 · 1280 | Chercher levure au repos | — | 0 |
| l2 | clair · cave | 390 · 1280 | piste de Verdant touchée : Choisir · Comparer | — | 0 |
| h1 | clair · cave | 390 · 1280 | étape Houblons au repos, bouton « Avancée » / « Recherche avancée » | — | 0 |
| h2 | clair · cave | 390 · 1280 | recherche avancée au repos, 497 | — | 0 |
| h3 | clair · cave | 390 · 1280 | aromatique × Tropicaux : 19 | — | 0 |
| h3f | clair · cave | 390 · 1280 | feuille Filtres, index + Arômes | — | 0 |
| h4 | clair · cave | 390 · 1280 | « nelson », ligne ouverte | — | 0 |
| h5 | clair · cave | 390 · 1280 | après « Ajouter » : Nelson Sauvin à 10′ dans l'étape (390-cave reprise : sélecteur attendu 90 s au premier passage, Vite lent) | — | 0 |

## Doutes (non comptés, inchangés)
- Sovereign « amérisant » (`h2`) : donnée de rôle, pas la vue.
- « ≈ 6,9–7,2 % vol » pour OG 1,066 / FG 1,012–1,015 : formule existante (même écart sur sa capture 1).
- « 2–3 sachets » pour 15–24 g de US-05 : arrondi existant.
- Banc houblons sans stock : rayon « Chez moi » et icône de stock non vus ; à jouer en ligne sur « ZZ TEST ».
- « plage levure 18–26 °C » en gris clair sur la bande grise (1280 clair) : composant de sa capture 4, inchangé.
- Les comptes de l'index Arômes ont changé avec la règle « familles marquées » (Agrumes 69 → 53, Floral 57 → 44…) : voulu (D167), à annoncer dans le rapport au brasseur.
- Deux captures 390 cave ont dû être reprises pour lenteur de Vite au premier chargement : banc, pas l'app.

LEÇON PROPOSÉE : aucune (celle de VERDICT.md tient ; s'y ajoute le détail de r3 : un sélecteur de champ texte inclut `textarea` à 390).
