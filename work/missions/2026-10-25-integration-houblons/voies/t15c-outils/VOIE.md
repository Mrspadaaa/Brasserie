# Voie t15c-outils — Substituer, Dryhopper et Levure dans la vraie app (reste de #174)

Agent : auteur (Sonnet), pour un port de code. Les dessins sont ses choix, déjà dans la maquette jouable (`prototypes/houblons-v4/parcours/src/ecrans/substituer/`, `dryhopper/`, `levure/`) : on porte, on ne redessine pas (règle n° 1, `work/refonte-frontend/v4/choix/ecrans.json`).

## Le modèle à suivre
Comparer, la fiche et Suggérer ont été portés ainsi (commits 8624c8f8 et 63130965) :
- l'écran vit dans `src/ui/hopIndex/<outil>/`, la maquette ne garde que son hôte qui réexporte ;
- dans l'app, un hôte (`EcranApp`), un cadre (`CadreApp`) et la porte (`porte.ts`, `applyHopV4Change`) ;
- la route de la pile, dans `src/ui/hopIndex/HopToolLayer.tsx`, monte l'écran en `lazy` quand le drapeau `hopV4` est allumé.

Lis `src/ui/hopIndex/comparer/`, `src/ui/hopIndex/suggerer/`, et les RESULTAT.md de t15b et t13 dans `work/missions/2026-10-25-integration-houblons/voies/`.

## À faire
1. **Substituer** sur la route `hopSubstitute`. `src/ui/hopIndex/substituer/` existe peut-être déjà en partie (t13) : pars de là. « Remplacer » écrit par la porte unique.
2. **Dryhopper** sur la route `hopTiming`. Placer, venu de Comparer, ouvre `hopTiming` sur l'ajout `a<n>`. Les gestes de réglage du moment et de la dose écrivent par la porte.
3. **Levure** sur `hopTiming` avec `step: 'yeast'`, la feuille « Souche ».
4. **Le radar commun** reste `src/ui/hopIndex/commun/RadarBase.tsx`, sans le modifier. Règle D68 : en Au style, l'échelle suit le moment ; en Absolu, rien n'est normalisé.
5. **La fluidité**, sa règle : « SI Des étape bloque vraiment sur la fluidité. Tu peux skip trouvé une solution et compromis et me propose ça ». Mesure l'ouverture ×4 de chaque outil. Si ça bloque, propose un compromis mesuré en DÉCISION À PRENDRE.

## Pièges
- Pas de `git mv` : copie, puis supprime.
- Une autre voie, t12d-rail, possède en ce moment `src/ui/hopIndex/maBiere/` (rail, Carte, Base), `src/pages/BrewWizard.tsx` et `MesuresWizard.tsx` : n'y touche pas.
- Un défaut repéré par l'audit : jamais `type="number"`, et les champs passent par `Input` ou `NumberInput`.
- Le drapeau éteint ne change rien.

## Critères
- `npx vitest run tests/unit/hopIndexV4 tests/integration` : vert, hors des échecs connus de #177.
- `node scripts/audit_inputs.mjs` → `INPUT PROTECTION AUDIT PASSED`, `npx vitest run tests/unit/designTokens.test.ts` vert, `npm run build` vert.
- Maquette reconstruite : `controle-choix.mjs` → `CHOIX OK`, `controle-etats.mjs` → `ETATS OK`, `controle-radar-base.mjs` → `RADAR-BASE OK`.
- Captures dans Chrome (`scripts/with_server.mjs`, `VITE_HOP_V4=on`, `?dev-local&etape=houblons`), en 390 × 844, à ouvrir : Substituer au repos et après Remplacer, Dryhopper ouvert depuis Placer, Levure.

## Possède
`src/ui/hopIndex/substituer/`, `src/ui/hopIndex/dryhopper/`, `src/ui/hopIndex/levure/`, `src/ui/hopIndex/HopToolLayer.tsx`,
`prototypes/houblons-v4/parcours/src/ecrans/substituer/`, `dryhopper/`, `levure/`, `prototypes/houblons-v4/maquettes/parcours/`,
`tests/unit/hopIndexV4/`, `tests/integration/`, `work/missions/2026-10-25-integration-houblons/voies/t15c-outils/`.
Fichiers de travail dans `os.tmpdir()`.

Retour en une ligne ; RESULTAT.md avec les preuves, les temps et les captures ouvertes. Si tu approches ta limite de tours, écris RESULTAT.md avec ce qui reste.
