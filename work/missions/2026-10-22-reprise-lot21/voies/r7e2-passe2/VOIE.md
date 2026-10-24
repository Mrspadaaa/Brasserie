# Voie r7e2-passe2 — Dryhopper, passe 2 de e5

- Mission : 2026-10-22-reprise-lot21
- Agent : concepteur (l'agent de r7e-dryhopper, relancé par SendMessage)
- Modèle : opus
- Niveau : conception
- Étape : passe 2 (entonnoir, M13)
- Plafond : 60 tours ; 3 essais par critère
- Dépend de : r7-tri, r0d-controles-dryhopper
- Décideur en cas de doute : brasseur (il choisit parmi les cinq) ; pilote pour le contrat

## Lire d'abord
Dans `work/refonte-frontend/v4/SPEC-BRASSEUR.md`, le § 0 « Ce qui vaut aujourd'hui », puis les sections de y1b, x3b
et a2b. Au lieu de DEFAUTS-RECURRENTS.md en entier : `work/refonte-frontend/v4/DEFAUTS-COURT.md`.

## Objectif
Ton concept **e5** a été retenu par le critique parmi les 56 (`work/refonte-frontend/v4/ecran-1/fils23-dryhopper/tri/SYNTHESE.md`, sections « Candidates » et
« Greffes »). Améliore-le en une page finie, `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe2/e5/etat.html` : applique ses greffes et ses retouches, et les
retouches communes. Tous les contrôles deviennent obligatoires. Le brasseur verra les cinq candidates améliorées en tête
de la page, puis les 56.

## Ce qui devient obligatoire en passe 2
- **La baseline** : y1b (le moment glissé par 5′, « face à ta stout », la jauge d'amertume, le dock sous le pouce), x3b
  réduit en fin de frise, la levure en dernière étape ou en pont (garde la forme de ton concept et dis-la dans la NOTE).
- **Les acquis de Dryhopper** (`controle-acquis.mjs --outil=dryhopper`, écrit par r0d) : geste, frise, valeurs,
  levure, balisés `data-acquis`.
- **Un seul facteur libre, le moment** (D98). Un facteur de contexte peut porter un seul bouton d'édition qui ouvre une
  feuille (D98 (b), `--edition`).
- **80 mots au plus** au premier écran (en v0, certains concepts en avaient jusqu'à 207).
- Honnêteté : simulé marqué « ~ », source citée, inconnu hachuré, jamais 0 ; α du lot puis plage des fiches (D87).
- Le picto « épicé » de la planche standard est celui qu'il a choisi (cannelle et clou croisés) : reprends-le tel quel.
- Ce que la grille sait du moment, et ses limites : `cerveau/metier/dryhop-moment.md` (la grille sature à 2 j ; Pomona
  ne change que l'actif : calcule l'écart d'un aperçu avant de le dessiner, M07).

## Entrées
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/tri/SYNTHESE.md` et `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/tri/serie-e.md` — ce que le critique a vu, tes greffes et tes retouches.
- Ton concept v0 : `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/e5/etat.html`, ta `NOTE.md` de série et ton générateur. Ne modifie pas la v0.
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/BRIEF-SERIES.md` — la question, la baseline, les données.
- `work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs` et `work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs` — lis leurs en-têtes (`--outil=dryhopper`, `--edition`).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe2/**` (la page `e5/etat.html`, son générateur, `NOTE.md`, `captures/`)
- `work/missions/2026-10-22-reprise-lot21/voies/r7e2-passe2/RESULTAT.md`
Fichiers de travail dans `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe2/captures/travail/` ou dans `os.tmpdir()`, jamais à la racine (L17). Copie ton générateur
avant une retouche scriptée ; pas de `String.replace` avec une chaîne qui contient `$` (L26).

## Captures (dans `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe2/captures/`)
`e5-390.png` (page entière), `e5-premier-ecran.png`, `e5-toucher-390.png` (après un geste sur le moment). Ouvre
chacune en image (L12).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : ligne 1, ce qui a changé depuis la v0 (greffes, retouches), les sorties décisives, les captures ouvertes
par leur nom, ta prédiction de sa réaction, `CONNAISSANCE : …` et `LEÇON PROPOSÉE : …`. Dans `work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe2/NOTE.md` : `## Passe 2`
(le même contenu) et `## Baseline` (ce qui est repris, chaque écart avec sa raison). Réponse finale : une ligne.
