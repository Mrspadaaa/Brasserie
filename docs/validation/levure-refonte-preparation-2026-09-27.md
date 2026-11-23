# Refonte Levure — disponibilité, choix, fermentation et ensemencement

## Intégration performance et publication combinée terminées — 28/09

Les deltas e04b856/c289115 sont présents avec la refonte dans la publication
**1790572600724000 /c0ddae8d3a37f642**, entrée **index-CwJDPg0z.js**,
05:16:40UTC. `npm run deploy` commande87995 exit0;35Functions actives et
**146 GET publics200 /SHA-256 identiques** au build combiné.25empreintes sources
avant/après identiques. 4 945/4 945 tests335fichiers, build/types/QA390/1280 verts;
même Astra favorable, six réserves Levure préservées. [Résultat concret](../../work/levure-refonte-realisation-2026-09-27/performance-integration-2026-09-28/RESULT.md).

L’ancienne publication04:22 n’intégrait pas la performance : régression reconnue
et corrigée. Le pilote source prend le Chrome authentifié final; aucune mesure
Android physique après n’est revendiquée. Automations toutes supprimées,
aucune recréée; incident de jetons distinct, aucune révocation implicite.

### Mandat et réalisation de la reprise

Retour utilisateur relayé par le pilote source : l’optimisation avait disparu
après la publication refonte. Constat : App/PageShell/RecipePage du checkout
publié étaient encore ceux de base 5a49cc5, contrairement à e04b856/c289115.
La publication refonte a donc remplacé l’optimisation du checkout séparé.

Sol reste seul intégrateur/publieur, même branche et changements locaux. Reporter
les deux commits applicatifs **e04b856 / c289115** par fusion à trois versions
sur le contenu courant, sans remplacement de fichiers refonte ni reset/stash.
Ba59775/PR19 et outils/preuves performance ne sont pas un delta applicatif.
Ownership source : Sol sur les 25 fichiers; même Luna QA sur le banc combiné.

Résultat observable : préparation de la fiche depuis la liste, rapports à la
demande, caches cohérents et référence immuable non revalidée, identité/focus
par recherche, en conservant les décisions et six corrections Levure. Heading
adapté à l’API présente; préserver Eau/Houblons, source/ingress/Undo-pitching,
stockage, hors ligne et snapshots. Refus : gain par données/capacités perdues,
cache périmé, source inventée, blocage repoussé au premier rapport ou rollback
des corrections de refonte. Parcours/test discriminant combiné puis gates de
publication et empreintes publiques; mesures locales ≠ Android réel.

Preuves/candidats/backups ciblés :
`work/levure-refonte-realisation-2026-09-27/performance-integration-2026-09-28`.
Toutes les automations ont été supprimées par le pilote; **n’en recréer aucune**.
Aucun appel Claude rituel, aucun secret relu/affiché, ni donnée réelle de test.
Le pilote source réalise la vérification authentifiée finale dans son Chrome.

Intégration écrite : 25 fichiers applicatifs/tests cumulés depuis base5a49 vers
c289115 (inclut e04b856), sans index/branche/commit modifiés. Candidats/backups
et SHA-256 dans merge-plan/merge-applied.json. App/PageShell/RecipePage et les
autres fichiers sans delta refonte reçoivent le delta performance; yeastReferences
et Workbench fusionnent les deux; conflit stockage résolu en gardant snapshot
Hop stable et get/saveYeastProducts typés. Heading : classifyYeastRecipeDesignChange
existe réellement et PitchingPanel/summary de refonte restent présents.
**Build0 et131/131 ciblés /14 fichiers** (`combined-build.log`,
`combined-targeted.log`). Gate complet et QA combinée lancés; source stable.

Premier gate combiné : 4 944 passes/1 échec,335 fichiers; seul test yeastWorkflow
lisait encore le rapport différé sans événement toggle. Sol garde le résumé
objectif/consigne et absence de section doublée, vérifie l’absence du rapport
avant ouverture puis toggle/findByLabel après ouverture. **8/8** ciblés verts
(`disclosure-assertion-verified.log`). Aucun code produit changé par cet ajustement;
nouveau gate `combined-full-tests-verified.log` en cours (commande3917).
Gate combiné terminé **4 945/4 945 tests /335 fichiers**,194,93s,commande3917
exit0. Build et types Functions verts, checklist publication verte. App/PageShell/
RecipePage/loader ont exactement les blobs du correctif c289115; les fichiers
chevauchant la refonte portent la fusion contrôlée.
QA finale reçue : run `after/run-2026-09-28T04-58-13-932Z/manifest.json` dans
le dossier d’intégration,26captures à390/1280, sans overflow/erreur/réseau.
Fiche/premier rapport, Ctrl+K A→B/Échap/focus A, mesures Word, ownership,
clear/Undo/Redo, save/reopen, snapshot identique passent. Paramètres eau/houblons
exacts; deux dérivés startIons/wortIons du save sont explicitement consignés.
Sol a regardé les captures-clés. Les premiers échecs de harness sont conservés.
Ancien4181 non repointé ne qualifie pas le nouveau code; service QA éphémère fermé.
Revue ciblée du résultat combiné confiée à la même consultation Astra Levure.
Avis reçu même UUID,commande94382 exit0 : aucun écart matériel sur le report;
caches réservés aux objets exacts validés/figés, produits/offres, overlays,
pitching, identité/focus et disclosures préservés; six réserves Levure levées.
`astra-combined-review.md` conservé. Publication combinée par procédure normale
autorisée et préparée, aucune automation ni révocation d’authentification créée.

## Publication réalisée — 28 septembre 2026

Tous les changements applicatifs locaux ont été publiés sur
[L’Affinée](https://brasserie-l-affinee.web.app), via `npm run deploy`, commande
**71542 exit 0**. Firestore règles/index, **35 Functions Node22 europe-west6**,
puis Hosting. Les deux nouvelles corrections de levures sont ACTIVE.
Release **1790569338952000**, version **e5d521379394bfc1**, 04:22:18 UTC.
**145 fichiers exécutables vérifiés HTTP200 et SHA-256 identiques** au build local;
écran d’accès Google prêt, aucune erreur JS, aucun test de données ou Gemini réel.
[Rapport et référence précédente](../../work/levure-refonte-realisation-2026-09-27/deploy-2026-09-28/release-result.md).

Le diagnostic Firebase a affiché des jetons dans le chat; leur révocation reste
à traiter, sans valeur copiée dans ce registre ni rotation faite durant le deploy.

### Autorisation et préparation

Nouvelle demande utilisateur : « Tu peux deployé avec tout les changements local ».
Publier tous les changements applicatifs du checkout courant, Hosting + Functions
et règles/index Firestore, via `npm run deploy` sur `brasserie-l-affinee`.
Les outils, archives et preuves de travail ne sont pas des assets applicatifs.
Pas de commit/push implicite, pas de migration/écriture de données pour tester.

Même branche/HEAD, quatre Luna terminées et aucun écrivain source en cours.
4 927/4 927 tests/329 fichiers sur le dernier état; types et build verts.
Checklist DEPLOY complémentaire : règles régénérées, 30 collections couvertes,
unités/brassage/eau/16 schémas IA verts. Preuves dans
`work/levure-refonte-realisation-2026-09-27/deploy-2026-09-28`.
La commande de publication reconstruira les deux bundles et les règles avant
les services puis Hosting. Vérification finale publique en lecture seule.

## Résultat local terminé — 28 septembre 2026

Le parcours demandé est réalisé : choix direct ou comparaison facultative,
produit/format/offre/lot distincts, conseil/quantité/packs, notice et préparation
pré-J0, réel et stock, sources/corrections et continuité hors ligne. Le
[bilan de livraison](levure-refonte-livraison-2026-09-28.md) rapproche besoins,
artefacts, contrôles et limites.

Les **six réserves matérielles Astra sont levées** dans la même consultation
`01a0dee4-e39d-7f92-8596-7167d5dff84b`; dernier
[verdict](../../work/levure-refonte-realisation-2026-09-27/astra-lookup-ingress-review.md),
commande **54798** terminée exit 0. Le défaut d’entrée IA ordinaire est corrigé
au validateur partagé et à l’adaptation; les liens déjà enregistrés restent lisibles.

Gate actuel : **4 927/4 927 tests / 329 fichiers**, commande **38017** exit 0,
`lookup-ingress-final-tests.log`, 192,86 s. Build TypeScript/Vite et exclusion du
rapport privé réussis (`lookup-ingress-final-build.log`); types Functions verts
(`lookup-ingress-functions-types.log`); 109 tests ciblés verts. Aucun garde-fou
affaibli ni échec caché. Les échecs et leurs corrections restent datés ci-dessous.

QA finales 390×844/1280×900 : notice `00-07-59-059Z`, moût stock/choix/historique
`00-09-00-160Z`, saisie libre déjà documentée `00-55-59-284Z`, provenance du champ
stock et contre-exemple historique `00-58-51-006Z`, identité d’offre après scroll
`23-15-43-692Z`. Gestes/save/reopen et captures contrôlés; zéro débordement,
exception, erreur console ou réseau externe dans ces runs.

Branche `codex/levure-refonte`, HEAD `5a49cc51ba4d37ef4300e6404c0c989d22d10425`,
travail local sans commit/push/deploy. Modifications préexistantes de PRODUCT,
check-nolo et monkey préservées. Mêmes quatre Luna et même Claude natif
`f90e0c16-852c-4914-ad90-86f5021b427b`; handoffs UI/notice completed avec preuves.
Performance et rotation de clé restent leurs missions séparées. Aucun quota
Claude actuellement refusé; ancien réveil de quota toujours PAUSED.

Limites conservées : serveurs navigateur mockés, aucun Gemini/Firestore ou sync
réels, pas d’IME Android physique ni étude de compréhension; réponse exacte S-04
absente, citations sans corps archivé, sources manuelles déclaratives, catalogue
non exhaustif et origines parfois inconnues, mesures p95 locales seulement.
Les avertissements Vite existants persistent; aucune garantie biologique ajoutée.

Relecture finale 4181 reconstruite depuis cet état, PID **57104**, builddir
`%TEMP%/laffinee-hop-qa-yeast-refonte-ingress-final-20260928`. Application et
concepts répondent 200, CSP connect-src self. Aucun nouveau parcours/capture
pour cette actualisation mécanique; les preuves visuelles précédentes restent
applicables. Aucun listener 4182. Registre et bilan clos, aucun travail nécessaire
restant dans ce mandat.

Les sections suivantes sont le journal de réalisation et de reprise.

## Jalon — six raccords intégrés, verdict final encore en cours à ce moment (28/09)

La même consultation Astra `01a0dee4-e39d-7f92-8596-7167d5dff84b` a rendu
[six écarts matériels](../../work/levure-refonte-realisation-2026-09-27/astra-integrated-review.md)
à corriger avant livraison locale; aucun nouveau pilote, aucune publication.
La même revue [Astra](../../work/levure-refonte-realisation-2026-09-27/astra-six-fixes-review.md)
terminée exit 0 lève les points **1, 3, 5 et 6**. Deux raccords restent ouverts :
**2**, provenance du scalaire de floculation adopté depuis le stock, et **4**,
édition du moût d’une saisie libre déjà munie d’une fiche locale. Ces deux raccords
sont maintenant corrigés et vérifiés par la même équipe; les QA finales sont
`00-58-51-006Z` (source du champ) et `00-55-59-284Z` (libre documenté), captures
regardées par Sol. Aucun débordement, réseau externe, exception ni erreur console.
Même Astra revoit ces deux corrections dans la commande **3770** en cours,
`astra-last-two-review.md`; `thread.started` confirme le même UUID. Les quatre
réserves levées restent acquises. Les contrôles globaux et build du nouvel état
sont terminés exit 0 (`last-two-final-tests-verified.log`, `last-two-final-build.log`).
Gate final : **4 925/4 925 tests / 329 fichiers**, durée 193,83 s. Les deux
assertions corrigées passent dans le gate complet, aucun échec masqué.

Revue 3770 terminée exit 0, `astra-last-two-review.md` : **4 levé**, DB→stock
et champ source confirmés, mais entrée lookup ordinaire pouvait auto-déclarer
`acceptedScalarFields`. Sol corrige ce dernier raccord dans le validateur partagé
`yeastLookupResultError` (appelé Functions/client) et l’adaptation de nouvelles
réponses `adaptYeastLookupResult`. Réponse auto-marquée refusée, marqueur neutralisé
à l’adaptation; aucun changement du reader persistant ou de l’apply signé.
Tests rouges **2 échecs/6 passes** avant (`astra2-lookup-ingress-first.log`), puis
**109/109 sur 5 fichiers** dans `astra2-lookup-ingress-current.log` : Low historique
reste sans provenance après corroboration auto-marquée et save/reopen, brut IA
conservé et lien persisté toujours lisible. Build `lookup-ingress-final-build.log`
et types Functions `lookup-ingress-functions-types.log` verts. Gate global **38017**
→ `lookup-ingress-final-tests.log`, relecture même Astra **54798**
→ `astra-lookup-ingress-review.md` en cours, dernière réserve 2 seulement.

Point 4 complémentaire corrigé : propriétaire libre sans identifiant reconnu
pour l’intention `pitching`, contrôles identité/portée de `tryAdoptYeastDocumentary`
conservés. `astra4-free-owned-first.log` reproduit le refus (1 échec/3 passes);
`astra4-free-owned-verified.log` passe **4/4** : modification 42 L, qualification
au clavier, save/reopen puis effacement/save, stock et libre avec fiche locale
déjà adoptée. Fiche identique et technicalFacts absent. La QA prépare le rejeu
exact reçu à 390/1280 dans le run `00-55-59-284Z`, après effacement et réouverture
la fiche reste identique. Verdict final externe encore attendu.

| Avis / résultat observable | Owner et décision | État et preuve actuelle |
|---|---|---|
| 1. Réponse DB A tardive ne paraît jamais sous B | Sol retient : sessions/requêtes et concordance cible avant revue/apply/reçu | Tests rouges puis 11/11 verts (`astra1-stale-*`). Après report Claude05, normalisation de la cible UI/proposition stock.ref vers identité du reçu stock.id corrigée; types app verts et tests stock/stale/strict 18/18. |
| 2. Bornes strictes et provenance ne deviennent pas nombres nus | Luna IA retient : qualifier >/< séparé de ≥/≤, scalaire seulement compatible et couplé à son fait/source/date/contexte | Backend + domaine livrés, enums `strict-lower-bound`/`strict-upper-bound`. Backend/domaine 43/43, dont les 4 signes fact IA→dose→CAS/audit/reçu; UI stricts/égalité et comparaison passent sans packs déduits des bornes; types app/Functions verts. |
| 3. Quantité réellement versée convertit vers stock tenu en packs | Luna ensemencement retient : helper pur g↔sachet/mL↔flacon avec format exact et confirmation recette sans contradiction | Livré : 11,5 g→1 sachet, 62,5 mL→0,5 flacon, refus inconnue/contradiction et idempotence. 67 tests/3 fichiers et build verts avant erreur Panel de point 1. |
| 4. Moût indépendant conserve valeurs et effacement lors de tous les choix | Sol retient : effacement préservé par Undo/Redo et choix stock/libre du Wizard | Tests rouges puis correction; 100/100 vrais parcours édition/choix/Wizard verts. [QA finale](../../work/levure-refonte-realisation-2026-09-27/qa/after/run-2026-09-28T00-09-00-160Z/manifest.json) 390/1280 : clavier, stock/libre, Clear→Undo/Redo, save/reopen hors ligne; fiche identique, technicalFacts absent, aucun nouveau diff. Captures regardées par Sol. |
| 5. Notice de préparation applicable hors bootstrap saisissable/corrigeable | Luna IA backend + **même Claude05** frontend, retiennent protocole typé, revue/CAS/reçu et adoption volontaire | Service testé, frontend reçu/appliqué; Sol clé par produit et retour Écarter vers brouillon, 19 tests UI verts. [QA finale](../../work/levure-refonte-realisation-2026-09-27/qa/after/run-2026-09-28T00-07-59-059Z/manifest.json) 390/1280 : reçu sans adoption, choix volontaire, plan 48 h, refus trop proche sans perte, save/reopen hors ligne et snapshot. Copie recette seule conservée sans publication. Captures regardées par Sol. |
| 6. Produit/format reste identifiable dans offres après scroll mobile | Luna approvisionnement retient un rappel compact dans chaque offre | 6 tests verts + QA `after/run-2026-09-27T23-15-43-692Z` : deux variantes du même vendeur identifiables à droite à 390/1280, pas de retour à gauche, zéro overflow/erreur/réseau. |

Verdict courant sur cette table : **1/3/5/6 levés**. Point 2 reste partiel après
reprise stock : le fait compagnon accepté ne rejoint pas encore la provenance
du scalaire projeté/rendu. Point 4 reste partiel pour le libre déjà documenté :
correctif et test discriminant écrits ci-dessus, preuve navigateur encore attendue.
La présence du fait brut seul ne prouve pas la provenance du champ retenu; une
ancienne valeur identique ne doit pas être associée automatiquement à ce fait.

Point 2 complémentaire livré par la même Luna : `acceptedScalarFields` porté
par le fait typé, écrit seulement par apply de la paire choisie, conservé à la
lecture/transport. Anciennes relations courantes retirées au remplacement, faits
bruts conservés; source/origine/date/contexte visibles dans le champ. Sélection
documentaire explicite prioritaire; scalaire identique non marqué historique.
**95/95** tests backend/projection/rendu, audit et types Functions/app verts,
dans `corrections-ia.md`. Même QA joue maintenant les deux fixtures dédiées;
gate global **42425** → `last-two-final-tests.log`, build **83490** terminé
exit 0 → `last-two-final-build.log`. Aucun autre changement source annoncé.

Le gate 42425 termine à **4 923 passes / 2 échecs, 329 fichiers**. Échecs qualifiés :
offre du 27/09 devenue à revérifier après 24 h (horloge de fixture non fixée), et
égalité d’objet candidat sans nouveau fait compagnon. Sol fixe Date.now au jour
du scénario dans ce test et conserve toutes les valeurs/sources tout en ajoutant
les assertions du fait origine/lien/contexte. **85/85** ciblés passent dans
`last-two-gate-assertions-verified.log`; aucun comportement produit modifié pour
ces assertions. Nouveau gate → `last-two-final-tests-verified.log` en cours.

Un défaut de raccord supplémentaire a été **joué par Sol dans le vrai Wizard** :
avec fiche locale liée au stock, première saisie de volume crée l’enveloppe puis
Mesuré/SG et autres éditions pitching sont refusés comme un remplacement de
levure. Le composant seul est vert, le test du Wizard reproduit le refus.
`pitchingChange` passe maintenant une intention **`pitching`** explicite, préservant
le propriétaire documentaire sans réenrichir la fiche lors des gestes physiques.
Le premier raccord `conduct` avait déverrouillé la saisie mais la QA a trouvé un
fact `form` ajouté depuis l’article lié. `applyFermentationRecipe` évite maintenant
ce réenrichissement pour pitching; les lecteurs automatiques `localStockFacts` et
`localIngredientFacts` gardent aussi les fiches déjà adoptées, y compris au
récapitulatif. L’enveloppe locale était identique mais `technicalFacts` gagnait
une forme non demandée : ce défaut est conservé dans la QA
`after/run-2026-09-27T23-45-08-064Z`. Test rouge puis **100/100** vrais parcours
édition/choix/Wizard verts dans `astra4-owned-sheet-verified.log`. Le rejeu final
`after/run-2026-09-28T00-09-00-160Z` garde la fixture exacte et prouve la fiche
inchangée, technicalFacts absent et aucun nouveau diff. Sol a regardé choix stock
et Redo mobile, réouverture desktop. La copie QA sans référence catalogue affiche
« À revalider » dans le conseil : réserve de fixture, hors conseil produit étudié.
Le défaut initial n'était pas une limite CUA ni une assertion masquée.

**Claude05 reçu** : session de commande **20926** terminée exit 0, même UUID natif
`f90e0c16-852c-4914-ad90-86f5021b427b`, Pro Opus5.5 xhigh transmis/observé au
lancement, safe/restricted, aucun autre Claude. Sortie inédite
`claude-frontend-05.json`, [brief ciblé notice](../../work/levure-refonte-realisation-2026-09-27/claude-starter-notice-brief.md).
Éditables copies reçues : YeastStarterEntry (nouveau), YeastSupplyEntry, PitchingPanel,
yeast-pitching.css, DbCorrectionsPanel pour représentation/revue du protocole
uniquement. Gardes asynchrones de Sol conservées. Le report est sans conflit;
stock.id/ref a ensuite été corrigé. La méthode de service manquait dans la copie
Claude mais est maintenant écrite par Luna; types app verts. Handoff
`87532d78-2326-44be-b068-6c6312034cc1` accepté; QA complète reçue dans le run
`after/run-2026-09-28T00-07-59-059Z`. Source protocole manual explicite, aucun gain
cellulaire promis. Les protocoles/sources de cette QA sont synthétiques. Sol a
regardé reçu et refus mobile, plan rouvert desktop; aucun réseau réel ni erreur.

Handoffs UI désormais **completed**, confirmations CLI exit 0 du 28/09 00:21 UTC :
`87532d78-2326-44be-b068-6c6312034cc1` → `claude05-sol-result.json` et ancien
`c33c765a-7ffa-4cc7-a665-e243a9746a84` → `claude01-ui-sol-result.json`. Aucun
autre appel Claude n’est nécessaire pour ces lots.

Prochaine action : corriger et prouver les deux raccords ci-dessus, puis les
soumettre à la même consultation avant bilan final. Commande **9582** terminée
exit 0; `thread.started` confirme le même UUID, nouvelle sortie
`astra-six-fixes-review.md` sans écraser la première revue. Le preview 4181 sert
le build frais (processus 101992), ouvert dans l’IAB; ancien brouillon QA abandonné.
Port 4182 sans listener. Pas de second Sol,
nouvel expert de rituel, données réelles, Performance ou déploiement. Quota :
aucun rejet actuel reçu; si quota réel bloque ce lot frontend nécessaire,
appliquer la pause de mission entière demandée et le réveil unique au vrai reset.

Contrôles du lot après Astra : **4 918 tests / 328 fichiers** et build/types verts
(`post-astra-full-tests.log`, `post-astra-build.log`, `post-astra-functions-types.log`),
mais ce gate précède le dernier correctif de réenrichissement ci-dessus.
Nouveau gate sur cet état : commandes **62127** (tests,
`owned-sheet-final-tests.log`) et **60265** (build,
`owned-sheet-final-build.log`) terminées exit 0 : **4 918/4 918 sur 328 fichiers**,
build TypeScript/Vite/rapport privé réussi. Les garde-fous globaux n’ont pas été
affaiblis. Après ce gate, seule clarification du libellé vendeur : `merchant`
signifie « Source vendeur », sans prétendre « Fiche vendeur lue » depuis la
seule origine; 13 tests du panneau passent (`source-vendor-claim-verified.log`).
Les preuves navigateur de notice et de fiche locale sont reçues et vérifiées.

Le [résultat local](levure-refonte-livraison-2026-09-28.md) récapitule besoin,
preuves et limites. Les sections suivantes conservent les jalons antérieurs;
leur ancien état « en cours » ne remplace pas l’état courant ci-dessus.

## Jalon précédent — gates globaux et premières preuves de parcours

Même Sol, mêmes agents et branche préservés après reprise. Le run final
[full-tests-final.log](../../work/levure-refonte-realisation-2026-09-27/full-tests-final.log)
réussit **4 879 tests / 325 fichiers** (23:36–23:39, heure locale).
[Build final](../../work/levure-refonte-realisation-2026-09-27/final-build.log) et
[types Functions](../../work/levure-refonte-realisation-2026-09-27/final-functions-types.log)
réussis. Les avertissements Vite sur imports mixtes/gros chunks persistent.

Les échecs globaux ont été qualifiés, pas masqués : fixtures de stock complétées
avec confirmation réelle et référence explicite; anciens champs cellulaires testés
sur un record historique; assertions de sources adaptées au rendu actuel avec
conservation des valeurs, unités, URL et dates après save/reopen. Le dernier échec
recipeAutoComplete portait sur une citation devenue partie d’une phrase; 21/21
tests ciblés puis la suite globale réussissent. Aucun changement produit motivé
par ces seules assertions, aucun appel Gemini réel.

Pré-J0 retouché : état et gestes avant notice repliée, libellé du produit pris dans
le snapshot correspondant. 8 tests dédiés et build réussis; QA 390/1280 rejouée
avec ouverture de notice et défilement jusqu’aux sources, 12 captures reçues et
vues par Sol (résumé mobile, étapes, notice desktop, fin de notice mobile), run
`qa/after/run-2026-09-27T21-40-26-891Z`. Création manuelle générique et
corrections DB restent chez la même QA sur fixtures. La revue intégrée de l’Astra existant est
le prochain jalon après ces preuves. Aucun nouveau Claude ni pause quota actuelle.

Sol a joué l’entrée générique sur 3068 sans produit : refus vide avec focus sur
les erreurs, choix au clavier du format inconnu et copie locale. 125 mL et moût
inconnu conservés, ancien lot retiré sans transfert. Écart établi : source manual
intitulée « fiche fabricant », et absence du cache annoncée « pas encore dans la
base ». Retouche limitée : titre/origine réelle sur les liens; copies dites absentes
du catalogue chargé; rétention explique seulement l’effet de son action. Test
discriminant ajouté; QA reprend le build final avant captures génériques.

Deux écarts matériels ont été établis puis corrigés. Le sous-tableau produits/
offres comprimait les colonnes en lettres à 390 px, puis ses résumés d’offre à
1280 px : captures d’échec `21-51-27-028Z` et `21-57-29-728Z` conservées.
L’owner approvisionnement a borné les largeurs, conservé un scroll accessible
clavier/tactile et rendu vendeurs/statuts/prix sur des lignes lisibles. La QA
finale [S1](../../work/levure-refonte-realisation-2026-09-27/qa/after/run-2026-09-27T22-11-07-187Z/manifest.json)
passe à 390×844/1280×900 : 1024 px de table dans 334 px de scroll interne,
défilement clavier, offre lisible, zéro overflow document/requête externe/erreur.
Sol a regardé mobile et desktop, y compris les trois offres CH/DE et leur prix.
L’origine absente du bootstrap est dite « Origine non précisée », sans invention.
Les 4 tests d’intégration ciblés et builds de ce raccord passent.

Le plan enregistré jamais commencé pouvait démarrer à quelques heures du
transfert malgré minimum source 24 h. L’owner ensemencement bloque sous ce
minimum, sans interrompre une exécution déjà commencée ni modifier le stock, et
explique, dans sa fenêtre, la marge insuffisante pour la borne haute; 32 tests et
build verts, plus 11 tests sur le libellé de notice « source relevée le ».
La [QA tardive](../../work/levure-refonte-realisation-2026-09-27/qa/after/run-2026-09-27T22-35-54-357Z/manifest.json)
confirme à 390/1280 : 6 h restantes sous minimum 24 h, pas de bouton de
démarrage; une exécution commencée garde 1/6 étapes et 1 flacon après reprise,
stock inchangé. Sol a regardé refus mobile et exécution desktop; zéro overflow,
erreur ou requête externe.

89 tests UI passent après la correction des libellés sources manuelles :
`manual-source-verified-final.log`. La mesure locale S1 courante dans le manifeste
ci-dessus (20 échantillons par signal et largeur) donne p95 mobile 42,5/43,8 ms,
desktop 34,2/34,1 ms pour volume/SG→comparaison, hors réseau, démarrage froid,
saisie physique et compréhension. Cible p95<200 ms établie **sur ces deux signaux
locaux seulement**; ne pas généraliser à l’application entière.

S1/S2 : le Sol a retiré des affichages la prétention « fiche consultée » lorsque
seules URL et données de réponse IA sont conservées. Valeurs proposées attribuées
à la réponse, liens dits « source citée », dates « date indiquée »; aucun fait,
URL, qualification ni sauvegarde modifié. La première suite ciblée a seulement
échoué sur deux anciennes assertions de libellé pendant les éditions; la suite
après dernière adaptation réussit 110/110 dans
`source-claims-verified-after-edit.log`. L’owner IA a établi que les deux lignes
M20 18–30 °C sont deux faits catalogue bruts, même URL PDF et valeur, mais titres
de fiche différents (« Craft Series » / « Yeast Range, version 10 ») et contexte
absent/Beer. Aucun scalaire ni reprise IA doublé. Sol a rendu titre et contexte
auprès des valeurs seulement quand une citation commune les faisait paraître
identiques. Aucune suppression de brut; l’observation IA 18–28 °C demeure distincte.
Test discriminant rouge avant puis 3/3 après : `s1-source-editions-first.log` et
`s1-source-editions-verified.log`. La [QA M20](../../work/levure-refonte-realisation-2026-09-27/qa/after/run-2026-09-27T22-43-50-538Z/manifest.json)
montre ces deux titres/contextes à 390/1280, un lien PDF commun et une autre
URL produit; Sol a regardé mobile et desktop. La 18–28 IA reste prouvée par
le test et la capture antérieure d’adoption, hors du rejeu M20 focalisé.

À 00:12 Zurich, une source produit préremplie au jour local 28/09 était rejetée
par Date.parse comme future (UTC encore le 27/09), bloquant la saisie générique.
Contrat retenu : jour ISO sans heure comparé au jour civil Europe/Zurich; horodatage
complet reste un instant avec la tolérance existante de 60 s; lendemain refusé.
Helper partagé et UI corrigés, test minuit/lendemain/timestamp + copie locale
**13/13** verts : `swiss-calendar-dates-first.log`. Owner IA raccorde encore les
gardes serveur sur le même helper; la QA poursuit reçus et conflit avec date
explicite du 27/09, puis rejouera le 28/09. Le backend raccordé refuse demain,
accepte le jour CH pour produit et offre à 00:12, 20/20 tests serveur et types
Functions verts selon `corrections-ia.md`; le rendu navigateur de cette date
est confirmé par le [rejeu générique/DB](../../work/levure-refonte-realisation-2026-09-27/qa/after/run-2026-09-27T22-25-40-521Z/manifest.json) :
17 captures 390/1280, zéro overflow, erreur ou requête externe. Produit sans
format/dose/cellules/starter et offre inconnue gardés dans la recette; 1 flacon
et moût 40 L/SG1,050 mesurés après save/reopen hors ligne. La comparaison
inclut les copies. Offer-create sur parent absent : reçu mocké server-confirmed,
targetCreated true, readback refreshed sans auto-adoption. La course CAS suivante
refuse sans perte de draft ni écrasement canonique; second product-create donne
pending sans remplacer le choix. Sol a regardé copie, reçu, conflit et pending.
Les raisons IA attribuent désormais les valeurs
à la réponse et à la source citée sans prétendre le corps archivé/vérifié.

Le footer du reçu montrait encore l’ancien bouton « Ajouter l’offre exacte »
jaune mais désactivé. Retouche après capture : « Fermer » après confirmation,
aucune seconde application. Test rouge avant puis 9/9 verts :
`receipt-footer-first.log` / `receipt-footer-verified.log`. QA visuelle de ce
dernier footer reçue dans le run `22-45-46-636Z`, Sol a regardé mobile/desktop.
Ce rendu montrait toutefois deux lignes identiques « Saisie manuelle · source
commune » : l’URL d’identité de l’offre était comptée comme une citation de fait.
Retouche finale `offer.create` : URL nue non citée comme fait, observation sourcée
gardée avec un lien commun. Test rouge puis 9/9 vert (`offer-citation-dedup-*`),
capture après ce seul changement en cours. Le benchmark scientifique Levure passe,
`yeast-science-final.log` (`failures: []`), sans promesse sensorielle/réseau.
Le panneau d’offre proposait aussi « Origine non précisée » en après alors que
`change.source.origin=manual` : l’URL nue de l’offre masquait cette provenance.
Le rendu `offer.create` garde désormais la source manuelle signée de son
observation et ignore l’URL nue d’identité dans la citation. Test rouge puis
9/9 vert dans `offer-origin-*`; reçu vérifié visuellement avant la dernière
déduplication. Premier gate global intégré : 4 888 pass /
1 échec, `designTokens.test.ts` a refusé `text-cave-300` ajouté à la notice de
marge haute, absent de la palette. Sol l’a corrigé en `text-cave-200`; les
13 tests ciblés design/ensemencement passent. [Rejeu global](../../work/levure-refonte-realisation-2026-09-27/full-tests-release.log)
après ce défaut : **4 889/4 889 sur 326 fichiers**. [Build](../../work/levure-refonte-realisation-2026-09-27/release-build.log)
et types Functions verts. La déduplication du reçu est postérieure à ce gate;
ses 9 tests passent et son build courant est en cours. Aucune publication.

**Limites maintenues** : cause exacte du signal S-04 du 27/09 non établie faute
de réponse sauvegardée; pas de lecture des pages sources prouvée par une URL;
pas d’essai IA réel, déploiement ou validation IME Android physique. Les deux
signaux p95 mesurés localement ne couvrent pas serveur, réseau ni téléphone réel.

## Jalon précédent — création générique reçue, validation en cours

Claude04 terminé/appliqué, même UUID, handoff `8ff7e659-849b-4ff6-aa01-c1dcdcc4c765`
accepté. [Retour](../../work/levure-refonte-realisation-2026-09-27/claude-frontend-04.json.expert.json).
Forms produit/format et offre après recherche, copie locale hors ligne versus
publication par proposition manuelle/revue/reçu séparées. Aucun choix automatique.
Sol a figé les champs durant proposition/revue et conservé le snapshot soumis
pour le choix post-reçu, au lieu de reconstruire depuis un brouillon ultérieur.
Correction d’une copie conserve ses données documentées hors formulaire.
3 tests UI verts : [preuve](../../work/levure-refonte-realisation-2026-09-27/claude04-entry-verified.log).

Backend/service/panneau manuels livrés : expectedMissing/expectedRevision,
append d’offre sans perte, identités contrôlées, source manual et receipt/readback.
29 contrôles ciblés + types app/Functions + build verts selon le rapport Luna.
Fermeture bloquée pendant apply. La signature réutilise le secret configuré
GEMINI_API_KEY sans appel modèle ; aucune rotation/configuration nouvelle faite.
Les tests de transport/backup actuels passent 31/31.

Comparateur S1 final livré : origines et dates par observation, liens communs
regroupés, copies locales absentes ajoutées sans écraser un canonique du même ID.
71 tests et build verts. QA visuelle de ce raccord reste à fermer.
Pré-J0 déjà joué dans le vrai BatchDetailSheet : préparation et 6 étapes,
réouverture, culture 1,2 L distincte du flacon et cellules inconnues. La vérification
de stock était bloquée par adjustNumber absent dans l’adaptateur QA, pas par un
défaut produit établi ; QA ajoute l’équivalent local et rejoue l’idempotence.

**Gate global encore rouge** : le run lancé par Luna a fini 4 855 pass / 18 fail,
dont panneau fermeture/tokens corrigés ensuite. Sortie globale non sauvegardée et
tronquée : huitième fichier inconnu, aucun résultat vert inventé. Sol reprend les
cinq fichiers identifiés (brewFlow/storage/dataEntry/recipeEditing/recipeAiWorkflow)
en commande **92925**, sortie conservée dans
[integration-failures-recovery.log](../../work/levure-refonte-realisation-2026-09-27/integration-failures-recovery.log),
avant attribution/correction et gate global final avec log. Pas de rerun aveugle.

Prochaine tranche : qualifier ces échecs, finir la QA pré-J0/comparaison puis
création générique/corrections DB sur fixtures, compléter handoffs, revue intégrée
par l’Astra existant au jalon demandé et contrôles finaux. Pas de Claude actif à
attendre, aucune pause quota actuelle, aucun déploiement ni travail Performance.

## Jalon après récupération du plantage général

Même fil, branche et fichiers préservés. Claude03 était déjà terminé à 19:46 UTC :
résultat/copies récupérés, aucune relance ni session terminal périmée réutilisée.
Handoff `a7ad6c17-675f-44bb-a85e-3c9c5637e2e1` accepté et preuves actuelles consignées
dans [résultat Sol](../../work/levure-refonte-realisation-2026-09-27/claude03-sol-result.json).
Packs 3/high et 2/ok, dose versus compte nommés, Undo exact, rendu 390/1280 acquis.
Sol a retiré une redite et empêché l’estimation de cellules pour une fraction de
pack sans concentration publiée. 14 tests domaine + 2 UI verts ; SourceDate/URL
de citations : 2 tests verts, chemins/éditions de document restent distincts.
Le reader accepte les qualifications prévues/culture et les anciennes unités
implicites de taux v1 ; refuse qualification inconnue ou unité explicitement fausse.

Comparateur raccordé : 69 tests et build verts ; format/offres visibles même
sans moût, aucun OG final/taux/lot/quantité transplanté. Erreurs intermédiaires
du build QA gardées et corrigées par l’owner, pas attribuées à Claude03. Une
retouche S1 d’origine/citations/dates reste chez Luna approvisionnement. Panneau
DB S1 reçu : 219 tests/11 fichiers verts sur l’état intégré, sans JSON brut.
Pré-J0 réel reste en cours chez la même QA ; aucun nouveau chat ni déploiement.

### Manque générique établi et contrat de réalisation

Sans produit initial, l’UI ne permettait ni création ni sélection d’un produit
exact ; saveYeastProduct n’avait aucun caller. Un nom personnel ne remplit pas
ce contrat. Retenu : finir cette entrée générale, sans étendre la liste de souches.

Invariants : identité référence→produit→offre explicite ; IDs créés une fois et
conservés ; format/cellules/dose/protocole inconnus non inventés ; source manual
signalée sans lecture/véracité serveur prétendue ; stock/livraison/prix/pays ont
leurs observations/sources/dates. Copie de recette hors ligne et publication
canonique séparées ; aucune adoption automatique après reçu. Écriture canonique
par proposition manuelle signée, revue/apply, expectedMissing/expectedRevision,
audit/reçu/readback ; conflit garde le draft et les autres offres. Sources brutes,
quantités manuelles, moût et snapshots préservés. Refus : variante copiée depuis
une autre référence, source manuelle présentée comme primaire vérifiée, faux
serveur-confirmé, upsert qui remplace silencieusement un document ou ses offres.

Luna IA étend uniquement types/callables/service/panneau existants pour produit
et offre manuels, sans Gemini imposé. Contrat confirmé : proposeProductCreation,
proposeOfferCreation, apply existant et initialProposal sur panneau. targetCreated
désigne le parent, entityCreated l’entité logique. Frontend sera confié au même
Claude dans Panel/CSS et un nouveau composant préparé, après stabilisation des
types ; [brief](../../work/levure-refonte-realisation-2026-09-27/claude-generic-supply-brief.md).
Aucun nouveau modèle ni architecture parallèle. La mission entière reste ouverte.

## Reprise effective après reset — décision de qualité

Avis Astra 3 retenu, contrôle unique QA reçu : build courant, recherche/choix,
adoption réversible de 2 packs et sources après save/reopen passent à 390/1280.
[Rapport et captures](../../work/levure-refonte-realisation-2026-09-27/qa/qa.md).
QA n’a pas constaté de besoin Claude sur ces trois états ; p95, DB et pré-J0
restent hors de cette qualification. Deux observations fabricant identiques
sont visibles dans la fixture : réserve data, pas identité confondue déduite.

Sol a regardé les captures puis joué **la borne haute de cette même plage**,
car le feedback initial portait sur la quantité de packs versus la masse :
3 sachets de 11,5 g adoptés sur repère 20–32 g → badge vert « Dans le conseil »
alors que la lecture secondaire indique 34,5 g, au-delà du repère haut de 2,5 g
si tout est versé. Le badge ne précise pas qu’il ne qualifie que le compte de
packs. Ambiguïté effectivement observée dans le navigateur Codex, pas défaut
déduit d’une seule règle CSS :
[constat de borne haute](../../work/levure-refonte-realisation-2026-09-27/qualification-claude02/upper-pack-boundary-sol.json).

**Décision : apport précis du même Claude justifié**, selon la condition donnée
par Astra. Le reset étant passé, pas d’attente artificielle ni nouveau Sol.
Lot frontend03 dispatché, même UUID `f90e0c16-852c-4914-ad90-86f5021b427b`, seulement
YeastPitchingPanel/CSS sur copies pour clarifier badge, dose et capacité et finir
les styles utiles. [Brief borné](../../work/levure-refonte-realisation-2026-09-27/claude-frontend-finish-brief.md),
commande **20272**, original/copies conservés dans `claude-frontend-03.json.artifacts`.
Modèle natif `claude-opus-5-5` et même UUID confirmés ; xhigh transmis, pas champ
indépendant d’effort exposé. Événement natif : quota **allowed**, overage rejeté
au niveau organisation, `isUsingOverage=false`. Aucun appel diagnostic ni API.
Réveil ponctuel `reprise-levure-apr-s-reset-claude` désactivé après cette reprise,
en conservant ses autres champs, pour éviter une relance devenue inutile.

La réalisation normale reprend : Luna approvisionnement réutilisée sur le
raccord du comparateur existant et un hook supply, hors Panel/CSS Claude ; Luna
IA réutilisée sur la lisibilité S1 du panneau DB et la qualification d’un chemin
générique sans produit bootstrap, sans modifier le choix produit occupé.
Pré-J0, corrections DB jouées, transports et validation intégrée restent ouverts.
Aucune livraison entière déclarée, aucun déploiement.

## Réconciliation de la pause demandée — 27/09 vers 21 h 08

L’utilisateur a précisé qu’une attente utile à la qualité est encouragée, mais
qu’une pause automatique faute de rapport final ne suffit pas. Il a autorisé
une qualification proportionnée des copies, puis un **mini échange unique avec
l’Astra existant**, borné à la décision de pause. Aucune reprise générale acquise.

Les sept copies frontend02 ont été comparées aux inputs archivés et récupérées
après vérification SHA et absence de conflit sur les sept sources. Originaux,
diffs et inventaires conservés dans
[qualification-claude02](../../work/levure-refonte-realisation-2026-09-27/qualification-claude02/).
Un raccord mécanique a retiré une comparaison TypeScript avec une clé impossible
`culture` ; **type-check application réussi** ensuite. Contrôle des deux fichiers
UI affectés : **76/83 passent, 7 échecs conservés**. Ils concernent casse/texte des
diffs (2), lecture/placement ancien du groupe quantité (4), ancien calcul cellules
sans produit/moût qualifiés (1) ; aucune assertion modifiée à ce stade. Les lectures
nouvelles sont présentes dans le code, leur rendu reste à qualifier.

Luna QA est réutilisée uniquement pour ce contrôle de rendu/gestes 390/1280,
sources après adoption/réouverture et packs/capacité, avec mocks existants. Son
ancien run interrompu était la commande 73337 ; point de reprise reçu. Aucun
nouveau lot d’implémentation, campagne générale ou appel Claude lancé.

Consultation unique dispatchée via le profil astra-review actuel, lecture seule,
hooks désactivés, même UUID `01a0dee4-e39d-7f92-8596-7167d5dff84b`, commande 61881.
[Paquet compact](../../work/levure-refonte-realisation-2026-09-27/astra-pause-handshake-brief.md) :
quota réel, récupération, preuves, manques UI/raccords/pré-J0/DB et responsabilités.
Verdict reçu : **3 — terminer le seul contrôle déjà confié à Luna QA**.
[Avis court](../../work/levure-refonte-realisation-2026-09-27/astra-pause-handshake.md).
Retenu : quota, rapport absent et finition CSS ne suffisent pas à justifier
l’attente. Si la tranche révèle une ambiguïté de composition, de commande ou de
provenance, le même Claude apporte une correction/revue précise ; sinon intégrer
normalement les copies sans signature finale. Les raccords supply/DB/pré-J0
restent aux owners existants et ne prouvent pas une réécriture UI nécessaire.
Le verdict ne valide pas la livraison entière. QA informée ; décision finale
de pause encore ouverte jusqu’à ses preuves. Aucun second échange Astra lancé.

Qualification des sept assertions faite dans le périmètre autorisé par cet avis :
**7/7 passent** avec le gate d’entrées normal, preuve
[seven-assertions-verified-final.log](../../work/levure-refonte-realisation-2026-09-27/qualification-claude02/seven-assertions-verified-final.log).
Les 76 autres étaient réussies au contrôle initial et sont sautées dans ce rerun,
pas présentées comme une nouvelle suite complète verte. Lecture absence/zéro/négatif
vérifiée près de l’éditeur de station 2, avertissement hors détails ; diff conserve
borne et URL dans son lien lisible ; scénario conserve moût inconnu et ne présente
plus le taux sans produit/moût qualifiés. Les tentatives intermédiaires du test
Workbench (mauvais libellé/emplacement de contrôle supposé par Sol) restent dans
les logs ; aucun défaut produit déduit de ces erreurs de sonde.
À 21 h 20 min 51 s, le reset annoncé est passé ; cela ne prouve pas un quota à 0 %.
Pas d’appel Claude relancé pendant l’attente du constat QA qui tranche son utilité.

Identité Astra confirmée dans `thread.started`, commande 61881 terminée exit 0.
Nuance runtime : `--disable hooks` était transmis, mais stderr signale encore
un échec `after_agent/legacy_notify` (nom de fichier trop long). Ne pas présenter
le flag comme une désactivation effectivement observée ; aucun diagnostic ou
chantier de hooks ajouté à cette mission.

## Pause effective — quota Claude, 27/09 à 19 h 54

**Toute la mission est en pause**, selon la consigne utilisateur. La correction
Claude reste nécessaire au résultat demandé. La commande native `46296` est
terminée avec code 1 : `quota_reached`, API 429, message
« You've hit your session limit · resets 9:20pm (Europe/Zurich) ».
Reset confirmé : **27/09/2026 à 21 h 20 Europe/Zurich (19 h 20 UTC)**.
Aucune poursuite d'implémentation, revue ou test pendant cette pause.

Un seul réveil ponctuel a été créé et confirmé par l'outil de l'app :
`reprise-levure-apr-s-reset-claude`, **21 h 21 Europe/Zurich**, destinataire
Sol `01a0e37a-f9ca-7603-b336-68aa82d4b312`. Il reprend ce chat, sans nouveau Sol
ni Claude parallèle. Les automatisations du contrôleur et de l'ancienne mission
ne sont pas modifiées. Aucun crédit supplémentaire ni repli API activé.

### Travaux conservés et reprise précise

- Claude natif inchangé : `f90e0c16-852c-4914-ad90-86f5021b427b`, Opus 5.5 ;
  xhigh transmis. Résultat, transcript, copies et manifeste de récupération dans
  [claude-frontend-02.json](../../work/levure-refonte-realisation-2026-09-27/claude-frontend-02.json)
  et ses fichiers `.recovery.json` / `.artifacts`. Pas de rapport final validé
  pour ce lot : récupérer et examiner les copies avant toute régénération.
- Luna QA `parcours_qa` avertie puis interrompue. Script/captures conservés ;
  dernière série dans `qa/after/run-2026-09-27T17-53-55-935Z`. Aucun processus
  Node `check-yeast-refonte-ui.mjs` actif observé au contrôle d'arrêt. Son rapport
  écrit reste au jalon avant ; reprendre l'agent pour le bilan réel du jalon après.
- Luna IA terminée : 216 tests sur 11 fichiers, build web et types Functions
  réussis, sans Gemini réel. La floculation scalaire devient une observation
  sourcée adoptable sans catégorie inventée. La réponse du 25/09 ne prouve pas
  la cause exacte de la capture S-04 du 27/09 : réserve maintenue.
- Luna approvisionnement terminée : helper `compareYeastSupply` et 4 tests,
  build réussi. Son raccord au comparateur volontaire sous le même moût qualifié
  reste ouvert ; aucune quantité, association stock ou hypothèse propre copiée.
- Luna ensemencement terminée : 118 tests sur 11 fichiers et build réussis.
  Rendu jour J acquis à 390/1280 ; préparation pré-J0 testée en intégration,
  rendu navigateur encore ouvert. Les étapes sans heure restent une checklist.

Après le reset : relire ce jalon, diff et agents ; récupérer le lot Claude 02,
reprendre le même Claude seulement sur les manques restants, puis intégrer et
éprouver S1/S3, offres/comparaison, corrections DB, starter avant J0 et sauvegarde.
Les 10 échecs UI précédents ne sont pas déclarés corrigés sans nouveau contrôle.
Revue intégrée avec la consultation Astra existante au jalon prévu. Aucun
déploiement autorisé ; les trois modifications préexistantes restent protégées.

## Dernier feedback utilisateur — Sources/Autocomplétion (27/09)

[Revue et captures originales](levure-sources-autocompletion-revue-2026-09-27.md)
intégrées au mandat entier. S-04, floculation et phénols sont des témoins, pas
des règles produit ou une liste de champs. Les deux images distinctes ne prouvent
pas une confusion d'identité. Dose/pitchRate existe déjà et son traitement reste
dans le lot pitching, aucune réouverture d'un chantier dosage.

| Critère / zones | Décision et owner actuel | Preuve restante |
|---|---|---|
| S1 : fiche, proposition, conflits, comparaison, différences, récap, après sauvegarde | Retenu. Claude reprend le même lot et UUID pour données/changements lisibles, sources communes regroupées sans perdre rattachement/conditions/dates. Sol fournit captures et exports actuels seulement. | Inventaire bref des zones examinées avec conservé/modifié et motif ; rendus 390/1280 et gestes |
| S2 : document trouvé/lu → extraction/traduction → validation/adoption → affichage/correction → save/reopen/transports | Retenu. Luna corrections IA réutilisée sur data/fixtures ; UI réservée à Claude ; Sol intègre. Catégorie absente ne supprime pas description qualitative, aucune catégorie inférée. | Cause de chaque perte établie sur réponse/page sauvegardée, correction et test discriminant |
| S3 : toutes connaissances utiles déjà représentées et nouveaux besoins justifiés | Retenu. Réutiliser pof/esters/higherAlcohols/pitchRate et autres clés. Luna inventorie représentation/édition/transports ; Claude organise accès utile à choisir/conduire/préparer. | Couverture par famille/propriété et états, autre fabricant/langue/forme et absence réelle ; pas campagne par souche |

Les valeurs manuelles, origines, conflits et réponses périmées restent des contrats.
Un résultat de recherche ou une URL valide n'est pas preuve de lecture/extraction
complète. Aucun essai Gemini réel lancé, aucune écriture de test sur données réelles.

## Jalon UI reçu et premiers contrôles

Claude frontend01 reçu/appliqué, handoffs acceptés par le même Sol. App types verts
après raccord getStocks.rawMaterials, target.context et statut server-confirmed.
Réalisation A reçue ; A et B réellement jouées au même périmètre sec/liquide :
[essai Sol](../../work/levure-refonte-realisation-2026-09-27/concepts-essai-sol.md).
A retenue provisoirement, reste à éprouver le vrai rendu complet. 94 tests UI
réussis /10 échecs sur104 : source citation corrigée par Luna, casts de fixtures
et assertions de placement/calcul ancien à traiter ; pas de clôture sur ce compte.

Luna IA a livré210 tests/10 fichiers, types Functions et build réussis, sources
brutes et overlay distincts. Nouvelle suite S2/S3 ouverte dans le même agent.
Sol a validé12 tests de journal serveur, unité/nature/quantité réelle cohérentes.
Première capture réelle après390 montre référence XL sans format inventé et offre
hors stock. QA reprend l'autre tranche sans transférer la quantité d'une souche
à une autre : manuel saisi pour la nouvelle identité puis conservé par le conseil.

Retour rendu retenu : manuel produit/conseil conservé, mais adoption de3 packs
et masse au-dessus du repère doivent être expliquées sans contradiction. Retour
méthode retenu :24–36h décrit une fenêtre de culture, pas tout le travail.
Checklist ordonnée sans horaires intermédiaires inventés, début indicatif ou
volontairement plus tôt ; activation/refroidissement et contrôles restent visibles.
Type/domain en cours de raccord au renderer dans la correction Claude ciblée.

Pour la suite Claude : pont natif étendu `--resume UUID`, testé avec son cadre
safe-mode/restricted inchangé, pour reprendre f90e0c16-852c-4914-ad90-86f5021b427b
sans autre Claude ni relecture du dossier entier. Nouveau paquet centré sur
exports/erreurs/captures et feedbacks S1/S3 ; original et copies conservés.

## Réalisation active — 27 septembre 2026

Pilote unique : session `01a0e37a-f9ca-7603-b336-68aa82d4b312` (mandat Sol Max).
Branche/HEAD vérifiés : `codex/levure-refonte` / `5a49cc51ba4d37ef4300e6404c0c989d22d10425`.
Préparation ci-dessous conservée comme historique. La nouvelle session est autorisée
à concevoir et implémenter toute la refonte ; aucune publication n'est autorisée.
Modifications préexistantes : PRODUCT.md, scripts/check-nolo-wizard-apply.mjs,
tests/integration/monkey.test.tsx et artefacts non suivis, à préserver.

### Résultat observable et refus

Trouver directement une référence, choisir volontairement produit/format/offre ou lot,
comprendre ses effets documentés dans la recette, régler les Paliers communs,
distinguer conseil et prévu, préparer avant J0 puis confirmer le réel, enregistrer
et rouvrir hors ligne. IA : compléter/corriger même une valeur DB avec portée,
provenance et conflit explicites. Recette incomplète, import/export et brassin figé
restent utilisables. Le pitch rate ne suffit pas à ce résultat.

Refus : disponibilité déduite du laboratoire ou offre périmée, homonyme assimilé
à lot lié, quantité/cellules/viabilité inventées, manuel écrasé, sucre tardif inclus
sans distinction dans le moût à ensemencer, starter universel, programme spécialisé
perdu, réponse IA périmée appliquée ou brouillon présenté comme confirmation serveur.
Les choix de composition, composants et stockage interne restent remplaçables.

### Tranche et responsabilités

Tranche : référence sans offre confirmée → recherche/choix direct → format/offre
datés et lot explicitement lié → manuel conservé → moût renseigné → conseil/packs
justifiés → conduite/Paliers → sauvegarde/réouverture hors ligne ; bifurcation
liquide sourcée → préparation avant J0 → réalisé/snapshot. Correction concurrente
refusée sans perte. Vérifier 390×844 et 1280×900 et un contre-exemple hors fixtures.

- Sol : contrats partagés, intégration Wizard, transports, registre et preuves.
- Astra : reprise de consultation `01a0dee4-e39d-7f92-8596-7167d5dff84b`, frontières
  et inconnus depuis les avis acquis, puis revue du jalon intégré. Envoi ≠ réception.
- Luna approvisionnement : sources vendeurs actuelles et bootstrap dédié ; ownership
  work/levure-refonte-realisation-2026-09-27/approvisionnement.md et
  src/data/yeastSupplyBootstrap.json. Aucune édition de types avant contrat transmis.
- Claude : lot frontend sur copies à préparer après contrat et captures actuelles,
  deux directions comparables puis réalisation/correction ; un seul processus.

Preuves/avis actuels : passation réutilisée ; aucune capacité nouvelle encore validée.
### Jalon modèle et préparation frontend

Avis Astra reçu : [conception](../../work/levure-refonte-realisation-2026-09-27/astra-conception.md).
Retenus : `qty/unit` unique, enveloppe pitching optionnelle, qualifications physiques
par grandeur et ordre avant/après des ajouts, produit/offres canoniques réutilisables
dans `yeastProducts`, copie choisie et snapshot distincts, exécution dans le brassin
planifié, Undo de souche préservant correction physique indépendante. Corrections
catalogue en surcouche sourcée : hashes de collecte bruts conservés. Aucun avis
matériel écarté. Vérification du résultat intégré encore ouverte.

Réalisé par Sol : schema commun `yeastSupplySchema`, logique `yeastPitching`,
types optionnels, repository/backup/règles template, transport texte/import et refus
d'une enveloppe opérationnelle générée non adoptée. Homonyme stock Levure non lié
signalé non vérifié. Tests discriminants : **10/10** dans
[pitching-tests.log](../../work/levure-refonte-realisation-2026-09-27/pitching-tests.log),
dont moût avant/après, packs sans format universel, conseil périmé, Undo physique,
starter avant J0, backup/texte/snapshot. Ce résultat n'est pas encore preuve UI.

Luna approvisionnement : 7 produits / 8 offres sourcés au 27/09, formats inconnus
conservés, FR non livrable et DE livrable CH distincts, Wyeast XL non assimilé à
Activator. [Rapport](../../work/levure-refonte-realisation-2026-09-27/approvisionnement.md).
Bootstrap validé et références catalogue contrôlées. Liste non exhaustive.

Luna ensemencement réel : domaine/consommation/guide/BrewDayPage et
BatchDetailSheet ; quantité réelle/confirmation et préparation avant J0 en cours.
Luna corrections IA : nouveau flux ciblé/schema/callable/service/panneau,
surcouche documentaire catalogue et lecture effective ; fichiers de responsabilités
conservés dans les briefs/messages de cette session. Ne pas modifier ces lots en
parallèle. Luna QA : script `check-yeast-refonte-ui`, captures avant 390×844 et
1280×900 examinées ; [rapport QA](../../work/levure-refonte-realisation-2026-09-27/qa/qa.md).
Sol a joué recherche Voss et choix direct sur navigateur Codex local isolé,
homonymes distincts et aucun comparatif imposé. Nouvelle UI encore non intégrée.

Runtime observé de cette vraie session : journal natif `gpt-6-sol`, effort `max`.
Astra reprend le même UUID via profil astra-review ; configuration Astra Max
et fenêtre isolée documentées, cette réponse reçue. Les Luna natifs ont rôle
Luna/GPT-6 Luna Max. Claude : dry-run authentification `claude.ai`, abonnement
`pro`, destinataire Sol exact confirmés ; modèle/effort demandés Opus5.5/xhigh,
**aucun lancement modèle effectué** à ce stade.

Le guide `claude-expert` impose vérifier les crédits supplémentaires avant un lot
susceptible de dépasser Pro. **Attente levée** par la preuve native récente du
27/09, frontend-02.json.artifacts/transcript.jsonl : dernier rate_limit_event,
`overageStatus=rejected`, `overageDisabledReason=org_level_disabled`,
`isUsingOverage=false`. Mesure réutilisable selon le guide, reçue via la coordination
autorisée du fil source. Le navigateur courant n'est pas connecté à Claude Usage,
mais ce n'est plus un prérequis. Aucun crédit/API n'est activé. Ne pas déduire le
quota actuel de ce relevé antérieur au reset13:50. Lot frontend concret dans
[brief](../../work/levure-refonte-realisation-2026-09-27/claude-frontend-brief.md),
copies/ownership et lanceur dry-run validés ; **lancement de réalisation dispatché**,
modèle effectif/réponse à vérifier dans ses nouveaux artefacts. Les fichiers `YeastPitchingPanel`, CSS
et `concepts.html` sont des supports non intégrés, pas des capacités livrées.

Prochaines actions : finir/réceptionner les deux lots Luna, vérifier et intégrer,
recevoir Claude, rendre/jouer deux directions puis
tranche réelle et extension, revue Astra sur résultat intégré. Aucun déploiement.

### Feedbacks matériels et état actuel des preuves

| Retour | Décision | Correction | Preuve / état |
|---|---|---|---|
| Astra : données et quantités ne partagent pas la même autorité | Retenu | Schema optionnel, qty/unit unique, canonique hors recette et snapshots | Schema/domain/51 tests ; UI à éprouver |
| Astra : moût pré-pitch, mesure non soustraite deux fois, J0 ambigu | Retenu | Qualifications propres, additions avant/après explicites, estimation dédiée | Tests avant/après et mesure conservée, hors fixtures historiques |
| Astra : Undo doit préserver correction physique indépendante | Retenu | Helper et raccord choix/Undo | Test domaine ; relecture UI intégrée ouverte |
| Luna : prix ancien peut coexister avec stock/livraison actuels | Retenu | priceFresh/priceLabel indépendants | Tests supply verts ; badge visuel à éprouver |
| Luna : cellules sans qualificatif pouvaient devenir un point exact | Retenu | Qualificatif cellules obligatoire, bornes/approximation sans packs exacts | Test négatif reader/evaluator, suite19 tests puis51 avec transports |
| Passation : qualificatif dose perdu | Retenu | dose.qualifier, borne massique transportée sans point/packs fictifs | Test dose bornée dans suite51 |
| Sol : zéro cellules mesurées ne couvre pas un besoin malgré un pack détenu | Retenu | Disponible/solde explicites, compra calculée sur cellules connues | Test lot mort et mesure locale dans suite51 |
| Sol : ordre de clés/attribut sans effet peut périmer un plan à tort | Retenu | Contextes sémantiques et base extraite des entrées physiques utiles | Test ajouté ; dernière tentative bloquée avant exécution par gate input du lot IA en cours |
| Gate input : form autocomplete et textarea du panneau IA | Retenu | Confié au propriétaire du panneau, pas de contournement | Correction/rerun à recevoir |
| Raccord types : contrat UI ne doit entraîner runtime/stdlib serveur Node | Retenu | Extraction demandée des types partagés purs | Rerun typecheck app/Functions à recevoir |

Claude natif démarré : session `f90e0c16-852c-4914-ad90-86f5021b427b`, modèle
`claude-opus-5-5` observé dans system/init ; xhigh transmis via CLI et environnement,
pas de champ d'effort indépendant exposé dans cet init. Copies/archives inchangées.
Si son quota bloque alors que son lot reste nécessaire, la dernière instruction
utilisateur prime : sauvegarder, **mettre toute la mission en pause**, interrompre
les travaux actifs proprement et programmer un unique réveil au reset confirmé
vers cette session Sol. Aucun remplacement de son lot ni poursuite indépendante
pendant cette pause, aucune supposition de quota remis à0. Aucun quota bloquant
n'a encore été constaté ; aucun réveil ajouté.

## État de reprise de la future session

Préparation terminée après publication de poc, sans implémentation de la refonte.
Source publiée : **b09af85**, Firebase `brasserie-l-affinee`,
https://brasserie-l-affinee.web.app. poc sert de référence fonctionnelle « main v2 » ;
main n'est ni renommée, ni remplacée, ni forcée. Future branche :
**codex/levure-refonte**, depuis le commit contenant cette passation.
Sa référence Git donne le commit de base exact, sans hash autoréférentiel dans ce fichier.

La prochaine session Sol Max lit AGENTS.md, docs/openai-setup.md,
[la mission actualisée](../prompts/refonte-levure.md), ce registre et le
[prompt autonome](../prompts/reprise-levure-refonte-2026-09-27.md).
Elle utilise les rôles/profils actuels et Astra dès les nouvelles hypothèses,
pas les anciens chiffres de fenêtre ni une nouvelle reprise générale du dépôt.
Aucun deuxième Sol ou thread de réalisation n'a été lancé ici.

## Publication de la base

- Checklist DEPLOY verte : types application/Functions, build, règles, unités,
  brassage, eau, prompts, **4 783/4 783 tests dans 313 fichiers**.
- `npm run deploy`, commande 17797, sortie 0 : règles/index, 33 Functions Node 22
  `europe-west6`, Hosting 141 fichiers. Source applicative propre.
- Production publique : 15 GET HTTP 200 avec empreintes identiques au build,
  aucun accès authentifié à la DB ni écriture de test. Release `1790519594676000`,
  version `f86f0b7e11ad883d` ; précédente `1790360461140000`/`db3fcb92893a8313`.
- [Rapport, surfaces et retour arrière](../../work/ux-mobile-poc-2026-09-25/review/deploy-final-2026-09-27/release-result.md).
  Les actifs publiés comprennent tous les parcours intégrés, pas uniquement la levure.
- La rotation de la clé reste une opération distincte préparée, non exécutée.

## Matrice complète : état réel et décisions

| Exigence | Acquis prouvé à préserver | À compléter/corriger ou décider |
|---|---|---|
| Offres/format/distribution/livraison | Recherches datées, preuves produits du chat,5hôtes suisses vérifiés, catalogue≠stock | Pas de lien durable référence→produit/variante→offre→lot. Formats structurés, prix/devise/base, livraison et fraîcheur manquent. CH puis FR/DE puis Europe à couvrir sans inférer disponibilité du pays. |
| Recherche/identité/choix | Index nom/code/labo/alias, homonymes et refsstock distincts, stock/libre, choix direct/Undo, vide compact | Ajouter offres sans porte obligatoire. Penurie du Wizard peut encore utiliser un homonyme unique par nom : couverture exclusivement par référence non acquise. Proposer association, pas certifier un stock sans confirmation. |
| Comparaison/possibilités dans recette | Volontaire, référence fixe, types/plages/bornes/inconnus/sources ; essai de conduite séparé | Comparaison achat→format→dose→préparation→sorties estimables pas complète. Hypothèses communes, identité vs alternative, effets documentés seulement. |
| Objectif/conduite/Paliers | Objectif facultatif, programmes/phases persistés, jours cumulés/durées,0/inconnu, toucher/clavier, lager/NOLO | Guides bornés, pas optimum universel. Étendre par propriétés/conditions et préserver suppressions volontaires ; aucune durée biologique ou intensité inventée. |
| Dose et unités | Plage sèche fabricant g/hL→g ; besoin cellules si taux/volume/SG explicitement fournis ; qty/unité manuelles persistées | Packs entiers/surplus, modèle produit/format/lot, données de viabilité structurées. Définir **moût au moment d'ensemencer**, pas OG incluant des ajouts tardifs. Qualificatif de dose et provenance du taux à transporter. |
| Préparation/starter/jourJ | Recette figée, guide au volume mesuré, override quantité réelle dans additions['yeast'].amount | Plan starter avantJ0 absent, méthodes/conditions/échéances/statuts/révision manquent. ActualAmount retombe sur prévu ; recordPitch confirme heure/température sans quantité, ligne absente si prévu0/inconnu. Traiter historiques incomplets. |
| Gemini fiche/recette | Faits/notes typés, namespaces catalogue/local, réponses obsolètes refusées, conflits/validation partielle, sourceM20 racine refusée, origineIA conservée | Correction du lien seul avec origine conservée reste contrat à exercer. Validation syntaxique d'URL≠vérité factuelle. Pas de transplantation quantité/stock/hypothèse entre candidats. |
| Gemini catalogue/offre/stock et DB | Propositions avant/après et transactions pour cibles recette/journal/brassin ; sync a des états | Cibles catalogue/offre/stock avec identité/révision/conflit/audit/reçu non réalisées. Compléter sans prétendre qu'un chat ou brouillon est une écriture serveur confirmée. |
| UX/performance/horsligne/transports | Vrai Wizard390/1280, gestes/save/open, imports/exports/documentation et snapshots, NOLO spécialisé | Étendre contrats aux offres/préparations ; mesurer performance p95cible200ms, clavier/IMEphysique non prouvé. Richesse utile/détails accessibles, pas clôture sur compteur de tests/viewport. |

## Obsolète : ne pas recréer ces défauts ou règles

- Départ main synchronisé, branche yeast-ui-refactor, fenêtre Astra272000 et rôles
  copiés : remplacés par base publiée/passation et sources canoniques.
- Comparaison/application obligatoires pour choisir : remplacées par choix direct,
  comparaison/objectifs facultatifs, application explicite des essais concernés.
- Ancienne composition, double champ vide, sources/forme/points répétés, valeur
  de graphe sous poignée, perte de fiches/persistance/provenance IA : corrigés et
  preuves conservées, pas besoins encore ouverts par ancienneté.
- BrewingMath.pitchRate (150Md/sachet, arrondi proche, starter après3sachets) :
  résidu sans appel de production trouvé ; ne pas l'utiliser comme nouveau moteur.
- Offres24/09 et statut fabricantlisted : ni stock actuel, ni preuve de livraison.
- P95<200ms, viabilité d'âge et starter universels : objectifs/inconnus, pas acquis.

## Avis reçus et traitement

[Astra complet](../../work/levure-refonte-preparation-2026-09-27/astra-result.md),
[delta après Luna](../../work/levure-refonte-preparation-2026-09-27/astra-delta-result.md),
[Luna disponibilité](../../work/levure-refonte-preparation-2026-09-27/availability-audit.md),
[Luna dose/starter](../../work/levure-refonte-preparation-2026-09-27/pitch-starter-audit.md).

Retenus : périmètre complet, frontières de données, moût d'ensemencement,
conseil périmé si ses entrées changent, fallbackstock non validé par la réserve
homonymes antérieure, quantité réelle partiellement acquise, plan préJ absent.
Pas de correction produit dans cette préparation : ces décisions alimentent la
future conception et ses preuves. Aucun avis écarté pour préserver l'organisation.

## Ordre proposé et tranche de refus

Définir références/produits/formats/offres/lot et conseil/prévu/préparation/réel avec
Astra, règles applicables et inconnus avant UI coûteuse. Concevoir avec Claude un
lot frontend utile, puis éprouver une tranche complète avant généralisation :
recette incomplète/référence sans offre locale→alternative au format/offre datés→
non-livrable et lot homonyme distincts→choix direct→manuel conservé→volume/densité
complétés→conseil justifié→conduite→save/reopen hors ligne ; starter liquide
applicable avantJ0→réalisation→snapshot. Correction concurrente refusée sans perte.
Choisir par propriétés hors des dernières fixtures ; aucune campagne par style.

## Outils, owners, preuves et limites de reprise

Même Sol `01a0d7d8-5de3-77f3-b933-c8c98724176b` pour release/passation. Astra
`01a0dee4-e39d-7f92-8596-7167d5dff84b` via profil astra-review actuel, lecture seule,
Max et 400 000 tokens utiles observés dans ses journaux ; commandes 16718/65965
terminées avec sortie 0.
Luna identité disponibilité et Luna conduite dose/starter : natives réutilisées,
Max configuré, modèle/effort/fenêtre effectifs non exposés. Aucun agent actif restant.
Docs mission/registre/prompt : Sol. Aucun auteur de sous-tâche présenté comme
validateur indépendant de son propre travail.

Configuration main/PR18 : copies/sauvegardes locales et manifeste dans le dossier
release, contenu privé hors des commits. Les fichiers canoniques strictement
identiques à origin/main sont repris pour une branche autonome ; les différences
personnelles/tiers restent récupérables sans écrasement. Le lecteur ne charge pas
les instructions privées Claude. Ancien prompt sauvegardé avant actualisation.

Rôles/profils et premières dépendances conservés au commit `4575a94` ; les
13 guides/outils complémentaires sont au commit `d7e015e`, après comparaison
exacte à `origin/main` (`87b076a`) hors fins de ligne, sans écrasement du contenu.
[Manifeste de ce complément](../../work/levure-refonte-preparation-2026-09-27/canonical-tools-completion.json).
Les changements tiers de PRODUCT.md et les deux différences de fins de ligne
des contrôles existants restent hors des commits de passation.

Prochaine action : créer la nouvelle session Sol Max sur la branche préparée,
reprendre les décisions ouvertes avec Astra, puis réaliser. Le déploiement de base
ne vaut ni acceptation d'une future conception ni autorisation de publication.
