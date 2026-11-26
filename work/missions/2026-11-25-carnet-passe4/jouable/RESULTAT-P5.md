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
