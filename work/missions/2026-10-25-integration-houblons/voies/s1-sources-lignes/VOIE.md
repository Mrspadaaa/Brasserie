# Voie s1-sources-lignes — un trait par source qui diffère, jamais deux traits pour la même valeur (exigence transversale)

Agent : auteur (Sonnet), pour du code. Les écrans sont ses choix : on applique sa règle sans rien redessiner d'autre. Lis
`.claude/rules/affinee-frontend.md`.

## Ses mots (26.10)
Sur Substituer, rangée β : Lotus 5–6, avec deux traits fins sous la barre, un par source. Il écrit : « Bien montré les différents
source, comme ici pour lotus, c'est déjà bien fait normalement mais pas oublier. Après si plusieurs sources disent la même chose
pas besoin de toutes les montrer ».

## La règle (exigence transversale, L05)
- Sous une barre de valeur (α, β, huile, cohumulone…), chaque source dont la plage diffère a son trait fin, comme aujourd'hui.
- Les sources qui donnent la **même plage** n'ont qu'**un** trait. Leurs noms vont au survol, ou dans le texte des sources s'il
  existe.
- « La même plage » : mêmes bornes, une fois arrondies à la précision affichée (5–6 et 5,0–6,0 sont la même chose).
- Toutes les sources comptent, celles du catalogue comme celles de `complements.json` (valeurs valides). Rien n'est caché pour
  gagner de la place.
- Aucun « +n ».

## À faire
1. **Trouve tous les endroits qui dessinent un trait par source** : la barre α et β de Substituer (u4), Comparer (feuille Valeurs
   et ses lignes), la fiche, Dryhopper, et tout autre écran. Cherche « une source chacun », les traits fins, et les lectures de
   `hs`, `alpha`, `beta` et des compléments.
2. **Pour chacun, dis d'où viennent ses sources.** Aujourd'hui, la barre de Substituer ne lit peut-être que Beer Maverick et
   Hopsteiner. Si un écran ne lit pas les compléments, il les lit maintenant, par le chargeur existant (`complements-ui.ts`, déjà
   préchargé au repos).
3. **Applique le dédoublonnage** dans une seule fonction partagée, testée.
4. **Un contrôle (L05, L13)**, sur tous les écrans de la liste, qui échoue d'abord :
   - aucune barre ne montre deux traits de même plage ;
   - chaque plage distincte a son trait.

   Un test sur des houblons à plusieurs sources : Lotus, Citra et Galaxy (Galaxy a plus de cinq sources pour l'α). Rouge sur HEAD
   dès qu'une barre montre deux traits identiques, ou qu'une source qui diffère manque.
5. **Captures en 390 × 844**, ouvertes et regardées : Substituer avec Lotus, Magnum (US) et Southern Star (sa capture), puis
   Galaxy. Les rangées α et β, et la même rangée dans Comparer.

## Critères
- Le contrôle : rouge sur HEAD, vert après.
- `npx vitest run tests/unit/hopIndexV4 tests/unit/designTokens.test.ts` vert ; `npm run build` vert ; B5 ≤ 160 ;
  `node scripts/audit_inputs.mjs` passe.
- Captures ouvertes, et la règle vérifiée à l'œil sur chacune.

## Possède
- Les composants qui dessinent ces traits dans `src/ui/hopIndex/` : dis lesquels.
- Une fonction partagée, dans `src/ui/hopIndex/commun/`.
- `tests/unit/hopIndexV4/`, `tests/integration/`.
- `work/missions/2026-10-25-integration-houblons/voies/s1-sources-lignes/`.

D'autres voies sont en vol :
- x1 ajoute un module dans `src/domain/hopIndex/v4/` ;
- m4 fait des captures avec l'ordre imposé de Substituer ;
- e3 met à jour les états de la maquette.

Ne touche pas à leurs fichiers. Si ton changement modifie un état de la maquette (`controle-etats`), dis lequel. N'écris aucun code
par heredoc ni par `node -e`. Pas de `git mv`, pas de `git stash`.

Écris RESULTAT.md tôt. Retour en une ligne.
