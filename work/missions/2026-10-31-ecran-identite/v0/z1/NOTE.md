# z1 — La langue de Houblons (série z, créative à fond)

- **Chaleur** : froide. Le formulaire de la baseline, gardé ligne par ligne, mais dit dans la langue de l'étape Houblons (J3).
- **Axes** : A1 (formulaire compacté), A2 (jauge du fermenteur, conseil marqué dessus), A3 (plages du style « au style »), A5 (NOLO en segment « Au style | Absolu »), A6 (bouton d'import tel quel).
- **Idée, en une phrase** : chaque nombre de l'Identité a sa piste, comme l'IBU du bandeau — volume sur la jauge du fermenteur (24 sur 30, conseil en tireté), ébullition sur l'axe 0–90, OG/FG/alc./IBU/EBC sur les bandes du style — et NOLO est un segment noir/blanc.

## Acquis de la baseline (J5, J12)
- [x] en-tête : ‹, « Identité 1/7 », Abandonner, icône d'import, thème (tels quels)
- [x] fil des 7 étapes (tel quel)
- [x] bandeau Grain · OG · IBU · EBC (tel quel)
- [x] bouton « Coller une recette trouvée » du corps (A6, option « tel quel »)
- [x] nom, style, volume, ébullition, NOLO, état du fermenteur au premier écran (J4) ; aucune phrase explicative
- [x] saisie sans `type="number"` (grep : 0) ; `inputmode` decimal/numeric

## Honnêteté (J7)
- `~3 L évaporés`, `~27 L avant ébullition`, `~20 %` d'espace libre : marqués « ~ » (simulé, glossaire). `conseil 24 L` dit « conseil ».
- Plages 22A : catalogue `brewingStylesBootstrap.json` (OG 1,065–1,085, FG 1,008–1,018, alc. 7,5–10, IBU 60–100, SRM 6–14 → EBC ~12–28). FG et alc. de la recette inconnus : **aucun repère** sur ces deux bandes, jamais un zéro. EBC 9,5 sous la bande : repère ambre (hors style), pas d'alerte.
- Aucun chiffre réécrit deux fois (30 L une fois, 24 L conseil une fois).

## Boosters UX (boosters-ux)
- Boosters : `pastille-style` — choisir ; pastille colorée (palette des styles) ; ouvre la liste. `plages-au-style` — lire la relation au style ; 5 bandes + repère ; statique en v0. `jauge-fermenteur` — lire si ça tient ; barre verte 24/30, tireté = conseil ; suit la saisie (v0 : statique). `jauge-ebullition` — lire ; barre bleue 0–90. `segment-nolo` — choisir ; segment noir/blanc ; touché → « NOLO ≤ 0,5 % » sélectionné, « atelier à Levure » apparaît (`z1-nolo.png`). `materiel-du-plan` — lire ; deux tuiles tiretées. `coller-recette` — déclencher.
- B1 OK — 7 boosters marqués ; avant/après du segment NOLO : `z1-haut.png` / `z1-nolo.png`, diffèrent.
- B2 OK — dominante : la carte Identité (nom + style en tête) ; un seul `primary` (Suivant, chrome).
- B3 OK — 74 mots au premier écran, chrome compris (`mots-premier-ecran --max=80` : MOTS OK) ; 7 éléments ; HAUTEUR OK (1,00 écran).
- B4 OK — un panneau, groupes séparés par 12 px ; pas de carte dans une carte (le bloc style est un fond teinté, sans bordure).
- B5 à mesurer — rythme 6/10/12 px posé en CSS ; R2 non mesuré en v0.
- B6 OK — tailles 12/14/16 px ; Source Sans 3 + IBM Plex Mono `tnum` pour tout chiffre ; rien sous 12 px (PAGE OK).
- B7 OK — CONTRASTE OK (pire 5,1:1) ; COULEURS OK (ambre, vert, bleu) ; STANDARD OK.
- B8 à dessiner — états : recette neuve (bandeau absent, champs vides, bandes sans repère), fermenteur plein (jauge rouge + alerte sous le volume), volume inconnu (« — », jauge vide). Non capturés en v0.
- B9 OK — segment NOLO répond au toucher (capture) ; pas de mouvement.
- B10 OK — aucun `type="number"` ; `inputmode` ; libellés reliés (`aria-label`).
- B11 — phrase attendue du critique : « neipa v3, Double IPA, 24 L sur 30 avec 6 libres, 60 min, avec alcool ».
- B12 OK — chevron ⌄, pilules tiretées, rayons 4/8/pilule (STANDARD OK S3).
- B13 OK — champs 32 px, segment 26 px (pilule de 30), tuiles ≥ 60 px ; aucun chevauchement (le + flotte sous le pied).
- Écarts voulus : aucun vis-à-vis de la baseline. Contrôles houblons sautés avec raison : `fiche`, `trait`, `legende`, `au-style` (aucun houblon, aucune famille d'arôme, aucune légende sur Identité).

## Tient / casse
- Tient : lecture en trois secondes, même vocabulaire que l'étape suivante, la relation au style sans un mot de plus.
- Casse : le bouton d'import du corps double l'icône d'en-tête (J9) — gardé en froide, à retirer si A6 tranche « retiré » ; le mot « au style » n'est qu'une étiquette ici (pas de lentille Absolu, inutile sur Identité).

## Contrôles joués
PAGE OK · MOTS OK (74) · PANEL OK (lot : médiane 0,61, ressemblance 0,89) · COMMUN OK (`--sans=mots,fiche,trait,legende,au-style`) · CONTRASTE OK · HAUTEUR OK · `type="number"` : 0.
Captures : `z1-haut.png`, `z1-page.png`, `z1-nolo.png`. Générateur de la série : `gen-commun.mjs`, `gen-z2.mjs`, `etats-z.mjs` (dans ce dossier).
