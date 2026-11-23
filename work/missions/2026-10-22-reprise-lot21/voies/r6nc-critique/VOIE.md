# Voie r6nc-critique — Défauts vérifiables de r6n1 et r6n2

- Mission : 2026-10-22-reprise-lot21
- Agent : critique
- Modèle : fable
- Niveau : jugement
- Plafond : 30 tours ; 3 essais par critère
- Dépend de : r6n1-reprise-tout, r6n2-reprise-toucher
- Décideur en cas de doute : pilote

## Objectif
Relever, sur les captures, les défauts **vérifiables** des deux maquettes de reprise (r6n1, r6n2) avant qu'elles soient
montrées au brasseur. Tu ne tries pas, tu n'étoiles pas, tu ne classes pas, et tu ne rejettes jamais la diversité : le
brasseur choisit (L27). Les propositions « épicé » ont leur propre verdict (r4d-verdict) : ne les juge pas ici.

## Pourquoi tu es bridé (L27, 22.10)
Au lot 22, le critique a étoilé quatre variantes que l'utilisateur a trouvées « pas super calibré », et rejeté
r6a, que le brasseur a choisie. Pire, il a rejeté la première planche « épicé » à six genres : la voie s'est
resserrée sur le seul piment, et le brasseur a répondu « Il y a que 3 variante, qui sont toutes quasiment
identique ??? ». Ton étalonnage sur ses vrais verdicts n'est pas encore fait : ton avis est indicatif.

## Ce que tu fais
- Ouvre chaque capture en image (Read sur le PNG), plusieurs par tour : `fils22-comparer/captures/r6n1-*.png`,
- Pour r6n1 et r6n2 :
  1. r6a est-elle gardée telle qu'il l'aime (trois colonnes, colonne « Ta stout », radar au-dessus, barres
     de l5b) ? Pour r6n2, le premier écran est-il celui de r6a ?
  2. Chaque élément de `donnees/elements-notes.json` est-il vraiment là où la NOTE le dit (repris, en
     contexte, en pont) ? Ouvre les captures que l'inventaire cite pour comparer. Un écart a-t-il une raison
     juste ?
  3. Un seul facteur libre, la variété ? Le radar sature-t-il encore (D103) ? Les acquis (D99) ?
  4. Données honnêtes : chaque nombre de la capture conforme à `donnees/comparer-stout.json` (L14 : lis la
     bonne ligne d'une étude à plusieurs variétés).

## Verdicts
- Une ligne par livrable, au format lu par le rejeu : `- **r6n1** — ACCEPTÉ : …` ou `- **r6n1** — REJET : …`
  (de même pour `r6n2`). Les défauts vont en sous-lignes indentées.
- **ACCEPTÉ** est le défaut : un livrable montrable, même imparfait, avec ses défauts listés pour le brasseur.
- **REJET** seulement si le livrable casse une règle écrite : il cite la ligne de `DEFAUTS-RECURRENTS.md`
  (D60, D98, D99, D101 ter, D103, D104…) ou la phrase de `SPEC-BRASSEUR.md`, et la correction précise. Un goût
  n'est pas une règle. Chaque REJET sera relancé ou écarté par le pilote (M12).
- Aucune ★, aucun classement, aucun « meilleur ».

## Entrées
- `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`, `work/refonte-frontend/v4/SPEC-BRASSEUR.md`
  (« Le lot 22, son retour »), `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`, `cerveau/produit/acquis-valides.md`.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/` : `BRIEF-REPRISE.md`, `r6n1/NOTE.md`, `r6n2/NOTE.md`,
  `donnees/elements-notes.json`, `donnees/comparer-stout.json`, `captures/`.
  (VOIE.md, RESULTAT.md : à ne pas croire sans les captures).

## Possède (seuls chemins où écrire)
- `work/missions/2026-10-22-reprise-lot21/voies/r6nc-critique/RESULTAT.md`

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : ligne 1 (`OK — …`), les deux lignes de verdict et leurs sous-lignes, les captures ouvertes par
leur nom, `LEÇON PROPOSÉE : …` (ou `aucune`). Réponse finale au pilote : une ligne.
