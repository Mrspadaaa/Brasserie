# Juge critique au portrait, tour 3, final (25.11 nuit)

Grille : PORTRAIT.md v2. La note retient la plus basse de deux notes, « se voit en 3 s » et « répond au besoin ». Ce n'est jamais une moyenne, et elle est tirée vers le bas.
Règles dures : § ORGANISE-TROP-TEXTUEL, § FRISE-GENERIQUE et § ENTETE-PEU-UTILE.

Décisions du pilote :
- 30 mots au plus au repos ;
- après un geste, sa ligne citée ne compte pas ;
- en IA absente, ses lignes affichées en entier ne comptent pas ;
- le défaut de lecture locale (« Chaudière », « Levure », « Pilsner » lus comme tâches) est hors variantes.

Captures ouvertes, en planches côte à côte v2 | v6 | v7 :
- les 36 de `cap12/` (12 cas, au repos) ;
- les 45 gestes `cap/{v2,v6,v7}-{ecoulement,bouteilles,chaudiere}-{ligne,aide,refus,sansia}.png` ;
- les 9 de la v7 en plus : `ia-ligne`, `piste`, `sansconseil`, `prendre`, et `sansia` pour co2, pilsner, cave, assurance et citra.

Légende :
- B = bloquant : valeur fausse, info clé absente, geste sans effet, texte illisible, refus explicite rejoué, ou mineur revu 2 fois (L12) ;
- m = mineur.

## Sens métier (étape 0), sur les 12 cas
Rien d'absurde. Les bouteilles sont justes :
- Verallia : ≥504, soit une palette de 1200 au minimum à 0,42 ;
- Fournisseur B : 410, soit 600 × 0,55 plus 80 de livraison ;
- Occasion : ≥80, soit 400 × 0,20, avec ⚠ 400/600 ;
- la colonne de chaque offre porte bien le coût pour couvrir 600 bouteilles.

Les autres cas sont plausibles :
- CO2 : 1,2 bar ↘ 0,4 bar en une semaine sur un fût, c'est une fuite ;
- levure : 3e génération, 12 jours au frigo, puis un starter ;
- sureau : en fin d'ébullition ou à froid.

Tous les J-n sont justes au 25 nov. : J-1, J-5 (lundi 30), J-7 (2 déc.), J-8 (3 déc.), J-11 (6 déc.), J-20, J-36 et J-96.

Doute, non compté : la fixture de la cave dit « samedi 6 déc. ». Or le 6 déc. 2026 est un dimanche. Ce sont ses mots, et la maquette les garde. Au port, l'app pourrait signaler un jour qui ne colle pas à sa date.

## Tour 2 → tour 3 : ce qui est réglé
| Tour 2 | Tour 3 |
|---|---|
| CN1 (B), le raccord fait rangé en solution | **Réglé** dans les 3 : vert plein avec ✓ dans la recherche (v6, v7) ou tuile ✓ (v2), `cap12/*-co2.png`. |
| v7 B1, la chaudière : l'heure du brassage lue comme celle de l'appel | **Réglé** : la pastille porte « Brassage IPA · J-1 · demain 7h », en rouge (`cap12/v7-chaudiere.png`). |
| CN2, J-8 sans objet | **Réglé** : « Brassin J-8 3 déc. » (`cap12/*-pilsner.png`). |
| CN4, citra tout hachuré | **Réglé** : plus de table. La v7 passe à « Ouvrir les liens » (`cap12/v7-citra.png`). |
| CN3, lignes coupées en IA absente | **En partie.** Écoulement et bouteilles sont en entier. Trois troncatures restent (v7 B1 ci-dessous). |
| v7, pastille du panier muette ; « Changer le joint » coupé | **Réglé.** |
| J-n répété (v2, v6) | **Réglé.** |
| v2, la tuile « Fournisseur B / par 600 » | **Réglé** : la tuile est retirée. |
| v6, la tuile « Fournisseur B par 600 » | **Pas réglé** (v6 B1). |

## v7 — la recette
**Avis.** C'est la meilleure, et nettement. Sur les 12 cas, on voit en 3 s ce qu'il faut faire, pour quand, et pourquoi.
- **En-tête.** Le héros commence à 46 px. Il prend un quart de l'écran au plus.
- **Échéance.** La pastille dit son objet (« Brassage IPA », « Brassin », « Renouveler l'assurance »). Sa couleur suit l'urgence : rouge J-1, orange J-5 et J-7, gris J-20 et au-delà.
- **Avancement.** Il dépend du genre (§ FRISE-GENERIQUE tenue) :
  - le compte « 1/3 trouvé » pour un problème ;
  - les sous-tâches à cocher pour un événement ou une liste ;
  - les colonnes de prix pour un achat ;
  - rien pour une idée.
- **Les bouteilles** (`cap12/v7-bouteilles.png`) : c'est l'écran qu'il attend. Les colonnes du coût total montrent la gagnante sans lire de chiffre. Le hachuré veut dire « inconnu ». Le ⚠ 400 est sous Occasion. Le gros bouton « Prendre Fournisseur B » est en tête.
- **Les gestes sont propres** :
  - la bulle s'ouvre sous l'élément touché (`cap/v7-ecoulement-ligne.png`, `v7-chaudiere-ligne.png`, `v7-ecoulement-piste.png`) ;
  - ce qui vient de l'IA est marqué : « Proposé par l'IA, pas dans tes notes », avec Retirer et Garder (`cap/v7-ecoulement-ia-ligne.png`) ;
  - l'Aide propose une chose à la fois, avec « non », « plus tard » et « Garder » ;
  - un toast avec Annuler suit chaque retrait, et le ✕ sur « conseillé » en a un aussi (`cap/v7-ecoulement-sansconseil.png`).
- **IA absente** : l'écran reste lisible et honnête. Il dit « lu par l'app » et ne montre que ce que l'app lit.

Phrase prédite : « Là oui, je vois quoi faire, pour quand et pourquoi, et les barres des bouteilles avec "Prendre B" c'est direct. Par contre sans IA il me coupe mes phrases. »

**Problèmes.**
1. **B, troncatures en IA absente (CN3 revu 2 fois, L12).**
   - Captures : `cap/v7-cave-sansia.png`, héros « Ranger la cave le samedi 6 déc. au… » ; `cap/v7-assurance-sansia.png`, héros « Renouveler l'assurance avant le… » ; `cap/v7-co2-sansia.png`, ligne 4 « à revérifier dans une… ».
   - La règle du pilote dit que ses lignes s'affichent en entier.
   - Correction : afficher le héros et les lignes en entier, sur 3 lignes au plus, sans points de suspension.
2. **m, date du héros en IA absente** (`cap/v7-cave-sansia.png`). La pastille affiche « semaine du 30 nov. » en gros chiffres pour une chose prévue le 6 déc. L'œil lit « 30 nov. ».
   - Correction : montrer la date dite dans sa ligne quand elle y est (« sam. 6 déc. », « 31 déc. ») ; sinon, « sem. 30 nov. » en petit.
3. **m, après « Prendre »** (`cap/v7-bouteilles-prendre.png`). « Choisi · Fournisseur B » ne dit pas la suite, alors que l'achat va de comparé à choisi puis commandé (§ FRISE-GENERIQUE : dire la prochaine chose utile). La colonne B n'est pas mise en avant, et les deux autres ne sont pas éteintes.
   - Correction : un héros « Commander chez B · J-20 » ; la colonne B entourée, Verallia et Occasion grisées.
4. **m, citra** (`cap12/v7-citra.png`). Le picto du héros « Ouvrir les liens » est le houblon, qui est l'objet du carnet. Les autres héros portent le picto du geste : téléphone, enveloppe, balai.
   - Correction : un picto de lien.
5. **m, CO2 toujours à 30 mots pile** (`cap12/v7-co2.png`). La règle est tenue, mais sans aucune marge. Ce mineur est revu, mais le cas ne viole aucune règle : je ne le passe pas en bloquant.
   - Correction : retirer « trouvé » après 1/3, puisque l'anneau le dit.

**À greffer.** Rien de plus : la v7 a déjà pris les seules greffes utiles de la v2 (jauge du coût) et de la v6 (raison de l'échéance).

**Note : 8/10.**

## v6 — une seule chose maintenant
**Avis.** Les corrections sont justes :
- chaque chiffre porte sa légende (« Avant coupure », « Budget ») ;
- le raccord est en ✓ ;
- la chaudière dit « Brassage IPA J-1 ».

Mais le héros mange 40 % de l'écran sur chacun des 12 cas, et la moitié de l'écran pour un carnet réglé (`cap12/v6-pilsner.png`). La v7 dit la même chose en deux fois moins de place, avec la comparaison en plus.

Phrase prédite : « C'est clair, mais c'est énorme, et "Fournisseur B par 600" je sais toujours pas ce que ça veut dire. »

**Problèmes.**
1. **B, « Fournisseur B par 600 »** (`cap12/v6-bouteilles.png`). Le mineur est revu 2 fois (tour 2, m2), donc il devient bloquant (L12). Aucun prix à la bouteille, aucune image de qui coûte le moins.
   - Correction : retirer la rangée, et porter les barres de coût de la v7.
2. **B, « plus tard » sans mot** (`cap12/v6-*.png`). Le bouton n'a que son icône. C'est une icône muette, revue 2 fois (tour 2, m5). Correction : écrire « plus tard », comme la v7.
3. **m, citra et bouteilles** (`cap12/v6-citra.png`). Les étapes en pictos (balance › main › colis) dans le coin du héros sont muettes. Le héros dit « Choisir l'offre » alors qu'aucun prix n'est connu.
4. **m, refus des bouteilles** (`cap/v6-bouteilles-refus.png`) :
   - le toast recouvre la rangée Occasion ;
   - la carte IA affiche encore « 1/2 » après un retrait. Doute : je ne vois pas ce qui a été retiré.
5. **m, goût, non bloquant** : le héros géant fait le genre de la variante. Je le signale sans le rejeter.

**À greffer.** Rien de neuf.

**Note : 6,5/10.**

## v2 — tuiles
**Avis.** La barre du coût total (`cap12/v2-bouteilles.png`) reste l'image la plus lisible de « qui coûte le moins » : en ligne, avec hachuré, ⚠ 80 et 400/600 dessous. Le héros est compact, la paire 1,2 ↘ 0,4 bar du CO2 tient, et le raccord fait est en tuile ✓. Mais la grille laisse des trous, et elle met en vedette des compteurs vides.

Phrase prédite : « Les barres c'est top. Mais "0/1 trouvé" en gros, ça me dit juste que j'ai rien, et y a des trous partout. »

**Problèmes.**
1. **B, la tuile « 0/1 trouvé » ou « 0/2 trouvé »** (`cap12/v2-bar.png`, `v2-citra.png`, `v2-chaudiere.png`). Une demi-tuile pour un compteur à zéro. Revue 2 fois (tour 2, m3), donc bloquante (L12).
   - Correction : ne montrer la tuile qu'à partir d'une piste trouvée. Avant, les questions en pastilles, comme dans la v7.
2. **m, « comparé » allumé dans le héros de citra** (`cap12/v2-citra.png`) alors que rien n'est comparé : aucun prix n'est connu. Valeur douteuse. Le héros « Choisir l'offre » est vide.
3. **m, demi-tuiles qui laissent des trous** : `cap12/v2-sureau.png` (4,5 % seul), `v2-levure.png`, `v2-ecoulement.png`.
4. **m, « Appeler / le / technicien » sur 3 lignes** (`cap12/v2-chaudiere.png`), et « Fournisseur / B » coupé dans la barre des bouteilles.
5. **m, pas de geste « Prendre »** sur l'offre gagnante (`cap12/v2-bouteilles.png`).

**À greffer.** C'est déjà fait dans la v7 : la barre de coût, posée en colonnes.

**Note : 6,5/10.**

## Classement
1. **v7 (8)** : la recette tient sur les 12 cas et sur tous les gestes. Le seul bloquant restant concerne les troncatures en IA absente, et il se corrige en une ligne de CSS.
2. **v6 (6,5)** : elle est juste, mais énorme, et elle rejoue « par 600 » et l'icône muette.
3. **v2 (6,5)** : elle a la meilleure barre de coût, mais ses compteurs à zéro sont rejoués et la grille est trouée.

La passe a progressé :
- tous les bloquants du tour 2 sont réglés pour la v7 ;
- CN1, CN2 et CN4 sont réglés partout ;
- la chaudière est juste.

Elle n'est pas encore « satisfaisante » au sens strict, car il reste un B sur la v7 (B1) et deux sur la v6 et la v2. Ce sont des retouches, pas un nouveau tour.

## À écarter
Aucune variante n'est sous 6. Je propose quand même de n'en montrer qu'une au port : la v7. La v6 et la v2 n'apportent plus rien qui ne soit déjà dans la v7. La page de choix peut les garder comme témoins, avec leur note.

## Répond au besoin ? **Oui, pour la v7.**
Le besoin, dans ses mots : TDAH, visuel, « trop textuel », « peu vraiment utile », « frise trop générique ». La v7 y répond :
- 15 à 30 mots au repos ;
- la première info utile à 46 px ;
- chaque bloc porte un repère qui se lit sans lire : couleur d'urgence, anneau, colonnes, ✓ vert, barré, hachuré ;
- l'avancement dépend du genre ;
- l'IA est marquée et refusable.

## Retouches de la v7 avant de la porter dans le jouable
1. IA absente : afficher le héros et les lignes en entier, sur 3 lignes au plus, sans « … » (`cap/v7-cave-sansia.png`, `v7-assurance-sansia.png`, `v7-co2-sansia.png`). Bloquant.
2. IA absente : la date du héros reprend la date dite dans sa ligne (« sam. 6 déc. », « 31 déc. »). La semaine lue par l'app passe en petit, ou disparaît quand la date dite existe.
3. Après « Prendre » : un héros « Commander chez B · J-20 » (achat : comparé › choisi › commandé). La colonne choisie est entourée, les deux autres sont éteintes.
4. Citra : un picto de lien sur « Ouvrir les liens », à la place du houblon.
5. CO2 : se donner une marge sous 30 mots, en retirant « trouvé » après le compte 1/3, puisque l'anneau le dit.
6. Dépendance hors variante, à faire avant le port : corriger la lecture locale (`genreLocal`, terminaison testée sur le mot accentué, noms du métier dans PAS_VERBES). Sinon, sans IA, le héros reste faux dans 4 cas sur 12.

LEÇON PROPOSÉE : un correctif « lignes en entier » se vérifie sur chaque état qui affiche une ligne : le héros, les lignes et les pastilles. La correction 2 a déroulé les lignes, mais le héros, issu de la même ligne, est resté coupé (cave, assurance).
