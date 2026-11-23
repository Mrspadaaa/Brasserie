# Refonte Levure — résultat local du 28 septembre 2026

**Livraison locale terminée. Les six réserves matérielles sont levées** par la
même consultation Astra : [verdict final](../../work/levure-refonte-realisation-2026-09-27/astra-lookup-ingress-review.md).

**Publication réalisée après autorisation** : [application en ligne](https://brasserie-l-affinee.web.app).
**Mise à jour combinée avec performance** : e04b856/c289115 intégrés sans perdre
les corrections Levure; release1790572600724000/versionc0ddae8d3a37f642,
index-CwJDPg0z.js.4 945tests verts et146assets vérifiés en ligne. [Preuves du report](../../work/levure-refonte-realisation-2026-09-27/performance-integration-2026-09-28/RESULT.md).

Publication précédente de refonte seule :
Règles/index, 35 Functions et interface publiés; 145 fichiers contrôlés en ligne
concordent avec le build. [Rapport de publication](../../work/levure-refonte-realisation-2026-09-27/deploy-2026-09-28/release-result.md).
Branche `codex/levure-refonte`, base `5a49cc51ba4d37ef4300e6404c0c989d22d10425`.
Modifications locales publiées sans commit/push. Aucune écriture de test sur les données réelles.

## Résultat utilisable

| Besoin | Résultat et preuve |
|---|---|
| Choisir immédiatement ou comparer | Souche choisie sans produit/offre obligatoire; comparaison volontaire de variantes exactes avec format, vendeur, prix, disponibilité et livraison datés. Identité visible après scroll mobile. [Parcours et captures](../../work/levure-refonte-realisation-2026-09-27/qa/qa.md). |
| Ajouter un produit ou une offre absents | Saisie générique, inconnus conservés, copie recette hors ligne; proposition canonique, revue, confirmation/reçu et choix volontaire séparés. Refus CAS sans perte du brouillon. [QA produit/offre](../../work/levure-refonte-realisation-2026-09-27/qa/after/run-2026-09-27T22-49-48-336Z/manifest.json). |
| Distinguer conseil, quantité et packs | Quantité manuelle conservée; dose source avec unité, plage ou borne et provenance. `>`/`<` distincts de `≥`/`≤`; aucun pack exact déduit d’une borne. [Avis et tests dose/packs](../../work/levure-refonte-realisation-2026-09-27/claude03-sol-result.json). |
| Garder le moût indépendant | Mesure/hypothèse/estimation distinctes; choix stock/libre et Undo/Redo conservent valeurs et effacement. Les gestes physiques ne modifient pas la fiche adoptée, y compris une saisie libre déjà documentée. [QA stock/choix](../../work/levure-refonte-realisation-2026-09-27/qa/after/run-2026-09-28T00-09-00-160Z/manifest.json), [QA libre documenté](../../work/levure-refonte-realisation-2026-09-27/qa/after/run-2026-09-28T00-55-59-284Z/manifest.json). |
| Préparer avant J0 hors produits initiaux | Notice liquide/culture saisissable et corrigeable, source déclarée, durée qualifiée, étapes et contrôles. Copie locale ou proposition/reçu, puis adoption volontaire. Plan manuel avec marge; échéance trop proche refusée sans perdre le plan. [QA finale](../../work/levure-refonte-realisation-2026-09-27/qa/after/run-2026-09-28T00-07-59-059Z/manifest.json). |
| Réaliser et consommer le stock exact | Quantité réellement versée distincte du prévu; culture séparée du pack. g↔sachet et mL↔flacon nécessitent format exact et association concordante. Refus inconnue/contradiction; confirmation idempotente. [Résultat ensemencement](../../work/levure-refonte-realisation-2026-09-27/ensemencement-reel.md). |
| Corriger et conserver les sources | Faits typés, qualifications, dates et contextes gardés. Les scalaires compatibles restent liés à leur fait explicitement accepté; provenance visible dans le champ après stock/save/reopen, ancien scalaire identique sans attribution. Réponses tardives écartées, revue explicite, CAS/audit/reçu. Une URL citée n’est pas présentée comme preuve de lecture. [Résultat backend](../../work/levure-refonte-realisation-2026-09-27/corrections-ia.md), [QA provenance](../../work/levure-refonte-realisation-2026-09-27/qa/after/run-2026-09-28T00-58-51-006Z/manifest.json). |
| Garder fermentation et continuité | Objectifs/conduite, Paliers, sauvegarde/réouverture hors ligne, transports et snapshots couverts. Une recette corrigée ne réécrit pas le brassin lancé. [Compte rendu QA](../../work/levure-refonte-realisation-2026-09-27/qa/qa.md). |

## Contrôles actuels

- **4 927/4 927 tests sur 329 fichiers** : [journal global final](../../work/levure-refonte-realisation-2026-09-27/lookup-ingress-final-tests.log).
- **Build TypeScript/Vite réussi** : [journal final](../../work/levure-refonte-realisation-2026-09-27/lookup-ingress-final-build.log); [types Functions verts](../../work/levure-refonte-realisation-2026-09-27/lookup-ingress-functions-types.log).
- **109/109 ciblés** : [lookup, pipeline, DB, projection et provenance](../../work/levure-refonte-realisation-2026-09-27/astra2-lookup-ingress-current.log). Les nouvelles réponses IA ne peuvent pas se déclarer acceptées; lecture/transport persistés conservés.
- Les deux échecs du premier gate sont conservés et qualifiés : horloge d’une offre datée et assertion sans nouveau fait compagnon. [85 tests corrigés verts](../../work/levure-refonte-realisation-2026-09-27/last-two-gate-assertions-verified.log), puis gate complet ci-dessus.
- Parcours joués à **390×844 et 1280×900**, captures regardées; aucun débordement, exception, erreur console ni requête externe dans les derniers runs.
- `git diff --check` réussi; modifications concurrentes préexistantes conservées.
- Même Claude natif `f90e0c16-852c-4914-ad90-86f5021b427b`; retours [UI](../../work/levure-refonte-realisation-2026-09-27/claude01-ui-sol-result.json) et [notice](../../work/levure-refonte-realisation-2026-09-27/claude05-sol-result.json) complétés avec preuves.

Relecture locale ouverte : [preview sur fixtures](http://127.0.0.1:4181/?ux-poc=reset).
Le serveur 4181 sert le build frais; son réseau est limité à lui-même.
Dernière reconstruction après le garde-fou d’entrée IA, PID 57104; application
et concepts répondent 200. Les preuves de parcours précédentes restent applicables.
Le [registre de mission](levure-refonte-preparation-2026-09-27.md) conserve décisions,
avis, échecs discriminants, corrections et identifiants.

## Limites conservées

- Gemini, parcours connecté/synchronisation réels et IME Android physique non exercés. Les reçus QA sont mockés; le backend est contrôlé par tests et sa publication vérifiée.
- La réponse exacte de la capture S-04 du 27/09 manque : sa cause reste inconnue. Les sources citées par l’IA n’ont pas de corps de page archivé prouvant la lecture; les sources manuelles restent déclaratives.
- Catalogue initial non exhaustif; certaines origines restent inconnues et sont affichées ainsi. Les données commerciales restent datées.
- Préparation fondée sur une notice liquide/culture documentée; aucune croissance, viabilité ni quantité finale de cellules garantie, aucun starter sec automatique.
- p95 local 34–44 ms mesuré sur deux signaux de saisie/comparaison, hors réseau, démarrage froid et appareil physique. Les avertissements Vite existants persistent; Performance est une autre mission.
- Fixture de moût avec produit sans référence catalogue : le conseil affiche « À revalider »; ce run vérifie le moût et la fiche, pas ce conseil produit.
