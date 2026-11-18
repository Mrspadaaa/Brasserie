# Voie p4 — houblon en pièce, vue FACTURE | STOCK et choix relier / bis / nouvel article (DP-4, mission 2026-11-09-depense-totaux)

- Agent : auteur · Modèle : sonnet · Plafond : 120 tours · Décideur : pilote
- Lis :
  - `CLAUDE.md`, `cerveau/LECONS.md` (L01, L02, L03, L11, L12, L13, L17) ; `.claude/rules/affinee-frontend.md`, `DESIGN.md` ;
  - la fin de `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (10.11, « Ça pose aucun problème que un houblon… ») ; DP-4 de
    `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` ; dans `work/refonte-frontend/decisions.md` : D215 (le trio « bis »), D371b (une unité
    qui ne s'ajoute pas n'en fait pas un autre produit), D374 ;
  - ses deux captures, à ouvrir : `../../captures-brasseur/10-idaho-bis.jpg` (« Idaho 7 bis · nouvel article », 1 pièce, « 0 → 1 pièce »,
    pas de vue STOCK) et `11-idaho-relie.jpg` (relié à « Idaho 7 », compté en g, « pièce ne s'ajoute pas », vue FACTURE | STOCK) ;
  - `src/ui/finance/ExpenseSheet.tsx` : la construction du plateau d'une ligne, `voisinDuel`, `enTrio`, `trioEl` (~l. 1110-1140), `neuf`,
    `nomPropose`, `neufDOffice`, `lieAuStock`, `suivreAuStock` ; `src/ui/depense/Plateau.tsx` (`Duel`, `Sortie`).

## Objectif
Lire d'abord ce que la base fait (L02) : le trio D215 (Duel FACTURE | STOCK + sorties « bis » / « Relier à … » / « Nouvel article »)
existe déjà, mais ne paraît que quand un VOISIN est trouvé. Un test qui échoue sur HEAD avant chaque correction (L13).

1. **Le choix dans la vue stock.** Dès qu'un article du stock porte le même nom que la ligne (ou est son voisin), et dès que la ligne
   est proposée en « bis » ou en nouvel article à côté d'un article existant, le trio D215 paraît : FACTURE | STOCK et les trois sorties,
   la proposition marquée « proposé ». Le brasseur choisit là ; rien n'est tranché en silence. Cas de sa capture 1 : « Idaho 7 bis » proposé
   sans vue → la vue et le trio paraissent. Cas de sa capture 2 (relié, unité qui ne s'ajoute pas) : la vue FACTURE | STOCK reste, avec
   les sorties.
2. **Jamais un article compté au poids entré au stock en pièce sans poids.** Un houblon, un malt (ou tout article du stock compté en g,
   Kg ou L) : la ligne en « pièce » ne fait ni « 0 → 1 pièce » ni un « bis » à cause de l'unité (D371b : une unité qui ne s'ajoute pas
   n'est pas un autre produit). L'unité du stock est proposée ; si la pièce reste, la ligne demande son poids (« 1 pièce = ? g », valeur lue
   sur le nom ou la fiche si elle existe, jamais inventée) avant d'entrer au stock ; sans poids, la ligne reste « à remplir » et n'entre
   pas au stock. Garde l'acquis s1 (toucher une unité met 1 sans clavier ; ordre pièce · g · Kg · L · sachet).
3. Trouver pourquoi la capture 1 a proposé « Idaho 7 bis » d'office (nom pris, unité pièce, fiche « Idaho 7 US » ?) et corriger à la
   cause : un même nom au stock propose de RELIER, avec le trio visible.

## Contrôles
- `npx tsc --noEmit -p .`
- `npx vitest run tests/unit/depense tests/unit/finance tests/integration/depense* tests/integration/finance tests/integration/financeQuickActions.test.tsx --reporter=dot > work/missions/2026-11-09-depense-totaux/voies/p4/tests.txt` ; ligne « Tests » dans RESULTAT.md, zéro rouge.
- `npm run build` vert.
- Banc : copie `../p1/banc/` dans `voies/p4/banc/` ; cas `idaho-piece` (stock : « Idaho 7 » houblon compté en g, 0 g ; ligne lue
  « Idaho 7 », 1, sans unité ou « pièce », 82,35) et `idaho-voisin` (stock « Idaho 7 » α 13 ; ligne « Idaho 7 » α 15). Captures Chrome réel
  (puppeteer-core ; serveur Vite lancé en arrière-plan puis arrêté), 390 tactile et 1280, clair et cave : ligne ouverte au repos, après
  chaque sortie du trio, après « pièce », après « g ». Toutes ouvertes, dans `voies/p4/captures/`.

## Possède
- `src/ui/finance/**`, `src/ui/depense/**`, `src/domain/finance/**`, `src/domain/stock/**` (lecture ; écriture seulement si la règle
  d'unité y vit) ;
- `tests/unit/depense/**`, `tests/unit/finance/**`, `tests/integration/depense*`, `tests/integration/finance/**` ;
- `work/missions/2026-11-09-depense-totaux/voies/p4/**`.

Rien dans `functions/`. Aucun appel Gemini. Aucun déploiement. Ni commit ni stash.

## Exigences transversales et acquis
- Règle n° 1 : la maquette choisie de la ligne (p3c-3, trio D215, pa1d « Suivre au stock ») reste la base ; aucun composant neuf
  quand un état existant convient (L03).
- DP-2 (rouge des totaux, renvois utiles) ; D382 et DP-3 (« Documents ») ; « Suivant › » dans la ligne ouverte (10.11) ; s1 (stock limité
  au brassage, unité qui met 1 sans clavier, tuiles de quantité) ; une ligne mal classée garde sa bande (5 tests D306).
- Inconnu ≠ 0, jamais un poids inventé. Peu de texte au premier plan. Jamais `type="number"`. Aucune donnée réelle dans Git.

## Rendre (exigé par `.claude/hooks/garde-jetons.mjs`, L18)
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments : une limite de tours ne perd rien.
- La ligne « Tests » écrite dans un fichier (`--reporter=dot > …/p4/tests.txt`).
- Les captures 390 tactile et 1280, clair et cave, toutes ouvertes.

Réponse finale au pilote : une ligne.
