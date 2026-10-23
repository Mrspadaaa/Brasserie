OK — parcours-complet.mjs joue 28 gestes à 390 (doigt) et à 1280 (souris) : PARCOURS OK, 60 captures regardées

## Fichiers écrits
- `prototypes/houblons-v4/parcours/outils/parcours-complet.mjs` (le seul fichier hors de ma voie ; rien dans les écrans ni le socle).
- `work/missions/2026-10-23-maquette-parcours/voies/p5-parcours/captures/` : 60 images (28 étapes × 390 et 1280, plus 4 « -bas »).
- Ce fichier. Les essais de diagnostic sont dans le dossier temporaire de la session, pas dans le dépôt.

## Sortie décisive de chaque critère (dernier rejeu, depuis la racine, sur une construction neuve)
- G1 `PARCOURS OK (28 gestes à 390, 28 à 1280, recalcul médian 1,0 ms)`
- G2 `PONTS OK (19 gestes, recalcul médian 1,0 ms)`
- G3 `APP INTACTE OK`
- G4 `EXISTENT OK 2`
- G5 : voir la dernière section (NOTE OK à la fin).

Essais utilisés : plusieurs corrections de mon script (voir « Doutes ») ; aucun critère n'a dépassé 3 essais sur un même défaut de fond.

## Ce que fait le script
- Construit dans la sortie par défaut (`construire.mjs`), puis part de `index.html`, une seule session par format, sans recharger.
- 390 × 844 : événements tactiles réels (`touchscreen`), appui long de 650 ms, glisser au doigt. 1280 × 800 : souris, et survol de 1 s sur le nom pour la fiche.
- Avant chaque toucher : l'élément est amené à l'écran et le script vérifie, avec `elementFromPoint`, que rien ne le recouvre au centre (sinon échec : le doigt toucherait autre chose).
- Après chaque geste : aucune erreur de page ni de console, aucun défilement horizontal, `data-ecran` attendu, état attendu dans `window.__parcours`, et ce qui change se lit à l'écran :
  - IBU rendu (`data-valeur` et texte) = IBU du moteur, après chaque retour sur Ma bière ;
  - largeur de la barre floral rendue (0,01 → 0,22 de la piste) et rond « avant » présent ;
  - ligne Idaho 7 avec son moment (« actif 2 j »), ligne levure « US-05 », repère « à la place de Nugget » ;
  - IBU de l'ajout et IBU total au dry hop : « ? » reste « ? » (`data-inconnu`), jamais 0 ; une famille inconnue du moteur reste hachurée.
- Le recalcul est chronométré par geste (somme des `lireBiere` à cache manqué).
- Témoins (L13) : (1) sur une copie de la construction où « Recommencer » garde la recette, le script échoue : `geste 28 « recommencer » : Recommencer n'a pas rendu la recette du départ` ; (2) avec un liseré de focus rajouté sur `main`, il échoue : `un liseré de focus encadre la page au chargement (main, solid 2px …)`.

## Temps de recalcul (Chrome, deux formats)
- Ma bière relue par le moteur, cache manqué (`lireBiere`) : médiane 1,0 ms (concorde avec `--ponts` : 1,0 ms et avec cout-calcul-moteur).
- Gestes qui recalculent : 14 par format. À 390 : médiane 4,2 ms, au plus 23,7 ms (ouvrir Dryhopper 21,8 ; ouvrir Suggérer 18,3 ; « Placer » à nouveau 23,7). À 1280 : médiane 3,9 ms, au plus 22,6 ms.
- Les retours sur Ma bière (« Ajouter à ma bière », « Remplacer ») ne coûtent que 0,1 à 0,3 ms : le calcul est déjà en cache (même état que celui du brouillon).

## Captures (ouvertes en image, une ligne par étape ; « 390 » puis « 1280 »)
| nº | étape | 390 | 1280 |
|---|---|---|---|
| 01 | ma-biere | départ : IBU 60, OG 1,066, « Trop résineuse · dégustée 18.10 », 12 familles (Noyau, Pépins, Baies, Melon hachurés), Nugget 46 g à 60′, levure US-05 | même page dans le cadre de 768 px, sans liseré ni « ‹ » |
| 02 | fiche-nugget | feuille du bas : α 13 %, radar, arômes, « ma bière 46 g · 60′ · 60 IBU », « j'aime / pas pour moi » ; Ma bière floutée dessous | feuille sur toute la largeur de l'écran, contenu serré à gauche (voir défaut 1) |
| 03 | fiche-fermee | Ma bière intacte (retour du téléphone) | Ma bière intacte (bouton « Retour » de la fiche) |
| 04 | suggerer | « Plus floral : atteinte par Idaho 7 », « Moins résineux : aucun houblon ne le baisse », 9 voies, 3 cochées (Idaho 7, Target, Cascade), « Comparer les 3 » | même écran, pistes plus larges |
| 05 | suggerer-decocher | les trois décochés, « Comparer les 0 » grisé | idem |
| 06 | suggerer-trois-coches | les trois recochés, « Comparer les 3 » actif | idem |
| 07 | comparer | « Idaho 7, Target ou Cascade pour ma stout ? », ligne « ★ Idaho 7 devant Target ~+0,4 cran », radar à 3 séries, colonne Idaho 7 encadrée (retenu par défaut), « Placer Idaho 7 » | même écran, radar de 420 px |
| 08 | comparer-target-retenu | Target encadré, « Placer Target » | idem |
| 09 | comparer-idaho-retenu | Idaho 7 retenu de nouveau, dock « Placer Idaho 7 » | idem |
| 10 | dryhopper | « Quand ajouter Idaho 7 ? », actif · 3 j, floral ~+22, « mesuré linalol 38 µg/L (McCabe 2023) », « Puis la levure · Pomona ~+13 » | même écran, frise en bas du cadre |
| 11 | dryhopper-60 | rail à 60′ : floral ~+2, résineux ~+2, Amertume 161 « trop amer », « jamais mesuré à ce moment », jours grisés | idem |
| 12 | dryhopper-dry-hop-actif | retour à actif · 3 j : floral ~+22, Amertume 60 « ? » hachuré | idem |
| 13 | dryhopper-2-jours | « 2 j » noir, mêmes valeurs qu'à 3 j | idem |
| 14 | levure | « Et avec quelle levure ? », US-05 réf. cochée, floral « = », agrumes « = », tableau Nugget / +Idaho 7 / +US-05 (floral ~24) | même écran |
| 15 | levure-pomona | Pomona cochée : agrumes ~+13, floral ~+5, « confiance faible », conversion ~50 % | idem |
| 16 | levure-retour-us05 | retour à US-05 : la simulation redevient celle de 14 | idem |
| 17 | ma-biere-recalculee (+ -bas) | IBU 60 inchangé ; floral ~+22, tropicaux ~+16, résineux ~+14 (orange) ; ligne Idaho 7 « nouveau », « actif 2 j », 80 g, « ? IBU » ; en bas, levure US-05 | idem |
| 18 | substituer | « Lequel à la place de Nugget ? » : Nugget épinglé, Nelson Sauvin coché par défaut (62,5 g), Galaxy, Sabro…, « Remplacer » | tableau à 6 colonnes visibles |
| 19 | substituer-choix | Galaxy choisi (35 g), dock « 35 g de Galaxy » | idem |
| 20 | ma-biere-remplacee (+ -bas) | Galaxy 35 g « à la place de Nugget », IBU 60 ; floral ~−1, tropicaux ~+1, noyau ~+1, résineux ~−1 ; Idaho 7 toujours là | idem |
| 21 | abandon-suggerer | Suggérer rouvert : « Plus floral : pas atteinte », Idaho 7 encore premier (~+0,6) | idem |
| 22 | abandon-comparer | Comparer rouvert (Idaho 7, Target, Cascade) | idem |
| 23 | abandon-dryhopper | « Placer Idaho 7 » : second ajout d'Idaho 7, floral ~+10 | idem |
| 24 | abandon-glisser | rail à 20′, valeurs « ≈ » interpolées, « contre ★ actif · 1 j : floral ≈−5 », « trop amer » | idem |
| 25 | abandon-fermer | « ‹ » : retour à Comparer, brouillon abandonné | idem |
| 26 | abandon-fermer-suggerer | « ‹ » : retour à Suggérer | idem |
| 27 | abandon-ma-biere | « ‹ » : Ma bière, recette inchangée (Galaxy, Idaho 7, pas de second Idaho 7) | idem |
| 28 | recommencer | recette du départ : Nugget 46 g, floral minuscule, aucun repère | idem, sans « ‹ » |

## Défauts trouvés (écran, geste, attendu, obtenu, capture)
Trouvés puis corrigés par le pilote pendant la voie, et maintenant gardés par le script :
- Ma bière, au chargement, 390 et 1280 : attendu aucun liseré ; obtenu un contour paille de 2 px (focus de `main`). Corrigé dans `styles.css`, le script échoue s'il revient.
- Ma bière à 1280 : attendu aucun « ‹ » sur la page racine ; obtenu un « ‹ » qui ne mène nulle part. Corrigé de même, gardé.

Ouverts (pour le socle ou les voies concernées) :
1. Fiche à 1280, appui long ou survol sur Nugget (`02-fiche-nugget-1280.png`) : attendu une feuille dans le cadre de 768 px ; obtenu une feuille de 1280 px, contenu serré dans les 320 px de gauche, bouton « × » avec anneau de focus. Vient du `Sheet` de l'app posé sans largeur maximale (socle ou p1).
2. Dryhopper, boutons « 1 j / 2 j / 3 j / 7 j » à 390 (`13-dryhopper-2-jours-390.png`) : 40 × 20 px mesurés. Sous le doigt (D46), c'est trop petit : j'ai dû taper deux fois dans mon premier essai. Cause du second tap : voir « Doutes » (Chrome). La hauteur de 20 px reste un défaut de p4.
3. Suggérer rouvert après « Ajouter à ma bière » (`21-abandon-suggerer-*.png`) : attendu que les houblons déjà dans la recette soient signalés ; obtenu Idaho 7 (déjà là en dry hop) proposé en premier, coché, « ~+0,6 », sans « déjà dans ta bière ». Même chose pour Galaxy après « Remplacer ».
4. Même écran, `23-abandon-dryhopper-*.png` : « Placer Idaho 7 » crée un second ajout d'Idaho 7 (80 g de plus) sans avertir. Question de produit : le brasseur veut-il cumuler deux doses du même houblon ?
5. Suggérer après l'ajout (`21-…`) : « Plus floral : pas atteinte » alors que le floral vient de passer de ~1,6 à ~23,7 (≈ +1,3 cran). La visée « +1 cran » est comptée depuis la bière actuelle, pas depuis le départ. À arbitrer par le brasseur (sens de la visée).
6. Ma bière après Idaho 7 (`17-ma-biere-recalculee-390.png`) : le résineux monte de ~+14 (orange) sur une stout déjà « Trop résineuse ». L'écran le montre, sans l'alerte que le brasseur attend peut-être (« tu as aggravé le résineux »). Cohérent avec Suggérer (« aucun houblon ne le baisse »), mais l'alerte du haut dit toujours seulement « Trop résineuse · dégustée 18.10 ».
7. Substituer (`18-substituer-390.png`) : le remplaçant coché par défaut est Nelson Sauvin, dont la ligne « perd » liste six familles, « gagne » rien et « autres 83 % » (cas L14, descripteurs hors familles). Le premier choix du moteur paraît le pire à l'écran.
8. Écart à la carte, étape 6 : « l'IBU et le floral ont bougé dans le bon sens ». Le floral monte (1,6 → 23,7). L'IBU ne bouge pas (59,7 → 59,7) : un dry hop n'a pas d'IBU modélisé à froid, et l'écran écrit bien « ? IBU », pas 0. Le script vérifie donc « l'IBU n'a pas monté », pas « l'IBU a baissé ». À confirmer par le pilote.
9. Après « Remplacer » par Galaxy : IBU 59,73 → 60,13 (écart 0,40, dans les 0,5 demandés ; affiché « 60 » avant et après).

## Doutes et limites
- Le script ne réutilise pas `jouer-parcours.mjs` par import : ce fichier joue à l'import, sans rien exporter, et il n'est pas dans ma voie. Ses assistants (cible visible, retour, débordement) sont repris dans un fichier plus court. Ses attentes de `--ponts` sont refaites ici avec des vérifications à l'écran en plus.
- Pour que le geste « retenir Idaho 7 » existe, il faut d'abord retenir Target : Idaho 7 arrive déjà retenu (★). Même chose pour Substituer : le premier remplaçant est déjà coché, le script choisit le deuxième (Galaxy) pour que le choix change quelque chose.
- Trois pauses de script, toutes réalistes : 350 ms après un glissé au doigt (Chrome n'émet pas de « click » pour un toucher posé moins de ~0,2 s après un glissé : vérifié en isolé, le tap à 50 ms n'ouvre rien, à 200 ms oui) ; 1,2 s de vie de la page avant le premier survol (voir la puce suivante) ; 1 s de survol.
- Survol ignoré au départ (mineur, `fiche/gestes.ts`) : `partage.fermeeA` vaut 0 au départ, donc le survol d'un nom est ignoré pendant les 400 premières ms de vie de la page. Sans effet pour une personne, mais un script rapide le rate.
- Les captures ont toutes été ouvertes sur la construction où elles ont été prises. Le pilote a modifié `styles.css` pendant la voie (liseré, « ‹ ») : après ce changement, j'ai rouvert 01 (390 et 1280) et 02 (1280), seules pages touchées par ces deux règles ; les autres captures n'en dépendent pas. Les 60 fichiers du dossier sont ceux du dernier passage vert.
- Chrome headless émule le téléphone (390 px, tactile) : ce n'est pas un vrai téléphone. Le défilement inertiel, le clavier et la barre d'adresse ne sont pas joués.
- Le parcours dure environ 21 s sans la construction (mesuré : deux formats, pauses et captures comprises).

DÉCISION À PRENDRE : sortir les assistants de `jouer-parcours.mjs` dans un module partagé (`outils/jeu-commun.mjs`) pour que `parcours-complet.mjs` et `jouer-parcours.mjs` cessent de dupliquer le pilotage. Options : (a) le faire en p7 ou après, (b) laisser les deux. Recommandation : (a), après le critique, car aujourd'hui les deux scripts passent et le gain est surtout de maintenance.

CONNAISSANCE : la stout 16D, parcours de la carte, rend ces nombres dans la maquette (23.10, fixture) : Idaho 7 à 80 g en dry hop actif 2 j fait passer le floral de ~1,6 à ~23,7 (+22), le résineux de +14, laisse l'IBU à 59,7 (arôme à froid, IBU « ? » : non modélisé). Remplacer Nugget par Galaxy (35 g) garde l'IBU à 0,4 près (59,73 → 60,13).

LEÇON PROPOSÉE : un script qui joue un parcours en doigt réel doit attendre ~0,3 s après un glissé avant le toucher suivant : Chrome n'émet pas de « click » juste après un glissé, ce qui ressemble à un bouton cassé. Et un script qui ne joue que des gestes « par défaut » (Idaho 7 déjà retenu, premier remplaçant déjà coché) ne prouve rien : choisir d'abord une autre valeur, puis celle voulue. Aussi, un `\b` écrit par un outil dans mon script est redevenu un caractère de contrôle 0x08 (M10) ; `systeme.mjs cablage` ne couvre que les scripts de contrôle : y ajouter `outils/*.mjs` du parcours.

## G5 (rapport)
Les mots exigés (390, 1280, ma-biere, suggerer, comparer, dryhopper, levure, substituer, recalcul) sont tous présents plus haut.
