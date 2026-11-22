OK — f1 reprise 2 : T3-6, T3-7 corrigés (d1848500b) ; E1-2 non reproduit ; BE-27 et lecture-d ouverts (cause dite)

id | verdict | commit | test | rouge→vert | écran touché
---|---|---|---|---|---
TL-46 | ouvert | — | — | — | non
LR1-6 | corrige | eccd75e42 | tests/unit/depense/f1-tour3.test.tsx | 2 rouges → verts | oui
LR1-7 | corrige | eccd75e42 | tests/unit/depense/f1-tour3.test.tsx | 2 rouges → verts | oui
LR1-10 | corrige | eccd75e42 | tests/unit/depense/f1-tour3.test.tsx | 2 rouges → verts | oui
LR1-12 | corrige | eccd75e42 | tests/unit/depense/f1-tour3.test.tsx | 1 rouge → vert | oui
LR1-5 | corrige (partie client) | 7b199eb85 | tests/unit/depense/f1-tour3-b.test.ts | 7 rouges → verts | oui (rangée : plus de barré ni de « corrigée » pour une variante)
LR3-3 | corrige pour les noms ≥ 0,9 et « ? × ? » ; ouvert pour « montant de la voisine » et « ROULEAU barré sous DEBOUCREOR » : appariement des lignes (serveur `rangsProvisoires`, ou repli par position `tableDeRangs` M4), hors DÉCISION 1 | 7b199eb85 | f1-tour3-b.test.ts | 6 rouges → verts | oui
LR2-3 | corrige (compte et file sans la nature ; « Voir le désaccord » lit les mêmes points) | 7b199eb85 | f1-tour3-b.test.ts | 3 rouges → verts | oui
LR2-5 | corrige pour la part `kind` (5 points par tirage sur 11) ; le reste du compte vient du vote serveur | 7b199eb85 | f1-tour3-b.test.ts | idem | oui
LR3-4 | idem LR2-5 | 7b199eb85 | f1-tour3-b.test.ts | idem | oui
LR2-7 | corrige | 7b199eb85 | f1-tour3-b.test.ts | 24 rouges → verts (6 actes × 4 natures) | oui (bande Services)
LR3-9 | ecarte — D307 (sa maquette D) : un sous-groupe d'une seule ligne montre sa ligne sans chevron, dans l'ordre `SOUS_FAMILLES_RENOVATION` (« Peinture et sols » d'abord). Rejeu privé des 12 tirages : dans la 3.8, ROULEAU est la seule ligne « Peinture et sols » ; il n'a quitté aucun sous-groupe. La règle vétérinaire ne le touche pas | — | — | — | non
T3-6 | corrige | d1848500b | tests/unit/depense/f1-tour3-c.test.tsx | 1 rouge → vert (+ témoin « refus certain garde la feuille », vert avant et après) | oui (Nouvelle dépense, fermeture après Enregistrer)
T3-7 | corrige | d1848500b | f1-tour3-c.test.tsx | 2 rouges → verts | oui (pastille « Mon mois » du pied)
E1-2 | ouvert — non reproduit sur le code | d1848500b (2 témoins) | f1-tour3-c.test.tsx | verts avant et après | non
BE-23 | corrige (libellé) ; rouge non obtenu | d1848500b | f1-tour3-c.test.tsx | vert avant et après (le parcours testé n'atteint pas la barre « imprimé ? · g kg Stk ») | oui (barre de correction d'une ligne au stock sans unité)
BE-27 | ouvert — à juger sur capture | — | — | — | à capturer
lecture-d/serveur (3 rouges) | ne viennent pas de 7b199eb85 ; hors f1 | — | — | — | non

## Ajouts 7b199eb85 (LR1-5, LR3-3, LR2-3, LR2-5, LR3-4, LR2-7)
- `src/ui/depense/ressemblanceNoms.ts` : la même Levenshtein normalisée que `ressemblance` du serveur. Le module serveur tire node:fs et node:crypto, donc l'app ne peut pas l'importer. Le test compare les deux fonctions sur les mêmes paires.
  `finale.ts` `varianteDeNom` : une cellule de nom (description, nomLu, imprime.nom avec la même variante) dont la ressemblance est ≥ 0,9 prend la valeur de la 3.8 sans correction, sans barré et sans compte. `nameFr` est gardé.
- `etat.ts` `barreMuet` et `Ligne.tsx` : la rangée tait un barré fait seulement de « ? », « × » et « · ». « 30 ? » et « × 1,45 » restent. Le plateau garde « 1re lecture ? × ? » à côté de la 3e lecture.
- `confiance.ts` `pointsAMontrer` et `ExpenseSheet` : un désaccord sur `items.N.kind` sort des chips, du compte « n désaccords » et de la file. La rangée d'une famille qui entre en stock garde sa marque (`confianceLigne` lit tous les points, D328a).
  Aucun changement dans functions/. Ce qui reste du compte vient du vote serveur (DÉCISION 2 de r, déploiement de `aiTask`).
- `familles.ts` `ACTES` : les actes, consultations, soins et honoraires vont en Services, quelle que soit la nature lue. « stérilisation » et « infusion » en sont exclus, car ces mots servent aussi au brassage.
  Les médicaments et accessoires du doc2 (collerette, comprimés) ne bougent pas.
- Tests : `tests-rouge-2.txt` : 32 rouges sur 34 avant le correctif. Les 2 verts sont les témoins « vrai changement de nom » et « le brassage ne change pas ».
  `tests-vert-2.txt` : f1-tour3-b donne 34 verts sur 34. Avec les tests liés (f1-tour3, lecture-d, g7, bandes, rangees, familles), 343 verts et 3 rouges. Les 3 rouges sont dans `lecture-d/serveur.test.ts` (empreinte du moteur des modules functions/ ai, invoiceScanVote et invoiceVisionReview).
  Je n'ai touché aucun fichier functions/ : ces rouges sont à rejouer par le pilote (autre session ?).
- tsc : aucune erreur dans les fichiers de f1. `git show --stat 7b199eb85` : 8 chemins, tous à f1.

## Reprise 2 faite (d1848500b : ExpenseSheet.tsx, ongletMois/OngletMois.tsx, tests/unit/depense/f1-tour3-c.test.tsx)
- T3-6 : cause. `confirmPurchase` relit la dépense sur le serveur (`waitForDocument`, 15 s). Page figée ou réseau lent : délai dépassé, erreur `pending` (jamais un refus). La dépense est déjà écrite dans le cache et listée, mais la feuille restait sur « Vérifier la synchronisation ».
  Correctif (`save` d'ExpenseSheet) : sur `pending`, si la dépense `TX-<submissionId>` est listée ici, la feuille fait comme hors ligne (T5). Elle appelle `watchPurchaseConfirmation` (accusé hors feuille ; un refus plus tard met le job en `voided`, et le bandeau d'écriture d'App le dit), puis `onSaved` et ferme, ou montre le reçu Drive s'il y en a un.
  Inchangé : un refus certain, un conflit, ou une écriture non listée gardent la feuille et le brouillon (tests existants de expenseSheet.test « pending/rejected » : getTransactions vide, donc comportement d'avant).
- T3-7 : la pastille vient de `BoutonMois` (src/ui/finance/ongletMois/OngletMois.tsx), pas de Pied.tsx. Elle signait l'écart du dépensé (+100 c). Elle dit maintenant le sens de l'argent : sortie (dépense, matériel) en « − », vente en « + ». Les tuiles de la carte (« payé », « à payer », dont l'écart est la hausse de chaque total) ne changent pas.
  Fichier hors « Possède » (une ligne), touché parce que le pilote m'a confié T3-7 : à signaler.
- E1-2 : la donnée de l'écran est juste. Deux ordres de gestes, « pièce » posée sur trois lignes par les cases « Unité à remplir » : le brouillon enregistré porte `unit:'pièce'` et la quantité 1 sur les trois lignes.
  `savePurchase` écrit `unit: line.unit || undefined` ; la fiche (`fiche/FactureLignes.tsx`) affiche `quantité + uniteAccordee(unité)`. « · 1 » sans unité veut donc dire une ligne enregistrée sans unité : une quantité 1 posée sans unité (« +1 », `totalSeulEnUn` quand on change la nature, le champ texte « Unité » vidé).
  Je n'ai pas retrouvé le geste. Le code en ligne (tag en-ligne/2026-11-19-tour2) ne diffère de HEAD que par mes commits f1.
- BE-23 : `correctionBarre` d'ExpenseSheet proposait les boutons g, kg et « Stk ». Ils écrivent maintenant « pièce ». La ligne de tête passait déjà « Stk » en « pièce » (`uniteAffichee`). Le test témoin (Acheter du matériel, « ajouter 5 », aucun « Stk » à l'écran) est vert avant et après : changement de libellé seul, sans rouge.
- BE-27 : marge sous la barre « Enregistrer » d'Acheter du matériel. Non mesurable en jsdom ; Atelier › Matériel a été refait depuis (BUGS : « à revoir sur capture »). À juger sur la capture ci-dessous.
- lecture-d/serveur.test.ts, 3 rouges : `ENOENT …/functions/src/hopAdviceContentReference.ts`. `engineDigestOf` lit un module `.ts` qui n'existe pas : seuls `.js` et `.d.ts` sont suivis, et l'import vient de brewerHopAdviceContextBinding.ts.
  Aucun lien avec 7b199eb85 : il ne touche ni functions/ ni ce test. Les derniers changements de functions/src/ai, invoiceScanVote et invoiceVisionReview datent du 18.11 (dfdcd6977). À corriger dans functions/ (le moteur d'empreinte ou le module manquant), donc hors f1.
- Tests : `tests-rouge-3.txt` : f1-tour3-c sur les sources de HEAD, 3 rouges sur 7 (T3-6, T3-7 ×2). `tests-vert-3.txt` : f1-tour3-c, f1-tour3, f1-tour3-b, expenseSheet, raccord, depensePiece, depenseS1, depenseFermerEtType, effetPiece, apportPoches : 211 verts, 1 rouge.
  Le rouge, expenseSheet.test.tsx:155 (« lit dès le choix du fichier… », amount 555), échoue aussi sur ExpenseSheet de HEAD : il existait avant.
- tsc : aucune erreur dans ExpenseSheet, OngletMois ni f1-tour3-c. `git show --stat d1848500b` : 3 chemins, tous à f1.

## État à capturer (autre voie, `?dev-local`, 390 tactile et 1280, clair et sombre)
1. T3-7 : Finances › Nouvelle dépense, total 1,00, catégorie, « À payer ». Le bouton « Mon mois » du pied doit montrer « −1,00 » (pas « +1,00 »), et sa carte ouverte (tuiles « à payer +1,00 » inchangées).
2. T3-6 : non montrable sans réseau lent. En dev-local, `waitForDocument` répond tout de suite. Le pilote peut seulement vérifier qu'après Enregistrer la feuille se ferme et que la dépense est listée.
3. BE-27 : Atelier › Acheter du matériel, une ligne « Créer la fiche de ce matériel », défiler en bas à 390. La phrase « La fiche reprendra le prix et la date… » doit être lisible au-dessus de la barre « Enregistrer ».
4. BE-23 : Nouvelle dépense, une ligne au stock sans unité. La barre « imprimé ? · g kg pièce » ne contient pas « Stk ».
5. E1-2 (si le pilote rejoue en ligne) : noter chaque geste par ligne (unité choisie où, quantité posée comment, nature changée ?), puis lire en lecture seule `finance.lines[].unit` de la TX annulée « ZZ TEST — e1 dépense » (gardée, annulée). Cela tranche entre donnée et rendu.

## REPRISE 2 (agent à 170 k : la suite dans un agent neuf)
1. T3-6 : Nouvelle dépense. La feuille reste ouverte sur « Confirmation de cette écriture en attente… » alors que l'écriture est déjà listée (ExpenseSheet.tsx). Priorité haute.
2. T3-7 : une dépense à payer de 1,00 fait dire « +1,00 » à la pastille « Mon mois » (src/ui/depense/Pied.tsx). Priorité haute (montant).
3. E1-2 (vu en ligne) : une saisie à la main, « pièce » choisie sur les 3 lignes. Après Enregistrer, la fiche dit « … · 1 » sans unité pour les lignes 1 et 2, et « l3 · 1 pièce » pour la 3e. Trouver la cause (donnée ou rendu).
   Constats : dépôt Brasserie, `git grep -n "T3-6\|T3-7"` (work/missions/BUGS.md, RAPPORT-3.md de la session t3).
4. Captures 390 et 1280, deux thèmes (`?dev-local`, réponse simulée) : bloc pendant la lecture provisoire, ligne « 2 × 25,00 » déduite, plus les états de la DEMANDE EXECUTANT ci-dessous.
Chaque fois : test rouge, puis vert, puis commit par chemins.

## Ce qui est fait
- TL-46 ouvert. Question exacte : « Saisir sans justificatif » doit-il ouvrir l'écran à bandes (Garder/Retirer, Confirmer) au lieu du formulaire simple ?
  Aucune décision écrite ne tranche. SPEC-BRASSEUR.md:1602 dit : « si la saisie à la main elle-même doit prendre la forme de la facture lue, c'est un choix à montrer en maquettes ».
- LR1-6 : `controlesProvisoires` (controlesCroises.ts). Pendant `verif==='attente'`, chaque rangée en écart devient neutre et dit « en cours » ; son libellé perd le « ≠ ». Le drapeau et l'en-tête se taisent. Le pied « Détail » garde son ancienne règle (caché si le brut a un écart).
- LR1-7 : `prixDeLaRangee` (calculPlateau.ts). Le prix = montant ÷ quantité (`prixCalcule` existant), affiché en jaune « repris » (D277) avec `data-dp-prix-deduit` et le title « prix déduit : montant ÷ quantité, non imprimé ».
  Il n'est jamais écrit dans la ligne : aucun montant, aucune TVA ni aucun arrondi ne change. Le bloc dit toujours « 1 sans prix unitaire » : c'est vrai, l'arithmétique n'est pas vérifiable.
- LR1-10 : `chercherLignes` prend en plus les valeurs d'avant la 3.8 (`fusion.avant` : référence, nomLu, imprime.nom, description). Les lignes barrées sont aussi cherchées : la rangée trouvée et sa bande restent montrées (`Liste` reçoit `perduesVues`).
  Le compte « n trouvées » ne compte toujours que les lignes de la dépense.
- LR1-12 : `sansMotsBruts` écrit les décimales à la virgule dans les parenthèses (« 2,6 % »). Les dates à deux points ne changent pas ; le nom hors parenthèses non plus.

## Preuves
- Tests : `tests-rouge.txt`, 7 échecs sur 7 avant le correctif (fonctions absentes, « — » au lieu de 25,00, drapeau « 1 » pendant l'attente, EAN non trouvé, « 2.6% »).
  `tests-vert.txt` : f1-tour3 et 62 fichiers liés, 1431 verts et 2 rouges. Les 2 rouges sont dans `tests/integration/carnetsParcours.test.tsx` (D2 CARNET-COEUR, D3/D7).
  Ce test n'importe aucun fichier de f1 : il lit `src/ui/carnets` et `src/domain/carnets`, modifiés hors commit par une autre session ou par la voie r. Je ne l'ai pas touché, à signaler au pilote.
- tsc : aucune erreur dans les fichiers de f1.
- `git show --stat HEAD` (eccd75e42) : 7 chemins, tous à f1.
- Captures : pas faites. COMMUN-CODE interdit le navigateur, VOIE.md demande 390 et 1280 dans les deux thèmes : le relais est dans DEMANDE EXECUTANT.

## REPRISE (contexte de l'agent à 160 k : le reste dans un agent neuf)
Ajouts du pilote, voir `voies/r/RESULTAT.md` § DÉCISIONS :
1. LR1-5 et LR3-3 : dans `src/ui/depense/finale.ts:199`, `memes` compare en JSON strict. Il faut taire l'ancienne valeur barrée quand la ressemblance des noms est ≥ 0,9, avec `ressemblance` du serveur, déjà exportée (à localiser par `git grep -n "export.*ressemblance"`).
   Écrire d'abord un test rouge : une paire de noms à 94-95 % ne pose pas de « corrigée ».
2. LR2-3, LR2-5 et LR3-4 : si les points de désaccord reçus portent le nom du champ (`champ`, par exemple `kind` ou « nature »), ne pas compter `kind` dans le compte affiché. Cela se fait côté app seulement, dans ExpenseSheet `nDesaccords` et les chips `lectures-divergentes`.
   Sinon, la ligne devient `ouvert — fonction serveur` (`functions/src/invoiceVisionReview.ts:418-428`).
3. LR2-7 et LR3-9 : ajouter une règle « actes vétérinaires / services » dans `src/ui/depense/familles.ts`, avec un test rouge puis vert.
Même règle de commit par chemins.

## État à montrer pour la vision (`?dev-local`, Finances › Dépense)
- Pendant la 3e lecture (fil de vérification) : le bloc de contrôles sans drapeau ni pastille, les écarts en « en cours ».
- Une ligne « 2 × 25,00 · 50,00 » au prix jaune pointillé (déduit).
- « Chercher une ligne » avec l'EAN d'une ligne barrée : la rangée barrée reste visible.
- Le pied d'un désaccord TVA « 2,6 % ».

DEMANDE EXECUTANT :
- Dans port-carnet, suivre `.claude/skills/webapp-testing/SKILL.md` (dossier Brasserie). Servir l'app en `?dev-local`, ouvrir Finances › Dépense, lancer l'aperçu de lecture lente (`src/ui/depense/apercuDev.ts`, `lecturesLenteur`).
- Capturer chaque état ci-dessus en 390 tactile et en 1280, thèmes clair et sombre, dans `voies/f1/captures/` (`f1-<état>-<390|1280>-<clair|sombre>.png`). Arrêter le serveur ensuite.
- Attendu : aucun drapeau rouge pendant le fil ; « 25,00 » en jaune ; la rangée barrée visible après la recherche de l'EAN.
- Rendre la liste des captures à f1 (ou au pilote), qui les ouvre et les juge.

DÉCISION À PRENDRE (T3-6) : fermer la feuille sur une confirmation en retard d'une écriture déjà listée, comme hors ligne (fait), ou garder « Vérifier la synchronisation » (avant). Recommandation : garder le correctif. Réversible en une ligne. Un refus serveur plus tard n'a plus de brouillon ouvert, mais le bandeau d'écriture le dit, comme pour T5.
DÉCISION À PRENDRE : TL-46 (ci-dessus). Options : A, le formulaire simple reste ; B, l'écran à bandes aussi sans justificatif. À montrer au brasseur en mini maquettes. Recommandation : A tant qu'il n'a pas choisi.
CONNAISSANCE : dans ExpenseSheet, une rangée barrée (`perdues`) n'est pas dans `draft.lines`. Toute recherche ou tout filtre qui ne lit que `draft.lines` la masque, et sa bande avec elle (Liste cache une bande sans ligne visible).
LEÇON PROPOSÉE : aucune
