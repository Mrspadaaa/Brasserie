OK — e5 passe 3 sans vide : remplissage 0,39 → 0,61, 77 mots, critères verts

## Fichiers écrits
Tous sous `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe3/` :
- `e5/etat.html`, `generer.mjs`, `socle2.mjs`, `captures.mjs`, `NOTE.md` ;
- `captures/` (captures et `geste-e5.json`) ;
- `captures/travail/` (`passe3.cjs`, la copie du générateur, `gates.txt`, `panel.json`).
La passe 2 n'est pas modifiée.

## Remplissage
Premier écran : 0,39 → **0,61** (M14, `controle-panel`), avec r6n2 à 0,70 sur la même mesure. Le vide est rempli par
des idées, et 77 mots seulement.

## Ajouté ou rapproché
- **Les colonnes « on gagne » empilent toutes les familles qu'Idaho 7 ajoute** : le floral en bas, puis les baies, les
  tropicaux, les agrumes et le noyau. La figure se remplit de vraie information : ce que chaque moment apporte en plus
  du floral (D76).
- **Le spectre des 12 familles au moment touché** (« ta stout → avec Idaho 7 », x3b réduit), monté du panneau à un
  toucher, sans chiffres : Pépins et Melon hachurés, le résineux en orangé au-delà de la zone 16D.
- **Le solde contre le meilleur** (« contre ★ floral ≈−18 ») et le bouton « ★ actif · 2 j » (greffe b4 du verdict).
- **La hachure réservée à l'inconnu** (verdict) : les jours « sans gain » passent en pâle et pointillé, et « IBU à
  cru? » perd son mot.
- **La mise en page** : fond blanc comme r6n2, blocs rapprochés, figure sur toute la largeur. Dans la fiche, « 1
  fiche » une fois au lieu de « 1/1 ».

## Sorties décisives (rejouées après la dernière retouche)
- G1 : `COMMUN OK`.
- G2 : `e5 77 mots`, `MOTS OK`.
- G3 : `UNE-QUESTION OK (1 groupe libre : moment)`.
- G4 : `ACQUIS OK (4/4 : geste, frise, valeurs, levure)`.
- G5 : `PAGE OK (0 images chargées, 390 px, sans erreur)`.
- G6 : `PANEL OK` (médiane 0,70, 0 sous 0,55 ; e5 seule : 0,61).
- G7, G8 : `EXISTENT OK`, `NOTE OK`.
- Geste au doigt : actif · 2 j → 50′ (« floral ≈+4 · trop amer », « contre ★ floral ≈−18 ») ; 0 erreur.

## Captures ouvertes
`passe3/captures/e5-premier-ecran.png`, `passe3/captures/e5-390.png`, `passe3/captures/e5-toucher-390.png`, et pour la
comparaison `fils22-comparer/captures/r6n2-premier-ecran.png`.

## Prédiction
« Là je vois tout ce qu'Idaho 7 apporte à chaque moment, et ce que ça coûte, très très bien. Mais le noyau et les
tropicaux se ressemblent dans la pile. »

CONNAISSANCE : `controle-panel` prend pour fond la couleur la plus fréquente de la capture et ne compte une ligne que si
2 % de ses pixels s'en écartent de plus de 60 (somme des écarts RVB). Le blanc des cartes sur le fond #eef0f4 (écart
43) et une bande pâle de zone (écart 16 à 43) comptent donc comme du vide. Seuls les traits et les aplats francs
remplissent.

LEÇON PROPOSÉE : mesurer le remplissage (`controle-panel`) dès la v0 de chaque concept, pas seulement au panel. Le
23.10, e5 a passé tous les contrôles et le critique en passe 2 à 0,39 de remplissage. Le vide venait d'une figure à
l'échelle d'une seule famille (le floral, sous 45 % de sa zone) et de cartes blanches sur un fond presque blanc. Le
remède était une idée de données (empiler ce que le moment apporte) et non du texte.
