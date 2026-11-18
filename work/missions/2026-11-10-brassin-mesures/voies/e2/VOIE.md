# Voie e2 — VB-2 en ligne : quelle écriture part à l ouverture de Mesurer (lecture seule, requêtes coupées) (mission 2026-11-10-brassin-mesures)

- Agent : executant · Modèle : sonnet · Plafond : 30 tours · Décideur : pilote
- En ligne : https://brasserie-l-affinee.web.app, bundle `index-a3wBuonJ.js` (tag en-ligne/2026-11-10-mesures), à vérifier d'abord.
- Connexion et méthode : `work/missions/2026-11-10-parcours-complet/jouer/lib.mjs` (navigateur connecté, 390 tactile).

## Objectif
Ouvrir le brassin en cours du brasseur (Brassins › carte « Brassage en cours » › Reprendre), sans rien écrire : capturer la Conduite au
repos à 390 (carte « Relevés du jour » sous l'horloge ? cases « ? » ?), toucher une case « ? » : la feuille Mesurer s'ouvre-t-elle sur le
bon onglet avec le curseur ? Toucher la piste (aucun Enregistrer), capture, puis fermer par × ; puis 1280. Lire la console (erreurs).
Interdit : Enregistrer, Note, cocher, ±5, pause, Fin du palier, tout bouton qui écrit ; ne quitter la feuille que par ×.

## Contrôles
- La ligne « Tests » : pas de vitest ; le relevé attendu / lu va dans `tests.txt` de cette voie (comme `--reporter=dot > …/e2/tests.txt`).
- Captures dans `voies/e2/captures/`, toutes ouvertes.

## Possède
`work/missions/2026-11-10-brassin-mesures/voies/e2/**`. Rien d'autre. Ni commit ni stash.

## Rendre
`RESULTAT.md` tenu au fil (après chaque geste) : attendu / lu, problèmes numérotés. Réponse finale : une ligne.

## Différence avec e1 (pilote)
Profil Chrome neuf (aucune file locale `brew-outbox-*` héritée), connexion comme e1 (`../e1/RESULTAT.md`, script `scratchpad/e1/e1.mjs` si
présent). **Avant tout geste**, `page.setRequestInterception(true)` : toute requête non GET est **annulée** (`abort`) et journalisée
(URL, méthode, corps complet) dans `requetes.json` de cette voie. Puis : Reprendre (noter les requêtes), attendre 10 s (noter), toucher
une case « ? » (noter), toucher la piste (noter), × (noter). Dis à quel geste la première requête non GET apparaît et ce que contient son
corps (champs qui diffèrent : `version`, aire, étape, mesures, brouillon). Aucune écriture ne doit partir : si l'interception n'est pas
active, ne fais aucun geste.
