OK — ra joué de zéro au doigt : COEUR OK, 50 étapes, embouteillage puis frigo, ventilation, évier

- Fichiers (tous dans `r3/c1`) : `proto.src.html` → `proto.html` (`build.mjs`), `web.js` (Web simulé, 15 pages « exemple »),
  `scenario.mjs` (jeu de zéro), `scenario.log`, `SCENARIO.md` (étapes et sélecteurs data-*), `gestes-ra.mjs` (21 gestes de ra
  rejoués), `capt.mjs` (copie de calendrier/p8, base du script), `captures/`.
- Sorties : `node r3/c1/scenario.mjs` → **COEUR OK (50 étapes, 48 captures)**, aucune erreur de page ; `node r3/c1/gestes-ra.mjs`
  → **GESTES OK** (rien de da ni de ra perdu en mode fixture).
- E14 lisible à 390 : largeur de page = 390, 0 nom ou valeur coupé, texte des tableaux ≥ 14 px, classé par oxygène puis par prix.
- Captures, ouvertes : `captures/planche-01.png` à `planche-12.png` (4 étapes par planche) ; une à une `captures/c1-E00-vide.png`
  … `c1-E21h-pourquoi.png`.
- Prédiction : « Là je pars de rien et j'arrive au pourquoi iso et au pourquoi du fournisseur, ok ; mais le paysage, c'est fait ? »

DÉCISION À PRENDRE : les retouches r2 non liées au scénario restent ouvertes (paysage à 3 rangées, « · choisi » au lieu de ✓) ;
le champ d'écho reste plafonné à 334 px clavier ouvert.
CONNAISSANCE : un scénario de zéro demande un Web simulé distinct de la fixture (pages par adresse, valeurs par nom de
caractéristique) ; sinon chaque lien collé recopie la fixture.
LEÇON PROPOSÉE : un clavier simulé forcé à l'ouverture (`kbForce`) doit tomber au premier `focusout`, sinon un toucher hors du
champ tombe sur l'écho et le jeu échoue en silence.
