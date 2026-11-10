# Voie br — Nouvelle dépense : « Ajouter au stock » toujours offert, un même article se déplie pareil (BR-124, CP-21, CP-22)

Agent : auteur (Sonnet), plafond 90. Worktree `C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/jolly-mahavira-cc0cc2`.
**Attends que la voie fx2 ait fini avec `src/ui/finance/ExpenseSheet.tsx`** : le pilote ne te lance qu'après ; vérifie par `git status`
que rien d'autre n'écrit ce fichier, et relis-le avant de l'éditer.

## Ses mots (10.11, relayés par la session de suivi, en ligne sur 8d07005a)
1. Sur une ligne Matériel hors stock (« Vaxigrip ») : « Et du coup pourquoi là je peux pas avoir un ajout au stock ?? », puis « Mais je veux
   quand même avoir l'option de l'ajout au stock ??? ».
2. Deux lignes Matériel hors stock de la même facture : « H21 A vaccination » (prix corrigé à la 3e lecture) montre le bloc FACTURE = STOCK
   (« hors stock ») avec Garder et Remettre ; « Vaxigrip » (non corrigée) ne montre rien : « Il ya deux comportement très différents sur le
   même type d'article ? Wtf ».
3. Avant (BR-123) : « Oui ou si c'est vraiment un changement de stock genre ajoute de houblons, malt ou autre ??? ».

## Règles (lecture étroite, réversible)
- Le panneau stock s'ouvre **d'office** seulement pour une entrée de brassage (ingrédient : houblon, malt, levure…, règles D306/s1 actuelles,
  test `tests/integration/depenseLiaisonStock.test.tsx` vert, à garder vert).
- Sur toute autre ligne (Matériel, Service, Port, hors brassage), il reste fermé, mais une option **discrète, toujours présente**
  « Ajouter au stock » l'ouvre à la demande (revient sur 2e12f716 « ni stock ni icône »). Aujourd'hui `HorsStock` (`src/ui/depense/Plateau.tsx`
  l.~123) n'offre « Suivre au stock » que si `peutSuivre` (= nature de stock, `STOCK_KINDS` dans `ExpenseSheet.tsx` l.~94). Pour une nature hors
  stock, le toucher demande en une rangée la nature de stock (Ingrédient · Emballage · Nettoyage — celles que le stock sait tenir : grep
  `STOCK_KINDS`, `getStocks`), puis suit le chemin existant `suivreAuStock`. Rien n'est écrit au stock avant l'enregistrement.
- **Un même type d'article a toujours le même dépliage** : une ligne dont une lecture a été corrigée montre sa correction seule (la valeur
  et « Garder · Remettre »), sans la colonne/le bloc FACTURE = STOCK ; le stock suit la règle ci-dessus. Trouve pourquoi la ligne corrigée
  affiche le bloc FACTURE = STOCK (grep `FACTURE`, `Remettre`, `Garder` dans `src/ui/depense/**` et `ExpenseSheet.tsx`).

## Tests et preuves
- Rouges d'abord sur HEAD, dans `tests/integration/depenseLiaisonStock.test.tsx` (ajoute un `describe` « BR-124 ») : (a) Matériel, Service et
  hors brassage : « Ajouter au stock » présent, panneau fermé ; au toucher, le choix de nature puis la liaison s'ouvre ; (b) deux lignes Matériel
  côte à côte dans une même pièce, l'une avec une correction de lecture (prix corrigé à la 3e lecture : fixture inspirée de sa facture,
  aucune donnée réelle), l'autre non : même structure de dépliage (pas de bloc FACTURE = STOCK sur la corrigée ; « Ajouter au stock » sur les
  deux) ; (c) les cas BR-123 restent verts.
- `npx vitest run <fichiers> --reporter=dot > voies/br/tests.txt 2>&1` (le fichier + tests de la Dépense : grep `ExpenseSheet`, `src/ui/depense`).
  `npx tsc --noEmit` hors firebase-admin, firebase-functions, cheerio, @noble/hashes, react-zoom-pan-pinch ; `npx vite build --outDir "$TEMP/br-build"`.
- Capture 390 tactile, clair et cave, sur un état de démo (ajoute `vaccins` dans `src/ui/depense/apercuDev.ts`, sur le modèle de `medicament`) :
  les deux lignes dépliées côte à côte, puis « Ajouter au stock » touché. Ouvre-les (L12). Serveur `npx vite --port 3016 --strictPort`, arrêté à la fin.

## Possède
`src/ui/finance/ExpenseSheet.tsx`, `src/ui/depense/**`, `tests/integration/depenseLiaisonStock.test.tsx`, tests existants de la Dépense,
`work/missions/2026-11-09-compta-prix/voies/br/**`. RESULTAT au fil dans `voies/br/RESULTAT.md`. Aucun commit, pas de `git stash`,
Gemini jamais appelé, aucune donnée réelle. Rends une ligne.

## Règle confirmée (10.11)
Ses mots : « l'option « ajouter au stock » est toujours disponible, la vue n'est ouvert que pour les articles de brasserie.. ». L'option est sur TOUTE ligne (ingrédient compris, quand sa vue n'est pas ouverte) ; la vue stock ne s'ouvre d'office que pour un article de brasserie ; fermée pour le reste (Vaxigrip, H21).
