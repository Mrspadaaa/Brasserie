# Voie e3g — Le carnet et le dossier : greffes e3a × e3b, notes rangées par l'IA

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 45 tours · Dépend de : — · Décideur : brasseur (il choisit sur la page)

## Objectif
Ses mots (15.11), mot pour mot : « e3b Le fil — e3a Carnet — Je plaise bien... À faire d'autres versions de ceux là. Aussi utiliser
l'ia pas chère pour remettre en place des note en vrac ». Faire 4 greffes e3a (Carnet et Dossier remis d'aplomb) × e3b (le fil du brassin,
jour par jour), vraiment différentes au repos, chacune avec le rangement des notes en vrac par l'IA la moins chère : il écrit en vrac, l'IA
propose (dates, mesures, dégustation, incidents rangés à leur jour), il valide ou corrige chaque proposition ; rien n'est rangé sans lui.

## Entrées
- Les parents (Read, chaque image une fois) : `work/missions/2026-11-14-brassins/voies/e3/e3a/`, `work/missions/2026-11-14-brassins/voies/e3/e3b/` ; leur critique : `work/missions/2026-11-14-brassins/voies/k1/VERDICT.md` § e3.
- Un rangement par IA qu'il a déjà vu : `grep -rl "ri4" work --include=*.md | head -5` (l'Atelier, « ri4 ») ; s'en inspirer pour la forme de la proposition.
- Ce que fait l'app : rubriques Carnet et Dossier de `src/components/production/BatchDetailSheet.tsx` (`grep -n "Carnet\|Dossier" `).
- Brassins : NEIPA · LOT-019 et Stout · LOT-015 ; notes en vrac d'exemple plausibles (mots de brasseur, fautes de frappe comprises).
- Gabarit de capture : `work/missions/2026-11-14-brassins/voies/e3/capture.mjs`.
- Revue de la page précédente (pourquoi « pas très clair ») : `work/missions/2026-11-14-brassins/revue-page5/SYNTHESE.md`, puis `critique.md` § B.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/e3g/` : `e3ga` à `e3gd` (`etat.html`, PNG, `NOTE.md`), `capture.mjs`, `RESULTAT.md`, `tests.txt`. Rien dans `src/`.

## Consignes
- 1 froide, 2 tièdes, 1 chaude. Le rangement : dire que c'est une proposition de l'IA (« proposé »), l'accepter ou corriger à un toucher,
  jamais appliqué seul ; hors ligne : la note reste en vrac, rangée plus tard.
- `geste` : après « Ranger mes notes » (la proposition) ; `rangement` : après validation ; `dossier` : la rubrique Dossier.
- Images par variante : `<id>-repos-390-clair.png`, `<id>-geste-390-clair.png`, `<id>-rangement-390-clair.png`, `<id>-dossier-390-clair.png`, `<id>-repos-390-cave.png` ; la meilleure ajoute `<id>-repos-1280-clair.png`. Ouvrir chaque image (Read) une fois.
- D'abord, dans RESULTAT.md, en 5 lignes : ce qu'il a dit, ce qu'on en lit, les 4 genres choisis et en quoi ils diffèrent au repos.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Identité de l'app : trousse `work/missions/2026-11-14-brassins/outils/identite/` (LISEZMOI.md d'abord) ; `node work/missions/2026-11-14-brassins/outils/controle-identite.mjs <dossier>` → IDENTITE OK.
- Saisie au curseur (m2), jamais `type="number"` ; chiffres à la virgule ; inconnu dit en mots (« non mesurée »), jamais un chiffre inventé ;
  cibles ≥ 44 px ; clair et cave ; 390 tactile et 1280 ; données de `work/missions/2026-11-14-brassins/BRIEF-AUTEUR.md` § Les chiffres et `work/missions/2026-11-14-brassins/DONNEES-COMMUNES.md`.
- Premier plan actionnable, pas de cockpit ni de code interne ; une information dite une fois (la revue du 15.11 a compté 2 à 5 redites par écran).
- Plancher à enrichir (L07). Classes et globales JS préfixées par l'id de la variante (L26).
- Page « pas très clair » (15.11) : chaque variante doit se distinguer des autres AU REPOS, à 390, en un coup d'œil (« toutes les
  propositions se ressemblent » : refus connu). `NOTE.md` porte quatre lignes : « Chaleur : », « Idée : » (nom en 6 mots au plus),
  « Ce qui change : » (15 mots au plus, en mots de brasseur, sans code de variante), « Geste : » (le geste montré par l'image geste,
  nommé : « après "Planifier" », « après Citra coché »).

## Critères
`work/missions/2026-11-14-brassins/voies/e3g/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments) ; vers 150 k de contexte, finir les images en cours et rendre « REPRISE : RESULTAT.md ».
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes (Read) avant de cocher.
- Fable interdit sous toute forme. Ni commit ni stash. Fichiers de travail : ton OWNS ou `os.tmpdir()` préfixés de l'id de la voie.
Réponse finale au pilote : une ligne.
