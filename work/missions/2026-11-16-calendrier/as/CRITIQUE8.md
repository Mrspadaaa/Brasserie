OK — 6 problèmes, 3 bloquants ; note 6/10

# Critique 8 (17.11) : `pub/calendrier.html` au doigt, passe 8

Version : arbre de travail sur cce31353 (pub/ de la passe 8, non commité).
Jeu : `cap/critique8/jouer.mjs`, repris de la critique 7. Une seule session, sans recharger : 390 × 844 tactile (Porter, appui long, Retirer, Annuler, glisser, allonger la Blonde, la décaler de 3 semaines, Livrer, + volant, + de chaque rangée, fête à −150, Modifier, 2e vente, c2-b, c3-a), puis 844 × 390 (+ volant, + Achats, allonger, An), retour en 390, cave, puis 1280 × 800.
Mesure à part : `cap/critique8/mesure.mjs` (feuille Vente en 844 et en 390, message pendant qu'on défile).
50 + 6 captures, **toutes ouvertes** (planches `_pl-p-1` à `_pl-p-7`, `_pl-l-1` à `_pl-l-6`, `_pl-m-p`, `_pl-m-l`, et `50-d-1280` en plein format). 0 erreur de page.

Phrase prédite : « Bon, je tourne et tout est là, c'est mieux. Mais le message noir reste planté au milieu quand je descends, je touche le + et rien ne se passe. »

## Les 7 points de la passe 8, rejoués

| # | Point | Verdict | Preuve |
|---|---|---|---|
| 1 | Un seul calendrier en tournant | tient | tête −657 en hauteur → −657 en largeur ; −1 097 en largeur → −1 097 au retour ; Blonde J0/35 puis J0/42 des deux côtés ; les 7 choses posées passent (36, 45, `_jeu.json`) |
| 2 | 1280 : vue de 844 centrée | tient, sauf les points de la Blonde (problème 3) | 50-d-1280 ; BANDE --large OK |
| 3 | Message par-dessus, sans pousser | rangées immobiles (185…609 identiques avant, pendant et après f1-a) ; **mais le message cache des + et des textes** (problème 1) | 06, 07, 17 à 22, 28, 40 |
| 4 | 2e vente nommée | tient | « Bar du Lac +200 » sous « +260 » (31, 47) |
| 5 | Modifier sans semaine redite | tient | « Stand au marché : S49 → S51 » (27) |
| 6 | Livrer hors vue | tient | « Livraison La Cigogne · S2 › » (10) ; Blonde décalée de 3 semaines, prête 11 janv., livrée 12 janv. |
| 7 | Brassin posé, signe −, vente nommée | tient | « J0 / 28 · prête 4 janv. » (13) ; − touché, « Stand au marché −150 » (25, 26) |

## Contrôles (sorties : `cap/critique8/_controles.txt`)
ROTATION OK · PLUS-AGIT OK · BRUIT OK (cal.html et cal-paysage --paysage) · BANDE OK (cal.html et calendrier.html --large) · ENTETE OK · PLUS OK.

| capture | thème | largeur | état | problèmes | bloquants |
|---|---|---|---|---|---|
| 17 à 22, 28, 40, m-p/m-l-vente-defile | clair | 390, 844 | message après une pose, puis on défile | 1 | 1 |
| 39, 41, m-l-feuille-vente | clair | 844 | feuille d'ajout | 1 | 1 |
| 50-d-1280 | clair | 1280 | Blonde allongée à 42 j | 1 | 1 |
| m-p-feuille-vente, m-p-vente-pose | clair | 390, 844 | feuille Vente pré-remplie | 1 | 0 |
| 36, 43, 50 | clair | 844, 1280 | Blonde décalée | 1 | 0 |
| 45, 46 | clair | 390 | brassin posé en S52 | 1 | 0 |
| les autres (01 à 16, 23 à 27, 31 à 35, 37, 38, 42, 44, 47 à 49) | clair, cave | 390, 844 | chaque geste | 0 | 0 |

## Problèmes (les plus graves d'abord)

1. **Geste sans effet (bloquant). Le message reste fixe à l'écran pendant 7 s ; quand on défile, il se pose sur les rangées et mange leurs +.**
   - Après la pose de la Saison (S47), on descend vers Ventes : le message « Prête le 14 déc. · S47 : 4 180 → 3 880 » couvre le titre Ventes et son + (17). Le toucher tombe sur le message, la feuille ne s'ouvre pas. Même chose ensuite pour Fêtes, Achats, Travaux, Activités (19 à 22) : 5 + sur 7 sans effet dans le jeu.
   - Il cache aussi du texte : « Marché de Noël +1 180 » (19), « Commande groupée de malt » (20, et m-l-vente-defile en largeur), « Ranger la réserve » (22).
   - Même sans défiler, il couvre parfois la chose qu'il annonce : la pastille « Bar du Lac +200 » toute neuve (28), le titre « Blonde d'automne −420 » en largeur (40).
   - Correction : le message ne doit jamais rester sur une rangée qui défile. Soit il part dès qu'on défile ou qu'on touche ailleurs, soit il reste à une place fixe qui ne couvre jamais la frise (en bas, au-dessus des onglets, comme en 06 et en m-p-vente-pose). Contrôle : `controle-geste-bruit` doit défiler de 150 px pendant le message, puis toucher le + de la rangée qui passe dessous, et échouer sur cette version.
2. **Texte illisible (bloquant). En largeur, la feuille d'ajout est plus large que l'écran (1 008 px dans 840).**
   - À l'ouverture, le montant (CHF) sort à droite : on ne voit ni le 130 proposé ni le chiffre qu'on tape (m-l-feuille-vente).
   - Quand on touche le montant, la feuille glisse de côté : le titre « Ajouter dans Brassins » devient « sins », le choix Brassin et le nom sont coupés à gauche (39, 41).
   - Correction : en 844, la feuille tient dans sa largeur : nom et montant sur une ligne qui se partage la place, semaines dans leur propre bande qui défile (comme en hauteur). Contrôle : scrollWidth de `.as-sh` ≤ clientWidth en 844 × 390.
3. **Texte illisible, valeur fausse (bloquant). En 1280, les points des jours actifs de la Blonde tombent sur son texte : « J●/ 42 · prête●18 janv. » (50-d-1280).**
   - La même barre, même largeur, en 844 (43) a ses points ailleurs (à 13, 61, 165 et 213 px du début, contre 12, 86, 235 et 311 en 1280). L'un des deux place mal les jours. C'est sans doute la vue redessinée en revenant au premier plan, avec une largeur de colonne périmée.
   - Correction : recalculer les points avec la colonne réelle à chaque redessin, et ne jamais les poser sous le texte. Contrôle : en 844 et en 1280, même position des points relative à la barre, et aucun point dans le rectangle du texte « J0 / … ».
4. **Pas pratique, et nombre absurde accepté. La feuille Vente arrive déjà remplie par la proposition (« Café du Pont », 130 CHF), dans les champs eux-mêmes.**
   - On touche le nom et on tape « Bar du Lac » : on obtient « Café du PonBar du Lac ». On touche le montant et on tape 200 : on obtient 200130. L'app accepte une vente de 200 130 CHF sans broncher, et la caisse passe à 204 262 (m-p-feuille-vente, m-p-vente-pose).
   - Pour une micro-brasserie, une vente à 200 000 CHF n'existe pas ; une alerte aurait dû tomber.
   - Correction : la proposition reste une puce qu'on touche pour remplir ; sinon tout sélectionner au toucher d'un champ pré-rempli. Montant hors de l'ordre de grandeur (par exemple plus de 10 fois la plus grosse vente connue) : demander confirmation.
5. **Pas à sa place. Une étiquette de la base reste où elle était quand une barre vient dessous.** Le titre « IPA houblon à cru −232 » s'écrit dans la barre de la Blonde décalée, à côté de « prête 11 janv. » (36), puis de « prête 18 janv. » (43, 50). On croit lire un seul brassin.
   - Correction : une étiquette de rangée qui touche une barre passe de l'autre côté de sa propre barre, ou une ligne plus bas.
6. **Valeur manquante. En hauteur, le brassin posé en S52 n'écrit que « J0 / 28 », sans « prête 18 janv. »** (45, 46), alors que la largeur l'écrit (40). Le point 7 n'est donc vrai qu'en milieu de vue.
   - Correction : en bord de vue, la date passe dans l'étiquette à gauche (« Blonde d'automne −380 · prête 18 janv. »).

## Doutes (non comptés)
- `controle-entete-cal` dit « 24 textes (max 12) » et rend pourtant ENTETE OK : le contrôle ne compte pas ce qu'il affiche, ou le plafond est mal écrit.
- c2-b insère le détail de la semaine sous la bande et pousse la frise (34). C'était déjà le cas en critique 7 (38), sans plainte ; mais cela contredit la règle de la passe 8 (« rangées à la même place »).
- Le fond de la courbe c3-a reste ouvert après l'aller-retour en largeur (45) : l'état suit, c'est voulu ou non ?
- Sur un vrai téléphone, 100dvh avec la barre d'adresse (reste du journal) : pas vérifiable au banc.
- Les erreurs 29 et 30 du jeu (Modifier l'achat, Retirer l'activité) viennent du problème 1 : l'achat et l'activité n'ont jamais été posés.

## Ce qui tient (vu sur les captures)
La rotation garde tout, dans les deux sens : tête, choses posées, Blonde, livraison. La 1280 est centrée, les semaines sur leurs colonnes. Les rangées ne bougent plus quand le message part (07). Les dates sont justes : brassin du 7 déc. pour 28 j prêt le 4 janv. ; du 21 déc. prêt le 18 janv. ; la Saison du 16 nov. prête le 14 déc. ; la Blonde décalée de 3 semaines prête le 11 janv., Livrer le 12 janv. en S2. Le thème cave tient (48, 49).

LEÇON PROPOSÉE : un élément fixe posé « là où il ne cache rien » se juge aussi en défilant et en touchant ce qui passe dessous ; une feuille se mesure à chaque largeur (scrollWidth), pas seulement en hauteur.
