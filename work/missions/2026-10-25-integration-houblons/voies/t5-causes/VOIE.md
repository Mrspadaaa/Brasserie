# Voie t5-causes — Moteur sans singleton, caches bornés, causes du lag mesuré (#164)

- Mission : 2026-10-25-integration-houblons
- Agent : auteur
- Modèle : opus (la fabrique du moteur fixe la convention que tous les écrans suivront)
- Niveau : conception d'architecture
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : t4-moteur (faite)
- Décideur en cas de doute : pilote

## Objectif
Verdict D65, § Recommandation 2, premier temps : retirer le travail inutile **mesuré** avant tout worker.
1. **Fabrique** `creerMoteur(donnees)` dans `src/domain/hopIndex/v4/` : catalogue, stock et données du moteur injectés (B2) ;
   plus aucun module du moteur ne lit `CATALOGUE`, `STOCK` ou `ENGINE_DATA` en dur. La maquette passe par la fabrique.
2. **Caches bornés** : `cacheBase` (`profil-simule.ts`) et les autres `Map` sans éviction ont une borne (LRU simple) et une clé stable.
3. **`substitutes`** ne calcule dose, raison et mouvements que pour les 8 rendus, et sans recouvrement stock × catalogue (O(n²)).
4. **Les deux causes du profil t2** (`work/missions/2026-10-23-theme-performance/voies/t2-performance/RESULTAT.md`, points 2 et 3) :
   - `hopDescriptorEvidence` (`functions/src/hopExtrapolationCore.ts:35-57`) a un cache indexé par l'identité du tableau `terms` :
     corrige **chez l'appelant** (`src/domain/hopIndex/v4/hops.ts`), par une clé de contenu ou un tableau stable ; **ne modifie pas
     `functions/`** (code serveur, gardé par `app-intacte.mjs`) ;
   - `toLocaleString('fr-CH', …)` à chaque appel (`pouvoir.ts`, `parcours/src/commun/nombres.ts`, `dryhopper/mesures.ts`,
     `comparer/valeurs.ts`) : un `Intl.NumberFormat` mis en cache par jeu d'options.
5. **Un banc** `scripts/bench-hop-v4.mjs` (ou `.ts` lancé par `vite-node`), reproductible, qui construit le jeu ×1, ×5 et ×10 **par la
   fabrique** (pas en mutant des singletons) et imprime un JSON de mesures. T17 (#166) en fera un contrôle bloquant.

## Entrées
- `work/missions/2026-10-25-integration-houblons/ETAT-DES-LIEUX.md` (§ Mesures, § Beaucoup de données, R5) ; le script de mesure de i0
  est décrit là (`%TEMP%\i0\mesure-moteur.ts`, regroupé par esbuild) : reprends sa méthode.
- `src/domain/hopIndex/v4/` (data.ts, substitution.ts, profil-simule.ts, voies.ts, hops.ts, pouvoir.ts), l'adaptateur de la maquette
  `prototypes/houblons-v4/parcours/src/moteur/` (index.ts, donnees.ts, mesure.ts, prechauffage.ts).
- `cerveau/metier/cout-calcul-moteur.md` (périmée sur le complet : voir ETAT-DES-LIEUX).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/domain/hopIndex/v4/`
- `prototypes/houblons-v4/parcours/src/moteur/`, et pour les formateurs seulement : `prototypes/houblons-v4/parcours/src/commun/nombres.ts`,
  `prototypes/houblons-v4/parcours/src/ecrans/dryhopper/mesures.ts`, `prototypes/houblons-v4/parcours/src/ecrans/comparer/valeurs.ts`
- `prototypes/houblons-v4/tests/` (tests neufs : la fabrique sur une forme injectée, la borne des caches)
- `scripts/bench-hop-v4.*` (neuf)
- `prototypes/houblons-v4/maquettes/parcours/` (construction)
- `work/missions/2026-10-25-integration-houblons/voies/t5-causes/`

## Consignes
1. **Avant** tout changement : lance le banc (écris-le d'abord) sur HEAD et note ×1, ×5, ×10 dans RESULTAT.md (L13 : la mesure avant).
2. Les résultats du moteur ne changent pas : mêmes chiffres sur la stout S1 (tests du prototype verts, batterie et états de la maquette verts).
3. Mesure après, avec la même commande ; écris le tableau avant/après.
4. Gemini jamais ; aucune donnée réelle ; `functions/` intact.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- L'inconnu n'est jamais 0 ; la maquette rend la même chose (règle n° 1) ; rien de supprimé.
- Mesurer avant d'affirmer, et attribuer le temps au profil (L20).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent, avec `## Mesures avant` et `## Mesures après` (commande, tableau ×1, ×5, ×10). Écris-le tôt ; ta limite
est de 80 tours, garde-en 15 pour les critères. Réponse finale au pilote : une ligne.
