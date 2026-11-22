OK — T2B-3 mesuré : la cause est dans EtapeLevure.tsx (interdit), correction proposée ; test « ne se remonte pas » écrit

## Verdict de la mesure (BrewWizard réel, étape Levure, jsdom, React Profiler)
Sortie de `tests.txt` (ms) : `{"retour1":105.1,"retour2":101.4,"retour3":104.6,"comparer":17.6,"comparer2":22.4,"montagesMaLevure":[108,68,73,71]}`
- Un retour sur Ma levure ≈ 100 ms ; un passage sur Comparer ≈ 18 à 22 ms : même rapport (×5) que le constat en ligne (1,2 s contre 15 à 55 ms).
- Le wizard ne remonte pas l'étape : le nœud `[data-lv="etape"]` reste le même après trois allers-retours (assertion du test).
- `MaLevure` se remonte à chaque retour : 4 montages pour 1 arrivée + 3 retours, 68 à 73 ms chacun à chaud (108 ms à froid), mesurés par Profiler
  (`actualDuration`, phase `mount`). Les `useMemo` du composant repartent de zéro.
- Le calcul du domaine n'est pas en cause : `createYeastRecipeDraft` + `evaluateYeastRecipeDesign` ≈ 3 ms à chaud (10 + 17 ms à froid, 1ʳᵉ fois), `doseDeLaLevure` < 1 ms,
  classement du catalogue (1 734 fiches) 9 à 13 ms à chaud mais calculé dans EtapeLevure sous `useMemo` : il ne se relance pas au retour.
  Le coût est le rendu de l'arbre de MaLevure (carte, effets, conduite, champ de recherche, replis), refait en entier.
- BrewWizard seul coûte < 20 ms par geste (Comparer : 18 ms, qui contient son propre re-rendu).

## Cause et fonction fautive
`src/ui/etapeLevure/EtapeLevure.tsx` ligne 233 : `{vue === 'ma-levure' && <> <MaLevure …/> <div className="lv-replis">…</div> </>}` ; Chercher, Comparer et Suggérer
sont montés de la même façon (lignes 256 à 258). Changer d'onglet démonte donc la vue quittée.
Le chemin « garder l'onglet monté depuis BrewWizard » (point 2 du contrat) est impossible : BrewWizard ne choisit pas ce rendu, il passe la prop `vue` à la coque.
Je n'ai donc rien changé dans BrewWizard.tsx ni dans `src/ui/etapeLevure/` (point 3).

## DÉCISION À PRENDRE (transmettre à la session de la refonte de `src/ui/etapeLevure/`)
Question : garder Ma levure montée quand on va sur Chercher, Comparer ou Suggérer ?
Option recommandée (méthode standard, React 19.2.8 est installé, `typeof React.Activity === 'symbol'`) : dans `EtapeLevure.tsx`, remplacer le bloc `vue === 'ma-levure' && <>…</>`
par `<Activity mode={vue === 'ma-levure' ? 'visible' : 'hidden'}> <>…MaLevure et replis…</> </Activity>`. Activity masque (display:none), garde l'état (replis ouverts, texte tapé,
focus de la saisie libre), démonte les effets de la vue cachée et rend sa mise à jour à basse priorité. Le retour devient un changement de mode : plus de montage.
 - À surveiller : (1) l'arbre masqué reçoit toujours les props, donc un `useMemo` coûteux se recalcule en arrière-plan à basse priorité ; sans importance ici (3 ms) ; (2) les tests
   `tests/integration/etapeLevure/*` qui cherchent `[data-lv="ma-levure"]` ou lisent `data-vue` : l'arbre caché reste dans le DOM (`display:none`), prévoir `getByRole` qui l'ignore déjà ;
   (3) le ré-ancrage `vaAu(...)` (scrollIntoView) ne vise que des replis visibles : sans effet sur un arbre masqué.
 - Variante sans Activity : monter Ma levure à la première visite et la masquer avec l'attribut `hidden` (`<div hidden={vue !== 'ma-levure'}>`), le plus simple ; mêmes surveillances.
 - Même traitement possible pour Chercher et Comparer si on veut qu'un aller-retour soit nul des deux côtés ; Ma levure d'abord, c'est elle qui coûte (≈ 70 ms contre ≈ 20).
Mon test d'acceptation est prêt : le second test de `tests/unit/levureMontage.test.tsx` (`it.fails`) devient vert à la correction ; vitest signale alors « expected to fail » : retirer `.fails`.
Ouvert pour la mesure en ligne (impossible ici, aucun accès réel) : la valeur 1,2 s vient de l'iframe PC ; le rapport ×5 de jsdom la rend plausible, pas équivalente.

## Rouge « avant » (L13)
Avant toute correction, le test « Ma levure ne se remonte pas » a échoué ainsi, sur le code actuel :
```
× T2B-3 · Ma levure se rouvre sans se remonter > l’onglet Ma levure ne se remonte pas au retour de Chercher ou de Comparer
  AssertionError: expected 3 to be 1 // Object.is equality      (compteur de montages de MaLevure : 3 pour 1 attendu)
```
Dans la livraison, ce test est `it.fails` : il décrit le comportement voulu, échoue tant que la coque n'est pas corrigée, et la suite reste verte.

## Critères
- G1 : `npx vitest run tests/unit/levureMontage.test.tsx` → 2 tests passés (1 mesure, 1 `it.fails`), sortie dans `tests.txt`. VITEST OK. Il est vert grâce à `.fails` : c'est le pilote qui juge
  si cette forme lui convient (alternative : le laisser rouge, mais il casserait la suite).
- G2 : `npx tsc --noEmit -p .` → sortie vide, code 0 (TSC OK) à la relecture finale. Au premier passage, une seule erreur étrangère à la voie
  (`StocksTab.tsx(52,36): TS2307 '../../ui/stock/defileFenetre'`, fichier de la voie stock alors en cours d'écriture) ; disparue au rejeu. 2 essais.
- G3 : ce fichier cite le rouge d'avant (section ci-dessus).

## Fichiers
- Écrit : `port-carnet/tests/unit/levureMontage.test.tsx` (nouveau). `src/pages/BrewWizard.tsx` : inchangé. `src/ui/etapeLevure/` : intact.
- `tests.txt` (sortie vitest).
- Essais : 1 pour le test ; 0 essai de correction (hors contrat).

## À regarder en vision (pilote ; rien changé à l'écran)
`?dev-local`, recette, étape Levure, 390 tactile et 1280 : toucher Chercher puis Ma levure, Comparer puis Ma levure. Le retard au retour est le défaut ; il disparaît à la correction de la coque.

CONNAISSANCE : un retour d'onglet lent sur l'étape Levure vient de la vue démontée (`vue === 'x' && <…/>` dans la coque), pas du wizard ni du domaine ; la méthode standard est React `Activity`.
LEÇON PROPOSÉE : aucune
