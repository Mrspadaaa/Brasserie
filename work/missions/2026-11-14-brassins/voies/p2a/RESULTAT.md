OK — s1e2 corrigée et s1g (fusion s1e + s1c + s2d), six images et NOTE chacune

## Fichiers écrits
- `voies/p2a/s1e2/etat.html`, `NOTE.md` et six PNG (reprise : trois restes corrigés).
- `voies/p2a/s1g/etat.html`, `NOTE.md` et six PNG (neuve).
- `voies/p2a/tests.txt`, `voies/p2a/RESULTAT.md`.
- Hors OWNS, fichiers de travail seulement : `scratchpad/p2a-cap.mjs`, `scratchpad/p2a-panel.txt`.

## s1e2 : restes de la reprise
1. Liste : 4 repères de date (26.10 retiré, déjà dans le titre), rangées de 80 px, une ligne Clos de plus : le bas est plein.
2. 1280 : courbe ramenée de 650 à 600 px (le vide sous le °C a disparu) ; tableau « Relevés de densité · échantillon » dans la colonne droite.
3. « éch. 20,5 °C » rendu au repos, devant 1,018 ; le repère 1,020 est retiré à 390, car il heurtait ce texte.

## s1g
Détail dans `s1g/NOTE.md`.
- En-tête façon s1c ; phases en bandes de fond ; densimètre de 44 px dans la colonne J+5.
- Trois gestes posés en boutons de 44 px : goutte sur J+6, flocon sur la bande FG à J+10, « 21 °C » sur la marche de J+7.
- Cartes ③ et ④ supprimées ; carte ① en m2 et carte de dry hop compacte.
- Liste : calendrier des cuves, chaque prochain geste posé en bouton sur son jour.

## Critères
- G1 : `PASSE OK`.
- G2 : `MESURE OK`. controle-panel sort `PANEL ECHEC`, sur la diversité seulement : remplissage médian 0,73, 0 capture sous 0,50 ; ressemblance 0,91 ; une paire presque identique, s1g repos~geste.
  La commande compare l'état repos et l'état geste d'un même écran, ainsi que deux variantes sœurs : sur ce lot de passe 2, cet échec de diversité est attendu, ce n'est pas un défaut.
- Script de capture : 12 images, `petits=[]` partout, aucun débord, aucune erreur JS, aucun double espace.

## Captures (toutes ouvertes)
- `voies/p2a/s1e2/s1e2-{repos,geste,dryhop,liste}-390-clair.png`, `s1e2-repos-390-cave.png`, `s1e2-repos-1280-clair.png`
- `voies/p2a/s1g/s1g-{repos,geste,dryhop,liste}-390-clair.png`, `s1g-repos-390-cave.png`, `s1g-repos-1280-clair.png`

Prédiction : sur s1g, « là, je touche le geste là où il tombe sur la courbe », mais il pourrait trouver que la courbe prend beaucoup de place au téléphone.

DÉCISION À PRENDRE : aucune. Le brasseur choisit entre s1e2 (gestes en cartes en escalier) et s1g (gestes posés sur la courbe).
CONNAISSANCE : controle-panel, lancé sur les états d'une même variante (repos et geste), échoue sur la diversité par construction. En passe 2, on ne lit que le remplissage.
LEÇON PROPOSÉE : aucune (la précédente, préfixer les fichiers de travail partagés par l'id de la voie, reste valable).

Note au pilote : `tests.txt` est ignoré par Git (.gitignore:104 `/work/missions/**`), il faut l'ajouter avec `git add -f` pour le garder.
