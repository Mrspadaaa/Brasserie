# Voie f2-confiance — trois niveaux pour chaque valeur : sûre, reprise (jaune), inconnue (rouge) ; l'unité déduite (D277)

Agent : `auteur` (Sonnet). Plafond : 90 tours. Pilote : Opus. Un seul temps, mais la table de correspondance (§ 3) s'écrit d'abord dans
`PLAN.md` de ta voie, puis tu continues sans attendre. Aucun commit, aucun déploiement.
Relire `work/missions/2026-10-31-ecran-depense/voies/COMMUN.md` : il vaut ici, sauf « Deux temps » et sauf la phrase des unités
« sans unité devinée », remplacée par ses mots ci-dessous (D277 remplace D214 sur ce point : l'unité se déduit, et se signale).

## Ses mots (SPEC-BRASSEUR, 01.11 nuit, mot pour mot)
- « Pour les unités, c'est quand même facile à devenir ?? SI il y a un doute, ça me flag mais de base ça essaie d'auto remplir. Il y a 3
  cas de figure: sûr ou quasiment sûr, rien. / Pas sûr mais repis, flag jaune. Je contrôle / Ne sait pas, aucune idée, flag rouge, je dois
  remplir ou corrigé » (« devenir » = deviner, « repis » = repris).
- Puis : « pas que pour les unités mais globalement pour tout ».
- Toujours valable : « comme c'est de la facturation, c'est super important, ça doit être très fiable ! » ; aucun chiffre inventé.

## Le défaut, sur sa commande (doc14, lecture D272b)
12 lignes sur 17 n'ont aucune unité imprimée (une commande en ligne : « Menge » seule) : Wyeast 2 × 9,50 ; Styrian Goldings 85 × 0,04 ;
Candi Syrup Golden 460ml 1 × 7,50 ; huit articles de matériel et deux d'emballage à 1 ou 4. L'écran écrit « 85 ? », « 2 ? », « 1 ? »,
« 11 ? » et marque chaque ligne « unité à préciser », alors que l'unité se lit presque toujours : 85 × 0,04 = 3,40 n'a de sens qu'en
grammes ; une levure liquide à 9,50 se compte au sachet ; un fermenteur, un robinet, un carton se comptent à la pièce. À côté, les points
de lecture (« Date », « Lignes », « Désaccord ») parlent une autre langue que la marque « unité ? » et que les rangées « douteuses ».

## À faire
1. Lire l'existant avant d'écrire (ne pas faire une couche parallèle, L11) : `src/domain/finance/invoicePoints.ts` (codes, `peserPoint`,
   `statutDeLecture`), `src/ui/depense/etat.ts` (`chipsDeLecture`, `CHIP_PAR_CODE`, `pireStatut`, `statutAffiche`), `src/services/ingredientIdentity.ts`
   (`isReadableUnit`), `src/services/stockLineMatching.ts` (`linkUnit`, `shortUnit`, `matchStockLine`, `formatUnitLink`, `SACHET_MAX_G`),
   `src/services/purchaseEntry.ts` (`stockQuantityFor`, la validation qui refuse une unité illisible, D214), `src/ui/depense/familles.ts`
   (`familleDe`), et l'usage de `douteux`, `unitePrecis`, `qte.inconnue` dans `src/ui/finance/ExpenseSheet.tsx` (lecture seule).
2. Module pur `src/ui/depense/confiance.ts` (aucun React, aucun réseau) :
   - `type Niveau = 'sur' | 'repris' | 'inconnu'` ; `interface Valeur<T> { niveau: Niveau; valeur?: T; raison: string }` (la raison en
     français court, pour le détail : « 85 × 0,04 = 3,40 : des grammes », « point de lecture : deux lectures diffèrent »).
   - `deduireUnite(ligne, contexte)` : l'unité imprimée lisible → `sur` (en `shortUnit`) ; sinon une déduction, chaque règle testée,
     avec son niveau : famille (`familleDe`), `kind`, quantité entière ou non, prix unitaire et montant (q × p = montant au centime),
     contenance ou poids dans le nom (« 460ml », « 11g »), unité de l'article relié, unité des autres lignes de la même famille sur la même
     pièce, sachet de levure (`SACHET_MAX_G`). Aucune règle ne rend `sur` sans qu'une seconde source la confirme ou que l'ambiguïté soit
     nulle (une pièce de matériel à 1) ; dans le doute, `repris` ; sans indice, `inconnu` (jamais une unité inventée). Une unité tapée par
     lui est `sur`.
   - `confianceLigne(ligne, contexte)` → `{ unite, quantite, prix, montant, famille, article }`, chacun une `Valeur` ; et
     `confianceEntete(lecture, brouillon)` → `{ date, fournisseur, total, tva, numero }`. Les points de lecture (`InvoicePoint`) qui
     pèsent deviennent le niveau du champ qu'ils visent ; une valeur absente est `inconnu` ; un calcul exact (q × p = montant) est `sur`.
   - `pireNiveau(valeurs)` pour la rangée et pour la pièce.
3. `PLAN.md` § « Correspondance » d'abord : une table code de point → champ → niveau, et une table des règles d'unité (indice → unité →
   niveau). Le principe à tenir : rouge seulement quand il doit remplir ou corriger (rien de lisible, ou une contradiction qu'aucune règle
   ne tranche) ; jaune quand une valeur est remplie sans certitude ; rien quand c'est sûr. Une seule couleur d'alerte (DESIGN.md) : rouge =
   jeton `alert`, jaune = jeton `attention` ; le module ne donne que le niveau, l'écran la couleur (voie suivante).
4. Mesure sur les 14 pièces du banc, hors ligne, aucun appel : lectures `work/finalisation-tickets-2026-10-08/H13-reels/banc-d272b-hl/results.json`
   (`records[i].variants['Csv8+N'].result`), vérités du banc (le skill `.claude/skills/banc-lecture/SKILL.md` dit où elles sont). Pour
   chaque ligne sans unité imprimée : unité déduite, niveau, unité vraie. Rendre le compte : `sur` justes / faux (cible : 0 faux), `repris`
   justes / faux, `inconnu`. Un `sur` faux est un défaut bloquant : la règle redescend en `repris`. Aucun nom d'achat privé (doc2, doc4,
   doc13) dans les tests ni dans RESULTAT.md.
5. Tests `tests/unit/depense/confiance/` : rouge d'abord (sur le code d'aujourd'hui, la forme doc14 de `tests/unit/depense/banc-k6/piece.ts`
   donne 12 lignes sans unité exploitable ; noter la sortie, « TEMOIN AVANT : »), puis : doc14 → Styrian Goldings 85 g `repris`, Wyeast
   2 sachets, matériel et emballage à la pièce, Candi Syrup à la pièce, aucun `inconnu` sur cette pièce ; une ligne vide ajoutée à la main
   → unité, quantité, prix, montant `inconnu` ; un prix et un montant qui ne concordent pas → `repris` ou `inconnu` selon la table ; une
   unité tapée jamais réécrite ; les points de lecture d'une lecture enregistrée du banc mappés sans perte (aucun point qui pèse sans niveau).
6. Ne branche rien dans l'écran ni dans l'enregistrement (voie f3). Dis dans RESULTAT.md ce que f3 devra changer : où l'unité déduite
   se pose dans le brouillon (un champ facultatif qui garde la trace `deduite`, la dépense gardant l'unité imprimée vide, D213), ce que la
   validation d'enregistrement (D214) doit accepter (`repris`) et refuser (`inconnu`).

## Critères (rejoués par le pilote)
- `npx vitest run tests/unit/depense/confiance --maxWorkers=2` : tout vert ; témoin rouge noté avant.
- `npx vitest run tests/unit/depense --maxWorkers=2` : rien de cassé (seul `tests/unit/depense/fiche/ecran.test.tsx` échoue hors copie,
  faute de `zxing-wasm` : connu, ne rien installer).
- `npx tsc --noEmit -p tsconfig.json` : aucune erreur dans tes fichiers.
- Le compte des 14 pièces : 0 `sur` faux.
- `git status --short` : rien hors de « Possède ».

## Possède
`src/ui/depense/confiance.ts`, `tests/unit/depense/confiance/**`, `work/missions/2026-10-31-ecran-depense/voies/f2-confiance/**`.

## Rendre
`RESULTAT.md` (ligne 1 `OK — …` ou `ECHEC — …`), selon COMMUN.md, avec le compte des 14 pièces et les tables. Réponse au pilote : une ligne.
