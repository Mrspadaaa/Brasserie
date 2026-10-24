# Levure, étape de Dryhopper — Et avec quelle levure ?

Voie p4-dryhopper, 23.10. Fichiers : `index.tsx`, `levure.css` (classes `pq-lev-`), `jeu.mjs`.

## Base

L'étape de Dryhopper de la carte (`fils22-carte/levure-etape`, « Puis la levure »), enrichie de a2b (« voir ce que la
levure change reset vraiment interessant ») et de x3b réduit (« ma bière de base -> 1 dry hop, 2 dry hop: levure »).
Choix encore ouvert du brasseur : étape (ici) ou outil propre (a2b).

- Un seul facteur libre, la levure (D98) : US-05, Pomona, Verdant, Diamond. Houblon, dose, moment (le brouillon de
  Dryhopper) et base sont fixés sur la ligne de contexte.
- « Ajouter à ma bière » inscrit l'ajout (houblon, dose, moment, levure) et revient à Ma bière ; « ‹ » ou « Quand »
  revient à Dryhopper.

## Idées reprises

- Chaque tuile de levure dit déjà ce qu'elle change (Pomona ~+13 agrumes) ; « ? » hachuré quand le moteur n'a pas de
  taux pour elle (Verdant, Diamond : « non documenté », jamais 0).
- La biotransformation se voit (`data-role="biotransformation"`) : géraniol (floral) → citronellol (agrumes), la jauge
  de conversion bas–haut et son centre (Pomona ~50 %, convention H41/H50/H51), lue dans le moteur
  (`biotransfoLevure`).
- La confiance du moteur (moyenne, faible pour Pomona) avec ses raisons au survol.
- Les 5 familles qui bougent (carte), en barres l5b au style. Le rond est ta stout avant Idaho 7, la barre le
  résultat avec la levure choisie, et la valeur l'écart total. Elles sont visibles dès l'arrivée avec US-05 : le
  critique avait rejeté la première version (D4, « pas assez dense », contenu arrêté à 57 % de l'écran).
- Sous chacune, d'où ça vient (a2b) : en plein, ce que le houblon apporte (Idaho 7 avec US-05) ; en rayé, ce que la
  levure ajoute ou retire. Avec Pomona, les agrumes gagnent ~+13 en rayé.
- Toute la simulation est posée sur une carte, comme celle de Dryhopper. Contenu : 0,84 de la hauteur du premier
  écran ; `controle-panel` donne un remplissage de 1,00.
- L'ajout cumulé, x3b réduit (`data-role="ajout"`) : Nugget seul (le résineux goûté le 18.10, vraie valeur), + Idaho 7,
  + la levure : floral, agrumes, résineux.
- « Après fermentation, rien ne change » (carte) quand le moment n'est pas le dry hop actif.

## Écarts

- Pas de tableau a2b complet (cuve, levure, CO₂ en trois colonnes, chiffrés) : l'apport du houblon et l'ajout de la
  levure se lisent en barre pleine et rayée, sans mots (70 mots au plus au premier écran). La colonne CO₂ n'existe
  pas dans l'adaptateur.
- La chaîne x3b ne montre sa troisième colonne que si la levure diffère de US-05 : sinon, elle répète la deuxième.
- Le résineux est au-dessus de l'échelle au style (ta dégustation) : sa barre « d'où ça vient » sort du cadre et ne
  se voit pas. La valeur ~+14 et la barre du dessus le disent.
- Les deux pastilles d'étape (« Quand », « Levure ») sans numéro : 70 mots au plus.

## Pour l'app

- `index.tsx` → `src/ui/hops/HopTiming.tsx`, étape `step: 'yeast'`.
- `biotransfoLevure` est lu dans le moteur : l'adaptateur devrait l'exposer (besoin socle).
- La levure de la recette s'écrit avec l'ajout (Dexie puis Firestore) ; le catalogue des levures vient de l'app.

## Pied « Annuler » (D120, voie p17, 23.10)

- « Pas de bouton cancer » : le pied porte « Annuler » à gauche de « Ajouter à ma bière », 48 px tous deux (pied commun
  `commun/PiedAnnuler.tsx`, même forme sur Substituer, Levure, Dryhopper). Annuler jette le brouillon (la levure
  essayée ne s'inscrit pas) et ramène à l'étape Houblons (`#/ma-biere`, D118). Joué par `jeu.mjs` (Verdant essayée,
  Annuler, recette inchangée) et `controle-annuler.mjs`.
