ECHEC — G1 : tout est tenu sauf la ligne de check:hop-perf, que verifier.mjs refuse à tort (son motif /relanc/ attrape « aucun calcul relancé »)

## Fichiers écrits
- `src/domain/hopIndex/v4/moteur.ts` : empreinte des données (`empreinteDonnees`), contextes gardés par empreinte (2 au plus), `statistiquesMoteur()` (crees / parIdentite / parEmpreinte), `oublierContextes()`, champ `Moteur.empreinte`. Le WeakMap par identité des tableaux est remplacé (il ne bornait rien).
- `src/domain/hopIndex/v4/donneesApp.ts` (neuf, pur, aucun import de valeur) : `relierStock` (articles « Houblon » → variétés du moteur par nom, alias, ou début de nom unique), `degustationDeRecette`, `niveauxDegustes`.
- `src/ui/hopIndex/useHopData.ts` (neuf, non branché : drapeau `hopV4` éteint, rien de visible) : stock + dégustation + catalogue du moteur ; moteur créé par `creerMoteur` dans le chunk T9 (`chargerOutils`) ; stock, relations, dégustation gardent leur identité tant que leur contenu ne change pas.
- Tests : `tests/unit/hopIndexV4/empreinteDonnees.test.ts` (12), `donneesApp.test.ts` (18), `useHopData.test.tsx` (7) ; `chargementOutils.test.tsx` (T9) : garde « outils.ts seul point d'entrée du moteur » assouplie pour `donneesApp` (pur) et deux gardes ajoutées (donneesApp sans import de valeur ; useHopData n'importe que donneesApp). Voir DÉCISION 2.

## Sortie décisive
- `npx vitest run tests/unit/hopIndexV4` : 6 fichiers, 81/81 verts. Tests de la fabrique du prototype (`fabrique`, `conversion-recette`, `houblon-inconnu`) : 24/24 verts.
- Snapshot identique, `check:hop-perf` :
  - AVANT (moteur de HEAD, banc `--groupes=snapshot`) : premier calcul après recréation 20,87 ms contre 1,22 ms pour le même moteur rappelé (×17, calculs relancés) ; recréation 0,43 ms.
  - APRÈS : « snapshot identique : le premier calcul après recréation (0,43 à 0,57 ms, n=5) face au même moteur rappelé (0,32 à 0,35 ms) | aucun calcul relancé | OK » ; recréation du moteur sur tableaux neufs 4,2 ms (le coût de l'empreinte du catalogue de 318 fiches), budget 50 ms.
- Build vert ; démarrage 919 ko gzip (limite 919 ; useHopData n'est importé par personne, aucun octet ajouté).
- `node verifier.mjs` : `tests : 81/81 verts` puis `- check:hop-perf : … | aucun calcul relancé | budget aucun calcul relancé | OK` → faute signalée à tort. Seule autre faute : la section « Fixture de production » (ajoutée ci-dessous). Les 6 lignes DÉPASSÉ du reste de check:hop-perf (Dryhopper frise, Comparer ×2, Suggérer à froid, tranche voies, total) existaient avant (verdict T17 : ~1,1 s de proposeVoies) ; elles ne sont pas dans le périmètre de cette voie (c'est t5b).

## Fixture de production
`tests/fixtures/production/houblons-2026-10-17.json`, lue sans exception : 18 articles de stock.
- Reliés : 18 (16 clés après cumul : Hallertau Blanc = fiche + article « Houblon Hallertauer Blanc 9.5% CH »). Clés : ariana, cascade, citra:cryo, east-kent-goldings, fuggle, galaxy, hallertau-blanc, idaho-7, lotus, motueka, nectaron, nelson-sauvin, nugget (« Nuget »), sabro, simcoe, target. Un test montre que le résultat est égal au stock du prototype (`proto-data.json`).
- Non reliés : 0 (liste vide). Trois écritures de la production passent par une table explicite `ECRITURES_DU_STOCK` (« Hallertauer Blanc », « Goldings East Kent », « Nuget ») ; toute autre écriture inconnue reste `inconnu:<nom>` avec sa raison (testé : « Houblon Zythos Imaginaire 9.9% » ; quantité absente → raison, jamais 0 ; unité « sachet » non convertie).
- α : 0 ou hors ]0 ; 100] devient null (#120). 7 α ne sont que dans le nom : lus (« lu sur l’article »).
- Les « défauts » de la fixture (Simcoe, Idaho 7, Nectaron sans analyse dans les hopVarieties) ne touchent pas le moteur : son catalogue est Beer Maverick, non fusionné.

## Essais
Moteur / tests : 2 essais (ordre des articles : l'empreinte réclamait un tri canonique dans `relierStock`, ajouté). Critère G1 : verifier.mjs rejoué 1 fois ; la faute restante ne se corrige pas dans mon périmètre.

## Doutes et limites
- La dégustation « de la recette » est la plus récente `HopTasting` d'origine brassin dont le brassin porte `recipeRef` = la recette (ou `recipe.batchRef`). Une plage dégustée qui chevauche deux classes d'un axe est inconnue (null), jamais arrondie. Hypothèse à confirmer au branchement (T12).
- La dégustation ne sert que si les outils sont chargés (`tastingFrom` vit dans le chunk) ; avant, `degustation` est null et `moteur` est null.
- L'empreinte du catalogue coûte ~4 ms (JSON.stringify de 318 fiches) à chaque jeu de tableaux neufs ; si le catalogue est toujours le même tableau (cas de useHopData), l'identité évite le calcul.
- Vérifié en jsdom avec un stockage simulé ; pas de parcours Chrome (rien de visible). Mesures de temps potentiellement perturbées par t5b en parallèle ; rejouées.

DÉCISION À PRENDRE : 1. `verifier.mjs` (pilote) : remplacer `/relanc|DÉPASSÉ/i` par `/RELANCÉS|DÉPASSÉ/` (la ligne OK contient toujours « aucun calcul relancé » et « budget aucun calcul relancé »). Je n'y ai pas touché. Recommandation : corriger le motif ; la ligne est alors tenue (0,4 à 0,6 ms, « OK »). 2. J'ai assoupli la garde de structure de T9 dans `chargementOutils.test.tsx` (fichier de tests de mon périmètre) pour admettre `donneesApp`, pur. Recommandation : garder, ou déplacer `donneesApp.ts` hors de `domain/hopIndex/v4` si le pilote tient à « outils.ts seul ».

CONNAISSANCE : un moteur v4 se réutilise par empreinte de contenu (catalogue tel quel, stock trié par clé) ; deux contextes gardés ; l'ordre des articles n'a pas d'effet sur un calcul ; le banc #166 passe de ×17 à ×1,3 sur le snapshot identique.
LEÇON PROPOSÉE : un critère qui cherche l'absence d'un mot dans une ligne de sortie doit être rejoué sur la sortie OK, pas seulement sur la sortie en échec (ici « relancé » apparaît dans la version OK).
