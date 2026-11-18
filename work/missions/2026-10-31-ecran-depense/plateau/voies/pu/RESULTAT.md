OK — 4 variantes : p3c-3 affinée, une question, phrase et tiroir, face à face

## Fichiers écrits
- `plateau/v0/pu1..pu4/` : `etat.html` (repos et cas a à f par `?etat=`, sombre par `&theme=cave` ; défaut = cas d), `NOTE.md`, 9 captures chacune.
- `plateau/voies/pu/` : `src/` (socle commun = liste de p3c-3, et le plateau de chaque variante), `build.mjs` (assemblage, préfixe par split/join, L26), `capture.mjs`, `sorties/` (sorties des contrôles).

## Critères
1. Quatre `etat.html`, six cas plus repos. Captures : `pu<n>-{repos,a,b,c,d,e,f}.png` à 390 × 844 en clair, `pu<n>-d-cave.png`, `pu<n>-1280-b.png`. Rendu : 36 captures, 0 erreur, 0 requête réseau ; chaque plateau tient entre sa rangée et le pied (36/36). Captures ouvertes : pu1 b, d, e, f ; pu2 b, d, e ; pu3 b, d, f, d-cave ; pu4 b, d, f, 1280-b. Les autres ont été prises sans être regardées.
2. NOTE : chaleur, idée, baseline cochée, contrôles. COMMUN OK (`--profil=sans-houblons --sans-lignes`) ; MOTS 52 / 72 / 59 / 54 ; CONTRASTE OK (pire 5,2:1) ; PAGE OK ×4.
3. `git status` : rien hors de « Possède », dans ma voie.

## Écart signalé
- **PANEL ECHEC** sur les 24 cas ouverts : ressemblance 0,91, au-dessus du seuil de 0,90, et 1 % de paires presque identiques. Cause : la liste groupée de p3c-3 est la même dans les quatre et prend le premier écran, puisque la facture est courte. Les plateaux diffèrent, mais pas ce qui les entoure.
- J'ai essayé, dans pu2, de replier les autres familles. Annulé : la moitié de l'écran restait vide (le refus du 23.10).
- En passe 2 : une facture plus longue ou une liste propre à chaque concept. Le pilote tranche, car la liste est la baseline.
- À 1280 : une colonne de 760 px centrée, sans profiter de la largeur.

## Prédiction
« pu1 c'est propre, mais pu4 le face à face, là je comprends enfin le mapping ; pu3 le tiroir au pouce vachement bien. »

DÉCISION À PRENDRE : le panel v0 peut-il garder la même liste de la baseline autour de plateaux différents (PANEL ECHEC structurel), ou faut-il une liste propre à chaque concept ?
CONNAISSANCE : aucune
LEÇON PROPOSÉE : un panel v0 d'un détail posé dans une liste imposée mesure surtout la liste. Passer à controle-panel le plateau rogné, ou le cadrer dans le brief.
