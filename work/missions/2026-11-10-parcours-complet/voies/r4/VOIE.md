# Voie r4 — finir le retrait des données ZZ du parcours r2/r3 (mission 2026-11-10-parcours-complet)

- Agent : general-purpose (suis `.claude/agents/executant.md`) · Modèle : sonnet · Plafond : 50 tours · Décideur : pilote
- Lis : `../r3/RESULTAT.md` en entier (chiffres de départ, « REPRISE (agent neuf) », scripts `../r3/r3-m.mjs` et sa garde ZZ),
  `../../jouer/etape5e-retrait.mjs`, `../../../2026-11-10-enrichissement-en-ligne/voies/r1/RESULTAT.md` (retrait d'une dépense payée).

## Objectif
Sur https://brasserie-l-affinee.web.app, par les gestes de l'app seulement, dans l'ordre de « REPRISE (agent neuf) » de r3 :
brassin ZZ LOT-017 (vérifier si le malt revient au stock), dépense ZZ 12,50 (Annuler cette écriture), recette REC-MWANWMSU, 3 articles
ZZ, client ZZ (Supprimer ce client) ; puis comparer aux chiffres de départ écrits dans r3. LOT-016 « neipa v3 » et toute donnée sans
« ZZ » : n'y touche jamais. Règles strictes : un clic ne vise qu'un élément au texte « ZZ » ou un bouton exact sur une fiche ZZ ouverte ;
jamais de regex large ; jamais « Modifier », « Confirmer », « Enregistrer » sur une donnée réelle ; aucune lecture Gemini. Un geste qui
ouvre autre chose qu'attendu : arrêt, capture, état écrit. Ouvre chaque capture avant de conclure. À 150 k : « REPRISE : <fichier> ».

## Contrôles
- La ligne « Tests » : pas de vitest ; le tableau départ / lu va dans `tests.txt` de cette voie (comme `--reporter=dot > …/r4/tests.txt`).
- Captures dans `voies/r4/captures/`, ouvertes.

## Possède
`work/missions/2026-11-10-parcours-complet/voies/r4/**`. Rien dans `src/`. Ni commit ni stash. Fichiers de travail : OWNS ou os.tmpdir().

## Rendre
`RESULTAT.md` au fil : chaque geste, effet lu, ce qui reste (avec ids). Réponse finale : une ligne.
