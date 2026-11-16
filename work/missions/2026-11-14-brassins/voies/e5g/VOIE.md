# Voie e5g — Créer un brassin : deux greffes e5na × e5nb

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 40 tours · Dépend de : — · Décideur : brasseur (il choisit sur la page)

## Objectif
Ses mots (15.11), mot pour mot : « e5na proposée Le brassin naît dans sa frise · 4 vues — e5nb La carte fantôme dans la liste · 3 vues
— Les deux sont bien... Je sais pas trop... ». Faire 2 greffes e5na × e5nb, vraiment différentes au repos : la carte fantôme dans la liste
qui s'ouvre sur la frise du brassin à naître. Le geste « Planifier » aboutit sur SA fiche de brassin planifié e1a (« e1a », 15.11, règle n° 1).

## Entrées
- Les parents (Read, chaque image une fois) : `work/missions/2026-11-14-brassins/voies/e5n/e5na/`, `work/missions/2026-11-14-brassins/voies/e5n/e5nb/` (etat.html, PNG, NOTE.md) ; la revue : `work/missions/2026-11-14-brassins/revue-page5/critique.md` points 17 et 18, `ux-ui.md` § e5na et § e5nb.
- Sa fiche planifiée (arrivée du geste) : `work/missions/2026-11-14-brassins/voies/e1/e1a/` ; sa liste : `work/missions/2026-11-14-brassins/voies/e6/e6a/` (la liste de la greffe est celle-là, telle quelle).
- Gabarit de capture : `work/missions/2026-11-14-brassins/voies/e5n/capture.mjs`.
- Revue de la page précédente (pourquoi « pas très clair ») : `work/missions/2026-11-14-brassins/revue-page5/SYNTHESE.md`, puis `critique.md` § B.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/e5g/` : `e5ga` à `e5gb` (`etat.html`, PNG, `NOTE.md`), `capture.mjs`, `RESULTAT.md`, `tests.txt`. Rien dans `src/`.

## Consignes
- Une seule date (celle du brassage) ; un primaire « Planifier » visible dès le repos (accepté avec « date à définir ») ; le brouillon n'est
  compté ni annoncé avant « Planifier » ; la saisie sur une rangée (« NEIPA ▾ · 24 L · F3 ▾ · quand ? ») ; puces sans débordement ; un seul
  statut visible ; le + flottant masqué sur cet écran ; les étapes futures en texte atténué (un seul pointillé : ce qui manque).
- `fiche-390-clair` : l'arrivée sur e1a, telle qu'il l'a choisie, avec le brassin créé.
- Images par variante : `<id>-repos-390-clair.png`, `<id>-geste-390-clair.png`, `<id>-fiche-390-clair.png`, `<id>-vide-390-clair.png`, `<id>-repos-390-cave.png` ; la meilleure ajoute `<id>-repos-1280-clair.png`. Ouvrir chaque image (Read) une fois.
- D'abord, dans RESULTAT.md, en 5 lignes : ce qu'il a dit, ce qu'on en lit, les 2 genres choisis et en quoi ils diffèrent au repos.

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
`work/missions/2026-11-14-brassins/voies/e5g/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments) ; vers 150 k de contexte, finir les images en cours et rendre « REPRISE : RESULTAT.md ».
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes (Read) avant de cocher.
- Fable interdit sous toute forme. Ni commit ni stash. Fichiers de travail : ton OWNS ou `os.tmpdir()` préfixés de l'id de la voie.
Réponse finale au pilote : une ligne.
