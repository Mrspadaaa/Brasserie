# Voie s1 — mini maquettes du compagnon : la réponse d’abord

- Mission : 2026-11-14-compagnon
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 60 tours ; 3 essais par critère
- Dépend de : b-banc
- Décideur en cas de doute : brasseur (par la page de choix) ; pilote pour le reste

## Objectif
Quatre mini maquettes **statiques, non jouables** du compagnon brasseur (série « la réponse d’abord »), chacune une page `etat.html` de 4 cadres de téléphone 390 (accueil, attente, réponse, erreur), capturée en clair et en cave.

## Entrées
- `work/missions/2026-11-14-compagnon/DOSSIER.md` — tout ce qu'il faut savoir (ses mots, la base, les défauts, les données réelles, les exigences, les cadres). Lire en premier ; ne pas relire les sources qu'il résume.
- `work/missions/2026-11-14-compagnon/analyse/cap/planche-390-clair.png` et les captures citées par le dossier — ce qu'il a aujourd'hui.
- `DESIGN.md` — sections citées par le dossier seulement.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-compagnon/voies/s1`

## Consignes
Charger d'abord les skills `boosters-ux`, `impeccable`, `ui-design-system`. Une variante par axe :
- s1a (froide) — la base telle quelle, compactée : chrome replié en une rangée (contexte, conversations, réglages dans un menu), mode dans le champ, réponse ordonnée verdict → geste → prochain contrôle, pastille de niveau
- s1b (tiède) — carte verdict : bandeau de niveau coloré en tête (info / attention / urgent), le geste en gros avec ses nombres, « Prochain contrôle » en puce qui se garde au journal en un geste, le pourquoi replié
- s1c (tiède) — trois lignes fixes « Fais · Pourquoi · Ensuite », chacune une phrase, chacune dépliable ; détails « relu » en une ligne de ce qui a été contrôlé
- s1d (chaude) — forme libre autour de la réponse d’abord
Chaque axe est une piste, pas un carcan : une seule idée par variante, mais un premier écran rempli (pas une page à moitié vide) ; vrais mots et vrais chiffres du dossier. Les autres séries explorent s2 « le geste et le temps » ; s3 « représentations et place » : ne pas les refaire. Pas de Fable, aucun sous-agent. Environ 10 tours par variante.
Capture : puppeteer-core (`C:/Program Files/Google/Chrome/Application/chrome.exe`), page entière, deviceScaleFactor 2 ; `<id>-clair.png`, puis `<id>-cave.png` avec `data-theme="cave"` sur `<html>`. NOTE.md : 14 lignes au plus (idée, chaleur, boosters employés, écart à la base et sa raison).

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Aucun nom de modèle ni de fournisseur d'IA à l'écran (DESIGN.md), ni « USD ».
- Premier plan léger, détail à un toucher ; chrome compact ; peu de texte ; penser en brasseur (verdict et geste d'abord, nombres et unités).
- Rien appliqué sans cases cochées puis validation ; hors ligne : question gardée ; trois modes ; questions suggérées ; remise à zéro confirmée ; « Mes conversations » ; notification ; limites réglables.
- Au doigt à 390 ; jamais type="number" ; virgule décimale ; deux thèmes ; icônes au trait, pas d'emoji ; classes préfixées par l'id (L26) ; aucun appel réseau.
- Plancher à enrichir (L07) ; une capture non regardée ne prouve rien (L12).

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (une ligne par variante : id, idée, images ouvertes oui/non, défauts vus).
- Tests : maquettes statiques, aucun Vitest ; la ligne « Tests » est le contrôle de série écrit dans un fichier : `node work/missions/2026-11-14-compagnon/outils/controle-serie.mjs work/missions/2026-11-14-compagnon/voies/s1 s1a,s1b,s1c,s1d > work/missions/2026-11-14-compagnon/voies/s1/tests.txt` (à la place de `npx vitest run … --reporter=dot > tests.txt`).
- Voie d'écran : 390, clair et cave, les 4 cadres ; images toutes ouvertes avant de rendre.
Réponse finale au pilote : une ligne.
