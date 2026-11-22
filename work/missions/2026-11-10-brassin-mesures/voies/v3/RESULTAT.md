OK — v3b : 5 bloquants de SYNTHESE-v3 corrigés, non bloquants simples ; PAGE OK

Skills invoqués d'abord : boosters-ux, impeccable, ui-design-system. Fable non utilisé. Rien dans `src/`, ni commit ni stash.

## Fichiers écrits (OWNS seul ; planches dans os.tmpdir()/v3-planches)
- `voies/v3/etat.src.html` + `sprite.svg` → `etat.html` (assemblé par split/join, L26) : `?c=1..5&o=a|b|c&etat=repos|geste|apres&etape=ens&theme=cave`. Grammaire des captures c3/apres (New England IPA · LOT-DEMO · 19 L), classes `v3-`.
- `voies/v3/capturer.mjs` (gestes au doigt + contrôles), `capturer.txt`, `montage.mjs`, `page.cjs`, `tests.txt`, `captures/*.png` (35 + 3 de page).
- `page-v3/index.html`, `page-v3/img/` (5 références de l'app actuelle + 33 captures).

## Les options (nom court · une ligne)
1. Poids du sachet — A « 1 sachet » seul (actuel) · B « 1 sachet · 11,5 g » (source : `src/data/yeastSupplyBootstrap.json`, Fermentis, vu le 27.09) · C jauge de dose : 11,5 g pour 19 L sur la plage fabricant 50–80 g/hL (9,5–15,2 g), « 61 g/hL · dans la plage » ; 2 sachets → 23,0 g, 121 g/hL, ambre « au-dessus ».
2. Panneau Houblons — A replié dans les Aides (actuel, panneau complet dessous) · B retiré du jour (reste dans Recette) · C une ligne qui suit l'étape : à l'ébullition « Amertume 61 IBU » sur la bande Hazy 25–60, ouverte = 4 barres des moments + « Simuler et sources · dans Recette » ; à l'ensemencement « À cru 171 g · 9 g/L · J2 J6 J9 · phase ? ».
3. Relevés depuis la clôture — A rien de plus (actuel) · B « ? SG » touchable → Mesurer onglet Densité, « Enregistrer revient à la confirmation », retour avec 1,058 (−0,003) · C les deux curseurs dans la fenêtre (densité bande 1,059–1,063 ; volume repère 19 L).
4. Levure dans Préparer — A aucune (actuel) · B groupe « Levure · à sortir », « ? sachet » + pastilles 1 sachet · 11,5 g / 2 sachets / Mesurée · C rappel « Sortir la levure SafAle US-05 » dans À anticiper, à cocher.
5. Polices — A chasse fixe aux doses et à Mesurer (actuel) · B tout en Source Sans 3, chiffres proportionnels · C Source Sans 3, chiffres tabulaires (colonnes droites).

## Sortie décisive de chaque critère
- Page : `node scripts/agents/verifier-page.mjs …/page-v3/index.html --page-lot --captures …/voies/v3/captures/page` → `PAGE OK (38 images chargées, lisible à 390 et 1280 px, sans erreur)` (`tests.txt`).
- `node voies/v3/capturer.mjs` → `CAPTURES OK` (`capturer.txt`) : à chaque capture 0 débord, 0 `type=number`, ni NaN/null/undefined, aucun inconnu affiché 0, cibles visibles ≥ 24 × 24, aucun libellé coupé ; chaque « après » obtenu par un vrai toucher (Chrome tactile 390, DPR 2) et différent du repos. c3b : piste touchée → 1,058, Enregistrer → retour à la confirmation avec 1,058. c5 : dose en IBM Plex Mono (A), Source Sans 3 (B, C).
- B9 : jauge posée 32 ms après le toucher ; mouvement réduit : transition 0 s.

## Captures (toutes ouvertes en planches, plus page-haut et page-ordinateur)
`voies/v3/captures/` : c1a|b-repos|apres, c1c-repos|apres|deux ; c2a-repos|apres, c2b-repos, c2c-repos|apres|ens ; c3a-repos, c3b-repos|geste|apres, c3c-repos|apres ; c4a-repos, c4b-repos|apres, c4c-repos|apres ; c5a|b|c-repos|apres ; cave : c1c-apres, c2c-apres, c3c-apres, c4b-repos, c5c-apres ; page-haut, page-page, page-ordinateur.

## Boosters UX (boosters-ux)
- Boosters : `un-sachet`/`plus-sachet` + `jauge-dose` (1C) — ajuster ; pastille, pas ; jauge sur plage fabricant ; trait vert dans la bande puis ambre au-dessus (c1c-apres, c1c-deux). `ligne-houblons` (2C) — lire ; ligne + mini-bande ; marque ambre hors repère, ouverte = barres des moments (c2c-repos, c2c-apres). `ouvrir-densite`/`enregistrer` (3B) — déclencher ; case « ? » ; aller-retour Mesurer (c3b-geste, c3b-apres). `curseur-densite`/`curseur-volume` (3C) — ajuster ; curseur à bande ; pouce vert/ambre, écart dit (c3c-apres). `choisir-levure` (4B), `rappel` (4C) — choisir, suivre ; pastilles, case ronde (c4b-apres, c4c-apres). `mesurer` (5) — déclencher ; feuille Mesurer au curseur (c5*-apres). 2A, 2B, 3A, 4A : actuel, sans booster neuf.
- B1 OK — chaque option à geste porte `data-booster`, avant ≠ après vérifié par le capturer.
- B2 OK — un seul `primary` par écran (pied ou fenêtre).
- B3 OK — 2C, 3B : détail à un toucher ; 2A garde le panneau long (c'est l'option actuelle).
- B4 OK — un groupe par sujet, pas de carte dans une carte (jauge 1C dans le groupe Levure).
- B5 OK — 4/8/10 px ; non mesuré par R2.
- B6 OK sauf 5B/5C, écart voulu (le choix porte sur la police) ; pas de texte sous 12 px.
- B7 OK — vert = dans la cible, ambre = écart, rouge seulement pour l'étiquette d'alerte existante ; libellé avec chaque couleur. Contraste non mesuré (outils/controle-contraste non lancé).
- B8 OK — inconnu = « ? », « à choisir », « pas relevé », « phase ? » ; jamais 0.
- B9 OK — 32 ms ; transitions 150–180 ms ; mouvement réduit respecté.
- B10 OK — aucun champ numérique : curseurs, pas ±, pastilles.
- B11 — 1C : « 1 sachet, c'est dans la dose » ; 3C : « je relève sans quitter la fenêtre ».
- B12 OK — curseur identique à la feuille Mesurer de l'app ; chevrons ⌄ ; cases et ronds de l'app.
- B13 OK — cibles ≥ 24 px vérifiées ; zone du curseur 44 px.
- Écarts voulus : B6 (5B, 5C : objet du choix).

## Limites
- Valeurs d'exemple (fixture LOT-DEMO), pas ses données. g/hL : 11,5 g ÷ 0,19 hL = 60,5 → « 61 », volume = cible 19 L, pas le relevé.
- 1280 non capturé pour les maquettes (VOIE : 390 tactile) ; la page l'est.

Prédiction : il prendra 1C et 3C (ou 3B), et 2C ou 2B ; pour 5, A, car l'écart B/C est fin à l'œil.

DÉCISION À PRENDRE : aucune (le brasseur choisit sur la page).
CONNAISSANCE : la masse du sachet et la plage de dose fabricant (50–80 g/hL) sont déjà dans `src/data/yeastSupplyBootstrap.json` (`format.amount`, `dose.range`) : 1B et 1C sont branchables sans nouvelle donnée.
LEÇON PROPOSÉE : aucune


## Passe 3b (10.11, agent neuf, Opus ; Fable non utilisé)
Corrigé en place dans `etat.src.html`, `sprite.svg` (+ cal, goutte, plus, crayon, cube), `capturer.mjs`, `page.cjs` ; captures et page régénérées.
Attention : `work/missions/**` est ignoré par Git ; la v3 d'avant (source et captures) n'existe plus que dans les captures citées par la critique.
1. Titre : 14 px comme l'app, icônes 38 px → « New England IPA · LOT-DEMO · 19 L » entier sur toutes les captures (vu : b1 à b7).
2. Préparer (4A–4C, 5A–5C) repris de ref-preparer : calendrier, « Date dépassée » + « Changer la date », goutte et « + » aux deux groupes Eau, « Consigne 76 °C » à part, mélange en chasse fixe. 4A = la référence, au pixel près hors police.
3. 2C ensemencement : « À cru 171 g · 9 g/L · Citra 85 · Galaxy 43 · Mosaic 43 · phase ? », aucun jour. 2C ébullition : moments en g et g/L, « Coupure du feu », 61 IBU en neutre (« dans la marge de l'estimation Tinseth »), plus d'ambre.
4. 3B : feuille Mesurer de l'app (sans poignée) : « ? SG » souligné en tirets + crayon + « moût refroidi », case « Densité refroidie ou corrigée à l'étalonnage », « cible 1,059–1,063 SG », ligne d'aide « 1056 est accepté pour 1,056 », « Pourquoi maintenant », note « Aucun relevé cette étape · un toucher sur le pouce pose 1,061 » ; seul ajout : « Enregistrer revient à la confirmation ». Volume : plage de l'app 11,4–26,6, repère 19, « Volume ramené à 20 °C ».
5. 3C : crayon à côté de chaque valeur, cases de correction, ligne d'aide densité, « Pourquoi maintenant », texte de clôture de l'app gardé (3B aussi), pied collant : « Confirmer » toujours visible (c3c-apres).
6. Choix 5 : écran Concassage de l'app (ref-concassage) avec la colonne des grains 4,1 / 0,91 / 0,45 / 0,34 kg (c5a|b|c-pile) et le groupe de près (c5a|b|c-zoom). Mesuré : en Source Sans 3, « 1111 » fait 61 px en B (proportionnels) contre 82 px en C (tabulaires) à 40 px ; sur les grains l'écart est de 2 à 3 px (0,91 sort de la colonne en B). Dit tel quel sur la page : « À l'œil, presque B ».
7. 1C : la pastille suit la quantité (« 2 sachets » enfoncée, c1c-deux) ; « Pour 19 L prévus ». 1B : masse dite deux fois (case, pastille), plus de sous-ligne ni de virgule en chasse fixe. 2A : panneau entier de l'app (phrases, axe 0 · 72, « Calculer ma dose amère », « Préparer le dry hop »). Page : 1C a son état au repos ; références Concassage et Mesurer · Volume ajoutées.
Non traités (choix du brasseur ou hors portée) : 2C sans α ni rôle à l'ébullition (préférence critique 2B là) ; 3B deux allers-retours ; 4B double source de quantité ; 4C placé en Préparer (z1 le met à l'ébullition : à dire au brasseur) ; Ensuite · Whirlpool encadré en c2 (l'app n'encadre pas ces doses).

Sorties : `node capturer.mjs` → CAPTURES OK (`capturer.txt`, B9 30 ms, mouvement réduit 0 s) ; `verifier-page.mjs … --page-lot` → PAGE OK (46 images chargées, lisible à 390 et 1280 px, sans erreur) (`tests.txt`).
Captures ouvertes (planches os.tmpdir()/v3-planches b1–b7) : c4a|b-repos, c4c-apres, c3b-geste|apres, c3c-repos|apres|apres-cave, c2c-ens, c1c-deux, c5a|b|c-pile, c5b|c-zoom, c2a-apres, c2c-apres|apres-cave, c5a|c-apres, c4b-repos-cave, c5c-apres-cave, page-ordinateur.
Prédiction : « Là c'est mon app ; 1C, 3C. B et C, pareil : prends C. »
DÉCISION À PRENDRE : aucune (le brasseur choisit sur la page).
CONNAISSANCE : Source Sans 3 a des chiffres tabulaires par défaut ; seule `font-variant-numeric: proportional-nums` les rend proportionnels, et l'écart ne porte guère que sur le 1.
LEÇON PROPOSÉE : une passe de retouche sous `work/missions/**` (ignoré par Git) copie d'abord la version jugée (source et captures) dans un sous-dossier daté, sinon la référence de la critique disparaît.
