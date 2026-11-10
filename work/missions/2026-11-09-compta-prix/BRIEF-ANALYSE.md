# Brief : l'outil d'analyse, mini maquettes (10.11)

Ses mots (10.11, en montrant l'escalier p5b de Prévisions) : « J'ai besoin d'un outil d'analyse pour voir si je respecte mes budget, voir
l'évolution l relle en fonction de mes opérations quand ça montre quand ça descend, comme cette vue de mini maquettes mais pas en prévision,
sur des vrais chiffres. / Et aussi pouvoir comparer d'année en année ». Et le 09.11, sur g2c (tuiles par mois) : « dans la bonne version je
veux une version tuile par mois, ça c'est top mais ça doit pas être la vue principal mais plus un outil d'analyse ».

Trois questions, toutes à couvrir (chaque concept les trois, ou un concept qui les relie) :
1. **L'évolution réelle** : le solde (ou l'argent) au fil des vraies opérations, dans la langue de p5b (« Les étiquettes accrochées » :
   l'escalier, chaque marche avec son étiquette accrochée, quand ça monte et quand ça descend) mais sur le PASSÉ, des chiffres réels.
   Référence : `p4/p5b/` (etat.html, captures) ; dans l'app, Finances › Prévisions (`src/ui/finance/previsions/`, `escalier.ts`).
2. **Le budget respecté ?** : réel contre prévu. Le prévu existe déjà dans l'app : les prévisions (`FinancialPlan` : montant, catégorie,
   récurrence, `src/domain/finance/types.ts` l.~90) et le coût prévu de chaque brassin (`brewEstimate`, prévision dérivée P1). Par catégorie
   et par mois, et par brassin (prévu contre réel). Dépassement visible d'un coup d'œil, sans tableur.
3. **D'année en année** : 2025 contre 2026 (courbes cumulées superposées, tuiles par mois côte à côte, écarts par catégorie…).
Placement à proposer (axe de variantes) : un outil à part, pas la vue principale (ses mots du 09.11) — entrée depuis Synthèse, Annuel, ou
un cinquième onglet de Finances ; dis où, dans la NOTE.

Données d'exemple : une année 2026 crédible de micro-brasserie (ventes, malt, houblons, loyer, énergie, matériel à part) et 2025 pour
comparer, marquées « exemple ». Plus UN état honnête sur des données comme les siennes aujourd'hui (solde de départ 100,00 au 8 janv. 2026,
une vente de 5 695,00 le 10.11, cinq achats ≥ 27,68 le 10.11, matériel 5 500,00 à part, aucune prévision, 2025 vide) : rien d'inventé,
inconnu hachuré, jamais 0.

Obligatoire : `BRIEF-AUTEUR.md` § « Obligatoire » ; `BRIEF-PASSE2.md` § « Corrections transversales » ; maquettes **statiques** (pas
jouables) ; DESIGN.md (densité compacte, deux régimes, pas de cockpit) ; charge `boosters-ux` avec `impeccable` et `ui-design-system`.
Références à regarder avant de dessiner : `p4/p5b/`, `v0/g2c/`, `p2/g3a/` (Synthèse choisie), `p3/g6/` (Annuel).

Rends 8 concepts `a1a`–`a1h` dans `p6/<id>/` (etat.html préfixé `a1x-`, NOTE.md court : question servie, placement, boosters, captures
`node scripts/agents/verifier-page.mjs <etat.html> --captures p6/<id>/<id>` + 1280, ouvertes) : 2 froids, 3 tièdes, 3 chauds. Au moins un
qui reprend p5b telle quelle sur le passé, un qui part des tuiles g2c, un qui superpose deux années. Puis `p6/RESULTAT-a.md` (une ligne par
concept). N'écris que dans `p6/`. Rien dans `src/`, aucun commit, pas de `git stash`. Rends une ligne.
