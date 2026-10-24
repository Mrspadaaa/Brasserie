# Voie p12-controle-traits — le contrôle D110 : les petits traits de Suggérer se lisent là où on les lit

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` d'abord)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (un contrôle, ses témoins)
- Plafond : 60 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote ; aucune question bloquante, l'option prudente écrite dans RESULTAT.md

## Objectif
Le brasseur, en commentaire sur les pictos d'une voie de Suggérer (maquette publiée), mot pour mot : « Un peu dur à
comprendre ce système de petit bar » (SPEC-BRASSEUR § 1, « Les petits traits de Suggérer » ; D110).

Ce sont les traits de q2b, son choix : sous chaque picto, un trait par cran du style, un demi-trait pour un reste, des
hachures pour un effet non établi, un point pour une famille qui ne bouge pas. **Ils restent.** Leur sens n'est dit que
dans l'aide « ? », loin de la ligne, et toucher un picto ne montre rien (vérifié : ni bulle, ni texte, ni feuille).
À faire : les rendre lisibles là où on les lit, sans un mot de plus au repos (pas de cockpit). Par exemple, toucher un
picto montre près de lui « Agrumes +1,6 cran ».

Leçon L13 : le contrôle s'écrit avant la correction et échoue sur la version rejetée. Le concepteur de la voie p2 refait
le geste en même temps, contre le contrat ci-dessous.

## Contrat
Page : `<dossier>/suggerer/etat.html`, 390 × 844 tactile, puis 1280 × 800 (à l'ordinateur, le survol ou le clic).
- Les traits d'une voie : les éléments `[data-famille][data-crans]` des lignes de voie (composant `Traits` de
  `prototypes/houblons-v4/parcours/src/ecrans/suggerer/briques.tsx`, `data-role="extra"` ou `"cible"`).
- Règles :
  1. **Les traits restent** : au moins 3 éléments de traits visibles au repos, chacun avec son picto et ses traits.
  2. **Au repos, pas un mot de plus** : aucun élément de traits ne contient de texte visible (lettres ou chiffres), et
     aucun texte visible n'est posé sous les pictos d'une ligne de voie.
  3. **Un toucher montre le sens, près du picto** : pour 3 éléments de traits (le premier de trois lignes de voie
     différentes), un toucher fait apparaître, en moins de 400 ms, un élément visible dont le centre est à 120 px au
     plus du picto touché, et dont le texte contient le nom français de sa famille (table de
     `prototypes/houblons-v4/parcours/src/commun/familles.ts`) et sa valeur en crans, égale à `data-crans` arrondi au
     dixième, virgule décimale (par exemple « Agrumes +1,6 cran »). Pour une famille à effet non établi, « ? » ou « non
     établi » au lieu du nombre.
  4. **Le toucher n'a pas d'autre effet** : la route ne change pas, la liste à comparer
     (`window.__parcours.etat.aComparer`) ne change pas, aucune feuille ne couvre l'écran (l'élément montré fait moins
     d'un tiers de la hauteur de l'écran).
  5. **Il se referme** : un toucher ailleurs le retire.
Sortie : une ligne par règle et largeur, puis `TRAITS OK (n touchés, 2 largeurs)` (code 0), ou `TRAITS ECHEC` et une
ligne `- D110 …` par manque (code 1) ; code 2 si la page manque.

## Entrées
- Le modèle d'un contrôle joué : `work/refonte-frontend/v4/tournoi/outils/controle-teinte.mjs` (en-tête, Chrome,
  RACINE) et `controle-reprise.mjs` (toucher tactile). Chrome : `C:/Program Files/Google/Chrome/Application/chrome.exe`,
  `puppeteer-core` du `package.json` de la racine.
- La version rejetée, construction d332792c (celle publiée) : `prototypes/houblons-v4/maquettes/parcours-d332792c/`.
- Le choix q2b : `work/refonte-frontend/v4/ecran-1/fils15-s5-complexe/q2b/NOTE.md` et ses captures.

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/tournoi/outils/controle-traits.mjs`
- `work/refonte-frontend/v4/tournoi/outils/temoins/traits-*/**`
- `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json` : la ligne D110 seulement. D'autres voies écrivent
  D107 à D109 en même temps : relire le fichier juste avant, écrire en une seule commande, n'écraser rien.
- `work/missions/2026-10-23-maquette-parcours/voies/p12-controle-traits/RESULTAT.md`
- Fichiers de travail dans `os.tmpdir()` (L17), jamais à la racine.

## Consignes
1. Écrire le contrôle selon le contrat. En-tête comme les autres : ses mots (D110), la règle, l'usage, les témoins.
2. Témoins, petites pages statiques, chacune dans `temoins/traits-<cas>/suggerer/etat.html`, avec trois lignes de voie
   et `window.__parcours = { etat: { aComparer: [] } }` :
   - `traits-ok` : un toucher montre « Agrumes +1,6 cran » à côté du picto → OK ;
   - `traits-muets` : les traits, et rien au toucher (la forme actuelle) → ECHEC ;
   - `traits-bavards` : le sens écrit en permanence sous chaque picto → ECHEC ;
   - `traits-feuille` : le toucher ouvre une feuille qui couvre l'écran → ECHEC.
3. Le contrôle échoue sur la construction rejetée d332792c.
4. `portee-defauts.json` : la ligne D110 (id `D110`, ses mots, `controle`, portée `["suggerer"]`, `tourne` `oui`,
   `resultat` avec les sorties, verdict `garde`, script `controle-traits.mjs`).
5. Lancer `node scripts/agents/systeme.mjs temoins` (TEMOINS OK).

## Exigences transversales (recopiées, L05)
- Règle n° 1 : les traits de q2b restent (controle-choix) ; le contrôle exige qu'on les comprenne, pas qu'on les change.
- Pas de cockpit : rien de plus au repos. L26 : aucun `String.replace` avec une chaîne qui contient `$` ; M10.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : ce qui est fait ; les sorties sur d332792c et sur chaque témoin ; ce que le contrat ne couvre pas ;
`LEÇON PROPOSÉE : …` s'il y a lieu. Réponse finale au pilote : une ligne.
