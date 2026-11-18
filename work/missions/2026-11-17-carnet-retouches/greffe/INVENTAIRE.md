# Carnet — inventaire de greffe (17.11)

Sources retenues par le brasseur : v01, v02, v04, v09, v10, v11 (« c4 » = v04), et la base ra+p5f
(`work/missions/2026-11-16-carnet-decision/ra-p5f/proto.html`). Sa parole : « v09 sur le vue du carnet est la meilleure ».
Captures 390, thème clair, prises et ouvertes le 17.11 : `greffe/cap/` (v01-page, v02-1 à 6, v04-1 à 3, v09-1 à 3,
v10-1 à 5, v11-1 à 4 ; script `cap.mjs`). Base : `maquettes/page/img/base-*.webp`. Habit : `ref-app/*.png`.

## Socle commun à toutes les recettes

- **Vue du carnet = v09, telle quelle** : liste (v09-1 : groupes À comparer / Idée / Choisi, vignette photo, prix mono à
  droite, « Dans À venir depuis le 16 nov. · Voir › »), fiche en cours (v09-2 : « Ce qui compte » + « Ensuite », articles
  groupés par façon avec « dès 1 450 CHF », groupe « À compléter »), fiche choisie (v09-3 : objet + prix + pourquoi, « Ce qui
  comptait », « Part dans À venir : … » + bouton plein vert, Écartés 4 et pourquoi). Aucune recette ne la redessine.
- **Habit de l'app, écarts de v09 à corriger** (comparé à `ref-app/stocks-articles.png`, `fiche.png`) — pas un
  redessin, un ajustement d'habit :
  1. en-tête : logo sur carré noir, **‹ Nov. ›** au centre, loupe dans un carré bordé, avatars G (noir) et A (gris) avec
     point ; v09 n'a ni mois ni la loupe bordée, avatars M/J verts et bruns ;
  2. segment Stocks : onglet actif **noir** (v09 : vert) ; sous-segment À venir / Carnets / Réalisés au style
     Étagère / Recompter (fond gris, actif noir), pas en pilules séparées ;
  3. retour « ‹ Carnets » en **bleu** (v09 : gris) ; titre de fiche en grand titre noir (~30 px, comme « Brouwland ») ;
  4. **+ carré noir** à droite, 4 à 24 px au-dessus des onglets (v09 : + vert) ; le champ v09 reste (C8), son micro et
     son appareil photo en petites icônes dedans, rien d'autre de voix (CR-VOIX) ;
  5. pastille d'onglet Stocks au style de l'app (bleue, pas brune) ; bouton plein vert = couleur de zone Stocks, gardé ;
  6. une seule mention « exemple » en pied (v09 la tient déjà, #25).

## Meilleure réalisation, écran par écran

| # | Écran du parcours | Meilleure | Pourquoi | Autres candidates |
|---|---|---|---|---|
| E1 | Liste des carnets (repos) | **v09-1** | Son choix ; rangées groupées par état, objet en photo, prix mono, idée vide avec « Chercher » ; 40 mots environ (#21, #26, #27, #28) | v10-1 (veille en rangée), v11-1 (bandeau À venir) |
| E2 | Ajouter une idée (champ ouvert, clavier) | **v10-2** | Puces « Va dans : Nouveau carnet · Ventilation · Évier » : on voit avant le geste qu'on crée un carnet ou qu'on range ailleurs (#12, #11) ; « Ou collez le lien d'un article : il s'affiche avec sa photo » ; bouton « Noter » clair ; liste visible au-dessus | v11-4 (libellé « Ajouter à … · une note, un lien, une photo ») ; base E01b à fuir (écho sans rapport, IA prématurée) |
| E3 | Carnet neuf, vide (Évier) | **v01 annexe « Évier inox · nouveau, rien encore »** | Une seule aide : « Collez le lien d'un évier avec le + : sa carte se range ici, classée » et « L'IA propose ce qui compte : un bac assez profond pour un fût de 20 L · Garder / Autre » (C7, #15 : pas de tuiles de zéros) | v09-1 rangée Idée « Chercher » ; v10-1 « Idée · Coller un lien » |
| E4 | Fiche en cours (à trancher) | **v09-2** | Son choix ; façons = groupes d'articles avec leur prix de départ, « Ensuite » unique (#16, #22) | v11-3 (façons en deux cartes Retenir / Écarter), v10-3 (façons + articles « déborde la cuve de 40 cm ») |
| E5 | Ajouter à une idée (clavier, dans la fiche) | **v11-4** | « Ajouter à **Ventilation** · une note, un lien, une photo » : la cible est dite avant le geste ; fiche visible au-dessus ; 📷 🎤 petits, flèche d'envoi noire (#11, #14, C8) | v10-2 avec la puce du carnet courant présélectionnée |
| E6 | Lien collé, retour du dépôt | **v09-2, groupe « À compléter »** | Le lien devient une rangée tout de suite, dans son groupe, ou « Lien sans aperçu · Compléter » en un seul message (#2, #29, C3) | v11-3 rangée « page sans aperçu · Ouvrir ↗ » |
| E7 | Article ouvert | **v04-1 (déplié sur place)** | Photo de l'objet, 4 valeurs clés en mono (becs, bt/h, bar, sol), même machine chez 2 vendeurs en une carte à boutons radio avec « 900 CHF de moins », règle O₂ et règle prix avec le rang, veille « tous les 3 j » avec mot, « Choisir chez Abfülltechnik » + « Écarter », et ce qui part dans À venir (#4, #6, #7, #9) | v02-2 (vendeurs avec « Ouvrir ↗ », « place parmi les 5 »), v01 (feuille, « photo de la page collée », « 1re sur 5 ») |
| E8 | Comparer côte à côte | **v01 « Côte à côte »** | Les 5 machines en colonnes 1re à 5e, meilleure valeur surlignée, puis une phrase « Compromis : la 3e, 90 ppb pour 6 400 CHF » : compare d'emblée, sans réglage (#8) | v02-1 (tableau Machine / O₂ / Prix / bt/h / Délai), v11-3 (tableau par façon, meilleur en vert) |
| E9 | Choisir | **v02-3 (feuille)** | « Chez quel vendeur ? » en radios avec prix, « Pourquoi · proposé par l'IA, à corriger si besoin » pré-rempli, « Un mot suffit. Les 4 autres restent dans le carnet », aperçu « Part dans À venir », un seul bouton « Choisir et mettre dans À venir » (#9, #32, K2 évité) | v04-1 (bouton dans l'article déplié + « Part dans À venir : … ») |
| E10 | Fiche choisie | **v09-3** | Son choix ; objet, prix, pourquoi, écartés avec leur raison (#10, #23, #33) | v04-2 (« Voir dans À venir › » noir), v11-2 (colonne de mesure dans les écartés) |
| E11 | Pourquoi ce choix | **v04-3 (feuille)** | Une phrase, puis les deux règles (O₂, prix) qui montrent la place du choisi, puis critère, façon, stock, et l'écarté incertain (#31) | v02-5 (liste de coches ✓ / ✕, plus courte) |
| E12 | À venir (sortie, C4) | **v02-6** | Carte « Ajouté le 17 nov. · du carnet Embouteillage » avec « Fixer la date » et « Ouvrir le carnet », puis la semaine : vivant, pas un toast (#1) | v10-5 (sous-vue À venir de Matériel, cohérente avec le sous-segment de v09) |
| E13 | Écarter / écartés | **v09-3 « Écartés · et pourquoi »** + geste **« Écarter » de v04-1** | La raison métier, jamais « façon écartée : … » (#33) ; un mot, pas un × (#9) ; « Reprendre » sur l'écarté (v04-1) | v11-2 (mesure du critère en colonne : 43 °C, 38 °C, 30 °C) |

La base ra+p5f n'est meilleure sur aucun écran (E01b, E12b, E14a, E15 portent les défauts 2, 4, 6, 8, 15 de SYNTHESE) ;
d'elle restent les acquis C1 à C8, tous présents dans v09 et les sources ci-dessus.

## Meilleures idées isolées

- **I1** Puces « Va dans » au-dessus du champ (Nouveau carnet, carnets en cours) — v10-2.
- **I2** Libellé de cible au-dessus du champ : « Ajouter à **Ventilation** · une note, un lien, une photo » — v11-4.
- **I3** Critère proposé par l'IA en segment (Oxygène · Prix · Cadence · Délai), « L'IA propose : le moins d'oxygène capté » — v02-1.
- **I4** Rang 1, 2, 3 sur la vignette ; « ? » pour une valeur non publiée, avec fourchette de l'IA — v02-1, v04-1.
- **I5** Mini-règle du critère sur chaque rangée d'article (annoncé plein, estimé pointillé) — v04-1.
- **I6** Même machine, plusieurs vendeurs : une carte, radios, « 900 CHF de moins » — v04-1 (aussi v02-2, v01).
- **I7** Veille dite en mots : « Veille tous les 3 jours · prochain passage le 19 nov. · oui » — v02-2.
- **I8** « Part dans À venir : 11 400 CHF, en stock, Abfülltechnik, avec le pourquoi » sous le bouton Choisir — v04-1.
- **I9** « Ses autres valeurs · place parmi les 5 » (2e ex aequo, 1er ex aequo) — v02-2.
- **I10** Une phrase de compromis sous le tableau côte à côte — v01.
- **I11** Mesure du critère en colonne dans les écartés (tient 2 °C jusqu'à 43 °C) — v11-2.
- **I12** Façons en deux cartes « Hotte ou extracteur ? » avec fourchette de prix, Retenir / Écarter — v11-3.
- **I13** « Voir dans À venir › » en bouton noir dans la carte du choix — v04-2.
- **I14** Carte d'arrivée dans À venir : « du carnet Embouteillage · Fixer la date · Ouvrir le carnet » — v02-6.
- **I15** Carnet vide : l'IA propose le critère, « Garder / Autre » — v01 annexe.
- **I16** Groupe « En veille · relue tous les 3 jours » en bas de liste, ancien prix barré — v10-1.
- **I17** Tableau de mesures par façon (débit, bruit, prix ; meilleur en vert) — v11-3.
- **I18** Pourquoi en coches ✓ / ✕ d'une ligne, avec date et source — v02-5.
- **I19** Bandeau « À venir : Embouteillage, Frigo › » en tête de Matériel — v11-1.
- **I20** « Les mots du carnet » (façon, ce qui compte, écarté) en trois lignes — v01 annexe (#24).

À écarter partout : barre d'étapes Idée / Façons / Articles / Choisir de v10-3 et v10-4 (proche de K4), bloc violet
« Dans À venir » de v10-4 (violet = Événements), puce « exemple » sur chaque carte (v02, v04), Commande vocale au-delà
de l'icône micro (CR-VOIX).

## Six recettes

Chaque recette garde le socle (E1, E4, E10 = v09 ; habit corrigé ; E6 = groupe « À compléter » de v09-2 ; E13 = écartés
v09-3 + geste « Écarter » de v04-1) ; elle choisit les autres écrans et greffe au plus deux idées. Détail : sortie
structurée rendue au pilote (champ `recettes`).
