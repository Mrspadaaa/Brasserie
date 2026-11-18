# Voie p5 — les 2 bloquants client du jeu en ligne 9 (mission 2026-11-09-depense-totaux)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- Lis :
  - `CLAUDE.md`, `cerveau/LECONS.md` (L02, L03, L12, L13, L17) ; `.claude/rules/affinee-frontend.md`, `DESIGN.md` ;
  - la fin de `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (10.11 : Idaho 7, « Ça devrait scroll pour pouvoir voir l'item en entier »,
    « Oui exactement ces vues, bravo continue ») ; DP-4, DP-5, DP-6 de `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` ;
  - `../../critique/VERDICT-EN-LIGNE-9.md`, bloquants 1 et 2, et leurs captures (`../../critique/en-ligne-9/`), toutes à ouvrir ;
  - `../p4/RESULTAT.md` (trio D215 pour un même nom, banc `../p4/banc/`) ;
  - `src/ui/finance/ExpenseSheet.tsx` : `focaliser` (branche `libelle`, `enHaut`), `ajouterManquante`, `voisinDuel`, `enTrio`, `trioEl`,
    `articleDeMemeNom` (`src/ui/depense/etat.ts`), `suivreAuStock`, le combo ⇄ « Chercher dans le stock ».

## Objectif
Un test qui échoue sur HEAD avant chaque correction (L13) ; le comportement validé par le brasseur (montages p4) reste tel quel.

1. **La ligne ajoutée hors de vue à 1280** (bloquant 1). `enHaut` défile `scroller.current`. À 1280, sur une longue liste (BAUHAUS 29
   lignes), la ligne reste sous le pied et son focus est dans un champ invisible. Il faut défiler le bon conteneur, l'ancêtre de la
   ligne qui défile réellement, à toute largeur. La ligne entière se voit, cases d'unité comprises, sous l'en-tête et les bandes
   collantes. Elle revient en vue après la saisie du nom. Mesure à 390 et à 1280 : haut de la ligne au-dessous des éléments collants,
   bas des cases d'unité au-dessus du pied.
2. **« Idaho 7 » ajouté face à plusieurs « Idaho 7 » au stock** (bloquant 2). Ligne ouverte : « hors stock » avec un picto de stock.
   Ligne fermée : « plusieurs articles « Idaho 7 » : choisis ». ⇄ sort tout le stock. Aucune vue FACTURE | STOCK. Attendu :
   - un seul état ;
   - quand un ou plusieurs articles du stock portent ce nom, la vue FACTURE | STOCK et ses sorties paraissent, une sortie
     « Relier à … » par article candidat, chacune distinguée par ce qui les sépare (α, récolte, lot, stock), puis « bis » et
     « Nouvel article » ;
   - rien n'est relié en silence ;
   - ⇄ montre d'abord ces candidats.
   Même règle pour une ligne lue et pour une ligne ajoutée à la main. Ne change pas le rendu validé d'un candidat unique (montages p4).

## Contrôles
- `npx tsc --noEmit -p .`
- `npx vitest run tests/unit/depense tests/unit/finance tests/integration/depense* tests/integration/finance tests/integration/financeQuickActions.test.tsx --reporter=dot > work/missions/2026-11-09-depense-totaux/voies/p5/tests.txt` ; ligne « Tests » dans RESULTAT.md, zéro rouge.
- `npm run build` vert.
- Banc : copie `../p4/banc/` dans `voies/p5/banc/` ; cas `idaho-deux` (stock : deux « Idaho 7 », α 13 récolte 2025 et α 15 récolte
  2026, en g) et une longue liste (BAUHAUS 29 lignes) pour l'ajout. Captures Chrome réel (puppeteer-core ; Vite en arrière-plan puis
  arrêté), 390 tactile et 1280, clair et cave : ligne ajoutée après « + Ajouter une ligne », puis après « Idaho 7 » tapé ; la vue à deux
  candidats ; chaque sortie choisie. Mesures de position écrites. Toutes ouvertes, dans `voies/p5/captures/`.

## Possède
- `src/ui/finance/**`, `src/ui/depense/**`, `src/domain/finance/**` ;
- `tests/unit/depense/**`, `tests/unit/finance/**`, `tests/integration/depense*`, `tests/integration/finance/**` ;
- `work/missions/2026-11-09-depense-totaux/voies/p5/**`.

Rien dans `functions/`. Aucun appel Gemini. Aucun déploiement. Ni commit ni stash.

## Exigences transversales et acquis
- Règle n° 1 : la vue FACTURE | STOCK et le trio validés (« Oui exactement ces vues ») restent la base ; aucun composant neuf.
- DP-2, D382, DP-3, « Suivant › », loupe, DP-5, DP-6 (la ligne ouverte garde sa bande), s1. Une ligne mal classée garde sa bande
  (5 tests D306).
- Inconnu ≠ 0. Peu de texte au premier plan. Jamais `type="number"`. Aucune donnée réelle dans Git.

## Rendre (exigé par `.claude/hooks/garde-jetons.mjs`, L18)
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments : une limite de tours ne perd rien.
- La ligne « Tests » écrite dans un fichier (`--reporter=dot > …/p5/tests.txt`).
- Les captures 390 tactile et 1280, clair et cave, toutes ouvertes.

Réponse finale au pilote : une ligne.
