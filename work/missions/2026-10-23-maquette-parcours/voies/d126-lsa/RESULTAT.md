OK — série lsa : quatre leviers levure dans Suggérer (q2b), froide, tiède, deux chaudes, contrôles verts

## Concepts (une ligne chacun)
- **lsa1** — chaleur froide ; idée : le groupe « Changer de levure » de q2b à sa place, l'effet commun dessiné une fois (agrumes en fourchette ~+1 à ~+3, floral et résineux « ? »), « › » vers Levure au lieu du « + », toucher = jauge « agrumes après ~35, plage 5 à 76 » ; tient : c'est q2b, l'incertitude se voit, plus de levure dans Comparer ; casse : toujours au bout de cinq écrans, le rang « 16ᵉ sur 17 » sans explication.
- **lsa2** — chaleur tiède ; idée : une pastille sous le pouce au-dessus de « Comparer (2) », qui porte déjà sa réponse (floral, résineux ?, agrumes ~+1–3), et s'ouvre en carte de verdicts dans ses mots (Houblons : Aucune, Approche, Atteint ; Verdant : ?, ?, Atteint ; Pomona : ?, ?, Hors style) ; tient : en trois secondes la levure ne bat les houblons nulle part ; casse : la pastille flotte sur le milieu d'une ligne, pas de barre l5b.
- **lsa3** — chaleur chaude ; idée : une tirette au bord gauche (résineux ?, floral ?, agrumes ↑), tirée elle ouvre les « regards de la cuve » : un tube par famille, trait de ma bière, niveau après, plage hachurée, plafond du style, orangé au-dessus ; tient : image de brasseur, honnêteté dessinée ; casse : la tirette couvre 26 px de la liste, le volet cache les voies.
- **lsa4** — chaleur chaude ; idée : le bandeau IBU · OG · EBC a un revers ; sa languette « US-05 » le retourne : « IBU = », agrumes ~+1,3, tropicaux ~+2,2, noyau ~+4,4 hors style, floral résineux « ? », la souche réglée sur place (Verdant | Pomona), collé en tête pendant qu'on parcourt les voies ; tient : la levure lue comme un chiffre de ma bière ; casse : la languette touche le bas de l'OG, sans plage ni point de départ.

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils24-petits-choix/lsa1/{etat.html,NOTE.md,levure.html,assets/parcours.js,assets/style.css}` (bundle de Suggérer rendu, copié une fois, partagé par les quatre pages)
- `…/lsa2/`, `…/lsa3/`, `…/lsa4/` : `etat.html`, `NOTE.md`, `levure.html`
- `…/captures/lsa{1,2,3,4}-{repos,toucher}.png` (390 × 844, toutes ouvertes ; lsa1 et lsa4 au repos liste défilée jusqu'à l'élément, lsa3 au repos à mi-liste)
- Scripts de travail (capture, lecture du moteur, copies pour controle-choix) : `C:\Users\mrspa\AppData\Local\Temp\d126-lsa\`

## Critères
- G1 : `SERIE-BIEN-4`
- G2 : `COMMUN OK` (au 2ᵉ essai : CONTRASTE, STANDARD S2 et TRAIT corrigés sur lsa3 et lsa4)
- G3 : ce fichier
- Indicatifs, joués une fois : CHOIX OK ×4 (copie en `suggerer/etat.html`, `--ecran=suggerer`) ; MOTS OK (37 à 41 mots hors données) ; PANEL OK (médiane 0,81, ressemblance 0,85, 0 paire presque identique) ; UNE-QUESTION ECHEC 4 fautes par page, les mêmes que Suggérer rendu lui-même (pas de titre-question ni de ligne de contexte, D117 ; « levure » compté par la pastille biotransformation du dry hop) : rien d'ajouté par les concepts.

## Prédiction
« lsa2 très bien, on voit direct que la levure fait rien pour le floral ; lsa3 les cuves c'est parlant mais ça cache tout ; lsa4 pas mal ; lsa1 c'est mon groupe, ok. »

DÉCISION À PRENDRE : (1) le « + » de q2b sur une souche (vers Comparer) devient « › » vers Levure dans lsa1 (L10) : écart à son choix, à lui montrer tel quel ; (2) VOIE.md cite « ~+13 agrumes avec Pomona » : pour Suggérer (Stout 16D), +13,2 est Verdant IPA et Pomona fait +28,1, hors style ; les pages suivent le moteur, à corriger dans les briefs suivants ; (3) `levure.html` (le pont) est l'étape Levure rendue, réglée sur Dryhopper (Idaho 7) : y arriver depuis Suggérer montre un houblon qu'il n'a pas choisi (déjà relevé par lvb).

CONNAISSANCE : sur Suggérer rendu, deux « ma bière » coexistent pour les agrumes : la carte « Plus agrumes » lit 1,1 → 16,8 (visée 11,1) quand le levier levure de `proposeVoies` part du repère 7,4 (`before.profile.citrus`) ; tout dessin qui pose l'effet levure sur les pistes des cartes mélange deux sources. Le profil après d'une souche porte des plages larges (agrumes 5,2 à 75,9 avec Pomona, confiance `low`), utilisables pour montrer l'incertitude. Les souches arrivent 16ᵉ et 17ᵉ sur 17 voies au classement du moteur. Un élément ajouté au `body` de la maquette jouable est `inert` (coque modale) : le poser dans `.page-shell`.

LEÇON PROPOSÉE : aucune
