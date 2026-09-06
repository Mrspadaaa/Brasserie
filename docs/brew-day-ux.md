# Refonte du jour de brassage

## Le besoin à la cuve

Le brasseur ne relit pas une recette comme un document. Il alterne préparation,
action, attente et contrôle, parfois en parallèle. Un téléphone posé près de la
cuve doit répondre à quatre questions : quoi faire, quoi verser et combien,
quand intervenir, puis quoi conclure d'une mesure. Le journal doit permettre de
reproduire le brassin et de comprendre un écart après coup.

La préparation n'est pas un ajout : peser les houblons ne signifie pas les
avoir versés. La navigation n'est pas une validation : consulter le rinçage ne
doit pas terminer le palier ni couper son horloge. Une consigne n'est pas une
mesure : aucun relevé ne sera inventé pour remplir l'écran.

| Moment | Besoin immédiat | Retour attendu |
| --- | --- | --- |
| Préparation | Volumes réseau / osmosée, sels et acides par eau, grains, balance et moulin | Doses avec unités, différence prévu / réel, préparatifs cochés |
| Empâtage | Température de la maische, durée du palier, grains, rinçage à anticiper | Horloge lancée à température atteinte, pH refroidi, dernier relevé et écart |
| Avant ébullition | Volume et densité du même moût | Rendement si calculable, distinction volume chaud / volume à 20 °C |
| Ébullition | Une horloge commune, prochains ajouts et doses | Minutes avant la fin, heure attendue, ajouts déjà faits et retards visibles |
| Whirlpool | Température et temps de contact, produits correspondants | Départ volontaire à la consigne, aucune confusion avec les ajouts d'ébullition |
| Refroidissement / transfert | Fermenteur prêt, température, levure, OG et volume | Mesuré / cible, récapitulatif avant clôture |
| Après brassage | Histoire réelle du brassin | Fil chronologique filtrable : mesures, notes, ajouts, étapes ; export complet |

Les instructions de processus rejoignent les points de contrôle décrits dans
[le parcours de brassage Brewfather](https://docs.brewfather.app/getting-started/your-first-batch)
et [les conseils de brassage Grainfather](https://grainfather.com/hints-and-tips-for-grainfather-mastery-part-2/).
Les calculs chimiques, les garde-fous pH et les corrections métrologiques
existants sont réutilisés ; la refonte ne remplace pas ces modèles.

## Direction visuelle avant réalisation

- Palette conservée : fond malt #12100E, surface #1A1613, bordure #3D342E,
  texte #F5F0EA, action paille #F2C14E. Le vert houblon signifie une action
  confirmée ; le bleu identifie l'eau. Aucun décor photographique à la cuve.
- Source Sans 3 pour les noms, instructions et navigation. IBM Plex Mono
  uniquement pour les mesures et l'horloge. Valeurs et unités toujours ensemble.
- Une station centrale lisible, avec une colonne de contrôle sur grand écran.
  Sur téléphone : une colonne, phases sur une ligne, navigation de consultation
  distincte, actions « Mesurer », « Note » et action d'étape fixées en bas.
  Le contenu reste aligné à gauche. Aucune accroche promotionnelle.
- L'élément fort est le couple consigne / horloge. Les ingrédients sont des
  lignes regroupées par usage, pas une collection de petites cartes équivalentes.
- Les options (durée, remplacement, alarmes, conseil) ne rivalisent pas avec
  l'action en cours. Noms longs sans troncature, zones tactiles de 44–48 px,
  saisie décimale, focus visible et respect des mouvements réduits.

```text
Téléphone                         Bureau
recette / lot / outils            recette / lot / outils
conduite | recette | journal      consultation et phases
préparer > empâter > bouillir      ┌──────────────────┬────────────────┐
étape et instruction              │ étape, consigne  │ mesures        │
consigne + horloge                │ horloge          │ préparatifs    │
ingrédients du moment             │ ingrédients      │ carnet         │
relevés / préparatifs             │ du moment        │                │
mesurer | note | action           └──────────────────┴────────────────┘
```

Relecture du parti pris : le fond sombre et le jaune viennent de l'identité
existante. Ils ne justifient ni halo, ni chiffres décoratifs, ni cartes répétées.
Le temps ne prend la place centrale que lorsqu'un vrai minuteur existe. En
préparation, les volumes et les produits prennent cette place.

## Vérification prévue

Parcours sur recette du banc local : préparation, ajouts, palier démarré et
mis en pause, navigation parallèle, mesure, note, journal et clôture.
Captures à 390 px et sur bureau, contrôle à 320 px et en paysage, absence de
débordement horizontal et maintien du focus pendant les ticks. Tests métier
existants, nouveaux tests des interactions et compilation de production.

## Résultat vérifié en local

- Trois dispositions ont été comparées sur la même recette de démonstration,
  à 390 × 844 px. La version retenue affiche la dose et sa case d'ajout sur une
  ligne ; toucher la dose ouvre son réglage. Les sous-étapes utilisent un
  bouton ouvrant une liste tactile, sans rangée supplémentaire de boutons.

| Disposition | Première dose depuis le haut | Ingrédients entièrement visibles |
| --- | ---: | ---: |
| Première itération | 661 px | 1 |
| Variante compacte | 507 px | 2 |
| Variante centrée sur les produits | 439 px | 3 |
| Version finale avec menus tactiles | 418 px | 3 |

- Conduite mobile avec action persistante en bas et reprise du palier consulté.
- Eaux, concassage, premier moût, ébullition, whirlpool et levure présentés au
  moment utile. La vue Recette garde la liste complète.
- Doses avec unités, précision au gramme pour les kilogrammes, écart à la recette
  et heure réelle de confirmation. Dose et unité accessibles au lecteur d'écran.
- Mesures et notes ouvertes depuis le pied, avec fermeture sans perte du
  brouillon. Les mesures inachevées restent associées à leur palier ; une note
  garde l'étape où elle a été commencée. Les relevés enregistrés restent lisibles
  dans la conduite, avec les mêmes garde-fous pH que le formulaire.
- Champs en ligne sur bureau ; panneaux défilants au-dessus du clavier sur
  téléphone. Échap ferme la saisie et rend le focus à son bouton. Les ticks du
  minuteur ne perturbent ni le focus ni une décimale inachevée.
- Arrêt anticipé d'un minuteur et clôture du brassage explicitement confirmés.
  L'étape suivante reste à démarrer. En paysage, température et horloge restent
  visibles au-dessus du pied même avec un autre minuteur actif.
- Journal filtrable et export intégral, même lorsqu'un filtre est actif.
  Les heures de validation sont fiables ; le départ technique d'un palier,
  déplacé lors des pauses, n'est pas présenté comme un événement historique.
- 49 fichiers de tests, 1 533 tests passés, dont 13 tests du nouveau parcours
  et 5 tests du cycle sonore (regroupement, arrêt, mode muet, sortie, réarmement).
  Compilation de production réussie. Vite signale la taille du bundle principal.
- Parcours Chrome automatisé à 390 × 844, 320 × 740, 844 × 390 et 1 440 × 1 050,
  22 captures inspectées et 28 contrôles de disposition. Aucun débordement
  horizontal du contenu ni erreur JavaScript. Cibles tactiles contrôlées à
  44 px minimum, confirmations incluses. Clavier simulé de 300 px pour la
  mesure et l'ajustement d'une dose ; validation sur appareil physique distincte.

## Ajustement des menus, badges et sonnerie

Les sélecteurs d'étape et de produit sont des dialogues avec des lignes de
64 px minimum, noms complets, état sélectionné et fermeture explicite. La liste
des sels/acides défile sans sélectionner au glissement et permet une recherche.
Le panneau reste au-dessus du clavier sur téléphone et se centre sur bureau.
Les concentrations d'acide sont présentées comme des choix radio de pleine largeur.

Les badges vert, jaune, corail et bleu portent aussi un texte et une icône : la
couleur ne constitue pas le seul retour. Seul le minuteur actif reçoit un anneau
tournant ; la préférence système de réduction des animations est respectée.

La sonnerie dure 30 secondes, avec deux notes alternées plus fortes. L'arrêt
reste disponible dans le bandeau, avec l'action attendue. Il coupe le signal
sans terminer le palier ni cocher les produits. Les échéances simultanées ne
superposent pas les sons ; une nouvelle échéance peut sonner après l'arrêt.

Le contrôle `node scripts/check-brew-controls.mjs` ajoute 12 captures inspectées
et 12 contrôles de disposition, à 320 et 390 px, en paysage, sur bureau et
avec clavier simulé. Navigation au clavier, restitution du focus, glissement
tactile, recherche, choix d'acide, badges et véritable échéance sont vérifiés.
Le rendu audio hors ligne confirme une dernière impulsion audible à 29,67 s,
les fréquences 880 et 1 175 Hz, un signal sans écrêtage et le silence après arrêt.
Chrome est muet pendant ce test : le niveau acoustique sur téléphone physique
n'est pas mesuré. Captures et rapport : `.codex-remote-attachments/brew-controls/`.

Rejouer les contrôles visuels : démarrer Vite sur le port 3007, puis exécuter
`node scripts/check-brew-workspace.mjs`. Les captures et le rapport sont écrits
dans `.codex-remote-attachments/brew-ux-v2/` (hors Git). `CHROME_PATH`,
`BREW_PREVIEW_URL` et `BREW_CAPTURE_DIR` permettent de changer le navigateur,
le port ou le dossier de sortie. Les comparaisons sont conservées dans
`.codex-remote-attachments/brew-ux-comparison/`.
Ce banc utilise uniquement la recette de démonstration existante. Les alarmes
Android en arrière-plan restent à valider sur le téléphone réel, comme décrit
dans [la documentation du compagnon](brew-day-helper.md).
