---
name: monkey-testing
description: Monkey testing de L'Affinée — trois règles de construction, deux angles morts à couvrir, et le bug de cumul de stock qu'il a révélé.
type: agents
maj: 2026-10-22
sources: mémoire locale affinee-monkey-testing.md ; tests/integration/monkey.test.tsx
---

`tests/integration/monkey.test.tsx` (05.09.2026) : on tape au hasard, partout, sur l'atelier de l'eau et sur l'assistant de recette. Trois règles sans lesquelles un monkey ne sert à rien :
1. **Rejouable** : tirage par graine fixe (`mulberry32`). Un échec donne un numéro de graine et un journal des douze derniers gestes : la séquence se relance à l'identique.
2. **Il teste la SURVIE, pas la logique** : l'écran reste debout et n'affiche jamais NaN / undefined / Infinity.
3. **Il journalise** : sans journal, un échec dit « ça a planté » et rien de plus.

**Deux angles morts à couvrir explicitement**, sans quoi le monkey passe vert à tort :
- `textContent` ne voit PAS le contenu d'un `<input>`, qui vit dans la propriété `value` : un `<input value="NaN">` passe inaperçu. Parcourir les champs à part.
- React ne s'ARRÊTE pas quand un champ passe de contrôlé à non contrôlé, ou qu'une liste a deux clés identiques : il écrit dans `console.error` et continue. Espionner la console et lever soi-même : c'est ce qui a tout débloqué. ⚠️ React formate en `%s` + arguments : substituer pour lire la clé, sinon « two children with the same key, `%s` » est inexploitable.

**Ce qu'il a trouvé : le cumul de stock (le vrai défaut).** La clé dupliquée `Citra` n'était que le symptôme. En dessous, `shortages` (`BrewWizard`) comparait CHAQUE ligne de recette au stock séparément. Une NEIPA emploie deux fois le même houblon (40 g au whirlpool, 60 g à cru). Avec 70 g en réserve, les deux tests réussissaient (70 ≥ 40, puis 70 ≥ 60) et l'écran annonçait « Tout est disponible pour brasser », alors qu'il manquait 30 g, découverts le jour du houblonnage à cru. **On CUMULE d'abord, on compare ensuite**, sur une clé `nom|unité`. Verrouillé par trois tests dans `dataEntry.test.tsx`.

**Champs anonymes, corrigés sur les six étapes.** Un test de nommage parcourt les six étapes de l'assistant et n'accepte aucun champ sans nom. `Field` posait une étiquette sans `htmlFor` : taper sur l'intitulé ne donnait pas le focus. ⚠️ Un `placeholder` ne remplace pas un nom accessible ; sur `Combobox` il est remplacé par le libellé de l'option choisie. `Combobox` et `IngredientPicker` prennent donc un `ariaLabel` explicite ; les champs chiffrés passent par `InlineNum`, qui porte son nom lui-même.

Voir [[design-system-historique]] et [[verification-locale]].
