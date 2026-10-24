# Picto « épicé », série C : le signe (v0, voie r4d-c-signe)

Un signe qui devient « épicé » par convention, comme la roue à rayons est devenue Agrumes. Huit
propositions, huit genres. Chacune se montre seule à 24, 16 et 12 px, à 12 px entre la feuille
(Herbacé) et les brins (Végétal), près d'Agrumes et de Floral, puis sur trois vraies cartes : Saaz
(épicé marqué, entre la feuille et les brins), Hallertau Mittelfrüh (épicé nommé en premier) et
Cascade (épicé cité). La carte reprend celle de Suggestions de la base v4.9 (`base/consolide/etat-b.html`),
au trait (D88) : usage en icône et en mot, nom, α, stock en petite icône, familles en couleur avec
leur niveau (▮▮ marqué, ▮ cité), moment et dose.

Régénérer : `node generer.mjs` (écrit `etat.html`), puis `node capturer.mjs` (`captures/planche-390.png`,
`tailles-390.png`, `cartes-390.png`). Loupe des vrais pixels (densité 1, ×3) :
`captures/travail/loupe.png`, par `node captures/travail/loupe.mjs etat.html <png>`.

## Propositions

| Id | Nom | genre | Ce qu'elle dit à un brasseur | Risque de confusion |
| --- | --- | --- | --- | --- |
| c1-initiale | É | lettre | L'initiale, accent compris : se lit sans rien apprendre | Une lettre parmi onze dessins ; accent net à 12 px (1 px de jour, vu en loupe), mais c'est un mot, pas une image |
| c2-diese | Dièse | signe musical | ♯ : la note relevée, donc le plat « relevé », mot de cuisine juste pour le poivré doux | À 12 px, il se lit « # » (hashtag, numéro) : la pente des barres ne se voit qu'à 16 et 24 px |
| c3-pique | Pique | jeu de mots | ♠ : « ça pique » un peu ; silhouette unique parmi les familles | Le sens tire vers le piquant (refusé avec le piment) ; à 12 px, le pied se fond ; peut se lire « carte à jouer » |
| c4-cycle | Cycle | molécule | Un cycle et deux branches : les huiles épicées du houblon (humulène, caryophyllène) en formule | L'icône de stock (cube, gris) est aussi un hexagone, sur la même carte ; à 12 px, un brasseur peut y voir un insecte |
| c5-fumet | Fumet vif | signe olfactif | L'odeur qui monte, mais en dents : vive, pas chaude | Les filets d'odeur se lisent parfois « chaud » (critique de r4c sur les volutes) ; à 12 px, « ss » ; deux filets, pas trois, pour ne pas rejoindre les brins de Végétal |
| c6-eclat | Éclat | éclat | Une pointe vive à quatre branches : la note qui pétille | L'étincelle sert souvent à dire « IA » ; une seule, sans petite sœur, pour s'en éloigner |
| c7-xin | Xīn 辛 | idéogramme | Le caractère qui veut dire « épicé » en chinois et en japonais (karai) : un vrai signe de l'épicé, à apprendre une fois | Inconnu pour un brasseur suisse ; à 12 px, ses cinq traits font un « pylône » ; le soufre des alchimistes, essayé d'abord, était le sapin de Résineux à 12 px |
| c8-meandre | Méandre | motif | La grecque des routes d'Orient : un motif, pas un objet | Aucun sens donné d'avance ; à 12 px, peut se lire « @ » carré ou « chargement » |

Nommés à voix haute sur la loupe à 12 px : c1 « É », c2 « dièse, ou dièse-hashtag », c3 « pique »,
c4 « molécule », c5 « odeur », c6 « étincelle », c7 « caractère chinois », c8 « grecque ». Aucun ne se
confond avec la feuille, les brins, la roue ni la fleur. Écartés pendant la passe : le carreau (losange),
trop proche de l'éclat à 12 px ; le soufre (triangle sur une croix), lu comme le sapin de Résineux.

## Refus précédents

- Lot 15, « pico épice très étrange, plutôt vanille, canelle ? » : pas d'objet d'épice dessiné dans cette
  série (c'est l'angle A) ; la convention porte le sens, pas la ressemblance.
- Lot 21, grains de poivre (« toujours pas bon ») : aucun dessin fait de cercles, aucun grain ni point en
  grappe (Petits fruits fait déjà trois cercles).
- Planche r4, sept épices-objets brunes (« Aucun me convient... ») : huit genres différents, aucune épice en
  petit objet brun ; ni badiane (d'où l'éclat à quatre branches seulement, pas huit), ni girofle, ni mortier.
- Planche r4c, trois piments (« quasiment identique », « un piment n'a rien à voir là-dedans ») : aucun
  piment, aucune flamme ; deux silhouettes trop proches (carreau et éclat) ont été départagées en gardant
  une seule. Le sens « brûlure » est évité : le dièse dit « relevé », le cycle dit « huiles du houblon ».
  Le pique garde une part de « piquant » : il est montré pour que le brasseur tranche, pas recommandé.
- Critique Fable de r4c (première passe) : É qui perd son accent à 12 px (ici E raccourci et accent
  détaché, vérifié en loupe), zigzag qui ne dit rien (ici, deux filets d'odeur en dents), couronne qui dit
  « favori » (aucune étoile à cinq branches ni couronne). Toujours montrées entre la feuille et les brins.
- Hachures écartées : dans l'app, le hachuré veut dire « inconnu ».

## Sources des cartes
α et familles : Beer Maverick (`prototypes/houblons-v4/data/proto-data.json`) ; Saaz : profil du prototype
(épicé « marqué » chez Hopsteiner). Rôle : Saaz et Hallertau déduits de l'α (≈), Cascade double usage.
Moment et dose : recette d'exemple, pas une donnée du houblon.
