# Tournoi de mini-prototypes — v4 houblons « lu au style »

Méthode : `docs/qualite/methode-conception-frontend.md`, section « Diverger puis
converger ». Brief : `work/refonte-frontend/v4/brief-v4.md`.

## Étapes et nombre de mini-prototypes

| Étape | Ce qu'on conçoit | Mini-protos | Entrée |
|---|---|---|---|
| M1 | La feuille « au style » : lire une bière contre le style, famille par famille | 10 | pack de données |
| M2 | Le geste de direction et les voies : pousser une famille, voir les voies et leur effet en fantôme | 11 | pack, et grammaire consolidée de M1 |
| M3 | La comparaison de 2 à 4 houblons ou voies, avec la bascule Barres / Radar | 11 | pack, et grammaire de M1 |
| M4 | La vue d'ensemble des houblons pour un style (carte, liste) | 11 | pack, et grammaire de M1 |
| M5 | L'assemblage de la page, à 390 et à 1280 | 6, puis **3 versions finales** | composants consolidés de M1 à M4 |

**Fin du tournoi : trois versions, pas une.** C'est la demande du brasseur : « me faire 3
version à la fin plutôt qu'une ». Le jury de M5 retient les trois meilleurs assemblages,
à condition qu'ils prennent des partis vraiment différents ; sinon il remonte au suivant
qui diffère. Chacun est consolidé en maquette complète (`prototypes/houblons-v4/maquettes/`
`version-a`, `version-b`, `version-c`), avec les composants consolidés de M1 à M4. Le
brasseur choisit.

## Règles pour les auteurs

- **Livrable** : un dossier `pNN/` avec un seul `index.html` autonome (CSS et JS en ligne,
  polices Google Fonts permises) et un `NOTE.md` de 5 lignes au plus : l'idée, le geste,
  ce qui est original, ce qui est sacrifié.
- **Données** : seulement le pack `prototypes/houblons-v4/data/pack-mini-protos.json`,
  copié en ligne dans la page. Aucun chiffre inventé. Une inconnue s'affiche
  « inconnu », jamais 0. Un écart n'est pas affiché plus fin que les plages ne le
  permettent.
- **Monde visuel** : DESIGN.md (charbon chaud « cave », Source Sans 3 pour ce qui se
  dit, IBM Plex Mono tabulaire pour ce qui se mesure, densité forte, petites commandes
  de 12 à 13 px). Le monde est fixé ; la **forme** est libre et doit être osée.
- **Récompensé** : la créativité, la rupture avec le catalogue à radar absolu,
  l'intelligence du geste, la compréhension en un coup d'œil sur téléphone.
- **Pas récompensé** : la finition, l'exhaustivité, les effets décoratifs sans fonction.
- **Interdit** :
  - copier un concurrent ;
  - un radar absolu présenté comme lecture au style ;
  - une fausse précision ;
  - du texte en anglais visible ;
  - « (s) » ;
  - un point décimal.
- **Isolement** : ne pas lire les autres `pNN/` ni le dossier `jury/`.

## Grille du jury (à l'aveugle, sur captures 390 et 1280)

| Critère | Poids | Ce qu'on regarde |
|---|---|---|
| Créativité et rupture | 30 % | Une idée de forme qu'on n'a pas vue ailleurs, au service de la tâche |
| Clarté pour la tâche | 30 % | En 5 secondes sur téléphone : où ma bière se tient face au style, quoi faire ensuite |
| Vérité des données | 20 % | Rien d'inventé, inconnue ≠ 0, pas de granularité plus fine que la donnée, unités jamais mêlées |
| Densité selon DESIGN.md | 10 % | Beaucoup de données utiles par écran, lisibles |
| Faisabilité | 10 % | Constructible en React et Tailwind, performante, accessible |

**Note sur 10 par critère.** Un mensonge sur les données (chiffre inventé, zéro pour une
inconnue, écart affiché plus fin que la donnée) élimine le mini-prototype, quelle que
soit sa note. Le jury rend : le classement, une ligne de raison par éliminé, et pour
chaque finaliste les idées à greffer, nommées.

## Calibration du jury, avant chaque verdict

Fable avait validé la v2, que le brasseur a refusée. Avant de noter, le jury note donc
quatre références connues, sur la même grille et sans savoir laquelle est laquelle :

- la carte Territoire (`v4/reference/concept-2-territoire/`), que le brasseur a aimée
  (« une sacrée dinguerie ») ;
- l'Explorer V5.5 (`v3/reference/v55-390-explorer.png`) ;
- la v2 (`phase8/captures/`), refusée (« pire que les alternatives ») ;
- la v3 (`v3/captures/final/`), arrêtée.

Si le jury place la v2 au-dessus de la carte Territoire, sa lecture de la grille est
fausse. Le pilote lui renvoie l'écart avec les mots du brasseur, puis le jury recommence
la calibration avant de juger le tournoi. La calibration est écrite dans
`jury/calibration.json`.

## Joker de rupture

Chaque tournoi garde, parmi ses finalistes, le mini-prototype le plus en rupture, même
s'il est sous la moyenne, à condition qu'il ne mente pas sur les données. Le
consolidateur doit en greffer au moins une idée, ou écrire pourquoi aucune ne tient. Ce
joker évite le retour à la moyenne.

## Température de création

Le brasseur : « modifier la "température" des paramètres de création ». La température
d'échantillonnage des sous-agents n'est pas réglable depuis le pilote. Elle est donc
réglée par la consigne, auteur par auteur, et chaque lot mélange les trois niveaux :

| Température | Ce que l'auteur reçoit | Rôle |
|---|---|---|
| Froid | la grammaire des finalistes à reprendre, un défaut précis à résoudre | affiner ce qui marche |
| Tiède | une forme imposée, à traduire dans le monde de DESIGN.md | diversifier par la forme |
| Chaud | aucune forme ; consigne de rupture maximale ; interdit de reprendre une liste de lignes par famille | sortir du cadre |

Le monde visuel (DESIGN.md) et la vérité des données restent fixes à toutes les
températures.

**Répartition par lot, fixée par le brasseur : « 4 tiède, 5 chaude, 2 froide »**, soit
11 mini-maquettes par lot (M2, M3, M4 et toute relance). Seule exception : la relance de
M1, lancée avant cette consigne avec 6 tièdes, complétée à 5 chaudes et 2 froides (13).

## Relance d'un lot

Le brasseur : « il faut relancer un batch de mini maquette si c'est pas concluant ».
La relance est obligatoire quand une étape n'est pas concluante, c'est-à-dire si :

- aucun finaliste n'atteint 7,0 au total, la note de la carte Territoire à la calibration ;
- ou un défaut partagé par la plupart des maquettes reste sans solution chez les
  finalistes (en M1 : le mur des familles neutres identiques).

Le pilote relance alors un lot de 11 mini-maquettes (`pNN` à la suite). Les nouveaux auteurs reçoivent le défaut à résoudre ; les tièdes et les chauds ne
voient pas le premier lot, les froids voient seulement ses finalistes. Le jury juge le second lot avec les finalistes du premier.
Une étape se relance une fois au plus, puis passe avec ce qui existe.

## Consolidation

Le consolidateur part du premier, puis greffe les idées nommées des autres finalistes,
le joker compris. Il
écrit `consolide/NOTE.md` : chaque greffe avec sa source, et ce qui a été refusé avec la
raison. Le résultat consolidé de M1 fixe la grammaire des pistes, reprise par M2, M3 et
M4.

## Garde-fous légers

- **Temps** : un auteur s'arrête après une capture de contrôle et une correction ; pas de
  polissage. Un tournoi qui dépasse 45 minutes passe au jury avec ce qui existe.
- **Quota** : le pilote lit l'usage avant chaque tournoi. Au-delà de 60 % de la semaine,
  les tournois suivants descendent à 6 mini-maquettes ; à 75 %, ils s'arrêtent et les
  3 versions sont faites avec ce qui existe (plafond de mission : 80 %).
- **Largeur du téléphone du brasseur** : ses captures de Beer Maverick font 924 px de
  large ; son écran fait donc environ 410 px CSS (estimation, densité inconnue). Les
  3 versions finales sont aussi capturées à 412 px, en plus de 390 et 1280.

## Après le choix du brasseur : rétrospective

On compare les notes du jury avec son choix et ses mots. Les critères qui ont prédit son
choix gardent leur poids ; ceux qui se sont trompés sont corrigés dans cette grille avant
le prochain écran de l'app (levure, eau…). La rétrospective va dans
`work/refonte-frontend/v4/tournoi/retro.md`.
