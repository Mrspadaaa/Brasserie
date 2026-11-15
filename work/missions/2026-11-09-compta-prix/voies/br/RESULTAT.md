OK — « Ajouter au stock » offert sur toute ligne ; la ligne corrigée se déplie comme la non corrigée (BR-124, CP-21, CP-22)

## Fichiers écrits
- `src/ui/depense/Plateau.tsx` : `HorsStock` offre toujours « Ajouter au stock » (ex « Suivre au stock », `data-dp-suivre` gardé). Nature de stock tenue (ingrédient, emballage, nettoyage) : un toucher. Autre nature (Matériel, Service, Port…) : une rangée `data-dp-nature-stock` « Ingrédient · Emballage · Nettoyage », puis `onSuivre(nature)`.
- `src/ui/finance/ExpenseSheet.tsx` : (1) `suivreAuStock(nature?)` pose la nature choisie sur la ligne (même geste que `changerNature` : `manuallyClassified`, « 1 × total », la ligne passe en bande et reste ouverte) puis le chemin existant (relie par le nom, sinon nouvel article) ; rien n'est écrit avant « Confirmer ». (2) `duelCorrEl` : le face à face FACTURE = STOCK n'existe que pour un ARTICLE relié ; sans article, la correction se montre seule (1re lecture barrée, 3e lecture, « = montant », Garder · Remettre).
- `src/ui/depense/apercuDev.ts` : état de démo `vaccins` (SIMULÉ : Vaxigrip Tetra, H21 A vaccination 25 → 30 à la 3e lecture).
- Tests : `tests/integration/depenseLiaisonStock.test.tsx` (describes BR-124 : 5 tests ; BR-123 inchangés et verts) ; renommage « Suivre » → « Ajouter au stock » dans `tests/unit/depense/{aide-plateau.ts, d381/stock-repare, pu4d/plateau, sm0811/suivre-ecran}` ; deux assertions inversées (voir DÉCISION).
- Preuves : `voies/br/{tests-rouge.txt, tests.txt, br-capturer.mjs, captures/}`.

## Cause du double comportement
`duelCorrEl` (Garder · Remettre) rendait toujours le `<Duel>` FACTURE | STOCK, avec « hors stock » à droite quand la ligne n'avait pas d'article. Vaxigrip, non corrigée, n'avait pas ce bloc : d'où les « deux comportements ». Corrigé comme demandé : la correction seule.

## Critères
- Rouge sur HEAD : `tests-rouge.txt` : 5 échecs sur 10 (option absente x4, `[data-dp-duel]` présent sur la ligne corrigée).
- Vert : fichier BR-124 + les 98 fichiers de la Dépense (`grep ExpenseSheet|src/ui/depense`) : « 98 passed | 1 skipped ; 1147 tests passed » (`tests.txt`).
- `npx tsc --noEmit` hors firebase-admin, firebase-functions, cheerio, @noble/hashes, react-zoom-pan-pinch : aucune erreur.
- `npx vite build --outDir $TEMP/br-build` : « built in 30.85s ».
- Captures 390 tactile, clair et cave, ouvertes et regardées (L12) : `captures/01` Vaxigrip dépliée, `02` H21 dépliée corrigée, `05` Déplié, `03` « Ajouter au stock » touché (rangée de nature), `04` après « Emballage » (la ligne passe en bande Emballage, « nouvel article », ⇄). Mesure en page : 0 `[data-dp-duel]`, 2 boutons « Ajouter au stock ». Serveur 3016 arrêté.

## Doutes et limites
- L'accordéon de l'app n'ouvre qu'une ligne à la fois : « côte à côte » = deux captures (01, 02) ; le test jsdom compare les deux dépliages.
- Une ligne dont le stock est ouvert d'office (houblon, malt) ne montre pas « Ajouter au stock » (sa vue est ouverte) ; si elle est refermée par « Retirer », l'option revient (ligne `hors stock`).
- Emballage/Nettoyage s'affichent dans le segment « Matériel » (mapping existant `natureDuSegment`, non touché) ; la bande, l'icône et l'enregistrement suivent la vraie nature.
- Le contrôle Chrome `work/refonte-frontend/v4/tournoi/outils/controle-plateau-ligne.mjs` (hors Possède) cherche encore « Suivre au stock » (l.58) : à passer à « Ajouter au stock ».

DÉCISION À PRENDRE : les deux tests s1/D306 (`depenseS1.test.tsx` « rénovation », `renovation-d306.test.tsx`) affirmaient « pas de bouton Suivre au stock » sur une ligne de rénovation/travaux (s1, 10.11 : « une dépense de travaux ne relie plus aucune ligne »). Sa règle confirmée du même jour (« l'option est toujours disponible ») prime : je les ai inversés (option offerte, aucun article d'office, `stockDe` reste `none`). Option contraire : exclure la Rénovation de l'option. Recommandation : garder « toujours », c'est sa phrase.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune
