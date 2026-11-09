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
| Compta et prix · passe 4 (c6, p5a–f, e3, v6 ; candidates c6a, p5b, e3a, v6b) | 09.11 v4 | https://claude.ai/artifact/TVUKKH2kF17shw3e44zmQm | `work/refonte-frontend/v4/outils/pages/2026-11-09-compta-prix-p4/index.html` |

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
- **Mise à jour** : phase 2 commitée (2d290f56, 180 tests verts). Test d'écran du critique : `critique/TEST-ECRAN-P2.md` (20 constats, c3a à corriger, p2b fidèle) ; correctifs en cours, voie fx (`voies/fx/RESULTAT.md`), non commités. Passe 4 maquettes finie (c6, e3, p5a–f, v6) ; critique en cours → `critique/SYNTHESE-P4.md`, puis page passe 4 (artefact neuf, avec p4/f52 si le brasseur l'a lancé).
- **Mise à jour 2** : choisis aussi e3a (rangement) et v6b (Opérations). Correctifs du test d'écran commités (75ea78c9). Page passe 4 v4 (https://claude.ai/artifact/TVUKKH2kF17shw3e44zmQm) : rangées 1 bis (c7a–c), 2 bis (p5g–o Fable 5.2), 2 ter (p5p–u Fable 5.2). En cours : Prix c8a–d (base c7c, « on peut faire encore mieux »), Prévisions p6a–f (base p5a + aspects p4a, p5g, p5q, p5s). À leur retour : ajouter à la page (rangées neuves, même méthode node + verifier-page), publier sur la même adresse, commit. Puis port de v3a (voie uv), g3a, g6, e3a, v6b, et des choix Prix et Prévisions.

## État de l'art
| Problème type | Examiné | Décision |
|---|---|---|
| QR-facture suisse | Norme SIX « Swiss Implementation Guidelines QR-bill » (v2.3 : adresses structurées seules, depuis novembre 2025, à vérifier) ; `swissqrbill` 4.4.1 installé : `swissqrbill/svg` (`SwissQRBill`, `SwissQRCode`), `swissqrbill/utils` (`isQRIBAN`, `isIBANValid`, `calculateSCORReferenceChecksum`, `calculateQRReferenceChecksum`), `swissqrbill/pdf` (exige PDFKit, absent) ; corps actuel en jsPDF (`package.json:40`) | Garder jsPDF pour la facture ; section paiement depuis `SwissQRBill` (SVG) posée dans le PDF par `svg2pdf.js` (vectoriel, à ajouter : décision pilote) ; repli sans dépendance : SVG rendu en PNG ≥ 300 dpi. Référence : SCOR (RF) avec IBAN ordinaire, QRR seulement si `isQRIBAN`. Jamais de QR dessiné à la main. |
| Coût de revient | Méthode des coûts complets : directs + indirects répartis par clé (volume annuel) ; déjà dans `brewBudget.ts:382-390` | Garder la clé « litres conditionnés par an », une seule valeur (`profile.annualProductionL`), problème 28. |
| Amortissement / usure | Notice AFC A 1995 (`annual.ts:6`), taux dégressif et linéaire (moitié) ; usure économique = linéaire sur la durée d'utilité | Annuel : AFC (inchangé). Litre et frigo : usure linéaire, durée saisie, défaut = 100 ÷ taux linéaire AFC de la catégorie (décision P2). |
| Prévision de trésorerie | Méthode directe (encaissements et décaissements par mois, solde cumulé), scénario « et si » par flux ajouté, point bas = minimum du cumul | Garder `buildForecast` (centimes entiers, mois calendaires déjà testés) ; ajouter les flux dérivés et le scénario ; aucune bibliothèque. |
| Impôt sur la bière | LIB (RS 641.411) art. 14, barème 16,88 / 25,32 / 33,76 CHF/hl ; OIBi (RS 641.411.1) pour la réduction ; °Plato par le polynôme de Lincoln | Un barème (`swissBeerTax.ts:6`), une formule °Plato ; période et délais lus dans la directive OFDF avant de dater l'item. |
| Diagramme de flux (c3a) | Sankey : `recharts` 3 installé (`package.json:47`) a `<Sankey>` ; son placement itératif réordonne les nœuds | Un essai `recharts` (`iterations={0}`, nœuds et liens dessinés par nous) ; si l'ordre de c3a ne tient pas, mise en page bipartite fixe (empilement proportionnel, liens Bézier), testée. |
| Numérotation continue | Compteur + transaction Firestore (exige le réseau) ; max + 1 local (hors ligne, risque de doublon sur deux appareils) | max + 1 sur le grand livre local par année ; doublon détecté à la synchro et signalé, jamais renuméroté après envoi. |

| Placement automatique d'étiquettes (« automatic label placement », Imhof 1975 ; NP-difficile en général) | Méthode d'école : positions candidates par étiquette, collision rectangle contre rectangle, glouton par priorité (Christensen, Marks, Shieber 1995, recuit simulé en option). Bibliothèques connues : `d3-labeler` (recuit, ancienne, non maintenue), `labella.js` (frises de dates), `@visx/annotation` (ancre + fil, mais sans anti-collision), Recharts (aucune anti-collision). **À vérifier par le pilote : aucun accès réseau ici, rien n'a été confirmé sur la maintenance actuelle.** | Pas de dépendance neuve. Une fonction pure `placerEtiquettes` : au plus ~12 étiquettes, 3 à 5 positions candidates (droite de la marche, dessous, gauche), glouton par priorité (projet testé, brassin, plus gros montant, puis date), collision par rectangles, jamais de recouvrement ; ce qui ne trouve pas de place passe dans une pastille « + N » qui ouvre la liste. Testée sur la fixture de la maquette et sur 25 sorties. À la deuxième rustine sur ce module : arrêt, on rouvre cette ligne (L29). |
| Graduations « jolies » d'un axe (Heckbert 1990, nombres 1-2-5 × 10^k) | `d3-scale` (`scaleLinear().nice().ticks()`) est installé mais seulement en dépendance transitive de `recharts` (`victory-vendor`) : l'importer en direct sans le déclarer au `package.json` est fragile. | Recommandé : déclarer `d3-scale` au `package.json` (décision du pilote : fichier hors de ma voie). Repli sans dépendance : Heckbert en 15 lignes, testé sur les bornes de la fixture (−892,66 à 4 181,60 → pas de 1 000). |
- **Mise à jour 3 (port, contrat réécrit par la session de suivi : `compta-prix-VOIE-port.md`)** : tous les écrans choisis (p2b, c3a, v3a, g3a, g6, e3a, v6b, c7c, p5b). Commités : v3a caisse (d4bb2126, correctifs 119328e6), p5b Prévisions (a0d94832). Codés, non commités : ue (c7c + e3a, voies/ue), us (g3a, voies/us), uo (v6b, voies/uo, branchement FinancesTab à vérifier), px (correctifs p5b, voies/px). En cours : ix (intégration : App.tsx onOpenSale, props uo, formatsVente lit tarif.format, suite complète, tsc, build ; voies/ix/RESULTAT.md) et ug (g6, étape 2 après revues). Ensuite : commit par voie après ix vert ; tests d'écran du critique sur g3a, v6b, c7c+e3a, g6 ; restes (lien Réglages App.tsx, cibles 36 px c3a) ; à lister pour le brasseur : suppression de CreativePricing.tsx (accord), Impôt bière de l'année sans maquette, compromis listés par voie. Un seul récap à la fin (session de suivi).
