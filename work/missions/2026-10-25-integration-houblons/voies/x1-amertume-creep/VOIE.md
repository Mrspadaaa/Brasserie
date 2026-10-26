# Voie x1-amertume-creep — amertume au dry hop, hop creep et familles près de leur limite, pour Dryhopper

Agent : auteur (Sonnet), pour du calcul et des données. **Aucun changement d'interface dans cette voie** : le dessin viendra de ses
mini maquettes (voie m5), une fois ces valeurs prêtes.

## Ses mots (26.10)
Sur Dryhopper de Cascade (21C, 4 g/L, dry hop après, 3 j), il barre d'une croix rouge l'espace vide sous la barre IBU, côté
ébullition, et écrit : « Amertume, hop creep ? Résineux ? ».

## Ce qui existe
- **Amertume au dry hop** : `functions/src/hopBitternessCore.ts`, `dryHopBitterness()`. Un équivalent d'amertume, jamais un IBU
  mesuré. Il combine les humulinones apportées et l'iso-α de la cuisson adsorbé, à partir d'essais publiés. Sa science :
  `hopBitternessSchema.ts`. `src/domain/hopIndex/v4/ibuMoments.ts` dit qu'il n'est « non branché ici » : c'est le « +? » de
  « IBU 28+? ».
- **Hop creep** : `src/domain/hopDecision/biotransformation.ts`, constat `hopCreep` (Kirkpatrick 2018), dans l'atelier V5.5.
- **Familles près de leur limite** : le style 21C range le résineux en neutre (bande 0–30). Cascade y est à +27, mais la rangée du
  haut ne montre que les familles attendues.

## À faire
1. **Amertume au dry hop.** Une fonction de `src/domain/hopIndex/v4/`, appelée avec la recette et l'ajout à froid, qui rend :
   l'équivalent d'amertume final, le delta, et sa plage, son statut et ses raisons.
   - Elle réemploie `dryHopBitterness()` : pas de copie du modèle.
   - Les IBU à chaud viennent du calcul actuel de la recette.
   - Hors du domaine des essais (dose trop haute…) : le statut et la raison du modèle, jamais une valeur inventée.
   - Dis comment la « science » (`HopBitternessScience`) est chargée dans l'app, et si elle est activée.
2. **Hop creep.** Un indicateur qualitatif et sourcé :
   - risque nul, faible, moyen ou fort ;
   - selon le moment (actif, après), la dose (g/L), la durée de contact et la température si elle est connue ;
   - et ce qu'il fait : atténuation en plus, CO₂, diacétyle possible.
   - Pars du constat `hopCreep` et de ses sources. Écris la règle avec ses seuils et leur source.
   - Pas de valeur par variété sans source : aucune donnée d'activité enzymatique par houblon n'est au catalogue, et la collecte n'en
     a pas trouvé.
3. **Familles près de leur limite.** Pour un ajout, les familles qui ne sont pas attendues par le style mais qui s'approchent de
   la borne haute de leur bande, ou la dépassent, avec l'écart. Par exemple, le résineux de Cascade en 21C : +27 pour une borne
   de 30. Même lecture que « Au style » (D68).
4. **Tests** : sur Cascade en 21C à 4 g/L, dry hop après 3 j, comme sa capture, et sur Nugget en 16D, chacun des trois
   indicateurs avec sa valeur ou son statut. Plus un cas hors domaine.
5. Dans RESULTAT.md, pour sa capture : les trois valeurs exactes, avec leur source et leur statut, ce que la voie m5 affichera.

## Critères
- `npx vitest run tests/unit/hopIndexV4` vert, `moteurInchange` compris : aucune empreinte ne change, ce sont des ajouts.
- `npm run build` vert, B5 ≤ 160 ko.
- Aucun appel réseau, aucune valeur inventée : chaque nombre a sa source ou son statut « inconnu ».

## Possède
- Un nouveau module dans `src/domain/hopIndex/v4/`, par exemple `froid.ts`, qui ne change aucun module existant sauf une
  exportation.
- `tests/unit/hopIndexV4/`.
- `work/missions/2026-10-25-integration-houblons/voies/x1-amertume-creep/`.

Rien dans `src/ui/`. N'écris aucun code par heredoc ni par `node -e`. Pas de `git mv`, pas de `git stash`.

Écris RESULTAT.md tôt. Retour en une ligne.
