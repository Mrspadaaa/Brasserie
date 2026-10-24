# Voie i0-etat — État des lieux mesuré avant l'intégration

- Mission : 2026-10-25-integration-houblons
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 100 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Écrire `work/missions/2026-10-25-integration-houblons/ETAT-DES-LIEUX.md` : ce qu'il faut pour faire entrer l'outil houblons
de la maquette jouable dans l'app, mesuré et classé, avec un découpage en tâches. Le conseil s'en servira pour trancher
l'architecture (calcul, données, navigation, coexistence avec V5.5). Ce document informe : il ne tranche rien.

## Entrées
- `prototypes/houblons-v4/parcours/ARCHITECTURE.md` — la carte fichier par fichier de la maquette vers l'app (voie p8).
- `prototypes/houblons-v4/parcours/src/` — la maquette : `moteur/`, `etat/`, `coquille/`, `integration/`, `commun/`, `ecrans/`.
- `prototypes/houblons-v4/src/engine/` — le moteur v4.
- `src/ui/hopIndex/`, `src/domain/hopIndex/`, `src/pages/useFullScreenRoute.ts`, `src/App.tsx`, `src/services/firestoreRepo.ts`,
  le schéma Dexie de l'app, les données houblons de `src/data/` — l'app.
- `gh issue view 143 --repo Mrspadaaa/Brasserie` (écarts B1 à B9, cases cochées) ; `gh issue view 121` (poids et lenteurs
  mesurés le 17.10) ; `gh issue view 120` (données de production : lecture seule, jamais d'accès aux données réelles).
- `work/missions/2026-10-23-theme-performance/voies/t2-performance/RESULTAT.md` et
  `work/refonte-frontend/v4/tournoi/outils/mesure-performance.mjs` — mesures de la maquette et leur contrôle.
- `cerveau/metier/cout-calcul-moteur.md` — coût mesuré de `simulerCas` (L20).
- `work/refonte-frontend/v4/choix/ecrans.json` — ses choix, écran par écran (règle n° 1).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-10-25-integration-houblons/ETAT-DES-LIEUX.md`
- `work/missions/2026-10-25-integration-houblons/voies/i0-etat/RESULTAT.md`
Les scripts et journaux de travail vont dans `os.tmpdir()`. Rien dans `src/`, `functions/`, `prototypes/` ni à la racine.

## Consignes
Le document a ces sections, dans cet ordre :
1. `## Classement` : chaque pièce de la maquette (moteur v4, état, coquille et navigation, conversion de recette, crochet de
   test, composants communs, chaque écran) et de l'app (atelier V5.5, `src/ui/hopIndex`, `src/domain/hopIndex`, données
   embarquées, écoutes Firestore) : fini, inachevé récupérable (avec le manque précis) ou inutilisable. Une ligne par pièce,
   avec le chemin.
2. `## Écarts de #143` : B1 à B9, l'état vérifié dans le code aujourd'hui (fermé, ouvert, partiel), avec la preuve.
3. `## Mesures` : poids du build de l'app (`npm run build` : les plus gros fichiers JS, bruts et gzip) ; poids de la maquette
   construite ; temps du moteur (léger, complet, classement de tout le catalogue, substituts) mesurés par un script dans
   `os.tmpdir()`, avec les unités. Chaque chiffre a sa commande.
4. `## Beaucoup de données` : les volumes d'aujourd'hui (houblons au catalogue, stock, recettes, brassins, levures : comptés
   dans les données embarquées et les fixtures), ce qui grandira, et le coût mesuré quand le catalogue passe à ×5 et ×10
   (classement de Suggérer, substituts, Comparer). Ce qui croît en O(n²) ou se recalcule à chaque geste est nommé.
5. `## Risques` : ce qui peut casser le hors ligne, les données, ses choix ou la fluidité, chacun avec sa preuve.
6. `## Découpage proposé` : les tâches, de 8 à 20, dans l'ordre (fondations d'abord), chacune avec : but, fichiers, dépendances,
   critère vérifiable (commande ou parcours Chrome) et budget de fluidité s'il y en a un. Ce sont des propositions.

Mesurer avant d'affirmer (L20) ; « non mesuré » plutôt qu'un chiffre deviné. Lire le code utile, pas tout le dépôt.
`npm run build` est permis (local) ; aucun déploiement, aucune donnée réelle, Gemini jamais.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Règle n° 1 : ses maquettes choisies sont la base des écrans ; l'intégration ne les simplifie pas.
- Fini veut dire utilisable : branché, atteint par un vrai parcours dans Chrome, typé, testé, build vert (L11).
- L'inconnu n'est jamais 0 ; hors ligne et données préservés ; rien de supprimé sans accord.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent. Réponse finale au pilote : une ligne.
