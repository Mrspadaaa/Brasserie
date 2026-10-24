# d8c, « Le ruban de ta stout », passe 3 (voie r7d3-passe3, lot 23)

Question : « Quand ajouter Idaho 7 ? ». Un seul facteur libre, le moment. La passe 2 (`../passe2/d8/`) et la v0
ne sont pas modifiées.

- Générée par `generer.mjs`, copie de celui de la passe 2 retouchée par `captures/travail/passe3.cjs` puis
  `passe3b.cjs`. Les états intermédiaires sont dans `captures/travail/`.
- Captures par `captures.mjs`.

## Passe 3

**Remplissage du premier écran (M14)** : 0,52 en passe 2, puis 0,495 au premier tour, puis **0,617**.
r6n2 est à 0,704. On l'a obtenu avec des idées, pas avec du texte : 79 mots, sous le plafond de 80.

Rapproché :
- fond blanc, les cartes deviennent des filets ;
- moins d'écart entre les blocs ;
- rubans plus hauts : ma bière 40 px, avec Idaho 7 70 px, étapes 26 px.

Ajouté (greffes du tri et du verdict) :
- **Profil du floral sur le rail** (greffe dock-profil, a1 et b4) : au-dessus de chaque cran, une barre haute
  comme le floral de ce moment. **Trait orangé sous le rail** pour l'ébullition et le whirlpool, trop amers
  (hors 16D 50–70 IBU). Avant de glisser, on voit où monte le floral et où l'amertume déborde.
- **Loupe à mini-barres chiffrées** (greffe e5) : sous chaque moment voisin, son floral (« ~+3 · ~+4 · ~+5 ·
  ~+7 · ~+8 »).
- **Table d'IBU chiffrée par étape** (greffe b4) : 162 et 75 en orangé, « 60+? » à cru. La ligne de
  l'ébullition suit la minute du doigt (45′ → 150). L'ancienne jauge seule est retirée : la table la remplace et
  montre le piège d'un coup d'œil.
- **« contre ★ »** (greffes b4 et e5, « le meilleur en bouton ») : ce que le moment change contre le meilleur
  pour ta demande (actif · 2 j), plus « trop amer » à chaud. Exemple à 45′ : floral ~−17, baies ~−16,
  résineux ~−10, trop amer. Au meilleur ou tout près, le bloc compare à l'après (« contre après 3 j » et
  « ★ ici ») : résineux ~−6, végétal ~−5. Le bloc n'est jamais vide, et la réponse « où est le bon moment »
  (verdict : « je sais pas où est le bon moment ») est écrite.
- **Mesure traduite en famille** (greffe e5) : le picto de la famille avant le composé, l'auteur et l'année
  plutôt que le code de source (« McCabe 2023, au levurage » ; retouche commune 3 et 4).

Un seul sens par trait (retouche commune 2, leçon du verdict) :
- hachuré = inconnu seulement (Pépins, Melon dans les 12 barres) ;
- emporté = **contour** à la couleur de la famille ;
- à cru = « ? » et contour gris ;
- jours sans gain (3, 5, 7 j) = **pâles** et pointillés.

Fiche : « 1/1 fiche » est remplacé par « d'après 1 fiche (Beer Maverick) » une fois en tête (retouche commune 1).
La teneur du lot reste.

**Sorties décisives** :
- `COMMUN OK` ;
- `MOTS OK` (79) ;
- `UNE-QUESTION OK (1 groupe libre : moment)` avec `--edition` ;
- `ACQUIS OK (4/4 : geste, frise, valeurs, levure)` ;
- `PAGE OK` ;
- `PANEL OK` (d8 0,617, r6n2 0,704) ;
- geste : actif · 3 j → 45′, 0 erreur, largeur 390.

## Baseline

Reprise de la passe 2, sans changement, pour :
- y1b : le moment par 5′ au doigt, « face à ta stout » (ruban avant, ruban avec Idaho 7), le dock sous le pouce
  avec la loupe ;
- x3b réduit : les jours en bout de frise ;
- a2b : la cuve apporte, le moment emporte, la levure en dernière étape ;
- les acquis : couleurs, pictos de la planche standard avec « épicé » choisi, au style par défaut, α du lot
  puis plage, « mixte », stock en icône, « ? », fiche à l'appui long, 12 barres l5b à un toucher.

Écarts, chacun avec sa raison :
- **La jauge d'amertume devient une colonne chiffrée** par étape, et la minute d'ébullition suit le doigt.
  C'est la même jauge y1b répétée par étape, plus lisible pour comparer, et elle libère une ligne de mots.
- **« contre ★ » remplace « contre après »**. « Contre après » répétait l'emporté au signe près (CONNAISSANCE de
  la passe 2). Comparer au meilleur répond à la question. L'après ne revient que là où il apprend quelque chose,
  au meilleur.
- **Fond blanc sans cartes**, comme r6n2, la référence de densité de l'utilisateur.

## Captures (ouvertes)

`captures/` :
- d8-premier-ecran.png ;
- d8-390.png (page entière ; le dock fixe s'y superpose à mi-page, c'est un artefact de la capture longue) ;
- d8-toucher-390.png (45′, loupe chiffrée, « contre ★ actif 2 j », trop amer) ;
- d8-barres-390.png (12 barres ouvertes, emporté en contour, inconnus hachurés) ;
- d8-60-390.png, d8-absolu-390.png et d8-fiche-390.png, générées mais non ouvertes à cette passe.
