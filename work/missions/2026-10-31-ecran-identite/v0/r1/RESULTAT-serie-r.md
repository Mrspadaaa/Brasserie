OK — série r : 6 concepts Identité (jauge, puces, cuve, curseurs, anneaux, tuiles), PANEL OK

Série r (des représentations distinctes), v0 de l'écran « Identité 1/7 », 31.10. Concepteur Opus.

## Fichiers écrits (tous sous `work/missions/2026-10-31-ecran-identite/v0/`)
- `r1/` froide : la jauge à la place de la phrase (formulaire compacté, jauge du fermenteur sous le volume).
- `r2/` froide : des puces, sans clavier (puces de volume et de durée, badge du fermenteur, tags de plage).
- `r3/` tiède : le fermenteur qu'on remplit au pouce (cuve de 30 L dessinée, glisser vertical).
- `r4/` tiède : chaque nombre est un curseur (piste du volume portant le fermenteur, évaporation sous le pouce).
- `r5/` chaude : deux anneaux qu'on tourne (fermenteur à l'extérieur, ébullition à l'intérieur).
- `r6/` chaude : un centre de contrôle (tuiles qui se remplissent, NOLO qui s'allume).
- Dans chaque dossier : `etat.html`, `NOTE.md`, `<id>-haut.png`, `<id>-page.png`, `<id>-avant.png`, `<id>-apres.png`.
- Ce fichier, rangé dans `r1/` faute de dossier de voie (consigne : écrire seulement dans `v0/r*/`).

## Sorties décisives
- `verifier-page.mjs … --min-images 0` : PAGE OK ×6.
- `mots-premier-ecran.mjs v0 r1…r6 --page=etat.html --max=80` : MOTS OK (78, 80, 68, 77, 55, 65).
- `controle-panel.mjs` sur les 6 premiers écrans : PANEL OK (médiane 0,59 ; 1 sous 0,50 : r2 à 0,46 ; ressemblance 0,88 ; 0 paire presque identique). r1 et r4 sont justes au seuil (0,505 et 0,504).
- `controle-commun.mjs … --sans=mots,au-style,fiche,trait,legende` : couleurs, survol, blocs, contraste, parlant, brutes OK ; standard ECHEC. S3 compte les rayons 10 et 16 px de DESIGN.md hors de l'échelle 2/4/8 des maquettes houblons. S4 vient du + commun, à 2 px contre 1,3 px pour les autres icônes.
- `type="number"` : 0. `controle-choix.mjs` : s.o. (Identité absent du registre, écran ouvert).
- Gestes joués (avant et après) : les six paires diffèrent (volume au plein, alerte, ébullition, NOLO).

## Captures (ouvertes)
`v0/r1/r1-haut.png` … `v0/r6/r6-haut.png` ; pages entières `-page.png` ; gestes `-avant.png` et `-apres.png`.

## Prédiction
« r3 et r6 c'est vachement parlant, le fermenteur qui se remplit ; r1 c'est mon écran en mieux, mais r2 reste trop vide. »

DÉCISION À PRENDRE : `controle-commun` et `controle-standard` sont calibrés pour l'outil houblons. Au-style, fiche, trait et légende exigent des houblons, et S3 impose 2/4/8 px contre les 10/16/24 de DESIGN.md. Pour les écrans du programme « un à un comme houblons », il faut un profil sans houblon et l'échelle de DESIGN.md dans S3. Sinon, chaque série écrira les mêmes `--sans` et le même écart.

CONNAISSANCE : neipa v3 (EBC 9,5) est plus claire que la plage du style Double IPA 22A (SRM 6–14, soit EBC 12–28 ; `brewingStylesBootstrap.json`). C'est la seule valeur de la recette hors du style, et l'exception à étiqueter sur cet écran. Autre point : `controle-panel` ne compte pas les panneaux #F5F5F5 sur fond blanc (écart de 30, seuil 60). Un écran en rangées de formulaire y mesure 0,40 à 0,50 même plein jusqu'en bas.

LEÇON PROPOSÉE : un gabarit commun à une série publie ses noms de classes, et aucune variante ne les réemploie. Le 31.10, `.§sw` (pastille EBC du bandeau) et l'interrupteur de r3 ont fusionné en silence ; seule la capture l'a montré (cas de L26).
