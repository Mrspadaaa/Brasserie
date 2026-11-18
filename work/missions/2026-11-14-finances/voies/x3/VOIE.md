# Voie x3 — Test d'écran avant déploiement : FN-30 à FN-42

- Mission : 2026-11-14-finances
- Agent : critique
- Modèle : opus
- Niveau : jugement
- Plafond : 70 tours ; 3 essais par critère
- Dépend de : b36f66ef (voie x2)
- Décideur en cas de doute : pilote

## Objectif
Test d'écran (mode « Test d'écran » de `.claude/agents/critique.md`) de la version donnée, sur le banc local, avant sa mise en ligne :
« combien et quels problèmes ? », liste numérotée, bloquants comptés.

## Ce qui a changé (b36f66ef ; détail : `work/missions/2026-11-14-finances/voies/x2/RESULTAT.md`)
- FN-30 « Autre montant » de l'avis ouvre la feuille Payer (l'avis passe au-dessus de la ligne) ; FN-31 « le plus ancien d'abord » suit l'heure de saisie à même date ; FN-32 étiquettes de la barre Payer (« pièce B 12,00 », plus « zz ») ; FN-36 aperçu « après » de « J'ai bien payé » avec « 2,00 à récupérer » ; FN-38 la créance n'apparaît que sur sa pièce, pas sur un doublon du même nom ; FN-39 Doublons désactivé dit « aucun doublon » ; FN-40 bandeau « Opération mise à jour » qui s'efface (6 s, et en changeant de vue) ; FN-41 fiche après Payé/Annuler/Payé : la paire annulée repliée en « annulé » ; FN-42 ligne de la créance nommée par sa pièce.
- Non-régression : FN-33 (double toucher), FN-35 (question sous le payé d'une pièce partielle), FN-37 (Autres frais = pile, bande juste à la main).

## Entrées
- Banc : `http://localhost:3000/?dev-local&finance-demo` (déjà lancé par le pilote, ne pas relancer). Données « ZZ TEST — pièce A/B » saisies dans le seul navigateur de test.
- Scripts de x1 (`work/missions/2026-11-14-finances/voies/x1/`) à copier ici et adapter ; scripts de capture d'origine (copier dans ce dossier, ne pas modifier les originaux) : `work/missions/2026-11-14-finances/voies/w1/sonde.mjs`, `work/missions/2026-11-14-finances/voies/v1/capturer.mjs` (puppeteer-core, Chrome local, profil neuf par configuration).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-finances/voies/x3`
- `work/missions/2026-10-31-ecran-depense/avant-deploiement/b36f66ef` (le sha donné dans le prompt)

## Consignes
- Jouer chaque geste par l'entrée de l'app (Opérations, ligne, ✓ Payé, fiche, Modifier), pas par un raccourci de banc.
- Quatre configurations : 390 tactile et 1280, clair et sombre (`cave`). Au moins 8 états distincts : ligne à payer ; avis juste après ✓ Payé ; après double toucher ; après Annuler ; Modifier de B partielle avec la question ; aperçu après « J'ai bien payé » ; Opérations avec la ligne « À récupérer » et la bande (payé, à payer, dépensé) ; pile ou Synthèse avec Autres frais.
- Relever les nombres de la bande avant et après chaque geste et les vérifier à la main (dépensé sans la créance ; payé = dépensé − à payer).
- Ouvrir chaque capture du tableau en plein format avant de juger (L12).
- `VERDICT.md` au format de `work/missions/2026-10-31-ecran-depense/avant-deploiement/989237c6/VERDICT.md` : première ligne « OK — N problèmes, M bloquants » ; « Version : b36f66ef » ; un tableau « | capture | thème | largeur | état | problèmes | bloquants | » avec une ligne par capture citée ; « Bloquants : M » ; problèmes numérotés ; doutes à part. Ne pas écrire « Pilote : vu » (le pilote l'ajoute).
- Aucun Fable, aucun sous-agent, aucune donnée réelle, ne commite pas.

## Exigences transversales et acquis (recopiés, L05, L06)
- Règle n° 1 : maquettes choisies telles quelles (m5pa-d Payer, m5mo-c Modifier, v6a Opérations) ; un constat qui contredit une maquette choisie est écrit en doute, pas en problème.
- Inconnu ≠ 0 ; hachure = à payer ; rouge = en retard ; le payé ne disparaît jamais ; jamais `type="number"` ; cibles 44 px.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil.
- Tests : aucun Vitest ; la ligne « Tests » est `node scripts/agents/controle-avant-deploiement.mjs b36f66ef --reporter=dot > work/missions/2026-11-14-finances/voies/x3/tests.txt` (le contrôle attend encore « Pilote : vu » : son seul échec permis est celui-là).
Réponse finale au pilote : une ligne (« OK — N problèmes, M bloquants »).
