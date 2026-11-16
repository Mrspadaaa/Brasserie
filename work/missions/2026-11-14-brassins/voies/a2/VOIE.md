# Voie a2 — Ses problèmes réels : « Créer un brassin » et « Recettes »

- Mission : 2026-11-14-brassins · Agent : auteur · Modèle : sonnet · Niveau : analyse · Plafond : 40 tours · Dépend de : — · Décideur : pilote

## Objectif
Ses mots (15.11), mot pour mot : « Fermentation : gfc · Filtres : e6a + e6c · Créer : aucune · Carnet : e3gb · Recettes : aucune · Atelier :
e9na Refait pour celle aucune... Ça resoud aucune de mes problématique ». Trois séries de « Créer un brassin » (e5a–e5d, e5na–e5nd, e5ga–e5gb)
et deux du carnet de recettes (e8a–e8d, e8na–e8nd) sont refusées. Avant tout dessin : écrire SES problèmes, pas les nôtres, sourcés.

## Entrées
- Ses mots datés : `grep -n -i -E "recette|carnet|créer|nouveau brassin|planifi|préparer|brasser|rebrasser|lancer|dizaines" work/refonte-frontend/v4/SPEC-BRASSEUR.md`
  (lire chaque passage utile à sa ligne) ; PRODUCT.md § brassins et recettes ; `cerveau/brasseur/` (penser-brasseur, pas-de-cockpit).
- L'app aujourd'hui : captures `voies/a1-banc/captures/` (nouveau-brassin*, recettes*, liste*) et `voies/cv/COUVERTURE.md` ; le code :
  `src/domain/fabActions.ts`, la feuille « Préparer un brassin » (`grep -rln "Préparer un brassin" src | head`), le sous-onglet Recettes.
- Ce qui a été refusé et pourquoi : NOTE.md « Idée » de chaque variante refusée ; `voies/k2/VERDICT.md` § e5 et e8, `voies/k6/VERDICT.md`,
  `voies/k9/VERDICT.md` § e8n, `voies/k7/VERDICT.md` § e5g ; `revue-page5/`.
- Le travail réel : ses vraies recettes et brassins se lisent en ligne en LECTURE SEULE seulement si `cerveau/agents/verification-locale.md`
  le permet ; sinon `DONNEES-COMMUNES.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/a2/` (`PROBLEMES.md`, `RESULTAT.md`, `tests.txt`). Rien dans `src/`. Ni commit ni stash.

## Consignes
- `PROBLEMES.md`, deux sections (`## Créer un brassin`, `## Recettes`), chacune :
  1. `### Ses problèmes` : numérotés, chacun avec sa citation mot pour mot, sa date et sa ligne SPEC ; distinguer ce qu'il dit et ce qu'on en déduit.
  2. `### Ce que l'app fait aujourd'hui` : le parcours réel, en gestes comptés, captures citées.
  3. `### Pourquoi les séries refusées n'ont rien résolu` : par série, le problème qu'elle visait et celui qu'il a, en une ligne.
  4. `### Genres de solution pas encore essayés` : au moins 6, chacun parti d'une référence qu'il connaît (outil, objet, geste de brasserie)
     ou d'un autre genre (L13), et du problème qu'il résout ; aucun ne reprend une forme refusée.
- Rien inventé : un problème sans citation est marqué « déduit » avec sa source.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Penser brasseur (L04) ; pas de cockpit ; jamais de donnée réelle écrite ; Fable interdit.

## Critères
`work/missions/2026-11-14-brassins/voies/a2/GATES.md`, depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments) ; vers 150 k, « REPRISE : PROBLEMES.md ».
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ; `tests.txt` porte la sortie des CHECK, au même format que `--reporter=dot > …`.
Réponse finale au pilote : une ligne.
