REPRISE — étapes 4 (fin) et 5 jouées et justes ; retrait partiel : vente retirée, dépense à « à payer 12,50 » (écriture NON annulable car stock consommé) ; brassin, recette, 3 articles, client ZZ restent en ligne. Plafond de contexte atteint.

En ligne : bundle `index-Cmht_ZH1.js`, 390 tactile clair, 10.11. Scripts `voies/r3/r3-*.mjs` (lib.mjs = copie de r2, captures dans `captures/`), logs `*.log`. Captures ouvertes : r3a-02, r3b-02, r3c-03, r3i-02, r3i-03, r3j-01, r3l-03, r3l-05. Aucune lecture Gemini, aucun geste sur donnée réelle (LOT-016 non touché).

## Étapes, attendu / lu
4 (fin). Levure : « J'ai ajouté la levure » ouvre l'éditeur (Mesurée / Sans mesure, champ « Mesure », unité) ; après `Mesurée` + 1 + `sachet` + Fermer + « J'ai ajouté la levure » : dialogue « Confirmer l'ajout de levure ? … 6/6 ajouts cochés. Quantité mesurée : 1 sachet · Aucune quantité prévue valide » ; « Confirmer la levure ajoutée » : LOT-017 passe en « Fermentation · J+0 », liste Brassins (r3i-03). OK.
  Stock attendu / lu : malt ZZ 5 → 0 kg (exact) ; houblon 0 g ; levure 0 sachet (stock initial 0, affiché 0 et non −1 : clampé, à signaler) ; les 3 en « Rupture » (r3j-01).
5. Vente : attendu +45,00 ; lu Synthèse Entré 5 740,00 (2 ventes), Dépensé 12,50 ; Annuel −37,90 ; Prévisions 5 067,82 ; opérations « Vente 1 × ZZ … r2 vente — ZZ … client ✓ encaissé aujourd'hui · TWINT +45,00 » (r3l-05) : justes. Client ZZ créé par Vendre › « +client » (Particulier, Enregistrer), CL-006 présumé ; panier 45,00 CHF « Payé ici » + TWINT (r3l-03).
6. Retrait (partiel) : vente : « Corriger ce paiement erroné » › Confirmer (fiche « À encaisser 45,00 », historique + / − 45) puis « Annuler cette écriture » › Confirmer : ligne disparue, Ventes revenues à +5 695,00. Dépense : paiement corrigé (Brassage « payé 0,00 à payer 12,50 ») ; « Annuler cette écriture » › « Confirmer la correction » : la fiche affiche « Le stock de cet achat a été consommé ou corrigé. Vérifie l'inventaire avant d'annuler ; aucune quantité ne sera effacée. » et l'écriture reste (« à payer 12,50 »). Annulation refusée tant que le malt est consommé par LOT-017.

## DONNÉES ZZ ENCORE EN LIGNE
| donnée | identifiant | état |
|---|---|---|
| dépense « ZZ TEST — parcours r2 achat » | Opérations novembre | non payée, « à payer 12,50 », non annulable (stock consommé) |
| brassin LOT-017 « ZZ TEST — parcours r2 » | LOT-017 | Fermentation (LOT-016 neipa v3 = au brasseur, ne pas toucher) |
| recette « ZZ TEST — parcours r2 » | REC-MWANWMSU | |
| articles malt / houblon / levure « ZZ TEST — parcours r2 … » | MP-036 (malt) ; houblon, levure ids non lus | tous à 0 |
| client « ZZ TEST — parcours r2 client » | CL-006 (à confirmer) | |
État attendu au retour : Entré 5 695,00 / Dépensé 0,00 / Caisse 5 663,00 ; brassins 4 ; recettes 24 ; clients 5 ; Stock Tous 53 ; Annuel −70,40 ; Prévisions 5 035,32. Actuellement : Entré 5 695,00, Dépensé 12,50 (non payé), brassins 5.

## REPRISE (agent neuf)
Dans l'ordre : (1) supprimer le brassin LOT-017 (Brassins › carte ZZ › Dossier › « Supprimer ce brassin » › « Supprimer le brassin ») : ça rend le malt consommé ? vérifier le stock malt ; (2) rejouer `CIBLE=achat PHASE=2 node voies/r3/r3-m.mjs` (Annuler cette écriture › Confirmer la correction) ; si encore refusé, supprimer d'abord les 3 articles (ordre r1 inversé) puis réessayer ; (3) recette ; (4) articles ; (5) client (Clients › Carnet › Modifier ZZ … › Supprimer ce client) ; (6) comparer aux chiffres de départ ci-dessus. Écrire les scripts en reprenant `r3-m.mjs` (garde ZZ) et la logique de `jouer/etape5e-retrait.mjs`.

## Défauts constatés (r3)
1. BLOQUANT RÉTABLI : 400 « Quantité invalide » (`saveBrewSession`, europe-west6, corps `{"error":{"message":"Quantité invalide.","status":"INVALID_ARGUMENT"}}`) dès l'arrivée à l'ensemencement. Cause exacte : le serveur (`functions/src/brewSessionCore.ts` l.222-224) exige `amount` fini pour chaque ajout ; l'ajout `yeast` envoyé était `{"doneAt":…}` sans `amount`, créé par la coche « Ajouté : » de la levure (r2 a tout coché par un script). Effet : bandeau « Quantité invalide. Réessayer / Recharger le serveur » + « Journal à synchroniser », la confirmation d'ajout répond « conservé sur cet appareil » et ne clôt pas ; « Réessayer » rejoue le même 400 ; seul « Recharger le serveur » (état serveur, Journal à jour, Levure 0/1) permet de refaire le geste. Fonctionnement normal confirmé ensuite : Mesurée 1 sachet puis confirmation = fermentation, sans 400. À corriger : refuser/forcer l'amount avant de cocher « Ajouté », ou accepter un ajout sans quantité côté serveur ; le brouillon local empoisonné ne devrait pas bloquer.
2. Champ de saisie levure : aria-label « Quantité réelle de  » (nom d'ingrédient vide) et c'est une `textarea` (non repérée par `input`). Non bloquant.
3. Fiche vente ZZ : « envoi en cours » (pièce) sur la ligne juste après l'encaissement. Non bloquant.
4. Annulation d'achat impossible une fois le stock consommé par un brassin : cohérent avec le message, mais le retrait d'un test exige de supprimer d'abord le brassin (non joué). À vérifier : que « Supprimer ce brassin » restitue le malt.
5. Stock levure : 0 sachet après un ajout de 1 sachet (clampé à 0, pas −1) : à confirmer si voulu.
6. Rappel r2 : PC-2 (a) catégorie perdue à la création (3/3), non retesté ici.

CONNAISSANCE : l'erreur « Quantité invalide » de saveBrewSession vient d'un ajout sans `amount` (brewSessionCore l.222) ; elle bloque la clôture d'un brassage tant que le brouillon local n'est pas rechargé par « Recharger le serveur ». Une écriture d'achat dont le stock est consommé par un brassin ne s'annule pas : supprimer le brassin d'abord.
LEÇON PROPOSÉE : un script qui coche toutes les cases (`cocher()`) crée des états impossibles (ajout levure sans quantité) qui ressemblent à un défaut de l'app ; ne cocher que ce qui est requis et lire le corps de la requête 400 avant de conclure.
