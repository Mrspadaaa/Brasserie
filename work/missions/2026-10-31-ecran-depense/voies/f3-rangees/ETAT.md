# État de reprise — voie f3-rangees, passe 2 (verdict VERDICT-f3.md, 01.11 nuit)

Passe 1 : rendue (RESULTAT.md, OK). Décisions du pilote : (1) la ligne enregistrée garde la base, FinanceLine inchangé ; (2) Stk face à kg → nouvel article d'office, accepté.
À ne pas casser (pilote, défaut 2) : `nomsJeton`, `traduireLignes(...)` en fin d'applyOutcome, `nom=` avec `line.nameFr&&!article`, l'onChange du Libellé
(vide `nameFr`, `retenirNomBrasseur`) ; test `tests/unit/depense/noms-fr/ecran-noms.test.tsx`.

| N° | À faire | État |
|---|---|---|
| 1 | BLOQUANT : plateau p3c-3, le reste derrière « plus » | fait, vert (tests-p2d) |
| 2 | Défaut 8 : segments g / kg / Stk | fait, vert |
| 3 | Détails : Somme = imprimé sur une ligne ; ✓ Qté × prix 9/9 ; « Payé · date ? » rouge ; « 80,46 + port 12,00 » ; « 0,00 + ? » tout rouge | fait |
| 4 | Banc `commande` : un relié, un bis, un rouge d'unité ; captures 390 et 1280, repos et plateau, ouvertes | fait (captures-p2b, F3 CAPTURES OK) |
| 5 | Tests, tsc, build (copie isolée) ; git status ; RESULTAT.md | fait ; reste : bout en bout doc14 (pilote) |

## Passe 3 (VERDICT-f3-p2.md : ACCEPTE, 1 majeur et 3 détails)
| N° | À faire | État |
|---|---|---|
| P3-1 | Lien proposé : picto jaune sur la rangée, pastille « 1 proposé » au récap, phrase des propositions retirée, « Garder » ou ⇄ confirme. Test rouge d'abord | fait |
| P3-2 | Champ d'unité vide : « ? » rouge en tirets | fait |
| P3-3 | Bis ouvert : un seul ⇄, la barre se fond dans la ligne « article » du plateau | fait |
| P3-4 | Carte Date fermée au repos, ouverte par « date ? », avertissement sur une ligne | fait |
| P3-5 | RESULTAT « Passe 3 » (Rattacher les 5 / +5 ↳), captures | fait |
