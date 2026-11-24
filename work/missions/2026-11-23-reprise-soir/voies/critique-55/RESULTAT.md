OK — 4 problèmes, 0 bloquants

RESULTAT critique-55 : 4 problèmes (B 0, m 3, D 1) — corrigés rejoués 4/4 — carnet identique oui — BUGS OK

Version : index-Bz-J0D8o.js. Le curl (?v=) donne Bz-J0D8o. Mon onglet neuf a été passé de DS2r2c1L à Bz-J0D8o par `maj.mjs` : aucun avis « Nouvelle version », le rechargement a suffi.
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2246 bugs, 514 ouverts, 202 sources).
Couvert : thème clair, 390 × 844, au toucher. Chrome de débug 9222, mon onglet seulement : `clore.mjs` fait page.close() puis disconnect, le navigateur reste ouvert. Non couvert : 1280 et le thème sombre (consigne du DOSSIER).
Coût IA : 4 rangements et 7 lectures de lien, environ 0,078 CHF (plafond 0,10). Le journal `2026-11-23-carnet-en-ligne/ia-journal.jsonl` a 11 lignes critique-55. Aucun appel IA sur son carnet ni sur son stock.
Captures jugées en planches côte à côte (`cap/P-*.png`, faites par `planche.mjs` à partir des captures 390), toutes ouvertes.

## Son carnet et ses soldes : avant = après (`avant.json`, `apres.json`, 18 champs sur 18 identiques, paquet compris)
| | avant = après |
|---|---|
| à dépenser | −463 (S53, dans le cadre) |
| En caisse ; Entré / Dépensé ; Opérations | 1 145,00, libre 1 145,00 ; 0,00 / 265,40 ; 265,40 / 0,00 / 265,40 |
| Solde de départ ; Mon mois ; HABITUELS | 1 145,00 ; — ; identiques |
| période du Calendrier | 6 sem., 23 nov. 2026 – 3 janv. 2027 ; localStorage identique à l'octet |
| Carnets | Tous 20, Local 10, Brasserie 4, Meuble 4, Papiers 2 ; texte de la liste identique |
| Chambre froide | texte de l'écran identique ; ses 2 documents Firestore du cache (837 et 9 086 o) identiques à l'octet |
| ZZ restants | aucun (Opérations, Calendrier, carnets) |

## Joué
- Son carnet, en lecture seule : carnet, feuille Articles, Comparer (défilé), les deux fiches (défilées). Aucun « Relire ».
- Son stock : Stocks › Articles › Houblons, puis la fiche « Cryo Hops Citra 25g » (α 24,8 %), regardée seulement. « Enregistrer » est resté gris.
- Quatre carnets ZZ, en tableau, Articles, Comparer et fiches :
  - cellule à 4 °C (critère « Température de 4 °C ») : les deux liens ggmgastro, lus en 6 s ;
  - marmite de brassage 50 L : brewstore et Galaxus KS240L, lus en 5 et 6 s. L'IA n'a posé aucun critère (n° 2) ;
  - marmite d'au moins 50 L, refait pour rejouer la jauge de la fiche : critère « Au moins 50 L » posé, mêmes liens ;
  - houblon Citra : hopfenmarkt, lu en 4 s.
  - Les quatre carnets ont été supprimés au toucher.
- Deux achats à payer le 08.12 : « ZZ TEST — achat » (79,95) et « ZZ TEST — achat rond » (80,00), noms simples cette fois. Vus dans la courbe de l'en-tête (zoom ×3), la frise, la semaine S50, les causes du creux, la Liste, Finances › Prévisions. Période remise (restauré true). Les deux écritures ont été retirées (1 → 0 chacune).
- Analyse › Caisse (Synthèse › « Revoir le mois ») : passé seul (26.10 → 24.11), rien à juger pour le 08.12.
- Rejeu, en lecture : C46-1 (Frigo + congel › Quand › Prix), C46-2 (recherche « frigorifique »).

## Corrigés rejoués : 4 sur 4
- **C53-4 vérifié** — en ligne index-Bz-J0D8o.js. Tableau de la marmite : la colonne CHF dit « 302 » et « 520 » seuls ; « sur commande · expédié sous 28 jours · 50 L · 10,40 CHF/L » est sous le nom, entier (M-carnet, Z2-chf). Articles et Comparer gardent « 50 L · 10,40 CHF/L » entier.
- **C54-1 vérifié** — en ligne index-Bz-J0D8o.js. En-tête du Calendrier : « achat rond + 1 autre −159,95 », posé sur la marche de S50 (forme courte, sans « ZZ TEST — ») (F0-haut, Z1-entete). Prévisions : « ZZ TEST — achat rond + 1 autre −159,95, 08.12 » sur sa marche (V2-previsions). Plus de « 2 mouvements ».
- **C54-2 vérifié** — en ligne index-Bz-J0D8o.js. Ses deux fiches et la cellule ZZ : Température, Volume, Performance, **Branchement** 1N~/PE, Tension, Type de refroidissement, Fluide R290, Quantité de frigorigène 0,13 kg, puis dimensions et porte ensemble (A-F1-0, A-F1-1, A-F2-0, Z-F1-0, Z-F1-1). Le nouveau libellé déborde dans le Comparer : n° 1.
- **C54-3 vérifié** — en ligne index-Bz-J0D8o.js, sur le carnet « d'au moins 50 L » : la fiche met 50 à gauche et « 242 la plus haute des 2 » à droite, dans le même sens que la feuille Articles (N-F1-0, N-F2-0, N-articles-0).
- Rejeu, regardé :
  - Tiennent : C46-1 (« 400 CHF · budget » blanc sur vert, K3-frigo-prix) et C46-2 (« frigorifique » en gras, R-frigorifique).
  - Tient : C46-5. On lit 79,95, −80 et −159,95 partout, et « à dépenser » passe à −623 = −463 − 159,95 (F0-haut, S50, D1-causes).
  - Tient : K51-1 (la marche est nommée, Z1-entete). Tient : PC-117 (Prévisions nomme l'achat, V2-previsions).
  - Tiennent : E47-1 à E47-3 (« sur commande · expédié sous 28 jours », « Hauteur cm 143,5 / 37 », « Dimensions avec moteur »). Non rejouable : E47-4 (la fiche du KS240L ne lit plus de référence).
  - Tiennent : C48-1 à C48-6 (prix lus, libellés coupés avec un trait, « Classé par Prix » des deux côtés, Compromis chiffré « 289,77 CHF de moins », 19 à 20 caractéristiques, valeurs du tableau sur une ligne).
  - Tiennent : C50-1 à C50-4 et C50-6 à C50-9 (température lue, colonne °C, aucun doublon, même ordre sur les fiches, « 242 L » dans Articles, « Induction : non », Veiller entier, « en stock » sur une ligne).
  - Encore là : C50-5, côté cellule seulement : « la 1re, la température 0 à 8 °C ; 2 697,74 CHF, la moins chère » (Z-comparer-5). Côté marmite, le Compromis dit maintenant « 218 CHF de moins que la 2e ». Ligne qui n'est pas à moi, non modifiée.
  - Tiennent : C52-1 à C52-3 (pas de jauge vide, prix seul dans la pastille avec « 50 L · 10,40 CHF/L » dessous, vendeur et prix séparés).
  - Tiennent : C53-1, C53-2, C53-3, C53-5 (fiche du Citra : Alpha 12,8 %, Bêta, Cohumulone, Récolte, Huiles totales, Myrcène 59,8 % en tête des huiles ; carte « Alpha 12,8 % · Récolte 2025 · 2,5 ml/100 g · +10 » ; porte ensemble ; Prévisions nommée).

## Combien et quels problèmes ? 4
1. m — **C55-1** — Comparer, son carnet Chambre froide et la cellule ZZ : le libellé « Branchement » mesure 85 px dans une colonne de 74 px. Il déborde et touche la valeur : on lit « Branchement1N~/PE » (B-branchement, ZB-branchement, A-comparer-1). Les autres libellés longs passent à la ligne ou se coupent avec un trait. Le brasseur : « Branchement1N~/PE, c'est collé. » Attendu : le libellé entier dans sa colonne, coupé (« Branche-ment ») ou abrégé, avec un blanc avant la valeur.
2. m — **C55-2** — Nouveau carnet « ZZ TEST — marmite de brassage 50 L » : l'aperçu annonce « Ce qui compte · Marmite de brassage 50 L », mais le carnet créé n'a aucun critère. Au tour 54, la même phrase donnait « Volume de 50 L ». Classé par Prix, le frigo de 242 L passe 1er (C2-avant-entree, C2-t18, M-carnet, M-articles-0). Avec « d'au moins 50 L », le critère « Au moins 50 L » est bien posé (C4-fin). Le brasseur : « J'ai écrit 50 L, il ne le retient pas. » Attendu : les 50 L de la phrase deviennent le critère, comme l'aperçu le promet.
3. m — **C55-3** — Comparer de la marmite, avec ou sans critère : l'en-tête de chaque colonne dit en gros « 242 » et « 50 », sans unité ; seule la ligne dit « Volume L » (M-comparer-0, N-comparer-0). Pour comparer, la cellule dit « 0 à 8 °C » et son carnet « 2,6 m³ ». Le brasseur : « 242 quoi ? » Attendu : « 242 L » et « 50 L ».
4. D — **C55-4** — Comparer, son carnet et la cellule ZZ : « dispo » (et « vendeur » sur la cellule) sont rangés au milieu des caractéristiques, entre la largeur de la porte et Température ou Performance. Le Comparer met aussi les dimensions avant l'énergie, alors que la fiche fait l'inverse (A-comparer-0, A-comparer-1, Z-comparer-1). Le brasseur : « "en stock" au milieu des dimensions, ça n'a rien à faire là. » Attendu : dispo et vendeur avec le prix, en tête, puis les groupes dans l'ordre de la fiche.

Bloquants : 0. Aucun geste sans effet, aucune valeur fausse, aucun texte illisible : au n° 1, les deux mots se lisent encore. Rien de ses choix ne manque.

### Doutes (non comptés)
- Feuille Articles : le bout de la jauge touche le mot « Veiller » (M-articles-0, N-articles-0). Déjà vu au tour 54.
- Causes du creux : « Horizon : jusqu'au 23 nov. 2031 », cinq ans pour un écran de quelques semaines (D1-causes). Hors du tour.
- Vue 1 sem. (S50, après un toucher sur la semaine) : l'en-tête dit « Solde −543 » sans marche ni nom au 08.12 (S50). Je ne l'ai pas zoomée ; la frise, elle, montre les deux achats.
- Un doigt posé dans le cadre de l'en-tête et glissé déplace la période d'une semaine (G1-doigt-S50 : « 30 nov. 2026 – 10 janv. 2027 »). C'est sans doute le cadre glissable voulu. La période a été remise.
- Sens métier, carnets de test : un frigo de 242 L passe 1er dans un carnet de marmite, sous « Au moins 50 L ». L'article est hors sujet exprès ; l'IA propose d'ailleurs « Déplacer vers Frigo + congel ».
- La pastille « Lu · Citra Hopfenpellets » reste sur les autres carnets ZZ et couvre le bas des fiches. Elle se ferme au ×.
- Comparer : « Épaisseur de l'isolation mm » s'écrit sur 4 à 5 lignes dans la colonne étroite (A-comparer-2). Lisible.
- « densité d'isolation » commence encore par une minuscule.

## Table (captures 390 ouvertes)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| A-carnet, A-articles-0/1 (P-a1) | clair | 390 | son carnet, Articles | 0 | 0 |
| A-F1-0..3, A-F2-0/1 (P-a1, P-a2, P-a5) | clair | 390 | ses fiches | 0 | 0 |
| A-comparer-0..5 (P-a3, P-a4) | clair | 390 | son Comparer | 2 (n° 1, 4) | 0 |
| B-branchement, ZB-branchement (P-c3) | clair | 390 | zoom ×3 de la ligne Branchement | 1 (n° 1) | 0 |
| SH1-houblons, SH2-fiche, SH3-fiche-bas (P-a4, P-a5) | clair | 390 | son stock de houblons | 0 | 0 |
| K3-frigo-prix, R-frigorifique (P-a5) | clair | 390 | rejeu C46-1, C46-2 | 0 | 0 |
| Z-carnet, Z-articles-0/1, Z-F1-0/1, Z-F2-1 (P-z1, P-d1, P-d2) | clair | 390 | cellule ZZ | 0 | 0 |
| Z-comparer-0/1/2/5 (P-z2) | clair | 390 | Comparer de la cellule | 2 (n° 1, 4) | 0 |
| C2-avant-entree, C2-t18, C1-t18, C4-fin (P-e1) | clair | 390 | création des carnets | 1 (n° 2) | 0 |
| M-carnet, M-articles-0/1, M-F1-0/1, M-F2-0/1 (P-m1, P-d1, P-d2) | clair | 390 | marmite ZZ sans critère | 1 (n° 2) | 0 |
| M-comparer-0/1/2/5 (P-m2, P-d2) | clair | 390 | Comparer de la marmite | 1 (n° 3) | 0 |
| N-articles-0, N-F1-0, N-F2-0, N-comparer-0 (P-n1) | clair | 390 | marmite ZZ « Au moins 50 L » | 1 (n° 3) | 0 |
| H-carnet, H-F1-0/1 (P-m2, P-d1) | clair | 390 | carte et fiche du houblon Citra | 0 | 0 |
| Z2-chf (P-c3) | clair | 390 | tableau de la marmite, zoom ×3 | 0 | 0 |
| F0-haut, F1, Z1-entete, G1-doigt-S50, G3-appui-S50 (P-c1, P-c3, P-c4) | clair | 390 | en-tête et frise du Calendrier | 0 | 0 |
| B1-achats, C-A, D1-causes, S50, L1-liste, L2 (P-c2, P-c4) | clair | 390 | fiches des achats, causes, semaine, Liste | 0 | 0 |
| V2-previsions (P-c1) | clair | 390 | Prévisions | 0 | 0 |
| AN1-caisse (P-c4) | clair | 390 | Analyse › Caisse (passé seul) | 0 | 0 |

LEÇON PROPOSÉE : le critère tiré de la phrase varie d'un tour à l'autre pour la même phrase. Pour rejouer un défaut lié au critère, lire « Ce qui compte » juste après la création, avant de payer les liens, et sinon prendre une phrase qui le force (« d'au moins 50 L »).
