# Voie maquettes — Carnet plus compact, donnée au premier plan, qui gagne dans Comparer (sa plainte du 24.11 16:46)

- Agent : concepteur ; Modèle : opus ; Niveau : interface ; Plafond : 120 tours.
- Lis DOSSIER.md (même dossier) À LA PLACE des sources brutes. Charge le skill `maquettes` (méthode 16.11) et suis-le : chantier « carnet » (base : work/refonte-frontend/v4/choix/maquettes.json, clé carnet), 8 versions, mini maquettes statiques à 390 × 844 depuis SA base, contrôlées contre ses choix et les règles dures, jugées par toi comme le brasseur (PORTRAIT), corrigées une fois, puis une page de choix écrite à la main.
- Possède : work/missions/2026-11-24-carnet-personas/maquettes/.

## Économie
- Mécanique : aucune.
- Gestes : une maquette = un fichier HTML ; captures 390 de chaque version ouvertes avant verdict ; un script de rendu pour toutes.

## À faire
1. Axes de variantes (chacun tiré de ses mots ou d'une proposition des personas) : compacité du chrome (barres d'onglets et sous-onglets repliés en carnet ouvert, fil d'Ariane fondu, champ « Ajouter » réduit), part de la donnée ≥ 70 %, Comparer « qui gagne quoi » par ligne, classification et sous-catégories (domaine → sous-domaine, houblons par variété/forme/récolte), prix comparable (conditionnement ou prix au kilo dit comme tel, LIEN-PRIX-JUSTE), photo plus petite sur la fiche.
2. Page de choix : page.html (variantes côte à côte avec la version actuelle, la mesure de part de donnée sous chacune), vérifiée par node scripts/agents/verifier-page.mjs page.html --page-lot --captures cap/page → PAGE OK.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre) : ligne 1 « RESULTAT maquettes : N versions, page OK/KO, part de donnée min–max % ».
- Tests : sans objet (maquettes) ; contrôles du skill dans des fichiers.
- Ne touche aucun fichier de src/ ; rien n'est publié (le pilote publie l'artefact).
