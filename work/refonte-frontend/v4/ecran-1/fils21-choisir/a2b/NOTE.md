a2b · Ce que la levure en fait, en trois colonnes. C'est la relance d'a2 demandée par le critique (SYNTHESE §2, critique/a.md) ; a2 reste intacte.

- **Ce qui tient** :
  - La réponse d'a2, sans le flux de type Sankey. Pour chaque famille, trois colonnes de barres sur une même échelle : **la cuve apporte**, **la levure ajoute**, **le CO₂ emporte**, en crans du style (en points sur 100 avec « Absolu »). Une ligne « en tout » en bas.
  - La réponse en une ligne, en tête, par exemple « La cuve apporte ~+16,9 crans, Pomona ajoute ~+1,6, le CO₂ emporte ~−1,9 ». La même échelle rend la leçon visible : la barre de la levure est minuscule à côté de celle de la cuve.
  - Départ du critique : dry hop **actif** avec **US-05**, « US-05 n'ajoute rien ». Les quatre levures sont simulées dans les cas K4, donc aucun bouton n'est barré. Le premier toucher sur une levure fait bouger la colonne du milieu : Pomona, +0,6 cran d'agrumes.
  - « Après » à un toucher : « ni levure ni CO₂ : tout vient de la cuve ».
  - Le geste est au premier écran : les quatre levures en pastilles de 34 px de haut, puis actif / après.
  - Le fait réel de la levure choisie, en une ligne (« Pomona : géraniol→citronellol, medium », fiche du fournisseur).
  - Les houblons avec α, usage, stock, dose et jours.
  - « Au style 16D » : les barres de l5b sous les colonnes. Le résineux de ta dégustation n'est dit qu'une fois, hors de la figure.
  - Les familles faibles sont repliées (« Herbacé, Terreux ≈0 »), Pépins est dit « rien de simulé ».
  - **Les données restent, l'explication part** : conventions et vraies valeurs sont sous « D'où ça vient » (CO₂ : moitié des hydrocarbures ; Pomona 50 % ; Verdant et Diamond 0,1 % ; géraniol dans l'huile ; précurseurs ; E01 ; H68 ; aucune mesure croisée).
  - **Les quatre leçons du critique**, chiffrées, sous « Quatre leçons de brasseur » :
    1. Doubler la dose ne double pas l'arôme : de 2 à 3,86 g/L, ×1,5, mesuré (E04, lecture H).
    2. La levure pèse peu, le CO₂ emporte plus : Pomona ~+1,6 crans, CO₂ ~−1,9 crans (K4).
    3. À la suite : plus tard, pas plus : tropical ~39 contre ~39 à la fin (K3, K5).
    4. Cascade n'égale pas Citra : à 8 g/L, agrumes ~32 contre ~36 pour Citra à 4 g/L, tropical ~28 contre ~39 (grille, après, 3 j). La grille s'arrête à 8 g/L, donc pas de dose d'équivalence ; y3 extrapole ~10,7 g/L.
  - Profil : `profils-simules.json` régénéré à 4,75 % vol. (ancre `abv` 4,75).
- **Ce qui casse** :
  - La paire est figée à Citra puis Idaho 7 (seuls cas K4 à quatre levures) ; « ensemble » n'est pas proposé, parce que Diamond n'y est pas simulé.
  - Diamond donne les mêmes chiffres que Verdant : c'est la convention du moteur, et son fait réel (Samia) est écrit à côté.
  - Le CO₂ est une convention du moteur, dite sous « D'où ça vient » et non sur la figure.
  - Des familles affichent « 0 » en CO₂ quand la perte simulée est sous 0,05 cran : c'est un vrai zéro arrondi, pas un inconnu.
- **Contrôles** (20.10, ~1 h 30, sur etat.html) :
  - `controle-commun --sans=mots` : COMMUN OK (mots sautés ; couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende et parlant OK).
  - `mots-premier-ecran --sans-donnees --max=70` : a2b 64 mots (hors données), MOTS OK.
  - LISIBLE OK : 25 pictos, 8 mesurées, 43 simulées, 0 faute.
  - SIMULATION OK ; CUMUL OK (1 ajout cumulé, 4 choix de levure, biotransformation visible, la levure fait bouger le simulé) ; ALPHA OK (2 voies, 2 avec leur α) ; FICHE-BASELINE OK (fiche de Citra, 0 faute).
  - `a1/controle-a.mjs a2b` : HONNETE OK, DOIGT OK.
  - Preuve du geste, `a2b/jouer-a2b.mjs` → `a2b/geste-a2b.json` : GESTE OK. Le premier toucher sur Pomona change la colonne levure sur 7 familles, et le geste est au premier écran (cible de 89 × 34 px).
- **Pire contraste** : 4,96:1, « Agrumes » (#856e0c sur blanc).
- **Captures** : `captures/a2b-repos-390.png`, `a2b-pomona-390.png`, `a2b-apres-390.png` (les trois états du geste), `a2b-390.png` (page), `a2b-plis-390.png` (plis ouverts). Toutes regardées.
- **Générée par** `a2b/generer-a2b.mjs` (socle `../a1/`).
