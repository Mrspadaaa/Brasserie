OK — parcours-complet.mjs rejoue le parcours repris (D105) : 31 gestes à 390 (doigt) et à 1280 (souris), PARCOURS OK

## Fichiers écrits
- `prototypes/houblons-v4/parcours/outils/parcours-complet.mjs` (mis à jour pour Ma bière et Suggérer repris ; rien dans les écrans ni le socle).
- `work/missions/2026-10-23-maquette-parcours/voies/p5-parcours/captures/` : 76 images (31 étapes × 390 et 1280, plus 7 « -bas » × 2). Les anciennes ont été effacées.
- Ce fichier. Les essais de diagnostic sont dans le dossier temporaire de la session.

## Sortie décisive de chaque critère (dernier rejeu, depuis la racine, construction à jour de 9 pages)
- G1 `PARCOURS OK (31 gestes à 390, 31 à 1280, recalcul médian 0,9 ms)`
- G2 `PONTS OK (19 gestes, recalcul médian 1,1 ms)`
- G3 `APP INTACTE OK`
- G4 `EXISTENT OK 2`
- G5 `NOTE OK` (rejoué après écriture de ce fichier)
- G6 `CHOIX OK (5 écran(s) conforme(s) à son choix ; 3 ouvert(s) : dryhopper, substituer, levure)`

Essais : après la reprise des écrans, 3 corrections de mon script (nouvelle barre floral, visée posée d'avance sur l'onglet, `.pq-hachure` pour l'inconnu), chacune vue à l'échec puis corrigée.

## Le parcours joué (dans l'ordre, sans recharger)
1. Étape Houblons (route ma-biere) : IBU 60, alerte « Résineux trop marqué », α de Nugget, appui long sur Nugget → fiche → fermer.
2. Onglet Ma bière (`pont-biere`, route biere) : décompte « 7 au style · 4 non situées » au moteur ; on bannit le floral (le pont « + floral » disparaît, « bannir floral » apparaît), puis on le revise en « + » (le pont revient).
3. « + floral » → Suggérer (q2b) : les voies du moteur (`proposer`) toutes présentes, groupe « même effet », deux proposés au départ (Motueka et Idaho 7, « Comparer (2) ») ; « + » sur Target puis sur Cascade (« Comparer (3) », « Comparer (4) », le « + » devient ✓) → « Comparer (4) ».
4. Comparer : 4 colonnes et 4 séries au radar ; Target retenu (dock « Placer Target »), puis Idaho 7 retenu (« Placer Idaho 7 ») → Placer.
5. Dryhopper : glisser à 60′ (IBU 161, « trop amer »), au dry hop actif (IBU 60 « ? », floral ~+22), 2 j → « Puis la levure ».
6. Levure : Pomona (valeurs simulées qui bougent), retour à US-05 (valeurs identiques au départ) → « Ajouter à ma bière ».
7. Étape Houblons recalculée : Idaho 7 inscrit (80 g, dry hop actif 2 j, US-05), IBU 60 (59,7 → 59,7), floral 1,6 → 23,7, rond « avant » du floral et point « prévu » déplacé (0,02 → 0,34 de la piste).
8. « Je n'ai pas Nugget » → Substituer : Nugget épinglé, remplaçants égaux au moteur ; on choisit le deuxième (Galaxy) → Remplacer : « à la place de Nugget », IBU 59,73 → 60,13 (à 0,5 près).
9. « ‹ » qui abandonne : « + floral » → Suggérer → Comparer → Placer → Dryhopper → glisser → « ‹ » ×3 : brouillon nul, recette identique, retour à l'étape.
10. « Recommencer » : recette, liste de comparaison (`aComparer`) et IBU du départ ; plus de ligne Idaho 7 ; plus de repère de changement.

Après chaque geste : aucune erreur de page ni de console, aucun défilement horizontal, `data-ecran` attendu, état attendu, et l'effet lu à l'écran (IBU affiché = moteur, point floral déplacé, ligne Idaho 7 et levure lisibles, « ? » jamais 0).

Témoins (L13) : (1) copie de la construction où « Recommencer » garde la liste de comparaison → `geste 31 « recommencer » : Recommencer garde la liste de comparaison : …` ; (2) copie où « Recommencer » garde la recette (essai précédent) → échec ; (3) liseré de focus rajouté sur `main` → échec au geste 1.

## Temps de recalcul (Chrome, deux formats)
- Ma bière relue par le moteur, cache manqué (`lireBiere`) : médiane 0,9 ms sur les deux formats (concorde avec `--ponts` 1,1 ms et cout-calcul-moteur).
- Gestes qui recalculent : 14 par format. À 390 : médiane 4,1 à 5,5 ms selon le passage, au plus 25,2 ms (Suggérer à l'ouverture, 9 candidats et les voies groupées). À 1280 : médiane 3,8 ms, au plus 22,9 ms (Dryhopper à l'ouverture : la frise de 28 crans).
- « Ajouter à ma bière » et « Remplacer » ne coûtent que 0,1 à 0,2 ms : l'état est déjà en cache.

## Captures (ouvertes en image, une ligne par étape ; 390 puis 1280)
Chaque étape existe en `<nn>-<étape>-390.png` et `-1280.png`. Les « -bas » sont la même page défilée en bas (étape Houblons et onglet Ma bière défilent dans leur cadre).

| nº | étape | 390 | 1280 |
|---|---|---|---|
| 01 | ma-biere (+ -bas) | « Houblons 3/7 · 16D hypothèse », IBU 60 · OG 1,066 · EBC 70, frise verticale : Nugget 46 g à 60′ (« résine 2/4 », 60 IBU), puis 0′, whirlpool, SafAle US-05, fermentation ; en bas Cascade et Citra cryo à 10 g/10′, « Résineux trop marqué », « + floral › », et 12 familles en deux colonnes | même page dans le cadre de 768 px ; le haut de la frise laisse un grand vide entre 60′ et 0′ (voir défaut 2) |
| 02 | fiche-nugget | feuille du bas : α 13 %, radar, arômes (tropicaux, floral, herbacé, résineux…), « ma bière 46 g · 60′ · 60 IBU », « j'aime / pas pour moi » ; l'étape floutée dessous | feuille sur toute la largeur de l'écran, contenu serré dans les 320 px de gauche (défaut 1) |
| 03 | fiche-fermee | l'étape intacte (retour du téléphone) | l'étape intacte (bouton « Retour » de la fiche) |
| 04 | biere (+ -bas) | onglet « Ma bière · Suggestions · Comparer », bandeau IBU, « Résineux trop marqué · surtout Nugget, 46 g à 60′ », « 7 au style · 4 non situées », 11 barres (Noyau, Pépins, Baies, Melon hachurés), Résineux ouvert « bannir · − · + » avec « × 2,8 » ; en bas « + floral », « − résineux », « + … » | même onglet à 768 px ; deux « ‹ » l'un sous l'autre (défaut 3) |
| 05 | biere-floral-bannir (+ -bas) | Floral ouvert, « bannir » jaune, « bannie » ; en bas « bannir floral » remplace « + floral » | idem |
| 06 | biere-floral-plus (+ -bas) | Floral ouvert, « + » jaune, « plus » ; « + floral » est revenu | idem |
| 07 | suggerer | « Quel houblon ajouter à ma bière ? », onglets (Suggestions actif, « Comparer (2) »), cartes « Moins résineux : Aucune voie houblon / Hors houblon › » et « Plus floral : Atteint Idaho 7 », pistes l5b, groupe « = même effet sur tes objectifs 10 g 10′ », Golding, Motueka ✓, Aurum, East Kent Goldings, Columbus, Motueka + Citra cryo | même écran, pistes plus larges |
| 08 | suggerer-plus-target | défilé en bas : Citra cryo, Nelson Sauvin, Galaxy, Hallertau Blanc, « Dry hop 4 g/L après 3 j » : Idaho 7 ✓ « ~+1,3 », Target ✓ « ~+0,9 », « Comparer (3) » | idem |
| 09 | suggerer-plus-cascade | Cascade ✓ à son tour, « Comparer (4) » | idem |
| 10 | comparer | « Motueka, Idaho 7, Target ou Cascade pour ma stout ? », « ★ Idaho 7 devant Target ~+0,4 cran », radar à 4 séries, 4 colonnes, Idaho 7 encadré, « Placer Idaho 7 » | radar de 420 px, colonnes plus larges |
| 11 | comparer-target-retenu | Target encadré, « Placer Target » | idem |
| 12 | comparer-idaho-retenu | Idaho 7 encadré de nouveau, « Placer Idaho 7 » | idem |
| 13 | dryhopper | « Quand ajouter Idaho 7 ? », actif · 3 j, floral ~+22, « mesuré linalol 38 µg/L (McCabe 2023) », « Puis la levure Pomona ~+13 », frise en bas | frise en bas du cadre |
| 14 | dryhopper-60 | rail à 60′ : floral ~+2, Amertume 161 « trop amer », « jamais mesuré à ce moment », jours grisés | idem |
| 15 | dryhopper-dry-hop-actif | retour à actif · 3 j : floral ~+22, Amertume « 60 ? » hachuré | idem |
| 16 | dryhopper-2-jours | « 2 j » noir, mêmes valeurs qu'à 3 j | idem |
| 17 | levure | « Et avec quelle levure ? », US-05 réf. cochée, floral « = », agrumes « = », tableau Nugget / +Idaho 7 / +US-05 (floral ~24) | même écran |
| 18 | levure-pomona | Pomona cochée : agrumes ~+13, floral ~+5, « confiance faible », conversion ~50 % | idem |
| 19 | levure-retour-us05 | retour à US-05 : la simulation redevient celle de 17 | idem |
| 20 | ma-biere-recalculee (+ -bas) | l'étape : Nugget 60′ et, sous « fermentation », Idaho 7 « nouveau », dry hop 2 j, 80 g, « ? IBU » ; en bas les barres : points « prévu » déplacés (floral, baies, agrumes, tropicaux, noyau), petit point gris « avant » | idem |
| 21 | substituer | « Lequel à la place de Nugget ? » : Nugget épinglé, Nelson Sauvin coché par défaut (62,5 g, « autres 83 % »), Galaxy, Sabro, « Remplacer » | tableau de 6 colonnes visibles |
| 22 | substituer-choix | Galaxy choisi (35 g), dock « 35 g de Galaxy » | idem |
| 23 | ma-biere-remplacee (+ -bas) | « à la place de Nugget » : Galaxy 35 g à 60′, IBU 60 ; Idaho 7 toujours là | idem |
| 24 | abandon-suggerer | Suggérer rouvert, « Plus floral : Atteint Motueka », « Comparer (4) » (la liste est restée) | idem |
| 25 | abandon-comparer | Comparer rouvert à 4 colonnes, Motueka devant Idaho 7 « ~−0,3 cran » | idem |
| 26 | abandon-dryhopper | « Quand ajouter Motueka ? » : Motueka placé, floral ~+5 | idem |
| 27 | abandon-glisser | rail à 20′, valeurs « ≈ » interpolées, « trop amer » | idem |
| 28 | abandon-fermer | « ‹ » : retour à Comparer, brouillon abandonné | idem |
| 29 | abandon-fermer-suggerer | « ‹ » : retour à Suggérer | idem |
| 30 | abandon-ma-biere | « ‹ » : l'étape, recette inchangée (Galaxy, Idaho 7 ; pas de Motueka) | idem |
| 31 | recommencer (+ -bas) | recette du départ : Nugget 46 g, aucun repère ; liste de comparaison vide | idem |

## Défauts trouvés (écran, geste, attendu, obtenu, capture)
Trouvés puis corrigés pendant la voie par le pilote, gardés par le script : liseré de focus paille sur `main` au chargement ; « ‹ » inerte sur Ma bière racine (390 : absent ; 1280 : l'était).

Ouverts (écran concerné, à rapporter) :
1. Fiche à 1280, appui long ou survol sur Nugget (`02-fiche-nugget-1280.png`) : attendu une feuille dans le cadre de 768 px ; obtenu 1280 px de large, contenu serré dans les 320 px de gauche, « × » avec anneau de focus. Vient du `Sheet` de l'app posé sans largeur maximale (socle ou fiche).
2. Étape Houblons, frise (`01-ma-biere-390.png`, `20-ma-biere-recalculee-390.png`, `31-recommencer-1280.png`) : l'ébullition est à l'échelle du temps (0,6 px par minute) ; entre le dernier ajout à 60′ et « 0′ » il reste un grand vide (300 px à 390, tout le milieu à 1280) alors qu'il n'y a rien à y poser. Écart annoncé dans la NOTE de p1 ; à voir si le brasseur le trouve utile.
3. Onglet Ma bière à 1280 (`04-biere-1280.png`, `05-…`, `06-…`) : deux « ‹ » (celui de l'en-tête de page et celui des onglets) l'un sous l'autre. À 390, un seul.
4. Onglet Ma bière, visée du floral (`05-…`, `06-…`) : bannir ou viser le floral ne change ni Suggérer (« Plus floral » s'y affiche toujours, voir la NOTE : « La visée n'est pas encore lue par Suggérer ») ni les barres. Le script prouve le bascule du pont « + floral », pas un effet sur Suggérer.
5. Suggérer après ajout (`24-abandon-suggerer-*.png`) : attendu que les houblons déjà dans la recette (Idaho 7 en dry hop, Galaxy à 60′) soient signalés ; obtenu Idaho 7 proposé en « Dry hop ~+1,3 » comme avant, sans « déjà dans ta bière ». Le premier de « Atteint » est devenu Motueka : la visée « +1 cran » est comptée depuis la bière actuelle, pas depuis le départ.
6. Dryhopper, « Placer » pour un houblon déjà dans la recette (`26-abandon-dryhopper-*.png`) : on peut ajouter un second ajout du même houblon sans avertissement. À arbitrer par le brasseur.
7. Dryhopper, boutons de jours « 1 j / 2 j / 3 j / 7 j » à 390 : 40 × 20 px mesurés (`16-dryhopper-2-jours-390.png`). Trop petit sous le doigt (D46).
8. Étape après Idaho 7 (`20-ma-biere-recalculee-bas-390.png`) : le résineux monte de ~+14 sur une stout déjà « Résineux trop marqué ». Le point « prévu » du résineux reste hors style, mais l'alerte du haut ne dit pas que l'ajout aggrave. Cohérent avec Suggérer (« Aucune voie houblon »).
9. Substituer (`21-substituer-390.png`) : le remplaçant coché par défaut est Nelson Sauvin, dont la ligne « perd » liste six familles, « gagne » rien, « autres 83 % » (L14, descripteurs hors familles). Le premier choix du moteur paraît le pire à l'écran.
10. Écart à la carte, étape « l'IBU et le floral ont bougé dans le bon sens » : le floral monte (1,6 → 23,7). L'IBU ne bouge pas (59,7 → 59,7) : un dry hop n'a pas d'IBU modélisé à froid, et l'écran écrit « ? IBU », pas 0. Le script vérifie « l'IBU n'a pas monté », pas « a baissé ». À confirmer par le pilote.
11. Survol ignoré au départ (mineur, `fiche/gestes.ts`) : `partage.fermeeA` vaut 0 au départ, donc le survol d'un nom est ignoré pendant les 400 premières ms de vie de la page. Sans effet pour une personne ; mon script attend 1,2 s.

## Doutes et limites
- Le script ne réutilise pas `jouer-parcours.mjs` par import : ce fichier joue à l'import, sans rien exporter, et il n'est pas dans ma voie. Ses assistants (cible visible, retour, débordement) sont repris ici.
- Pour que « retenir Idaho 7 » (Comparer) et « choisir un remplaçant » (Substituer) soient de vrais gestes, le script retient d'abord Target, et choisit le deuxième remplaçant (Galaxy) : Idaho 7 et Nelson Sauvin sont déjà retenus à l'arrivée.
- Trois pauses réalistes dans le script : 350 ms après un glissé au doigt (Chrome n'émet pas de « click » pour un toucher posé moins de ~0,2 s après un glissé : vérifié en isolé), 1,2 s de vie de la page avant le premier survol, 1 s de survol.
- La visée de Suggérer vient de la dégustation, pas de l'onglet Ma bière (défaut 4) : le script ne peut donc pas jouer « bannir un objectif → Suggérer le montre ».
- Les captures ont toutes été ouvertes sur la construction où elles ont été prises ; les 76 fichiers sont ceux du dernier passage vert.
- Chrome headless émule un téléphone (390 px, tactile) : ce n'est pas un vrai téléphone. Défilement inertiel, clavier et barre d'adresse non joués.
- Durée : environ 2 minutes, construction comprise.

DÉCISION À PRENDRE : sortir les assistants de `jouer-parcours.mjs` dans un module partagé (`outils/jeu-commun.mjs`) pour que `parcours-complet.mjs` et `jouer-parcours.mjs` cessent de dupliquer le pilotage. Options : (a) le faire après le critique, (b) laisser les deux. Recommandation : (a).

CONNAISSANCE : stout 16D, parcours de la carte rejoué sur les écrans repris (23.10, fixture) : Idaho 7 à 80 g en dry hop actif 2 j fait passer le floral de ~1,6 à ~23,7, le résineux de ~+14, laisse l'IBU à 59,7 (arôme à froid, IBU « ? »). Remplacer Nugget par Galaxy (35 g) garde l'IBU à 0,4 près (59,73 → 60,13).

LEÇON PROPOSÉE : un script de parcours qui prend ses sélecteurs dans les écrans (barre « apres », `[data-voie]`) casse en silence quand un écran est repris sur une autre base (D105) : lire d'abord les `jeu.mjs` et NOTE.md de chaque écran repris, et mesurer ce qui se voit (position du point, texte) plutôt qu'un détail de dessin. Aussi : un script qui ne joue que des gestes « par défaut » (Idaho 7 déjà retenu, premier remplaçant déjà coché) ne prouve rien ; choisir d'abord une autre valeur, puis celle voulue. Enfin, un `\b` écrit par un outil d'édition dans mon script est redevenu un caractère de contrôle 0x08 (M10) : `systeme.mjs cablage` ne couvre que les scripts de contrôle, pas `outils/*.mjs` du parcours.
