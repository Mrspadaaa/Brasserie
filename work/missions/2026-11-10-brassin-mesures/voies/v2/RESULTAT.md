OK — passe 2b : toucher le pouce pose 67,0 ; relevé à ses deux places z1 ; PAGE OK

Skills invoqués d'abord : boosters-ux, impeccable, ui-design-system (méthode du 10.11). Fable non utilisé.

## Fichiers écrits (OWNS seul ; planches de contrôle dans os.tmpdir()/vm2-planches)
- `voies/v2/etat.html` : copie de v1. Changent seulement la feuille Mesurer (`feuilleMesurer` et `brancher`, CSS « v2 ») et l'état « après » des variantes. `?v=m1…m10&moment=sacc|og&etat=repos|curseur|hors|apres&theme=cave`.
- `voies/v2/capturer.mjs` (captures et contrôles), `voies/v2/montage.mjs`, `voies/v2/page.cjs`, `voies/v2/tests.txt`, `voies/v2/captures/*.png` (59).
- `page-v2/index.html` et `page-v2/img/` (sa capture, z1 mesure, z1 ébullition, densité au curseur, puis les 10 variantes dans l'ordre du critique : m2, m8, m1, m7, m5, m10, m6, m4, m9, m3).

## Ce qui change (commun aux 10)
1. **Saisie au curseur.** Le geste principal est le pouce sur l'échelle de z1 (rail, bande cible verte, graduations, relevé en trait vert dans la cible et rouge hors). Le trait devient le pouce : trait de 4 px et poignée de 22 px. La zone de toucher fait 44 px de haut, avec un débord de 11 px de chaque côté ; le dessin ne grossit pas. La valeur se lit en grand (28 px mono, la taille de l'horloge). L'écart à la cible se dit en couleur comme dans z1 (« ⚠ −0,8 sous la cible 66–68 °C » en rouge, « ✓ dans la cible » en vert).
   - Pas fins : pH 0,01, °C 0,1, SG 0,001, L 0,1, plus les boutons −pas et +pas (forme des −1 et +1 de l'horloge).
   - Départ sur la cible quand il n'y a pas de relevé précédent. Pouce en pointillé, « ? » ambre, Enregistrer grisé : aucune valeur sans geste.
   - Toucher la valeur (crayon) ouvre le champ `type="text" inputmode="decimal"`. À 1280, ce champ reste à côté du curseur.
   - Densité et volume : un repère seul (1,062 ; 24 L), sans bande, puisqu'aucune tolérance n'a de source (défaut m5 du critique). L'écart est en ambre.
2. **La raison à un toucher.** « Pourquoi maintenant ⌄ » (greffe de m9) est dans la feuille de chaque variante, avec une raison par mesure. Elle est ouverte sur la capture « hors cible ».
3. **La valeur lue une fois** (remplacé en passe 2b, voir plus bas). Après le relevé, 66,4 ne paraît que dans l'horloge (« relevé 66,4 », sa place dans z1). Partout ailleurs, une coche « dans la cible » (m2, m4, m5, m6, m8, m10). La carte « Relevés du jour » de z1 n'apparaît qu'avec une autre valeur, ce qui est un écart à z1 voulu par VOIE ; le comptage est mécanique.

## Sortie décisive de chaque critère
- Page : `node scripts/agents/verifier-page.mjs …/page-v2/index.html --page-lot --captures …/voies/v2/captures/page` donne `PAGE OK (56 images chargées, lisible à 390 et 1280 px, sans erreur)` (dans `tests.txt`).
- `node voies/v2/capturer.mjs` donne `CAPTURES OK`. Il vérifie :
  - 0 débord, 0 `type=number` ;
  - les cibles de la feuille, toutes ≥ 24 × 24, et la zone du pouce de 44 px ;
  - à l'état curseur, sur les 10 : « ? », Enregistrer grisé, aucune valeur posée ;
  - à l'état hors, sur les 10 et en densité : l'écart est dit ;
  - « 66,4 lu 1 fois » après le relevé, sur les 10.
- Gestes réels (B9) dans Chrome tactile :
  - toucher la piste donne `64,1 / hors / Enregistrer actif` en 11 à 24 ms ;
  - +0,1 deux fois donne 64,3 ;
  - « Pourquoi maintenant » s'ouvre ;
  - toucher la valeur donne `champ text/decimal, focus true`.
- Tests vitest : aucun, rien dans `src/`.

## Captures (toutes dans `voies/v2/captures/`)
- Pour chacune des 10 variantes `<v>` : `<v>-palier-repos-390`, `-palier-curseur-390`, `-palier-hors-390`, `-palier-apres-390`.
- m2, m8 et m1 : `-palier-curseur-cave-390`, `-palier-hors-cave-390`, `-palier-curseur-1280`, `-palier-hors-1280`.
- `m2-refroidi-hors-390` (densité), `m2-palier-geste-390`, et pour la page `page-haut`, `page-page`, `page-ordinateur`.
- Ouvertes :
  - m2 en grand (hors) ;
  - les 4 états de m2 en planche ;
  - les « après » des 10 en deux planches ;
  - m2 cave curseur et hors, densité ;
  - m8 à 1280 hors ;
  - `page-haut`.
- Non ouvertes une à une : les états curseur et hors de m8 à m3 à 390 (feuille identique à m2, seul le fond change), m1 1280 et m8 cave, `page-page`, `page-ordinateur`. À regarder par le critique.

## Boosters UX (boosters-ux), par variante
Boosters communs aux 10 (feuille) :
- `curseur` : besoin ajuster ; pouce sur l'échelle cible ; effet vu, « ? » → 64,1 rouge hors cible.
- `pas` : besoin ajuster fin ; −pas et +pas ; 64,1 → 64,3.
- `valeur` : besoin saisir exact ; toucher la valeur ouvre le champ décimal.
- `pourquoi` : besoin comprendre ; repli, ouvert en 2 ou 3 lignes.

Check-list commune vérifiée sur capture :
- B2 : la valeur à 28 px domine la feuille, une seule action `primary` (Enregistrer).
- B8 : inconnu = « ? », jamais 0 ; aucune valeur sans geste.
- B9 : retour en moins de 100 ms ; transition de 150 ms ; `prefers-reduced-motion` respecté.
- B10 : aucun `type=number` ; virgule décimale.
- B13 : cibles ≥ 24 px ; zone du pouce de 44 px ; boutons de pas de 52 × 32.
- B7 : la couleur accompagne toujours un mot (« sous la cible », « dans la cible »), en clair comme en cave.
- B5 et B6 : trois tailles dans la feuille (12, 14, 28) ; mesures en mono.

Par variante, le booster d'invitation de v1 est inchangé, et l'« après » est vérifié à « 66,4 lu 1 fois » :

| v | invitation (v1, inchangée) | après (v2) |
|---|---|---|
| m2 | case « ? » de la carte | coche verte, « à l'instant · ✓ dans la cible » |
| m8 | trou de la flèche | « maische ✓ dans la cible · à l'instant », sans flèche |
| m1 | bouton « ? » de l'horloge | horloge seule |
| m7 | bouton noir du pied | horloge seule ; pied « pH · dès 13 h 15 » |
| m5 | bande dans l'horloge | trait dans la bande et coche |
| m10 | tuile « ? °C » | tuile « relevé ✓ cible » |
| m6 | liste et piste | ligne cochée « à l'instant » |
| m4 | rond dans À anticiper | « Maische relevée · ✓ dans la cible » |
| m9 | soulignement | sa raison propre remplacée par la raison commune (même idée) |
| m3 | badge du pied | horloge seule |

Écarts voulus :
- La carte « Relevés du jour » est masquée quand sa seule valeur est déjà dans l'horloge (VOIE, manque 2 du critique).
- m10 : « ✓ cible » est en mono dans la tuile (style de la tuile v1), alors que ce n'est pas une mesure : à corriger au port.
- Non mesurés à part (R1 à R4) : contraste outillé, flou R6, mots du premier écran. Ces points relèvent de la passe 2 du critique.

## Limites
- Les autres retouches du critique (pictos de mesure, « montée 0,1 min » de m8, position des cartes) ne sont pas traitées : la VOIE disait « rien d'autre ».
- Le pH reste à 5,2–5,5, la cible de l'app (z1 : 5,2–5,4), à aligner au port.
- À 390, la feuille ouverte en « hors cible » avec la raison prend environ 55 % de la hauteur.

Prédiction : « Là oui, je glisse et je vois tout de suite si je suis dans la cible ; m2 avec le curseur. »

DÉCISION À PRENDRE : aucune (le brasseur choisit la variante sur page-v2).
CONNAISSANCE : la recette n'a aucune tolérance pour la densité initiale ni pour le volume. Le curseur n'y montre qu'un repère et un écart en ambre. Pour avoir une bande, il faut une tolérance sourcée.
LEÇON PROPOSÉE : aucune


## Passe 2b (10.11, après critique/SYNTHESE-v2.md) : trois corrections, rien d'autre
Fichiers touchés : `voies/v2/etat.html`, `voies/v2/capturer.mjs`, `voies/v2/page.cjs`, `voies/v2/tests.txt`, `voies/v2/captures/*` (60), `page-v2/index.html`, `page-v2/img/`.

1. **Un toucher sur le pouce pose la valeur où il est.** Un toucher sans glisser n'émet pas d'`input`. Un `pointerup` (ou Entrée et Espace au clavier) pose alors `r.value`, soit la cible 67,0 pile.
   - Le pouce natif passe de 44 à 22 px de large, comme le pouce dessiné. Sa position tombe ainsi sous le trait, aux bouts de l'échelle aussi. La zone garde 44 px de haut.
   - Le pied de la feuille dit « un toucher sur le pouce pose 67,0 », puis s'efface au premier geste.
   - Avant le geste, rien ne change : pouce en pointillé, « ? », Enregistrer grisé.
   - Geste joué dans Chrome tactile (`touchscreen.tap` au centre du pouce), sur les 10 : `67,0 / dans / Enregistrer actif`.
   - Le même geste sur une copie sans le correctif (`os.tmpdir()/etat-sans-pointerup.html`) donne `? / Enregistrer grisé`. Le contrôle échoue donc bien sur la version rejetée (L13).
   - Capture : `captures/m2-palier-pouce-390.png`.
2. **Après le relevé, la valeur revient comme dans z1.** Elle est dans l'horloge (« relevé 66,4 ») et dans la ligne de Relevés du jour (« maische 66,4 °C ✓ · à l'instant »). La coche s'ajoute à la valeur, elle ne la remplace pas.
   - m2 : sa carte est Relevés du jour, et sa ligne rend « 66,4 °C » avec « à l'instant · ✓ dans la cible ».
   - Les invitations propres (m4, m6, m8, m10) gardent leur coche, sans le chiffre.
   - Contrôle sur les 10 : `66,4 lu 2 fois (horloge true, Relevés du jour true)`.
3. **m8 : plus de « montée 0,1 min ».** L'en-tête du Suivi thermique n'affiche plus de durée. Contrôle : `m8 : montée 0,1` absent.

### Sorties décisives
- `node voies/v2/capturer.mjs` donne `CAPTURES OK` :
  - 10 fois « toucher le pouce : 67,0 / dans / false » ;
  - 10 fois « 66,4 lu 2 fois » ;
  - piste (64,1 hors), pas (64,3), raison et champ décimal toujours verts.
- `verifier-page.mjs … --page-lot` donne `PAGE OK (60 images chargées, lisible à 390 et 1280 px, sans erreur)` (dans `tests.txt`).
- La page ajoute une rangée « Le geste, joué au doigt » : ouvert, toucher le pouce, piste et pas, après.

### Captures rouvertes
Les « après » des 10 (deux planches), m2 curseur, pouce et geste, m8 repos et après, et `page-haut`. Les planches sont dans `os.tmpdir()/vm2-planches/p2b-*.png`.

Non rouvertes, car seule la note du pied y change : les états repos, curseur et hors, ainsi que cave et 1280.

### Hors périmètre, laissés (VOIE : « rien d'autre »)
Les non-bloquants 3 à 7 de SYNTHESE-v2 :
- panneau à 1280 ;
- pas de 32 px ;
- renvoi ;
- reflet bleu de « Pourquoi maintenant » ;
- cible pH à 5,2–5,5.

Les défauts propres à chaque variante restent aussi.

Prédiction (2b) : « 67 pile, je touche, c'est posé ; et mon relevé est là où il était dans z1. »

CONNAISSANCE (2b) : « montée 0,1 min » vient de l'app elle-même : on le voit sur sa capture (ref-capture.jpg, Suivi thermique), et m8 n'a fait que l'hériter. C'est un défaut du port actuel, à verser à BUGS.md : une durée de montée sous 1 min ne s'affiche pas.
LEÇON PROPOSÉE (2b) : aucune.
