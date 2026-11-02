# Revue du code f4-enrichir (relecteur neuf, 01.11)

Verdict : **À REPRENDRE** (0 bloquant, 3 majeurs, 5 détails). Revue arrêtée au plafond de tours : voir « Non vérifié ».

## Preuves rejouées
- `npx vitest run tests/unit/depense/enrichir --maxWorkers=2` (copie isolée `copie.mjs`) : `Test Files 2 failed | 7 passed (9)`, `Tests 5 failed | 92 passed (97)`.
  Les 5 rouges sont exactement les témoins attendus : `temoin.test.ts` (a), (b), (c2), (d) et `temoin-e4.test.ts` (E4). Lus : (d) échoue parce que l'article lié par f4
  rend `meme S-4` là où l'article nu rend `incertain « Target bis 2 »` (`porteDonneeS6` devient vrai avec `fiche`), (E4) parce qu'un `FICHE-…` est écrit. Bonnes raisons.
- Aucun test n'atteint le réseau : `executantDeRecherche()` lève `ExecutantInterdit` en test sans injection (`enrichissement.ts:64`), `AiClient.run` est espionné « jamais appelé » dans `procedure`, `file`, `interrupteur`.
- Périmètre : le diff de `ingredientFacts.ts` ne touche que l'import et `factsFromStock` (`origin: origineDesValeurs(item)`) ; celui de `fiche.ts` n'ajoute que `Catalogues.levures` et deux lignes de `nomDeFiche` ;
  celui du script n'ajoute que le cas `enrichir` (hors `ALL_CASES`, donc les autres cas sont inchangés ; `CASES[name]` l'accepte, l. 1887). Rien d'écrit hors de l'OWNS constaté dans les fichiers lus.

## Défauts

### M1 — majeur — `enrichissement.ts:196-201` : un travail qui lève bloque toute la file, sans borne
Scénario : `traiterTravail` est censé ne lever que `ExecutantInterdit`, mais il appelle des fonctions sur des données externes sans garde (`valeursDeReponse` → `sanitizeFacts(adaptYeastLookupResult(brute))`,
`enrichissementTravail.ts:286`, `valeursDeCatalogueLevure` l. 188, `lienDeSource` `ficheDe(s)!` l. 151, `store.travaux.put`). Si l'un lève sur une réponse mal formée (levure ou malt), la boucle `for (const t of travaux)` sort,
`boucle` avale l'erreur (`enrichissement.ts:231`), l'état du travail n'est pas réécrit (`essais.dernier` perdu). Les travaux sont triés par `creeLe` : le travail fautif repasse en premier à chaque tour, les suivants ne sont jamais traités.
Pire pour le coût : la réponse payante est comptée (`compteur.recherches+1`, l. 284) mais `reponses.put` (l. 287) n'est jamais atteint, donc le même appel est refait au tour suivant, jusqu'à 5 par jour (plafond) tant que la donnée est la même.
Aucun test ne couvre une exception dans le travail (`file.test.ts` n'en contient pas).
Correction : `try/catch` par travail dans la boucle de `runOnce` (sauf `ExecutantInterdit`), noter l'essai (`essais.dernier`, un jour d'échec) et passer au suivant ; placer `reponses.put` avant l'adaptation, ou entourer `valeursDeReponse` d'un `try` qui rend « introuvable » ; test « un travail qui lève ne bloque pas le suivant ».
Statut : plausibilité de la levée sur donnée réelle **non démontrée** ; le défaut de structure (aucune isolation) est lu dans le code.

### M2 — majeur — branchement 2 (`learnIngredient` + `ficheRetenueDe`), `ficheCle.ts:100-117` : une valeur typique de houblon arrive sur un lot
Le plan et `enrichissementTravail.ts:215` posent « jamais d'α pour un houblon : une valeur typique n'est pas l'α du lot ». Or `ficheRetenueDe` accepte la catégorie Houblon (`FAMILLE_DE_CATEGORIE`, l. 88). Scénario : un article « Cascade » (f4, `fiche.cle = houblon||cascade`, α absent de la facture) ;
la recette lance « Compléter avec l'IA » sur « Cascade » avec `facts.alphaPct = 5,5` (nom différent de l'article, ex. « Cascade US 2025 » ne correspond pas par nom exact). Avant : un `FICHE-houblon:cascade` à 0 kg est créé. Après le branchement : `item = retenue.article`, le champ vide `alphaPct` du lot reçoit 5,5, **sans trace** `remplis` (`storage.ts:742-750`) :
l'α devient une donnée « lue » de l'article (D215 en fera un « bis » ou un écart à la prochaine facture), c'est exactement ce que P1 voulait éviter.
Même mécanisme pour un malt dont l'EBC est encore vide (introuvable) : valeur de l'IA écrite comme lue, sans trace.
Correction : restreindre `ficheRetenueDe` (ou le branchement) à Malt et Levure, ou retirer `alphaPct` du patch quand l'article vient de la retenue ; test « houblon f4 + learnIngredient(α) → alphaPct intact ».

### M3 — majeur — branchement 2 : `cas === 'proche'` fait disparaître en silence des faits acceptés par le brasseur
Réponse à la question 6. **Avant tout enrichissement** (aucun article ne porte `fiche.cle`), `lireCle(undefined)` rend `undefined`, `ficheRetenueDe` rend `undefined` et `item = matches[0] ?? undefined` : comportement identique à aujourd'hui (je l'ai lu sur le code ; données d'avant f4 inchangées, y compris les `FICHE-…` déjà créés).
**Après** le premier enrichissement, deux changements : (i) `meme` : un article de nom différent reçoit les champs vides (voir M2) ; (ii) `proche` (ex. « Carahell » contre l'article « Weyermann Carahell », ou deux articles `meme`) : `return` immédiat, rien n'est écrit, aucun journal, aucun message, alors que le brasseur a accepté ces faits (`App.tsx:582`). Avant, un `FICHE-…` les gardait (c'était le doublon, mais la donnée survivait).
Correction : sur `proche`, au minimum `logAction` (« faits acceptés non écrits : produit proche d'une fiche à contrôler ») et le dire à l'écran de la voie d'interface ; ou garder les faits dans le travail de f4 pour l'écran « à contrôler ». Non testé : aucun test ne couvre `proche` dans `learnIngredient` (seul `cle.test.ts` teste la fonction pure).

### D1 — détail — `enrichissementTravail.ts:72-75` / `enrichissement.ts:187` : écriture hors ligne possible quand la dépense est « confirmed » dans la session
Si la transaction et l'article sont `confirmed` puis le réseau tombe, `portes` laisse passer (le test `navigator.onLine === false` n'est atteint que pour les états non confirmés) et `ecrire` met en file un `put merge` hors ligne (le niveau « rien n'est écrit hors ligne » de RESULTAT est donc vrai pour `pending/unknown`, faux pour ce cas). Risque : un article supprimé depuis un autre appareil est recréé en fantôme (merge ne contient pas `currentStock`, la règle `firestore.rules:182` le refuse en update, mais en création hors ligne l'échec est tardif). Correction : tester `navigator.onLine === false` avant l'écriture, avant `portes`.

### D2 — détail — `enrichissementTravail.ts:176-182` : le catalogue des levures (1,4 Mo) est chargé pour tout travail
`chargerPour` importe `enrichissementCatalogues` (import statique de `yeastReferences`) même pour un houblon ou un malt. Charger le module levure seulement si `t.famille === 'levure'` ou avant une recherche de levure.

### D3 — détail — `enrichissementReglages.ts:118` : `emulateur` n'est pas lié aux émulateurs réellement branchés
`firebase.ts:56` ne branche les émulateurs que si `import.meta.env.DEV` ; `etatDe` ne teste que `VITE_USE_FIREBASE_EMULATORS === 'true'`. Un build non-DEV avec les deux variables appellerait l'`aiTask` de production en croyant être sur émulateur. Ajouter `import.meta.env.DEV` à la règle (et un cas au test pur `etatDe`).

### D4 — détail — `ficheValeurs.ts:300-310` : une valeur de catalogue « à contrôler » sert en recette sous `manufacturer`
Une levure `aControler` (un candidat, fabricant non lu) donne `par: 'catalogue'` donc `origineDesValeurs` rend `manufacturer` tant qu'il n'a pas vu, au lieu de `ai` pour une valeur non sûre (P2). Rendre `ai` si `fiche.aControler`.

### D5 — détail — tests : `interrupteur.test.ts` « aucune tentative comptée » vérifie `[...compteur.values()].every(...)` sur un magasin vide (vrai par vacuité) ; remplacer par `expect(banc.store.rows.compteur.size).toBe(0)`. Aucun test non plus de la file quand `navigator.locks` renvoie `lock === null` (réveil perdu, repris au suivant : acceptable mais non dit).

## Les points du brief
1. Aucun écrasement : `patchDeTrous` n'écrit que les champs vides de `CHAMPS_ECRIVABLES` (liste blanche, test `valeurs.test.ts`), `fiche.id` et `approchee` conservés (`ficheValeurs.ts:238`), une valeur contraire va au journal (`enrichissementTravail.ts:108`). Tenu pour les écritures de f4. Le contournement par `learnIngredient` est M2.
2. Une fiche par produit : ids déterministes (`levure:<id>`, id de variété, `cle:<clé>`), réponse gardée par clé, source `aControler` ignorée mais le catalogue passe avant : je n'ai pas trouvé de chemin de doublon dans f4 seul (même sous cache de snapshot en retard, l'id `cle:` est identique). Réserves : deux orthographes sans mot commun restent deux produits (volontaire) ; le doublon `FICHE-…` ne disparaît qu'avec le branchement 2 (et voir M2/M3). Malts : f4 ne retente pas le catalogue fermentescibles si s6 n'a rien posé (nom tapé) : pas de doublon, un manque.
3. Hors ligne / rechargement : `unknown` n'est jamais prêt, aucune minuterie, réveils seuls, 30 min entre essais dans une vie de page, 10 tentatives et 5 recherches par jour : tenu (réserve D1, et un rechargement relance un essai « réseau » immédiat, borné par les 10 tentatives).
4. Gemini : l'exécutant n'est construit qu'après `iaPermise()` (`enrichissementTravail.ts:255`) ; éteint par défaut ; plafonds relus avant chaque appel ; réserve D3.
5. Tests : pas de tautologie trouvée hors D5 ; les 5 témoins rouges le sont pour la bonne raison.
6. Branchements : ancres 1 (`stockLineMatching.ts:180,399`), 3 (`purchaseEntry.ts:529,548`), 4 (`ExpenseSheet.tsx:189`), 5 (`App.tsx:309,328`) retrouvées sur l'arbre courant, pas de cycle d'import vu (`articleNeuf`/`stockLineMatching` n'importent pas `purchaseEntry`). Le branchement 2 : M2, M3.

## Non vérifié (plafond de tours)
- Branchement 6 (élargissement de `StockItem.fiche`) et `tsc` : non rejoués.
- `levure.test.ts`, `cle.test.ts`, `valeurs.test.ts` lus en entier, mais pas confrontés à une mutation du code.
- `ficheLevureDe` : faux positifs par code numérique seul (libellé sans fabricant) non cherchés au-delà de la table de 11 cas.
- Comportement réel de `FirestoreRepo.put` en merge profond sur `fiche.remplis` et de `waitForDocument` hors ligne : lu, non joué ; aucun émulateur lancé.
- Poids du paquet (+20 Ko annoncé) non mesuré (build impossible, de l'aveu de RESULTAT).
- Plausibilité d'une levée dans `valeursDeReponse` (M1).

**Verdict : À REPRENDRE** (M1 à M3 à corriger ou à décider explicitement par le pilote ; D1 à D5 au choix).
