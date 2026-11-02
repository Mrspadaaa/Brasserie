# Voie n1-nom-fr — son choix B : l'article en français, le nom imprimé gardé, toute facture suivante se relie (D289)

Agent : `auteur` (Sonnet). Plafond : 120 tours (plan : 40 au plus). Deux temps, comme `../COMMUN.md` § « Deux temps » : relis tout
`../COMMUN.md` (il vaut ici, sauf « L'écran n'est pas refait ici » : la seule interface touchée est dite plus bas). Aucun commit, aucun
déploiement, aucun appel réseau hors localhost, Gemini toujours simulé. Copie isolée pour les tests :
`node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "<commande>"`.

## Ses mots (SPEC-BRASSEUR, mot pour mot) — règle n° 1 : son choix est respecté
- 02.11, sur la page de choix c-nom (https://claude.ai/artifact/5zPHv4HDbgPzhnwNchQmBg) : « Oui b c'est très bien ».
  Option B : « En français ; l'imprimé gardé à la fiche ». Ni C, ni D, ni E, ni F.
- 01.11 (D271) : « Langue utilisée pour les factures, allemand, anglais, français, italien. Ça traduits en français et fait le bon lien ».
- 31.10 : « Attention au mapping, on veut pas de retrouver avec plein de fiche du même produit ».
- La maquette de B : `work/missions/2026-10-31-ecran-depense/choix-nom/img/b-depense.png`, `b-stock.png`, `b-suivantes.png`
  (sources `choix-nom/maquettes/b-*.html`). Ouvre-les.

## Les faits mesurés par le pilote (02.11, `matchStockLine` sur l'arbre actuel ; D288)
- Aujourd'hui (D281) : la rangée montre `nameFr` (« Malt de Vienne »), mais le nouvel article est créé sous le nom imprimé
  (`articleNeufDe(…, line.articleName, …)`, `purchaseEntry.ts` ~l. 376 et ~l. 457 ; le champ « article « … » » du plateau, `ExpenseSheet.tsx`).
- Le lien entre langues ne tient que sur des mots communs : « Premium Pilsner Malz » relie « Premium Pilsner Malt » et « Malt Pilsner
  Premium » ; « Wiener Malz » ne relie ni « Vienna Malt » ni « Malt de Vienne » ; « Haferflocken » ne relie pas « Flocons d'avoine » ;
  « Röstgerste » ne relie pas « Orge torréfiée » ; un article « Malt de Vienne » ne relie pas une ligne « Wiener Malz ».
- `StockItem` (`src/types/index.ts`) n'a aucun champ pour un nom imprimé. Les règles Firestore ne limitent pas les champs d'un article
  (`firestore.rules` l. 176 à 182 : seul `currentStock` est contrôlé) : un champ facultatif ajouté passe sans toucher aux règles.
- `nameFr` arrive après la lecture, sans l'attendre (`traduireLignes`, `src/services/nomsFr.ts`) ; hors ligne ou en échec, il n'arrive pas.
- Son stock réel mêle déjà des articles en français (ses saisies) et des articles au nom imprimé allemand (nés de factures, avant B).

## Ce que B demande (les défauts visés)
- **N1 — le nom au stock** : un nouvel article venu d'une ligne lue entre sous son nom français (`nameFr`, nettoyé par `nomAffiche`
  comme la rangée), et le champ « article « … » » du plateau le montre. Un nom que le brasseur a tapé (`articleName`) ou un libellé corrigé
  (`retenirNomBrasseur`) gagne toujours. Sans `nameFr` (hors ligne, échec, « Confirmer » avant son arrivée), le nom imprimé, comme
  aujourd'hui : jamais d'attente bloquante.
- **N2 — le nom imprimé gardé** : l'article créé garde le nom imprimé de la ligne dans un champ facultatif nouveau de `StockItem` (le plan
  le nomme ; une liste, pour qu'un article garde les noms des factures de plusieurs langues). Ajout seulement : un article d'avant B,
  sans ce champ, reste lisible et juste. Aucune migration, aucun article existant renommé.
- **N3 — toute facture suivante se relie** : une ligne se relie à un article quand son nom imprimé égale un nom imprimé gardé de
  l'article (lien sûr), ou quand son `nameFr` désigne l'article selon les mêmes règles que le nom imprimé aujourd'hui (même niveau de
  confiance que ces règles donnent : D277, sûr / repris jaune / inconnu rouge ; pas de niveau inventé). Les cas mesurés ci-dessus
  deviennent des tests qui échouent d'abord. Le lien qui arrive avec `nameFr` (après la lecture) remplace une proposition « nouvel
  article » encore intacte, jamais un choix du brasseur.
- **N4 — le lien appris** : quand une ligne d'une autre langue est reliée à un article et que la dépense est confirmée, le nom imprimé de
  cette ligne s'ajoute aux noms gardés de l'article (une fois, sans doublon), pour que la facture suivante se relie sûrement.
- **N5 — à la fiche** : la fiche de l'article au stock (`src/ui/StockDetailSheet.tsx`) montre sous « Nom », en petit, « Sur la facture :
  … » (les noms gardés), comme `b-stock.png`. Rien dans la liste du stock (ce serait C). Aucun autre changement d'interface.

## Les pièges à trancher dans le plan
- **Deux candidats** : son stock a « Flocons d'Avoine » (français) et « Haferflocken » (allemand, d'avant B). Une ligne « Haferflocken »
  dont le `nameFr` est « Flocons d'avoine » désigne les deux : jamais un lien d'office vers l'un en silence ; le plan dit ce que l'écran
  fait (la règle d'ambiguïté existante, testée). La fusion des doublons (D) n'est pas demandée.
- **Une fiche par produit** (S6, `nomsPris`, « bis » de D215, `regleProduit`) : un nom français déjà pris par un article ou une autre
  ligne de la même saisie ne crée pas un second article ; les règles de S6 et D215 restent vraies avec le nom français.
- **Les branchements f4** (enrichissement, `voies/f4-enrichir/RESULTAT.md` § P5) sont posés depuis le 02.11 (D290 : `planifierEnrichissement`
  dans `purchaseEntry.ts`, `tenirEnrichissement` dans `ExpenseSheet.tsx`, `valeurLueDe` dans `stockLineMatching.ts`, `fiche` dans
  `StockItem`) ; leurs témoins `tests/unit/depense/enrichir/**` restent verts. La fiche d'un nouvel article se cherche par sa clé
  (`ficheCle.ts`, sur ses mots) : dis dans le plan si le nom français change la clé, et ce qui en découle.
- **Hors ligne et double clic** : la dépense hors ligne crée l'article au nom imprimé avec ce nom gardé ; rien ne casse la file d'envoi.

## Possède
`src/services/stockLineMatching.ts`, `src/services/purchaseEntry.ts`, `src/domain/stock/articleNeuf.ts`, `src/types/index.ts` (le seul
champ nouveau de `StockItem`), `src/ui/finance/ExpenseSheet.tsx` (le nom de l'article neuf et le lien venu de `nameFr`),
`src/ui/StockDetailSheet.tsx` (N5 seulement), `tests/unit/depense/nom-b/**`, `scripts/check-invoice-journey-emulator.mjs` (un cas nouveau
`nom-b`, hors `ALL_CASES` s'il le faut, les autres cas inchangés), `work/missions/2026-10-31-ecran-depense/voies/n1-nom-fr/**`.
Si un autre fichier doit changer, le plan le dit et le pilote tranche.

## Critères (le pilote les rejoue)
1. Les témoins N1 à N5 échouent sur l'arbre d'aujourd'hui (sortie sous « TEMOIN AVANT : »), puis passent.
2. `npx vitest run tests/unit/depense --maxWorkers=2` (copie isolée) : tout vert, aucun test existant modifié hors de ton « Possède ».
3. `npx tsc --noEmit -p tsconfig.json` et `npm run build` (copie isolée) : 0 erreur.
4. Bout en bout sur l'émulateur : `bash work/missions/2026-10-31-ecran-depense/voies/e-bout/lancer.sh <dossier de ta voie>/bout
   <cas> 390,1280 work/finalisation-tickets-2026-10-08/H13-reels/jus0/rejeu-d272b.json
   work/finalisation-tickets-2026-10-08/H13-reels/banc-f5c-prod-paires/results.json` avec doc14 et le cas `nom-b` : après « Confirmer »
   de doc14, les nouveaux articles portent leur nom français et gardent le nom imprimé ; une seconde facture fictive du même produit dans
   une autre langue (« Vienna Malt » ou « Malt de Vienne » contre « Wiener Malz ») se relie à l'article, sans nouvel article. 0 KO.
   Aucun « hmr update » ni « page reload » dans vite.log pendant la passe (L17). Ouvre les captures (L12).
5. Rien ne se perd : les six autres pièces (doc1 à doc6) rejouées au bout en bout, 0 KO.

## Rendre
`RESULTAT.md` (format de `../COMMUN.md` § « Rendre »). Temps 1 : `PLAN.md`, puis `PLAN PRÊT — <n> défauts`. Temps 2 : une ligne,
`N1 OK — …` ou `N1 ECHEC — …`.
