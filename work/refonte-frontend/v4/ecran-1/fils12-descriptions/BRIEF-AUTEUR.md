# Lot 12 · Descriptions de houblons : ce que valent les carrés d'arômes, au long appui (fils de fer, #140)

Fils de fer statiques, 20 min par variante, puis tu livres ce que tu as. Écris en français.
Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus).
Texte avec barres obliques inverses ou accents graves : outil Write, jamais Bash. Pas de git.
Ne touche à rien hors de `work/refonte-frontend/v4/ecran-1/fils12-descriptions/<ta variante>/` et
de ses captures.

## Ce que le brasseur a dit (19.10, soir)

« On va refaire un batch de description de houblons, et notamment montrer à quoi correspond
exactement ces valeurs facile lors du long appuie sur le houblons. Créé les mini maquettes file de
fer ». Sur sa capture, il a entouré les petits carrés d'arômes de la carte Motueka (ajouts proposés).
Ses règles constantes :
- peu de texte, pas de légende écrite au repos : le détail vient à un toucher ;
- en brasseur : α, rôle, arômes, moment, puis IBU ; le stock en icône ;
- une valeur inconnue n'est jamais un zéro.

## Ce que les carrés disent (base v4.8, `ecran-1/base/consolide/index.html`, ouvre-la et regarde)

Une case par famille, 12, dans l'ordre du style 16D :
- d'abord les 3 attendues du style : Floral, Herbacé, Terreux ;
- un petit écart ;
- puis Agrumes, Tropicaux, Noyau, Pépins, Baies, Melon, Résineux, Épicé, Végétal.

Chaque case est en couleur de sa famille (voir `.mini .c.f-*` dans
`ecran-1/base/generateur/etape-consolide.css`) :
- **pleine** : marqué (au moins deux fiches la citent, ou une fiche la donne en premier) ;
- **claire** : cité (une fiche) ;
- **grise** : non décrit (aucune fiche).

Le soulignement d'accent marque une famille que ma bière a déjà en trop (Résineux). Ce ne sont pas
des intensités dans la bière : ce sont des citations des fiches. Règle :
`prototypes/houblons-v4/src/engine/hops.ts`, `describeFamilies`.

## Les données (rien d'autre, rien d'inventé)

`prototypes/houblons-v4/data/pack-fiches.json`, `fichesHoublons[]` (clé `key`) :
- `aromes[]` : `family`, `name`, `level` 0/1/2, `label`, `sources` sur `of`, `authors`.
- `descripteurs` :
  - `beerMaverick` : les mots de Beer Maverick ;
  - `hopsteiner` : ses phrases.
- `alpha` : les sources et la valeur `retenu`.
- `usage` : les styles par source.

Les trois cartes de la base, au repos :
- **Motueka** α 8,1 double, 10 g, +3 IBU, 10′. Agrumes marqué 2 fiches sur 2 (Beer Maverick,
  Hopsteiner) ; Tropicaux cité 1 sur 2 ; Floral cité 1 sur 2 ; les 9 autres non décrites. Mots :
  agrumes, mojito, citron vert, citron, fruits tropicaux, floral ; Hopsteiner : « Fresh lime, lemon
  zest, mojito, citrus ».
- **Citra cryo** α 24,8 aromatique, 10 g, +9 IBU, 10′ (une seule fiche).
- **Saaz Late** α 3,5–6 aromatique, 10 g, +2 IBU, 10′ (une seule fiche).

## Ta variante (ton message te donne tes numéros)

- **d1 · Les carrés gardés, une bulle** : au long appui, une bulle au-dessus de la carte nomme
  chaque case citée ou marquée (sa couleur, son nom, marqué ou cité, ses fiches), et dit « non
  décrit » pour les autres.
- **d2 · La loupe sur les carrés** : au long appui, la bande de carrés grossit sur place (façon Dock)
  et écrit le nom de chaque case, avec les mots des fiches qui l'ont fait naître (« mojito, citron
  vert → Agrumes »).
- **d3 · Les mots des fiches d'abord** : au repos, deux ou trois mots des fiches à la place ou à côté
  des carrés ; au long appui, les familles avec leurs fiches.
- **d4 · La fiche courte, en feuille** : au long appui, une feuille monte du bas : les 12 familles en
  lignes (niveau, fiches), l'α par source, le rôle ; elle se ferme en touchant dehors.
- **d5 · Des carrés qui se lisent seuls** : la bande elle-même est redessinée pour se comprendre sans
  légende (par exemple les attendues du style à part, initiales, forme) ; le long appui confirme avec
  les noms et les fiches.
- **d6 · Libre (chaud)** : ta meilleure idée.

## Règles

- **Format** : largeur 390, fil de fer gris ; seules les couleurs des familles restent (c'est le
  sujet) ; jamais l'orangé d'alerte.
- **Texte** : 12 px au moins ; 90 mots au plus au repos ; aucune légende écrite au repos.
- **Le geste du rail** : le long appui ne prend pas son geste. Sur une ligne posée sur le rail, la
  pastille du moment reste la poignée qui glisse (appui de 120 ms). Le long appui se fait sur le nom
  ou la carte. Sur un ajout proposé, un toucher bref ajoute toujours le houblon.
- **Écran** : en haut, une barre simple (Houblons 3/7, IBU 60), puis le champ « Ajouter — houblon… »,
  puis les trois cartes.

## Livrable et contrôles

Dans `fils12-descriptions/<numéro>/` :
- `vue.html` : au repos ;
- `appui.html` : le long appui sur Motueka, montré ouvert ;
- `NOTE.md` : 3 lignes (le parti, ce que ça apprend au brasseur, ce qui manque).

Convention :
- la carte Motueka porte `data-houblon="beermaverick-motueka"`, Citra cryo
  `beermaverick-citra:cryo`, Saaz Late `beermaverick-saaz-late` ;
- chaque carré porte `data-famille="<family>"` et `data-niveau="0|1|2"`, dans un parent
  `data-role="aromes"` ;
- l'explication ouverte porte `data-role="appui"` ;
- dans `appui.html`, chaque famille citée ou marquée de Motueka a un élément
  `data-explique="<family>"`, qui écrit son nom, « marqué » ou « cité », et « 2 fiches sur 2 » (ou le
  nom des sources).

Contrôles :
1. Capture des deux pages :
   - `node work/refonte-frontend/v4/tournoi/outils/capture-page.mjs work/refonte-frontend/v4/ecran-1/fils12-descriptions/<num>/vue.html work/refonte-frontend/v4/ecran-1/fils12-descriptions/captures/<num>-vue-390.png 844`
   - de même pour `appui.html`, vers `<num>-appui-390.png`.

   **Regarde les deux captures.**
2. `node work/refonte-frontend/v4/tournoi/outils/controle-appui.mjs work/refonte-frontend/v4/ecran-1/fils12-descriptions <num>` : `APPUI OK`.
3. `node work/refonte-frontend/v4/tournoi/outils/controle-fil6.mjs work/refonte-frontend/v4/ecran-1/fils12-descriptions <num> --objet=libre --pages=vue.html,appui.html` : `FIL6 OK`.
4. `node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils12-descriptions <num> --max=90 --page=vue.html` : `MOTS OK`.

Réponse finale : une ligne par variante (le parti, les trois contrôles).
