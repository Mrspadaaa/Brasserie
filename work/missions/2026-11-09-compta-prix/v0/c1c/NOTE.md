# c1c — Coût d'un brassin · chaud

**Chaleur** : chaude (forme libre : un flux, type Sankey).
**Idée** : à gauche, quand l'argent part (en stock 22,42 · maintenant 64,26 · sur l'année 116,10) ; à droite, ce qu'il paie (malt, frais, charges fixes, matériel) ; le flux finit dans un seul nombre noir, « tout ÷ 27 L = 7,51 CHF le litre ». Toucher « Maintenant » isole l'argent qui sort et passe le bloc au jaune : 64,26 CHF TTC, avant le brassage.
**Où (proposition)** : page du brassin (Brassins › Pale Ale de septembre), fil d'Ariane, barre du bas sur Brassins.

## Chiffres
Fixture : stock 3 kg × 7,472 = 22,42 → malt ; maintenant 22,42 (3 kg) + 8,00 + 3,00 + 24,00 + 6,84 = 64,26 ; sur l'année 108,00 + 8,10 = 116,10.
Le total 202,77 n'est pas affiché (arrondis des parts : 202,78) ; seul le litre l'est. Houblon, levure : nœud hachuré « ? », trait pointillé.

## Problèmes résolus
Le défaut central du § 5 (« argent à sortir » contre « coût de revient » confondus) : deux lectures du même dessin. 3 (un seul litre). 27 (zéro phrase d'aide).

## Baseline
Gardés : à payer, coût CHF/L, postes, Prévoir. À un toucher : chaque nœud ouvre son poste (non dessiné). Partis : liste détaillée des ingrédients, volumes éditables, estimation enregistrée → feuille c1a (« Expliquer » ou toucher un nœud). Écart voulu : pas de saisie sur cet écran (lecture seule) ; la NOTE le dit.

## IA
« Expliquer » (au toucher, à côté de Prévoir) : lecture du flux en mots, source montrée, « exemple ».

## Boosters UX
- `flux-cout` — lire/comparer ; Sankey proportionnel (1,9 px/CHF) ; toucher une source estompe les autres (cadre 2).
- `deux-nombres` — lire ; bloc noir (litre) / jaune (poche) selon la source touchée.
- `ia-expliquer`, `prevoir` — déclencher.
- B1 OK. B2 OK — le flux puis le 7,51 en 28 px. B3 OK — 59 mots. B4 OK. B5 OK. B6 OK. B7 OK (COMMUN). B8 OK — « ? ». B9 s.o. B10 s.o. (aucune saisie). B11 « Ton litre de 7,51 vient surtout de l'année (loyer) ; 64,26 sortent maintenant. » B12 OK. B13 OK — sources en boutons ≥ 36 px.

## Contrôles
PAGE OK · 1280 débord 0 · COMMUN OK · mots 59 · remplissage 0,741 · PANEL OK (lot c). Captures : `c1c-haut.png`, `c1c-page.png`, `c1c-1280.png`.

## Tient / casse
Tient : moderne, frappant, répond aux deux questions sans texte. Casse : nettoyage (3,00) fait 6 px ; un Sankey se lit moins vite qu'une barre pour qui ne le connaît pas ; une bande vide sous le bloc noir.
