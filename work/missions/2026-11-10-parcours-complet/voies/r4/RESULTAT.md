OK — toutes les données ZZ r2 retirées en ligne ; chiffres de départ retrouvés (9/9).

Fichiers (voies/r4/) : lib.mjs, r4-a.mjs (brassin), r4-m.mjs (achat, copie de r3-m), r4-b.mjs (articles), r4-c.mjs (recette), r4-d.mjs (client + relevé final), r4-e.mjs (sonde), logs a-*.log, m-achat*.log, b-articles.log, c-recette.log, d-client.log, tests.txt (départ / lu), captures/ (ouvertes : r4asuppr-05-confirm, r4b-01-fiche0, r4c-01-ouverte, r4dsuppr-06-fin-synthese ; les autres lues par leur texte de dialogue).
En ligne : bundle index-Cmht_ZH1.js, 390 clair, 10.11. Aucune lecture Gemini ; LOT-016 et toute donnée sans « ZZ » non touchés ; chaque suppression gardée par le texte « ZZ TEST — parcours r2 » dans le dialogue.

## Gestes, effet lu
1. Brassin LOT-017 : Brassins › carte › Dossier › « Supprimer ce brassin » › dialogue « LOT-017 — ZZ TEST — parcours r2 … Les ingrédients déjà consommés restent déstockés » › « Supprimer le brassin » : 5 → 4 brassins. Malt NON restitué (reste 0 kg, 0 g, 0 sachet ; Tous · 56 inchangé).
2. Dépense « ZZ TEST — parcours r2 achat » : encore refusée après 1 (« stock consommé ou corrigé »). Faite après 3 et 4 : « Annuler cette écriture » › « Confirmer la correction » : « Écriture annulée. Justificatif et historique conservés. » Dépensé 12,50 → 0,00.
3. Recette REC-MWANWMSU (icône corbeille « Supprimer la recette ») › « Supprimer la recette » : 25 → 24. Avant elle, les articles refusaient (« la recette ZZ TEST — parcours r2 l'utilise »).
4. Articles MP-036 malt, MP-037 houblon, MP-038 levure : fiche › Supprimer › « Supprimer l'article » (dialogue : « 0 … en stock ») : Tous · 56 → 53 ; recherche « ZZ » : « Rien ne correspond ».
5. Client CL-006 : Clients › Carnet › ligne ZZ (déplier) › « Modifier ZZ TEST — parcours r2 client » › « Supprimer ce client » › « Supprimer le client » : 6 → 5 clients.

## Ordre qui marche (à retenir)
brassin → recette → 3 articles → dépense (annuler l'écriture) → client. La dépense ne s'annule qu'après la suppression des 3 articles, et les articles ne se suppriment qu'après la recette.

## Chiffres (tests.txt) : départ = lu
Entré 5 695,00 ; Dépensé 0,00 ; Caisse 5 663,00 ; brassins 4 ; recettes 24 ; clients 5 ; Stock Tous 53 (À commander 17) ; Annuel −70,40 ; Prévisions 5 035,32.

## Reste / doutes
- Plus aucune donnée ZZ r2 en ligne. Historique de l'écriture annulée conservé par l'app (contre-écritures, comme r1). Ancien « ZZ TEST — Recette Double IPA » (autre jeu, non r2) toujours dans le carnet : non touché, hors voie.
- Le stock de malt (5 kg achetés, 5 consommés) n'est pas rendu par la suppression du brassin : cohérent avec son message, sans effet ici car article supprimé ensuite.
- Défauts d'UX : le message de refus d'annulation d'achat ne dit pas qu'il faut supprimer le brassin ; le bouton « Supprimer la recette » n'a pas de texte (aria-label seul) ; la fiche client s'ouvre en feuille sans repère role=dialog dans la liste sous-jacente.
- Essais : 4 exécutions de r4-c, 3 de r4-d (gardes à ajuster, rien d'erroné supprimé).

CONNAISSANCE : retrait complet d'un jeu ZZ de parcours (brassin, achat, articles, recette, client) = brassin, recette, 3 articles, puis annuler l'écriture d'achat, puis client ; la suppression d'un brassin ne restitue pas les ingrédients consommés.
LEÇON PROPOSÉE : un script garde un clic en testant le texte du bloc ; sur une liste cachée sous une feuille ouverte, le texte du corps contient les autres lignes. Garder sur l'élément de la feuille (titre exact, valeur du champ nom), pas sur le texte global.
