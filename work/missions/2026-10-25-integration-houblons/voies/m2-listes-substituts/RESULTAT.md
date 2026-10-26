OK — page de choix : 11 houblons, listes A, B, C et D côte à côte (PAGE OK)

## Fichiers écrits (tous dans la voie, rien dans src/)
- `page.html` : titre « Listes de remplaçants 26.10 ». En tête (`#a-choisir`) : « Quelle liste te remplace le mieux chaque houblon ? ».
  Puis une section par houblon, dans l'ordre du contrat : Nelson Sauvin, Motueka, Citra, Galaxy, Saaz (CZ), Mosaic, Simcoe,
  Cascade, puis Fuggle, Magnum (US) et Willamette. A est en tête, en référence (cadre ambre), et chaque vignette s'ouvre en
  grand à côté de A (visionneuse de m1).
- `img/*.png` : 41 vues à 390 px de large (×2). 8 houblons × 4 colonnes, plus 3 ordinaires × 3 colonnes : la voie ia1 n'a pas
  de D pour ces trois-là. La hauteur est commune à un houblon (844 à 1068 px). `img/jeux.json` liste les vues.
- `capturer.mjs` : les captures, prises dans l'app (commande en tête du fichier). `faire-page.mjs` écrit la page.

## Comment
- Substituer est ouvert dans la vraie app (`?dev-local&etape=houblons`, fixtures, `VITE_HOP_V4=on`). Dans la page rendue, pour
  chaque candidat, je clone la vraie ligne d'un remplaçant (`.pq-substituer-l`, avec son « + ») et la ligne de l'original. Les
  nœuds de l'app sont masqués, jamais modifiés. Les ajouts portent `m2l-ajout` et sont retirés après chaque capture.
- Ce qui change dans la ligne :
  - le score sort : les échelles de A et de B/C ne se comparent pas (93 contre 62) ;
  - l'icône de stock sort : le stock n'est pas connu ici ;
  - entrent le rang, l'α, l'usage en mot (aromatique, double, amérisant) et une seconde ligne.
- La seconde ligne :
  - A, B, C : les mots partagés, mis en français par `versFr` (app) et dédoublonnés (citrus et agrumes → agrumes). Un mot
    rangé dans une famille par le moteur (`familyWords` de l'original, puis du candidat) prend son picto de la planche et la
    couleur texte de sa famille. Un mot qu'aucune famille ne range s'écrit en noir (groseille à maquereau, vin blanc, noble,
    dank…). Un mot générique (règle GENERIQUE de l'app : fruité, doux) s'écrit en gris. Sans mot partagé : « aucun mot en
    commun », en gris italique (Boomerang, Pacific Jade, Kazbek pour Nelson Sauvin).
  - D : la phrase de l'IA, en petit sous le nom, telle quelle, sans autre texte (message du pilote).
- La puce de moment est sur dry hop, sans « recette ». Le titre de l'outil porte le houblon. Le résumé du pied (« 46 g de
  Nugget → … ») est masqué ; « Annuler » et « Remplacer » restent.
- Rien n'est recalculé :
  - A, B, C viennent de `e1-banc-eval/resultats/listes-lambda.json` (`moteur`, `reglage_prudent`, `reglage_retenu`), avec
    l'α, l'usage et les mots partagés de chaque candidat ;
  - D vient de `ia1-reclassement/resultats/cote-a-cote.json` (`option1PlusIA`, rang et phrase). L'α et l'usage des candidats
    de D sont lus dans `proto-data.json` (`alpha`, `purpose`, la source de e1) : D n'en donne pas.

## Critères
- `node scripts/agents/verifier-page.mjs …/m2-listes-substituts/page.html --page-lot --captures %TEMP%/m2/m2` →
  `PAGE OK (41 images chargées, lisible à 390 et 1280 px, sans erreur)`.
- `capturer.mjs` : `aucune erreur de page`, aucune ligne `DÉBORDE` : chaque liste finit au-dessus du pied.
- Visionneuse, testée à 1280 et à 390 px : un toucher sur « Nelson Sauvin · C » ouvre « C · mots, fort | A · l'actuel ».
- `git status` : la voie n'ajoute que des fichiers sous `m2-listes-substituts/`. Les `src/` modifiés de l'arbre (comparer,
  fiche, hopV55) ne viennent pas de cette voie : elle n'a rien écrit dans src/.

## Captures ouvertes et regardées
- En plein format : `img/nelson-sauvin-c.png` (deux fois, avant et après le passage des mots sans famille du gris au noir),
  `img/nelson-sauvin-d.png`, `img/motueka-a.png`, `img/saaz-cz-c.png` et `img/magnum-us-c.png`.
- Captures du vérificateur : `%TEMP%/m2/m2-haut.png` (390 px) et `%TEMP%/m2/m2-ordinateur.png` (1280 px). À l'ordinateur, les
  quatre listes de Nelson Sauvin se lisent sans rien ouvrir. Visionneuse : `%TEMP%/m2/vis-tel.png`.
- Ce qu'on y voit :
  - Nelson Sauvin : en C, Hallertau Blanc (3e) a sept mots communs ; en D, il est 1er. A : Boomerang 1er, sans aucun mot
    commun.
  - Motueka : agrumes et citron vert partout, dès A.
  - Saaz : terreux, floral, herbacé, noble en C.

## Prédiction
« Pour Nelson, A c'est n'importe quoi. C ou D, parce que Hallertau Blanc remonte et qu'on voit vin blanc et groseille. Pour
Motueka et Saaz, les trois se valent. »

DÉCISION À PRENDRE : aucune pour la voie.
- Limites à lui signaler s'il compare D :
  - la phrase de l'IA est montrée telle quelle, sans accents pour Motueka (« neozelandaises », « grace », « myrcene ») ;
  - D vient de l'option 1 sans garde (note du pilote) : ses 20 candidats ne sont pas ceux de C. Le rang 2 de Nelson Sauvin
    est African Queen en D, absent de C.
- « hoppy » et « incense » restent en anglais : `versFr` de l'app ne les traduit pas, comme dans l'app.

CONNAISSANCE : sur les 33 listes A, B et C, les mots partagés sans famille les plus fréquents sont fruité (34 fois), noble
(19), dank et chewing gum (9), groseille à maquereau (8). « Noble » et « dank » n'ont pas de famille dans le moteur et portent
pourtant le caractère de Saaz et de Galaxy.

LEÇON PROPOSÉE : un mot sans famille ne doit pas être grisé par défaut : c'est souvent la signature du houblon (vin blanc et
groseille pour Nelson Sauvin, L14). Seuls les mots génériques (règle GENERIQUE de l'app) vont en gris, le reste en noir.
