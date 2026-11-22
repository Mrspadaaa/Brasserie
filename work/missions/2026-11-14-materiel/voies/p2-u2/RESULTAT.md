OK — uq3 et uq4 en passe 2 : défauts, greffes, six états, deux thèmes, 1280 (une capture à rouvrir)

## Fichiers
- `v1/u/uq3/etat.html` et `v1/u/uq3/NOTE.md` (« ## Passe 2 »), `v1/u/uq4/etat.html` et `v1/u/uq4/NOTE.md` (« ## Passe 2 »).
- 14 captures : `v1/u/uq3/uq3-{repos,geste,traiter,ajout,vide,repos-cave}-390.png`, `uq3-repos-1280.png`, et les mêmes pour uq4.
- Outils : `voies/p2-u2/verif.mjs` (mots, texte < 12 px, tronqués, hors cadre, cibles « fait »), `voies/p2-u2/planche.mjs`.
- Planches : `voies/p2-u2/planche-uq3.png`, `voies/p2-u2/planche-uq4.png`.

## Critères
- G1 : les 14 images et les deux NOTE avec « ## Passe 2 » sont écrites. Le CHECK n'a pas pu être rejoué : le hook a coupé
  l'agent à 200 k. Au pilote de le lancer (PASSE OK attendu).
- `node socle/capt.mjs v1/u repos,geste,traiter,ajout,vide,repos-1280 uq3`, puis la même commande pour `uq4` → CAPTURES OK.
- `node voies/p2-u2/verif.mjs uq3 uq4` : au repos, 60 mots pour uq3 (plafond tenu) et 49 pour uq4. Dans les 12 états :
  aucun texte sous 12 px, aucun nom tronqué, rien hors cadre. Le ✓ « fait » mesure 44 × 44 px.
- Captures ouvertes : les planches à 390 (clair, cave, geste, traiter, ajout, vide) des deux variantes, et uq3 à 1280.
  uq4 à 1280 a été ouverte avant sa dernière retouche (frise des échéances ajoutée, notes masquées, pied de fiche
  dégagé) : elle reste à rouvrir.
- `git status` n'a pas été rejoué (coupé par le hook) ; les écritures sont restées dans OWNS.

## Prédiction
uq3 : « là je vois tout de suite que je ne peux pas brasser à cause de la pompe » ; uq4 : plus jolie, mais moins utile.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : une maquette dont le HTML est bâti par chaînes JS casse en silence si un remplacement scripté y injecte
une apostrophe droite (deux SyntaxError ici, pages vides). Utiliser l'apostrophe typographique et vérifier `pageerror`
(fait dans verif.mjs).

## REPRISE (coupé à 200 k par le hook)
Reste au pilote ou à un exécutant Haiku :
1. Lancer le CHECK G1 de GATES.md (PASSE OK attendu).
2. Ouvrir `v1/u/uq4/uq4-repos-1280.png` : la frise « Prochaines échéances » ne doit rien chevaucher, et le pied de la
   fiche (Payer un entretien, Enregistrer) doit être visible au-dessus de la barre du bas.
3. `git status --short work/missions/2026-11-14-materiel` : rien hors de OWNS.

Tests : sans objet
