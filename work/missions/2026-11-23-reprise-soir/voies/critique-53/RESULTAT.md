OK — 6 problèmes, 0 bloquants

RESULTAT critique-53 : 6 problèmes (B 0, m 6, D 0) — corrigés rejoués 4/4 — carnet identique oui — BUGS OK

ALERTE (hors de mon test, à lire d'abord) : son carnet « Chambre froide » a été réécrit le 24.11 à 11:38, heure suisse (updateTime Firestore 10:38:15Z). C'est entre l'« après » de critique-52 (10:20Z, document de 6 174 o) et mon « avant » (9 086 o). Ses deux articles ont été relus (luLe 10:38:12Z et 10:38:14Z) : prix 2 697,74 et 2 987,51, plus Tension et Volume ajoutés. Le journal IA n'a aucune ligne à cette heure. Ce n'est pas moi ; je ne sais pas qui l'a fait : le brasseur lui-même, ou un script du tour 53 (c52-fix a commité à 11:37 et 11:38). À éclaircir par le pilote.

Version : index-BImwE2Gr.js, vérifiée par curl (?v=). Mon onglet a été passé de CoUp1JRM à BImwE2Gr par `maj.mjs` (rechargement, aucun avis « Nouvelle version »).
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2239 bugs, 515 ouverts, 202 sources).
Couvert : thème clair, 390 × 844, au toucher, Chrome de débug 9222, mon onglet seulement (page.close, puis disconnect ; navigateur gardé). Non couvert : 1280 et thème sombre (consigne du DOSSIER).
Coût IA : 3 rangements et 5 lectures de lien, environ 0,056 CHF (plafond 0,10). Journal `2026-11-23-carnet-en-ligne/ia-journal.jsonl` : 8 lignes critique-53. Aucun appel IA sur son carnet ni sur son stock.

## Son carnet et ses soldes : avant = après (`avant.json`, `apres.json`, 17 champs identiques, paquet mis à part)
| | avant = après |
|---|---|
| à dépenser | −463 (S53, dans le cadre) |
| En caisse ; Entré / Dépensé ; Opérations | 1 145,00, libre 1 145,00 ; 0,00 / 265,40 ; 265,40 / 0,00 / 265,40 |
| Solde de départ ; Mon mois ; HABITUELS | 1 145,00 ; — ; identiques |
| période du Calendrier | 6 sem., 23 nov. 2026 – 3 janv. 2027 ; localStorage identique à l'octet |
| Carnets | Tous 20, Local 10, Brasserie 4, Meuble 4, Papiers 2 ; texte de la liste identique |
| Chambre froide | texte de l'écran identique ; ses 2 documents Firestore du cache identiques à l'octet |
| ZZ restants | aucun (Opérations, Calendrier, carnets) |

## Joué
- Son carnet, en lecture seule : carnet, feuille Articles, Comparer (défilé) et les deux fiches (défilées), deux fois (A, A2). Aucun « Relire ».
- Son stock : Stocks › Articles › Houblons, puis la fiche « Cryo Hops Citra 25g » (α 24,8 %), regardée puis fermée par Échap. « Enregistrer » est resté gris. Catalogue des houblons et son retour.
- ZZ TEST — cellule à 4 °C (critère « Température de 4 °C ») : les deux liens ggmgastro, lus en 7 s et 4 s. ZZ TEST — marmite de brassage 50 L : brewstore et Galaxus KS240L. ZZ TEST — houblon Citra : hopfenmarkt.ch/produkt/hopfen/citra, lu en 5 s (fiche houblon, nouvel ordre). Vues : tableau, Articles, Comparer, fiches. Les trois carnets ont ensuite été supprimés au toucher (Plus › Supprimer le carnet).
- Deux achats à payer le 08.12, 79,95 et 80,00 (Finances › Écriture, à la main › Achat). Mon script ajoute déjà « ZZ TEST — » : les libellés sont devenus « ZZ TEST — ZZ TEST — achat » et « … achat rond ». Vus dans la courbe, la bulle Achats, S50, les causes du creux, la Liste et Finances › Prévisions. La période a été remise (restauré true). Les deux écritures ont été retirées (1 → 0 chacune).
- Rejeu de C46-1 et C46-2 (Frigo + congel, recherche « frigorifique »), en lecture.

## Corrigés rejoués : 4 sur 4
- C50-4 vérifié — en ligne index-BImwE2Gr.js : sur les jumelles ZZ, les 19 caractéristiques sont dans le même ordre sur les deux fiches (Z-F1, Z-F2). Sur son carnet relu le 24.11, 20 sur 20 sont au même rang (A-F1, A-F2). Marmite et KS240L : Volume puis Hauteur dans le même ordre.
- C52-1 vérifié — plus de piste vide à côté de « 0 à 8 °C température » (Z-articles-0) ni de « 2,6 m³ Volume » (A-articles-0). La marmite garde une jauge chiffrée, 242 L contre 50 L (M-articles-0).
- C52-2 vérifié — la pastille dit « 520 CHF », puis « 50 L · 10,40 CHF/L » ; la fiche et le Comparer disent la même chose. Plus aucun volume entre le montant et la devise (M-articles-0, M-F1-0, M-comparer-0). Il reste une coupure dans le tableau : voir n° 4.
- C52-3 vérifié — sur la ligne Offre, « ggmgastro.com » et « 2 987,51 CHF » sont séparés de 10 px. Le texte lu est « ggmgastro.com ¦ en stock ¦ 2 987,51 CHF ». Même chose pour brewstore et Hopfenmarkt (Z-F1-0, A-F1-0, M-F1-0, H-F1-0).
- Rejeu, regardé :
  - C46-1 tient : « 400 CHF · budget » blanc sur vert (K3-frigo-prix).
  - C46-2 tient : « frigorifique » en gras (R-frigorifique).
  - C46-5 tient : 79,95, −80 et −159,95 partout ; « à dépenser » passe à −623 = −463 − 159,95 (F0-haut, D1-causes, G1-doigt-S50).
  - K51-1 tient : « 2 mouvements −159,95 » sur la marche (F0-haut).
  - PC-117 non confirmé : voir n° 5.
  - E47-1 à E47-3 tiennent : « sur commande · expédié sous 28 jours », « Volume L », « Hauteur cm 143,5 / 37 », « Dimensions avec moteur » (M-F1-0, M-comparer-0). E47-4 non rejouable : pas de références lues.
  - C48-2 à C48-6 tiennent : libellés entiers avec trait d'union, « Classé(s) par Prix » des deux côtés, 20 caractéristiques, Compromis chiffré sans critère, tableau sur une ligne. C48-1 non rejouable : son carnet a maintenant ses prix (voir l'ALERTE).

## Combien et quels problèmes ? 6
1. m — C53-1 — La fiche du houblon Citra (hopfenmarkt) suit un ordre alphabétique pour les huiles : Farnésène 0,1 %, Caryophyllène 7,4 %, Humulène 13 %, puis Myrcène 59,8 %, l'huile dominante, en dernier. Bêta 4 % et Cohumulone 24,2 % viennent après les huiles, loin de l'alpha (H-F1-0, H-F1-1). Alpha, Récolte et Huiles totales sont bien en tête. Le brasseur : « Le myrcène en dernier ? Et le bêta, il va à côté de l'alpha. » Attendu : alpha, bêta et cohumulone ensemble, puis les huiles du plus lourd au plus léger.
2. m — C53-2 — La carte de cet article dit « Alpha 12,8 % · Bêta 4 % · Caryophyllène 7,4 % · +10 » : ni la récolte ni les huiles totales, que la fiche place juste après l'alpha (H-carnet). Le brasseur : « La caryophyllène, je m'en fiche pour choisir. » Attendu : la carte reprend la tête de la fiche.
3. m — C53-3 — Chambre froide, sur son carnet et sur la cellule ZZ : l'ordre est le même sur les deux fiches, mais « Hauteur de la porte » (14e) et « Largeur de la porte » (18e) sont séparées par Largeur de l'unité, Quantité de frigorigène et Performance. La puissance (550 W) arrive 17e sur 19, juste avant la couleur (A-F1-1, A-F1-2, Z-F1-1, Z-F1-2). Le brasseur : « La porte, c'est hauteur et largeur ensemble. » La c52-fix l'avait annoncé (tri par nom pour les inconnus).
4. m — C53-4 — Tableau de la marmite : la colonne CHF dit « 520 », puis « 50 L · », « 10,40 » et « CHF/L » sur trois lignes. Le prix unitaire est coupé entre le nombre et son unité (M-carnet). Le brasseur : « 10,40 quoi ? » Attendu : « 10,40 CHF/L » sur une ligne.
5. m — C53-5 — Finances › Prévisions : la marche de −159,95 du 08.12 n'a plus d'étiquette. La seule bulle après elle, posée au pied de la marche, dit « achats ≥ 2,40, 13.12 » : on lit 2,40 pour une chute de 160. Au tour 52, la bulle disait « ZZ TEST — achat rond + 1 autre −159,95, 08.12 » (V2-previsions). Le total est juste : 1 145 − 625,28 − 159,95 − 2,40 = 357,37. Le brasseur : « Ça tombe de 160 et ça dit 2,40 ? » Doute sur la cause : mes libellés de test étaient plus longs ce tour.
6. m — C50-5 (encore là, hors des corrigés du tour) — Compromis de la cellule : « la 1re, la température 0 à 8 °C ; 2 697,74 CHF, la moins chère ». La température est la même aux deux, et rien n'est dit sur les 289,77 CHF de plus pour 4,06 m³ (Z-comparer). Le brasseur : « Ça je le vois déjà. » La ligne C50-5 n'est pas à moi : non modifiée.

Bloquants : 0. Aucun geste sans effet, aucune valeur fausse (le n° 5 trompe la lecture, mais le total est juste) et rien de ses choix ne manque.

### Doutes (non comptés)
- Feuille Articles de la cellule : la jauge vide a disparu, mais rien ne dit maintenant que « 0 à 8 °C » tient le critère « 4 °C ».
- Les valeurs de la fiche sont dans deux polices : Récolte « 2025 », Huiles « 2,5 ml/100 g » et Volume « 50 L » en chasse fixe, les autres en police normale (H-F1-0, M-F1-0).
- Le Comparer de la cellule garde l'ordre de la page (Épaisseur de l'isolation, Exécution, densité, Étape…), qui n'est pas celui des fiches (Z-comparer-2) : on ne retrouve pas une ligne au même endroit entre Comparer et fiche.
- Fiche houblon de son stock (Cryo Hops Citra) : α en pastille, mais ni rôle ni arômes. Écran hors de ce tour.
- La pastille « Lu · Kibernetik KS240L » reste sur les autres carnets ZZ et couvre le bas du Comparer ; elle se ferme au ×.
- Feuille Articles de la marmite : le bout de la jauge de 242 L touche le mot « Veiller ».
- Recherche « frigorifique » : la cellule ZZ montre « dès 2 697,74 » avec l'extrait de l'article 4,06 m³, qui coûte 2 987,51.
- Le Prévisions du tour 52 ne peut pas être refait à l'identique : mes libellés en double « ZZ TEST — ZZ TEST — » sont mon erreur de script.

## Table (captures 390 ouvertes)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| A-carnet, A-articles-0 | clair | 390 | son carnet, Articles | 0 | 0 |
| A-F1-0, A-F2-0 | clair | 390 | ses fiches | 1 (n° 3) | 0 |
| A-comparer-0 | clair | 390 | son Comparer | 0 | 0 |
| Z-articles-0 | clair | 390 | Articles de la cellule | 0 | 0 |
| Z-F1-0 | clair | 390 | fiche de la cellule | 1 (n° 3) | 0 |
| Z-comparer-0, Z-comparer-2 | clair | 390 | Comparer de la cellule | 1 (n° 6) | 0 |
| M-carnet | clair | 390 | tableau de la marmite | 1 (n° 4) | 0 |
| M-articles-0, M-F1-0, M-comparer-0 | clair | 390 | Articles, fiche, Comparer de la marmite | 0 | 0 |
| H-carnet | clair | 390 | carte du houblon Citra | 1 (n° 2) | 0 |
| H-F1-0, H-F1-1 | clair | 390 | fiche du houblon Citra | 1 (n° 1) | 0 |
| SH2-fiche | clair | 390 | fiche de houblon de son stock | 0 | 0 |
| K3-frigo-prix, R-frigorifique | clair | 390 | rejeu C46-1, C46-2 | 0 | 0 |
| G1-doigt-S50, F0-haut, D1-causes | clair | 390 | courbe, frise, causes | 0 | 0 |
| V2-previsions | clair | 390 | Prévisions | 1 (n° 5) | 0 |

LEÇON PROPOSÉE : un script qui préfixe déjà « ZZ TEST — » ne doit pas recevoir un nom qui le contient : un libellé changé d'un tour à l'autre fausse le rejeu des libellés (Prévisions, coupures).
