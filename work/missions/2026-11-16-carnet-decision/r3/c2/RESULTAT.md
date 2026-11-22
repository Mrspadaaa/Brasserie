OK — c2 : scénario de zéro rejoué, pièges E16 et E19 corrigés, COEUR OK

- Fichiers (tous dans `r3/c2`) : `proto.src.html` → `proto.html` (`build.mjs`), `scenario.mjs`, `scenario.log`, `SCENARIO.md`
  (étapes, gestes, sélecteurs data-*), `gestes-ra.mjs` (gestes de ra + « Garder sans pourquoi refusé »), `capt.mjs`, `web.js`
  (copies de c1), `captures/` (57 captures `c2-E*.png`, 15 planches).
- Sorties : `node r3/c2/scenario.mjs` → **COEUR OK (50 étapes, 57 captures)**, aucune erreur de page ;
  `node r3/c2/gestes-ra.mjs` → **GESTES OK** (rien de da ni de ra perdu).
- Défauts du dernier jeu, chacun échoue sur c1 et passe sur c2 (assertions de `scenario.mjs`) :
  - E16 : champ vide au départ ; « Garder ce choix » à vide refusé et dit sous le champ ; proposition touchée = écrite, puce ✓ ;
    carnet « Pourquoi : oxygène capté le plus bas » ; 0 « sans pourquoi », 0 « sans raison notée » (5 écartés, raison gardée).
  - Fournisseur : propositions en sa faveur seulement (SAV et pièces en Suisse ; vos notes « demander une démo au revendeur
    romand ») ; le jumeau DE moins cher devient une ligne « À savoir … 900 CHF de moins qu'ici ».
  - E19 : « frigo vitrine pro, plus simple à poser » → façon Frigo vitrine pro seule, aucun Évier ; critère et décision ne
    citent que Chambre froide et Vitrine.
  - Doublon « bruit » refusé, dit, puce existante cerclée, une seule ligne Bruit. Disponibilité capturée (E19f2, E20f2, E21f2).
- Captures ouvertes : `captures/c2-E16a-choisir.png`, `c2-E16b-manque.png`, `c2-E16c-pourquoi.png`, `c2-E16d-ecartes.png`,
  `c2-E17c-ecartes.png`, `c2-E19b-facons.png`, `c2-E19c-retenue.png`, `c2-E19d2-doublon.png`, `c2-E19f2-dispo.png`.
- Prédiction : « Là, ce que je touche reste, et le frigo ne parle plus d'évier ; ok. »

DÉCISION À PRENDRE : raisons d'écart gardées d'office (faits lus dans ses tableaux, toucher pour enlever) au lieu de « un toucher
la garde » de ra ; à confirmer au jeu. Restent ouverts de c1 : paysage à 3 rangées, « · choisi » au lieu de ✓.
Mineur vu : le toast « IA (exemple) : 3 valeurs trouvées » recouvre une ligne d'en-tête de Comparer (E19d2), hérité de ra.
CONNAISSANCE : une proposition qui pré-remplit un champ et qu'un toucher retire est un piège ; une proposition s'écrit au toucher.
LEÇON PROPOSÉE : aucune
