# PoC + performance publiés, refonte Levure exclue

Demande utilisateur de publication exécutée depuis le worktree isolé. Source `9aa513238298bbdf3be38b267630b9fbf94255c1`, application identique à95fb74c (seul un test de montage différé est ajusté après cette référence). Tout le PoC b09af85 et les correctifs e04b856/c289115 sont présents. Aucun changement non commis de codex/levure-refonte repris ; audit indépendant dans scope-review.md. Checkout de refonte préservé.

`npm run deploy`, session99404, **sortie0** : règles/index,33Functions existantes àZurich, Hosting142fichiers. Aucun nouveau endpoint de refonte, liste des comptes autorisés préservée, rapport personnel protégé côté serveur conservé. Aucune clé/secret modifié et aucune écriture de test/Gemini en production.

- Site : https://brasserie-l-affinee.web.app
- Release : `1790544537116000` ; version : `6e99e40977bf97a7`.
- Publication : `2026-09-27T21:28:57.116Z`.
- Modules : `index-B2Sz5FzH.js`, `App-0kP1eOlI.js`, `RecipePage-Smc4FQuh.js`.
- Contrôle public :16GET HTTP200, hashes identiques au build local, aucun accès DB/callable. `production-check.json`.
- Préflight :320fichiers,**4806/4806tests**, builds app/Functions, règles29collections, unités, brassage, eau,16schémas prompts, exclusion privé/QA/Gemini direct PASS. Premier test d'attente synchrone refusé puis corrigé ; logs initial et final conservés.

Pour voir la nouvelle version sur le téléphone, recharger la page. Ne pas effacer les données du site/Firestore pour fabriquer un état froid. La trace Android précédente2018ms est un avant ; cette publication ne prouve pas à elle seule le délai réellement ressenti après correction.

**Contrôle authentifié après publication réussi**, effectué par le pilote dans le Chrome de l'utilisateur et terminé21:53:32UTC. Après reload normal, index-B2Sz5FzH.js/App-0kP1eOlI.js identifient la bonne version. Catalogue22recettes, fiche complète, premier rapport aromatique, retour/réouverture, éditeurIdentité et focusNom sans frappe, fermeture et restitution du focus passent. Aucun warning/error retourné dans la lecture finale. Ni saisie/sauvegarde/IA/stock/brassage commandés. Rapport et captures réels restent dans Downloads, hors Git.

Preuve fonctionnelle PC attribuée au **pilote**, sans chiffres tirés de CUA et sans nouvelle mesure Android. Le smokePC21:16UTC portait sur l'ancienne version ; il n'est pas utilisé comme après. Le réveil ponctuel s'arrête, aucune surveillance nouvelle. Ce fil ne contourne pas son refus d'accès à l'onglet et ne répète pas les mêmes gestes.

Rollback Hosting : release précédente `1790519594676000` / version `f86f0b7e11ad883d`, confirmée avant action. Un rollback Hosting ne change pas les Functions/règles ; leurs sources restent celles du PoC et des domaines partagés de performance, pas de la refonte. Configuration et réponsesCLIbrutes restent locales/ignorées ; seuls résumés et preuves publiques sont versionnés.
