OK — six variantes a2a–a2f, cinq figures chacune, PAGE OK ×6, MOTS OK, PANEL OK 0,72

## Variantes
- `a2a` sobre — a1a telle quelle, couleur dans les contremarches et une pastille ; segment Caisse · Sources · Budget · Filtrer ; Sources = cascade de a1e couchée (janv.–oct.) ; Budget = règles par source + brassin ; Filtrer = tuiles de a1b en sélecteur de période.
- `a2b` sobre — frise des mois de a1b en tête, points teintés, vues dans un dock au pouce ; Sources = une courbe par source ; Budget = sources en % du prévu.
- `a2c` franche — marches pleines teintées, gagné en grand, mois pliés en une rangée, vues en pastilles de couleur ; Sources = cascade de a1e par source (octobre) ; Budget = barres pleines.
- `a2d` franche — les couloirs : une piste par source sous l'escalier, chaque opération un bloc à sa date relié à sa marche ; piste touchée = filtre ; Sources = chaleur sources × mois + 2025 ; Budget = couloirs mois par mois, mur (prévu) passé daté ; onglets soulignés.
- `a2e` audacieuse — tuiles 6 × 2 en tête, escalier sur fond lavé (palier teint par sa source), vues en pictos ; Sources = rivière (sankey 2 320 + 10 108 → caisse 4 016, charges, brassage, nettoyage, autres, matériel à part) ; Budget = bocaux (rebord = prévu, débord hachuré, mousse des ventes, trait 2025).
- `a2f` audacieuse — fond sombre, escalier en ruban, vues en carrousel ; Sources = strates miroir par mois + ligne du gagné et 2025 ; Budget = écarts au prévu en %, barres divergentes, 2025 en barre fine.

## Fichiers
`p7/a2a/` … `p7/a2f/` : etat.html (classes `a2x-`), NOTE.md, `-haut.png`, `-page.png`, `-v1…v5.png`, `-1280.png`. Générateur `p7/_gen/` : ajout `a2d.mjs`, `a2e.mjs`, `a2f.mjs` ; `lib.mjs` (style d'escalier `lave` ; « rien noté » de l'état honnête descendu, il touchait la pastille « départ ») ; `vues.mjs` (tuiles : option `pale`, mots en sans et sans retour à la ligne, « ≤ » au coin) ; `a2c.mjs` (en-tête : segment « 30 j · Oct. · An », chiffre 25 px, plus rogné). a2a–a2c régénérées. Rien dans `src/`, aucun commit, pas de stash.

## Sorties
- verifier-page ×6 : `PAGE OK (0 images chargées, 390 px, sans erreur)`.
- cap.mjs ×6 : `5 figures · 1280 débord 0 · texte < 12 px 0 · erreurs 0`.
- mots-premier-ecran (--max=60 --sans-donnees --sans-coquille --profil=sans-houblons) : a2a 59 · a2b 59 · a2c 58 · a2d 45 · a2e 57 · a2f 51 → `MOTS OK`.
- controle-panel `p7/a2?/a2?-haut.png` : `6 captures · remplissage médian 0,73, 0 sous 0,50 · ressemblance moyenne 0,72 · paires 0/15 → PANEL OK`.

## Captures ouvertes
a2d v1–v5, a2e v1–v5, a2f v1–v3 ; a2a-haut, a2b-haut, a2c-haut et a2c-v1 après resserrage (segment entier, plus rogné). Non rouvertes après la dernière régénération : a2a, a2b (seules les tuiles honnêtes ont changé), a2f v4–v5.
Défauts vus et laissés : a2c, « −400,00 , plus forte baisse » (espace avant la virgule) ; a2d v1, bas d'écran ~40 px vide ; a2f v2, « 2025 +280,00 » touche la ligne blanche.

## Données
Année d'exemple de la passe 1 (marquée « exemple ») ; contrôlées : ventes 10 108,00 = somme des mois ; dépensé 8 092,00 sur 8 100,00 prévus ; gagné 2 016,00 ; brassage : juillet + août 730,00 contre 580,00 prévus, les autres mois rattrapent 70,00. Brassin Pale Ale 57,42 → 64,26 repris de a2c. Figure 5 : ses données (départ 100,00 à confirmer, vente 5 695,00 le 10.11, 5 achats ≥ −27,68, matériel 5 500,00 à part, 3 projets sans date, aucun prévu, 2025 vide).

## Prédiction
Il ira à a2e (rivière et bocaux, « plus de couleur, d'analyse ») et à a2c ; a2f le frappera mais sort du thème clair.

DÉCISION À PRENDRE : aucune nouvelle (le « prévu » des ventes suppose des `FinancialPlan` entrants, déjà signalé en passe 1).
CONNAISSANCE : aucune
LEÇON PROPOSÉE : six variantes à cinq figures dépassent le contexte d'un concepteur ; écrire d'abord le générateur commun, puis une voie par deux ou trois variantes.
