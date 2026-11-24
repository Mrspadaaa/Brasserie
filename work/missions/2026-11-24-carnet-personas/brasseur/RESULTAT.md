RESULTAT brasseur : 23 problèmes (B 6, m 17, D 4) — 9 propositions

Tests : sans objet (test d'écran)

- Version jugée : https://brasserie-l-affinee.web.app, paquet servi `index-BoCN8sbd.js` (curl ?nocache, 24.11 ≈ 16 h 57), celui de sa plainte.
- Vue : 390 × 844, échelle 2, toucher, Chrome de débug, onglet propre (fermé par page.close, puis disconnect).
- Carnets regardés : Houblons citra, Chambre froide, Conformité (Papiers), Frigo + congel (Idée envoyée dans À venir), Sol (fait du Planning). Plus la liste, la puce Meuble, la recherche « citra » et les anciennes notes.
- Rien validé, aucun appel IA. Une réserve : à l'ouverture de Comparer, l'app affiche d'elle-même « Enregistrement sur le serveur… » (problème 7).
- Captures : `cap/` (toutes ouvertes avant le verdict). Ses captures du 24.11 (1 à 5) ont aussi été ouvertes.

## Sa phrase prédite
« Ça fonctionne, mais 0,10 le Citra ??? Et je vois toujours pas qui gagne. La moitié de l'écran c'est des onglets et du vide. Pas assez compact !!! »
- Note prédite : 5,5/10.
- Calcul : besoin 6 (prix faux, pas de gagnant), lisibilité 6 (≈ 64 % de donnée). Je prends le plus bas, moins 0,5 (portrait § 7).

## Combien et quels problèmes ? (B bloquant · m moyen ; D doute, non compté)

1. **B · prix faux** (liste 01, carnet 02, Comparer 03, Choisir 04, fiche 05). Le Citra de Brau- und Rauchshop est affiché « dès 0,10 CHF » sans unité. C'est le prix **au gramme**. Sa page indique 0,1044 CHF/g, 0,08 CHF/g dès 1 000 g, 245,70 CHF le sac de 5 kg (49 CHF/kg) et 782,15 CHF les 20 kg (39 CHF/kg), port non compris. (LIEN-PRIX-JUSTE)
2. **B · gagnant faux** (02, 03, 04). Brau est classé 1er, « moins cher », devant MotlerHops à 3,72 €. Or ces 3,72 € sont le prix du sachet de **50 g** (74 €/kg). Le même Citra coûte 40,69 € le kg chez Motler (récolte 2025, TTC), soit environ 41 €/kg, contre 80 CHF/kg chez Brau dès 1 kg. Choisir propose quand même « Choisir chez Brau- und Rauchshop » sur ce faux : la réglette va de « moins cher · 0 » à « 3 CHF », et le pourquoi est « Brau- und Rauchshop. ».
3. **B · même prix, deux valeurs** (02, 03, 06). Pour les mêmes 3,72 €, Motler affiche ≈3 CHF dans le carnet et la fiche, mais ≈4 CHF dans Comparer. Le conditionnement du prix n'est jamais dit. La fiche indique « Poids 50 g, 250 g et 500 g », sans le 1 kg, qui existe.
4. **B · qui gagne** (03, 14). Aucune ligne de Comparer ne marque le meilleur. Seule la colonne du 1er est teintée en entier. Sur la Chambre froide, rien ne signale que la 2e a 56 % de volume en plus. (COMPARER-QUI-GAGNE)
5. **B · conclusion fausse** (14-3). Le compromis dit : « la 1re, la moins chère … aucun critère ne les départage ». Pourtant le volume les départage : 2,6 contre 4,06 m³, soit +56 % de volume pour +11 % de prix (1 038 contre 736 CHF/m³). La conclusion pousse vers le moins bon achat.
6. **B · donnée sous 70 %** (02, 05, 13, 15). Le haut de l'écran prend ≈ 127 px : l'en-tête, Articles…Matériel, puis Parc/À venir/Carnets/Réalisés. S'y ajoutent le fil, ≈ 45 px. Le bas prend ≈ 120 px : le composeur et la barre de navigation. Ces barres restent dans chaque vue. Résultat :
   - fiche : donnée de 175 à 715 px, soit ≈ 64 % ;
   - carnet ouvert (Houblons, Chambre froide, Conformité…) : ≈ 300 px de donnée, puis ≈ 220 px de blanc. (CARNET-DONNEE-PREMIER-PLAN)
7. **m · lire écrit** (03 ; sa capture 5). Ouvrir Comparer affiche « Enregistrement sur le serveur… ». Un geste de lecture écrit donc quelque chose, et le bandeau masque les onglets. Je n'ai pas tracé la cause : `Comparer.tsx` n'écrit rien dans ses effets.
8. **m · pas brasseur** (03, 05, 06). Sur le houblon, l'α n'apparaît que dans le nom (« Citra 13.6% ») ou sous l'étiquette « Citra : 13,6 % ». Chez Motler, l'app affiche « 10 % - 15 % », alors que la page annonce le lot 2025 à 13,2 %. Ni la récolte, ni la forme (pellets), ni le conditionnement ne sont donnés. Le Comparer des houblons se limite à prix, dispo, vendeur et Origine. (L04, penser-brasseur)
9. **m · langue** (05). Les arômes restent en allemand : « Limette, Mango, tropische Früchte ».
10. **m · même valeur écrite deux fois** (03). Origine : « USA » d'un côté, « États-Unis » de l'autre. La ligne paraît différer.
11. **m · bruit dans Comparer** (14). La Chambre froide occupe 4 écrans, soit environ 20 lignes, dont 15 identiques : tension, fluide, RAL… Elles ont le même poids que les 4 qui décident : prix, volume, dimensions intérieures, dimensions.
12. **m · sans sous-catégories** (15). La fiche de la Chambre froide aligne 20 caractéristiques à plat. « Largeur de l'unité » et « Couleur RAL 9002 » y sont au même rang que le volume. Aucun groupe : dimensions, froid, électricité, construction.
13. **m · place perdue** (05, 06, 15). La carte Offre prend 3 lignes pour 2 informations, avec un vide au milieu. Le bandeau photo fait 100 px pour une petite photo et la mention « photo de la page collée ».
14. **m · texte parasite** (02, 03). Le carnet affiche « votre lien : « https://www.motlerhops.fr/collections/… » » en clair. La note sous Comparer tient en 2 lignes et se contredit : « port lu sinon « ? » », puis « port … non comptés ». S'y ajoute « Valeurs annoncées par les vendeurs ».
15. **m · filtre invisible** (11). Avec Meuble choisi, la puce active sort du champ : aucune puce allumée n'est visible. « Meuble 4 » s'affiche pour 5 cartes (Idée 4 et Faits 1).
16. **m · compteurs** (01). Le sous-onglet indique « Carnets 20 », la puce « Tous 25 ».
17. **m · déchets de test** (01, 11). 4 carnets « ZZ TEST » sont mêlés aux siens : cellule, marmite, tuyau, joint. Deux sont en tête de « À comparer ». « ZZ TEST — joint torique » est rangé en Meuble.
18. **m · rangement mêlé** (19). « Anciennes notes de l'Atelier » mélange une note (Ventilation), une idée de bière et un **contact** (Le Carnotzet Gourmand) dans les carnets du Matériel.
19. **m · Idée en vrac** (01). Les 16 idées n'ont aucune sous-catégorie (froid, rangement, conformité, électricité) ni ordre utile. « passé · S29 / S35 / S39 » revient sur 6 cartes, sans qu'on sache quoi faire.
20. **m · états contradictoires** (16, 17, 18) :
    - Frigo + congel : « Idée · 3 sept. » et « Dans À venir » en même temps ;
    - Conformité et Sol : « prix ? » alors que le budget est posé (850 et 3 500 CHF) ;
    - Sol : « Archivé le 20 nov. », mais toujours « Articles · collez un lien ».
21. **m · menus doublés** (02, 09). Deux « … » se suivent. « Articles, actions » ouvre au-dessus du tableau une 3e liste des mêmes articles (Déplacer/Retirer), au lieu d'agir sur les lignes.
22. **m · barre parasite** (05, 06, 15). Une épaisse barre de défilement horizontale grise apparaît sous chaque fiche. Elle se voit aussi sur ses captures 2 à 4.
23. **m · pourquoi vide** (04). Le « Pourquoi » proposé se résume à « Brau- und Rauchshop. ».

Doutes (non comptés) :
- D1. Échap ne ferme ni Quand ni le menu « … » (07, 08). Je ne l'ai pas vérifié au doigt hors de la feuille.
- D2. « Refaire évier — bloqué (attendre vis pieds) » est rangé dans Faits (19).
- D3. Le Carnet a aussi une porte sous Brassins › Atelier › Carnet (00-test), en plus de Stocks › Matériel › Carnets. Deux portes : voulu ?
- D4. Je ne sais pas ce que l'ouverture de Comparer enregistre (7). À tracer avant de dire « rien d'écrit ».

## Prix : ce qu'il attend (relevé le 24.11)
| Vendeur | Conditionnement | Prix | Au kilo |
|---|---|---|---|
| Brau- und Rauchshop (CH, port en sus) | au gramme / dès 1 000 g | 0,1044 / 0,08 CHF/g | 104 / 80 CHF |
| | 5 kg | 245,70 CHF | 49 CHF |
| | 20 kg | 782,15 CHF | 39 CHF |
| MotlerHops (FR, TTC FR, récolte 2025, α 13,2 %, en solde) | 50 g | 3,72 € (au lieu de 4,38) | 74 € |
| | 250 g | 14,06 € | 56 € |
| | 500 g | 24,97 € | 50 € |
| | 1 kg | 40,69 € | 41 € |

- **Ce qu'affiche l'app** : « dès 0,10 », sans unité ; « ≈3 » ou « ≈4 · 3,72 € », sans conditionnement. Le classement compare un gramme à un sachet.
- **Ce qu'un brasseur attend** :
  - le prix **du conditionnement qu'il achèterait**, dit avec ce conditionnement (« 1 kg · 40,69 € ») ;
  - **le prix au kilo** pour comparer, posé comme critère de Comparer et du classement, au tarif du conditionnement retenu, rendu en Suisse (≈ conversion, TVA d'import, port).
- **Ce que ça change ici** : au kilo, Motler 1 kg (≈ 41 €/kg, avant port et douane) bat Brau 1 kg (80 CHF/kg). Brau 5 kg (49 CHF/kg) redevient compétitif pour un gros achat. L'app dit l'inverse aux deux échelles.

## Propositions
1. **Prix vrai** *(dans ses choix : D435 Q-1 A « le choix fait le prix, un seul chiffre » ; D447)*. Le chiffre affiché est celui du conditionnement choisi, avec son nom (« 50 g · 3,72 € »). Comparer gagne une ligne « au kilo », qui sert au classement. Une unité manquante doit être dite « prix au g ? », jamais laissée nue.
2. **Qui gagne, ligne par ligne** *(dans ses choix : COMPARER-QUI-GAGNE)*. La meilleure cellule de chaque ligne porte une teinte et un ✓, selon le sens du critère (prix bas, volume haut). L'écart à côté (« +56 % »).
3. **Lignes identiques repliées** *(écart à ses choix : à lui montrer en variantes)*. Les lignes qui diffèrent passent en tête. Les autres se replient en « 15 identiques ▾ ».
4. **Carnet de houblons typé** *(dans ses choix : L04, penser-brasseur)*. Lignes dans cet ordre : α du lot, récolte, forme, conditionnement, prix au kilo, arômes en français et en couleur de famille. L'α apparaît aussi sous le nom dans le tableau du carnet.
5. **Donnée en plein écran** *(écart à ses choix : à lui montrer en variantes)*. Dès qu'un carnet est ouvert, les deux rangées d'onglets se replient ; le fil seul les remplace. Le composeur se réduit à une icône (ou se cache au défilement). Visé : ≥ 70 %, puis ≥ 80 %.
6. **Fiche compacte et groupée** *(écart à ses choix : à lui montrer en variantes)* :
   - la photo en vignette de 56 px à côté du titre ;
   - l'offre sur une ligne : vendeur · dispo · prix · Ouvrir ;
   - les caractéristiques en groupes repliables : Dimensions, Froid, Électricité, Construction ; pour un houblon : α, récolte, forme, arômes.
7. **Sous-catégories** *(écart à D437, qui fixe une rangée de puces : à lui montrer en variantes)*. Sous la puce de domaine active, une deuxième rangée de sous-domaines : Brasserie › Froid, Brassage, Matières premières ; Local › Sol, Eau, Électricité ; Papiers › Conformité. Les idées sont triées par échéance. Les contacts et les idées de bière sortent des carnets du Matériel.
8. **Compromis honnête** *(dans ses choix : le compromis existe déjà)*. Il raisonne à l'unité utile (CHF/m³, CHF/kg) : « la 2e : 736 CHF/m³ contre 1 038 ; +56 % de volume pour +11 % ». Il ne doit jamais dire « aucun critère ne les départage » quand une ligne diffère.
9. **Moins de texte, filtres sûrs** *(dans ses choix : texte au premier plan refusé ; D437)* :
   - retirer l'URL en clair et la mention « photo de la page collée » ;
   - réduire la note de bas de Comparer à « ≈ » et son détail au toucher ;
   - garder la puce active toujours visible ;
   - aligner les compteurs (Carnets n = Tous n) ;
   - fondre les deux menus « … ».

Hors écran (données réelles, à son accord) : retirer les 4 carnets ZZ TEST de ses carnets.

LEÇON PROPOSÉE : un juge de prix compare des unités, pas des nombres. Tout prix lu par l'IA porte son conditionnement ou « au g/kg ». Un classement qui compare deux unités différentes est une valeur fausse, à contrôler au banc sur les deux pages Citra du 24.11.
