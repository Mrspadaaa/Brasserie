---
name: pieges-controles-maquette
description: Pièges des contrôles Chrome de la maquette jouable (mesures, gestes, feuilles, compteurs) et compléments des leçons relevés par les voies du 24.10.
type: agents
maj: 2026-10-24
sources: voies p1, p4, p5, p11, p12, p17, p19, p24, r3, r4, r7, sb-b, sb-z, fl-u, pg-choix, s1-lecons de work/missions/2026-10-23-maquette-parcours/voies/
---

À lire avant d'écrire ou de déboguer un contrôle de `work/refonte-frontend/v4/tournoi/outils/` ou de la maquette jouable
([[maquette-jouable]], [[verification-locale]]).

## Pièges
- Un `sr-only` rogné à 1 px se mesure à pleine largeur (`Range.getBoundingClientRect`) : D56 et le compteur de mots le
  prennent pour du texte.
- Mesurer une position pendant un geste exige `transition: none` (loupe ×2,7 au lieu de ×25). La base se réorganise sous
  le doigt : lire les repères en direct, jamais au repos. L'en-tête n'est pas le même bloc d'un onglet à l'autre.
- Sous un pied fixe, mesurer le dépassement du corps (`scrollHeight` contre `clientHeight`). `controle-annuler` lit
  `[data-role]` comme un bouton : le pied porte `data-pied`.
- `controle-rail` lit une classe qui contient « loin », « autre » ou « hors » comme une graduation hors segment.
  `aria-valuetext` : `controle-fonctions-rail` veut « J+3 », `controle-rail --parcours` « actif … 3 j ».
- `controle-fiche` ferme avec le premier `[data-role="fermer-fiche"]` du document : une seule boîte remplie à l'ouverture.
  Il exige qu'un toucher court n'ouvre pas la fiche : une page « fiche ouverte » échoue par construction.
- Chrome déporte un appui long vers le bouton voisin si l'élément touché n'a pas d'écouteur de clic : un écouteur vide sur
  chaque `[data-houblon]` rétablit la fiche.
- Sous une feuille vaul, `PageShell` rend le voile `inert` : `elementFromPoint` y rend `<html>`.
- Un état relevé sur une page déjà ouverte dans cet état (`biere-radar.html`) se rejoue avec le geste qui y mène depuis la
  page de repos, ou porte son `avant` ; sinon il devient injouable (r7 : grille m4).
- Un état se prouve par trois témoins (choisie, perdante, `--repli`) ; un sélecteur vient d'une page jouée, jamais deviné.
- Un script de parcours qui prend ses sélecteurs dans les écrans casse en silence quand l'écran change de base : lire
  d'abord `jeu.mjs` et NOTE.md. Un script qui ne joue que les gestes par défaut ne prouve rien.
- Un contrôle ajouté à `portee-defauts.json` fait échouer le témoin « voie avec ses contrôles » : dériver la liste du
  témoin de la portée.
- `verifier-page.mjs` plafonne une page à 16 384 px de haut au téléphone : au-delà de ~20 captures, des bandes défilantes.
- Plusieurs onglets dans un même Chrome : seul celui du premier plan acquitte un toucher (`Input.dispatchTouchEvent`), et
  un onglet neuf prend le premier plan. Geste au premier plan (`bringToFront`) sous un verrou, création d'onglet comprise
  (`controle-etats.mjs`, 24.10 : les doses bloquaient plus de 180 s, une seule passait seule).
- Une règle CSS d'une classe placée après ses modificateurs les annule à spécificité égale : les traits de q2b (contour,
  orange hors style) ont disparu ainsi (jc-levure) ; un modificateur porte deux classes.

## Compléments des leçons (24.10)
- L05 : jouer le contrôle de standard sur toutes les candidates ensemble (un houblon change de couleur) ; étendre la liste
  d'écrans (`FICHIERS`) dans la même voie.
- L11 : un refactor « rien ne bouge » se prouve par un instantané du DOM (outerHTML, deux largeurs) avant et après.
- L12 : avant de porter un code calibré, sonder hauteurs de texte et mouvement réduit des deux côtés (19 contre 22 px).
- L13 : un contrôle écrit avant son choix se rejoue sur la maquette choisie avant les GATES ; une plainte sur capture fixe
  se joue aussi au repos.
- L14 : recouper deux affichages issus d'un même nombre (IBU à grammes égaux, dose pour 60) : ni le critique ni COMMUN
  ne recomptent (sbz7).
- L26 : le socle prend son préfixe propre (`<id>s-`), distinct de celui du concept ; les modificateurs courts (`.c`,
  `.g`, `-top`) sont préfixés aussi.
