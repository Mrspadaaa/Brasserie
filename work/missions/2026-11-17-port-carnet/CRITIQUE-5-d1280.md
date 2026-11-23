# Critique 5 — carnet porté, d1280 (18.11)

OK — 22 problèmes, 5 bloquants. Note : 6/10 (critique 4 : 5/10, 29 problèmes dont 15 bloquants). La passe a progressé.

Version : banc `?preview=carnets`, HEAD d15b72a3f (RAPPORT-d1280). Critique : Opus, calibré sur le PORTRAIT (Fable interdit).
Images ouvertes : 34. Maquettes : p2:g05-1, i06-2, h05-3, h01-6, g01-8, g05-11, h05-9 ; g5:v04-4, v06-10, v01-16. Clair : 01, 02, 03,
04, 06, 07, 08, 09, 10, 11, 12, 15, 16, 17, 18b, 19, 21, 22, 23, 24. Sombre : 01, 07, 10, 22, 24.
Jugées sur le rapport seulement (« texte ») : 05, 13, 14, 18, 18 (menu), 20, et les sombres restantes.

Trois regards (R50) : besoin du brasseur 5,5/10 (« ça met en forme » manque là où il compte : la note en vrac) ; UX/UI 7/10 ;
critique 6/10. La cible de 9 n'est atteinte sur aucun des trois.

## Combien et quels problèmes ?

### Bloquants (5)

1. **Note en vrac · pendant et après (16, 17 ; réf. g5:v01-16)**. « achat filtre à air G4, 2 pièces ; question : pression max ? »
   donne un seul carnet. Il n'y a ni pendant « ✻ L'IA découpe votre note », ni lignes typées (à acheter, question), ni carnet ▾, ni
   « › Texte d'origine ». La capture 16 est identique à la 17. Il dirait : « Mais c'est justement ça que je veux, qu'il me mette en
   forme ! ». **Retenu manquant** R18, R19, cœur de D-142, D-113, D-129. Déjà signalé en critique 4 (14), non corrigé.
2. **Lien · après (15 ; réf. g5:v06-10)**. La carte n'a que le nom, le vendeur et le prix. Il manque la ligne de caractéristiques
   (débit, °C) et la ligne « lu sur la page : nom, prix, photo, débit… ». « Ce qui compte » reste « rien encore ». Il dirait : « Je
   colle un lien et il me dit rien de l'objet ». **Retenu manquant** R17, D-27, D-78. Déjà signalé en critique 4 (12).
3. **Texte · pendant et après (11 → 12)**. Il tape « fond de bac 38 cm minimum » ; le pendant annonce « Ce qui compte : fond de bac
   38 cm minimum ». L'après range « Un fût de 30 L couché entre dans le bac (38 cm) ». Le 30 L est **un chiffre inventé** : c'est
   l'exemple de la maquette G13, rendu par l'IA simulée quelle que soit la phrase. En plus, « assez profond pour un fût » disparaît de
   « Ce qui compte ». Il dirait : « J'ai jamais parlé de 30 L ». R45 : « le nombre vient de la phrase tapée, jamais d'ailleurs ».
4. **Liste vide (02 ; réf. p2:i06-2)**. Il manque le titre « Carnets », la phrase « Collez le lien d'un objet ou notez un besoin : on
   garde sa photo, son prix, et on le surveille », la carte exemple « Évier inox, 2 bacs · exemple · ↓ arrive ici » et « Par
   exemple : … ». À la place, il y a « Votre premier carnet s'affichera ici », une liste « Un carnet garde » et une grande bulle verte
   pointée vers le champ, qui rejoue la flèche refusée (D-108). **Écart à sa maquette** R02, D-97. Correction : porter i06-2 telle
   quelle, sans la flèche, avec les puces exemples au-dessus du champ (G1).
5. **À venir (22, clair et sombre ; réf. p2:h05-9)**. La carte du carnet n'a ni vignette, ni « Abfülltechnik West · en stock », ni
   « Fixer la date ». À la place : un « + mois ▾ » obscur, un « Modifier » noir pleine largeur en action principale, et le titre
   répété (« ZZ TEST — Frigo… / du carnet ZZ TEST — Frigo… »). Il dirait : « + mois, c'est quoi ? ». **Écart à sa maquette**
   R08, D-105. Le mélange avec le Calendrier reste un point ouvert (§ Points ouverts 7), mais la carte elle-même n'en dépend pas.

### Gênants (10)

6. **Créer · après (06 ; réf. g5:v04-4)**. Trois blocs s'empilent : l'encadré Idée, le bandeau « Carnet créé » avec sa phrase, et le
   bandeau « Ce qui compte ». La maquette n'a qu'un bandeau, suivi de lignes. Le double bandeau est écarté dans ASSEMBLAGE (G12).
   Critique 4 (8), corrigé en partie seulement.
7. **Carnet ouvert (07, 08, clair et sombre)**. « Ce qui compte, tiré de votre phrase » liste « tient 80 °C » et « le débit ». Sa
   phrase est « buées au-dessus de la cuve » : c'est faux, ces critères ne viennent pas d'elle. Il faut « proposé par l'IA »,
   comme dans h05-3.
8. **Carnet ouvert et Comparer (07, 10)**. Le carnet met d'abord « capter la buée ». La pastille de façon dit pourtant « tient
   80 °C » (h05-3 : « capte la buée »), et Comparer affiche « Ce qui compte tient 80 °C ». Il dirait : « Je lui parle de buée, il
   range sur 80 °C ». Il faut nommer le critère qui range, et dire que le premier n'a pas de valeur.
9. **Comparer (10, deux thèmes)**. La 4e, à 690 CHF, porte « moins bien partout », alors qu'elle coûte moins que la 1re (2 600) et
   la 2e (1 450), et que « tient 80 °C » est inconnu (–). C'est un libellé faux : il faut « moins bien que la 3e sur tout ».
10. **IA en échec et hors ligne (19, 21)**. « Ensuite : l'IA cherche les façons » reste affiché alors que l'IA n'a pas répondu.
    « Ce qui compte » apparaît deux fois, dans l'avis et dans le bandeau, et reprend tout le titre (« Tuyau silicone 8 mm, 5 m »),
    qui n'est pas un critère.
11. **Choisi · pourquoi (24, deux thèmes ; réf. p2:g05-11)**. Les deux réglettes sont posées sur de grandes pastilles arrondies,
    grises en clair et brunes en sombre. L'habillage paraît cassé, et rien de tel n'existe dans g05-11. Le picto est minuscule dans
    un grand carré.
12. **Vignettes (01, 07, 09, 10, 24 ; réf. g05-1, h05-3, h01-6, g01-8)**. Partout, un picto au trait fin sur un carré gris. Ses
    maquettes montrent des vignettes dessinées de l'objet, et l'article ouvert « photo de la page collée ». Mieux que le cube unique
    de la critique 4, mais l'écran reste « peu parlant » (D-78). R01, R04, R05 partiels.
13. **Note en vrac · après (17)**. Le carnet né flotte au-dessus de « À comparer », hors du groupe « Idée » (qui reste à 2), avec un
    cube générique (refusé en P1). Son titre « achat filtre à air G4… » est en minuscule et la phrase est simplement recopiée, alors
    que le bandeau dit « titre mis en forme par l'IA ».
14. **Le fil (tous ; D-142, R39)**. Ses messages ne restent visibles que cités dans chaque carnet. Il n'y a aucun fil ni aucune
    comparaison d'idées. Le défaut est assumé (lot E, puis F après son choix), mais en le lisant il dirait : « Je voulais un chat ».
15. **Réalisés (23)**. « Marque un projet comme réalisé » demande un geste à la main, alors que la facture doit solder seule
    (D-2, D-8). Le tutoiement (« Tes projets ») tombe au milieu du vouvoiement (« Votre premier carnet »).

### Mineurs (7)

16. **Lien · après (15)**. L'URL est citée deux fois, sous le titre et dans le bandeau.
17. **Titres (07, 18b contre 10, 24)**. « ZZ TEST — » est présent sur un écran et absent sur l'autre, pour le même carnet.
18. **Largeurs à 1280 (tous)**. Le segment À venir / Carnets / Réalisés fait 1 150 px pour une colonne de 736 px. Le + volant est
    à 175 px du bord de la colonne, détaché du champ.
19. **Ajouter · avant (08)**. La bulle G8 couvre la 3e ligne du tableau.
20. **Envoi (04 contre 11)**. Le bouton est une flèche ↑ ici, « Ajouter » là : deux formes pour le même geste.
21. **Article ouvert (09)**. La réglette du débit n'a pas de borne gauche (1 800). Les caractéristiques se réduisent à « tient
    80 °C : oui ».
22. **Hors ligne (21)**. « rien ne bougera au retour du réseau » est ambigu : l'IA rangera-t-elle au retour ?

### Doutes (non comptés)

- Habit de l'app (R29) : le banc remplace l'en-tête L'Affinée et le segment Stocks (Articles · Courses · Fûts · Matériel ·
  Houblons) par « Banc — données simulées ». Il reste à vérifier dans l'app réelle.
- Article ouvert (09) : la ligne « demandée · pas encore relevée » sous la veille (R31) est sous le champ, donc non vue.
- Comparer (10) : sous le tableau, « Écartés : 1 » double-t-il la colonne « écarté » ? Le bouton « Choisir » est-il bien sous le
  tableau ? Les deux sont hors cadre.
- Choisi (24) : la ligne ✕ de l'écarté et « Valeurs annoncées » sont hors cadre (le rapport dit « non vus »).
- « Ensuite : l'IA cherche les façons » (06, 12, 19) : aucune fonction de recherche n'est visible. La promesse est-elle tenue ?
  D-66 : les façons proposées d'office ne sont pas confirmées.

## Ce qui est bien (acquis à garder)

Le champ unique, collé en bas, pleine colonne, avec « Ajouter à <titre> ». Le tableau de Comparer : rang, écarté visible, compromis
juste (2 600 − 1 450 = 1 150). « Rangé ici · Annuler » avec sa phrase citée. La suppression dans la page (« ni dans À venir, ni en
commande »). « veille demandée » honnête. Les avis IA en échec et éteinte distincts. Le sombre sans casse.

## D-n → preuve

| D-n | Où | État |
|---|---|---|
| D-1, D-105 (À venir, Réalisés) | 22, 23 | capture ; écart h05-9 (5), geste manuel (15) |
| D-3 (crayon d'édition dans À venir) | 22 « Modifier » | capture |
| D-7, D-15, D-29, D-38 (une idée en une ligne, simple, lisible) | 03, 04, 06 | capture |
| D-10, D-16, D-17, D-18 (façons, critère, 5 à 6 articles) | 07 | capture ; critère mal relié (7, 8) |
| D-19, D-142 (le fil de chat, comparer des idées) | — | **absent** (R39, lot E/F) (14) |
| D-20, D-104 (pourquoi) | 24 | capture ; ✕ écarté non vu |
| D-21, D-23, D-52, D-103 (comparer les caractéristiques, écartés visibles) | 10 | capture (8, 9) |
| D-22, D-28 (veille) | 07, 09 | capture ; « demandée » sur la carte, la fiche non vue |
| D-24 (générique) | 01, 07, 12, 24 (hotte, évier, densimètre, tuyau) | capture |
| D-25, D-96 (vue sans détail d'abord) | 01 | capture (12) |
| D-27, D-138 (le lien montre l'objet) | 15 | capture, **retenu manquant** (2) |
| D-35 (propositions en un toucher) | — | texte : non joué |
| D-42, D-68, D-74 (+ volant à droite) | toutes | capture (18) |
| D-47, D-47b, D-121 (supprimer une idée) | 18b | capture ; G35 non joué |
| D-53, D-113, D-129 (un champ, l'IA trie) | toutes ; 17 | capture ; le tri échoue sur la note en vrac (1) |
| D-54 (clavier) | — | texte (relève de 390) |
| D-63 (scénario CARNET-COEUR) | — | **absent** : non joué |
| D-65, D-69, D-80, D-85 (habit de l'app) | 01 (sombre et clair) | capture partielle : banc sans en-tête (doute) |
| D-83 (petit micro) | 01 | capture |
| D-97 (liste vide) | 02 | capture, **écart** (4) |
| D-99, D-101 (carnet ouvert, cartes) | 07 | capture (12) |
| D-102 (article ouvert) | 09 | capture, partiel (12, 21) |
| D-111, D-122, D-140 (tout se trie seul) | 17 | capture, **non** (1) |
| D-118, D-120 (modifier, supprimer une note) | — | **absent** : non joué |
| D-119 (renommer) | 18 (menu) | texte |
| D-123, D-124, D-126 (notes brutes du téléphone) | — | **absent** : non joué |
| D-130 (créer · avant) | 03 | capture |
| D-131 (créer · pendant) | 04 | capture ; le carnet proche n'est pas atteint |
| D-132 (créer · après) | 06 | capture (6) |
| D-133 (ajouter · avant) | 08 | capture (19) |
| D-134, D-135 (texte) | 11, 12 | capture (3) |
| D-136, D-137 (lien · avant et pendant) | 13, 14 | texte |
| D-139 (note en vrac · pendant) | 16 | capture = après, **retenu manquant** (1) |
| D-143, D-144 (en ligne) | — | hors de ce banc |

## Le plus urgent

1. Le découpage de la note en vrac (R18, R19), avec un pendant et un après distincts.
2. L'IA simulée : rendre une réponse qui dérive de la phrase tapée, jamais l'exemple de la maquette.
3. La carte du lien lu, avec caractéristiques et « lu sur la page ».
4. La liste vide i06-2, telle quelle.
5. La carte d'À venir h05-9 (vignette, fournisseur, « Fixer la date »).
