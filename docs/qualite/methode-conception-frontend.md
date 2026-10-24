# Méthode de conception frontend — L'Affinée (v3)

Version 3, 18.10.2026 au soir, après le chantier houblons v4 (#119). La v2 date du matin (D24),
après le rejet des 23 mini-maquettes : « On dirait des écrans de central nucléaire ou cockpit
d'avion ». Le brasseur, le soir : « je crois que on a un bon background de création de UI, on
va faire ça pour tout les screen de l'app ». Elle vaut pour tout écran de l'app, **appliquée
sujet par sujet** (voir « Appliquer la méthode à un écran »). Elle complète
[PRODUCT.md](../../PRODUCT.md), [DESIGN.md](../../DESIGN.md) (section « Deux régimes ») et [le
guide UI](../ui-compacte.md). Recherche qui la fonde : `work/refonte-frontend/v4/recherche/`
(A causes, B pratiques UI, C workflow, D profils de goût, E données). Exemple complet :
`work/refonte-frontend/` (registre, décisions, `v4/SPEC-BRASSEUR.md`,
`v4/DEFAUTS-RECURRENTS.md`, `v4/tournoi/outils/`).

## Pourquoi la v2, puis la v3

La v1 passait du brief à des pages haute fidélité. Les consignes mettaient tout au premier
plan, la règle de vérité punissait l'omission et jamais le bavardage, le jury IA lisait le texte
sans effort, et les formes imposées étaient des documents et des pupitres. Résultat mesuré : 166
à 383 mots au premier écran à 390 px (audit A).

La v2 a corrigé la densité, mais cinq erreurs sont revenues pendant le chantier :

- un jury a choisi et intégré 22 maquettes sans que le brasseur les voie (« pourquoi j'ai pas eu
  mes variations ? », D50) ;
- deux contrôles interdisaient ce que montrait **son propre exemple** (Beer Maverick superpose
  3 houblons en couleur ; nos contrôles imposaient 2 séries grises), d'où un Comparer « moins
  bien » que la référence ;
- les objets du métier se mélangeaient (ma bière, la cible du style, la comparaison manuelle, les
  suggestions : « attention au piège !! », D19, D40) ;
- des valeurs figées là où le brasseur règle tout (« pas de 10' défini, pas de timing imposé »,
  « toujours garder des variables dynamique ») ;
- des chiffres sans leur incertitude (« il faut des intervalles de confiance »), et une échelle
  identique d'un style à l'autre (« un peu plus résineux pour une stout est pas très
  problématique, pour une lager kolsch très »).

## Treize principes

1. **Le brasseur choisit, tout le reste filtre.** Les contrôles et le jury éliminent et marquent
   (★) ; ils ne choisissent pas. **Chaque lot lui est montré en entier** (toutes les variantes,
   vue par vue, jouables) et rien n'est intégré avant son choix, cité dans `SPEC-BRASSEUR.md`.
2. **Un seul document de ses demandes.** Tout brief part de `SPEC-BRASSEUR.md` (ses mots exacts,
   citations vérifiées par script).
3. **Penser comme le métier.** Avant de dessiner, écrire la décision que l'utilisateur prend dans
   chaque partie de l'écran et son ordre de lecture (houblons : α, rôle, arômes, moment, puis
   IBU ; le stock en icône). Les objets du métier sont nommés et jamais mélangés.
4. **Le premier plan se décide avant de dessiner.** Trois plans (DESIGN.md) : plan 1 sans geste,
   plan 2 à un geste, plan 3 à deux gestes au plus.
5. **Ses exemples sont un plancher, jamais un plafond.** Une référence qu'il donne (capture,
   site, app) devient un contrôle « au moins tout ce qu'elle fait » **et** « mieux » : la copie
   telle quelle doit échouer (« il faut faire mieux, pas moins bien ou la même chose »). Ses
   défauts sont relevés par écrit et deviennent des exigences.
6. **Une plainte devient un contrôle, prouvé dans les deux sens** : il échoue sur la version
   rejetée (témoin négatif) et passe sur une version qui le respecte (témoin positif). Un
   contrôle qui contredit une référence du brasseur se révise (« D24 bis »), il ne se contourne
   pas.
7. **Des données honnêtes.** Chaque chiffre vient du moteur ou d'une fiche sourcée ; une mesure
   qui varie (sources, années, terroir, modèle) se montre en **plage** avec son centre ; une
   donnée absente se dit. Rien n'est inventé pour remplir un graphique.
8. **Rien de figé.** Durées, doses, températures, jours : des variables que l'utilisateur règle,
   avec des pas métier (5′ pour une minute d'ébullition) ; les tables couvrent toute la plage.
9. **Des échelles qui ont du sens pour lui** : relatives au contexte (le style), avec une vue
   absolue à un geste, et réglables par son a priori.
10. **Des références réelles et modernes**, pas des métaphores d'objets anciens.
11. **Des composants communs** (atelier de primitives, une base consolidée, un seul style de
    graphique par écran) ; maquettes basse fidélité en HTML, haute fidélité dans `prototypes/`
    avec les composants, les jetons et le moteur de l'app. La version choisie se déplace dans
    l'app, elle n'est pas réécrite.
12. **Un écran fini avant d'élargir** (tranche verticale), une boîte de temps par étape, un
    coupe-circuit : si une étape déborde, on réduit le périmètre.
13. **Brief auteur d'une page**, qui renvoie au contrat DOM des contrôles ; le reste passe dans les
    contrôles automatiques.

## Le flux

| # | Étape | Livrable | Contrôle | Qui |
|---|---|---|---|---|
| 1 | Cadrer | Une page : la décision de chaque partie, les objets du sujet, 3 à 5 récits « Quand…, je veux…, pour… » avec citation, les références qu'il a données | citations vérifiées (`check-spec.mjs`) | pilote |
| 2 | **Prioriser** | Guide de priorité : chaque élément reçoit un plan, la question qu'il sert, son déclencheur | plan 1 ≤ 7 éléments ; un juge neuf répond « le plan 1 seul répond-il à la question ? » | pilote, juge neuf |
| 3 | **Données** | Ce que le moteur et les fiches savent vraiment (sources, plages, manques) ; le moteur complété d'abord si l'écran en a besoin | tests du moteur ; rapport des manques | pilote |
| 4 | **Contrôles** | Plaintes connues et plancher des références en contrôles, avec témoins négatif et positif ; contrat DOM écrit | chaque contrôle échoue sur le rejeté et passe sur le témoin | pilote |
| 5 | Références et atelier | Planche de 2 ou 3 écrans réels par motif ; primitives depuis `src/ui` | capturées et regardées | Haiku collecte, pilote choisit |
| 6 | **Lot de 11 en fils de fer** | 4 tièdes, 5 chauds, 2 froids : **fils de fer gris** du seul composant étudié (une ou deux pages statiques, vrais mots et vrais chiffres lus dans le pack, rien d'autre de reconstruit), présentés en **planche** par vue ; 15 min par auteur | contrôles du sujet seulement (un écran, mots, plaintes du sujet) ; planche regardée | auteurs |
| 7 | Jury | Filtre par paires, ★ indicatives | questions fermées (D38 : ≥ 3 partis visiblement différents sur le composant) | jury neuf |
| 8 | **Publication au brasseur** | Toutes les variantes sur une page partagée, vue par vue, jouables, ★ marquées « indicatif » ; un ping | — | pilote |
| 9 | **Son choix** | Ses mots cités dans `SPEC-BRASSEUR.md` ; ses nouvelles plaintes passent à l'étape 4 | `check-spec.mjs` | brasseur |
| 10 | Base consolidée | **Seule la variante choisie** passe en fidélité : intégrée dans la base (générateur, toutes les pages, gestes, données du moteur), toute la batterie rejouée | LOT OK indépendant | pilote |
| 11 | Tranche verticale puis trois versions | Écran complet dans `prototypes/`, puis 3 partis à 390, 412 et 1280 | build ; parcours joué dans Chrome ; `impeccable critique` | pilote, auteurs |
| 12 | Porte B, intégration, rétro | Lien privé, 3 questions ; puis écran par écran dans l'app | Vitest, contrôles de parcours, a11y, build | brasseur, pilote |

## Explorer en fil de fer, finir une seule fois

Le brasseur (18.10, soir, devant la planche des fiches) : « Pourquoi j'ai plus juste des
maquettes fil de fer de ce type ? Qqch a dû être perdu dans le workflow et je comprends mieux
pourquoi ça prends du longtemps ». Mesure faite : le lot 1 (fils de fer gris, deux pages
statiques, deux contrôles) coûtait 7 à 12 min et environ 150 k jetons par auteur. Depuis le
lot 3, chaque variante recopiait le générateur de la base, reconstruisait toutes les pages
(jusqu'à 12), jouait les gestes et passait toute la batterie : 50 à 85 min et 400 à 950 k
jetons par auteur, soit 6 fois plus de temps pour 11 variantes dont une seule est gardée.
Personne ne l'avait décidé : la règle du fil de fer est tombée au passage à la base consolidée.

Règle : un lot d'exploration est un lot de **fils de fer** (étape 6) ; la fidélité (générateur,
toutes les pages, gestes, moteur, batterie complète) ne se paie qu'**une fois**, pour la
variante choisie (étape 10). Le contrôle « rien ne change hors du composant » (D26) se fait
alors à l'intégration, pas sur chaque variante. Boîte de temps d'un auteur : 15 min ; au-delà,
il livre ce qu'il a.

## Températures d'un lot (décision du brasseur : « 4 tiède, 5 chaude, 2 froide »)

- **Tiède** : un parti de structure imposé (liste dense et feuille, carte et liste, tableau et
  détail en ligne, réponse d'abord et pistes…), jamais une métaphore d'objet.
- **Chaud** : aucune contrainte de forme ; rupture attendue, dans les mêmes contrôles.
- **Froid** : repart des idées déjà retenues par le brasseur ou par l'audit.

La température porte sur le composant étudié, pas autour (D38). Relance obligatoire si aucun
retenu ne passe les contrôles du plan 1 (une fois par étape, D22).

## Une plainte du brasseur devient un contrôle, avant tout autre travail

Le brasseur (18.10) : « je te demande à chaque fois, ce qu'il faut mettre en place, modifier,
changer ect mais que au final on se retour toujours pas les même problèmes ». Une correction
écrite dans un document ne suffit pas. Chaque plainte devient un contrôle automatique (ou une
question fermée du jury). Registre : une ligne par défaut, avec ses mots, le contrôle, le seuil
et les témoins ; il ne se raccourcit pas (houblons : `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md`,
D1 à D53). Rien ne lui est montré sans que tous ces contrôles passent.

## UX boosters : exigés et récompensés

Demande du brasseur (18.10) : « D'autres type de UX booster du genre doivent être mis en avant.
C'est pas assez encourager. » Catalogue : [ux-boosters.md](../ux-boosters.md) (non
exhaustif). Chaque maquette en fait **fonctionner au moins quatre**, dont la bascule de lentille
quand l'écran montre un profil (barres ↔ radar). Le jury les compte : un booster qui sert un
récit rapporte, un gadget sans récit coûte.

## Contrôles automatiques

Génériques, pour tout écran (`work/refonte-frontend/v4/tournoi/outils/`, réunis par
`controle-lot.mjs`) :

- mots visibles au premier écran à 390 × 844 : 80 au plus (`mots-premier-ecran.mjs`) ;
- densité du premier écran ≥ 0,80, un écran à 390 et à 412, ≤ 3 tailles de texte, aucun
  paragraphe de plus de deux lignes, pas d'erreur ni de débordement (`capture.mjs`) ;
- au moins quatre boosters qui changent l'écran (`jouer-boosters.mjs`) ; aucune fuite de texte
  technique après un toucher (`fuite-touchers.mjs`) ;
- même apparence que la baseline hors du composant étudié (`controle-baseline.mjs`) ;
- un seul style de graphique, couleur d'alerte réservée à son objet (`controle-coherence.mjs`,
  `controle-objets.mjs`).

Propres au sujet : écrits à l'étape 4 avec leur contrat DOM (houblons : `controle-recette`,
`-rail`, `-radar`, `-fiche`, `-detail`, `-palette`, `-comparer`). Un échec élimine, comme un
mensonge sur les données.

## Le jury

- **Un filtre, pas un juge de goût** (recherche C : les modèles choisissent le meilleur écran à
  peine mieux que le hasard, avec un fort biais de position).
- Il regarde d'abord le **coup d'œil** (premier écran réduit à 40 %) et répond : « que dit cet
  écran en premier ? ». La réponse est comparée au plan 1.
- Il compare **par paires, dans les deux ordres** ; un verdict qui change avec l'ordre compte
  comme égalité. Il reçoit en exemples les verdicts réels du brasseur.
- Ses ★ sont publiées comme indicatives ; elles n'entrent jamais seules dans la base.

## Appliquer la méthode à un écran : un ticket par sujet

Chaque écran ou sujet de l'app reçoit son propre ticket, et la méthode s'y applique de façon
**spécifique au sujet** : on ne copie pas les contrôles des houblons. Le ticket contient, avant
tout dessin :

1. **Ses mots** sur ce sujet (extraits de `docs/besoins/corpus-demandes.md`, du corpus et des
   échanges), versés dans un `SPEC-BRASSEUR` du sujet ou une section dédiée.
2. **Les décisions** que l'écran sert, partie par partie, et l'ordre de lecture du métier pour ce
   sujet (eau : profil cible, sels, pH ; levure : souche, dose, température ; finances : …).
3. **Les objets** du sujet, nommés, et les confusions possibles entre eux, résolues par écrit.
4. **Ses références** (apps, sites, captures) : leur plancher et leurs défauts, relevés.
5. **Les données** : ce que le moteur et les fiches savent, leurs sources, leurs plages, les
   manques ; les variables qu'il règle (rien de figé).
6. **Les contrôles du sujet**, avec contrat DOM et témoins négatif et positif, en plus des
   contrôles génériques.
7. **Le parcours de lots** (11 variantes, publication de toutes, son choix cité), puis base,
   tranche, trois versions, porte B, intégration.

## Rôles

- **Pilote (Opus)** : cadrage, données, contrôles, organisation, regard sur chaque capture,
  publication des lots.
- **Auteurs** (contexte neuf) : un brief d'une page, la base, le contrat DOM.
- **Jury** (contexte neuf) : filtre par paires.
- **Haiku** : collecte de références, mesures, captures ; le pilote relit.
- **Le brasseur** : choisit dans chaque lot, puis entre 3 versions.

## Ce qui est interdit

- Mettre au premier plan une explication, une légende, une source ou une note du moteur.
- Imposer une métaphore d'objet comme gabarit de page.
- Déclarer une étape faite sur un reçu ou une capture non regardée.
- Recopier ou inventer un calcul du domaine dans une maquette : les chiffres viennent du moteur.
- Intégrer un choix que le brasseur n'a pas vu.
- Garder un contrôle qui interdit ce que montre un exemple du brasseur.
- Ajouter un document de cadrage quand une étape déborde.
