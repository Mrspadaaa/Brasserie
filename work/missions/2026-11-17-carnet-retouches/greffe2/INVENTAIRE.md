# Carnet — inventaire de greffe 2 (17.11), sur son top 3 par écran

Base (règle n° 1) : ra+p5f, `work/missions/2026-11-16-carnet-decision/ra-p5f/proto.html` (captures `base-*`).
Sources : v01 à v12 (`maquettes/vNN.html`). Son classement mot pour mot : `TOP3.md`.
Captures ouvertes (thème clair, 390 px, @2x) : les images qu'il a classées (`maquettes/page2/img/*.webp`), assemblées par
écran dans `greffe2/cap/1-liste.png` … `9-avenir.png` (script `greffe2/cap/montage.mjs`), et l'habit de l'app
`ref-app/stocks-articles.png`, `fiche.png`, `calendrier.png`. Pas de nouvelle capture des HTML : ce sont exactement les
écrans qu'il a jugés.

Lecture (consigne) : un écran qui a un n° 1 part de ce n° 1. Sans n° 1, on fusionne ses n° 2, n° 3 et ses « Top ». Une
recette ne prend jamais un écran qu'il n'a pas classé (donc ni v02-3, ni v03-5, ni v08-8, ni v10-2, ni v11-4).

## Socle commun à toutes les recettes

1. **Parcours complet, 9 écrans dans son ordre** : Liste · Ajouter une idée · Un carnet ouvert · Ajouter à une idée ·
   Cartes d'article · Un article ouvert · Comparer · Choisir/choisi/pourquoi · À venir et Réalisés. Aucun manquant.
2. **Habit de l'app** (comparé à `ref-app`) : en-tête logo sur carré noir, ‹ Nov. › au centre, loupe en carré bordé,
   avatars G noir et A gris avec point ; segment Stocks à onglet actif **noir** (pas vert) ; sous-segment
   À venir / Carnets / Réalisés au style Étagère/Recompter (fond gris, actif noir) ; retour « ‹ Carnets » **bleu** ;
   titre de fiche en grand titre noir (style « Brouwland ») ; rangées à filet, rayon 8 ; mesures et prix en IBM Plex Mono ;
   pastille d'onglet Stocks bleue ; bouton plein = vert de zone Stocks ; dans Calendrier, l'achat prend le bleu
   « Achats et charges ». Pas de lavande ni de violet (violet = Événements).
3. **Barre du bas** : le champ (C8) à gauche, micro et appareil photo en petites icônes dedans, rien d'autre de voix ;
   le **+ carré noir** à droite, 4 à 24 px au-dessus des onglets Bord, Finances, Calendrier, Brassins, Stocks, Clients.
4. **Données au métier** (#5) : la photo d'un évier lit des dimensions de bac, pas « 230 V · 1,1 kW » ; 18/10 = 304 ;
   critère à l'endroit : « capter la buée à la source » (#24). Une seule mention « exemple », en pied (#25).
5. **Refusés tenus** : pas d'onglets En cours/Choisis (K1), pas de pastille « ✓ Choisi » ni « ✓ choix » (K2 : v10-1 en a
   une, à retirer), pas de « ↓ 600 CHF » (K3 : ancien prix barré ou « baisse le 13 nov. »), pas de barre d'étapes
   Idée/Façons/Articles/Choisi (K4 : celle de v10-4 saute), pas de fiche prix + caisse (K5), pas de voix au premier plan.

## Meilleure réalisation, écran par écran

| # | Écran | Ses classés | Meilleure réalisation | Pourquoi |
|---|---|---|---|---|
| 1 | Liste des carnets | **1 v09-1** · 2 v10-1 · 3 v12-1 · Top4 v11-1 | **v09-1** | Son n° 1 et « la meilleure vue du carnet » : groupes À comparer / Idée / Choisi, vignette, prix mono à droite, « Chercher » sur l'idée, « Dans À venir depuis le 16 nov. · Voir › ». Greffes possibles : groupe « En veille · relue tous les 3 jours », ancien prix barré (v10-1) ; section « À venir 1 » sous les carnets (v12-1) ; bandeau « À venir · Réalisés » en tête (v11-1). |
| 2 | Ajouter une idée | **1 v08-2** · 2 v05-2 · 3 v06-1 | **v08-2** | Son n° 1 : la carte pointillée « Tireuse 4 becs · Nouveau carnet · Idée · ↓ arrive ici » montre avant le geste qu'on crée un carnet (#12) ; la liste reste là, réduite à une ligne par carnet ; bouton « + Créer » vert. Greffes : « Déjà un carnet : Ventilation · Y ajouter » quand l'IA voit un proche (v05-2) ; ou le choix « Nouveau carnet / Dans Ventilation » (v06-1) ; « Entrée = Créer le carnet » (v05-2). L'icône lien du champ saute (une porte de trop, #3). |
| 3 | Un carnet ouvert | 2 v11-3 · 3 v03-1 · Top4 v04-1, v08-3, v12-2 | **fusion v11-3 + v03-1** | v11-3 : critère proposé par l'IA en tête, façons en deux cartes « Hotte ou extracteur ? » avec fourchette et Retenir/Écarter, articles en tableau par façon (débit, bruit, prix ; meilleur en vert), lien sans aperçu « Ouvrir ↗ », « Comparer côte à côte ». v03-1 : rangs 1 à 5 et valeur du critère en gros à droite. Top4 : v12-2 « Le critère sépare les deux façons · Retenir la hotte » (#13, #16) ; v08-3 « Ce qui compte · Valider / Changer » et zone pointillée « l'article arrive ici » pour le carnet neuf (#15, C7) ; v04-1 l'article qui se déplie sur place. |
| 4 | Ajouter à une idée | 3 base-E01b (Top4) · Top4 v06-4, v07-1, v07-2, v08-5 | **fusion v08-5 + base-E01b + v07-2** | Personne n'a de n° 1 ni de n° 2 : à refaire mieux. v08-5 : puces « Va dans Façon · Ce qui compte · Article · Note » au-dessus du champ, la cible dite avant le geste (#11) ; l'aperçu « arrive ici » avec photo, prix, cotes, « Veiller le prix, tous les 3 jours » (C3, #2). Base E01b : le cadre du carnet tout neuf (grand titre, « Idée · 16 nov. ») et « Coller le lien copié » (à ne montrer que s'il y a un lien, #14) ; sans la bulle IA ni « Dernier dépôt » (#15). v07-2 : « tiré de votre phrase », la phrase atterrit dans sa case, « Changer : Note · Façon ». v06-4 : le + dit QUOI (Article, Façon, Critère, Note), le champ dit COMMENT (#3). v07-1 : « Va atterrir ici · Où ? Nouveau carnet · Évier inox · Autre… ». |
| 5 | Cartes d'article | **1 base-E12b** (Top2) · 2 v01-1 · 3 v09-2 | **base-E12b, rendue parlante** | Son n° 1 : feuille « Articles · 6 », une carte par article, dessin, vendeur, prix mono, dispo, veille. Défauts à corriger depuis ses n° 2 et 3 (#6, #7) : « 8 valeurs » remplacé par la valeur du critère et son rang (« 40 ppb · 1re sur 5 », v01-1) ; même machine chez deux vendeurs en une carte, « 500 CHF d'écart » (v01-1) ; dispo en un vocabulaire (« en stock » / « délai 4 sem. ») ; œil + interrupteur → le mot « veille » ; puce « exemple » retirée ; groupement par façon avec « dès 1 450 CHF » et groupe « À compléter » (v09-2). |
| 6 | Un article ouvert | 2 v01-2 · 3 v02-2 | **fusion v01-2 + v02-2** | v01-2 : « photo de la page collée », « 1re sur 5 », règle O₂, 2 offres en radios, caractéristiques avec leur rang (2e, 4e) en mono, « Surveiller prix et stock · tous les 3 jours · revu le 13 nov. », bouton « Choisir · Abfülltechnik West » puis « Part dans À venir : … » (#4, #32). v02-2 : « Ouvrir ↗ » par vendeur (#4 : URL cliquable), « lu sur la fiche technique du vendeur, 12 nov. », « Veille tous les 3 jours · prochain passage le 19 nov. · oui », « Ses autres valeurs · place parmi les 5 ». Le bouton Choisir passe au vert de zone. |
| 7 | Comparer sur le critère | 2 v01-3 · 3 base-E14a · Top2 v03-4 | **fusion v03-4 + v01-3** | v03-4 (Top2) : les 5 machines en colonnes avec leur dessin en tête, ligne du critère surlignée, meilleur en vert, « La n° 1 : 2 vendeurs, prix et délai du moins cher » : compare d'emblée (#8). v01-3 : la phrase « Compromis : la 3e, 90 ppb pour 6 400 CHF » et « Écartés · 2 » avec leur raison (#33). Base E14a : barres classées du critère, « Classé par Oxygène capté » ; sa puce « ✎ à vous ✕ » saute. |
| 8 | Choisir, choisi, pourquoi | 2 v03-6 · 3 v12-3 · Top2 v03-7, v09-3 · Top3 v10-4 | **fusion v09-3 + v03-6** | v09-3 (Top2, sa vue préférée) : objet, photo, prix, pourquoi en une phrase, « Ce qui comptait », « Part dans À venir : … » + bouton plein vert, Écartés 4 avec photo, prix, raison (#10, #32). v03-6/v03-7 : « Choisi le 17 nov. » en carte, Pourquoi en puces, « Dans À venir depuis le 17 nov. · Voir dans À venir › », écartés numérotés par rang avec leur raison, « Changer d'avis ». v12-3 : trois valeurs clés de l'objet (Fûts 30 · Ambiante 43 °C · 2 000 L), « Revenir sur le choix ». v10-4 : pourquoi en coches ✓, écartés à raison métier (« ≈ 12 320 CHF avec la TVA d'import ») ; sans sa barre d'étapes ni son bloc violet. |
| 9 | À venir et Réalisés | 2 v10-5 · 3 v02-6 | **fusion v10-5 + v02-6** | v10-5 : dans Stocks › Matériel, sous-segment À venir ; « À commander 11 700 CHF », carte objet + vendeur + « depuis le 16 nov. · carnet Embouteillage » ; Réalisés 0 avec « La facture enregistrée dans Finances fait passer l'achat ici » (#1). v02-6 : « Ajouté le 17 nov. · du carnet Embouteillage », boutons « Fixer la date » et « Ouvrir le carnet », puis la semaine (#1 : vivant, pas un toast). La pastille violette « depuis le 16 nov. » de v10-5 devient neutre. |

La base ra+p5f garde deux écrans de son classement : les cartes d'article (E12b, son n° 1) et le carnet créé (E01b,
n° 3 d'Ajouter à) ; E14a reste une source du Comparer. Ses acquis C1 à C8 sont dans v09-1 et dans les sources ci-dessus.

## Meilleures idées isolées (une ligne chacune, sa source ; toutes tirées d'images qu'il a classées)

- **I1** Groupe « En veille · relue tous les 3 jours » en bas de liste, ancien prix barré, « Baisse le 13 nov. » — v10-1.
- **I2** Section « À venir 1 » sous les carnets, « Voir dans À venir › » — v12-1.
- **I3** Bandeau en tête : « À venir · Embouteillage, Frigo › » et « Réalisés 0 › » — v11-1.
- **I4** « Déjà un carnet : Ventilation · Y ajouter en façon » pendant la saisie d'une idée — v05-2.
- **I5** Choix explicite « Nouveau carnet / Dans Ventilation · IA : proche » avant de créer — v06-1.
- **I6** Puces « Va dans » au-dessus du champ, cible présélectionnée — v08-5.
- **I7** Le + dit QUOI (Article, Façon, Critère, Note), le champ dit COMMENT ; « Coller » seulement si un lien est copié — v06-4.
- **I8** « Va atterrir ici · tiré de votre phrase », la phrase dans sa case, « Changer : Note · Façon » — v07-2.
- **I9** « Ce qui compte · proposé par l'IA · Valider / Changer » sur le carnet neuf — v08-3.
- **I10** Zone pointillée « Un lien ou une photo : l'article arrive ici, avec son prix » — v08-3.
- **I11** « Le critère sépare les deux façons : seule la hotte capte la buée · Retenir la hotte » — v12-2.
- **I12** Façons en deux cartes avec fourchette de prix et Retenir / Écarter — v11-3.
- **I13** Rangs 1 à 5 sur une règle du critère en tête des articles — v03-1.
- **I14** Mini-règle du critère sur chaque rangée, annoncé plein, estimé pointillé, « ? non publié » — v04-1.
- **I15** Même machine chez deux vendeurs en une carte, radios, « 900 CHF de moins » — v04-1 (aussi v01-1, v02-2).
- **I16** « Part dans À venir : 11 400 CHF, en stock, Abfülltechnik, avec le pourquoi » sous Choisir — v04-1, v01-2.
- **I17** « Ouvrir ↗ » par vendeur ; « lu sur la fiche technique du vendeur, 12 nov. » — v02-2.
- **I18** « Ses autres valeurs · place parmi les 5 » — v02-2 ; rang par caractéristique (2e, 4e) — v01-2.
- **I19** Phrase de compromis sous le tableau — v01-3.
- **I20** Dessins des articles en tête des colonnes du tableau — v03-4.
- **I21** Trois valeurs clés de l'objet choisi en cases — v12-3.
- **I22** Pourquoi en coches ✓ ; raison d'écart chiffrée au métier (TVA d'import) — v10-4.
- **I23** « Fixer la date · Ouvrir le carnet » sur la carte arrivée dans À venir — v02-6.
- **I24** Réalisés vide qui dit comment s'y remplir : « La facture enregistrée dans Finances fait passer l'achat ici » — v10-5.

## Six recettes

Chacune garde le socle et les n° 1 (Liste v09-1, Ajouter une idée v08-2, Cartes d'article base-E12b), fusionne les
classés des autres écrans à sa façon et greffe au plus deux idées venues d'un autre écran. Détail : sortie structurée
rendue au pilote (champ `recettes`).

| Recette | Carnet ouvert | Ajouter à | Article ouvert | Comparer | Choisi | À venir | Idées d'ailleurs |
|---|---|---|---|---|---|---|---|
| G1 Ses n° 2 en cadre | v11-3 | base-E01b | v01-2 | v01-3 | v03-6 | v10-5 | I1, I4 |
| G2 Ses Top2 d'abord | v11-3 + v12-2 | v08-5 | v01-2 | v03-4 | v09-3 | v10-5 | I2, I15 |
| G3 Rangs | v03-1 | v07-1 | v02-2 | base-E14a | v12-3 | v02-6 | I14, I3 |
| G4 Le + dit quoi | v11-3 + v08-3 | v06-4 | v01-2 | v01-3 | v03-7 | v10-5 | I1, I5 |
| G5 Le carnet d'un fil | v12-2 | v07-2 | v02-2 | v01-3 | v12-3 | v02-6 | I15, I4 |
| G6 L'objet d'abord | v04-1 | base-E01b | v01-2 | base-E14a | v09-3 + v10-4 | v02-6 | I3, I5 |
