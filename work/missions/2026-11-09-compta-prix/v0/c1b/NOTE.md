# c1b — Coût d'un litre · tiède

**Chaleur** : tiède (une représentation neuve : le verre doseur).
**Idée** : le litre est un verre doseur gradué en francs ; chaque poste est une couche, le niveau du liquide est le prix de revient (7,51 CHF le litre). Plus de la moitié est violette : le loyer et l'électricité, pas le malt.
**Où (proposition)** : dans le brassin lui-même (Brassins › Pale Ale de septembre › coût), barre du bas sur Brassins. Synthèse › Coûts y renvoie.

## Chiffres
Mêmes postes que c1a (fixture) ramenés au litre : malt 1,66 · énergie 0,30 · nettoyage 0,11 · emballage 0,89 · impôt 0,25 · matériel 0,30 · charges fixes 4,00 = 7,51.
Houblon, levure : couche hachurée « ? » (hors recette de démo). Récap sous le verre : ce brassin 3,21 CHF/L, part de l'année 4,30 CHF/L.
Curseur des litres nets : malt, énergie, nettoyage se partagent sur les litres ; emballage, impôt (par litre) et la part de l'année restent fixes au litre. 22 L → 7,98 CHF/L (cadre 2), trait bleu « 7,51 enregistré ».

## Problèmes résolus
3 (un seul coût du litre, visible là où vit le brassin), 5 (estimé marqué ; l'écart avec l'enregistré se voit), 27 (aucune phrase d'aide), 28 (en partie : la part de l'année est nommée ; le volume annuel reste au réglage).

## Baseline
Gardés : coût CHF/L, postes, volume net, Prévoir (primaire, montant à payer 64,26). À un toucher : la ligne d'un poste (non dessinée), l'estimation enregistrée (trait bleu dès qu'on bouge). Partis : la liste des ingrédients avec prix et source → feuille c1a, ouverte en touchant une couche (à dessiner). Volume brassé : repère « 30 L brassés » au bout du curseur.

## IA
« Baisser ? » (en-tête, au toucher) : où gagner sur le litre ; source montrée, réponse « exemple ».

## Boosters UX
- `verre-doseur` — lire ; couches proportionnelles, graduation en CHF, niveau = réponse.
- `litres-nets` — ajuster ; curseur 20–30 L ; les couches du brassin montent, le niveau suit (cadre 2).
- `part-annee` — lire ; deux pastilles brassin / année.
- `ia-baisser`, `prevoir` — déclencher.
- B1 OK. B2 OK — le niveau 7,51 (28 px) domine, un primaire. B3 OK — 68 mots. B4 OK. B5 OK. B6 OK — chiffres en Plex Mono. B7 OK (COMMUN). B8 OK — inconnu hachuré « ? ». B9 s.o. B10 OK — curseur, aucun `type="number"`. B11 « Un litre coûte 7,51, dont 4,00 de loyer et d'électricité. » B12 OK. B13 OK.

## Contrôles
PAGE OK · 1280 débord 0 · COMMUN OK · mots 68 · remplissage 0,719 · PANEL OK (lot c). Captures : `c1b-haut.png`, `c1b-page.png`, `c1b-1280.png`.

## Tient / casse
Tient : l'image se retient (« ton litre, c'est surtout le loyer »). Casse : les petites couches (nettoyage 0,11) font 5 px ; l'anse du verre croise des traits de renvoi ; l'argent à payer n'est que dans le bouton.
