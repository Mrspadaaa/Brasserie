# Voie m1-farnesene — mini maquettes : le farnésène et la cohumulone dans la feuille Valeurs de Comparer

Agent : concepteur (Opus). C'est ce que le brasseur verra : un petit choix, montré en mini maquettes côte à côte. Rien n'est
changé dans l'app par cette voie.

## Pourquoi ce choix
- Ses mots (25.10) : « Il y a pas les huiles comme ça, à mettre plus bas » ; « Aussi, pour comparé les chimies. Les mettre lune au
  dessus de l'autre pour bien voir les différences ». Puis : « Non la première partie doit être en dessous. La seconde dans
  l'autre vue... ».
- Sa référence : la composition des huiles de Beer Maverick, « Oil Composition ». Elle donne, dans cet ordre, myrcène, humulène,
  caryophyllène, farnésène et « All Others ». Les valeurs α, β, rapport α/β et cohumulone sont dans « Brewing Values ». Voir la
  note `cerveau/sources/beermaverick-radar.md` et `docs/qualite/reference-beer-maverick.md`.
- Son choix pour Comparer est cmc2k (règle n° 1, `work/refonte-frontend/v4/choix/ecrans.json`). Sa composition a quatre lignes :
  myrcène, humulène, caryophyllène, autres. Le farnésène n'y était pas, faute de données (1 % des houblons).
- Depuis le 26.10 (D75), le catalogue a le farnésène pour 78 % des houblons et la cohumulone pour 90 %. Ni l'un ni l'autre n'a de
  ligne dans Comparer. Une ligne de plus est un ajout visuel : à lui de choisir.

## État actuel, à reprendre tel quel comme variante A
Les captures de la voie c2, à ouvrir :
- `voies/c2-comparer-valeurs/captures/composition-390.png` ;
- `voies/c2-comparer-valeurs/captures/chimie-390.png` ;
- et le haut de la feuille, avec α et β : prends-le toi-même.

Pour le rendu : `node scripts/with_server.mjs --server "npm run dev -- --port 5205 --strictPort" --port 5205 --env VITE_HOP_V4=on
-- node <ton script>`, puis `?dev-local&etape=houblons`, Comparer sur Nelson Sauvin, Citra et Mosaic, feuille Valeurs. Le
script `tests/integration/comparerValeurs.chrome.mjs` montre comment l'ouvrir.

## Variantes, une seule chose change par variante
- **A, l'actuel** : capture de l'app, sans retouche.
- **B, + farnésène dans la composition** : une cinquième ligne « Farnésène », entre caryophyllène et autres, comme Beer
  Maverick. Mêmes barres, mêmes couleurs, même grammaire que les quatre autres. Ses arômes, en une ligne courte comme les autres :
  « frais, vert, floral », d'après Beer Maverick.
- **C, + cohumulone dans les valeurs** : une ligne « cohumulone, % des α » dans le bloc des acides (α, β) de la feuille. Même
  grammaire que la ligne β.
- **D, B et C ensemble.**

## Règles du dessin
- Le plus fidèle possible : reprends le DOM et le CSS rendus de la vraie feuille (classes de `src/ui/hopIndex/comparer/comparer.css`),
  sans les modifier. Préfixe tes classes ajoutées (`m1f-…`, L26). Valeurs réelles du catalogue (`src/data/hopV4/proto-data.json`,
  `oils.farnesene`, `cohumulone`) pour Nelson Sauvin, Citra et Mosaic. Un inconnu s'écrit comme l'app l'écrit (hachures,
  « inconnu »).
- 390 px de large, une colonne par variante sur la page. Pas de légende ni de texte en plus : rien qui n'est pas dans l'app.
- Lis `.claude/rules/affinee-frontend.md`, DESIGN.md (densité), et regarde chaque capture avant de dire OK (L12).

## Livrable
- `work/missions/2026-10-25-integration-houblons/voies/m1-farnesene/page.html`. Une page de choix (L24, D126) :
  - les 4 variantes côte à côte, A en premier comme référence ;
  - le nom de chacune en une ligne (« A · l'actuel », « B · + farnésène »…) ;
  - un en-tête d'une phrase : ce qui est demandé.

  Elle doit passer `node scripts/agents/verifier-page.mjs <page.html> --page-lot --captures <os.tmpdir()>/m1` → `PAGE OK`.
  Ouvre ses captures.
- RESULTAT.md : ce que tu as fait, les captures ouvertes, les valeurs utilisées.

## Possède
`work/missions/2026-10-25-integration-houblons/voies/m1-farnesene/` seulement. Rien dans `src/`. Fichiers de travail dans
`os.tmpdir()`.

Retour en une ligne.
