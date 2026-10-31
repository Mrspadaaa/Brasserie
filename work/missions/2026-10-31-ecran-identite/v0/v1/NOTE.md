# v1 — repères du style ouverts en pistes

- **Chaleur** : froide (affine la baseline : même ordre, même formulaire).
- **Axes** : A3 (plages en mini-barres sous le style, avec la valeur de la recette) ; A5 (interrupteur) ; A6 (bouton du corps retiré, l'icône d'en-tête suffit).
- **L'idée** : Les « Repères du style », repliés aujourd'hui, s'ouvrent sous le style en cinq pistes « au style » (OG, FG, alcool, IBU, EBC), la recette posée dessus, dans une carte teintée de la couleur de la bière.

## Baseline (acquis cochés)
- [x] En-tête commun : ‹, « Identité 1/7 », Abandonner, icône d'import, thème (repris de BrewWizard.tsx l. 2121, sans changement).
- [x] Fil des 7 étapes (WizardStepRail, libellés courts, barre active noire).
- [x] Bandeau Grain 8,6 kg · OG 1,080 · IBU ~93 (piste du style 60–100) · EBC 9,5 (pastille).
- [x] Lanceur + et pied « Retour · Suivant — Malts/sucres » : le pied est posé en bas du premier écran, le + dans son coin, sur aucune valeur (D164).
- Module commun : `v0/v1/commun.mjs` (classes préfixées par l'id, L26). Fabrique : `v1/fabrique.mjs` → `etat.html`.

## Honnêteté (J7)
- FG et alcool : inconnus (« — », piste hachurée), jamais 0 ; ils viennent de la levure (étape 4).
- « ~3 L évaporés » : le « ~ » marque l'estimation (repli 10 %/h possible, M1 non mesuré). Espace libre « ~20 % » : conseil, tireté sur la jauge.
- EBC du style : BJCP 2021 en SRM 6–14, converti ×1,97 en 12–28 EBC (conversion d'affichage, dite dans la légende ou le détail).
- Plages 22A tirées de `src/data/brewingStylesBootstrap.json` ; recette de démonstration du brief.

## Contrôles du lot (joués une fois sur v1 à v6)
- `verifier-page.mjs … --min-images 0` : PAGE OK (390 px, sans erreur).
- `mots-premier-ecran.mjs --max=80` : v1 75 mots ; MOTS OK 6/6.
- `controle-panel.mjs` (6 premiers écrans) : remplissage médian 0,66, 0 sous 0,50 ; ressemblance 0,76 ; 0/15 paires presque identiques → PANEL OK.
- `controle-commun.mjs --sans=mots` (sortie : `v0/v1/commun-sortie.txt`) : couleurs OK, survol OK, blocs OK, contraste OK, legende OK, parlant OK, brutes OK ; ECHEC : au-style, fiche, trait (propres aux écrans houblons : aucun houblon, aucune famille sur Identité) et standard (S3 : rayons 10/16 px de DESIGN.md contre l'échelle 2/4/8 du contrôle ; S4 : le + commun à 2 px). Défauts connus du contrôle (D202).
- `controle-choix.mjs --registre` : REGISTRE OK (8 écrans) ; Identité n'y est pas : aucun choix à reprendre, la baseline est l'écran de production.
- `impeccable detect` : aucun contraste en défaut après correction ; reste des hex en dur (page statique, valeurs du thème clair) et des rayons hors jetons du détecteur.
- `type="number"` : 0 (grep).
- Toucher d'un booster (script R6 léger) : capture `v1-apres.png`, l'écran change.
- Captures : `v1-haut.png` (premier écran, ouvert), `v1-page.png` (page entière, avec les autres états), `v1-apres.png`.

## Boosters UX (boosters-ux)
- pistes-style (piste-OG … piste-EBC) — lire, comparer ; ligne entière tapable ; bande du style à 25–75 % de la piste, trait de la recette ; effet : le détail de la ligne s'ouvre (source, conversion, « à la levure »)
- nolo — choisir ; interrupteur ; effet : bascule
- fermenteur — suivre ; jauge 0–30 L, tireté du conseil ; lecture
- espace-libre — ajuster ; dépliage ⌄
- du-style — déclencher ; puces tiretées Empâtage, Fermentation (aperçu, rien d'écrasé)
- style — choisir ; combobox
- B1 OK : boosters marqués `data-booster` ; avant/après du toucher différents (piste-EBC).
- B2 OK : dominante, la carte paille des cinq pistes ; une action principale (Suivant, noir).
- B3 OK : 75 mots au premier écran (80 au plus), aucune phrase explicative au repos ; détail à un toucher (légende « ? », lignes dépliables, espace libre ⌄).
- B4 OK : deux groupes, la bière puis le brassin ; pas de carte dans une carte.
- B5 s.o. : écarts non mesurés (R2) en v0.
- B6 OK sur la capture : Source Sans 3 pour ce qui se dit, IBM Plex Mono pour les mesures ; aucun texte sous 12 px ; tailles non comptées (R4).
- B7 OK : contraste OK (controle-contraste) ; COULEURS OK (or de la bière, vert du houblon « dans la plage », bleu de l'eau pour l'évaporation) ; une seule couleur d'exception (ambre « pâle »).
- B8 OK : états dessinés sous le premier écran (recette neuve sans trait, fermenteur plein en rouge avec sa sortie, NOLO coché) ; inconnu hachuré ou « — », jamais 0. Hors ligne et chargement : s.o. (page statique, aucune donnée réseau).
- B9 partiel : retour `:active` sous le doigt ; délai non mesuré ; `prefers-reduced-motion` coupe les transitions.
- B10 OK : 0 `type="number"` ; `inputmode="decimal"` ou `numeric` ; valeur dans le champ.
- B11 : « Ma neipa v3 tient dans la Double IPA en densité et en amertume, elle est plus pâle que le style ; FG et alcool à venir ; 24 L dans 30 L. »
- B12 OK : un seul chevron ⌄, rayons 10 et 16 px (DESIGN.md), icônes au trait d'une seule famille (lucide).
- B13 partiel : cibles de 24 px au moins sur la capture (« ? » 24, puces 28, lignes ≥ 26) ; non mesuré (R5).

## Ce qui tient
- La lecture la plus directe de A3 : chaque grandeur, sa plage, sa valeur ; l'exception (EBC pâle) seule étiquetée.
- Formulaire quasi identique : rien à réapprendre.

## Ce qui casse
- OG, IBU et EBC sont écrits deux fois (bandeau commun et pistes) : contre « chaque chiffre écrit une fois » (J4). Écart assumé de l'option A3 ; à trancher avec le bandeau (transversal).
- La teinte paille de la carte est un hex hors jetons ; à porter en jeton si retenue.
