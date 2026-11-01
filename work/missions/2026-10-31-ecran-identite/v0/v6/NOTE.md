# v6 — les instruments du brasseur

- **Chaleur** : chaude (forme libre).
- **Axes** : A3 ; A1 (nom éditable sur place) ; A5 (interrupteur).
- **L'idée** : Les instruments qu'il tient en main : le densimètre (OG lue, FG à venir, l'alcool qui en découle), le cadran d'amertume et la pastille de couleur, chacun avec la plage du style dessinée dessus.

## Baseline (acquis cochés)
- [x] En-tête commun : ‹, « Identité 1/7 », Abandonner, icône d'import, thème (repris de BrewWizard.tsx l. 2121, sans changement).
- [x] Fil des 7 étapes (WizardStepRail, libellés courts, barre active noire).
- [x] Bandeau Grain 8,6 kg · OG 1,080 · IBU ~93 (piste du style 60–100) · EBC 9,5 (pastille).
- [x] Lanceur + et pied « Retour · Suivant — Malts/sucres » : le pied est posé en bas du premier écran, le + dans son coin, sur aucune valeur (D164).
- Module commun : `v0/v1/commun.mjs` (classes préfixées par l'id, L26). Fabrique : `v6/fabrique.mjs` → `etat.html`.

## Honnêteté (J7)
- FG et alcool : inconnus (« — », piste hachurée), jamais 0 ; ils viennent de la levure (étape 4).
- « ~3 L évaporés » : le « ~ » marque l'estimation (repli 10 %/h possible, M1 non mesuré). Espace libre « ~20 % » : conseil, tireté sur la jauge.
- EBC du style : BJCP 2021 en SRM 6–14, converti ×1,97 en 12–28 EBC (conversion d'affichage, dite dans la légende ou le détail).
- Plages 22A tirées de `src/data/brewingStylesBootstrap.json` ; recette de démonstration du brief.

## Contrôles du lot (joués une fois sur v1 à v6)
- `verifier-page.mjs … --min-images 0` : PAGE OK (390 px, sans erreur).
- `mots-premier-ecran.mjs --max=80` : v6 77 mots ; MOTS OK 6/6.
- `controle-panel.mjs` (6 premiers écrans) : remplissage médian 0,66, 0 sous 0,50 ; ressemblance 0,76 ; 0/15 paires presque identiques → PANEL OK.
- `controle-commun.mjs --sans=mots` (sortie : `v0/v1/commun-sortie.txt`) : couleurs OK, survol OK, blocs OK, contraste OK, legende OK, parlant OK, brutes OK ; ECHEC : au-style, fiche, trait (propres aux écrans houblons : aucun houblon, aucune famille sur Identité) et standard (S3 : rayons 10/16 px de DESIGN.md contre l'échelle 2/4/8 du contrôle ; S4 : le + commun à 2 px). Défauts connus du contrôle (D202).
- `controle-choix.mjs --registre` : REGISTRE OK (8 écrans) ; Identité n'y est pas : aucun choix à reprendre, la baseline est l'écran de production.
- `impeccable detect` : aucun contraste en défaut après correction ; reste des hex en dur (page statique, valeurs du thème clair) et des rayons hors jetons du détecteur.
- `type="number"` : 0 (grep).
- Toucher d'un booster (script R6 léger) : capture `v6-apres.png`, l'écran change.
- Captures : `v6-haut.png` (premier écran, ouvert), `v6-page.png` (page entière, avec les autres états), `v6-apres.png`.

## Boosters UX (boosters-ux)
- densimetre — lire ; tige graduée 1,000–1,100, plage OG pleine, plage FG hachurée, flèche OG → FG ; effet : lecture, légende au « ? » (v6-apres.png)
- amertume — lire ; cadran 0–120, arc du style 60–100, aiguille ~93
- couleur — lire ; disque de la couleur prévue, anneau des teintes du style
- volume, ebullition — champs
- nolo — interrupteur
- fermenteur — jauge
- B1 OK : boosters marqués `data-booster` ; avant/après du toucher différents (légende).
- B2 OK : dominante, le densimètre et sa flèche « alc. ~8,1–9,5 % » ; une action principale (Suivant, noir).
- B3 OK : 77 mots au premier écran (80 au plus), aucune phrase explicative au repos ; détail à un toucher (légende « ? », lignes dépliables, espace libre ⌄).
- B4 OK : deux groupes, la bière puis le brassin ; pas de carte dans une carte.
- B5 s.o. : écarts non mesurés (R2) en v0.
- B6 OK sur la capture : Source Sans 3 pour ce qui se dit, IBM Plex Mono pour les mesures ; aucun texte sous 12 px ; tailles non comptées (R4).
- B7 OK : contraste OK (controle-contraste) ; COULEURS OK (or de la bière, vert du houblon « dans la plage », bleu de l'eau pour l'évaporation) ; une seule couleur d'exception (ambre « pâle »).
- B8 OK : états dessinés sous le premier écran (recette neuve : instruments à vide, plages du style seules) ; inconnu hachuré ou « — », jamais 0. Hors ligne et chargement : s.o. (page statique, aucune donnée réseau).
- B9 partiel : retour `:active` sous le doigt ; délai non mesuré ; `prefers-reduced-motion` coupe les transitions.
- B10 OK : 0 `type="number"` ; `inputmode="decimal"` ou `numeric` ; valeur dans le champ.
- B11 : « Ma neipa v3 part à 1,080, dans la plage ; elle finira vers 8 à 9,5 % si la FG tombe dans le style ; amère au style, plus pâle. »
- B12 OK : un seul chevron ⌄, rayons 10 et 16 px (DESIGN.md), icônes au trait d'une seule famille (lucide).
- B13 partiel : cibles de 24 px au moins sur la capture (« ? » 24, puces 28, lignes ≥ 26) ; non mesuré (R5).

## Ce qui tient
- Une forme qui représente vraiment l'objet (densimètre, cadran) ; l'alcool attendu, absent de l'écran actuel, se lit d'emblée.

## Ce qui casse
- « alc. ~8,1–9,5 % » est un calcul d'affichage nouveau ((OG − FG) × 131,25 sur les FG du style) : marqué « ~ », mais à valider (J7 : aucun calcul ne change ; voir DÉCISION).
- Le cadran charbon en thème clair, comme v3.
- L'anneau de la pastille approche les teintes 12–28 EBC à l'œil, pas mesuré.
