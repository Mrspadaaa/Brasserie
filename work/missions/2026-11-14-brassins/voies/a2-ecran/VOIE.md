# Voie a2 — Test d'écran des brassins (combien et quels problèmes)

- Mission : 2026-11-14-brassins
- Agent : critique
- Modèle : opus (Fable interdit)
- Niveau : jugement
- Plafond : 30 tours ; 3 essais par critère
- Dépend de : a1
- Décideur en cas de doute : pilote

## Objectif
Mode « Test d'écran » de `.claude/agents/critique.md`, sur les captures de la voie a1 : « combien et quels problèmes il y a ? »,
liste numérotée en brasseur, puis les doutes à part. C'est l'analyse qui nourrit les mini maquettes : ce qui ne va pas sur la liste
des brassins, la fiche d'un brassin et le suivi de fermentation.

## Entrées
- `work/missions/2026-11-14-brassins/voies/a1-banc/captures/` (156 PNG, nom `<écran>-<état>-<390|1280>-<clair|cave>.png`).
- `work/missions/2026-11-14-brassins/voies/a1-banc/TROUS.md` (trous fonctionnels, déjà établis : ne pas les refaire, les citer).
- Ses mots : fin de `work/refonte-frontend/v4/SPEC-BRASSEUR.md` (10.11 à 14.11 : curseurs, « Ça invite pas au mesures », boosters).
- Calibrage : `work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/missions/2026-11-14-brassins/voies/a2-ecran/` (`VERDICT.md`, `RESULTAT.md`, `tests.txt`).

## Consignes
- Ouvre (Read) toutes les captures `-390-clair` (39 états), puis `-390-cave` et `-1280-clair` de : `liste-remplie`, `liste-vide`,
  `fiche-fermentation`, `fiche-conditionne`, `saisie-releve-densite-ouvert`, `saisie-apres-releve`, `saisie-cloture-apres`, et
  `-1280-cave` de `liste-remplie` et `fiche-fermentation`. Ne compte que ce que tu as vu.
- `VERDICT.md` : ligne 1 `OK — <n> problèmes, <n> bloquants` ; « Version : d31751d8 » ; table capture | thème | largeur | état |
  problèmes | bloquants ; puis la liste numérotée (un problème par ligne : quoi, où, en brasseur) ; puis « Doutes ».
- Termine par `## Pour les maquettes` : les 5 à 8 problèmes qui comptent le plus pour un brasseur qui suit sa fermentation au
  téléphone, en une ligne chacun. Pas de redessin, pas de note.

## Exigences transversales et acquis (recopiés, leçons L05 et L06)
- Inconnu ≠ 0 (« — » seul) ; peu de texte au premier plan ; penser en brasseur ; curseur plutôt que chiffres tapés au téléphone.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
- `RESULTAT.md` tenu au fil (tous les 5 éléments).
- La ligne « Tests » écrite dans un fichier : aucune suite Vitest ici (rien dans `src/`) ; `tests.txt` porte la sortie des CHECK,
  au même format que `--reporter=dot > …`.
- Voie d'écran : captures 390 tactile et 1280, clair et cave, ouvertes selon la liste ci-dessus.
Réponse finale au pilote : une ligne.
