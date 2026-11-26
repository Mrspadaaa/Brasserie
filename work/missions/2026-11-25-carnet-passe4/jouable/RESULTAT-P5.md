OK — jouable p5 : moteur p4, interface mini p5 et figés 17.11, gestes 18/18

Fichiers (tous dans work/missions/2026-11-25-carnet-passe4/jouable/) :
- p5.html (assemblé par cap-p5/build.mjs depuis p4.html du commit 8277769ac : une autre voie modifie p4.html en ce moment, non commité)
- cap-p5/p5-ui.js, p5.css, p5-body.html (l'interface), build.mjs, cap.mjs (gestes, window.claude simulé), cote.mjs (planches côte à côte)
- cap-p5/*.png (34 captures 390 × 844, DPR 2), cap-p5/cote/*.png (23 planches : sa version | jouable p5), cap-p5/resultats.json

Moteur gardé : sample, journal db, liens/ et demandes/, consigne, citations validées, lecture auto, Organisé par défaut, Aide, exemples.
Changé dans le moteur, avec raison :
- plafonds du contrôle : 12 offres et 24 critères (avant : 4 et 6), défaut COMPARER-BEAUCOUP-D-OPTIONS ;
- catégories de DONNEES.md (Bureau › Assurance, Bureau › Événements) dans la consigne ;
- modelTier "complex" sur « Escalader à l'IA » (point 13) ;
- Chambre froide ajoutée aux exemples (ses 2 liens, fixture c78). Les 5 cas fictifs sont dans un pli « Cas d'épreuve » marqué exemple, hors des compteurs.

Sortie décisive : GESTES 18/18 · ERREURS PAGE 0 ; Carnets 15 · 4 je cherche · 3 décidés · 5 notés · 3 résolus · À décider 2 ; aucun débordement à 390.

| Écran | Sa version (source) | Planche | Verdict |
|---|---|---|---|
| Liste au repos | S-liste (v02) | cote/01-liste__S-liste.png | identique ; à faire 6 et non 5 (voir ci-dessous) |
| Ranger en glissant | S-ranger-glisse (v01) | cote/03-glisse__S-ranger-glisse.png | identique : pastille « → Brasserie › Brassage · 2e », vient d'ici |
| Glisser, filtre | S-ranger-repos | cote/04-range__S-ranger-repos.png | identique, toast Annuler |
| Noter vite | S-noter (v01 + M4) | cote/05-noter__S-noter.png | adapté : pas de clavier simulé |
| Note rangée | S-rangee (v01) | cote/06-rangee__S-rangee.png | identique : Tout accepter (n), Juste la note |
| Organisé, problème | O-organise (v04) | cote/07-organise__O-organise.png | identique : 4 tuiles, trouvé et pas trouvé, chemin, pour régler |
| Changé par l'IA | O-change (v05) | cote/08-change__O-change.png | identique, avec Relire et Escalader en pied |
| Mes notes, on écrit | S-notes-ecrit (v04) | cote/09-notes-ecrit__S-notes-ecrit.png | adapté : barre d'outils du moteur |
| L'IA lit | S-ia-lit (v03) | cote/10-ia-lit__S-ia-lit.png | adapté : pas de fausse progression ligne à ligne |
| Sa ligne retrouvée | S-notes-ligne (M4/v01) | cote/11-notes-ligne__S-notes-ligne.png | adapté : surlignage et retour du moteur, sans le bloc « cette ligne dans Organisé » |
| Décider | O-decider (v01) | cote/13-retenu__O-decider.png | identique : 2 cartes, retenu, écart, tâche Garder |
| Résoudre | O-resoudre (v01) | cote/15-resoudre__O-resoudre.png | adapté : la question seule, le contrôle ne garde pas la citation |
| Résolu | O-resolu (v01) | cote/16-resolu__O-resolu.png | identique : Rouvrir, pistes fermées |
| À faire | O-afaire (v01) | cote/17-afaire__O-afaire.png | adapté : « Dans les 7 jours » ; pas de retard, ses dates de fixture ne sont pas dans ses lignes |
| Options | O-options-a | cote/19-options-6__O-options-a-6.png | identique, 6 offres, puce exemple |
| Comparer | h04-7 (figé 17.11) et nouveau O-options-b | cote/20-comparer__h04-7.png | adapté : classement en barres et côte à côte ; manquent la pastille de rang et l'image en tête de colonne |
| Article ouvert | h01-6 | cote/22-article__h01-6.png | adapté : image du lien sinon icône au trait (point 12) |
| Choisi | v09-3 | cote/23-choisi__v09-3.png | identique : Pourquoi, Ce qui comptait, Envoyer dans À venir, Écartés |
| À venir | h05-9 | cote/24-avenir__h05-9.png | adapté : une feuille, pas l'écran Calendrier |
| Comparer, caractéristiques | O-comparer-caracteristiques (refait 10:15) | cote/26-chambre-comparer__O-comparer-caracteristiques.png | identique sur le fond ; unités sous le libellé à reprendre |
| Relecture | O-relecture (v03) | cote/30-relecture__O-relecture.png | identique, simple |
| Mémo | S-memo (v02) | cote/31-memo__S-memo.png | identique |
| L'IA n'a pas pu lire | S-ia-echec (v01) | cote/33-ia-echec__S-ia-echec.png | identique, avec le bouton IA forte |

Gestes 18/18 : glisser, noter vite, Organisé, Changé, écrire dans Mes notes, IA lit, ligne retrouvée, décider, tâche, résoudre, À faire, 6 offres, Comparer, article, choisir, À venir, Relire un lien (demandes/ type relire), Escalader (modelTier complex), relecture, mémo, IA en erreur puis Réessayer.

Captures ouvertes : 01, 03, 04, 05, 06, 07, 08, 10, 11, 13, 16, 17, 19, 20, 22, 23, 24, 26, 30, 33, plus les nouveaux O-options-b-6 et O-comparer-caracteristiques. Je n'ai pas rouvert les planches de la dernière passe, faute de contexte. Elles sont à ouvrir par l'exécutant (voir la demande plus bas).

Prédiction : « Là c'est mes écrans, dans le thème de l'app ; Comparer, il manque encore les images en tête des colonnes. »

DÉCISION À PRENDRE : « À faire » compte 6 tâches datées depuis ses lignes. DONNEES.md en compte 5, venues des tâches de ses fixtures (23.11, 30.11). Les dates des tâches de l'app sont-elles à brancher dans le jouable ?

DEMANDE EXECUTANT :
1. `node work/missions/2026-11-25-carnet-passe4/jouable/cap-p5/build.mjs` puis `node work/missions/2026-11-25-carnet-passe4/jouable/cap-p5/cap.mjs`. Attendu : `GESTES 18/18 · ERREURS PAGE 0`.
2. `node work/missions/2026-11-25-carnet-passe4/jouable/cap-p5/cote.mjs cote`. Attendu : `fait`, 23 planches dans cap-p5/cote/.
3. Ouvrir les 23 planches et lister les écarts. Celles à voir d'abord : 16-resolu (tuiles en 3 colonnes), 33-ia-echec (libellés lus), 20-comparer et 26 (Comparer).

CONNAISSANCE : le contrôle de la page retire une date de tâche absente des lignes. Les tâches datées de l'app (fixtures) n'entrent donc jamais dans un jouable qui ne lit que ses lignes.
LEÇON PROPOSÉE : un jouable dérivé part d'un commit figé de son moteur (`git show <sha>:p4.html`), jamais du fichier de travail qu'une autre voie modifie.

## Passe de correction du 26.11 (CRITIQUE-P5-JOUABLE, « À corriger » 1 à 12)

OK — 14 bloquants corrigés sur 14, 16 mineurs sur 18 (2 en partie), GESTES 18/18 · ERREURS PAGE 0.

p5.html est édité directement : cap-p5/build.mjs n'a pas été lancé. Les définitions remplacées sont regroupées dans le bloc « passe de correction 26.11 », placé avant le démarrage.
Les regex abîmées par l'ancien assemblage sont réparées : un `\b` devenu un caractère de contrôle et un `\d` perdu dans jourDuMois, `\s` dans le coût.
cap.mjs a quatre changements :
- l'IA simulée garde « entreprise X », le mot de ses notes ;
- le détail de la Chambre froide s'écrit en virgule ;
- Changé décoche « Le problème », car les lectures verrouillées ne se décochent pas ;
- À faire est capturé avant que l'écoulement soit résolu.
La capture et la planche réessaient l'écriture du PNG, parce que Windows verrouille parfois un fichier un instant.

| n° | Bloquant | Corrigé | Planche |
|---|---|---|---|
| 4 | Note rangée | Les pastilles avant → après sont là : à surveiller → en stock, et l'achat dans À venir passe à « dans 4 j ». La date est lue : « Acheter le Brewtools (B) · lu 30.11 ». Une ligne « option → retenu » s'ajoute quand la tâche nomme une option non retenue. Ici, B l'est déjà. | cote/06 |
| 6, 29 | Objet et non mot d'état | Changé affiche « Trouvé : joint du siphon usé », « Pas trouvé : fuite sous la dalle » et « Le problème : fuit au joint ». L'app seule affiche trouvé « Joint du siphon usé » · l. 2, pas trouvé « Fuite sous la dalle » · l. 2 et prochaine « Devis entreprise X » · l. 3–4. | cote/08, cote/33 |
| 7 | 150 CHF estimé | Lectures verrouillées : « Devis attendu : pas un achat » et « 150 CHF : une estimation, pas un prix ». Tâche et Contact sont fusionnés. | cote/08 |
| 10 | Dates de sa ligne | Chaque ligne garde son heure d'arrivée (`p5h`). La tuile Trouvé reste « 24.11 21:26 » après relecture. « Retenir touché auj. HH:MM » remplace « je 1.1 · 01:00 », car retenuLe survit à une relecture. | cote/13, cote/15 |
| 11 | Sa ligne retrouvée | La vue a les sections Le problème, Pistes et Suite, avec l'état de chaque ligne. Le bloc « Cette ligne dans Organisé » contient trouvé, pas trouvé, « proposé + Tâche » et rangé. On revient par « ‹ Organisé · … ». Toucher une ligne ouvre l'édition. | cote/11 |
| 13 | Résoudre | La carte vient juste sous les tuiles et s'affiche en haut à son arrivée. Les preuves sont citées avec leur date et leur puce exemple, et la tâche cochée en fait partie. L'interrupteur « En fermant : Devis Entreprise X 185 CHF classé pas pris » est là, et la tuile prochaine dit « Fermer le carnet ». | cote/15 |
| 14 | Résolu | Les tuiles mettent la valeur au-dessus du libellé : 2 j ouvert le 24.11, 9 CHF devis 185 CHF pas pris, Plus de flaque la preuve · l. 9. Le remède s'affiche « changer le joint du siphon, 9 CHF ». On voit aussi les options fermées (fait, pas pris) et les « Résolus ailleurs ». | cote/16 |
| 16 | À faire | Le groupe « Attendu de quelqu'un » affiche « Devis Entreprise X ≈ 150 CHF estimé · l. 5 ». | cote/17 |
| 19, 20 | Comparer | Chaque colonne a en tête une image (ou une icône au trait), une pastille de rang, puis le domaine (« · lu ») ou « ta note · l. n ». Un prix complet passe avant un prix incomplet : 1 Fournisseur B 410, 2 Bouteilles33.ch 420, 3 Brouwland ≈ 390 · livraison ?. Le même classement vaut dans Organisé, l'article et Choisi. | cote/20, cote/26 |
| 22 | Article | « 1re sur 6 ». « comprise » compte 0, donc Livraison 80 CHF est 2e. On a « Où l'acheter » (Ouvrir ↗ si lien), l'interrupteur « Surveiller prix et stock » et un cadre de 72 px sans image. | cote/22 |
| 24 | Choisi | La fiche montre l'icône de l'objet, ses valeurs en clair et le prix. Le pourquoi tient en une phrase : « le moins cher au prix complet : 410 CHF pour 600 (600 × 0,55 + 80) ». Chaque écarté a son icône et sa raison : « prix incomplet : livraison ? », « 10 CHF de plus pour 600 » ou « pas de prix pour 600 ». | cote/23 |
| 27 | Relecture | Le remède est le choix (« monter à 19 °C »), jamais la cause. | cote/30 |

Mineurs corrigés :
- 2 : « déposer ici » ; la pastille remplace la 2e ligne ; le vide sous « vient d'ici » a disparu.
- 3 : liens nommés « Kegland (A) », « Brewtools (B) · pas en stock » (son « le 2e pas en stock »).
- 5 : entreprise X ; fins de piste ✓ et ◌.
- 8 : Tâche et Contact sont fusionnés.
- 9 :
  - soulignés vert (trouvé), jaune pointillé (pas trouvé), bleu (devis, contact) ;
  - « (exemple) » grisé ;
  - heure « auj. HH:MM » sur la ligne neuve ;
  - barre avec libellés et micro.
- 12 : « +35 sur ton ≈ 150 · l. 5 ».
- 15 : remède, liste des Résolus.
- 17 : titre complet (« Assurance à renouveler · échéance · renouveler ») ; un sous-titre ne répète plus le titre.
- 18 : « Besoin avant ma 15.12 · dans 19 j » ; une initiale par offre ; toasts hors des boutons.
- 21 : noms de colonne sur une ligne ; « glisse → 3 de plus » ; une ligne identique partout passe dans « Pareil partout ». « Minimum » reste, car il diffère sur 6 colonnes.
- 23 : cadre réduit.
- 26 : unités sous le libellé, ×, virgule, « Prix CHF TTC », domaine et « lu », pas de « Gagne » en double, blocs seulement s'il manque une valeur.
- 28 : citations (« aucune activité 36 h »), « le jour même », « Si ça revient ».
- 30 : Local › Eau à l'échec IA ; « Je cherche » en bleu.
- 31 : plus de toast « Ajouté à Mes notes » ; le toast se pose sur la barre du pouce et se ferme quand une feuille s'ouvre.
- 32 : titres sur deux lignes, sous-catégorie seule si le titre est long ou dans Mes notes ; virgule décimale ; Citra.

Mineurs en partie :
- 1 : « retard 3 j » n'est pas rendu. Ses lignes disent « dans 2 semaines », et la date du 23.11 vient de ses fixtures, pas de ses notes. Cela reste la décision ouverte plus haut. Citra et le titre non coupé sont faits.
- 25 : À venir a ses carrés de couleur par genre, ses montants et ses icônes, mais reste une feuille, car le Calendrier est hors du jouable.

Captures ouvertes après correction : planches 03, 05, 06, 08, 09, 11, 13, 15, 16, 17, 19, 20, 22, 23, 24, 26, 30, 33. Les planches non rouvertes (01, 04, 07, 10, 31) n'ont pas changé de code, hors le titre sur deux lignes.

Prédiction : « Là je lis mes pistes et pas des mots d'état, et le Résolu me dit enfin ce que ça m'a coûté. Comparer a ses pastilles ; il me manque les vraies photos. »

DÉCISION À PRENDRE : la même qu'avant, sur les dates des tâches de l'app (le « retard 3 j »).
CONNAISSANCE : l'ancien build.mjs assemblait p5-ui.js dans un gabarit qui mangeait les barres obliques inverses. Un `\b` y devenait un caractère de contrôle U+0008 : il faut chercher `\x08` dans un fichier assemblé.
LEÇON PROPOSÉE : un code assemblé par gabarit se contrôle en comptant les barres obliques inverses et les caractères de contrôle de la sortie par rapport à la source (L26).
