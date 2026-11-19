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
