# Voie t8-donnees — Les données du moteur viennent des vraies sources, sans recalcul inutile (#169)

- Mission : 2026-10-25-integration-houblons
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : t5-causes, t6a-ecriture, t6b-async, t9-paresseux (faites)
- Décideur en cas de doute : pilote

## Objectif
Verdict D65 : `useHopData` (neuf, `src/ui/hopIndex/useHopData.ts`) fabrique les données du moteur v4 depuis les sources de l'app : le stock
(articles « Houblon » reliés à une variété du catalogue du moteur), la dégustation de la recette, le catalogue du moteur. Il crée le
moteur par `creerMoteur` dans le chunk des outils (T9). **Un snapshot Firestore qui ne change pas ces données ne relance aucun calcul** :
le moteur est réutilisé par empreinte des données (le banc #166 mesure aujourd'hui un premier calcul ×25 après recréation).

## Entrées
- `src/domain/hopIndex/v4/` (`moteur.ts` la fabrique, `api.ts`, `client.ts`), `src/ui/hopIndex/` (`outils.ts`, `chargement.ts`, `precharge.ts` de T9).
- `src/hooks/useLiveData.ts` (lecture seule), les types `StockItem` et `Recipe` de l'app, `src/services/firestoreRepo.ts` (lecture seule).
- `tests/fixtures/production/houblons-2026-10-17.json` (lecture seule : 12 variétés, stock non normalisé, recettes avec α 0, #120).
- `scripts/check-hop-tools-perf.mjs` (la ligne « snapshot identique : premier calcul après recréation »).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `src/ui/hopIndex/useHopData.ts` (neuf), `src/domain/hopIndex/v4/moteur.ts` (la réutilisation par empreinte), `src/domain/hopIndex/v4/donneesApp.ts` (neuf, si la conversion des sources mérite un module)
- `tests/unit/hopIndexV4/` (tests neufs)
- `work/missions/2026-10-25-integration-houblons/voies/t8-donnees/`
Une autre voie (t5b-voies) modifie en même temps `voies.ts`, `profil-simule.ts`, `yeast.ts`, `lru.ts` : n'y touche pas.

## Consignes
1. **Ne fusionne pas les catalogues** (Beer Maverick du moteur et l'index de l'app) : c'est une décision de l'utilisateur. Relie un article
   de stock à une variété du moteur par son nom ou son alias ; un article non relié reste visible comme inconnu (`inconnu:<nom>`, jamais
   une valeur inventée, jamais 0) et le dit.
2. Empreinte des données : stable pour des données égales (ordre des articles, champs sans effet sur le moteur ignorés) ; un moteur par
   empreinte, borné (un ou deux).
3. Tests : snapshot identique → même moteur, aucun calcul relancé (le journal ou le compteur du moteur le prouve) ; un article changé →
   un moteur neuf ; la fixture de production du 17.10 lue sans exception, ses articles non reliés comptés et listés.
4. `npm run check:hop-perf` : la ligne du snapshot identique passe sous son budget ; écris-la avant et après.
5. Rien de visible (drapeau `hopV4` éteint) ; aucune donnée réelle écrite ; Gemini jamais ; `functions/` intact.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Honnêteté des données : l'inconnu n'est jamais 0 ; hors ligne préservé (lire le cache Firestore existant, ne rien ajouter au démarrage).
- Une plainte (D139) : « un choix sur un endroit, semble pas toujours être reporté partout » : une seule source pour ces données.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` au format de l'agent, avec `## Fixture de production` (articles reliés, non reliés). Écris-le tôt ; garde 15 tours pour les
critères. Réponse finale au pilote : une ligne.
