OK — 2 problèmes, 0 bloquants

RESULTAT critique-51 : 2 problèmes (B 0, m 2, D 0) — soldes identiques oui — BUGS OK

Version : index-Br_hbvJ9.js. Vérifiée par curl. L'onglet avait u01CJTAh ; `maj.mjs` l'a passé à Br_hbvJ9 avant tout relevé.
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2231 bugs, 520 ouverts, 202 sources).
Couvert : thème clair, 390 × 844, au toucher, Chrome de débug 9222. Mon onglet seulement ; fin : page.close() puis disconnect, navigateur gardé. Non couvert : 1280 et thème sombre (consigne du DOSSIER). Aucun appel IA.

## Avant = après (`avant.json`, `apres.json` : 13 champs, tous identiques)
| | avant = après |
|---|---|
| à dépenser | −463 (S53, dans le cadre) |
| En caisse ; Entré / Dépensé ; Opérations | 1 145,00 libre 1 145,00 ; 0,00 / 265,40 ; 265,40 / 0,00 / 265,40 |
| Solde de départ ; Mon mois ; HABITUELS | 1 145,00 ; — ; identiques |
| période du Calendrier | 6 sem., 23 nov. 2026 – 3 janv. 2027 ; localStorage identique à l'octet |
| ZZ restants | aucun (Opérations, Calendrier) |
Pendant le test : −623 (S53). Retrait : les deux écritures sorties au toucher (Corriger une erreur de saisie › Retirer cette écriture › Confirmer le retrait), 1 → 0 chacune (`supp.log`).

## Joué
- Saisie au toucher (Finances › Actions rapides › Écriture, à la main › Achat) : « ZZ TEST — achat » 79,95 et « ZZ TEST — achat rond » 80,00. Les deux sont à payer, échéance réglée au curseur sur 08.12 (dans 2 semaines, S50). Captures A-*, B-*.
- Calendrier 6 sem., défilé (F0 à F4) : bulle Achats, marques, courbe. Les deux cartes (C-A, C-R), semaine S50 (S50), causes du creux (D1-causes), Liste (L1 à L3). Glisser du cadre sur la courbe (G1). Menu + (P1). Finances › Prévisions (V2).
- Période remise à l'identique deux fois (localStorage, puis rechargement ; `restauré true`).
- Non vu : une barre. Un achat ponctuel est une marque, pas une barre. Les barres des brassins ne portent pas de montant à centimes dans ses données. Pas vu non plus : À venir de l'Atelier, car une écriture n'est pas un plan. Le tour 49 l'avait vu à « 79,95 ».

## C46-5 vérifié — en ligne index-Br_hbvJ9.js
- Bulle Achats : « −159,95 » (79,95 + 80,00 ; aria « solde −159,95 ») (F0, F1).
- Marques : « −79,95 » et « −80 » (6 sem. F0 ; S50).
- Liste : « −79,95 » et « −80 » (L3).
- Semaine S50 : bulle « −159,95 » (S50).
- Causes du creux : « −80 » et « −79,95 » (D1-causes).
- Carte d'opération : 79,95 CHF et 80,00 CHF (C-A, C-R).
- Rien n'est tronqué ni ne déborde à 390 px : la mesure n'a trouvé aucun élément coupé ni hors écran sur la frise, la Liste et les causes.
- Les repères restent en francs entiers : « −623 CHF à dépenser », creux S50 « −543 », « Solde de départ : 1 145 CHF ».
- Rejeu, regardé : la frise va bord à bord, les traits de semaine sont continus du haut au bas des rangées, la barre de Milk Stout touche le bord gauche et le menu + est complet (F0, F1, P1).

## Combien et quels problèmes ? 2
1. m — K51-1 — Courbe de l'en-tête, en 6 sem. Deux achats tombent le même jour (8 déc.). L'étiquette ne nomme que « ZZ TEST — achat rond −80 », alors que la marche fait −159,95. La bulle Achats dit −159,95 et Prévisions dit « (2 fois) −159,95 » (F0-haut, G1).
   - Le brasseur : « Il y a deux achats ce jour-là, pourquoi elle n'en montre qu'un ? »
2. m — PC-117, encore là (ligne existante, pas à moi, non modifiée). Finances › Prévisions nomme le groupe « TEST (2 fois) −159,95, 08.12 » au lieu des noms des écritures (V2-previsions).
   - Le brasseur : « TEST ? C'est quoi ça ? »

Doutes, non comptés :
- Le grand montant de la carte d'opération en chiffres à chasse fixe : la virgule y paraît détachée (« 79 ,95 »). C'est la même chose pour « 80,00 » ; c'est la police, et ce n'est pas propre à ce tour (C-A).
- Les causes du creux disent « S50 Achats · Fruty −2,40 », alors que la Liste place Fruty en Brassins, le 20 déc. (S51). C'est plausible si ce sont ses courses, achetées avant le brassage. Non vérifié (D1-causes, L3).

LEÇON PROPOSÉE : aucune
