# Voie e-port — l'écran Nouvelle dépense devient r2b (le ticket) dans l'app

- Mission : 2026-10-31-ecran-depense
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (l'écran qui écrit une dépense, le stock et le justificatif Drive : argent, quantités, Drive)
- Plafond : 150 tours (dont 40 pour le plan) ; 3 essais par critère
- Dépend de : l2-rapprochement (c402cae8), r2-details (c44c8938), e-t2 (`critique/VERDICTS-v1.md`)
- Décideur en cas de doute : pilote ; l'option prudente et réversible

## Objectif
Le pilote a choisi **r2b** (D223, D227), parce que le brasseur a dit de ne pas attendre son retour. Ses mots :
« Tu me feras plusieurs propal, mais tu choisira une pour implémenter dans la vraie app » ; « Pas de bloquage sur une attente de mon
feedback c'est primordial ». Après cette voie, l'écran « Nouvelle dépense » de l'app (`ExpenseSheet`, ouvert par les actions
rapides et par le stock) est la maquette `work/missions/2026-10-31-ecran-depense/v1/r2b/etat.html`, reprise telle quelle,
geste par geste, dans ses 9 états (`BRIEF-ECRAN.md` § états ; `v1/r2b/NOTE.md`). Le bandeau, les tuiles Payé / TVA, les chips
numérotées des points, les 23 lignes dans l'ordre du papier avec leur montant, le doute réglé sur la ligne, la preuve, le pied
toujours actif, le reçu. Les mêmes jetons de couleur que l'app ; le thème suit.

Le port reçoit aussi :
1. **Les corrections du critique** (`critique/VERDICTS-v1.md`, « ### r2b », n° 1 à 4) : la pastille-mot de l'effet au stock à droite du
   picto (« +6 kg », « nouveau », « Target bis », « unité ? », greffe u4b) ; la bande collante « 1 2 3 4 5 6 · point courant · y aller »
   dès que le bandeau sort de l'écran (greffe z2b) ; plus de phrase « Tu n'es pas assujetti » (rien de déduit montré comme vrai) ;
   « Mettre en stock : oui / non » en interrupteur dont l'état se voit.
2. **Les greffes de « ## À porter »** du même fichier, sauf la rive stock de u4b à 1280 (hors de cette voie) : « — HT non imprimé »,
   « Même achat · ne pas doubler » et « Voir 380001 » (état 8), « octets · taille vérifiée » au reçu, « p. 2 coupée » dans la preuve,
   « mouture → Maris Otter » sur la sous-ligne rattachée, l'en-tête éditable sur place, « Drive à connecter » au bandeau.
3. **Ce que les voies de correction ont laissé à l'écran** :
   - la mouture (S5) est proposée et liée à son malt au seul geste du brasseur (« Rattacher les 5 » ou une à une) ;
   - le signal S8 (`purchaseSimilarOrders`) : autre numéro, même commande, même total (état 8) ;
   - la base de la date (A7) : on voit quelle date est retenue (facture ou livraison), sans en inventer une ;
   - le reçu reste affiché jusqu'à la fermeture ; `onSaved` reçoit le reçu ;
   - les gardes de r2 : `pendingId`, `proofSent`, `proofAttached`, leurs trois textes ; leurs tests restent verts ;
   - les points typés de l2 (`ScanPoint`) : les chips sont les points qui pèsent. Le statut vient de
     `statutDeLecture(scan, recomputeInvoicePoints(…))` (`src/domain/finance/invoicePoints.ts`), recalculé à chaque correction du
     brasseur. Une valeur qu'il a tapée n'est jamais écrasée. Les `remarques` restent lisibles.
4. **Deux libellés des vues Finances**, laissés par t1 :
   - « Achats de divers non projetés » : la clé brute de catégorie (`forecast.ts:125`) devient son libellé ;
   - « Prévision incomplète » (TA6, `FinanceForecastSummary.tsx:27`) dit ce qui manque, en une phrase vraie.

## Exigences communes
Lire et suivre `work/missions/2026-10-31-ecran-depense/voies/COMMUN.md`. Deux temps :
1. tu écris `COMPRIS.md`, lances G1, puis `PLAN.md`. Tu t'arrêtes et rends `PLAN PRÊT — <n> points` ;
2. le pilote fait relire le plan par deux regards neufs et te renvoie la revue triée ; ensuite tu codes.

Le plan tranche, et dit pourquoi :
- les composants : leur découpe et leurs noms, dans `src/ui/depense/` ;
- ce que deviennent `InvoiceScanReview` et les éléments actuels, avec le tableau « Rien ne se perd » : chaque fonction de l'écran
  d'avant se retrouve dans r2b, ou ailleurs avec sa raison ;
- la fixture de développement : sa facture 372765 en lecture simulée (`diagnostic/d1/lecture-simulee-372765.json`), sans son nom ni
  son adresse, chargée seulement sous `import.meta.env.DEV` et absente de `dist/` (même méthode que `src/ui/fermentescibles/apercuDev.ts`) ;
- les tests existants dont le texte changera : chacun est nommé, avec le comportement qu'il garde. Le pilote tranche avant le code.

Le business est juste à 100 % : une proposition perdue est permise, une fausse écriture ne l'est pas. Dans le doute, rien. Aucun appel
de service n'est ajouté ni retiré sans que le plan le dise. Les règles d'enregistrement, d'appariement et de lecture ne changent pas.

Exigences de l'interface (`.claude/rules/affinee-frontend.md`, DESIGN.md, docs/ui-compacte.md) :
- les champs passent par le composant protégé `Input` (`scripts/audit_inputs.mjs`), jamais `type="number"` ;
- cibles et densité selon DESIGN.md ;
- 100 mots au plus au premier écran, comme la maquette ;
- aucun débordement horizontal à 390 ;
- le pied « Confirmer et enregistrer » est visible et toujours actif.

## Possède
- `src/ui/finance/ExpenseSheet.tsx`, `src/ui/finance/InvoiceScanReview.tsx` ;
- `src/ui/depense/` (neuf : composants, styles, fixture de développement) ;
- `src/ui/ModalShell.tsx`, pour la seule prop facultative `size` (T2 de REVUE-PLAN.md) ; `tests/unit/depense/raccord/ecran-recu.test.tsx`, pour le seul reçu qui reste (T5) ;
- `src/components/QuickActionModal.tsx`, pour le seul crochet de développement qui ouvre la fixture, sous `import.meta.env.DEV` ;
- `src/domain/finance/forecast.ts` (le libellé de la ligne 125), `src/ui/finance/FinanceForecastSummary.tsx` (la phrase TA6) ;
- `tests/integration/expenseSheet.test.tsx`, `tests/unit/depense/ecran/` (neuf) ;
- `work/missions/2026-10-31-ecran-depense/voies/e-port/`.

Interdits :
- `src/services/` en écriture (`purchaseEntry.ts`, `stockLineMatching.ts`, `purchasePrefill.ts`, `geminiScanner.ts`, `financeDocuments.ts`) ;
- `src/domain/finance/invoicePoints.ts`, `functions/` ;
- `src/pages/BrewWizard.tsx`, `src/ui/fermentescibles/`, `src/ui/identite/` (d'autres voies y écrivent cette nuit) ;
- les tests hors Possède (ils restent verts sans être modifiés) ;
- tout ce que COMMUN.md interdit.

## D'abord
Écris `COMPRIS.md` (Objectif, Écrit dans, Fini quand, Ne fait pas, Doutes) et lance G1. Lis `v1/r2b/etat.html` et `NOTE.md` en entier,
puis `critique/VERDICTS-v1.md`, `src/ui/finance/ExpenseSheet.tsx` et ses tests. Ensuite, écris le plan.

## Critères
`GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine. G2 attend la revue triée du pilote.
G7 : tu écris `voies/e-port/capturer-depense.mjs` (puppeteer-core, comme `voies/p8-port/capturer-malts.mjs` de la mission
Malts). Il joue sur l'app servie les 9 états et les 6 retouches de `v1/r2b/verifier-retouches.mjs`, à 390 tactile, 390 souris et 1280.
Il écrit chaque scène côte à côte (l'app à gauche, la maquette à droite) dans `voies/e-port/captures/`. Il imprime `DEPENSE OK`
seulement si tout ce qui suit est vrai :
- chaque geste a l'effet de la maquette ;
- aucune erreur de console ;
- aucun débordement horizontal ;
- le pied est visible au repos ;
- aucune requête hors localhost.

Ouvre une à une en image au moins le repos, un point réglé, la preuve, la TVA, l'enregistré et une erreur, aux trois modes.

## Rendre
`RESULTAT.md`, écrit section par section, au format de COMMUN.md :
- ligne 1 `OK — …` ou `ECHEC — …` ;
- « TEMOIN AVANT : … » ;
- le tableau « Rien ne se perd » ;
- ce qui diffère de la maquette, et pourquoi ;
- les captures ouvertes ;
- `LEÇON PROPOSÉE : …` et `CONNAISSANCE : …`.

Puis une ligne au pilote.
