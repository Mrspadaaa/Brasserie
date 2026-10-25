# Voie rb2-ma-biere — le radar commun dans Ma bière (l'app et la maquette)

Agent : concepteur (Opus). Mission : `work/missions/2026-10-25-integration-houblons/MISSION.md`.

## Sa demande
« Ensuite utiliser ce radar graph comme Baseline et l'utiliser partout dans les vue où il y en a ». Règle D68 (« Attention à la
normalisation… SI choisi absolu, plus de normalisation, pour le radar et pour les barre et le reste !! »).

## État de départ
- `RadarBase` existe dans la maquette : `prototypes/houblons-v4/parcours/src/commun/RadarBase.tsx` et `radar-base.css`
  (commit b0d517c1, voie rb-radar-commun, RADAR-BASE OK sur 8 vues). Il est porté du radar de cmc2h, son choix pour Comparer.
- Le radar de Ma bière est du code de l'app, `src/ui/hopIndex/maBiere/RadarBiere.tsx`, que la maquette importe par `@app`. T12b
  est fini (#170 fermé) : la voie est libre.

## À faire
1. **Déplacer `RadarBase` dans l'app** : `src/ui/hopIndex/commun/RadarBase.tsx` et son CSS, classes `rb-`, sans dépendance à
   la maquette. La maquette le réexporte depuis `@app`, et ses vues (Comparer, fiche, Suggérer, Substituer) ne changent pas
   de rendu : `controle-radar-base.mjs` doit rester OK.
2. **Ma bière sur la baseline** : `RadarBiere` passe ses valeurs (ma bière face au style, et ses repères de dégustation) à
   `RadarBase`.
   - Garder ce qu'il a choisi dans cet écran : m4, la grille de dégustation, « pas senti » ≠ « pas goûté » (SPEC, lot 9),
     l'inconnu jamais 0.
   - Appliquer D68 si l'écran a la bascule Au style / Absolu.
   - Garder les repères `data-element`, `data-acquis` et `data-etat` que lisent les contrôles.
3. **Les tests de l'app** sur RadarBiere et sur l'étape Houblons restent verts ; en ajouter un qui vérifie qu'aucun point n'est
   posé sur une famille inconnue.

## Critères
- `npx vitest run tests/unit/hopIndexV4` → vert ;
- `npm run build` → vert ;
- `node work/refonte-frontend/v4/tournoi/outils/controle-radar-base.mjs prototypes/houblons-v4/maquettes/parcours` → `RADAR-BASE OK`, avec Ma bière en plus des 8 vues. Le contrôle s'étend à la vue biere.
- `controle-etats.mjs` : les états de `biere.json` tiennent. Ceux de Comparer peuvent rester rouges, car une autre voie met leurs registres à jour.
- **Dans l'app**, sur `?dev-local&etape=houblons` drapeau allumé (`scripts/with_server.mjs`, `VITE_HOP_V4=on`) : le radar de Ma bière est le nouveau, capturé en 390 × 844 et ouvert. Capturer aussi la vue biere de la maquette.

## Possède
`src/ui/hopIndex/commun/`, `src/ui/hopIndex/maBiere/RadarBiere.tsx` (et les fichiers de maBiere qui l'appellent, si nécessaire),
`prototypes/houblons-v4/parcours/src/commun/`, `prototypes/houblons-v4/parcours/src/ecrans/biere/`,
`prototypes/houblons-v4/maquettes/parcours/`, `work/refonte-frontend/v4/tournoi/outils/controle-radar-base.mjs`, `tests/unit/hopIndexV4/`,
`work/missions/2026-10-25-integration-houblons/voies/rb2-ma-biere/`.
Pas `work/refonte-frontend/v4/choix/` : la voie rc-registres-comparer s'en occupe.

Retour en une ligne ; RESULTAT.md avec preuves et captures ouvertes.
