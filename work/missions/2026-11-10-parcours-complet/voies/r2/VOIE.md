# Voie r2 — rejouer le parcours complet en ligne après le correctif b1 (mission 2026-11-10-parcours-complet)

- Agent : general-purpose (suis `.claude/agents/executant.md`) · Modèle : sonnet · Plafond : 80 tours · Décideur : pilote
- En ligne : https://brasserie-l-affinee.web.app, tag `en-ligne/2026-11-10-parcours` (bundle `index-Cmht_ZH1.js`, à vérifier d'abord).
- Lis : `../../MISSION.md` (étapes 1 à 6, garde-fous), `../../VERDICT.md` (défauts 1 à 7, méthode), `../../jouer/` (connexion, scripts),
  `../b1/RESULTAT.md` (ce qui a changé : PC-1 levure « à régulariser », PC-2 c et d ; a non reproduit ; b sans preuve),
  `../../../2026-11-10-enrichissement-en-ligne/voies/r1/RESULTAT.md` (CONNAISSANCE : retrait d'une dépense payée en deux temps).

## Objectif
Rejouer en entier, sur données « ZZ TEST — parcours r2 » seulement : état de départ relevé ; recette ZZ ; besoins ; achat ZZ sans
justificatif (articles neufs ZZ : vérifier la catégorie choisie, PC-2 a, au vrai geste tactile ; et l'unité après un article du stock,
PC-2 b) ; stock monté ; brassage conduit jusqu'à l'ensemencement (« J'ai ajouté la levure » : lire la page après le toucher et remplir
l'éditeur) ; stock baissé exactement des quantités ; brassin en fermentation ; vente ZZ à un client ZZ ; finances. Puis retrait complet
par les gestes de l'app (vente, brassin, dépense : paiement puis écriture, articles, client par « Supprimer ce client », recette) et
retour aux chiffres de départ. Chaque étape : attendu / lu, capture ouverte.
Règles strictes : un clic ne vise qu'un élément au texte « ZZ » ou un bouton exact sur une fiche ZZ ouverte ; jamais de regex large ;
jamais « Modifier », « Confirmer », « Enregistrer » sur une donnée réelle ; aucune lecture Gemini (saisie sans justificatif). Un geste
qui ouvre autre chose qu'attendu : arrêt, capture, état écrit. Si le contexte s'épuise : « REPRISE : <fichier> » avec la liste exacte
des données ZZ restantes et leurs identifiants.

## Contrôles
- La ligne « Tests » : pas de vitest ; le tableau attendu / lu va dans `tests.txt` de cette voie (comme `--reporter=dot > …/r2/tests.txt`).
- Captures dans `voies/r2/captures/`, toutes ouvertes ; 390 tactile d'abord.

## Possède
`work/missions/2026-11-10-parcours-complet/voies/r2/**`. Rien dans `src/`. Ni commit ni stash. Fichiers de travail : OWNS ou os.tmpdir().

## Rendre
`RESULTAT.md` au fil (tous les 5 éléments) : étapes, défauts numérotés (bloquant ou non), état du retrait. Réponse finale : une ligne.
