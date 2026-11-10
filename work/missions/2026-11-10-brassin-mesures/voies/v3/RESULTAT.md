OK — page-v3 : cinq choix du jour, référence et 3 options chacun, gestes joués ; PAGE OK

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
