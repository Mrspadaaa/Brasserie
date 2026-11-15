# Captures sombre et 1280 — concepts v0 (10.11)

Méthode : puppeteer-core, Chrome sans écran, `file://…/index.html?theme=sombre` (390×844 à l'échelle 2, tactile, `prefers-color-scheme: dark`) et `?theme=clair` (1280×800 à l'échelle 1, viewport seul). Onglet ouvert par défaut : pour chaque page, `etat` absent ou différent de `ferme`. Contrôle DOM : `theme` = dark pour les sombres, classe `-open` (f1) ou `data-open="1"` (f3) présente, pas de débordement horizontal, aucune erreur JS. Chaque PNG a été ouvert et regardé. Les captures f2 existaient : non refaites, revues.

Aucun index.html ni NOTE.md touché. Captures neuves : f1a à f1e et f3a à f3e, en `-sombre.png` et `-1280.png` (20 fichiers).

Limite : tailles de texte non mesurées (jugement à l'œil sur capture). Les polices Google peuvent manquer hors ligne : repli système visible.

| Concept | Capture | Fait / défaut vu |
|---|---|---|
| f1a | sombre, 1280 | Fait. Onglet « maintenant / Après » ouvert. Défaut : libellés d'axe petits à 1280 (à mesurer). |
| f1b | sombre, 1280 | Fait. « Ce malt dans mon mois » ouvert. Défaut : panneau étroit à 1280, chiffres petits. |
| f1c | sombre, 1280 | Fait. « Mon mois, avant · après » ouvert. Défaut : légende avant/après petite à 1280. |
| f1d | sombre, 1280 | Fait. Carte « Mon mois » avec bascule Avant/Après. Défaut : barre basse (« Mon mois » + Enregistrer) serrée à 1280. |
| f1e | sombre, 1280 | Fait. Tuiles payé/à payer/dépensé et graphe ouverts. Défaut : tuiles et textes petits à 1280. |
| f2a | sombre, 1280 | Fait (existant, revu). Vue graphe plein écran, barre « Saisie | Finances ». Aucun défaut vu. |
| f2b | sombre, 1280 | Fait (existant, revu). Feuille « Brassage 186,80 → 245,20 ». Défaut à 1280 : feuille coupée sous le bas, légende avant/après masquée par la barre Enregistrer. |
| f2c | sombre, 1280 | Fait (existant, revu). Feuille « Solde après cette dépense ». Défaut : libellés du graphe petits à 1280. |
| f2d | sombre, 1280 | Fait (existant, revu). Feuille « Payée ou à payer ? ». Défaut à 1280 : feuille étroite à droite, texte petit. |
| f2e | sombre, 1280 | Fait (existant, revu). « Entré et dépensé, ce mois » ouvert. Aucun défaut bloquant ; « Matériel » au bord droit à 1280. |
| f3a | sombre, 1280 | Fait. « Ce que la pièce change » ouvert. Défaut : panneau étroit à 1280, libellés de barres petits. |
| f3b | sombre, 1280 | Fait. « Le mois, en anneaux » ouvert. Défaut : légende d'anneaux petite à 1280. |
| f3c | sombre, 1280 | Fait. « Novembre, avec cette pièce » ouvert, onglet latéral « Finances ». Aucun défaut bloquant vu. |
| f3d | sombre, 1280 | Fait. « Avant, la pièce, après » ouvert. Défaut : libellés « Fixes » et « Brassage » petits à 1280. |
| f3e | sombre, 1280 | Fait. « Le mois, à plat » ouvert. Aucun défaut bloquant vu ; légende petite à 1280. |

Bilan : 15 concepts, 30 captures présentes. Aucun débordement horizontal, aucune erreur JS. Défauts vus : texte petit à 1280 (presque tous) ; f2b, légende masquée par la barre du bas. Le contraste en sombre est lisible sur toutes les captures.
