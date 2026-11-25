MENAGE OK carnet identique oui

## MÉNAGE (DEMANDE EXECUTANT, exécutant, 25.11)
- Étape 1 : « ZZ TEST — c67b pellets pour la NEIPA » ouvert (cap/O9-ouvert.png ; titre vérifié sur l'en-tête). Étape 2 : menu ··· › Supprimer le carnet › « Supprimer avec son plan » : suppression en un seul geste, bandeau « Carnet supprimé · ZZ TEST — c67b pellets pour la NEIPA » (cap/S1-dialogue.png). À venir 12 → 11.
- Étape 3a : « ZZ TEST — c67b les étiquettes… » (sans plan). Dialogue « Supprimer le carnet ZZ TEST — c67b les étiquettes se décollent… ? » vérifié (cap/S2-KO.png, cap/S2-dialogue.txt), puis Supprimer. Il partait avec 1 note.
- Étape 3b : « Photo du 25 nov. » : une seule ligne dans la liste. Carnet ouvert (cap/P1-ouvert.png) : en-tête « Photo · Idée · 25 nov. », une photo datée 25 nov., « pas encore daté ». Créée par le test (photo1.mjs, 02:15). Dialogue « Supprimer le carnet Photo ? » vérifié (cap/S3-dialogue.txt), puis Supprimer (cap/S3-apres.png : « Carnet supprimé · Photo », Carnets 32).
- Étape 4 : `etat.mjs apres` → apres.json. Diff avec avant.json : clés identiques (synthèse, caisse, départ, opérations, Mon mois, à dépenser −463, période, puces, liste, carnet chambre froide 837/9373/947, « Houblons »), À venir 11, Carnets 32. Seule clé différente : fsTout (cache Firestore hors ZZ TEST), écart attendu de la suppression : 1 entrée d'audit (LOG-…7768a8c8) et 13 entrées vides (n=2, lecture seule) pour les documents supprimés (carnets et messages créés par le test). Aucun document existant modifié (0 changement, 0 disparition).
- Liste après ménage (cap/M0-liste.txt) : 0 occurrence « c67b », pas de « Photo du 25 nov. ».
- Doute : la date de création de la Photo est lue sur l'en-tête et la date du message (25 nov.), pas sur une date de création explicite. Les ZZ TEST « pompe qui chauffe » et autres n'ont pas été touchés.
- Scripts : menage2-liste.mjs, menage2-ouvrir.mjs, menage2-supp.mjs, menage2-fs.mjs, etat.mjs. Rien commité.

OK — 9 problèmes, 7 bloquants

RESULTAT critique-67b : 9 problèmes (B 7, m 2, D 0) — corrigés rejoués 5/8 (C66 tenus : 1, 2, 3, 6, 8 ; rouverts : 4, 7, 5 en partie) ; C65 : 5 et 6 tenus, 4 rouvert (= C66-7) — carnet identique : NON VÉRIFIÉ (relevé après à faire, DEMANDE EXECUTANT) — BUGS OK

Version : index-BVBC77LE.js (curl ?nocache ; onglet amené par maj.mjs). DOSSIER prime sur VOIE (SSQ_J86L).
Tests : sans objet (test d'écran). Registre : `bugs.log` (BUGS OK : 2330 bugs, 549 ouverts, 202 sources). Ids en majuscules `C67B-n` : le contrôle ignore en silence un id `C67b-` (minuscule).
Couvert : clair, 390 × 844 au toucher (CDP), 1280 × 800, sombre (data-theme « cave » posé sur la page, aucun réglage écrit), Chrome 9222, mon onglet.

## À savoir d'abord (pilote)
- **Ménage pas fini (plafond de tours)** : restent 3 carnets à moi : « ZZ TEST — c67b pellets pour la NEIPA » (il a un achat dans À venir : 11 → 12, à supprimer « avec son plan »), « ZZ TEST — c67b les étiquettes… », « Photo du 25 nov. » (À ranger, créée par moi : Carnets 33 → 34 à l'envoi). Le mémo c67b est supprimé. Carnets : 35 (32 avant).
- **Relevé avant** (avant.json) : Synthèse 0,00 / 265,40 ; caisse et départ 1 145,00 ; Opérations 265,40 / 0,00 / 265,40 ; Mon mois — ; à dépenser −463 (S53) ; période 23.11 → 03.01 ; 16 barres ; carnets 32 ; À venir 11 ; Chambre froide 3 docs (837/9373/947). Je n'ai touché aucune de ses choses ; écritures sur ZZ seulement (garde sur le titre avant chaque geste).
- Le titre « ZZ TEST — c67b houblons Citra » proposait « Déjà un carnet proche : Houblons citra · Y ajouter » (le sien) : arrêt de garde, rien touché ; titre changé.
- **Coût IA ≈ 0,036 CHF** : 6 lignes au journal (3 lectures de lien, 3 rangements). La photo n'a fait aucun appel. C66-8 joué avec l'IA bloquée (simulée).

## Combien et quels problèmes ? 9
1. **B — C67B-1 (C66-4 rouvert)** — Fiche MotlerHops, « je prends » 1 kg ✓ 40,69 €, puis Choisir · MotlerHops, 1 kg. La confirmation dit « ≈3 CHF » (le sachet de 50 g), le carnet « Choisi » aussi, la liste « ≈4 CHF les 50 g », et À venir « à estimer » (CH-1, CH2-1, AV-1). Valeur fausse.
   - « J'ai pris le kilo, il me met un sachet à 3 balles. »
2. **B — C67B-2** — Dans À venir, l'achat est daté « févr. 2027 » alors que rien n'a été daté. La ligne porte le titre du carnet et non l'article. Le Quand du carnet passe à « vers févr. · prix ? » (AV-1, M12). Valeur fausse.
   - « Février 2027 ? J'en ai besoin pour la NEIPA. »
3. **B — C67B-3** — Confirmation « Choisir chez MotlerHops » (CH-1, CH2-0) : « Ses autres valeurs » déborde à droite.
   - Le curseur Prix sort du cadre, les arômes sont coupés (« citron ve »), Alpha et Origine n'ont pas de valeur visible, et une barre de défilement horizontale apparaît.
   - « ‹ moins cher · 68 » s'affiche sans unité ni sens.
   - Illisible.
4. **B — C67B-4** — Photo seule (Q-t3, Q-carte) :
   - « Photo rangée ici » s'affiche, mais la photo est au bas de l'arbre, hors de vue ;
   - sa carte dit « Aucun problème ouvert où la ranger » alors que 8 problèmes sont « je cherche » ;
   - il n'y a ni « Rattacher à … ? » ni Oui.
   - Valeur fausse.
5. **B — C67B-5** — Mémo « le sol époxy du local a bien tenu… » (MEMO-2) : l'app dit « Aucun de vos 34 carnets n'en parle » et crée un nouveau carnet · idée, en Local. Or ses carnets « Sol — matières premières + outils » et « Sol, murs & évacuation » existent. La maquette v01-memo attend une note « réussi » dans le carnet Sol. Valeur fausse.
   - « C'est fait, c'est pas une idée, et j'ai déjà un carnet Sol. »
6. **B — C67B-6** — Usage neuf, les étiquettes qui se décollent (NEUF-2, W2) :
   - la carte dit « nouveau problème · Je cherche », Brasserie › Conditionnement (juste), et la liste ●●○○ Je cherche ;
   - mais à l'ouverture, l'écran est celui de l'idée (●○○○ idée, « Ensuite : l'IA cherche les façons »), même après être sorti et revenu.
   - Ce n'est pas C67-3, où le geste ··· › Problème se réparait au retour.
7. **B — C67B-7 (C66-5 rouvert en partie)** — Côte à côte (K1-0, K1-1, contre v01-comparer) :
   - tenu : les lignes identiques sont repliées (« 1 identique ▸ États-Unis ») ;
   - reste : seul le prix est coché (ni α 13,6 %, ni « 1 g à 20 kg »), et une ligne « vendeur » redit l'en-tête.
   - Il manque un élément de sa maquette.
8. **m — C67B-8 (C66-7 rouvert)** — Le même sachet MotlerHops de 50 g affiche ≈4 CHF sur la carte et dans la liste, mais ≈3 CHF à la confirmation et sur le carnet « Choisi ».
9. **m — C67B-9** — Sur la fiche, › (article suivant) ouvre la fiche Brau au milieu, sur l'Offre. Le nom, l'α et « je prends » sont hors de vue (F2-0).

Bloquants : 7.
- Valeurs fausses : n° 1, 2, 4, 5 et 6.
- Texte illisible : n° 3.
- Élément de sa maquette absent : n° 7.

### Doutes (non comptés)
1. Le bandeau « Article retiré · Annuler » ne dure que quelques secondes. Entre deux scripts (environ 4 s), il avait disparu et l'article était perdu (je l'ai relu). Joué d'un trait, Annuler le rend.
2. Avec l'IA refusée, le message « Demander au vendeur l'année de récolte… » est étiqueté « À acheter ».
3. Comparer : le bouton Choisir est noir, contre vert avec ✓ dans la maquette. Le compromis ne dit pas ce qu'on perd. La colonne Arômes est hachée de césures (« pample-mousse »).
4. Fiche MotlerHops : la caractéristique « Conditionnement 50 g » est donnée alors que « je prends » offre 50 g à 1 kg. La récolte n'est pas lue (la maquette dit 2025).
5. Sombre : rendu lisible (D1, D2). Les deux captures montrent la liste, car le carnet ouvert n'a pas pu être pris.

### Tenu (vu)
- **C66-1** : le bandeau est au-dessus de la feuille, et Annuler rend l'article (R6, R11).
- **C66-2** : Brau affiche 80 à 1 kg, et « je prends » propose au gramme, 1 kg, 5 kg et 20 kg.
- **C66-3** : un seul classement partout (MotlerHops ≈40 en 1er), et le vert tombe sur le 1er.
- **C66-6 / C65-6** : une ligne par caractéristique, en français (deux fiches).
- **C66-8** : la bulle est visible dans le fil et ne devient pas un critère.
- **C65-5** : le vert est sur le CHF/kg qui classe.
- Usage neuf : il est rangé sous Brasserie › Conditionnement, avec un sous-domaine.

## Table (captures ouvertes : H1-0..2, K1-0, K1-1, K1-3, F1-0..2, F2-0, CH-1, CH2-0, CH2-1, AV-0, AV-1, R2-glisse, R6, R11, M4, M12, P-t6, Q-t3, Q-carte, MEMO-2, NEUF-2, W1, W2, W3, D1, D2 ; maquettes maquettes2 v01-articles, v01-comparer, v01-fiche, v01-memo ; maquettes3 v01-liste)
| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| H1-0..2 | clair | 390 | carnet houblons, tableau, Selon la quantité | 0 | 0 |
| K1-0, K1-1, K1-3 | clair | 390 | Comparer | 1 (n° 7) | 1 |
| F1-0..2, F2-0 | clair | 390 | fiches MotlerHops, Brau | 1 (n° 9) | 0 |
| CH-1, CH2-0, CH2-1 | clair | 390 | Choisir 1 kg, confirmation, Choisi | 3 (n° 1, 3, 8) | 2 |
| AV-0, AV-1 | clair | 390 | À venir | 1 (n° 2) | 1 |
| R2, R6, R11 | clair | 390 | Retirer, Annuler | 0 | 0 |
| M4, M12 | clair | 390 | message, IA refusée | 0 | 0 |
| P-t6, Q-t3, Q-carte | clair | 390 | photo seule, À ranger | 1 (n° 4) | 1 |
| MEMO-2 | clair | 390 | mémo, rangé pour toi | 1 (n° 5) | 1 |
| NEUF-2, W2 | clair | 390, 1280 | usage neuf, problème ouvert | 1 (n° 6) | 1 |
| W1, W3 | clair | 1280 | liste | 0 | 0 |
| D1, D2 | sombre | 390 | liste | 0 | 0 |

## DEMANDE EXECUTANT
1. Dans `voies/critique-67b`, lancer `node ouvre.mjs O9 "ZZ TEST — c67b pellets"`. Ouvrir la capture `cap/O9-ouvert.png` : le carnet doit être ouvert.
2. Supprimer ce carnet : ··· › « Supprimer le carnet » › « Supprimer avec son plan » › Supprimer. Vérifier le titre dans le dialogue avant de toucher.
3. Faire de même pour « ZZ TEST — c67b les étiquettes » (sans plan) et pour « Photo du 25 nov. » (À ranger).
4. Lancer `node etat.mjs apres`, puis comparer `apres.json` à `avant.json`. Attendu : IDENTIQUES (À venir 11, Carnets 32, 16 barres, à dépenser −463, Chambre froide 837/9373/947).
5. Écrire le résultat en tête de ce fichier :
   - « carnet identique oui » si tout est identique ;
   - sinon, ce qui diffère, en bloquant.

LEÇON PROPOSÉE : `controle-bugs.mjs` ignore en silence un id qui ne suit pas `^[A-Z][A-Z0-9]*-\d+$` (ici `C67b-1`) et répond quand même « BUGS OK ». Il doit refuser toute ligne `| X… |` dont l'id ne se lit pas.
