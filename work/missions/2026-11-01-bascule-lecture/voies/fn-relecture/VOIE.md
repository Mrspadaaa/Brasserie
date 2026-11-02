# Voie fn-relecture — relecture indépendante de fn-csv8 (D247, D251)

Agent `relecteur` (Sonnet), 30 tours au plus. Décideur : pilote. Tu ne refais pas le travail : tu le juges contre son contrat.

## Le contrat jugé
`work/missions/2026-11-01-bascule-lecture/voies/fn-csv8/VOIE.md` : `scanInvoiceSafely` passe de A à la variante `Csv8` du banc,
lue avec N, **à l'identique**. Le rapport de l'auteur est `voies/fn-csv8/RESULTAT.md`. Ne le crois pas sur parole (L16) : chaque point
se vérifie dans le code ou par un test.

## L'oracle
`scripts/banc-lecture-facture.ts` : `Csv8`, `needsThird`, `needsThirdLite`, `finalOfTwo`, `finalOfLite`, `finalOfStarVote`,
`withCodesNormalized`, `parseOptionsOf`, `LITE_RAISED_OUTPUT`. Mesures : `work/missions/2026-11-01-banc-lecture/GESTES.md`.

## Le code jugé (diff contre HEAD)
`git diff HEAD -- functions/src` et le nouveau module `functions/src/invoiceScanVote.ts` ; les tests
`tests/unit/invoiceScanCsv8.test.ts`, `tests/unit/invoiceScanVote.test.ts` et les tests adaptés (`git diff HEAD -- tests`).

## Questions, dans l'ordre
1. **Parité.** Le module rend-il, pour toute paire de lectures, la même finale que le banc (valeurs, statut, constats, points de
   désaccord, nombre de lecteurs) ? Cherche un cas que les 55 tests de parité ne couvrent pas (lecture vide, une seule ligne, devise
   absente d'un côté, total manquant, plafond de 35 lignes, lecture 3.8 elle-même coupée) ; écris-le en test dans ta voie et rejoue-le
   sur les deux. Les deux divergences que l'auteur assume (`failure` en texte, option `force`) : sont-elles sans effet sur la finale ?
2. **N, sans élargissement.** `isoCurrency` et le plafond de lignes reprennent-ils exactement `withCodesNormalized` du banc, ni plus
   ni moins ? Une valeur que le banc laisse passer est-elle réécrite par la production, ou l'inverse ?
3. **Appels.** Modèle, consigne (`INVOICE_SCAN_PROMPTS[0..2]`), `maxOutputTokens` (8 192 pour la Flash-Lite, 5 100 pour la 3.8),
   réflexion, température, résolution : identiques au corps du banc pour `Csv8` ? Trois appels au plus par justificatif ?
4. **Ce qui ne devait pas changer.** Budget (réserve avant chaque appel, coût par modèle, `geminiCosts.ts`), délais (100 s, 45 s),
   `ligneJournalLecture` (aucun contenu de facture dans le journal ; le champ `model` ajouté à côté), `phraseCoupure`,
   `pointLectureCoupee`, cache par empreinte, forme d'`AiTaskResult` (`model` = `SCAN_MODEL`, D251), autres chemins d'`aiTask`.
5. **Pannes.** Une Flash-Lite en délai ou refusée par le budget : la 3.8 est-elle appelée sans dépasser le délai global ? La 3.8 en
   échec après désaccord : la coupure est-elle dite ? Jamais « Lecture indisponible » quand la 3.8 a lu ?
6. **Tests.** Les tests ajoutés échouaient-ils sur A (rejoue-en un échantillon contre `git show HEAD:functions/src/ai.ts` copié dans
   `os.tmpdir()`, jamais en remettant un fichier du dépôt à HEAD) ? Un test adapté a-t-il perdu son intention ?

## Commandes
- `npx vitest run --maxWorkers=2 $(grep -rln "scanInvoiceSafely\|reconcileInvoiceVision\|invoiceScanVote\|runBudgetedInvoiceScan\|invoiceScanCore" tests --include=*.ts --include=*.tsx) tests/unit/banc-lecture-facture.test.ts tests/unit/depense/rapprochement/lecture-coupee.test.ts`
- `npm --prefix functions run build` et `npx tsc -p functions --noEmit`.
- Gemini toujours simulé : aucun appel réel, ni le banc avec `--reel`.

## Possède
`work/missions/2026-11-01-bascule-lecture/voies/fn-relecture/**` (tes tests de parité supplémentaires y vivent, importés par chemin
relatif, lancés par `npx vitest run <chemin>` ; s'ils doivent entrer dans `tests/`, propose-le). Rien d'autre : aucune correction du
code jugé, aucun commit, aucune installation, pas de `git stash`. Ne touche jamais `.codex/hooks.json`,
`source4-portable-bundle-manifest-01.json`, `functions/.env` ; ne lis ni `functions/.env` ni `functions/.secret.local`. Chemins absolus
dans Bash ; aucun code écrit par heredoc ni `node -e`.

## Retour
`voies/fn-relecture/VERDICT.md` : pour chaque question, OK ou défaut (fichier:ligne, cas qui échoue, correction attendue), classé
bloquant ou non. Puis une ligne : `FN-RELECTURE ACCEPTE — …` ou `FN-RELECTURE REJETTE — <défauts bloquants>`.
