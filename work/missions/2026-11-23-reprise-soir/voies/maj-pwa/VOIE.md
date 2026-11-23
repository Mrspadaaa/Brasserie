# Voie maj-pwa — la nouvelle version arrive vite, sans perdre une saisie

- Agent : auteur ; Modèle : sonnet ; Niveau : jugement ; Plafond : 80 tours. Copie : C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie.
- Lis ../../COMMUN.md, puis DOSSIER.md (même dossier) À LA PLACE des sources brutes.

## Économie
- Mécanique : aucune — la preuve se fait en ligne par le pilote (deux mises en ligne de suite, chrono du passage à la nouvelle version).
- Gestes : lectures par grep ciblé ; un script par lot.

## À faire
1. Diagnostiquer pourquoi un onglet ouvert garde l'ancien paquet longtemps (vérifier sw.js et index.html servis, cycle de vie du service worker, quand `updateSW` est appelé).
2. Méthode standard (Workbox / vite-plugin-pwa) : vérifier une mise à jour au retour au premier plan et à intervalle court ; appliquer la nouvelle version dès que l'app est au repos (aucune saisie ouverte, aucune lecture IA en cours), sinon un avis discret qui l'applique au toucher. Jamais de rechargement pendant une saisie ni une lecture de lien.
3. Écrire « ## État de l'art » dans ton RESULTAT.md (problème type, examiné, décision).
4. Test de la règle « au repos ? » (unitaire), rouge puis vert.

## Critères
- `npx tsc --noEmit -p .` : aucune erreur neuve (2 connues) ; tests touchés verts. Commit par chemins ; fin : « PRÊT À METTRE EN LIGNE <hash> ».

OWNS : vite.config.ts (section PWA) ; src/services/enregistrerPwa.ts ; src/services/miseAJour.ts ; src/services/precacheHorsLigne.ts ; firebase.json (en-têtes de sw.js seulement) ; tests/unit/ (fichiers de mise à jour que tu crées) ; ton dossier de voie.

## Tenue
- RESULTAT.md tenu au fil (une limite de tours ne doit rien perdre).
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/maj-pwa/tests.log 2>&1; tail -5 voies/maj-pwa/tests.log`.
- Pas de captures locales : la preuve est faite en ligne par le pilote.
