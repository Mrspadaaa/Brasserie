# Voie e9n — L'Atelier R&D, d'un autre genre

- Mission : 2026-11-14-brassins · Agent : concepteur · Modèle : opus (Fable interdit) · Niveau : conception · Plafond : 45 tours · Dépend de : — · Décideur : brasseur (il choisit sur la page)

## Objectif
Ses mots (15.11), mot pour mot : « · L'Atelier R&D toujours pas super convaincu ». Les 4 versions e9a à e9d sont refusées (« toujours » :
la vue actuelle ne le convainc pas non plus). Faire 4 Ateliers R&D d'un AUTRE genre (L13 : après un refus, changer de genre et partir d'une
référence qu'il connaît) : idées de bières, essais de tarifs, contacts, à faire ; noter une idée, la fiche d'une idée, « Réfléchir à mes projets ».

## Entrées
- Les refusées (Read, repos et geste une fois) : `work/missions/2026-11-14-brassins/voies/e9/e9[a-d]/` et `work/missions/2026-11-14-brassins/voies/k3/VERDICT.md` § e9.
- Ce que fait l'app : `src/components/CreativeLabTab.tsx` (lire les sections et leurs actions). La section Matériel est d'une autre session : on y renvoie.
- Ses mots utiles : `grep -n -i -E "idée|projet|tarif|contact|à faire|lab" work/refonte-frontend/v4/SPEC-BRASSEUR.md | head -30`.
- Gabarit de capture : `work/missions/2026-11-14-brassins/voies/e9/capture.mjs`.
- Revue de la page précédente (pourquoi « pas très clair ») : `work/missions/2026-11-14-brassins/revue-page5/SYNTHESE.md`, puis `critique.md` § B.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/e9n/` : `e9na` à `e9nd` (`etat.html`, PNG, `NOTE.md`), `capture.mjs`, `RESULTAT.md`, `tests.txt`. Rien dans `src/`.

## Consignes
- Écrire d'abord dans RESULTAT.md pourquoi les 4 ne convainquent pas (hypothèses sourcées). 1 froide, 2 tièdes, 1 chaude ; aucune ne
  reprend une forme refusée (pistes d'avancement, chemin, frise des semaines, carte à deux axes).
- `geste` : après « Noter une idée » (le résultat, pas la feuille) ; `idee` : la fiche d'une idée ; `tarifs` : l'essai de tarifs.
- Images par variante : `<id>-repos-390-clair.png`, `<id>-geste-390-clair.png`, `<id>-idee-390-clair.png`, `<id>-tarifs-390-clair.png`, `<id>-vide-390-clair.png`, `<id>-repos-390-cave.png` ; la meilleure ajoute `<id>-repos-1280-clair.png`. Ouvrir chaque image (Read) une fois.
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
`work/missions/2026-11-14-brassins/voies/e9n/GATES.md`, depuis la racine du dépôt. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments) ; vers 150 k de contexte, finir les images en cours et rendre « REPRISE : RESULTAT.md ».
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, toutes ouvertes (Read) avant de cocher.
- Fable interdit sous toute forme. Ni commit ni stash. Fichiers de travail : ton OWNS ou `os.tmpdir()` préfixés de l'id de la voie.
Réponse finale au pilote : une ligne.
