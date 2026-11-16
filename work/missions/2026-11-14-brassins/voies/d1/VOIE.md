# Voie d1 — La feuille « Brasser » revue, d'abord le choix de la date

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 45 tours · Dépend de : — · Décideur : brasseur (il choisit sur la page)

## Objectif
Ses mots (15.11), mot pour mot : « Créer : c2a · Recettes : r2a — Mais bien revoir cette écran notamment pour la sélection de date »,
avec sa capture de la feuille « Brasser Blonde de soif · v4 » de r2a (`work/missions/2026-11-14-brassins/voies/d1/ref/sa-capture-c2a-geste.jpg`, l'ouvrir) : « Tout est en stock »,
QUAND « Demain · Sam. 21 · Plus tard », « F3, libre après la mise en bouteille de la Pils », Annuler / Planifier le brassin. Revoir cette feuille,
d'abord le choix de la date : 4 versions vraiment différentes de ce choix, la feuille gardant ce qui marche (stock vérifié, cuve libre, rien
créé avant le geste). Les deux sont retenues : c2a (« Créer », un toucher, chaque effet annulable) et r2a (« Recettes », prête ou il manque).

## Entrées
- Sa capture (ci-dessus) ; r2a : `work/missions/2026-11-14-brassins/voies/r2/r2a/` (etat.html par sections, PNG, NOTE.md) ; c2a : `work/missions/2026-11-14-brassins/voies/c2/c2a/` (NOTE.md, PNG).
- Ses mots sur les dates et le planning : `grep -n -i -E "date|jour|calendrier|planning|planifi|semaine|quand" work/refonte-frontend/v4/SPEC-BRASSEUR.md | head -40` ;
  `cerveau/produit/saisie-mobile.md` ; ce qui existe : `src/ui/production/fiche/PlannedDate.tsx` (e1a, retenue : puces « demain, lundi, +7 j ») et
  `src/ui/production/BatchSchedule.tsx`.
- Ses problèmes : `work/missions/2026-11-14-brassins/voies/a2/PROBLEMES.md` § Créer un brassin (n° 2 moins de gestes, n° 4 ingrédients, n° 7 à la volée).
- Gabarit de capture : `work/missions/2026-11-14-brassins/voies/r2/capture.mjs`.
- Revue de la page précédente (pourquoi « pas très clair ») : `work/missions/2026-11-14-brassins/revue-page5/SYNTHESE.md`, puis `critique.md` § B.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/d1/` : `d1a` à `d1d` (`etat.html`, PNG, `NOTE.md`), `capture.mjs`, `RESULTAT.md`, `tests.txt`. Rien dans `src/`.

## Consignes
- Écrire d'abord dans RESULTAT.md ce qui ne va pas dans le choix de date de sa capture (hypothèses : « Sam. 21 » sans raison dite,
  « Plus tard » qui ouvre on ne sait quoi, le lien entre le jour, la cuve libre et l'arrivée des ingrédients), puis les 4 genres.
- 1 froide (sa capture corrigée), 2 tièdes, 1 chaude. Jamais `<input type="date">` natif seul ; le jour se choisit au doigt, un toucher pour le cas
  courant ; la raison d'un jour proposé est dite en mots (cuve libre, ingrédients arrivés) ; même langage de date que e1a.
- `geste` : un autre jour choisi ; `loin` : un jour au-delà de la semaine ; `conflit` : un jour où la cuve n'est pas libre ou un ingrédient manque.
- Images par variante : `<id>-repos-390-clair.png`, `<id>-geste-390-clair.png`, `<id>-loin-390-clair.png`, `<id>-conflit-390-clair.png`, `<id>-repos-390-cave.png` ; la meilleure ajoute `<id>-repos-1280-clair.png`. Ouvrir chaque image (Read) une fois.
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
`work/missions/2026-11-14-brassins/voies/d1/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments) ; vers 150 k de contexte, finir les images en cours et rendre « REPRISE : RESULTAT.md ».
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes (Read) avant de cocher.
- Fable interdit sous toute forme. Ni commit ni stash. Fichiers de travail : ton OWNS ou `os.tmpdir()` préfixés de l'id de la voie.
Réponse finale au pilote : une ligne.
