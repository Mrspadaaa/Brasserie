# Voie g3-ecarts — l'app en ligne contre chacune de ses maquettes choisies, état par état

Agent : `critique` (Fable), neuf. Plafond : 30 tours. Lire d'abord `../g-commun.md`, puis ton portrait
(`work/refonte-frontend/v4/ecran-1/fils21-choisir/critique/PORTRAIT.md`). Part tout de suite sur ses 14 captures du téléphone ; les captures de g1 te seront données ensuite par le pilote. Écris `ECARTS.md` section par section, au fil du travail (L18).

## Pourquoi
Ses mots (SPEC-BRASSEUR, 02.11 soir) : « Et j'ai l'impression que les vue, ressemble assez peu aux artifeacte choisir sur quelques points... » et
« Mais il y a TELLEMENT de problème ?? ». Règle n° 1 : « C'est critique que mes choix soient respectés. SI non, rien n'a de valeur. » Aucun banc
n'a mis l'app à côté de ses maquettes choisies, état par état (L03).

## Ce qu'il faut faire
1. **Ses choix.** Dans `work/refonte-frontend/decisions.md` (D245 à D318) et les dossiers `choix-*` de la mission, liste chaque choix qu'il a fait
   pour la Dépense : le dossier, la lettre choisie, ses mots exacts, et ce qu'il a demandé d'y changer (au moins D245 p3a-3, D246 z2, D248 p3c-3
   « mettre plus en avant la quantité », D289 nom B, D291 captures B, D311 E plier, D313 et D316 B valider, le choix de la lenteur, la TVA, les
   sous-familles, la frise, s'ils y sont). Une parole plus récente l'emporte sur une maquette plus ancienne : note-la.
2. **Ses images.** Pour chaque choix, l'image de la variante choisie (`choix-*/img/`, ou la maquette jouable de `choix-*/maquettes/` rendue à 390
   et 1280 par puppeteer-core si l'état manque ; fichiers de travail dans `voies/g3-ecarts/` ou `os.tmpdir()`).
3. **L'app.** D'abord ses 14 captures du téléphone (l'app en ligne, sa pièce), puis, au message du pilote, celles de g1 (`voies/g1-audit/avant/`, b3ab392e, sa pièce et doc14, clair et sombre, 390 et 1280). Les captures du
   téléphone (`g-commun.md`). Ouvre chaque image (L12).
4. **Côte à côte.** Par état (récap et en-tête, liste au repos, rangée ouverte, filtre, Plié, bandeau B, lenteur, pied, sceau QR, nom de l'article),
   une ligne par écart : ce que montre sa maquette, ce que montre l'app, où (capture et zone), gravité (bloquant : un élément de sa maquette absent
   ou remplacé ; écart : forme, place, poids, couleur ; détail), et le fichier du code probable. Puis les défauts hors maquette que tu vois à l'œil
   (lisibilité, contraste, nombre rogné, redondance, champ sans nom), même méthode. Ne propose aucun redesign : la correction est « comme sa maquette ».
5. Vérifie que la liste couvre ses plaintes D328a à D337 : chacune est soit dans tes écarts, soit déjà prise par g2a ou g2b (voir leurs VOIE.md).

## Possède
`work/missions/2026-10-31-ecran-depense/voies/g3-ecarts/**`, le dossier temporaire. Lecture seule partout ailleurs. Aucune valeur de ses pièces
dans un fichier suivi (« ligne 3, famille Matériel », jamais le nom ni le prix).

## Critères (le pilote les rejoue)
1. `ECARTS.md` : la table des choix (1), puis une ligne par écart (4), chacune avec ses deux images nommées.
2. Chaque image citée existe et a été ouverte.
3. `git status --short` : rien hors de « Possède ».

## Rendre
`voies/g3-ecarts/ECARTS.md`, puis une ligne `G3 OK — <n> bloquants, <n> écarts, <n> détails` ou `G3 ECHEC — …`.
