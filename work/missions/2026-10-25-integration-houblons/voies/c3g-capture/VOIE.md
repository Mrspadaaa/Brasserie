# Voie c3g-capture — ce que les pages publient et que nos lecteurs n'ont pas extrait (#180)

Agent : auteur (Sonnet). **Lis d'abord `voies/c3-COMMUN.md`** : les règles de collecte, de sortie et les critères communs.

## Ses mots (26.10)
Il a collé la page Galaxy de Yakima Valley Hops, avec sa capture.
- « Galaxy Analytical Data » :
  - Ancestry High Alpha Australian, Perle ;
  - Alpha 13.0 - 18.5 %, Beta 6.1 - 11.6 %, Alpha/Beta Ratio 1.3 - 2.7, Cohumulone 32.0 - 43.0 ;
  - Total Oils 2.6 - 3.3 ml/100g ;
  - Myrcene 32.0 - 56.0, Linalool 0.5 - 1.0, Caryophyllene 7.0 - 14.7, Farnesene 2.8 - 5.1, Humulene 0.8 - 2.2, Selinene 5.9 - 12.7.
- La capture montre aussi :
  - « Aroma/Flavor Intensity » (un curseur de « Very Delicate » à « Big! Huge! Wow! ») et « Hopping Rate » ;
  - « Key Aromas » avec des votes : Citrus (77), Floral (28), Green Fruit (8), Spicy (7), Herbal (7), Berry & Currant (9),
    Sweet Fruit (55), Cream Caramel (1), Woody Aromatic (5) ;
  - la taille de brasserie des votants.

## Le constat (pilote)
- `src/data/hopSources/yakimavalleyhops.json` n'a, pour Galaxy, que l'α et le β. Pourtant la page en cache (`…/products/galaxy-hop-pellets`)
  contient « cohumulone » et « selinene ».
- Sur 133 fiches YVH, 54 seulement ont plus de 5 champs.
- « Key Aromas » n'est pas dans la page en cache : un module le charge dans le navigateur.

## À faire
1. **Audit de capture, toutes sources** (les 20 de `src/data/hopSources/`).
   - Pour chaque page en cache rattachée à une fiche, et pour chaque mot clé d'analyse (alpha, beta, cohumulone, colupulone, total
     oil, myrcene, humulene, caryophyllene, farnesene, linalool, geraniol, pinene, selinene, xanthohumol, polyphenol, thiol, HSI ou
     storage), compare :
     - le mot présent dans la page, suivi d'un nombre ;
     - la valeur extraite dans la fiche.
   - Rends, par source, un tableau : champ, pages qui le publient, fiches qui l'ont, taux de capture.
   - Script : `scripts/collecte-hop/audit-capture.mjs`, hors ligne, sur le cache.
2. **Corrige les lecteurs** dont le taux de capture est sous 95 % sur un champ publié, Yakima Valley Hops d'abord. Les formats de
   tableau varient d'une page à l'autre : lis-en plusieurs avant d'écrire la règle.
   - Chaque lecteur corrigé : `--offline` deux passes identiques, test sur un HTML synthétique du format manqué.
   - Puis l'audit de nouveau : le taux après.
3. **« Key Aromas » et « Aroma/Flavor Intensity » de YVH.** Trouve d'où le module charge ces données : la requête faite par la page,
   lisible dans son code source en cache.
   - Si c'est une adresse publique sans connexion, que le `robots.txt` de son hôte permet, collecte-les poliment : 1 requête toutes
     les 2 s au plus, et le compte des requêtes.
   - Sinon, arrête et écris-le : on les lira dans le Chrome du brasseur.
   - Les votes se gardent tels quels (mot et nombre de votes), avec la date. Ce ne sont pas des familles du moteur.
4. Rejoue la fusion sans écrire (`node scripts/collecte-hop/fusion.mjs --sans-ecriture`) et dis ce que la capture corrigée ajoute :
   champ par champ, sur les 318 variétés, et pour Galaxy, Citra, Mosaic et Nelson Sauvin.

## Critères
- `audit-capture.mjs` : tableau avant et après dans `voies/c3g-capture/rapport.md`. Aucun champ publié sous 95 % de capture sans
  raison écrite.
- Chaque lecteur corrigé : `--offline` deux passes, sha256 égal, et son test.
- `npx vitest run tests/unit/hopIndexV4` (les tests de collecte) vert ; `npm run build` vert.

## Possède
- `scripts/collecte-hop/` (les lecteurs, et l'audit).
- `src/data/hopSources/*.json`.
- `tests/unit/hopIndexV4/collecte*.test.ts`.
- `work/missions/2026-10-25-integration-houblons/voies/c3g-capture/`.
- Le cache, en ajout seulement.

Ne modifie ni `fusion.mjs` ni `complements.json` : le pilote régénérera. D'autres voies sont en vol (e2 sur le moteur et le
prototype, a2 sur `src/ui/hopIndex/`) : rien de leurs fichiers. N'écris aucun code par heredoc ni par `node -e`.

Écris RESULTAT.md tôt. Retour en une ligne.
