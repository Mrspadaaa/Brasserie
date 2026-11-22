OK — accepté : la passe progresse (12 des 14 problèmes corrigés et vus en capture) ; restent 14 problèmes, dont 2 bloquants (photo de l'objet absente, « Compléter » sans effet)

# Critique de dc, passe de correction du 16.11 (regard neuf)

Version jugée : `dc/proto.html` du 16.11, 10:21. J'ai ouvert les captures suivantes, en 390 :
- en clair : repos, alerte, nouveau, noter, façon, lien, articles, dispo, comparer, carac, décider, décider-art, pourquoi, frigo,
  évier-suite, évier-pq, ventil-art, ventil-cmp, caisse, et la fin de parcours « remplacée » ;
- en cave : journal et comparer.

Les planches `_p1` à `_p6` sont antérieures à la passe (« ton choi… », « 6 articles de cette façon ») : elles ne prouvent rien.
J'ai rejoué au doigt (puppeteer, 390 tactile) le choix d'un article, « Compléter » sur un lien seul et la ligne d'alerte. La page
n'a levé aucune erreur.

**Sens métier.** Les prix, l'oxygène capté (40 à 220 ppb), les cadences (60 à 900 bt/h), les débits (1 100 à 1 800 m³/h), le bruit
(49 à 62 dB), les 30 et 40 fûts et la classe climatique (43, 38 et 30 °C) sont plausibles. Je n'ai trouvé aucune absurdité. Le
calcul « 500 CHF de moins » est juste : 11 700 − 11 200.

**Phrase prédite du brasseur** : « Là c'est bon, je vois direct dans la liste pourquoi j'ai pris l'iso et le revendeur suisse.
Mais quand je colle un lien, je veux voir la photo de la machine, et la veille doit me dire combien ça coûte chez l'autre. »

## Besoins

| Besoin | Couvert | Comment |
| --- | --- | --- |
| B1 idée en une ligne | oui | « + Idée » → un champ → « Créer le carnet ». Aucun champ obligatoire. |
| B2 noter au fil de l'eau | oui | « + Noter » prend un texte, un lien ou une photo. « Ranger comme » est facultatif. La note est datée dans la frise. |
| B3 plusieurs façons | oui | Les façons forment la carte « En suspens », chacune avec « Je retiens » ; les autres sont écartées avec leur raison (« Gravité · trop d'oxygène capté »). Une raison vide affiche « sans raison · l'écrire ». |
| B4 critère qui oriente | oui, en partie | La bande « Ce qui tranche » est reliée à une caractéristique (★ en tête de Comparer). Mais elle n'est pas rappelée au moment de choisir (problème 4), et le critère de l'évier n'est relié à rien (problème 14). |
| B5 5 ou 6 produits, plusieurs lieux | oui | Six articles, cinq fournisseurs, pastilles DE, IT, CH, AT et FR, groupés par façon. |
| B6 comparer les caractéristiques | oui | Un tableau classé par caractéristique, le meilleur en vert, le choix pointé, « ? non trouvé » en bas. Les barres « moins = mieux » se lisent à l'envers (problème 5). |
| B7 dynamiques et génériques | oui | Des propositions par catégorie (étiquetage, froid, ventilation, évier), × et ↺, « La tienne » avec contrôle du doublon et unité masquée en oui / non. |
| B8 garder le pourquoi | oui | Le pourquoi tient en une ligne, les écartés gardent leur raison, plus « à revoir si ». Une décision remplacée reste barrée et lisible. « Pourquoi ce fournisseur ? » répond depuis le journal, avec les dates. |
| B9 vue sans détails d'abord | oui | Une ligne par carnet : titre, statut, « → choix · pays », « parce que… », vignettes. Dans un carnet, les écartés tiennent sur une ligne. |
| B10 IA au besoin | oui | Boutons ✦ en pointillé, jamais obligatoires, réponses marquées « exemple ». |
| B11 un lien montre l'objet | oui, en partie | L'aperçu donne le nom, le fournisseur, le pays, le stock, le prix et les caractéristiques lues, mais un picto tient lieu de photo (problème 2). En repli, « Compléter » est sans effet (problème 1). |
| B12 bascule de veille | oui, en partie | Une bascule par article et dès l'aperçu, « tous les 3 j : stock ici et ailleurs, baisse de prix · prochain … ». L'alerte est discrète et passe lue à l'ouverture. Mais « chez d'autres fournisseurs » n'a ni prix ni geste (problème 3). |
| B13 générique | oui | Embouteillage, frigo, ventilation et évier, ainsi que l'étiqueteuse et le frigo de service créés en parcours, passent par les mêmes écrans. Aucun libellé propre à l'embouteillage. |

## Touchers (joués au doigt, depuis la liste des carnets)

| Tâche | Touchers | Détail |
| --- | --- | --- |
| Noter une recherche | 3 (2 dans le carnet) | carnet, + Noter, Noter (plus la saisie) |
| Ajouter une solution (lien) | 3 (+1 pour Surveiller) | carnet, + Noter, coller, Ajouter aux articles |
| Ajouter une façon de faire | 4 | carnet, + Noter, « façon de faire », Noter |
| Comparer | 2 | carnet, Comparer ; ou la puce « Oxygène capté 40 ppb · 1er sur 6 › » |
| Choisir avec son pourquoi | 4 (article), 3 (façon) | carnet, Articles, Je prends, Noter ce choix (le pourquoi est proposé par l'IA) |
| Retrouver plus tard pourquoi | 0 / 1 / 2 / 3 | 0 : la ligne « parce que » de la liste ; 1 : la carte du carnet ; 2 : Pourquoi ? ; 3 : « Pourquoi ce fournisseur ? » |

## Notes

besoin 9 · brasseur 8 · uxui 7,5 · fluidité 8,5

## Progrès de la passe

Corrections vues en capture : 1 (Comparer 5), 2 (4 articles + 1 lien), 3 (30 et 40 fûts), 4 (mm, « sans gaine »), 5 (évier),
6 et 7 (cibles de 40 à 44 px), 8 (alerte lue), 9 (écartés sur une ligne), 10 (caisse), 11 (ambiante max classée) et 12 (doublon).
Deux restent ouvertes : la 13 (photo) n'est pas faite, la 14 (frise) l'est à moitié.

## Problèmes (14 ; 2 bloquants marqués **B**)

1. **B — Geste sans effet : « Compléter » sur un lien seul** (Ventilation › Articles › À ranger). Il n'affiche qu'un toast
   (« Compléter à la main : nom, prix, fournisseur (champs texte) ») ; aucune feuille ne s'ouvre. C'est le repli de B11 quand le
   lien ne donne rien. Correction : une feuille de 3 champs texte (nom, prix, fournisseur ; fournisseur pré-rempli depuis le
   domaine), et « Ranger » qui place l'article dans sa façon ; la ligne « + 1 lien » disparaît des comptes.
2. **B — « Ça montre l'objet » : toujours pas de photo** (aperçu du lien, cartes d'article, vignettes de la liste). C'était le
   problème 13 de la première passe, non traité. SPEC 16.11 : « je mets un liens, ça montre l'objet ». Correction : une vraie
   image de produit en og:image simulée (photo, marquée « exemple »), avec le picto dessiné en repli seulement quand le lien ne
   donne pas d'image.
3. **Veille « chez d'autres fournisseurs » sans prix ni geste.** « aussi en stock chez Getränketechnik Ost (AT) » ne dit pas
   combien ça coûte là-bas et ne mène nulle part. Pourtant « Dispo ? » connaît le prix AT. Le brasseur ne sait pas si l'autre
   offre vaut mieux. Correction : « AT · 11 400 CHF · en stock › », qui ouvre l'aperçu de l'offre avec « Ajouter aux articles ».
4. **Choisir contre son critère, sans être prévenu** (feuille « Je prends Isobarique 4 becs semi-auto »). L'article est 4e sur 6
   en oxygène, le critère qui tranche, et l'IA propose « meilleur en CO₂ par bouteille » sans le dire. C'est précisément le moment
   où l'on se crée un futur « pourquoi j'ai pris ça ? ». Correction : une ligne ambre dans la feuille quand le choix n'est pas
   1er sur le critère (« Ce qui tranche : minimiser l'oxygène · celui-ci 4e sur 6, 90 ppb contre 40 »), reprise dans le pourquoi
   proposé.
5. **Barres « moins = mieux » à l'envers** (Comparer : Oxygène capté, Bruit ; clair et cave). Le 1er (40 ppb) a la barre la plus
   courte, le dernier (220 ppb) une barre grise pleine. À 3 s, la plus longue barre se lit « le meilleur ». Correction : quand
   moins = mieux, la longueur suit le rang (le meilleur plein, ou une échelle inversée de max à min), la valeur restant affichée
   à droite.
6. **Valeur incohérente dans le temps** (état « alerte »). L'alerte du 13 nov. est encore « non lue » alors que la décision du
   14 nov. la cite déjà (« −600 CHF à la veille »). Correction dans la fixture : une alerte postérieure au choix, par exemple
   « 16 nov. · −150 CHF chez le revendeur ; en stock en AT à 11 400 CHF ».
7. **La veille continue sur un article écarté.** Abfülltechnik West (DE), écarté le 14 nov., reste surveillé, et l'œil compte 2.
   Cela fait du bruit après le choix. Correction : la feuille « Noter ce choix » propose « Arrêter la veille des écartés », cochée
   par défaut ; l'œil compte alors 1.
8. **La frise ne garde pas l'arrivée des articles** (ancien problème 14, à moitié traité). « Lu 2 liens » pour 6 articles : 4
   n'ont aucune trace de leur date d'entrée. Correction : un jalon compact par lien collé (« 3 nov. · lien · Isobarique 2 becs
   (IT) · 1 850 CHF »), regroupé quand plusieurs liens tombent le même jour.
9. **Compte visuel faux dans la liste** (Embouteillage) : 5 vignettes pour « 6 articles ». Correction : une 6e pastille « +1 »,
   ou les 6 vignettes.
10. **Format de prix incohérent** (Ventilation, en suspens) : « 1450 à 2 600 CHF ». Correction : formater les deux bornes de la
    même façon (« 1 450 à 2 600 CHF »).
11. **Point-virgule en début de ligne** (liste du frigo : « ; la vitrine ne passe pas la porte » ; frise : « ; en stock chez
    un 3ᵉ fournisseur »). Correction : une espace insécable avant « ; », ou le séparateur « · ».
12. **« plus de condensation au plafond »** (critère de la ventilation, doute de la première passe resté en place). Cela se lit
    « davantage de condensation », le contraire du but. Correction dans la fixture : « plus aucune condensation au plafond ».
13. **La flèche du critère change de sens selon le thème** : « Oxygène capté ↓ » est rouge en clair, ce qui se lit « mauvais »,
    et blanche en cave. Correction : « moins = mieux » en texte neutre, comme dans Comparer, dans les deux thèmes.
14. **Le critère de l'évier n'est relié à rien.** « laver un fût de 30 L à plat » n'a pas de pastille de caractéristique : il ne
    classera rien quand les articles arriveront. La règle est générique (B13). Correction : l'IA propose une caractéristique
    reliée, par exemple « Longueur de bac (cm), plus = mieux » ou « Un fût de 30 L couché tient : oui / non ».

## Doutes (non comptés)

- Il n'existe aucune capture à 1280 : le prototype n'est jugé qu'au téléphone.
- La feuille Caisse montre une courbe sans montants sur l'axe. Elle est marquée kyh1 « inchangé », à confronter à sa maquette
  kyh1 avant le port.
- « Tes notes d'avant » mêle les notes du brasseur, les lectures de l'IA et la veille. « Journal d'avant » serait plus juste.
- « assez pour 6 fûts » ne départage pas : les vitrines en tiennent aussi 6 à 8. La vraie raison est la porte, et c'est son
  texte à lui.
- La place du carnet (Atelier › Matériel › À venir) reste à montrer en variantes (question ouverte du CADRE, L24).

LEÇON PROPOSÉE : une passe de correction rejoue aussi les doutes non comptés de la critique précédente ; ici, deux doutes
(« plus de condensation » et le format de prix) ont survécu parce qu'ils n'étaient pas numérotés.
