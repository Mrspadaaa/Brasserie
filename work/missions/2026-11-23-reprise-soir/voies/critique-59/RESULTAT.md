OK — 10 problèmes, 3 bloquants

RESULTAT critique-59 : 10 problèmes (B 3, m 7, D 0) — corrigés rejoués 9/9 — carnet identique oui — BUGS OK

Version : index-BoCN8sbd.js (curl ?nocache et `maj.mjs` : l'onglet neuf est sur BoCN8sbd).
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2272 bugs, 523 ouverts, 202 sources).
Couvert : thème clair, 390 × 844, deviceScaleFactor 2, au toucher (CDP). Chrome de débug 9222, mon onglet seulement ; fin par page.close() puis disconnect (le navigateur reste ouvert). Non couvert : 1280 et sombre (DOSSIER).

## À savoir d'abord (pilote)
- **L'IA de production est bloquée.** Depuis ~15:48 UTC, aiTask répond `ok:false` : « le plafond de dépenses IA du projet est atteint. Vérifie le plafond mensuel dans la console AI Studio → Dépenses ». Fait externe : c'est un réglage du compte, donc une décision de l'utilisateur. Le brasseur aussi est touché, pour tout rangement, toute lecture de lien et Relire. C56-4 n'a pas pu être rejoué.
- **Coût IA critique-59** : environ 0,022 CHF réels. Trois appels ont abouti : le rangement de la cellule ZZ, et deux lectures de lien (Z1, Z2). Les autres ont été refusés pour 0 CHF : marmite, tuyau, liens M1 et M2, deux Relire. Le joint était bloqué exprès. Le journal compte 9 lignes et une note de correction. Aucun appel IA sur ses carnets : 0 réponse aiTask relevée pendant les vues.
- **Le brasseur a travaillé pendant le test.** Vers 15:42 UTC, il a créé le carnet « Houblons citra » (Brasserie, 2 articles, lien motlerhops). Les carnets passent de 20 à 21 ; ce n'est pas mon fait. Ma phrase « ZZ TEST — houblon Citra » a trouvé son carnet (« Déjà un carnet proche ») et Ajouter l'a ouvert. Rien n'a été créé, et rien de ZZ n'est dans ses documents Firestore (`insp3`).

## Son carnet et ses soldes : avant = après (`avant.json`, `apres.json`)
- 17 champs sur 18 sont identiques. Seules les puces changent (Tous 21, Brasserie 5), à cause de son carnet neuf.
- À dépenser −463 (S53). En caisse 1 145,00. Synthèse 0,00 / 265,40. Opérations 265,40 / 0,00 / 265,40. Départ 1 145,00. Mon mois et HABITUELS identiques.
- Période : 6 sem., du 23 nov. 2026 au 3 janv. 2027 ; le localStorage est identique.
- Ses 16 choses de la frise : les aria sont identiques une par une.
- Chambre froide : texte identique, et ses 2 documents Firestore aussi (837 et 9 086 o).
- « Houblons citra » est intact après mes Relire : 2 articles (vueH), 0 trace ZZ.
- Aucun ZZ ne reste : 2 écritures retirées (1 → 0), 4 carnets ZZ supprimés au toucher (garde « Ajouter à ZZ TEST… »), la barre ZZ supprimée.
- Gardes : `cibleZZ` (k-poi, k-saut, k-vit) avait perdu ses barres obliques. Je l'ai réparée (`/,\s*S\d+|ZZ TEST/`) avant tout geste sur la frise.

## Corrigés rejoués : 9 sur 9 (6 vérifiés, 3 rouverts)
- **C58-1 vérifié** — en ligne index-BoCN8sbd.js. « 2,6 m³ - groupe… » tient dans la liste et la feuille Articles, et « 4,06 m³ » dans la recherche (A-carnet, A-articles-0, R-frigorifique).
- **C58-2 vérifié** — en ligne index-BoCN8sbd.js. « joint torique 20 mm » et « cellule à 4 °C » sont entiers, à la taille du titre (zoom XJ-titre, C1-fin). Le « 50 L » du lien retour est mal placé : voir le n° 5.
- **C58-3 rouvert** — Le joint ZZ n'a qu'un message, et son bandeau dit « 3 messages rangés tel quel ». Voir le n° 1 (RL-0).
- **C58-4 rouvert**, et **C50-5 rouvert** — Le compromis ne dit toujours pas la perte (n° 3).
- **C58-5 vérifié** — en ligne index-BoCN8sbd.js. Le carnet est « Classé par Marmite de brassage 50 L › Prix », avec la colonne volume L et la jauge. Mais le sens du classement est faux (n° 4).
- **C58-6 vérifié** — en ligne index-BoCN8sbd.js. Le prix est sur la ligne du vendeur, à droite, pour ggmgastro (son carnet et la cellule), brewstore et galaxus (A-F1-0, XZ-offre, M-F1-0, M-F2-0).
- **C56-3 vérifié** — en ligne index-BoCN8sbd.js. Les titres sont entiers. Sur la fiche MotlerHops de son carnet, les poids « 50 g, 250 g et 500 g » sont entiers. Je n'ai pas rejoué les variantes du Citra ZZ, car la phrase est allée vers son carnet.
- **C55-2 vérifié** — en ligne index-BoCN8sbd.js. Le critère promis est créé et classe (C2-fin, M-comparer-0). Le frigo passe pourtant 1er : voir le n° 4.
- Rejeu, en regardant :
  - Tiennent : K57-1, K57-2, Q4-1 et POI-1. Les chiffres sont ceux du tour 58 :
    - poignée à 2 et 4 px : rien ; à 6 px : 1 jour ; à −49 px : 4 janv. ;
    - barre tenue : S51 → S12 à 30 px, S51 → S20 à 4 px ;
    - cadre à 4 px : 8 → 44 sem. ;
    - toucher bref : la fiche.
  - Tiennent : C46-1, C46-2 et C46-5. L'en-tête dit −623 = −463 − 159,95 ; les causes S50 listent les deux achats ZZ et Fruty.
  - Tiennent : C54-1 à C54-3 (« achat rond + 1 autre −159,95 ») et C53-5 (la bulle du 08.12 dans Prévisions).
  - Tiennent : C53-4 (« 50 L · 10,40 CHF/L » sur la ligne de l'article), E47-1 (« sur commande · expédié sous 28 jours »), E47-2 (Hauteur en cm aux deux) et E47-3 (« Dimensions avec moteur »).
  - Tiennent : C52-1 à C52-3, C56-1, C56-2 (légende « 242 L la plus haute des 2 » entière), C56-6 (« Classés par ce qui compte : Température de 4 °C ») et C55-3.
  - Non rejouables : C56-4 (IA plafonnée), ainsi que C53-1 et C53-2 (pas de Citra ZZ).
  - Non revus ligne à ligne : E47-4, C53-3, C55-4, C56-5, C48-1 à C48-6 et C50 (hors C50-5). Je n'ai vu aucun écart sur les captures du tour.

## Combien et quels problèmes ? 10
1. **B — C59-1** — « Relire » déplace les articles d'un carnet à l'autre.
   - Je touche « Relire » dans « ZZ TEST — joint torique 20 mm ». Il reprend les messages de la marmite ZZ et range ses 2 articles (KS240L, Maischekessel) dans le joint.
   - La marmite se vide : « Articles · collez un lien ». « Relire » dans la marmite les y ramène.
   - Captures : RL-0, RL-t25, RM-0, RM-t25.
   - Le brasseur : « Je relis le joint, et ma marmite se vide ? »
   - Attendu : Relire ne reprend que les messages du carnet ouvert, et chacun reste dans son carnet.
2. **m — C59-2** — L'IA est en pause (plafond atteint), mais l'app dit « L'IA n'a pas répondu : 3 messages rangés tel quel » sans jamais donner la cause.
   - Chaque Relire relance 12 à 15 appels, tous refusés en 0,25 s (C2-fin, RL-t3, RM-t25).
   - Le brasseur : « Elle n'a pas répondu, ou elle est coupée ? »
   - Attendu : « IA en pause : plafond atteint », et pas de relance en boucle.
3. **m — C59-3** — R32 n'est pas tenu en ligne : le compromis ne dit pas ce qu'on perd.
   - Son carnet dit « la 1re, la moins chère : 289,77 CHF de moins que la 2e ; aucun critère ne les départage », alors que le tableau montre 2,6 m³ contre 4,06 m³. Pareil sur la cellule ZZ (A-comparer-3, Z-comparer-3).
   - Le brasseur : « Et je perds quoi pour 289 balles ? »
   - Attendu : « …mais la 2e a 4,06 m³ au lieu de 2,6 m³ ».
4. **B — C59-4** — Le critère « Marmite de brassage 50 L » classe le plus grand volume d'abord.
   - Le frigo KS240L (242 L) est 1er, et la marmite de 50 L est « 2e sur 2 ».
   - Le compromis présente « le volume 242 L au lieu de 50 L » comme un gain (M-comparer-0, M-F1-0, M-articles-0).
   - C'est sa plainte de C55-2 qui revient.
   - Le brasseur : « J'ai dit une marmite de 50 L, et il me met un frigo de 242 L en premier ? »
   - Attendu : 50 L est une cible (le plus proche, ou au moins 50 L).
5. **m — C59-5** — Le lien retour du Comparer de la marmite affiche « ZZ TEST — marmite de » / « brassage » à gauche, et « 50 L » seul à droite de la 1re ligne. Le nombre est entier, mais il est sorti de sa place (M-comparer-0).
6. **B — C59-6** — Son carnet « Houblons citra » :
   - « Citra 13.6% » est classé 1er à « dès 0,10 CHF », sans quantité, contre 3,72 € chez MotlerHops (50, 250 ou 500 g).
   - Il n'y a ni prix au kg ni prix au 100 g, et un houblon à 0,10 CHF n'existe pas.
   - Captures : H-articles-0, H-comparer-0, H-F1-0.
   - Le brasseur : « 0,10 le Citra ? Pour combien de grammes ? »
   - Attendu : le prix ramené à une même quantité (CHF/kg, comme CHF/L pour la marmite), ou « quantité inconnue » sans classer.
7. **m — C59-7** — Le même article MotlerHops a deux prix.
   - « ≈3 » CHF dans le tableau et dans l'Offre de la fiche ;
   - « ≈4 CHF rendu » dans la feuille Articles et dans Comparer ;
   - captures : C3-fin, H-F2-0, H-articles-0, H-comparer-0.
8. **m — C59-8** — Sur la fiche « Citra 13.6% », la caractéristique s'appelle « Citra : 13,6 % ». C'est l'alpha, et ce n'est pas dit (H-F1-0).
9. **m — C59-9** — Sur la même fiche, les arômes restent en allemand : « Limette, Mango, tropische Früchte » (H-F1-0, règle d'E47-3).
10. **m — C59-10** — Dans la feuille Articles de la marmite ZZ, la jauge verte du KS240L touche le mot « Veiller » (M-articles-0).

Bloquants : 3.
- n° 1 : des données sont déplacées.
- n° 4 et 6 : valeurs fausses, à cause d'un classement contraire à son critère et d'un prix sans quantité.

Aucun élément de maquette ne manque.

### Doutes (non comptés)
- Encore vu : VC4-lache. 1,8 s après avoir lâché le cadre à 4 px, l'écran est voilé de blanc (P-k1).
- Après Annuler sur une barre tirée, la barre mesure 49–383, puis revient à 50–389. C'est transitoire, déjà vu au tour 58.
- Dans l'Offre, « 2 987 ,51 » paraît avoir une espace avant la virgule, avec la chasse fixe (XZ-offre).
- Son carnet Houblons citra dit « Origine USA » sur une fiche et « États-Unis » sur l'autre.
- Le cache Firestore garde 6 messages ZZ « done » plus anciens, qui ne sont pas de ce tour. Leurs carnets ne sont plus dans la liste.
- Déjà vus : « Horizon : jusqu'au 23 nov. 2031 » dans les causes, et la bulle « achats ≥ 2,40, 13.12 » dans Prévisions.

## Table (captures 390 ouvertes)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| A-carnet, A-articles-0, R-frigorifique | clair | 390 | son carnet, Articles, recherche | 0 | 0 |
| A-comparer-0, A-comparer-3, A-F1-0 | clair | 390 | son Comparer, compromis, fiche | 1 (n° 3) | 0 |
| K1-frigo, K3-frigo-prix, SH2-fiche | clair | 390 | ses carnet Frigo et stock (lecture) | 0 | 0 |
| C1-fin, C2-t0_5, C2-fin, C3-avant-entree, C3-fin | clair | 390 | créations ZZ, phrase vers son carnet | 2 (n° 2, 7) | 0 |
| RL-t3, RL-t25, RM-0, RM-t25 | clair | 390 | Relire joint puis marmite | 2 (n° 1, 2) | 1 |
| M-comparer-0, P-mf (M-F1-0, M-F2-0, Z-articles-0, M-articles-0) | clair | 390 | marmite et cellule ZZ | 3 (n° 4, 5, 10) | 1 |
| H-articles-0, H-comparer-0, H-F1-0, H-F2-0 | clair | 390 | son carnet Houblons citra (lecture) | 4 (n° 6 à 9) | 1 |
| XJ-titre, XZ-offre (zoom ×3) | clair | 390 | titre 20 mm, Offre | 0 | 0 |
| P-k1 (P30-pendant, P30-apres, VC4-pendant, VC4-lache) | clair | 390 | barre et cadre tenus | 0 | 0 |
| P-r1 (F0-haut, B1-achats, S50, D1-causes) | clair | 390 | en-tête, achats ZZ, causes | 0 | 0 |
| P-r2 (L1-liste, V2-previsions, C-A) | clair | 390 | Liste, Prévisions | 0 | 0 |

LEÇON PROPOSÉE : un test en ligne relève le corps des réponses IA, pas seulement leur statut. Ici, aiTask répondait 200 avec `ok:false` (plafond atteint). Sans le corps, on aurait conclu à une régression de C56-4. Il faut aussi lancer un Relire seulement quand un seul carnet a des messages à reprendre : sinon, le geste peut toucher les choses d'autres carnets, y compris les siennes.
