# K : Lafontaine & Shellhammer 2018, tableau 3 (vérification)

Date : 2026-10-19. Mission : trancher le sens de lecture du tableau 3 entre H et J. Un seul fichier écrit ; aucun autre modifié.

## Verdict

**H a raison, J a tort.** J inverse les deux lignes du tableau 3. Dans l'article, ce sont les agrumes qui plafonnent (1,9 à 7,0) et l'herbacé/thé qui monte (2,5 à 10,4). La lecture de H correspond à l'article.

Le verdict repose sur la source primaire (copie éditeur lue en entier) et sur quatre indices qui concordent : les lettres de groupes du tableau, la conclusion, la discussion, et un recalcul des corrélations. L'erreur de J a une cause probable d'extraction (voir plus bas).

## Source

| Élément | Statut |
|---|---|
| DOI 10.1002/jib.517 (https://doi.org/10.1002/jib.517) | refusé : HTTP 403 |
| https://onlinelibrary.wiley.com/doi/full/10.1002/jib.517 | refusé : HTTP 403 |
| https://ir.library.oregonstate.edu/downloads/f1881s061 (copie OSU) | **lu** : PDF complet, en-tête Wiley (J. Inst. Brew. 2018 ; 124 : 434-442 ; en ligne le 12 août 2018) |

Méthode : WebFetch n'a pas pu extraire le texte du PDF. Le PDF brut a été sauvegardé (`C:\Users\mrspa\.claude\projects\C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie\16fc09ec-4e69-48a9-9744-5912b6ef6552\tool-results\webfetch-1792444268354-3ormsq.pdf`). Le texte a été extrait avec pdftotext (modes -raw, -table, -layout) vers `C:\Users\mrspa\AppData\Local\Temp\claude\C--Users-mrspa--codex-worktrees-openai-clean-start-Brasserie\16fc09ec-4e69-48a9-9744-5912b6ef6552\scratchpad\`. Pas de rendu visuel (pdftoppm absent) : aucune capture regardée. Aucun passage relayé n'est utilisé.

## Tableau 3 (article, p. 437)

Doses : 0 / 200 / 386 / 800 / 1600 g/hL, soit 0 / 2 / 3,86 / 8 / 16 g/L. Cinq niveaux seulement : pas de 1 g/L ni de 4 g/L, contrairement à la consigne de départ.

Dispositif : Cascade 2015 en cône entier, dry hop statique de 24 h, bière pâle non houblonnée de 80 L, 4,75 % vol. (méthodes), panel de 10 après exclusion (sur 13), échelle de 0 à 15 points. Lettres de Tukey (p < 0,05) : des lettres différentes indiquent une différence significative.

| Descripteur (échelle 0-15) | 0 | 200 | 386 | 800 | 1600 |
|---|---|---|---|---|---|
| OHAI (intensité globale) | 3,0 e | 6,3 d | 8,1 c | 10,4 b | 12,3 a |
| Herbal/tea (herbacé/thé) | 2,5 d | 4,3 c | 5,7 c | 7,4 b | 10,4 a |
| Citrus (agrumes) | 1,9 c | 4,4 b | 5,8 a,b | 7,1 a | 7,0 a |

Ancres du panel (tableau 1, lecture brute) : à 1600 g/hL, herbacé/thé 12-13 et agrumes 5-6. Même sens. Corroboration seulement : l'alignement y est moins net, le libellé « Herbal/tea » étant coupé en deux lignes.

## Pourquoi cette lecture est la bonne

1. **Lettres du tableau et texte.** L'article dit qu'il n'y a pas de différence significative pour les agrumes entre les deux doses les plus fortes. Seule la ligne 1,9 à 7,0 porte la même lettre à 800 et 1600 g/hL (7,1 a et 7,0 a). La ligne 2,5 à 10,4 passe de 7,4 b à 10,4 a. Citation (14 mots) : « there was no significant difference in Citrus intensity between the two highest hopping rates ».
2. **Conclusion.** Au-delà de 800 g/hL, les arômes sont plus herbacés/thé qu'agrumes. À 1600 g/hL, on lit herbacé/thé 10,4 contre agrumes 7,0. Avec la lecture de J, on aurait agrumes 10,4 contre herbacé 7,0, ce qui contredit la conclusion.
3. **Discussion.** La qualité herbacé/thé est celle qui suit le plus la dose (r = 0,994 ; OHAI : r = 0,960). Les agrumes ne suivent pas la loi de Steven. Les auteurs l'attribuent à une suppression par l'herbacé ou à une limite de solubilité, ce qui correspond à un plateau des agrumes.
4. **Recalcul des corrélations sur les moyennes** (approximatif, l'article travaille sur les observations individuelles) : ligne 2,5 à 10,4, r = 0,982 ; ligne 1,9 à 7,0, r = 0,794 ; OHAI, r = 0,922. Les valeurs exactes ne se reproduisent pas, mais le classement est net.
5. **Pente log-log (200 à 1600 g/hL).** Ligne 2,5 à 10,4 : pente stable (0,43 ; 0,36 ; 0,49 entre points successifs). Ligne 1,9 à 7,0 : 0,42 puis 0,28 puis −0,02, soit un plateau entre 800 et 1600. L'article donne n = 0,30 pour l'herbacé/thé et 0,35 pour OHAI ; ces exposants ne se reproduisent pas exactement à partir des moyennes.

## Piège d'extraction (cause probable de l'erreur de J)

Avec `pdftotext -layout`, le libellé « Herbal/tea » sort seul sur une ligne, au-dessus de la ligne Citrus. Une lecture ligne à ligne place alors les valeurs 2,5 à 10,4 sur Citrus. Les modes `-raw` et `-table` relient libellé et valeurs. Hypothèse seulement : on ne sait pas comment J a lu le tableau.

## Ancre du profil simulé

- PROFIL-SIMULE.md, ligne 38 : ancre de 26 points = (5,8 − 1,9) ÷ 15 × 100 = 26,0. Les 5,8 sont la valeur agrumes à 386 g/hL (3,86 g/L) et les 1,9 celle à 0 g/hL. **Vérifié : 26 points, maintenu.**
- Si J avait raison (PROFIL-SIMULE.md, lignes 163 à 165) : (5,7 − 2,5) ÷ 15 × 100 = 21,3, soit 21 points, avec des agrumes qui ne plafonnent plus. **Rejeté.** L'ancre et la forme de la courbe agrumes restent celles de H.
- Une correction de convention reste à faire, sans lien avec le sens. La convention 1 (ligne 76) et la ligne 38 supposent une bière à 5 % vol. L'article indique 4,75 % vol. L'ancre de 26 points vient du tableau, pas du degré. Le degré intervient seulement dans l'hypothèse de convention du moteur. Décision pilote : rien n'a été modifié.

## Limites

- Un seul article, un seul lot de Cascade 2015, une bière de base pâle, 80 L, panel de 10. Le tableau n'est pas une loi générale.
- Échelle de points d'un panel (0 à 15), pas une intensité absolue : les écarts ne se transposent pas en µg/L.
- Figure 1 non vue. Pas de rendu visuel disponible.
- Les valeurs viennent d'une extraction de texte, sans capture. L'appariement repose sur quatre arguments indépendants, pas sur une image regardée.

## Corrections proposées (non appliquées)

- J (`work/refonte-frontend/v4/recherche/J-comparatifs-dryhop-varietes.md`) : ligne 33 (E04) et ligne 71 (« Citrus : 2,5 à 10,4 ; Herbal/tea : 1,9 à … ») : inverser agrumes et herbacé.
- PROFIL-SIMULE.md (`work/refonte-frontend/v4/ecran-1/fils21-choisir/donnees/PROFIL-SIMULE.md`) : ligne 38 et convention 1 (ligne 76) : 4,75 % vol. au lieu de 5 %. Lignes 161 à 165 : retirer l'alternative à 21 points, lecture de J fausse.
- H (ligne 27) et `docs/hop-solver.md` (ligne 84) : lecture confirmée, aucune correction.
