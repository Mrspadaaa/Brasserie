# Préparation de la refonte Levure — critères et preuves

Demande du 24 septembre 2026, branche `codex/yeast-refactor-preparation`.
Cette livraison prépare la prochaine session ; elle n'implémente pas l'écran.
Les critères ont été posés avant la rédaction. Aucun déploiement, appel modèle
Claude ou écriture en DB réelle. L'intégration Git est consignée en fin de rapport.

## Critères observables

| Critère | Résultat attendu | Preuve de préparation |
| --- | --- | --- |
| Consignes durables | Revue de **chaque** champ/sortie/action, recherche visuelle ouverte, un mobile et un desktop par défaut. | `AGENTS.md`, skill `brasserie-frontend`, `PRODUCT.md`, `DESIGN.md`, `docs/ui-compacte.md` ; `quick_validate.py` du skill. |
| Approvisionnement | Sources datées Suisse, France/Allemagne à rang égal, puis Europe ; petit conditionnement, référencement/stock/livraison distincts. | `docs/research/yeast-availability-2026-09-24.md` ; les offres doivent être revérifiées lors de l'implémentation. |
| Modèle de départ | Localiser UI, données, snapshots et limites actuelles de Gemini sans prétendre que les nouvelles capacités existent. | `docs/research/yeast-code-map-2026-09-24.md`, issu de la cartographie Luna en lecture seule. |
| Ensemencement et starter | Formules/unités, sources primaires, limites sec/liquide, lacunes code et liaison avant/J/snapshot explicites. | `docs/research/yeast-pitch-rate-2026-09-24.md`, audit ciblé Luna et vérification des pages fabricant. |
| Mission future autonome | Recherche → effet sur ma bière → réglage → comparaison/application, packs/starter, Gemini qui contrôle/corrige/sauve, offline et régression. | `docs/prompts/refonte-levure.md` ; revue indépendante Luna et corrections consignées ci-dessous. |
| Claude parcimonieux | Opus 5.5 xhigh avec auth Pro, safe/restricted, brief ciblé sans troncature, tours par mission, permissions, un Claude, Luna max 9, quota distinct. | `scripts/claude-frontend.mjs`, tests et `docs/openai-setup.md` ; CLI officiel/help et dry-run sans appel modèle. |

## Responsabilités et intégration

Sol possède la rédaction et les modifications de `AGENTS.md`, du skill frontend,
de `PRODUCT.md`, `DESIGN.md`, `docs/ui-compacte.md`, des documents
`docs/research/yeast-*`, du prompt, du présent registre, de
`docs/openai-setup.md` et des deux fichiers du lanceur Claude. Luna vérifie
le code et les sources primaires de l'ensemencement **en lecture seule**, puis
relit indépendamment le prompt et les réglages. Astra réalise la revue finale,
le commit/push/PR éventuels. Les changements déjà présents au départ ont été
conservés ; le dossier `work/` non suivi est hors propriété de cette mission.

## Contrôles exécutés

- `node --test scripts/agent-launchers.test.mjs` : **13/13 réussis** après
  correction. Couvre authentification Pro stricte, options, périmètre des
  outils, chemins, conflits de copies et distinction tours/quota.
- `quick_validate.py` du skill-creator : **non exécutable** ici. `python` est
  un alias Microsoft Store ; l'autre Python trouvé n'a ni `yaml` ni `pip`.
  Contrôle de remplacement avec le paquet YAML Node : frontmatter analysé,
  `name`/`description` présents, seules clés attendues, aucun TODO : **réussi**.
- `node scripts/claude-frontend.mjs --diagnose` : CLI 2.1.280, `claude.ai`, Pro ;
  Opus 5.5 Max figure dans les arguments configurés, sans essai de disponibilité
  effective. Lecture d'état locale, sans appel modèle. `claude` n'est pas
  directement dans `PATH` PowerShell ; le lanceur trouve l'exécutable natif
  installé. Son `--help` a confirmé les flags employés.
- `--dry-run` : **3 scénarios réussis**, revue avec capture PNG (6 tours),
  édition d'un fichier TSX (18 tours) et relais Luna optionnel (4 tours).
  Les sorties affichent `--safe-mode`, `--restricted`, permissions Read/Edit
  ciblées, commande exacte du relais et aucune option API ; aucun appel modèle.
- `git diff --check` : **réussi** (avertissements de conversion LF/CRLF
  Windows, sans erreur de whitespace). Les nouveaux documents non suivis ont
  aussi été inspectés pour les espaces de fin de ligne.
- Documentation officielle vérifiée : [CLI Claude](https://code.claude.com/docs/en/cli-reference),
  [permissions Read/Edit](https://code.claude.com/docs/en/permissions#read-and-edit),
  [modèle et effort](https://code.claude.com/docs/en/model-config).

## Revue indépendante et corrections

Luna a confirmé la couverture du parcours, de Gemini, des achats et du
starter. Quatre remarques ont été traitées : le registre distingue maintenant
configuration Opus 5.5 Max et disponibilité non testée ; le lanceur refuse les
plans autres que Pro ; le prompt montre une **plage** de masses et packs avant
le choix explicite d'une dose ; les performances ne sont pas présentées comme
acquises sans mesure. L'intégration conserve l'objectif utilisateur de p95
sous 200 ms, explicitement comme objectif à mesurer. Aucun fichier n'a été
modifié par Luna.

Précision finale intégrée par Astra : scénario « 1 sachet prévu / 3 conseillés »,
application explicite et quantité manuelle conservée, volume/densité distincts
de la masse de grains, maltodextrine distincte de l'extrait de malt du starter.
Source fabricant Coopers ajoutée à la recherche. La structure du skill a aussi
été contrôlée avec le Python du runtime : même absence de PyYAML ; le contrôle
YAML Node reste la vérification de remplacement.

## Limites

Cette préparation ne prouve ni UX ni performance de l'application : aucun code
applicatif changé, donc pas de build complet ni de navigateur avant/après. Les
sources vendeurs sont des observations datées, pas un stock actuel garanti.
Les notices de pitch rate portent sur les produits cités ; le prochain travail
doit valider les références exactes, la viabilité et tout modèle de starter.
Le diagnostic CLI ne lit pas le réglage de crédits supplémentaires de Claude ;
celui-ci doit être vérifié dans Claude → Usage avant une future consultation.
La disponibilité réelle d'Opus 5.5 et l'exécution effective de ses permissions
ne sont pas vérifiées sans appel modèle ; seuls la documentation, l'aide locale,
les arguments et les tests du lanceur ont été contrôlés.

## Intégration Git

Préparation issue de `origin/main` à `17ea810`, déjà synchronisé au contrôle
initial. La PR de cette branche livre les consignes, le prompt, les recherches
Levure et le lanceur ; la fusion dans `main` reste à la validation utilisateur.
Les fichiers de recherche parallèle `docs/research/ux-mobile-*` et `work/`
restent préservés hors de cette livraison. Aucune modification de l'application
ni authentification globale n'est incluse.

## Ajustement Claude xhigh — 24 septembre 2026

À la demande de l'utilisateur après analyse des deux anciennes consultations,
le lanceur et la mission passent de Max à **xhigh** pour Claude uniquement.
La documentation officielle d'Opus 5.5 inclut ce niveau. Le paramètre CLI,
l'environnement enfant et le diagnostic utilisent la même valeur ; les réglages
globaux d'autres sessions et les efforts OpenAI restent inchangés.

Après modification : **13/13 tests réussis**, diagnostic Pro/CLI 2.1.280 avec
effort configuré `xhigh`, dry-run à 4 tours avec `--effort xhigh`, et
`git diff --check` réussi. Aucun appel modèle n'a été effectué. Les observations
Max plus haut décrivent les vérifications initiales ; aucune économie de quota
ni équivalence de qualité n'est encore mesurée pour le nouveau réglage.
