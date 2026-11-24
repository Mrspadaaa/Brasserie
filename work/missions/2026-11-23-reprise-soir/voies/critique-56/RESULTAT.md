OK — 6 problèmes, 0 bloquants

RESULTAT critique-56 : 6 problèmes (B 0, m 4, D 2) — corrigés rejoués 4/4 — carnet identique oui — BUGS OK

Version : index-2b8uLKQZ.js. Le curl avec ?nocache donne 2b8uLKQZ, et `maj.mjs` a amené mon onglet neuf sur ce paquet.
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2254 bugs, 515 ouverts, 202 sources).
Couvert : thème clair, 390 × 844, au toucher. Chrome de débug 9222, mon onglet seulement : `clore.mjs` fait page.close() puis disconnect, le navigateur reste ouvert. Non couvert : 1280 et le thème sombre (consigne du DOSSIER).
Coût IA : 10 lignes critique-56 au journal `2026-11-23-carnet-en-ligne/ia-journal.jsonl`, soit 4 rangements, 5 lectures de lien et 1 « Relire » sur ZZ, environ 0,060 CHF (plafond 0,10). Aucun appel IA ni « Relire » sur son carnet ou son stock.
Captures jugées en planches côte à côte (`cap/P-P-*.png`, faites à partir des captures 390), avec des zooms ×3 (`B-branchement`, `Z1-entete`, `X-offre`). Toutes ont été ouvertes.

## Son carnet et ses soldes : avant = après (`avant.json`, `apres.json`, 18 champs sur 18 identiques)
- À dépenser : −463 (S53). En caisse : 1 145,00. Synthèse : 0,00 / 265,40. Opérations : 265,40 / 0,00 / 265,40. Solde de départ : 1 145,00. Mon mois et HABITUELS : identiques.
- Période du Calendrier : 6 sem., du 23 nov. 2026 au 3 janv. 2027. Le localStorage est identique (la période a été remise par `courbe.mjs` et `vuecal.mjs` : restauré true).
- Carnets : Tous 20, Local 10, Brasserie 4, Meuble 4, Papiers 2. Chambre froide : texte identique, et ses 2 documents Firestore du cache (837 et 9 086 o) sont identiques.
- Aucun ZZ restant : Opérations, Calendrier et carnets sont vides. Les deux écritures ont été retirées (1 → 0 chacune) et les quatre carnets ZZ supprimés au toucher.

## Joué
- Son carnet, en lecture seule : le carnet, la feuille Articles, Comparer (défilé et zoom de Branchement) et les deux fiches. Son stock : Houblons, puis la fiche Cryo Hops Citra (α 24,8 %), avec « Enregistrer » resté gris. Rejeu de C46-1 et C46-2.
- Quatre carnets ZZ créés :
  - cellule à 4 °C, avec 2 liens ggmgastro ;
  - marmite de brassage 50 L, avec 2 liens (brewstore et Galaxus KS240L) ;
  - houblon Citra, avec 1 lien hopfenmarkt ;
  - tuyau silicone 8 mm, 5 m, sans lien (pour R24 : l'aperçu ne promet rien qui ne soit créé).
- Deux achats à payer le 08.12 (79,95 et 80,00), vus dans l'en-tête (zoom), la frise, S50, les causes, la Liste et Prévisions, puis retirés.

## Corrigés rejoués : 4 sur 4
- **C55-1 vérifié** — en ligne index-2b8uLKQZ.js. La colonne des libellés fait 100 px. « Branchement » est entier, avec un blanc avant « 1N~/PE ». Les autres libellés longs passent à la ligne. Trois colonnes tiennent à 390 (B-branchement, ZB-comparer-branchement, A-comparer-1).
- **C55-2 vérifié** — en ligne index-2b8uLKQZ.js. Pour « marmite de brassage 50 L », l'aperçu annonce « Marmite de brassage 50 L ». Le carnet naît avec ce critère (calculé sur place), que l'IA reformule en « Volume utile : 50 L », et classe sur lui. Pour le tuyau, l'aperçu ne promet rien et rien n'est créé (C2-avant-entree, C2-t5, C2-fin, C4-avant-entree, RL-t6).
- **C55-3 vérifié** — en ligne index-2b8uLKQZ.js. L'en-tête dit « 242 L » et « 50 L », la jauge « 50 L » / « 242 L ». Son carnet dit « 2,6 m³ » (M-comparer-0, M-F2-0, A-comparer-0). Voir le n° 2 pour la légende.
- **C55-4 vérifié** — en ligne index-2b8uLKQZ.js. Son Comparer donne prix, dispo, puis Température… Couleur, ligne pour ligne dans l'ordre de ses fiches. Voir le n° 6 pour le cas avec un critère.
- Rejeu, regardé :
  - Tiennent : C46-1, C46-2 et C46-5. « −623 » = −463 − 159,95.
  - Tiennent : E47-1 à E47-3. E47-4 n'est pas rejouable.
  - Tiennent : C48-1 à C48-6.
  - Tiennent : C50-1 à C50-4 et C50-6 à C50-9.
  - Encore là : C50-5, sur la cellule et la marmite (« la 1re, la température 0 à 8 °C ; 2 697,74 CHF, la moins chère »). Hors voie, non compté.
  - Tiennent : C52-1 et C52-2. C52-3 retombe à l'œil : voir le n° 1.
  - Tiennent : C53-1 à C53-5 (Alpha, Bêta, Cohumulone, Récolte, Huiles, Myrcène en tête ; la carte dit « Alpha 12,8 % · Récolte 2025 · 2,5 ml/100 g »).
  - Tiennent : C54-1 à C54-3 (« achat rond + 1 autre −159,95 » sur la marche ; la jauge va de 50 à gauche à 242 à droite).

## Combien et quels problèmes ? 6
1. m — **C56-1** — Fiche › Offre, sur son carnet Chambre froide (deux fiches) et sur la cellule ZZ. On lit « ggmgastro.com2 697,74 CHF » : le vendeur touche le prix. La mesure des boîtes dit 10 px, mais le texte déborde de la sienne. C52-3 avait été vérifié sur cette seule mesure, et le rendu est le même au tour 55 (X-offre, en haut le tour 56, en bas le tour 55). Le brasseur : « C'est collé. » Attendu : un blanc net, ou le prix à la ligne.
2. m — **C56-2** — Fiche de la marmite ZZ (2e sur 2), jauge du critère : la légende « 50 L 242 L la plus haute des 2 » est coupée par le bord (« la plus haute d »). Sur la fiche du KS240L, elle tient (M-F1-0, M-F2-0). Les unités ajoutées par R25 l'ont sans doute allongée. Attendu : la légende entière.
3. m — **C56-3** — Un nombre est séparé de son unité en fin de ligne :
   - Variantes du Citra : « … · 250 » puis « g · 500 g · 1 kg » (H-F1-1) ;
   - titre « ZZ TEST — marmite de brassage 50 » puis « L » (lien retour du Comparer, liste des carnets ; M-comparer-0, C4-avant-entree).
   Le brasseur : « 250, puis g en dessous ? » Attendu : nombre et unité sur la même ligne, comme pour C53-4.
4. m — **C56-4** — Nouveau carnet « tuyau silicone 8 mm, 5 m » : 1,5 s après Ajouter, l'écran dit « L'IA n'a pas répondu ». « Relire » range ensuite en 3 s, avec une réponse 200 d'aiTask. Les trois autres créations du tour ont été rangées. La cause n'est pas trouvée : la console n'était pas relevée à la création (C4-t1_5, C4-fin, RL-t6). Attendu : le rangement au premier essai, ou une reprise avant d'annoncer l'échec.
5. D — **C56-5** — Après cet échec, la même nouvelle s'affiche deux fois, l'une sous l'autre : « L'IA n'a pas répondu : 1 message rangé tel quel [Relire] » et « L'IA n'a pas répondu : rangé sur place, rien n'est perdu. » (C4-fin). Attendu : un seul avis, avec son Relire.
6. D — **C56-6** — Comparer avec un critère (cellule et marmite ZZ) : l'ordre est prix, puis la ligne qui classe (« température », « volume L »), puis dispo et vendeur. L'offre est coupée par une caractéristique (R26). Son carnet, classé par Prix, est juste (Z-comparer-0, M-comparer-0). Attendu : prix, dispo et vendeur ensemble.

Bloquants : 0. Aucun geste sans effet, aucune valeur fausse, aucun texte illisible ; rien de sa maquette ne manque.

### Doutes (non comptés)
- Critère de la cellule : l'aperçu dit « Cellule à 4 °C », le carnet « 4 °C » (au tour 54 : « Température de 4 °C »). Pour la marmite, « Volume utile : 50 L » arrive à la place de « Marmite de brassage 50 L ». Le fond est tenu, pas le mot exact de R24. « Critère : Volume utile : 50 L » aligne deux deux-points.
- Sens métier : sous « Volume utile : 50 L », le frigo de 242 L passe 1er (lu comme « au moins », puis le moins cher). L'article est hors sujet exprès.
- Minuscules des libellés : « température », « volume », « densité d'isolation ». « Épaisseur du matériel » vaut 0,5 dans Comparer et 0,50 mm sur la fiche. Les dimensions s'écrivent « × » dans Comparer et « x » sur la fiche.
- Causes : « Horizon : jusqu'au 23 nov. 2031 ». Prévisions : la bulle « achats ≥ 2,40, 13.12 » reste. Déjà vu.
- Stocks › panneau Malts/Houblons/Levures : la rangée Houblons semble rognée au bord droit (SH1-houblons). Non zoomé.

## Table (captures 390 ouvertes)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| A-carnet, A-articles-0, A-comparer-0..5 (P-P-a1, P-P-a2) | clair | 390 | son carnet, Comparer | 0 | 0 |
| A-F1-0..2, A-F2-0..2, X-offre (P-P-a2, P-P-a3) | clair | 390 | ses fiches | 1 (n° 1) | 0 |
| B-branchement, ZB-comparer-branchement | clair | 390 | zoom de Branchement | 0 | 0 |
| SH1-houblons, SH2-fiche, K3-frigo-prix, R-frigorifique (P-P-s1) | clair | 390 | son stock, rejeu C46 | 0 | 0 |
| C1/C2/C4-avant-entree, C1-fin, C2-t5, C2-fin, C4-t5, C4-fin (P-P-c1, P-P-c2) | clair | 390 | création des carnets | 3 (n° 3, 4, 5) | 0 |
| Z2-fin, M2-fin, H1-fin, C3-fin (P-P-c3) | clair | 390 | liens lus | 0 | 0 |
| Z-carnet, Z-articles-0, Z-comparer-0..2, Z-F1-0/1, Z-F2-0 (P-P-z1, P-P-z2) | clair | 390 | cellule ZZ | 2 (n° 1, 6) | 0 |
| M-carnet, M-articles-0, M-comparer-0/1, M-F1-0/1, M-F2-0/1 (P-P-m1, P-P-m2) | clair | 390 | marmite ZZ | 3 (n° 2, 3, 6) | 0 |
| H-carnet, H-F1-0..2 (P-P-h1) | clair | 390 | houblon Citra ZZ | 1 (n° 3) | 0 |
| RL-0, RL-t1..25 | clair | 390 | Relire du tuyau ZZ | 0 | 0 |
| F0-haut, Z1-entete, B1-achats, C-A (P-P-k1) | clair | 390 | en-tête, achats | 0 | 0 |
| D1-causes, S50, L1-liste, V2-previsions (P-P-k2) | clair | 390 | causes, semaine, Liste, Prévisions | 0 | 0 |
| Z2-chf, AN1-caisse, G1-doigt-S50 (P-P-k3) | clair | 390 | tableau CHF, Caisse, glisser | 0 | 0 |

LEÇON PROPOSÉE : un écart en pixels entre deux boîtes ne prouve pas que deux textes sont séparés (C52-3 avait été « vérifié » par cette mesure alors qu'à l'œil c'est collé). Pour un défaut de chevauchement, juger sur un zoom ×3 ou mesurer avec Range.getBoundingClientRect() sur le texte lui-même.
