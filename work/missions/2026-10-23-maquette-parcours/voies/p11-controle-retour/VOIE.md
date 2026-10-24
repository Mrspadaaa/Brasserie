# Voie p11-controle-retour — le contrôle D109 : un retour d'outil grand, lisible et nommé

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` d'abord)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (un contrôle, ses témoins)
- Plafond : 60 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote ; aucune question bloquante, l'option prudente écrite dans RESULTAT.md

## Objectif
Le brasseur, en commentaire sur « Fermer » d'un outil de la maquette publiée, mot pour mot : « Bouton retour souvent
assez petit et pas très intuitif » (SPEC-BRASSEUR § 1, « Le bouton retour » ; D109).

Mesuré par la supervision : le « ‹ » du `PageShell` de l'app (`src/pages/PageShell.tsx`, `w-7 h-7`, `ChevronLeft w-4`)
fait 28 × 28 px, avec une icône de 16 px, gris, sans mot, sur chaque outil. Ses mots priment, pour ce bouton seulement,
sur DESIGN.md (« 44 px n'est pas une obligation générale »). Portée étroite : le retour des outils du parcours.

Leçon L13 : le contrôle s'écrit avant la correction et échoue sur la version rejetée. Le concepteur de la voie p2 refait
le retour en même temps, contre le contrat ci-dessous.

## Changement du 23.10, nuit (prime sur le contrat ci-dessous)
Le brasseur a tranché D109 : « Juste une croix bien positionné, facile, dans le thème suffirait » ; et D118 (« Je veux juste retour au "menu" pas principal ») et D119 (« Header qui change ??? »). Le retour est une croix « × » (aucun mot exigé), à la même place et dans un en-tête de même hauteur sur les onglets biere, suggerer et comparer (±2 px), et elle ramène toujours à l'étape Houblons (#/ma-biere), quel que soit le chemin. Témoins : retour-ok (croix), retour-petit, retour-ailleurs, retour-en-tete-saute. Détail : le message du pilote.

## Contrat
Pages : `<dossier>/<route>/etat.html` pour les outils `suggerer`, `comparer`, `dryhopper`, `levure`, `substituer`
(liste par `--routes=`), au repos, à 390 × 844 tactile puis à 1280 × 800.
- Le retour de l'en-tête : `[data-role="retour"]`. À défaut (version rejetée), le premier bouton de l'en-tête dont le nom
  accessible est « Fermer » ou commence par « Retour » : il est mesuré quand même, pour que l'échec dise la taille.
- Règles, par route et par largeur :
  1. zone touchable (boîte du bouton) de 44 × 44 px au moins ;
  2. icône (le `svg` ou le glyphe « ‹ » dedans) de 20 px au moins de haut ;
  3. à l'encre du texte : la couleur calculée de l'icône à 24 au plus par canal de la couleur la plus fréquente du texte
     de la page (comme l'encre de `controle-teinte`), et non le gris secondaire ;
  4. un nom ou une destination dite, **visible** : un texte d'au moins un mot dans le bouton ou collé à lui (par
     exemple « ‹ Ma bière », « ‹ Retour ») ;
  5. un toucher dessus quitte l'outil (la route change ; lire `location.hash` avant et après).

Sortie : une ligne par route et largeur, puis `RETOUR OK (n routes × 2 largeurs)` (code 0), ou `RETOUR ECHEC` et une
ligne `- D109 <route> <largeur> : …` par manque, avec les mesures (code 1) ; code 2 si une page manque.

## Entrées
- Le modèle d'un contrôle de rendu : `work/refonte-frontend/v4/tournoi/outils/controle-teinte.mjs` (en-tête, Chrome,
  RACINE, l'encre). Chrome : `C:/Program Files/Google/Chrome/Application/chrome.exe`, `puppeteer-core` du `package.json`
  de la racine.
- La version rejetée, construction d332792c (celle publiée) : `prototypes/houblons-v4/maquettes/parcours-d332792c/`.
- Le cadre des outils de la maquette : `prototypes/houblons-v4/parcours/src/commun/Cadres.tsx` (CadreOutil sur PageShell).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs`
- `work/refonte-frontend/v4/tournoi/outils/temoins/retour-*/**`
- `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json` : la ligne D109 seulement. D'autres voies écrivent
  D107, D108 et D110 en même temps : relire le fichier juste avant, écrire en une seule commande, n'écraser rien.
- `work/missions/2026-10-23-maquette-parcours/voies/p11-controle-retour/RESULTAT.md`
- Fichiers de travail dans `os.tmpdir()` (L17), jamais à la racine.

## Consignes
1. Écrire le contrôle selon le contrat. En-tête comme les autres : ses mots (D109), la règle, l'usage, les témoins.
2. Témoins, petites pages statiques, chacune dans `temoins/retour-<cas>/<route>/etat.html` pour la route `suggerer`
   (lancés avec `--routes=suggerer`) :
   - `retour-ok` : « ‹ Ma bière », 48 px, icône 22 px à l'encre → OK ;
   - `retour-petit` : 28 px, icône 16 px, gris, sans mot (la forme actuelle) → ECHEC ;
   - `retour-sans-nom` : 48 px à l'encre mais sans mot → ECHEC.
3. Le contrôle échoue sur la construction rejetée d332792c.
4. `portee-defauts.json` : la ligne D109 (id `D109`, ses mots, `controle`, portée `["suggerer","comparer","dryhopper",
   "levure","substituer"]`, `tourne` `oui`, `resultat` avec les sorties, verdict `garde`, script `controle-retour.mjs`).
5. Lancer `node scripts/agents/systeme.mjs temoins` (TEMOINS OK).

## Exigences transversales (recopiées, L05)
- Règle n° 1 : le contrôle garde ses mots (D109) ; la forme est au concepteur.
- L26 : aucun `String.replace` avec une chaîne qui contient `$` ; M10 : aucun caractère de contrôle dans le script.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : ce qui est fait ; les sorties sur d332792c et sur chaque témoin, avec les mesures ; ce que le contrat ne
couvre pas ; `LEÇON PROPOSÉE : …` s'il y a lieu. Réponse finale au pilote : une ligne.
