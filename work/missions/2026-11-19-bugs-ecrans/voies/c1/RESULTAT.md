# Voie c1
- TE-NOTE-3 | écarté | — | sans objet : « Enregistrer et télécharger » n'existe plus, la caisse v3a (d4bb21264) l'a remplacé par Facturer puis Envoyer le PDF ; le PDF de la facture se produit en local (preparerVente qr, test bugs-c1-preuves), rien n'est envoyé
- AM-66 | corrigé | 480f8d3ed | déjà corrigé : vraie QR-facture swissqrbill, référence QRR/SCOR, n° UID/TVA exigé et imprimé, IBAN validé (ada263534 pour l'IBAN) ; prouvé par bugs-c1-preuves (AM-66, 4 tests)
- AM-68 | corrigé | d4bb21264 | déjà corrigé : chaque ligne de vente porte brassin, format, quantité et litres (vente:B1:33cl:0.33), la jauge du brassin compte les litres sortis ; limite : le conditionné noté du brassin (bouteilles) reste fixe, c'est la jauge qui bouge
- AM-69 | corrigé | d2510b1a6 | espèces arrondies au multiple de 5 ct : ligne « Arrondi à 5 centimes », montant encaissé, paiement et quittance arrondis, l'écart va au HT (HT + TVA = TTC, TVA des articles inchangée) ; TWINT et facture exacts ; ligne visible au ticket et à l'annexe
- TE-56 | corrigé | d4bb21264 | déjà corrigé : la caisse choisit une fiche client (boutons « À qui ») et un brassin/format (tuiles), plus de champ libre ; la vente est comptée dans la fiche (ClientStatsService, testé)
- RL-15 | corrigé | 480f8d3ed | déjà corrigé : une seule chaîne litre → format (coutFormat) lue par le Prix, le tarif et le budget ; le coût n'est plus saisi (TarifSheet, e93348d2f) ; 7,51 CHF/L donne 2,48 CHF de liquide pour une 33 cl, testé
- LR3-NOTE-1 | ouvert | — | accord requis : vente réelle « 10 × Bière 75 cl — Restaurant du Lac » 5 695,00 CHF (10.11) ; donnée réelle, je ne la lis ni ne la corrige. Question au brasseur : test ou saisie fausse ? Si fausse : l'annuler (avoir) ; recommandation : oui, puis ajouter une alerte quand un prix de ligne dépasse 10 fois le tarif du format

Tests : npx vitest run tests/unit/bugs-c1-AM69.test.ts tests/unit/bugs-c1-preuves.test.ts tests/integration/bugs-c1-AM69-ui.test.tsx tests/integration/caisseVente.test.tsx tests/unit/caisseCalculs.test.ts tests/unit/factureQr.test.ts tests/unit/clientsVentes.test.ts → 111 passés, 0 échoué (tests.txt). Avant correction, bugs-c1-AM69 échouait (10 sur 12). Un test existant ajusté : caisseVente.test.tsx (espèces 27,03 → 27,05, HT 25,02). caisseEnFond.test.tsx « Drive lent < 1 s » est instable sous charge (1,1 à 1,7 s selon l'essai, 6/6 vert seul une fois) : sans lien avec l'arrondi.
Captures : NON PRISES. capturer.mjs (dans ce dossier) échoue : le clic « Vendre » du menu « Actions rapides » ne trouve pas le bouton (1280 clair), donc pas de `.cs`.

DEMANDE EXECUTANT :
1. Depuis port-carnet : `node scripts/with_server.mjs --server "npm run dev" --port 3107 --env PORT=3107 -- node work/missions/2026-11-19-bugs-ecrans/voies/c1/capturer.mjs`.
2. Si « Vendre false » : ouvrir le menu à la main dans le script (capture après le clic « Actions rapides », lire les libellés des boutons visibles, corriger l'expression de `cliquerTexte`), ou lancer avec la touche/raccourci `vente` (App.tsx ligne 733). Ne rien changer d'autre.
3. Fichiers attendus dans voies/c1/captures/ : c1-caisse-1280-clair-haut.png, c1-caisse-1280-cave-haut.png, c1-caisse-390-clair-haut.png et -bas.png, c1-caisse-390-cave-haut.png et -bas.png.
4. Sortie attendue : pour chaque combinaison, `{"total":"11,90…","arrondi":["Arrondi à 5 centimes+0,02"],"bouton":"Encaisser 11,90 CHF"}` et erreurs `[]`.
5. Ouvrir chaque PNG et me le renvoyer pour jugement (ligne d'arrondi lisible, pas de recouvrement, contraste cave).

DÉCISION À PRENDRE : LR3-NOTE-1 (vente réelle de 5 695 CHF) : annuler ou garder ? Recommandation : annuler si le brasseur confirme que c'est un test.
CONNAISSANCE : en espèces, l'écart d'arrondi de 5 ct s'inscrit comme ligne « Arrondi à 5 centimes » (kind `other` si +, `discount` si −) et l'amountHT l'absorbe : même règle que la Dépense (purchaseEntry), sans toucher la TVA.
LEÇON PROPOSÉE : aucune

## Preuves (exécutant)

Corrections du script (`voies/c1/capturer.mjs`) : (a) le menu « Actions rapides » liste « Vente », pas « Vendre » (diagnostic : libellés visibles relevés, capture `diag-menu.png` hors `captures/`) ; (b) reprise par parcours (3 essais) : les rechargements HMR déclenchés par d'autres sessions qui éditent le même dépôt (`src/ui/finance/ExpenseSheet.tsx`) détruisaient le document ; (c) défilement des « bas » : le conteneur n'était pas `.cs`, le « bas » était identique au « haut » ; corrigé (le « bas » montre désormais la quittance et les boutons).

Journal, dernier passage (`with_server.mjs`, port 3107, `npm run dev`, code 0) :
```
1280 clair Vendre true
1280 clair {"total":"11,90CHF","arrondi":["Arrondi à 5 centimes+0,02","Arrondi à 5 centimes+0,02"],"bouton":"Encaisser 11,90 CHF"}
1280 clair erreurs []
1280 cave Vendre true
1280 cave {"total":"11,90CHF","arrondi":["Arrondi à 5 centimes+0,02","Arrondi à 5 centimes+0,02"],"bouton":"Encaisser 11,90 CHF"}
1280 cave erreurs []
390 clair Vendre true
390 clair {"total":"11,90CHF","arrondi":["Arrondi à 5 centimes+0,02","Arrondi à 5 centimes+0,02"],"bouton":"Encaisser 11,90 CHF"}
390 clair erreurs []
390 cave Vendre true
390 cave {"total":"11,90CHF","arrondi":["Arrondi à 5 centimes+0,02","Arrondi à 5 centimes+0,02"],"bouton":"Encaisser 11,90 CHF"}
390 cave erreurs []
```
Écart au point 4 : la ligne d'arrondi existe en deux exemplaires (bloc des totaux et quittance annexe), donc deux entrées identiques, non une. Total, bouton et erreurs conformes.

Captures ouvertes, une ligne chacune :
- c1-caisse-1280-clair-haut : total 11,90, « Arrondi à 5 centimes +0,02 » lisible, « Encaisser 11,90 CHF », quittance en annexe. Défaut à regarder : bande blanche derrière « Mon mois » et « Encaisser » qui tranche sur le fond gris (le cave, lui, a une bande sombre).
- c1-caisse-1280-cave-haut : tout lisible, contraste correct, bouton crème. OK.
- c1-caisse-390-clair-haut : ligne d'arrondi lisible, pas de recouvrement. OK.
- c1-caisse-390-clair-bas : quittance « Arrondi à 5 centimes +0,02 », « Total CHF 11,90 », « Modifier » et « Envoyer le PDF » visibles. OK.
- c1-caisse-390-cave-haut : lisible. OK.
- c1-caisse-390-cave-bas : idem en sombre, quittance et boutons visibles. OK.

Défauts renvoyés au pilote (point 5) :
1. Bande blanche derrière « Mon mois / Encaisser » en thème clair, 1280 et 390 (apparence de zone collante, à confirmer).
2. Ligne d'arrondi affichée deux fois dans la même vue (totaux et quittance) : voulu, à confirmer.

Non vérifié : le ticket et l'annexe en ligne, les tests de LR3-NOTE-1 (décision du brasseur, pas de capture).

Commande du point 1 : `node scripts/with_server.mjs --server "npm run dev" --port 3107 --env PORT=3107 -- node work/missions/2026-11-19-bugs-ecrans/voies/c1/capturer.mjs`, lancée 5 fois (échecs sur le libellé du menu, puis rechargements HMR, puis défilement), dernier passage propre.
