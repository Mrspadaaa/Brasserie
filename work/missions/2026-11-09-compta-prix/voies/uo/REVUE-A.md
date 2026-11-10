# Revue A (métier et fidélité) — plan de la voie uo, port de v6b (Opérations)

Relecteur sans mémoire, 09.11. Lu : uo/VOIE.md, PLAN.md, DECISIONS.md, RESULTAT.md ; us/PLAN.md (croisement) ; COMMUN.md ; `p4/v6b/` (NOTE.md, etat.html, v6b-page.png ouverte) ; `TransactionJournal.tsx`, `TransactionRow.tsx`, `ledger.ts`, `financeService.ts`, `FinanceForms.tsx` (PaymentSheet). Gravité : B bloquant (corriger le plan avant le code), G grave (corriger ou trancher avant le code), D détail.

## Verdict : OK avec réserves — 1 B, 6 G, 4 D. Le plan reprend fidèlement les 23 éléments de v6b, garde toutes les gardes du journal (doublons, archives, pagination, suivi) et entoure bien l'écriture d'un paiement (reste dû exact, date du jour, contre-écriture `CONTRE-<id>` conforme à `financeService.ts:26,102-106`, double clic). Il ne part pas au code tant que UO-1 n'est pas tranché avec la voie us, et que UO-2 et UO-3 ne sont pas écrits.

## B

**UO-1 (B) — Les piles et la légende recalculent « dépensé » et « matériel à part » dans leur coin, autrement que la Synthèse.**
- Preuve : uo PLAN § 2.1 (l. 53-55) `pilesDuMois`, § 3.1 (l. 85-88) ; § 2.3 (l. 72-75) périmètre = mois + ouvertes non échues d'autres mois ; matériel = catégories `materiel` et `renovation`, une ligne `equipment` y va même passée en charge. us PLAN § 4.1 (l. 76-81) : mois strict, matériel = lignes `equipment` non passées en charge ou catégorie sans lignes. us DECISIONS D2 : `periodeSynthese` dans `src/domain/finance/` ; uo/DECISIONS.md : rien.
- Conséquence : même mois, même donnée, deux « dépensé » possibles (696,80 d'accord sur la démo, divergence dès qu'une facture ouverte d'un autre mois ou une ligne matériel passée en charge existe). C'est exactement le problème 2 (deux résultats qui se contredisent) que le brasseur a nommé.
- Attendu : uo appelle la fonction de domaine de us (ou un prédicat partagé « matériel à part » et « périmètre du mois ») ; test d'égalité Synthèse/Opérations sur la fixture et sur un cas avec ouverte d'un autre mois. Le pilote écrit la règle dans les deux PLAN.

## G

**UO-2 (G) — La légende « payé » inclut le matériel : « payé 725,40 » pour « dépensé 696,80 » ; la Synthèse dit « payé 296,80 ».**
- Preuve : uo PLAN § 3.1 (l. 87) et D4 (l. 159) ; v6b-page.png (« payé 325,40 · à payer 400,00 · dépensé 696,80 » : 325,40 + 400,00 ≠ 696,80) ; état « après ✓ Payé » : payé 725,40 > dépensé 696,80. g3a NOTE : « payé 296,80 + à payer 400,00 = dépensé 696,80 ».
- Le brasseur lit « payé / à payer / coût » ; deux maquettes choisies, même donnée, deux « payé ». Le plan assume « payé > dépensé possible » sans l'avoir montré au brasseur.
- Attendu : ne pas trancher en silence. Défaut prudent et réversible : « payé » **hors matériel**, la somme payé + à payer = dépensé reste vraie et la pile Matériel garde sa valeur propre ; écart noté pour le brasseur dans RESULTAT.md avec les deux nombres. Alternative : le montrer en mini maquettes (L24). Test : payé + à payer = dépensé sur la fixture, avant et après ✓ Payé.

**UO-3 (G) — Les piles « sur la liste déjà filtrée » : leur sens change avec chaque filtre, Par date, pagination et Archives.**
- Preuve : PLAN § 6 « Performance » (l. 149) « piles calculées sur la liste déjà filtrée » ; § 3.1 « écritures affichées dans les groupes ». Avec la puce « À payer », la recherche d'un fournisseur, « Par date » (toutes les dates, paginé à 50) ou le périmètre Archives, les piles et la légende « dépensé » changent de définition sans le dire ; la hauteur 112 px porte alors sur d'autres échelles.
- Attendu : écrire la règle : piles = **le mois affiché, hors filtres** ; en Par date ou en Archives, piles masquées (ou libellées « toutes les dates »). Tests : même pile avec et sans filtre ; absente en Archives.

**UO-4 (G) — « ✓ Payé » pour une vente, et le mode « banque » par défaut.**
- Preuve : PLAN E11 (l. 26) et § 2.1 `paiementRapide` (l. 58) : `direction` prévue, mais le geste s'appelle « ✓ Payé » partout. Une vente non encaissée est du sens `in` : PaymentSheet dit « Enregistrer un encaissement » (`FinanceForms.tsx:127`). Mode forcé `bank` (`FinanceForms.tsx:125`, défaut de la feuille) : une vente au marché est souvent en espèces ou TWINT ; le geste écrit une vérité fausse sur le moyen sans la feuille pour la corriger.
- Attendu : libellé « ✓ Encaissé » pour `in` (même geste, même 28 px) ; le mode « banque » écrit dans l'état de la ligne (« ✓ payé 9 nov. · banque »), correction possible dans la fiche ; test (vente non payée → paiement `in`). Dire dans RESULTAT.md que le moyen est une hypothèse du geste rapide. Annuler : après le jour, la correction passe par la fiche (`TransactionDetails.tsx:74-76`) : le dire dans l'aide de la ligne.

**UO-5 (G) — Arriver avec un filtre actif (depuis la Synthèse) ne se voit plus : le panneau « Filtres » est replié.**
- Preuve : PLAN E17 (l. 32) : les puces d'état vont dans un panneau fermé par défaut. Aujourd'hui `journal-active-filter` (« Retirer le filtre : … ») n'existe que pour `due` et `void` (`TransactionJournal.tsx:246, 312-314`) ; les autres états sont lisibles dans le rail visible. La Synthèse envoie `payable`, `receivable`, `due`, `unknown`, `review`, `late` (us PLAN § 3 l. 60) et `scrollIntoView` du rail (`TransactionJournal.tsx:158-162`) disparaît. L'utilisateur voit une liste partielle sans la raison.
- Attendu : tout filtre ≠ « Toutes » (et la recherche, la catégorie) montre une pastille « Retirer le filtre : À payer » dans la bande ou le pied, et « Filtres ⌄ » affiche un compte ; test (arrivée `payable` → pastille visible panneau fermé).

**UO-6 (G) — « Par date » : la lecture retenue n'est pas la plus étroite (L01) et elle change le périmètre des piles.**
- Preuve : PLAN E16 (l. 31) « Lecture retenue : classe les opérations de toutes les dates… mois désactivé » ; v6b ne dessine pas son résultat. L01 : sur ambiguïté, lecture étroite et réversible. La lecture étroite : regrouper **le mois affiché** par jour au lieu des catégories ; la large (toutes les dates) change la liste, la pagination (50), les piles et masque le titre de mois. Le pilote a retenu la recommandation (uo/DECISIONS.md) ; je la signale tout de même, car l'ancien « Toutes les dates » avait ce rôle et le brasseur n'a nommé que « Par date ».
- Attendu : écrire dans RESULTAT.md la lecture retenue et l'autre, avec un test de chaque ; ou n'implémenter que la lecture étroite et garder « Toutes les dates » en panneau Filtres.

**UO-7 (G) — Pièce « joindre » : « + pièce » ne joint rien.**
- Preuve : PLAN D6 (l. 161) : sans `onAddProof`, ouvre la fiche ; avec, ouvre la modification de l'écriture (`EditTransactionModal`, champ fichier l. 331). Le brasseur voit un geste « + pièce » (maquette) qui ouvre un formulaire complet. Acceptable (accepté par le pilote), mais le plan ne dit pas que la ligne « sans pièce » d'un loyer ou d'une vente (jamais de pièce) reste en ambre à vie.
- Attendu : lister dans RESULTAT.md le comportement réel du geste ; ne pas colorer en ambre une vente (`income`) sans pièce si la règle `sansJustificatif` le permet : question à poser au pilote, pas au code.

## D

**UO-8 (D) — Dépendance FinancesTab non verrouillée.** PLAN N1 (l. 163) : `onAddProof`, `onPay`, `assistant`, retrait de `{financeAssistant}` (`FinancesTab.tsx:141` après le journal). us PLAN § 4.7 (l. 87) dit ne pas toucher à la branche journal ; DECISIONS du pilote demande l'inverse. Attendu : un test d'intégration passant par `FinancesTab` : l'assistant n'apparaît qu'une fois (dans le pied) et « Paiement à confirmer » ouvre la feuille.

**UO-9 (D) — Ordre à l'intérieur d'un groupe, et catégories hors maquette.** Le plan règle l'ordre des groupes (E7) mais pas celui des lignes (date décroissante, puis `recordedAt`, comme `TransactionJournal.tsx:224-225` ?) ni celui de « Local et travaux » en « Matériel · à part » (D3, accepté). Attendu : ordre des lignes écrit (reprendre le tri actuel) ; test sur le sous-total d'un groupe = somme des lignes (déjà prévu au test 7).

**UO-10 (D) — Tests dépendants de la date.** PLAN § 4 test 1 : « aujourd'hui = 9 nov. » ; le rendu appelle `todayISO()` en interne (`TransactionJournal.tsx:128`). Attendu : `vi.setSystemTime` dans les tests d'écran, sinon « dans 16 j » et « en retard » deviennent instables.

**UO-11 (D) — `type="month"` pour les sauts de mois.** PLAN E2 (l. 17) : champ natif masqué ; déjà utilisé par `FinancePeriod.tsx:30`, donc cohérent. Rendu sur navigateurs sans sélecteur de mois (Firefox bureau) : retombe en champ texte. Attendu : le dire ; la pastille ‹ › reste le chemin principal.

## Ce qui est correct (prouvé)
Le plan conserve les exports de `TransactionJournal` et les props ; les 8 appelants hors Possède sont listés avec leurs lignes (`financeArchives`, `financeJournalUx`, `financeJournalDoublons`, `financeJournalDoubleSomme`, `ta2-compteur`, `financeWorkspace`, scripts émulateur) ; la contre-écriture respecte la règle d'unicité (`financeService.ts:26`) et le refus « déjà annulé » (l. 106) ; `validateFinancialPayment` refuse un paiement futur (l. 24) donc « date = aujourd'hui » est sûre ; l'inconnu n'est jamais 0 (« Paiement à confirmer » ouvre la feuille, jamais de date inventée). Gemini : aucun appel.

LEÇON PROPOSÉE : voir us/REVUE-A.md (un nombre affiché par deux écrans = une seule fonction de domaine).
