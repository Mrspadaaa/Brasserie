# Voie r1 — retrait des données ZZ de l'essai d'enrichissement (mission 2026-11-10-enrichissement-en-ligne)

- Agent : general-purpose · Modèle : sonnet · Plafond : 40 tours · Décideur : pilote
- Lis : `../../VERDICT.md` (section Retrait, état de départ), `../../jouer/e7-retrait.mjs` et sa méthode de connexion, la capture
  `../../captures/e7-02-etape1-390-clair.png` (ouvre-la).

## Objectif
Sur https://brasserie-l-affinee.web.app, par les gestes de l'app seulement :
1. ouvrir la dépense ZZ (TX-995b35cf-dec3-4ac1-97d1-21fb1dc8edf1, 3,00 CHF) et toucher « Annuler cette écriture », confirmer ;
2. puis supprimer les 3 articles ZZ du stock (Nelson Sauvin ZZ, Maris Otter ZZ, US-05 ZZ ; MP-995b35cf-…-0, -1, -2).
Règles strictes : un clic ne vise qu'un élément dont le texte contient « ZZ » ou le bouton exact nommé ci-dessus sur la fiche ZZ
ouverte ; jamais une regex large ; jamais « Modifier », « Confirmer » ni « Enregistrer » sur une donnée réelle ; aucune lecture Gemini.
Si un geste échoue ou ouvre autre chose qu'attendu : arrêter, capture, écrire l'état, rendre ECHEC.

## Contrôles
- Lire après coup : Dépensé 0,00, En caisse 5 663,00, une seule opération en novembre, stock Tous · 53 et À commander · 17.
- La ligne « Tests » : pas de vitest ; le relevé des chiffres va dans `tests.txt` de cette voie (comme `--reporter=dot > …/r1/tests.txt`).
- Captures avant/après dans `voies/r1/captures/`, ouvertes.

## Possède
`work/missions/2026-11-10-enrichissement-en-ligne/voies/r1/**`. Rien dans `src/`. Ni commit ni stash. Fichiers de travail : OWNS ou os.tmpdir().

## Rendre
`RESULTAT.md` au fil (tous les 5 éléments) : chaque geste, effet lu, chiffres finaux, ce qui reste. Réponse finale au pilote : une ligne.
