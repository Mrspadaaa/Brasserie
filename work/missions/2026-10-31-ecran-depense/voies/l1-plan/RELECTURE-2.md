# Relecture 2 de PLAN.md v2 (l1-plan) : RELECTURE OK

Relecteur neuf, lecture seule hors ce fichier. Lu : RELECTURE.md (B1 à B3, M1 à M7, m1 à m7), PLAN.md v2 en entier, RESULTAT.md, D312, et le code cité.
Je ne rouvre ni le flux, ni les temps, ni le cache, ni « aucune règle, aucun index » (acceptés en relecture 1).
Les lignes d'`ExpenseSheet.tsx` ont encore bougé depuis la v2 (r4-port-d non commité, HEAD 18e3dc00) : voir « Références ».

## Point par point

- **B1, base de comparaison : réglé.** PLAN.md § 4 bis « La base » : la base est l'instantané du brouillon posé par `applyOutcome(provisoire)`, par id et
  par cellule, tenu à jour par le seul `.then` de `traduireLignes` ; le final repasse par les mêmes transformations (`lignesDeLecture`, extraite
  d'`applyOutcome`) avant toute comparaison. Le témoin E1 (unité déduite non touchée, corrigée par la 3.8) échoue si la comparaison se fait sur la valeur
  brute. Un codeur n'a rien à deviner sur la base.
- **B2, cellules d'en-tête et dérivées : réglé.** Deux tables (en-tête, rangée), avec la source de chaque cellule et son registre. Je les ai confrontées au
  code : les registres `reviewed('vendor' | 'date' | 'invoiceNumber' | 'amountTTC' | 'tvaAmount' | 'category' | 'currency' | 'paymentEvidence')` existent
  tous dans `ExpenseSheet.tsx` (`reviewed`, l. 206), `paymentDateBasis === 'typed'` est respecté par `applyScannedPayment` (`purchasePrefill.ts:146`),
  et le seul registre manquant (HT) est mis à la charge d'E. `alphaPct` et `vatCode` sont dits « suivent le résultat remappé ». Témoin E2 (date tapée).
- **B3, renumérotation : réglé.** Table unique « rang final → id du brouillon », appliquée à `points[].ligne/lignes/champs/cle` (+ `signature` recalculée),
  `controls.lines.skippedIds`, `remarques[].ligne`, `rejets[].ligne` et `items`. Lignes ajoutées : `line-${nProvisoire + k}`, avec la raison (lue dans
  `confiance.ts:320`). `valeurs[].ligne` et `linesLost` dits non touchés. Témoin E3 sur `skippedIds`. Les champs listés existent (`invoiceVisionReview.ts:84,89`,
  `invoiceControls.ts:127`, `geminiScanner.ts:138,144`).
- **M1, états de l'écran : réglé.** § 4 ter : `verif` distinct de `busy`, `showForm` vrai au morceau, `scanLocked` reste vrai, « Fermer » permis (le shell ne lit
  que `busy||saving`, `ExpenseSheet.tsx:1142`, et `fermerOff` dans `Entete.tsx:10,17`), « Rattacher » et « Changer » désactivés, `save` gardé, `attach` et
  `lirePages` gardent un seul `await`. Témoins E5 et E6.
- **M2, fin de partie : réglé** (bornage côté client à 150 s ou après la seconde reprise ratée ; côté serveur non, c'est D312 (4)). Témoin E14. Il reste
  un flou mineur (voir R1 plus bas) qui ne change pas le résultat prévu.
- **M3, appariement : réglé.** Mesuré et rejoué par moi : voir plus bas. Repli par la position décidé et placé dans S (témoin S7), avec l'équivalent client
  dans E (E4).
- **M4, cache, `degraded`, ancien serveur : réglé.** Plus de `apresProvisoire` ; un jeton par appel, comparé à celui du morceau reçu. Le `degraded` resservi
  porte `cached:true` (`invoiceScanBudget.ts:145`, vérifié) et `ai.ts:203` rend `cached:reviewed.cached`, donc le jeton de l'appel n'y figure pas. Règle d'un final
  sans jeton égal écrite (position si même longueur, sinon provisoire gardé et `echec`). Témoins S9, C5, E4.
- **M5, périmètre et ordre : réglé.** `Verdict.tsx:16`, `etat.ts:17`, `types.ts:9-14` ajoutés à E (existent, et disent ce que le plan dit) ; un fichier de test
  par voie ; ordre r4-port-d, l2-lignes, S et C, E, B, puis n3-ht après E. `ScanOutcome` et `ScannedInvoiceResult` vivent dans `geminiScanner.ts` (voie C) : pas de
  fichier de type orphelin.
- **M6, coût et course de la traduction : réglé.** « Identiques » devient « + un `traduireNoms` au final », borné à 0,005 CHF, 10 pièces sur 12 (chiffre
  rejoué : « NOMS 10/12 »). La fusion incrémente `nomsJeton` (l. 367, garde l. 370) et efface `nameFr`. Témoin E11. Le 0,005 CHF et les 4,1 s sont bien dans D280
  (`decisions.md:1241`).
- **M7, banc B : réglé.** Le shim de page (`window.fetch`, l. 275-305 : `new Response(payload…)` d'un bloc, `__jus0Bridge` l. 301, exposé l. 2283) et
  `callableAnswer` (l. 309) sont dans le périmètre de B ; réponse `ReadableStream` construite dans la page avec `delaiMs`, cas « flux fermé sans résultat ».
  `lancer.sh` existe (`voies/e-bout/lancer.sh`).
- **m1 à m7** (hors périmètre demandé, vus au passage) : tous repris dans le plan (cinquième paramètre, cible comptée une fois, `applyOutcome` jamais rappelé,
  octets en texte brut, `reglees` par signature, PWA ancienne).

## Mesure M3 rejouée (hors ligne, sans appel)
`./node_modules/.bin/vite-node work/missions/2026-10-31-ecran-depense/voies/l1-plan/apparier.ts -- --banc=banc-k6-C` : sortie identique au plan.
`APPARIER 12/14 pièces avec provisoire : 183 lignes rapprochées sur 184 provisoires (99.5 %) et 190 finales (96.3 %) ; sans paire 1 provisoires, 7 finales,
sur 7 pièces ; repêchables par la position 1 (listes de même longueur : 6 pièces) ; … rapprochées et changées 80` ; `NOMS 10/12 … (52 lignes)`.
Le 183 sur 184 est confirmé (doc13, une ligne, nom et montant changés, est la seule sans paire, repêchée par la position).

## Références vérifiées sur le code (14 tirées, au-delà des 10 demandées)
Exactes et conformes : `ai.ts:203` ; `invoiceScanBudget.ts:26` et `:139-145` ; `invoiceControls.ts:127` ; `confiance.ts:320` ; `invoiceVisionReview.ts:84,89` ;
`geminiScanner.ts:138,144` ; `purchasePrefill.ts:144,146` ; `purchaseEntry.ts:216` ; `aiTaskDeadline.ts:27` ; `Verdict.tsx:16` ; `etat.ts:17` ; `types.ts:9-14` ;
`ExpenseSheet.tsx` 367, 368, 370, 402, 411, 520, 722, 967 ; shim et pont de `check-invoice-journey-emulator.mjs` (275-305, 301, 2283, 309).
Décalées de 1 à 3 lignes dans la copie de travail actuelle (le plan avait prévenu : r4-port-d édite encore le fichier) : Confirmer 993 (maintenant 995), justificatif
caché 998 (1000), `dismissible` 1140-1141 (1142), garde du formulaire 1152 (1155). Les noms de fonction et de champ restent justes. Aucune référence fausse.

## Défauts restants (non bloquants, à corriger au passage ou par le codeur)
- **R1 (fin de partie, M2).** « la phrase … posée par le client sur le provisoire » ne nomme pas le moyen. Le cas « 3.8 en échec » d'aujourd'hui, c'est le point
  `lecture-coupee` (`invoiceVisionReview.ts:216-227`, `pointLectureCoupee`, `ajouterCoupure`, `phraseCoupure('delai-saute')`), pas seulement une phrase : sans lui,
  `confiance.ts:282` ne marque pas les lignes « repris » et des valeurs non vérifiées passent sans drapeau. Ces fonctions sont exportées et `src` importe déjà
  `functions/src/*` (App.tsx:9). Correction : écrire dans E « le client appelle `ajouterCoupure(provisoire, 'delai-saute', phraseCoupure('delai-saute'))` ».
- **R2 (chiffre).** PLAN.md:328 et § 2 bis disent « 7 lignes sur 6 pièces » ajoutées ; après le repli de doc13, c'est 6 lignes sur 6 pièces (la 7e finale sans paire est
  repêchée). Et PLAN.md:329 dit « 1 ligne sur 184, repêchée par la position » pour « ne lit plus » : elle n'est plus orpheline. Le cas reste réel (listes de longueurs
  différentes), l'ordre de grandeur est juste, la phrase est à ajuster.
- **R3 (D312 non reflété).** Le plan finit sur « DÉCISION À PRENDRE (1) à (3) », déjà tranchée par D312 (l3-cas pour l'en-tête corrigé et la 3.8 qui n'arrive jamais, E code
  A et ne les attend pas ; (3) et (4) non). L'ordre de § 5 ne nomme pas l3-cas : sans conséquence, E n'attend rien. À mettre à jour par le pilote pour ne pas faire attendre E.
- **R4 (implicite).** « Remapper `points[].ligne` » : la valeur est le numéro de l'id (`line-N` donne N), pas la position dans `items` (une ligne ajoutée au milieu a un
  `ligne` de `nProvisoire + k`). La phrase « items remis dans l'ordre du brouillon » ne le dit pas. Un codeur attentif le déduit de `confiance.ts:320` ; une ligne le fixerait.
- **R5.** `traduireLignes` rend une `Map<rang, nameFr>` où le rang est la position dans la liste envoyée : pour la seconde traduction (lignes changées seulement), E doit
  reporter le rang de la sous-liste vers l'id. Détail de code, hors résultat.

## Non vérifié
Comportement de Cloud Run après déconnexion et tampon éventuel du réseau Google sur SSE (le plan les dit lui-même) ; l'interface (maquettes d-06, d-15, d-lue) n'est pas de mon
ressort (critique, L25).

## Verdict
RELECTURE OK : B1 à B3 et M1 à M7 sont réglés dans PLAN.md au point que les voies S, C, E, B n'ont plus à deviner ce qui change le résultat ; la mesure M3 se rejoue à l'identique
(183 sur 184) ; les références sont exactes (décalage de lignes d'ExpenseSheet.tsx seulement). Les cinq restes ci-dessus sont des précisions, aucun ne bloque. R1 est le plus utile à écrire avant E.

LEÇON PROPOSÉE : un plan qui renvoie à « la forme d'un cas existant » (ici la 3.8 coupée) doit nommer la fonction qui la produit et ce qu'elle ajoute (point, phrase, drapeaux), car le
codeur ne reproduit que ce qui est écrit ; et un plan qui cite des lignes d'un fichier en cours de port (ExpenseSheet.tsx) doit citer le nom de la fonction ou du champ avec la ligne.
