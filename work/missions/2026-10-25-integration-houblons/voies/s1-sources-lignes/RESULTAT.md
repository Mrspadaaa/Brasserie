OK — Substituer : un trait par plage qui diffère, noms au survol, compléments lus ; Comparer lit les mêmes sources ; contrôle rouge puis vert.

## Ce qui dessinait un trait par source (recherche dans src/ui)
- **Un seul écran dessine des traits fins par source : Substituer** (`substituer/index.tsx`, composant `Rangee`) : rangées α, β et les quatre huiles (myrcène, humulène, caryophyllène, linalol).
- **Comparer, feuille Valeurs** (`LigneValeurs`) : une barre par houblon (l'enveloppe), les références écrites dessous. Pas de traits par source, donc rien à dédoublonner. Mais ses α et β ne lisaient que Beer Maverick et Hopsteiner, alors que Substituer va lire les compléments : un même houblon aurait eu deux plages (Galaxy 11–16 contre 11–19,8). Comparer lit maintenant les mêmes sources.
- **Fiche, feuille Sources** : un texte par source (la liste exhaustive qu'il a demandée le 25.10), pas de barre : inchangée. Radar de la fiche, Dryhopper, Suggérer, Ma bière : aucune barre par source (cherché : « traits fins », `tb-src`, lectures de `hs`, `alpha`, `beta`, `hsLinalool`, `valeursDe`).
- Sources avant : Substituer = Beer Maverick + Hopsteiner seulement (huiles : Beer Maverick, linalol Hopsteiner) ; Comparer α/β = idem ; Comparer huile et composés = déjà les compléments (d3b).

## Fichiers écrits
- `src/ui/hopIndex/commun/plagesSources.ts` : la fonction partagée (`dedoublonnerPlages`, `enveloppeDesPlages`, `milieuMoyen`, `titreTrait`). Même plage = mêmes bornes arrondies à 2 décimales (la précision de l'écran), première apparition d'abord, noms sans doublon.
- `src/ui/hopIndex/commun/sourcesMesures.ts` : d'où viennent les sources (`sourcesDeBarre`) : catalogue (Beer Maverick, Hopsteiner), puis valeurs valides de `complements.json` par le chargeur (dans l'enveloppe, deux bornes). La fiche `hopsteiner` des compléments n'est pas redessinée quand le catalogue porte la valeur (même fiche).
- `src/ui/hopIndex/substituer/donnees.ts` (`mesures()` : `traits`, `huilesTraits`, enveloppes), `index.tsx` (`Rangee` à traits dédoublonnés avec `title` et `data-sources` ; `useComplements(600)` : l'écran attend les compléments, préchargés au repos ; texte de la note), `substituer.css` (trait d'une seule valeur : 3 px au moins ; rangée qui grandit de 4 px par trait au-delà de trois).
- `src/ui/hopIndex/comparer/valeurs.ts` : `acides()` lit `sourcesDeBarre`.
- Tests : `tests/unit/hopIndexV4/plagesSources.test.ts` (16), `tests/unit/hopIndexV4/sourcesLignes.test.tsx` (4, le contrôle) ; `complements.test.ts` : un fichier de plus autorisé à importer le chargeur (`commun/sourcesMesures.ts`), garde-fou conservé pour le reste.
- `work/missions/2026-10-25-integration-houblons/voies/s1-sources-lignes/` : `capturer.mjs`, `sonde-quatre.mjs`, `img/` (captures, `apres-mesures.json`).

## Critères
- **Contrôle `sourcesLignes.test.tsx`, rouge sur HEAD** (les quatre fichiers `substituer/index.tsx`, `donnees.ts`, `substituer.css`, `comparer/valeurs.ts` remis à HEAD le temps d'un essai, puis rétablis) : 4 échecs, dont « Lotus α : deux traits de même plage (2 traits, 1 positions) », « Galaxy α : 1 traits pour 6 plages distinctes (9 sources) », « Citra α : 1 traits pour 6 plages distinctes (12 sources) », « Citra linalol : la barre manque ». **Vert après** : 4/4. Il joue Substituer (α, β et 4 huiles) avec Lotus, Citra, Galaxy, Magnum (US), Southern Star, Nugget, et Comparer (α, β) avec Lotus, Citra, Galaxy. Les attendus viennent des données par un calcul indépendant du code de l'écran.
- Contrôle de données sur les 318 houblons × 6 champs de barre (dans `plagesSources.test.ts`) : aucun trait en double, aucune plage sans trait, aucun nom de source perdu.
- `npx vitest run tests/unit/hopIndexV4 tests/unit/designTokens.test.ts` : 60 fichiers, 511 tests verts. `tests/integration/AppLanceurOutilsHoublons` et `AppRoutePile` : 4 verts.
- Build : `npx tsc --noEmit` sans erreur ; `vite build` vert (sorti dans le dossier temporaire, pour ne pas toucher le `dist/` des autres voies) ; `check-private-research.mjs` passe. **B5 = 157,6 ko gzip, tenu (≤ 160)**. `node scripts/audit_inputs.mjs` : PASSED.
- Captures 390 × 844 (échelle 2), toutes ouvertes et regardées : `img/apres-nugget-lotus-magnum-{alpha,beta,huiles}.png`, `apres-southern-star-lotus-magnum-*`, `apres-galaxy-lotus-citra-*`, `apres-magnum-us-galaxy-*`, `apres-comparer-3-valeurs.png`, `apres-comparer-4-valeurs.png`. Vérifié à l'œil : Lotus α = 1 trait (Beer Maverick, Hopsteiner et Charles Faram disent 13–17) ; Lotus β = 2 traits (5–6 ; 5,5–6 pour Hopsteiner et Charles Faram) ; Galaxy α = 6 traits, β = 5 traits, lignes plus hautes (50 px), nom et plage restent à hauteur de la barre ; Magnum (US) α = 3 traits dont la valeur seule de Hops Direct (13,6) en petit repère ; Southern Star α et β = 3 traits ; aucun « +n » ; Comparer : une barre par houblon, références `BM HS CF`, `BM BH CF CRO HL HPA JH YVH` en toutes lettres.
- Essais : un par critère (aucun échec à corriger ; un test de garde-fou `complements.test.ts` rouge à cause de mon import, corrigé).

## État de la maquette (controle-etats) : à rebaser par e3
Le contrôle n'a pas été rejoué (il demande une maquette construite, voie e3). Ce qui change à coup sûr :
- `etat-subst-beta` : l'attendu cite « une source chacun (Beer Maverick, Hopsteiner) » ; la note dit maintenant « traits fins, un par plage qui diffère (des sources d'accord n'en font qu'un, leurs noms au survol) ». Ses nombres (3–6, 2,8–7, 4,5–8) changent avec les compléments.
- `etat-subst-alpha` : les plages de la rangée changent avec les compléments (Nugget lit 9–16 au lieu de 9,5–16, etc.) ; « lot 13 » et « article 9,6 » ne bougent pas.
- m4 : ses captures de Substituer montreront les nouveaux traits (et des rangées α plus hautes).

## Doutes et limites
- **Le survol ne se joue pas au toucher.** Les noms des sources sont dans `title` (et `data-sources`), comme il l'a dit (« au survol, ou dans le texte des sources »). Sur téléphone, un `title` ne s'affiche pas : les noms sont lisibles à l'ordinateur seulement. Pas de nouvel élément ajouté (ses choix).
- **Le tableau des huiles de Substituer (matrice « huiles », `huilesDe`) ne lit pas les compléments** : ses cellules sont du texte, pas des traits ; hors de la règle. Mais ses plages différeront des rangées d'huile (qui lisent les compléments) : l'écart existait déjà pour les huit houblons à fiche de composés.
- Les valeurs à borne ouverte (« jusqu'à 2 », « plus de 10 ») ne se dessinent pas en trait : elles restent dans la feuille Sources de la fiche.
- **Défaut existant, hors voie** : Comparer à **quatre** houblons, feuille Valeurs : la grille repasse à 3 colonnes (la feuille est hors de `.pq-comparer[data-colonnes="4"]`, mesuré : gabarit `102px 81px 81px 81px` pour 5 enfants) : le quatrième houblon se replie sous le libellé (voir `img/apres-comparer-4-valeurs.png`). À trois houblons, tout va bien. Non touché (`comparer.css` n'est pas dans mon périmètre).
- **Donnée à regarder** : Citra β, BSG 5–9 (deux fiches BSG : 3,5–4,5 et 5–9) étire la barre de Citra à 2,7–9 alors que toutes les autres sources disent 2,7–4,5. Non marquée suspecte par la fusion ; c'est de la donnée (voie c3/d3), pas de l'affichage.
- Pendant environ deux minutes, quatre de mes fichiers (`substituer/index.tsx`, `donnees.ts`, `substituer.css`, `comparer/valeurs.ts`) ont contenu la version HEAD pour la preuve « rouge sur HEAD » ; d'autres voies ont modifié `donnees.ts` (D160, `motAffiche`) : ces changements sont bien présents dans le fichier final (vérifié au `git diff`).
- Le milieu noir (« milieu moyen des sources ») compte chaque source une fois, donc les sources d'accord pèsent plus : il inclut maintenant les compléments.

DÉCISION À PRENDRE : faut-il un moyen de lire les noms des sources au toucher (une pastille ou un texte sous la note, par houblon) ? Options : (a) rien de plus, survol seulement (ce qui est fait) ; (b) une ligne « Sources : … » repliée sous la note α et β. Recommandation : (a) tant qu'il ne l'a pas demandé ; c'est un choix d'écran, donc à lui montrer en mini maquettes si besoin.
CONNAISSANCE : la fiche Hopsteiner du catalogue (`hs`) et la source `hopsteiner` de complements.json sont la même fiche ; Citra β : BSG 5–9 isolée (voir ci-dessus).
LEÇON PROPOSÉE : aucune
