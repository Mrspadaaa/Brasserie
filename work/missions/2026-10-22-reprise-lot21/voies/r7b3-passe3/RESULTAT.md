OK — b4 passe 3 sans vide : remplissage 0,35 → 0,65 (panel avec r6n2 0,70), G1–G8 verts

## Fichiers écrits (périmètre possédé)
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-b/passe3/b4/etat.html`
- `.../serie-b/passe3/generer.mjs` et `.../serie-b/passe3/captures.mjs`
- `.../serie-b/passe3/NOTE.md`
- `.../serie-b/passe3/captures/` : `b4-390.png`, `b4-premier-ecran.png`, `b4-toucher-390.png`.
- `.../serie-b/passe3/captures/travail/` : `b4-pendant.png`, `b4-3j.png`, `b4-fiche.png`, `b4-legende.png`, `b4-absolu.png`, `geste-b4.json`, et deux copies du générateur avant retouche.
- La passe 2 n'a pas été touchée.

## Remplissage
Mesuré par controle-panel sur le premier écran : passe 2 à 0,35 ; premier jet de la passe 3 à 0,49, puis 0,59, puis **0,65**. Avec r6n2, médiane 0,70. Toujours 80 mots.

## Ajouté ou rapproché (des idées, pas du texte)
- Fond blanc sans cartes, blocs collés. « Au style / Absolu » est monté sur la ligne de la réponse, le « ? » dans la barre de titre.
- Chaque ligne du podium a deux étages :
  - en haut, floral et résineux en barres l5b (zone 16D, trait de ta stout, contour de ce qui est emporté), et la jauge d'IBU ;
  - en bas, la mesure du moment et les 12 familles en mini-barres. Elles remplacent les bandes arc-en-ciel, nommées par un axe de 12 pictos, sans un mot.
- Ligne « ta stout » en tête : x3b réduit, la base réelle, résineux 83.
- Greffes :
  - loupe à mini-barres chiffrées (e5) ;
  - « emporté » en contour, la hachure réservée à l'inconnu (a1) ;
  - jours « sans gain » pâles en bout de frise, chacun avec sa barre de floral (a1/g1) ;
  - courbe d'activité de la levure sur le dock, en schéma (f5/g6) ;
  - dock-profil haut de 70 px avec le trait orangé « trop amer ».
- Retouches communes du verdict :
  - codes de source hors du premier plan, une seule source visible (McCabe 2023) ;
  - « 1 fiche » une fois en tête de la fiche ;
  - « au levurage ».

## Sorties décisives (depuis la racine)
- G1 : `COMMUN OK`. En route : contraste 4,45:1 sur la ligne ★, corrigé.
- G2 : `b4 80 mots` · `MOTS OK` (89 en route).
- G3 : `UNE-QUESTION OK (1 groupe libre : moment)`
- G4 : `ACQUIS OK (4/4 : geste, frise, valeurs, levure)`. En route : « cuit » sans nombre, puis la regex `\d` perdue à l'assemblage.
- G5 : `PAGE OK (0 images chargées, 390 px, sans erreur)`
- G6 : `remplissage médian 0,70, 0 sous 0,55 · ressemblance moyenne 0,87` · `PANEL OK`
- G7 : `EXISTENT OK`
- G8 : `NOTE OK`
- Geste au doigt jusqu'à 35′ : loupe ×8,1 avec mini-barres. La ligne 35′ se range entre 10′ et 60′ : « à 35′ contre ★ : floral ≈−14 · résineux ≈−9 · trop amer ». Console vide.

## Captures ouvertes et regardées
- `b4-premier-ecran.png`, `b4-toucher-390.png`
- dans `travail/` : `b4-pendant.png`
- à côté, `r6n2-premier-ecran.png`

## Prédiction
« Là c'est dense et lisible : je vois ce que chaque moment met dans ma stout, et le piège à chaud. Mais le résineux est partout pareil, il faudrait qu'on voie mieux le +14 contre +20. »

CONNAISSANCE : le contrôle de panel compte une rangée de pixels comme pleine si plus de 2 % de sa largeur s'écarte du fond de plus de 60 (somme RVB). Des fonds de bloc gris clair (#eef0f4 sur blanc, écart 43) et les marges internes des lignes comptent donc comme vides. Ce qui remplit : des barres verticales, des filets, des zones de style sombres (#d5d8df).

LEÇON PROPOSÉE : un générateur retouché par un script qui écrit du code dans une chaîne perd ses barres obliques inverses (`\d` est devenu `d` ; M10 et L26 sous une autre forme). Dans ces retouches, écrire les classes de caractères sans barre oblique (`[0-9]`), puis relire par grep la ligne écrite dans la page avant de rejouer les contrôles.
