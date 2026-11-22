OK — 6 problèmes, 2 bloquants (trois bloquants du jeu 5 tiennent en ligne : le cache rend la même dépense que la lecture neuve, le payé est rouge « 163,85 / 14,60 », « Total brut » et rabais total ne sont plus des lignes retirées ; BAUHAUS reste faux : 8 lignes au nom d'une voisine, et 16 outils « Matériel de brassage » avec icône de stock)

Version : 0a43b8d3 (`claude/refonte-houblons-v4`), bundle servi `index-FenGKkc0.js`, aiTask redéployé, https://brasserie-l-affinee.web.app, compte connecté, 10.11.
Script `critique/en-ligne/jouer7.mjs` (dérivé de `jouer6.mjs` : `--ordre=inverse` touche les pastilles de bas en haut). Passages : i) Sun Store 1 + 2 par
« Documents », copies de 8 octets de plus (lecture neuve, 25 s), 390 cave, gestes dans l'ordre retirées › total › payé ; j) mêmes copies, 1280 clair, cache
(3 s), ordre inverse payé › total › retirées ; k) BAUHAUS 390 cave : échec de mon script (voir « Correction du jeu 5 ») ; l) BAUHAUS 390 cave, vraie pièce,
lecture neuve (32 s). Lectures Gemini lancées : 2 (i, l) ; j du cache ; k sans appel serveur. 53 captures dans `critique/en-ligne-6/`, 14 planches
(`planches/p01` à `p14`, `en-ligne/planches4.mjs`) ; ouvertes : p02 à p14 (p01 : Finances, entrée et l'erreur de k, mêmes états que le jeu 5).
Sorties : `en-ligne-6/sortie-*.txt`. « Confirmer » jamais touché ; × › Abandonner à chaque fois (`preuveEncore:false`). Aucune erreur de page.

## Correction du jeu 5
Le « Le justificatif ne peut pas être lu » du jeu 5 (passage g, compté dans le bloquant 4) et du passage k d'aujourd'hui est un défaut de MON script, pas de
l'app : `--dossier` pointait sur le dossier des copies Sun Store, où `bauhaus-tache.jpg` n'existe pas ; `uploadFile` passe un fichier illisible, le
`FileReader` échoue localement, aucun appel aiTask (journal `REPONSE` vide pour k). La voie p3 l'avait situé au bon endroit. Le bloquant 4 du jeu 5 se
réduit donc au décalage des lignes, jugé ci-dessous.

## Les quatre bloquants du jeu 5, rejoués

| jeu 5 | vu au jeu 6 | verdict |
|---|---|---|
| 1 · rejeu du cache vide la dépense | j (1280 clair, 3 s) : SUN STORE, « 14,60 » + « lu ~~163,85~~ », 2 lignes vives, 5 barrées, mêmes rangées et mêmes montants que i ; « Fournisseur / Ligne sans libellé / Brassage » disparus | **tient** |
| 2 · « 348,50 CHF » retirés | i, j : « 5 lignes lues puis retirées 199,25 » : Vaxigrip 26,68, Rabais −0,68, Comirnaty 75,15, Rabais −1,90, H21 100,00 ; plus de « Total brut CHF » ni de « Rabais −2,58 » | **mieux, pas juste** (problème 3 : H21 100,00 pour 50,00) |
| 3 · « Payé = imprimé 14,60 » vert | i, j au repos : « ! Payé · TWINT ≠ imprimé 163,85 / 14,60 +149,25 · Le terminal affiche 163,85, plus que le total › Comparer à la photo » rouge ; après « Remettre 163,85 » : « ✓ Payé = imprimé · TWINT 163,85 » | **tient** |
| 4 · BAUHAUS décalé | l : 28 lignes, « Somme ≠ imprimé 268,70 / 352,05 −83,35 › Comparer à la photo », Payé vert 352,05, 0 mot brut ; mais 8 lignes portent le nom d'une voisine (problème 1) et 16 lignes vont au stock (problème 2) | **pas tenu** |

## Sa question : « combien et quels problèmes il y a ? »

1. **BLOQUANT — BAUHAUS : le nom d'une ligne, le montant d'une autre (l, 390 cave, lecture neuve).** `l-05`, `l-06` : « OPSHGE CHANTIER » à 8,50 sur « ~~CRATONS DE CHARPENTTER · 1 pièce × 3,10~~ » ; « GANTS DE TRAVAIL » à 7,90 sur « ~~OPSHGE CHANTIER · 8,50~~ » ; « METRE AUGAR ON » à 6,50 (7,90 au jeu 4) ; « CHANTLLES NO L5100 » à 11,50 (6,50) ; « SERRE-JOINT 150MM » à 2,45 (14,90) sur « ~~CRATTE-VTTRES~~ » ; « CRATTE-VTTRES » à 14,90 sur « ~~JEU DE CLES ALLEN~~ » ; « JEU DE CLES ALLEN » à 8,90 sur « ~~BROSSE RADIATEUR 35MM~~ » ; « ROBAN DE MASQUAGE SON » sur « ~~VIS PEITURE BOIS 4440 · 5,20~~ » ; « COLLE DE CONTACT 120G » sur « ~~APPRET ORTXESSEL · 18,90~~ ». « Qté × prix 28/28 justes » et « 26 corrigées » coiffent le tout. Le jeu 4 (cache) montrait 29 lignes, chacune à son montant. En brasseur : « un serre-joint à 2,45 et un gratte-vitres à 14,90 ? ». Valeur fausse sur 8 lignes. La règle p3 (ancres + ressemblance de nom) n'empêche pas ces paires en ligne : « CRATTE-VTTRES » / « JEU DE CLES ALLEN » ne se ressemblent pas. Attendu : une correction de nom ne change jamais le montant d'une ligne ; deux noms sans ressemblance ne sont pas une paire.
2. **BLOQUANT — BAUHAUS : 16 outils en « Matériel de brassage » avec l'icône de stock.** `l-03` à `l-06` : groupe « Matériel de brassage 16 · 109,70 » (BAC A, TURBINE, BNOSEE, Brosse LATTOB, BROSSE ANTEB, POLATRE ROULECO, LONE DE GADRAGE, DEGLUUCHER, ROULEUR, ETERE MULTICROSSÈ, METRE, OPSHGE, SERRE-JOINT, CRATTE-VTTRES, JEU DE CLES, BROSSE RADIATEUR), pictogramme paquet sur chacun, plus « Consommables 1 » (GANTS) ; « Rénovation » n'a plus que 5 lignes. Jeu 4 : « Rénovation 29 », 0 icône. SPEC 09.11 : « pas besoin d'avoir tout mes outils et autres, juste ce qui concerne vraiment le brassage, donc pas rénovation ». En brasseur : « mes brosses vont au stock ? ». Attendu : un ticket BAUHAUS reste hors stock quelle que soit la famille rendue par la lecture (règle s1, jeu 3 : « tient »).
3. **Sun Store : « 5 lignes retirées · 199,25 CHF » pour un ticket à 149,25.** H21 lue « 2 ? × 50,00 = 100,00 » quand le ticket imprime 50,00 pour les 2 (le jeu 4 l'affichait juste : « 2 × — 50,00 »). Après « Les garder » puis « Remettre » (ou l'inverse) : « Somme ≠ imprimé 213,85 / 163,85 +50,00 › Voir la ligne en trop », drapeau « 50,00 CHF en trop », « Payé = imprimé 163,85 » : l'écart est dit et désigne la ligne. Le premier chiffre vu reste faux de 50,00. Non bloquant (p3 : montant mal lu par la lecture, dit en rouge).
4. **Mots bruts (Sun Store, i et j)** : « NoVatTax - 0% — code tva : lectures divergentes (absent / 0) », « nature : lectures divergentes (service / other) ». BAUHAUS : 0 (jeu 5 : 3). Non bloquant.
5. **TVA recalculée « 0,37 / 4,15 · 3,78 » (ambre) après « Remettre 163,85 »** : 2,6 % appliqués aux 163,85 alors que 149,25 sont imprimés à 0,0 % ; la note « relire le pied de la pièce » le dit, mais le chiffre recalculé n'existe pas sur le ticket. Non bloquant.
6. **Pied « pas retrouvée » à 390** : « Vaxigrip … 26,68 · pas retrouvée · 1/5 · Tout valider » (i), « ROUBAN DE MASQUAGE SON 4,50 · 1/24 » (l), quatre lignes fixes sur toutes les vues. Jeux 4 et 5, hors contrat. Non bloquant.

## Table des captures

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| sunstore i 01 à 03 | cave | 390 | Finances ; entrée « Documents » ; 2 pages, « Lire 2 pages » | — | — |
| sunstore i 04, 05 | cave | 390 | neuf 25 s : « 14,60 » + « lu ~~163,85~~ », drapeau « 5 lignes retirées · 199,25 CHF », retirées / total changé / payé rouges, TVA 0,37 / 0,37 vert, « 6 corrigées », NoVatTax, service / other | 3, 4 | — |
| sunstore i 06, 07 | cave | 390 | 2 lignes vives, 5 barrées sans icône (Rabais « ? × — »), H21 « 2 ? × 50,00 100,00 » ; pied « 1/5 » | 3, 6 | — |
| sunstore i 08 | cave | 390 | « Les garder » → 7 lignes, total 14,60, « Somme ≠ imprimé 213,85 / 14,60 +199,25 », « 199,25 CHF en trop », Payé rouge gardé | 3 | — |
| sunstore i 09, 10, 11 | cave | 390 | « Remettre 163,85 » → 163,85, « Somme ≠ imprimé 213,85 / 163,85 +50,00 › Voir la ligne en trop », « Payé = imprimé · TWINT 163,85 », TVA 0,37 / 4,15 ambre ; Payé touché : focus bouton, rien d'autre | 3, 5 | — |
| sunstore i 12, 13 | cave | 390 | × › Abandonner, retour Finances | — | — |
| sunstore j 01 à 03 | clair | 1280 | Finances ; entrée ; 2 pages | — | — |
| sunstore j 04 à 07 | clair | 1280 | cache 3 s : identique à i (14,60, 163,85 barré, 5 retirées 199,25, payé rouge +149,25) | 3, 4 | — |
| sunstore j 08 | clair | 1280 | Payé touché → les deux photos ouvertes en haut | — | — |
| sunstore j 09 | clair | 1280 | « Remettre » → 163,85, « Somme ≠ imprimé 14,60 / 163,85 −149,25 › Comparer à la photo », « 149,25 CHF manquants », Payé vert, TVA ambre | 5 | — |
| sunstore j 10, 11 | clair | 1280 | « Les garder » → 7 lignes, « 50,00 CHF en trop › Voir la ligne en trop » | 3 | — |
| sunstore j 12, 13 | clair | 1280 | × › Abandonner, retour Finances | — | — |
| bauhaus k 01 à 03 | cave | 390 | erreur locale de mon script (fichier absent) : « Le justificatif ne peut pas être lu. » | — (test) | — |
| bauhaus l 01 à 04 | cave | 390 | neuf 32 s : 352,05, 28 lignes, drapeau « 83,35 CHF manquants », Somme rouge, une-lecture et retirées rouges (2 · 12,40), Payé vert, « 1 à contrôler · 26 corrigées », 0 mot brut ; groupes « Matériel de brassage 16 » avec icônes | 1, 2 | 1, 2 |
| bauhaus l 05, 06 | cave | 390 | lignes : noms barrés d'une voisine, montants décalés ; « Consommables 1 », « Rénovation 5 », « Autres 6 » ; pied « 1/24 » | 1, 2, 6 | 1, 2 |
| bauhaus l 07 | cave | 390 | Somme → photo ouverte, focus bouton | — | — |
| bauhaus l 08 | cave | 390 | « Les garder » → 30 lignes, « 70,95 CHF manquants › Ajouter la ligne manquante » | 1 | 1 |
| bauhaus l 09, 10 | cave | 390 | Lectures → POLATRE ouverte ; bloc fin | 1, 2 | 1, 2 |
| bauhaus l 11, 12 | cave | 390 | × › Abandonner, retour Finances | — | — |

## Doutes (non comptés)
- « Les garder » seul (i-08) laisse le total à 14,60 et dit « 199,25 CHF en trop » ; il faut aussi « Remettre » : deux touchers pour une seule idée (« c'est bien 163,85 et ces lignes »). p2 ne remettait le total que si la baisse valait exactement les lignes retirées ; H21 à 100,00 l'empêche.
- La relecture ne rend toujours qu'un ticket sur deux (page 1 aux jeux 5 et 6, page 2 au jeu 4) : non mesuré, p3 § 5.
- BAUHAUS : le nombre de lignes varie d'une lecture à l'autre (29, 23, 28) ; « Articles lus 28 » sans écart de compte alors que 83,35 manquent.
- 1280 non rejoué pour BAUHAUS ; Sun Store 390 clair non joué (budget).

LEÇON PROPOSÉE : un script de test qui passe par un dossier de copies vérifie que la pièce demandée y existe avant `uploadFile` ; sinon l'app affiche une erreur de lecture locale que le critique prend pour un défaut déployé (jeux 5 et 6).
