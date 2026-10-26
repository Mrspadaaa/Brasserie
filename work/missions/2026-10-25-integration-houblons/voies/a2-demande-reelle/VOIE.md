# Voie a2-demande-reelle — retirer la demande de test S1 des écrans de l'app (D158)

Agent : auteur (Sonnet), pour du code. Les écrans sont ses choix (Comparer cmc2k, Dryhopper, Levure, Ma bière) : on change la
**source** de la demande, pas le dessin. Lis `.claude/rules/affinee-frontend.md`.

## Ses mots (26.10, sur l'app déployée)
« Il semble y avoir encore des données et artefacts de test des mini maquettes ». Sa capture de Dryhopper montre « Face à ta bière :
floral ?, baies ?, résineux ? » et les courbes « résineux baies floral » : la demande de test S1 de la maquette du 18.10.

## Ce que l'audit a trouvé
Voir `voies/a1-artefacts/RESULTAT.md`, tableau, éléments 1 à 4 et 7.
- **1. Comparer** :
  - `comparer/cas.ts:8` (`VISEE`, floral +1), `comparer/index.tsx:32` (`TROP`, résineux), lignes 251-255, 449-452, 588 et 624 ;
  - ce qui s'affiche : « ta demande : plus de floral », « ta dégustation : trop de résineux », les flèches, la rangée « Ta bière » ;
  - ce qui en dépend : le critère par défaut.
- **2. Ma bière** : `maBiere/index.tsx:137`, la puce « + floral › » sur toute recette.
- **3. Dryhopper** : `dryhopper/index.tsx:31-33, 258, 350-351, 405-424`, le critère ★, « Face à ta bière » et les courbes.
- **4. Levure** : `levure/index.tsx:67`, les familles fixes (floral, agrumes, résineux).
- **7. « Ouvrir l'analyse de ma bière »** : la couche `hopBeer` mène à `CoucheProvisoire` (`HopToolLayer.tsx:88-98`), « Écran
  provisoire… données du prototype, non réelles ».

## La règle (pilote, D84)
Jamais une demande inventée.
- **Sa visée existe** (posée dans Ma bière, passée par la porte comme pour Suggérer, voie t12e) : les écrans l'utilisent, avec leurs
  libellés actuels (« ta demande »…).
- **Pas de visée, mais une dégustation** de la recette (`useHopData().degustation`) : « ta dégustation » vient d'elle.
- **Ni l'une ni l'autre** : les écrans prennent les familles attendues du style de la recette (le style est connu, c'est la règle
  « Au style », D68). Ils le disent avec le libellé déjà employé ailleurs, « attendu en <code du style> ». Ni « ta demande », ni
  « ta dégustation ».
  - Le critère par défaut de Comparer et le ★ de Dryhopper suivent la même règle.
  - La puce de Ma bière ne s'affiche que s'il y a une visée ou une dégustation ; sinon rien.
- **Levure** : les familles affichées suivent la même règle (visée, sinon style).
- **L'écran provisoire (7)** : l'entrée « Ouvrir l'analyse de ma bière » ne s'affiche plus en production tant que l'écran d'analyse
  n'existe pas (`import.meta.env.DEV` la garde pour le développement). Écris où l'entrée vivait, pour la rebrancher.

## Le même défaut que le contour de Galaxy (D156)
Le trait de référence « ta bière » de Comparer et de Suggérer est tracé **sous** les séries : il peut être caché à valeur égale.
Applique le même correctif que la voie a1 sur le radar de Substituer (référence au-dessus, sommets en anneaux), avec le contrôle au
pixel de `tests/integration/controle-contour-original.mjs`, étendu à ces deux écrans.

## Un contrôle qui échoue d'abord (L13)
- Un test : sur une recette sans visée ni dégustation, aucun écran (Comparer, Dryhopper, Levure, Ma bière) n'affiche « floral »,
  « résineux » ou « baies » comme demande. Ils affichent les familles du style de la recette. Avec une visée, ils affichent la
  visée. Rouge sur HEAD.
- La recherche des constantes S1 (`VISEE`, `TROP`, `DEMANDE_S1`, `TERMES_S1`) ne doit plus trouver aucun chemin atteint par l'app
  avec le drapeau allumé. La maquette, elle, peut les garder.

## Critères
- Les tests ci-dessus : rouges sur HEAD, verts après. `npx vitest run tests/unit/hopIndexV4 tests/unit/designTokens.test.ts` vert
  (hors les échecs connus des voies d4 et e2, à citer). `npm run build` vert ; `node scripts/audit_inputs.mjs` passe.
- Captures dans l'app (`?dev-local&etape=houblons`, `VITE_HOP_V4=on`), en 390 × 844, ouvertes et regardées :
  - Dryhopper et Comparer, sans visée, recette de style 21C ;
  - les mêmes avec une visée posée.
- La maquette jouable reconstruite tient : `controle-etats.mjs` et `controle-radar-base.mjs`.

## Possède
- `src/ui/hopIndex/comparer/` (cas.ts, index.tsx, EcranApp.tsx) ; `src/ui/hopIndex/dryhopper/` ; `src/ui/hopIndex/levure/`.
- `src/ui/hopIndex/maBiere/index.tsx` (la puce) ; `src/ui/hopIndex/HopToolLayer.tsx` (l'entrée provisoire) ; `src/ui/hopIndex/suggerer/`
  (le trait de référence).
- `src/ui/hopIndex/commun/RadarBase.tsx` (le trait de référence, comme a1).
- `tests/integration/`, `tests/unit/hopIndexV4/`.
- `work/missions/2026-10-25-integration-houblons/voies/a2-demande-reelle/`.

D'autres voies sont en vol :
- d4 possède `src/domain/hopIndex/v4/data.ts`, `proto-data.json` et `build-data.mjs` ;
- e2 possède `src/domain/hopIndex/v4/substitution.ts` et les tests du prototype.

N'y touche pas. N'écris aucun code par heredoc ni par `node -e`. Pas de `git mv`, pas de `git stash`.

Écris RESULTAT.md tôt. Retour en une ligne.
