# Voie p5 — r4e : tout ce que la ligne montre se change sur la ligne

- Mission : 2026-10-31-ecran-fermentescibles
- Agent : concepteur
- Modèle : opus
- Niveau : interface (ce que le brasseur verra)
- Plafond : 110 tours ; 3 essais par critère
- Dépend de : r4d (`v3/r4d/`), le contrôle de la voie c5 (`controle-volee.mjs`, rendu avant ton départ)
- Décideur en cas de doute : pilote ; la règle est r4d telle quelle, plus ce qui est écrit ici

## Ses mots
Sur r4c : « il faut plusieurs click pour faire des changements, c'est un peu un problème UX. Je voudrais aussi à la volée pouvoir
facilement supprimer, ajouter, modifier sans ouvrir une "sous vue" mais si je click sur un, je peux avoir plus d'informations ou autre ».
Sur r4d (passe 4) : « Mais ça inclus pas les besoins que j'ai à la volée ??? ». Sur le plateau : « Toujours visible ».
Cause (D211) : r4d ne met sur la ligne que la masse, le retrait et l'ajout ; le moment, la part du grain et la couleur « ? » demandent
encore de toucher la ligne puis le plateau.

## Objectif
Deux variantes, `v4/r4e-a/etat.html` et `v4/r4e-b/etat.html`, copiées de `v3/r4d/etat.html` et gardant tout r4d. Sur chaque ligne, en un
toucher puis la saisie ou le choix, sans toucher le plateau ni ouvrir le détail :
- **la masse** : comme r4d ;
- **la part du grain** : r4e-a, le % se tape sur la ligne ; r4e-b, la barre de la ligne se tire au doigt (le % suit). La masse de la ligne
  suit la part ; le total du grain change, jamais les autres masses ;
- **le moment** (et son jour en fermentation) : r4e-a, un petit menu ancré à la ligne ; r4e-b, un toucher passe au moment suivant
  (empâtage → ébullition → fermentation), avec « Annuler » comme au retrait ;
- **la couleur** quand elle vaut « ? » : l'EBC se tape sur la ligne ; la teinte apparaît, le compte « à renseigner » baisse ;
- **retirer** (×, « Annuler »), **ajouter** (le champ) et **le nom qui ouvre le détail** : comme r4d.
Le plateau est **toujours visible** (D212) : l'état replié (`#replie`) disparaît. Le plateau garde ses réglages fins (−/+, curseur) sur la
ligne choisie ; il n'est plus nécessaire pour rien de ce qui précède.
Les rôles sont ceux du contrôle : `kg-ligne`, `part-ligne`, `moment-ligne`, `moment-choix` (avec `data-val`), `couleur-ligne`, `retirer`,
`nom`, `bal` (le plateau). Lire `work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs` avant de construire.

## Précisions
- `controle-volee.mjs` est rendu par c5 avant ton départ ; s'il manque, tu t'arrêtes en ECHEC sans rien construire.
- Le menu ancré de r4e-a montre les trois moments (empâtage, ébullition, fermentation) ; en fermentation, le jour se tape dans le même
  menu (« J+3 »). Il s'ouvre sous la ligne, collé à elle, et se ferme au choix, à Échap ou au toucher ailleurs. En bas de liste, le
  plus sûr est un menu dans la ligne (un descendant, que le contrôle accepte), qui pousse ce qui suit au lieu de sortir de l'écran.
- La couleur tapée est un EBC de 1 à 1500, virgule acceptée ; hors plage, la valeur d'avant revient, sans message bloquant.
- Le plateau se place sur la ligne dont on touche le nom, comme dans r4d ; au repos, sur la ligne choisie de r4d. Un réglage fait sur
  une autre ligne ne le déplace pas.
- `capturer.mjs` : copie celui de r4d et adapte-le (chemins, états).
- D211 et D212 sont résumées ici ; leur texte est dans `work/refonte-frontend/decisions.md` si besoin.

## À garder (règle n° 1, acquis)
Tout r4d hors de ces gestes : en-tête, fil, bandeau, pied, + flottant, plateau clair, sucre en ligne du ticket, teinte en dégradé, OG en
piste ; la famille figée sur la ligne ; la masse à zéro à l'ajout ; le parcours au clavier (Tab de réglage en réglage, Entrée, Échap rend
la valeur d'avant) ; jamais `type="number"` (`inputmode="decimal"`) ; aucun texte sous 12 px ; cibles de 24 px au moins sans chevauchement ;
80 mots au plus au premier écran, 1,05 écran au plus avec 8 grains ; pas de cockpit, aucune phrase d'aide au repos. Enrichir, pas limiter
(L07) ; mais rien d'ajouté au repos qui ne serve un de ces gestes.

## Entrées (lire seulement ça)
- `work/missions/2026-10-31-ecran-fermentescibles/v3/r4d/etat.html`, `NOTE.md`, `capturer.mjs`, ses captures.
- `work/missions/2026-10-31-ecran-fermentescibles/critique/VERDICT-v3.md` (les détails n° 3 à 5 du critique t4).
- `work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs`, `controle-gestes-ligne.mjs`.
- `DESIGN.md` (rayons, tailles), `docs/ui-compacte.md`.

## Possède (seuls chemins où écrire, un par ligne)
- `work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-a/`
- `work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-b/`
- `work/missions/2026-10-31-ecran-fermentescibles/voies/p5/RESULTAT.md`

Interdits : `v3/` (r4d reste telle quelle), `ecrans.json`, `ecrans-app.json`, `src/`, `functions/`, `.codex/`, le manifeste, les contrôles
de `tournoi/outils/`. Pas de serveur dans `C:/Users/mrspa/Documents/Brasserie`, pas de `git stash`, aucun commit.

## Captures (dans chaque dossier, à ouvrir en image, L12)
À 390 : repos ; part pendant et après ; moment pendant et après ; couleur pendant et après ; retrait avec « Annuler » ; à 1280 : repos.
Un `capturer.mjs` par variante, comme celui de r4d, qui imprime `CAPTURES OK`.

## Critères
Dans `GATES.md`, même dossier. Ne pas le modifier. Lancer chaque `CHECK:` depuis la racine du dépôt.

## Rendre
`RESULTAT.md` : ligne 1 `OK — r4e-a et r4e-b : VOLEE OK, GESTES OK` ou `ECHEC — …` ; par variante, les gestes et leurs captures ouvertes ;
ce que tu jugerais, en brasseur, entre a et b ; « D211 » et « Toujours visible » cités ; `LEÇON PROPOSÉE : …` ou `aucune`. Une ligne au pilote.
