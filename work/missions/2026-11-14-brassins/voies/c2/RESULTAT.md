REPRISE — voie c2 (Créer un brassin, série v0 n° 2) : 4 maquettes faites, captures en partie à rouvrir, GATES à rejouer

## Cadrage (5 lignes)
1. Il a dit : « Créer : aucune … Ça resoud aucune de mes problématique » (15.11), après e5a–e5d, e5na–e5nd, e5ga–e5gb.
2. On en lit : la question n'était pas « comment saisir recette, volume, date » ; ses problèmes sont les gestes (n° 2), le stock (n° 4), la répercussion (n° 5), l'accès d'ailleurs (n° 6) et le peu de temps (n° 8).
3. Genres : c2a froide = la création montre ses effets, chacun s'annule (genre 7) ; c2b tiède = brasser depuis la ligne de stock (genre 5) ; c2c tiède = brasser maintenant, le brassage crée le brassin (genre 6) ; c2d chaude = la facture appelle le brassin (de mon cru : sa chaîne recette → achat → stock, l.89 et l.1663).
4. Au repos, à 390 : c2a = la liste des recettes, un « Brasser » par carte ; c2b = l'écran Stocks, un bouton bière par ingrédient ; c2c = la page de la Pale Ale, grand bloc noir « Brasser maintenant » et la journée en frise ; c2d = un ticket de facture lu et un tampon « De quoi brasser : NEIPA ».
5. Aucune ne redemande recette, volume et date : un toucher crée, la date reste « à définir » et se règle sur la fiche e1a.

## Fait (agent arrêté par le hook à 200 k)
- Fichiers : `c2a/` à `c2d/` (`etat.html`, `NOTE.md`, 5 PNG chacun, `c2a-repos-1280-clair.png`), `capture.mjs`. Générateur hors OWNS : scratchpad de l'agent `c2-gen.mjs` (les `etat.html` sont statiques, modifiables à la main).
- G2 : `IDENTITE OK 4/4` (dernier passage, après patch2).
- Captures régénérées après patch2 (classe `-go` de c2c séparée en `-lgo` ; geste c2c : bouton puis la journée ; trace c2b en une phrase).
- Captures ouvertes et jugées : toutes c2a (repos, geste, après, vide, cave, 1280), c2b (repos, geste, après, vide, cave), c2c repos et geste (avant patch2), c2d repos et geste (avant patch1).

## Reste à faire (agent neuf)
1. Rejouer G1 et G3 de GATES.md depuis la racine, écrire leurs sorties et celle de G2 dans `tests.txt`.
2. Ouvrir (Read) une fois : `c2c/c2c-apres-390-clair.png` (vérifier que les boutons de carte ne sont plus les grands blocs noirs), `c2c/c2c-geste-390-clair.png`, `c2c/c2c-vide-390-clair.png`, `c2c/c2c-repos-390-cave.png`, `c2d/c2d-repos-390-clair.png`, `c2d/c2d-geste-390-clair.png`, `c2d/c2d-apres-390-clair.png`, `c2d/c2d-vide-390-clair.png`, `c2d/c2d-repos-390-cave.png`.
3. Si un défaut se voit : corriger dans `etat.html` (classes préfixées), relancer `node work/missions/2026-11-14-brassins/voies/c2/capture.mjs c2c c2d`, rejouer G2.
4. Remplacer ce fichier par le RESULTAT final (ligne 1 `OK — …`, les 5 lignes de cadrage ci-dessus, sorties, captures, prédiction).

## Défauts connus, à juger
- c2a après : « Défaire » passe à la ligne sous la trace (mineur).
- c2a 1280 : grille de deux colonnes, bas de l'écran vide.
- c2c : la levure de la Pale Ale n'est pas nommée (e1a, fictive, lui donne un starter « trop tard pour aujourd'hui ») ; dit dans sa NOTE.
- Données fictives listées dans chaque NOTE.md (stock, facture, durées du brassage).

Prédiction : « La facture qui propose la NEIPA, ça c'est malin ; le reste je l'ai déjà vu en partie. »

DÉCISION À PRENDRE : c2c suppose qu'aucun brassin ne naît « prévu » ; à vérifier sur ses brassins réels avant de la montrer (PROBLEMES.md, genre 6).
CONNAISSANCE : aucune
LEÇON PROPOSÉE : un générateur de maquettes qui partage une fonction de liste entre variantes doit préfixer aussi ses classes internes par rôle (`-lgo`), pas seulement par variante : `c2c-go` (bloc héros) et `c2c-go` (bouton de carte) se sont écrasés sans que le contrôle d'identité le voie.
