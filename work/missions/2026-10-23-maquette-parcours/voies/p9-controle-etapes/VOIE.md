# Voie p9-controle-etapes — le contrôle D107 : Comparer compare aux étapes, avec une référence

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` d'abord)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (un contrôle, ses témoins)
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote ; aucune question bloquante, l'option prudente écrite dans RESULTAT.md

## Objectif
Le brasseur, le 23.10 au soir, sur la maquette publiée, mot pour mot :
« Ah mais comparé est que le dryhopping ??? C'est pas ce que je voulais je voulais comparé au moins : les étapes 60' 10'
dryhopping ect comme la maquette de base. Et aussi le houblon de base ou bière de base. Est-ce que cela est clair ? »
(SPEC-BRASSEUR § 1, « Comparer aux étapes, avec une référence » ; DEFAUTS-RECURRENTS, D107.)

Comparer (r6a) ne compare qu'un moment fixé : l'étiquette `après, 3 j` de la ligne de contexte. Sa « maquette de
base » n'est pas le Comparer de la base v4.10 (sur sa capture barrée : « Non pas cette version, une version du
dryhopping, dans un des top. Montrait vraiment l'état du moment de l'ajout facile, je l'avais juste fait noté !! »).
C'est **x3b** (lot 21, une des 5 meilleures) : la bière de base en pointillé, les familles qui montent au moment de
chaque ajout. Il l'avait notée pour cela : « ça peut être interessant de l'utiliser jsute pour de la comparaison entre
ma bière de base -> 1 dry hop, 2 dry hop: levure ».

Leçon L13 : le contrôle s'écrit **avant** la correction, et doit échouer sur la version rejetée. Ta voie écrit
`controle-comparer-etapes.mjs` et ses témoins. Le concepteur (voie p3, en même temps que toi) refait Comparer contre
le **contrat de marqueurs** ci-dessous : ne pas l'élargir sans le dire au pilote dans RESULTAT.md.

## Contrat de marqueurs (le même dans la voie p3)
Page : `<dossier>/comparer/etat.html`, rendue **au repos** (aucun toucher), à 390 × 844 tactile, puis à 1280 × 800.
- **Houblon comparé** : chaque `[data-houblon-compare="<clé>"]` (déjà posé par r6a) ; la clé est celle du moteur
  (`beermaverick-idaho-7`). La référence n'en est pas un (voir plus bas).
- **Valeur à une étape** : un élément `[data-etape="<code>"][data-houblon="<clé>"]`. Codes : `b60`, `b10`, `b5`, `wp`,
  `dryActive`, `dryPost` (les moments du moteur, `MomentSimule` de `prototypes/houblons-v4/src/engine`).
  - Son texte porte la valeur : un nombre (« ~ » devant s'il est simulé) ou « ? » s'il est inconnu. Jamais vide.
  - Inconnu ≠ 0 : un élément `[data-inconnu]` ne montre jamais « 0 ».
- **Exigé pour chaque houblon comparé, et pour la référence** : `b60`, `b10`, et au moins un de `dryActive`, `dryPost`.
- **Visibles ensemble** : toutes ces valeurs exigées (houblons et référence) sont visibles au repos, sans toucher ; non
  cachées (`display`, `visibility`, `opacity`, `hidden`, `<details>` fermé, `aria-hidden` d'un ancêtre) ; non couvertes
  (le point central de l'élément, une fois défilé à l'écran, renvoie l'élément ou un descendant : le dock fixe
  « Placer » ne doit pas les cacher) ; dans la largeur de la page ; et tenant **dans un seul écran** : l'écart vertical
  entre la plus haute et la plus basse est au plus la hauteur de la fenêtre (844 au téléphone, 800 à l'ordinateur).
- **Les étapes nommées** : le texte visible de la page contient « 60′ » (ou 60'), « 10′ » (ou 10') et « dry hop »
  (ou « à froid »).
- **La référence** : un élément visible au repos `[data-reference]`, avec
  - `data-reference="houblon"` et `data-houblon="<clé>"` : un houblon de la recette (une clé présente dans
    `window.__parcours.etat.recette.additions[].hopKey` ; Nugget dans la stout), ou
  - `data-reference="biere"` : la bière de base (ta stout) ;
  - et ses propres valeurs aux mêmes étapes exigées : `[data-etape]` dans l'élément `[data-reference]`, ou
    `[data-etape][data-houblon="<clé de la référence>"]`.

Sortie : une ligne par largeur, puis `COMPARER-ETAPES OK (n houblons + référence <clé|biere>, étapes b60 b10 dry…)`
(code 0), ou `COMPARER-ETAPES ECHEC` et une ligne `- D107 …` par manque (code 1). Les messages nomment le houblon et
l'étape. Sur la version rejetée, le message dit ce qui manque, par exemple « 0 valeur d'étape (une seule : après, 3 j) ».
Code 2 si la page manque.

## Entrées
- Le modèle d'un contrôle de rendu : `work/refonte-frontend/v4/tournoi/outils/controle-teinte.mjs` (en-tête, Chrome,
  RACINE) et `controle-reprise.mjs` (visibilité au repos, toucher tactile). Chrome :
  `C:/Program Files/Google/Chrome/Application/chrome.exe`, `puppeteer-core` du `package.json` de la racine.
- La version rejetée, construction d332792c (celle publiée) : `prototypes/houblons-v4/maquettes/parcours-d332792c/`
  (assets lus sur l'artefact, `LISEZ-MOI.txt`). Son Comparer : `comparer/etat.html`.
- x3b, d'où viennent les étapes et la référence : `work/refonte-frontend/v4/ecran-1/fils21-choisir/captures/x3b-390.png`,
  `x3b-plans-390.png` ; son générateur `work/refonte-frontend/v4/ecran-1/fils21-choisir/x3b/generateur-x3b.mjs`.
  Le Comparer de la base v4.10 (`base/consolide/comparer.html`) est celui qu'il a barré : pas un modèle.
- `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json` (une ligne par défaut : id, mots, controle, portee,
  tourne, resultat, verdict, script) ; `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` (ligne D107).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs`
- `work/refonte-frontend/v4/tournoi/outils/temoins/comparer-etapes-*/**`
- `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json` : la ligne D107 seulement
- `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` : la ligne D107 seulement (colonne du témoin, une fois tenu)
- `work/missions/2026-10-23-maquette-parcours/voies/p9-controle-etapes/RESULTAT.md`
- Fichiers de travail dans `os.tmpdir()` (L17), jamais à la racine.

## Consignes
1. Écrire le contrôle selon le contrat. En-tête comme les autres : ses mots (D107), la règle, l'usage, les témoins.
   Usage : `node controle-comparer-etapes.mjs <dossier construit> [--page=etat.html] [--largeur=390|1280]` (sans
   `--largeur` : les deux).
2. Témoins, de petites pages HTML statiques écrites à la main (pas de copie du script de la maquette), chacune dans
   `temoins/comparer-etapes-<cas>/comparer/etat.html` :
   - `comparer-etapes-ok` : trois houblons et la bière de base en référence (`data-reference="biere"`, comme le
     pointillé de x3b), aux trois étapes, dans un écran → OK ;
   - `comparer-etapes-ok-houblon` : la même, avec Nugget, le houblon de la recette, en référence → OK ;
   - `comparer-etapes-un-moment` : la forme de r6a, un seul moment (« après, 3 j ») → ECHEC ;
   - `comparer-etapes-cache` : le dry hop derrière un `<details>` fermé → ECHEC ;
   - `comparer-etapes-sans-reference` : les étapes, sans `[data-reference]` → ECHEC ;
   - `comparer-etapes-trop-haut` : les étapes réparties sur deux écrans → ECHEC.
   Les témoins posent `window.__parcours = { etat: { recette: { additions: [{ hopKey: 'beermaverick-nugget' }] } } }`.
3. Le contrôle échoue sur la construction rejetée d332792c, et passe sur `comparer-etapes-ok`.
4. `portee-defauts.json` : ajouter la ligne D107 (id `D107`, ses mots, `controle`, portée `["comparer"]`, `tourne`
   `oui`, `resultat` avec les sorties sur d332792c et les témoins, verdict `garde`, script). Puis
   `node scripts/agents/systeme.mjs defauts` si DEFAUTS-RECURRENTS change (vue courte régénérée).
5. Lancer `node scripts/agents/systeme.mjs temoins` (TEMOINS OK) et
   `node scripts/agents/systeme.mjs mission work/missions/2026-10-23-maquette-parcours/MISSION.md` (MISSION OK) : la
   portée D107 exige désormais le contrôle dans la voie p3, que le pilote y a mis.

## Exigences transversales (recopiées, L05)
- Inconnu ≠ 0 ; simulé marqué « ~ ». Règle n° 1 : le contrôle garde son choix (D107), il ne décide pas de la forme.
- L26 : aucun `String.replace` avec une chaîne qui contient `$` ; M10 : aucun caractère de contrôle dans le script.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : ce qui est fait ; les sorties du contrôle sur d332792c et sur chaque témoin ; ce que le contrat ne
couvre pas (un trou que tu as vu) ; `LEÇON PROPOSÉE : …` s'il y a lieu.

Réponse finale au pilote : une ligne.
