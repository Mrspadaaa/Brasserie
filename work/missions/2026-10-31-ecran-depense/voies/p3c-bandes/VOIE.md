# Voie p3c-bandes — une bande par famille, pour toutes les familles (D262c, D262d)

Agent : `auteur` (Sonnet). Plafond : 90 tours. Pilote : Opus ; critique Fable après la voie (L25). Aucun déploiement, aucun commit.

## Ses mots (SPEC, mot pour mot)
- D235 : « Je veux aussi que ça soit trié par catégorie avec sous total de quantité. Par exemple je sais très bien combien d'houblon j'ai
  commandé. » ; D245 : « Les bandes teintées p3a-3 j'aime beaucoup ! C'est le top 1 de loin quasiment rien ne doit être changé » ;
  D248 : « p3c-3 le mieux ».
- D262c : « Et aussi ça à pas classé, levure, malt, outils de brassage, autre ect... Correctement ».
- D262d : « Je comprends pas ,j'ai validé les maquettes de tout ça ?? » ; « Le classement par famille ou sous familles était pas que pour
  malt et houblons mais pour tout type de famille ??? ».
Lecture (règle n° 1, L03) : son choix p3c-3 est le principe « une bande teintée par famille, avec son sous-total de quantité » ; la maquette
n'en montrait que quatre parce que sa facture d'exemple n'avait que celles-là. **Plancher à enrichir** : la même bande, pour chaque famille.

## À faire
1. Lire `src/ui/depense/groupes.ts`, `familles.ts` (neuf), `Liste.tsx`, `Ligne.tsx`, `p3c.css`, `ExpenseSheet.tsx` (`groupeDeLigne`, ~l. 540), et la maquette
   `work/missions/2026-10-31-ecran-depense/v3/p3c-3/etat.html` (teintes des bandes, en-tête, sous-total, filet de gauche).
2. Familles, dans cet ordre : Malts, Houblons, Levures, Sucres, Additifs, Matériel de brassage, Emballage, Nettoyage (CIP, désinfectant,
   détergent, sols), Consommables (EPI compris), Services, Autres. Source de la famille, dans l'ordre : la catégorie de stock de la ligne
   (`stockCategory`, `STOCK_CATEGORIES` de `src/services/stockLineMatching.ts`), l'article de stock rattaché, le `kind` de la lecture
   (`equipment`/`maintenance` → Matériel de brassage, `packaging` → Emballage, `cleaning` → Nettoyage, `service` → Services), puis les mots
   du nom (`inferNature`, contexte corrigé par k6-correctifs). « Autres » ne reçoit que l'inclassable. Une mouture reste sur son malt (acquis).
   Le port reste hors des bandes (D249).
3. Chaque bande neuve reprend exactement la forme des bandes existantes (en-tête, pastille de compte, sous-total de quantité, teinte du
   filet et du fond) ; une teinte par famille tirée des jetons de `DESIGN.md` / `tailwind.config`, distincte des voisines, lisible en
   clair et en sombre. Une bande n'apparaît que si elle a des lignes.
4. Tests (rouge d'abord sur l'actuel) : une pièce inventée aux lignes de toutes les familles → une bande par famille présente, dans l'ordre,
   chacune avec son sous-total ; 0 ligne d'une famille connue sous « Autres » ; la forme de sa pièce du 01.11
   (`tests/unit/depense/banc-k6/piece.ts`) : levure, malts (dont un sans le mot « malt »), sucre, houblon, matériel (sacs à houblon compris,
   jamais en Houblons), emballage. Retirer le `it.todo` des bandes neuves de `tests/unit/depense/banc-k6/genres-d262c.test.ts`.
4 bis. D269 (sa question « SI il y aune nouvelle levure, nouveau fermenteur ou autre item un peu plus technique ou complexe ? ») :
   un test rouge d'abord sur ced4a6a8, sans catégorie de stock ni article lié (seuls le nom et le `kind` de la lecture) : Omega OYL-200,
   Imperial A38, Wyeast 1056 → Levures ; CARABELGE, Château Abbey, Weyermann Pale Ale, Flocons d'avoine → Malts ; Fermzilla 27 L,
   Unitank 60 L, Gärtank, Spundventil, Plattenkühler, Hop Spider Bag (même en kind `stock`) → Matériel de brassage ; Candi Syrup → Sucres ;
   Whirlfloc, CaCl2 → Additifs ; Kronkorken → Emballage ; Chemipro, Star San → Nettoyage. Puis le même jeu avec une `stockCategory` de
   la lecture qui contredit les mots : la catégorie gagne. Le recours aux mots vit dans `src/ui/depense/familles.ts` (neuf) : listes de
   marques et de termes du métier, jamais un nom de pièce recopié (L20 : pas de sur-mesure sur les exemples ; garder 3 noms hors liste
   pour juger). Ne pas toucher `stockLineMatching.ts`.
5. Voir dans Chrome (L12) : `node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "node scripts/with_server.mjs --server
   \"npm run dev -- --port 3462 --strictPort\" --port 3462 --env VITE_FIREBASE_API_KEY=fake -- node <ton script> …"` ; un état d'aperçu
   `?dev-local&depense=familles` (ajout dans `src/ui/depense/apercuDev.ts`, lignes inventées de toutes les familles). Captures à 390 tactile
   et 1280, repos et une bande ouverte ; les ouvrir en image. Côte à côte avec p3c-3 (`capturer-p3c.mjs` montre la méthode).

## Contrôles (copie isolée)
- `npx tsc --noEmit -p .` → 0 erreur.
- `npx vitest run tests/unit/depense tests/unit/stockLineMatching.test.ts tests/integration/expenseSheet.test.tsx
  tests/integration/expenseSheetMouture.test.tsx tests/integration/jus0Journey.test.tsx --maxWorkers=2` → tout vert.
- `node work/missions/2026-10-31-ecran-depense/voies/p3c-port/capturer-p3c.mjs` (mode tactile390) → « P3C OK » (aucune régression des
  bandes existantes).

## Possède
`src/ui/depense/groupes.ts`, `Liste.tsx`, `Ligne.tsx`, `p3c.css`, `apercuDev.ts`, `src/ui/finance/ExpenseSheet.tsx` (`groupeDeLigne`
seulement), `tests/unit/depense/` (tests des bandes), `work/missions/2026-10-31-ecran-depense/voies/p3c-bandes/`. Rien d'autre (L17 :
`git status --short` dans le RESULTAT). Ne touche jamais `.codex/hooks.json`, `source4-portable-bundle-manifest-01.json`, `functions/`,
`firebase.json`, `.firebaserc`, `firestore.rules`, `firestore.indexes.json`. Pas de serveur de dev dans `C:/Users/mrspa/Documents/Brasserie`.
Retour en une ligne : `P3C-BANDES OK — <n> familles, captures ouvertes — <chemin du RESULTAT>`.

## Ajout du 01.11, nuit (D271, ses mots)
« Langue utilisée pour les factures, allemand, anglais, français, italien. Ça traduits en français et fait le bon lien ». Les synonymes
et mots de famille couvrent les quatre langues ; la catégorie écrite et la bande affichée sont en français ; une ligne allemande ou
italienne se relie à l'article français existant de sa famille. Tests : un jeu par langue. La désignation imprimée ne se traduit pas (D261a).
