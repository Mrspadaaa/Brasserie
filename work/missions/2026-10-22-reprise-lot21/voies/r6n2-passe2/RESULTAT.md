OK — r6n2 passe 2 : quatre défauts corrigés, « épicé » cannelle-clou, critères verts

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n2/generer.mjs`, puis `etat.html` régénéré
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n2/NOTE.md` : section `## Passe 2`, deux phrases rectifiées (Souche, quatre colonnes)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n2-*.png`, reprises par `r6n2/captures.mjs`

La copie de sauvegarde du générateur a été supprimée. `git status` ne montre rien de moi hors de l'OWNS (les déplacements `voies-ecartees/` sont ceux du pilote).

## Défauts, avant → après
1. **Quatre colonnes.** Avant : « Casca », « Galax », « Tropicau » coupés, et « 9,5–14,9%α 6,5% » collés.
   Après : les rangées ne gardent que leur picto (libellé de 34 px). « Ta stout » garde son trait, ses deux pictos et le « + ». Les noms passent à la ligne entre deux mots, sans point de couleur, et l'α des fiches s'écrit « 9,5–15% ».
   Vu sur `r6n2-quatre-390.png` : plus aucun mot coupé, Nelson Sauvin sur deux lignes.
2. **Souche.** Avant : « Pomona change ≈ 0 » sur dix familles.
   Après : une phrase dit qu'après fermentation, Pomona ne change rien pour aucun houblon. Vient ensuite l'aperçu en dry hop actif, houblon par houblon : Idaho 7 agrumes ~+1,3, baies ~+0,3, noyau ~+0,3 ; Cascade agrumes ~+0,4 ; Galaxy ≈ rien. Le tableau compare « la cuve apporte, ici » à « Pomona, en actif ».
   Calculé avant de dessiner (M07). Le générateur échoue si les données ne disent plus « surtout Idaho 7 ».
3. **Frise.** Avant : trois droites plates de 1 à 7 j.
   Après : la phrase « à 4 g/L, le moteur ne distingue que le premier jour ; de 2 à 7 j, même profil », avec le floral à 1 j puis de 2 à 7 j (Idaho 7 ~24,1 → ~24,5).
   En tête, ce qui bouge vraiment dans Dryhopper : le même ajout en actif. Le résineux y baisse de ~0,5 à ~0,8 cran, ce qui touche sa demande. Le générateur échoue si le floral bouge entre 2 et 7 j.
4. **Le cadre suit la réponse.** Avant : avec « par tropicaux », le cadre restait sur Idaho 7 alors que la réponse nommait Galaxy.
   Après : choisir un critère met en avant le premier du classement. Vu sur `r6n2-tropicaux-390.png` : cadre sur Galaxy, « Défi 0/4 ».
- **En plus.** « ~2,2 crans » est au pluriel. Le nouveau « épicé » (cannelle et clou croisés) est partout : radar, rangées, têtes, fiche.

## Sorties décisives (rejouées depuis la racine)
- G1 : `COMMUN OK`
- G2 : `r6n2 79 mots` → `MOTS OK`
- G3 : `UNE-QUESTION OK (1 groupe libre : houblon)`. Un premier lancement a planté dans l'outil lui-même (`TypeError … reading 'map'`, pendant qu'il était modifié par ailleurs, ` M controle-une-question.mjs`) ; relancé, il passe, et r6a aussi.
- G4 : `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)`
- G5 : `ALPHA OK`
- G6 : `REPRISE OK (27 repris, 2 en contexte, 8 en pont, 0 écartés)`
- G7 : `PAGE OK (0 images chargées, 390 px, sans erreur)`
- G8 : `EXISTENT OK 7`
- G9, G10 : relancés après l'écriture (voir la ligne finale).

## Captures ouvertes en image
- `r6n2-premier-ecran.png` : premier écran de r6a, nouvel « épicé », 79 mots
- `r6n2-toucher-390.png` : Défi ouvert au doigt, repères C/I/G sur trois voies
- `r6n2-fiche-390.png` : fiche d'Idaho 7 à l'appui long, nouvel « épicé »
- `r6n2-quatre-390.png`
- `r6n2-tropicaux-390.png`
- `r6n2-souche-390.png`
- `r6n2-frise-390.png`

Les autres captures ont été reprises mais pas rouvertes à cette passe.

## Prédiction
« Là c'est propre, r6a avec ce que j'avais noté. Et le coup du dry hop actif qui baisse le résineux, ça donne envie d'aller voir Dryhopper. Mais les rayons roses du radar, je les trouve toujours de trop. »

DÉCISION À PRENDRE : aucune.

CONNAISSANCE : dans comparer-stout.json (4 g/L), le moteur ne distingue que le 1er jour de contact (de 2 à 7 j, même profil). Pomona ne change rien après fermentation. En dry hop actif, Pomona réveille surtout Idaho 7 (agrumes ~+1,3 cran) et un peu Cascade (~+0,4) ; Galaxy et Nelson Sauvin ne bougent pas. Le dry hop actif au lieu d'après baisse le résineux de ~0,4 à ~0,8 cran selon le houblon. C'est le seul levier simulé vers « moins résineux ».

LEÇON PROPOSÉE : une phrase de feuille qui résume les données (« surtout Idaho 7 », « même profil de 2 à 7 j ») porte son assertion dans le générateur, qui échoue si les données la contredisent. En passe 1, la NOTE disait « Pomona change peu » alors que l'écart était exactement 0. Une assertion à la génération attrape ce décalage avant toute capture. Rôles : concepteur, auteur. Contrôle : aucun (assertions locales au générateur).
