# Voie p10-controle-visee — le contrôle D108 : la visée de Ma bière se dessine sur la piste

- Mission : 2026-10-23-maquette-parcours (lire `../../MISSION.md` d'abord)
- Agent : auteur
- Modèle : sonnet
- Niveau : jugement (un contrôle, ses témoins)
- Plafond : 80 tours ; 3 essais par critère
- Dépend de : —
- Décideur en cas de doute : pilote ; aucune question bloquante, l'option prudente écrite dans RESULTAT.md

## Objectif
Le brasseur, en commentaire sur la maquette publiée, posé sur « Tropicaux prévu » de Ma bière, mot pour mot : « Aussi
aucun impact sur je met plus, moins bannir ect.. » (SPEC-BRASSEUR § 1, « La visée sans effet » ; D108).

Constat de la supervision, joué dans Chrome : dans l'onglet Ma bière, « + » sur Tropicaux ne change rien sur la barre
(le HTML de la piste est identique avant et après) ; seul le mot « plus » change, et une puce « + tropicaux » apparaît
en bas, hors de l'écran à 390 px. Même chose pour « − » et « bannir ».

Sa base v4.10, `work/refonte-frontend/v4/ecran-1/base/consolide/biere.html` (son choix, « Ça aussi ») : fonctions
`ligneFamille` et `viserAbs`, CSS `.visee-f`, `.lien-visee`, `.fam.bannie` (vers les lignes 172 à 182) :
- la visée est posée sur la piste : un losange blanc à son niveau, relié au point de la bière par un trait pointillé ;
- « + » et « − » montent ou descendent d'un palier, sur l'échelle absolue 0 à 3 (faible 0,5 ; moyen 1,5 ; marqué 2,5) ;
- le palier est nommé entre les boutons, et « × » retire la visée ;
- « bannir », c'est la visée à 0, « visée absente » : le nom de la famille est barré et grisé.
C'est la visée « en trait creux » qu'il avait dite « Parfait » (18.10).

Leçon L13 : le contrôle s'écrit avant la correction et échoue sur la version rejetée. Le concepteur de la voie p1
refait la visée en même temps, contre le contrat ci-dessous.

## Contrat de marqueurs (le même dans la voie p1)
Page : `<dossier>/biere/etat.html` (l'onglet Ma bière), ou un fichier donné par `--page=<chemin>` ; 390 × 844
tactile. Famille jouée : `--famille=tropical` par défaut (une famille « prévue »).
- La ligne de la famille : `[data-famille-ligne="<famille>"]` ; elle s'ouvre par son bouton `[aria-expanded]`.
- Les gestes : `[data-visee="plus"]`, `[data-visee="moins"]`, `[data-visee="bannir"]`, `[data-visee="retirer"]` (le
  « × »), dans le groupe ouvert de la ligne.
- Sur la piste de la ligne : le point de la bière `[data-biere-point]`, le losange de la visée `[data-visee-marque]`
  (avec `data-niveau`, le palier visé sur 0 à 3), le trait qui les relie `[data-visee-lien]`.
- Le palier nommé : `[data-palier]`, entre les boutons, un mot (faible, moyen, marqué, absente…).
- La famille bannie : `[data-bannie]` sur la ligne, et son nom barré (`text-decoration` calculée `line-through`),
  visible **ligne refermée**.

Règles, jouées pour de vrai (toucher tactile, une page rechargée par scénario) :
1. Au repos, sans visée sur la famille : pas de `[data-visee-marque]` dans sa ligne.
2. Après « + » : le losange est visible ; son centre est à droite du point de la bière (plus = plus haut sur la piste) ;
   le trait relie les deux (son étendue couvre l'écart point–losange, à 4 px près) ; le HTML de la piste a changé ;
   `[data-palier]` nomme le palier ; « × » est visible.
3. Après « − » (depuis le repos) : le losange est à gauche du point ; même contrôle du trait et du palier.
4. « + » deux fois : le losange monte d'un palier de plus (`data-niveau` plus grand, plus à droite), sans dépasser 3.
5. « × » après « + » : le losange disparaît.
6. Après « bannir » puis la ligne refermée : `[data-bannie]` et le nom barré se voient sans rouvrir ; le losange (s'il
   est dessiné) est au niveau 0.

Sortie : une ligne par règle, puis `VISEE OK (6/6, <famille>)` (code 0), ou `VISEE ECHEC` et une ligne `- D108 …` par
manque (code 1) ; code 2 si la page manque.

## Entrées
- Le modèle d'un contrôle joué : `work/refonte-frontend/v4/tournoi/outils/controle-teinte.mjs` (en-tête, Chrome, RACINE)
  et `controle-reprise.mjs` (toucher tactile). Chrome : `C:/Program Files/Google/Chrome/Application/chrome.exe`,
  `puppeteer-core` du `package.json` de la racine.
- La version rejetée, construction d332792c (celle publiée) : `prototypes/houblons-v4/maquettes/parcours-d332792c/`
  (sa page `biere/etat.html`).
- Sa base : `work/refonte-frontend/v4/ecran-1/base/consolide/biere.html` et sa capture
  `work/refonte-frontend/v4/ecran-1/base/captures/consolide-biere-390.png`.
- `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json` ; `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` (D108).

## Possède (seuls chemins où écrire, avec RESULTAT.md)
- `work/refonte-frontend/v4/tournoi/outils/controle-visee.mjs`
- `work/refonte-frontend/v4/tournoi/outils/temoins/visee-*/**`
- `work/refonte-frontend/v4/tournoi/outils/portee-defauts.json` : la ligne D108 seulement. D'autres voies écrivent
  D107, D109 et D110 en même temps : relire le fichier juste avant, écrire en une seule commande, n'écraser rien.
- `work/missions/2026-10-23-maquette-parcours/voies/p10-controle-visee/RESULTAT.md`
- Fichiers de travail dans `os.tmpdir()` (L17), jamais à la racine.

## Consignes
1. Écrire le contrôle selon le contrat. En-tête comme les autres : ses mots (D108), la règle, l'usage, les témoins.
2. Témoins, chacun dans `temoins/visee-<cas>/biere/etat.html` :
   - `visee-base` : **sa base v4.10**, copiée de `base/consolide/biere.html` et seulement **balisée** (les attributs
     `data-*` du contrat ajoutés à son code ; rien d'autre ne change, ni dessin, ni texte) → OK. Écrire en tête du
     fichier ce qui a été ajouté ;
   - `visee-sans-trace` : une petite page statique où « + » ne change que le mot → ECHEC ;
   - `visee-mauvais-cote` : le losange de « + » à gauche du point → ECHEC.
3. Le contrôle échoue sur la construction rejetée d332792c (piste inchangée).
4. `portee-defauts.json` : la ligne D108 (id `D108`, ses mots, `controle`, portée `["biere"]`, `tourne` `oui`,
   `resultat` avec les sorties sur d332792c et les témoins, verdict `garde`, script `controle-visee.mjs`).
5. Lancer `node scripts/agents/systeme.mjs temoins` (TEMOINS OK).

## Exigences transversales (recopiées, L05)
- Règle n° 1 : le contrôle garde sa base (D108), il ne décide pas de la forme.
- L26 : aucun `String.replace` avec une chaîne qui contient `$` ; M10 : aucun caractère de contrôle dans le script.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : ce qui est fait ; les sorties sur d332792c et sur chaque témoin ; ce que le contrat ne couvre pas ;
`LEÇON PROPOSÉE : …` s'il y a lieu. Réponse finale au pilote : une ligne.
