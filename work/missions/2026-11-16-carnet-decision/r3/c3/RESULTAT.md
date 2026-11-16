OK — c3 : scénario de zéro rejoué, pièges frigo et ventilation fermés, COEUR OK

- Fichiers (tous dans `r3/c3`) : `proto.src.html` → `proto.html` (`build.mjs`), `scenario.mjs`, `scenario.log`, `scenario.out`,
  `SCENARIO.md` (étapes, gestes, sélecteurs data-*), `gestes-ra.mjs`, `capt.mjs`, `web.js` (copies de c2), `captures/`
  (69 captures `c3-E*.png`, 18 planches).
- Sorties : `node r3/c3/scenario.mjs` → **COEUR OK (53 étapes, 69 captures)**, aucune erreur de page ;
  `node r3/c3/gestes-ra.mjs` → **GESTES OK** (rien de da ni de ra perdu).
- Défauts du dernier jeu, chacun devenu une assertion de `scenario.mjs` (E19, E20, E21) :
  - Article d'une façon écartée (vitrine, extracteur mural, évier à poser) : fiche « Façon écartée le 16 nov. : … » et son pourquoi,
    sans « Choisir celui-ci » (remplacé par « Revoir les façons ») ; Choisir refuse aussi (`data-garde=facon`).
  - Classé par prix : les articles d'une façon écartée descendent en bas, sans vert ; la 1re ligne est choisissable.
  - Pourquoi contredit (« le plus de fûts » pour 30 contre 38, « le moins cher » pour 4 200 contre 3 100) : Garder refusé,
    « Vos tableaux disent l'inverse : … » sous le champ (`#da-pq-faux`), feuille ouverte ; ni confirmation ni « garder quand même ».
  - « pourquoi chambre froide ? », « pourquoi la hotte ? », « pourquoi sur pieds ? » : réponse par la façon retenue et son pourquoi ;
    « pourquoi pas la vitrine / l'extracteur mural / à poser ? » : par la façon écartée ; aucun fournisseur cité.
  - Pourquoi ce fournisseur (Inox Ventil) : plus de « vos notes : « ventilation salle de brassage » » ; mot entier, hors titre.
  - Ventilation : « Hotte inox » n'est plus une caractéristique ; l'IA propose « Pression disponible » (Pa).
- Captures ouvertes : `captures/planche-10.png` (E19 prix, garde, faux), `planche-11.png` (E19 pourquoi, façon nommée, écartée),
  `planche-13.png`, `planche-14.png` (E20), `planche-17.png` (E21).
- Prédiction : « Là il m'empêche de prendre la vitrine que j'ai écartée, et "pourquoi la hotte" me parle de la hotte ; ok. »

DÉCISION À PRENDRE : un pourquoi contredit par les tableaux est refusé (pas de « garder quand même ») ; si le brasseur a une raison
hors tableaux, il l'écrit autrement. À confirmer au jeu. Restent ouverts de c2 : raisons d'écart gardées d'office ; toast d'IA
sur une ligne de Comparer (E20e, hérité).
CONNAISSANCE : un rapprochement de mots par sous-chaîne (« ventil » dans « ventilation ») cite des notes sans rapport ; comparer des
mots entiers, préfixe court vers long seulement, et exclure les mots du titre du carnet.
LEÇON PROPOSÉE : aucune
