REPRISE — étapes 1 à 3 jouées et OK, étape 4 jouée jusqu'à l'ensemencement (levure non touchée) ; 5, 6 et retrait à faire (contexte épuisé à ~160 k).

En ligne : bundle `index-Cmht_ZH1.js` (vérifié à chaque passage), 390 tactile clair, 10.11. Scripts dans `voies/r2/` (lib.mjs, r2-etape1, r2-etape2h, r2-etape3b, r2-etape4, r2-etape4b) ; logs `etape*.log` ; captures `captures/` (préfixes 1-, r2-2h-, r2-3b-, r2-4-, r2-4b-). Aucune lecture Gemini, aucun geste sur une donnée réelle. NB : le Bash du poste perd `\(` dans un heredoc : écrire les scripts avec Write/Edit, motifs `[(]`.

## DONNÉES ZZ ENCORE EN LIGNE (à retirer, dans cet ordre)
| donnée | identifiant | geste de retrait (CONNAISSANCE r1) |
|---|---|---|
| brassin « ZZ TEST — parcours r2 » (Conduite, Préparer cochée jusqu'à Ensemencement, étape 9) | LOT-017 | Brassins › Brassins (…) › ouvrir LOT-017 (carte avec ZZ ; ne PAS toucher LOT-016 neipa v3, réel, « Brassage en cours » du 10.11, pas de moi) › Dossier › « Supprimer ce brassin » › « Supprimer le brassin » |
| dépense « ZZ TEST — parcours r2 achat », 12,50 CHF, Brassage, payée 10.11 | Opérations novembre | fiche › Historique des paiements › « Corriger ce paiement erroné » › « Confirmer la correction » ; puis « Corriger une erreur de saisie » › « Annuler cette écriture » › « Confirmer la correction » (b1 : l'achat est maintenant annulable même après suppression des articles ; r1 : faire l'annulation AVANT de supprimer les articles reste le plus sûr) |
| recette « ZZ TEST — parcours r2 » (American Pale Ale, 24 L, malt ZZ 5 kg seul) | REC-MWANWMSU | page recette › « Supprimer la recette » › confirmer |
| articles « ZZ TEST — parcours r2 malt » (Malt, kg, 5 kg en stock), « … houblon » (Houblon, g, 0), « … levure » (Levure, sachet, 0) | MP-036 (malt) ; houblon et levure : ids non lus | Stocks › recherche « ZZ TEST — parcours r2 » › Ouvrir › Supprimer › « Supprimer l'article » (le malt refuse tant que la recette et le brassin existent) |
| vente ZZ, client ZZ | non créés | — |

État de départ r2 (r2-etape1, 1-01 à 1-07) : Synthèse nov. Entré 5 695,00, Dépensé 0,00, En caisse 5 663,00 ; Opérations nov. 1 (+5 695,00) ; Prévisions 5 035,32 au 7 févr. ; Annuel −70,40, Dépensé + usure 5 765,40 ; Stock Tous · 53, À commander · 17 ; clients 5 (aucun ZZ) ; recettes : 24 avant (25 maintenant avec la ZZ) ; brassins : 4 au départ = LOT-013 à 015 planifiés + LOT-016 « neipa v3 Brassage en cours 10.11.2026 » (réel, déjà présent, non créé par moi). Pour le retrait, comparer à ces chiffres (brassins : 4 au retour).

## Étapes, attendu / lu
1. État de départ — OK (voir ci-dessus ; 1-01 à 1-08). « Ajouter un article » n'existe pas dans Stocks › Articles : le geste est Actions rapides › « Nouvel article ».
2. Recette — OK. 3 articles ZZ créés par le vrai geste tactile (Actions rapides › Nouvel article, #new-stock-category, #new-stock-unit). Recette ZZ (malt ZZ 5 kg seul) enregistrée, récap « Stock 1 ingrédient à commander ». Courses : sans ligne ZZ (la recette seule ne crée pas de besoin ; P3 inchangé). Brassin préparé ensuite : LOT-017.
3. Achat — OK. Attendu : stock +5 kg, finances +12,50. Lu (r2-3b-05 à 11) : malt ZZ « 5 kg Niveau inconnu » ; Synthèse Dépensé 12,50 · Brassage 12,50, En caisse 5 650,50 ; Opérations « Brassage 12,50 ZZ TEST — parcours r2 achat ✓ payé aujourd'hui · banque sans pièce » ; Prévisions 5 022,82 (−12,50) ; Annuel −82,90, Dépensé + usure 5 777,90 (+12,50). Chiffres justes.
4. Brassage — PARTIEL. LOT-017 créé (« Créer le brassin » ouvre directement le jour de brassage, Conduite). Cases d'eau / ingrédients cochées, Commencer aujourd'hui, paliers (Terminer maintenant), Ébullition atteinte, Coupure du feu, Confirmer le feu coupé, Refroidir : jusqu'à « 9 Ensemencement » (r2-4b-06). Stock ZZ malt avant l'ensemencement : 5 kg (r2-4-01, avant). Reste à jouer : « J'ai ajouté la levure » (lire la page après le toucher, remplir l'éditeur « Modifier la quantité de … »), puis stock attendu malt 0 kg, brassin en fermentation (PC-1 corrigé : la levure inconnue ne bloque plus).
5. Vente ZZ — NON JOUÉE. Gestes connus (r1 / etape5e-retrait.mjs) : Vendre › « + client » (Pro par défaut → facture) ou client ZZ › Payé ici › TWINT › Autre (ZZ, 1 × 45,00) › Ajouter la ligne › « Encaisser 45,00 CHF » (actif seulement avec un moyen choisi). Retrait : fiche › Corriger ce paiement erroné › Confirmer ; puis Annuler cette écriture › Confirmer ; client : « Modifier » › « Supprimer ce client » (nouveau, PC-2 d).
6. Retrait — NON LANCÉ.

## Défauts constatés (r2)
1. PC-2 (a) REPRODUIT en ligne, geste tactile réel : catégorie choisie dans la liste perdue à la création, `valeurs` catégorie = "" pour Malt, Houblon, Levure ; les 3 articles créés en « Divers », corrigés par la fiche. Pour Levure l'unité « sachet » est aussi perdue (unité « kg » à la création). Non bloquant, déjà noté (P4) : à corriger côté feuille « Nouvel article » ouverte par Actions rapides (le test jsdom est vert : le défaut est dans le geste tactile / le Combobox).
2. PC-2 (b) CORRIGÉ en ligne : après le choix de l'article ZZ malt (kg) dans la dépense, « Unité ligne 1 = kg » avant toute saisie (r2-3b : `champs2`, `unite.avant kg`).
3. Dépense sans justificatif : section « Articles, stock et matériel » toujours pliée par défaut, le brasseur ne voit pas la ligne à remplir (P5 inchangé, non bloquant, non rejoué à Enregistrer vide).
4. Étape 9 : bandeau « Quantité invalide. Réessayer Recharger le serveur » et « Journal à synchroniser » affichés dès l'arrivée à l'ensemencement, avant tout geste sur la levure ; console « Failed to load resource: 400 » (D8). À lire après « J'ai ajouté la levure » : si l'état ne se synchronise pas, bloquant pour le déstockage. NON TRANCHÉ.
5. Doute : LOT-016 « neipa v3 » en cours le 10.11 apparaît sans être de ma voie ; pas touché.

## REPRISE (agent neuf, ~25 tours)
1. Script de reprise à écrire (modèle `r2-etape4b.mjs`, prêt sauf la fin) : Brassins › carte LOT-017 (ZZ, un seul « LOT-ID » dans la carte) › « Reprendre le brassage » › étape 9 › lire texte et boutons ; toucher « J'ai ajouté la levure », LIRE la page, ouvrir « Modifier la quantité de … », saisir 1 sachet (ou « Sans mesure »), valider, confirmer ; stock ZZ malt (attendu 0 kg) ; LOT-017 en fermentation.
2. Vente ZZ (client ZZ créé par « + client », moyen TWINT), finances +45,00, Impôt bière.
3. Retrait dans l'ordre du tableau ci-dessus ; comparer à l'état de départ (brassins : 4, recettes : 24, clients : 5, caisse 5 663,00, Dépensé 0,00).

CONNAISSANCE : « Créer le brassin » (Préparer un brassin) ouvre directement le jour de brassage de LOT-xxx en Conduite ; la carte du brassin planifié dans la liste porte « Préparer le brassage » ; un brassin réel peut y figurer aussi : ne cliquer une carte que si son texte contient le nom ZZ et un seul LOT-id.
LEÇON PROPOSÉE : un parcours de six étapes consomme ~150 k de contexte à rejouer par scripts qui impriment 1 à 3 k chaque ; filtrer les NOTE (`cut`, `grep`) et ne lire que le delta attendu/lu, sinon l'agent s'arrête avant le retrait (donnée ZZ restante).
