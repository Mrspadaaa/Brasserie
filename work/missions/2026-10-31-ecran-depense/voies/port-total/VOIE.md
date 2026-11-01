# Voie port-total — les frais de port « Total seulement », jamais une ligne de la dépense (D249)

- Mission : 2026-10-31-ecran-depense
- Agent : auteur ; modèle : sonnet ; niveau : jugement (argent, contrôle de somme, enregistrement)
- Plafond : 80 tours (dont 30 pour le plan) ; 3 essais par critère
- Décideur en cas de doute : pilote ; l'option prudente et réversible

## Objectif
Ses mots (SPEC-BRASSEUR, 01.11 soir) : frais de port « Total seulement » partout, « Non non aussi quand imprimé article » (D249). Le port
n'est jamais une ligne de la dépense : il compte dans le total, il se dit à part (« dont port »), et le contrôle « somme = imprimé » en
tient compte. Cela remplace la lecture étroite d'avant (commandes en captures seulement, `work/missions/2026-11-01-banc-lecture/GESTES.md`,
la ligne du port).

**Interface fixée par le pilote** (la voie p3c-port, qui porte l'écran, s'appuie dessus ; ne la change pas sans le dire dans le plan) :
- le port, ce sont les lignes de la lecture dont `kind === 'shipping'` (le schéma de lecture a déjà ce genre) ;
- l'écran les montre en « dont port <montant> » sous le total, jamais dans une bande : c'est la voie **p3c-port**, pas la tienne ;
- l'enregistrement de la dépense ne les écrit **pas** comme lignes ; le total TTC enregistré reste le total imprimé (port compris) ;
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
`src/services/purchaseEntry.ts` et ses tests, `functions/src/invoiceScanCore.ts` (si le plan l'y met), `tests/unit/depense/port/` (neuf),
`scripts/banc-lecture-facture.ts` et `scripts/banc-lecture-facture-juger.ts` (règle du port seulement), les vérités du banc de ses deux
pièces à port-article (dossier `REELS_DIR` du banc, hors Git : n'en copie rien dans Git, n'écris aucune de leurs valeurs dans tes
rapports), `work/missions/2026-11-01-banc-lecture/GESTES.md` (la ligne du port), `work/missions/2026-10-31-ecran-depense/voies/port-total/**`.

Interdits : `src/ui/**` (l'écran est à p3c-port), `src/ui/finance/ExpenseSheet.tsx`, `src/domain/finance/invoicePoints.ts` sauf si le
plan prouve que le contrôle de somme y vit et que le pilote l'accorde ; tout ce que COMMUN.md interdit ; aucun déploiement, aucune
installation, aucun commit, pas de `git stash`, aucun appel Gemini. Chemins absolus dans Bash ; aucun code écrit par heredoc ni `node -e`.

## Critères
`GATES.md`, même dossier. Ne le modifie pas. Lance chaque `CHECK:` depuis la racine du worktree.

## Rendre
`RESULTAT.md` : ligne 1 `OK — …` ou `ECHEC — …` ; « TEMOIN AVANT : … » (les tests qui échouaient avant) ; ce qui ne se perd pas ; rejeu
du banc avant/après ; `LEÇON PROPOSÉE : …` et `CONNAISSANCE : …`. Puis une ligne au pilote.
