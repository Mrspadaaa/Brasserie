# Voie r2 — Recettes, série v0 n° 2 (genre neuf)

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 45 tours · Dépend de : — · Décideur : brasseur (il choisit sur la page)

## Objectif
Ses mots : « Recettes : aucune … Ça resoud aucune de mes problématique » (15.11), après deux séries refusées (e8a–e8d, e8na–e8nd), et « Le carnet de recettes, pas très compact, pas super convaincu quand il y aura des dizaines de recette » (15.11). Il ne s'agit plus d'améliorer une forme : partir de SES problèmes (`work/missions/2026-11-14-brassins/voies/a2/PROBLEMES.md` § Recettes, « Ses problèmes »,
mot pour mot et datés) et changer de genre de solution (L13). Série 2 sur 2 : prendre les genres 5 à 7, et un quatrième de ton cru (une combinaison ou une référence qu'il connaît) de
« Genres de solution pas encore essayés » ; une maquette par genre, chacune résolvant nommément au moins deux de ses problèmes (numéros dans NOTE.md).

## Entrées
- `work/missions/2026-11-14-brassins/voies/a2/PROBLEMES.md` § Recettes (tout) : ses problèmes, ce que fait l'app, pourquoi les refusées n'ont rien résolu, les genres.
- Ses choix acquis, à respecter tels quels autour : liste e6a (`work/missions/2026-11-14-brassins/voies/e6/e6a/`), fiche planifiée e1a (`work/missions/2026-11-14-brassins/voies/e1/e1a/`), coque e11a (`work/missions/2026-11-14-brassins/voies/e11/e11a/`), Atelier e9na (`work/missions/2026-11-14-brassins/voies/e9n/e9na/`) : repos seulement.
- Gabarit de capture : `work/missions/2026-11-14-brassins/voies/e5g/capture.mjs`.
- Revue de la page précédente (pourquoi « pas très clair ») : `work/missions/2026-11-14-brassins/revue-page5/SYNTHESE.md`, puis `critique.md` § B.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/r2/` : `r2a` à `r2d` (`etat.html`, PNG, `NOTE.md`), `capture.mjs`, `RESULTAT.md`, `tests.txt`. Rien dans `src/`.

## Consignes
- 1 froide, 2 tièdes, 1 chaude. Aucune ne reprend une forme refusée (lire les `Idée` des NOTE.md refusées citées par PROBLEMES.md, pas leurs images).
- NOTE.md ajoute « Problèmes résolus : n° … » (numéros de PROBLEMES.md).
- `geste` : le geste le plus fréquent (retrouver ou brasser) en cours ; `recette` : une recette ouverte (la fiche et l'édition sont d'une autre session : montrer l'entrée, pas l'assistant) ; `vide` : carnet vide. Données : 5 recettes réelles de DONNEES-COMMUNES et 30 d'exemple, dites telles dans NOTE.md.
- Images par variante : `<id>-repos-390-clair.png`, `<id>-geste-390-clair.png`, `<id>-recette-390-clair.png`, `<id>-vide-390-clair.png`, `<id>-repos-390-cave.png` ; la meilleure ajoute `<id>-repos-1280-clair.png`. Ouvrir chaque image (Read) une fois.
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
`work/missions/2026-11-14-brassins/voies/r2/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments) ; vers 150 k de contexte, finir les images en cours et rendre « REPRISE : RESULTAT.md ».
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes (Read) avant de cocher.
- Fable interdit sous toute forme. Ni commit ni stash. Fichiers de travail : ton OWNS ou `os.tmpdir()` préfixés de l'id de la voie.
Réponse finale au pilote : une ligne.
