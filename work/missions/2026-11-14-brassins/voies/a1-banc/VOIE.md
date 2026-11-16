# Voie a1 — Banc local des brassins, captures et trous fonctionnels

- Mission : 2026-11-14-brassins
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Monter un banc local reproductible (fixtures fictives) de la liste des brassins, de la fiche d'un brassin et du suivi de
fermentation, en tirer les captures, et écrire l'inventaire fonctionnel : ce qui existe, ce qui manque pour suivre une fermentation.

## Entrées
- `.claude/skills/webapp-testing/SKILL.md` — puppeteer-core, `scripts/with_server.mjs` (port 3100, jamais 3000).
- `cerveau/agents/verification-locale.md` — `?dev-local`, fixtures par `import('/src/services/firestoreRepo.ts')` puis `FirestoreRepo.put` (cache mémoire).
- `src/components/tabs/ProductionTab.tsx`, `src/ui/production/` (liste, `BatchGravityEntry.tsx`, `BatchPackagingForm.tsx`,
  `BatchOutcomeAnalysis.tsx`, `BatchSchedule.tsx`), `src/ui/BatchDetailSheet.tsx`, `src/ui/Fermentation*.tsx`, types des brassins.
- Raccord : la fin du jour de brassage (`src/pages/BrewDayPage.tsx`, lecture seule) : comment un brassin passe en fermentation.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/a1-banc/` (script `banc.mjs`, `fixtures.json`, `captures/`, `TROUS.md`, `RESULTAT.md`, `tests.txt`).
Aucune écriture dans `src/`. Fichiers temporaires : `os.tmpdir()`.

## Consignes
- Fixtures fictives, préfixe « ZZ » dans les noms (jamais ses brassins réels, aucune connexion Firestore réelle), au moins
  4 brassins : planifié (date dépassée) ; en fermentation J+5 (OG 1,062, 3 relevés de densité et de température, dry hop prévu J+6) ;
  en garde ou conditionné (fût et bouteilles) ; clos (FG, ABV, notes). Plus la liste vide.
- Captures : `captures/<ecran>-<etat>-<390|1280>-<clair|cave>.png`, 390 en tactile (redimensionner PUIS recharger : `useCoarsePointer`
  est lu au montage) et 1280. Écrans : liste (vide, remplie), fiche de chaque brassin, chaque feuille de saisie de fermentation
  ouverte (densité, température, dry hop, conditionnement, clôture) et l'état après un geste (relevé ajouté). Trouver comment
  passer en thème « cave » (sombre) dans l'app. Ouvrir chaque capture (Read) avant de la compter.
- `TROUS.md`, trois sections. `## Existe` : chaque fonction de suivi (densité, température, dry hop, transfert, mise en fût ou
  bouteille, clôture, ABV et atténuation, graphe, historique, rappel) avec fichier:ligne, et si un vrai parcours l'atteint.
  `## Manque` : ce qu'un brasseur ne peut pas faire pour suivre une fermentation (en brasseur, une ligne chacun, priorité 1 à 3).
  `## Raccord jour de brassage` : ce que la fin du jour écrit sur le brassin et ce que la fiche en montre.
- Pas de jugement visuel détaillé : le critique a2 le fera sur tes captures. Note seulement les gestes sans effet et les erreurs console.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Inconnu ≠ 0 (« — » seul) ; peu de texte au premier plan ; penser en brasseur ; saisie au curseur sur téléphone (ses mots 10.11).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments), avec la commande exacte qui rejoue le banc.
- Pas de test Vitest à écrire. La ligne « Tests » écrite dans un fichier : la sortie du banc dans `tests.txt`, et les tests
  existants des brassins rejoués pour l'état de départ : `npx vitest run tests/integration/batch* --reporter=dot > work/missions/2026-11-14-brassins/voies/a1-banc/tests-base.txt` (rouges dits, pas laissés).
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.
