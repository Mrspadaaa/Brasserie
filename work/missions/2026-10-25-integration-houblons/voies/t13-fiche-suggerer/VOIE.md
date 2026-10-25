# Voie t13-fiche-suggerer — la fiche du houblon et Suggérer dans la vraie app (#173)

Agent : auteur (Sonnet), car c'est un port de code. Les dessins sont ses choix, déjà dans la maquette jouable : on porte, on ne
redessine pas (règle n° 1, `work/refonte-frontend/v4/choix/ecrans.json`).

## Le modèle à suivre
Comparer vient d'être porté de cette façon (voies t15a et t15b, commits 3202ada2 et 8624c8f8) :
- l'écran vit dans `src/ui/hopIndex/<outil>/`, et la maquette ne garde que son hôte, qui réexporte ;
- dans l'app, un hôte et un cadre (`comparer/EcranApp.tsx`, `CadreApp.tsx`, `porte.ts`) ;
- la route de la pile, dans `HopToolLayer.tsx`, monte l'écran en `lazy` quand le drapeau `hopV4` est allumé.

Lis `src/ui/hopIndex/comparer/` et `work/missions/2026-10-25-integration-houblons/voies/t15b-comparer-app/RESULTAT.md`.

## À faire
1. **La fiche** (`prototypes/houblons-v4/parcours/src/ecrans/fiche/`) :
   - elle vit dans `src/ui/hopIndex/fiche/` ;
   - dans l'app, l'**appui long** sur un nom de houblon l'ouvre, dans Ma bière et dans Comparer (D25, D112, D124 ; écart 7 de t12) ;
   - elle s'ouvre en feuille ou en couche de la pile, comme dans la maquette.
2. **Suggérer** (`prototypes/houblons-v4/parcours/src/ecrans/suggerer/`) :
   - il vit dans `src/ui/hopIndex/suggerer/` ;
   - la route `hopSuggest` le monte ;
   - « Ajouter » passe par la porte unique, `applyHopV4Change` ;
   - « Comparer (n) » ouvre la route `hopCompare` avec ces houblons.
3. **L'entrée « Comparer (n) »** depuis Ma bière, si la maquette l'a.
4. **Le radar commun** reste `src/ui/hopIndex/commun/RadarBase.tsx` : ne le modifie pas. Règle D68.
5. **La fluidité**, sa règle : « SI Des étape bloque vraiment sur la fluidité. Tu peux skip trouvé une solution et compromis et me
   propose ça ».
   - Mesure l'ouverture de Suggérer ×4. Le dernier temps relevé était 447 ms ×4, dû au rendu (#179).
   - Si ça bloque, propose un compromis mesuré en DÉCISION À PRENDRE.

## Pièges
- N'utilise pas `git mv` : il indexe le renommage, et un commit du pilote le prendrait sans le contenu. Copie, puis supprime l'original.
- Le lanceur « + » de l'app est déjà masqué sous les couches (`src/App.tsx`).
- Le drapeau éteint ne change rien.

## Critères
- `npx vitest run tests/unit/hopIndexV4 tests/integration` : vert, hors des échecs connus de #177 (`hopV55*`, `monkey`, `YeastRecipeChoice`).
- `npm run build` vert.
- Maquette reconstruite (`node prototypes/houblons-v4/parcours/outils/construire.mjs`) : `controle-choix.mjs` → `CHOIX OK`, `controle-etats.mjs` → `ETATS OK`, `controle-radar-base.mjs` → `RADAR-BASE OK`.
- Captures dans Chrome (`scripts/with_server.mjs`, `VITE_HOP_V4=on`, `?dev-local&etape=houblons`), en 390 × 844, à ouvrir :
  - la fiche ouverte par appui long ;
  - Suggérer au repos ;
  - Suggérer après Ajouter ;
  - Comparer (n) ouvert depuis Suggérer.

## Possède
`src/ui/hopIndex/fiche/`, `src/ui/hopIndex/suggerer/`, `src/ui/hopIndex/HopToolLayer.tsx`, `src/ui/hopIndex/maBiere/` (seulement
l'appui long et l'entrée Comparer), `src/ui/hopIndex/comparer/` (seulement l'appui long), `prototypes/houblons-v4/parcours/src/ecrans/fiche/`,
`prototypes/houblons-v4/parcours/src/ecrans/suggerer/`, `prototypes/houblons-v4/maquettes/parcours/`, `tests/unit/hopIndexV4/`,
`tests/integration/`, `work/missions/2026-10-25-integration-houblons/voies/t13-fiche-suggerer/`.
Fichiers de travail dans `os.tmpdir()`.

Retour en une ligne ; RESULTAT.md avec preuves, nombres et captures ouvertes. Si tu approches ta limite de tours, écris RESULTAT.md
avec ce qui reste.
