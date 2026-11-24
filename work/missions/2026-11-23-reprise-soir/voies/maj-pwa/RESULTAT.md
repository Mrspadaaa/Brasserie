OK — onglet ouvert cherche la version chaque minute ; rechargement seulement au repos (champ, feuille, lecture IA)

PRÊT À METTRE EN LIGNE 616b3aadd

## Diagnostic (servi en ligne, mesuré)
- `sw.js`, `brew-alerts-sw.js` : `Cache-Control: no-cache, max-age=0` ; `index.html` : `no-cache, no-store, must-revalidate`. Le sw.js servi contient `clientsClaim` et `SKIP_WAITING` (prompt). firebase.json et vite.config.ts : corrects, rien à changer.
- Cause trouvée : `VERIFICATION_MS = 30 min`. Un onglet resté ouvert (téléphone posé écran allumé, onglet de test piloté par Chrome) ne reçoit ni `visibilitychange` ni `pageshow` : seule la minuterie lui fait chercher la version, donc jusqu'à 30 min d'ancien paquet. S'y ajoutent ~24 Mo de précache à la première installation (non raccourcissable sans retirer le hors ligne).
- Lacune de la règle « au repos » : une lecture IA ou de lien en vol n'était pas vue (`interfaceOccupee` ne regarde que le DOM) ; une version prête pouvait recharger la page en pleine lecture.

## Changement (src/services/miseAJour.ts)
- `VERIFICATION_MS` 30 min → 60 s (visible seulement ; une requête conditionnelle de sw.js par minute ; `INTERVALLE_MIN_MS` 15 s garde-fou inchangé). Déclencheurs au lancement, retour au premier plan, pageshow, retour réseau : inchangés.
- `estAuRepos(doc, enCours)` : `!interfaceOccupee && enCours === 0`. Remplace `occupe` dans `demarrerMiseAJour`.
- Appels serveur suivis : `suivreAppelsServeur` enveloppe `window.fetch` ; seuls `*.cloudfunctions.net` et `*.run.app` comptent (callables IA et lecture de lien), jusqu'à la réponse ou l'échec. Firestore et fichiers de l'app exclus. `marquerTravail()` pour déclarer un travail à la main.
- Inchangé et conservé : version prête + occupé → bandeau « Nouvelle version · Recharger » (applique au toucher), application automatique à la fermeture ; garde anti-boucle 15 s ; `prendreVersionEnAttente` au démarrage.

## État de l'art
- Problème type : mise à jour d'une PWA à service worker (cycle installing → waiting → activated) sans perdre l'état de la page.
- Examiné : Workbox / vite-plugin-pwa `registerType: 'autoUpdate'` (skipWaiting + clientsClaim : recharge à l'activation, coupe une saisie ; rejeté) ; `registerType: 'prompt'` + `registration.update()` périodique + `updateSW(true)` (recommandé par la doc vite-plugin-pwa « Periodic SW updates » et « Prompt for new content ») ; sondage manuel du fichier de version (réinvente update(), rejeté).
- Décision : garder `prompt` + `registration.update()` (retour au premier plan, minuterie courte, réseau) ; `updateSW(true)` seulement quand l'app est au repos ; sinon bandeau au toucher. Aucun algorithme écrit à la main hors la règle métier « au repos ».

## Critères
- `npx vitest run tests/unit/miseAJourRepos.test.ts tests/integration/miseAJour.test.ts tests/integration/lot8-miseAJour.test.ts` : rouge d'abord (8/8 échecs, `tests-rouge.log`), puis vert 3 fichiers, 25 tests (`tests.log`).
- `npx tsc --noEmit -p .` : 2 erreurs, les 2 connues (`seedData.ts` GanttTask ; `virtual:pwa-register`, module du plugin au build). Aucune neuve (`tsc.log`).
- Essais : 1 par critère.

## Fichiers
- src/services/miseAJour.ts (modifié) ; tests/unit/miseAJourRepos.test.ts (neuf) ; ce dossier (tests-rouge.log, tests.log, tsc.log).

## Doutes et limites
- Preuve en ligne à faire par le pilote : deux mises en ligne de suite, un onglet ouvert sans y toucher doit passer à la nouvelle version en ~1 à 2 min (60 s de minuterie + installation) ; un onglet avec un champ ou une feuille ouverte montre le bandeau.
- Le suivi de `fetch` couvre les callables ; un appel IA lancé avant `demarrerMiseAJour` (enregistrement au repos, ~4 s après le chargement) n'est pas compté ; sans conséquence, car aucune version n'est prête à ce stade.
- Un appel serveur qui ne répond jamais bloque le rechargement automatique jusqu'au délai du callable ; le bandeau reste proposé.
- Hors OWNS, non fait : brancher les écrans qui voudraient déclarer un travail long avec `marquerTravail()`.

DÉCISION À PRENDRE : aucune
CONNAISSANCE : un onglet resté ouvert n'a que la minuterie pour trouver la version ; visibilitychange ne suffit pas.
LEÇON PROPOSÉE : aucune

## Commit
PRÊT À METTRE EN LIGNE 616b3aadd
