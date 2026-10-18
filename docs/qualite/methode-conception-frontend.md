# Méthode de conception frontend — L'Affinée (v2)

Version 2, 18.10.2026 (D24), après le rejet des 23 mini-maquettes houblons v4 :
« On dirait des écrans de central nucléaire ou cockpit d'avion ». Elle vaut pour
tout écran de l'app. Elle complète [PRODUCT.md](../../PRODUCT.md),
[DESIGN.md](../../DESIGN.md) (section « Deux régimes ») et [le guide
UI](../ui-compacte.md). Recherche qui la fonde : `work/refonte-frontend/v4/recherche/`
(A causes, B pratiques UI, C workflow, D profils de goût, E données).

## Pourquoi la v2

La v1 passait du brief à des pages haute fidélité. Les consignes mettaient tout au
premier plan, la règle de vérité punissait l'omission et jamais le bavardage, le jury
IA lisait le texte sans effort, et les formes imposées étaient des documents et des
pupitres. Résultat mesuré : 166 à 383 mots au premier écran à 390 px (audit A).

## Huit principes

1. **Le brasseur juge, tout le reste filtre.** Les contrôles et le jury éliminent ; ils
   ne choisissent pas à sa place.
2. **Un seul document de ses demandes.** Tout brief part de
   `SPEC-BRASSEUR.md` (ses mots exacts, citations vérifiées par script).
3. **Le premier plan se décide avant de dessiner.** Trois plans (DESIGN.md) : plan 1
   sans geste, plan 2 à un geste, plan 3 à deux gestes au plus.
4. **Des références réelles et modernes**, pas des métaphores d'objets anciens.
5. **Des composants communs.** Les auteurs composent avec un atelier de primitives ; ils
   ne réinventent ni en-tête, ni piste, ni légende.
6. **Maquettes basse fidélité en HTML gris, haute fidélité dans `prototypes/`** avec les
   composants, les jetons et le moteur de l'app (sans changer le `package.json` de
   l'app). La version choisie se déplace dans l'app, elle n'est pas réécrite.
7. **Un écran fini avant d'élargir** (tranche verticale), une boîte de temps par étape,
   un coupe-circuit : si une étape déborde, on réduit le périmètre, on n'ajoute ni règle
   ni document.
8. **Brief auteur d'une page.** Le reste passe dans les contrôles automatiques.

## Le flux

| # | Étape | Livrable | Contrôle | Qui |
|---|---|---|---|---|
| 1 | Cadrer | Une page : 3 à 5 récits « Quand…, je veux…, pour… » avec citation, la question de l'écran, la boîte de temps, le coupe-circuit | citations vérifiées (`check-spec.mjs`) | pilote |
| 2 | **Prioriser** | Guide de priorité : chaque élément reçoit un plan, la question qu'il sert, le nom de son déclencheur ; phrases canoniques des états (« non situé », « aucune voie », « ≈ ») | plan 1 ≤ 7 éléments ; chaque élément du plan 1 répond à un récit ; un juge neuf répond « le plan 1 seul répond-il à la question ? » | pilote, juge Opus neuf |
| 3 | Références | Planche de 2 ou 3 écrans d'apps réelles par motif, plus Territoire ; une ligne « on prend… » par écran | chaque référence sert un élément des plans 1 ou 2 | Haiku collecte, pilote choisit |
| 4 | Atelier | Primitives : piste au style (bullet graph), en-tête, segmenté, puce, rangée dépliable, feuille ; à partir de `src/ui` quand elles existent | capturées et regardées | pilote |
| 5 | **Fils de fer gris** | Un lot de 11 (4 tièdes, 5 chauds, 2 froids), en boîtes grises avec vrais mots et chiffres, à 390 px | mesures automatiques, puis jury par paires ; 3 retenus | auteurs, jury |
| 6 | **Coup d'œil du brasseur** | Une planche des 3 fils de fer retenus, un ping ; 30 s, une réponse d'un mot | ses mots consignés | brasseur |
| 7 | Tranche verticale | Le fil de fer choisi devient un écran complet dans `prototypes/`, avec composants, jetons, moteur et états | build ; coup d'œil réduit ; parcours joué dans Chrome ; mesures | pilote |
| 8 | Trois versions | 3 partis distincts, à 390, 412 et 1280 | mesures ; `impeccable critique` ; jury par paires avec ses critiques réelles en exemples | auteurs, pilote |
| 9 | Porte B | Lien privé, 3 questions : « que vois-tu en premier ? », « où touches-tu pour… ? », « laquelle, et que changer ? » | ses mots consignés | brasseur |
| 10 | Intégration et rétro | Écran par écran dans l'app ; jury comparé à son choix, grille corrigée | Vitest, `check-hop-*`, a11y, build | pilote |

## Températures d'un lot (décision du brasseur : « 4 tiède, 5 chaude, 2 froide »)

- **Tiède** : un parti de structure imposé (liste dense et feuille, carte et liste,
  tableau et détail en ligne, réponse d'abord et pistes…), jamais une métaphore d'objet.
- **Chaud** : aucune contrainte de forme ; rupture attendue, dans les mêmes contrôles.
- **Froid** : repart des idées déjà retenues par le brasseur ou par l'audit.

Relance obligatoire si aucun retenu ne passe les contrôles du plan 1 (une fois par
étape, D22).

## Une plainte du brasseur devient un contrôle, avant tout autre travail

Le brasseur (18.10) : « je te demande à chaque fois, ce qu'il faut mettre en place,
modifier, changer ect mais que au final on se retour toujours pas les même problèmes ».
Une correction écrite dans un document ne suffit pas. Chaque plainte devient un
contrôle automatique (ou une question fermée du jury), qui doit d'abord échouer sur la
version rejetée. Rien ne lui est montré sans que tous ces contrôles passent. Registre :
`work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` ; il ne se raccourcit pas.

## UX boosters : exigés et récompensés

Demande du brasseur (18.10) : « D'autres type de UX booster du genre doivent être mis en
avant. C'est pas assez encourager. » Catalogue : [ux-boosters.md](../ux-boosters.md)
(non exhaustif). Le guide de priorité (étape 2) nomme, pour chaque récit, le booster qui
le sert. Chaque maquette en fait **fonctionner au moins quatre**, dont la bascule de
lentille quand l'écran montre un profil (barres ↔ radar). Le jury les compte et les
juge : un booster qui sert un récit rapporte, un gadget sans récit coûte.

## Contrôles automatiques (avant tout jury)

- Mots visibles au premier écran à 390 × 844 : budget du guide de priorité, 80 au plus
  (`tournoi/outils/mots-premier-ecran.mjs --max=80`).
- Densité : part de la hauteur du premier écran couverte par du contenu, 0,80 au moins
  (`fill` dans le JSON de `capture.mjs`).
- Tout le plan 1 visible au premier écran ; aucun élément du plan 3 visible.
- Aucun paragraphe de plus de deux lignes au premier écran.
- Pas d'erreur de page ni de débordement horizontal (`tournoi/outils/capture.mjs`).

Un échec élimine, comme un mensonge sur les données.

## Le jury

- **Un filtre, pas un juge de goût** (recherche C : les modèles choisissent le meilleur
  écran à peine mieux que le hasard, avec un fort biais de position).
- Il regarde d'abord le **coup d'œil** (`pNN-oeil.png`, premier écran réduit à 40 %) et
  répond : « que dit cet écran en premier ? ». La réponse est comparée au plan 1.
- Il compare ensuite **par paires, dans les deux ordres**, sur trois questions : le
  plan 1 répond-il à la question ? lequel se lit le plus vite ? lequel montre le geste
  suivant sans texte ? Un verdict qui change avec l'ordre compte comme égalité.
- Il reçoit en exemples les verdicts réels du brasseur (SPEC-BRASSEUR, § 6).

## Rôles

- **Pilote (Opus)** : cadrage, priorité, atelier, organisation, regard sur chaque capture.
- **Auteurs** (Opus, Sonnet, Fable, contexte neuf) : un brief d'une page, l'atelier, les
  références.
- **Jury** (contexte neuf) : filtre par paires.
- **Haiku** : collecte de références, mesures, captures ; le pilote relit.
- **Le brasseur** : un coup d'œil sur les fils de fer, puis le choix entre 3 versions.

## Ce qui est interdit

- Mettre au premier plan une explication, une légende, une source ou une note du moteur.
- Imposer une métaphore d'objet comme gabarit de page.
- Déclarer une étape faite sur un reçu ou une capture non regardée.
- Recopier un calcul du domaine dans une maquette : les chiffres viennent du moteur.
- Ajouter un document de cadrage quand une étape déborde.
