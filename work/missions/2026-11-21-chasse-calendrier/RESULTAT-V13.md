OK — CHE-1 : « 1 an » ne déplace plus la vue, le message dit où ; CHV-19 : mois de la frise Durée à 12 px, 12:1

Commit `6f55de055` (port-carnet, index temporaire, mes hunks seulement). BUGS.md : CHE-1 et CHV-19 « corrigé », `controle-bugs` → `BUGS OK : 1617 bugs, 147 ouverts` (BUGS.md modifié, non commité : le pilote le range).

## Fichiers (port-carnet)
- `src/components/tabs/CalendrierTab.tsx` : `ajouterDepuisFeuille` (chose au-delà de la dernière semaine du modèle : la vue ne bouge pas, le message ajoute « · posée en nov. 2027, au-delà de l'année affichée ») ; `voirEtendue` (posée par un horizon dans l'année : garde la durée choisie au lieu de tomber à la plus petite).
- `src/ui/calendrier/frise/feuille.css` : `.cal-f-duree-rep small` 11 → 12 px, graisse 500, `--cave-200` → `--cave-100`.
- `scripts/parcours/chaines-calendrier-v13.mjs` (neuf : CH-E1, CH-V19) et 2 lignes dans `chaines.mjs` (import et spread).
- Non touchés : `calendrierAjout.ts`, `FeuilleAjout.tsx`, `DureeFenetre.tsx` (le « S40 2027 » du + suivant venait de la fenêtre déplacée, plus de cause).

## Cause de CHE-1
« 1 an » pose le lundi 15 nov. 2027 = la 53e semaine ; le modèle n'en montre que 52 (dernier lundi 8 nov. 2027). `voirEtendue` cherchait la semaine dans le modèle, ne la trouvait pas, et calait la fenêtre sur les 6 dernières (S40–S45) : à côté de la chose, échelle changée sans ordre. Le + suivant s'ouvrait ensuite sur `fenetre.du`.

## Critères
- `CH-E1` (390, 3 mois) : tour8 ROUGE (« la vue passe de 3 mois à 6 sem. … message : ZZ TEST vente 1:1 · S46 · Annuler ») ; arbre VERT (« vue 3 mois, chose dite par le message, + suivant sur cette semaine »).
- `CH-V19` (cave et clair, 390) : tour8 ROUGE (« nov. » en 11 px, deux thèmes) ; arbre VERT (cave 12 px, 12,25:1 ; clair 12 px, 12,63:1).
- Captures ouvertes : `CH-E1-2-apres.png` (vue « 3 mois », message lisible en bas), `CH-V19-cave.png`, `CH-V19-clair.png`, `CH-E1-3-plus-suivant.png` (Achats sur « cette semaine S47 »), dans `%TEMP%/v13/vert`.
- `tsc --noEmit` propre ; vitest `calendrier-onglet`, `calendrierAjout`, `calendrierEchelle` : 70 verts.
- Essais : 1 par critère côté code ; le banc CH-E1 a demandé une correction de lecture du message (`role=status`).

## Doutes et limites
- Le message ne porte pas de « Voir » : une chose posée à plus de 52 semaines n'a aucun écran dans le Calendrier (ni frise, ni liste). Le contrôle accepte le message seul. Elle existe dans les données (Finances la lit).
- CH-E1 ne joue que 390 / 3 mois / clair ; l'échelle gardée pour un horizon dans l'année (6 mois posé depuis « 3 mois ») est reprise du test d'intégration existant (D404, 70 verts) mais n'a pas son étape Chrome.
- La vue « 6 mois » posée depuis « 6 sem. » étend toujours à la plus petite durée qui contient la chose (inchangé, D404).

DÉCISION À PRENDRE : afficher les choses au-delà de 52 semaines ? Options : (a) rien (message seul, état actuel) ; (b) un cran « Plus tard » dans la liste ; (c) horizon « 1 an » posé sur la dernière semaine affichée. Recommandation : (a), puis demander au brasseur si « 1 an » doit rester dans la feuille du Calendrier.

CONNAISSANCE : le Calendrier montre 52 semaines depuis la semaine en cours ; l'horizon « 1 an » tombe sur la 53e (lundi + 52 semaines), donc toujours hors du modèle.
LEÇON PROPOSÉE : aucune
