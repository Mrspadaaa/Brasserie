# Mission 2026-11-09-compta-prix — refondre la comptabilité et les prix

## Objectif
Ses mots (09.11, SPEC-BRASSEUR) : « le buinsess n'est pas claire mais surtout le ux, ui est horrible, je veux des minimaqueette ».
Périmètre : Finances (Synthèse, Opérations, Prévisions, Annuel), coût d'un brassin et d'un litre, prévisions de coûts et d'achats,
Clients › Prix et marges, Impôt bière, facture de vente. Session lancée par la pilote « Houblons v4 maquette ».
Étapes : inventaire (fait : `INVENTAIRE-CODE.md`, 30 problèmes ; captures `inventaire/`) → lot v0 de mini maquettes → tri du critique →
page publiée → son choix → port fidèle, contrôles, vision 390/1280 deux thèmes, build vert, commit (pas de push, pas de déploiement).

## Décisions
| Décision | Décideur |
|---|---|
| Lot v0 : 8 écrans en 4 voies de 2, 3 concepts par écran (froid, tiède, chaud) = 24. Plus que les 12 à 16 de D204, mais par écran trois seulement : lecture étroite de D204 (par lot d'un écran), le domaine en compte huit | pilote |
| Pas de jury : le cadrage vient de l'inventaire du code (30 problèmes sourcés) et de la chaîne métier unique écrite au brief (coût brassin → litre → format → prix → facture → résultat) | pilote |
| Données des maquettes = fixture `src/dev/financeDemo.ts` ; l'IBAN n'apparaît jamais | pilote |
| Choix de goût (la forme de chaque écran) : au brasseur, en mini maquettes ; ne bloque pas | brasseur |
| Corrections métier sans goût (QR réel `swissqrbill`, adresse client et brasserie, n° de facture continu, un seul résultat, taux impôt bière unique) : au port, avec l'écran choisi | pilote |

## Voies
| Voie | Objectif | Niveau | Agent | Modèle | Plafond | Possède | Dépend de | Contrôles | Décideur | Étape |
|---|---|---|---|---|---|---|---|---|---|---|
| i0 | inventaire du code, problèmes métier et interface | jugement | auteur | sonnet | 60 | work/missions/2026-11-09-compta-prix/INVENTAIRE-CODE.md | — | relu par le pilote | pilote | — |
| i1 | captures de l'existant (390, 1280) | mécanique | executant | haiku | 45 | work/missions/2026-11-09-compta-prix/inventaire/** | — | captures ouvertes | pilote | — |
| g | Synthèse, Annuel | conception | concepteur | opus | 70 | work/missions/2026-11-09-compta-prix/v0/g*/** | i0 | verifier-page, captures ouvertes | brasseur | v0 ×6 (froid, tiède, chaud par écran) |
| c | coût d'un brassin/litre, Prix et marges | conception | concepteur | opus | 70 | work/missions/2026-11-09-compta-prix/v0/c*/** | i0 | verifier-page, captures ouvertes | brasseur | v0 ×6 |
| p | Prévisions, Impôt bière | conception | concepteur | fable | 70 | work/missions/2026-11-09-compta-prix/v0/p*/** | i0 | verifier-page, captures ouvertes | brasseur | v0 ×6 |
| v | facture de vente, Opérations | conception | concepteur | opus | 70 | work/missions/2026-11-09-compta-prix/v0/v*/** | i0 | verifier-page, captures ouvertes | brasseur | v0 ×6 |
| t | tri des 24 concepts (classement, candidates, greffes) | jugement | critique | fable | 30 | work/missions/2026-11-09-compta-prix/critique/** | g, c, p, v | captures ouvertes | pilote | tri |

## Boucle de retour
Ses mots vont mot pour mot dans SPEC-BRASSEUR.md, une plainte dans DEFAUTS-RECURRENTS.md avec son contrôle, son choix dans
`work/refonte-frontend/v4/choix/ecrans-app.json`.

## Pages
| Sujet | Version | Adresse | Source |
|---|---|---|---|
| Compta et prix · panel v0 (24 concepts ; candidates g1b, g2b, c1b, c2b, p1b, p2b, v1c, v2c) | 09.11 v1 | https://claude.ai/artifact/TxmDK9GPdx61jP3UG7kTLS | `work/refonte-frontend/v4/outils/pages/2026-11-09-compta-prix/index.html` |
| Compta et prix · passe 2 (32 variantes ; candidates g3c, g4d, c3a, c4a, p3a, e1a, v3a, v4b ; p2b choisi) | 09.11 v2 | https://claude.ai/artifact/1ePJcgviBQ5SqzqJe7w2Su | `work/refonte-frontend/v4/outils/pages/2026-11-09-compta-prix-p2/index.html` |
| Compta et prix · passe 3 (g5, g6 clôture, c5, p4 frigo, e2, v5 ; candidates g5c, g6, c5a, p4a, e2a, v5a ; e2c écartée) | 09.11 v3 | https://claude.ai/artifact/Du3g2PfGqwka9cLuEHcWPe | `work/refonte-frontend/v4/outils/pages/2026-11-09-compta-prix-p3/index.html` |

## Sources
- `INVENTAIRE-CODE.md`, `BRIEF-AUTEUR.md`, `work/missions/BUGS.md`, PRODUCT.md, DESIGN.md

e2c écartée : impôt de l'année faux (303,84), critique SYNTHESE-P3.

## État de reprise (09.11, soir)
- **Choisis** (ecrans-app.json) : p2b impôt, c3a coût du litre, v3a facture, g3a Synthèse, g6 Annuel + clôture.
- **Commits** : 4c1d0543 (v0), 55a1a976 (passe 2), 480f8d3e (phase 1 du port : chaîne litre, matériel futur, QR-facture), 2b6577f7 (passe 3). Rien poussé.
- **Port phase 2, non commitée** : d2 fini (brewForecast.ts, 44 tests) ; uc fini (c3a porté, 112 tests, captures dans voies/uc/captures, « Prévoir » non branché à Prévisions) ; up en cours (p2b). À faire : rejouer tests d2+uc+up, `tsc`, git status contre Possède, test d'écran du critique (390 tactile, 1280, deux thèmes) sur uc et up, commit. Décision ouverte : up et d2 reprennent `netVolumeSaisi` et `reductionImpotPourAnnee` de brewBudget.ts (même litre, même réduction).
- **Passe 4 maquettes, en cours** : voie c (c6a–d Prix type c5b+c5a, e3a–c rangement autour de e1b), voie p Fable (p5a–f Prévisions, lisibilité), v fini (v6a–b Opérations compactes). Puis critique, page publiée (artefact neuf), MISSION § Pages.
- **Fable 5.2** : brief prêt `BRIEF-FABLE52.md` (p5g–p5l dans p4/f52/), à lancer par le brasseur depuis l'app de bureau ; comparer les deux séries dans la page passe 4.
- **Ensuite** : port de v3a (voie uv, phase 3 de PLAN-METIER § 3.5), puis g3a, g6, et les écrans choisis en passe 4.
