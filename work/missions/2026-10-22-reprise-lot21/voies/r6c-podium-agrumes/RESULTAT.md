OK — r6c : podium à agrumes égaux (Galaxy 50 g, Cascade 80 g, Idaho 7 150 g), quatre acquis

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6c/generer.mjs` (générateur), `page.css`, `client.js`, `captures.mjs`
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6c/etat.html` (généré), `NOTE.md`
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6c-390.png`, `r6c-premier-ecran.png`, `r6c-fiche-390.png`, `r6c-toucher-390.png`, plus `r6c-absolu-390.png`, `r6c-nelson-390.png`, `r6c-legende-390.png`
- Rien hors de « Possède » : `git status --short` le confirme (un `diag.mjs` temporaire, dans r6c, a été supprimé).

## Critères (rejoués depuis la racine, état final)
- G1 : `COMMUN OK` (couleurs, au style, survol, blocs, contraste, fiche, standard, trait, légende, parlant, brutes)
- G2 : `r6c 79 mots` → `MOTS OK`
- G3 : `UNE-QUESTION OK (1 groupe libre : houblon)` ; contexte : base, moment, levure, bière
- G4 : `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)` ; radar, chimie et osu au repos, valeurs à un toucher
- G5 : `ALPHA OK` (3 houblons sur 3)
- G6 : `EXISTENT OK 7`
- G7 : `NOTE OK`
- G8 : `NOTE OK` (ce fichier)

Essais :
- G1 : 2. FICHE échouait parce que le voile de la fiche recevait le clic de fin d'appui long et la refermait ; STANDARD échouait sur la couleur des colonnes sans nom et sur une flèche tournée qui changeait l'épaisseur rendue.
- G2 : 2 (89 mots, puis 77 et 79).
- G5 : 2 (`data-houblon` placé sur la colonne au lieu du nom).
- Les autres critères ont tenu au premier essai.

## Captures ouvertes et jugées
- `r6c-premier-ecran.png` : le podium se lit en 3 s. Galaxy est sur la plus haute marche, pleine (~2,5 g/L, 50 g), Cascade 2e, Idaho 7 3e. Sous chaque marche, 3 lignes « en plus » ; le résineux, toujours montré, est orangé ↑. Ensuite viennent les familles, avec trois barres égales sur Agrumes.
- `r6c-390.png` : la page entière, dans l'ordre : familles, radar r2 (Galaxy plein avec ses intervalles, les autres en contour), chimie avec pictos, panel OSU, « À ces doses », vraies valeurs, pont Dryhopper.
- `r6c-fiche-390.png` : fiche g1 de Galaxy à l'appui long. On y voit α 17,2 % ≠ 11–16 %, les arômes 1/1 fiche, « Hors des 12 familles : cannabis, dank » et la silhouette avec ses « ? ».
- `r6c-toucher-390.png` : les vraies valeurs ouvertes d'un toucher (α du lot et des fiches, β, huile, sources et années).
- Autres états regardés :
  - `r6c-absolu-390.png` : les points remplacent les crans ;
  - `r6c-nelson-390.png` : 4 colonnes, Nelson Sauvin 3e ;
  - `r6c-legende-390.png`.

Prédiction : « Le podium c'est clair, Galaxy en 50 g, mais il me sort du style en tropical et Idaho 7 me met du floral, donc c'est pas si simple — pas mal, mais les "en plus" je veux pouvoir les toucher. »

## Doutes et limites
- Le stock n'est pas dans `comparer-stout.json`. L'icône « en stock » est déduite de l'α « fiche de stock » ou « lu sur l'article » ; la quantité est inconnue.
- Les crans « en plus » sont simulés et leurs intervalles sont énormes (le haut vers 55–63). Le trait fin le montre, le chiffre non.
- Les valeurs sont interpolées linéairement à la dose d'effet égal, entre les points 0, 1, 2, 4 et 8 g/L de la grille, même règle que `effetEgal`.
- Le résineux, en « famille par famille », est sur une échelle élargie, dite dans la légende. Sans elle, les barres seraient rognées : sa stout est déjà au-dessus.
- Le floral de Galaxy (+1) vient du moteur (linalol), alors que ses fiches ne décrivent pas de floral.
- Le pont Dryhopper est inerte.
- Les hauteurs des marches sont fixes : la hauteur dit le rang, pas une quantité.

DÉCISION À PRENDRE : aucune.

CONNAISSANCE : à agrumes égaux (Cascade 4 g/L, dry hop après, 3 j, US-05), le moteur donne Galaxy ~2,5 g/L, Cascade 4 g/L, Nelson Sauvin ~7,4 g/L et Idaho 7 ~7,5 g/L. Le résineux ajouté suit surtout la dose (≈ 6 points par g/L pour les quatre). Le houblon qui demande le moins de grammes ajoute donc le moins de résineux à une stout déjà trop résineuse. Galaxy fait pourtant sortir les tropicaux du 16D (+3 crans, au-dessus de la bande), et Idaho 7 donne le plus de floral (+2). Source : r6c/generer.mjs sur comparer-stout.json.

LEÇON PROPOSÉE : un générateur qui assemble du code client par `String.replace` doit utiliser une fonction de remplacement ou `split/join`. Dans une chaîne de remplacement, `$$` devient `$`. Ici, deux fois, `$$('.voie')` est devenu `$('.voie')` sans erreur au build, et l'appui long était cassé en silence. Rôles : concepteur, auteur, exécutant. Contrôle : écouter `pageerror` dans le script de capture.
