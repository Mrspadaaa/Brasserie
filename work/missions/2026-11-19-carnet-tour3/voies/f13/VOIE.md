# Voie f13 — Carnet : clavier ouvert (PCN-37) et Créer · après à 1280 (PCN-27), mission 2026-11-19-carnet-tour3
Lire `../../COMMUN-CODE.md` (règles communes). Code : worktree `C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet`
(branche claude/port-carnet-1711 ; ne jamais changer de branche, ni stash, ni reset).
Possède : src/ui/carnets/* (CSS compris), tests/unit/carnetsTour3F13*.test.ts(x), ce dossier `voies/f13/`.
Interdit : src/ui/etapeLevure/**, StocksTab.tsx, articleACreer.ts, stockArticleNeufE11.test.ts, wizardTour3Bw.test.tsx (travail d'autres sessions).

## PCN-37 (G) — clavier ouvert à 390
Constat (critique 4 n° 37) : « Clavier ouvert, 300 px à 390 : bulle G8, puce et champ prennent la moitié de l'écran ; ~180 px de carnet visibles. »
Règle CARNET-CLAV (DEFAUTS-RECURRENTS.md l. 398, ses mots : « le champs text en bas ? SI non sur mobile le clavier cache tout ») :
à 390 × 844 avec un clavier simulé de 300 px (visualViewport), le champ en saisie et la dernière note restent visibles au-dessus du
clavier, sans défilement. Un clavier se simule (visualViewport réduit à 544 px de haut) : « vrai téléphone requis » n'est pas une
réponse. Faire : test qui échoue avant (hauteur occupée par bulle + puce + champ quand le clavier est ouvert), puis compacter ce bloc
pendant la saisie clavier (ex. bulle G8 réduite à une ligne ou repliée tant que le clavier est ouvert, rendue à la fermeture) pour
qu'au moins ~60 % de la hauteur visible montre le carnet. Rien retiré au repos (sa maquette prime au repos).

## PCN-27 (G) — Créer · après à 1280
Constat (critique 4 n° 27) : « Créer · après à 1280 : en-tête réduit, « Photos · aucune » absent ; « Idée · 17 nov. / Ensuite… »
réduit à une pastille (R11). » Sa maquette choisie (port du carnet : g5:v04-4 ; retrouver le fichier par
`work/missions/2026-11-17-port-carnet/MISSION.md` et `work/refonte-frontend/v4/choix/ecrans.json`) est la base, reprise telle quelle
(règle n° 1, L03). Comparer côte à côte maquette et app, état « Créer · après », à 1280 et 390 : inventaire élément par élément.
Écart avec la maquette → porter la maquette. La maquette montre elle-même la forme réduite → `ecarte` avec la preuve (capture de la
maquette). « Photos · aucune » vide reste masquée (PCN-115, déjà corrigé) : ne pas la réafficher si la maquette ne la montre pas vide.
Données de test : `?dev-local` ou banc `?preview=carnets` ; aucun appel Gemini (les réponses IA sont simulées par le banc).

## Preuves (obligatoires)
- RESULTAT.md tenu au fil : une ligne ajoutée dès qu'un id est fini (une limite de tours ne doit rien perdre) :
  `id | corrige/ecarte | commit | preuve`.
- Tests : `npx vitest run <fichiers> --reporter=dot > voies/f13/tests-rouge.txt` (avant correctif) puis `> voies/f13/tests-vert.txt`
  (après), plus `npx vitest run tests/unit/carnets* --reporter=dot > voies/f13/tests-carnets.txt` et `npx tsc --noEmit -p .` propres ;
  la ligne « Tests » de RESULTAT.md cite ces fichiers et leurs totaux.
- Captures 390 (tactile, clavier simulé pour PCN-37) et 1280 de chaque écran touché, thème clair et sombre, ouvertes (Read de l'image)
  avant de conclure : skill `webapp-testing` (`Brasserie/.claude/skills/webapp-testing/SKILL.md`), serveur Vite de port-carnet sur un port
  libre de 5201 à 5210, arrêté ensuite. Captures dans `voies/f13/captures/`, maquette comprise pour PCN-27.
- Commit par chemins dans port-carnet (jamais `git add -A`), message « Carnet tour 3 (f13) : PCN-37, PCN-27 … » terminé par
  « Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com> ». Puis `git status --short` : seuls tes fichiers.
- Plafond 100 tours ; à 200 k : écrire REPRISE.md et rendre « REPRISE : voies/f13/REPRISE.md ». Réponse finale : une ligne.

## Tour 2 (critique Opus, `CRITIQUE.md`, 9 problèmes)
Agent neuf : lire VOIE.md (règles et Preuves ci-dessus, inchangées), RESULTAT.md (état du tour 1, commit 175c511f5) et CRITIQUE.md.
Corriger les n° 1, 2, 3, 4, 5, 6, 7 et 9, chacun avec un test qui échoue avant dans `tests/unit/carnetsTour3F13b.test.tsx` :
- n° 1 (CARNET-CLAV) : à l'ouverture du clavier, la dernière note du carnet se place d'elle-même juste au-dessus du champ (défilement
  fait par l'app, pas par le doigt) ; mesuré à 390×844 et 390×660 avec clavier simulé 300 px ;
- n° 3 : la bulle G8 ne doit pas couper le sens au milieu d'un mot ; garder deux lignes serrées plutôt qu'une ligne tronquée, tant que le
  carnet visible reste ≥ 60 % à 390×844 ;
- n° 4 : titre affiché avec sa majuscule initiale (« Embouteillage »), sa phrase gardée telle quelle dans « « embouteillage » · votre
  phrase en titre » ; affichage seulement (src/domain/carnets/modele.ts ou le composant), données inchangées ;
- n° 5, 6, 7 : porter de g5:v04-4 la bande grise et son filet, la couleur des pictos, le bandeau tel quel (règle n° 1) ;
- n° 2, 9 : coupures nettes → « … » ou ligne entière.
n° 8 (crayon près du titre) : écarté, R03/R12 de sa maquette le veulent (✎ près du titre, g5:v03-6). Captures et tests dans les
mêmes dossiers, suffixe `-t2`. Commit « Carnet tour 3 (f13, tour 2) : … ». Ajouter une section « Tour 2 » à RESULTAT.md.

## Tour 3, dernier (critique Opus, `CRITIQUE-T2.md`, 5 m)
Agent neuf : lire VOIE.md (règles, Preuves), la section « Tour 2 » de RESULTAT.md (commit 96abe35fe) et CRITIQUE-T2.md.
Corriger les n° 1 à 5 de CRITIQUE-T2.md, et retirer le filet gris au-dessus du champ (absent de g5:v04-4, règle n° 1), chacun avec un
test qui échoue avant dans `tests/unit/carnetsTour3F13c.test.tsx` ; n° 4 : le champ reprend le texte de la maquette (« Écrire, ou coller
un lien… ») et s'aligne sur la liste. Ne rien casser de ce que le tour 2 a réglé (tests F13 et F13b verts). Captures suffixe `-t3`,
section « Tour 3 » dans RESULTAT.md, commit « Carnet tour 3 (f13, tour 3) : … ».
