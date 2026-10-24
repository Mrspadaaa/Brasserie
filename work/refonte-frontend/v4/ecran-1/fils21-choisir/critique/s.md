# Critique de la série s (s1–s3) : « simulation et simulateur »

Regardé, à 390 px : s1 (premier écran, page, glissé, après-glissé, deux, deux-bas, légende, fiche,
absolu), s2 (premier écran, page, écarts, réglé-choisi, légende, absolu, fiche), s3 (premier écran,
page, case 60′, Cascade mesuré, bas, légende, absolu, fiche), et les trois NOTE.md.

Gestes joués par moi (puppeteer-core, Chrome, 390 × 844) :
- **s1** : Citra glissé au doigt de « après » jusqu'à 60′, 24 pas en 1 s. Le profil s'est redessiné
  pendant le geste, l'étiquette a suivi (« Citra · 60′ 4 g/L »), l'écart s'est écrit (« dry hop après
  → 60′ : Tropicaux −3 crans, Agrumes −3 crans, Baies −3 crans »), « 4 hors » est devenu « 1 hors ».
  Puis la dose 4 → 8 g/L : agrumes +0,7 → +1 cran. `?etat=deux` vérifié : Citra 2 g/L à J7, Galaxy
  2 g/L à J10, c'est bien K3 ; mais la capture `s1-deux.png` montre un autre état (Citra 4 g/L à
  10′ + Galaxy 2 g/L après, Pomona).
- **s2** : plan B touché (« régler B »), vue « écarts » (« B contre C : Melon −0,9 cran, Tropicaux
  −0,7… »), dose 2 → 4 g/L : la phrase « doses ou moments différents : A 4, B 6, C 4 g/L ; l'écart
  mêle houblon et dose » apparaît.
- **s3** : case 60′ 4 g/L (le détail devient « Citra, 4 g/L, 60′ », l'écart à la case d'avant s'écrit,
  la case d'avant reste cerclée) ; case actif 4 g/L puis Pomona : Noyau ~2,3 → ~2,5 cran, « ~ US-05 →
  Pomona : presque rien ne change », la ligne géraniol → citronellol apparaît sous le détail ; « avec
  Galaxy » : résineux +0,8 et végétal +0,6 cran entrent dans le détail, mais son titre reste « Citra,
  4 g/L, dry hop actif, 3 j ». Chaque case a un libellé accessible (« 60′, 4 g/L : ~ au style 16D »).

Ses mots entre « guillemets » ; mes déductions marquées [critique].

## s1 — la ligne du brassage

**Première réaction** : « Ah ça c'est bien : je glisse Citra et je vois tout de suite ce qui bouge,
et ça me répond pour 10′ ou 60′. Mais il y a beaucoup de texte en dessous, et la levure fait rien ? »

**Ce qui va**
- Le geste. « P2 le grossissement suit le doigt » : ici, c'est le profil qui suit le doigt, et
  l'écart du dernier geste s'écrit. « Pourquoi à 10′ pas à 60′ ? Aussi ? » a sa réponse dans la main.
- Les 12 familles nommées, picto et mot (« Les icône sont pas parlant du tout » : évité), l'écart
  écrit avec son unité, l'orangé au-delà du style, et la réponse en une ligne : « 4 hors du style
  16D » (D60, une réponse écrite).
- L'honnêteté : « ~ simulé », Pépins « inconnu » hachuré, bandes entières (le résineux jusqu'au
  bord), la confiance en points et en mot, « après fermentation : sans effet simulé » et « essayer en
  actif ». « Jamais zéro » : tenu.
- Les vraies valeurs sous le pli : α du lot puis fiches, huile, linalol et 4MMP sur bande
  logarithmique avec le seuil (×0,06–2060 se voit en entier : « il faut que ça se voit pas que ce
  soit effacé »), le mesuré en bière (Citra 144 µg/L contre Centennial 78,4), les trous écrits
  (« Citra contre Cascade : aucune étude lue ») et la réserve « le linalol simulé est 2 à 5 fois
  au-dessus des mesures publiées ». « Je veux aussi des vrais valeur » : servi.
- La baseline gardée : pictos au trait, au style par défaut, α, usage en mot, « ? », appui long vers
  la fiche de la base. Les barres couchées pour nommer les familles : écart assumé et écrit.
  [critique] Il l'acceptera : il a cerclé les icônes muettes plus fort que les barres verticales.

**Ce qui ne va pas**
1. 149 mots au premier écran. Les noms et les écarts sont des données ; mais « pourquoi Les agrumes
   plafonnent, l'herbacé monte », « pourquoi Hop creep sur toute la recette », « inconnu en bière
   noire », « glisse-le » sont des explications au premier plan : « les info sont des actionnable pas
   des "information, warning" ou explication » (C081) ; « Attention, trop de texte » (D73).
2. La ligne n'a que 60′ et 10′ dans l'ébullition, et pas de loupe sous le doigt : « Je veux choisir
   pas de 10' défini, pas de timing imposé hein » (D34), « un truc type UX apple qui zoom focus là où
   on est » (D47). [critique] La grille du moteur impose cinq moments en v0, soit ; mais une ligne qui
   invite à glisser et n'accroche qu'à deux minutes le fera réagir.
3. Au départ (après fermentation), la levure ne fait rien : toucher Pomona ne bouge rien. Honnête,
   mais l'écran dit « la levure, ça ne change rien » à celui qui veut comprendre la bio : une rangée
   de boutons morts, comme « les −/+ ne changeaient rien » (D43).
4. Le résineux de la dégustation (83, orangé plein) domine le profil ; on distingue mal ce qui était
   là de ce que Citra ajoute (+1 cran) : trois couches (zone, contour, plein) sur une ligne.
5. Pendant le glissé vers l'ébullition, les repères « 24 h / 3 j : plafond » restent à J7 (la NOTE le
   dit) : un repère qui ne suit pas le jeton trompe pendant le geste.
6. Deux sens pour « ~ » : « ~ simulé » en haut, « ~2,5 crans » = « avant inconnu » à droite. Il
   demandera « c'est quoi la différence entre +4 et ~2,5 ? ».
7. La capture « deux » ne montre pas K3 (voir les gestes) : à refaire sur `?etat=deux`.

**À essayer**
- Replier les « pourquoi », « inconnu en bière noire » et « glisse-le » à un toucher : ≈ 110 mots,
  sans toucher aux données.
- La ligne : graduations d'ébullition sous le doigt (loupe, D47 et D63 ; au moins 60, 45, 30, 20,
  15, 10, 5, 0 aimantés) ; la barre des jours cachée quand le jeton est à chaud ; les repères 24 h et
  3 j suivent le jeton.
- État de départ en dry hop actif avec US-05 (Pomona bouge), « après » à un toucher ; ou, si
  « après » reste, levures grisées avec « au repos » écrit dans le segment.
- Un seul « ~ » (simulé) ; « avant inconnu » en gris à côté de l'écart quand c'est le cas.
- Le résineux : l'avant en contour fin, l'apport en plein, et rien d'autre sur la ligne.

**Verdict : à garder** (candidat pour les 5), à pousser sur le texte, la loupe et l'état de départ.

## s2 — trois plans côte à côte

**Première réaction** : « Trois plans, c'est ce que je voulais comparer, Citra 3 j puis Galaxy 7 j.
Mais là je vois aucune différence, les trois barres sont pareilles partout. Il faut appuyer sur
"écarts" pour voir quelque chose ?? Et c'est quoi "réf." ? »

**Ce qui va**
- La question est la sienne (K3) : trois cartes qui disent houblons, dose, jours, α, confiance ; « à
  dose égale : 4 g/L à cru chacun, même moment » et, dès qu'on touche la dose, « doses ou moments
  différents : l'écart mêle houblon et dose ». Honnête, dans ses mots.
- La vue « écarts » (± 3 crans contre la référence) montre ce que « valeurs » cache : Citra 3 j puis
  Idaho 7 donne un peu moins de fruit que Citra seul. Le classement par famille au toucher du nom
  (« Tropicaux, du plus au moins : B ~4,2 · A ~4,1 · C ~4,1 ») est une réponse écrite ; le dock garde
  « choisi : C ». Rien n'est classé à sa place : « le jury filtre, le brasseur décide ».
- Tout se règle par plan ; vraies valeurs du plan touché, bandes log, mesures, trous ; « inconnu :
  bière noire, ordre et synergie ».

**Ce qui ne va pas**
1. La vue « valeurs » par défaut : trois barres de 5 px par famille (plein, contour, hachures),
   écarts sous 1 cran, tout pareil. « très compliqué à voir les différence » (D77), « ils sont tous
   un peu semblable » (D38). La différence ne se lit qu'en « écarts », à un toucher.
2. A, B, C et un code de texture (▬ ▭ ▥) : un code à légende, pas un nom. Il nomme ses plans par
   leurs houblons.
3. « réf. » : un mot abrégé, jargon. « c'est quoi ce double boul violette ? » (D81) : même réflexe.
4. 166 mots : les cartes répètent la plage de fiches trois fois, « moyenne / bonne » en toutes
   lettres, et les écarts de la grille s'ajoutent.
5. Le moment vaut pour tout le plan et « puis » n'est pas en jours (la NOTE le dit) : K3 n'est pas
   vraiment « Citra 3 j puis Galaxy 7 j », c'est deux doses au même moment. [critique] Il le verra.
6. Même levure inerte au départ (voir s1, point 3).
7. Le simulateur dit Citra + Galaxy ≈ Citra + Idaho 7 ≈ Citra seul : « il faut quand même que notre
   modèle arrive justement à différencier » (D85). Pas la faute de la page, qui écrit la réserve
   (« Idaho 7 sans doute trop bas »), mais l'écran le rend criant.

**À essayer**
- « écarts » par défaut (au moins dès que le plus grand écart à la référence est sous 1 cran), et
  dans « valeurs », n'empiler que les familles qui diffèrent.
- Nommer les plans par leurs houblons (« Citra → Galaxy », « Citra → Idaho 7 », « Citra seul ») dans
  la grille et le dock ; la texture reste un second signe.
- « réf. » → « comparer à » (toucher une carte suffit, la pastille le dit).
- Cartes sans la plage de fiches (elle est dans la fiche), confiance en points seuls : ≈ −25 mots.
- Le second houblon avec son moment et ses jours (le « puis » de K3), et la ligne de s1 sous les
  cartes pour le voir.

**Verdict : à pousser plus loin.** Le concept (plans comparés, écart à une référence, classement par
famille) est juste ; la vue par défaut ne montre pas la différence.

## s3 — la carte des possibles

**Première réaction** : « Ça c'est pas mal : d'un coup je vois que 60′ sert à rien pour l'arôme et
que ça sort du style dès 4 g/L. Mais les petites barres on voit rien, et c'est quoi la grosse barre
grise partout ? »

**Ce qui va**
- Vingt options d'un coup : la colonne 60′ plate à toutes les doses (« Pourquoi à 10′ pas à 60′ ? »
  répondu sans toucher), « N hors » en orangé dès 2 g/L après fermentation, « 11 cases sur 20
  restent au style 16D ». « Mieux comprendre, mieux choisir », « voir un Max d'info au même
  endroit » : c'est ça.
- Une case touchée ouvre son détail : les 12 familles nommées, l'écart à ma bière et l'écart à la
  case d'avant, écrits ; la case d'avant reste cerclée. « mesuré » posé sur les cases qui ont une
  étude (Cascade 1 j : Lafontaine 2018 à côté du simulé, « à vérifier ») : « Les deux se complément ».
- CUMUL tient : « avec Galaxy » change les cases, Pomona en actif bouge un peu et l'écrit. Les
  réglages sont compacts, avec α, huile et « fiche › » sous le houblon. Libellé accessible sur chaque
  case.

**Ce qui ne va pas**
1. La tour grise « ma bière » (résineux 83) dans chacune des 20 cases : même hauteur partout, le plus
   gros trait de la carte, et il ne dit rien de l'ajout. « Ça c'est inutile » (D91) : sa réaction type.
2. Douze barres de 3 px : on voit une forme, pas une famille (la NOTE l'admet). « 4 hors » sans dire
   lesquelles.
3. Les réglages prennent 340 px avant la carte : la première rangée commence à mi-écran. La carte,
   qui est l'idée, n'est pas au premier plan.
4. Le détail ne nomme pas le second houblon (« Citra, 4 g/L… » alors que Galaxy est dedans) : une
   valeur simulée mal étiquetée, faute d'honnêteté légère (vue au geste).
5. Pomona : « presque rien ne change ». Honnête, mais le brasseur qui veut comprendre la levure
   n'apprend rien ; la ligne géraniol → citronellol est sous le détail, hors écran.
6. La règle « hors » pour une famille déjà hors du style avant l'ajout (un demi-cran de plus) est
   une règle de page « à valider » : [critique] à écrire ou à lui faire trancher.
7. 137 mots : acceptable ; le détail ouvert les double.

**À essayer**
- La tour grise → un fond pâle derrière les barres, ou « ma bière » une seule fois en marge ;
  l'orangé de dépassement reste.
- Dans chaque case, quatre barres de 6 px (les familles qui bougent le plus) et huit points ;
  « 4 hors » → les pictos des familles hors du style (jusqu'à trois) à la place du nombre.
- La carte d'abord : les réglages en une ligne repliable (« Citra · seul · 3 j · US-05 ⌄ ») ou sous
  la carte.
- Titre du détail = tous les houblons de la case (« Citra + Galaxy, 2 + 2 g/L, dry hop actif, 3 j »).
- La biotransformation visible au premier écran quand une colonne active est touchée avec Pomona ;
  Pomona, Verdant et Diamond grisées sur les colonnes à chaud et « après », « au repos » écrit.

**Verdict : à garder** (candidat pour les 5), à pousser sur la tour grise, la place de la carte et le
titre du détail.

## La série : relancer ou pas

**Pas de relance.** Les trois sont distinctes et répondent chacune à une question du brasseur : s1
« quand », au doigt ; s2 « quel plan » ; s3 « jusqu'où ». L'honnêteté est sans faute dans les trois
(simulé marqué, mesuré sourcé, inconnu hachuré, plages ×100 visibles). Les défauts communs se
corrigent en seconde passe : les explications au premier plan, l'état de départ où la levure ne fait
rien, les codes qui demandent une légende (A/B/C, « réf. », la tour grise). Candidats pour les 5 :
s1 et s3 ; s2 après sa seconde passe.

## Retouches à renvoyer à l'auteur (seconde passe)

Communes
1. État de départ en dry hop actif avec US-05, pour que la levure bouge ; « après » à un toucher.
   Sinon : levures grisées, « au repos » écrit dans le segment.
2. Explications repliées à un toucher (« pourquoi … », « inconnu en bière noire », « glisse-le ») ;
   viser 100 mots au premier écran sans toucher aux données.
3. Un seul sens pour « ~ » (simulé) ; « avant inconnu » écrit en gris quand c'est le cas.

s1
4. Loupe ou graduations d'ébullition sous le doigt (D47, D63) : 60, 45, 30, 20, 15, 10, 5, 0
   aimantés au moins, ou une bulle qui écrit la minute.
5. Pendant le glissé : barre des jours et repères 24 h / 3 j suivent le jeton, ou disparaissent
   quand il est à chaud.
6. Capture « deux » reprise sur `?etat=deux` ; les deux étiquettes sans chevauchement.
7. Résineux : l'avant en contour fin, l'apport en plein.

s2
8. « écarts » par défaut (ou dès que le plus grand écart est sous 1 cran) ; « valeurs » à un toucher.
9. Plans nommés par leurs houblons dans la grille et le dock ; texture gardée en second signe.
10. « réf. » → « comparer à ».
11. Cartes sans plage de fiches répétée, confiance en points : ≈ −25 mots.
12. Moment et jours par houblon (le « puis » de K3).

s3
13. Tour grise « ma bière » → fond pâle ou marge.
14. Cases : quatre barres de 6 px pour les familles qui bougent, pictos des familles « hors » à la
    place du nombre.
15. Carte au premier plan : réglages en une ligne repliable, ou sous la carte.
16. Titre du détail avec tous les houblons de la case.
17. Biotransformation visible au premier écran quand une colonne active est touchée avec Pomona.
