OK — passe b : s1b, s4b, t1b, t3b corrigées ; ENTETE, COMPACT, page et vue OK

Les versions v0 (s1…s4, t1…t3, leurs captures et leurs contrôles) ne sont pas touchées. Construction : `node so/build-sb.mjs s1 s4`,
`node so/build-tb.mjs`. Captures et contrôles : `node so/cap-sb.mjs s1b s4b`, `node so/cap-b.mjs`. Sorties : `so/CONTROLES.txt`.

## Ce qui a changé

### s1b (rang 1 du critique)
- Correction 1 : la plage du pinceau revient. « S47 – S52 » est écrit en 14 px gras, en bleu, au pied du pinceau à sa droite,
  dans l'aire sous le libre. C'est un obstacle pour les noms.
- Hors liste, même défaut qu'en paysage : toucher un saut sans nom (Hotte, Marché, Six fûts, Mariage) ouvrait une bulle qui
  chevauchait « Embouteilleuse » et le titre (cap-b la trouvait sur 4 sauts). La bulle est retirée. Le nom de ce mouvement,
  posé d'avance hors du titre, du pinceau et de la plage, apparaît avec son montant (« Six fûts inox −1 080 »). Les noms qu'il
  couvrirait s'effacent le temps du toucher, avec leur filet. Pour Marché de printemps, faute de place, c'est « Marché +910 ».

### s4b (rang 2)
- Correction 1 : le liseré blanc des noms colorés passe de 4 à 6 px (`stroke:#fff`). « Fête de village · S26 » reste vert et se
  détache de la teinte bleue.
- La plage « S47 – S52 » et le toucher sans bulle sont repris de s1b, puisque la structure est la même.

### t1b (paysage, rang 1)
1. Le + volant ne cache plus la barre du frigo. La frise et la bande s'arrêtent 52 px avant le bord droit, et les positions
   sont remises à l'échelle une fois (13 semaines sur 768 px). Le + n'a pas bougé : il reste à 14 px au-dessus des onglets,
   dans le tiers droit. Aucune barre, pastille ni étiquette n'est dessous, au repos comme au défilé (contrôle mécanisé dans cap-b).
2. Toucher : le montant s'écrit sur le nom même (« Embouteilleuse −2 800 », rouge ou vert), comme en portrait. Il n'y a plus
   ni bulle, ni cadre de focus. Pour un saut sans nom, son nom de secours apparaît, et les noms et filets qu'il couvrirait
   s'effacent le temps du toucher. Les 8 mouvements ont été touchés un à un, sans aucun chevauchement.
3. Les hachures du « mis de côté » sont remplacées par la teinte unie du portrait (`--fin` à 13 %).
4. Les noms sont posés par ordre de montant, sans trou : on prend le plus long préfixe posable, puis la pose de moindre coût,
   par séparation et évaluation. Un nom peut se poser entre les deux traits, et un filet coudé est permis.
   Noms affichés : Embouteilleuse, Festival, Fête de village, Frigo, Mariage et **Six fûts inox · S18**. Marché de printemps et
   Hotte passent au toucher.
5. Le pinceau commence 4 px plus bas (27 px au lieu de 23). Le titre a de l'air.

### t3b (paysage, rang 2)
- Points 1, 2, 3 et 5 : comme t1b.
- Point 4 : seulement en partie. Les 5 premiers sont nommés dans l'ordre (Embouteilleuse, Festival, Fête, Frigo, Mariage).
  **Six fûts inox · S18 n'a pas de place** : la rangée titre et boutons couvre le ciel jusqu'à environ 350 px, et entre les
  traits il reste 13 px. Il passe donc au toucher, avec Marché et Hotte. Il faudrait plus de hauteur que 120 px pour le nommer.

## Sorties décisives (CONTROLES.txt)
- `controle-entete-cal` :
  - s1b : ENTETE OK (courbe 90, bande 35, en-tête 168, 10 textes).
  - s4b : ENTETE OK (90, 35, 168, 9 textes).
- `controle-entete-cal --paysage` :
  - t1b : ENTETE OK (courbe 70, bande 35, en-tête 120, 12 textes).
  - t3b : ENTETE OK (70, 35, 120, 11 textes).
- `controle-pays-compact` : t1b et t3b, COMPACT OK (médiane 48, hauteurs 24,24,48,48,48,48,72).
- `cap-sb` (contrôle de page v8) : s1b et s4b « ok ». Tout à 0 (petits, hors, chevauchés, sur trait, dans la brosse), le + à
  14 px des onglets, corps identique à r2-c.
- `cap-b` : VUE OK pour les 4. Cela couvre le repos et le défilé (rien sous 14 px, rien hors écran, aucun chevauchement ; le +
  à 14 px, dans le tiers droit, sans rien de la frise dessous) et chacun des 8 toucher (aucun chevauchement, aucune bulle).

## Captures ouvertes
- `so/cap/t1b.png`, `t1b-toucher-25.png` (Six fûts touché : Embouteilleuse et son filet effacés), `t1b-defile.png`
- `so/cap/t3b.png`
- `so/cap/_tete-s4b.png`, `s1b-toucher-25.png`, `s4b-toucher.png` (Mariage touché, sans bulle)

Autres captures : `s1b.png`, `s4b.png`, `s1b-defile.png`, `s4b-defile.png`, `t3b-toucher*.png`, `t3b-defile.png`,
`planche-sb.png`.

## Restes
- **Défilé en paysage** : aucun numéro de semaine visible (doute du critique, non traité).
- **Marge de 52 px** : au défilé, une colonne vide reste à droite, au-dessus du +. C'est le prix d'un + qui ne cache rien.
- **Toucher en portrait** : le montant remplace la semaine. C'est le même geste que dans s1 et s4, jugées.

Prédiction : « Là oui, la frise respire et le + ne cache plus rien ; juste quoi et quand. »

DÉCISION À PRENDRE : pour t3b, « Six fûts inox · S18 » ne se nomme qu'en remontant l'en-tête au-delà de 120 px, ce que
CAL-INFO-TROP interdit. Il est au toucher pour l'instant.
CONNAISSANCE : en paysage, réserver une marge droite de la largeur du + (52 px) suffit à garantir FAB-GAUCHE (« sans cacher de
barre ») à tout défilé, sans bouger le +.
LEÇON PROPOSÉE : un défaut trouvé sur un geste (la bulle qui chevauche) se rejoue sur toutes les versions qui ont ce geste.
Celle du portrait avait le même défaut, que personne n'avait vu ; `cap-b.mjs` touche chaque mouvement et mesure le chevauchement.
