# Voie critique — test d'écran du tour 3 (avant mise en ligne)

- Mission : 2026-11-19-tour3-correctifs
- Agent : critique
- Modèle : opus (Fable interdit)
- Niveau : jugement
- Plafond : 90 tours
- Décideur en cas de doute : pilote

## Objectif
Test d'écran (mode « Test d'écran » de `.claude/agents/critique.md`) des corrections du tour 3, sur l'app réelle servie
en local depuis une copie propre de HEAD 8982b959b : **http://localhost:3020** (serveur déjà lancé, ne pas le relancer,
ne rien lancer par `npm run dev`). Question : « combien et quels problèmes ? », liste numérotée.

## Méthode
- Banc puppeteer-core (skill webapp-testing), dans ce dossier. Tailles : 390×660 tactile (`hasTouch`, `isMobile`),
  844×340 tactile, 1280×800. Deux thèmes : clair et sombre (cave). **Le thème sombre se règle dans l'app** (Plus ›
  « Thème sombre (cave) », ou la clé de stockage local que l'app lit : la trouver dans `src/` de la copie
  `C:/Users/mrspa/AppData/Local/Temp/t3-propre`) ; prouver qu'il a pris : couleur de fond de `body` différente entre
  les deux captures (une paire identique = capture fausse, à refaire).
- Entrées : `?dev-local` (app entière, données locales simulées) ; `?preview=calendrier&jeu=brasseur` (calendrier) ;
  `?preview=stock` (fiches du stock). Toute donnée créée s'appelle « ZZ TEST — … ». Gemini toujours simulé : ne
  déclencher aucun appel réel (le serveur local n'a pas de clé ; un appel qui part = défaut à signaler).
- Ouvrir (Read) chaque capture avant de juger (L12). Mesures au DOM quand un chiffre est en jeu.

## Points à juger (chacun : fait / pas fait, et défauts vus)
1. T2-1 Calendrier 390 : courbe alignée (bouton règle) → une seule rangée d'axe (semaines), aucun mois dans la courbe.
2. T2-2 Calendrier : une barre minuscule (brassin d'un jour) et un nom posé à côté de sa barre ouvrent la fiche au toucher.
3. T2-5 Calendrier 844×340 : plein écran → 1re barre de la frise ≤ 25 % de la hauteur (mesure) ; au repos, noter le %.
4. T2B-2 Calendrier 390 : aucun libellé de mois coupé au bord.
5. T2-3 Finances › Opérations : période précédente avec une dépense « à payer » datée d'aujourd'hui → l'en-tête dit
   « … 0 opération · 1 à payer » et la ligne est listée.
6. T2-4 Fiche d'une dépense à payer : bouton « Confirmer le paiement » ; « Corriger une erreur de saisie » ›
   « Retirer cette écriture » retire la ZZ TEST de la liste.
7. T2-6 Stocks › Courses : « Rien à commander » dit une fois (replié et déplié) ; le compte dit « N manquent · K au seuil »
   et N = la pastille « manque N » d'Étagère.
8. T2-7 Stocks › Étagère : la page défile avec la fenêtre (en-tête qui part), aucune boîte qui défile dedans.
9. T3-5 Stocks › Courses : la ligne des recettes d'un article ne répète plus la même recette.
10. T2B-1 Brassins › brasser depuis une recette au matériel non figé : « Planifier » grisé, bouton « Adapter à mon matériel
    actuel » qui, touché, rend « Planifier » actif et dit « Matériel de … pris pour ce brassin » ; geste joignable au pouce
    à 390 et 844×340 (défiler compris).
11. T2B-3 Recette › Levure : aller Ma levure → Chercher → Ma levure ; temps du retour (mesure `performance.now()`
    autour du clic jusqu'au rendu), avant ≈ 1,2 s en ligne.
12. Bouton IA du stock (commit 4daf08e98) : fiches levure, malt et houblon incomplètes → bouton « Compléter avec l'IA »
    dans la carte « Fiche » ; captures 390 et 1280, clair ET sombre (les quatre différentes) ; aucun appel réseau réel.

## Rendre
- `RESULTAT.md` tenu au fil (mis à jour tous les 3 points) : une limite de tours ne perd rien.
- Tests : aucun vitest à lancer ici (les voies l'ont fait) ; si un doute de calcul surgit :
  `npx vitest run <fichier> --reporter=dot > tests.txt` depuis la copie propre.
`VERDICT.md` dans ce dossier : tableau point × (390 clair, 390 sombre, 844, 1280) avec fait / pas fait / non joué,
puis « Combien et quels problèmes ? N » en liste numérotée (gravité : bloquant = données ou geste principal ;
gênant ; mineur), captures citées. Les captures 390 et 1280, clair et cave, ouvertes. Réponse finale : une ligne.
