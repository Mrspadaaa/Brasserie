# e9c — Le fil des semaines (ma meilleure)

- Chaleur : **tiède** (forme de l'approche : tout l'atelier sur une frise datée).
- Idée : **Le fil des semaines** — idées, contacts, tâches et marchés sur une même frise.

## L'écran
- Une frise verticale datée (jour et date à gauche, ligne « aujourd'hui · 14.11 ») qui mêle les quatre sections, chacune sa couleur :
  À faire (violet, case de 44 px à cocher), Contacts (bleu, « Appeler »), Bières (ocre, « Passer dans mes recettes »), événements.
- Phrase-réponse : « Marché de Noël : la bière d'hiver n'a pas encore de recette », compte à rebours « dans 28 jours · sam. 12.12 ».
- Filtres en pastilles (Tout, Bières, Tarifs, Contacts, À faire, Matériel ↗) qui défilent de côté ; en bas, « idées sans date 3 »,
  « contacts 2 » : ce qui n'a pas de date ne se perd pas.
- Geste : la feuille « Noter » (type Bière / Tarif / Contact / À faire, titre, style en pastilles, « Brasser avant » au toucher sur
  une rangée de mois) ; c'est la feuille « nouvelle note / piste » de l'écran actuel, sans clavier pour la date.
- Tarifs : un **ticket de caisse** — prix (curseur), − coût de revient (curseur), = marge 3,40 en vert ; lié à un événement
  (« pour : Marché de Noël · 12.12 ») ; « Garder ce tarif » ; les tarifs gardés.
- 1280 : frise à gauche ; à droite, la fiche de l'idée (avancement, « Passer dans mes recettes ») et le ticket. Cave : mêmes aplats,
  textes éclaircis.

## Fonctions gardées ou déplacées
- Gardées : les quatre sections (en filtres), cocher une tâche, appeler un contact, passer en recette, essai de prix, garder un
  tarif, noter (feuille), Gemini (✦ en tête), modifier (toucher une rangée → fiche).
- Déplacées : Matériel en lien vers Rénovation. « Convertir en client » : dans la fiche du contact (non dessinée).

## Causes c3 évitées
- Composition propre (frise). Phrase-réponse avec échéance. Aplats de couleur par section. Boosters : frise, filtres, cases à
  cocher, mois au toucher, curseurs du ticket. Aucune phrase grise d'aide. Le 1280 est pensé en deux colonnes, pas le 390 étiré.

## Écarts assumés
- « Brasser avant » : une date sur une idée de bière (le modèle a déjà `date`, utilisée seulement par À faire) ; à confirmer.
- Lier un tarif à un événement : champ neuf.
- Les filtres débordent à droite (défilement de côté) : six filtres ne tiennent pas en 370 px.

## Données fictives
- Tâches (étiquettes de la Stout cochées le 06.11, commander 300 bouteilles), contact (Café du Midi · Lucie, sans numéro montré),
  marché de Noël du 12.12, idées et prix : **fictifs**. Jours de semaine exacts (14.11.2026 = samedi). Sans TVA supposé.

## Captures
- `e9c-repos-390-clair.png`, `e9c-geste-390-clair.png`, `e9c-tarifs-390-clair.png`, `e9c-repos-390-cave.png`, `e9c-repos-1280-clair.png`.

## Rhabillage à l’identité de l’app (re9, 15.11)
- Trousse chargée (`identite.css`, `chrome.js`) : en-tête, sous-onglets (Atelier actif), barre du bas et + de l’app ; jetons des deux thèmes, Source Sans 3 / IBM Plex Mono, échelle ≤ 28 px, graisse ≤ 700, rayons 10 / 16 / 24.
- Idée, composition, textes et chiffres inchangés. Couleurs de données : sémantique (hop, attention, alert, water), rubriques `--area-*`, bière EBC (pastilles et bouteille, indicatives selon le style), pastilles de style `id-style`.
