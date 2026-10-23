# Voie e1-jeu — Le jeu d'étalonnage du critique

- Mission : 2026-10-23-etalonnage-critique
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote

## Objectif
Un jeu de verdicts réels du brasseur, chacun avec la capture qu'il a jugée, pour éprouver à l'aveugle le critique Fable
(L27). Le jeu ne contient **que ses mots**. Rien du critique, du jury ni du pilote : un verdict d'agent n'est pas un
verdict du brasseur.

## Deux sortes d'items
- **Paire** : il a préféré A à B, d'après ses mots. Il a choisi A dans un lot où B figurait (« y1b est de mon point de
  vue semble meilleur » contre les autres améliorées du lot 21), ou il a dit A meilleur que B. Ne déduis jamais une
  préférence d'un silence ou d'un avis d'agent. A et B viennent du même lot et répondent à la même question.
- **Classe** : une capture et son verdict, rangé en `aime`, `mitige` ou `rejette`, d'après ses mots. Par exemple :
  - « Visuellement horrible, mais la manière dont sont disposés les choses j'aime beaucoup !! » donne `mitige` ;
  - « Aucun me convient... » donne `rejette` ;
  - « r6n2 donne vraiment bien » donne `aime`.

## Ce qu'il faut
- **24 paires au moins et 12 classes au moins**, dont 4 `aime` et 4 `rejette` au moins.
- Répartis sur les lots, du lot 4 au lot 23, et sur les sujets : rail, radar, barres, fiche, Comparer, Dryhopper, et
  picto (le picto « épicé » choisi le 23.10, f1 « cannelle et girofle croisés », contre d'autres propositions de la
  planche r4d).
- **La capture qu'il a vue**, version comprise : la variante améliorée et non la v0 si c'est l'améliorée qu'il a
  jugée. Le premier écran à 390 px de préférence, sinon la capture qu'il a commentée, par exemple la fiche ouverte.
- Chaque item porte :
  - ses mots exacts, entre « », avec leur date ;
  - la ligne de SPEC où ils figurent.

## Entrées
- `work/refonte-frontend/v4/SPEC-BRASSEUR.md` : § 1 « Les fils de fer … », « La baseline l8 », « Le lot 21, son
  retour », « Le lot 22, son retour », le picto, et le § 6 (verdicts sur les versions passées) ;
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/donnees/elements-notes.json` : 37 éléments notés, avec la capture ;
- les dossiers de captures : `work/refonte-frontend/v4/ecran-1/fils*/captures/`, `.../base/captures/`, et pour les
  pictos `fils22-picto-epice*/`. Passe chaque chemin par Glob.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/etalonnage/jeu.json`
- `work/refonte-frontend/v4/etalonnage/JEU.md`
- `work/missions/2026-10-23-etalonnage-critique/voies/e1-jeu/RESULTAT.md`

## Format de `jeu.json`
```json
{ "maj": "AAAA-MM-JJ",
  "items": [
    { "id": "p-l21-y1b-x3b", "type": "paire", "lot": "21", "sujet": "dryhopper",
      "a": { "variante": "y1b", "capture": "work/…/y1b-….png" },
      "b": { "variante": "x3b", "capture": "work/…/x3b-….png" },
      "prefere": "a", "mots": "« y1b est de mon point de vue semble meilleur. »", "date": "2026-10-20",
      "source": "SPEC-BRASSEUR.md, Le lot 21, son retour" },
    { "id": "c-l8", "type": "classe", "lot": "18", "sujet": "disposition", "variante": "l8",
      "capture": "work/…", "classe": "mitige", "mots": "« Visuellement horrible, mais … »", "date": "2026-10-19",
      "source": "…" } ] }
```
Chemins depuis la racine du dépôt. Dans `JEU.md` : un tableau lisible (id, lot, sujet, verdict, ses mots), puis les
verdicts que tu n'as pas pu prendre, faute de capture, avec la raison.

## Rendre
`RESULTAT.md` :
- ligne 1 : `OK — <n> paires, <m> classes` ou `ECHEC — <cause>` ;
- puis les sorties décisives des critères ;
- `CONNAISSANCE : …` ou `aucune` ;
- `LEÇON PROPOSÉE : …` ou `aucune`.

Réponse finale : une ligne.
