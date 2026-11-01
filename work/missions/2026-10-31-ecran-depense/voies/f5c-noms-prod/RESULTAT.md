OK — tâche traduireNoms d'aiTask (3.8, texte seul) et client traduireLignes à table Dexie ; 102 tests verts, lecture inchangée

Voie f5c-noms-prod, 01.11. Aucun commit, aucun déploiement, aucun Gemini réel (`fetch` et budget simulés). Essais utilisés : 1 par critère (aucun échec à reprendre).

## Fichiers écrits
- `functions/src/prompts.ts` : `'traduireNoms'` dans `TaskId` ; `TASKS.traduireNoms` ajouté en fin de table (+36 lignes, 2 lignes modifiées : le `;` de `'readHopCoa'`). `scanInvoice` et les 15 autres tâches : intactes.
- `src/services/aiClient.ts` : `'traduireNoms'` dans `AiTaskId`, rien d'autre.
- `src/domain/nomsBase.ts` (neuf, pur) : `canonMot`, `cleBase`, `NOMS_MAX_ENTREES = 35`.
- `src/services/nomsFr.ts` (neuf) : `traduireLignes`, `retenirNomBrasseur`, la table (`creerTableDexie`, `creerTableMemoire`, `NOMS_DATABASE_NAME = 'laffinee-noms'`).
- `tests/unit/depense/noms-fr/` : `aiTask-traduireNoms.test.ts` (le test côté `functions/`, 9 tests), `cleBase.test.ts` (18), `traduireLignes.test.ts` (28).
- `functions/src/models.ts` : NON modifié (aucune ligne de routage nécessaire, voir plus bas).

## TEMOIN AVANT
1. Premier lancement, rien d'écrit : `Cannot find module '../../../../src/domain/nomsBase'` / `…/src/services/nomsFr` ; `Test Files 3 failed (3)`.
2. Après `nomsBase.ts` seul, sans la tâche (la vraie preuve rouge côté serveur) : `Test Files 1 failed | 1 passed`, `Tests 4 failed | 23 passed` :
   - `la consigne et le schéma sont ceux du banc` : `AssertionError: expected undefined to be defined`
   - `texte seul, Rapide imposé, plafond…` : `TypeError: Cannot read properties of undefined (reading 'acceptsFile')`
   - `un appel réel simulé part vers la 3.8…` et `une réponse coupée…` : `Error: Tâche inconnue : traduireNoms`
   (les 3 tests de non-régression de `scanInvoice` étaient déjà verts, comme attendu.)
3. Après tâche + client : tout vert (ci-dessous).

## Critères
- `npx vitest run tests/unit/depense/noms-fr tests/unit/banc-noms-fr-texte.test.ts --maxWorkers=2` : `Test Files 4 passed (4)`, `Tests 102 passed (102)` (le test de `functions/` est `tests/unit/depense/noms-fr/aiTask-traduireNoms.test.ts`, déjà dans ce dossier).
- Rejoués aussi, verts, rien ne bouge : `geminiModelRouting`, `invoiceScanCache-d273c`, `invoiceScanCsv8`, `d100RecipeImportResult`, `depense/lecture/*`, `banc-lecture-noms-fr`, `aiClientYeastGuard`, `aiTaskMonthlyBudget` : 16 fichiers, 228 tests.
- `npx tsc --noEmit -p functions/tsconfig.json` : exit 0. `npx tsc --noEmit -p tsconfig.json` : seules 2 erreurs, `src/services/qrLecture.ts(111,122)` : modules `zxing-wasm/reader` et `pdfjs-dist` introuvables dans le `node_modules` de ce poste (hors de mes fichiers, sans lien avec cette voie). Je n'ai PAS lancé `npm --prefix functions run build` : il lance `build-fermentation-report.mjs` et `build-brewer-tools.mjs`, qui écrivent hors de mon périmètre ; le `tsc` de `functions/` est la même compilation sans écriture. Le prédéploiement de Firebase lance ce build complet.
- `git status --short` : mes fichiers seulement (`functions/src/prompts.ts`, `src/services/aiClient.ts`, `src/domain/nomsBase.ts`, `src/services/nomsFr.ts`, `tests/unit/depense/noms-fr/`, cette voie). Le reste du statut vient des autres voies.

## Ce qui est fait et son test
1. **Consigne et schéma mot pour mot** : `TASKS.traduireNoms.system === SYSTEME_NOMS_FR` et `.schema` égal à `NOMS_SCHEMA` (le test importe le banc). Plafond de sortie `600 + 36 × 35 = 1860` : la formule du banc (`maxSortie`) au plus gros ticket que la lecture rende (`SCAN_MAX_ITEMS = 35`, test d'égalité). Statique, car `TaskDef.maxOutputTokens` l'est ; un petit ticket ne paie que ce qu'il écrit, seule la réserve de budget compte le plafond.
2. **La 3.8 répond, vérifié trois fois** : (a) `geminiAttempts('traduireNoms','fast')` = `[3.8 low, 3.8 low]`, jamais Flash-Lite (aucune entrée dans `LITE_ROUTES`) ; (b) `aiTask.run` simulé : l'URL appelée est `/models/gemini-3.8-flash:generateContent` et le budget mensuel (`runWithMonthlyAiBudget`) est ouvert pour `gemini-3.8-flash` seulement ; (c) le corps envoyé : `systemInstruction` et `responseSchema` égaux à ceux de `buildNomsBody` du banc, `temperature 0`, `maxOutputTokens 1860`, `thinkingLevel 'low'` (minuscule : le chemin générique l'écrit ainsi pour toutes les tâches ; le banc écrit `'LOW'`, même niveau), pas d'`inlineData`.
3. **Chemin générique d'aiTask lu** : budget réservé par `runWithMonthlyAiBudget` (quote sur le corps, donc sur le plafond de sortie) ; plafond d'entrée = aucun propre aux tâches texte (seule la pièce jointe est bornée, et la tâche en refuse : test `n'accepte pas de pièce jointe`) ; l'entrée reste petite (≤ 35 objets) ; délai commun (`AI_TASK_DEADLINE_MS` 120 s).
4. **`scanInvoice` inchangé** : instantané sha256 pris sur HEAD avant toute modification (`functions/src` n'avait aucun changement en cours, `git diff HEAD -- functions/src` vide) : `TASKS.scanInvoice` (`b219d621…48fe`), les trois consignes de la lecture + les plafonds 8192/5100 + `SCAN_MODEL` (`66427dd8…5e50`), et les 16 autres tâches (`f8400650…a508`). Le test les compare.
5. **Client** : `traduireLignes(lignes, { stock, enLigne, run, table, maintenant })` → `Map<rang, nameFr>`.
   - Base par `lireOptions(name, variant, unit).base` ; clé `cleBase`, importée de `src/domain/nomsBase.ts` ; `cleBase.test.ts` prouve l'égalité avec le banc sur 17 bases (accents, ß, œ, tabulations, vide, ®, ™).
   - Entrée par ligne `{ i, base, kind, stockCategory }` (`i` = premier rang de la base), bases dédoublonnées ; le test vérifie que ni montant, ni quantité, ni prix, ni unité, ni image, ni `instruction` ne partent.
   - Table `laffinee-noms` (base Dexie à part, version 1, magasin `noms` clé `cle`) : `{ cle, nameFr, le, par: 'ia' | 'brasseur' }` (`le` = instant ISO). `null` sans IndexedDB (testé : `typeof indexedDB === 'undefined'` sous Vitest).
   - Une base en table : aucun appel (IA ou brasseur). Une ligne `stockAction: 'existing'` dont `stockRef` est dans `stock` : aucun appel, rien en table, absente de la Map (le nom de l'article sert). `existing` vers une réf. absente du stock, `new`, `none` : traduites.
   - `par: 'brasseur'` jamais écrasé : la règle est DANS la table (`poser` d'une écriture `ia` sur une `brasseur` rend l'entrée du brasseur sans écrire, atomique en transaction Dexie) ; testé avec une course (le brasseur tape pendant l'appel) : sa traduction reste en table et dans la Map.
   - Hors ligne : aucun appel, mais les bases déjà en table se servent. Échec (`ok:false`), exception du client, réponse nulle, `noms` non-liste, éléments non conformes : Map vide, jamais d'exception, **un seul appel**, rien en table, aucun nouvel essai (testé après 30 ms d'attente). Une table qui lève : l'appel part quand même.
   - Réponse : `i` entier connu et non répété, `nameFr` texte non vide ; espaces réduits, 160 caractères au plus (comme `parseNoms` du banc). `i` inconnu/répété/négatif/décimal/texte : ignoré ; une entrée sans réponse n'entre ni dans la Map ni dans la table.
   - Plus de 35 bases dans une pièce : un seul appel avec les 35 premières ; les autres gardent le nom imprimé.
   - `retenirNomBrasseur(ligne, nameFr, { table })` : pose `par: 'brasseur'` sur la clé de la BASE de l'imprimé ; nom vidé = entrée retirée (la base pourra être retraduite). Ne lève jamais.

## Rien ne se perd
Lecture (`scanInvoice`) : octet pour octet (hashs ci-dessus). Aucun champ Firestore touché (la table est locale, la dépense enregistrée garde `description` et l'original reste au justificatif). `AiTaskId` et `TaskId` : ajouts seulement. `models.ts`, `ai.ts`, `monthlyAiBudget.ts` : non modifiés. Aucune donnée réelle, aucun nom d'achat réel (les tests inventent leurs noms).

## À savoir avant de déployer (doutes et limites)
- **Le préfixe « Données : »** : le chemin générique d'aiTask met la donnée sous `Données :\n{"entrees":[…]}` ; le banc envoyait le JSON nu. Consigne, schéma, réglages et entrées sont identiques, il reste ces 10 caractères d'écart avec la passe mesurée. Les éviter demanderait de toucher `functions/src/ai.ts` (hors de ma voie). Le test le dit noir sur blanc. Je juge l'écart inoffensif (la consigne décrit « une liste d'objets { i, base, kind, stockCategory } »), mais il n'est pas mesuré ; une passe de 0,005 CHF la pièce le lèverait.
- **Une panne passagère (503) donne deux tentatives côté serveur, toutes deux sur la 3.8** (règle commune `GEMINI_ATTEMPTS = 2` d'aiTask, testée : au plus 2 appels). Côté client : un seul appel, jamais de reprise.
- **Le cache de lecture se vide une fois au déploiement** : `invoiceEngineDigest` (D273c) hache les modules importés par `ai.ts`, dont `prompts.ts` que je modifie. Les pièces déjà lues seront relues une fois (quelques centimes, rien enregistré), comme au redéploiement D274. Ce n'est pas un changement de la lecture.
- **Fichiers non versionnés dont mes tests dépendent** : `scripts/banc-noms-fr.ts` et `tests/unit/banc-noms-fr-texte.test.ts` sont encore `??` (non suivis par Git). `aiTask-traduireNoms.test.ts` et `cleBase.test.ts` importent le banc : à valider dans le même commit, par chemins. `functions/` n'importe rien de `scripts/` (la consigne est recopiée dans `prompts.ts`, d'où le test d'égalité).
- La table n'a pas la garde de version IndexedDB de `proofQueueStore` (base neuve, un seul client, cache sans valeur légale) ; toute erreur Dexie est avalée et vaut table absente.
- Le brouillon des lignes n'a pas encore de champ `nameFr` : c'est le pilote (f3) qui le pose (étape 4).

## Commande de déploiement ciblée (au pilote, pas lancée)
```
firebase deploy --only functions:aiTask --non-interactive
```
(le `predeploy` de `firebase.json` lance `npm --prefix functions run build`). À rejouer ensuite sur l'app en ligne : une pièce, une seule lecture, un seul appel `traduireNoms` au journal (`Tâche IA exécutée`, `task: traduireNoms`, `model: gemini-3.8-flash`).

## BRANCHEMENT À L'ÉCRAN (pour le pilote ; f3 écrit `ExpenseSheet.tsx` et `src/ui/depense/**`)
Ancres prises sur `src/ui/finance/ExpenseSheet.tsx` d'aujourd'hui. Principe recommandé : poser `nameFr` seulement (affichage) ; `description` (que lisent le rapprochement, `articleName` de l'article neuf et la validation) ne bouge pas, pour ne jamais créer une fiche de plus (« Attention au mapping »). Que l'article neuf prenne ensuite le français est un choix à part (voir DÉCISION).

**(0) Le champ** — dans `src/services/purchaseEntry.ts`, interface `PurchaseLineDraft`, à côté de `imprime?` :
```ts
  /** D280 : la désignation en français de la base de l'imprimé (appel à part, `src/services/nomsFr.ts`) ; jamais exigée, jamais lue par le stock ni la validation. */
  nameFr?:string;
```
**(a) Appeler après la lecture, sans attendre** — imports en tête de `ExpenseSheet.tsx` :
```ts
import { traduireLignes, retenirNomBrasseur } from '../../services/nomsFr';
```
un jeton à côté de `qrJeton` (ex. `const nomsJeton=useRef(0);`), puis dans `applyOutcome`, juste APRÈS l'appel `setDraft(previous=>{const proposed=applyScannedDescription(previous,result)…});` (la ligne qui finit par `scanModel:outcome.model,documentHash},swissToday());});`) :
```ts
    /* D280 : le français des noms de base, à part de la lecture, sans l'attendre. Jamais bloquant, jamais d'exception ; hors ligne ou en échec, le nom imprimé reste. */
    const jeton=++nomsJeton.current;
    void traduireLignes(lines.map(l=>({name:l.imprime?.nom??l.description,variant:l.imprime?.variante,unit:l.unit,kind:l.kind,stockCategory:l.stockCategory,stockAction:l.stockAction,stockRef:l.stockRef})),{stock:stockItems,enLigne:online}).then(noms=>{
      if(!mounted.current||nomsJeton.current!==jeton||!noms.size)return;
      const parId=new Map(lines.map((l,rang)=>[l.id,noms.get(rang)]));
      setDraft(previous=>({...previous,lines:previous.lines.map(l=>{const fr=parId.get(l.id);return fr&&!l.nameFr?{...l,nameFr:fr}:l;})}));
    });
```
(`lines` est le tableau déjà rapproché, dans l'ordre des rangs ; l'appariement se fait par `id`, donc une ligne ajoutée ou retirée pendant l'appel ne décale rien. `online` est l'état déjà présent ligne 177.)

**(b) Montrer `nameFr`** — là où la rangée écrit le libellé (`libelleLu` / champ « Libellé de la facture », ligne ~591), lire `line.nameFr?.trim()||line.description`, l'imprimé restant à côté (`data-dp-imprime`, ligne ~641). Le champ ne s'affiche jamais comme « lu » : c'est une traduction (à f3 de la signaler si l'écran choisi le demande).

**(c) Enregistrer `par:'brasseur'` quand il retouche le nom d'une ligne** — dans le `onChange` du champ « Libellé de la facture » de la ligne (là où est aujourd'hui `onChange={description=>updateLine(line.id,{description})}`), quand la ligne a un imprimé (donc un nom de base lu) :
```tsx
onChange={v=>{
  if(line.imprime){updateLine(line.id,{nameFr:v});void retenirNomBrasseur({name:line.imprime.nom,variant:line.imprime.variante,unit:line.unit},v);}
  else updateLine(line.id,{description:v});
}}
```
et `value={line.imprime?(line.nameFr??line.description):line.description}`. Effacer le champ efface `nameFr` et retire la base de la table (elle redeviendra traduisible). Une ligne SANS imprimé (tapée, ou sans options) garde le comportement actuel : son texte est `description`, aucune traduction n'est gardée.
Si f3 a déjà déplacé ces deux ancres, garder le principe : appeler après `applyOutcome`, apparier par `id`, ne jamais écrire `description`.

## Hors périmètre
`lireOptions` et ses règles (voie f1) ; l'écran et `ExpenseSheet.tsx` ; la lecture `scanInvoice` ; un nouveau banc du préfixe « Données : » ; le déploiement ; la table en lecture côté « fiche article neuf ».

DÉCISION À PRENDRE : l'article NEUF d'une ligne porte-t-il le nom français (`nameFr`) ou la base imprimée ? Options : (1) base imprimée comme aujourd'hui (aucune fiche en plus, mapping inchangé) ; (2) `nameFr` quand il existe (« Ça traduit en français », D271), avec le risque d'un même produit nommé deux façons selon que la traduction est arrivée avant ou après le rapprochement. Recommandation : (1) pour cette livraison, (2) ensuite et seulement si le rapprochement lit la clé `cleBase` de la table, pour qu'une même base donne toujours le même nom d'article.

CONNAISSANCE : l'empreinte du moteur de lecture (`invoiceEngineDigest`) inclut `prompts.ts` : ajouter une tâche texte à `prompts.ts` invalide une fois le cache de lecture, même si `scanInvoice` ne change pas. Le plafond de sortie d'une tâche `aiTask` est statique (`TaskDef.maxOutputTokens`) ; la formule dynamique du banc (`600 + 36 × noms`) y devient son maximum au plus gros ticket (35 lignes).

LEÇON PROPOSÉE : aucune
