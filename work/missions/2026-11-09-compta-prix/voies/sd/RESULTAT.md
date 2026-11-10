OK — La caisse inconnue dit sa cause exacte (Prévisions, En caisse, feuille du solde) et renvoie ; Prévisions plate dit pourquoi (CP-4, CP-7)

## Fichiers écrits
- `src/domain/finance/ledger.ts` : champs ajoutés seulement (`cashCause`, `unknownSinceOpeningCount`, `cashAlert`, type `CashCause`) ; aucun calcul existant changé.
- `src/ui/finance/causeCaisse.ts` (neuf) : texte et geste de la ligne « caisse inconnue », partagés par Prévisions et En caisse.
- `src/ui/finance/previsions/Previsions.tsx` : bandeau pointillé p5b selon la cause ; CP-7 : deux lignes « Tendance à calculer » et « Rien de prévu » quand l'escalier n'a aucune marche ; props `onRegistre?`, `onHistorique?`.
- `src/ui/finance/synthese/Caisse.tsx` : la note sous « En caisse » devient un renvoi (même place, mêmes mots pour « à renseigner » et « à confirmer »).
- `src/ui/finance/synthese.css` : classe `.syn-note-lien` (hors liste Possède, 3 lignes ; à signaler).
- `src/ui/finance/FinanceForms.tsx` (ProfileSheet seul) : ligne « Sans cette case… » ; prop `parametres` qui ouvre le pli « Paramètres des prévisions et des brassins ».
- `src/components/tabs/FinancesTab.tsx` : `onRegistre` (journal sans filtre), `onHistorique` (feuille du solde ouverte sur les paramètres). `onPayments` était déjà branché.
- `tests/integration/soldeDepartCause.test.tsx` (neuf, 23 tests) ; `tests/integration/financeWorkspace.test.tsx` : une assertion adaptée (voir doutes).
- Outils de la voie : `edit-*.mjs`, `capturer.mjs`, `captures/` (68 images).

## Critères
- Rouge d'abord : `tests-rouge.txt` (13 échecs sur HEAD, CP-4) et `tests-rouge-cp7.txt` (4 échecs, CP-7).
- `tests.txt` : 24 fichiers, 276 tests verts (le neuf, registre, Prévisions, Synthèse, FinancesTab, Annuel, assistant sauf `financeAssistantContext.test.ts`).
- `npx tsc --noEmit` hors modules exclus : 0 erreur. `npx vite build` : vert.

## Comportement (vu en vrai rendu, `?dev-local&finance-demo=reel`, 390 tactile, 1280, clair, cave)
- absent : « Solde de départ à renseigner › » inchangé → feuille du solde.
- a-confirmer (son cas : 100, 08/01, case non cochée) : Prévisions « Solde de 100,00 au 8 janv. à confirmer › / coche « J’ai vérifié ce solde » ; sans lui, seul l’écart est connu » → feuille ; En caisse garde sa phrase actuelle, cliquable.
- paiements : Prévisions « Confirmer les paiements (2) › / depuis le 1 nov. ; sans eux, le solde n’est pas connu » → journal filtré (vu : onglet Opérations, filtre « Paiements à confirmer », 2 lignes ZZ TEST). En caisse : « 2 paiements à confirmer ».
- autre : « Données à vérifier › » + première alerte du registre → journal sans filtre (repli : journal filtré).
- Feuille du solde : la ligne apparaît dès qu'un montant est saisi et la case non cochée (capture 390 ouverte).
- CP-7 : « Tendance à calculer › » ouvre la feuille avec le pli « Paramètres » déjà ouvert (vu) ; « Rien de prévu › » ouvre « Prévoir une dépense » (vu). Absentes dès qu'une marche existe.

## Captures ouvertes (L12) : combien et quels problèmes ?
Ouvertes : a-confirmer Prévisions et Synthèse 390 clair, feuille case non cochée 390 clair, plate 390 cave, autre Synthèse 390 cave, paramètres ouverts 390 clair, paiements Prévisions et journal 1280 clair. Non ouvertes : les autres variantes (même code, mêmes états).
4 problèmes :
1. Le premier jet de la note de Synthèse coupait le texte en deux colonnes (le span « date » en bloc dans un bouton flex) : corrigé (texte enveloppé) et recapturé ; la version 390 clair finale n'est pas rouverte après la correction, les captures de paiements et autre le sont.
2. Cause « autre » : l'alerte du registre contient l'identifiant brut (« ZZ-TEST-SYNC : registre de paiements… »). C'est la phrase existante du registre ; à reformuler ailleurs (hors voie).
3. « Tendance à calculer » : le sous-texte passe sur 3 lignes à 390 (« …(3 mois au moins) ») ; lisible, pas raccourci car mot du pilote.
4. En Synthèse, « 2 paiements à confirmer » (note de la caisse) et la rangée « Confirmer les paiements » (À vérifier) coexistent : même geste, deux entrées. Libellés différents exprès (la rangée est un acquis et les tests la cherchent).

## Essais, doutes, limites
- Essais : aucun critère au-delà du 1er essai de correction ; un test de ma fixture corrigé (date d'une pièce).
- `financeWorkspace.test.tsx` (hors Possède strict, test du registre) : le bandeau « Confirmer les paiements (1) » de Prévisions coexiste avec la rangée de la feuille Limites (acquis) ; l'assertion passe de `getByRole` à `getAllByRole(...) ≥ 2`.
- Captures 1280 cave : incomplètes (états 0 à 3 et feuille) : j'ai arrêté le serveur pendant son rejeu. Les 1280 clair et les 390 clair et cave sont complets. À rejouer par un exécutant si voulu (`DEMANDE EXECUTANT` ci-dessous).
- États de capture : pièces « ZZ TEST » et annulation des plans de la démo injectés en mémoire (aucune donnée réelle). `financeAssistantContext.test.ts` échoue sur `firebase-admin` absent (préexistant, hors périmètre).
- Fichiers que d'autres voies modifient en même temps : `FinancesTab.tsx`, `synthese.css`, `FinanceOverview.tsx`. Mes changements y sont de quelques lignes.

DEMANDE EXECUTANT :
1. Lancer `npx vite --port 3002 --strictPort` en arrière-plan.
2. Dans `voies/sd` : `LARGEUR=1280 THEME=cave node capturer.mjs` ; attendu : `PARAMETRES-OUVERT true` et `[]`, 19 images `*-1280-cave.png`.
3. Ouvrir `6-plate-tendance-a-calculer-1280-cave.png` et `5-paiements-previsions-1280-cave.png` ; arrêter le serveur.

DÉCISION À PRENDRE : alerte « autre » avec identifiant brut (ZZ-TEST-SYNC : …). Options : garder la phrase du registre (actuel), ou la réécrire dans `ledger.ts` sans identifiant. Recommandation : réécrire plus tard, lot séparé (touche des tests).
CONNAISSANCE : la caisse inconnue a quatre causes lisibles dans `summarizeLedger` (`cashCause`) ; la feuille « Paramètres des prévisions » s'ouvre par `ProfileSheet parametres`.
LEÇON PROPOSÉE : aucune
