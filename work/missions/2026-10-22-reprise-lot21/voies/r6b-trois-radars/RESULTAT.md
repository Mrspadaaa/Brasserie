OK — Comparer r6b : quatre radars r3 (ta 16D, puis chaque houblon), chimie par famille, B

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6b/generer.mjs` → `r6b/etat.html`
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6b/captures.mjs` (puppeteer, 390 px)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6b/NOTE.md` (avec « Choix portés » mot pour mot)
- Captures, toutes ouvertes en image et jugées :
  - `fils22-comparer/captures/r6b-390.png` (page entière) ;
  - `r6b-premier-ecran.png` (390 × 844) ;
  - `r6b-fiche-390.png` (vrai appui long de 700 ms sur Galaxy : la part « autres » dessinée, « à corriger ») ;
  - `r6b-toucher-390.png` (panel OSU et « En bière » ouverts d'un toucher) ;
  - `r6b-absolu-390.png` (lecture absolue, zone irrégulière).

## Critères (rejoués depuis la racine après la dernière génération)
- G1 : `COMMUN OK`, les 11 contrôles OK.
- G2 : `r6b 79 mots`, `MOTS OK`.
- G3 : `UNE-QUESTION OK (1 groupe libre : houblon)`.
- G4 : `radar r3 (au repos), chimie (au repos), osu (à un toucher), valeurs (à un toucher)`, `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)`.
- G5 : `3 voies · 3 avec leur α`, `ALPHA OK`.
- G6 : `1 au-dessus de 25 % (Galaxy 29 % ✓)`, `SANS-FAMILLE OK (1 houblon(s) au-dessus de 25 %, part « autres » visible)`.
- G7 : `EXISTENT OK 7`.
- G8 : `NOTE OK`.
- G9 : ce fichier.

Essais utilisés :
- G1 : 2 (contraste du séparateur « · » à 3,41:1 ; séparateurs retirés).
- G2 : 3 (108, puis 82, puis 79 mots : « ? » écrits retirés du radar, chimie regroupée par unité, trois mots redondants retirés).
- Les autres critères : 1 essai chacun.

Pendant la relecture des captures, j'ai trouvé et corrigé quatre défauts que les critères ne voyaient pas :
- les valeurs E03 d'Idaho 7 étaient celles d'Azacca (ma recherche ne filtrait pas la variété) ;
- les sections « à un toucher » étaient visibles au repos (`.carte` l'emportait sur `hidden`) ;
- des arrondis perdaient une décimale (56,9 devenait 57) ;
- « caryophyllène » débordait sur sa colonne.

Geste joué dans Chrome : retirer Galaxy masque sa carte et sa colonne de chimie ; le retrait est refusé sous deux houblons ; « + Galaxy » le remet.

## Prédiction
« Pas mal, je vois tout de suite que Galaxy sort du style et qu'Idaho 7 est le plus floral, mais les radars sont petits et les traits pâles partout, c'est un peu chargé. »

## Doutes et limites
- Les écarts de floral sont faibles (+0,9 ; +1,3 ; +0,9 cran, simulés, confiance moyenne pour Idaho 7). Le badge « le plus » repose sur 0,4 cran.
- Les plages du moteur touchent le bord presque partout (thiols de Nugget inconnus, `hautPartiel`). Le trait pâle sur l'axe le montre honnêtement, sans beaucoup distinguer les houblons, sauf Galaxy.
- 79 mots pour 80 : peu de marge.
- Picto « épicé » : celui du socle, refusé trois fois. Il attend la planche r4.
- Le générateur dépend de `fils21-choisir/v1/socle.mjs`. Les chiffres viennent de comparer-stout.json ; l'α y est vérifié contre le socle et le générateur s'arrête s'il diverge.
- `data-valeurs` du radar : −1 marque une famille inconnue (listée dans `data-inconnues`).
- `git status` montre `loupe.html` et `loupe.png` à la racine : ces fichiers ne viennent pas de cette voie.

DÉCISION À PRENDRE : aucune hors du choix de variante par le brasseur.

CONNAISSANCE : à dose égale (4 g/L, après fermentation, 3 j, US-05) dans la stout 16D, le moteur donne au floral +0,9 cran pour Cascade (confiance bonne), +1,3 pour Idaho 7 et +0,9 pour Galaxy. Galaxy sort du style en tropical (39,5 pour une bande de 0 à 30). Chacun ajoute environ +2 crans de résineux, déjà trop à la dégustation du 18.10 : aucun des trois ne répond au « trop résineuse ». Dans comparer-stout.json, `panels[E03].mesures` mêle trois variétés (Azacca, Idaho-7, Sultana) : il faut filtrer `variete`.

LEÇON PROPOSÉE : un contrôle vert ne vérifie pas qu'une valeur vient de la bonne ligne. Le 22.10 (r6b), ACQUIS passait alors que les valeurs « Idaho 7 » d'E03 étaient celles d'Azacca, et que deux sections « à un toucher » étaient visibles au repos (une règle CSS l'emportait sur `hidden`). Faire : relire chaque vraie valeur affichée contre sa ligne source, avec la variété, et ouvrir la capture au repos pour voir que le caché est caché. Rôles : auteur, concepteur, relecteur.
