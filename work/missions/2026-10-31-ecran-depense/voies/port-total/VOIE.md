# Voie port-total — les frais de port « Total seulement », jamais un article ni une rangée de la dépense (D249, D258)

- Mission : 2026-10-31-ecran-depense
- Agent : auteur ; modèle : sonnet ; niveau : jugement (argent, contrôle de somme, enregistrement)
- Plafond : 80 tours (dont 30 pour le plan) ; 3 essais par critère
- Décideur en cas de doute : pilote ; l'option prudente et réversible

## Objectif
Ses mots (SPEC-BRASSEUR, 01.11 soir) : frais de port « Total seulement » partout, « Non non aussi quand imprimé article » (D249). Le port
n'est jamais une ligne de stock, d'écran ni de mouvement : il compte dans le total, il se dit à part (« dont port »), et le contrôle
« somme = imprimé » en tient compte. Il reste une entrée `shipping` de `finance.lines` (la comptabilité exige Σ lignes = total,
`ledger.ts:170`) : ne l'en retire pas. Cela remplace la lecture étroite d'avant (commandes en captures seulement, `work/missions/2026-11-01-banc-lecture/GESTES.md`,
la ligne du port).

**Interface d'origine, remplacée par D258** (le § « Décisions du pilote sur le plan » prime ; gardée pour mémoire) :
- le port, ce sont les lignes de la lecture dont `kind === 'shipping'` (le schéma de lecture a déjà ce genre) ;
- l'écran les montre en « dont port <montant> » sous le total, jamais dans une bande : c'est la voie **p3c-port**, pas la tienne ;
- (remplacé par D1 : le port reste une entrée `shipping` de `finance.lines`) le total TTC enregistré reste le total imprimé (port compris) ;
  aucun article de stock, aucun mouvement pour le port ;
- le contrôle « somme des lignes = imprimé » compte le port (Σ lignes hors port + port = total) : vérifie s'il le fait déjà.

## Ce qui est à trancher sur le code (dans le plan, avec la raison)
1. Où la règle vit : construction de la dépense (`src/services/purchaseEntry.ts` et ce qui l'appelle), normalisation de la lecture
   (`functions/src/invoiceScanCore.ts`), ou les deux ; **le schéma Firestore ne change pas** (si la règle semble l'exiger : arrête-toi et
   dis-le dans le plan).
2. Une dépense déjà enregistrée avec une ligne de port reste lisible et juste (rien ne se perd).
3. Une ligne de port lue sous un autre genre (« Versand », « Fracht », « Livraison » en `service`) : la reconnaître ou non, et comment,
   sans deviner (lecture étroite, L01 : ne reconnaître que ce qui est sûr, et le dire).
4. Le banc : la vérité de ses deux pièces où le port est un article se corrige, et le juge ne compte plus le port comme une ligne, des deux
   côtés ; rejeu hors ligne avant/après (aucun appel Gemini), aucune pièce ne doit perdre un point.

## Exigences communes
Lis et suis `work/missions/2026-10-31-ecran-depense/voies/COMMUN.md` (sauf sa dernière règle sur l'écran : ici rien de l'écran n'est
touché). Deux temps :
1. `COMPRIS.md` (Objectif, Écrit dans, Fini quand, Ne fait pas, Doutes), puis `PLAN.md` (défauts visés, changements fichier par fichier,
   tests qui échoueront d'abord, rejeu du banc, risques). Tu t'arrêtes et rends `PLAN PRÊT — <n> points`.
2. Le pilote fait relire le plan et te renvoie la revue triée ; ensuite tu codes.
Écris `RESULTAT.md` **section par section dès le début** (L18).

## Possède
- `src/services/purchaseEntry.ts`
- `tests/unit/purchaseEntry.test.ts`
- `functions/src/invoiceScanCore.ts` (si le plan l'y met)
- `tests/unit/depense/port/` (neuf)
- `scripts/banc-lecture-facture.ts` (règle du port seulement)
- `scripts/banc-lecture-facture-juger.ts` (règle du port seulement)
- `tests/unit/banc-lecture-facture.test.ts` (l'attente liée au port seulement, s'il y en a une ; sinon « non modifié »)
- `tests/unit/banc-lecture-k5.test.ts` (l'attente liée au port seulement : il appelle `judgeResult`)
- `work/missions/2026-11-01-banc-lecture/GESTES.md` (la ligne du port)
- `work/missions/2026-10-31-ecran-depense/voies/port-total/**`

Hors Git : les vérités du banc de ses **trois** pièces à port-article (doc5, doc8, doc9 ; dossier `REELS_DIR` du banc). N'en copie rien
dans Git, n'écris aucune de leurs valeurs dans tes rapports.

## Décisions du pilote sur le plan (01.11)
- D1 : **une seule forme (A′, D258), pas de `draft.port`.** Le port reste une ligne `kind === 'shipping'` de `draft.lines` ;
  `validatePurchase` et `recalculerLecture` le comptent déjà (Σ lignes = total) ; **ni `separerPort`, ni `lignesPourControle`, ni
  `draft.port`, ni `portDe`, ni `estPort`, ni `portEnregistre`** dans ta voie (après la revue : l'écran seul a besoin du critère, il vit
  chez p3c-port ; `portEnregistre` n'aurait aucun appelant, il ira à la voie p3c-finances). `savePurchase` **ne change pas** : il refuse
  déjà une action de stock ou de matériel sur une ligne hors nature stockable, et n'écrit ni `stockItemRef`, ni `equipmentRef`, ni reçu
  pour `stockAction: 'none'`. Tu **épingles** ce comportement par des tests (ligne `shipping` + `stockAction` ≠ `none` refusée ; ligne
  `shipping` écrite en entrée `shipping` de `finance.lines`, sans référence, sans mouvement ; TVA identique à celle du même brouillon où
  le port serait une ligne `service`). Ils passent déjà sur HEAD : dis-le tel quel dans TEMOIN AVANT.
- **Règle du port à l'écran (pour mémoire, codée par p3c-port)** : une ligne est « du port » si `kind === 'shipping'`, son montant est
  un nombre valide ≥ 0 (centimes entiers), et toutes les lignes du brouillon ne sont pas du port ; sinon elle reste une rangée
  ordinaire, visible et corrigeable.
- P6 (port lu sous un autre genre) : **lecture étroite, pas de code.** Seul `kind === 'shipping'` compte ; pas de `portProbable` (personne
  ne l'afficherait : ce serait une couche morte). RESULTAT.md compte, sur les vérités du banc, les lignes de port lues sous un autre genre
  (nombre seulement, aucune valeur) : c'est l'entrée d'un geste de consigne plus tard, mesuré au banc.
- D2 : les vérités de doc5, doc8 et doc9 se corrigent toutes trois.
- D4 : `tests/unit/banc-lecture-facture.test.ts` entre dans ton Possède, pour l'attente du port seulement.

Interdits : `src/ui/**` (l'écran est à p3c-port), `src/ui/finance/ExpenseSheet.tsx`, `src/domain/finance/invoicePoints.ts` sauf si le
plan prouve que le contrôle de somme y vit et que le pilote l'accorde ; tout ce que COMMUN.md interdit ; aucun déploiement, aucune
installation, aucun commit, pas de `git stash`, aucun appel Gemini. Chemins absolus dans Bash ; aucun code écrit par heredoc ni `node -e`.

## Critères
`GATES.md`, même dossier. Ne le modifie pas. Lance chaque `CHECK:` depuis la racine du worktree.

## Rendre
`RESULTAT.md` : ligne 1 `OK — …` ou `ECHEC — …` ; « TEMOIN AVANT : … » (les tests qui échouaient avant) ; ce qui ne se perd pas ; rejeu
du banc avant/après ; `LEÇON PROPOSÉE : …` et `CONNAISSANCE : …`. Puis une ligne au pilote.
