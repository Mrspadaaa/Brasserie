# Voie e7 — Le bilan : mes brassins en chiffres (4 mini maquettes, vue jamais maquettée)

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 45 tours ; 3 essais par critère · Dépend de : cv · Décideur : brasseur (il choisit sur la page)

## Objectif
Ses mots (14.11) : « J'ai l'impression que tout les écrans sous les boutons de ces Tabs ne sont pas traitées ??? ». Le tableau
`work/missions/2026-11-14-brassins/voies/cv/COUVERTURE.md` le confirme : cette vue n'a aucune maquette. Vue : **Le bilan : mes brassins en chiffres** — « Ai-je atteint ma cible ? » (cible et résultat par brassin : OG, FG, alcool, volume), production par mois, styles, houblons, alcool et amertume, retours de dégustation ; sur ses 5 brassins seulement.
4 mini maquettes statiques (non jouables), vraiment différentes : 1 froide (l'écran actuel remis d'aplomb), 2 tièdes, 1 chaude
(un genre neuf, osé). Plancher à enrichir (L07), pas une copie.

## Entrées
- Écran actuel : aucune capture : lis le code. Code : `src/ui/production/CatalogAnalysis.tsx`, `src/ui/production/BatchOutcomeAnalysis.tsx`. Lis-le pour savoir ce que la vue fait vraiment (L02) ; aucune fonction perdue sans le dire.
- `work/missions/2026-11-14-brassins/voies/cv/COUVERTURE.md` : tes lignes de vue et ton groupe dans « ## Sans maquette, groupées ».
- `work/missions/2026-11-14-brassins/voies/c3/DIAGNOSTIC.md` : les 7 causes du refus des 19 premières (à éviter toutes) et § Garder.
- `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` : « Ses mots », « Obligatoire », « Les chiffres » (ses 5 brassins).
- Ses mots sur ce sujet : `grep -n -i -E "bilan|analyse|cible|rendement|comparer" work/refonte-frontend/v4/SPEC-BRASSEUR.md | head -40`.
- Son goût (ouvre-les, Read) : `work/refonte-frontend/v4/choix/baselines/fiche/repos.png`, `dryhopper/repos.png`, `comparer/repos.png` ;
  la variante la mieux classée de la page 2 : `work/missions/2026-11-14-brassins/voies/s5/s5a/s5a-repos-390-clair.png` et `work/missions/2026-11-14-brassins/voies/s4/s4a/s4a-repos-390-clair.png`.
- Skills `boosters-ux`, `impeccable`, `ui-design-system` (Skill, une fois) ; `DESIGN.md` (Colors, Typography, Layout).
- Gabarit de rendu : `work/missions/2026-11-14-brassins/voies/s5/capture.mjs` (puppeteer-core du dépôt principal, Chrome du poste) : copie-le dans ton dossier et adapte son plan.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/e7/` : un dossier par variante `e7a` à `e7d` (`etat.html`, PNG, `NOTE.md`), `capture.mjs`.
Rien dans `src/`. Ni commit ni stash. Fichiers de travail : ton OWNS, ou `os.tmpdir()` préfixés `e7-`.

## Consignes
- Contre les causes de c3 : pas de squelette commun aux 4 ; une phrase-réponse en gros en tête (ce qu'il vient décider ici) ;
  couleur pleine et contrastée comme ses choix ; boosters (curseur, bascule, pastille, jauge, plage, frise, édition sur place)
  plutôt que du texte ; aucune phrase grise d'aide au repos ; écran rempli à 390.
- Images par variante : `<id>-repos-390-clair.png` et `<id>-geste-390-clair.png` (geste : une mesure choisie (ex. FG) et les écarts qui en résultent). Ta meilleure ajoute
  `<id>-repos-390-cave.png` et `<id>-repos-1280-clair.png`. 390 × 844, `isMobile`, `hasTouch`. Ouvre chaque image (Read) une fois.
- Environ 9 tours par variante. Vers 150 k de contexte, finis les images manquantes et rends.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Saisie au curseur (geste m2 : un toucher pose la cible, le pouce glisse sur une piste, la valeur tapée reste à un toucher) ; jamais
  `type="number"` ; chiffres à la virgule ; inconnu = « — » ; cibles ≥ 44 px ; deux thèmes (clair et « cave ») ; 390 et 1280.
- Premier plan actionnable, pas de cockpit, pas de bandeau d'alerte en tête, pas de code interne (ni « ZZ », ni « V5.5 » sauf pour
  le montrer retiré), pas de paragraphe. Grammaire de z1 pour la continuité (en-tête de lot, cartes) ; jetons de DESIGN.md.
- Honnêteté : ses 5 brassins et les chiffres de BRIEF-AUTEUR.md ; une donnée qui n'y est pas (tarif, contact, idée, recette) reste
  plausible et sobre, dite « fictive » dans NOTE.md ; aucun α, IBU ou arôme inventé (« — » ou source du dépôt citée).
- Classes et globales préfixées par l'id de la variante (`e7a-…`, L26) ; HTML autonome par variante.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments) : variantes, chaleur, idée, images ouvertes.
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ici (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK,
  au même format que `--reporter=dot > …`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave (selon la liste ci-dessus), toutes ouvertes.
- `NOTE.md` par variante : chaleur, « Idée : » en une ligne (6 mots au plus pour le nom), fonctions de l'écran actuel gardées ou
  déplacées, causes c3 évitées, écarts assumés, données fictives.
Réponse finale au pilote : une ligne.
