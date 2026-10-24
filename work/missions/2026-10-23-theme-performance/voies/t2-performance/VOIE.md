# Voie t2-performance — Mesurer la maquette comme sur un téléphone

- Mission : 2026-10-23-theme-performance (lire `../../MISSION.md` d'abord)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote (option prudente, écrite dans RESULTAT.md ; aucune question bloquante)

## Objectif
Un contrôle réutilisable, `mesure-performance.mjs`, qui mesure une page construite comme sur un téléphone moyen (processeur
×4) et bas de gamme (×6). Il a ses témoins, il est joué sur la maquette jouable, et il classe les optimisations par gain
mesuré, pour la voie p8-portabilite. L'utilisateur, le 23.10 : « Aussi regarder pour les optimisation, latence ect.. ».

## Entrées
- `work/missions/2026-10-23-maquette-parcours/voies/p7-implementation/RESULTAT.md`, § Performance : ce qui est mesuré et
  ce qui ne l'est pas (premier passage à froid, mémoire, téléphone ; 1,47 Mo de JS dont ~600 Ko de JSON ; `suggerer`
  sur 318 variétés ; frise de 28 crans).
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md`, « Moteur en direct » et « Contrat d'un écran »
  (`window.__parcours.mesures()`, `medianeRecalcul`, ponts `data-role="pont-…"`, frise `[data-role="frise"]`).
- `prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs` : comment envoyer un vrai geste de doigt. À imiter, pas à
  importer.
- Les pages construites `prototypes/houblons-v4/maquettes/parcours/<route>/etat.html` et `assets/`. Lecture seule : ce
  dossier appartient à une autre session. Ne pas reconstruire.
- `cerveau/metier/cout-calcul-moteur.md` et la leçon L20 : le cache trompe ; mesurer aussi une entrée qui change et le
  premier passage à froid.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/tournoi/outils/mesure-performance.mjs`
- `work/refonte-frontend/v4/tournoi/outils/temoins/perf-*/` (pages témoins `etat.html`)
- `work/missions/2026-10-23-theme-performance/voies/t2-performance/` (RESULTAT.md, NOTE.md)
- Fichiers de travail : `os.tmpdir()`, jamais à la racine du dépôt (L17).

## Consignes
1. **Appel** : `node mesure-performance.mjs <dossier> <id…> --page=etat.html [--cpu=4]`, avec puppeteer-core et Chrome
   comme les autres contrôles, au format téléphone (390 × 844, échelle 2, toucher), et une émulation du processeur
   (`emulateCPUThrottling`).
2. **Mesures par page** :
   - chargement à froid jusqu'au premier écran utilisable (`[data-ecran]` visible, réponse à un toucher possible) ;
   - temps d'évaluation du script et longues tâches (`longtask`) ;
   - latence d'un toucher : du toucher sur un pont `[data-role^="pont-"]` au premier rendu de l'écran suivant ;
   - fluidité d'un glisser sur la frise ou la poignée : durée des images en médiane et au 95e centile ;
   - recalculs du moteur, lus dans `window.__parcours.mesures()`, avec une entrée qui change à chaque fois (L20) ;
   - mémoire du tas JS.

   Le poids du script et de la feuille de style se mesure brut et compressé (gzip et brotli).
3. **Sortie** :
   - par page, une ligne `<id> · chargement … ms · toucher … ms · glisser p50 … / p95 … ms · …` ;
   - à la fin, `PERF OK` ou `PERF ECHEC` suivi des dépassements ;
   - chaque ligne de dépassement commence par `chargement`, `toucher` ou `glisser` ;
   - budgets de MISSION.md à ×4 (réponse ≤ 100 ms ; glisser ≤ 16 ms en médiane, ≤ 33 ms au 95e centile ; écran
     utilisable ≤ 2,5 s) ;
   - ×6 est mesuré et rapporté sans budget.

   Une page où rien n'est mesuré est un échec, jamais un OK.
4. **Témoins** : `perf-rapide` (passe) et `perf-lent`, dont le toucher bloque le fil 300 ms (échoue par `toucher`).
5. **Jouer la maquette** : `node scripts/agents/systeme.mjs verdict -- node
   work/refonte-frontend/v4/tournoi/outils/mesure-performance.mjs prototypes/houblons-v4/maquettes/parcours ma-biere
   suggerer comparer dryhopper --page=etat.html`, à ×4 puis à ×6 (`--cpu=6`). Aucune écriture dans la maquette.
6. **RESULTAT.md**
   - `## Mesures` : la table par écran, à ×4 et à ×6.
   - `## Optimisations` : classées par gain estimé à partir des mesures, avec leur coût. Par exemple : charger le JSON
     du moteur à la demande, découper le script par route, sortir `suggerer` et la frise dans un Web Worker, mémoïser,
     alléger la première peinture.
   - Écrire ce qui ne se mesure pas ici : un vrai téléphone, le réseau, la batterie.

## Exigences transversales (recopiées, leçons L13, L20)
- Un contrôle nouveau échoue d'abord sur son témoin (L13).
- Le cache masque le coût d'une entrée répétée : mesurer à froid et avec une entrée qui change (L20).
- Pas d'« OK 0/0 » ; pas de caractère de contrôle dans le script (M10) ; aucun `String.replace` avec `$` (L26).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent. Réponse finale au pilote : une ligne.
