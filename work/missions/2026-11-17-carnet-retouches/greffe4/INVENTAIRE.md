# Carnet — inventaire de greffe 4 (17.11), sur son TROISIÈME classement

Portée (L01, étroite) : « seul l'ajout de note/idée, modifications de note, création, suppression de note/idée doivent
être revue, le reste c'est top ». Cinq gestes, chacun avant / pendant / après : (1) créer une idée ; (2) ajouter une
note (texte, lien, photo) ; (3) modifier une note et le titre de l'idée ; (4) supprimer une note, avec Annuler ;
(5) supprimer une idée, confirmation dans la page, jamais de boîte du navigateur.

Base (règle n° 1) : ra+p5f, `work/missions/2026-11-16-carnet-decision/ra-p5f/proto.html` (captures `ra-p5f/cap/`).
Captures ouvertes (thème clair, 390 px @2x ; images qu'il a classées, `maquettes/page2/img/*.webp`), montages :
`greffe4/cap/a-creer.png` (h05-2, h01-2, g02-2, h03-2, h02-2), `a2-creer.png` (h04-2, h06-2, base-E00, i02-2, i06-2),
`b-ajouter.png` (h02-4a, h05-4b, h06-4a, h03-4b, h04-4a, base-E01b), `b2-ajouter.png` (h05-4a, h03-4a, h03-4c, h06-4b,
h02-4b, h01-4 : non classés, mêmes versions retenues), `c-decor.png` (g05-1, i06-1, h05-3, i06-4, h01-6),
`d-base.png` (base E00, E01a, E01b, E06, E07a). Scripts : `greffe4/cap/montage.mjs`, `montage-base.mjs`.

## Décor figé (repris tel quel, jamais redessiné)

- Liste : **i06-1** (n° 1 ex aequo avec g05-1 ; « Chercher » sur l'idée sans article), g05-1 en alternative.
- Liste vide : **i02-2 / i06-2** (n° 2) : carte fantôme « Votre premier carnet s'affichera ici », flèche vers le champ.
- Carnet ouvert : **i06-4 / h05-3** (n° 2) : y compris la rangée de 4 tuiles « Ajouter à Ventilation : quoi ? Article ·
  Façon · Critère · Note » au-dessus du + devenu ×. Article ouvert : **h01-6** (n° 1).
- Habit commun : en-tête L'Affinée ‹ Nov. › loupe G/A, segment Stocks › Matériel, sous-segment À venir / Carnets /
  Réalisés, « ‹ Carnets » bleu, grand titre noir, champ en bas (appareil photo, petit micro, rien d'autre de voix),
  + carré noir à droite juste au-dessus de la barre Bord · Finances · Calendrier · Brassins · Stocks · Clients.

## Constat qui compte

**Aucune source ne dessine modifier ni supprimer** (grep « suppr / renomm / corbeille / modifier » dans greffe, greffe2,
greffe3, maquettes v01-v12 et la base : rien, sauf « Annuler » après une photo, h03-4b, et « Idée · à l'instant ·
Annuler », greffe2/v04.html l. 483). La base fixe deux règles utiles : « Annuler reste dans la feuille, pas en toast »
(proto l. 1948) et « un toast ne suit pas la navigation » (l. 2141). DESIGN.md : bouton `danger` = texte rouge
d'alerte sur fond transparent ; ui-compacte l. 258 : « la suppression secondaire peut passer par le menu de ligne ».
Donc les écrans 3 à 5 se greffent : décor figé (i06-4, h05-4a, i06-1) + grammaire d'une source classée (cadre
pointillé « arrive ici » de h05-2, bandeau « … · Annuler » de h03-4b, « Changer : » de h05-4a, feuille de h06-4a).

## Meilleure réalisation, écran par écran

| # | Écran | Ses classés | Meilleure réalisation | Pourquoi |
|---|---|---|---|---|
| 1a | Créer · avant | décor i06-1, i02-2/i06-2 | **i06-1** (et i06-2 si vide) | Figés. Champ « Une idée, un besoin… » en bas, + noir à droite ; vide : flèche « Écrivez ou collez ici ». |
| 1b | Créer · pendant | **1 h05-2** (Top2) · 2 h01-2 · 3 g02-2 · Top3 h03-2 · Top4 h02-2 | **h05-2** | Carte pointillée « Hotte au-dessus de la cuve · ↓ arrive ici · Nouveau carnet · Idée » en tête ; « Déjà un carnet, proche : Ventilation · Y ajouter en façon · ou Entrée : nouveau carnet » ; Vos carnets 4 avec pastille d'état ; « + Créer » vert collé au champ, au-dessus du clavier. Clair en 3 s : on voit où ça va. h01-2 : même chose plus compact (« IA : proche » + « Y ajouter ») ; g02-2 : puces « Va dans Nouveau carnet / Ventilation / Frigo » et « Ou collez le lien d'un article » ; h03-2 : filet d'état à gauche, « Entrée = Créer le carnet · un besoin, un objet, une idée ». |
| 1c | Créer · après (carnet neuf) | base-E01b (Top4) ; h02-4a, h05-4b (Top2, mêmes versions) | **haut de h05-4a / h02-4a, dans l'habit i06-4** | Titre « Évier inox », « Idée · 16 nov. · « 2 bacs pour laver les fûts » » (sa phrase gardée), rubriques vides qui disent quoi faire (« Ce qui compte · rien encore », « Articles · aucun : collez un lien »). Base E01b garde le grand titre et « Idée · 16 nov. » ; on retire la bulle IA lavande et « Dernier dépôt » (#15). Annuler la création : « Idée · à l'instant · Annuler » (h04, greffe2/v04 l. 483). |
| 2a | Ajouter · avant (quoi ?) | décor i06-4/h05-3 ; Top2 h06-4a ; Top4 h04-4a | **tuiles i06-4** + ligne « Lien copié · Coller » de h06-4a | Les 4 tuiles sont dans le décor qu'il a figé ; h06-4a (Top2) apporte l'exemple sous chaque type et « Coller » seulement s'il y a un lien copié. Les deux disent « quoi ? » avant de taper : fin du « fouillis ». |
| 2b | Ajouter du texte | Top2 h02-4a ; (h03-4c, h05-4a : versions retenues, non classés) | **h02-4a** | Carte « ↓ va atterrir ici · tiré de votre phrase · Un fût de 20 L couché entre dans le bac » au-dessus des rubriques ; puces « Va dans Façon / Ce qui compte / Article / Note » collées au champ ; Ajouter vert. h03-4c ajoute « Entrée = ranger la note dans Évier inox » ; h05-4a ajoute « Changer : Note / Façon » après l'atterrissage. |
| 2c | Ajouter un lien | Top2 h05-4b ; Top2 h06-4a | **h05-4b** | « Va atterrir ici · lien collé ✕ », dessin, 1 290 CHF TTC · en stock, Inox Riviera · CH, bacs 60 × 50 × 40 cm, « Bac de 40 cm : un fût de 30 L couché y entre », « Veille du prix, tous les 3 jours » (C3), « Où ? Évier inox / Nouveau carnet / Autre… », « Ajouter à Évier inox ». Tout l'objet en une carte. |
| 2d | Ajouter une photo | **2 h03-4b** | **h03-4b** | « ✓ Photo rangée ici, à l'instant · Annuler », « L'IA y lit 50 × 45 cm par bac, 45 cm de fond, robinet col de cygne, ni prix ni vendeur », « Chercher à ces cotes ». Le seul ajout déjà « après » avec Annuler : modèle de la suppression. |
| 3a | Modifier une note | aucune source | **i06-4 + cadre pointillé h05-2 + champ prérempli (base E06)** | Toucher la note : elle passe dans le cadre « se modifie ici » (même grammaire que créer), son texte remonte dans le champ du bas (C8, clavier ne cache rien), bouton « Enregistrer » vert ; puces « Changer : Note / Façon / Ce qui compte » (h05-4a) pour la déplacer. |
| 3b | Modifier le titre | aucune source | **titre i06-4 dans le cadre pointillé h05-2** | Toucher le titre : cadre pointillé autour, « Évier inox » dans le champ du bas, bouton « Renommer ». Même geste que 3a : une seule chose à apprendre. |
| 4 | Supprimer une note | aucune source ; Annuler de h03-4b | **ligne-fantôme dans la page** | La note supprimée laisse sa place : « Note supprimée · Annuler » (grammaire h03-4b), en gris, à l'endroit même ; pas de toast (règle de la base). Accès : ✕ rouge du cadre en modification (h05-4a / h05-4b ont déjà ce ✕) ou menu de ligne (ui-compacte). |
| 5 | Supprimer une idée | aucune source | **confirmation dans la page + ligne-fantôme dans i06-1** | Carte de confirmation dans le carnet : « Supprimer Évier inox ? 2 notes, 1 article ; la veille du prix s'arrête » · « Supprimer le carnet » (danger, texte rouge) · « Garder » ; après, dans la liste i06-1, à la place de la ligne : « Évier inox supprimé · Annuler ». Jamais de boîte du navigateur. |

## Meilleures idées isolées (une ligne chacune, sa source)

- **I1** Carte pointillée « ↓ arrive ici » qui montre la destination pendant la frappe — h05-2 (aussi h01-2, h03-2, h04-2, h06-2).
- **I2** « Déjà un carnet, proche : Ventilation · Y ajouter en façon · ou Entrée : nouveau carnet » — h05-2.
- **I3** « IA : proche » compact sur une ligne, bouton « Y ajouter » — h01-2.
- **I4** Puces « Va dans Nouveau carnet / Ventilation / Frigo » collées au champ — g02-2.
- **I5** « Ou collez le lien d'un article : il s'affiche avec sa photo » sous le champ — g02-2.
- **I6** « Entrée = Créer le carnet · un besoin, un objet, une idée » sous le champ — h03-2.
- **I7** Filet de couleur d'état à gauche des rangées de carnets — h03-2.
- **I8** Deux radios « Nouveau carnet / Dans Embouteillage · IA : proche » — h02-2 (Top4), h04-2, h06-2.
- **I9** « Idée · à l'instant · Annuler » sur le carnet tout juste créé — h04 (greffe2/v04.html l. 483).
- **I10** Sa phrase d'origine en italique sous le titre, « « 2 bacs pour laver les fûts » » — h05-4a, h03-4b, h06-4a.
- **I11** Rubriques vides qui disent quoi faire : « Articles · aucun : collez un lien » — h02-4a.
- **I12** « va atterrir ici · tiré de votre phrase » sur une note texte — h02-4a.
- **I13** Puces « Va dans Façon / Ce qui compte / Article / Note » — h02-4a, h02-4b.
- **I14** « Changer : Note / Façon » sur l'élément qui vient d'atterrir — h05-4a.
- **I15** « Entrée = ranger la note dans Évier inox » — h03-4c.
- **I16** « ✓ Photo rangée ici, à l'instant · Annuler » — h03-4b.
- **I17** « L'IA y lit » puis « Chercher à ces cotes » — h03-4b.
- **I18** Lien collé : aperçu complet, « Où ? », veille tous les 3 jours, un seul bouton « Ajouter à Évier inox » — h05-4b.
- **I19** Cote traduite en usage : « Bac de 40 cm : un fût de 30 L couché y entre » — h05-4b.
- **I20** « Lien copié : inox-riviera… · Coller » seulement s'il y a un lien copié — h06-4a, h04-4a.
- **I21** Feuille « Ajouter à Évier inox · quoi ? » avec un exemple sous chaque type — h06-4a, h04-4a.
- **I22** Rangée de 4 tuiles « Ajouter à … : quoi ? » au-dessus du + devenu × — h05-3, i06-4 (décor figé).
- **I23** Résultat rangé dans le carnet, une ligne par dépôt : « Photo · 50 × 45 cm par bac · lue par l'IA » — h03-4c.
- **I24** Champ du bas prérempli, cible marquée sous le texte (« rangé : prochaine étape ») — base E06.
- **I25** Annuler dans la page, jamais en toast — base (proto l. 1948, 2141).
- **I26** Bouton danger : texte rouge d'alerte, fond transparent — DESIGN.md `button-danger`.
- **I27** Suppression secondaire par le menu de ligne — docs/ui-compacte.md l. 258.
- **I28** Carte fantôme « Votre premier carnet s'affichera ici » — i02-2, i06-2 (décor figé).

## Six recettes

Rendues au pilote dans la sortie structurée (même dossier, pas de fichier séparé). Toutes : décor figé ci-dessus
inchangé ; + volant à droite au-dessus de la barre ; thème de l'app (fond clair, vert de zone Stocks, accents d'état
ambre/vert, rouge d'alerte seulement pour supprimer) ; rien sous 14 px ; statique HTML/CSS ; « exemple » en pied ;
micro petit dans le champ, sans plus.
