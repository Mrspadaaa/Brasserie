# Reprise cal-30 (21.11) : suite de REPRISE-CAL-29 ; CHG-4 et CHG-5 verts, CHG-6 en cours, RIEN commité

S = scratchpad `C:/Users/mrspa/AppData/Local/Temp/claude/2574149e6fd34767/16fc09ec-4e69-48a9-9744-5912b6ef6552/scratchpad`. Worktree code : `port-carnet` (branche claude/port-carnet-1711). BUGS.md : checkout `../Brasserie` (branche claude/refonte-houblons-v4), lignes 2130-2132 ; PAS dans port-carnet.

## Fait (cette passe)
- CHG-4 : étape corrigée (boucle de ramenée `k < 6 && b.l - fr.l < 110`). Copie isolée sur l'arbre : OK (« début allongé 2027-01-25 → 2027-01-11 », −14 j, rechargement ok).
- CHG-5 : 3 ok sur l'arbre (date, période, place). Rouge sur tour8 NON encore rejoué.
- CHG-6 : cause trouvée en deux temps. (1) Le clone `B-ZZ-CUVE` gardait le cycle de la recette (`recipeSnapshot.fermentation`) : fin connue, donc pas `finInconnue`, donc pas de bord. Corrigé dans l'étape (`finPrevue: null`, `fermentation = []`). (2) `boite('ZZ TEST Cuve')` prenait la proposition « brassin habituel » (data-probable) : sélecteur corrigé en `[aria-label^="${n},"]:not([data-probable])`. Message du corps testé AVANT la fin sur ce même brassin (Milk Stout est hors des 3 mois). Étape pas encore vue verte : dernier run (`$S/chg-arbre2.log`, tâche bdn3l1e35) lancé, 1 ligne après 25 min (machine saturée, ~63 Chrome) ; à relancer seul si vide.
- Code (Barre.tsx l. 309 `peutBord`, calendrier.ts l. 872 raison) inchangé : jusqu'ici aucune preuve que le code a tort. Si CHG-6 reste rouge une fois la barre réelle choisie, diagnostiquer `peutBord`/`allongerBrassin` (calendrierGestes.ts l. 296-345 : `ecrite = chose.preteLe ?? chose.fin`, `nouvelle <= prevu` refuse).
- Fichiers préparés pour le commit (HEAD + mes hunks seuls), déjà vérifiés par diff :
  - `$S/jour/CalendrierTab.mien.tsx` (9 hunks : CoteBord, dureeDebutTiree, fenetreAvant/rendreFenetre, surBord/surLacheBord, `if (!fenetreAvant.current)`), exclus : CHN-9, CHN-3, déplacement onRenommer/onRetirer/onSupprimer.
  - `$S/jour/calendrier.mien.ts` (seul hunk CHG-6 l. 872 ; le hunk `causeSoldeInconnu` n'est pas à moi).
  - Script : `node $S/hunks.cjs <chemin> <sortie> <exclureRegex|-> [inclureRegex]` (applique à HEAD, n'écrit rien dans l'arbre).
  - Message : `$S/jour/msg-chg.txt`.
- calendrierGestes.ts et tests/integration/calendrierFrise.test.tsx : aucun diff vs HEAD (déjà commités). Barre.tsx, usePointeur.ts, tests/unit/calendrierGestes.test.ts : diffs entièrement miens.

## Reste
1. Run arbre : `node scripts/parcours/geste-moi.mjs $S/jour/X-arbre --build $S/cal-24/build --largeurs 390 --themes clair --endroits calendrier > $S/chg-arbre3.log 2>&1` en fond (le run complet est long, 10 à 25 min ; ne rien lancer d'autre en parallèle). Régénérer avant : `sh $S/regen.sh`. Filtre : `grep -E "KO |PARCOURS GESTE|ok  (fin d’un|annuler en|bord de début)"`. Attendu : CHG-6 « fin posée » et « message du corps » ok.
2. Rouge tour8 : même commande avec `--build C:/Users/mrspa/AppData/Local/Temp/parcours-geste-build-O82816`, filtrer sur « annuler en » (CHG-5 doit être KO) ; CHG-4 et CHG-6 aussi KO attendus.
3. vitest : `npx vitest run calendrierEntete toucherFantome tests/integration/calendrier | tail -30` ; seuls les 2 rouges CRITIQUE-12 (« Papiers en An ») d'autres voies admis.
4. Supprimer `scripts/parcours/geste-moi.mjs` (non suivi, temporaire).
5. Commit par index temporaire (depuis port-carnet) : `node $S/cal-24/commit.mjs $S/jour/msg-chg.txt src/ui/calendrier/frise/usePointeur.ts src/ui/calendrier/frise/Barre.tsx tests/unit/calendrierGestes.test.ts src/components/tabs/CalendrierTab.tsx=$S/jour/CalendrierTab.mien.tsx src/domain/calendrier.ts=$S/jour/calendrier.mien.ts scripts/parcours/geste.mjs=$S/jour/geste-c.mjs` ; geste-c.mjs se génère par `node $S/cal-24/geste-mien.mjs $S/jour/geste-c.mjs "  // ── CHG-4 (21.11" "  // ── CAL-VIDE (21.11" "  await sectionBarreBord();" $'  await sectionBarreBord();\n  await sectionChg4();\n  await sectionChg5();\n  await sectionChg6();'` (ou `sh $S/jour/commit-geste.sh` avec les mêmes arguments, qui le fait). Régénérer CalendrierTab.mien.tsx et calendrier.mien.ts avec hunks.cjs juste avant (l'arbre bouge). Contrôle : `git show --stat HEAD`.
6. BUGS.md (checkout ../Brasserie, lignes 2130-2132) : état « corrigé », sha du commit dans la colonne commit ; `node scripts/agents/controle-bugs.mjs` (depuis ../Brasserie) doit répondre OK ; commit de BUGS.md seul.

## Ajout (dernier run, $S/chg-arbre2.log, fini)
- CHG-4 ok, CHG-5 ok. CHG-6 KO : « ZZ TEST Cuve » introuvable sauf `ZZ TEST Cuve, proposé,@183` (data-probable). Donc la barre vue jusqu'ici (l 183, w 24) était TOUJOURS la proposition « brassin habituel », jamais le brassin cloné : le test et le message précédents ne prouvaient rien sur le brassin réel.
- À chercher : pourquoi le clone `B-ZZ-CUVE` ne donne pas de barre brassin : `choseBrassin` (calendrier.ts l. 813+) renvoie null si `jourZero` vide ou `hasBrewStarted` faux ; le cache imprimé n'a pas `actualBrewDate` (l'`Object.assign` de l'étape l'écrit ; vérifier ce que la page relit : cache `CLE_CACHE` vs fixture `CLE_FIXTURE`, clé `data` vs champs à plat). Sonder dans la page : `[data-chose]` dont le data-id vaut `brassin-B-ZZ-CUVE`. Si le brassin n'existe pas dans le DOM, corriger l'injection (champs lus par `jourZero`/`hasBrewStarted`) ; sinon diagnostiquer `peutBord`.
