OK — contrôle c1 rejoué (50 appels, 0,576 CHF) : déployable aiTask OUI, avec limites

## Ce qui a été joué
- Vérité : celle du pilote, relue par moi sur la photo en plein format : **aucun écart** (compté : sunstore-1 2 lignes 14,60 ; sunstore-2 3 articles, brut 151,83, rabais −2,58, total 149,25 ; bauhaus-tache 29 lignes, somme 277,60 ; bauhaus-copie 22 lignes, somme 136,65). Écrite dans `H13-reels/cas-7.json` (doc22 à doc25, hors Git ; sommes des items recontrôlées par script).
- Lecture : la production actuelle = **Csv8** (2 Flash-Lite 8 192 jetons, 3.8 sur désaccord ; `functions/src/ai.ts` → `lireCsv8`), avec la normalisation N. Passe payante `--payant --budget-chf 24.5 --plafond-passe 1 --variantes Csv8 --normaliser --repeat 1`, sortie `H13-reels/banc-b1-20261109/` (hors Git). Simulée d'abord (BANC SIMULE), estimée ensuite (`BANC ESTIME 0.5750 CHF 12 appels neufs`).
- Fidélité à l'app : `decouperPiece` de l'app (« avant ») lancée dans Chrome sur les 4 photos : **0 morceau** partout, donc l'app lit la photo entière, comme le banc. Aucune pièce n'est lue en morceaux.
- Écran : la vraie feuille « Nouvelle dépense » (Chrome, 390 tactile, clair, `?dev-local`), le seul appel serveur remplacé par le rejeu de la lecture payée (`capturer-b1.mjs`) ; le reste du client (normalizeResult, contrôles de t1 dans l'état du poste au 09.11) est réel. 0 requête aiTask partie. Les 8 captures sont dans `captures/` et ouvertes (4 « contrôles » + 4 « repos »).

## Journal des appels (`work/missions/2026-11-01-banc-lecture/journal-gemini.md`, 12 lignes de 16:42 à 16:43)
12 appels (8 Flash-Lite + 4 3.8, une 3.8 par pièce car les deux Flash-Lite divergent toujours) ; 0,128 CHF (cumul journal 10,566 → 10,694 CHF). Aucun appel de plus : le plafond de 12 est épuisé.
| pièce | Flash-Lite 1 / 2 | 3.8 | coût CHF | durée de la lecture |
|---|---|---|---|---|
| sunstore-1 (doc22) | 2,6 s / 2,4 s | 4,4 s | 0,0142 | 7,0 s |
| sunstore-2 (doc23) | 3,1 s / 3,1 s | 6,8 s | 0,0191 | 9,9 s |
| bauhaus-tache (doc24) | 7,0 s / 8,4 s | 15,4 s | 0,0491 | 23,7 s |
| bauhaus-copie (doc25) | 6,7 s / 8,0 s | 13,7 s | 0,0457 | 21,7 s |

## Tableau pièce × contrôle (lecture finale = ce que le serveur rend)
| pièce | lignes vérité | lignes lues | somme lue | total lu | payé lu | drapeau attendu | drapeau vu à l'écran |
|---|---|---|---|---|---|---|---|
| sunstore-1 | 2 | **2** (2/2 justes) | 14,60 | 14,60 | **montant non lu** (moyen TWINT lu) | aucun (14,60 = 14,60 = reçu ; l'EFT 163,85 n'est pas un article ni ce paiement) | aucun drapeau de contrôle (✓ ✓ · ✓ ✓) ; bandeau « À confirmer · Total ticket 14,60 ≠ Total EFT TWINT 163,85 » (information, pas une erreur) |
| sunstore-2 | 3 (+ 2 rabais) | **5** (3 articles + 2 rabais) | 149,25 | 149,25 | non lu | aucun sur les CHF (151,83 − 2,58 = 149,25) | aucun drapeau CHF ; « Articles lus = imprimés 5 » ✓ ; « À vérifier · Lectures 3 désaccords » ; « À confirmer · Deux totaux imprimés 149,25 et 163,85 » |
| bauhaus-tache | 29 | **23** (6 perdues : 3,10 · 2,45 · 14,90 · 8,90 · 8,90 · 4,95, les dernières avant « Montant en EUR ») | 234,40 | 352,05 | non lu | oui (277,60 ≠ 352,05, écart 74,45 sur la pièce) | **oui** : « À vérifier · 117,65 CHF », « Somme ≠ imprimé 234,40 / 352,05 −117,65 · Chercher la ligne manquante ». Mais « Articles lus = imprimés 23 » ✓ (faux vert) |
| bauhaus-copie | 22 | **22** (dont 1 montant faux : 66,95 pour 6,95) | 196,65 | 352,05 | non lu | oui (136,65 ≠ 352,05, écart 215,40) | **oui** : « À vérifier · 155,40 CHF », « Somme ≠ imprimé 196,65 / 352,05 −155,40 ». « Articles lus = imprimés 22 » ✓ |

Le total lu est juste sur 4/4, le moyen de règlement juste sur 4/4 (TWINT ; la lecture 2 de bauhaus-copie dit « card », corrigé par le vote). Le **payé en CHF n'est lu sur aucune pièce** (pas de champ `amountPaid` au schéma : l'écran dit « montant non lu », jamais 0, correct).

## Défauts, avec leur cause
1. **« Articles lus = imprimés » est circulaire (bauhaus-tache : 23 ✓ pour 29 imprimées).** `printedLineCount` (consigne `functions/src/prompts.ts:188`) est rendu par le même modèle qui transcrit : il compte ce qu'il a transcrit (23, 22, 5) et non ce qui est imprimé (29, 22, 3). Les lectures : tache 23 / 24 / 23 annoncées, 23 / 28 / 23 transcrites. Le contrôle ne peut jamais attraper une ligne perdue ; il ne fait que paraître sûr. Seul le contrôle CHF a levé le drapeau.
2. **bauhaus-tache : 6 lignes perdues, et le vote écarte la lecture qui les avait.** La Flash-Lite 2 transcrit 28 lignes (dont les 3 dernières) ; la Flash-Lite 1 et la 3.8 s'arrêtent à 23 ; la 3.8 tranche et garde 23. L'écart affiché (−117,65) n'est donc ni l'écart de la pièce (−74,45) ni zéro : il mélange lignes perdues et lignes absentes de la pièce. L'écran dit « 117,65 CHF non retrouvés : ligne illisible, cachée ou rabais ? » : 43,20 CHF sont des lignes présentes sur la photo. Cause probable (hypothèse, non testée) : photo en diagonale et tachée, bas du ticket penché. Une photo redressée ou lue par bandes (Bv) serait à mesurer.
3. **bauhaus-copie : un montant faux, 66,95 (vrai 6,95).** Flash-Lite 1 et 2 : 69,95 et 20 lignes seulement (2 perdues) ; 3.8 : 66,95 et 22 lignes. Écart affiché −155,40 au lieu de −215,40. Le drapeau est levé quand même (la somme 196,65 n'est pas 352,05), mais la piste « ligne manquante » ne mène nulle part : c'est un montant lu faux. **Doute sur la vérité** : sur les deux autres photos du même ticket, cette première ligne s'imprime 86,85 / 86,95 ; ici « 06.95 » (le premier chiffre est effacé par la photo). Vérité du pilote gardée (6,95), mais si l'imprimé réel est 86,95 la somme de cette photo serait 216,65 et l'écart 135,40. Les trois lectures se trompent de toute façon.
4. **sunstore-2 : les rabais deviennent des lignes (5 au lieu de 3 articles), l'une nommée « NoVatTax - 0% ».** Seule la 3.8 donne `discount` aux deux lignes négatives ; les Flash-Lite les lisent `other` (ou `service`). Le nom de la ligne est le libellé de taxe imprimé sous l'article, pas « Rabais ». `printedLineCount` = 5 compte donc les rabais : « Articles lus = imprimés 5 » ✓ alors que le ticket imprime 3 articles. La somme (149,25) est juste précisément parce que les rabais sont des lignes négatives ; mais ce ne sont pas des articles (vérité du pilote) et ils ne se rattachent pas à leur article.
5. **sunstore-2 : « H21 vaccination × 2 » : un faux désaccord.** Le ticket n'imprime que le montant de ligne 50,00 (pas de prix unitaire 25,00). Une lecture met 50,00 en prix unitaire (2 × 50 ≠ 50), une autre le laisse absent : « prix unitaire : lectures divergentes (50,00 / absent) », « Qté × prix non contrôlé », « Lectures 3 · 3 désaccords » et bandeau « À vérifier ». Cause : la consigne demande `price` = prix unitaire imprimé ; la ligne n'en a pas.
6. **« Total EFT » (le piège de 163,85) : bien tenu, mais bruyant.** Aucune lecture ne prend 163,85 pour le total ni pour une ligne ; la lecture le signale elle-même en `fieldWarnings` (« Total ticket 14,60 différent du Total EFT TWINT 163,85 », « Deux totaux imprimés »). À l'écran cela donne « À confirmer » sur deux pièces dont les CHF sont justes. Quand `amountPaid` existera, **le piège est là** : un champ « payé » lu dans le bloc TWINT donnerait 163,85 sur les deux tickets Sun Store (14,60 + 149,25 = paiement commun) et lèverait un « Payé ≠ imprimé » à tort. Il faut lire « Montant reçu » (sunstore-1 : 14,60) et traiter l'EFT comme information.
7. **Noms de lignes Bauhaus mal lus** (« BAC A 82733587 BIT6 » : l'EAN fondu dans le nom ; « VITRIEIC.P.SOL.5.5KG » ; « Fachrentren » dans le vendeur) : 45 et 25 désaccords de lecture, « 12 à contrôler » et « 13 à remplir » à l'écran. Les montants, eux, sont presque tous justes (tache : 23/23 retrouvés ; copie : 21/22).

## Ce que l'écran Dépense montre aux contrôles (réel, capturé)
- Les deux drapeaux attendus **sont levés** (Bauhaus ×2), avec les deux valeurs, l'écart signé et le geste « Chercher la ligne manquante › » ; sur les deux Sun Store, pas de drapeau CHF (juste).
- Faux vert : « Articles lus = imprimés » (défaut 1), sur les 4 pièces, y compris celle à 6 lignes perdues.
- « Payé · TWINT — montant non lu » partout : le contrôle « payé » du brasseur (« total, total trouvé, total effectif ») n'a aucune valeur à comparer.
- Les écarts CHF affichés (−117,65 ; −155,40) ne sont pas ceux de la pièce (−74,45 ; −215,40) : l'écran compare à ce qui a été lu, pas à ce qui est sur la photo ; il ne peut pas faire autrement tant que les lignes lues sont fausses.

## Propositions (aucun code d'app écrit ; `ExpenseSheet.tsx` est à t1)
- **P1, schéma/consigne (serveur, à banc d'abord)** : `amountPaid` lu sur « Montant reçu / Payé » avec priorité sur le terminal (EFT = information, jamais le payé d'une pièce où il diffère du total sans bloc « reçu ») ; et un compte d'articles indépendant : demander le nombre de **marqueurs de ligne imprimés** (Bauhaus : un « ( EAN » par article) avant la transcription. À mesurer au banc avec ces 4 pièces plus celles déjà au banc (L20 : indice, pas preuve, 4 pièces).
- **P2, écran** : « Articles lus = imprimés » ne doit pas passer au vert quand les lectures n'ont pas annoncé le même nombre (tache : 23 / 24 / 23 annoncées, 23 / 28 / 23 transcrites) ; il passe en « · annoncé par la lecture ». Le nombre vert n'a de valeur que s'il vient d'un autre chemin que la transcription.
- **P3, vote** : quand une lecture a plus de lignes que la retenue et que ses lignes en plus comblent l'écart au total (ici 28 lignes, somme 268,80, plus proche de 352,05), les montrer comme « lignes trouvées par une seule lecture » (à ajouter) plutôt que de les perdre. C'est un geste de plus au banc (variante à nommer), pas une rustine.
- **P4, rabais** : ne pas compter une ligne `discount` dans « articles » et la rattacher à l'article au-dessus ; nommer « Rabais » plutôt que le libellé de taxe ; une ligne sans prix unitaire imprimé n'a pas de désaccord de prix (`price` vide admis quand seul le montant est imprimé).
- **P5, passe de plus** (si le brasseur veut mesurer P1/P3 sur ces pièces) : `Bv`/redressement de la tache et `Csv8` + consigne P1 : ≈ 8 à 12 appels, ≈ 0,15 CHF ; au-delà de mon plafond, donc non lancée.

## Contrôles du contrat
- Journal des appels, coût en CHF : fait (ci-dessus ; 12 lignes dans le journal du banc).
- Tableau : fait.
- Une capture par pièce, 390 clair, ouverte : `captures/doc2{2,3,4,5}-*-390-2-controles.png` (+ `-1-repos.png`), toutes ouvertes ; rapport texte `captures/rapport.txt` ; sortie complète de l'analyse `analyse-sortie.txt`.
- Pas de test unitaire ajouté (pas de `tests.txt`) : la voie ne touche aucun code ; l'analyse (`analyse.ts`) rejoue `controlesCroises` de t1 sur les lectures réelles et concorde avec l'écran (drapeau, écarts, rangs).
- Essais : 1 passe payante (aucune reprise), 3 lancements du banc Chrome (les deux premiers échouaient avant la lecture : le menu du + s'appelle maintenant « Nouvelle écriture », et le serveur Vite n'avait pas fini de compiler).

## Doutes et limites
- 4 pièces, 1 tirage : un indice, pas une preuve. Une même lecture rejouée un autre jour peut donner autre chose (les lectures de la tache varient de 23 à 28 lignes).
- Les captures montrent le code de t1 tel qu'il était sur le poste à 17 h (non fini à ma connaissance) ; seules les valeurs de contrôle comptent ici.
- Le rejeu de l'écran ne passe pas par le serveur (pas de cache, pas de flux provisoire) : le rendu final est celui de la lecture finale.
- Fichiers privés (hors Git, jamais copiés) : `H13-reels/cas-7.json`, `H13-reels/banc-b1-20261109/{results.json,raw/}` ; les photos restent dans `pieces/`. GESTES.md du banc non mis à jour (hors de ma voie).

DÉCISION À PRENDRE : le brasseur compte-t-il un rabais comme une ligne ? Options : (a) ligne négative (aujourd'hui : somme juste, articles faux) ; (b) sous-ligne rattachée à l'article, hors du compte d'articles. Recommandation : (b), et lancer P5 pour mesurer le compte d'articles indépendant ; le pilote route (choix de forme : à montrer en mini maquettes si (b)).

CONNAISSANCE : la production lit une photo entière en Csv8 ; pour ses 4 pièces l'app ne découpe pas (RAPPORT_DECOUPE = 3, aucune coupe). `printedLineCount` est le nombre de lignes transcrites, pas imprimées : le contrôle « Articles lus = imprimés » ne détecte aucune ligne perdue. Le moyen de règlement est lu, le montant payé ne l'est pas (pas de champ), et l'EFT du terminal peut couvrir plusieurs tickets (14,60 + 149,25 = 163,85).

LEÇON PROPOSÉE : un contrôle croisé dont l'une des deux valeurs vient du même modèle que l'autre (compte annoncé = compte transcrit) ne contrôle rien : avant de le montrer vert, vérifier qu'une des deux valeurs a un autre chemin, et le tester sur une pièce à lignes perdues.


---

# P5 — les consignes et le schéma neufs de c1, mesurés sur les quatre pièces (demande du pilote, 09.11)

**VERDICT : déployable = NON** (sans déployer). Un défaut bloquant (sunstore-1 régresse), deux contrôles bruyants, un champ inutilisable ; le meilleur gain (brut − rabais) est exact sur les trois pièces à écart.

## Ce qui a été joué
- Même banc, même variante qu'avant (Csv8 + N, 1 tirage, `--payant --budget-chf 24.5 --plafond-passe 1`), mais sur `functions/src/prompts.ts` et `invoiceScanCore.ts` de c1 (état du poste à 17 h, non déployé). Sortie : `H13-reels/banc-b1-p5-20261109/` (hors Git). Simulée avant (BANC SIMULE), estimée (0,5750 CHF au pire).
- **11 appels** (8 Flash-Lite + 3 × 3.8 : sunstore-1 n'a pas appelé la 3.8, les deux Flash-Lite étant d'accord), **0,1401 CHF** (cumul journal 10,694 → 10,834 CHF), 11 lignes journalisées (17:07 à 17:08). 1 appel de plafond non utilisé.
- Analyse : `analyse-p5.ts` (rejoue aussi `controlesPiece` de c1 sur les lectures réelles), sortie complète `analyse-p5-sortie.txt`. Aucune désignation de ligne n'y est imprimée.

## Mesure contre la vérité (lecture finale = ce que le serveur rendrait)
| champ | sunstore-1 | sunstore-2 | bauhaus-tache | bauhaus-copie |
|---|---|---|---|---|
| `amountPaid` | **14,60 ✓** | absent ✓ (non imprimé : pas de « Montant reçu ») ; mais **la lecture 2 a pris 163,85 pour le payé** (le piège), écartée par le vote | **352,05 ✓** | **absent ✗** (vrai 352,05 ; lectures 1 et 2 l'avaient, la 3.8 non) |
| `terminalAmount` | 163,85 ✓ | **163,95 ✗** (vrai 163,85 ; 2 lectures sur 3) | 352,05 (pas de terminal séparé : TWINT = payé) | 352,05 (idem) |
| `countedAmounts` (vérité) | **4 ✗** (2 ; 4 ou 3 selon la lecture : la colonne compte total et reçu) | 5 ✓ (5 ; mais 8 / 7 / 5 selon la lecture) | **29 ✓** (3.8 seule ; les 2 Flash-Lite : null) | **22 ✓** (3.8 seule ; Flash-Lite 18 et 21) |
| `countedEans` (vérité) | 1 (aucun EAN) ✗ | 0 ✓ (lectures 1 et 2 : 1) | 28 (29) ✗ | 21 (22) ✗ |
| `printedItemCount` (vérité) | absent (2) | absent (3) ; la lecture 2 dit 7 ✗ | absent (29) | absent (22) |
| lignes lues / vérité | 2 / 2 mais **montants null (B1)** | 5 / 3 + 2 rabais ✓ | **29 / 29, 0 perdue ✓** (avant : 23) | **22 / 22 ✓** |
| montants faux | — | — | aucun | **aucun** : 6,95 lu juste (avant : 66,95) |
| rabais | — | **3 articles + 2 remises ✓** (`compterArticles`) | — | — |
| `ignoredLines` | 4 (sous-total, reçu, TWINT, EFT) : justes, aucune dans les articles ✓ | 3 (brut, rabais total, EFT) ✓ | EUR 370,92 + TWINT 352,05 ✓ | idem ✓ |
| `photoIncomplete` | false | false | false (photo tachée, rien levé) | false |

Contrôles de c1 rejoués sur ces lectures (`controlesPiece`) :
| contrôle | sunstore-1 | sunstore-2 | bauhaus-tache | bauhaus-copie |
|---|---|---|---|---|
| comptage-montants | **KO faux** (4 / 0 ligne avec montant) | ok | ok (29 = 29) | ok (22 = 22) |
| comptage-ean | **KO faux** (1 code sans ligne) | ok | KO (28 / 25 lus) | KO (21 / 17 lus) |
| cle-ean | — | — | KO (21 codes invalides sur 25) | KO (16 sur 17) |
| brut-rabais | **KO faux** (14,60 non retrouvés) | ok (151,83 − 2,58 = 149,25) | **KO, écart 74,45 ✓ exact** | **KO, écart 215,40 ✓ exact** |
| paiement | ok (14,60 = 14,60) | — (payé non lu ; terminal 163,95) | ok (352,05) | ok |
| hors-articles | ok | ok | ok (EUR écarté) | ok |
| drapeau attendu / vu | aucun / **3 KO à tort** | aucun / aucun ✓ | oui / oui ✓ (+ 2 KO EAN) | oui / oui ✓ (+ 2 KO EAN) |

## Défauts de P5, avec leur cause
- **B1 (bloquant) — sunstore-1 régresse : quantité 2 et `amountTTC` null sur les 2 lignes.** Les deux Flash-Lite lisent « 5.40 2 » en quantité 2 (le « 2 » est le code TVA de la colonne de droite ; la vraie quantité 1 est imprimée à gauche) et ne remplissent plus le montant de ligne (`price` seul). Avant P5 la même pièce sortait 2/2 lignes avec 5,40 et 9,20. Résultat : somme des lignes 0,00, point `somme-incomplete`, brut − rabais « 14,60 CHF non retrouvés », comptage « 4 / 0 ». Les deux lectures sont d'accord, la 3.8 n'est donc pas appelée : rien ne rattrape. Cause probable (hypothèse, un tirage) : le nouveau paragraphe sur la colonne des montants et `countedAmounts` fait passer le montant de ligne au second plan ; à reformuler, puis rebancer. Une pièce simple qui devient fausse est le pire cas pour un brasseur.
- **B2 — `countedAmounts` ne compte pas la même chose selon la pièce.** Sun Store : 4 (articles + total + reçu) pour 2 articles ; sunstore-2 : 8 / 7 / 5. Seule la 3.8 donne 29 et 22 (les deux Flash-Lite : null sur la tache, 18 et 21 sur la copie) : le vote retient la 3.8, d'où deux ✓ sur les Bauhaus, mais c'est un tirage et une seule lecture. Consigne à resserrer : « montants d'articles seulement, sans total ni reçu ni TVA ; remises comprises ».
- **B3 — `cle-ean` et `comptage-ean` lèvent un drapeau sur chaque Bauhaus.** Les EAN sont lus mais mal (21 invalides sur 25 ; 16 sur 17), et jamais en nombre exact (28 / 29, 21 / 22). Le drapeau dit vrai sur la lecture (les codes sont faux), pas sur la pièce : bruit permanent à côté d'un vrai signal (brut − rabais). Je n'ai pas relu les EAN sur la photo (illisibles à cette taille) : la vérité des codes manque.
- **B4 — `terminalAmount` 163,95 au lieu de 163,85** (sunstore-2, 2 lectures sur 3) : un chiffre lu faux ; sans effet ici parce que `amountPaid` est absent, mais c'est la valeur du piège.
- **B5 — `printedItemCount` inutilisable** (absent dans les 4 lectures finales, 7 dans une lecture de sunstore-2 : il a compté les lignes de montant). Le compte d'articles ne vient donc que de `countedAmounts`.
- **B6 — `amountPaid` absent sur la copie** (vote : la 3.8 met null, les Flash-Lite 352,05) : écran « payé non lu » alors que TWINT 352,05 est imprimé.

## Ce qui marche (un tirage, 4 pièces : indice, pas preuve)
- **brut − rabais = total** : exact sur les pièces à écart (74,45 ; 215,40) et neutre sur sunstore-2 ; c'est le contrôle que le brasseur voulait, et il ne dépend d'aucun champ neuf.
- **Lignes perdues** : tache 29 / 29 (avant 23), copie 22 / 22 avec 6,95 juste (avant 66,95). Mais ce gain vient de la 3.8 seule (les Flash-Lite : 27 et 28 lignes ; 18 et 21), donc de la variance d'un tirage autant que des consignes. À confirmer sur 3 tirages.
- **Rabais** : `compterArticles` donne 3 articles + 2 remises sur sunstore-2 ; `ignoredLines` ne mange aucune ligne d'article ; « Montant en EUR 370,92 » est classé `foreign_currency` sur les deux Bauhaus.
- **Piège EFT** : tenu par le vote (aucune lecture finale ne met 163,85 en `amountPaid` ; une lecture l'a fait).

## Pour le rendre déployable (propositions ; rien n'est écrit dans functions/)
1. Corriger B1 d'abord : quantité = le nombre imprimé en tête de ligne (jamais le code TVA à droite), montant de ligne toujours rempli quand il est imprimé ; rebancer sunstore-1 et les 7 pièces déjà au banc (L20 : aucune régression sur ce qui marchait) avant tout autre geste.
2. Resserrer `countedAmounts` (articles et remises seulement) ; ne faire voter le comptage que sur ce que la 3.8 ou deux lectures confirment.
3. Ne pas afficher `cle-ean` / `comptage-ean` en drapeau tant que les EAN ne sont pas lus à 90 % au moins (à mesurer) ; les garder en « non vérifié ».
4. Une passe de contrôle : 4 pièces × 3 tirages (≈ 36 appels, ≈ 0,40 CHF), hors de mon plafond de 12 : à lui demander.

DÉCISION À PRENDRE : lancer la passe corrigée (points 1 à 3, puis 4 pièces × 3 tirages, ≈ 0,40 CHF) ? Recommandation : oui, après correction de B1 par c1 ; ne pas déployer `aiTask` avant (réponse à la décision de c1).

CONNAISSANCE : une consigne qui ajoute des champs de comptage peut dégrader la lecture des lignes d'une pièce simple (sunstore-1 : code TVA lu comme quantité, montant de ligne vide) : tout changement de consigne se rejoue sur la pièce la plus simple, pas seulement sur les difficiles. Brut − rabais = total à 5 centimes retrouve exactement l'écart de la pièce (74,45 ; 215,40) quand les lignes sont lues.
LEÇON PROPOSÉE : une mesure de consigne neuve se juge d'abord sur les pièces qui marchaient déjà (régression), puis sur les difficiles ; un gain de la 3.8 sur un tirage n'est pas un gain de consigne.


---

# Passe de contrôle de c1 (consignes, garde `quantiteSansCodeTva`, vote des champs de contrôle, EAN non vérifiés, rabais en sous-ligne)

**VERDICT : déployable `aiTask` = OUI**, côté serveur seul, avec cinq limites écrites plus bas. Rien n'est déployé. Ma seule réserve de fond : sur 4 pièces et 2 à 3 tirages, c'est un indice, pas une preuve (L20).

## Ce qui a été joué
- Banc, variante Csv8 + N (= la production), sur `functions/src` de c1 (état du poste à 17 h 20). Quatre passes payantes, **50 appels, 0,576 CHF** (cumul journal 10,834 → 11,411 CHF), 50 lignes journalisées de 17:09 à 17:24. Plafond (50 appels, 0,60 CHF) tenu.
  - sunstore-1 × 3 tirages : 8 appels, 0,043 CHF ; les sept pièces d'avant (doc1 à doc7) × 1 tirage : 18 appels, 0,176 CHF ; sunstore-2, tache, copie × 2 tirages : 18 appels, 0,29 CHF ; un 3ᵉ tirage de sunstore-2 et de la tache : 6 appels, 0,086 CHF. La copie n'a que 2 tirages (budget).
- Sorties (hors Git) : `H13-reels/banc-b1-r1-{s1,sept,dur,t3}/`. Analyse : `analyse-r1.ts`, sortie complète `analyse-r1-sortie.txt` (aucune désignation de ligne ; montants des lignes seulement).
- Comparaison de la régression : les deux passes payantes du matin (`banc-m9-payant`, `banc-m9-payant-t2`, production d'avant c1) contre cette passe, sur la vérité de `cas.json`, `cas-2.json`, `cas-3.json`.

## 1. Régression : sunstore-1, puis les 7 pièces déjà au banc
**B1 est corrigé : sunstore-1 est juste 3 tirages sur 3** (2 / 2 lignes, montants 5,40 et 9,20 remplis, quantité 1, total, date, vendeur justes, aucune quantité ≠ 1). Avant c1 (P5) : quantité 2, montants vides, somme 0,00. La 3.8 n'a même pas été nécessaire aux tirages 3.

| pièce | avant c1 (2 passes du matin) | après c1 (1 tirage) | verdict |
|---|---|---|---|
| doc1 (facture en capture) | 7 / 7 lignes, montants 7 / 7, total, date vide = vérité | 7 / 7, montants 7 / 7, total ok, **date remplie** alors que la vérité est vide | à surveiller (voir limite 1) : pas une régression de c1 |
| doc2 (papier, 2 TVA) | 6 / 6, 5 / 5, total ok | identique | = |
| doc3 (bulletins QR tournés) | 2 lignes, **total faux** | 1 ligne, **total juste** | mieux |
| doc4 (bordereau) | 3 / 3, total ok | identique | = |
| doc5 (PDF 3 pages) | 26 lignes (25 vraies + 1 en trop), total ok | identique (même ligne en trop) | = |
| doc6 (commande en ligne) | 20 / 20 puis 21 / 20 (une ligne en trop) | 20 / 20, rien en trop | mieux |
| doc7 (facture Infomaniak) | 7 / 7, total ok, date fausse (les deux passes) | identique, date fausse | = (défaut ancien) |
Coût et durée : mêmes ordres de grandeur (doc5 : 27,9 s et 0,065 CHF ; aucune lecture plus longue que 30 s).

## 2. Les quatre pièces pièges, contre la vérité du pilote
| pièce (tirages) | lignes lues / vérité | montants justes | drapeau CHF attendu → vu | payé lu | terminal lu | comptage des montants |
|---|---|---|---|---|---|---|
| sunstore-1 (3) | 2 / 2 ×3 | 2 / 2 ×3 | aucun → aucun ×3 ; **1 faux drapeau** sur le 3ᵉ (comptage-montants : 3 comptés pour 2) | **14,60 ×3 ✓** | **163,85 ×3 ✓** | 2, 2, **3** |
| sunstore-2 (3) | 5 = 3 articles + 2 remises ×3 | 3 / 3 + 2 remises ×3 | aucun → aucun ×3 | absent ×3 ✓ (non imprimé) | **163,85 ×3 ✓** (avant : 163,95) | 5 ×3 ✓ |
| bauhaus-tache (3) | **28, 29, 29** / 29 | 28 / 29, 29 / 29, 28 / 29 (un 5,20 sans montant au 3ᵉ) | oui → oui ×3 ; écart affiché **83,35 · 74,45 · 79,65** (vrai : 74,45) | **absent ×3 ✗** (352,05) | 352,05 | 28, 29, 28 |
| bauhaus-copie (2) | 22 / 22 ×2 | 21 / 22 puis 22 / 22 | oui → oui ×2 ; écart **135,40 · 215,40** (vrai : 215,40) | **absent ×2 ✗** | 352,05 | 22, 22 ✓ |
- **Lignes perdues** : au pire 1 sur 29 (avant c1 : 6 sur 29 en un tirage ; P5 : 0). Aucune pièce ne perd plus de 1 ligne sur 5 tirages Bauhaus.
- **Drapeau** : levé 5 fois sur 5 sur les deux Bauhaus, jamais à tort sur sunstore-2, une fois à tort sur sunstore-1 (le comptage, pas la somme).
- **Écart exact** : 2 tirages sur 5 (74,45 et 215,40). Les autres écarts ne sont pas ceux de la pièce parce que le brasseur voit « lignes lues − total », pas « lignes de la photo − total ».
- **Rabais** : 3 articles + 2 remises ×3 (`compterArticles`), `rattacherRemises` rend 3 articles avec 2 sous-lignes, 0 orpheline. Aucun article n'est plus compté en trop.
- **`printedItemCount`** : absent sur les 11 lectures finales (le vote le retire s'il n'est pas confirmé) : inutilisé, et sans risque.
- **`countedEans`** : 28 (vrai 29) et 21 (vrai 22) : jamais exact ; `comptage-ean` et `cle-ean` restent « non vérifiés » sur toutes les pièces : aucun faux drapeau EAN, comme voulu.
- **Piège EFT** : aucune lecture finale ne met 163,85 en `amountPaid` (une lecture Flash-Lite de la tache l'a fait avec 352,05, voir plus bas : pas le piège, le vrai payé).

## Défauts restants (avec cause)
1. **Le payé des Bauhaus n'est jamais lu (0 / 5 ; vérité 352,05).** La consigne sépare « payé du ticket » du « terminal » ; sur un ticket Bauhaus il n'y a qu'une ligne « TWINT 352,05 », que les lectures rangent en `terminalAmount` (352,05 ×5) et que la 3.8 laisse `amountPaid` à null ; le vote exige l'accord de deux lectures ou de la 3.8 seule : une Flash-Lite seule (ou deux sur trois) ne suffit pas (tache t3 : 352,05 / 352,05 / null → absent). Effet : « Payé · TWINT — montant non lu » sur les deux Bauhaus : neutre (jamais faux, jamais 0). Proposition : quand `terminalAmount` = total et qu'aucun « Montant reçu » n'est imprimé, la lecture du terminal tient lieu de payé pour un ticket de caisse (une seule pièce, un seul règlement) ; ne pas le faire quand terminal ≠ total (le piège Sun Store).
2. **Un faux « comptage des montants » sur sunstore-1 (1 tirage sur 3)** : les deux Flash-Lite comptent 3 (total ou reçu compté), la 3.8 n'est pas appelée, le vote accepte deux lectures d'accord. Une pièce juste reçoit « Ajouter 1 ligne ». Proposition : `comptage-montants` ne lève un drapeau que si `brut-rabais` est lui aussi en échec ou si le comptage vient de la 3.8 ; sinon `null`.
3. **Tache : un montant sans valeur (5,20 vide) ou une ligne perdue (8,90) sur 2 tirages sur 3** : l'écart affiché (79,65 ; 83,35) n'est pas celui de la pièce (74,45) ; le drapeau, lui, est juste. Cause : pièce penchée et tachée, 29 lignes ; la 3.8 recopie sans erreur dans 1 tirage sur 3 seulement.
4. **Doute sur la vérité de la copie (à trancher par le pilote sur la photo)** : au 1ᵉʳ tirage la lecture donne 86,95 pour la première ligne, au 2ᵉ 6,95. 86,95 est ce que s'imprime cette ligne sur les autres photos du même ticket (cas-6, doc15 : 86,95 ; tache : 86,85). Si c'est 86,95 (premier chiffre effacé par la photo), la somme de la copie est 216,65 et l'écart vrai **135,40, non 215,40** : le tirage 1 aurait alors été juste. Je ne tranche pas ; l'écart se règle sur sa vue du ticket.
5. **Variance de la date de doc1** : divergence de date dans 8 passes sur 14 du banc depuis le 01.11 (avant c1 comprise : `banc-k7-prod`, `banc-m9-avant-k7-prod` donnent déjà une date quand la vérité est vide) : défaut ancien, non lié à c1 ; la production du matin n'avait que de la chance.

## Pourquoi OUI
- La régression que j'avais écartée (B1) est corrigée sur 3 tirages sur 3, et aucune des sept pièces d'avant ne recule (deux s'améliorent, quatre identiques, une varie par un défaut ancien).
- Ce qui était faux et qui ne l'est plus : rabais (3 + 2 remises, plus d'article compté en trop), terminal 163,85 (au lieu de 163,95), 6,95 ou 86,95 plutôt que 66,95, lignes perdues 1 au pire (6 avant), « Montant en EUR » écarté 5 fois sur 5, aucun faux drapeau EAN.
- Les champs sont facultatifs (c1) : un client d'avant et un serveur d'après se comprennent ; rien ne change à l'écran tant que `geminiScanner.normalizeResult` (voie d2) ne les recopie pas. Coût par lecture : sunstore-1 0,0144 CHF (avant 0,0142), tache 0,062 en moyenne (0,049 avant), copie 0,051 (0,046) : + 12 à 26 % sur les longues pièces.
- **Conditions de la bascule** : (a) déployer le serveur seul (`firebase deploy --only functions:aiTask`, par le pilote), (b) ne brancher à l'écran `comptage-montants` en drapeau qu'avec la condition de la limite 2, (c) ne pas afficher de « payé » pour les tickets Bauhaus avant la limite 1, (d) rejouer un banc de 3 tirages sur les 11 pièces (≈ 1 CHF) après le déploiement, avant de dire que c'est tenu.

DÉCISION À PRENDRE : donner à c1 les propositions des limites 1 et 2 (payé = terminal quand il égale le total et qu'aucun reçu n'est imprimé ; comptage seulement confirmé par la 3.8 ou par `brut-rabais`) avant ou après le déploiement ? Recommandation : après ; elles ne dégradent rien de ce qui est mesuré, et se jugent mieux sur le banc déployé. Question au pilote sur la photo : la première ligne de la copie, 6,95 ou 86,95 ?

CONNAISSANCE : une garde déterministe (`quantiteSansCodeTva`) plus une consigne reformulée ont suffi à rétablir sunstore-1 (3 / 3) ; une quantité lue depuis la colonne du code TVA est un défaut des lectures Flash-Lite, que la 3.8 n'attrape que si elle est appelée (les deux Flash-Lite d'accord l'écartent). La date de doc1 diverge depuis le 01.11 : ce n'est pas un effet de c1.
LEÇON PROPOSÉE : avant d'attribuer une régression à une consigne, la rechercher dans les passes précédentes du même pièce (ici la date de doc1 variait déjà dans 8 passes sur 14) ; une pièce ne se déclare pas « régressée » sur un tirage.
