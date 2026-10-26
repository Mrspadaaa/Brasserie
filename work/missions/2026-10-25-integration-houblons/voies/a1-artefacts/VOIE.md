# Voie a1-artefacts — le contour de l'original absent du radar, et les restes de test des maquettes dans l'app (D156, D158)

Agent : auteur (Sonnet), pour diagnostiquer et corriger du code. Les écrans sont ses choix : on répare, on ne redessine pas. Lis
`.claude/rules/affinee-frontend.md` avant de toucher à l'interface.

## Ses mots (26.10, sur l'app déployée, au téléphone)
- « Et sur le radargraph, on voit pas Galaxy »
  - Sa capture : Substituer de Galaxy au dry hop, radar « Galaxy (l'original, contour seul) · Nectaron · Citra cryo ».
  - Seuls Nectaron (bleu) et Citra cryo (vert) sont tracés. Aucun contour de Galaxy, alors que son tableau Arômes 21C lui donne
    agrumes, tropicaux et noyau.
- « Il semble y avoir encore des données et artefacts de test des mini maquettes »
  - Il n'a pas dit lesquels. Ses trois captures, tout le texte visible, sont recopiées ci-dessous.

### Ce que montrent ses captures
1. **Substituer, Galaxy**, haut du radar, puis α :
   - « trois fiches ne les décrit, ce n'est pas zéro. Fiches lues : Galaxy 1, Nectaron 1, Citra cryo 1. Pointillé : non décrit. » ;
   - radar avec « marqué », « cité », « 0 » sur l'axe ; secteur « sans donnée » hachuré, avec 7 pictos ;
   - légende : « Galaxy (l'original, contour seul) ● Nectaron ● Citra cryo » ; « gras : attendu en 21C » ; « Du centre vers le bord :
     non décrit, cité, marqué. ? : aucune des trois fiches ne décrit la famille, ce n'est pas zéro. » ;
   - α :
     - Galaxy 11–16, « lot 17,2 » ;
     - Nectaron 9,5–12, « lot 11 » ;
     - Citra cryo 10–15, « article 24,8 » ;
   - pied : « 60 g de Galaxy à 95′ → 60 g de Citra cryo au dry hop ».
2. **Substituer, Galaxy, liste au dry hop** :
   - « 95′ · recette / whirlpool / dry hop » ;
   - « Au dry hop, l'arôme fait le score. Galaxy au dry hop : ta bière passerait de 109,6 à 0 IBU ; chaque remplaçant à masse
     égale. » ;
   - « Zamba Blend, 92 sans inconnue. Samba va de 68 à 98. Zamba Blend garde agrumes, tropicaux et noyau (fiches). » ;
   - liste : Zamba Blend 92, Harlequin 91, Nectaron 89, NZH-107 88, Citra cryo 78, Hallertau… 78, Samba 68–98.
3. **Dryhopper, « Quand ajouter Galaxy ? »** :
   - « Galaxy α 17,2% ≠ 11–16 mixte », « 3 g/L », « Bière 21C », « Au style / Absolu » ;
   - « Face à ta bière » : floral ?, baies ?, résineux ?, IBU ~94 ;
   - frise : +20, +10, « résineux baies floral », « 1 h ≈ 96 h », « levure active possible, non chiffrée », « levure finie », 45′ ;
   - jours : 1 j, 2 j, 3 j, 7 j ;
   - familles : Floral, Herbacé, Terreux, Agrumes, Tropicaux, toutes « ? » ;
   - pied : « jamais mesuré à ce moment », « Levure rien ne change ici ».

## À faire
1. **Le contour de l'original (D156).**
   - Reproduis le cas dans l'app : `?dev-local&etape=houblons`, `VITE_HOP_V4=on`, Galaxy dans la recette, Substituer au dry hop,
     Nectaron et Citra cryo comparés.
   - Trouve pourquoi le contour de Galaxy ne se voit pas : non tracé, caché derrière un remplissage, de la couleur du fond, ou
     confondu avec l'échelle. Lis `src/ui/hopIndex/substituer/Radar.tsx` et le radar commun `src/ui/hopIndex/commun/RadarBase.tsx`.
   - Corrige-le, avec un contrôle Chrome qui échoue d'abord sur 49907352 : chemin présent, trait d'au moins 1,5 px, contraste avec le
     fond, et au moins 3 sommets quand l'original cite 3 familles.
   - Vérifie aussi les autres radars qui montrent un « original » ou une référence (Comparer, la fiche), et dis lesquels ont le même
     défaut.
2. **Les restes de test (D158) : un audit d'abord, sans rien corriger à l'aveugle.**
   - Dans le code atteint par l'app quand le drapeau `hopV4` est allumé (`src/ui/hopIndex/`, `src/domain/hopIndex/v4/`), cherche
     ce qui vient des fixtures ou des maquettes et peut s'afficher sur une recette réelle :
     - les imports de `prototypes/`, de `tests/fixtures/` ou de `src/data/hopV4/proto-data.json` (clés `fixture`, `stock`) ;
     - les constantes de démonstration (S1, `DEMANDE_DEGUSTEE`, recettes, dégustations, stock), les noms et nombres codés en dur
       (« Nugget », « 46 g », « lot 13 »…) ;
     - les textes de légende propres aux maquettes ;
     - ce que `?dev-local` ajoute et qui fuirait hors du développement.
   - Rends une liste : chaque élément avec son fichier et sa ligne, ce qu'il affiche, d'où il vient, et ton verdict (« reste de
     test », « voulu », « à lui demander »).
   - Corrige seulement les « reste de test » certains (une donnée de fixture affichée comme sa donnée). Le reste va en DÉCISION À
     PRENDRE.
   - Les textes de légende de ses maquettes choisies sont voulus (règle n° 1), sauf s'ils décrivent une donnée de démonstration.

## Critères
- Le contrôle du contour : rouge sur 49907352, vert après, en 390 × 844 et en 1280 × 800.
- `npx vitest run tests/unit/hopIndexV4 tests/unit/designTokens.test.ts` vert ; `npm run build` vert ;
  `node scripts/audit_inputs.mjs` → `INPUT PROTECTION AUDIT PASSED`.
- Captures ouvertes : le radar de Substituer de Galaxy, avant et après.
- RESULTAT.md : la liste de l'audit.

## Possède
- `src/ui/hopIndex/substituer/Radar.tsx`, `src/ui/hopIndex/commun/RadarBase.tsx` (correctif du contour seulement).
- `src/ui/hopIndex/` pour les seuls restes de test certains (dis lesquels).
- `tests/integration/` (le contrôle), `tests/unit/hopIndexV4/`.
- `work/missions/2026-10-25-integration-houblons/voies/a1-artefacts/`.

D'autres voies sont en vol :
- e2 possède `src/domain/hopIndex/v4/substitution.ts` et `scripts/eval-hop/` ;
- d4 possède les descripteurs dans `prototypes/houblons-v4/scripts/build-data.mjs` et `src/data/hopV4/proto-data.json`.

N'y touche pas. N'écris aucun code par heredoc ni par `node -e`. Pas de `git mv`, pas de `git stash`. Fichiers de travail dans
`os.tmpdir()`.

Écris RESULTAT.md tôt. Retour en une ligne.
