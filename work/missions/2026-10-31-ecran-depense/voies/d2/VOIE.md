# Voie d2 — diagnostic : Drive, lenteur, onglets Entrées, Prévision et Tout

- Mission : 2026-10-31-ecran-depense
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 100 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Un diagnostic prouvé : le justificatif arrive-t-il vraiment dans son Drive, où partent les 10 à 20 s d'une lecture au téléphone, et ce qui
ne va pas dans les onglets Entrées, Prévision et Tout.

## Entrées
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, dernière ligne (« L'écran Nouvelle dépense ») : ses mots.
- `work/missions/2026-10-31-ecran-depense/brasseur/` : sa facture et ses trois captures.
- Drive : `src/services/driveFileStore.ts`, `src/ui/finance/DriveConnection.tsx`, `src/ui/finance/DocumentProofLink.tsx`, et ce qui les
  appelle depuis `src/ui/finance/ExpenseSheet.tsx` ; `tests/unit/driveAuthorizationCore.test.ts`, `drivePersistentAuth.test.ts` ;
  `docs/finances.md` § Conservation des factures ; `docs/qa/mobile-depenses-drive-2026-09-09.md`.
- Lenteur : le chemin client de l'envoi (lecture du fichier, réduction, encodage, appel) depuis `ExpenseSheet.tsx` ;
  `functions/src/invoiceScanCore.ts`, `invoiceVisionReview.ts`, `invoiceScanBudget.ts`, `ai.ts` ; `docs/gemini-budget.md`.
  Si le pilote les a lus, les journaux de la fonction en ligne sont dans `diagnostic/d2/journaux-fonction.txt` (lecture seule).
- Onglets : le composant qui porte « Entrées », « Prévision » et « Tout » (le trouver depuis `src/ui/finance/`, par exemple
  `FinanceOverview.tsx`, `TransactionJournal.tsx`, `FinanceForecastSummary.tsx`) et leurs tests (`tests/unit/finance*.test.ts`).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-10-31-ecran-depense/diagnostic/d2/` (sauf `journaux-fonction.txt`, écrit par le pilote)

## Consignes
Lire et mesurer, ne rien corriger dans `src/` ni `functions/`. Aucun appel Gemini réel, aucune écriture sur les données réelles ni dans
son Drive, aucun serveur dans `C:/Users/mrspa/Documents/Brasserie`, aucune installation. Tests : `npx vitest run <fichier> --maxWorkers=2`.

Répondre, chacune avec sa preuve (fichier:ligne, test rejoué, mesure) :
1. **Le Drive** : quand et par quel chemin le justificatif part (client ou fonction, jeton, dossier, nom) ; ce qui se passe quand
   l'envoi échoue (jeton expiré, hors ligne, fenêtre bloquée au téléphone) : erreur montrée ou avalée ? reprise ? ; ce que l'écran dit
   (« Voir le justificatif ») et sur quoi il se fonde ; ce qui est stocké sur la dépense. Verdict : dans quels cas le fichier n'arrive pas,
   et comment le prouver à l'écran.
2. **La lenteur** : la chronologie d'une lecture, étape par étape, du toucher jusqu'aux champs remplis : réduction et poids de l'image,
   envoi, démarrage à froid, lectures du budget, appel(s) Gemini (modèle, réflexion, résolution, une seconde relecture visuelle en série ?),
   traitement après, rapprochement du stock. Mesurer ce qui se mesure en local (réduire et encoder `brasseur/facture-br-372765.jpg` : temps
   et octets) ; estimer le reste depuis le code et, s'ils existent, les journaux. Pour chaque coupe proposée, le gain attendu en secondes.
3. **Entrées, Prévision et Tout** : ce que montre chaque onglet, d'où viennent ses nombres, et chaque défaut prouvé (total faux, ligne
   manquante, libellé flou, état vide, logique de prévision). Pas de refonte : les défauts et leur cause.

Livrable : `diagnostic/d2/DIAGNOSTIC.md` : un tableau des défauts (id, gravité : donnée fausse, donnée perdue, justificatif perdu, lenteur,
interface ; preuve ; état : fini, inachevé récupérable avec son manque précis, inutilisable ; correction proposée ; le test qui échouera
avant la correction), puis les réponses 1 à 3 et la chronologie chiffrée.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Un chiffre n'est jamais inventé : une estimation se dit « estimé », avec sa base.
- Gemini jamais dans un test unitaire ni dans `npm test` : toujours simulé.
- Fini veut dire branché et atteint par un vrai parcours (L11).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent. Réponse finale au pilote : une ligne.
