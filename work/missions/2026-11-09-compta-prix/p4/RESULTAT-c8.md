OK — Prix passe 6 : c8a–c8d, quatre pistes qui poussent les deux échelles de c7c (thermomètre, double règle, deux bouteilles, table)

## Fichiers écrits
`p4/c8a/`, `p4/c8b/`, `p4/c8c/`, `p4/c8d/` : chacun `etat.html` (statique, classes et globales préfixées), `NOTE.md`, `<id>-haut.png`, `<id>-etat2.png`, `<id>-page.png`, `<id>-1280.png`. Ce fichier. Scripts hors dépôt (scratchpad) : `tout-c8.sh`, `probe.mjs` (réemploi de `cap-c4.mjs`). Rien dans `src/`, aucun commit, pas de stash.

Base : `p4/c7c/etat.html` et sa capture `c7c-haut.png` (ouverte, mise à côté des miennes) ; son idée gardée dans les quatre : les deux échelles /bouteille et /an côte à côte, zéro au coût, zones à perte / mince / il te reste, le prix lu 5,00 ex., Proposer et Changer le prix.

| id | chaleur | la piste | ce qui va plus loin que c7c | état 2 |
|---|---|---|---|---|
| c8a | chaude | thermomètre debout : /an à gauche, /bouteille à droite, colonne verte jusqu'au reste, réservoir = coût en 3 parts | impôt 0,08 et emballage 0,30 ex. dans le réservoir ; cartes Privé 5,00 · Pro 4,50 · 6,00 lues dans les deux unités ; tête °C \| °F | IA : 5,50 posé sur la colonne, feuille avec raisons |
| c8b | tiède | double règle horizontale (/bouteille dessus, /an dessous) ; le prix en barre empilée bière · emballage · impôt · reste qui tombe sur la règle | le prix lu comme une somme ; segment Privé \| Pro ; deux cartes (autre client, 6,00) | Pro : 4,50 → 2,02 \| 7 344,72, tout suit |
| c8c | chaude | deux bouteilles remplies jusqu'à leur prix, Privé 5,00 et Pro 4,50, la double échelle debout entre elles, ligne du coût commune | la marge se voit en hauteur de vert, par client ; impôt et emballage sont des niveaux dans la bouteille | IA : un niveau bleu par bouteille (5,50 · 4,80), bande « Appliquer les deux » |
| c8d | froide | table de conversion 3,50 → 6,50, reste /bouteille et /an côte à côte, barre par ligne ; la ligne lue est la tête | sept prix comparés d'un regard ; coût en barre mince au-dessus (bière, emballage, impôt) | IA : la ligne 5,50 en bleu, raison sous la table |

Nombres communs : coût 2,48 = bière 2,10 (6,37 × 0,33) + emballage 0,30 (exemple, hors fixture) + impôt bière 0,08 (25,32 CHF/hl × 0,33 L) ; reste 2,02 · 2,52 · 3,52 ; × 3 636 (1 200 L ÷ 0,33) = 7 344,72 · 9 162,72 · 12 798,72 ; IA (exemple) 5,50 → 3,02 · 10 980,72, 4,80 → 2,32 · 8 435,52. Pro = Café du Bourg à 4,50 ex., Privé = 5,00 ex. (bornes 4,50 à 6,00 du brief).
Corrections transversales tenues : 7,51 CHF/L (lien), coût nommé, « Il te reste », grille 5,00 · 10,00 · 160,00 « ex. », 27 L nets, « si 1 200 L · estimé » sous chaque annuel, « ≤ » pour l'emballage inconnu des 75 cl et du fût, aucun cockpit, décimales constantes. Le brassin 41/40 de c7c est dit « 41 remboursent · 40 à toi » dans les quatre (deux mots de moins, pour tenir 60 avec Privé, Pro, bière, emballage, impôt ajoutés).

## Sorties décisives
- `verifier-page.mjs --captures --min-images 0` ×4 : PAGE OK (390 px, sans erreur). `cap-c4.mjs` : 1280 débord 0 ×4, erreurs 0, texte < 12 px : 0 ×4.
- `mots-premier-ecran.mjs … --max=60` : c8a 59 · c8b 59 · c8c 60 · c8d 54 → **MOTS OK** (premiers passages 66 · 85 · 76 · 72, corrigés : « ⅓ ex. », « en 33 cl » doublon, « Café du Bourg » dans la fiche client, « par an » → « /an », brassin dit plus court).
- `controle-commun.mjs p4 c8a c8b c8c c8d --profil=sans-houblons --sans=mots` : couleurs, survol, blocs, standard, parlant, brutes OK ; **contraste ECHEC 2** sur c8a seul : « 5,00 ex. » et « 5,50 ex. » à 1:1. Faux positif vérifié : texte blanc sur pastille #111 / #1F64A3 (voir `c8a-haut.png`, `c8a-etat2.png`), `elementFromPoint` au centre du texte rend le texte lui-même (`probe.mjs`), même construction que la pastille « 5,00 ex. » de c7c qui passe. Les 14 autres alertes des premiers passages (axes sur fond peint, pastille sur un chiffre, « 2 » sous une ligne pointillée) étaient vraies et sont corrigées.
- `controle-panel.mjs` (4 `-haut.png`) : remplissage médian 0,70, 1 sous 0,50 (c8b, la règle est basse) · ressemblance 0,91 (seuil < 0,90), 0/6 paires presque identiques → **PANEL ECHEC**, attendu : les quatre partent de c7c et gardent son chrome (en-tête, formats, actions, barre du bas) ; l'objet central est différent dans chacune (c7 : 0,95).
- `type="number"` : 0 ; IBAN : 0. `git status --short` : seuls mes dossiers `p4/c8*/` et ce fichier ajoutés (les autres modifications listées sont du pilote).

## Captures (toutes ouvertes après la dernière retouche sauf mention)
`p4/c8a/c8a-haut.png`, `c8a-etat2.png`, `c8a-1280.png` (1280 revue avant la retouche des cartes, texte seul changé) ; `p4/c8b/c8b-haut.png`, `c8b-etat2.png` ; `p4/c8c/c8c-haut.png`, `c8c-etat2.png`, `c8c-1280.png` (vue avant la correction de la taille du /an ; CSS seul) ; `p4/c8d/c8d-haut.png`, `c8d-etat2.png`. Non ouvertes : `c8b-1280.png`, `c8d-1280.png`, les `-page.png` (débord 0 mesuré, 1280 dessinés sur le même gabarit que c7c).

## Prédiction
« c8c, les bouteilles, c'est vraiment bien » : il garde c8c pour la forme et demande les cartes de c8a (ou la table de c8d) pour comparer plus de prix ; c8b lui paraît la plus proche de c7c.

DÉCISION À PRENDRE : le plafond de 60 mots au premier écran n'absorbe plus les ajouts obligatoires de la passe 6 (Privé, Pro, bière, emballage, impôt, ex.) sans raccourcir un acquis (« 41 paient le brassin · 40 pour toi » → « 41 remboursent · 40 à toi ») : à trancher (relever à 64 pour Prix, ou valider le libellé court). Reste ouverte celle de la passe 4 (impôt au taux plein 25,32 CHF/hl contre réduction petit brasseur).
CONNAISSANCE : `controle-contraste.mjs` rend 1:1 sur un texte SVG blanc centré dans une pastille pleine quand le centre du texte tombe sur une virgule ou un espace (c8a « 5,00 ex. », « 5,50 ex. »), alors que la même pastille passe ailleurs (c7c) : à vérifier sur la capture avant de corriger la maquette.
LEÇON PROPOSÉE : aucune.
