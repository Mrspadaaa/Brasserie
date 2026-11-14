# Voie r1 — Correctifs du test d'écran : Synthèse et Annuel

- Mission : 2026-11-14-finances
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 120 tours ; 3 essais par critère
- Dépend de : y1, a1 (commités)
- Décideur en cas de doute : pilote

## Objectif
Corriger, sur Synthèse et Annuel, les problèmes 1, 2, 3, 7, 8, 9, 10 et 12 du test d'écran (`work/missions/2026-11-14-finances/critique/TEST-ECRAN.md`, captures dans `critique/test-ecran/`), pour que l'écran reste sa maquette choisie (g3a, g6) et que chaque chiffre dise la même chose partout.

## Entrées
- `work/missions/2026-11-14-finances/critique/TEST-ECRAN.md` — liste numérotée ; lire 1, 2, 3, 7, 8, 9, 10, 12 et leurs captures.
- `work/missions/2026-11-14-finances/voies/a1/RESULTAT.md`, `voies/y1/DIAG-ANNUEL.md` — la règle « à classer » posée par a1 (UI seule ; `src/domain/finance/annual.ts` est juste, on n'y touche pas).
- `work/missions/2026-11-14-finances/ref/g6/` (g6-page, g6-4-materiel, g6-3-inventaires, NOTE), `ref/g3a/` (g3a-page, NOTE : annexe octobre).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/finance/synthese`, `src/ui/finance/synthese.css`, `src/ui/finance/FinanceOverview.tsx`
- `src/ui/finance/annuel`, `src/ui/finance/TaxWorkspace.tsx`, `src/ui/finance/TaxClosingSheet.tsx`, `src/ui/finance/tax.css`
- `src/ui/finance/TransactionDetails.tsx`
- `tests/unit/annuelPiecesAClasser.test.ts`
- `work/missions/2026-11-14-finances/voies/r1`

## Consignes (un point = un correctif)
- **1** : « Matériel 5 500,00 à part » de la Synthèse ouvre Opérations sur ce qu'Opérations range sous « Matériel · à part » (rénovation comprise) : jamais « Aucune opération ». Corrige côté lien (le filtre que passe la Synthèse). Si seul `TransactionJournal.tsx` peut le faire, ne le touche pas (la voie f1 le tient) : écris le correctif exact dans RESULTAT.md, section « POUR f1 ».
- **2 et 8** : une pièce « à classer » se dit pareil partout dans l'Annuel : tête, colonne, Mois par mois, étape 8 (impôts). Le « Dépensé + usure » écrit en tête égale ce que la colonne dessine en ferme, et la part « à classer » est écrite à part à côté (hachurée, comme dessinée). Le résultat reste dans le haut de la colonne Entré comme g6 (« ? » en attente à la place du nombre, pas un « ? » flottant au-dessus) ; une seule étiquette pointillée à la fois, sans décaler les colonnes ; plus de « sans lui, perte avant stock » quand aucune perte n'est affichée. Mois par mois et étape 8 : même règle (charge ferme sans la pièce, « à classer » à part), ou une mention « à classer 5 500,00 » qui l'explique.
- **3** : Annuel › TVA ouvre une feuille vide : la remplir (trouver la cause, ne pas masquer).
- **7** : « Stock au 31 déc. ? › » mène à l'étape 3 « Inventaires » de la piste de clôture, comme « à classer › » mène à l'étape 4.
- **9** : légende « payé » de la Synthèse à la couleur des charges payées dessinées (g3a), pas au gris d'« Autres frais » ; si plusieurs couleurs, une pastille multicolore comme v6a (« payé » à bandes).
- **10** : Synthèse d'un mois sans rien : l'annexe de g3a (colonne Entré en pointillé, « 0,00 » écrit), pas deux nombres flottants dans le vide.
- **12** : fiche d'une vente « 10 pièce » → « 10 pièces » (accord du pluriel des unités comptables).
Pour chaque point : contrôle qui échoue avant (sortie dans `temoin-head.txt`) puis passe, dans `r1/controle-r1.mjs <port>`, qui imprime une ligne par point et R1 OK ou R1 ECHEC.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : g3a, g6 reprises telles quelles ; un cas neuf se range dans un de leurs états (L03).
- Montants : aucune règle du domaine changée ; inconnu ≠ 0 ; aucune donnée réelle (banc `?dev-local&finance-demo=reel` et `?dev-local&finance-demo`).
- Renvois : chaque manque visible mène à son geste (10.11 : « Pas de renvoi ??? / Bref il en manque plein... »).
- Rien hors de « Possède » ; `git status --short` à la fin. La voie f1 écrit en même temps `src/ui/finance/operations`, `PlageMois.tsx`, `TransactionJournal.tsx`, `operations.css` : n'y touche pas.
- Pas de Fable, aucun sous-agent. Banc : http://localhost:3000 (HMR ; ne pas relancer le serveur). Puppeteer : `.claude/skills/webapp-testing/examples/_lanceur.mjs`, modèle `work/missions/2026-11-14-finances/analyse/capturer2.mjs`. Thème : `localStorage['laffinee.theme']`. `npx tsc` : ignorer les deux erreurs de `functions/` (firebase-admin absent).
- Captures 390 tactile et 1280, clair et cave, dans `r1/cap/`, noms distincts sans jeu sur la casse (Windows) ; planche côte à côte avec g6 et g3a ; toutes ouvertes.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil, mis à jour à chaque point : fichiers changés, contrôle avant/après, tests, captures ouvertes, « POUR f1 » s'il y a lieu.
- `npx vitest run tests/unit --reporter=dot > work/missions/2026-11-14-finances/voies/r1/tests.txt`.
Ne commite pas. Réponse finale au pilote : une ligne.
