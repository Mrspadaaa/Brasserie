# Voie s1 — stock limité au brassage ; l'unité met 1 sans clavier (mission 2026-11-09-depense-totaux)

- Agent : auteur · Modèle : sonnet · Plafond : 100 tours · Décideur : pilote
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L01, L12, L13), `.claude/rules/affinee-frontend.md`, `DESIGN.md`, la fin de
  `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (09.11, « 2 point pour le stock »), `../d3/RESULTAT.md` (état de l'écran), sa capture
  `../../captures-brasseur/1-depense-bauhaus.jpg` (icônes de stock sur des outils de rénovation).

## Objectif
1. Une ligne ou une dépense hors brassage (catégories Rénovation, Outillage, Divers travaux… : tout ce qui n'est pas ingrédient, emballage,
   produit de nettoyage ou matériel de brasserie, selon les catégories existantes de l'app) ne crée ni ne relie d'article de stock et
   n'affiche pas l'icône de stock. Trouve la règle de catégorie existante (chercher « stock » dans `src/ui/depense`, `src/domain/stock`,
   les catégories de dépense) ; une catégorie dont l'appartenance au brassage est inconnue garde le comportement actuel (prudent).
2. Toucher une unité (segment g · kg · Stk…) d'une ligne dont la quantité est vide y met 1, sans ouvrir le clavier ni prendre le focus
   du champ quantité ; une quantité déjà saisie ne change pas (règle B2 existante : une autre unité ne garde pas une quantité d'une
   autre unité — lire le code et ses tests, ne pas casser B2 ; si B2 vide la quantité, elle passe à 1). Le clavier ne s'ouvre qu'en
   touchant la quantité.
Un test qui échoue avant chaque point.

## Contrôles
- `npx tsc --noEmit -p .` ; `npx vitest run tests/unit/depense tests/unit/finance tests/integration/depense* --reporter=dot > work/missions/2026-11-09-depense-totaux/voies/s1/tests.txt`, zéro rouge en zone.
- Captures Chrome (script de captures de `../d2/`), 390 tactile, clair et cave : ticket BAUHAUS sans icône de stock sur les outils ;
  unité touchée → 1, aucun clavier (focus mesuré : `document.activeElement` n'est pas un champ). Toutes ouvertes.

## Possède
- `src/ui/finance/**`, `src/ui/depense/**`, `src/domain/finance/**`, `src/domain/stock/**` en lecture, sauf la règle de catégorie si elle y vit ;
- `tests/unit/depense/**`, `tests/unit/finance/**`, `tests/integration/depense*` ;
- `work/missions/2026-11-09-depense-totaux/voies/s1/**`.
Rien dans `functions/`. Ni commit ni stash.

## Rendre (exigé par `.claude/hooks/garde-jetons.mjs`, L18)
- `RESULTAT.md` tenu au fil, mis à jour à chaque point : une limite de tours ne perd rien.
- La ligne « Tests » écrite dans un fichier (`--reporter=dot > …/s1/tests.txt`).
- Les captures 390 tactile, clair et cave, toutes ouvertes.
Réponse finale au pilote : une ligne.

## Contrat réécrit (09.11) — ses ajouts, et les 5 problèmes du jeu en ligne
- Ses ajouts (déjà reçus) : unités dans l'ordre pièce · g · Kg · L · sachet ; une unité touchée met 1 et ouvre les quantités en grandes
  tuiles sans rouge ; pas de clavier.
- `../../critique/VERDICT-EN-LIGNE.md` (captures `../../critique/en-ligne/`), en ligne sur 39ece15a, à corriger aussi :
  1. « Qté × prix 0/5 » : prix unitaires effacés puis barrés, rabais comptés ; une seule règle, rabais hors compte, quel que soit l'état ;
  2. la sous-ligne de rabais s'appelle « Rabais », jamais le libellé de taxe (« TaxeSansTVA - 0% ») ;
  3. BAUHAUS en ligne : aucune quantité sur 29 lignes, « 0/29 », alors que le banc donne 23/23 : trouve l'écart entre la lecture réelle et le
     banc (normalisation de `geminiScanner.ts` ou champ du serveur), et un test sur la forme réelle ;
  4. la recherche « peinture » trouve le sous-groupe « Peinture et sols » et ses lignes ;
  5. aucun mot brut (« other ») dans la barre basse.
