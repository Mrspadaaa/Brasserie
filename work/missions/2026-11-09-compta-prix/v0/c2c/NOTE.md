# c2c — Prix et marges · chaud

**Chaleur** : chaude (forme libre : colonnes côte à côte, langue de s5a « colonnes comme Comparer »).
**Idée** : les trois formats ramenés au litre, sur une même échelle (CHF par litre) : en bas le coût (bière, emballage, impôt), au-dessus le vert jusqu'au prix ; au sommet, ce que rapporte un litre : 33 cl +7,64, 75 cl ≤ +6,71, fût ≤ +1,38. On voit d'un coup que le fût ne rapporte presque rien.
**Où (proposition)** : Prix quitte Clients pour Finances (rail Synthèse · Prix · Opérations · Prévisions · Annuel), à côté du coût.

## Chiffres
Litre 6,37 ; impôt 0,25/L ; emballage 33 cl 0,91/L (0,30 ÷ 0,33), 75 cl et fût hachurés (inconnus, hauteur fixe, non proportionnelle). Prix « exemple » 5,00 / 10,00 / 160,00, soit 15,15 / 13,33 / 8,00 CHF/L.
Restes : (5,00 − 2,48) ÷ 0,33 = 7,64 ; (10,00 − 4,97) ÷ 0,75 = 6,71 (au plus) ; (160,00 − 132,46) ÷ 20 = 1,38 (au plus).
Cadre 2 : IA, prix en pointillé bleu 5,50 / 11,00 / 170,00 marqués « Exemple IA », source « d'après ton litre 6,37 CHF et l'impôt 25,32 CHF/hl » ; « Prendre ces prix » seulement au toucher.

## Problèmes résolus
4, 18 (coût complet par format), 19 (un seul endroit pour les prix, dans Finances), 3 (litre repris). Métier : quel format pousser.

## Baseline
Gardés : prix, coût, marge par produit (marge ramenée au litre ; la marge par unité est l'étiquette noire), ajout (le +), Enregistrer. À un toucher : la feuille du tarif (toucher l'étiquette, non dessinée). Partis : recherche et filtre (inutiles à 3 formats ; reviennent au-delà de 4 colonnes en défilement horizontal), Privé / Pro (à greffer depuis c2a), TVA (pastille c2b).

## IA
« Proposer » : déclenché au toucher, sources montrées, prix « exemple » en fantôme, rien n'est remplacé avant « Prendre ces prix ».

## Boosters UX
- `colonne-prix` — ajuster/comparer ; glisser une colonne ou − + (équivalent au toucher) ; le vert et le gain suivent.
- `ia-proposer` — déclencher ; pointillés bleus (cadre 2).
- B1 OK. B2 OK — trois colonnes, les gains verts. B3 OK — 48 mots. B4 OK. B5 OK. B6 OK. B7 OK (COMMUN). B8 OK — hachures, « ≤ ». B9 s.o. (statique). B10 s.o. B11 « La 33 cl rapporte 7,64 par litre, le fût 1,38. » B12 OK. B13 OK — − + 28 × 24.

## Contrôles
PAGE OK · 1280 débord 0 · COMMUN OK · mots 48 · remplissage 0,701 · PANEL OK (lot c). Captures : `c2c-haut.png`, `c2c-page.png` (2 cadres), `c2c-1280.png`.

## Tient / casse
Tient : la comparaison entre formats, absente aujourd'hui ; très peu de mots. Casse : le prix par unité est petit (étiquette) ; ramener au litre demande un temps d'habitude ; le déménagement dans Finances ajoute un 5e onglet.
