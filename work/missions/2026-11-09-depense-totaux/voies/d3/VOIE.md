# Voie d3 — les 7 problèmes du VERDICT-2 du critique, écran Dépense (mission 2026-11-09-depense-totaux)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- Lis :
  - `CLAUDE.md`, `cerveau/LECONS.md` (L11, L12, L13, L17) ;
  - `.claude/rules/affinee-frontend.md`, `DESIGN.md` ;
  - la fin de `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (09.11) ;
  - `../d2/RESULTAT.md` (état du code : commit 59fb5c10, banc et lectures rejouées) ;
  - `../../critique/VERDICT-2.md`, avec ses captures dans `../../critique/captures-2/`, toutes à ouvrir.

## Objectif
Corriger les 7 problèmes de `VERDICT-2.md`, en commençant par les trois bloquants :
1. **Accord des lectures** : « ✓ Lectures 3/3 d'accord » s'affiche alors que la barre du bas dit « désaccord ». Une seule source de vérité
   pour l'accord des lectures.
2. **Geste mort** : « Voir la ligne en trop › » n'ouvre rien quand aucun montant n'égale l'écart (bauhaus-eur). Le geste mène toujours
   quelque part : la ligne la plus probable, sinon la liste filtrée des candidates. Jamais de bouton mort.
3. **Sous-total filtré** : un sous-groupe affiche « 0,00 » en recherche filtrée. Le sous-total reste celui du groupe, ou indique
   « filtré ».

Ensuite les 4 autres, dont :
- « Qté × prix » compte les rabais et les lignes sans prix comme non vérifiés ;
- la fiche d'un rabais montre quantité, prix et +1 +2.

Un test qui échoue avant chaque correction (L13).

## Contrôles
- `npx tsc --noEmit -p .`
- `npx vitest run tests/unit/depense tests/unit/finance tests/integration/depense* tests/integration/finance --reporter=dot > work/missions/2026-11-09-depense-totaux/voies/d3/tests.txt`.
  Recopie la ligne « Tests » dans RESULTAT.md. Zéro rouge dans la zone.
- Captures avec le script de captures de d2 (`../d2/`) : avant et après pour chaque problème, 390 tactile et 1280, clair et cave. Dans
  `voies/d3/captures/`, toutes ouvertes.

## Possède
- `src/ui/finance/**`, `src/ui/depense/**`, `src/domain/finance/**`, `src/services/geminiScanner.ts` ;
- `tests/unit/depense/**`, `tests/unit/finance/**`, `tests/integration/depense*` ;
- `work/missions/2026-11-09-depense-totaux/voies/d3/**`.

Rien dans `functions/`. Ni commit ni stash.

## Exigences transversales et acquis
- La maquette choisie de la Dépense reste la base.
- Inconnu ≠ 0.
- Peu de texte au premier plan.
- Aucune donnée réelle dans Git.

## Rendre (exigé par `.claude/hooks/garde-jetons.mjs`, L18)
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments : une limite de tours ne perd rien.
- La ligne « Tests » écrite dans un fichier (`--reporter=dot > …/d3/tests.txt`).
- Les captures 390 tactile et 1280, clair et cave, toutes ouvertes.

Réponse finale au pilote : une ligne.
