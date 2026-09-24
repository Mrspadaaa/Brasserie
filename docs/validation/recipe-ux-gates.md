# Houblons et Levure — contrat et preuves

Branche : `codex/openai-clean-start`. Base synchronisée : `e6204aa`.
Le stash de synchronisation et la configuration Claude restent préservés.

## Résultats attendus

- [x] Configuration OpenAI native : trois skills ciblés, aucun import Claude ;
      Astra Max ~256k utiles, Sol/Luna Max avec contexte indépendant.
- [ ] Claude Opus 5.5 Max via l'abonnement : conception puis revue/corrections,
      session dédiée, aucun appel API payant ni secret copié.
- [x] Références stock/catalogue stables, homonymes et lots distingués,
      sources reprises sans écraser le manuel ni inventer une valeur.
- [x] Houblons : champs cohérents selon la phase, édition et simulations liées,
      informations métier conservées et boosters utiles effectivement livrés.
- [x] Levure : données documentées, paramètres et projection cohérents,
      liens avec Paliers, informations conservées et boosters utiles livrés.
- [x] Recette incomplète enregistrable ; invalidité et préparation au brassage
      distinctes ; sauvegarde, réouverture et modifications cohérentes.
- [x] Eau et sels préservés ; imports/exports, NOLO, hors ligne et snapshots
      des brassins sans régression.
- [x] Parcours réel des sept étapes ; captures examinées à 320/375/430/1280,
      clavier/reflow équivalent 200 %, chargement/erreur/reprise contrôlés.
- [x] Performances mesurées avant/après sur le même banc, objectif interactions
      locales p95 < 200 ms ; production distinguée du bundle de fixtures QA.
- [x] Tests pertinents, build, revue, PR et intégration main vérifiés.

## Responsabilités

| Responsable | Propriété | Vérification |
| --- | --- | --- |
| Astra | configuration, skills, docs, intégration, liaison Claude | configuration effective, revue, navigateur, build |
| Sol données | BrewWizard, domaines de recette, sélecteur générique, tests associés | régressions de sélection, sauvegarde et projections |
| Sol frontend | composants Houblons/Levure et styles dédiés | tests ciblés, captures et interactions |
| Luna QA | nouveau smoke sept étapes et mesures avant/après | vrai navigateur, fixtures locales, zéro donnée réelle |
| Claude | conception puis fichiers frontend explicitement confiés | revue indépendante et recontrôle après intégration |

## Preuves

### Configuration, le 24 septembre 2026

Nouveau processus `codex-cli 0.155.0-alpha.16.4`, `config/read` et `skills/list` :
Astra Max, contexte 272000, compaction native, 11 enfants et profondeur 2 ;
mémoires désactivées, aucun repli vers `CLAUDE.md`, cinq plugins Claude désactivés.
Les trois skills du dépôt sont découverts sans erreur. `codex plugin list`
confirme aussi Build Web Apps installé et activé ; les capacités distantes ne
figurent pas toutes dans le catalogue du seul serveur CLI local.

Deux tours natifs éphémères utilisent explicitement les valeurs des fichiers
Sol/Luna : les réponses et métadonnées confirment `gpt-6-sol` / `gpt-6-luna`,
effort `max`, fenêtre utile `modelContextWindow: 828400` (872000 bruts).
Seul `AGENTS.md` du worktree apparaît dans les sources d'instructions.
Il s'agit d'un contrôle des réglages et de leur prise en compte, pas d'un test
de charge avec un historique de cette taille. Le contexte de la conversation
ancienne ne peut pas être effacé rétroactivement.

La configuration globale Codex désactive également les cinq plugins Claude et
l'import automatique. Copie préalable conservée dans
`~/.codex/.tmp/openai-clean-start-20260924/`. Authentifications, système et
configuration Claude conservés ; caches des plugins désactivés non supprimés.

Claude Code 2.1.280 : session `claude.ai`, fournisseur `firstParty`, abonnement
Pro, sans clé API. Crédits supplémentaires désactivés, vérifiés dans l'écran Usage.
Conception exécutée en `claude-opus-5-5 --effort max`, lecture seule, résultat
achevé en 64 tours. Aucun plafond de tours appliqué. Les sept tests des lanceurs
passent. Une revue Luna native indépendante a conduit à verrouiller les vagues
du relais Claude : deux invocations ne peuvent pas lancer dix-huit Luna.
Le moteur limite le total d'enfants ; les quotas distincts 2 Sol / 9 Luna
restent une consigne du pilote, faute de quota natif par modèle.
La seconde passe, confiée avec les captures, a engagé une correction ciblée de placeholder
à cru, puis s'est interrompue à la limite de session Pro après 95 tours.
Son résultat final est une erreur de quota, pas une revue achevée. Aucun
basculement vers une API payante. Sol et Astra reprennent la revue et les
vérifications ; le critère de seconde revue Claude complète reste ouvert.

Une vérification supplémentaire de délégation **réelle** a révélé que les
rôles Sol/Luna héritent encore du plafond Astra dans cette version native,
malgré le TOML. Les profils natifs dédiés corrigent le lancement des processus ;
les réglages projet qui les masquaient ont été retirés. Le serveur natif lancé
avec les paramètres Sol explicites a confirmé Sol → Luna à 828400 tokens utiles.
Les instructions distinguent désormais cette route des rôles seuls.

Le lancement CLI avec `--profile sol-full` a ensuite réellement délégué une
lecture au rôle Luna : les deux sessions annoncent 828400 tokens utiles, leurs
modèles respectifs et Max. L'enfant a terminé ; le contrôleur de diagnostic a
arrêté le parent à 120 s avant son bilan. Aucun tel délai n'est installé dans
les profils de travail. `--profile luna-full` a terminé normalement. Le plafond
Sol de neuf enfants et l'arrêt de délégation chez Luna sont configurés ; neuf
agents n'ont pas été lancés sans besoin pour éprouver ce plafond.

La lecture finale dans un processus neuf confirme Astra Max, 272000 bruts,
11 enfants, profondeur 2, fallback vide, mémoires coupées, cinq plugins Claude
désactivés et les trois skills du dépôt. Les gabarits de profil correspondent
aux fichiers personnels installés, et l'authentification reste ChatGPT.

Preuves locales : `%TEMP%/laffinee-recipe-ux/config-new-process.json`,
`model-windows-new-process.json`, `claude-conception.json`.
Preuves finales : `config-normal-process.json`, `native-profile-evidence.json`,
`native-profile-effective-instructions.json`, `native-profile-completion.json`,
`native-profile-luna-direct-result.json`, `claude-visual-pass.json`.

### Application

#### Informations conservées et décisions du brasseur

| Besoin | Présentation et interaction | Données communes |
| --- | --- | --- |
| Régler l'amertume à chaud | Bilan IBU et plage du style, répartition des masses, résultat près de chaque ajout, accès à sa simulation | Calcul existant `hotBitterness`, volume, densité, alpha du lot, durée et température |
| Planifier les ajouts à cru | Phase explicite, jour, contact et température ; contacts positionnés sur le calendrier de fermentation quand les données le permettent | Les mêmes ajouts de recette alimentent Houblons, Levure et Paliers |
| Choisir une souche | Comparaison des repères documentés, source accessible, projection de la recette séparée | Résolution commune du dossier, observations bière compatibles, corrections manuelles prioritaires |
| Régler la fermentation | Position de la consigne dans la plage documentée, programme visible, comparaison recette/essai puis application explicite | Programme existant de Paliers ; aucune deuxième copie de ses valeurs |
| Retrouver la profondeur métier | Fiche fabricant, conditions, sources, lots/COA, recherche avancée, comparaisons et simulations restent accessibles | Contrats de recette et de références conservés |
| Sauvegarder un travail en cours | État incomplet enregistrable, erreurs de valeur distinctes, préparation d'un brassin contrôlée | Validation partagée ; réouverture du même identifiant |

Une mesure inconnue reste inconnue. Les sources liées à d'autres usages, notamment
Mead pour la 1056, restent consultables mais ne fournissent pas la projection de
bière. Un conditionnement en sachets ne devient pas une masse en grammes sans
conversion documentée. Les rappels ont une source commune ; ils ne conservent pas
une valeur indépendante susceptible de diverger.

Le pilote a joué à 375 px une American IPA de 20 L : malt 4,5 kg, Cascade 25,5 g
à 6,2 % pendant 20 min, Citra 50 g à J+5 après fermentation, 48 h à 18 °C,
Wyeast 1056 liquide 0,2 L. Changer la primaire de 19 à 20 °C dans Paliers met
à jour Levure ; enregistrement et réouverture conservent dose, unité et programme.
Ce parcours a fait corriger la première affectation d'unité qui effaçait la dose.
Le résidu d'affichage `4,199999999999999` L/kg est le seul défaut reproduit corrigé
dans Eau : son calcul et les réglages de sels ne sont pas modifiés.

La revue indépendante Sol a fait corriger deux cas supplémentaires : une
observation personnelle d'hydromel n'empêche plus la projection fondée sur la
référence bière compatible ; une durée d'ajout à l'ébullition supérieure à la
durée d'ébullition est invalide. Les 58 tests ciblés de projection et préparation
passent après ces corrections. La jauge IBU partagée est séparée de l'atelier
pour préserver son chargement à la demande.

Les champs effacés suivent maintenant le contrat de sauvegarde : masse non
prévue et alpha inconnu utilisent zéro ; durée/température de houblonnage et
repères facultatifs utilisent l'absence de valeur. Les nombres malformés et
les champs obligatoires invalides restent bloquants. Effacer une donnée
facultative ne produit plus un NaN impossible à enregistrer. Les tests de
parcours vérifient sauvegarde incomplète, refus de préparer un brassin, focus
sur le champ manquant et acceptation après correction.

Le parcours manuel final à 375 px a rouvert la recette enregistrée, modifié la
primaire de 20 à 21 °C dans Paliers, constaté 21 °C dans la jauge et le programme
Levure, puis enregistré et rouvert la même recette : 0,2 L et 21 °C conservés.
Le champ de ratio d'eau affiche 4,2 L/kg.

### Vérifications exécutables finales

- `npm test -- --maxWorkers=4 --reporter=dot` : **299 suites, 4524 tests passent**,
  en 138,67 s après les corrections de performance. Cela comprend les régressions Eau et sels,
  transfert/import/export de recette, NOLO, sauvegarde locale et brassins figés.
- `npm run build` : réussi, bundle de production et contrôle d'exclusion des
  données privées. Les avertissements existants de taille des gros chunks et
  de modules partagés restent visibles ; aucun seuil n'est relevé pour les masquer.
- `node --test scripts/agent-launchers.test.mjs` : **7 tests passent**.
- `tsc --noEmit` et `git diff --check` : réussis.

Preuves : `%TEMP%/laffinee-recipe-ux/full-test-final-optimized.log`,
`production-build-optimized.log`, `production-bundles.json`.

| Production, tous les fichiers JS/CSS | Avant | Après |
| --- | ---: | ---: |
| Taille brute | 11 036 548 octets | 11 059 978 octets |
| Gzip, somme fichier par fichier | 2 280 547 octets | 2 286 782 octets |
| Entrée application brute | 198 140 octets | 198 140 octets |
| Atelier houblon différé | 22 614 octets | 22 771 octets |

La taille totale gzip augmente de 0,27 % avec les fonctionnalités et contrôles.
Ce changement ne prétend pas réduire le poids global de l'application.
L'extraction de la jauge évite que le nouveau bilan importe statiquement l'atelier.
Les chiffres du bundle QA contenant les adaptateurs et fixtures sont consignés
séparément dans son rapport, jamais présentés comme la taille de production.

### Parcours et revue visuelle

Les parcours fonctionnels ont abouti à 320, 375, 430 et 1280 px : les sept étapes,
sélection stock/catalogue/saisie libre, références homonymes, décimales, phases à
cru, scénario Lager proposé explicitement, faits de la 1056 avant et après choix,
simulation, sauvegarde, réouverture et modification du même identifiant.
Une recette incomplète se sauvegarde mais reste bloquée à la préparation du brassin.
La complétion IA simulée couvre erreur, nouvel essai, proposition et application.
Aucun appel externe, erreur console/runtime ou échec HTTP local n'a été observé.

Luna, Sol et Astra ont examiné les captures téléphone puis ordinateur. Les longs
libellés se replient, le bouton flottant ne masque plus les commandes, la source
documentaire du lot reste accessible et la plage de la souche se distingue de la
projection de la recette. Le programme et les contacts à cru sont lisibles dans
la vue Levure. Une reprise au clavier d'un filtre natif et des champs est couverte.

La vérification à 640 px CSS représente le reflow d'une fenêtre 1280 px à 200 %.
Le raccourci de zoom natif envoyé par l'extension navigateur n'a changé ni la
largeur CSS ni le ratio de pixels ; un zoom natif réellement appliqué n'est donc
pas revendiqué. Il ne s'agit pas non plus d'une mesure sur un téléphone physique.

Les premiers essais de performance ont isolé six retours vers Houblons ouverts
à environ 251–269 ms, avec Levure à 44–51 ms. Ils ne sont pas comparables à la
référence initiale de 197,1 ms, qui utilisait une recette vierge et des ateliers
fermés. Le protocole distingue désormais recette vierge et recette chargée,
conserve chaque transition nommée et écrit les mesures avant de poursuivre le
smoke. Le seuil reste inférieur à 200 ms ; une violation ne masque pas les
résultats fonctionnels des autres largeurs.

Preuves intermédiaires : `%TEMP%/laffinee-hop-journey-final-perf-luna-20260924-c`
(téléphones), `laffinee-hop-journey-final-1280-luna-20260924-d` (ordinateur),
`laffinee-hop-cpu-profile-run-20260924` (profil CPU des retours vers Houblons).
Les résultats définitifs après correction de performance sont consignés ci-dessous.

### Performances et parcours finaux

Le profil CPU lisible a isolé le calcul des candidats levure dans l'atelier
Houblons, même lorsque son onglet Goût / levure n'était pas visible. Ce calcul
attend désormais cet onglet et s'actualise quand le style change. La recherche
IA limitée aux houblons ne résout plus inutilement l'atténuation des levures.
Le programme détaillé de Levure se monte à sa première ouverture et reste monté
ensuite pour conserver l'essai. La complétion locale, les repères visibles et le
programme principal restent immédiatement actifs.

Le bundle final figé `laffinee-hop-qa-final-luna-20260924-e` passe les quatre
parcours en une exécution, code de sortie 0. Le seuil n'a pas été modifié.

| Largeur | Saisie : événements / p95 | Navigation : événements / p95 | Parcours et seuil |
| --- | ---: | ---: | --- |
| 320 px | 189 / 13,8 ms | 15 / 98,3 ms | Réussis |
| 375 px | 189 / 14,1 ms | 15 / 99,2 ms | Réussis |
| 430 px | 190 / 13,9 ms | 15 / 100,0 ms | Réussis |
| 1280 px | 185 / 13,2 ms | 15 / 96,9 ms | Réussis |

Dans le parcours chargé à 375 px, le profilage intermédiaire puis la correction
font passer le p95 de navigation de 260,9 à 99,2 ms. Cette comparaison concerne
les optimisations du parcours déjà réorganisé, pas la recette vierge initiale.

Une paire distincte utilise exactement le protocole de recette vierge à 375 px,
séquentiellement sur les bundles avant/après : navigation 103,0 → 95,4 ms
(15 événements chacun), saisie 15,2 → 14,7 ms (199 événements chacun). Ces valeurs
décrivent les mesures de ce banc ; la faible différence à vide n'est pas présentée
comme un gain garanti sur d'autres appareils.

Méthode : même Chrome local, versions compilées avec les composants réels et les
adaptateurs QA, aucun build/test concurrent ; événements clavier/clic de Puppeteer
jusqu'au second `requestAnimationFrame`. Navigation : trois transitions de mise
en route et douze transitions chaudes ; tous les échantillons sont conservés.
Avec quinze échantillons, le p95 par rang le plus proche est le maximum observé.
Ce proxy de rendu n'est ni un INP de terrain, ni une mesure physique de l'écran,
ni une mesure réseau Firebase. Le poids du vrai build de production est mesuré
séparément. Les requêtes externes du banc sont bloquées.

Preuves finales : `%TEMP%/laffinee-hop-journey-final-luna-20260924-e`
(`journey-report.md`, JSON par largeur, captures),
`laffinee-hop-journey-paired-blank-baseline-luna-20260924-e` et
`laffinee-hop-journey-paired-blank-final-luna-20260924-e`.

Captures synthétiques conservées dans le dépôt :
[Levure à 375 px](recipe-ux-assets/levure-375.png),
[comparaison de l'essai à 375 px](recipe-ux-assets/simulation-375.png),
[ajouts Houblons à 430 px](recipe-ux-assets/houblons-430.png).
Les [échantillons de performance](recipe-ux-performance.json) sont également
versionnés, sans données privées ni chemins personnels.

### Livraison, le 24 septembre 2026

La [PR #13](https://github.com/Mrspadaaa/Brasserie/pull/13) est fusionnée dans
`main` au commit `bc540281e6fe1dc4266897c36d04c2bd81a82b29`. Son arbre est identique
au commit testé `26bf33801c05d958049d95f756587421062838b5` ; aucun conflit ni
changement de code supplémentaire n'a été introduit par la fusion. Le dossier
principal a été synchronisé en avance rapide et les deux stashes conservés.
La seconde revue complète de Claude reste non validée pour la raison de quota
documentée ci-dessus ; les revues Sol/Astra ont été terminées.
