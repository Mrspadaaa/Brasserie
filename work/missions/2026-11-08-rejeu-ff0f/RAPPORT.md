# Rejeu en ligne des bugs « déployé » — ff0f822e (index-Cjbwqm3L.js), 08.11

Session monitoring, Chrome du brasseur à 525 × 755. Le rendu est gelé : captures CDP en échec, `innerText` périmé. L'état a donc été lu par `textContent` et les gestes faits par `.click()` et des événements simulés.
Écritures sur des données ZZ TEST seulement :
- brouillon de l'assistant « ZZ TEST — Recette » : modifié, puis abandonné ;
- fiche matériel « ZZ TEST — R D » : modifiée, puis annulée.

Les vraies données ont été lues seulement : neipa v3, LOT-002, LOT-007, Weizenmalz (fiche ouverte puis annulée).
Le détail par bug est versé dans `work/missions/BUGS.md` (note « en ligne ff0f822e »).

## Constats neufs

1. G · Fiche recette (neipa v3, lecture) · décimales au point dans la fiche : « Pilsner Malz 3.5 EBC », « SRM 4.9 », « Gypse 3.2 g », « Chlorure de calcium 11.2 g », « 5.3 mL de Acide lactique », « 2.1 mL », « 0.43 °C », à côté de « 1,081 » et « 39,6 ».
2. G · Fiche recette (neipa v3, lecture) · « Lotus 10 min · 15 % AA » : « AA » au lieu de « α » (corrigé ailleurs par TE-23).
3. D · Fiche recette · « 5.3 mL de Acide lactique 80 % » : « de Acide » au lieu de « d'acide ».
4. D · Stocks, fiche article (Weizenmalz) · le choix d'unité propose « g », « kg » et « Kg » : deux graphies pour la même unité.
5. D · Finances et Matériel · données de test laissées en ligne : vente « ZZ TEST — Vente — ZZ TEST — Clients + 1,00 », matériel « ZZ TEST — R D » (1,00 CHF), client « ZZ TEST — Clients … » (téléphone « abc »). Elles sont à retirer par leur auteur.
6. G · Dépense, lecture (pièce fictive ticket-long-tva.png, une seule photo) · « À confirmer · Total TTC non présent sur cette première partie du document coupé. » alors que « TOTAL CHF 165.20 » est imprimé et que l'écran dit « Somme = imprimé 165,20 ».
7. G · Dépense, lecture (même pièce) · « Rabais carte fidelite : Ligne tronquée en bas de page, montant sur la suite du document » alors que « -5.00 B » est entier sur la photo.
8. G · Dépense, lecture (même pièce) · moyen de paiement « Compte bancaire / carte » alors que le ticket imprime « TWINT CHF 165.20 Paye ».
9. D · Brassins › jour de brassage › Mesurer à la cuve (brassin ZZ) · bornes écrites au point et avec une espace : « Saisis 0.1 à 2000 L », « Saisis 3 à 9 . », « 0.99 à 1.2 SG ».
10. D · Brassins › jour de brassage, quantité réelle de gypse (brassin ZZ) · « 1,23456 » accepté et enregistré avec 5 décimales, sans arrondi à la résolution de la balance.
11. D · Recettes, enregistrement (ZZ TEST — Recette) · après ajout puis retrait d'un fermentescible de 0,1 kg et deux enregistrements, `brewhouse.mashRatioLPerKg` reste à 2,9655 (25,8 L / 8,7 kg) au lieu de revenir à 3 ; `mash.ratioLPerKg` reste à 3. Le rapport du profil garde la valeur de l'enregistrement précédent.
12. G · Recettes › assistant, Malts/sucres · « Créer « X » (stock à zéro) » crée tout de suite un article de stock réel, qui reste après « Abandonner » le brouillon. Le 08.11, trois articles sont restés de mes tests : « sirop candi 1 » (MP-036), « Malt essai 10 » (MP-037) et « Mangue » (MP-038), cette dernière rangée en Sucre. Je les ai supprimés par l'app le même soir.
13. D · Brassins › jour de brassage LOT-007 › onglet Recette (lecture, 48d16402) · le bloc de notes de recette (`p.brew-recipe-notes`, texte enregistré avec le brassin le 05.09.2026) écrit au point : « OG 1.031 · FG 1.005 · ABV 3.4 % », « 11.3 % AA · 90.7 IBU », « ensemencement 27.5 °C », « Empâtage 22.8 L (dont 14.8 L osmosée) · rinçage 17.2 L ». C'est un texte figé : à voir si le générateur de ce texte écrit encore au point pour un brassin neuf.
14. D · Réglages › Fiscalité (lecture, 48d16402, 09.11) · à l'ouverture, l'IBAN enregistré de la brasserie s'affiche avec l'alerte « Cet IBAN n'est pas valide : vérifie les chiffres (un IBAN suisse a 21 caractères…) » sans qu'on l'ait touché : soit la valeur stockée est fausse, soit le contrôle refuse un IBAN valide (valeur non recopiée ; à vérifier par le brasseur).
15. G · Clients › Prix et marges / budget du brassin (constat de la session finances-ux, 09.11) · le tarif donne un coût de 1,20 CHF pour une bouteille de 33 cl, alors que le budget du même brassin donne 7,51 CHF/L, soit 2,48 CHF la bouteille : deux coûts de revient contradictoires, et la marge affichée est fausse d'un côté.
