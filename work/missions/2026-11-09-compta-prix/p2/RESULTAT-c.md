OK — 9 concepts passe 2 : coût c3a–c3d (variantes c1c), Prix c4a–c4e (autres genres)

## Fichiers écrits (voie c seulement)
`p2/c3a/` … `p2/c3d/`, `p2/c4a/` … `p2/c4e/` : chacun `etat.html` (classes préfixées), `NOTE.md`, `<id>-haut.png`, `<id>-page.png` (repos + état utile dessiné à côté), `<id>-1280.png`. Ce fichier.
Script de capture 1280 hors dépôt (scratchpad de la session). Rien dans `src/`, aucun commit. `git status` : seuls `p2/` (partagé avec les autres voies), et ce qui était déjà modifié avant (SPEC, ecrans-app.json, BRIEF-PASSE2, v0/g-outils).

| id | écran | chaleur | idée | état 2 |
|---|---|---|---|---|
| c3a | coût | froide | c1c affiné : Déjà payé 22,41 · À payer 64,26 · Coût de l'année 116,10 ; litre 7,51 redécoupé 0,83 · 2,38 · 4,30 | À payer touché (jaune, 64,26 TTC) |
| c3b | coût | tiède | le flux tombe de haut en bas, entonnoir « ÷ 27 L nets » vers la barre du litre | feuille « Frais du brassin » 41,84 (répartition exemple) |
| c3c | coût | tiède | le flux remplit un verre d'un litre gradué en francs (greffe c1b) | « Coût de l'année » : 4,30 sur 7,51 |
| c3d | coût | chaude | flux → litre 7,51 → tuiles des formats (33 cl 2,48 · 75 cl ≥ 4,97 · fût ≥ 132,46) | fût : chaîne depuis la bière seule 6,37, reste ≤ 27,54 |
| c4a | prix | tiède | règle à bandes à perte / mince / il te reste (langue de p2b), le prix posé dessus | fût dans « mince », limite hachurée |
| c4b | prix | tiède | « Où vont tes 5,00 » : flux depuis la bouteille vendue (langue de c1c) | 75 cl, emballage hachuré, reste ≤ 5,03 |
| c4c | prix | chaude | les 81 bouteilles : 41 paient le brassin, 40 sont pour toi | prix 4,50 : 45 / 36, 163,62 |
| c4d | prix | chaude | la cuve de 27 L partagée (fût + 33 cl, exemple) ; si tout part en un format | premier fût sans prix : « 52,92 + ? » |
| c4e | prix | chaude | la pente de l'année : prix → reste sur 1 200 L ; + 0,10 = + 363,60 /an | fût : ≤ 1 652,40, + 10,00 = + 600,00 /an |

Corrections transversales tenues : un seul litre en tête 7,51 (« 33 cl comprise ») ; 6,37 toujours écrit « bière seule, sans emballage ni impôt » avec lien vers 7,51 ; grille d'exemple 5,00 · 10,00 · 160,00 ; payé / à payer / coût nommés (Déjà payé · À payer · Coût de l'année) ; 27 L nets partout ; répartition des 41,84 et usure 8,10 en pointillé « exemple » ; « Usure matériel », « Il te reste » ; aucune rangée fournisseurs ; arrondi de c1c corrigé (stock 22,41 → somme 202,77). Aucun IBAN.

## Sorties décisives
- `verifier-page.mjs --min-images 0` ×9 : PAGE OK (390 px, sans erreur). 1280 : débord 0 ×9.
- `controle-commun.mjs p2 c3a…c4e --page=etat.html --profil=sans-houblons` : COMMUN OK (mots, couleurs, survol, blocs, contraste, standard, parlant, brutes). Premier passage en échec (contraste 41, rayons 7, mots 2) : corrigé (vert #256B42, rayons 10 px, mots réduits).
- `mots-premier-ecran` : c3a 84 · c3b 63 · c3c 78 · c3d 96 · c4a 98 · c4b 81 · c4c 72 · c4d 98 · c4e 94 → MOTS OK (alerte modérée, chiffres compris). Hors chiffres, estimé à 50–60 ; c4a et c4d frôlent le plafond de 60 du brief.
- `controle-panel.mjs` (9 premiers écrans) : remplissage médian 0,69, 0 sous 0,50, ressemblance 0,85, 0/36 paires identiques → PANEL OK.
- `type="number"` : 0.

## Captures (toutes ouvertes)
`p2/<id>/<id>-haut.png`, `<id>-page.png`, `<id>-1280.png` pour c3a, c3b, c3c, c3d, c4a, c4b, c4c, c4d, c4e.

## Prédiction
Pour le coût, il prendra c3a ou c3c (« ton litre, c'est surtout l'année » se voit) ; pour les prix, c4c (« dès la 41e bouteille ») ou c4a (sa règle à bandes), avec la pente de c4e comme outil d'analyse.

DÉCISION À PRENDRE : c3d et c4a–c4e montrent coût et prix par format ; le coût d'un format sans emballage connu (75 cl, fût) reste « ≥ ». Il faut une vraie valeur d'emballage par format dans `financeDemo.ts`, ou le garder en « à compléter ». À montrer en variantes, pas à trancher ici.
CONNAISSANCE : à la grille d'exemple, 41 des 81 bouteilles de 33 cl paient le brassin, et chaque 0,10 CHF sur la 33 cl vaut 363,60 CHF par an sur 1 200 L (3 636 bouteilles). Le fût 20 L à 160,00 laisse au plus 1,38 CHF/L, contre 7,64 CHF/L pour la 33 cl.
LEÇON PROPOSÉE : aucune.
