# z2c — le verre complet, relancé (passe 2 de z2b, 31.10, RELANCE-v1)

OK — z2c : 10 corrections faites sur 10, remplissage 0,84 ; PAGE OK, MOTS OK (75), CONTRASTE OK, HAUTEUR OK (1,04), COMMUN : couleurs seule en échec (écart accepté)

- **Base** : `v1/z2b`, copiée telle quelle ; `v1/z2b` n'est pas touchée (ses « M » de `git status` datent d'avant cette relance).
- **Ce qui reste reconnaissable** : le verre à gauche avec ses couches hachurées « ? » reliées par un fil tireté à leur ligne, l'échelle des
  teintes, la graduation en kg, l'ajout dans le vide, le plateau en clair de la couche touchée, la marque ambre, la famille qui tourne.
- **Ce qui change de structure** (conséquence du remplissage demandé, dit au pilote) : le verre prend la hauteur de l'écran (600 px au repos),
  chaque ligne se pose **face à sa couche** (fils horizontaux), la marque et les repères montent dans la colonne, dans le vide au-dessus du moût.

## Les corrections demandées (VERDICTS-v1, z2b et Commun)
| # | demandé | fait | capture |
|---|---|---|---|
| 1 | lecture du plateau à 4 caractères au moins (« 0,4( ») | oui : `lch()` donne 4,4 ch au moins, et la largeur suit la valeur (« 10,25 ») sur la ligne et dans le plateau ; mesuré « 0,40 » 4 car., 84 px, entière ; champ EBC à 4,8 ch | `z2c-sucre-couche`, `z2c-sucre-hors-cuve` |
| 2 | titre du plateau sur toute la largeur, segments dessous | oui : rang 1 nom + ×, rang 2 les trois moments en tiers égaux ; « Weizenmalz hell » entier (mesuré) | `z2c-couleur-pendant` |
| 3 | fils tiretés depuis le bord droit du verre, sans croiser l'échelle | oui : l'échelle des teintes passe **à gauche** du verre (échelle · graduation · verre · lignes) ; le fil part du bord droit du verre et ne traverse que l'interligne ; posé face à sa couche, il est quasi horizontal | `z2c-repos` |
| 4 | le « — » flottant reçoit un mot ou disparaît | mot : « teinte » (12 px, gris) au-dessus de la valeur, « — » tant qu'une couleur manque, « Paille » ensuite | `z2c-repos`, `z2c-couleurs` |
| 5 | sucre en deux états côte à côte (D126) | **couche fine au-dessus de la mousse** (défaut) : grains blancs pointillés, trait tireté, sa ligne en tête de la liste face à sa couche, l'OG attendue monte à ~1,066 ; **pastille « hors cuve »** (`#hors`) : ligne pleine largeur sous le verre, cube, puce tiretée « hors cuve ». Le verre, lui, ne compte que le grain (bandeau « Grain 8 kg » dans les deux) | `z2c-sucre-couche`, `z2c-sucre-hors-cuve` |
| 6 | piste du plateau à l'échelle de l'ingrédient | oui, la règle commune aux trois (r4c) : 0–2 kg sous 1 kg, sinon la graduation ronde au-dessus d'une fois et demie la masse ; dextrose 0,4 → 0–2, Weizenmalz 1,5 → 0–3, Pilsner 5 → 0–8 ; « M kg › » en bout de piste, sur une ligne | `z2c-couleur-pendant` (0–3), `z2c-sucre-couche` (0–2) |
| 7 | annexe des états hors du premier écran, à 390 et à 1280 | oui : `annexe()` pose sa marge pour qu'elle commence à 846 px (390) et 808 px (1280) ; fermée, elle tient en 34 px, le document fait 1,04 écran | `z2c-repos`, `z2c-1280` |
| 8 | remplissage ≥ 0,80 au repos sur ses 3 malts, par de l'information | **0,84** (controle-panel, repos). Le verre prend l'écran (600 px, pied à 0,94) ; la ligne « Rendement 75 % repère » est dépliée en trois puces à la r4-a dans la colonne : `Rendement 75 % repère`, `OG attendue ~1,061`, `style EBC 6–14` (teintée « sous ↓ / au-dessus ↑ » quand l'EBC connu en sort). Rien d'inventé : l'OG attendue est calculée au rendement repère avec des potentiels repères par famille (grain 37 PPG, flocons 33, sucre 46, lactose 35, extrait 37), d'où le « ~ » ; le fruit n'y entre pas | `z2c-repos` |
| 9 | convention du sucre (Commun) : « NN % du grain » / « NN % ferm. », nom · famille · moment · part · masse | oui : les grains disent « 63 % du grain » ; un autre dit « 100 % ferm. » (la fermentabilité de l'app, KIND_DEF : sucre 100, lactose 0, fruit 90, extrait 75), avec la puce de famille (« Sucre ») devant le moment. La masse reste à droite du nom (grande lecture de z2), le reste se lit sur le rang 2 dans l'ordre demandé ; annexe : lactose « 0 % ferm. », mangue « 90 % ferm. » | `z2c-sucre-couche`, annexe |
| 10 | marque « n couleurs à renseigner », 12 px, même mot | inchangée (14 px dans z2b : gardé, c'est un bouton ; le mot est celui des trois) | `z2c-repos` |

Et, pour tenir D5 avec le verre plein écran : lignes plus denses (52 px au lieu de 61 : lecture 24 px, pastille 18 px) ; 8 grains : 1,04 écran,
4 « ? » en marge, Grain 9,35 kg (`z2c-huit`). Le plateau ouvert naît sous le pli : la page glisse juste ce qu'il faut pour le montrer en entier
au-dessus du + flottant (`z2c-sucre-couche`, `z2c-couleur-pendant`).

## Écarts qui restent, et pourquoi
- **COULEURS ECHEC** (controle-commun : « 1 teinte franche, 38° ») : comme en z2b, l'échelle est la couleur de la bière et les couleurs de sa
  recette manquent ; le critique l'a dit acceptable. Rien d'ajouté pour le contrôle.
- **Marque à 14 px** (Commun demande 12 px) : gardée à 14 px parce que c'est un bouton tapable (u1) ; le mot est le même. Réversible en une ligne.
- **La masse avant la famille** dans l'ordre de lecture d'une ligne (nom · masse / famille · moment · part) : la grande lecture à droite est la
  signature de z2 ; l'ordre demandé est tenu sur le rang 2.
- **Les puces de repères se tassent entre « Ajouter… » et les lignes** ; à 1280 la colonne est large, elles restent à leur largeur propre.

## Contrôles (`--profil=sans-houblons`, depuis la racine)
- `verifier-page.mjs v2/z2c/etat.html --min-images 0` : **PAGE OK** (0 images, 390 px, sans erreur).
- `mots-premier-ecran.mjs v2 z2c --page=etat.html --max=80 --profil=sans-houblons` : 75 mots, **MOTS OK**.
- `controle-contraste.mjs v2 z2c --page=etat.html --profil=sans-houblons` : **CONTRASTE OK** (86 textes, pire 5,21:1).
- `controle-commun.mjs v2 z2c --page=etat.html --profil=sans-houblons` : mots, survol, blocs, contraste, standard, parlant, brutes **OK** ;
  au-style, fiche, trait, légende sautés ; **COULEURS ECHEC** (voulu, ci-dessus). **COMMUN ECHEC 1** (couleurs seulement).
- `controle-hauteur.mjs v2 z2c --page=etat.html` : **HAUTEUR OK (1,04 écran)** (881 px, l'annexe fermée sous le pli).
- `controle-panel.mjs z2c-repos.png z2c-repos.png` (la capture deux fois : l'outil en exige deux, la diversité est sans objet) :
  **remplissage médian 0,84**, 0 sous 0,50.
- `captures.mjs` (puppeteer, 0 erreur de page) : repos pied 0,94 écran, verre 600 px, annexe à 846 px, document 1,04 ; couleurs → EBC ~7,6,
  « teinte Paille », plage du style tenue ; sucre-couche : lecture « 0,40 » entière, Grain 8 kg, OG ~1,066, 4 lignes dans le verre ;
  sucre-hors-cuve : 3 dans le verre, 1 hors cuve (« Sucre · ébullition · 100 % ferm. ») ; geste couleur : 4,0 EBC, titre entier, piste 0–3 ;
  huit : 1,04 écran, 4 « ? » en marge ; 1280 : annexe à 808 px.

## Captures (toutes ouvertes en image, L12)
`z2c-repos.png` (390), `z2c-1280.png`, `z2c-couleurs.png` (après les trois couleurs : mot « Paille », repère sur l'échelle), `z2c-sucre-couche.png`
et `z2c-sucre-hors-cuve.png` (les deux formes du sucre, D126), `z2c-couleur-pendant.png` (plateau : titre, segments, piste 0–3, règle),
`z2c-huit.png` (8 grains).

## Prédiction
« Là je vois tout d'un coup : le verre plein, chaque malt en face de sa couche, ce qu'il me manque et où j'en suis. Le sucre dans le verre,
c'est mieux que la ligne à part. »

DÉCISION À PRENDRE : le sucre, **couche fine** (défaut) ou **hors cuve** (`#hors`) : les deux captures côte à côte sur la page de choix, il
tranche. Et, au port, l'OG attendue doit venir des potentiels du stock (comme le bandeau, « — » s'ils manquent) ; les PPG repères de la
maquette ne sont que des repères.
CONNAISSANCE : `controle-panel` ne compte que les rangées d'encre (texte, couleur : écart > 60 au fond) ; une carte blanche sur le panneau gris
ou une puce grise ne comptent pas. Un remplissage ≥ 0,80 veut donc de l'encre jusqu'au pied, pas des cartes.
LEÇON PROPOSÉE : aucune.
