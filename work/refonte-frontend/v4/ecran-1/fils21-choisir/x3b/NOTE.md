x3b · Ma cuve, jour après jour : seconde passe de x3, retenue par le critique. x3 reste intacte. **Chaude** : la frise du temps, au doigt.

- **Ce qui a changé**, retouches communes (§3 de la synthèse) :
  1. **Départ en dry hop actif avec US-05** : la suite Citra 3 j puis Idaho 7 5 j, le cas K4 du moteur. Les quatre levures y sont simulées ; chacune fait bouger les barres au premier toucher (Pomona : agrumes 2,8 → 3,4 crans, « ~137 µg/L citronellol »). Une levure non simulée se dit une fois (« Diamond : pas encore simulée ici »), sans bouton barré. En « après », plus de bascule : la rangée laisse la place à « levure au repos : glisse l’ajout avant J6 pour qu’elle compte ».
  2. **La réponse en une ligne** : un verdict de 12 à 20 mots (« Faisable, mais Idaho 7 reste 2 j sans gain mesuré, hop creep possible, ~ tropicaux hors de la 16D »). Les explications passent derrière le « ? », le défi et la preuve.
  3. **Le geste au premier écran** : la frise sous le titre, les blocs et « tenir » visibles sans défiler.
  4. **Le résineux de la dégustation, une fois**, hors des barres : « Résineux déjà au-delà, ta dégustation ».
  5. **Aucun code sans mot** : chaque couloir, bloc et ruban est nommé ; « ~ » ne veut dire que « simulé » ; « +2 j sans gain » est écrit sur le hachuré.
  6. **Une seule marque de borne haute par barre** : un petit triangle, quand la borne est partielle ou sort de l'échelle. La plage est en pâle derrière la barre, plus de moustache.
  7. **Lafontaine 2018 en lecture H, « vérifié (K) »**, dans la preuve : agrumes 4,4 → 7,1 → 7 sur 15 de 2 à 16 g/L, herbacé 4,3 → 10,4.
  8. **Régénéré sur le profil corrigé** (4,75 % vol.) et sur `comparatifs-dryhop.json` relu.
  9. **Le stock ne bloque jamais** : il n'est qu'une icône grise sur la ligne du houblon, et le verdict dit toujours « Faisable ».
  10. **Les acquis de la baseline** : la lentille, l'α du lot puis les fiches (≠, cryo, pellets), l'usage en mot, la fiche à l'appui long (sur les noms de la frise et sur les blocs), les pictos au trait.
  11. **Les chemins hors grille s'aimantent au cas simulé le plus proche, et le disent** (« aimanté : posé à J7, après fermentation : le jour simulé » ; « simulé après fermentation seulement »).
  12. **« Tire une bière » est fixe** tant que le plan, la levure et le jour ne changent pas (graine tirée de ces réglages).
- **Ce qui a changé**, retouches et greffes propres à x3 (§1 et §4) :
  - **Les scénarios tiennent en une ligne repliable** (« Citra 3 j, puis Idaho 7 5 j (actif) ⌄ »).
  - **Les blocs se glissent et s'étirent (u2), aimantés aux cas simulés** :
    - glisser le second houblon sur le jour du premier, c'est « ensemble » (K5) ; le laisser trois jours plus loin, « à la suite » (K3, K4) ;
    - glisser Citra après J6, c'est après fermentation (J7), et la levure s'endort ;
    - étirer le bord d'un houblon seul se range à 1, 2, 3, 5 ou 7 j (grille du moteur) ;
    - le verdict, les rubans et les barres suivent pendant le geste.
  - **« Tenir » (y2)** : le doigt posé fait passer un jour toutes les 0,35 s, et « depuis hier » s'écrit en bulle (« baies ~+0,6 cran, floral ~+0,3 cran, tropicaux ~+0,3 cran » le jour où Idaho 7 entre).
  - **Les repères mesurés sur la barre de contact (v3)** : 1, 2 et 3 jours, avec leurs sources (E10, E08, [73], [92]), puis le hachuré « sans gain ».
  - **Le plateau dès 24 h (r2)** : les rubans sont dessinés en marches jour par jour, plus lissés.
  - **« À la suite : plus tard, pas plus » (a6)** : « ~ tropicaux 31 à la fin contre 31 ensemble ; atteint J6 au lieu de J3 ».
  - **Les trois blocs communs** :
    - **Ton défi**, la dégustation du 18.10, en quatre cartes (x5) : plus floral, moins résineux (hors houblon), amertume 50–70, dans la 16D ;
    - **Tire une bière** (y5) : un point par famille, tiré dans la plage, orangé hors de la 16D, avec le compte. Les familles à borne haute partielle sont dites « plage ouverte, non comptée » ;
    - **La preuve** (u5) : les mesures en bière, « la simulation tombe-t-elle juste ? » (trois calculs encadrent la mesure, le 3MH de Cascade est en dessous), et les trous.
- **Ce qui casse** :
  - Le premier écran compte 116 mots au total (cible 110), dont 53 hors données. Les noms de familles, des ruban et des barres, en portent l'essentiel.
  - L'aimant restreint beaucoup :
    - seuls J2 (actif) et J7 (après) sont simulés pour le jour d'entrée ;
    - les suites et les ajouts cumulés ont des durées fixes ;
    - Diamond n'existe que pour Citra puis Idaho 7 ;
    - la dose d'un houblon seul reste à 4 g/L, et celle de deux houblons à 2 + 2 g/L.
  - « Tenir » au-delà du plateau ne montre plus rien (« ~ presque rien ne bouge ») : c'est la leçon, mais le geste perd son intérêt.
  - Le citronellol d'US-05 en fermentation active s'affiche « ~0–1004 µg/L, non publié » : la borne haute du moteur (87 % de conversion) peut impressionner.
  - Le végétal compte « hors de la 16D 12 fois sur 20 » dans « Tire une bière » : sa plage du moteur est large sans être marquée partielle.
  - Sur la frise à 17 jours (17 px par jour), les repères 1, 2, 3 sont serrés.
- **Contrôles** (sur `etat.html`) :
  - `node O/controle-commun.mjs D x3b --page=etat.html --sans=mots` → `COMMUN OK` (mots sauté ; couleurs, au-style, survol, blocs, contraste, fiche, standard, trait, legende, parlant OK) ;
  - `node O/mots-premier-ecran.mjs D x3b --page=etat.html --sans-donnees --max=70` → `x3b 53 mots (hors données)`, `MOTS OK` ; sans l'option : `x3b 116 mots` ;
  - `x3b · 24 pictos · 6 mesurées · 16 simulées · 0 faute(s)` → `LISIBLE OK` ;
  - `x3b · 2 simulation(s) · 9 réglage(s) · 13 mesurée(s) · le simulé bouge` → `SIMULATION OK` ;
  - `x3b · 1 ajout(s) cumulé(s) · 4 choix de levure · biotransformation visible · la levure fait bouger le simulé` → `CUMUL OK` ;
  - `x3b · 2 voies · 2 avec leur α` → `ALPHA OK` ;
  - `x3b · fiche de Citra · 12 familles nommées, 17 pictos · 0 faute(s)` → `FICHE-BASELINE OK`.
- **Preuve du geste** (`node jouer-x3b.mjs` → `geste-x3b.json`, captures `captures/x3b-geste-*.png`, aucune erreur de page) :
  - **tenir** : J4 → J6 (« depuis hier : baies ~+0,6 cran… ») → J8 ;
  - **glisser Idaho 7 sur Citra** : bloc Idaho 7 de x = 169 à x = 117 px pendant le geste ; barre des tropicaux 43 → 47 px ; verdict « … mais hop creep possible… » ; au lâcher, « Citra + Idaho 7 ensemble (actif) », tropicaux 2,8 → 3,1 crans à J4 ;
  - **Pomona** : agrumes 2,8 → 3,4 crans, « ~137 µg/L citronellol » ;
  - **glisser Citra après J6** : « aimanté : posé à J7, après fermentation : le jour simulé », plus de hop creep dans le verdict, « levure au repos » ;
  - **étirer Citra seul de 3 à 7 j** : « Citra reste 4 j sans gain mesuré », profil inchangé (plateau du moteur).
- **Pire contraste** : 4,64:1, « ~ tropicaux hors de la 16D » (#c2410c sur #fdf0ea) ; aucun texte sous 4,5:1.
- **Fichiers** :
  - générée par `node generateur-x3b.mjs`, avec le socle de `../x1/socle-x.mjs` et les vraies valeurs de `../x1/valeurs-reelles.json` (`node ../x1/reelles.mjs`) ;
  - `jouer-x3b.mjs` utilise `../y1/socle/jouer.mjs`, en lecture.
