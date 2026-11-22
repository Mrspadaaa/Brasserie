OK — 4 causes prouvées par 12 tests rouges sur HEAD (verts avec correctifs proposés) ; relevé des divergences au banc

Voie k6-diagnostic, mission 2026-11-01-banc-lecture. Aucun `GATES.md` n'existait dans le dossier de la voie : les critères sont les 4 questions de VOIE.md. Aucune valeur de la pièce n'est écrite ici (fixture inventée, même forme). Aucun appel Gemini, aucun commit, rien dans `functions/` ni `src/` du dépôt.

## Fichiers écrits
- `tests/unit/depense/banc-k6/piece.ts` (pièce inventée : 10 lignes + port, TVA comprise, deux taux sans base ni total de TVA, total arrondi à 5 centimes)
- `tests/unit/depense/banc-k6/tva-d262a.test.ts`, `arrondi-d261b.test.ts`, `genres-d262c.test.ts`, `troisieme-d261c.test.ts`
- `scripts/banc-lecture-facture.ts` : ajout seul de `releveDivergences`, `texteDivergences`, `divergencesDe`, du champ optionnel `divergences` de `DrawRecord`, et d'une ligne de journal par paire. `needsThird`, les parcours et le jugement ne changent pas.
- ce `RESULTAT.md`

## Preuve
Commande : `node work/missions/2026-10-31-ecran-depense/voies/p3c-port/copie.mjs "npx vitest run tests/unit/depense/banc-k6 tests/unit/banc-lecture-facture.test.ts tests/unit/banc-lecture-k5.test.ts tests/unit/invoiceScanVote.test.ts"`
- Sur HEAD : `Tests 12 failed | 225 passed (237)`. Les 12 rouges sont exactement les tests intitulés « ÉCHOUE aujourd'hui » (3 D261b, 3 D262c, 3 D262a, 3 D261c : 12) ; les tests existants du banc et du vote restent verts (le relevé ne les touche pas).
- Avec les 5 correctifs ci-dessous posés dans la copie isolée seulement (jamais dans le dépôt) : `tests/unit/depense` (83 fichiers) + `invoiceScanVote` + `banc-lecture-*` : 1539 verts ; restent rouges 5 tests : les 4 tests « AUJOURD'HUI (cause ; à retirer une fois le correctif posé) » et la parité du relevé, qui reflète volontairement le code d'aujourd'hui (à remettre à niveau avec le correctif, voir plus bas). `tsc --noEmit` (src) : aucune erreur sur les fichiers touchés.
- Essais : 1 par critère, plus 1 reprise du correctif D261c (voir « doutes »).

## 1. D262a — TVA : cause
La règle du bloc de TVA ne lève rien. Sur la pièce imitée lue seule, `vatBlockCheck` (`functions/src/invoiceScanCore.ts:205`, appelé :341) ne pose ni `tva-incoherente` ni `ht-tva-ttc` (`totalsCheck`, `invoiceControls.ts`) ; un port hors taux n'entre dans aucune relation. Test vert.
Ce qui pèse est le rapprochement des deux Flash-Lite : `reconcileInvoiceVision`, boucle d'en-tête (`functions/src/invoiceVisionReview.ts:258-271`). Aucun total de TVA n'est imprimé, seulement une taxe par taux. Une lecture écrit la somme des rangées, l'autre `null` (les deux se défendent ; la vérité du lecteur B de k6-verite le dit : « null serait aussi défendable »). Avec 2 lectures il n'y a pas de majorité (`majority` exige 2 voix égales) : point `lectures-divergentes` sur `tvaAmount`, `pese: true`, plus une remarque « Les lectures ne concordent pas » (ligne 268). `noTriggerHeader` (ligne 19) n'évite que la 3e lecture, pas le point.
Chaîne jusqu'à l'écran : `etat.ts:35` `nomDuPoint` nomme « TVA » un `lectures-divergentes` dont le champ contient « tva » → tuile ④ ; `ExpenseSheet.tsx:612` ; la remarque devient `hints.tvaAmount` (`purchasePrefill.ts:67`) → `ExpenseSheet.tsx:728` « Référence et TVA du document — À vérifier ». Sa capture le confirme : la tuile ne montre qu'UNE valeur chiffrée (une seule valeur numérique dans les `valeurs` du point, l'autre est `null`), et l'écran porte aussi ① Date (pas de date imprimée, juste), ② Lignes, ⑤ unité (pas de colonne d'unité, juste).
Deuxième contributeur, même effet : le modèle écrit lui-même une remarque `fieldWarnings.tvaRate` (« plusieurs taux, taux global fixé à null ») ; `invoiceFieldHints` la recopie. Précédent dans le dépôt : `tests/unit/depense/rapprochement/aide.ts`, `lectureB`. Test rouge.
Non prouvé : la lecture réelle de sa pièce (le journal `aiTask` n'est pas dans le dépôt). Une hypothèse H2 (un « Sub-Total » TTC lu comme HT) lève bien `ht-tva-ttc` ; le test la décrit (vert : la règle est juste, la lecture serait fausse). Le relevé du banc dira laquelle des trois s'est produite quand la pièce y passera (`divergences` dans `results.json`).
Correctif proposé (le plus petit) :
```diff
--- a/functions/src/invoiceVisionReview.ts   (boucle d'en-tête, avant `if (!decision) {`)
+    // D262a : aucun total de TVA imprimé quand le document donne une taxe par taux : somme des rangées contre null n'est pas un désaccord.
+    if (field === 'tvaAmount' && !unanime) {
+      const sommeBloc = (r: InvoiceScanResult): number | null => (r.vat.length && r.vat.every(row => toCents(row.amount) !== null) ? r.vat.reduce((s, row) => s + toCents(row.amount)!, 0) : null);
+      if (vals.every((v, i) => v === null || (toCents(v) !== null && toCents(v) === sommeBloc(readings[i])))) {
+        const lu = vals.find(v => v !== null);
+        if (lu !== undefined && lu !== null) merged[field] = lu;
+        continue;
+      }
+    }
--- a/src/services/purchasePrefill.ts   (invoiceFieldHints)
-  for (const warning of scan.fieldWarnings ?? []) if (!hints[warning.field]) hints[warning.field] = warning.message;
+  const tauxImprimes = new Set((scan.vat ?? []).map(row => row.rate).filter((rate): rate is number => typeof rate === 'number')).size;
+  const blocJuste = tauxImprimes >= 2 && (scan as { controls?: { vat?: { statut?: string } } }).controls?.vat?.statut !== 'ecart';
+  for (const warning of scan.fieldWarnings ?? []) if (!hints[warning.field] && !(warning.field === 'tvaRate' && blocJuste)) hints[warning.field] = warning.message;
```
Un vrai écart reste un désaccord (test vert : somme contre une autre valeur pèse toujours).

## 2. D261b — arrondi : oui, traité comme un écart
`sumCheck` (`functions/src/invoiceControls.ts`, `if (sum === ttc)` puis `const gap = ttc - sum`) compare au centime près. Un total imprimé arrondi à 5 centimes donne `somme-ecart`, `bloque: true` (statut « disputed ») ; seul le message ajoute « Rundung » en indice (`hint`, écart ≤ 5). Le client refait la même règle (`recomputeInvoicePoints`, `invoicePoints.ts`). Tests rouges : arrondi vers le haut, vers le bas, côté client. Tests verts de non-régression : total non multiple de 5 centimes (1 centime d'écart), multiple de 5 qui n'est pas l'arrondi (7 centimes), arrondi dans le mauvais sens (3 centimes) restent des écarts bloquants.
```diff
--- a/functions/src/invoiceControls.ts   (sumCheck, après `const gap = ttc - sum;`)
+  // D261b : total imprimé multiple de 5 centimes = somme des lignes arrondie à 5 centimes (Rundung) : pas un écart.
+  if (ttc % 5 === 0 && Math.abs(gap) <= 2 && Math.round(sum / 5) * 5 === ttc) return { points: [], sum: { statut: 'ok', base: 'TTC' } };
```
Aucune mention « arrondi » n'est posée (« au plus » ; le statut est `ok`). Une mention serait un champ de plus : à décider avec l'écran.

## 3. D262c — genres : d'où vient la famille
Ni le `kind` de la lecture ni une table de la lecture. Chaîne : `ExpenseSheet.tsx:59` `scanKind` (stock → ingredient) ; `:540-541` `contexteLigne` → `groupeDeLigne` ; `donneesDeLigne(...).contexte` → `contexteDe` (`src/services/stockLineMatching.ts:319-323`). Le `kind` n'y sert qu'à écarter `packaging` et `cleaning` ; sinon `contexteDeTexte` (`:311-317`) lit les MOTS du nom (`inferNature`, `ingredientIdentity.ts:292` ; `hasHopWord`, `hasYeastWord`, noms connus) et `stockCategory` (que le schéma de la lecture demande, `functions/src/prompts.ts:246`, souvent vide) ; le préfixe de référence (MA, HO, HE) est « faible » : il ne sert qu'à refuser (`:288`). Un article du stock rapproché donne sa catégorie. Puis `groupeDe` (`src/ui/depense/groupes.ts:30`) : 4 bandes seulement (malt, houblon, levure, autres). Le picto de la rangée (`Ligne.tsx:30`) dit le LIEN au stock, jamais la famille : d'où les 17 icônes identiques de la capture en ligne.
Sondé sur des noms de la même forme (probe retirée) : le nom de levure → levure, le « Malz » → malt, le houblon du catalogue → houblon : justes. Faux : un malt sans le mot « malt » (nom de marque, préfixe MA, kind stock) → autres ; un sac à houblon dont le nom contient « Hop » (kind equipment) → HOUBLON ; le sirop de sucre → autres (aucune famille sucre) ; matériel, emballage et le reste confondus dans « Autres ».
Tests rouges : malt sans mot de famille ; matériel contenant « Hop » ; pièce entière avec les bandes sucre, matériel, emballage (le port a déjà son traitement, `lignesDePort`).
```diff
--- a/src/services/stockLineMatching.ts   (contexteDe)
-  if (l.kind === 'packaging' || l.kind === 'cleaning') return 'autre';
-  return contexteDeTexte(l.description, l.stockCategory, l.reference);
+  if (['packaging', 'cleaning', 'equipment', 'maintenance', 'service', 'shipping', 'discount'].includes(l.kind ?? '')) return 'autre';
+  const contexte = contexteDeTexte(l.description, l.stockCategory, l.reference);
+  // ingrédient sans mot de famille : le préfixe de la référence imprimée (MA, HO, HE) départage, à défaut de mieux
+  if (contexte === 'autre' && l.kind === 'ingredient') return CONTEXTE_DE_CATEGORIE[inferNature(l.description, l.reference).weak ?? ''] ?? 'autre';
+  return contexte;
--- a/src/ui/depense/groupes.ts
-export type GroupeCle = 'malt' | 'houblon' | 'levure' | 'autres';
+export type GroupeCle = 'malt' | 'houblon' | 'levure' | 'sucre' | 'materiel' | 'emballage' | 'autres';
   (NOMS_GROUPES : + sucre: 'Sucres', materiel: 'Matériel de brassage', emballage: 'Emballage' ; ORDRE_GROUPES : malt, houblon, levure, sucre, materiel, emballage, autres)
-export const groupeDe = (contexte: string | undefined): GroupeCle => (...);
+const MOTS_SUCRE = /\b(candi|sirop|syrup|sucre|zucker|dextrose|honig|miel)\b/i;
+export const groupeDe = (contexte: string | undefined, kind?: string, description?: string): GroupeCle =>
+  kind === 'packaging' ? 'emballage' : kind === 'equipment' || kind === 'maintenance' ? 'materiel'
+  : contexte === 'Malt' ? 'malt' : contexte === 'Houblon' ? 'houblon' : contexte === 'Levure' ? 'levure' : MOTS_SUCRE.test(description ?? '') ? 'sucre' : 'autres';
--- a/src/ui/finance/ExpenseSheet.tsx   (:541 ; non modifié dans la copie, à poser avec le correctif)
-  const groupeDeLigne=(i)=>{...return groupeDe(contexteLigne(draft.lines[p>=0?p:i]));};
+  ... return groupeDe(contexteLigne(l), l.kind, l.description) avec l = draft.lines[p>=0?p:i]   (le kind et le nom de la ligne, pas ceux du malt parent pour une mouture : à régler au port)
```
Les bandes sont du dessin du brasseur (écran choisi, D105) : l'ajout de trois bandes demande le contrôle de choix avant de poser quoi que ce soit.

## 4. D261c — temps : ce qui appelle la 3.8
`compareInvoiceReview` (`invoiceScanCore.ts:418`) n'est appelée par aucun chemin vivant (`grep` : `ai.ts`, `invoiceScanVote.ts` ne l'importent pas). Le chemin vivant : `ai.ts:141-151` (étapes `parallele` ×2 puis `troisieme`) ; la 3.8 part si `needsThird` = `reconcileInvoiceVision([r1, r2]).needsCorrection` (`invoiceScanVote.ts:39`, `invoiceVisionReview.ts:415`) = `triggered` (tout champ d'en-tête qui diverge hors `tvaAmount`/`tvaRate` ; quantité, unité, montant, **kind**, référence d'une ligne ; un nom qui n'est ni une coquille ni les mêmes mots ; lignes sans vis-à-vis ; ambiguïté) ou `controlTriggered` (écart de ligne/somme dont une cellule diverge).
Sur cette forme de pièce, les causes prouvées par test : (a) le `kind` qui diverge entre deux natures (equipment / other) : sur sa pièce la vérité du lecteur B donne deux `kind` défendables pour 10 lignes sur 16 ; (b) le nom où une lecture colle la variante (« nom, Mischung… ») : `sameName` n'accepte que coquille ou mêmes mots ; (c) sa capture porte la chip ② « Lignes » = `lignes-non-rapprochees` : l'ancre par les chiffres (`invoiceVisionReview.ts:136`) exige le même `kind`, donc un `kind` et un nom qui divergent ensemble, sans référence lue, laissent deux lignes sans vis-à-vis (point qui pèse, 3e lecture). Les 3 tests de cause (« AUJOURD'HUI ») passent sur HEAD ; les 3 tests de contrat (« ÉCHOUE aujourd'hui ») échouent.
```diff
--- a/functions/src/invoiceVisionReview.ts
+/** D261c : natures qui ne touchent ni l'argent ni le stock ; leur divergence entre elles n'appelle pas la 3.8. */
+const SOFT_KINDS = new Set<string>(['equipment', 'other']);
   (ancre par les chiffres, ligne 136)
-  const cle = (item: Item) => [quantity, unit, amountTTC, comparisonKey('kind', item.kind)].join('|');
+  const cle = (item: Item) => [quantity, unit, amountTTC].join('|');   // sans `kind`
   (vote par champ de ligne, ligne ~380)
-          if (triggerItemFields.has(field)) triggered = true;
+          if (field === 'kind' && vals.every(v => typeof v === 'string' && SOFT_KINDS.has(v))) { /* pas de 3e lecture */ }
+          else if (triggerItemFields.has(field)) triggered = true;
           else if (field === 'name') {
+            // même référence imprimée ET même premier mot du nom dans toutes les lectures : la variante collée n'achète rien
+            const tete = (s: string) => canonicalText(s).split(/[^a-z0-9]+/).filter(Boolean)[0] ?? '';
+            const sameRef = canonicalText(baseItem.reference ?? '') !== '' && aligned.every(c => canonicalText(c.item.reference ?? '') === canonicalText(baseItem.reference ?? ''));
             const [a, ...autres] = vals as string[];
-            if (autres.some(b => !sameName(a, b))) triggered = true;
+            if (autres.some(b => !sameName(a, b) && !(sameRef && tete(a) !== '' && tete(a) === tete(b)))) triggered = true;
```
Le relevé : `releveDivergences(r1, r2)` rend, par paire, `{champ, ligne, code, lectures, pese, declenche}` (champs seulement, aucune valeur ; test : aucun nom ni montant dans la sortie). `declenche` reproduit les règles ci-dessus ; la parité avec `needsCorrection` est testée sur les 20 paires du rapprochement et sur les cas de la pièce. `results.json` gagne `records[].divergences` (paires `A`, `C`, groupes lite) ; le journal du banc écrit « divergences C : !kind×2, name » (« ! » = appelle la 3.8). Le jugement et les parcours sont inchangés.

## Doutes et limites
- La cause de D262a est « la plus probable » (capture, vérité, code concordent) mais la lecture réelle de la pièce n'a pas été vue ; le relevé du banc la confirmera ou non.
- D261c : le correctif proposé est PARTIEL, à dessein : equipment contre other seulement. Sur sa pièce, d'autres paires se défendent (equipment contre stock, packaging contre stock, other contre packaging) et appelleraient toujours la 3.8 ; ≤ 12 s n'est pas garanti. Une première version qui exemptait aussi `maintenance` et `service` cassait 5 tests existants de `invoiceScanVote`/`banc-lecture-facture` (leurs fixtures divergent sur ces `kind`) : revue avant de l'élargir. Une seconde version du test de nom (même référence seulement) cassait un cas du corpus (Cascade / Hallertau sous la même référence) : d'où « même premier mot ».
- D262c : le préfixe de référence (MA, HO, HE) était « faible » exprès (convention d'un autre fournisseur). Le proposer en repli pour un ingrédient suppose que le second fournisseur suit la même convention : à confirmer sur d'autres pièces. Le correctif le plus sûr est que la lecture remplisse `stockCategory` (consigne), mais elle l'écrit vide sur cette forme de pièce.
- Après pose des correctifs : retirer les 4 tests « AUJOURD'HUI » et remettre `releveDivergences` au niveau du code (SOFT_KINDS, nom, ancre) ; la parité le signalera.
- Rien n'a été joué dans Chrome (aucune interface écrite) ; les bandes sucre/matériel/emballage sont une décision de dessin.

DÉCISION À PRENDRE : D261c, jusqu'où exempter la divergence de `kind` de la 3e lecture. Options : A (proposée) equipment/other seulement, sûre, gain modeste ; B `kind` ne déclenche jamais, il pèse un point que l'écran montre (gain net, mais un ingrédient lu matériel n'est plus relu) ; C mesurer d'abord au banc (relevé fait pour ça) avec la pièce doc14 puis choisir. Recommandation : C, puis A, B seulement si le brasseur accepte de relire lui-même le genre.
DÉCISION À PRENDRE : D262c, trois bandes de plus (sucre, matériel de brassage, emballage) sur un écran qu'il a choisi : à lui montrer en variantes avant le port (L24) ; le contexte (`contexteDe`) peut être corrigé sans toucher au dessin.

CONNAISSANCE : une divergence d'en-tête à deux lecteurs ne peut jamais être tranchée (`majority` veut 2 voix) : tout champ où une lecture écrit `null` et l'autre une valeur recoupée par le document (TVA sans total imprimé, n° de facture absent contre déduit…) pèse et pose « À vérifier » ; le relevé `releveDivergences` sert à le voir champ par champ. `compareInvoiceReview` est du code mort.
LEÇON PROPOSÉE : aucune
