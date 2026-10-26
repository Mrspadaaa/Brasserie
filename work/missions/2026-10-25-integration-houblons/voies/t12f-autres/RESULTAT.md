OK — « autres n % » compté en mots distincts traduits, une seule source ; carte, fiche et « ? » alignés.

## Fichiers écrits
- `src/ui/hopIndex/fiche/autres.ts` (réécrit) : `compterAutres(w, traduire, familles)` pur, `autresDe(cle)` qui l'appelle avec `versFr`. Clé de comparaison = mot traduit, minuscules, sans accents ni tirets.
- `src/ui/hopIndex/parcours/adaptateur.ts` (hors liste « Possède » mais nommé par la demande : « son adaptateur ») : `houblon()` lit `autresDe(cle)` pour `partSansFamille` et `motsSansFamille`. Plus aucun second calcul. Le « sans famille » de Comparer, Substituer, Ajouter et de la carte suit donc le même nombre.
- `src/ui/hopIndex/maBiere/briques.tsx` (hors « Possède », indispensable) : retrait du « ×2 » et de la note « il compte deux fois », devenus faux. Les fiches qui disent un mot restent dans le `title` de chaque mot.
- `tests/unit/hopIndexV4/ficheSourcesAutres.test.tsx` : Lotus mis à jour, 2 tests ajoutés.
- `Carte.tsx` : non modifié ; elle lit `h.partSansFamille` (seuil 25 %), qui vient maintenant du calcul unique.
- Non touchés : `HopToolLayer.tsx`, `substituer/`, `dryhopper/`, `levure/` (t15c).

## Règle de calcul
- Numérateur : mots sans famille distincts, après traduction + normalisation.
- Dénominateur : mots rattachés distincts (traduits et normalisés aussi) + ces mots sans famille.
- Un mot sans famille chez une fiche mais rattaché chez une autre, une fois traduit, est rattaché (compté une fois, pas sans famille).
- Aucun mot : null (jamais 0).

## Résultat sur Lotus
- Avant : 5 de ses 12 mots, 42 %. Maintenant : 4 de ses 9 mots, 44 %. Liste : vanille (Beer Maverick, Hopsteiner), crème, fruité, doux.
- Le dénominateur baisse de 12 à 9 parce que les mots rattachés sont aussi fusionnés après traduction : orange, agrumes, fruits tropicaux, baies, floral = 5 (avant 7 : « fruits tropicaux » / « tropical fruits » et « baies » / « berry » comptés deux fois).

## Critères
- `npx vitest run tests/unit/hopIndexV4` : 17 fichiers, 186 tests verts (2 nouveaux).
  - Nouveau 1 : carte (`houblon().motsSansFamille`), liste de l'explication (`li[data-mot]`) et `autresDe` identiques sur Lotus ; mots sans doublon.
  - Nouveau 2 : houblon synthétique avec « vanille » (BM) et « vanilla » (Hopsteiner) : compté une fois (2 sur 5 = 40 %) ; mot sans famille rattaché ailleurs ; zéro mot = null.
  - Test des 318 houblons : part de l'adaptateur = `autresDe`, liste = n mots distincts, part = n / total.
- `npm run build` : exit 0. `npx tsc --noEmit` : propre. `prototypes/houblons-v4/tests/houblon-inconnu.test.ts` : 4 verts.
- Essais : un par critère.

## Doutes et limites
- Pas de capture Chrome cette fois : seul le nombre et la liste changent (plus de « ×2 »). Rendu non revérifié visuellement ; le test jsdom couvre le texte et les `data-*`.
- `maBiere/legende-bande.tsx` (`speciauxDe().sans`) garde son propre calcul des mots sans famille, non traduits et non fusionnés (hors Possède). Si le « ? » dont parle la demande est cette légende de bande, elle montrerait encore « vanille » et « vanilla » séparés. À brancher sur `autresDe` par la voie qui possède `maBiere/` (une ligne : `autresDe(cle)?.mots`).
- `src/domain/hopIndex/v4/fiches.ts` (`motsSansFamille` du domaine) n'est pas touché ; il ne passe pas par l'adaptateur de l'interface.
- Les anciens artefacts de `work/` qui affichent 42 % pour Lotus sont des captures datées.

DÉCISION À PRENDRE : brancher `legende-bande.tsx` sur `autresDe` ? Options : (a) oui, par la voie qui possède `maBiere/` ; (b) laisser. Recommandation : (a), pour que le « ? » de la bande ne montre jamais une autre liste.

CONNAISSANCE : le « autres N % » est mots sans famille distincts ÷ (mots rattachés distincts + mots sans famille distincts), traduits et normalisés (fiche/autres.ts, `compterAutres`) ; Lotus : 4 sur 9, 44 %.
LEÇON PROPOSÉE : aucune
