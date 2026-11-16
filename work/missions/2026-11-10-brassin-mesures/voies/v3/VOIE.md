# Voie v3 — mini maquettes des cinq choix ouverts du jour de brassage (mission 2026-11-10-brassin-mesures)

- Agent : concepteur · Modèle : opus · Plafond : 60 tours · Décideur : le brasseur (il choisit sur la page)
- Ses mots (10.11) : « Okay montre » ; avant : « utilise les ux, ui booster », « utilise des slider plutot que de chiffre… »,
  « C'est toujours assez mauvaise le jour de brassage… ». Règle n° 1 : z1 puis m2 sont la base, tout le reste intact.
- Lis : `CLAUDE.md`, `cerveau/LECONS.md` (L03, L12, L24, L26), `.claude/rules/affinee-frontend.md`, `DESIGN.md` ; `../c3/RESULTAT.md`
  (section « À montrer », et l'état actuel de chaque point) ; captures de l'app actuelle `../c3/captures/apres/` (ouvre celles des cinq
  points) ; m2 `../../page-v2/img/m2-*` ; le code en ligne au tag `en-ligne/2026-11-10-rapide` (lecture seule, `git show`).
- Méthode exigée : invoque d'abord par l'outil Skill `boosters-ux`, puis `impeccable` et `ui-design-system` ; applique la check-list à
  chaque option et écris-la dans RESULTAT.md.

## Objectif
Pour chacun des cinq choix, la référence (l'app actuelle, capture) et 2 ou 3 options dessinées dans la grammaire exacte de l'app actuelle
(pars de ses captures et de `../v2/etat.html` ; classes préfixées `v3-…`), 390 tactile, état au repos et après le geste quand il y en a :
1. **Poids du sachet** : « 1 sachet » seul / « 1 sachet · 11,5 g » (masse du catalogue, sa source) / autre lecture utile.
2. **Panneau Houblons des Aides** (Hazy IPA, Simuler ×8, BJCP, Tinseth) au jour de brassage : gardé replié / retiré du jour (reste dans la
   recette) / réduit à une ligne utile au moment.
3. **Relevés depuis la fenêtre de clôture** (« Densité initiale pas relevée · volume au fermenteur pas relevé ») : rien de plus / un
   toucher sur chaque manque ouvre Mesurer au bon onglet puis revient / les deux curseurs dans la fenêtre même.
4. **Ligne Levure dans Préparer** : aucune (quantité choisie à l'ensemencement) / une ligne Levure avec sa quantité à choisir / un rappel
   dans « À anticiper ».
5. **Polices** : chasse fixe pour les doses et la feuille Mesurer seulement (actuel) / tout en police du texte / chiffres tabulaires de la
   police du texte partout.
Peu de texte, rien de coupé, inconnu ≠ 0, jamais `type="number"`.

## Page
`../../page-v3/index.html` : une section par choix (sa question en une ligne, la référence, puis les options côte à côte, nom court et une
ligne chacune). `node scripts/agents/verifier-page.mjs <page> --page-lot --captures <préfixe>` → PAGE OK, sortie dans
`work/missions/2026-11-10-brassin-mesures/voies/v3/tests.txt` (la ligne « Tests », comme `--reporter=dot > …`) ; captures toutes ouvertes.
Le pilote publie.

## Possède
`work/missions/2026-11-10-brassin-mesures/voies/v3/**` et `work/missions/2026-11-10-brassin-mesures/page-v3/**`. Rien dans `src/`. Aucun
déploiement, aucune donnée réelle, ni commit ni stash. Fichiers de travail : OWNS ou os.tmpdir().

## Rendre
`RESULTAT.md` au fil (tous les 5 éléments). À 150 k : « REPRISE : <fichier> ». Réponse finale : une ligne.

## Passe 3b (pilote, après `../../critique/SYNTHESE-v3.md`)
Agent neuf : lis RESULTAT.md de cette voie et SYNTHESE-v3.md ; corrige seulement les 5 bloquants, puis les non bloquants simples :
1. titre de l'en-tête entier (« LOT-DEMO · 19 L ») sur toutes les captures ;
2. Préparer (4A à 5C) : la référence « actuel » est une capture de l'app (`../c3/captures/apres/`), et chaque option garde tout ce que
   l'app montre (« Changer la date », « + » des groupes Eau, icônes) hors du point montré ;
3. 2C : aucun jour inventé (« J2 Citra… ») : ce que l'app sait seulement (« À cru 171 g · 9 g/L · phase ? ») ;
4. 3B, 3C : la feuille Mesurer et la fenêtre de clôture gardent les pièces de m2 (crayon pour taper, ligne d'aide, « Pourquoi maintenant ») ;
5. 5 : une capture où B et C se distinguent (chiffres empilés, liste des Ajouts) ; 1C : la pastille « 1 sachet » suit la quantité.
Rejoue `verifier-page.mjs --page-lot` (PAGE OK dans `tests.txt`), rouvre les captures touchées, complète RESULTAT.md. Une ligne.
