OK — t2a : tableaux import, relecture, COA, variété, noms-fr ; recommandation : garder la production partout (1,83 CHF)

## Portée et décisions du pilote (14.11)
- `lookupIngredient` (fiches malt/levure/houblon) : NON joué, décision du pilote. Il est éteint en production (`enrichissementReglages.ts`) : toute recommandation n'aurait de valeur qu'à son allumage. Les édits `fiche` / `corpsPerso` prévus n'ont donc pas été écrits (`/tmp/ed3.mjs` est un fichier sans rapport, laissé de côté).
- noms-fr : fait (0,129 CHF, sous les 0,8 CHF fixés), moitié « impaires » seulement.
- Coût = jetons + requêtes de recherche LUES au tarif officiel (0,0175 CHF la requête, 1,25 CHF/USD) ; colonne « ancrage non prouvé » : presque aucun appel ancré ne porte `webSearchQueries`, la recherche éventuelle n'est donc pas facturée ici (sous-estimation possible, jamais une facture). Un délai de 90 s est compté à la réserve (0,19 CHF).
- Argon et Carbon : tarif doublé au 1.12.2026 (2 $ / 10 $ → 4 $ / 20 $ le million) ; Hydrogen et 3.8 inchangés (1,5 $ / 7,5 $).
- Plafond de sortie des cellules Gemini 4 : 12 000 jetons (la réflexion compte dans la sortie) contre 8 000 en production pour import et relecture : relèvement du banc.

## Fichiers écrits (tous dans « Possède »)
`scripts/banc-t2a-usages.ts`, `tests/unit/banc-t2a-usages.test.ts` (16 tests verts, dont 4 d'amendements : `steps` / `mash.steps`, `alphaFacultatif`, `renoter`), `VERITE.md` (amendement ajouté), `cas-t2a.json`, `tableaux-finaux.md` (sortie brute de `--tableau`), `passe-1..4-*.log`, `sorties/`, `noms-fr/RESULTAT-NOMS-FR-TEXTE.md`, `journal-noms.md`, `tests.txt`, `tsc-*.txt`.
Option ajoutée à `scripts/banc-noms-fr.ts` (périmètre de la voie, sortie par défaut inchangée) : étiquettes `p38` (3.8 de production) et `ar` (Argon), `--journal <fichier>`, délai de 90 s pour un modèle 4, coût via `devisBanc` / `coutObserveBanc`. PIÈGE : l'étiquette `38` de ce banc désigne `STRONG_MODEL` = Hydrogen depuis h1, pas la 3.8 ; dit dans le code.
Les sorties brutes de noms-fr (`noms-fr/raw/`, `results.json`, `noms-fr-texte-paires.json`) contiennent des lignes de pièces réelles : NON commitées.

## Tableaux finaux (un tirage par cellule ; juge = ce code, pas le brasseur ; re-notation avec l'amendement)
Carbon (ca) : même tarif qu'Argon. Verdicts complets de chaque cellule dans `tableaux-finaux.md`.

### Import recette (production : 3.8@low, `importRecipe`, ancrée, sortie 8 000)
Moitié choix (3 cas : texte FR, texte DE en °P, photo)
| réglage | qualité | inutilisables | p50 s | p90 s | CHF/appel | ancrage non prouvé | verdict |
|---|---|---|---|---|---|---|---|
| 3.8@low (production) | 0,80 | 0/3 | 9,8 | 10,9 | 0,0111 | 3/3 | production |
| hy@low | 0,80 | 0/3 | 4,8 | 4,8 | 0,0233 | 3/3 | à approfondir : qualité +0,00, CHF +111 % |
| ar@low | 0,60 | 1/3 | 20,1 | 90,0 | 0,0840 | 2/2 | éliminé (1 délai) ; 0,1021 au 1.12 |
| ca@low | 0,86 | 0/3 | 28,3 | 33,4 | 0,0367 | 2/3 | éliminé (p50 ×2,9) ; 0,0676 au 1.12 |
| 3.8@medium | 0,63 | 1/3 | 30,5 | 63,7 | 0,0500 | 3/3 | éliminé (1 inutilisable, p50 ×3,1) |
| hy@medium | 0,80 | 0/3 | 17,2 | 20,8 | 0,0480 | 3/3 | à approfondir : CHF +334 % |

Moitié jugement (3 cas : impérial, saison + candi, PDF Brown Ale ; finalistes)
| réglage | qualité | inutilisables | p50 s | p90 s | CHF/appel | ancrage non prouvé | verdict |
|---|---|---|---|---|---|---|---|
| 3.8@low (production) | 0,77 | 0/3 | 8,0 | 10,3 | 0,0088 | 3/3 | production |
| hy@low | 0,80 | 0/3 | 4,9 | 6,0 | 0,0247 | 3/3 | égal : qualité +0,04 (bruit), CHF +181 %, p50 −39 % |

Ce que le juge voit : les deux modèles omettent presque toujours les paliers d'empâtage (`steps` vide ou absent) et le FG ; le plafond de 0,80 est commun, il ne sépare pas les modèles.
Recommandation : garder la 3.8@low. Gain mesuré d'Hydrogen@low : +0,04 de qualité sur 3 cas (dans le bruit) et ≈ 4 s de moins au p50 (≈ 5 s au lieu de ≈ 9 s), pour ×2 à ×3 le coût (0,023 contre 0,009 à 0,011 CHF). Seule piste, au goût du brasseur : Hydrogen@low pour le temps si l'attente de ≈ 9 s sur l'import le gêne ; sinon aucun diff. Argon et Carbon : écartés (lenteur, délais de 90 s, tarif doublé).

### Relecture de l'import (production : 3.8@low, `reviewRecipe`, sans recherche)
Moitié choix
| réglage | qualité | inutilisables | p50 s | p90 s | CHF/appel | verdict |
|---|---|---|---|---|---|---|
| 3.8@low (production) | 1,00 | 0/3 | 4,9 | 5,9 | 0,0057 | production |
| hy@low | 1,00 | 0/3 | 5,2 | 5,4 | 0,0130 | à approfondir : CHF +128 % |
| ar@low | 1,00 | 0/3 | 12,7 | 17,2 | 0,0117 | éliminé (p50 ×2,6) ; 0,0235 au 1.12 |
| ca@low | 0,92 | 0/3 | 10,2 | 13,5 | 0,0123 | éliminé (un bloquant injustifié, p50 ×2,1) ; 0,0247 au 1.12 |

Moitié jugement
| réglage | qualité | inutilisables | p50 s | p90 s | CHF/appel | verdict |
|---|---|---|---|---|---|---|
| 3.8@low (production) | 1,00 | 0/3 | 4,7 | 5,7 | 0,0052 | production |
| hy@low | 1,00 | 0/3 | 5,5 | 6,1 | 0,0129 | égal : qualité +0,00, CHF +150 % |

Recommandation : garder. Aucun gain mesurable (1,00 sur les deux moitiés : la grille ne sépare plus les modèles, limite), temps égal, coût ×2,3.

### Lecture du COA houblon (production : Flash-Lite@minimal, repli 3.8, sans recherche)
Moitié choix (2 cas : PDF, photo)
| réglage | qualité | inutilisables | p50 s | p90 s | CHF/appel | verdict |
|---|---|---|---|---|---|---|
| lite@minimal (production) | 1,00 | 0/2 | 2,0 | 2,1 | 0,0027 | production |
| 3.8@low | 1,00 | 0/2 | 4,6 | 6,6 | 0,0088 | éliminé (p50 ×2,3) |
| hy@low | 1,00 | 0/2 | 3,9 | 5,8 | 0,0173 | à approfondir : CHF +532 % |
| ar@low | 1,00 | 0/2 | 7,9 | 10,9 | 0,0150 | éliminé (p50 ×4,0) ; 0,0299 au 1.12 |
| ca@low | 1,00 | 0/2 | 7,0 | 9,8 | 0,0152 | éliminé (p50 ×3,5) ; 0,0303 au 1.12 |

Moitié jugement (1 cas : PDF piège) : Flash-Lite 1,00 en 2,4 s (0,0035 CHF) ; 3.8 8,4 s ; hy 6,5 s (0,0246) ; ar 15,9 s ; ca 12,3 s ; tous 1,00.
Recommandation : garder Flash-Lite@minimal. Qualité égale partout (1,00) ; il est 2 à 6 fois plus rapide et 3 à 8 fois moins cher. Un seul cas dans la moitié jugement : peu de poids.

### Fiche de variété de houblon (production : 3.8@low, `lookupHopVariety`, ancrée ; 2 cas : variété fictive, Citra)
| réglage | qualité (fictive / Citra) | inutilisables | p50 s (fictive / Citra) | CHF/appel (fictive / Citra) | ancrage non prouvé | verdict |
|---|---|---|---|---|---|---|
| 3.8@low (production) | 1,00 / 1,00 | 0 | 4,2 / 19,4 | 0,0021 / 0,0166 | 2/2 | production |
| hy@low | 1,00 / 1,00 | 0 | 3,8 / 11,1 | 0,0063 / 0,0345 | 2/2 | égal : Citra 8 s plus vite, CHF ×2 à ×3 |
| ar@low | 1,00 / 0,00 | 1 (délai 90 s sur Citra) | 36,5 / 90 | 0,0076 / 0,1899 | 1/1 | éliminé ; 0,0153 au 1.12 |
| ca@low | 1,00 / 0,00 | 1 (délai 90 s sur Citra) | 12,9 / 90 | 0,0080 / 0,1899 | 1/1 | éliminé ; 0,0159 au 1.12 |

Recommandation : garder la 3.8@low. Deux cas seulement. Hydrogen@low accepte `googleSearch` + `responseSchema` en `generateContent` (pas de HTTP 400) et gagne ≈ 8 s sur Citra, mais coûte ×2 à ×3 : pas de raison de changer pour une fiche lue rarement.

### Noms français des lignes de facture (production : 3.8@low, `traduireNoms`, sans recherche ; texte seul, 7 pièces impaires, 94 lignes, pièces réelles H13, juge `jugerNomFr`)
| réglage | lignes sans défaut | défauts (langue / identité / incohérent) | p50 s par pièce | CHF (7 appels) | verdict |
|---|---|---|---|---|---|
| 3.8@low (production, étiquette `p38`) | 89 / 94 (0,947) | 2 / 1 / 2 | 3,0 | 0,0258 | production |
| Hydrogen@low (étiquette `38`) | 90 / 94 (0,957) | 2 / 1 / 1 | 3,9 | 0,0631 | égal (+1 ligne, bruit), CHF ×2,4 |
| Argon@low (`ar`) | 91 / 94 (0,968) | 2 / 1 / 0 | 7,9 | 0,0401 | égal (+2 lignes), p50 ×2,6 ; 0,0802 au 1.12 |

Recommandation : garder la 3.8@low. L'écart (1 à 2 lignes sur 94) est dans le bruit d'un tirage ; Hydrogen coûte ×2,4, Argon est 2,6 fois plus lent avec un tarif doublé en décembre.

### Enrichissement des fiches (`lookupIngredient`)
Non joué (décision du pilote : éteint en production). Aucune recommandation. À l'allumage : rejouer `banc-enrichissement.ts` sur ses 38 produits (les requêtes de recherche pèsent alors : ≈ 0,35 CHF d'ancrage provisionné par appel).

## Coût de la voie
`journal-tour2.md`, lignes `t2a:` additionnées : 1,829 CHF (import, relecture, COA, variété : 1,700 ; noms-fr : 0,129, recopié depuis `journal-noms.md`). Sous le plafond de 5 CHF de la voie. Le cumul de tour est à relire par le pilote (les lignes noms-fr ont une colonne « cumul » non recalculée) ; le « déjà journalisé 13,67 CHF » vu à l'estimation de noms-fr vient du journal de la mission d'enrichissement, sans rapport.

## Contrôles de VOIE.md
- `npx vitest run tests/unit/banc-* tests/unit/models*` : 14 fichiers, 365 tests verts (`tests.txt`).
- `npx tsc --noEmit -p .` : code 0, 0 ligne ; `-p functions` : code 0, 0 ligne.
- Réponses ouvertes dans `sorties/` : import (fr, saison, deux modèles), relecture, COA photo, variété Citra.

## Diff proposé
Aucun diff à `functions/src/models.ts`. Seul changement envisageable, au choix du brasseur : import en Hydrogen@low pour gagner ≈ 4 s (coût ×2 à ×3).

## Limites
Un tirage par cellule, bruit non mesuré ; 3 cas par moitié (2 et 1 pour le COA, 1 et 1 pour la variété) ; recettes d'import inventées ; juge = ce code (L27), non étalonné sur le brasseur ; plafond de 1,00 en relecture et COA : la grille ne sépare plus ; paliers d'empâtage et FG presque jamais rendus (plafond commun de 0,80 à l'import) ; délais de 90 s comptés à la réserve ; ancrage presque jamais prouvé (coût des requêtes sous-estimé) ; noms-fr : moitié impaires, 7 pièces, 3 cellules ; `lookupIngredient` non joué.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : la réponse ancrée d'un modèle 3.8 ou 4 ne porte presque jamais `groundingMetadata.webSearchQueries` ; le programme d'empâtage d'un import peut revenir sous `steps` et non `mashSteps` ; l'étiquette `38` de `banc-noms-fr.ts` désigne Hydrogen depuis h1 (STRONG_MODEL).
LEÇON PROPOSÉE : lancer d'abord un test de notation sur une vraie réponse avant la première passe payante (la passe 1 a noté 0/n les paliers rendus sous `steps`, rattrapé par la re-notation) ; lire la valeur d'une constante de banc (STRONG_MODEL) avant de la nommer d'après son ancien contenu.
