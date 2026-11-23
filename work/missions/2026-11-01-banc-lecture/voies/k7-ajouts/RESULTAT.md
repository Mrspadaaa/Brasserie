OK — suite du 08.11 : banc allège les photos comme l'app, BANC SIMULE OK sur 17 pièces, estimation 2,49 CHF au pire ; commande payante prête (--budget-chf 9.85, pas 1.2)

## SUITE DU 08.11 (réponses du pilote) — une ligne par point ; remplace §6 et les deux décisions ci-dessous
1. doc1 : la vérité « pas de date » reste ; aucun fichier de vérité touché.
2. Allègement (option c) : `scripts/banc-lecture-alleger.ts` (neuf) ; mêmes niveaux que `allegerPhoto`, importés de `src/services/pagesJustificatif.ts` (`NIVEAUX_PHOTO`, `PAGE_OCTETS_MAX` : 4096 à 0,85, puis 3200 à 0,85, puis les niveaux du PDF ; le premier sous 4 Mo gagne) ; sharp n'est pas installé, outil = `@napi-rs/canvas` du dossier d'outils du banc (hors dépôt), qui applique l'orientation EXIF ; copies en mémoire seulement (échantillon d'essai dans `os.tmpdir()`), rien dans le dépôt. Branché dans `loadCaseFiles`, `runBench` et `--estimer`. Résultat réel : doc15 8,0 Mo → 3,7 Mo, doc21 6,2 Mo → 2,7 Mo (4096 à 0,85, 3072×4096) ; doc21 ouverte en image : droite, lisible. Test : `tests/unit/banc-lecture-alleger.test.ts` (9 tests : niveaux, ordre, légère/PDF intactes, échec = original, fichier réel de 5 Mo accepté après allègement, budget).
3. Pourquoi plus de faux vert : ni une règle neuve ni un simulateur cassé. Les vérités (dates non imprimées, lignes sans prix, totaux avec port) fabriquent des réponses « propres » que la production déclare déjà à confirmer (`date-absente`, `somme-ecart`, `somme-incomplete`) : sur 14 pièces simulées sans faute, 13 sont `disputed` (preuve : doc5 et doc9 `disputed` aussi à leur tirage propre) ; les fautes glissées de A et Csv8 tombaient sur des pièces déjà en alerte. Seule doc13 reste `checked`. Correctif : une faute `date-plausible-propre` (`FAULT_PLAN`, doc13, tirage 1) : la même date fausse mais plausible dans les deux lectures de chaque variante ; la production ne contrôle que l'absence et la forme d'une date, jamais sa valeur, donc aucun point ne peut la signaler. Le contrôle n'est pas affaibli : `checkSimulation` inchangé (il exige toujours des faux verts, 100 % des fautes retrouvées, aucun champ faux sur parcours propre). Résultat 17 pièces, Csv8 : `BANC SIMULE OK — 104/104 fausses réponses fabriquées retrouvées, 2 faux verts comptés, 30 parcours propres sans champ faux, aucun réseau` ; A, Csv8, Csv8F sur 3 tirages (cas 1 à 5) : `BANC SIMULE OK — 128/128 … 6 faux verts … 270 parcours propres`.
4. doc3, détail (valeurs privées) : `H13-reels/banc-k7-doc3-detail-prive.json`, hors Git. Sans donnée personnelle : sur doc3 (deux bulletins de prime), la lecture met un numéro de contrat dans « n° de commande » (aucun contrôle ne vise ce champ, les trois lectures s'accordent) et lit deux lignes de prime (aucun point sur la première : quantité et prix nuls, donc contrôles de ligne sautés, somme non vérifiable ; la seconde est signalée par `lignes-non-rapprochees`, qui vise la jonction, pas l'excédent) ; la vérité « aucune ligne » est peut-être trop stricte (décision du brasseur).
5. Les 3 échecs de `banc-lecture-k5.test.ts` ne sont PAS anciens : sur 65d3c645, 40/40 passent ; sur HEAD (b3bdcdbf), les mêmes 3 échouent. Cause : le commit 92de7371 (08.11, « le total d'une facture lue en morceaux n'est plus perdu ») a réécrit `totalsRule` dans `functions/src/invoiceMorceaux.ts` (chaque partie lit les totaux qu'elle porte, plus de « Lis aussi les totaux » réservé à la dernière) sans mettre à jour les tests du banc. Corrigé : 3 assertions mises à la nouvelle phrase (`tests/unit/banc-lecture-k5.test.ts`), 6 fichiers de tests du banc verts, 281 tests.
6. Simulation puis estimation sur 17 pièces (doc1 à doc14, doc15, doc16, doc21), Csv8 + N, 1 tirage : simulation OK (point 3) ; `BANC ESTIME 2.4853 CHF 51 appels neufs` (réserve au pire : sortie au plafond de chaque appel, 0,96 CHF Flash-Lite + 1,53 CHF 3.8 ; réel attendu environ 0,75 CHF, 0,044 CHF par pièce en k6). Déjà journalisé : 8,6533 CHF.
   `--budget-chf` est un plafond de CUMUL (code : `Budget(limite, déjà journalisé, plafond de passe)`) : `--budget-chf 1.2` s'arrêterait au premier appel (8,65 déjà dépensés), prouvé par un test. Pour une passe d'environ 1 CHF : cumul 9.85 (8,65 + 1,2) et plafond de passe 1.2.
   Commande payante, NON LANCÉE :
   `npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --payant --budget-chf 9.85 --plafond-passe 1.2 --confirm-paid-ai --variantes Csv8 --normaliser --repeat 1 --cas cas.json,cas-2.json,cas-3.json,cas-4.json,cas-5.json,cas-6.json --docs doc1,doc2,doc3,doc4,doc5,doc6,doc7,doc8,doc9,doc10,doc11,doc12,doc13,doc14,doc15,doc16,doc21 --out work/finalisation-tickets-2026-10-08/H13-reels/banc-k7-prod`
   Puis, sans réseau : `npx vite-node --config vitest.config.ts scripts/banc-lecture-ajouts.ts -- --ajouts=work/finalisation-tickets-2026-10-08/H13-reels/banc-k7-prod --out=<tableau.md> --prive=<valeurs privées.json>` et `scripts/banc-lecture-facture-juger.ts -- <dossier>`.
   Limite : la réserve de 3.8 (au pire 0,09 CHF) fait arrêter la passe nette si la dépense réelle approche 1,1 CHF ; elle reprend avec `--reprendre`.
Fichiers de la suite : `scripts/banc-lecture-alleger.ts` (neuf), `scripts/banc-lecture-facture.ts` (import, `loadCaseFiles`, `runBench`, `--estimer`, `FAULT_PLAN` : une faute), `tests/unit/banc-lecture-alleger.test.ts` (neuf), `tests/unit/banc-lecture-k5.test.ts` (3 assertions). Hors périmètre, non touché : `src/**`, `functions/**`.

Les valeurs des pièces ne sont pas écrites ici (règle du banc : jamais dans Git ni un RESULTAT). Elles sont dans un fichier privé hors Git : `work/finalisation-tickets-2026-10-08/H13-reels/banc-ajouts-valeurs-prive.json` (pièce, variante, champ, valeur, signalée, d'où vient le signal).

## 1. Définition retenue
Ajout = valeur que la lecture FINALE rend alors que la vérité dit qu'elle n'est pas sur le document. Une absence n'est jamais un ajout ; une clé que la vérité ne juge pas n'est pas mesurée.
- En-tête : date, n° de facture, n° de commande, HT, TVA, taux, TTC, devise non vides quand les vérités sont toutes vides/null ; paiement « paid » ou « unpaid » quand la vérité ne l'admet pas (« unknown » est prudent). Le fournisseur est exclu : dans le juge, une vérité `vendor` vide veut dire « non jugé », pas « absent du document » (sans cette exclusion, doc1 comptait un faux ajout : trouvé et corrigé).
- Ligne en plus : lignes lues au-delà des lignes de la vérité (port exclu des deux côtés, D249 ; une ligne marquée `invisible` existe, la lire n'est pas un ajout). La ligne en trop est repérée par nom, puis par la queue de la liste.
- Valeur de ligne : quantité, prix ou montant lus quand la vérité dit null (alignement par position, comme le juge).
- « Signalée » = la règle de l'écran Dépense, importée et non copiée : points recalculés comme l'écran (`recomputeInvoicePoints`), un point compte s'il PÈSE (`peserPoint`), et vise la case via `ciblesDuPoint`/`TABLE_POINTS` de `src/ui/depense/confiance.ts`. Un désaccord dont `pese` est faux (majorité) ne signale rien. En-tête : la case est visée (date, numéro = facture ET commande, TVA = HT + TVA + taux, total = TTC + devise, document = paiement), ou `fieldWarnings`/`rejets` du champ. Ligne en trop : un point qui pèse vise son rang (`ligne`, ou `lignes` pour l'écart de somme et la jonction), ou `ambiguity`. Un doute sur la liste seule (chip « Lignes ») est noté à part (`listeSignalee`), jamais compté comme signal. Valeur de ligne : un point qui pèse vise la case (quantité, prix, montant) de la ligne.
- Deux mesures : « large » = la règle de l'écran (case) ; « étroite » = un point nomme CE champ.

## 2. Fichiers
- `scripts/banc-lecture-ajouts.ts` (neuf) : `mesurerAjouts`, `ajoutsDuBanc`, `compterAjouts`, `renderAjouts`, ligne de commande `--ajouts=<sortie>[,…]` et sonde `--qr-pièce=docN`.
- `scripts/banc-lecture-facture-juger.ts` : 7 lignes, option `--ajouts` (import tardif, imprime le compte par variante). Elle ne s'affiche pas si le jugement sort en `BANC SIMULE ECHEC` (exit avant la fin de l'import) ; la ligne de commande du nouveau module est la voie sûre.
- `tests/unit/banc-lecture-ajouts.test.ts` (neuf) : 26 tests, données fabriquées, aucun réseau.
- Tableaux (hors Git, avec les sorties) : `H13-reels/banc-k6-ajouts.md`, `H13-reels/banc-ajouts-payes.md`.

## 3. Test
`npx vitest run tests/unit/banc-lecture-ajouts.test.ts` : 26 passés. Il couvre : ajout non signalé compte ; ajout signalé (désaccord qui pèse, `fieldWarnings`, ligne ambiguë, point sur le rang de la ligne, quantité × prix ≠ montant) ne compte pas comme non signalé ; désaccord qui ne pèse pas ou point d'un autre champ ne signale pas ; une absence n'est pas un ajout (vide, null, alternatives admises, clé non jugée, moins de lignes, quantité null) ; port et ligne invisible ; vendor vide non jugé ; le tableau publiable ne contient aucune valeur.
Hors périmètre, non causé par moi : `tests/unit/banc-lecture-k5.test.ts` a 3 échecs (Pv, Bv : phrases de rang des consignes, `functions/` modifié par un autre agent) ; je ne les ai pas rejoués sur HEAD.

## 4. Chiffres sur les sorties déjà payées (aucun appel réseau)
Compte par parcours (un même ajout répété sur plusieurs tirages compte plusieurs fois). Large : ajouts / non signalés ; étroit : non signalés au sens étroit ; « vérifié » : non signalés sous un statut `checked`.

| sortie, variante | parcours | ajouts / non signalés | dont « vérifié » | en-tête | lignes en plus | valeurs de ligne |
|---|---|---|---|---|---|---|
| k6-AC, A (13 pièces) | 13 | 7 / 6 | 0 | 5 / 4 | 2 / 2 | 0 |
| k6-AC, C★v8 (14 pièces) | 14 | 6 / 3 | 1 | 4 / 2 | 2 / 1 | 0 |
| k5-C, C★v8 | 13 | 15 / 7 | 0 | 12 / 6 | 3 / 1 | 0 |
| f5-F, C★v8F | 14 | 11 / 5 | 1 | 9 / 5 | 2 / 0 | 0 |
| k1, A (3 tirages × 7) | 21 | 15 / 10 | 0 | 9 / 7 | 6 / 3 | 0 |
| k1, C | 21 | 6 / 4 | 0 | 3 / 2 | 3 / 2 | 0 |

Détail de la production (k6, C★v8 ; la mesure étroite donne le même résultat) :
- doc1 : `date` non signalée, statut « vérifié » (le seul faux vert de k6). Valeur = la date de début de période de l'abonnement (voir § 5).
- doc3 : `orderNumber` non signalé (numéro de contrat de l'assureur lu comme n° de commande ; vérité vide). Deux lignes en plus (les deux primes des bulletins QR ; vérité sans ligne) : une non signalée, l'autre signalée par `lignes-non-rapprochees`.
- doc6 : `tvaAmount` (entier rond) signalé par un désaccord des lectures.
- doc14 : `amountHT` signalé par `ht-tva-ttc`.
- En A (production déployée) : mêmes ajouts, en plus doc11 `amountHT` à trois décimales (non signalé) ; doc6 `tvaAmount` non signalé ; la ligne en plus de doc3 jamais signalée.
- Valeurs de ligne : 0 ajout sur les 9 sorties (aucune quantité ni prix inventés là où la vérité dit null).
- paiement « paid » : 0 ajout.

À lire : l'ajout est déjà compté faux par le juge (champ faux), et il est un faux vert seulement sous « vérifié ». Ce que la mesure neuve apporte : la plupart des ajouts non signalés se trouvent sous un statut « à confirmer » global, sans que la case concernée soit marquée. Dans k6, C★v8 : 6 ajouts, 3 non signalés, 1 seulement sous « vérifié ». Peu de pièces : un indice, pas une mesure.

## 5. La date de doc1 (15.10.2026)
Elle ne vient pas du QR : doc1 n'a pas de QR-facture.
- Preuve 1 : `--qr-pièce=doc1` (zxing) : « 0 texte QR lus, 0 QR-facture suisse ». Même sonde sur doc3 : 2 QR valides lus ; l'outil marche, doc1 n'en porte pas. Preuve 2 : l'image ouverte (photo d'écran d'une facture Infomaniak en anglais) ne montre aucun QR ni bulletin ; ni « Invoice date », ni « Date » imprimés.
- Ce que l'image montre : « from 15/10/2026 to 14/10/2027 » dans la colonne Période de chaque ligne (début de l'abonnement), et, au-dessus du document, l'en-tête de la galerie du téléphone « October 15, 2026 10:06 » (date de la photo, pas du document).
- Gemini l'a donc lue (51 lectures brutes de doc1 sur toutes les sorties : 36 rendent 15.10.2026, 15 rendent vide) : elle est déduite de la période ou de la galerie, jamais imprimée comme date de facture. La vérité « pas de date » est tenue ; elle n'est pas à corriger par un QR.
- Conséquence : l'écran la montre sûre (« date lue ») sous un statut « vérifié ». Une date déduite d'une période doit être signalée. Si le brasseur juge que le début de période est la date de facture, la vérité s'écrit `["", "15.10.2026"]` ; décision de lui.

## 6. Commande du passage payant (non lancée)
Production = C★v8 + N (variante `Csv8`, `--normaliser`), un tirage, comme k6.
Bloquant constaté : `doc15` (8,3 Mo) et `doc21` (6,5 Mo) dépassent les 4 Mo du serveur (« Justificatif invalide ou trop volumineux (4 Mo maximum) ») : le banc envoie l'original, l'app allège d'abord les photos (`allegerPhoto`, `src/services/pagesJustificatif.ts` : côté long 4096 à 0,85, puis 3200, puis les niveaux du PDF). Aucune des deux pièces ne passe `--simuler`. Le banc ne reproduit pas cet allègement.

Simulation et estimation sur les 15 pièces qui tiennent (14 premières + doc16), sans réseau :
```
npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --simuler --variantes Csv8 --normaliser --repeat 1 --cas cas.json,cas-2.json,cas-3.json,cas-4.json,cas-5.json,cas-6.json --docs doc1,doc2,doc3,doc4,doc5,doc6,doc7,doc8,doc9,doc10,doc11,doc12,doc13,doc14,doc16 --out <dossier temporaire>
```
→ « Simulation terminée : 15 parcours … (aucun réseau) ». Jugée : 177/177 champs, 0 faux vert, 100/100 fausses réponses fabriquées retrouvées, 0 champ faux sur parcours propres, puis `BANC SIMULE ECHEC` parce que la simulation ne produit plus aucun faux vert (la condition `fauxVerts > 0` de `checkSimulation`). Même résultat sur les 14 pièces d'avant (cas.json à cas-5.json) : le juge n'a pas été touché sur ce point, donc pas causé par la voie ; à régler par le pilote (accepter 0 faux vert depuis les correctifs k6, ou fabriquer une faute qui franchit le garde).
```
… --simuler --estimer --variantes Csv8 --normaliser --repeat 1 --cas <les 6> --docs <les 15>
```
→ `BANC ESTIME 2.1978 CHF 45 appels neufs` (réserve au pire : sortie au plafond de chaque appel ; réel attendu bien plus bas : 0,044 CHF par pièce en k6, soit environ 0,7 CHF). Déjà journalisé : 8,6533 CHF.

Commande payante (à lancer par le pilote) :
```
npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --payant --budget-chf 3 --confirm-paid-ai --variantes Csv8 --normaliser --repeat 1 --cas cas.json,cas-2.json,cas-3.json,cas-4.json,cas-5.json,cas-6.json --docs doc1,doc2,doc3,doc4,doc5,doc6,doc7,doc8,doc9,doc10,doc11,doc12,doc13,doc14,doc16 --out work/finalisation-tickets-2026-10-08/H13-reels/banc-k7-prod
```
Puis, sans réseau : `npx vite-node --config vitest.config.ts scripts/banc-lecture-ajouts.ts -- --ajouts=work/finalisation-tickets-2026-10-08/H13-reels/banc-k7-prod --out=<tableau.md> --prive=<valeurs privées.json>` et `scripts/banc-lecture-facture-juger.ts -- <dossier>`.
Le plafond cumulé du code est 24,5 CHF (`BUDGET_CAP_CHF`) alors que D278 parle de 49 : sans importance pour cette passe (3 CHF).
Rejouer à neuf (pas `--reprendre`) : les prompts et le post-traitement ont changé depuis k6 ; les appels prêtés seraient d'avant.

## 7. Doutes et limites
- Essais : un critère, une correction (le fournisseur) ; la sonde QR, la simulation et l'estimation, un passage chacun.
- 16 vérités : 14 lues à ce jour, doc15/16/21 sans sortie. Indice, pas preuve.
- Les ajouts sur les valeurs de ligne et le paiement ne sont jamais déclenchés sur ces sorties : la mesure les couvre (tests) mais rien ne les éprouve en réel.
- « Ligne en plus » : repérage par nom puis queue de liste ; ne distingue pas une ligne doublée d'une ligne réellement ajoutée au milieu.
- La mesure ne sait pas si l'ajout est vrai : doc3 (n° de contrat, lignes de prime) peut être une vérité trop stricte.

DÉCISION À PRENDRE : doc15 et doc21 (> 4 Mo) : (a) lancer la passe sur 15 pièces maintenant (commande ci-dessus), (b) faire alléger ces deux photos avec les niveaux de l'app (4096 à 0,85, puis 3200) en copies dans `H13-reels` hors Git, nommées sans toucher aux originaux, puis passer les 17 pièces en `--cas`, (c) ajouter l'allègement au banc. Recommandation : (a) tout de suite, puis (b) pour les deux pièces, car le banc doit voir ce que l'app envoie.
DÉCISION À PRENDRE : date de doc1 : garder la vérité « pas de date » (recommandé : aucune date de facture imprimée ; une date de période ou de galerie doit être signalée), ou accepter `["", "15.10.2026"]`.
CONNAISSANCE : doc1 (Infomaniak, photo d'écran) n'a pas de QR-facture et aucune date de facture imprimée ; sa « date » lue est le début de période (15/10/2026) ou l'en-tête de la galerie du téléphone. Les photos de plus de 4 Mo sont refusées par le serveur : l'app les allège, le banc non.
LEÇON PROPOSÉE : aucune.

## Passe payante (08.11, pilote) — production du dépôt à 0c3f4d41, 17 vraies pièces, 1 tirage

- Coût 0,6668 CHF (journal : 9,3201 CHF cumulés). doc15 et doc21 allégés comme l'app.
- C★v8 : champs 188 / 201, lignes 240 / 260, **faux verts 0**, alertes justes 11, inutiles 5, échecs 0, durée médiane 9,8 s.
- Ajouts : 6, dont **3 non signalés, 0 sous « vérifié »** ; doc1 date maintenant **signalée** ; non signalés : doc3 (n° de commande, 1 ligne en plus),
  doc6 (TVA rendue sur une page qui n'en imprime pas). Moins de 40 pièces : un indice, pas une mesure.

## Passe payante k8 (08.11, pilote, accord du brasseur « Je l'autorise ») — production du dépôt à 013d5188, mêmes 17 pièces, 1 tirage

- Coût 0,6566 CHF (journal : 9,9767 CHF cumulés). Sortie : `H13-reels/banc-k8-prod` (hors Git).
- C★v8 : champs 190 / 201 (k7 : 188), lignes 239 / 260 (k7 : 240), **faux verts 0** (k7 : 0), alertes justes 10, inutiles 6, échecs 0, durée médiane 11,1 s.
- Ajouts : 3 (k7 : 6), **1 non signalé** (k7 : 3), **0 sous « vérifié »** : doc3, une ligne en plus, sur une pièce déjà « à trancher » (deux bulletins QR ;
  à l'écran, LO-1 dit « somme des 2 bulletins », à confirmer). doc6 TVA et doc12 HT : ajoutés mais signalés. Moins de 40 pièces : un indice, pas une mesure.
- Verdict du pilote : aucune erreur silencieuse sous « vérifié » ; point « robustesse de lecture » clos sur ce banc. Reste suivi au registre : DC-1 (découpe des très longues photos), LO-4, LO-5, LT-5.
