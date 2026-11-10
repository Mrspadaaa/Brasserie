K1 OK — banc A/B/C/C′ et jugement prêts ; consignes déplacées sans changement ; simulation et tests verts ; aucun appel payé.

## Fichiers écrits
- `functions/src/invoiceScanPrompts.ts` (neuf) : les trois consignes de lecture, `INVOICE_SCAN_PROMPTS[0..2]`.
- `functions/src/ai.ts` : seul changement, l'import et trois `read(INVOICE_SCAN_PROMPTS[n], …)` à la place des littéraux. `git diff -w HEAD -- functions/src/ai.ts` : 4 lignes ajoutées, 3 retirées, rien d'autre. Texte identique à l'octet près (sha256 pris sur HEAD, épinglés dans le test) :
  `ccd96427…5e54` (145 car.), `c9a5c2ab…ff13` (266 car.), `86cd62a5…9ca9f9` (320 car.).
- `scripts/banc-lecture-facture.ts` : le banc (modes `--simuler` par défaut et `--payant`).
- `scripts/banc-lecture-facture-juger.ts` : le jugement et le tableau publiable.
- `tests/unit/banc-lecture-facture.test.ts` : 35 tests.
- Rien d'autre. Aucun fichier de `src/`, ni `.codex/hooks.json`, ni `functions/.env`, ni `functions/.secret.local` (jamais lus). Pas de commit.
- Note : `GATES.md` n'existait pas dans la voie ; j'ai pris les critères de VOIE.md.

## Critères (sorties)
- `npx tsc --noEmit -p . && echo TYPES OK` : TYPES OK
- `npm --prefix functions run build && echo FONCTIONS OK` : FONCTIONS OK
- `npx vitest run <liste>` : 22 fichiers, 351 tests verts, `TESTS LECTURE OK`. Rejoués en plus : `tests/integration/invoiceReview`, `aiTaskMonthlyBudget`, `d100AiTaskOutput`, `geminiModelRouting`, `yeastDbCorrections`, `brewerHopAdviceWizardDispatchV1` : 10 fichiers, 205 tests verts (tous ceux qui importent `ai.ts`).
- Simulation, commande exacte du critère (`--out C:/Users/mrspa/AppData/Local/Temp/k1-sim`) :
  `BANC SIMULE OK — 113/113 fausses réponses fabriquées retrouvées, 4 faux verts comptés, 64 parcours propres sans champ faux, aucun réseau.`
- `git diff -w HEAD -- functions/src/ai.ts` : ne montre que le déplacement (à lire par le pilote).

Essais utilisés : un par critère, après deux corrections de mon code (nom de script absent de `process.argv` sous vite-node ; arrondi du journal).

## Preuves que le banc envoie ce que la production envoie
- Le test fait passer `scanInvoiceSafely` par un `fetch` simulé (montage de `invoiceScanTransport.test.ts`), capture les trois corps (lectures 1, 2, 3) et vérifie, pour chacun : `toEqual`, JSON identique caractère pour caractère, texte de la consigne, URL du modèle. Le banc envoie le corps normalisé du budget mensuel (`quoteGeminiCost(...).body`) : le test vérifie qu'il ne diffère de la production que par `candidateCount: 1`.
- Le parcours A du banc (`finalOfTwo`, même code de rapprochement, même déclencheur) rend le même résultat final que la production sur les mêmes réponses, `toEqual` sur : concordance, majorité 2/3, divergence non résolue, devise étrangère, lecture refusée (503), lecture coupée (MAX_TOKENS), arbitrage refusé.
- B, C et C′ se calculent par les mêmes fonctions (`finalOfB`, `finalOfTwo`, `finalOfCprime`) sur les lectures de A et de C.

## Comment le banc fonctionne
- Cas : `cas.json`, `cas-2.json`, `cas-3.json` (doc1 à doc7), `--repeat 3` par défaut. L'ordre est tirage par tirage (les 7 documents au tirage 1, puis 2, puis 3) : si le budget s'arrête net, tous les documents ont au moins un tirage. Par document : A (2 appels 3.8 parallèles, 3ᵉ si divergence), puis C (2 appels lite parallèles, puis 3.8 prêtée par A si elle existe, sinon neuve).
- B : lecture 1 de A seule ; si un point `controle` qui pèse parmi `ligne-montant`, `somme-ecart`, `tva-incoherente`, `ht-tva-ttc`, `total-absent` (jamais la date absente) échoue, lecture 2 de A puis réconciliation, puis lecture 3 de A si divergence. Durée = somme séquentielle. Une lecture 1 qui passe est « checked, 1 lecteur » (« disputed » si un autre point pèse, comme la date absente).
- C′ : comme C ; si les deux lectures lite concordent mais que l'arithmétique du résultat réconcilié échoue, la 3.8 est appelée aussi (prêtée par A, ou neuve, journalisée « C′ »).
- Budget (mode payant) : `--budget-chf` ≤ 4,5 obligatoire, `--confirm-paid-ai` obligatoire (garde existante `paid-ai-test-guard.mjs`). Coût réservé AVANT chaque appel au pire (6 000 jetons d'entrée, 5 100 de sortie ; tarifs lus dans `geminiCosts.ts` via `observedGeminiCostDetails`, aucune copie) : **0,0591 CHF** pour un appel 3.8, **0,0182 CHF** pour un appel lite. Si dépense + réserves en cours + cette réserve dépasse le budget : arrêt net (`BudgetStop`). Coût réel relu depuis `usageMetadata`. Coût inconnu (délai, coupure réseau) : la réserve entière est comptée, jamais zéro ; HTTP refusé : 0. Trois appels en échec d'affilée : arrêt. La dépense déjà journalisée par une passe précédente est reprise (le budget est cumulatif).
- Clé : `readLocalKey` de `gemini-usage-bench-guard.mjs` seulement, jamais affichée ni journalisée ; en simulation elle n'est pas lue et le `fetch` global est coupé. Test : la clé ne figure ni dans le journal, ni dans `results.json`, ni dans les réponses brutes.
- Journal : `work/missions/2026-11-01-banc-lecture/journal-gemini.md`, une ligne par appel écrite juste après (date, doc, tirage, variante, lecture, modèle, durée, jetons entrée/sortie, coût au micro-franc, cumul, état). Aucune valeur de document. En simulation le journal va dans le dossier de sortie, marqué SIMULÉ.
- Sorties payantes : `work/finalisation-tickets-2026-10-08/H13-reels/banc-k1-<horodatage>/` (`results.json`, `raw/`), ignoré par Git.

## Jugement
Comparaison du résultat FINAL à `expected` (mêmes tolérances qu'en octobre : centime, inclusion sans casse ni accents, `null` = rien d'inventé, unités équivalentes `pce/pièce`), en ne jugeant que ce que le cas écrit (doc7 : fournisseur en alternatives, date `null`, lignes sans quantité). Par variante : champs justes/jugés, lignes justes, **faux verts** (`checked` avec un champ faux), faux « corrigés » (à part), alertes justes, alertes inutiles (avec les codes de points qui sonnent), durée médiane et maximale, appels, coût médian et total, défauts par nom de champ. Le tableau n'a aucune valeur de document. `--publier` le copie dans `RESULTAT-BANC.md` de la mission (refusé pour un banc simulé).

## Témoin négatif
Six fautes fabriquées (tirages 1 et 2 ; le 3ᵉ reste propre) : même fausse date lue par les deux 3.8 (faux vert A et B), unité « x » inventée par les deux lite sur toutes les lignes (faux vert C et C′), une lecture lite divergente (la 3.8 tranche), même montant de ligne faux deux fois (alerte juste), un total différent (la 3ᵉ lecture tranche), une lecture lite coupée. Le jugement retrouve les 113 champs faux fabriqués présents dans un résultat final, trouve 0 champ faux sur 64 parcours propres, compte 4 faux verts.

## Passe payante (à lancer par le pilote)
```
npx vite-node --config vitest.config.ts scripts/banc-lecture-facture.ts -- --payant --budget-chf 4.5 --confirm-paid-ai
npx vite-node --config vitest.config.ts scripts/banc-lecture-facture-juger.ts -- work/finalisation-tickets-2026-10-08/H13-reels/banc-k1-<horodatage affiché à la fin> --publier
```
Environ 9 à 12 minutes (21 parcours, ≈ 25 s chacun).
- Réserve maximale : 4,5 CHF (le budget lui-même ; 0,0591 CHF par appel 3.8, 0,0182 par appel lite ; arrêt net avant de dépasser). 5 CHF accordés : 0,5 de marge.
- Estimation probable : **≈ 1,7 CHF** (fourchette 1,3 à 2,3), d'après le banc d'octobre (≈ 2 000 jetons d'entrée, 1 300 à 4 000 de sortie, soit 0,016 à 0,04 CHF par lecture 3.8) : A ≈ 1,1 ; lectures lite ≈ 0,3 ; 3.8 neuves pour C et C′ ≈ 0,3. Tarif provisionné à 1,25 CHF/USD : la facture Google sera plus basse. La simulation, qui fabrique des sorties courtes, donne 0,67 CHF : elle sous-estime.

## Doutes et limites
- 21 parcours par variante : un faux vert de plus ou de moins est un indice, pas une mesure. Le tableau le dit.
- C′ ne peut pas corriger deux lectures lite qui concordent : dans un vote à trois, deux voix identiques l'emportent. Sa 3.8 de plus ne change que le statut possible si la 3.8 ne diverge pas ; elle coûte un appel (≈ 7 sur 21 parcours dans la simulation, à cause des documents dont les chiffres imprimés ne se recoupent pas : bordereau sans total, commande dont la somme diffère). Une variante utile serait « les contrôles qui échouent donnent la voix prépondérante à la 3.8 » ; hors contrat, non faite.
- « Alerte inutile » suit la définition du contrat (statut `disputed`/`unavailable` sans champ faux). Beaucoup sonnent parce que le document n'imprime pas une date, un total, ou que ses lignes ne s'additionnent pas ; le tableau en donne les codes pour ne pas les confondre avec une erreur de lecture.
- La durée du parcours est la somme des durées mesurées appel par appel, pas l'horloge murale ; B refait en séquence ce que A a fait en parallèle, sans nouvel appel.
- Les lignes sont jugées par position (comme en octobre) : une ligne sautée décale les suivantes et le tableau le montre par un nombre de lignes fausses, pas par un seul défaut.
- Le transport réel n'a été éprouvé qu'avec un `fetch` simulé (URL, en-tête, erreur, absence de la clé dans l'erreur) ; aucun appel Google n'a eu lieu.

DÉCISION À PRENDRE : aucune bloquante. Recommandation : lancer la passe telle quelle ; si C′ ressort inutile, ne pas le retenir plutôt que de le refaire.

CONNAISSANCE : sous vite-node, `process.argv` ne contient pas le nom du script lancé (seulement vite-node.mjs et les arguments) : un script qui doit « ne rien faire à l'import » se déclenche sur ses drapeaux (`--simuler`, `--payant`) et sur `!process.env.VITEST`, pas sur son nom. Le coût de réserve d'un appel avec image (`quoteGeminiCost`) est le contexte entier du modèle (≈ 1,9 CHF pour 3.8) : inutilisable pour un budget de 5 CHF, la réserve du banc part donc d'un pire cas d'entrée mesuré (6 000 jetons).

LEÇON PROPOSÉE : aucune.
