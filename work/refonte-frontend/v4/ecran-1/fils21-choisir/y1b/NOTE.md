y1b · « Le brassin au doigt », seconde passe de y1 (critique/SYNTHESE.md §3 et §4, critique/y.md). y1 reste intacte pour comparer.

- **Ce qui tient** :
  - **La frise sous le pouce, dès le premier écran** : un dock fixé au bas de l'écran ; chaque houblon y est un jeton nommé, à sa couleur, qu'on glisse par pas de 5′ de 60′ à 0′, puis whirlpool, dry hop actif, après, et **« puis »** (z1) pour enchaîner un second dry hop. La loupe ×3 s'ouvre au-dessus du dock, sans cacher ses graduations ; le lieu courant n'y est écrit qu'une fois, en grand.
  - **Preuve, jouée au doigt** (`jouer-y1b.mjs`, `geste-y1b.json`) : départ en dry hop actif avec US-05, agrumes de Citra 3,5 crans (barre 89 px), ≈ 60 IBU « tenue ». Jeton glissé jusqu'à 10′, doigt gardé : 3,0 crans (75 px), ≈ 89–103 IBU « trop amer », loupe ×3,0 (40,2 px par pas contre 13,4 ; bas de la loupe à 728 px, dock à 736). Glissé jusqu'à 60′ : 0,7 cran (19 px), ≈ 140–180 IBU. Retour en actif, Pomona au premier toucher : agrumes 3,5 → 3,9 crans, « Contre ton plan d’avant : agrumes ~+0,3 cran ». Second houblon (Galaxy) posé, puis glissé jusqu'à « puis » : la part de Galaxy en hachuré, « ≈ calculé ».
  - **Les 12 retouches communes** :
    1. état de départ en dry hop actif avec US-05 ; Pomona bouge au premier toucher ; Verdant et Diamond, que le moteur ne simule pas, sont dits une fois (feuille « preuve », les trous), sans bouton barré ;
    2. la réponse en une ligne (« Face à ta stout : tropicaux ~+4 crans, agrumes ~+3 crans · 3 hors du style · amertume tenue »), le « pourquoi » à un toucher ;
    3. le geste au premier écran (le dock) ;
    4. le résineux de ta dégustation une seule fois, sous la figure : « déjà hors style (ta dégustation), ~+8 points » ;
    5. aucun code sans mot : le jeton porte le nom du houblon, la jauge d'amertume ses segments nommés (« Nugget 60′ ≈ 60 », « 16D 50–70 », « + Citra ≈ 80–120 »), les deltas leur unité au dixième de cran sous 1,5, « ~ » ne veut dire que simulé ;
    6. la plage en bande pâle, une seule marque de borne partielle par ligne ;
    7. Lafontaine 2018 en lecture H, « vérifié (K) » (feuille « preuve ») ;
    8. le profil simulé corrigé (4,75 % vol.) : à 10′, Citra ne sort plus en agrumes (3,0 crans, au haut du style) ;
    9. le stock en icône grise (« à acheter » pour Citra en pellets), qui ne bloque rien ;
    10. les acquis de la baseline : au style / absolu, α du lot puis des fiches avec ≠ (Galaxy 17,2 %), usage en mot, stock en icône, « ? », appui long vers la fiche (FICHE et FICHE-BASELINE OK), pictos au trait ;
    11. hors grille, rien de barré : « ≈ interpolé » entre 60′, 10′ et whirlpool, « ≈ calculé » (saturation partagée, courbe du moteur) pour deux houblons à deux lieux ou à la suite hors des cas K3 et K4 ;
    12. le tirage est fixe tant que rien ne change (graine = le plan ; vérifié : même tirage au second toucher).
  - **Les greffes** : les réglages compacts de x1 (houblon et second houblon en pastilles qui s'ouvrent, dose 1–2–4–8 g/L, jours, levure) ; son **échelle par critère** en trois lignes sous la réponse (rester dans la 16D, IBU compris ; « par floral » change au toucher ; une ligne touchée s'applique) ; la **jauge d'amertume de toute la stout** (u3) ; le **plan d'avant en pointillé** (a3), écrit (« plan d’avant, Citra dry hop actif ») et repris dans la réponse (« Contre ton plan d’avant… ») ; la case **« puis »** (z1).
  - **Les trois blocs, à un toucher** : « Défi N sur 4 » (x5 : plus floral, moins résineux « hors houblon », amertume 50–70, dans la 16D) ; « Tire 20 bières » (y5 : vingt bières sur les familles, les plages ouvertes comptées à part comme un minimum, « ce qui tranche en vrai : 4MMP de Citra ×4–70,9 le seuil, même base ») ; « Preuve » (u5 : mesuré en bière, la simulation face au mesuré, l'écart énorme en bande log, les houblons en vrai avec l'huile, les trous).
  - **Troisième passe** (critique/seconde-passe.md) :
    - la réponse garde deux lignes courtes après un geste : « Face à ta stout » d'abord (à 10′ : agrumes ~+3 crans, tropicaux ~+3 crans · dans la 16D · trop amer), puis, derrière le pointillé, « contre ton plan d’avant » (baies ~−1,1 cran, tropicaux ~−1,1 cran) ;
    - la pastille de famille de l'échelle ouvre la liste (floral, agrumes, tropicaux) et un choix la referme ; preuve : « critère ouvert » puis « critère choisi : agrumes » dans `geste-y1b.json`, capture `y1b-critere.png`.
- **Ce qui casse** :
  - 134 mots au premier écran (110 visés) ; 63 hors données. Le reste, ce sont des données : 11 familles, trois lignes d'échelle, doses, IBU, moments.
  - La réponse tient sur trois lignes quand deux familles sortent du style (mots orangés plus larges).
  - « puis » pour Citra → Galaxy en actif avec Pomona n'est pas un cas du moteur : la suite est calculée (≈) et ressemble à l'ensemble ; l'ordre reste inconnu (dit au « pourquoi »).
  - Les plages du moteur sont presque toutes ouvertes (borne haute non publiée) : dans « Tire 20 bières », presque tout le compte est un minimum.
  - Les panneaux « Défi » et « Tire 20 bières » s'ouvrent sous le dock : il faut défiler un peu pour les lire.
- **Contrôles** (sur `etat.html`) :
  - `controle-commun.mjs … y1b --sans=mots` : COMMUN OK (couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, légende, parlant OK) ;
  - `mots-premier-ecran.mjs … --sans-donnees --max=70` : 63 mots (hors données), MOTS OK ; sans l'option : 134 mots ;
  - LISIBLE OK (16 pictos, 2 mesurées, 18 simulées, 0 faute) ; SIMULATION OK (16 réglages, le simulé bouge) ; CUMUL OK (la levure fait bouger le simulé, biotransformation visible) ; ALPHA OK (1 voie sur 1) ; FICHE-BASELINE OK (Citra, 12 familles, 17 pictos, 0 faute) ;
  - STANDARD OK sur y1–y5 et y1b ensemble.
- **Pire contraste** : 5,18:1, « tropicaux ~+4 crans » (#c2410c sur #fff, réponse hors du style).
- Généré par `generateur-y1b.mjs` (socle de `../y1/socle/socle.mjs`, dont le spectre a reçu deux options rétrocompatibles : `pale` et `sans`). Captures : `captures/y1b-390.png`, `y1b-premier-ecran.png`, `y1b-avant.png`, `y1b-pendant.png`, `y1b-apres.png`, `y1b-ensemble.png`, `y1b-puis.png`, `y1b-defi.png`, `y1b-tire.png`, `y1b-preuve.png`.
