# Voie t5b-voies — proposeVoies : l'effet d'un houblon à un moment mis en cache et partagé (#178)

- Mission : 2026-10-25-integration-houblons
- Agent : auteur
- Modèle : opus
- Niveau : conception
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : t5-causes, t17-banc (faites)
- Décideur en cas de doute : pilote

## Objectif
Le banc bloquant (#166) mesure ~1,1 s pour ouvrir Suggérer à froid. `proposer` coûte ≈ 0,4 à 0,9 ms par voie évaluée (198 ms à 230
voies, 489 ms à 1 097), et les leviers levure refont des calculs voisins. L'effet d'un houblon à un moment (et à sa dose de référence)
se calcule **une fois**, en cache borné dans le moteur créé par la fabrique, partagé entre `proposer` et les leviers levure.
**Mêmes résultats** qu'avant, empreinte pour empreinte.

## Entrées
- `work/missions/2026-10-25-integration-houblons/voies/t17-banc/RESULTAT.md` (§ Verdict du moteur, point 1 ; `diagnostic-proposer.ts`
  dans le dossier temporaire de la voie, à refaire s'il manque).
- `src/domain/hopIndex/v4/voies.ts` (`proposeVoies`), `profil-simule.ts`, `yeast.ts`, `lru.ts`, `moteur.ts` (lecture seule : la fabrique),
  `api.ts`.
- `scripts/bench-hop-v4.ts` (empreintes), `scripts/check-hop-tools-perf.mjs` (`npm run check:hop-perf`).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/domain/hopIndex/v4/voies.ts`, `src/domain/hopIndex/v4/profil-simule.ts`, `src/domain/hopIndex/v4/yeast.ts`, `src/domain/hopIndex/v4/lru.ts`
- `prototypes/houblons-v4/tests/` (un test neuf : le cache de l'effet est partagé et borné)
- `prototypes/houblons-v4/maquettes/parcours/` (construction)
- `work/missions/2026-10-25-integration-houblons/voies/t5b-voies/`
Une autre voie (t8-donnees) modifie en même temps `src/domain/hopIndex/v4/moteur.ts` et `src/ui/hopIndex/` : n'y touche pas.

## Consignes
1. Mesure d'abord, sur HEAD : `npx vite-node scripts/bench-hop-v4.ts -- --echelle=1 --json` et `--echelle=5`, et `npm run check:hop-perf` ;
   note les empreintes (`proposer`, `suggerer`, `remplacants`…) et les lignes de Suggérer dans RESULTAT.md (`## Mesures avant`), dont ces
   deux lignes exactes, lues par le critère : `proposer froid ×5 : <ms> ms` et `empreinte de proposer ×1 : <empreinte>`.
2. Change le moins de code possible : un cache par moteur, borné, clé stable (houblon, moment, dose, jours, levure, style, volume) ;
   ni état global ni singleton (la fabrique de T5 reste la règle).
3. Mesure après, mêmes commandes (`## Mesures après`) ; empreintes identiques exigées. Si une empreinte change, arrête-toi et explique.
4. Rejoue `batterie.mjs` (46/46) et `controle-etats.mjs` (141/141) en arrière-plan, puis `npm run build`.
5. Gemini jamais ; aucune donnée réelle ; `functions/` intact.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Mesurer avant d'affirmer, attribuer le temps à sa cause (L20) ; la maquette rend la même chose (règle n° 1).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent. Écris-le tôt ; garde 15 tours pour les critères. Réponse finale au pilote : une ligne.
